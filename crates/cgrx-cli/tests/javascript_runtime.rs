#![cfg(feature = "experimental-javascript")]
use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};
use cgrx_store::{GenerationReader, GenerationWriter};
use serde_json::Value;
use std::{
    fs,
    path::PathBuf,
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};

static ID: AtomicU64 = AtomicU64::new(0);
struct Fixture {
    base: PathBuf,
    root: PathBuf,
    state: PathBuf,
    runtime: Runtime,
}
impl Fixture {
    fn new(files: &[(&str, &str)]) -> Self {
        let base = std::env::temp_dir().join(format!(
            "cgrx-js-proof-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        ));
        let root = base.join("repo");
        let state = base.join("state");
        fs::create_dir_all(&root).unwrap();
        for (path, source) in files {
            let path = root.join(path);
            fs::create_dir_all(path.parent().unwrap()).unwrap();
            fs::write(path, source).unwrap();
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
            base,
            root,
            state,
            runtime,
        }
    }
    fn trace(&self, symbol: &str, path: &str) -> Value {
        self.runtime
            .trace_path(
                symbol,
                Some(path),
                "callees",
                1,
                &Scope {
                    include: vec![],
                    exclude: vec![],
                    relation_kinds: vec![RelationKind::Calls],
                    max_depth: 1,
                },
                50,
            )
            .unwrap()
    }
    fn targets(&self, symbol: &str, path: &str) -> Vec<(String, String)> {
        self.trace(symbol, path)["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .map(|node| {
                (
                    node["path"].as_str().unwrap().to_owned(),
                    node["symbol"].as_str().unwrap().to_owned(),
                )
            })
            .collect()
    }
    fn segments(&self) -> (Value, Value) {
        let reader = GenerationReader::open_current(&self.state).unwrap();
        let nodes: Value =
            serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap();
        let arcs = nodes["arcs"].clone();
        (nodes, arcs)
    }
    fn refresh(&mut self) {
        self.runtime.refresh(&self.root).unwrap();
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.base);
    }
}

#[test]
fn assigned_commonjs_function_has_exact_local_caller_and_target() {
    let source =
        "function target(x) { return x; }\nexports.caller = function(x) { return target(x); };\n";
    let fixture = Fixture::new(&[("main.js", source), ("noise.js", "function target() {}")]);
    assert_eq!(
        fixture.targets("caller", "main.js"),
        [("main.js".to_owned(), "target".to_owned())]
    );
    let (_, arcs) = fixture.segments();
    let proof = arcs
        .as_array()
        .unwrap()
        .iter()
        .find(|arc| arc["kind"] == "CALLS")
        .unwrap();
    assert_eq!(
        proof["evidence"]["source_hash"],
        serde_json::to_value(cgrx_core::Hash32(
            *blake3::hash(source.as_bytes()).as_bytes()
        ))
        .unwrap()
    );
    let start = source.find("target(x);").unwrap();
    assert_eq!(proof["evidence"]["span"]["start"], start);
    assert_eq!(proof["evidence"]["span"]["end"], start + "target(x)".len());
}

#[test]
fn commonjs_default_export_proves_call_import_and_reference_after_reopen() {
    let fixture = Fixture::new(&[
        (
            "main.js",
            "var View = require('./view'); exports.caller = function() { return new View(); }; exports.reference = function(register) { register(View); };",
        ),
        ("view.js", "function View() {} module.exports = View;"),
        ("noise.js", "function View() {} function register() {}"),
    ]);
    assert_eq!(
        fixture.targets("caller", "main.js"),
        [("view.js".to_owned(), "View".to_owned())]
    );
    assert!(fixture.targets("reference", "main.js").is_empty());
    let (nodes, arcs) = fixture.segments();
    let target = nodes["documents"]
        .as_array()
        .unwrap()
        .iter()
        .find(|d| {
            d["path"] == "view.js" && d["qualified_name"] == "View" && d["provenance"] == "SYNTAX"
        })
        .unwrap()["node_id"]
        .clone();
    for kind in ["CALLS", "IMPORTS", "REFERENCES"] {
        assert!(
            arcs.as_array()
                .unwrap()
                .iter()
                .any(|arc| arc["target"] == target
                    && arc["kind"] == kind
                    && arc["evidence"]["path"] == "main.js"),
            "missing {kind}: {arcs}"
        );
    }
    let reopened = Runtime::open(&fixture.state).unwrap();
    assert_eq!(
        reopened
            .trace_path(
                "caller",
                Some("main.js"),
                "callees",
                1,
                &Scope {
                    include: vec![],
                    exclude: vec![],
                    relation_kinds: vec![RelationKind::Calls],
                    max_depth: 1
                },
                20
            )
            .unwrap()["nodes"],
        fixture.trace("caller", "main.js")["nodes"]
    );
}

#[test]
fn esm_named_alias_and_const_arrow_resolve_without_global_name_fallback() {
    let fixture = Fixture::new(&[
        (
            "main.mjs",
            "import { target as mapped, arrow } from './view.mjs'; export function caller() { mapped(1); arrow(2); }",
        ),
        (
            "view.mjs",
            "export function target(x) { return x; } export const arrow = (x) => target(x);",
        ),
        (
            "noise.mjs",
            "export function mapped() {} export function target() {}",
        ),
    ]);
    let mut targets = fixture.targets("caller", "main.mjs");
    targets.sort();
    assert_eq!(
        targets,
        [
            ("view.mjs".to_owned(), "arrow".to_owned()),
            ("view.mjs".to_owned(), "target".to_owned())
        ]
    );
    assert_eq!(
        fixture.targets("arrow", "view.mjs"),
        [("view.mjs".to_owned(), "target".to_owned())]
    );
}

#[test]
fn lexical_and_dynamic_negative_controls_never_prove_a_global_name() {
    for body in [
        "function caller(target) { target(); }",
        "function caller() { const target = external; target(); }",
        "function caller() { target(); var target = external; }",
        "function caller() { const target = () => {}; target = external; target(); }",
        "function caller() { (() => target())(); }",
        "function caller() { eval('target = external'); target(); }",
        "function caller() { with (external) { target(); } }",
        "function caller() { external.target(); }",
        "function caller() { target( ; }",
    ] {
        let source = format!("function target() {{}}\n{body}");
        let fixture = Fixture::new(&[("main.js", &source), ("noise.js", "function target() {}")]);
        assert!(
            fixture.targets("caller", "main.js").is_empty(),
            "false proof for {body}"
        );
    }
    let fixture = Fixture::new(&[
        ("main.js", "function caller() { target(); }"),
        ("noise.js", "function target() {}"),
    ]);
    assert!(fixture.targets("caller", "main.js").is_empty());
}

#[test]
fn changed_missing_and_competing_module_targets_remove_old_edges() {
    let mut fixture = Fixture::new(&[
        (
            "main.cjs",
            "const View = require('./view'); function caller() { View(); }",
        ),
        ("view.js", "function View() {} module.exports = View;"),
    ]);
    assert_eq!(fixture.targets("caller", "main.cjs").len(), 1);
    fs::write(fixture.root.join("view.json"), "{}").unwrap();
    fixture.refresh();
    assert!(fixture.targets("caller", "main.cjs").is_empty());
    fs::remove_file(fixture.root.join("view.json")).unwrap();
    fixture.refresh();
    assert_eq!(fixture.targets("caller", "main.cjs").len(), 1);
    fs::write(
        fixture.root.join("view.js"),
        "function Other() {} module.exports = unknown;",
    )
    .unwrap();
    fixture.refresh();
    assert!(fixture.targets("caller", "main.cjs").is_empty());
    fs::remove_file(fixture.root.join("view.js")).unwrap();
    fixture.refresh();
    assert!(fixture.targets("caller", "main.cjs").is_empty());
}

#[test]
fn unstable_export_and_import_bindings_abstain() {
    for target in [
        "function View() {} function Other() {} module.exports = View; module.exports = Other;",
        "function View() {} if (external) { module.exports = View; }",
        "function View() {} module.exports = View; external(module);",
        "function View() {} module.exports = View; delete module.exports;",
    ] {
        let fixture = Fixture::new(&[
            (
                "main.js",
                "var View = require('./view'); function caller() { View(); }",
            ),
            ("view.js", target),
        ]);
        assert!(
            fixture.targets("caller", "main.js").is_empty(),
            "false export proof: {target}"
        );
    }
    for source in [
        "function require() {} var View = require('./view'); function caller() { View(); }",
        "var View = require('./view'); View = external; function caller() { View(); }",
        "var View = require('./view'); function caller(View) { View(); }",
        "var View = require('./view'); function caller() { var View; View(); }",
    ] {
        let fixture = Fixture::new(&[
            ("main.js", source),
            ("view.js", "function View() {} module.exports = View;"),
        ]);
        assert!(
            fixture.targets("caller", "main.js").is_empty(),
            "false import proof: {source}"
        );
    }
}

#[test]
fn partially_resolved_multi_import_keeps_the_statement_gap() {
    let source =
        "import { target, missing } from './view.mjs'; function caller() { target(); missing(); }";
    let fixture = Fixture::new(&[
        ("main.mjs", source),
        ("view.mjs", "export function target() {}"),
    ]);
    assert_eq!(
        fixture.targets("caller", "main.mjs"),
        [("view.mjs".to_owned(), "target".to_owned())]
    );
    let (nodes, _) = fixture.segments();
    let end = source.find(';').unwrap() + 1;
    assert!(
        nodes["coverage"]["dynamic_dispatch"]
            .as_array()
            .unwrap()
            .contains(&Value::String(format!("main.mjs:0-{end}")))
    );
}

#[test]
fn module_modes_and_unknown_reexports_never_acquire_an_incompatible_target() {
    for (path, source) in [
        (
            "main.mjs",
            "const View = require('./view'); function caller() { View(); }",
        ),
        (
            "main.cjs",
            "import { View } from './view.js'; function caller() { View(); }",
        ),
        (
            "main.js",
            "const View = require('./view'); export function caller() { View(); }",
        ),
    ] {
        let fixture = Fixture::new(&[
            (path, source),
            ("view.js", "function View() {} module.exports = View;"),
        ]);
        assert!(
            fixture.targets("caller", path).is_empty(),
            "incompatible module mode: {path}"
        );
    }
    let fixture = Fixture::new(&[
        (
            "main.mjs",
            "import { target } from './view.mjs'; function caller() { target(); }",
        ),
        (
            "view.mjs",
            "export function target() {} export { unknown as target } from './external.mjs';",
        ),
    ]);
    assert!(fixture.targets("caller", "main.mjs").is_empty());
}

#[test]
fn package_type_changes_revalidate_commonjs_binding_proofs() {
    let mut fixture = Fixture::new(&[
        ("package.json", "{\"type\":\"commonjs\"}"),
        (
            "main.js",
            "var View = require('./view'); function caller() { View(); }",
        ),
        ("view.js", "function View() {} module.exports = View;"),
    ]);
    assert_eq!(fixture.targets("caller", "main.js").len(), 1);
    for policy in ["{\"type\":\"module\"}", "{", "{\"type\":17}"] {
        fs::write(fixture.root.join("package.json"), policy).unwrap();
        fixture.refresh();
        assert!(
            fixture.targets("caller", "main.js").is_empty(),
            "stale package policy: {policy}"
        );
    }
    fs::write(fixture.root.join("package.json"), "{}").unwrap();
    fixture.refresh();
    assert_eq!(fixture.targets("caller", "main.js").len(), 1);
}

#[test]
fn constructors_require_a_constructable_function_in_the_exact_target_file() {
    let fixture = Fixture::new(&[(
        "main.js",
        "function View() {} const Assigned = function() {}; function caller() { new View(); new Assigned(); }",
    )]);
    assert_eq!(fixture.targets("caller", "main.js").len(), 2);
    for declaration in [
        "const View = () => {};",
        "async function View() {}",
        "const View = async function() {};",
        "function* View() {}",
    ] {
        let source = format!("{declaration} function caller() {{ new View(); }}");
        let fixture = Fixture::new(&[("main.js", &source)]);
        assert!(
            fixture.targets("caller", "main.js").is_empty(),
            "{declaration}"
        );
        let fixture = Fixture::new(&[
            (
                "main.js",
                "const View = require('./view'); function caller() { new View(); }",
            ),
            ("view.js", &format!("{declaration} module.exports = View;")),
        ]);
        assert!(
            fixture.targets("caller", "main.js").is_empty(),
            "{declaration}"
        );
    }
}

#[test]
fn unsupported_import_parts_remain_visible_when_a_sibling_binding_resolves() {
    for statement in [
        "import * as namespace from './view.mjs';",
        "import './view.mjs';",
        "import target, * as namespace from './view.mjs';",
        "export { target } from './view.mjs';",
        "export * from './view.mjs';",
    ] {
        let source = format!("{statement} function caller() {{}}");
        let fixture = Fixture::new(&[
            ("main.mjs", &source),
            (
                "view.mjs",
                "function target() {} export { target as default, target };",
            ),
        ]);
        let (nodes, _) = fixture.segments();
        assert!(
            nodes["coverage"]["dynamic_dispatch"]
                .as_array()
                .unwrap()
                .contains(&Value::String(format!("main.mjs:0-{}", statement.len()))),
            "hidden import gap: {statement}"
        );
    }
}

#[test]
fn reopen_revalidates_persisted_arcs_against_their_supporting_ledger() {
    for case in [
        "missing-ledger",
        "stale-source",
        "stale-target",
        "wrong-caller",
        "duplicate-target",
    ] {
        let fixture = Fixture::new(&[
            (
                "main.js",
                "const View = require('./view'); function caller() { View(); }",
            ),
            ("view.js", "function View() {} module.exports = View;"),
        ]);
        assert_eq!(fixture.targets("caller", "main.js").len(), 1);
        let reader = GenerationReader::open_current(&fixture.state).unwrap();
        let (mut nodes, _) = fixture.segments();
        match case {
            "missing-ledger" => {
                nodes["ts_files"]["main.js"]["facts"]
                    .as_object_mut()
                    .unwrap()
                    .remove("javascript");
            }
            "stale-source" | "stale-target" => {
                nodes["path_hashes"][if case == "stale-source" {
                    "main.js"
                } else {
                    "view.js"
                }] = serde_json::to_value(cgrx_core::Hash32([9; 32])).unwrap();
            }
            "wrong-caller" => {
                let site = nodes["ts_files"]["main.js"]["facts"]["javascript"]["sites"]
                    .as_array_mut()
                    .unwrap()
                    .iter_mut()
                    .find(|site| site["kind"] == "Call")
                    .unwrap();
                site["caller"][0] = Value::from(site["caller"][0].as_u64().unwrap() + 1);
            }
            _ => {
                let docs = nodes["documents"].as_array_mut().unwrap();
                let mut target = docs
                    .iter()
                    .find(|d| d["path"] == "view.js" && d["provenance"] == "SYNTAX")
                    .unwrap()
                    .clone();
                target["node_id"] = Value::from(42_u64);
                docs.push(target);
            }
        }
        let mut snapshot = reader.snapshot().clone();
        snapshot.graph_generation += 1;
        nodes["snapshot"] = serde_json::to_value(&snapshot).unwrap();
        let mut writer = GenerationWriter::begin(&fixture.state, snapshot).unwrap();
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
        let mut fixture = fixture;
        fixture.runtime = Runtime::open(&fixture.state).unwrap();
        assert!(
            fixture.targets("caller", "main.js").is_empty(),
            "trusted corrupt proof: {case}"
        );
    }
}
