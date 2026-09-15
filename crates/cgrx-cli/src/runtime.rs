mod architecture;
mod config;
mod frameworks;
mod graph_view;
mod observations;
mod refactors;
mod risks;
pub mod security;
mod ts_config;
mod helpers;
mod extraction;
mod arc_resolution;
mod orient_helpers;
mod ts_helpers;
mod scan_helpers;
mod git_helpers;
mod index_helpers;
#[cfg(test)]
mod tests;

use helpers::{body_fingerprint, declaration_name, generation_id, stable_node_id};
use extraction::{ExtractedPath, ExtractedSource, extract_path, extract_sources_parallel, outer_dynamic_spans};
use arc_resolution::{rebuild_arcs_with_cargo, go_module_name, split_call_target, path_matches_qualifier};
use orient_helpers::{task_evidence_ids, exact_symbol_ids, definition_body_ids, lexical_terms, neighbor_map, graph_evidence_ids};
use ts_helpers::{is_ts_inventory_path, is_ts_resolution_config, remove_path, scan_ts_inventory, scan_ts_inventory_cached, source_fingerprint, store_ts_presence_blocker, ts_config_modules, ts_config_supported_for, ts_inventory_candidates, ts_module_specifiers, ts_path_is_plain, ts_paths_portable_for, ts_resolution_config_supported};
use scan_helpers::{crosses_nested_git_boundary, expand_untracked_directories, collect_untracked_sources, watch_scan_path, normalize_stored, refresh_qualified_call_gaps, definitive_stored_arcs, rebuild_refreshed_arcs, changed_paths, working_tree_digest, ScopedQuery};
use git_helpers::{parse_committed_tree, GitBlobBatch, refresh_status, coverage_for_scope, coverage_for_scope_with_matcher, coverage_gap_page, coverage_gap_count, dynamic_dispatch_path, git_bytes, git_text, store_writer_error};
use index_helpers::index_source;
pub use config::RuntimeConfig;
pub use graph_view::{GraphDirection, GraphViewRequest};
pub use observations::{
    ImportRuntimeEvidenceReport, RuntimeEvidenceFormat, RuntimeInsight, RuntimeInsightsReport,
};
pub use risks::{RiskBaseline, TestCaseResult, TestOutcome, TestRunRecord};
use ts_config::TsResolutionConfig;

use levenshtein::levenshtein;
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

const EXTRACTION_REVISION: u32 = 28;

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

    pub fn public(code: &'static str, detail: impl Into<String>) -> Self {
        Self::new(code, detail)
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
struct GoLocalConstructorTarget {
    package: String,
    caller: ByteRange,
    binding: String,
    constructor: String,
    target: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
struct JavaConstructorTarget {
    caller: ByteRange,
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

// body_fingerprint is defined in helpers.rs

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
struct StoredDocument {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    rust_module_target: Option<TsLexicalTarget>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    rust_self_target: Option<Box<RustSelfTarget>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    ts_lexical_target: Option<TsLexicalTarget>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    ts_constructor_target: Option<TsLexicalTarget>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    go_field_target: Option<Box<GoFieldTarget>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    go_local_constructor_target: Option<GoLocalConstructorTarget>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    java_constructor_target: Option<Box<JavaConstructorTarget>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    semantic_fingerprint: Option<String>,
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
    state_root: PathBuf,
    stored: StoredIndex,
    base_snapshot: RepoSnapshot,
    base_path_hashes: BTreeMap<String, Hash32>,
    changed_paths: BTreeSet<String>,
    refresh_input_bytes: u64,
    source_fingerprints: BTreeMap<String, SourceFingerprint>,
    ts_verified_fingerprints: BTreeMap<String, SourceFingerprint>,
    base_traversal_truncated: bool,
    untracked_scan_cache: Option<UntrackedScanCache>,
}

#[derive(Clone, Copy, Eq, PartialEq)]
pub(super) struct SourceFingerprint {
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

/// Reuse the published generation when it already matches this snapshot.
/// Any unreadable, mismatched or stale segment falls through to a full
/// rebuild, never to reused wrong data.
fn open_current_report(state: &Path, snapshot: &RepoSnapshot) -> Option<IndexReport> {
    let reader = GenerationReader::open_current(state).ok()?;
    if reader.snapshot() != snapshot {
        return None;
    }
    let bytes = reader.read_segment(NODES_SEGMENT).ok()?;
    let stored: StoredIndex = serde_json::from_slice(&bytes).ok()?;
    if stored.snapshot != *snapshot
        || stored.extraction_revision != EXTRACTION_REVISION
        || reader.read_segment(TERMS_SEGMENT).ok().as_deref() != Some(TERMS_MARKER)
    {
        return None;
    }
    Some(IndexReport {
        snapshot: snapshot.clone(),
        index_input_bytes: stored.index_input_bytes,
        indexed_files: stored.indexed_files,
    })
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
        if language.is_some_and(|language| {
            !matches!(language, "typescript" | "go" | "java" | "python" | "rust" | "c" | "cpp" | "csharp" | "ruby" | "php" | "swift" | "scala" | "elixir" | "kotlin")
        }) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "language must be one of typescript, go, java, python, rust, c, cpp, csharp, ruby, php, swift, scala, elixir, or kotlin",
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
                    // Fuzzy matching: allow up to 2 edits for short queries, 3 for longer
                    let max_distance = if folded.len() <= 4 { 1 } else if folded.len() <= 8 { 2 } else { 3 };
                    if levenshtein(&name, &folded) <= max_distance {
                        (4, "fuzzy")
                    } else {
                        return None;
                    }
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

    /// Exact duplicate-implementation lookup over structural body
    /// fingerprints. Only SYNTAX documents with a computed fingerprint match;
    /// results are scoped, sorted deterministically, and never guessed.
    /// Detect symbols with zero incoming calls within the given scope.
    /// Returns symbols that are defined (SYNTAX provenance) but never called
    /// by any other symbol in the codebase, filtered to the given scope.
    pub fn detect_dead_code(
        &self,
        scope: &Scope,
        language: Option<&str>,
        limit: usize,
    ) -> Result<Value, RuntimeError> {
        if !(1..=200).contains(&limit) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "limit must be between 1 and 200",
            ));
        }
        let mut scoped = ScopedQuery::new(&self.stored, scope, path_in_scope);
        let arcs = scoped.definitive_arcs(&self.stored);
        // Count incoming calls for each SYNTAX node
        let mut incoming: BTreeMap<u64, usize> = BTreeMap::new();
        for arc in &arcs {
            if arc.kind == RelationKind::Calls {
                *incoming.entry(arc.target).or_default() += 1;
            }
        }
        // Find SYNTAX documents with zero incoming calls
        let mut candidates: Vec<_> = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX"
                    && scoped.contains_path(&document.path)
                    && language.is_none_or(|lang| {
                        pack_for_path(Path::new(&document.path))
                            .is_some_and(|pack| pack.id() == lang)
                    })
                    && !incoming.contains_key(&document.node_id)
            })
            .map(|document| {
                let outgoing = arcs
                    .iter()
                    .filter(|arc| arc.source == document.node_id && arc.kind == RelationKind::Calls)
                    .count();
                (document, outgoing)
            })
            .collect();
        candidates.sort_by_key(|(doc, outgoing)| {
            (doc.path.clone(), doc.span_start, *outgoing)
        });
        let total = candidates.len();
        let rows: Vec<_> = candidates
            .into_iter()
            .take(limit)
            .map(|(document, outgoing)| {
                json!({
                    "node_id": document.node_id,
                    "symbol": document.qualified_name,
                    "path": document.path,
                    "span": {"start": document.span_start, "end": document.span_end},
                    "outgoing_calls": outgoing
                })
            })
            .collect();
        Ok(json!({
            "snapshot": self.stored.snapshot,
            "dead_symbols": rows,
            "total": total,
            "truncated": total > limit,
            "coverage_gap_count": coverage_gap_count(&scoped.coverage(&self.stored.coverage))
        }))
    }

    pub fn find_similar(
        &self,
        symbol: &str,
        path: Option<&str>,
        limit: usize,
        scope: &Scope,
    ) -> Result<Value, RuntimeError> {
        if symbol.trim().is_empty() || !(1..=50).contains(&limit) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "symbol and limit 1..50 are required",
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
        let root_json = json!({
            "qualified_name": root.qualified_name,
            "path": root.path,
            "span_start": root.span_start,
            "span_end": root.span_end,
            "node_id": root.node_id,
        });
        let Some(fingerprint) = &root.semantic_fingerprint else {
            return Ok(json!({
                "root": root_json,
                "fingerprint": Value::Null,
                "matches": [],
                "matched": 0,
                "truncated": false,
            }));
        };
        let matches: Vec<_> = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX"
                    && document.node_id != root.node_id
                    && scoped.contains_path(&document.path)
                    && document.semantic_fingerprint.as_ref() == Some(fingerprint)
            })
            .collect();
        let matched = matches.len();
        let truncated = matched > limit;
        let rows = matches
            .into_iter()
            .take(limit)
            .map(|document| {
                json!({
                    "qualified_name": document.qualified_name,
                    "path": document.path,
                    "span_start": document.span_start,
                    "span_end": document.span_end,
                    "node_id": document.node_id,
                })
            })
            .collect::<Vec<_>>();
        Ok(json!({
            "root": root_json,
            "fingerprint": fingerprint,
            "matches": rows,
            "matched": matched,
            "truncated": truncated,
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

    /// Explain a symbol: return its definition, callers, callees, and usages.
    /// Combines get_code_snippet + find_usages + trace_path into one call.
    pub fn explain_symbol(
        &self,
        symbol: &str,
        path: Option<&str>,
        scope: &Scope,
        depth: u8,
        limit: usize,
    ) -> Result<Value, RuntimeError> {
        let symbol = symbol.trim();
        if symbol.is_empty() || path.is_some_and(|path| path.trim().is_empty()) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "symbol must be non-empty and path, when supplied, must be non-empty",
            ));
        }
        let limit = limit.min(50);
        let depth = depth.min(4);

        // 1. Get definition
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

        let definition = json!({
            "symbol": document.qualified_name,
            "path": document.path,
            "span": {"start": document.span_start, "end": document.span_end},
            "declaration": document.text,
            "source": document.search_text,
        });

        // 2. Get callers (incoming calls)
        let mut scoped = ScopedQuery::new(&self.stored, scope, path_in_scope);
        let by_id: BTreeMap<_, _> = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX" && scoped.contains_path(&document.path)
            })
            .map(|document| (document.node_id, document))
            .collect();

        let mut callers = Vec::new();
        let mut callees = Vec::new();

        for arc in scoped.definitive_arcs(&self.stored) {
            if arc.target == document.node_id {
                if let Some(source) = by_id.get(&arc.source) {
                    callers.push(json!({
                        "symbol": source.qualified_name,
                        "path": source.path,
                        "span": {"start": source.span_start, "end": source.span_end},
                    }));
                }
            }
            if arc.source == document.node_id {
                if let Some(target) = by_id.get(&arc.target) {
                    callees.push(json!({
                        "symbol": target.qualified_name,
                        "path": target.path,
                        "span": {"start": target.span_start, "end": target.span_end},
                    }));
                }
            }
        }

        callers.truncate(limit);
        callees.truncate(limit);

        // 3. Get usages (deeper trace)
        let mut incoming = BTreeMap::<u64, Vec<&StoredArc>>::new();
        for arc in scoped.definitive_arcs(&self.stored) {
            incoming.entry(arc.target).or_default().push(arc);
        }

        let mut visited = BTreeSet::from([document.node_id]);
        let mut frontier = vec![document.node_id];
        let mut usages = Vec::new();

        for hop in 1..=depth {
            let mut next = BTreeSet::new();
            for target_id in &frontier {
                for arc in incoming.get(target_id).into_iter().flatten() {
                    if visited.contains(&arc.source) {
                        continue;
                    }
                    if let Some(source) = by_id.get(&arc.source) {
                        usages.push(json!({
                            "symbol": source.qualified_name,
                            "path": source.path,
                            "span": {"start": source.span_start, "end": source.span_end},
                            "hop": hop,
                        }));
                        next.insert(arc.source);
                    }
                }
            }
            visited.extend(&next);
            frontier = next.into_iter().collect();
        }

        usages.truncate(limit);

        Ok(json!({
            "snapshot": self.stored.snapshot,
            "definition": definition,
            "callers": callers,
            "callees": callees,
            "usages": usages,
            "callers_count": callers.len(),
            "callees_count": callees.len(),
            "usages_count": usages.len(),
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

    /// Detect framework usage within the given paths/scopes and evaluate the
    /// conservative, deterministic framework gate.
    ///
    /// No LLM is involved and the result is bound to the current snapshot. The
    /// gate reports Django/FastAPI/Express signals, confidence, false-positive
    /// guards and an explicit PASS/WARN/FAIL/INCONCLUSIVE verdict.
    pub fn check_framework_gates(
        &self,
        paths: &[String],
        scopes: &[String],
        fail_on: &str,
        max_framework_confidence: usize,
        max_false_positive_matches: usize,
    ) -> Result<Value, RuntimeError> {
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

        let mut include: Vec<String> = Vec::new();
        include.extend(paths.iter().cloned());
        include.extend(scopes.iter().cloned());
        let scope = Scope {
            include,
            exclude: Vec::new(),
            relation_kinds: Vec::new(),
            max_depth: 1,
        };

        let snapshot = self.snapshot().clone();
        let detection =
            frameworks::detect_frameworks(&self.stored.documents, &scope, snapshot, path_in_scope);
        let thresholds = frameworks::FrameworkGateThresholds {
            max_framework_confidence,
            max_false_positive_matches,
        };
        let result = frameworks::evaluate_framework_gates(&detection, fail_on, thresholds);
        Ok(serde_json::to_value(&result).expect("framework gate result serializes"))
    }

    pub fn check_security_gates(
        &self,
        config: &security::SecurityAuditConfig,
    ) -> Result<Value, RuntimeError> {
        let snapshot = serde_json::to_value(self.snapshot()).expect("snapshot serializes");
        let result = security::evaluate_security_gates(config, &snapshot)?;
        Ok(serde_json::to_value(&result).expect("security audit result serializes"))
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
        let (inventory_changed, invalid_ts_sources) = scan_ts_inventory_cached(
            &root,
            &mut self.stored.path_hashes,
            &mut self.stored.ts_files,
            &mut self.stored.ts_resolution_configs,
            &mut self.ts_verified_fingerprints,
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
        index_helpers::index_source(root, state, committed_head)
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
            state_root: state.to_path_buf(),
            base_snapshot: stored.snapshot.clone(),
            base_path_hashes: stored.path_hashes.clone(),
            stored,
            changed_paths: BTreeSet::new(),
            refresh_input_bytes: 0,
            source_fingerprints: BTreeMap::new(),
            ts_verified_fingerprints: BTreeMap::new(),
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
                    semantic_fingerprint: None,
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
                        semantic_fingerprint: None,
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
        struct NoopOracle;
        impl ProbeOracle for NoopOracle {
            fn execute(&self, _probe: &Probe, _snapshot: &RepoSnapshot) -> Result<Vec<ProbeFact>, ProbeError> {
                Err(ProbeError::new("NO_ORACLE", "runtime has no external probe oracle"))
            }
        }
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
