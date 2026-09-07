use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);

struct Fixture(PathBuf);

impl Fixture {
    fn new() -> Self {
        let path = std::env::temp_dir().join(format!(
            "cgrx-observe-cli-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(&path).unwrap();
        git(&path, &["init", "-q"]);
        git(&path, &["config", "user.name", "CGRX Test"]);
        git(&path, &["config", "user.email", "test@example.invalid"]);
        fs::write(
            path.join("main.rs"),
            "fn target() {}\nfn caller() { target(); }\n",
        )
        .unwrap();
        git(&path, &["add", "."]);
        git(&path, &["commit", "-qm", "fixture"]);
        Self(path.canonicalize().unwrap())
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn git(root: &Path, args: &[&str]) -> String {
    let output = Command::new("git")
        .args(args)
        .current_dir(root)
        .output()
        .unwrap();
    assert!(output.status.success());
    String::from_utf8_lossy(&output.stdout).trim().to_owned()
}

fn invoke(root: &Path, args: &[&str], input: &[u8]) -> (i32, String, String) {
    let mut child = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(args)
        .current_dir(root)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    child.stdin.take().unwrap().write_all(input).unwrap();
    let output = child.wait_with_output().unwrap();
    (
        output.status.code().unwrap(),
        String::from_utf8(output.stdout).unwrap(),
        String::from_utf8(output.stderr).unwrap(),
    )
}

#[test]
fn observe_import_status_and_prune_are_machine_readable() {
    let fixture = Fixture::new();
    let revision = git(&fixture.0, &["rev-parse", "HEAD"]);
    let row = serde_json::json!({
        "schema":"cgrx.runtime.v1", "repo_revision":revision, "environment":"test",
        "observed_at_unix_nanos":"42", "count":2,
        "caller":{"function":"caller","file":"main.rs","line":2},
        "callee":{"function":"target","file":"main.rs","line":1}
    })
    .to_string();
    let (code, stdout, stderr) = invoke(
        &fixture.0,
        &[
            "observe", "import", "--input", "-", "--format", "auto", "--json",
        ],
        row.as_bytes(),
    );
    assert_eq!((code, stderr.as_str()), (0, ""));
    assert_eq!(
        serde_json::from_str::<serde_json::Value>(&stdout).unwrap()["accepted"],
        1
    );

    let (code, stdout, _) = invoke(&fixture.0, &["observe", "status", "--json"], b"");
    assert_eq!(code, 0);
    assert_eq!(
        serde_json::from_str::<serde_json::Value>(&stdout).unwrap()["edges"],
        1
    );

    let (code, stdout, _) = invoke(
        &fixture.0,
        &["observe", "insights", "--limit", "10", "--json"],
        b"",
    );
    assert_eq!(code, 0);
    let insights: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    assert_eq!(insights["llm_used"], false);
    assert_eq!(insights["algorithm"], "runtime_priority_v1");
    assert!(
        insights["rows"]
            .as_array()
            .is_some_and(|rows| !rows.is_empty())
    );

    let (code, stdout, _) = invoke(
        &fixture.0,
        &[
            "observe",
            "prune",
            "--before-unix-nanos",
            "43",
            "--dry-run",
            "--json",
        ],
        b"",
    );
    assert_eq!(code, 0);
    let report: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    assert_eq!(report["removed_batches"], 1);
    assert_eq!(report["dry_run"], true);
}

#[test]
fn observe_rejects_unsafe_or_incomplete_lifecycle_requests() {
    let fixture = Fixture::new();
    for args in [
        vec!["observe", "import", "--json"],
        vec!["observe", "prune", "--before-unix-nanos", "1", "--json"],
        vec![
            "observe",
            "prune",
            "--before-unix-nanos",
            "1",
            "--dry-run",
            "--apply",
            "--json",
        ],
    ] {
        let (code, stdout, stderr) = invoke(&fixture.0, &args, b"");
        assert_eq!(code, 2);
        assert!(stdout.is_empty());
        assert!(stderr.starts_with("cgrx: "));
    }
}
