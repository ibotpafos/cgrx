//! Bounded same-file PHP type identity. No autoloading or basename fallback.
use super::*;

#[derive(Default)]
pub(super) struct TypeFacts {
    scopes: BTreeMap<usize, NamespaceScope>,
    declarations: BTreeMap<String, Option<TypeDeclaration>>,
}

struct NamespaceScope {
    end: usize,
    name: String,
    imports: BTreeMap<String, Import>,
    blocked: bool,
}

struct Import {
    target: String,
    span: Span,
}

struct TypeDeclaration {
    name: String,
    span: Span,
}

fn identifier(name: &str) -> bool {
    let mut bytes = name.bytes();
    bytes
        .next()
        .is_some_and(|b| b.is_ascii_alphabetic() || b == b'_')
        && bytes.all(|b| b.is_ascii_alphanumeric() || b == b'_')
}

fn qualified(name: &str) -> Option<String> {
    let name = name.strip_prefix('\\').unwrap_or(name);
    (!name.is_empty() && name.split('\\').all(identifier)).then(|| name.to_owned())
}

fn join(namespace: &str, name: &str) -> String {
    if namespace.is_empty() {
        name.to_owned()
    } else {
        format!("{namespace}\\{name}")
    }
}

fn preamble(node: Node<'_>, source: &[u8]) -> bool {
    matches!(node.kind(), "php_tag" | "comment")
        || node.kind() == "declare_statement"
            && matches!(
                text(node, source)
                    .chars()
                    .filter(|c| !c.is_whitespace())
                    .collect::<String>()
                    .as_str(),
                "declare(strict_types=1);" | "declare(strict_types=0);"
            )
}

impl TypeFacts {
    pub(super) fn collect(root: Node<'_>, source: &[u8]) -> Self {
        let mut facts = Self::default();
        if root.has_error() {
            return facts;
        }
        let children: Vec<_> = root.named_children(&mut root.walk()).collect();
        let namespaces: Vec<_> = children
            .iter()
            .copied()
            .filter(|n| n.kind() == "namespace_definition")
            .collect();
        if namespaces.is_empty() {
            facts.add_scope(Span::from(root), String::new(), &children, source);
        } else if namespaces
            .iter()
            .all(|n| n.child_by_field_name("body").is_some())
        {
            // Mixing bracketed and unbracketed namespaces, or executable code
            // outside bracketed namespaces, is not a supported source shape.
            if children
                .iter()
                .any(|n| n.kind() != "namespace_definition" && !preamble(*n, source))
            {
                return facts;
            }
            for namespace in namespaces {
                let name = namespace
                    .child_by_field_name("name")
                    .map(|n| qualified(&text(n, source)))
                    .unwrap_or(Some(String::new()));
                let Some(name) = name else {
                    return Self::default();
                };
                let body = namespace.child_by_field_name("body").unwrap();
                let nodes: Vec<_> = body.named_children(&mut body.walk()).collect();
                facts.add_scope(Span::from(body), name, &nodes, source);
            }
        } else if namespaces
            .iter()
            .all(|n| n.child_by_field_name("body").is_none())
        {
            let first = namespaces[0].start_byte();
            if children
                .iter()
                .any(|n| n.start_byte() < first && !preamble(*n, source))
            {
                return facts;
            }
            for (index, namespace) in namespaces.iter().enumerate() {
                let Some(name) = namespace
                    .child_by_field_name("name")
                    .and_then(|n| qualified(&text(n, source)))
                else {
                    return Self::default();
                };
                let start = namespace.end_byte();
                let end = namespaces
                    .get(index + 1)
                    .map_or(root.end_byte(), Node::start_byte);
                let nodes: Vec<_> = children
                    .iter()
                    .copied()
                    .filter(|n| start <= n.start_byte() && n.end_byte() <= end)
                    .collect();
                facts.add_scope(Span { start, end }, name, &nodes, source);
            }
        }
        // Import aliases and declarations share the class-like namespace.
        // An alias collision in this same file cannot be resolved by order.
        for scope in facts.scopes.values_mut() {
            scope.blocked |= scope.imports.keys().any(|alias| {
                facts
                    .declarations
                    .contains_key(&join(&scope.name, alias).to_ascii_lowercase())
            });
        }
        facts
    }

    fn add_scope(&mut self, span: Span, name: String, nodes: &[Node<'_>], source: &[u8]) {
        let mut scope = NamespaceScope {
            end: span.end,
            name,
            imports: BTreeMap::new(),
            blocked: false,
        };
        for node in nodes {
            self.declarations(*node, &scope.name, true, source);
            if node.kind() == "namespace_use_declaration" {
                scope.add_imports(*node, source);
            } else if contains_import(*node) {
                scope.blocked = true;
            }
        }
        self.scopes.insert(span.start, scope);
    }

    fn declarations(&mut self, node: Node<'_>, namespace: &str, top_level: bool, source: &[u8]) {
        if matches!(
            node.kind(),
            "class_declaration"
                | "interface_declaration"
                | "enum_declaration"
                | "trait_declaration"
        ) && let Some(name) = node.child_by_field_name("name")
        {
            let spelling = text(name, source);
            let key = join(namespace, &spelling).to_ascii_lowercase();
            let supported =
                top_level && identifier(&spelling) && node.kind() != "trait_declaration";
            self.declarations
                .entry(key)
                .and_modify(|entry| *entry = None)
                .or_insert_with(|| {
                    supported.then_some(TypeDeclaration {
                        name: spelling,
                        span: Span::from(name),
                    })
                });
        }
        for child in node.named_children(&mut node.walk()) {
            self.declarations(child, namespace, false, source);
        }
    }

    pub(super) fn reference(&self, node: Node<'_>, source: &[u8]) -> Option<Edge> {
        let (_, scope) = self.scopes.range(..=node.start_byte()).next_back()?;
        if scope.blocked || node.end_byte() > scope.end {
            return None;
        }
        let raw = text(node, source);
        let (name, import) = scope.resolve(&raw, node.start_byte())?;
        let target = self
            .declarations
            .get(&name.to_ascii_lowercase())?
            .as_ref()?;
        let owner = type_owner(node)?;
        Some(Edge {
            relation: RelationKind::References,
            target: target.name.clone(),
            span: Span::from(node),
            context_span: Span::from(node),
            provenance: Provenance::PhpType {
                owner,
                target: target.span,
                import,
            },
        })
    }
}

fn contains_import(node: Node<'_>) -> bool {
    matches!(
        node.kind(),
        "namespace_use_declaration" | "namespace_definition"
    ) || node.named_children(&mut node.walk()).any(contains_import)
}

impl NamespaceScope {
    fn add_imports(&mut self, declaration: Node<'_>, source: &[u8]) {
        // Function and constant imports do not affect the type import table.
        if declaration.child_by_field_name("type").is_some() {
            return;
        }
        for child in declaration.named_children(&mut declaration.walk()) {
            match child.kind() {
                "namespace_use_clause" => self.add_import(child, "", source),
                "namespace_use_group" => {
                    let prefix = declaration
                        .named_children(&mut declaration.walk())
                        .find(|n| n.kind() == "namespace_name")
                        .and_then(|n| qualified(&text(n, source)));
                    let Some(prefix) = prefix else {
                        self.blocked = true;
                        continue;
                    };
                    for clause in child.named_children(&mut child.walk()) {
                        if clause.kind() == "namespace_use_clause" {
                            self.add_import(clause, &prefix, source);
                        }
                    }
                }
                _ => {}
            }
        }
    }

    fn add_import(&mut self, clause: Node<'_>, prefix: &str, source: &[u8]) {
        if clause.child_by_field_name("type").is_some() {
            return;
        }
        let Some(target) = clause
            .named_child(0)
            .and_then(|n| qualified(&text(n, source)))
        else {
            self.blocked = true;
            return;
        };
        let alias = clause
            .child_by_field_name("alias")
            .map(|n| text(n, source))
            .unwrap_or_else(|| target.rsplit('\\').next().unwrap().to_owned());
        if !identifier(&alias) {
            self.blocked = true;
            return;
        }
        let binding = Import {
            target: join(prefix, &target),
            span: Span::from(clause),
        };
        if self
            .imports
            .insert(alias.to_ascii_lowercase(), binding)
            .is_some()
        {
            self.blocked = true;
        }
    }

    fn resolve(&self, raw: &str, at: usize) -> Option<(String, Option<Span>)> {
        if raw.starts_with('\\') {
            return Some((qualified(raw)?, None));
        }
        let name = qualified(raw)?;
        let (first, rest) = name
            .split_once('\\')
            .map_or((name.as_str(), None), |(a, b)| (a, Some(b)));
        if first.eq_ignore_ascii_case("namespace") {
            return Some((join(&self.name, rest?), None));
        }
        if matches!(
            first.to_ascii_lowercase().as_str(),
            "self" | "parent" | "static"
        ) {
            return None;
        }
        if let Some(import) = self.imports.get(&first.to_ascii_lowercase()) {
            // Never apply a later import retroactively to an earlier usage.
            if import.span.end > at {
                return None;
            }
            let resolved =
                rest.map_or_else(|| import.target.clone(), |tail| join(&import.target, tail));
            return Some((resolved, Some(import.span)));
        }
        Some((join(&self.name, &name), None))
    }
}

fn type_owner(node: Node<'_>) -> Option<Span> {
    let mut parent = node.parent();
    while let Some(owner) = parent {
        match owner.kind() {
            "anonymous_function" | "arrow_function" | "anonymous_class" | "attribute"
            | "attribute_list" | "property_hook" => return None,
            "function_definition"
            | "method_declaration"
            | "class_declaration"
            | "interface_declaration"
            | "trait_declaration"
            | "enum_declaration" => {
                return owner.child_by_field_name("name").map(Span::from);
            }
            _ => parent = owner.parent(),
        }
    }
    None
}
