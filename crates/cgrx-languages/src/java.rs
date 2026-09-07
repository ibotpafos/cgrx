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
struct ClassInfo {
    concrete: bool,
    has_super: bool,
    subclassed: bool,
}

#[derive(Default)]
struct JavaFacts {
    methods: BTreeMap<String, usize>,
    method_owners: BTreeMap<String, Vec<String>>,
    classes: BTreeMap<String, ClassInfo>,
    super_names: BTreeSet<String>,
    bindings: BTreeMap<String, Vec<String>>,
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
                let target = text(name, source);
                *facts.methods.entry(target.clone()).or_default() += 1;
                if let Some(owner) = enclosing_type_name(node, source) {
                    let owners = facts.method_owners.entry(target).or_default();
                    if !owners.contains(&owner) {
                        owners.push(owner);
                    }
                }
            }
            if matches!(
                node.kind(),
                "class_declaration"
                    | "interface_declaration"
                    | "enum_declaration"
                    | "record_declaration"
            ) && let Some(name) = node.child_by_field_name("name")
            {
                let class_name = text(name, source);
                let entry = facts.classes.entry(class_name).or_default();
                entry.concrete = node.kind() == "class_declaration";
                if node.kind() == "class_declaration" {
                    if let Some(superclass) = node.child_by_field_name("superclass") {
                        entry.has_super = true;
                        let mut cursor = superclass.walk();
                        let inner = superclass
                            .named_children(&mut cursor)
                            .next()
                            .map(|child| text(child, source))
                            .unwrap_or_else(|| text(superclass, source));
                        facts.super_names.insert(simple_type_name(&inner));
                    }
                    if node.child_by_field_name("interfaces").is_some() {
                        entry.has_super = true;
                    }
                }
            }
            if matches!(
                node.kind(),
                "field_declaration" | "local_variable_declaration"
            ) && let Some(ty) = node.child_by_field_name("type")
            {
                let declared = simple_type_name(&text(ty, source));
                let mut cursor = node.walk();
                for child in node.named_children(&mut cursor) {
                    if child.kind() == "variable_declarator"
                        && let Some(name) = child.child_by_field_name("name")
                    {
                        facts
                            .bindings
                            .entry(text(name, source))
                            .or_default()
                            .push(declared.clone());
                    }
                }
            }
            if node.kind() == "formal_parameter"
                && let (Some(ty), Some(name)) = (
                    node.child_by_field_name("type"),
                    node.child_by_field_name("name"),
                )
            {
                facts
                    .bindings
                    .entry(text(name, source))
                    .or_default()
                    .push(simple_type_name(&text(ty, source)));
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
        for name in &facts.super_names {
            if let Some(info) = facts.classes.get_mut(name) {
                info.subclassed = true;
            }
        }
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
            let receiver = node.child_by_field_name("object").is_some()
                && receiver_target(node, source, facts).as_deref() == Some(target.as_str());
            if direct || receiver {
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

/// Prove `receiver.method()` when the receiver has one statically declared
/// local type: `this`, a singly-typed local/parameter/field name, or
/// `this.field`. The type must be a concrete class defined in this file with
/// no superclass, no interfaces, no local subclasses and no overloads of the
/// target method. Imported types, unbound names and chains remain gaps.
fn receiver_target(node: Node<'_>, source: &[u8], facts: &JavaFacts) -> Option<String> {
    let name = node.child_by_field_name("name")?;
    let target = text(name, source);
    if facts.static_imports.contains(&target) {
        return None;
    }
    let object = node.child_by_field_name("object")?;
    let class_name = match object.kind() {
        "this" => enclosing_type_name(node, source)
            .filter(|owner| facts.classes.get(owner).is_some_and(|info| info.concrete))?,
        "identifier" => single_binding(&text(object, source), facts)?,
        "field_access" => {
            let operand = object.child_by_field_name("object")?;
            if operand.kind() != "this" {
                return None;
            }
            single_binding(&text(object.child_by_field_name("field")?, source), facts)?
        }
        _ => return None,
    };
    let info = facts.classes.get(&class_name)?;
    if !info.concrete || info.has_super || info.subclassed {
        return None;
    }
    if facts.methods.get(&target) != Some(&1) {
        return None;
    }
    match facts.method_owners.get(&target) {
        Some(owners) if owners.as_slice() == [class_name] => Some(target),
        _ => None,
    }
}

/// Innermost enclosing type name for methods, or the enclosing concrete
/// class name for `this` receivers. Interfaces, enums and records qualify as
/// owners for bookkeeping but never as `this` targets.
fn enclosing_type_name(mut node: Node<'_>, source: &[u8]) -> Option<String> {
    while let Some(parent) = node.parent() {
        if matches!(
            parent.kind(),
            "class_declaration"
                | "interface_declaration"
                | "enum_declaration"
                | "record_declaration"
        ) && let Some(name) = parent.child_by_field_name("name")
        {
            return Some(text(name, source));
        }
        node = parent;
    }
    None
}

/// Single declared type for a variable name, or `None` when the name is
/// undeclared, shadowed by a method, or declared with two distinct types.
fn single_binding(name: &str, facts: &JavaFacts) -> Option<String> {
    if facts.methods.contains_key(name) {
        return None;
    }
    let mut distinct: Vec<&String> = vec![];
    for declared in facts.bindings.get(name)? {
        if !distinct.contains(&declared) {
            distinct.push(declared);
        }
    }
    let [single] = distinct.as_slice() else {
        return None;
    };
    Some((*single).clone())
}

/// Reduce a declared type to its simple name: generics, qualification and
/// array suffixes cannot change which local class is named.
fn simple_type_name(declared: &str) -> String {
    let without_generics = declared.split('<').next().unwrap_or_default();
    without_generics
        .rsplit('.')
        .next()
        .unwrap_or_default()
        .trim()
        .trim_end_matches("[]")
        .trim()
        .to_owned()
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
