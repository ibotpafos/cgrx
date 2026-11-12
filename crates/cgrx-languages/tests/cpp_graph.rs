use cgrx_languages::{
    Extraction, Provenance, RelationKind, Span, UnresolvedKind, pack_for_path, pack_for_source,
};
use std::path::Path;

const HEADER: &[u8] = include_bytes!("fixtures/cpp/juce_style.h");
const SOURCE: &[u8] = include_bytes!("fixtures/cpp/graph.cpp");

fn extract(path: &str, source: &[u8]) -> Extraction {
    let path = Path::new(path);
    let pack = pack_for_source(path, source).expect("public source registry selects a pack");
    assert_eq!(pack.id(), "cpp", "{}", path.display());
    let extraction = pack.extract(path, source).expect("C++ extraction succeeds");
    assert!(
        extraction.parser_error_ranges.is_empty(),
        "{}: {:?}",
        path.display(),
        extraction.parser_error_ranges
    );
    extraction
}

fn slice(source: &[u8], span: Span) -> &str {
    std::str::from_utf8(&source[span.start..span.end]).unwrap()
}

fn calls(extraction: &Extraction) -> Vec<&str> {
    extraction
        .edges
        .iter()
        .filter(|edge| edge.relation == RelationKind::Calls)
        .map(|edge| edge.target.as_str())
        .collect()
}

fn gap(extraction: &Extraction, call: &str, kind: UnresolvedKind) {
    assert!(
        extraction
            .unresolved
            .iter()
            .any(|site| site.text == call && site.kind == kind),
        "missing {kind:?} evidence for {call}: {:?}",
        extraction.unresolved
    );
}

#[test]
fn public_registry_extracts_cpp_extensions_and_cpp_h_headers() {
    for extension in ["cpp", "cc", "cxx", "hpp", "hh", "hxx"] {
        let path = format!("Source/Processor.{extension}");
        assert_eq!(pack_for_path(Path::new(&path)).unwrap().id(), "cpp");
        assert!(
            extract(&path, HEADER)
                .symbols
                .iter()
                .any(|symbol| symbol.name == "Processor")
        );
    }
    let header = extract("Source/Processor.h", HEADER);
    assert!(
        header
            .symbols
            .iter()
            .any(|symbol| symbol.name == "Processor")
    );
    let c_header = b"struct Plain { int value; };\nint function(int);\n";
    assert_eq!(
        pack_for_source(Path::new("plain.h"), c_header)
            .unwrap()
            .id(),
        "c"
    );
}

#[test]
fn juce_types_and_definitions_have_truthful_discoverable_ranges() {
    let extraction = extract("Source/Processor.h", HEADER);
    let names: Vec<_> = extraction
        .symbols
        .iter()
        .map(|symbol| symbol.name.as_str())
        .collect();
    assert_eq!(
        names,
        [
            "AudioBuffer",
            "AudioProcessor",
            "Meter",
            "Meter",
            "MidiBuffer",
            "Processor",
            "Settings",
            "getWritePointer",
            "juce",
            "operator bool",
            "operator()",
            "operator=",
            "plugin::dsp",
            "samples",
            "~AudioProcessor",
            "~Meter",
        ]
    );
    assert!(!names.contains(&"prepareToPlay")); // declaration, no body
    assert!(!names.contains(&"processBlock")); // pure virtual/declaration
    for symbol in &extraction.symbols {
        assert_eq!(slice(HEADER, symbol.span), symbol.name);
        assert!(symbol.search_span.start <= symbol.span.start);
        assert!(symbol.span.end <= symbol.search_span.end);
    }
    let processor = extraction
        .symbols
        .iter()
        .find(|symbol| symbol.name == "Processor")
        .unwrap();
    let body = slice(HEADER, processor.search_span);
    assert!(body.starts_with("class Processor final"));
    assert!(body.contains("juce::AudioBuffer<float>"));
    assert!(body.contains("struct Settings"));
    assert!(
        extraction
            .edges
            .iter()
            .all(|edge| edge.relation != RelationKind::References)
    );
}

#[test]
fn qualified_definitions_remain_unqualified_and_calls_are_conservative() {
    let extraction = extract("Source/graph.cpp", SOURCE);
    for name in [
        "Processor",
        "~Processor",
        "prepareToPlay",
        "processBlock",
        "operator bool",
        "operator[]",
        "supportedRate",
        "clampUnit",
        "plugin::dsp",
    ] {
        assert!(
            extraction.symbols.iter().any(|symbol| symbol.name == name),
            "missing {name}"
        );
    }
    for symbol in &extraction.symbols {
        assert_eq!(slice(SOURCE, symbol.span), symbol.name);
        let body = slice(SOURCE, symbol.search_span);
        assert!(body.contains(&symbol.name));
        assert!(
            symbol.search_span.start <= symbol.span.start
                && symbol.span.end <= symbol.search_span.end
        );
    }
    assert_eq!(calls(&extraction), ["clampUnit", "supportedRate"]);
    for edge in extraction
        .edges
        .iter()
        .filter(|edge| edge.relation == RelationKind::Calls)
    {
        assert_eq!(edge.provenance, Provenance::Syntax);
        assert_eq!(edge.span, edge.context_span);
    }
    gap(
        &extraction,
        "supportedRate(48000)",
        UnresolvedKind::Dispatch,
    );
    gap(
        &extraction,
        "buffer.getWritePointer(0)",
        UnresolvedKind::Dispatch,
    );
    gap(
        &extraction,
        "clampUnit(samples[0])",
        UnresolvedKind::Dispatch,
    );
    gap(
        &extraction,
        "engine.prepareToPlay(48000.0, 512)",
        UnresolvedKind::Dispatch,
    );
    gap(&extraction, "overloaded(1)", UnresolvedKind::Overload);
    let imports: Vec<_> = extraction
        .edges
        .iter()
        .filter(|edge| edge.relation == RelationKind::Imports)
        .map(|edge| edge.target.as_str())
        .collect();
    assert_eq!(imports, ["\"juce_style.h\"", "<cmath>"]);
    for edge in extraction
        .edges
        .iter()
        .filter(|edge| edge.relation == RelationKind::Imports)
    {
        assert!(slice(SOURCE, edge.span).starts_with("#include"));
        assert_eq!(edge.provenance, Provenance::Syntax);
    }
    assert_eq!(extract("Source/graph.cpp", SOURCE), extraction);
    assert_eq!(
        extract("Source/graph.cpp", SOURCE).stable_hash(),
        extraction.stable_hash()
    );
}

#[test]
fn lexical_shadows_cover_control_headers_and_structured_bindings() {
    let prefix = "bool helper(int value) { return value != 0; }\n";
    let cases = [
        ("parameter", "void test(bool (*helper)(int)) { helper(1); }"),
        (
            "default_parameter",
            "void test(bool (*helper)(int) = nullptr) { helper(1); }",
        ),
        (
            "lambda",
            "void test() { auto helper = [](int) { return true; }; helper(1); }",
        ),
        (
            "pointer",
            "void test() { bool (*helper)(int) = nullptr; helper(1); }",
        ),
        ("reference", "void test(bool (&helper)(int)) { helper(1); }"),
        (
            "multiple",
            "void test() { bool (*other)(int) = nullptr, (*helper)(int) = other; helper(1); }",
        ),
        (
            "for",
            "void test() { for (auto helper = [](int) { return false; }; helper(1); ) {} }",
        ),
        (
            "if",
            "void test() { if (auto helper = [](int) { return true; }; helper(1)) { helper(2); } }",
        ),
        (
            "while",
            "void test() { while (bool (*helper)(int) = nullptr) { helper(1); } }",
        ),
        (
            "switch",
            "void test() { switch (auto helper = [](int) { return true; }; 0) { case 0: helper(1); } }",
        ),
        (
            "range",
            "void test() { bool (*callbacks[1])(int) = {nullptr}; for (auto helper : callbacks) { helper(1); } }",
        ),
        (
            "structured",
            "struct Callback { bool (*function)(int); }; void test() { auto [helper] = Callback{nullptr}; helper(1); }",
        ),
        (
            "range_structured",
            "struct Callback { bool (*function)(int); }; void test() { Callback callbacks[1] = {}; for (auto [helper] : callbacks) { helper(1); } }",
        ),
        (
            "catch",
            "void test() { try {} catch (bool (*helper)(int)) { helper(1); } }",
        ),
        (
            "case",
            "void test() { switch (0) { case 0: bool (*helper)(int) = nullptr; helper(1); break; } }",
        ),
        (
            "label",
            "void test() { label: bool (*helper)(int) = nullptr; helper(1); }",
        ),
        (
            "capture",
            "void test() { auto run = [] { return helper(1); }; run(); }",
        ),
        (
            "local_type",
            "void test() { struct helper { explicit helper(int) {} }; helper(1); }",
        ),
        (
            "local_alias",
            "struct Callable { explicit Callable(int) {} }; void test() { using helper = Callable; helper(1); }",
        ),
    ];
    for (label, body) in cases {
        let source = format!("{prefix}{body}");
        let extraction = extract(&format!("{label}.cpp"), source.as_bytes());
        assert!(
            calls(&extraction).is_empty(),
            "{label}: {:?}",
            extraction.edges
        );
        gap(&extraction, "helper(1)", UnresolvedKind::Dispatch);
    }
}

#[test]
fn shadow_visibility_preserves_positive_direct_calls() {
    let source = br#"
namespace audio {
bool helper(int value) { return value != 0; }
void test(int value) {
    { auto helper = [](int) { return false; }; helper(1); }
    helper(2);
    helper(value);
    const int local = 3;
    helper(local);
    if (auto helper = [](int) { return true; }; helper(4)) { helper(5); }
    helper(6);
    auto helper = [](int) { return false; };
    helper(7);
}
}
"#;
    let extraction = extract("visibility.cpp", source);
    let call_sites: Vec<_> = extraction
        .edges
        .iter()
        .filter(|edge| edge.relation == RelationKind::Calls)
        .map(|edge| slice(source, edge.span))
        .collect();
    assert_eq!(
        call_sites,
        ["helper(2)", "helper(value)", "helper(local)", "helper(6)"]
    );
    for site in ["helper(1)", "helper(4)", "helper(5)", "helper(7)"] {
        gap(&extraction, site, UnresolvedKind::Dispatch);
    }
}

#[test]
fn macros_overloads_templates_and_unknown_types_never_guess_targets() {
    let cases = [
        (
            "macro",
            "bool helper(int x) { return x != 0; }\n#define helper(x) false\nvoid test() { helper(1); }",
            "helper(1)",
            UnresolvedKind::Dispatch,
        ),
        (
            "object_macro",
            "bool helper(int x) { return x != 0; }\n#define helper replacement\nbool replacement(int); void test() { helper(1); }",
            "helper(1)",
            UnresolvedKind::Dispatch,
        ),
        (
            "global_value",
            "namespace functions { bool helper(int x) { return x != 0; } } bool (*helper)(int) = nullptr; void test() { helper(1); }",
            "helper(1)",
            UnresolvedKind::Dispatch,
        ),
        (
            "global_structured",
            "bool helper(int x) { return x != 0; } namespace callbacks { struct Holder { bool (*function)(int); }; auto [helper] = Holder{nullptr}; void test() { helper(1); } }",
            "helper(1)",
            UnresolvedKind::Dispatch,
        ),
        (
            "macro_binding",
            "bool helper(int x) { return x != 0; }\n#define LOCAL_BINDING auto helper = [](int) { return true; }\nvoid test() { LOCAL_BINDING; helper(1); }",
            "helper(1)",
            UnresolvedKind::Dispatch,
        ),
        (
            "qualified",
            "namespace audio { bool helper(int x) { return x != 0; } } void test() { audio::helper(1); }",
            "audio::helper(1)",
            UnresolvedKind::Dispatch,
        ),
        (
            "overload",
            "int helper(int x) { return x; } double helper(double x) { return x; } int test() { return helper(1); }",
            "helper(1)",
            UnresolvedKind::Overload,
        ),
        (
            "prototype",
            "int helper(int x) { return x; } double helper(double); int test() { return helper(1); }",
            "helper(1)",
            UnresolvedKind::Dispatch,
        ),
        (
            "using",
            "int helper(int x) { return x; } namespace other { int helper(int); } void test() { using other::helper; helper(1); }",
            "helper(1)",
            UnresolvedKind::Dispatch,
        ),
        (
            "template",
            "template <typename T> T helper(T x) { return x; } void test() { helper(1); }",
            "helper(1)",
            UnresolvedKind::Dispatch,
        ),
        (
            "dependent",
            "bool helper(int x) { return x != 0; } template <typename T> void test(T value) { helper(value); }",
            "helper(value)",
            UnresolvedKind::Dispatch,
        ),
        (
            "adl",
            "namespace other { struct Value { operator int() const { return 1; } }; bool helper(Value); } bool helper(int x) { return x != 0; } void test(other::Value value) { helper(value); }",
            "helper(value)",
            UnresolvedKind::Dispatch,
        ),
        (
            "unknown_type",
            "struct Value { operator int() const { return 1; } }; bool helper(int x) { return x != 0; } void test(Value value) { helper(value); }",
            "helper(value)",
            UnresolvedKind::Dispatch,
        ),
        (
            "auto",
            "bool helper(int x) { return x != 0; } void test() { auto value = 1; helper(value); }",
            "helper(value)",
            UnresolvedKind::Dispatch,
        ),
        (
            "member",
            "bool helper(int x) { return x != 0; } struct Engine { bool helper(int) { return true; } void test() { helper(1); } };",
            "helper(1)",
            UnresolvedKind::Overload,
        ),
        (
            "inherited",
            "bool helper(int x) { return x != 0; } struct Base { bool helper(int); }; struct Engine : Base { void test() { helper(1); } };",
            "helper(1)",
            UnresolvedKind::Dispatch,
        ),
        (
            "out_of_line_member",
            "bool helper(int x) { return x != 0; } struct Engine { bool helper(int); void test(); }; void Engine::test() { helper(1); }",
            "helper(1)",
            UnresolvedKind::Dispatch,
        ),
        (
            "receiver",
            "struct Engine { void helper(int); }; void test(Engine& engine) { engine.helper(1); }",
            "engine.helper(1)",
            UnresolvedKind::Dispatch,
        ),
        (
            "pointer_receiver",
            "struct Engine { void helper(int); }; void test(Engine* engine) { engine->helper(1); }",
            "engine->helper(1)",
            UnresolvedKind::Dispatch,
        ),
        (
            "conditional",
            "bool helper(int x) { return x != 0; }\n#if ENABLE_AUDIO\nvoid test() { helper(1); }\n#endif",
            "helper(1)",
            UnresolvedKind::Dispatch,
        ),
    ];
    for (label, source, call, kind) in cases {
        let extraction = extract(&format!("{label}.cpp"), source.as_bytes());
        assert!(
            calls(&extraction).is_empty(),
            "{label}: {:?}",
            extraction.edges
        );
        gap(&extraction, call, kind);
    }
}

#[test]
fn type_spelling_never_guesses_identity_across_namespaces_or_files() {
    for (path, source) in [
        (
            "namespaces.cpp",
            "namespace left { struct Meter {}; } namespace right { struct Meter {}; Meter make(Meter value) { return value; } }",
        ),
        (
            "external.cpp",
            "#include \"juce_style.h\"\nnamespace external { struct Meter; } namespace local { struct Meter {}; } void test(external::Meter* meter) { (void) meter; }",
        ),
    ] {
        let extraction = extract(path, source.as_bytes());
        assert!(
            extraction
                .edges
                .iter()
                .all(|edge| edge.relation != RelationKind::References)
        );
    }
}

#[test]
fn conversion_operator_pointer_type_excludes_parameters_from_name() {
    let source = b"struct View { operator const char*() const { return nullptr; } };\n";
    let extraction = extract("conversion.cpp", source);
    let operator = extraction
        .symbols
        .iter()
        .find(|symbol| symbol.name == "operator const char*")
        .unwrap();
    assert_eq!(slice(source, operator.span), "operator const char*");
    assert_eq!(
        slice(source, operator.search_span),
        "operator const char*() const { return nullptr; }"
    );
}

#[test]
fn parser_errors_retain_gaps_and_suppress_calls() {
    let source = b"int helper(int x) { return x; } void test() { helper(1); int = ; }";
    let path = Path::new("broken.cpp");
    let pack = pack_for_source(path, source).unwrap();
    let extraction = pack.extract(path, source).unwrap();
    assert!(!extraction.parser_error_ranges.is_empty());
    assert!(calls(&extraction).is_empty());
    gap(&extraction, "helper(1)", UnresolvedKind::Dispatch);
}
