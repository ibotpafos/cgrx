use cgrx_capsule::{ObligationId, QbecV1, RccV1, ResidualObligation, Tokenizer, verify_hashes};
use cgrx_core::{
    CapsuleStatus, EvidenceSelector, Hash32, Mode, QueryRequest, RepoSnapshot, Scope,
    canonical_hash,
};
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
    usage_log: Option<UsageLog>,
}

struct UsageLog {
    path: PathBuf,
    client: String,
    session: String,
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
    fn scan_risks(&mut self, _mode: &str, _limit: usize) -> Result<Value, BackendError> {
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
    fn check_index_coverage(
        &mut self,
        paths: &[String],
        scopes: &[String],
        offset: usize,
        limit: usize,
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
            usage_log: None,
        }
    }

    #[must_use]
    pub fn with_backend<B: ToolBackend + 'static>(backend: B) -> Self {
        Self {
            snapshot: backend.snapshot().clone(),
            backend: Some(Box::new(backend)),
            usage_log: None,
        }
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
            self.record_usage(
                &tool,
                ok,
                started.elapsed().as_micros(),
                frame.len(),
                serialized.len(),
                response_snapshot.as_ref(),
            );
        }
        serialized
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
                    .scan_risks(mode, limit)
                    .map_err(backend_error)?
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
            "expand" => self.expand(from_value(call.arguments)?)?,
            "status" => self.status(from_value(call.arguments)?)?,
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
}

fn model_visible_result(tool: &str, structured: &Value) -> Value {
    match tool {
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
        _ => structured.clone(),
    }
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
        "totals":value.get("totals"),
        "import_resolution":value.get("import_resolution"),
        "reference_resolution":value.get("reference_resolution"),
        "gaps":value.get("coverage_gap_count"),
        "partial":value.get("partial")
    });
    insert_more_when_true(&mut compact, value.get("truncated"));
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
        {"name":"scan_risks","description":"Change risks and bounded verification plan with related-test candidates; no tests executed.","inputSchema":{"type":"object","properties":{"mode":{"enum":["changes"]},"limit":{"type":"integer","minimum":1,"maximum":50}}}},
        {"name":"ingest_runtime_evidence","description":"Import revision-pinned runtime call evidence from a local file.","inputSchema":{"type":"object","required":["input_path"],"properties":{"input_path":{"type":"string"},"format":{"enum":["auto","ndjson","otlp-json"],"default":"auto"},"revision":{"type":"string"},"environment":{"type":"string"}}}},
        {"name":"orient","description":"Context","inputSchema":{"type":"object","required":["task","budget","mode","scope"],"properties":{"task":{"type":"string"},"budget":{"type":"integer","minimum":1},"mode":{"enum":["FAST","PRECISE","BOUNDED"]},"scope":bounded_scope.clone()}}},
        {"name":"search_graph","description":"Symbols or bodies","inputSchema":{"type":"object","required":["query"],"properties":{"query":{"type":"string"},"language":{"enum":["typescript","go","python","rust"]},"include_body":{"type":"boolean"},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":50}}}},
        {"name":"get_outline","description":"File symbols","inputSchema":{"type":"object","required":["path"],"properties":{"path":{"type":"string"},"limit":{"type":"integer","minimum":1,"maximum":500}}}},
        {"name":"get_architecture","description":"Packages, proven boundaries, hotspots, cycles and package/symbol communities","inputSchema":{"type":"object","properties":{"scope":path_or_scope.clone(),"package_depth":{"type":"integer","minimum":1,"maximum":4},"limit":{"type":"integer","minimum":1,"maximum":100}}}},
        {"name":"trace_path","description":"Calls","inputSchema":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"},"direction":{"enum":["callers","callees","both"]},"depth":{"type":"integer","minimum":1,"maximum":4},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":50},"evidence":{"enum":["static","observed","all"],"default":"static"}}}},
        {"name":"find_usages","description":"Proven usages","inputSchema":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"},"depth":{"type":"integer","minimum":1,"maximum":4},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":500},"evidence":{"enum":["static","observed","all"],"default":"static"}}}},
        {"name":"suggest_refactors","description":"Similar code and hypothetical graph delta","inputSchema":{"type":"object","properties":{"language":{"enum":["typescript","go","python","rust"]},"min_score":{"type":"integer","minimum":0,"maximum":1000},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":50}}}},
        {"name":"get_code_snippet","description":"Source","inputSchema":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"}}}},
        {"name":"check_index_coverage","description":"Coverage","inputSchema":{"type":"object","properties":{"paths":{"type":"array","items":{"type":"string"}},"scopes":{"type":"array","items":{"type":"string"}},"offset":{"type":"integer","minimum":0},"limit":{"type":"integer","minimum":1,"maximum":500}}}},
        {"name":"expand","description":"Expand","inputSchema":{"type":"object","required":["handle","budget"],"properties":{"handle":{"type":"string"},"budget":{"type":"integer","minimum":1}}}},
        {"name":"status","inputSchema":{"type":"object","required":["paths_or_scope"],"properties":{"paths_or_scope":{}}}}
    ]);
    let metadata = [
        (
            "Scan change risks",
            "Find possible broken calls in working-tree changes versus HEAD; verify candidates and coverage.",
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
    tools[12]["inputSchema"]["properties"]["paths_or_scope"] = path_or_scope;
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
        assert_eq!(tools.as_array().unwrap().len(), 13);
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
            json!(["typescript", "go", "python", "rust"])
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
        assert_eq!(
            compact["symbol_community_detection"]["unclustered_symbols"],
            1
        );
        let encoded = serde_json::to_string(&compact).unwrap();
        assert!(!encoded.contains(&"x".repeat(20_000)));
        assert!(
            encoded.len() < 4_000,
            "compact payload bytes: {}",
            encoded.len()
        );
    }
}
