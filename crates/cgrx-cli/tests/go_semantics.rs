use cgrx_cli::Runtime;
use cgrx_core::{RelationKind, Scope};
use cgrx_languages::{Provenance, RelationKind as LanguageRelation, UnresolvedKind, pack_for_path};
use cgrx_store::GenerationReader;
use serde_json::Value;
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
};

static SEQUENCE: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
struct Fixture {
    base: PathBuf,
}
impl Fixture {
    fn new(source: &str) -> Self {
        let base = std::env::temp_dir().join(format!(
            "cgrx-go-semantics-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, std::sync::atomic::Ordering::Relaxed)
        ));
        let this = Self { base };
        fs::create_dir_all(this.root().join("decoy")).unwrap();
        fs::write(this.root().join("main.go"), source).unwrap();
        fs::write(
            this.root().join("decoy/main.go"),
            "package decoy\ntype Concrete struct{}\nfunc (Concrete) Run() int { return 99 }\n",
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
                    .current_dir(this.root())
                    .status()
                    .unwrap()
                    .success()
            );
        }
        Runtime::index(&this.root(), &this.state()).unwrap();
        this
    }
    fn root(&self) -> PathBuf {
        self.base.join("repo")
    }
    fn state(&self) -> PathBuf {
        self.base.join("state")
    }
    fn runtime(&self) -> Runtime {
        Runtime::open(&self.state()).unwrap()
    }
    fn stored(&self) -> Value {
        let reader = GenerationReader::open_current(&self.state()).unwrap();
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap()
    }
}
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.base);
    }
}
fn cases() -> Vec<Value> {
    serde_json::from_str(include_str!("go_semantics/cases.json")).unwrap()
}
fn trace(runtime: &Runtime) -> Value {
    runtime
        .trace_path(
            "Caller",
            Some("main.go"),
            "callees",
            1,
            &Scope {
                include: vec![],
                exclude: vec![],
                relation_kinds: vec![RelationKind::Calls],
                max_depth: 1,
            },
            20,
        )
        .unwrap()
}
fn extraction(source: &str) -> cgrx_languages::Extraction {
    let path = Path::new("main.go");
    pack_for_path(path)
        .unwrap()
        .extract(path, source.as_bytes())
        .unwrap()
}
#[test]
fn explicit_embedded_methods_have_exact_target_and_callsite() {
    for case in cases().into_iter().filter(|c| c["positive"] == true) {
        let source = case["source"].as_str().unwrap();
        let fixture = Fixture::new(source);
        let result = trace(&fixture.runtime());
        assert_eq!(result["total"], 1, "{}: {result}", case["id"]);
        let declaration = case["target_declaration"].as_str().unwrap();
        let target = source.find(declaration).unwrap() + declaration.len() - 3;
        let node = &result["nodes"][0];
        assert_eq!(node["path"], "main.go");
        assert_eq!(node["symbol"], "Run");
        assert_eq!(
            node["span"],
            serde_json::json!({"start": target, "end": target + 3})
        );
        let stored = fixture.stored();
        let arcs = stored["arcs"].as_array().unwrap();
        assert_eq!(arcs.len(), 1, "{}: {stored}", case["id"]);
        assert_eq!(arcs[0]["target"], node["node_id"]);
        assert_eq!(arcs[0]["evidence"]["confidence"], "PROVEN");
        let span = &arcs[0]["evidence"]["span"];
        let start = span["start"].as_u64().unwrap() as usize;
        let end = span["end"].as_u64().unwrap() as usize;
        assert_eq!(&source[start..end], case["call"].as_str().unwrap());
    }
}
#[test]
fn interfaces_ambiguity_and_shadowing_remain_dispatch_gaps() {
    for case in cases().into_iter().filter(|c| c["positive"] == false) {
        let source = case["source"].as_str().unwrap();
        let fixture = Fixture::new(source);
        let result = trace(&fixture.runtime());
        assert_eq!(result["total"], 0, "{}: {result}", case["id"]);
        assert!(
            fixture.stored()["arcs"].as_array().unwrap().is_empty(),
            "{}: unexpected proven edge",
            case["id"]
        );
        let extracted = extraction(source);
        let call_text = case["call"].as_str().unwrap();
        let call = source.find(call_text).unwrap();
        assert!(
            extracted
                .unresolved
                .iter()
                .any(|gap| gap.kind == UnresolvedKind::Dispatch
                    && gap.span.start == call
                    && gap.span.end == call + call_text.len()),
            "{}: uncertain selector must retain its own dispatch gap",
            case["id"]
        );
    }
}
#[test]
fn embedded_provenance_binds_owner_field_type_and_method() {
    let all = cases();
    let source = all[0]["source"].as_str().unwrap();
    let extracted = extraction(source);
    let edge = extracted
        .edges
        .iter()
        .find(|e| e.relation == LanguageRelation::Calls && e.target == "s.Concrete.Run")
        .expect("embedded field call needs exact provenance");
    let Provenance::GoFieldReceiver {
        package,
        caller,
        receiver_type,
        field,
        field_type,
        target,
    } = edge.provenance
    else {
        panic!("wrong proof: {:?}", edge.provenance);
    };
    for (span, expected) in [
        (package, "lane"),
        (caller, "Caller"),
        (receiver_type, "Service"),
        (field, "Concrete"),
        (field_type, "Concrete"),
        (target, "Run"),
    ] {
        assert_eq!(&source[span.start..span.end], expected);
    }
    assert_ne!(
        field, field_type,
        "field occurrence must not masquerade as type declaration"
    );
    assert_eq!(field_type.start, source.find("type Concrete").unwrap() + 5);
    assert!(field.start > source.find("type Service").unwrap());
}
#[test]
fn refreshed_interface_replaces_concrete_field_with_gap_and_restores() {
    let all = cases();
    let source = all[0]["source"].as_str().unwrap();
    let fixture = Fixture::new(source);
    let mut runtime = fixture.runtime();
    let before = trace(&runtime);
    assert_eq!(before["total"], 1);
    let changed = source
        .replace(
            "type Concrete struct { Value int }",
            "type Concrete interface { Run() int }",
        )
        .replace("func (c Concrete) Run() int { return 1 }", "");
    fs::write(fixture.root().join("main.go"), changed).unwrap();
    assert!(runtime.refresh(&fixture.root()).unwrap());
    assert_eq!(trace(&runtime)["total"], 0);
    fs::write(fixture.root().join("main.go"), source).unwrap();
    assert!(runtime.refresh(&fixture.root()).unwrap());
    assert_eq!(trace(&runtime)["nodes"], before["nodes"]);
}

#[test]
fn cross_file_owner_method_does_not_inherit_an_embedded_target_proof() {
    let all = cases();
    let source = all[0]["source"]
        .as_str()
        .unwrap()
        .replace("s.Concrete.Run()", "s.Run()");
    let fixture = Fixture::new(&source);
    fs::write(
        fixture.root().join("override.go"),
        "package lane\nfunc (s *Service) Run() int { return 88 }\n",
    )
    .unwrap();
    let mut runtime = fixture.runtime();
    assert!(runtime.refresh(&fixture.root()).unwrap());
    assert_eq!(
        trace(&runtime)["total"],
        0,
        "implicit promotion lacks package-wide override proof"
    );
}

#[test]
fn explicit_field_selection_survives_cross_file_owner_override() {
    let all = cases();
    let source = all[0]["source"].as_str().unwrap();
    let fixture = Fixture::new(source);
    let mut runtime = fixture.runtime();
    let before = trace(&runtime);
    assert_eq!(before["total"], 1);
    fs::write(
        fixture.root().join("override.go"),
        "package lane\nfunc (s *Service) Run() int { return 88 }\n",
    )
    .unwrap();
    assert!(runtime.refresh(&fixture.root()).unwrap());
    assert_eq!(
        trace(&runtime)["nodes"],
        before["nodes"],
        "explicit field selects Concrete, not Service"
    );
}
