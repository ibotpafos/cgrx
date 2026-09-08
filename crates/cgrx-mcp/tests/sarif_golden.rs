use cgrx_mcp::{gate_to_sarif, severity_level, verdict_level};
use serde_json::{Value, json};

fn change_fail_gate() -> Value {
    json!({
        "snapshot": {"repo_revision": "abc123", "graph_generation": 4},
        "algorithm": "change_quality_gate_v1",
        "llm_used": false,
        "verdict": "FAIL",
        "would_block": true,
        "fail_on": "error",
        "rules": [
            {"rule": "max_warning_findings", "value": 2, "threshold": 0, "severity": "error", "status": "breached"},
            {"rule": "max_blocked_missions", "value": 0, "threshold": 0, "severity": "error", "status": "passed"},
            {"rule": "max_coverage_gaps", "value": 5, "threshold": 0, "severity": "error", "status": "breached"},
            {"rule": "max_unverified_impacts", "value": 0, "threshold": 0, "severity": "warning", "status": "passed"}
        ],
        "totals": {"errors": 2, "warnings": 0},
        "partial": false,
        "coverage_gaps": [
            {"code": "PARSER_ERROR_RANGE", "path": "src/broken.ts", "start": 0, "end": 25},
            {"code": "EXCLUDED_PATH", "path": "vendor/gen.ts"},
            {"code": "STALE_PATH", "path": "src/moved.ts"},
            {"code": "DYNAMIC_DISPATCH", "path": "src/dyn.ts", "location": "src/dyn.ts:4-9"},
            {"code": "DYNAMIC_DISPATCH", "location": "src/other.ts:1-2"},
            {"code": "TRAVERSAL_TRUNCATED", "scope": {"include": ["**/*"]}}
        ],
        "coverage_gap_count": 6
    })
}

fn repository_warn_gate() -> Value {
    json!({
        "snapshot": {"repo_revision": "def456", "graph_generation": 7},
        "algorithm": "repository_quality_gate_v1",
        "llm_used": false,
        "verdict": "WARN",
        "would_block": false,
        "fail_on": "error",
        "rules": [
            {"rule": "max_package_cycles", "value": 0, "threshold": 0, "severity": "error", "status": "passed"},
            {"rule": "max_package_fan_out", "value": 24, "threshold": 20, "severity": "warning", "status": "breached"},
            {"rule": "max_symbol_fan_in", "value": 3, "threshold": 50, "severity": "warning", "status": "passed"},
            {"rule": "max_unresolved_local_dependencies", "value": 0, "threshold": 0, "severity": "error", "status": "passed"},
            {"rule": "max_coverage_gaps", "value": 1, "threshold": 2, "severity": "error", "status": "passed"}
        ],
        "totals": {"errors": 0, "warnings": 1},
        "partial": false,
        "coverage_gaps": [{"code": "STALE_PATH", "path": "src/old.ts"}],
        "coverage_gap_count": 1
    })
}

fn golden(name: &str) -> Value {
    let path = format!("{}/tests/sarif/data/{name}", env!("CARGO_MANIFEST_DIR"));
    let text = std::fs::read_to_string(&path).expect("golden file must exist");
    serde_json::from_str(&text).expect("golden file must be JSON")
}

fn results(sarif: &Value) -> &Vec<Value> {
    sarif
        .pointer("/runs/0/results")
        .and_then(Value::as_array)
        .expect("runs[0].results must be an array")
}

#[test]
fn change_fail_golden() {
    let sarif = gate_to_sarif("check_change_gates", &change_fail_gate(), None)
        .expect("change gate must render");
    assert_eq!(sarif, golden("change_fail.golden.json"));
}

#[test]
fn repository_warn_golden() {
    let sarif = gate_to_sarif("check_repository_gates", &repository_warn_gate(), None)
        .expect("repository gate must render");
    assert_eq!(sarif, golden("repository_warn.golden.json"));
}

#[test]
fn verdict_levels_cover_all_outcomes() {
    assert_eq!(verdict_level("PASS"), "note");
    assert_eq!(verdict_level("WARN"), "warning");
    assert_eq!(verdict_level("FAIL"), "error");
    assert_eq!(verdict_level("INCONCLUSIVE"), "warning");
    assert_eq!(severity_level("error"), "error");
    assert_eq!(severity_level("warning"), "warning");
}

#[test]
fn summary_level_follows_verdict() {
    for (verdict, level) in [
        ("PASS", "note"),
        ("WARN", "warning"),
        ("FAIL", "error"),
        ("INCONCLUSIVE", "warning"),
    ] {
        let gate = json!({
            "verdict": verdict,
            "would_block": verdict != "PASS",
            "fail_on": "error",
            "rules": [],
            "partial": verdict == "INCONCLUSIVE",
        });
        let sarif = gate_to_sarif("check_change_gates", &gate, None).expect("renders");
        let summary = &results(&sarif)[0];
        assert_eq!(summary["ruleId"], "cgrx/gate-verdict");
        assert_eq!(summary["level"], level, "verdict {verdict}");
        assert!(
            summary["message"]["text"]
                .as_str()
                .is_some_and(|text| text.contains(verdict)),
            "summary must name the verdict"
        );
    }
}

#[test]
fn pass_gate_has_only_the_note_summary() {
    let gate = json!({
        "verdict": "PASS",
        "would_block": false,
        "fail_on": "error",
        "rules": [{"rule": "max_warning_findings", "value": 0, "threshold": 0, "severity": "error", "status": "passed"}],
        "partial": false,
    });
    let sarif = gate_to_sarif("check_change_gates", &gate, None).expect("renders");
    assert_eq!(results(&sarif).len(), 1);
}

#[test]
fn gaps_without_paths_produce_no_location_results() {
    let gate = json!({
        "verdict": "FAIL",
        "would_block": true,
        "fail_on": "error",
        "rules": [{"rule": "max_coverage_gaps", "value": 1, "threshold": 0, "severity": "error", "status": "breached"}],
        "coverage_gaps": [{"code": "TRAVERSAL_TRUNCATED"}],
        "partial": false,
    });
    let sarif = gate_to_sarif("check_change_gates", &gate, None).expect("renders");
    // Summary plus the breached rule; the pathless gap adds no result.
    assert_eq!(results(&sarif).len(), 2);
}

#[test]
fn resolver_maps_byte_offsets_to_lines() {
    let gate = json!({
        "verdict": "FAIL",
        "would_block": true,
        "fail_on": "error",
        "rules": [{"rule": "max_coverage_gaps", "value": 1, "threshold": 0, "severity": "error", "status": "breached"}],
        "coverage_gaps": [{"code": "PARSER_ERROR_RANGE", "path": "src/a.ts", "start": 10, "end": 40}],
        "partial": false,
    });
    let resolve = |path: &str, offset: u64| {
        assert_eq!(path, "src/a.ts");
        Some(offset + 1)
    };
    let sarif = gate_to_sarif("check_change_gates", &gate, Some(&resolve)).expect("renders");
    let region = &results(&sarif)[1]["locations"][0]["physicalLocation"]["region"];
    assert_eq!(region["startLine"], 11);
    assert_eq!(region["endLine"], 40);
    assert!(region.get("byteOffset").is_none());

    let sarif = gate_to_sarif("check_change_gates", &gate, None).expect("renders");
    let region = &results(&sarif)[1]["locations"][0]["physicalLocation"]["region"];
    assert_eq!(region["byteOffset"], 10);
    assert_eq!(region["byteLength"], 30);
}

#[test]
fn unknown_tool_is_rejected() {
    let gate = json!({"verdict": "PASS"});
    assert!(gate_to_sarif("scan_risks", &gate, None).is_err());
}
