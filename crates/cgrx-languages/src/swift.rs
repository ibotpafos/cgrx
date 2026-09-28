use crate::pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, Span, Unresolved,
    UnresolvedKind, normalize_extraction, symbol, text, unresolved, walk_with,
};
use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;
use tree_sitter::{Language, Node, Parser};

pub(crate) static SWIFT_PACK: Swift = Swift;

pub(crate) struct Swift;

impl LanguagePack for Swift {
    fn id(&self) -> &'static str {
        "swift"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["swift"]
    }

    fn language(&self) -> Language {
        tree_sitter_swift::LANGUAGE.into()
    }

    fn extract(&self, path: &Path, source: &[u8]) -> Result<Extraction, ExtractError> {
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
        let root = tree.root_node();
        let mut extraction = Extraction::default();
        walk_with(
            root,
            source,
            &mut extraction,
            false,
            &mut |node, source, out| self.classify(node, source, out),
        );

        // Swift overloads, local bindings, imports, and member dispatch cannot be
        // proved by name matching. The opt-in slice proves only an
        // unshadowed, zero-argument call between unique top-level free functions.
        let mut declarations = BTreeMap::<String, Vec<Span>>::new();
        let mut eligible = BTreeSet::<Span>::new();
        let mut simple_file =
            extraction.parser_error_ranges.is_empty() && !has_shadowing_declaration(root);
        let mut cursor = root.walk();
        for node in root.named_children(&mut cursor) {
            if node.kind() == "comment" {
                continue;
            }
            if node.kind() != "function_declaration" {
                simple_file = false;
                continue;
            }
            let Some(name) = node.child_by_field_name("name") else {
                simple_file = false;
                continue;
            };
            let name_text = text(name, source);
            declarations
                .entry(name_text.clone())
                .or_default()
                .push(Span::from(name));
            let mut children = node.walk();
            if let Some(body) = node
                .named_children(&mut children)
                .find(|child| child.kind() == "function_body")
            {
                let signature = source
                    .get(node.start_byte()..body.start_byte())
                    .unwrap_or_default();
                if signature.trim_ascii_end() == format!("func {name_text}()").as_bytes() {
                    eligible.insert(Span::from(name));
                }
            }
        }
        if simple_file {
            let mut calls = BTreeSet::new();
            collect_direct_statement_calls(root, &mut calls);
            let functions: Vec<_> = extraction
                .symbols
                .iter()
                .filter(|symbol| eligible.contains(&symbol.span))
                .cloned()
                .collect();
            extraction.swift_free_functions = functions.iter().map(|f| f.span).collect();
            for edge in &mut extraction.edges {
                if edge.relation != RelationKind::Calls || !calls.contains(&edge.span) {
                    continue;
                }
                let Some([target]) = declarations.get(&edge.target).map(Vec::as_slice) else {
                    continue;
                };
                if !eligible.contains(target)
                    || source.get(edge.span.start..edge.span.end)
                        != Some(format!("{}()", edge.target).as_bytes())
                {
                    continue;
                }
                let mut callers = functions.iter().filter(|function| {
                    function.search_span.start <= edge.span.start
                        && edge.span.end <= function.search_span.end
                });
                let Some(caller) = callers.next() else {
                    continue;
                };
                if callers.next().is_none() {
                    edge.provenance = Provenance::SwiftDirect {
                        caller: caller.span,
                        target: *target,
                    };
                }
            }
        }
        let mut rejected = Vec::new();
        extraction.edges.retain(|edge| {
            if edge.relation != RelationKind::Calls
                || matches!(edge.provenance, Provenance::SwiftDirect { .. })
            {
                return true;
            }
            rejected.push(Unresolved {
                kind: UnresolvedKind::Dispatch,
                span: edge.span,
                text: String::from_utf8_lossy(&source[edge.span.start..edge.span.end]).into_owned(),
            });
            false
        });
        extraction.unresolved.extend(rejected);
        normalize_extraction(&mut extraction);
        Ok(extraction)
    }

    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
        match node.kind() {
            "function_declaration" | "class_declaration" | "protocol_declaration" => {
                symbol(node, source, extraction);
            }
            "call_expression" => {
                if let Some(function) = node.named_child(0) {
                    if function.kind() == "simple_identifier" {
                        let target_name = text(function, source);
                        let edge = Edge {
                            relation: RelationKind::Calls,
                            target: target_name,
                            span: Span::from(node),
                            context_span: Span::from(node),
                            provenance: Provenance::Syntax,
                        };
                        extraction.edges.push(edge);
                    } else {
                        unresolved(UnresolvedKind::Dispatch, node, source, extraction);
                    }
                }
            }
            "import_declaration" => {
                if let Some(path) = node.named_child(0) {
                    let import_text = text(path, source);
                    if !import_text.is_empty() {
                        let edge = Edge {
                            relation: RelationKind::Imports,
                            target: import_text,
                            span: Span::from(node),
                            context_span: Span::from(node),
                            provenance: Provenance::Syntax,
                        };
                        extraction.edges.push(edge);
                    }
                }
            }
            "type_identifier" => {
                if node
                    .parent()
                    .is_some_and(|parent| parent.kind() == "user_type")
                {
                    unresolved(UnresolvedKind::Dispatch, node, source, extraction);
                }
            }
            _ => {}
        }
    }
}

fn collect_direct_statement_calls(node: Node<'_>, calls: &mut BTreeSet<Span>) {
    if node.kind() == "call_expression"
        && node.parent().is_some_and(|parent| {
            parent.kind() == "statements"
                && parent.parent().is_some_and(|body| {
                    body.kind() == "function_body"
                        && body.parent().is_some_and(|function| {
                            function.kind() == "function_declaration"
                                && function
                                    .parent()
                                    .is_some_and(|root| root.kind() == "source_file")
                        })
                })
        })
    {
        calls.insert(Span::from(node));
    }
    let mut cursor = node.walk();
    for child in node.named_children(&mut cursor) {
        collect_direct_statement_calls(child, calls);
    }
}

fn has_shadowing_declaration(node: Node<'_>) -> bool {
    if matches!(
        node.kind(),
        "property_declaration" | "closure_expression" | "for_statement"
    ) || (node.kind() == "function_declaration"
        && node
            .parent()
            .is_none_or(|parent| parent.kind() != "source_file"))
    {
        return true;
    }
    let mut cursor = node.walk();
    node.named_children(&mut cursor)
        .any(has_shadowing_declaration)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn swift_baseline_regression() {
        let source = b"func target() {}\nfunc caller() { target() }\n";
        let extracted = SWIFT_PACK.extract(Path::new("main.swift"), source).unwrap();
        assert!(
            extracted
                .symbols
                .iter()
                .any(|symbol| symbol.name == "target")
        );
        assert!(
            extracted
                .edges
                .iter()
                .any(|edge| { edge.relation == RelationKind::Calls && edge.target == "target" })
        );
    }

    #[test]
    fn swift_extraction_distinguishes_direct_calls_from_dispatch() {
        let source = b"import Foundation\nfunc target() {}\nfunc caller() { target(); other.target() }\nstruct Thing { func method() { target() } }\nlet value: Thing = Thing()\n";
        let extracted = SWIFT_PACK.extract(Path::new("main.swift"), source).unwrap();
        assert!(extracted.symbols.iter().any(|s| s.name == "target"));
        assert!(extracted.symbols.iter().any(|s| s.name == "Thing"));
        assert!(
            extracted
                .edges
                .iter()
                .any(|e| e.relation == RelationKind::Imports && e.target == "Foundation")
        );
        assert!(
            extracted
                .edges
                .iter()
                .all(|e| e.relation != RelationKind::Calls)
        );
        assert!(
            extracted
                .unresolved
                .iter()
                .any(|u| u.text == "other.target()")
        );
        assert!(extracted.unresolved.iter().any(|u| u.text == "target()"));
    }

    #[test]
    fn swift_direct_call_requires_unique_unshadowed_top_level_functions() {
        let source = b"func target() {}\nfunc caller() { target() }\n";
        let extracted = SWIFT_PACK.extract(Path::new("main.swift"), source).unwrap();
        let calls: Vec<_> = extracted
            .edges
            .iter()
            .filter(|edge| edge.relation == RelationKind::Calls)
            .collect();
        let [edge] = calls.as_slice() else {
            panic!("one proven call")
        };
        assert_eq!(edge.target, "target");
        assert!(matches!(edge.provenance, Provenance::SwiftDirect { .. }));
        assert_eq!(extracted.swift_free_functions.len(), 2);

        for source in [
            b"func target() {}\nfunc target() {}\nfunc caller() { target() }\n".as_slice(),
            b"func target() {}\nfunc caller() { let target = { }; target() }\n".as_slice(),
            b"import Foundation\nfunc target() {}\nfunc caller() { target() }\n".as_slice(),
            b"func target(_ x: Int) {}\nfunc caller() { target() }\n".as_slice(),
        ] {
            let extracted = SWIFT_PACK.extract(Path::new("main.swift"), source).unwrap();
            assert!(
                !extracted
                    .edges
                    .iter()
                    .any(|edge| edge.relation == RelationKind::Calls),
                "{}",
                String::from_utf8_lossy(source)
            );
            assert!(
                extracted
                    .unresolved
                    .iter()
                    .any(|gap| gap.text == "target()")
            );
        }
    }
}
