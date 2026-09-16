use crate::pack::{Edge, Extraction, LanguagePack, Provenance, RelationKind, Span, symbol, text};
use tree_sitter::{Language, Node};

pub(crate) static RUBY_PACK: Ruby = Ruby;

pub(crate) struct Ruby;

impl LanguagePack for Ruby {
    fn id(&self) -> &'static str {
        "ruby"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["rb", "rake", "gemspec"]
    }

    fn language(&self) -> Language {
        tree_sitter_ruby::LANGUAGE.into()
    }

    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
        match node.kind() {
            "method" | "singleton_method" => {
                if let Some(name) = node.child_by_field_name("name") {
                    symbol(name, source, extraction);
                }
            }
            "call" => {
                if let Some(method) = node.child_by_field_name("method") {
                    let target_name = text(method, source);
                    if !target_name.is_empty() {
                        let edge = Edge {
                            relation: RelationKind::Calls,
                            target: target_name.clone(),
                            span: Span::from(node),
                            context_span: Span::from(node),
                            provenance: Provenance::Syntax,
                        };
                        extraction.edges.push(edge);
                        if target_name == "require" || target_name == "require_relative" {
                            if let Some(arg) = node.child_by_field_name("arguments") {
                                if let Some(string) = arg.named_child(0) {
                                    let import_text = text(string, source);
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
                }
            }
            "constant" => {
                let type_name = text(node, source);
                if !type_name.is_empty()
                    && type_name.chars().next().map_or(false, |c| c.is_uppercase())
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
