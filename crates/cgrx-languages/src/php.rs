use crate::pack::{Edge, Extraction, LanguagePack, Provenance, RelationKind, Span, symbol, text};
use tree_sitter::{Language, Node};

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
        match node.kind() {
            "function_definition" | "method_declaration" => {
                if let Some(name) = node.child_by_field_name("name") {
                    symbol(name, source, extraction);
                }
            }
            "function_call_expression"
            | "member_call_expression"
            | "nullsafe_member_call_expression" => {
                if let Some(function) = node.child_by_field_name("function") {
                    let target_name = text(function, source);
                    if !target_name.is_empty() {
                        let edge = Edge {
                            relation: RelationKind::Calls,
                            target: target_name,
                            span: Span::from(node),
                            context_span: Span::from(node),
                            provenance: Provenance::Syntax,
                        };
                        extraction.edges.push(edge);
                    }
                }
            }
            "namespace_use_declaration" => {
                for child in node.named_children(&mut node.walk()) {
                    if child.kind() == "namespace_use_clause" {
                        if let Some(name) = child.child_by_field_name("name") {
                            let import_text = text(name, source);
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
                }
            }
            "named_type" | "qualified_name" => {
                let type_name = text(node, source);
                if !type_name.is_empty() {
                    let edge = Edge {
                        relation: RelationKind::References,
                        target: type_name,
                        span: Span::from(node),
                        context_span: Span::from(node),
                        provenance: Provenance::Syntax,
                    };
                    extraction.edges.push(edge);
                }
            }
            _ => {}
        }
    }
}
