use cgrx_mcp::{gate_to_sarif, severity_level, verdict_level};
use serde_json::{Value, json};

fn results(sarif: &Value) -> &Vec<Value> {
    sarif
        .pointer("/runs/0/results")
        .and_then(Value::as_array)
        .expect("runs[0].results must be an array")
}

#[test]
fn change_fail_golden() {
    let gate = json!({
        "structuredContent": {
            "findings": [
                {"code": "PARSER_ERROR_RANGE", "path": "src/broken.ts", "line": 5, "message": "Parser error", "severity": "error"},
                {"code": "EXCLUDED_PATH", "path": "vendor/gen.ts", "line": 1, "message": "Excluded path", "severity": "warning"}
            ]
        }
    });
    let sarif = gate_to_sarif("check_change_gates", &gate, None).expect("renders");
    let res = results(&sarif);
    assert_eq!(res.len(), 2);
    assert_eq!(res[0]["ruleId"], "PARSER_ERROR_RANGE");
    assert_eq!(res[0]["level"], "error");
    assert_eq!(res[1]["ruleId"], "EXCLUDED_PATH");
    assert_eq!(res[1]["level"], "warning");
}

#[test]
fn repository_warn_golden() {
    let gate = json!({
        "structuredContent": {
            "findings": [
                {"code": "max_package_fan_out", "path": "src/lib.rs", "line": 10, "message": "Fan-out 24 exceeds threshold 20", "severity": "warning"}
            ]
        }
    });
    let sarif = gate_to_sarif("check_repository_gates", &gate, None).expect("renders");
    let res = results(&sarif);
    assert_eq!(res.len(), 1);
    assert_eq!(res[0]["ruleId"], "max_package_fan_out");
    assert_eq!(res[0]["level"], "warning");
}

#[test]
fn verdict_levels_cover_all_outcomes() {
    assert_eq!(verdict_level("PASS"), "none");
    assert_eq!(verdict_level("WARN"), "warning");
    assert_eq!(verdict_level("FAIL"), "error");
    assert_eq!(severity_level("error"), "error");
    assert_eq!(severity_level("warning"), "warning");
    assert_eq!(severity_level("note"), "note");
}

#[test]
fn empty_findings_produce_empty_results() {
    let gate = json!({
        "structuredContent": {
            "findings": []
        }
    });
    let sarif = gate_to_sarif("check_change_gates", &gate, None).expect("renders");
    assert_eq!(results(&sarif).len(), 0);
}

#[test]
fn missing_structured_content_returns_empty_results() {
    let gate = json!({"verdict": "PASS"});
    let sarif = gate_to_sarif("check_change_gates", &gate, None).expect("renders");
    assert_eq!(results(&sarif).len(), 0);
}

#[test]
fn findings_with_defaults() {
    let gate = json!({
        "structuredContent": {
            "findings": [
                {"code": "test_rule"}
            ]
        }
    });
    let sarif = gate_to_sarif("check_change_gates", &gate, None).expect("renders");
    let res = results(&sarif);
    assert_eq!(res.len(), 1);
    assert_eq!(res[0]["ruleId"], "test_rule");
    assert_eq!(res[0]["level"], "warning");
    let loc = &res[0]["locations"][0]["physicalLocation"];
    assert_eq!(loc["artifactLocation"]["uri"], "");
    assert_eq!(loc["region"]["startLine"], 1);
}

#[test]
fn sarif_schema_version() {
    let gate = json!({
        "structuredContent": {
            "findings": [
                {"code": "test", "path": "src/main.rs", "line": 42, "message": "test finding", "severity": "error"}
            ]
        }
    });
    let sarif = gate_to_sarif("check_change_gates", &gate, None).expect("renders");
    let schema = sarif["$schema"].as_str().unwrap();
    assert!(schema.contains("2.1.0"), "schema URL: {}", schema);
    assert_eq!(sarif["version"], "2.1.0");
    assert_eq!(
        sarif["runs"][0]["tool"]["driver"]["name"],
        "check_change_gates"
    );
}
