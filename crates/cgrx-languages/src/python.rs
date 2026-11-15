use crate::pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, Span, UnresolvedKind,
    evidence_span, has_ancestor, normalize_extraction, symbol, text, unresolved, walk_with,
};
use serde::{Deserialize, Serialize};
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
        let mut call_shadows = BTreeMap::new();
        let mut extraction = Extraction {
            python_file: Some(PythonFileFacts::from_tree(tree.root_node(), source)),
            ..Extraction::default()
        };
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
                if node.kind() == "call"
                    && !has_ancestor(node, "decorator")
                    && bare_call_is_shadowed(node, source, &mut call_shadows)
                {
                    unresolved(UnresolvedKind::Dispatch, node, source, extraction);
                } else {
                    self.classify(node, source, extraction);
                }
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
                    // Unqualified same-file call: resolved by name at runtime
                    // with package scoping; class constructors stay a gap
                    // until a Python proof chain lands.
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

fn bare_call_is_shadowed(
    call: Node<'_>,
    source: &[u8],
    cache: &mut BTreeMap<usize, BTreeSet<String>>,
) -> bool {
    let Some(function) = call
        .child_by_field_name("function")
        .filter(|node| node.kind() == "identifier")
    else {
        return false;
    };
    let name = text(function, source);
    let mut parent = call.parent();
    while let Some(scope) = parent {
        if matches!(scope.kind(), "function_definition" | "lambda")
            && scope.child_by_field_name("body").is_some_and(|body| {
                body.start_byte() <= call.start_byte() && call.end_byte() <= body.end_byte()
            })
        {
            let shadows = cache.entry(scope.id()).or_insert_with(|| {
                let mut names = BTreeSet::new();
                if let Some(parameters) = scope.child_by_field_name("parameters") {
                    let mut cursor = parameters.walk();
                    for parameter in parameters.named_children(&mut cursor) {
                        let binding = parameter
                            .child_by_field_name("name")
                            .or_else(|| {
                                matches!(
                                    parameter.kind(),
                                    "typed_parameter"
                                        | "list_splat_pattern"
                                        | "dictionary_splat_pattern"
                                )
                                .then(|| parameter.named_child(0))
                                .flatten()
                            })
                            .unwrap_or(parameter);
                        collect_binding_names(binding, source, &mut names);
                    }
                }
                if let Some(body) = scope.child_by_field_name("body") {
                    let mut bindings = BTreeMap::new();
                    module_bindings(body, source, &mut bindings);
                    // A unique direct local function declaration can still bind
                    // a callable. Parameters and other local writes cannot.
                    let mut cursor = body.walk();
                    let functions: BTreeSet<_> = body
                        .named_children(&mut cursor)
                        .filter(|node| node.kind() == "function_definition")
                        .filter_map(|node| node.child_by_field_name("name"))
                        .map(|node| text(node, source))
                        .collect();
                    names.extend(bindings.into_iter().filter_map(|(name, count)| {
                        (count != 1 || !functions.contains(&name)).then_some(name)
                    }));
                }
                names
            });
            if shadows.contains(&name) || shadows.contains("*") {
                return true;
            }
        }
        parent = scope.parent();
    }
    false
}

/// Source declarations and explicit relative import clauses. These facts do
/// not model execution, import hooks, namespace packages, or re-exports.
#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct PythonFileFacts {
    pub valid: bool,
    pub imports: Vec<PythonImportBinding>,
    pub exports: BTreeMap<String, [usize; 2]>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct PythonImportBinding {
    pub module: String,
    pub imported: String,
    pub local: String,
    pub span: [usize; 2],
}

impl PythonFileFacts {
    fn from_tree(root: Node<'_>, source: &[u8]) -> Self {
        let mut facts = Self {
            valid: !root.has_error(),
            ..Self::default()
        };
        let mut bindings = BTreeMap::new();
        module_bindings(root, source, &mut bindings);
        // Dynamic namespace writes cannot support a static exported identity.
        visit(root, &mut |node| {
            if node.kind() == "identifier"
                && matches!(
                    text(node, source).as_str(),
                    "exec"
                        | "eval"
                        | "globals"
                        | "locals"
                        | "vars"
                        | "__getattr__"
                        | "__path__"
                        | "__import__"
                )
            {
                facts.valid = false;
            }
            if matches!(
                node.kind(),
                "global_statement" | "named_expression" | "match_statement"
            ) {
                facts.valid = false;
            }
            let mutation_target = match node.kind() {
                "assignment" | "augmented_assignment" => node.child_by_field_name("left"),
                "delete_statement" => Some(node),
                "call" => node.child_by_field_name("function"),
                _ => None,
            };
            if let Some(target) = mutation_target {
                visit(target, &mut |part| {
                    if part.kind() == "identifier" && text(part, source) == "__dict__" {
                        facts.valid = false;
                    }
                });
            }
        });
        let mut cursor = root.walk();
        for statement in root.named_children(&mut cursor) {
            if matches!(statement.kind(), "function_definition" | "class_definition") {
                if let Some(name) = statement.child_by_field_name("name") {
                    let name_text = text(name, source);
                    if bindings.get(&name_text) == Some(&1) {
                        facts
                            .exports
                            .insert(name_text, [name.start_byte(), name.end_byte()]);
                    }
                }
            } else if statement.kind() == "import_from_statement" {
                let Some(module) = statement.child_by_field_name("module_name") else {
                    continue;
                };
                if module.kind() != "relative_import" {
                    continue;
                }
                let module = text(module, source);
                let mut child_cursor = statement.walk();
                for child in statement.named_children(&mut child_cursor) {
                    if matches!(child.kind(), "dotted_name" | "aliased_import") {
                        let name = if child.kind() == "aliased_import" {
                            child.child_by_field_name("name")
                        } else {
                            Some(child)
                        };
                        let Some(name) = name else { continue };
                        let imported = text(name, source);
                        if !identifier(&imported) {
                            continue;
                        }
                        let local = child
                            .child_by_field_name("alias")
                            .map(|alias| text(alias, source))
                            .unwrap_or_else(|| imported.clone());
                        facts.imports.push(PythonImportBinding {
                            module: module.clone(),
                            imported,
                            local,
                            span: [child.start_byte(), child.end_byte()],
                        });
                    }
                }
            }
        }
        facts
    }
}

fn identifier(name: &str) -> bool {
    let mut chars = name.chars();
    chars
        .next()
        .is_some_and(|c| c == '_' || c.is_ascii_alphabetic())
        && chars.all(|c| c == '_' || c.is_ascii_alphanumeric())
}

fn module_bindings(node: Node<'_>, source: &[u8], counts: &mut BTreeMap<String, usize>) {
    let mut names = BTreeSet::new();
    match node.kind() {
        "function_definition" | "class_definition" => {
            if let Some(name) = node.child_by_field_name("name") {
                *counts.entry(text(name, source)).or_default() += 1;
            }
            return; // Nested scopes cannot rebind a module declaration.
        }
        "assignment" | "augmented_assignment" | "named_expression" | "for_statement" => {
            if let Some(target) = node
                .child_by_field_name("left")
                .or_else(|| node.child_by_field_name("name"))
            {
                collect_binding_names(target, source, &mut names);
            }
        }
        "delete_statement" => {
            let mut cursor = node.walk();
            for child in node.named_children(&mut cursor) {
                collect_binding_names(child, source, &mut names);
            }
        }
        "as_pattern" => {
            if let Some(alias) = node.child_by_field_name("alias") {
                collect_binding_names(alias, source, &mut names);
            }
        }
        "import_statement" | "import_from_statement" => {
            let mut cursor = node.walk();
            for child in node.named_children(&mut cursor) {
                if matches!(child.kind(), "dotted_name" | "aliased_import")
                    && node
                        .child_by_field_name("module_name")
                        .is_none_or(|n| n.id() != child.id())
                {
                    let alias = child.child_by_field_name("alias");
                    let imported = child.child_by_field_name("name").unwrap_or(child);
                    let name = alias.map(|n| text(n, source)).unwrap_or_else(|| {
                        text(imported, source)
                            .split('.')
                            .next()
                            .unwrap_or("")
                            .to_owned()
                    });
                    names.insert(name);
                } else if child.kind() == "wildcard_import" {
                    // A wildcard may replace any prior module declaration.
                    names.insert("*".to_owned());
                }
            }
        }
        _ => {}
    }
    for name in names {
        *counts.entry(name).or_default() += 1;
    }
    let mut cursor = node.walk();
    for child in node.named_children(&mut cursor) {
        module_bindings(child, source, counts);
    }
    if counts.contains_key("*") {
        for count in counts.values_mut() {
            *count = 2;
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
        "list"
            | "tuple"
            | "list_pattern"
            | "tuple_pattern"
            | "pattern_list"
            | "as_pattern_target"
            | "list_splat_pattern"
            | "dictionary_splat_pattern"
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

#[cfg(test)]
mod import_fact_tests {
    use super::*;
    use std::path::Path;

    fn facts(source: &str) -> PythonFileFacts {
        PYTHON
            .extract(Path::new("pkg/main.py"), source.as_bytes())
            .unwrap()
            .python_file
            .unwrap()
    }

    #[test]
    fn relative_clauses_keep_exact_member_spans_and_aliases() {
        let source = "from ..helpers import (one as alias, two)\n";
        let facts = facts(source);
        assert!(facts.valid);
        assert_eq!(facts.imports.len(), 2);
        for (binding, (name, local, snippet)) in facts
            .imports
            .iter()
            .zip([("one", "alias", "one as alias"), ("two", "two", "two")])
        {
            assert_eq!(
                (
                    binding.module.as_str(),
                    binding.imported.as_str(),
                    binding.local.as_str()
                ),
                ("..helpers", name, local)
            );
            assert_eq!(&source[binding.span[0]..binding.span[1]], snippet);
        }
    }

    #[test]
    fn nested_conditional_wildcard_and_absolute_imports_are_outside_the_slice() {
        let facts = facts(
            "from external import item\nfrom .helpers import *\nif flag:\n from .helpers import conditional\ndef caller():\n from .helpers import nested\n",
        );
        assert!(facts.imports.is_empty());
    }

    #[test]
    fn only_unique_plain_module_declarations_are_exports() {
        let facts = facts(
            "def helper():\n pass\nclass Point:\n pass\ndef outer():\n def helper():\n  pass\n return helper\n@decorate\ndef wrapped():\n pass\nif flag:\n def conditional():\n  pass\n",
        );
        assert!(facts.valid);
        assert_eq!(
            facts.exports.keys().map(String::as_str).collect::<Vec<_>>(),
            ["Point", "helper", "outer"]
        );
    }

    #[test]
    fn module_rebindings_and_deletions_remove_export_identity() {
        for suffix in [
            "helper = other\n",
            "helper, other = values\n",
            "helper += other\n",
            "del helper\n",
            "if flag:\n def helper():\n  pass\n",
            "for helper in values:\n pass\n",
            "with resource as helper:\n pass\n",
            "try:\n pass\nexcept Exception as helper:\n pass\n",
            "from .noise import other as helper\n",
            "from .noise import *\n",
        ] {
            let facts = facts(&format!("def helper():\n pass\n{suffix}"));
            assert!(
                !facts.exports.contains_key("helper"),
                "rebound export: {suffix}"
            );
        }
    }

    #[test]
    fn dynamic_namespaces_and_parse_errors_cannot_support_import_proofs() {
        for suffix in [
            "exec(code)\n",
            "globals()['helper'] = other\n",
            "def __getattr__(name):\n return other\n",
            "__path__ = other\n",
            "def caller():\n global helper\n helper = other\n",
            "if (helper := other):\n pass\n",
            "def broken(:\n pass\n",
            "module.__dict__['helper'] = other\n",
            "module.__dict__.update(values)\n",
        ] {
            assert!(
                !facts(&format!("def helper():\n pass\n{suffix}")).valid,
                "{suffix}"
            );
        }
    }

    #[test]
    fn reading_instance_attributes_does_not_mutate_module_exports() {
        let facts = facts(
            "def helper():\n pass\nclass Owner:\n def check(self):\n  return 'item' in self.__dict__\n",
        );
        assert!(facts.valid);
        assert!(facts.exports.contains_key("helper"));
    }
}

#[cfg(test)]
mod call_shadow_tests {
    use super::*;
    use std::path::Path;

    fn assert_helper_call(source: &str, exact: bool) {
        let extraction = PYTHON
            .extract(Path::new("calls.py"), source.as_bytes())
            .unwrap();
        assert!(extraction.python_file.as_ref().unwrap().valid, "{source}");
        let call = source.rfind("helper()").unwrap();
        assert_eq!(
            extraction.edges.iter().any(|edge| {
                edge.relation == RelationKind::Calls
                    && edge.target == "helper"
                    && edge.span.start == call
            }),
            exact,
            "{source}"
        );
        assert_eq!(
            extraction
                .unresolved
                .iter()
                .any(|site| { site.kind == UnresolvedKind::Dispatch && site.span.start == call }),
            !exact,
            "{source}"
        );
    }

    #[test]
    fn parameters_shadow_global_functions_in_all_parameter_forms() {
        for parameter in [
            "helper",
            "helper=None",
            "helper: Callable",
            "helper: Callable=None",
            "*helper",
            "**helper",
            "*helper: Callable",
            "**helper: Callable",
            "helper, /",
            "*, helper",
        ] {
            assert_helper_call(
                &format!("def helper():\n return 1\ndef invoke({parameter}):\n return helper()\n"),
                false,
            );
        }
    }

    #[test]
    fn local_writes_shadow_the_entire_function_even_after_a_call() {
        for statement in [
            "helper = other",
            "helper: Callable = other",
            "helper, other = values",
            "*helper, other = values",
            "helper += other",
            "del helper",
            "for helper in values:\n  pass",
            "with resource as helper:\n  pass",
            "try:\n  pass\n except Exception as helper:\n  pass",
            "from package import helper",
            "import package as helper",
        ] {
            assert_helper_call(
                &format!("def helper():\n return 1\ndef invoke():\n helper()\n {statement}\n"),
                false,
            );
        }
    }

    #[test]
    fn enclosing_parameters_and_lambda_parameters_shadow_global_functions() {
        assert_helper_call(
            "def helper():\n return 1\ndef outer(helper):\n def inner():\n  return helper()\n return inner\n",
            false,
        );
        for parameter in ["helper", "helper=None", "*helper", "**helper"] {
            assert_helper_call(
                &format!("def helper():\n return 1\ninvoke = lambda {parameter}: helper()\n"),
                false,
            );
        }
    }

    #[test]
    fn a_default_expression_uses_the_enclosing_scope() {
        assert_helper_call(
            "def helper():\n return 1\ndef invoke(helper=helper()):\n return helper\n",
            true,
        );
        assert_helper_call(
            "def helper():\n return 1\ndef outer(helper):\n def inner(helper=helper()):\n  return helper\n return inner\n",
            false,
        );
    }

    #[test]
    fn unrelated_bindings_and_nested_parameters_preserve_known_calls() {
        assert_helper_call(
            "def helper():\n return 1\ndef invoke(other):\n other = None\n def inner(helper):\n  return helper\n return helper()\n",
            true,
        );
        assert_helper_call(
            "def invoke():\n def helper():\n  return 1\n return helper()\n",
            true,
        );
    }
}
