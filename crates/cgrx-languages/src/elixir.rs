use crate::pack::{Edge, Extraction, LanguagePack, Provenance, RelationKind, Span, text};
use tree_sitter::{Language, Node};

pub(crate) static ELIXIR_PACK: Elixir = Elixir;

pub(crate) struct Elixir;

impl LanguagePack for Elixir {
    fn id(&self) -> &'static str {
        "elixir"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["ex", "exs"]
    }

    fn language(&self) -> Language {
        tree_sitter_elixir::LANGUAGE.into()
    }

    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
        match node.kind() {
            "call" => {
                if let Some(function) = node.child_by_field_name("function") {
                    let target_name = text(function, source);
                    if !target_name.is_empty() {
                        let edge = Edge {
                            relation: RelationKind::Calls,
                            target: target_name.clone(),
                            span: Span::from(node),
                            context_span: Span::from(node),
                            provenance: Provenance::Syntax,
                        };
                        extraction.edges.push(edge);
                        if (target_name == "require"
                            || target_name == "import"
                            || target_name == "use"
                            || target_name == "alias")
                            && let Some(arg) = node.child_by_field_name("arguments")
                                && let Some(module) = arg.named_child(0) {
                                    let import_text = text(module, source);
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
            "module" | "alias" => {
                let type_name = text(node, source);
                if !type_name.is_empty()
                    && type_name.chars().next().is_some_and(|c| c.is_uppercase())
                {
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
