//! Declaration identity for dependency edges, separate from callable identity.
use crate::pack::text;
use crate::ts_imports::TsFileFacts;
use serde::{Deserialize, Serialize};
use std::borrow::Borrow;
use std::collections::{BTreeMap, BTreeSet};
use tree_sitter::Node;

#[derive(Clone, Copy, Debug, Eq, PartialEq, Deserialize, Serialize)]
pub enum Namespace {
    Value,
    Type,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Deserialize, Serialize)]
pub enum DependencyUse {
    Import,
    Value,
    Type,
    TypeQuery,
}

impl DependencyUse {
    fn accepts(self, kind: DeclarationKind) -> bool {
        match self {
            Self::Import => true,
            Self::Type => kind.supports(Namespace::Type),
            Self::Value | Self::TypeQuery => kind.supports(Namespace::Value),
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ResolvedDeclaration {
    pub path: String,
    pub name: String,
    pub target: [usize; 2],
    pub kind: DeclarationKind,
    pub dependencies: Vec<String>,
    pub module_dependency: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Deserialize, Serialize)]
pub enum DeclarationKind {
    Function,
    Class,
    Variable,
    TypeAlias,
    Interface,
}

impl DeclarationKind {
    pub fn supports(self, namespace: Namespace) -> bool {
        match namespace {
            Namespace::Value => matches!(self, Self::Function | Self::Class | Self::Variable),
            Namespace::Type => matches!(self, Self::Class | Self::TypeAlias | Self::Interface),
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Deserialize, Serialize)]
pub struct Declaration {
    pub name: [usize; 2],
    pub body: [usize; 2],
    pub kind: DeclarationKind,
}

#[derive(Clone, Debug, Eq, PartialEq, Deserialize, Serialize)]
pub struct Import {
    pub local: String,
    pub imported: String,
    pub module: String,
    pub name: [usize; 2],
    pub member: [usize; 2],
    pub type_only: bool,
}

#[derive(Clone, Debug, Eq, PartialEq, Deserialize, Serialize)]
pub enum Export {
    Local {
        local: String,
        type_only: bool,
    },
    From {
        module: String,
        imported: String,
        type_only: bool,
    },
}

/// Only direct named declarations and explicit imports/exports. Unknown forms
/// retain blockers; namespace merging and default expressions are not guessed.
#[derive(Clone, Debug, Default, Eq, PartialEq, Deserialize, Serialize)]
pub struct DeclarationFacts {
    pub valid: bool,
    pub external_module: bool,
    pub ambient_augmentation: bool,
    pub augmentations: Vec<ModuleAugmentation>,
    pub declarations: BTreeMap<String, Vec<Declaration>>,
    pub imports: Vec<Import>,
    pub exports: BTreeMap<String, Vec<Export>>,
    pub blockers: BTreeMap<String, usize>,
    pub references: Vec<Reference>,
}

#[derive(Clone, Debug, Eq, PartialEq, Deserialize, Serialize)]
pub struct ModuleAugmentation {
    pub module: Option<String>,
    pub names: BTreeSet<String>,
    pub unknown_members: bool,
}

#[derive(Clone, Debug, Eq, PartialEq, Deserialize, Serialize)]
pub enum ReferenceBinding {
    Local,
    Import { member: [usize; 2] },
}

#[derive(Clone, Debug, Eq, PartialEq, Deserialize, Serialize)]
pub struct Reference {
    pub local: String,
    pub site: [usize; 2],
    pub caller: Option<[usize; 2]>,
    pub usage: DependencyUse,
    pub binding: Option<ReferenceBinding>,
}

fn span(node: Node<'_>) -> [usize; 2] {
    [node.start_byte(), node.end_byte()]
}

fn token(node: Node<'_>, kind: &str) -> bool {
    let mut cursor = node.walk();
    node.children(&mut cursor).any(|child| child.kind() == kind)
}

fn module(node: Node<'_>, source: &[u8]) -> Option<String> {
    let raw = text(node, source);
    let value = raw.get(1..raw.len().checked_sub(1)?)?;
    (!value.is_empty() && !value.contains(['\\', '?', '#'])).then(|| value.to_owned())
}

fn ancestor(mut node: Node<'_>, kind: &str) -> bool {
    while let Some(parent) = node.parent() {
        if parent.kind() == kind {
            return true;
        }
        node = parent;
    }
    false
}

fn reference_owner(mut node: Node<'_>) -> Option<[usize; 2]> {
    while let Some(parent) = node.parent() {
        match parent.kind() {
            "function_declaration"
            | "method_definition"
            | "class_declaration"
            | "abstract_class_declaration"
            | "type_alias_declaration"
            | "interface_declaration"
            | "variable_declarator" => {
                return parent
                    .child_by_field_name("name")
                    .filter(|n| {
                        matches!(
                            n.kind(),
                            "identifier" | "type_identifier" | "property_identifier"
                        )
                    })
                    .map(span);
            }
            "arrow_function" => {
                let variable = parent
                    .parent()
                    .filter(|n| n.kind() == "variable_declarator")?;
                if variable.child_by_field_name("value") != Some(parent) {
                    return None;
                }
                return variable
                    .child_by_field_name("name")
                    .filter(|n| n.kind() == "identifier")
                    .map(span);
            }
            "function_expression"
            | "generator_function"
            | "generator_function_declaration"
            | "internal_module"
            | "ambient_declaration" => return None,
            _ => {}
        }
        node = parent;
    }
    None
}

fn binding_matches(node: Node<'_>, name: &str, source: &[u8]) -> bool {
    let mut names = Vec::new();
    super::binding_names(node, source, &mut names);
    names.iter().any(|value| value == name)
}

fn binding_site(mut node: Node<'_>) -> bool {
    let site = span(node);
    while let Some(parent) = node.parent() {
        let field = match parent.kind() {
            "variable_declarator" => parent.child_by_field_name("name"),
            "required_parameter" | "optional_parameter" => parent
                .child_by_field_name("pattern")
                .or_else(|| parent.child_by_field_name("name")),
            "assignment_pattern" => parent.child_by_field_name("left"),
            "catch_clause" => parent.child_by_field_name("parameter"),
            "arrow_function" => parent.child_by_field_name("parameter"),
            _ => None,
        };
        if field.is_some_and(|f| f.start_byte() <= site[0] && site[1] <= f.end_byte()) {
            return true;
        }
        if matches!(parent.kind(), "formal_parameters" | "rest_pattern")
            && node.kind() == "identifier"
        {
            return true;
        }
        if parent.kind() == "program" {
            break;
        }
        node = parent;
    }
    false
}

fn local_declaration_matches(
    node: Node<'_>,
    name: &str,
    namespace: Namespace,
    source: &[u8],
) -> bool {
    if matches!(
        node.kind(),
        "switch_case" | "switch_default" | "expression_statement" | "ambient_declaration"
    ) {
        let mut cursor = node.walk();
        return node
            .named_children(&mut cursor)
            .any(|child| local_declaration_matches(child, name, namespace, source));
    }
    match node.kind() {
        "class_declaration"
        | "abstract_class_declaration"
        | "enum_declaration"
        | "internal_module" => node
            .child_by_field_name("name")
            .is_some_and(|n| text(n, source) == name),
        "type_alias_declaration" | "interface_declaration" if namespace == Namespace::Type => node
            .child_by_field_name("name")
            .is_some_and(|n| text(n, source) == name),
        "function_declaration" if namespace == Namespace::Value => node
            .child_by_field_name("name")
            .is_some_and(|n| text(n, source) == name),
        "lexical_declaration" | "variable_declaration" if namespace == Namespace::Value => {
            let mut cursor = node.walk();
            node.named_children(&mut cursor).any(|variable| {
                variable.kind() == "variable_declarator"
                    && variable
                        .child_by_field_name("name")
                        .is_some_and(|n| binding_matches(n, name, source))
            })
        }
        _ => false,
    }
}

fn reference_shadowed(mut node: Node<'_>, name: &str, namespace: Namespace, source: &[u8]) -> bool {
    while let Some(parent) = node.parent() {
        if parent.kind() == "program" {
            break;
        }
        // Conditional and mapped binding scopes need their own receipt. Keep
        // source names visible as refused sites instead of guessing a scope.
        if matches!(
            parent.kind(),
            "conditional_type" | "mapped_type_clause" | "infer_type"
        ) {
            return true;
        }
        let mut cursor = parent.walk();
        if parent
            .named_children(&mut cursor)
            .any(|child| child.kind() == "mapped_type_clause")
        {
            return true;
        }
        if namespace == Namespace::Type
            && let Some(parameters) = parent.child_by_field_name("type_parameters")
        {
            let mut blocked = false;
            super::visit(parameters, &mut |p| {
                if p.kind() == "type_parameter"
                    && p.child_by_field_name("name")
                        .is_some_and(|n| text(n, source) == name)
                {
                    blocked = true;
                }
            });
            if blocked {
                return true;
            }
        }
        if namespace == Namespace::Value {
            if parent
                .child_by_field_name("parameters")
                .is_some_and(|n| binding_matches(n, name, source))
                || parent
                    .child_by_field_name("parameter")
                    .is_some_and(|n| binding_matches(n, name, source))
            {
                return true;
            }
            // `var` is function scoped even inside a nested block. Refuse an
            // enclosing-function write binding, but do not scan sibling functions.
            if matches!(
                parent.kind(),
                "function_declaration" | "method_definition" | "arrow_function"
            ) && let Some(body) = parent.child_by_field_name("body")
            {
                fn has_var(node: Node<'_>, name: &str, source: &[u8]) -> bool {
                    if matches!(
                        node.kind(),
                        "function_declaration"
                            | "function_expression"
                            | "arrow_function"
                            | "method_definition"
                    ) {
                        return false;
                    }
                    if node.kind() == "variable_declaration"
                        && local_declaration_matches(node, name, Namespace::Value, source)
                    {
                        return true;
                    }
                    let mut cursor = node.walk();
                    node.named_children(&mut cursor)
                        .any(|n| has_var(n, name, source))
                }
                if has_var(body, name, source) {
                    return true;
                }
            }
        }
        if matches!(
            parent.kind(),
            "statement_block" | "class_body" | "switch_body"
        ) {
            let mut cursor = parent.walk();
            if parent
                .named_children(&mut cursor)
                .any(|child| local_declaration_matches(child, name, namespace, source))
            {
                return true;
            }
        }
        if parent.kind() == "catch_clause"
            && namespace == Namespace::Value
            && parent
                .child_by_field_name("parameter")
                .is_some_and(|n| binding_matches(n, name, source))
        {
            return true;
        }
        if matches!(parent.kind(), "for_statement" | "for_in_statement") {
            if namespace == Namespace::Value
                && parent
                    .child_by_field_name("left")
                    .is_some_and(|left| binding_matches(left, name, source))
            {
                return true;
            }
            let mut cursor = parent.walk();
            if parent
                .named_children(&mut cursor)
                .any(|child| local_declaration_matches(child, name, namespace, source))
            {
                return true;
            }
        }
        node = parent;
    }
    false
}

impl DeclarationFacts {
    pub(super) fn from_tree(root: Node<'_>, source: &[u8]) -> Self {
        let mut facts = Self {
            valid: !root.has_error(),
            ..Self::default()
        };
        super::visit(root, &mut |node| {
            if node.kind() == "ambient_declaration"
                && (token(node, "global") || text(node, source).starts_with("declare global"))
            {
                facts.ambient_augmentation = true;
            }
            if matches!(node.kind(), "internal_module" | "module")
                && node
                    .child_by_field_name("name")
                    .is_some_and(|n| n.kind() == "string")
            {
                facts.ambient_augmentation = true;
                let mut names = BTreeSet::new();
                let mut unknown_members = node.child_by_field_name("body").is_none();
                if let Some(body) = node.child_by_field_name("body") {
                    let mut cursor = body.walk();
                    for child in body.named_children(&mut cursor) {
                        let declaration = if child.kind() == "export_statement" {
                            child.child_by_field_name("declaration")
                        } else {
                            Some(child)
                        };
                        if let Some(mut declaration) = declaration {
                            if declaration.kind() == "ambient_declaration" {
                                declaration = declaration.named_child(0).unwrap_or(declaration);
                            }
                            if let Some(name) = declaration.child_by_field_name("name") {
                                names.insert(text(name, source));
                            } else if matches!(
                                declaration.kind(),
                                "lexical_declaration" | "variable_declaration"
                            ) {
                                super::visit(declaration, &mut |v| {
                                    if v.kind() == "variable_declarator"
                                        && let Some(name) = v.child_by_field_name("name")
                                    {
                                        let mut bindings = Vec::new();
                                        super::binding_names(name, source, &mut bindings);
                                        names.extend(bindings);
                                    }
                                });
                            } else if !matches!(declaration.kind(), "comment" | "empty_statement") {
                                unknown_members = true;
                            }
                        } else {
                            unknown_members = true;
                        }
                    }
                }
                facts.augmentations.push(ModuleAugmentation {
                    module: node
                        .child_by_field_name("name")
                        .and_then(|n| module(n, source)),
                    names,
                    unknown_members,
                });
            }
        });
        let mut cursor = root.walk();
        for item in root.named_children(&mut cursor) {
            facts.external_module |= matches!(item.kind(), "import_statement" | "export_statement");
            if item.kind() == "import_statement" {
                facts.collect_import(item, source);
                continue;
            }
            let exported = item.kind() == "export_statement";
            let declaration = if exported {
                item.child_by_field_name("declaration")
            } else {
                Some(item)
            };
            if let Some(declaration) = declaration {
                let names = facts.collect_declaration(declaration, source);
                if exported {
                    for name in names {
                        let exported_name = if token(item, "default") {
                            "default".to_owned()
                        } else {
                            name.clone()
                        };
                        facts
                            .exports
                            .entry(exported_name)
                            .or_default()
                            .push(Export::Local {
                                local: name,
                                type_only: token(item, "type"),
                            });
                    }
                }
            }
            if exported {
                facts.collect_export_clause(item, source);
            }
        }
        facts.collect_references(root, source);
        facts
    }

    fn collect_references(&mut self, root: Node<'_>, source: &[u8]) {
        super::visit(root, &mut |node| {
            let usage = match node.kind() {
                "type_identifier" => DependencyUse::Type,
                "identifier" if node.parent().is_some_and(|p| p.kind() == "type_query") => {
                    DependencyUse::TypeQuery
                }
                "identifier" if !ancestor(node, "type_query") => DependencyUse::Value,
                _ => return,
            };
            let Some(parent) = node.parent() else { return };
            if matches!(parent.kind(), "nested_type_identifier" | "type_parameter")
                || binding_site(node)
                || (matches!(
                    parent.kind(),
                    "function_declaration"
                        | "function_signature"
                        | "class_declaration"
                        | "abstract_class_declaration"
                        | "interface_declaration"
                        | "type_alias_declaration"
                ) && parent.child_by_field_name("name") == Some(node))
                || ancestor(node, "import_statement")
                || ancestor(node, "export_clause")
                || (matches!(parent.kind(), "call_expression" | "new_expression")
                    && (parent.child_by_field_name("function") == Some(node)
                        || parent.child_by_field_name("constructor") == Some(node)))
            {
                return;
            }
            let local = text(node, source);
            // This ledger covers source declarations and explicit bindings.
            // Ambient/library names need a compiler inventory, not name guessing.
            if !self.declarations.contains_key(&local)
                && !self.imports.iter().any(|i| i.local == local)
                && !self.blockers.contains_key(&local)
            {
                return;
            }
            let caller = reference_owner(node);
            let namespace = if usage == DependencyUse::Type {
                Namespace::Type
            } else {
                Namespace::Value
            };
            let blocked = !self.valid
                || !self.external_module
                || caller.is_none()
                || reference_shadowed(node, &local, namespace, source);
            let binding = if blocked {
                None
            } else if self.unique_declaration(&local, namespace).is_some() {
                Some(ReferenceBinding::Local)
            } else {
                let imports: Vec<_> = self.imports.iter().filter(|i| i.local == local).collect();
                match imports.as_slice() {
                    [import]
                        if !self.declarations.contains_key(&local)
                            && !self.blockers.contains_key(&local) =>
                    {
                        Some(ReferenceBinding::Import {
                            member: import.member,
                        })
                    }
                    _ => None,
                }
            };
            self.references.push(Reference {
                local,
                site: span(node),
                caller,
                usage,
                binding,
            });
        });
    }

    fn collect_declaration(&mut self, node: Node<'_>, source: &[u8]) -> Vec<String> {
        if node.kind() == "expression_statement"
            && let Some(module) = node
                .named_child(0)
                .filter(|child| matches!(child.kind(), "internal_module" | "module"))
        {
            return self.collect_declaration(module, source);
        }
        let kind = match node.kind() {
            "function_declaration" => Some(DeclarationKind::Function),
            "class_declaration" | "abstract_class_declaration" => Some(DeclarationKind::Class),
            "type_alias_declaration" => Some(DeclarationKind::TypeAlias),
            "interface_declaration" => Some(DeclarationKind::Interface),
            _ => None,
        };
        if let Some(kind) = kind
            && let Some(name) = node.child_by_field_name("name")
        {
            let value = text(name, source);
            self.declarations
                .entry(value.clone())
                .or_default()
                .push(Declaration {
                    name: span(name),
                    body: span(node),
                    kind,
                });
            return vec![value];
        }
        if matches!(node.kind(), "lexical_declaration" | "variable_declaration") {
            let mut names = Vec::new();
            let mut cursor = node.walk();
            for variable in node
                .named_children(&mut cursor)
                .filter(|node| node.kind() == "variable_declarator")
            {
                let Some(name) = variable.child_by_field_name("name") else {
                    continue;
                };
                if name.kind() == "identifier" {
                    let value = text(name, source);
                    self.declarations
                        .entry(value.clone())
                        .or_default()
                        .push(Declaration {
                            name: span(name),
                            body: span(variable),
                            kind: DeclarationKind::Variable,
                        });
                    names.push(value);
                } else {
                    let mut blocked = Vec::new();
                    super::binding_names(name, source, &mut blocked);
                    for value in blocked {
                        *self.blockers.entry(value).or_default() += 1;
                    }
                }
            }
            return names;
        }
        if let Some(name) = node.child_by_field_name("name") {
            let mut value = text(name, source);
            if matches!(node.kind(), "internal_module" | "module") {
                value = value.split('.').next().unwrap_or("").to_owned();
            }
            *self.blockers.entry(value).or_default() += 1;
        }
        Vec::new()
    }

    fn collect_import(&mut self, item: Node<'_>, source: &[u8]) {
        let Some(specifier) = item
            .child_by_field_name("source")
            .and_then(|n| module(n, source))
        else {
            return;
        };
        let type_only = token(item, "type");
        super::visit(item, &mut |node| {
            if node.kind() == "import_specifier" {
                let Some(imported) = node
                    .child_by_field_name("name")
                    .filter(|n| n.kind() == "identifier")
                else {
                    return;
                };
                let local = node.child_by_field_name("alias").unwrap_or(imported);
                if local.kind() != "identifier" {
                    return;
                }
                self.imports.push(Import {
                    local: text(local, source),
                    imported: text(imported, source),
                    module: specifier.clone(),
                    name: span(local),
                    member: span(node),
                    type_only: type_only || token(node, "type"),
                });
            } else if node.kind() == "import_clause" {
                let mut cursor = node.walk();
                for local in node
                    .named_children(&mut cursor)
                    .filter(|n| n.kind() == "identifier")
                {
                    self.imports.push(Import {
                        local: text(local, source),
                        imported: "default".to_owned(),
                        module: specifier.clone(),
                        name: span(local),
                        member: span(local),
                        type_only,
                    });
                }
            } else if matches!(node.kind(), "namespace_import" | "import_require_clause") {
                let mut cursor = node.walk();
                for local in node
                    .named_children(&mut cursor)
                    .filter(|n| n.kind() == "identifier")
                {
                    *self.blockers.entry(text(local, source)).or_default() += 1;
                }
            }
        });
    }

    fn collect_export_clause(&mut self, item: Node<'_>, source: &[u8]) {
        let external = item
            .child_by_field_name("source")
            .and_then(|n| module(n, source));
        let type_only = token(item, "type");
        super::visit(item, &mut |node| {
            if node.kind() != "export_specifier" {
                return;
            }
            let Some(name) = node
                .child_by_field_name("name")
                .filter(|n| matches!(n.kind(), "identifier" | "type_identifier"))
            else {
                return;
            };
            let alias = node.child_by_field_name("alias").unwrap_or(name);
            if !matches!(alias.kind(), "identifier" | "type_identifier") {
                return;
            }
            let export = if let Some(module) = &external {
                Export::From {
                    module: module.clone(),
                    imported: text(name, source),
                    type_only: type_only || token(node, "type"),
                }
            } else {
                Export::Local {
                    local: text(name, source),
                    type_only: type_only || token(node, "type"),
                }
            };
            self.exports
                .entry(text(alias, source))
                .or_default()
                .push(export);
        });
        // `export default Name` has a value field rather than a declaration.
        if token(item, "default")
            && item.child_by_field_name("declaration").is_none()
            && let Some(value) = item
                .child_by_field_name("value")
                .filter(|n| n.kind() == "identifier")
        {
            self.exports
                .entry("default".to_owned())
                .or_default()
                .push(Export::Local {
                    local: text(value, source),
                    type_only: false,
                });
        }
    }

    pub fn unique_declaration(&self, name: &str, namespace: Namespace) -> Option<&Declaration> {
        if !self.valid
            || self.blockers.contains_key(name)
            || self.imports.iter().any(|i| i.local == name)
        {
            return None;
        }
        // Reject merging across namespaces until it has a dedicated receipt.
        let [declaration] = self.declarations.get(name)?.as_slice() else {
            return None;
        };
        declaration.kind.supports(namespace).then_some(declaration)
    }
}

/// Resolve an explicit source import through the existing conservative module
/// candidate policy. This result never establishes a CALLS target.
pub fn resolve_import<F: Borrow<TsFileFacts>>(
    files: &BTreeMap<String, F>,
    path: &str,
    member: [usize; 2],
    usage: DependencyUse,
    modules: &BTreeMap<(String, String), String>,
) -> Option<ResolvedDeclaration> {
    DeclarationResolver::new(files, modules).resolve_import(path, member, usage)
}

pub fn resolve_reference<F: Borrow<TsFileFacts>>(
    files: &BTreeMap<String, F>,
    path: &str,
    site: [usize; 2],
    modules: &BTreeMap<(String, String), String>,
) -> Option<(Reference, ResolvedDeclaration)> {
    DeclarationResolver::new(files, modules).resolve_reference(path, site)
}

/// Reuse an immutable augmentation inventory while rebuilding dependency edges.
/// All candidate files remain available to the conservative module resolver,
/// including invalid facts that may still contain an augmentation blocker.
pub struct DeclarationResolver<'a, F: Borrow<TsFileFacts>> {
    files: &'a BTreeMap<String, F>,
    modules: &'a BTreeMap<(String, String), String>,
    module_augmentations: Vec<(&'a str, &'a ModuleAugmentation)>,
    ambient_modules: Vec<&'a ModuleAugmentation>,
}

impl<'a, F: Borrow<TsFileFacts>> DeclarationResolver<'a, F> {
    pub fn new(
        files: &'a BTreeMap<String, F>,
        modules: &'a BTreeMap<(String, String), String>,
    ) -> Self {
        let mut module_augmentations = Vec::new();
        let mut ambient_modules = Vec::new();
        for (path, file) in files {
            if let Some(facts) = file.borrow().declaration_facts.as_ref() {
                for augmentation in &facts.augmentations {
                    if facts.external_module {
                        module_augmentations.push((path.as_str(), augmentation));
                    } else {
                        ambient_modules.push(augmentation);
                    }
                }
            }
        }
        Self {
            files,
            modules,
            module_augmentations,
            ambient_modules,
        }
    }

    pub fn resolve_import(
        &self,
        path: &str,
        member: [usize; 2],
        usage: DependencyUse,
    ) -> Option<ResolvedDeclaration> {
        let files = self.files;
        let modules = self.modules;
        let file = files
            .get(path)
            .map(Borrow::borrow)
            .filter(|file| file.valid)?;
        let facts = file
            .declaration_facts
            .as_ref()
            .filter(|facts| facts.valid)?;
        let members: Vec<_> = facts
            .imports
            .iter()
            .filter(|item| item.member == member)
            .collect();
        let [import] = members.as_slice() else {
            return None;
        };
        if facts.blockers.contains_key(&import.local)
            || facts.declarations.contains_key(&import.local)
            || facts
                .imports
                .iter()
                .filter(|i| i.local == import.local)
                .count()
                != 1
            || (import.type_only && usage == DependencyUse::Value)
        {
            return None;
        }
        let target = crate::ts_imports::resolve_module_path(files, path, &import.module, modules)?;
        if self.ambient_import_override(&import.module) {
            return None;
        }
        let mut dependencies = vec![path.to_owned()];
        let (path, name, declaration) = self.resolve_export(
            &target,
            &import.imported,
            usage,
            &mut BTreeSet::new(),
            &mut dependencies,
        )?;
        if self.augmented(&path, &name) {
            return None;
        }
        Some(ResolvedDeclaration {
            path,
            name,
            target: declaration.name,
            kind: declaration.kind,
            dependencies,
            module_dependency: true,
        })
    }

    pub fn resolve_reference(
        &self,
        path: &str,
        site: [usize; 2],
    ) -> Option<(Reference, ResolvedDeclaration)> {
        let files = self.files;
        let file = files
            .get(path)
            .map(Borrow::borrow)
            .filter(|file| file.valid)?;
        let facts = file
            .declaration_facts
            .as_ref()
            .filter(|facts| facts.valid && facts.external_module)?;
        let sites: Vec<_> = facts.references.iter().filter(|r| r.site == site).collect();
        let [reference] = sites.as_slice() else {
            return None;
        };
        reference.caller?;
        let resolved = match reference.binding.as_ref()? {
            ReferenceBinding::Import { member } => {
                let import = facts
                    .imports
                    .iter()
                    .find(|i| i.member == *member && i.local == reference.local)?;
                self.resolve_import(path, import.member, reference.usage)?
            }
            ReferenceBinding::Local => {
                let namespace = match reference.usage {
                    DependencyUse::Type => Namespace::Type,
                    DependencyUse::TypeQuery | DependencyUse::Value => Namespace::Value,
                    _ => return None,
                };
                let declaration = facts.unique_declaration(&reference.local, namespace)?;
                ResolvedDeclaration {
                    path: path.to_owned(),
                    name: reference.local.clone(),
                    target: declaration.name,
                    kind: declaration.kind,
                    dependencies: vec![path.to_owned()],
                    module_dependency: false,
                }
            }
        };
        if self.augmented(&resolved.path, &resolved.name) {
            return None;
        }
        Some(((*reference).clone(), resolved))
    }

    fn augmented(&self, target_path: &str, target_name: &str) -> bool {
        self.module_augmentations
            .iter()
            .any(|(path, augmentation)| {
                // `declare global` does not merge a module's local names. Explicit
                // module augmentations with the target name need a merge receipt.
                (augmentation.unknown_members || augmentation.names.contains(target_name))
                    && augmentation.module.as_ref().is_none_or(|module| {
                        crate::ts_imports::resolve_module_path(
                            self.files,
                            path,
                            module,
                            self.modules,
                        )
                        .is_none_or(|resolved| resolved == target_path)
                    })
            })
    }

    fn ambient_import_override(&self, module: &str) -> bool {
        self.ambient_modules.iter().any(|a| {
            a.module.as_ref().is_none_or(|pattern| {
                if let Some((prefix, suffix)) = pattern.split_once('*') {
                    suffix.contains('*') || (module.starts_with(prefix) && module.ends_with(suffix))
                } else {
                    pattern == module
                }
            })
        })
    }

    fn resolve_export(
        &self,
        path: &str,
        name: &str,
        usage: DependencyUse,
        seen: &mut BTreeSet<(String, String)>,
        dependencies: &mut Vec<String>,
    ) -> Option<(String, String, Declaration)> {
        let files = self.files;
        let modules = self.modules;
        if seen.len() >= 8 || !seen.insert((path.to_owned(), name.to_owned())) {
            return None;
        }
        let file = files
            .get(path)
            .map(Borrow::borrow)
            .filter(|file| file.valid)?;
        let facts = file
            .declaration_facts
            .as_ref()
            .filter(|facts| facts.valid)?;
        dependencies.push(path.to_owned());
        let [export] = facts.exports.get(name)?.as_slice() else {
            return None;
        };
        let (module, imported, type_only) = match export {
            Export::Local { local, type_only } => {
                if *type_only && usage == DependencyUse::Value {
                    return None;
                }
                if facts.blockers.contains_key(local) {
                    return None;
                }
                let imports: Vec<_> = facts
                    .imports
                    .iter()
                    .filter(|item| &item.local == local)
                    .collect();
                if imports.is_empty() {
                    let [declaration] = facts.declarations.get(local)?.as_slice() else {
                        return None;
                    };
                    return usage
                        .accepts(declaration.kind)
                        .then(|| (path.to_owned(), local.clone(), declaration.clone()));
                }
                if facts.declarations.contains_key(local) {
                    return None;
                }
                let [import] = imports.as_slice() else {
                    return None;
                };
                (
                    &import.module,
                    &import.imported,
                    *type_only || import.type_only,
                )
            }
            Export::From {
                module,
                imported,
                type_only,
            } => (module, imported, *type_only),
        };
        if type_only && usage == DependencyUse::Value {
            return None;
        }
        if self.ambient_import_override(module) {
            return None;
        }
        let target = crate::ts_imports::resolve_module_path(files, path, module, modules)?;
        self.resolve_export(&target, imported, usage, seen, dependencies)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ts_imports::TsFileFacts;

    fn files(source: &[(&str, &str)]) -> BTreeMap<String, TsFileFacts> {
        source
            .iter()
            .map(|(path, source)| {
                (
                    path.to_string(),
                    TsFileFacts::parse(path, source.as_bytes()),
                )
            })
            .collect()
    }

    fn imported(
        files: &BTreeMap<String, TsFileFacts>,
        local: &str,
        usage: DependencyUse,
    ) -> Option<ResolvedDeclaration> {
        let imports = &files["main.ts"].declaration_facts.as_ref()?.imports;
        let member = imports.iter().find(|i| i.local == local)?.member;
        resolve_import(files, "main.ts", member, usage, &BTreeMap::new())
    }

    fn reference(
        files: &BTreeMap<String, TsFileFacts>,
        local: &str,
    ) -> Option<ResolvedDeclaration> {
        let references = &files["main.ts"].declaration_facts.as_ref()?.references;
        let sites = references
            .iter()
            .filter(|r| r.local == local)
            .collect::<Vec<_>>();
        let [site] = sites.as_slice() else {
            return None;
        };
        resolve_reference(files, "main.ts", site.site, &BTreeMap::new()).map(|(_, d)| d)
    }

    #[test]
    fn references_respect_type_namespace_type_queries_and_exact_import_identity() {
        let source = "import type {Payload as Local, run} from './types'; export const schema = 1; export type Shape = typeof schema; export type Fn = typeof run; export function caller(Local: number, value: Local) {}";
        let files = files(&[
            ("main.ts", source),
            (
                "types.ts",
                "export type Payload = string; export function run() {}",
            ),
        ]);
        for (local, path, name) in [
            ("schema", "main.ts", "schema"),
            ("run", "types.ts", "run"),
            ("Local", "types.ts", "Payload"),
        ] {
            let resolved = reference(&files, local).unwrap();
            assert_eq!(
                (resolved.path.as_str(), resolved.name.as_str()),
                (path, name)
            );
        }
        let caller = files["main.ts"]
            .declaration_facts
            .as_ref()
            .unwrap()
            .references
            .iter()
            .find(|r| r.local == "Local")
            .unwrap()
            .caller
            .unwrap();
        assert_eq!(&source.as_bytes()[caller[0]..caller[1]], b"caller");
    }

    #[test]
    fn local_shadowing_ambiguous_namespace_scripts_and_anonymous_owners_abstain() {
        for source in [
            "import type {Payload} from './types'; export function caller<Payload>(x: Payload) {}",
            "import type {Payload} from './types'; export function caller() { type Payload = number; let x: Payload; }",
            "export const schema = 1; export function caller(schema: number) { type Shape = typeof schema; }",
            "export const schema = 1; export function caller() { if (true) { var schema = 2; } type Shape = typeof schema; }",
            "export const schema = 1; export function caller() { try {} catch (schema) { type Shape = typeof schema; } }",
            "export const schema = 1; export function caller() { for (const schema of [1]) { type Shape = typeof schema; } }",
            "export type Payload = string; export function caller() { switch (1) { case 1: type Payload = number; let x: Payload; } }",
            "export type Payload = string; export function caller() { namespace Payload { export type Inner = number; } let x: Payload; }",
            "export type Payload = string; export type Shape = { [Payload in 'x']: Payload };",
            "export type Payload = string; export type Shape<T> = T extends infer Payload ? Payload : never;",
            "type Payload = string; function caller(x: Payload) {}",
            "export type Payload = string; export function caller() { [1].map(function(x: Payload) {}); }",
            "export type Payload = string; export const Payload = 1; export function caller(x: Payload) {}",
        ] {
            let files = files(&[
                ("main.ts", source),
                ("types.ts", "export type Payload = string;"),
            ]);
            let facts = files["main.ts"].declaration_facts.as_ref().unwrap();
            assert!(
                !facts.references.is_empty(),
                "missing refused site: {source}"
            );
            assert!(
                facts.references.iter().all(|r| resolve_reference(
                    &files,
                    "main.ts",
                    r.site,
                    &BTreeMap::new()
                )
                .is_none()),
                "{source}"
            );
        }
    }

    #[test]
    fn sibling_function_bindings_do_not_shadow_an_imported_type() {
        let files = files(&[
            (
                "main.ts",
                "import type {Payload} from './types'; function sibling<Payload>(x: Payload) {} export function caller(x: Payload) {}",
            ),
            ("types.ts", "export type Payload = string;"),
        ]);
        let facts = files["main.ts"].declaration_facts.as_ref().unwrap();
        assert_eq!(facts.references.len(), 2);
        assert!(
            resolve_reference(
                &files,
                "main.ts",
                facts.references[0].site,
                &BTreeMap::new()
            )
            .is_none()
        );
        let (_, resolved) = resolve_reference(
            &files,
            "main.ts",
            facts.references[1].site,
            &BTreeMap::new(),
        )
        .unwrap();
        assert_eq!(resolved.path, "types.ts");
    }

    #[test]
    fn value_dependencies_have_static_binding_identity_without_counting_declarations_or_calls() {
        let source = "export const payload = 1; export const envelope = {payload: payload}; export function caller(payload: number) { return payload; } export function use() { return payload; } export function run() {} export function calls() { run(); }";
        let files = files(&[("main.ts", source)]);
        let facts = files["main.ts"].declaration_facts.as_ref().unwrap();
        let sites: Vec<_> = facts
            .references
            .iter()
            .filter(|r| r.local == "payload")
            .collect();
        assert_eq!(sites.len(), 3);
        assert!(resolve_reference(&files, "main.ts", sites[0].site, &BTreeMap::new()).is_some());
        assert!(resolve_reference(&files, "main.ts", sites[1].site, &BTreeMap::new()).is_none());
        assert!(resolve_reference(&files, "main.ts", sites[2].site, &BTreeMap::new()).is_some());
        assert!(facts.references.iter().all(|r| r.local != "run"));
    }

    #[test]
    fn script_ambient_module_does_not_augment_an_unrelated_source_module() {
        let files = files(&[
            (
                "main.ts",
                "import {Box} from './types'; export function caller(x: Box) {}",
            ),
            ("types.ts", "export class Box {}"),
            ("pg.d.ts", "declare module 'pg';"),
        ]);
        assert!(imported(&files, "Box", DependencyUse::Import).is_some());
        assert!(reference(&files, "Box").is_some());
    }

    #[test]
    fn reused_resolver_rechecks_added_removed_and_invalid_augmentation_facts() {
        for source in [
            "export {}; declare module './types' { interface Box { extra: number } }",
            "declare module './types';",
            "declare module '*types';",
        ] {
            let mut files = files(&[
                (
                    "main.ts",
                    "import {Box} from './types'; export function caller(x: Box) {}",
                ),
                ("types.ts", "export class Box {}"),
            ]);
            let facts = files["main.ts"].declaration_facts.as_ref().unwrap();
            let member = facts.imports[0].member;
            let site = facts
                .references
                .iter()
                .find(|r| r.local == "Box")
                .unwrap()
                .site;
            let modules = BTreeMap::new();
            {
                let resolver = DeclarationResolver::new(&files, &modules);
                for _ in 0..2 {
                    assert!(
                        resolver
                            .resolve_import("main.ts", member, DependencyUse::Import)
                            .is_some()
                    );
                    assert!(resolver.resolve_reference("main.ts", site).is_some());
                }
            }
            let mut augmentation = TsFileFacts::parse("augment.ts", source.as_bytes());
            // Invalid source candidates remain blockers until they are reparsed
            // or removed; borrowing must not erase their last known facts.
            augmentation.valid = false;
            augmentation.declaration_facts.as_mut().unwrap().valid = false;
            files.insert("augment.ts".into(), augmentation);
            {
                let resolver = DeclarationResolver::new(&files, &modules);
                assert!(
                    resolver
                        .resolve_import("main.ts", member, DependencyUse::Import)
                        .is_none()
                );
                assert!(resolver.resolve_reference("main.ts", site).is_none());
            }
            files.remove("augment.ts");
            let resolver = DeclarationResolver::new(&files, &modules);
            assert!(
                resolver
                    .resolve_import("main.ts", member, DependencyUse::Import)
                    .is_some()
            );
            assert!(resolver.resolve_reference("main.ts", site).is_some());
        }
    }

    #[test]
    fn named_default_identifier_and_unrelated_global_names_preserve_identity() {
        let mut files = files(&[
            (
                "main.ts",
                "import Render from './types'; export type Shape = typeof Render;",
            ),
            ("types.ts", "const render = 1; export default render;"),
        ]);
        assert_eq!(
            imported(&files, "Render", DependencyUse::Import)
                .unwrap()
                .name,
            "render"
        );
        assert_eq!(reference(&files, "Render").unwrap().name, "render");
        for source in [
            "export {}; declare global { interface Window { x: number } }",
            "export {}; declare module './types' { interface Box { x: number } }",
        ] {
            files.insert(
                "augment.ts".into(),
                TsFileFacts::parse("augment.ts", source.as_bytes()),
            );
            assert!(
                files["augment.ts"]
                    .declaration_facts
                    .as_ref()
                    .unwrap()
                    .ambient_augmentation
            );
            assert_eq!(
                imported(&files, "Render", DependencyUse::Import)
                    .unwrap()
                    .name,
                "render"
            );
            assert_eq!(reference(&files, "Render").unwrap().name, "render");
        }
        files.insert(
            "types.ts".into(),
            TsFileFacts::parse("types.ts", b"export class Box {}"),
        );
        files.insert(
            "main.ts".into(),
            TsFileFacts::parse(
                "main.ts",
                b"import {Box} from './types'; export function caller(x: Box) {}",
            ),
        );
        assert!(imported(&files, "Box", DependencyUse::Import).is_none());
        assert!(reference(&files, "Box").is_none());
    }

    #[test]
    fn dependencies_resolve_aliases_defaults_types_and_non_callable_variables() {
        let files = files(&[
            (
                "types.ts",
                "export class Box {}\nexport type Payload = string;\nexport const schema = {value: 1};\nexport default function render() {}",
            ),
            (
                "barrel.ts",
                "export {Box as Item} from './types'; export type {Payload} from './types'; export {schema} from './types';",
            ),
            (
                "main.ts",
                "import {Item as Local, type Payload, schema} from './barrel'; import Render from './types';",
            ),
        ]);
        for (local, name, kind) in [
            ("Local", "Box", DeclarationKind::Class),
            ("Payload", "Payload", DeclarationKind::TypeAlias),
            ("schema", "schema", DeclarationKind::Variable),
            ("Render", "render", DeclarationKind::Function),
        ] {
            let target = imported(&files, local, DependencyUse::Import).unwrap();
            assert_eq!(
                (target.path.as_str(), target.name.as_str(), target.kind),
                ("types.ts", name, kind)
            );
            assert!(target.dependencies.contains(&"main.ts".to_owned()));
            assert!(target.target[0] < target.target[1]);
        }
        assert!(imported(&files, "Payload", DependencyUse::Value).is_none());
        assert!(imported(&files, "schema", DependencyUse::Type).is_none());
    }

    #[test]
    fn type_only_function_identity_can_support_type_queries_but_not_values_or_calls() {
        let files = files(&[
            ("fn.ts", "export function run() {}"),
            (
                "main.ts",
                "import type {run} from './fn'; type Shape = typeof run; function caller() { run(); }",
            ),
        ]);
        assert!(imported(&files, "run", DependencyUse::Import).is_some());
        assert!(imported(&files, "run", DependencyUse::TypeQuery).is_some());
        assert!(imported(&files, "run", DependencyUse::Value).is_none());
        assert!(
            crate::ts_imports::resolve_call(&files, "main.ts", files["main.ts"].sites[0].call[0])
                .is_none()
        );
    }

    #[test]
    fn ambiguous_modules_cycles_collisions_missing_exports_and_old_facts_abstain() {
        let cases = [
            vec![
                ("main.ts", "import {Box} from './types';"),
                ("types.ts", "export class Box {}"),
                ("types.tsx", "export class Box {}"),
            ],
            vec![
                ("main.ts", "import {Box} from './types'; class Box {}"),
                ("types.ts", "export class Box {}"),
            ],
            vec![
                ("main.ts", "import {Box} from './types';"),
                ("types.ts", "class Box {}"),
            ],
            vec![
                ("main.ts", "import {Box} from './one';"),
                ("one.ts", "export {Box} from './two';"),
                ("two.ts", "export {Box} from './one';"),
            ],
            vec![
                ("main.ts", "import {Box} from './types';"),
                ("types.ts", "export class Box {} namespace Box.Inner {}"),
            ],
        ];
        for case in cases {
            assert!(
                imported(&files(&case), "Box", DependencyUse::Import).is_none(),
                "{case:?}"
            );
        }
        let mut files = files(&[
            ("main.ts", "import {Box} from './types';"),
            ("types.ts", "export class Box {}"),
        ]);
        files.get_mut("types.ts").unwrap().declaration_facts = None;
        assert!(imported(&files, "Box", DependencyUse::Import).is_none());
    }

    #[test]
    fn declaration_identity_does_not_turn_classes_types_or_variables_into_calls() {
        let facts = TsFileFacts::parse("types.ts", b"export class Box {}\nexport type Payload = string;\nexport const schema = {value: 1};\nexport function run() {}\n");
        let declarations = facts.declaration_facts.as_ref().unwrap();
        for (name, namespace) in [
            ("Box", Namespace::Value),
            ("Payload", Namespace::Type),
            ("schema", Namespace::Value),
            ("run", Namespace::Value),
        ] {
            assert!(
                declarations.unique_declaration(name, namespace).is_some(),
                "{name}"
            );
        }
        assert!(
            declarations
                .unique_declaration("Payload", Namespace::Value)
                .is_none()
        );
        for name in ["Box", "Payload", "schema"] {
            assert!(facts.declarations[name].iter().all(|span| *span == [0, 0]));
        }
        assert_ne!(facts.declarations["run"], [[0, 0]]);
    }

    #[test]
    fn imports_keep_member_alias_default_and_type_only_identity() {
        let source = b"import Default, {Box as Local, type Payload} from './types';\nimport type {Other} from './other';\nimport * as ns from './types';\n";
        let facts = TsFileFacts::parse("main.ts", source)
            .declaration_facts
            .unwrap();
        assert_eq!(facts.imports.len(), 4);
        for item in &facts.imports {
            assert_eq!(&source[item.name[0]..item.name[1]], item.local.as_bytes());
        }
        let alias = facts.imports.iter().find(|i| i.local == "Local").unwrap();
        assert_eq!(&source[alias.member[0]..alias.member[1]], b"Box as Local");
        assert_eq!(facts.imports[0].imported, "default");
        assert!(
            facts
                .imports
                .iter()
                .filter(|i| i.type_only)
                .map(|i| &i.local)
                .eq(["Payload", "Other"])
        );
        assert!(facts.blockers.contains_key("ns"));
    }

    #[test]
    fn duplicate_merge_and_unsupported_bindings_cannot_supply_a_unique_target() {
        for source in [
            "class Box {} class Box {}",
            "type Box = string; const Box = 1;",
            "class Box {} namespace Box {}",
            "class Box {} const {Box} = other;",
        ] {
            let facts = TsFileFacts::parse("main.ts", source.as_bytes())
                .declaration_facts
                .unwrap();
            assert!(
                facts.unique_declaration("Box", Namespace::Type).is_none(),
                "{source}"
            );
        }
    }
}
