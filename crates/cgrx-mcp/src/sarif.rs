//! SARIF (Static Analysis Results Interchange Format) export.
//!
//! Converts CGRX graph data to SARIF 2.1.0 format for interoperability
//! with other static analysis tools.

use serde_json::{json, Value};

/// Convert CGRX findings to SARIF 2.1.0 format.
pub fn to_sarif(
    tool_name: &str,
    tool_version: &str,
    results: &[SarifResult],
) -> Value {
    let rules: Vec<Value> = results
        .iter()
        .map(|r| r.rule_id.clone())
        .collect::<std::collections::HashSet<_>>()
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
                    "informationUri": "https://github.com/cgrx/cgrx",
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

/// Convert gate check results to SARIF format.
pub fn gate_to_sarif(
    tool: &str,
    value: &Value,
    _resolver: Option<&LineResolver>,
) -> Result<Value, String> {
    let results = extract_gate_results(value)?;
    Ok(to_sarif(tool, env!("CARGO_PKG_VERSION"), &results))
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
        "PASS" => "none",
        "WARN" => "warning",
        "FAIL" => "error",
        _ => "note",
    }
}

fn extract_gate_results(value: &Value) -> Result<Vec<SarifResult>, String> {
    let mut results = Vec::new();

    // Extract from structured content
    if let Some(findings) = value.pointer("/structuredContent/findings").and_then(Value::as_array)
    {
        for finding in findings {
            let rule_id = finding
                .get("code")
                .and_then(Value::as_str)
                .unwrap_or("unknown")
                .to_owned();
            let path = finding
                .get("path")
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_owned();
            let message = finding
                .get("message")
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_owned();
            let severity = finding
                .get("severity")
                .and_then(Value::as_str)
                .unwrap_or("warning")
                .to_owned();
            let line = finding
                .get("line")
                .and_then(Value::as_u64)
                .unwrap_or(1) as u32;

            let fingerprint = format!("gate:{}:{}", path, line);
            results.push(SarifResult {
                rule_id,
                path,
                start_line: line,
                start_column: 1,
                end_line: line,
                end_column: 1,
                message,
                severity,
                fingerprint,
            });
        }
    }

    Ok(results)
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
