//! One MCP namespace with explicit, isolated local-worktree routing.
use super::{RuntimeMcpBackend, managed_state_path, open_managed_runtime};
use cgrx_capsule::Tokenizer;
use cgrx_core::{Hash32, RepoSnapshot};
use cgrx_mcp::{JsonRpcError, JsonRpcRequest, JsonRpcResponse, Server, model_visible_schema_json};
use serde_json::{Value, json};
use std::collections::BTreeMap;
use std::fs::{self, OpenOptions};
use std::io::{self, BufRead, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

const TOOLS: [&str; 15] = [
    "scan_risks",
    "check_change_gates",
    "check_repository_gates",
    "ingest_runtime_evidence",
    "orient",
    "expand",
    "status",
    "search_graph",
    "get_outline",
    "get_architecture",
    "trace_path",
    "find_usages",
    "suggest_refactors",
    "get_code_snippet",
    "check_index_coverage",
];

struct Entry {
    server: Server,
    repo_id: String,
    incarnation: String,
    accessed: u64,
}

struct Router {
    transport: Server,
    entries: BTreeMap<PathBuf, Entry>,
    max_repos: usize,
    clock: u64,
    nonce: String,
}

pub(super) fn serve(args: &[String]) -> Result<(), String> {
    let mut max_repos = 4;
    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--multi-repo" => {}
            "--max-repos" => {
                i += 1;
                max_repos = args.get(i).and_then(|s| s.parse::<usize>().ok())
                    .filter(|n| (1..=16).contains(n))
                    .ok_or("--max-repos requires an integer from 1 to 16")?;
            }
            _ => return Err("multi-repo accepts only --multi-repo and --max-repos; root/state/watch-root are mutually exclusive".to_owned()),
        }
        i += 1;
    }
    let mut router = Router::new(max_repos);
    let stdin = io::stdin();
    let mut stdout = io::stdout().lock();
    for line in stdin.lock().lines() {
        let line = line.map_err(|e| e.to_string())?;
        if line.trim().is_empty() {
            continue;
        }
        let response = router.dispatch(&line);
        if !response.is_empty() {
            writeln!(stdout, "{response}").map_err(|e| e.to_string())?;
            stdout.flush().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

impl Router {
    fn new(max_repos: usize) -> Self {
        Self {
            transport: Server::new(RepoSnapshot {
                repo_revision: String::new(),
                working_tree_digest: Hash32([0; 32]),
                graph_generation: 0,
            }),
            entries: BTreeMap::new(),
            max_repos,
            clock: 0,
            nonce: format!(
                "{}-{}",
                std::process::id(),
                SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_nanos()
            ),
        }
    }

    fn dispatch(&mut self, line: &str) -> String {
        let started = Instant::now();
        let Ok(request) = serde_json::from_str::<JsonRpcRequest>(line) else {
            return self.transport.dispatch_line(line);
        };
        if request.id.is_none() || request.jsonrpc != "2.0" {
            return self.transport.dispatch_line(line);
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
                s["required"]
                    .as_array_mut()
                    .expect("required array")
                    .push(json!("repo"));
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
        let result = self.call(request, &mut repo_id, &mut cache);
        let value = result.unwrap_or_else(|e| {
            serde_json::to_value(JsonRpcResponse::error(id, e)).expect("error response")
        });
        let text = value.to_string();
        record_usage(
            &name,
            repo_id.as_deref(),
            cache,
            &value,
            started,
            line.len(),
            text.len(),
        );
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
                        ));
                        if let Ok(store) = cgrx_store::MemoryStore::open(&root) {
                            server.set_memory_store(store);
                        }
                        server
                    },
                    repo_id: identity,
                    incarnation: format!("{}-{}", self.nonce, self.clock),
                    accessed: self.clock,
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
            decorate(&mut result["structuredContent"], &root, entry);
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
