use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

static TEST_DIRECTORY_SEQUENCE: AtomicU64 = AtomicU64::new(0);

use cgrx_cli::{OrientReport, Runtime};
use cgrx_core::{Mode, QueryRequest, RelationKind, Scope};
use cgrx_store::GenerationReader;

struct TestDirectory(PathBuf);

impl TestDirectory {
    fn new(label: &str) -> Self {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock after epoch")
            .as_nanos();
        let sequence = TEST_DIRECTORY_SEQUENCE.fetch_add(1, Ordering::Relaxed);
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
    let status = Command::new("git")
        .args(args)
        .current_dir(root)
        .status()
        .expect("git executable");
    assert!(status.success(), "git command failed: {args:?}");
}

fn fixture_repository() -> TestDirectory {
    repository_with_file(
        "runtime-repo",
        "main.py",
        b"def target():\n    return 42\n\ndef caller():\n    return target()\n",
    )
}

fn repository_with_file(label: &str, name: &str, source: &[u8]) -> TestDirectory {
    let repository = TestDirectory::new(label);
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(repository.path().join(name), source).expect("write fixture");
    git(repository.path(), &["add", name]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    repository
}

fn orient(runtime: &Runtime, task: &str, relation_kinds: Vec<RelationKind>) -> OrientReport {
    runtime
        .orient(QueryRequest {
            task: task.to_owned(),
            scope: Scope {
                include: vec!["**".to_owned()],
                exclude: Vec::new(),
                relation_kinds,
                max_depth: 4,
            },
            mode: Mode::Bounded,
            token_budget: 800,
        })
        .expect("orient query")
}

fn stored_arcs(state: &Path) -> Vec<serde_json::Value> {
    let reader = GenerationReader::open_current(state).expect("open generation");
    let bytes = reader.read_segment("nodes.seg").expect("read stored index");
    let value: serde_json::Value = serde_json::from_slice(&bytes).expect("stored index JSON");
    value["arcs"].as_array().expect("stored arcs array").clone()
}

fn stored_arc_bytes(state: &Path) -> Vec<u8> {
    let reader = GenerationReader::open_current(state).expect("open generation");
    let bytes = reader.read_segment("nodes.seg").expect("read stored index");
    let marker = b"\"arcs\":";
    let start = bytes
        .windows(marker.len())
        .position(|window| window == marker)
        .expect("arcs field")
        + marker.len();
    let mut depth = 0usize;
    let mut quoted = false;
    let mut escaped = false;
    for index in start..bytes.len() {
        let byte = bytes[index];
        if quoted {
            if escaped {
                escaped = false;
            } else if byte == b'\\' {
                escaped = true;
            } else if byte == b'"' {
                quoted = false;
            }
            continue;
        }
        match byte {
            b'"' => quoted = true,
            b'[' => depth += 1,
            b']' => {
                depth -= 1;
                if depth == 0 {
                    return bytes[start..=index].to_vec();
                }
            }
            _ => {}
        }
    }
    panic!("unterminated arcs field")
}

#[test]
fn proof_carrying_arc_values_and_order_are_stable_across_reindex() {
    let repository = repository_with_file(
        "proof-arc-repo",
        "main.rs",
        b"pub fn target() {}\npub fn caller() { target(); }\n",
    );
    let left = TestDirectory::new("proof-arc-left");
    let right = TestDirectory::new("proof-arc-right");
    Runtime::index(repository.path(), left.path()).unwrap();
    Runtime::index(repository.path(), right.path()).unwrap();
    let left_arcs = stored_arcs(left.path());
    assert!(!left_arcs.is_empty());
    assert_eq!(left_arcs, stored_arcs(right.path()));
    assert_eq!(
        stored_arc_bytes(left.path()),
        stored_arc_bytes(right.path())
    );
    assert!(left_arcs.iter().all(|arc| {
        arc["evidence"]["resolver"] == "SYNTAX_EXACT" && arc["evidence"]["confidence"] == "PROVEN"
    }));
}

#[test]
fn refresh_replaces_stale_proof_arc_with_new_call_evidence() {
    let repository = repository_with_file(
        "refresh-proof-arc-repo",
        "main.rs",
        b"pub fn old_target() {}\npub fn new_target() {}\npub fn caller() { old_target(); }\n",
    );
    let state = TestDirectory::new("refresh-proof-arc-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let mut runtime = Runtime::open(state.path()).expect("open runtime");
    let scope = Scope {
        include: vec!["main.rs".to_owned()],
        exclude: Vec::new(),
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    };

    let before = runtime
        .trace_path("old_target", Some("main.rs"), "callers", 1, &scope, 10)
        .expect("trace initial caller");
    assert_eq!(before["nodes"][0]["symbol"], "caller");

    fs::write(
        repository.path().join("main.rs"),
        b"pub fn old_target() {}\npub fn new_target() {}\npub fn caller() { new_target(); }\n",
    )
    .expect("replace call target");
    assert!(runtime.refresh(repository.path()).expect("refresh source"));

    let stale = runtime
        .trace_path("old_target", Some("main.rs"), "callers", 1, &scope, 10)
        .expect("trace removed caller");
    assert_eq!(stale["nodes"], serde_json::json!([]));

    let current = runtime
        .trace_path("new_target", Some("main.rs"), "callers", 1, &scope, 10)
        .expect("trace replacement caller");
    assert_eq!(current["nodes"][0]["symbol"], "caller");

    let oriented = orient(&runtime, "new_target", vec![RelationKind::Calls]);
    assert!(oriented.compiled.packed.records.iter().any(|record| {
        record.provenance == "SYNTAX" && record.path == "main.rs" && record.text == "caller"
    }));
}

#[test]
fn index_then_orient_returns_real_revision_bound_evidence() {
    let repository = fixture_repository();
    let state = TestDirectory::new("runtime-state");

    let indexed = Runtime::index(repository.path(), state.path()).expect("index repository");
    assert_eq!(indexed.indexed_files, 1);
    assert!(indexed.index_input_bytes > 0);

    let runtime = Runtime::open(state.path()).expect("open runtime");
    let output = runtime
        .orient(QueryRequest {
            task: "target".to_owned(),
            scope: Scope {
                include: vec!["**".to_owned()],
                exclude: Vec::new(),
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 4,
            },
            mode: Mode::Bounded,
            token_budget: 800,
        })
        .expect("orient query");

    assert_eq!(output.snapshot, indexed.snapshot);
    assert!(
        output
            .compiled
            .packed
            .records
            .iter()
            .any(|record| record.path == "main.py" && record.text.contains("target"))
    );
    assert!(output.compiled.packed.tokens <= 800);
    let call = output
        .compiled
        .packed
        .records
        .iter()
        .find(|record| record.provenance == "CALLS")
        .expect("call-site evidence");
    assert_eq!((call.span_start, call.span_end), (54, 62));
    assert_eq!(call.text, "    return target()\n");
    assert_eq!(
        output.compiled.packed.accounting.index_input_bytes,
        indexed.index_input_bytes
    );
    assert_eq!(output.compiled.packed.accounting.probe_input_bytes, 0);
    output
        .compiled
        .packed
        .verify_accounting()
        .expect("runtime accounting matches packed records");
}

#[test]
fn exact_symbol_query_keeps_its_direct_call_graph_neighbor() {
    let repository = repository_with_file(
        "exact-graph-neighbor",
        "main.rs",
        br#"fn graphTarget() {}

fn graphCaller() {
    graphTarget();
}
"#,
    );
    let state = TestDirectory::new("exact-graph-neighbor-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = orient(&runtime, "graphCaller", vec![RelationKind::Calls]);
    let symbols: Vec<_> = output
        .compiled
        .packed
        .records
        .iter()
        .filter(|record| record.provenance == "SYNTAX")
        .map(|record| record.text.as_str())
        .collect();

    assert!(symbols.contains(&"graphCaller"), "records: {symbols:?}");
    assert!(symbols.contains(&"graphTarget"), "records: {symbols:?}");
}

#[test]
fn exact_target_query_keeps_its_direct_caller_graph_neighbor() {
    let repository = repository_with_file(
        "exact-caller-neighbor",
        "main.rs",
        br#"fn inboundTarget() {}

fn inboundCaller() {
    inboundTarget();
}
"#,
    );
    let state = TestDirectory::new("exact-caller-neighbor-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = orient(&runtime, "inboundTarget", vec![RelationKind::Calls]);
    let symbols: Vec<_> = output
        .compiled
        .packed
        .records
        .iter()
        .filter(|record| record.provenance == "SYNTAX")
        .map(|record| record.text.as_str())
        .collect();

    assert!(symbols.contains(&"inboundTarget"), "records: {symbols:?}");
    assert!(symbols.contains(&"inboundCaller"), "records: {symbols:?}");
}

#[test]
fn call_graph_prefers_a_same_file_definition_over_a_duplicate_name() {
    let repository = TestDirectory::new("same-file-graph-target");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("a.rs"),
        b"fn localTarget() {}\nfn graphCaller() { localTarget(); }\n",
    )
    .expect("write caller fixture");
    fs::write(
        repository.path().join("z.rs"),
        b"fn localTarget() { panic!(\"wrong target\"); }\n",
    )
    .expect("write duplicate fixture");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("same-file-graph-target-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = orient(&runtime, "graphCaller", vec![RelationKind::Calls]);
    let targets: Vec<_> = output
        .compiled
        .packed
        .records
        .iter()
        .filter(|record| record.provenance == "SYNTAX" && record.text == "localTarget")
        .map(|record| record.path.as_str())
        .collect();

    assert_eq!(targets, vec!["a.rs"]);
}

#[test]
fn call_graph_assigns_a_call_to_the_smallest_containing_definition_body() {
    let repository = repository_with_file(
        "containing-graph-owner",
        "main.rs",
        br#"fn graphTarget() {}

fn actualCaller() {
    fn precedingDecoy() {}
    graphTarget();
}
"#,
    );
    let state = TestDirectory::new("containing-graph-owner-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = orient(&runtime, "actualCaller", vec![RelationKind::Calls]);
    let symbols: Vec<_> = output
        .compiled
        .packed
        .records
        .iter()
        .filter(|record| record.provenance == "SYNTAX")
        .map(|record| record.text.as_str())
        .collect();

    assert!(symbols.contains(&"graphTarget"), "records: {symbols:?}");
    assert!(!symbols.contains(&"precedingDecoy"), "records: {symbols:?}");
}

#[test]
fn call_graph_resolves_a_unique_cross_file_definition() {
    let repository = TestDirectory::new("unique-cross-file-graph-target");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("caller.rs"),
        b"fn crossFileCaller() { uniqueTarget(); }\n",
    )
    .expect("write caller fixture");
    fs::write(
        repository.path().join("target.rs"),
        b"fn uniqueTarget() {}\n",
    )
    .expect("write target fixture");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("unique-cross-file-graph-target-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = orient(&runtime, "crossFileCaller", vec![RelationKind::Calls]);
    assert!(output.compiled.packed.records.iter().any(|record| {
        record.provenance == "SYNTAX" && record.path == "target.rs" && record.text == "uniqueTarget"
    }));
}

#[test]
fn call_graph_resolves_rust_self_qualified_calls_to_the_same_file_symbol() {
    let repository = repository_with_file(
        "rust-self-qualified-call",
        "runtime.rs",
        b"struct Runtime;\nimpl Runtime { fn index() { Self::index_source(); } fn index_source() {} }\n",
    );
    let state = TestDirectory::new("rust-self-qualified-call-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = runtime
        .trace_path(
            "index_source",
            Some("runtime.rs"),
            "callers",
            1,
            &Scope {
                include: vec!["**/*.rs".to_owned()],
                exclude: vec![],
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 1,
            },
            20,
        )
        .expect("trace self-qualified call");

    assert_eq!(output["nodes"][0]["symbol"], "index");
}

#[test]
fn call_graph_uses_go_import_qualifier_to_disambiguate_duplicate_constructors() {
    let repository = TestDirectory::new("go-qualified-call-target");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::create_dir_all(repository.path().join("memory")).expect("create memory package");
    fs::create_dir_all(repository.path().join("terminal")).expect("create terminal package");
    fs::write(
        repository.path().join("main.go"),
        b"package main\nimport \"example.test/memory\"\nfunc Build() { memory.NewManager() }\n",
    )
    .expect("write caller");
    fs::write(
        repository.path().join("memory/manager.go"),
        b"package memory\nfunc NewManager() {}\n",
    )
    .expect("write expected target");
    fs::write(
        repository.path().join("terminal/manager.go"),
        b"package terminal\nfunc NewManager() {}\n",
    )
    .expect("write duplicate target");
    // Package identity requires a module manifest, not directory-name guessing.
    fs::write(
        repository.path().join("go.mod"),
        "module example.test\ngo 1.23\n",
    )
    .expect("write module identity");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("go-qualified-call-target-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = runtime
        .trace_path(
            "Build",
            Some("main.go"),
            "callees",
            1,
            &Scope {
                include: vec!["**/*.go".to_owned()],
                exclude: vec![],
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 1,
            },
            20,
        )
        .expect("trace qualified call");

    assert_eq!(output["nodes"][0]["path"], "memory/manager.go");
    assert_eq!(output["nodes"][0]["symbol"], "NewManager");
}

#[test]
fn call_graph_prefers_the_same_go_package_directory_for_unqualified_calls() {
    let repository = TestDirectory::new("go-package-call-target");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::create_dir_all(repository.path().join("internal/auth")).expect("create auth package");
    fs::create_dir_all(repository.path().join("internal/app")).expect("create app package");
    fs::write(
        repository.path().join("internal/auth/caller.go"),
        b"package auth\nfunc Confirm() { validateUser() }\n",
    )
    .expect("write caller");
    fs::write(
        repository.path().join("internal/auth/target.go"),
        b"package auth\nfunc validateUser() {}\n",
    )
    .expect("write package target");
    fs::write(
        repository.path().join("internal/app/target.go"),
        b"package app\nfunc validateUser() {}\n",
    )
    .expect("write duplicate target");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("go-package-call-target-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = runtime
        .trace_path(
            "validateUser",
            Some("internal/auth/target.go"),
            "callers",
            1,
            &Scope {
                include: vec!["internal/**/*.go".to_owned()],
                exclude: vec![],
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 1,
            },
            20,
        )
        .expect("trace same-package call");

    assert_eq!(output["nodes"][0]["path"], "internal/auth/caller.go");
    assert_eq!(output["nodes"][0]["symbol"], "Confirm");
}

#[test]
fn call_graph_skips_an_ambiguous_cross_file_definition() {
    let repository = TestDirectory::new("ambiguous-cross-file-graph-target");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("caller.rs"),
        b"fn ambiguousCaller() { duplicateTarget(); }\n",
    )
    .expect("write caller fixture");
    fs::write(repository.path().join("a.rs"), b"fn duplicateTarget() {}\n")
        .expect("write first target fixture");
    fs::write(repository.path().join("b.rs"), b"fn duplicateTarget() {}\n")
        .expect("write second target fixture");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("ambiguous-cross-file-graph-target-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = orient(&runtime, "ambiguousCaller", vec![RelationKind::Calls]);
    assert!(
        !output
            .compiled
            .packed
            .records
            .iter()
            .any(|record| { record.provenance == "SYNTAX" && record.text == "duplicateTarget" })
    );
}

#[test]
fn exact_camel_case_symbol_respects_include_and_exclude_scope() {
    let repository = TestDirectory::new("exact-tsx-scope-repo");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::create_dir_all(repository.path().join("frontend/src/pages")).expect("create pages");
    fs::write(
        repository
            .path()
            .join("frontend/src/pages/TeamDashboard.tsx"),
        b"interface Team { id: string }\nexport default function TeamDashboard() { return <div /> }\n",
    )
    .expect("write target TSX");
    fs::write(
        repository.path().join("frontend/src/pages/Other.tsx"),
        b"export function TeamDashboardHelper() { return <div /> }\n",
    )
    .expect("write decoy TSX");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("exact-tsx-scope-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = runtime
        .orient(QueryRequest {
            task: "TeamDashboard component team dashboard".to_owned(),
            scope: Scope {
                include: vec!["frontend/src/pages/**".to_owned()],
                exclude: vec!["frontend/src/pages/Other.tsx".to_owned()],
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 4,
            },
            mode: Mode::Bounded,
            token_budget: 800,
        })
        .expect("orient TSX symbol");
    let records = &output.compiled.packed.records;
    assert_eq!(records.len(), 1);
    assert_eq!(records[0].path, "frontend/src/pages/TeamDashboard.tsx");
    assert_eq!(records[0].text, "TeamDashboard");
    assert!(
        records
            .iter()
            .all(|record| record.path == "frontend/src/pages/TeamDashboard.tsx")
    );
}

#[test]
fn refresh_restores_the_base_snapshot_after_a_tracked_file_reverts() {
    let repository = fixture_repository();
    let state = TestDirectory::new("refresh-state");
    let indexed = Runtime::index(repository.path(), state.path()).expect("index repository");
    let mut runtime = Runtime::open(state.path()).expect("open runtime");

    fs::write(
        repository.path().join("main.py"),
        b"def changed_target():\n    return 7\n",
    )
    .expect("change tracked source");
    assert!(runtime.refresh(repository.path()).expect("refresh change"));
    assert_eq!(runtime.changed_paths(), vec!["main.py"]);
    assert_ne!(runtime.snapshot(), &indexed.snapshot);
    assert!(
        orient(&runtime, "changed_target", vec![RelationKind::Calls])
            .compiled
            .packed
            .records
            .iter()
            .any(|record| record.text.contains("changed_target"))
    );

    fs::write(
        repository.path().join("main.py"),
        b"def target():\n    return 42\n\ndef caller():\n    return target()\n",
    )
    .expect("restore tracked source");
    assert!(runtime.refresh(repository.path()).expect("refresh revert"));
    assert!(runtime.changed_paths().is_empty());
    assert_eq!(runtime.snapshot(), &indexed.snapshot);
    assert!(
        orient(&runtime, "target", vec![RelationKind::Calls])
            .compiled
            .packed
            .records
            .iter()
            .any(|record| record.text.contains("target"))
    );
}

#[test]
fn unchanged_dirty_source_is_not_read_again_on_warm_refresh() {
    let repository = fixture_repository();
    let state = TestDirectory::new("warm-refresh-metadata-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let mut runtime = Runtime::open(state.path()).expect("open runtime");

    fs::write(
        repository.path().join("main.py"),
        b"def warm_target():\n    return 7\n",
    )
    .expect("change tracked source");
    assert!(runtime.refresh(repository.path()).expect("refresh change"));
    assert!(
        orient(&runtime, "warm_target", vec![RelationKind::Calls])
            .compiled
            .packed
            .accounting
            .probe_input_bytes
            > 0
    );

    assert!(!runtime.refresh(repository.path()).expect("warm refresh"));
    assert_eq!(
        orient(&runtime, "warm_target", vec![RelationKind::Calls])
            .compiled
            .packed
            .accounting
            .probe_input_bytes,
        0
    );

    fs::write(
        repository.path().join("main.py"),
        b"def next_target():\n    return 8\n",
    )
    .expect("change cached source with the same length");
    assert!(runtime.refresh(repository.path()).expect("refresh again"));
    assert!(
        orient(&runtime, "next_target", vec![RelationKind::Calls])
            .compiled
            .packed
            .records
            .iter()
            .any(|record| record.text.contains("next_target"))
    );
}

#[test]
fn refresh_status_tracks_both_sides_of_a_staged_rename() {
    let repository = fixture_repository();
    let state = TestDirectory::new("refresh-rename-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let mut runtime = Runtime::open(state.path()).expect("open runtime");

    git(repository.path(), &["mv", "main.py", "renamed source.py"]);

    assert!(runtime.refresh(repository.path()).expect("refresh rename"));
    assert_eq!(
        runtime.changed_paths(),
        vec!["main.py".to_owned(), "renamed source.py".to_owned()]
    );
    let records = orient(&runtime, "target", vec![RelationKind::Calls])
        .compiled
        .packed
        .records;
    assert!(
        records
            .iter()
            .any(|record| record.path == "renamed source.py")
    );
    assert!(records.iter().all(|record| record.path != "main.py"));
}

#[test]
fn refresh_ignores_sources_below_a_nested_git_boundary() {
    let repository =
        repository_with_file("nested-git-boundary", "main.rs", b"fn root_symbol() {}\n");
    fs::write(repository.path().join(".gitignore"), b"feature/ignored/\n")
        .expect("write ignore rule");
    git(repository.path(), &["add", ".gitignore"]);
    git(repository.path(), &["commit", "-qm", "ignore fixture"]);
    let state = TestDirectory::new("nested-git-boundary-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let mut runtime = Runtime::open(state.path()).expect("open runtime");

    let nested = repository.path().join("worktrees/stale");
    fs::create_dir_all(&nested).expect("create nested worktree");
    fs::write(nested.join(".git"), b"gitdir: /missing/nested/worktree\n")
        .expect("write nested git marker");
    fs::write(nested.join("nested.rs"), b"fn nested_symbol() {}\n").expect("write nested source");

    let feature = repository.path().join("feature");
    fs::create_dir_all(&feature).expect("create ordinary untracked directory");
    fs::write(feature.join("new.rs"), b"fn untracked_symbol() {}\n")
        .expect("write ordinary untracked source");
    let ignored = feature.join("ignored");
    fs::create_dir_all(&ignored).expect("create ignored directory");
    fs::write(ignored.join("ignored.rs"), b"fn ignored_symbol() {}\n")
        .expect("write ignored source");

    assert!(runtime.refresh(repository.path()).expect("refresh root"));
    assert_eq!(runtime.changed_paths(), vec!["feature/new.rs"]);
    let records = orient(&runtime, "nested_symbol", vec![RelationKind::Calls])
        .compiled
        .packed
        .records;
    assert!(
        records
            .iter()
            .all(|record| record.path != "worktrees/stale/nested.rs"),
        "nested records: {records:?}"
    );
    let records = orient(&runtime, "untracked_symbol", vec![RelationKind::Calls])
        .compiled
        .packed
        .records;
    assert!(
        records
            .iter()
            .any(|record| record.path == "feature/new.rs" && record.text == "untracked_symbol"),
        "untracked records: {records:?}"
    );

    fs::write(feature.join("another.rs"), b"fn another_symbol() {}\n")
        .expect("write another untracked source");
    assert!(
        runtime
            .refresh(repository.path())
            .expect("refresh new child")
    );
    assert!(
        runtime
            .changed_paths()
            .contains(&"feature/another.rs".to_owned())
    );
}

#[test]
fn refresh_bounds_large_untracked_artifact_trees_and_reports_the_gap() {
    let repository = repository_with_file(
        "bounded-untracked-tree",
        "main.rs",
        b"fn root_symbol() {}\n",
    );
    let state = TestDirectory::new("bounded-untracked-tree-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let mut runtime = Runtime::open(state.path()).expect("open runtime");

    let artifacts = repository.path().join("a-transactions");
    for index in 0..300 {
        let directory = artifacts.join(format!("copy-{index:03}"));
        fs::create_dir_all(&directory).expect("create artifact directory");
        fs::write(
            directory.join("copied.rs"),
            format!("fn copied_{index}() {{}}\n"),
        )
        .expect("write copied source");
    }
    fs::write(
        repository.path().join("z-direct.rs"),
        b"fn direct_symbol() {}\n",
    )
    .expect("write direct untracked source");

    assert!(runtime.refresh(repository.path()).expect("refresh root"));
    assert!(runtime.coverage().traversal_truncated);
    assert!(runtime.changed_paths().contains(&"z-direct.rs".to_owned()));
    assert!(runtime.changed_paths().len() <= 65);
}

#[test]
fn refresh_fails_closed_when_head_changes() {
    let repository = fixture_repository();
    let state = TestDirectory::new("revision-change-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let mut runtime = Runtime::open(state.path()).expect("open runtime");
    fs::write(
        repository.path().join("main.py"),
        b"def replacement():\n    return 99\n",
    )
    .expect("replace tracked source");
    git(repository.path(), &["add", "main.py"]);
    git(repository.path(), &["commit", "-qm", "new revision"]);

    let error = runtime
        .refresh(repository.path())
        .expect_err("new HEAD requires full indexing");
    assert_eq!(error.code(), "revision_changed");
}

#[test]
#[ignore = "release-only watcher latency contract"]
fn watched_single_file_refresh_p95_is_under_fifty_milliseconds() {
    let repository = fixture_repository();
    let state = TestDirectory::new("refresh-latency-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let mut runtime = Runtime::open(state.path()).expect("open runtime");
    let mut durations = Vec::new();
    for iteration in 0..100 {
        let source = if iteration % 2 == 0 {
            b"def target_even():\n    return 42\n".as_slice()
        } else {
            b"def target_odd():\n    return 43\n".as_slice()
        };
        fs::write(repository.path().join("main.py"), source).expect("write changed source");
        let started = Instant::now();
        runtime.refresh(repository.path()).expect("refresh source");
        durations.push(started.elapsed());
    }
    durations.sort();
    let p50 = durations[49];
    let p95 = durations[94];
    let p99 = durations[98];
    println!("watch_refresh_p50_ns={}", p50.as_nanos());
    println!("watch_refresh_p95_ns={}", p95.as_nanos());
    println!("watch_refresh_p99_ns={}", p99.as_nanos());
    assert!(p95 < Duration::from_millis(50), "p95 was {p95:?}");
}

#[test]
fn task_aware_evidence_keeps_dynamic_route_implements_and_overload_spans() {
    let source = br#"function GetRoute(path: string) { return path; }
class Controller {
  @GetRoute("/users")
  list(): string[] { return []; }
}
interface Worker { run(): string; }
class LocalWorker implements Worker { run(): string { return "local"; } }
class RemoteWorker implements Worker { run(): string { return "remote"; } }
function execute(worker: Worker): string { return worker.run(); }
function format(value: string): string;
function format(value: number): string;
function format(value: string | number): string { return String(value); }
const shown = format(42);
const method = "run";
const service = new LocalWorker();
service[method]();
"#;
    let repository = repository_with_file("task-aware-evidence", "main.ts", source);
    let state = TestDirectory::new("task-aware-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let route = orient(
        &runtime,
        "Which method handles the decorated route?",
        vec![RelationKind::Calls],
    );
    let route_spans: Vec<_> = route
        .compiled
        .packed
        .records
        .iter()
        .filter(|record| record.provenance == "ROUTE_HANDLER")
        .map(|record| &source[record.span_start..record.span_end])
        .collect();
    assert_eq!(route_spans, vec![b"list(): string[]".as_slice()]);

    let implementations = orient(
        &runtime,
        "Which implementations may receive the Worker call?",
        vec![RelationKind::Calls, RelationKind::Implements],
    );
    let mut implementation_spans: Vec<_> = implementations
        .compiled
        .packed
        .records
        .iter()
        .filter(|record| record.provenance == "IMPLEMENTS")
        .map(|record| &source[record.span_start..record.span_end])
        .collect();
    implementation_spans.sort();
    assert_eq!(
        implementation_spans,
        vec![
            b"class LocalWorker implements Worker".as_slice(),
            b"class RemoteWorker implements Worker".as_slice(),
        ]
    );
    assert!(
        implementations
            .compiled
            .packed
            .records
            .iter()
            .any(|record| {
                record.provenance == "CALLS"
                    && &source[record.span_start..record.span_end] == b"worker.run()"
            })
    );

    let overload = orient(
        &runtime,
        "Which overload call receives a number?",
        vec![RelationKind::Calls],
    );
    assert!(overload.compiled.packed.records.iter().any(|record| {
        record.provenance == "CALLS" && &source[record.span_start..record.span_end] == b"format(42)"
    }));

    let dynamic = orient(
        &runtime,
        "What dynamic property call cannot be statically closed?",
        vec![RelationKind::Calls],
    );
    assert!(dynamic.compiled.packed.records.iter().any(|record| {
        record.provenance == "CALLS"
            && &source[record.span_start..record.span_end] == b"service[method]()"
    }));
}

#[test]
fn task_aware_evidence_generalizes_to_unseen_english_and_russian_paraphrases() {
    let source = br#"function GetRoute(path: string) { return path; }
class Controller {
  @GetRoute("/users")
  list(): string[] { return []; }
}
interface Worker { run(): string; }
class LocalWorker implements Worker { run(): string { return "local"; } }
function execute(worker: Worker): string { return worker.run(); }
function format(value: string): string;
function format(value: number): string;
function format(value: string | number): string { return String(value); }
const shown = format(42);
const method = "run";
const service = new LocalWorker();
service[method]();
"#;
    let repository = repository_with_file("intent-holdout", "main.ts", source);
    let state = TestDirectory::new("intent-holdout-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    for task in [
        "Which handler serves the annotated endpoint?",
        "Какой метод обслуживает маршрут с декоратором?",
    ] {
        let output = orient(&runtime, task, vec![RelationKind::Calls]);
        assert!(
            output.compiled.packed.records.iter().any(|record| {
                record.provenance == "ROUTE_HANDLER"
                    && &source[record.span_start..record.span_end] == b"list(): string[]"
            }),
            "route intent was not recognized: {task}"
        );
    }

    for task in [
        "Which concrete classes can handle the Worker interface invocation?",
        "Какие реализации могут получить вызов интерфейса Worker?",
    ] {
        let output = orient(
            &runtime,
            task,
            vec![RelationKind::Calls, RelationKind::Implements],
        );
        assert!(
            output.compiled.packed.records.iter().any(|record| {
                record.provenance == "IMPLEMENTS"
                    && &source[record.span_start..record.span_end]
                        == b"class LocalWorker implements Worker"
            }),
            "implementation intent was not recognized: {task}"
        );
    }

    for task in [
        "Find the invocation that selects the numeric signature",
        "Найди вызов перегрузки с числовым аргументом",
    ] {
        let output = orient(&runtime, task, vec![RelationKind::Calls]);
        assert!(
            output.compiled.packed.records.iter().any(|record| {
                record.provenance == "CALLS"
                    && &source[record.span_start..record.span_end] == b"format(42)"
            }),
            "overload intent was not recognized: {task}"
        );
    }

    for task in [
        "Show the computed member invocation that static analysis cannot close",
        "Какой вызов через динамическое свойство нельзя разрешить статически?",
    ] {
        let output = orient(&runtime, task, vec![RelationKind::Calls]);
        assert!(
            output.compiled.packed.records.iter().any(|record| {
                record.provenance == "CALLS"
                    && &source[record.span_start..record.span_end] == b"service[method]()"
            }),
            "dynamic-property intent was not recognized: {task}"
        );
    }
}

#[test]
fn unrelated_task_does_not_activate_specialized_task_evidence() {
    let source = br#"function GetRoute(path: string) { return path; }
class Controller {
  @GetRoute("/users")
  list(): string[] { return []; }
}
"#;
    let repository = repository_with_file("intent-negative", "main.ts", source);
    let state = TestDirectory::new("intent-negative-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = orient(
        &runtime,
        "Explain how this module formats log messages",
        vec![RelationKind::Calls],
    );
    assert!(
        output
            .compiled
            .packed
            .records
            .iter()
            .all(|record| record.provenance != "ROUTE_HANDLER")
    );
}

#[test]
fn overloads_are_not_reported_as_dynamic_dispatch_coverage() {
    let source = br#"function format(value: string): string;
function format(value: number): string;
function format(value: string | number): string { return String(value); }
"#;
    let repository = repository_with_file("coverage-kinds", "main.ts", source);
    let state = TestDirectory::new("coverage-kinds-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    assert!(
        runtime.coverage().dynamic_dispatch.is_empty(),
        "overload-only source must not be labeled dynamic dispatch: {:?}",
        runtime.coverage().dynamic_dispatch
    );
}

#[test]
fn nested_dynamic_calls_share_one_coverage_gap_but_keep_inner_evidence() {
    let source = b"items.filter((item) => service[method]());\n";
    let repository = repository_with_file("nested-dispatch", "main.ts", source);
    let state = TestDirectory::new("nested-dispatch-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    assert_eq!(
        runtime.coverage().dynamic_dispatch,
        [format!("main.ts:0-{}", source.len() - 2)]
    );
    let output = orient(
        &runtime,
        "What dynamic property call cannot be statically closed?",
        vec![RelationKind::Calls],
    );
    assert!(
        output
            .compiled
            .packed
            .records
            .iter()
            .any(|record| { record.text == "service[method]()" })
    );
}

#[test]
fn exact_rust_symbol_query_prefers_definition_over_call_site() {
    let source = br#"struct Runtime;
impl Runtime {
    fn refresh(&mut self) {}
}
fn use_runtime(runtime: &mut Runtime) {
    runtime.refresh();
}
"#;
    let repository = repository_with_file("rust-symbol-query", "runtime.rs", source);
    let state = TestDirectory::new("rust-symbol-query-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = orient(&runtime, "Runtime.refresh", vec![RelationKind::Calls]);
    assert!(output.compiled.packed.records.iter().any(|record| {
        record.provenance == "SYNTAX" && record.path == "runtime.rs" && record.text == "refresh"
    }));
}

#[test]
fn rust_coverage_reports_unproven_receivers_and_preserves_self_calls() {
    let source = br#"trait Worker { fn run(&self); }
struct Runtime;
impl Runtime {
    fn refresh(&self) {}
    fn execute(&self) { self.refresh(); }
}
fn run_generic<T: Worker>(worker: &T) { worker.run(); }
fn run_dynamic(worker: &dyn Worker) { worker.run(); }
fn run_local(worker: &dyn Worker) {
    let alias: &dyn Worker = worker;
    alias.run();
}
struct Holder<'a> { worker: &'a dyn Worker }
impl Holder<'_> { fn run(&self) { self.worker.run(); } }
"#;
    let repository = repository_with_file("rust-dispatch-coverage", "runtime.rs", source);
    let state = TestDirectory::new("rust-dispatch-coverage-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let worker_call = b"worker.run()";
    let worker_starts: Vec<_> = source
        .windows(worker_call.len())
        .enumerate()
        .filter_map(|(start, window)| (window == worker_call).then_some(start))
        .collect();
    let mut expected: Vec<_> = worker_starts[..2]
        .iter()
        .map(|start| format!("runtime.rs:{start}-{}", start + worker_call.len()))
        .collect();
    for dynamic_call in [b"alias.run()".as_slice(), b"self.worker.run()"] {
        let start = source
            .windows(dynamic_call.len())
            .position(|window| window == dynamic_call)
            .expect("dynamic call exists");
        expected.push(format!("runtime.rs:{start}-{}", start + dynamic_call.len()));
    }
    expected.sort();
    assert_eq!(runtime.coverage().dynamic_dispatch, expected);

    let trace = runtime
        .trace_path(
            "refresh",
            Some("runtime.rs"),
            "callers",
            1,
            &Scope {
                include: vec!["runtime.rs".to_owned()],
                exclude: Vec::new(),
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 1,
            },
            50,
        )
        .expect("trace refresh callers");
    assert_eq!(trace["nodes"][0]["symbol"], "execute");
}

#[test]
fn natural_language_query_prefers_definition_body_over_test_call_site() {
    let repository = TestDirectory::new("definition-body-query");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::create_dir_all(repository.path().join("src")).expect("create src");
    fs::create_dir_all(repository.path().join("tests")).expect("create tests");
    fs::write(
        repository.path().join("src/runtime.rs"),
        br#"pub fn refresh_watched_files() {
    let tracked_file_changed = true;
    if tracked_file_changed {
        invalidate_expansion_handles();
    }
}

fn invalidate_expansion_handles() {}
"#,
    )
    .expect("write production source");
    fs::write(
        repository.path().join("tests/watcher.rs"),
        br#"fn watcher_test() {
    refresh_watched_files();
}
"#,
    )
    .expect("write call-site decoy");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let state = TestDirectory::new("definition-body-query-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = orient(
        &runtime,
        "Where does watched refresh changed tracked files invalidate expansion handles?",
        vec![RelationKind::Calls],
    );
    assert!(output.compiled.packed.records.iter().any(|record| {
        record.provenance == "SYNTAX"
            && record.path == "src/runtime.rs"
            && record.text == "refresh_watched_files"
    }));
}

#[test]
fn natural_language_query_stems_watcher_and_indexing_to_the_refresh_guard() {
    let source = br#"struct Runtime;
impl Runtime {
    fn index() {
        let head = "HEAD";
        require_indexing(head);
    }
    fn refresh() {
        let revision = "HEAD";
        if revision_changed(revision) {
            panic!("watched HEAD changed; run cgrx index");
        }
    }
}
"#;
    let repository = repository_with_file("stemmed-definition-query", "runtime.rs", source);
    let state = TestDirectory::new("stemmed-definition-query-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = orient(
        &runtime,
        "Where does the watcher reject a changed HEAD and require full indexing?",
        vec![RelationKind::Calls],
    );
    assert!(output.compiled.packed.records.iter().any(|record| {
        record.provenance == "SYNTAX" && record.path == "runtime.rs" && record.text == "refresh"
    }));
}

#[test]
fn graph_neighbors_do_not_become_required_anchors_under_a_small_budget() {
    let mut source = String::new();
    for index in 0..20 {
        source.push_str(&format!("fn graphDependency{index}() {{}}\n"));
    }
    source.push_str("fn budgetedGraphCaller() {\n");
    for index in 0..20 {
        source.push_str(&format!("    graphDependency{index}();\n"));
    }
    source.push_str("}\n");
    let repository = repository_with_file("budgeted-graph-neighbors", "main.rs", source.as_bytes());
    let state = TestDirectory::new("budgeted-graph-neighbors-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let output = runtime
        .orient(QueryRequest {
            task: "budgetedGraphCaller".to_owned(),
            scope: Scope {
                include: vec!["**".to_owned()],
                exclude: Vec::new(),
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 1,
            },
            mode: Mode::Bounded,
            token_budget: 200,
        })
        .expect("orient budgeted graph");

    assert!(output.compiled.packed.tokens <= 200);
    assert!(
        output.compiled.packed.records.iter().any(|record| {
            record.provenance == "SYNTAX" && record.text == "budgetedGraphCaller"
        }),
        "tokens={} records={:?}",
        output.compiled.packed.tokens,
        output
            .compiled
            .packed
            .records
            .iter()
            .map(|record| (&record.text, &record.path))
            .collect::<Vec<_>>()
    );
    assert!(output.compiled.packed.records.len() < 21);
}

#[test]
fn search_graph_ranks_exact_symbols_and_reports_degrees_deterministically() {
    let repository = repository_with_file(
        "search-graph-runtime",
        "main.rs",
        br#"fn target() {}
fn targetHelper() { target(); }
fn caller() { target(); }
"#,
    );
    let state = TestDirectory::new("search-graph-runtime-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");
    let scope = Scope {
        include: vec!["**".to_owned()],
        exclude: Vec::new(),
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 4,
    };

    let first = runtime
        .search_graph("target", &scope, 1)
        .expect("search graph");
    let second = runtime
        .search_graph("target", &scope, 1)
        .expect("repeat search graph");

    assert_eq!(first, second);
    assert_eq!(first["matches"][0]["symbol"], "target");
    assert_eq!(first["matches"][0]["callers"], 2);
    assert_eq!(first["matches"][0]["callees"], 0);
    assert_eq!(first["total"], 2);
    assert_eq!(first["truncated"], true);
    assert_eq!(first["matches"][0]["matched_by"], "symbol");
}

#[test]
fn search_graph_can_search_bodies_and_filter_every_supported_language() {
    let repository = TestDirectory::new("filtered-body-search");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    let fixtures = [
        (
            "feature.ts",
            "function tsFeature() { return 'body_token_ts'; }\n",
        ),
        (
            "feature.tsx",
            "function tsxFeature() { return <div>body_token_tsx</div>; }\n",
        ),
        (
            "feature.go",
            "package sample\nfunc goFeature() string { return \"body_token_go\" }\n",
        ),
        (
            "feature.py",
            "def py_feature():\n    return 'body_token_py'\n",
        ),
        (
            "feature.rs",
            "fn rust_feature() -> &'static str { \"body_token_rs\" }\n",
        ),
    ];
    for (path, source) in fixtures {
        fs::write(repository.path().join(path), source).expect("write language fixture");
    }
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("filtered-body-search-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");
    let scope = Scope {
        include: vec!["**".to_owned()],
        exclude: Vec::new(),
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 4,
    };

    let cases = [
        ("typescript", "body_token_ts", 2),
        ("go", "body_token_go", 1),
        ("python", "body_token_py", 1),
        ("rust", "body_token_rs", 1),
    ];
    for (language, query, expected) in cases {
        let result = runtime
            .search_graph_filtered(query, &scope, 10, Some(language), true)
            .expect("search filtered body");
        assert_eq!(result["total"], expected, "{language}: {result}");
        assert!(
            result["matches"]
                .as_array()
                .unwrap()
                .iter()
                .all(|item| item["matched_by"] == "body"),
            "{language}: {result}"
        );
    }

    let names_only = runtime
        .search_graph_filtered("body_token_rs", &scope, 10, Some("rust"), false)
        .expect("search names only");
    assert_eq!(names_only["total"], 0);
    let error = runtime
        .search_graph_filtered("anything", &scope, 10, Some("java"), true)
        .expect_err("unsupported language fails closed");
    assert_eq!(error.code(), "cgrx.invalid_arguments");
}

#[test]
fn get_outline_lists_symbols_in_source_order_for_every_supported_extension() {
    let repository = TestDirectory::new("file-outline");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    let fixtures = [
        (
            "outline.ts",
            "function tsFirst() {}\nfunction tsSecond() {}\n",
            "typescript",
        ),
        (
            "outline.tsx",
            "function tsxFirst() { return <div />; }\nfunction tsxSecond() { return <span />; }\n",
            "typescript",
        ),
        (
            "outline.go",
            "package sample\nfunc goFirst() {}\nfunc goSecond() {}\n",
            "go",
        ),
        (
            "outline.py",
            "def py_first():\n    pass\n\ndef py_second():\n    pass\n",
            "python",
        ),
        (
            "outline.rs",
            "fn rust_first() {}\nfn rust_second() {}\n",
            "rust",
        ),
    ];
    for (path, source, _) in fixtures {
        fs::write(repository.path().join(path), source).expect("write outline fixture");
    }
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("file-outline-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    for (path, _, language) in fixtures {
        let outline = runtime.get_outline(path, 1).expect("get file outline");
        assert_eq!(outline["path"], path);
        assert_eq!(outline["language"], language);
        assert_eq!(outline["total"], 2, "{path}: {outline}");
        assert_eq!(outline["symbols"].as_array().unwrap().len(), 1);
        assert_eq!(outline["truncated"], true);
    }

    let error = runtime
        .get_outline("missing.rs", 20)
        .expect_err("missing indexed path fails closed");
    assert_eq!(error.code(), "cgrx.path_not_indexed");
}

#[test]
fn trace_path_walks_callers_to_the_requested_depth() {
    let repository = repository_with_file(
        "trace-path-runtime",
        "main.rs",
        br#"fn target() {}
fn middle() { target(); }
fn top() { middle(); }
"#,
    );
    let state = TestDirectory::new("trace-path-runtime-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");
    let scope = Scope {
        include: vec!["**".to_owned()],
        exclude: Vec::new(),
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 4,
    };

    let traced = runtime
        .trace_path("target", Some("main.rs"), "callers", 2, &scope, 10)
        .expect("trace graph");

    assert_eq!(traced["root"]["symbol"], "target");
    assert_eq!(traced["nodes"][0]["symbol"], "middle");
    assert_eq!(traced["nodes"][0]["hop"], 1);
    assert_eq!(traced["nodes"][0]["direction"], "callers");
    assert_eq!(traced["nodes"][1]["symbol"], "top");
    assert_eq!(traced["nodes"][1]["hop"], 2);
    assert_eq!(traced["total"], 2);
    assert_eq!(traced["truncated"], false);
}

#[test]
fn trace_path_requires_a_path_for_ambiguous_short_symbols() {
    let repository = TestDirectory::new("ambiguous-trace-symbol");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(repository.path().join("a.rs"), b"fn duplicate() {}\n").expect("write first symbol");
    fs::write(repository.path().join("b.rs"), b"fn duplicate() {}\n").expect("write second symbol");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("ambiguous-trace-symbol-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");
    let scope = Scope {
        include: vec!["**".to_owned()],
        exclude: Vec::new(),
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 4,
    };

    let error = runtime
        .trace_path("duplicate", None, "both", 2, &scope, 10)
        .expect_err("ambiguous symbol fails closed");
    assert_eq!(error.code(), "cgrx.ambiguous_symbol");
    let resolved = runtime
        .trace_path("duplicate", Some("a.rs"), "both", 2, &scope, 10)
        .expect("path disambiguates symbol");
    assert_eq!(resolved["root"]["path"], "a.rs");
}

#[test]
fn search_graph_degree_counts_respect_the_requested_scope() {
    let repository = TestDirectory::new("scoped-search-graph-degree");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("a.rs"),
        b"fn target() {}\nfn localCaller() { target(); }\n",
    )
    .expect("write scoped graph fixture");
    fs::write(
        repository.path().join("b.rs"),
        b"fn outsideCaller() { target(); }\n",
    )
    .expect("write outside graph fixture");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("scoped-search-graph-degree-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");
    let scope = Scope {
        include: vec!["a.rs".to_owned()],
        exclude: Vec::new(),
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 4,
    };

    let searched = runtime
        .search_graph("target", &scope, 10)
        .expect("search scoped graph");
    assert_eq!(searched["matches"][0]["callers"], 1);
}

#[test]
fn get_code_snippet_returns_revision_bound_definition_body() {
    let source = br#"fn helper() -> u32 { 7 }

fn target() -> u32 {
    helper() + 1
}
"#;
    let repository = repository_with_file("code-snippet-runtime", "main.rs", source);
    let state = TestDirectory::new("code-snippet-runtime-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let snippet = runtime
        .get_code_snippet("target", Some("main.rs"))
        .expect("get exact snippet");

    assert_eq!(
        snippet["snapshot"],
        serde_json::to_value(runtime.snapshot()).unwrap()
    );
    assert_eq!(snippet["symbol"], "target");
    assert_eq!(snippet["path"], "main.rs");
    assert_eq!(
        snippet["source"],
        "fn target() -> u32 {\n    helper() + 1\n}"
    );
    assert_eq!(snippet["definition_span"]["start"], 29);
    assert!(snippet["body_span"]["start"].as_u64().unwrap() <= 29);
    assert!(snippet["body_span"]["end"].as_u64().unwrap() > 29);
}

#[test]
fn get_code_snippet_fails_closed_for_ambiguous_and_missing_symbols() {
    let repository = TestDirectory::new("ambiguous-snippet-symbol");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(repository.path().join("a.rs"), b"fn duplicate() {}\n").unwrap();
    fs::write(repository.path().join("b.rs"), b"fn duplicate() {}\n").unwrap();
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("ambiguous-snippet-symbol-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    assert_eq!(
        runtime
            .get_code_snippet("duplicate", None)
            .unwrap_err()
            .code(),
        "cgrx.ambiguous_symbol"
    );
    assert_eq!(
        runtime
            .get_code_snippet("missing", None)
            .unwrap_err()
            .code(),
        "cgrx.symbol_not_found"
    );
    assert_eq!(
        runtime
            .get_code_snippet("duplicate", Some("a.rs"))
            .expect("path disambiguates")["path"],
        "a.rs"
    );
}

#[test]
fn check_index_coverage_classifies_exact_paths_and_bounded_scopes() {
    let repository = TestDirectory::new("coverage-check-runtime");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(repository.path().join("clean.rs"), b"fn clean() {}\n").unwrap();
    fs::write(
        repository.path().join("dynamic.ts"),
        b"function run(service: any, method: string) { service[method](); }\n",
    )
    .unwrap();
    fs::write(
        repository.path().join("README.md"),
        b"# intentionally unsupported\n",
    )
    .unwrap();
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("coverage-check-runtime-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");

    let report = runtime
        .check_index_coverage(
            &[
                "clean.rs".to_owned(),
                "dynamic.ts".to_owned(),
                "README.md".to_owned(),
                "missing.go".to_owned(),
            ],
            &["*.rs".to_owned()],
            0,
            100,
        )
        .expect("check coverage");

    assert_eq!(report["paths"][0]["path"], "clean.rs");
    assert_eq!(report["paths"][0]["status"], "indexed");
    assert_eq!(report["paths"][1]["status"], "partial");
    assert_eq!(report["paths"][1]["gaps"][0]["code"], "DYNAMIC_DISPATCH");
    assert_eq!(report["paths"][2]["status"], "excluded");
    assert_eq!(report["paths"][3]["status"], "unknown");
    assert_eq!(report["scopes"][0]["scope"], "*.rs");
    assert_eq!(report["scopes"][0]["indexed_paths"], 1);
    assert_eq!(report["summary"]["indexed"], 1);
    assert_eq!(report["summary"]["partial"], 1);
    assert_eq!(report["summary"]["excluded"], 1);
    assert_eq!(report["summary"]["unknown"], 1);
    assert_eq!(report["scopes"][0]["gap_offset"], 0);
    assert_eq!(report["scopes"][0]["gap_limit"], 100);
    assert_eq!(report["scopes"][0]["returned"], 0);
    assert_eq!(report["scopes"][0]["has_more"], false);
    assert_eq!(report["scope_summary"]["indexed"], 1);
    assert!(report["scopes"][0]["next_offset"].is_null());

    let first = runtime
        .check_index_coverage(&[], &["**".to_owned()], 0, 1)
        .expect("first coverage page");
    let second = runtime
        .check_index_coverage(&[], &["**".to_owned()], 1, 1)
        .expect("second coverage page");
    assert_eq!(first["scopes"][0]["coverage_gap_count"], 2);
    assert_eq!(first["scopes"][0]["gaps"].as_array().unwrap().len(), 1);
    assert_eq!(first["scopes"][0]["returned"], 1);
    assert_eq!(first["scopes"][0]["has_more"], true);
    assert_eq!(first["scopes"][0]["next_offset"], 1);
    assert_eq!(second["scopes"][0]["gaps"].as_array().unwrap().len(), 1);
    assert_eq!(second["scopes"][0]["has_more"], false);
    assert_ne!(first["scopes"][0]["gaps"], second["scopes"][0]["gaps"]);
    assert_eq!(
        runtime
            .check_index_coverage(&[], &["**".to_owned()], 0, 0)
            .unwrap_err()
            .code(),
        "cgrx.invalid_arguments"
    );
}

#[test]
#[ignore = "release-only dense multi-file graph construction contract"]
fn dense_multifile_call_graph_builds_under_seven_hundred_milliseconds() {
    let repository = TestDirectory::new("dense-call-graph-runtime");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    for file in 0..500 {
        let source = (0..100)
            .map(|symbol| {
                format!(
                    "fn target_{file}_{symbol}() {{}}\nfn caller_{file}_{symbol}() {{ target_{file}_{symbol}(); }}\n"
                )
            })
            .collect::<String>();
        fs::write(repository.path().join(format!("f{file}.rs")), source)
            .expect("write dense graph fixture");
    }
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    let state = TestDirectory::new("dense-call-graph-runtime-state");

    let started = Instant::now();
    let report = Runtime::index(repository.path(), state.path()).expect("index dense graph");
    let elapsed = started.elapsed();

    assert_eq!(report.indexed_files, 500);
    assert!(
        elapsed < Duration::from_millis(700),
        "dense graph indexing took {elapsed:?}"
    );
}

#[test]
fn repeated_call_sites_keep_proofs_but_count_distinct_neighbors() {
    let repository = repository_with_file(
        "repeat-sites",
        "main.rs",
        b"fn target() {} fn caller() { target(); target(); }",
    );
    let state = TestDirectory::new("repeat-sites-state");
    Runtime::index(repository.path(), state.path()).unwrap();
    let runtime = Runtime::open(state.path()).unwrap();
    let proofs = stored_arcs(state.path());
    assert_eq!(proofs.len(), 2);
    assert_ne!(proofs[0]["evidence"]["span"], proofs[1]["evidence"]["span"]);
    let scope = Scope {
        include: vec![],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    };
    assert_eq!(
        runtime.search_graph("target", &scope, 10).unwrap()["matches"][0]["callers"],
        1
    );
    assert_eq!(
        runtime.search_graph("caller", &scope, 10).unwrap()["matches"][0]["callees"],
        1
    );
    assert_eq!(
        runtime
            .trace_path("target", None, "callers", 1, &scope, 10)
            .unwrap()["nodes"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
}

#[test]
fn rust_shadowed_call_has_no_proven_arc_and_retains_uncertainty() {
    for source in [
        "fn target() {} fn caller(target: fn()) { target(); }",
        "fn target() {} fn caller() { let target = || {}; target(); }",
    ] {
        let repository = repository_with_file("shadow-call", "main.rs", source.as_bytes());
        let state = TestDirectory::new("shadow-call-state");
        Runtime::index(repository.path(), state.path()).unwrap();
        assert!(stored_arcs(state.path()).is_empty(), "{source}");
        let reader = GenerationReader::open_current(state.path()).unwrap();
        let stored: serde_json::Value =
            serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap();
        assert!(
            !stored["coverage"]["dynamic_dispatch"]
                .as_array()
                .unwrap()
                .is_empty()
        );
    }
}

macro_rules! rust_lexical_runtime_case {
    ($name:ident, $body:expr, $proven:expr) => {
        #[test]
        fn $name() {
            let source = concat!("fn target() {} fn caller() { ", $body, " }");
            let repository = repository_with_file(stringify!($name), "main.rs", source.as_bytes());
            let state = TestDirectory::new(concat!(stringify!($name), "-state"));
            Runtime::index(repository.path(), state.path()).unwrap();
            let arcs = stored_arcs(state.path());
            assert_eq!(arcs.len(), usize::from($proven), "{source}");
            if $proven {
                assert_eq!(arcs[0]["evidence"]["resolver"], "SYNTAX_EXACT");
                assert_eq!(arcs[0]["evidence"]["confidence"], "PROVEN");
            }
            let reader = GenerationReader::open_current(state.path()).unwrap();
            let stored: serde_json::Value =
                serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap();
            assert_eq!(
                stored["coverage"]["dynamic_dispatch"]
                    .as_array()
                    .unwrap()
                    .is_empty(),
                $proven,
                "{source}"
            );
            let runtime = Runtime::open(state.path()).unwrap();
            let scope = Scope {
                include: vec![],
                exclude: vec![],
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 1,
            };
            assert_eq!(
                runtime.search_graph("target", &scope, 10).unwrap()["matches"][0]["callers"],
                usize::from($proven)
            );
        }
    };
}

rust_lexical_runtime_case!(
    rust_lexical_runtime_for,
    "for target in [target as fn()] { target(); }",
    false
);
rust_lexical_runtime_case!(
    rust_lexical_runtime_match_guard,
    "match None { Some(target) if { target(); true } => {}, _ => {} }",
    false
);
rust_lexical_runtime_case!(
    rust_lexical_runtime_if,
    "if let Some(target) = None { target(); }",
    false
);
rust_lexical_runtime_case!(
    rust_lexical_runtime_while,
    "while let Some(target) = None { target(); }",
    false
);
rust_lexical_runtime_case!(
    rust_lexical_runtime_expired,
    "{ let target = || {}; } target();",
    true
);
rust_lexical_runtime_case!(
    rust_lexical_runtime_sibling,
    "let f = |target: fn()| {}; target();",
    true
);
rust_lexical_runtime_case!(
    rust_lexical_runtime_initializer,
    "let target = target();",
    true
);
rust_lexical_runtime_case!(
    rust_lexical_runtime_else,
    "let Some(target) = None else { target(); return };",
    true
);
rust_lexical_runtime_case!(
    rust_lexical_runtime_field,
    "let S { target: other } = s; target();",
    true
);
rust_lexical_runtime_case!(
    rust_lexical_runtime_raw,
    "let r#target = || {}; target();",
    false
);
rust_lexical_runtime_case!(rust_lexical_runtime_positive, "target();", true);

#[test]
fn rust_lexical_runtime_mixed_sites_only_prove_live_static_calls() {
    let source = "fn target() {} fn caller() {\n\
        { let target = || {}; target(); }\n\
        target();\n\
        for target in [target as fn()] { target(); }\n\
        target();\n\
        let target = target();\n\
        target();\n\
    }";
    let repository = repository_with_file("lexical-mixed", "main.rs", source.as_bytes());
    let state = TestDirectory::new("lexical-mixed-state");
    Runtime::index(repository.path(), state.path()).unwrap();
    let arcs = stored_arcs(state.path());
    assert_eq!(arcs.len(), 3);
    let sites: Vec<_> = source
        .match_indices("target();")
        .map(|(start, _)| start)
        .collect();
    let mut proven_sites = arcs
        .iter()
        .map(|arc| {
            assert_eq!(arc["evidence"]["resolver"], "SYNTAX_EXACT");
            assert_eq!(arc["evidence"]["confidence"], "PROVEN");
            arc["evidence"]["span"]["start"].as_u64().unwrap() as usize
        })
        .collect::<Vec<_>>();
    proven_sites.sort_unstable();
    assert_eq!(proven_sites, vec![sites[1], sites[3], sites[4]]);
    let reader = GenerationReader::open_current(state.path()).unwrap();
    let stored: serde_json::Value =
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap();
    assert_eq!(
        stored["coverage"]["dynamic_dispatch"]
            .as_array()
            .unwrap()
            .len(),
        3
    );
    let runtime = Runtime::open(state.path()).unwrap();
    let scope = Scope {
        include: vec![],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    };
    assert_eq!(
        runtime.search_graph("target", &scope, 10).unwrap()["matches"][0]["callers"],
        1
    );
    assert_eq!(
        runtime
            .trace_path("target", None, "callers", 1, &scope, 10)
            .unwrap()["nodes"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
}
rust_lexical_runtime_case!(
    rust_lexical_runtime_ref,
    "let ref target = f; target();",
    false
);
rust_lexical_runtime_case!(
    rust_lexical_runtime_macro_pattern,
    "let bind!() = s; target();",
    false
);

#[test]
fn query_scope_cache_preserves_globs_degrees_and_consecutive_scopes() {
    let repository = repository_with_file(
        "scope-cache-matrix",
        "root.rs",
        b"fn node_0() {} fn caller_0() { node_0(); node_0(); }",
    );
    for (index, path) in [
        (1, "src/a.rs"),
        (2, "src/deep/b.rs"),
        (3, "src/ж.rs"),
        (4, "src/aa.rs"),
    ] {
        fs::create_dir_all(repository.path().join(path).parent().unwrap()).unwrap();
        fs::write(
            repository.path().join(path),
            format!(
                "fn node_{index}() {{}} fn caller_{index}() {{ node_{index}(); node_{index}(); }}"
            ),
        )
        .unwrap();
    }
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "scope matrix"]);
    let state = TestDirectory::new("scope-cache-matrix-state");
    Runtime::index(repository.path(), state.path()).unwrap();
    let runtime = Runtime::open(state.path()).unwrap();
    let cases: &[(&[&str], &[&str], &[&str])] = &[
        (
            &[],
            &[],
            &[
                "root.rs",
                "src/a.rs",
                "src/aa.rs",
                "src/deep/b.rs",
                "src/ж.rs",
            ],
        ),
        (
            &["**/*.rs"],
            &[],
            &[
                "root.rs",
                "src/a.rs",
                "src/aa.rs",
                "src/deep/b.rs",
                "src/ж.rs",
            ],
        ),
        (&["src/*.rs"], &[], &["src/a.rs", "src/aa.rs", "src/ж.rs"]),
        // Preserve the original matcher: ** may consume a filename prefix
        // before its zero-directory branch, so aa.rs also matches here.
        (
            &["src/**/?.rs"],
            &[],
            &["src/a.rs", "src/aa.rs", "src/deep/b.rs", "src/ж.rs"],
        ),
        (&["src/?.rs"], &["src/ж.rs"], &["src/a.rs"]),
        (&["**/*.rs"], &["src/**"], &["root.rs"]),
        (&["src/ж.rs", "root.rs"], &["root.rs"], &["src/ж.rs"]),
        (&["missing/**"], &[], &[]),
        (&["**"], &["**"], &[]),
    ];
    let all = Scope {
        include: vec![],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 2,
    };
    let original = runtime.search_graph("node_", &all, 50).unwrap();
    for &(include, exclude, expected_paths) in cases {
        let scope = Scope {
            include: include.iter().map(|s| (*s).into()).collect(),
            exclude: exclude.iter().map(|s| (*s).into()).collect(),
            ..all.clone()
        };
        let found = runtime.search_graph("node_", &scope, 50).unwrap();
        let rows = found["matches"].as_array().unwrap();
        assert_eq!(
            rows.iter()
                .map(|row| row["path"].as_str().unwrap())
                .collect::<Vec<_>>(),
            expected_paths,
            "{include:?} minus {exclude:?}"
        );
        assert_eq!(found["total"], expected_paths.len());
        assert_eq!(found["truncated"], false);
        assert_eq!(found["coverage_gap_count"], 0);
        for row in rows {
            assert_eq!(row["callers"], 1);
            assert_eq!(row["callees"], 0);
            let trace = runtime
                .trace_path(
                    row["symbol"].as_str().unwrap(),
                    row["path"].as_str(),
                    "callers",
                    1,
                    &scope,
                    50,
                )
                .unwrap();
            assert_eq!(trace["nodes"].as_array().unwrap().len(), 1);
        }
        let without_relations = Scope {
            relation_kinds: vec![],
            ..scope
        };
        let isolated = runtime
            .search_graph("node_", &without_relations, 50)
            .unwrap();
        assert!(
            isolated["matches"]
                .as_array()
                .unwrap()
                .iter()
                .all(|row| row["callers"] == 0 && row["callees"] == 0)
        );
        assert_eq!(runtime.search_graph("node_", &all, 50).unwrap(), original);
    }
}

#[test]
fn query_scope_cache_does_not_survive_refresh_or_path_recreation() {
    let repository = repository_with_file(
        "scope-cache-refresh",
        "main.rs",
        b"fn target() {} fn caller() { target(); target(); }",
    );
    let state = TestDirectory::new("scope-cache-refresh-state");
    Runtime::index(repository.path(), state.path()).unwrap();
    let mut runtime = Runtime::open(state.path()).unwrap();
    let scope = Scope {
        include: vec!["**/main.rs".into()],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    };
    let before = runtime.search_graph("target", &scope, 10).unwrap();
    assert_eq!(before["matches"][0]["callers"], 1);
    fs::write(
        repository.path().join("main.rs"),
        b"fn target() {} fn caller() {}",
    )
    .unwrap();
    assert!(runtime.refresh(repository.path()).unwrap());
    assert_eq!(
        runtime.search_graph("target", &scope, 10).unwrap()["matches"][0]["callers"],
        0
    );
    assert_eq!(
        runtime
            .trace_path("target", None, "callers", 1, &scope, 10)
            .unwrap()["nodes"],
        serde_json::json!([])
    );
    fs::remove_file(repository.path().join("main.rs")).unwrap();
    assert!(runtime.refresh(repository.path()).unwrap());
    assert_eq!(
        runtime.search_graph("target", &scope, 10).unwrap()["total"],
        0
    );
    fs::write(
        repository.path().join("main.rs"),
        b"fn target() {} fn caller() { target(); target(); }",
    )
    .unwrap();
    assert!(runtime.refresh(repository.path()).unwrap());
    assert_eq!(runtime.search_graph("target", &scope, 10).unwrap(), before);
}

#[test]
fn rust_receiver_calls_never_guess_same_named_free_function() {
    for (label, expression) in [
        ("vec", "let mut values = Vec::new(); values.push(1);"),
        ("generic", "let value = \"1\"; value.parse::<usize>();"),
        ("chain", "make().push(1);"),
        ("field", "holder.values.push(1);"),
    ] {
        let source = format!(
            "fn push(_: u32) {{}}\nfn parse() {{}}\nfn make() {{}}\nfn caller() {{ {expression} }}\nfn direct() {{ push(1); }}\n"
        );
        let repository = repository_with_file(label, "main.rs", source.as_bytes());
        let state = TestDirectory::new(label);
        Runtime::index(repository.path(), state.path()).unwrap();
        let mut runtime = Runtime::open(state.path()).unwrap();
        let scope = Scope {
            include: vec!["**".to_owned()],
            exclude: vec![],
            relation_kinds: vec![RelationKind::Calls],
            max_depth: 1,
        };
        let result = runtime
            .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 50)
            .unwrap();
        assert!(
            !result["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .any(|n| n["symbol"] == "push" || n["symbol"] == "parse"),
            "{label}: {result}"
        );
        assert!(
            !runtime.coverage().dynamic_dispatch.is_empty(),
            "{label}: missing receiver gap"
        );
        let direct = runtime
            .trace_path("direct", Some("main.rs"), "callees", 1, &scope, 50)
            .unwrap();
        assert!(
            direct["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .any(|n| n["symbol"] == "push"),
            "{direct}"
        );

        // Dirty refresh may add a real direct edge, then must remove it again.
        let direct_source = source.replace(expression, "push(1);");
        fs::write(repository.path().join("main.rs"), direct_source).unwrap();
        assert!(runtime.refresh(repository.path()).unwrap());
        let direct_now = runtime
            .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 50)
            .unwrap();
        assert!(
            direct_now["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .any(|n| n["symbol"] == "push"),
            "{direct_now}"
        );
        fs::write(repository.path().join("main.rs"), &source).unwrap();
        assert!(runtime.refresh(repository.path()).unwrap());
        for checked in [&runtime, &Runtime::open(state.path()).unwrap()] {
            let v = checked
                .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 50)
                .unwrap();
            assert!(
                !v["nodes"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .any(|n| n["symbol"] == "push" || n["symbol"] == "parse"),
                "{label}: {v}"
            );
            assert!(!checked.coverage().dynamic_dispatch.is_empty());
        }
    }
}

#[test]
fn rust_self_owner_proof_disambiguates_same_named_methods() {
    let source = b"struct A; struct B; impl A { fn caller(&self) { self.run(); } fn run(&self) {} } impl B { fn run(&self) {} } fn run() {}";
    let repository = repository_with_file("rust-self-owner", "main.rs", source);
    let state = TestDirectory::new("rust-self-owner-state");
    Runtime::index(repository.path(), state.path()).unwrap();
    let mut runtime = Runtime::open(state.path()).unwrap();
    let scope = Scope {
        include: vec!["**".to_owned()],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    };
    let expected = std::str::from_utf8(source).unwrap().find("fn run").unwrap() + 3;
    let check = |runtime: &Runtime| {
        let r = runtime
            .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 50)
            .unwrap();
        assert_eq!(r["nodes"].as_array().unwrap().len(), 1, "{r}");
        assert_eq!(r["nodes"][0]["span"]["start"], expected, "{r}");
    };
    check(&runtime);
    check(&Runtime::open(state.path()).unwrap());
    // Removing the actual owner target must never retarget another type/free fn.
    let changed = std::str::from_utf8(source)
        .unwrap()
        .replacen(" fn run(&self) {}", "", 1);
    fs::write(repository.path().join("main.rs"), changed).unwrap();
    assert!(runtime.refresh(repository.path()).unwrap());
    let r = runtime
        .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 50)
        .unwrap();
    assert_eq!(r["nodes"], serde_json::json!([]), "{r}");
    assert!(!runtime.coverage().dynamic_dispatch.is_empty());
    fs::write(repository.path().join("main.rs"), source).unwrap();
    assert!(runtime.refresh(repository.path()).unwrap());
    check(&runtime);
}

#[test]
fn rust_self_owner_proof_never_falls_back_to_other_owner() {
    let source = b"struct A; struct B; impl A { fn caller(&self) { self.run(); } } impl B { fn run(&self) {} }";
    let repository = repository_with_file("rust-self-wrong-owner", "main.rs", source);
    let state = TestDirectory::new("rust-self-wrong-owner-state");
    Runtime::index(repository.path(), state.path()).unwrap();
    let runtime = Runtime::open(state.path()).unwrap();
    let scope = Scope {
        include: vec!["**".to_owned()],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    };
    let r = runtime
        .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 50)
        .unwrap();
    assert_eq!(r["nodes"], serde_json::json!([]), "{r}");
    assert!(!runtime.coverage().dynamic_dispatch.is_empty());
}

#[test]
fn rust_self_owner_proof_unsupported_shapes_are_gaps() {
    for (label, source) in [
        (
            "trait",
            "struct A; trait T { fn run(&self); fn caller(&self); } impl T for A { fn caller(&self) { self.run(); } fn run(&self) {} }",
        ),
        (
            "generic",
            "struct A<T>(T); impl<T> A<T> { fn caller(&self) { self.run(); } fn run(&self) {} }",
        ),
        (
            "cfg_target",
            "struct A; impl A { fn caller(&self) { self.run(); } #[cfg(feature = \"x\")] fn run(&self) {} }",
        ),
        (
            "cfg_impl",
            "struct A; #[cfg(feature = \"x\")] impl A { fn caller(&self) { self.run(); } fn run(&self) {} }",
        ),
        (
            "cfg_owner",
            "#[cfg(feature = \"x\")] struct A; impl A { fn caller(&self) { self.run(); } fn run(&self) {} }",
        ),
        (
            "duplicate",
            "struct A; impl A { fn caller(&self) { self.run(); } fn run(&self) {} fn run(&self) {} }",
        ),
        (
            "associated",
            "struct A; impl A { fn caller(&self) { self.run(); } fn run() {} }",
        ),
        (
            "alias",
            "struct Real; type A = Real; impl A { fn caller(&self) { self.run(); } fn run(&self) {} }",
        ),
        (
            "nested",
            "struct A; impl A { fn caller(&self) { fn nested() { self.run(); } } fn run(&self) {} }",
        ),
    ] {
        let repository = repository_with_file(label, "main.rs", source.as_bytes());
        let state = TestDirectory::new(label);
        Runtime::index(repository.path(), state.path()).unwrap();
        let runtime = Runtime::open(state.path()).unwrap();
        let scope = Scope {
            include: vec!["**".to_owned()],
            exclude: vec![],
            relation_kinds: vec![RelationKind::Calls],
            max_depth: 1,
        };
        let symbol = if label == "nested" {
            "nested"
        } else {
            "caller"
        };
        let r = runtime
            .trace_path(symbol, Some("main.rs"), "callees", 1, &scope, 50)
            .unwrap();
        assert_eq!(r["nodes"], serde_json::json!([]), "{label}: {r}");
        assert!(!runtime.coverage().dynamic_dispatch.is_empty(), "{label}");
    }
}

#[test]
fn rust_self_owner_proof_allows_non_binding_builtin_attributes() {
    let source = b"struct A; impl A { #[must_use] fn unrelated(&self) -> i32 { 1 } fn caller(&self) { self.run(); } #[inline] fn run(&self) {} } fn run() {}";
    let repository = repository_with_file("rust-self-builtins", "main.rs", source);
    let state = TestDirectory::new("rust-self-builtins-state");
    Runtime::index(repository.path(), state.path()).unwrap();
    let runtime = Runtime::open(state.path()).unwrap();
    let scope = Scope {
        include: vec!["**".to_owned()],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    };
    let r = runtime
        .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 50)
        .unwrap();
    assert_eq!(r["nodes"].as_array().unwrap().len(), 1, "{r}");
    assert_eq!(
        r["nodes"][0]["span"]["start"],
        std::str::from_utf8(source).unwrap().find("fn run").unwrap() + 3,
        "{r}"
    );
}

#[test]
fn rust_qualified_self_disambiguates_own_associated_target() {
    for call in ["Self::run()", "Self::run::<u8>()"] {
        let target = if call.contains("::<") {
            "fn run<T>() {}"
        } else {
            "fn run() {}"
        };
        let source = format!(
            "struct A; struct B; impl A {{ fn caller() {{ {call}; }} {target} }} impl B {{ fn run() {{}} }} fn run() {{}}"
        );
        let repository = repository_with_file("qualified-self", "main.rs", source.as_bytes());
        let state = TestDirectory::new("qualified-self-state");
        Runtime::index(repository.path(), state.path()).unwrap();
        let mut runtime = Runtime::open(state.path()).unwrap();
        let scope = Scope {
            include: vec!["**".to_owned()],
            exclude: vec![],
            relation_kinds: vec![RelationKind::Calls],
            max_depth: 1,
        };
        let expected = source.find("fn run").unwrap() + 3;
        let check = |r: &Runtime| {
            let result = r
                .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 50)
                .unwrap();
            assert_eq!(result["nodes"].as_array().unwrap().len(), 1, "{result}");
            assert_eq!(result["nodes"][0]["span"]["start"], expected, "{result}");
        };
        check(&runtime);
        check(&Runtime::open(state.path()).unwrap());
        fs::write(
            repository.path().join("main.rs"),
            source.replacen(target, "", 1),
        )
        .unwrap();
        assert!(runtime.refresh(repository.path()).unwrap());
        let result = runtime
            .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 50)
            .unwrap();
        assert_eq!(result["nodes"], serde_json::json!([]), "{result}");
        assert!(!runtime.coverage().dynamic_dispatch.is_empty());
        fs::write(repository.path().join("main.rs"), &source).unwrap();
        assert!(runtime.refresh(repository.path()).unwrap());
        check(&runtime);
    }
}

#[test]
fn rust_qualified_self_does_not_call_another_owner() {
    let source =
        b"struct A; struct B; impl A { fn caller() { Self::run(); } } impl B { fn run() {} }";
    let repository = repository_with_file("qualified-wrong-owner", "main.rs", source);
    let state = TestDirectory::new("qualified-wrong-owner-state");
    Runtime::index(repository.path(), state.path()).unwrap();
    let runtime = Runtime::open(state.path()).unwrap();
    let scope = Scope {
        include: vec!["**".to_owned()],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    };
    let result = runtime
        .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 50)
        .unwrap();
    assert_eq!(result["nodes"], serde_json::json!([]), "{result}");
    assert!(!runtime.coverage().dynamic_dispatch.is_empty());
}

#[test]
fn rust_qualified_self_unsupported_forms_are_gaps() {
    for (label, symbol, source) in [
        (
            "projection",
            "caller",
            "struct A; impl A { fn caller() { Self::Assoc::run(); } } fn run() {}",
        ),
        (
            "trait_qualified",
            "caller",
            "struct A; trait T { fn run(); } impl A { fn caller() { <Self as T>::run(); } } fn run() {}",
        ),
        (
            "trait_impl",
            "caller",
            "struct A; trait T { fn run(); fn caller(); } impl T for A { fn caller() { Self::run(); } fn run() {} }",
        ),
        (
            "cfg",
            "caller",
            "struct A; impl A { fn caller() { Self::run(); } #[cfg(feature = \"x\")] fn run() {} }",
        ),
        (
            "generic_owner",
            "caller",
            "struct A<T>(T); impl<T> A<T> { fn caller() { Self::run(); } fn run() {} }",
        ),
        (
            "nested",
            "nested",
            "struct A; impl A { fn caller() { fn nested() { Self::run(); } } fn run() {} }",
        ),
        (
            "free_context",
            "caller",
            "fn caller() { Self::run(); } fn run() {}",
        ),
    ] {
        let repository = repository_with_file(label, "main.rs", source.as_bytes());
        let state = TestDirectory::new(label);
        Runtime::index(repository.path(), state.path()).unwrap();
        let runtime = Runtime::open(state.path()).unwrap();
        let scope = Scope {
            include: vec!["**".to_owned()],
            exclude: vec![],
            relation_kinds: vec![RelationKind::Calls],
            max_depth: 1,
        };
        let r = runtime
            .trace_path(symbol, Some("main.rs"), "callees", 1, &scope, 50)
            .unwrap();
        assert_eq!(r["nodes"], serde_json::json!([]), "{label}: {r}");
        assert!(!runtime.coverage().dynamic_dispatch.is_empty(), "{label}");
    }
}

#[test]
fn rust_qualified_self_can_target_instance_method_with_explicit_receiver() {
    let source = b"struct A; struct B; impl A { fn caller(&self) { Self::run(self); } fn run(&self) {} } impl B { fn run(&self) {} }";
    let repository = repository_with_file("qualified-instance", "main.rs", source);
    let state = TestDirectory::new("qualified-instance-state");
    Runtime::index(repository.path(), state.path()).unwrap();
    let runtime = Runtime::open(state.path()).unwrap();
    let scope = Scope {
        include: vec!["**".to_owned()],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    };
    let r = runtime
        .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 50)
        .unwrap();
    assert_eq!(r["nodes"].as_array().unwrap().len(), 1, "{r}");
    assert_eq!(
        r["nodes"][0]["span"]["start"],
        std::str::from_utf8(source).unwrap().find("fn run").unwrap() + 3,
        "{r}"
    );
}

#[test]
fn rust_split_impl_proves_exact_target_and_refreshes() {
    for (call, receiver) in [("self.run()", "&self"), ("Self::run(self)", "&self")] {
        for reverse in [false, true] {
            let target_impl = "impl A { fn run(&self) {} }";
            let caller_impl = format!("impl A {{ fn caller({receiver}) {{ {call}; }} }}");
            let pair = if reverse {
                format!("{target_impl} {caller_impl}")
            } else {
                format!("{caller_impl} {target_impl}")
            };
            let source =
                format!("struct A; struct B; impl B {{ fn run(&self) {{}} }} {pair} fn run() {{}}");
            let repository = repository_with_file("split-proof", "main.rs", source.as_bytes());
            let state = TestDirectory::new("split-proof-state");
            Runtime::index(repository.path(), state.path()).unwrap();
            let mut runtime = Runtime::open(state.path()).unwrap();
            let scope = Scope {
                include: vec!["**".into()],
                exclude: vec![],
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 1,
            };
            let expected = source.find(target_impl).unwrap() + target_impl.find("run").unwrap();
            let check = |r: &Runtime| {
                let result = r
                    .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 50)
                    .unwrap();
                assert_eq!(
                    result["nodes"].as_array().unwrap().len(),
                    1,
                    "{source}: {result}"
                );
                assert_eq!(result["nodes"][0]["span"]["start"], expected);
                assert_eq!(result["nodes"][0]["path"], "main.rs");
            };
            check(&runtime);
            check(&Runtime::open(state.path()).unwrap());
            fs::write(
                repository.path().join("main.rs"),
                source.replace(target_impl, ""),
            )
            .unwrap();
            runtime.refresh(repository.path()).unwrap();
            assert_eq!(
                runtime
                    .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 50)
                    .unwrap()["nodes"],
                serde_json::json!([])
            );
            assert!(!runtime.coverage().dynamic_dispatch.is_empty());
            fs::write(repository.path().join("main.rs"), &source).unwrap();
            runtime.refresh(repository.path()).unwrap();
            check(&runtime);
        }
    }
}

#[test]
fn rust_split_impl_rejects_ambiguous_or_conditional_target() {
    for extra in [
        "impl A { fn run(&self) {} } impl A { fn run(&self) {} }",
        "#[cfg(feature=\"x\")] impl A { fn run(&self) {} }",
        "impl A { #[cfg(feature=\"x\")] fn run(&self) {} }",
        "trait T { fn run(&self); } impl T for A { fn run(&self) {} }",
        "impl A { make_method!(); } impl A { fn run(&self) {} }",
        "mod nested { struct A; impl A { fn run(&self) {} } }",
    ] {
        let source = format!(
            "struct A; impl A {{ fn caller(&self) {{ self.run(); }} }} {extra} fn run() {{}}"
        );
        let repository = repository_with_file("split-negative", "main.rs", source.as_bytes());
        let state = TestDirectory::new("split-negative-state");
        Runtime::index(repository.path(), state.path()).unwrap();
        let runtime = Runtime::open(state.path()).unwrap();
        let scope = Scope {
            include: vec!["**".into()],
            exclude: vec![],
            relation_kinds: vec![RelationKind::Calls],
            max_depth: 1,
        };
        assert_eq!(
            runtime
                .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 50)
                .unwrap()["nodes"],
            serde_json::json!([]),
            "{source}"
        );
        assert!(!runtime.coverage().dynamic_dispatch.is_empty());
    }
}

#[test]
fn indexing_reactivates_existing_generation_without_rewriting_segments() {
    let repository = repository_with_file("reactivation", "main.rs", b"fn original() {}\n");
    let state = TestDirectory::new("reactivation-state");
    let first = Runtime::index(repository.path(), state.path()).unwrap();
    let reader = GenerationReader::open_current(state.path()).unwrap();
    let before = reader.read_segment("nodes.seg").unwrap();
    Runtime::index(repository.path(), state.path()).unwrap();
    assert_eq!(
        GenerationReader::open_current(state.path())
            .unwrap()
            .snapshot(),
        &first.snapshot
    );
    fs::write(repository.path().join("main.rs"), b"fn changed() {}\n").unwrap();
    for args in [
        vec!["add", "main.rs"],
        vec![
            "-c",
            "user.name=Test",
            "-c",
            "user.email=test@example.invalid",
            "commit",
            "-qm",
            "second",
        ],
    ] {
        assert!(
            Command::new("git")
                .args(args)
                .current_dir(repository.path())
                .status()
                .unwrap()
                .success()
        );
    }
    Runtime::index(repository.path(), state.path()).unwrap();
    assert!(
        Command::new("git")
            .args(["checkout", "--detach", &first.snapshot.repo_revision])
            .current_dir(repository.path())
            .output()
            .unwrap()
            .status
            .success()
    );
    Runtime::index(repository.path(), state.path()).unwrap();
    let restored = GenerationReader::open_current(state.path()).unwrap();
    assert_eq!(restored.snapshot(), &first.snapshot);
    assert_eq!(restored.read_segment("nodes.seg").unwrap(), before);
}

#[test]
fn indexing_reports_store_busy_without_deleting_another_writer() {
    let repository = repository_with_file("writer-busy", "main.rs", b"fn target() {}\n");
    let state = TestDirectory::new("writer-busy-state");
    let mut held = cgrx_store::GenerationWriter::begin(
        state.path(),
        cgrx_core::RepoSnapshot {
            repo_revision: "held".into(),
            working_tree_digest: cgrx_core::Hash32([0; 32]),
            graph_generation: 1,
        },
    )
    .unwrap();
    held.write_segment("nodes.seg", b"sentinel").unwrap();
    let err = Runtime::index(repository.path(), state.path()).unwrap_err();
    assert_eq!(err.code(), "store_busy");
    assert_eq!(
        fs::read(
            state
                .path()
                .join(".cgrx/generations/.0000000000000001.tmp/nodes.seg")
        )
        .unwrap(),
        b"sentinel"
    );
    drop(held);
    Runtime::index(repository.path(), state.path()).unwrap();
}

#[test]
fn rust_module_paths_bind_exact_inline_target_and_refresh() {
    for source in [
        "fn run() {} mod nested { fn run() {} fn caller() { self::run(); } }",
        "fn run() {} mod nested { fn run() {} fn caller() { super::run(); } }",
        "mod target { pub fn run() {} } mod nested { fn run() {} fn caller() { super::target::run(); } }",
        "mod target { pub fn run<T>() {} } fn run() {} fn caller() { self::target::run::<u8>(); }",
        "fn run() {} mod a { mod b { fn run() {} fn caller() { super::super::run(); } } }",
    ] {
        let repo = repository_with_file("rust-module-proof", "main.rs", source.as_bytes());
        let state = TestDirectory::new("rust-module-state");
        Runtime::index(repo.path(), state.path()).unwrap();
        let mut runtime = Runtime::open(state.path()).unwrap();
        let expected = if source.contains("self::run") {
            source.rfind("fn run").unwrap() + 3
        } else {
            source.find("fn run").unwrap() + 3
        };
        let scope = Scope {
            include: vec!["**".into()],
            exclude: vec![],
            relation_kinds: vec![RelationKind::Calls],
            max_depth: 1,
        };
        let check = |runtime: &Runtime| {
            let r = runtime
                .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 20)
                .unwrap();
            assert_eq!(r["nodes"].as_array().unwrap().len(), 1, "{source}: {r}");
            assert_eq!(r["nodes"][0]["span"]["start"], expected, "{source}: {r}");
        };
        check(&runtime);
        check(&Runtime::open(state.path()).unwrap());
        let mut changed = source.to_owned();
        changed.replace_range(expected..expected + 3, "gone");
        fs::write(repo.path().join("main.rs"), changed).unwrap();
        runtime.refresh(repo.path()).unwrap();
        let r = runtime
            .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 20)
            .unwrap();
        assert_eq!(r["nodes"], serde_json::json!([]), "{r}");
        assert!(!runtime.coverage().dynamic_dispatch.is_empty());
        fs::write(repo.path().join("main.rs"), source).unwrap();
        runtime.refresh(repo.path()).unwrap();
        check(&runtime);
    }
}

#[test]
fn rust_module_paths_never_guess_qualified_targets() {
    for source in [
        "fn run() {} fn caller() { external::run(); }",
        "fn run() {} fn caller() { crate::run(); }",
        "fn run() {} fn caller() { super::run(); }",
        "mod a { fn run() {} } fn caller() { self::missing::run(); }",
        "mod a { fn run() {} fn run() {} fn caller() { self::run(); } }",
        "mod a { #[cfg(feature = \"x\")] fn run() {} fn caller() { self::run(); } }",
        "mod a { use foreign::*; fn run() {} fn caller() { self::run(); } }",
        "mod a { struct S; impl S { fn run() {} } fn caller() { self::run(); } }",
        "mod a { mod target; fn run() {} fn caller() { self::target::run(); } }",
        "#[cfg(feature = \"x\")] mod a { fn run() {} fn caller() { self::run(); } }",
    ] {
        let repo = repository_with_file("rust-module-negative", "main.rs", source.as_bytes());
        let state = TestDirectory::new("rust-module-negative-state");
        Runtime::index(repo.path(), state.path()).unwrap();
        let runtime = Runtime::open(state.path()).unwrap();
        let scope = Scope {
            include: vec!["**".into()],
            exclude: vec![],
            relation_kinds: vec![RelationKind::Calls],
            max_depth: 1,
        };
        let r = runtime
            .trace_path("caller", Some("main.rs"), "callees", 1, &scope, 20)
            .unwrap();
        assert_eq!(r["nodes"], serde_json::json!([]), "{source}: {r}");
        assert!(!runtime.coverage().dynamic_dispatch.is_empty(), "{source}");
    }
}

fn cargo_root_fixture() -> TestDirectory {
    let repo = repository_with_file(
        "cargo-roots",
        "Cargo.toml",
        b"[package]\nname = \"sample-engine\"\nversion = \"0.1.0\"\nedition = \"2021\"\n",
    );
    fs::create_dir_all(repo.path().join("src")).unwrap();
    for (path, source) in [
        ("src/lib.rs", "mod worker; pub fn target() {}"),
        ("src/worker.rs", "fn caller_lib() { crate::target(); }"),
        (
            "src/main.rs",
            "use std::io::{self, Write}; mod cli; fn main() { sample_engine::target(); }",
        ),
        ("src/cli.rs", "fn caller_bin() { sample_engine::target(); }"),
    ] {
        fs::write(repo.path().join(path), source).unwrap();
    }
    git(repo.path(), &["add", "."]);
    git(repo.path(), &["commit", "-qm", "sources"]);
    repo
}

fn cargo_trace_count(runtime: &Runtime, caller: &str, path: &str) -> usize {
    let scope = Scope {
        include: vec!["**".into()],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    };
    let r = runtime
        .trace_path(caller, Some(path), "callees", 1, &scope, 20)
        .unwrap();
    let nodes = r["nodes"].as_array().unwrap();
    for n in nodes {
        assert_eq!(n["path"], "src/lib.rs", "{r}");
    }
    nodes.len()
}

#[test]
fn rust_cargo_roots_link_library_and_binary_modules_and_refresh() {
    let repo = cargo_root_fixture();
    let state = TestDirectory::new("cargo-root-state");
    Runtime::index(repo.path(), state.path()).unwrap();
    let mut runtime = Runtime::open(state.path()).unwrap();
    let check = |r: &Runtime| {
        for (name, path) in [
            ("caller_lib", "src/worker.rs"),
            ("main", "src/main.rs"),
            ("caller_bin", "src/cli.rs"),
        ] {
            assert_eq!(cargo_trace_count(r, name, path), 1, "{name}");
        }
    };
    check(&runtime);
    check(&Runtime::open(state.path()).unwrap());
    for (path, changed) in [
        ("src/lib.rs", "mod worker; pub fn absent() {}"),
        (
            "Cargo.toml",
            "[package]\nname=\"renamed\"\nversion=\"0.1.0\"\nedition=\"2021\"",
        ),
        ("src/main.rs", "fn main() { sample_engine::target(); }"),
    ] {
        let original = fs::read(repo.path().join(path)).unwrap();
        fs::write(repo.path().join(path), changed).unwrap();
        runtime.refresh(repo.path()).unwrap();
        assert_eq!(
            cargo_trace_count(&runtime, "caller_bin", "src/cli.rs"),
            0,
            "{path}"
        );
        fs::write(repo.path().join(path), original).unwrap();
        runtime.refresh(repo.path()).unwrap();
        check(&runtime);
    }
}

#[test]
fn rust_cargo_roots_reject_unproven_or_ambiguous_membership() {
    for (path, source) in [
        (
            "src/lib.rs",
            "#[cfg(feature=\"x\")] mod worker; pub fn target() {}",
        ),
        (
            "src/lib.rs",
            "#[path=\"worker.rs\"] mod worker; pub fn target() {}",
        ),
        (
            "src/lib.rs",
            "mod worker; #[cfg(feature=\"x\")] pub fn target() {}",
        ),
        (
            "src/lib.rs",
            "mod worker; pub fn target() {} pub fn target() {}",
        ),
        (
            "src/worker.rs",
            "mod sample_engine {} fn caller_lib() { sample_engine::target(); }",
        ),
        (
            "src/worker.rs",
            "use foreign::*; fn caller_lib() { crate::target(); }",
        ),
        (
            "src/worker.rs",
            "mod inline { fn caller_lib() { crate::target(); } }",
        ),
        (
            "Cargo.toml",
            "[package]\nname=\"sample-engine\"\nversion=\"0.1.0\"\n[lib]\npath=\"other.rs\"",
        ),
        ("Cargo.toml", "invalid = ["),
        ("src/main.rs", "mod worker; fn main() {}"),
        ("src/worker/mod.rs", "fn alternative() {}"),
        ("src/Cargo.toml", "invalid = ["),
    ] {
        let repo = cargo_root_fixture();
        let file = repo.path().join(path);
        fs::create_dir_all(file.parent().unwrap()).unwrap();
        fs::write(file, source).unwrap();
        git(repo.path(), &["add", "."]);
        git(repo.path(), &["commit", "-qm", "negative"]);
        let state = TestDirectory::new("cargo-negative-state");
        Runtime::index(repo.path(), state.path()).unwrap();
        let runtime = Runtime::open(state.path()).unwrap();
        assert_eq!(
            cargo_trace_count(&runtime, "caller_lib", "src/worker.rs"),
            0,
            "{path}: {source}"
        );
    }
}

#[test]
fn rust_cargo_roots_custom_library_name_and_explicit_binary_path() {
    let repo = cargo_root_fixture();
    fs::write(repo.path().join("Cargo.toml"), "[package]\nname=\"sample-engine\"\nversion=\"0.1.0\"\nedition=\"2021\"\nautobins=false\n[lib]\nname=\"custom_engine\"\npath=\"src/lib.rs\"\n[[bin]]\nname=\"tool\"\npath=\"tool.rs\"\n").unwrap();
    fs::write(
        repo.path().join("tool.rs"),
        "fn entry() { custom_engine::target(); }",
    )
    .unwrap();
    git(repo.path(), &["add", "."]);
    git(repo.path(), &["commit", "-qm", "custom targets"]);
    let state = TestDirectory::new("cargo-custom-state");
    Runtime::index(repo.path(), state.path()).unwrap();
    let runtime = Runtime::open(state.path()).unwrap();
    assert_eq!(cargo_trace_count(&runtime, "entry", "tool.rs"), 1);
    assert_eq!(cargo_trace_count(&runtime, "main", "src/main.rs"), 0);
}

#[test]
fn rust_cargo_roots_namespace_and_manifest_guards() {
    for (path, source) in [
        (
            "src/worker.rs",
            "fn caller_lib<sample_engine>() { sample_engine::target(); }",
        ),
        (
            "src/worker.rs",
            "fn caller_lib() { type sample_engine = Other; sample_engine::target(); }",
        ),
        (
            "src/worker.rs",
            "fn caller_lib() { macro_rules! hidden { () => {} } hidden!(); crate::target(); }",
        ),
        (
            "src/worker.rs",
            "fn caller_lib() { mod sample_engine {} sample_engine::target(); }",
        ),
        (
            "src/worker.rs",
            "#[cfg(feature=\"x\")] fn caller_lib() { crate::target(); }",
        ),
        (
            "src/lib.rs",
            "mod worker; use foreign::target; pub fn target() {}",
        ),
        (
            "Cargo.toml",
            "[package]\nname=\"sample-engine\"\nversion=\"0.1.0\"\n[lib]\npath=42",
        ),
        (
            "Cargo.toml",
            "[package]\nname=\"sample-engine\"\nversion=\"0.1.0\"\n[[test]]\nname=\"reuse\"\npath=\"src/worker.rs\"",
        ),
    ] {
        let repo = cargo_root_fixture();
        fs::write(repo.path().join(path), source).unwrap();
        git(repo.path(), &["add", "."]);
        git(repo.path(), &["commit", "-qm", "namespace guard"]);
        let state = TestDirectory::new("cargo-namespace-state");
        Runtime::index(repo.path(), state.path()).unwrap();
        let runtime = Runtime::open(state.path()).unwrap();
        assert_eq!(
            cargo_trace_count(&runtime, "caller_lib", "src/worker.rs"),
            0,
            "{path}: {source}"
        );
    }
}

fn rust_alias_fixture(root_source: &str, target_source: &str) -> TestDirectory {
    let repo = repository_with_file(
        "rust-alias",
        "Cargo.toml",
        b"[package]\nname=\"aliases\"\nversion=\"0.1.0\"\nedition=\"2021\"\n",
    );
    fs::create_dir_all(repo.path().join("src")).unwrap();
    fs::write(repo.path().join("src/lib.rs"), root_source).unwrap();
    fs::write(repo.path().join("src/worker.rs"), target_source).unwrap();
    fs::write(repo.path().join("src/other.rs"), "pub fn target() {}").unwrap();
    git(repo.path(), &["add", "."]);
    git(repo.path(), &["commit", "-qm", "aliases"]);
    repo
}

fn rust_alias_targets(runtime: &Runtime) -> Vec<String> {
    let scope = Scope {
        include: vec!["**".into()],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 1,
    };
    let r = runtime
        .trace_path("caller", Some("src/lib.rs"), "callees", 1, &scope, 20)
        .unwrap();
    assert_eq!(r["truncated"], false);
    r["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|n| n["path"].as_str().unwrap().to_owned())
        .collect()
}

#[test]
fn rust_module_alias_proves_target_and_refreshes_import_identity() {
    let original =
        "mod worker; mod other; use crate::worker as api; pub fn caller() { api::target(); }";
    let repo = rust_alias_fixture(original, "pub fn target() {}");
    let state = TestDirectory::new("alias-state");
    Runtime::index(repo.path(), state.path()).unwrap();
    let mut runtime = Runtime::open(state.path()).unwrap();
    assert_eq!(rust_alias_targets(&runtime), ["src/worker.rs"]);
    assert_eq!(
        rust_alias_targets(&Runtime::open(state.path()).unwrap()),
        ["src/worker.rs"]
    );
    fs::write(
        repo.path().join("src/lib.rs"),
        original.replace("crate::worker", "crate::other"),
    )
    .unwrap();
    runtime.refresh(repo.path()).unwrap();
    assert_eq!(rust_alias_targets(&runtime), ["src/other.rs"]);
    fs::write(repo.path().join("src/lib.rs"), original).unwrap();
    runtime.refresh(repo.path()).unwrap();
    assert_eq!(rust_alias_targets(&runtime), ["src/worker.rs"]);
}

#[test]
fn rust_module_alias_guards_reject_unproven_targets() {
    for (import, caller, target) in [
        (
            "#[cfg(any())] use crate::worker as api;",
            "pub fn caller() { api::target(); }",
            "pub fn target() {}",
        ),
        (
            "use foreign::worker as api;",
            "pub fn caller() { api::target(); }",
            "pub fn target() {}",
        ),
        (
            "use crate::worker as api; use crate::other as api;",
            "pub fn caller() { api::target(); }",
            "pub fn target() {}",
        ),
        (
            "use crate::worker as api;",
            "pub fn caller<api>() { api::target(); }",
            "pub fn target() {}",
        ),
        (
            "use crate::worker as api;",
            "pub fn caller() { type api = Other; api::target(); }",
            "pub fn target() {}",
        ),
        (
            "use crate::worker as api;",
            "pub fn caller() { api::target(); }",
            "fn target() {}",
        ),
        (
            "use crate::worker as api;",
            "pub fn caller() { use crate::other as api; api::target(); }",
            "pub fn target() {}",
        ),
    ] {
        let source = format!("mod worker; mod other; {import} {caller}");
        let repo = rust_alias_fixture(&source, target);
        let state = TestDirectory::new("alias-negative");
        Runtime::index(repo.path(), state.path()).unwrap();
        let runtime = Runtime::open(state.path()).unwrap();
        assert!(rust_alias_targets(&runtime).is_empty(), "{source}");
    }
}

#[test]
fn rust_module_alias_local_union_shadows_import() {
    let repo = rust_alias_fixture(
        "mod worker; use crate::worker as api; pub fn caller() { union api { value: u32 } impl api { fn target() {} } api::target(); }",
        "pub fn target() {}",
    );
    let state = TestDirectory::new("alias-union-state");
    Runtime::index(repo.path(), state.path()).unwrap();
    assert!(rust_alias_targets(&Runtime::open(state.path()).unwrap()).is_empty());
}

#[test]
fn rust_grouped_alias_resolves_and_retargets() {
    for imports in [
        "use crate::{worker as api, other as backup};",
        "use {crate::worker as api, crate::other as backup};",
        "use crate::{ /* primary */ worker as api, // sibling\n other as backup };",
    ] {
        let original =
            format!("mod worker; mod other; {imports} pub fn caller() {{ api::target(); }}");
        let repo = rust_alias_fixture(&original, "pub fn target() {}");
        let state = TestDirectory::new("grouped-alias");
        Runtime::index(repo.path(), state.path()).unwrap();
        let mut runtime = Runtime::open(state.path()).unwrap();
        assert_eq!(rust_alias_targets(&runtime), ["src/worker.rs"], "{imports}");
        assert_eq!(
            rust_alias_targets(&Runtime::open(state.path()).unwrap()),
            ["src/worker.rs"]
        );
        let changed = original
            .replace("worker as api", "other as api")
            .replace("other as backup", "worker as backup");
        fs::write(repo.path().join("src/lib.rs"), changed).unwrap();
        runtime.refresh(repo.path()).unwrap();
        assert_eq!(rust_alias_targets(&runtime), ["src/other.rs"]);
    }
}

#[test]
fn rust_grouped_alias_rejects_conflicts_and_shadowing() {
    for (imports, body) in [
        (
            "use crate::{worker as api, other as api};",
            "api::target();",
        ),
        (
            "#[cfg(any())] use crate::{worker as api};",
            "api::target();",
        ),
        ("use foreign::{worker as api};", "api::target();"),
        (
            "use crate::{worker as api}; use foreign::api;",
            "api::target();",
        ),
        (
            "use crate::{worker as api};",
            "union api { x: u32 } impl api { fn target() {} } api::target();",
        ),
        (
            "use crate::{worker as api};",
            "type api = Other; api::target();",
        ),
        (
            "use crate::{worker as api};",
            "use crate::other as api; api::target();",
        ),
    ] {
        let repo = rust_alias_fixture(
            &format!("mod worker; mod other; {imports} pub fn caller() {{ {body} }}"),
            "pub fn target() {}",
        );
        let state = TestDirectory::new("grouped-negative");
        Runtime::index(repo.path(), state.path()).unwrap();
        assert!(
            rust_alias_targets(&Runtime::open(state.path()).unwrap()).is_empty(),
            "{imports} {body}"
        );
    }
}

#[test]
fn rust_self_alias_resolves_and_retargets() {
    for import in [
        "use crate::worker::{self as api};",
        "use crate::{worker::{self as api}};",
        "use crate::worker::{ /* module */ self as api};",
    ] {
        let original =
            format!("mod worker; mod other; {import} pub fn caller() {{ api::target(); }}");
        let repo = rust_alias_fixture(&original, "pub fn target() {}");
        let state = TestDirectory::new("self-alias");
        Runtime::index(repo.path(), state.path()).unwrap();
        let mut runtime = Runtime::open(state.path()).unwrap();
        assert_eq!(rust_alias_targets(&runtime), ["src/worker.rs"], "{import}");
        assert_eq!(
            rust_alias_targets(&Runtime::open(state.path()).unwrap()),
            ["src/worker.rs"]
        );
        fs::write(
            repo.path().join("src/lib.rs"),
            original.replace("worker::{", "other::{"),
        )
        .unwrap();
        runtime.refresh(repo.path()).unwrap();
        assert_eq!(rust_alias_targets(&runtime), ["src/other.rs"]);
    }
}

#[test]
fn rust_self_alias_keeps_namespace_and_visibility_guards() {
    for (import, body, target) in [
        (
            "#[cfg(any())] use crate::worker::{self as api};",
            "api::target();",
            "pub fn target() {}",
        ),
        (
            "use foreign::worker::{self as api};",
            "api::target();",
            "pub fn target() {}",
        ),
        (
            "use crate::worker::{self as api}; use crate::other as api;",
            "api::target();",
            "pub fn target() {}",
        ),
        (
            "use crate::worker::{self as api};",
            "api::target();",
            "fn target() {}",
        ),
        (
            "use crate::worker::{self as api};",
            "union api { x: u32 } impl api { fn target() {} } api::target();",
            "pub fn target() {}",
        ),
        (
            "use crate::worker::{self as api};",
            "use crate::other as api; api::target();",
            "pub fn target() {}",
        ),
    ] {
        let repo = rust_alias_fixture(
            &format!("mod worker; mod other; {import} pub fn caller() {{ {body} }}"),
            target,
        );
        let state = TestDirectory::new("self-alias-negative");
        Runtime::index(repo.path(), state.path()).unwrap();
        assert!(
            rust_alias_targets(&Runtime::open(state.path()).unwrap()).is_empty(),
            "{import} {body}"
        );
    }
}

fn nested_alias_fixture(import: &str, body: &str, child_decl: &str) -> TestDirectory {
    let repo = rust_alias_fixture(
        &format!("mod worker; mod other; {import} pub fn caller() {{ {body} }}"),
        child_decl,
    );
    for parent in ["worker", "other"] {
        fs::create_dir_all(repo.path().join(format!("src/{parent}"))).unwrap();
        fs::write(
            repo.path().join(format!("src/{parent}/child.rs")),
            "pub fn target() {}",
        )
        .unwrap();
    }
    fs::write(repo.path().join("src/other.rs"), "pub mod child;").unwrap();
    git(repo.path(), &["add", "."]);
    git(repo.path(), &["commit", "-qm", "nested alias"]);
    repo
}

#[test]
fn rust_nested_alias_resolves_reopens_and_retargets() {
    for import in [
        "use crate::worker as api;",
        "use crate::{worker as api};",
        "use crate::worker::{self as api};",
    ] {
        let repo = nested_alias_fixture(import, "api::child::target();", "pub mod child;");
        let state = TestDirectory::new("nested-alias");
        Runtime::index(repo.path(), state.path()).unwrap();
        let mut runtime = Runtime::open(state.path()).unwrap();
        assert_eq!(
            rust_alias_targets(&runtime),
            ["src/worker/child.rs"],
            "{import}"
        );
        assert_eq!(
            rust_alias_targets(&Runtime::open(state.path()).unwrap()),
            ["src/worker/child.rs"]
        );
        let path = repo.path().join("src/lib.rs");
        let original = fs::read_to_string(&path).unwrap();
        fs::write(
            &path,
            original
                .replace("worker as api", "other as api")
                .replace("worker::{", "other::{"),
        )
        .unwrap();
        runtime.refresh(repo.path()).unwrap();
        assert_eq!(rust_alias_targets(&runtime), ["src/other/child.rs"]);
        fs::write(&path, original).unwrap();
        runtime.refresh(repo.path()).unwrap();
        assert_eq!(rust_alias_targets(&runtime), ["src/worker/child.rs"]);
    }
}

#[test]
fn rust_nested_alias_rejects_unproven_paths() {
    for (import, body, child) in [
        (
            "use crate::worker as api;",
            "api::child::target();",
            "mod child;",
        ),
        (
            "use crate::worker as api;",
            "api::child::target();",
            "#[cfg(any())] pub mod child;",
        ),
        (
            "#[cfg(any())] use crate::worker as api;",
            "api::child::target();",
            "pub mod child;",
        ),
        (
            "use foreign::worker as api;",
            "api::child::target();",
            "pub mod child;",
        ),
        (
            "use crate::worker as api; use crate::other as api;",
            "api::child::target();",
            "pub mod child;",
        ),
        (
            "use crate::worker as api;",
            "type api = Other; api::child::target();",
            "pub mod child;",
        ),
        ("", "crate::worker::child::target();", "mod child;"),
    ] {
        let repo = nested_alias_fixture(import, body, child);
        let state = TestDirectory::new("nested-alias-negative");
        Runtime::index(repo.path(), state.path()).unwrap();
        assert!(
            rust_alias_targets(&Runtime::open(state.path()).unwrap()).is_empty(),
            "{import} {body} {child}"
        );
    }
}

#[test]
fn refresh_does_not_rewrite_git_index_for_metadata_only_changes() {
    assert_refresh_preserves_git_index(false);
}

#[test]
fn refresh_does_not_rewrite_linked_worktree_git_index() {
    assert_refresh_preserves_git_index(true);
}

fn assert_refresh_preserves_git_index(linked: bool) {
    let primary = fixture_repository();
    let worktree = TestDirectory::new("readonly-refresh-linked");
    let repository = if linked {
        git(
            primary.path(),
            &[
                "worktree",
                "add",
                "--quiet",
                "--detach",
                worktree.path().to_str().unwrap(),
                "HEAD",
            ],
        );
        &worktree
    } else {
        &primary
    };
    let state = TestDirectory::new("readonly-refresh-state");
    Runtime::index(repository.path(), state.path()).unwrap();
    let mut runtime = Runtime::open(state.path()).unwrap();
    let snapshot = runtime.snapshot().clone();
    let located = Command::new("git")
        .args(["rev-parse", "--git-path", "index"])
        .current_dir(repository.path())
        .output()
        .unwrap();
    assert!(located.status.success());
    let index = repository
        .path()
        .join(String::from_utf8(located.stdout).unwrap().trim());
    let before = fs::read(&index).unwrap();
    let source_path = repository.path().join("main.py");
    let source = fs::read(&source_path).unwrap();
    // Advance mtime deterministically without changing bytes. Git's ordinary
    // status refresh writes this stat-cache change into its optional index.
    let file = fs::OpenOptions::new()
        .write(true)
        .open(&source_path)
        .unwrap();
    file.set_times(fs::FileTimes::new().set_modified(SystemTime::now() + Duration::from_secs(2)))
        .unwrap();
    assert!(!runtime.refresh(repository.path()).unwrap());
    assert_eq!(runtime.snapshot(), &snapshot);
    assert_eq!(
        fs::read(&index).unwrap(),
        before,
        "read-only refresh rewrote Git index"
    );
    assert_eq!(fs::read(&source_path).unwrap(), source);

    // Disabling optional writes must not suppress actual content discovery.
    fs::write(&source_path, b"def changed():\n    return 7\n").unwrap();
    let lock = index.with_extension("lock");
    fs::write(&lock, b"another Git operation owns this lock").unwrap();
    assert!(runtime.refresh(repository.path()).unwrap());
    assert_eq!(runtime.changed_paths(), ["main.py"]);
    assert_eq!(fs::read(&index).unwrap(), before);
    assert_eq!(
        fs::read(&lock).unwrap(),
        b"another Git operation owns this lock"
    );
    fs::remove_file(lock).unwrap();
}
