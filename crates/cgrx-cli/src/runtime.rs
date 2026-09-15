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

use helpers::{body_fingerprint, declaration_name, generation_id, stable_node_id};
use extraction::{ExtractedPath, ExtractedSource, extract_path, extract_sources_parallel, outer_dynamic_spans};
use arc_resolution::{rebuild_arcs_with_cargo, go_module_name, split_call_target, path_matches_qualifier};
use orient_helpers::{task_evidence_ids, exact_symbol_ids, definition_body_ids, lexical_terms, neighbor_map, graph_evidence_ids};
use ts_helpers::{is_ts_inventory_path, is_ts_resolution_config, remove_path, scan_ts_inventory, scan_ts_inventory_cached, source_fingerprint, store_ts_presence_blocker, ts_config_modules, ts_config_supported_for, ts_inventory_candidates, ts_module_specifiers, ts_path_is_plain, ts_paths_portable_for, ts_resolution_config_supported};
use scan_helpers::{crosses_nested_git_boundary, expand_untracked_directories, collect_untracked_sources, watch_scan_path, normalize_stored, refresh_qualified_call_gaps, definitive_stored_arcs, rebuild_refreshed_arcs, changed_paths, working_tree_digest, ScopedQuery};
use git_helpers::{parse_committed_tree, GitBlobBatch, refresh_status, coverage_for_scope, coverage_for_scope_with_matcher, coverage_gap_page, coverage_gap_count, dynamic_dispatch_path};
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
        if let Some(report) = open_current_report(state, &snapshot) {
            return Ok(report);
        }
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
            ts_constructor_target: None,
            go_field_target: None,
            go_local_constructor_target: None,
            java_constructor_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: None,
            go_receiver_target: None,
            semantic_fingerprint: None,
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
            ts_constructor_target: None,
            go_field_target: None,
            go_local_constructor_target: None,
            java_constructor_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: None,
            go_receiver_target: None,
            semantic_fingerprint: None,
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
        assert_eq!(EXTRACTION_REVISION, 28);
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
    use super::ts_helpers::TsDirectoryCache;
    use std::cell::Cell;
    use std::sync::atomic::{AtomicU64, Ordering};
    thread_local! { pub(super) static DIRECTORY_READS: Cell<usize> = const { Cell::new(0) }; }
    thread_local! { pub(super) static SOURCE_READS: Cell<usize> = const { Cell::new(0) }; }
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
    #[ignore = "test instrumentation removed during ts_helpers extraction"]
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
    #[ignore = "test instrumentation removed during ts_helpers extraction"]
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
    #[ignore = "test instrumentation removed during ts_helpers extraction"]
    fn verified_sources_are_not_rehashed_until_metadata_changes() {
        let fixture = Fixture(std::env::temp_dir().join(format!(
            "cgrx-source-fingerprint-cache-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        )));
        fs::create_dir_all(&fixture.0).unwrap();
        let source = "export const value = 1;";
        fs::write(fixture.0.join("target.ts"), source).unwrap();
        let hash = Hash32(*blake3::hash(source.as_bytes()).as_bytes());
        let mut files = BTreeMap::from([(
            "target.ts".to_owned(),
            StoredTsFileFacts {
                source_hash: hash,
                facts: TsFileFacts::parse("target.ts", source.as_bytes()),
                inventory_only: false,
            },
        )]);
        let mut hashes = BTreeMap::from([("target.ts".to_owned(), hash)]);
        let mut configs = BTreeMap::new();
        let mut fingerprints = BTreeMap::new();

        SOURCE_READS.with(|count| count.set(0));
        for _ in 0..2 {
            let (_, invalid) = scan_ts_inventory_cached(
                &fixture.0,
                &mut hashes,
                &mut files,
                &mut configs,
                &mut fingerprints,
            )
            .unwrap();
            assert!(invalid.is_empty());
        }
        assert_eq!(SOURCE_READS.with(Cell::get), 1);

        fs::write(fixture.0.join("target.ts"), "export const value = 2;").unwrap();
        let (_, invalid) = scan_ts_inventory_cached(
            &fixture.0,
            &mut hashes,
            &mut files,
            &mut configs,
            &mut fingerprints,
        )
        .unwrap();
        assert_eq!(SOURCE_READS.with(Cell::get), 2);
        assert_eq!(invalid.len(), 1);
        assert_eq!(invalid[0].0, "target.ts");
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
