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
    fn new(files: &[(&str, &str)]) -> Self {
        let directory = std::env::temp_dir().join(format!(
            "cgrx-ast-{}-{}",
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
        for args in [
            vec!["init", "-q"],
            vec!["add", "."],
            vec![
                "-c",
                "user.name=CGRX Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-qm",
                "fixture",
            ],
        ] {
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
        }
        Runtime::index(&root, &directory.join("state")).unwrap();
        let runtime = Runtime::open(&directory.join("state")).unwrap();
        Self {
            directory,
            root,
            runtime,
        }
    }

    fn search(&self, query: &str, language: &str, limit: usize, offset: usize) -> Value {
        self.runtime
            .search_ast_graph_page(&self.root, query, &scope(), (limit, offset), language)
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
        include: vec!["**".to_owned()],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    }
}

fn names(value: &Value) -> Vec<&str> {
    value["matches"]
        .as_array()
        .unwrap()
        .iter()
        .map(|row| row["symbol"].as_str().unwrap())
        .collect()
}

#[test]
fn syntax_matches_ignore_comments_and_strings_and_preserve_source_navigation() {
    let source = "// русский 🐍\nfn fetch(value: i32) {}\nfn real() { fetch(2); fetch(3); }\nfn fake() { /* fetch(4); */ let value = \"fetch(5)\"; }\nfn nested() { other(fetch(6)); }\n";
    let fixture = Fixture::new(&[("main.rs", source)]);
    let report = fixture.search("fetch($URL)", "rust", 20, 0);
    assert_eq!(names(&report), ["real", "nested"]);
    assert_eq!(report["algorithm"], "ast_grep_v1");
    assert_eq!(report["ast_scan"]["partial"], false);
    assert_eq!(
        report["snapshot"],
        serde_json::to_value(fixture.runtime.snapshot()).unwrap()
    );
    let hash = blake3::hash(source.as_bytes()).to_hex().to_string();
    for row in report["matches"].as_array().unwrap() {
        assert_eq!(row["matched_by"], "ast");
        assert_eq!(row["ast_matches"]["source_hash"], hash);
        let reference = row["symbol_ref"].as_str().unwrap();
        let snippet = fixture
            .runtime
            .get_code_snippet_selected(
                SymbolSelector::new(row["symbol"].as_str().unwrap(), Some("main.rs"))
                    .with_ref(reference),
            )
            .unwrap();
        assert_eq!(snippet["definition_span"]["start"], row["span"]["start"]);
        for span in row["ast_matches"]["spans"].as_array().unwrap() {
            let start = span["start"].as_u64().unwrap() as usize;
            let end = span["end"].as_u64().unwrap() as usize;
            assert!(matches!(
                &source[start..end],
                "fetch(2)" | "fetch(3)" | "fetch(6)"
            ));
        }
    }
    assert_eq!(
        report["matches"][0]["ast_matches"]["spans"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
    let lexical = fixture
        .runtime
        .search_graph_filtered("fetch", &scope(), 20, Some("rust"), true)
        .unwrap();
    assert!(names(&lexical).contains(&"fake"));
}

#[test]
fn released_languages_and_tsx_share_the_existing_index_parsers() {
    let files = [
        ("main.rs", "fn run() { fetch(1); }\n"),
        ("main.py", "def run():\n    fetch(1)\n"),
        ("main.go", "package main\nfunc run() { fetch(1) }\n"),
        ("main.ts", "export function run() { fetch(1); }\n"),
        (
            "main.tsx",
            "export function jsx() { return <div>{fetch(1)}</div>; }\n",
        ),
    ];
    let fixture = Fixture::new(&files);
    for language in ["rust", "python", "go", "typescript"] {
        let report = fixture.search("fetch($ARG)", language, 20, 0);
        assert_eq!(
            report["total"],
            if language == "typescript" { 2 } else { 1 },
            "{language}: {report}"
        );
        assert_eq!(report["ast_scan"]["partial"], false);
        for row in report["matches"].as_array().unwrap() {
            let path = row["path"].as_str().unwrap();
            let source = files.iter().find(|(name, _)| *name == path).unwrap().1;
            let span = &row["ast_matches"]["spans"][0];
            assert_eq!(
                &source[span["start"].as_u64().unwrap() as usize
                    ..span["end"].as_u64().unwrap() as usize],
                "fetch(1)"
            );
        }
    }
}

#[test]
fn repeated_metavariables_and_argument_lists_match_structure() {
    let fixture = Fixture::new(&[(
        "main.rs",
        "fn same() { if left == left { fetch(1,2); } }\nfn different() { if left == right { fetch(); } }\n",
    )]);
    assert_eq!(
        names(&fixture.search("$VALUE == $VALUE", "rust", 20, 0)),
        ["same"]
    );
    assert_eq!(
        names(&fixture.search("fetch($$$ARGS)", "rust", 20, 0)),
        ["same", "different"]
    );
    assert_eq!(fixture.search("unrelated($ARG)", "rust", 20, 0)["total"], 0);
}

#[test]
fn scopes_and_pages_preserve_deterministic_definition_identity() {
    let fixture = Fixture::new(&[
        (
            "a.rs",
            "fn first() { fetch(1); }\nfn second() { fetch(2); }\n",
        ),
        ("b.rs", "fn third() { fetch(3); }\n"),
    ]);
    let first = fixture.search("fetch($ARG)", "rust", 1, 0);
    let second = fixture.search("fetch($ARG)", "rust", 1, 1);
    let last = fixture.search("fetch($ARG)", "rust", 1, 2);
    let empty = fixture.search("fetch($ARG)", "rust", 1, 3);
    assert_eq!(names(&first), ["first"]);
    assert_eq!(names(&second), ["second"]);
    assert_eq!(names(&last), ["third"]);
    assert_eq!(first["total"], 3);
    assert_eq!(first["page"]["next_offset"], 1);
    assert_eq!(last["page"]["has_more"], false);
    assert_eq!(empty["total"], 3);
    assert!(names(&empty).is_empty());
    assert_eq!(first["page"]["snapshot_id"], second["page"]["snapshot_id"]);
    let selected = Scope {
        include: vec!["a.rs".to_owned()],
        ..scope()
    };
    assert_eq!(
        fixture
            .runtime
            .search_ast_graph_page(&fixture.root, "fetch($ARG)", &selected, (20, 0), "rust")
            .unwrap()["total"],
        2
    );
    let excluded = Scope {
        exclude: vec!["a.rs".to_owned(), "b.rs".to_owned()],
        ..scope()
    };
    assert_eq!(
        fixture
            .runtime
            .search_ast_graph_page(&fixture.root, "fetch($ARG)", &excluded, (20, 0), "rust")
            .unwrap()["total"],
        0
    );
}

#[test]
fn source_mutation_and_deletion_never_return_stale_match_spans() {
    let fixture = Fixture::new(&[("main.rs", "fn run() { fetch(1); }\n")]);
    fs::write(fixture.root.join("main.rs"), "fn run() { fetch(9999); }\n").unwrap();
    let error = fixture
        .runtime
        .search_ast_graph_page(&fixture.root, "fetch($ARG)", &scope(), (20, 0), "rust")
        .unwrap_err();
    assert_eq!(error.code(), "cgrx.ast_source_changed");
    fs::remove_file(fixture.root.join("main.rs")).unwrap();
    assert_eq!(
        fixture
            .runtime
            .search_ast_graph_page(&fixture.root, "fetch($ARG)", &scope(), (20, 0), "rust")
            .unwrap_err()
            .code(),
        "cgrx.ast_source_changed"
    );
}

#[cfg(unix)]
#[test]
fn source_symlinks_are_rejected_even_when_target_bytes_match() {
    let fixture = Fixture::new(&[("main.rs", "fn run() { fetch(1); }\n")]);
    let source = fixture.root.join("main.rs");
    let external = fixture.directory.join("external.rs");
    fs::rename(&source, &external).unwrap();
    std::os::unix::fs::symlink(&external, &source).unwrap();
    assert_eq!(
        fixture
            .runtime
            .search_ast_graph_page(&fixture.root, "fetch($ARG)", &scope(), (20, 0), "rust")
            .unwrap_err()
            .code(),
        "cgrx.ast_source_unavailable"
    );
}

#[test]
fn match_span_limits_are_explicit_and_do_not_change_definition_totals() {
    let source = format!("fn many() {{ {} }}", "fetch(1);".repeat(12));
    let fixture = Fixture::new(&[("main.rs", &source)]);
    let report = fixture.search("fetch($ARG)", "rust", 20, 0);
    assert_eq!(report["total"], 1);
    assert_eq!(
        report["matches"][0]["ast_matches"]["spans"]
            .as_array()
            .unwrap()
            .len(),
        8
    );
    assert_eq!(report["matches"][0]["ast_matches"]["truncated"], true);
    assert_eq!(report["ast_scan"]["partial"], false);
}

#[test]
fn invalid_patterns_languages_and_bounds_are_rejected() {
    let fixture = Fixture::new(&[("main.rs", "fn run() {}\n")]);
    for query in ["$$$", "fetch(1); fetch(2);"] {
        assert_eq!(
            fixture
                .runtime
                .search_ast_graph_page(&fixture.root, query, &scope(), (20, 0), "rust")
                .unwrap_err()
                .code(),
            "cgrx.invalid_ast_pattern"
        );
    }
    for (query, language, page) in [
        ("", "rust", (20, 0)),
        ("fetch(1)", "cpp", (20, 0)),
        ("fetch(1)", "rust", (0, 0)),
        ("fetch(1)", "rust", (20, 1_000_001)),
    ] {
        assert_eq!(
            fixture
                .runtime
                .search_ast_graph_page(&fixture.root, query, &scope(), page, language)
                .unwrap_err()
                .code(),
            "cgrx.invalid_arguments"
        );
    }
    let long = "a".repeat(4097);
    assert_eq!(
        fixture
            .runtime
            .search_ast_graph_page(&fixture.root, &long, &scope(), (20, 0), "rust")
            .unwrap_err()
            .code(),
        "cgrx.invalid_arguments"
    );
}

#[test]
fn oversized_source_returns_explicit_partial_coverage() {
    let fixture = Fixture::new(&[("main.rs", "fn run() { fetch(1); }\n")]);
    let file = fs::OpenOptions::new()
        .write(true)
        .open(fixture.root.join("main.rs"))
        .unwrap();
    file.set_len(16 * 1024 * 1024 + 1).unwrap();
    let report = fixture.search("fetch($ARG)", "rust", 20, 0);
    assert_eq!(report["total"], 0);
    assert_eq!(report["ast_scan"]["partial"], true);
    assert_eq!(report["ast_scan"]["searched_definitions"], 0);
    assert_eq!(report["ast_scan"]["skipped_definitions"], 1);
}
