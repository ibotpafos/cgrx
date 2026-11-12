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
    runtime: Runtime,
}

impl Fixture {
    fn new(files: &[(&str, &str)], tracked: bool) -> Self {
        let directory = std::env::temp_dir().join(format!(
            "cgrx-cpp-runtime-{}-{}",
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
            runtime,
        }
    }

    fn search(&self, query: &str) -> Value {
        self.runtime
            .search_graph_filtered(query, &scope(), 50, Some("cpp"), false)
            .unwrap()
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.directory);
    }
}

fn scope() -> Scope {
    Scope {
        include: vec!["**".into()],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 2,
    }
}

#[test]
fn cpp_definitions_direct_calls_and_source_selectors_survive_index_reopen() {
    let source = "int saturate(int value) { return value > 1 ? 1 : value; }\nint render(int value) { return saturate(value); }\n";
    let fixture = Fixture::new(&[("src/engine.cpp", source)], true);
    let found = fixture.search("render");
    let matches = found["matches"].as_array().unwrap();
    assert_eq!(matches.len(), 1, "{found}");
    let selected = &matches[0];
    let snippet = fixture
        .runtime
        .get_code_snippet_selected(SymbolSelector {
            symbol: "render",
            path: Some("src/engine.cpp"),
            symbol_ref: selected["symbol_ref"].as_str(),
        })
        .unwrap();
    assert!(
        snippet["source"]
            .as_str()
            .unwrap()
            .contains("return saturate(value)")
    );
    let trace = fixture
        .runtime
        .trace_path("render", Some("src/engine.cpp"), "callees", 1, &scope(), 20)
        .unwrap();
    assert!(trace.to_string().contains("saturate"), "{trace}");
    assert!(fixture.runtime.graph_edge_count() > 0);
}

#[test]
fn cpp_headers_are_discoverable_with_cpp_language_filter_and_keep_c_headers_c() {
    let fixture = Fixture::new(
        &[
            (
                "src/Processor.h",
                "#pragma once\nnamespace audio { class Processor { public: int tick() { return 7; } }; }\n",
            ),
            (
                "src/plain.h",
                "#pragma once\nint plain(int value) { return value; }\n",
            ),
            (
                "src/constant.h",
                "constexpr int identity(int value) { return value; }\n",
            ),
        ],
        true,
    );
    assert_eq!(
        fixture.runtime.get_outline("src/Processor.h", 50).unwrap()["language"],
        "cpp"
    );
    assert_eq!(
        fixture.runtime.get_outline("src/plain.h", 50).unwrap()["language"],
        "c"
    );
    assert_eq!(
        fixture.runtime.get_outline("src/constant.h", 50).unwrap()["language"],
        "cpp"
    );
    let found = fixture.search("Processor");
    assert!(!found["matches"].as_array().unwrap().is_empty(), "{found}");
    assert!(
        !fixture.search("tick")["matches"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    assert!(
        fixture.search("plain")["matches"]
            .as_array()
            .unwrap()
            .is_empty()
    );
}

#[test]
fn untracked_cpp_after_large_document_directory_is_indexed_and_refreshed() {
    let mut files = Vec::new();
    let noise = (0..120)
        .map(|n| {
            (
                format!("docs/{n:03}.txt"),
                "non-source documentation".to_owned(),
            )
        })
        .collect::<Vec<_>>();
    files.extend(noise.iter().map(|(p, s)| (p.as_str(), s.as_str())));
    files.push(("src/engine.cpp", "int before() { return 1; }\n"));
    files.push((
        "src/Processor.h",
        "class Processor { public: int tick() { return 1; } };\n",
    ));
    let mut fixture = Fixture::new(&files, false);
    assert!(
        !fixture.search("before")["matches"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    assert!(
        !fixture.search("tick")["matches"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    assert!(!fixture.runtime.coverage().traversal_truncated);
    fs::write(
        fixture.root.join("src/engine.cpp"),
        "int after() { return 2; }\n",
    )
    .unwrap();
    fs::write(
        fixture.root.join("src/Processor.h"),
        "class Processor { public: int changed() { return 2; } };\n",
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
        fixture.search("tick")["matches"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    assert!(
        !fixture.search("changed")["matches"]
            .as_array()
            .unwrap()
            .is_empty()
    );
}
