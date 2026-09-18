#![cfg(feature = "experimental-php")]
use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, RepoSnapshot, Scope};
use cgrx_store::{GenerationReader, GenerationWriter};
use serde_json::{Value, json};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);
const SOURCE: &str = r#"<?php
// Пример: exact UTF-8 byte offsets, not character offsets.
namespace Vendor { class Payload {} interface Contract {} }
namespace Other { class Payload {} function unrelated(Payload $value): Payload {} }
namespace App {
use Vendor\Payload as Item;
use Vendor as Library;
function consume(Item $item): Library\Contract {}
class Handler { public ?Item $property; }
}
"#;

struct Fixture {
    base: PathBuf,
    root: PathBuf,
    state: PathBuf,
    path: String,
}
impl Fixture {
    fn new(extension: &str, source: &str) -> Self {
        let base = std::env::temp_dir().join(format!(
            "cgrx-php-types-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&base).unwrap();
        let root = base.join("repo");
        let state = base.join("state");
        fs::create_dir(&root).unwrap();
        let path = format!("main.{extension}");
        fs::write(root.join(&path), source).unwrap();
        fs::write(
            root.join("foreign.php"),
            "<?php namespace Vendor; class Payload {} class Missing {}\n",
        )
        .unwrap();
        fs::write(root.join("decoy.py"), "class Payload:\n    pass\n").unwrap();
        for args in [
            vec!["init", "-q"],
            vec!["config", "core.autocrlf", "false"],
            vec!["add", "."],
            vec![
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-qm",
                "fixture",
            ],
        ] {
            assert!(
                Command::new("git")
                    .args(args)
                    .current_dir(&root)
                    .status()
                    .unwrap()
                    .success()
            );
        }
        Runtime::index(&root, &state).unwrap();
        Self {
            base,
            root,
            state,
            path,
        }
    }
    fn stored(&self) -> Value {
        let reader = GenerationReader::open_current(&self.state).unwrap();
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap()
    }
    fn publish(&self, name: &str, stored: &Value) -> PathBuf {
        let state = self.base.join(name);
        let reader = GenerationReader::open_current(&self.state).unwrap();
        let snapshot: RepoSnapshot = serde_json::from_value(stored["snapshot"].clone()).unwrap();
        let mut writer = GenerationWriter::begin(&state, snapshot).unwrap();
        writer
            .write_segment("nodes.seg", &serde_json::to_vec(stored).unwrap())
            .unwrap();
        for segment in ["edges.seg", "terms.fst"] {
            writer
                .write_segment(segment, &reader.read_segment(segment).unwrap())
                .unwrap();
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

fn scope(relation: RelationKind) -> Scope {
    Scope {
        include: vec![],
        exclude: vec![],
        relation_kinds: vec![relation],
        max_depth: 1,
    }
}
fn trace(runtime: &Runtime, path: &str, owner: &str, relation: RelationKind) -> Value {
    runtime
        .trace_path(owner, Some(path), "callees", 1, &scope(relation), 50)
        .unwrap()
}
fn target_starts(value: &Value) -> Vec<usize> {
    let mut positions: Vec<_> = value["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|n| n["span"]["start"].as_u64().unwrap() as usize)
        .collect();
    positions.sort();
    positions
}
fn targets(source: &str, other: bool) -> Vec<usize> {
    let payload = if other {
        source.rfind("class Payload").unwrap()
    } else {
        source.find("class Payload").unwrap()
    } + 6;
    let contract = source.find("interface Contract").unwrap() + 10;
    let mut positions = vec![payload, contract];
    positions.sort();
    positions
}

#[test]
fn php_type_relationships_survive_storage_and_all_six_extensions_with_exact_evidence() {
    for extension in ["php", "phtml", "php3", "php4", "php5", "phps"] {
        let source = SOURCE.replace('\n', "\r\n");
        let fixture = Fixture::new(extension, &source);
        let runtime = Runtime::open(&fixture.state).unwrap();
        for relation in [RelationKind::References, RelationKind::Imports] {
            let result = trace(&runtime, &fixture.path, "consume", relation);
            assert_eq!(target_starts(&result), targets(&source, false), "{result}");
            assert!(
                result["nodes"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .all(|n| n["path"] == fixture.path)
            );
            assert_eq!(
                result,
                trace(
                    &Runtime::open(&fixture.state).unwrap(),
                    &fixture.path,
                    "consume",
                    relation
                )
            );
        }
        assert_eq!(
            trace(&runtime, &fixture.path, "consume", RelationKind::Calls)["total"],
            0
        );
        assert_eq!(
            trace(&runtime, &fixture.path, "Handler", RelationKind::References)["total"],
            1
        );
        let stored = fixture.stored();
        let owner = stored["documents"]
            .as_array()
            .unwrap()
            .iter()
            .find(|d| d["qualified_name"] == "consume" && d["provenance"] == "SYNTAX")
            .unwrap()["node_id"]
            .clone();
        let arcs: Vec<_> = stored["arcs"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|a| {
                a["source"] == owner && matches!(a["kind"].as_str(), Some("REFERENCES" | "IMPORTS"))
            })
            .collect();
        assert_eq!(arcs.len(), 4);
        for arc in arcs {
            let proof = &arc["evidence"];
            let start = proof["span"]["start"].as_u64().unwrap() as usize;
            let end = proof["span"]["end"].as_u64().unwrap() as usize;
            let snippet = &source[start..end];
            assert_eq!(
                proof["source_hash"],
                blake3::hash(source.as_bytes()).to_hex().to_string()
            );
            assert!(
                if arc["kind"] == "IMPORTS" {
                    matches!(snippet, "Vendor\\Payload as Item" | "Vendor as Library")
                } else {
                    matches!(snippet, "Item" | "Library\\Contract")
                },
                "{arc}"
            );
        }
        let reindexed = fixture.base.join("independent");
        Runtime::index(&fixture.root, &reindexed).unwrap();
        let bytes = GenerationReader::open_current(&reindexed)
            .unwrap()
            .read_segment("nodes.seg")
            .unwrap();
        assert_eq!(
            bytes,
            GenerationReader::open_current(&fixture.state)
                .unwrap()
                .read_segment("nodes.seg")
                .unwrap()
        );
    }
}

#[test]
fn php_type_alias_edits_rebind_exact_targets_and_noop_refresh_is_stable() {
    let fixture = Fixture::new("php", SOURCE);
    let pinned = GenerationReader::open_current(&fixture.state).unwrap();
    let original_bytes = pinned.read_segment("nodes.seg").unwrap();
    let mut runtime = Runtime::open(&fixture.state).unwrap();
    let changed = SOURCE.replace(
        "use Vendor\\Payload as Item;",
        "use Other\\Payload as Item;",
    );
    fs::write(fixture.root.join(&fixture.path), &changed).unwrap();
    runtime.refresh(&fixture.root).unwrap();
    for relation in [RelationKind::References, RelationKind::Imports] {
        assert_eq!(
            target_starts(&trace(&runtime, &fixture.path, "consume", relation)),
            targets(&changed, true)
        );
    }
    let result = trace(&runtime, &fixture.path, "consume", RelationKind::References);
    runtime.refresh(&fixture.root).unwrap();
    assert_eq!(
        result,
        trace(&runtime, &fixture.path, "consume", RelationKind::References)
    );
    let mut reopened = Runtime::open(&fixture.state).unwrap();
    reopened.refresh(&fixture.root).unwrap();
    assert_eq!(
        result,
        trace(
            &reopened,
            &fixture.path,
            "consume",
            RelationKind::References
        )
    );
    assert_eq!(pinned.read_segment("nodes.seg").unwrap(), original_bytes);
    let absent = changed.replace("namespace Other { class Payload {}", "namespace Other {");
    fs::write(fixture.root.join(&fixture.path), &absent).unwrap();
    runtime.refresh(&fixture.root).unwrap();
    assert_eq!(
        trace(&runtime, &fixture.path, "consume", RelationKind::References)["total"],
        1
    );
    assert_eq!(
        trace(&runtime, &fixture.path, "consume", RelationKind::Imports)["total"],
        1
    );
}

#[test]
fn php_type_file_rename_delete_recreation_never_targets_a_foreign_file() {
    let fixture = Fixture::new("php", SOURCE);
    let mut runtime = Runtime::open(&fixture.state).unwrap();
    fs::rename(
        fixture.root.join(&fixture.path),
        fixture.root.join("renamed.phtml"),
    )
    .unwrap();
    runtime.refresh(&fixture.root).unwrap();
    assert!(
        runtime
            .trace_path(
                "consume",
                Some(&fixture.path),
                "callees",
                1,
                &scope(RelationKind::References),
                50
            )
            .is_err()
    );
    assert_eq!(
        target_starts(&trace(
            &runtime,
            "renamed.phtml",
            "consume",
            RelationKind::References
        )),
        targets(SOURCE, false)
    );
    fs::remove_file(fixture.root.join("renamed.phtml")).unwrap();
    runtime.refresh(&fixture.root).unwrap();
    assert!(
        runtime
            .trace_path(
                "consume",
                Some("renamed.phtml"),
                "callees",
                1,
                &scope(RelationKind::References),
                50
            )
            .is_err()
    );
    fs::write(fixture.root.join(&fixture.path), SOURCE).unwrap();
    runtime.refresh(&fixture.root).unwrap();
    assert_eq!(
        target_starts(&trace(
            &runtime,
            &fixture.path,
            "consume",
            RelationKind::References
        )),
        targets(SOURCE, false)
    );
}

#[test]
fn php_type_proof_corruption_cannot_resurrect_serialized_reference_or_import_arcs() {
    let fixture = Fixture::new("php", SOURCE);
    let original = fixture.stored();
    assert_eq!(
        trace(
            &Runtime::open(&fixture.state).unwrap(),
            &fixture.path,
            "consume",
            RelationKind::References
        )["total"],
        2
    );
    let docs = original["documents"].as_array().unwrap();
    let owner_start = SOURCE.find("function consume").unwrap() + 9;
    let site_index = docs
        .iter()
        .position(|d| {
            d["php_type_target"]["owner"]["start"] == owner_start
                && d["qualified_name"] == "Payload"
        })
        .unwrap();
    let target_index = docs
        .iter()
        .position(|d| {
            d["path"] == fixture.path
                && d["span_start"] == SOURCE.find("class Payload").unwrap() + 6
                && d["provenance"] == "SYNTAX"
        })
        .unwrap();
    let import_index = docs
        .iter()
        .position(|d| {
            d["path"] == fixture.path
                && d["provenance"] == "IMPORTS"
                && d["text"] == "Vendor\\Payload as Item"
        })
        .unwrap();
    for case in 0..13 {
        let mut changed = original.clone();
        let docs = changed["documents"].as_array_mut().unwrap();
        match case {
            0 => {
                docs[site_index]
                    .as_object_mut()
                    .unwrap()
                    .remove("php_type_target");
            }
            1 => docs[site_index]["php_type_target"]["source_hash"] = json!("00".repeat(32)),
            2 => docs[site_index]["php_type_target"]["target"]["start"] = json!(0),
            3 => docs[site_index]["php_type_target"]["owner"]["start"] = json!(0),
            4 => {
                let start = SOURCE.rfind("class Payload").unwrap() + 6;
                docs[site_index]["php_type_target"]["target"] =
                    json!({"start":start,"end":start+7});
            }
            5 => docs[site_index]["span_start"] = json!(0),
            6 => docs[site_index]["search_text"] = json!("Different"),
            7 => docs[site_index]["php_type_target"]["import"]["span"]["start"] = json!(0),
            8 => docs[site_index]["php_type_target"]["binding_hash"] = json!("00".repeat(32)),
            9 => docs[target_index]["semantic_tags"] = json!([]),
            10 => docs[import_index]["text"] = json!("Wrong\\Payload as Item"),
            11 => {
                let mut duplicate = docs[target_index].clone();
                duplicate["node_id"] =
                    json!(duplicate["node_id"].as_u64().unwrap().wrapping_add(1));
                docs.push(duplicate);
            }
            12 => {
                docs[site_index]
                    .as_object_mut()
                    .unwrap()
                    .remove("php_type_target");
            }
            _ => unreachable!(),
        }
        let gap = format!(
            "{}:{}-{}",
            fixture.path, docs[site_index]["span_start"], docs[site_index]["span_end"]
        );
        if case == 12 {
            let mut decoy = changed["arcs"]
                .as_array()
                .unwrap()
                .iter()
                .find(|a| {
                    a["kind"] == "REFERENCES"
                        && a["evidence"]["span"]["start"]
                            == original["documents"][site_index]["span_start"]
                })
                .unwrap()
                .clone();
            decoy["kind"] = json!("CONTAINS");
            changed["arcs"].as_array_mut().unwrap().push(decoy);
        }
        let state = fixture.publish(&format!("corrupt-{case}"), &changed);
        let runtime = Runtime::open(&state).unwrap();
        assert!(
            runtime.coverage().dynamic_dispatch.contains(&gap),
            "case {case}: missing {gap}"
        );
        for relation in [RelationKind::References, RelationKind::Imports] {
            let result = trace(&runtime, &fixture.path, "consume", relation);
            assert_eq!(result["total"], 1, "case {case}: {result}");
            assert_eq!(
                result["nodes"][0]["symbol"], "Contract",
                "case {case}: {result}"
            );
        }
    }
}

#[test]
fn php_unused_imports_external_targets_and_invalid_declarations_do_not_create_graph_edges() {
    for source in [
        r"<?php namespace Vendor { class Payload {} } namespace App { use Vendor\Payload as Item; function consume() {} }",
        r"<?php namespace App; use Vendor\Payload as Item; function consume(Item $x) {}",
        r"<?php namespace Vendor { if ($ok) { class Payload {} } } namespace App { use Vendor\Payload as Item; function consume(Item $x) {} }",
        r"<?php namespace Vendor { class Payload {} class PAYLOAD {} } namespace App { use Vendor\Payload as Item; function consume(Item $x) {} }",
    ] {
        let fixture = Fixture::new("php", source);
        let runtime = Runtime::open(&fixture.state).unwrap();
        for relation in [RelationKind::References, RelationKind::Imports] {
            assert_eq!(
                trace(&runtime, &fixture.path, "consume", relation)["total"],
                0,
                "{source}"
            );
        }
    }
}

#[test]
fn php_type_revision_30_cache_requires_a_distinct_revision_31_generation() {
    let fixture = Fixture::new("php", SOURCE);
    let mut old = fixture.stored();
    assert_eq!(old["extraction_revision"], 31);
    old["extraction_revision"] = json!(30);
    let mut hash = blake3::Hasher::new();
    hash.update(
        old["snapshot"]["repo_revision"]
            .as_str()
            .unwrap()
            .as_bytes(),
    );
    hash.update(&30_u32.to_le_bytes());
    let old_generation = u64::from_le_bytes(hash.finalize().as_bytes()[..8].try_into().unwrap())
        % 10_000_000_000_000_000;
    assert_ne!(old["snapshot"]["graph_generation"], old_generation);
    old["snapshot"]["graph_generation"] = json!(old_generation);
    for doc in old["documents"].as_array_mut().unwrap() {
        doc.as_object_mut().unwrap().remove("php_type_target");
    }
    old["arcs"]
        .as_array_mut()
        .unwrap()
        .retain(|a| !matches!(a["kind"].as_str(), Some("REFERENCES" | "IMPORTS")));
    let state = fixture.publish("revision-30", &old);
    let pinned = GenerationReader::open_current(&state).unwrap();
    let old_bytes = pinned.read_segment("nodes.seg").unwrap();
    assert_eq!(
        Runtime::open(&state).err().unwrap().code(),
        "extraction_revision"
    );
    let report = Runtime::index(&fixture.root, &state).unwrap();
    assert_eq!(
        report.snapshot.graph_generation,
        Runtime::index(&fixture.root, &fixture.state)
            .unwrap()
            .snapshot
            .graph_generation
    );
    assert_eq!(
        trace(
            &Runtime::open(&state).unwrap(),
            &fixture.path,
            "consume",
            RelationKind::References
        )["total"],
        2
    );
    assert_eq!(pinned.read_segment("nodes.seg").unwrap(), old_bytes);
}

#[test]
fn php_unproven_type_references_remain_explicit_gaps_and_recover_after_refresh() {
    let source =
        r"<?php namespace App; use Vendor\Missing as Item; function consume(Item $value) {}";
    let fixture = Fixture::new("php", source);
    let mut runtime = Runtime::open(&fixture.state).unwrap();
    let start = source.find("Item $value").unwrap();
    let expected = format!("{}:{}-{}", fixture.path, start, start + 4);
    assert!(runtime.coverage().dynamic_dispatch.contains(&expected));
    assert_eq!(
        trace(&runtime, &fixture.path, "consume", RelationKind::References)["total"],
        0
    );
    let changed = format!("{source} namespace Vendor; class Missing {{}}");
    fs::write(fixture.root.join(&fixture.path), &changed).unwrap();
    runtime.refresh(&fixture.root).unwrap();
    assert!(!runtime.coverage().dynamic_dispatch.contains(&expected));
    assert_eq!(
        trace(&runtime, &fixture.path, "consume", RelationKind::References)["total"],
        1
    );
    fs::write(fixture.root.join(&fixture.path), source).unwrap();
    runtime.refresh(&fixture.root).unwrap();
    assert!(runtime.coverage().dynamic_dispatch.contains(&expected));
    assert_eq!(
        trace(&runtime, &fixture.path, "consume", RelationKind::References)["total"],
        0
    );
}
