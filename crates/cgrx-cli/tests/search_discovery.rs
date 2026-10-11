use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};

use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};
use serde_json::{Value, json};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);

struct Fixture {
    root: PathBuf,
    state: PathBuf,
}

impl Fixture {
    fn new(source: &str) -> Self {
        let directory = std::env::temp_dir().join(format!(
            "cgrx-search-discovery-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        let root = directory.join("repo");
        let state = directory.join("state");
        fs::create_dir_all(&root).unwrap();
        fs::write(root.join("main.rs"), source).unwrap();
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
        Runtime::index(&root, &state).unwrap();
        Self { root, state }
    }

    fn open(&self) -> Runtime {
        Runtime::open(&self.state).unwrap()
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(self.root.parent().unwrap());
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

fn scope() -> Scope {
    Scope {
        include: vec!["**".into()],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    }
}

fn names(report: &Value) -> Vec<&str> {
    report["matches"]
        .as_array()
        .unwrap()
        .iter()
        .map(|row| row["symbol"].as_str().unwrap())
        .collect()
}

#[test]
fn identifier_search_requires_every_term_and_preserves_name_precedence() {
    let fixture = Fixture::new(
        "fn HTTPRequest() {}\nfn http_request() {}\nfn http_request_extra() {}\n\
         fn pre_http_request() {}\nfn HTTPServer() {}\nfn requestOnly() {}\n\
         fn body_match() { let value = \"http_request\"; }\n",
    );
    let runtime = fixture.open();
    let exact = runtime
        .search_graph_filtered("http_request", &scope(), 50, None, true)
        .unwrap();
    assert_eq!(
        names(&exact),
        vec![
            "http_request",
            "http_request_extra",
            "pre_http_request",
            "HTTPRequest",
            "body_match",
        ]
    );
    assert_eq!(exact["matches"][0]["matched_by"], "symbol");
    assert_eq!(exact["matches"][3]["matched_by"], "symbol_tokens");
    assert_eq!(exact["matches"][4]["matched_by"], "body");
    for query in ["http request", "REQUEST HTTP", "http http request"] {
        let result = runtime.search_graph(query, &scope(), 50).unwrap();
        assert_eq!(result["total"], 4, "{query}: {result}");
        assert_eq!(names(&result)[..2], ["HTTPRequest", "http_request"]);
        assert!(
            result["matches"]
                .as_array()
                .unwrap()
                .iter()
                .all(|row| row["matched_by"] == "symbol_tokens")
        );
        assert_eq!(result, runtime.search_graph(query, &scope(), 50).unwrap());
    }
    assert_eq!(
        runtime.search_graph("http missing", &scope(), 50).unwrap()["total"],
        0
    );
    assert_eq!(
        runtime.search_graph("...", &scope(), 50).unwrap()["total"],
        0
    );
}

#[test]
fn body_terms_are_conjunctive_and_require_explicit_opt_in() {
    let fixture = Fixture::new(
        "fn persist() { let cache_key = 1; let expiry_policy = 2; }\n\
         fn partial() { let cache_key = 1; }\n\
         fn irrelevant() { let expiration = 2; }\n",
    );
    let runtime = fixture.open();
    assert_eq!(
        runtime.search_graph("cache expiry", &scope(), 50).unwrap()["total"],
        0
    );
    let result = runtime
        .search_graph_filtered("cache expiry", &scope(), 50, Some("rust"), true)
        .unwrap();
    assert_eq!(names(&result), vec!["persist"]);
    assert_eq!(result["matches"][0]["matched_by"], "body_tokens");
    assert_eq!(
        runtime
            .search_graph_filtered("cache missing", &scope(), 50, None, true)
            .unwrap()["total"],
        0
    );
    assert_eq!(
        runtime
            .search_graph_filtered("cache expiry", &scope(), 50, Some("python"), true)
            .unwrap()["total"],
        0
    );
    let excluded = Scope {
        exclude: vec!["main.rs".into()],
        ..scope()
    };
    assert_eq!(
        runtime
            .search_graph_filtered("cache expiry", &excluded, 50, None, true)
            .unwrap()["total"],
        0
    );
}

#[test]
fn pagination_preserves_total_order_and_handles_last_and_empty_pages() {
    let source = (0..53)
        .map(|index| format!("fn node_{index:02}() {{}}\n"))
        .collect::<String>();
    let fixture = Fixture::new(&source);
    let runtime = fixture.open();
    let first = runtime
        .search_graph_page("node_", &scope(), 50, 0, None, false)
        .unwrap();
    let last = runtime
        .search_graph_page("node_", &scope(), 50, 50, None, false)
        .unwrap();
    assert_eq!(first["total"], 53);
    assert_eq!(first["matches"].as_array().unwrap().len(), 50);
    assert_eq!(first["page"]["next_offset"], 50);
    assert_eq!(first["page"]["has_more"], true);
    assert_eq!(first["truncated"], true);
    assert_eq!(names(&last), vec!["node_50", "node_51", "node_52"]);
    assert_eq!(last["total"], 53);
    assert_eq!(last["page"]["next_offset"], Value::Null);
    assert_eq!(last["page"]["has_more"], false);
    assert_eq!(last["truncated"], false);
    assert_eq!(first["snapshot"], last["snapshot"]);
    assert_eq!(first["page"]["snapshot_id"], last["page"]["snapshot_id"]);
    assert_eq!(
        first,
        runtime
            .search_graph_page("node_", &scope(), 50, 0, None, false)
            .unwrap()
    );
    let empty = runtime
        .search_graph_page("node_", &scope(), 50, 1_000_000, None, false)
        .unwrap();
    assert_eq!(empty["matches"], json!([]));
    assert_eq!(empty["total"], 53);
    assert_eq!(empty["page"]["has_more"], false);
    assert_eq!(empty["page"]["next_offset"], Value::Null);
    for (limit, offset) in [(0, 0), (51, 0), (1, 1_000_001), (1, usize::MAX)] {
        assert_eq!(
            runtime
                .search_graph_page("node_", &scope(), limit, offset, None, false)
                .unwrap_err()
                .code(),
            "cgrx.invalid_arguments"
        );
    }
}

#[test]
fn refreshed_pages_have_new_snapshot_and_symbol_identities() {
    let fixture = Fixture::new("fn node_a() {}\nfn node_b() {}\n");
    let mut runtime = fixture.open();
    let before = runtime
        .search_graph_page("node_", &scope(), 1, 0, None, false)
        .unwrap();
    fs::write(
        fixture.root.join("main.rs"),
        "fn node_a() { let changed = 1; }\nfn node_b() {}\n",
    )
    .unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    let after = runtime
        .search_graph_page("node_", &scope(), 1, 0, None, false)
        .unwrap();
    assert_ne!(before["snapshot"], after["snapshot"]);
    assert_ne!(before["page"]["snapshot_id"], after["page"]["snapshot_id"]);
    assert_ne!(
        before["matches"][0]["symbol_ref"],
        after["matches"][0]["symbol_ref"]
    );
    assert_eq!(names(&before), names(&after));
}
