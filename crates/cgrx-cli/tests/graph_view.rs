use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use cgrx_cli::{GraphDirection, GraphViewRequest, Runtime};
use cgrx_core::{RelationKind, Scope};

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

fn git(root: &Path, args: &[&str]) {
    assert!(
        Command::new("git")
            .args(args)
            .current_dir(root)
            .status()
            .expect("git executable")
            .success(),
        "git command failed: {args:?}"
    );
}

fn graph_runtime() -> (TestDirectory, TestDirectory, Runtime) {
    let repository = TestDirectory::new("graph-view-repository");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("service.ts"),
        "export function target() { return 1; }\nexport function selected() { return target(); }\nexport function caller() { return selected(); }\n",
    )
    .expect("write source fixture");
    fs::write(
        repository.path().join("service.test.ts"),
        "import { selected } from './service';\nexport function selectedScenario() { return selected(); }\n",
    )
    .expect("write test fixture");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("graph-view-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");
    (repository, state, runtime)
}

fn request(node_limit: usize, edge_limit: usize) -> GraphViewRequest {
    GraphViewRequest {
        symbol: "selected".to_owned(),
        path: Some("service.ts".to_owned()),
        direction: GraphDirection::Both,
        depth: 1,
        scope: Scope {
            include: vec!["**".to_owned()],
            exclude: Vec::new(),
            relation_kinds: vec![RelationKind::Calls],
            max_depth: 1,
        },
        node_limit,
        edge_limit,
    }
}

#[test]
fn focused_view_orders_semantic_lanes() {
    let (_repository, _state, runtime) = graph_runtime();

    let result = runtime
        .graph_view(request(80, 160))
        .expect("focused graph view");

    let lanes = result["nodes"]
        .as_array()
        .expect("nodes")
        .iter()
        .map(|node| node["lane"].as_str().expect("lane"))
        .collect::<Vec<_>>();
    assert_eq!(lanes, ["callers", "entrypoints", "callees", "tests"]);
    assert_eq!(result["root"]["symbol"], "selected");
    assert_eq!(result["edges"].as_array().expect("edges").len(), 3);
    assert_eq!(result["partial"], false);
    assert_eq!(result["truncated"], false);
    assert!(result["snapshot"]["repo_revision"].is_string());
    assert!(
        result["containers"]
            .as_array()
            .is_some_and(|items| items.len() == 2)
    );
    for edge in result["edges"].as_array().expect("edges") {
        assert_eq!(edge["confidence"], "PROVEN", "{edge}");
        assert!(edge["evidence"]["path"].is_string(), "{edge}");
        assert!(edge["evidence"]["source_hash"].is_string(), "{edge}");
    }
    assert_eq!(
        result,
        runtime
            .graph_view(request(80, 160))
            .expect("repeat graph view")
    );
}

#[test]
fn node_cap_reports_uncapped_graph_totals() {
    let (_repository, _state, runtime) = graph_runtime();
    let result = runtime
        .graph_view(request(2, 160))
        .expect("capped graph view");

    assert_eq!(result["nodes"].as_array().expect("nodes").len(), 2);
    assert_eq!(result["total_nodes"], 4);
    assert_eq!(result["total_edges"], 3);
    assert_eq!(result["truncated"], true);
    assert_eq!(result["partial"], true);
    assert!(
        result["coverage_gaps"]
            .as_array()
            .expect("gaps")
            .iter()
            .any(|gap| gap["code"] == "GRAPH_NODE_LIMIT")
    );
}

#[test]
fn graph_view_covers_every_supported_source_extension() {
    let repository = TestDirectory::new("graph-view-languages");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    for (path, source) in [
        (
            "sample.ts",
            "function targetTs() { return 1; } function selectedTs() { return targetTs(); }",
        ),
        (
            "sample.tsx",
            "function targetTsx() { return <span />; } function selectedTsx() { return targetTsx(); }",
        ),
        (
            "sample.go",
            "package sample\nfunc targetGo() int { return 1 }\nfunc selectedGo() int { return targetGo() }\n",
        ),
        (
            "sample.java",
            "final class Sample { int targetJava() { return 1; } int selectedJava() { return targetJava(); } }",
        ),
        (
            "sample.py",
            "def target_py():\n    return 1\n\ndef selected_py():\n    return target_py()\n",
        ),
        (
            "sample.rs",
            "fn target_rs() -> i32 { 1 } fn selected_rs() -> i32 { target_rs() }",
        ),
    ] {
        fs::write(repository.path().join(path), source).expect("write language fixture");
    }
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("graph-view-languages-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    for (path, symbol, target) in [
        ("sample.ts", "selectedTs", "targetTs"),
        ("sample.tsx", "selectedTsx", "targetTsx"),
        ("sample.go", "selectedGo", "targetGo"),
        ("sample.java", "selectedJava", "targetJava"),
        ("sample.py", "selected_py", "target_py"),
        ("sample.rs", "selected_rs", "target_rs"),
    ] {
        let result = runtime
            .graph_view(GraphViewRequest {
                symbol: symbol.to_owned(),
                path: Some(path.to_owned()),
                direction: GraphDirection::Callees,
                depth: 1,
                scope: Scope {
                    include: vec![path.to_owned()],
                    exclude: Vec::new(),
                    relation_kinds: vec![RelationKind::Calls],
                    max_depth: 1,
                },
                node_limit: 80,
                edge_limit: 160,
            })
            .expect("language graph view");
        assert_eq!(result["root"]["symbol"], symbol, "{path}: {result}");
        assert!(
            result["nodes"]
                .as_array()
                .expect("nodes")
                .iter()
                .any(|node| node["symbol"] == target),
            "{path}: {result}"
        );
        assert_eq!(result["edges"].as_array().expect("edges").len(), 1);
    }
}

#[test]
fn graph_view_rejects_invalid_bounds_and_missing_symbols() {
    let (_repository, _state, runtime) = graph_runtime();
    for invalid in [request(0, 160), request(80, 0)] {
        assert_eq!(
            runtime
                .graph_view(invalid)
                .expect_err("invalid bound")
                .code(),
            "cgrx.invalid_arguments"
        );
    }
    let mut missing = request(80, 160);
    missing.symbol = "absent".to_owned();
    assert_eq!(
        runtime
            .graph_view(missing)
            .expect_err("missing symbol")
            .code(),
        "cgrx.symbol_not_found"
    );
}

#[test]
fn repository_graph_keeps_internal_calls_isolates_and_precise_ids() {
    let (repository, _state, mut runtime) = graph_runtime();
    fs::write(
        repository.path().join("isolated.ts"),
        "export function disconnected() {}\n",
    )
    .unwrap();
    runtime.refresh(repository.path()).unwrap();
    let scope = request(80, 160).scope;
    let graph = runtime.repository_graph(&scope, 5000, 30000).unwrap();
    let nodes = graph["nodes"].as_array().unwrap();
    let edges = graph["edges"].as_array().unwrap();
    assert!(nodes.iter().any(|n| n["symbol"] == "disconnected"));
    assert_eq!(nodes.len() as u64, graph["total_nodes"].as_u64().unwrap());
    assert_eq!(edges.len() as u64, graph["total_edges"].as_u64().unwrap());
    assert_eq!(graph["truncated"], false);
    assert!(
        nodes
            .iter()
            .all(|n| n["node_id"].as_str().unwrap().parse::<u64>().is_ok())
    );
    let selected = nodes
        .iter()
        .find(|n| n["symbol"] == "selected" && n["path"] == "service.ts")
        .unwrap();
    let target = nodes.iter().find(|n| n["symbol"] == "target").unwrap();
    assert!(edges.iter().any(|e| e["source"] == selected["node_id"]
        && e["target"] == target["node_id"]
        && e["relation"] == "CALLS"
        && e["evidence"]["path"] == "service.ts"));
    assert!(
        edges
            .iter()
            .all(|e| nodes.iter().any(|n| n["node_id"] == e["source"])
                && nodes.iter().any(|n| n["node_id"] == e["target"]))
    );
    let bounded = runtime.repository_graph(&scope, 1, 1).unwrap();
    assert_eq!(bounded["truncated"], true);
    assert_eq!(bounded["total_nodes"], graph["total_nodes"]);
    assert!(runtime.repository_graph(&scope, 0, 1).is_err());
    assert!(runtime.repository_graph(&scope, 10001, 1).is_err());
    assert!(runtime.repository_graph(&scope, 1, 50001).is_err());
    let mut narrow = scope;
    narrow.include = vec!["isolated.ts".into()];
    let only_isolate = runtime.repository_graph(&narrow, 5000, 30000).unwrap();
    assert_eq!(only_isolate["nodes"].as_array().unwrap().len(), 1);
    assert!(only_isolate["edges"].as_array().unwrap().is_empty());
    fs::write(
        repository.path().join("service.ts"),
        "export function target() {}\nexport function selected() {}\n",
    )
    .unwrap();
    runtime.refresh(repository.path()).unwrap();
    let after = runtime
        .repository_graph(&request(80, 160).scope, 5000, 30000)
        .unwrap();
    assert!(
        !after["edges"]
            .as_array()
            .unwrap()
            .iter()
            .any(|e| e["source"] == selected["node_id"] && e["target"] == target["node_id"])
    );
    assert_ne!(after["snapshot"], graph["snapshot"]);
}
