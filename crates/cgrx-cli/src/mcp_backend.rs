//! MCP adapter over the local runtime.

use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use cgrx_cli::{OrientPreparation, Runtime, RuntimeEvidenceFormat, TestRunRecord};
use cgrx_core::{
    CapsuleStatus, EvidenceSelector, Hash32, QueryRequest, RelationKind, RepoSnapshot, Scope,
    canonical_hash,
};
use cgrx_mcp::{BackendError, ToolBackend, revision_bound_handle};
use serde::Deserialize;
use serde_json::{Value, json};

pub(super) struct RuntimeMcpBackend {
    risk_baseline: Option<cgrx_cli::RiskBaseline>,
    runtime: Runtime,
    watch_root: Option<PathBuf>,
    managed_state: Option<PathBuf>,
    scip_index: Option<PathBuf>,
    expansions: BTreeMap<String, ExpansionState>,
    orient_preparations: BTreeMap<Hash32, Arc<OrientPreparation>>,
    orient_preparation_order: VecDeque<Hash32>,
    next_handle_cursor: u64,
}

const ORIENT_PREPARATION_CACHE_LIMIT: usize = 8;

#[derive(Clone)]
struct ExpansionState {
    request: QueryRequest,
    emitted: BTreeSet<u64>,
    prepared: Arc<OrientPreparation>,
}

fn runtime_backend_error(error: cgrx_cli::RuntimeError) -> BackendError {
    BackendError::new(error.code(), error.to_string())
}

fn usize_argument(value: u32, name: &str) -> Result<usize, BackendError> {
    usize::try_from(value)
        .map_err(|_| BackendError::new("cgrx.invalid_arguments", format!("{name} is out of range")))
}

impl RuntimeMcpBackend {
    pub(super) fn new(runtime: Runtime, watch_root: Option<PathBuf>) -> Self {
        Self {
            runtime,
            watch_root,
            managed_state: None,
            scip_index: None,
            expansions: BTreeMap::new(),
            orient_preparations: BTreeMap::new(),
            orient_preparation_order: VecDeque::new(),
            next_handle_cursor: 0,
            risk_baseline: None,
        }
    }

    pub(super) fn managed(runtime: Runtime, root: PathBuf, state: PathBuf) -> Self {
        Self::managed_with_scip(runtime, root, state, None)
    }

    pub(super) fn managed_with_scip(
        runtime: Runtime,
        root: PathBuf,
        state: PathBuf,
        scip_index: Option<PathBuf>,
    ) -> Self {
        Self {
            runtime,
            watch_root: Some(root),
            managed_state: Some(state),
            scip_index,
            expansions: BTreeMap::new(),
            orient_preparations: BTreeMap::new(),
            orient_preparation_order: VecDeque::new(),
            next_handle_cursor: 0,
            risk_baseline: None,
        }
    }

    fn refresh(&mut self) -> Result<(), BackendError> {
        let Some(root) = &self.watch_root else {
            return Ok(());
        };
        let changed = match self.runtime.refresh(root) {
            Ok(changed) => changed,
            Err(error) if error.code() == "revision_changed" && self.managed_state.is_some() => {
                let state = self.managed_state.as_ref().expect("managed state exists");
                let indexed = if let Some(path) = &self.scip_index {
                    Runtime::index_committed_head_with_scip(root, state, path)
                } else {
                    Runtime::index_committed_head(root, state)
                };
                indexed.map_err(runtime_backend_error)?;
                self.risk_baseline = None;
                self.runtime = Runtime::open(state).map_err(runtime_backend_error)?;
                self.runtime.refresh(root).map_err(runtime_backend_error)?;
                true
            }
            Err(error) => return Err(BackendError::new(error.code(), error.to_string())),
        };
        if changed {
            self.expansions.clear();
            self.orient_preparations.clear();
            self.orient_preparation_order.clear();
        }
        Ok(())
    }

    fn orient_preparation(
        &mut self,
        query: &QueryRequest,
    ) -> Result<(Arc<OrientPreparation>, bool), BackendError> {
        // The local semantic reranker is an external process whose availability can
        // change while CGRX stays alive. Keep retrying it on fresh orient calls.
        let cacheable = env::var_os("CGRX_SEMANTIC_RERANK_SOCKET").is_none();
        let mut cache_query = query.clone();
        cache_query.token_budget = 0;
        let cache_key = canonical_hash(&cache_query)
            .map_err(|error| BackendError::new("cgrx.orient_cache", error.to_string()))?;
        if cacheable && let Some(prepared) = self.orient_preparations.get(&cache_key).cloned() {
            if let Some(index) = self
                .orient_preparation_order
                .iter()
                .position(|key| *key == cache_key)
            {
                self.orient_preparation_order.remove(index);
            }
            self.orient_preparation_order.push_back(cache_key);
            return Ok((prepared, true));
        }

        let prepared = Arc::new(
            self.runtime
                .prepare_orient(query)
                .map_err(runtime_backend_error)?,
        );
        if cacheable {
            while self.orient_preparations.len() >= ORIENT_PREPARATION_CACHE_LIMIT {
                let Some(evicted) = self.orient_preparation_order.pop_front() else {
                    break;
                };
                self.orient_preparations.remove(&evicted);
            }
            self.orient_preparations
                .insert(cache_key, Arc::clone(&prepared));
            self.orient_preparation_order.push_back(cache_key);
        }
        Ok((prepared, false))
    }

    fn issue_handle(&mut self, request: &QueryRequest) -> Result<String, BackendError> {
        let query_hash = canonical_hash(request)
            .map_err(|error| BackendError::new("cgrx.handle", error.to_string()))?;
        let cursor = self.next_handle_cursor;
        self.next_handle_cursor = self
            .next_handle_cursor
            .checked_add(1)
            .ok_or_else(|| BackendError::new("cgrx.handle", "handle cursor exhausted"))?;
        revision_bound_handle(self.runtime.snapshot(), query_hash, cursor)
            .map_err(|error| BackendError::new("cgrx.handle", error.to_string()))
    }
}

fn has_budget_exclusions(report: &cgrx_cli::OrientReport) -> bool {
    report.compiled.packed.excluded.iter().any(|record| {
        matches!(
            record.reason.as_str(),
            "budget" | "required_anchor_exceeds_budget"
        )
    })
}

impl ToolBackend for RuntimeMcpBackend {
    fn ingest_runtime_evidence(
        &mut self,
        input_path: &str,
        format: &str,
        revision: Option<&str>,
        environment: Option<&str>,
    ) -> Result<Value, BackendError> {
        let (Some(root), Some(state)) = (&self.watch_root, &self.managed_state) else {
            return Err(BackendError::new(
                "cgrx.runtime_evidence_unavailable",
                "runtime evidence import requires serve --root or --multi-repo",
            ));
        };
        let candidate = Path::new(input_path);
        let candidate = if candidate.is_absolute() {
            candidate.to_path_buf()
        } else {
            root.join(candidate)
        };
        let canonical = candidate.canonicalize().map_err(|_| {
            BackendError::new(
                "cgrx.invalid_runtime_path",
                "runtime input file does not exist",
            )
        })?;
        let import_root = state.join(".cgrx/imports").canonicalize().ok();
        if !canonical.is_file()
            || (!canonical.starts_with(root)
                && !import_root
                    .as_ref()
                    .is_some_and(|allowed| canonical.starts_with(allowed)))
        {
            return Err(BackendError::new(
                "cgrx.invalid_runtime_path",
                "runtime input must be a file inside the repository or managed imports directory",
            ));
        }
        let metadata = fs::metadata(&canonical)
            .map_err(|error| BackendError::new("cgrx.runtime_input", error.to_string()))?;
        if metadata.len() > cgrx_core::MAX_TRACE_BYTES as u64 {
            return Err(BackendError::new(
                "cgrx.runtime_evidence_too_large",
                "runtime input exceeds the configured byte limit",
            ));
        }
        let input = fs::read(&canonical)
            .map_err(|error| BackendError::new("cgrx.runtime_input", error.to_string()))?;
        let format = match format {
            "auto" => RuntimeEvidenceFormat::Auto,
            "ndjson" => RuntimeEvidenceFormat::Ndjson,
            "otlp-json" => RuntimeEvidenceFormat::OtlpJson,
            _ => {
                return Err(BackendError::new(
                    "cgrx.invalid_arguments",
                    "format must be auto, ndjson, or otlp-json",
                ));
            }
        };
        let report = self
            .runtime
            .import_runtime_evidence(root, &input, format, revision, environment)
            .map_err(runtime_backend_error)?;
        serde_json::to_value(report)
            .map_err(|error| BackendError::new("cgrx.runtime_evidence", error.to_string()))
    }

    fn scan_risks(
        &mut self,
        _mode: &str,
        limit: usize,
        runs: Option<Value>,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        let (Some(state), Some(root)) = (&self.managed_state, &self.watch_root) else {
            return Err(BackendError::new(
                "cgrx.risk_scan_unavailable",
                "risk scan requires serve --root or --multi-repo",
            ));
        };
        let cache_hit = self.risk_baseline.is_some();
        if self.risk_baseline.is_none() {
            self.risk_baseline = Some(
                Runtime::open(state)
                    .map_err(|e| BackendError::new(e.code(), e.to_string()))?
                    .risk_baseline(),
            );
        }
        let baseline = self.risk_baseline.as_ref().expect("baseline loaded");
        let mut result = match runs {
            Some(value) => {
                let parsed =
                    serde_json::from_value::<Vec<TestRunRecord>>(value).map_err(|error| {
                        BackendError::new("cgrx.invalid_arguments", error.to_string())
                    })?;
                self.runtime
                    .scan_risks_with_test_runs(baseline, root, limit, &parsed)
                    .map_err(|e| BackendError::new(e.code(), e.to_string()))?
            }
            None => self
                .runtime
                .scan_risks(baseline, root, limit)
                .map_err(|e| BackendError::new(e.code(), e.to_string()))?,
        };
        result["baseline_cache_hit"] = json!(cache_hit);
        Ok(result)
    }

    fn snapshot(&self) -> &RepoSnapshot {
        self.runtime.snapshot()
    }

    fn orient(&mut self, query: QueryRequest) -> Result<Value, BackendError> {
        self.refresh()?;
        let budget = query.token_budget;
        let (prepared, preparation_cache_hit) = self.orient_preparation(&query)?;
        let report = self
            .runtime
            .orient_prepared(&prepared, query.token_budget)
            .map_err(runtime_backend_error)?;
        let emitted = report
            .compiled
            .packed
            .records
            .iter()
            .map(|record| record.node_id)
            .collect();
        let next_handles = if !has_budget_exclusions(&report) {
            Vec::new()
        } else {
            let handle = self.issue_handle(&query)?;
            self.expansions.insert(
                handle.clone(),
                ExpansionState {
                    request: query,
                    emitted,
                    prepared,
                },
            );
            vec![handle]
        };
        let mut value = serde_json::to_value(report)
            .map_err(|error| BackendError::new("cgrx.serialize", error.to_string()))?;
        value
            .as_object_mut()
            .expect("orient report serializes as an object")
            .insert("next_handles".to_owned(), json!(next_handles));
        value
            .as_object_mut()
            .expect("orient report serializes as an object")
            .insert(
                "preparation_cache_hit".to_owned(),
                json!(preparation_cache_hit),
            );
        value
            .as_object_mut()
            .expect("orient report serializes as an object")
            .insert("budget".to_owned(), json!(budget));
        Ok(value)
    }

    fn expand(&mut self, handle: &str, budget: u32) -> Result<Value, BackendError> {
        self.refresh()?;
        let mut state = self.expansions.get(handle).cloned().ok_or_else(|| {
            BackendError::new(
                "cgrx.handle_not_found",
                "handle is unknown, consumed, or belongs to another snapshot",
            )
        })?;
        state.request.token_budget =
            state
                .request
                .token_budget
                .checked_add(budget)
                .ok_or_else(|| {
                    BackendError::new("cgrx.budget_exhausted", "cumulative budget overflow")
                })?;
        let report = self
            .runtime
            .orient_prepared(&state.prepared, state.request.token_budget)
            .map_err(runtime_backend_error)?;
        let records: Vec<_> = report
            .compiled
            .packed
            .records
            .iter()
            .filter(|record| !state.emitted.contains(&record.node_id))
            .cloned()
            .collect();
        state
            .emitted
            .extend(records.iter().map(|record| record.node_id));
        let has_more = has_budget_exclusions(&report);
        let cumulative_budget = state.request.token_budget;
        self.expansions.remove(handle);
        let next_handles = if has_more {
            let next_handle = self.issue_handle(&state.request)?;
            self.expansions.insert(next_handle.clone(), state);
            vec![next_handle]
        } else {
            Vec::new()
        };
        let status = if records.is_empty() && !has_more {
            CapsuleStatus::NoExtraContext
        } else {
            report.compiled.status
        };
        let result = json!({
            "handle":handle,
            "snapshot":report.snapshot,
            "status":status,
            "records":records,
            "next_handles":next_handles,
            "cumulative_budget":cumulative_budget
        });
        Ok(result)
    }

    fn search_graph(
        &mut self,
        query: &str,
        scope: Value,
        limit: u32,
        language: Option<&str>,
        include_body: bool,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        let scope = graph_scope(&scope)?;
        let limit = usize_argument(limit, "limit")?;
        self.runtime
            .search_graph_filtered(query, &scope, limit, language, include_body)
            .map_err(runtime_backend_error)
    }

    fn get_outline(&mut self, path: &str, limit: u32) -> Result<Value, BackendError> {
        self.refresh()?;
        let limit = usize_argument(limit, "limit")?;
        self.runtime
            .get_outline(path, limit)
            .map_err(runtime_backend_error)
    }

    fn get_architecture(
        &mut self,
        scope: Value,
        package_depth: u8,
        limit: u32,
        offset: u32,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        let scope = graph_scope(&scope)?;
        let limit = usize_argument(limit, "limit")?;
        let offset = usize_argument(offset, "offset")?;
        self.runtime
            .get_architecture(&scope, usize::from(package_depth), limit, offset)
            .map_err(runtime_backend_error)
    }

    fn trace_path(
        &mut self,
        symbol: &str,
        path: Option<&str>,
        direction: &str,
        depth: u8,
        scope: Value,
        limit: u32,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        let scope = graph_scope(&scope)?;
        let limit = usize_argument(limit, "limit")?;
        self.runtime
            .trace_path(symbol, path, direction, depth, &scope, limit)
            .map_err(runtime_backend_error)
    }

    fn trace_path_with_evidence(
        &mut self,
        symbol: &str,
        path: Option<&str>,
        direction: &str,
        depth: u8,
        scope: Value,
        limit: u32,
        evidence: EvidenceSelector,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        let scope = graph_scope(&scope)?;
        let limit = usize_argument(limit, "limit")?;
        self.runtime
            .trace_path_with_evidence(symbol, path, direction, depth, &scope, limit, evidence)
            .map_err(runtime_backend_error)
    }

    fn find_usages(
        &mut self,
        symbol: &str,
        path: Option<&str>,
        scope: Value,
        depth: u8,
        limit: u32,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        let scope = graph_scope(&scope)?;
        let limit = usize_argument(limit, "limit")?;
        self.runtime
            .find_usages(symbol, path, &scope, depth, limit)
            .map_err(runtime_backend_error)
    }

    fn find_usages_with_evidence(
        &mut self,
        symbol: &str,
        path: Option<&str>,
        scope: Value,
        depth: u8,
        limit: u32,
        evidence: EvidenceSelector,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        let scope = graph_scope(&scope)?;
        let limit = usize_argument(limit, "limit")?;
        self.runtime
            .find_usages_with_evidence(symbol, path, &scope, depth, limit, evidence)
            .map_err(runtime_backend_error)
    }

    fn suggest_refactors(
        &mut self,
        scope: Value,
        language: Option<&str>,
        min_score: u16,
        limit: u32,
        max_documents: usize,
        max_pairs: usize,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        let scope = graph_scope(&scope)?;
        let limit = usize_argument(limit, "limit")?;
        self.runtime
            .suggest_refactors(&scope, language, min_score, limit, max_documents, max_pairs)
            .map_err(runtime_backend_error)
    }

    fn get_code_snippet(
        &mut self,
        symbol: &str,
        path: Option<&str>,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        self.runtime
            .get_code_snippet(symbol, path)
            .map_err(runtime_backend_error)
    }

    fn explain_symbol(
        &mut self,
        symbol: &str,
        path: Option<&str>,
        scope: Value,
        depth: u8,
        limit: u32,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        let scope = serde_json::from_value(scope)
            .map_err(|e| BackendError::new("cgrx.invalid_scope", e.to_string()))?;
        self.runtime
            .explain_symbol(symbol, path, &scope, depth, limit as usize)
            .map_err(runtime_backend_error)
    }

    fn detect_dead_code(
        &mut self,
        scope: Value,
        language: Option<&str>,
        limit: u32,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        let scope = serde_json::from_value(scope)
            .map_err(|e| BackendError::new("cgrx.invalid_scope", e.to_string()))?;
        self.runtime
            .detect_dead_code(&scope, language, limit as usize)
            .map_err(runtime_backend_error)
    }

    fn check_index_coverage(
        &mut self,
        paths: &[String],
        scopes: &[String],
        offset: usize,
        limit: usize,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        self.runtime
            .check_index_coverage(paths, scopes, offset, limit)
            .map_err(runtime_backend_error)
    }

    fn check_framework_gates(
        &mut self,
        paths: &[String],
        scopes: &[String],
        fail_on: &str,
        max_framework_confidence: usize,
        max_false_positive_matches: usize,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        self.runtime
            .check_framework_gates(
                paths,
                scopes,
                fail_on,
                max_framework_confidence,
                max_false_positive_matches,
            )
            .map_err(runtime_backend_error)
    }

    fn check_security_gates(
        &mut self,
        fail_on: &str,
        max_secret_findings: usize,
        max_dependency_findings: usize,
        max_license_findings: usize,
        allowlist_paths: &[String],
        allowlist_licenses: &[String],
    ) -> Result<Value, BackendError> {
        let root = self.watch_root.clone().ok_or_else(|| {
            BackendError::new(
                "cgrx.no_watch_root",
                "security gates require a managed repository root",
            )
        })?;
        self.refresh()?;
        let config = cgrx_cli::SecurityAuditConfig {
            snapshot_path: root.to_string_lossy().into_owned(),
            fail_on: if fail_on.is_empty() {
                "error".to_owned()
            } else {
                fail_on.to_owned()
            },
            allowlist_paths: allowlist_paths.to_vec(),
            allowlist_licenses: allowlist_licenses.to_vec(),
            max_secret_findings,
            max_dependency_findings,
            max_license_findings,
        };
        self.runtime
            .check_security_gates(&config)
            .map_err(runtime_backend_error)
    }

    fn status(&mut self, paths_or_scope: Value) -> Result<Value, BackendError> {
        const COVERAGE_OUTPUT_LIMIT: usize = 8;
        self.refresh()?;
        let scope = status_scope(&paths_or_scope)?;
        let coverage = self.runtime.coverage_for_scope(&scope);
        let mut coverage_gaps = Vec::new();
        coverage_gaps.extend(
            coverage
                .excluded_paths
                .iter()
                .map(|path| json!({"code":"EXCLUDED_PATH","path":path})),
        );
        coverage_gaps.extend(coverage.parser_error_ranges.iter().map(|range| {
            json!({
                "code":"PARSER_ERROR_RANGE",
                "path":range.path,
                "start":range.start,
                "end":range.end
            })
        }));
        coverage_gaps.extend(
            coverage
                .stale_paths
                .iter()
                .map(|path| json!({"code":"STALE_PATH","path":path})),
        );
        if coverage.traversal_truncated {
            coverage_gaps.push(json!({
                "code":"TRAVERSAL_TRUNCATED",
                "scope":scope
            }));
        }
        coverage_gaps.extend(
            coverage
                .dynamic_dispatch
                .iter()
                .map(|location| json!({"code":"DYNAMIC_DISPATCH","location":location})),
        );
        let coverage_gap_count = coverage_gaps.len();
        let coverage_gaps_truncated = coverage_gap_count > COVERAGE_OUTPUT_LIMIT;
        coverage_gaps.truncate(COVERAGE_OUTPUT_LIMIT);
        let dynamic_dispatch_paths = coverage
            .dynamic_dispatch
            .iter()
            .map(|location| {
                location
                    .rsplit_once(':')
                    .map_or(location.as_str(), |(path, _)| path)
            })
            .collect::<BTreeSet<_>>()
            .len();
        let coverage_summary = json!({
            "excluded_paths": coverage.excluded_paths.len(),
            "parser_error_ranges": coverage.parser_error_ranges.len(),
            "stale_paths": coverage.stale_paths.len(),
            "dynamic_dispatch_sites": coverage.dynamic_dispatch.len(),
            "dynamic_dispatch_paths": dynamic_dispatch_paths,
            "traversal_truncated": coverage.traversal_truncated
        });
        let bounded_coverage = json!({
            "excluded_paths":coverage.excluded_paths.iter().take(COVERAGE_OUTPUT_LIMIT).collect::<Vec<_>>(),
            "parser_error_ranges":coverage.parser_error_ranges.iter().take(COVERAGE_OUTPUT_LIMIT).collect::<Vec<_>>(),
            "stale_paths":coverage.stale_paths.iter().take(COVERAGE_OUTPUT_LIMIT).collect::<Vec<_>>(),
            "traversal_truncated":coverage.traversal_truncated,
            "dynamic_dispatch":coverage.dynamic_dispatch.iter().take(COVERAGE_OUTPUT_LIMIT).collect::<Vec<_>>()
        });
        let mut result = json!({
            "snapshot":self.runtime.snapshot(),
            "graph":{
                "nodes":self.runtime.graph_node_count(),
                "edges":self.runtime.graph_edge_count()
            },
            "similarity_index":self.runtime.similarity_index_status(),
            "freshness":if self.watch_root.is_some() { "WATCHED" } else { "PINNED" },
            "changed_paths":self.runtime.changed_paths(),
            "coverage":bounded_coverage,
            "coverage_summary":coverage_summary,
            "coverage_gap_count":coverage_gap_count,
            "coverage_gaps":coverage_gaps,
            "coverage_gaps_truncated":coverage_gaps_truncated
        });
        let runtime_evidence = self
            .runtime
            .runtime_evidence_status()
            .map_err(runtime_backend_error)?;
        if runtime_evidence.edges > 0
            || runtime_evidence.unresolved > 0
            || runtime_evidence.ambiguous > 0
        {
            result["runtime_evidence"] = serde_json::to_value(runtime_evidence)
                .map_err(|error| BackendError::new("cgrx.runtime_evidence", error.to_string()))?;
        }
        Ok(result)
    }
}

fn graph_scope(value: &Value) -> Result<Scope, BackendError> {
    if value.is_null() {
        return Ok(Scope {
            include: Vec::new(),
            exclude: Vec::new(),
            relation_kinds: vec![RelationKind::Calls],
            max_depth: 4,
        });
    }
    status_scope(value)
}

fn status_scope(paths_or_scope: &Value) -> Result<Scope, BackendError> {
    if paths_or_scope.is_object() {
        let partial: PartialScope =
            serde_json::from_value(paths_or_scope.clone()).map_err(|error| {
                BackendError::new(
                    "cgrx.invalid_arguments",
                    format!("invalid status scope: {error}"),
                )
            })?;
        return Ok(Scope {
            include: partial.include.unwrap_or_default(),
            exclude: partial.exclude.unwrap_or_default(),
            relation_kinds: partial
                .relation_kinds
                .unwrap_or_else(|| vec![RelationKind::Calls]),
            max_depth: partial.max_depth.unwrap_or(4),
        });
    }
    let include = if let Some(path) = paths_or_scope.as_str() {
        vec![path.to_owned()]
    } else if let Some(paths) = paths_or_scope.as_array() {
        paths
            .iter()
            .map(|path| {
                path.as_str().map(str::to_owned).ok_or_else(|| {
                    BackendError::new(
                        "cgrx.invalid_arguments",
                        "status paths_or_scope array must contain only strings",
                    )
                })
            })
            .collect::<Result<Vec<_>, _>>()?
    } else {
        return Err(BackendError::new(
            "cgrx.invalid_arguments",
            "status paths_or_scope must be a path, path array, or scope object",
        ));
    };
    Ok(Scope {
        include,
        exclude: Vec::new(),
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 4,
    })
}

#[derive(Deserialize)]
struct PartialScope {
    include: Option<Vec<String>>,
    exclude: Option<Vec<String>>,
    relation_kinds: Option<Vec<RelationKind>>,
    max_depth: Option<u8>,
}
