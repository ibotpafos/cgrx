use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};
use cgrx_store::GenerationReader;
use serde_json::Value;
use std::{
    fs,
    path::PathBuf,
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
            "cgrx-go-precision-{}-{}-{}",
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
fn nested_named_struct_fields_do_not_hide_receiver_methods() {
    for nested in [
        "Nested struct { Target func() }",
        "Nested *struct { Target func() }",
        "Nested struct { Deeper struct { Target func() } }",
    ] {
        let source = format!(
            "package auth\ntype Service struct{{ {nested} }}\ntype Other struct{{}}\nfunc (o *Other) Target() {{}}\nfunc (s *Service) Login() {{ s.Target() }}\nfunc (s *Service) Target() {{}}\n"
        );
        let fixture = Fixture::new(&source);
        let result = trace(&fixture.runtime(), "Login");
        assert_eq!(result["total"], 1, "{nested}: {result}");
        let node = &result["nodes"][0];
        assert_eq!(node["path"], "auth/service.go");
        assert_eq!(node["symbol"], "Target");
        let start = source.rfind("Target()").unwrap();
        assert_eq!(
            node["span"],
            serde_json::json!({"start": start, "end": start + 6})
        );
        let stored = fixture.stored();
        let arcs = stored["arcs"].as_array().unwrap();
        assert_eq!(arcs.len(), 1);
        assert_eq!(arcs[0]["target"], node["node_id"]);
        let evidence = &arcs[0]["evidence"]["span"];
        let start = evidence["start"].as_u64().unwrap() as usize;
        let end = evidence["end"].as_u64().unwrap() as usize;
        assert_eq!(&source[start..end], "s.Target()");
    }
}

#[test]
fn nested_field_calls_interfaces_and_embedding_do_not_guess_methods() {
    for (fields, body) in [
        ("Nested struct { Target func() }", "s.Nested.Target()"),
        ("Nested interface { Target() }", "s.Nested.Target()"),
        ("Other", "s.Target()"),
        ("Target func()", "s.Target()"),
        (
            "Nested struct { Target func() }",
            "{ s := &Other{}; s.Target() }",
        ),
    ] {
        let source = format!(
            "package auth\ntype Service struct{{ {fields} }}\ntype Other struct{{}}\nfunc (o *Other) Target() {{}}\nfunc (s *Service) Login() {{ {body} }}\n"
        );
        let fixture = Fixture::new(&source);
        let result = trace(&fixture.runtime(), "Login");
        assert_eq!(result["total"], 0, "{fields} / {body}: {result}");
        assert!(!fixture.runtime().coverage().dynamic_dispatch.is_empty());
    }
}

#[test]
fn direct_field_method_conflicts_still_invalidate_receiver_proof() {
    // Invalid Go declarations must not acquire a guessed call edge.
    let fixture = Fixture::new(
        "package auth\ntype Service struct { Target func(); Nested struct { Target func() } }\nfunc (s *Service) Login() { s.Target() }\nfunc (s *Service) Target() {}\n",
    );
    assert_eq!(trace(&fixture.runtime(), "Login")["total"], 0);
    assert!(!fixture.runtime().coverage().dynamic_dispatch.is_empty());
}
