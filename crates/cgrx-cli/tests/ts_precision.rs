use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};
use cgrx_languages::{RelationKind as LanguageRelation, UnresolvedKind, pack_for_path};
use serde_json::Value;
use std::{fs, path::Path, process::Command};

static SEQUENCE: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);

fn trace(source: &str) -> Value {
    let root = std::env::temp_dir().join(format!(
        "cgrx-ts-precision-{}-{}",
        std::process::id(),
        SEQUENCE.fetch_add(1, std::sync::atomic::Ordering::Relaxed)
    ));
    fs::create_dir_all(&root).unwrap();
    struct Cleanup(std::path::PathBuf);
    impl Drop for Cleanup {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    let _cleanup = Cleanup(root.clone());
    fs::write(root.join("main.ts"), source).unwrap();
    // The imported package is external; this unrelated function must never win
    // merely because it is the only repository symbol with the local alias.
    fs::write(root.join("decoy.ts"), "export function invoke() {}").unwrap();
    assert!(
        Command::new("git")
            .args(["init", "-q"])
            .current_dir(&root)
            .status()
            .unwrap()
            .success()
    );
    for args in [
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
    let state = root.join(".state");
    Runtime::index(&root, &state).unwrap();
    Runtime::open(&state)
        .unwrap()
        .trace_path(
            "caller",
            Some("main.ts"),
            "callees",
            1,
            &Scope {
                include: vec![],
                exclude: vec![],
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 2,
            },
            20,
        )
        .unwrap()
}

#[test]
fn imported_alias_never_resolves_to_unrelated_same_name() {
    let result = trace(
        "import { remote as invoke } from 'external'; export function caller() { invoke(); }",
    );
    assert_eq!(result["total"], 0, "{result}");
}

#[test]
fn import_binding_forms_remain_explicit_dispatch_gaps() {
    for import in [
        "import { invoke } from 'external';",
        "import { remote as invoke } from 'external';",
        "import { 'remote-name' as invoke } from 'external';",
        "import invoke from 'external';",
        "import * as invoke from 'external';",
        "import invoke = require('external');",
        "import type { invoke } from 'external';",
        "import { type invoke } from 'external';",
        "import invoke, { other } from 'external';",
    ] {
        for extension in ["ts", "tsx"] {
            let source = format!("{import} function caller() {{ invoke(); }}");
            let path = format!("main.{extension}");
            let extraction = pack_for_path(Path::new(&path))
                .unwrap()
                .extract(Path::new(&path), source.as_bytes())
                .unwrap();
            assert!(
                !extraction
                    .edges
                    .iter()
                    .any(|e| e.relation == LanguageRelation::Calls),
                "{source}: {:?}",
                extraction.edges
            );
            assert!(
                extraction
                    .unresolved
                    .iter()
                    .any(|g| g.kind == UnresolvedKind::Dispatch),
                "{source}: {:?}",
                extraction.unresolved
            );
        }
    }
}

#[test]
fn parameter_shadow_does_not_resolve_import_or_decoy() {
    let result = trace(
        "import { remote as invoke } from 'external'; function caller(invoke: () => void) { invoke(); }",
    );
    assert_eq!(result["total"], 0, "{result}");
}

#[test]
fn local_arrow_shadow_retains_exact_lexical_target() {
    let source = "import { remote as invoke } from 'external'; function caller() { const invoke = () => 1; invoke(); }";
    let result = trace(source);
    assert_eq!(result["total"], 1, "{result}");
    assert_eq!(result["nodes"][0]["path"], "main.ts");
    assert_eq!(
        result["nodes"][0]["span"]["start"],
        source.find("invoke =").unwrap()
    );
}

#[test]
fn aliased_import_does_not_bind_exported_name() {
    let result = trace(
        "import { invoke as other } from 'external'; function invoke() {} function caller() { invoke(); }",
    );
    assert_eq!(result["total"], 1, "{result}");
    assert_eq!(result["nodes"][0]["path"], "main.ts");
}

#[test]
fn side_effect_import_does_not_block_local_function() {
    let result = trace("import 'external'; function invoke() {} function caller() { invoke(); }");
    assert_eq!(result["total"], 1, "{result}");
    assert_eq!(result["nodes"][0]["path"], "main.ts");
}

#[test]
fn import_and_same_scope_declaration_collision_is_not_proof() {
    let result = trace(
        "import { invoke } from 'external'; function invoke() {} function caller() { invoke(); }",
    );
    assert_eq!(result["total"], 0, "{result}");
}

#[test]
fn relative_import_preserves_existing_cross_file_relationship() {
    // Compatibility regression, not proof of exact module/export resolution:
    // the existing runtime still uses name matching for relative imports.
    let result = trace("import { invoke } from './decoy'; export function caller() { invoke(); }");
    assert_eq!(result["total"], 1, "{result}");
    assert_eq!(result["nodes"][0]["symbol"], "invoke");
    assert_eq!(result["nodes"][0]["path"], "decoy.ts");
}

#[test]
fn relative_import_forms_preserve_existing_syntax_candidates() {
    for import in [
        "import { invoke } from './target';",
        "import { invoke } from \"../target\";",
        "import { remote as invoke } from './target';",
        "import invoke from './target';",
        "import invoke = require('../target');",
    ] {
        let source = format!("{import} function caller() {{ invoke(); }}");
        let path = Path::new("main.ts");
        let extraction = pack_for_path(path)
            .unwrap()
            .extract(path, source.as_bytes())
            .unwrap();
        assert!(
            extraction
                .edges
                .iter()
                .any(|e| e.relation == LanguageRelation::Calls && e.target == "invoke"),
            "{source}: {:?}",
            extraction
        );
    }
}
