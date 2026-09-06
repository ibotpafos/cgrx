use std::fs;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);

struct TestDirectory(PathBuf);

impl TestDirectory {
    fn new() -> Self {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock after epoch")
            .as_nanos();
        let sequence = SEQUENCE.fetch_add(1, Ordering::Relaxed);
        let path = std::env::temp_dir().join(format!(
            "cgrx-visualizer-refresh-{}-{nonce}-{sequence}",
            std::process::id()
        ));
        fs::create_dir_all(&path).expect("create test directory");
        Self(path)
    }
}

impl Drop for TestDirectory {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

struct Server {
    child: Child,
    address: String,
    token: String,
}

impl Drop for Server {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
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

fn request(server: &Server, path: &str) -> serde_json::Value {
    let mut stream = TcpStream::connect(&server.address).expect("connect visualizer");
    stream
        .set_read_timeout(Some(Duration::from_secs(3)))
        .expect("read timeout");
    write!(
        stream,
        "GET {path} HTTP/1.1\r\nHost: {}\r\nX-CGRX-Token: {}\r\nConnection: close\r\n\r\n",
        server.address, server.token
    )
    .expect("write request");
    let mut response = String::new();
    stream.read_to_string(&mut response).expect("read response");
    assert!(response.starts_with("HTTP/1.1 200"), "{response}");
    serde_json::from_str(response.split_once("\r\n\r\n").expect("HTTP body").1)
        .expect("JSON response")
}

#[test]
fn source_change_refreshes_snapshot_and_strategy_identity_without_restart() {
    let repository = TestDirectory::new();
    git(&repository.0, &["init", "-q"]);
    git(
        &repository.0,
        &["config", "user.email", "test@example.invalid"],
    );
    git(&repository.0, &["config", "user.name", "CGRX Test"]);
    let path = repository.0.join("service.ts");
    fs::write(
        &path,
        "function save(value: number) {}\nfunction first(input: number) { const prepared = input + 1; save(prepared); return prepared; }\nfunction second(value: number) { const output = value + 9; save(output); return output; }\n",
    )
    .expect("write fixture");
    git(&repository.0, &["add", "."]);
    git(&repository.0, &["commit", "-qm", "fixture"]);

    let mut child = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["visualize", "--root"])
        .arg(&repository.0)
        .args(["--port", "0", "--no-open"])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("start visualizer");
    let mut line = String::new();
    BufReader::new(child.stdout.take().expect("stdout"))
        .read_line(&mut line)
        .expect("startup line");
    let url = line
        .trim()
        .strip_prefix("visualizer_url=http://")
        .expect("startup URL");
    let (address, token) = url.split_once("/#token=").expect("capability URL fragment");
    let server = Server {
        child,
        address: address.to_owned(),
        token: token.to_owned(),
    };

    let first = request(
        &server,
        "/api/refactors?scope=service.ts&language=typescript&min_score=760&limit=8",
    );
    let first_id = first["candidates"][0]["strategies"][0]["strategy_id"]
        .as_str()
        .expect("first strategy")
        .to_owned();
    let first_digest = first["snapshot"]["working_tree_digest"].clone();
    fs::OpenOptions::new()
        .append(true)
        .open(&path)
        .expect("open fixture")
        .write_all(b"// refresh snapshot\n")
        .expect("edit fixture");

    let deadline = Instant::now() + Duration::from_secs(5);
    let refreshed_status = loop {
        let status = request(&server, "/api/status");
        if status["snapshot"]["working_tree_digest"] != first_digest {
            break status;
        }
        assert!(Instant::now() < deadline, "refresh deadline");
        std::thread::sleep(Duration::from_millis(25));
    };
    assert_ne!(
        refreshed_status["snapshot"]["working_tree_digest"],
        first_digest
    );
    let refreshed = request(
        &server,
        "/api/refactors?scope=service.ts&language=typescript&min_score=760&limit=8",
    );
    let refreshed_id = refreshed["candidates"][0]["strategies"][0]["strategy_id"]
        .as_str()
        .expect("refreshed strategy");
    assert_ne!(first_id, refreshed_id);

    let refreshed_digest = refreshed["snapshot"]["working_tree_digest"].clone();
    let extra = repository.0.join("extra.ts");
    fs::write(&extra, "export function extra() { return 1; }\n").expect("add source");
    let added = request(&server, "/api/status");
    assert_ne!(
        added["snapshot"]["working_tree_digest"], refreshed_digest,
        "adding a supported source refreshes the graph"
    );
    fs::remove_file(&extra).expect("delete added source");
    let deleted = request(&server, "/api/status");
    assert_eq!(
        deleted["snapshot"]["working_tree_digest"], refreshed_digest,
        "deleting the added source restores the prior snapshot"
    );

    let renamed_path = repository.0.join("renamed.ts");
    fs::rename(&path, &renamed_path).expect("rename source");
    let renamed = request(&server, "/api/status");
    assert_ne!(
        renamed["snapshot"]["working_tree_digest"], refreshed_digest,
        "renaming a supported source refreshes the graph"
    );
    let renamed_refactors = request(
        &server,
        "/api/refactors?scope=**&language=typescript&min_score=760&limit=8",
    );
    assert_eq!(
        renamed_refactors["candidates"][0]["left"]["path"],
        "renamed.ts"
    );
}
