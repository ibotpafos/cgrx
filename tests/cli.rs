use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

static TEST_DIRECTORY_SEQUENCE: AtomicU64 = AtomicU64::new(0);

fn cli() -> Command {
    Command::new(env!("CARGO_BIN_EXE_cgrx"))
}

struct TestDirectory(PathBuf);

impl TestDirectory {
    fn new(label: &str) -> Self {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock after epoch")
            .as_nanos();
        Self::with_nonce(label, nonce)
    }

    fn with_nonce(label: &str, nonce: u128) -> Self {
        let sequence = TEST_DIRECTORY_SEQUENCE.fetch_add(1, Ordering::Relaxed);
        let path = std::env::temp_dir().join(format!(
            "cgrx-cli-{label}-{}-{nonce}-{sequence}",
            std::process::id()
        ));
        fs::create_dir(&path).expect("exclusively create test directory");
        Self(path)
    }

    fn path(&self) -> &Path {
        &self.0
    }
}

impl Drop for TestDirectory {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn git(root: &Path, args: &[&str]) {
    assert!(
        Command::new("git")
            .args(args)
            .current_dir(root)
            .status()
            .expect("git executable")
            .success()
    );
}

fn read_json_line(reader: &mut impl BufRead) -> serde_json::Value {
    let mut line = String::new();
    reader.read_line(&mut line).expect("response reads");
    serde_json::from_str(&line).expect("response is JSON")
}

#[test]
fn managed_bootstrap_reads_committed_blobs_through_one_git_batch_process() {
    let repository = TestDirectory::new("batched-git-bootstrap-repo");
    let wrapper = TestDirectory::new("batched-git-bootstrap-wrapper");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    for name in ["a.rs", "b.rs", "c.rs", "d.rs"] {
        fs::write(
            repository.path().join(name),
            format!("fn {}() {{}}\n", &name[..1]),
        )
        .expect("write source fixture");
    }
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let real_git = Command::new("sh")
        .args(["-c", "command -v git"])
        .output()
        .expect("locate git");
    assert!(real_git.status.success());
    let real_git = String::from_utf8(real_git.stdout)
        .expect("git path is UTF-8")
        .trim()
        .to_owned();
    let log = wrapper.path().join("git.log");
    let script = wrapper.path().join("git");
    fs::write(
        &script,
        "#!/bin/sh\nprintf '%s\\n' \"$*\" >> \"$GIT_WRAPPER_LOG\"\nexec \"$REAL_GIT\" \"$@\"\n",
    )
    .expect("write git wrapper");
    let mut permissions = fs::metadata(&script).unwrap().permissions();
    permissions.set_mode(0o755);
    fs::set_permissions(&script, permissions).unwrap();
    let path = format!(
        "{}:{}",
        wrapper.path().display(),
        std::env::var("PATH").unwrap_or_default()
    );

    let output = cli()
        .arg("serve")
        .current_dir(repository.path())
        .env("PATH", path)
        .env("REAL_GIT", real_git)
        .env("GIT_WRAPPER_LOG", &log)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("serve starts")
        .wait_with_output()
        .expect("serve exits at EOF");
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );

    let trace = fs::read_to_string(log).expect("wrapper log exists");
    let cat_file_calls: Vec<_> = trace
        .lines()
        .filter(|line| line.starts_with("cat-file "))
        .collect();
    assert_eq!(cat_file_calls, ["cat-file --batch"]);
    assert!(
        trace
            .lines()
            .all(|line| !line.starts_with("status --porcelain")),
        "committed bootstrap must not scan the working tree: {trace}"
    );
}

#[test]
fn schema_count_is_machine_readable_and_under_two_thousand_tokens() {
    let output = cli()
        .args(["schema", "--count-tokens"])
        .output()
        .expect("schema command executes");
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).expect("schema output is UTF-8");
    let count: u32 = stdout
        .trim()
        .strip_prefix("schema_tokens=")
        .expect("stable schema count prefix")
        .parse()
        .expect("schema count is numeric");
    assert!(count <= 2000, "schema count was {count}");
}

#[test]
fn usage_report_aggregates_cold_warm_metadata_without_leaking_payloads() {
    let directory = TestDirectory::new("usage-report");
    let log = directory.path().join("usage.jsonl");
    fs::write(
        &log,
        concat!(
            "{\"event\":\"tool_call\",\"timestamp_ms\":1,\"client\":\"codex\",\"session\":\"c1\",\"tool\":\"status\",\"ok\":true,\"latency_us\":1000,\"request_bytes\":10,\"response_bytes\":20,\"query\":\"SECRET_QUERY\",\"arguments\":{\"path\":\"/secret/repo\"}}\n",
            "{\"event\":\"tool_call\",\"timestamp_ms\":2,\"client\":\"codex\",\"session\":\"c1\",\"tool\":\"search_graph\",\"ok\":true,\"latency_us\":3000,\"request_bytes\":30,\"response_bytes\":40}\n",
            "{\"event\":\"tool_call\",\"timestamp_ms\":3,\"client\":\"opencode\",\"session\":\"o1\",\"tool\":\"status\",\"ok\":false,\"latency_us\":2000,\"request_bytes\":50,\"response_bytes\":60}\n",
            "{\"event\":\"tool_call\",\"timestamp_ms\":4,\"client\":\"opencode\",\"session\":\"o1\",\"tool\":\"status\",\"ok\":true,\"latency_us\":4000,\"request_bytes\":70,\"response_bytes\":80}\n",
            "{\"event\":\"startup\",\"query\":\"ANOTHER_SECRET\"}\n",
        ),
    )
    .expect("write usage fixture");

    let output = cli()
        .args(["usage-report", "--log"])
        .arg(&log)
        .arg("--json")
        .output()
        .expect("usage report executes");
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let stdout = String::from_utf8(output.stdout).expect("report output is UTF-8");
    assert!(!stdout.contains("SECRET_QUERY"));
    assert!(!stdout.contains("ANOTHER_SECRET"));
    assert!(!stdout.contains("/secret/repo"));
    let report: serde_json::Value = serde_json::from_str(&stdout).expect("report is JSON");
    assert_eq!(report["events"], 4);
    assert_eq!(report["ignored_events"], 1);
    assert_eq!(report["sessions"], 2);
    assert_eq!(report["totals"]["calls"], 4);
    assert_eq!(report["totals"]["ok"], 3);
    assert_eq!(report["totals"]["request_bytes"], 160);
    assert_eq!(report["totals"]["response_bytes"], 200);
    assert_eq!(report["phases"]["cold"]["calls"], 2);
    assert_eq!(report["phases"]["cold"]["latency_us"]["p50"], 1000);
    assert_eq!(report["phases"]["cold"]["latency_us"]["p95"], 2000);
    assert_eq!(report["phases"]["warm"]["calls"], 2);
    assert_eq!(report["phases"]["warm"]["latency_us"]["p50"], 3000);
    assert_eq!(report["phases"]["warm"]["latency_us"]["p95"], 4000);
    assert_eq!(report["groups"].as_array().unwrap().len(), 4);
    assert_eq!(report["groups"][0]["client"], "codex");
    assert_eq!(report["groups"][0]["session"], "c1");
    assert_eq!(report["groups"][0]["tool"], "search_graph");
    assert_eq!(report["groups"][0]["ok"], true);
}

#[test]
fn serve_without_flags_uses_the_managed_runtime_for_the_current_repository() {
    let repository = TestDirectory::new("default-managed-repo");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("main.ts"),
        b"export function defaultManagedTarget() { return 42; }\n",
    )
    .expect("write fixture");
    git(repository.path(), &["add", "main.ts"]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let mut child = cli()
        .arg("serve")
        .current_dir(repository.path())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("serve starts");
    child
        .stdin
        .take()
        .expect("stdin is piped")
        .write_all(
            format!(
                "{}\n",
                serde_json::json!({
                    "jsonrpc":"2.0",
                    "id":1,
                    "method":"tools/call",
                    "params":{"name":"orient","arguments":{
                        "task":"defaultManagedTarget",
                        "budget":800,
                        "mode":"BOUNDED",
                        "scope":{"include":["**"],"exclude":[],"relation_kinds":["CALLS"],"max_depth":4}
                    }}
                })
            )
            .as_bytes(),
        )
        .expect("request writes");
    let output = child.wait_with_output().expect("serve exits at EOF");
    assert!(output.status.success());
    let response: serde_json::Value =
        serde_json::from_slice(&output.stdout).expect("one JSON response");
    let payload = &response["result"]["structuredContent"];
    assert_ne!(payload["snapshot"]["graph_generation"], 0);
    assert_eq!(
        payload["compiled"]["packed"]["records"][0]["text"],
        "defaultManagedTarget"
    );
}

#[test]
fn index_then_orient_commands_execute_the_real_runtime() {
    let repository = TestDirectory::new("repo");
    let state = TestDirectory::new("state");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("main.ts"),
        b"export function target() { return 42; }\n",
    )
    .expect("write fixture");
    git(repository.path(), &["add", "main.ts"]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let indexed = cli()
        .args(["index", "--root"])
        .arg(repository.path())
        .arg("--state")
        .arg(state.path())
        .arg("--json")
        .output()
        .expect("index executes");
    assert!(
        indexed.status.success(),
        "{}",
        String::from_utf8_lossy(&indexed.stderr)
    );
    let indexed_json: serde_json::Value =
        serde_json::from_slice(&indexed.stdout).expect("index emits one JSON object");
    assert_eq!(indexed_json["indexed_files"], 1);

    let oriented = cli()
        .args(["orient", "--state"])
        .arg(state.path())
        .args([
            "--task",
            "target",
            "--budget",
            "800",
            "--scope",
            r#"["main.ts"]"#,
        ])
        .output()
        .expect("orient executes");
    assert!(
        oriented.status.success(),
        "{}",
        String::from_utf8_lossy(&oriented.stderr)
    );
    let oriented_json: serde_json::Value =
        serde_json::from_slice(&oriented.stdout).expect("orient emits one JSON object");
    assert_eq!(
        oriented_json["compiled"]["packed"]["records"][0]["path"],
        "main.ts"
    );
}

#[test]
fn orient_without_state_uses_the_managed_root_and_emits_real_records() {
    let repository = TestDirectory::new("managed-orient-repo");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("main.ts"),
        b"export function managedCliTarget() { return 42; }\n",
    )
    .expect("write fixture");
    git(repository.path(), &["add", "main.ts"]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let output = cli()
        .args(["orient", "--root"])
        .arg(repository.path())
        .args([
            "--task",
            "managedCliTarget",
            "--budget",
            "800",
            "--scope",
            r#"["main.ts"]"#,
        ])
        .output()
        .expect("managed orient executes");
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let response: serde_json::Value =
        serde_json::from_slice(&output.stdout).expect("managed orient emits JSON");
    assert_ne!(response["snapshot"]["graph_generation"], 0);
    assert_eq!(
        response["compiled"]["packed"]["records"][0]["path"],
        "main.ts"
    );
    assert_eq!(
        response["compiled"]["packed"]["records"][0]["text"],
        "managedCliTarget"
    );
}

#[test]
fn expand_without_a_live_server_fails_with_an_actionable_error() {
    let output = cli()
        .args(["expand", "--handle", "cgrx1.dead", "--budget", "64"])
        .output()
        .expect("expand command executes");
    assert_eq!(output.status.code(), Some(2));
    assert!(
        String::from_utf8_lossy(&output.stderr)
            .contains("expand requires a live cgrx serve MCP session")
    );
}

#[test]
fn status_cli_uses_the_managed_root_instead_of_a_zero_generation_snapshot() {
    let repository = TestDirectory::new("managed-status-repo");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("main.ts"),
        b"export function statusTarget() { return 42; }\nexport function statusCaller() { return statusTarget(); }\n",
    )
    .expect("write fixture");
    git(repository.path(), &["add", "main.ts"]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let revision = Command::new("git")
        .args(["rev-parse", "HEAD"])
        .current_dir(repository.path())
        .output()
        .expect("revision reads");
    let revision = String::from_utf8(revision.stdout)
        .expect("revision is UTF-8")
        .trim()
        .to_owned();

    let output = cli()
        .args(["status", "--root"])
        .arg(repository.path())
        .arg("main.ts")
        .output()
        .expect("managed status executes");
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let response: serde_json::Value =
        serde_json::from_slice(&output.stdout).expect("managed status emits JSON-RPC");
    let payload = &response["result"]["structuredContent"];
    assert_eq!(payload["snapshot"]["repo_revision"], revision);
    assert_ne!(payload["snapshot"]["graph_generation"], 0);
    assert_eq!(payload["freshness"], "WATCHED");
    assert_eq!(payload["changed_paths"], serde_json::json!([]));
    assert_eq!(payload["graph"]["nodes"], 2);
    assert_eq!(payload["graph"]["edges"], 1);
}

#[test]
fn serve_state_routes_mcp_calls_to_the_persistent_runtime() {
    let repository = TestDirectory::new("mcp-repo");
    let state = TestDirectory::new("mcp-state");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("main.ts"),
        b"export function target() { return 42; }\n",
    )
    .expect("write fixture");
    git(repository.path(), &["add", "main.ts"]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let indexed = cli()
        .args(["index", "--root"])
        .arg(repository.path())
        .arg("--state")
        .arg(state.path())
        .arg("--json")
        .output()
        .expect("index executes");
    assert!(
        indexed.status.success(),
        "{}",
        String::from_utf8_lossy(&indexed.stderr)
    );

    let mut child = cli()
        .args(["serve", "--state"])
        .arg(state.path())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("serve starts");
    let mut stdin = child.stdin.take().expect("stdin is piped");
    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0",
            "id":1,
            "method":"tools/call",
            "params":{"name":"orient","arguments":{
                "task":"target",
                "budget":800,
                "mode":"BOUNDED",
                "scope":{"include":["**"],"exclude":[],"relation_kinds":["CALLS"],"max_depth":4}
            }}
        })
    )
    .expect("orient request writes");
    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0",
            "id":2,
            "method":"tools/call",
            "params":{"name":"status","arguments":{"paths_or_scope":["main.ts"]}}
        })
    )
    .expect("status request writes");
    drop(stdin);

    let output = child.wait_with_output().expect("serve exits at EOF");
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let responses: Vec<serde_json::Value> = String::from_utf8(output.stdout)
        .expect("responses are UTF-8")
        .lines()
        .map(|line| serde_json::from_str(line).expect("response is JSON"))
        .collect();
    assert_eq!(responses.len(), 2);
    assert_eq!(
        responses[0]["result"]["structuredContent"]["compiled"]["packed"]["records"][0]["path"],
        "main.ts"
    );
    assert_eq!(
        responses[0]["result"]["structuredContent"]["compiled"]["packed"]["records"][0]["text"],
        "target"
    );
    assert_eq!(
        responses[1]["result"]["structuredContent"]["freshness"],
        "PINNED"
    );
    assert_eq!(
        responses[1]["result"]["structuredContent"]["coverage"],
        serde_json::json!({
            "excluded_paths":[],
            "parser_error_ranges":[],
            "stale_paths":[],
            "traversal_truncated":false,
            "dynamic_dispatch":[]
        })
    );
    assert_eq!(
        responses[1]["result"]["structuredContent"]["coverage_gaps"],
        serde_json::json!([])
    );
}

#[test]
fn status_bounds_large_coverage_output_and_reports_the_full_count() {
    let repository = TestDirectory::new("coverage-output-repo");
    let state = TestDirectory::new("coverage-output-state");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    let mut source = String::from("trait Service {}\n");
    for index in 0..80 {
        source.push_str(&format!(
            "fn noisy_{index}(service: &dyn Service) {{ service.call_{index}(); }}\n"
        ));
    }
    fs::write(repository.path().join("main.rs"), source).expect("write Rust fixture");
    git(repository.path(), &["add", "main.rs"]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let indexed = cli()
        .args(["index", "--root"])
        .arg(repository.path())
        .arg("--state")
        .arg(state.path())
        .arg("--json")
        .output()
        .expect("index executes");
    assert!(indexed.status.success());

    let request = serde_json::json!({
        "jsonrpc":"2.0",
        "id":1,
        "method":"tools/call",
        "params":{"name":"status","arguments":{"paths_or_scope":["main.rs"]}}
    });
    let mut child = cli()
        .args(["serve", "--state"])
        .arg(state.path())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("serve starts");
    writeln!(child.stdin.as_mut().expect("stdin"), "{request}").expect("status writes");
    drop(child.stdin.take());
    let output = child.wait_with_output().expect("serve exits");
    assert!(output.status.success());
    let response: serde_json::Value =
        serde_json::from_slice(&output.stdout).expect("status response is JSON");
    let payload = &response["result"]["structuredContent"];
    assert_eq!(payload["coverage_gap_count"], 80);
    assert_eq!(payload["coverage_gaps_truncated"], true);
    assert!(
        payload["coverage_gaps"]
            .as_array()
            .expect("coverage gaps")
            .len()
            <= 8
    );
    assert!(
        payload["coverage"]["dynamic_dispatch"]
            .as_array()
            .expect("dynamic dispatch")
            .len()
            <= 8
    );
}

#[test]
fn status_limits_dynamic_dispatch_gaps_to_requested_paths() {
    let repository = TestDirectory::new("scoped-coverage-repo");
    let state = TestDirectory::new("scoped-coverage-state");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("target.ts"),
        b"export function target(service: Service) { service.targetCall(); }\n",
    )
    .expect("write target fixture");
    fs::write(
        repository.path().join("other.ts"),
        b"export function other(service: Service) { service.otherCall(); }\n",
    )
    .expect("write other fixture");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    assert!(
        cli()
            .args(["index", "--root"])
            .arg(repository.path())
            .arg("--state")
            .arg(state.path())
            .arg("--json")
            .status()
            .expect("index executes")
            .success()
    );
    let request = serde_json::json!({
        "jsonrpc":"2.0","id":1,"method":"tools/call",
        "params":{"name":"status","arguments":{"paths_or_scope":["target.ts"]}}
    });
    let mut child = cli()
        .args(["serve", "--state"])
        .arg(state.path())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("serve starts");
    writeln!(child.stdin.as_mut().expect("stdin"), "{request}").expect("status writes");
    drop(child.stdin.take());
    let output = child.wait_with_output().expect("serve exits");
    assert!(output.status.success());
    let response: serde_json::Value =
        serde_json::from_slice(&output.stdout).expect("status response is JSON");
    let payload = &response["result"]["structuredContent"];
    assert_eq!(payload["coverage_gap_count"], 1);
    assert_eq!(payload["coverage_gaps_truncated"], false);
    assert_eq!(payload["coverage_gaps"][0]["code"], "DYNAMIC_DISPATCH");
    assert!(
        payload["coverage_gaps"][0]["location"]
            .as_str()
            .expect("location")
            .starts_with("target.ts:")
    );
}

#[test]
fn watched_serve_refreshes_a_changed_tracked_file_without_restart() {
    let repository = TestDirectory::new("watch-repo");
    let state = TestDirectory::new("watch-state");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("main.ts"),
        b"export function oldTarget() { return 1; }\n",
    )
    .expect("write fixture");
    git(repository.path(), &["add", "main.ts"]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let indexed = cli()
        .args(["index", "--root"])
        .arg(repository.path())
        .arg("--state")
        .arg(state.path())
        .arg("--json")
        .output()
        .expect("index executes");
    assert!(indexed.status.success());
    let base: serde_json::Value =
        serde_json::from_slice(&indexed.stdout).expect("index emits JSON");

    let mut child = cli()
        .args(["serve", "--state"])
        .arg(state.path())
        .arg("--watch-root")
        .arg(repository.path())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("watched serve starts");
    let mut stdin = child.stdin.take().expect("stdin is piped");
    let mut stdout = BufReader::new(child.stdout.take().expect("stdout is piped"));

    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0",
            "id":1,
            "method":"tools/call",
            "params":{"name":"orient","arguments":{
                "task":"oldTarget",
                "budget":1,
                "mode":"BOUNDED",
                "scope":{"include":["**"],"exclude":[],"relation_kinds":["CALLS"],"max_depth":4}
            }}
        })
    )
    .expect("base orient request writes");
    stdin.flush().expect("base orient request flushes");
    let base_orient = read_json_line(&mut stdout);
    let old_handle = base_orient["result"]["structuredContent"]["next_handles"][0]
        .as_str()
        .expect("base orient emits expansion handle")
        .to_owned();

    fs::write(
        repository.path().join("main.ts"),
        b"export function newTarget() { return 2; }\n",
    )
    .expect("change tracked file after server start");
    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0",
            "id":2,
            "method":"tools/call",
            "params":{"name":"orient","arguments":{
                "task":"newTarget",
                "budget":800,
                "mode":"BOUNDED",
                "scope":{"include":["**"],"exclude":[],"relation_kinds":["CALLS"],"max_depth":4}
            }}
        })
    )
    .expect("orient request writes");
    stdin.flush().expect("orient request flushes");
    let oriented = read_json_line(&mut stdout);
    let payload = &oriented["result"]["structuredContent"];
    assert_ne!(payload["snapshot"], base["snapshot"]);
    assert!(
        payload["compiled"]["packed"]["records"]
            .as_array()
            .expect("records array")
            .iter()
            .any(|record| record["path"] == "main.ts" && record["text"] == "newTarget")
    );

    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0",
            "id":3,
            "method":"tools/call",
            "params":{"name":"status","arguments":{"paths_or_scope":["main.ts"]}}
        })
    )
    .expect("status request writes");
    stdin.flush().expect("status request flushes");
    let status = read_json_line(&mut stdout);
    assert_eq!(
        status["result"]["structuredContent"]["freshness"],
        "WATCHED"
    );
    assert_eq!(
        status["result"]["structuredContent"]["changed_paths"],
        serde_json::json!(["main.ts"])
    );

    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0",
            "id":4,
            "method":"tools/call",
            "params":{"name":"expand","arguments":{"handle":old_handle,"budget":800}}
        })
    )
    .expect("stale expand request writes");
    stdin.flush().expect("stale expand request flushes");
    let stale = read_json_line(&mut stdout);
    assert_eq!(stale["error"]["data"]["code"], "cgrx.handle_not_found");

    drop(stdin);
    assert!(child.wait().expect("serve exits at EOF").success());
}

#[test]
fn serve_state_expands_real_revision_bound_evidence_once() {
    let repository = TestDirectory::new("expand-repo");
    let state = TestDirectory::new("expand-state");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("main.ts"),
        b"export function target() { return 42; }\n",
    )
    .expect("write fixture");
    fs::write(
        repository.path().join("other.ts"),
        b"export function targetHelper() { return 7; }\n",
    )
    .expect("write disconnected fixture");
    git(repository.path(), &["add", "main.ts", "other.ts"]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let indexed = cli()
        .args(["index", "--root"])
        .arg(repository.path())
        .arg("--state")
        .arg(state.path())
        .arg("--json")
        .output()
        .expect("index executes");
    assert!(
        indexed.status.success(),
        "{}",
        String::from_utf8_lossy(&indexed.stderr)
    );

    let mut child = cli()
        .args(["serve", "--state"])
        .arg(state.path())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("serve starts");
    let mut stdin = child.stdin.take().expect("stdin is piped");
    let mut stdout = BufReader::new(child.stdout.take().expect("stdout is piped"));
    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0",
            "id":1,
            "method":"tools/call",
            "params":{"name":"orient","arguments":{
                "task":"target",
                "budget":1,
                "mode":"BOUNDED",
                "scope":{"include":["**"],"exclude":[],"relation_kinds":["CALLS"],"max_depth":4}
            }}
        })
    )
    .expect("orient request writes");
    stdin.flush().expect("orient request flushes");
    let oriented = read_json_line(&mut stdout);
    assert_eq!(
        oriented["result"]["structuredContent"]["compiled"]["packed"]["records"],
        serde_json::json!([])
    );
    let handle = oriented["result"]["structuredContent"]["next_handles"][0]
        .as_str()
        .expect("budget-limited orient emits a handle")
        .to_owned();

    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0",
            "id":2,
            "method":"tools/call",
            "params":{"name":"expand","arguments":{"handle":handle,"budget":800}}
        })
    )
    .expect("expand request writes");
    stdin.flush().expect("expand request flushes");
    let expanded = read_json_line(&mut stdout);
    assert_eq!(
        expanded["result"]["structuredContent"]["records"][0]["path"],
        "main.ts"
    );
    assert_eq!(
        expanded["result"]["structuredContent"]["records"][0]["text"],
        "target"
    );
    assert_eq!(
        expanded["result"]["structuredContent"]["next_handles"],
        serde_json::json!([])
    );
    assert_eq!(
        expanded["result"]["structuredContent"]["snapshot"],
        oriented["result"]["structuredContent"]["snapshot"]
    );

    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0",
            "id":3,
            "method":"tools/call",
            "params":{"name":"expand","arguments":{"handle":handle,"budget":800}}
        })
    )
    .expect("reused expand request writes");
    stdin.flush().expect("reused expand request flushes");
    let reused = read_json_line(&mut stdout);
    assert_eq!(reused["error"]["code"], -32004);
    assert_eq!(reused["error"]["data"]["code"], "cgrx.handle_not_found");

    drop(stdin);
    assert!(child.wait().expect("serve exits at EOF").success());
}

#[test]
fn managed_serve_bootstraps_and_reuses_default_state() {
    let repository = TestDirectory::new("managed-repo");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("main.rs"),
        b"pub fn managed_target() -> u8 { 1 }\n",
    )
    .expect("write fixture");
    git(repository.path(), &["add", "main.rs"]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let request = format!(
        "{}\n",
        serde_json::json!({
            "jsonrpc":"2.0",
            "id":1,
            "method":"tools/call",
            "params":{"name":"orient","arguments":{
                "task":"managed_target",
                "budget":800,
                "mode":"BOUNDED",
                "scope":{"include":["**"],"exclude":[],"relation_kinds":["CALLS"],"max_depth":4}
            }}
        })
    );
    let first = cli()
        .args(["serve", "--root"])
        .arg(repository.path())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .and_then(|mut child| {
            child
                .stdin
                .take()
                .expect("stdin")
                .write_all(request.as_bytes())?;
            child.wait_with_output()
        })
        .expect("managed serve executes");
    assert!(
        first.status.success(),
        "{}",
        String::from_utf8_lossy(&first.stderr)
    );
    let first_response: serde_json::Value =
        serde_json::from_slice(&first.stdout).expect("managed response is JSON");
    assert_eq!(
        first_response["result"]["structuredContent"]["compiled"]["packed"]["records"][0]["text"],
        "managed_target"
    );
    let current = repository.path().join(".git/cgrx/managed/.cgrx/CURRENT");
    assert!(current.is_file(), "managed serve publishes default state");
    let generation = fs::read_to_string(&current).expect("read managed generation");

    let second = cli()
        .args(["serve", "--root"])
        .arg(repository.path())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .and_then(|mut child| {
            child
                .stdin
                .take()
                .expect("stdin")
                .write_all(request.as_bytes())?;
            child.wait_with_output()
        })
        .expect("managed serve restarts");
    assert!(second.status.success());
    assert_eq!(
        fs::read_to_string(current).expect("read reused generation"),
        generation,
        "restart reuses the published generation"
    );
}

#[test]
fn managed_serve_atomically_reindexes_after_git_head_changes() {
    let repository = TestDirectory::new("managed-head-repo");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("main.rs"),
        b"pub fn old_target() {}\n",
    )
    .expect("write old fixture");
    git(repository.path(), &["add", "main.rs"]);
    git(repository.path(), &["commit", "-qm", "old fixture"]);

    let mut child = cli()
        .args(["serve", "--root"])
        .arg(repository.path())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("managed serve starts");
    let mut stdin = child.stdin.take().expect("stdin is piped");
    let mut stdout = BufReader::new(child.stdout.take().expect("stdout is piped"));
    let orient = |id: u8, task: &str| {
        serde_json::json!({
            "jsonrpc":"2.0",
            "id":id,
            "method":"tools/call",
            "params":{"name":"orient","arguments":{
                "task":task,
                "budget":800,
                "mode":"BOUNDED",
                "scope":{"include":["**"],"exclude":[],"relation_kinds":["CALLS"],"max_depth":4}
            }}
        })
    };
    writeln!(stdin, "{}", orient(1, "old_target")).expect("old request writes");
    stdin.flush().expect("old request flushes");
    let old = read_json_line(&mut stdout);
    let old_snapshot = old["result"]["structuredContent"]["snapshot"].clone();

    fs::write(
        repository.path().join("main.rs"),
        b"pub fn new_target() {}\n",
    )
    .expect("write new fixture");
    git(repository.path(), &["add", "main.rs"]);
    git(repository.path(), &["commit", "-qm", "new fixture"]);
    fs::write(
        repository.path().join("Panel.tsx"),
        b"export function HeadOverlayPanel() { return <aside />; }\n",
    )
    .expect("write post-HEAD untracked fixture");
    writeln!(stdin, "{}", orient(2, "new_target")).expect("new request writes");
    stdin.flush().expect("new request flushes");
    let new = read_json_line(&mut stdout);
    let payload = &new["result"]["structuredContent"];
    assert_ne!(payload["snapshot"], old_snapshot);
    assert!(
        payload["compiled"]["packed"]["records"]
            .as_array()
            .unwrap_or_else(|| panic!("managed reindex response has records: {new:#}"))
            .iter()
            .any(|record| record["path"] == "main.rs" && record["text"] == "new_target")
    );

    writeln!(stdin, "{}", orient(3, "HeadOverlayPanel")).expect("overlay request writes");
    stdin.flush().expect("overlay request flushes");
    let overlay = read_json_line(&mut stdout);
    assert!(
        overlay["result"]["structuredContent"]["compiled"]["packed"]["records"]
            .as_array()
            .unwrap_or_else(|| panic!("managed overlay response has records: {overlay:#}"))
            .iter()
            .any(|record| {
                record["path"] == "Panel.tsx" && record["text"] == "HeadOverlayPanel"
            }),
        "managed HEAD reindex restores the dirty overlay: {overlay:#}"
    );

    drop(stdin);
    assert!(child.wait().expect("managed serve exits").success());
}

#[test]
fn managed_serve_bootstraps_dirty_head_and_overlays_untracked_tsx() {
    let repository = TestDirectory::new("managed-dirty-repo");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("main.ts"),
        b"export function committedTarget() { return 1; }\n",
    )
    .expect("write committed fixture");
    git(repository.path(), &["add", "main.ts"]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    fs::write(
        repository.path().join("main.ts"),
        b"export function dirtyTarget() { return 2; }\n",
    )
    .expect("write dirty tracked fixture");
    fs::write(
        repository.path().join("Panel.tsx"),
        b"export function UntrackedPanel() { return <section />; }\n",
    )
    .expect("write untracked TSX fixture");

    let mut child = cli()
        .args(["serve", "--root"])
        .arg(repository.path())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("managed dirty serve starts");
    let mut stdin = child.stdin.take().expect("stdin is piped");
    let mut stdout = BufReader::new(child.stdout.take().expect("stdout is piped"));
    let orient = |id: u8, task: &str| {
        serde_json::json!({
            "jsonrpc":"2.0",
            "id":id,
            "method":"tools/call",
            "params":{"name":"orient","arguments":{
                "task":task,
                "budget":800,
                "mode":"BOUNDED",
                "scope":{"include":["**"],"exclude":[],"relation_kinds":["CALLS"],"max_depth":4}
            }}
        })
    };

    writeln!(stdin, "{}", orient(1, "dirtyTarget")).expect("dirty request writes");
    stdin.flush().expect("dirty request flushes");
    let dirty = read_json_line(&mut stdout);
    assert!(
        dirty["result"]["structuredContent"]["compiled"]["packed"]["records"]
            .as_array()
            .unwrap_or_else(|| panic!("dirty response has records: {dirty:#}"))
            .iter()
            .any(|record| record["path"] == "main.ts" && record["text"] == "dirtyTarget")
    );

    writeln!(stdin, "{}", orient(2, "UntrackedPanel")).expect("untracked request writes");
    stdin.flush().expect("untracked request flushes");
    let untracked = read_json_line(&mut stdout);
    assert!(
        untracked["result"]["structuredContent"]["compiled"]["packed"]["records"]
            .as_array()
            .unwrap_or_else(|| panic!("untracked response has records: {untracked:#}"))
            .iter()
            .any(|record| record["path"] == "Panel.tsx" && record["text"] == "UntrackedPanel"),
        "untracked TSX record is present: {untracked:#}"
    );

    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0",
            "id":3,
            "method":"tools/call",
            "params":{"name":"status","arguments":{"paths_or_scope":["**"]}}
        })
    )
    .expect("status request writes");
    stdin.flush().expect("status request flushes");
    let status = read_json_line(&mut stdout);
    assert_eq!(
        status["result"]["structuredContent"]["freshness"],
        "WATCHED"
    );
    assert_eq!(
        status["result"]["structuredContent"]["changed_paths"],
        serde_json::json!(["Panel.tsx", "main.ts"])
    );

    drop(stdin);
    assert!(child.wait().expect("managed dirty serve exits").success());
}

#[test]
fn serve_exposes_real_search_graph_and_trace_path_tools() {
    let repository = TestDirectory::new("graph-tools-repo");
    let state = TestDirectory::new("graph-tools-state");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("main.rs"),
        b"fn target() {}\nfn middle() { target(); }\nfn top() { middle(); }\n",
    )
    .expect("write graph fixture");
    git(repository.path(), &["add", "main.rs"]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let indexed = cli()
        .args(["index", "--root"])
        .arg(repository.path())
        .arg("--state")
        .arg(state.path())
        .arg("--json")
        .output()
        .expect("index executes");
    assert!(indexed.status.success());

    let mut child = cli()
        .args(["serve", "--state"])
        .arg(state.path())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("serve starts");
    let mut stdin = child.stdin.take().expect("stdin is piped");
    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0","id":1,"method":"tools/call",
            "params":{"name":"search_graph","arguments":{"query":"target","scope":{"relation_kinds":["CALLS"]},"limit":10}}
        })
    )
    .expect("search request writes");
    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0","id":2,"method":"tools/call",
            "params":{"name":"trace_path","arguments":{"symbol":"target","path":"main.rs","direction":"callers","depth":2,"scope":"main.rs","limit":10}}
        })
    )
    .expect("trace request writes");
    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0","id":3,"method":"tools/call",
            "params":{"name":"get_code_snippet","arguments":{"symbol":"target","path":"main.rs"}}
        })
    )
    .expect("snippet request writes");
    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0","id":4,"method":"tools/call",
            "params":{"name":"check_index_coverage","arguments":{"paths":["main.rs","missing.go"],"scopes":["*.rs"]}}
        })
    )
    .expect("coverage request writes");
    drop(stdin);

    let output = child.wait_with_output().expect("serve exits at EOF");
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let responses: Vec<serde_json::Value> = String::from_utf8(output.stdout)
        .expect("responses are UTF-8")
        .lines()
        .map(|line| serde_json::from_str(line).expect("response is JSON"))
        .collect();
    let searched = &responses[0]["result"]["structuredContent"];
    assert_eq!(searched["matches"][0]["symbol"], "target");
    assert!(searched.get("proof").is_none());
    assert_eq!(searched["matches"][0]["callers"], 1);
    assert_eq!(searched["total"], 1);
    let traced = &responses[1]["result"]["structuredContent"];
    assert_eq!(traced["root"]["symbol"], "target");
    assert_eq!(traced["nodes"][0]["symbol"], "middle");
    assert_eq!(traced["nodes"][0]["hop"], 1);
    assert_eq!(traced["nodes"][1]["symbol"], "top");
    assert_eq!(traced["nodes"][1]["hop"], 2);
    let trace_visible: serde_json::Value = serde_json::from_str(
        responses[1]["result"]["content"][0]["text"]
            .as_str()
            .expect("trace visible text"),
    )
    .expect("trace visible JSON");
    assert_eq!(trace_visible["paths"], serde_json::json!(["main.rs"]));
    assert_eq!(
        trace_visible["cols"],
        serde_json::json!(["symbol", "path_id", "hop", "direction"])
    );
    assert_eq!(
        trace_visible["rows"][0],
        serde_json::json!(["middle", 0, 1, "callers"])
    );
    let snippet = &responses[2];
    assert_eq!(
        snippet["result"]["structuredContent"]["source"],
        "fn target() {}"
    );
    let snippet_visible: serde_json::Value = serde_json::from_str(
        snippet["result"]["content"][0]["text"]
            .as_str()
            .expect("snippet visible text"),
    )
    .expect("snippet visible JSON");
    assert_eq!(snippet_visible["source"], "fn target() {}");
    assert!(snippet_visible["at"].as_str().unwrap().contains('@'));
    let coverage = &responses[3];
    assert_eq!(
        coverage["result"]["structuredContent"]["paths"][0]["status"],
        "indexed"
    );
    assert_eq!(
        coverage["result"]["structuredContent"]["paths"][1]["status"],
        "unknown"
    );
    let coverage_visible: serde_json::Value = serde_json::from_str(
        coverage["result"]["content"][0]["text"]
            .as_str()
            .expect("coverage visible text"),
    )
    .expect("coverage visible JSON");
    assert_eq!(
        coverage_visible["rows"][0],
        serde_json::json!(["main.rs", "indexed", 0])
    );
}

#[test]
fn watched_search_graph_refreshes_changed_symbols_without_restart() {
    let repository = TestDirectory::new("watched-graph-tools-repo");
    let state = TestDirectory::new("watched-graph-tools-state");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("main.rs"),
        b"fn oldGraphSymbol() {}\n",
    )
    .expect("write base graph fixture");
    git(repository.path(), &["add", "main.rs"]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let indexed = cli()
        .args(["index", "--root"])
        .arg(repository.path())
        .arg("--state")
        .arg(state.path())
        .arg("--json")
        .output()
        .expect("index executes");
    assert!(indexed.status.success());

    let mut child = cli()
        .args(["serve", "--state"])
        .arg(state.path())
        .arg("--watch-root")
        .arg(repository.path())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("watched serve starts");
    let mut stdin = child.stdin.take().expect("stdin is piped");
    let mut stdout = BufReader::new(child.stdout.take().expect("stdout is piped"));
    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0","id":1,"method":"tools/call",
            "params":{"name":"search_graph","arguments":{"query":"oldGraphSymbol"}}
        })
    )
    .expect("base search writes");
    stdin.flush().expect("base search flushes");
    let before = read_json_line(&mut stdout);
    assert_eq!(before["result"]["structuredContent"]["total"], 1);

    fs::write(
        repository.path().join("main.rs"),
        b"fn newGraphSymbol() {}\n",
    )
    .expect("change graph fixture");
    writeln!(
        stdin,
        "{}",
        serde_json::json!({
            "jsonrpc":"2.0","id":2,"method":"tools/call",
            "params":{"name":"search_graph","arguments":{"query":"newGraphSymbol"}}
        })
    )
    .expect("refreshed search writes");
    stdin.flush().expect("refreshed search flushes");
    let after = read_json_line(&mut stdout);
    let payload = &after["result"]["structuredContent"];
    assert_eq!(payload["matches"][0]["symbol"], "newGraphSymbol");
    assert_eq!(payload["total"], 1);
    assert_ne!(
        payload["snapshot"],
        before["result"]["structuredContent"]["snapshot"]
    );

    drop(stdin);
    assert!(child.wait().expect("serve exits at EOF").success());
}

#[test]
fn configured_git_executable_supports_spaces_and_overrides_path() {
    let repository = TestDirectory::new("batched-git-bootstrap-repo");
    let wrapper = TestDirectory::new("batched-git-bootstrap-wrapper");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    for name in ["a.rs", "b.rs", "c.rs", "d.rs"] {
        fs::write(
            repository.path().join(name),
            format!("fn {}() {{}}\n", &name[..1]),
        )
        .expect("write source fixture");
    }
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let real_git = Command::new("sh")
        .args(["-c", "command -v git"])
        .output()
        .expect("locate git");
    assert!(real_git.status.success());
    let real_git = String::from_utf8(real_git.stdout)
        .expect("git path is UTF-8")
        .trim()
        .to_owned();
    let log = wrapper.path().join("git.log");
    let script = wrapper.path().join("chosen git");
    fs::write(
        &script,
        "#!/bin/sh\nprintf '%s\\n' \"$*\" >> \"$GIT_WRAPPER_LOG\"\nexec \"$REAL_GIT\" \"$@\"\n",
    )
    .expect("write git wrapper");
    let mut permissions = fs::metadata(&script).unwrap().permissions();
    permissions.set_mode(0o755);
    fs::set_permissions(&script, permissions).unwrap();
    fs::write(wrapper.path().join("git"), "#!/bin/sh\nexit 91\n").unwrap();
    fs::set_permissions(
        wrapper.path().join("git"),
        fs::Permissions::from_mode(0o755),
    )
    .unwrap();
    let path = format!(
        "{}:{}",
        wrapper.path().display(),
        std::env::var("PATH").unwrap_or_default()
    );

    let mut child = cli()
        .args(["serve", "--multi-repo"])
        .current_dir(repository.path())
        .env("PATH", path)
        .env("CGRX_GIT", &script)
        .env("REAL_GIT", real_git)
        .env("GIT_WRAPPER_LOG", &log)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("serve starts");
    writeln!(child.stdin.as_mut().unwrap(), "{}", serde_json::json!({
        "jsonrpc":"2.0","id":1,"method":"tools/call",
        "params":{"name":"status","arguments":{"repo":repository.path(),"paths_or_scope":["**"]}}
    })).unwrap();
    let output = child.wait_with_output().expect("serve exits at EOF");
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );

    let response: serde_json::Value = serde_json::from_slice(&output.stdout).unwrap();
    assert!(response.get("error").is_none(), "{response}");
    assert_ne!(response["result"]["isError"], true, "{response}");
    let trace = fs::read_to_string(log).expect("wrapper log exists");
    let cat_file_calls: Vec<_> = trace
        .lines()
        .filter(|line| line.starts_with("cat-file "))
        .collect();
    assert_eq!(cat_file_calls, ["cat-file --batch"]);
    assert!(trace.contains("rev-parse --show-toplevel"), "{trace}");
    assert!(trace.contains("status --porcelain=v2"), "{trace}");
}

#[test]
fn invalid_git_override_does_not_fall_back_to_path() {
    let repository = TestDirectory::new("invalid-git-override");
    git(repository.path(), &["init", "-q"]);
    let output = cli()
        .arg("serve")
        .current_dir(repository.path())
        .env("CGRX_GIT", repository.path().join("missing-executable"))
        .stdin(Stdio::null())
        .output()
        .unwrap();
    assert!(!output.status.success(), "invalid override must fail");
    assert!(
        String::from_utf8_lossy(&output.stderr).contains("No such file"),
        "{:?}",
        output
    );
}

#[test]
fn fixture_clock_collision_preserves_independent_lifetimes() {
    let first = TestDirectory::with_nonce("same-clock-tick", 42);
    let second = TestDirectory::with_nonce("same-clock-tick", 42);
    assert_ne!(
        first.path(),
        second.path(),
        "clock timestamps are not unique IDs"
    );
    fs::write(first.path().join("git"), "first wrapper").unwrap();
    fs::write(second.path().join("git"), "second wrapper").unwrap();
    drop(first);
    assert_eq!(
        fs::read_to_string(second.path().join("git")).unwrap(),
        "second wrapper"
    );
}

#[test]
fn fixture_clock_parallel_allocations_are_unique() {
    let directories: Vec<_> = std::thread::scope(|scope| {
        let handles: Vec<_> = (0..16)
            .map(|_| scope.spawn(|| TestDirectory::with_nonce("parallel-same-clock", 42)))
            .collect();
        handles.into_iter().map(|h| h.join().unwrap()).collect()
    });
    let paths: std::collections::BTreeSet<_> = directories.iter().map(|d| d.path()).collect();
    assert_eq!(paths.len(), 16);
}
