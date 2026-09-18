#![cfg(feature = "experimental-php")]

use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, RepoSnapshot, Scope};
use cgrx_store::{GenerationReader, GenerationWriter};
use serde_json::{Value, json};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);
struct Fixture(PathBuf);
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn trace(runtime: &Runtime, name: &str) -> Value {
    let scope = Scope {
        include: vec![],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    };
    runtime
        .trace_path(name, Some("main.php"), "callees", 1, &scope, 10)
        .unwrap()
}

#[test]
fn plausible_outer_owners_cannot_replace_the_actual_named_body() {
    for (source, false_owner) in [
        (
            "<?php function Helper() {} function outer() { function caller() { Helper(); } }",
            "outer",
        ),
        (
            "<?php function Helper() {} class Outer { function caller() { Helper(); } }",
            "Outer",
        ),
    ] {
        let base = Fixture(std::env::temp_dir().join(format!(
            "cgrx-php-owner-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        )));
        fs::create_dir(&base.0).unwrap();
        let root = base.0.join("repo");
        let state = base.0.join("state");
        fs::create_dir(&root).unwrap();
        fs::write(root.join("main.php"), source).unwrap();
        for args in [
            vec!["init", "-q"],
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
        let runtime = Runtime::open(&state).unwrap();
        assert_eq!(trace(&runtime, "caller")["total"], 1);
        assert_eq!(trace(&runtime, false_owner)["total"], 0);
        let reader = GenerationReader::open_current(&state).unwrap();
        let mut stored: Value =
            serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap();
        let docs = stored["documents"].as_array_mut().unwrap();
        let owner = docs
            .iter()
            .find(|doc| doc["provenance"] == "SYNTAX" && doc["qualified_name"] == false_owner)
            .unwrap();
        let wrong_span = json!({"start":owner["span_start"],"end":owner["span_end"]});
        let call = docs
            .iter_mut()
            .find(|doc| doc.get("php_function_target").is_some())
            .unwrap();
        call["php_function_target"]["caller"] = wrong_span;
        let corrupted = base.0.join("corrupted");
        publish(&corrupted, &reader, &stored);
        let reopened = Runtime::open(&corrupted).unwrap();
        assert_eq!(trace(&reopened, "caller")["total"], 0);
        assert_eq!(trace(&reopened, false_owner)["total"], 0);
        assert!(!reopened.coverage().dynamic_dispatch.is_empty());
    }
}

fn publish(path: &Path, original: &GenerationReader, stored: &Value) {
    let snapshot: RepoSnapshot = serde_json::from_value(stored["snapshot"].clone()).unwrap();
    let mut writer = GenerationWriter::begin(path, snapshot).unwrap();
    writer
        .write_segment("nodes.seg", &serde_json::to_vec(stored).unwrap())
        .unwrap();
    for name in ["edges.seg", "terms.fst"] {
        writer
            .write_segment(name, &original.read_segment(name).unwrap())
            .unwrap();
    }
    writer.validate().unwrap();
    writer.publish().unwrap();
}
