//! Optional, report-only profiling of explicitly trusted, committed project workloads.
use super::{project_checks, verification};
use serde::Deserialize;
use serde_json::{Value, json};
use std::{
    fs::{self, File},
    io::{self, Read},
    path::{Component, Path, PathBuf},
    sync::atomic::{AtomicBool, Ordering},
};

const CONFIG_ENV: &str = "CGRX_FAST_ANYTHING_CONFIG";
const REPORT: &str = "fast-anything-v1.json";
const MAX_STATE: u64 = 256 * 1024;
const OUTCOME: &str = "fast-anything-outcome-v1.json";
const COOLDOWN_SECS: u64 = 60;

fn now() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn write_state(managed: &Path, name: &str, value: &Value) -> io::Result<()> {
    fs::create_dir_all(managed)?;
    let tmp = managed.join(format!("{name}.{}.tmp", std::process::id()));
    fs::write(&tmp, serde_json::to_vec(value)?)?;
    fs::rename(tmp, managed.join(name))
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Config {
    binary: PathBuf,
    projects: Vec<Project>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Project {
    root: PathBuf,
    command: Vec<String>,
    #[serde(default)]
    source_paths: Vec<PathBuf>,
    #[serde(default)]
    dependency_roots: Vec<PathBuf>,
}

pub(super) struct Profile {
    argv: Vec<String>,
    key: String,
    source_paths: Vec<PathBuf>,
    dependency_roots: Vec<PathBuf>,
}

fn read_json<T: serde::de::DeserializeOwned>(path: &Path, max: u64) -> io::Result<T> {
    let mut bytes = Vec::new();
    File::open(path)?.take(max + 1).read_to_end(&mut bytes)?;
    if bytes.len() as u64 > max {
        return Err(io::Error::other("size limit"));
    }
    serde_json::from_slice(&bytes).map_err(io::Error::other)
}

fn relative(path: &Path) -> bool {
    !path.as_os_str().is_empty()
        && path
            .components()
            .all(|part| matches!(part, Component::Normal(_)))
}

impl Profile {
    pub(super) fn load(root: &Path, _managed: &Path) -> Result<Option<Self>, &'static str> {
        let Some(path) = std::env::var_os(CONFIG_ENV).map(PathBuf::from) else {
            return Ok(None);
        };
        let root = root.canonicalize().map_err(|_| "invalid_project_root")?;
        if !path.is_absolute() {
            return Err("config_must_be_absolute");
        }
        let path = path.canonicalize().map_err(|_| "config_unavailable")?;
        if path.starts_with(&root) || !path.is_file() {
            return Err("config_must_be_outside_the_project");
        }
        let config: Config = read_json(&path, 32 * 1024).map_err(|_| "invalid_config")?;
        let mut matching = config
            .projects
            .into_iter()
            .filter(|p| p.root.is_absolute() && p.root.canonicalize().ok().as_ref() == Some(&root));
        let Some(project) = matching.next() else {
            return Ok(None);
        };
        if matching.next().is_some() || !config.binary.is_absolute() {
            return Err("invalid_project_config");
        }
        let command = project.command;
        let valid = (2..=16).contains(&command.len())
            && command
                .iter()
                .all(|s| s.len() <= 1024 && !s.chars().any(char::is_control))
            && relative(Path::new(&command[1]))
            && match command[0].as_str() {
                "node" => matches!(
                    Path::new(&command[1]).extension().and_then(|s| s.to_str()),
                    Some("js" | "mjs" | "cjs" | "ts")
                ),
                "python" | "python3" => Path::new(&command[1])
                    .extension()
                    .is_some_and(|ext| ext == "py"),
                _ => false,
            }
            && !command[1].starts_with('-');
        if !valid {
            return Err("expected_node_or_python_entrypoint");
        }
        let binary = config
            .binary
            .canonicalize()
            .map_err(|_| "profiler_unavailable")?;
        if binary.starts_with(&root) || !binary.is_file() {
            return Err("profiler_must_be_outside_the_project");
        }
        let binary = binary.to_str().ok_or("invalid_profiler_path")?.to_owned();
        let argv: Vec<String> = [binary, "scan".into(), "--".into()]
            .into_iter()
            .chain(command)
            .collect();
        let source_paths = if project.source_paths.is_empty() {
            vec![PathBuf::from(&argv[4])]
        } else {
            project.source_paths
        };
        let dependency_roots = project.dependency_roots;
        if source_paths.len() > 32
            || dependency_roots.len() > 16
            || source_paths
                .iter()
                .chain(&dependency_roots)
                .any(|p| !project_checks::profile_path_valid(p))
            || !source_paths
                .iter()
                .any(|p| Path::new(&argv[4]).starts_with(p))
        {
            return Err("invalid_profile_copy_paths");
        }
        let key = blake3::hash(
            json!([&argv, &source_paths, &dependency_roots])
                .to_string()
                .as_bytes(),
        )
        .to_hex()
        .to_string();
        Ok(Some(Self {
            argv,
            key,
            source_paths,
            dependency_roots,
        }))
    }

    pub(super) fn persisted_report(&self, managed: &Path, revision: &str) -> Option<Value> {
        let value = read_json::<Value>(&managed.join(REPORT), MAX_STATE).ok()?;
        let report = &value["report"];
        (value["key"] == self.key && report["revision"] == revision && report["status"] == "ready")
            .then(|| report.clone())
    }

    pub(super) fn last_status(&self, managed: &Path, revision: &str) -> Option<Value> {
        self.persisted_report(managed, revision)
            .or_else(|| self.recent_outcome(managed, revision))
    }

    fn recent_outcome(&self, managed: &Path, revision: &str) -> Option<Value> {
        let value = read_json::<Value>(&managed.join(OUTCOME), MAX_STATE).ok()?;
        let attempted = value["attempted_at_unix"].as_u64()?;
        let elapsed = now().checked_sub(attempted)?;
        if value["key"] != self.key || value["revision"] != revision || elapsed >= COOLDOWN_SECS {
            return None;
        }
        // Only our vocabulary and timestamps survive restart; never return arbitrary disk diagnostics.
        if value["reason"] == "waiting_for_clean_commit" {
            return Some(json!({"status":"waiting_for_clean_commit","revision":revision}));
        }
        let reason = match value["reason"].as_str()? {
            "attempt_in_progress" => "attempt_in_progress",
            "timeout" => "timeout",
            "output_limit" => "output_limit",
            "cancelled" => "cancelled",
            "command_failed" => "command_failed",
            "entrypoint_unavailable" => "entrypoint_unavailable",
            "invalid_profile" => "invalid_profile",
            "profile_unavailable" => "profile_unavailable",
            "snapshot_timeout_or_cancelled" => "snapshot_timeout_or_cancelled",
            "snapshot_byte_budget_exceeded" => "snapshot_byte_budget_exceeded",
            "snapshot_entry_budget_exceeded" => "snapshot_entry_budget_exceeded",
            "unsupported_committed_entry" => "unsupported_committed_entry",
            "dependency_contains_committed_source" => "dependency_contains_committed_source",
            "unsafe_dependency_symlink" => "unsafe_dependency_symlink",
            "unsafe_dependency_root" => "unsafe_dependency_root",
            "unsafe_snapshot_path" => "unsafe_snapshot_path",
            "committed_blob_unavailable" => "committed_blob_unavailable",
            "source_or_dependency_missing" => "source_or_dependency_missing",
            "dependency_overlaps_source" => "dependency_overlaps_source",
            "invalid_revision" => "invalid_revision",
            "snapshot_io_unavailable" => "snapshot_io_unavailable",
            _ => return None,
        };
        Some(
            json!({"status":"cooldown","revision":revision,"reason":reason,
            "retry_after_unix":attempted.saturating_add(COOLDOWN_SECS)}),
        )
    }

    pub(super) fn needs_attempt(&self, managed: &Path, revision: &str) -> bool {
        self.last_status(managed, revision)
            .is_none_or(|status| status["status"] == "waiting_for_clean_commit")
    }

    pub(super) fn poll(
        &mut self,
        managed: &Path,
        root: &Path,
        revision: &str,
        stop: &AtomicBool,
    ) -> Value {
        if let Some(cached) = self.last_status(managed, revision)
            && cached["status"] != "waiting_for_clean_commit"
        {
            return cached;
        }
        if stop.load(Ordering::Acquire) {
            return json!({"status":"cancelled","revision":revision});
        }
        // Mark before launch so interrupted one-shot jobs also back off after restart.
        let attempted = now();
        let outcome = |reason: &str| {
            json!({"key":self.key,"revision":revision,
            "attempted_at_unix":attempted,"reason":reason})
        };
        if !project_checks::profile_clean_revision(root, revision, stop) {
            let _ = write_state(managed, OUTCOME, &outcome("waiting_for_clean_commit"));
            return json!({"status":"waiting_for_clean_commit","revision":revision});
        }
        if write_state(managed, OUTCOME, &outcome("attempt_in_progress")).is_err() {
            return json!({"status":"unavailable","reason":"cooldown_state_unavailable","revision":revision});
        }
        let result = self.scan(root, revision, stop);
        if !stop.load(Ordering::Acquire)
            && !project_checks::profile_clean_revision(root, revision, stop)
        {
            let _ = write_state(managed, OUTCOME, &outcome("waiting_for_clean_commit"));
            return json!({"status":"waiting_for_clean_commit","revision":revision});
        }
        let report = json!({
            "tool":"fast-anything","revision":revision,"basis":"committed_blobs",
            "status":result["status"],"reason":result["reason"],"candidates":result["candidates"],
            "duration_ms":result["duration_ms"],
            "requires_review":true,"patch_applied":false,
        });
        if result["status"] == "ready" && !stop.load(Ordering::Acquire) {
            if write_state(managed, REPORT, &json!({"key":self.key,"report":report})).is_err() {
                return json!({"status":"unavailable","reason":"report_state_unavailable","revision":revision});
            }
            let _ = fs::remove_file(managed.join(OUTCOME));
        } else {
            let _ = write_state(
                managed,
                OUTCOME,
                &outcome(result["reason"].as_str().unwrap_or("profile_unavailable")),
            );
        }
        report
    }

    fn scan(&self, root: &Path, revision: &str, stop: &AtomicBool) -> Value {
        let attempt = || -> io::Result<Value> {
            let scratch = verification::temporary()?;
            let copy = scratch.0.join("project");
            if let Err(error) = project_checks::copy_for_profile(
                root,
                &copy,
                revision,
                &self.source_paths,
                &self.dependency_roots,
                stop,
            ) {
                return Ok(
                    json!({"status":"profile_unavailable","reason":project_checks::profile_copy_reason(&error)}),
                );
            }
            if stop.load(Ordering::Acquire) {
                return Ok(json!({"status":"cancelled","reason":"cancelled"}));
            }
            let Ok(entrypoint) = copy.join(&self.argv[4]).canonicalize() else {
                return Ok(
                    json!({"status":"entrypoint_unavailable","reason":"entrypoint_unavailable"}),
                );
            };
            if !entrypoint.starts_with(&copy) || !entrypoint.is_file() {
                return Ok(
                    json!({"status":"entrypoint_unavailable","reason":"entrypoint_unavailable"}),
                );
            }
            let run = project_checks::run_bounded(
                &copy,
                &scratch.0,
                "fast-anything",
                &self.argv,
                10_000,
                Some(stop),
            );
            if run["status"] != "passed" {
                return Ok(
                    json!({"status":run["status"],"duration_ms":run["duration_ms"],"reason":match run["status"].as_str() {
                        Some("timeout") => "timeout", Some("output_limit") => "output_limit",
                        Some("cancelled") => "cancelled", _ => "command_failed",
                    }}),
                );
            }
            let state = copy.join(".fast/state.json");
            if fs::symlink_metadata(&state)?.is_symlink()
                || state.canonicalize()? != state
                || !state.is_file()
            {
                return Ok(json!({"status":"invalid_profile","reason":"invalid_profile"}));
            }
            let content: Value = read_json(&state, MAX_STATE)?;
            if !content["hotspots"].is_array() {
                return Ok(json!({"status":"invalid_profile","reason":"invalid_profile"}));
            }
            Ok(
                json!({"status":"ready","candidates":candidates(&content),"duration_ms":run["duration_ms"]}),
            )
        };
        attempt().unwrap_or_else(
            |_| json!({"status":"profile_unavailable","reason":"profile_unavailable"}),
        )
    }
}

fn candidates(state: &Value) -> Vec<Value> {
    // Fast Anything emits private source, call records and diagnostics too. Project
    // output is untrusted; copy only these bounded locations and numeric scores.
    let label = |s: &str| {
        !s.is_empty()
            && s.len() <= 240
            && s.bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"._-/$".contains(&b))
    };
    state["hotspots"].as_array().into_iter().flatten().take(100).filter_map(|row| {
        let file = row["file"].as_str()?;
        let symbol = row["qualname"].as_str().or_else(|| row["name"].as_str())?;
        let line = row["line"].as_u64().filter(|n| *n > 0)?;
        let share = row["share"].as_f64().filter(|s| (0.05..=1.0).contains(s))?;
        let portability = row["portability"].as_f64().filter(|s| (0.5..=1.0).contains(s))?;
        if !label(file) || !relative(Path::new(file)) || !label(symbol)
            || !row["blockers"].as_array().is_some_and(Vec::is_empty)
        {
            return None;
        }
        Some(json!({"path":file,"symbol":symbol,"line":line,"cpu_share":share,"portability":portability,
            "recommendation":"review_and_benchmark_before_porting"}))
    }).take(5).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;

    fn profile() -> Profile {
        Profile {
            argv: Vec::new(),
            key: "current-config".into(),
            source_paths: vec!["bench.py".into()],
            dependency_roots: vec![],
        }
    }

    #[test]
    fn only_matching_ready_reports_are_reused() {
        let dir = verification::temporary().unwrap();
        let p = profile();
        for status in ["failed", "timeout", "ready"] {
            write_state(
                &dir.0,
                REPORT,
                &json!({"key":p.key,"report":{"status":status,"revision":"revision"}}),
            )
            .unwrap();
            assert_eq!(
                p.persisted_report(&dir.0, "revision").is_some(),
                status == "ready"
            );
            assert!(p.persisted_report(&dir.0, "other-revision").is_none());
        }
        let mut changed = profile();
        changed.key = "changed-config".into();
        assert!(changed.persisted_report(&dir.0, "revision").is_none());
        fs::write(dir.0.join(REPORT), "{broken").unwrap();
        assert!(p.needs_attempt(&dir.0, "revision"));
    }

    #[test]
    fn outcomes_expire_and_survive_recreated_jobs() {
        let dir = verification::temporary().unwrap();
        let p = profile();
        let outcome = |timestamp, reason| json!({"key":p.key,"revision":"revision","attempted_at_unix":timestamp,"reason":reason});
        for reason in [
            "timeout",
            "attempt_in_progress",
            "snapshot_byte_budget_exceeded",
        ] {
            write_state(&dir.0, OUTCOME, &outcome(now(), reason)).unwrap();
            assert!(!profile().needs_attempt(&dir.0, "revision"));
            assert_eq!(
                profile().last_status(&dir.0, "revision").unwrap()["status"],
                "cooldown"
            );
            assert!(profile().needs_attempt(&dir.0, "other"));
        }
        write_state(&dir.0, OUTCOME, &outcome(now() - COOLDOWN_SECS, "timeout")).unwrap();
        assert!(profile().needs_attempt(&dir.0, "revision"));
        write_state(&dir.0, OUTCOME, &outcome(now() + 1000, "timeout")).unwrap();
        assert!(profile().needs_attempt(&dir.0, "revision"));
        write_state(&dir.0, OUTCOME, &outcome(now(), "private /host/token")).unwrap();
        assert!(profile().last_status(&dir.0, "revision").is_none());
        write_state(&dir.0, OUTCOME, &outcome(now(), "waiting_for_clean_commit")).unwrap();
        assert_eq!(
            profile().last_status(&dir.0, "revision").unwrap()["status"],
            "waiting_for_clean_commit"
        );
        assert!(profile().needs_attempt(&dir.0, "revision"));
    }

    fn git(root: &Path, args: &[&str]) -> String {
        let output = Command::new("git")
            .args(args)
            .current_dir(root)
            .env_remove("GIT_CONFIG_COUNT")
            .env("GIT_CONFIG_GLOBAL", "/dev/null")
            .output()
            .unwrap();
        assert!(output.status.success());
        String::from_utf8(output.stdout).unwrap().trim().to_owned()
    }

    #[cfg(unix)]
    fn fixture() -> (
        verification::CopyDir,
        verification::CopyDir,
        String,
        Profile,
    ) {
        use std::os::unix::fs::PermissionsExt;
        let root = verification::temporary().unwrap();
        let managed = verification::temporary().unwrap();
        git(&root.0, &["init", "-q"]);
        fs::write(root.0.join("bench.py"), r#"import json, pathlib
pathlib.Path('.fast').mkdir()
pathlib.Path('.fast/state.json').write_text(json.dumps({'private': 'RAW_PROFILE_SECRET', 'hotspots': [{'file':'bench.py','qualname':'work','line':1,'share':0.7,'portability':1.0,'blockers':[]}]}))
"#).unwrap();
        git(&root.0, &["add", "."]);
        git(
            &root.0,
            &[
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-qm",
                "fixture",
            ],
        );
        let revision = git(&root.0, &["rev-parse", "HEAD"]);
        let binary = managed.0.join("profiler");
        fs::write(&binary, "#!/bin/sh\nexec \"$3\" \"$4\"\n").unwrap();
        fs::set_permissions(&binary, fs::Permissions::from_mode(0o700)).unwrap();
        let mut p = profile();
        p.argv = vec![
            binary.to_str().unwrap().into(),
            "scan".into(),
            "--".into(),
            "python3".into(),
            "bench.py".into(),
        ];
        (root, managed, revision, p)
    }

    #[cfg(unix)]
    #[test]
    fn ready_poll_uses_blobs_and_persists_no_raw_profile() {
        let (root, managed, revision, mut p) = fixture();
        git(&root.0, &["update-index", "--assume-unchanged", "bench.py"]);
        fs::write(
            root.0.join("bench.py"),
            "raise Exception('worktree bytes executed')",
        )
        .unwrap();
        let report = p.poll(&managed.0, &root.0, &revision, &AtomicBool::new(false));
        assert_eq!(report["status"], "ready", "{report}");
        assert_eq!(report["candidates"][0]["path"], "bench.py");
        assert!(!root.0.join(".fast").exists());
        assert!(!managed.0.join(".fast").exists());
        assert!(
            !fs::read_to_string(managed.0.join(REPORT))
                .unwrap()
                .contains("RAW_PROFILE_SECRET")
        );
        assert!(!profile().needs_attempt(&managed.0, &revision));
    }

    #[cfg(unix)]
    #[test]
    fn failures_back_off_but_waiting_rechecks_after_commit() {
        let (root, managed, revision, mut p) = fixture();
        fs::write(root.0.join("untracked.py"), "untracked").unwrap();
        let stop = AtomicBool::new(false);
        assert_eq!(
            p.poll(&managed.0, &root.0, &revision, &stop)["status"],
            "waiting_for_clean_commit"
        );
        assert!(profile().needs_attempt(&managed.0, &revision));
        fs::remove_file(root.0.join("untracked.py")).unwrap();
        fs::write(&p.argv[0], "#!/bin/sh\nexit 7\n").unwrap();
        assert_eq!(
            p.poll(&managed.0, &root.0, &revision, &stop)["status"],
            "failed"
        );
        assert!(!managed.0.join(REPORT).exists());
        assert!(!profile().needs_attempt(&managed.0, &revision));
        assert_eq!(
            profile().poll(&managed.0, &root.0, &revision, &stop)["status"],
            "cooldown"
        );
        assert_eq!(
            profile().last_status(&managed.0, &revision).unwrap()["reason"],
            "command_failed"
        );
    }

    #[cfg(unix)]
    #[test]
    fn untracked_entrypoint_waits_then_runs_after_commit() {
        let (root, managed, old_revision, mut p) = fixture();
        let bench = fs::read(root.0.join("bench.py")).unwrap();
        fs::remove_file(root.0.join("bench.py")).unwrap();
        git(&root.0, &["add", "bench.py"]);
        git(
            &root.0,
            &[
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-qm",
                "remove bench",
            ],
        );
        let revision = git(&root.0, &["rev-parse", "HEAD"]);
        assert_ne!(revision, old_revision);
        fs::write(root.0.join("bench.py"), bench).unwrap();
        let stop = AtomicBool::new(false);
        assert_eq!(
            p.poll(&managed.0, &root.0, &revision, &stop)["status"],
            "waiting_for_clean_commit"
        );
        assert!(p.needs_attempt(&managed.0, &revision));
        assert!(!managed.0.join(REPORT).exists());
        git(&root.0, &["add", "bench.py"]);
        git(
            &root.0,
            &[
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-qm",
                "add bench",
            ],
        );
        let revision = git(&root.0, &["rev-parse", "HEAD"]);
        assert_eq!(
            p.poll(&managed.0, &root.0, &revision, &stop)["status"],
            "ready"
        );
    }

    #[test]
    fn copy_config_defaults_and_unknown_fields() {
        let p: Project =
            serde_json::from_value(json!({"root":"/project","command":["python3","bench.py"]}))
                .unwrap();
        assert!(p.source_paths.is_empty());
        assert!(p.dependency_roots.is_empty());
        let p: Project = serde_json::from_value(json!({"root":"/project","command":["node","bench/a.mjs"],
            "source_paths":["bench","src","package.json"],"dependency_roots":["node_modules/needed","service/dist"]})).unwrap();
        assert_eq!(p.source_paths.len(), 3);
        assert_eq!(p.dependency_roots.len(), 2);
        assert!(
            serde_json::from_value::<Project>(
                json!({"root":"/project","command":[],"copy_all":true})
            )
            .is_err()
        );
    }
}
