//! Recorded real test-run evidence for change verification plans.
//!
//! The engine never executes tests itself: [`TestRunRecord`] is a plain
//! caller-supplied claim ("this runner command reported these test outcomes
//! at this revision"). Matching against a scan is deliberately conservative:
//! a recorded outcome annotates a `verification_plan` candidate only when the
//! recorded revision equals the scanned revision exactly **and** the recorded
//! file hash equals the file hash observed during that scan. Anything else
//! keeps the previous `not_run` abstention.
use super::*;

/// Outcome of one test reported by an external runner.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum TestOutcome {
    Passed,
    Failed,
}

/// One test result inside a recorded runner invocation.
///
/// `source_hash` is the lowercase hex file hash of `path` observed when the
/// runner executed (copy it from the scan's `related_tests` entry). It must
/// match the hash observed at scan time; a missing or different hash never
/// annotates a candidate.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct TestCaseResult {
    pub path: String,
    pub symbol: String,
    pub status: TestOutcome,
    pub source_hash: Option<String>,
}

/// A recorded real test-runner invocation.
///
/// `revision` is the exact 40-hex Git revision the runner executed against,
/// `runner_command` is the literal command that was run (for audit, never
/// executed by this crate), and `results` lists per-test outcomes.
#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct TestRunRecord {
    pub runner_command: String,
    pub revision: String,
    pub results: Vec<TestCaseResult>,
}

impl TestRunRecord {
    /// Record a runner invocation with its per-test outcomes.
    #[must_use]
    pub fn new(
        runner_command: impl Into<String>,
        revision: impl Into<String>,
        results: Vec<TestCaseResult>,
    ) -> Self {
        Self {
            runner_command: runner_command.into(),
            revision: revision.into(),
            results,
        }
    }
}

/// Annotate a built `verification_plan` with fresh recorded outcomes.
///
/// Conservative rules: a recorded result covers a candidate only when
/// `run.revision` equals `snapshot_revision` exactly and the recorded
/// `source_hash` equals the hash in `path_hashes` for that path. Across
/// several runs a fresh `failed` wins over `passed` so a failure is never
/// masked. Candidates without fresh cover keep `not_run`.
pub(super) fn apply(
    plan: &mut Value,
    runs: &[TestRunRecord],
    snapshot_revision: &str,
    path_hashes: &BTreeMap<String, Hash32>,
) {
    let Some(tests) = plan.get_mut("related_tests").and_then(Value::as_array_mut) else {
        return;
    };
    if tests.is_empty() || runs.is_empty() {
        return;
    }
    let mut fresh = 0_usize;
    let mut failed = 0_usize;
    for test in tests.iter_mut() {
        let (Some(path), Some(symbol)) = (
            test.get("path").and_then(Value::as_str),
            test.get("symbol").and_then(Value::as_str),
        ) else {
            continue;
        };
        let current_hash = path_hashes.get(path).map(hex_hash);
        let mut outcome: Option<(&TestRunRecord, TestOutcome)> = None;
        for run in runs {
            if run.revision != snapshot_revision {
                continue;
            }
            for result in &run.results {
                if result.path != path || result.symbol != symbol {
                    continue;
                }
                let hash_fresh = result
                    .source_hash
                    .as_deref()
                    .zip(current_hash.as_deref())
                    .is_some_and(|(recorded, current)| recorded == current);
                if !hash_fresh {
                    continue;
                }
                outcome = match outcome {
                    Some((_, TestOutcome::Failed)) => outcome,
                    _ if result.status == TestOutcome::Failed => Some((run, result.status)),
                    Some(_) => outcome,
                    None => Some((run, result.status)),
                };
            }
        }
        if let Some((run, status)) = outcome {
            let status_str = match status {
                TestOutcome::Passed => "passed",
                TestOutcome::Failed => "failed",
            };
            test["execution_status"] = json!(status_str);
            test["execution"] = json!({
                "runner_command": run.runner_command,
                "revision": run.revision,
                "status": status_str,
            });
            fresh += 1;
            if status == TestOutcome::Failed {
                failed += 1;
            }
        }
    }
    let statuses: Vec<String> = tests
        .iter()
        .map(|test| {
            test.get("execution_status")
                .and_then(Value::as_str)
                .unwrap_or("not_run")
                .to_owned()
        })
        .collect();
    if fresh == 0 {
        return;
    }
    let top_level = if failed > 0 {
        "failed"
    } else if fresh == statuses.len() {
        "passed"
    } else {
        "partial"
    };
    plan["execution_status"] = json!(top_level);
    if let Some(reach) = plan.get_mut("test_reach").and_then(Value::as_array_mut) {
        for entry in reach.iter_mut() {
            let candidates = entry
                .get("candidate_test_indexes")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default();
            let mut entry_fresh = 0_usize;
            let mut entry_failed = false;
            for index in &candidates {
                let Some(test_index) = index.as_u64().and_then(|i| usize::try_from(i).ok()) else {
                    continue;
                };
                match statuses.get(test_index).map(String::as_str) {
                    Some("passed") => entry_fresh += 1,
                    Some("failed") => {
                        entry_fresh += 1;
                        entry_failed = true;
                    }
                    _ => {}
                }
            }
            if entry_fresh > 0 {
                entry["execution_status"] = json!(if entry_failed {
                    "failed"
                } else if entry_fresh == candidates.len() {
                    "passed"
                } else {
                    "partial"
                });
            }
        }
    }
}

fn hex_hash(hash: &Hash32) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut encoded = String::with_capacity(64);
    for byte in hash.0 {
        encoded.push(char::from(HEX[usize::from(byte >> 4)]));
        encoded.push(char::from(HEX[usize::from(byte & 0x0f)]));
    }
    encoded
}
