use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};
use cgrx_store::{GenerationReader, GenerationWriter};
use serde_json::Value;
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

static FIXTURE_SEQUENCE: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);

struct Fixture {
    root: PathBuf,
    state: PathBuf,
}
impl Fixture {
    fn new(source: &str) -> Self {
        let base = std::env::temp_dir().join(format!(
            "cgrx-go-self-{}-{}-{}",
            std::process::id(),
            FIXTURE_SEQUENCE.fetch_add(1, std::sync::atomic::Ordering::Relaxed),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let root = base.join("repo");
        let state = base.join("state");
        fs::create_dir_all(root.join("auth")).unwrap();
        fs::create_dir_all(root.join("app")).unwrap();
        fs::write(root.join("auth/service.go"), source).unwrap();
        fs::write(root.join("app/service.go"), "package app\ntype Service struct{}\nfunc (s *Service) Target() {}\nfunc (s *Service) Missing() {}\n").unwrap();
        fs::write(
            root.join("auth/other.go"),
            "package auth\nfunc (s *Service) Missing() {}\n",
        )
        .unwrap();
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
    fn stored(&self) -> Value {
        let reader = GenerationReader::open_current(&self.state).unwrap();
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap()
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(self.root.parent().unwrap());
    }
}
fn scope() -> Scope {
    Scope {
        include: vec![],
        exclude: vec![],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 4,
    }
}
fn trace(runtime: &Runtime, name: &str) -> Value {
    runtime
        .trace_path(name, Some("auth/service.go"), "callees", 1, &scope(), 50)
        .unwrap()
}

#[test]
fn go_self_runtime_proves_actual_receiver_target_path_symbol_and_span() {
    let source = "package auth\ntype Service struct{}\ntype Other struct{}\nfunc (s *Other) Target() {}\nfunc (s *Service) Login() { s.Target(); s.Target() }\nfunc (s *Service) Target() {}\n";
    let fixture = Fixture::new(source);
    let result = trace(&fixture.runtime(), "Login");
    assert_eq!(result["total"], 1, "{result}");
    let node = &result["nodes"][0];
    assert_eq!(node["path"], "auth/service.go");
    assert_eq!(node["symbol"], "Target");
    let target = source.rfind("Target()").unwrap();
    assert_eq!(node["span"]["start"], target);
    assert_eq!(node["span"]["end"], target + 6);
    let stored = fixture.stored();
    let arcs = stored["arcs"].as_array().unwrap();
    assert_eq!(
        arcs.len(),
        2,
        "two distinct callsite proofs, one traced target"
    );
    for arc in arcs {
        assert_eq!(arc["target"], node["node_id"]);
        assert_eq!(arc["evidence"]["path"], "auth/service.go");
        let start = arc["evidence"]["span"]["start"].as_u64().unwrap() as usize;
        let end = arc["evidence"]["span"]["end"].as_u64().unwrap() as usize;
        assert_eq!(&source[start..end], "s.Target()");
    }
}

#[test]
fn go_self_runtime_negative_scenarios_never_guess_a_target() {
    for body in [
        "s.Missing()",
        "s.cb()",
        "s.store.Target()",
        "{ s := other; s.Target() }",
        "for _, s := range others { s.Target() }",
        "switch s := x.(type) { case Other: s.Target() }",
        "f := func(s *Other) { s.Target() }; _ = f",
        "f := func() { s.Target() }; _ = f",
        "Other(s).Target()",
        "(Other{}).Target()",
    ] {
        let source = format!(
            "package auth\ntype Service struct{{ cb func(); store *Other }}\ntype Other struct{{}}\nfunc (s *Service) Target() {{}}\nfunc (s *Service) Login() {{ {body} }}\n"
        );
        let fixture = Fixture::new(&source);
        let result = trace(&fixture.runtime(), "Login");
        assert_eq!(result["total"], 0, "false arc for {body}: {result}");
        assert!(
            !fixture.stored()["coverage"]["dynamic_dispatch"]
                .as_array()
                .unwrap()
                .is_empty(),
            "lost gap: {body}"
        );
    }
}

#[test]
fn go_self_runtime_frozen_mfa_shape_recovers_three_exact_edges() {
    let source = "package auth\nfunc (s *Service) Login() { s.LoginWithOptions() }\nfunc (s *Service) LoginWithOptions() { s.authenticatedPasswordUser(); s.completeUserLogin() }\nfunc (s *Service) authenticatedPasswordUser() {}\nfunc (s *Service) completeUserLogin() {}\n";
    let fixture = Fixture::new(source);
    let runtime = fixture.runtime();
    for (caller, targets) in [
        ("Login", vec!["LoginWithOptions"]),
        (
            "LoginWithOptions",
            vec!["authenticatedPasswordUser", "completeUserLogin"],
        ),
    ] {
        let result = trace(&runtime, caller);
        assert_eq!(result["total"], targets.len(), "{result}");
        for (node, target) in result["nodes"].as_array().unwrap().iter().zip(targets) {
            let at = source.find(&format!("func (s *Service) {target}")).unwrap()
                + "func (s *Service) ".len();
            assert_eq!(node["symbol"], target);
            assert_eq!(node["path"], "auth/service.go");
            assert_eq!(node["span"]["start"], at);
            assert_eq!(node["span"]["end"], at + target.len());
        }
    }
}

#[test]
fn go_self_runtime_rejects_pre_fix_extraction_cache() {
    let fixture = Fixture::new(
        "package auth\nfunc (s *Service) Login() { s.Target() }\nfunc (s *Service) Target() {}\n",
    );
    let reader = GenerationReader::open_current(&fixture.state).unwrap();
    let mut stored = fixture.stored();
    stored
        .as_object_mut()
        .unwrap()
        .remove("extraction_revision");
    let legacy = fixture.root.parent().unwrap().join("legacy");
    let mut writer = GenerationWriter::begin(&legacy, reader.snapshot().clone()).unwrap();
    writer
        .write_segment("nodes.seg", &serde_json::to_vec(&stored).unwrap())
        .unwrap();
    for name in ["edges.seg", "terms.fst"] {
        writer
            .write_segment(name, &reader.read_segment(name).unwrap())
            .unwrap();
    }
    writer.validate().unwrap();
    writer.publish().unwrap();
    let error = Runtime::open(Path::new(&legacy))
        .err()
        .expect("old extraction must request reindex");
    assert_eq!(error.code(), "extraction_revision");
}

#[test]
fn go_imported_heap_push_never_resolves_to_local_method_or_package() {
    let source = "package auth\nimport \"container/heap\"\ntype Service struct{}\ntype PriorityQueue struct{}\nfunc (q *PriorityQueue) Push(x any) {}\nfunc (s *Service) Enqueue() { heap.Push(nil, nil); s.checkRateLimit(); s.taskPriorityToInt() }\nfunc (s *Service) checkRateLimit() {}\nfunc (s *Service) taskPriorityToInt() {}\n";
    let fixture = Fixture::new(source);
    let result = trace(&fixture.runtime(), "Enqueue");
    let names: Vec<_> = result["nodes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|n| n["symbol"].as_str().unwrap())
        .collect();
    assert_eq!(names, ["checkRateLimit", "taskPriorityToInt"], "{result}");
    // Even a repository directory named heap cannot impersonate container/heap.
    fs::create_dir_all(fixture.root.join("heap")).unwrap();
    fs::write(
        fixture.root.join("heap/fake.go"),
        "package heap\nfunc Push(a any, b any) {}\n",
    )
    .unwrap();
    let mut runtime = fixture.runtime();
    runtime.refresh(&fixture.root).unwrap();
    assert_eq!(trace(&runtime, "Enqueue")["nodes"], result["nodes"]);
}

#[test]
fn go_import_path_cannot_be_impersonated_by_local_package_basename() {
    let fixture = Fixture::new(
        "package auth\nimport \"remote.example/app\"\nfunc Login() { app.Target() }\n",
    );
    assert_eq!(trace(&fixture.runtime(), "Login")["total"], 0);
}

#[test]
fn go_managed_startup_reindexes_obsolete_cache() {
    let fixture = Fixture::new(
        "package auth\nfunc (s *Service) Login() { s.Target() }\nfunc (s *Service) Target() {}\n",
    );
    let reader = GenerationReader::open_current(&fixture.state).unwrap();
    let mut stored = fixture.stored();
    stored
        .as_object_mut()
        .unwrap()
        .remove("extraction_revision");
    stored["arcs"] = serde_json::json!([]);
    // Reproduce the pre-fix generation key: BLAKE3(HEAD), truncated to u64.
    let mut legacy_snapshot = reader.snapshot().clone();
    let digest = blake3::hash(legacy_snapshot.repo_revision.as_bytes());
    legacy_snapshot.graph_generation =
        u64::from_le_bytes(digest.as_bytes()[..8].try_into().unwrap()) % 10_000_000_000_000_000;
    stored["snapshot"] = serde_json::to_value(&legacy_snapshot).unwrap();
    let managed = fixture.root.join(".git/cgrx/managed");
    let mut writer = GenerationWriter::begin(&managed, legacy_snapshot).unwrap();
    writer
        .write_segment("nodes.seg", &serde_json::to_vec(&stored).unwrap())
        .unwrap();
    for name in ["edges.seg", "terms.fst"] {
        writer
            .write_segment(name, &reader.read_segment(name).unwrap())
            .unwrap();
    }
    writer.validate().unwrap();
    writer.publish().unwrap();
    let result = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["status", "--root"])
        .arg(&fixture.root)
        .output()
        .unwrap();
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
    let runtime = Runtime::open(&managed).unwrap();
    assert_eq!(trace(&runtime, "Login")["total"], 1);
}

#[test]
fn go_local_import_requires_module_path_and_function_not_method() {
    let source = "package auth\nimport alias \"example.test/app\"\nfunc Login() { alias.Target() }\nfunc Target() {}\n";
    let fixture = Fixture::new(source);
    fs::write(
        fixture.root.join("go.mod"),
        "module example.test\ngo 1.23\n",
    )
    .unwrap();
    fs::write(
        fixture.root.join("app/service.go"),
        "package app\nfunc Target() {}\ntype Service struct{}\nfunc (s *Service) Target() {}\n",
    )
    .unwrap();
    assert!(
        Command::new("git")
            .args(["add", "."])
            .current_dir(&fixture.root)
            .status()
            .unwrap()
            .success()
    );
    assert!(
        Command::new("git")
            .args([
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-qm",
                "module"
            ])
            .current_dir(&fixture.root)
            .status()
            .unwrap()
            .success()
    );
    Runtime::index(&fixture.root, &fixture.state).unwrap();
    let mut runtime = fixture.runtime();
    let result = trace(&runtime, "Login");
    assert_eq!(result["total"], 1, "{result}");
    assert_eq!(result["nodes"][0]["path"], "app/service.go");
    assert_eq!(result["nodes"][0]["span"]["start"], 17);
    // A changed manifest invalidates imported proofs instead of retaining a
    // name-only arc under a different namespace.
    fs::write(fixture.root.join("go.mod"), "module another.test\n").unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_eq!(trace(&runtime, "Login")["total"], 0);
}

#[test]
fn go_self_runtime_field_and_map_writes_preserve_exact_method_calls() {
    for body in ["s.Field = x; s.Target()", "s.Map[key] = value; s.Target()"] {
        let source = format!(
            "package auth\ntype Service struct{{ Field int; Map map[string]int }}\nfunc (s *Service) Login() {{ {body} }}\nfunc (s *Service) Target() {{}}\n"
        );
        let fixture = Fixture::new(&source);
        let result = trace(&fixture.runtime(), "Login");
        assert_eq!(result["total"], 1, "{body}: {result}");
        assert_eq!(result["nodes"][0]["path"], "auth/service.go");
        assert_eq!(result["nodes"][0]["symbol"], "Target");
        assert_eq!(
            result["nodes"][0]["span"]["start"],
            source.rfind("Target()").unwrap()
        );
    }
}

#[test]
fn go_own_module_import_survives_only_proven_unrelated_replacements() {
    for (label, replacements, expected) in [
        (
            "unrelated_module",
            "replace example.test/threads => ./threads\n",
            true,
        ),
        (
            "unrelated_block",
            "replace (\n // dependency overrides\n example.test/threads => ./threads\n example.test/lib v1.2.3 => example.test/fork v1.2.4\n)\n",
            true,
        ),
        (
            "unrelated_versioned",
            "replace example.test/lib v1.2.3 => ../local\n",
            true,
        ),
        (
            "segment_not_text_prefix",
            "replace example.test/rooted/lib => ./local\n",
            true,
        ),
        ("self", "replace example.test/root => ./other\n", false),
        (
            "descendant",
            "replace example.test/root/app => ./other\n",
            false,
        ),
        (
            "mixed_block",
            "replace (\n example.test/threads => ./threads\n example.test/root/app v1.2.3 => ./other\n)\n",
            false,
        ),
        (
            "unterminated_block",
            "replace (\n example.test/threads => ./threads\n",
            false,
        ),
        (
            "missing_arrow",
            "replace example.test/threads ./threads\n",
            false,
        ),
        (
            "extra_arrow",
            "replace example.test/threads => ./threads => ./other\n",
            false,
        ),
        (
            "inline_block_unsupported",
            "replace ( example.test/threads => ./threads )\n",
            false,
        ),
        (
            "quoted_path_unsupported",
            "replace \"example.test/threads\" => ./threads\n",
            false,
        ),
        (
            "block_comment_unsupported",
            "replace /* comment */ example.test/threads => ./threads\n",
            false,
        ),
    ] {
        let fixture = Fixture::new(
            "package auth\nimport \"example.test/root/app\"\nfunc Login() { app.Target() }\n",
        );
        fs::write(
            fixture.root.join("go.mod"),
            format!("module example.test/root\ngo 1.23\n{replacements}"),
        )
        .unwrap();
        fs::write(
            fixture.root.join("app/service.go"),
            "package app\nfunc Target() {}\n",
        )
        .unwrap();
        for args in [
            vec!["add", "."],
            vec![
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-qm",
                "replacement fixture",
            ],
        ] {
            assert!(
                Command::new("git")
                    .args(args)
                    .current_dir(&fixture.root)
                    .status()
                    .unwrap()
                    .success()
            );
        }
        Runtime::index(&fixture.root, &fixture.state).unwrap();
        let mut runtime = fixture.runtime();
        let result = trace(&runtime, "Login");
        assert_eq!(result["total"], usize::from(expected), "{label}: {result}");
        if expected {
            let target = &result["nodes"][0];
            assert_eq!(target["symbol"], "Target", "{label}");
            assert_eq!(target["path"], "app/service.go", "{label}");
            assert_eq!(
                target["span"],
                serde_json::json!({"start":17,"end":23}),
                "{label}"
            );
            fs::write(
                fixture.root.join("go.mod"),
                "module example.test/root\nreplace example.test/root/app => ./other\n",
            )
            .unwrap();
            assert!(runtime.refresh(&fixture.root).unwrap());
            assert_eq!(
                trace(&runtime, "Login")["total"],
                0,
                "{label}: relevant override must invalidate"
            );
            fs::write(
                fixture.root.join("go.mod"),
                format!("module example.test/root\ngo 1.23\n{replacements}"),
            )
            .unwrap();
            assert!(runtime.refresh(&fixture.root).unwrap());
            assert_eq!(
                trace(&runtime, "Login")["nodes"],
                result["nodes"],
                "{label}: unrelated override restores proof"
            );
        }
    }
}

fn go_package_identity_fixture(import: &str, call: &str, package: &str, field: bool) -> Fixture {
    let declarations = if field {
        "var foo = struct{ Target func() }{Target: local}\nfunc local() {}\n"
    } else {
        ""
    };
    let fixture = Fixture::new(&format!(
        "package auth\nimport {import}\n{declarations}func Login() {{ {call} }}\n"
    ));
    fs::create_dir_all(fixture.root.join("foo")).unwrap();
    fs::write(
        fixture.root.join("foo/api.go"),
        format!("package {package}\nfunc Target() {{}}\n"),
    )
    .unwrap();
    fs::write(
        fixture.root.join("go.mod"),
        "module example.test\ngo 1.23\n",
    )
    .unwrap();
    for args in [
        vec!["add", "."],
        vec![
            "-c",
            "user.name=Test",
            "-c",
            "user.email=test@example.invalid",
            "commit",
            "-qm",
            "package identity",
        ],
    ] {
        assert!(
            Command::new("git")
                .args(args)
                .current_dir(&fixture.root)
                .status()
                .unwrap()
                .success()
        );
    }
    Runtime::index(&fixture.root, &fixture.state).unwrap();
    fixture
}

#[test]
fn go_implicit_import_basename_cannot_prove_package_variable_field_call() {
    let fixture = go_package_identity_fixture("\"example.test/foo\"", "foo.Target()", "bar", true);
    let runtime = fixture.runtime();
    assert_eq!(trace(&runtime, "Login")["total"], 0);
    let source = fs::read_to_string(fixture.root.join("auth/service.go")).unwrap();
    let at = source.find("foo.Target()").unwrap();
    assert!(runtime.coverage().dynamic_dispatch.contains(&format!(
        "auth/service.go:{at}-{}",
        at + "foo.Target()".len()
    )));
}

#[test]
fn go_explicit_alias_proves_target_with_different_package_clause() {
    let fixture = go_package_identity_fixture(
        "chosen \"example.test/foo\"",
        "chosen.Target()",
        "bar",
        false,
    );
    let result = trace(&fixture.runtime(), "Login");
    assert_eq!(result["total"], 1);
    assert_eq!(result["nodes"][0]["path"], "foo/api.go");
    assert_eq!(result["nodes"][0]["symbol"], "Target");
    assert_eq!(
        result["nodes"][0]["span"],
        serde_json::json!({"start":17,"end":23})
    );
}

#[test]
fn go_implicit_import_package_clause_refresh_invalidates_unchanged_target_span() {
    let fixture = go_package_identity_fixture("\"example.test/foo\"", "foo.Target()", "foo", false);
    let mut runtime = fixture.runtime();
    let before = trace(&runtime, "Login");
    assert_eq!(before["total"], 1);
    assert_eq!(before["nodes"][0]["path"], "foo/api.go");
    assert_eq!(
        before["nodes"][0]["span"],
        serde_json::json!({"start":17,"end":23})
    );
    fs::write(
        fixture.root.join("foo/api.go"),
        "package bar\nfunc Target() {}\n",
    )
    .unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_eq!(trace(&runtime, "Login")["total"], 0);
    assert!(!runtime.coverage().dynamic_dispatch.is_empty());
    fs::write(
        fixture.root.join("foo/api.go"),
        "package foo\nfunc Target() {}\n",
    )
    .unwrap();
    assert!(runtime.refresh(&fixture.root).unwrap());
    assert_eq!(trace(&runtime, "Login")["nodes"], before["nodes"]);
    assert!(runtime.coverage().dynamic_dispatch.is_empty());
}

#[test]
fn go_implicit_nonbasename_package_name_stays_an_explicit_gap() {
    let fixture = go_package_identity_fixture("\"example.test/foo\"", "bar.Target()", "bar", false);
    let runtime = fixture.runtime();
    assert_eq!(trace(&runtime, "Login")["total"], 0);
    assert!(!runtime.coverage().dynamic_dispatch.is_empty());
}
