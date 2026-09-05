use serde_json::{Value, json};
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Barrier};
use std::time::{SystemTime, UNIX_EPOCH};

static FIXTURE_SEQUENCE: AtomicU64 = AtomicU64::new(0);

struct Fixture(PathBuf);

impl Fixture {
    fn new() -> Self {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock after epoch")
            .as_nanos();
        let mut sequence = FIXTURE_SEQUENCE.fetch_add(1, Ordering::Relaxed);
        let path = loop {
            let candidate = std::env::temp_dir().join(format!(
                "cgrx-cli-lifecycle-{}-{nonce}-{sequence}",
                std::process::id()
            ));
            match fs::create_dir(&candidate) {
                Ok(()) => break candidate,
                Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
                    sequence = sequence.checked_add(1).expect("fixture sequence available");
                }
                Err(error) => panic!("create fixture root: {error}"),
            }
        };
        git(&path, &["init", "-q"]);
        git(&path, &["config", "user.name", "CGRX Test"]);
        git(&path, &["config", "user.email", "test@example.invalid"]);
        git(&path, &["branch", "-m", "alpha"]);
        fs::write(path.join("main.rs"), "pub fn original_target() {}\n")
            .expect("write original source");
        git(&path, &["add", "main.rs"]);
        git(&path, &["commit", "-qm", "original"]);
        Self(path.canonicalize().expect("canonical fixture root"))
    }

    fn path(&self) -> &Path {
        &self.0
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn git(root: &Path, args: &[&str]) {
    let output = Command::new("git")
        .args(args)
        .current_dir(root)
        .output()
        .expect("git executes");
    assert!(
        output.status.success(),
        "git {args:?}: {}",
        String::from_utf8_lossy(&output.stderr)
    );
}

struct Mcp {
    child: Child,
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
    next_id: u64,
}

impl Mcp {
    fn start(cwd: &Path) -> Self {
        let mut child = Command::new(env!("CARGO_BIN_EXE_cgrx"))
            .args(["serve", "--multi-repo"])
            .current_dir(cwd)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .expect("start cgrx MCP");
        let stdin = child.stdin.take().expect("piped stdin");
        let stdout = BufReader::new(child.stdout.take().expect("piped stdout"));
        let mut mcp = Self {
            child,
            stdin,
            stdout,
            next_id: 1,
        };
        let initialized = mcp.request(
            "initialize",
            json!({
                "protocolVersion":"2025-06-18",
                "capabilities":{},
                "clientInfo":{"name":"lifecycle-test","version":"1"}
            }),
        );
        assert_eq!(initialized["result"]["serverInfo"]["name"], "cgrx");
        mcp
    }

    fn request(&mut self, method: &str, params: Value) -> Value {
        let id = self.next_id;
        self.next_id += 1;
        writeln!(
            self.stdin,
            "{}",
            json!({"jsonrpc":"2.0","id":id,"method":method,"params":params})
        )
        .expect("write request");
        self.stdin.flush().expect("flush request");
        let mut line = String::new();
        self.stdout.read_line(&mut line).expect("read response");
        assert!(!line.is_empty(), "server exited before response");
        serde_json::from_str(&line).expect("JSON-RPC response")
    }

    fn status(&mut self, repo: &Path) -> Value {
        self.request(
            "tools/call",
            json!({"name":"status","arguments":{"repo":repo,"paths_or_scope":[]}}),
        )
    }
}

impl Drop for Mcp {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

fn snapshot(response: &Value) -> Value {
    assert!(response.get("error").is_none(), "{response}");
    response["result"]["structuredContent"]["snapshot"].clone()
}

fn one_shot_status(repo: &Path) -> Value {
    let frames = [
        json!({"jsonrpc":"2.0","id":1,"method":"initialize","params":{
            "protocolVersion":"2025-06-18","capabilities":{},
            "clientInfo":{"name":"lifecycle-one-shot","version":"1"}}}),
        json!({"jsonrpc":"2.0","method":"notifications/initialized"}),
        json!({"jsonrpc":"2.0","id":2,"method":"tools/call","params":{
            "name":"status","arguments":{"repo":repo,"paths_or_scope":[]}}}),
    ];
    let input = frames
        .iter()
        .map(Value::to_string)
        .collect::<Vec<_>>()
        .join("\n")
        + "\n";
    let mut child = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["serve", "--multi-repo"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("start one-shot MCP");
    child
        .stdin
        .take()
        .expect("piped stdin")
        .write_all(input.as_bytes())
        .expect("write frames");
    let output = child.wait_with_output().expect("wait for one-shot MCP");
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    output
        .stdout
        .split(|byte| *byte == b'\n')
        .filter(|line| !line.is_empty())
        .map(|line| serde_json::from_slice::<Value>(line).expect("JSON-RPC line"))
        .find(|response| response["id"] == 2)
        .expect("status response")
}

#[test]
fn actual_binary_survives_branch_rename_switch_file_rename_and_restart() {
    let fixture = Fixture::new();
    let mut mcp = Mcp::start(fixture.path());
    let original = snapshot(&mcp.status(fixture.path()));

    git(fixture.path(), &["branch", "-m", "renamed"]);
    assert_eq!(snapshot(&mcp.status(fixture.path())), original);

    git(fixture.path(), &["branch", "previous"]);
    git(fixture.path(), &["mv", "main.rs", "renamed.rs"]);
    fs::write(
        fixture.path().join("renamed.rs"),
        "pub fn renamed_target() {}\n",
    )
    .expect("write renamed source");
    git(fixture.path(), &["add", "."]);
    git(
        fixture.path(),
        &["commit", "-qm", "rename source and target"],
    );
    let renamed = snapshot(&mcp.status(fixture.path()));
    assert_ne!(renamed["repo_revision"], original["repo_revision"]);

    git(fixture.path(), &["checkout", "-q", "previous"]);
    assert_eq!(snapshot(&mcp.status(fixture.path())), original);
    drop(mcp);

    let restarted = one_shot_status(fixture.path());
    assert_eq!(snapshot(&restarted), original);
}

#[test]
fn concurrent_fresh_processes_never_report_immutable_generation_collision() {
    let fixture = Fixture::new();
    snapshot(&one_shot_status(fixture.path()));
    fs::write(fixture.path().join("main.rs"), "pub fn next_target() {}\n")
        .expect("write next source");
    git(fixture.path(), &["add", "main.rs"]);
    git(fixture.path(), &["commit", "-qm", "next"]);

    let root = Arc::new(fixture.path().to_path_buf());
    let barrier = Arc::new(Barrier::new(7));
    let threads: Vec<_> = (0..6)
        .map(|_| {
            let root = Arc::clone(&root);
            let barrier = Arc::clone(&barrier);
            std::thread::spawn(move || {
                barrier.wait();
                one_shot_status(&root)
            })
        })
        .collect();
    barrier.wait();

    for thread in threads {
        let response = thread.join().expect("status thread");
        let rendered = response.to_string();
        assert!(!rendered.contains("generation is immutable and already exists"));
        if response.get("error").is_some() {
            assert!(
                matches!(
                    response["error"]["data"]["code"].as_str(),
                    Some("store_busy" | "cgrx.store_busy")
                ),
                "only a typed retryable writer collision is accepted: {response}"
            );
        }
    }

    let settled = one_shot_status(fixture.path());
    assert!(settled.get("error").is_none(), "{settled}");
    assert_eq!(
        settled["result"]["structuredContent"]["snapshot"]["repo_revision"],
        String::from_utf8(
            Command::new("git")
                .args(["rev-parse", "HEAD"])
                .current_dir(fixture.path())
                .output()
                .unwrap()
                .stdout
        )
        .unwrap()
        .trim()
    );
}
