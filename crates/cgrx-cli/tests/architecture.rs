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
        serde_json::json!(["CALLS", "IMPLEMENTS", "IMPORTS", "REFERENCES"])
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
    assert_eq!(
        result["architecture_plan"]["algorithm"],
        "architecture_futures_v1"
    );
    assert_eq!(result["architecture_plan"]["llm_used"], false);
    assert_eq!(
        result["architecture_plan"]["issues"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    let issue = &result["architecture_plan"]["issues"][0];
    assert_eq!(issue["kind"], "PACKAGE_DEPENDENCY_CYCLE");
    assert_eq!(issue["selected_boundary"]["source"], "api");
    assert_eq!(issue["selected_boundary"]["target"], "core");
    assert_eq!(issue["strategies"].as_array().unwrap().len(), 3);
    assert_eq!(issue["strategies"][0]["policy"], "invert_dependency");
    assert_eq!(issue["strategies"][0]["recommended"], true);
    assert_eq!(issue["strategies"][0]["counterfactual"]["rank"], 1);
    assert_eq!(issue["strategies"][0]["counterfactual"]["llm_used"], false);
    assert_eq!(
        issue["strategies"][0]["predicted_graph"]["cycles_removed"],
        1
    );
    assert_eq!(issue["agent_handoff"]["llm_used"], false);
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
    assert_eq!(
        bounded["architecture_plan"]["issues"][0]["strategies"][0]["policy"],
        "preserve_and_monitor"
    );
    assert_eq!(
        bounded["architecture_plan"]["issues"][0]["strategies"][1]["status"],
        "blocked_by_gaps"
    );
}

#[test]
fn architecture_exposes_bounded_symbol_communities_with_representatives() {
    let (_repository, _state, runtime) = architecture_runtime();

    let result = runtime.get_architecture(&scope(), 1, 20).unwrap();
    assert_eq!(
        result["symbol_community_detection"]["method"],
        "DETERMINISTIC_WEIGHTED_MODULARITY"
    );
    assert_eq!(
        result["symbol_community_detection"]["unclustered_symbols"],
        1
    );
    assert_eq!(result["totals"]["symbol_communities"], 1);
    assert_eq!(result["symbol_communities"][0]["members"], 3);
    assert_eq!(
        result["symbol_communities"][0]["edge_types"],
        serde_json::json!(["CALLS"])
    );
    assert_eq!(
        result["symbol_communities"][0]["packages"],
        serde_json::json!(["api", "core"])
    );
    let representatives = result["symbol_communities"][0]["top_nodes"]
        .as_array()
        .unwrap();
    assert_eq!(representatives.len(), 3);
    assert!(representatives.iter().all(|node| {
        node["node_id"].is_u64()
            && node["symbol"].is_string()
            && node["path"].is_string()
            && node["weighted_degree"]
                .as_u64()
                .is_some_and(|degree| degree > 0)
    }));
    assert_eq!(
        result,
        runtime.get_architecture(&scope(), 1, 20).unwrap(),
        "symbol communities must be byte-stable for the same snapshot"
    );
}

#[test]
fn architecture_finds_deterministic_weighted_semantic_communities() {
    let repository = TestDirectory::new("architecture-semantic-communities-repository");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    let files = [
        (
            "api/main.ts",
            "import { coreA, coreB, coreC } from '../core/main';\nexport function api() { coreA(); coreB(); coreC(); }\n",
        ),
        (
            "core/main.ts",
            "import { api } from '../api/main';\nimport type { StorageModel } from '../storage/model';\nexport function coreA() { api(); }\nexport function coreB() { api(); }\nexport function coreC() { api(); }\nexport type Bridge = StorageModel;\n",
        ),
        (
            "storage/model.ts",
            "import { workerA, workerB, workerC } from '../worker/main';\nexport interface StorageModel { id: string }\nexport function storage() { workerA(); workerB(); workerC(); }\n",
        ),
        (
            "worker/main.ts",
            "import { storage } from '../storage/model';\nexport function workerA() { storage(); }\nexport function workerB() { storage(); }\nexport function workerC() { storage(); }\n",
        ),
    ];
    for (path, source) in files {
        let path = repository.path().join(path);
        fs::create_dir_all(path.parent().unwrap()).expect("create source parent");
        fs::write(path, source).expect("write source");
    }
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("architecture-semantic-communities-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let result = runtime.get_architecture(&scope(), 1, 20).unwrap();
    let communities = result["communities"]
        .as_array()
        .unwrap()
        .iter()
        .map(|community| community["packages"].clone())
        .collect::<Vec<_>>();
    assert_eq!(
        communities,
        vec![
            serde_json::json!(["api", "core"]),
            serde_json::json!(["storage", "worker"]),
        ]
    );
    assert_eq!(
        result["community_detection"]["method"],
        "DETERMINISTIC_WEIGHTED_MODULARITY"
    );
    assert!(
        result["community_detection"]["modularity"]
            .as_f64()
            .is_some_and(|value| value > 0.0)
    );
    assert!(
        result["community_detection"]["iterations"]
            .as_u64()
            .is_some_and(|value| value > 0)
    );
    assert_eq!(result["communities"][0]["internal_weight"], 28);
    assert_eq!(result["communities"][0]["cut_weight"], 3);
    assert!(
        result["communities"][0]["cohesion"]
            .as_f64()
            .is_some_and(|value| value > 0.8)
    );
    assert_eq!(
        result,
        runtime.get_architecture(&scope(), 1, 20).unwrap(),
        "community detection must be byte-stable for the same snapshot"
    );
}

#[test]
fn architecture_plans_high_fan_in_hotspot_futures_without_a_model() {
    let repository = TestDirectory::new("architecture-hotspot-planner-repository");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::create_dir_all(repository.path().join("core")).unwrap();
    fs::create_dir_all(repository.path().join("callers")).unwrap();
    fs::write(
        repository.path().join("core/hot.ts"),
        "export function hot() { return 1; }\n",
    )
    .unwrap();
    for index in 0..5 {
        fs::write(
            repository.path().join(format!("callers/c{index}.ts")),
            format!(
                "import {{ hot }} from '../core/hot';\nexport function caller{index}() {{ return hot(); }}\n"
            ),
        )
        .unwrap();
    }
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("architecture-hotspot-planner-state");
    Runtime::index(repository.path(), state.path()).unwrap();
    let runtime = Runtime::open(state.path()).unwrap();

    let result = runtime.get_architecture(&scope(), 1, 20).unwrap();
    let issues = result["architecture_plan"]["issues"].as_array().unwrap();
    assert_eq!(issues.len(), 1);
    assert_eq!(issues[0]["kind"], "HIGH_FAN_IN_HOTSPOT");
    assert_eq!(issues[0]["symbol"]["symbol"], "hot");
    assert_eq!(issues[0]["symbol"]["fan_in"], 5);
    assert_eq!(issues[0]["strategies"][0]["policy"], "introduce_facade");
    assert_eq!(issues[0]["strategies"][0]["recommended"], true);
    assert_eq!(issues[0]["agent_handoff"]["llm_used"], false);
    assert_eq!(result["architecture_plan"]["totals"]["future_graphs"], 3);
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
fn architecture_proves_used_local_references_for_every_supported_language() {
    let repository = TestDirectory::new("architecture-references-repository");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    let files = [
        (
            "typescript/api/main.ts",
            "import type { Model } from '../model';\nimport type { External } from 'external';\nexport type LocalAlias = Model;\nexport type ExternalAlias = External;\n",
        ),
        (
            "typescript/model/index.ts",
            "export interface Model { id: number }\n",
        ),
        (
            "typescript/ambiguous_api/main.ts",
            "import { Thing } from '../ambiguous/thing';\nexport type Alias = Thing;\n",
        ),
        (
            "typescript/ambiguous/thing.ts",
            "export interface Thing { id: number }\n",
        ),
        (
            "typescript/ambiguous/thing/index.ts",
            "export interface Thing { id: string }\n",
        ),
        ("go.mod", "module example.com/cgrxfixture\n\ngo 1.23\n"),
        (
            "go_api/main.go",
            "package go_api\nimport (\n    \"example.com/cgrxfixture/go_model\"\n    \"fmt\"\n)\ntype Local struct { Value go_model.Model }\ntype External struct { Value fmt.Stringer }\n",
        ),
        (
            "go_model/model.go",
            "package go_model\ntype Model struct{}\n",
        ),
        (
            "python/api/main.py",
            "import python.model as model\nimport os\ndef local(value: model.Model):\n    return value\ndef external(value: os.PathLike):\n    return value\n",
        ),
        ("python/model.py", "class Model:\n    pass\n"),
        ("Cargo.toml", "[package]\nname='fixture'\nversion='0.1.0'\n"),
        ("src/lib.rs", "pub mod api;\npub mod model;\n"),
        (
            "src/api/mod.rs",
            "pub type Local = crate::model::Model;\npub fn external<T: serde::Serialize>(value: T) -> T { value }\n",
        ),
        ("src/model/mod.rs", "pub struct Model;\n"),
    ];
    for (path, source) in files {
        let path = repository.path().join(path);
        fs::create_dir_all(path.parent().unwrap()).expect("create source parent");
        fs::write(path, source).expect("write source");
    }
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("architecture-references-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let mut runtime = Runtime::open(state.path()).expect("open runtime");

    let result = runtime.get_architecture(&scope(), 2, 100).unwrap();
    let references = result["boundaries"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|row| {
            row["relations"]
                .as_array()
                .unwrap()
                .iter()
                .any(|kind| kind == "REFERENCES")
        })
        .map(|row| {
            (
                row["source"].as_str().unwrap(),
                row["target"].as_str().unwrap(),
            )
        })
        .collect::<std::collections::BTreeSet<_>>();
    assert_eq!(
        references,
        std::collections::BTreeSet::from([
            ("go_api", "go_model"),
            ("python/api", "python"),
            ("src/api", "src/model"),
            ("typescript/api", "typescript/model"),
        ])
    );
    assert_eq!(result["reference_resolution"]["proven"], 4);
    assert_eq!(result["reference_resolution"]["external"], 4);
    assert_eq!(result["reference_resolution"]["unresolved_local"], 1);
    assert!(
        result["coverage_gaps"]
            .as_array()
            .unwrap()
            .iter()
            .any(|gap| {
                gap["code"] == "UNRESOLVED_LOCAL_REFERENCE"
                    && gap["path"] == "typescript/ambiguous_api/main.ts"
            })
    );
    assert!(
        !references
            .iter()
            .any(|(source, _)| *source == "typescript/ambiguous_api")
    );
    assert_eq!(
        result["relation_kinds"],
        serde_json::json!(["CALLS", "IMPLEMENTS", "IMPORTS", "REFERENCES"])
    );

    fs::create_dir_all(repository.path().join("typescript/other")).unwrap();
    fs::write(
        repository.path().join("typescript/other/index.ts"),
        "export interface Model { name: string }\n",
    )
    .unwrap();
    fs::write(
        repository.path().join("typescript/api/main.ts"),
        "import { Model } from '../other';\nexport type LocalAlias = Model;\n",
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
                        .any(|kind| kind == "REFERENCES")
            })
    );
    assert!(
        !refreshed["boundaries"]
            .as_array()
            .unwrap()
            .iter()
            .any(|row| {
                row["source"] == "typescript/api"
                    && row["target"] == "typescript/model"
                    && row["relations"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .any(|kind| kind == "REFERENCES")
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
