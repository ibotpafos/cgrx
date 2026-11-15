use crate::pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, Span, Symbol,
    UnresolvedKind, normalize_extraction, text, unresolved, walk_with,
};
use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;
use tree_sitter::{Language, Node, Parser};

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
        // Collect once for the whole translation unit, rather than rebuilding
        // an incomplete context for each node visited by the default walker.
        let context = CppContext::collect(root, source);
        let mut extraction = Extraction::default();
        walk_with(
            root,
            source,
            &mut extraction,
            false,
            &mut |node, source, out| {
                classify(node, source, out, &context);
            },
        );
        normalize_extraction(&mut extraction);
        Ok(extraction)
    }

    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
        classify(node, source, extraction, &CppContext::default());
    }
}

#[derive(Default)]
struct CppContext {
    definitions: BTreeMap<String, usize>,
    free_functions: BTreeMap<String, (usize, Vec<String>)>,
    blocked: BTreeSet<String>,
    unsafe_syntax: bool,
}

impl CppContext {
    fn collect(root: Node<'_>, source: &[u8]) -> Self {
        let mut context = Self {
            unsafe_syntax: root.has_error(),
            ..Self::default()
        };
        visit(root, &mut |node| {
            if let Some(span) = definition_name(node, source) {
                let name = span_text(span, source);
                *context.definitions.entry(name.clone()).or_default() += 1;
                if node.kind() == "function_definition" && plain_free_function(node) {
                    context
                        .free_functions
                        .insert(name, (node.start_byte(), namespaces(node, source)));
                }
            }
            match node.kind() {
                "preproc_def" | "preproc_function_def" => {
                    // Expansions can introduce bindings, change argument
                    // types, or replace keywords. No preprocessing proof is
                    // available, so this translation unit remains unresolved.
                    context.unsafe_syntax = true;
                }
                // A using directive can add unknown overloads. Do not infer
                // lookup through it, even when one local definition matches.
                "using_declaration" => context.unsafe_syntax = true,
                "declaration" | "field_declaration" | "type_definition"
                    if !has_ancestor(node, &["function_definition", "lambda_expression"]) =>
                {
                    for name in declarator_names(node, source) {
                        context.blocked.insert(name);
                    }
                }
                "alias_declaration"
                | "enumerator"
                | "namespace_alias_definition"
                | "class_specifier"
                | "struct_specifier"
                | "union_specifier"
                | "enum_specifier" => {
                    if !has_ancestor(node, &["function_definition", "lambda_expression"])
                        && let Some(name) = node.child_by_field_name("name")
                    {
                        context.blocked.insert(text(name, source));
                    }
                }
                _ => {}
            }
        });
        context
    }
}

fn classify(node: Node<'_>, source: &[u8], extraction: &mut Extraction, context: &CppContext) {
    if let Some(span) = definition_name(node, source) {
        extraction.symbols.push(Symbol {
            name: span_text(span, source),
            span,
            search_span: Span::from(node),
        });
    }
    match node.kind() {
        "call_expression" => {
            let Some(function) = node.child_by_field_name("function") else {
                return;
            };
            let name = text(function, source);
            let shadowed = function.kind() == "identifier" && locally_shadowed(node, &name, source);
            let kind = if function.kind() == "identifier"
                && !shadowed
                && context
                    .definitions
                    .get(&name)
                    .is_some_and(|count| *count > 1)
            {
                UnresolvedKind::Overload
            } else {
                UnresolvedKind::Dispatch
            };
            let eligible = function.kind() == "identifier"
                && !context.unsafe_syntax
                && !context.blocked.contains(&name)
                && context.definitions.get(&name) == Some(&1)
                && !shadowed
                && plain_call_context(node)
                && context
                    .free_functions
                    .get(&name)
                    .is_some_and(|(start, scope)| {
                        *start <= node.start_byte() && namespaces(node, source).starts_with(scope)
                    })
                && node.child_by_field_name("arguments").is_some_and(|args| {
                    let mut cursor = args.walk();
                    args.named_children(&mut cursor)
                        .filter(|arg| arg.kind() != "comment")
                        .all(|arg| primitive_argument(arg, node, source))
                });
            if eligible {
                extraction.edges.push(Edge {
                    relation: RelationKind::Calls,
                    target: name,
                    span: Span::from(node),
                    context_span: Span::from(node),
                    provenance: Provenance::Syntax,
                });
            } else {
                unresolved(kind, node, source, extraction);
            }
        }
        "preproc_include" => {
            if let Some(path) = node.child_by_field_name("path") {
                extraction.edges.push(Edge {
                    relation: RelationKind::Imports,
                    target: text(path, source),
                    span: Span::from(node),
                    context_span: Span::from(node),
                    provenance: Provenance::Syntax,
                });
            }
        }
        // Type spelling alone does not prove a repository-local type identity.
        // In particular, namespace prefixes and JUCE receiver types cannot
        // justify REFERENCES or member CALLS through name-only resolution.
        _ => {}
    }
}

fn definition_name(node: Node<'_>, source: &[u8]) -> Option<Span> {
    match node.kind() {
        "function_definition" => function_name(node.child_by_field_name("declarator")?, source),
        "class_specifier" | "struct_specifier" | "namespace_definition"
            if node.child_by_field_name("body").is_some() =>
        {
            node.child_by_field_name("name").map(Span::from)
        }
        _ => None,
    }
}

fn function_name(declarator: Node<'_>, source: &[u8]) -> Option<Span> {
    match declarator.kind() {
        "identifier" | "field_identifier" | "type_identifier" | "operator_name"
        | "destructor_name" => Some(Span::from(declarator)),
        "qualified_identifier" | "template_function" | "template_method" => {
            function_name(declarator.child_by_field_name("name")?, source)
        }
        "operator_cast" => {
            // Conversion operators have no name node. Keep the actual source
            // range from `operator` through the conversion type, including
            // pointer/reference modifiers, but excluding the parameter list.
            let mut end =
                conversion_parameters(declarator.child_by_field_name("declarator")?)?.start_byte();
            while end > declarator.start_byte() && source[end - 1].is_ascii_whitespace() {
                end -= 1;
            }
            Some(Span {
                start: declarator.start_byte(),
                end,
            })
        }
        _ => function_name(inner_declarator(declarator)?, source),
    }
}

// The C++ grammar's reference declarators have an unnamed child rather than a
// `declarator` field. This covers reference returns and reference parameters.
fn inner_declarator(node: Node<'_>) -> Option<Node<'_>> {
    if matches!(
        node.kind(),
        "reference_declarator" | "abstract_reference_declarator" | "parenthesized_declarator"
    ) {
        node.named_child(0)
    } else {
        node.child_by_field_name("declarator")
    }
}

fn conversion_parameters(node: Node<'_>) -> Option<Node<'_>> {
    node.child_by_field_name("parameters")
        .or_else(|| inner_declarator(node).and_then(conversion_parameters))
}

fn plain_free_function(node: Node<'_>) -> bool {
    if has_ancestor(
        node,
        &[
            "class_specifier",
            "struct_specifier",
            "union_specifier",
            "function_definition",
            "lambda_expression",
            "template_declaration",
        ],
    ) || preprocessed(node)
    {
        return false;
    }
    let Some(mut declarator) = node.child_by_field_name("declarator") else {
        return false;
    };
    while let Some(inner) = inner_declarator(declarator) {
        declarator = inner;
    }
    declarator.kind() == "identifier"
}

fn plain_call_context(mut node: Node<'_>) -> bool {
    if preprocessed(node) {
        return false;
    }
    while let Some(parent) = node.parent() {
        match parent.kind() {
            "lambda_expression"
            | "class_specifier"
            | "struct_specifier"
            | "union_specifier"
            | "template_declaration" => return false,
            "function_definition" => return plain_free_function(parent),
            _ => node = parent,
        }
    }
    false
}

fn namespaces(mut node: Node<'_>, source: &[u8]) -> Vec<String> {
    let mut scopes = Vec::new();
    while let Some(parent) = node.parent() {
        if parent.kind() == "namespace_definition" {
            // An anonymous namespace injects an implicit using directive into
            // its enclosing namespace. Unique names remain visible there.
            if let Some(name) = parent.child_by_field_name("name") {
                scopes.push(text(name, source));
            }
        }
        node = parent;
    }
    scopes.reverse();
    scopes
        .into_iter()
        .flat_map(|name| name.split("::").map(str::to_owned).collect::<Vec<_>>())
        .collect()
}

fn has_ancestor(mut node: Node<'_>, kinds: &[&str]) -> bool {
    while let Some(parent) = node.parent() {
        if kinds.contains(&parent.kind()) {
            return true;
        }
        node = parent;
    }
    false
}

fn preprocessed(mut node: Node<'_>) -> bool {
    while let Some(parent) = node.parent() {
        if parent.kind().starts_with("preproc_") {
            return true;
        }
        node = parent;
    }
    false
}

// A binding is visible only in ancestor scopes, after its declaration. Header
// bindings in if/switch/while/for/catch and structured bindings count too.
fn locally_shadowed(call: Node<'_>, name: &str, source: &[u8]) -> bool {
    lexical_binding(call, name, source).is_some()
}

// Some(true) means an explicitly primitive scalar binding; Some(false) is an
// uncertain/value/type binding. None means no lexical declaration was found.
fn lexical_binding(call: Node<'_>, name: &str, source: &[u8]) -> Option<bool> {
    let mut child = call;
    while let Some(scope) = child.parent() {
        match scope.kind() {
            "compound_statement" | "case_statement" => {
                let mut cursor = scope.walk();
                let statements: Vec<_> = scope.named_children(&mut cursor).collect();
                for statement in statements.into_iter().rev() {
                    if statement.end_byte() <= child.start_byte()
                        && let Some(binding) = binding_in(statement, name, source)
                    {
                        return Some(binding);
                    }
                }
            }
            "declaration" => {
                if let Some(binding) = binding_in(scope, name, source) {
                    return Some(binding);
                }
            }
            "for_statement" | "for_range_loop" | "if_statement" | "switch_statement"
            | "while_statement" | "catch_clause" => {
                for field in ["initializer", "condition", "parameters"] {
                    if let Some(header) = scope.child_by_field_name(field)
                        && let Some(binding) = header_binding(header, name, source)
                    {
                        return Some(binding);
                    }
                }
                if scope.kind() == "for_range_loop"
                    && scope
                        .child_by_field_name("declarator")
                        .is_some_and(|declarator| declarator_binds(declarator, name, source))
                {
                    return Some(false);
                }
            }
            "lambda_expression" => return Some(false),
            "function_definition" => {
                return scope
                    .child_by_field_name("declarator")
                    .and_then(|declarator| header_binding(declarator, name, source));
            }
            _ => {}
        }
        child = scope;
    }
    None
}

fn binding_in(node: Node<'_>, name: &str, source: &[u8]) -> Option<bool> {
    match node.kind() {
        "declaration"
        | "field_declaration"
        | "type_definition"
        | "parameter_declaration"
        | "optional_parameter_declaration" => {
            let mut cursor = node.walk();
            for declarator in node.children_by_field_name("declarator", &mut cursor) {
                if declarator_binds(declarator, name, source) {
                    let value = if declarator.kind() == "init_declarator" {
                        declarator
                            .child_by_field_name("declarator")
                            .unwrap_or(declarator)
                    } else {
                        declarator
                    };
                    return Some(
                        node.kind() != "type_definition"
                            && value.kind() == "identifier"
                            && node.child_by_field_name("type").is_some_and(|ty| {
                                matches!(ty.kind(), "primitive_type" | "sized_type_specifier")
                            }),
                    );
                }
            }
            if node
                .child_by_field_name("type")
                .is_some_and(|ty| binding_in(ty, name, source).is_some())
            {
                return Some(false);
            }
            None
        }
        "class_specifier" | "struct_specifier" | "enum_specifier" | "alias_declaration" => node
            .child_by_field_name("name")
            .filter(|binding| text(*binding, source) == name)
            .map(|_| false),
        "using_declaration" => Some(false),
        // Labels introduce no C++ lexical scope. Their declarations still
        // bind in the surrounding block, unlike declarations in nested blocks.
        "case_statement" | "labeled_statement" => {
            let mut cursor = node.walk();
            node.named_children(&mut cursor)
                .find_map(|child| binding_in(child, name, source))
        }
        _ => None,
    }
}

fn header_binding(node: Node<'_>, name: &str, source: &[u8]) -> Option<bool> {
    if let Some(binding) = binding_in(node, name, source) {
        return Some(binding);
    }
    // Only called on declarators/control-flow headers, never on sibling bodies.
    let mut cursor = node.walk();
    node.named_children(&mut cursor)
        .find_map(|child| header_binding(child, name, source))
}

fn declarator_binds(node: Node<'_>, name: &str, source: &[u8]) -> bool {
    if node.kind() == "structured_binding_declarator" {
        let mut cursor = node.walk();
        return node
            .named_children(&mut cursor)
            .any(|binding| text(binding, source) == name);
    }
    function_name(node, source).is_some_and(|span| span_text(span, source) == name)
        || inner_declarator(node).is_some_and(|inner| declarator_binds(inner, name, source))
}

fn declarator_names(node: Node<'_>, source: &[u8]) -> Vec<String> {
    let mut cursor = node.walk();
    node.children_by_field_name("declarator", &mut cursor)
        .flat_map(|declarator| {
            let mut inner = declarator;
            while let Some(child) = inner_declarator(inner) {
                inner = child;
            }
            if inner.kind() == "structured_binding_declarator" {
                let mut cursor = inner.walk();
                inner
                    .named_children(&mut cursor)
                    .map(|name| text(name, source))
                    .collect()
            } else {
                function_name(declarator, source)
                    .map(|span| span_text(span, source))
                    .into_iter()
                    .collect::<Vec<_>>()
            }
        })
        .collect()
}

fn primitive_argument(arg: Node<'_>, call: Node<'_>, source: &[u8]) -> bool {
    match arg.kind() {
        "number_literal" => text(arg, source)
            .bytes()
            .all(|byte| byte.is_ascii_digit() || b"abcdefABCDEFxXpPeEuUlLfF.+-'".contains(&byte)),
        "true" | "false" | "null" | "char_literal" | "string_literal" => true,
        "identifier" => lexical_binding(call, &text(arg, source), source) == Some(true),
        "parenthesized_expression" => arg
            .named_child(0)
            .is_some_and(|inner| primitive_argument(inner, call, source)),
        // Unary +/- on a primitive scalar cannot invoke an overloaded operator.
        "unary_expression"
            if arg
                .child_by_field_name("operator")
                .is_some_and(|op| matches!(text(op, source).as_str(), "+" | "-" | "!" | "~")) =>
        {
            arg.child_by_field_name("argument")
                .is_some_and(|inner| primitive_argument(inner, call, source))
        }
        _ => false,
    }
}

fn span_text(span: Span, source: &[u8]) -> String {
    String::from_utf8_lossy(&source[span.start..span.end]).into_owned()
}

fn visit(node: Node<'_>, apply: &mut impl FnMut(Node<'_>)) {
    apply(node);
    let mut cursor = node.walk();
    for child in node.named_children(&mut cursor) {
        visit(child, apply);
    }
}
