use serde_json::{Value, json};
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Barrier, mpsc};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

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

const DEADLINE: Duration = Duration::from_secs(60);
const FRAME_LIMIT: usize = 64 * 1024;
const OUTPUT_LIMIT: usize = 1024 * 1024;

enum Event {
    Line(Vec<u8>),
    End,
    Error,
}

// Readers have bounded queues and byte budgets. The controlling thread never
// blocks on pipe I/O: both writes and reads have a shared request deadline.
struct Process {
    child: Child,
    stdin: Option<ChildStdin>,
    receiver: Option<mpsc::Receiver<Event>>,
    workers: Vec<JoinHandle<()>>,
}

impl Process {
    fn spawn(command: &mut Command) -> Self {
        #[cfg(unix)]
        {
            use std::os::unix::process::CommandExt;
            command.process_group(0);
        }
        let mut child = command
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            // Never leave an unread stderr pipe or expose arbitrary child text.
            .stderr(Stdio::null())
            .spawn()
            .expect("spawn lifecycle process");
        let stdin = child.stdin.take();
        let mut stdout = child.stdout.take().expect("stdout pipe");
        let (sender, receiver) = mpsc::sync_channel(2);
        let reader = thread::spawn(move || {
            let mut line = Vec::new();
            let mut bytes = [0; 4096];
            let mut total = 0;
            loop {
                let count = match stdout.read(&mut bytes) {
                    Ok(0) => {
                        let _ = sender.send(if line.is_empty() {
                            Event::End
                        } else {
                            Event::Error
                        });
                        return;
                    }
                    Ok(count) => count,
                    Err(_) => {
                        let _ = sender.send(Event::Error);
                        return;
                    }
                };
                total += count;
                if total > OUTPUT_LIMIT {
                    let _ = sender.send(Event::Error);
                    return;
                }
                for byte in &bytes[..count] {
                    if *byte == b'\n' {
                        if sender.send(Event::Line(std::mem::take(&mut line))).is_err() {
                            return;
                        }
                    } else {
                        line.push(*byte);
                        if line.len() > FRAME_LIMIT {
                            let _ = sender.send(Event::Error);
                            return;
                        }
                    }
                }
            }
        });
        Self {
            child,
            stdin,
            receiver: Some(receiver),
            workers: vec![reader],
        }
    }

    fn receive(&self, deadline: Instant) -> Result<Event, &'static str> {
        self.receiver
            .as_ref()
            .ok_or("receiver closed")?
            .recv_timeout(deadline.saturating_duration_since(Instant::now()))
            .map_err(|_| "response deadline or closed pipe")
    }

    fn write(&mut self, bytes: Vec<u8>, deadline: Instant) -> Result<(), &'static str> {
        if bytes.len() > FRAME_LIMIT {
            return Err("request budget");
        }
        let mut stdin = self.stdin.take().ok_or("stdin closed")?;
        let (sender, receiver) = mpsc::sync_channel(1);
        self.workers.push(thread::spawn(move || {
            let result = stdin.write_all(&bytes).and_then(|()| stdin.flush());
            let _ = sender.send((stdin, result.is_ok()));
        }));
        let (stdin, ok) = receiver
            .recv_timeout(deadline.saturating_duration_since(Instant::now()))
            .map_err(|_| "write deadline")?;
        self.stdin = Some(stdin);
        if ok { Ok(()) } else { Err("write failed") }
    }

    fn wait_exit(&mut self, deadline: Instant) -> Result<(), &'static str> {
        loop {
            if let Some(status) = self.child.try_wait().map_err(|_| "wait failed")? {
                return if status.success() {
                    Ok(())
                } else {
                    Err("process failed")
                };
            }
            if Instant::now() >= deadline {
                return Err("exit deadline");
            }
            thread::sleep(Duration::from_millis(5));
        }
    }

    fn finish(&mut self, deadline: Instant) -> Result<(), &'static str> {
        self.stdin.take();
        match self.receive(deadline)? {
            Event::End => self.wait_exit(deadline),
            _ => Err("unexpected trailing output"),
        }
    }
}

impl Drop for Process {
    fn drop(&mut self) {
        self.stdin.take();
        self.receiver.take(); // release reader blocked on a full queue
        #[cfg(unix)]
        {
            unsafe extern "C" {
                fn kill(pid: i32, signal: i32) -> i32;
            }
            // Only the process group created above, never the test runner's group.
            unsafe {
                kill(-(self.child.id() as i32), 9);
            }
        }
        let _ = self.child.kill();
        let deadline = Instant::now() + Duration::from_secs(2);
        let mut reaped = false;
        while Instant::now() < deadline {
            reaped = self.child.try_wait().ok().flatten().is_some();
            if reaped && self.workers.iter().all(JoinHandle::is_finished) {
                break;
            }
            thread::sleep(Duration::from_millis(5));
        }
        let finished = self.workers.iter().all(JoinHandle::is_finished);
        for worker in self.workers.drain(..) {
            if worker.is_finished() {
                let _ = worker.join();
            }
        }
        assert!(
            thread::panicking() || (reaped && finished),
            "bounded process cleanup incomplete"
        );
    }
}

fn git_output(root: &Path, args: &[&str]) -> String {
    let mut process = Process::spawn(Command::new("git").args(args).current_dir(root));
    process.stdin.take();
    let deadline = Instant::now() + DEADLINE;
    let mut result = Vec::new();
    loop {
        match process.receive(deadline).expect("bounded git response") {
            Event::Line(line) => {
                result.extend(line);
                result.push(b'\n');
            }
            Event::End => break,
            Event::Error => panic!("git output budget or I/O failure"),
        }
    }
    process.wait_exit(deadline).expect("bounded git exit");
    String::from_utf8(result).expect("Git UTF-8 output")
}

fn git(root: &Path, args: &[&str]) {
    git_output(root, args);
}

struct Mcp {
    process: Process,
    next_id: u64,
}

impl Mcp {
    fn start(cwd: &Path) -> Self {
        let mut mcp = Self {
            process: Process::spawn(
                Command::new(env!("CARGO_BIN_EXE_cgrx"))
                    .args(["serve", "--multi-repo"])
                    .current_dir(cwd),
            ),
            next_id: 1,
        };
        let initialized = mcp.request(
            "initialize",
            json!({
            "protocolVersion":"2025-06-18", "capabilities":{},
            "clientInfo":{"name":"lifecycle-test","version":"1"}}),
        );
        assert_eq!(initialized["result"]["serverInfo"]["name"], "cgrx");
        assert_eq!(initialized["result"]["protocolVersion"], "2025-06-18");
        mcp.process
            .write(
                b"{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}\n".to_vec(),
                Instant::now() + DEADLINE,
            )
            .expect("initialized notification");
        mcp
    }

    fn try_request(
        &mut self,
        method: &str,
        params: Value,
        timeout: Duration,
    ) -> Result<Value, &'static str> {
        let id = self.next_id;
        self.next_id += 1;
        let deadline = Instant::now() + timeout;
        let input = format!(
            "{}\n",
            json!({"jsonrpc":"2.0","id":id,"method":method,"params":params})
        );
        self.process.write(input.into_bytes(), deadline)?;
        let line = match self.process.receive(deadline)? {
            Event::Line(line) => line,
            _ => return Err("missing/budgeted response"),
        };
        let response: Value = serde_json::from_slice(&line).map_err(|_| "invalid JSON response")?;
        if response["jsonrpc"] != "2.0"
            || response["id"].as_u64() != Some(id)
            || response.get("result").is_some() == response.get("error").is_some()
        {
            return Err("invalid RPC envelope");
        }
        Ok(response)
    }

    fn request(&mut self, method: &str, params: Value) -> Value {
        self.try_request(method, params, DEADLINE)
            .expect("bounded JSON-RPC request")
    }

    fn status(&mut self, repo: &Path) -> Value {
        self.request(
            "tools/call",
            json!({"name":"status","arguments":{"repo":repo,"paths_or_scope":[]}}),
        )
    }
}

fn snapshot(response: &Value) -> Value {
    assert_eq!(response["jsonrpc"], "2.0");
    assert!(response.get("error").is_none());
    let result = &response["result"];
    assert!(result.is_object() && result.get("isError").is_none_or(|v| v == false));
    let status = &result["structuredContent"];
    assert!(matches!(
        status["freshness"].as_str(),
        Some("WATCHED" | "PINNED")
    ));
    assert!(
        status["repo"]
            .as_str()
            .is_some_and(|p| Path::new(p).is_absolute())
    );
    let snapshot = &status["snapshot"];
    let revision = snapshot["repo_revision"].as_str().expect("revision string");
    assert!(matches!(revision.len(), 40 | 64) && revision.bytes().all(|b| b.is_ascii_hexdigit()));
    assert!(snapshot["graph_generation"].as_u64().is_some());
    snapshot.clone()
}

fn status_outcome(response: &Value, repo: &Path, revision: &str) -> bool {
    assert_eq!(response["jsonrpc"], "2.0");
    if let Some(error) = response.get("error") {
        assert!(response.get("result").is_none() && error["code"].as_i64().is_some());
        assert!(
            matches!(
                error["data"]["code"].as_str(),
                Some("store_busy" | "cgrx.store_busy")
            ),
            "only typed writer contention is retryable"
        );
        false
    } else {
        assert_eq!(
            response["result"]["structuredContent"]["repo"],
            repo.to_string_lossy().as_ref()
        );
        assert_eq!(snapshot(response)["repo_revision"], revision);
        true
    }
}

fn one_shot_status(repo: &Path) -> Value {
    let mut mcp = Mcp::start(repo);
    let response = mcp.status(repo);
    mcp.process
        .finish(Instant::now() + DEADLINE)
        .expect("bounded MCP exit");
    response
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

    let expected_revision = git_output(fixture.path(), &["rev-parse", "HEAD"]);
    for thread in threads {
        let response = thread.join().expect("bounded status thread");
        assert!(
            !response
                .to_string()
                .contains("generation is immutable and already exists")
        );
        status_outcome(&response, fixture.path(), expected_revision.trim());
    }

    let settled = one_shot_status(fixture.path());
    assert!(status_outcome(
        &settled,
        fixture.path(),
        expected_revision.trim()
    ));
}

#[test]
fn malformed_lifecycle_snapshots_are_rejected() {
    for response in [
        json!({"jsonrpc":"2.0","id":2,"result":{}}),
        json!({"jsonrpc":"2.0","id":2,"result":{"isError":true,"structuredContent":{"snapshot":{}}}}),
        json!({"jsonrpc":"wrong","id":2,"result":{"structuredContent":{"snapshot":{}}}}),
    ] {
        assert!(std::panic::catch_unwind(|| snapshot(&response)).is_err());
    }
}

#[test]
fn every_contender_requires_a_current_typed_outcome() {
    let repo = Path::new("/fixture");
    let revision = "a".repeat(40);
    let valid = json!({"jsonrpc":"2.0","id":2,"result":{"structuredContent":{
        "repo":"/fixture","freshness":"WATCHED",
        "snapshot":{"repo_revision":revision,"graph_generation":7}}}});
    assert!(status_outcome(&valid, repo, &revision));
    let busy =
        json!({"jsonrpc":"2.0","id":2,"error":{"code":-32602,"data":{"code":"cgrx.store_busy"}}});
    assert!(!status_outcome(&busy, repo, &revision));
    let mut stale = valid.clone();
    stale["result"]["structuredContent"]["snapshot"]["repo_revision"] = json!("b".repeat(40));
    let mut wrong_repo = valid.clone();
    wrong_repo["result"]["structuredContent"]["repo"] = json!("/other");
    let mut tool_error = valid.clone();
    tool_error["result"]["isError"] = json!(true);
    let mut unknown = busy.clone();
    unknown["error"]["data"]["code"] = json!("cgrx.repository_unavailable");
    for bad in [
        stale,
        wrong_repo,
        tool_error,
        unknown,
        json!({"jsonrpc":"2.0","id":2,"result":{}}),
    ] {
        assert!(std::panic::catch_unwind(|| status_outcome(&bad, repo, &revision)).is_err());
    }
}

#[cfg(unix)]
#[test]
fn subprocess_read_write_deadlines_reap_the_process() {
    for params in [json!({}), json!({"body":"x".repeat(FRAME_LIMIT - 500)})] {
        let started = Instant::now();
        let mut mcp = Mcp {
            process: Process::spawn(Command::new("/bin/sh").args(["-c", "sleep 30 & wait"])),
            next_id: 1,
        };
        assert!(
            mcp.try_request("mock", params, Duration::from_millis(50))
                .is_err()
        );
        let pid = mcp.process.child.id();
        drop(mcp);
        assert!(started.elapsed() < Duration::from_secs(3));
        unsafe extern "C" {
            fn kill(pid: i32, signal: i32) -> i32;
        }
        assert_eq!(unsafe { kill(pid as i32, 0) }, -1, "mock parent was reaped");
    }
}

#[cfg(unix)]
#[test]
fn oversized_frames_wrong_ids_and_stderr_are_bounded() {
    for script in [
        "head -c 70000 /dev/zero",
        "printf '%s\\n' '{\"jsonrpc\":\"2.0\",\"id\":9,\"result\":{}}'",
    ] {
        let mut mcp = Mcp {
            process: Process::spawn(Command::new("/bin/sh").args(["-c", script])),
            next_id: 1,
        };
        assert!(
            mcp.try_request("mock", json!({}), Duration::from_secs(2))
                .is_err()
        );
    }
    let mut mcp = Mcp {
        process: Process::spawn(Command::new("/bin/sh").args(["-c",
            "head -c 2000000 /dev/zero >&2; printf '%s\\n' '{\"jsonrpc\":\"2.0\",\"id\":1,\"result\":{}}'"])),
        next_id: 1,
    };
    assert!(
        mcp.try_request("mock", json!({}), Duration::from_secs(2))
            .is_ok()
    );
    mcp.process
        .finish(Instant::now() + Duration::from_secs(2))
        .unwrap();
}
