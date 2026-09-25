mod response;
mod schema;

use response::*;
pub use schema::model_visible_schema_json;
use schema::model_visible_schema;
#[cfg(test)]
use schema::{bounded_scope_schema, path_or_scope_schema};

use cgrx_capsule::{ObligationId, QbecV1, RccV1, ResidualObligation, Tokenizer, verify_hashes};
use cgrx_core::{
    CapsuleStatus, EvidenceSelector, Hash32, Mode, QueryRequest, RepoSnapshot, Scope,
    canonical_hash,
};
use cgrx_store::{MAX_CONFIDENCE, MemoryRecallQuery, MemoryRecordInput, MemorySpan, MemoryStore};
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
    fn get_outline(&mut self, path: &str, limit: u32) -> Result<Value, BackendError>;
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
                    "Use status first to verify revision and freshness. Multi-repo calls require repo: absolute Git worktree root. For broad work use orient with a narrow scope, then expand its handle, then read only material snippets. Search symbols before tracing calls. Check coverage for evidence paths; read source for gaps. Empty results do not prove absence. Handles belong to one repo and live session. Active toolset: {}; response profile: {}.",
                    self.toolset.label(), self.response_profile.label()
                )
            })),
            "tools/list" => Ok(json!({"tools": model_visible_schema()})),
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
                self.backend
                    .as_mut()
                    .ok_or_else(|| {
                        JsonRpcError::typed(
                            -32602,
                            "cgrx.risk_scan_unavailable",
                            "managed repository required",
                        )
                    })?
                    .scan_risks(mode, limit, args.runs)
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
                    .scan_risks("changes", limit, args.runs)
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
        if self.response_profile == ResponseProfile::Full {
            result["structuredContent"] = structured;
        }
        Ok(result)
    }

    fn orient(&mut self, arguments: OrientArguments) -> Result<Value, JsonRpcError> {
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
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.index_adapter_not_connected",
                "search_graph requires an indexed runtime backend",
            ));
        };
        backend
            .search_graph(
                &arguments.query,
                arguments.scope,
                arguments.limit,
                arguments.language.as_deref(),
                arguments.include_body,
            )
            .map_err(backend_error)
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
        backend
            .trace_path_with_evidence(
                &arguments.symbol,
                arguments.path.as_deref(),
                &arguments.direction,
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
            .find_usages_with_evidence(
                &arguments.symbol,
                arguments.path.as_deref(),
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
            .get_code_snippet(&arguments.symbol, arguments.path.as_deref())
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
        if let Some(backend) = &mut self.backend {
            return backend
                .status(arguments.paths_or_scope)
                .map_err(backend_error);
        }
        Ok(json!({
            "snapshot": self.snapshot,
            "freshness": "PINNED",
            "coverage_gaps": [{"code":"INDEX_ADAPTER_NOT_CONNECTED","scope":arguments.paths_or_scope}]
        }))
    }

    fn memory_record(&mut self, arguments: MemoryRecordArguments) -> Result<Value, JsonRpcError> {
        let Some(store) = &self.memory else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.memory_unavailable",
                "memory_record requires a managed repository backend",
            ));
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
        let input = MemoryRecordInput {
            fact: arguments.fact,
            confidence: arguments.confidence,
            provenance: cgrx_store::MemoryProvenance {
                repo: arguments.repo,
                rev,
                path: arguments.path,
                span: arguments.span.map(|span| MemorySpan {
                    start_line: span.start_line,
                    end_line: span.end_line,
                }),
            },
            valid_until_unix_nanos: arguments.valid_until_unix_nanos,
            privacy_tag: arguments.privacy_tag,
        };
        let now = now_unix_nanos();
        let publication = store.record(&input, now).map_err(memory_error)?;
        Ok(json!({
            "snapshot": self.snapshot,
            "record": publication.record,
            "duplicate": publication.duplicate,
            "llm_used": false,
        }))
    }

    fn memory_recall(&mut self, arguments: MemoryRecallArguments) -> Result<Value, JsonRpcError> {
        let limit = arguments.limit.unwrap_or(20);
        let min_confidence = arguments.min_confidence.unwrap_or(0);
        if !(1..=50).contains(&limit) || min_confidence > MAX_CONFIDENCE {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_arguments",
                "limit must be 1..50; min_confidence must be 0..1000",
            ));
        }
        let Some(store) = &self.memory else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.memory_unavailable",
                "memory_recall requires a managed repository backend",
            ));
        };
        let (results, truncated) = store
            .recall(&MemoryRecallQuery {
                query: arguments.query,
                min_confidence,
                privacy_tag: arguments.privacy_tag,
                revision: arguments.revision,
                limit,
                now_unix_nanos: now_unix_nanos(),
            })
            .map_err(memory_error)?;
        Ok(json!({
            "snapshot": self.snapshot,
            "results": results,
            "truncated": truncated,
            "llm_used": false,
        }))
    }
}

#[derive(Deserialize)]
struct ToolCall {
    name: String,
    #[serde(default)]
    arguments: Value,
}

#[derive(Deserialize)]
struct OrientArguments {
    task: String,
    #[serde(default)]
    budget: Option<u32>,
    #[serde(default)]
    budget_preset: Option<BudgetPreset>,
    mode: Mode,
    scope: Scope,
}

#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
enum BudgetPreset {
    Quick,
    Standard,
    Deep,
}

impl BudgetPreset {
    const fn tokens(self) -> u32 {
        match self {
            Self::Quick => 400,
            Self::Standard => 800,
            Self::Deep => 1_600,
        }
    }
}

impl OrientArguments {
    fn resolved_budget(&self) -> Result<u32, JsonRpcError> {
        if self.budget.is_some() && self.budget_preset.is_some() {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_arguments",
                "use budget or budget_preset, not both",
            ));
        }
        let budget = self
            .budget
            .or_else(|| self.budget_preset.map(BudgetPreset::tokens))
            .unwrap_or_else(|| adaptive_orient_budget(&self.task, self.mode, &self.scope));
        if budget == 0 {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_arguments",
                "budget must be greater than zero",
            ));
        }
        Ok(budget)
    }
}

fn adaptive_orient_budget(task: &str, mode: Mode, scope: &Scope) -> u32 {
    let mut budget = match mode {
        Mode::Fast => 400,
        Mode::Bounded => 600,
        Mode::Precise => 1_000,
    };
    let normalized = task.to_ascii_lowercase();
    let complex = [
        "architecture",
        "refactor",
        "migration",
        "impact",
        "архитект",
        "рефактор",
        "миграц",
        "влияни",
    ]
    .iter()
    .any(|marker| normalized.contains(marker));
    if complex {
        budget = budget.max(1_000);
    } else if task.len() > 120
        || scope.include.len() > 2
        || (scope.max_depth > 2
            && scope
                .include
                .iter()
                .any(|path| matches!(path.as_str(), "**" | "**/*")))
    {
        budget = budget.max(800);
    }
    budget
}

#[derive(Deserialize)]
struct ExpandArguments {
    handle: String,
    budget: u32,
}

#[derive(Deserialize)]
struct SearchGraphArguments {
    query: String,
    #[serde(default)]
    scope: Value,
    #[serde(default = "default_graph_limit")]
    limit: u32,
    #[serde(default)]
    language: Option<String>,
    #[serde(default)]
    include_body: bool,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct IngestRuntimeEvidenceArguments {
    input_path: String,
    #[serde(default = "default_runtime_format")]
    format: String,
    #[serde(default)]
    revision: Option<String>,
    #[serde(default)]
    environment: Option<String>,
}

fn default_runtime_format() -> String {
    "auto".to_owned()
}

#[derive(Deserialize)]
struct GetOutlineArguments {
    path: String,
    #[serde(default = "default_outline_limit")]
    limit: u32,
}

#[derive(Deserialize)]
struct GetArchitectureArguments {
    #[serde(default)]
    scope: Value,
    #[serde(default = "default_package_depth")]
    package_depth: u8,
    #[serde(default = "default_architecture_limit")]
    limit: u32,
    #[serde(default)]
    offset: u32,
}

const fn default_package_depth() -> u8 {
    2
}

const fn default_architecture_limit() -> u32 {
    50
}

#[derive(Deserialize)]
struct TracePathArguments {
    symbol: String,
    #[serde(default)]
    path: Option<String>,
    #[serde(default = "default_trace_direction")]
    direction: String,
    #[serde(default = "default_trace_depth")]
    depth: u8,
    #[serde(default)]
    scope: Value,
    #[serde(default = "default_graph_limit")]
    limit: u32,
    #[serde(default)]
    evidence: EvidenceSelector,
}

#[derive(Deserialize)]
struct FindUsagesArguments {
    symbol: String,
    #[serde(default)]
    path: Option<String>,
    #[serde(default)]
    scope: Value,
    #[serde(default = "default_usage_depth")]
    depth: u8,
    #[serde(default = "default_outline_limit")]
    limit: u32,
    #[serde(default)]
    evidence: EvidenceSelector,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct SuggestRefactorsArguments {
    #[serde(default)]
    scope: Value,
    #[serde(default)]
    language: Option<String>,
    #[serde(default = "default_refactor_score")]
    min_score: u16,
    #[serde(default = "default_graph_limit")]
    limit: u32,
    #[serde(default)]
    max_documents: usize,
    #[serde(default)]
    max_pairs: usize,
}

const fn default_refactor_score() -> u16 {
    760
}

#[derive(Deserialize)]
struct GetCodeSnippetArguments {
    symbol: String,
    #[serde(default)]
    path: Option<String>,
}

#[derive(Deserialize)]
struct ExplainSymbolArguments {
    symbol: String,
    #[serde(default)]
    path: Option<String>,
    scope: Value,
    #[serde(default = "default_depth")]
    depth: u8,
    #[serde(default = "default_explain_limit")]
    limit: u32,
}

fn default_depth() -> u8 {
    2
}

fn default_explain_limit() -> u32 {
    20
}

#[derive(Deserialize)]
struct DetectDeadCodeArguments {
    scope: Value,
    #[serde(default)]
    language: Option<String>,
    #[serde(default = "default_dead_code_limit")]
    limit: u32,
}

fn default_dead_code_limit() -> u32 {
    50
}

#[derive(Deserialize)]
struct CheckIndexCoverageArguments {
    #[serde(default)]
    paths: Vec<String>,
    #[serde(default)]
    scopes: Vec<String>,
    #[serde(default)]
    offset: usize,
    #[serde(default = "default_coverage_limit")]
    limit: usize,
}

#[derive(Deserialize)]
struct CheckFrameworkGatesArguments {
    #[serde(default)]
    paths: Vec<String>,
    #[serde(default)]
    scopes: Vec<String>,
    #[serde(default)]
    fail_on: String,
    #[serde(default)]
    max_framework_confidence: usize,
    #[serde(default)]
    max_false_positive_matches: usize,
}

#[derive(Deserialize)]
struct CheckSecurityGatesArguments {
    #[serde(default)]
    fail_on: String,
    #[serde(default)]
    max_secret_findings: usize,
    #[serde(default)]
    max_dependency_findings: usize,
    #[serde(default)]
    max_license_findings: usize,
    #[serde(default)]
    allowlist_paths: Vec<String>,
    #[serde(default)]
    allowlist_licenses: Vec<String>,
}

const fn default_coverage_limit() -> usize {
    100
}

const fn default_graph_limit() -> u32 {
    20
}

const fn default_outline_limit() -> u32 {
    200
}

const fn default_usage_depth() -> u8 {
    1
}

fn default_trace_direction() -> String {
    "both".to_owned()
}

const fn default_trace_depth() -> u8 {
    2
}

#[derive(Deserialize)]
struct StatusArguments {
    #[serde(default = "default_status_paths_or_scope")]
    paths_or_scope: Value,
}

fn default_status_paths_or_scope() -> Value {
    json!(["**/*"])
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct MemorySpanArguments {
    start_line: u32,
    end_line: u32,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct MemoryRecordArguments {
    fact: String,
    confidence: u16,
    repo: String,
    #[serde(default)]
    rev: Option<String>,
    path: String,
    #[serde(default)]
    span: Option<MemorySpanArguments>,
    #[serde(default)]
    valid_until_unix_nanos: Option<u64>,
    #[serde(default)]
    privacy_tag: Option<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct MemoryRecallArguments {
    #[serde(default)]
    query: Option<String>,
    #[serde(default)]
    min_confidence: Option<u16>,
    #[serde(default)]
    privacy_tag: Option<String>,
    #[serde(default)]
    revision: Option<String>,
    #[serde(default)]
    limit: Option<usize>,
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
    match error.kind() {
        std::io::ErrorKind::InvalidInput => {
            JsonRpcError::typed(-32602, "cgrx.invalid_arguments", error.to_string())
        }
        _ => internal_error(error),
    }
}

fn now_unix_nanos() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |duration| duration.as_nanos() as u64)
}

fn compact_memory_record(value: &Value) -> Value {
    json!({
        "at": snapshot_tag(value.get("snapshot")),
        "id": value.pointer("/record/id"),
        "duplicate": value.get("duplicate"),
        "llm_used": false,
    })
}

fn compact_memory_recall(value: &Value) -> Value {
    let rows: Vec<_> = value
        .get("results")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .take(50)
        .map(|item| json!([item.get("id"), item.get("confidence"), item.get("fact")]))
        .collect();
    json!({
        "at": snapshot_tag(value.get("snapshot")),
        "cols": ["id", "confidence", "fact"],
        "rows": rows,
        "truncated": value.get("truncated"),
        "llm_used": false,
    })
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
mod openai_metadata_tests {
    use super::*;

    #[test]
    fn openai_tool_contract() {
        let tools = model_visible_schema();
        assert!(
            tools.as_array().unwrap().len() >= 19,
            "expected at least 19 tools, got {}",
            tools.as_array().unwrap().len()
        );
        for tool in tools.as_array().unwrap() {
            assert!(tool["title"].as_str().is_some_and(|s| !s.is_empty()));
            assert!(tool["description"].as_str().is_some_and(|s| s.len() > 20));
            assert_eq!(tool["annotations"]["readOnlyHint"], false);
            assert_eq!(tool["annotations"]["destructiveHint"], false);
            assert_eq!(tool["annotations"]["openWorldHint"], false);
            assert_eq!(tool["outputSchema"]["type"], "object");
        }
        let scope = bounded_scope_schema();
        for name in scope["required"].as_array().unwrap() {
            assert!(scope["properties"][name.as_str().unwrap()]["type"].is_string());
        }
        let search = tools
            .as_array()
            .unwrap()
            .iter()
            .find(|tool| tool["name"] == "search_graph")
            .unwrap();
        assert_eq!(
            search["inputSchema"]["properties"]["include_body"]["type"],
            "boolean"
        );
        assert_eq!(
            search["inputSchema"]["properties"]["language"]["enum"],
            json!([
                "typescript",
                "go",
                "java",
                "python",
                "rust",
                "c",
                "cpp",
                "csharp",
                "ruby",
                "php",
                "swift",
                "scala",
                "elixir",
                "kotlin"
            ])
        );
        for name in ["trace_path", "find_usages"] {
            let tool = tools
                .as_array()
                .unwrap()
                .iter()
                .find(|tool| tool["name"] == name)
                .unwrap();
            assert_eq!(
                tool["inputSchema"]["properties"]["evidence"]["enum"],
                json!(["static", "observed", "all"])
            );
            assert_eq!(
                tool["inputSchema"]["properties"]["evidence"]["default"],
                "static"
            );
        }
        assert_eq!(
            path_or_scope_schema(&scope)["anyOf"]
                .as_array()
                .unwrap()
                .len(),
            3
        );
        let status = tools
            .as_array()
            .unwrap()
            .iter()
            .find(|tool| tool["name"] == "status")
            .unwrap();
        for (name, title) in [
            ("detect_dead_code", "Detect dead code"),
            ("check_index_coverage", "Check coverage"),
            ("check_framework_gates", "Check framework gates"),
            ("expand", "Expand context"),
            ("status", "Check index status"),
            ("memory_record", "Record decision"),
            ("memory_recall", "Recall decisions"),
            ("check_security_gates", "Check security gates"),
        ] {
            let tool = tools
                .as_array()
                .unwrap()
                .iter()
                .find(|tool| tool["name"] == name)
                .unwrap();
            assert_eq!(tool["title"], title);
        }
        assert!(status["inputSchema"].get("required").is_none());
        assert_eq!(
            status["inputSchema"]["properties"]["paths_or_scope"]["anyOf"]
                .as_array()
                .unwrap()
                .len(),
            3
        );
        let coverage = tools
            .as_array()
            .unwrap()
            .iter()
            .find(|tool| tool["name"] == "check_index_coverage")
            .unwrap();
        assert!(
            coverage["inputSchema"]["properties"]
                .get("paths_or_scope")
                .is_none()
        );
        assert_eq!(
            serde_json::from_value::<StatusArguments>(json!({}))
                .unwrap()
                .paths_or_scope,
            json!(["**/*"])
        );
        let scan = tools
            .as_array()
            .unwrap()
            .iter()
            .find(|tool| tool["name"] == "scan_risks")
            .unwrap();
        assert_eq!(scan["inputSchema"]["additionalProperties"], false);
    }

    #[test]
    fn compact_orient_preserves_semantic_rerank_audit_metadata() {
        let compact = compact_orient(&json!({
            "snapshot":{"repo_revision":"abc","working_tree_digest":"00","graph_generation":1},
            "compiled":{
                "status":"PARTIAL",
                "packed":{"records":[]},
                "obligations":{"uncertainties":[]},
                "residual":[]
            },
            "semantic_rerank":{
                "backend":"local_unix_socket",
                "status":"applied",
                "candidates_scored":8
            }
        }));
        assert_eq!(compact["semantic_rerank"]["status"], "applied");
        assert_eq!(compact["semantic_rerank"]["candidates_scored"], 8);

        let without_sidecar = compact_orient(&json!({
            "snapshot":{},
            "compiled":{
                "status":"PARTIAL",
                "packed":{"records":[]},
                "obligations":{"uncertainties":[]},
                "residual":[]
            }
        }));
        assert!(without_sidecar["semantic_rerank"].is_null());
    }

    #[test]
    fn change_gate_never_turns_partial_evidence_into_a_pass() {
        let scan = json!({
            "snapshot":{"repo_revision":"abc","working_tree_digest":"00","graph_generation":1},
            "base_revision":"abc",
            "findings":[],
            "impacts":[],
            "partial":true,
            "coverage_gap_count":0,
            "coverage_gaps":[],
            "change_plan":{"totals":{"blocked":0,"missions":0,"parallel_groups":0},"execution_order":[],"agent_handoff":{}}
        });
        let gate = evaluate_change_gates(&scan, "error", [0, 0, 0, 0]);
        assert_eq!(gate["verdict"], "INCONCLUSIVE");
        assert_eq!(gate["would_block"], true);
        assert_eq!(gate["llm_used"], false);
    }

    #[test]
    fn change_gate_separates_warning_policy_from_proven_failures() {
        let warning = json!({
            "snapshot":{},"findings":[],"impacts":[{}],"partial":false,
            "coverage_gap_count":0,"coverage_gaps":[],
            "change_plan":{"totals":{"blocked":0},"execution_order":[],"agent_handoff":{}}
        });
        let report = evaluate_change_gates(&warning, "error", [0, 0, 0, 0]);
        assert_eq!(report["verdict"], "WARN");
        assert_eq!(report["would_block"], false);
        let strict = evaluate_change_gates(&warning, "warning", [0, 0, 0, 0]);
        assert_eq!(strict["would_block"], true);

        let failure = json!({
            "snapshot":{},"findings":[{}],"impacts":[],"partial":false,
            "coverage_gap_count":0,"coverage_gaps":[],
            "change_plan":{"totals":{"blocked":0},"execution_order":[],"agent_handoff":{}}
        });
        let failed = evaluate_change_gates(&failure, "error", [0, 0, 0, 0]);
        assert_eq!(failed["verdict"], "FAIL");
        assert_eq!(failed["would_block"], true);
        assert_eq!(failed["agent_handoff"]["finding_indexes"], json!([0]));
    }

    #[test]
    fn repository_gate_separates_architecture_failures_warnings_and_uncertainty() {
        let architecture = json!({
            "snapshot":{"repo_revision":"abc","working_tree_digest":"00","graph_generation":1},
            "packages":[{"fan_out":3}],"hotspots":[{"fan_in":8}],
            "cycles":[{"packages":["a","b"]}],"totals":{"cycles":1},
            "import_resolution":{"unresolved_local":0},
            "reference_resolution":{"unresolved_local":0},
            "coverage_gap_count":0,"coverage_gaps":[],"partial":false,
            "architecture_plan":{"algorithm":"architecture_futures_v1"}
        });
        let failed = evaluate_repository_gates(&architecture, "error", [0, 20, 50, 0, 0]);
        assert_eq!(failed["verdict"], "FAIL");
        assert_eq!(failed["would_block"], true);
        assert_eq!(failed["agent_handoff"]["cycle_indexes"], json!([0]));

        let warning = evaluate_repository_gates(&architecture, "error", [1, 2, 50, 0, 0]);
        assert_eq!(warning["verdict"], "WARN");
        assert_eq!(warning["would_block"], false);
        assert_eq!(
            evaluate_repository_gates(&architecture, "warning", [1, 2, 50, 0, 0])["would_block"],
            true
        );

        let mut partial = architecture;
        partial["partial"] = true.into();
        let inconclusive = evaluate_repository_gates(&partial, "error", [1, 3, 8, 0, 0]);
        assert_eq!(inconclusive["verdict"], "INCONCLUSIVE");
        assert_eq!(inconclusive["would_block"], true);
    }

    #[test]
    fn compact_risks_keeps_exact_agent_handoff_without_duplicate_proofs() {
        let handoff = json!({
            "schema_version":"cgrx.agent.change-missions.v1",
            "llm_used":false,
            "missions":[{"mission_id":"change-mission.abc","impact_indexes":[0]}]
        });
        let structured = json!({
            "snapshot":{"repo_revision":"abc123","working_tree_digest":"00","graph_generation":9},
            "base_revision":"abc123",
            "findings":[],
            "impacts":[{
                "caller":{"path":"caller.rs","symbol":"caller"},
                "changed_target":{"path":"target.rs","symbol":"target"},
                "line":3,
                "current_edge":{"large_proof":"x".repeat(2048)}
            }],
            "verification_plan":{
                "related_tests":[{"path":"tests.rs","symbol":"test_target","line":8,
                    "impact_index":0,"reach":{"call_depth":2},"execution_status":"not_run",
                    "call_chain":[{"large_proof":"x".repeat(2048)}]}],
                "test_discovery":"candidates_found","complete_test_suite":false,
                "execution_status":"not_run","truncated":false
            },
            "change_plan":{
                "algorithm":"change_missions_v1","llm_used":false,
                "totals":{"missions":1,"parallel_groups":1,"blocked":0},
                "execution_order":[["change-mission.abc"]],"agent_handoff":handoff
            },
            "partial":false,"coverage_gap_count":0,"coverage_gaps_truncated":false
        });
        let compact = compact_risks(&structured);
        assert_eq!(compact["change_plan"]["agent_handoff"], handoff);
        assert_eq!(compact["change_plan"]["llm_used"], false);
        assert_eq!(compact["verification_plan"]["tests"][0][1], "test_target");
        assert!(
            serde_json::to_vec(&compact).unwrap().len()
                < serde_json::to_vec(&structured).unwrap().len() / 2
        );
    }

    #[test]
    fn compact_trace_adds_runtime_columns_only_for_evidence_aware_results() {
        let base = json!({
            "snapshot":{"repo_revision":"abc123","working_tree_digest":"00","graph_generation":9},
            "root":{"symbol":"target","path":"main.rs","span":{"start":0,"end":10}},
            "nodes":[{"symbol":"caller","path":"main.rs","hop":1,"direction":"callers","evidence":"observed","count":7}],
            "total":1,"truncated":false,"coverage_gap_count":0
        });
        let static_result = compact_trace(&base);
        assert_eq!(
            static_result["cols"],
            json!(["symbol", "path_id", "hop", "direction"])
        );
        let mut observed = base;
        observed["evidence"] = json!("observed");
        let observed_result = compact_trace(&observed);
        assert_eq!(
            observed_result["cols"],
            json!(["symbol", "path_id", "hop", "direction", "evidence", "count"])
        );
        assert_eq!(observed_result["rows"][0][4], "observed");
        assert_eq!(observed_result["rows"][0][5], 7);
    }

    #[test]
    fn compact_refactors_reports_exact_payload_tokens() {
        let structured = json!({
            "snapshot":{"repo_revision":"abc123","working_tree_digest":"00","graph_generation":9},
            "status":"hypothetical",
            "total":1,
            "truncated":false,
            "coverage_gap_count":0,
            "candidates":[{
                "language":"rust",
                "left":{"symbol":"left","path":"src/lib.rs"},
                "right":{"symbol":"right","path":"src/lib.rs"},
                "similarity":{"total":900},
                "shared_callees":[{"target":{"symbol":"save"}}],
                "projection":{"id":"refactor1.abc","status":"hypothetical"},
                "strategies":[{
                    "strategy_id":"strategy1.best",
                    "policy":"consolidate",
                    "recommended":true,
                    "counterfactual":{"score":812,"reasons":["structural_duplication_reduction"]}
                }]
            }]
        });

        let compact = compact_refactors(&structured);
        assert_eq!(
            compact["cols"],
            json!([
                "left",
                "right",
                "language",
                "score",
                "shared_callees",
                "projection_id",
                "recommended_policy",
                "counterfactual_score",
                "reason_codes",
                "strategy_id"
            ])
        );
        assert_eq!(compact["status"], "hypothetical");
        assert_eq!(compact["rows"][0][6], "consolidate");
        assert_eq!(compact["rows"][0][7], 812);
        assert_eq!(compact["rows"][0][9], "strategy1.best");
        let mut counted = compact.clone();
        counted.as_object_mut().unwrap().remove("payload_tokens");
        let expected = Tokenizer::o200k_base()
            .unwrap()
            .count(&serde_json::to_string(&counted).unwrap());
        assert_eq!(compact["payload_tokens"], expected);
    }

    #[test]
    fn compact_architecture_keeps_agent_payload_bounded_without_losing_evidence_pointer() {
        let symbol_communities = (0..13)
            .map(|index| {
                json!({
                    "label": format!("save_{index}"),
                    "members": 3,
                    "packages": ["api", "core"],
                    "edge_types": ["CALLS"],
                    "internal_weight": 8,
                    "cut_weight": 0,
                    "cohesion": 1.0,
                    "top_nodes": [{
                        "node_id": index + 7,
                        "symbol": format!("save_{index}"),
                        "path": format!("core/store_{index}.ts"),
                        "weighted_degree": 8
                    }]
                })
            })
            .collect::<Vec<_>>();
        let structured = json!({
            "snapshot":{"repo_revision":"abc123","working_tree_digest":"00","graph_generation":9},
            "page":{"offset":0,"limit":50,"next_offset":50,"has_more":true},
            "relation_kinds":["CALLS","IMPLEMENTS","IMPORTS","REFERENCES"],
            "packages":[{"name":"api","files":2,"symbols":4,"fan_in":1,"fan_out":2}],
            "boundaries":[{
                "source":"api","target":"core","edges":2,"relations":["CALLS"],
                "confidence":"PROVEN","evidence":[{
                    "path":"api/handler.ts","span":{"start":10,"end":20},
                    "proof":"x".repeat(20_000)
                }]
            }],
            "hotspots":[{"symbol":"save","path":"core/store.ts","fan_in":8}],
            "cycles":[{"packages":["api","core"],"kind":"PACKAGE_CALL_CYCLE"}],
            "communities":[{"packages":["api","core"],"method":"DETERMINISTIC_WEIGHTED_MODULARITY","internal_weight":8,"cut_weight":1,"cohesion":0.8888888888888888}],
            "community_detection":{"method":"DETERMINISTIC_WEIGHTED_MODULARITY","relation_weights":{"CALLS":4,"IMPLEMENTS":4,"IMPORTS":2,"REFERENCES":1},"modularity":0.25,"iterations":2},
            "symbol_communities":symbol_communities,
            "symbol_community_detection":{"method":"DETERMINISTIC_WEIGHTED_MODULARITY","relation_weights":{"CALLS":4,"IMPLEMENTS":4},"modularity":0.25,"iterations":2,"unclustered_symbols":1},
            "architecture_plan":{"algorithm":"architecture_futures_v1","llm_used":false,"totals":{"issues":1,"future_graphs":3},"issues":[{
                "issue_id":"architecture-issue1.abc","kind":"PACKAGE_DEPENDENCY_CYCLE","packages":["api","core"],
                "selected_boundary":{"source":"api","target":"core","edges":2,"relations":["CALLS"]},
                "strategies":[{"strategy_id":"architecture-strategy1.best","policy":"invert_dependency","recommended":true,"counterfactual":{"score":820,"reasons":["package_cycle_detected"]},"predicted_graph":{"cycles_removed":1}}],
                "agent_handoff":{"schema_version":"cgrx.agent.architecture-future.v1","strategy_id":"architecture-strategy1.best","llm_used":false}
            }]},
            "totals":{"packages":2,"boundaries":1,"hotspots":1,"cycles":1,"communities":1,"symbol_communities":13},
            "import_resolution":{"proven":1,"external":2,"out_of_scope":0,"unresolved_local":0},
            "reference_resolution":{"proven":2,"external":1,"out_of_scope":0,"unresolved_local":0},
            "coverage_gap_count":0,"partial":false,"truncated":false
        });

        let compact = compact_architecture(&structured);
        assert_eq!(
            compact["boundary_cols"],
            json!([
                "source",
                "target",
                "edges",
                "relations",
                "confidence",
                "path",
                "start",
                "end"
            ])
        );
        assert_eq!(compact["boundaries"][0][5], "api/handler.ts");
        assert_eq!(compact["page"]["next_offset"], 50);
        assert_eq!(compact["page"]["has_more"], true);
        assert_eq!(compact["import_resolution"]["proven"], 1);
        assert_eq!(compact["reference_resolution"]["proven"], 2);
        assert_eq!(compact["communities"][0][1], 8);
        assert_eq!(
            compact["community_detection"]["method"],
            "DETERMINISTIC_WEIGHTED_MODULARITY"
        );
        assert_eq!(compact["symbol_communities"].as_array().unwrap().len(), 12);
        assert_eq!(compact["symbol_communities"][0][0], "save_0");
        assert_eq!(compact["symbol_communities"][0][5], "core/store_0.ts");
        assert_eq!(compact["symbol_communities"][0][6][0], "save_0");
        assert_eq!(compact["totals"]["symbol_communities"], 13);
        assert_eq!(compact["architecture_planner"]["llm_used"], false);
        assert_eq!(
            compact["architecture_futures"][0]["policy"],
            "invert_dependency"
        );
        assert_eq!(compact["architecture_futures"][0]["score"], 820);
        assert_eq!(
            compact["architecture_futures"][0]["agent_handoff"]["llm_used"],
            false
        );
        assert_eq!(
            compact["symbol_community_detection"]["unclustered_symbols"],
            1
        );
        let mut counted = compact.clone();
        counted.as_object_mut().unwrap().remove("payload_tokens");
        let expected_tokens = Tokenizer::o200k_base()
            .unwrap()
            .count(&serde_json::to_string(&counted).unwrap());
        assert_eq!(compact["payload_tokens"], expected_tokens);
        let encoded = serde_json::to_string(&compact).unwrap();
        assert!(!encoded.contains(&"x".repeat(20_000)));
        assert!(
            encoded.len() < 4_000,
            "compact payload bytes: {}",
            encoded.len()
        );
    }

    fn memory_snapshot(revision: &str) -> RepoSnapshot {
        RepoSnapshot {
            repo_revision: revision.to_owned(),
            working_tree_digest: Hash32([7; 32]),
            graph_generation: 3,
        }
    }

    fn memory_server(revision: &str) -> (Server, PathBuf) {
        static SEQ: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
        let seq = SEQ.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let dir = std::env::temp_dir().join(format!(
            "cgrx-mcp-memory-{}-{}-{seq}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock after epoch")
                .as_nanos()
        ));
        let mut server = Server::new(memory_snapshot(revision));
        server.set_memory_store(MemoryStore::open(&dir).expect("open memory store"));
        (server, dir)
    }

    fn record_arguments(fact: &str, confidence: u16) -> Value {
        json!({
            "fact": fact,
            "confidence": confidence,
            "repo": "/repo",
            "path": "src/lib.rs",
            "span": {"start_line": 1, "end_line": 5},
        })
    }

    #[test]
    fn memory_record_pins_revision_and_recalls_deterministically() {
        let (mut server, dir) = memory_server("rev-memory-1");
        let recorded = server
            .memory_record(from_value(record_arguments("cache the router", 900)).unwrap())
            .unwrap();
        assert_eq!(recorded["duplicate"], false);
        assert_eq!(recorded["llm_used"], false);
        assert_eq!(recorded["snapshot"]["repo_revision"], "rev-memory-1");
        assert_eq!(recorded["record"]["fact"], "cache the router");
        assert_eq!(recorded["record"]["privacy_tag"], "default");

        let replayed = server
            .memory_record(from_value(record_arguments("cache the router", 900)).unwrap())
            .unwrap();
        assert_eq!(replayed["duplicate"], true);
        assert_eq!(replayed["record"]["id"], recorded["record"]["id"]);

        server
            .memory_record(from_value(record_arguments("drop the cache", 100)).unwrap())
            .unwrap();
        let recalled = server
            .memory_recall(from_value(json!({"limit": 10})).unwrap())
            .unwrap();
        assert_eq!(recalled["llm_used"], false);
        assert_eq!(recalled["truncated"], false);
        let facts: Vec<_> = recalled["results"]
            .as_array()
            .unwrap()
            .iter()
            .map(|item| item["fact"].as_str().unwrap().to_owned())
            .collect();
        assert_eq!(facts, vec!["cache the router", "drop the cache"]);

        let filtered = server
            .memory_recall(from_value(json!({"query": "CACHE", "min_confidence": 500})).unwrap())
            .unwrap();
        assert_eq!(filtered["results"].as_array().unwrap().len(), 1);

        let compact = model_visible_result("memory_recall", &recalled);
        assert_eq!(compact["llm_used"], false);
        assert_eq!(compact["cols"], json!(["id", "confidence", "fact"]));
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn memory_record_rejects_foreign_revision_and_bad_bounds() {
        let (mut server, dir) = memory_server("rev-memory-2");
        let mut foreign: Value = record_arguments("foreign fact", 500);
        foreign["rev"] = json!("rev-other");
        assert!(server.memory_record(from_value(foreign).unwrap()).is_err());
        assert!(
            server
                .memory_recall(from_value(json!({"limit": 0})).unwrap())
                .is_err()
        );
        assert!(
            server
                .memory_recall(from_value(json!({"min_confidence": 1001})).unwrap())
                .is_err()
        );
        assert!(
            server
                .memory_record(from_value(record_arguments("", 100)).unwrap())
                .is_err()
        );
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn memory_tools_require_an_attached_store() {
        let mut server = Server::new(memory_snapshot("rev-memory-3"));
        assert!(
            server
                .memory_record(from_value(record_arguments("fact", 10)).unwrap())
                .is_err()
        );
        assert!(
            server
                .memory_recall(from_value(json!({})).unwrap())
                .is_err()
        );
    }

    // ---- Quality-gate verdict + would_block coverage (private functions) ----

    #[test]
    fn change_gate_verdict_pass_with_clean_full_evidence() {
        // No error-severity rule breached and partial=false => PASS.
        let scan = json!({"partial": false});
        let gate = evaluate_change_gates(&scan, "error", [0, 0, 0, 0]);
        assert_eq!(gate["verdict"], "PASS");
        assert_eq!(gate["would_block"], false);
        assert_eq!(gate["totals"]["errors"], 0);
        assert_eq!(gate["totals"]["warnings"], 0);
        assert_eq!(gate["partial"], false);
    }

    #[test]
    fn change_gate_verdict_warn_only_warning_severity_breached() {
        // Only the warning-severity rule (max_unverified_impacts) breaches: WARN, no errors.
        let scan = json!({"partial": false, "impacts": [{}]});
        let gate = evaluate_change_gates(&scan, "error", [0, 0, 0, 0]);
        assert_eq!(gate["verdict"], "WARN");
        // Under the default "error" policy a warning alone does not block.
        assert_eq!(gate["would_block"], false);
        let strict = evaluate_change_gates(&scan, "warning", [0, 0, 0, 0]);
        assert_eq!(strict["verdict"], "WARN");
        assert_eq!(strict["would_block"], true);
    }

    #[test]
    fn change_gate_verdict_fail_on_error_severity_breach() {
        // findings>0 breaches the error-severity rule => FAIL regardless of partial.
        let scan = json!({"partial": false, "findings": [{}]});
        let gate = evaluate_change_gates(&scan, "error", [0, 0, 0, 0]);
        assert_eq!(gate["verdict"], "FAIL");
        assert_eq!(gate["would_block"], true);
        assert_eq!(gate["totals"]["errors"], 1);

        // coverage_gap_count is also error-severity.
        let gaps = json!({"partial": false, "coverage_gap_count": 2});
        assert_eq!(
            evaluate_change_gates(&gaps, "error", [0, 0, 0, 0])["verdict"],
            "FAIL"
        );
        // blocked missions is also error-severity.
        let blocked = json!({"partial": false, "change_plan": {"totals": {"blocked": 3}}});
        assert_eq!(
            evaluate_change_gates(&blocked, "error", [0, 0, 0, 0])["verdict"],
            "FAIL"
        );
    }

    #[test]
    fn change_gate_verdict_inconclusive_when_partial_and_no_errors() {
        // partial=true with no error-severity breach => INCONCLUSIVE (blocking under error policy).
        let scan = json!({"partial": true});
        let gate = evaluate_change_gates(&scan, "error", [0, 0, 0, 0]);
        assert_eq!(gate["verdict"], "INCONCLUSIVE");
        assert_eq!(gate["would_block"], true);
        assert_eq!(gate["partial"], true);
    }

    #[test]
    fn change_gate_would_block_follows_fail_on() {
        // fail_on="none" never blocks, even when the verdict is FAIL.
        let failing = json!({"partial": false, "findings": [{}]});
        let none = evaluate_change_gates(&failing, "none", [0, 0, 0, 0]);
        assert_eq!(none["verdict"], "FAIL");
        assert_eq!(none["would_block"], false);

        // Under the "error" policy a warning-only scan does not block...
        let warn_only = json!({"partial": false, "impacts": [{}]});
        let error_policy = evaluate_change_gates(&warn_only, "error", [0, 0, 0, 0]);
        assert_eq!(error_policy["would_block"], false);
        // ...but partial alone (no errors) still blocks under the default "error" policy.
        let partial_only = json!({"partial": true});
        let partial_gate = evaluate_change_gates(&partial_only, "error", [0, 0, 0, 0]);
        assert_eq!(partial_gate["verdict"], "INCONCLUSIVE");
        assert_eq!(partial_gate["would_block"], true);
        // Under the "warning" policy, a warning alone does block.
        let warning_policy = evaluate_change_gates(&warn_only, "warning", [0, 0, 0, 0]);
        assert_eq!(warning_policy["would_block"], true);
    }

    #[test]
    fn repository_gate_verdict_pass_with_clean_full_evidence() {
        let architecture = json!({"partial": false});
        let gate = evaluate_repository_gates(&architecture, "error", [0, 0, 0, 0, 0]);
        assert_eq!(gate["verdict"], "PASS");
        assert_eq!(gate["would_block"], false);
        assert_eq!(gate["totals"]["errors"], 0);
        assert_eq!(gate["totals"]["warnings"], 0);
    }

    #[test]
    fn repository_gate_verdict_warn_only_warning_severity_breached() {
        // Only a warning-severity rule (max_package_fan_out) breaches => WARN.
        let architecture = json!({"partial": false, "packages": [{"fan_out": 1}]});
        let gate = evaluate_repository_gates(&architecture, "error", [0, 0, 0, 0, 0]);
        assert_eq!(gate["verdict"], "WARN");
        assert_eq!(gate["would_block"], false);
        let strict = evaluate_repository_gates(&architecture, "warning", [0, 0, 0, 0, 0]);
        assert_eq!(strict["verdict"], "WARN");
        assert_eq!(strict["would_block"], true);
    }

    #[test]
    fn repository_gate_verdict_fail_on_error_severity_breach() {
        // cycles>0 breaches the error-severity rule => FAIL.
        let architecture = json!({"partial": false, "totals": {"cycles": 1}});
        let gate = evaluate_repository_gates(&architecture, "error", [0, 0, 0, 0, 0]);
        assert_eq!(gate["verdict"], "FAIL");
        assert_eq!(gate["would_block"], true);

        // coverage_gap_count is error-severity and drives FAIL, not INCONCLUSIVE.
        let gaps = json!({"partial": false, "coverage_gap_count": 5});
        assert_eq!(
            evaluate_repository_gates(&gaps, "error", [0, 0, 0, 0, 0])["verdict"],
            "FAIL"
        );
        // unresolved local dependencies is also error-severity.
        let unresolved = json!({
            "partial": false,
            "import_resolution": {"unresolved_local": 4},
            "reference_resolution": {"unresolved_local": 1}
        });
        assert_eq!(
            evaluate_repository_gates(&unresolved, "error", [0, 0, 0, 0, 0])["verdict"],
            "FAIL"
        );
    }

    #[test]
    fn repository_gate_verdict_inconclusive_when_partial_and_no_errors() {
        let architecture = json!({"partial": true});
        let gate = evaluate_repository_gates(&architecture, "error", [0, 0, 0, 0, 0]);
        assert_eq!(gate["verdict"], "INCONCLUSIVE");
        assert_eq!(gate["would_block"], true);
        assert_eq!(gate["partial"], true);
    }

    #[test]
    fn repository_gate_partial_and_coverage_gap_keep_inconclusive_under_threshold() {
        // partial=true with a coverage gap UNDER the threshold keeps INCONCLUSIVE:
        // the gap only flips to FAIL once it exceeds the max_coverage_gaps threshold.
        let architecture = json!({"partial": true, "coverage_gap_count": 1});
        let gate = evaluate_repository_gates(&architecture, "error", [0, 0, 0, 0, 10]);
        assert_eq!(gate["verdict"], "INCONCLUSIVE");
        assert_eq!(gate["would_block"], true);

        // fail_on="none" never blocks even when the verdict is FAIL.
        let failing = json!({"partial": false, "totals": {"cycles": 1}});
        let none = evaluate_repository_gates(&failing, "none", [0, 0, 0, 0, 0]);
        assert_eq!(none["verdict"], "FAIL");
        assert_eq!(none["would_block"], false);

        // A warning-only scan does not block under the default "error" policy.
        let warn_only = json!({"partial": false, "packages": [{"fan_out": 1}]});
        let error_policy = evaluate_repository_gates(&warn_only, "error", [0, 0, 0, 0, 0]);
        assert_eq!(error_policy["would_block"], false);
    }
}
