use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};
use cgrx_store::GenerationReader;
use std::{
    fs,
    os::unix::fs::PermissionsExt,
    os::unix::fs::symlink,
    path::PathBuf,
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};
static ID: AtomicU64 = AtomicU64::new(0);
struct Fixture {
    root: PathBuf,
    state: PathBuf,
    runtime: Runtime,
}
impl Fixture {
    fn new(files: &[(&str, &str)]) -> Self {
        let base = std::env::temp_dir().join(format!(
            "cgrx-import-runtime-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        ));
        let root = base.join("repo");
        let state = base.join("state");
        fs::create_dir_all(&root).unwrap();
        for (p, s) in files {
            let p = root.join(p);
            fs::create_dir_all(p.parent().unwrap()).unwrap();
            fs::write(p, s).unwrap();
        }
        for args in [
            vec!["init", "-q"],
            vec!["add", "."],
            vec![
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-qm",
                "fixture",
            ],
        ] {
            assert!(
                Command::new("git")
                    .args(args)
                    .current_dir(&root)
                    .status()
                    .unwrap()
                    .success()
            );
        }
        Runtime::index(&root, &state).unwrap();
        let runtime = Runtime::open(&state).unwrap();
        Self {
            root,
            state,
            runtime,
        }
    }
    fn trace(&self) -> serde_json::Value {
        let r = self
            .runtime
            .trace_path(
                "caller",
                Some("main.ts"),
                "callees",
                1,
                &Scope {
                    include: vec![],
                    exclude: vec![],
                    relation_kinds: vec![RelationKind::Calls],
                    max_depth: 1,
                },
                20,
            )
            .unwrap();
        assert_eq!(r["truncated"], false);
        r
    }
    fn targets(&self) -> Vec<String> {
        self.trace()["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .map(|n| n["path"].as_str().unwrap().to_string())
            .collect()
    }
    fn refresh(&mut self) {
        self.runtime.refresh(&self.root).unwrap();
    }
    fn stored(&self) -> serde_json::Value {
        let reader = GenerationReader::open_current(&self.state).unwrap();
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap()
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(self.root.parent().unwrap());
    }
}
#[test]
fn imported_alias_uses_export_identity_not_decoy_and_reopens() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { target as invoke } from './worker'; export function caller() { invoke(); }",
        ),
        ("worker.ts", "export function target() {}"),
        ("decoy.ts", "export function invoke() {}"),
    ]);
    let trace = f.trace();
    assert_eq!(f.targets(), ["worker.ts"]);
    let target = &trace["nodes"][0];
    let expected = "export function target() {}".find("target").unwrap();
    assert_eq!(target["span"]["start"], expected);
    assert_eq!(target["span"]["end"], expected + "target".len());
    let stored = f.stored();
    assert_eq!(
        stored["ts_files"]["main.ts"]["source_hash"],
        stored["path_hashes"]["main.ts"]
    );
    let call_start =
        "import { target as invoke } from './worker'; export function caller() { invoke(); }"
            .find("invoke();")
            .unwrap();
    let arc = stored["arcs"]
        .as_array()
        .unwrap()
        .iter()
        .find(|arc| arc["evidence"]["path"] == "main.ts")
        .unwrap();
    assert_eq!(arc["evidence"]["span"]["start"], call_start);
    assert_eq!(
        arc["evidence"]["span"]["end"],
        call_start + "invoke()".len()
    );
    f.runtime = Runtime::open(&f.state).unwrap();
    assert_eq!(f.targets(), ["worker.ts"]);
}
#[test]
fn unexported_and_duplicate_imports_never_fall_back() {
    for source in [
        "import { target } from './worker'; function caller(){ target(); }",
        "import { target } from './worker'; import { target } from './other'; function caller(){ target(); }",
    ] {
        let f = Fixture::new(&[
            ("main.ts", source),
            ("worker.ts", "function target() {}"),
            ("other.ts", "export function target() {}"),
        ]);
        assert!(f.targets().is_empty());
    }
}
#[test]
fn barrel_refresh_retargets_without_changing_caller() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { target as invoke } from './api'; function caller(){ invoke(); }",
        ),
        ("api/index.ts", "export { target } from '../one';"),
        ("one.ts", "export function target() {}"),
        ("two.ts", "export function target() {}"),
    ]);
    assert_eq!(f.targets(), ["one.ts"]);
    fs::write(
        f.root.join("api/index.ts"),
        "export { target } from '../two';",
    )
    .unwrap();
    f.refresh();
    assert_eq!(f.targets(), ["two.ts"]);
}
#[test]
fn competitor_add_delete_invalidates_target() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './worker'; function caller(){ target(); }",
        ),
        ("worker.ts", "export function target() {}"),
    ]);
    assert_eq!(f.targets(), ["worker.ts"]);
    for relative in ["worker.js", "worker.jsx", "worker.d.ts", "worker/index.ts"] {
        let path = f.root.join(relative);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(&path, "export function target() {}").unwrap();
        f.refresh();
        assert!(f.targets().is_empty(), "competitor {relative}");
        assert!(f.trace()["coverage_gap_count"].as_u64().unwrap() > 0);
        fs::remove_file(path).unwrap();
        f.refresh();
        assert_eq!(f.targets(), ["worker.ts"], "removed {relative}");
    }
    fs::create_dir_all(f.root.join("worker")).unwrap();
    fs::write(f.root.join("worker/package.json"), "{}").unwrap();
    f.refresh();
    assert!(f.targets().is_empty(), "package metadata competitor");
    fs::remove_file(f.root.join("worker/package.json")).unwrap();
    f.refresh();
    assert_eq!(f.targets(), ["worker.ts"]);
    symlink("worker.ts", f.root.join("worker.js")).unwrap();
    f.refresh();
    assert!(f.targets().is_empty(), "symlink competitor");
    fs::remove_file(f.root.join("worker.js")).unwrap();
    f.refresh();
    assert_eq!(f.targets(), ["worker.ts"]);
}
#[test]
fn custom_resolution_configuration_fails_closed() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './worker'; function caller(){ target(); }",
        ),
        ("worker.ts", "export function target() {}"),
        (
            "tsconfig.json",
            "{\"compilerOptions\":{\"moduleSuffixes\":[\".native\"]}}",
        ),
    ]);
    assert!(f.targets().is_empty());
    fs::remove_file(f.root.join("tsconfig.json")).unwrap();
    f.refresh();
    assert_eq!(f.targets(), ["worker.ts"]);
}

#[test]
fn inherited_or_referenced_configuration_fails_closed() {
    for config in [
        "{\"extends\":\"./base.json\"}",
        "{\"references\":[{\"path\":\"./other\"}]}",
    ] {
        let f = Fixture::new(&[
            (
                "main.ts",
                "import { target } from './worker'; function caller(){ target(); }",
            ),
            ("worker.ts", "export function target() {}"),
            ("tsconfig.json", config),
        ]);
        assert!(f.targets().is_empty(), "configuration {config}");
    }
}
#[test]
fn local_function_shadow_stays_local() {
    let f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './worker'; function caller(){ function target(){} target(); }",
        ),
        ("worker.ts", "export function target() {}"),
    ]);
    assert_eq!(f.targets(), ["main.ts"]);
}

#[test]
fn rejected_target_reindexes_to_exact_without_name_fallback() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './worker'; function caller(){ target(); }",
        ),
        ("worker.ts", "function target() {}"),
        ("decoy.ts", "export function target() {}"),
    ]);
    assert!(f.targets().is_empty());
    fs::write(f.root.join("worker.ts"), "export function target() {}").unwrap();
    f.refresh();
    assert_eq!(f.targets(), ["worker.ts"]);
}

#[test]
fn ignored_competitor_add_delete_invalidates_target() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './worker'; function caller(){ target(); }",
        ),
        ("worker.ts", "export function target() {}"),
        (".gitignore", "worker.js\n"),
    ]);
    assert_eq!(f.targets(), ["worker.ts"]);
    fs::write(f.root.join("worker.js"), "export function target() {}").unwrap();
    f.refresh();
    assert!(f.targets().is_empty());
    fs::remove_file(f.root.join("worker.js")).unwrap();
    f.refresh();
    assert_eq!(f.targets(), ["worker.ts"]);
}

#[test]
fn ignored_barrel_dependency_competitor_invalidates_target() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './api'; function caller(){ target(); }",
        ),
        ("api/index.ts", "export { target } from '../worker';"),
        ("worker.ts", "export function target() {}"),
        (".gitignore", "worker.js\n"),
    ]);
    assert_eq!(f.targets(), ["worker.ts"]);
    fs::write(f.root.join("worker.js"), "export function target() {}").unwrap();
    f.refresh();
    assert!(f.targets().is_empty());
}

#[test]
fn ignored_barrel_inventory_closes_before_first_resolution_and_after_retarget() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './api'; function caller(){ target(); }",
        ),
        ("worker.ts", "export function target() {}"),
        ("other.ts", "export function target() {}"),
        ("api/index.ts", "export { target } from '../worker';"),
        ("worker.js", "export function target() {}"),
        (".gitignore", "api/index.ts\nworker.js\nother.js\n"),
    ]);
    assert!(f.targets().is_empty());
    fs::remove_file(f.root.join("worker.js")).unwrap();
    f.refresh();
    assert!(f.targets().is_empty(), "ignored barrels are presence-only");
    fs::write(
        f.root.join("api/index.ts"),
        "export { target } from '../other';",
    )
    .unwrap();
    fs::write(f.root.join("other.js"), "export function target() {}").unwrap();
    f.refresh();
    assert!(f.targets().is_empty());
}

#[test]
fn unrelated_case_collision_does_not_block_exact_import() {
    let f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './worker'; function caller(){ target(); }",
        ),
        ("worker.ts", "export function target() {}"),
        ("other/Foo.ts", "export function upper() {}"),
        ("other/foo.ts", "export function lower() {}"),
    ]);
    assert_eq!(f.targets(), ["worker.ts"]);
}

#[test]
fn barrel_dependency_custom_config_fails_closed() {
    let f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './api'; function caller(){ target(); }",
        ),
        ("api/index.ts", "export { target } from '../worker';"),
        (
            "api/tsconfig.json",
            "{\"compilerOptions\":{\"rootDirs\":[\".\",\"../generated\"]}}",
        ),
        ("worker.ts", "export function target() {}"),
    ]);
    assert!(f.targets().is_empty());
}

#[test]
fn symlinked_ancestor_never_proves_a_target() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './api'; function caller(){ target(); }",
        ),
        ("api/index.ts", "export function target() {}"),
    ]);
    assert_eq!(f.targets(), ["api/index.ts"]);
    fs::rename(f.root.join("api"), f.root.join("real_api")).unwrap();
    symlink("real_api", f.root.join("api")).unwrap();
    f.refresh();
    assert!(f.targets().is_empty());
}

#[test]
fn symlinked_caller_never_rebinds_local_repository_identity() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './worker'; function caller(){ target(); }",
        ),
        ("worker.ts", "export function target() {}"),
    ]);
    assert_eq!(f.targets(), ["worker.ts"]);
    fs::rename(f.root.join("main.ts"), f.root.join("real_main.ts")).unwrap();
    symlink("real_main.ts", f.root.join("main.ts")).unwrap();
    f.refresh();
    let error = f
        .runtime
        .trace_path(
            "caller",
            Some("main.ts"),
            "callees",
            1,
            &Scope {
                include: vec![],
                exclude: vec![],
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 1,
            },
            20,
        )
        .unwrap_err();
    assert_eq!(error.code(), "cgrx.symbol_not_found");
}

#[test]
fn nested_repository_candidate_is_presence_only() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './nested/api'; function caller(){ target(); }",
        ),
        ("worker.ts", "export function target() {}"),
        (".gitignore", "nested/\n"),
    ]);
    assert!(f.targets().is_empty());
    fs::create_dir_all(f.root.join("nested/api")).unwrap();
    fs::create_dir_all(f.root.join("nested/.git")).unwrap();
    fs::write(
        f.root.join("nested/api/index.ts"),
        "export { target } from '../../worker';",
    )
    .unwrap();
    f.refresh();
    assert!(f.targets().is_empty());
}

#[test]
fn ignored_source_promotes_when_git_makes_same_bytes_eligible() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './worker'; function caller(){ target(); }",
        ),
        ("worker.ts", "export function target() {}"),
        (".gitignore", "worker.ts\n"),
    ]);
    assert!(f.targets().is_empty());
    fs::write(f.root.join(".gitignore"), "").unwrap();
    assert!(
        Command::new("git")
            .args(["add", "-f", "worker.ts", ".gitignore"])
            .current_dir(&f.root)
            .status()
            .unwrap()
            .success()
    );
    f.refresh();
    assert_eq!(f.targets(), ["worker.ts"]);
}

#[test]
fn identity_invalidation_and_retry_keep_documents_and_arcs_coherent() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './worker'; function caller(){ target(); }",
        ),
        ("worker.ts", "export function target() {}"),
    ]);
    assert_eq!(f.targets(), ["worker.ts"]);
    fs::write(f.root.join("main.ts"), "function caller() {}").unwrap();
    fs::rename(f.root.join("worker.ts"), f.root.join("real_worker.ts")).unwrap();
    symlink("real_worker.ts", f.root.join("worker.ts")).unwrap();
    f.refresh();
    assert!(f.targets().is_empty());
    fs::remove_file(f.root.join("worker.ts")).unwrap();
    fs::write(f.root.join("worker.ts"), "export function target() {}").unwrap();
    f.refresh();
    assert!(f.targets().is_empty());
    fs::write(
        f.root.join("main.ts"),
        "import { target } from './worker'; function caller(){ target(); }",
    )
    .unwrap();
    f.refresh();
    assert_eq!(f.targets(), ["worker.ts"]);
    assert!(
        f.runtime
            .coverage()
            .stale_paths
            .iter()
            .all(|path| path != "main.ts" && path != "worker.ts")
    );
}

#[test]
fn unreadable_inventory_cannot_preserve_an_old_arc() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from './worker'; function caller(){ target(); }",
        ),
        ("worker.ts", "export function target() {}"),
        (".gitignore", "blocked.js\n"),
    ]);
    assert_eq!(f.targets(), ["worker.ts"]);
    fs::write(
        f.root.join("main.ts"),
        "import { blocked } from './blocked'; function caller() {}",
    )
    .unwrap();
    fs::write(f.root.join("blocked.js"), "export function blocked() {}").unwrap();
    fs::set_permissions(f.root.join("blocked.js"), fs::Permissions::from_mode(0o0)).unwrap();
    assert!(fs::read(f.root.join("blocked.js")).is_err());
    f.refresh();
    assert!(f.targets().is_empty());
    fs::set_permissions(f.root.join("blocked.js"), fs::Permissions::from_mode(0o600)).unwrap();
}
