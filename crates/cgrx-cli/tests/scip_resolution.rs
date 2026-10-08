use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};
use cgrx_store::{GenerationReader, GenerationWriter};
use scip::types::{Document, Index, Occurrence, PositionEncoding, SymbolRole};
use serde_json::Value;

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
            "cgrx-scip-{label}-{}-{nonce}-{sequence}",
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
    let status = Command::new("git")
        .args(args)
        .current_dir(root)
        .status()
        .expect("git executable");
    assert!(status.success(), "git command failed: {args:?}");
}

fn occurrence(line: i32, start: i32, end: i32, symbol: &str, definition: bool) -> Occurrence {
    let mut occurrence = Occurrence::new();
    occurrence.range = vec![line, start, end];
    occurrence.symbol = symbol.to_owned();
    if definition {
        occurrence.symbol_roles = SymbolRole::Definition as i32;
    }
    occurrence
}

#[test]
fn scip_discharges_a_dynamic_rust_method_call_with_proven_evidence() {
    let source = concat!(
        "struct Worker;\n",
        "impl Worker {\n",
        "    fn work(&self) {}\n",
        "}\n",
        // An owned receiver needs autoref; native first-candidate parameter
        // proofs deliberately leave this case to compiler-backed resolution.
        "fn caller(worker: Worker) {\n",
        "    worker.work();\n",
        "}\n",
    );
    let repository = TestDirectory::new("repository");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(repository.path().join("main.rs"), source).expect("write source");
    git(repository.path(), &["add", "main.rs"]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let artifact = TestDirectory::new("artifact");
    let scip_path = artifact.path().join("index.scip");
    let symbol = "rust-analyzer cargo fixture . Worker#work().";
    let mut document = Document::new();
    document.language = "rust".to_owned();
    document.relative_path = "main.rs".to_owned();
    document.text = source.to_owned();
    document.position_encoding = PositionEncoding::UTF8CodeUnitOffsetFromLineStart.into();
    document.occurrences = vec![
        occurrence(2, 7, 11, symbol, true),
        occurrence(5, 11, 15, symbol, false),
    ];
    let mut index = Index::new();
    index.documents.push(document);
    scip::write_message_to_file(&scip_path, index).expect("write SCIP index");

    let syntax_state = TestDirectory::new("syntax-state");
    let syntax_report =
        Runtime::index(repository.path(), syntax_state.path()).expect("index syntax graph");
    let syntax = Runtime::open(syntax_state.path()).expect("open syntax graph");
    let syntax_coverage = syntax
        .check_index_coverage(&["main.rs".to_owned()], &[], 0, 100)
        .expect("check syntax coverage");
    assert_eq!(syntax_coverage["paths"][0]["status"], "partial");

    let report = Runtime::index_with_scip(repository.path(), syntax_state.path(), &scip_path)
        .expect("index graph with SCIP");
    assert_eq!(report.scip_edges, 1);
    assert_ne!(
        report.snapshot.graph_generation,
        syntax_report.snapshot.graph_generation
    );
    let semantic = Runtime::open(syntax_state.path()).expect("open semantic graph");
    let coverage = semantic
        .check_index_coverage(&["main.rs".to_owned()], &[], 0, 100)
        .expect("check semantic coverage");
    assert_eq!(coverage["paths"][0]["status"], "indexed");
    assert_eq!(coverage["paths"][0]["gap_count"], 0);

    let served = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args([
            "serve",
            "--root",
            repository.path().to_str().expect("UTF-8 repository path"),
            "--scip",
            scip_path.to_str().expect("UTF-8 SCIP path"),
        ])
        .output()
        .expect("run managed MCP server");
    assert!(
        served.status.success(),
        "serve failed: {}",
        String::from_utf8_lossy(&served.stderr)
    );
}

fn argument_reference_fixture(
    callee: bool,
    argument: bool,
    unknown_callee: bool,
) -> (TestDirectory, TestDirectory, scip::types::Index) {
    let source = concat!(
        "struct Worker;\n",
        "impl Worker {\n",
        "    fn work(&self, _callback: fn()) {}\n",
        "}\n",
        "fn helper() {}\n",
        "fn caller(worker: Worker) {\n",
        "    worker.work(helper);\n",
        "}\n",
    );
    let repository = TestDirectory::new("argument-reference");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(repository.path().join("main.rs"), source).unwrap();
    git(repository.path(), &["add", "main.rs"]);
    git(
        repository.path(),
        &["commit", "-qm", "SCIP argument reference"],
    );
    let artifact = TestDirectory::new("argument-reference-artifact");
    let method = "rust-analyzer cargo fixture . Worker#work().";
    let helper = "rust-analyzer cargo fixture . helper().";
    let mut document = Document::new();
    document.language = "rust".to_owned();
    document.relative_path = "main.rs".to_owned();
    document.text = source.to_owned();
    document.position_encoding = PositionEncoding::UTF8CodeUnitOffsetFromLineStart.into();
    document.occurrences = vec![
        occurrence(2, 7, 11, method, true),
        occurrence(4, 3, 9, helper, true),
    ];
    if callee {
        document
            .occurrences
            .push(occurrence(6, 11, 15, method, false));
    }
    if argument {
        document
            .occurrences
            .push(occurrence(6, 16, 22, helper, false));
    }
    if unknown_callee {
        document.occurrences.push(occurrence(
            6,
            11,
            15,
            "rust-analyzer cargo unresolved . work().",
            false,
        ));
    }
    let mut index = Index::new();
    index.documents.push(document);
    (repository, artifact, index)
}

fn argument_reference_runtime(
    callee: bool,
    argument: bool,
    unknown_callee: bool,
) -> (TestDirectory, TestDirectory, Runtime, u64) {
    let (repository, artifact, index) =
        argument_reference_fixture(callee, argument, unknown_callee);
    index_fixture(repository, artifact, index)
}

fn index_fixture(
    repository: TestDirectory,
    artifact: TestDirectory,
    index: Index,
) -> (TestDirectory, TestDirectory, Runtime, u64) {
    let scip_path = artifact.path().join("index.scip");
    scip::write_message_to_file(&scip_path, index).unwrap();
    let state = artifact.path().join("state");
    let report = Runtime::index_with_scip(repository.path(), &state, &scip_path).unwrap();
    let runtime = Runtime::open(&state).unwrap();
    (repository, artifact, runtime, report.scip_edges)
}

fn calls_scope() -> Scope {
    Scope {
        include: vec![],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    }
}

#[test]
fn scip_argument_reference_cannot_discharge_the_enclosing_method_call() {
    let (_repository, _artifact, runtime, semantic_edges) =
        argument_reference_runtime(false, true, false);
    assert_eq!(
        semantic_edges, 0,
        "A callback argument is a reference, not the call's target."
    );
    let helper = runtime
        .find_usages("helper", Some("main.rs"), &calls_scope(), 1, 10)
        .unwrap();
    assert_eq!(helper["total"], 0);
    let coverage = runtime
        .check_index_coverage(&["main.rs".to_owned()], &[], 0, 100)
        .unwrap();
    assert_eq!(coverage["paths"][0]["status"], "partial");
}

#[test]
fn scip_argument_reference_does_not_hide_a_unique_callee_reference() {
    let (repository, _artifact, runtime, semantic_edges) =
        argument_reference_runtime(true, true, false);
    assert_eq!(semantic_edges, 1);
    let usages = runtime
        .find_usages("work", Some("main.rs"), &calls_scope(), 1, 10)
        .unwrap();
    assert_eq!(usages["total"], 1);
    assert_eq!(usages["usages"][0]["source"]["symbol"], "caller");
    let source = fs::read(repository.path().join("main.rs")).unwrap();
    let span = &usages["usages"][0]["site"]["span"];
    assert_eq!(
        &source[span["start"].as_u64().unwrap() as usize..span["end"].as_u64().unwrap() as usize],
        b"worker.work(helper)"
    );
    assert_eq!(usages["usages"][0]["resolver"], "SCIP_CONFIRMED");
}

#[test]
fn scip_unresolved_competing_callee_identity_remains_a_gap() {
    let (_repository, _artifact, runtime, semantic_edges) =
        argument_reference_runtime(true, false, true);
    assert_eq!(semantic_edges, 0);
    assert_eq!(
        runtime
            .find_usages("work", Some("main.rs"), &calls_scope(), 1, 10)
            .unwrap()["total"],
        0
    );
}

#[test]
fn scip_nested_argument_reference_does_not_become_an_outer_call() {
    let (repository, artifact, mut index) = argument_reference_fixture(false, true, false);
    let source = index.documents[0]
        .text
        .replace("_callback: fn()", "_callback: ()")
        .replace("worker.work(helper)", "worker.work(helper())");
    index.documents[0].text.clone_from(&source);
    fs::write(repository.path().join("main.rs"), &source).unwrap();
    git(repository.path(), &["add", "main.rs"]);
    git(
        repository.path(),
        &["commit", "-qm", "Nested argument call"],
    );
    let (_repository, _artifact, runtime, semantic_edges) =
        index_fixture(repository, artifact, index);
    assert_eq!(semantic_edges, 0);
    let usages = runtime
        .find_usages("helper", Some("main.rs"), &calls_scope(), 1, 10)
        .unwrap();
    assert_eq!(usages["total"], 1);
    let span = &usages["usages"][0]["site"]["span"];
    assert_eq!(
        &source[span["start"].as_u64().unwrap() as usize..span["end"].as_u64().unwrap() as usize],
        "helper()"
    );
    assert_ne!(usages["usages"][0]["resolver"], "SCIP_CONFIRMED");
}

#[test]
fn scip_duplicate_references_and_optional_document_text_keep_a_unique_callee() {
    let (repository, artifact, mut index) = argument_reference_fixture(true, true, false);
    // Some indexers omit text, and repeated references to one identity are not
    // competing symbols. Neither should discard the exact callee reference.
    index.documents[0].text.clear();
    let reference = index.documents[0].occurrences[2].clone();
    index.documents[0].occurrences.push(reference);
    let (_repository, _artifact, runtime, semantic_edges) =
        index_fixture(repository, artifact, index);
    assert_eq!(semantic_edges, 1);
    assert_eq!(
        runtime
            .find_usages("work", Some("main.rs"), &calls_scope(), 1, 10)
            .unwrap()["total"],
        1
    );
}

#[test]
fn scip_local_alternative_and_external_trait_metadata_remain_gaps() {
    for local_alternative in [true, false] {
        let (repository, artifact, mut index) = argument_reference_fixture(true, false, false);
        if local_alternative {
            index.documents[0]
                .occurrences
                .push(occurrence(6, 11, 15, "local 0", false));
        } else {
            let mut symbol = scip::types::SymbolInformation::new();
            symbol.symbol = index.documents[0].occurrences[0].symbol.clone();
            symbol.kind = scip::types::symbol_information::Kind::TraitMethod.into();
            index.external_symbols.push(symbol);
        }
        let (_repository, _artifact, runtime, semantic_edges) =
            index_fixture(repository, artifact, index);
        assert_eq!(semantic_edges, 0);
        assert_eq!(
            runtime
                .find_usages("work", Some("main.rs"), &calls_scope(), 1, 10)
                .unwrap()["total"],
            0
        );
    }
}

fn publish_policy_fixture(
    reader: &GenerationReader,
    state: &Path,
    revision: Option<u32>,
    clear_count: bool,
    clear_input_hash: bool,
) {
    let mut stored: Value =
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap();
    let mut snapshot = reader.snapshot().clone();
    snapshot.graph_generation = (snapshot.graph_generation + 1) % 10_000_000_000_000_000;
    stored["snapshot"] = serde_json::to_value(&snapshot).unwrap();
    if let Some(revision) = revision {
        stored["scip_resolution_revision"] = serde_json::json!(revision);
    } else {
        stored
            .as_object_mut()
            .unwrap()
            .remove("scip_resolution_revision");
    }
    if clear_count {
        stored["scip_edges"] = serde_json::json!(0);
    }
    if clear_input_hash {
        stored.as_object_mut().unwrap().remove("scip_input_hash");
    }
    let mut writer = GenerationWriter::begin(state, snapshot).unwrap();
    writer
        .write_segment("nodes.seg", &serde_json::to_vec(&stored).unwrap())
        .unwrap();
    for name in ["edges.seg", "terms.fst"] {
        writer
            .write_segment(name, &reader.read_segment(name).unwrap())
            .unwrap();
    }
    writer.validate().unwrap();
    writer.publish().unwrap();
}

#[test]
fn stale_semantic_policies_are_quarantined_and_reindexed_at_the_same_commit() {
    let (repository, artifact, _runtime, _edges) = argument_reference_runtime(true, false, false);
    let scip_path = artifact.path().join("index.scip");
    let reader = GenerationReader::open_current(artifact.path().join("state")).unwrap();
    let current: Value =
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap();
    let revision = u32::try_from(current["scip_resolution_revision"].as_u64().unwrap()).unwrap();
    for (label, policy, clear_count, clear_input_hash) in [
        ("legacy", None, false, false),
        ("obsolete", Some(revision - 1), false, false),
        ("future", Some(revision + 1), false, false),
        ("legacy-zero-count", None, true, false),
        ("missing-input-identity", Some(revision), false, true),
    ] {
        let state = artifact.path().join(label);
        publish_policy_fixture(&reader, &state, policy, clear_count, clear_input_hash);
        let pinned = GenerationReader::open_current(&state).unwrap();
        let old_bytes = pinned.read_segment("nodes.seg").unwrap();
        let error = Runtime::open(&state)
            .err()
            .expect("obsolete semantic policy must fail");
        assert_eq!(error.code(), "scip_resolution_revision", "{label}");
        let report = Runtime::index_with_scip(repository.path(), &state, &scip_path).unwrap();
        assert_eq!(report.snapshot, *reader.snapshot(), "{label}");
        assert_eq!(report.scip_edges, 1, "{label}");
        let runtime = Runtime::open(&state).unwrap();
        assert_eq!(
            runtime
                .find_usages("work", Some("main.rs"), &calls_scope(), 1, 10)
                .unwrap()["total"],
            1,
            "{label}"
        );
        assert_eq!(
            Runtime::index_with_scip(repository.path(), &state, &scip_path).unwrap(),
            report
        );
        assert_eq!(pinned.read_segment("nodes.seg").unwrap(), old_bytes);
    }
}

#[test]
fn managed_startup_replaces_an_obsolete_semantic_policy() {
    let (repository, artifact, _runtime, _edges) = argument_reference_runtime(true, false, false);
    let reader = GenerationReader::open_current(artifact.path().join("state")).unwrap();
    let managed = repository.path().join(".git/cgrx/managed");
    publish_policy_fixture(&reader, &managed, None, false, false);
    let pinned = GenerationReader::open_current(&managed).unwrap();
    let old_bytes = pinned.read_segment("nodes.seg").unwrap();
    let output = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["status", "--root"])
        .arg(repository.path())
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let runtime = Runtime::open(&managed).unwrap();
    assert_eq!(
        runtime
            .find_usages("work", Some("main.rs"), &calls_scope(), 1, 10)
            .unwrap()["total"],
        0,
        "Without a supplied SCIP index, startup rebuilds native evidence."
    );
    assert_eq!(pinned.read_segment("nodes.seg").unwrap(), old_bytes);
}
