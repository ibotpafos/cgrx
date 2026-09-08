use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);

struct Fixture(PathBuf);
impl Fixture {
    fn new() -> Self {
        let path = std::env::temp_dir().join(format!(
            "cgrx-mcp-runtime-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(&path).unwrap();
        git(&path, &["init", "-q"]);
        git(&path, &["config", "user.name", "CGRX Test"]);
        git(&path, &["config", "user.email", "test@example.invalid"]);
        fs::write(
            path.join("main.rs"),
            "fn target() {}\nfn caller() { target(); }\n",
        )
        .unwrap();
        git(&path, &["add", "main.rs"]);
        git(&path, &["commit", "-qm", "fixture"]);
        let revision = git(&path, &["rev-parse", "HEAD"]);
        fs::write(path.join("runtime.ndjson"), serde_json::json!({
            "schema":"cgrx.runtime.v1", "repo_revision":revision, "environment":"test",
            "observed_at_unix_nanos":"42", "caller":{"function":"caller","file":"main.rs","line":2},
            "callee":{"function":"target","file":"main.rs","line":1}
        }).to_string()).unwrap();
        Self(path.canonicalize().unwrap())
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn git(root: &Path, args: &[&str]) -> String {
    let output = Command::new("git")
        .args(args)
        .current_dir(root)
        .output()
        .unwrap();
    assert!(output.status.success());
    String::from_utf8_lossy(&output.stdout).trim().to_owned()
}

#[test]
fn multi_repo_mcp_imports_and_traces_observed_calls_without_inline_payloads() {
    let fixture = Fixture::new();
    let repo = fixture.0.to_string_lossy();
    let requests = [
        serde_json::json!({"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}),
        serde_json::json!({"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}),
        serde_json::json!({"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"ingest_runtime_evidence","arguments":{"repo":repo,"input_path":"runtime.ndjson","format":"auto"}}}),
        serde_json::json!({"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"trace_path","arguments":{"repo":repo,"symbol":"target","path":"main.rs","direction":"callers","depth":1,"evidence":"observed"}}}),
    ];
    let input = requests
        .into_iter()
        .map(|request| request.to_string())
        .collect::<Vec<_>>()
        .join("\n")
        + "\n";
    let mut child = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["serve", "--multi-repo"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(input.as_bytes())
        .unwrap();
    let output = child.wait_with_output().unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let responses = String::from_utf8(output.stdout)
        .unwrap()
        .lines()
        .map(|line| serde_json::from_str::<serde_json::Value>(line).unwrap())
        .collect::<Vec<_>>();
    assert_eq!(
        responses[1]["result"]["tools"].as_array().unwrap().len(),
        16
    );
    let ingest = responses[2].pointer("/result/structuredContent").unwrap();
    assert_eq!(ingest["accepted"], 1);
    let trace = responses[3].pointer("/result/structuredContent").unwrap();
    assert_eq!(trace["nodes"][0]["symbol"], "caller");
    assert_eq!(trace["nodes"][0]["evidence"], "observed");
    let schema = &responses[1]["result"]["tools"];
    let ingest_schema = schema
        .as_array()
        .unwrap()
        .iter()
        .find(|tool| tool["name"] == "ingest_runtime_evidence")
        .unwrap();
    assert!(
        ingest_schema
            .pointer("/inputSchema/properties/input")
            .is_none()
    );
    assert!(
        ingest_schema["inputSchema"]["required"]
            .as_array()
            .unwrap()
            .contains(&serde_json::json!("repo"))
    );
}
