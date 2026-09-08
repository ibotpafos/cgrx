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

use crate::{JsonRpcError, JsonRpcRequest, JsonRpcResponse};

const PROTOCOL_VERSION: &str = "2025-06-18";

pub struct Server {
    snapshot: RepoSnapshot,
    backend: Option<Box<dyn ToolBackend>>,
    memory: Option<MemoryStore>,
    usage_log: Option<UsageLog>,
    metrics_log: Option<MetricsLog>,
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
    ) -> Result<Value, BackendError> {
        Err(BackendError::new(
            "cgrx.refactor_scan_unavailable",
            "refactor suggestions require a managed repository backend",
        ))
    }
    fn get_code_snippet(&mut self, symbol: &str, path: Option<&str>)
    -> Result<Value, BackendError>;
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
    fn check_index_coverage(
        &mut self,
        paths: &[String],
        scopes: &[String],
        offset: usize,
        limit: usize,
    ) -> Result<Value, BackendError>;
    fn security_audit(
        &mut self,
        fail_on: &str,
        max_secret_findings: usize,
        max_dependency_findings: usize,
        max_license_findings: usize,
        allowlist_paths: &[String],
        allowlist_licenses: &[String],
    ) -> Result<Value, BackendError> {
        let _ = fail_on;
        let _ = max_secret_findings;
        let _ = max_dependency_findings;
        let _ = max_license_findings;
        let _ = allowlist_paths;
        let _ = allowlist_licenses;
        Err(BackendError::new(
            "cgrx.security_audit_unavailable",
            "security audit requires a managed repository backend",
        ))
    }
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
        }
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
                "instructions": "Use status first to verify revision and freshness. Multi-repo calls require repo: absolute Git worktree root. Search symbols, trace calls, read snippets, then check coverage for evidence paths. Read source for partial or missing coverage; empty results do not prove no bugs. scan_risks yields candidates, not confirmed defects. Handles belong to one repo and live session. Tools update local indexes/caches, not source files."
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
                    .get_architecture(args.scope, args.package_depth, 100)
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
            "check_index_coverage" => self.check_index_coverage(from_value(call.arguments)?)?,
            "check_security_gates" => {
                #[derive(Deserialize)]
                #[serde(deny_unknown_fields)]
                struct Args {
                    #[serde(default)]
                    fail_on: Option<String>,
                    #[serde(default)]
                    max_secret_findings: Option<usize>,
                    #[serde(default)]
                    max_dependency_findings: Option<usize>,
                    #[serde(default)]
                    max_license_findings: Option<usize>,
                    #[serde(default)]
                    allowlist_paths: Option<Vec<String>>,
                    #[serde(default)]
                    allowlist_licenses: Option<Vec<String>>,
                }
                let args: Args = from_value(call.arguments)?;
                let fail_on = args.fail_on.as_deref().unwrap_or("error");
                if !matches!(fail_on, "error" | "warning" | "none")
                    || [
                        args.max_secret_findings,
                        args.max_dependency_findings,
                        args.max_license_findings,
                    ]
                    .into_iter()
                    .flatten()
                    .any(|threshold| threshold > 10_000)
                    || args
                        .allowlist_paths
                        .iter()
                        .chain(args.allowlist_licenses.iter())
                        .flatten()
                        .any(|entry| entry.trim().is_empty())
                {
                    return Err(JsonRpcError::typed(
                        -32602,
                        "cgrx.invalid_arguments",
                        "fail_on must be error, warning, or none; thresholds must be 0..10000; allowlist entries must be non-blank",
                    ));
                }
                let allowlist_paths = args.allowlist_paths.unwrap_or_else(|| {
                    ["fixtures", "tests"]
                        .into_iter()
                        .map(str::to_owned)
                        .collect()
                });
                let allowlist_licenses = args.allowlist_licenses.unwrap_or_else(|| {
                    [
                        "MIT",
                        "Apache-2.0",
                        "BSD-2-Clause",
                        "BSD-3-Clause",
                        "ISC",
                        "Unicode-3.0",
                        "Unicode-DFS-2016",
                        "MPL-2.0",
                        "Unlicense",
                        "MIT-0",
                        "CC0-1.0",
                        "LLVM-exception",
                    ]
                    .into_iter()
                    .map(str::to_owned)
                    .collect()
                });
                self.backend
                    .as_mut()
                    .ok_or_else(|| {
                        JsonRpcError::typed(
                            -32602,
                            "cgrx.security_audit_unavailable",
                            "managed repository required",
                        )
                    })?
                    .security_audit(
                        fail_on,
                        args.max_secret_findings.unwrap_or(0),
                        args.max_dependency_findings.unwrap_or(0),
                        args.max_license_findings.unwrap_or(0),
                        &allowlist_paths,
                        &allowlist_licenses,
                    )
                    .map_err(backend_error)?
            }
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
        Ok(json!({
            "content": [{"type": "text", "text": serde_json::to_string(&visible).expect("tool result serializes")}],
            "structuredContent": structured,
            "isError": false
        }))
    }

    fn orient(&mut self, arguments: OrientArguments) -> Result<Value, JsonRpcError> {
        let query = QueryRequest {
            task: arguments.task,
            scope: arguments.scope,
            mode: arguments.mode,
            token_budget: arguments.budget,
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
        Ok(json!({"rcc": rcc, "qbec": qbec, "next_handles": [handle]}))
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
            .get_architecture(arguments.scope, arguments.package_depth, arguments.limit)
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

fn model_visible_result(tool: &str, structured: &Value) -> Value {
    match tool {
        "scan_risks" => compact_risks(structured),
        "check_change_gates" => compact_change_gates(structured),
        "check_repository_gates" => compact_repository_gates(structured),
        "check_security_gates" => compact_security_gates(structured),
        "orient" => compact_orient(structured),
        "ingest_runtime_evidence" => compact_runtime_import(structured),
        "expand" => compact_expand(structured),
        "search_graph" => compact_search(structured),
        "get_outline" => compact_outline(structured),
        "get_architecture" => compact_architecture(structured),
        "trace_path" => compact_trace(structured),
        "find_usages" => compact_usages(structured),
        "suggest_refactors" => compact_refactors(structured),
        "get_code_snippet" => compact_snippet(structured),
        "check_index_coverage" => compact_coverage(structured),
        "status" => compact_status(structured),
        "memory_record" => compact_memory_record(structured),
        "memory_recall" => compact_memory_recall(structured),
        _ => structured.clone(),
    }
}

fn evaluate_change_gates(scan: &Value, fail_on: &str, thresholds: [usize; 4]) -> Value {
    let finding_count = scan
        .get("findings")
        .and_then(Value::as_array)
        .map_or(0, Vec::len);
    let impact_count = scan
        .get("impacts")
        .and_then(Value::as_array)
        .map_or(0, Vec::len);
    let blocked = scan
        .pointer("/change_plan/totals/blocked")
        .and_then(Value::as_u64)
        .unwrap_or(0) as usize;
    let gaps = scan
        .get("coverage_gap_count")
        .and_then(Value::as_u64)
        .unwrap_or(0) as usize;
    let specs = [
        (
            "max_warning_findings",
            finding_count,
            thresholds[0],
            "error",
        ),
        ("max_blocked_missions", blocked, thresholds[1], "error"),
        ("max_coverage_gaps", gaps, thresholds[2], "error"),
        (
            "max_unverified_impacts",
            impact_count,
            thresholds[3],
            "warning",
        ),
    ];
    let rules = specs
        .iter()
        .map(|(rule, value, threshold, severity)| {
            json!({
                "rule":rule,
                "value":value,
                "threshold":threshold,
                "severity":severity,
                "status":if value > threshold {"breached"} else {"passed"}
            })
        })
        .collect::<Vec<_>>();
    let errors = rules
        .iter()
        .filter(|rule| rule["status"] == "breached" && rule["severity"] == "error")
        .count();
    let warnings = rules
        .iter()
        .filter(|rule| rule["status"] == "breached" && rule["severity"] == "warning")
        .count();
    let partial = scan.get("partial").and_then(Value::as_bool).unwrap_or(true);
    let verdict = if errors > 0 {
        "FAIL"
    } else if partial {
        "INCONCLUSIVE"
    } else if warnings > 0 {
        "WARN"
    } else {
        "PASS"
    };
    let would_block = match fail_on {
        "none" => false,
        "warning" => errors > 0 || warnings > 0 || partial,
        _ => errors > 0 || partial,
    };
    let failed_rules = rules
        .iter()
        .filter(|rule| rule["status"] == "breached")
        .map(|rule| rule["rule"].clone())
        .collect::<Vec<_>>();
    json!({
        "snapshot":scan.get("snapshot"),
        "base_revision":scan.get("base_revision"),
        "algorithm":"change_quality_gate_v1",
        "llm_used":false,
        "verdict":verdict,
        "would_block":would_block,
        "fail_on":fail_on,
        "rules":rules,
        "totals":{"errors":errors,"warnings":warnings},
        "partial":partial,
        "coverage_gaps":scan.get("coverage_gaps"),
        "coverage_gap_count":gaps,
        "change_plan":{
            "totals":scan.pointer("/change_plan/totals"),
            "execution_order":scan.pointer("/change_plan/execution_order")
        },
        "agent_handoff":{
            "schema_version":"cgrx.agent.change-quality-gate.v1",
            "algorithm":"change_quality_gate_v1",
            "llm_used":false,
            "snapshot":scan.get("snapshot"),
            "verdict":verdict,
            "would_block":would_block,
            "failed_rules":failed_rules,
            "finding_indexes":(0..finding_count).collect::<Vec<_>>(),
            "impact_indexes":(0..impact_count).collect::<Vec<_>>(),
            "change_mission_handoff":scan.pointer("/change_plan/agent_handoff"),
            "requirements":[
                "Revalidate the snapshot before acting on this gate.",
                "Inspect every referenced finding, impact, mission, and coverage gap.",
                "Record actual test execution separately; candidate tests are not execution proof."
            ]
        },
        "limitations":[
            "This gate evaluates bounded change evidence, not whole-program correctness.",
            "INCONCLUSIVE is distinct from PASS and remains blocking unless fail_on is none."
        ]
    })
}

fn compact_change_gates(value: &Value) -> Value {
    json!({
        "at":snapshot_tag(value.get("snapshot")),
        "algorithm":value.get("algorithm"),
        "llm_used":value.get("llm_used"),
        "verdict":value.get("verdict"),
        "would_block":value.get("would_block"),
        "fail_on":value.get("fail_on"),
        "rules":value.get("rules"),
        "partial":value.get("partial"),
        "gaps":value.get("coverage_gap_count"),
        "agent_handoff":value.get("agent_handoff")
    })
}

fn evaluate_repository_gates(architecture: &Value, fail_on: &str, thresholds: [usize; 5]) -> Value {
    let package_cycles = architecture
        .pointer("/totals/cycles")
        .and_then(Value::as_u64)
        .unwrap_or(0) as usize;
    let max_package_fan_out = architecture
        .get("packages")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|package| package.get("fan_out").and_then(Value::as_u64))
        .max()
        .unwrap_or(0) as usize;
    let max_symbol_fan_in = architecture
        .get("hotspots")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|hotspot| hotspot.get("fan_in").and_then(Value::as_u64))
        .max()
        .unwrap_or(0) as usize;
    let unresolved_local_dependencies = [
        "/import_resolution/unresolved_local",
        "/reference_resolution/unresolved_local",
    ]
    .into_iter()
    .filter_map(|pointer| architecture.pointer(pointer).and_then(Value::as_u64))
    .sum::<u64>() as usize;
    let coverage_gaps = architecture
        .get("coverage_gap_count")
        .and_then(Value::as_u64)
        .unwrap_or(0) as usize;
    let specs = [
        ("max_package_cycles", package_cycles, thresholds[0], "error"),
        (
            "max_package_fan_out",
            max_package_fan_out,
            thresholds[1],
            "warning",
        ),
        (
            "max_symbol_fan_in",
            max_symbol_fan_in,
            thresholds[2],
            "warning",
        ),
        (
            "max_unresolved_local_dependencies",
            unresolved_local_dependencies,
            thresholds[3],
            "error",
        ),
        ("max_coverage_gaps", coverage_gaps, thresholds[4], "error"),
    ];
    let rules = specs
        .iter()
        .map(|(rule, value, threshold, severity)| {
            json!({
                "rule":rule,"value":value,"threshold":threshold,"severity":severity,
                "status":if value > threshold {"breached"} else {"passed"}
            })
        })
        .collect::<Vec<_>>();
    let errors = rules
        .iter()
        .filter(|rule| rule["status"] == "breached" && rule["severity"] == "error")
        .count();
    let warnings = rules
        .iter()
        .filter(|rule| rule["status"] == "breached" && rule["severity"] == "warning")
        .count();
    let partial = architecture
        .get("partial")
        .and_then(Value::as_bool)
        .unwrap_or(true);
    let verdict = if errors > 0 {
        "FAIL"
    } else if partial {
        "INCONCLUSIVE"
    } else if warnings > 0 {
        "WARN"
    } else {
        "PASS"
    };
    let would_block = match fail_on {
        "none" => false,
        "warning" => errors > 0 || warnings > 0 || partial,
        _ => errors > 0 || partial,
    };
    let failed_rules = rules
        .iter()
        .filter(|rule| rule["status"] == "breached")
        .map(|rule| rule["rule"].clone())
        .collect::<Vec<_>>();
    let cycle_count = architecture
        .get("cycles")
        .and_then(Value::as_array)
        .map_or(0, Vec::len);
    json!({
        "snapshot":architecture.get("snapshot"),
        "algorithm":"repository_quality_gate_v1",
        "llm_used":false,
        "verdict":verdict,"would_block":would_block,"fail_on":fail_on,
        "rules":rules,"totals":{"errors":errors,"warnings":warnings},
        "partial":partial,
        "coverage_gaps":architecture.get("coverage_gaps"),
        "coverage_gap_count":coverage_gaps,
        "architecture_totals":architecture.get("totals"),
        "agent_handoff":{
            "schema_version":"cgrx.agent.repository-quality-gate.v1",
            "algorithm":"repository_quality_gate_v1","llm_used":false,
            "snapshot":architecture.get("snapshot"),"verdict":verdict,
            "would_block":would_block,"failed_rules":failed_rules,
            "cycle_indexes":(0..cycle_count).collect::<Vec<_>>(),
            "architecture_plan":architecture.get("architecture_plan"),
            "requirements":[
                "Revalidate the snapshot and gate policy before acting.",
                "Inspect referenced cycles, hotspots, unresolved dependencies, and coverage gaps.",
                "Treat observed maxima as lower bounds whenever architecture evidence is partial."
            ]
        },
        "limitations":[
            "The gate evaluates proven repository-local architecture and does not claim whole-program correctness.",
            "Package fan-out and symbol fan-in are graph metrics, not cyclomatic complexity.",
            "INCONCLUSIVE is distinct from PASS and remains blocking unless fail_on is none."
        ]
    })
}

fn compact_repository_gates(value: &Value) -> Value {
    json!({
        "at":snapshot_tag(value.get("snapshot")),"algorithm":value.get("algorithm"),
        "llm_used":value.get("llm_used"),"verdict":value.get("verdict"),
        "would_block":value.get("would_block"),"fail_on":value.get("fail_on"),
        "rules":value.get("rules"),"partial":value.get("partial"),
        "gaps":value.get("coverage_gap_count"),"agent_handoff":value.get("agent_handoff")
    })
}

fn compact_security_gates(value: &Value) -> Value {
    let secret_findings = value
        .get("secret_findings")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.get("path"),
                item.get("line"),
                item.get("rule"),
                item.get("severity"),
                item.get("confidence")
            ])
        })
        .collect::<Vec<_>>();
    let dependency_findings = value
        .get("dependency_findings")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.get("package"),
                item.get("version"),
                item.get("rule"),
                item.get("severity")
            ])
        })
        .collect::<Vec<_>>();
    let license_findings = value
        .get("license_findings")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.get("package"),
                item.get("version"),
                item.get("license"),
                item.get("status")
            ])
        })
        .collect::<Vec<_>>();
    json!({
        "at": snapshot_tag(value.get("snapshot")),
        "algorithm": value.get("algorithm"),
        "llm_used": value.get("llm_used"),
        "verdict": value.get("verdict"),
        "would_block": value.get("would_block"),
        "fail_on": value.get("fail_on"),
        "rules": value.get("rules"),
        "partial": value.get("partial"),
        "gaps": value.get("coverage_gap_count"),
        "secret_finding_cols": ["path", "line", "rule", "severity", "confidence"],
        "secret_findings": secret_findings,
        "dependency_finding_cols": ["package", "version", "rule", "severity"],
        "dependency_findings": dependency_findings,
        "license_finding_cols": ["package", "version", "license", "status"],
        "license_findings": license_findings,
        "agent_handoff": value.get("agent_handoff")
    })
}

fn compact_risks(value: &Value) -> Value {
    let findings = value
        .get("findings")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.get("rule"),
                item.get("path"),
                item.get("line"),
                item.get("caller"),
                item.pointer("/removed_target/path"),
                item.pointer("/removed_target/symbol")
            ])
        })
        .collect::<Vec<_>>();
    let impacts = value
        .get("impacts")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.pointer("/caller/path"),
                item.pointer("/caller/symbol"),
                item.pointer("/changed_target/path"),
                item.pointer("/changed_target/symbol"),
                item.get("line")
            ])
        })
        .collect::<Vec<_>>();
    let tests = value
        .pointer("/verification_plan/related_tests")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.get("path"),
                item.get("symbol"),
                item.get("line"),
                item.get("impact_index"),
                item.pointer("/reach/call_depth"),
                item.get("execution_status")
            ])
        })
        .collect::<Vec<_>>();
    json!({
        "at":snapshot_tag(value.get("snapshot")),
        "base":value.get("base_revision"),
        "finding_cols":["rule","path","line","caller","removed_path","removed_symbol"],
        "findings":findings,
        "impact_cols":["caller_path","caller","target_path","target","line"],
        "impacts":impacts,
        "verification_plan":{
            "test_cols":["path","symbol","line","impact","depth","status"],
            "tests":tests,
            "discovery":value.pointer("/verification_plan/test_discovery"),
            "complete_suite":value.pointer("/verification_plan/complete_test_suite"),
            "execution_status":value.pointer("/verification_plan/execution_status"),
            "truncated":value.pointer("/verification_plan/truncated")
        },
        "change_plan":{
            "algorithm":value.pointer("/change_plan/algorithm"),
            "llm_used":value.pointer("/change_plan/llm_used"),
            "totals":value.pointer("/change_plan/totals"),
            "execution_order":value.pointer("/change_plan/execution_order"),
            "agent_handoff":value.pointer("/change_plan/agent_handoff")
        },
        "partial":value.get("partial"),
        "gaps":value.get("coverage_gap_count"),
        "more_gaps":value.get("coverage_gaps_truncated")
    })
}

fn compact_runtime_import(value: &Value) -> Value {
    json!({
        "accepted":value.get("accepted"),
        "ambiguous":value.get("ambiguous"),
        "unresolved":value.get("unresolved"),
        "duplicate":value.get("duplicate"),
        "edges":value.get("edges"),
        "warnings":value.get("warnings"),
        "gaps":value.get("gaps").and_then(Value::as_array).into_iter().flatten().take(12).collect::<Vec<_>>()
    })
}

fn compact_orient(value: &Value) -> Value {
    let snapshot = value
        .get("snapshot")
        .or_else(|| value.pointer("/rcc/snapshot"));
    let records = value
        .pointer("/compiled/packed/records")
        .or_else(|| value.pointer("/rcc/records"))
        .and_then(Value::as_array)
        .map_or_else(Vec::new, |records| {
            records.iter().map(compact_record_row).collect()
        });
    let uncertainties = value
        .pointer("/compiled/obligations/uncertainties")
        .and_then(Value::as_array)
        .map_or(0, Vec::len);
    let residual = value
        .pointer("/compiled/residual")
        .or_else(|| value.pointer("/qbec/residual"))
        .and_then(Value::as_array)
        .map_or(0, Vec::len);
    json!({
        "at": snapshot_tag(snapshot),
        "status": value.pointer("/compiled/status").or_else(|| value.pointer("/qbec/status")),
        "cols": ["path", "start", "end", "text", "provenance"],
        "records": records,
        "n": records.len(),
        "gaps": uncertainties,
        "residual": residual,
        "next": value.get("next_handles"),
    })
}

fn compact_expand(value: &Value) -> Value {
    let snapshot = value.get("snapshot");
    let records = value
        .get("records")
        .and_then(Value::as_array)
        .map_or_else(Vec::new, |records| {
            records.iter().map(compact_record_row).collect()
        });
    json!({
        "handle": value.get("handle"),
        "at": snapshot_tag(snapshot),
        "status": value.get("status"),
        "cols": ["path", "start", "end", "text", "provenance"],
        "records": records,
        "n": records.len(),
        "next": value.get("next_handles"),
        "budget": value.get("cumulative_budget"),
    })
}

fn compact_search(value: &Value) -> Value {
    let snapshot = value.get("snapshot");
    let rows: Vec<_> = value
        .get("matches")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .take(12)
        .map(|item| {
            json!([
                item.get("symbol"),
                item.get("path"),
                item.pointer("/span/start"),
                item.pointer("/span/end"),
                item.get("callers"),
                item.get("callees"),
            ])
        })
        .collect();
    let mut compact = json!({
        "q": value.get("query"),
        "at": snapshot_tag(snapshot),
        "cols": ["symbol", "path", "start", "end", "callers", "callees"],
        "rows": rows,
        "n": value.get("total"),
        "gaps": value.get("coverage_gap_count"),
    });
    insert_more_when_true(&mut compact, value.get("truncated"));
    compact
}

fn compact_outline(value: &Value) -> Value {
    let rows: Vec<_> = value
        .get("symbols")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.get("symbol"),
                item.pointer("/span/start"),
                item.pointer("/span/end")
            ])
        })
        .collect();
    let mut compact = json!({
        "at":snapshot_tag(value.get("snapshot")),
        "path":value.get("path"),
        "language":value.get("language"),
        "cols":["symbol","start","end"],
        "rows":rows,
        "n":value.get("total"),
        "gaps":value.get("coverage_gap_count"),
    });
    insert_more_when_true(&mut compact, value.get("truncated"));
    compact
}

fn compact_architecture(value: &Value) -> Value {
    let packages = value
        .get("packages")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.get("name"),
                item.get("files"),
                item.get("symbols"),
                item.get("fan_in"),
                item.get("fan_out")
            ])
        })
        .collect::<Vec<_>>();
    let boundaries = value
        .get("boundaries")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            let evidence = item
                .get("evidence")
                .and_then(Value::as_array)
                .and_then(|items| items.first());
            json!([
                item.get("source"),
                item.get("target"),
                item.get("edges"),
                item.get("relations"),
                item.get("confidence"),
                evidence.and_then(|row| row.get("path")),
                evidence.and_then(|row| row.pointer("/span/start")),
                evidence.and_then(|row| row.pointer("/span/end"))
            ])
        })
        .collect::<Vec<_>>();
    let hotspots = value
        .get("hotspots")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| json!([item.get("symbol"), item.get("path"), item.get("fan_in")]))
        .collect::<Vec<_>>();
    let cycles = value
        .get("cycles")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|item| item.get("packages"))
        .collect::<Vec<_>>();
    let communities = value
        .get("communities")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.get("packages"),
                item.get("internal_weight"),
                item.get("cut_weight"),
                item.get("cohesion")
            ])
        })
        .collect::<Vec<_>>();
    let symbol_communities = value
        .get("symbol_communities")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .take(12)
        .map(|item| {
            let top_nodes = item
                .get("top_nodes")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
                .collect::<Vec<_>>();
            let representative_path = top_nodes.first().and_then(|node| node.get("path"));
            let top_symbols = top_nodes
                .iter()
                .filter_map(|node| node.get("symbol"))
                .collect::<Vec<_>>();
            json!([
                item.get("label"),
                item.get("members"),
                item.get("cohesion"),
                item.get("packages"),
                item.get("edge_types"),
                representative_path,
                top_symbols
            ])
        })
        .collect::<Vec<_>>();
    let architecture_futures = value
        .pointer("/architecture_plan/issues")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .take(6)
        .filter_map(|issue| {
            let winner = issue
                .get("strategies")?
                .as_array()?
                .iter()
                .find(|strategy| strategy["recommended"] == true)?;
            Some(json!({
                "issue_id":issue.get("issue_id"),
                "kind":issue.get("kind"),
                "packages":issue.get("packages"),
                "selected_boundary":issue.get("selected_boundary"),
                "policy":winner.get("policy"),
                "score":winner.pointer("/counterfactual/score"),
                "reasons":winner.pointer("/counterfactual/reasons"),
                "strategy_id":winner.get("strategy_id"),
                "predicted_graph":winner.get("predicted_graph"),
                "agent_handoff":issue.get("agent_handoff")
            }))
        })
        .collect::<Vec<_>>();
    let mut compact = json!({
        "at":snapshot_tag(value.get("snapshot")),
        "relation_kinds":value.get("relation_kinds"),
        "package_cols":["name","files","symbols","fan_in","fan_out"],
        "packages":packages,
        "boundary_cols":["source","target","edges","relations","confidence","path","start","end"],
        "boundaries":boundaries,
        "hotspot_cols":["symbol","path","fan_in"],
        "hotspots":hotspots,
        "cycles":cycles,
        "community_cols":["packages","internal_weight","cut_weight","cohesion"],
        "communities":communities,
        "community_detection":value.get("community_detection"),
        "symbol_community_cols":["label","members","cohesion","packages","edge_types","representative_path","top_symbols"],
        "symbol_communities":symbol_communities,
        "symbol_community_detection":value.get("symbol_community_detection"),
        "architecture_futures":architecture_futures,
        "architecture_planner":{
            "algorithm":value.pointer("/architecture_plan/algorithm"),
            "llm_used":value.pointer("/architecture_plan/llm_used"),
            "totals":value.pointer("/architecture_plan/totals"),
            "shown":architecture_futures.len(),
            "more":value.pointer("/architecture_plan/totals/issues").and_then(Value::as_u64).is_some_and(|total| total > architecture_futures.len() as u64)
        },
        "totals":value.get("totals"),
        "import_resolution":value.get("import_resolution"),
        "reference_resolution":value.get("reference_resolution"),
        "gaps":value.get("coverage_gap_count"),
        "partial":value.get("partial")
    });
    insert_more_when_true(&mut compact, value.get("truncated"));
    let encoded = serde_json::to_string(&compact).expect("compact architecture serializes");
    let payload_tokens = Tokenizer::o200k_base()
        .expect("bundled o200k tokenizer")
        .count(&encoded);
    compact
        .as_object_mut()
        .expect("compact architecture is an object")
        .insert("payload_tokens".to_owned(), json!(payload_tokens));
    compact
}

fn compact_trace(value: &Value) -> Value {
    let snapshot = value.get("snapshot");
    let include_evidence = value.get("evidence").is_some();
    let mut paths = Vec::<String>::new();
    let rows: Vec<_> = value
        .get("nodes")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            let path_id = item.get("path").and_then(Value::as_str).map(|path| {
                paths
                    .iter()
                    .position(|stored| stored == path)
                    .unwrap_or_else(|| {
                        paths.push(path.to_owned());
                        paths.len() - 1
                    })
            });
            let mut row = vec![
                item.get("symbol").cloned().unwrap_or(Value::Null),
                json!(path_id),
                item.get("hop").cloned().unwrap_or(Value::Null),
                item.get("direction").cloned().unwrap_or(Value::Null),
            ];
            if include_evidence {
                row.extend([
                    item.get("evidence").cloned().unwrap_or(Value::Null),
                    item.get("count").cloned().unwrap_or(Value::Null),
                ]);
            }
            json!(row)
        })
        .collect();
    let mut compact = json!({
        "root": value.get("root").map(compact_trace_root),
        "at": snapshot_tag(snapshot),
        "paths":paths,
        "cols": ["symbol", "path_id", "hop", "direction"],
        "rows": rows,
        "n": value.get("total"),
        "gaps": value.get("coverage_gap_count"),
    });
    if include_evidence {
        compact["cols"] = json!(["symbol", "path_id", "hop", "direction", "evidence", "count"]);
        compact["evidence"] = value["evidence"].clone();
    }
    insert_more_when_true(&mut compact, value.get("truncated"));
    compact
}

fn compact_usages(value: &Value) -> Value {
    let include_evidence = value.get("evidence").is_some();
    let mut paths = Vec::<String>::new();
    let rows: Vec<_> = value
        .get("usages")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            let site_path = item.pointer("/site/path").and_then(Value::as_str);
            let path_id = site_path.map(|path| {
                paths
                    .iter()
                    .position(|stored| stored == path)
                    .unwrap_or_else(|| {
                        paths.push(path.to_owned());
                        paths.len() - 1
                    })
            });
            let mut row = vec![
                item.pointer("/source/symbol")
                    .cloned()
                    .unwrap_or(Value::Null),
                json!(path_id),
                item.get("hop").cloned().unwrap_or(Value::Null),
                item.pointer("/via/symbol").cloned().unwrap_or(Value::Null),
                item.get("relation").cloned().unwrap_or(Value::Null),
                item.pointer("/site/span/start")
                    .cloned()
                    .unwrap_or(Value::Null),
                item.pointer("/site/span/end")
                    .cloned()
                    .unwrap_or(Value::Null),
                item.get("resolver").cloned().unwrap_or(Value::Null),
            ];
            if include_evidence {
                row.extend([
                    item.get("evidence").cloned().unwrap_or(Value::Null),
                    item.get("count").cloned().unwrap_or(Value::Null),
                ]);
            }
            json!(row)
        })
        .collect();
    let mut compact = json!({
        "at":snapshot_tag(value.get("snapshot")),
        "target":value.get("target").map(compact_trace_root),
        "paths":paths,
        "cols":["source","path_id","hop","via","relation","site_start","site_end","resolver"],
        "rows":rows,
        "n":value.get("total"),
        "gaps":value.get("coverage_gap_count")
    });
    if include_evidence {
        compact["cols"] = json!([
            "source",
            "path_id",
            "hop",
            "via",
            "relation",
            "site_start",
            "site_end",
            "resolver",
            "evidence",
            "count"
        ]);
        compact["evidence"] = value["evidence"].clone();
    }
    insert_more_when_true(&mut compact, value.get("truncated"));
    compact
}

fn compact_refactors(value: &Value) -> Value {
    let mut paths = Vec::<String>::new();
    let rows = value
        .get("candidates")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|candidate| {
            let left = compact_refactor_symbol(candidate.get("left"), &mut paths);
            let right = compact_refactor_symbol(candidate.get("right"), &mut paths);
            let shared = candidate
                .get("shared_callees")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
                .filter_map(|callee| callee.pointer("/target/symbol"))
                .collect::<Vec<_>>();
            let recommended = candidate
                .get("strategies")
                .and_then(Value::as_array)
                .and_then(|strategies| {
                    strategies
                        .iter()
                        .find(|strategy| strategy["recommended"] == true)
                });
            json!([
                left,
                right,
                candidate.get("language"),
                candidate.pointer("/similarity/total"),
                shared,
                candidate.pointer("/projection/id"),
                recommended.and_then(|strategy| strategy.get("policy")),
                recommended.and_then(|strategy| strategy.pointer("/counterfactual/score")),
                recommended.and_then(|strategy| strategy.pointer("/counterfactual/reasons")),
                recommended.and_then(|strategy| strategy.get("strategy_id"))
            ])
        })
        .collect::<Vec<_>>();
    let mut compact = json!({
        "at":snapshot_tag(value.get("snapshot")),
        "status":value.get("status"),
        "paths":paths,
        "cols":["left","right","language","score","shared_callees","projection_id","recommended_policy","counterfactual_score","reason_codes","strategy_id"],
        "rows":rows,
        "n":value.get("total"),
        "gaps":value.get("coverage_gap_count")
    });
    insert_more_when_true(&mut compact, value.get("truncated"));
    let encoded = serde_json::to_string(&compact).expect("compact refactor result serializes");
    let payload_tokens = Tokenizer::o200k_base()
        .expect("bundled o200k tokenizer")
        .count(&encoded);
    compact
        .as_object_mut()
        .expect("compact result is an object")
        .insert("payload_tokens".to_owned(), json!(payload_tokens));
    compact
}

fn compact_refactor_symbol(value: Option<&Value>, paths: &mut Vec<String>) -> Value {
    let Some(value) = value else {
        return Value::Null;
    };
    let path_id = value.get("path").and_then(Value::as_str).map(|path| {
        paths
            .iter()
            .position(|stored| stored == path)
            .unwrap_or_else(|| {
                paths.push(path.to_owned());
                paths.len() - 1
            })
    });
    json!([value.get("symbol"), path_id])
}

fn compact_status(value: &Value) -> Value {
    let snapshot = value.get("snapshot");
    let gaps: Vec<_> = value
        .get("coverage_gaps")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .take(8)
        .cloned()
        .collect();
    json!({
        "at": snapshot_tag(snapshot),
        "freshness": value.get("freshness"),
        "graph": value.get("graph"),
        "changed": value.get("changed_paths"),
        "gaps_n": value.get("coverage_gap_count"),
        "gaps": gaps,
        "more": value.get("coverage_gaps_truncated"),
    })
}

fn compact_snippet(value: &Value) -> Value {
    json!({
        "at":snapshot_tag(value.get("snapshot")),
        "symbol":value.get("symbol"),
        "path":value.get("path"),
        "definition_span":value.get("definition_span"),
        "body_span":value.get("body_span"),
        "source":value.get("source"),
    })
}

fn compact_coverage(value: &Value) -> Value {
    let rows: Vec<_> = value
        .get("paths")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| json!([item.get("path"), item.get("status"), item.get("gap_count")]))
        .collect();
    json!({
        "at":snapshot_tag(value.get("snapshot")),
        "cols":["path","status","gaps"],
        "rows":rows,
        "scopes":value.get("scopes"),
        "summary":value.get("summary"),
        "scope_summary":value.get("scope_summary"),
    })
}

fn compact_record_row(value: &Value) -> Value {
    json!([
        value.get("path"),
        value
            .get("span_start")
            .or_else(|| value.pointer("/span/start")),
        value.get("span_end").or_else(|| value.pointer("/span/end")),
        value.get("text"),
        value.get("provenance"),
    ])
}

fn snapshot_tag(snapshot: Option<&Value>) -> Option<String> {
    let snapshot = snapshot?;
    let revision: String = snapshot
        .get("repo_revision")?
        .as_str()?
        .chars()
        .take(12)
        .collect();
    let generation = snapshot.get("graph_generation")?.as_u64()?;
    Some(format!("{revision}@{generation}"))
}

fn insert_more_when_true(value: &mut Value, more: Option<&Value>) {
    if more.and_then(Value::as_bool) == Some(true) {
        value
            .as_object_mut()
            .expect("compact result is an object")
            .insert("more".to_owned(), Value::Bool(true));
    }
}

fn compact_trace_root(value: &Value) -> Value {
    json!({
        "symbol": value.get("symbol").or_else(|| value.get("qualified_name")),
        "path": value.get("path"),
        "span": [
            value.get("span_start").or_else(|| value.pointer("/span/start")),
            value.get("span_end").or_else(|| value.pointer("/span/end")),
        ],
    })
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
    budget: u32,
    mode: Mode,
    scope: Scope,
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
    paths_or_scope: Value,
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

#[must_use]
pub fn model_visible_schema_json() -> String {
    serde_json::to_string(&model_visible_schema()).expect("static schema must serialize")
}

fn model_visible_schema() -> Value {
    let bounded_scope = bounded_scope_schema();
    let path_or_scope = path_or_scope_schema(&bounded_scope);
    let mut tools = json!([
        {"name":"scan_risks","description":"Change risks, candidate tests and deterministic parallel agent missions; no tests or LLM executed.","inputSchema":{"type":"object","properties":{"mode":{"enum":["changes"]},"limit":{"type":"integer","minimum":1,"maximum":50},"runs":{"type":"array","items":{"type":"object","properties":{"runner_command":{"type":"string"},"revision":{"type":"string"},"results":{"type":"array","items":{"type":"object","properties":{"path":{"type":"string"},"symbol":{"type":"string"},"status":{"enum":["passed","failed"]},"source_hash":{"type":"string"}}}}}}}}}},
        {"name":"check_change_gates","description":"Snapshot-bound conservative change gate over findings, impacts, missions and graph coverage; no tests or LLM executed.","inputSchema":{"type":"object","properties":{"limit":{"type":"integer","minimum":1,"maximum":50},"fail_on":{"enum":["error","warning","none"],"default":"error"},"max_warning_findings":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_blocked_missions":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_coverage_gaps":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_unverified_impacts":{"type":"integer","minimum":0,"maximum":10000,"default":0},"runs":{"type":"array","items":{"type":"object","properties":{"runner_command":{"type":"string"},"revision":{"type":"string"},"results":{"type":"array","items":{"type":"object","properties":{"path":{"type":"string"},"symbol":{"type":"string"},"status":{"enum":["passed","failed"]},"source_hash":{"type":"string"}}}}}}}}}},
        {"name":"check_repository_gates","description":"Snapshot-bound architecture gate over package cycles, graph coupling, unresolved local dependencies and coverage; no LLM executed.","inputSchema":{"type":"object","properties":{"scope":path_or_scope.clone(),"package_depth":{"type":"integer","minimum":1,"maximum":4,"default":2},"fail_on":{"enum":["error","warning","none"],"default":"error"},"max_package_cycles":{"type":"integer","minimum":0,"maximum":1000000,"default":0},"max_package_fan_out":{"type":"integer","minimum":0,"maximum":1000000,"default":20},"max_symbol_fan_in":{"type":"integer","minimum":0,"maximum":1000000,"default":50},"max_unresolved_local_dependencies":{"type":"integer","minimum":0,"maximum":1000000,"default":0},"max_coverage_gaps":{"type":"integer","minimum":0,"maximum":1000000,"default":0}}}},
        {"name":"check_security_gates","description":"Snapshot-bound security gate over secret detection in diff, dependency audit, and license compliance; no LLM executed.","inputSchema":{"type":"object","properties":{"fail_on":{"enum":["error","warning","none"],"default":"error"},"max_secret_findings":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_dependency_findings":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_license_findings":{"type":"integer","minimum":0,"maximum":10000,"default":0},"allowlist_paths":{"type":"array","items":{"type":"string"}},"allowlist_licenses":{"type":"array","items":{"type":"string"}}}}},
        {"name":"ingest_runtime_evidence","description":"Import revision-pinned runtime call evidence from a local file.","inputSchema":{"type":"object","required":["input_path"],"properties":{"input_path":{"type":"string"},"format":{"enum":["auto","ndjson","otlp-json"],"default":"auto"},"revision":{"type":"string"},"environment":{"type":"string"}}}},
        {"name":"orient","description":"Context","inputSchema":{"type":"object","required":["task","budget","mode","scope"],"properties":{"task":{"type":"string"},"budget":{"type":"integer","minimum":1},"mode":{"enum":["FAST","PRECISE","BOUNDED"]},"scope":bounded_scope.clone()}}},
        {"name":"search_graph","description":"Symbols or bodies","inputSchema":{"type":"object","required":["query"],"properties":{"query":{"type":"string"},"language":{"enum":["typescript","go","java","c","kotlin","python","rust"]},"include_body":{"type":"boolean"},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":50}}}},
        {"name":"get_outline","description":"File symbols","inputSchema":{"type":"object","required":["path"],"properties":{"path":{"type":"string"},"limit":{"type":"integer","minimum":1,"maximum":500}}}},
        {"name":"get_architecture","description":"Packages, proven boundaries, communities and model-free ranked graph futures for cycles and hotspots","inputSchema":{"type":"object","properties":{"scope":path_or_scope.clone(),"package_depth":{"type":"integer","minimum":1,"maximum":4},"limit":{"type":"integer","minimum":1,"maximum":100}}}},
        {"name":"trace_path","description":"Calls","inputSchema":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"},"direction":{"enum":["callers","callees","both"]},"depth":{"type":"integer","minimum":1,"maximum":4},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":50},"evidence":{"enum":["static","observed","all"],"default":"static"}}}},
        {"name":"find_usages","description":"Proven usages","inputSchema":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"},"depth":{"type":"integer","minimum":1,"maximum":4},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":500},"evidence":{"enum":["static","observed","all"],"default":"static"}}}},
        {"name":"suggest_refactors","description":"Similar code and hypothetical graph delta","inputSchema":{"type":"object","properties":{"language":{"enum":["typescript","go","java","c","kotlin","python","rust"]},"min_score":{"type":"integer","minimum":0,"maximum":1000},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":50}}}},
        {"name":"get_code_snippet","description":"Source","inputSchema":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"}}}},
        {"name":"check_index_coverage","description":"Coverage","inputSchema":{"type":"object","properties":{"paths":{"type":"array","items":{"type":"string"}},"scopes":{"type":"array","items":{"type":"string"}},"offset":{"type":"integer","minimum":0},"limit":{"type":"integer","minimum":1,"maximum":500}}}},
        {"name":"expand","description":"Expand","inputSchema":{"type":"object","required":["handle","budget"],"properties":{"handle":{"type":"string"},"budget":{"type":"integer","minimum":1}}}},
        {"name":"status","inputSchema":{"type":"object","required":["paths_or_scope"],"properties":{"paths_or_scope":{}}}},
        {"name":"memory_record","description":"Record","inputSchema":{"type":"object","required":["fact","confidence","repo","path"],"properties":{"fact":{"type":"string"},"confidence":{"type":"integer","minimum":0,"maximum":1000},"repo":{"type":"string"},"rev":{"type":"string"},"path":{"type":"string"},"span":{"type":"object","required":["start_line","end_line"],"properties":{"start_line":{"type":"integer","minimum":1},"end_line":{"type":"integer","minimum":1}}},"valid_until_unix_nanos":{"type":"integer","minimum":1},"privacy_tag":{"type":"string"}}}},
        {"name":"memory_recall","description":"Recall","inputSchema":{"type":"object","properties":{"query":{"type":"string"},"min_confidence":{"type":"integer","minimum":0,"maximum":1000,"default":0},"privacy_tag":{"type":"string"},"revision":{"type":"string"},"limit":{"type":"integer","minimum":1,"maximum":50,"default":20}}}}
    ]);
    let metadata = [
        (
            "Scan change risks",
            "Find possible broken calls, candidate tests and deterministic parallel agent missions for working-tree changes versus HEAD.",
        ),
        (
            "Check change quality gates",
            "Evaluate snapshot-bound change findings, mission blockers and graph coverage with explicit pass, warning, fail or inconclusive semantics.",
        ),
        (
            "Check repository quality gates",
            "Evaluate proven repository architecture with explicit cycle, coupling, unresolved-dependency and coverage policies.",
        ),
        (
            "Check security gates",
            "Evaluate secret detection in diff, dependency audit, and license compliance with explicit pass, warning, fail or inconclusive semantics.",
        ),
        (
            "Import runtime evidence",
            "Import bounded OTLP/JSON or CGRX NDJSON from an approved local path without accepting inline trace bodies.",
        ),
        (
            "Orient on a task",
            "Retrieve task-relevant evidence within a token budget; keep returned handles for follow-up.",
        ),
        (
            "Search symbols",
            "Find code symbols by name, or opt into body search and language filtering, before tracing calls or reading definitions.",
        ),
        (
            "Outline a file",
            "List indexed symbols and definition spans in source order without returning their bodies.",
        ),
        (
            "Map architecture",
            "Summarize proven architecture, including weighted package and symbol communities with representatives.",
        ),
        (
            "Trace calls",
            "Trace callers or callees of a discovered symbol; use path to resolve ambiguity.",
        ),
        (
            "Find usages",
            "List proven direct or transitive incoming call or implementation sites with hop, resolver evidence and coverage gaps.",
        ),
        (
            "Suggest refactors",
            "Find structurally similar functions and preview a snapshot-bound hypothetical extract-helper graph delta.",
        ),
        (
            "Read source",
            "Read the definition of a discovered symbol; use path when names collide.",
        ),
        (
            "Check coverage",
            "Check evidence paths or scopes before relying on graph results; gaps require source inspection.",
        ),
        (
            "Expand context",
            "Retrieve more evidence using a returned handle from the same repository and server session.",
        ),
        (
            "Check index status",
            "Check repository revision, index freshness and gaps before code discovery.",
        ),
        (
            "Record decision",
            "Persist a revision-pinned decision fact with confidence, provenance and optional TTL; identical facts replay as duplicates without LLM calls.",
        ),
        (
            "Recall decisions",
            "Recall non-expired decision facts with bounded deterministic ranking by confidence; no LLM executed.",
        ),
    ];
    for (tool, (title, description)) in tools.as_array_mut().unwrap().iter_mut().zip(metadata) {
        tool["title"] = json!(title);
        tool["description"] = json!(description);
        // All managed calls may refresh persistent indexes and session state.
        // Conservative hints describe actual behavior, not just source-file writes.
        tool["annotations"] =
            json!({"readOnlyHint":false,"destructiveHint":false,"openWorldHint":false});
        tool["outputSchema"] = json!({"type":"object","additionalProperties":true});
    }
    let status = tools
        .as_array_mut()
        .expect("tool schema is an array")
        .iter_mut()
        .find(|tool| tool["name"] == "status")
        .expect("status tool is present");
    status["inputSchema"]["properties"]["paths_or_scope"] = path_or_scope;
    tools
}

fn bounded_scope_schema() -> Value {
    json!({
        "type":"object",
        "required":["include","exclude","relation_kinds","max_depth"],
        "properties":{
            "include":{"type":"array","items":{"type":"string"}},
            "exclude":{"type":"array","items":{"type":"string"}},
            "relation_kinds":{"type":"array","items":{"enum":["CALLS","IMPLEMENTS"]}},
            "max_depth":{"type":"integer","minimum":0,"maximum":255}
        }
    })
}

fn path_or_scope_schema(bounded_scope: &Value) -> Value {
    let mut partial = bounded_scope.clone();
    partial.as_object_mut().unwrap().remove("required");
    json!({"anyOf":[{"type":"string"},{"type":"array","items":{"type":"string"}},partial]})
}

#[cfg(test)]
mod openai_metadata_tests {
    use super::*;

    #[test]
    fn openai_tool_contract() {
        let tools = model_visible_schema();
        assert_eq!(tools.as_array().unwrap().len(), 18);
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
            json!(["typescript", "go", "java", "c", "kotlin", "python", "rust"])
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
}
