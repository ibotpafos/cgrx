use std::{
    fs,
    path::PathBuf,
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};

use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};

static SEQUENCE: AtomicU64 = AtomicU64::new(0);
const PRIMARY: &str =
    include_str!("../../cgrx-languages/tests/fixtures/swift/CrossFilePrimary.swift");
const EXTENSION: &str =
    include_str!("../../cgrx-languages/tests/fixtures/swift/CrossFileExtension.swift");

struct Fixture {
    directory: PathBuf,
    root: PathBuf,
    state: PathBuf,
    runtime: Runtime,
}

impl Fixture {
    fn new() -> Self {
        let directory = std::env::temp_dir().join(format!(
            "cgrx-swift-compiler-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        let root = directory.join("repo");
        fs::create_dir_all(root.join("Sources")).unwrap();
        fs::write(root.join("Sources/CrossFilePrimary.swift"), PRIMARY).unwrap();
        fs::write(root.join("Sources/CrossFileExtension.swift"), EXTENSION).unwrap();
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
                    .output()
                    .unwrap()
                    .status
                    .success()
            );
        }
        let state = directory.join("state");
        Runtime::index_committed_head(&root, &state).unwrap();
        let runtime = Runtime::open(&state).unwrap();
        Self {
            directory,
            root: root.canonicalize().unwrap(),
            state,
            runtime,
        }
    }

    fn payload(&self) -> Value {
        let mut native: Value =
            serde_json::from_str(include_str!("fixtures/swift-indexstore.json")).unwrap();
        for occurrence in native["occurrences"].as_array_mut().unwrap() {
            occurrence["path"] = json!(format!("Sources/{}", occurrence["path"].as_str().unwrap()));
        }
        json!({"schema":1, "repo":self.root, "toolchain":"Apple Swift 6.3.3", "configuration":["-module-name", "Probe"], "inventory_roots":["Sources"], "sources":{"Sources/CrossFilePrimary.swift":PRIMARY,"Sources/CrossFileExtension.swift":EXTENSION}, "inputs":{}, "occurrences":native["occurrences"]})
    }

    fn publish(&mut self, payload: &Value) {
        fs::create_dir_all(self.root.join(".cgrx")).unwrap();
        fs::write(
            self.root.join(".cgrx/swift-compiler.json"),
            serde_json::to_vec(payload).unwrap(),
        )
        .unwrap();
        self.runtime.refresh(&self.root).unwrap();
    }

    fn graph(&self, relation: RelationKind) -> Value {
        self.runtime
            .repository_graph(
                &Scope {
                    include: vec!["Sources/**".into()],
                    exclude: vec![],
                    relation_kinds: vec![relation],
                    max_depth: 2,
                },
                100,
                100,
            )
            .unwrap()
    }

    fn compiler_edges(&self, relation: RelationKind) -> Vec<Value> {
        self.graph(relation)["edges"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|edge| edge["evidence"]["resolver"] == "COMPILER_CONFIRMED")
            .cloned()
            .collect()
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.directory);
    }
}

#[test]
fn native_compiler_usr_selects_cross_file_overloads_and_nested_alias() {
    let mut fixture = Fixture::new();
    let original = fixture.runtime.snapshot().clone();
    let payload = fixture.payload();
    fixture.publish(&payload);
    let graph = fixture.graph(RelationKind::Calls);
    let edges = fixture.compiler_edges(RelationKind::Calls);
    assert_eq!(edges.len(), 2, "{graph}");
    for edge in &edges {
        let target = graph["nodes"]
            .as_array()
            .unwrap()
            .iter()
            .find(|node| node["node_id"] == edge["target"])
            .unwrap();
        assert_eq!(
            target["path"], "Sources/CrossFileExtension.swift",
            "{target}"
        );
    }
    let refs = fixture.graph(RelationKind::References);
    assert!(
        fixture
            .compiler_edges(RelationKind::References)
            .iter()
            .any(|edge| refs["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .any(|node| node["node_id"] == edge["target"]
                    && node["symbol"] == "Payload"
                    && node["path"] == "Sources/CrossFileExtension.swift")),
        "{refs}"
    );
    assert_ne!(
        fixture.runtime.snapshot(),
        &original,
        "compiler input changes must invalidate graph handles"
    );
    let with_compiler = fixture.runtime.snapshot().clone();
    assert!(!fixture.runtime.refresh(&fixture.root).unwrap());
    assert_eq!(fixture.runtime.snapshot(), &with_compiler);
    let mut reopened = Runtime::open(&fixture.state).unwrap();
    reopened.refresh(&fixture.root).unwrap();
    assert_eq!(reopened.snapshot(), &with_compiler);
}

#[test]
fn dynamic_or_reference_only_occurrences_never_become_calls() {
    for role_change in ["dynamic", "reference", "implicit", "caller"] {
        let mut fixture = Fixture::new();
        let mut payload = fixture.payload();
        for occurrence in payload["occurrences"].as_array_mut().unwrap() {
            let roles = occurrence["roles"].as_u64().unwrap();
            if roles & 32 != 0 {
                match role_change {
                    "dynamic" => occurrence["roles"] = json!(roles | 64),
                    "reference" => occurrence["roles"] = json!(roles & !32),
                    "implicit" => occurrence["roles"] = json!(roles | 256),
                    _ => occurrence["relations"] = json!([]),
                }
            }
        }
        fixture.publish(&payload);
        assert!(
            fixture.compiler_edges(RelationKind::Calls).is_empty(),
            "{role_change}"
        );
    }
}

#[test]
fn other_file_or_new_extension_invalidates_all_compiler_proofs() {
    for change in ["edit", "add", "remove-input"] {
        let mut fixture = Fixture::new();
        fixture.publish(&fixture.payload());
        assert_eq!(fixture.compiler_edges(RelationKind::Calls).len(), 2);
        match change {
            "edit" => fs::write(
                fixture.root.join("Sources/CrossFileExtension.swift"),
                format!("{EXTENSION}\n// changed module\n"),
            )
            .unwrap(),
            "add" => fs::write(
                fixture.root.join("Sources/Extra.swift"),
                "extension Engine { func send(_ x: Bool) {} }\n",
            )
            .unwrap(),
            _ => fs::remove_file(fixture.root.join(".cgrx/swift-compiler.json")).unwrap(),
        }
        assert!(fixture.runtime.refresh(&fixture.root).unwrap());
        assert!(
            fixture.compiler_edges(RelationKind::Calls).is_empty(),
            "{change}"
        );
        assert!(!fixture.runtime.coverage().dynamic_dispatch.is_empty());
    }
}

#[test]
fn wrong_root_duplicate_definition_and_invalid_utf8_anchor_fail_closed() {
    for corruption in ["root", "duplicate", "column", "empty-usr"] {
        let mut fixture = Fixture::new();
        let mut payload = fixture.payload();
        match corruption {
            "root" => payload["repo"] = json!("/unrelated"),
            "duplicate" => {
                let mut duplicate = payload["occurrences"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .find(|o| {
                        o["name"] == "send(_:)"
                            && o["path"] == "Sources/CrossFileExtension.swift"
                            && o["roles"].as_u64().unwrap() & 2 != 0
                    })
                    .unwrap()
                    .clone();
                duplicate["path"] = json!("Sources/CrossFilePrimary.swift");
                duplicate["line"] = json!(5);
                payload["occurrences"]
                    .as_array_mut()
                    .unwrap()
                    .push(duplicate);
            }
            "empty-usr" => {
                for occurrence in payload["occurrences"].as_array_mut().unwrap() {
                    if occurrence["kind"] == 22 || occurrence["roles"].as_u64().unwrap() & 32 != 0 {
                        occurrence["usr"] = json!("");
                    }
                }
            }
            _ => {
                for occurrence in payload["occurrences"].as_array_mut().unwrap() {
                    if occurrence["roles"].as_u64().unwrap() & 32 != 0 {
                        occurrence["column"] = json!(0);
                    }
                }
            }
        }
        fixture.publish(&payload);
        assert!(
            fixture.compiler_edges(RelationKind::Calls).len() < 2,
            "{corruption}"
        );
    }
}

#[test]
fn compiler_context_replacement_corruption_and_restoration_refresh_the_snapshot() {
    let mut fixture = Fixture::new();
    let context = fixture.root.join("Package.swift");
    fs::write(&context, "// package configuration A\n").unwrap();
    let mut payload = fixture.payload();
    payload["inputs"][context.to_str().unwrap()] =
        json!(format!("{:x}", Sha256::digest(fs::read(&context).unwrap())));
    fixture.publish(&payload);
    let current = fixture.runtime.snapshot().clone();
    assert_eq!(fixture.compiler_edges(RelationKind::Calls).len(), 2);
    fs::write(&context, "// package configuration B\n").unwrap();
    fixture.runtime.refresh(&fixture.root).unwrap();
    assert!(fixture.compiler_edges(RelationKind::Calls).is_empty());
    assert_ne!(fixture.runtime.snapshot(), &current);
    assert_eq!(
        fixture.runtime.swift_compiler_status()["reason"],
        "changed_input"
    );
    fs::write(&context, "// package configuration A\n").unwrap();
    fixture.runtime.refresh(&fixture.root).unwrap();
    assert_eq!(fixture.compiler_edges(RelationKind::Calls).len(), 2);
    fs::write(fixture.root.join(".cgrx/swift-compiler.json"), b"{bad JSON").unwrap();
    fixture.runtime.refresh(&fixture.root).unwrap();
    assert!(fixture.compiler_edges(RelationKind::Calls).is_empty());
    fixture.publish(&payload);
    assert_eq!(fixture.compiler_edges(RelationKind::Calls).len(), 2);
}

#[test]
fn real_unicode_anchors_accessors_local_initializers_and_dynamic_dispatch() {
    let mut fixture = Fixture::new();
    let source = include_str!("fixtures/SwiftUnicode.swift");
    fs::write(fixture.root.join("Sources/Unicode.swift"), source).unwrap();
    let mut payload = fixture.payload();
    payload["sources"]["Sources/Unicode.swift"] = json!(source);
    let mut native: Value =
        serde_json::from_str(include_str!("fixtures/swift-unicode-indexstore.json")).unwrap();
    for occurrence in native["occurrences"].as_array_mut().unwrap() {
        occurrence["path"] = json!("Sources/Unicode.swift");
    }
    payload["occurrences"]
        .as_array_mut()
        .unwrap()
        .extend(native["occurrences"].as_array().unwrap().iter().cloned());
    fixture.publish(&payload);
    let graph = fixture.graph(RelationKind::Calls);
    let calls = fixture.compiler_edges(RelationKind::Calls);
    let targets = calls
        .iter()
        .filter_map(|edge| {
            graph["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .find(|node| node["node_id"] == edge["target"])
        })
        .map(|node| node["symbol"].as_str().unwrap())
        .collect::<Vec<_>>();
    assert!(targets.contains(&"`repeat`"), "{graph}");
    assert!(!targets.contains(&"run"), "{graph}");
    assert!(!targets.contains(&"callback"), "{graph}");
    assert!(
        targets.contains(&"Mélodie"),
        "synthesized construction must target its compiler-recorded nominal: {graph}"
    );
    let callers = calls
        .iter()
        .filter_map(|edge| {
            graph["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .find(|node| node["node_id"] == edge["source"])
        })
        .map(|node| node["symbol"].as_str().unwrap())
        .collect::<Vec<_>>();
    assert!(
        callers.contains(&"computed"),
        "computed getter body must have an owner: {graph}"
    );
    assert!(
        callers.contains(&"local"),
        "local initializers must keep their compiler-recorded parent: {graph}"
    );
    assert!(
        callers.contains(&"initial"),
        "property initializer CALL + CONTAINED_BY must have an owner: {graph}"
    );
    assert!(
        callers.contains(&"shortened"),
        "implicit member .init must keep its full call span: {graph}"
    );
    assert!(
        targets.contains(&"Downloader"),
        "inherited implicit constructor must target the compiler-recorded class: {graph}"
    );
    assert!(
        fixture.runtime.swift_compiler_status()["resolution"]["recovered_syntax_files"]
            .as_u64()
            .unwrap()
            >= 1
    );
}

#[test]
fn native_operators_keep_exact_overloads_and_own_their_body_dependencies() {
    let mut fixture = Fixture::new();
    let source = include_str!("fixtures/SwiftOperators.swift");
    let path = "Sources/Operators.swift";
    fs::write(fixture.root.join(path), source).unwrap();
    let mut payload = fixture.payload();
    payload["sources"][path] = json!(source);
    let mut native: Value =
        serde_json::from_str(include_str!("fixtures/swift-operators-indexstore.json")).unwrap();
    for occurrence in native["occurrences"].as_array_mut().unwrap() {
        occurrence["path"] = json!(path);
    }
    payload["occurrences"]
        .as_array_mut()
        .unwrap()
        .extend(native["occurrences"].as_array().unwrap().iter().cloned());
    fixture.publish(&payload);
    let graph = fixture.graph(RelationKind::Calls);
    let nodes = graph["nodes"].as_array().unwrap();
    let calls = fixture.compiler_edges(RelationKind::Calls);
    let first_custom = source.find("func <+>").unwrap() + 5;
    let second_custom = source.rfind("func <+>").unwrap() + 5;
    for (caller, operator, target_start) in [
        ("compare", "<", source.find("func < (").unwrap() + 5),
        ("compare", "==", source.find("func == (").unwrap() + 5),
        ("combineFirst", "<+>", first_custom),
        ("combineSecond", "<+>", second_custom),
        ("combineUnicode", "⊕", source.find("func ⊕").unwrap() + 5),
        ("prefixFirst", "~++", source.find("func ~++").unwrap() + 5),
        ("postfixFirst", "++", source.find("func ++").unwrap() + 5),
    ] {
        let selected = calls
            .iter()
            .filter(|edge| {
                nodes
                    .iter()
                    .any(|node| node["node_id"] == edge["source"] && node["symbol"] == caller)
            })
            .collect::<Vec<_>>();
        assert!(
            selected.iter().any(|edge| {
                nodes.iter().any(|node| {
                    node["node_id"] == edge["target"] && node["span"]["start"] == target_start
                }) && &source[edge["evidence"]["span"]["start"].as_u64().unwrap() as usize
                    ..edge["evidence"]["span"]["end"].as_u64().unwrap() as usize]
                    == operator
            }),
            "missing exact operator target {caller} -> {operator}@{target_start}: {graph}"
        );
        assert!(
            selected.iter().all(
                |edge| nodes.iter().all(|node| node["node_id"] != edge["target"]
                    || node["symbol"] != operator
                    || node["span"]["start"] == target_start)
            ),
            "operator bound to the wrong overload: {graph}"
        );
    }
    let references = fixture.graph(RelationKind::References);
    for operator in ["<", "=="] {
        assert!(
            fixture
                .compiler_edges(RelationKind::References)
                .iter()
                .any(|edge| {
                    references["nodes"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .any(|node| node["node_id"] == edge["source"] && node["symbol"] == operator)
                        && references["nodes"].as_array().unwrap().iter().any(|node| {
                            node["node_id"] == edge["target"] && node["symbol"] == "value"
                        })
                }),
            "operator body lost its compiler-recorded owner: {references}"
        );
    }
    // An unknown/dynamic callee must not bind to the same-spelled Second overload.
    for mutation in ["empty_usr", "dynamic", "reference_only"] {
        let mut invalid = payload.clone();
        for occurrence in invalid["occurrences"].as_array_mut().unwrap() {
            if occurrence["path"] == path
                && occurrence["line"] == 27
                && occurrence["roles"].as_u64().unwrap() & 32 != 0
            {
                let roles = occurrence["roles"].as_u64().unwrap();
                match mutation {
                    "empty_usr" => occurrence["usr"] = json!(""),
                    "dynamic" => occurrence["roles"] = json!(roles | 64),
                    _ => occurrence["roles"] = json!(roles & !32),
                }
            }
        }
        fixture.publish(&invalid);
        let changed = fixture.graph(RelationKind::Calls);
        assert!(
            !fixture
                .compiler_edges(RelationKind::Calls)
                .iter()
                .any(|edge| changed["nodes"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .any(|node| node["node_id"] == edge["source"]
                        && node["symbol"] == "combineFirst")),
            "{mutation}: {changed}"
        );
    }
}

#[test]
fn real_compiler_wrapped_calls_and_generic_parameters_keep_exact_source_sites() {
    let mut fixture = Fixture::new();
    let source = include_str!("fixtures/SwiftCallSyntax.swift");
    let path = "Sources/CallSyntax.swift";
    fs::write(fixture.root.join(path), source).unwrap();
    let mut payload = fixture.payload();
    payload["sources"][path] = json!(source);
    let mut native: Value =
        serde_json::from_str(include_str!("fixtures/swift-call-syntax-indexstore.json")).unwrap();
    for occurrence in native["occurrences"].as_array_mut().unwrap() {
        occurrence["path"] = json!(path);
    }
    payload["occurrences"]
        .as_array_mut()
        .unwrap()
        .extend(native["occurrences"].as_array().unwrap().iter().cloned());
    fixture.publish(&payload);
    let calls = fixture.compiler_edges(RelationKind::Calls);
    for call in [
        "Box<Int>(value)",
        "\"sha256:\" + digest(box.value)",
        "!ready(value)",
    ] {
        assert!(
            calls.iter().any(|edge| {
                let evidence = &edge["evidence"];
                evidence["path"] == path
                    && &source[evidence["span"]["start"].as_u64().unwrap() as usize
                        ..evidence["span"]["end"].as_u64().unwrap() as usize]
                        == call
            }),
            "missing exact call {call}: {calls:?}"
        );
        let start = source.find(call).unwrap();
        assert!(
            !fixture
                .runtime
                .coverage()
                .dynamic_dispatch
                .contains(&format!("{path}:{start}-{}", start + call.len())),
            "proven call remains a gap: {call}"
        );
    }
    let refs = fixture.graph(RelationKind::References);
    let parameters = refs["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|node| node["path"] == path && node["symbol"] == "T")
        .collect::<Vec<_>>();
    assert_eq!(parameters.len(), 2, "distinct generic declarations: {refs}");
    let generic_start = source.find("func genericIdentity").unwrap();
    let generic_parameter = parameters
        .iter()
        .find(|node| {
            node["span"]["start"]
                .as_u64()
                .is_some_and(|start| start as usize > generic_start)
        })
        .unwrap();
    for reference in ["T.Type", "T) ->", "T { value }"] {
        let start = source[generic_start..].find(reference).unwrap() + generic_start;
        let end = start + if reference == "T.Type" { 6 } else { 1 };
        assert!(
            !fixture
                .runtime
                .coverage()
                .dynamic_dispatch
                .contains(&format!("{path}:{start}-{end}")),
            "proven generic reference remains a gap: {reference}"
        );
    }
    // The repository graph deduplicates relations; its retained evidence is
    // the first site. The same-spelled Box<T> parameter must not receive it.
    let metatype = source[generic_start..].find("T.Type").unwrap() + generic_start;
    assert!(
        fixture
            .compiler_edges(RelationKind::References)
            .iter()
            .any(|edge| edge["target"] == generic_parameter["node_id"]
                && edge["evidence"]["span"]["start"] == metatype
                && edge["evidence"]["span"]["end"] == metatype + 6),
        "wrong generic USR binding: {refs}"
    );
    let indirect = source.find("(flag ? first : second)()").unwrap();
    assert!(
        calls.iter().all(|edge| edge["evidence"]["path"] != path
            || edge["evidence"]["span"]["start"].as_u64().unwrap() as usize != indirect),
        "function-value dispatch became a proven call"
    );
}
