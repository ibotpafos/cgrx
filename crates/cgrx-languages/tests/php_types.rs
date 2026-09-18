#![cfg(feature = "experimental-php")]
use cgrx_languages::{Extraction, Provenance, Span, pack_for_path};
use std::path::Path;

fn parse(source: &str) -> Extraction {
    pack_for_path(Path::new("main.php"))
        .unwrap()
        .extract(Path::new("main.php"), source.as_bytes())
        .unwrap()
}
fn bindings(source: &str) -> Vec<(String, String, String, Option<String>)> {
    let extraction = parse(source);
    assert!(
        extraction.parser_error_ranges.is_empty(),
        "{source}: {extraction:?}"
    );
    extraction
        .edges
        .iter()
        .filter_map(|e| {
            if let Provenance::PhpType {
                owner,
                target,
                import,
            } = e.provenance
            {
                Some((
                    source[owner.start..owner.end].to_owned(),
                    source[target.start..target.end].to_owned(),
                    source[e.span.start..e.span.end].to_owned(),
                    import.map(|s| source[s.start..s.end].to_owned()),
                ))
            } else {
                None
            }
        })
        .collect()
}

#[test]
fn php_types_bind_namespace_group_alias_prefix_absolute_and_relative_names() {
    let source = r#"<?php
namespace Vendor { class Payload {} interface Contract {} enum Status { case Ready; } }
namespace App {
use Vendor\{Payload as Item, Contract};
use Vendor as Library;
class Local {}
function consume(Item $item, \Vendor\Status $status): Library\Contract {}
class Handler { public ?Item $item; function process(namespace\Local $local): Contract {} }
}
"#;
    let found = bindings(source);
    for expected in [
        ("consume", "Payload", "Item", Some("Payload as Item")),
        ("consume", "Status", "\\Vendor\\Status", None),
        (
            "consume",
            "Contract",
            "Library\\Contract",
            Some("Vendor as Library"),
        ),
        ("Handler", "Payload", "Item", Some("Payload as Item")),
        ("process", "Local", "namespace\\Local", None),
        ("process", "Contract", "Contract", Some("Contract")),
    ] {
        let expected = (
            expected.0.into(),
            expected.1.into(),
            expected.2.into(),
            expected.3.map(String::from),
        );
        assert!(found.contains(&expected), "{expected:?}: {found:?}");
    }
    assert_eq!(found.len(), 6);
}

#[test]
fn php_type_spans_distinguish_identical_short_names_in_unbracketed_namespaces() {
    let source = "<?php namespace A; class T {} function first(T $a) {} namespace B; class T {} function second(\\A\\T $a): T {}";
    let extraction = parse(source);
    assert!(extraction.parser_error_ranges.is_empty());
    let first = source.find("class T").unwrap() + 6;
    let second = source.rfind("class T").unwrap() + 6;
    let mut targets = Vec::new();
    for edge in extraction.edges {
        if let Provenance::PhpType { target, .. } = edge.provenance {
            targets.push(target.start);
        }
    }
    targets.sort();
    assert_eq!(targets, vec![first, first, second]);
}

#[test]
fn php_import_tables_are_local_to_each_namespace_block() {
    let source = r#"<?php
namespace V { class One {} class Two {} }
namespace A { use V\One as T; function first(T $value) {} }
namespace A { use V\Two as T; function second(T $value) {} }
namespace { function third(\V\One $value) {} }
"#;
    let found = bindings(source);
    assert_eq!(found.len(), 3);
    assert!(found.iter().any(|v| v.0 == "first" && v.1 == "One"));
    assert!(found.iter().any(|v| v.0 == "second" && v.1 == "Two"));
    assert!(
        found
            .iter()
            .any(|v| v.0 == "third" && v.1 == "One" && v.3.is_none())
    );
}

#[test]
fn php_function_and_constant_imports_do_not_pollute_type_aliases() {
    for imports in [
        r"use V\T as Item; use function Other\f as Item; use const Other\C as Item;",
        r"use V\{T as Item, function f, const C};",
    ] {
        let source = format!(
            "<?php namespace V {{ class T {{}} }} namespace A {{ {imports} function f(Item $x): Item {{}} }}"
        );
        let found = bindings(&source);
        assert_eq!(found.len(), 2, "{source}: {found:?}");
        assert!(found.iter().all(|b| b.1 == "T" && b.3.is_some()));
    }
}

#[test]
fn php_unsupported_type_identity_never_becomes_positional_proof() {
    for source in [
        r"<?php use Missing\T; function f(T $value) {}",
        r"<?php namespace A; class T {} namespace B; function f(T $value) {}",
        r"<?php class T {} class t {} function f(T $value) {}",
        r"<?php if ($ok) { class T {} } function f(T $value) {}",
        r"<?php function factory() { class T {} } function f(T $value) {}",
        r"<?php trait T {} function f(T $value) {}",
        r"<?php class T {} use Other\T; function f(T $value) {}",
        r"<?php namespace V { class T {} } namespace A { use V\T as X; use V\T as X; function f(X $v) {} }",
        r"<?php class T {} function outer() { $f = function(T $v): T {}; }",
        r"<?php class T {} function outer() { $f = fn(T $v): T => $v; }",
    ] {
        let result = parse(source);
        assert!(
            result.parser_error_ranges.is_empty(),
            "{source}: {result:?}"
        );
        assert!(
            result
                .edges
                .iter()
                .any(|e| e.relation == cgrx_languages::RelationKind::References),
            "syntax evidence must stay visible: {source}"
        );
        assert!(bindings(source).is_empty(), "{source}");
    }
    assert_eq!(
        bindings("<?php class T {} function positive(T $x): T {}").len(),
        2
    );
}

#[test]
fn php_case_insensitive_type_identity_preserves_source_bytes_and_all_extensions() {
    let source = r"<?php namespace V { class Payload {} } namespace A { use V\Payload as Item; function f(iTEM $v): \v\PAYLOAD {} }";
    let expected = parse(source);
    assert_eq!(bindings(source).len(), 2);
    for extension in ["php", "phtml", "php3", "php4", "php5", "phps"] {
        let path = format!("main.{extension}");
        assert_eq!(
            pack_for_path(Path::new(&path))
                .unwrap()
                .extract(Path::new(&path), source.as_bytes())
                .unwrap(),
            expected
        );
    }
}

#[test]
fn php_type_provenance_hash_covers_owner_target_and_import_identity() {
    let source = r"<?php namespace V { class T {} } namespace A { use V\T as Item; function f(Item $value) {} }";
    let original = parse(source);
    let hash = original.stable_hash();
    let index = original
        .edges
        .iter()
        .position(|e| matches!(e.provenance, Provenance::PhpType { .. }))
        .unwrap();
    for field in 0..3 {
        let mut changed = original.clone();
        if let Provenance::PhpType {
            owner,
            target,
            import,
        } = &mut changed.edges[index].provenance
        {
            match field {
                0 => owner.start += 1,
                1 => target.start += 1,
                _ => *import = Some(Span { start: 0, end: 1 }),
            }
        }
        assert_ne!(hash, changed.stable_hash());
    }
}

#[test]
fn php_type_imports_are_not_retroactive_and_strict_types_preambles_are_supported() {
    let source = r"<?php declare(strict_types=1); namespace V { class T {} } namespace A { function before(Item $x) {} use V\T as Item; function after(Item $x) {} }";
    let found = bindings(source);
    assert_eq!(found.len(), 1, "{found:?}");
    assert_eq!(found[0].0, "after");
    assert_eq!(
        bindings(r"<?php declare(strict_types = 1); namespace V; class T {} function f(T $x) {}")
            .len(),
        1
    );
}

#[test]
fn php_import_targets_are_absolute_and_do_not_recursively_expand_other_aliases() {
    let source = r"<?php namespace First { class Value {} } namespace Alias { class Value {} } namespace App { use First as Alias; use Alias\Value as Item; function f(Item $v) {} }";
    let expected = source.rfind("class Value").unwrap() + 6;
    let extraction = parse(source);
    let proofs: Vec<_> = extraction
        .edges
        .iter()
        .filter_map(|e| {
            if let Provenance::PhpType { target, .. } = e.provenance {
                Some(target.start)
            } else {
                None
            }
        })
        .collect();
    assert_eq!(proofs, vec![expected]);
}

#[test]
fn php_class_initializers_and_attributes_are_not_calls_of_the_enclosing_function() {
    for declaration in [
        "class Nested { public $property = helper(); }",
        "class Nested { const C = helper(); }",
        "#[Annotation(helper())] class Nested {}",
    ] {
        let source =
            format!("<?php function helper() {{}} function outer() {{ {declaration} helper(); }}");
        let result = parse(&source);
        assert!(
            result.parser_error_ranges.is_empty(),
            "{source}: {result:?}"
        );
        let calls: Vec<_> = result
            .edges
            .iter()
            .filter(|e| e.relation == cgrx_languages::RelationKind::Calls)
            .collect();
        assert_eq!(calls.len(), 1, "{source}: {calls:?}");
        assert_eq!(calls[0].span.start, source.rfind("helper()").unwrap());
        assert!(!result.unresolved.is_empty());
    }
}

#[test]
fn php_named_methods_and_anonymous_constructor_arguments_keep_their_real_owners() {
    let source = "<?php function helper() {} function outer() { $obj = new class(helper()) { function run() { helper(); } }; helper(); }";
    let result = parse(source);
    assert!(result.parser_error_ranges.is_empty(), "{result:?}");
    let mut owners: Vec<_> = result
        .edges
        .iter()
        .filter_map(|e| {
            if let Provenance::PhpFunction { caller, .. } = e.provenance {
                Some(&source[caller.start..caller.end])
            } else {
                None
            }
        })
        .collect();
    owners.sort();
    assert_eq!(owners, vec!["outer", "outer", "run"]);
}
