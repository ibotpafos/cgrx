use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);

struct TestDirectory(PathBuf);

impl TestDirectory {
    fn new(label: &str) -> Self {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock after epoch")
            .as_nanos();
        let sequence = SEQUENCE.fetch_add(1, Ordering::Relaxed);
        let path = std::env::temp_dir().join(format!(
            "cgrx-{label}-{}-{nonce}-{sequence}",
            std::process::id()
        ));
        fs::create_dir_all(&path).expect("create test directory");
        Self(path)
    }

    fn path(&self) -> &Path {
        &self.0
    }
}

impl Drop for TestDirectory {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn git(root: &Path, args: &[&str]) {
    assert!(
        Command::new("git")
            .args(args)
            .current_dir(root)
            .status()
            .expect("git executable")
            .success(),
        "git command failed: {args:?}"
    );
}

fn architecture_runtime() -> (TestDirectory, TestDirectory, Runtime) {
    let repository = TestDirectory::new("architecture-repository");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::create_dir_all(repository.path().join("api")).expect("create api");
    fs::create_dir_all(repository.path().join("core")).expect("create core");
    fs::create_dir_all(repository.path().join("shared")).expect("create shared");
    fs::write(
        repository.path().join("api/handler.ts"),
        "import { coreTask } from '../core/service';\nexport function handler() { return coreTask(); }\n",
    )
    .expect("write handler");
    fs::write(
        repository.path().join("api/hook.ts"),
        "export function apiHook() { return 1; }\n",
    )
    .expect("write hook");
    fs::write(
        repository.path().join("core/service.ts"),
        "import { apiHook } from '../api/hook';\nexport function coreTask() { return apiHook(); }\n",
    )
    .expect("write service");
    fs::write(
        repository.path().join("shared/format.ts"),
        "export function formatValue(value: number) { return String(value); }\n",
    )
    .expect("write shared");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("architecture-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");
    (repository, state, runtime)
}

fn scope() -> Scope {
    Scope {
        include: vec!["**".to_owned()],
        exclude: Vec::new(),
        relation_kinds: vec![RelationKind::Calls, RelationKind::Implements],
        max_depth: 4,
    }
}

#[test]
fn architecture_projects_proven_package_boundaries_cycles_and_hotspots() {
    let (_repository, _state, runtime) = architecture_runtime();

    let result = runtime
        .get_architecture(&scope(), 1, 20)
        .expect("architecture projection");

    assert_eq!(
        result["relation_kinds"],
        serde_json::json!(["CALLS", "IMPLEMENTS"])
    );
    assert_eq!(
        result["packages"],
        serde_json::json!([
            {"name":"api","files":2,"symbols":2,"fan_in":1,"fan_out":1},
            {"name":"core","files":1,"symbols":1,"fan_in":1,"fan_out":1},
            {"name":"shared","files":1,"symbols":1,"fan_in":0,"fan_out":0}
        ])
    );
    assert_eq!(
        result["boundaries"].as_array().expect("boundaries").len(),
        2
    );
    assert!(
        result["boundaries"]
            .as_array()
            .expect("boundaries")
            .iter()
            .all(|row| {
                row["confidence"] == "PROVEN"
                    && row["evidence"]
                        .as_array()
                        .is_some_and(|items| !items.is_empty())
            })
    );
    assert_eq!(
        result["cycles"][0]["packages"],
        serde_json::json!(["api", "core"])
    );
    assert_eq!(result["hotspots"][0]["symbol"], "apiHook");
    assert_eq!(
        result["communities"][0]["packages"],
        serde_json::json!(["api", "core"])
    );
    assert_eq!(result["partial"], false);
    assert_eq!(result["truncated"], false);
    assert!(result["snapshot"]["repo_revision"].is_string());
    assert_eq!(
        result,
        runtime
            .get_architecture(&scope(), 1, 20)
            .expect("repeat architecture projection")
    );

    let bounded = runtime
        .get_architecture(&scope(), 1, 1)
        .expect("bounded architecture projection");
    let visible_packages = bounded["packages"]
        .as_array()
        .expect("packages")
        .iter()
        .map(|package| package["name"].as_str().expect("package name"))
        .collect::<std::collections::BTreeSet<_>>();
    assert!(
        bounded["boundaries"]
            .as_array()
            .expect("boundaries")
            .iter()
            .all(
                |boundary| visible_packages.contains(boundary["source"].as_str().unwrap())
                    && visible_packages.contains(boundary["target"].as_str().unwrap())
            )
    );
    assert_eq!(bounded["truncated"], true);
}

#[test]
fn architecture_rejects_unbounded_or_invalid_requests() {
    let (_repository, _state, runtime) = architecture_runtime();
    for (depth, limit) in [(0, 20), (5, 20), (1, 0), (1, 101)] {
        assert_eq!(
            runtime
                .get_architecture(&scope(), depth, limit)
                .expect_err("invalid architecture request")
                .code(),
            "cgrx.invalid_arguments"
        );
    }
}
