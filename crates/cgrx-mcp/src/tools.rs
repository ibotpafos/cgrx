mod arguments;
mod memory_validation;
mod response;
mod schema;

use arguments::*;
pub use memory_validation::validate_memory_arguments;
use response::*;
use schema::model_visible_schema;
pub use schema::model_visible_schema_json;
#[cfg(test)]
use schema::{bounded_scope_schema, path_or_scope_schema};

use cgrx_capsule::{ObligationId, QbecV1, RccV1, ResidualObligation, Tokenizer, verify_hashes};
use cgrx_core::{
    CapsuleStatus, EvidenceSelector, Hash32, QueryRequest, RepoSnapshot, SymbolSelector,
    canonical_hash,
};
use cgrx_store::{
    AgentMemoryInput, AgentMemoryQuery, MAX_CONFIDENCE, MemoryCapacityExceeded,
    MemoryCodeCandidate, MemoryCodeLink, MemoryCodeRange, MemoryRecallQuery, MemoryRecordInput,
    MemorySourceKind, MemorySpan, MemoryStore, MemoryWriteUncertain,
};
use serde::Deserialize;
use serde_json::{Value, json};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

use crate::{JsonRpcError, JsonRpcRequest, JsonRpcResponse, ResponseProfile, Toolset};

const PROTOCOL_VERSION: &str = "2025-06-18";

pub struct Server {
    snapshot: RepoSnapshot,
    backend: Option<Box<dyn ToolBackend>>,
    memory: Option<MemoryStore>,
    usage_log: Option<UsageLog>,
    metrics_log: Option<MetricsLog>,
    toolset: Toolset,
    response_profile: ResponseProfile,
}

struct UsageLog {
    path: PathBuf,
    client: String,
    session: String,
}

struct MetricsLog {
    path: PathBuf,
}

pub trait ToolBackend: Send + Sync {
    fn quality_tool(&mut self, _operation: &str, _arguments: Value) -> Result<Value, BackendError> {
        Err(BackendError::new(
            "cgrx.quality_unavailable",
            "quality tools require a managed repository backend",
        ))
    }

    fn ingest_runtime_evidence(
        &mut self,
        _input_path: &str,
        _format: &str,
        _revision: Option<&str>,
        _environment: Option<&str>,
    ) -> Result<Value, BackendError> {
        Err(BackendError::new(
            "cgrx.runtime_evidence_unavailable",
            "runtime evidence import requires a managed repository backend",
        ))
    }
    fn scan_risks(
        &mut self,
        _mode: &str,
        _limit: usize,
        _runs: Option<Value>,
        _base: Option<&str>,
    ) -> Result<Value, BackendError> {
        Err(BackendError::new(
            "cgrx.risk_scan_unavailable",
            "risk scan requires a managed repository backend",
        ))
    }
    fn snapshot(&self) -> &RepoSnapshot;
    fn orient(&mut self, query: QueryRequest) -> Result<Value, BackendError>;
    fn expand(&mut self, handle: &str, budget: u32) -> Result<Value, BackendError>;
    fn status(&mut self, paths_or_scope: Value) -> Result<Value, BackendError>;
    fn search_graph(
        &mut self,
        query: &str,
        scope: Value,
        limit: u32,
        language: Option<&str>,
        include_body: bool,
    ) -> Result<Value, BackendError>;
    /// Existing adapters remain compatible for the first page.
    fn search_graph_page(
        &mut self,
        query: &str,
        scope: Value,
        limit: u32,
        offset: u32,
        language: Option<&str>,
        include_body: bool,
    ) -> Result<Value, BackendError> {
        if offset != 0 {
            return Err(BackendError::new(
                "cgrx.search_pagination_unavailable",
                "this runtime backend does not support search pagination",
            ));
        }
        self.search_graph(query, scope, limit, language, include_body)
    }
    fn get_outline(&mut self, path: &str, limit: u32) -> Result<Value, BackendError>;
    fn search_ast_graph_page(
        &mut self,
        _query: &str,
        _scope: Value,
        _page: (u32, u32),
        _language: &str,
    ) -> Result<Value, BackendError> {
        Err(BackendError::new(
            "cgrx.ast_search_unavailable",
            "structural search requires a managed source repository",
        ))
    }
    fn get_architecture(
        &mut self,
        scope: Value,
        package_depth: u8,
        limit: u32,
        offset: u32,
    ) -> Result<Value, BackendError>;
    fn trace_path(
        &mut self,
        symbol: &str,
        path: Option<&str>,
        direction: &str,
        depth: u8,
        scope: Value,
        limit: u32,
    ) -> Result<Value, BackendError>;
    #[allow(clippy::too_many_arguments)]
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
        if evidence == EvidenceSelector::Static {
            self.trace_path(symbol, path, direction, depth, scope, limit)
        } else {
            Err(BackendError::new(
                "cgrx.runtime_evidence_unavailable",
                "runtime evidence requires a managed repository backend",
            ))
        }
    }
    fn find_usages(
        &mut self,
        symbol: &str,
        path: Option<&str>,
        scope: Value,
        depth: u8,
        limit: u32,
    ) -> Result<Value, BackendError>;
    #[allow(clippy::too_many_arguments)]
    fn find_usages_with_evidence(
        &mut self,
        symbol: &str,
        path: Option<&str>,
        scope: Value,
        depth: u8,
        limit: u32,
        evidence: EvidenceSelector,
    ) -> Result<Value, BackendError> {
        if evidence == EvidenceSelector::Static {
            self.find_usages(symbol, path, scope, depth, limit)
        } else {
            Err(BackendError::new(
                "cgrx.runtime_evidence_unavailable",
                "runtime evidence requires a managed repository backend",
            ))
        }
    }
    fn suggest_refactors(
        &mut self,
        _scope: Value,
        _language: Option<&str>,
        _min_score: u16,
        _limit: u32,
        _max_documents: usize,
        _max_pairs: usize,
    ) -> Result<Value, BackendError> {
        Err(BackendError::new(
            "cgrx.refactor_scan_unavailable",
            "refactor suggestions require a managed repository backend",
        ))
    }
    fn get_code_snippet(&mut self, symbol: &str, path: Option<&str>)
    -> Result<Value, BackendError>;
    /// Resolve a persistent code link within the already-refreshed snapshot.
    fn memory_symbol_ref(&self, _path: &str, _link: &MemoryCodeLink) -> Option<String> {
        None
    }
    /// Navigation hints for a stale link; these never validate or replace the assertion.
    fn memory_code_candidates(
        &self,
        _path: &str,
        _link: &MemoryCodeLink,
        _limit: usize,
    ) -> (Vec<MemoryCodeCandidate>, bool) {
        (Vec::new(), false)
    }
    fn get_code_snippet_selected(
        &mut self,
        selector: SymbolSelector<'_>,
    ) -> Result<Value, BackendError> {
        if selector.symbol_ref.is_some() {
            return Err(BackendError::new(
                "cgrx.symbol_selection_unavailable",
                "this backend does not support symbol_ref selection",
            ));
        }
        self.get_code_snippet(selector.symbol, selector.path)
    }
    fn trace_path_selected(
        &mut self,
        selector: SymbolSelector<'_>,
        direction: &str,
        depth: u8,
        scope: Value,
        limit: u32,
        evidence: EvidenceSelector,
    ) -> Result<Value, BackendError> {
        if selector.symbol_ref.is_some() {
            return Err(BackendError::new(
                "cgrx.symbol_selection_unavailable",
                "this backend does not support symbol_ref selection",
            ));
        }
        self.trace_path_with_evidence(
            selector.symbol,
            selector.path,
            direction,
            depth,
            scope,
            limit,
            evidence,
        )
    }
    fn find_usages_selected(
        &mut self,
        selector: SymbolSelector<'_>,
        scope: Value,
        depth: u8,
        limit: u32,
        evidence: EvidenceSelector,
    ) -> Result<Value, BackendError> {
        if selector.symbol_ref.is_some() {
            return Err(BackendError::new(
                "cgrx.symbol_selection_unavailable",
                "this backend does not support symbol_ref selection",
            ));
        }
        self.find_usages_with_evidence(
            selector.symbol,
            selector.path,
            scope,
            depth,
            limit,
            evidence,
        )
    }
    fn explain_symbol(
        &mut self,
        _symbol: &str,
        _path: Option<&str>,
        _scope: Value,
        _depth: u8,
        _limit: u32,
    ) -> Result<Value, BackendError> {
        Err(BackendError::new(
            "cgrx.explain_unavailable",
            "explain_symbol is not supported by this backend",
        ))
    }
    fn find_similar(
        &mut self,
        _symbol: &str,
        _path: Option<&str>,
        _scope: Value,
        _limit: u32,
    ) -> Result<Value, BackendError> {
        Err(BackendError::new(
            "cgrx.similarity_unavailable",
            "find_similar requires a managed repository backend",
        ))
    }
    fn detect_dead_code(
        &mut self,
        _scope: Value,
        _language: Option<&str>,
        _limit: u32,
    ) -> Result<Value, BackendError> {
        Err(BackendError::new(
            "cgrx.dead_code_unavailable",
            "detect_dead_code requires an indexed runtime backend",
        ))
    }
    fn check_index_coverage(
        &mut self,
        paths: &[String],
        scopes: &[String],
        offset: usize,
        limit: usize,
    ) -> Result<Value, BackendError>;

    /// Detect framework usage and evaluate the framework gate.
    fn check_framework_gates(
        &mut self,
        paths: &[String],
        scopes: &[String],
        fail_on: &str,
        max_framework_confidence: usize,
        max_false_positive_matches: usize,
    ) -> Result<Value, BackendError>;

    /// Scan working-tree secrets, dependencies and licenses and evaluate the security gate.
    fn check_security_gates(
        &mut self,
        fail_on: &str,
        max_secret_findings: usize,
        max_dependency_findings: usize,
        max_license_findings: usize,
        allowlist_paths: &[String],
        allowlist_licenses: &[String],
    ) -> Result<Value, BackendError>;
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BackendError {
    code: String,
    detail: String,
}

impl BackendError {
    #[must_use]
    pub fn new(code: impl Into<String>, detail: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            detail: detail.into(),
        }
    }
}

impl Server {
    #[must_use]
    pub const fn new(snapshot: RepoSnapshot) -> Self {
        Self {
            snapshot,
            backend: None,
            memory: None,
            usage_log: None,
            metrics_log: None,
            // Library/programmatic default is permissive; the `serve` command narrows
            // this to the resolved (default: standard) toolset.
            toolset: Toolset::Full,
            // Programmatic users keep the complete result unless they opt in.
            response_profile: ResponseProfile::Full,
        }
    }

    #[must_use]
    pub fn with_backend<B: ToolBackend + 'static>(backend: B) -> Self {
        Self {
            snapshot: backend.snapshot().clone(),
            backend: Some(Box::new(backend)),
            memory: None,
            usage_log: None,
            metrics_log: None,
            toolset: Toolset::Full,
            response_profile: ResponseProfile::Full,
        }
    }

    /// Override the active toolset that gates which tools are exposed to clients.
    #[must_use]
    pub fn with_toolset(mut self, toolset: Toolset) -> Self {
        self.toolset = toolset;
        self
    }

    /// Select whether MCP responses contain full or compact structured output.
    #[must_use]
    pub fn with_response_profile(mut self, response_profile: ResponseProfile) -> Self {
        self.response_profile = response_profile;
        self
    }

    /// Attach the durable decision-memory store rooted at the managed repository.
    pub fn set_memory_store(&mut self, store: MemoryStore) {
        self.memory = Some(store);
    }

    pub fn enable_usage_log(
        &mut self,
        path: impl AsRef<Path>,
        client: impl Into<String>,
        session: impl Into<String>,
    ) {
        self.usage_log = Some(UsageLog {
            path: path.as_ref().to_path_buf(),
            client: client.into(),
            session: session.into(),
        });
    }

    pub fn enable_metrics_log(&mut self, path: impl AsRef<Path>) {
        self.metrics_log = Some(MetricsLog {
            path: path.as_ref().to_path_buf(),
        });
    }

    #[must_use]
    pub fn snapshot(&self) -> &RepoSnapshot {
        &self.snapshot
    }

    #[must_use]
    pub fn dispatch_line(&mut self, frame: &str) -> String {
        let started = Instant::now();
        let parsed = serde_json::from_str::<JsonRpcRequest>(frame);
        let tool = parsed.as_ref().ok().and_then(|request| {
            (request.method == "tools/call")
                .then(|| request.params.get("name")?.as_str().map(str::to_owned))?
        });
        let response = match parsed {
            Ok(request) => self.dispatch(request),
            Err(error) => Some(JsonRpcResponse::error(
                Value::Null,
                JsonRpcError::typed(-32700, "cgrx.parse_error", error.to_string()),
            )),
        };
        let Some(response) = response else {
            return String::new();
        };
        let ok = response.error.is_none();
        let response_snapshot = response.result.as_ref().and_then(|result| {
            let snapshot = &result["structuredContent"]["snapshot"];
            Some((
                snapshot["repo_revision"].as_str()?.to_owned(),
                snapshot["graph_generation"].as_u64()?,
            ))
        });
        let serialized =
            serde_json::to_string(&response).expect("JSON-RPC response must serialize");
        if let Some(tool) = tool {
            let latency_us = started.elapsed().as_micros();
            self.record_usage(
                &tool,
                ok,
                latency_us,
                frame.len(),
                serialized.len(),
                response_snapshot.as_ref(),
            );
            self.record_metrics(&tool, ok, latency_us, serialized.len());
        }
        serialized
    }

    fn record_metrics(&self, tool: &str, ok: bool, latency_us: u128, response_bytes: usize) {
        let Some(metrics) = &self.metrics_log else {
            return;
        };
        if let Some(parent) = metrics.path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let Ok(mut file) = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&metrics.path)
        else {
            return;
        };
        let timestamp_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_or(0, |duration| duration.as_millis());
        let event = json!({
            "event": "tool_call",
            "timestamp_ms": timestamp_ms,
            "tool": tool,
            "ok": ok,
            "latency_us": latency_us,
            "response_bytes": response_bytes,
        });
        let _ = writeln!(file, "{event}");
    }

    fn record_usage(
        &self,
        tool: &str,
        ok: bool,
        latency_us: u128,
        request_bytes: usize,
        response_bytes: usize,
        response_snapshot: Option<&(String, u64)>,
    ) {
        let Some(usage) = &self.usage_log else {
            return;
        };
        if let Some(parent) = usage.path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let Ok(mut file) = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&usage.path)
        else {
            return;
        };
        let timestamp_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_or(0, |duration| duration.as_millis());
        let (repo_revision, graph_generation) = response_snapshot.map_or_else(
            || {
                (
                    self.snapshot.repo_revision.as_str(),
                    self.snapshot.graph_generation,
                )
            },
            |(revision, generation)| (revision.as_str(), *generation),
        );
        let event = json!({
            "event":"tool_call",
            "timestamp_ms":timestamp_ms,
            "client":usage.client,
            "session":usage.session,
            "tool":tool,
            "ok":ok,
            "latency_us":latency_us,
            "request_bytes":request_bytes,
            "response_bytes":response_bytes,
            "repo_revision":repo_revision,
            "graph_generation":graph_generation
        });
        let _ = writeln!(file, "{event}");
    }

    fn dispatch(&mut self, request: JsonRpcRequest) -> Option<JsonRpcResponse> {
        let id = request.id?;
        if request.jsonrpc != "2.0" {
            return Some(JsonRpcResponse::error(
                id,
                JsonRpcError::typed(-32600, "cgrx.invalid_request", "jsonrpc must be 2.0"),
            ));
        }
        let result = match request.method.as_str() {
            "initialize" => Ok(json!({
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {"tools": {"listChanged": false}},
                "serverInfo": {"name": "cgrx", "version": env!("CARGO_PKG_VERSION")},
                "instructions": format!(
                    "Use status first when using CGRX; pass repo: absolute Git root. Recall memory when prior context helps; save useful verified outcomes. Memory is worktree-local. Facts: <=4000 characters; details in source_ref. Updates replace all fields, including task_id. Use orient narrowly; handles are repo/session-bound. Copy symbol_ref; rediscover after changes. Check coverage and source for gaps; empty results prove no absence. Toolset: {}; response profile: {}.",
                    self.toolset.label(), self.response_profile.label()
                )
            })),
            "tools/list" => {
                let mut schema = model_visible_schema();
                schema
                    .as_array_mut()
                    .unwrap()
                    .retain(|tool| self.toolset.allows(tool["name"].as_str().unwrap()));
                Ok(json!({"tools": schema}))
            }
            "tools/call" => self.call_tool(request.params),
            _ => Err(JsonRpcError::typed(
                -32601,
                "cgrx.method_not_found",
                format!("unknown method {}", request.method),
            )),
        };
        Some(match result {
            Ok(value) => JsonRpcResponse::success(id, value),
            Err(error) => JsonRpcResponse::error(id, error),
        })
    }

    fn call_tool(&mut self, params: Value) -> Result<Value, JsonRpcError> {
        let call: ToolCall = from_value(params)?;
        // Gate disabled tools: clients may only call tools in the active toolset.
        if !self.toolset.allows(call.name.as_str()) {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.tool_not_found",
                format!(
                    "tool {} is not enabled in the active toolset ({})",
                    call.name,
                    self.toolset.label()
                ),
            ));
        }
        validate_memory_arguments(&call.name, &call.arguments)?;
        if call.name.starts_with("memory_")
            && let Some(backend) = &mut self.backend
        {
            // Memory records must use today's managed snapshot, not the server's startup revision.
            backend.status(json!([])).map_err(backend_error)?;
            self.snapshot = backend.snapshot().clone();
        }
        let structured = match call.name.as_str() {
            "scan_risks" => {
                #[derive(Deserialize)]
                #[serde(deny_unknown_fields)]
                struct Args {
                    #[serde(default)]
                    mode: Option<String>,
                    #[serde(default)]
                    limit: Option<usize>,
                    #[serde(default)]
                    runs: Option<Value>,
                    #[serde(default)]
                    base: Option<String>,
                }
                let args: Args = from_value(call.arguments)?;
                let mode = args.mode.as_deref().unwrap_or("changes");
                let limit = args.limit.unwrap_or(20);
                if mode != "changes" || !(1..=50).contains(&limit) {
                    return Err(JsonRpcError::typed(
                        -32602,
                        "cgrx.invalid_arguments",
                        "mode must be changes; limit must be 1..50",
                    ));
                }
                if args.base.as_deref().is_some_and(|base| {
                    base.is_empty()
                        || base.len() > 1024
                        || base.trim() != base
                        || base.starts_with('-')
                        || base.chars().any(char::is_control)
                }) {
                    return Err(JsonRpcError::typed(
                        -32602,
                        "cgrx.invalid_arguments",
                        "base must be a Git commit revision (OID, tag, branch or HEAD~N), at most 1024 bytes without surrounding whitespace, controls or a leading dash",
                    ));
                }
                self.backend
                    .as_mut()
                    .ok_or_else(|| {
                        JsonRpcError::typed(
                            -32602,
                            "cgrx.risk_scan_unavailable",
                            "managed repository required",
                        )
                    })?
                    .scan_risks(mode, limit, args.runs, args.base.as_deref())
                    .map_err(backend_error)?
            }
            "check_change_gates" => {
                #[derive(Deserialize)]
                #[serde(deny_unknown_fields)]
                struct Args {
                    #[serde(default)]
                    limit: Option<usize>,
                    #[serde(default)]
                    fail_on: Option<String>,
                    #[serde(default)]
                    max_warning_findings: Option<usize>,
                    #[serde(default)]
                    max_blocked_missions: Option<usize>,
                    #[serde(default)]
                    max_coverage_gaps: Option<usize>,
                    #[serde(default)]
                    max_unverified_impacts: Option<usize>,
                    #[serde(default)]
                    runs: Option<Value>,
                }
                let args: Args = from_value(call.arguments)?;
                let limit = args.limit.unwrap_or(20);
                let fail_on = args.fail_on.as_deref().unwrap_or("error");
                if !(1..=50).contains(&limit)
                    || !matches!(fail_on, "error" | "warning" | "none")
                    || [
                        args.max_warning_findings,
                        args.max_blocked_missions,
                        args.max_coverage_gaps,
                        args.max_unverified_impacts,
                    ]
                    .into_iter()
                    .flatten()
                    .any(|threshold| threshold > 10_000)
                {
                    return Err(JsonRpcError::typed(
                        -32602,
                        "cgrx.invalid_arguments",
                        "limit must be 1..50; fail_on must be error, warning, or none; thresholds must be 0..10000",
                    ));
                }
                let scan = self
                    .backend
                    .as_mut()
                    .ok_or_else(|| {
                        JsonRpcError::typed(
                            -32602,
                            "cgrx.risk_scan_unavailable",
                            "managed repository required",
                        )
                    })?
                    .scan_risks("changes", limit, args.runs, None)
                    .map_err(backend_error)?;
                evaluate_change_gates(
                    &scan,
                    fail_on,
                    [
                        args.max_warning_findings.unwrap_or(0),
                        args.max_blocked_missions.unwrap_or(0),
                        args.max_coverage_gaps.unwrap_or(0),
                        args.max_unverified_impacts.unwrap_or(0),
                    ],
                )
            }
            "check_repository_gates" => {
                #[derive(Deserialize)]
                #[serde(deny_unknown_fields)]
                struct Args {
                    #[serde(default)]
                    scope: Value,
                    #[serde(default = "default_package_depth")]
                    package_depth: u8,
                    #[serde(default)]
                    fail_on: Option<String>,
                    #[serde(default)]
                    max_package_cycles: Option<usize>,
                    #[serde(default)]
                    max_package_fan_out: Option<usize>,
                    #[serde(default)]
                    max_symbol_fan_in: Option<usize>,
                    #[serde(default)]
                    max_unresolved_local_dependencies: Option<usize>,
                    #[serde(default)]
                    max_coverage_gaps: Option<usize>,
                }
                let args: Args = from_value(call.arguments)?;
                let fail_on = args.fail_on.as_deref().unwrap_or("error");
                if !(1..=4).contains(&args.package_depth)
                    || !matches!(fail_on, "error" | "warning" | "none")
                    || [
                        args.max_package_cycles,
                        args.max_package_fan_out,
                        args.max_symbol_fan_in,
                        args.max_unresolved_local_dependencies,
                        args.max_coverage_gaps,
                    ]
                    .into_iter()
                    .flatten()
                    .any(|threshold| threshold > 1_000_000)
                {
                    return Err(JsonRpcError::typed(
                        -32602,
                        "cgrx.invalid_arguments",
                        "package_depth must be 1..4; fail_on must be error, warning, or none; thresholds must be 0..1000000",
                    ));
                }
                let architecture = self
                    .backend
                    .as_mut()
                    .ok_or_else(|| {
                        JsonRpcError::typed(
                            -32602,
                            "cgrx.architecture_unavailable",
                            "managed repository required",
                        )
                    })?
                    .get_architecture(args.scope, args.package_depth, 100, 0)
                    .map_err(backend_error)?;
                evaluate_repository_gates(
                    &architecture,
                    fail_on,
                    [
                        args.max_package_cycles.unwrap_or(0),
                        args.max_package_fan_out.unwrap_or(20),
                        args.max_symbol_fan_in.unwrap_or(50),
                        args.max_unresolved_local_dependencies.unwrap_or(0),
                        args.max_coverage_gaps.unwrap_or(0),
                    ],
                )
            }
            "orient" => self.orient(from_value(call.arguments)?)?,
            "ingest_runtime_evidence" => {
                self.ingest_runtime_evidence(from_value(call.arguments)?)?
            }
            "search_graph" => self.search_graph(from_value(call.arguments)?)?,
            "get_outline" => self.get_outline(from_value(call.arguments)?)?,
            "get_architecture" => self.get_architecture(from_value(call.arguments)?)?,
            "trace_path" => self.trace_path(from_value(call.arguments)?)?,
            "find_usages" => self.find_usages(from_value(call.arguments)?)?,
            "list_quality_candidates"
            | "get_candidate_details"
            | "prepare_candidate_patch"
            | "get_quality_index_status"
            | "update_quality_candidate_status" => self
                .backend
                .as_mut()
                .ok_or_else(|| {
                    JsonRpcError::typed(
                        -32020,
                        "cgrx.quality_unavailable",
                        "managed repository required",
                    )
                })?
                .quality_tool(&call.name, call.arguments)
                .map_err(backend_error)?,
            "suggest_refactors" => self.suggest_refactors(from_value(call.arguments)?)?,
            "get_code_snippet" => self.get_code_snippet(from_value(call.arguments)?)?,
            "explain_symbol" => self.explain_symbol(from_value(call.arguments)?)?,
            "detect_dead_code" => self.detect_dead_code(from_value(call.arguments)?)?,
            "check_index_coverage" => self.check_index_coverage(from_value(call.arguments)?)?,
            "check_framework_gates" => self.check_framework_gates(from_value(call.arguments)?)?,
            "check_security_gates" => self.check_security_gates(from_value(call.arguments)?)?,
            "expand" => self.expand(from_value(call.arguments)?)?,
            "status" => self.status(from_value(call.arguments)?)?,
            "memory_record" => self.memory_record(from_value(call.arguments)?)?,
            "memory_recall" => self.memory_recall(from_value(call.arguments)?)?,
            "memory_update" => self.memory_update(from_value(call.arguments)?)?,
            "memory_forget" => self.memory_forget(from_value(call.arguments)?)?,
            _ => {
                return Err(JsonRpcError::typed(
                    -32602,
                    "cgrx.tool_not_found",
                    format!("unknown tool {}", call.name),
                ));
            }
        };
        let visible = model_visible_result(&call.name, &structured);
        let mut result = json!({
            "content": [{"type": "text", "text": serde_json::to_string(&visible).expect("tool result serializes")}],
            "isError": false
        });
        // outputSchema is advertised in every profile. Strict MCP clients require
        // structuredContent on successful calls; compact is a shape, not text-only transport.
        result["structuredContent"] = if self.response_profile == ResponseProfile::Full {
            structured
        } else {
            visible
        };
        Ok(result)
    }

    fn orient(&mut self, arguments: OrientArguments) -> Result<Value, JsonRpcError> {
        if arguments.task.trim().is_empty() {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_arguments",
                "task must be non-empty",
            ));
        }
        let budget = arguments.resolved_budget()?;
        let query = QueryRequest {
            task: arguments.task,
            scope: arguments.scope,
            mode: arguments.mode,
            token_budget: budget,
        };
        if let Some(backend) = &mut self.backend {
            return backend.orient(query).map_err(backend_error);
        }
        let query_hash = canonical_hash(&query).map_err(internal_error)?;
        let handle =
            revision_bound_handle(&self.snapshot, query_hash, 0).map_err(internal_error)?;
        let residual = vec![ResidualObligation {
            obligation_id: ObligationId("O1".to_owned()),
            kind: "EXPANSION_AVAILABLE".to_owned(),
            reason: "request more bounded evidence with expand".to_owned(),
            expansion_handle: Some(handle.clone()),
        }];
        let tokenizer = Tokenizer::o200k_base().map_err(internal_error)?;
        let rcc = RccV1 {
            capsule_version: "rcc/1".to_owned(),
            snapshot: self.snapshot.clone(),
            scope: query.scope.clone(),
            anchors: Vec::new(),
            records: Vec::new(),
            residual: residual.clone(),
            expansion_handles: vec![handle.clone()],
            tokenizer: String::new(),
            capsule_tokens: 0,
            capsule_hash: Hash32([0; 32]),
        }
        .seal(&tokenizer, query.token_budget)
        .map_err(|error| JsonRpcError::typed(-32010, "cgrx.budget_exhausted", error.to_string()))?;
        let qbec = QbecV1 {
            certificate_version: "qbec/1".to_owned(),
            query_hash,
            snapshot: self.snapshot.clone(),
            scope: query.scope,
            discharged: Vec::new(),
            residual,
            status: CapsuleStatus::Partial,
            tokenizer: String::new(),
            capsule_tokens: 0,
            capsule_hash: Hash32([0; 32]),
        }
        .bind_capsule(&rcc);
        verify_hashes(&rcc, &qbec).map_err(internal_error)?;
        Ok(json!({"rcc": rcc, "qbec": qbec, "next_handles": [handle], "budget": budget}))
    }

    fn search_graph(&mut self, arguments: SearchGraphArguments) -> Result<Value, JsonRpcError> {
        if arguments.query.trim().is_empty()
            || !(1..=50).contains(&arguments.limit)
            || arguments.offset > 1_000_000
        {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_arguments",
                "query must be non-empty; limit must be 1..50; offset must be 0..1000000",
            ));
        }
        if matches!(arguments.match_mode, SearchMatchMode::Ast)
            && (arguments.query.len() > 4096
                || arguments.include_body
                || !matches!(
                    arguments.language.as_deref(),
                    Some("rust" | "typescript" | "python" | "go")
                ))
        {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_arguments",
                "AST mode requires language rust, typescript, python, or go and a pattern of at most 4096 bytes; include_body is a lexical option",
            ));
        }
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.index_adapter_not_connected",
                "search_graph requires an indexed runtime backend",
            ));
        };
        let result = match arguments.match_mode {
            SearchMatchMode::Lexical => backend.search_graph_page(
                &arguments.query,
                arguments.scope,
                arguments.limit,
                arguments.offset,
                arguments.language.as_deref(),
                arguments.include_body,
            ),
            SearchMatchMode::Ast => backend.search_ast_graph_page(
                &arguments.query,
                arguments.scope,
                (arguments.limit, arguments.offset),
                arguments
                    .language
                    .as_deref()
                    .expect("validated AST language"),
            ),
        }
        .map_err(backend_error)?;
        if let Some(expected) = arguments.expected_snapshot
            && result.pointer("/page/snapshot_id") != Some(&json!(expected))
        {
            return Err(JsonRpcError::typed(
                -32021,
                "cgrx.search_snapshot_changed",
                "the search snapshot changed; restart at offset 0 and use its page.snapshot_id for continuation",
            ));
        }
        Ok(result)
    }

    fn ingest_runtime_evidence(
        &mut self,
        arguments: IngestRuntimeEvidenceArguments,
    ) -> Result<Value, JsonRpcError> {
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.runtime_evidence_unavailable",
                "runtime evidence import requires an indexed runtime backend",
            ));
        };
        backend
            .ingest_runtime_evidence(
                &arguments.input_path,
                &arguments.format,
                arguments.revision.as_deref(),
                arguments.environment.as_deref(),
            )
            .map_err(backend_error)
    }

    fn get_outline(&mut self, arguments: GetOutlineArguments) -> Result<Value, JsonRpcError> {
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.index_adapter_not_connected",
                "get_outline requires an indexed runtime backend",
            ));
        };
        backend
            .get_outline(&arguments.path, arguments.limit)
            .map_err(backend_error)
    }

    fn get_architecture(
        &mut self,
        arguments: GetArchitectureArguments,
    ) -> Result<Value, JsonRpcError> {
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.index_adapter_not_connected",
                "get_architecture requires an indexed runtime backend",
            ));
        };
        backend
            .get_architecture(
                arguments.scope,
                arguments.package_depth,
                arguments.limit,
                arguments.offset,
            )
            .map_err(backend_error)
    }

    fn trace_path(&mut self, arguments: TracePathArguments) -> Result<Value, JsonRpcError> {
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.index_adapter_not_connected",
                "trace_path requires an indexed runtime backend",
            ));
        };
        let direction = match arguments.direction.as_str() {
            "incoming" => "callers",
            "outgoing" => "callees",
            canonical => canonical,
        };
        backend
            .trace_path_selected(
                SymbolSelector {
                    symbol: &arguments.symbol,
                    path: arguments.path.as_deref(),
                    symbol_ref: arguments.symbol_ref.as_deref(),
                },
                direction,
                arguments.depth,
                arguments.scope,
                arguments.limit,
                arguments.evidence,
            )
            .map_err(backend_error)
    }

    fn find_usages(&mut self, arguments: FindUsagesArguments) -> Result<Value, JsonRpcError> {
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.index_adapter_not_connected",
                "find_usages requires an indexed runtime backend",
            ));
        };
        backend
            .find_usages_selected(
                SymbolSelector {
                    symbol: &arguments.symbol,
                    path: arguments.path.as_deref(),
                    symbol_ref: arguments.symbol_ref.as_deref(),
                },
                arguments.scope,
                arguments.depth,
                arguments.limit,
                arguments.evidence,
            )
            .map_err(backend_error)
    }

    fn suggest_refactors(
        &mut self,
        arguments: SuggestRefactorsArguments,
    ) -> Result<Value, JsonRpcError> {
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.index_adapter_not_connected",
                "suggest_refactors requires an indexed runtime backend",
            ));
        };
        backend
            .suggest_refactors(
                arguments.scope,
                arguments.language.as_deref(),
                arguments.min_score,
                arguments.limit,
                arguments.max_documents,
                arguments.max_pairs,
            )
            .map_err(backend_error)
    }

    fn get_code_snippet(
        &mut self,
        arguments: GetCodeSnippetArguments,
    ) -> Result<Value, JsonRpcError> {
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.index_adapter_not_connected",
                "get_code_snippet requires an indexed runtime backend",
            ));
        };
        backend
            .get_code_snippet_selected(SymbolSelector {
                symbol: &arguments.symbol,
                path: arguments.path.as_deref(),
                symbol_ref: arguments.symbol_ref.as_deref(),
            })
            .map_err(backend_error)
    }

    fn explain_symbol(&mut self, arguments: ExplainSymbolArguments) -> Result<Value, JsonRpcError> {
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.index_adapter_not_connected",
                "explain_symbol requires an indexed runtime backend",
            ));
        };
        backend
            .explain_symbol(
                &arguments.symbol,
                arguments.path.as_deref(),
                arguments.scope,
                arguments.depth,
                arguments.limit,
            )
            .map_err(backend_error)
    }

    fn detect_dead_code(
        &mut self,
        arguments: DetectDeadCodeArguments,
    ) -> Result<Value, JsonRpcError> {
        if arguments.limit == 0 || arguments.limit > 200 {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_arguments",
                "dead_code limit must be from 1 to 200",
            ));
        }
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.index_adapter_not_connected",
                "detect_dead_code requires an indexed runtime backend",
            ));
        };
        backend
            .detect_dead_code(
                arguments.scope,
                arguments.language.as_deref(),
                arguments.limit,
            )
            .map_err(backend_error)
    }

    fn check_index_coverage(
        &mut self,
        arguments: CheckIndexCoverageArguments,
    ) -> Result<Value, JsonRpcError> {
        if arguments.limit == 0 || arguments.limit > 500 {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_arguments",
                "coverage limit must be from 1 to 500",
            ));
        }
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.index_adapter_not_connected",
                "check_index_coverage requires an indexed runtime backend",
            ));
        };
        backend
            .check_index_coverage(
                &arguments.paths,
                &arguments.scopes,
                arguments.offset,
                arguments.limit,
            )
            .map_err(backend_error)
    }

    fn check_framework_gates(
        &mut self,
        arguments: CheckFrameworkGatesArguments,
    ) -> Result<Value, JsonRpcError> {
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.index_adapter_not_connected",
                "check_framework_gates requires an indexed runtime backend",
            ));
        };
        let fail_on = if arguments.fail_on.is_empty() {
            "error"
        } else {
            arguments.fail_on.as_str()
        };
        backend
            .check_framework_gates(
                &arguments.paths,
                &arguments.scopes,
                fail_on,
                arguments.max_framework_confidence,
                arguments.max_false_positive_matches,
            )
            .map_err(backend_error)
    }

    fn check_security_gates(
        &mut self,
        arguments: CheckSecurityGatesArguments,
    ) -> Result<Value, JsonRpcError> {
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.index_adapter_not_connected",
                "check_security_gates requires an indexed runtime backend",
            ));
        };
        let fail_on = if arguments.fail_on.is_empty() {
            "error"
        } else {
            arguments.fail_on.as_str()
        };
        backend
            .check_security_gates(
                fail_on,
                arguments.max_secret_findings,
                arguments.max_dependency_findings,
                arguments.max_license_findings,
                &arguments.allowlist_paths,
                &arguments.allowlist_licenses,
            )
            .map_err(backend_error)
    }

    fn expand(&mut self, arguments: ExpandArguments) -> Result<Value, JsonRpcError> {
        if arguments.budget == 0 {
            return Err(JsonRpcError::typed(
                -32004,
                "cgrx.handle_not_found",
                "handle is unknown or belongs to another snapshot",
            ));
        }
        if let Some(backend) = &mut self.backend {
            return backend
                .expand(&arguments.handle, arguments.budget)
                .map_err(backend_error);
        }
        if !handle_matches(&arguments.handle, &self.snapshot) {
            return Err(JsonRpcError::typed(
                -32004,
                "cgrx.handle_not_found",
                "handle is unknown or belongs to another snapshot",
            ));
        }
        Ok(json!({
            "handle": arguments.handle,
            "snapshot": self.snapshot,
            "status": CapsuleStatus::NoExtraContext,
            "records": [],
            "next_handles": []
        }))
    }

    fn status(&mut self, arguments: StatusArguments) -> Result<Value, JsonRpcError> {
        if arguments.paths_or_scope.is_null() {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_arguments",
                "paths_or_scope is required",
            ));
        }
        let mut value = if let Some(backend) = &mut self.backend {
            backend
                .status(arguments.paths_or_scope)
                .map_err(backend_error)?
        } else {
            json!({
                "snapshot": self.snapshot,
                "freshness": "PINNED",
                "coverage_gaps": [{"code":"INDEX_ADAPTER_NOT_CONNECTED","scope":arguments.paths_or_scope}]
            })
        };
        // This identifies the running program, even after its on-disk path is replaced.
        // Normal unstamped builds explicitly report no build identifier.
        let build_id = option_env!("CGRX_BUILD_ID")
            .filter(|id| id.len() == 32 && id.bytes().all(|byte| byte.is_ascii_hexdigit()));
        value
            .as_object_mut()
            .ok_or_else(|| internal_error("status must be an object"))?
            .insert(
                "server".to_owned(),
                json!({
                    "name":"cgrx", "version":env!("CARGO_PKG_VERSION"),
                    "pid":std::process::id(), "build_id":build_id,
                }),
            );
        Ok(value)
    }

    fn memory_input(
        &mut self,
        mut arguments: MemoryRecordArguments,
    ) -> Result<AgentMemoryInput, JsonRpcError> {
        let repo = {
            let store = self.memory_store()?;
            validate_memory_repo(store, arguments.repo.as_deref())?;
            store.root().to_string_lossy().into_owned()
        };
        let rev = arguments
            .rev
            .unwrap_or_else(|| self.snapshot.repo_revision.clone());
        if rev != self.snapshot.repo_revision {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_arguments",
                "provenance rev must equal the pinned snapshot revision",
            ));
        }
        if arguments.symbol_ref.is_some() && arguments.symbol.is_none() {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_arguments",
                "symbol_ref requires symbol",
            ));
        }
        let code_link = if let Some(symbol) = arguments.symbol.as_deref() {
            if arguments.source_kind != MemorySourceKind::Code {
                return Err(JsonRpcError::typed(
                    -32602,
                    "cgrx.invalid_arguments",
                    "symbol is only valid for code sources",
                ));
            }
            let backend = self.backend.as_mut().ok_or_else(|| {
                JsonRpcError::typed(
                    -32020,
                    "cgrx.symbol_binding_unavailable",
                    "symbol binding requires an indexed repository backend",
                )
            })?;
            let snippet = backend
                .get_code_snippet_selected(SymbolSelector {
                    symbol,
                    path: arguments.path.as_deref(),
                    symbol_ref: arguments.symbol_ref.as_deref(),
                })
                .map_err(backend_error)?;
            if snippet.get("snapshot")
                != Some(&serde_json::to_value(&self.snapshot).map_err(internal_error)?)
            {
                return Err(JsonRpcError::typed(
                    -32020,
                    "cgrx.stale_snapshot",
                    "source changed during symbol selection; rediscover it",
                ));
            }
            let field = |name: &str| {
                snippet.get(name).and_then(Value::as_str).ok_or_else(|| {
                    JsonRpcError::typed(
                        -32020,
                        "cgrx.symbol_binding_unavailable",
                        format!("selected symbol lacks {name}"),
                    )
                })
            };
            let provenance = cgrx_store::MemoryProvenance {
                repo: repo.clone(),
                rev: rev.clone(),
                path: field("path")?.to_owned(),
                span: arguments.span.as_ref().map(|span| MemorySpan {
                    start_line: span.start_line,
                    end_line: span.end_line,
                }),
            };
            let range = |name: &str| {
                serde_json::from_value::<MemoryCodeRange>(snippet[name].clone())
                    .map_err(internal_error)
            };
            let (link, span) = self
                .memory_store()?
                .bind_code(
                    &provenance,
                    MemoryCodeLink {
                        symbol: field("symbol")?.to_owned(),
                        definition_span: range("definition_span")?,
                        body_span: range("body_span")?,
                        source_hash: field("source_hash")?.to_owned(),
                    },
                    field("source")?,
                )
                .map_err(memory_error)?;
            arguments.path = Some(provenance.path);
            arguments.span = Some(MemorySpanArguments {
                start_line: span.start_line,
                end_line: span.end_line,
            });
            Some(link)
        } else {
            None
        };
        Ok(AgentMemoryInput {
            decision: MemoryRecordInput {
                fact: arguments.fact,
                confidence: arguments.confidence,
                provenance: cgrx_store::MemoryProvenance {
                    repo,
                    rev,
                    path: arguments.path.unwrap_or_default(),
                    span: arguments.span.map(|span| MemorySpan {
                        start_line: span.start_line,
                        end_line: span.end_line,
                    }),
                },
                valid_until_unix_nanos: arguments.valid_until_unix_nanos,
                privacy_tag: arguments.privacy_tag,
            },
            memory_kind: arguments.memory_kind,
            source_kind: arguments.source_kind,
            source_ref: arguments.source_ref,
            task_id: arguments.task_id,
            event_id: arguments.event_id,
            code_link,
        })
    }

    fn memory_store(&self) -> Result<&MemoryStore, JsonRpcError> {
        self.memory.as_ref().ok_or_else(|| {
            JsonRpcError::typed(
                -32020,
                "cgrx.memory_unavailable",
                "memory requires a managed repository backend",
            )
        })
    }

    fn memory_record(&mut self, arguments: MemoryRecordArguments) -> Result<Value, JsonRpcError> {
        let input = self.memory_input(arguments)?;
        let publication = self
            .memory_store()?
            .agent_record(&input, now_unix_nanos())
            .map_err(memory_error)?;
        Ok(
            json!({"snapshot": self.snapshot, "record": publication.record,
            "duplicate": publication.duplicate, "backend": "memvid", "llm_used": false}),
        )
    }

    fn memory_update(&mut self, arguments: MemoryUpdateArguments) -> Result<Value, JsonRpcError> {
        validate_memory_repo(self.memory_store()?, arguments.repo.as_deref())?;
        let input = self.memory_input(arguments.record)?;
        let publication = self
            .memory_store()?
            .agent_update(
                &arguments.id,
                arguments.expected_version,
                &input,
                &arguments.reason,
                now_unix_nanos(),
            )
            .map_err(memory_error)?;
        Ok(
            json!({"snapshot": self.snapshot, "record": publication.record,
            "duplicate": false, "backend": "memvid", "llm_used": false}),
        )
    }

    fn memory_forget(&mut self, arguments: MemoryForgetArguments) -> Result<Value, JsonRpcError> {
        let store = self.memory_store()?;
        validate_memory_repo(store, arguments.repo.as_deref())?;
        let removed = store
            .agent_forget(&arguments.id, arguments.expected_version)
            .map_err(memory_error)?;
        Ok(json!({"snapshot": self.snapshot, "id": arguments.id,
            "removed_versions": removed, "deleted": true, "backend": "memvid", "llm_used": false}))
    }

    fn memory_recall(&mut self, arguments: MemoryRecallArguments) -> Result<Value, JsonRpcError> {
        let limit = arguments.limit.unwrap_or(20);
        let min_confidence = arguments.min_confidence.unwrap_or(0);
        let budget = arguments.budget.unwrap_or(2048);
        if !(1..=50).contains(&limit)
            || min_confidence > MAX_CONFIDENCE
            || !(256..=16000).contains(&budget)
        {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_arguments",
                "limit must be 1..50; min_confidence 0..1000; budget 256..16000",
            ));
        }
        let store = self.memory_store()?;
        validate_memory_repo(store, arguments.repo.as_deref())?;
        let mut recalled = store
            .agent_recall(&AgentMemoryQuery {
                recall: MemoryRecallQuery {
                    query: arguments.query,
                    min_confidence,
                    privacy_tag: arguments.privacy_tag,
                    revision: arguments.revision,
                    limit,
                    now_unix_nanos: now_unix_nanos(),
                },
                memory_kind: arguments.memory_kind,
                task_id: arguments.task_id,
                path: arguments.path,
                symbol: arguments.symbol,
                include_stale: arguments.include_stale,
                id: arguments.id,
                include_history: arguments.include_history,
            })
            .map_err(memory_error)?;
        if arguments.include_code {
            for hit in &mut recalled.results {
                let mut excerpt = store.agent_code_excerpt(&hit.record);
                if let Some(link) = &hit.record.code_link
                    && let Some(backend) = &self.backend
                {
                    if excerpt.status == "available" {
                        excerpt.symbol_ref = backend.memory_symbol_ref(&excerpt.path, link);
                    } else if excerpt.status == "needs_review" {
                        (excerpt.candidates, excerpt.candidates_truncated) =
                            backend.memory_code_candidates(&excerpt.path, link, 5);
                    }
                }
                hit.code = Some(excerpt);
            }
        }
        let mut value = json!({"snapshot": self.snapshot, "results": recalled.results,
            "truncated": recalled.truncated, "search_mode": recalled.search_mode,
            "embedding_model": recalled.embedding_model, "backend": "memvid", "llm_used": false});
        let tokenizer = Tokenizer::o200k_base().map_err(internal_error)?;
        bound_memory_recall(&mut value, budget, &tokenizer).map_err(internal_error)?;
        Ok(value)
    }
}

fn validate_memory_repo(store: &MemoryStore, repo: Option<&str>) -> Result<(), JsonRpcError> {
    if let Some(repo) = repo {
        let root = Path::new(repo).canonicalize().map_err(|_| {
            JsonRpcError::typed(
                -32602,
                "cgrx.invalid_repository",
                "memory repo does not exist",
            )
        })?;
        if root != store.root() {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_repository",
                "memory repo must equal the managed repository root",
            ));
        }
    }
    Ok(())
}

fn from_value<T: for<'de> Deserialize<'de>>(value: Value) -> Result<T, JsonRpcError> {
    serde_json::from_value(value)
        .map_err(|error| JsonRpcError::typed(-32602, "cgrx.invalid_arguments", error.to_string()))
}

fn internal_error(error: impl std::fmt::Display) -> JsonRpcError {
    JsonRpcError::typed(-32603, "cgrx.internal", error.to_string())
}

fn backend_error(error: BackendError) -> JsonRpcError {
    let rpc_code = match error.code.as_str() {
        "cgrx.handle_not_found" => -32004,
        "cgrx.budget_exhausted" => -32010,
        _ => -32020,
    };
    JsonRpcError::typed(rpc_code, &error.code, error.detail)
}

fn memory_error(error: std::io::Error) -> JsonRpcError {
    if let Some(capacity) = error
        .get_ref()
        .and_then(|error| error.downcast_ref::<MemoryCapacityExceeded>())
    {
        let mut response = JsonRpcError::typed(
            -32020,
            "cgrx.memory_capacity_exhausted",
            capacity.to_string(),
        );
        let data = response.data.as_mut().expect("typed error data");
        data["current"] = json!(capacity.current);
        data["limit"] = json!(capacity.limit);
        data["required"] = json!(capacity.required);
        data["mutation_applied"] = json!(false);
        return response;
    }
    if let Some(uncertain) = error
        .get_ref()
        .and_then(|error| error.downcast_ref::<MemoryWriteUncertain>())
    {
        let mut response =
            JsonRpcError::typed(-32020, "cgrx.memory_write_uncertain", uncertain.to_string());
        let data = response.data.as_mut().expect("typed error data");
        data["id"] = json!(uncertain.id);
        data["operation"] = json!(uncertain.operation);
        data["expected_version"] = json!(uncertain.expected_version);
        data["backend_class"] = json!(uncertain.backend_class());
        data["io_kind"] = json!(format!("{:?}", uncertain.cause.kind()));
        return response;
    }
    match error.kind() {
        std::io::ErrorKind::InvalidInput => {
            JsonRpcError::typed(-32602, "cgrx.invalid_arguments", error.to_string())
        }
        std::io::ErrorKind::NotFound => {
            JsonRpcError::typed(-32004, "cgrx.memory_not_found", error.to_string())
        }
        std::io::ErrorKind::AlreadyExists => {
            JsonRpcError::typed(-32020, "cgrx.memory_conflict", error.to_string())
        }
        std::io::ErrorKind::WouldBlock => {
            JsonRpcError::typed(-32020, "cgrx.store_busy", "memory store is busy; retry")
        }
        _ => internal_error(error),
    }
}

fn now_unix_nanos() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |duration| duration.as_nanos() as u64)
}

pub fn revision_bound_handle(
    snapshot: &RepoSnapshot,
    query_hash: Hash32,
    cursor: u64,
) -> Result<String, cgrx_core::CoreError> {
    Ok(format!(
        "cgrx1.{}.{}.{cursor}",
        hash_prefix(canonical_hash(snapshot)?),
        hash_prefix(query_hash)
    ))
}

fn hash_prefix(hash: Hash32) -> String {
    hash.0[..8]
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn handle_matches(handle: &str, snapshot: &RepoSnapshot) -> bool {
    let Ok(snapshot_hash) = canonical_hash(snapshot) else {
        return false;
    };
    let expected_snapshot = hash_prefix(snapshot_hash);
    let mut parts = handle.split('.');
    parts.next() == Some("cgrx1")
        && parts.next() == Some(expected_snapshot.as_str())
        && parts.next().is_some_and(|query| {
            query.len() == 16 && query.bytes().all(|byte| byte.is_ascii_hexdigit())
        })
        && parts
            .next()
            .is_some_and(|cursor| cursor.parse::<u64>().is_ok())
        && parts.next().is_none()
}

#[cfg(test)]
mod openai_metadata_tests;
