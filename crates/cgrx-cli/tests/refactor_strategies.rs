use std::fs;
use std::io::Write;
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

fn runtime() -> (TestDirectory, TestDirectory, Runtime) {
    let repository = TestDirectory::new("refactor-strategy-repository");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("service.ts"),
        "function save(value: number) {}\nfunction first(input: number) { const prepared = input + 1; save(prepared); return prepared; }\nfunction second(value: number) { const output = value + 9; save(output); return output; }\nfunction dynamic(callback: () => number) { return callback(); }\n",
    )
    .expect("write fixture");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let state = TestDirectory::new("refactor-strategy-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");
    (repository, state, runtime)
}

#[test]
fn coverage_gaps_block_destructive_strategies() {
    let (_repository, _state, runtime) = runtime();
    let result = runtime
        .suggest_refactors(
            &Scope {
                include: vec!["service.ts".to_owned()],
                exclude: Vec::new(),
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 1,
            },
            Some("typescript"),
            760,
            20,
        )
        .expect("suggest refactors");
    assert_eq!(
        result["partial"], true,
        "fixture must retain its dispatch gap"
    );
    assert!(
        result["coverage_gaps"]
            .as_array()
            .is_some_and(|gaps| !gaps.is_empty()),
        "{result}"
    );

    let strategies = result["candidates"][0]["strategies"]
        .as_array()
        .expect("strategy array");
    for strategy in &strategies[1..] {
        assert_eq!(strategy["status"], "blocked_by_gaps", "{strategy}");
        assert!(
            strategy["blocking_gaps"]
                .as_array()
                .is_some_and(|gaps| !gaps.is_empty()),
            "{strategy}"
        );
        assert_eq!(strategy["graph_delta"]["remove"], serde_json::json!([]));
    }
}

#[test]
fn strategy_identity_changes_with_snapshot_without_copying_source() {
    let (repository, _state, mut runtime) = runtime();
    let scope = Scope {
        include: vec!["service.ts".to_owned()],
        exclude: Vec::new(),
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    };
    let first = runtime
        .suggest_refactors(&scope, Some("typescript"), 760, 20)
        .expect("first suggestions");
    let repeated = runtime
        .suggest_refactors(&scope, Some("typescript"), 760, 20)
        .expect("repeat suggestions");
    assert_eq!(first, repeated);

    let first_id = first["candidates"][0]["strategies"][0]["strategy_id"]
        .as_str()
        .expect("first strategy id")
        .to_owned();
    let handoff = &first["candidates"][0]["strategies"][0]["agent_handoff"];
    let encoded = serde_json::to_string(handoff).expect("serialize handoff");
    assert!(!encoded.contains("const prepared"), "{handoff}");
    assert_eq!(
        first["candidates"][0]["strategies"][0]["graph_delta"]["add"],
        first["candidates"][0]["projection"]["add"]
    );

    fs::OpenOptions::new()
        .append(true)
        .open(repository.path().join("service.ts"))
        .expect("open fixture")
        .write_all(b"// snapshot change\n")
        .expect("change fixture");
    assert!(runtime.refresh(repository.path()).expect("refresh fixture"));
    let refreshed = runtime
        .suggest_refactors(&scope, Some("typescript"), 760, 20)
        .expect("refreshed suggestions");
    let refreshed_id = refreshed["candidates"][0]["strategies"][0]["strategy_id"]
        .as_str()
        .expect("refreshed strategy id");
    assert_ne!(first_id, refreshed_id);
}

#[test]
fn positive_candidate_has_three_snapshot_bound_strategies() {
    let (_repository, _state, runtime) = runtime();
    let result = runtime
        .suggest_refactors(
            &Scope {
                include: vec!["service.ts".to_owned()],
                exclude: Vec::new(),
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 1,
            },
            Some("typescript"),
            760,
            20,
        )
        .expect("suggest refactors");
    let strategies = result["candidates"][0]["strategies"]
        .as_array()
        .expect("strategy array");
    let policies = strategies
        .iter()
        .map(|strategy| strategy["policy"].as_str().expect("policy"))
        .collect::<Vec<_>>();

    assert_eq!(
        policies,
        [
            "preserve_entrypoints",
            "canonical_entrypoint",
            "consolidate"
        ]
    );
    assert_eq!(strategies[0]["recommended"], true);
    assert_eq!(strategies[0]["risk"], "low");
    assert_eq!(strategies[0]["verification"]["execution_status"], "not_run");
    for strategy in strategies {
        assert!(
            strategy["strategy_id"]
                .as_str()
                .is_some_and(|id| id.starts_with("strategy1.")),
            "{strategy}"
        );
    }
}
