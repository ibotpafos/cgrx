mod multi_repo;
mod visualize;

use std::collections::{BTreeMap, BTreeSet};
use std::env;
use std::fs;
use std::io::{self, BufRead, Write};
use std::path::{Path, PathBuf};
use std::process::Command;

use cgrx_capsule::Tokenizer;
use cgrx_cli::Runtime;
use cgrx_core::{
    CapsuleStatus, Hash32, QueryRequest, RelationKind, RepoSnapshot, Scope, canonical_hash,
};
use cgrx_mcp::{
    BackendError, Server, ToolBackend, model_visible_schema_json, revision_bound_handle,
};
use serde::Deserialize;
use serde_json::{Value, json};

fn main() {
    if let Err(error) = run(env::args().skip(1).collect()) {
        eprintln!("cgrx: {error}");
        std::process::exit(2);
    }
}

fn run(args: Vec<String>) -> Result<(), String> {
    let Some(command) = args.first().map(String::as_str) else {
        return Err(
            "expected init, index, serve, visualize, orient, expand, status, schema, usage-report, or bench"
                .to_owned(),
        );
    };
    match command {
        "--version" | "-V" => {
            if args.len() != 1 {
                return Err("version accepts no arguments".to_owned());
            }
            println!("cgrx {}", env!("CARGO_PKG_VERSION"));
        }
        "init" => init(args.get(1).map(PathBuf::from))?,
        "index" => index(&args[1..])?,
        "serve" => serve(&args[1..])?,
        "visualize" => visualize::run(&args[1..])?,
        "orient" => {
            if let Some(state) = optional_flag(&args[1..], "--state") {
                runtime_orient(Path::new(state), &args[1..])?;
            } else {
                let root = optional_flag(&args[1..], "--root").unwrap_or(".");
                managed_runtime_orient(Path::new(root), &args[1..])?;
            }
        }
        "expand" => {
            return Err(
                "expand requires a live cgrx serve MCP session because handles are session-bound"
                    .to_owned(),
            );
        }
        "status" => {
            let root = optional_flag(&args[1..], "--root").unwrap_or(".");
            invoke_managed("status", status_arguments(&args[1..]), Path::new(root))?;
        }
        "schema" => schema(&args[1..])?,
        "usage-report" => usage_report(&args[1..])?,
        "bench" => println!("{}", json!({"status":"DELEGATED_TO_BENCH_HARNESS"})),
        other => return Err(format!("unknown command {other}")),
    }
    Ok(())
}

#[derive(Deserialize)]
struct UsageEventKind {
    event: String,
}

#[derive(Deserialize)]
struct UsageEvent {
    #[serde(default)]
    repo_id: Option<String>,
    #[serde(default)]
    cache: Option<String>,
    #[serde(default)]
    error_code: Option<String>,
    timestamp_ms: u64,
    client: String,
    session: String,
    tool: String,
    ok: bool,
    latency_us: u64,
    request_bytes: u64,
    response_bytes: u64,
}

#[derive(Default)]
struct UsageBucket {
    calls: u64,
    ok: u64,
    cold_calls: u64,
    warm_calls: u64,
    latency_us: Vec<u64>,
    request_bytes: Vec<u64>,
    response_bytes: Vec<u64>,
}

impl UsageBucket {
    fn record(&mut self, event: &UsageEvent, cold: bool) {
        self.calls = self.calls.saturating_add(1);
        self.ok = self.ok.saturating_add(u64::from(event.ok));
        if cold {
            self.cold_calls = self.cold_calls.saturating_add(1);
        } else {
            self.warm_calls = self.warm_calls.saturating_add(1);
        }
        self.latency_us.push(event.latency_us);
        self.request_bytes.push(event.request_bytes);
        self.response_bytes.push(event.response_bytes);
    }

    fn as_json(&self) -> Value {
        json!({
            "calls":self.calls,
            "ok":self.ok,
            "cold_calls":self.cold_calls,
            "warm_calls":self.warm_calls,
            "latency_us":sample_summary(&self.latency_us),
            "request_bytes":sample_summary(&self.request_bytes),
            "response_bytes":sample_summary(&self.response_bytes)
        })
    }
}

fn sample_summary(samples: &[u64]) -> Value {
    if samples.is_empty() {
        return json!({"sum":0,"p50":0,"p95":0,"max":0});
    }
    let mut sorted = samples.to_vec();
    sorted.sort_unstable();
    json!({
        "sum": sorted.iter().copied().fold(0_u64, u64::saturating_add),
        "p50": nearest_rank(&sorted, 50),
        "p95": nearest_rank(&sorted, 95),
        "max": sorted.last().copied().unwrap_or_default()
    })
}

fn nearest_rank(sorted: &[u64], percentile: usize) -> u64 {
    let rank = sorted.len().saturating_mul(percentile).div_ceil(100);
    sorted[rank.saturating_sub(1).min(sorted.len() - 1)]
}

fn usage_report(args: &[String]) -> Result<(), String> {
    if !args.iter().any(|argument| argument == "--json") {
        return Err("usage-report requires --json".to_owned());
    }
    let path = Path::new(flag(args, "--log")?);
    let contents = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let mut events = Vec::new();
    let mut ignored_events = 0_u64;
    for (line_index, line) in contents.lines().enumerate() {
        if line.trim().is_empty() {
            continue;
        }
        let kind: UsageEventKind = serde_json::from_str(line)
            .map_err(|_| format!("invalid usage event metadata at line {}", line_index + 1))?;
        if kind.event != "tool_call" {
            ignored_events = ignored_events.saturating_add(1);
            continue;
        }
        let event: UsageEvent = serde_json::from_str(line)
            .map_err(|_| format!("invalid tool_call metadata at line {}", line_index + 1))?;
        events.push((event, line_index));
    }
    events.sort_by_key(|(event, line_index)| (event.timestamp_ms, *line_index));

    let mut repositories = BTreeSet::new();
    let mut cache_counts: BTreeMap<String, u64> = BTreeMap::new();
    let mut error_counts: BTreeMap<String, u64> = BTreeMap::new();
    for (event, _) in &events {
        if let Some(id) = &event.repo_id
            && id.len() == 64
            && id.bytes().all(|b| b.is_ascii_hexdigit())
        {
            repositories.insert(id);
        }
        let cache = event
            .cache
            .as_deref()
            .filter(|v| ["hit", "miss", "eviction", "none"].contains(v))
            .unwrap_or("legacy");
        *cache_counts.entry(cache.to_owned()).or_default() += 1;
        if let Some(code) = &event.error_code
            && code.starts_with("cgrx.")
            && code.len() <= 64
            && code
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b == b'.' || b == b'_')
        {
            *error_counts.entry(code.clone()).or_default() += 1;
        }
    }
    let mut seen_sessions = BTreeSet::new();
    let mut total = UsageBucket::default();
    let mut cold = UsageBucket::default();
    let mut warm = UsageBucket::default();
    let mut groups: BTreeMap<(String, String, String, bool), UsageBucket> = BTreeMap::new();
    for (event, _) in &events {
        let session_key = (event.client.clone(), event.session.clone());
        let is_cold = seen_sessions.insert(session_key);
        total.record(event, is_cold);
        if is_cold {
            cold.record(event, true);
        } else {
            warm.record(event, false);
        }
        groups
            .entry((
                event.client.clone(),
                event.session.clone(),
                event.tool.clone(),
                event.ok,
            ))
            .or_default()
            .record(event, is_cold);
    }
    let group_rows: Vec<Value> = groups
        .into_iter()
        .map(|((client, session, tool, ok), bucket)| {
            let mut row = bucket.as_json();
            let object = row.as_object_mut().expect("bucket is an object");
            object.insert("client".to_owned(), json!(client));
            object.insert("session".to_owned(), json!(session));
            object.insert("tool".to_owned(), json!(tool));
            object.insert("ok".to_owned(), json!(ok));
            row
        })
        .collect();
    let report = json!({
        "version":1,
        "events":events.len(),
        "ignored_events":ignored_events,
        "routing":{"repositories":repositories.len(),"cache_counts":cache_counts,"error_counts":error_counts},
        "sessions":seen_sessions.len(),
        "totals":{
            "calls":total.calls,
            "ok":total.ok,
            "request_bytes":total.request_bytes.iter().copied().fold(0_u64, u64::saturating_add),
            "response_bytes":total.response_bytes.iter().copied().fold(0_u64, u64::saturating_add)
        },
        "phases":{"cold":cold.as_json(),"warm":warm.as_json()},
        "groups":group_rows
    });
    println!("{report}");
    Ok(())
}

fn index(args: &[String]) -> Result<(), String> {
    if !args.iter().any(|argument| argument == "--json") {
        return Err("index requires --json".to_owned());
    }
    let root = Path::new(flag(args, "--root")?);
    let state = Path::new(flag(args, "--state")?);
    let report = Runtime::index(root, state).map_err(|error| error.to_string())?;
    println!(
        "{}",
        serde_json::to_string(&report).map_err(|error| error.to_string())?
    );
    Ok(())
}

fn runtime_orient(state: &Path, args: &[String]) -> Result<(), String> {
    let request = query_request(args)?;
    let report = Runtime::open(state)
        .and_then(|runtime| runtime.orient(request))
        .map_err(|error| error.to_string())?;
    println!(
        "{}",
        serde_json::to_string(&report).map_err(|error| error.to_string())?
    );
    Ok(())
}

fn managed_runtime_orient(root: &Path, args: &[String]) -> Result<(), String> {
    let root = root.canonicalize().map_err(|error| error.to_string())?;
    let state = managed_state_path(&root)?;
    let mut runtime = open_managed_runtime(&root, &state)?;
    match runtime.refresh(&root) {
        Ok(_) => {}
        Err(error) if error.code() == "revision_changed" => {
            Runtime::index_committed_head(&root, &state).map_err(|error| error.to_string())?;
            runtime = Runtime::open(&state).map_err(|error| error.to_string())?;
            runtime.refresh(&root).map_err(|error| error.to_string())?;
        }
        Err(error) => return Err(error.to_string()),
    }
    let report = runtime
        .orient(query_request(args)?)
        .map_err(|error| error.to_string())?;
    println!(
        "{}",
        serde_json::to_string(&report).map_err(|error| error.to_string())?
    );
    Ok(())
}

fn query_request(args: &[String]) -> Result<QueryRequest, String> {
    let arguments = orient_arguments(args)?;
    Ok(QueryRequest {
        task: arguments["task"]
            .as_str()
            .ok_or_else(|| "task must be a string".to_owned())?
            .to_owned(),
        scope: serde_json::from_value(arguments["scope"].clone())
            .map_err(|error| error.to_string())?,
        mode: serde_json::from_value(arguments["mode"].clone())
            .map_err(|error| error.to_string())?,
        token_budget: u32::try_from(
            arguments["budget"]
                .as_u64()
                .ok_or_else(|| "budget must be an integer".to_owned())?,
        )
        .map_err(|_| "budget is out of range".to_owned())?,
    })
}

fn init(path: Option<PathBuf>) -> Result<(), String> {
    let root = path.unwrap_or_else(|| PathBuf::from("."));
    let state = root.join(".cgrx");
    fs::create_dir_all(&state).map_err(|error| error.to_string())?;
    let snapshot = current_snapshot(&root)?;
    let bytes = serde_json::to_vec_pretty(&snapshot).map_err(|error| error.to_string())?;
    fs::write(state.join("snapshot.json"), bytes).map_err(|error| error.to_string())?;
    println!("initialized={}", state.display());
    Ok(())
}

fn serve(args: &[String]) -> Result<(), String> {
    if args.iter().any(|a| a == "--multi-repo") {
        return multi_repo::serve(args);
    }
    if args.iter().any(|a| a == "--max-repos") {
        return Err("--max-repos requires --multi-repo".to_owned());
    }
    let root = optional_flag(args, "--root").map(PathBuf::from);
    if root.is_some()
        && (optional_flag(args, "--state").is_some()
            || optional_flag(args, "--watch-root").is_some())
    {
        return Err("serve --root cannot be combined with --state or --watch-root".to_owned());
    }
    let mut server = if let Some(state) = optional_flag(args, "--state") {
        let mut runtime = Runtime::open(Path::new(state)).map_err(|error| error.to_string())?;
        let watch_root = optional_flag(args, "--watch-root").map(PathBuf::from);
        if let Some(root) = &watch_root {
            runtime.refresh(root).map_err(|error| error.to_string())?;
        }
        let backend = if let Some(root) = watch_root {
            RuntimeMcpBackend::managed(runtime, root, PathBuf::from(state))
        } else {
            RuntimeMcpBackend::new(runtime, None)
        };
        Server::with_backend(backend)
    } else {
        let root = root.unwrap_or_else(|| PathBuf::from("."));
        let root = root.canonicalize().map_err(|error| error.to_string())?;
        let state = managed_state_path(&root)?;
        let runtime = open_managed_runtime(&root, &state)?;
        Server::with_backend(RuntimeMcpBackend::managed(runtime, root, state))
    };
    if let Ok(path) = env::var("CGRX_USAGE_LOG") {
        let client = env::var("CGRX_CLIENT").unwrap_or_else(|_| "unknown".to_owned());
        let session = env::var("CGRX_USAGE_SESSION")
            .unwrap_or_else(|_| format!("{}-{}", client, std::process::id()));
        server.enable_usage_log(path, client, session);
    }
    let stdin = io::stdin();
    let mut stdout = io::stdout().lock();
    for line in stdin.lock().lines() {
        let line = line.map_err(|error| error.to_string())?;
        if line.trim().is_empty() {
            continue;
        }
        let response = server.dispatch_line(&line);
        if response.is_empty() {
            continue;
        }
        writeln!(stdout, "{response}").map_err(|error| error.to_string())?;
        stdout.flush().map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn managed_state_path(root: &Path) -> Result<PathBuf, String> {
    let output = Command::new(cgrx_cli::git_executable())
        .args(["rev-parse", "--git-path", "cgrx/managed"])
        .current_dir(root)
        .output()
        .map_err(|error| error.to_string())?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_owned());
    }
    let path = PathBuf::from(String::from_utf8_lossy(&output.stdout).trim());
    Ok(if path.is_absolute() {
        path
    } else {
        root.join(path)
    })
}

fn open_managed_runtime(root: &Path, state: &Path) -> Result<Runtime, String> {
    let current = state.join(".cgrx/CURRENT");
    if !current.is_file() {
        Runtime::index_committed_head(root, state).map_err(|error| error.to_string())?;
    }
    match Runtime::open(state) {
        Err(error) if error.code() == "extraction_revision" => {
            Runtime::index_committed_head(root, state).map_err(|error| error.to_string())?;
            Runtime::open(state).map_err(|error| error.to_string())
        }
        result => result.map_err(|error| error.to_string()),
    }
}

struct RuntimeMcpBackend {
    risk_baseline: Option<cgrx_cli::RiskBaseline>,
    runtime: Runtime,
    watch_root: Option<PathBuf>,
    managed_state: Option<PathBuf>,
    expansions: BTreeMap<String, ExpansionState>,
    next_handle_cursor: u64,
}

#[derive(Clone)]
struct ExpansionState {
    request: QueryRequest,
    emitted: BTreeSet<u64>,
}

impl RuntimeMcpBackend {
    fn new(runtime: Runtime, watch_root: Option<PathBuf>) -> Self {
        Self {
            runtime,
            watch_root,
            managed_state: None,
            expansions: BTreeMap::new(),
            next_handle_cursor: 0,
            risk_baseline: None,
        }
    }

    fn managed(runtime: Runtime, root: PathBuf, state: PathBuf) -> Self {
        Self {
            runtime,
            watch_root: Some(root),
            managed_state: Some(state),
            expansions: BTreeMap::new(),
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
                Runtime::index_committed_head(root, state)
                    .map_err(|error| BackendError::new(error.code(), error.to_string()))?;
                self.risk_baseline = None;
                self.runtime = Runtime::open(state)
                    .map_err(|error| BackendError::new(error.code(), error.to_string()))?;
                self.runtime
                    .refresh(root)
                    .map_err(|error| BackendError::new(error.code(), error.to_string()))?;
                true
            }
            Err(error) => return Err(BackendError::new(error.code(), error.to_string())),
        };
        if changed {
            self.expansions.clear();
        }
        Ok(())
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
    fn scan_risks(&mut self, _mode: &str, limit: usize) -> Result<Value, BackendError> {
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
        let mut result = self
            .runtime
            .scan_risks(
                self.risk_baseline.as_ref().expect("baseline loaded"),
                root,
                limit,
            )
            .map_err(|e| BackendError::new(e.code(), e.to_string()))?;
        result["baseline_cache_hit"] = json!(cache_hit);
        Ok(result)
    }

    fn snapshot(&self) -> &RepoSnapshot {
        self.runtime.snapshot()
    }

    fn orient(&mut self, query: QueryRequest) -> Result<Value, BackendError> {
        self.refresh()?;
        let report = self
            .runtime
            .orient(query.clone())
            .map_err(|error| BackendError::new(error.code(), error.to_string()))?;
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
            .orient(state.request.clone())
            .map_err(|error| BackendError::new(error.code(), error.to_string()))?;
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
        Ok(json!({
            "handle":handle,
            "snapshot":report.snapshot,
            "status":status,
            "records":records,
            "next_handles":next_handles,
            "cumulative_budget":cumulative_budget
        }))
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
        let limit = usize::try_from(limit)
            .map_err(|_| BackendError::new("cgrx.invalid_arguments", "limit is out of range"))?;
        self.runtime
            .search_graph_filtered(query, &scope, limit, language, include_body)
            .map_err(|error| BackendError::new(error.code(), error.to_string()))
    }

    fn get_outline(&mut self, path: &str, limit: u32) -> Result<Value, BackendError> {
        self.refresh()?;
        let limit = usize::try_from(limit)
            .map_err(|_| BackendError::new("cgrx.invalid_arguments", "limit is out of range"))?;
        self.runtime
            .get_outline(path, limit)
            .map_err(|error| BackendError::new(error.code(), error.to_string()))
    }

    fn get_architecture(
        &mut self,
        scope: Value,
        package_depth: u8,
        limit: u32,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        let scope = graph_scope(&scope)?;
        let limit = usize::try_from(limit)
            .map_err(|_| BackendError::new("cgrx.invalid_arguments", "limit is out of range"))?;
        self.runtime
            .get_architecture(&scope, usize::from(package_depth), limit)
            .map_err(|error| BackendError::new(error.code(), error.to_string()))
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
        let limit = usize::try_from(limit)
            .map_err(|_| BackendError::new("cgrx.invalid_arguments", "limit is out of range"))?;
        self.runtime
            .trace_path(symbol, path, direction, depth, &scope, limit)
            .map_err(|error| BackendError::new(error.code(), error.to_string()))
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
        let limit = usize::try_from(limit)
            .map_err(|_| BackendError::new("cgrx.invalid_arguments", "limit is out of range"))?;
        self.runtime
            .find_usages(symbol, path, &scope, depth, limit)
            .map_err(|error| BackendError::new(error.code(), error.to_string()))
    }

    fn suggest_refactors(
        &mut self,
        scope: Value,
        language: Option<&str>,
        min_score: u16,
        limit: u32,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        let scope = graph_scope(&scope)?;
        let limit = usize::try_from(limit)
            .map_err(|_| BackendError::new("cgrx.invalid_arguments", "limit is out of range"))?;
        self.runtime
            .suggest_refactors(&scope, language, min_score, limit)
            .map_err(|error| BackendError::new(error.code(), error.to_string()))
    }

    fn get_code_snippet(
        &mut self,
        symbol: &str,
        path: Option<&str>,
    ) -> Result<Value, BackendError> {
        self.refresh()?;
        self.runtime
            .get_code_snippet(symbol, path)
            .map_err(|error| BackendError::new(error.code(), error.to_string()))
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
            .map_err(|error| BackendError::new(error.code(), error.to_string()))
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
        let bounded_coverage = json!({
            "excluded_paths":coverage.excluded_paths.iter().take(COVERAGE_OUTPUT_LIMIT).collect::<Vec<_>>(),
            "parser_error_ranges":coverage.parser_error_ranges.iter().take(COVERAGE_OUTPUT_LIMIT).collect::<Vec<_>>(),
            "stale_paths":coverage.stale_paths.iter().take(COVERAGE_OUTPUT_LIMIT).collect::<Vec<_>>(),
            "traversal_truncated":coverage.traversal_truncated,
            "dynamic_dispatch":coverage.dynamic_dispatch.iter().take(COVERAGE_OUTPUT_LIMIT).collect::<Vec<_>>()
        });
        Ok(json!({
            "snapshot":self.runtime.snapshot(),
            "graph":{
                "nodes":self.runtime.graph_node_count(),
                "edges":self.runtime.graph_edge_count()
            },
            "freshness":if self.watch_root.is_some() { "WATCHED" } else { "PINNED" },
            "changed_paths":self.runtime.changed_paths(),
            "coverage":bounded_coverage,
            "coverage_gap_count":coverage_gap_count,
            "coverage_gaps":coverage_gaps,
            "coverage_gaps_truncated":coverage_gaps_truncated
        }))
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

fn invoke_managed(name: &str, arguments: Value, root: &Path) -> Result<(), String> {
    let root = root.canonicalize().map_err(|error| error.to_string())?;
    let state = managed_state_path(&root)?;
    let runtime = open_managed_runtime(&root, &state)?;
    let mut server = Server::with_backend(RuntimeMcpBackend::managed(runtime, root, state));
    let request = json!({
        "jsonrpc":"2.0",
        "id":1,
        "method":"tools/call",
        "params":{"name":name,"arguments":arguments}
    });
    let response = server.dispatch_line(&request.to_string());
    println!("{response}");
    Ok(())
}

fn schema(args: &[String]) -> Result<(), String> {
    let schema = model_visible_schema_json();
    if args == ["--count-tokens"] {
        let tokenizer = Tokenizer::o200k_base().map_err(|error| error.to_string())?;
        println!("schema_tokens={}", tokenizer.count(&schema));
    } else if args.is_empty() {
        println!("{schema}");
    } else {
        return Err("schema accepts only --count-tokens".to_owned());
    }
    Ok(())
}

fn orient_arguments(args: &[String]) -> Result<Value, String> {
    let task = flag(args, "--task")?.to_owned();
    let budget = parse_u32(flag(args, "--budget")?, "budget")?;
    let mode = flag_or(args, "--mode", "BOUNDED");
    let scope = flag_or(args, "--scope", "**/*");
    let include = if scope.trim_start().starts_with('[') {
        serde_json::from_str::<Vec<String>>(scope)
            .map_err(|error| format!("scope array must be valid JSON: {error}"))?
    } else {
        vec![scope.to_owned()]
    };
    Ok(json!({
        "task":task,
        "budget":budget,
        "mode":mode,
        "scope":{"include":include,"exclude":[],"relation_kinds":["CALLS"],"max_depth":4}
    }))
}

fn status_arguments(args: &[String]) -> Value {
    let mut paths = Vec::new();
    let mut cursor = 0;
    while cursor < args.len() {
        if args[cursor] == "--root" {
            cursor += 2;
        } else if args[cursor].starts_with('-') {
            cursor += 1;
        } else {
            paths.push(args[cursor].clone());
            cursor += 1;
        }
    }
    json!({"paths_or_scope": if paths.is_empty() { json!(["**/*"]) } else { json!(paths) }})
}

fn flag<'a>(args: &'a [String], name: &str) -> Result<&'a str, String> {
    args.windows(2)
        .find(|pair| pair[0] == name)
        .map(|pair| pair[1].as_str())
        .ok_or_else(|| format!("missing {name}"))
}

fn optional_flag<'a>(args: &'a [String], name: &str) -> Option<&'a str> {
    args.windows(2)
        .find(|pair| pair[0] == name)
        .map(|pair| pair[1].as_str())
}

fn flag_or<'a>(args: &'a [String], name: &str, fallback: &'a str) -> &'a str {
    flag(args, name).unwrap_or(fallback)
}

fn parse_u32(value: &str, name: &str) -> Result<u32, String> {
    value
        .parse()
        .map_err(|_| format!("{name} must be an integer"))
}

fn current_snapshot(root: &Path) -> Result<RepoSnapshot, String> {
    let revision = git(root, &["rev-parse", "HEAD"]).unwrap_or_else(|_| "unborn".to_owned());
    let status =
        git(root, &["status", "--porcelain=v1", "--untracked-files=all"]).unwrap_or_default();
    let mut digest = [0_u8; 32];
    digest.copy_from_slice(blake3::hash(status.as_bytes()).as_bytes());
    let graph_generation = env::var("CGRX_GRAPH_GENERATION")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(0);
    Ok(RepoSnapshot {
        repo_revision: revision,
        working_tree_digest: Hash32(digest),
        graph_generation,
    })
}

fn git(root: &Path, args: &[&str]) -> Result<String, String> {
    let output = Command::new(cgrx_cli::git_executable())
        .args(args)
        .current_dir(root)
        .output()
        .map_err(|error| error.to_string())?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_owned());
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_owned())
}
