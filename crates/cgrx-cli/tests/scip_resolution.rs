use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use cgrx_cli::Runtime;
use scip::types::{Document, Index, Occurrence, PositionEncoding, SymbolRole};

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
        "fn caller(worker: &Worker) {\n",
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
