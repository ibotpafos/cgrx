//! Source-backed containment and migration from the former first-symbol anchor policy.
//! Legacy artifacts are modeled through the real immutable generation writer.

use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, RepoSnapshot, Scope};
use cgrx_store::{GenerationReader, GenerationWriter};
use serde_json::{Value, json};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);
const PATH: &str = "lib.rs";
const SIBLINGS: &str = "fn alpha() {}\nfn beta() {}\n";
const NESTED: &str = "fn anchor() {}\nfn parent() {\n    fn child() {}\n}\nfn sibling() {}\n";

struct Fixture {
    base: PathBuf,
    root: PathBuf,
    state: PathBuf,
}

impl Fixture {
    fn new(source: &str) -> Self {
        let base = std::env::temp_dir().join(format!(
            "cgrx-containment-migration-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&base).unwrap();
        let root = base.join("repo");
        fs::create_dir(&root).unwrap();
        fs::write(root.join(PATH), source).unwrap();
        git(&root, &["init", "-q"]);
        git(&root, &["config", "core.autocrlf", "false"]);
        commit(&root);
        let state = base.join("state");
        Runtime::index_committed_head(&root, &state).unwrap();
        Self { base, root, state }
    }

    fn runtime(&self) -> Runtime {
        Runtime::open(&self.state).unwrap()
    }

    fn stored(&self) -> Value {
        stored(&GenerationReader::open_current(&self.state).unwrap())
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.base);
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
        "git {arguments:?}: {}",
        String::from_utf8_lossy(&output.stderr)
    );
}

fn commit(root: &Path) {
    git(root, &["add", PATH]);
    git(
        root,
        &[
            "-c",
            "user.name=CGRX Test",
            "-c",
            "user.email=test@example.invalid",
            "commit",
            "-qm",
            "containment fixture",
        ],
    );
}

fn stored(reader: &GenerationReader) -> Value {
    serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap()
}

fn contains_scope() -> Scope {
    Scope {
        include: vec![PATH.to_owned()],
        exclude: Vec::new(),
        relation_kinds: vec![RelationKind::Contains],
        max_depth: 1,
    }
}

fn trace(runtime: &Runtime, symbol: &str) -> Value {
    runtime
        .trace_path(symbol, Some(PATH), "callees", 1, &contains_scope(), 50)
        .unwrap()
}

fn symbol<'a>(stored: &'a Value, name: &str) -> &'a Value {
    let matches: Vec<_> = stored["documents"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|document| document["provenance"] == "SYNTAX" && document["qualified_name"] == name)
        .collect();
    assert_eq!(matches.len(), 1, "unique definition {name}: {stored}");
    matches[0]
}

fn assert_no_proof(runtime: &Runtime, source: &str, target: &str) {
    let source = runtime.get_code_snippet(source, Some(PATH)).unwrap()["node_id"]
        .as_u64()
        .unwrap()
        .to_string();
    let target = runtime.get_code_snippet(target, Some(PATH)).unwrap()["node_id"]
        .as_u64()
        .unwrap()
        .to_string();
    let error = runtime
        .repository_edge_evidence(&source, &target, "CONTAINS")
        .unwrap_err();
    assert_eq!(error.code(), "cgrx.edge_not_found");
}

#[test]
fn cold_committed_siblings_have_no_containment_or_public_proof() {
    let fixture = Fixture::new(SIBLINGS);
    let runtime = fixture.runtime();
    assert_eq!(runtime.graph_node_count(), 2);
    assert_eq!(trace(&runtime, "alpha")["total"], 0);
    assert_no_proof(&runtime, "alpha", "beta");
    let topology = runtime.repository_graph(&contains_scope(), 50, 50).unwrap();
    assert_eq!(topology["total_edges"], 0);
    assert!(topology["edges"].as_array().unwrap().is_empty());
    let found = runtime
        .search_graph("alpha", &contains_scope(), 50)
        .unwrap();
    assert_eq!(found["matches"][0]["callees"], 0);
    assert!(
        fixture.stored()["arcs"]
            .as_array()
            .unwrap()
            .iter()
            .all(|arc| arc["kind"] != "CONTAINS")
    );
}

fn assert_source_proof(runtime: &Runtime, parent: &str, child: &str, source: &str) {
    let parent = runtime.get_code_snippet(parent, Some(PATH)).unwrap();
    let child = runtime.get_code_snippet(child, Some(PATH)).unwrap();
    let proof = runtime
        .repository_edge_evidence(
            &parent["node_id"].as_u64().unwrap().to_string(),
            &child["node_id"].as_u64().unwrap().to_string(),
            "CONTAINS",
        )
        .unwrap();
    assert_eq!(proof["confidence"], "PROVEN");
    assert_eq!(proof["evidence"].as_array().unwrap().len(), 1);
    let evidence = &proof["evidence"][0];
    assert_eq!(evidence["path"], PATH);
    assert_eq!(evidence["span"], child["definition_span"]);
    assert_eq!(evidence["resolver"], "SYNTAX_EXACT");
    assert_eq!(evidence["confidence"], "PROVEN");
    let name_start = usize::try_from(child["definition_span"]["start"].as_u64().unwrap()).unwrap();
    let name_end = usize::try_from(child["definition_span"]["end"].as_u64().unwrap()).unwrap();
    assert_eq!(
        &source[name_start..name_end],
        child["symbol"].as_str().unwrap()
    );
    assert_eq!(
        evidence["source_hash"],
        blake3::hash(source.as_bytes()).to_hex().to_string()
    );
    assert!(
        parent["body_span"]["start"].as_u64().unwrap()
            <= child["body_span"]["start"].as_u64().unwrap()
    );
    assert!(
        child["body_span"]["end"].as_u64().unwrap() <= parent["body_span"]["end"].as_u64().unwrap()
    );
}

fn assert_nested_proof(runtime: &Runtime, source: &str) -> Value {
    assert_eq!(trace(runtime, "anchor")["total"], 0);
    assert_no_proof(runtime, "anchor", "parent");
    assert_no_proof(runtime, "anchor", "child");
    assert_no_proof(runtime, "parent", "sibling");
    let children = trace(runtime, "parent");
    assert_eq!(children["total"], 1, "{children}");
    assert_eq!(children["nodes"][0]["symbol"], "child");
    assert_source_proof(runtime, "parent", "child", source);
    let topology = runtime.repository_graph(&contains_scope(), 50, 50).unwrap();
    assert_eq!(topology["total_edges"], 1, "{topology}");
    topology["edges"].clone()
}

#[test]
fn cold_committed_nested_definition_uses_its_actual_nonfirst_parent() {
    let fixture = Fixture::new(NESTED);
    assert_nested_proof(&fixture.runtime(), NESTED);
}

#[test]
fn cold_committed_containment_keeps_every_strict_ancestor_without_a_file_anchor() {
    let source = "fn anchor() {}\nfn parent() {\n    fn middle() {\n        fn child() {}\n    }\n}\nfn sibling() {}\n";
    let fixture = Fixture::new(source);
    let runtime = fixture.runtime();
    assert_eq!(trace(&runtime, "anchor")["total"], 0);
    let parent_children = trace(&runtime, "parent");
    assert_eq!(parent_children["total"], 2, "{parent_children}");
    assert_eq!(parent_children["nodes"][0]["symbol"], "middle");
    assert_eq!(parent_children["nodes"][1]["symbol"], "child");
    let middle_children = trace(&runtime, "middle");
    assert_eq!(middle_children["total"], 1, "{middle_children}");
    assert_eq!(middle_children["nodes"][0]["symbol"], "child");
    for (parent, child) in [
        ("parent", "middle"),
        ("parent", "child"),
        ("middle", "child"),
    ] {
        assert_source_proof(&runtime, parent, child, source);
    }
    for target in ["parent", "middle", "child", "sibling"] {
        assert_no_proof(&runtime, "anchor", target);
    }
    assert_no_proof(&runtime, "parent", "sibling");
    assert_eq!(
        runtime.repository_graph(&contains_scope(), 50, 50).unwrap()["total_edges"],
        3
    );
}

#[test]
fn refreshed_containment_matches_cold_index_and_drops_a_child_moved_to_top_level() {
    let fixture = Fixture::new(NESTED);
    let mut runtime = fixture.runtime();
    let revised = "// UTF-8 λ shifts every declaration offset.\nfn anchor() {}\nfn parent() {\n    fn child() { let value = 1; }\n}\nfn sibling() {}\n";
    fs::write(fixture.root.join(PATH), revised).unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    let refreshed_edges = assert_nested_proof(&runtime, revised);
    commit(&fixture.root);
    let nested_state = fixture.base.join("cold-nested");
    Runtime::index_committed_head(&fixture.root, &nested_state).unwrap();
    runtime = Runtime::open(&nested_state).unwrap();
    assert_eq!(assert_nested_proof(&runtime, revised), refreshed_edges);

    let moved = "fn anchor() {}\nfn parent() {}\nfn child() { let value = 1; }\nfn sibling() {}\n";
    fs::write(fixture.root.join(PATH), moved).unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_eq!(trace(&runtime, "parent")["total"], 0);
    assert_no_proof(&runtime, "parent", "child");
    let refreshed = runtime.repository_graph(&contains_scope(), 50, 50).unwrap();
    assert!(refreshed["edges"].as_array().unwrap().is_empty());
    commit(&fixture.root);
    let sibling_state = fixture.base.join("cold-siblings");
    Runtime::index_committed_head(&fixture.root, &sibling_state).unwrap();
    let cold = Runtime::open(&sibling_state).unwrap();
    assert_no_proof(&cold, "parent", "child");
    assert_eq!(
        cold.repository_graph(&contains_scope(), 50, 50).unwrap()["edges"],
        refreshed["edges"]
    );
}

fn effective_legacy_revision() -> u32 {
    125 + u32::from(cgrx_languages::EXPERIMENTAL_PHP_ENABLED) * 2
        + u32::from(cgrx_languages::EXPERIMENTAL_SWIFT_ENABLED) * 4
        + u32::from(cgrx_languages::EXPERIMENTAL_JAVASCRIPT_ENABLED) * 8
}

fn legacy_generation(revision: &str, policy: u32) -> u64 {
    let mut hasher = blake3::Hasher::new();
    hasher.update(revision.as_bytes());
    hasher.update(&policy.to_le_bytes());
    u64::from_le_bytes(hasher.finalize().as_bytes()[..8].try_into().unwrap())
        % 10_000_000_000_000_000
}

#[test]
fn legacy_false_proven_containment_fails_static_open_and_managed_cli_reindexes() {
    let fixture = Fixture::new(SIBLINGS);
    let fresh = GenerationReader::open_current(&fixture.state).unwrap();
    let mut legacy = stored(&fresh);
    let old_policy = effective_legacy_revision();
    assert_eq!(legacy["extraction_revision"], old_policy + 16);
    let alpha = symbol(&legacy, "alpha").clone();
    let beta = symbol(&legacy, "beta").clone();
    legacy["arcs"] = json!([{
        "source": alpha["node_id"],
        "target": beta["node_id"],
        "kind": "CONTAINS",
        "evidence": {
            "path": PATH,
            "span": {"start": beta["span_start"], "end": beta["span_end"]},
            "source_hash": legacy["path_hashes"][PATH],
            "resolver": "SYNTAX_EXACT", "confidence": "PROVEN",
            "assumptions": [], "counter_evidence": []
        }
    }]);
    legacy["extraction_revision"] = json!(old_policy);
    let mut snapshot: RepoSnapshot = fresh.snapshot().clone();
    snapshot.graph_generation = legacy_generation(&snapshot.repo_revision, old_policy);
    assert_ne!(snapshot.graph_generation, fresh.snapshot().graph_generation);
    legacy["snapshot"] = serde_json::to_value(&snapshot).unwrap();
    let legacy_bytes = serde_json::to_vec(&legacy).unwrap();
    let managed = fixture.root.join(".git/cgrx/managed");
    let mut writer = GenerationWriter::begin(&managed, snapshot.clone()).unwrap();
    writer.write_segment("nodes.seg", &legacy_bytes).unwrap();
    for name in ["edges.seg", "terms.fst"] {
        writer
            .write_segment(name, &fresh.read_segment(name).unwrap())
            .unwrap();
    }
    writer.validate().unwrap();
    writer.publish().unwrap();
    let pinned = GenerationReader::open_current(&managed).unwrap();
    assert_eq!(pinned.read_segment("nodes.seg").unwrap(), legacy_bytes);
    let error = Runtime::open(&managed)
        .err()
        .expect("legacy false proven edge must fail closed before normalization");
    assert_eq!(error.code(), "extraction_revision");

    let static_output = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["serve", "--state"])
        .arg(&managed)
        .stdin(Stdio::null())
        .output()
        .unwrap();
    assert_eq!(static_output.status.code(), Some(2));
    assert!(static_output.stdout.is_empty());
    assert!(String::from_utf8_lossy(&static_output.stderr).contains("extraction_revision"));
    assert_eq!(
        GenerationReader::open_current(&managed).unwrap().snapshot(),
        &snapshot,
        "static open must neither repair nor reactivate another generation"
    );

    for _ in 0..2 {
        let output = Command::new(env!("CARGO_BIN_EXE_cgrx"))
            .args(["status", "--root"])
            .arg(&fixture.root)
            .env("CGRX_RESPONSE_PROFILE", "full")
            .output()
            .unwrap();
        assert!(
            output.status.success(),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        let current = GenerationReader::open_current(&managed).unwrap();
        assert_eq!(current.snapshot(), fresh.snapshot());
        assert_eq!(stored(&current)["extraction_revision"], old_policy + 16);
        let runtime = Runtime::open(&managed).unwrap();
        assert_eq!(trace(&runtime, "alpha")["total"], 0);
        assert_no_proof(&runtime, "alpha", "beta");
        assert!(
            runtime.repository_graph(&contains_scope(), 50, 50).unwrap()["edges"]
                .as_array()
                .unwrap()
                .is_empty()
        );
        assert_eq!(
            pinned.read_segment("nodes.seg").unwrap(),
            legacy_bytes,
            "managed migration must preserve the immutable old artifact"
        );
    }
}
