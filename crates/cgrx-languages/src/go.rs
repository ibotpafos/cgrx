use crate::pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, RepoPath, Span,
    UnresolvedKind, evidence_span, normalize_extraction, symbol, text, unresolved, walk_with,
};
use std::collections::{BTreeMap, BTreeSet};
use tree_sitter::{Language, Node, Parser};

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum GoCallableKind {
    Function,
    Method,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GoCallableType {
    pub kind: GoCallableKind,
    pub name: String,
    pub named_type: String,
}

/// Parse one stored Go declaration and return the single named result or
/// receiver type. Interfaces, tuples, qualified and generic types remain gaps.
pub fn go_callable_type(source: &[u8]) -> Option<GoCallableType> {
    let mut parser = Parser::new();
    parser.set_language(&tree_sitter_go::LANGUAGE.into()).ok()?;
    let tree = parser.parse(source, None)?;
    if tree.root_node().has_error() {
        return None;
    }
    let mut cursor = tree.root_node().walk();
    let declarations: Vec<_> = tree
        .root_node()
        .named_children(&mut cursor)
        .filter(|node| matches!(node.kind(), "function_declaration" | "method_declaration"))
        .collect();
    let [declaration] = declarations.as_slice() else {
        return None;
    };
    let name = text(declaration.child_by_field_name("name")?, source);
    if declaration.kind() == "method_declaration" {
        let (_, ty) = receiver(*declaration)?;
        return Some(GoCallableType {
            kind: GoCallableKind::Method,
            name,
            named_type: text(ty, source),
        });
    }
    let result = declaration.child_by_field_name("result")?;
    let ty = named_type(result)?;
    Some(GoCallableType {
        kind: GoCallableKind::Function,
        name,
        named_type: text(ty, source),
    })
}

pub(crate) static GO: Go = Go;

pub(crate) struct Go;

impl LanguagePack for Go {
    fn id(&self) -> &'static str {
        "go"
    }

    fn extensions(&self) -> &'static [&'static str] {
        &["go"]
    }

    fn language(&self) -> Language {
        tree_sitter_go::LANGUAGE.into()
    }

    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
        classify_go(
            node,
            source,
            extraction,
            &GoContext::new(root(node), source),
        );
    }

    fn extract(&self, path: &RepoPath, source: &[u8]) -> Result<Extraction, ExtractError> {
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
        let context = GoContext::new(tree.root_node(), source);
        let mut extraction = Extraction {
            package_span: if context.has_error {
                None
            } else {
                context.package
            },
            ..Extraction::default()
        };
        walk_with(
            tree.root_node(),
            source,
            &mut extraction,
            false,
            &mut |node, source, extraction| {
                classify_go(node, source, extraction, &context);
            },
        );
        normalize_extraction(&mut extraction);
        Ok(extraction)
    }
}

fn classify_go(
    node: Node<'_>,
    source: &[u8],
    extraction: &mut Extraction,
    context: &GoContext<'_>,
) {
    match node.kind() {
        "function_declaration" | "method_declaration" | "type_spec" => {
            symbol(node, source, extraction);
        }
        "import_declaration" => extraction.edges.push(Edge {
            relation: RelationKind::Imports,
            target: text(node, source),
            span: Span::from(node),
            context_span: Span::from(node),
            provenance: Provenance::Syntax,
        }),
        "selector_expression" | "qualified_type" if !is_direct_call_function(node) => {
            if let Some(provenance) = import_qualified_reference(node, source, context)
                && let Provenance::GoImport { import_path, .. } = provenance
            {
                extraction.edges.push(Edge {
                    relation: RelationKind::References,
                    target: String::from_utf8_lossy(&source[import_path.start..import_path.end])
                        .trim_matches(['"', '`'])
                        .to_owned(),
                    span: Span::from(node),
                    context_span: evidence_span(
                        node,
                        &["field_declaration", "parameter_declaration", "type_spec"],
                    ),
                    provenance,
                });
            }
        }
        "call_expression" => {
            let Some(function) = node.child_by_field_name("function") else {
                return;
            };
            if function.kind() == "identifier"
                && context.declared_types.contains(&text(function, source))
            {
                // Go parses named conversions as calls. A type is not a callee.
                unresolved(UnresolvedKind::Dispatch, node, source, extraction);
            } else if function.kind() == "identifier" {
                extraction.edges.push(Edge {
                    relation: RelationKind::Calls,
                    target: text(function, source),
                    span: Span::from(node),
                    context_span: evidence_span(
                        node,
                        &[
                            "short_var_declaration",
                            "assignment_statement",
                            "expression_statement",
                            "return_statement",
                        ],
                    ),
                    provenance: Provenance::Syntax,
                });
            } else if let Some(provenance) = own_receiver_target(function, source, context)
                .or_else(|| field_receiver_target(function, source, context))
                .or_else(|| local_constructor_target(function, source, context))
            {
                extraction.edges.push(Edge {
                    relation: RelationKind::Calls,
                    target: text(function, source),
                    span: Span::from(node),
                    context_span: evidence_span(
                        node,
                        &[
                            "expression_statement",
                            "return_statement",
                            "assignment_statement",
                            "short_var_declaration",
                        ],
                    ),
                    provenance,
                });
            } else if let Some((target, provenance)) =
                import_qualified_selector(function, source, context)
            {
                extraction.edges.push(Edge {
                    relation: RelationKind::Calls,
                    target,
                    span: Span::from(node),
                    context_span: evidence_span(
                        node,
                        &[
                            "short_var_declaration",
                            "assignment_statement",
                            "expression_statement",
                            "return_statement",
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

fn local_constructor_target(
    function: Node<'_>,
    source: &[u8],
    context: &GoContext<'_>,
) -> Option<Provenance> {
    if function.kind() != "selector_expression" || context.has_error {
        return None;
    }
    let operand = function.child_by_field_name("operand")?;
    let target = function.child_by_field_name("field")?;
    if operand.kind() != "identifier" || target.kind() != "field_identifier" {
        return None;
    }
    let binding_name = text(operand, source);
    let mut callable = function.parent()?;
    while !matches!(
        callable.kind(),
        "function_declaration" | "method_declaration" | "func_literal"
    ) {
        callable = callable.parent()?;
    }
    if callable.kind() == "func_literal" {
        return None;
    }
    let caller = callable.child_by_field_name("name")?;
    for field in ["parameters", "receiver"] {
        if callable.child_by_field_name(field).is_some_and(|node| {
            let mut names = BTreeSet::new();
            collect_bindings(node, source, &mut names);
            names.contains(&binding_name)
        }) {
            return None;
        }
    }
    let body = callable.child_by_field_name("body")?;
    let mut writes = Vec::new();
    collect_binding_writes(body, source, &binding_name, &mut writes);
    let [write] = writes.as_slice() else {
        return None;
    };
    if write.kind() != "short_var_declaration" || write.end_byte() >= function.start_byte() {
        return None;
    }
    let left = write.child_by_field_name("left")?;
    let right = write.child_by_field_name("right")?;
    if left.named_child_count() != 1 || right.named_child_count() != 1 {
        return None;
    }
    let binding = left.named_child(0)?;
    let initializer = right.named_child(0)?;
    let constructor = initializer.child_by_field_name("function")?;
    if binding.kind() != "identifier"
        || text(binding, source) != binding_name
        || initializer.kind() != "call_expression"
        || constructor.kind() != "identifier"
    {
        return None;
    }
    Some(Provenance::GoLocalConstructor {
        package: context.package?,
        caller: Span::from(caller),
        binding: Span::from(binding),
        constructor: Span::from(constructor),
        target: Span::from(target),
    })
}

fn collect_binding_writes<'tree>(
    node: Node<'tree>,
    source: &[u8],
    name: &str,
    writes: &mut Vec<Node<'tree>>,
) {
    if matches!(
        node.kind(),
        "function_declaration" | "method_declaration" | "func_literal"
    ) {
        return;
    }
    if matches!(
        node.kind(),
        "short_var_declaration" | "assignment_statement" | "range_clause" | "receive_statement"
    ) && node.child_by_field_name("left").is_some_and(|left| {
        let mut names = BTreeSet::new();
        collect_identifiers(left, source, &mut names);
        names.contains(name)
    }) {
        writes.push(node);
    }
    let mut cursor = node.walk();
    for child in node.named_children(&mut cursor) {
        collect_binding_writes(child, source, name, writes);
    }
}

fn is_direct_call_function(node: Node<'_>) -> bool {
    node.parent().is_some_and(|parent| {
        parent.kind() == "call_expression"
            && parent
                .child_by_field_name("function")
                .is_some_and(|function| function.id() == node.id())
    })
}

fn import_qualified_selector(
    function: Node<'_>,
    source: &[u8],
    context: &GoContext<'_>,
) -> Option<(String, Provenance)> {
    if function.kind() != "selector_expression" {
        return None;
    }
    let qualifier = text(function.child_by_field_name("operand")?, source);
    let provenance = import_qualified_reference(function, source, context)?;
    let field = function.child_by_field_name("field")?;
    Some((format!("{qualifier}.{}", text(field, source)), provenance))
}

fn import_qualified_reference(
    reference: Node<'_>,
    source: &[u8],
    context: &GoContext<'_>,
) -> Option<Provenance> {
    let qualifier_node = match reference.kind() {
        "selector_expression" => reference.child_by_field_name("operand")?,
        "qualified_type" => reference.child_by_field_name("package")?,
        _ => return None,
    };
    if !matches!(qualifier_node.kind(), "identifier" | "package_identifier") {
        return None;
    }
    let qualifier = text(qualifier_node, source);
    // A receiver/local binding may hide an import with the same spelling.
    let mut ancestor = reference.parent();
    while let Some(node) = ancestor {
        if matches!(
            node.kind(),
            "method_declaration" | "function_declaration" | "func_literal"
        ) && context
            .bindings
            .get(&node.id())
            .is_some_and(|bindings| bindings.contains(&qualifier))
        {
            return None;
        }
        ancestor = node.parent();
    }
    let paths = context.imports.get(&qualifier)?;
    if paths.len() != 1 {
        return None;
    }
    Some(Provenance::GoImport {
        import_path: paths[0].0,
        explicit_alias: paths[0].1,
    })
}

fn root(mut node: Node<'_>) -> Node<'_> {
    while let Some(parent) = node.parent() {
        node = parent;
    }
    node
}

fn any_node(node: Node<'_>, predicate: &impl Fn(Node<'_>) -> bool) -> bool {
    if predicate(node) {
        return true;
    }
    let mut cursor = node.walk();
    node.named_children(&mut cursor)
        .any(|child| any_node(child, predicate))
}

// One context per extraction, never shared between sources or parser trees.
// This replaces whole-file/per-method scans at every call site.
struct GoContext<'tree> {
    declared_types: BTreeSet<String>,
    types: BTreeMap<String, Vec<Node<'tree>>>,
    methods: BTreeMap<(String, String), Vec<Span>>,
    imports: BTreeMap<String, Vec<(Span, bool)>>,
    concrete_types: BTreeMap<String, ConcreteType>,
    // Owners with explicit embedded fields; never used as promoted target types.
    embedded_owners: BTreeMap<String, ConcreteType>,
    field_methods: BTreeMap<(String, String), Vec<Span>>,
    bindings: BTreeMap<usize, BTreeSet<String>>,
    receiver_shadows: BTreeSet<usize>,
    package: Option<Span>,
    has_error: bool,
}

impl<'tree> GoContext<'tree> {
    fn new(file: Node<'tree>, source: &[u8]) -> Self {
        let mut context = Self {
            declared_types: BTreeSet::new(),
            types: BTreeMap::new(),
            methods: BTreeMap::new(),
            imports: BTreeMap::new(),
            concrete_types: BTreeMap::new(),
            embedded_owners: BTreeMap::new(),
            field_methods: BTreeMap::new(),
            bindings: BTreeMap::new(),
            receiver_shadows: BTreeSet::new(),
            package: None,
            has_error: file.has_error(),
        };
        context.collect(file, source);
        // Build once from complete package-level declarations, not per selector.
        for (name, declarations) in &context.types {
            if let [declaration] = declarations.as_slice() {
                if let Some(concrete) = concrete_type(*declaration, source, false) {
                    context.concrete_types.insert(name.clone(), concrete);
                } else if let Some(owner) = concrete_type(*declaration, source, true) {
                    context.embedded_owners.insert(name.clone(), owner);
                }
            }
        }
        context
    }

    fn collect(&mut self, node: Node<'tree>, source: &[u8]) {
        match node.kind() {
            "package_clause" => self.package = node.named_child(0).map(Span::from),
            "type_spec" | "type_alias" => {
                if let Some(name) = node.child_by_field_name("name") {
                    let name = text(name, source);
                    self.declared_types.insert(name.clone());
                    if node
                        .parent()
                        .and_then(|n| n.parent())
                        .is_some_and(|n| n.kind() == "source_file")
                    {
                        self.types.entry(name).or_default().push(node);
                    }
                }
            }
            "import_spec" => {
                if let Some(path) = node.child_by_field_name("path") {
                    let literal = text(path, source);
                    let imported = literal.trim_matches(['"', '`']);
                    let name = node
                        .child_by_field_name("name")
                        .map(|n| text(n, source))
                        .unwrap_or_else(|| {
                            imported.rsplit('/').next().unwrap_or(imported).to_owned()
                        });
                    if !matches!(name.as_str(), "_" | ".") && !imported.contains('\\') {
                        self.imports
                            .entry(name)
                            .or_default()
                            .push((Span::from(path), node.child_by_field_name("name").is_some()));
                    }
                }
            }
            "method_declaration" | "function_declaration" | "func_literal" => {
                // Include unnamed target receivers in ambiguity detection too.
                if let Some(ty) = method_receiver_type(node)
                    && let Some(name) = node.child_by_field_name("name")
                {
                    self.field_methods
                        .entry((text(ty, source), text(name, source)))
                        .or_default()
                        .push(Span::from(name));
                }
                let mut bindings = BTreeSet::new();
                for field in ["parameters", "result", "body"] {
                    if let Some(n) = node.child_by_field_name(field) {
                        collect_bindings(n, source, &mut bindings);
                    }
                }
                if let Some((name, ty)) = receiver(node) {
                    let name = text(name, source);
                    if bindings.contains(&name) {
                        self.receiver_shadows.insert(node.id());
                    }
                    bindings.insert(name);
                    if let Some(target) = node.child_by_field_name("name") {
                        self.methods
                            .entry((text(ty, source), text(target, source)))
                            .or_default()
                            .push(Span::from(target));
                    }
                }
                // Import shadowing also applies to receiver forms outside our
                // supported own-receiver subset (qualified/generic types).
                if let Some(receiver) = node.child_by_field_name("receiver") {
                    collect_bindings(receiver, source, &mut bindings);
                }
                self.bindings.insert(node.id(), bindings);
            }
            _ => {}
        }
        let mut cursor = node.walk();
        for child in node.named_children(&mut cursor) {
            self.collect(child, source);
        }
    }
}

// Deliberately over-approximate scope: a binding/write in any nested block
// invalidates receiver proof throughout the enclosing method. Closures remain
// gaps; their bindings also conservatively affect the parent.
fn collect_bindings(node: Node<'_>, source: &[u8], names: &mut BTreeSet<String>) {
    let field = match node.kind() {
        "short_var_declaration" | "assignment_statement" | "range_clause" | "receive_statement" => {
            Some("left")
        }
        "type_switch_statement" => Some("alias"),
        "var_spec"
        | "const_spec"
        | "type_spec"
        | "type_alias"
        | "parameter_declaration"
        | "variadic_parameter_declaration" => Some("name"),
        _ => None,
    };
    if let Some(field) = field {
        let mut cursor = node.walk();
        for binding in node.children_by_field_name(field, &mut cursor) {
            collect_identifiers(binding, source, names);
        }
    }
    let mut cursor = node.walk();
    for child in node.named_children(&mut cursor) {
        collect_bindings(child, source, names);
    }
}

fn collect_identifiers(node: Node<'_>, source: &[u8], names: &mut BTreeSet<String>) {
    if matches!(node.kind(), "identifier" | "type_identifier") {
        names.insert(text(node, source));
    } else if node.kind() == "expression_list" {
        // Go binds list elements, not identifiers inside selector/index LHSs.
        // s.Field = x and s.Map[key] = value do not rebind s.
        let mut cursor = node.walk();
        for child in node.named_children(&mut cursor) {
            collect_identifiers(child, source, names);
        }
    }
}

fn receiver(method: Node<'_>) -> Option<(Node<'_>, Node<'_>)> {
    let parameters = method.child_by_field_name("receiver")?;
    if parameters.named_child_count() != 1 {
        return None;
    }
    let parameter = parameters.named_child(0)?;
    let name = parameter.child_by_field_name("name")?;
    let mut ty = parameter.child_by_field_name("type")?;
    if ty.kind() == "pointer_type" {
        ty = ty.named_child(0)?;
    }
    // Qualified/imported, generic, interface and inferred receivers are not
    // this subset. Never equate app.Service with the local Service.
    (ty.kind() == "type_identifier" && name.kind() == "identifier").then_some((name, ty))
}

fn own_receiver_target(
    function: Node<'_>,
    source: &[u8],
    context: &GoContext<'_>,
) -> Option<Provenance> {
    if function.kind() != "selector_expression" {
        return None;
    }
    let operand = function.child_by_field_name("operand")?;
    if operand.kind() != "identifier" {
        return None;
    }
    let field = function.child_by_field_name("field")?;
    let mut method = function.parent()?;
    loop {
        match method.kind() {
            "method_declaration" => break,
            "func_literal" | "function_declaration" => return None,
            _ => method = method.parent()?,
        }
    }
    let (name, ty) = receiver(method)?;
    let receiver_name = text(name, source);
    if receiver_name == "_" || text(operand, source) != receiver_name {
        return None;
    }
    if context.receiver_shadows.contains(&method.id()) || context.has_error {
        return None;
    }
    let type_name = text(ty, source);
    let target_name = text(field, source);
    // The type declaration can live in another file. Explicit
    // receiver declarations establish identity; locally visible aliases,
    // interfaces, duplicate types, and field/method conflicts invalidate it.
    let types = context
        .types
        .get(&type_name)
        .map(Vec::as_slice)
        .unwrap_or_default();
    if types.len() > 1 {
        return None;
    }
    if let Some(declaration) = types.first() {
        let underlying = declaration.child_by_field_name("type")?;
        if declaration.kind() == "type_alias"
            || underlying.kind() != "struct_type"
            || any_node(underlying, &|n| {
                // A named nested struct's fields belong to that field's type,
                // not to this receiver. Only direct fields can conflict.
                n.kind() == "field_declaration"
                    && n.parent().and_then(|n| n.parent()) == Some(underlying)
                    && {
                        let mut c = n.walk();
                        n.children_by_field_name("name", &mut c)
                            .any(|n| text(n, source) == target_name)
                    }
            })
        {
            return None;
        }
    }
    let targets = context.methods.get(&(type_name, target_name))?;
    if targets.len() != 1 {
        return None;
    }
    Some(Provenance::GoSelfReceiver {
        package: context.package?,
        receiver_type: Span::from(ty),
        target: targets[0],
    })
}

struct ConcreteField {
    name: Span,
    // Only a named type or a single pointer to one is supported here.
    type_name: Option<String>,
}
struct ConcreteType {
    name: Span,
    is_struct: bool,
    fields: BTreeMap<String, ConcreteField>,
}
fn named_type(mut node: Node<'_>) -> Option<Node<'_>> {
    if node.kind() == "pointer_type" {
        node = node.named_child(0)?;
    }
    (node.kind() == "type_identifier").then_some(node)
}
fn method_receiver_type(method: Node<'_>) -> Option<Node<'_>> {
    let parameters = method.child_by_field_name("receiver")?;
    if parameters.named_child_count() != 1 {
        return None;
    }
    named_type(parameters.named_child(0)?.child_by_field_name("type")?)
}
fn concrete_type(
    declaration: Node<'_>,
    source: &[u8],
    allow_embedded_fields: bool,
) -> Option<ConcreteType> {
    if declaration.kind() != "type_spec"
        || declaration.child_by_field_name("type_parameters").is_some()
    {
        return None;
    }
    let underlying = declaration.child_by_field_name("type")?;
    let mut result = ConcreteType {
        name: Span::from(declaration.child_by_field_name("name")?),
        is_struct: underlying.kind() == "struct_type",
        fields: BTreeMap::new(),
    };
    match underlying.kind() {
        "slice_type" => {
            named_type(underlying.child_by_field_name("element")?)?;
        }
        "struct_type" => {
            let list = underlying.named_child(0)?;
            let mut cursor = list.walk();
            for field in list
                .named_children(&mut cursor)
                .filter(|n| n.kind() == "field_declaration")
            {
                let mut cursor = field.walk();
                let mut names: Vec<_> = field.children_by_field_name("name", &mut cursor).collect();
                if names.is_empty() {
                    // Embedded T or *T declares a direct field named T. Support
                    // only explicit s.T.Method selectors, not s.Method promotion:
                    // another file may declare an overriding method on s's type.
                    // Qualified/generic fields need additional identity evidence.
                    let ty = field.child_by_field_name("type")?;
                    if !allow_embedded_fields || ty.kind() != "type_identifier" {
                        return None;
                    }
                    names.push(ty);
                }
                let ty = field
                    .child_by_field_name("type")
                    .and_then(named_type)
                    .map(|n| text(n, source));
                for name in names {
                    if result
                        .fields
                        .insert(
                            text(name, source),
                            ConcreteField {
                                name: Span::from(name),
                                type_name: ty.clone(),
                            },
                        )
                        .is_some()
                    {
                        return None;
                    }
                }
            }
        }
        // Aliases, interfaces, underlying-name chains, generic/qualified and
        // other unnamed shapes are intentionally not concrete-field proofs.
        _ => return None,
    }
    Some(result)
}
fn field_receiver_target(
    function: Node<'_>,
    source: &[u8],
    context: &GoContext<'_>,
) -> Option<Provenance> {
    if function.kind() != "selector_expression" || context.has_error {
        return None;
    }
    let selection = function.child_by_field_name("operand")?;
    if selection.kind() != "selector_expression" {
        return None;
    }
    let operand = selection.child_by_field_name("operand")?;
    if operand.kind() != "identifier" {
        return None;
    }
    let field_name = text(selection.child_by_field_name("field")?, source);
    let target_name = text(function.child_by_field_name("field")?, source);
    let mut method = function.parent()?;
    loop {
        match method.kind() {
            "method_declaration" => break,
            "func_literal" | "function_declaration" => return None,
            _ => method = method.parent()?,
        }
    }
    let (receiver_name, receiver_type) = receiver(method)?;
    if text(receiver_name, source) == "_"
        || text(receiver_name, source) != text(operand, source)
        || context.receiver_shadows.contains(&method.id())
    {
        return None;
    }
    let receiver_type_name = text(receiver_type, source);
    let owner = context
        .concrete_types
        .get(&receiver_type_name)
        .or_else(|| context.embedded_owners.get(&receiver_type_name))?;
    if !owner.is_struct
        || context
            .field_methods
            .contains_key(&(receiver_type_name.clone(), field_name.clone()))
    {
        return None;
    }
    let caller = method.child_by_field_name("name")?;
    let callers = context
        .field_methods
        .get(&(receiver_type_name, text(caller, source)))?;
    if callers.as_slice() != [Span::from(caller)] {
        return None;
    }
    let field = owner.fields.get(&field_name)?;
    let field_type_name = field.type_name.as_ref()?;
    // A target must still have a direct local method on a concrete leaf type.
    // Interfaces (even one visible implementation) and promotion trees are gaps.
    let field_type = context.concrete_types.get(field_type_name)?;
    if field_type.fields.contains_key(&target_name) {
        return None;
    }
    let targets = context
        .field_methods
        .get(&(field_type_name.clone(), target_name))?;
    let [target] = targets.as_slice() else {
        return None;
    };
    Some(Provenance::GoFieldReceiver {
        package: context.package?,
        caller: Span::from(caller),
        receiver_type: owner.name,
        field: field.name,
        field_type: field_type.name,
        target: *target,
    })
}
