use crate::pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, Span, UnresolvedKind,
    evidence_span, has_ancestor, normalize_extraction, symbol, text, unresolved, walk_with,
};
use std::collections::BTreeMap;
use tree_sitter::{Language, Node, Parser};

pub(crate) static TYPESCRIPT: TypeScript = TypeScript;

pub(crate) struct TypeScript;

impl LanguagePack for TypeScript {
    fn id(&self) -> &'static str {
        "typescript"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["ts", "tsx"]
    }

    fn language(&self) -> Language {
        tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into()
    }

    fn language_for_path(&self, path: &std::path::Path) -> Language {
        if path.extension().and_then(|extension| extension.to_str()) == Some("tsx") {
            tree_sitter_typescript::LANGUAGE_TSX.into()
        } else {
            self.language()
        }
    }

    fn extract(&self, path: &std::path::Path, source: &[u8]) -> Result<Extraction, ExtractError> {
        if path.is_absolute() {
            return Err(ExtractError::AbsolutePath);
        }
        let mut parser = Parser::new();
        parser
            .set_language(&self.language_for_path(path))
            .map_err(|_| ExtractError::ParserLanguage)?;
        let tree = parser
            .parse(source, None)
            .ok_or(ExtractError::ParseFailed)?;
        let context = LexicalContext::new(tree.root_node(), source);
        let mut extraction = Extraction::default();
        walk_with(
            tree.root_node(),
            source,
            &mut extraction,
            false,
            &mut |node, source, extraction| {
                if const_arrow(node, source).is_some() && !node.has_error() {
                    symbol(node, source, extraction);
                    extraction
                        .lexical_arrows
                        .push(Span::from(node.child_by_field_name("name").unwrap()));
                }
                if node.kind() == "call_expression"
                    && !has_ancestor(node, "decorator")
                    && let Some(function) = node
                        .child_by_field_name("function")
                        .filter(|f| f.kind() == "identifier")
                {
                    match context.resolve_call(node, function, source) {
                        CallBinding::Gap => {
                            unresolved(UnresolvedKind::Dispatch, node, source, extraction);
                            return;
                        }
                        CallBinding::Exact(provenance) => {
                            extraction.edges.push(Edge {
                                relation: RelationKind::Calls,
                                target: text(function, source),
                                span: Span::from(node),
                                context_span: evidence_span(
                                    node,
                                    &[
                                        "lexical_declaration",
                                        "expression_statement",
                                        "return_statement",
                                    ],
                                ),
                                provenance,
                            });
                            return;
                        }
                        CallBinding::Syntax => {}
                    }
                }
                self.classify(node, source, extraction);
            },
        );
        normalize_extraction(&mut extraction);
        Ok(extraction)
    }

    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
        match node.kind() {
            "function_declaration"
            | "method_definition"
            | "class_declaration"
            | "interface_declaration" => symbol(node, source, extraction),
            "import_statement" => extraction.edges.push(Edge {
                relation: RelationKind::Imports,
                target: text(node, source),
                span: Span::from(node),
                context_span: Span::from(node),
                provenance: Provenance::Syntax,
            }),
            "call_expression" => {
                if has_ancestor(node, "decorator") {
                    return;
                }
                let Some(function) = node.child_by_field_name("function") else {
                    return;
                };
                if function.kind() == "identifier" {
                    extraction.edges.push(Edge {
                        relation: RelationKind::Calls,
                        target: text(function, source),
                        span: Span::from(node),
                        context_span: evidence_span(
                            node,
                            &[
                                "lexical_declaration",
                                "expression_statement",
                                "return_statement",
                            ],
                        ),
                        provenance: Provenance::Syntax,
                    });
                } else {
                    if function.kind() == "subscript_expression" {
                        unresolved(UnresolvedKind::DynamicProperty, node, source, extraction);
                    }
                    unresolved(UnresolvedKind::Dispatch, node, source, extraction);
                }
            }
            "decorator" => unresolved(UnresolvedKind::Decorator, node, source, extraction),
            "function_signature" | "method_signature" => {
                unresolved(UnresolvedKind::Overload, node, source, extraction)
            }
            _ => {}
        }
    }
}

// Two file passes: collect lexical environments (including declarations after a
// call), then classify. Lookup walks scope parents, never the AST/file. Captures
// and parameter initializers deliberately receive no lexical call proof.
#[derive(Clone, Copy)]
struct Binding {
    target: Option<Span>,
    initialized: usize,
    syntax_function: bool,
}
#[derive(Default)]
struct LexicalScope {
    parent: Option<usize>,
    function: usize,
    owner: Option<Span>,
    bindings: BTreeMap<String, Binding>,
}
struct CallScope {
    scope: usize,
    unsupported: bool,
}
struct LexicalContext {
    scopes: Vec<LexicalScope>,
    calls: BTreeMap<usize, CallScope>,
    writes: Vec<(usize, String)>,
    has_error: bool,
}
enum CallBinding {
    Syntax,
    Exact(Provenance),
    Gap,
}

fn const_arrow<'t>(node: Node<'t>, source: &[u8]) -> Option<Node<'t>> {
    if node.kind() != "variable_declarator" {
        return None;
    }
    let parent = node.parent()?;
    if parent.kind() != "lexical_declaration" || parent.child(0)?.utf8_text(source).ok()? != "const"
    {
        return None;
    }
    let name = node.child_by_field_name("name")?;
    let value = node.child_by_field_name("value")?;
    (name.kind() == "identifier" && value.kind() == "arrow_function").then_some(value)
}
fn function_boundary(node: Node<'_>) -> bool {
    matches!(
        node.kind(),
        "function_declaration"
            | "generator_function_declaration"
            | "function_expression"
            | "generator_function"
            | "arrow_function"
            | "method_definition"
    )
}
// Only binding positions: property keys, annotations and default RHS expressions
// are not bindings. Selector/index assignment bases are not direct writes.
fn binding_names(node: Node<'_>, source: &[u8], out: &mut Vec<String>) {
    match node.kind() {
        "identifier" | "shorthand_property_identifier_pattern" => out.push(text(node, source)),
        "assignment_pattern" | "object_assignment_pattern" => {
            if let Some(left) = node.child_by_field_name("left") {
                binding_names(left, source, out);
            }
        }
        "pair_pattern" => {
            if let Some(value) = node.child_by_field_name("value") {
                binding_names(value, source, out);
            }
        }
        "required_parameter" | "optional_parameter" => {
            if let Some(pattern) = node
                .child_by_field_name("pattern")
                .or_else(|| node.child_by_field_name("name"))
            {
                binding_names(pattern, source, out);
            }
        }
        "object_pattern" | "array_pattern" | "rest_pattern" | "formal_parameters" => {
            let mut cursor = node.walk();
            for child in node.named_children(&mut cursor) {
                binding_names(child, source, out);
            }
        }
        _ => {}
    }
}
impl LexicalContext {
    fn new(root: Node<'_>, source: &[u8]) -> Self {
        let mut context = Self {
            scopes: vec![LexicalScope::default()],
            calls: BTreeMap::new(),
            writes: Vec::new(),
            has_error: root.has_error(),
        };
        context.collect(root, source, 0, false);
        for (scope, name) in std::mem::take(&mut context.writes) {
            if let Some(owner) = context.binding_scope(scope, &name)
                && let Some(binding) = context.scopes[owner].bindings.get_mut(&name)
            {
                binding.target = None;
                binding.syntax_function = false;
            }
        }
        context
    }
    fn bind(&mut self, scope: usize, name: String, binding: Binding) {
        self.scopes[scope]
            .bindings
            .entry(name)
            .and_modify(|old| {
                // Duplicate declarations/parameters cannot establish unique identity.
                old.target = None;
                old.syntax_function = false;
            })
            .or_insert(binding);
    }
    fn block_pattern(&mut self, scope: usize, pattern: Node<'_>, source: &[u8]) {
        let mut names = Vec::new();
        binding_names(pattern, source, &mut names);
        for name in names {
            self.bind(
                scope,
                name,
                Binding {
                    target: None,
                    initialized: usize::MAX,
                    syntax_function: false,
                },
            );
        }
    }
    fn collect(&mut self, node: Node<'_>, source: &[u8], mut scope: usize, unsupported: bool) {
        if node.kind() == "import_statement" {
            let mut cursor = node.walk();
            let module = node.child_by_field_name("source").or_else(|| {
                node.named_children(&mut cursor)
                    .find(|child| child.kind() == "import_require_clause")
                    .and_then(|clause| clause.child_by_field_name("source"))
            });
            if module.is_some_and(|module| {
                let specifier = text(module, source);
                let specifier = specifier.trim_matches(['\'', '"']);
                specifier.starts_with("./") || specifier.starts_with("../")
            }) {
                // Preserve legacy relative-import recall. This is not module/
                // export identity proof; exact relative resolution is separate.
                // Skip binding collection only; classify still emits the import.
                return;
            }
        }
        // Non-relative imports establish local identity, not a repository target.
        // Until module/export identity is proven, block syntax fallback for the
        // local binding only (never the exported name of an aliased specifier).
        match node.kind() {
            "import_specifier" => {
                if let Some(local) = node
                    .child_by_field_name("alias")
                    .or_else(|| node.child_by_field_name("name"))
                {
                    self.block_pattern(scope, local, source);
                }
            }
            "import_clause" | "namespace_import" | "import_require_clause" => {
                let mut cursor = node.walk();
                for local in node.named_children(&mut cursor) {
                    if local.kind() == "identifier" {
                        self.block_pattern(scope, local, source);
                    }
                }
            }
            _ => {}
        }
        if matches!(
            node.kind(),
            "function_declaration"
                | "generator_function_declaration"
                | "class_declaration"
                | "enum_declaration"
        ) && let Some(name) = node.child_by_field_name("name")
        {
            self.bind(
                scope,
                text(name, source),
                Binding {
                    target: None,
                    initialized: 0,
                    syntax_function: node.kind() == "function_declaration",
                },
            );
        }
        // Function parameters and the immediate body share declaration identity:
        // a same-name body const is an invalid collision, not a fresh proof.
        let function_body =
            node.kind() == "statement_block" && node.parent().is_some_and(function_boundary);
        // A class definition is not its enclosing callable's execution body.
        // Keep a distinct environment for its inner name and deferred fields;
        // methods create their own callable environments below as before.
        let class_boundary = matches!(node.kind(), "class" | "class_declaration");
        if function_boundary(node)
            || class_boundary
            || (!function_body
                && matches!(
                    node.kind(),
                    "statement_block"
                        | "for_statement"
                        | "for_in_statement"
                        | "switch_body"
                        | "catch_clause"
                        | "class_body"
                ))
        {
            let function = if function_boundary(node) || class_boundary {
                self.scopes.len()
            } else {
                self.scopes[scope].function
            };
            let owner = if class_boundary {
                None
            } else if function_boundary(node) {
                match node.kind() {
                    "function_declaration" | "method_definition" => {
                        node.child_by_field_name("name").map(Span::from)
                    }
                    "arrow_function" => node
                        .parent()
                        .filter(|p| const_arrow(*p, source).is_some())
                        .and_then(|p| p.child_by_field_name("name"))
                        .map(Span::from),
                    _ => None,
                }
            } else {
                self.scopes[scope].owner
            };
            let parent = scope;
            scope = self.scopes.len();
            self.scopes.push(LexicalScope {
                parent: Some(parent),
                function,
                owner,
                bindings: BTreeMap::new(),
            });
        }
        if class_boundary && let Some(name) = node.child_by_field_name("name") {
            self.block_pattern(scope, name, source);
        }
        if function_boundary(node) {
            if let Some(params) = node
                .child_by_field_name("parameters")
                .or_else(|| node.child_by_field_name("parameter"))
            {
                self.block_pattern(scope, params, source);
            }
            if matches!(node.kind(), "function_expression" | "generator_function")
                && let Some(name) = node.child_by_field_name("name")
            {
                self.block_pattern(scope, name, source);
            }
        }
        if node.kind() == "catch_clause"
            && let Some(param) = node.child_by_field_name("parameter")
        {
            self.block_pattern(scope, param, source);
        }
        if node.kind() == "for_in_statement"
            && let Some(left) = node.child_by_field_name("left")
        {
            // for-of/in grammar puts the binding directly under the loop.
            // Var may escape its block: block it at function scope as well.
            self.block_pattern(scope, left, source);
            if node
                .child_by_field_name("kind")
                .is_some_and(|k| k.utf8_text(source).ok() == Some("var"))
            {
                self.block_pattern(self.scopes[scope].function, left, source);
            }
        }
        if node.kind() == "variable_declarator"
            && let Some(name) = node.child_by_field_name("name")
        {
            let scope = if node
                .parent()
                .is_some_and(|p| p.kind() == "variable_declaration")
            {
                self.scopes[scope].function
            } else {
                scope
            };
            if const_arrow(node, source).is_some() {
                self.bind(
                    scope,
                    text(name, source),
                    Binding {
                        target: Some(Span::from(name)),
                        initialized: node.end_byte(),
                        syntax_function: false,
                    },
                );
            } else {
                self.block_pattern(scope, name, source);
            }
        }
        if matches!(
            node.kind(),
            "assignment_expression" | "augmented_assignment_expression" | "update_expression"
        ) && let Some(left) = node
            .child_by_field_name("left")
            .or_else(|| node.child_by_field_name("argument"))
        {
            let mut names = Vec::new();
            binding_names(left, source, &mut names);
            self.writes
                .extend(names.into_iter().map(|name| (scope, name)));
        }
        // Class fields/static initializers need execution-context proof beyond
        // this slice. Do not attribute them (or nested bodies) to an outer owner.
        // Lexical source order also does not prove switch-case execution order.
        let unsupported = unsupported
            || matches!(
                node.kind(),
                "with_statement" | "switch_body" | "public_field_definition" | "class_static_block"
            );
        if node.kind() == "call_expression" {
            self.calls
                .insert(node.id(), CallScope { scope, unsupported });
        }
        let params = if function_boundary(node) {
            node.child_by_field_name("parameters")
                .or_else(|| node.child_by_field_name("parameter"))
                .map(|p| p.id())
        } else {
            None
        };
        let mut cursor = node.walk();
        for child in node.named_children(&mut cursor) {
            self.collect(
                child,
                source,
                scope,
                unsupported || params == Some(child.id()),
            );
        }
    }
    fn binding_scope(&self, mut scope: usize, name: &str) -> Option<usize> {
        loop {
            if self.scopes[scope].bindings.contains_key(name) {
                return Some(scope);
            }
            scope = self.scopes[scope].parent?;
        }
    }
    fn resolve_call(&self, call: Node<'_>, function: Node<'_>, source: &[u8]) -> CallBinding {
        let Some(site) = self.calls.get(&call.id()) else {
            return CallBinding::Gap;
        };
        let scope = &self.scopes[site.scope];
        if site.unsupported || (scope.function != 0 && scope.owner.is_none()) {
            return CallBinding::Gap;
        }
        let name = text(function, source);
        let Some(binding_scope) = self.binding_scope(site.scope, &name) else {
            return CallBinding::Syntax;
        };
        let binding = &self.scopes[binding_scope].bindings[&name];
        if binding.syntax_function {
            return CallBinding::Syntax;
        }
        if self.has_error
            || self.scopes[binding_scope].function != scope.function
            || call.start_byte() < binding.initialized
        {
            return CallBinding::Gap;
        }
        match (binding.target, scope.owner) {
            (Some(target), Some(caller)) => {
                CallBinding::Exact(Provenance::TsLexical { target, caller })
            }
            _ => CallBinding::Gap,
        }
    }
}
