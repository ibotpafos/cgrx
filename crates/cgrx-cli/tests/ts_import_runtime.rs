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

fn dependency_targets(f: &Fixture, kind: &str) -> Vec<(String, String, String)> {
    let scope = Scope {
        include: vec![],
        exclude: vec![],
        relation_kinds: vec![serde_json::from_value(serde_json::json!(kind)).unwrap()],
        max_depth: 1,
    };
    let graph = f.runtime.repository_graph(&scope, 100, 100).unwrap();
    assert_eq!(graph["truncated"], false);
    let documents: std::collections::BTreeMap<_, _> = graph["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|d| (d["node_id"].as_str().unwrap(), d))
        .collect();
    let mut result: Vec<_> = graph["edges"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|a| a["relation"] == kind && a["evidence"]["path"] == "main.ts")
        .map(|a| {
            let source = documents[a["source"].as_str().unwrap()];
            let target = documents[a["target"].as_str().unwrap()];
            assert_eq!(a["confidence"], "PROVEN");
            assert_eq!(a["evidence"]["resolver"], "SYNTAX_EXACT");
            (
                source["symbol"].as_str().unwrap().to_owned(),
                target["path"].as_str().unwrap().to_owned(),
                target["symbol"].as_str().unwrap().to_owned(),
            )
        })
        .collect();
    result.sort();
    result
}

fn publish_metadata(f: &mut Fixture, mut nodes: serde_json::Value) {
    let reader = GenerationReader::open_current(&f.state).unwrap();
    let mut snapshot = reader.snapshot().clone();
    snapshot.graph_generation += 1;
    nodes["snapshot"] = serde_json::to_value(&snapshot).unwrap();
    let mut writer = cgrx_store::GenerationWriter::begin(&f.state, snapshot).unwrap();
    writer
        .write_segment("nodes.seg", &serde_json::to_vec(&nodes).unwrap())
        .unwrap();
    for name in ["edges.seg", "terms.fst"] {
        writer
            .write_segment(name, &reader.read_segment(name).unwrap())
            .unwrap();
    }
    writer.validate().unwrap();
    writer.publish().unwrap();
    f.runtime = Runtime::open(&f.state).unwrap();
}

#[test]
fn named_dependency_imports_resolve_classes_types_variables_and_defaults_without_call_promotion() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import {Item as Local, type Payload, schema} from './barrel'; import Render from './types'; export function caller() { Local(); schema(); Payload(); Render(); }",
        ),
        (
            "barrel.ts",
            "export {Box as Item, schema} from './types'; export type {Payload} from './types';",
        ),
        (
            "types.ts",
            "export class Box {} export type Payload = string; export const schema = 1; export default function render() {}",
        ),
        (
            "decoy.ts",
            "export function Local() {} export function Payload() {} export function schema() {} export function Render() {}",
        ),
    ]);
    assert_eq!(
        dependency_targets(&f, "IMPORTS"),
        [
            ("Local".into(), "types.ts".into(), "Box".into()),
            ("Payload".into(), "types.ts".into(), "Payload".into()),
            ("Render".into(), "types.ts".into(), "render".into()),
            ("schema".into(), "types.ts".into(), "schema".into()),
        ]
    );
    assert!(f.targets().is_empty());
    let before = dependency_targets(&f, "IMPORTS");
    f.runtime = Runtime::open(&f.state).unwrap();
    assert_eq!(dependency_targets(&f, "IMPORTS"), before);
}

#[test]
fn type_references_have_declaration_owners_exact_targets_and_type_query_namespaces() {
    let f = Fixture::new(&[
        (
            "main.ts",
            "import type {Payload as Local, run} from './types'; export const schema = 1; export type Shape = typeof schema; export type Fn = typeof run; export function caller(Local: number, value: Local) {}",
        ),
        (
            "types.ts",
            "export type Payload = string; export function run() {}",
        ),
        (
            "decoy.ts",
            "export type Local = boolean; export const schema = 2; export function run() {}",
        ),
    ]);
    assert_eq!(
        dependency_targets(&f, "REFERENCES"),
        [
            ("Fn".into(), "types.ts".into(), "run".into()),
            ("Shape".into(), "main.ts".into(), "schema".into()),
            ("caller".into(), "types.ts".into(), "Payload".into()),
        ]
    );
    let stored = f.stored();
    for arc in stored["arcs"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|a| a["kind"] == "REFERENCES")
    {
        let source = stored["documents"]
            .as_array()
            .unwrap()
            .iter()
            .find(|d| d["node_id"] == arc["source"])
            .unwrap();
        assert_eq!(source["provenance"], "SYNTAX");
        assert!(
            source["body_start"].as_u64().unwrap()
                <= arc["evidence"]["span"]["start"].as_u64().unwrap()
        );
        assert!(
            source["body_end"].as_u64().unwrap()
                >= arc["evidence"]["span"]["end"].as_u64().unwrap()
        );
    }
}

#[test]
fn refused_type_reference_sites_never_use_global_fallback_and_expose_owned_gaps() {
    for source in [
        "import type {Payload} from './types'; export function caller<Payload>(x: Payload) {}",
        "import type {Payload} from './types'; export function caller() { type Payload = number; let x: Payload; }",
        "export const schema = 1; export function caller(schema: number) { type Shape = typeof schema; }",
        "export type Payload = string; export type Shape = { [Payload in 'x']: Payload };",
        "type Payload = string; function caller(x: Payload) {}",
        "export type Payload = string; export function caller() { [1].map(function(x: Payload) {}); }",
    ] {
        let f = Fixture::new(&[
            ("main.ts", source),
            ("types.ts", "export type Payload = string;"),
            (
                "decoy.ts",
                "export type Payload = number; export const schema = 2;",
            ),
        ]);
        assert!(dependency_targets(&f, "REFERENCES").is_empty(), "{source}");
        let stored = f.stored();
        let sites = stored["ts_files"]["main.ts"]["facts"]["declaration_facts"]["references"]
            .as_array()
            .unwrap();
        assert!(!sites.is_empty());
        for reference in sites {
            let start = reference["site"][0].as_u64().unwrap();
            let end = reference["site"][1].as_u64().unwrap();
            let location = format!("main.ts:{start}-{end}");
            assert!(
                stored["coverage"]["dynamic_dispatch"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .any(|g| g == &location),
                "{source}: {location}"
            );
        }
    }
}

#[test]
fn dependency_proofs_withdraw_on_export_source_or_resolution_changes_and_restore() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import type {Payload} from './barrel'; export function caller(x: Payload) {}",
        ),
        ("barrel.ts", "export type {Payload} from './types';"),
        ("types.ts", "export type Payload = string;"),
    ]);
    assert_eq!(dependency_targets(&f, "REFERENCES").len(), 1);
    assert_eq!(dependency_targets(&f, "IMPORTS").len(), 1);
    for (file, changed, original) in [
        (
            "types.ts",
            "type Payload = string;",
            "export type Payload = string;",
        ),
        (
            "barrel.ts",
            "export type {Payload} from './missing';",
            "export type {Payload} from './types';",
        ),
        (
            "tsconfig.json",
            "{\"compilerOptions\":{\"moduleSuffixes\":[\".native\",\"\"]}}",
            "{}",
        ),
    ] {
        fs::write(f.root.join(file), changed).unwrap();
        f.refresh();
        assert!(dependency_targets(&f, "REFERENCES").is_empty(), "{file}");
        assert!(dependency_targets(&f, "IMPORTS").is_empty(), "{file}");
        fs::write(f.root.join(file), original).unwrap();
        f.refresh();
        assert_eq!(dependency_targets(&f, "REFERENCES").len(), 1, "{file}");
        assert_eq!(dependency_targets(&f, "IMPORTS").len(), 1, "{file}");
    }
}

#[test]
fn missing_or_hash_mismatched_dependency_ledger_never_retains_a_proven_arc() {
    for missing in [true, false] {
        let mut f = Fixture::new(&[
            (
                "main.ts",
                "import type {Payload} from './types'; export function caller(x: Payload) {}",
            ),
            ("types.ts", "export type Payload = string;"),
        ]);
        let mut stored = f.stored();
        if missing {
            stored["ts_files"]["types.ts"]["facts"]["declaration_facts"] = serde_json::Value::Null;
        } else {
            stored["ts_files"]["types.ts"]["source_hash"] = serde_json::json!("00".repeat(32));
        }
        publish_metadata(&mut f, stored);
        let usages = f
            .runtime
            .find_usages(
                "Payload",
                Some("types.ts"),
                &Scope {
                    include: vec![],
                    exclude: vec![],
                    relation_kinds: vec![RelationKind::References],
                    max_depth: 1,
                },
                1,
                20,
            )
            .unwrap();
        assert!(usages["usages"].as_array().unwrap().is_empty());
        assert!(dependency_targets(&f, "IMPORTS").is_empty());
        // Explicit rebuilding restores an incomplete/corrupted metadata ledger.
        Runtime::index(&f.root, &f.state).unwrap();
        f.runtime = Runtime::open(&f.state).unwrap();
        assert_eq!(dependency_targets(&f, "REFERENCES").len(), 1);
        assert_eq!(dependency_targets(&f, "IMPORTS").len(), 1);
    }
}

#[test]
fn public_import_usages_keep_definition_selection_and_respect_scope_and_relation() {
    for (origin, target, source, destination, name, local) in [
        (
            "main.ts",
            "types.ts",
            "import {Box as Local} from './types'; export {};",
            "export class Box {}",
            "Box",
            "Local",
        ),
        (
            "pkg/main.py",
            "pkg/helper.py",
            "from .helper import target as local\n",
            "def target():\n return 1\n",
            "target",
            "local",
        ),
    ] {
        let f = Fixture::new(&[
            (origin, source),
            (target, destination),
            ("pkg/__init__.py", ""),
        ]);
        let scope = Scope {
            include: vec![],
            exclude: vec![],
            relation_kinds: vec![RelationKind::Imports],
            max_depth: 1,
        };
        let usages = f
            .runtime
            .find_usages(name, Some(target), &scope, 1, 20)
            .unwrap();
        assert_eq!(usages["target"]["symbol"], name);
        assert_eq!(usages["total"], 1);
        assert_eq!(usages["usages"][0]["source"]["symbol"], local);
        assert_eq!(usages["usages"][0]["site"]["path"], origin);
        assert_eq!(usages["usages"][0]["relation"], "IMPORTS");
        assert!(usages["usages"][0]["source"]["symbol_ref"].is_null());
        let outline = f.runtime.get_outline(origin, 20).unwrap();
        assert_eq!(outline["imports"][0]["local"], local);
        assert_eq!(outline["imports"][0]["target"]["symbol"], name);
        assert_eq!(outline["total_imports"], 1);
        let calls = f
            .runtime
            .find_usages(
                name,
                Some(target),
                &Scope {
                    relation_kinds: vec![RelationKind::Calls],
                    ..scope.clone()
                },
                1,
                20,
            )
            .unwrap();
        assert_eq!(calls["total"], 0);
        let hidden = f
            .runtime
            .find_usages(
                name,
                Some(target),
                &Scope {
                    exclude: vec![origin.into()],
                    ..scope
                },
                1,
                20,
            )
            .unwrap();
        assert_eq!(hidden["total"], 0);
    }
}

#[test]
fn stale_competing_module_or_ambient_augmentation_never_supplies_unique_dependency_proof() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import {Box} from './types'; export function caller(x: Box) {}",
        ),
        ("types.ts", "export class Box {}"),
        ("types.tsx", "export class Box {}"),
    ]);
    assert!(dependency_targets(&f, "IMPORTS").is_empty());
    let mut stored = f.stored();
    stored["ts_files"]["types.tsx"]["source_hash"] = serde_json::json!("00".repeat(32));
    publish_metadata(&mut f, stored);
    assert!(dependency_targets(&f, "IMPORTS").is_empty());
    assert!(dependency_targets(&f, "REFERENCES").is_empty());
    fs::remove_file(f.root.join("types.tsx")).unwrap();
    f.refresh();
    assert_eq!(dependency_targets(&f, "IMPORTS").len(), 1);
    fs::write(
        f.root.join("augmentation.ts"),
        "export {}; declare module './types' { interface Box { extra: number } }",
    )
    .unwrap();
    f.refresh();
    assert!(dependency_targets(&f, "IMPORTS").is_empty());
    assert!(dependency_targets(&f, "REFERENCES").is_empty());
    fs::remove_file(f.root.join("augmentation.ts")).unwrap();
    f.refresh();
    assert_eq!(dependency_targets(&f, "IMPORTS").len(), 1);
    assert_eq!(dependency_targets(&f, "REFERENCES").len(), 1);
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
        .find(|arc| arc["kind"] == "CALLS" && arc["evidence"]["path"] == "main.ts")
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
fn imported_constructor_parameter_property_receiver_resolves_exact_method() {
    let mut f = Fixture::new(&[
        (
            "main.ts",
            "import { ChatService } from './chat.service'; class Controller { constructor(private readonly chat: ChatService) {} caller() { this.chat.getRooms(); } }",
        ),
        (
            "chat.service.ts",
            "export class ChatService { getRooms() {} }",
        ),
        ("decoy.ts", "export class Decoy { getRooms() {} }"),
    ]);
    let trace = f.trace();
    assert_eq!(f.targets(), ["chat.service.ts"]);
    assert_eq!(trace["nodes"][0]["symbol"], "getRooms");
    f.runtime = Runtime::open(&f.state).unwrap();
    assert_eq!(f.targets(), ["chat.service.ts"]);
}

#[test]
fn decorated_async_controller_receiver_resolves_exact_method() {
    let f = Fixture::new(&[
        (
            "tsconfig.base.json",
            r#"{"compilerOptions":{"strict":true,"resolveJsonModule":true}}"#,
        ),
        (
            "tsconfig.json",
            r#"{"extends":"./tsconfig.base.json","compilerOptions":{"declaration":true,"emitDecoratorMetadata":true,"experimentalDecorators":true,"module":"commonjs","moduleResolution":"node","outDir":"dist","target":"es2022"}}"#,
        ),
        (
            "main.ts",
            "import { Controller, Get, Req } from '@nestjs/common'; import { ChatService } from './chat.service'; import type { Request } from 'express'; @Controller('chat') export class ChatController { constructor(private readonly chat: ChatService) {} @Get('rooms') async caller(@Req() request: Request) { return this.chat.getRooms(request); } }",
        ),
        (
            "chat.service.ts",
            "export class ChatService { async getRooms(request: unknown) {} }",
        ),
    ]);
    assert_eq!(f.targets(), ["chat.service.ts"]);
    let documents = f.stored()["documents"].as_array().unwrap().clone();
    let receiver_documents: Vec<_> = documents
        .iter()
        .filter(|document| {
            document["path"] == "main.ts"
                && document["provenance"] == "CALLS"
                && document["text"]
                    .as_str()
                    .is_some_and(|text| text.contains("this.chat.getRooms"))
        })
        .collect();
    assert_eq!(receiver_documents.len(), 1);
    assert_eq!(receiver_documents[0]["qualified_name"], "getRooms");
}

#[test]
fn mutable_or_non_property_constructor_parameters_do_not_prove_receiver() {
    for constructor in [
        "constructor(private chat: ChatService) {}",
        "constructor(chat: ChatService) {}",
        "constructor(private chat: readonly ChatService[]) {}",
        "constructor(private readonly chat: ChatService | null) {}",
    ] {
        let f = Fixture::new(&[
            (
                "main.ts",
                &format!(
                    "import {{ ChatService }} from './chat.service'; class Controller {{ {constructor} caller() {{ this.chat.getRooms(); }} }}"
                ),
            ),
            (
                "chat.service.ts",
                "export class ChatService { getRooms() {} }",
            ),
        ]);
        assert!(f.targets().is_empty(), "{constructor}");
    }
}

#[test]
fn nested_regular_function_does_not_inherit_parameter_property_receiver() {
    let f = Fixture::new(&[
        (
            "main.ts",
            "import { ChatService } from './chat.service'; class Controller { constructor(private readonly chat: ChatService) {} caller() { function nested() { this.chat.getRooms(); } nested(); } }",
        ),
        (
            "chat.service.ts",
            "export class ChatService { getRooms() {} }",
        ),
    ]);
    assert!(f.targets().iter().all(|path| path != "chat.service.ts"));
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
fn local_module_references_do_not_require_module_resolution_or_merge_global_names() {
    let f = Fixture::new(&[
        (
            "main.ts",
            "import {Box} from './types'; export class Window {} export function caller(value: Window, box: Box) {}",
        ),
        ("types.ts", "export class Box {}"),
        (
            "augment.ts",
            "export {}; declare global { interface Window { localExtra: string } }",
        ),
        (
            "tsconfig.json",
            "{\"references\":[{\"path\":\"./tsconfig.node.json\"}],\"compilerOptions\":{\"resolveJsonModule\":true}}",
        ),
    ]);
    assert!(dependency_targets(&f, "IMPORTS").is_empty());
    assert_eq!(
        dependency_targets(&f, "REFERENCES"),
        [("caller".into(), "main.ts".into(), "Window".into())]
    );
    let stored = f.stored();
    assert_eq!(
        stored["ts_resolution_configs"]["tsconfig.json"]["supported"],
        false
    );
}

#[test]
fn typescript_constructor_resolves_exact_class() {
    let f = Fixture::new(&[
        (
            "main.ts",
            "function caller() { new Service(); } class Service { run() { 1 } }",
        ),
        ("service.ts", "export class Decoy {}"),
        ("decoy.ts", "export class Decoy {}"),
    ]);
    let trace = f.trace();
    assert_eq!(f.targets(), ["main.ts"]);
    let node = &trace["nodes"][0];
    assert_eq!(node["symbol"], "Service");
}

#[test]
fn typescript_constructor_no_target_when_multiple_classes() {
    let f = Fixture::new(&[
        (
            "main.ts",
            "import { Service } from './service'; function caller() { new Service(); }",
        ),
        ("service.ts", "export class Service {}"),
        ("another.ts", "export class Another {}"),
    ]);
    assert!(f.targets().is_empty());
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

fn gd_alias_fixture() -> Fixture {
    Fixture::new(&[
        (
            "package.json",
            r#"{"workspaces":["apps/CRM","packages/*"],"devDependencies":{"@repo/tsconfig":"workspace:*"}}"#,
        ),
        (
            "packages/tsconfig/package.json",
            r#"{"name":"@repo/tsconfig","exports":{"./nextjs.json":"./nextjs.json","./base.json":"./base.json"}}"#,
        ),
        (
            "packages/tsconfig/base.json",
            r#"{"compilerOptions":{"module":"esnext","moduleResolution":"bundler","resolveJsonModule":true}}"#,
        ),
        (
            "packages/tsconfig/nextjs.json",
            r#"{"extends":"./base.json","compilerOptions":{"allowJs":true,"noEmit":true}}"#,
        ),
        (
            "apps/CRM/tsconfig.json",
            r#"{"extends":"@repo/tsconfig/nextjs.json","compilerOptions":{"baseUrl":".","paths":{"@/*":["./*"]}}}"#,
        ),
        (
            "apps/CRM/main.ts",
            "import { parseTimeValueToMinutes } from '@/utils/time.utils'; function buildSlotInstant(){ return parseTimeValueToMinutes('12:00'); }",
        ),
        (
            "apps/CRM/utils/time.utils.ts",
            "export function parseTimeValueToMinutes(value: string){ return value.length; }",
        ),
        (
            "decoy.ts",
            "export function parseTimeValueToMinutes(){ return 99; }",
        ),
    ])
}
fn gd_targets(f: &Fixture) -> Vec<String> {
    f.runtime
        .trace_path(
            "buildSlotInstant",
            Some("apps/CRM/main.ts"),
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
        .unwrap()["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|n| n["path"].as_str().unwrap().to_owned())
        .collect()
}
#[test]
fn gd_config_alias_workspace_chain_exact_identity() {
    let mut f = gd_alias_fixture();
    assert_eq!(gd_targets(&f), ["apps/CRM/utils/time.utils.ts"]);
    f.runtime = Runtime::open(&f.state).unwrap();
    assert_eq!(gd_targets(&f), ["apps/CRM/utils/time.utils.ts"]);
}

#[test]
fn gd_config_alias_retarget_delete_and_hash_dependencies() {
    let mut f = gd_alias_fixture();
    let stored = f.stored();
    for p in [
        "package.json",
        "packages/tsconfig/package.json",
        "packages/tsconfig/base.json",
        "packages/tsconfig/nextjs.json",
        "apps/CRM/tsconfig.json",
    ] {
        assert_eq!(
            stored["ts_resolution_configs"]["apps/CRM/tsconfig.json"]["dependencies"][p],
            stored["path_hashes"][p],
            "{p}"
        );
        assert!(!stored["path_hashes"][p].is_null(), "{p}");
    }
    fs::create_dir_all(f.root.join("other/utils")).unwrap();
    fs::write(
        f.root.join("other/utils/time.utils.ts"),
        "export function parseTimeValueToMinutes(s:string){ return 42; }",
    )
    .unwrap();
    fs::write(f.root.join("apps/CRM/tsconfig.json"), r#"{"extends":"@repo/tsconfig/nextjs.json","compilerOptions":{"baseUrl":"../../other","paths":{"@/*":["./*"]}}}"#).unwrap();
    f.refresh();
    assert_eq!(gd_targets(&f), ["other/utils/time.utils.ts"]);
    fs::remove_file(f.root.join("packages/tsconfig/base.json")).unwrap();
    f.refresh();
    assert!(gd_targets(&f).is_empty());
    fs::write(f.root.join("packages/tsconfig/base.json"), "{}").unwrap();
    f.refresh();
    assert_eq!(gd_targets(&f), ["other/utils/time.utils.ts"]);
    fs::remove_file(f.root.join("apps/CRM/tsconfig.json")).unwrap();
    f.refresh();
    assert!(gd_targets(&f).is_empty());
}
#[test]
fn gd_config_alias_competitors_including_ignored_files() {
    let mut f = gd_alias_fixture();
    for suffix in [
        ".tsx",
        ".js",
        ".jsx",
        ".json",
        ".d.ts",
        ".mts",
        ".cts",
        ".mjs",
        ".cjs",
        "/index.ts",
        "/package.json",
    ] {
        let p = format!("apps/CRM/utils/time.utils{suffix}");
        fs::write(f.root.join(".gitignore"), format!("/{p}\n")).unwrap();
        let absolute = f.root.join(&p);
        fs::create_dir_all(absolute.parent().unwrap()).unwrap();
        fs::write(&absolute, "{}").unwrap();
        f.refresh();
        assert!(gd_targets(&f).is_empty(), "competitor {suffix}");
        fs::remove_file(&absolute).unwrap();
        f.refresh();
        assert_eq!(
            gd_targets(&f),
            ["apps/CRM/utils/time.utils.ts"],
            "restore {suffix}"
        );
    }
}
#[test]
fn gd_config_alias_local_shadow_write_and_root_collision() {
    let mut f = gd_alias_fixture();
    for body in [
        "function buildSlotInstant(parseTimeValueToMinutes:()=>number){ return parseTimeValueToMinutes(); }",
        "function buildSlotInstant(){ const parseTimeValueToMinutes = other; return parseTimeValueToMinutes(); }",
        "function buildSlotInstant(){ return parseTimeValueToMinutes('a'); } parseTimeValueToMinutes = other;",
        "const parseTimeValueToMinutes = other; function buildSlotInstant(){ return parseTimeValueToMinutes('a'); }",
    ] {
        fs::write(
            f.root.join("apps/CRM/main.ts"),
            format!("import {{ parseTimeValueToMinutes }} from '@/utils/time.utils'; {body}"),
        )
        .unwrap();
        f.refresh();
        assert!(gd_targets(&f).is_empty(), "{body}");
    }
    fs::write(f.root.join("apps/CRM/main.ts"), "import { parseTimeValueToMinutes } from '@/utils/time.utils'; function buildSlotInstant(){ function parseTimeValueToMinutes(){} return parseTimeValueToMinutes(); }").unwrap();
    f.refresh();
    assert_eq!(gd_targets(&f), ["apps/CRM/main.ts"]);
}
#[test]
fn gd_config_alias_unsupported_inherited_options_fail_closed() {
    let mut f = gd_alias_fixture();
    for config in [
        r#"{"compilerOptions":{"moduleSuffixes":[".native",""]}}"#,
        r#"{"compilerOptions":{"rootDirs":["a","b"]}}"#,
        r#"{"compilerOptions":{"customConditions":["development"]}}"#,
        r#"{"compilerOptions":{"moduleResolution":"nodenext"}}"#,
        r#"{"references":[]}"#,
        r#"{"extends":["./nextjs.json"]}"#,
        r#"{"extends":"./nextjs.json"}"#,
        r#"{"compilerOptions":{"baseUrl":".","baseUrl":"../.."}}"#,
    ] {
        fs::write(f.root.join("packages/tsconfig/base.json"), config).unwrap();
        f.refresh();
        assert!(gd_targets(&f).is_empty(), "{config}");
    }
}
#[test]
fn gd_config_alias_package_export_duplicate_and_mutation() {
    let mut f = gd_alias_fixture();
    let package = f.root.join("packages/tsconfig/package.json");
    for content in [
        r#"{"name":"different","exports":{"./nextjs.json":"./nextjs.json"}}"#,
        r#"{"name":"@repo/tsconfig","exports":{"./nextjs.json":{"default":"./nextjs.json"}}}"#,
        r#"{"name":"@repo/tsconfig","exports":{"./nextjs.json":"../outside.json"}}"#,
        r#"{"name":"@repo/tsconfig","exports":{"./nextjs.json":"./missing.json"}}"#,
        r#"{"name":"@repo/tsconfig","name":"different","exports":{"./nextjs.json":"./nextjs.json"}}"#,
    ] {
        fs::write(&package, content).unwrap();
        f.refresh();
        assert!(gd_targets(&f).is_empty(), "{content}");
    }
    let valid = r#"{"name":"@repo/tsconfig","exports":{"./nextjs.json":"./nextjs.json"}}"#;
    fs::write(&package, valid).unwrap();
    f.refresh();
    assert_eq!(gd_targets(&f), ["apps/CRM/utils/time.utils.ts"]);
    fs::create_dir_all(f.root.join("packages/duplicate")).unwrap();
    fs::write(f.root.join("packages/duplicate/package.json"), valid).unwrap();
    f.refresh();
    assert!(gd_targets(&f).is_empty());
}
#[test]
fn gd_config_alias_symlink_config_dependency_and_candidate() {
    let mut f = gd_alias_fixture();
    for path in [
        "packages/tsconfig/base.json",
        "apps/CRM/tsconfig.json",
        "apps/CRM/utils/time.utils.ts",
    ] {
        let p = f.root.join(path);
        let original = fs::read(&p).unwrap();
        fs::write(f.root.join("copy"), &original).unwrap();
        fs::remove_file(&p).unwrap();
        symlink(f.root.join("copy"), &p).unwrap();
        f.refresh();
        assert!(gd_targets(&f).is_empty(), "{path}");
        fs::remove_file(&p).unwrap();
        fs::write(&p, original).unwrap();
        f.refresh();
        assert_eq!(gd_targets(&f), ["apps/CRM/utils/time.utils.ts"]);
    }
}
#[test]
fn gd_config_alias_inheritance_retains_declaring_origin() {
    let f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from '@/worker'; function caller(){ target(); }",
        ),
        ("tsconfig.json", r#"{"extends":"./config/base.json"}"#),
        (
            "config/base.json",
            r#"{"compilerOptions":{"paths":{"@/*":["./*"]}}}"#,
        ),
        ("config/worker.ts", "export function target() {}"),
        ("worker.ts", "export function target() {}"),
    ]);
    assert_eq!(f.targets(), ["config/worker.ts"]);
    let f = Fixture::new(&[
        (
            "main.ts",
            "import { target } from '@/worker'; function caller(){ target(); }",
        ),
        (
            "tsconfig.json",
            r#"{"extends":"./config/base.json","compilerOptions":{"paths":{"@/*":["./*"]}}}"#,
        ),
        (
            "config/base.json",
            r#"{"compilerOptions":{"baseUrl":"../actual"}}"#,
        ),
        ("actual/worker.ts", "export function target() {}"),
        ("worker.ts", "export function target() {}"),
    ]);
    assert_eq!(f.targets(), ["actual/worker.ts"]);
}
#[test]
fn gd_config_alias_overlapping_and_fallback_mappings_abstain() {
    let mut f = gd_alias_fixture();
    for paths in [
        r#"{"@/*":["./*","../../other/*"]}"#,
        r#"{"@/*":["./*"],"@/utils/*":["./utils/*"]}"#,
    ] {
        fs::write(
            f.root.join("apps/CRM/tsconfig.json"),
            format!(r#"{{"compilerOptions":{{"baseUrl":".","paths":{paths}}}}}"#),
        )
        .unwrap();
        f.refresh();
        assert!(gd_targets(&f).is_empty());
    }
}

#[test]
fn gd_config_alias_noop_refresh_stable_generation() {
    let mut f = gd_alias_fixture();
    // Enter Git's changed-path scan with a dirty but supported config.
    fs::write(f.root.join("apps/CRM/tsconfig.json"), r#"{"extends":"@repo/tsconfig/nextjs.json","compilerOptions":{"baseUrl":".","paths":{"@/*":["./*"]},"strict":true}}"#).unwrap();
    f.refresh();
    let snapshot = f.runtime.snapshot().clone();
    let start = std::time::Instant::now();
    for _ in 0..5 {
        assert!(
            !f.runtime.refresh(&f.root).unwrap(),
            "unchanged dirty config normalized again"
        );
        assert_eq!(&snapshot, f.runtime.snapshot());
        assert_eq!(gd_targets(&f), ["apps/CRM/utils/time.utils.ts"]);
    }
    eprintln!("GD_ALIAS_WARM_REFRESH_5_MS={}", start.elapsed().as_millis());
}

#[test]
fn gd_config_alias_nearer_installed_config_package_abstains() {
    let mut f = gd_alias_fixture();
    let dir = f.root.join("apps/CRM/node_modules/@repo/tsconfig");
    fs::create_dir_all(&dir).unwrap();
    fs::write(dir.join("package.json"), r#"{"name":"@repo/tsconfig"}"#).unwrap();
    f.refresh();
    assert!(gd_targets(&f).is_empty());
    fs::remove_dir_all(&dir).unwrap();
    f.refresh();
    assert_eq!(gd_targets(&f), ["apps/CRM/utils/time.utils.ts"]);
    symlink(f.root.join("packages/tsconfig"), &dir).unwrap();
    f.refresh();
    assert!(gd_targets(&f).is_empty());
}

#[test]
fn gd_config_alias_v18_published_boolean_state_requests_reindex() {
    let f = gd_alias_fixture();
    let reader = GenerationReader::open_current(&f.state).unwrap();
    let mut snapshot = reader.snapshot().clone();
    snapshot.graph_generation += 1;
    let mut nodes = f.stored();
    nodes["snapshot"] = serde_json::to_value(&snapshot).unwrap();
    nodes["extraction_revision"] = serde_json::json!(18);
    nodes["ts_resolution_configs"] = serde_json::json!({"apps/CRM/tsconfig.json":true});
    let mut writer = cgrx_store::GenerationWriter::begin(&f.state, snapshot).unwrap();
    writer
        .write_segment("nodes.seg", &serde_json::to_vec(&nodes).unwrap())
        .unwrap();
    for name in ["edges.seg", "terms.fst"] {
        writer
            .write_segment(name, &reader.read_segment(name).unwrap())
            .unwrap();
    }
    writer.validate().unwrap();
    writer.publish().unwrap();
    let error = Runtime::open(&f.state).err().expect("v18 rejected");
    assert_eq!(error.code(), "extraction_revision");
    Runtime::index(&f.root, &f.state).unwrap();
    assert!(Runtime::open(&f.state).is_ok());
}
#[test]
#[ignore = "requires CGRX_V18_BASELINE executable; never installs a binary"]
fn gd_config_alias_real_v18_binary_state_requests_reindex() {
    let mut f = gd_alias_fixture();
    let baseline = std::env::var_os("CGRX_V18_BASELINE").expect("CGRX_V18_BASELINE");
    let state = f.root.parent().unwrap().join("v18-state");
    let output = Command::new(baseline)
        .args(["index", "--root"])
        .arg(&f.root)
        .arg("--state")
        .arg(&state)
        .arg("--json")
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let reader = GenerationReader::open_current(&state).unwrap();
    let old: serde_json::Value =
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap();
    assert_eq!(old["extraction_revision"], 18);
    assert!(old["ts_resolution_configs"]["apps/CRM/tsconfig.json"].is_boolean());
    assert_eq!(
        Runtime::open(&state).err().expect("v18 rejected").code(),
        "extraction_revision"
    );
    Runtime::index(&f.root, &state).unwrap();
    f.runtime = Runtime::open(&state).unwrap();
    assert_eq!(gd_targets(&f), ["apps/CRM/utils/time.utils.ts"]);
    eprintln!("REAL_V18_BOOL_STATE_REINDEXED_TO_V20_EXACT_ALIAS");
}

#[test]
fn exported_const_arrow_exact_identity_matrix() {
    for worker in [
        "export const target = () => 42;",
        "const target = () => 42; export { target };",
        "const actual = () => 42; export { actual as target };",
        "export const target = async () => 42;",
        "export const other = 1, target = () => 42;",
        "export const target = () => 42; function shadow(){ let target; target = 0; }",
    ] {
        let mut f = Fixture::new(&[
            (
                "main.ts",
                "import { target as invoke } from './api'; function caller(){ invoke(); }",
            ),
            ("api.ts", "export { target } from './worker';"),
            ("worker.ts", worker),
            (
                "decoy.ts",
                "export function invoke() {} export function target() {}",
            ),
        ]);
        assert_eq!(f.targets(), ["worker.ts"], "{worker}");
        let name = if worker.contains("actual") {
            "actual"
        } else {
            "target"
        };
        let trace = f.trace();
        assert_eq!(trace["nodes"][0]["symbol"], name);
        assert_eq!(
            trace["nodes"][0]["span"]["start"],
            worker.find(name).unwrap()
        );
        f.runtime = Runtime::open(&f.state).unwrap();
        assert_eq!(f.targets(), ["worker.ts"]);
        fs::write(f.root.join("worker.ts"), "export let target = () => 42;").unwrap();
        f.refresh();
        assert!(f.targets().is_empty());
        fs::write(f.root.join("worker.ts"), worker).unwrap();
        f.refresh();
        assert_eq!(f.targets(), ["worker.ts"]);
    }
}

#[test]
fn exported_const_arrow_unsafe_bindings_abstain() {
    for worker in [
        "export let target = () => 42;",
        "export var target = () => 42;",
        "export const target = function() { return 42; };",
        "const target = () => 42;",
        "export const target = () => 42; target = () => 0;",
        "export const target = () => 42; function mutate(){ target = () => 0; }",
        "export const target = () => 42; var target;",
        "export const target = () => 42; if (true) { var target; }",
        "export const { target } = { target: () => 42 };",
        "export const target = (() => 42);",
        "export const target = () => 42; export { target };",
        "export const target = () => 42; function target() {}",
        "export const target = () => 42; for (target of []) {}",
        "export const target = () => 42; ({ target } = {});",
    ] {
        let f = Fixture::new(&[
            (
                "main.ts",
                "import { target } from './worker'; function caller(){ target(); }",
            ),
            ("worker.ts", worker),
            ("decoy.ts", "export function target() {}"),
        ]);
        assert!(f.targets().is_empty(), "{worker}");
    }
}
