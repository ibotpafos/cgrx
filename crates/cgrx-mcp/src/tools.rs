use cgrx_capsule::{ObligationId, QbecV1, RccV1, ResidualObligation, Tokenizer, verify_hashes};
use cgrx_core::{CapsuleStatus, Hash32, Mode, QueryRequest, RepoSnapshot, Scope, canonical_hash};
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
    fn trace_path(
        &mut self,
        symbol: &str,
        path: Option<&str>,
        direction: &str,
        depth: u8,
        scope: Value,
        limit: u32,
    ) -> Result<Value, BackendError>;
    fn find_usages(
        &mut self,
        symbol: &str,
        path: Option<&str>,
        scope: Value,
        depth: u8,
        limit: u32,
    ) -> Result<Value, BackendError>;
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
            "search_graph" => self.search_graph(from_value(call.arguments)?)?,
            "get_outline" => self.get_outline(from_value(call.arguments)?)?,
            "trace_path" => self.trace_path(from_value(call.arguments)?)?,
            "find_usages" => self.find_usages(from_value(call.arguments)?)?,
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

    fn trace_path(&mut self, arguments: TracePathArguments) -> Result<Value, JsonRpcError> {
        let Some(backend) = &mut self.backend else {
            return Err(JsonRpcError::typed(
                -32020,
                "cgrx.index_adapter_not_connected",
                "trace_path requires an indexed runtime backend",
            ));
        };
        backend
            .trace_path(
                &arguments.symbol,
                arguments.path.as_deref(),
                &arguments.direction,
                arguments.depth,
                arguments.scope,
                arguments.limit,
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
            .find_usages(
                &arguments.symbol,
                arguments.path.as_deref(),
                arguments.scope,
                arguments.depth,
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
        "expand" => compact_expand(structured),
        "search_graph" => compact_search(structured),
        "get_outline" => compact_outline(structured),
        "trace_path" => compact_trace(structured),
        "find_usages" => compact_usages(structured),
        "get_code_snippet" => compact_snippet(structured),
        "check_index_coverage" => compact_coverage(structured),
        "status" => compact_status(structured),
        _ => structured.clone(),
    }
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

fn compact_trace(value: &Value) -> Value {
    let snapshot = value.get("snapshot");
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
            json!([
                item.get("symbol"),
                path_id,
                item.get("hop"),
                item.get("direction"),
            ])
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
    insert_more_when_true(&mut compact, value.get("truncated"));
    compact
}

fn compact_usages(value: &Value) -> Value {
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
            json!([
                item.pointer("/source/symbol"),
                path_id,
                item.get("hop"),
                item.pointer("/via/symbol"),
                item.get("relation"),
                item.pointer("/site/span/start"),
                item.pointer("/site/span/end"),
                item.get("resolver")
            ])
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
    insert_more_when_true(&mut compact, value.get("truncated"));
    compact
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
struct GetOutlineArguments {
    path: String,
    #[serde(default = "default_outline_limit")]
    limit: u32,
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
        {"name":"scan_risks","description":"Change risks; candidates only.","inputSchema":{"type":"object","properties":{"mode":{"enum":["changes"]},"limit":{"type":"integer","minimum":1,"maximum":50}}}},
        {"name":"orient","description":"Context","inputSchema":{"type":"object","required":["task","budget","mode","scope"],"properties":{"task":{"type":"string"},"budget":{"type":"integer","minimum":1},"mode":{"enum":["FAST","PRECISE","BOUNDED"]},"scope":bounded_scope.clone()}}},
        {"name":"search_graph","description":"Symbols or bodies","inputSchema":{"type":"object","required":["query"],"properties":{"query":{"type":"string"},"language":{"enum":["typescript","go","python","rust"]},"include_body":{"type":"boolean"},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":50}}}},
        {"name":"get_outline","description":"File symbols","inputSchema":{"type":"object","required":["path"],"properties":{"path":{"type":"string"},"limit":{"type":"integer","minimum":1,"maximum":500}}}},
        {"name":"trace_path","description":"Calls","inputSchema":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"},"direction":{"enum":["callers","callees","both"]},"depth":{"type":"integer","minimum":1,"maximum":4},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":50}}}},
        {"name":"find_usages","description":"Proven usages","inputSchema":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"},"depth":{"type":"integer","minimum":1,"maximum":4},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":500}}}},
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
            "Trace calls",
            "Trace callers or callees of a discovered symbol; use path to resolve ambiguity.",
        ),
        (
            "Find usages",
            "List proven direct or transitive incoming call or implementation sites with hop, resolver evidence and coverage gaps.",
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
    tools[9]["inputSchema"]["properties"]["paths_or_scope"] = path_or_scope;
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
        assert_eq!(tools.as_array().unwrap().len(), 10);
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
        assert_eq!(
            path_or_scope_schema(&scope)["anyOf"]
                .as_array()
                .unwrap()
                .len(),
            3
        );
    }
}
