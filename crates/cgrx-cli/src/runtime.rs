mod arc_resolution;
mod architecture;
mod check_helpers;
mod config;
mod extraction;
mod frameworks;
mod git_helpers;
mod graph_query;
mod graph_view;
mod helpers;
mod index_helpers;
mod observations;
mod orient_helpers;
mod refactors;
mod risks;
mod scan_helpers;
pub mod security;
mod target_types;
#[cfg(test)]
mod tests;
mod ts_config;
mod ts_helpers;

use arc_resolution::go_module_name;
use check_helpers::check_index_coverage as check_index_impl;
pub use config::RuntimeConfig;
use extraction::extract_path;
use git_helpers::{
    coverage_for_scope, coverage_for_scope_with_matcher, coverage_gap_count, coverage_gap_page,
    dynamic_dispatch_path, git_bytes, refresh_status,
};
pub use graph_view::{GraphDirection, GraphViewRequest};
pub use observations::{
    ImportRuntimeEvidenceReport, RuntimeEvidenceFormat, RuntimeInsight, RuntimeInsightsReport,
};
use orient_helpers::{
    definition_body_ids, exact_symbol_ids, graph_evidence_ids, neighbor_map, task_evidence_ids,
};
pub use risks::{RiskBaseline, TestCaseResult, TestOutcome, TestRunRecord};
use scan_helpers::{
    ScopedQuery, changed_paths, crosses_nested_git_boundary, definitive_stored_arcs,
    expand_untracked_directories, normalize_stored, rebuild_refreshed_arcs, working_tree_digest,
};
use target_types::{
    GoFieldTarget, GoLocalConstructorTarget, GoReceiverTarget, JavaConstructorTarget,
    RustSelfTarget, TsLexicalTarget,
};
use ts_config::TsResolutionConfig;
use ts_helpers::{
    is_ts_inventory_path, is_ts_resolution_config, remove_path, scan_ts_inventory_cached,
    source_fingerprint, ts_config_modules, ts_config_supported_for, ts_path_is_plain,
    ts_paths_portable_for, ts_resolution_config_supported,
};

use std::collections::{BTreeMap, BTreeSet};
use std::fmt;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};

use cgrx_capsule::{EvidencePacker, EvidenceRecord, PackInput, Tokenizer};
use cgrx_cgcr::{
    CgcrEngine, CompileRequest, CompiledContext, CostTable, CoverageMetadata, ObligationCompiler,
    Probe, ProbeError, ProbeFact, ProbeOracle, QueryClass, RemainingBudget, ResolvedAnchor,
};
use cgrx_core::{ByteRange, EdgeEvidence, Hash32, QueryRequest, RelationKind, RepoSnapshot, Scope};
use cgrx_languages::ts_imports::TsFileFacts;
use cgrx_languages::{Span, pack_for_path};
use cgrx_retrieval::{
    BaseGraph, Candidate, CandidateProvenance, GraphArc, GraphDocument, RetrievalEngine,
    ScoreComponents, SnapshotView, path_in_scope,
};
use cgrx_store::{DeltaOverlay, GenerationReader, GenerationWriter};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

const EXTRACTION_REVISION: u32 = 28;

const NODES_SEGMENT: &str = "nodes.seg";
const EDGES_SEGMENT: &str = "edges.seg";
const TERMS_SEGMENT: &str = "terms.fst";
const TERMS_MARKER: &[u8] = b"CGRXTERMS1";
#[allow(dead_code)]
const GRAPH_FANOUT_LIMIT: usize = 8;
#[allow(dead_code)]
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
            !matches!(
                language,
                "typescript"
                    | "go"
                    | "java"
                    | "python"
                    | "rust"
                    | "c"
                    | "cpp"
                    | "csharp"
                    | "ruby"
                    | "php"
                    | "swift"
                    | "scala"
                    | "elixir"
                    | "kotlin"
            )
        }) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "language must be one of typescript, go, java, python, rust, c, cpp, csharp, ruby, php, swift, scala, elixir, or kotlin",
            ));
        }
        self.search_graph_with_matcher(query, scope, limit, language, include_body, path_in_scope)
    }

    pub fn check_index_coverage(
        &self,
        paths: &[String],
        scopes: &[String],
        gap_offset: usize,
        gap_limit: usize,
    ) -> Result<Value, RuntimeError> {
        check_index_impl(&self.stored, paths, scopes, gap_offset, gap_limit)
    }

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
