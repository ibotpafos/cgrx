mod strategies;

use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, RwLock};
use std::thread;

use cgrx_core::{Hash32, RelationKind, RepoSnapshot, Scope};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use super::scan_helpers::syntax_document;
use super::{
    Runtime, RuntimeError, StoredArc, StoredDocument, StoredIndex, coverage_for_scope,
    coverage_gap_count, coverage_gap_page, definitive_stored_arcs, pack_for_path, path_in_scope,
};

const MIN_BODY_TOKENS: usize = 8;
const SHINGLE_WIDTH: usize = 4;
const DEFAULT_DOCUMENT_LIMIT: usize = 20_000;
const DEFAULT_PAIR_LIMIT: usize = 100_000;
const DEFAULT_EVIDENCE_LIMIT: usize = 2_000;
const SIMILARITY_INDEX_VERSION: u16 = 2;
const BACKGROUND_DOCUMENT_LIMIT: usize = 100_000;
const BACKGROUND_PAIR_LIMIT: usize = DEFAULT_PAIR_LIMIT;
const BACKGROUND_FUNCTIONAL_PAIR_LIMIT: usize = 50_000;
const RELATED_SCORE_FLOOR: u16 = 600;
const RELATED_SHINGLE_FLOOR: u16 = 650;

#[derive(Clone, Debug, Eq, PartialEq)]
struct RefactorFingerprint {
    tokens: BTreeSet<String>,
    shingles: BTreeSet<String>,
    outgoing: BTreeSet<(RelationKind, u64)>,
    token_count: usize,
    eligible: bool,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
struct Similarity {
    body_tokens: u16,
    ordered_shingles: u16,
    callees: u16,
    size: u16,
    total: u16,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
struct SimilarityDocument {
    node_id: u64,
    language: String,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
struct SimilarityPair {
    left_node_id: u64,
    right_node_id: u64,
    basis: Similarity,
}

#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
pub(super) struct SimilarityIndex {
    version: u16,
    documents_total: usize,
    inspected_pairs: usize,
    #[serde(default)]
    functional_inspected_pairs: usize,
    documents_truncated: bool,
    pairs_truncated: bool,
    #[serde(default)]
    functional_pairs_truncated: bool,
    documents: Vec<SimilarityDocument>,
    exact_groups: BTreeMap<String, Vec<u64>>,
    pairs: Vec<SimilarityPair>,
    #[serde(default)]
    functional_pairs: Vec<SimilarityPair>,
}

#[derive(Clone)]
struct SimilaritySourceDocument {
    node_id: u64,
    path: String,
    search_text: String,
    semantic_fingerprint: Option<String>,
    span_start: usize,
    span_end: usize,
}

struct SimilarityBuildInput {
    documents: Vec<SimilaritySourceDocument>,
    arcs: Vec<StoredArc>,
    path_hashes: BTreeMap<String, Hash32>,
}

impl SimilarityBuildInput {
    fn from_stored(stored: &StoredIndex) -> Self {
        let documents = stored
            .documents
            .iter()
            .filter(|document| document.provenance == "SYNTAX")
            .map(|document| SimilaritySourceDocument {
                node_id: document.node_id,
                path: document.path.clone(),
                search_text: document.search_text.clone(),
                semantic_fingerprint: document.semantic_fingerprint.clone(),
                span_start: document.span_start,
                span_end: document.span_end,
            })
            .collect::<Vec<_>>();
        let arcs = stored
            .arcs
            .iter()
            .filter(|arc| matches!(arc.kind, RelationKind::Calls | RelationKind::Implements))
            .cloned()
            .collect::<Vec<_>>();
        let evidence_paths = arcs
            .iter()
            .filter_map(|arc| arc.evidence.as_ref().map(|evidence| evidence.path.as_str()))
            .collect::<BTreeSet<_>>();
        let path_hashes = evidence_paths
            .into_iter()
            .filter_map(|path| {
                stored
                    .path_hashes
                    .get(path)
                    .copied()
                    .map(|hash| (path.to_owned(), hash))
            })
            .collect();
        Self {
            documents,
            arcs,
            path_hashes,
        }
    }
}

struct SimilarityBackgroundState {
    snapshot: RepoSnapshot,
    index: Option<Arc<SimilarityIndex>>,
    building: bool,
    spawn_failed: bool,
}

struct SimilarityBackgroundShared {
    epoch: AtomicU64,
    state: RwLock<SimilarityBackgroundState>,
}

pub(super) struct SimilarityBackground {
    shared: Arc<SimilarityBackgroundShared>,
}

impl SimilarityBackground {
    pub(super) fn ready(snapshot: RepoSnapshot, index: SimilarityIndex) -> Self {
        Self {
            shared: Arc::new(SimilarityBackgroundShared {
                epoch: AtomicU64::new(0),
                state: RwLock::new(SimilarityBackgroundState {
                    snapshot,
                    index: index.is_current().then(|| Arc::new(index)),
                    building: false,
                    spawn_failed: false,
                }),
            }),
        }
    }

    fn read_state(&self) -> std::sync::RwLockReadGuard<'_, SimilarityBackgroundState> {
        self.shared
            .state
            .read()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    fn write_state(&self) -> std::sync::RwLockWriteGuard<'_, SimilarityBackgroundState> {
        self.shared
            .state
            .write()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    fn ready_index(&self, snapshot: &RepoSnapshot) -> Option<Arc<SimilarityIndex>> {
        let state = self.read_state();
        (state.snapshot == *snapshot)
            .then(|| state.index.clone())
            .flatten()
            .filter(|index| index.is_current())
    }

    fn status_json(&self, snapshot: &RepoSnapshot, used: bool) -> Value {
        let state = self.read_state();
        let current = state.snapshot == *snapshot;
        let mut status = if current {
            state.index.as_deref().map_or_else(
                || SimilarityIndex::default().status_json(false),
                |index| index.status_json(used),
            )
        } else {
            SimilarityIndex::default().status_json(false)
        };
        status["background"] = true.into();
        status["building"] = (current && state.building).into();
        status["spawn_failed"] = (current && state.spawn_failed).into();
        status
    }

    fn schedule(&self, snapshot: RepoSnapshot, input: SimilarityBuildInput) {
        let epoch = self.shared.epoch.fetch_add(1, Ordering::AcqRel) + 1;
        {
            let mut state = self.write_state();
            state.snapshot = snapshot.clone();
            state.index = None;
            state.building = true;
            state.spawn_failed = false;
        }
        let shared = Arc::clone(&self.shared);
        let worker_snapshot = snapshot.clone();
        let spawn = thread::Builder::new()
            .name("cgrx-similarity-index".to_owned())
            .spawn(move || {
                let index = build_similarity_index_from_input(&input);
                if shared.epoch.load(Ordering::Acquire) != epoch {
                    return;
                }
                let mut state = shared
                    .state
                    .write()
                    .unwrap_or_else(std::sync::PoisonError::into_inner);
                if state.snapshot != worker_snapshot
                    || shared.epoch.load(Ordering::Acquire) != epoch
                {
                    return;
                }
                state.index = Some(Arc::new(index));
                state.building = false;
                state.spawn_failed = false;
            });
        if spawn.is_err() {
            let mut state = self.write_state();
            if state.snapshot == snapshot && self.shared.epoch.load(Ordering::Acquire) == epoch {
                state.building = false;
                state.spawn_failed = true;
            }
        }
    }
}

impl SimilarityIndex {
    pub(super) const fn is_current(&self) -> bool {
        self.version == SIMILARITY_INDEX_VERSION
    }

    fn is_complete(&self) -> bool {
        self.is_current() && !self.documents_truncated && !self.pairs_truncated
    }

    fn related_complete(&self) -> bool {
        self.is_complete() && !self.functional_pairs_truncated
    }

    fn status_json(&self, used: bool) -> Value {
        json!({
            "version":self.version,
            "ready":self.is_current(),
            "complete":self.is_complete(),
            "used":used,
            "documents":self.documents.len(),
            "documents_total":self.documents_total,
            "pairs":self.pairs.len(),
            "inspected_pairs":self.inspected_pairs,
            "functional_pairs":self.functional_pairs.len(),
            "functional_inspected_pairs":self.functional_inspected_pairs,
            "documents_truncated":self.documents_truncated,
            "pairs_truncated":self.pairs_truncated,
            "functional_pairs_truncated":self.functional_pairs_truncated
        })
    }
}

fn normalized_tokens(source: &str) -> Vec<String> {
    let chars = source.chars().collect::<Vec<_>>();
    let mut tokens = Vec::new();
    let mut index = 0;

    while index < chars.len() {
        let current = chars[index];
        let next = chars.get(index + 1).copied();

        if current.is_whitespace() {
            index += 1;
            continue;
        }
        if current == '/' && next == Some('/') {
            index += 2;
            while index < chars.len() && chars[index] != '\n' {
                index += 1;
            }
            continue;
        }
        if current == '/' && next == Some('*') {
            index += 2;
            while index + 1 < chars.len() && !(chars[index] == '*' && chars[index + 1] == '/') {
                index += 1;
            }
            index = (index + 2).min(chars.len());
            continue;
        }
        if current == '#' && next != Some('[') && (index == 0 || chars[index - 1].is_whitespace()) {
            index += 1;
            while index < chars.len() && chars[index] != '\n' {
                index += 1;
            }
            continue;
        }
        if matches!(current, '\'' | '"' | '`') {
            let delimiter = current;
            index += 1;
            while index < chars.len() {
                if chars[index] == '\\' {
                    index = (index + 2).min(chars.len());
                } else if chars[index] == delimiter {
                    index += 1;
                    break;
                } else {
                    index += 1;
                }
            }
            tokens.push("lit".to_owned());
            continue;
        }
        if current.is_ascii_digit() {
            index += 1;
            while index < chars.len()
                && (chars[index].is_ascii_alphanumeric()
                    || matches!(chars[index], '.' | '_' | '+' | '-'))
            {
                index += 1;
            }
            tokens.push("lit".to_owned());
            continue;
        }
        if is_identifier_start(current) {
            let start = index;
            index += 1;
            while index < chars.len() && is_identifier_continue(chars[index]) {
                index += 1;
            }
            let word = chars[start..index].iter().collect::<String>();
            let normalized = word.to_ascii_lowercase();
            tokens.push(if is_structural_keyword(&normalized) {
                normalized
            } else {
                "id".to_owned()
            });
            continue;
        }

        tokens.push(current.to_string());
        index += 1;
    }

    tokens
}

fn is_identifier_start(value: char) -> bool {
    value == '_' || value == '$' || value.is_alphabetic()
}

fn is_identifier_continue(value: char) -> bool {
    is_identifier_start(value) || value.is_ascii_digit()
}

fn is_structural_keyword(value: &str) -> bool {
    matches!(
        value,
        "and"
            | "async"
            | "await"
            | "break"
            | "case"
            | "catch"
            | "class"
            | "const"
            | "continue"
            | "def"
            | "defer"
            | "do"
            | "else"
            | "enum"
            | "except"
            | "false"
            | "finally"
            | "fn"
            | "for"
            | "func"
            | "function"
            | "go"
            | "if"
            | "impl"
            | "in"
            | "interface"
            | "let"
            | "loop"
            | "match"
            | "mut"
            | "nil"
            | "none"
            | "not"
            | "null"
            | "or"
            | "pass"
            | "raise"
            | "return"
            | "select"
            | "struct"
            | "switch"
            | "throw"
            | "true"
            | "try"
            | "type"
            | "var"
            | "while"
            | "with"
            | "yield"
    )
}

fn is_callable_candidate(language: &str, source: &str) -> bool {
    let tokens = normalized_tokens(source);
    match language {
        "rust" => has_block_after_keyword(&tokens, "fn"),
        "go" => has_block_after_keyword(&tokens, "func"),
        "python" => tokens.iter().any(|token| token == "def"),
        "java" => source.contains('(') && source.contains('{'),
        "typescript" => {
            let declares_container = tokens
                .iter()
                .any(|token| matches!(token.as_str(), "class" | "enum" | "interface" | "type"));
            tokens.iter().any(|token| token == "function")
                || source.contains("=>")
                || (!declares_container && source.contains('(') && source.contains('{'))
        }
        _ => false,
    }
}

fn has_block_after_keyword(tokens: &[String], keyword: &str) -> bool {
    tokens.iter().enumerate().any(|(index, token)| {
        token == keyword
            && tokens[index + 1..]
                .iter()
                .take_while(|token| token.as_str() != ";")
                .any(|token| token == "{")
    })
}

fn fingerprint_text(source: &str) -> RefactorFingerprint {
    let normalized = normalized_tokens(source);
    let shingles = normalized
        .windows(SHINGLE_WIDTH)
        .map(|window| window.join("\u{1f}"))
        .collect();

    RefactorFingerprint {
        tokens: normalized.iter().cloned().collect(),
        shingles,
        outgoing: BTreeSet::new(),
        token_count: normalized.len(),
        eligible: normalized.len() >= MIN_BODY_TOKENS,
    }
}

pub(super) fn rebuild_similarity_index(stored: &mut StoredIndex) {
    let input = SimilarityBuildInput::from_stored(stored);
    stored.similarity_index = build_similarity_index_from_input(&input);
}

fn build_similarity_index_from_input(input: &SimilarityBuildInput) -> SimilarityIndex {
    let mut exact_groups = BTreeMap::<String, Vec<u64>>::new();
    for document in &input.documents {
        if let Some(fingerprint) = &document.semantic_fingerprint {
            exact_groups
                .entry(fingerprint.clone())
                .or_default()
                .push(document.node_id);
        }
    }
    exact_groups.retain(|_, members| {
        members.sort_unstable();
        members.dedup();
        members.len() > 1
    });

    let mut selected = input
        .documents
        .iter()
        .filter_map(|document| {
            let language = pack_for_path(Path::new(&document.path))?.id();
            is_callable_candidate(language, &document.search_text).then_some((document, language))
        })
        .collect::<Vec<_>>();
    selected.sort_by_key(|(document, _)| {
        (
            document.path.as_str(),
            document.span_start,
            document.span_end,
            document.node_id,
        )
    });
    let documents_total = selected.len();
    let documents_truncated = selected.len() > BACKGROUND_DOCUMENT_LIMIT;
    selected.truncate(BACKGROUND_DOCUMENT_LIMIT);

    let documents = selected
        .iter()
        .map(|(document, language)| SimilarityDocument {
            node_id: document.node_id,
            language: (*language).to_owned(),
        })
        .collect::<Vec<_>>();
    let fingerprints = selected
        .iter()
        .map(|(document, language)| (*language, fingerprint_text(&document.search_text)))
        .collect::<Vec<_>>();

    let mut buckets = BTreeMap::<(&str, &str), Vec<usize>>::new();
    for (index, (language, fingerprint)) in fingerprints.iter().enumerate() {
        if !fingerprint.eligible {
            continue;
        }
        for shingle in &fingerprint.shingles {
            buckets
                .entry((*language, shingle.as_str()))
                .or_default()
                .push(index);
        }
    }
    let mut ordered_buckets = buckets.into_iter().collect::<Vec<_>>();
    ordered_buckets.sort_by(|left, right| {
        left.1
            .len()
            .cmp(&right.1.len())
            .then_with(|| left.0.cmp(&right.0))
    });

    let mut raw_pairs = BTreeSet::new();
    let mut pairs_truncated = false;
    'buckets: for (_, members) in ordered_buckets {
        for (offset, left) in members.iter().enumerate() {
            for right in members.iter().skip(offset + 1) {
                let pair = (*left.min(right), *left.max(right));
                if !raw_pairs.contains(&pair) && raw_pairs.len() >= BACKGROUND_PAIR_LIMIT {
                    pairs_truncated = true;
                    break 'buckets;
                }
                raw_pairs.insert(pair);
            }
        }
    }
    let inspected_pairs = raw_pairs.len();

    let index_by_node = documents
        .iter()
        .enumerate()
        .map(|(index, document)| (document.node_id, index))
        .collect::<BTreeMap<_, _>>();
    let live_nodes = input
        .documents
        .iter()
        .map(|document| document.node_id)
        .collect::<BTreeSet<_>>();
    let mut functional_buckets = BTreeMap::<(&str, RelationKind, u64), Vec<usize>>::new();
    for arc in &input.arcs {
        if !matches!(arc.kind, RelationKind::Calls | RelationKind::Implements)
            || !live_nodes.contains(&arc.target)
        {
            continue;
        }
        let Some(source_index) = index_by_node.get(&arc.source).copied() else {
            continue;
        };
        let Some(evidence) = arc.evidence.as_ref() else {
            continue;
        };
        if !evidence.is_definitive()
            || input.path_hashes.get(&evidence.path) != Some(&evidence.source_hash)
        {
            continue;
        }
        functional_buckets
            .entry((
                documents[source_index].language.as_str(),
                arc.kind,
                arc.target,
            ))
            .or_default()
            .push(source_index);
    }
    let mut ordered_functional_buckets = functional_buckets.into_iter().collect::<Vec<_>>();
    ordered_functional_buckets.sort_by(|left, right| {
        left.1
            .len()
            .cmp(&right.1.len())
            .then_with(|| left.0.cmp(&right.0))
    });
    let mut raw_functional_pairs = BTreeSet::new();
    let mut functional_pairs_truncated = false;
    'functional: for (_, mut members) in ordered_functional_buckets {
        members.sort_unstable();
        members.dedup();
        for (offset, left) in members.iter().enumerate() {
            for right in members.iter().skip(offset + 1) {
                let pair = (*left.min(right), *left.max(right));
                if raw_functional_pairs.contains(&pair) {
                    continue;
                }
                if raw_functional_pairs.len() >= BACKGROUND_FUNCTIONAL_PAIR_LIMIT {
                    functional_pairs_truncated = true;
                    break 'functional;
                }
                raw_functional_pairs.insert(pair);
            }
        }
    }
    let functional_inspected_pairs = raw_functional_pairs.len();
    let mut functional_pairs = raw_functional_pairs
        .into_iter()
        .map(|(left_index, right_index)| SimilarityPair {
            left_node_id: documents[left_index].node_id,
            right_node_id: documents[right_index].node_id,
            basis: similarity(&fingerprints[left_index].1, &fingerprints[right_index].1),
        })
        .collect::<Vec<_>>();
    functional_pairs.sort_by_key(|pair| (pair.left_node_id, pair.right_node_id));

    let mut pairs = raw_pairs
        .into_iter()
        .map(|(left_index, right_index)| SimilarityPair {
            left_node_id: documents[left_index].node_id,
            right_node_id: documents[right_index].node_id,
            basis: similarity(&fingerprints[left_index].1, &fingerprints[right_index].1),
        })
        .collect::<Vec<_>>();
    pairs.sort_by_key(|pair| (pair.left_node_id, pair.right_node_id));

    SimilarityIndex {
        version: SIMILARITY_INDEX_VERSION,
        documents_total,
        inspected_pairs,
        functional_inspected_pairs,
        documents_truncated,
        pairs_truncated,
        functional_pairs_truncated,
        documents,
        exact_groups,
        pairs,
        functional_pairs,
    }
}

fn jaccard<T: Ord>(left: &BTreeSet<T>, right: &BTreeSet<T>) -> u16 {
    let union = left.union(right).count();
    if union == 0 {
        return 0;
    }
    ((left.intersection(right).count() * 1000) / union) as u16
}

fn similarity(left: &RefactorFingerprint, right: &RefactorFingerprint) -> Similarity {
    let body_tokens = jaccard(&left.tokens, &right.tokens);
    let ordered_shingles = jaccard(&left.shingles, &right.shingles);
    let callees = jaccard(&left.outgoing, &right.outgoing);
    let largest = left.token_count.max(right.token_count);
    let size = if largest == 0 {
        0
    } else {
        ((left.token_count.min(right.token_count) * 1000) / largest) as u16
    };
    let total = weighted_similarity(body_tokens, ordered_shingles, callees, size);

    Similarity {
        body_tokens,
        ordered_shingles,
        callees,
        size,
        total,
    }
}

fn weighted_similarity(body_tokens: u16, ordered_shingles: u16, callees: u16, size: u16) -> u16 {
    ((u32::from(body_tokens) * 35
        + u32::from(ordered_shingles) * 35
        + u32::from(callees) * 20
        + u32::from(size) * 10)
        / 100) as u16
}

fn score_pair(
    basis: Similarity,
    left_node_id: u64,
    right_node_id: u64,
    outgoing: &BTreeMap<u64, BTreeSet<(RelationKind, u64)>>,
) -> Similarity {
    let callees = match (outgoing.get(&left_node_id), outgoing.get(&right_node_id)) {
        (Some(left), Some(right)) => jaccard(left, right),
        _ => 0,
    };
    Similarity {
        callees,
        total: weighted_similarity(
            basis.body_tokens,
            basis.ordered_shingles,
            callees,
            basis.size,
        ),
        ..basis
    }
}

struct CandidateDocument<'a> {
    document: &'a StoredDocument,
    language: &'static str,
    fingerprint: RefactorFingerprint,
}

struct RefactorCandidate<'a> {
    left: &'a StoredDocument,
    right: &'a StoredDocument,
    language: String,
    similarity: Similarity,
}

struct CandidateScan<'a> {
    candidates: Vec<RefactorCandidate<'a>>,
    inspected_documents: usize,
    inspected_pairs: usize,
    partial: bool,
    gaps: BTreeSet<&'static str>,
    index_used: bool,
}

fn scan_candidates_from_index<'a>(
    stored: &'a StoredIndex,
    index: &SimilarityIndex,
    scope: &Scope,
    language: Option<&str>,
    min_score: u16,
    outgoing: &BTreeMap<u64, BTreeSet<(RelationKind, u64)>>,
) -> Option<CandidateScan<'a>> {
    if !index.is_current() || index.documents_truncated {
        return None;
    }
    let language_by_node = index
        .documents
        .iter()
        .map(|document| (document.node_id, document.language.as_str()))
        .collect::<BTreeMap<_, _>>();
    let mut selected = index
        .documents
        .iter()
        .filter_map(|indexed| {
            let document = syntax_document(stored, indexed.node_id)?;
            (path_in_scope(&document.path, scope)
                && language.is_none_or(|expected| expected == indexed.language))
            .then_some(document)
        })
        .collect::<Vec<_>>();
    selected.sort_by_key(|document| {
        (
            document.path.as_str(),
            document.span_start,
            document.span_end,
            document.node_id,
        )
    });
    let mut gaps = BTreeSet::new();
    let document_budget_truncated = selected.len() > DEFAULT_DOCUMENT_LIMIT;
    let partial = index.pairs_truncated || document_budget_truncated;
    if index.pairs_truncated {
        gaps.insert("SIMILARITY_PAIR_BUDGET");
    }
    if document_budget_truncated {
        gaps.insert("REFACTOR_DOCUMENT_BUDGET");
        selected.truncate(DEFAULT_DOCUMENT_LIMIT);
    }
    let inspected_documents = selected.len();
    let selected_nodes = selected
        .iter()
        .map(|document| document.node_id)
        .collect::<BTreeSet<_>>();
    let pairs = index
        .pairs
        .iter()
        .filter(|pair| {
            selected_nodes.contains(&pair.left_node_id)
                && selected_nodes.contains(&pair.right_node_id)
        })
        .collect::<Vec<_>>();
    if pairs.len() > DEFAULT_PAIR_LIMIT {
        return None;
    }
    let inspected_pairs = pairs.len();
    let candidates = pairs
        .into_iter()
        .filter_map(|pair| {
            let left = syntax_document(stored, pair.left_node_id)?;
            let right = syntax_document(stored, pair.right_node_id)?;
            let score = score_pair(pair.basis, pair.left_node_id, pair.right_node_id, outgoing);
            (score.total >= min_score && (score.callees > 0 || score.ordered_shingles >= 820)).then(
                || RefactorCandidate {
                    left,
                    right,
                    language: language_by_node
                        .get(&pair.left_node_id)
                        .copied()
                        .unwrap_or_default()
                        .to_owned(),
                    similarity: score,
                },
            )
        })
        .collect();
    Some(CandidateScan {
        candidates,
        inspected_documents,
        inspected_pairs,
        partial,
        gaps,
        index_used: true,
    })
}

fn scan_candidates_direct<'a>(
    stored: &'a StoredIndex,
    scope: &Scope,
    language: Option<&str>,
    min_score: u16,
    max_documents: usize,
    max_pairs: usize,
    outgoing: &BTreeMap<u64, BTreeSet<(RelationKind, u64)>>,
) -> CandidateScan<'a> {
    let mut selected = stored
        .documents
        .iter()
        .filter(|document| document.provenance == "SYNTAX" && path_in_scope(&document.path, scope))
        .filter_map(|document| {
            let document_language = pack_for_path(Path::new(&document.path))?.id();
            (language.is_none_or(|expected| expected == document_language)
                && is_callable_candidate(document_language, &document.search_text))
            .then_some((document, document_language))
        })
        .collect::<Vec<_>>();
    selected.sort_by_key(|(document, _)| {
        (
            document.path.as_str(),
            document.span_start,
            document.span_end,
            document.node_id,
        )
    });

    let mut gaps = BTreeSet::new();
    let document_limit = if max_documents == 0 {
        DEFAULT_DOCUMENT_LIMIT
    } else {
        max_documents
    };
    let mut partial = selected.len() > document_limit;
    if partial {
        gaps.insert("REFACTOR_DOCUMENT_BUDGET");
        selected.truncate(document_limit);
    }

    let documents = selected
        .into_iter()
        .map(|(document, document_language)| CandidateDocument {
            document,
            language: document_language,
            fingerprint: fingerprint_text(&document.search_text),
        })
        .collect::<Vec<_>>();

    let mut buckets = BTreeMap::<(&str, &str), Vec<usize>>::new();
    for (index, document) in documents.iter().enumerate() {
        if !document.fingerprint.eligible {
            continue;
        }
        for shingle in &document.fingerprint.shingles {
            buckets
                .entry((document.language, shingle))
                .or_default()
                .push(index);
        }
    }
    let mut ordered_buckets = buckets.into_iter().collect::<Vec<_>>();
    ordered_buckets.sort_by(|left, right| {
        left.1
            .len()
            .cmp(&right.1.len())
            .then_with(|| left.0.cmp(&right.0))
    });

    let mut pairs = BTreeSet::new();
    'buckets: for (_, members) in ordered_buckets {
        for (offset, left) in members.iter().enumerate() {
            for right in members.iter().skip(offset + 1) {
                let pair = (*left.min(right), *left.max(right));
                let pair_limit = if max_pairs == 0 {
                    DEFAULT_PAIR_LIMIT
                } else {
                    max_pairs
                };
                if !pairs.contains(&pair) && pairs.len() >= pair_limit {
                    partial = true;
                    gaps.insert("REFACTOR_PAIR_BUDGET");
                    break 'buckets;
                }
                pairs.insert(pair);
            }
        }
    }

    let inspected_pairs = pairs.len();
    let candidates = pairs
        .into_iter()
        .filter_map(|(left_index, right_index)| {
            let left = &documents[left_index];
            let right = &documents[right_index];
            let basis = similarity(&left.fingerprint, &right.fingerprint);
            let score = score_pair(
                basis,
                left.document.node_id,
                right.document.node_id,
                outgoing,
            );
            (score.total >= min_score && (score.callees > 0 || score.ordered_shingles >= 820)).then(
                || RefactorCandidate {
                    left: left.document,
                    right: right.document,
                    language: left.language.to_owned(),
                    similarity: score,
                },
            )
        })
        .collect();
    CandidateScan {
        candidates,
        inspected_documents: documents.len(),
        inspected_pairs,
        partial,
        gaps,
        index_used: false,
    }
}

impl Runtime {
    pub(super) fn schedule_similarity_index_rebuild(&self) {
        let input = SimilarityBuildInput::from_stored(&self.stored);
        self.similarity_background
            .schedule(self.stored.snapshot.clone(), input);
    }

    #[must_use]
    pub fn similarity_index_status(&self) -> Value {
        self.similarity_background
            .status_json(self.snapshot(), false)
    }

    pub(super) fn background_similarity_lookup(
        &self,
        root: &StoredDocument,
        scope: &Scope,
        limit: usize,
    ) -> Value {
        let Some(index) = self.similarity_background.ready_index(self.snapshot()) else {
            return self.direct_similarity_lookup(root, scope, limit);
        };
        let exact_nodes = root
            .semantic_fingerprint
            .as_ref()
            .and_then(|fingerprint| index.exact_groups.get(fingerprint));
        let mut exact = exact_nodes
            .into_iter()
            .flatten()
            .filter(|node_id| **node_id != root.node_id)
            .filter_map(|node_id| syntax_document(&self.stored, *node_id))
            .filter(|document| path_in_scope(&document.path, scope))
            .collect::<Vec<_>>();
        exact.sort_by_key(|document| {
            (
                document.path.as_str(),
                document.span_start,
                document.node_id,
            )
        });
        let exact_matched = exact.len();
        let exact_rows = exact
            .into_iter()
            .take(limit)
            .map(similarity_node_json)
            .collect::<Vec<_>>();

        let definitive = definitive_stored_arcs(&self.stored, scope);
        let mut outgoing = BTreeMap::<u64, BTreeSet<(RelationKind, u64)>>::new();
        for arc in definitive {
            outgoing
                .entry(arc.source)
                .or_default()
                .insert((arc.kind, arc.target));
        }
        let exact_ids = exact_nodes
            .into_iter()
            .flatten()
            .copied()
            .collect::<BTreeSet<_>>();
        let mut seen_related = BTreeSet::new();
        let mut related = index
            .pairs
            .iter()
            .chain(index.functional_pairs.iter())
            .filter_map(|pair| {
                let other = if pair.left_node_id == root.node_id {
                    pair.right_node_id
                } else if pair.right_node_id == root.node_id {
                    pair.left_node_id
                } else {
                    return None;
                };
                if !seen_related.insert(other) {
                    return None;
                }
                if exact_ids.contains(&other) {
                    return None;
                }
                let document = syntax_document(&self.stored, other)?;
                if !path_in_scope(&document.path, scope) {
                    return None;
                }
                let score = score_pair(pair.basis, root.node_id, other, &outgoing);
                ((score.total >= RELATED_SCORE_FLOOR
                    && score.ordered_shingles >= RELATED_SHINGLE_FLOOR)
                    || score.callees >= 500)
                    .then_some((document, score))
            })
            .collect::<Vec<_>>();
        related.sort_by(|left, right| {
            rank_similarity(right.1)
                .cmp(&rank_similarity(left.1))
                .then_with(|| {
                    (left.0.path.as_str(), left.0.span_start, left.0.node_id).cmp(&(
                        right.0.path.as_str(),
                        right.0.span_start,
                        right.0.node_id,
                    ))
                })
        });
        let similar_matched = related.len();
        let similar_rows = related
            .into_iter()
            .take(limit)
            .map(|(document, score)| {
                let relationship = if score.ordered_shingles >= 900 && score.body_tokens >= 900 {
                    "near_duplicate"
                } else if score.callees >= 700 {
                    "similar_functionality"
                } else {
                    "similar_structure"
                };
                let mut value = similarity_node_json(document);
                value["relationship"] = relationship.into();
                value["similarity"] = json!({
                    "body_tokens":score.body_tokens,
                    "ordered_shingles":score.ordered_shingles,
                    "callees":score.callees,
                    "size":score.size,
                    "total":score.total
                });
                value
            })
            .collect::<Vec<_>>();

        json!({
            "matches":exact_rows,
            "matched":exact_matched,
            "truncated":exact_matched > limit,
            "similar_matches":similar_rows,
            "similar_matched":similar_matched,
            "similar_truncated":similar_matched > limit,
            "similarity_partial":!index.related_complete(),
            "similarity_index":self.similarity_background.status_json(self.snapshot(), true)
        })
    }

    fn direct_similarity_lookup(
        &self,
        root: &StoredDocument,
        scope: &Scope,
        limit: usize,
    ) -> Value {
        let mut exact = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX"
                    && document.node_id != root.node_id
                    && path_in_scope(&document.path, scope)
                    && root.semantic_fingerprint.is_some()
                    && document.semantic_fingerprint == root.semantic_fingerprint
            })
            .collect::<Vec<_>>();
        exact.sort_by_key(|document| {
            (
                document.path.as_str(),
                document.span_start,
                document.node_id,
            )
        });
        let exact_matched = exact.len();
        let exact_ids = exact
            .iter()
            .map(|document| document.node_id)
            .collect::<BTreeSet<_>>();
        let exact_rows = exact
            .into_iter()
            .take(limit)
            .map(similarity_node_json)
            .collect::<Vec<_>>();

        let definitive = definitive_stored_arcs(&self.stored, scope);
        let mut outgoing = BTreeMap::<u64, BTreeSet<(RelationKind, u64)>>::new();
        for arc in definitive {
            outgoing
                .entry(arc.source)
                .or_default()
                .insert((arc.kind, arc.target));
        }
        let root_language = pack_for_path(Path::new(&root.path)).map(|pack| pack.id());
        let root_fingerprint = fingerprint_text(&root.search_text);
        let mut related = if root_fingerprint.eligible {
            self.stored
                .documents
                .iter()
                .filter(|document| {
                    document.provenance == "SYNTAX"
                        && document.node_id != root.node_id
                        && !exact_ids.contains(&document.node_id)
                        && path_in_scope(&document.path, scope)
                })
                .filter_map(|document| {
                    let language = pack_for_path(Path::new(&document.path))?.id();
                    if Some(language) != root_language
                        || !is_callable_candidate(language, &document.search_text)
                    {
                        return None;
                    }
                    let candidate_fingerprint = fingerprint_text(&document.search_text);
                    if !candidate_fingerprint.eligible {
                        return None;
                    }
                    let basis = similarity(&root_fingerprint, &candidate_fingerprint);
                    let score = score_pair(basis, root.node_id, document.node_id, &outgoing);
                    ((score.total >= RELATED_SCORE_FLOOR
                        && score.ordered_shingles >= RELATED_SHINGLE_FLOOR)
                        || score.callees >= 500)
                        .then_some((document, score))
                })
                .collect::<Vec<_>>()
        } else {
            Vec::new()
        };
        related.sort_by(|left, right| {
            rank_similarity(right.1)
                .cmp(&rank_similarity(left.1))
                .then_with(|| {
                    (left.0.path.as_str(), left.0.span_start, left.0.node_id).cmp(&(
                        right.0.path.as_str(),
                        right.0.span_start,
                        right.0.node_id,
                    ))
                })
        });
        let similar_matched = related.len();
        let similar_rows = related
            .into_iter()
            .take(limit)
            .map(|(document, score)| {
                let relationship = if score.ordered_shingles >= 900 && score.body_tokens >= 900 {
                    "near_duplicate"
                } else if score.callees >= 700 {
                    "similar_functionality"
                } else {
                    "similar_structure"
                };
                let mut value = similarity_node_json(document);
                value["relationship"] = relationship.into();
                value["similarity"] = json!({
                    "body_tokens":score.body_tokens,
                    "ordered_shingles":score.ordered_shingles,
                    "callees":score.callees,
                    "size":score.size,
                    "total":score.total
                });
                value
            })
            .collect::<Vec<_>>();
        let mut status = self
            .similarity_background
            .status_json(self.snapshot(), false);
        status["fallback"] = "direct_root_scan".into();

        json!({
            "matches":exact_rows,
            "matched":exact_matched,
            "truncated":exact_matched > limit,
            "similar_matches":similar_rows,
            "similar_matched":similar_matched,
            "similar_truncated":similar_matched > limit,
            "similarity_partial":false,
            "similarity_index":status
        })
    }

    pub fn suggest_refactors(
        &self,
        scope: &Scope,
        language: Option<&str>,
        min_score: u16,
        limit: usize,
        max_documents: usize,
        max_pairs: usize,
    ) -> Result<Value, RuntimeError> {
        let language = language.map(str::trim);
        if language.is_some_and(|value| {
            !matches!(
                value,
                "typescript" | "go" | "java" | "python" | "rust" | "c" | "kotlin"
            )
        }) || min_score > 1000
            || !(1..=50).contains(&limit)
        {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "language must be typescript, go, java, python, rust, c, or kotlin; min_score must be 0..1000; limit must be 1..50",
            ));
        }

        let definitive = definitive_stored_arcs(&self.stored, scope);
        let mut outgoing = BTreeMap::<u64, BTreeSet<(RelationKind, u64)>>::new();
        for arc in &definitive {
            outgoing
                .entry(arc.source)
                .or_default()
                .insert((arc.kind, arc.target));
        }
        let background_index = (max_documents == 0 && max_pairs == 0)
            .then(|| self.similarity_background.ready_index(self.snapshot()))
            .flatten();
        let indexed_scan = background_index.as_deref().and_then(|index| {
            scan_candidates_from_index(&self.stored, index, scope, language, min_score, &outgoing)
        });
        let scan = indexed_scan.unwrap_or_else(|| {
            scan_candidates_direct(
                &self.stored,
                scope,
                language,
                min_score,
                max_documents,
                max_pairs,
                &outgoing,
            )
        });
        let CandidateScan {
            mut candidates,
            inspected_documents,
            inspected_pairs,
            mut partial,
            mut gaps,
            index_used,
        } = scan;
        candidates.sort_by(|left, right| {
            rank_similarity(right.similarity)
                .cmp(&rank_similarity(left.similarity))
                .then_with(|| candidate_identity(left).cmp(&candidate_identity(right)))
        });

        let total = candidates.len();
        if total > limit {
            partial = true;
            gaps.insert("RESULT_LIMIT");
        }
        candidates.truncate(limit);

        let observations = self.load_current_observations()?;
        let mut evidence_count = 0;
        let mut values = Vec::with_capacity(candidates.len());
        for candidate in candidates {
            let (mut value, evidence_truncated) = candidate_json(
                &candidate,
                &definitive,
                &self.stored,
                &outgoing,
                self.snapshot(),
                &mut evidence_count,
            );
            if evidence_truncated {
                partial = true;
                gaps.insert("REFACTOR_EVIDENCE_BUDGET");
            }
            value["runtime_profile"] =
                runtime_profile(&candidate, observations.as_ref(), &definitive);
            values.push(value);
        }

        let coverage = coverage_for_scope(&self.stored.coverage, scope);
        let index_gap_count = coverage_gap_count(&coverage);
        partial |= index_gap_count > 0;
        let mut coverage_gaps = coverage_gap_page(&coverage, 0, 20);
        coverage_gaps.extend(gaps.iter().map(|code| json!({"code":code})));
        let coverage_gap_count = index_gap_count + gaps.len();
        for candidate in &mut values {
            candidate["strategies"] =
                strategies::derive(candidate, self.snapshot(), &coverage_gaps, partial).into();
        }

        Ok(json!({
            "snapshot":self.snapshot(),
            "kind":"refactor_candidates",
            "status":"hypothetical",
            "candidates":values,
            "total":total,
            "truncated":total > limit,
            "partial":partial,
            "coverage_gaps":coverage_gaps,
            "coverage_gap_count":coverage_gap_count,
            "coverage_gaps_truncated":index_gap_count > 20,
            "inspected_documents":inspected_documents,
            "inspected_pairs":inspected_pairs,
            "similarity_index":self.similarity_background.status_json(self.snapshot(), index_used),
            "limitations":[
                "Candidates require review; structural similarity is not proof that code should be merged.",
                "Projections are hypothetical and never mutate source or the stored graph.",
                "Empty results apply only to the inspected scope, language, threshold, and budgets."
            ]
        }))
    }
}

fn similarity_node_json(document: &StoredDocument) -> Value {
    json!({
        "qualified_name":document.qualified_name,
        "path":document.path,
        "span_start":document.span_start,
        "span_end":document.span_end,
        "node_id":document.node_id
    })
}

fn runtime_profile(
    candidate: &RefactorCandidate<'_>,
    observations: Option<&cgrx_store::ObservationSnapshot>,
    definitive: &[&StoredArc],
) -> Value {
    let left = candidate.left.node_id;
    let right = candidate.right.node_id;
    let static_pairs = definitive
        .iter()
        .map(|arc| (arc.source, arc.target))
        .collect::<BTreeSet<_>>();
    let mut left_incoming_count = 0_u64;
    let mut duplicate_incoming_count = 0_u64;
    let mut candidate_outgoing_count = 0_u64;
    let mut observed_only_edges = 0_usize;
    let mut last_seen_unix_nanos = 0_u64;
    let mut environments = BTreeSet::new();
    for edge in observations
        .into_iter()
        .flat_map(|snapshot| &snapshot.edges)
    {
        if ![left, right].contains(&edge.source) && ![left, right].contains(&edge.target) {
            continue;
        }
        if edge.target == left {
            left_incoming_count = left_incoming_count.saturating_add(edge.count);
        }
        if edge.target == right {
            duplicate_incoming_count = duplicate_incoming_count.saturating_add(edge.count);
        }
        if edge.source == left || edge.source == right {
            candidate_outgoing_count = candidate_outgoing_count.saturating_add(edge.count);
        }
        if !static_pairs.contains(&(edge.source, edge.target)) {
            observed_only_edges += 1;
        }
        last_seen_unix_nanos = last_seen_unix_nanos.max(edge.last_seen_unix_nanos);
        environments.insert(edge.environment.clone());
    }
    json!({
        "left_incoming_count":left_incoming_count,
        "duplicate_incoming_count":duplicate_incoming_count,
        "candidate_outgoing_count":candidate_outgoing_count,
        "observed_only_edges":observed_only_edges,
        "last_seen_unix_nanos":last_seen_unix_nanos,
        "environments":environments,
        "evidence_revision":observations.map(|snapshot| &snapshot.snapshot.repo_revision),
    })
}

fn rank_similarity(similarity: Similarity) -> (u16, u16, u16, u16, u16) {
    (
        similarity.total,
        similarity.ordered_shingles,
        similarity.body_tokens,
        similarity.callees,
        similarity.size,
    )
}

fn candidate_identity<'a>(
    candidate: &'a RefactorCandidate<'a>,
) -> (&'a str, usize, &'a str, usize) {
    (
        candidate.left.path.as_str(),
        candidate.left.span_start,
        candidate.right.path.as_str(),
        candidate.right.span_start,
    )
}

fn candidate_json(
    candidate: &RefactorCandidate<'_>,
    definitive: &[&StoredArc],
    stored: &StoredIndex,
    outgoing: &BTreeMap<u64, BTreeSet<(RelationKind, u64)>>,
    snapshot: &cgrx_core::RepoSnapshot,
    evidence_count: &mut usize,
) -> (Value, bool) {
    let left = candidate.left;
    let right = candidate.right;
    let shared = match (outgoing.get(&left.node_id), outgoing.get(&right.node_id)) {
        (Some(left), Some(right)) => left.intersection(right).copied().collect::<Vec<_>>(),
        _ => Vec::new(),
    };
    let projection_id = projection_id(snapshot, left.node_id, right.node_id);
    let helper = json!({
        "id":format!("virtual:{projection_id}:helper"),
        "symbol":format!("shared_{}_{}", left.qualified_name, right.qualified_name),
        "status":"hypothetical"
    });

    let mut evidence_truncated = false;
    let mut included_shared = Vec::new();
    let mut shared_callees = Vec::new();
    for (relation, target) in &shared {
        let Some(target_document) = syntax_document(stored, *target) else {
            continue;
        };
        let proofs = definitive
            .iter()
            .filter(|arc| {
                arc.kind == *relation
                    && arc.target == *target
                    && (arc.source == left.node_id || arc.source == right.node_id)
            })
            .filter_map(|arc| arc.evidence.as_ref())
            .collect::<Vec<_>>();
        if !reserve_evidence(evidence_count, proofs.len(), DEFAULT_EVIDENCE_LIMIT) {
            evidence_truncated = true;
            continue;
        }
        included_shared.push((*relation, *target));
        shared_callees.push(json!({
            "relation":relation,
            "target":node_json(target_document),
            "confidence":"PROVEN",
            "evidence":proofs
        }));
    }

    let mut preserve = Vec::new();
    for arc in definitive
        .iter()
        .filter(|arc| arc.target == left.node_id || arc.target == right.node_id)
    {
        if !reserve_evidence(evidence_count, 1, DEFAULT_EVIDENCE_LIMIT) {
            evidence_truncated = true;
            continue;
        }
        if let Some(value) = edge_json(arc, stored) {
            preserve.push(value);
        }
    }
    let add = [left, right]
        .into_iter()
        .map(|document| {
            json!({
                "relation":"CALLS",
                "source":node_json(document),
                "target":helper,
                "confidence":"hypothetical"
            })
        })
        .collect::<Vec<_>>();
    let move_to_helper = included_shared
        .iter()
        .filter_map(|(relation, target)| {
            syntax_document(stored, *target).map(|target_document| {
                json!({
                    "relation":relation,
                    "from":[node_json(left),node_json(right)],
                    "source":helper,
                    "target":node_json(target_document),
                    "confidence":"hypothetical"
                })
            })
        })
        .collect::<Vec<_>>();

    let projection = json!({
        "id":projection_id,
        "status":"hypothetical",
        "helper":helper,
        "preserve":preserve,
        "add":add,
        "move_to_helper":move_to_helper,
        "remove":[]
    });
    (
        json!({
            "kind":"extract_shared_helper",
            "confidence":"candidate",
            "language":candidate.language,
            "left":node_json(left),
            "right":node_json(right),
            "similarity":{
                "body_tokens":candidate.similarity.body_tokens,
                "ordered_shingles":candidate.similarity.ordered_shingles,
                "callees":candidate.similarity.callees,
                "size":candidate.similarity.size,
                "total":candidate.similarity.total
            },
            "shared_callees":shared_callees,
            "projection":projection
        }),
        evidence_truncated,
    )
}

fn reserve_evidence(used: &mut usize, requested: usize, limit: usize) -> bool {
    let Some(next) = used.checked_add(requested) else {
        return false;
    };
    if next > limit {
        return false;
    }
    *used = next;
    true
}

fn node_json(document: &StoredDocument) -> Value {
    json!({
        "node_id":document.node_id,
        "path":document.path,
        "symbol":document.qualified_name,
        "span":{"start":document.span_start,"end":document.span_end}
    })
}

fn edge_json(arc: &StoredArc, stored: &StoredIndex) -> Option<Value> {
    Some(json!({
        "relation":arc.kind,
        "source":node_json(syntax_document(stored, arc.source)?),
        "target":node_json(syntax_document(stored, arc.target)?),
        "confidence":"PROVEN",
        "evidence":arc.evidence
    }))
}

fn projection_id(
    snapshot: &cgrx_core::RepoSnapshot,
    left_node_id: u64,
    right_node_id: u64,
) -> String {
    let (left_node_id, right_node_id) = (
        left_node_id.min(right_node_id),
        left_node_id.max(right_node_id),
    );
    let encoded = serde_json::to_vec(&json!({
        "snapshot":snapshot,
        "left":left_node_id,
        "right":right_node_id
    }))
    .expect("snapshot and node identity serialize");
    let digest = blake3::hash(&encoded).to_hex().to_string();
    format!("refactor1.{}", &digest[..16])
}

#[cfg(test)]
mod tests {
    use super::{
        Similarity, fingerprint_text, is_callable_candidate, jaccard, normalized_tokens,
        rank_similarity, reserve_evidence, similarity,
    };

    #[test]
    fn normalization_ignores_local_spelling_and_literal_values() {
        assert_eq!(
            normalized_tokens("fn a(x: i32) { let y = x + 1; save(y); }"),
            normalized_tokens("fn b(input: i32) { let result = input + 9; save(result); }")
        );
    }

    #[test]
    fn ordered_shingles_distinguish_changed_control_flow() {
        let left = fingerprint_text("if ready { save(item); }");
        let right = fingerprint_text("while ready { save(item); }");

        assert!(jaccard(&left.shingles, &right.shingles) < 800);
    }

    #[test]
    fn tiny_bodies_are_ineligible() {
        assert!(!fingerprint_text("return value").eligible);
    }

    #[test]
    fn identical_structure_without_graph_neighbors_scores_eight_hundred() {
        let left = fingerprint_text("fn a(x: i32) { let y = x + 1; save(y); }");
        let right = fingerprint_text("fn b(input: i32) { let result = input + 9; save(result); }");

        assert_eq!(similarity(&left, &right).total, 800);
    }

    #[test]
    fn evidence_budget_keeps_proof_groups_atomic() {
        let mut used = 1_998;
        assert!(reserve_evidence(&mut used, 2, 2_000));
        assert_eq!(used, 2_000);

        assert!(!reserve_evidence(&mut used, 1, 2_000));
        assert_eq!(used, 2_000);
    }

    #[test]
    fn total_score_has_priority_when_ranking_candidates() {
        let higher_total = Similarity {
            body_tokens: 800,
            ordered_shingles: 800,
            callees: 800,
            size: 800,
            total: 800,
        };
        let lower_total = Similarity {
            body_tokens: 900,
            ordered_shingles: 500,
            callees: 500,
            size: 500,
            total: 700,
        };

        assert!(rank_similarity(higher_total) > rank_similarity(lower_total));
    }

    #[test]
    fn non_callable_declarations_are_not_refactor_candidates() {
        for (language, source) in [
            ("rust", "struct Entry { value: usize }"),
            ("rust", "trait Entry { fn run(); }"),
            ("go", "type Entry struct { Value int }"),
            ("python", "class Entry:\n    pass"),
            ("java", "final class Entry { int value; }"),
            ("typescript", "interface Entry { value: number }"),
            ("typescript", "@sealed class Entry { run() {} }"),
        ] {
            assert!(!is_callable_candidate(language, source), "{language}");
        }
        for (language, source) in [
            ("rust", "fn run() {}"),
            ("go", "func run() {}"),
            ("python", "async def run():\n    pass"),
            ("java", "int run() { return 1; }"),
            ("typescript", "constructor() {}"),
            ("typescript", "const run = () => 1"),
        ] {
            assert!(is_callable_candidate(language, source), "{language}");
        }
    }
}
