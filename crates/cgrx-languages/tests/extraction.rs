use cgrx_languages::{ExtractError, Provenance, RelationKind, UnresolvedKind, pack_for_path};
use std::path::{Path, PathBuf};
use tree_sitter::Query;

fn fixture(relative: &str) -> (PathBuf, Vec<u8>) {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../fixtures/adversarial/cases");
    let path = root.join(relative);
    let source = std::fs::read(&path).expect("fixture source exists");
    let logical = relative
        .split_once("/repo/")
        .expect("fixture path contains repository boundary")
        .1;
    (PathBuf::from(logical), source)
}

#[test]
fn extraction_rejects_absolute_repository_paths() {
    let path = Path::new("/tmp/main.ts");
    let error = pack_for_path(path)
        .unwrap()
        .extract(path, b"const x = 1;")
        .unwrap_err();
    assert_eq!(error, ExtractError::AbsolutePath);
}

#[test]
fn static_reference_subset_is_exact_and_shadow_aware_for_every_language() {
    type ReferenceCase<'a> = (&'a str, &'a [u8], &'a [(&'a str, &'a str)]);
    let cases: [ReferenceCase<'_>; 5] = [
        (
            "api.ts",
            b"import type { Model } from './model';\nimport type { External } from 'external';\ntype A = Model;\ntype B = External;\n",
            &[("Model", "./model"), ("External", "external")],
        ),
        (
            "api.go",
            b"package api\nimport (\"example.com/repo/model\"; \"fmt\")\ntype A struct { V model.Model }\ntype B struct { V fmt.Stringer }\n",
            &[("model.Model", "example.com/repo/model"), ("fmt.Stringer", "fmt")],
        ),
        (
            "api.java",
            b"import app.model.Model; import java.time.Instant; final class Api { Model local(Model v) { return v; } Instant external(Instant v) { return v; } }\n",
            &[("Model", "app.model.Model"), ("Instant", "java.time.Instant")],
        ),
        (
            "api.py",
            b"import package.model as model\nimport os\ndef local(v: model.Model): return v\ndef external(v: os.PathLike): return v\n",
            &[("model.Model", "package.model"), ("os.PathLike", "os")],
        ),
        (
            "api.rs",
            b"type A = crate::model::Model;\nfn external<T: serde::Serialize>(v: T) -> T { v }\n",
            &[("crate::model::Model", "crate::model::Model"), ("serde::Serialize", "serde::Serialize")],
        ),
    ];
    for (path, source, expected) in cases {
        let path = Path::new(path);
        let extraction = pack_for_path(path).unwrap().extract(path, source).unwrap();
        let references = extraction
            .edges
            .iter()
            .filter(|edge| edge.relation == RelationKind::References)
            .map(|edge| {
                (
                    std::str::from_utf8(&source[edge.span.start..edge.span.end]).unwrap(),
                    edge.target.as_str(),
                )
            })
            .collect::<std::collections::BTreeSet<_>>();
        assert_eq!(
            references,
            expected.iter().copied().collect(),
            "{}",
            path.display()
        );
    }

    let shadowed = [
        ("api.go", b"package api\nimport \"example.com/repo/model\"\nfunc f(model any) { _ = model.Value }\n".as_slice()),
        ("api.py", b"import package.model as model\ndef f(model: object): return model.Value\n".as_slice()),
        ("api.ts", b"import { Model } from './model';\ntype Model = string;\ntype Alias = Model;\n".as_slice()),
        ("api.java", b"import app.model.Model; final class Model { Model local(Model v) { return v; } }".as_slice()),
    ];
    for (path, source) in shadowed {
        let path = Path::new(path);
        let extraction = pack_for_path(path).unwrap().extract(path, source).unwrap();
        assert!(
            !extraction
                .edges
                .iter()
                .any(|edge| edge.relation == RelationKind::References),
            "{}",
            path.display()
        );
    }
}

#[test]
fn typescript_direct_call_has_span_and_syntax_provenance() {
    let (path, source) = fixture("ts-direct-call/repo/src/main.ts");
    let pack = pack_for_path(&path).expect("TypeScript language pack registered");
    let extraction = pack.extract(&path, &source).expect("fixture parses");

    let edge = extraction
        .edges
        .iter()
        .find(|edge| edge.relation == RelationKind::Calls && edge.target == "greet")
        .expect("direct call edge");
    assert_eq!(&source[edge.span.start..edge.span.end], b"greet()");
    assert_eq!(
        &source[edge.context_span.start..edge.context_span.end],
        b"const message = greet();"
    );
    assert_eq!(edge.provenance, Provenance::Syntax);
    assert!(extraction.parser_error_ranges.is_empty());
}

#[test]
fn typescript_static_member_is_dispatch_but_not_dynamic_property() {
    let source = b"items.map(render);\nservice[method]();\n";
    let path = Path::new("src/main.ts");
    let extraction = pack_for_path(path)
        .expect("TypeScript language pack registered")
        .extract(path, source)
        .expect("source parses");

    let kinds = |call: &str| {
        extraction
            .unresolved
            .iter()
            .filter(|candidate| candidate.text == call)
            .map(|candidate| candidate.kind)
            .collect::<Vec<_>>()
    };
    assert_eq!(kinds("items.map(render)"), vec![UnresolvedKind::Dispatch]);
    assert_eq!(
        kinds("service[method]()"),
        vec![UnresolvedKind::DynamicProperty, UnresolvedKind::Dispatch]
    );
}

#[test]
fn python_direct_call_matches_frozen_gold_span() {
    let (path, source) = fixture("py-direct-call/repo/src/main.py");
    let extraction = pack_for_path(&path)
        .expect("Python language pack registered")
        .extract(&path, &source)
        .expect("fixture parses");
    let edge = extraction
        .edges
        .iter()
        .find(|edge| edge.relation == RelationKind::Calls && edge.target == "greet")
        .expect("direct call edge");
    assert_eq!(&source[edge.span.start..edge.span.end], b"greet()");
    assert_eq!(
        &source[edge.context_span.start..edge.context_span.end],
        b"message = greet()"
    );
}

#[test]
fn java_proves_only_unique_own_class_calls_without_inheritance() {
    let path = Path::new("src/Service.java");
    let source = br#"import java.util.List;
final class Service {
    int target() { return 1; }
    int caller() { return target(); }
    int dispatch(Other other) { return other.target(); }
}
"#;
    let extraction = pack_for_path(path).unwrap().extract(path, source).unwrap();
    assert_eq!(
        extraction
            .symbols
            .iter()
            .map(|item| item.name.as_str())
            .collect::<Vec<_>>(),
        ["Service", "caller", "dispatch", "target"]
    );
    let calls = extraction
        .edges
        .iter()
        .filter(|edge| edge.relation == RelationKind::Calls)
        .collect::<Vec<_>>();
    assert_eq!(calls.len(), 1);
    assert_eq!(calls[0].target, "target");
    assert_eq!(&source[calls[0].span.start..calls[0].span.end], b"target()");
    assert!(
        extraction
            .unresolved
            .iter()
            .any(|gap| gap.text == "other.target()" && gap.kind == UnresolvedKind::Dispatch)
    );
}

#[test]
fn java_overloads_inheritance_and_static_imports_fail_closed() {
    for source in [
        "class Service { int target(){return 1;} int target(int x){return x;} int caller(){return target();} }",
        "class Service extends Base { int target(){return 1;} int caller(){return target();} }",
        "import static tools.Helpers.target; class Service { int target(){return 1;} int caller(){return target();} }",
    ] {
        let extraction = pack_for_path(Path::new("Service.java"))
            .unwrap()
            .extract(Path::new("Service.java"), source.as_bytes())
            .unwrap();
        assert!(
            !extraction
                .edges
                .iter()
                .any(|edge| edge.relation == RelationKind::Calls),
            "{source}"
        );
        assert!(
            extraction
                .unresolved
                .iter()
                .any(|gap| gap.kind == UnresolvedKind::Dispatch),
            "{source}"
        );
    }
}

#[test]
fn java_this_and_typed_receivers_resolve_to_the_defining_class() {
    let source = r#"final class Engine {
    int add() { return this.bump(); }
    int bump() { return 1; }
    int run() { Engine engine = new Engine(); return engine.add(); }
    int viaParam(Engine engine) { return engine.add(); }
}
"#;
    let extraction = pack_for_path(Path::new("Engine.java"))
        .unwrap()
        .extract(Path::new("Engine.java"), source.as_bytes())
        .unwrap();
    let mut calls: Vec<&str> = extraction
        .edges
        .iter()
        .filter(|edge| edge.relation == RelationKind::Calls)
        .map(|edge| edge.target.as_str())
        .collect();
    calls.sort_unstable();
    assert_eq!(calls, ["Engine", "add", "add", "bump"]);
    assert!(
        extraction.unresolved.is_empty(),
        "{:?}",
        extraction.unresolved
    );
}

#[test]
fn java_this_field_receivers_resolve() {
    let source = r#"final class Service {
    Engine engine = new Engine();
    int run() { return this.engine.add(); }
}
final class Engine {
    int add() { return 1; }
}
"#;
    let extraction = pack_for_path(Path::new("Service.java"))
        .unwrap()
        .extract(Path::new("Service.java"), source.as_bytes())
        .unwrap();
    let mut calls: Vec<&str> = extraction
        .edges
        .iter()
        .filter(|edge| edge.relation == RelationKind::Calls)
        .map(|edge| edge.target.as_str())
        .collect();
    calls.sort_unstable();
    assert_eq!(calls, ["Engine", "add"]);
}

#[test]
fn java_constructors_resolve_to_single_or_default_declarations() {
    let source = r#"class Service {
    int run() { Engine engine = new Engine(1); return engine.add() + new Helper().help(); }
}
class Engine {
    Engine(int x) {}
    int add() { return 1; }
}
class Helper {
    int help() { return 1; }
}
class Chain extends Base {
    Chain() { super(1); }
}
class Base {
    Base(int x) {}
}
"#;
    let extraction = pack_for_path(Path::new("Service.java"))
        .unwrap()
        .extract(Path::new("Service.java"), source.as_bytes())
        .unwrap();
    let mut calls: Vec<&str> = extraction
        .edges
        .iter()
        .filter(|edge| edge.relation == RelationKind::Calls)
        .map(|edge| edge.target.as_str())
        .collect();
    calls.sort_unstable();
    assert_eq!(calls, ["Base", "Engine", "Helper", "add"]);
    assert!(
        extraction
            .unresolved
            .iter()
            .any(|gap| gap.kind == UnresolvedKind::Dispatch && gap.text == "new Helper().help()"),
        "{:?}",
        extraction.unresolved
    );
}

#[test]
fn java_constructor_resolution_fails_closed() {
    for source in [
        // Overloaded constructors stay ambiguous.
        "class Service { int run() { return new Engine(1).add(); } } class Engine { Engine() {} Engine(int x) {} int add() { return 1; } }",
        // Generic arguments stay gaps.
        "class Service { int run() { return new Engine<String>().add(); } } class Engine { Engine() {} int add() { return 1; } }",
        // Anonymous class bodies stay gaps.
        "class Service { int run() { return new Engine() { }.add(); } } class Engine { int add() { return 1; } }",
        // Qualified allocation stays a gap.
        "class Service { int run(Outer o) { return o.new Inner().add(); } } class Outer { class Inner { int add() { return 1; } } }",
        // Imported types are not proven.
        "import app.Engine; class Service { int run() { return new Engine().add(); } }",
        // Abstract classes cannot be constructed.
        "class Service { int run() { return new Engine().add(); } } abstract class Engine { Engine() {} int add() { return 1; } }",
        // `this()` with two constructors stays ambiguous.
        "class Engine { Engine() {} Engine(int x) { this(); } int add() { return 1; } }",
        // `super()` with an external superclass stays a gap.
        "class Child extends Base { Child() { super(1); } }",
    ] {
        let extraction = pack_for_path(Path::new("Service.java"))
            .unwrap()
            .extract(Path::new("Service.java"), source.as_bytes())
            .unwrap();
        assert!(
            !extraction
                .edges
                .iter()
                .any(|edge| edge.relation == RelationKind::Calls),
            "{source}"
        );
        assert!(
            extraction
                .unresolved
                .iter()
                .any(|gap| gap.kind == UnresolvedKind::Dispatch),
            "{source}"
        );
    }
}

#[test]
fn java_receiver_resolution_fails_closed() {
    for source in [
        // Subclass in the same file can override the method.
        "class Engine { int add(){return 1;} int run(){ Engine e = new Engine(); return e.add(); } } class Turbo extends Engine {}",
        // Overloads keep the target ambiguous.
        "class Engine { int add(){return 1;} int add(int x){return x;} int run(){ Engine e = new Engine(); return e.add(); } }",
        // The method is defined in another class, not the declared type.
        "class Engine { int run(){ Other o = new Other(); return o.add(); } } class Other { } class Holder { int add(){return 1;} }",
        // Imported types are not proven.
        "import app.Engine; class Service { int run(Engine e){ return e.add(); } }",
        // Unbound receivers stay gaps.
        "class Engine { int add(){return 1;} int run(){ return helper().add(); } int helper(){ return 1; } }",
        // Chained receivers stay gaps.
        "class Engine { int add(){return 1;} int run(){ return this.helper().add(); } int helper(){ return 1; } }",
        // Interface targets stay gaps.
        "interface Engine { int add(); } class Service { int run(Engine e){ return e.add(); } }",
        // Static imports shadow the method name.
        "import static tools.Helpers.add; class Engine { int add(){return 1;} int run(){ Engine e = new Engine(); return e.add(); } }",
        // One name declared with two distinct types stays ambiguous.
        "class Engine { int add(){return 1;} int first(){ Engine e = new Engine(); return e.add(); } int second(Other e){ return 0; } } class Other { }",
    ] {
        let extraction = pack_for_path(Path::new("Service.java"))
            .unwrap()
            .extract(Path::new("Service.java"), source.as_bytes())
            .unwrap();
        assert!(
            !extraction
                .edges
                .iter()
                .any(|edge| edge.relation == RelationKind::Calls && edge.target == "add"),
            "{source}"
        );
        assert!(
            extraction
                .unresolved
                .iter()
                .any(|gap| gap.kind == UnresolvedKind::Dispatch),
            "{source}"
        );
    }
}

#[test]
fn java_imported_type_references_are_exact_and_local_types_shadow_them() {
    let source = b"import app.model.Model; final class Service { Model load(Model value) { return value; } }";
    let extraction = pack_for_path(Path::new("Service.java"))
        .unwrap()
        .extract(Path::new("Service.java"), source)
        .unwrap();
    let references = extraction
        .edges
        .iter()
        .filter(|edge| edge.relation == RelationKind::References)
        .collect::<Vec<_>>();
    assert_eq!(references.len(), 2);
    assert!(
        references
            .iter()
            .all(|edge| edge.target == "app.model.Model")
    );

    let shadowed =
        b"import app.model.Model; final class Model { Model load(Model value) { return value; } }";
    let extraction = pack_for_path(Path::new("Model.java"))
        .unwrap()
        .extract(Path::new("Model.java"), shadowed)
        .unwrap();
    assert!(
        !extraction
            .edges
            .iter()
            .any(|edge| edge.relation == RelationKind::References)
    );
}

#[test]
fn rust_symbols_and_direct_calls_support_self_dogfooding() {
    let source = br#"struct Runtime;
impl Runtime {
    fn refresh(&mut self) {
        rebuild_arcs();
    }
}
fn rebuild_arcs() {}
"#;
    let pack = pack_for_path(Path::new("crates/cgrx-cli/src/runtime.rs"))
        .expect("Rust source has a language pack");
    let extraction = pack
        .extract(Path::new("crates/cgrx-cli/src/runtime.rs"), source)
        .expect("Rust source extracts");

    let names: Vec<_> = extraction
        .symbols
        .iter()
        .map(|symbol| symbol.name.as_str())
        .collect();
    assert!(names.contains(&"Runtime"));
    assert!(names.contains(&"refresh"));
    assert!(names.contains(&"rebuild_arcs"));
    assert!(extraction.edges.iter().any(|edge| {
        edge.relation == RelationKind::Calls
            && edge.target == "rebuild_arcs"
            && &source[edge.span.start..edge.span.end] == b"rebuild_arcs()"
    }));
}

#[test]
fn rust_self_calls_remain_but_unproven_receivers_stay_dispatch() {
    let source = br#"trait Worker { fn run(&self); }
struct Runtime;
impl Runtime {
    fn build() -> Self { Self }
    fn refresh(&self) {}
    fn execute(&self) {
        self.refresh();
        Runtime::build();
    }
}
fn run_generic<T: Worker>(worker: &T) { worker.run(); }
fn run_dynamic(worker: &dyn Worker) { worker.run(); }
fn run_local(worker: &dyn Worker) {
    let alias: &dyn Worker = worker;
    alias.run();
}
struct Holder<'a> { worker: &'a dyn Worker }
impl Holder<'_> { fn run(&self) { self.worker.run(); } }
fn pipelines() {
    let _: Vec<_> = (0..3).map(|value| value + 1).collect::<Vec<_>>();
    let _: usize = "1".parse::<usize>().unwrap();
}
"#;
    let path = Path::new("src/runtime.rs");
    let extraction = pack_for_path(path)
        .expect("Rust language pack registered")
        .extract(path, source)
        .expect("Rust source extracts");

    let calls: Vec<_> = extraction
        .edges
        .iter()
        .filter(|edge| edge.relation == RelationKind::Calls)
        .map(|edge| &source[edge.span.start..edge.span.end])
        .collect();
    assert!(
        calls.contains(&b"self.refresh()".as_slice()),
        "calls: {calls:?}"
    );
    assert!(
        calls.contains(&b"Runtime::build()".as_slice()),
        "calls: {calls:?}"
    );
    assert!(
        !calls.contains(&b"worker.run()".as_slice()),
        "calls: {calls:?}"
    );
    assert!(
        !calls.contains(&b"(0..3).map(|value| value + 1).collect::<Vec<_>>()".as_slice()),
        "calls: {calls:?}"
    );
    assert!(
        !calls.contains(&b"\"1\".parse::<usize>()".as_slice()),
        "calls: {calls:?}"
    );

    let dispatches: Vec<_> = extraction
        .unresolved
        .iter()
        .filter(|candidate| candidate.kind == UnresolvedKind::Dispatch)
        .map(|candidate| &source[candidate.span.start..candidate.span.end])
        .collect();
    assert_eq!(
        dispatches,
        vec![
            b"worker.run()".as_slice(),
            b"worker.run()".as_slice(),
            b"alias.run()".as_slice(),
            b"self.worker.run()".as_slice(),
            b"(0..3).map(|value| value + 1)".as_slice(),
            b"(0..3).map(|value| value + 1).collect::<Vec<_>>()".as_slice(),
            b"\"1\".parse::<usize>()".as_slice(),
            b"\"1\".parse::<usize>().unwrap()".as_slice(),
        ]
    );
}

#[test]
fn go_symbols_imports_calls_and_dispatch_are_fail_closed() {
    let source = br#"package service

import "context"

type Server struct{}

func NewServer() *Server { return &Server{} }

func (server *Server) Run(ctx context.Context) {
    helper()
    server.handle(ctx)
}

func helper() {}
"#;
    let path = Path::new("backend/internal/service/server.go");
    let pack = pack_for_path(path).expect("Go source has a language pack");
    let extraction = pack.extract(path, source).expect("Go source extracts");

    let names: Vec<_> = extraction
        .symbols
        .iter()
        .map(|symbol| symbol.name.as_str())
        .collect();
    assert_eq!(names, ["NewServer", "Run", "Server", "helper"]);
    assert!(extraction.edges.iter().any(|edge| {
        edge.relation == RelationKind::Imports
            && &source[edge.span.start..edge.span.end] == b"import \"context\""
    }));
    assert!(extraction.edges.iter().any(|edge| {
        edge.relation == RelationKind::Calls
            && edge.target == "helper"
            && &source[edge.span.start..edge.span.end] == b"helper()"
    }));
    assert!(
        !extraction
            .edges
            .iter()
            .any(|edge| edge.relation == RelationKind::Calls && edge.target.contains("handle"))
    );
    assert!(extraction.unresolved.iter().any(|candidate| {
        candidate.kind == UnresolvedKind::Dispatch && candidate.text == "server.handle(ctx)"
    }));
    assert!(extraction.parser_error_ranges.is_empty());
}

#[test]
fn go_import_qualified_calls_are_static_but_receiver_calls_remain_dispatch() {
    let source = br#"package service

import (
    "fmt"
    logx "example.com/acme/log"
)

func run(server *Server) {
    fmt.Errorf("boom")
    logx.Info("hello")
    server.handle()
}
"#;
    let path = Path::new("backend/internal/service/server.go");
    let extraction = pack_for_path(path)
        .expect("Go language pack registered")
        .extract(path, source)
        .expect("Go source extracts");
    let dispatches: Vec<_> = extraction
        .unresolved
        .iter()
        .filter(|candidate| candidate.kind == UnresolvedKind::Dispatch)
        .map(|candidate| candidate.text.as_str())
        .collect();

    let calls: Vec<_> = extraction
        .edges
        .iter()
        .filter(|edge| edge.relation == RelationKind::Calls)
        .map(|edge| edge.target.as_str())
        .collect();

    assert_eq!(calls, ["fmt.Errorf", "logx.Info"]);
    assert_eq!(dispatches, ["server.handle()"]);
}

#[test]
fn go_frozen_fixture_has_exact_spans_and_hash() {
    let (path, source) = fixture("go-direct-call/repo/backend/service.go");
    let extraction = pack_for_path(&path)
        .expect("Go language pack registered")
        .extract(&path, &source)
        .expect("Go fixture parses");

    let run = extraction
        .symbols
        .iter()
        .find(|symbol| symbol.name == "Run")
        .expect("Run symbol");
    assert_eq!(&source[run.span.start..run.span.end], b"Run");
    assert_eq!(
        &source[run.search_span.start..run.search_span.end],
        b"func Run(ctx context.Context) {\n\thelp()\n}"
    );
    let call = extraction
        .edges
        .iter()
        .find(|edge| edge.relation == RelationKind::Calls && edge.target == "help")
        .expect("help call");
    assert_eq!(&source[call.span.start..call.span.end], b"help()");
    assert_eq!(
        extraction
            .stable_hash()
            .iter()
            .map(|byte| format!("{byte:02x}"))
            .collect::<String>(),
        "a9624b3517fb92d958c0003b473eae693af6dd9177cbbe7f9dd53cea75e3076e"
    );
}

#[test]
fn go_parser_errors_are_explicit_coverage_gaps() {
    let (path, source) = fixture("go-parser-error-range/repo/backend/broken.go");
    let extraction = pack_for_path(&path)
        .expect("Go language pack registered")
        .extract(&path, &source)
        .expect("partial Go extraction succeeds");

    assert!(!extraction.parser_error_ranges.is_empty());
    assert!(
        extraction
            .unresolved
            .iter()
            .any(|candidate| candidate.kind == UnresolvedKind::ParserError)
    );
}

#[test]
fn python_error_node_becomes_coverage_gap_not_silent_success() {
    let (path, source) = fixture("py-parser-error-range/repo/src/main.py");
    let pack = pack_for_path(&path).expect("Python language pack registered");
    let extraction = pack
        .extract(&path, &source)
        .expect("partial extraction succeeds");

    assert!(!extraction.parser_error_ranges.is_empty());
    assert!(
        extraction
            .unresolved
            .iter()
            .any(|candidate| candidate.kind == UnresolvedKind::ParserError)
    );
}

#[test]
fn dynamic_and_dispatch_candidates_are_never_upgraded_to_calls() {
    for relative in [
        "ts-dynamic-property/repo/src/main.ts",
        "ts-interface-dispatch/repo/src/main.ts",
        "py-getattr-call/repo/src/main.py",
        "py-protocol-dispatch/repo/src/main.py",
    ] {
        let (path, source) = fixture(relative);
        let extraction = pack_for_path(&path)
            .expect("language pack registered")
            .extract(&path, &source)
            .expect("fixture extraction succeeds");
        assert!(!extraction.unresolved.is_empty(), "{relative}");
        // Dynamic property and receiver-dispatch candidates stay unresolved
        // (asserted above) and never gain exact-call provenance. Same-file
        // class constructions (`new X()` with exactly one plain class) are
        // exact proven edges, not dispatch upgrades, so TsConstructor is the
        // only allowed non-Syntax provenance here.
        assert!(
            extraction.edges.iter().all(|edge| {
                edge.provenance == Provenance::Syntax
                    || matches!(edge.provenance, Provenance::TsConstructor { .. })
            }),
            "{relative}"
        );
    }
}

#[test]
fn both_parser_error_fixtures_emit_explicit_gaps() {
    for relative in [
        "ts-parser-error-range/repo/src/main.ts",
        "py-parser-error-range/repo/src/main.py",
    ] {
        let (path, source) = fixture(relative);
        let extraction = pack_for_path(&path)
            .expect("language pack registered")
            .extract(&path, &source)
            .expect("partial extraction succeeds");
        assert!(!extraction.parser_error_ranges.is_empty(), "{relative}");
        assert!(extraction.edges.iter().all(|edge| {
            extraction
                .parser_error_ranges
                .iter()
                .all(|gap| edge.span.end <= gap.start || edge.span.start >= gap.end)
        }));
    }
}

#[test]
fn decorators_are_unresolved_and_never_emitted_as_calls() {
    for relative in [
        "ts-decorator-route/repo/src/main.ts",
        "py-decorator-route/repo/src/main.py",
    ] {
        let (path, source) = fixture(relative);
        let extraction = pack_for_path(&path)
            .unwrap()
            .extract(&path, &source)
            .unwrap();
        assert!(
            extraction
                .unresolved
                .iter()
                .any(|candidate| candidate.kind == UnresolvedKind::Decorator)
        );
        assert!(
            extraction
                .edges
                .iter()
                .all(|edge| edge.relation != RelationKind::Calls)
        );
    }
}

#[test]
fn checked_in_tree_sitter_queries_compile() {
    let typescript = tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into();
    let java = tree_sitter_java::LANGUAGE.into();
    let python = tree_sitter_python::LANGUAGE.into();
    let rust = tree_sitter_rust::LANGUAGE.into();
    let go = tree_sitter_go::LANGUAGE.into();
    for source in [
        include_str!("../queries/typescript/symbols.scm"),
        include_str!("../queries/typescript/calls.scm"),
        include_str!("../queries/typescript/imports.scm"),
    ] {
        Query::new(&typescript, source).expect("valid TypeScript query");
        for source in [
            include_str!("../queries/java/symbols.scm"),
            include_str!("../queries/java/calls.scm"),
            include_str!("../queries/java/imports.scm"),
        ] {
            Query::new(&java, source).expect("valid Java query");
        }
    }
    for source in [
        include_str!("../queries/python/symbols.scm"),
        include_str!("../queries/python/calls.scm"),
        include_str!("../queries/python/imports.scm"),
    ] {
        Query::new(&python, source).expect("valid Python query");
    }
    for source in [
        include_str!("../queries/rust/symbols.scm"),
        include_str!("../queries/rust/calls.scm"),
        include_str!("../queries/rust/imports.scm"),
    ] {
        Query::new(&rust, source).expect("valid Rust query");
    }
    for source in [
        include_str!("../queries/go/symbols.scm"),
        include_str!("../queries/go/calls.scm"),
        include_str!("../queries/go/imports.scm"),
    ] {
        Query::new(&go, source).expect("valid Go query");
    }
}

#[test]
fn rust_callable_shadowing_is_unresolved_with_static_positive_control() {
    for source in [
        "fn target() {} fn caller(target: fn()) { target(); }",
        "fn target() {} fn caller() { let target = || {}; target(); }",
        "fn target() {} fn caller() { let (target, _) = (|| {}, 1); target(); }",
        "fn target() {} fn caller() { let f = |target: fn()| { target(); }; }",
    ] {
        let path = Path::new("main.rs");
        let extracted = pack_for_path(path)
            .unwrap()
            .extract(path, source.as_bytes())
            .unwrap();
        assert!(
            !extracted
                .edges
                .iter()
                .any(|edge| edge.relation == RelationKind::Calls && edge.target == "target"),
            "{source}"
        );
        assert!(
            extracted
                .unresolved
                .iter()
                .any(|item| item.kind == UnresolvedKind::Dispatch),
            "{source}"
        );
    }
    let path = Path::new("main.rs");
    let extracted = pack_for_path(path)
        .unwrap()
        .extract(path, b"fn target() {} fn caller() { target(); }")
        .unwrap();
    assert_eq!(
        extracted
            .edges
            .iter()
            .filter(|edge| edge.relation == RelationKind::Calls && edge.target == "target")
            .count(),
        1
    );
    assert!(extracted.unresolved.is_empty());
}

// Each case has exactly one target call. Keep precision and recall independently visible.
macro_rules! rust_lexical_case {
    ($name:ident, $source:expr, $static_call:expr) => {
        #[test]
        fn $name() {
            let source = concat!("fn target() {} ", $source);
            let path = Path::new("main.rs");
            let extracted = pack_for_path(path)
                .unwrap()
                .extract(path, source.as_bytes())
                .unwrap();
            assert!(extracted.parser_error_ranges.is_empty(), "{source}");
            let calls = extracted
                .edges
                .iter()
                .filter(|edge| edge.relation == RelationKind::Calls)
                .collect::<Vec<_>>();
            let dispatch = extracted
                .unresolved
                .iter()
                .filter(|item| item.kind == UnresolvedKind::Dispatch)
                .collect::<Vec<_>>();
            assert_eq!(calls.len(), usize::from($static_call), "CALLS: {source}");
            assert_eq!(
                dispatch.len(),
                usize::from(!$static_call),
                "Dispatch: {source}"
            );
            if $static_call {
                assert_eq!(calls[0].target, "target");
                assert_eq!(&source[calls[0].span.start..calls[0].span.end], "target()");
            }
        }
    };
}

rust_lexical_case!(
    rust_lexical_for_active,
    "fn caller() { for target in [target as fn()] { target(); } }",
    false
);
rust_lexical_case!(
    rust_lexical_for_value,
    "fn caller() { for target in target() {} }",
    true
);
rust_lexical_case!(
    rust_lexical_for_expired,
    "fn caller() { for target in [] {} target(); }",
    true
);
rust_lexical_case!(
    rust_lexical_match_active,
    "fn caller(value: Option<fn()>) { match value { Some(target) => target(), _ => {} } }",
    false
);
rust_lexical_case!(
    rust_lexical_match_guard,
    "fn caller() { match None { Some(target) if { target(); true } => {}, _ => {} } }",
    false
);
rust_lexical_case!(
    rust_lexical_match_sibling,
    "fn caller() { match None { Some(target) => {}, _ => target() } }",
    true
);
rust_lexical_case!(
    rust_lexical_match_value,
    "fn caller() { match target() { Some(target) => {}, _ => {} } }",
    true
);
rust_lexical_case!(
    rust_lexical_if_active,
    "fn caller() { if let Some(target) = None { target(); } }",
    false
);
rust_lexical_case!(
    rust_lexical_if_value,
    "fn caller() { if let Some(target) = target() {} }",
    true
);
rust_lexical_case!(
    rust_lexical_if_else,
    "fn caller() { if let Some(target) = None {} else { target(); } }",
    true
);
rust_lexical_case!(
    rust_lexical_if_expired,
    "fn caller() { if let Some(target) = None {} target(); }",
    true
);
rust_lexical_case!(
    rust_lexical_chain_active,
    "fn caller() { if let Some(target) = None && { target(); true } {} }",
    false
);
rust_lexical_case!(
    rust_lexical_chain_later_value,
    "fn caller() { if let Some(target) = None && let Some(x) = target() {} }",
    false
);
rust_lexical_case!(
    rust_lexical_chain_earlier,
    "fn caller() { if { target(); true } && let Some(target) = None {} }",
    true
);
rust_lexical_case!(
    rust_lexical_while_active,
    "fn caller() { while let Some(target) = None { target(); } }",
    false
);
rust_lexical_case!(
    rust_lexical_while_value,
    "fn caller() { while let Some(target) = target() {} }",
    true
);
rust_lexical_case!(
    rust_lexical_while_expired,
    "fn caller() { while let Some(target) = None {} target(); }",
    true
);
rust_lexical_case!(
    rust_lexical_let_active,
    "fn caller() { let target = || {}; target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_let_initializer,
    "fn caller() { let target = target(); }",
    true
);
rust_lexical_case!(
    rust_lexical_let_else_active,
    "fn caller() { let Some(target) = None else { return }; target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_let_else_value,
    "fn caller() { let Some(target) = target() else { return }; }",
    true
);
rust_lexical_case!(
    rust_lexical_let_else_alternative,
    "fn caller() { let Some(target) = None else { target(); return }; }",
    true
);
rust_lexical_case!(
    rust_lexical_expired_block,
    "fn caller() { { let target = || {}; } target(); }",
    true
);
rust_lexical_case!(
    rust_lexical_sibling_block,
    "fn caller() { { let target = || {}; } { target(); } }",
    true
);
rust_lexical_case!(
    rust_lexical_sibling_closure,
    "fn caller() { let f = |target: fn()| {}; target(); }",
    true
);
rust_lexical_case!(
    rust_lexical_closure_capture,
    "fn caller(target: fn()) { let f = || target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_closure_parameter,
    "fn caller() { let f = |target| target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_closure_destructure,
    "fn caller() { let f = |(target, _)| target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_closure_initializer,
    "fn caller() { let target = || target(); }",
    true
);
rust_lexical_case!(
    rust_lexical_parameter_destructure,
    "fn caller((target, _): (fn(), i32)) { target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_field_not_binding,
    "fn caller() { let S { target: other } = s; target(); }",
    true
);
rust_lexical_case!(
    rust_lexical_field_binding,
    "fn caller() { let S { other: target } = s; target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_field_shorthand,
    "fn caller() { let S { target } = s; target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_constructor_not_binding,
    "fn caller() { let target(other) = s; target(); }",
    true
);
rust_lexical_case!(
    rust_lexical_raw_binding,
    "fn caller(r#target: fn()) { target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_raw_call,
    "fn caller(target: fn()) { r#target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_raw_field,
    "fn caller() { let S { r#target } = s; target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_slice_binding,
    "fn caller() { let [target, ..] = s; target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_reference_binding,
    "fn caller() { let &mut target = s; target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_captured_pattern,
    "fn caller() { match s { target @ Some(_) => target(), _ => {} } }",
    false
);
rust_lexical_case!(
    rust_lexical_or_pattern,
    "fn caller() { match s { Some(target) | Other(target) => target(), _ => {} } }",
    false
);
rust_lexical_case!(
    rust_lexical_nested_function,
    "fn caller(target: fn()) { fn inner() { target(); } }",
    true
);
rust_lexical_case!(
    rust_lexical_nested_active,
    "fn caller() { let target = || {}; { target(); } }",
    false
);
rust_lexical_case!(
    rust_lexical_plain_positive,
    "fn caller() { target(); }",
    true
);
rust_lexical_case!(
    rust_lexical_guard_let_value,
    "fn caller() { match s { _ if let Some(target) = target() => {}, _ => {} } }",
    true
);
rust_lexical_case!(
    rust_lexical_guard_let_active,
    "fn caller() { match s { _ if let Some(target) = s => target(), _ => {} } }",
    false
);
rust_lexical_case!(
    rust_lexical_guard_block_expired,
    "fn caller() { match s { _ if { let target = || {}; true } => target(), _ => {} } }",
    true
);
rust_lexical_case!(
    rust_lexical_rebinding_initializer,
    "fn caller(target: fn()) { let target = target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_outer_else_binding,
    "fn caller(target: fn()) { if let Some(target) = s {} else { target(); } }",
    false
);
rust_lexical_case!(
    rust_lexical_while_chain,
    "fn caller() { while let Some(target) = s && { target(); true } {} }",
    false
);
rust_lexical_case!(
    rust_lexical_for_destructure,
    "fn caller() { for (target, _) in s { target(); } }",
    false
);
rust_lexical_case!(
    rust_lexical_closure_typed_destructure,
    "fn caller() { let f = |(target, _): (fn(), i32)| target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_ref_binding,
    "fn caller() { let ref target = s; target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_ref_mut_binding,
    "fn caller() { let ref mut target = s; target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_generic_constructor_ref,
    "fn caller() { match s { Some::<T>(ref target) => target(), _ => {} } }",
    false
);
rust_lexical_case!(
    rust_lexical_macro_pattern_uncertain,
    "fn caller() { let bind!() = s; target(); }",
    false
);
rust_lexical_case!(
    rust_lexical_macro_pattern_expired,
    "fn caller() { { let bind!() = s; } target(); }",
    true
);

// These scenarios fail if self selectors are guessed by name, or if
// unsupported selectors lose their explicit dispatch gap.
#[test]
fn go_self_receiver_positive_scenarios() {
    for (label, receiver, body, target) in [
        (
            "pointer",
            "s *Service",
            "s.Target()",
            "func (s *Service) Target() {}",
        ),
        (
            "value",
            "s Service",
            "s.Target()",
            "func (s Service) Target() {}",
        ),
        (
            "pointer_to_value",
            "s *Service",
            "s.Target()",
            "func (s Service) Target() {}",
        ),
        (
            "value_to_pointer",
            "s Service",
            "s.Target()",
            "func (s *Service) Target() {}",
        ),
        (
            "defer",
            "s *Service",
            "defer s.Target()",
            "func (s *Service) Target() {}",
        ),
        (
            "go",
            "s *Service",
            "go s.Target()",
            "func (s *Service) Target() {}",
        ),
        (
            "other_type",
            "s *Service",
            "s.Target()",
            "func (s *Other) Target() {}\nfunc (s *Service) Target() {}",
        ),
        (
            "type_defined_elsewhere",
            "s *External",
            "s.Target()",
            "func (s *External) Target() {}",
        ),
    ] {
        let source = format!(
            "package auth\ntype Service struct{{}}\ntype Other struct{{}}\nfunc ({receiver}) Login() {{ {body} }}\n{target}\n"
        );
        let path = Path::new("auth/service.go");
        let extracted = pack_for_path(path)
            .unwrap()
            .extract(path, source.as_bytes())
            .unwrap();
        assert!(extracted.parser_error_ranges.is_empty(), "{label}");
        assert!(
            extracted
                .edges
                .iter()
                .any(|e| e.relation == RelationKind::Calls
                    && &source[e.span.start..e.span.end] == "s.Target()"),
            "missing proven self call: {label}"
        );
        assert!(
            !extracted.unresolved.iter().any(|u| u.text == "s.Target()"),
            "unexpected gap: {label}"
        );
    }
}

#[test]
fn go_self_receiver_negative_scenarios_retain_gaps() {
    for (label, declarations, caller, call) in [
        (
            "other_receiver_only",
            "func (s *Other) Target() {}",
            "func (s *Service) Login() { s.Target() }",
            "s.Target()",
        ),
        (
            "unknown",
            "func (s *Service) Target() {}",
            "func Login(s *Service) { s.Target() }",
            "s.Target()",
        ),
        (
            "field_function",
            "",
            "func (s *Service) Login() { s.cb() }",
            "s.cb()",
        ),
        (
            "nested_field",
            "func (s *Service) Target() {}",
            "func (s *Service) Login() { s.store.Target() }",
            "s.store.Target()",
        ),
        (
            "short_shadow",
            "func (s *Service) Target() {}",
            "func (s *Service) Login() { { s := other; s.Target() } }",
            "s.Target()",
        ),
        (
            "var_shadow",
            "func (s *Service) Target() {}",
            "func (s *Service) Login() { { var s Other; s.Target() } }",
            "s.Target()",
        ),
        (
            "range_shadow",
            "func (s *Service) Target() {}",
            "func (s *Service) Login() { for _, s := range others { s.Target() } }",
            "s.Target()",
        ),
        (
            "switch_shadow",
            "func (s *Service) Target() {}",
            "func (s *Service) Login() { switch s := x.(type) { case Other: s.Target() } }",
            "s.Target()",
        ),
        (
            "closure_shadow",
            "func (s *Service) Target() {}",
            "func (s *Service) Login() { f := func(s *Other) { s.Target() }; _ = f }",
            "s.Target()",
        ),
        (
            "closure_capture",
            "func (s *Service) Target() {}",
            "func (s *Service) Login() { f := func() { s.Target() }; _ = f }",
            "s.Target()",
        ),
        (
            "interface",
            "type Face interface { Target() }; func (s Face) Target() {}",
            "func (s Face) Login() { s.Target() }",
            "s.Target()",
        ),
        (
            "foreign_type",
            "func (s *app.Service) Target() {}",
            "func (s *Service) Login() { s.Target() }",
            "s.Target()",
        ),
        (
            "duplicate",
            "func (s *Service) Target() {}; func (s Service) Target() {}",
            "func (s *Service) Login() { s.Target() }",
            "s.Target()",
        ),
        (
            "conversion",
            "func (s *Service) Target() {}",
            "func (s *Service) Login() { Other(s).Target() }",
            "Other(s).Target()",
        ),
        (
            "composite",
            "func (s *Service) Target() {}",
            "func (s *Service) Login() { (Other{}).Target() }",
            "(Other{}).Target()",
        ),
        (
            "alias",
            "type Alias = Service; func (s *Alias) Target() {}",
            "func (s *Alias) Login() { s.Target() }",
            "s.Target()",
        ),
    ] {
        let source = format!(
            "package auth\ntype Service struct{{ cb func(); store *Other }}\ntype Other struct{{}}\n{declarations}\n{caller}\n"
        );
        let path = Path::new("auth/service.go");
        let extracted = pack_for_path(path)
            .unwrap()
            .extract(path, source.as_bytes())
            .unwrap();
        assert!(
            extracted.parser_error_ranges.is_empty(),
            "{label}: {:?}",
            extracted.parser_error_ranges
        );
        assert!(
            !extracted
                .edges
                .iter()
                .any(|e| e.relation == RelationKind::Calls
                    && &source[e.span.start..e.span.end] == call),
            "false proven call: {label}"
        );
        assert!(
            extracted
                .unresolved
                .iter()
                .any(|u| u.kind == UnresolvedKind::Dispatch && u.text == call),
            "missing gap: {label}"
        );
    }
}

#[test]
fn go_self_receiver_field_and_index_writes_do_not_rebind_receiver() {
    for body in ["s.Field = x; s.Target()", "s.Map[key] = value; s.Target()"] {
        let source = format!(
            "package auth\ntype Service struct{{ Field int; Map map[string]int }}\nfunc (s *Service) Login() {{ {body} }}\nfunc (s *Service) Target() {{}}\n"
        );
        let path = Path::new("auth/service.go");
        let extracted = pack_for_path(path)
            .unwrap()
            .extract(path, source.as_bytes())
            .unwrap();
        assert!(
            extracted
                .edges
                .iter()
                .any(|edge| edge.relation == RelationKind::Calls
                    && &source[edge.span.start..edge.span.end] == "s.Target()"),
            "field mutation is not receiver rebinding: {body}"
        );
        assert!(!extracted.unresolved.iter().any(|u| u.text == "s.Target()"));
    }
}

#[test]
fn typescript_const_arrow_lexical_symbol_and_non_syntax_proof() {
    for extension in ["ts", "tsx"] {
        let source =
            b"function caller() { const tail = (value: string) => value; return tail('x'); }";
        let path = PathBuf::from(format!("main.{extension}"));
        let extraction = pack_for_path(&path)
            .unwrap()
            .extract(&path, source)
            .unwrap();
        let symbol = extraction
            .symbols
            .iter()
            .find(|s| s.name == "tail")
            .expect("named const arrow symbol");
        assert_eq!(&source[symbol.span.start..symbol.span.end], b"tail");
        assert_eq!(
            &source[symbol.search_span.start..symbol.search_span.end],
            b"tail = (value: string) => value"
        );
        let edge = extraction
            .edges
            .iter()
            .find(|e| e.target == "tail")
            .unwrap();
        let Provenance::TsLexical { target, caller } = edge.provenance else {
            panic!("lexical target requires distinct exact proof");
        };
        assert_eq!(target, symbol.span);
        assert_eq!(&source[caller.start..caller.end], b"caller");
        assert_eq!(extraction.lexical_arrows, vec![symbol.span]);
    }
}

#[test]
fn typescript_named_arrow_capture_has_exact_lexical_proof() {
    let source = b"function caller() { const tail = () => 0; const nested = () => tail(); }";
    let path = Path::new("main.tsx");
    let extraction = pack_for_path(path).unwrap().extract(path, source).unwrap();
    let edge = extraction
        .edges
        .iter()
        .find(|edge| edge.target == "tail")
        .expect("stable outer const arrow is exact");
    let Provenance::TsLexical { target, caller } = edge.provenance else {
        panic!("captured arrow requires lexical proof");
    };
    assert_eq!(&source[target.start..target.end], b"tail");
    assert_eq!(&source[caller.start..caller.end], b"nested");
    assert!(!extraction.unresolved.iter().any(|gap| gap.text == "tail()"));
}

#[test]
fn typescript_unsupported_lexical_bindings_keep_dispatch_gaps() {
    let sources = [
        "function caller() { tail(); const tail = () => 0; }",
        "function caller() { const tail = () => 0; { tail(); const tail = () => 1; } }",
        "function caller() { const tail = () => 0; { const {value: tail} = obj; tail(); } }",
        "function caller() { const tail = () => 0; try {} catch({tail}) { tail(); } }",
        "function caller() { const tail = () => 0; for(const {tail} of values) { tail(); } }",
        "function caller() { let tail = () => 0; tail = other; tail(); }",
        "function caller() { var tail = () => 0; tail = other; tail(); }",
        "const tail = () => 0; function caller(tail: unknown) { tail(); }",
        "const tail = () => 0; function caller(value = tail()) {}",
        "function caller() { const tail = () => 0; const nested = function tail() { tail(); }; }",
        "function caller() { const tail = () => 0; const nested = (tail) => tail(); }",
    ];
    let path = Path::new("main.ts");
    for source in sources {
        let extraction = pack_for_path(path)
            .unwrap()
            .extract(path, source.as_bytes())
            .unwrap();
        assert!(
            !extraction
                .edges
                .iter()
                .any(|e| e.relation == RelationKind::Calls && e.target == "tail"),
            "{source}"
        );
        assert!(
            extraction
                .unresolved
                .iter()
                .any(|gap| gap.kind == UnresolvedKind::Dispatch && gap.text == "tail()"),
            "{source}"
        );
    }
}

#[test]
fn typescript_only_const_arrows_are_new_symbols_and_legacy_function_provenance_survives() {
    let source = b"function caller() { let mutable = () => 0; var reassigned = () => 1; const expression = function named() {}; const tail = () => 0; helper(); tail(); } function helper() {}";
    let path = Path::new("main.ts");
    let extraction = pack_for_path(path).unwrap().extract(path, source).unwrap();
    assert_eq!(
        extraction
            .symbols
            .iter()
            .map(|s| s.name.as_str())
            .collect::<Vec<_>>(),
        ["caller", "helper", "tail"]
    );
    assert_eq!(
        extraction
            .edges
            .iter()
            .find(|e| e.target == "helper")
            .unwrap()
            .provenance,
        Provenance::Syntax
    );
}

#[test]
fn typescript_class_initializers_keep_explicit_dispatch_gaps() {
    for class in [
        "class { value = tail(); }",
        "class tail { value = tail(); }",
        "class { static value = tail(); }",
        "class tail { static value = tail(); }",
        "class { static { tail(); } }",
        "class tail extends tail() {}",
    ] {
        for expression in [true, false] {
            let body = if expression {
                format!("return {class};")
            } else {
                format!("{}; return Box;", class.replacen("class ", "class Box ", 1))
            };
            // Named-class expression is independently tested; do not generate two names.
            if !expression && class.starts_with("class tail") {
                continue;
            }
            let source = format!("function caller() {{ const tail = () => 1; {body} }}");
            let path = Path::new("main.ts");
            let extraction = pack_for_path(path)
                .unwrap()
                .extract(path, source.as_bytes())
                .unwrap();
            assert!(extraction.parser_error_ranges.is_empty(), "{source}");
            assert!(
                !extraction.edges.iter().any(|edge| edge.target == "tail"),
                "{source}"
            );
            assert!(
                extraction
                    .unresolved
                    .iter()
                    .any(|gap| gap.kind == UnresolvedKind::Dispatch && gap.text == "tail()"),
                "{source}"
            );
        }
    }
}

#[test]
fn go_concrete_field_named_slice_requires_distinct_provenance() {
    let source=b"package queue\ntype TaskQueue struct { items PriorityQueue }\ntype PriorityQueue []*QueueItem\nfunc (p PriorityQueue) Len() int { return 0 }\nfunc (q *TaskQueue) Peek() int { return q.items.Len() }";
    let path = Path::new("queue/queue.go");
    let extraction = pack_for_path(path).unwrap().extract(path, source).unwrap();
    let edge = extraction
        .edges
        .iter()
        .find(|e| e.target == "q.items.Len")
        .expect("concrete field target edge");
    let Provenance::GoFieldReceiver {
        package,
        caller,
        receiver_type,
        field,
        field_type,
        target,
    } = edge.provenance
    else {
        panic!("distinct field provenance required");
    };
    for (span, expected) in [
        (package, "queue"),
        (caller, "Peek"),
        (receiver_type, "TaskQueue"),
        (field, "items"),
        (field_type, "PriorityQueue"),
        (target, "Len"),
    ] {
        assert_eq!(&source[span.start..span.end], expected.as_bytes());
    }
    assert!(
        !extraction
            .unresolved
            .iter()
            .any(|u| u.text == "q.items.Len()")
    );
}

#[test]
fn go_single_assignment_constructor_receiver_has_explicit_provenance() {
    let source = b"package graph\nfunc TestAddNode() { engine := NewEngine(); engine.AddNode() }";
    let extraction = pack_for_path(Path::new("engine_test.go"))
        .unwrap()
        .extract(Path::new("engine_test.go"), source)
        .unwrap();
    let edge = extraction
        .edges
        .iter()
        .find(|edge| edge.target == "engine.AddNode")
        .expect("constructor-bound receiver call");
    let Provenance::GoLocalConstructor {
        package,
        caller,
        binding,
        constructor,
        target,
    } = edge.provenance
    else {
        panic!("wrong provenance: {:?}", edge.provenance);
    };
    for (span, expected) in [
        (package, "graph"),
        (caller, "TestAddNode"),
        (binding, "engine"),
        (constructor, "NewEngine"),
        (target, "AddNode"),
    ] {
        assert_eq!(&source[span.start..span.end], expected.as_bytes());
    }
}

#[test]
fn go_reassigned_or_ambiguous_constructor_bindings_remain_gaps() {
    for source in [
        "package graph\nfunc Caller() { engine := NewEngine(); engine = other; engine.AddNode() }",
        "package graph\nfunc Caller(engine *Engine) { engine := NewEngine(); engine.AddNode() }",
        "package graph\nfunc Caller() { engine, err := NewEngine(); _ = err; engine.AddNode() }",
    ] {
        let extraction = pack_for_path(Path::new("main.go"))
            .unwrap()
            .extract(Path::new("main.go"), source.as_bytes())
            .unwrap();
        assert!(
            !extraction
                .edges
                .iter()
                .any(|edge| edge.target == "engine.AddNode"),
            "{source}"
        );
        assert!(
            extraction
                .unresolved
                .iter()
                .any(|gap| gap.text == "engine.AddNode()"),
            "{source}"
        );
    }
}

#[test]
fn go_concrete_field_unsupported_shapes_retain_dispatch_gaps() {
    let source = "package queue\ntype TaskQueue struct { items PriorityQueue }\ntype PriorityQueue []int\nfunc (p PriorityQueue) Len() int { return 0 }\nfunc (q *TaskQueue) Peek() int { return q.items.Len() }";
    for unsupported in [
        source.replace("items PriorityQueue", "items interface { Len() int }"),
        source.replace("type PriorityQueue []int", "type PriorityQueue = []int"),
        source.replace(
            "type PriorityQueue []int",
            "type PriorityQueue interface { Len() int }",
        ),
        source.replace("items PriorityQueue", "items other.PriorityQueue"),
        source.replace(
            "items PriorityQueue",
            "items PriorityQueue; items PriorityQueue",
        ),
        source.replace("return q.items.Len()", "q = other; return q.items.Len()"),
        source.replace(
            "return q.items.Len()",
            "f := func() int { return q.items.Len() }; _ = f; return 0",
        ),
        source.replace(
            "type PriorityQueue []int",
            "type PriorityQueue struct { Len func() int }",
        ),
    ] {
        let path = Path::new("queue.go");
        let extraction = pack_for_path(path)
            .unwrap()
            .extract(path, unsupported.as_bytes())
            .unwrap();
        assert!(
            !extraction.edges.iter().any(|e| e.target == "q.items.Len"),
            "{unsupported}"
        );
        assert!(
            extraction
                .unresolved
                .iter()
                .any(|u| u.kind == UnresolvedKind::Dispatch && u.text == "q.items.Len()"),
            "{unsupported}"
        );
    }
}
