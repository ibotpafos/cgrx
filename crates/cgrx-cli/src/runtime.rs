mod risks;
mod ts_config;
pub use risks::RiskBaseline;
use ts_config::TsResolutionConfig;

use std::collections::{BTreeMap, BTreeSet};
use std::fmt;
use std::fs;
use std::io::{BufRead, BufReader, Read, Write};
use std::os::unix::fs::MetadataExt;
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};

use cgrx_capsule::{
    ContextWindow, EvidencePacker, EvidenceRecord, PackInput, Tokenizer, slice_source,
};
use cgrx_cgcr::{
    CgcrEngine, CompileRequest, CompiledContext, CostTable, CoverageMetadata, ObligationCompiler,
    Probe, ProbeError, ProbeFact, ProbeOracle, QueryClass, RemainingBudget, ResolvedAnchor,
    SourceRange,
};
use cgrx_core::{
    ByteRange, ConfidenceClass, EdgeEvidence, Hash32, QueryRequest, RelationKind, RepoSnapshot,
    ResolverClass, Scope,
};
use cgrx_languages::ts_imports::{ImportClassification, SiteBinding, TsFileFacts};
use cgrx_languages::{
    Provenance as LanguageProvenance, RelationKind as LanguageRelation, Span, UnresolvedKind,
    pack_for_path,
};
use cgrx_retrieval::{
    BaseGraph, Candidate, CandidateProvenance, GraphArc, GraphDocument, RetrievalEngine,
    ScoreComponents, SnapshotView, path_in_scope,
};
use cgrx_store::{DeltaOverlay, GenerationReader, GenerationWriter};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use crate::intent::{TaskIntent, classify};

const EXTRACTION_REVISION: u32 = 23;

const NODES_SEGMENT: &str = "nodes.seg";
const EDGES_SEGMENT: &str = "edges.seg";
const TERMS_SEGMENT: &str = "terms.fst";
const TERMS_MARKER: &[u8] = b"CGRXTERMS1";
const GRAPH_FANOUT_LIMIT: usize = 8;
const UNTRACKED_SCAN_ENTRY_LIMIT: usize = 64;

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct IndexReport {
    pub snapshot: RepoSnapshot,
    pub index_input_bytes: u64,
    pub indexed_files: u64,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct OrientReport {
    pub snapshot: RepoSnapshot,
    pub compiled: CompiledContext,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RuntimeError {
    code: &'static str,
    detail: String,
}

impl RuntimeError {
    fn new(code: &'static str, detail: impl Into<String>) -> Self {
        Self {
            code,
            detail: detail.into(),
        }
    }

    #[must_use]
    pub const fn code(&self) -> &'static str {
        self.code
    }
}

impl fmt::Display for RuntimeError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{}: {}", self.code, self.detail)
    }
}

impl std::error::Error for RuntimeError {}

#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
struct GoFieldTarget {
    package: String,
    caller: ByteRange,
    receiver_type: ByteRange,
    field: ByteRange,
    field_type: ByteRange,
    target: ByteRange,
}

#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
struct RustSelfTarget {
    owner: ByteRange,
    implementation: ByteRange,
    #[serde(default)]
    target_implementation: Option<ByteRange>,
    caller: ByteRange,
    target: ByteRange,
}

#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
struct TsLexicalTarget {
    target: ByteRange,
    caller: ByteRange,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
struct GoReceiverTarget {
    package: String,
    receiver_type: String,
    path: String,
    symbol: String,
    span_start: usize,
    span_end: usize,
}

// Default metadata is optional on disk; preserve the same decoded revision-3
// document and keep required identity/proof fields unchanged.
fn is_false(value: &bool) -> bool {
    !*value
}

fn is_zero(value: &usize) -> bool {
    *value == 0
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
struct StoredDocument {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    rust_module_target: Option<TsLexicalTarget>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    rust_self_target: Option<Box<RustSelfTarget>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    ts_lexical_target: Option<TsLexicalTarget>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    go_field_target: Option<Box<GoFieldTarget>>,
    node_id: u64,
    qualified_name: String,
    path: String,
    text: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    search_text: String,
    span_start: usize,
    span_end: usize,
    #[serde(default, skip_serializing_if = "is_zero")]
    body_start: usize,
    #[serde(default, skip_serializing_if = "is_zero")]
    body_end: usize,
    provenance: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    semantic_tags: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    go_receiver_target: Option<GoReceiverTarget>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    go_import_path: Option<String>,
    #[serde(default, skip_serializing_if = "is_false")]
    go_import_explicit_alias: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    go_package: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
struct StoredArc {
    source: u64,
    target: u64,
    #[serde(default = "calls_relation")]
    kind: RelationKind,
    #[serde(default)]
    evidence: Option<EdgeEvidence>,
}

const fn calls_relation() -> RelationKind {
    RelationKind::Calls
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
struct StoredIndex {
    #[serde(default)]
    cargo_manifests: BTreeMap<String, String>,
    #[serde(default)]
    rust_files: BTreeMap<String, cgrx_languages::RustFileFacts>,
    #[serde(default)]
    ts_files: BTreeMap<String, StoredTsFileFacts>,
    #[serde(default)]
    ts_resolution_configs: BTreeMap<String, TsResolutionConfig>,
    #[serde(default)]
    extraction_revision: u32,
    #[serde(default)]
    go_modules: BTreeMap<String, String>,
    snapshot: RepoSnapshot,
    index_input_bytes: u64,
    indexed_files: u64,
    path_hashes: BTreeMap<String, Hash32>,
    documents: Vec<StoredDocument>,
    arcs: Vec<StoredArc>,
    coverage: CoverageMetadata,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
struct StoredTsFileFacts {
    source_hash: Hash32,
    facts: TsFileFacts,
    #[serde(default)]
    inventory_only: bool,
}

pub struct Runtime {
    stored: StoredIndex,
    base_snapshot: RepoSnapshot,
    base_path_hashes: BTreeMap<String, Hash32>,
    changed_paths: BTreeSet<String>,
    refresh_input_bytes: u64,
    source_fingerprints: BTreeMap<String, SourceFingerprint>,
    base_traversal_truncated: bool,
    untracked_scan_cache: Option<UntrackedScanCache>,
}

#[derive(Clone, Copy, Eq, PartialEq)]
struct SourceFingerprint {
    device: u64,
    inode: u64,
    length: u64,
    modified_seconds: i64,
    modified_nanoseconds: i64,
    changed_seconds: i64,
    changed_nanoseconds: i64,
}

struct UntrackedScanCache {
    discovered: BTreeSet<String>,
    expanded: BTreeSet<String>,
    watched_metadata: BTreeMap<String, SourceFingerprint>,
    truncated: bool,
}

impl UntrackedScanCache {
    fn is_valid(&self, root: &Path, discovered: &BTreeSet<String>) -> bool {
        self.discovered == *discovered
            && self.watched_metadata.iter().all(|(relative, expected)| {
                fs::metadata(root.join(relative))
                    .map(|metadata| source_fingerprint(&metadata) == *expected)
                    .unwrap_or(false)
            })
    }
}

impl Runtime {
    #[must_use]
    pub const fn snapshot(&self) -> &RepoSnapshot {
        &self.stored.snapshot
    }

    #[must_use]
    pub fn graph_node_count(&self) -> usize {
        self.stored
            .documents
            .iter()
            .filter(|document| document.provenance == "SYNTAX")
            .count()
    }

    #[must_use]
    pub fn graph_edge_count(&self) -> usize {
        self.stored.arcs.len()
    }

    pub fn search_graph(
        &self,
        query: &str,
        scope: &Scope,
        limit: usize,
    ) -> Result<Value, RuntimeError> {
        self.search_graph_filtered(query, scope, limit, None, false)
    }

    pub fn search_graph_filtered(
        &self,
        query: &str,
        scope: &Scope,
        limit: usize,
        language: Option<&str>,
        include_body: bool,
    ) -> Result<Value, RuntimeError> {
        let language = language.map(str::trim);
        if language
            .is_some_and(|language| !matches!(language, "typescript" | "go" | "python" | "rust"))
        {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "language must be one of typescript, go, python, or rust",
            ));
        }
        self.search_graph_with_matcher(query, scope, limit, language, include_body, path_in_scope)
    }

    pub fn get_outline(&self, path: &str, limit: usize) -> Result<Value, RuntimeError> {
        let path = path.trim();
        if path.is_empty() || Path::new(path).is_absolute() || !(1..=500).contains(&limit) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "path must be relative and non-empty; limit must be between 1 and 500",
            ));
        }
        let language = pack_for_path(Path::new(path))
            .map(|pack| pack.id())
            .ok_or_else(|| RuntimeError::new("cgrx.unsupported_path", path.to_owned()))?;
        if !self.stored.path_hashes.contains_key(path) {
            return Err(RuntimeError::new(
                "cgrx.path_not_indexed",
                format!("path {path} was not indexed"),
            ));
        }
        let scope = Scope {
            include: vec![path.to_owned()],
            exclude: Vec::new(),
            relation_kinds: vec![RelationKind::Calls, RelationKind::Implements],
            max_depth: 0,
        };
        let mut scoped = ScopedQuery::new(&self.stored, &scope, path_in_scope);
        let mut documents: Vec<_> = self
            .stored
            .documents
            .iter()
            .filter(|document| document.provenance == "SYNTAX" && document.path == path)
            .collect();
        documents.sort_by_key(|document| (document.span_start, document.node_id));
        let total = documents.len();
        let symbols: Vec<_> = documents
            .into_iter()
            .take(limit)
            .map(|document| {
                json!({
                    "node_id":document.node_id,
                    "symbol":document.qualified_name,
                    "span":{"start":document.span_start,"end":document.span_end}
                })
            })
            .collect();
        Ok(json!({
            "snapshot":self.stored.snapshot,
            "path":path,
            "language":language,
            "symbols":symbols,
            "total":total,
            "truncated":total > limit,
            "coverage_gap_count":coverage_gap_count(&scoped.coverage(&self.stored.coverage))
        }))
    }

    fn search_graph_with_matcher(
        &self,
        query: &str,
        scope: &Scope,
        limit: usize,
        language: Option<&str>,
        include_body: bool,
        matches_scope: impl FnMut(&str, &Scope) -> bool,
    ) -> Result<Value, RuntimeError> {
        let query = query.trim();
        if query.is_empty() || !(1..=50).contains(&limit) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "query must be non-empty and limit must be between 1 and 50",
            ));
        }
        let folded = query.to_lowercase();
        let mut scoped = ScopedQuery::new(&self.stored, scope, matches_scope);
        let qualifying = scoped.definitive_arcs(&self.stored);
        let distinct: BTreeSet<_> = qualifying
            .iter()
            .map(|arc| (arc.source, arc.target, arc.kind))
            .collect();
        let mut caller_counts = BTreeMap::<u64, usize>::new();
        let mut callee_counts = BTreeMap::<u64, usize>::new();
        for (source, target, _kind) in distinct {
            debug_assert!(scoped.live.contains(&source) && scoped.live.contains(&target));
            *caller_counts.entry(target).or_default() += 1;
            *callee_counts.entry(source).or_default() += 1;
        }
        let mut matches: Vec<_> = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX"
                    && scoped.contains_path(&document.path)
                    && language.is_none_or(|language| {
                        pack_for_path(Path::new(&document.path))
                            .is_some_and(|pack| pack.id() == language)
                    })
            })
            .filter_map(|document| {
                let name = document.qualified_name.to_lowercase();
                let (rank, matched_by) = if name == folded {
                    (0, "symbol")
                } else if name.starts_with(&folded) {
                    (1, "symbol")
                } else if name.contains(&folded) {
                    (2, "symbol")
                } else if include_body && document.search_text.to_lowercase().contains(&folded) {
                    (3, "body")
                } else {
                    return None;
                };
                let callers = caller_counts.get(&document.node_id).copied().unwrap_or(0);
                let callees = callee_counts.get(&document.node_id).copied().unwrap_or(0);
                Some((rank, document, callers, callees, matched_by))
            })
            .collect();
        matches.sort_by_key(|(rank, document, _, _, _)| {
            (*rank, &document.path, document.span_start, document.node_id)
        });
        let total = matches.len();
        let rows: Vec<_> = matches
            .into_iter()
            .take(limit)
            .map(|(_, document, callers, callees, matched_by)| {
                json!({
                    "node_id":document.node_id,
                    "symbol":document.qualified_name,
                    "path":document.path,
                    "span":{"start":document.span_start,"end":document.span_end},
                    "matched_by":matched_by,
                    "callers":callers,
                    "callees":callees
                })
            })
            .collect();
        Ok(json!({
            "snapshot":self.stored.snapshot,
            "query":query,
            "language":language,
            "include_body":include_body,
            "matches":rows,
            "total":total,
            "truncated":total > limit,
            "coverage_gap_count":coverage_gap_count(&scoped.coverage(&self.stored.coverage))
        }))
    }

    pub fn trace_path(
        &self,
        symbol: &str,
        path: Option<&str>,
        direction: &str,
        depth: u8,
        scope: &Scope,
        limit: usize,
    ) -> Result<Value, RuntimeError> {
        if symbol.trim().is_empty()
            || !matches!(direction, "callers" | "callees" | "both")
            || !(1..=4).contains(&depth)
            || !(1..=50).contains(&limit)
        {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "symbol, direction, depth 1..4, and limit 1..50 are required",
            ));
        }
        let mut scoped = ScopedQuery::new(&self.stored, scope, path_in_scope);
        let mut roots: Vec<_> = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX"
                    && scoped.contains_path(&document.path)
                    && path.is_none_or(|path| document.path == path)
            })
            .filter(|document| document.qualified_name == symbol)
            .collect();
        if roots.is_empty() {
            let folded = symbol.to_lowercase();
            roots = self
                .stored
                .documents
                .iter()
                .filter(|document| {
                    document.provenance == "SYNTAX"
                        && scoped.contains_path(&document.path)
                        && path.is_none_or(|path| document.path == path)
                        && document.qualified_name.to_lowercase() == folded
                })
                .collect();
        }
        roots.sort_by_key(|document| (&document.path, document.span_start, document.node_id));
        let root = match roots.as_slice() {
            [] => {
                return Err(RuntimeError::new(
                    "cgrx.symbol_not_found",
                    format!("symbol {symbol} was not found in scope"),
                ));
            }
            [root] => *root,
            _ => {
                let candidates = roots
                    .iter()
                    .map(|document| format!("{}:{}", document.path, document.span_start))
                    .collect::<Vec<_>>()
                    .join(", ");
                return Err(RuntimeError::new(
                    "cgrx.ambiguous_symbol",
                    format!("symbol {symbol} matches {candidates}; pass path"),
                ));
            }
        };
        let by_id: BTreeMap<_, _> = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX" && scoped.contains_path(&document.path)
            })
            .map(|document| (document.node_id, document))
            .collect();
        let mut adjacency = BTreeMap::<u64, Vec<(u64, &'static str)>>::new();
        for arc in scoped.definitive_arcs(&self.stored) {
            debug_assert!(by_id.contains_key(&arc.source) && by_id.contains_key(&arc.target));
            if matches!(direction, "callees" | "both") {
                adjacency
                    .entry(arc.source)
                    .or_default()
                    .push((arc.target, "callees"));
            }
            if matches!(direction, "callers" | "both") {
                adjacency
                    .entry(arc.target)
                    .or_default()
                    .push((arc.source, "callers"));
            }
        }
        for neighbors in adjacency.values_mut() {
            neighbors.sort_by_key(|(node_id, edge_direction)| {
                let document = by_id[node_id];
                (
                    &document.path,
                    document.span_start,
                    *edge_direction,
                    *node_id,
                )
            });
            neighbors.dedup();
        }
        let mut visited = BTreeSet::from([root.node_id]);
        let mut frontier = vec![root.node_id];
        let mut traced = Vec::new();
        for hop in 1..=depth {
            let mut next = Vec::new();
            for source in &frontier {
                for (target, edge_direction) in adjacency.get(source).into_iter().flatten() {
                    if visited.insert(*target) {
                        traced.push((*target, hop, *edge_direction));
                        next.push(*target);
                    }
                }
            }
            next.sort_by_key(|node_id| {
                let document = by_id[node_id];
                (&document.path, document.span_start, *node_id)
            });
            if next.is_empty() {
                break;
            }
            frontier = next;
        }
        traced.sort_by_key(|(node_id, hop, edge_direction)| {
            let document = by_id[node_id];
            (
                *hop,
                &document.path,
                document.span_start,
                *edge_direction,
                *node_id,
            )
        });
        let total = traced.len();
        let nodes: Vec<_> = traced
            .into_iter()
            .take(limit)
            .map(|(node_id, hop, edge_direction)| {
                let document = by_id[&node_id];
                json!({
                    "node_id":node_id,
                    "symbol":document.qualified_name,
                    "path":document.path,
                    "span":{"start":document.span_start,"end":document.span_end},
                    "hop":hop,
                    "direction":edge_direction
                })
            })
            .collect();
        Ok(json!({
            "snapshot":self.stored.snapshot,
            "root":{"node_id":root.node_id,"symbol":root.qualified_name,"path":root.path,"span":{"start":root.span_start,"end":root.span_end}},
            "direction":direction,
            "depth":depth,
            "nodes":nodes,
            "total":total,
            "truncated":total > limit,
            "coverage_gap_count":coverage_gap_count(&scoped.coverage(&self.stored.coverage))
        }))
    }

    pub fn find_usages(
        &self,
        symbol: &str,
        path: Option<&str>,
        scope: &Scope,
        depth: u8,
        limit: usize,
    ) -> Result<Value, RuntimeError> {
        let symbol = symbol.trim();
        if symbol.is_empty()
            || path.is_some_and(|path| path.trim().is_empty())
            || !(1..=4).contains(&depth)
            || !(1..=500).contains(&limit)
        {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "symbol and depth 1..4 are required; path must be non-empty when supplied; limit must be 1..500",
            ));
        }
        let mut scoped = ScopedQuery::new(&self.stored, scope, path_in_scope);
        let mut roots: Vec<_> = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX"
                    && scoped.contains_path(&document.path)
                    && path.is_none_or(|path| document.path == path)
                    && document.qualified_name == symbol
            })
            .collect();
        if roots.is_empty() {
            let folded = symbol.to_lowercase();
            roots = self
                .stored
                .documents
                .iter()
                .filter(|document| {
                    document.provenance == "SYNTAX"
                        && scoped.contains_path(&document.path)
                        && path.is_none_or(|path| document.path == path)
                        && document.qualified_name.to_lowercase() == folded
                })
                .collect();
        }
        roots.sort_by_key(|document| (&document.path, document.span_start, document.node_id));
        let root = match roots.as_slice() {
            [] => {
                return Err(RuntimeError::new(
                    "cgrx.symbol_not_found",
                    format!("symbol {symbol} was not found in scope"),
                ));
            }
            [root] => *root,
            _ => {
                let candidates = roots
                    .iter()
                    .map(|document| format!("{}:{}", document.path, document.span_start))
                    .collect::<Vec<_>>()
                    .join(", ");
                return Err(RuntimeError::new(
                    "cgrx.ambiguous_symbol",
                    format!("symbol {symbol} matches {candidates}; pass path"),
                ));
            }
        };
        let by_id: BTreeMap<_, _> = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX" && scoped.contains_path(&document.path)
            })
            .map(|document| (document.node_id, document))
            .collect();
        let mut incoming = BTreeMap::<u64, Vec<&StoredArc>>::new();
        for arc in scoped.definitive_arcs(&self.stored) {
            incoming.entry(arc.target).or_default().push(arc);
        }
        for arcs in incoming.values_mut() {
            arcs.sort_by_key(|arc| {
                let evidence = arc.evidence.as_ref().expect("definitive edge evidence");
                (&evidence.path, evidence.span.start, arc.kind, arc.source)
            });
        }
        let mut visited = BTreeSet::from([root.node_id]);
        let mut frontier = vec![root.node_id];
        let mut usages = Vec::new();
        for hop in 1..=depth {
            let mut next = BTreeSet::new();
            for target_id in &frontier {
                let Some(target) = by_id.get(target_id).copied() else {
                    continue;
                };
                for arc in incoming.get(target_id).into_iter().flatten() {
                    if visited.contains(&arc.source) {
                        continue;
                    }
                    let Some(source) = by_id.get(&arc.source).copied() else {
                        continue;
                    };
                    let Some(evidence) = arc.evidence.as_ref() else {
                        continue;
                    };
                    usages.push((arc, source, target, evidence, hop));
                    next.insert(arc.source);
                }
            }
            if next.is_empty() {
                break;
            }
            visited.extend(&next);
            frontier = next.into_iter().collect();
        }
        usages.sort_by_key(|(arc, source, target, evidence, hop)| {
            (
                *hop,
                &evidence.path,
                evidence.span.start,
                &source.path,
                source.span_start,
                target.node_id,
                arc.kind,
                source.node_id,
            )
        });
        usages.dedup_by_key(|(arc, source, target, evidence, hop)| {
            (
                *hop,
                evidence.path.clone(),
                evidence.span,
                source.node_id,
                target.node_id,
                arc.kind,
            )
        });
        let total = usages.len();
        let rows: Vec<_> = usages
            .into_iter()
            .take(limit)
            .map(|(arc, source, target, evidence, hop)| {
                json!({
                    "source":{"node_id":source.node_id,"symbol":source.qualified_name,"path":source.path,"span":{"start":source.span_start,"end":source.span_end}},
                    "via":{"node_id":target.node_id,"symbol":target.qualified_name,"path":target.path},
                    "relation":arc.kind,
                    "site":{"path":evidence.path,"span":evidence.span},
                    "resolver":evidence.resolver,
                    "confidence":evidence.confidence,
                    "hop":hop
                })
            })
            .collect();
        Ok(json!({
            "snapshot":self.stored.snapshot,
            "target":{"node_id":root.node_id,"symbol":root.qualified_name,"path":root.path,"span":{"start":root.span_start,"end":root.span_end}},
            "depth":depth,
            "usages":rows,
            "total":total,
            "truncated":total > limit,
            "coverage_gap_count":coverage_gap_count(&scoped.coverage(&self.stored.coverage))
        }))
    }

    pub fn get_code_snippet(
        &self,
        symbol: &str,
        path: Option<&str>,
    ) -> Result<Value, RuntimeError> {
        let symbol = symbol.trim();
        if symbol.is_empty() || path.is_some_and(|path| path.trim().is_empty()) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "symbol must be non-empty and path, when supplied, must be non-empty",
            ));
        }
        let mut matches: Vec<_> = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX"
                    && path.is_none_or(|path| document.path == path)
                    && document.qualified_name == symbol
            })
            .collect();
        if matches.is_empty() {
            let folded = symbol.to_lowercase();
            matches = self
                .stored
                .documents
                .iter()
                .filter(|document| {
                    document.provenance == "SYNTAX"
                        && path.is_none_or(|path| document.path == path)
                        && document.qualified_name.to_lowercase() == folded
                })
                .collect();
        }
        matches.sort_by_key(|document| (&document.path, document.span_start, document.node_id));
        let document = match matches.as_slice() {
            [] => {
                return Err(RuntimeError::new(
                    "cgrx.symbol_not_found",
                    format!("symbol {symbol} was not found"),
                ));
            }
            [document] => *document,
            _ => {
                let candidates = matches
                    .iter()
                    .map(|document| format!("{}:{}", document.path, document.span_start))
                    .collect::<Vec<_>>()
                    .join(", ");
                return Err(RuntimeError::new(
                    "cgrx.ambiguous_symbol",
                    format!("symbol {symbol} matches {candidates}; pass path"),
                ));
            }
        };
        Ok(json!({
            "snapshot":self.stored.snapshot,
            "node_id":document.node_id,
            "symbol":document.qualified_name,
            "path":document.path,
            "definition_span":{"start":document.span_start,"end":document.span_end},
            "body_span":{"start":document.body_start,"end":document.body_end},
            "declaration":document.text,
            "source":document.search_text,
            "provenance":document.provenance
        }))
    }

    pub fn check_index_coverage(
        &self,
        paths: &[String],
        scopes: &[String],
        gap_offset: usize,
        gap_limit: usize,
    ) -> Result<Value, RuntimeError> {
        if gap_limit == 0 || gap_limit > 500 {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "coverage limit must be from 1 to 500",
            ));
        }
        if paths.is_empty() && scopes.is_empty() {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "at least one exact path or bounded scope is required",
            ));
        }
        if paths
            .iter()
            .chain(scopes)
            .any(|value| value.trim().is_empty())
        {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "paths and scopes must be non-empty",
            ));
        }

        let mut counts = BTreeMap::from([
            ("indexed", 0_usize),
            ("partial", 0),
            ("excluded", 0),
            ("unknown", 0),
        ]);
        let path_rows: Vec<_> = paths
            .iter()
            .map(|path| {
                let indexed = self.stored.documents.iter().any(|document| {
                    document.provenance == "SYNTAX" && document.path == *path
                });
                let excluded = self.stored.coverage.excluded_paths.iter().any(|item| item == path);
                let mut gaps = Vec::new();
                gaps.extend(
                    self.stored
                        .coverage
                        .parser_error_ranges
                        .iter()
                        .filter(|range| range.path == *path)
                        .map(|range| json!({"code":"PARSER_ERROR_RANGE","start":range.start,"end":range.end})),
                );
                gaps.extend(
                    self.stored
                        .coverage
                        .stale_paths
                        .iter()
                        .filter(|item| *item == path)
                        .map(|_| json!({"code":"STALE_PATH"})),
                );
                gaps.extend(
                    self.stored
                        .coverage
                        .dynamic_dispatch
                        .iter()
                        .filter(|location| dynamic_dispatch_path(location) == path)
                        .map(|location| json!({"code":"DYNAMIC_DISPATCH","location":location})),
                );
                let status = if indexed && gaps.is_empty() {
                    "indexed"
                } else if indexed {
                    "partial"
                } else if excluded {
                    "excluded"
                } else {
                    "unknown"
                };
                *counts.get_mut(status).expect("known coverage status") += 1;
                json!({"path":path,"status":status,"gaps":gaps,"gap_count":gaps.len()})
            })
            .collect();

        let scope_rows: Vec<_> = scopes
            .iter()
            .map(|pattern| {
                let scope = Scope {
                    include: vec![pattern.clone()],
                    exclude: Vec::new(),
                    relation_kinds: Vec::new(),
                    max_depth: 1,
                };
                let indexed_paths: BTreeSet<_> = self
                    .stored
                    .documents
                    .iter()
                    .filter(|document| {
                        document.provenance == "SYNTAX" && path_in_scope(&document.path, &scope)
                    })
                    .map(|document| document.path.as_str())
                    .collect();
                let coverage = coverage_for_scope(&self.stored.coverage, &scope);
                let gap_count = coverage_gap_count(&coverage);
                let page = coverage_gap_page(&coverage, gap_offset, gap_limit);
                let returned = page.len();
                let has_more = gap_offset.saturating_add(returned) < gap_count;
                let next_offset = has_more.then_some(gap_offset.saturating_add(returned));
                let status = if !indexed_paths.is_empty() && gap_count == 0 {
                    "indexed"
                } else if !indexed_paths.is_empty() {
                    "partial"
                } else if !coverage.excluded_paths.is_empty() {
                    "excluded"
                } else {
                    "unknown"
                };
                json!({
                    "scope":pattern,
                    "status":status,
                    "indexed_paths":indexed_paths.len(),
                    "coverage_gap_count":gap_count,
                    "gap_offset":gap_offset,
                    "gap_limit":gap_limit,
                    "gaps":page,
                    "returned":returned,
                    "has_more":has_more,
                    "next_offset":next_offset,
                    "coverage_summary":{
                        "excluded_paths":coverage.excluded_paths.len(),
                        "parser_error_ranges":coverage.parser_error_ranges.len(),
                        "stale_paths":coverage.stale_paths.len(),
                        "dynamic_dispatch":coverage.dynamic_dispatch.len(),
                        "traversal_truncated":coverage.traversal_truncated
                    }
                })
            })
            .collect();

        let mut scope_counts = BTreeMap::from([
            ("indexed", 0_usize),
            ("partial", 0),
            ("excluded", 0),
            ("unknown", 0),
        ]);
        for row in &scope_rows {
            if let Some(status) = row["status"].as_str() {
                *scope_counts.get_mut(status).expect("known scope status") += 1;
            }
        }

        Ok(json!({
            "snapshot":self.stored.snapshot,
            "paths":path_rows,
            "scopes":scope_rows,
            "summary":counts,
            "scope_summary":scope_counts,
            "meaning":"indexed means no recorded gap; partial means indexed with recorded parser, dynamic, or stale gaps"
        }))
    }

    #[must_use]
    pub const fn coverage(&self) -> &CoverageMetadata {
        &self.stored.coverage
    }

    #[must_use]
    pub fn changed_paths(&self) -> Vec<String> {
        self.changed_paths.iter().cloned().collect()
    }

    pub fn refresh(&mut self, root: &Path) -> Result<bool, RuntimeError> {
        let root = root
            .canonicalize()
            .map_err(|error| RuntimeError::new("root", error.to_string()))?;
        let status = git_bytes(
            &root,
            &[
                "status",
                "--porcelain=v2",
                "--branch",
                "-z",
                "--untracked-files=normal",
                "--",
            ],
        )?;
        let (revision, discovered) = refresh_status(&status)?;
        if revision != self.base_snapshot.repo_revision {
            return Err(RuntimeError::new(
                "revision_changed",
                "watched HEAD changed; run cgrx index before serving the new revision",
            ));
        }
        let (discovered, untracked_truncated) = match &self.untracked_scan_cache {
            Some(cache) if cache.is_valid(&root, &discovered) => {
                (cache.expanded.clone(), cache.truncated)
            }
            _ => {
                let cache = expand_untracked_directories(&root, discovered)?;
                let result = (cache.expanded.clone(), cache.truncated);
                self.untracked_scan_cache = Some(cache);
                result
            }
        };
        self.stored.coverage.traversal_truncated =
            self.base_traversal_truncated || untracked_truncated;
        let mut candidates = self.changed_paths.clone();
        candidates.extend(discovered);
        let previous_snapshot = self.stored.snapshot.clone();
        let mut refresh_input_bytes = 0_u64;
        let mut nested_boundary_cache = BTreeMap::new();
        let mut requires_normalize = false;
        for relative in candidates {
            let relative_path = PathBuf::from(&relative);
            if crosses_nested_git_boundary(&root, &relative_path, &mut nested_boundary_cache) {
                self.source_fingerprints.remove(&relative);
                if self.stored.path_hashes.contains_key(&relative) {
                    remove_path(&mut self.stored, &relative);
                    requires_normalize = true;
                }
                self.stored
                    .coverage
                    .excluded_paths
                    .retain(|path| path != &relative);
                continue;
            }
            if relative_path
                .file_name()
                .is_some_and(|name| name == "Cargo.toml")
            {
                let directory = relative_path
                    .parent()
                    .unwrap_or(Path::new(""))
                    .to_string_lossy()
                    .into_owned();
                let absolute = root.join(&relative_path);
                if absolute.is_file() {
                    let source = fs::read(&absolute)
                        .map_err(|e| RuntimeError::new("source_read", e.to_string()))?;
                    let hash = Hash32(*blake3::hash(&source).as_bytes());
                    if self.stored.path_hashes.get(&relative) != Some(&hash) {
                        self.stored.path_hashes.insert(relative.clone(), hash);
                        self.stored
                            .cargo_manifests
                            .insert(directory, String::from_utf8(source).unwrap_or_default());
                        requires_normalize = true;
                    }
                } else if self.stored.path_hashes.remove(&relative).is_some() {
                    self.stored.cargo_manifests.remove(&directory);
                    requires_normalize = true;
                }
                continue;
            }
            if relative_path
                .file_name()
                .is_some_and(|name| name == "go.mod")
            {
                let directory = relative_path
                    .parent()
                    .unwrap_or(Path::new(""))
                    .to_string_lossy()
                    .into_owned();
                let absolute = root.join(&relative_path);
                if absolute.is_file() {
                    let source = fs::read(&absolute)
                        .map_err(|error| RuntimeError::new("source_read", error.to_string()))?;
                    let hash = Hash32(*blake3::hash(&source).as_bytes());
                    if self.stored.path_hashes.get(&relative) != Some(&hash) {
                        self.stored.path_hashes.insert(relative.clone(), hash);
                        self.stored
                            .go_modules
                            .insert(directory, go_module_name(&source).unwrap_or_default());
                        requires_normalize = true;
                    }
                } else if self.stored.path_hashes.remove(&relative).is_some() {
                    self.stored.go_modules.remove(&directory);
                    requires_normalize = true;
                }
                continue;
            }
            if is_ts_inventory_path(&relative_path) && pack_for_path(&relative_path).is_none() {
                let absolute = root.join(&relative_path);
                if absolute.is_file() {
                    let source = fs::read(&absolute)
                        .map_err(|error| RuntimeError::new("source_read", error.to_string()))?;
                    let hash = Hash32(*blake3::hash(&source).as_bytes());
                    if self.stored.path_hashes.get(&relative) != Some(&hash)
                        || self
                            .stored
                            .ts_files
                            .get(&relative)
                            .map(|facts| facts.source_hash)
                            != Some(hash)
                    {
                        self.stored.path_hashes.insert(relative.clone(), hash);
                        self.stored.ts_files.insert(
                            relative.clone(),
                            StoredTsFileFacts {
                                source_hash: hash,
                                facts: TsFileFacts::default(),
                                inventory_only: true,
                            },
                        );
                        requires_normalize = true;
                    }
                } else if self.stored.path_hashes.contains_key(&relative) {
                    remove_path(&mut self.stored, &relative);
                    requires_normalize = true;
                }
                continue;
            }
            if pack_for_path(&relative_path).is_none() {
                self.source_fingerprints.remove(&relative);
                self.stored
                    .coverage
                    .excluded_paths
                    .retain(|path| path != &relative);
                if root.join(&relative_path).exists() {
                    self.stored.coverage.excluded_paths.push(relative);
                }
                continue;
            }
            let absolute = root.join(&relative_path);
            if !absolute.exists() {
                self.source_fingerprints.remove(&relative);
                if self.stored.path_hashes.contains_key(&relative) {
                    remove_path(&mut self.stored, &relative);
                    requires_normalize = true;
                }
                continue;
            }
            let metadata = fs::metadata(&absolute)
                .map_err(|error| RuntimeError::new("source_read", error.to_string()))?;
            let fingerprint = source_fingerprint(&metadata);
            let needs_ts_extraction = matches!(
                relative_path
                    .extension()
                    .and_then(|extension| extension.to_str()),
                Some("ts" | "tsx")
            ) && self
                .stored
                .ts_files
                .get(&relative)
                .is_none_or(|facts| facts.inventory_only);
            if self.source_fingerprints.get(&relative) == Some(&fingerprint)
                && self.stored.path_hashes.contains_key(&relative)
                && !needs_ts_extraction
            {
                continue;
            }
            let source = fs::read(&absolute)
                .map_err(|error| RuntimeError::new("source_read", error.to_string()))?;
            self.source_fingerprints
                .insert(relative.clone(), fingerprint);
            refresh_input_bytes = refresh_input_bytes
                .checked_add(source.len() as u64)
                .ok_or_else(|| RuntimeError::new("overflow", "refresh byte counter overflow"))?;
            let source_hash = Hash32(*blake3::hash(&source).as_bytes());
            if self.stored.path_hashes.get(&relative) == Some(&source_hash) && !needs_ts_extraction
            {
                continue;
            }
            let extracted = extract_path(&relative, &source)?;
            remove_path(&mut self.stored, &relative);
            requires_normalize = true;
            self.stored
                .path_hashes
                .insert(relative.clone(), source_hash);
            if let Some(facts) = extracted.rust_file {
                self.stored.rust_files.insert(relative.clone(), facts);
            }
            if let Some(facts) = extracted.ts_file {
                self.stored.ts_files.insert(
                    relative.clone(),
                    StoredTsFileFacts {
                        source_hash,
                        facts,
                        inventory_only: false,
                    },
                );
            }
            self.stored.documents.extend(extracted.documents);
            self.stored
                .coverage
                .parser_error_ranges
                .extend(extracted.parser_error_ranges);
            self.stored
                .coverage
                .dynamic_dispatch
                .extend(extracted.dynamic_dispatch);
        }
        let (inventory_changed, invalid_ts_sources) = scan_ts_inventory(
            &root,
            &mut self.stored.path_hashes,
            &mut self.stored.ts_files,
            &mut self.stored.ts_resolution_configs,
        )?;
        requires_normalize |= inventory_changed;
        for (relative, marker_hash) in invalid_ts_sources {
            remove_path(&mut self.stored, &relative);
            self.stored
                .path_hashes
                .insert(relative.clone(), marker_hash);
            self.stored.ts_files.insert(
                relative.clone(),
                StoredTsFileFacts {
                    source_hash: marker_hash,
                    facts: TsFileFacts::default(),
                    inventory_only: true,
                },
            );
            self.stored.coverage.stale_paths.push(relative);
            requires_normalize = true;
        }
        self.refresh_input_bytes = refresh_input_bytes;
        if !requires_normalize {
            return Ok(false);
        }
        self.stored.arcs = rebuild_refreshed_arcs(&self.stored);
        normalize_stored(&mut self.stored);
        self.changed_paths = changed_paths(&self.base_path_hashes, &self.stored.path_hashes);
        self.stored.snapshot = if self.changed_paths.is_empty() {
            self.base_snapshot.clone()
        } else {
            RepoSnapshot {
                repo_revision: self.base_snapshot.repo_revision.clone(),
                working_tree_digest: working_tree_digest(
                    &self.changed_paths,
                    &self.stored.path_hashes,
                ),
                graph_generation: self.base_snapshot.graph_generation,
            }
        };
        self.stored.indexed_files = self.stored.path_hashes.len() as u64;
        Ok(self.stored.snapshot != previous_snapshot)
    }

    pub fn index(root: &Path, state: &Path) -> Result<IndexReport, RuntimeError> {
        Self::index_source(root, state, false)
    }

    pub fn index_committed_head(root: &Path, state: &Path) -> Result<IndexReport, RuntimeError> {
        Self::index_source(root, state, true)
    }

    fn index_source(
        root: &Path,
        state: &Path,
        committed_head: bool,
    ) -> Result<IndexReport, RuntimeError> {
        let root = root
            .canonicalize()
            .map_err(|error| RuntimeError::new("root", error.to_string()))?;
        let revision = git_text(&root, &["rev-parse", "HEAD"])?;
        let status = if committed_head {
            Vec::new()
        } else {
            git_bytes(
                &root,
                &["status", "--porcelain=v1", "--untracked-files=all"],
            )?
        };
        if !committed_head && !status.is_empty() {
            return Err(RuntimeError::new(
                "dirty_worktree",
                "runtime indexing requires committed HEAD content",
            ));
        }
        let committed_objects = if committed_head {
            parse_committed_tree(&git_bytes(&root, &["ls-tree", "-r", "-z", "HEAD", "--"])?)?
        } else {
            BTreeMap::new()
        };
        let mut paths: Vec<_> = if committed_head {
            committed_objects.keys().cloned().collect()
        } else {
            git_bytes(&root, &["ls-files", "-z"])?
                .split(|byte| *byte == 0)
                .filter(|value| !value.is_empty())
                .map(|value| String::from_utf8_lossy(value).into_owned())
                .collect()
        };
        paths.sort();
        let working_tree_digest =
            Hash32(*blake3::hash(if committed_head { &[] } else { &status }).as_bytes());
        let graph_generation = generation_id(&revision);
        let snapshot = RepoSnapshot {
            repo_revision: revision,
            working_tree_digest,
            graph_generation,
        };
        let mut documents = Vec::new();
        let mut path_hashes = BTreeMap::new();
        let mut parser_error_ranges = Vec::new();
        let mut dynamic_dispatch = Vec::new();
        let mut excluded_paths = Vec::new();
        let mut index_input_bytes = 0_u64;
        let mut blob_batch = committed_head
            .then(|| GitBlobBatch::spawn(&root))
            .transpose()?;
        let mut sources = Vec::new();
        let mut go_modules = BTreeMap::new();
        let mut cargo_manifests = BTreeMap::new();
        let mut rust_files = BTreeMap::new();
        let mut ts_files = BTreeMap::new();
        let mut ts_resolution_configs = BTreeMap::new();
        for relative in paths {
            let relative_path = Path::new(&relative);
            let is_go_module = relative_path
                .file_name()
                .is_some_and(|name| name == "go.mod");
            let is_cargo = relative_path.file_name().is_some_and(|n| n == "Cargo.toml");
            let is_ts_inventory = is_ts_inventory_path(relative_path);
            if pack_for_path(relative_path).is_none()
                && !is_go_module
                && !is_cargo
                && !is_ts_inventory
            {
                excluded_paths.push(relative);
                continue;
            }
            let source = if committed_head {
                let object = committed_objects.get(&relative).ok_or_else(|| {
                    RuntimeError::new("git_tree", format!("missing object for {relative}"))
                })?;
                blob_batch
                    .as_mut()
                    .expect("committed indexing has a blob batch")
                    .read_blob(object)?
            } else {
                fs::read(root.join(relative_path))
                    .map_err(|error| RuntimeError::new("source_read", error.to_string()))?
            };
            if is_cargo {
                let directory = relative_path
                    .parent()
                    .unwrap_or(Path::new(""))
                    .to_string_lossy()
                    .into_owned();
                path_hashes.insert(relative.clone(), Hash32(*blake3::hash(&source).as_bytes()));
                cargo_manifests.insert(directory, String::from_utf8(source).unwrap_or_default());
                excluded_paths.push(relative);
                continue;
            }
            if is_go_module {
                let directory = relative_path
                    .parent()
                    .unwrap_or(Path::new(""))
                    .to_string_lossy()
                    .into_owned();
                // Empty values retain invalid/unsupported nested-module boundaries.
                go_modules.insert(directory, go_module_name(&source).unwrap_or_default());
                path_hashes.insert(relative.clone(), Hash32(*blake3::hash(&source).as_bytes()));
                excluded_paths.push(relative);
                continue;
            }
            if is_ts_inventory && pack_for_path(relative_path).is_none() {
                let hash = Hash32(*blake3::hash(&source).as_bytes());
                path_hashes.insert(relative.clone(), hash);
                ts_files.insert(
                    relative.clone(),
                    StoredTsFileFacts {
                        source_hash: hash,
                        facts: TsFileFacts::default(),
                        inventory_only: true,
                    },
                );
                if is_ts_resolution_config(relative_path) {
                    ts_resolution_configs
                        .insert(relative.clone(), TsResolutionConfig::legacy(&source));
                }
                excluded_paths.push(relative);
                continue;
            }
            index_input_bytes = index_input_bytes
                .checked_add(source.len() as u64)
                .ok_or_else(|| RuntimeError::new("overflow", "index byte counter overflow"))?;
            sources.push((relative, source));
        }
        if let Some(batch) = blob_batch {
            batch.finish()?;
        }
        let indexed_files = sources.len() as u64;
        for source in extract_sources_parallel(&sources)? {
            path_hashes.insert(source.relative.clone(), source.hash);
            let extracted = source.extracted;
            if let Some(facts) = extracted.rust_file {
                rust_files.insert(source.relative.clone(), facts);
            }
            if let Some(facts) = extracted.ts_file {
                ts_files.insert(
                    source.relative.clone(),
                    StoredTsFileFacts {
                        source_hash: source.hash,
                        facts,
                        inventory_only: false,
                    },
                );
            }
            documents.extend(extracted.documents);
            parser_error_ranges.extend(extracted.parser_error_ranges);
            dynamic_dispatch.extend(extracted.dynamic_dispatch);
        }
        if !committed_head {
            let (_, invalid_ts_sources) = scan_ts_inventory(
                &root,
                &mut path_hashes,
                &mut ts_files,
                &mut ts_resolution_configs,
            )?;
            if !invalid_ts_sources.is_empty() {
                return Err(RuntimeError::new(
                    "source_changed",
                    "TypeScript source changed identity during coherent indexing",
                ));
            }
        }
        documents.sort_by(|left, right| {
            (&left.path, left.span_start, left.node_id).cmp(&(
                &right.path,
                right.span_start,
                right.node_id,
            ))
        });
        documents.dedup_by_key(|document| document.node_id);
        let arcs = rebuild_arcs_with_cargo(
            &documents,
            &path_hashes,
            &go_modules,
            &cargo_manifests,
            &rust_files,
            &ts_files,
            &ts_resolution_configs,
        );
        parser_error_ranges.sort();
        parser_error_ranges.dedup();
        dynamic_dispatch.sort();
        dynamic_dispatch.dedup();
        let mut stored = StoredIndex {
            extraction_revision: EXTRACTION_REVISION,
            cargo_manifests,
            rust_files,
            ts_files,
            ts_resolution_configs,
            go_modules,
            snapshot: snapshot.clone(),
            index_input_bytes,
            indexed_files,
            path_hashes,
            documents,
            arcs,
            coverage: CoverageMetadata {
                excluded_paths,
                parser_error_ranges,
                dynamic_dispatch,
                ..CoverageMetadata::default()
            },
        };
        refresh_qualified_call_gaps(&mut stored);
        let nodes = serde_json::to_vec(&stored)
            .map_err(|error| RuntimeError::new("serialize", error.to_string()))?;
        let segments: [(&str, &[u8]); 3] = [
            (NODES_SEGMENT, &nodes),
            (EDGES_SEGMENT, b"[]"),
            (TERMS_SEGMENT, TERMS_MARKER),
        ];
        match GenerationWriter::begin(state, snapshot.clone()) {
            Ok(mut writer) => {
                for (name, bytes) in segments {
                    writer
                        .write_segment(name, bytes)
                        .map_err(|error| RuntimeError::new("store_write", error.to_string()))?;
                }
                writer
                    .validate()
                    .map_err(|error| RuntimeError::new("store_validate", error.to_string()))?;
                writer
                    .publish()
                    .map_err(|error| RuntimeError::new("store_publish", error.to_string()))?;
            }
            Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
                GenerationWriter::reactivate(state, &snapshot, &segments)
                    .map_err(|error| store_writer_error("store_reactivate", error))?;
            }
            Err(error) => return Err(store_writer_error("store_begin", error)),
        }
        Ok(IndexReport {
            snapshot,
            index_input_bytes,
            indexed_files,
        })
    }

    pub fn open(state: &Path) -> Result<Self, RuntimeError> {
        let reader = GenerationReader::open_current(state)
            .map_err(|error| RuntimeError::new("store_open", error.to_string()))?;
        let mut stored: StoredIndex = serde_json::from_slice(
            &reader
                .read_segment(NODES_SEGMENT)
                .map_err(|error| RuntimeError::new("store_read", error.to_string()))?,
        )
        .map_err(|error| RuntimeError::new("deserialize", error.to_string()))?;
        if &stored.snapshot != reader.snapshot()
            || reader.read_segment(TERMS_SEGMENT).ok().as_deref() != Some(TERMS_MARKER)
        {
            return Err(RuntimeError::new(
                "store_mismatch",
                "runtime segments do not match manifest",
            ));
        }
        if stored.extraction_revision != EXTRACTION_REVISION {
            return Err(RuntimeError::new(
                "extraction_revision",
                "stored extraction revision is obsolete; reindex source before opening",
            ));
        }
        normalize_stored(&mut stored);
        let base_traversal_truncated = stored.coverage.traversal_truncated;
        Ok(Self {
            base_snapshot: stored.snapshot.clone(),
            base_path_hashes: stored.path_hashes.clone(),
            stored,
            changed_paths: BTreeSet::new(),
            refresh_input_bytes: 0,
            source_fingerprints: BTreeMap::new(),
            base_traversal_truncated,
            untracked_scan_cache: None,
        })
    }

    pub fn orient(&self, request: QueryRequest) -> Result<OrientReport, RuntimeError> {
        let base = BaseGraph {
            generation: self.stored.snapshot.graph_generation,
            path_hashes: self.stored.path_hashes.clone(),
            edges: Vec::new(),
            documents: self
                .stored
                .documents
                .iter()
                .map(|document| GraphDocument {
                    node_id: document.node_id,
                    qualified_name: document.qualified_name.clone(),
                    path: document.path.clone(),
                    text: if document.search_text.is_empty() {
                        document.text.clone()
                    } else {
                        document.search_text.clone()
                    },
                    span: Span {
                        start: document.span_start,
                        end: document.span_end,
                    },
                    provenance: CandidateProvenance::Syntax,
                })
                .collect(),
            arcs: definitive_stored_arcs(&self.stored, &request.scope)
                .into_iter()
                .map(|arc| GraphArc {
                    source: arc.source,
                    target: arc.target,
                    kind: arc.kind,
                    evidence: arc.evidence.clone().expect("definitive arc has evidence"),
                })
                .collect(),
        };
        let overlay = DeltaOverlay::new(base.generation);
        let view = SnapshotView::new(&base, &overlay)
            .map_err(|error| RuntimeError::new("view", error.to_string()))?;
        let mut candidates = RetrievalEngine::default()
            .retrieve(&request, &view)
            .map_err(|error| RuntimeError::new("retrieve", error.to_string()))?;
        let exact_symbols = exact_symbol_ids(&request.task, &self.stored.documents, &request.scope);
        let intent_evidence = if exact_symbols.is_empty() {
            task_evidence_ids(
                &request.task,
                &self.stored.documents,
                &base.arcs,
                &request.scope,
            )
        } else {
            Vec::new()
        };
        let mut task_evidence = if !exact_symbols.is_empty() {
            exact_symbols
        } else if !intent_evidence.is_empty() {
            intent_evidence
        } else {
            definition_body_ids(&request.task, &self.stored.documents, &request.scope)
        };
        let required_task_anchors = task_evidence.clone();
        if !task_evidence.is_empty() && request.scope.relation_kinds.contains(&RelationKind::Calls)
        {
            task_evidence = graph_evidence_ids(
                &task_evidence,
                &base.arcs,
                &self.stored.documents,
                &request.scope,
            );
        }
        let task_selected = !task_evidence.is_empty();
        if task_selected {
            candidates.candidates = task_evidence
                .iter()
                .filter_map(|node_id| {
                    let document = self
                        .stored
                        .documents
                        .iter()
                        .find(|document| document.node_id == *node_id)?;
                    Some(Candidate {
                        node_id: document.node_id,
                        qualified_name: document.qualified_name.clone(),
                        path: document.path.clone(),
                        span: Span {
                            start: document.span_start,
                            end: document.span_end,
                        },
                        provenance: CandidateProvenance::Syntax,
                        scores: ScoreComponents {
                            graph: if required_task_anchors.contains(node_id) {
                                0
                            } else {
                                50_000
                            },
                            ..ScoreComponents::default()
                        },
                        selection_reason: if required_task_anchors.contains(node_id) {
                            "task_evidence"
                        } else {
                            "graph_neighbor"
                        }
                        .to_owned(),
                    })
                })
                .collect();
        } else if request.scope.relation_kinds.contains(&RelationKind::Calls) {
            let call_nodes: std::collections::BTreeSet<_> = self
                .stored
                .documents
                .iter()
                .filter(|document| document.provenance == "CALLS")
                .map(|document| document.node_id)
                .collect();
            let has_call_candidate = candidates
                .candidates
                .iter()
                .any(|candidate| call_nodes.contains(&candidate.node_id));
            if has_call_candidate {
                candidates
                    .candidates
                    .retain(|candidate| call_nodes.contains(&candidate.node_id));
            }
        }
        let anchors: Vec<_> = candidates
            .candidates
            .iter()
            .map(|candidate| ResolvedAnchor {
                node_id: candidate.node_id,
                path: candidate.path.clone(),
                qualified_name: candidate.qualified_name.clone(),
            })
            .collect();
        let scoped_coverage = coverage_for_scope(&self.stored.coverage, &request.scope);
        let obligations = ObligationCompiler::compile(
            &request,
            &anchors,
            &scoped_coverage,
            Some(QueryClass::Locate),
        );
        let obligation_ids: Vec<_> = obligations
            .obligations
            .iter()
            .map(|obligation| obligation.id.clone())
            .collect();
        let neighbors = neighbor_map(&base.arcs, &request.scope);
        let records: Vec<_> = candidates
            .candidates
            .iter()
            .filter_map(|candidate| {
                let document = self
                    .stored
                    .documents
                    .iter()
                    .find(|document| document.node_id == candidate.node_id)?;
                Some(EvidenceRecord {
                    node_id: candidate.node_id,
                    path: candidate.path.clone(),
                    span_start: candidate.span.start,
                    span_end: candidate.span.end,
                    text: document.text.clone(),
                    obligation_ids: obligation_ids.clone(),
                    neighbors: neighbors
                        .get(&candidate.node_id)
                        .cloned()
                        .unwrap_or_default(),
                    uncertainty_penalty: 0,
                    provenance: document.provenance.clone(),
                })
            })
            .collect();
        let tokenizer = Tokenizer::o200k_base()
            .map_err(|error| RuntimeError::new("tokenizer", error.to_string()))?;
        let required_anchors = if task_selected {
            required_task_anchors
        } else {
            candidates
                .candidates
                .first()
                .map(|candidate| vec![candidate.node_id])
                .unwrap_or_default()
        };
        let mut initial_pack = EvidencePacker::pack(PackInput {
            candidates: &candidates,
            records,
            obligations: obligation_ids,
            required_anchors,
            allow_disconnected_required_anchors: task_selected,
            tokenizer: &tokenizer,
            budget: request.token_budget,
        });
        initial_pack.accounting.index_input_bytes = self.stored.index_input_bytes;
        initial_pack.accounting.probe_input_bytes = self.refresh_input_bytes;
        initial_pack
            .verify_accounting()
            .map_err(|error| RuntimeError::new("accounting", error.to_string()))?;
        let engine = CgcrEngine::new(NoopOracle, CostTable::default());
        let compiled = engine.compile(CompileRequest {
            obligations,
            initial_pack,
            pinned_snapshot: self.stored.snapshot.clone(),
            current_snapshot: self.stored.snapshot.clone(),
            pinned_source_hashes: self.stored.path_hashes.clone(),
            counterexamples: Vec::new(),
            budget: RemainingBudget::unlimited(),
            tokenizer,
        });
        Ok(OrientReport {
            snapshot: self.stored.snapshot.clone(),
            compiled,
        })
    }

    #[must_use]
    pub fn coverage_for_scope(&self, scope: &Scope) -> CoverageMetadata {
        coverage_for_scope(&self.stored.coverage, scope)
    }
}

fn parse_committed_tree(bytes: &[u8]) -> Result<BTreeMap<String, String>, RuntimeError> {
    let mut entries = BTreeMap::new();
    for record in bytes
        .split(|byte| *byte == 0)
        .filter(|record| !record.is_empty())
    {
        let separator = record
            .iter()
            .position(|byte| *byte == b'\t')
            .ok_or_else(|| RuntimeError::new("git_tree", "ls-tree record has no path"))?;
        let (metadata, path_with_separator) = record.split_at(separator);
        let path = &path_with_separator[1..];
        let mut fields = metadata.split(|byte| *byte == b' ');
        let _mode = fields.next();
        let kind = fields.next();
        let object = fields.next();
        if kind != Some(b"blob".as_slice()) {
            continue;
        }
        let object = object
            .and_then(|value| std::str::from_utf8(value).ok())
            .filter(|value| value.len() >= 40 && value.bytes().all(|byte| byte.is_ascii_hexdigit()))
            .ok_or_else(|| RuntimeError::new("git_tree", "ls-tree record has an invalid object"))?;
        entries.insert(
            String::from_utf8_lossy(path).into_owned(),
            object.to_owned(),
        );
    }
    Ok(entries)
}

struct GitBlobBatch {
    child: Child,
    stdin: Option<ChildStdin>,
    stdout: BufReader<ChildStdout>,
}

impl GitBlobBatch {
    fn spawn(root: &Path) -> Result<Self, RuntimeError> {
        let mut child = Command::new(crate::git_executable())
            .args(["cat-file", "--batch"])
            .current_dir(root)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|error| RuntimeError::new("git_spawn", error.to_string()))?;
        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| RuntimeError::new("git_spawn", "cat-file stdin is unavailable"))?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| RuntimeError::new("git_spawn", "cat-file stdout is unavailable"))?;
        Ok(Self {
            child,
            stdin: Some(stdin),
            stdout: BufReader::new(stdout),
        })
    }

    fn read_blob(&mut self, object: &str) -> Result<Vec<u8>, RuntimeError> {
        let stdin = self
            .stdin
            .as_mut()
            .ok_or_else(|| RuntimeError::new("git_batch", "cat-file stdin is closed"))?;
        writeln!(stdin, "{object}")
            .and_then(|()| stdin.flush())
            .map_err(|error| RuntimeError::new("git_batch", error.to_string()))?;
        let mut header = String::new();
        self.stdout
            .read_line(&mut header)
            .map_err(|error| RuntimeError::new("git_batch", error.to_string()))?;
        let mut fields = header.split_whitespace();
        let returned_object = fields.next();
        let kind = fields.next();
        let size = fields.next().and_then(|value| value.parse::<usize>().ok());
        if returned_object != Some(object) || kind != Some("blob") || size.is_none() {
            return Err(RuntimeError::new(
                "git_batch",
                format!("unexpected cat-file header: {}", header.trim()),
            ));
        }
        let mut source = vec![0; size.expect("validated blob size")];
        self.stdout
            .read_exact(&mut source)
            .map_err(|error| RuntimeError::new("git_batch", error.to_string()))?;
        let mut newline = [0_u8; 1];
        self.stdout
            .read_exact(&mut newline)
            .map_err(|error| RuntimeError::new("git_batch", error.to_string()))?;
        if newline != [b'\n'] {
            return Err(RuntimeError::new(
                "git_batch",
                "cat-file blob was not newline terminated",
            ));
        }
        Ok(source)
    }

    fn finish(mut self) -> Result<(), RuntimeError> {
        self.stdin.take();
        let status = self
            .child
            .wait()
            .map_err(|error| RuntimeError::new("git_batch", error.to_string()))?;
        if !status.success() {
            return Err(RuntimeError::new("git_exit", "git cat-file --batch failed"));
        }
        Ok(())
    }
}

fn refresh_status(bytes: &[u8]) -> Result<(String, BTreeSet<String>), RuntimeError> {
    let records: Vec<_> = bytes.split(|byte| *byte == 0).collect();
    let mut revision = None;
    let mut paths = BTreeSet::new();
    let mut cursor = 0;
    while cursor < records.len() {
        let record = records[cursor];
        if let Some(value) = record.strip_prefix(b"# branch.oid ") {
            revision = Some(String::from_utf8_lossy(value).into_owned());
        } else if record.starts_with(b"1 ") {
            if let Some(path) = record.splitn(9, |byte| *byte == b' ').nth(8) {
                paths.insert(String::from_utf8_lossy(path).into_owned());
            }
        } else if record.starts_with(b"2 ") {
            if let Some(path) = record.splitn(10, |byte| *byte == b' ').nth(9) {
                paths.insert(String::from_utf8_lossy(path).into_owned());
            }
            cursor += 1;
            if let Some(original) = records.get(cursor).filter(|path| !path.is_empty()) {
                paths.insert(String::from_utf8_lossy(original).into_owned());
            }
        } else if record.starts_with(b"u ") {
            if let Some(path) = record.splitn(11, |byte| *byte == b' ').nth(10) {
                paths.insert(String::from_utf8_lossy(path).into_owned());
            }
        } else if let Some(path) = record
            .strip_prefix(b"? ")
            .or_else(|| record.strip_prefix(b"! "))
        {
            paths.insert(String::from_utf8_lossy(path).into_owned());
        }
        cursor += 1;
    }
    let revision = revision.ok_or_else(|| {
        RuntimeError::new(
            "git_status",
            "git status did not report the current branch revision",
        )
    })?;
    Ok((revision, paths))
}

fn coverage_for_scope(coverage: &CoverageMetadata, scope: &Scope) -> CoverageMetadata {
    coverage_for_scope_with_matcher(coverage, scope, &mut path_in_scope)
}

fn coverage_for_scope_with_matcher<'a>(
    coverage: &'a CoverageMetadata,
    scope: &Scope,
    matches_scope: &mut impl FnMut(&'a str, &Scope) -> bool,
) -> CoverageMetadata {
    CoverageMetadata {
        excluded_paths: coverage
            .excluded_paths
            .iter()
            .filter(|path| matches_scope(path, scope))
            .cloned()
            .collect(),
        parser_error_ranges: coverage
            .parser_error_ranges
            .iter()
            .filter(|range| matches_scope(&range.path, scope))
            .cloned()
            .collect(),
        stale_paths: coverage
            .stale_paths
            .iter()
            .filter(|path| matches_scope(path, scope))
            .cloned()
            .collect(),
        traversal_truncated: coverage.traversal_truncated,
        dynamic_dispatch: coverage
            .dynamic_dispatch
            .iter()
            .filter(|location| matches_scope(dynamic_dispatch_path(location), scope))
            .cloned()
            .collect(),
    }
}

fn coverage_gap_page(coverage: &CoverageMetadata, offset: usize, limit: usize) -> Vec<Value> {
    coverage
        .excluded_paths
        .iter()
        .map(|path| json!({"code":"EXCLUDED_PATH","path":path}))
        .chain(coverage.parser_error_ranges.iter().map(|range| {
            json!({"code":"PARSER_ERROR_RANGE","path":range.path,"start":range.start,"end":range.end})
        }))
        .chain(
            coverage
                .stale_paths
                .iter()
                .map(|path| json!({"code":"STALE_PATH","path":path})),
        )
        .chain(coverage.dynamic_dispatch.iter().map(|location| {
            json!({"code":"DYNAMIC_DISPATCH","path":dynamic_dispatch_path(location),"location":location})
        }))
        .chain(
            coverage
                .traversal_truncated
                .then(|| json!({"code":"TRAVERSAL_TRUNCATED"})),
        )
        .skip(offset)
        .take(limit)
        .collect()
}

fn coverage_gap_count(coverage: &CoverageMetadata) -> usize {
    coverage.excluded_paths.len()
        + coverage.parser_error_ranges.len()
        + coverage.stale_paths.len()
        + coverage.dynamic_dispatch.len()
        + usize::from(coverage.traversal_truncated)
}

fn dynamic_dispatch_path(location: &str) -> &str {
    location
        .rsplit_once(':')
        .map_or(location, |(path, _span)| path)
}

struct ExtractedPath {
    rust_file: Option<cgrx_languages::RustFileFacts>,
    ts_file: Option<TsFileFacts>,
    documents: Vec<StoredDocument>,
    parser_error_ranges: Vec<SourceRange>,
    dynamic_dispatch: Vec<String>,
}

struct ExtractedSource {
    relative: String,
    hash: Hash32,
    extracted: ExtractedPath,
}

fn extract_sources_parallel(
    sources: &[(String, Vec<u8>)],
) -> Result<Vec<ExtractedSource>, RuntimeError> {
    if sources.is_empty() {
        return Ok(Vec::new());
    }
    let workers = std::thread::available_parallelism()
        .map_or(1, usize::from)
        .min(16)
        .min(sources.len());
    let chunk_size = sources.len().div_ceil(workers);
    let chunks = std::thread::scope(|scope| {
        let handles: Vec<_> = sources
            .chunks(chunk_size)
            .map(|chunk| {
                scope.spawn(move || {
                    chunk
                        .iter()
                        .map(|(relative, source)| {
                            Ok(ExtractedSource {
                                relative: relative.clone(),
                                hash: Hash32(*blake3::hash(source).as_bytes()),
                                extracted: extract_path(relative, source)?,
                            })
                        })
                        .collect::<Result<Vec<_>, RuntimeError>>()
                })
            })
            .collect();
        handles
            .into_iter()
            .map(|handle| {
                handle.join().map_err(|_| {
                    RuntimeError::new("extract_worker", "source extraction worker panicked")
                })?
            })
            .collect::<Result<Vec<_>, RuntimeError>>()
    })?;
    let mut extracted: Vec<_> = chunks.into_iter().flatten().collect();
    extracted.sort_by(|left, right| left.relative.cmp(&right.relative));
    Ok(extracted)
}

fn extract_path(relative: &str, source: &[u8]) -> Result<ExtractedPath, RuntimeError> {
    let relative_path = Path::new(relative);
    let ts_file = matches!(
        relative_path.extension().and_then(|value| value.to_str()),
        Some("ts" | "tsx")
    )
    .then(|| TsFileFacts::parse(relative, source));
    let pack = pack_for_path(relative_path)
        .ok_or_else(|| RuntimeError::new("unsupported_path", relative.to_owned()))?;
    let extraction = pack
        .extract(relative_path, source)
        .map_err(|error| RuntimeError::new("extract", error.to_string()))?;
    let go_package = extraction
        .package_span
        .and_then(|span| source.get(span.start..span.end))
        .and_then(|bytes| std::str::from_utf8(bytes).ok())
        .map(str::to_owned);
    let lexical_arrows: BTreeSet<_> = extraction.lexical_arrows.into_iter().collect();
    let symbols = extraction.symbols;
    let edges = extraction.edges;
    let unresolved = extraction.unresolved;
    let overload_names: BTreeSet<_> = unresolved
        .iter()
        .filter(|candidate| candidate.kind == UnresolvedKind::Overload)
        .filter_map(|candidate| declaration_name(&candidate.text))
        .collect();
    let mut documents = Vec::new();
    for symbol in &symbols {
        let text = source
            .get(symbol.span.start..symbol.span.end)
            .and_then(|bytes| std::str::from_utf8(bytes).ok())
            .unwrap_or(&symbol.name)
            .to_owned();
        documents.push(StoredDocument {
            rust_module_target: None,
            rust_self_target: None,
            ts_lexical_target: None,
            go_field_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: go_package.clone(),
            go_receiver_target: None,
            node_id: stable_node_id(relative, symbol.span, &symbol.name),
            qualified_name: symbol.name.clone(),
            path: relative.to_owned(),
            text,
            search_text: source
                .get(symbol.search_span.start..symbol.search_span.end)
                .map_or_else(String::new, |bytes| {
                    String::from_utf8_lossy(bytes).into_owned()
                }),
            span_start: symbol.span.start,
            span_end: symbol.span.end,
            body_start: symbol.search_span.start,
            body_end: symbol.search_span.end,
            provenance: "SYNTAX".to_owned(),
            semantic_tags: if lexical_arrows.contains(&symbol.span) {
                vec!["TS_LEXICAL_ARROW".to_owned()]
            } else {
                Vec::new()
            },
        });
    }
    for edge in edges {
        if edge.relation != LanguageRelation::Calls {
            continue;
        }
        let target = edge.target;
        let go_receiver_target = match edge.provenance {
            LanguageProvenance::GoSelfReceiver {
                package,
                receiver_type,
                target,
            } => {
                let source_text = |span: Span| {
                    String::from_utf8_lossy(&source[span.start..span.end]).into_owned()
                };
                Some(GoReceiverTarget {
                    package: source_text(package),
                    receiver_type: source_text(receiver_type),
                    path: relative.to_owned(),
                    symbol: source_text(target),
                    span_start: target.start,
                    span_end: target.end,
                })
            }
            LanguageProvenance::Syntax
            | LanguageProvenance::GoFieldReceiver { .. }
            | LanguageProvenance::GoImport { .. }
            | LanguageProvenance::TsLexical { .. }
            | LanguageProvenance::RustSelf { .. }
            | LanguageProvenance::RustModule { .. } => None,
        };
        let is_go_receiver = go_receiver_target.is_some();
        let go_import_path =
            if let LanguageProvenance::GoImport { import_path, .. } = edge.provenance {
                Some(
                    String::from_utf8_lossy(&source[import_path.start..import_path.end])
                        .trim_matches(['"', '`'])
                        .to_owned(),
                )
            } else {
                None
            };
        let slice = slice_source(
            source,
            ByteRange::new(edge.span.start, edge.span.end),
            ContextWindow::lines(0),
        );
        documents.push(StoredDocument {
            go_field_target: match edge.provenance {
                LanguageProvenance::GoFieldReceiver {
                    package,
                    caller,
                    receiver_type,
                    field,
                    field_type,
                    target,
                } => {
                    let range = |span: Span| ByteRange::new(span.start, span.end);
                    Some(Box::new(GoFieldTarget {
                        package: String::from_utf8_lossy(&source[package.start..package.end])
                            .into_owned(),
                        caller: range(caller),
                        receiver_type: range(receiver_type),
                        field: range(field),
                        field_type: range(field_type),
                        target: range(target),
                    }))
                }
                _ => None,
            },
            rust_module_target: match edge.provenance {
                LanguageProvenance::RustModule { caller, target } => Some(TsLexicalTarget {
                    caller: ByteRange::new(caller.start, caller.end),
                    target: ByteRange::new(target.start, target.end),
                }),
                _ => None,
            },
            rust_self_target: match edge.provenance {
                LanguageProvenance::RustSelf {
                    owner,
                    implementation,
                    target_implementation,
                    caller,
                    target,
                } => {
                    let range = |s: Span| ByteRange::new(s.start, s.end);
                    Some(Box::new(RustSelfTarget {
                        owner: range(owner),
                        implementation: range(implementation),
                        target_implementation: Some(range(target_implementation)),
                        caller: range(caller),
                        target: range(target),
                    }))
                }
                _ => None,
            },
            ts_lexical_target: match edge.provenance {
                LanguageProvenance::TsLexical { target, caller } => Some(TsLexicalTarget {
                    target: ByteRange::new(target.start, target.end),
                    caller: ByteRange::new(caller.start, caller.end),
                }),
                _ => None,
            },
            go_import_path,
            go_import_explicit_alias: matches!(
                edge.provenance,
                LanguageProvenance::GoImport {
                    explicit_alias: true,
                    ..
                }
            ),
            go_package: None,
            go_receiver_target,
            node_id: stable_node_id(relative, edge.span, &format!("call:{target}")),
            qualified_name: target.clone(),
            path: relative.to_owned(),
            text: String::from_utf8_lossy(&slice.bytes).into_owned(),
            search_text: String::from_utf8_lossy(&slice.bytes).into_owned(),
            span_start: edge.span.start,
            span_end: edge.span.end,
            body_start: edge.span.start,
            body_end: edge.span.end,
            provenance: "CALLS".to_owned(),
            semantic_tags: if matches!(edge.provenance, LanguageProvenance::RustModule { .. }) {
                vec!["EXACT_CALL".to_owned(), "RUST_MODULE_CALL".to_owned()]
            } else if matches!(edge.provenance, LanguageProvenance::RustSelf { .. }) {
                vec!["EXACT_CALL".to_owned(), "RUST_SELF_CALL".to_owned()]
            } else if matches!(edge.provenance, LanguageProvenance::GoFieldReceiver { .. }) {
                vec!["EXACT_CALL".to_owned(), "GO_FIELD_CALL".to_owned()]
            } else if matches!(edge.provenance, LanguageProvenance::TsLexical { .. }) {
                vec!["EXACT_CALL".to_owned(), "TS_LEXICAL_CALL".to_owned()]
            } else if is_go_receiver {
                vec!["EXACT_CALL".to_owned(), "GO_SELF_CALL".to_owned()]
            } else if overload_names.contains(&target) {
                vec!["EXACT_CALL".to_owned(), "OVERLOAD_CALL".to_owned()]
            } else {
                vec!["EXACT_CALL".to_owned()]
            },
        });
        if edge.context_span != edge.span {
            let context = slice_source(
                source,
                ByteRange::new(edge.context_span.start, edge.context_span.end),
                ContextWindow::lines(0),
            );
            documents.push(StoredDocument {
                rust_module_target: None,
                rust_self_target: None,
                ts_lexical_target: None,
                go_field_target: None,
                go_import_path: None,
                go_import_explicit_alias: false,
                go_package: None,
                go_receiver_target: None,
                node_id: stable_node_id(
                    relative,
                    edge.context_span,
                    &format!("statement:{target}"),
                ),
                qualified_name: target,
                path: relative.to_owned(),
                text: String::from_utf8_lossy(&context.bytes).into_owned(),
                search_text: String::from_utf8_lossy(&context.bytes).into_owned(),
                span_start: edge.context_span.start,
                span_end: edge.context_span.end,
                body_start: edge.context_span.start,
                body_end: edge.context_span.end,
                provenance: "CALLS".to_owned(),
                semantic_tags: vec!["STATEMENT_CALL".to_owned()],
            });
        }
    }
    let ts_receiver_spans: BTreeSet<_> = ts_file
        .as_ref()
        .into_iter()
        .flat_map(|facts| facts.receiver_calls.iter().map(|receiver| receiver.call))
        .collect();
    if let Some(facts) = ts_file.as_ref() {
        for site in &facts.sites {
            let tag = match &site.binding {
                SiteBinding::Candidate(_) => "TS_IMPORT_CALL",
                SiteBinding::Rejected => "TS_IMPORT_REJECTED",
                SiteBinding::NotImport => continue,
            };
            if let Some(document) = documents.iter_mut().find(|document| {
                document.provenance == "CALLS"
                    && document.span_start == site.call[0]
                    && document.span_end == site.call[1]
            }) {
                document
                    .semantic_tags
                    .retain(|value| value != "DYNAMIC_DISPATCH");
                if !document.semantic_tags.iter().any(|value| value == tag) {
                    document.semantic_tags.push(tag.to_owned());
                }
                continue;
            }
            let SiteBinding::Candidate(import) = &site.binding else {
                continue;
            };
            let span = Span {
                start: site.call[0],
                end: site.call[1],
            };
            let slice = slice_source(
                source,
                ByteRange::new(span.start, span.end),
                ContextWindow::lines(0),
            );
            documents.push(StoredDocument {
                rust_module_target: None,
                rust_self_target: None,
                ts_lexical_target: None,
                go_field_target: None,
                go_import_path: None,
                go_import_explicit_alias: false,
                go_package: None,
                go_receiver_target: None,
                node_id: stable_node_id(relative, span, &format!("call:{}", import.local)),
                qualified_name: import.local.clone(),
                path: relative.to_owned(),
                text: String::from_utf8_lossy(&slice.bytes).into_owned(),
                search_text: String::from_utf8_lossy(&slice.bytes).into_owned(),
                span_start: span.start,
                span_end: span.end,
                body_start: span.start,
                body_end: span.end,
                provenance: "CALLS".to_owned(),
                semantic_tags: vec!["EXACT_CALL".to_owned(), tag.to_owned()],
            });
        }
        for receiver in &facts.receiver_calls {
            let span = Span {
                start: receiver.call[0],
                end: receiver.call[1],
            };
            if let Some(document) = documents.iter_mut().find(|document| {
                document.provenance == "CALLS"
                    && document.span_start == span.start
                    && document.span_end == span.end
                    && document.qualified_name == receiver.method
            }) {
                document
                    .semantic_tags
                    .retain(|value| value != "DYNAMIC_DISPATCH");
                for tag in ["EXACT_CALL", "TS_RECEIVER_CALL"] {
                    if !document.semantic_tags.iter().any(|value| value == tag) {
                        document.semantic_tags.push(tag.to_owned());
                    }
                }
                continue;
            }
            let slice = slice_source(
                source,
                ByteRange::new(span.start, span.end),
                ContextWindow::lines(0),
            );
            documents.push(StoredDocument {
                rust_module_target: None,
                rust_self_target: None,
                ts_lexical_target: None,
                go_field_target: None,
                go_import_path: None,
                go_import_explicit_alias: false,
                go_package: None,
                go_receiver_target: None,
                node_id: stable_node_id(relative, span, &format!("call:{}", receiver.method)),
                qualified_name: receiver.method.clone(),
                path: relative.to_owned(),
                text: String::from_utf8_lossy(&slice.bytes).into_owned(),
                search_text: String::from_utf8_lossy(&slice.bytes).into_owned(),
                span_start: span.start,
                span_end: span.end,
                body_start: span.start,
                body_end: span.end,
                provenance: "CALLS".to_owned(),
                semantic_tags: vec!["EXACT_CALL".to_owned(), "TS_RECEIVER_CALL".to_owned()],
            });
        }
    }
    let mut unresolved_by_span = BTreeMap::<(usize, usize), Vec<UnresolvedKind>>::new();
    for candidate in &unresolved {
        if ts_receiver_spans.contains(&[candidate.span.start, candidate.span.end]) {
            continue;
        }
        unresolved_by_span
            .entry((candidate.span.start, candidate.span.end))
            .or_default()
            .push(candidate.kind);
    }
    for ((start, end), mut kinds) in unresolved_by_span {
        kinds.sort();
        kinds.dedup();
        if kinds.iter().any(|kind| {
            matches!(
                kind,
                UnresolvedKind::DynamicProperty | UnresolvedKind::Dispatch
            )
        }) {
            let span = Span { start, end };
            let text = source.get(start..end).map_or_else(String::new, |bytes| {
                String::from_utf8_lossy(bytes).into_owned()
            });
            let semantic_tags = kinds
                .iter()
                .filter_map(|kind| match kind {
                    UnresolvedKind::DynamicProperty => Some("DYNAMIC_PROPERTY".to_owned()),
                    UnresolvedKind::Dispatch => Some("DYNAMIC_DISPATCH".to_owned()),
                    _ => None,
                })
                .collect();
            documents.push(StoredDocument {
                rust_module_target: None,
                rust_self_target: None,
                ts_lexical_target: None,
                go_field_target: None,
                go_import_path: None,
                go_import_explicit_alias: false,
                go_package: None,
                go_receiver_target: None,
                node_id: stable_node_id(relative, span, &format!("unresolved:{text}")),
                qualified_name: format!("unresolved:{text}"),
                path: relative.to_owned(),
                text,
                search_text: String::new(),
                span_start: start,
                span_end: end,
                body_start: start,
                body_end: end,
                provenance: "CALLS".to_owned(),
                semantic_tags,
            });
        }
    }
    for candidate in unresolved
        .iter()
        .filter(|candidate| candidate.kind == UnresolvedKind::Decorator)
    {
        let Some(symbol) = symbols
            .iter()
            .filter(|symbol| symbol.span.start >= candidate.span.end)
            .min_by_key(|symbol| symbol.span.start)
        else {
            continue;
        };
        let Some(span) = declaration_span(source, symbol.span, relative_path) else {
            continue;
        };
        let text = String::from_utf8_lossy(&source[span.start..span.end]).into_owned();
        documents.push(StoredDocument {
            rust_module_target: None,
            rust_self_target: None,
            ts_lexical_target: None,
            go_field_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: None,
            go_receiver_target: None,
            node_id: stable_node_id(relative, span, &format!("route:{text}")),
            qualified_name: symbol.name.clone(),
            path: relative.to_owned(),
            text,
            search_text: String::new(),
            span_start: span.start,
            span_end: span.end,
            body_start: span.start,
            body_end: span.end,
            provenance: "ROUTE_HANDLER".to_owned(),
            semantic_tags: vec!["DECORATOR_HANDLER".to_owned()],
        });
    }
    for span in implements_spans(source, relative_path) {
        let text = String::from_utf8_lossy(&source[span.start..span.end]).into_owned();
        documents.push(StoredDocument {
            rust_module_target: None,
            rust_self_target: None,
            ts_lexical_target: None,
            go_field_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: None,
            go_receiver_target: None,
            node_id: stable_node_id(relative, span, &format!("implements:{text}")),
            qualified_name: text.clone(),
            path: relative.to_owned(),
            text,
            search_text: String::new(),
            span_start: span.start,
            span_end: span.end,
            body_start: span.start,
            body_end: span.end,
            provenance: "IMPLEMENTS".to_owned(),
            semantic_tags: vec!["IMPLEMENTS".to_owned()],
        });
    }
    let dynamic_dispatch = outer_dynamic_spans(&unresolved)
        .into_iter()
        .map(|span| format!("{}:{}-{}", relative, span.start, span.end))
        .collect();
    Ok(ExtractedPath {
        rust_file: extraction.rust_file,
        ts_file,
        documents,
        parser_error_ranges: extraction
            .parser_error_ranges
            .into_iter()
            .map(|span| SourceRange {
                path: relative.to_owned(),
                start: span.start,
                end: span.end,
            })
            .collect(),
        dynamic_dispatch,
    })
}

fn outer_dynamic_spans(unresolved: &[cgrx_languages::Unresolved]) -> Vec<Span> {
    let spans: BTreeSet<_> = unresolved
        .iter()
        .filter(|candidate| {
            matches!(
                candidate.kind,
                UnresolvedKind::DynamicProperty | UnresolvedKind::Dispatch
            )
        })
        .map(|candidate| candidate.span)
        .collect();
    spans
        .iter()
        .copied()
        .filter(|span| {
            !spans
                .iter()
                .any(|outer| outer != span && outer.start <= span.start && outer.end >= span.end)
        })
        .collect()
}

fn is_ts_resolution_config(path: &Path) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .is_some_and(|name| matches!(name, "tsconfig.json" | "jsconfig.json"))
}

fn is_ts_inventory_path(path: &Path) -> bool {
    is_ts_resolution_config(path)
        || path.file_name().and_then(|name| name.to_str()) == Some("package.json")
        || matches!(
            path.extension().and_then(|extension| extension.to_str()),
            Some("js" | "jsx" | "json")
        )
}

fn ts_resolution_config_supported(source: &[u8]) -> bool {
    let Ok(Value::Object(root)) = serde_json::from_slice(source) else {
        return false;
    };
    if root.contains_key("extends") || root.contains_key("references") {
        return false;
    }
    let Some(options) = root.get("compilerOptions") else {
        return true;
    };
    let Value::Object(options) = options else {
        return false;
    };
    const RESOLUTION_KEYS: &[&str] = &[
        "allowJs",
        "baseUrl",
        "customConditions",
        "moduleResolution",
        "moduleSuffixes",
        "paths",
        "resolveJsonModule",
        "rootDirs",
    ];
    !RESOLUTION_KEYS.iter().any(|key| options.contains_key(*key))
}

fn ts_config_supported_for(path: &str, configs: &BTreeMap<String, TsResolutionConfig>) -> bool {
    ts_config::nearest(path, configs).is_none_or(|config| config.supported)
}

// Only immutable specifiers are deduplicated, within one source/pass. File,
// config and directory witnesses are still re-observed on every refresh.
fn ts_module_specifiers(facts: &TsFileFacts) -> BTreeSet<&str> {
    facts
        .imports
        .iter()
        .map(|import| import.module.as_str())
        .chain(facts.exports.values().flatten().filter_map(|export| {
            if let cgrx_languages::ts_imports::Export::From { module, .. } = export {
                Some(module.as_str())
            } else {
                None
            }
        }))
        .collect()
}

fn ts_config_modules(
    files: &BTreeMap<String, StoredTsFileFacts>,
    configs: &BTreeMap<String, TsResolutionConfig>,
) -> BTreeMap<(String, String), String> {
    let mut modules = BTreeMap::new();
    for (path, stored) in files {
        for module in ts_module_specifiers(&stored.facts) {
            if let Some(mapped) = ts_config::mapped(path, module, configs) {
                modules.insert((path.clone(), module.to_owned()), mapped);
            }
        }
    }
    modules
}

fn ts_inventory_candidates(ts_files: &BTreeMap<String, StoredTsFileFacts>) -> BTreeSet<String> {
    #[cfg(test)]
    ts_inventory_cache_tests::INVENTORY_BUILDS.with(|n| n.set(n.get() + 1));
    let mut paths = BTreeSet::new();
    for (caller, stored) in ts_files.iter().filter(|(path, _)| {
        path.ends_with(".ts") && !path.ends_with(".d.ts") || path.ends_with(".tsx")
    }) {
        paths.insert(caller.clone());
        let mut directory: Vec<_> = caller.split('/').collect();
        directory.pop();
        let mut ancestor = directory.clone();
        loop {
            let prefix = ancestor.join("/");
            for name in ["tsconfig.json", "jsconfig.json"] {
                paths.insert(if prefix.is_empty() {
                    name.to_owned()
                } else {
                    format!("{prefix}/{name}")
                });
            }
            if ancestor.pop().is_none() {
                break;
            }
        }
        for module in ts_module_specifiers(&stored.facts) {
            #[cfg(test)]
            ts_inventory_cache_tests::MODULE_EXPANSIONS.with(|n| n.set(n.get() + 1));
            paths.extend(cgrx_languages::ts_imports::module_candidates(
                caller, module,
            ));
        }
    }
    paths
}

fn ts_paths_portable_for(
    dependencies: &[String],
    ts_files: &BTreeMap<String, StoredTsFileFacts>,
    configs: &BTreeMap<String, TsResolutionConfig>,
) -> bool {
    let dependency_files: BTreeMap<_, _> = dependencies
        .iter()
        .filter_map(|path| {
            ts_files
                .get(path)
                .map(|facts| (path.clone(), facts.clone()))
        })
        .collect();
    let mut expected = ts_inventory_candidates(&dependency_files);
    for ((from, _), mapped) in ts_config_modules(&dependency_files, configs) {
        expected.extend(cgrx_languages::ts_imports::module_candidates(
            &from, &mapped,
        ));
    }
    let mut folded = BTreeMap::<String, &str>::new();
    for path in &expected {
        let key = path.to_ascii_lowercase();
        if folded.insert(key, path).is_some_and(|prior| prior != path) {
            return false;
        }
    }
    ts_files.keys().all(|actual| {
        folded
            .get(&actual.to_ascii_lowercase())
            .is_none_or(|expected| *expected == actual)
    })
}

fn store_ts_presence_blocker(
    relative: &str,
    marker: Hash32,
    path_hashes: &mut BTreeMap<String, Hash32>,
    ts_files: &mut BTreeMap<String, StoredTsFileFacts>,
    configs: &mut BTreeMap<String, TsResolutionConfig>,
) {
    if is_ts_resolution_config(Path::new(relative)) {
        configs.insert(relative.to_owned(), TsResolutionConfig::default());
    }
    ts_files.insert(
        relative.to_owned(),
        StoredTsFileFacts {
            source_hash: marker,
            facts: TsFileFacts::default(),
            inventory_only: true,
        },
    );
    path_hashes.insert(relative.to_owned(), marker);
}

fn scan_ts_inventory(
    root: &Path,
    path_hashes: &mut BTreeMap<String, Hash32>,
    ts_files: &mut BTreeMap<String, StoredTsFileFacts>,
    configs: &mut BTreeMap<String, TsResolutionConfig>,
) -> Result<(bool, Vec<(String, Hash32)>), RuntimeError> {
    let mut directory_cache = TsDirectoryCache::default();
    let mut candidates = ts_inventory_candidates(ts_files);
    let (collected_configs, config_paths, config_witness) =
        ts_config::collect(root, &candidates, &mut directory_cache);
    #[cfg(test)]
    ts_config::tests::after_collect(root);
    let mut changed = *configs != collected_configs;
    *configs = collected_configs;
    candidates.extend(config_paths.iter().cloned());
    for ((from, _), mapped) in ts_config_modules(ts_files, configs) {
        candidates.extend(cgrx_languages::ts_imports::module_candidates(
            &from, &mapped,
        ));
    }
    let mut invalid_sources = Vec::new();
    let mut nested_boundary_cache = BTreeMap::new();
    for relative in candidates {
        let absolute = root.join(&relative);
        let metadata = match fs::symlink_metadata(&absolute) {
            Ok(metadata) => metadata,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                if ts_files
                    .get(&relative)
                    .is_some_and(|stored| !stored.inventory_only)
                {
                    invalid_sources.push((
                        relative,
                        Hash32(*blake3::hash(b"CGRX_TS_MISSING_SOURCE").as_bytes()),
                    ));
                    continue;
                }
                if ts_files
                    .get(&relative)
                    .is_some_and(|stored| stored.inventory_only)
                {
                    ts_files.remove(&relative);
                    path_hashes.remove(&relative);
                    configs.remove(&relative);
                    changed = true;
                }
                continue;
            }
            Err(_) => {
                let marker = Hash32(*blake3::hash(b"CGRX_TS_UNREADABLE_SOURCE").as_bytes());
                if ts_files
                    .get(&relative)
                    .is_some_and(|stored| !stored.inventory_only)
                {
                    invalid_sources.push((relative, marker));
                } else {
                    store_ts_presence_blocker(&relative, marker, path_hashes, ts_files, configs);
                    changed = true;
                }
                continue;
            }
        };
        let plain = ts_path_is_plain(root, Path::new(&relative), &mut directory_cache);
        if ts_files
            .get(&relative)
            .is_some_and(|stored| !stored.inventory_only)
        {
            if !plain || !metadata.is_file() {
                invalid_sources.push((
                    relative,
                    Hash32(*blake3::hash(b"CGRX_TS_UNSUPPORTED_PATH_KIND").as_bytes()),
                ));
                continue;
            }
            let Ok(source) = fs::read(&absolute) else {
                invalid_sources.push((
                    relative,
                    Hash32(*blake3::hash(b"CGRX_TS_UNREADABLE_SOURCE").as_bytes()),
                ));
                continue;
            };
            let hash = Hash32(*blake3::hash(&source).as_bytes());
            if ts_files.get(&relative).map(|stored| stored.source_hash) != Some(hash) {
                invalid_sources.push((relative, hash));
            }
            continue;
        }
        let nested =
            crosses_nested_git_boundary(root, Path::new(&relative), &mut nested_boundary_cache);
        let source = if !plain || metadata.file_type().is_symlink() || !metadata.is_file() || nested
        {
            b"CGRX_TS_UNSUPPORTED_PATH_KIND".to_vec()
        } else {
            fs::read(&absolute).unwrap_or_else(|_| b"CGRX_TS_UNREADABLE_SOURCE".to_vec())
        };
        // Files discovered only through the filesystem (including ignored and
        // post-status races) are presence blockers, never traversable proof.
        let facts = TsFileFacts::default();
        let hash = Hash32(*blake3::hash(&source).as_bytes());
        let current = ts_files.get(&relative);
        if current.map(|stored| stored.source_hash) != Some(hash) {
            let inventory_only = current.is_none_or(|stored| stored.inventory_only);
            ts_files.insert(
                relative.clone(),
                StoredTsFileFacts {
                    source_hash: hash,
                    facts,
                    inventory_only,
                },
            );
            path_hashes.insert(relative.clone(), hash);
            changed = true;
        }
    }
    // Configs read during discovery must still equal the bytes inventoried in
    // this pass; a race invalidates proof rather than retargeting stale candidates.
    changed |=
        ts_config::validate_final(root, configs, path_hashes, &config_witness, |p| fs::read(p));
    Ok((changed, invalid_sources))
}

// Pass-local only: do not retain filesystem absence/presence across refreshes.
#[derive(Default)]
struct TsDirectoryCache {
    entries: BTreeMap<PathBuf, (SourceFingerprint, BTreeSet<std::ffi::OsString>)>,
}

impl TsDirectoryCache {
    fn contains_exact(&mut self, directory: &Path, name: &std::ffi::OsStr) -> bool {
        let Ok(metadata) = fs::symlink_metadata(directory) else {
            self.entries.remove(directory);
            return false;
        };
        if !metadata.is_dir() || metadata.file_type().is_symlink() {
            self.entries.remove(directory);
            return false;
        }
        let fingerprint = source_fingerprint(&metadata);
        if let Some((cached, names)) = self.entries.get(directory)
            && *cached == fingerprint
        {
            return names.contains(name);
        }
        self.entries.remove(directory);
        #[cfg(test)]
        ts_inventory_cache_tests::DIRECTORY_READS.with(|count| count.set(count.get() + 1));
        let Ok(entries) = fs::read_dir(directory) else {
            return false;
        };
        let names: std::io::Result<BTreeSet<_>> = entries
            .map(|entry| entry.map(|entry| entry.file_name()))
            .collect();
        let Ok(names) = names else {
            return false;
        };
        // An enumeration racing with a directory update cannot prove identity.
        if !fs::symlink_metadata(directory)
            .is_ok_and(|after| source_fingerprint(&after) == fingerprint)
        {
            return false;
        }
        let exact = names.contains(name);
        self.entries
            .insert(directory.to_path_buf(), (fingerprint, names));
        exact
    }
}

fn ts_path_is_plain(root: &Path, relative: &Path, cache: &mut TsDirectoryCache) -> bool {
    let mut current = root.to_path_buf();
    for component in relative.components() {
        let std::path::Component::Normal(name) = component else {
            return false;
        };
        if !cache.contains_exact(&current, name) {
            return false;
        }
        current.push(name);
        let Ok(metadata) = fs::symlink_metadata(&current) else {
            return false;
        };
        if metadata.file_type().is_symlink() {
            return false;
        }
    }
    true
}

fn remove_path(stored: &mut StoredIndex, path: &str) {
    stored.path_hashes.remove(path);
    stored.rust_files.remove(path);
    stored.ts_files.remove(path);
    stored.ts_resolution_configs.remove(path);
    stored.coverage.stale_paths.retain(|stale| stale != path);
    if Path::new(path)
        .file_name()
        .is_some_and(|name| name == "Cargo.toml")
    {
        let dir = Path::new(path)
            .parent()
            .unwrap_or(Path::new(""))
            .to_string_lossy();
        stored.cargo_manifests.remove(dir.as_ref());
    }
    stored.documents.retain(|document| document.path != path);
    stored
        .coverage
        .parser_error_ranges
        .retain(|range| range.path != path);
    let prefix = format!("{path}:");
    stored
        .coverage
        .dynamic_dispatch
        .retain(|location| !location.starts_with(&prefix));
}

fn source_fingerprint(metadata: &fs::Metadata) -> SourceFingerprint {
    SourceFingerprint {
        device: metadata.dev(),
        inode: metadata.ino(),
        length: metadata.size(),
        modified_seconds: metadata.mtime(),
        modified_nanoseconds: metadata.mtime_nsec(),
        changed_seconds: metadata.ctime(),
        changed_nanoseconds: metadata.ctime_nsec(),
    }
}

fn crosses_nested_git_boundary(
    root: &Path,
    relative: &Path,
    cache: &mut BTreeMap<PathBuf, bool>,
) -> bool {
    let Some(parent) = relative.parent() else {
        return false;
    };
    let mut prefix = PathBuf::new();
    for component in parent.components() {
        let std::path::Component::Normal(component) = component else {
            return true;
        };
        prefix.push(component);
        let boundary = *cache
            .entry(prefix.clone())
            .or_insert_with(|| root.join(&prefix).join(".git").exists());
        if boundary {
            return true;
        }
    }
    false
}

fn expand_untracked_directories(
    root: &Path,
    discovered: BTreeSet<String>,
) -> Result<UntrackedScanCache, RuntimeError> {
    let mut expanded = BTreeSet::new();
    let mut watched_metadata = BTreeMap::new();
    watch_scan_path(root, Path::new(".gitignore"), &mut watched_metadata)?;
    let mut ignored = GitIgnoreMatcher::spawn(root)?;
    let mut remaining = UNTRACKED_SCAN_ENTRY_LIMIT;
    let mut truncated = false;
    for relative in &discovered {
        let absolute = root.join(relative);
        if fs::symlink_metadata(&absolute).is_ok_and(|metadata| metadata.file_type().is_symlink()) {
            expanded.insert(relative.clone());
            continue;
        }
        if absolute.is_dir() {
            if remaining == 0 {
                truncated = true;
                continue;
            }
            truncated |= collect_untracked_sources(
                root,
                &absolute,
                &mut ignored,
                &mut remaining,
                &mut watched_metadata,
                &mut expanded,
            )?;
        } else {
            expanded.insert(relative.clone());
        }
    }
    ignored.finish()?;
    Ok(UntrackedScanCache {
        discovered,
        expanded,
        watched_metadata,
        truncated,
    })
}

fn collect_untracked_sources(
    root: &Path,
    directory: &Path,
    ignored: &mut GitIgnoreMatcher,
    remaining: &mut usize,
    watched_metadata: &mut BTreeMap<String, SourceFingerprint>,
    paths: &mut BTreeSet<String>,
) -> Result<bool, RuntimeError> {
    let relative_directory = directory
        .strip_prefix(root)
        .map_err(|error| RuntimeError::new("path", error.to_string()))?;
    watch_scan_path(root, relative_directory, watched_metadata)?;
    if directory.join(".git").exists() {
        return Ok(false);
    }
    let mut entries = fs::read_dir(directory)
        .map_err(|error| RuntimeError::new("source_read", error.to_string()))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| RuntimeError::new("source_read", error.to_string()))?;
    entries.sort_by_key(|entry| entry.file_name());
    for entry in entries {
        let Some(next_remaining) = remaining.checked_sub(1) else {
            return Ok(true);
        };
        *remaining = next_remaining;
        let file_type = entry
            .file_type()
            .map_err(|error| RuntimeError::new("source_read", error.to_string()))?;
        if file_type.is_symlink() {
            continue;
        }
        let path = entry.path();
        let relative = path
            .strip_prefix(root)
            .map_err(|error| RuntimeError::new("path", error.to_string()))?;
        let portable = relative
            .to_str()
            .ok_or_else(|| RuntimeError::new("path", "source path is not UTF-8"))?
            .replace('\\', "/");
        if entry.file_name() == ".gitignore" {
            watch_scan_path(root, relative, watched_metadata)?;
        }
        if ignored.is_ignored(&portable)? {
            continue;
        }
        if file_type.is_dir() {
            if collect_untracked_sources(root, &path, ignored, remaining, watched_metadata, paths)?
            {
                return Ok(true);
            }
            continue;
        }
        if !file_type.is_file() {
            continue;
        }
        if pack_for_path(relative).is_none()
            && relative
                .file_name()
                .is_none_or(|name| name != "go.mod" && name != "Cargo.toml")
        {
            continue;
        }
        paths.insert(portable);
    }
    Ok(false)
}

fn watch_scan_path(
    root: &Path,
    relative: &Path,
    watched: &mut BTreeMap<String, SourceFingerprint>,
) -> Result<(), RuntimeError> {
    let absolute = root.join(relative);
    let Ok(metadata) = fs::metadata(&absolute) else {
        return Ok(());
    };
    let portable = relative
        .to_str()
        .ok_or_else(|| RuntimeError::new("path", "source path is not UTF-8"))?
        .replace('\\', "/");
    watched.insert(portable, source_fingerprint(&metadata));
    Ok(())
}

struct GitIgnoreMatcher {
    child: Child,
    stdin: Option<ChildStdin>,
    stdout: BufReader<ChildStdout>,
}

impl GitIgnoreMatcher {
    fn spawn(root: &Path) -> Result<Self, RuntimeError> {
        let mut child = Command::new(crate::git_executable())
            .args(["check-ignore", "-z", "-v", "-n", "--stdin"])
            .current_dir(root)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|error| RuntimeError::new("git", error.to_string()))?;
        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| RuntimeError::new("git", "git check-ignore stdin unavailable"))?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| RuntimeError::new("git", "git check-ignore stdout unavailable"))?;
        Ok(Self {
            child,
            stdin: Some(stdin),
            stdout: BufReader::new(stdout),
        })
    }

    fn is_ignored(&mut self, path: &str) -> Result<bool, RuntimeError> {
        let stdin = self
            .stdin
            .as_mut()
            .ok_or_else(|| RuntimeError::new("git", "git check-ignore stdin unavailable"))?;
        stdin
            .write_all(path.as_bytes())
            .and_then(|()| stdin.write_all(&[0]))
            .and_then(|()| stdin.flush())
            .map_err(|error| RuntimeError::new("git", error.to_string()))?;
        let mut fields = Vec::with_capacity(4);
        for _ in 0..4 {
            let mut field = Vec::new();
            self.stdout
                .read_until(0, &mut field)
                .map_err(|error| RuntimeError::new("git", error.to_string()))?;
            if field.pop() != Some(0) {
                return Err(RuntimeError::new(
                    "git",
                    "git check-ignore returned an incomplete response",
                ));
            }
            fields.push(field);
        }
        Ok(!fields[0].is_empty() && !fields[2].starts_with(b"!"))
    }

    fn finish(mut self) -> Result<(), RuntimeError> {
        self.stdin.take();
        let status = self
            .child
            .wait()
            .map_err(|error| RuntimeError::new("git", error.to_string()))?;
        if !status.success() && status.code() != Some(1) {
            return Err(RuntimeError::new(
                "git",
                "git check-ignore failed while filtering untracked sources",
            ));
        }
        Ok(())
    }
}

fn normalize_stored(stored: &mut StoredIndex) {
    for document in &mut stored.documents {
        if document.provenance == "SYNTAX" && document.body_start == 0 && document.body_end == 0 {
            document.body_start = document.span_start;
            document.body_end = usize::MAX;
        }
    }
    stored.documents.sort_by(|left, right| {
        (&left.path, left.span_start, left.node_id).cmp(&(
            &right.path,
            right.span_start,
            right.node_id,
        ))
    });
    stored.documents.dedup_by_key(|document| document.node_id);
    stored.coverage.excluded_paths.sort();
    stored.coverage.excluded_paths.dedup();
    stored.coverage.parser_error_ranges.sort();
    stored.coverage.parser_error_ranges.dedup();
    stored.coverage.dynamic_dispatch.sort();
    stored.coverage.dynamic_dispatch.dedup();
    stored.coverage.stale_paths.sort();
    stored.coverage.stale_paths.dedup();
    if stored.arcs.iter().any(|arc| arc.evidence.is_none()) {
        let mut migrated = rebuild_arcs_with_cargo(
            &stored.documents,
            &stored.path_hashes,
            &stored.go_modules,
            &stored.cargo_manifests,
            &stored.rust_files,
            &stored.ts_files,
            &stored.ts_resolution_configs,
        );
        migrated.extend(
            stored
                .arcs
                .iter()
                .filter(|arc| arc.evidence.is_some())
                .cloned(),
        );
        migrated.sort_by_key(|arc| (arc.source, arc.target, arc.kind, arc.evidence.clone()));
        migrated.dedup();
        stored.arcs = migrated;
    }
    refresh_qualified_call_gaps(stored);
}

// Qualified Go/Rust syntax alone is not a proof. Keep a recorded gap until
// cross-file package identity resolves; refresh recalculates even when only
// the target's package clause changed and every symbol span stayed identical.
fn refresh_qualified_call_gaps(stored: &mut StoredIndex) {
    let sites: BTreeSet<_> = stored
        .documents
        .iter()
        .filter(|doc| {
            doc.go_import_path.is_some()
                || doc
                    .semantic_tags
                    .iter()
                    .any(|tag| tag == "TS_IMPORT_CALL" || tag == "TS_IMPORT_REJECTED")
                || doc.path.ends_with(".rs")
                    && doc.provenance == "CALLS"
                    && doc.qualified_name.contains("::")
        })
        .map(|doc| format!("{}:{}-{}", doc.path, doc.span_start, doc.span_end))
        .collect();
    if sites.is_empty() {
        return;
    }
    let proven: BTreeSet<_> = stored
        .arcs
        .iter()
        .filter_map(|arc| arc.evidence.as_ref())
        .filter(|evidence| evidence.is_definitive())
        .map(|evidence| {
            format!(
                "{}:{}-{}",
                evidence.path, evidence.span.start, evidence.span.end
            )
        })
        .collect();
    stored
        .coverage
        .dynamic_dispatch
        .retain(|location| !sites.contains(location));
    stored
        .coverage
        .dynamic_dispatch
        .extend(sites.difference(&proven).cloned());
    stored.coverage.dynamic_dispatch.sort();
    stored.coverage.dynamic_dispatch.dedup();
}

// Bounded by distinct consulted document/evidence/coverage paths, and dropped
// at query end. Never attach this cache to Runtime or a persisted generation.
struct ScopedQuery<'a, F> {
    scope: &'a Scope,
    paths: BTreeMap<&'a str, bool>,
    // Endpoint eligibility only; document filtering must retain path identity
    // even when distinct records share a node ID.
    live: BTreeSet<u64>,
    matches_scope: F,
}

impl<'a, F: FnMut(&str, &Scope) -> bool> ScopedQuery<'a, F> {
    fn new(stored: &'a StoredIndex, scope: &'a Scope, matches_scope: F) -> Self {
        let mut query = Self {
            scope,
            paths: BTreeMap::new(),
            live: BTreeSet::new(),
            matches_scope,
        };
        query.live = stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX" && query.contains_path(&document.path)
            })
            .map(|document| document.node_id)
            .collect();
        query
    }

    fn contains_path(&mut self, path: &'a str) -> bool {
        *self
            .paths
            .entry(path)
            .or_insert_with(|| (self.matches_scope)(path, self.scope))
    }

    fn coverage(&mut self, coverage: &'a CoverageMetadata) -> CoverageMetadata {
        coverage_for_scope_with_matcher(coverage, self.scope, &mut |path, _| {
            self.contains_path(path)
        })
    }

    fn definitive_arcs<'s: 'a>(&mut self, stored: &'s StoredIndex) -> Vec<&'s StoredArc> {
        stored
            .arcs
            .iter()
            .filter(|arc| {
                self.scope.relation_kinds.contains(&arc.kind)
                    && self.live.contains(&arc.source)
                    && self.live.contains(&arc.target)
                    && arc.evidence.as_ref().is_some_and(|evidence| {
                        evidence.is_definitive()
                            && self.contains_path(&evidence.path)
                            && stored.path_hashes.get(&evidence.path) == Some(&evidence.source_hash)
                    })
            })
            .collect()
    }
}

fn definitive_stored_arcs<'a>(stored: &'a StoredIndex, scope: &Scope) -> Vec<&'a StoredArc> {
    ScopedQuery::new(stored, scope, path_in_scope).definitive_arcs(stored)
}

fn rebuild_refreshed_arcs(stored: &StoredIndex) -> Vec<StoredArc> {
    // Slice A has no dependency footprint or non-CALLS rebuilder. Any effective
    // source update therefore invalidates every non-CALLS proof conservatively.
    rebuild_arcs_with_cargo(
        &stored.documents,
        &stored.path_hashes,
        &stored.go_modules,
        &stored.cargo_manifests,
        &stored.rust_files,
        &stored.ts_files,
        &stored.ts_resolution_configs,
    )
}

#[cfg(test)]
fn rebuild_arcs(
    documents: &[StoredDocument],
    path_hashes: &BTreeMap<String, Hash32>,
    go_modules: &BTreeMap<String, String>,
) -> Vec<StoredArc> {
    rebuild_arcs_with_cargo(
        documents,
        path_hashes,
        go_modules,
        &BTreeMap::new(),
        &BTreeMap::new(),
        &BTreeMap::new(),
        &BTreeMap::new(),
    )
}

fn rebuild_arcs_with_cargo(
    documents: &[StoredDocument],
    path_hashes: &BTreeMap<String, Hash32>,
    go_modules: &BTreeMap<String, String>,
    cargo_manifests: &BTreeMap<String, String>,
    rust_files: &BTreeMap<String, cgrx_languages::RustFileFacts>,
    ts_files: &BTreeMap<String, StoredTsFileFacts>,
    ts_resolution_configs: &BTreeMap<String, TsResolutionConfig>,
) -> Vec<StoredArc> {
    let cargo = crate::cargo_roots::CargoRoots::new(cargo_manifests, rust_files);
    let ts_inventory: BTreeMap<_, _> = ts_files
        .iter()
        .filter(|(path, stored)| path_hashes.get(*path) == Some(&stored.source_hash))
        .map(|(path, stored)| (path.clone(), stored.facts.clone()))
        .collect();
    let modules = ts_config_modules(ts_files, ts_resolution_configs);
    let mut by_name = BTreeMap::<&str, Vec<&StoredDocument>>::new();
    let mut syntax_by_path = BTreeMap::<&str, Vec<&StoredDocument>>::new();
    // Only exact-proof files need this auxiliary identity lookup. Do not
    // allocate an additional symbol index for TS-dominant repositories.
    let field_proof_paths: BTreeSet<_> = documents
        .iter()
        .filter(|document| {
            (document.path.ends_with(".go") && document.go_field_target.is_some())
                || (document.path.ends_with(".rs") && document.rust_module_target.is_some())
        })
        .map(|document| document.path.as_str())
        .collect();
    let mut syntax_by_span = BTreeMap::<(&str, usize, usize), Vec<&StoredDocument>>::new();
    for document in documents
        .iter()
        .filter(|document| document.provenance == "SYNTAX")
    {
        // Newly exposed arrows require lexical proof, even for other languages'
        // callsites. Never let the legacy resolver discover them by name.
        if !document
            .semantic_tags
            .iter()
            .any(|tag| tag == "TS_LEXICAL_ARROW")
        {
            by_name
                .entry(document.qualified_name.as_str())
                .or_default()
                .push(document);
        }
        if field_proof_paths.contains(document.path.as_str()) {
            syntax_by_span
                .entry((
                    document.path.as_str(),
                    document.span_start,
                    document.span_end,
                ))
                .or_default()
                .push(document);
        }

        syntax_by_path
            .entry(document.path.as_str())
            .or_default()
            .push(document);
    }
    let rust_valid_calls: BTreeSet<_> = documents
        .iter()
        .filter(|document| document.provenance == "SYNTAX" && document.path.ends_with(".rs"))
        .flat_map(|source| {
            let path = Path::new(&source.path);
            pack_for_path(path)
                .and_then(|pack| pack.extract(path, source.search_text.as_bytes()).ok())
                .into_iter()
                .flat_map(|extraction| extraction.edges)
                .filter(|edge| edge.relation == LanguageRelation::Calls)
                .map(|edge| {
                    (
                        source.path.clone(),
                        edge.span.start.saturating_add(source.body_start),
                        edge.span.end.saturating_add(source.body_start),
                        edge.target,
                    )
                })
                .collect::<Vec<_>>()
        })
        .collect();
    let mut arcs = Vec::new();
    for call in documents.iter().filter(|document| {
        document.provenance == "CALLS"
            && document.semantic_tags.iter().any(|tag| tag == "EXACT_CALL")
    }) {
        let source_document = syntax_by_path
            .get(call.path.as_str())
            .into_iter()
            .flatten()
            .filter(|document| {
                document.body_start <= call.span_start && document.body_end >= call.span_end
            })
            .min_by_key(|document| {
                (
                    document.body_end.saturating_sub(document.body_start),
                    std::cmp::Reverse(document.body_start),
                )
            })
            .copied();
        if call.path.ends_with(".rs")
            && !call
                .semantic_tags
                .iter()
                .any(|tag| tag == "RUST_SELF_CALL" || tag == "RUST_MODULE_CALL")
            && !rust_valid_calls.contains(&(
                call.path.clone(),
                call.span_start,
                call.span_end,
                call.qualified_name.clone(),
            ))
        {
            continue;
        }
        let source = source_document.map(|document| document.node_id);
        let (qualifier, target_name) = split_call_target(&call.qualified_name);
        // A receiver proof is never eligible for name/package guessing, even
        // when its target has disappeared during refresh or metadata is absent.
        let target = if call
            .semantic_tags
            .iter()
            .any(|tag| tag == "TS_RECEIVER_CALL")
        {
            if !ts_config_supported_for(&call.path, ts_resolution_configs) {
                None
            } else {
                let classified = cgrx_languages::ts_imports::classify_receiver_call_with_modules(
                    &ts_inventory,
                    &call.path,
                    [call.span_start, call.span_end],
                    &modules,
                );
                match classified.classification {
                    ImportClassification::Exact(resolved) => (|| {
                        let caller = source_document?;
                        let caller_span = classified.caller?;
                        if caller.span_start != caller_span[0]
                            || caller.span_end != caller_span[1]
                            || resolved.dependencies.iter().any(|path| {
                                ts_files.get(path).is_none_or(|facts| {
                                    path_hashes.get(path) != Some(&facts.source_hash)
                                })
                            })
                            || resolved.dependencies.iter().any(|path| {
                                ts_config::nearest(path, ts_resolution_configs).is_some_and(|c| {
                                    c.dependencies
                                        .iter()
                                        .any(|(path, hash)| path_hashes.get(path) != Some(hash))
                                })
                            })
                            || !ts_paths_portable_for(
                                &resolved.dependencies,
                                ts_files,
                                ts_resolution_configs,
                            )
                            || resolved
                                .dependencies
                                .iter()
                                .any(|path| !ts_config_supported_for(path, ts_resolution_configs))
                        {
                            return None;
                        }
                        let mut matches = syntax_by_path
                            .get(resolved.path.as_str())?
                            .iter()
                            .filter(|document| {
                                document.qualified_name == target_name
                                    && document.span_start == resolved.target[0]
                                    && document.span_end == resolved.target[1]
                            });
                        let target = matches.next()?;
                        matches.next().is_none().then_some(target.node_id)
                    })(),
                    ImportClassification::Rejected | ImportClassification::NotImport => None,
                }
            }
        } else if call
            .semantic_tags
            .iter()
            .any(|tag| tag == "TS_IMPORT_CALL" || tag == "TS_IMPORT_REJECTED")
        {
            if !ts_config_supported_for(&call.path, ts_resolution_configs) {
                None
            } else {
                let classified = cgrx_languages::ts_imports::classify_call_with_modules(
                    &ts_inventory,
                    &call.path,
                    [call.span_start, call.span_end],
                    &modules,
                );
                match classified.classification {
                    ImportClassification::Exact(resolved) => (|| {
                        let caller = source_document?;
                        let caller_span = classified.caller?;
                        if caller.span_start != caller_span[0]
                            || caller.span_end != caller_span[1]
                            || resolved.dependencies.iter().any(|path| {
                                ts_files.get(path).is_none_or(|facts| {
                                    path_hashes.get(path) != Some(&facts.source_hash)
                                })
                            })
                            || resolved.dependencies.iter().any(|p| {
                                ts_config::nearest(p, ts_resolution_configs).is_some_and(|c| {
                                    c.dependencies
                                        .iter()
                                        .any(|(p, h)| path_hashes.get(p) != Some(h))
                                })
                            })
                            || !ts_paths_portable_for(
                                &resolved.dependencies,
                                ts_files,
                                ts_resolution_configs,
                            )
                            || resolved
                                .dependencies
                                .iter()
                                .any(|path| !ts_config_supported_for(path, ts_resolution_configs))
                        {
                            None
                        } else {
                            let mut matches = syntax_by_path
                                .get(resolved.path.as_str())?
                                .iter()
                                .filter(|document| {
                                    document.span_start == resolved.target[0]
                                        && document.span_end == resolved.target[1]
                                });
                            let target = matches.next()?;
                            matches.next().is_none().then_some(target.node_id)
                        }
                    })(),
                    ImportClassification::Rejected | ImportClassification::NotImport => None,
                }
            }
        } else if call
            .semantic_tags
            .iter()
            .any(|tag| tag == "RUST_MODULE_CALL")
        {
            call.rust_module_target.as_ref().and_then(|proof| {
                if !call.path.ends_with(".rs") {
                    return None;
                }
                let caller = source_document?;
                if caller.span_start != proof.caller.start || caller.span_end != proof.caller.end {
                    return None;
                }
                let candidates = syntax_by_span.get(&(
                    call.path.as_str(),
                    proof.target.start,
                    proof.target.end,
                ))?;
                let [target] = candidates.as_slice() else {
                    return None;
                };
                (target.qualified_name == target_name).then_some(target.node_id)
            })
        } else if call.semantic_tags.iter().any(|tag| tag == "RUST_SELF_CALL") {
            call.rust_self_target.as_ref().and_then(|proof| {
                if !call.path.ends_with(".rs") {
                    return None;
                }
                let exact = |span: &ByteRange| {
                    let mut found = syntax_by_path
                        .get(call.path.as_str())?
                        .iter()
                        .filter(|d| d.span_start == span.start && d.span_end == span.end);
                    let d = *found.next()?;
                    found.next().is_none().then_some(d)
                };
                let caller = exact(&proof.caller)?;
                let target = exact(&proof.target)?;
                let _owner = exact(&proof.owner)?;
                let target_impl = proof.target_implementation.as_ref()?;
                if source != Some(caller.node_id)
                    || target.qualified_name != call.qualified_name
                    || proof.implementation.start >= proof.implementation.end
                    || target_impl.start >= target_impl.end
                    || caller.body_start < proof.implementation.start
                    || caller.body_end > proof.implementation.end
                    || target.body_start < target_impl.start
                    || target.body_end > target_impl.end
                {
                    return None;
                }
                Some(target.node_id)
            })
        } else if call.semantic_tags.iter().any(|tag| tag == "GO_FIELD_CALL") {
            call.go_field_target.as_ref().and_then(|proof| {
                if !call.path.ends_with(".go") || proof.package.is_empty() {
                    return None;
                }
                let exact = |span: &ByteRange| {
                    let candidates =
                        syntax_by_span.get(&(call.path.as_str(), span.start, span.end))?;
                    let [document] = candidates.as_slice() else {
                        return None;
                    };
                    (document.go_package.as_deref() == Some(proof.package.as_str()))
                        .then_some(*document)
                };
                let caller = exact(&proof.caller)?;
                if source_document.map(|d| d.node_id) != Some(caller.node_id) {
                    return None;
                }
                let owner = exact(&proof.receiver_type)?;
                let field_type = exact(&proof.field_type)?;
                if owner.body_start > proof.field.start
                    || proof.field.end > owner.body_end
                    || proof.field.start >= proof.field.end
                    || field_type.qualified_name.is_empty()
                {
                    return None;
                }
                let target = exact(&proof.target)?;
                (target.qualified_name == target_name).then_some(target.node_id)
            })
        } else if call
            .semantic_tags
            .iter()
            .any(|tag| tag == "TS_LEXICAL_CALL")
        {
            call.ts_lexical_target.as_ref().and_then(|proof| {
                let caller = source_document?;
                if caller.path != call.path
                    || caller.span_start != proof.caller.start
                    || caller.span_end != proof.caller.end
                {
                    return None;
                }
                let mut matches =
                    syntax_by_path
                        .get(call.path.as_str())?
                        .iter()
                        .filter(|document| {
                            document.qualified_name == call.qualified_name
                                && document.span_start == proof.target.start
                                && document.span_end == proof.target.end
                                && document
                                    .semantic_tags
                                    .iter()
                                    .any(|tag| tag == "TS_LEXICAL_ARROW")
                        });
                let target = matches.next()?;
                matches.next().is_none().then_some(target.node_id)
            })
        } else if call.semantic_tags.iter().any(|tag| tag == "GO_SELF_CALL") {
            call.go_receiver_target.as_ref().and_then(|proof| {
                if proof.path != call.path
                    || proof.package.is_empty()
                    || proof.receiver_type.is_empty()
                {
                    return None;
                }
                let mut matches =
                    syntax_by_path
                        .get(proof.path.as_str())?
                        .iter()
                        .filter(|document| {
                            document.qualified_name == proof.symbol
                                && document.span_start == proof.span_start
                                && document.span_end == proof.span_end
                        });
                let target = matches.next()?;
                matches.next().is_none().then_some(target.node_id)
            })
        } else if call.path.ends_with(".rs") && qualifier.is_some() {
            // Exact Cargo target/root + AST module membership, never a name guess.
            cargo
                .target(
                    &call.path,
                    call.span_start,
                    call.span_end,
                    &call.qualified_name,
                )
                .and_then(|(path, start, end)| {
                    let mut matches = syntax_by_path
                        .get(path)?
                        .iter()
                        .filter(|d| d.span_start == start && d.span_end == end);
                    let target = matches.next()?;
                    (matches.next().is_none() && path_hashes.contains_key(path))
                        .then_some(target.node_id)
                })
        } else if call.path.ends_with(".go") && qualifier.is_some() {
            // Import-qualified Go selectors cannot fall through to same-file,
            // basename, or global matching. Only the caller's own module is
            // supported; stdlib/external/workspace/replaced modules stay out.
            call.go_import_path.as_deref().and_then(|import| {
                let (module_dir, module_name) = go_module_for(&call.path, go_modules)?;
                if module_name.is_empty() {
                    return None;
                }
                let suffix = import.strip_prefix(module_name)?.strip_prefix('/')?;
                if suffix
                    .split('/')
                    .any(|p| p.is_empty() || matches!(p, "." | ".."))
                {
                    return None;
                }
                let directory = Path::new(module_dir).join(suffix);
                let mut targets = by_name.get(target_name)?.iter().filter(|document| {
                    document.path.ends_with(".go")
                        && Path::new(&document.path).parent() == Some(directory.as_path())
                        && go_module_for(&document.path, go_modules)
                            == Some((module_dir, module_name))
                        && go_function_declaration(document)
                        && document.go_package.as_deref().is_some_and(|package| {
                            package != "_"
                                && !package.is_empty()
                                && (call.go_import_explicit_alias || Some(package) == qualifier)
                        })
                });
                let target = targets.next()?;
                targets.next().is_none().then_some(target.node_id)
            })
        } else {
            by_name.get(target_name).and_then(|matches| {
                let same_path: Vec<_> = matches
                    .iter()
                    .filter(|document| document.path == call.path)
                    .collect();
                if same_path.len() == 1 {
                    Some(same_path[0].node_id)
                } else if let Some(qualifier) = qualifier {
                    let qualified: Vec<_> = matches
                        .iter()
                        .filter(|document| path_matches_qualifier(&document.path, qualifier))
                        .collect();
                    (qualified.len() == 1).then(|| qualified[0].node_id)
                } else if call.path.ends_with(".go") {
                    let package = Path::new(&call.path).parent();
                    let same_package: Vec<_> = matches
                        .iter()
                        .filter(|document| Path::new(&document.path).parent() == package)
                        .collect();
                    (same_package.len() == 1).then(|| same_package[0].node_id)
                } else if same_path.is_empty() && matches.len() == 1 {
                    Some(matches[0].node_id)
                } else {
                    None
                }
            })
        };
        if let (Some(source), Some(target)) = (source, target) {
            let Some(source_hash) = path_hashes.get(&call.path).copied() else {
                continue;
            };
            arcs.push(StoredArc {
                source,
                target,
                kind: RelationKind::Calls,
                evidence: Some(EdgeEvidence {
                    path: call.path.clone(),
                    span: ByteRange::new(call.span_start, call.span_end),
                    source_hash,
                    resolver: ResolverClass::SyntaxExact,
                    confidence: ConfidenceClass::Proven,
                    assumptions: Vec::new(),
                    counter_evidence: Vec::new(),
                }),
            });
        }
    }
    arcs.sort_by_key(|arc| (arc.source, arc.target, arc.kind, arc.evidence.clone()));
    arcs.dedup();
    arcs
}

// Minimal module grammar: no inferred GOPATH, go.work or replacement mapping.
// Unrelated dependency overrides do not change the main module namespace.
fn go_module_name(source: &[u8]) -> Option<String> {
    let source = std::str::from_utf8(source).ok()?;
    if source.contains("/*") {
        return None;
    }
    let names: Vec<_> = source
        .lines()
        .filter_map(|line| {
            let line = line.split("//").next()?.trim();
            let rest = line.strip_prefix("module")?;
            if !rest.starts_with(char::is_whitespace) {
                return None;
            }
            let name = rest.trim().trim_matches('"');
            (!name.is_empty() && !name.contains(char::is_whitespace)).then(|| name.to_owned())
        })
        .collect();
    if names.len() != 1 {
        return None;
    }
    let module = &names[0];
    let mut in_replace = false;
    for line in source.lines() {
        let tokens: Vec<_> = line.split("//").next()?.split_whitespace().collect();
        if tokens.is_empty() {
            continue;
        }
        if in_replace {
            if tokens == [")"] {
                in_replace = false;
            } else if !go_replacement_is_unrelated(&tokens, module) {
                return None;
            }
        } else if tokens[0] == "replace" {
            if tokens == ["replace", "("] {
                in_replace = true;
            } else if !go_replacement_is_unrelated(&tokens[1..], module) {
                return None;
            }
        } else if tokens.contains(&"=>") {
            // Unrecognized or split replacement syntax must not be ignored.
            return None;
        }
    }
    (!in_replace).then(|| module.clone())
}

fn go_replacement_is_unrelated(tokens: &[&str], module: &str) -> bool {
    let Some(arrow) = tokens.iter().position(|token| *token == "=>") else {
        return false;
    };
    let (left, right) = (&tokens[..arrow], &tokens[arrow + 1..]);
    // Bounded unquoted grammar: old [version] => new [version]. Inline blocks,
    // escaped/quoted paths, extra tokens/arrows and malformed versions fail closed.
    let valid_side = |side: &[&str]| {
        (1..=2).contains(&side.len())
            && side[0]
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"./_-+~".contains(&b))
            && (side.len() == 1
                || (side[1].starts_with('v')
                    && side[1].as_bytes().get(1).is_some_and(u8::is_ascii_digit)
                    && side[1]
                        .bytes()
                        .all(|b| b.is_ascii_alphanumeric() || b".-+".contains(&b))))
    };
    if !valid_side(left) || !valid_side(right) {
        return false;
    }
    let old = left[0];
    if old
        .split('/')
        .any(|part| part.is_empty() || matches!(part, "." | ".."))
    {
        return false;
    }
    // Module path boundaries, not text prefixes: vpnextra is unrelated to vpn.
    // Both directions are conservative: replacing vpn or vpn/auth can affect
    // vpn's own imports; replacing an ancestor of example/vpn is also ambiguous.
    old != module
        && !old
            .strip_prefix(module)
            .is_some_and(|rest| rest.starts_with('/'))
        && !module
            .strip_prefix(old)
            .is_some_and(|rest| rest.starts_with('/'))
}

fn go_module_for<'a>(
    path: &str,
    modules: &'a BTreeMap<String, String>,
) -> Option<(&'a str, &'a str)> {
    modules
        .iter()
        .filter(|(directory, _)| directory.is_empty() || Path::new(path).starts_with(directory))
        .max_by_key(|(directory, _)| directory.len())
        .map(|(directory, module)| (directory.as_str(), module.as_str()))
}

fn go_function_declaration(document: &StoredDocument) -> bool {
    document
        .search_text
        .strip_prefix("func")
        .and_then(|s| s.trim_start().strip_prefix(&document.qualified_name))
        .is_some_and(|s| s.trim_start().starts_with('('))
}

fn split_call_target(target: &str) -> (Option<&str>, &str) {
    target
        .rsplit_once("::")
        .or_else(|| target.rsplit_once('.'))
        .map_or((None, target), |(qualifier, name)| {
            (qualifier.rsplit([':', '.']).next(), name)
        })
}

fn path_matches_qualifier(path: &str, qualifier: &str) -> bool {
    Path::new(path)
        .components()
        .any(|component| component.as_os_str().to_str() == Some(qualifier))
}

fn changed_paths(
    base: &BTreeMap<String, Hash32>,
    current: &BTreeMap<String, Hash32>,
) -> BTreeSet<String> {
    base.keys()
        .chain(current.keys())
        .filter(|path| base.get(*path) != current.get(*path))
        .cloned()
        .collect()
}

fn working_tree_digest(changed: &BTreeSet<String>, current: &BTreeMap<String, Hash32>) -> Hash32 {
    let mut hasher = blake3::Hasher::new();
    hasher.update(b"cgrx-working-tree-v1\0");
    for path in changed {
        hasher.update(path.as_bytes());
        hasher.update(b"\0");
        if let Some(hash) = current.get(path) {
            hasher.update(&hash.0);
        } else {
            hasher.update(b"deleted");
        }
        hasher.update(b"\0");
    }
    Hash32(*hasher.finalize().as_bytes())
}

struct NoopOracle;

impl ProbeOracle for NoopOracle {
    fn execute(
        &self,
        _probe: &Probe,
        _snapshot: &RepoSnapshot,
    ) -> Result<Vec<ProbeFact>, ProbeError> {
        Err(ProbeError::new(
            "NO_ORACLE",
            "runtime has no external probe oracle",
        ))
    }
}

fn declaration_name(text: &str) -> Option<String> {
    let value = text.trim();
    let value = value.strip_prefix("function ").unwrap_or(value);
    let name = value.split('(').next()?.trim();
    (!name.is_empty()).then(|| name.to_owned())
}

fn declaration_span(source: &[u8], symbol: Span, path: &Path) -> Option<Span> {
    let line_start = source[..symbol.start]
        .iter()
        .rposition(|byte| *byte == b'\n')
        .map_or(0, |offset| offset + 1);
    let line_end = source[symbol.end..]
        .iter()
        .position(|byte| *byte == b'\n')
        .map_or(source.len(), |offset| symbol.end + offset);
    let line = &source[line_start..line_end];
    let leading = line.iter().position(|byte| !byte.is_ascii_whitespace())?;
    let extension = path.extension()?.to_str()?;
    let start = if extension == "py" {
        line_start + leading
    } else {
        symbol.start
    };
    let terminator = if extension == "py" { b':' } else { b'{' };
    let relative_end = source[start..line_end]
        .iter()
        .position(|byte| *byte == terminator)
        .unwrap_or(line_end - start);
    let mut end = start + relative_end;
    while end > start && source[end - 1].is_ascii_whitespace() {
        end -= 1;
    }
    (start < end).then_some(Span { start, end })
}

fn implements_spans(source: &[u8], path: &Path) -> Vec<Span> {
    if path.extension().and_then(|value| value.to_str()) != Some("ts")
        && path.extension().and_then(|value| value.to_str()) != Some("tsx")
    {
        return Vec::new();
    }
    let mut spans = Vec::new();
    let mut offset = 0;
    for line in source.split_inclusive(|byte| *byte == b'\n') {
        let content = line.strip_suffix(b"\n").unwrap_or(line);
        let leading = content
            .iter()
            .position(|byte| !byte.is_ascii_whitespace())
            .unwrap_or(content.len());
        let trimmed = &content[leading..];
        if trimmed.starts_with(b"class ")
            && trimmed
                .windows(b" implements ".len())
                .any(|window| window == b" implements ")
        {
            let end = trimmed
                .iter()
                .position(|byte| *byte == b'{')
                .unwrap_or(trimmed.len());
            let mut end = offset + leading + end;
            while end > offset + leading && source[end - 1].is_ascii_whitespace() {
                end -= 1;
            }
            spans.push(Span {
                start: offset + leading,
                end,
            });
        }
        offset += line.len();
    }
    spans
}

fn task_evidence_ids(
    task: &str,
    documents: &[StoredDocument],
    arcs: &[GraphArc],
    scope: &Scope,
) -> Vec<u64> {
    let has_tag = |document: &StoredDocument, tag: &str| {
        document.semantic_tags.iter().any(|value| value == tag)
    };
    let scoped: Vec<_> = documents
        .iter()
        .filter(|document| path_in_scope(&document.path, scope))
        .collect();
    let mut selected: Vec<_> = match classify(task) {
        TaskIntent::DecoratedRoute => scoped
            .iter()
            .copied()
            .filter(|document| document.provenance == "ROUTE_HANDLER")
            .collect(),
        TaskIntent::Implementations => scoped
            .iter()
            .copied()
            .filter(|document| {
                document.provenance == "IMPLEMENTS"
                    || (has_tag(document, "DYNAMIC_DISPATCH")
                        && document.text.to_lowercase().contains("worker"))
            })
            .collect(),
        TaskIntent::OverloadCall => scoped
            .iter()
            .copied()
            .filter(|document| has_tag(document, "OVERLOAD_CALL"))
            .collect(),
        TaskIntent::BoundedDepth => {
            let by_name: BTreeMap<_, _> = scoped
                .iter()
                .copied()
                .filter(|document| document.provenance == "SYNTAX")
                .map(|document| (document.qualified_name.as_str(), document.node_id))
                .collect();
            let outgoing: std::collections::BTreeSet<_> =
                arcs.iter().map(|arc| arc.source).collect();
            scoped
                .iter()
                .copied()
                .filter(|document| has_tag(document, "EXACT_CALL"))
                .filter(|document| {
                    by_name
                        .get(document.qualified_name.as_str())
                        .is_some_and(|node_id| !outgoing.contains(node_id))
                })
                .collect()
        }
        TaskIntent::AliasedImport => scoped
            .iter()
            .copied()
            .filter(|document| has_tag(document, "EXACT_CALL"))
            .collect(),
        TaskIntent::CallSite => scoped
            .iter()
            .copied()
            .filter(|document| has_tag(document, "STATEMENT_CALL"))
            .collect(),
        TaskIntent::DynamicProperty => scoped
            .iter()
            .copied()
            .filter(|document| has_tag(document, "DYNAMIC_PROPERTY"))
            .collect(),
        TaskIntent::DynamicDispatch => scoped
            .iter()
            .copied()
            .filter(|document| has_tag(document, "DYNAMIC_DISPATCH"))
            .collect(),
        TaskIntent::Unknown => Vec::new(),
    };
    selected.sort_by_key(|document| (&document.path, document.span_start, document.node_id));
    selected
        .into_iter()
        .map(|document| document.node_id)
        .collect()
}

fn exact_symbol_ids(task: &str, documents: &[StoredDocument], scope: &Scope) -> Vec<u64> {
    let exact_terms: BTreeSet<_> = task
        .split(|character: char| !character.is_alphanumeric() && character != '_')
        .filter(|term| term.len() >= 4)
        .collect();
    let has_symbol_shape = task.contains(['.', '_'])
        || exact_terms.iter().any(|term| {
            term.chars()
                .skip(1)
                .any(|character| character.is_uppercase())
        });
    if !has_symbol_shape {
        return Vec::new();
    }
    let folded_terms: BTreeSet<_> = exact_terms.iter().copied().map(str::to_lowercase).collect();
    let mut selected: Vec<_> = documents
        .iter()
        .filter(|document| path_in_scope(&document.path, scope))
        .filter(|document| document.provenance == "SYNTAX")
        .filter(|document| folded_terms.contains(&document.qualified_name.to_lowercase()))
        .collect();
    if selected
        .iter()
        .any(|document| exact_terms.contains(document.qualified_name.as_str()))
    {
        selected.retain(|document| exact_terms.contains(document.qualified_name.as_str()));
    }
    selected.sort_by(|left, right| {
        right
            .qualified_name
            .chars()
            .count()
            .cmp(&left.qualified_name.chars().count())
            .then_with(|| left.path.cmp(&right.path))
            .then_with(|| left.span_start.cmp(&right.span_start))
            .then_with(|| left.node_id.cmp(&right.node_id))
    });
    selected
        .into_iter()
        .map(|document| document.node_id)
        .collect()
}

fn definition_body_ids(task: &str, documents: &[StoredDocument], scope: &Scope) -> Vec<u64> {
    let terms = lexical_terms(task);
    if terms.len() < 3 {
        return Vec::new();
    }
    let mut scored: Vec<_> = documents
        .iter()
        .filter(|document| path_in_scope(&document.path, scope))
        .filter(|document| document.provenance == "SYNTAX")
        .filter_map(|document| {
            let haystack = lexical_terms(&format!(
                "{} {} {}",
                document.qualified_name, document.path, document.search_text
            ));
            let score = terms.intersection(&haystack).count();
            (score >= 2).then_some((document, score))
        })
        .collect();
    let is_test = |path: &str| {
        let test_file = Path::new(path)
            .file_name()
            .and_then(|name| name.to_str())
            .is_some_and(|name| name.starts_with("test_"));
        path.starts_with("tests/")
            || path.contains("/tests/")
            || path.ends_with("_test.rs")
            || path.ends_with(".test.ts")
            || path.ends_with("_test.py")
            || test_file
    };
    let best_production = scored
        .iter()
        .filter(|(document, _)| !is_test(&document.path))
        .map(|(_, score)| *score)
        .max();
    let best_score = best_production.or_else(|| scored.iter().map(|(_, score)| *score).max());
    let Some(best_score) = best_score else {
        return Vec::new();
    };
    scored.retain(|(document, score)| {
        *score == best_score && (best_production.is_none() || !is_test(&document.path))
    });
    scored.sort_by_key(|(document, _)| (&document.path, document.span_start, document.node_id));
    scored
        .into_iter()
        .take(3)
        .map(|(document, _)| document.node_id)
        .collect()
}

fn lexical_terms(text: &str) -> BTreeSet<String> {
    let normalized: String = text
        .to_lowercase()
        .chars()
        .map(|character| {
            if character.is_alphanumeric() {
                character
            } else {
                ' '
            }
        })
        .collect();
    normalized
        .split_whitespace()
        .filter(|term| term.chars().count() >= 4)
        .map(|term| {
            for suffix in ["ing", "ers", "er", "ed", "es", "s"] {
                if let Some(stem) = term.strip_suffix(suffix)
                    && stem.chars().count() >= 4
                {
                    return stem.to_owned();
                }
            }
            term.to_owned()
        })
        .collect()
}

fn neighbor_map(arcs: &[GraphArc], scope: &Scope) -> BTreeMap<u64, Vec<u64>> {
    let mut neighbors = BTreeMap::<u64, Vec<u64>>::new();
    for arc in arcs
        .iter()
        .filter(|arc| scope.relation_kinds.contains(&arc.kind) && arc.evidence.is_definitive())
    {
        neighbors.entry(arc.source).or_default().push(arc.target);
        neighbors.entry(arc.target).or_default().push(arc.source);
    }
    for values in neighbors.values_mut() {
        values.sort_unstable();
        values.dedup();
        values.truncate(GRAPH_FANOUT_LIMIT);
    }
    neighbors
}

fn graph_evidence_ids(
    roots: &[u64],
    arcs: &[GraphArc],
    documents: &[StoredDocument],
    scope: &Scope,
) -> Vec<u64> {
    let scoped: BTreeSet<_> = documents
        .iter()
        .filter(|document| path_in_scope(&document.path, scope))
        .map(|document| document.node_id)
        .collect();
    let mut adjacency = BTreeMap::<u64, Vec<u64>>::new();
    for arc in arcs
        .iter()
        .filter(|arc| scope.relation_kinds.contains(&arc.kind) && arc.evidence.is_definitive())
    {
        if scoped.contains(&arc.source) && scoped.contains(&arc.target) {
            adjacency.entry(arc.source).or_default().push(arc.target);
            adjacency.entry(arc.target).or_default().push(arc.source);
        }
    }
    for targets in adjacency.values_mut() {
        targets.sort_unstable();
        targets.dedup();
        targets.truncate(GRAPH_FANOUT_LIMIT);
    }
    let mut ordered = Vec::new();
    let mut visited = BTreeSet::new();
    let mut frontier = roots.to_vec();
    frontier.sort_unstable();
    for root in roots {
        if scoped.contains(root) && visited.insert(*root) {
            ordered.push(*root);
        }
    }
    for _ in 0..scope.max_depth {
        let mut next = Vec::new();
        for source in &frontier {
            for target in adjacency.get(source).into_iter().flatten() {
                if visited.insert(*target) {
                    ordered.push(*target);
                    next.push(*target);
                }
            }
        }
        next.sort_unstable();
        if next.is_empty() {
            break;
        }
        frontier = next;
    }
    ordered
}

fn stable_node_id(path: &str, span: Span, name: &str) -> u64 {
    let mut hasher = blake3::Hasher::new();
    hasher.update(path.as_bytes());
    hasher.update(&(span.start as u64).to_le_bytes());
    hasher.update(&(span.end as u64).to_le_bytes());
    hasher.update(name.as_bytes());
    let mut bytes = [0_u8; 8];
    bytes.copy_from_slice(&hasher.finalize().as_bytes()[..8]);
    u64::from_le_bytes(bytes)
}

fn generation_id(revision: &str) -> u64 {
    // Extraction semantics are part of the immutable generation identity.
    // A new extractor must never collide with the same HEAD's old generation.
    let mut hasher = blake3::Hasher::new();
    hasher.update(revision.as_bytes());
    hasher.update(&EXTRACTION_REVISION.to_le_bytes());
    let digest = hasher.finalize();
    let mut bytes = [0_u8; 8];
    bytes.copy_from_slice(&digest.as_bytes()[..8]);
    u64::from_le_bytes(bytes) % 10_000_000_000_000_000
}

fn git_bytes(root: &Path, args: &[&str]) -> Result<Vec<u8>, RuntimeError> {
    let output = Command::new(crate::git_executable())
        // These are read-only queries. In particular, status must not persist
        // its stat-cache refresh into the user's Git index or acquire optional
        // index locks. Git still reports working-tree, staged and HEAD changes.
        .env("GIT_OPTIONAL_LOCKS", "0")
        .args(args)
        .current_dir(root)
        .output()
        .map_err(|error| RuntimeError::new("git_spawn", error.to_string()))?;
    if !output.status.success() {
        return Err(RuntimeError::new("git_exit", "git command failed"));
    }
    Ok(output.stdout)
}

fn store_writer_error(code: &'static str, error: std::io::Error) -> RuntimeError {
    if error.kind() == std::io::ErrorKind::WouldBlock {
        RuntimeError::new(
            "store_busy",
            "another process is publishing this index; retry after it finishes",
        )
    } else {
        RuntimeError::new(code, error.to_string())
    }
}

fn git_text(root: &Path, args: &[&str]) -> Result<String, RuntimeError> {
    String::from_utf8(git_bytes(root, args)?)
        .map(|value| value.trim().to_owned())
        .map_err(|error| RuntimeError::new("git_utf8", error.to_string()))
}

#[cfg(test)]
mod proof_edge_tests {
    use super::*;
    #[test]
    fn unreadable_config_presence_is_an_explicit_resolution_blocker() {
        let mut hashes = BTreeMap::new();
        let mut files = BTreeMap::new();
        let mut configs = BTreeMap::new();
        let marker = Hash32([9; 32]);
        store_ts_presence_blocker(
            "src/tsconfig.json",
            marker,
            &mut hashes,
            &mut files,
            &mut configs,
        );
        assert_eq!(hashes.get("src/tsconfig.json"), Some(&marker));
        assert!(!configs["src/tsconfig.json"].supported);
        assert!(files["src/tsconfig.json"].inventory_only);
        assert!(!ts_config_supported_for("src/main.ts", &configs));
    }

    #[test]
    fn rust_module_proof_missing_stale_or_duplicate_metadata_never_guesses() {
        let source = b"fn run() {} mod inner { fn run() {} fn caller() { self::run(); } }";
        let extracted = extract_path("main.rs", source).unwrap();
        let hashes = BTreeMap::from([(
            "main.rs".to_owned(),
            Hash32(*blake3::hash(source).as_bytes()),
        )]);
        assert_eq!(
            rebuild_arcs(&extracted.documents, &hashes, &BTreeMap::new()).len(),
            1
        );
        for case in ["missing", "caller", "target", "tag", "duplicate"] {
            let mut docs = extracted.documents.clone();
            let call = docs
                .iter_mut()
                .find(|d| d.rust_module_target.is_some())
                .unwrap();
            match case {
                "missing" => call.rust_module_target = None,
                "caller" => call.rust_module_target.as_mut().unwrap().caller.start += 1,
                "target" => call.rust_module_target.as_mut().unwrap().target.start += 1,
                "tag" => call.semantic_tags.retain(|t| t != "RUST_MODULE_CALL"),
                "duplicate" => {
                    let span = call.rust_module_target.as_ref().unwrap().target;
                    let target = docs
                        .iter()
                        .find(|d| d.provenance == "SYNTAX" && d.span_start == span.start)
                        .unwrap()
                        .clone();
                    docs.push(target);
                }
                _ => unreachable!(),
            }
            assert!(
                rebuild_arcs(&docs, &hashes, &BTreeMap::new()).is_empty(),
                "{case}"
            );
        }
    }

    #[test]
    fn rust_self_owner_proof_missing_or_stale_metadata_never_guesses() {
        let source = b"struct A; impl A { fn caller(&self) { self.run(); } fn run(&self) {} }";
        let extracted = extract_path("main.rs", source).unwrap();
        let hashes = BTreeMap::from([(
            "main.rs".to_owned(),
            Hash32(*blake3::hash(source).as_bytes()),
        )]);
        assert_eq!(
            rebuild_arcs(&extracted.documents, &hashes, &BTreeMap::new()).len(),
            1
        );
        for case in [
            "missing",
            "caller",
            "target",
            "owner",
            "impl",
            "target_impl",
            "missing_target_impl",
            "tag",
        ] {
            let mut docs = extracted.documents.clone();
            let call = docs
                .iter_mut()
                .find(|d| d.rust_self_target.is_some())
                .unwrap();
            if case == "missing" {
                call.rust_self_target = None;
            } else if case == "tag" {
                call.semantic_tags.retain(|t| t != "RUST_SELF_CALL");
            } else {
                let proof = call.rust_self_target.as_mut().unwrap();
                match case {
                    "caller" => proof.caller.start += 1,
                    "target" => proof.target.start += 1,
                    "owner" => proof.owner.start += 1,
                    "impl" => proof.implementation.end = proof.implementation.start,
                    "target_impl" => proof.target_implementation.as_mut().unwrap().end = 0,
                    "missing_target_impl" => proof.target_implementation = None,
                    _ => unreachable!(),
                }
            }
            assert!(
                rebuild_arcs(&docs, &hashes, &BTreeMap::new()).is_empty(),
                "{case}"
            );
        }
    }

    use cgrx_core::Mode;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::time::{SystemTime, UNIX_EPOCH};

    static TEST_DIRECTORY_SEQUENCE: AtomicU64 = AtomicU64::new(0);

    struct TestDirectory(PathBuf);

    impl TestDirectory {
        fn new(label: &str) -> Self {
            let nonce = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock after epoch")
                .as_nanos();
            let sequence = TEST_DIRECTORY_SEQUENCE.fetch_add(1, Ordering::Relaxed);
            let path = std::env::temp_dir().join(format!(
                "cgrx-{label}-{}-{nonce}-{sequence}",
                std::process::id()
            ));
            fs::create_dir_all(&path).expect("create test directory");
            Self(path)
        }

        fn path(&self) -> &Path {
            &self.0
        }
    }

    impl Drop for TestDirectory {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn git(root: &Path, args: &[&str]) {
        assert!(
            Command::new("git")
                .args(args)
                .current_dir(root)
                .status()
                .expect("git executable")
                .success(),
            "git command failed: {args:?}"
        );
    }

    fn refresh_fixture(label: &str) -> (TestDirectory, TestDirectory, Runtime, StoredArc) {
        let repository = TestDirectory::new(label);
        git(repository.path(), &["init", "-q"]);
        git(
            repository.path(),
            &["config", "user.email", "test@example.invalid"],
        );
        git(repository.path(), &["config", "user.name", "CGRX Test"]);
        fs::write(
            repository.path().join("impl.rs"),
            b"fn implementation() {}\nfn contract() {}\n",
        )
        .expect("write implementation fixture");
        fs::write(
            repository.path().join("calls.rs"),
            b"fn target() {}\nfn caller() { target(); }\n",
        )
        .expect("write call fixture");
        git(repository.path(), &["add", "."]);
        git(repository.path(), &["commit", "-qm", "fixture"]);
        let state = TestDirectory::new(&format!("{label}-state"));
        Runtime::index(repository.path(), state.path()).expect("index repository");
        let mut runtime = Runtime::open(state.path()).expect("open runtime");
        let node_ids: Vec<_> = runtime
            .stored
            .documents
            .iter()
            .filter(|document| document.provenance == "SYNTAX" && document.path == "impl.rs")
            .map(|document| document.node_id)
            .collect();
        let preserved = StoredArc {
            source: node_ids[0],
            target: node_ids[1],
            kind: RelationKind::Implements,
            evidence: Some(EdgeEvidence {
                path: "impl.rs".to_owned(),
                span: ByteRange::new(0, 21),
                source_hash: runtime.stored.path_hashes["impl.rs"],
                resolver: ResolverClass::CompilerConfirmed,
                confidence: ConfidenceClass::Proven,
                assumptions: Vec::new(),
                counter_evidence: Vec::new(),
            }),
        };
        runtime.stored.arcs.push(preserved.clone());
        (repository, state, runtime, preserved)
    }

    fn syntax(node_id: u64, name: &str, path: &str, start: usize, end: usize) -> StoredDocument {
        StoredDocument {
            rust_module_target: None,
            rust_self_target: None,
            ts_lexical_target: None,
            go_field_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: None,
            go_receiver_target: None,
            node_id,
            qualified_name: name.to_owned(),
            path: path.to_owned(),
            text: name.to_owned(),
            search_text: name.to_owned(),
            span_start: start,
            span_end: end,
            body_start: start,
            body_end: end,
            provenance: "SYNTAX".to_owned(),
            semantic_tags: Vec::new(),
        }
    }

    fn call(node_id: u64, name: &str, path: &str, start: usize, end: usize) -> StoredDocument {
        StoredDocument {
            rust_module_target: None,
            rust_self_target: None,
            ts_lexical_target: None,
            go_field_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: None,
            go_receiver_target: None,
            node_id,
            qualified_name: name.to_owned(),
            path: path.to_owned(),
            text: name.to_owned(),
            search_text: name.to_owned(),
            span_start: start,
            span_end: end,
            body_start: start,
            body_end: end,
            provenance: "CALLS".to_owned(),
            semantic_tags: vec!["EXACT_CALL".to_owned()],
        }
    }

    #[test]
    fn go_field_exact_proof_never_falls_back_with_missing_or_stale_identity() {
        let source = b"package queue\ntype TaskQueue struct { items PriorityQueue }\ntype PriorityQueue []int\nfunc (p PriorityQueue) Len() int { return 0 }\nfunc (q *TaskQueue) Peek() int { return q.items.Len() }";
        let documents = extract_path("queue.go", source).unwrap().documents;
        let hashes = BTreeMap::from([(
            "queue.go".to_owned(),
            Hash32(*blake3::hash(source).as_bytes()),
        )]);
        assert_eq!(rebuild_arcs(&documents, &hashes, &BTreeMap::new()).len(), 1);
        let proof = documents
            .iter()
            .find_map(|d| d.go_field_target.clone())
            .unwrap();
        for removed in [
            &proof.caller,
            &proof.receiver_type,
            &proof.field_type,
            &proof.target,
        ] {
            let filtered: Vec<_> = documents
                .iter()
                .filter(|d| {
                    !(d.provenance == "SYNTAX"
                        && d.span_start == removed.start
                        && d.span_end == removed.end)
                })
                .cloned()
                .collect();
            assert!(rebuild_arcs(&filtered, &hashes, &BTreeMap::new()).is_empty());
        }
        for variant in 0..4 {
            let mut changed = documents.clone();
            let call = changed
                .iter_mut()
                .find(|d| d.go_field_target.is_some())
                .unwrap();
            match variant {
                0 => call.go_field_target = None,
                1 => call.go_field_target.as_mut().unwrap().package = "wrong".to_owned(),
                2 => call.go_field_target.as_mut().unwrap().field.end = source.len() + 1,
                _ => call.go_field_target.as_mut().unwrap().caller.start += 1,
            }
            assert!(rebuild_arcs(&changed, &hashes, &BTreeMap::new()).is_empty());
        }
        let mut duplicate = documents.clone();
        duplicate.push(
            documents
                .iter()
                .find(|d| d.provenance == "SYNTAX" && d.span_start == proof.target.start)
                .unwrap()
                .clone(),
        );
        assert!(rebuild_arcs(&duplicate, &hashes, &BTreeMap::new()).is_empty());
    }

    // Frozen pre-cache predicate: keeps the differential control independent
    // of the optimized live-set and membership plumbing.
    fn uncached_definitive_arcs<'a>(stored: &'a StoredIndex, scope: &Scope) -> Vec<&'a StoredArc> {
        let live: BTreeSet<_> = stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX" && path_in_scope(&document.path, scope)
            })
            .map(|document| document.node_id)
            .collect();
        stored
            .arcs
            .iter()
            .filter(|arc| {
                scope.relation_kinds.contains(&arc.kind)
                    && live.contains(&arc.source)
                    && live.contains(&arc.target)
                    && arc.evidence.as_ref().is_some_and(|evidence| {
                        evidence.is_definitive()
                            && path_in_scope(&evidence.path, scope)
                            && stored.path_hashes.get(&evidence.path) == Some(&evidence.source_hash)
                    })
            })
            .collect()
    }

    #[test]
    fn query_scope_cache_preserves_document_paths_when_node_ids_collide() {
        let (_repo, _state, mut runtime, mut proof) = refresh_fixture("scope-id-collision");
        runtime.stored.documents = vec![
            syntax(1, "scope_node_root", "a.rs", 0, 10),
            syntax(2, "scope_node_target", "m.rs", 0, 10),
            syntax(1, "scope_node_root", "z.rs", 0, 10),
            syntax(2, "scope_node_target", "zz.rs", 0, 10),
        ];
        proof.source = 1;
        proof.target = 2;
        proof.kind = RelationKind::Calls;
        proof.evidence.as_mut().unwrap().path = "a.rs".into();
        proof.evidence.as_mut().unwrap().source_hash = Hash32([7; 32]);
        runtime
            .stored
            .path_hashes
            .insert("a.rs".into(), Hash32([7; 32]));
        runtime.stored.arcs = vec![proof];
        runtime.stored.coverage = CoverageMetadata::default();
        // Load/refresh normalization deduplicates adjacent IDs after sorting
        // by path, not globally: nonadjacent collisions really do survive.
        normalize_stored(&mut runtime.stored);
        assert_eq!(runtime.stored.documents.len(), 4);
        let scope = Scope {
            exclude: vec!["z*.rs".into()],
            ..proof_scope()
        };
        assert_eq!(
            definitive_stored_arcs(&runtime.stored, &scope),
            uncached_definitive_arcs(&runtime.stored, &scope),
        );
        let baseline_paths: Vec<_> = runtime
            .stored
            .documents
            .iter()
            .filter(|d| d.provenance == "SYNTAX" && path_in_scope(&d.path, &scope))
            .map(|d| d.path.as_str())
            .collect();
        assert_eq!(baseline_paths, ["a.rs", "m.rs"]);
        let searched = runtime.search_graph("scope_node", &scope, 10).unwrap();
        let paths: Vec<_> = searched["matches"]
            .as_array()
            .unwrap()
            .iter()
            .map(|row| row["path"].as_str().unwrap())
            .collect();
        assert_eq!(paths, baseline_paths);
        assert_eq!(searched["matches"][0]["callees"], 1);
        assert_eq!(searched["matches"][1]["callers"], 1);
        for root in ["scope_node_root", "SCOPE_NODE_ROOT"] {
            let trace = runtime
                .trace_path(root, None, "callees", 1, &scope, 10)
                .unwrap();
            assert_eq!(trace["root"]["path"], "a.rs");
            assert_eq!(trace["nodes"].as_array().unwrap().len(), 1);
            assert_eq!(trace["nodes"][0]["path"], "m.rs");
        }
        let callers = runtime
            .trace_path("scope_node_target", None, "callers", 1, &scope, 10)
            .unwrap();
        assert_eq!(callers["root"]["path"], "m.rs");
        assert_eq!(callers["nodes"][0]["path"], "a.rs");
    }

    #[test]
    fn query_scope_cache_preserves_proof_filters_and_distinct_degrees() {
        let (_repo, _state, mut runtime, mut proof) = refresh_fixture("scope-proof-matrix");
        proof.kind = RelationKind::Calls;
        let base_documents = runtime.stored.documents.clone();
        // The evidence file has no document: endpoint membership cannot substitute
        // for checking the evidence path or its hash.
        proof.evidence.as_mut().unwrap().path = "proof.rs".into();
        proof.evidence.as_mut().unwrap().source_hash = Hash32([7; 32]);
        runtime
            .stored
            .path_hashes
            .insert("proof.rs".into(), Hash32([7; 32]));
        for case in [
            "valid",
            "candidate",
            "bounded",
            "unresolved",
            "missing-proof",
            "stale-hash",
            "missing-hash",
            "missing-source",
            "missing-target",
            "non-syntax-source",
            "non-syntax-target",
            "excluded-source",
            "excluded-target",
            "excluded-evidence",
            "different-relation",
        ] {
            runtime.stored.documents = base_documents.clone();
            let mut arc = proof.clone();
            let mut scope = proof_scope();
            let expected = usize::from(case == "valid");
            match case {
                "valid" => {}
                "candidate" => {
                    arc.evidence.as_mut().unwrap().confidence = ConfidenceClass::Candidate
                }
                "bounded" => {
                    arc.evidence.as_mut().unwrap().confidence = ConfidenceClass::BoundedSet
                }
                "unresolved" => {
                    arc.evidence.as_mut().unwrap().confidence = ConfidenceClass::Unresolved
                }
                "missing-proof" => arc.evidence = None,
                "stale-hash" => arc.evidence.as_mut().unwrap().source_hash = Hash32([8; 32]),
                "missing-hash" => arc.evidence.as_mut().unwrap().path = "missing.rs".into(),
                "missing-source" => arc.source = u64::MAX,
                "missing-target" => arc.target = u64::MAX,
                "non-syntax-source" | "non-syntax-target" => {
                    let id = if case == "non-syntax-source" {
                        arc.source
                    } else {
                        arc.target
                    };
                    runtime
                        .stored
                        .documents
                        .iter_mut()
                        .find(|d| d.node_id == id)
                        .unwrap()
                        .provenance = "CALLS".into();
                }
                "excluded-source" | "excluded-target" => {
                    let id = if case == "excluded-source" {
                        arc.source
                    } else {
                        arc.target
                    };
                    runtime
                        .stored
                        .documents
                        .iter_mut()
                        .find(|d| d.node_id == id)
                        .unwrap()
                        .path = "outside.rs".into();
                    scope.exclude.push("outside.rs".into());
                }
                "excluded-evidence" => scope.exclude.push("proof.rs".into()),
                "different-relation" => arc.kind = RelationKind::Implements,
                _ => unreachable!(),
            }
            let mut repeated = arc.clone();
            if let Some(evidence) = repeated.evidence.as_mut() {
                evidence.span = ByteRange::new(30, 40);
            }
            runtime.stored.arcs = vec![arc, repeated];
            let baseline = uncached_definitive_arcs(&runtime.stored, &scope);
            assert_eq!(baseline.len(), expected * 2, "{case}");
            assert_eq!(
                definitive_stored_arcs(&runtime.stored, &scope),
                baseline,
                "{case}"
            );
            for name in ["implementation", "contract"] {
                let found = runtime.search_graph(name, &scope, 10).unwrap();
                for row in found["matches"].as_array().unwrap() {
                    assert_eq!(
                        row["callers"].as_u64().unwrap() + row["callees"].as_u64().unwrap(),
                        expected as u64,
                        "{case}"
                    );
                }
            }
        }
        // Relation identity remains part of degree deduplication; duplicate
        // proofs collapse, while CALLS and IMPLEMENTS remain distinct.
        runtime.stored.documents = base_documents;
        let mut implements = proof.clone();
        implements.kind = RelationKind::Implements;
        runtime.stored.arcs = vec![proof.clone(), proof, implements];
        let mut scope = proof_scope();
        scope.relation_kinds.push(RelationKind::Implements);
        assert_eq!(definitive_stored_arcs(&runtime.stored, &scope).len(), 3);
        assert_eq!(
            runtime.search_graph("implementation", &scope, 10).unwrap()["matches"][0]["callees"],
            2
        );
        assert_eq!(
            runtime.search_graph("contract", &scope, 10).unwrap()["matches"][0]["callers"],
            2
        );
        let usages = runtime
            .find_usages("contract", None, &scope, 1, 10)
            .expect("find proven usages across relations");
        assert_eq!(usages["total"], 2);
        assert_eq!(usages["usages"][0]["relation"], "CALLS");
        assert_eq!(usages["usages"][1]["relation"], "IMPLEMENTS");
    }

    #[test]
    fn query_scope_cache_evaluates_each_consulted_path_once() {
        let (_repo, _state, mut runtime, proof) = refresh_fixture("scope-count");
        for node_id in 100..200 {
            runtime
                .stored
                .documents
                .push(syntax(node_id, "repeated", "excluded.rs", 0, 10));
        }
        // Evidence-only paths must share the cache too, including negative results.
        for path in ["proof.rs", "rejected-proof.rs"] {
            runtime
                .stored
                .path_hashes
                .insert(path.into(), Hash32([7; 32]));
            for _ in 0..100 {
                let mut arc = proof.clone();
                let evidence = arc.evidence.as_mut().unwrap();
                evidence.path = path.into();
                evidence.source_hash = Hash32([7; 32]);
                runtime.stored.arcs.push(arc);
            }
        }
        runtime.stored.coverage.excluded_paths = vec![
            "impl.rs".into(),
            "excluded.rs".into(),
            "coverage-only.rs".into(),
        ];
        runtime.stored.coverage.stale_paths = vec!["coverage-only.rs".into(), "proof.rs".into()];
        runtime.stored.coverage.dynamic_dispatch =
            vec!["impl.rs:1-2".into(), "coverage-only.rs:3-4".into()];
        runtime.stored.coverage.parser_error_ranges = vec![
            SourceRange {
                path: "impl.rs".into(),
                start: 1,
                end: 2,
            },
            SourceRange {
                path: "excluded.rs".into(),
                start: 3,
                end: 4,
            },
        ];
        runtime.stored.coverage.traversal_truncated = true;
        let scope = Scope {
            include: vec!["**/*.rs".into()],
            exclude: vec!["excluded.rs".into(), "rejected-*.rs".into()],
            relation_kinds: vec![RelationKind::Calls, RelationKind::Implements],
            max_depth: 1,
        };
        let mut evaluations = BTreeMap::<String, usize>::new();
        let result = runtime
            .search_graph_with_matcher("repeated", &scope, 50, None, false, |path, scope| {
                *evaluations.entry(path.to_owned()).or_default() += 1;
                path_in_scope(path, scope)
            })
            .unwrap();
        assert_eq!(result["total"], 0);
        let expected = BTreeMap::from([
            ("calls.rs".to_owned(), 1),
            ("impl.rs".to_owned(), 1),
            ("excluded.rs".to_owned(), 1),
            ("proof.rs".to_owned(), 1),
            ("rejected-proof.rs".to_owned(), 1),
            ("coverage-only.rs".to_owned(), 1),
        ]);
        assert_eq!(result["coverage_gap_count"], 8);
        println!("path evaluations: {evaluations:?}");
        assert_eq!(evaluations, expected);
    }

    #[test]
    fn rebuilt_arc_carries_exact_call_site_evidence() {
        let documents = vec![
            syntax(1, "caller", "src/main.py", 0, 80),
            syntax(2, "target", "src/main.py", 90, 110),
            call(3, "target", "src/main.py", 20, 28),
        ];
        let hash = Hash32([4; 32]);
        let arcs = rebuild_arcs(
            &documents,
            &BTreeMap::from([("src/main.py".to_owned(), hash)]),
            &BTreeMap::new(),
        );
        assert_eq!(
            arcs,
            vec![StoredArc {
                source: 1,
                target: 2,
                kind: RelationKind::Calls,
                evidence: Some(EdgeEvidence {
                    path: "src/main.py".to_owned(),
                    span: ByteRange::new(20, 28),
                    source_hash: hash,
                    resolver: ResolverClass::SyntaxExact,
                    confidence: ConfidenceClass::Proven,
                    assumptions: Vec::new(),
                    counter_evidence: Vec::new(),
                }),
            }]
        );
    }

    #[test]
    fn legacy_arc_without_evidence_is_rebuilt_from_documents() {
        let mut stored = StoredIndex {
            extraction_revision: EXTRACTION_REVISION,
            cargo_manifests: BTreeMap::new(),
            rust_files: BTreeMap::new(),
            ts_files: BTreeMap::new(),
            ts_resolution_configs: BTreeMap::new(),
            go_modules: BTreeMap::new(),
            snapshot: RepoSnapshot {
                repo_revision: "test".to_owned(),
                working_tree_digest: Hash32([0; 32]),
                graph_generation: 7,
            },
            index_input_bytes: 0,
            indexed_files: 1,
            path_hashes: BTreeMap::from([("src/main.py".to_owned(), Hash32([4; 32]))]),
            documents: vec![
                syntax(1, "caller", "src/main.py", 0, 80),
                syntax(2, "target", "src/main.py", 90, 110),
                call(3, "target", "src/main.py", 20, 28),
            ],
            arcs: vec![StoredArc {
                source: 1,
                target: 2,
                kind: RelationKind::Calls,
                evidence: None,
            }],
            coverage: CoverageMetadata::default(),
        };
        normalize_stored(&mut stored);
        assert_eq!(stored.arcs.len(), 1);
        assert!(stored.arcs.iter().all(|arc| arc.evidence.is_some()));
    }

    #[test]
    fn proof_bearing_non_calls_arc_survives_open_normalization_unchanged() {
        let preserved = StoredArc {
            source: 1,
            target: 2,
            kind: RelationKind::Implements,
            evidence: Some(EdgeEvidence {
                path: "src/trait.rs".to_owned(),
                span: ByteRange::new(5, 11),
                source_hash: Hash32([7; 32]),
                resolver: ResolverClass::CompilerConfirmed,
                confidence: ConfidenceClass::Proven,
                assumptions: vec![Hash32([8; 32])],
                counter_evidence: vec![Hash32([9; 32])],
            }),
        };
        let mut stored = StoredIndex {
            extraction_revision: EXTRACTION_REVISION,
            cargo_manifests: BTreeMap::new(),
            rust_files: BTreeMap::new(),
            ts_files: BTreeMap::new(),
            ts_resolution_configs: BTreeMap::new(),
            go_modules: BTreeMap::new(),
            snapshot: RepoSnapshot {
                repo_revision: "test".to_owned(),
                working_tree_digest: Hash32([0; 32]),
                graph_generation: 7,
            },
            index_input_bytes: 0,
            indexed_files: 1,
            path_hashes: BTreeMap::from([("src/trait.rs".to_owned(), Hash32([7; 32]))]),
            documents: vec![
                syntax(1, "implementation", "src/trait.rs", 0, 40),
                syntax(2, "trait", "src/trait.rs", 41, 80),
            ],
            arcs: vec![preserved.clone()],
            coverage: CoverageMetadata::default(),
        };

        normalize_stored(&mut stored);

        assert_eq!(stored.arcs, vec![preserved]);
    }

    #[test]
    fn refresh_invalidates_non_calls_even_on_unrelated_source_change() {
        let (repository, _state, mut runtime, preserved) =
            refresh_fixture("preserve-non-calls-refresh");
        fs::write(
            repository.path().join("calls.rs"),
            b"fn target() {}\nfn caller() { target(); target(); }\n",
        )
        .expect("change unrelated call source");

        assert!(runtime.refresh(repository.path()).expect("refresh source"));

        assert!(!runtime.stored.arcs.contains(&preserved));
    }

    #[test]
    fn refresh_drops_changed_or_deleted_non_calls_evidence() {
        let (changed_repository, _changed_state, mut changed_runtime, _) =
            refresh_fixture("changed-non-calls-refresh");
        fs::write(
            changed_repository.path().join("impl.rs"),
            b"fn implementation() { println!(\"changed\"); }\nfn contract() {}\n",
        )
        .expect("change evidence source");
        assert!(
            changed_runtime
                .refresh(changed_repository.path())
                .expect("refresh changed evidence source")
        );
        assert!(
            changed_runtime
                .stored
                .arcs
                .iter()
                .all(|arc| arc.kind != RelationKind::Implements)
        );

        let (deleted_repository, _deleted_state, mut deleted_runtime, _) =
            refresh_fixture("deleted-non-calls-refresh");
        fs::remove_file(deleted_repository.path().join("impl.rs")).expect("delete evidence source");
        assert!(
            deleted_runtime
                .refresh(deleted_repository.path())
                .expect("refresh deleted evidence source")
        );
        assert!(!deleted_runtime.stored.path_hashes.contains_key("impl.rs"));
        assert!(
            deleted_runtime
                .stored
                .arcs
                .iter()
                .all(|arc| arc.kind != RelationKind::Implements)
        );
    }
    #[test]
    fn legacy_rust_rebuild_rejects_shadowed_binding_with_positive_control() {
        for (source, expected) in [
            ("fn target() {} fn caller(target: fn()) { target(); }", 0),
            ("fn target() {} fn caller() { target(); }", 1),
        ] {
            let path = "main.rs";
            let mut extracted = extract_path(path, source.as_bytes()).unwrap();
            let call_start = source.rfind("target();").unwrap();
            if extracted
                .documents
                .iter()
                .all(|document| document.provenance != "CALLS")
            {
                extracted.documents.push(call(
                    999,
                    "target",
                    path,
                    call_start,
                    call_start + "target()".len(),
                ));
            }
            let hash = Hash32(*blake3::hash(source.as_bytes()).as_bytes());
            let mut stored = StoredIndex {
                extraction_revision: EXTRACTION_REVISION,
                cargo_manifests: BTreeMap::new(),
                rust_files: BTreeMap::new(),
                ts_files: BTreeMap::new(),
                ts_resolution_configs: BTreeMap::new(),
                go_modules: BTreeMap::new(),
                snapshot: RepoSnapshot {
                    repo_revision: "test".into(),
                    working_tree_digest: Hash32([0; 32]),
                    graph_generation: 7,
                },
                index_input_bytes: 0,
                indexed_files: 1,
                path_hashes: BTreeMap::from([(path.to_owned(), hash)]),
                documents: extracted.documents,
                arcs: vec![StoredArc {
                    source: 999,
                    target: 998,
                    kind: RelationKind::Calls,
                    evidence: None,
                }],
                coverage: CoverageMetadata::default(),
            };
            normalize_stored(&mut stored);
            assert_eq!(stored.arcs.len(), expected, "{source}");
        }
    }

    #[test]
    fn rebuild_omits_arc_without_path_hash() {
        let documents = vec![
            syntax(1, "caller", "main.py", 0, 80),
            syntax(2, "target", "main.py", 90, 110),
            call(3, "target", "main.py", 20, 28),
        ];
        assert!(rebuild_arcs(&documents, &BTreeMap::new(), &BTreeMap::new()).is_empty());
    }

    #[test]
    fn legacy_json_is_rebuilt_from_documents_not_old_endpoints() {
        let legacy: StoredArc = serde_json::from_str(r#"{"source":999,"target":998}"#).unwrap();
        assert_eq!(legacy.kind, RelationKind::Calls);
        assert!(legacy.evidence.is_none());
        let hash = Hash32([4; 32]);
        let mut stored = StoredIndex {
            extraction_revision: EXTRACTION_REVISION,
            cargo_manifests: BTreeMap::new(),
            rust_files: BTreeMap::new(),
            ts_files: BTreeMap::new(),
            ts_resolution_configs: BTreeMap::new(),
            go_modules: BTreeMap::new(),
            snapshot: RepoSnapshot {
                repo_revision: "test".into(),
                working_tree_digest: Hash32([0; 32]),
                graph_generation: 7,
            },
            index_input_bytes: 0,
            indexed_files: 1,
            path_hashes: BTreeMap::from([("main.py".to_owned(), hash)]),
            documents: vec![
                syntax(1, "caller", "main.py", 0, 80),
                syntax(2, "target", "main.py", 90, 110),
                call(3, "target", "main.py", 20, 28),
            ],
            arcs: vec![legacy],
            coverage: CoverageMetadata::default(),
        };
        normalize_stored(&mut stored);
        assert_eq!(
            stored.arcs,
            vec![StoredArc {
                source: 1,
                target: 2,
                kind: RelationKind::Calls,
                evidence: Some(EdgeEvidence {
                    path: "main.py".into(),
                    span: ByteRange::new(20, 28),
                    source_hash: hash,
                    resolver: ResolverClass::SyntaxExact,
                    confidence: ConfidenceClass::Proven,
                    assumptions: vec![],
                    counter_evidence: vec![]
                })
            }]
        );
    }

    fn proof_scope() -> Scope {
        Scope {
            include: vec![],
            exclude: vec![],
            relation_kinds: vec![RelationKind::Calls],
            max_depth: 2,
        }
    }

    #[test]
    fn runtime_definitive_consumers_reject_non_proven_and_out_of_relation_arcs() {
        for confidence in [
            ConfidenceClass::Candidate,
            ConfidenceClass::BoundedSet,
            ConfidenceClass::Unresolved,
            ConfidenceClass::Proven,
        ] {
            for kind in [RelationKind::Calls, RelationKind::Implements] {
                let (_repo, _state, mut runtime, mut proof) =
                    refresh_fixture("definitive-consumers");
                proof.kind = kind;
                proof.evidence.as_mut().unwrap().confidence = confidence;
                runtime.stored.arcs = vec![proof.clone()];
                normalize_stored(&mut runtime.stored);
                let scope = proof_scope();
                let expected = confidence == ConfidenceClass::Proven && kind == RelationKind::Calls;
                let search = runtime.search_graph("implementation", &scope, 1).unwrap();
                assert_eq!(
                    search["matches"][0]["callees"],
                    usize::from(expected),
                    "search {confidence:?} {kind:?}"
                );
                let trace = runtime
                    .trace_path("implementation", None, "callees", 1, &scope, 10)
                    .unwrap();
                assert_eq!(
                    trace["nodes"].as_array().unwrap().len(),
                    usize::from(expected),
                    "trace {confidence:?} {kind:?}"
                );
                let report = runtime
                    .orient(QueryRequest {
                        task: "implementation".to_owned(),
                        scope,
                        mode: Mode::Precise,
                        token_budget: 800,
                    })
                    .unwrap();
                assert_eq!(
                    report
                        .compiled
                        .packed
                        .records
                        .iter()
                        .any(|r| r.node_id == proof.target),
                    expected,
                    "orient {confidence:?} {kind:?}"
                );
                assert_eq!(
                    report
                        .compiled
                        .packed
                        .records
                        .iter()
                        .any(|r| r.neighbors.contains(&proof.target)),
                    expected,
                    "neighbors {confidence:?} {kind:?}"
                );
            }
        }
    }

    #[test]
    fn refresh_keeps_non_calls_only_without_source_change() {
        let (repo, _state, mut runtime, preserved) = refresh_fixture("no-change-proof");
        assert!(!runtime.refresh(repo.path()).unwrap());
        assert!(runtime.stored.arcs.contains(&preserved));
    }

    #[test]
    fn refresh_invalidates_non_calls_on_target_only_change_or_deletion() {
        for delete in [false, true] {
            let (repo, _state, mut runtime, mut proof) = refresh_fixture("target-change-proof");
            let target = runtime
                .stored
                .documents
                .iter()
                .find(|d| d.provenance == "SYNTAX" && d.qualified_name == "target")
                .unwrap()
                .node_id;
            proof.target = target;
            runtime.stored.arcs = vec![proof.clone()];
            if delete {
                fs::remove_file(repo.path().join("calls.rs")).unwrap();
            } else {
                fs::write(
                    repo.path().join("calls.rs"),
                    b"fn target() { let required = 1; }\nfn caller() {}\n",
                )
                .unwrap();
            }
            assert!(runtime.refresh(repo.path()).unwrap());
            assert_eq!(
                runtime.stored.path_hashes.get("impl.rs"),
                Some(&proof.evidence.as_ref().unwrap().source_hash)
            );
            if !delete {
                assert!(runtime.stored.documents.iter().any(|d| d.node_id == target));
            }
            assert!(
                !runtime
                    .stored
                    .arcs
                    .iter()
                    .any(|a| a.kind == RelationKind::Implements)
            );
        }
    }

    #[test]
    fn mixed_legacy_migration_preserves_valid_non_calls_proof() {
        let (_repo, _state, mut runtime, proof) = refresh_fixture("mixed-legacy");
        runtime
            .stored
            .arcs
            .push(serde_json::from_str(r#"{"source":999,"target":998}"#).unwrap());
        normalize_stored(&mut runtime.stored);
        assert!(runtime.stored.arcs.contains(&proof));
        assert!(
            runtime
                .stored
                .arcs
                .iter()
                .all(|a| a.evidence.is_some() && a.source != 999)
        );
        assert!(
            runtime
                .stored
                .arcs
                .iter()
                .any(|a| a.kind == RelationKind::Calls)
        );
    }
}

#[cfg(test)]
mod go_replacement_parser_tests {
    use super::go_module_name;

    #[test]
    fn ancestor_replacement_and_ambiguous_blocks_are_not_module_proof() {
        for source in [
            "module example/vpn\nreplace example => ./other\n",
            "module vpn\nreplace (\nexample/lib => ./lib\nreplace other/lib => ./other\n)\n",
            "module vpn\nreplace example/lib nope => ./lib\n",
            "module vpn\nreplace example/lib => ./lib unexpected\n",
        ] {
            assert_eq!(go_module_name(source.as_bytes()), None, "{source}");
        }
    }
}

#[cfg(test)]
mod compact_storage_tests {
    use super::*;

    fn document() -> StoredDocument {
        serde_json::from_value(json!({
            "node_id": 7, "qualified_name": "Target", "path": "src/api.go",
            "text": "Target", "span_start": 11, "span_end": 17,
            "provenance": "SYNTAX"
        }))
        .unwrap()
    }

    #[test]
    fn sparse_go_field_proof_uses_one_pointer_per_document() {
        let mut doc = document();
        assert_eq!(
            std::mem::size_of_val(&doc.go_field_target),
            std::mem::size_of::<usize>()
        );
        doc.go_field_target = Some(
            serde_json::from_value(json!({
                "package": "queue", "caller": {"start": 1, "end": 5},
                "receiver_type": {"start": 10, "end": 19}, "field": {"start": 22, "end": 27},
                "field_type": {"start": 30, "end": 43}, "target": {"start": 50, "end": 53}
            }))
            .unwrap(),
        );
        assert_eq!(
            std::mem::size_of_val(&doc.go_field_target),
            std::mem::size_of::<usize>()
        );
    }

    #[test]
    fn sparse_go_field_proof_preserves_json_shape() {
        let mut doc = document();
        assert!(
            serde_json::to_value(&doc)
                .unwrap()
                .get("go_field_target")
                .is_none()
        );
        let proof = json!({
            "package": "queue", "caller": {"start": 1, "end": 5},
            "receiver_type": {"start": 10, "end": 19}, "field": {"start": 22, "end": 27},
            "field_type": {"start": 30, "end": 43}, "target": {"start": 50, "end": 53}
        });
        doc.go_field_target = Some(serde_json::from_value(proof.clone()).unwrap());
        let encoded = serde_json::to_value(&doc).unwrap();
        assert_eq!(encoded["go_field_target"], proof);
        assert_eq!(
            serde_json::from_value::<StoredDocument>(encoded).unwrap(),
            doc
        );
        assert_eq!(EXTRACTION_REVISION, 23);
    }

    #[test]
    fn compact_storage_omits_only_default_metadata() {
        let doc = document();
        let value = serde_json::to_value(&doc).unwrap();
        for field in [
            "go_import_explicit_alias",
            "search_text",
            "body_start",
            "body_end",
            "semantic_tags",
        ] {
            assert!(value.get(field).is_none(), "redundant default: {field}");
        }
        for field in [
            "node_id",
            "qualified_name",
            "path",
            "text",
            "span_start",
            "span_end",
            "provenance",
        ] {
            assert!(
                value.get(field).is_some(),
                "required identity lost: {field}"
            );
        }
        assert_eq!(
            serde_json::from_value::<StoredDocument>(value).unwrap(),
            doc
        );
    }

    #[test]
    fn compact_storage_retains_nondefault_proof_and_search_metadata() {
        let mut doc = document();
        doc.go_import_path = Some("example.test/foo".to_owned());
        doc.go_import_explicit_alias = true;
        doc.go_package = Some("actual".to_owned());
        doc.search_text = "func Target() {}".to_owned();
        doc.body_start = 3;
        doc.body_end = 42;
        doc.semantic_tags = vec!["EXACT_CALL".to_owned()];
        let value = serde_json::to_value(&doc).unwrap();
        assert_eq!(value["go_import_explicit_alias"], true);
        assert_eq!(value["go_package"], "actual");
        assert_eq!(value["search_text"], "func Target() {}");
        assert_eq!(value["body_start"], 3);
        assert_eq!(value["body_end"], 42);
        assert_eq!(value["semantic_tags"], json!(["EXACT_CALL"]));
        assert_eq!(
            serde_json::from_value::<StoredDocument>(value).unwrap(),
            doc
        );
    }

    #[test]
    fn compact_storage_accepts_legacy_dense_and_missing_defaults_identically() {
        let doc = document();
        let mut dense = serde_json::to_value(&doc).unwrap();
        for (key, value) in [
            ("go_import_explicit_alias", json!(false)),
            ("search_text", json!("")),
            ("body_start", json!(0)),
            ("body_end", json!(0)),
            ("semantic_tags", json!([])),
        ] {
            dense[key] = value;
        }
        let from_dense: StoredDocument = serde_json::from_value(dense).unwrap();
        assert_eq!(from_dense, doc);
        let encoded = serde_json::to_value(&from_dense).unwrap();
        assert!(encoded.get("go_import_explicit_alias").is_none());
        assert_eq!(
            serde_json::from_value::<StoredDocument>(encoded).unwrap(),
            doc
        );
    }

    #[test]
    fn compact_storage_does_not_coerce_invalid_metadata_to_defaults() {
        for (key, invalid) in [
            ("go_import_explicit_alias", json!("false")),
            ("go_import_explicit_alias", json!(null)),
            ("body_start", json!(-1)),
            ("semantic_tags", json!("")),
            ("search_text", json!(false)),
        ] {
            let mut value = serde_json::to_value(document()).unwrap();
            value[key] = invalid;
            assert!(
                serde_json::from_value::<StoredDocument>(value).is_err(),
                "{key}"
            );
        }
    }
}

#[cfg(test)]
mod ts_inventory_cache_tests {
    use super::*;
    use std::cell::Cell;
    use std::sync::atomic::{AtomicU64, Ordering};
    thread_local! { pub(super) static DIRECTORY_READS: Cell<usize> = const { Cell::new(0) }; }
    thread_local! {
        pub(super) static INVENTORY_BUILDS: Cell<usize> = const { Cell::new(0) };
        pub(super) static MODULE_EXPANSIONS: Cell<usize> = const { Cell::new(0) };
    }
    static ID: AtomicU64 = AtomicU64::new(0);
    struct Fixture(PathBuf);
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    #[test]
    fn repeated_named_imports_expand_once_per_inventory_pass() {
        let fixture = Fixture(std::env::temp_dir().join(format!(
            "cgrx-candidate-cache-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        )));
        fs::create_dir_all(&fixture.0).unwrap();
        let source = "import { a, b, c } from './worker'; export { d, e } from './worker';";
        fs::write(fixture.0.join("main.ts"), source).unwrap();
        let hash = Hash32(*blake3::hash(source.as_bytes()).as_bytes());
        let mut files = BTreeMap::from([(
            "main.ts".to_owned(),
            StoredTsFileFacts {
                source_hash: hash,
                facts: TsFileFacts::parse("main.ts", source.as_bytes()),
                inventory_only: false,
            },
        )]);
        let mut hashes = BTreeMap::from([("main.ts".to_owned(), hash)]);
        let mut configs = BTreeMap::new();
        for pass in 0..2 {
            INVENTORY_BUILDS.with(|n| n.set(0));
            MODULE_EXPANSIONS.with(|n| n.set(0));
            let (_, invalid) =
                scan_ts_inventory(&fixture.0, &mut hashes, &mut files, &mut configs).unwrap();
            assert!(invalid.is_empty());
            assert_eq!(
                INVENTORY_BUILDS.with(Cell::get),
                1,
                "one candidate set per pass"
            );
            assert_eq!(
                MODULE_EXPANSIONS.with(Cell::get),
                1,
                "one expansion per distinct module"
            );
            if pass == 0 {
                fs::write(fixture.0.join("worker.ts"), "export function a() {}").unwrap();
            } else {
                assert!(
                    files["worker.ts"].inventory_only,
                    "new filesystem target remains a presence blocker"
                );
            }
        }
    }

    #[test]
    fn directory_reads_are_shared_within_inventory_but_not_across_refreshes() {
        let fixture = Fixture(std::env::temp_dir().join(format!(
            "cgrx-dir-cache-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        )));
        fs::create_dir_all(fixture.0.join("src/nested")).unwrap();
        let mut files = BTreeMap::new();
        let mut hashes = BTreeMap::new();
        let mut add = |path: String, source: String| {
            fs::write(fixture.0.join(&path), &source).unwrap();
            let hash = Hash32(*blake3::hash(source.as_bytes()).as_bytes());
            hashes.insert(path.clone(), hash);
            files.insert(
                path.clone(),
                StoredTsFileFacts {
                    source_hash: hash,
                    facts: TsFileFacts::parse(&path, source.as_bytes()),
                    inventory_only: false,
                },
            );
        };
        let mut imports = String::new();
        for i in 0..8 {
            add(
                format!("src/nested/worker{i}.ts"),
                format!("export function f{i}() {{}}"),
            );
            imports.push_str(&format!("import {{ f{i} }} from './worker{i}';\n"));
        }
        add("src/nested/main.ts".into(), imports);
        let mut configs = BTreeMap::new();
        DIRECTORY_READS.with(|n| n.set(0));
        assert!(
            !scan_ts_inventory(&fixture.0, &mut hashes, &mut files, &mut configs)
                .unwrap()
                .0
        );
        assert_eq!(
            DIRECTORY_READS.with(Cell::get),
            3,
            "enumerate root/src/nested once, not once for every import target"
        );
        assert!(
            !scan_ts_inventory(&fixture.0, &mut hashes, &mut files, &mut configs)
                .unwrap()
                .0
        );
        assert_eq!(
            DIRECTORY_READS.with(Cell::get),
            6,
            "a new refresh must re-enumerate directories"
        );
    }
    #[test]
    fn cached_directory_identity_rechecks_case_and_symlink_changes() {
        let fixture = Fixture(std::env::temp_dir().join(format!(
            "cgrx-dir-mutation-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        )));
        fs::create_dir_all(fixture.0.join("src")).unwrap();
        fs::write(fixture.0.join("src/worker.ts"), "export function run() {}").unwrap();
        let mut cache = TsDirectoryCache::default();
        assert!(ts_path_is_plain(
            &fixture.0,
            Path::new("src/worker.ts"),
            &mut cache
        ));
        fs::rename(
            fixture.0.join("src/worker.ts"),
            fixture.0.join("src/temp.ts"),
        )
        .unwrap();
        fs::rename(
            fixture.0.join("src/temp.ts"),
            fixture.0.join("src/Worker.ts"),
        )
        .unwrap();
        assert!(!ts_path_is_plain(
            &fixture.0,
            Path::new("src/worker.ts"),
            &mut cache
        ));
        assert!(ts_path_is_plain(
            &fixture.0,
            Path::new("src/Worker.ts"),
            &mut cache
        ));
        fs::rename(fixture.0.join("src"), fixture.0.join("real")).unwrap();
        std::os::unix::fs::symlink("real", fixture.0.join("src")).unwrap();
        assert!(!ts_path_is_plain(
            &fixture.0,
            Path::new("src/Worker.ts"),
            &mut cache
        ));
    }

    #[test]
    fn missing_directory_can_be_created_without_reusing_absence() {
        let fixture = Fixture(std::env::temp_dir().join(format!(
            "cgrx-dir-missing-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        )));
        fs::create_dir_all(&fixture.0).unwrap();
        let mut cache = TsDirectoryCache::default();
        assert!(!ts_path_is_plain(
            &fixture.0,
            Path::new("src/worker.ts"),
            &mut cache
        ));
        fs::create_dir(fixture.0.join("src")).unwrap();
        fs::write(fixture.0.join("src/worker.ts"), "export function run() {}").unwrap();
        assert!(ts_path_is_plain(
            &fixture.0,
            Path::new("src/worker.ts"),
            &mut cache
        ));
    }
}
