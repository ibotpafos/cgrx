//! One MCP namespace with explicit, isolated local-worktree routing.
use super::{managed_state_path, open_managed_runtime};
use crate::mcp_backend::RuntimeMcpBackend;
use crate::resources::{self, Limits};
use cgrx_capsule::Tokenizer;
use cgrx_core::{Hash32, RepoSnapshot};
use cgrx_mcp::{
    JsonRpcError, JsonRpcRequest, JsonRpcResponse, ResponseProfile, Server,
    model_visible_schema_json, resolve_response_profile,
};
use serde_json::{Value, json};
use std::collections::BTreeMap;
use std::fs::{self, OpenOptions};
use std::io::{self, BufRead, Read, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::mpsc::{self, RecvTimeoutError};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

const TOOLS: [&str; 28] = [
    "scan_risks",
    "check_change_gates",
    "check_repository_gates",
    "ingest_runtime_evidence",
    "orient",
    "expand",
    "status",
    "memory_record",
    "memory_recall",
    "memory_update",
    "memory_forget",
    "check_framework_gates",
    "check_security_gates",
    "search_graph",
    "get_outline",
    "get_architecture",
    "trace_path",
    "find_usages",
    "suggest_refactors",
    "list_quality_candidates",
    "get_candidate_details",
    "prepare_candidate_patch",
    "get_quality_index_status",
    "update_quality_candidate_status",
    "get_code_snippet",
    "check_index_coverage",
    "explain_symbol",
    "detect_dead_code",
];

struct Entry {
    server: Server,
    repo_id: String,
    incarnation: String,
    accessed: u64,
    last_used: Instant,
}

struct Router {
    transport: Server,
    entries: BTreeMap<PathBuf, Entry>,
    max_repos: usize,
    response_profile: ResponseProfile,
    clock: u64,
    nonce: String,
    limits: Limits,
    reclaimed: u64,
    model_releases: u64,
    response_repo: Option<String>,
}

pub(super) fn serve(args: &[String]) -> Result<(), String> {
    let mut max_repos = 1;
    let mut limits = Limits::default();
    let mut response_profile_arg = None;
    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--multi-repo" => {}
            "--max-repos" => {
                i += 1;
                max_repos = args
                    .get(i)
                    .and_then(|s| s.parse::<usize>().ok())
                    .filter(|n| (1..=16).contains(n))
                    .ok_or("--max-repos requires an integer from 1 to 16")?;
            }
            "--response-profile" => {
                i += 1;
                response_profile_arg = Some(
                    args.get(i)
                        .ok_or("--response-profile requires full or token-efficient")?
                        .as_str(),
                );
            }
            "--idle-seconds" | "--resource-wait-seconds" => {
                let option = &args[i];
                i += 1;
                let seconds = args.get(i).and_then(|s| s.parse::<f64>().ok())
                    .filter(|s| s.is_finite() && *s >= if option == "--idle-seconds" { 0.01 } else { 0.0 } && *s <= 86400.0)
                    .ok_or("resource timeout must be finite and nonnegative; idle must be at least0.01 seconds")?;
                let value = Duration::from_secs_f64(seconds);
                if option == "--idle-seconds" {
                    limits.idle = value;
                } else {
                    limits.wait = value;
                }
            }
            "--memory-budget-mib" => {
                i += 1;
                limits.memory_bytes = args
                    .get(i)
                    .and_then(|s| s.parse::<u64>().ok())
                    .filter(|n| (1..=65536).contains(n))
                    .ok_or("--memory-budget-mib requires1..65536")?
                    * 1024
                    * 1024;
            }
            "--max-active-requests" => {
                i += 1;
                limits.active = args
                    .get(i)
                    .and_then(|s| s.parse::<usize>().ok())
                    .filter(|n| (1..=16).contains(n))
                    .ok_or("--max-active-requests requires1..16")?;
            }
            _ => {
                return Err(
                    "unsupported multi-repo option; root/state/watch-root are mutually exclusive"
                        .to_owned(),
                );
            }
        }
        i += 1;
    }
    let response_profile = resolve_response_profile(
        std::env::var("CGRX_RESPONSE_PROFILE").ok().as_deref(),
        response_profile_arg,
    );
    let mut router = Router::new(max_repos, response_profile);
    router.limits = limits;
    cgrx_store::configure_memory_model_worker(std::env::current_exe().map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;
    // A bounded reader permits maintenance while the client keeps stdin open.
    // Only this dispatcher accesses Router: maintenance cannot interrupt a call.
    let (send, receive) = mpsc::sync_channel(1);
    std::thread::spawn(move || {
        let stdin = io::stdin();
        let mut input = stdin.lock();
        loop {
            let mut line = Vec::new();
            let result = (&mut input)
                .take(16 * 1024 * 1024 + 1)
                .read_until(b'\n', &mut line);
            let frame = match result {
                Ok(0) => return,
                Ok(_) if line.len() > 16 * 1024 * 1024 => Err("MCP frame exceeds16MiB".to_owned()),
                Ok(_) => String::from_utf8(line).map_err(|_| "MCP frame must be UTF-8".to_owned()),
                Err(error) => Err(error.to_string()),
            };
            let failed = frame.is_err();
            if send.send(frame).is_err() || failed {
                return;
            }
        }
    });
    let mut stdout = io::stdout().lock();
    loop {
        router.reap_idle();
        let timeout = router
            .entries
            .values()
            .map(|entry| router.limits.idle.saturating_sub(entry.last_used.elapsed()))
            .min();
        let frame = match timeout {
            Some(timeout) => receive.recv_timeout(timeout),
            None => receive.recv().map_err(|_| RecvTimeoutError::Disconnected),
        };
        let line = match frame {
            Ok(line) => line?,
            Err(RecvTimeoutError::Timeout) => continue,
            Err(RecvTimeoutError::Disconnected) => break,
        };
        if line.trim().is_empty() {
            continue;
        }
        let response = router.dispatch(&line);
        if !response.is_empty() {
            writeln!(stdout, "{response}").map_err(|e| e.to_string())?;
            stdout.flush().map_err(|e| e.to_string())?;
            router.complete_response();
        }
    }
    Ok(())
}

impl Router {
    fn new(max_repos: usize, response_profile: ResponseProfile) -> Self {
        Self {
            transport: Server::new(RepoSnapshot {
                repo_revision: String::new(),
                working_tree_digest: Hash32([0; 32]),
                graph_generation: 0,
            })
            .with_response_profile(response_profile),
            entries: BTreeMap::new(),
            max_repos,
            response_profile,
            clock: 0,
            nonce: format!(
                "{}-{}",
                std::process::id(),
                SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_nanos()
            ),
            limits: Limits::default(),
            reclaimed: 0,
            model_releases: 0,
            response_repo: None,
        }
    }

    fn complete_response(&mut self) {
        if let Some(repo) = self.response_repo.take()
            && let Some(entry) = self
                .entries
                .values_mut()
                .find(|entry| entry.repo_id == repo)
        {
            // Includes execution, response decoration and a slow stdout reader.
            entry.last_used = Instant::now();
        }
    }

    fn reap_idle(&mut self) {
        let before = self.entries.len();
        self.entries
            .retain(|_, entry| entry.last_used.elapsed() < self.limits.idle);
        if self.entries.len() < before {
            self.reclaimed += (before - self.entries.len()) as u64;
            if self.entries.is_empty() {
                self.model_releases += u64::from(cgrx_store::release_memory_model());
            }
            resources::relieve();
        }
    }

    fn reclaim_over_budget(&mut self) {
        if resources::footprint().is_none_or(|bytes| bytes <= self.limits.memory_bytes) {
            return;
        }
        self.model_releases += u64::from(cgrx_store::release_memory_model());
        resources::relieve();
        while resources::footprint().is_some_and(|bytes| bytes > self.limits.memory_bytes) {
            let Some(oldest) = self
                .entries
                .iter()
                .min_by_key(|(_, e)| e.accessed)
                .map(|(p, _)| p.clone())
            else {
                break;
            };
            self.entries.remove(&oldest);
            self.reclaimed += 1;
            resources::relieve();
        }
    }

    fn dispatch(&mut self, line: &str) -> String {
        let started = Instant::now();
        self.response_repo = None;
        let Ok(request) = serde_json::from_str::<JsonRpcRequest>(line) else {
            return self.transport.dispatch_line(line);
        };
        if request.id.is_none() || request.jsonrpc != "2.0" {
            return self.transport.dispatch_line(line);
        }
        if request.method == "ping" {
            return serde_json::to_string(&JsonRpcResponse::success(
                request.id.unwrap(),
                json!({}),
            ))
            .expect("ping response");
        }
        if request.method == "tools/list" {
            let mut schema: Value =
                serde_json::from_str(&model_visible_schema_json()).expect("static schema");
            for tool in schema.as_array_mut().expect("tools array") {
                tool["inputSchema"]["properties"]["repo"] = json!({"type":"string","description":"Absolute local Git worktree root. Required on every call."});
                let s = &mut tool["inputSchema"];
                if s.get("required").is_none() {
                    s["required"] = json!([]);
                }
                let required = s["required"].as_array_mut().unwrap();
                if !required.contains(&json!("repo")) {
                    required.push(json!("repo"));
                }
            }
            return serde_json::to_string(&JsonRpcResponse::success(
                request.id.unwrap(),
                json!({"tools":schema}),
            ))
            .expect("response");
        }
        if request.method != "tools/call" {
            return self.transport.dispatch_line(line);
        }
        let name = request.params["name"].as_str().unwrap_or("").to_owned();
        let mut repo_id = None;
        let mut cache = "none";
        let id = request.id.clone().unwrap();
        // Reject invalid memory input without loading a graph, queuing behind
        // inference work, or starting any repository mutation.
        let validation = cgrx_mcp::validate_memory_arguments(&name, &request.params["arguments"]);
        let permit = validation
            .as_ref()
            .ok()
            .map(|_| resources::acquire(&self.limits));
        let result = validation.and_then(|_| {
            permit
                .as_ref()
                .expect("validated request")
                .as_ref()
                .map_err(|failure| {
                    let mut error = if failure.kind() == io::ErrorKind::WouldBlock {
                        JsonRpcError::typed(
                            -32020,
                            "cgrx.resource_busy",
                            "active request budget exhausted; request was not started",
                        )
                    } else {
                        JsonRpcError::typed(
                            -32020,
                            "cgrx.resource_unavailable",
                            "resource admission unavailable; request was not started",
                        )
                    };
                    if let Some(data) = error.data.as_mut() {
                        data["request_started"] = json!(false);
                    }
                    error
                })
                .and_then(|_| self.call(request, &mut repo_id, &mut cache))
        });
        let mut value = result.unwrap_or_else(|e| {
            serde_json::to_value(JsonRpcResponse::error(id, e)).expect("error response")
        });
        // Reuse one inference child throughout a tool call, including memory
        // backfill batches; reap it only after durable-write verification.
        self.model_releases += u64::from(cgrx_store::release_memory_model());
        self.reclaim_over_budget();
        if name == "status"
            && let Some(result) = value.get_mut("result")
        {
            let control = json!({"idle_seconds":self.limits.idle.as_secs_f64(),"memory_budget_bytes":self.limits.memory_bytes,
                "max_active_requests":self.limits.active,"max_repos":self.max_repos,"retained_repos":self.entries.len(),
                "reclaimed_repos":self.reclaimed,"model_releases":self.model_releases,"process_footprint_bytes":resources::footprint(),
                "embedding_lifetime":"request-scoped native worker",
                "memory_budget_kind":"post-request soft retention; active allocations are not interrupted"});
            if let Some(structured) = result.get_mut("structuredContent") {
                structured["resource_control"] = control.clone();
            }
            if let Some(content) = result["content"].as_array_mut() {
                for item in content {
                    if item["type"] == "text"
                        && let Some(text) = item["text"].as_str()
                        && let Ok(mut compact) = serde_json::from_str::<Value>(text)
                    {
                        compact["resource_control"] = control.clone();
                        item["text"] = json!(compact.to_string());
                    }
                }
            }
        }
        let text = value.to_string();
        self.response_repo = repo_id.clone();
        record_usage(
            &name,
            repo_id.as_deref(),
            cache,
            &value,
            started,
            line.len(),
            text.len(),
        );
        drop(permit);
        text
    }

    fn call(
        &mut self,
        request: JsonRpcRequest,
        repo_id: &mut Option<String>,
        cache: &mut &'static str,
    ) -> Result<Value, JsonRpcError> {
        let name = request.params["name"].as_str().unwrap_or("");
        if !TOOLS.contains(&name) {
            return Err(error("cgrx.tool_not_found", "unknown tool"));
        }
        let mut args = request.params["arguments"]
            .as_object()
            .cloned()
            .ok_or_else(|| error("cgrx.invalid_arguments", "arguments must be an object"))?;
        let repo = args
            .remove("repo")
            .and_then(|v| v.as_str().map(str::to_owned))
            .ok_or_else(|| {
                error(
                    "cgrx.invalid_repository",
                    "repo must be an absolute Git worktree root",
                )
            })?;
        let p = Path::new(&repo);
        if !p.is_absolute() {
            return Err(error("cgrx.invalid_repository", "repo must be absolute"));
        }
        let root = p
            .canonicalize()
            .ok()
            .filter(|p| p.is_dir())
            .ok_or_else(|| {
                error(
                    "cgrx.invalid_repository",
                    "repository directory does not exist",
                )
            })?;
        let identity = blake3::hash(root.as_os_str().as_encoded_bytes())
            .to_hex()
            .to_string();
        *repo_id = Some(identity.clone());
        self.clock = self
            .clock
            .checked_add(1)
            .ok_or_else(|| error("cgrx.repository_unavailable", "session counter exhausted"))?;
        if !self.entries.contains_key(&root) {
            validate_root(&root)?;
            *cache = "miss";
            // Open before eviction: a failed load must not destroy usable entries.
            let state = managed_state_path(&root).map_err(|_| {
                error(
                    "cgrx.repository_unavailable",
                    "managed index path unavailable",
                )
            })?;
            let runtime = open_managed_runtime(&root, &state).map_err(|detail| {
                if detail.starts_with("store_busy:") {
                    return error(
                        "cgrx.store_busy",
                        "another process is publishing this index; retry after it finishes",
                    );
                }
                error(
                    "cgrx.repository_unavailable",
                    "repository indexing failed; check Git HEAD and source readability",
                )
            })?;
            if self.entries.len() >= self.max_repos {
                let oldest = self
                    .entries
                    .iter()
                    .min_by_key(|(_, e)| e.accessed)
                    .map(|(p, _)| p.clone())
                    .expect("nonempty cache");
                self.entries.remove(&oldest);
                self.reclaimed += 1;
                resources::relieve();
                *cache = "eviction";
            }
            self.entries.insert(
                root.clone(),
                Entry {
                    server: {
                        let mut server = Server::with_backend(RuntimeMcpBackend::managed(
                            runtime,
                            root.clone(),
                            state,
                        ))
                        .with_response_profile(self.response_profile);
                        if let Ok(store) = cgrx_store::MemoryStore::open(&root) {
                            server.set_memory_store(store);
                        }
                        server
                    },
                    repo_id: identity,
                    incarnation: format!("{}-{}", self.nonce, self.clock),
                    accessed: self.clock,
                    last_used: Instant::now(),
                },
            );
        } else {
            *cache = "hit";
        }
        let entry = self.entries.get_mut(&root).expect("entry loaded");
        entry.accessed = self.clock;
        if name == "expand" {
            let handle = args
                .get("handle")
                .and_then(Value::as_str)
                .ok_or_else(|| error("cgrx.invalid_arguments", "handle must be a string"))?;
            let inner = entry.unwrap_handle(handle)?;
            args.insert("handle".to_owned(), json!(inner));
        }
        let frame = json!({"jsonrpc":"2.0","id":request.id,"method":"tools/call","params":{"name":name,"arguments":args}});
        let mut response: Value =
            serde_json::from_str(&entry.server.dispatch_line(&frame.to_string()))
                .expect("backend JSON response");
        if let Some(result) = response.get_mut("result") {
            // Only public continuation fields are rewritten, never sealed RCC/QBEC data.
            if let Some(structured) = result.get_mut("structuredContent") {
                decorate(structured, &root, entry);
                if structured.get("payload_tokens").is_some() {
                    refresh_payload_tokens(structured);
                }
            }
            if let Some(content) = result["content"].as_array_mut() {
                for item in content {
                    if item["type"] == "text"
                        && let Some(text) = item["text"].as_str()
                        && let Ok(mut compact) = serde_json::from_str::<Value>(text)
                    {
                        decorate(&mut compact, &root, entry);
                        refresh_payload_tokens(&mut compact);
                        item["text"] = json!(compact.to_string());
                    }
                }
            }
        }
        Ok(response)
    }
}

impl Drop for Router {
    fn drop(&mut self) {
        self.entries.clear();
        cgrx_store::release_memory_model();
        resources::relieve();
    }
}

fn refresh_payload_tokens(value: &mut Value) {
    let Some(object) = value.as_object_mut() else {
        return;
    };
    if object.remove("payload_tokens").is_none() {
        return;
    }
    let encoded = serde_json::to_string(value).expect("decorated compact result serializes");
    let tokens = Tokenizer::o200k_base()
        .expect("bundled o200k tokenizer")
        .count(&encoded);
    value["payload_tokens"] = json!(tokens);
}

impl Entry {
    fn wrap_handle(&self, inner: &str) -> String {
        format!("cgrxm1:{}", json!([self.repo_id, self.incarnation, inner]))
    }
    fn unwrap_handle(&self, public: &str) -> Result<String, JsonRpcError> {
        let fail = || {
            error(
                "cgrx.handle_not_found",
                "handle belongs to another repository or expired session; run orient again",
            )
        };
        let envelope: [String; 3] =
            serde_json::from_str(public.strip_prefix("cgrxm1:").ok_or_else(fail)?)
                .map_err(|_| fail())?;
        if envelope[0] != self.repo_id || envelope[1] != self.incarnation {
            return Err(fail());
        }
        Ok(envelope[2].clone())
    }
}

fn decorate(value: &mut Value, root: &Path, entry: &Entry) {
    let Some(obj) = value.as_object_mut() else {
        return;
    };
    obj.insert("repo".to_owned(), json!(root));
    obj.insert("repo_id".to_owned(), json!(entry.repo_id));
    for field in ["next_handles", "next"] {
        if let Some(handles) = obj.get_mut(field).and_then(Value::as_array_mut) {
            for handle in handles {
                if let Some(s) = handle.as_str() {
                    *handle = json!(entry.wrap_handle(s));
                }
            }
        }
    }
    if let Some(handle) = obj.get_mut("handle")
        && let Some(s) = handle.as_str()
    {
        *handle = json!(entry.wrap_handle(s));
    }
}

fn validate_root(root: &Path) -> Result<(), JsonRpcError> {
    let output = Command::new(cgrx_cli::git_executable())
        .args(["rev-parse", "--show-toplevel"])
        .current_dir(root)
        .output()
        .map_err(|_| error("cgrx.invalid_repository", "Git worktree root unavailable"))?;
    let path = String::from_utf8(output.stdout)
        .ok()
        .map(|s| PathBuf::from(s.trim_end_matches(['\r', '\n'])));
    if !output.status.success() || path.and_then(|p| p.canonicalize().ok()).as_deref() != Some(root)
    {
        return Err(error(
            "cgrx.invalid_repository",
            "repo must name the Git worktree root, not a subdirectory",
        ));
    }
    Ok(())
}

fn error(kind: &str, message: &str) -> JsonRpcError {
    JsonRpcError::typed(-32602, kind, message)
}

fn record_usage(
    name: &str,
    repo_id: Option<&str>,
    cache: &str,
    response: &Value,
    started: Instant,
    request_bytes: usize,
    response_bytes: usize,
) {
    let Ok(path) = std::env::var("CGRX_USAGE_LOG") else {
        return;
    };
    if let Some(parent) = Path::new(&path).parent() {
        let _ = fs::create_dir_all(parent);
    }
    let mut opts = OpenOptions::new();
    opts.create(true).append(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        opts.mode(0o600);
    }
    let Ok(mut file) = opts.open(path) else {
        return;
    };
    let client = std::env::var("CGRX_CLIENT").unwrap_or_else(|_| "unknown".to_owned());
    let session = std::env::var("CGRX_USAGE_SESSION")
        .unwrap_or_else(|_| format!("{}-{}", client, std::process::id()));
    let snapshot = &response["result"]["structuredContent"]["snapshot"];
    let event = json!({
        "event":"tool_call", "timestamp_ms":SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis(),
        "client":client,"session":session,"tool":if TOOLS.contains(&name) {name} else {"unknown"},
        "ok":response.get("error").is_none(),"latency_us":started.elapsed().as_micros(),
        "request_bytes":request_bytes,"response_bytes":response_bytes,
        "repo_revision":snapshot["repo_revision"].as_str().unwrap_or(""),"graph_generation":snapshot["graph_generation"].as_u64().unwrap_or(0),
        "repo_id":repo_id,"cache":cache,"error_code":response["error"]["data"]["code"].as_str()
    });
    let _ = writeln!(file, "{event}");
}
