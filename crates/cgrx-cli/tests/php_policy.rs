//! Runs under both registry policies, including dependency feature unification.
use cgrx_cli::Runtime;
use cgrx_core::RepoSnapshot;
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

fn generation(revision: &str, policy: u32) -> u64 {
    let mut hasher = blake3::Hasher::new();
    hasher.update(revision.as_bytes());
    hasher.update(&policy.to_le_bytes());
    u64::from_le_bytes(hasher.finalize().as_bytes()[..8].try_into().unwrap())
        % 10_000_000_000_000_000
}

#[test]
fn php_registry_policy_has_separate_cache_identity_and_reindexes_the_same_commit() {
    let fixture = Fixture(std::env::temp_dir().join(format!(
        "cgrx-php-policy-{}-{}",
        std::process::id(),
        SEQUENCE.fetch_add(1, Ordering::Relaxed)
    )));
    fs::create_dir(&fixture.0).unwrap();
    let root = fixture.0.join("repo");
    let fresh = fixture.0.join("fresh");
    let migrated = fixture.0.join("migrated");
    fs::create_dir(&root).unwrap();
    fs::write(root.join("keep.rs"), "fn retained() {}\n").unwrap();
    fs::write(
        root.join("main.php"),
        "<?php function helper() {} function caller() { helper(); }\n",
    )
    .unwrap();
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
    let enabled = cgrx_languages::EXPERIMENTAL_PHP_ENABLED;
    assert_eq!(
        cgrx_languages::pack_for_path(Path::new("main.php")).is_some(),
        enabled
    );
    let active_policy = if enabled { 31 } else { 29 };
    let foreign_policy = if enabled { 29 } else { 31 };
    let report = Runtime::index(&root, &fresh).unwrap();
    assert_eq!(report.indexed_files, if enabled { 2 } else { 1 });
    assert_eq!(
        report.snapshot.graph_generation,
        generation(&report.snapshot.repo_revision, active_policy)
    );
    let reader = GenerationReader::open_current(&fresh).unwrap();
    let mut stored: Value =
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap();
    assert_eq!(stored["extraction_revision"], active_policy);
    assert_eq!(
        stored["documents"]
            .as_array()
            .unwrap()
            .iter()
            .any(|doc| doc["path"] == "main.php"),
        enabled
    );
    assert!(
        stored["documents"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|doc| doc["path"] == "keep.rs")
            .all(|doc| doc.get("php_function_target").is_none())
    );
    let mut foreign: RepoSnapshot = report.snapshot.clone();
    foreign.graph_generation = generation(&foreign.repo_revision, foreign_policy);
    assert_ne!(foreign.graph_generation, report.snapshot.graph_generation);
    stored["snapshot"] = serde_json::to_value(&foreign).unwrap();
    stored["extraction_revision"] = json!(foreign_policy);
    let foreign_bytes = serde_json::to_vec(&stored).unwrap();
    let mut writer = GenerationWriter::begin(&migrated, foreign).unwrap();
    writer.write_segment("nodes.seg", &foreign_bytes).unwrap();
    for name in ["edges.seg", "terms.fst"] {
        writer
            .write_segment(name, &reader.read_segment(name).unwrap())
            .unwrap();
    }
    writer.validate().unwrap();
    writer.publish().unwrap();
    let pinned = GenerationReader::open_current(&migrated).unwrap();
    assert_eq!(
        Runtime::open(&migrated).err().unwrap().code(),
        "extraction_revision"
    );
    assert_eq!(Runtime::index(&root, &migrated).unwrap(), report);
    assert_eq!(Runtime::index(&root, &migrated).unwrap(), report);
    let runtime = Runtime::open(&migrated).unwrap();
    assert_eq!(
        runtime
            .coverage()
            .excluded_paths
            .contains(&"main.php".to_owned()),
        !enabled
    );
    assert_eq!(pinned.read_segment("nodes.seg").unwrap(), foreign_bytes);
}
