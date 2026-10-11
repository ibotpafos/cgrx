use std::cell::Cell;
use std::path::Path;

use cgrx_mcp::{SarifResult, gate_to_sarif, severity_level, to_sarif, verdict_level};
use serde_json::{Value, json};

fn results(sarif: &Value) -> &[Value] {
    sarif
        .pointer("/runs/0/results")
        .and_then(Value::as_array)
        .expect("SARIF results")
}

fn report(verdict: &str) -> Value {
    let rules = match verdict {
        "FAIL" => json!([
            {"rule":"max_warning_findings","value":2,"threshold":0,"severity":"error","status":"breached"},
            {"rule":"max_coverage_gaps","value":2,"threshold":0,"severity":"error","status":"breached"}
        ]),
        "WARN" => json!([
            {"rule":"max_package_fan_out","value":24,"threshold":20,"severity":"warning","status":"breached"},
            {"rule":"max_coverage_gaps","value":0,"threshold":0,"severity":"error","status":"passed"}
        ]),
        "INCONCLUSIVE" => json!([
            {"rule":"max_coverage_gaps","value":1,"threshold":10,"severity":"error","status":"passed"}
        ]),
        _ => json!([
            {"rule":"max_coverage_gaps","value":0,"threshold":0,"severity":"error","status":"passed"}
        ]),
    };
    let gaps = match verdict {
        "FAIL" => json!([
            {"code":"PARSER_ERROR_RANGE","path":"src/broken.ts","start":5,"end":12},
            {"code":"DYNAMIC_DISPATCH","location":"src/dyn.ts:4-9"}
        ]),
        "INCONCLUSIVE" => json!([{"code":"TRAVERSAL_TRUNCATED"}]),
        _ => json!([]),
    };
    json!({
        "snapshot":{
            "repo_revision":"0123456789abcdef0123456789abcdef01234567",
            "working_tree_digest":"0000000000000000000000000000000000000000000000000000000000000000",
            "graph_generation":1
        },
        "algorithm":if verdict == "FAIL" || verdict == "PASS" {"change_quality_gate_v1"} else {"repository_quality_gate_v1"},
        "llm_used":false,"verdict":verdict,
        "would_block":matches!(verdict,"FAIL"|"INCONCLUSIVE"),
        "fail_on":"error","partial":matches!(verdict,"FAIL"|"INCONCLUSIVE"),
        "rules":rules,"coverage_gap_count":gaps.as_array().expect("gaps").len(),
        "coverage_gaps":gaps,
        "agent_handoff":{"schema_version":"cgrx.agent.quality-gate.v1","requirements":["Revalidate the snapshot before acting."]}
    })
}

fn assert_golden(name: &str, tool: &str, input: &Value) {
    let sarif = gate_to_sarif(tool, input, None).expect("real gate renders");
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests/sarif/data")
        .join(name);
    if std::env::var_os("CGRX_UPDATE_SARIF_GOLDENS").is_some() {
        std::fs::write(
            &path,
            format!("{}\n", serde_json::to_string_pretty(&sarif).expect("JSON")),
        )
        .expect("update golden");
    }
    let expected: Value =
        serde_json::from_slice(&std::fs::read(path).expect("golden exists")).expect("golden JSON");
    assert_eq!(sarif, expected);
}

#[test]
fn change_fail_golden() {
    assert_golden(
        "change_fail.golden.json",
        "check_change_gates",
        &report("FAIL"),
    );
}

#[test]
fn repository_warn_golden() {
    assert_golden(
        "repository_warn.golden.json",
        "check_repository_gates",
        &report("WARN"),
    );
}

#[test]
fn change_pass_golden() {
    assert_golden(
        "change_pass.golden.json",
        "check_change_gates",
        &report("PASS"),
    );
}

#[test]
fn repository_inconclusive_golden() {
    assert_golden(
        "repository_inconclusive.golden.json",
        "check_repository_gates",
        &report("INCONCLUSIVE"),
    );
}

#[test]
fn verdict_levels_cover_all_outcomes() {
    assert_eq!(verdict_level("PASS"), "note");
    assert_eq!(verdict_level("WARN"), "warning");
    assert_eq!(verdict_level("FAIL"), "error");
    assert_eq!(verdict_level("INCONCLUSIVE"), "warning");
    assert_eq!(verdict_level("invalid"), "warning");
    assert_eq!(severity_level("error"), "error");
    assert_eq!(severity_level("warning"), "warning");
    assert_eq!(severity_level("note"), "note");
}

#[test]
fn raw_structured_content_and_mcp_envelopes_match() {
    let input = report("FAIL");
    let expected = gate_to_sarif("check_change_gates", &input, None).expect("raw");
    for wrapped in [
        json!({"structuredContent":input}),
        json!({"result":{"structuredContent":input}}),
    ] {
        assert_eq!(
            gate_to_sarif("check_change_gates", &wrapped, None).expect("envelope"),
            expected
        );
    }
}

#[test]
fn pass_always_has_one_note_without_a_fabricated_location() {
    let sarif = gate_to_sarif("check_change_gates", &report("PASS"), None).expect("PASS");
    assert_eq!(results(&sarif).len(), 1);
    assert_eq!(results(&sarif)[0]["ruleId"], "cgrx/gate-verdict");
    assert_eq!(results(&sarif)[0]["level"], "note");
    assert!(results(&sarif)[0].get("locations").is_none());
}

#[test]
fn malformed_reports_never_become_empty_successes() {
    for input in [
        json!({}),
        json!({"verdict":"PASS"}),
        json!({"structuredContent":{"findings":[]}}),
    ] {
        assert!(gate_to_sarif("check_change_gates", &input, None).is_err());
    }
    assert!(gate_to_sarif("unknown_gate", &report("PASS"), None).is_err());
    for (field, invalid) in [
        ("verdict", json!("UNKNOWN")),
        ("partial", json!("false")),
        ("would_block", json!(null)),
        ("rules", json!({})),
        ("fail_on", json!("invalid")),
        ("llm_used", json!(true)),
    ] {
        let mut input = report("PASS");
        input[field] = invalid;
        assert!(
            gate_to_sarif("check_change_gates", &input, None).is_err(),
            "{field}"
        );
    }
}

#[test]
fn inconsistent_pass_or_blocking_policy_is_rejected() {
    let mut input = report("INCONCLUSIVE");
    input["verdict"] = json!("PASS");
    assert!(gate_to_sarif("check_repository_gates", &input, None).is_err());
    let mut input = report("FAIL");
    input["would_block"] = json!(false);
    assert!(gate_to_sarif("check_change_gates", &input, None).is_err());
}

#[test]
fn advisory_policy_preserves_inconclusive_warning() {
    let mut input = report("INCONCLUSIVE");
    input["fail_on"] = json!("none");
    input["would_block"] = json!(false);
    let sarif = gate_to_sarif("check_repository_gates", &input, None).expect("advisory");
    assert_eq!(results(&sarif)[0]["level"], "warning");
    assert_eq!(sarif["runs"][0]["properties"]["cgrxWouldBlock"], false);
}

#[test]
fn parser_span_resolves_exclusive_end_to_the_last_covered_line() {
    let input = report("FAIL");
    let offsets = std::rc::Rc::new(Cell::new(Vec::new()));
    let resolver_offsets = offsets.clone();
    let resolve = move |path: &str, offset| {
        assert_eq!(path, "src/broken.ts");
        let mut called = resolver_offsets.take();
        called.push(offset);
        resolver_offsets.set(called);
        Some(if offset < 8 { 2 } else { 3 })
    };
    let sarif = gate_to_sarif("check_change_gates", &input, Some(&resolve)).expect("resolved");
    let gap = results(&sarif)
        .iter()
        .find(|item| item["properties"]["cgrxEvidence"]["code"] == "PARSER_ERROR_RANGE")
        .expect("gap");
    assert_eq!(
        gap["locations"][0]["physicalLocation"]["region"],
        json!({"startLine":2,"endLine":3})
    );
    assert_eq!(offsets.take(), vec![5, 11]);
}

#[test]
fn missing_or_invalid_line_resolver_preserves_byte_evidence() {
    let missing = |_: &str, _: u64| None;
    let zero = |_: &str, _: u64| Some(0_u64);
    for resolver in [
        None,
        Some(&missing as &cgrx_mcp::LineResolver),
        Some(&zero as &cgrx_mcp::LineResolver),
    ] {
        let sarif =
            gate_to_sarif("check_change_gates", &report("FAIL"), resolver).expect("fallback");
        let gap = results(&sarif)
            .iter()
            .find(|item| item["properties"]["cgrxEvidence"]["code"] == "PARSER_ERROR_RANGE")
            .expect("gap");
        assert_eq!(
            gap["locations"][0]["physicalLocation"]["region"],
            json!({"byteOffset":5,"byteLength":7})
        );
    }
}

#[test]
fn opaque_dispatch_location_does_not_guess_span_units() {
    let sarif = gate_to_sarif("check_change_gates", &report("FAIL"), None).expect("dispatch");
    let gap = results(&sarif)
        .iter()
        .find(|item| item["properties"]["cgrxEvidence"]["code"] == "DYNAMIC_DISPATCH")
        .expect("gap");
    let location = &gap["locations"][0]["physicalLocation"];
    assert_eq!(location["artifactLocation"]["uri"], "src/dyn.ts");
    assert!(location.get("region").is_none());
}

#[test]
fn absent_invalid_or_external_paths_never_invoke_resolver() {
    let mut input = report("INCONCLUSIVE");
    input["coverage_gaps"] = json!([
        {"code":"PATHLESS"},{"code":"ROOT","path":"."},
        {"code":"ABSOLUTE","path":"/etc/secret"},
        {"code":"PARENT","path":"src/../../secret"},
        {"code":"WINDOWS","path":"C:\\secret"},
        {"code":"CONTROL","path":"src/\nsecret"}
    ]);
    let resolver = |_: &str, _| panic!("unsafe path reached source resolver");
    let sarif =
        gate_to_sarif("check_repository_gates", &input, Some(&resolver)).expect("no location");
    assert!(
        results(&sarif)
            .iter()
            .all(|item| item.get("locations").is_none())
    );
}

#[test]
fn repository_filenames_are_uri_encoded() {
    let mut input = report("INCONCLUSIVE");
    input["coverage_gaps"] = json!([{"code":"EXCLUDED_PATH","path":"src/a #?%.ts"}]);
    let sarif = gate_to_sarif("check_repository_gates", &input, None).expect("encoded");
    assert_eq!(
        results(&sarif)[1]["locations"][0]["physicalLocation"]["artifactLocation"]["uri"],
        "src/a%20%23%3F%25.ts"
    );
}

#[test]
fn deterministic_order_and_fingerprints_survive_upstream_reordering() {
    let original = report("FAIL");
    let mut reordered = original.clone();
    reordered["rules"].as_array_mut().expect("rules").reverse();
    reordered["coverage_gaps"]
        .as_array_mut()
        .expect("gaps")
        .reverse();
    let expected = gate_to_sarif("check_change_gates", &original, None).expect("original");
    for _ in 0..10 {
        assert_eq!(
            gate_to_sarif("check_change_gates", &reordered, None).expect("reordered"),
            expected
        );
    }
    let fingerprints = results(&expected)
        .iter()
        .map(|result| {
            result["partialFingerprints"]["cgrxEvidence/v1"]
                .as_str()
                .expect("digest")
        })
        .collect::<std::collections::BTreeSet<_>>();
    assert_eq!(fingerprints.len(), results(&expected).len());
    assert!(fingerprints.iter().all(|digest| digest.len() == 64));
}

#[test]
fn rule_validation_rejects_duplicate_or_malformed_rules() {
    for rule in [
        json!({"rule":"","value":0,"threshold":0,"severity":"error","status":"passed"}),
        json!({"rule":"test","value":-1,"threshold":0,"severity":"error","status":"passed"}),
        json!({"rule":"test","value":0,"threshold":0,"severity":"invalid","status":"passed"}),
        json!({"rule":"test","value":0,"threshold":0,"severity":"error","status":"unknown"}),
    ] {
        let mut input = report("PASS");
        input["rules"] = json!([rule]);
        assert!(gate_to_sarif("check_change_gates", &input, None).is_err());
    }
    let mut input = report("PASS");
    let duplicate = input["rules"][0].clone();
    input["rules"]
        .as_array_mut()
        .expect("rules")
        .push(duplicate);
    assert!(gate_to_sarif("check_change_gates", &input, None).is_err());
}

#[test]
fn security_findings_have_exact_lines_without_exporting_secret_values() {
    let mut input = report("FAIL");
    input["algorithm"] = json!("security_audit_v1");
    input["rules"] = json!([{"rule":"max_secret_findings","value":1,"threshold":0,"severity":"error","status":"breached"}]);
    input["partial"] = json!(false);
    input["coverage_gaps"] = json!([]);
    input["secret_findings"] = json!([{"path":"config.rs","line":7,"rule":"API_KEY","severity":"error","confidence":"candidate","source":"do-not-export-secret-value"}]);
    let sarif = gate_to_sarif("check_security_gates", &input, None).expect("security");
    let finding = results(&sarif)
        .iter()
        .find(|result| result.get("locations").is_some())
        .expect("secret location");
    assert_eq!(
        finding["locations"][0]["physicalLocation"]["region"]["startLine"],
        7
    );
    assert!(!sarif.to_string().contains("do-not-export-secret-value"));
}

#[test]
fn security_partial_evidence_has_its_own_declared_warning_rule() {
    let mut input = report("INCONCLUSIVE");
    input["rules"] = json!([]);
    input["algorithm"] = json!("security_audit_v1");
    input["coverage_gap_count"] = json!(100);
    let sarif = gate_to_sarif("check_security_gates", &input, None).expect("security gap");
    assert_eq!(results(&sarif)[1]["ruleId"], "cgrx/coverage-gap");
    assert!(
        sarif["runs"][0]["tool"]["driver"]["rules"]
            .as_array()
            .expect("rules")
            .iter()
            .any(|rule| rule["id"] == "cgrx/coverage-gap")
    );
    assert_eq!(sarif["runs"][0]["properties"]["cgrxCoverageGapCount"], 100);
}

#[test]
fn parser_or_scan_error_source_never_enters_sarif_or_fingerprints() {
    let mut clean = report("INCONCLUSIVE");
    clean["rules"] = json!([]);
    clean["algorithm"] = json!("security_audit_v1");
    clean["coverage_gaps"] = json!([{"code":"cgrx.lock_parse","component":"dependencies"}]);
    let expected = gate_to_sarif("check_security_gates", &clean, None).expect("safe metadata");
    let mut with_source = clean;
    with_source["coverage_gaps"][0]["detail"] =
        json!("TOML error: source = 'https://user:sentinel-secret-value@example.invalid'");
    with_source["coverage_gaps"][0]["source"] = json!("sentinel-secret-value");
    with_source["coverage_gaps"][0]["text"] = json!("sentinel-secret-value");
    let actual = gate_to_sarif("check_security_gates", &with_source, None).expect("redacted error");
    assert_eq!(
        actual, expected,
        "source text must not affect fingerprints or metadata"
    );
    assert!(!actual.to_string().contains("sentinel-secret-value"));
}

#[test]
fn framework_gate_uses_the_same_real_rule_contract() {
    let mut input = report("WARN");
    input["algorithm"] = json!("framework_detection_gate_v1");
    let sarif = gate_to_sarif("check_framework_gates", &input, None).expect("framework");
    assert_eq!(sarif["runs"][0]["properties"]["cgrxGate"], "framework");
    assert_eq!(results(&sarif)[0]["level"], "warning");
}

#[test]
fn generic_sarif_export_retains_api_with_deterministic_descriptors() {
    let input = vec![
        SarifResult::dead_code("b.rs", 2, "b"),
        SarifResult::parser_error("a.rs", 0, 3),
    ];
    let expected = to_sarif("cgrx", "test", &input);
    for _ in 0..10 {
        assert_eq!(to_sarif("cgrx", "test", &input), expected);
    }
    assert_eq!(expected["version"], "2.1.0");
    assert_eq!(
        expected["runs"][0]["tool"]["driver"]["rules"][0]["id"],
        "dead-code"
    );
}
