//! Bounded impact evidence is a review aid, never a confirmed defect.
use cgrx_cli::{RiskBaseline, Runtime};
use serde_json::{Value, json};
use std::{
    fs,
    path::PathBuf,
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);
const BASE: &str = "fn target() -> u32 { 1 }\nfn caller() { target(); }\n";
const CHANGED: &str = "// moved callsite\nfn target() -> u32 { 222 }\nfn caller() { target(); }\n";
struct Fixture {
    root: PathBuf,
    runtime: Runtime,
    baseline: RiskBaseline,
}
impl Fixture {
    fn new() -> Self {
        let dir = std::env::temp_dir().join(format!(
            "cgrx-risk-explain-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        let root = dir.join("repo");
        fs::create_dir_all(&root).unwrap();
        let root = root.canonicalize().unwrap();
        fs::write(root.join("main.rs"), BASE).unwrap();
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
        Runtime::index(&root, &dir.join("state")).unwrap();
        let runtime = Runtime::open(&dir.join("state")).unwrap();
        let baseline = runtime.risk_baseline();
        Self {
            root,
            runtime,
            baseline,
        }
    }
    fn change(&mut self, source: &str) {
        fs::write(self.root.join("main.rs"), source).unwrap();
        self.runtime.refresh(&self.root).unwrap();
    }
    fn scan(&self, limit: usize) -> Value {
        self.runtime
            .scan_risks(&self.baseline, &self.root, limit)
            .unwrap()
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(self.root.parent().unwrap());
    }
}

#[test]
fn impact_exposes_current_callsite_not_baseline_span() {
    let mut f = Fixture::new();
    f.change(CHANGED);
    let result = f.scan(20);
    assert_eq!(result["findings"], json!([]));
    assert_eq!(result["impacts"].as_array().unwrap().len(), 1, "{result}");
    let impact = &result["impacts"][0];
    assert_eq!(impact["severity"], "info");
    assert_eq!(impact["confidence"], "candidate");
    assert_eq!(impact["caller"]["symbol"], "caller");
    assert_eq!(impact["changed_target"]["symbol"], "target");
    let edge = &impact["current_edge"];
    assert!(edge.is_object(), "missing current callsite proof: {impact}");
    assert_eq!(edge["path"], "main.rs");
    assert_eq!(edge["confidence"], "PROVEN");
    assert_eq!(
        edge["source_hash"],
        json!(blake3::hash(CHANGED.as_bytes()).to_hex().to_string())
    );
    let start = edge["span"]["start"].as_u64().unwrap() as usize;
    let end = edge["span"]["end"].as_u64().unwrap() as usize;
    assert_eq!(&CHANGED[start..end], "target()");
    assert_ne!(edge["span"], impact["base_edge"]["span"]);
    assert_ne!(edge["source_hash"], impact["base_edge"]["source_hash"]);
    assert_eq!(edge["source_hash"], impact["current_source_hash"]);
    assert_eq!(f.scan(20), result, "deterministic repeated scan");
}

#[test]
fn no_impact_when_live_call_was_removed() {
    let mut f = Fixture::new();
    f.change("fn target() -> u32 { 222 }\nfn caller() {}\n");
    assert_eq!(f.scan(20)["impacts"], json!([]));
}

#[test]
fn no_impact_for_unchanged_target() {
    let f = Fixture::new();
    assert_eq!(f.scan(20)["impacts"], json!([]));
}

#[test]
fn stale_disk_source_suppresses_impact_proof() {
    let mut f = Fixture::new();
    f.change(CHANGED);
    fs::write(f.root.join("main.rs"), BASE).unwrap();
    let result = f.scan(20);
    assert_eq!(result["impacts"], json!([]));
    assert_eq!(result["partial"], true);
    assert!(
        result["coverage_gaps"]
            .as_array()
            .unwrap()
            .iter()
            .any(|gap| gap["code"] == "SOURCE_UNVERIFIED_OR_BUDGET")
    );
}
