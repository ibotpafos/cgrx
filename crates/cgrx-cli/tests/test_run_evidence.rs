//! Recorded test-run evidence annotates only freshly covered candidates.
use cgrx_cli::{RiskBaseline, Runtime, TestCaseResult, TestOutcome, TestRunRecord};
use serde_json::{Value, json};
use std::{
    fs,
    path::PathBuf,
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);
const BASE: &str =
    "fn target() -> u32 { 1 }\nfn caller() { target(); }\nfn test_feature() { caller(); }\n";

struct Fixture {
    root: PathBuf,
    runtime: Runtime,
    baseline: RiskBaseline,
}

impl Fixture {
    fn new() -> Self {
        let dir = std::env::temp_dir().join(format!(
            "cgrx-test-run-evidence-{}-{}",
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

    fn change(&mut self) {
        fs::write(self.root.join("main.rs"), BASE.replace("{ 1 }", "{ 2 }")).unwrap();
        self.runtime.refresh(&self.root).unwrap();
    }

    fn scan_with(&self, runs: &[TestRunRecord]) -> Value {
        self.runtime
            .scan_risks_with_test_runs(&self.baseline, &self.root, 20, runs)
            .unwrap()
    }

    /// Build a run covering the scanned candidate with exact revision+hash.
    fn fresh_run(&self, status: TestOutcome) -> (Value, TestRunRecord) {
        let plain = self.scan_with(&[]);
        let candidate = &plain["verification_plan"]["related_tests"][0];
        assert_eq!(candidate["symbol"], "test_feature");
        let run = TestRunRecord::new(
            "cargo test -p fixture",
            plain["snapshot"]["repo_revision"].as_str().unwrap(),
            vec![TestCaseResult {
                path: candidate["path"].as_str().unwrap().to_owned(),
                symbol: candidate["symbol"].as_str().unwrap().to_owned(),
                status,
                source_hash: candidate["source_hash"].as_str().map(str::to_owned),
            }],
        );
        (plain, run)
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(self.root.parent().unwrap());
    }
}

#[test]
fn fresh_passed_run_annotates_candidate_and_plan() {
    let mut f = Fixture::new();
    f.change();
    let (_, run) = f.fresh_run(TestOutcome::Passed);
    let result = f.scan_with(std::slice::from_ref(&run));
    let plan = &result["verification_plan"];
    assert_eq!(plan["related_tests"][0]["execution_status"], "passed");
    assert_eq!(
        plan["related_tests"][0]["execution"],
        json!({
            "runner_command": "cargo test -p fixture",
            "revision": result["snapshot"]["repo_revision"],
            "status": "passed",
        })
    );
    assert_eq!(plan["execution_status"], "passed");
    assert_eq!(plan["test_reach"][0]["execution_status"], "passed");
    // Structural proofs are untouched by the annotation.
    assert_eq!(
        plan["related_tests"][0]["reach"],
        f.scan_with(&[])["verification_plan"]["related_tests"][0]["reach"]
    );
}

#[test]
fn fresh_failed_run_propagates_failure() {
    let mut f = Fixture::new();
    f.change();
    let (_, run) = f.fresh_run(TestOutcome::Failed);
    let result = f.scan_with(std::slice::from_ref(&run));
    assert_eq!(
        result["verification_plan"]["related_tests"][0]["execution_status"],
        "failed"
    );
    assert_eq!(result["verification_plan"]["execution_status"], "failed");
    assert_eq!(
        result["verification_plan"]["test_reach"][0]["execution_status"],
        "failed"
    );
}

#[test]
fn failed_run_wins_over_passed_run() {
    let mut f = Fixture::new();
    f.change();
    let (_, passed) = f.fresh_run(TestOutcome::Passed);
    let (_, failed) = f.fresh_run(TestOutcome::Failed);
    let result = f.scan_with(&[passed, failed]);
    assert_eq!(
        result["verification_plan"]["related_tests"][0]["execution_status"],
        "failed"
    );
    assert_eq!(result["verification_plan"]["execution_status"], "failed");
}

#[test]
fn stale_revision_keeps_not_run() {
    let mut f = Fixture::new();
    f.change();
    let (_, mut run) = f.fresh_run(TestOutcome::Passed);
    run.revision = "0".repeat(40);
    let result = f.scan_with(std::slice::from_ref(&run));
    assert_eq!(
        result["verification_plan"]["related_tests"][0]["execution_status"],
        "not_run"
    );
    assert_eq!(result["verification_plan"]["execution_status"], "not_run");
    assert!(
        result["verification_plan"]["related_tests"][0]
            .get("execution")
            .is_none()
    );
}

#[test]
fn hash_mismatch_keeps_not_run() {
    let mut f = Fixture::new();
    f.change();
    let (_, mut run) = f.fresh_run(TestOutcome::Passed);
    run.results[0].source_hash = Some("f".repeat(64));
    let result = f.scan_with(std::slice::from_ref(&run));
    assert_eq!(
        result["verification_plan"]["related_tests"][0]["execution_status"],
        "not_run"
    );
    assert_eq!(result["verification_plan"]["execution_status"], "not_run");
}

#[test]
fn missing_hash_never_annotates() {
    let mut f = Fixture::new();
    f.change();
    let (_, mut run) = f.fresh_run(TestOutcome::Passed);
    run.results[0].source_hash = None;
    let result = f.scan_with(std::slice::from_ref(&run));
    assert_eq!(
        result["verification_plan"]["related_tests"][0]["execution_status"],
        "not_run"
    );
}

#[test]
fn unrelated_symbol_does_not_cover_candidate() {
    let mut f = Fixture::new();
    f.change();
    let (plain, mut run) = f.fresh_run(TestOutcome::Passed);
    run.results[0].symbol = "test_unrelated".to_owned();
    let _ = plain;
    let result = f.scan_with(std::slice::from_ref(&run));
    assert_eq!(
        result["verification_plan"]["related_tests"][0]["execution_status"],
        "not_run"
    );
    assert_eq!(result["verification_plan"]["execution_status"], "not_run");
}

#[test]
fn without_runs_plan_stays_not_run() {
    let mut f = Fixture::new();
    f.change();
    let result = f.scan_with(&[]);
    assert_eq!(result["verification_plan"]["execution_status"], "not_run");
    assert_eq!(
        result["verification_plan"]["related_tests"][0]["execution_status"],
        "not_run"
    );
}

#[test]
fn run_record_round_trips_through_json() {
    let mut f = Fixture::new();
    f.change();
    let (_, run) = f.fresh_run(TestOutcome::Passed);
    let restored: TestRunRecord =
        serde_json::from_value(serde_json::to_value(&run).unwrap()).unwrap();
    assert_eq!(restored, run);
}
