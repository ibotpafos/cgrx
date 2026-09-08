use crate::pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, Span, UnresolvedKind,
    evidence_span, has_ancestor, normalize_extraction, symbol, text, unresolved, walk_with,
};
use std::collections::{BTreeMap, BTreeSet};
use tree_sitter::{Language, Node, Parser};

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
        let references = python_reference_imports(tree.root_node(), source);
        let mut extraction = Extraction::default();
        walk_with(
            tree.root_node(),
            source,
            &mut extraction,
            false,
            &mut |node, source, extraction| {
                if node.kind() == "attribute"
                    && !direct_call_function(node)
                    && let Some(object) = node
                        .child_by_field_name("object")
                        .filter(|object| object.kind() == "identifier")
                    && let Some(module) = references.get(&text(object, source))
                {
                    extraction.edges.push(Edge {
                        relation: RelationKind::References,
                        target: module.clone(),
                        span: Span::from(node),
                        context_span: evidence_span(
                            node,
                            &["typed_parameter", "function_definition", "assignment"],
                        ),
                        provenance: Provenance::Syntax,
                    });
                }
                self.classify(node, source, extraction);
            },
        );
        normalize_extraction(&mut extraction);
        Ok(extraction)
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
                    // Try to resolve ClassName() as a constructor call
                    // Emit constructor edge for Python
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

fn python_reference_imports(root: Node<'_>, source: &[u8]) -> BTreeMap<String, String> {
    let mut imports = BTreeMap::<String, Vec<String>>::new();
    let mut cursor = root.walk();
    for statement in root.named_children(&mut cursor) {
        if statement.kind() != "import_statement" {
            continue;
        }
        let mut child_cursor = statement.walk();
        for import in statement.named_children(&mut child_cursor) {
            let (module_node, alias_node) = if import.kind() == "aliased_import" {
                (
                    import.child_by_field_name("name"),
                    import.child_by_field_name("alias"),
                )
            } else {
                (Some(import), None)
            };
            let Some(module_node) = module_node else {
                continue;
            };
            let module = text(module_node, source);
            let alias = alias_node
                .map(|node| text(node, source))
                .unwrap_or_else(|| module.split('.').next().unwrap_or(&module).to_owned());
            imports.entry(alias).or_default().push(module);
        }
    }

    let mut shadows = BTreeSet::new();
    visit(root, &mut |node| {
        if matches!(
            node.kind(),
            "assignment" | "named_expression" | "for_statement"
        ) && let Some(target) = node
            .child_by_field_name("left")
            .or_else(|| node.child_by_field_name("target"))
        {
            collect_binding_names(target, source, &mut shadows);
        }
        if matches!(
            node.kind(),
            "typed_parameter" | "default_parameter" | "typed_default_parameter"
        ) && let Some(name) = node.named_child(0)
        {
            collect_binding_names(name, source, &mut shadows);
        }
    });

    imports
        .into_iter()
        .filter_map(|(alias, modules)| {
            (!shadows.contains(&alias) && modules.len() == 1)
                .then(|| (alias, modules.into_iter().next().unwrap()))
        })
        .collect()
}

fn collect_binding_names(node: Node<'_>, source: &[u8], names: &mut BTreeSet<String>) {
    if node.kind() == "identifier" {
        names.insert(text(node, source));
        return;
    }
    if matches!(
        node.kind(),
        "list" | "tuple" | "list_pattern" | "tuple_pattern"
    ) {
        let mut cursor = node.walk();
        for child in node.named_children(&mut cursor) {
            collect_binding_names(child, source, names);
        }
    }
}

fn direct_call_function(node: Node<'_>) -> bool {
    node.parent().is_some_and(|parent| {
        parent.kind() == "call"
            && parent
                .child_by_field_name("function")
                .is_some_and(|function| function.id() == node.id())
    })
}

fn visit(node: Node<'_>, apply: &mut impl FnMut(Node<'_>)) {
    apply(node);
    let mut cursor = node.walk();
    for child in node.named_children(&mut cursor) {
        visit(child, apply);
    }
}
