use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};

static ID: AtomicU64 = AtomicU64::new(0);

struct Fixture {
    root: PathBuf,
    state: PathBuf,
}

impl Fixture {
    fn new(files: &[(&str, &str)]) -> Self {
        let base = std::env::temp_dir().join(format!(
            "cgrx-find-similar-{}-{}",
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
        Self { root, state }
    }

    fn runtime(&self) -> Runtime {
        Runtime::open(&self.state).unwrap()
    }

    fn scope() -> Scope {
        Scope {
            include: vec!["**/*".to_owned()],
            exclude: Vec::new(),
            relation_kinds: vec![RelationKind::Calls],
            max_depth: 1,
        }
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(self.root.parent().unwrap());
    }
}

fn duplicate_body(name: &str) -> String {
    format!(
        "fn {name}() -> u32 {{
    let first = 1;
    let second = 2;
    let third = 3;
    first + second + third
}}
"
    )
}

#[test]
fn find_similar_matches_identical_bodies_across_files_and_names() {
    let f = Fixture::new(&[
        ("a.rs", &duplicate_body("target")),
        ("b.rs", &duplicate_body("renamed_copy")),
        (
            "c.rs",
            "fn other() -> u32 {\n    let only = 40;\n    only + 2\n}\n",
        ),
    ]);
    let runtime = f.runtime();

    let result = runtime
        .find_similar("target", None, 20, &Fixture::scope())
        .unwrap();
    assert_eq!(result["matched"], 1);
    assert_eq!(result["truncated"], false);
    assert_eq!(result["root"]["qualified_name"], "target");
    assert_eq!(result["root"]["path"], "a.rs");
    assert!(result["fingerprint"].as_str().is_some());
    assert_eq!(result["matches"][0]["qualified_name"], "renamed_copy");
    assert_eq!(result["matches"][0]["path"], "b.rs");
    // The lookup is symmetric: querying the copy finds the original.
    let reverse = runtime
        .find_similar("renamed_copy", None, 20, &Fixture::scope())
        .unwrap();
    assert_eq!(reverse["matches"][0]["qualified_name"], "target");

    // A distinct body has no duplicates.
    let other = runtime
        .find_similar("other", None, 20, &Fixture::scope())
        .unwrap();
    assert_eq!(other["matched"], 0);
    assert_eq!(other["matches"], serde_json::json!([]));
}

#[test]
fn find_similar_returns_scored_near_duplicates_without_promoting_them_to_exact_matches() {
    let f = Fixture::new(&[
        (
            "a.rs",
            "fn target(input: i32) -> i32 {\n    let prepared = input + 1;\n    prepared * 2\n}\n",
        ),
        (
            "b.rs",
            "fn related(value: i32) -> i32 {\n    let output = value + 9;\n    output * 7\n}\n",
        ),
    ]);
    let runtime = f.runtime();

    let result = runtime
        .find_similar("target", None, 20, &Fixture::scope())
        .unwrap();
    assert_eq!(result["matched"], 0, "near matches must stay heuristic");
    assert_eq!(result["matches"], serde_json::json!([]));
    assert_eq!(result["similarity_index"]["ready"], true);
    assert_eq!(result["similarity_index"]["used"], true);
    assert_eq!(result["similarity_partial"], false);
    assert_eq!(result["similar_matched"], 1, "{result}");
    assert_eq!(result["similar_matches"][0]["qualified_name"], "related");
    assert!(
        result["similar_matches"][0]["similarity"]["total"]
            .as_u64()
            .unwrap()
            >= 600,
        "{result}"
    );
    assert!(
        matches!(
            result["similar_matches"][0]["relationship"].as_str(),
            Some("near_duplicate" | "similar_structure" | "similar_functionality")
        ),
        "{result}"
    );
}

#[test]
fn find_similar_links_different_structure_through_shared_proven_functionality() {
    let f = Fixture::new(&[(
        "main.rs",
        "fn persist(value: i32) { let _ = value; }\n\
         fn first(input: i32) { if input > 0 { persist(input); } }\n\
         fn second(values: &[i32]) { for value in values { persist(*value); } }\n",
    )]);
    let runtime = f.runtime();

    let result = runtime
        .find_similar("first", Some("main.rs"), 20, &Fixture::scope())
        .unwrap();
    assert_eq!(result["matched"], 0, "{result}");
    assert_eq!(result["similarity_partial"], false, "{result}");
    let functional = result["similar_matches"]
        .as_array()
        .unwrap()
        .iter()
        .find(|candidate| candidate["qualified_name"] == "second")
        .expect("shared proven callee should produce a related-code candidate");
    assert_eq!(functional["relationship"], "similar_functionality");
    assert_eq!(functional["similarity"]["callees"], 1000);
    assert!(
        result["similarity_index"]["functional_pairs"]
            .as_u64()
            .unwrap()
            >= 1,
        "{result}"
    );
}

#[test]
fn find_similar_fingerprints_are_stable_across_reopen_and_reindex() {
    let f = Fixture::new(&[
        ("a.rs", &duplicate_body("target")),
        ("b.rs", &duplicate_body("renamed_copy")),
    ]);
    let first = f
        .runtime()
        .find_similar("target", None, 20, &Fixture::scope())
        .unwrap();
    let second = f
        .runtime()
        .find_similar("target", None, 20, &Fixture::scope())
        .unwrap();
    assert_eq!(first["fingerprint"], second["fingerprint"]);

    // Reindexing after an unrelated change keeps the same fingerprint.
    fs::write(f.root.join("c.rs"), "fn unrelated() {}\n").unwrap();
    Command::new("git")
        .args(["add", "."])
        .current_dir(&f.root)
        .status()
        .unwrap();
    Command::new("git")
        .args([
            "-c",
            "user.name=Test",
            "-c",
            "user.email=test@example.invalid",
            "commit",
            "-qm",
            "unrelated",
        ])
        .current_dir(&f.root)
        .status()
        .unwrap();
    Runtime::index(&f.root, &f.state).unwrap();
    let third = f
        .runtime()
        .find_similar("target", None, 20, &Fixture::scope())
        .unwrap();
    assert_eq!(first["fingerprint"], third["fingerprint"]);
    assert_eq!(third["matched"], 1);
}

#[test]
fn changed_body_abstains_from_previous_fingerprint() {
    let f = Fixture::new(&[
        ("a.rs", &duplicate_body("target")),
        ("b.rs", &duplicate_body("renamed_copy")),
    ]);
    let before = f
        .runtime()
        .find_similar("target", None, 20, &Fixture::scope())
        .unwrap();
    assert_eq!(before["matched"], 1);

    fs::write(
        f.root.join("b.rs"),
        "fn renamed_copy() -> u32 {\n    let first = 10;\n    let second = 20;\n    first + second\n}\n",
    )
    .unwrap();
    Command::new("git")
        .args(["add", "."])
        .current_dir(&f.root)
        .status()
        .unwrap();
    Command::new("git")
        .args([
            "-c",
            "user.name=Test",
            "-c",
            "user.email=test@example.invalid",
            "commit",
            "-qm",
            "mutate copy",
        ])
        .current_dir(&f.root)
        .status()
        .unwrap();
    Runtime::index(&f.root, &f.state).unwrap();

    let runtime = f.runtime();
    let after = runtime
        .find_similar("target", None, 20, &Fixture::scope())
        .unwrap();
    // The unchanged original keeps its fingerprint and loses the match.
    assert_eq!(after["fingerprint"], before["fingerprint"]);
    assert_eq!(after["matched"], 0);
    // The mutated copy gets a new fingerprint and no longer matches anything.
    let mutated = runtime
        .find_similar("renamed_copy", None, 20, &Fixture::scope())
        .unwrap();
    assert_eq!(mutated["matched"], 0);
    assert_ne!(mutated["fingerprint"], after["fingerprint"]);
}

#[test]
fn find_similar_validates_arguments_and_missing_symbols() {
    let f = Fixture::new(&[("a.rs", &duplicate_body("target"))]);
    let runtime = f.runtime();

    let empty = runtime.find_similar("  ", None, 20, &Fixture::scope());
    assert_eq!(empty.unwrap_err().code(), "cgrx.invalid_arguments");

    let bad_limit = runtime.find_similar("target", None, 0, &Fixture::scope());
    assert_eq!(bad_limit.unwrap_err().code(), "cgrx.invalid_arguments");

    let missing = runtime.find_similar("does_not_exist", None, 20, &Fixture::scope());
    assert_eq!(missing.unwrap_err().code(), "cgrx.symbol_not_found");

    let path_mismatch = runtime.find_similar("target", Some("other.rs"), 20, &Fixture::scope());
    assert_eq!(path_mismatch.unwrap_err().code(), "cgrx.symbol_not_found");
}
