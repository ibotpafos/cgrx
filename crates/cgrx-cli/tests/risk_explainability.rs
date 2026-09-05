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
        Self::with_source(BASE)
    }
    fn with_source(source: &str) -> Self {
        Self::with_files(&[("main.rs", source)])
    }
    fn with_files(files: &[(&str, &str)]) -> Self {
        let dir = std::env::temp_dir().join(format!(
            "cgrx-risk-explain-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        let root = dir.join("repo");
        fs::create_dir_all(&root).unwrap();
        let root = root.canonicalize().unwrap();
        for (path, source) in files {
            fs::create_dir_all(root.join(path).parent().unwrap()).unwrap();
            fs::write(root.join(path), source).unwrap();
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

const TEST_CHAIN: &str = "fn target() -> u32 { 1 }\nfn caller() { target(); }\nfn test_feature() { caller(); }\nfn test_unrelated() {}\n";

#[test]
fn verification_plan_selects_two_hop_test_with_proofs_not_execution() {
    let mut f = Fixture::with_source(TEST_CHAIN);
    f.change(&TEST_CHAIN.replace("{ 1 }", "{ 2 }"));
    let r = f.scan(20);
    let p = &r["verification_plan"];
    assert_eq!(p["execution_status"], "not_run", "{r}");
    let tests = p["related_tests"].as_array().unwrap();
    assert_eq!(tests.len(), 1, "{r}");
    assert_eq!(tests[0]["symbol"], "test_feature");
    assert_eq!(tests[0]["selection"], "test_convention_candidate");
    assert_eq!(tests[0]["call_chain"].as_array().unwrap().len(), 2);
    for proof in tests[0]["call_chain"].as_array().unwrap() {
        assert_eq!(proof["confidence"], "PROVEN");
    }
    assert_eq!(p["max_call_depth"], 2);
    assert_eq!(p["complete_test_suite"], false);
    assert_eq!(f.scan(20), r);
}

#[test]
fn verification_plan_direct_test_and_limit_are_explicit() {
    let source = "fn target() -> u32 { 1 }\nfn test_a() { target(); }\nfn test_b() { target(); }\n";
    let mut f = Fixture::with_source(source);
    f.change(&source.replace("{ 1 }", "{ 2 }"));
    let r = f.scan(1);
    assert_eq!(
        r["verification_plan"]["related_tests"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    assert_eq!(r["verification_plan"]["partial"], true);
    assert_eq!(
        r["verification_plan"]["related_tests"][0]["call_chain"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
}

#[test]
fn verification_plan_no_test_is_unknown_not_no_tests_exist() {
    let mut f = Fixture::new();
    f.change(CHANGED);
    let r = f.scan(20);
    assert_eq!(r["verification_plan"]["related_tests"], json!([]));
    assert_eq!(
        r["verification_plan"]["test_discovery"],
        "no_candidates_in_bounded_graph"
    );
    assert_eq!(r["verification_plan"]["complete_test_suite"], false);
    assert_eq!(r["verification_plan"]["review_impacts"], json!([0]));
}

#[test]
fn verification_plan_never_reuses_stale_test_source() {
    let mut f = Fixture::with_source(TEST_CHAIN);
    f.change(&TEST_CHAIN.replace("{ 1 }", "{ 2 }"));
    fs::write(f.root.join("main.rs"), "// changed after refresh\n").unwrap();
    let r = f.scan(20);
    assert_eq!(r["verification_plan"]["related_tests"], json!([]));
    assert_eq!(r["verification_plan"]["partial"], true);
}

#[test]
fn verification_plan_caps_test_fanout_independently_of_impacts() {
    let source = "fn target() -> u32 { 1 }\nfn caller() { target(); }\nfn test_a() { caller(); }\nfn test_b() { caller(); }\n";
    let mut f = Fixture::with_source(source);
    f.change(&source.replace("{ 1 }", "{ 2 }"));
    let r = f.scan(1);
    assert_eq!(r["impacts"].as_array().unwrap().len(), 1);
    assert_eq!(
        r["verification_plan"]["related_tests"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    assert_eq!(r["verification_plan"]["truncated"], true);
    assert!(
        r["coverage_gaps"]
            .as_array()
            .unwrap()
            .iter()
            .any(|g| g["code"] == "VERIFICATION_PLAN_LIMIT")
    );
}

#[test]
fn verification_plan_does_not_select_disconnected_test() {
    let mut f = Fixture::with_source(TEST_CHAIN);
    f.change("fn target() -> u32 { 2 }\nfn caller() { target(); }\nfn test_feature() {}\nfn test_unrelated() {}\n");
    let r = f.scan(20);
    assert_eq!(r["verification_plan"]["related_tests"], json!([]));
}

#[test]
fn verification_plan_removal_routes_to_finding_review_without_test_claim() {
    let mut f = Fixture::new();
    f.change("fn caller() { target(); }\n");
    let r = f.scan(20);
    assert_eq!(r["findings"].as_array().unwrap().len(), 1);
    assert_eq!(r["verification_plan"]["review_findings"], json!([0]));
    assert_eq!(r["verification_plan"]["related_tests"], json!([]));
    assert_eq!(r["verification_plan"]["review_changed_paths"], true);
}

#[test]
fn verification_plan_cross_file_test_source_is_verified() {
    let source = "mod checks;\nfn target() -> u32 { 1 }\nfn caller() { target(); }\n";
    let checks = "fn test_feature() { crate::caller(); }\n";
    let mut f = Fixture::with_files(&[
        (
            "Cargo.toml",
            "[package]\nname=\"review-fixture\"\nversion=\"0.1.0\"\nedition=\"2021\"\n",
        ),
        ("src/lib.rs", source),
        ("src/checks.rs", checks),
    ]);
    fs::write(f.root.join("src/lib.rs"), source.replace("{ 1 }", "{ 2 }")).unwrap();
    f.runtime.refresh(&f.root).unwrap();
    let r = f.scan(20);
    assert_eq!(
        r["verification_plan"]["related_tests"][0]["path"], "src/checks.rs",
        "{r}"
    );
    fs::write(f.root.join("src/checks.rs"), "fn test_feature() {}\n").unwrap();
    let stale = f.scan(20);
    assert_eq!(stale["verification_plan"]["related_tests"], json!([]));
    assert_eq!(stale["verification_plan"]["partial"], true);
    assert!(
        stale["coverage_gaps"]
            .as_array()
            .unwrap()
            .iter()
            .any(|g| g["path"] == "src/checks.rs" && g["code"] == "SOURCE_UNVERIFIED_OR_BUDGET")
    );
}

const DYNAMIC_NEIGHBOR: &str = "fn target() -> u32 { 1 }\nfn caller() { target(); }\nfn test_feature() { caller(); }\ntrait Service { fn run(&self); }\nfn unrelated(service: &dyn Service) { service.run(); }\n";

#[test]
fn positive_impact_survives_unrelated_dynamic_gap() {
    let mut f = Fixture::with_source(DYNAMIC_NEIGHBOR);
    f.change(&DYNAMIC_NEIGHBOR.replace("{ 1 }", "{ 2 }"));
    let r = f.scan(20);
    assert_eq!(r["partial"], true, "fixture must contain a real gap: {r}");
    assert!(
        r["coverage_gaps"]
            .as_array()
            .unwrap()
            .iter()
            .any(|g| g["code"] == "DYNAMIC_DISPATCH")
    );
    assert_eq!(r["impacts"].as_array().unwrap().len(), 1, "{r}");
    assert_eq!(r["impacts"][0]["current_edge"]["confidence"], "PROVEN");
    assert_eq!(
        r["verification_plan"]["related_tests"][0]["symbol"],
        "test_feature"
    );
    assert_eq!(r["verification_plan"]["partial"], true);
    assert_eq!(r["verification_plan"]["execution_status"], "not_run");
}

#[test]
fn removed_target_still_abstains_with_dynamic_gap() {
    let mut f = Fixture::with_source(DYNAMIC_NEIGHBOR);
    f.change(&DYNAMIC_NEIGHBOR.replace("fn target() -> u32 { 1 }\n", ""));
    let r = f.scan(20);
    assert_eq!(r["partial"], true);
    assert_eq!(r["findings"], json!([]));
    assert_eq!(r["verification_plan"]["related_tests"], json!([]));
}

#[test]
fn positive_impact_requires_current_target_source_across_files() {
    let source = "mod worker; pub fn target() -> u32 { 1 }\n";
    let mut f = Fixture::with_files(&[
        (
            "Cargo.toml",
            "[package]\nname=\"target-proof\"\nversion=\"0.1.0\"\nedition=\"2021\"\n",
        ),
        ("src/lib.rs", source),
        ("src/worker.rs", "fn test_feature() { crate::target(); }\n"),
    ]);
    fs::write(f.root.join("src/lib.rs"), source.replace("{ 1 }", "{ 2 }")).unwrap();
    f.runtime.refresh(&f.root).unwrap();
    assert_eq!(f.scan(20)["impacts"].as_array().unwrap().len(), 1);
    fs::write(f.root.join("src/lib.rs"), source).unwrap();
    let r = f.scan(20);
    assert_eq!(r["impacts"], json!([]));
    assert_eq!(r["partial"], true);
    assert!(
        r["coverage_gaps"]
            .as_array()
            .unwrap()
            .iter()
            .any(|g| g["path"] == "src/lib.rs" && g["code"] == "SOURCE_UNVERIFIED_OR_BUDGET")
    );
}
