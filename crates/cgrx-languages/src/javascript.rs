//! Opt-in JavaScript identity proofs. Dynamic receivers never use name fallback.
#[cfg(feature = "experimental-javascript")]
use crate::pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, Span, Symbol,
    UnresolvedKind, normalize_extraction, text, unresolved, walk_with,
};
#[cfg(feature = "experimental-javascript")]
use crate::typescript::LexicalContext;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::Path;
#[cfg(feature = "experimental-javascript")]
use tree_sitter::{Language, Node, Parser};

#[cfg(feature = "experimental-javascript")]
pub(crate) static JAVASCRIPT: JavaScript = JavaScript;
#[cfg(feature = "experimental-javascript")]
pub(crate) struct JavaScript;

pub fn is_javascript_path(path: &str) -> bool {
    matches!(
        Path::new(path).extension().and_then(|s| s.to_str()),
        Some("js" | "mjs" | "cjs")
    )
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum ModuleKind {
    Esm,
    CommonJs,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum PackageKind {
    Automatic,
    Esm,
    CommonJs,
    Unsupported,
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum SiteKind {
    Call,
    Import,
    Reference,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Import {
    pub module: String,
    pub exported: String,
    pub binding: [usize; 2],
    pub site: [usize; 2],
    pub kind: ModuleKind,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum Target {
    Local([usize; 2]),
    Import([usize; 2]),
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Site {
    pub span: [usize; 2],
    pub caller: Option<[usize; 2]>,
    pub kind: SiteKind,
    #[serde(default)]
    pub constructor: bool,
    pub target: Target,
}
#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct FileFacts {
    pub valid: bool,
    pub imports: Vec<Import>,
    pub exports: BTreeMap<String, Vec<[usize; 2]>>,
    pub module_kind: Option<ModuleKind>,
    pub sites: Vec<Site>,
    #[serde(default)]
    pub constructors: Vec<[usize; 2]>,
    #[serde(default)]
    pub unsupported_sites: Vec<[usize; 2]>,
}

#[cfg(feature = "experimental-javascript")]
impl LanguagePack for JavaScript {
    fn id(&self) -> &'static str {
        "javascript"
    }
    fn extensions(&self) -> &'static [&'static str] {
        &["js", "mjs", "cjs"]
    }
    fn language(&self) -> Language {
        tree_sitter_javascript::LANGUAGE.into()
    }
    fn extract(&self, path: &Path, source: &[u8]) -> Result<Extraction, ExtractError> {
        analyze(path, source).map(|(extraction, _)| extraction)
    }
    fn classify(&self, _node: Node<'_>, _source: &[u8], _extraction: &mut Extraction) {}
}

#[cfg(feature = "experimental-javascript")]
fn range(node: Node<'_>) -> [usize; 2] {
    [node.start_byte(), node.end_byte()]
}
#[cfg(feature = "experimental-javascript")]
fn span(value: [usize; 2]) -> Span {
    Span {
        start: value[0],
        end: value[1],
    }
}
#[cfg(feature = "experimental-javascript")]
fn visit(node: Node<'_>, apply: &mut impl FnMut(Node<'_>)) {
    apply(node);
    let mut cursor = node.walk();
    for child in node.named_children(&mut cursor) {
        visit(child, apply);
    }
}

#[cfg(feature = "experimental-javascript")]
pub(crate) fn callable_name<'a>(node: Node<'a>, _source: &[u8]) -> Option<Node<'a>> {
    match node.kind() {
        "function_declaration" | "method_definition" => node
            .child_by_field_name("name")
            .filter(|name| matches!(name.kind(), "identifier" | "property_identifier")),
        "function_expression" | "arrow_function" => {
            let parent = node.parent()?;
            let name = match parent.kind() {
                "variable_declarator" => parent.child_by_field_name("name"),
                "assignment_expression" => parent.child_by_field_name("left").and_then(|left| {
                    if left.kind() == "member_expression"
                        && left.child_by_field_name("optional_chain").is_none()
                    {
                        left.child_by_field_name("property")
                    } else {
                        None
                    }
                }),
                _ => node.child_by_field_name("name"),
            };
            name.filter(|name| matches!(name.kind(), "identifier" | "property_identifier"))
        }
        _ => None,
    }
}

#[cfg(feature = "experimental-javascript")]
fn literal(node: Node<'_>, source: &[u8]) -> Option<String> {
    if node.kind() != "string" {
        return None;
    }
    let value = text(node, source);
    let value = value.get(1..value.len().checked_sub(1)?)?;
    (!value.is_empty() && !value.contains(['\\', '?', '#', '\0'])).then(|| value.to_owned())
}
#[cfg(feature = "experimental-javascript")]
fn member<'a>(node: Node<'a>, source: &[u8], object: &str, property: &str) -> bool {
    node.kind() == "member_expression"
        && node.child_by_field_name("optional_chain").is_none()
        && node
            .child_by_field_name("object")
            .is_some_and(|n| n.kind() == "identifier" && text(n, source) == object)
        && node
            .child_by_field_name("property")
            .is_some_and(|n| text(n, source) == property)
}
#[cfg(feature = "experimental-javascript")]
fn commonjs_export(node: Node<'_>, source: &[u8]) -> Option<String> {
    if member(node, source, "module", "exports") {
        return Some("default".to_owned());
    }
    let object = node.child_by_field_name("object")?;
    let property = node.child_by_field_name("property")?;
    (node.kind() == "member_expression"
        && object.kind() == "identifier"
        && text(object, source) == "exports"
        && property.kind() == "property_identifier")
        .then(|| text(property, source))
}
#[cfg(feature = "experimental-javascript")]
fn top_assignment(node: Node<'_>) -> bool {
    node.parent().is_some_and(|statement| {
        statement.kind() == "expression_statement"
            && statement
                .parent()
                .is_some_and(|root| root.kind() == "program")
    })
}
#[cfg(feature = "experimental-javascript")]
fn wrapper_left(node: Node<'_>, source: &[u8]) -> bool {
    let mut current = node;
    while let Some(parent) = current.parent() {
        if parent.kind() != "member_expression" {
            break;
        }
        current = parent;
    }
    current.parent().is_some_and(|assignment| {
        assignment.kind() == "assignment_expression"
            && assignment.child_by_field_name("left") == Some(current)
            && top_assignment(assignment)
            && commonjs_export(current, source).is_some()
    })
}

impl FileFacts {
    #[cfg(feature = "experimental-javascript")]
    pub fn parse(path: &str, source: &[u8]) -> Self {
        analyze(Path::new(path), source)
            .map(|(_, facts)| facts)
            .unwrap_or_default()
    }
    #[cfg(not(feature = "experimental-javascript"))]
    pub fn parse(_path: &str, _source: &[u8]) -> Self {
        Self::default()
    }
}

#[cfg(feature = "experimental-javascript")]
fn analyze(path: &Path, source: &[u8]) -> Result<(Extraction, FileFacts), ExtractError> {
    if path.is_absolute() {
        return Err(ExtractError::AbsolutePath);
    }
    let mut parser = Parser::new();
    parser
        .set_language(&JAVASCRIPT.language())
        .map_err(|_| ExtractError::ParserLanguage)?;
    let tree = parser
        .parse(source, None)
        .ok_or(ExtractError::ParseFailed)?;
    let root = tree.root_node();
    let context = LexicalContext::for_javascript(root, source);
    let mut facts = FileFacts {
        valid: !root.has_error(),
        ..FileFacts::default()
    };
    let mut commonjs_safe = true;
    let mut esm = false;
    let mut commonjs = false;
    // eval/with can introduce or replace lexical identity. A wrapper that escapes
    // or is shadowed cannot establish stable CommonJS exports.
    visit(root, &mut |node| {
        if node.kind() == "with_statement"
            || (node.kind() == "call_expression"
                && node
                    .child_by_field_name("function")
                    .is_some_and(|n| text(n, source) == "eval"))
        {
            facts.valid = false;
        }
        if node.kind() == "identifier"
            && matches!(text(node, source).as_str(), "exports" | "module")
            && (!wrapper_left(node, source) || !context.javascript_unbound(node, source))
        {
            commonjs_safe = false;
        }
    });
    let mut cursor = root.walk();
    for item in root.named_children(&mut cursor) {
        if item.kind() == "import_statement" {
            esm = true;
            facts.module_kind = Some(ModuleKind::Esm);
            let Some(module) = item
                .child_by_field_name("source")
                .and_then(|n| literal(n, source))
            else {
                facts.unsupported_sites.push(range(item));
                continue;
            };
            let before = facts.imports.len();
            let mut namespace = false;
            visit(item, &mut |node| {
                namespace |= node.kind() == "namespace_import";
                let pair = if node.kind() == "import_specifier" {
                    node.child_by_field_name("name").map(|name| {
                        (
                            node.child_by_field_name("alias").unwrap_or(name),
                            text(name, source),
                        )
                    })
                } else if node.kind() == "import_clause" {
                    let mut cursor = node.walk();
                    node.named_children(&mut cursor)
                        .find(|n| n.kind() == "identifier")
                        .map(|name| (name, "default".to_owned()))
                } else {
                    None
                };
                if let Some((name, exported)) = pair {
                    facts.imports.push(Import {
                        module: module.clone(),
                        exported,
                        binding: range(name),
                        site: range(item),
                        kind: ModuleKind::Esm,
                    });
                }
            });
            if namespace || facts.imports.len() == before {
                facts.unsupported_sites.push(range(item));
            }
        }
        if matches!(item.kind(), "variable_declaration" | "lexical_declaration") {
            let mut cursor = item.walk();
            for variable in item.named_children(&mut cursor) {
                let Some(name) = variable
                    .child_by_field_name("name")
                    .filter(|n| n.kind() == "identifier")
                else {
                    continue;
                };
                let Some(value) = variable
                    .child_by_field_name("value")
                    .filter(|n| n.kind() == "call_expression")
                else {
                    continue;
                };
                let Some(function) = value
                    .child_by_field_name("function")
                    .filter(|n| n.kind() == "identifier" && text(*n, source) == "require")
                else {
                    continue;
                };
                if !context.javascript_unbound(function, source) {
                    continue;
                }
                let Some(arguments) = value.child_by_field_name("arguments") else {
                    continue;
                };
                let mut cursor = arguments.walk();
                let args: Vec<_> = arguments
                    .named_children(&mut cursor)
                    .filter(|n| n.kind() != "comment")
                    .collect();
                let [argument] = args.as_slice() else {
                    continue;
                };
                if let Some(module) = literal(*argument, source) {
                    commonjs = true;
                    facts.imports.push(Import {
                        module,
                        exported: "default".to_owned(),
                        binding: range(name),
                        site: range(value),
                        kind: ModuleKind::CommonJs,
                    });
                }
            }
        }
        if item.kind() == "export_statement" {
            esm = true;
            facts.module_kind = Some(ModuleKind::Esm);
            if item.child_by_field_name("source").is_some() {
                facts.unsupported_sites.push(range(item));
            }
            let mut cursor = item.walk();
            let default = item.children(&mut cursor).any(|n| n.kind() == "default");
            if let Some(declaration) = item.child_by_field_name("declaration") {
                visit(declaration, &mut |node| {
                    let name = if (node == declaration && node.kind() == "function_declaration")
                        || (node.kind() == "variable_declarator"
                            && node.parent() == Some(declaration))
                    {
                        node.child_by_field_name("name")
                    } else {
                        None
                    };
                    if let Some(name) = name.filter(|n| n.kind() == "identifier")
                        && let Some(target) = context.javascript_declaration(name, source)
                    {
                        facts
                            .exports
                            .entry(if default {
                                "default".to_owned()
                            } else {
                                text(name, source)
                            })
                            .or_default()
                            .push([target.start, target.end]);
                    }
                });
            }
            // Named re-exports need an additional dependency proof; abstain.
            {
                visit(item, &mut |node| {
                    if node.kind() != "export_specifier" {
                        return;
                    }
                    let Some(name) = node.child_by_field_name("name") else {
                        return;
                    };
                    let exported = node.child_by_field_name("alias").unwrap_or(name);
                    let target = item
                        .child_by_field_name("source")
                        .is_none()
                        .then(|| context.javascript_declaration(name, source))
                        .flatten()
                        .map(|target| [target.start, target.end])
                        .unwrap_or([0, 0]);
                    facts
                        .exports
                        .entry(text(exported, source))
                        .or_default()
                        .push(target);
                });
            }
        }
        if item.kind() == "expression_statement" {
            let mut cursor = item.walk();
            for assignment in item
                .named_children(&mut cursor)
                .filter(|n| n.kind() == "assignment_expression")
            {
                let Some(left) = assignment.child_by_field_name("left") else {
                    continue;
                };
                let Some(exported) = commonjs_export(left, source) else {
                    continue;
                };
                commonjs = true;
                if facts.module_kind == Some(ModuleKind::Esm) {
                    commonjs_safe = false;
                } else {
                    facts.module_kind = Some(ModuleKind::CommonJs);
                }
                let target = assignment
                    .child_by_field_name("right")
                    .and_then(|right| {
                        if right.kind() == "identifier" {
                            context
                                .javascript_binding(right, source)
                                .and_then(|(_, _, target)| target)
                        } else {
                            callable_name(right, source).map(Span::from)
                        }
                    })
                    .map(|target| [target.start, target.end])
                    .unwrap_or([0, 0]);
                facts.exports.entry(exported).or_default().push(target);
            }
        }
    }
    if (esm || path.extension().and_then(|s| s.to_str()) == Some("mjs")) && commonjs
        || (path.extension().and_then(|s| s.to_str()) == Some("cjs") && esm)
    {
        facts.valid = false;
        facts.exports.clear();
    }
    if facts.module_kind == Some(ModuleKind::CommonJs)
        && (!commonjs_safe || (facts.exports.contains_key("default") && facts.exports.len() > 1))
    {
        facts.exports.clear();
    }
    let mut extraction = Extraction::default();
    for import in &facts.imports {
        extraction.edges.push(Edge {
            relation: RelationKind::Imports,
            target: import.module.clone(),
            span: span(import.site),
            context_span: span(import.site),
            provenance: Provenance::Syntax,
        });
        facts.sites.push(Site {
            span: import.site,
            caller: None,
            kind: SiteKind::Import,
            constructor: false,
            target: Target::Import(import.binding),
        });
    }
    walk_with(
        root,
        source,
        &mut extraction,
        false,
        &mut |node, source, extraction| {
            if matches!(node.kind(), "import_statement" | "export_statement")
                && facts.unsupported_sites.contains(&range(node))
            {
                unresolved(UnresolvedKind::Dispatch, node, source, extraction);
            }
            if let Some(name) = callable_name(node, source) {
                let mut cursor = node.walk();
                if matches!(node.kind(), "function_declaration" | "function_expression")
                    && !node
                        .children(&mut cursor)
                        .any(|child| child.kind() == "async")
                {
                    facts.constructors.push(range(name));
                }
                let body = if name.start_byte() < node.start_byte() {
                    node.parent().unwrap_or(node)
                } else {
                    node
                };
                extraction.symbols.push(Symbol {
                    name: text(name, source),
                    span: Span::from(name),
                    search_span: Span::from(body),
                });
            }
            if node.kind() == "class_declaration"
                && let Some(name) = node.child_by_field_name("name")
            {
                extraction.symbols.push(Symbol {
                    name: text(name, source),
                    span: Span::from(name),
                    search_span: Span::from(node),
                });
            }
            if matches!(node.kind(), "call_expression" | "new_expression") {
                if facts
                    .imports
                    .iter()
                    .any(|import| import.kind == ModuleKind::CommonJs && import.site == range(node))
                {
                    return;
                }
                let function = node
                    .child_by_field_name("function")
                    .or_else(|| node.child_by_field_name("constructor"));
                let binding = function
                    .filter(|n| n.kind() == "identifier")
                    .and_then(|n| context.javascript_binding(n, source));
                let proof = binding
                    .and_then(|(identity, caller, local)| {
                        let caller = caller?;
                        let target = local
                            .map(|target| Target::Local([target.start, target.end]))
                            .or_else(|| {
                                facts
                                    .imports
                                    .iter()
                                    .any(|import| import.binding == [identity.start, identity.end])
                                    .then_some(Target::Import([identity.start, identity.end]))
                            })?;
                        Some((caller, target))
                    })
                    .filter(|_| facts.valid);
                if let Some((caller, target)) = proof {
                    facts.sites.push(Site {
                        span: range(node),
                        caller: Some([caller.start, caller.end]),
                        kind: SiteKind::Call,
                        constructor: node.kind() == "new_expression",
                        target,
                    });
                    extraction.edges.push(Edge {
                        relation: RelationKind::Calls,
                        target: text(function.unwrap(), source),
                        span: Span::from(node),
                        context_span: Span::from(node),
                        provenance: Provenance::Syntax,
                    });
                    // Runtime can reject a missing, stale or ambiguous imported target.
                    unresolved(UnresolvedKind::Dispatch, node, source, extraction);
                } else {
                    unresolved(UnresolvedKind::Dispatch, node, source, extraction);
                }
            }
            if node.kind() != "identifier" || !facts.valid || !value_reference(node) {
                return;
            }
            let Some((identity, caller, local)) = context.javascript_binding(node, source) else {
                return;
            };
            let target = local
                .map(|target| Target::Local([target.start, target.end]))
                .or_else(|| {
                    facts
                        .imports
                        .iter()
                        .any(|import| import.binding == [identity.start, identity.end])
                        .then_some(Target::Import([identity.start, identity.end]))
                });
            if let Some(target) = target {
                facts.sites.push(Site {
                    span: range(node),
                    caller: caller.map(|caller| [caller.start, caller.end]),
                    kind: SiteKind::Reference,
                    constructor: false,
                    target,
                });
                extraction.edges.push(Edge {
                    relation: RelationKind::References,
                    target: text(node, source),
                    span: Span::from(node),
                    context_span: Span::from(node),
                    provenance: Provenance::Syntax,
                });
            }
        },
    );
    normalize_extraction(&mut extraction);
    Ok((extraction, facts))
}

#[cfg(feature = "experimental-javascript")]
fn value_reference(node: Node<'_>) -> bool {
    let Some(parent) = node.parent() else {
        return false;
    };
    if matches!(
        parent.kind(),
        "import_specifier" | "import_clause" | "export_specifier" | "formal_parameters"
    ) {
        return false;
    }
    ![
        "name",
        "parameter",
        "pattern",
        "left",
        "function",
        "constructor",
    ]
    .iter()
    .any(|field| parent.child_by_field_name(field) == Some(node))
}

/// Candidate inventory is intentionally wider than accepted JavaScript targets.
/// Package manifests, native modules and JSON compete but cannot prove a target.
pub fn module_candidates(from: &str, module: &str, kind: ModuleKind) -> Vec<String> {
    if !module.starts_with("./") && !module.starts_with("../")
        || module.contains(['\\', '?', '#', ':', '\0'])
    {
        return Vec::new();
    }
    let mut parts: Vec<_> = from.split('/').collect();
    parts.pop();
    for part in module.split('/') {
        match part {
            "." => {}
            ".." => {
                if parts.pop().is_none() {
                    return Vec::new();
                }
            }
            "" => return Vec::new(),
            _ => parts.push(part),
        }
    }
    let base = parts.join("/");
    if is_javascript_path(&base) {
        return vec![base];
    }
    if kind == ModuleKind::Esm || Path::new(&base).extension().is_some() {
        return Vec::new();
    }
    [
        "",
        ".js",
        ".json",
        ".node",
        "/index.js",
        "/index.json",
        "/package.json",
    ]
    .iter()
    .map(|suffix| format!("{base}{suffix}"))
    .collect()
}

pub fn resolve_site(
    files: &BTreeMap<String, FileFacts>,
    inventory: &BTreeMap<String, Vec<String>>,
    path: &str,
    site: &Site,
) -> Option<(String, [usize; 2])> {
    let file = files.get(path).filter(|file| file.valid)?;
    if file
        .sites
        .iter()
        .filter(|candidate| *candidate == site)
        .count()
        != 1
    {
        return None;
    }
    let resolved = match &site.target {
        Target::Local(target) => Some((path.to_owned(), *target)),
        Target::Import(binding) => {
            let imports: Vec<_> = file
                .imports
                .iter()
                .filter(|import| import.binding == *binding)
                .collect();
            let [import] = imports.as_slice() else {
                return None;
            };
            let candidates = module_candidates(path, &import.module, import.kind);
            let present: Vec<_> = candidates
                .iter()
                .flat_map(|candidate| {
                    inventory
                        .get(&candidate.to_ascii_lowercase())
                        .into_iter()
                        .flatten()
                })
                .collect();
            let [target_path] = present.as_slice() else {
                return None;
            };
            if !candidates.contains(target_path) {
                return None;
            }
            let target = files
                .get(*target_path)
                .filter(|file| file.valid && file.module_kind == Some(import.kind))?;
            let [target] = target.exports.get(&import.exported)?.as_slice() else {
                return None;
            };
            (target[0] < target[1]).then(|| ((*target_path).clone(), *target))
        }
    }?;
    if site.constructor && !files.get(&resolved.0)?.constructors.contains(&resolved.1) {
        return None;
    }
    Some(resolved)
}
