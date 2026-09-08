use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};

fn frame(value: serde_json::Value) -> Vec<u8> {
    let body = value.to_string();
    format!("Content-Length: {}\r\n\r\n{body}", body.len()).into_bytes()
}

fn parse_frames(mut bytes: &[u8]) -> Vec<serde_json::Value> {
    let mut messages = Vec::new();
    while !bytes.is_empty() {
        let boundary = bytes
            .windows(4)
            .position(|window| window == b"\r\n\r\n")
            .expect("response has an LSP header boundary");
        let header = std::str::from_utf8(&bytes[..boundary]).expect("header is UTF-8");
        let length: usize = header
            .strip_prefix("Content-Length: ")
            .expect("response has Content-Length")
            .parse()
            .expect("Content-Length is numeric");
        let body_start = boundary + 4;
        let body_end = body_start + length;
        messages
            .push(serde_json::from_slice(&bytes[body_start..body_end]).expect("response is JSON"));
        bytes = &bytes[body_end..];
    }
    messages
}

struct TestRepository(PathBuf);

impl TestRepository {
    fn new() -> Self {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock after epoch")
            .as_nanos();
        let path = std::env::temp_dir().join(format!("cgrx-lsp-{}-{nonce}", std::process::id()));
        std::fs::create_dir(&path).expect("create test repository");
        Self(path)
    }

    fn path(&self) -> &Path {
        &self.0
    }

    fn git(&self, args: &[&str]) {
        assert!(
            Command::new("git")
                .args(args)
                .current_dir(self.path())
                .status()
                .expect("git executes")
                .success()
        );
    }
}

impl Drop for TestRepository {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

#[test]
fn stdio_transport_accepts_content_length_and_returns_jsonrpc_response() {
    let request = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 7,
        "method": "initialize",
        "params": {"capabilities": {}}
    })
    .to_string();
    let mut child = Command::new(env!("CARGO_BIN_EXE_cgrx-lsp"))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("cgrx-lsp starts");
    child
        .stdin
        .take()
        .expect("stdin is piped")
        .write_all(format!("Content-Length: {}\r\n\r\n{request}", request.len()).as_bytes())
        .expect("request writes");

    let output = child.wait_with_output().expect("cgrx-lsp exits at EOF");
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(
        output.stderr.is_empty(),
        "valid LSP framing must not emit parser errors: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    let response = parse_frames(&output.stdout).remove(0);
    assert_eq!(response["jsonrpc"], "2.0");
    assert_eq!(response["id"], 7);
    assert_eq!(response["result"]["serverInfo"]["name"], "cgrx-lsp");
    assert_eq!(
        response["result"]["capabilities"]["positionEncoding"],
        "utf-16"
    );
    assert_eq!(
        response["result"]["capabilities"]["definitionProvider"],
        true
    );
    assert_eq!(
        response["result"]["capabilities"]["referencesProvider"],
        true
    );
}

#[test]
fn stdio_definition_uses_the_indexed_repository_graph() {
    let repository = TestRepository::new();
    repository.git(&["init", "-q"]);
    repository.git(&["config", "user.email", "test@example.invalid"]);
    repository.git(&["config", "user.name", "CGRX Test"]);
    std::fs::write(repository.path().join("lib.rs"), "pub fn target() {}\n")
        .expect("write definition");
    let main_text = "fn main() { target(); }\n";
    std::fs::write(repository.path().join("main.rs"), main_text).expect("write caller");
    repository.git(&["add", "."]);
    repository.git(&["commit", "-qm", "fixture"]);
    let root = std::fs::canonicalize(repository.path()).expect("canonical repository path");
    let main_uri = format!("file://{}", root.join("main.rs").display());
    let definition_uri = format!("file://{}", root.join("lib.rs").display());

    let mut input = Vec::new();
    input.extend(frame(serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {"rootUri": format!("file://{}", root.display()), "capabilities": {}}
    })));
    input.extend(frame(serde_json::json!({
        "jsonrpc": "2.0",
        "method": "initialized",
        "params": {}
    })));
    input.extend(frame(serde_json::json!({
        "jsonrpc": "2.0",
        "method": "textDocument/didOpen",
        "params": {"textDocument": {
            "uri": main_uri,
            "languageId": "rust",
            "version": 1,
            "text": main_text
        }}
    })));
    input.extend(frame(serde_json::json!({
        "jsonrpc": "2.0",
        "id": 2,
        "method": "textDocument/definition",
        "params": {
            "textDocument": {"uri": main_uri},
            "position": {"line": 0, "character": 12}
        }
    })));

    let mut child = Command::new(env!("CARGO_BIN_EXE_cgrx-lsp"))
        .arg("--root")
        .arg(&root)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("cgrx-lsp starts");
    child
        .stdin
        .take()
        .expect("stdin is piped")
        .write_all(&input)
        .expect("requests write");
    let output = child.wait_with_output().expect("cgrx-lsp exits at EOF");
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let responses = parse_frames(&output.stdout);
    let definition = responses
        .iter()
        .find(|response| response["id"] == 2)
        .expect("definition response exists");
    let locations = definition["result"]
        .as_array()
        .expect("definition is an array");
    assert!(locations.iter().any(|location| {
        location["uri"] == definition_uri
            && location["range"]["start"]["line"] == 0
            && location["range"]["start"]["character"] == 7
    }));
}
