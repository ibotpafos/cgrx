//! Lexical callee ranges for binding an external semantic reference to a call.
//! These ranges identify syntax only; they do not resolve the called symbol.

use std::collections::BTreeMap;
use std::path::Path;

use tree_sitter::{Node, Parser};

use crate::{Span, pack_for_path};

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
    let mut targets = BTreeMap::new();
    let mut pending = vec![tree.root_node()];
    while let Some(node) = pending.pop() {
        let function = match node.kind() {
            "call_expression" | "call" | "invocation_expression" | "function_call_expression" => {
                node.child_by_field_name("function").or_else(|| {
                    matches!(pack.id(), "kotlin" | "swift")
                        .then(|| node.named_child(0))
                        .flatten()
                })
            }
            "method_invocation"
            | "member_call_expression"
            | "nullsafe_member_call_expression"
            | "scoped_call_expression" => node.child_by_field_name("name"),
            _ => None,
        };
        if let Some(target) = function.and_then(named_target) {
            targets.insert(Span::from(node), Span::from(target));
        }
        let mut cursor = node.walk();
        pending.extend(node.named_children(&mut cursor));
    }
    Some(targets)
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
    fn opt_in_language_callees_follow_the_active_pack_policy() {
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
                cfg!(feature = "experimental-swift"),
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
