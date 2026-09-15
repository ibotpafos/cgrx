use crate::pack::{
    Edge, Extraction, LanguagePack, Provenance, RelationKind, Span, symbol, text,
};
use std::collections::BTreeSet;
use tree_sitter::{Language, Node};

pub(crate) static CPP_PACK: Cpp = Cpp;

pub(crate) struct Cpp;

impl LanguagePack for Cpp {
    fn id(&self) -> &'static str {
        "cpp"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["cpp", "cxx", "cc", "hpp", "hxx", "hh"]
    }

    fn language(&self) -> Language {
        tree_sitter_cpp::LANGUAGE.into()
    }

    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
        let context = CppContext::collect(node, source);
        classify(node, source, extraction, &context);
    }
}

struct CppContext {
    namespaces: BTreeSet<String>,
    classes: BTreeSet<String>,
}

impl CppContext {
    fn collect(root: Node, source: &[u8]) -> Self {
        let mut namespaces = BTreeSet::new();
        let mut classes = BTreeSet::new();
        let mut cursor = root.walk();
        for child in root.children(&mut cursor) {
            match child.kind() {
                "namespace_definition" => {
                    if let Some(name) = child.child_by_field_name("name") {
                        namespaces.insert(text(name, source));
                    }
                }
                "class_specifier" | "struct_specifier" => {
                    if let Some(name) = child.child_by_field_name("name") {
                        classes.insert(text(name, source));
                    }
                }
                _ => {}
            }
        }
        CppContext { namespaces, classes }
    }
}

fn classify(node: Node, source: &[u8], extraction: &mut Extraction, context: &CppContext) {
    match node.kind() {
        "function_definition" | "declaration" => {
            if let Some(name) = node.child_by_field_name("declarator") {
                if let Some(inner) = name.child_by_field_name("declarator") {
                    symbol(inner, source, extraction);
                }
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
        "preproc_include" => {
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
        "type_identifier" | "scoped_type_identifier" => {
            let type_name = text(node, source);
            if !type_name.is_empty() && (context.classes.contains(&type_name) || context.namespaces.iter().any(|ns| type_name.starts_with(ns))) {
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
