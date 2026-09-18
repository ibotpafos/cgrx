//! Conservative PHP extraction. Only unique, unconditional same-file global
//! functions are eligible for direct call resolution. Namespaces, function
//! imports, conditional definitions and receiver dispatch remain explicit gaps.
use crate::UnresolvedKind;
use crate::pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, RepoPath, Span,
    normalize_extraction, symbol, text, unresolved, walk_with,
};
use std::collections::BTreeMap;
use tree_sitter::{Language, Node, Parser};

pub(crate) static PHP_PACK: Php = Php;
pub(crate) struct Php;

impl LanguagePack for Php {
    fn id(&self) -> &'static str {
        "php"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["php", "phtml", "php3", "php4", "php5", "phps"]
    }

    fn language(&self) -> Language {
        tree_sitter_php::LANGUAGE_PHP.into()
    }

    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
        let mut root = node;
        while let Some(parent) = root.parent() {
            root = parent;
        }
        classify(node, source, extraction, &FileFacts::collect(root, source));
    }

    fn extract(&self, path: &RepoPath, source: &[u8]) -> Result<Extraction, ExtractError> {
        if path.is_absolute() {
            return Err(ExtractError::AbsolutePath);
        }
        let mut parser = Parser::new();
        parser
            .set_language(&self.language())
            .map_err(|_| ExtractError::ParserLanguage)?;
        let tree = parser
            .parse(source, None)
            .ok_or(ExtractError::ParseFailed)?;
        let facts = FileFacts::collect(tree.root_node(), source);
        let mut extraction = Extraction::default();
        // Collect identity once per file, not once per visited syntax node.
        walk_with(
            tree.root_node(),
            source,
            &mut extraction,
            false,
            &mut |node, source, extraction| classify(node, source, extraction, &facts),
        );
        normalize_extraction(&mut extraction);
        Ok(extraction)
    }
}

#[derive(Default)]
struct FileFacts {
    functions: BTreeMap<String, Option<String>>,
    blocked: bool,
}

impl FileFacts {
    fn collect(root: Node<'_>, source: &[u8]) -> Self {
        let mut facts = Self {
            blocked: root.has_error(),
            ..Self::default()
        };
        facts.visit(root, source);
        facts
    }

    fn visit(&mut self, node: Node<'_>, source: &[u8]) {
        if node.kind() == "namespace_definition"
            || node
                .child_by_field_name("type")
                .is_some_and(|kind| text(kind, source).eq_ignore_ascii_case("function"))
        {
            self.blocked = true;
        }
        if node.kind() == "function_definition"
            && let Some(name) = node.child_by_field_name("name")
        {
            let spelling = text(name, source);
            let unconditional = node.parent().is_some_and(|p| p.kind() == "program");
            self.functions
                .entry(spelling.to_ascii_lowercase())
                .and_modify(|target| *target = None)
                .or_insert_with(|| unconditional.then_some(spelling));
        }
        for child in node.named_children(&mut node.walk()) {
            self.visit(child, source);
        }
    }
}

fn edge(relation: RelationKind, target: String, node: Node<'_>, extraction: &mut Extraction) {
    extraction.edges.push(Edge {
        relation,
        target,
        span: Span::from(node),
        context_span: Span::from(node),
        provenance: Provenance::Syntax,
    });
}

fn inside_named_body(node: Node<'_>) -> bool {
    let mut parent = node.parent();
    while let Some(owner) = parent {
        match owner.kind() {
            "anonymous_function" | "arrow_function" => return false,
            "function_definition" | "method_declaration" => {
                return owner.child_by_field_name("body").is_some_and(|body| {
                    body.start_byte() <= node.start_byte() && node.end_byte() <= body.end_byte()
                });
            }
            _ => parent = owner.parent(),
        }
    }
    false
}

fn classify(node: Node<'_>, source: &[u8], extraction: &mut Extraction, facts: &FileFacts) {
    match node.kind() {
        "function_definition"
        | "method_declaration"
        | "class_declaration"
        | "interface_declaration"
        | "trait_declaration"
        | "enum_declaration" => {
            symbol(node, source, extraction);
        }
        "function_call_expression" => {
            let function = node.child_by_field_name("function");
            let target = function
                .filter(|function| function.kind() == "name")
                .and_then(|function| {
                    facts
                        .functions
                        .get(&text(function, source).to_ascii_lowercase())
                })
                .and_then(Option::as_ref);
            // foo(...) is a first-class callable reference, not an invocation.
            let reference = node.child_by_field_name("arguments").is_some_and(|args| {
                args.named_children(&mut args.walk())
                    .any(|arg| text(arg, source).trim() == "...")
            });
            if !facts.blocked
                && !reference
                && inside_named_body(node)
                && let Some(target) = target
            {
                edge(RelationKind::Calls, target.clone(), node, extraction);
            } else {
                unresolved(UnresolvedKind::Dispatch, node, source, extraction);
            }
        }
        "member_call_expression"
        | "nullsafe_member_call_expression"
        | "scoped_call_expression"
        | "object_creation_expression" => {
            unresolved(UnresolvedKind::Dispatch, node, source, extraction);
        }
        "namespace_use_clause" => {
            // The grammar has no `name` field here. The first named child is
            // the imported name; the optional alias is a separate field.
            if let Some(name) = node.named_child(0) {
                let mut target = text(name, source);
                if let Some(group) = node.parent()
                    && group.kind() == "namespace_use_group"
                    && let Some(declaration) = group.parent()
                    && let Some(prefix) = declaration
                        .named_children(&mut declaration.walk())
                        .find(|child| child.kind() == "namespace_name")
                {
                    target = format!("{}\\{target}", text(prefix, source));
                }
                edge(RelationKind::Imports, target, node, extraction);
            }
        }
        "named_type" => {
            edge(
                RelationKind::References,
                text(node, source),
                node,
                extraction,
            );
        }
        _ => {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    const SOURCE: &str = "<?php\nuse Vendor\\Payload;\nfunction helper(Payload $value): Payload { return $value; }\nfunction caller(Payload $value): Payload { return helper($value); }\nfunction dynamic($receiver, $name, $value) { return $receiver->$name($value); }\n";

    fn extract(source: &str) -> Extraction {
        PHP_PACK
            .extract(Path::new("example.php"), source.as_bytes())
            .unwrap()
    }

    #[test]
    fn php_all_extensions_extract_exact_symbols_relations_and_dispatch_gaps() {
        for extension in PHP_PACK.extensions() {
            let path = format!("example.{extension}");
            let result = PHP_PACK
                .extract(Path::new(&path), SOURCE.as_bytes())
                .unwrap();
            assert!(result.parser_error_ranges.is_empty(), "{path}: {result:?}");
            for name in ["helper", "caller", "dynamic"] {
                let symbol = result.symbols.iter().find(|s| s.name == name).unwrap();
                assert_eq!(&SOURCE[symbol.span.start..symbol.span.end], name);
                assert!(
                    SOURCE[symbol.search_span.start..symbol.search_span.end]
                        .starts_with("function ")
                );
            }
            for (relation, target, snippet) in [
                (RelationKind::Calls, "helper", "helper($value)"),
                (RelationKind::Imports, "Vendor\\Payload", "Vendor\\Payload"),
                (RelationKind::References, "Payload", "Payload"),
            ] {
                assert!(
                    result.edges.iter().any(|edge| edge.relation == relation
                        && edge.target == target
                        && &SOURCE[edge.span.start..edge.span.end] == snippet),
                    "{path}: {result:?}"
                );
            }
            assert_eq!(
                result
                    .edges
                    .iter()
                    .filter(|e| e.relation == RelationKind::Calls)
                    .count(),
                1
            );
            assert!(
                result
                    .unresolved
                    .iter()
                    .any(|u| u.kind == UnresolvedKind::Dispatch
                        && &SOURCE[u.span.start..u.span.end] == "$receiver->$name($value)")
            );
            assert_eq!(result, extract(SOURCE));
        }
    }

    #[test]
    fn php_dynamic_receiver_variable_static_and_callable_references_are_not_calls() {
        for body in [
            "$helper();",
            "$receiver->helper();",
            "$receiver?->helper();",
            "Service::helper();",
            "helper(...);",
            "(fn() => helper())();",
        ] {
            let source = format!(
                "<?php function helper() {{}} function caller($helper, $receiver) {{ {body} }}"
            );
            let result = extract(&source);
            assert!(result.parser_error_ranges.is_empty(), "{body}: {result:?}");
            assert!(!result.unresolved.is_empty(), "{body}: {result:?}");
            assert!(
                !result
                    .edges
                    .iter()
                    .any(|e| e.relation == RelationKind::Calls),
                "{body}: {result:?}"
            );
        }
    }

    #[test]
    fn php_ambiguous_conditional_namespaced_imported_and_missing_targets_abstain() {
        for source in [
            "<?php function helper() {} function HELPER() {} function caller() { helper(); }",
            "<?php if ($enabled) { function helper() {} } function caller() { helper(); }",
            "<?php function outer() { function helper() {} } function caller() { helper(); }",
            "<?php namespace Example; function helper() {} function caller() { helper(); }",
            "<?php use function Vendor\\helper; function caller() { helper(); }",
            "<?php use function Vendor\\{helper}; function caller() { helper(); }",
            "<?php class Service { function helper() {} } function caller() { helper(); }",
            "<?php function caller() { missing(); }",
        ] {
            let result = extract(source);
            assert!(
                result.parser_error_ranges.is_empty(),
                "{source}: {result:?}"
            );
            assert!(!result.unresolved.is_empty(), "{source}: {result:?}");
            assert!(
                !result
                    .edges
                    .iter()
                    .any(|e| e.relation == RelationKind::Calls),
                "{source}: {result:?}"
            );
        }
    }

    #[test]
    fn php_function_names_are_ascii_case_insensitive_but_spans_keep_original_bytes() {
        let source = "<?php function Helper() {} function caller() { HELPER(); }";
        let result = extract(source);
        let call = result
            .edges
            .iter()
            .find(|e| e.relation == RelationKind::Calls)
            .unwrap();
        assert_eq!(call.target, "Helper");
        assert_eq!(&source[call.span.start..call.span.end], "HELPER()");
    }

    #[test]
    fn php_group_imports_keep_each_binding_and_do_not_use_alias_as_target() {
        let result = extract(
            "<?php use Vendor\\{Payload as Item, Other}; function caller(Item $item): Other {}",
        );
        let imports: Vec<_> = result
            .edges
            .iter()
            .filter(|e| e.relation == RelationKind::Imports)
            .map(|e| e.target.as_str())
            .collect();
        assert_eq!(imports, vec!["Vendor\\Other", "Vendor\\Payload"]);
    }

    #[test]
    fn php_parser_errors_and_absolute_paths_fail_closed() {
        let result =
            extract("<?php function helper() {} function caller() { helper(); } function broken(");
        assert!(!result.parser_error_ranges.is_empty());
        assert!(
            !result
                .edges
                .iter()
                .any(|e| e.relation == RelationKind::Calls)
        );
        assert_eq!(
            PHP_PACK.extract(Path::new("/example.php"), b""),
            Err(ExtractError::AbsolutePath)
        );
    }
}
