use crate::pack::{
    Edge, Extraction, LanguagePack, Provenance, RelationKind, Span, symbol, text,
};
use tree_sitter::{Language, Node};

pub(crate) static SCALA_PACK: Scala = Scala;

pub(crate) struct Scala;

impl LanguagePack for Scala {
    fn id(&self) -> &'static str {
        "scala"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["scala", "sc"]
    }

    fn language(&self) -> Language {
        tree_sitter_scala::LANGUAGE.into()
    }

    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
        match node.kind() {
            "function_definition" | "val_definition" | "var_definition" => {
                if let Some(name) = node.child_by_field_name("name") {
                    symbol(name, source, extraction);
                }
            }
            "call_expression" => {
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
            "type_identifier" | "stable_type_identifier" => {
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
