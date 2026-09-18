//! A modeled revision-28 index must not bypass the restricted language registry.
//! This exercises real immutable storage; it does not pretend to run an old binary.
use cgrx_cli::Runtime;
use cgrx_core::RepoSnapshot;
use cgrx_store::{GenerationReader, GenerationWriter};
use serde_json::{Value, json};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);
const RETIRED: [&str; 21] = [
    "cpp", "cxx", "cc", "hpp", "hxx", "hh", "cs", "ex", "exs", "php", "phtml", "php3", "php4",
    "php5", "phps", "rb", "rake", "gemspec", "scala", "sc", "swift",
];

struct Fixture(PathBuf);

impl Fixture {
    fn new() -> Self {
        let base = std::env::temp_dir().join(format!(
            "cgrx-language-policy-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        let fixture = Self(base);
        fs::create_dir_all(fixture.root()).unwrap();
        fs::write(fixture.root().join("lib.rs"), "fn retained() {}\n").unwrap();
        for extension in RETIRED {
            // Unsupported files are excluded without interpreting their bytes.
            fs::write(fixture.root().join(format!("old.{extension}")), "retired\n").unwrap();
        }
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
                    .current_dir(fixture.root())
                    .status()
                    .unwrap()
                    .success()
            );
        }
        fixture
    }

    fn root(&self) -> PathBuf {
        self.0.join("repo")
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn revision_28_generation(revision: &str) -> u64 {
    let mut hasher = blake3::Hasher::new();
    hasher.update(revision.as_bytes());
    hasher.update(&28_u32.to_le_bytes());
    let mut bytes = [0_u8; 8];
    bytes.copy_from_slice(&hasher.finalize().as_bytes()[..8]);
    u64::from_le_bytes(bytes) % 10_000_000_000_000_000
}

fn publish(state: &Path, snapshot: RepoSnapshot, bytes: &[u8]) {
    let mut writer = GenerationWriter::begin(state, snapshot).unwrap();
    writer.write_segment("nodes.seg", bytes).unwrap();
    writer.write_segment("edges.seg", b"[]").unwrap();
    writer.write_segment("terms.fst", b"CGRXTERMS1").unwrap();
    writer.validate().unwrap();
    writer.publish().unwrap();
}

#[test]
fn revision_28_records_require_reindex_and_retired_extensions_stay_excluded() {
    let fixture = Fixture::new();
    let fresh = fixture.0.join("fresh");
    let state = fixture.0.join("legacy");
    let expected = Runtime::index(&fixture.root(), &fresh).unwrap();
    assert_eq!(expected.indexed_files, 1);
    let reader = GenerationReader::open_current(&fresh).unwrap();
    let mut stored: Value =
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap();
    let mut legacy = expected.snapshot.clone();
    legacy.graph_generation = revision_28_generation(&legacy.repo_revision);
    assert_ne!(legacy.graph_generation, expected.snapshot.graph_generation);
    stored["snapshot"] = serde_json::to_value(&legacy).unwrap();
    stored["extraction_revision"] = json!(28);
    stored["indexed_files"] = json!(RETIRED.len() + 1);
    stored["coverage"]["excluded_paths"] = json!([]);
    for (offset, extension) in RETIRED.iter().enumerate() {
        let path = format!("old.{extension}");
        stored["path_hashes"][&path] = json!(blake3::hash(b"retired\n").to_hex().to_string());
        stored["documents"].as_array_mut().unwrap().push(json!({
            "node_id": 8_000 + offset,
            "qualified_name": "retired",
            "path": path,
            "text": "retired",
            "search_text": "retired\n",
            "span_start": 0,
            "span_end": 7,
            "body_start": 0,
            "body_end": 8,
            "provenance": "SYNTAX"
        }));
    }
    let old_bytes = serde_json::to_vec(&stored).unwrap();
    publish(&state, legacy, &old_bytes);
    let pinned_old_reader = GenerationReader::open_current(&state).unwrap();
    let error = Runtime::open(&state)
        .err()
        .expect("obsolete index must fail");
    assert_eq!(error.code(), "extraction_revision");

    // Reindex at the very same Git commit must allocate the new policy's
    // generation, not collide with or reactivate the revision-28 generation.
    let migrated = Runtime::index(&fixture.root(), &state).unwrap();
    assert_eq!(migrated, expected);
    assert_eq!(Runtime::index(&fixture.root(), &state).unwrap(), migrated);
    let mut runtime = Runtime::open(&state).unwrap();
    assert_eq!(runtime.graph_node_count(), 1);
    let current = GenerationReader::open_current(&state).unwrap();
    let current_bytes = current.read_segment("nodes.seg").unwrap();
    let current_stored: Value = serde_json::from_slice(&current_bytes).unwrap();
    assert_ne!(current_stored["extraction_revision"], json!(28));
    assert!(
        current_stored["documents"]
            .as_array()
            .unwrap()
            .iter()
            .all(|doc| doc["path"] == "lib.rs")
    );
    for extension in RETIRED {
        let path = format!("old.{extension}");
        assert!(runtime.coverage().excluded_paths.contains(&path));
        assert!(current_stored["path_hashes"].get(&path).is_none());
        fs::write(fixture.root().join(&path), "changed retired\n").unwrap();
    }
    runtime.refresh(&fixture.root()).unwrap();
    assert_eq!(runtime.graph_node_count(), 1);
    // Pinned readers retain the original immutable bytes after migration.
    assert_eq!(
        pinned_old_reader.read_segment("nodes.seg").unwrap(),
        old_bytes
    );
}
