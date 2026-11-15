//! Lexical callee ranges for binding an external semantic reference to a call.
//! These ranges identify syntax only; they do not resolve the called symbol.

use std::collections::BTreeMap;
use std::path::Path;

use tree_sitter::{Node, Parser};

use crate::{Span, pack_for_path};

/// Source anchors for a native Swift compiler occurrence. This only identifies
/// tokens and enclosing syntax; symbol identity must come from the compiler.
#[derive(Default)]
pub struct SwiftCompilerSites {
    pub tokens: BTreeMap<usize, Span>,
    pub calls: BTreeMap<Span, Span>,
    pub types: BTreeMap<Span, Span>,
    pub recovered: bool,
}

pub fn swift_compiler_sites(source: &[u8]) -> Option<SwiftCompilerSites> {
    let path = Path::new("source.swift");
    let mut parser = Parser::new();
    parser.set_language(&pack_for_path(path)?.language()).ok()?;
    let tree = parser.parse(source, None)?;
    let mut sites = SwiftCompilerSites {
        calls: collect_targets(tree.root_node(), "swift"),
        recovered: tree.root_node().has_error(),
        ..Default::default()
    };
    let mut pending = vec![tree.root_node()];
    while let Some(node) = pending.pop() {
        if node.is_error() || node.is_missing() {
            continue;
        }
        let ordinary_token = matches!(
            node.kind(),
            "simple_identifier" | "type_identifier" | "init" | "deinit" | "subscript"
        ) || (node.child_count() == 0 && node.kind().contains("operator"));
        // Builtin-spelled operator names such as `<` and `==` are anonymous
        // grammar tokens, unlike identifiers and custom operators. Preserve
        // the exact declaration/operation field, including composite operators.
        // These are only source anchors; a native USR and CALL role still have
        // to prove any invocation. No operator spelling selects an overload.
        let operator_token = match node.kind() {
            "function_declaration" | "protocol_function_declaration" => {
                node.child_by_field_name("name")
            }
            "prefix_expression" | "postfix_expression" => node.child_by_field_name("operation"),
            "additive_expression"
            | "multiplicative_expression"
            | "comparison_expression"
            | "equality_expression"
            | "conjunction_expression"
            | "disjunction_expression"
            | "range_expression"
            | "infix_expression" => node.child_by_field_name("op"),
            _ => None,
        };
        for token in [ordinary_token.then_some(node), operator_token]
            .into_iter()
            .flatten()
        {
            let span = Span::from(token);
            if span.start == span.end || token.has_error() {
                continue;
            }
            sites.tokens.insert(span.start, span);
            // IndexStore can anchor an escaped identifier after its opening `.
            if source.get(span.start) == Some(&b'`') {
                sites.tokens.insert(span.start + 1, span);
            }
        }
        if node.kind() == "user_type" && !node.has_error() {
            let mut cursor = node.walk();
            if let Some(head) = node
                .named_children(&mut cursor)
                .filter(|child| child.kind() == "type_identifier")
                // .Type/.Protocol are metatype syntax, not the referenced
                // declaration. Escaped identifiers with those names are real.
                .filter(|child| {
                    !matches!(
                        source.get(child.start_byte()..child.end_byte()),
                        Some(b"Type" | b"Protocol")
                    ) || child.start_byte() == node.start_byte()
                })
                .last()
            {
                sites.types.insert(node.into(), head.into());
            }
        }
        let mut cursor = node.walk();
        pending.extend(node.children(&mut cursor));
    }
    Some(sites)
}

/// Return full call -> named callee ranges for supported, error-free syntax.
/// Computed callees and unsupported syntax remain absent, never guessed.
pub fn call_target_spans(path: &Path, source: &[u8]) -> Option<BTreeMap<Span, Span>> {
    if path.is_absolute() {
        return None;
    }
    let pack = pack_for_path(path)?;
    let mut parser = Parser::new();
    parser.set_language(&pack.language_for_path(path)).ok()?;
    let tree = parser.parse(source, None)?;
    if tree.root_node().has_error() {
        return None;
    }
    Some(collect_targets(tree.root_node(), pack.id()))
}

fn collect_targets(root: Node<'_>, language: &str) -> BTreeMap<Span, Span> {
    let mut targets = BTreeMap::new();
    let mut pending = vec![root];
    while let Some(node) = pending.pop() {
        if node.is_error() || node.is_missing() {
            continue;
        }
        let function = match node.kind() {
            "call_expression" | "call" | "invocation_expression" | "function_call_expression" => {
                node.child_by_field_name("function").or_else(|| {
                    matches!(language, "kotlin" | "swift")
                        .then(|| node.named_child(0))
                        .flatten()
                })
            }
            "method_invocation"
            | "member_call_expression"
            | "nullsafe_member_call_expression"
            | "scoped_call_expression" => node.child_by_field_name("name"),
            "constructor_expression" if language == "swift" => {
                node.child_by_field_name("constructed_type")
            }
            _ => None,
        };
        let target = function.and_then(|function| {
            if language == "swift" {
                return swift_call_target(function);
            }
            named_target(function)
        });
        if let Some(target) = target.filter(|_| !node.has_error()) {
            targets.insert(Span::from(node), Span::from(target));
        }
        let mut cursor = node.walk();
        pending.extend(node.named_children(&mut cursor));
    }
    targets
}

// The Swift grammar attaches a call suffix after its entire unparenthesized
// prefix/binary expression, e.g. `!ready()` or `"hash:" + digest(data)`.
// Select only its final operand's token. This is a lexical anchor: the native
// compiler CALL role and exact USR still decide whether it names a callee.
fn swift_call_target(mut node: Node<'_>) -> Option<Node<'_>> {
    loop {
        node = match node.kind() {
            "prefix_expression" => node.child_by_field_name("target")?,
            "additive_expression"
            | "multiplicative_expression"
            | "comparison_expression"
            | "equality_expression"
            | "conjunction_expression"
            | "disjunction_expression"
            | "nil_coalescing_expression"
            | "range_expression"
            | "infix_expression" => node.child_by_field_name("rhs")?,
            "ternary_expression" => node.child_by_field_name("if_false")?,
            "user_type" => {
                let mut cursor = node.walk();
                return node
                    .named_children(&mut cursor)
                    .filter(|child| child.kind() == "type_identifier")
                    .last();
            }
            _ => return named_target(node),
        };
    }
}

fn named_target(mut node: Node<'_>) -> Option<Node<'_>> {
    loop {
        node = match node.kind() {
            "identifier"
            | "field_identifier"
            | "property_identifier"
            | "private_property_identifier"
            | "type_identifier"
            | "name"
            | "simple_identifier" => return Some(node),
            "generic_function" => node.child_by_field_name("function")?,
            "field_expression" => node.child_by_field_name("field")?,
            "member_expression" => node.child_by_field_name("property")?,
            "selector_expression" => node.child_by_field_name("field")?,
            "attribute" => node.child_by_field_name("attribute")?,
            "member_access_expression" => node.child_by_field_name("name")?,
            "navigation_expression" => node.child_by_field_name("suffix").or_else(|| {
                node.named_child(node.named_child_count().checked_sub(1)?.try_into().ok()?)
            })?,
            "navigation_suffix" => node.child_by_field_name("suffix")?,
            "qualified_name" | "relative_name" => {
                let name =
                    node.named_child(node.named_child_count().checked_sub(1)?.try_into().ok()?)?;
                if name.kind() != "name" {
                    return None;
                }
                name
            }
            "scoped_identifier" | "scoped_type_identifier" => node.child_by_field_name("name")?,
            "parenthesized_expression" if node.named_child_count() == 1 => node.named_child(0)?,
            _ => return None,
        };
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn named_callees_exclude_receivers_type_arguments_and_callback_arguments() {
        for (path, source, call, name) in [
            (
                "main.rs",
                "fn f(x: A) { x.work::<A>(helper); }",
                "x.work::<A>(helper)",
                "work",
            ),
            (
                "main.ts",
                "function f(x: A) { x.work<A>(helper); }",
                "x.work<A>(helper)",
                "work",
            ),
            (
                "main.go",
                "package p\nfunc f(x A) { x.Work(helper) }",
                "x.Work(helper)",
                "Work",
            ),
            (
                "main.py",
                "def f(x):\n    x.work(helper)\n",
                "x.work(helper)",
                "work",
            ),
            (
                "Main.java",
                "class A { void f(A x) { x.work(helper); } }",
                "x.work(helper)",
                "work",
            ),
            (
                "main.c",
                "void f(struct A* x) { x->work(helper); }",
                "x->work(helper)",
                "work",
            ),
            (
                "Main.kt",
                "fun f(x: A) { x.work(helper) }",
                "x.work(helper)",
                "work",
            ),
        ] {
            let start = source.find(call).unwrap();
            let spans = call_target_spans(Path::new(path), source.as_bytes()).unwrap();
            let target = spans
                .get(&Span {
                    start,
                    end: start + call.len(),
                })
                .unwrap();
            assert_eq!(
                &source.as_bytes()[target.start..target.end],
                name.as_bytes(),
                "{path}"
            );
        }
    }

    #[test]
    fn language_callees_follow_the_active_pack_policy() {
        for (enabled, path, source, call) in [
            (
                cfg!(feature = "experimental-javascript"),
                "main.js",
                "function f(x) { x.work(helper); }",
                "x.work(helper)",
            ),
            (
                cfg!(feature = "experimental-php"),
                "main.php",
                "<?php function f($x) { $x->work(helper); }",
                "$x->work(helper)",
            ),
            (
                crate::EXPERIMENTAL_SWIFT_ENABLED,
                "main.swift",
                "func f(x: A) { x.work(helper) }",
                "x.work(helper)",
            ),
        ] {
            let spans = call_target_spans(Path::new(path), source.as_bytes());
            if !enabled {
                assert!(spans.is_none(), "{path}");
                continue;
            }
            let start = source.find(call).unwrap();
            let target = spans
                .as_ref()
                .unwrap()
                .get(&Span {
                    start,
                    end: start + call.len(),
                })
                .unwrap();
            assert_eq!(&source[target.start..target.end], "work", "{path}");
        }
    }

    #[test]
    fn nested_calls_keep_independent_names_and_computed_callees_remain_unknown() {
        let source = "fn f(x: A) { make().work(helper()); }";
        let spans = call_target_spans(Path::new("main.rs"), source.as_bytes()).unwrap();
        assert_eq!(spans.len(), 3);
        for (call, target) in spans {
            let call = &source[call.start..call.end];
            let target = &source[target.start..target.end];
            assert_eq!(
                target,
                match call {
                    "make()" => "make",
                    "helper()" => "helper",
                    "make().work(helper())" => "work",
                    _ => panic!("unexpected call"),
                }
            );
        }
        assert!(
            call_target_spans(
                Path::new("main.ts"),
                b"function f(x: any) { x[helper](argument); }"
            )
            .unwrap()
            .is_empty()
        );
        assert!(call_target_spans(Path::new("main.rs"), b"fn f( { x.work(); }").is_none());
    }
}
