use crate::pack::{Edge, Extraction, LanguagePack, Provenance, RelationKind, Span, symbol, text};
use tree_sitter::{Language, Node};

pub(crate) static CSHARP_PACK: CSharp = CSharp;

pub(crate) struct CSharp;

impl LanguagePack for CSharp {
    fn id(&self) -> &'static str {
        "csharp"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["cs"]
    }

    fn language(&self) -> Language {
        tree_sitter_c_sharp::LANGUAGE.into()
    }

    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
        match node.kind() {
            "method_declaration" | "constructor_declaration" => {
                if let Some(name) = node.child_by_field_name("name") {
                    symbol(name, source, extraction);
                }
            }
            "invocation_expression" => {
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
            "using_directive" => {
                if let Some(name) = node.named_child(0) {
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
            "type_identifier" | "generic_name" => {
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
