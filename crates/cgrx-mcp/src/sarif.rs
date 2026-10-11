//! SARIF (Static Analysis Results Interchange Format) export.
//!
//! Converts CGRX graph data to SARIF 2.1.0 format for interoperability
//! with other static analysis tools.

use std::collections::BTreeSet;

use cgrx_core::canonical_hash;
use serde::Deserialize;
use serde_json::{Value, json};

/// Convert CGRX findings to SARIF 2.1.0 format.
pub fn to_sarif(tool_name: &str, tool_version: &str, results: &[SarifResult]) -> Value {
    let rules: Vec<Value> = results
        .iter()
        .map(|r| r.rule_id.clone())
        .collect::<BTreeSet<_>>()
        .into_iter()
        .map(|id| {
            json!({
                "id": id,
                "name": id,
                "shortDescription": {
                    "text": format!("CGRX rule: {}", id)
                },
                "defaultConfiguration": {
                    "level": "warning"
                }
            })
        })
        .collect();

    let sarif_results: Vec<Value> = results
        .iter()
        .map(|r| {
            json!({
                "ruleId": r.rule_id,
                "level": r.severity,
                "message": {
                    "text": r.message
                },
                "locations": [{
                    "physicalLocation": {
                        "artifactLocation": {
                            "uri": r.path
                        },
                        "region": {
                            "startLine": r.start_line,
                            "startColumn": r.start_column,
                            "endLine": r.end_line,
                            "endColumn": r.end_column
                        }
                    }
                }],
                "partialFingerprints": {
                    "primaryLocationLineHash": r.fingerprint
                }
            })
        })
        .collect();

    json!({
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [{
            "tool": {
                "driver": {
                    "name": tool_name,
                    "version": tool_version,
                    "informationUri": "https://github.com/ibotpafos/cgrx",
                    "rules": rules
                }
            },
            "results": sarif_results,
            "columnKind": "utf16CodeUnits"
        }]
    })
}

/// A single finding for SARIF export.
#[derive(Debug, Clone)]
pub struct SarifResult {
    pub rule_id: String,
    pub path: String,
    pub start_line: u32,
    pub start_column: u32,
    pub end_line: u32,
    pub end_column: u32,
    pub message: String,
    pub severity: String,
    pub fingerprint: String,
}

/// Resolve a file path and offset to a line number.
pub type LineResolver = dyn Fn(&str, u64) -> Option<u64>;

/// Convert the real gate structured content to SARIF 2.1.0.
///
/// Accepts raw structured content (as used by the CLI) or an MCP result
/// containing `structuredContent`. Malformed evidence returns an error instead
/// of an empty report. Source locations are optional and never invented.
pub fn gate_to_sarif(
    tool: &str,
    value: &Value,
    resolver: Option<&LineResolver>,
) -> Result<Value, String> {
    let gate = match tool {
        "check_change_gates" => "change",
        "check_repository_gates" => "repository",
        "check_framework_gates" => "framework",
        "check_security_gates" => "security",
        _ => return Err(format!("unsupported SARIF gate tool: {tool}")),
    };
    let value = value
        .get("structuredContent")
        .or_else(|| value.pointer("/result/structuredContent"))
        .unwrap_or(value);
    let report: GateReport = serde_json::from_value(value.clone())
        .map_err(|error| format!("invalid {tool} gate report: {error}"))?;
    if !matches!(
        report.verdict.as_str(),
        "PASS" | "WARN" | "FAIL" | "INCONCLUSIVE"
    ) {
        return Err(format!("invalid gate verdict: {}", report.verdict));
    }
    if !matches!(report.fail_on.as_str(), "error" | "warning" | "none") {
        return Err(format!("invalid gate fail_on: {}", report.fail_on));
    }
    if report.llm_used {
        return Err("deterministic gate report must have llm_used=false".to_owned());
    }

    let mut rules = report.rules;
    rules.sort_by(|left, right| left.rule.cmp(&right.rule));
    let mut ids = BTreeSet::new();
    for rule in &rules {
        if rule.rule.trim().is_empty()
            || matches!(rule.rule.as_str(), "gate-verdict" | "coverage-gap")
            || !ids.insert(&rule.rule)
        {
            return Err("gate rules must have unique non-empty names".to_owned());
        }
        if !matches!(rule.status.as_str(), "passed" | "breached")
            || !matches!(rule.severity.as_str(), "error" | "warning")
            || (rule.status == "breached") != (rule.value > rule.threshold)
        {
            return Err(format!("invalid gate rule: {}", rule.rule));
        }
    }
    let errors = rules
        .iter()
        .any(|rule| rule.status == "breached" && rule.severity == "error");
    let warnings = rules
        .iter()
        .any(|rule| rule.status == "breached" && rule.severity == "warning");
    let expected_verdict = if errors {
        "FAIL"
    } else if report.partial {
        "INCONCLUSIVE"
    } else if warnings {
        "WARN"
    } else {
        "PASS"
    };
    let expected_block = match report.fail_on.as_str() {
        "none" => false,
        "warning" => errors || warnings || report.partial,
        _ => errors || report.partial,
    };
    if report.verdict != expected_verdict || report.would_block != expected_block {
        return Err("gate verdict or blocking policy disagrees with its evidence".to_owned());
    }
    let mut descriptors = vec![json!({
        "id":"cgrx/gate-verdict",
        "name":"GateVerdict",
        "shortDescription":{"text":format!("Overall CGRX {gate} gate verdict.")},
        "fullDescription":{"text":"Snapshot-bound deterministic gate verdict. No tests or LLM were executed."}
    })];
    descriptors.extend(rules.iter().map(|rule| {
        json!({
            "id":format!("cgrx/{}",rule.rule),
            "name":rule.rule,
            "shortDescription":{"text":format!("CGRX threshold: {}",rule.rule)},
            "defaultConfiguration":{"level":rule.severity},
            "properties":{"threshold":rule.threshold}
        })
    }));
    let mut results = vec![gate_result(
        (gate, "cgrx/gate-verdict"),
        verdict_level(&report.verdict),
        format!(
            "cgrx {gate} gate verdict {} (fail_on={}, would_block={})",
            report.verdict, report.fail_on, report.would_block
        ),
        json!({"verdict":report.verdict}),
        None,
        "verdict",
    )?];
    for rule in rules.iter().filter(|rule| rule.status == "breached") {
        results.push(gate_result(
            (gate, &format!("cgrx/{}", rule.rule)),
            &rule.severity,
            format!(
                "cgrx {} breached: value {} exceeds threshold {} (severity {})",
                rule.rule, rule.value, rule.threshold, rule.severity
            ),
            json!({"value":rule.value,"threshold":rule.threshold,"status":rule.status}),
            None,
            &rule.rule,
        )?);
    }

    let coverage_rule = rules.iter().find(|rule| rule.rule == "max_coverage_gaps");
    if report.partial || coverage_rule.is_some_and(|rule| rule.status == "breached") {
        let rule_id = if coverage_rule.is_some() {
            "cgrx/max_coverage_gaps"
        } else {
            descriptors.push(json!({
                "id":"cgrx/coverage-gap",
                "name":"CoverageGap",
                "shortDescription":{"text":"Missing or partial CGRX evidence."},
                "defaultConfiguration":{"level":"warning"}
            }));
            "cgrx/coverage-gap"
        };
        for gap in optional_array(value, "coverage_gaps")? {
            // Parser and scan errors can embed original source lines in
            // `detail`. Export only machine-readable evidence metadata.
            let gap = coverage_evidence(gap);
            let code = gap.get("code").and_then(Value::as_str).unwrap_or("UNKNOWN");
            let path = gap.get("path").and_then(Value::as_str).or_else(|| {
                gap.get("location")
                    .and_then(Value::as_str)
                    .and_then(|location| location.rsplit_once(':').map(|(path, _)| path))
            });
            let location = evidence_location(path, &gap, resolver);
            results.push(gate_result(
                (gate, rule_id),
                "warning",
                format!(
                    "cgrx coverage gap {code}{}",
                    path.map_or(String::new(), |path| format!(": {path}"))
                ),
                gap.clone(),
                location,
                &format!("gap:{gap}"),
            )?);
        }
    }

    // Security findings retain only the detector's public metadata. Never
    // copy source text or fabricate locations for dependency/license records.
    for (field, rule_name) in [
        ("secret_findings", "max_secret_findings"),
        ("dependency_findings", "max_dependency_findings"),
        ("license_findings", "max_license_findings"),
    ] {
        let Some(rule) = rules
            .iter()
            .find(|rule| rule.rule == rule_name && rule.status == "breached")
        else {
            continue;
        };
        for finding in optional_array(value, field)? {
            let detail = json!({
                "rule":finding.get("rule"),"path":finding.get("path"),
                "line":finding.get("line"),"package":finding.get("package"),
                "version":finding.get("version"),"license":finding.get("license"),
                "confidence":finding.get("confidence"),"status":finding.get("status")
            });
            let path = finding.get("path").and_then(Value::as_str);
            let message = if field == "secret_findings" {
                format!(
                    "cgrx secret candidate {}{}",
                    finding
                        .get("rule")
                        .and_then(Value::as_str)
                        .unwrap_or("UNKNOWN"),
                    path.map_or(String::new(), |path| format!(": {path}"))
                )
            } else {
                format!(
                    "cgrx {field}: {} {} ({})",
                    finding
                        .get("package")
                        .and_then(Value::as_str)
                        .unwrap_or("unknown package"),
                    finding
                        .get("version")
                        .and_then(Value::as_str)
                        .unwrap_or("unknown version"),
                    finding
                        .get("rule")
                        .or_else(|| finding.get("license"))
                        .and_then(Value::as_str)
                        .unwrap_or("unknown finding")
                )
            };
            let identity = format!("finding:{detail}");
            results.push(gate_result(
                (gate, &format!("cgrx/{rule_name}")),
                &rule.severity,
                message,
                detail,
                evidence_location(path, finding, resolver),
                &identity,
            )?);
        }
    }
    // Keep the verdict first and sort detail results without relying on hash
    // iteration or an upstream detector's discovery order.
    results[1..].sort_by_cached_key(Value::to_string);
    descriptors[1..].sort_by_cached_key(|rule| rule["id"].as_str().unwrap_or("").to_owned());
    Ok(json!({
        "$schema":"https://json.schemastore.org/sarif-2.1.0.json",
        "version":"2.1.0",
        "runs":[{
            "automationDetails":{"id":format!("cgrx/{gate}-gates")},
            "tool":{"driver":{
                "name":"cgrx","version":env!("CARGO_PKG_VERSION"),
                "informationUri":"https://github.com/ibotpafos/cgrx",
                "rules":descriptors
            }},
            "results":results,
            "properties":{
                "cgrxGate":gate,"cgrxAlgorithm":report.algorithm,
                "cgrxVerdict":report.verdict,"cgrxWouldBlock":report.would_block,
                "cgrxFailOn":report.fail_on,"cgrxPartial":report.partial,
                "cgrxSnapshot":value.get("snapshot"),
                "cgrxCoverageGapCount":value.get("coverage_gap_count"),
                "cgrxAgentHandoff":value.get("agent_handoff"),
                "llmUsed":false
            }
        }]
    }))
}

#[derive(Deserialize)]
struct GateReport {
    algorithm: String,
    llm_used: bool,
    verdict: String,
    would_block: bool,
    fail_on: String,
    partial: bool,
    rules: Vec<GateRule>,
}

#[derive(Deserialize)]
struct GateRule {
    rule: String,
    value: u64,
    threshold: u64,
    severity: String,
    status: String,
}

fn optional_array<'a>(value: &'a Value, name: &str) -> Result<&'a [Value], String> {
    match value.get(name) {
        None | Some(Value::Null) => Ok(&[]),
        Some(Value::Array(values)) => Ok(values),
        Some(_) => Err(format!("gate {name} must be an array")),
    }
}

fn coverage_evidence(gap: &Value) -> Value {
    let mut evidence = serde_json::Map::new();
    for field in ["code", "component", "path", "location"] {
        if let Some(value) = gap.get(field).filter(|value| value.is_string()) {
            evidence.insert(field.to_owned(), value.clone());
        }
    }
    for field in [
        "start",
        "end",
        "total",
        "returned",
        "count",
        "offset",
        "limit",
        "next_offset",
    ] {
        if let Some(value) = gap
            .get(field)
            .filter(|value| value.is_u64() || value.is_null())
        {
            evidence.insert(field.to_owned(), value.clone());
        }
    }
    Value::Object(evidence)
}

fn gate_result(
    context: (&str, &str),
    level: &str,
    message: String,
    evidence: Value,
    location: Option<Value>,
    identity: &str,
) -> Result<Value, String> {
    let (gate, rule) = context;
    let digest = canonical_hash(&(gate, rule, format!("evidence:{identity}")))
        .map_err(|error| format!("SARIF fingerprint failed: {error}"))?;
    let mut result = json!({
        "ruleId":rule,"level":level,"message":{"text":message},
        "properties":{"cgrxEvidence":evidence},
        "partialFingerprints":{"cgrxEvidence/v1":digest}
    });
    if let Some(location) = location {
        result["locations"] = json!([{"physicalLocation":location}]);
    }
    Ok(result)
}

fn evidence_location(
    path: Option<&str>,
    evidence: &Value,
    resolver: Option<&LineResolver>,
) -> Option<Value> {
    let path = path.filter(|path| repository_path(path))?;
    let mut location = json!({"artifactLocation":{"uri":artifact_uri(path)}});
    if let (Some(start), Some(end)) = (
        evidence.get("start").and_then(Value::as_u64),
        evidence.get("end").and_then(Value::as_u64),
    ) {
        if end >= start {
            let lines = resolver.and_then(|resolve| {
                let first = resolve(path, start)?;
                let last = resolve(path, end.saturating_sub(1).max(start))?;
                (first > 0 && last >= first).then_some((first, last))
            });
            location["region"] = match lines {
                Some((first, last)) => json!({"startLine":first,"endLine":last}),
                None => json!({"byteOffset":start,"byteLength":end-start}),
            };
        }
    } else if let Some(line) = evidence
        .get("line")
        .and_then(Value::as_u64)
        .filter(|line| *line > 0)
    {
        location["region"] = json!({"startLine":line});
    }
    Some(location)
}

fn repository_path(path: &str) -> bool {
    !path.is_empty()
        && path != "."
        && !path.starts_with(['/', '\\'])
        && path.as_bytes().get(1) != Some(&b':')
        && !path.chars().any(char::is_control)
        && !path.split(['/', '\\']).any(|part| part == "..")
}

fn artifact_uri(path: &str) -> String {
    let mut uri = String::new();
    for byte in path.bytes() {
        if byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.' | b'~' | b'/') {
            uri.push(char::from(byte));
        } else {
            use std::fmt::Write;
            let _ = write!(uri, "%{byte:02X}");
        }
    }
    uri
}

/// Severity level for SARIF.
pub fn severity_level(level: &str) -> &str {
    match level {
        "error" => "error",
        "warning" => "warning",
        "note" => "note",
        _ => "none",
    }
}

/// Verdict level for gates.
pub fn verdict_level(verdict: &str) -> &str {
    match verdict {
        "PASS" => "note",
        "WARN" => "warning",
        "FAIL" => "error",
        _ => "warning",
    }
}

impl SarifResult {
    /// Create a dead code finding.
    pub fn dead_code(path: &str, line: u32, name: &str) -> Self {
        Self {
            rule_id: "dead-code".to_owned(),
            path: path.to_owned(),
            start_line: line,
            start_column: 1,
            end_line: line,
            end_column: 1,
            message: format!("Symbol '{}' has no incoming calls", name),
            severity: "warning".to_owned(),
            fingerprint: format!("dead:{}:{}", path, line),
        }
    }

    /// Create a parser error finding.
    pub fn parser_error(path: &str, start: usize, end: usize) -> Self {
        Self {
            rule_id: "parser-error".to_owned(),
            path: path.to_owned(),
            start_line: 1,
            start_column: 1,
            end_line: 1,
            end_column: 1,
            message: format!("Parser error at byte range {}-{}", start, end),
            severity: "error".to_owned(),
            fingerprint: format!("parse:{}:{}-{}", path, start, end),
        }
    }
}
