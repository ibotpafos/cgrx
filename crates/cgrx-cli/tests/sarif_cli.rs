//! Exercise SARIF through the real CLI, managed index, and gate evaluation.
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);

struct Repository(PathBuf);

impl Repository {
    fn new(source: &str) -> Self {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock after epoch")
            .as_nanos();
        let root = std::env::temp_dir().join(format!(
            "cgrx-sarif-cli-{}-{nonce}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&root).expect("create exclusive synthetic repository");
        let repository = Self(root.canonicalize().expect("canonical repository path"));
        git(repository.path(), &["init", "-q"]);
        git(repository.path(), &["config", "user.name", "CGRX Test"]);
        git(
            repository.path(),
            &["config", "user.email", "test@example.invalid"],
        );
        fs::write(repository.path().join("main.rs"), source).expect("write synthetic source");
        git(repository.path(), &["add", "main.rs"]);
        git(
            repository.path(),
            &["commit", "-qm", "synthetic SARIF fixture"],
        );
        repository
    }

    fn path(&self) -> &Path {
        &self.0
    }

    fn check(&self, args: &[&str]) -> Output {
        Command::new(env!("CARGO_BIN_EXE_cgrx"))
            .args(["check-gates", "--root"])
            .arg(self.path())
            .args(args)
            .env("CGRX_RESPONSE_PROFILE", "full")
            .current_dir(self.path())
            .stdin(Stdio::null())
            .output()
            .expect("run real cgrx CLI")
    }
}

impl Drop for Repository {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(self.path());
    }
}

fn git(root: &Path, args: &[&str]) {
    let output = Command::new("git")
        .args(args)
        .current_dir(root)
        .output()
        .expect("git executable");
    assert!(
        output.status.success(),
        "git {args:?} failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
}

fn report(output: &Output) -> Value {
    serde_json::from_slice(&output.stdout).unwrap_or_else(|error| {
        panic!(
            "expected SARIF JSON: {error}; stdout={}; stderr={}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        )
    })
}

fn results(report: &Value) -> &[Value] {
    report
        .pointer("/runs/0/results")
        .and_then(Value::as_array)
        .expect("SARIF run results")
}

fn summary(report: &Value) -> &Value {
    let summaries = results(report)
        .iter()
        .filter(|result| result["ruleId"] == "cgrx/gate-verdict")
        .collect::<Vec<_>>();
    assert_eq!(summaries.len(), 1, "exactly one gate summary: {report}");
    summaries[0]
}

fn assert_verdict(report: &Value, verdict: &str, level: &str, would_block: bool) {
    assert_eq!(report["version"], "2.1.0");
    assert_eq!(report["runs"][0]["tool"]["driver"]["name"], "cgrx");
    assert_eq!(summary(report)["level"], level);
    let properties = &report["runs"][0]["properties"];
    assert_eq!(properties["cgrxVerdict"], verdict, "{report}");
    assert_eq!(properties["cgrxWouldBlock"], would_block, "{report}");
    assert_eq!(properties["llmUsed"], false);
    assert!(
        properties["cgrxSnapshot"].is_object(),
        "report must preserve the gate snapshot: {report}"
    );
}

#[test]
fn clean_repository_pass_has_one_note_and_preserves_snapshot() {
    let repository = Repository::new("pub fn target() {}\n");
    let output = repository.check(&["--gate", "repository", "--format", "sarif"]);
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let report = report(&output);
    assert_verdict(&report, "PASS", "note", false);
    assert_eq!(results(&report).len(), 1, "{report}");
    assert_eq!(report["runs"][0]["properties"]["cgrxPartial"], false);
    assert_eq!(report["runs"][0]["properties"]["cgrxGate"], "repository");
    assert!(summary(&report).get("locations").is_none());
}

#[test]
fn repository_warning_obeys_error_and_warning_exit_policies() {
    let repository = Repository::new("fn target() {}\nfn caller() { target(); }\n");
    for (policy, expected_exit, would_block) in [("error", 0, false), ("warning", 2, true)] {
        let output = repository.check(&[
            "--gate",
            "repository",
            "--format",
            "sarif",
            "--max-symbol-fan-in",
            "0",
            "--fail-on",
            policy,
        ]);
        assert_eq!(
            output.status.code(),
            Some(expected_exit),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        let report = report(&output);
        assert_verdict(&report, "WARN", "warning", would_block);
        let breach = results(&report)
            .iter()
            .find(|result| result["ruleId"] == "cgrx/max_symbol_fan_in")
            .expect("fan-in breach is represented in SARIF");
        assert_eq!(breach["level"], "warning");
        assert_eq!(report["runs"][0]["properties"]["cgrxFailOn"], policy);
    }
}

#[test]
fn breached_repository_writes_sarif_file_before_exit_two_with_actual_parser_line() {
    let repository =
        Repository::new("pub fn intact() {}\n\npub fn broken() {\n    let value = ;\n}\n");
    // Keep the output outside the working-tree input scanned by managed refresh.
    let destination = repository.path().join(".git/gate-report.sarif");
    let output = repository.check(&[
        "--gate",
        "repository",
        "--format",
        "sarif",
        "--output",
        destination.to_str().expect("UTF-8 fixture path"),
    ]);
    assert_eq!(output.status.code(), Some(2));
    assert!(output.stdout.is_empty(), "--output should write the file");
    assert!(String::from_utf8_lossy(&output.stderr).contains("verdict FAIL would block"));
    let report: Value = serde_json::from_slice(
        &fs::read(&destination).expect("report exists despite blocking exit"),
    )
    .expect("output file contains valid SARIF");
    assert_verdict(&report, "FAIL", "error", true);
    assert!(
        results(&report).iter().any(
            |result| result["ruleId"] == "cgrx/max_coverage_gaps" && result["level"] == "error"
        ),
        "coverage breach must remain visible: {report}"
    );
    let location = results(&report)
        .iter()
        .flat_map(|result| result["locations"].as_array().into_iter().flatten())
        .find(|location| location["physicalLocation"]["artifactLocation"]["uri"] == "main.rs")
        .expect("parser error retains its repository path");
    assert_eq!(location["physicalLocation"]["region"]["startLine"], 4);
    assert!(
        location["physicalLocation"]["region"]
            .get("byteOffset")
            .is_none()
    );
}

#[test]
fn tolerated_dynamic_dispatch_remains_inconclusive_and_blocking() {
    let repository = Repository::new(
        "trait Service { fn run(&self); }\nfn dispatch(service: &dyn Service) { service.run(); }\n",
    );
    for (policy, expected_exit, would_block) in [("error", 2, true), ("none", 0, false)] {
        let output = repository.check(&[
            "--gate",
            "repository",
            "--format",
            "sarif",
            "--max-coverage-gaps",
            "100",
            "--fail-on",
            policy,
        ]);
        assert_eq!(
            output.status.code(),
            Some(expected_exit),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        let report = report(&output);
        assert_verdict(&report, "INCONCLUSIVE", "warning", would_block);
        assert_eq!(report["runs"][0]["properties"]["cgrxPartial"], true);
        assert!(
            results(&report)
                .iter()
                .all(|result| result["level"] != "error"),
            "tolerated gaps should preserve uncertainty without an error breach: {report}"
        );
    }
}

#[test]
fn security_finding_preserves_actual_line_without_disclosing_synthetic_secret() {
    let repository = Repository::new("pub fn target() {}\n");
    let synthetic_value = format!(
        "cgrx-synthetic-{}-{}",
        std::process::id(),
        SEQUENCE.fetch_add(1, Ordering::Relaxed)
    );
    fs::write(
        repository.path().join("main.rs"),
        format!(
            "pub fn target() {{}}\n\n// synthetic credential detection fixture\n\nconst API_KEY: &str = \"{synthetic_value}\";\n"
        ),
    )
    .expect("write synthetic working-tree credential");
    let output = repository.check(&["--gate", "security", "--format", "sarif"]);
    assert_eq!(output.status.code(), Some(2));
    assert!(!String::from_utf8_lossy(&output.stdout).contains(&synthetic_value));
    assert!(!String::from_utf8_lossy(&output.stderr).contains(&synthetic_value));
    let report = report(&output);
    assert_verdict(&report, "FAIL", "error", true);
    assert!(
        results(&report)
            .iter()
            .any(|result| result["ruleId"] == "cgrx/max_secret_findings"),
        "secret threshold breach must be exported: {report}"
    );
    let finding = results(&report)
        .iter()
        .find(|result| {
            result["locations"].as_array().is_some_and(|locations| {
                locations.iter().any(|location| {
                    location["physicalLocation"]["artifactLocation"]["uri"] == "main.rs"
                        && location["physicalLocation"]["region"]["startLine"] == 5
                })
            })
        })
        .expect("secret finding retains its actual source line");
    assert_eq!(finding["level"], "error");
}

#[test]
fn dependency_parse_gap_omits_credentials_from_offending_source_line() {
    let repository = Repository::new("pub fn target() {}\n");
    let sentinel = format!(
        "cgrx-synthetic-{}-{}",
        std::process::id(),
        SEQUENCE.fetch_add(1, Ordering::Relaxed)
    );
    fs::write(
        repository.path().join("Cargo.lock"),
        format!(
            "version = 3\n\n[[package]]\nname = \"fixture\"\nversion = \"1.0.0\"\nsource = https://fixture-user:{sentinel}@example.invalid/registry\n"
        ),
    )
    .expect("write invalid synthetic dependency manifest");
    let output = repository.check(&[
        "--gate",
        "security",
        "--format",
        "sarif",
        "--allowlist-paths",
        "Cargo.lock",
    ]);
    assert_eq!(output.status.code(), Some(2));
    assert!(String::from_utf8_lossy(&output.stderr).contains("verdict INCONCLUSIVE would block"));
    assert!(!String::from_utf8_lossy(&output.stdout).contains(&sentinel));
    assert!(!String::from_utf8_lossy(&output.stderr).contains(&sentinel));
    let report = report(&output);
    assert_verdict(&report, "INCONCLUSIVE", "warning", true);
    assert_eq!(report["runs"][0]["properties"]["cgrxPartial"], true);
    let evidence = results(&report)
        .iter()
        .map(|result| &result["properties"]["cgrxEvidence"])
        .find(|evidence| {
            evidence["component"] == "dependencies" && evidence["code"] == "cgrx.lock_parse"
        })
        .expect("dependency parse failure retains safe machine-readable evidence");
    for field in ["detail", "source", "text"] {
        assert!(evidence.get(field).is_none(), "{evidence}");
    }
}

#[test]
fn repeated_reports_are_byte_identical_including_multiple_rule_descriptors() {
    let repository = Repository::new("fn target() {}\nfn caller() { target(); }\n");
    let args = [
        "--gate",
        "repository",
        "--format",
        "sarif",
        "--max-symbol-fan-in",
        "0",
        "--fail-on",
        "none",
    ];
    let first = repository.check(&args);
    assert!(first.status.success());
    assert_verdict(&report(&first), "WARN", "warning", false);
    for _ in 0..3 {
        let repeated = repository.check(&args);
        assert!(repeated.status.success());
        assert_eq!(repeated.stdout, first.stdout, "SARIF must be deterministic");
    }
}

#[test]
fn sequential_gate_reports_outside_repository_preserve_source_snapshot_and_coverage() {
    let repository = Repository::new("pub fn target() {}\n");
    let before = repository.check(&["--gate", "repository", "--format", "json"]);
    assert!(before.status.success());
    let before: Value = serde_json::from_slice(&before.stdout).expect("baseline gate JSON");
    assert_eq!(before["verdict"], "PASS");

    // The workflow writes to RUNNER_TEMP. Use a sibling directory here so
    // neither report can become an untracked source-tree coverage exclusion.
    struct ReportDirectory(PathBuf);
    impl Drop for ReportDirectory {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    let output_path = repository.path().with_extension("gate-reports");
    fs::create_dir(&output_path).expect("create exclusive report directory");
    let directory = ReportDirectory(output_path);
    for gate in ["change", "repository"] {
        let destination = directory.0.join(format!("{gate}.sarif"));
        let output = repository.check(&[
            "--gate",
            gate,
            "--format",
            "sarif",
            "--output",
            destination.to_str().expect("UTF-8 report path"),
        ]);
        assert!(
            output.status.success(),
            "{gate}: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        let report: Value =
            serde_json::from_slice(&fs::read(destination).expect("external report exists"))
                .expect("external report JSON");
        assert_verdict(&report, "PASS", "note", false);
        let properties = &report["runs"][0]["properties"];
        assert_eq!(properties["cgrxCoverageGapCount"], 0);
        assert_eq!(properties["cgrxPartial"], false);
        assert_eq!(properties["cgrxSnapshot"], before["snapshot"]);
    }
    let status = Command::new("git")
        .args(["status", "--porcelain"])
        .current_dir(repository.path())
        .output()
        .expect("source-tree Git status");
    assert!(status.status.success());
    assert!(
        status.stdout.is_empty(),
        "gate reports must leave the source tree clean"
    );
}
