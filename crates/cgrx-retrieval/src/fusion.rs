use crate::graph::{CandidateProvenance, GraphDocument, SnapshotView};
use crate::{bm25, exact};
use cgrx_core::{QueryRequest, RelationKind, Scope};
use cgrx_languages::Span;
use std::collections::{BTreeMap, BTreeSet};
use std::fmt;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct FusionProfile {
    pub rrf_k: u32,
    pub exact_weight: u32,
    pub bm25_weight: u32,
    pub graph_weight: u32,
    pub max_candidates: usize,
}

impl Default for FusionProfile {
    fn default() -> Self {
        Self {
            rrf_k: 60,
            exact_weight: 4,
            bm25_weight: 1,
            graph_weight: 2,
            max_candidates: 50,
        }
    }
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct ScoreComponents {
    pub exact: u64,
    pub bm25: u64,
    pub graph: u64,
    pub rrf: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Candidate {
    pub node_id: u64,
    pub qualified_name: String,
    pub path: String,
    pub span: Span,
    pub provenance: CandidateProvenance,
    pub semantic_fingerprint: Option<String>,
    pub scores: ScoreComponents,
    pub selection_reason: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Uncertainty {
    TraversalTruncated {
        max_depth: u8,
        remaining_frontier: usize,
    },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CandidateSet {
    pub candidates: Vec<Candidate>,
    pub uncertainties: Vec<Uncertainty>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RetrievalError {
    ExactIndex(String),
}

impl fmt::Display for RetrievalError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ExactIndex(message) => write!(formatter, "exact index failed: {message}"),
        }
    }
}

impl std::error::Error for RetrievalError {}

#[derive(Clone, Copy, Debug, Default)]
pub struct RetrievalEngine {
    profile: FusionProfile,
}

impl RetrievalEngine {
    #[must_use]
    pub const fn new(profile: FusionProfile) -> Self {
        Self { profile }
    }

    pub fn retrieve(
        &self,
        request: &QueryRequest,
        view: &SnapshotView<'_>,
    ) -> Result<CandidateSet, RetrievalError> {
        let documents: Vec<_> = view
            .documents()
            .into_iter()
            .filter(|document| path_in_scope(&document.path, &request.scope))
            .collect();
        let exact_hits =
            exact::rank(&request.task, &documents).map_err(RetrievalError::ExactIndex)?;
        let bm25_hits = bm25::rank(&request.task, &documents);
        let roots: Vec<_> = if exact_hits.is_empty() {
            bm25_hits.iter().take(4).map(|hit| hit.node_id).collect()
        } else {
            exact_hits.iter().map(|hit| hit.node_id).collect()
        };
        let (graph_hits, uncertainties) = graph_rank(
            &roots,
            &documents,
            view,
            &request.scope.relation_kinds,
            request.scope.max_depth,
        );
        Ok(fuse(
            &documents,
            &exact_hits,
            &bm25_hits,
            &graph_hits,
            uncertainties,
            self.profile,
        ))
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) struct LaneHit {
    pub node_id: u64,
    pub raw_score: u64,
}

fn fuse(
    documents: &[GraphDocument],
    exact: &[LaneHit],
    bm25: &[LaneHit],
    graph: &[LaneHit],
    uncertainties: Vec<Uncertainty>,
    profile: FusionProfile,
) -> CandidateSet {
    let by_id: BTreeMap<_, _> = documents.iter().map(|doc| (doc.node_id, doc)).collect();
    let mut scores = BTreeMap::<u64, ScoreComponents>::new();
    let mut reasons = BTreeMap::<u64, BTreeSet<&'static str>>::new();
    add_lane(
        exact,
        profile.exact_weight,
        profile.rrf_k,
        &mut scores,
        &mut reasons,
        "exact_qualified_name",
        |score, value| score.exact = value,
    );
    add_lane(
        bm25,
        profile.bm25_weight,
        profile.rrf_k,
        &mut scores,
        &mut reasons,
        "bm25_text",
        |score, value| score.bm25 = value,
    );
    add_lane(
        graph,
        profile.graph_weight,
        profile.rrf_k,
        &mut scores,
        &mut reasons,
        "bounded_graph",
        |score, value| score.graph = value,
    );
    let mut candidates: Vec<_> = scores
        .into_iter()
        .filter_map(|(node_id, scores)| {
            let document = by_id.get(&node_id)?;
            Some(Candidate {
                node_id,
                semantic_fingerprint: None,
                qualified_name: document.qualified_name.clone(),
                path: document.path.clone(),
                span: document.span,
                provenance: document.provenance,
                scores,
                selection_reason: reasons[&node_id]
                    .iter()
                    .copied()
                    .collect::<Vec<_>>()
                    .join("+"),
            })
        })
        .collect();
    candidates.sort_by(|left, right| {
        right
            .scores
            .rrf
            .cmp(&left.scores.rrf)
            .then_with(|| right.scores.exact.cmp(&left.scores.exact))
            .then_with(|| right.scores.bm25.cmp(&left.scores.bm25))
            .then_with(|| right.scores.graph.cmp(&left.scores.graph))
            .then_with(|| left.path.cmp(&right.path))
            .then_with(|| left.node_id.cmp(&right.node_id))
    });
    candidates.truncate(profile.max_candidates);
    CandidateSet {
        candidates,
        uncertainties,
    }
}

fn add_lane<F: Fn(&mut ScoreComponents, u64)>(
    hits: &[LaneHit],
    weight: u32,
    rrf_k: u32,
    scores: &mut BTreeMap<u64, ScoreComponents>,
    reasons: &mut BTreeMap<u64, BTreeSet<&'static str>>,
    reason: &'static str,
    assign: F,
) {
    for (offset, hit) in hits.iter().enumerate() {
        let score = scores.entry(hit.node_id).or_default();
        assign(score, hit.raw_score);
        score.rrf += u64::from(weight) * 1_000_000 / u64::from(rrf_k + offset as u32 + 1);
        reasons.entry(hit.node_id).or_default().insert(reason);
    }
}

fn graph_rank(
    roots: &[u64],
    documents: &[GraphDocument],
    view: &SnapshotView<'_>,
    kinds: &[RelationKind],
    max_depth: u8,
) -> (Vec<LaneHit>, Vec<Uncertainty>) {
    let by_id: BTreeMap<_, _> = documents.iter().map(|doc| (doc.node_id, doc)).collect();
    let allowed: BTreeSet<_> = kinds.iter().copied().map(relation_code).collect();
    let mut adjacency = BTreeMap::<u64, Vec<u64>>::new();
    for arc in view.definitive_arcs() {
        if allowed.contains(&relation_code(arc.kind)) {
            adjacency.entry(arc.source).or_default().push(arc.target);
        }
    }
    for values in adjacency.values_mut() {
        values.sort_by_key(|node_id| {
            by_id
                .get(node_id)
                .map_or((u64::MAX, *node_id), |doc| (path_id(&doc.path), *node_id))
        });
        values.dedup();
    }
    let mut visited: BTreeSet<_> = roots.iter().copied().collect();
    let mut frontier: Vec<_> = roots.to_vec();
    frontier.sort();
    let mut hits = Vec::new();
    for hop in 1..=max_depth {
        let mut next = Vec::new();
        for source in &frontier {
            for target in adjacency.get(source).into_iter().flatten() {
                if by_id.contains_key(target) && visited.insert(*target) {
                    next.push(*target);
                }
            }
        }
        next.sort_by_key(|node_id| (path_id(&by_id[node_id].path), *node_id));
        for node_id in &next {
            hits.push(LaneHit {
                node_id: *node_id,
                raw_score: 1_000_000 / u64::from(hop),
            });
        }
        frontier = next;
        if frontier.is_empty() {
            break;
        }
    }
    let remaining: BTreeSet<_> = frontier
        .iter()
        .flat_map(|source| adjacency.get(source).into_iter().flatten().copied())
        .filter(|target| by_id.contains_key(target) && !visited.contains(target))
        .collect();
    let uncertainties = if remaining.is_empty() {
        Vec::new()
    } else {
        vec![Uncertainty::TraversalTruncated {
            max_depth,
            remaining_frontier: remaining.len(),
        }]
    };
    (hits, uncertainties)
}

const fn relation_code(kind: RelationKind) -> u8 {
    match kind {
        RelationKind::Calls => 0,
        RelationKind::Implements => 1,
    }
}

fn path_id(path: &str) -> u64 {
    let digest = blake3::hash(path.as_bytes());
    let mut bytes = [0_u8; 8];
    bytes.copy_from_slice(&digest.as_bytes()[..8]);
    u64::from_le_bytes(bytes)
}

#[must_use]
pub fn path_in_scope(path: &str, scope: &Scope) -> bool {
    let included = scope.include.is_empty()
        || scope
            .include
            .iter()
            .any(|pattern| path_matches(path, pattern));
    included
        && !scope
            .exclude
            .iter()
            .any(|pattern| path_matches(path, pattern))
}

fn path_matches(path: &str, pattern: &str) -> bool {
    // Literal scopes select an exact path or its descendants, at a segment
    // boundary. Keep wildcard matching separate so `src/*` stays one level.
    let mut pattern = pattern;
    while let Some(relative) = pattern.strip_prefix("./") {
        pattern = relative;
        if pattern.is_empty() {
            return true;
        }
    }
    if pattern == "." {
        return true;
    }
    if !pattern.contains(['*', '?']) {
        let prefix = pattern.trim_end_matches('/');
        return !prefix.is_empty()
            && (path == prefix
                || path
                    .strip_prefix(prefix)
                    .is_some_and(|rest| rest.starts_with('/')));
    }

    fn matches(
        path: &[char],
        pattern: &[char],
        path_at: usize,
        pattern_at: usize,
        memo: &mut BTreeMap<(usize, usize), bool>,
    ) -> bool {
        if let Some(result) = memo.get(&(path_at, pattern_at)) {
            return *result;
        }
        let result = if pattern_at == pattern.len() {
            path_at == path.len()
        } else if pattern[pattern_at] == '*' {
            let recursive = pattern.get(pattern_at + 1) == Some(&'*');
            let next_pattern = pattern_at + if recursive { 2 } else { 1 };
            let zero_directories = recursive
                && pattern.get(next_pattern) == Some(&'/')
                && matches(path, pattern, path_at, next_pattern + 1, memo);
            zero_directories
                || matches(path, pattern, path_at, next_pattern, memo)
                || (path_at < path.len()
                    && (recursive || path[path_at] != '/')
                    && matches(path, pattern, path_at + 1, pattern_at, memo))
        } else if path_at < path.len()
            && (pattern[pattern_at] == '?' && path[path_at] != '/'
                || pattern[pattern_at] == path[path_at])
        {
            matches(path, pattern, path_at + 1, pattern_at + 1, memo)
        } else {
            false
        };
        memo.insert((path_at, pattern_at), result);
        result
    }

    matches(
        &path.chars().collect::<Vec<_>>(),
        &pattern.chars().collect::<Vec<_>>(),
        0,
        0,
        &mut BTreeMap::new(),
    )
}
