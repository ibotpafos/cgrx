//! Swift syntax definitions and a deliberately closed, same-file proof slice.
//!
//! This is not Swift type checking. In particular, a spelling is never enough
//! to identify an imported overload, witness, inherited member or closure call.
use crate::pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, Span, Symbol,
    UnresolvedKind, normalize_extraction, text, unresolved, walk_with,
};
use std::path::Path;
use tree_sitter::{Language, Node, Parser};

pub(crate) static SWIFT_PACK: Swift = Swift;
pub(crate) struct Swift;

impl LanguagePack for Swift {
    fn id(&self) -> &'static str {
        "swift"
    }
    fn extensions(&self) -> &'static [&'static str] {
        &["swift"]
    }
    fn language(&self) -> Language {
        tree_sitter_swift::LANGUAGE.into()
    }

    fn extract(&self, path: &Path, source: &[u8]) -> Result<Extraction, ExtractError> {
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
        let root = tree.root_node();
        let mut out = Extraction::default();
        let mut nodes = Vec::new();
        walk_with(root, source, &mut out, false, &mut |node, source, out| {
            self.classify(node, source, out);
            nodes.push(node);
        });
        let declarations: Vec<_> = nodes
            .iter()
            .flat_map(|&node| {
                declaration_names(node)
                    .into_iter()
                    .map(move |name| Decl { node, name })
            })
            .collect();
        // Directives are siblings of declarations in this grammar. A branch
        // cannot be evaluated without the build configuration. Unknown attached
        // attributes may be macros that introduce overloads anywhere in scope.
        let closed_file = out.parser_error_ranges.is_empty()
            && !nodes.iter().any(|&node| {
                matches!(
                    node.kind(),
                    "directive" | "macro_invocation" | "macro_declaration"
                ) || (node.kind() == "attribute" && !known_attribute(node, source))
            });
        let proof = Proof {
            source,
            declarations,
            closed_file,
        };
        for &node in &nodes {
            match node.kind() {
                "call_expression" => {
                    // The grammar represents defer as a call with a closure.
                    // A defer statement has no callee of its own.
                    if node.named_child(0).is_some_and(|first| {
                        first.kind() == "simple_identifier" && text(first, source) == "defer"
                    }) && source
                        .get(node.start_byte()..node.end_byte())
                        .is_some_and(|bytes| {
                            bytes
                                .strip_prefix(b"defer")
                                .is_some_and(|tail| tail.trim_ascii_start().starts_with(b"{"))
                        })
                    {
                        continue;
                    }
                    if let Some((owner, target)) = proof.call(node) {
                        proof.edge(RelationKind::Calls, node, owner, target, &mut out);
                    } else {
                        unresolved(UnresolvedKind::Dispatch, node, source, &mut out);
                    }
                }
                "constructor_expression" | "macro_invocation" => {
                    unresolved(UnresolvedKind::Dispatch, node, source, &mut out);
                }
                "user_type" => {
                    // Effects and language-defined Any/Self are exposed as
                    // user_type by this grammar. They name no user declaration;
                    // escaped identifiers remain ordinary dependencies.
                    if matches!(
                        text(node, source).as_str(),
                        "throws" | "rethrows" | "Any" | "Self" | "Any.Type" | "Self.Type"
                    ) {
                        continue;
                    }
                    if node
                        .parent()
                        .is_some_and(|parent| parent.kind() == "attribute")
                        && matches!(
                            text(node, source).as_str(),
                            "main"
                                | "available"
                                | "discardableResult"
                                | "inlinable"
                                | "inline"
                                | "usableFromInline"
                                | "Sendable"
                                | "escaping"
                                | "autoclosure"
                                | "preconcurrency"
                                | "objc"
                                | "objcMembers"
                                | "nonobjc"
                                | "unchecked"
                        )
                    {
                        continue;
                    }
                    out.swift_type_references.push(node.into());
                    if let Some((owner, target)) = proof.type_reference(node) {
                        proof.edge(RelationKind::References, node, owner, target, &mut out);
                    } else {
                        unresolved(UnresolvedKind::Dispatch, node, source, &mut out);
                    }
                }
                _ => {}
            }
        }
        normalize_extraction(&mut out);
        Ok(out)
    }

    fn classify(&self, node: Node<'_>, source: &[u8], out: &mut Extraction) {
        // External-scanner missing tokens may be hidden from children() and
        // is_missing(). Keep the resulting parser limitation visible.
        if node.has_error() && node.child_count() == 0 && !node.is_error() && !node.is_missing() {
            let start = node.start_byte().min(source.len());
            let end = std::str::from_utf8(&source[start..])
                .ok()
                .and_then(|text| text.chars().next())
                .map_or(start, |character| start + character.len_utf8());
            out.parser_error_ranges.push(Span { start, end });
        }
        for name in declaration_names(node) {
            out.symbols.push(Symbol {
                name: text(name, source),
                span: name.into(),
                search_span: node.into(),
            });
        }
        if node.kind() == "import_declaration" {
            // Modifiers (@testable, @_exported) may precede the import path.
            if let Some(path) = children(node)
                .into_iter()
                .find(|child| child.kind() == "identifier")
            {
                out.edges.push(Edge {
                    relation: RelationKind::Imports,
                    target: text(path, source),
                    span: node.into(),
                    context_span: node.into(),
                    provenance: Provenance::Syntax,
                });
            }
        }
    }
}

#[derive(Clone, Copy)]
struct Decl<'a> {
    node: Node<'a>,
    name: Node<'a>,
}

impl Decl<'_> {
    fn span(self) -> Span {
        self.name.into()
    }
    fn is_type(self) -> bool {
        matches!(
            self.node.kind(),
            "class_declaration"
                | "protocol_declaration"
                | "typealias_declaration"
                | "associatedtype_declaration"
        ) && declaration_kind(self.node) != "extension"
    }
}

fn children(node: Node<'_>) -> Vec<Node<'_>> {
    let mut cursor = node.walk();
    node.named_children(&mut cursor).collect()
}

fn keyword<'a>(node: Node<'a>, kind: &str) -> Option<Node<'a>> {
    let mut cursor = node.walk();
    node.children(&mut cursor)
        .find(|child| child.kind() == kind)
}

fn declaration_kind(node: Node<'_>) -> &'static str {
    node.child_by_field_name("declaration_kind")
        .map_or(node.kind(), |n| n.kind())
}

fn declaration_names(node: Node<'_>) -> Vec<Node<'_>> {
    match node.kind() {
        "class_declaration"
        | "protocol_declaration"
        | "typealias_declaration"
        | "associatedtype_declaration"
        | "function_declaration"
        | "protocol_function_declaration"
        | "init_declaration" => node.child_by_field_name("name").into_iter().collect(),
        // Type parameters have source identities too. Their references may be
        // joined by a compiler USR without guessing a concrete generic type.
        "type_parameter" => children(node)
            .into_iter()
            .find(|child| child.kind() == "type_identifier")
            .into_iter()
            .collect(),
        "deinit_declaration" => keyword(node, "deinit").into_iter().collect(),
        "subscript_declaration" => keyword(node, "subscript").into_iter().collect(),
        "enum_entry" => {
            let mut cursor = node.walk();
            node.children_by_field_name("name", &mut cursor).collect()
        }
        "property_declaration" | "protocol_property_declaration" if type_or_file_level(node) => {
            // Each simple binding gets its own byte selector, even in `var a=1,b=2`.
            // Tuple/destructuring patterns are intentionally not renamed into definitions.
            children(node)
                .into_iter()
                .filter(|n| n.kind() == "pattern")
                .filter_map(|n| {
                    let names = children(n);
                    (names.len() == 1 && names[0].kind() == "simple_identifier").then(|| names[0])
                })
                .collect()
        }
        _ => Vec::new(),
    }
}

fn type_or_file_level(node: Node<'_>) -> bool {
    node.parent().is_some_and(|p| {
        matches!(
            p.kind(),
            "source_file" | "class_body" | "enum_class_body" | "protocol_body"
        )
    })
}

fn contains(outer: Node<'_>, inner: Node<'_>) -> bool {
    outer.start_byte() <= inner.start_byte() && inner.end_byte() <= outer.end_byte()
}

fn spelling(node: Node<'_>, source: &[u8]) -> String {
    text(node, source).trim_matches('`').to_owned()
}

fn any(node: Node<'_>, predicate: &impl Fn(Node<'_>) -> bool) -> bool {
    predicate(node)
        || children(node)
            .into_iter()
            .any(|child| any(child, predicate))
}

fn has_direct(node: Node<'_>, kind: &str) -> bool {
    children(node).iter().any(|n| n.kind() == kind)
}

fn modifier(node: Node<'_>, value: &str, source: &[u8]) -> bool {
    // Only modifiers, never text from bodies, comments or string literals.
    children(node)
        .into_iter()
        .filter(|n| n.kind() == "modifiers")
        .any(|n| any(n, &|n| text(n, source) == value))
        || keyword(node, value).is_some()
}

fn known_attribute(node: Node<'_>, source: &[u8]) -> bool {
    let Some(name) = children(node).into_iter().find(|n| n.kind() == "user_type") else {
        return false;
    };
    matches!(
        text(name, source).as_str(),
        "MainActor"
            | "available"
            | "discardableResult"
            | "inlinable"
            | "inline"
            | "usableFromInline"
            | "Sendable"
            | "escaping"
            | "autoclosure"
            | "preconcurrency"
            | "objc"
            | "objcMembers"
            | "nonobjc"
    )
}

struct Proof<'a> {
    source: &'a [u8],
    declarations: Vec<Decl<'a>>,
    closed_file: bool,
}

impl<'a> Proof<'a> {
    fn edge(
        &self,
        relation: RelationKind,
        site: Node<'_>,
        owner: Decl<'_>,
        target: Decl<'_>,
        out: &mut Extraction,
    ) {
        out.edges.push(Edge {
            relation,
            target: text(target.name, self.source),
            span: site.into(),
            context_span: site.into(),
            provenance: Provenance::SwiftExact {
                owner: owner.span(),
                target: target.span(),
            },
        });
    }

    fn owner(&self, site: Node<'_>) -> Option<Decl<'a>> {
        let smallest = self
            .declarations
            .iter()
            .filter(|d| contains(d.node, site))
            .min_by_key(|d| d.node.end_byte() - d.node.start_byte())?;
        // A multi-binding declaration has several equally small owners.
        (self
            .declarations
            .iter()
            .filter(|d| d.node == smallest.node)
            .count()
            == 1)
            .then_some(*smallest)
    }

    fn blocked_context(&self, mut site: Node<'_>) -> bool {
        loop {
            if matches!(
                site.kind(),
                "lambda_literal"
                    | "closure_expression"
                    | "attribute"
                    | "selector_expression"
                    | "key_path_expression"
            ) {
                return true;
            }
            let Some(parent) = site.parent() else {
                return false;
            };
            site = parent;
        }
    }

    fn lexical_shadow(&self, owner: Decl<'_>, name: &str) -> bool {
        let mut scope = Some(owner.node);
        while let Some(node) = scope {
            if node.kind() == "source_file" {
                break;
            }
            if self.shadows(node, name) {
                return true;
            }
            scope = node.parent();
        }
        false
    }

    // A local binding anywhere in a lexical owner is a blocker. This deliberately
    // overapproximates branch and declaration-order scopes, rather than guessing.
    fn shadows(&self, scope: Node<'_>, name: &str) -> bool {
        any(scope, &|node| {
            // Optional bindings in if/guard/while are flattened by 0.7.3;
            // unlike for-loop bindings, they need not have a pattern node.
            let mut cursor = node.walk();
            if node
                .children_by_field_name("bound_identifier", &mut cursor)
                .any(|binding| {
                    any(binding, &|n| {
                        matches!(n.kind(), "simple_identifier" | "type_identifier")
                            && spelling(n, self.source) == name
                    })
                })
            {
                return true;
            }
            match node.kind() {
                "parameter" => node
                    .child_by_field_name("name")
                    .is_some_and(|n| spelling(n, self.source) == name),
                "pattern" | "type_parameter" => any(node, &|n| {
                    matches!(n.kind(), "simple_identifier" | "type_identifier")
                        && spelling(n, self.source) == name
                }),
                "function_declaration"
                | "class_declaration"
                | "typealias_declaration"
                | "associatedtype_declaration"
                    if node != scope =>
                {
                    node.child_by_field_name("name")
                        .is_some_and(|n| spelling(n, self.source) == name)
                }
                // `catch { ... }` introduces an implicit `error` binding.
                "catch_block" => name == "error",
                _ => false,
            }
        })
    }

    fn local_type(&self, name: &str) -> Option<Decl<'a>> {
        let mut types = self.declarations.iter().filter(|d| {
            d.is_type()
                && d.node.parent().is_some_and(|p| p.kind() == "source_file")
                && spelling(d.name, self.source) == name
        });
        let target = *types.next()?;
        types.next().is_none().then_some(target)
    }

    fn type_reference(&self, site: Node<'_>) -> Option<(Decl<'a>, Decl<'a>)> {
        if !self.closed_file {
            return None;
        }
        let owner = self.owner(site)?;
        if self.blocked_context(site) {
            return None;
        }
        let names: Vec<_> = children(site)
            .into_iter()
            .filter(|n| n.kind() == "type_identifier")
            .collect();
        let [name] = names.as_slice() else {
            return None;
        }; // Qualified/nested lookup needs a type checker.
        let name = spelling(*name, self.source);
        let target = self.local_type(&name)?;
        // Another source file may extend a visible nominal with a nested
        // typealias that changes this lookup. A same-file spelling cannot rule
        // that out. Only a file-private, closed nominal owns a closed type
        // scope; top-level uses and the extension's own header remain exact.
        let mut nominal_context = None;
        let mut ancestor = site.parent();
        while let Some(node) = ancestor {
            if matches!(node.kind(), "class_declaration" | "protocol_declaration") {
                if nominal_context.is_some() {
                    return None;
                }
                nominal_context = Some(node);
            }
            ancestor = node.parent();
        }
        if let Some(context) = nominal_context {
            let extension_header = declaration_kind(context) == "extension"
                && context
                    .child_by_field_name("name")
                    .is_some_and(|name| contains(name, site));
            if !extension_header {
                let nominal = if declaration_kind(context) == "extension" {
                    self.nominal_for(owner)?
                } else {
                    *self
                        .declarations
                        .iter()
                        .find(|declaration| declaration.node == context)?
                };
                if !self.file_private_nominal(nominal) {
                    return None;
                }
            }
        }
        // Type syntax in expressions (constructors, metatypes, member access)
        // is left unresolved. Generic arguments in genuine type syntax are fine.
        let mut parent = site.parent();
        while let Some(node) = parent {
            if matches!(
                node.kind(),
                "attribute"
                    | "call_expression"
                    | "constructor_expression"
                    | "navigation_expression"
                    | "macro_invocation"
                    | "lambda_literal"
            ) {
                return None;
            }
            if has_direct(node, "type_parameters")
                && self.shadows(
                    node.child_by_field_name("type_parameters").or_else(|| {
                        children(node)
                            .into_iter()
                            .find(|n| n.kind() == "type_parameters")
                    })?,
                    &name,
                )
            {
                return None;
            }
            // Nested typealiases and associated types can hide a top-level type.
            if self.declarations.iter().any(|d| {
                d.node != target.node
                    && d.node != owner.node
                    && d.is_type()
                    && spelling(d.name, self.source) == name
                    && d.node
                        .parent()
                        .is_some_and(|p| contains(node, p) && p.kind() != "source_file")
            }) {
                return None;
            }
            parent = node.parent();
        }
        if self.shadows(owner.node, &name) {
            return None;
        }
        Some((owner, target))
    }

    fn nominal_for(&self, owner: Decl<'_>) -> Option<Decl<'a>> {
        let body = owner.node.parent()?;
        if !matches!(body.kind(), "class_body" | "enum_class_body") {
            return None;
        }
        let nominal = body.parent()?;
        let name = nominal.child_by_field_name("name")?;
        let name = if declaration_kind(nominal) == "extension" {
            let names = children(name);
            let [name] = names.as_slice() else {
                return None;
            };
            if name.kind() != "type_identifier" {
                return None;
            }
            spelling(*name, self.source)
        } else {
            spelling(name, self.source)
        };
        let target = self.local_type(&name)?;
        (target.node.kind() == "class_declaration").then_some(target)
    }

    fn plain_nominal(&self, nominal: Decl<'_>) -> bool {
        !has_direct(nominal.node, "inheritance_specifier")
            && !has_direct(nominal.node, "type_parameters")
            && !has_direct(nominal.node, "type_constraints")
            && !any(nominal.node, &|n| {
                n.kind() == "attribute" && text(n, self.source).starts_with("@objc")
            })
    }

    fn file_private_nominal(&self, nominal: Decl<'a>) -> bool {
        nominal
            .node
            .parent()
            .is_some_and(|parent| parent.kind() == "source_file")
            && (modifier(nominal.node, "private", self.source)
                || modifier(nominal.node, "fileprivate", self.source))
            && self.members(nominal, "").is_some()
    }

    fn void_statement(&self, site: Node<'_>, target: Decl<'_>, labels: &[String]) -> bool {
        let returns_void = target
            .node
            .child_by_field_name("return_type")
            .is_none_or(|node| text(node, self.source) == "()");
        let mut statement = site;
        while let Some(parent) = statement
            .parent()
            .filter(|node| matches!(node.kind(), "try_expression" | "await_expression"))
        {
            statement = parent;
        }
        labels.is_empty()
            && returns_void
            && statement
                .parent()
                .is_some_and(|parent| parent.kind() == "statements")
    }

    fn members(&self, nominal: Decl<'a>, name: &str) -> Option<Vec<Decl<'a>>> {
        if !self.plain_nominal(nominal) {
            return None;
        }
        let type_name = spelling(nominal.name, self.source);
        // Constrained extensions may supply different overloads or conformances.
        for ext in self
            .declarations
            .iter()
            .filter(|d| declaration_kind(d.node) == "extension")
        {
            // A qualified or aliased extension may add overloads to this very
            // nominal. Without semantic type expansion its identity is unknown.
            let parts = children(ext.name);
            let [part] = parts.as_slice() else {
                return None;
            };
            if part.kind() != "type_identifier"
                || self
                    .local_type(&spelling(*part, self.source))
                    .is_some_and(|d| d.node.kind() == "typealias_declaration")
            {
                return None;
            }
            if text(ext.name, self.source) == type_name && !self.plain_nominal(*ext) {
                return None;
            }
        }
        Some(
            self.declarations
                .iter()
                .filter(|d| {
                    spelling(d.name, self.source) == name
                        && self
                            .nominal_for(**d)
                            .is_some_and(|n| n.span() == nominal.span())
                })
                .copied()
                .collect(),
        )
    }

    fn labels(&self, function: Node<'_>) -> Option<Vec<String>> {
        if function.kind() != "function_declaration"
            || function.child_by_field_name("body").is_none()
            || has_direct(function, "type_parameters")
            || has_direct(function, "type_constraints")
            || function.child_by_field_name("default_value").is_some()
            || any(function, &|n| {
                n.kind() == "attribute"
                    && matches!(text(n, self.source).as_str(), "@objc" | "@autoclosure")
            })
            || modifier(function, "dynamic", self.source)
            || modifier(function, "override", self.source)
        {
            return None;
        }
        let mut labels = Vec::new();
        for p in children(function)
            .into_iter()
            .filter(|n| n.kind() == "parameter")
        {
            if keyword(p, "...").is_some() {
                return None;
            }
            let name = p
                .child_by_field_name("external_name")
                .or_else(|| p.child_by_field_name("name"))?;
            let label = spelling(name, self.source);
            labels.push(if label == "_" { String::new() } else { label });
        }
        Some(labels)
    }

    fn call(&self, site: Node<'_>) -> Option<(Decl<'a>, Decl<'a>)> {
        if !self.closed_file {
            return None;
        }
        let owner = self.owner(site)?;
        if !matches!(
            owner.node.kind(),
            "function_declaration" | "init_declaration" | "deinit_declaration"
        ) || self.blocked_context(site)
            || has_direct(owner.node, "type_parameters")
            || any(site, &|n| n.kind() == "lambda_literal")
        {
            return None;
        }
        let function = site.named_child(0)?;
        let suffix = site.named_child(1)?;
        if suffix.kind() != "call_suffix" {
            return None;
        }
        let arguments = children(suffix);
        let [arguments] = arguments.as_slice() else {
            return None;
        };
        if arguments.kind() != "value_arguments" || !text(*arguments, self.source).starts_with('(')
        {
            return None;
        }
        let labels: Option<Vec<String>> = children(*arguments)
            .into_iter()
            .map(|argument| {
                if argument.kind() != "value_argument"
                    || argument.child_by_field_name("value").is_none()
                {
                    return None;
                }
                Some(
                    argument
                        .child_by_field_name("name")
                        .map_or_else(String::new, |n| spelling(n, self.source)),
                )
            })
            .collect();
        let labels = labels?;
        let (name, nominal, static_call) = if function.kind() == "simple_identifier" {
            let name = spelling(function, self.source);
            if self.shadows(owner.node, &name) {
                return None;
            }
            let nominal = self.nominal_for(owner);
            if nominal.is_none() && owner.node.parent()?.kind() != "source_file" {
                return None;
            }
            (name, nominal, modifier(owner.node, "static", self.source))
        } else if function.kind() == "navigation_expression" {
            let receiver = function.child_by_field_name("target")?;
            let suffix = function.child_by_field_name("suffix")?;
            let name = spelling(suffix.child_by_field_name("suffix")?, self.source);
            let receiver_name = spelling(receiver, self.source);
            if receiver_name == "self" {
                // A local `self` rebinding (e.g. optional self in closures) is
                // excluded with closures; patterns still block it defensively.
                if self.shadows(owner.node, "self") {
                    return None;
                }
                (
                    name,
                    Some(self.nominal_for(owner)?),
                    modifier(owner.node, "static", self.source),
                )
            } else if receiver_name == "Self" {
                let nominal = self.nominal_for(owner)?;
                // Dynamic Self in a non-final class is not the declared type.
                if declaration_kind(nominal.node) == "class"
                    && !modifier(nominal.node, "final", self.source)
                {
                    return None;
                }
                (name, Some(nominal), true)
            } else {
                if !matches!(receiver.kind(), "simple_identifier" | "user_type")
                    || self.lexical_shadow(owner, &receiver_name)
                {
                    return None;
                }
                let nominal = self.local_type(&receiver_name)?;
                if nominal.node.kind() != "class_declaration" {
                    return None;
                }
                (name, Some(nominal), true)
            }
        } else {
            return None;
        };
        let candidates = if let Some(nominal) = nominal {
            self.members(nominal, &name)?
        } else {
            // Global variables/closures and types share the value lookup scope.
            self.declarations
                .iter()
                .filter(|d| {
                    d.node.parent().is_some_and(|p| p.kind() == "source_file")
                        && spelling(d.name, self.source) == name
                })
                .copied()
                .collect()
        };
        let mut matching = Vec::new();
        for candidate in candidates {
            // Even an unsupported overload can participate through defaults,
            // variadics or generic inference. Do not filter it out by guesswork.
            let candidate_labels = self.labels(candidate.node)?;
            if candidate_labels == labels {
                matching.push(candidate);
            }
        }
        let [target] = matching.as_slice() else {
            return None;
        };
        let target = *target;
        if let Some(nominal) = nominal {
            // A different file can add a label-matched overload or a different
            // contextual return type. Broad member lookup is closed only for
            // file-private types. Visible types retain the same zero-argument
            // Void statement slice used for free functions.
            if !self.file_private_nominal(nominal) && !self.void_statement(site, target, &labels) {
                return None;
            }
            if static_call != modifier(target.node, "static", self.source) {
                return None;
            }
            if !static_call
                && declaration_kind(nominal.node) == "class"
                && !modifier(nominal.node, "final", self.source)
                && !modifier(target.node, "final", self.source)
            {
                return None;
            }
            if modifier(target.node, "class", self.source) {
                return None;
            }
        } else {
            // Same-module zero-argument Void functions at a statement site win
            // lookup over imported names. With arguments or contextual return
            // typing, an imported overload may be selected instead.
            if !self.void_statement(site, target, &labels) {
                return None;
            }
        }
        Some((owner, target))
    }
}
