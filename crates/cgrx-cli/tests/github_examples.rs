use cgrx_capsule::Tokenizer;
use serde_json::{Value, json};
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

static DIRECTORY_SEQUENCE: AtomicU64 = AtomicU64::new(0);

struct Directory(PathBuf);
impl Directory {
    fn new() -> Self {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = std::env::temp_dir().join(format!(
            "cgrx-github-integration-{}-{nonce}-{}",
            std::process::id(),
            DIRECTORY_SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&path).unwrap();
        Self(path.canonicalize().unwrap())
    }
    fn repository(&self) -> PathBuf {
        let root = self.0.join("project");
        fs::create_dir(&root).unwrap();
        fs::write(root.join("Cargo.toml"),"[package]\nname='private-project-sentinel'\nversion='0.1.0'\nedition='2024'\n[dependencies]\nnotify='6.1.1'\n").unwrap();
        fs::write(root.join("main.rs"), "fn private_source_sentinel() {}\n").unwrap();
        git(&root, &["init", "-q"]);
        git(&root, &["add", "."]);
        git(&root, &["commit", "-qm", "fixture"]);
        root
    }
    fn bridge(&self, body: &str) -> PathBuf {
        let path = self.0.join("bridge");
        fs::write(&path, format!("#!/bin/sh\n{body}")).unwrap();
        fs::set_permissions(&path, fs::Permissions::from_mode(0o700)).unwrap();
        path
    }
}
impl Drop for Directory {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn git(root: &Path, args: &[&str]) {
    assert!(
        Command::new("git")
            .args([
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid"
            ])
            .args(args)
            .current_dir(root)
            .output()
            .unwrap()
            .status
            .success()
    );
}

fn quote(path: &Path) -> String {
    format!("'{}'", path.to_str().unwrap().replace('\'', "'\\''"))
}

fn fixture() -> Value {
    let candidates: Vec<_> = (0..5).map(|index| {
        let source = format!("fn cache_{index}() {{ let mutex = {index}; }}\n");
        let mut child = Command::new("git").args(["hash-object","--stdin"]).stdin(Stdio::piped()).stdout(Stdio::piped()).spawn().unwrap();
        child.stdin.take().unwrap().write_all(source.as_bytes()).unwrap();
        let sha = String::from_utf8(child.wait_with_output().unwrap().stdout).unwrap().trim().to_owned();
        json!({"repository":format!("public/example-{index}"),"path":"src/cache.rs","revision":"a".repeat(40),"blob_sha":sha,"source":source,"license":"MIT","dependencies":{"notify":"6.1"},"query_index":0,"search_rank":index+1})
    }).collect();
    json!({"protocol":"cgrx.github-examples.v1","candidates":candidates,"issues":[]})
}

fn configured(root: &Path, bridge: &Path) -> Command {
    let mut command = Command::new(env!("CARGO_BIN_EXE_cgrx"));
    command
        .current_dir(root)
        .env("CGRX_GITHUB_MCP_BRIDGE", bridge)
        .env("CGRX_MEMORY_EMBEDDINGS", "off")
        .env_remove("CGRX_GITHUB_MCP_TIMEOUT_MS")
        .env_remove("CGRX_RESPONSE_PROFILE");
    command
}

#[test]
fn cli_fetches_distinct_examples_without_sending_project_data_to_bridge() {
    let directory = Directory::new();
    let root = directory.repository();
    let capture = directory.0.join("request.json");
    let reply = directory.0.join("reply.json");
    fs::write(&reply, fixture().to_string()).unwrap();
    let bridge = directory.bridge(&format!(
        "cat >{}\ncat {}\n",
        quote(&capture),
        quote(&reply)
    ));
    let output = configured(&root, &bridge)
        .args([
            "examples",
            "--repo",
            root.to_str().unwrap(),
            "--task",
            "private-task-sentinel кэш",
            "--query",
            "cache mutex",
            "--limit",
            "4",
            "--json",
        ])
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let report: Value = serde_json::from_slice(&output.stdout).unwrap();
    assert_eq!(report["returned"], 4);
    assert_eq!(report["status"], "complete");
    assert_eq!(report["provider"], "github-mcp");
    assert_eq!(
        report["project_snapshot"]["context_scope"],
        "manifests_only"
    );
    assert!(
        !root.join(".git/cgrx/managed/.cgrx/CURRENT").exists(),
        "examples unexpectedly created a graph index"
    );
    assert_eq!(report["project"]["dependencies"]["notify"], "6.1.1");
    let sent = fs::read_to_string(capture).unwrap();
    for private in [
        "private-project-sentinel",
        "private_source_sentinel",
        "private-task-sentinel",
        root.to_str().unwrap(),
    ] {
        assert!(!sent.contains(private), "bridge received {private}");
    }
    let request: Value = serde_json::from_str(&sent).unwrap();
    assert_eq!(request["language"], "Rust");
    assert_eq!(request["queries"], json!(["cache mutex"]));
}

#[test]
fn mcp_advertises_and_routes_examples_with_bounded_nonduplicated_content_and_private_logs() {
    let directory = Directory::new();
    let root = directory.repository();
    let reply = directory.0.join("reply.json");
    let log = directory.0.join("usage.jsonl");
    fs::write(&reply, fixture().to_string()).unwrap();
    let bridge = directory.bridge(&format!("cat >/dev/null\ncat {}\n", quote(&reply)));
    let mut child = configured(&root, &bridge)
        .args([
            "serve",
            "--multi-repo",
            "--response-profile",
            "token-efficient",
        ])
        .env("CGRX_USAGE_LOG", &log)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .unwrap();
    let mut stdin = child.stdin.take().unwrap();
    let mut output = BufReader::new(child.stdout.take().unwrap());
    let requests = [
        json!({"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}),
        json!({"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}),
        json!({"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"find_examples","arguments":{"repo":root,"task":"private-task-sentinel кэш","queries":["cache mutex"],"limit":5,"budget":6000}}}),
    ];
    let mut responses = Vec::new();
    for request in requests {
        writeln!(stdin, "{request}").unwrap();
        stdin.flush().unwrap();
        let mut line = String::new();
        output.read_line(&mut line).unwrap();
        responses.push(serde_json::from_str::<Value>(&line).unwrap());
    }
    drop(stdin);
    assert!(child.wait().unwrap().success());
    let tool = responses[1]["result"]["tools"]
        .as_array()
        .unwrap()
        .iter()
        .find(|tool| tool["name"] == "find_examples")
        .unwrap();
    assert_eq!(tool["annotations"]["openWorldHint"], true);
    assert!(
        tool["inputSchema"]["required"]
            .as_array()
            .unwrap()
            .contains(&json!("repo"))
    );
    let result = &responses[2]["result"];
    assert!(
        result["structuredContent"].is_object(),
        "outputSchema requires structuredContent"
    );
    let report: Value =
        serde_json::from_str(result["content"][0]["text"].as_str().unwrap()).unwrap();
    assert_eq!(report["returned"], 5);
    assert!(
        !root.join(".git/cgrx/managed/.cgrx/CURRENT").exists(),
        "MCP examples unexpectedly created a graph index"
    );
    assert_eq!(report["repo"], root.to_str().unwrap());
    let tokens = Tokenizer::o200k_base().unwrap().count(&report.to_string());
    assert!(tokens <= 6000);
    let logged = fs::read_to_string(log).unwrap();
    for private in [
        "private-task-sentinel",
        "cache mutex",
        "cache_0",
        "source_hash",
        "github.com/public",
    ] {
        assert!(!logged.contains(private), "usage log contains {private}");
    }
}

#[test]
fn deadline_stops_bridge_instead_of_hanging_the_mcp_request() {
    let directory = Directory::new();
    let root = directory.repository();
    let bridge = directory.bridge("cat >/dev/null\nsleep 30\n");
    let started = Instant::now();
    let output = configured(&root, &bridge)
        .env("CGRX_GITHUB_MCP_TIMEOUT_MS", "150")
        .args([
            "examples",
            "--repo",
            root.to_str().unwrap(),
            "--task",
            "cache",
            "--query",
            "cache mutex",
            "--json",
        ])
        .output()
        .unwrap();
    assert!(!output.status.success());
    assert!(started.elapsed() < Duration::from_secs(10));
    assert!(String::from_utf8_lossy(&output.stderr).contains("deadline"));
}

#[test]
fn unconfigured_bridge_and_invalid_limits_fail_without_network_or_fabricated_examples() {
    let directory = Directory::new();
    let root = directory.repository();
    let bridge = directory.bridge("exit 99\n");
    let output = configured(&root, &bridge)
        .args([
            "examples",
            "--repo",
            root.to_str().unwrap(),
            "--task",
            "cache",
            "--query",
            "cache mutex",
            "--limit",
            "2",
            "--json",
        ])
        .output()
        .unwrap();
    assert!(!output.status.success());
    assert!(String::from_utf8_lossy(&output.stderr).contains("3–5"));
    let output = configured(&root, &bridge)
        .env_remove("CGRX_GITHUB_MCP_BRIDGE")
        .args([
            "examples",
            "--repo",
            root.to_str().unwrap(),
            "--task",
            "cache",
            "--query",
            "cache mutex",
            "--json",
        ])
        .output()
        .unwrap();
    assert!(!output.status.success());
    assert!(String::from_utf8_lossy(&output.stderr).contains("CGRX_GITHUB_MCP_BRIDGE"));
}
