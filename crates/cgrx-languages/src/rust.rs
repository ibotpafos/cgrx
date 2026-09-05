use crate::pack::{
    Edge, Extraction, LanguagePack, Provenance, RelationKind, Span, UnresolvedKind, evidence_span,
    symbol, text, unresolved,
};
use tree_sitter::{Language, Node};

pub(crate) static RUST: Rust = Rust;

pub(crate) struct Rust;

impl LanguagePack for Rust {
    fn id(&self) -> &'static str {
        "rust"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["rs"]
    }

    fn language(&self) -> Language {
        tree_sitter_rust::LANGUAGE.into()
    }

    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
        match node.kind() {
            "source_file" => extraction.rust_file = Some(file_facts(node, source)),
            "function_item" | "struct_item" | "enum_item" | "trait_item" | "type_item" => {
                symbol(node, source, extraction);
            }
            "use_declaration" => extraction.edges.push(Edge {
                relation: RelationKind::Imports,
                target: text(node, source),
                span: Span::from(node),
                context_span: Span::from(node),
                provenance: Provenance::Syntax,
            }),
            "call_expression" => {
                let Some(function) = node.child_by_field_name("function") else {
                    return;
                };
                if let Some((target, provenance)) = static_call_target(node, function, source) {
                    extraction.edges.push(Edge {
                        relation: RelationKind::Calls,
                        target: text(target, source),
                        span: Span::from(node),
                        context_span: evidence_span(
                            node,
                            &[
                                "let_declaration",
                                "expression_statement",
                                "return_expression",
                            ],
                        ),
                        provenance,
                    });
                } else {
                    unresolved(UnresolvedKind::Dispatch, node, source, extraction);
                }
            }
            _ => {}
        }
    }
}

fn static_call_target<'tree>(
    call: Node<'tree>,
    mut function: Node<'tree>,
    source: &[u8],
) -> Option<(Node<'tree>, Provenance)> {
    while function.kind() == "generic_function" {
        function = function
            .child_by_field_name("function")
            .or_else(|| function.named_child(0))?;
    }
    if function.kind() == "identifier" {
        if locally_bound_before(call, &text(function, source), source) {
            return None;
        }
        return Some((function, Provenance::Syntax));
    }
    if function.kind() == "scoped_identifier" {
        let qualifier = function.child_by_field_name("path")?;
        if text(qualifier, source) == "Self" {
            let name = function.child_by_field_name("name")?;
            return Some((name, self_method_proof(call, name, source, false)?));
        }
        if let Some(proof) = module_call_proof(call, function, source) {
            return Some((function, proof));
        }
        // Associated-type projections and trait-qualified calls need distinct
        // proofs. Never flatten them to a coincidentally matching method name.
        let mut root = qualifier;
        while let Some(path) = root.child_by_field_name("path") {
            root = path;
        }
        if text(root, source) == "Self" || text(qualifier, source).starts_with('<') {
            return None;
        }
        return Some((function, Provenance::Syntax));
    }
    if function.kind() != "field_expression" {
        return None;
    }
    let receiver = function.child_by_field_name("value")?;
    // A field name is not a receiver-type proof. Never turn Vec::push,
    // generic/foreign methods or chained calls into unrelated free functions.
    if receiver.kind() != "self" {
        return None;
    }
    let field = function.child_by_field_name("field")?;
    Some((field, self_method_proof(call, field, source, true)?))
}

fn self_method_proof(
    call: Node<'_>,
    field: Node<'_>,
    source: &[u8],
    receiver_call: bool,
) -> Option<Provenance> {
    let mut caller = call;
    while caller.kind() != "function_item" {
        caller = caller.parent()?;
    }
    if receiver_call && !has_self_parameter(caller) {
        return None;
    }
    let body = caller.parent()?;
    let implementation = body.parent()?;
    if implementation.kind() != "impl_item"
        || implementation.has_error()
        || implementation.child_by_field_name("trait").is_some()
        || implementation
            .child_by_field_name("type_parameters")
            .is_some()
        || attributed(implementation)
    {
        return None;
    }
    let owner_type = implementation.child_by_field_name("type")?;
    if owner_type.kind() != "type_identifier" {
        return None;
    }
    let owner_name = text(owner_type, source);
    let module = implementation.parent()?;
    let mut cursor = module.walk();
    let mut owners = module.named_children(&mut cursor).filter(|n| {
        matches!(n.kind(), "struct_item" | "enum_item")
            && n.child_by_field_name("name")
                .is_some_and(|name| text(name, source) == owner_name)
    });
    let owner = owners.next()?;
    if owners.next().is_some() || attributed(owner) {
        return None;
    }
    // Resolve only plain inherent impls in the same lexical module. The owner
    // identity is its declaration span, never a matching method name elsewhere.
    let mut cursor = module.walk();
    let implementations: Vec<_> = module
        .named_children(&mut cursor)
        .filter(|n| {
            n.kind() == "impl_item"
                && n.child_by_field_name("type")
                    .is_some_and(|ty| text(ty, source) == owner_name)
        })
        .collect();
    let name = text(field, source);
    let mut targets = Vec::new();
    for candidate in implementations {
        if candidate.has_error()
            || attributed(candidate)
            || candidate.child_by_field_name("trait").is_some()
            || candidate.child_by_field_name("type_parameters").is_some()
        {
            return None;
        }
        let candidate_body = candidate.child_by_field_name("body")?;
        let mut cursor = candidate_body.walk();
        let members: Vec<_> = candidate_body.named_children(&mut cursor).collect();
        if members.iter().any(|n| {
            !(matches!(n.kind(), "function_item" | "line_comment" | "block_comment")
                || n.kind() == "attribute_item" && non_binding_attribute(*n, source))
        }) {
            return None;
        }
        for member in members {
            if member.kind() == "function_item"
                && member
                    .child_by_field_name("name")
                    .is_some_and(|n| text(n, source) == name)
            {
                targets.push((member, candidate));
            }
        }
    }
    let [(target, target_implementation)] = targets.as_slice() else {
        return None;
    };
    if receiver_call && !has_self_parameter(*target) {
        return None;
    }
    Some(Provenance::RustSelf {
        owner: Span::from(owner.child_by_field_name("name")?),
        implementation: Span::from(implementation),
        target_implementation: Span::from(*target_implementation),
        caller: Span::from(caller.child_by_field_name("name")?),
        target: Span::from(target.child_by_field_name("name")?),
    })
}

// Deliberately tiny whitelist: these built-ins cannot add/remove/rename methods.
// cfg, proc macros, derive and unknown attributes still stop the owner proof.
fn non_binding_attribute(attribute: Node<'_>, source: &[u8]) -> bool {
    matches!(
        text(attribute, source)
            .chars()
            .filter(|c| !c.is_whitespace())
            .collect::<String>()
            .as_str(),
        "#[must_use]" | "#[inline]"
    )
}

fn has_self_parameter(method: Node<'_>) -> bool {
    method
        .child_by_field_name("parameters")
        .is_some_and(|parameters| {
            let mut cursor = parameters.walk();
            parameters
                .named_children(&mut cursor)
                .any(|p| p.kind() == "self_parameter")
        })
}

fn attributed(node: Node<'_>) -> bool {
    let mut previous = node.prev_named_sibling();
    while let Some(n) = previous {
        if matches!(n.kind(), "line_comment" | "block_comment") {
            previous = n.prev_named_sibling();
        } else {
            return matches!(n.kind(), "attribute_item" | "inner_attribute_item");
        }
    }
    false
}

// Walk only lexical ancestors and their immediately preceding declarations. A binding
// becomes visible after its initializer/let-else, never in a sibling or expired scope.
fn locally_bound_before(call: Node<'_>, binding: &str, source: &[u8]) -> bool {
    let mut child = call;
    while let Some(scope) = child.parent() {
        let declares = |pattern| pattern_binds(pattern, binding, source);
        match scope.kind() {
            "block" => {
                let mut cursor = scope.walk();
                if scope.named_children(&mut cursor).any(|statement| {
                    statement.end_byte() <= child.start_byte()
                        && statement.kind() == "let_declaration"
                        && statement
                            .child_by_field_name("pattern")
                            .is_some_and(declares)
                }) {
                    return true;
                }
            }
            "function_item" | "closure_expression" => {
                if scope
                    .child_by_field_name("parameters")
                    .is_some_and(|parameters| {
                        let mut cursor = parameters.walk();
                        parameters.named_children(&mut cursor).any(|parameter| {
                            declares(
                                parameter
                                    .child_by_field_name("pattern")
                                    .unwrap_or(parameter),
                            )
                        })
                    })
                {
                    return true;
                }
                // Nested functions cannot capture an enclosing function's locals;
                // closures can, so keep walking through their outer scopes.
                if scope.kind() == "function_item" {
                    return false;
                }
            }
            "for_expression" => {
                if scope.child_by_field_name("body") == Some(child)
                    && scope.child_by_field_name("pattern").is_some_and(declares)
                {
                    return true;
                }
            }
            "match_arm" => {
                if scope.child_by_field_name("pattern").is_some_and(|pattern| {
                    declares(pattern)
                        || pattern
                            .child_by_field_name("condition")
                            .is_some_and(|condition| {
                                condition_binds_before(
                                    condition,
                                    call.start_byte(),
                                    binding,
                                    source,
                                )
                            })
                }) {
                    return true;
                }
            }
            "if_expression" | "while_expression" => {
                // Success bindings extend through later let-chain operands and the
                // success body, but not the initializer, else branch or following code.
                if scope.child_by_field_name("alternative") != Some(child)
                    && scope
                        .child_by_field_name("condition")
                        .is_some_and(|condition| {
                            condition_binds_before(condition, call.start_byte(), binding, source)
                        })
                {
                    return true;
                }
            }
            _ => {}
        }
        child = scope;
    }
    false
}

fn condition_binds_before(
    condition: Node<'_>,
    before: usize,
    binding: &str,
    source: &[u8],
) -> bool {
    match condition.kind() {
        "let_condition" => {
            condition.end_byte() <= before
                && condition
                    .child_by_field_name("pattern")
                    .is_some_and(|pattern| pattern_binds(pattern, binding, source))
        }
        "let_chain" => {
            let mut cursor = condition.walk();
            condition
                .named_children(&mut cursor)
                .any(|part| condition_binds_before(part, before, binding, source))
        }
        _ => false,
    }
}

fn pattern_binds(pattern: Node<'_>, binding: &str, source: &[u8]) -> bool {
    match pattern.kind() {
        "identifier" | "shorthand_field_identifier" => {
            let name = text(pattern, source);
            name.strip_prefix("r#").unwrap_or(&name)
                == binding.strip_prefix("r#").unwrap_or(binding)
        }
        "field_pattern" => pattern
            .child_by_field_name("pattern")
            .or_else(|| pattern.child_by_field_name("name"))
            .is_some_and(|field| pattern_binds(field, binding, source)),
        "tuple_pattern"
        | "slice_pattern"
        | "tuple_struct_pattern"
        | "struct_pattern"
        | "ref_pattern"
        | "reference_pattern"
        | "mut_pattern"
        | "captured_pattern"
        | "or_pattern"
        | "match_pattern" => {
            let constructor = pattern.child_by_field_name("type");
            let guard = pattern.child_by_field_name("condition");
            let mut cursor = pattern.walk();
            pattern.named_children(&mut cursor).any(|part| {
                Some(part) != constructor
                    && Some(part) != guard
                    && pattern_binds(part, binding, source)
            })
        }
        // An unexpanded pattern macro may introduce the queried binding.
        "macro_invocation" => true,
        // Types, field labels, paths, literals, wildcards and range endpoints
        // are not binding positions. Bare pattern names are conservatively treated
        // as bindings: distinguishing constants requires semantic resolution.
        _ => false,
    }
}

// Deliberately file-local: no Cargo crate identity or external module guesses.
fn module_call_proof(call: Node<'_>, function: Node<'_>, source: &[u8]) -> Option<Provenance> {
    let path = text(function, source);
    let parts: Vec<_> = path.split("::").map(str::trim).collect();
    if !matches!(parts.first().copied(), Some("self" | "super")) {
        return None;
    }
    let mut caller = call;
    while caller.kind() != "function_item" {
        caller = caller.parent()?;
    }
    let mut module = call;
    loop {
        module = module.parent()?;
        if module.kind() == "source_file"
            || module.kind() == "declaration_list"
                && module.parent().is_some_and(|p| p.kind() == "mod_item")
        {
            break;
        }
    }
    // Validate every enclosing module, including ancestors not traversed by
    // the path: cfg/proc macros can change whether the caller exists.
    let mut ancestor = Some(module);
    while let Some(node) = ancestor {
        if (node.kind() == "source_file"
            || node.kind() == "declaration_list"
                && node.parent().is_some_and(|p| p.kind() == "mod_item"))
            && !plain_module(node, source)
        {
            return None;
        }
        ancestor = node.parent();
    }
    let mut index = 0;
    if parts[0] == "self" {
        index = 1;
    }
    while parts.get(index) == Some(&"super") {
        let owner = module.parent()?;
        if owner.kind() != "mod_item" {
            return None;
        }
        module = owner.parent()?;
        if !plain_module(module, source) {
            return None;
        }
        index += 1;
    }
    for name in &parts[index..parts.len().checked_sub(1)?] {
        let child = unique_module_member(module, name, source)?;
        if child.kind() != "mod_item" {
            return None;
        }
        module = child.child_by_field_name("body")?;
        if !plain_module(module, source) {
            return None;
        }
    }
    let target = unique_module_member(module, parts.last()?, source)?;
    if target.kind() != "function_item" {
        return None;
    }
    Some(Provenance::RustModule {
        caller: Span::from(caller.child_by_field_name("name")?),
        target: Span::from(target.child_by_field_name("name")?),
    })
}

fn plain_module(module: Node<'_>, source: &[u8]) -> bool {
    if !matches!(module.kind(), "source_file" | "declaration_list") || module.has_error() {
        return false;
    }
    if module
        .parent()
        .is_some_and(|owner| owner.kind() == "mod_item" && attributed(owner))
    {
        return false;
    }
    let mut cursor = module.walk();
    module.named_children(&mut cursor).all(|n| {
        matches!(
            n.kind(),
            "function_item"
                | "mod_item"
                | "struct_item"
                | "enum_item"
                | "trait_item"
                | "type_item"
                | "impl_item"
                | "const_item"
                | "static_item"
                | "macro_definition"
                | "line_comment"
                | "block_comment"
        ) || n.kind() == "attribute_item" && non_binding_attribute(n, source)
    })
}

fn unique_module_member<'a>(module: Node<'a>, name: &str, source: &[u8]) -> Option<Node<'a>> {
    let mut cursor = module.walk();
    let mut found = module.named_children(&mut cursor).filter(|n| {
        n.child_by_field_name("name")
            .is_some_and(|n| text(n, source) == name)
    });
    let target = found.next()?;
    found.next().is_none().then_some(target)
}

/// Ancillary, source-hash-bound facts for conservative Cargo root membership.
#[derive(Clone, Debug, Default, Eq, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct RustFileFacts {
    pub modules: Vec<String>,
    /// Plain-public out-of-line modules; restricted visibility stays unproven.
    #[serde(default)]
    pub public_modules: Vec<String>,
    /// Explicit, unambiguous aliases of direct crate-root modules.
    #[serde(default)]
    pub module_aliases: Vec<(String, String)>,
    pub functions: Vec<(String, usize, usize, bool)>,
    pub calls: Vec<(usize, usize)>,
    pub blocked_names: Vec<String>,
    pub blocked: bool,
    pub unsupported_modules: bool,
}

fn file_facts(root: Node<'_>, source: &[u8]) -> RustFileFacts {
    let mut facts = RustFileFacts {
        blocked: root.has_error(),
        ..Default::default()
    };
    let mut counts = std::collections::BTreeMap::<String, usize>::new();
    let mut cursor = root.walk();
    for item in root.named_children(&mut cursor) {
        if matches!(
            item.kind(),
            "inner_attribute_item" | "macro_invocation" | "expression_statement"
        ) {
            facts.blocked = true;
        }
        if let Some(name) = item.child_by_field_name("name") {
            let name = text(name, source);
            facts.blocked_names.push(name.clone());
            if item.kind() == "mod_item"
                && item.child_by_field_name("body").is_none()
                && attributed(item)
            {
                facts.unsupported_modules = true;
            }
            if !attributed(item) {
                if item.kind() == "mod_item" && item.child_by_field_name("body").is_none() {
                    facts.modules.push(name.clone());
                    let mut cursor = item.walk();
                    if item
                        .named_children(&mut cursor)
                        .any(|n| n.kind() == "visibility_modifier" && text(n, source) == "pub")
                    {
                        facts.public_modules.push(name.clone());
                    }
                }
                if item.kind() == "function_item" {
                    let span = item.child_by_field_name("name").unwrap();
                    let mut cursor = item.walk();
                    let public = item
                        .named_children(&mut cursor)
                        .any(|n| n.kind() == "visibility_modifier" && text(n, source) == "pub");
                    facts
                        .functions
                        .push((name, span.start_byte(), span.end_byte(), public));
                }
            }
        }
        if item.kind() == "use_declaration" {
            if let Some(argument) = item.child_by_field_name("argument") {
                import_bindings(argument, source, &mut facts);
                if !attributed(item) {
                    collect_module_aliases(argument, false, source, &mut facts);
                }
            } else {
                facts.blocked = true;
            }
        }
    }
    for name in &facts.blocked_names {
        *counts.entry(name.clone()).or_default() += 1;
    }
    facts
        .functions
        .retain(|(name, ..)| counts.get(name) == Some(&1));
    facts.modules.retain(|name| counts.get(name) == Some(&1));
    facts
        .public_modules
        .retain(|name| counts.get(name) == Some(&1));
    facts
        .module_aliases
        .retain(|(alias, _)| counts.get(alias) == Some(&1));
    collect_root_calls(root, root, source, &mut facts);
    facts.blocked_names.sort();
    facts.blocked_names.dedup();
    facts
}

// Only direct crate-root modules: grouping changes syntax, not resolution scope.
fn collect_module_aliases(
    node: Node<'_>,
    crate_group: bool,
    source: &[u8],
    facts: &mut RustFileFacts,
) {
    match node.kind() {
        "use_list" => {
            let mut cursor = node.walk();
            for child in node.named_children(&mut cursor) {
                collect_module_aliases(child, crate_group, source, facts);
            }
        }
        "scoped_use_list" => {
            let (Some(path), Some(list)) = (
                node.child_by_field_name("path"),
                node.child_by_field_name("list"),
            ) else {
                return;
            };
            if !crate_group && text(path, source) == "crate" {
                collect_module_aliases(list, true, source, facts);
            } else if let Some(module) = direct_crate_module(path, crate_group, source) {
                let mut cursor = list.walk();
                for child in list.named_children(&mut cursor) {
                    if child.kind() == "use_as_clause"
                        && child
                            .child_by_field_name("path")
                            .is_some_and(|p| p.kind() == "self")
                        && let Some(alias) = child.child_by_field_name("alias")
                        && alias.kind() == "identifier"
                        && text(alias, source) != "_"
                    {
                        facts
                            .module_aliases
                            .push((text(alias, source), text(module, source)));
                    }
                }
            }
        }
        "use_as_clause" => {
            let Some(path) = node.child_by_field_name("path") else {
                return;
            };
            let module = direct_crate_module(path, crate_group, source);
            if let Some(module) = module
                && let Some(alias) = node.child_by_field_name("alias")
                && alias.kind() == "identifier"
                && text(alias, source) != "_"
            {
                facts
                    .module_aliases
                    .push((text(alias, source), text(module, source)));
            }
        }
        _ => {}
    }
}

fn direct_crate_module<'a>(path: Node<'a>, crate_group: bool, source: &[u8]) -> Option<Node<'a>> {
    if crate_group && path.kind() == "identifier" {
        Some(path)
    } else if !crate_group
        && path.kind() == "scoped_identifier"
        && path
            .child_by_field_name("path")
            .is_some_and(|p| text(p, source) == "crate")
    {
        path.child_by_field_name("name")
            .filter(|n| n.kind() == "identifier")
    } else {
        None
    }
}

fn import_bindings(node: Node<'_>, source: &[u8], facts: &mut RustFileFacts) {
    match node.kind() {
        "line_comment" | "block_comment" => {}
        "identifier" => facts.blocked_names.push(text(node, source)),
        "self" => {
            let prefix = node
                .parent()
                .and_then(|n| n.parent())
                .and_then(|n| n.child_by_field_name("path"));
            if let Some(prefix) = prefix {
                let path = text(prefix, source);
                facts
                    .blocked_names
                    .push(path.rsplit("::").next().unwrap_or("").to_owned());
            } else {
                facts.blocked = true;
            }
        }
        "scoped_identifier" => {
            if let Some(name) = node.child_by_field_name("name") {
                if text(name, source) == "self" {
                    facts.blocked = true;
                } else {
                    facts.blocked_names.push(text(name, source));
                }
            } else {
                facts.blocked = true;
            }
        }
        "use_as_clause" => {
            if let Some(alias) = node.child_by_field_name("alias") {
                facts.blocked_names.push(text(alias, source));
            } else {
                facts.blocked = true;
            }
        }
        "scoped_use_list" => {
            if let Some(list) = node.child_by_field_name("list") {
                import_bindings(list, source, facts);
            } else {
                facts.blocked = true;
            }
        }
        "use_list" => {
            let mut cursor = node.walk();
            for child in node.named_children(&mut cursor) {
                import_bindings(child, source, facts);
            }
        }
        _ => facts.blocked = true,
    }
}

fn collect_root_calls(node: Node<'_>, root: Node<'_>, source: &[u8], facts: &mut RustFileFacts) {
    if node != root && (node.kind() == "mod_item" || attributed(node)) {
        return;
    }
    if matches!(node.kind(), "function_item" | "impl_item")
        && node.child_by_field_name("type_parameters").is_some()
    {
        return;
    }
    if node.kind() == "function_item" && has_namespace_expansion(node) {
        return;
    }
    if node.kind() == "call_expression" {
        facts.calls.push((node.start_byte(), node.end_byte()));
    }
    // Namespace-changing constructs in a function are conservatively excluded
    // for the whole file; built-in expression macros do not supply path proof.
    if node.parent().is_some_and(|p| p != root)
        && matches!(node.kind(), "use_declaration" | "extern_crate_declaration")
    {
        facts.blocked = true;
    }
    let mut cursor = node.walk();
    for child in node.named_children(&mut cursor) {
        collect_root_calls(child, root, source, facts);
    }
    let _ = source;
}

fn has_namespace_expansion(node: Node<'_>) -> bool {
    if matches!(
        node.kind(),
        "macro_invocation"
            | "macro_definition"
            | "use_declaration"
            | "extern_crate_declaration"
            | "mod_item"
            | "type_item"
            | "struct_item"
            | "union_item"
            | "enum_item"
            | "trait_item"
    ) {
        return true;
    }
    let mut cursor = node.walk();
    node.named_children(&mut cursor)
        .any(has_namespace_expansion)
}
