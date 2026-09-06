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
        serde_json::json!(["CALLS", "IMPLEMENTS", "IMPORTS"])
    );
    assert_eq!(
        result["packages"],
        serde_json::json!([
            {"name":"api","files":2,"symbols":2,"fan_in":2,"fan_out":2},
            {"name":"core","files":1,"symbols":1,"fan_in":2,"fan_out":2},
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
fn architecture_proves_repo_local_imports_for_every_supported_language_and_refreshes() {
    let repository = TestDirectory::new("architecture-imports-repository");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    let files = [
        (
            "typescript/api/main.ts",
            "import { helper } from '../core/helper';\nimport React from 'react';\nexport function run() { return helper(); }\n",
        ),
        (
            "typescript/core/helper.ts",
            "export function helper() { return 1; }\n",
        ),
        (
            "typescript/ambiguous_api/main.ts",
            "import { thing } from '../ambiguous/thing';\nexport function run() { return thing(); }\n",
        ),
        (
            "typescript/ambiguous/thing.ts",
            "export function thing() { return 1; }\n",
        ),
        (
            "typescript/ambiguous/thing/index.ts",
            "export function thing() { return 2; }\n",
        ),
        (
            "python/api/main.py",
            "from python.core.helper import helper\nimport os\ndef run():\n    return helper()\n",
        ),
        ("python/core/helper.py", "def helper():\n    return 1\n"),
        ("go.mod", "module example.com/cgrxfixture\n\ngo 1.23\n"),
        (
            "go_api/main.go",
            "package go_api\nimport (\n    \"example.com/cgrxfixture/go_core\"\n    \"fmt\"\n)\nfunc Run() { go_core.Helper(); fmt.Println() }\n",
        ),
        ("go_core/helper.go", "package go_core\nfunc Helper() {}\n"),
        ("Cargo.toml", "[package]\nname='fixture'\nversion='0.1.0'\n"),
        ("src/lib.rs", "mod api; mod core;\n"),
        (
            "src/api/mod.rs",
            "use crate::core::helper;\nuse serde::Serialize;\npub fn run() { helper(); }\n",
        ),
        ("src/core.rs", "pub fn helper() {}\n"),
    ];
    for (path, source) in files {
        let path = repository.path().join(path);
        fs::create_dir_all(path.parent().unwrap()).expect("create source parent");
        fs::write(path, source).expect("write source");
    }
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("architecture-imports-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let mut runtime = Runtime::open(state.path()).expect("open runtime");

    let result = runtime.get_architecture(&scope(), 2, 100).unwrap();
    let imports = result["boundaries"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|row| {
            row["relations"]
                .as_array()
                .unwrap()
                .iter()
                .any(|kind| kind == "IMPORTS")
        })
        .map(|row| {
            (
                row["source"].as_str().unwrap(),
                row["target"].as_str().unwrap(),
            )
        })
        .collect::<std::collections::BTreeSet<_>>();
    assert_eq!(
        imports,
        std::collections::BTreeSet::from([
            ("go_api", "go_core"),
            ("python/api", "python/core"),
            ("src/api", "src"),
            ("typescript/api", "typescript/core"),
        ])
    );
    assert_eq!(result["import_resolution"]["proven"], 4);
    assert_eq!(result["import_resolution"]["external"], 4);
    assert_eq!(result["import_resolution"]["out_of_scope"], 0);
    assert_eq!(result["import_resolution"]["unresolved_local"], 1);
    assert!(
        result["coverage_gaps"]
            .as_array()
            .unwrap()
            .iter()
            .any(|gap| {
                gap["code"] == "UNRESOLVED_LOCAL_IMPORT"
                    && gap["path"] == "typescript/ambiguous_api/main.ts"
            })
    );
    assert!(
        !imports
            .iter()
            .any(|(source, _)| *source == "typescript/ambiguous_api")
    );

    fs::create_dir_all(repository.path().join("typescript/other")).unwrap();
    fs::write(
        repository.path().join("typescript/other/helper.ts"),
        "export function helper() { return 2; }\n",
    )
    .unwrap();
    fs::write(
        repository.path().join("typescript/api/main.ts"),
        "import { helper } from '../other/helper'; export function run() { return helper(); }\n",
    )
    .unwrap();
    assert!(runtime.refresh(repository.path()).unwrap());
    let refreshed = runtime.get_architecture(&scope(), 2, 100).unwrap();
    assert!(
        refreshed["boundaries"]
            .as_array()
            .unwrap()
            .iter()
            .any(|row| {
                row["source"] == "typescript/api"
                    && row["target"] == "typescript/other"
                    && row["relations"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .any(|kind| kind == "IMPORTS")
            })
    );
    assert!(
        !refreshed["boundaries"]
            .as_array()
            .unwrap()
            .iter()
            .any(|row| {
                row["source"] == "typescript/api"
                    && row["target"] == "typescript/core"
                    && row["relations"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .any(|kind| kind == "IMPORTS")
            })
    );
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
