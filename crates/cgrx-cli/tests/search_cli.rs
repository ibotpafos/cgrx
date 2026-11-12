use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};

use serde_json::Value;

static SEQUENCE: AtomicU64 = AtomicU64::new(0);

struct Fixture(PathBuf);

impl Fixture {
    fn new() -> Self {
        let root = std::env::temp_dir().join(format!(
            "cgrx-search-cli-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed),
        ));
        fs::create_dir_all(root.join("src")).unwrap();
        fs::write(root.join("src/main.rs"),
            "fn HTTPRequest() {}\nfn persist() { let cache_key=1; let expiry_policy=2; }\nfn HTTPRequestExtra() { HTTPRequest(); }\n",
        ).unwrap();
        fs::write(root.join("other.py"), "def HTTPRequest():\n    pass\n").unwrap();
        git(&root, &["init", "-q"]);
        git(&root, &["add", "."]);
        git(
            &root,
            &[
                "-c",
                "user.name=CGRX Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-qm",
                "fixture",
            ],
        );
        Self(root)
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
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
}

fn search(root: &Path, args: &[&str]) -> Value {
    let output = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["search", "--root"])
        .arg(root)
        .args(args)
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    serde_json::from_slice(&output.stdout).unwrap()
}

#[test]
fn managed_search_filters_and_pages_the_same_symbol_order() {
    let fixture = Fixture::new();
    let first = search(
        &fixture.0,
        &[
            "--query",
            "http request",
            "--language",
            "rust",
            "--limit",
            "1",
        ],
    );
    let second = search(
        &fixture.0,
        &[
            "--query",
            "http request",
            "--language",
            "rust",
            "--limit",
            "1",
            "--offset",
            "1",
        ],
    );
    assert_eq!(first["matches"][0]["symbol"], "HTTPRequest");
    assert_eq!(first["matches"][0]["callers"], 1);
    assert_eq!(second["matches"][0]["symbol"], "HTTPRequestExtra");
    assert_eq!(first["total"], 2);
    assert_eq!(first["snapshot"], second["snapshot"]);
    let filtered = search(
        &fixture.0,
        &[
            "--query",
            "http request",
            "--paths",
            "src/**",
            "--exclude",
            "src/**",
        ],
    );
    assert_eq!(filtered["total"], 0);
}

#[test]
fn body_terms_are_only_discovered_when_requested() {
    let fixture = Fixture::new();
    let names = search(&fixture.0, &["--query", "cache expiry"]);
    assert_eq!(names["total"], 0);
    let body = search(
        &fixture.0,
        &["--query", "cache expiry", "--include-body", "true"],
    );
    assert_eq!(body["total"], 1);
    assert_eq!(body["matches"][0]["symbol"], "persist");
}

#[test]
fn guarded_continuation_rejects_a_changed_working_tree() {
    let fixture = Fixture::new();
    let first = search(&fixture.0, &["--query", "http request", "--limit", "1"]);
    let snapshot = first["page"]["snapshot_id"].as_str().unwrap();
    let next = search(
        &fixture.0,
        &[
            "--query",
            "http request",
            "--limit",
            "1",
            "--offset",
            "1",
            "--expected-snapshot",
            snapshot,
        ],
    );
    assert_eq!(first["snapshot"], next["snapshot"]);
    fs::write(
        fixture.0.join("src/main.rs"),
        "fn HTTPRequestChanged() {}\n",
    )
    .unwrap();
    let output = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["search", "--root"])
        .arg(&fixture.0)
        .args([
            "--query",
            "http request",
            "--offset",
            "1",
            "--expected-snapshot",
            snapshot,
        ])
        .output()
        .unwrap();
    assert_eq!(output.status.code(), Some(2));
    assert!(output.stdout.is_empty());
    assert!(String::from_utf8_lossy(&output.stderr).contains("restart"));
}

#[test]
fn invalid_search_flags_fail_before_opening_a_repository() {
    for args in [
        vec!["--query", ""],
        vec!["--query", "foo", "--limit", "0"],
        vec!["--query", "foo", "--offset", "1000001"],
        vec!["--query", "foo", "--include-body", "yes"],
        vec!["--query", "foo", "--match-mode", "unknown"],
        vec!["--query", "foo", "--match-mode", "ast"],
        vec![
            "--query",
            "foo",
            "--match-mode",
            "ast",
            "--language",
            "java",
        ],
        vec![
            "--query",
            "foo",
            "--match-mode",
            "ast",
            "--language",
            "rust",
            "--include-body",
            "true",
        ],
        vec!["--query", "foo", "--expected-snapshot", "invalid"],
        vec!["--query", "foo", "--query", "bar"],
        vec!["--query", "foo", "--unexpected", "value"],
        vec!["--query"],
    ] {
        let output = Command::new(env!("CARGO_BIN_EXE_cgrx"))
            .args(["search", "--root", "/nonexistent/cgrx-search"])
            .args(args)
            .output()
            .unwrap();
        assert_eq!(output.status.code(), Some(2));
        assert!(output.stdout.is_empty());
        assert!(!String::from_utf8_lossy(&output.stderr).contains("No such file"));
    }
}

#[test]
fn structural_search_uses_the_managed_graph_and_guards_continuation() {
    let fixture = Fixture::new();
    let first = search(
        &fixture.0,
        &[
            "--query",
            "HTTPRequest()",
            "--match-mode",
            "ast",
            "--language",
            "rust",
        ],
    );
    assert_eq!(first["total"], 1);
    assert_eq!(first["matches"][0]["symbol"], "HTTPRequestExtra");
    assert_eq!(first["matches"][0]["matched_by"], "ast");
    assert!(first["matches"][0]["symbol_ref"].is_string());
    let bytes = fs::read(fixture.0.join("src/main.rs")).unwrap();
    let span = &first["matches"][0]["ast_matches"]["spans"][0];
    assert_eq!(
        &bytes[span["start"].as_u64().unwrap() as usize..span["end"].as_u64().unwrap() as usize],
        b"HTTPRequest()"
    );
    fs::write(
        fixture.0.join("src/main.rs"),
        "fn HTTPRequest() {}\nfn changed() { HTTPRequest(); HTTPRequest(); }\n",
    )
    .unwrap();
    let output = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["search", "--root"])
        .arg(&fixture.0)
        .args([
            "--query",
            "HTTPRequest()",
            "--match-mode",
            "ast",
            "--language",
            "rust",
            "--expected-snapshot",
            first["page"]["snapshot_id"].as_str().unwrap(),
        ])
        .output()
        .unwrap();
    assert_eq!(output.status.code(), Some(2));
    assert!(String::from_utf8_lossy(&output.stderr).contains("restart"));
    let refreshed = search(
        &fixture.0,
        &[
            "--query",
            "HTTPRequest()",
            "--match-mode",
            "ast",
            "--language",
            "rust",
        ],
    );
    assert_eq!(refreshed["matches"][0]["symbol"], "changed");
    assert_ne!(
        first["page"]["snapshot_id"],
        refreshed["page"]["snapshot_id"]
    );
}
