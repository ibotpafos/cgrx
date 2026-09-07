use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use cgrx_cli::{Runtime, RuntimeEvidenceFormat};
use cgrx_core::{EvidenceSelector, RelationKind, Scope};

struct TestDirectory(PathBuf);

static TEST_DIRECTORY_SEQUENCE: AtomicU64 = AtomicU64::new(0);

impl TestDirectory {
    fn new(label: &str) -> Self {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = std::env::temp_dir().join(format!(
            "cgrx-runtime-evidence-{label}-{}-{nonce}-{}",
            std::process::id(),
            TEST_DIRECTORY_SEQUENCE.fetch_add(1, Ordering::Relaxed),
        ));
        fs::create_dir_all(&path).unwrap();
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

fn git(root: &Path, args: &[&str]) -> String {
    let output = Command::new("git")
        .args(args)
        .current_dir(root)
        .output()
        .unwrap();
    assert!(output.status.success(), "git failed: {args:?}");
    String::from_utf8_lossy(&output.stdout).trim().to_owned()
}

fn fixture() -> (TestDirectory, TestDirectory, String) {
    let repository = TestDirectory::new("repo");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    for (path, source) in [
        (
            "calls.ts",
            "function tsTarget() {}\nfunction tsCaller() { tsTarget(); }\n",
        ),
        (
            "calls.tsx",
            "function tsxTarget() { return <div />; }\nfunction tsxCaller() { return tsxTarget(); }\n",
        ),
        (
            "calls.go",
            "package sample\nfunc goTarget() {}\nfunc goCaller() { goTarget() }\n",
        ),
        (
            "calls.java",
            "final class Calls { static void javaTarget() {} static void javaCaller() { javaTarget(); } }\n",
        ),
        (
            "calls.py",
            "def py_target():\n    pass\n\ndef py_caller():\n    py_target()\n",
        ),
        (
            "calls.rs",
            "fn rust_target() {}\nfn rust_caller() { rust_target(); }\n",
        ),
        ("duplicate.rs", "fn rust_target() {}\n"),
    ] {
        fs::write(repository.path().join(path), source).unwrap();
    }
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let revision = git(repository.path(), &["rev-parse", "HEAD"]);
    let state = TestDirectory::new("state");
    Runtime::index(repository.path(), state.path()).unwrap();
    (repository, state, revision)
}

#[test]
fn ambiguous_and_missing_endpoints_are_reported_without_guessing() {
    let (repository, state, revision) = fixture();
    let runtime = Runtime::open(state.path()).unwrap();
    let rows = [
        serde_json::json!({
            "schema":"cgrx.runtime.v1", "repo_revision":revision, "environment":"test",
            "observed_at_unix_nanos":"42", "count":1,
            "caller":{"function":"rust_target"},
            "callee":{"function":"rust_caller","file":"calls.rs","line":2}
        }),
        serde_json::json!({
            "schema":"cgrx.runtime.v1", "repo_revision":revision, "environment":"test",
            "observed_at_unix_nanos":"42", "count":1,
            "caller":{"function":"missing_symbol"},
            "callee":{"function":"rust_caller","file":"calls.rs","line":2}
        }),
    ];
    let input = rows
        .into_iter()
        .map(|row| row.to_string())
        .collect::<Vec<_>>()
        .join("\n");
    let report = runtime
        .import_runtime_evidence(
            repository.path(),
            input.as_bytes(),
            RuntimeEvidenceFormat::Ndjson,
            None,
            None,
        )
        .unwrap();
    assert_eq!(report.accepted, 0);
    assert_eq!(report.ambiguous, 1);
    assert_eq!(report.unresolved, 1);
    assert!(
        report
            .gaps
            .iter()
            .any(|gap| gap.code == "runtime_ambiguous")
    );
    assert!(
        report
            .gaps
            .iter()
            .any(|gap| gap.code == "runtime_unresolved")
    );
}

fn ndjson(revision: &str) -> Vec<u8> {
    let rows = [
        ("tsCaller", "calls.ts", 2, "tsTarget", 1),
        ("tsxCaller", "calls.tsx", 2, "tsxTarget", 1),
        ("goCaller", "calls.go", 3, "goTarget", 2),
        ("javaCaller", "calls.java", 1, "javaTarget", 1),
        ("py_caller", "calls.py", 4, "py_target", 1),
        ("rust_caller", "calls.rs", 2, "rust_target", 1),
    ];
    rows.into_iter()
        .map(|(caller, file, caller_line, callee, callee_line)| {
            serde_json::json!({
                "schema":"cgrx.runtime.v1",
                "repo_revision":revision,
                "environment":"test",
                "observed_at_unix_nanos":"42",
                "count":1,
                "caller":{"function":caller,"file":file,"line":caller_line},
                "callee":{"function":callee,"file":file,"line":callee_line}
            })
            .to_string()
        })
        .collect::<Vec<_>>()
        .join("\n")
        .into_bytes()
}

fn scope() -> Scope {
    Scope {
        include: vec!["**".to_owned()],
        exclude: Vec::new(),
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 4,
    }
}

#[test]
fn ndjson_resolves_every_supported_extension_and_observed_traversal() {
    let (repository, state, revision) = fixture();
    let runtime = Runtime::open(state.path()).unwrap();

    let report = runtime
        .import_runtime_evidence(
            repository.path(),
            &ndjson(&revision),
            RuntimeEvidenceFormat::Ndjson,
            None,
            None,
        )
        .unwrap();

    assert_eq!(report.accepted, 6);
    assert_eq!(report.ambiguous, 0);
    assert_eq!(report.unresolved, 0);
    assert_eq!(runtime.runtime_evidence_status().unwrap().edges, 6);

    let traced = runtime
        .trace_path_with_evidence(
            "rust_target",
            Some("calls.rs"),
            "callers",
            1,
            &scope(),
            10,
            EvidenceSelector::Observed,
        )
        .unwrap();
    assert_eq!(traced["nodes"][0]["symbol"], "rust_caller");
    assert_eq!(traced["nodes"][0]["evidence"], "observed");
    assert_eq!(traced["nodes"][0]["count"], 1);

    let fused = runtime
        .trace_path_with_evidence(
            "rust_target",
            Some("calls.rs"),
            "callers",
            1,
            &scope(),
            10,
            EvidenceSelector::All,
        )
        .unwrap();
    assert_eq!(fused["nodes"][0]["evidence"], "static+observed");

    let single_row = ndjson(&revision)
        .split(|byte| *byte == b'\n')
        .next()
        .unwrap()
        .to_vec();
    let auto = runtime
        .import_runtime_evidence(
            repository.path(),
            &single_row,
            RuntimeEvidenceFormat::Auto,
            None,
            None,
        )
        .unwrap();
    assert_eq!(auto.accepted, 1);
}

#[test]
fn otlp_parent_child_import_discards_sensitive_payloads_and_raw_ids() {
    let (repository, state, revision) = fixture();
    let runtime = Runtime::open(state.path()).unwrap();
    let endpoint_attributes = |function: &str, line: u64| {
        vec![
            serde_json::json!({"key":"code.function.name","value":{"stringValue":function}}),
            serde_json::json!({"key":"code.file.path","value":{"stringValue":"calls.rs"}}),
            serde_json::json!({"key":"code.line.number","value":{"intValue":line.to_string()}}),
        ]
    };
    let mut parent_attributes = endpoint_attributes("rust_caller", 2);
    parent_attributes.extend([
        serde_json::json!({"key":"url.full","value":{"stringValue":"https://secret.invalid/token"}}),
        serde_json::json!({"key":"db.statement","value":{"stringValue":"SELECT secret FROM users"}}),
        serde_json::json!({"key":"code.arguments","value":{"stringValue":"password=hunter2"}}),
        serde_json::json!({"key":"exception.stacktrace","value":{"stringValue":"PRIVATE_STACK"}}),
    ]);
    let input = serde_json::to_vec(&serde_json::json!({
        "resourceSpans":[{
            "resource":{"attributes":[
                {"key":"vcs.repository.ref.revision","value":{"stringValue":revision}},
                {"key":"deployment.environment.name","value":{"stringValue":"test"}}
            ]},
            "scopeSpans":[{"spans":[
                {"traceId":"RAW_TRACE_IDENTIFIER","spanId":"RAW_PARENT_IDENTIFIER","startTimeUnixNano":"40","endTimeUnixNano":"42","attributes":parent_attributes},
                {"traceId":"RAW_TRACE_IDENTIFIER","spanId":"RAW_CHILD_IDENTIFIER","parentSpanId":"RAW_PARENT_IDENTIFIER","startTimeUnixNano":"41","endTimeUnixNano":"42","attributes":endpoint_attributes("rust_target", 1)}
            ]}]
        }]
    })).unwrap();

    let report = runtime
        .import_runtime_evidence(
            repository.path(),
            &input,
            RuntimeEvidenceFormat::OtlpJson,
            None,
            None,
        )
        .unwrap();
    assert_eq!(report.accepted, 1);

    let mut persisted = Vec::new();
    collect_bytes(state.path(), &mut persisted);
    let persisted = String::from_utf8_lossy(&persisted);
    for forbidden in [
        "RAW_TRACE_IDENTIFIER",
        "RAW_PARENT_IDENTIFIER",
        "RAW_CHILD_IDENTIFIER",
        "secret.invalid",
        "SELECT secret",
        "hunter2",
        "PRIVATE_STACK",
    ] {
        assert!(
            !persisted.contains(forbidden),
            "persisted forbidden value {forbidden}"
        );
    }
}

#[test]
fn deterministic_runtime_insights_explain_priority_without_an_llm() {
    let (repository, state, revision) = fixture();
    let runtime = Runtime::open(state.path()).unwrap();
    let input = serde_json::json!({
        "schema":"cgrx.runtime.v1", "repo_revision":revision, "environment":"test",
        "observed_at_unix_nanos":"42", "count":20,
        "caller":{"function":"tsCaller","file":"calls.ts","line":2},
        "callee":{"function":"rust_target","file":"calls.rs","line":1}
    })
    .to_string();
    runtime
        .import_runtime_evidence(
            repository.path(),
            input.as_bytes(),
            RuntimeEvidenceFormat::Ndjson,
            None,
            None,
        )
        .unwrap();
    let report = runtime.runtime_insights(&scope(), 10).unwrap();
    assert!(!report.llm_used);
    assert_eq!(report.algorithm, "runtime_priority_v1");
    let target = report
        .rows
        .iter()
        .find(|row| row.symbol == "rust_target" && row.path == "calls.rs")
        .unwrap();
    assert_eq!(target.observed_count, 20);
    assert_eq!(target.divergent_edges, 1);
    assert!(target.signals.contains(&"dynamic_hot_path".to_owned()));
    assert!(
        target
            .signals
            .contains(&"static_runtime_divergence".to_owned())
    );
    assert_eq!(target.next_action, "inspect_dynamic_dispatch");
    assert_eq!(target.formula["version"], "runtime_priority_v1");
    assert_eq!(target.refactor_priority, 240);
}

#[test]
fn changed_graph_snapshot_never_reuses_stale_runtime_ranking() {
    let (repository, state, revision) = fixture();
    let mut runtime = Runtime::open(state.path()).unwrap();
    runtime
        .import_runtime_evidence(
            repository.path(),
            &ndjson(&revision),
            RuntimeEvidenceFormat::Ndjson,
            None,
            None,
        )
        .unwrap();
    fs::write(
        repository.path().join("calls.rs"),
        "fn rust_target() {}\nfn rust_caller() { rust_target(); }\n\n",
    )
    .unwrap();
    assert!(runtime.refresh(repository.path()).unwrap());
    let report = runtime.runtime_insights(&scope(), 10).unwrap();
    assert_eq!(report.total, 0);
    assert_eq!(runtime.runtime_evidence_status().unwrap().edges, 0);
}

fn collect_bytes(path: &Path, output: &mut Vec<u8>) {
    for entry in fs::read_dir(path).unwrap() {
        let path = entry.unwrap().path();
        if path.is_dir() {
            collect_bytes(&path, output);
        } else {
            output.extend(fs::read(path).unwrap());
        }
    }
}
