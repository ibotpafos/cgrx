use cgrx_languages::{Extraction, Provenance, RelationKind, Span, pack_for_path};
use std::path::Path;

const EXACT: &[u8] = include_bytes!("fixtures/swift/Exact.swift");
const NEGATIVE: &[u8] = include_bytes!("fixtures/swift/Negative.swift");
const CATALOG: &[u8] = include_bytes!("fixtures/swift/Catalog.swift");
const ALIASED: &[u8] = include_bytes!("fixtures/swift/Aliased.swift");
const APP: &[u8] = include_bytes!("fixtures/swift/AppStore.swift");
const CROSS_FILE: &[u8] = include_bytes!("fixtures/swift/CrossFilePrimary.swift");

fn extract(source: &[u8]) -> Extraction {
    let pack =
        pack_for_path(Path::new("Sources/Catalog.swift")).expect("Swift in default registry");
    assert_eq!(pack.id(), "swift");
    let out = pack
        .extract(Path::new("Sources/Catalog.swift"), source)
        .unwrap();
    if !out.parser_error_ranges.is_empty() {
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(&pack.language()).unwrap();
        panic!(
            "parser gaps {:?}: {}",
            out.parser_error_ranges,
            parser.parse(source, None).unwrap().root_node().to_sexp()
        );
    }
    for symbol in &out.symbols {
        assert_eq!(slice(source, symbol.span), symbol.name);
        assert!(
            symbol.search_span.start <= symbol.span.start
                && symbol.span.end <= symbol.search_span.end
        );
    }
    // The runtime requires the exact declared name and nearest indexed owner.
    for edge in &out.edges {
        if edge.relation == RelationKind::Imports {
            continue;
        }
        let Provenance::SwiftExact { owner, target } = edge.provenance else {
            panic!("unproven {edge:?}")
        };
        let owner = out
            .symbols
            .iter()
            .find(|s| s.span == owner)
            .expect("exact owner symbol");
        let target = out
            .symbols
            .iter()
            .find(|s| s.span == target)
            .expect("exact target symbol");
        assert_eq!(edge.target, target.name);
        assert_eq!(slice(source, target.span), edge.target);
        assert!(
            owner.search_span.start <= edge.span.start && edge.span.end <= owner.search_span.end
        );
        assert!(
            !out.symbols
                .iter()
                .any(|s| s.search_span.start <= edge.span.start
                    && edge.span.end <= s.search_span.end
                    && s.search_span.end - s.search_span.start
                        < owner.search_span.end - owner.search_span.start)
        );
    }
    out
}

#[test]
fn defer_and_compiler_builtin_attributes_are_not_binding_gaps() {
    let source = b"typealias Verify = @Sendable (Int) throws -> Void\n@main\nstruct App {\n    @discardableResult\n    func run() -> Int {\n        defer { cleanup() }\n        return 1\n    }\n    private func cleanup() {}\n}\n";
    let out = extract(source);
    for unresolved in &out.unresolved {
        assert!(
            !matches!(
                unresolved.text.as_str(),
                "main" | "discardableResult" | "throws" | "rethrows"
            ),
            "{unresolved:?}"
        );
        assert!(!unresolved.text.starts_with("defer {"), "{unresolved:?}");
    }
    assert!(
        out.swift_type_references
            .iter()
            .any(|span| slice(source, *span) == "Int")
    );
}

#[test]
fn compiler_sites_anchor_declared_and_applied_operators_without_resolving_overloads() {
    let source = include_bytes!("../../cgrx-cli/tests/fixtures/SwiftOperators.swift");
    let out = extract(source);
    let sites = cgrx_languages::swift_compiler_sites(source).unwrap();
    for name in ["<", "==", "<+>", "⊕", "~++", "++"] {
        let declarations = out
            .symbols
            .iter()
            .filter(|s| s.name == name)
            .collect::<Vec<_>>();
        assert!(!declarations.is_empty(), "missing declaration {name}");
        for declaration in declarations {
            assert_eq!(
                sites.tokens.get(&declaration.span.start),
                Some(&declaration.span),
                "unanchored declaration {name}"
            );
        }
        let applied = source
            .windows(name.len())
            .enumerate()
            .filter(|(_, bytes)| *bytes == name.as_bytes())
            .filter(|(start, _)| {
                sites
                    .tokens
                    .get(start)
                    .is_some_and(|span| slice(source, *span) == name)
            })
            .count();
        assert!(applied >= 2, "unanchored application {name}");
    }
    // Lexical anchors do not establish a type-directed overload or CALL role.
    assert!(out.edges.iter().all(|edge| !matches!(
        edge.target.as_str(),
        "<" | "==" | "<+>" | "⊕" | "~++" | "++"
    )));
}

#[test]
fn compiler_sites_keep_valid_regions_next_to_hidden_scanner_recovery() {
    let source = br#"struct Owner {
    var title: String {
        "GD Connect \(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "0.1.1")"
            .description
    }
    func run() { target() }
    func target() {}
}

"#;
    let sites = cgrx_languages::swift_compiler_sites(source).unwrap();
    assert!(
        sites.recovered,
        "fixture must exercise the hidden scanner error"
    );
    assert!(
        sites
            .calls
            .values()
            .any(|callee| slice(source, *callee) == "target")
    );
    let out = pack_for_path(Path::new("source.swift"))
        .unwrap()
        .extract(Path::new("source.swift"), source)
        .unwrap();
    assert!(
        !out.parser_error_ranges.is_empty(),
        "hidden parser recovery must be reported"
    );
    assert!(
        out.parser_error_ranges
            .iter()
            .all(|span| span.start < span.end)
    );
}

#[test]
fn compiler_sites_anchor_wrapped_calls_generics_and_metatype_bases() {
    let source = br#"struct Box<T> { let value: T }
func syntax<T>(_ type: T.Type, _ flag: Bool) {
    let a = !ready(1)
    let b = "sha256:" + digest(1)
    let c = flag && ready { 2 }
    let d = flag ? first : digest { 2 }
    let e = Box<Int>(value: 1)
    let indirect = (flag ? first : second)()
    let combined = (first + second)()
    let returned = factory()()
}
"#;
    let sites = cgrx_languages::swift_compiler_sites(source).unwrap();
    assert!(!sites.recovered);
    for (call, callee) in [
        ("!ready(1)", "ready"),
        ("\"sha256:\" + digest(1)", "digest"),
        ("flag && ready { 2 }", "ready"),
        ("flag ? first : digest { 2 }", "digest"),
        ("Box<Int>(value: 1)", "Box"),
    ] {
        let start = std::str::from_utf8(source).unwrap().find(call).unwrap();
        let span = Span {
            start,
            end: start + call.len(),
        };
        let target = sites.calls.get(&span).unwrap_or_else(|| {
            panic!(
                "missing {call}; calls {:?}",
                sites
                    .calls
                    .iter()
                    .map(|(site, callee)| (slice(source, *site), slice(source, *callee)))
                    .collect::<Vec<_>>()
            )
        });
        assert_eq!(slice(source, *target), callee, "{call}");
    }
    for call in [
        "(flag ? first : second)()",
        "(first + second)()",
        "factory()()",
    ] {
        assert!(
            sites.calls.keys().all(|span| slice(source, *span) != call),
            "{call}"
        );
    }
    assert!(sites.types.iter().any(|(reference, head)| {
        slice(source, *reference) == "T.Type" && slice(source, *head) == "T"
    }));
    let out = extract(source);
    assert_eq!(out.symbols.iter().filter(|s| s.name == "T").count(), 2);
}

#[test]
fn language_builtin_types_are_not_missing_user_declarations() {
    let source = b"struct Owner {\n func value(_ any: Any, _ type: Any.Type) -> Self { self }\n}\nstruct `Any` {}\nfunc escaped(_ x: `Any`) {}\n";
    let out = extract(source);
    assert!(
        out.unresolved
            .iter()
            .all(|site| !matches!(site.text.as_str(), "Any" | "Any.Type" | "Self"))
    );
    assert!(
        out.swift_type_references
            .iter()
            .any(|span| slice(source, *span) == "`Any`")
    );
    assert!(
        out.edges
            .iter()
            .any(|edge| edge.relation == RelationKind::References && edge.target == "`Any`")
    );
}

fn slice(source: &[u8], span: Span) -> &str {
    std::str::from_utf8(&source[span.start..span.end]).unwrap()
}
fn call<'a>(out: &'a Extraction, source: &[u8], site: &str) -> &'a cgrx_languages::Edge {
    out.edges
        .iter()
        .find(|e| e.relation == RelationKind::Calls && slice(source, e.span) == site)
        .unwrap_or_else(|| panic!("missing call {site}; gaps {:?}", out.unresolved))
}
fn gap(out: &Extraction, source: &[u8], site: &str) {
    assert!(
        !out.edges
            .iter()
            .any(|e| e.relation == RelationKind::Calls && slice(source, e.span) == site),
        "false call {site}"
    );
    assert!(
        out.unresolved.iter().any(|u| u.text == site),
        "missing gap {site}"
    );
}

#[test]
fn default_swift_proves_imported_file_free_calls_and_closed_member_dispatch() {
    let out = extract(EXACT);
    for (site, name) in [
        ("announce()", "announce"),
        ("refresh()", "refresh"),
        ("self.reset()", "reset"),
        ("write(value: 1)", "write"),
        ("self.write(text: \"hello\")", "write"),
        ("Counter.normalize(2)", "normalize"),
        ("self.close()", "close"),
        ("self.flush()", "flush"),
        ("self.step()", "step"),
        ("self.résumé()", "résumé"),
        ("self.`repeat`()", "`repeat`"),
    ] {
        assert_eq!(call(&out, EXACT, site).target, name);
    }
    assert_eq!(
        out.edges
            .iter()
            .filter(|e| e.relation == RelationKind::Calls && slice(EXACT, e.span) == "self.reset()")
            .count(),
        2
    );
    assert!(
        out.edges
            .iter()
            .any(|e| e.relation == RelationKind::Imports && e.target == "Foundation")
    );
}

#[test]
fn other_source_files_can_change_member_overloads_and_nested_type_lookup() {
    // This fixture typechecks together with CrossFileExtension.swift. The call
    // selects that file's String overload and contextual String return; the
    // stored property is Other through an extension's nested typealias. None
    // may be bound to the same-spelled Int methods or top-level Payload here.
    let out = extract(CROSS_FILE);
    gap(&out, CROSS_FILE, "send(\"text\")");
    gap(&out, CROSS_FILE, "result()");
    assert!(
        !out.edges
            .iter()
            .any(|edge| { edge.relation == RelationKind::References && edge.target == "Payload" })
    );
    assert!(out.unresolved.iter().any(|site| site.text == "Payload"));
}

#[test]
fn type_dependencies_bind_nearest_declarations_and_extension_owners() {
    let out = extract(EXACT);
    for (owner_name, target_name) in [
        ("SavedSnapshot", "Snapshot"),
        ("snapshot", "Snapshot"),
        ("receive", "Snapshot"),
        ("receive", "SavedSnapshot"),
        ("Counter", "Counter"),
        ("preview", "Snapshot"),
    ] {
        assert!(
            out.edges.iter().any(|e| {
                let Provenance::SwiftExact { owner, target } = e.provenance else {
                    return false;
                };
                e.relation == RelationKind::References
                    && slice(EXACT, owner) == owner_name
                    && slice(EXACT, target) == target_name
            }),
            "missing {owner_name} -> {target_name}: {:?}",
            out.edges
        );
    }
    let counters: Vec<_> = out.symbols.iter().filter(|s| s.name == "Counter").collect();
    assert_eq!(counters.len(), 2);
    assert_ne!(counters[0].span, counters[1].span);
    assert!(
        counters
            .iter()
            .any(|s| slice(EXACT, s.search_span).starts_with("extension Counter"))
    );
}

#[test]
fn realistic_catalog_and_swiftui_declarations_keep_exact_source_selectors() {
    for (source, names) in [
        (
            CATALOG,
            vec![
                "PluginVersion",
                "init",
                "<",
                "==",
                "hash",
                "PluginFormat",
                "au",
                "vst3",
                "displayName",
                "PluginCatalog",
                "load",
                "mergingCached",
                "title",
                "Catalog",
                "ReleaseChannelService",
                "ChannelRelease",
                "ChannelAsset",
                "verify",
                "read",
            ],
        ),
        (
            APP,
            vec![
                "PluginProduct",
                "AppStore",
                "products",
                "isInstalling",
                "init",
                "deinit",
                "refresh",
                "performInstall",
                "subscript",
                "title",
                "install",
                "CatalogView",
                "body",
                "CatalogCache",
                "latest",
                "store",
            ],
        ),
    ] {
        let out = extract(source);
        for name in names {
            assert!(
                out.symbols.iter().any(|s| s.name == name),
                "missing {name}: {:?}",
                out.symbols
            );
        }
        let overloads: Vec<_> = out.symbols.iter().filter(|s| s.name == "title").collect();
        if source == CATALOG {
            assert_eq!(overloads.len(), 2);
            assert_ne!(overloads[0].span, overloads[1].span);
        }
    }
    let out = extract(APP);
    let install = out
        .symbols
        .iter()
        .find(|s| s.name == "performInstall")
        .unwrap();
    let body = slice(APP, install.search_span);
    assert!(body.starts_with("@discardableResult"));
    assert!(
        body.contains("private func performInstall")
            && body.contains("async -> Bool")
            && body.ends_with('}')
    );
}

#[test]
fn dynamic_overloaded_shadowed_generic_and_imported_calls_stay_gaps() {
    let out = extract(NEGATIVE);
    assert!(
        !out.edges.iter().any(|e| e.relation == RelationKind::Calls),
        "{:?}",
        out.edges
    );
    for site in [
        "same(1)",
        "sink()",
        "action()",
        "self.step()",
        "factory()",
        "action.step()",
        "self.pick(1)",
        "self.pick()",
        "self.action()",
        "StaticShadow.step()",
        "abs(-1)",
        "Swift.readLine()",
        "CapturedStatic.step()",
        "nested()",
        "self.own()",
    ] {
        gap(&out, NEGATIVE, site);
    }
    let aliased = extract(ALIASED);
    gap(&aliased, ALIASED, "self.step(\"text\")");
    for edge in out
        .edges
        .iter()
        .filter(|e| e.relation == RelationKind::References)
    {
        let Provenance::SwiftExact { owner, target } = edge.provenance else {
            unreachable!()
        };
        if slice(NEGATIVE, target) == "Token" {
            assert!(
                !["typeShadow", "localTypeShadow", "consume"].contains(&slice(NEGATIVE, owner))
            );
        }
    }
}

#[test]
fn preprocessor_macro_and_parser_uncertainty_never_leaks_proofs() {
    for source in [
        "func target() {}\n#if DEBUG\nfunc caller() { target() }\n#endif\n",
        "func target() {}\nfunc caller() { #assert(true); target() }\n",
        "@UnknownGeneratedMembers struct S { func target() {}; func caller() { self.target() } }",
    ] {
        let out = extract(source.as_bytes());
        assert!(
            out.edges
                .iter()
                .all(|e| e.relation == RelationKind::Imports)
        );
        assert!(!out.unresolved.is_empty());
        assert!(!out.symbols.is_empty());
    }
    let pack = pack_for_path(Path::new("bad.swift")).unwrap();
    let out = pack
        .extract(
            Path::new("bad.swift"),
            b"func target() {}\nfunc caller() { target()\nfunc broken(",
        )
        .unwrap();
    assert!(!out.parser_error_ranges.is_empty());
    assert!(
        out.edges
            .iter()
            .all(|e| e.relation == RelationKind::Imports)
    );
    assert!(pack.extract(Path::new("/absolute.swift"), b"").is_err());
}

#[test]
fn proofs_are_deterministic_and_stable_hash_binds_both_exact_selectors() {
    let out = extract(EXACT);
    assert_eq!(out, extract(EXACT));
    let hash = out.stable_hash();
    for change_owner in [true, false] {
        let mut changed = out.clone();
        let edge = changed
            .edges
            .iter_mut()
            .find(|e| e.relation == RelationKind::Calls)
            .unwrap();
        let Provenance::SwiftExact {
            mut owner,
            mut target,
        } = edge.provenance
        else {
            unreachable!()
        };
        if change_owner {
            owner.start += 1;
        } else {
            target.start += 1;
        }
        edge.provenance = Provenance::SwiftExact { owner, target };
        assert_ne!(hash, changed.stable_hash());
    }
}
