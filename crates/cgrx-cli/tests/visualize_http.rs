use std::fs;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{Shutdown, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);

struct TestDirectory(PathBuf);

impl TestDirectory {
    fn new(label: &str) -> Self {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock after epoch")
            .as_nanos();
        let sequence = SEQUENCE.fetch_add(1, Ordering::Relaxed);
        let path = std::env::temp_dir().join(format!(
            "cgrx-{label}-{}-{nonce}-{sequence}",
            std::process::id()
        ));
        fs::create_dir_all(&path).expect("create test directory");
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

fn start_server() -> (TestDirectory, Server) {
    let repository = TestDirectory::new("visualizer-repository");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("main.rs"),
        "fn target() {}\nfn selected() { target(); }\n",
    )
    .expect("write source");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let mut child = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["visualize", "--root"])
        .arg(repository.path())
        .args(["--port", "0", "--no-open"])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("start visualizer");
    let mut stdout = BufReader::new(child.stdout.take().expect("stdout"));
    let mut line = String::new();
    stdout.read_line(&mut line).expect("startup line");
    let url = line
        .trim()
        .strip_prefix("visualizer_url=")
        .expect("structured startup URL");
    let (origin, token) = url
        .split_once("/#token=")
        .expect("capability token remains in URL fragment");
    assert!(origin.starts_with("http://127.0.0.1:"), "{origin}");
    assert_eq!(token.len(), 64);
    (
        repository,
        Server {
            child,
            address: origin.trim_start_matches("http://").to_owned(),
            token: token.to_owned(),
        },
    )
}

fn request(server: &Server, method: &str, path: &str, authorized: bool) -> String {
    let mut stream = TcpStream::connect(&server.address).expect("connect visualizer");
    stream
        .set_read_timeout(Some(Duration::from_secs(3)))
        .expect("read timeout");
    let capability = if authorized {
        format!("X-CGRX-Token: {}\r\n", server.token)
    } else {
        String::new()
    };
    write!(
        stream,
        "{method} {path} HTTP/1.1\r\nHost: {}\r\n{capability}Connection: close\r\n\r\n",
        server.address
    )
    .expect("write request");
    let mut response = String::new();
    stream.read_to_string(&mut response).expect("read response");
    response
}

#[test]
fn starts_on_loopback_and_requires_capability() {
    let (_repository, server) = start_server();

    let index = request(&server, "GET", "/", false);
    assert!(index.starts_with("HTTP/1.1 200"), "{index}");
    assert!(index.contains("Content-Security-Policy:"), "{index}");
    assert!(index.contains("Cache-Control: no-store"), "{index}");

    let unauthorized = request(&server, "GET", "/api/status", false);
    assert!(unauthorized.starts_with("HTTP/1.1 401"), "{unauthorized}");

    let authorized = request(&server, "GET", "/api/status", true);
    assert!(authorized.starts_with("HTTP/1.1 200"), "{authorized}");
    assert!(authorized.contains("\"snapshot\""), "{authorized}");

    let post = request(&server, "POST", "/api/status", true);
    assert!(post.starts_with("HTTP/1.1 405"), "{post}");
}

#[test]
fn read_only_api_routes_share_the_current_snapshot() {
    let (_repository, server) = start_server();
    let paths = [
        "/api/search?q=selected&scope=**&limit=8",
        "/api/graph?symbol=selected&path=main.rs&direction=both&depth=1&node_limit=80&edge_limit=160",
        "/api/refactors?scope=**&language=rust&min_score=760&limit=8",
        "/api/snippet?symbol=selected&path=main.rs",
    ];
    let mut snapshots = Vec::new();
    for path in paths {
        let response = request(&server, "GET", path, true);
        assert!(response.starts_with("HTTP/1.1 200"), "{path}: {response}");
        let body = response.split_once("\r\n\r\n").expect("HTTP body").1;
        let value: serde_json::Value = serde_json::from_str(body).expect("JSON response");
        snapshots.push(value["snapshot"].clone());
    }
    assert!(snapshots.windows(2).all(|pair| pair[0] == pair[1]));
}

#[test]
fn http_boundary_rejects_malformed_and_traversal_requests() {
    let (_repository, server) = start_server();

    let malformed = request(&server, "GET", "/api/search?q=%ZZ", true);
    assert!(malformed.starts_with("HTTP/1.1 400"), "{malformed}");
    assert!(malformed.contains("cgrx.invalid_query"), "{malformed}");

    let traversal = request(
        &server,
        "GET",
        "/api/snippet?symbol=selected&path=../main.rs",
        true,
    );
    assert!(traversal.starts_with("HTTP/1.1 400"), "{traversal}");
    assert!(traversal.contains("cgrx.invalid_path"), "{traversal}");

    let head = request(&server, "HEAD", "/api/status", true);
    assert!(head.starts_with("HTTP/1.1 200"), "{head}");
    assert_eq!(head.split_once("\r\n\r\n").expect("HEAD response").1, "");

    let mut stream = TcpStream::connect(&server.address).expect("connect visualizer");
    write!(stream, "GET /{} HTTP/1.1\r\n\r\n", "x".repeat(9_000)).expect("write oversized request");
    stream
        .shutdown(Shutdown::Write)
        .expect("finish oversized request");
    let mut oversized = String::new();
    let _ = stream.read_to_string(&mut oversized);
    assert!(oversized.starts_with("HTTP/1.1 413"), "{oversized}");
}
