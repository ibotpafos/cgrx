use crate::pack::{
    Edge, Extraction, LanguagePack, Provenance, RelationKind, Span, UnresolvedKind, evidence_span,
    has_ancestor, symbol, text, unresolved,
};
use tree_sitter::{Language, Node};

pub(crate) static PYTHON: Python = Python;

pub(crate) struct Python;

impl LanguagePack for Python {
    fn id(&self) -> &'static str {
        "python"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["py"]
    }

    fn language(&self) -> Language {
        tree_sitter_python::LANGUAGE.into()
    }

    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
        match node.kind() {
            "function_definition" | "class_definition" => symbol(node, source, extraction),
            "import_statement" | "import_from_statement" => extraction.edges.push(Edge {
                relation: RelationKind::Imports,
                target: text(node, source),
                span: Span::from(node),
                context_span: Span::from(node),
                provenance: Provenance::Syntax,
            }),
            "call" => {
                if has_ancestor(node, "decorator") {
                    return;
                }
                let Some(function) = node.child_by_field_name("function") else {
                    return;
                };
                if function.kind() == "identifier" {
                    extraction.edges.push(Edge {
                        relation: RelationKind::Calls,
                        target: text(function, source),
                        span: Span::from(node),
                        context_span: evidence_span(
                            node,
                            &["assignment", "expression_statement", "return_statement"],
                        ),
                        provenance: Provenance::Syntax,
                    });
                } else {
                    unresolved(UnresolvedKind::DynamicProperty, node, source, extraction);
                    unresolved(UnresolvedKind::Dispatch, node, source, extraction);
                }
            }
            "decorator" => unresolved(UnresolvedKind::Decorator, node, source, extraction),
            _ => {}
        }
    }
}
