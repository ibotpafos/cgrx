//! No project scripts are executed. Node parses isolated copies without evaluating them.
use serde_json::{Value, json};
use std::{
    fs,
    path::Path,
    process::{Command, Stdio},
    sync::atomic::{AtomicU64, Ordering},
    time::{Duration, Instant},
};
static SEQUENCE: AtomicU64 = AtomicU64::new(0);
pub(super) struct CopyDir(pub(super) std::path::PathBuf);
impl Drop for CopyDir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}
fn check(root: &Path, file: &str) -> Value {
    let output = root.join(format!("{file}.log"));
    let Ok(log) = fs::File::create(&output) else {
        return json!({"status":"error","reason":"log_unavailable"});
    };
    let Ok(err) = log.try_clone() else {
        return json!({"status":"error","reason":"log_unavailable"});
    };
    let mut command = Command::new("node");
    command
        .args(["--experimental-strip-types", "--check", file])
        .current_dir(root)
        .env_remove("NODE_OPTIONS")
        .env_remove("NODE_PATH")
        .stdin(Stdio::null())
        .stdout(Stdio::from(log))
        .stderr(Stdio::from(err));
    let mut child = match command.spawn() {
        Ok(c) => c,
        Err(_) => return json!({"status":"unavailable","reason":"node_not_available"}),
    };
    let start = Instant::now();
    let status = loop {
        match child.try_wait() {
            Ok(Some(s)) => break Some(s),
            Ok(None) if start.elapsed() < Duration::from_secs(5) => {
                std::thread::sleep(Duration::from_millis(20))
            }
            _ => {
                let _ = child.kill();
                let _ = child.wait();
                break None;
            }
        }
    };
    // Parser diagnostics can contain source literals. Do not send them to an agent.
    json!({"status":match status {Some(s) if s.success()=>"passed",Some(_)=>"failed",None=>"timeout"},
        "exit_code":status.and_then(|s|s.code()),"command":["node","--experimental-strip-types","--check",file],
        "diagnostics":"withheld: parser diagnostics may contain source literals"})
}
pub(super) fn verify(path: &str, before: &str, after: &str, diff: &str) -> Value {
    let Ok(dir) = temporary() else {
        return json!({"status":"error","reason":"temporary_directory_unavailable"});
    };
    let result = (|| -> std::io::Result<Value> {
        // Reapply the actual returned diff, not a separately assembled replacement.
        // Git's --unsafe-paths is deliberately NOT used; only the expected file may change.
        fs::write(dir.0.join("candidate.patch"), diff)?;
        if Path::new(path).is_absolute()
            || Path::new(path)
                .components()
                .any(|c| !matches!(c, std::path::Component::Normal(_)))
        {
            return Ok(json!({"status":"blocked","reason":"unsafe_patch_path"}));
        }
        let target = dir.0.join(path);
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&target, before)?;
        let applied = Command::new("git")
            .args([
                "apply",
                "--no-index",
                "--whitespace=nowarn",
                "candidate.patch",
            ])
            .env("GIT_CONFIG_NOSYSTEM", "1")
            .env("GIT_CONFIG_GLOBAL", "/dev/null")
            .current_dir(&dir.0)
            .stdin(Stdio::null())
            .output()?;
        if !applied.status.success() || fs::read(&target)? != after.as_bytes() {
            return Ok(
                json!({"status":"failed","reason":"diff_does_not_reconstruct_candidate","exit_code":applied.status.code()}),
            );
        }
        fs::write(dir.0.join("baseline.ts"), before)?;
        fs::write(dir.0.join("modified.ts"), after)?;
        let baseline = check(&dir.0, "baseline.ts");
        let modified = check(&dir.0, "modified.ts");
        let passed = baseline["status"] == "passed" && modified["status"] == "passed";
        Ok(
            json!({"status":if passed{"syntax_passed"}else{"not_verified"},"isolated":true,"diff_applied":true,
            "baseline":baseline,"modified":modified,"source_modified":false,"requires_review":true,
            "format":{"status":"not_run"},"typecheck":{"status":"not_run"},"tests":{"status":"not_run"},
            "limitations":"File-only syntax check; no project dependency resolution, formatting, typecheck or tests. Never a merge-safety verdict."}),
        )
    })();
    result.unwrap_or_else(|_| json!({"status":"error","reason":"isolated_verification_io_error"}))
}
pub(super) fn temporary() -> std::io::Result<CopyDir> {
    let base = std::env::temp_dir().canonicalize()?;
    let mut directory = None;
    for _ in 0..8 {
        let name = format!(
            "cgrx-patch-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        );
        let p = base.join(name);
        let mut builder = fs::DirBuilder::new();
        #[cfg(unix)]
        {
            use std::os::unix::fs::DirBuilderExt;
            builder.mode(0o700);
        }
        if builder.create(&p).is_ok() {
            directory = Some(CopyDir(p));
            break;
        }
    }
    directory.ok_or_else(|| std::io::Error::other("temporary_directory_unavailable"))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn applies_actual_diff_and_preserves_input() {
        let a = "const endpoint = 'https://example.invalid';\n";
        let b = "const URL = 'https://example.invalid';\nconst endpoint = URL;\n";
        let diff = similar::TextDiff::from_lines(a, b)
            .unified_diff()
            .header("a/src/a.ts", "b/src/a.ts")
            .to_string();
        let r = verify("src/a.ts", a, b, &diff);
        assert_eq!(r["diff_applied"], true, "{r}");
        assert_eq!(r["source_modified"], false);
        assert_ne!(r["tests"]["status"], "passed");
    }
    #[test]
    fn rejects_mismatched_diff() {
        let r = verify("a.ts", "let x=1;", "let x=2;", "invalid patch");
        assert_eq!(r["status"], "failed");
    }
}
