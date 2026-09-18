#![cfg(feature = "experimental-php")]

use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, RepoSnapshot, Scope};
use cgrx_languages::{Provenance, RelationKind as ExtractRelation, Span, pack_for_path};
use cgrx_store::{GenerationReader, GenerationWriter};
use serde_json::{Value, json};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);
const EXTENSIONS: [&str; 6] = ["php", "phtml", "php3", "php4", "php5", "phps"];

struct Fixture {
    base: PathBuf,
    root: PathBuf,
    state: PathBuf,
    path: String,
}

impl Fixture {
    fn new(extension: &str, source: &str) -> Self {
        let base = std::env::temp_dir().join(format!(
            "cgrx-php-runtime-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&base).unwrap();
        let root = base.join("repo");
        let state = base.join("state");
        fs::create_dir(&root).unwrap();
        let path = format!("main.{extension}");
        fs::write(root.join(&path), source).unwrap();
        fs::write(root.join("other.php"), "<?php function Helper() {}\n").unwrap();
        fs::write(root.join("decoy.py"), "class Item:\n    pass\ndef Helper():\n    pass\n").unwrap();
        for args in [
            vec!["init", "-q"],
            vec!["add", "."],
            vec!["-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "fixture"],
        ] {
            assert!(Command::new("git").args(args).current_dir(&root).status().unwrap().success());
        }
        Runtime::index(&root, &state).unwrap();
        Self { base, root, state, path }
    }

    fn stored(&self) -> Value {
        let reader = GenerationReader::open_current(&self.state).unwrap();
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap()
    }

    fn publish_modified(&self, label: &str, stored: &Value) -> PathBuf {
        let state = self.base.join(label);
        let original = GenerationReader::open_current(&self.state).unwrap();
        let snapshot: RepoSnapshot = serde_json::from_value(stored["snapshot"].clone()).unwrap();
        let mut writer = GenerationWriter::begin(&state, snapshot).unwrap();
        writer.write_segment("nodes.seg", &serde_json::to_vec(stored).unwrap()).unwrap();
        for name in ["edges.seg", "terms.fst"] {
            writer.write_segment(name, &original.read_segment(name).unwrap()).unwrap();
        }
        writer.validate().unwrap();
        writer.publish().unwrap();
        state
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.base);
    }
}

fn scope() -> Scope {
    Scope { include: vec![], exclude: vec![], relation_kinds: vec![RelationKind::Calls], max_depth: 2 }
}

fn trace(runtime: &Runtime, path: &str) -> Value {
    runtime.trace_path("caller", Some(path), "callees", 1, &scope(), 50).unwrap()
}

fn assert_target(runtime: &Runtime, path: &str, source: &str) {
    let result = trace(runtime, path);
    assert_eq!(result["total"], 1, "{result}");
    let node = &result["nodes"][0];
    let start = source.find("function Helper").unwrap() + "function ".len();
    assert_eq!(node["path"], path);
    assert_eq!(node["symbol"], "Helper");
    assert_eq!(node["span"], json!({"start":start,"end":start+6}));
}

fn manifest() -> Value {
    serde_json::from_str(include_str!("../../../contracts/php_validation_v1.json")).unwrap()
}

fn matrix_source(case: &Value) -> String {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    fs::read_to_string(root.join(case["path"].as_str().unwrap())).unwrap()
}

#[test]
fn php_six_extension_matrix_checks_24_real_extraction_cells_and_persisted_calls() {
    let manifest = manifest();
    assert_eq!(manifest["maturity"], "experimental");
    let cases = manifest["cases"].as_array().unwrap();
    assert_eq!(cases.len(), EXTENSIONS.len());
    for (case, extension) in cases.iter().zip(EXTENSIONS) {
        assert_eq!(case["extension"], extension);
        let source = matrix_source(case);
        let fixture = Fixture::new(extension, &source);
        let path = Path::new(&fixture.path);
        let pack = pack_for_path(path).unwrap();
        assert_eq!(pack.id(), "php");
        let extraction = pack.extract(path, source.as_bytes()).unwrap();
        assert!(extraction.parser_error_ranges.is_empty());
        assert_eq!(extraction, pack.extract(path, source.as_bytes()).unwrap());
        for (relation, expected) in case["cells"].as_object().unwrap() {
            let start = expected["span"]["start"].as_u64().unwrap() as usize;
            let end = expected["span"]["end"].as_u64().unwrap() as usize;
            let span = Span { start, end };
            assert!(source.get(start..end).is_some());
            if relation == "UNRESOLVED" {
                assert!(expected["target"].is_null());
                assert!(extraction.unresolved.iter().any(|gap| gap.span == span));
            } else {
                let kind = match relation.as_str() {
                    "CALLS" => ExtractRelation::Calls,
                    "IMPORTS" => ExtractRelation::Imports,
                    "REFERENCE" => ExtractRelation::References,
                    _ => panic!("unreviewed relation"),
                };
                assert!(extraction.edges.iter().any(|edge| edge.relation == kind
                    && edge.span == span && edge.target == expected["target"].as_str().unwrap()),
                    "{extension}: {relation}: {extraction:?}");
            }
        }
        let call = extraction.edges.iter().find(|edge| edge.relation == ExtractRelation::Calls).unwrap();
        let Provenance::PhpFunction { caller, target } = call.provenance else {
            panic!("PHP calls must carry exact positional provenance");
        };
        assert_eq!(json!({"start":caller.start,"end":caller.end}), case["caller"]["span"]);
        assert_eq!(json!({"start":target.start,"end":target.end}), case["target"]["span"]);
        let runtime = Runtime::open(&fixture.state).unwrap();
        assert_target(&runtime, &fixture.path, &source);
        let stored = fixture.stored();
        let expected_hash = blake3::hash(source.as_bytes()).to_hex().to_string();
        let documents = stored["documents"].as_array().unwrap();
        let proofs: Vec<_> = documents.iter().filter_map(|doc| doc.get("php_function_target")).collect();
        assert_eq!(proofs.len(), 1);
        assert_eq!(proofs[0]["source_hash"], expected_hash);
        assert_eq!(proofs[0]["caller"], case["caller"]["span"]);
        assert_eq!(proofs[0]["target"], case["target"]["span"]);
        let arcs: Vec<_> = stored["arcs"].as_array().unwrap().iter()
            .filter(|arc| arc["kind"] == "CALLS" && arc["evidence"]["path"] == fixture.path).collect();
        assert_eq!(arcs.len(), 1);
        assert_eq!(arcs[0]["evidence"]["span"], case["cells"]["CALLS"]["span"]);
        assert_eq!(arcs[0]["evidence"]["source_hash"], expected_hash);
        assert_eq!(arcs[0]["evidence"]["confidence"], "PROVEN");
        // Imported external types remain source evidence, not guessed PHP->Python edges.
        assert!(stored["arcs"].as_array().unwrap().iter().all(|arc|
            arc["evidence"]["path"] != fixture.path || arc["kind"] == "CALLS" || arc["kind"] == "CONTAINS"));
        for provenance in ["IMPORTS", "REFERENCES", "UNRESOLVED"] {
            assert!(documents.iter().any(|doc| doc["path"] == fixture.path && doc["provenance"] == provenance), "{provenance}");
        }
        let gap = &case["cells"]["UNRESOLVED"]["span"];
        assert!(runtime.coverage().dynamic_dispatch.contains(&format!("{}:{}-{}", fixture.path, gap["start"], gap["end"])));
        assert!(documents.iter().all(|doc| doc.get("php_function_target").is_none() || doc["provenance"] == "CALLS"));
    }
}

#[test]
fn php_callsite_bytes_and_arc_order_survive_reopen_reindex_utf8_and_crlf() {
    let source = "<?php\r\n// Привет\r\nfunction Helper() {}\r\nfunction caller() { Helper(); HELPER(); }\r\nclass Helper {}\r\n";
    let fixture = Fixture::new("php", source);
    let stored = fixture.stored();
    let reader = GenerationReader::open_current(&fixture.state).unwrap();
    let before = reader.read_segment("nodes.seg").unwrap();
    for _ in 0..3 {
        assert_target(&Runtime::open(&fixture.state).unwrap(), &fixture.path, source);
        Runtime::index(&fixture.root, &fixture.state).unwrap();
        assert_eq!(GenerationReader::open_current(&fixture.state).unwrap().read_segment("nodes.seg").unwrap(), before);
    }
    let arcs: Vec<_> = stored["arcs"].as_array().unwrap().iter()
        .filter(|arc| arc["kind"] == "CALLS" && arc["evidence"]["path"] == fixture.path).collect();
    assert_eq!(arcs.len(), 2);
    let mut sites: Vec<_> = arcs.iter().map(|arc| {
        let span = &arc["evidence"]["span"];
        &source[span["start"].as_u64().unwrap() as usize..span["end"].as_u64().unwrap() as usize]
    }).collect();
    sites.sort();
    assert_eq!(sites, ["HELPER()", "Helper()"]);
    let independent = fixture.base.join("independent");
    Runtime::index(&fixture.root, &independent).unwrap();
    assert_eq!(GenerationReader::open_current(&independent).unwrap().read_segment("nodes.seg").unwrap(), before);
}

#[test]
fn php_refresh_changes_exact_spans_and_rejects_removed_or_ambiguous_targets() {
    let source = "<?php\nfunction Helper() {}\nfunction caller() { HELPER(); }\n";
    for extension in EXTENSIONS {
        let fixture = Fixture::new(extension, source);
        let mut runtime = Runtime::open(&fixture.state).unwrap();
        assert_target(&runtime, &fixture.path, source);
        let shifted = source.replace("function Helper", "// shifted Привет\nfunction Helper");
        fs::write(fixture.root.join(&fixture.path), &shifted).unwrap();
        assert!(runtime.refresh(&fixture.root).unwrap());
        assert_target(&runtime, &fixture.path, &shifted);
        let changed = runtime.snapshot().clone();
        assert!(!runtime.refresh(&fixture.root).unwrap());
        assert_eq!(runtime.snapshot(), &changed);
        for bad in [
            source.replace("function Helper() {}", ""),
            source.replace("function Helper() {}", "if ($enabled) { function Helper() {} }"),
            source.replace("function Helper() {}", "function Helper() {} function HELPER() {}"),
            format!("{source}function broken("),
        ] {
            fs::write(fixture.root.join(&fixture.path), &bad).unwrap();
            assert!(runtime.refresh(&fixture.root).unwrap());
            assert_eq!(trace(&runtime, &fixture.path)["total"], 0);
            assert!(!runtime.coverage().dynamic_dispatch.is_empty());
            // Persisted base generations remain immutable; reopening then
            // applying the current worktree must reproduce the same abstention.
            let mut reopened = Runtime::open(&fixture.state).unwrap();
            reopened.refresh(&fixture.root).unwrap();
            assert_eq!(trace(&reopened, &fixture.path)["total"], 0);
        }
        fs::write(fixture.root.join(&fixture.path), source).unwrap();
        assert!(runtime.refresh(&fixture.root).unwrap());
        assert_target(&runtime, &fixture.path, source);
        assert_eq!(runtime.snapshot(), Runtime::open(&fixture.state).unwrap().snapshot());
    }
}

#[test]
fn php_rename_deletion_and_recreation_do_not_retarget_to_another_file() {
    let source = "<?php function Helper() {} function caller() { Helper(); }";
    let fixture = Fixture::new("php", source);
    let mut runtime = Runtime::open(&fixture.state).unwrap();
    fs::rename(fixture.root.join(&fixture.path), fixture.root.join("moved.phtml")).unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_target(&runtime, "moved.phtml", source);
    assert!(runtime.trace_path("caller", Some(&fixture.path), "callees", 1, &scope(), 50).is_err());
    fs::write(fixture.root.join(&fixture.path), "<?php function caller() { Helper(); }").unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_eq!(trace(&runtime, &fixture.path)["total"], 0);
    fs::remove_file(fixture.root.join("moved.phtml")).unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_eq!(trace(&runtime, &fixture.path)["total"], 0);
    fs::write(fixture.root.join(&fixture.path), source).unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_target(&runtime, &fixture.path, source);
}

#[test]
fn php_dynamic_imported_namespaced_and_conditional_calls_never_guess() {
    for source in [
        "<?php function caller() { Helper(); }",
        "<?php function Helper() {} function HELPER() {} function caller() { Helper(); }",
        "<?php if ($x) { function Helper() {} } function caller() { Helper(); }",
        "<?php function outer() { function Helper() {} } function caller() { Helper(); }",
        "<?php namespace Example; function Helper() {} function caller() { Helper(); }",
        "<?php use function Vendor\\Helper; function caller() { Helper(); }",
        "<?php use function Vendor\\{Helper}; function caller() { Helper(); }",
        "<?php class Decoy { function Helper() {} } function caller() { Helper(); }",
        "<?php function Helper() {} function caller($Helper) { $Helper(); }",
        "<?php function Helper() {} function caller($x) { $x->Helper(); }",
        "<?php function Helper() {} function caller($x) { $x?->Helper(); }",
        "<?php function Helper() {} function caller() { Decoy::Helper(); }",
        "<?php function Helper() {} function caller() { new Helper(); }",
        "<?php function Helper() {} function caller() { Helper(...); }",
        "<?php function Helper() {} function caller() { (fn() => Helper())(); }",
        "<?php function Helper() {} function caller() { consume(function() { Helper(); }); }",
    ] {
        let fixture = Fixture::new("php", source);
        let runtime = Runtime::open(&fixture.state).unwrap();
        assert_eq!(trace(&runtime, &fixture.path)["total"], 0, "{source}");
        assert!(!runtime.coverage().dynamic_dispatch.is_empty(), "{source}");
        assert!(fixture.stored()["arcs"].as_array().unwrap().iter().all(|arc|
            arc["kind"] != "CALLS" || arc["evidence"]["path"] != fixture.path));
    }
}

#[test]
fn php_foreign_language_calls_cannot_bind_to_php_symbols() {
    let fixture = Fixture::new("php", "<?php function UniquePhpTarget() {}");
    fs::write(fixture.root.join("foreign.py"), "def caller():\n    UniquePhpTarget()\n").unwrap();
    let mut runtime = Runtime::open(&fixture.state).unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_eq!(trace(&runtime, "foreign.py")["total"], 0);
}

#[test]
fn php_missing_or_corrupted_document_proof_cannot_reuse_persisted_arcs() {
    let case = &manifest()["cases"][0];
    let source = matrix_source(case);
    let fixture = Fixture::new("php", &source);
    let baseline = fixture.stored();
    let docs = baseline["documents"].as_array().unwrap();
    let call_index = docs.iter().position(|doc| doc["path"] == fixture.path && doc.get("php_function_target").is_some()).unwrap();
    let target_start = case["target"]["span"]["start"].as_u64().unwrap();
    let target_index = docs.iter().position(|doc| doc["path"] == fixture.path && doc["provenance"] == "SYNTAX" && doc["span_start"] == target_start).unwrap();
    assert_target(&Runtime::open(&fixture.state).unwrap(), &fixture.path, &source);
    for mode in 0..10 {
        let mut corrupted = baseline.clone();
        let docs = corrupted["documents"].as_array_mut().unwrap();
        match mode {
            0 => { docs[call_index].as_object_mut().unwrap().remove("php_function_target"); }
            1 => { docs[call_index]["php_function_target"]["source_hash"] = json!("00".repeat(32)); }
            2 => { docs[call_index]["php_function_target"]["caller"]["start"] = json!(0); }
            3 => { docs[call_index]["php_function_target"]["target"]["start"] = json!(0); }
            4 => { docs[call_index]["semantic_tags"] = json!(["EXACT_CALL"]); }
            5 => { docs[call_index]["semantic_tags"] = json!(["PHP_FUNCTION_CALL"]); }
            6 => { docs[call_index]["text"] = json!("Other()"); }
            7 => {
                let start = source.rfind("Helper()").unwrap();
                docs[call_index]["php_function_target"]["target"] = json!({"start":start,"end":start+6});
            }
            8 => {
                let mut duplicate = docs[target_index].clone();
                duplicate["node_id"] = json!(u64::MAX);
                docs.push(duplicate);
            }
            9 => { docs.remove(target_index); }
            _ => unreachable!(),
        }
        let state = fixture.publish_modified(&format!("corrupt-{mode}"), &corrupted);
        let runtime = Runtime::open(&state).unwrap();
        assert_eq!(trace(&runtime, &fixture.path)["total"], 0, "mode {mode}");
        let span = &case["cells"]["CALLS"]["span"];
        assert!(runtime.coverage().dynamic_dispatch.contains(&format!("{}:{}-{}", fixture.path, span["start"], span["end"])), "mode {mode}");
    }
}

#[test]
fn php_provenance_hash_includes_both_endpoint_spans() {
    let path = Path::new("main.php");
    let source = b"<?php function Helper() {} function caller() { Helper(); }";
    let extraction = pack_for_path(path).unwrap().extract(path, source).unwrap();
    let expected = extraction.stable_hash();
    for caller_changed in [false, true] {
        let mut altered = extraction.clone();
        let edge = altered.edges.iter_mut().find(|edge| edge.relation == ExtractRelation::Calls).unwrap();
        let Provenance::PhpFunction { mut caller, mut target } = edge.provenance else { panic!("missing positional proof") };
        if caller_changed { caller.start += 1; } else { target.start += 1; }
        edge.provenance = Provenance::PhpFunction { caller, target };
        assert_ne!(altered.stable_hash(), expected);
    }
}
