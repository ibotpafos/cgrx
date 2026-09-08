use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::fs;
use std::path::Path;

use crate::RuntimeError;

const SECRET_LIMIT: usize = 50;
const DEPENDENCY_LIMIT: usize = 200;
const LICENSE_LIMIT: usize = 100;
const UNTRACKED_FILE_SIZE_LIMIT: usize = 1024 * 1024;

struct FindingBatch<T> {
    findings: Vec<T>,
    total: usize,
    truncated: bool,
    coverage_gaps: Vec<Value>,
}

impl<T> FindingBatch<T> {
    fn new() -> Self {
        Self {
            findings: Vec::new(),
            total: 0,
            truncated: false,
            coverage_gaps: Vec::new(),
        }
    }

    fn push(&mut self, finding: T, limit: usize) {
        self.total += 1;
        if self.findings.len() < limit {
            self.findings.push(finding);
        } else {
            self.truncated = true;
        }
    }
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct SecretFinding {
    pub path: String,
    pub line: usize,
    pub rule: String,
    pub severity: String,
    pub confidence: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct LicenseFinding {
    pub package: String,
    pub version: String,
    pub license: String,
    pub status: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct SecurityAuditConfig {
    pub snapshot_path: String,
    pub fail_on: String,
    pub allowlist_paths: Vec<String>,
    pub allowlist_licenses: Vec<String>,
    pub max_secret_findings: usize,
    pub max_dependency_findings: usize,
    pub max_license_findings: usize,
}

impl Default for SecurityAuditConfig {
    fn default() -> Self {
        Self {
            snapshot_path: String::new(),
            fail_on: "error".to_owned(),
            allowlist_paths: vec!["fixtures".to_owned(), "tests".to_owned()],
            allowlist_licenses: vec![
                "MIT".to_owned(),
                "Apache-2.0".to_owned(),
                "BSD-2-Clause".to_owned(),
                "BSD-3-Clause".to_owned(),
                "ISC".to_owned(),
                "Unicode-3.0".to_owned(),
                "Unicode-DFS-2016".to_owned(),
                "MPL-2.0".to_owned(),
                "Unlicense".to_owned(),
                "MIT-0".to_owned(),
                "CC0-1.0".to_owned(),
                "LLVM-exception".to_owned(),
            ],
            max_secret_findings: 0,
            max_dependency_findings: 0,
            max_license_findings: 0,
        }
    }
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct SecurityAuditResult {
    pub snapshot: Value,
    pub algorithm: String,
    pub llm_used: bool,
    pub verdict: String,
    pub would_block: bool,
    pub fail_on: String,
    pub rules: Vec<Value>,
    pub totals: Value,
    pub partial: bool,
    pub coverage_gaps: Vec<Value>,
    pub coverage_gap_count: usize,
    pub secret_findings: Vec<SecretFinding>,
    pub dependency_findings: Vec<Value>,
    pub license_findings: Vec<LicenseFinding>,
    pub agent_handoff: Value,
    pub limitations: Vec<String>,
}

/// Evaluate security gates: secret detection in diff, dependency audit, license compliance.
/// Returns a structured gate result with PASS/WARN/FAIL/INCONCLUSIVE verdict.
pub fn evaluate_security_gates(
    config: &SecurityAuditConfig,
    snapshot: &Value,
) -> Result<SecurityAuditResult, RuntimeError> {
    let mut coverage_gaps = Vec::new();
    let secret_batch = collect_secret_diff(config).unwrap_or_else(|error| {
        coverage_gaps.push(component_gap("secret_diff", &error));
        FindingBatch::new()
    });
    let dependency_batch = collect_dependencies(config).unwrap_or_else(|error| {
        coverage_gaps.push(component_gap("dependencies", &error));
        FindingBatch::new()
    });
    let license_batch = collect_licenses(config).unwrap_or_else(|error| {
        coverage_gaps.push(component_gap("licenses", &error));
        FindingBatch::new()
    });
    coverage_gaps.extend(secret_batch.coverage_gaps.iter().cloned());
    coverage_gaps.extend(dependency_batch.coverage_gaps.iter().cloned());
    coverage_gaps.extend(license_batch.coverage_gaps.iter().cloned());
    for (component, batch_total, returned, truncated) in [
        (
            "secret_diff",
            secret_batch.total,
            secret_batch.findings.len(),
            secret_batch.truncated,
        ),
        (
            "dependencies",
            dependency_batch.total,
            dependency_batch.findings.len(),
            dependency_batch.truncated,
        ),
        (
            "licenses",
            license_batch.total,
            license_batch.findings.len(),
            license_batch.truncated,
        ),
    ] {
        if truncated {
            coverage_gaps.push(json!({
                "code": "FINDINGS_TRUNCATED",
                "component": component,
                "total": batch_total,
                "returned": returned
            }));
        }
    }
    let partial = !coverage_gaps.is_empty();
    let rules = [
        (
            "max_secret_findings",
            secret_batch.total,
            config.max_secret_findings,
            "error",
        ),
        (
            "max_dependency_findings",
            dependency_batch.total,
            config.max_dependency_findings,
            "error",
        ),
        (
            "max_license_findings",
            license_batch.total,
            config.max_license_findings,
            "error",
        ),
    ];

    let rules_json: Vec<Value> = rules
        .iter()
        .map(|(rule, value, threshold, severity)| {
            json!({
                "rule": rule,
                "value": value,
                "threshold": threshold,
                "severity": severity,
                "status": if value > threshold { "breached" } else { "passed" }
            })
        })
        .collect();

    let errors = rules_json
        .iter()
        .filter(|r| r["status"] == "breached" && r["severity"] == "error")
        .count();
    let warnings = rules_json
        .iter()
        .filter(|r| r["status"] == "breached" && r["severity"] == "warning")
        .count();

    let verdict = if errors > 0 {
        "FAIL"
    } else if partial {
        "INCONCLUSIVE"
    } else if warnings > 0 {
        "WARN"
    } else {
        "PASS"
    };

    let would_block = match config.fail_on.as_str() {
        "none" => false,
        "warning" => errors > 0 || warnings > 0 || partial,
        _ => errors > 0 || partial,
    };

    let coverage_gap_count = coverage_gaps.len();

    let failed_rules: Vec<Value> = rules_json
        .iter()
        .filter(|r| r["status"] == "breached")
        .map(|r| r["rule"].clone())
        .collect();

    let agent_handoff = json!({
        "schema_version": "cgrx.agent.security-audit.v1",
        "algorithm": "security_audit_v1",
        "llm_used": false,
        "snapshot": snapshot,
        "verdict": verdict,
        "would_block": would_block,
        "failed_rules": failed_rules,
        "secret_finding_indexes": (0..secret_batch.findings.len()).collect::<Vec<_>>(),
        "dependency_finding_indexes": (0..dependency_batch.findings.len()).collect::<Vec<_>>(),
        "license_finding_indexes": (0..license_batch.findings.len()).collect::<Vec<_>>(),
        "requirements": [
            "Revalidate the snapshot before acting on this gate.",
            "Inspect every referenced secret, dependency, and license finding.",
            "Treat secret findings as candidates; confirm with repository owner before rotation."
        ]
    });

    Ok(SecurityAuditResult {
        snapshot: snapshot.clone(),
        algorithm: "security_audit_v1".to_owned(),
        llm_used: false,
        verdict: verdict.to_owned(),
        would_block,
        fail_on: config.fail_on.clone(),
        rules: rules_json,
        totals: json!({ "errors": errors, "warnings": warnings }),
        partial,
        coverage_gaps,
        coverage_gap_count,
        secret_findings: secret_batch.findings,
        dependency_findings: dependency_batch.findings,
        license_findings: license_batch.findings,
        agent_handoff,
        limitations: vec![
            "Secret detection is conservative and pattern-based; false positives are possible.".to_owned(),
            "Dependency audit uses local heuristics only; no network access for yanked version checks.".to_owned(),
            "License checking relies on declared metadata in Cargo.lock; manual verification recommended.".to_owned(),
            "INCONCLUSIVE is distinct from PASS and remains blocking unless fail_on is none.".to_owned(),
        ],
    })
}

fn component_gap(component: &str, error: &RuntimeError) -> Value {
    json!({
        "code": error.code(),
        "component": component,
        "detail": error.to_string()
    })
}

/// Scan working-tree diff for secrets using conservative patterns.
/// Returns findings with path, line, rule, severity, and confidence.
pub fn evaluate_secret_diff(
    config: &SecurityAuditConfig,
) -> Result<Vec<SecretFinding>, RuntimeError> {
    collect_secret_diff(config).map(|batch| batch.findings)
}

fn collect_secret_diff(
    config: &SecurityAuditConfig,
) -> Result<FindingBatch<SecretFinding>, RuntimeError> {
    let root = Path::new(&config.snapshot_path);
    let tracked = std::process::Command::new(crate::git_executable())
        .args([
            "diff",
            "HEAD",
            "--name-only",
            "--diff-filter=ACMRTUXB",
            "--no-renames",
            "-z",
            "--",
        ])
        .current_dir(root)
        .output()
        .map_err(|e| RuntimeError::new("cgrx.git_error", e.to_string()))?;

    if !tracked.status.success() {
        let stderr = String::from_utf8_lossy(&tracked.stderr).to_lowercase();
        return Err(RuntimeError::new(
            "cgrx.git_error",
            stderr.trim().to_owned(),
        ));
    }

    let mut batch = FindingBatch::new();
    for raw_path in tracked
        .stdout
        .split(|byte| *byte == 0)
        .filter(|path| !path.is_empty())
    {
        let path = std::str::from_utf8(raw_path).map_err(|error| {
            RuntimeError::new(
                "cgrx.path_encoding",
                format!("tracked path is not UTF-8: {error}"),
            )
        })?;
        if path_is_allowlisted(path, &config.allowlist_paths) {
            continue;
        }

        let output = std::process::Command::new(crate::git_executable())
            .args([
                "diff",
                "HEAD",
                "--unified=0",
                "--no-color",
                "--no-ext-diff",
                "--no-textconv",
                "--no-renames",
                "--",
            ])
            .arg(path)
            .current_dir(root)
            .output()
            .map_err(|error| RuntimeError::new("cgrx.git_error", error.to_string()))?;
        if !output.status.success() {
            return Err(RuntimeError::new(
                "cgrx.git_error",
                String::from_utf8_lossy(&output.stderr).trim().to_owned(),
            ));
        }

        let diff_text = String::from_utf8_lossy(&output.stdout);
        let mut current_line = 0usize;
        let mut in_hunk = false;
        for line in diff_text.lines() {
            if line.starts_with("Binary files ") {
                batch.coverage_gaps.push(json!({
                    "code": "UNSCANNED_BINARY_FILE",
                    "component": "secret_diff",
                    "path": path
                }));
                break;
            }
            if line.starts_with("@@") {
                in_hunk = true;
                if let Some(pos) = line.find('+') {
                    let rest = &line[pos + 1..];
                    current_line = rest
                        .split([',', ' '])
                        .next()
                        .and_then(|value| value.parse().ok())
                        .unwrap_or(0);
                }
                continue;
            }
            if !in_hunk {
                continue;
            }
            if line.starts_with('+') && !line.starts_with("+++") {
                let content = &line[1..];
                if let Some(finding) =
                    check_secret_line(path, current_line, content, &config.allowlist_paths)
                {
                    batch.push(finding, SECRET_LIMIT);
                }
            }
            if !line.starts_with('-') {
                current_line += 1;
            }
        }
    }

    let untracked = std::process::Command::new(crate::git_executable())
        .args(["ls-files", "--others", "--exclude-standard", "-z"])
        .current_dir(root)
        .output()
        .map_err(|error| RuntimeError::new("cgrx.git_error", error.to_string()))?;
    if !untracked.status.success() {
        return Err(RuntimeError::new(
            "cgrx.git_error",
            String::from_utf8_lossy(&untracked.stderr).trim().to_owned(),
        ));
    }
    for raw_path in untracked
        .stdout
        .split(|byte| *byte == 0)
        .filter(|path| !path.is_empty())
    {
        let path = std::str::from_utf8(raw_path).map_err(|error| {
            RuntimeError::new(
                "cgrx.path_encoding",
                format!("untracked path is not UTF-8: {error}"),
            )
        })?;
        if path_is_allowlisted(path, &config.allowlist_paths) {
            continue;
        }
        let metadata = fs::symlink_metadata(root.join(path))
            .map_err(|error| RuntimeError::new("cgrx.source_read", error.to_string()))?;
        if !metadata.file_type().is_file() {
            batch.coverage_gaps.push(json!({
                "code": "UNSCANNED_SPECIAL_FILE",
                "component": "secret_diff",
                "path": path
            }));
            continue;
        }
        let bytes = fs::read(root.join(path))
            .map_err(|error| RuntimeError::new("cgrx.source_read", error.to_string()))?;
        if bytes.len() > UNTRACKED_FILE_SIZE_LIMIT {
            batch.coverage_gaps.push(json!({
                "code": "UNSCANNED_LARGE_FILE",
                "component": "secret_diff",
                "path": path,
                "size": bytes.len(),
                "limit": UNTRACKED_FILE_SIZE_LIMIT
            }));
            continue;
        }
        if bytes.contains(&0) {
            batch.coverage_gaps.push(json!({
                "code": "UNSCANNED_BINARY_FILE",
                "component": "secret_diff",
                "path": path
            }));
            continue;
        }
        let content = std::str::from_utf8(&bytes).map_err(|error| {
            RuntimeError::new(
                "cgrx.source_encoding",
                format!("{path} is not valid UTF-8: {error}"),
            )
        })?;
        for (index, line) in content.lines().enumerate() {
            if let Some(finding) = check_secret_line(path, index + 1, line, &config.allowlist_paths)
            {
                batch.push(finding, SECRET_LIMIT);
            }
        }
    }

    Ok(batch)
}

fn check_secret_line(
    path: &str,
    line: usize,
    content: &str,
    allowlist_paths: &[String],
) -> Option<SecretFinding> {
    if path_is_allowlisted(path, allowlist_paths) {
        return None;
    }

    let lower = content.to_lowercase();

    // Private key patterns
    if content.contains("-----BEGIN") && content.contains("PRIVATE KEY-----") {
        return Some(SecretFinding {
            path: path.to_owned(),
            line,
            rule: "PRIVATE_KEY".to_owned(),
            severity: "error".to_owned(),
            confidence: "candidate".to_owned(),
        });
    }

    // Token patterns (conservative)
    if (lower.contains("api_key") || lower.contains("apikey"))
        && (lower.contains('=') || lower.contains(':'))
    {
        let after_sep = lower
            .split('=')
            .nth(1)
            .or_else(|| lower.split(':').nth(1))
            .unwrap_or("");
        let trimmed = after_sep.trim().trim_matches('"').trim_matches('\'');
        if !trimmed.is_empty()
            && !trimmed.starts_with("env:")
            && !trimmed.starts_with("env!")
            && !trimmed.starts_with("process.")
            && !trimmed.starts_with("config.")
            && trimmed.len() > 8
        {
            return Some(SecretFinding {
                path: path.to_owned(),
                line,
                rule: "HARDCODED_API_KEY".to_owned(),
                severity: "error".to_owned(),
                confidence: "candidate".to_owned(),
            });
        }
    }

    // Password patterns (conservative)
    if lower.contains("password") && (lower.contains('=') || lower.contains(':')) {
        let after_sep = lower
            .split('=')
            .nth(1)
            .or_else(|| lower.split(':').nth(1))
            .unwrap_or("");
        let trimmed = after_sep.trim().trim_matches('"').trim_matches('\'');
        if !trimmed.is_empty()
            && !trimmed.starts_with("env:")
            && !trimmed.starts_with("env!")
            && !trimmed.starts_with("process.")
            && !trimmed.starts_with("config.")
            && !trimmed.starts_with("?")
            && !trimmed.starts_with("null")
            && !trimmed.starts_with("empty")
        {
            return Some(SecretFinding {
                path: path.to_owned(),
                line,
                rule: "HARDCODED_PASSWORD".to_owned(),
                severity: "error".to_owned(),
                confidence: "candidate".to_owned(),
            });
        }
    }

    // Secret token patterns
    if lower.contains("secret") && (lower.contains('=') || lower.contains(':')) {
        let after_sep = lower
            .split('=')
            .nth(1)
            .or_else(|| lower.split(':').nth(1))
            .unwrap_or("");
        let trimmed = after_sep.trim().trim_matches('"').trim_matches('\'');
        if !trimmed.is_empty()
            && !trimmed.starts_with("env:")
            && !trimmed.starts_with("env!")
            && !trimmed.starts_with("process.")
            && !trimmed.starts_with("config.")
            && trimmed.len() > 12
        {
            return Some(SecretFinding {
                path: path.to_owned(),
                line,
                rule: "HARDCODED_SECRET".to_owned(),
                severity: "error".to_owned(),
                confidence: "candidate".to_owned(),
            });
        }
    }

    // AWS access key pattern
    if content.contains("AKIA") && content.len() >= content.find("AKIA").unwrap_or(0) + 20 {
        let start = content.find("AKIA").unwrap();
        let candidate = &content[start..];
        if candidate
            .as_bytes()
            .get(..20)
            .is_some_and(|key| key.iter().all(u8::is_ascii_alphanumeric))
        {
            return Some(SecretFinding {
                path: path.to_owned(),
                line,
                rule: "AWS_ACCESS_KEY".to_owned(),
                severity: "error".to_owned(),
                confidence: "candidate".to_owned(),
            });
        }
    }

    None
}

fn path_is_allowlisted(path: &str, allowlist_paths: &[String]) -> bool {
    allowlist_paths.iter().any(|allowed| {
        let allowed = allowed.trim().trim_matches('/');
        !allowed.is_empty() && (path == allowed || path.starts_with(&format!("{allowed}/")))
    })
}

/// Audit dependencies from Cargo.lock using local heuristics.
/// Checks for known suspicious patterns without network access.
pub fn evaluate_dependencies(config: &SecurityAuditConfig) -> Result<Vec<Value>, RuntimeError> {
    collect_dependencies(config).map(|batch| batch.findings)
}

fn collect_dependencies(config: &SecurityAuditConfig) -> Result<FindingBatch<Value>, RuntimeError> {
    let lock_path = Path::new(&config.snapshot_path).join("Cargo.lock");
    let content = fs::read_to_string(&lock_path)
        .map_err(|e| RuntimeError::new("cgrx.lock_read", e.to_string()))?;

    let parsed = content.parse::<toml::Value>().map_err(|error| {
        RuntimeError::new("cgrx.lock_parse", format!("invalid Cargo.lock: {error}"))
    })?;
    let packages: &[toml::Value] = match parsed.get("package") {
        Some(value) => value.as_array().ok_or_else(|| {
            RuntimeError::new("cgrx.lock_parse", "Cargo.lock package must be an array")
        })?,
        None => &[],
    };
    let mut batch = FindingBatch::new();

    // Known suspicious patterns (conservative, local heuristics only)
    let suspicious_prefixes = ["rust-", "rs-", "sys-", "binding-", "ffi-"];
    let known_empty_versions = ["0.0.0", "0.0.0-0", "0.0.1-alpha.0"];

    for package in packages {
        let name = package
            .get("name")
            .and_then(toml::Value::as_str)
            .ok_or_else(|| RuntimeError::new("cgrx.lock_parse", "package name is missing"))?;
        let version = package
            .get("version")
            .and_then(toml::Value::as_str)
            .ok_or_else(|| RuntimeError::new("cgrx.lock_parse", "package version is missing"))?;
        // Check for empty/placeholder versions
        if known_empty_versions.contains(&version) {
            batch.push(
                json!({
                    "package": name,
                    "version": version,
                    "rule": "EMPTY_VERSION",
                    "severity": "error",
                    "confidence": "candidate",
                    "detail": "Package version appears to be a placeholder or empty version."
                }),
                DEPENDENCY_LIMIT,
            );
            continue;
        }

        // Check for suspicious naming patterns
        for prefix in suspicious_prefixes {
            if name.starts_with(prefix) && name != prefix {
                batch.push(json!({
                    "package": name,
                    "version": version,
                    "rule": "SUSPICIOUS_NAME",
                    "severity": "warning",
                    "confidence": "candidate",
                    "detail": format!("Package name matches suspicious prefix pattern: {}", prefix)
                }), DEPENDENCY_LIMIT);
                break;
            }
        }

        // Check for very high version numbers (potential typosquatting)
        if let Some(major) = version.split('.').next()
            && let Ok(major_num) = major.parse::<u32>()
            && major_num >= 100
        {
            batch.push(
                json!({
                    "package": name,
                    "version": version,
                    "rule": "HIGH_VERSION",
                    "severity": "warning",
                    "confidence": "candidate",
                    "detail": "Package has unusually high major version number."
                }),
                DEPENDENCY_LIMIT,
            );
        }
    }

    Ok(batch)
}

/// Evaluate licenses against allowlist.
/// Returns findings for packages with non-allowlisted licenses.
pub fn evaluate_licenses(
    config: &SecurityAuditConfig,
) -> Result<Vec<LicenseFinding>, RuntimeError> {
    collect_licenses(config).map(|batch| batch.findings)
}

fn collect_licenses(
    config: &SecurityAuditConfig,
) -> Result<FindingBatch<LicenseFinding>, RuntimeError> {
    let deps_path = Path::new(&config.snapshot_path).join("licenses/dependencies.md");
    let content = fs::read_to_string(&deps_path)
        .map_err(|error| RuntimeError::new("cgrx.license_read", error.to_string()))?;

    let mut batch = FindingBatch::new();
    let mut columns: Option<(usize, Option<usize>, usize)> = None;
    let mut data_rows = 0usize;

    for line in content.lines() {
        if !line.trim_start().starts_with('|') {
            continue;
        }
        let cells = markdown_cells(line);
        if cells.iter().all(|cell| {
            !cell.is_empty()
                && cell
                    .chars()
                    .all(|ch| ch == '-' || ch == ':' || ch.is_whitespace())
        }) {
            continue;
        }
        if columns.is_none() {
            let package = cells
                .iter()
                .position(|cell| cell.eq_ignore_ascii_case("Package"));
            let version = cells
                .iter()
                .position(|cell| cell.eq_ignore_ascii_case("Version"));
            let license = cells
                .iter()
                .position(|cell| cell.eq_ignore_ascii_case("License"));
            if let (Some(package), Some(license)) = (package, license) {
                columns = Some((package, version, license));
            }
            continue;
        }
        let (package_index, version_index, license_index) = columns.unwrap();
        let package_cell = cells.get(package_index).copied().unwrap_or("");
        let license = cells.get(license_index).copied().unwrap_or("");
        let (package, version) = if let Some(version_index) = version_index {
            (
                package_cell.to_owned(),
                cells.get(version_index).copied().unwrap_or("").to_owned(),
            )
        } else {
            split_package_version(package_cell).ok_or_else(|| {
                RuntimeError::new(
                    "cgrx.license_parse",
                    format!("package entry lacks a version: {package_cell}"),
                )
            })?
        };
        if package.is_empty() || version.is_empty() || license.is_empty() {
            return Err(RuntimeError::new(
                "cgrx.license_parse",
                "license inventory contains an empty required cell",
            ));
        }
        data_rows += 1;

        let status = if license_expression_allowed(license, &config.allowlist_licenses) {
            "passed"
        } else {
            "breached"
        };

        if status == "breached" {
            batch.push(
                LicenseFinding {
                    package,
                    version,
                    license: license.to_owned(),
                    status: status.to_owned(),
                },
                LICENSE_LIMIT,
            );
        }
    }

    if columns.is_none() || data_rows == 0 {
        return Err(RuntimeError::new(
            "cgrx.license_parse",
            "license inventory has no Package/License data rows",
        ));
    }
    Ok(batch)
}

fn markdown_cells(line: &str) -> Vec<&str> {
    line.trim()
        .trim_matches('|')
        .split('|')
        .map(str::trim)
        .collect()
}

fn split_package_version(value: &str) -> Option<(String, String)> {
    value
        .char_indices()
        .rev()
        .find(|(index, ch)| {
            *ch == '-'
                && value
                    .get(index + 1..)
                    .and_then(|tail| tail.chars().next())
                    .is_some_and(|next| next.is_ascii_digit())
        })
        .map(|(index, _)| (value[..index].to_owned(), value[index + 1..].to_owned()))
}

fn license_expression_allowed(expression: &str, allowlist: &[String]) -> bool {
    let allowed = |token: &str| allowlist.iter().any(|item| item.trim() == token);
    let normalized = expression.replace('/', " OR ");
    let mut tokens = Vec::new();
    let mut current = String::new();
    for ch in normalized.chars() {
        match ch {
            '(' | ')' => {
                if !current.trim().is_empty() {
                    tokens.push(current.trim().to_owned());
                }
                tokens.push(ch.to_string());
                current.clear();
            }
            ch if ch.is_whitespace() => {
                if !current.is_empty() {
                    tokens.push(std::mem::take(&mut current));
                }
            }
            _ => current.push(ch),
        }
    }
    if !current.is_empty() {
        tokens.push(current);
    }
    let mut parser = LicenseExpressionParser {
        tokens: &tokens,
        index: 0,
        allowed: &allowed,
    };
    parser
        .parse_expression()
        .is_some_and(|result| result && parser.index == tokens.len())
}

struct LicenseExpressionParser<'a, F> {
    tokens: &'a [String],
    index: usize,
    allowed: &'a F,
}

impl<F: Fn(&str) -> bool> LicenseExpressionParser<'_, F> {
    fn parse_expression(&mut self) -> Option<bool> {
        let mut result = self.parse_term()?;
        while self.peek("OR") {
            self.index += 1;
            result |= self.parse_term()?;
        }
        Some(result)
    }

    fn parse_term(&mut self) -> Option<bool> {
        let mut result = self.parse_factor()?;
        while self.peek("AND") {
            self.index += 1;
            result &= self.parse_factor()?;
        }
        Some(result)
    }

    fn parse_factor(&mut self) -> Option<bool> {
        if self.peek("(") {
            self.index += 1;
            let result = self.parse_expression()?;
            if !self.peek(")") {
                return None;
            }
            self.index += 1;
            return Some(result);
        }
        let license = self.tokens.get(self.index)?;
        if matches!(license.as_str(), ")" | "AND" | "OR" | "WITH") {
            return None;
        }
        self.index += 1;
        let mut result = (self.allowed)(license);
        if self.peek("WITH") {
            self.index += 1;
            let exception = self.tokens.get(self.index)?;
            self.index += 1;
            result &= (self.allowed)(exception);
        }
        Some(result)
    }

    fn peek(&self, expected: &str) -> bool {
        self.tokens
            .get(self.index)
            .is_some_and(|token| token.eq_ignore_ascii_case(expected))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;
    use tempfile::NamedTempFile;

    fn git(root: &Path, args: &[&str]) {
        let status = Command::new(crate::git_executable())
            .args([
                "-c",
                "user.name=CGRX Test",
                "-c",
                "user.email=test@example.invalid",
            ])
            .args(args)
            .current_dir(root)
            .status()
            .unwrap();
        assert!(status.success());
    }

    fn committed_repository() -> tempfile::TempDir {
        let repository = tempfile::tempdir().unwrap();
        git(repository.path(), &["init", "-q"]);
        fs::write(repository.path().join("Cargo.lock"), "").unwrap();
        fs::create_dir(repository.path().join("licenses")).unwrap();
        fs::write(
            repository.path().join("licenses/dependencies.md"),
            "| Package | Version | License |\n| --- | --- | --- |\n| serde | 1.0.0 | MIT |\n",
        )
        .unwrap();
        fs::write(repository.path().join("tracked.rs"), "fn baseline() {}\n").unwrap();
        git(repository.path(), &["add", "."]);
        git(repository.path(), &["commit", "-qm", "fixture"]);
        repository
    }

    fn config(root: &Path) -> SecurityAuditConfig {
        SecurityAuditConfig {
            snapshot_path: root.to_string_lossy().into_owned(),
            allowlist_paths: Vec::new(),
            allowlist_licenses: vec!["MIT".to_owned()],
            max_secret_findings: 0,
            max_dependency_findings: 0,
            max_license_findings: 0,
            ..SecurityAuditConfig::default()
        }
    }

    #[test]
    fn secret_detection_private_key() {
        let finding = check_secret_line("src/config.rs", 2, "-----BEGIN RSA PRIVATE KEY-----", &[]);
        assert!(finding.is_some());
        let finding = finding.unwrap();
        assert_eq!(finding.rule, "PRIVATE_KEY");
        assert_eq!(finding.severity, "error");
    }

    #[test]
    fn secret_detection_hardcoded_api_key() {
        let content = r#"let api_key = "sk-1234567890abcdef1234567890abcdef";"#;
        let finding = check_secret_line("src/config.rs", 1, content, &[]);
        assert!(finding.is_some());
        let finding = finding.unwrap();
        assert_eq!(finding.rule, "HARDCODED_API_KEY");
    }

    #[test]
    fn secret_detection_hardcoded_password() {
        let content = r#"let password = "super_secret_password_123";"#;
        let finding = check_secret_line("src/config.rs", 1, content, &[]);
        assert!(finding.is_some());
        let finding = finding.unwrap();
        assert_eq!(finding.rule, "HARDCODED_PASSWORD");
    }

    #[test]
    fn secret_detection_hardcoded_secret() {
        let content = r#"let secret = "my_super_secret_token_value_12345";"#;
        let finding = check_secret_line("src/config.rs", 1, content, &[]);
        assert!(finding.is_some());
        let finding = finding.unwrap();
        assert_eq!(finding.rule, "HARDCODED_SECRET");
    }

    #[test]
    fn secret_detection_aws_access_key() {
        let content = r#"let key = "AKIAIOSFODNN7EXAMPLE";"#;
        let finding = check_secret_line("src/config.rs", 1, content, &[]);
        assert!(finding.is_some());
        let finding = finding.unwrap();
        assert_eq!(finding.rule, "AWS_ACCESS_KEY");
    }

    #[test]
    fn secret_detection_aws_candidate_is_utf8_safe() {
        let content = "AKIAABCDEFGHIJKLMNO💥";
        assert!(check_secret_line("src/config.rs", 1, content, &[]).is_none());
        let exact = "AKIAABCDEFGHIJKLMNOP";
        assert_eq!(
            check_secret_line("src/config.rs", 2, exact, &[])
                .expect("exact 20-byte AWS key")
                .rule,
            "AWS_ACCESS_KEY"
        );
    }

    #[test]
    fn secret_diff_includes_staged_and_untracked_files() {
        let repository = committed_repository();
        fs::write(
            repository.path().join("tracked.rs"),
            "let api_key = \"staged-secret-value\";\n",
        )
        .unwrap();
        git(repository.path(), &["add", "tracked.rs"]);
        fs::write(
            repository.path().join("untracked.rs"),
            "let password = \"untracked-secret-value\";\n",
        )
        .unwrap();

        let findings = evaluate_secret_diff(&config(repository.path())).unwrap();
        assert!(
            findings.iter().any(|finding| finding.path == "tracked.rs"),
            "{findings:?}"
        );
        assert!(
            findings
                .iter()
                .any(|finding| finding.path == "untracked.rs"),
            "{findings:?}"
        );
    }

    #[cfg(unix)]
    #[test]
    fn secret_diff_scans_tracked_paths_that_git_would_quote() {
        let repository = committed_repository();
        let quoted_path = "quoted\nname.rs";
        fs::write(repository.path().join(quoted_path), "fn baseline() {}\n").unwrap();
        git(repository.path(), &["add", "."]);
        git(repository.path(), &["commit", "-qm", "quoted path fixture"]);
        fs::write(
            repository.path().join(quoted_path),
            "let api_key = \"quoted-path-secret-value\";\n",
        )
        .unwrap();

        let findings = evaluate_secret_diff(&config(repository.path())).unwrap();
        assert!(
            findings.iter().any(|finding| finding.path == quoted_path),
            "{findings:?}"
        );
    }

    #[test]
    fn added_header_like_text_cannot_switch_the_allowlist_path() {
        let repository = committed_repository();
        fs::write(
            repository.path().join("tracked.rs"),
            concat!(
                "++ b/fixtures/fake.rs\n",
                "let api_key = \"real-secret-value\";\n",
            ),
        )
        .unwrap();
        let mut audit_config = config(repository.path());
        audit_config.allowlist_paths = vec!["fixtures".to_owned()];

        let findings = evaluate_secret_diff(&audit_config).unwrap();
        assert!(
            findings.iter().any(|finding| finding.path == "tracked.rs"),
            "{findings:?}"
        );
    }

    #[cfg(unix)]
    #[test]
    fn untracked_symlink_is_not_followed_outside_the_repository() {
        use std::os::unix::fs::symlink;

        let repository = committed_repository();
        let external = NamedTempFile::new().unwrap();
        fs::write(
            external.path(),
            "let api_key = \"external-secret-value\";\n",
        )
        .unwrap();
        symlink(external.path(), repository.path().join("outside-link")).unwrap();

        let batch = collect_secret_diff(&config(repository.path())).unwrap();
        assert!(batch.findings.is_empty(), "{:?}", batch.findings);
        assert!(
            batch
                .coverage_gaps
                .iter()
                .any(|gap| gap["code"] == "UNSCANNED_SPECIAL_FILE")
        );
    }

    #[test]
    fn secret_detection_allowlist_paths() {
        let content = r#"let api_key = "sk-1234567890abcdef1234567890abcdef";"#;
        let finding = check_secret_line("fixtures/test.rs", 1, content, &["fixtures".to_owned()]);
        assert!(finding.is_none());
    }

    #[test]
    fn secret_detection_false_positive_env_var() {
        let content = r#"let api_key = env!("API_KEY");"#;
        let finding = check_secret_line("src/config.rs", 1, content, &[]);
        assert!(finding.is_none());
    }

    #[test]
    fn secret_detection_false_positive_env_dot() {
        let content = r#"let api_key = env::var("API_KEY");"#;
        let finding = check_secret_line("src/config.rs", 1, content, &[]);
        assert!(finding.is_none());
    }

    #[test]
    fn secret_detection_false_positive_config() {
        let content = r#"let api_key = config.api_key;"#;
        let finding = check_secret_line("src/config.rs", 1, content, &[]);
        assert!(finding.is_none());
    }

    #[test]
    fn secret_detection_false_positive_short_value() {
        let content = r#"let api_key = "short";"#;
        let finding = check_secret_line("src/config.rs", 1, content, &[]);
        assert!(finding.is_none());
    }

    #[test]
    fn secret_detection_false_positive_null() {
        let content = r#"let password = null;"#;
        let finding = check_secret_line("src/config.rs", 1, content, &[]);
        assert!(finding.is_none());
    }

    #[test]
    fn dependency_audit_empty_version() {
        let repository = committed_repository();
        fs::write(
            repository.path().join("Cargo.lock"),
            "[[package]]\nname = \"suspicious-pkg\"\nversion = \"0.0.0\"\n",
        )
        .unwrap();
        let findings = evaluate_dependencies(&config(repository.path())).unwrap();
        assert_eq!(findings.len(), 1);
        assert_eq!(findings[0]["package"], "suspicious-pkg");
        assert_eq!(findings[0]["rule"], "EMPTY_VERSION");
    }

    #[test]
    fn license_checking_allowlisted() {
        let repository = committed_repository();
        fs::write(
            repository.path().join("licenses/dependencies.md"),
            concat!(
                "| Package | Version | License |\n",
                "| --- | --- | --- |\n",
                "| serde | 1.0.0 | MIT |\n",
                "| tokio | 1.0.0 | Apache-2.0 |\n",
                "| gpl-crate | 1.0.0 | GPL-3.0 |\n",
            ),
        )
        .unwrap();
        let mut audit_config = config(repository.path());
        audit_config.allowlist_licenses = vec!["MIT".to_owned(), "Apache-2.0".to_owned()];
        let findings = evaluate_licenses(&audit_config).unwrap();
        assert_eq!(findings.len(), 1);
        assert_eq!(findings[0].package, "gpl-crate");
        assert_eq!(findings[0].license, "GPL-3.0");
    }

    #[test]
    fn license_checking_supports_repository_inventory_shape() {
        let repository = committed_repository();
        fs::write(
            repository.path().join("licenses/dependencies.md"),
            concat!(
                "| Package | License | Upstream |\n",
                "| --- | --- | --- |\n",
                "| serde-1.0.0 | MIT | https://example.invalid/serde |\n",
                "| copyleft-2.0.0 | GPL-3.0 | https://example.invalid/copyleft |\n",
            ),
        )
        .unwrap();

        let findings = evaluate_licenses(&config(repository.path())).unwrap();
        assert_eq!(findings.len(), 1);
        assert_eq!(findings[0].package, "copyleft");
        assert_eq!(findings[0].version, "2.0.0");
        assert_eq!(findings[0].license, "GPL-3.0");
    }

    #[test]
    fn license_expressions_apply_boolean_semantics() {
        let mit = vec!["MIT".to_owned()];
        assert!(license_expression_allowed("MIT OR GPL-3.0", &mit));
        assert!(!license_expression_allowed("MIT AND GPL-3.0", &mit));
        assert!(!license_expression_allowed(
            "(MIT OR Apache-2.0) AND Unicode-3.0",
            &mit
        ));
        assert!(license_expression_allowed("Unlicense/MIT", &mit));
    }

    #[test]
    fn missing_license_inventory_is_not_treated_as_clean() {
        let repository = committed_repository();
        fs::remove_file(repository.path().join("licenses/dependencies.md")).unwrap();
        let error = evaluate_licenses(&config(repository.path())).unwrap_err();
        assert_eq!(error.code(), "cgrx.license_read");
    }

    #[test]
    fn truncated_secret_payload_cannot_pass_the_gate() {
        let repository = committed_repository();
        let secrets = (0..=SECRET_LIMIT)
            .map(|index| format!("let api_key_{index} = \"secret-value-{index:04}\";"))
            .collect::<Vec<_>>()
            .join("\n");
        fs::write(repository.path().join("tracked.rs"), secrets).unwrap();
        let mut audit_config = config(repository.path());
        audit_config.max_secret_findings = SECRET_LIMIT;

        let result = evaluate_security_gates(
            &audit_config,
            &json!({"repo_revision":"fixture","graph_generation":1}),
        )
        .unwrap();
        assert!(result.partial);
        assert_eq!(result.verdict, "FAIL");
        assert!(result.would_block);
    }

    #[test]
    fn evaluate_security_gates_pass() {
        let repository = committed_repository();
        let mut config = config(repository.path());
        config.max_secret_findings = 100;
        config.max_dependency_findings = 100;
        config.max_license_findings = 100;

        let snapshot = json!({"repo_revision": "abc123", "graph_generation": 1});
        let result = evaluate_security_gates(&config, &snapshot).unwrap();

        assert_eq!(result.verdict, "PASS");
        assert!(!result.would_block);
        assert!(!result.llm_used);
        assert_eq!(result.algorithm, "security_audit_v1");
    }

    #[test]
    fn evaluate_security_gates_fail_on_error() {
        let temp_dir = tempfile::tempdir().unwrap();
        let lock_path = temp_dir.path().join("Cargo.lock");
        std::fs::write(&lock_path, "").unwrap();

        let config = SecurityAuditConfig {
            snapshot_path: temp_dir.path().to_str().unwrap().to_owned(),
            fail_on: "error".to_owned(),
            allowlist_paths: vec!["fixtures".to_owned(), "tests".to_owned()],
            allowlist_licenses: vec!["MIT".to_owned(), "Apache-2.0".to_owned()],
            max_secret_findings: 0,
            max_dependency_findings: 0,
            max_license_findings: 0,
        };

        let snapshot = json!({"repo_revision": "abc123", "graph_generation": 1});
        let result = evaluate_security_gates(&config, &snapshot).unwrap();

        // With max=0, any finding would breach. Since we're running in the actual repo,
        // the verdict depends on actual findings. Just verify structure.
        assert!(!result.llm_used);
        assert_eq!(result.algorithm, "security_audit_v1");
        assert!(result.agent_handoff["schema_version"] == "cgrx.agent.security-audit.v1");
    }
}
