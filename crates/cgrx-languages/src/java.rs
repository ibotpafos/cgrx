use crate::pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, Span, UnresolvedKind,
    evidence_span, normalize_extraction, symbol, text, unresolved, walk_with,
};
use std::collections::{BTreeMap, BTreeSet};
use tree_sitter::{Language, Node, Parser};

pub(crate) static JAVA: Java = Java;

pub(crate) struct Java;

impl LanguagePack for Java {
    fn id(&self) -> &'static str {
        "java"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["java"]
    }

    fn language(&self) -> Language {
        tree_sitter_java::LANGUAGE.into()
    }

    fn extract(&self, path: &std::path::Path, source: &[u8]) -> Result<Extraction, ExtractError> {
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
        let facts = JavaFacts::collect(tree.root_node(), source);
        let mut extraction = Extraction::default();
        walk_with(
            tree.root_node(),
            source,
            &mut extraction,
            false,
            &mut |node, source, extraction| {
                classify(node, source, extraction, &facts);
            },
        );
        normalize_extraction(&mut extraction);
        Ok(extraction)
    }

    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
        classify(node, source, extraction, &JavaFacts::default());
    }
}

#[derive(Default)]
struct JavaFacts {
    methods: BTreeMap<String, usize>,
    imported_types: BTreeMap<String, Vec<String>>,
    local_types: BTreeSet<String>,
    static_imports: BTreeSet<String>,
}

impl JavaFacts {
    fn collect(root: Node<'_>, source: &[u8]) -> Self {
        let mut facts = Self::default();
        visit(root, &mut |node| {
            if matches!(
                node.kind(),
                "class_declaration"
                    | "interface_declaration"
                    | "enum_declaration"
                    | "record_declaration"
            ) && let Some(name) = node.child_by_field_name("name")
            {
                facts.local_types.insert(text(name, source));
            }
            if node.kind() == "method_declaration"
                && let Some(name) = node.child_by_field_name("name")
            {
                *facts.methods.entry(text(name, source)).or_default() += 1;
            }
            if node.kind() == "import_declaration" {
                let value = text(node, source);
                if value.trim_start().starts_with("import static ")
                    && !value.contains('*')
                    && let Some(name) = value
                        .trim_end_matches([';', ' ', '\n', '\r'])
                        .rsplit('.')
                        .next()
                {
                    facts.static_imports.insert(name.to_owned());
                }
                if !value.trim_start().starts_with("import static ") && !value.contains('*') {
                    let qualified = value
                        .trim()
                        .strip_prefix("import ")
                        .unwrap_or_default()
                        .trim_end_matches(';')
                        .trim()
                        .to_owned();
                    if let Some(name) = qualified.rsplit('.').next().filter(|name| !name.is_empty())
                    {
                        facts
                            .imported_types
                            .entry(name.to_owned())
                            .or_default()
                            .push(qualified);
                    }
                }
            }
        });
        facts
    }
}

fn classify(node: Node<'_>, source: &[u8], extraction: &mut Extraction, facts: &JavaFacts) {
    match node.kind() {
        "class_declaration"
        | "interface_declaration"
        | "enum_declaration"
        | "record_declaration"
        | "method_declaration"
        | "constructor_declaration" => {
            symbol(node, source, extraction);
        }
        "import_declaration" => extraction.edges.push(Edge {
            relation: RelationKind::Imports,
            target: text(node, source),
            span: Span::from(node),
            context_span: Span::from(node),
            provenance: Provenance::Syntax,
        }),
        "type_identifier" if !has_ancestor(node, "import_declaration") => {
            let name = text(node, source);
            if !facts.local_types.contains(&name)
                && let Some(targets) = facts.imported_types.get(&name)
                && let [target] = targets.as_slice()
            {
                extraction.edges.push(Edge {
                    relation: RelationKind::References,
                    target: target.clone(),
                    span: Span::from(node),
                    context_span: evidence_span(
                        node,
                        &[
                            "field_declaration",
                            "formal_parameter",
                            "local_variable_declaration",
                            "method_declaration",
                        ],
                    ),
                    provenance: Provenance::Syntax,
                });
            }
        }
        "method_invocation" => {
            let Some(name) = node.child_by_field_name("name") else {
                return;
            };
            let target = text(name, source);
            let direct = node.child_by_field_name("object").is_none()
                && facts.methods.get(&target) == Some(&1)
                && !facts.static_imports.contains(&target)
                && enclosing_concrete_class_without_inheritance(node);
            if direct {
                extraction.edges.push(Edge {
                    relation: RelationKind::Calls,
                    target,
                    span: Span::from(node),
                    context_span: evidence_span(
                        node,
                        &[
                            "expression_statement",
                            "return_statement",
                            "local_variable_declaration",
                        ],
                    ),
                    provenance: Provenance::Syntax,
                });
            } else {
                unresolved(UnresolvedKind::Dispatch, node, source, extraction);
            }
        }
        "object_creation_expression" | "explicit_constructor_invocation" => {
            unresolved(UnresolvedKind::Dispatch, node, source, extraction);
        }
        _ => {}
    }
}

fn enclosing_concrete_class_without_inheritance(mut node: Node<'_>) -> bool {
    while let Some(parent) = node.parent() {
        if parent.kind() == "class_declaration" {
            return parent.child_by_field_name("superclass").is_none()
                && parent.child_by_field_name("interfaces").is_none();
        }
        if matches!(
            parent.kind(),
            "interface_declaration" | "enum_declaration" | "record_declaration"
        ) {
            return false;
        }
        node = parent;
    }
    false
}

fn has_ancestor(mut node: Node<'_>, kind: &str) -> bool {
    while let Some(parent) = node.parent() {
        if parent.kind() == kind {
            return true;
        }
        node = parent;
    }
    false
}

fn visit(node: Node<'_>, apply: &mut impl FnMut(Node<'_>)) {
    apply(node);
    let mut cursor = node.walk();
    for child in node.named_children(&mut cursor) {
        visit(child, apply);
    }
}
