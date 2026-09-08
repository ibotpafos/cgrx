//! Deterministic SARIF 2.1.0 rendering of CGRX quality-gate results.
//!
//! The converter is a pure function over the `structuredContent` JSON produced
//! by `check_change_gates` and `check_repository_gates`. It performs no I/O,
//! runs no tests, and invokes no LLM: every string is templated from gate
//! fields. Callers that have filesystem access may supply a line resolver
//! that maps a repo-relative path plus byte offset to a 1-based line number;
//! without it, byte spans are reported with `byteOffset`/`byteLength`.

use serde_json::{Value, json};

/// Byte-offset to 1-based-line resolver supplied by the caller.
pub type LineResolver<'a> = dyn Fn(&str, u64) -> Option<u64> + 'a;

const SARIF_SCHEMA: &str = "https://json.schemastore.org/sarif-2.1.0.json";
const SARIF_VERSION: &str = "2.1.0";
const VERDICT_RULE_ID: &str = "cgrx/gate-verdict";

/// Map a gate verdict to a SARIF level.
///
/// `PASS` is a note, `WARN` is a warning, `FAIL` is an error.
/// `INCONCLUSIVE` means the evidence was partial: it stays blocking unless
/// `fail_on` is `none`, so it surfaces as a warning rather than a silent pass.
#[must_use]
pub fn verdict_level(verdict: &str) -> &'static str {
    match verdict {
        "PASS" => "note",
        "WARN" => "warning",
        "FAIL" => "error",
        "INCONCLUSIVE" => "warning",
        _ => "warning",
    }
}

/// Map a gate rule severity to a SARIF level.
#[must_use]
pub fn severity_level(severity: &str) -> &'static str {
    match severity {
        "error" => "error",
        "warning" => "warning",
        _ => "warning",
    }
}

fn rule_description(rule: &str) -> &'static str {
    match rule {
        "max_warning_findings" => "Change findings above the warning budget.",
        "max_blocked_missions" => "Blocked change missions above the budget.",
        "max_unverified_impacts" => "Unverified blast-radius impacts above the budget.",
        "max_package_cycles" => "Package dependency cycles above the budget.",
        "max_package_fan_out" => "Maximum package fan-out above the budget.",
        "max_symbol_fan_in" => "Maximum symbol fan-in above the budget.",
        "max_unresolved_local_dependencies" => "Unresolved local dependencies above the budget.",
        "max_coverage_gaps" => "Index coverage gaps above the budget.",
        _ => "CGRX quality-gate policy breached.",
    }
}

fn gate_kind(tool: &str) -> Result<&'static str, String> {
    match tool {
        "check_change_gates" | "change" => Ok("change"),
        "check_repository_gates" | "repository" => Ok("repository"),
        _ => Err(format!(
            "unknown gate tool {tool}; expected check_change_gates or check_repository_gates"
        )),
    }
}

fn rule_id(rule: &str) -> String {
    format!("cgrx/{rule}")
}

fn str_field(gate: &Value, pointer: &str, fallback: &str) -> String {
    gate.pointer(pointer)
        .and_then(Value::as_str)
        .unwrap_or(fallback)
        .to_owned()
}

/// Render a gate result as SARIF 2.1.0.
///
/// `tool` is `check_change_gates` (or `change`) or `check_repository_gates`
/// (or `repository`). `gate` is the tool's `structuredContent` value.
/// `resolve_line` maps `(path, byte_offset)` to a 1-based line when the
/// caller can read the repository files; pass `None` to keep byte spans.
pub fn gate_to_sarif(
    tool: &str,
    gate: &Value,
    resolve_line: Option<&LineResolver<'_>>,
) -> Result<Value, String> {
    let kind = gate_kind(tool)?;
    let verdict = str_field(gate, "/verdict", "INCONCLUSIVE");
    let fail_on = str_field(gate, "/fail_on", "error");
    let would_block = gate
        .get("would_block")
        .and_then(Value::as_bool)
        .unwrap_or(true);
    let algorithm = str_field(gate, "/algorithm", "unknown");
    let partial = gate.get("partial").and_then(Value::as_bool).unwrap_or(true);

    let rules = gate
        .get("rules")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();

    let mut descriptors = vec![json!({
        "id": VERDICT_RULE_ID,
        "name": "GateVerdict",
        "shortDescription": {"text": format!("Overall CGRX {kind} gate verdict.")},
        "fullDescription": {"text": "Snapshot-bound CGRX quality-gate verdict. No tests or LLM were executed."},
    })];
    for rule in &rules {
        let name = rule
            .get("rule")
            .and_then(Value::as_str)
            .unwrap_or("unknown");
        let severity = rule
            .get("severity")
            .and_then(Value::as_str)
            .unwrap_or("warning");
        descriptors.push(json!({
            "id": rule_id(name),
            "name": name,
            "shortDescription": {"text": rule_description(name)},
            "fullDescription": {"text": rule_description(name)},
            "defaultConfiguration": {"level": severity_level(severity)},
            "properties": {
                "severity": severity,
                "threshold": rule.get("threshold"),
            },
        }));
    }

    let breached: Vec<&Value> = rules
        .iter()
        .filter(|rule| rule.get("status").and_then(Value::as_str) == Some("breached"))
        .collect();

    let mut summary = format!(
        "cgrx {kind} gate verdict {verdict} (fail_on={fail_on}, would_block={would_block})"
    );
    if verdict == "INCONCLUSIVE" {
        summary.push_str("; evidence is partial and stays blocking unless fail_on is none");
    }
    let mut results = vec![json!({
        "ruleId": VERDICT_RULE_ID,
        "level": verdict_level(&verdict),
        "message": {"text": summary},
    })];

    for rule in &breached {
        let name = rule
            .get("rule")
            .and_then(Value::as_str)
            .unwrap_or("unknown");
        let severity = rule
            .get("severity")
            .and_then(Value::as_str)
            .unwrap_or("warning");
        let value = rule.get("value").and_then(Value::as_u64).unwrap_or(0);
        let threshold = rule.get("threshold").and_then(Value::as_u64).unwrap_or(0);
        let mut entry = json!({
            "ruleId": rule_id(name),
            "level": severity_level(severity),
            "message": {"text": format!(
                "cgrx {name} breached: value {value} exceeds threshold {threshold} (severity {severity})"
            )},
        });
        if name == "max_coverage_gaps" {
            let gap_results = coverage_gap_results(name, gate, resolve_line);
            if !gap_results.is_empty() {
                entry["relatedLocations"] = gap_results
                    .iter()
                    .filter_map(|result| {
                        result
                            .get("locations")
                            .and_then(Value::as_array)
                            .and_then(|locations| {
                                locations.first().map(|location| {
                                    json!({
                                        "id": 1,
                                        "physicalLocation": location["physicalLocation"],
                                        "message": result["message"],
                                    })
                                })
                            })
                    })
                    .enumerate()
                    .map(|(index, mut location)| {
                        location["id"] = json!(index + 1);
                        location
                    })
                    .collect::<Vec<_>>()
                    .into();
            }
            results.extend(gap_results);
        }
        results.push(entry);
    }

    Ok(json!({
        "version": SARIF_VERSION,
        "$schema": SARIF_SCHEMA,
        "runs": [{
            "tool": {"driver": {
                "name": "cgrx",
                "fullName": "CGRX code graph gates",
                "version": env!("CARGO_PKG_VERSION"),
                "informationUri": "https://github.com/ibotpafos/cgrx",
                "rules": descriptors,
            }},
            "automationDetails": {"id": format!("cgrx/{kind}-gates")},
            "results": results,
            "properties": {
                "cgrxGate": kind,
                "cgrxAlgorithm": algorithm,
                "cgrxVerdict": verdict,
                "cgrxWouldBlock": would_block,
                "cgrxFailOn": fail_on,
                "cgrxPartial": partial,
                "llmUsed": false,
            },
        }],
    }))
}

/// One SARIF result per coverage gap that names a repository path.
///
/// Gaps without a path (for example `TRAVERSAL_TRUNCATED`) are covered by the
/// breached-rule result and produce no separate entry.
fn coverage_gap_results(
    rule: &str,
    gate: &Value,
    resolve_line: Option<&LineResolver<'_>>,
) -> Vec<Value> {
    let gaps = gate
        .get("coverage_gaps")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    gaps.iter()
        .filter_map(|gap| gap_location(gap, resolve_line).map(|location| (gap, location)))
        .map(|(gap, location)| {
            let code = gap.get("code").and_then(Value::as_str).unwrap_or("COVERAGE_GAP");
            json!({
                "ruleId": rule_id(rule),
                "level": "warning",
                "message": {"text": format!("cgrx coverage gap {code}: {}", gap_message_detail(gap))},
                "locations": [{"physicalLocation": location}],
            })
        })
        .collect()
}

fn gap_message_detail(gap: &Value) -> String {
    if let Some(path) = gap.get("path").and_then(Value::as_str) {
        if let Some(location) = gap.get("location").and_then(Value::as_str)
            && location.starts_with(path)
        {
            return location.to_owned();
        }
        if let (Some(start), Some(end)) = (
            gap.get("start").and_then(Value::as_u64),
            gap.get("end").and_then(Value::as_u64),
        ) {
            return format!("{path}:{start}-{end}");
        }
        return path.to_owned();
    }
    if let Some(location) = gap.get("location").and_then(Value::as_str) {
        return location.to_owned();
    }
    gap.to_string()
}

/// Physical location for a coverage gap, or `None` when no path is known.
fn gap_location(gap: &Value, resolve_line: Option<&LineResolver<'_>>) -> Option<Value> {
    let (path, start, end) = gap_path_span(gap)?;
    let mut physical = json!({"artifactLocation": {"uri": path}});
    if let (Some(start), Some(end)) = (start, end)
        && end > start
    {
        physical["region"] = byte_region(path, start, end, resolve_line);
    }
    Some(physical)
}

/// Extract `(path, byte_start, byte_end)` from a coverage gap.
///
/// Dynamic-dispatch locations are `path:span` strings whose span units are
/// not machine-readable here, so they contribute a path but no region.
fn gap_path_span(gap: &Value) -> Option<(&str, Option<u64>, Option<u64>)> {
    if let Some(path) = gap.get("path").and_then(Value::as_str) {
        let start = gap.get("start").and_then(Value::as_u64);
        let end = gap.get("end").and_then(Value::as_u64);
        return Some((path, start, end));
    }
    if let Some(location) = gap.get("location").and_then(Value::as_str) {
        let path = location.rsplit_once(':').map_or(location, |(path, _)| path);
        if path.is_empty() {
            return None;
        }
        return Some((path, None, None));
    }
    None
}

fn byte_region(path: &str, start: u64, end: u64, resolve_line: Option<&LineResolver<'_>>) -> Value {
    if let Some(resolve) = resolve_line {
        let start_line = resolve(path, start);
        let end_line = resolve(path, end.saturating_sub(1));
        if let Some(start_line) = start_line {
            let mut region = json!({"startLine": start_line});
            if let Some(end_line) = end_line
                && end_line > start_line
            {
                region["endLine"] = json!(end_line);
            }
            return region;
        }
    }
    let mut region = json!({"byteOffset": start});
    if end > start {
        region["byteLength"] = json!(end - start);
    }
    region
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn verdict_levels_cover_all_outcomes() {
        assert_eq!(verdict_level("PASS"), "note");
        assert_eq!(verdict_level("WARN"), "warning");
        assert_eq!(verdict_level("FAIL"), "error");
        assert_eq!(verdict_level("INCONCLUSIVE"), "warning");
    }

    #[test]
    fn severity_levels_map_conservatively() {
        assert_eq!(severity_level("error"), "error");
        assert_eq!(severity_level("warning"), "warning");
        assert_eq!(severity_level("unknown"), "warning");
    }
}
