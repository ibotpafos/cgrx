mod mcp_backend;
mod multi_repo;
mod skill;
mod visualize;

use std::collections::{BTreeMap, BTreeSet};
use std::env;
use std::fs;
use std::io::{self, BufRead, Read, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Instant;

use cgrx_capsule::Tokenizer;
use cgrx_cli::{Runtime, RuntimeEvidenceFormat};
use cgrx_core::{
    Hash32, QueryRequest, RelationKind, RepoSnapshot, Scope,
};
use cgrx_mcp::{
    Server, Toolset, gate_to_sarif, model_visible_schema_json, resolve_response_profile,
    resolve_toolset,
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
            "expected init, index, observe, serve, visualize, orient, expand, status, check-gates, schema, skill, usage-report, or bench"
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
        "observe" => observe(&args[1..])?,
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
        "check-gates" => check_gates(&args[1..])?,
        "schema" => schema(&args[1..])?,
        "skill" => skill::run(&args[1..])?,
        "usage-report" => usage_report(&args[1..])?,
        "bench" => bench(&args[1..])?,
        other => return Err(format!("unknown command {other}")),
    }
    Ok(())
}

fn observe(args: &[String]) -> Result<(), String> {
    let Some(action) = args.first().map(String::as_str) else {
        return Err("observe requires import, status, insights, or prune".to_owned());
    };
    let rest = &args[1..];
    if !rest.iter().any(|argument| argument == "--json") {
        return Err("observe requires --json".to_owned());
    }
    let root = Path::new(optional_flag(rest, "--root").unwrap_or("."))
        .canonicalize()
        .map_err(|error| error.to_string())?;
    let state = managed_state_path(&root)?;
    let runtime = open_managed_runtime(&root, &state)?;
    let output = match action {
        "import" => {
            validate_flags(
                rest,
                &[
                    "--root",
                    "--input",
                    "--format",
                    "--revision",
                    "--environment",
                    "--json",
                ],
            )?;
            let input_path = flag(rest, "--input")?;
            let input = read_observation_input(input_path)?;
            let format = match optional_flag(rest, "--format").unwrap_or("auto") {
                "auto" => RuntimeEvidenceFormat::Auto,
                "ndjson" => RuntimeEvidenceFormat::Ndjson,
                "otlp-json" => RuntimeEvidenceFormat::OtlpJson,
                _ => {
                    return Err(
                        "observe import --format must be auto, ndjson, or otlp-json".to_owned()
                    );
                }
            };
            serde_json::to_value(
                runtime
                    .import_runtime_evidence(
                        &root,
                        &input,
                        format,
                        optional_flag(rest, "--revision"),
                        optional_flag(rest, "--environment"),
                    )
                    .map_err(|error| error.to_string())?,
            )
            .map_err(|error| error.to_string())?
        }
        "insights" => {
            validate_flags(rest, &["--root", "--limit", "--json"])?;
            let limit = optional_flag(rest, "--limit")
                .unwrap_or("20")
                .parse::<usize>()
                .map_err(|_| "observe insights limit must be an integer".to_owned())?;
            let scope = Scope {
                include: Vec::new(),
                exclude: Vec::new(),
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 4,
            };
            serde_json::to_value(
                runtime
                    .runtime_insights(&scope, limit)
                    .map_err(|error| error.to_string())?,
            )
            .map_err(|error| error.to_string())?
        }
        "status" => {
            validate_flags(rest, &["--root", "--json"])?;
            serde_json::to_value(
                runtime
                    .runtime_evidence_status()
                    .map_err(|error| error.to_string())?,
            )
            .map_err(|error| error.to_string())?
        }
        "prune" => {
            validate_flags(
                rest,
                &[
                    "--root",
                    "--before-unix-nanos",
                    "--dry-run",
                    "--apply",
                    "--json",
                ],
            )?;
            let dry_run = rest.iter().any(|argument| argument == "--dry-run");
            let apply = rest.iter().any(|argument| argument == "--apply");
            if dry_run == apply {
                return Err("observe prune requires exactly one of --dry-run or --apply".to_owned());
            }
            let before = flag(rest, "--before-unix-nanos")?
                .parse::<u64>()
                .map_err(|_| "observe prune timestamp must be an unsigned integer".to_owned())?;
            serde_json::to_value(
                runtime
                    .prune_runtime_evidence(before, dry_run)
                    .map_err(|error| error.to_string())?,
            )
            .map_err(|error| error.to_string())?
        }
        _ => return Err(format!("unknown observe action {action}")),
    };
    println!("{output}");
    Ok(())
}

fn read_observation_input(path: &str) -> Result<Vec<u8>, String> {
    let maximum = cgrx_core::MAX_TRACE_BYTES;
    if path == "-" {
        let mut input = Vec::new();
        io::stdin()
            .take((maximum + 1) as u64)
            .read_to_end(&mut input)
            .map_err(|error| error.to_string())?;
        if input.len() > maximum {
            return Err(format!("runtime evidence exceeds {maximum} bytes"));
        }
        return Ok(input);
    }
    let metadata = fs::metadata(path).map_err(|error| error.to_string())?;
    if metadata.len() > maximum as u64 {
        return Err(format!("runtime evidence exceeds {maximum} bytes"));
    }
    fs::read(path).map_err(|error| error.to_string())
}

fn validate_flags(args: &[String], allowed: &[&str]) -> Result<(), String> {
    let boolean = ["--json", "--dry-run", "--apply", "--include-probes"];
    let mut cursor = 0;
    while cursor < args.len() {
        let flag = args[cursor].as_str();
        if !allowed.contains(&flag) {
            return Err(format!("unexpected argument {flag}"));
        }
        cursor += 1;
        if !boolean.contains(&flag) {
            if cursor >= args.len() || args[cursor].starts_with("--") {
                return Err(format!("{flag} requires a value"));
            }
            cursor += 1;
        }
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
    error_counts: BTreeMap<String, u64>,
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
        if let Some(code) = event
            .error_code
            .as_deref()
            .filter(|code| valid_usage_error_code(code))
        {
            *self.error_counts.entry(code.to_owned()).or_default() += 1;
        }
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
            "errors":self.calls.saturating_sub(self.ok),
            "error_counts":self.error_counts,
            "cold_calls":self.cold_calls,
            "warm_calls":self.warm_calls,
            "latency_us":sample_summary(&self.latency_us),
            "request_bytes":sample_summary(&self.request_bytes),
            "response_bytes":sample_summary(&self.response_bytes)
        })
    }
}

fn valid_usage_error_code(code: &str) -> bool {
    code.starts_with("cgrx.")
        && code.len() <= 64
        && code
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'.' || byte == b'_')
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

fn bench(args: &[String]) -> Result<(), String> {
    match args.first().map(String::as_str) {
        Some("refresh") => bench_refresh(&args[1..]),
        Some("orient") => bench_orient(&args[1..]),
        _ => Err("bench requires refresh or orient scenario".to_owned()),
    }
}

fn bench_refresh(args: &[String]) -> Result<(), String> {
    let mut seen = BTreeSet::new();
    let mut cursor = 0;
    while cursor < args.len() {
        let argument = args[cursor].as_str();
        if !seen.insert(argument.to_owned()) {
            return Err(format!("duplicate {argument}"));
        }
        match argument {
            "--json" => cursor += 1,
            "--root" | "--samples" => {
                if cursor + 1 >= args.len() {
                    return Err(format!("missing value for {argument}"));
                }
                cursor += 2;
            }
            _ => return Err(format!("unknown bench refresh argument {argument}")),
        }
    }
    if !args.iter().any(|argument| argument == "--json") {
        return Err("bench refresh requires --json".to_owned());
    }
    let samples = optional_flag(args, "--samples")
        .map(|value| parse_u32(value, "samples"))
        .transpose()?
        .unwrap_or(20);
    if !(3..=1_000).contains(&samples) {
        return Err("samples must be between 3 and 1000".to_owned());
    }
    let root = Path::new(optional_flag(args, "--root").unwrap_or("."))
        .canonicalize()
        .map_err(|error| error.to_string())?;
    let state = managed_state_path(&root)?;
    let cold_started = Instant::now();
    let mut runtime = open_managed_runtime(&root, &state)?;
    let cold_open_us = cold_started.elapsed().as_micros() as u64;
    let warmup_started = Instant::now();
    let warmup_changed = runtime.refresh(&root).map_err(|error| error.to_string())?;
    let warmup_us = warmup_started.elapsed().as_micros() as u64;
    let mut warm_refresh_us = Vec::with_capacity(samples as usize);
    let mut changed_samples = 0_u32;
    for _ in 0..samples {
        let started = Instant::now();
        changed_samples += u32::from(runtime.refresh(&root).map_err(|error| error.to_string())?);
        warm_refresh_us.push(started.elapsed().as_micros() as u64);
    }
    println!(
        "{}",
        json!({
            "schema_version":1,
            "scenario":"refresh",
            "engine_version":env!("CARGO_PKG_VERSION"),
            "snapshot":runtime.snapshot(),
            "samples":samples,
            "changed_samples":changed_samples,
            "cold_open_us":cold_open_us,
            "warmup_us":warmup_us,
            "warmup_changed":warmup_changed,
            "warm_refresh_us":sample_summary(&warm_refresh_us),
            "measurement":"wall_clock_monotonic"
        })
    );
    Ok(())
}

fn collect_usage_logs(root: &Path, include_probes: bool) -> Result<Vec<PathBuf>, String> {
    if !root.is_dir() {
        return Err(format!(
            "usage log directory does not exist: {}",
            root.display()
        ));
    }
    let mut pending = vec![root.to_path_buf()];
    let mut logs = Vec::new();
    while let Some(directory) = pending.pop() {
        let entries = fs::read_dir(&directory).map_err(|error| error.to_string())?;
        for entry in entries {
            let entry = entry.map_err(|error| error.to_string())?;
            let file_type = entry.file_type().map_err(|error| error.to_string())?;
            let path = entry.path();
            if file_type.is_dir() {
                if include_probes || entry.file_name() != "probes" {
                    pending.push(path);
                }
            } else if file_type.is_file()
                && path.extension().and_then(|extension| extension.to_str()) == Some("jsonl")
            {
                logs.push(path);
            }
        }
    }
    logs.sort();
    if logs.is_empty() {
        return Err(format!(
            "no .jsonl usage logs found under {}",
            root.display()
        ));
    }
    Ok(logs)
}

fn bench_orient(args: &[String]) -> Result<(), String> {
    let mut seen = BTreeSet::new();
    let mut cursor = 0;
    while cursor < args.len() {
        let argument = args[cursor].as_str();
        if !seen.insert(argument.to_owned()) {
            return Err(format!("duplicate {argument}"));
        }
        match argument {
            "--json" => cursor += 1,
            "--root" | "--samples" | "--task" | "--budget" | "--mode" | "--scope" => {
                if cursor + 1 >= args.len() {
                    return Err(format!("missing value for {argument}"));
                }
                cursor += 2;
            }
            _ => return Err(format!("unknown bench orient argument {argument}")),
        }
    }
    if !args.iter().any(|argument| argument == "--json") {
        return Err("bench orient requires --json".to_owned());
    }
    let samples = optional_flag(args, "--samples")
        .map(|value| parse_u32(value, "samples"))
        .transpose()?
        .unwrap_or(20);
    if !(3..=1_000).contains(&samples) {
        return Err("samples must be between 3 and 1000".to_owned());
    }
    let request = query_request(args)?;
    let root = Path::new(optional_flag(args, "--root").unwrap_or("."))
        .canonicalize()
        .map_err(|error| error.to_string())?;
    let state = managed_state_path(&root)?;
    let cold_started = Instant::now();
    let mut runtime = open_managed_runtime(&root, &state)?;
    let cold_open_us = cold_started.elapsed().as_micros() as u64;
    let refresh_started = Instant::now();
    let refreshed = runtime.refresh(&root).map_err(|error| error.to_string())?;
    let refresh_us = refresh_started.elapsed().as_micros() as u64;
    let warmup_started = Instant::now();
    let warmup = runtime
        .orient(request.clone())
        .map_err(|error| error.to_string())?;
    let warmup_us = warmup_started.elapsed().as_micros() as u64;
    let mut warm_orient_us = Vec::with_capacity(samples as usize);
    for _ in 0..samples {
        let started = Instant::now();
        runtime
            .orient(request.clone())
            .map_err(|error| error.to_string())?;
        warm_orient_us.push(started.elapsed().as_micros() as u64);
    }
    let prepare_started = Instant::now();
    let prepared = runtime
        .prepare_orient(&request)
        .map_err(|error| error.to_string())?;
    let prepare_us = prepare_started.elapsed().as_micros() as u64;
    let mut warm_repack_us = Vec::with_capacity(samples as usize);
    for _ in 0..samples {
        let started = Instant::now();
        runtime
            .orient_prepared(&prepared, request.token_budget)
            .map_err(|error| error.to_string())?;
        warm_repack_us.push(started.elapsed().as_micros() as u64);
    }
    println!(
        "{}",
        json!({
            "schema_version":1,
            "scenario":"orient",
            "engine_version":env!("CARGO_PKG_VERSION"),
            "snapshot":runtime.snapshot(),
            "samples":samples,
            "cold_open_us":cold_open_us,
            "refresh_us":refresh_us,
            "refreshed":refreshed,
            "warmup_us":warmup_us,
            "warm_orient_us":sample_summary(&warm_orient_us),
            "prepare_us":prepare_us,
            "warm_repack_us":sample_summary(&warm_repack_us),
            "records":warmup.compiled.packed.records.len(),
            "excluded":warmup.compiled.packed.excluded.len(),
            "status":warmup.compiled.status,
            "measurement":"wall_clock_monotonic"
        })
    );
    Ok(())
}

fn usage_report(args: &[String]) -> Result<(), String> {
    validate_flags(args, &["--json", "--log", "--log-dir", "--include-probes"])?;
    if !args.iter().any(|argument| argument == "--json") {
        return Err("usage-report requires --json".to_owned());
    }
    let log = optional_flag(args, "--log");
    let log_dir = optional_flag(args, "--log-dir");
    let include_probes = args.iter().any(|argument| argument == "--include-probes");
    if log.is_some() == log_dir.is_some() {
        return Err("usage-report requires exactly one of --log or --log-dir".to_owned());
    }
    let paths = match (log, log_dir) {
        (Some(path), None) => vec![PathBuf::from(path)],
        (None, Some(root)) => collect_usage_logs(Path::new(root), include_probes)?,
        _ => unreachable!("validated exactly one usage input"),
    };

    let mut events = Vec::new();
    let mut ignored_events = 0_u64;
    for (file_index, path) in paths.iter().enumerate() {
        let contents = fs::read_to_string(path).map_err(|error| error.to_string())?;
        for (line_index, line) in contents.lines().enumerate() {
            if line.trim().is_empty() {
                continue;
            }
            let Ok(kind) = serde_json::from_str::<UsageEventKind>(line) else {
                ignored_events = ignored_events.saturating_add(1);
                continue;
            };
            if kind.event != "tool_call" {
                ignored_events = ignored_events.saturating_add(1);
                continue;
            }
            let Ok(event) = serde_json::from_str::<UsageEvent>(line) else {
                ignored_events = ignored_events.saturating_add(1);
                continue;
            };
            events.push((event, file_index, line_index));
        }
    }
    events.sort_by_key(|(event, file_index, line_index)| {
        (event.timestamp_ms, *file_index, *line_index)
    });

    let mut repositories = BTreeSet::new();
    let mut cache_counts: BTreeMap<String, u64> = BTreeMap::new();
    let mut error_counts: BTreeMap<String, u64> = BTreeMap::new();
    for (event, _, _) in &events {
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
            && valid_usage_error_code(code)
        {
            *error_counts.entry(code.clone()).or_default() += 1;
        }
    }

    let mut seen_sessions = BTreeSet::new();
    let mut total = UsageBucket::default();
    let mut cold = UsageBucket::default();
    let mut warm = UsageBucket::default();
    let mut tools: BTreeMap<String, UsageBucket> = BTreeMap::new();
    let mut clients: BTreeMap<String, UsageBucket> = BTreeMap::new();
    let mut groups: BTreeMap<(String, String, String, bool), UsageBucket> = BTreeMap::new();
    for (event, _, _) in &events {
        let session_key = (event.client.clone(), event.session.clone());
        let is_cold = seen_sessions.insert(session_key);
        total.record(event, is_cold);
        if is_cold {
            cold.record(event, true);
        } else {
            warm.record(event, false);
        }
        tools
            .entry(event.tool.clone())
            .or_default()
            .record(event, is_cold);
        clients
            .entry(event.client.clone())
            .or_default()
            .record(event, is_cold);
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
    let tool_rows: BTreeMap<_, _> = tools
        .into_iter()
        .map(|(tool, bucket)| (tool, bucket.as_json()))
        .collect();
    let client_rows: BTreeMap<_, _> = clients
        .into_iter()
        .map(|(client, bucket)| (client, bucket.as_json()))
        .collect();
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
        "inputs":{"files":paths.len(),"include_probes":include_probes},
        "events":events.len(),
        "ignored_events":ignored_events,
        "routing":{"repositories":repositories.len(),"cache_counts":cache_counts,"error_counts":error_counts},
        "sessions":seen_sessions.len(),
        "totals":{
            "calls":total.calls,
            "ok":total.ok,
            "errors":total.calls.saturating_sub(total.ok),
            "request_bytes":total.request_bytes.iter().copied().fold(0_u64, u64::saturating_add),
            "response_bytes":total.response_bytes.iter().copied().fold(0_u64, u64::saturating_add)
        },
        "phases":{"cold":cold.as_json(),"warm":warm.as_json()},
        "tools":tool_rows,
        "clients":client_rows,
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
    let report = if let Some(path) = optional_flag(args, "--scip") {
        let path = repository_relative_path(root, path);
        Runtime::index_with_scip(root, state, &path)
    } else {
        Runtime::index(root, state)
    }
    .map_err(|error| error.to_string())?;
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
        if optional_flag(args, "--scip").is_some() {
            return Err("serve --scip requires a single --root repository".to_owned());
        }
        return multi_repo::serve(args);
    }
    if args.iter().any(|a| a == "--max-repos") {
        return Err("--max-repos requires --multi-repo".to_owned());
    }
    // Resolve the active toolset: CGRX_TOOLSET env wins, then --toolset, else standard.
    let toolset = resolve_toolset(
        env::var("CGRX_TOOLSET").ok().as_deref(),
        optional_flag(args, "--toolset"),
    );
    let response_profile = resolve_response_profile(
        env::var("CGRX_RESPONSE_PROFILE").ok().as_deref(),
        optional_flag(args, "--response-profile"),
    );
    let root = optional_flag(args, "--root").map(PathBuf::from);
    if optional_flag(args, "--scip").is_some() && root.is_none() {
        return Err("serve --scip requires --root".to_owned());
    }
    if root.is_some()
        && (optional_flag(args, "--state").is_some()
            || optional_flag(args, "--watch-root").is_some())
    {
        return Err("serve --root cannot be combined with --state or --watch-root".to_owned());
    }
    let (mut server, memory_root) = if let Some(state) = optional_flag(args, "--state") {
        let mut runtime = Runtime::open(Path::new(state)).map_err(|error| error.to_string())?;
        let watch_root = optional_flag(args, "--watch-root").map(PathBuf::from);
        if let Some(root) = &watch_root {
            runtime.refresh(root).map_err(|error| error.to_string())?;
        }
        let memory_root = watch_root.clone();
        let backend = if let Some(root) = watch_root {
            mcp_backend::RuntimeMcpBackend::managed(runtime, root, PathBuf::from(state))
        } else {
            mcp_backend::RuntimeMcpBackend::new(runtime, None)
        };
        (
            Server::with_backend(backend)
                .with_toolset(toolset)
                .with_response_profile(response_profile),
            memory_root,
        )
    } else {
        let root = root.unwrap_or_else(|| PathBuf::from("."));
        let root = root.canonicalize().map_err(|error| error.to_string())?;
        let scip_index =
            optional_flag(args, "--scip").map(|path| repository_relative_path(&root, path));
        let state = managed_state_path(&root)?;
        let runtime = open_managed_runtime_with_scip(&root, &state, scip_index.as_deref())?;
        let memory_root = Some(root.clone());
        (
            Server::with_backend(mcp_backend::RuntimeMcpBackend::managed_with_scip(
                runtime, root, state, scip_index,
            ))
            .with_toolset(toolset)
            .with_response_profile(response_profile),
            memory_root,
        )
    };
    if let Some(dir) = memory_root
        && let Ok(store) = cgrx_store::MemoryStore::open(dir)
    {
        server.set_memory_store(store);
    }
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
    let path = PathBuf::from(git(root, &["rev-parse", "--git-path", "cgrx/managed"])?);
    Ok(if path.is_absolute() {
        path
    } else {
        root.join(path)
    })
}

fn repository_relative_path(root: &Path, path: &str) -> PathBuf {
    let path = PathBuf::from(path);
    if path.is_absolute() {
        path
    } else {
        root.join(path)
    }
}

fn open_managed_runtime(root: &Path, state: &Path) -> Result<Runtime, String> {
    open_managed_runtime_with_scip(root, state, None)
}

fn open_managed_runtime_with_scip(
    root: &Path,
    state: &Path,
    scip_index: Option<&Path>,
) -> Result<Runtime, String> {
    let current = state.join(".cgrx/CURRENT");
    if scip_index.is_some() || !current.is_file() {
        if let Some(path) = scip_index {
            Runtime::index_committed_head_with_scip(root, state, path)
        } else {
            Runtime::index_committed_head(root, state)
        }
        .map_err(|error| error.to_string())?;
    }
    match Runtime::open(state) {
        Err(error) if error.code() == "extraction_revision" => {
            if let Some(path) = scip_index {
                Runtime::index_committed_head_with_scip(root, state, path)
            } else {
                Runtime::index_committed_head(root, state)
            }
            .map_err(|error| error.to_string())?;
            Runtime::open(state).map_err(|error| error.to_string())
        }
        result => result.map_err(|error| error.to_string()),
    }
}

fn invoke_managed(name: &str, arguments: Value, root: &Path) -> Result<(), String> {
    let response = call_managed_tool(name, arguments, root)?;
    println!("{response}");
    Ok(())
}

fn call_managed_tool(name: &str, arguments: Value, root: &Path) -> Result<Value, String> {
    let root = root.canonicalize().map_err(|error| error.to_string())?;
    let state = managed_state_path(&root)?;
    let runtime = open_managed_runtime(&root, &state)?;
    let mut server = Server::with_backend(mcp_backend::RuntimeMcpBackend::managed(runtime, root, state))
        .with_toolset(Toolset::Full);
    let request = json!({
        "jsonrpc":"2.0",
        "id":1,
        "method":"tools/call",
        "params":{"name":name,"arguments":arguments}
    });
    let response = server.dispatch_line(&request.to_string());
    serde_json::from_str(&response).map_err(|error| error.to_string())
}

fn managed_structured_content(response: &Value, tool: &str) -> Result<Value, String> {
    if let Some(error) = response.get("error") {
        return Err(format!(
            "{tool} failed: {}",
            error.get("message").unwrap_or(&Value::Null)
        ));
    }
    response
        .pointer("/result/structuredContent")
        .cloned()
        .ok_or_else(|| format!("{tool} returned no structuredContent"))
}

/// Run `check_change_gates` or `check_repository_gates` and render the
/// result as JSON or SARIF 2.1.0.
///
/// Exit semantics for CI: the rendered report is always written first; when
/// the gate `would_block`, this returns `Err` so the process exits nonzero.
fn check_gates(args: &[String]) -> Result<(), String> {
    const ALLOWED: &[&str] = &[
        "--root",
        "--gate",
        "--format",
        "--fail-on",
        "--limit",
        "--package-depth",
        "--max-warning-findings",
        "--max-blocked-missions",
        "--max-coverage-gaps",
        "--max-unverified-impacts",
        "--max-package-cycles",
        "--max-package-fan-out",
        "--max-symbol-fan-in",
        "--max-unresolved-local-dependencies",
        "--paths",
        "--scopes",
        "--max-framework-confidence",
        "--max-false-positive-matches",
        "--output",
    ];
    validate_value_flags(args, ALLOWED)?;
    let gate = flag(args, "--gate")?;
    if !matches!(gate, "change" | "repository" | "framework" | "security") {
        return Err("--gate must be change, repository, framework, or security".to_owned());
    }
    let format = flag_or(args, "--format", "json");
    if !matches!(format, "json" | "sarif") {
        return Err("--format must be json or sarif".to_owned());
    }
    let fail_on = flag_or(args, "--fail-on", "error");
    if !matches!(fail_on, "error" | "warning" | "none") {
        return Err("--fail-on must be error, warning, or none".to_owned());
    }
    let output = flag_or(args, "--output", "-");
    let root = Path::new(optional_flag(args, "--root").unwrap_or("."));

    let (tool, arguments) = if gate == "change" {
        let limit = parse_bounded_usize(flag_or(args, "--limit", "20"), "--limit", 1, 50)?;
        let arguments = json!({
            "limit": limit,
            "fail_on": fail_on,
            "max_warning_findings": parse_bounded_usize(flag_or(args, "--max-warning-findings", "0"), "--max-warning-findings", 0, 10_000)?,
            "max_blocked_missions": parse_bounded_usize(flag_or(args, "--max-blocked-missions", "0"), "--max-blocked-missions", 0, 10_000)?,
            "max_coverage_gaps": parse_bounded_usize(flag_or(args, "--max-coverage-gaps", "0"), "--max-coverage-gaps", 0, 10_000)?,
            "max_unverified_impacts": parse_bounded_usize(flag_or(args, "--max-unverified-impacts", "0"), "--max-unverified-impacts", 0, 10_000)?,
        });
        ("check_change_gates", arguments)
    } else if gate == "repository" {
        let package_depth = parse_bounded_usize(
            flag_or(args, "--package-depth", "2"),
            "--package-depth",
            1,
            4,
        )?;
        let arguments = json!({
            "scope": Value::Null,
            "package_depth": package_depth,
            "fail_on": fail_on,
            "max_package_cycles": parse_bounded_usize(flag_or(args, "--max-package-cycles", "0"), "--max-package-cycles", 0, 1_000_000)?,
            "max_package_fan_out": parse_bounded_usize(flag_or(args, "--max-package-fan-out", "20"), "--max-package-fan-out", 0, 1_000_000)?,
            "max_symbol_fan_in": parse_bounded_usize(flag_or(args, "--max-symbol-fan-in", "50"), "--max-symbol-fan-in", 0, 1_000_000)?,
            "max_unresolved_local_dependencies": parse_bounded_usize(flag_or(args, "--max-unresolved-local-dependencies", "0"), "--max-unresolved-local-dependencies", 0, 1_000_000)?,
            "max_coverage_gaps": parse_bounded_usize(flag_or(args, "--max-coverage-gaps", "0"), "--max-coverage-gaps", 0, 1_000_000)?,
        });
        ("check_repository_gates", arguments)
    } else if gate == "security" {
        let max_secret_findings = parse_bounded_usize(
            flag_or(args, "--max-secret-findings", "0"),
            "--max-secret-findings",
            0,
            10_000,
        )?;
        let max_dependency_findings = parse_bounded_usize(
            flag_or(args, "--max-dependency-findings", "0"),
            "--max-dependency-findings",
            0,
            10_000,
        )?;
        let max_license_findings = parse_bounded_usize(
            flag_or(args, "--max-license-findings", "0"),
            "--max-license-findings",
            0,
            10_000,
        )?;
        let allowlist_paths = optional_flag(args, "--allowlist-paths")
            .map(|value| {
                value
                    .split(',')
                    .map(str::trim)
                    .filter(|segment| !segment.is_empty())
                    .map(str::to_owned)
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let allowlist_licenses = optional_flag(args, "--allowlist-licenses")
            .map(|value| {
                value
                    .split(',')
                    .map(str::trim)
                    .filter(|segment| !segment.is_empty())
                    .map(str::to_owned)
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let arguments = json!({
            "fail_on": fail_on,
            "max_secret_findings": max_secret_findings,
            "max_dependency_findings": max_dependency_findings,
            "max_license_findings": max_license_findings,
            "allowlist_paths": allowlist_paths,
            "allowlist_licenses": allowlist_licenses,
        });
        ("check_security_gates", arguments)
    } else {
        let paths = optional_flag(args, "--paths")
            .map(|value| {
                value
                    .split(',')
                    .map(str::trim)
                    .filter(|segment| !segment.is_empty())
                    .map(str::to_owned)
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let scopes = optional_flag(args, "--scopes")
            .map(|value| {
                value
                    .split(',')
                    .map(str::trim)
                    .filter(|segment| !segment.is_empty())
                    .map(str::to_owned)
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let max_framework_confidence = parse_bounded_usize(
            flag_or(args, "--max-framework-confidence", "0"),
            "--max-framework-confidence",
            0,
            10_000,
        )?;
        let max_false_positive_matches = parse_bounded_usize(
            flag_or(args, "--max-false-positive-matches", "0"),
            "--max-false-positive-matches",
            0,
            10_000,
        )?;
        let arguments = json!({
            "paths": paths,
            "scopes": scopes,
            "fail_on": fail_on,
            "max_framework_confidence": max_framework_confidence,
            "max_false_positive_matches": max_false_positive_matches,
        });
        ("check_framework_gates", arguments)
    };

    let response = call_managed_tool(tool, arguments, root)?;
    let structured = managed_structured_content(&response, tool)?;
    let verdict = structured
        .get("verdict")
        .and_then(Value::as_str)
        .unwrap_or("INCONCLUSIVE");
    let would_block = structured
        .get("would_block")
        .and_then(Value::as_bool)
        .unwrap_or(true);

    let rendered = if format == "sarif" {
        let root = root.canonicalize().map_err(|error| error.to_string())?;
        let resolve = move |path: &str, offset: u64| file_line(&root, path, offset);
        gate_to_sarif(tool, &structured, Some(&resolve))?
    } else {
        structured.clone()
    };
    let text = serde_json::to_string_pretty(&rendered).map_err(|error| error.to_string())?;
    if output == "-" {
        println!("{text}");
    } else {
        fs::write(output, format!("{text}\n")).map_err(|error| error.to_string())?;
    }
    if would_block {
        return Err(format!(
            "{tool} verdict {verdict} would block (fail_on={fail_on})"
        ));
    }
    Ok(())
}

/// Map a byte offset in a repository file to a 1-based line number.
///
/// Returns `None` when the file cannot be read or the offset is out of
/// range; SARIF rendering then falls back to `byteOffset`/`byteLength`.
fn file_line(root: &Path, path: &str, offset: u64) -> Option<u64> {
    let candidate = Path::new(path);
    let full = if candidate.is_absolute() {
        candidate.to_path_buf()
    } else {
        root.join(candidate)
    };
    let bytes = fs::read(full).ok()?;
    let offset = usize::try_from(offset).ok()?;
    if offset > bytes.len() {
        return None;
    }
    Some(
        bytes[..offset]
            .iter()
            .filter(|byte| **byte == b'\n')
            .count() as u64
            + 1,
    )
}

fn validate_value_flags(args: &[String], allowed: &[&str]) -> Result<(), String> {
    let mut cursor = 0;
    while cursor < args.len() {
        let name = args[cursor].as_str();
        if !allowed.contains(&name) {
            return Err(format!("unexpected argument {name}"));
        }
        cursor += 1;
        if cursor >= args.len() || args[cursor].starts_with("--") {
            return Err(format!("{name} requires a value"));
        }
        cursor += 1;
    }
    Ok(())
}

fn parse_bounded_usize(value: &str, name: &str, min: usize, max: usize) -> Result<usize, String> {
    let parsed: usize = value
        .parse()
        .map_err(|_| format!("{name} must be an integer"))?;
    if !(min..=max).contains(&parsed) {
        return Err(format!("{name} must be from {min} to {max}"));
    }
    Ok(parsed)
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
