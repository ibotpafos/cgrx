use std::path::PathBuf;

use serde_json::{Value, json};

use crate::{RuntimeMcpBackend, managed_state_path, open_managed_runtime};
use cgrx_mcp::Server;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Format {
    Github,
    Human,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Gate {
    Change,
    Repository,
    Both,
}

pub(super) fn run(args: &[String]) -> Result<(), String> {
    let mut repo = None;
    let mut format = Format::Human;
    let mut gate = Gate::Both;
    let mut fail_on = "error".to_string();
    let mut max_warning_findings = 0usize;
    let mut max_blocked_missions = 0usize;
    let mut max_coverage_gaps = 0usize;
    let mut max_unverified_impacts = 0usize;
    let mut max_package_cycles = 0usize;
    let mut max_package_fan_out = 20usize;
    let mut max_symbol_fan_in = 50usize;
    let mut max_unresolved_local_dependencies = 0usize;
    let mut repository_max_coverage_gaps = 0usize;

    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--repo" => {
                i += 1;
                repo = args.get(i).map(PathBuf::from);
            }
            "--format" => {
                i += 1;
                format = match args.get(i).map(String::as_str) {
                    Some("github") => Format::Github,
                    Some("human") => Format::Human,
                    other => return Err(format!("unknown format: {:?}", other)),
                };
            }
            "--gate" => {
                i += 1;
                gate = match args.get(i).map(String::as_str) {
                    Some("change") => Gate::Change,
                    Some("repository") => Gate::Repository,
                    Some("both") => Gate::Both,
                    other => return Err(format!("unknown gate: {:?}", other)),
                };
            }
            "--fail-on" => {
                i += 1;
                fail_on = args.get(i).cloned().unwrap_or_else(|| "error".to_string());
            }
            "--max-warning-findings" => {
                i += 1;
                max_warning_findings = parse_usize(args.get(i), "--max-warning-findings")?;
            }
            "--max-blocked-missions" => {
                i += 1;
                max_blocked_missions = parse_usize(args.get(i), "--max-blocked-missions")?;
            }
            "--max-coverage-gaps" => {
                i += 1;
                max_coverage_gaps = parse_usize(args.get(i), "--max-coverage-gaps")?;
            }
            "--max-unverified-impacts" => {
                i += 1;
                max_unverified_impacts = parse_usize(args.get(i), "--max-unverified-impacts")?;
            }
            "--max-package-cycles" => {
                i += 1;
                max_package_cycles = parse_usize(args.get(i), "--max-package-cycles")?;
            }
            "--max-package-fan-out" => {
                i += 1;
                max_package_fan_out = parse_usize(args.get(i), "--max-package-fan-out")?;
            }
            "--max-symbol-fan-in" => {
                i += 1;
                max_symbol_fan_in = parse_usize(args.get(i), "--max-symbol-fan-in")?;
            }
            "--max-unresolved-local-dependencies" => {
                i += 1;
                max_unresolved_local_dependencies =
                    parse_usize(args.get(i), "--max-unresolved-local-dependencies")?;
            }
            "--repository-max-coverage-gaps" => {
                i += 1;
                repository_max_coverage_gaps =
                    parse_usize(args.get(i), "--repository-max-coverage-gaps")?;
            }
            other => return Err(format!("unknown flag: {other}")),
        }
        i += 1;
    }

    let repo = repo.ok_or("--repo is required")?;
    let root = repo.canonicalize().map_err(|e| e.to_string())?;
    let state = managed_state_path(&root)?;
    let runtime = open_managed_runtime(&root, &state)?;
    let mut server = Server::with_backend(RuntimeMcpBackend::managed(runtime, root.clone(), state));

    let mut failed = false;
    let mut messages: Vec<String> = Vec::new();

    if matches!(gate, Gate::Change | Gate::Both) {
        let result = run_change_gates(
            &mut server,
            &fail_on,
            max_warning_findings,
            max_blocked_missions,
            max_coverage_gaps,
            max_unverified_impacts,
        )?;
        let would_block = result["would_block"].as_bool().unwrap_or(false);
        let verdict = result["verdict"].as_str().unwrap_or("UNKNOWN");
        if would_block {
            failed = true;
        }
        messages.push(format!(
            "change_gates: verdict={verdict} would_block={would_block}"
        ));
        if matches!(format, Format::Human) {
            print_change_report(&result);
        }
    }

    if matches!(gate, Gate::Repository | Gate::Both) {
        let result = run_repository_gates(
            &mut server,
            &fail_on,
            max_package_cycles,
            max_package_fan_out,
            max_symbol_fan_in,
            max_unresolved_local_dependencies,
            repository_max_coverage_gaps,
        )?;
        let would_block = result["would_block"].as_bool().unwrap_or(false);
        let verdict = result["verdict"].as_str().unwrap_or("UNKNOWN");
        if would_block {
            failed = true;
        }
        messages.push(format!(
            "repository_gates: verdict={verdict} would_block={would_block}"
        ));
        if matches!(format, Format::Human) {
            print_repository_report(&result);
        }
    }

    match format {
        Format::Github => {
            for msg in &messages {
                println!("::notice::{msg}");
            }
            if failed {
                println!("::error::CGRX quality gates failed");
            }
        }
        Format::Human => {
            if failed {
                println!("\nCGRX CI: FAILED");
            } else {
                println!("\nCGRX CI: PASSED");
            }
        }
    }

    if failed {
        std::process::exit(1);
    }
    Ok(())
}

fn run_change_gates(
    server: &mut Server,
    fail_on: &str,
    max_warning_findings: usize,
    max_blocked_missions: usize,
    max_coverage_gaps: usize,
    max_unverified_impacts: usize,
) -> Result<Value, String> {
    call_tool(
        server,
        "scan_risks",
        json!({"mode": "changes", "limit": 20}),
    )?;
    let gate_args = json!({
        "fail_on": fail_on,
        "max_warning_findings": max_warning_findings,
        "max_blocked_missions": max_blocked_missions,
        "max_coverage_gaps": max_coverage_gaps,
        "max_unverified_impacts": max_unverified_impacts,
    });
    call_tool(server, "check_change_gates", gate_args)
}

fn run_repository_gates(
    server: &mut Server,
    fail_on: &str,
    max_package_cycles: usize,
    max_package_fan_out: usize,
    max_symbol_fan_in: usize,
    max_unresolved_local_dependencies: usize,
    max_coverage_gaps: usize,
) -> Result<Value, String> {
    call_tool(
        server,
        "get_architecture",
        json!({"scope": "**/*", "package_depth": 2, "limit": 100}),
    )?;
    let gate_args = json!({
        "scope": "**/*",
        "package_depth": 2,
        "fail_on": fail_on,
        "max_package_cycles": max_package_cycles,
        "max_package_fan_out": max_package_fan_out,
        "max_symbol_fan_in": max_symbol_fan_in,
        "max_unresolved_local_dependencies": max_unresolved_local_dependencies,
        "max_coverage_gaps": max_coverage_gaps,
    });
    call_tool(server, "check_repository_gates", gate_args)
}

fn call_tool(server: &mut Server, name: &str, arguments: Value) -> Result<Value, String> {
    let request = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": name, "arguments": arguments}
    });
    let response = server.dispatch_line(&request.to_string());
    let value: Value = serde_json::from_str(&response).map_err(|e| e.to_string())?;
    if let Some(error) = value.get("error") {
        return Err(format!("tool {name} failed: {error}"));
    }
    if !value["result"]["structuredContent"].is_null() {
        Ok(value["result"]["structuredContent"].clone())
    } else if !value["result"].is_null() {
        Ok(value["result"].clone())
    } else {
        Err(format!("tool {name} returned no result"))
    }
}

fn print_change_report(value: &Value) {
    let verdict = value["verdict"].as_str().unwrap_or("UNKNOWN");
    let would_block = value["would_block"].as_bool().unwrap_or(false);
    println!("Change Quality Gates");
    println!("  verdict: {verdict}");
    println!("  would_block: {would_block}");
    if let Some(rules) = value["rules"].as_array() {
        for rule in rules {
            let name = rule["rule"].as_str().unwrap_or("?");
            let status = rule["status"].as_str().unwrap_or("?");
            let val = rule["value"].as_u64().unwrap_or(0);
            let threshold = rule["threshold"].as_u64().unwrap_or(0);
            println!("  {name}: {val} / {threshold} [{status}]");
        }
    }
}

fn print_repository_report(value: &Value) {
    let verdict = value["verdict"].as_str().unwrap_or("UNKNOWN");
    let would_block = value["would_block"].as_bool().unwrap_or(false);
    println!("Repository Quality Gates");
    println!("  verdict: {verdict}");
    println!("  would_block: {would_block}");
    if let Some(rules) = value["rules"].as_array() {
        for rule in rules {
            let name = rule["rule"].as_str().unwrap_or("?");
            let status = rule["status"].as_str().unwrap_or("?");
            let val = rule["value"].as_u64().unwrap_or(0);
            let threshold = rule["threshold"].as_u64().unwrap_or(0);
            println!("  {name}: {val} / {threshold} [{status}]");
        }
    }
}

fn parse_usize(value: Option<&String>, name: &str) -> Result<usize, String> {
    value
        .ok_or_else(|| format!("{name} requires a value"))?
        .parse()
        .map_err(|_| format!("{name} must be an integer"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_usize_valid() {
        let val = Some("42".to_string());
        assert_eq!(parse_usize(val.as_ref(), "test").unwrap(), 42);
    }

    #[test]
    fn test_parse_usize_missing() {
        let result = parse_usize(None, "test-flag");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("test-flag requires a value"));
    }

    #[test]
    fn test_parse_usize_invalid() {
        let val = Some("not_a_number".to_string());
        let result = parse_usize(val.as_ref(), "test-flag");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("test-flag must be an integer"));
    }

    #[test]
    fn test_parse_usize_zero() {
        let val = Some("0".to_string());
        assert_eq!(parse_usize(val.as_ref(), "test").unwrap(), 0);
    }

    #[test]
    fn test_format_display() {
        let human = Format::Human;
        let github = Format::Github;
        assert_ne!(human, github);
    }

    #[test]
    fn test_gate_variants() {
        assert_ne!(Gate::Change, Gate::Repository);
        assert_ne!(Gate::Change, Gate::Both);
        assert_ne!(Gate::Repository, Gate::Both);
    }
}
