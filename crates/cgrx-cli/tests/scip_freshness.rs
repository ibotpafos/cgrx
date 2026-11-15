use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdout, Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};

use cgrx_cli::Runtime;
use serde_json::{Value, json};

const SOURCE: &str = include_str!("fixtures/compiler-scip-receiver/src/lib.rs");
const SCIP_A: &[u8] = include_bytes!("fixtures/compiler-scip-receiver/receiver-a.scip");
const SCIP_B: &[u8] = include_bytes!("fixtures/compiler-scip-receiver/receiver-b.scip");
static SEQUENCE: AtomicU64 = AtomicU64::new(0);

struct Fixture(PathBuf);

impl Fixture {
    fn new() -> Self {
        let path = std::env::temp_dir().join(format!(
            "cgrx-scip-freshness-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        let repo = path.join("repo");
        fs::create_dir_all(repo.join("src")).unwrap();
        fs::write(repo.join("src/lib.rs"), SOURCE).unwrap();
        fs::write(
            repo.join("Cargo.toml"),
            include_str!("fixtures/compiler-scip-receiver/Cargo.toml"),
        )
        .unwrap();
        fs::write(path.join("index.scip"), SCIP_A).unwrap();
        git(&repo, &["init", "-q"]);
        git(&repo, &["config", "user.name", "CGRX Test"]);
        git(&repo, &["config", "user.email", "test@example.invalid"]);
        git(&repo, &["add", "Cargo.toml", "src"]);
        git(&repo, &["commit", "-qm", "Compiled receiver fixture A"]);
        Self(path)
    }

    fn repo(&self) -> PathBuf {
        self.0.join("repo")
    }

    fn change_receiver(&self, commit: bool) {
        let source = SOURCE.replace("caller(worker: A)", "caller(worker: B)");
        assert_eq!(source.len(), SOURCE.len());
        fs::write(self.repo().join("src/lib.rs"), source).unwrap();
        if commit {
            git(&self.repo(), &["add", "src/lib.rs"]);
            git(
                &self.repo(),
                &["commit", "-qm", "Compiled receiver fixture B"],
            );
        }
    }

    fn replace_scip(&self, bytes: &[u8]) {
        let temporary = self.0.join("index.scip.new");
        fs::write(&temporary, bytes).unwrap();
        fs::rename(temporary, self.0.join("index.scip")).unwrap();
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn git(root: &Path, arguments: &[&str]) {
    let output = Command::new("git")
        .args(arguments)
        .current_dir(root)
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
}

struct Session {
    child: Child,
    output: BufReader<ChildStdout>,
    sequence: u64,
}

impl Session {
    fn new(fixture: &Fixture, profile: &str) -> Self {
        let mut child = Command::new(env!("CARGO_BIN_EXE_cgrx"))
            .args(["serve", "--root"])
            .arg(fixture.repo())
            .arg("--scip")
            .arg(fixture.0.join("index.scip"))
            .env("CGRX_RESPONSE_PROFILE", profile)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .unwrap();
        let output = BufReader::new(child.stdout.take().unwrap());
        let mut session = Self {
            child,
            output,
            sequence: 0,
        };
        let response = session.request(
            "initialize",
            json!({
                "protocolVersion":"2025-06-18", "capabilities":{},
                "clientInfo":{"name":"scip-freshness-test","version":"1"}
            }),
        );
        assert!(response.get("result").is_some());
        session.call("status", json!({}));
        session
    }

    fn request(&mut self, method: &str, params: Value) -> Value {
        self.sequence += 1;
        let request = json!({"jsonrpc":"2.0","id":self.sequence,"method":method,"params":params});
        let input = self.child.stdin.as_mut().unwrap();
        writeln!(input, "{request}").unwrap();
        input.flush().unwrap();
        let mut line = String::new();
        assert_ne!(self.output.read_line(&mut line).unwrap(), 0);
        serde_json::from_str(&line).unwrap()
    }

    fn call(&mut self, name: &str, arguments: Value) -> Value {
        let response = self.request("tools/call", json!({"name":name,"arguments":arguments}));
        assert!(response.get("error").is_none(), "{response}");
        let result = &response["result"];
        assert_ne!(result["isError"], true, "{result}");
        result.get("structuredContent").cloned().unwrap_or_else(|| {
            serde_json::from_str(result["content"][0]["text"].as_str().unwrap()).unwrap()
        })
    }

    fn semantic_targets(&mut self, symbol: &str) -> Vec<Value> {
        let result = self.call(
            "trace_path",
            json!({
                "symbol":symbol,"path":"src/lib.rs","direction":"callees","depth":1,"limit":10
            }),
        );
        let targets = table(&result, "nodes");
        targets.into_iter().filter(|target| {
            let usages = self.call("find_usages", json!({
                "symbol":target["symbol"], "symbol_ref":target["symbol_ref"],
                "path":"src/lib.rs","depth":1,"limit":10,
                "scope":{"include":["src/lib.rs"],"exclude":[],"relation_kinds":["CALLS"],"max_depth":1}
            }));
            table(&usages, "usages").iter().any(|row| {
                let caller = row["source"].as_str().unwrap_or_else(|| row["source"]["symbol"].as_str().unwrap());
                row["resolver"] == "SCIP_CONFIRMED" && caller == symbol
            })
        }).collect()
    }
}

fn table(value: &Value, field: &str) -> Vec<Value> {
    if let Some(rows) = value[field].as_array() {
        return rows.clone();
    }
    let columns = value["cols"].as_array().unwrap();
    value["rows"]
        .as_array()
        .unwrap()
        .iter()
        .map(|row| {
            let mut object = serde_json::Map::new();
            for (column, cell) in columns.iter().zip(row.as_array().unwrap()) {
                object.insert(column.as_str().unwrap().to_owned(), cell.clone());
            }
            Value::Object(object)
        })
        .collect()
}

impl Drop for Session {
    fn drop(&mut self) {
        self.child.stdin.take();
        let _ = self.child.wait();
    }
}

#[test]
fn managed_head_change_waits_for_new_compiler_input_and_recovers_without_restart() {
    for profile in ["full", "token-efficient"] {
        let fixture = Fixture::new();
        let mut session = Session::new(&fixture, profile);
        assert_eq!(session.semantic_targets("caller").len(), 1);
        assert_eq!(session.semantic_targets("local_reader").len(), 1);
        fixture.change_receiver(true);
        session.call("status", json!({}));
        assert!(session.semantic_targets("caller").is_empty(), "{profile}");
        assert!(
            session.semantic_targets("local_reader").is_empty(),
            "{profile}"
        );
        // Replacing the old bytes cannot manufacture freshness.
        fixture.replace_scip(SCIP_A);
        assert!(session.semantic_targets("caller").is_empty(), "{profile}");
        fixture.replace_scip(SCIP_B);
        let targets = session.semantic_targets("caller");
        assert_eq!(targets.len(), 1, "{profile}");
        assert_eq!(
            session.semantic_targets("local_reader").len(),
            1,
            "{profile}"
        );
        let snippet = session.call("get_code_snippet", json!({
            "symbol":targets[0]["symbol"], "symbol_ref":targets[0]["symbol_ref"], "path":"src/lib.rs"
        }));
        assert_eq!(
            usize::try_from(snippet["definition_span"]["start"].as_u64().unwrap()).unwrap(),
            SOURCE.find("impl B").unwrap() + "impl B { pub fn ".len()
        );
    }
}

#[test]
fn fresh_scip_during_uncommitted_changes_is_deferred_until_head_matches() {
    let fixture = Fixture::new();
    let mut session = Session::new(&fixture, "full");
    assert_eq!(session.semantic_targets("caller").len(), 1);
    fixture.change_receiver(false);
    fixture.replace_scip(SCIP_B);
    assert!(session.semantic_targets("caller").is_empty());
    assert!(session.semantic_targets("caller").is_empty());
    fixture.change_receiver(true);
    assert_eq!(session.semantic_targets("caller").len(), 1);
}

#[test]
fn interrupted_scip_publication_returns_errors_and_recovers_without_restart() {
    for profile in ["full", "token-efficient"] {
        let fixture = Fixture::new();
        let mut session = Session::new(&fixture, profile);
        assert_eq!(session.semantic_targets("caller").len(), 1);
        fixture.change_receiver(true);
        fs::remove_file(fixture.0.join("index.scip")).unwrap();
        let missing = session.request("tools/call", json!({"name":"status","arguments":{}}));
        assert_eq!(
            missing["error"]["data"]["code"], "scip_read",
            "{profile}: {missing}"
        );
        fixture.replace_scip(&SCIP_B[..SCIP_B.len() - 1]);
        let partial = session.request("tools/call", json!({"name":"status","arguments":{}}));
        assert_eq!(
            partial["error"]["data"]["code"], "scip_parse",
            "{profile}: {partial}"
        );
        fixture.replace_scip(SCIP_B);
        let targets = session.semantic_targets("caller");
        assert_eq!(targets.len(), 1, "{profile}");
        let snippet = session.call("get_code_snippet", json!({
            "symbol":targets[0]["symbol"], "symbol_ref":targets[0]["symbol_ref"], "path":"src/lib.rs"
        }));
        assert_eq!(
            usize::try_from(snippet["definition_span"]["start"].as_u64().unwrap()).unwrap(),
            SOURCE.find("impl B").unwrap() + "impl B { pub fn ".len()
        );
    }
}

#[test]
fn changed_scip_input_is_refused_before_publishing_a_generation() {
    let fixture = Fixture::new();
    let path = fixture.0.join("index.scip");
    let state = fixture.0.join("state");
    let observed = Runtime::scip_file_hash(&path).unwrap();
    fixture.change_receiver(true);
    let native = Runtime::index_committed_head(&fixture.repo(), &state).unwrap();
    fixture.replace_scip(SCIP_B);
    let error =
        Runtime::index_committed_head_with_scip_if_hash(&fixture.repo(), &state, &path, observed)
            .unwrap_err();
    assert_eq!(error.code(), "scip_changed_during_read");
    let unchanged = Runtime::open(&state).unwrap();
    assert_eq!(*unchanged.snapshot(), native.snapshot);
    assert_eq!(unchanged.scip_input_hash(), None);
    let current = Runtime::scip_file_hash(&path).unwrap();
    let semantic =
        Runtime::index_committed_head_with_scip_if_hash(&fixture.repo(), &state, &path, current)
            .unwrap();
    assert_eq!(semantic.scip_edges, 2);
    assert_eq!(
        Runtime::open(&state).unwrap().scip_input_hash(),
        Some(current)
    );
}
