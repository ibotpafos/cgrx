use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};

use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope, SymbolSelector};
use serde_json::Value;

static SEQUENCE: AtomicU64 = AtomicU64::new(0);

struct Fixture {
    directory: PathBuf,
    root: PathBuf,
    state: PathBuf,
    runtime: Runtime,
}

impl Fixture {
    fn new(files: &[(&str, &str)], tracked: bool) -> Self {
        let directory = std::env::temp_dir().join(format!(
            "cgrx-swift-runtime-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        let root = directory.join("repo");
        fs::create_dir_all(&root).unwrap();
        for (path, source) in files {
            let path = root.join(path);
            fs::create_dir_all(path.parent().unwrap()).unwrap();
            fs::write(path, source).unwrap();
        }
        let git = |args: &[&str]| {
            let result = Command::new("git")
                .args(args)
                .current_dir(&root)
                .output()
                .unwrap();
            assert!(
                result.status.success(),
                "{}",
                String::from_utf8_lossy(&result.stderr)
            );
        };
        git(&["init", "-q"]);
        if tracked {
            git(&["add", "."]);
        }
        git(&[
            "-c",
            "user.name=CGRX Test",
            "-c",
            "user.email=test@example.invalid",
            "commit",
            "--allow-empty",
            "-qm",
            "fixture",
        ]);
        let state = directory.join("state");
        Runtime::index_committed_head(&root, &state).unwrap();
        let mut runtime = Runtime::open(&state).unwrap();
        runtime.refresh(&root).unwrap();
        Self {
            directory,
            root,
            state,
            runtime,
        }
    }

    fn search(&self, query: &str) -> Value {
        self.runtime
            .search_graph_filtered(query, &scope(RelationKind::Calls), 50, Some("swift"), false)
            .unwrap()
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.directory);
    }
}

fn scope(relation: RelationKind) -> Scope {
    Scope {
        include: vec!["**".into()],
        exclude: vec![],
        relation_kinds: vec![relation],
        max_depth: 2,
    }
}

const DECLARATIONS: &str = r#"import Foundation
struct Catalog {
    let products: [Product]
    var count: Int { products.count }
    func refresh() -> Int { products.count }
}
struct Product {
    let id: String
    init(id: String) { self.id = id }
    func refresh() -> Int { 2 }
}
extension Catalog {
    func reload() -> Int { count }
}
protocol Channel { func fetch() async throws }
actor ReleaseChannelService { func fetch() async throws {} }
@MainActor final class AppStore {
    func refresh() async {}
}
typealias ProductList = [Product]
struct Mélodie { func déplacer() {} }
"#;

#[test]
fn default_swift_definitions_extensions_and_repeated_names_have_exact_selectors() {
    let fixture = Fixture::new(&[("Sources/Catalog.swift", DECLARATIONS)], true);
    assert_eq!(
        fixture
            .runtime
            .get_outline("Sources/Catalog.swift", 100)
            .unwrap()["language"],
        "swift"
    );
    for name in [
        "Catalog",
        "Product",
        "Channel",
        "ReleaseChannelService",
        "AppStore",
        "ProductList",
        "reload",
        "init",
        "Mélodie",
        "déplacer",
    ] {
        let found = fixture.search(name);
        let exact = found["matches"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|item| item["symbol"] == name)
            .collect::<Vec<_>>();
        assert!(!exact.is_empty(), "missing {name}: {found}");
        for item in exact {
            let snippet = fixture
                .runtime
                .get_code_snippet_selected(SymbolSelector {
                    symbol: name,
                    path: Some("Sources/Catalog.swift"),
                    symbol_ref: item["symbol_ref"].as_str(),
                })
                .unwrap();
            let start = snippet["definition_span"]["start"].as_u64().unwrap() as usize;
            let end = snippet["definition_span"]["end"].as_u64().unwrap() as usize;
            assert_eq!(&DECLARATIONS[start..end], name, "{snippet}");
            assert!(
                snippet["source"].as_str().unwrap().contains(name),
                "{snippet}"
            );
        }
    }
    let refresh = fixture.search("refresh");
    let entries = refresh["matches"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|entry| entry["symbol"] == "refresh")
        .collect::<Vec<_>>();
    assert_eq!(entries.len(), 3, "{refresh}");
    assert!(
        fixture
            .runtime
            .get_code_snippet_selected(SymbolSelector {
                symbol: "refresh",
                path: Some("Sources/Catalog.swift"),
                symbol_ref: None
            })
            .is_err()
    );
    for entry in entries {
        assert!(
            fixture
                .runtime
                .get_code_snippet_selected(SymbolSelector {
                    symbol: "refresh",
                    path: Some("Sources/Catalog.swift"),
                    symbol_ref: entry["symbol_ref"].as_str()
                })
                .is_ok()
        );
    }
    assert!(
        !fixture
            .runtime
            .coverage()
            .excluded_paths
            .contains(&"Sources/Catalog.swift".to_owned())
    );
}

#[test]
fn swift_proven_free_calls_and_local_type_dependencies_survive_reopen() {
    let source = "import Foundation\nstruct LocalValue {}\nprivate func target() {}\nprivate func caller() { target() }\nfunc consume(_ value: LocalValue) {}\n";
    let fixture = Fixture::new(&[("Sources/Core.swift", source)], true);
    let runtime = Runtime::open(&fixture.state).unwrap();
    let calls = runtime
        .trace_path(
            "caller",
            Some("Sources/Core.swift"),
            "callees",
            1,
            &scope(RelationKind::Calls),
            20,
        )
        .unwrap();
    assert!(calls.to_string().contains("target"), "{calls}");
    let references = runtime
        .trace_path(
            "consume",
            Some("Sources/Core.swift"),
            "callees",
            1,
            &scope(RelationKind::References),
            20,
        )
        .unwrap();
    assert!(
        references.to_string().contains("LocalValue"),
        "{references}"
    );
    let graph = runtime
        .repository_graph(&scope(RelationKind::Calls), 100, 100)
        .unwrap();
    let edges = graph["edges"].as_array().unwrap();
    assert_eq!(edges.len(), 1, "{graph}");
    assert_eq!(edges[0]["evidence"]["path"], "Sources/Core.swift");
    assert!(edges[0]["evidence"]["source_hash"].is_string(), "{graph}");
}

#[test]
fn swift_dynamic_protocol_and_shadowed_calls_never_guess_a_target() {
    let source = "protocol Channel { func fetch() }\nstruct Remote: Channel { func fetch() {} }\nfunc target() {}\nfunc viaProtocol(_ service: any Channel) { service.fetch() }\nfunc shadowed(_ target: () -> Void) { target() }\n";
    let fixture = Fixture::new(&[("Sources/Dynamic.swift", source)], true);
    for name in ["viaProtocol", "shadowed"] {
        let trace = fixture
            .runtime
            .trace_path(
                name,
                Some("Sources/Dynamic.swift"),
                "callees",
                1,
                &scope(RelationKind::Calls),
                20,
            )
            .unwrap();
        assert_eq!(trace["total"], 0, "{trace}");
    }
    assert!(!fixture.runtime.coverage().dynamic_dispatch.is_empty());
}

#[test]
fn untracked_swift_is_discovered_and_refresh_removes_changed_and_deleted_definitions() {
    let mut fixture = Fixture::new(
        &[
            ("docs/notes.txt", "fixture\n"),
            ("Sources/Store.swift", "struct Store { func before() {} }\n"),
        ],
        false,
    );
    assert!(
        !fixture.search("before")["matches"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    fs::write(
        fixture.root.join("Sources/Store.swift"),
        "struct Store { func after() {} }\nextension Store { func added() {} }\n",
    )
    .unwrap();
    fixture.runtime.refresh(&fixture.root).unwrap();
    assert!(
        fixture.search("before")["matches"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    assert!(
        !fixture.search("after")["matches"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    assert!(
        !fixture.search("added")["matches"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    fs::remove_file(fixture.root.join("Sources/Store.swift")).unwrap();
    fixture.runtime.refresh(&fixture.root).unwrap();
    assert!(
        fixture.search("after")["matches"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    assert!(
        fixture.search("added")["matches"]
            .as_array()
            .unwrap()
            .is_empty()
    );
}
