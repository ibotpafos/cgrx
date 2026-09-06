//! Bounded source-based TypeScript import/export identity.
//! The parent runtime must use these targets instead of name fallback.
use crate::pack::text;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use tree_sitter::{Node, Parser};

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct TsFileFacts {
    pub imports: Vec<Import>,
    pub calls: Vec<ImportCall>,
    /// All observed direct identifier call sites, including rejected ones.
    /// Old facts without sites fail closed in classify_call.
    #[serde(default)]
    pub sites: Vec<ImportSiteFact>,
    #[serde(default)]
    pub receiver_calls: Vec<ReceiverCall>,
    #[serde(default)]
    pub classes: BTreeMap<String, Vec<ClassFact>>,
    pub exports: BTreeMap<String, Vec<Export>>,
    pub declarations: BTreeMap<String, Vec<[usize; 2]>>,
    pub valid: bool,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct ReceiverCall {
    pub caller: [usize; 2],
    pub call: [usize; 2],
    pub method: String,
    pub receiver_import: Import,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct ClassFact {
    pub name: [usize; 2],
    pub methods: BTreeMap<String, Vec<[usize; 2]>>,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Import {
    pub local: String,
    pub imported: String,
    pub module: String,
    pub span: [usize; 2],
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct ImportCall {
    pub caller: [usize; 2],
    pub call: [usize; 2],
    pub import: Import,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum Export {
    Local(String),
    From { module: String, imported: String },
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ResolvedImport {
    pub path: String,
    pub target: [usize; 2],
    pub dependencies: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum SiteBinding {
    /// This is not an import proof: retain the ordinary lexical classifier.
    NotImport,
    Rejected,
    Candidate(Import),
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct ImportSiteFact {
    pub call: [usize; 2],
    pub caller: Option<[usize; 2]>,
    pub binding: SiteBinding,
}

/// Result for one exact full call-expression span. Rejected never permits name fallback.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ImportClassification {
    NotImport,
    Rejected,
    Exact(ResolvedImport),
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ClassifiedImportSite {
    pub call: [usize; 2],
    /// Enclosing callable name span; None for top-level/anonymous contexts.
    pub caller: Option<[usize; 2]>,
    pub classification: ImportClassification,
}

pub fn classify_receiver_call_with_modules(
    files: &BTreeMap<String, TsFileFacts>,
    path: &str,
    call: [usize; 2],
    modules: &BTreeMap<(String, String), String>,
) -> ClassifiedImportSite {
    let mut result = ClassifiedImportSite {
        call,
        caller: None,
        classification: ImportClassification::Rejected,
    };
    let Some(file) = files.get(path).filter(|file| file.valid) else {
        return result;
    };
    let calls: Vec<_> = file
        .receiver_calls
        .iter()
        .filter(|candidate| candidate.call == call)
        .collect();
    let [site] = calls.as_slice() else {
        return result;
    };
    result.caller = Some(site.caller);
    result.classification = resolve_receiver_call(files, path, site, modules)
        .map(ImportClassification::Exact)
        .unwrap_or(ImportClassification::Rejected);
    result
}
/// Classify a FULL call-expression span, never just a name or start offset.
/// Missing/old/invalid facts and unknown spans are Rejected, not NotImport.
/// The caller must bind facts to current source hashes and a coherent inventory.
pub fn classify_call(
    files: &BTreeMap<String, TsFileFacts>,
    path: &str,
    call: [usize; 2],
) -> ClassifiedImportSite {
    classify_call_with_modules(files, path, call, &BTreeMap::new())
}
/// Overrides are config-proven relative specifiers, keyed by exact importer and
/// original module. They never change lexical binding or source span identity.
pub fn classify_call_with_modules(
    files: &BTreeMap<String, TsFileFacts>,
    path: &str,
    call: [usize; 2],
    modules: &BTreeMap<(String, String), String>,
) -> ClassifiedImportSite {
    let mut result = ClassifiedImportSite {
        call,
        caller: None,
        classification: ImportClassification::Rejected,
    };
    let Some(file) = files.get(path) else {
        return result;
    };
    let sites: Vec<_> = file.sites.iter().filter(|site| site.call == call).collect();
    let [site] = sites.as_slice() else {
        return result;
    };
    result.caller = site.caller;
    if !file.valid || call[0] >= call[1] {
        return result;
    }
    result.classification = match &site.binding {
        SiteBinding::NotImport => ImportClassification::NotImport,
        SiteBinding::Rejected => ImportClassification::Rejected,
        SiteBinding::Candidate(import) => {
            // Require the same full span, caller and local import identity in
            // the accepted candidate ledger before invoking repository lookup.
            let matching: Vec<_> = file
                .calls
                .iter()
                .filter(|c| c.call == call && Some(c.caller) == site.caller && &c.import == import)
                .collect();
            if matching.len() != 1 {
                return result;
            }
            resolve_call_with_modules(files, path, call[0], modules)
                .map(ImportClassification::Exact)
                .unwrap_or(ImportClassification::Rejected)
        }
    };
    result
}

fn span(node: Node<'_>) -> [usize; 2] {
    [node.start_byte(), node.end_byte()]
}
fn token(node: Node<'_>, kind: &str) -> bool {
    let mut c = node.walk();
    node.children(&mut c).any(|n| n.kind() == kind)
}
fn string(node: Node<'_>, source: &[u8]) -> Option<String> {
    if node.kind() != "string" {
        return None;
    }
    let value = text(node, source);
    let value = value.get(1..value.len().checked_sub(1)?)?;
    // Decoding escape sequences and resolver-specific paths are separate gates.
    (!value.contains(['\\', '?', '#']) && !value.is_empty()).then(|| value.to_owned())
}
fn visit(node: Node<'_>, f: &mut impl FnMut(Node<'_>)) {
    f(node);
    let mut cursor = node.walk();
    for child in node.named_children(&mut cursor) {
        visit(child, f);
    }
}

fn belongs_to_method(node: Node<'_>, method: Node<'_>) -> bool {
    let mut current = node.parent();
    while let Some(parent) = current {
        if parent.id() == method.id() {
            return true;
        }
        if matches!(
            parent.kind(),
            "class_declaration"
                | "abstract_class_declaration"
                | "method_definition"
                | "function_declaration"
                | "function_expression"
        ) {
            return false;
        }
        current = parent.parent();
    }
    false
}

fn collect_receiver_facts(root: Node<'_>, source: &[u8], facts: &mut TsFileFacts) {
    visit(root, &mut |class| {
        if !matches!(
            class.kind(),
            "class_declaration" | "abstract_class_declaration"
        ) {
            return;
        }
        let Some(class_name) = class.child_by_field_name("name") else {
            return;
        };
        let Some(body) = class.child_by_field_name("body") else {
            return;
        };
        let mut methods = BTreeMap::<String, Vec<[usize; 2]>>::new();
        let mut receivers = BTreeMap::<String, Vec<Import>>::new();
        let mut cursor = body.walk();
        let definitions: Vec<_> = body
            .named_children(&mut cursor)
            .filter(|node| node.kind() == "method_definition")
            .collect();
        for method in &definitions {
            let Some(name) = method.child_by_field_name("name") else {
                continue;
            };
            let method_name = text(name, source);
            if method_name != "constructor" {
                methods.entry(method_name).or_default().push(span(name));
                continue;
            }
            let Some(parameters) = method.child_by_field_name("parameters") else {
                continue;
            };
            let mut parameter_cursor = parameters.walk();
            for parameter in parameters.named_children(&mut parameter_cursor) {
                if !matches!(
                    parameter.kind(),
                    "required_parameter" | "optional_parameter"
                ) || !token(parameter, "accessibility_modifier")
                    || !token(parameter, "readonly")
                {
                    continue;
                }
                let Some(name) = parameter
                    .child_by_field_name("name")
                    .or_else(|| parameter.child_by_field_name("pattern"))
                    .filter(|node| node.kind() == "identifier")
                else {
                    continue;
                };
                let Some(annotation) = parameter.child_by_field_name("type") else {
                    continue;
                };
                let mut type_cursor = annotation.walk();
                let types: Vec<_> = annotation.named_children(&mut type_cursor).collect();
                let [type_name] = types.as_slice() else {
                    continue;
                };
                if type_name.kind() != "type_identifier" {
                    continue;
                }
                let type_name = text(*type_name, source);
                if facts.declarations.contains_key(&type_name) {
                    continue;
                }
                let imports: Vec<_> = facts
                    .imports
                    .iter()
                    .filter(|import| import.local == type_name && !import.imported.is_empty())
                    .cloned()
                    .collect();
                if let [import] = imports.as_slice() {
                    receivers
                        .entry(text(name, source))
                        .or_default()
                        .push(import.clone());
                }
            }
        }
        facts
            .classes
            .entry(text(class_name, source))
            .or_default()
            .push(ClassFact {
                name: span(class_name),
                methods,
            });
        for method in definitions {
            let Some(caller) = method.child_by_field_name("name") else {
                continue;
            };
            visit(method, &mut |call| {
                if call.kind() != "call_expression" {
                    return;
                }
                if !belongs_to_method(call, method) {
                    return;
                }
                let Some(function) = call
                    .child_by_field_name("function")
                    .filter(|node| node.kind() == "member_expression")
                else {
                    return;
                };
                let Some(method_name) = function.child_by_field_name("property") else {
                    return;
                };
                let Some(receiver_expression) = function
                    .child_by_field_name("object")
                    .filter(|node| node.kind() == "member_expression")
                else {
                    return;
                };
                let Some(object) = receiver_expression.child_by_field_name("object") else {
                    return;
                };
                let Some(receiver) = receiver_expression.child_by_field_name("property") else {
                    return;
                };
                if object.kind() != "this" {
                    return;
                }
                let receiver_name = text(receiver, source);
                let Some([receiver_import]) = receivers.get(&receiver_name).map(Vec::as_slice)
                else {
                    return;
                };
                facts.receiver_calls.push(ReceiverCall {
                    caller: span(caller),
                    call: span(call),
                    method: text(method_name, source),
                    receiver_import: receiver_import.clone(),
                });
            });
        }
    });
}
impl TsFileFacts {
    pub fn parse(path: &str, source: &[u8]) -> Self {
        let mut parser = Parser::new();
        let language = if path.ends_with(".tsx") {
            tree_sitter_typescript::LANGUAGE_TSX
        } else {
            tree_sitter_typescript::LANGUAGE_TYPESCRIPT
        };
        if parser.set_language(&language.into()).is_err() {
            return Self::default();
        }
        let Some(tree) = parser.parse(source, None) else {
            return Self::default();
        };
        let root = tree.root_node();
        let mut facts = Self {
            valid: !root.has_error(),
            ..Self::default()
        };
        let mut cursor = root.walk();
        for item in root.named_children(&mut cursor) {
            if item.kind() == "import_statement" {
                let module = item
                    .child_by_field_name("source")
                    .and_then(|n| string(n, source));
                let type_only = token(item, "type");
                visit(item, &mut |node| {
                    if matches!(
                        node.kind(),
                        "import_clause" | "namespace_import" | "import_require_clause"
                    ) {
                        let mut cursor = node.walk();
                        for local in node
                            .named_children(&mut cursor)
                            .filter(|n| n.kind() == "identifier")
                        {
                            facts.imports.push(Import {
                                local: text(local, source),
                                imported: String::new(),
                                module: String::new(),
                                span: span(local),
                            });
                        }
                    }
                    if node.kind() == "import_specifier" {
                        let Some(local) = node
                            .child_by_field_name("alias")
                            .or_else(|| node.child_by_field_name("name"))
                        else {
                            return;
                        };
                        let Some(imported) = node.child_by_field_name("name") else {
                            return;
                        };
                        facts.imports.push(Import {
                            local: text(local, source),
                            imported: if type_only
                                || token(node, "type")
                                || imported.kind() != "identifier"
                            {
                                String::new()
                            } else {
                                text(imported, source)
                            },
                            module: module.clone().unwrap_or_default(),
                            span: span(local),
                        });
                    }
                });
                continue;
            }
            let declaration = if item.kind() == "export_statement" {
                item.child_by_field_name("declaration")
            } else {
                Some(item)
            };
            if let Some(decl) = declaration {
                if let Some(name) = decl.child_by_field_name("name") {
                    // Only direct free-function implementations establish callable identity.
                    let value = if decl.kind() == "function_declaration"
                        && decl.child_by_field_name("body").is_some()
                    {
                        span(name)
                    } else {
                        [0, 0]
                    };
                    facts
                        .declarations
                        .entry(text(name, source))
                        .or_default()
                        .push(value);
                } else if matches!(decl.kind(), "lexical_declaration" | "variable_declaration") {
                    let mut cursor = decl.walk();
                    for variable in decl.named_children(&mut cursor) {
                        if let Some(name) = variable.child_by_field_name("name") {
                            let mut names = Vec::new();
                            super::binding_names(name, source, &mut names);
                            let target = if super::const_arrow(variable, source).is_some() {
                                span(name)
                            } else {
                                [0, 0]
                            };
                            for name in names {
                                facts
                                    .declarations
                                    .entry(name.clone())
                                    .or_default()
                                    .push(target);
                                if item.kind() == "export_statement"
                                    && !token(item, "default")
                                    && !token(item, "type")
                                {
                                    facts
                                        .exports
                                        .entry(name.clone())
                                        .or_default()
                                        .push(Export::Local(name));
                                }
                            }
                        }
                    }
                }
            }
            if item.kind() != "export_statement" {
                continue;
            }
            if token(item, "*") {
                // Explicit named exports override star exports. Unsupported star
                // lookup must not erase independently proven explicit targets.
                continue;
            }
            if token(item, "type") || token(item, "default") {
                continue;
            }
            if let Some(decl) = declaration
                && let Some(name) = decl.child_by_field_name("name")
            {
                let name = text(name, source);
                facts
                    .exports
                    .entry(name.clone())
                    .or_default()
                    .push(Export::Local(name));
            }
            let module = item.child_by_field_name("source");
            let mut cursor = item.walk();
            let clause = item
                .named_children(&mut cursor)
                .find(|n| n.kind() == "export_clause");
            let Some(clause) = clause else {
                continue;
            };
            visit(clause, &mut |node| {
                if node.kind() != "export_specifier" || token(node, "type") {
                    return;
                }
                let Some(name) = node
                    .child_by_field_name("name")
                    .filter(|n| n.kind() == "identifier")
                else {
                    return;
                };
                let Some(alias) = node
                    .child_by_field_name("alias")
                    .or(Some(name))
                    .filter(|n| n.kind() == "identifier")
                else {
                    return;
                };
                let export = if let Some(module) = module {
                    Export::From {
                        module: string(module, source).unwrap_or_default(),
                        imported: text(name, source),
                    }
                } else {
                    Export::Local(text(name, source))
                };
                facts
                    .exports
                    .entry(text(alias, source))
                    .or_default()
                    .push(export);
            });
        }
        collect_receiver_facts(root, source, &mut facts);
        let context = super::LexicalContext::with_import_proof(root, source, true);
        // Hoisted var declarations may collide from inside nested blocks.
        // Reuse the lexical collector's unique function/const-arrow verdict.
        // An arrow must have the same exact declaration span; collisions clear
        // that proof, and the write ledger below still invalidates reassignment.
        for (name, declarations) in &mut facts.declarations {
            if !context.scopes[0].bindings.get(name).is_some_and(|b| {
                b.syntax_function
                    || b.target.is_some_and(|target| {
                        declarations.as_slice() == [[target.start, target.end]]
                    })
            }) {
                declarations.push([0, 0]);
            }
        }
        // Direct writes to a top-level binding invalidate its identity. Writes
        // to a shadow in another lexical scope do not poison this binding.
        for (scope, name) in &context.writes {
            if context.binding_scope(*scope, name).is_none() {
                for import in facts.imports.iter_mut().filter(|i| &i.local == name) {
                    import.imported.clear();
                }
            }
            if context.binding_scope(*scope, name) == Some(0) {
                facts
                    .declarations
                    .entry(name.clone())
                    .or_default()
                    .push([0, 0]);
            }
        }
        visit(root, &mut |node| {
            if node.kind() != "call_expression" {
                return;
            }
            let Some(function) = node
                .child_by_field_name("function")
                .filter(|n| n.kind() == "identifier")
            else {
                return;
            };
            let local = text(function, source);
            let imports: Vec<_> = facts.imports.iter().filter(|i| i.local == local).collect();
            let site = context.calls.get(&node.id());
            let caller = site
                .and_then(|site| context.scopes[site.scope].owner)
                .map(|caller| [caller.start, caller.end]);
            let mut binding = SiteBinding::Rejected;
            if facts.valid
                && let Some(site) = site
            {
                let owner = context.binding_scope(site.scope, &local);
                if let Some(owner) = owner {
                    if !context.import_aliases.contains(&(owner, local.clone()))
                        && (owner != 0 || imports.is_empty())
                    {
                        // A real local shadow is not an imported call. This
                        // does NOT authorize name guessing for parameters/vars.
                        binding = SiteBinding::NotImport;
                    }
                } else if imports.is_empty() {
                    binding = SiteBinding::NotImport;
                } else if let [import] = imports.as_slice()
                    && !import.imported.is_empty()
                    && !site.unsupported
                    && let Some(caller) = caller
                    && !context
                        .writes
                        .iter()
                        .any(|(s, n)| n == &local && context.binding_scope(*s, n).is_none())
                {
                    let import = (*import).clone();
                    facts.calls.push(ImportCall {
                        caller,
                        call: span(node),
                        import: import.clone(),
                    });
                    binding = SiteBinding::Candidate(import);
                }
            }
            facts.sites.push(ImportSiteFact {
                call: span(node),
                caller,
                binding,
            });
        });
        facts
    }
}

/// Inventory keys must be canonical repository-relative paths and must include
/// competing JS/declaration files, even if their facts are invalid/unavailable.
pub fn module_candidates(from: &str, module: &str) -> Vec<String> {
    fn candidates(from: &str, module: &str) -> Option<Vec<String>> {
        if !module.starts_with("./") && !module.starts_with("../") {
            return None;
        }
        if module.contains(['\\', '?', '#', ':']) {
            return None;
        }
        let mut parts: Vec<&str> = from.split('/').collect();
        parts.pop()?;
        for part in module.split('/') {
            match part {
                "." => {}
                ".." => {
                    parts.pop()?;
                }
                "" => return None,
                _ => parts.push(part),
            }
        }
        let base = parts.join("/");
        if base.ends_with(".ts") || base.ends_with(".tsx") {
            return (!base.ends_with(".d.ts")).then(|| vec![base]);
        }
        // .utils is an extensionless TS module basename, unlike explicit
        // JS/JSON/ESM/declaration/resource extensions we do not support.
        if [
            ".js", ".jsx", ".json", ".mts", ".cts", ".mjs", ".cjs", ".css", ".node",
        ]
        .iter()
        .any(|ext| base.ends_with(ext))
        {
            return None;
        }
        Some(
            [
                ".ts",
                ".tsx",
                ".js",
                ".jsx",
                ".d.ts",
                ".json",
                ".mts",
                ".cts",
                ".mjs",
                ".cjs",
                "/index.ts",
                "/index.tsx",
                "/index.js",
                "/index.jsx",
                "/index.d.ts",
                "/index.json",
                "/package.json",
            ]
            .iter()
            .map(|suffix| format!("{base}{suffix}"))
            .collect(),
        )
    }
    candidates(from, module).unwrap_or_default()
}
fn module_path(
    files: &BTreeMap<String, TsFileFacts>,
    from: &str,
    module: &str,
    modules: &BTreeMap<(String, String), String>,
) -> Option<String> {
    let mapped = modules.get(&(from.to_owned(), module.to_owned()));
    let module = mapped.map_or(module, String::as_str);
    let found: Vec<_> = module_candidates(from, module)
        .into_iter()
        .filter(|p| files.contains_key(p))
        .collect();
    let [path] = found.as_slice() else {
        return None;
    };
    (path.ends_with(".ts") || path.ends_with(".tsx"))
        .then(|| path.clone())
        .filter(|p| !p.ends_with(".d.ts"))
}

/// Resolve one static module specifier to exactly one indexed source file.
/// Callers supply revision-bound alias mappings; ambiguous candidates abstain.
pub fn resolve_module_path(
    files: &BTreeMap<String, TsFileFacts>,
    from: &str,
    module: &str,
    modules: &BTreeMap<(String, String), String>,
) -> Option<String> {
    module_path(files, from, module, modules)
}

pub fn resolve_call(
    files: &BTreeMap<String, TsFileFacts>,
    path: &str,
    call_start: usize,
) -> Option<ResolvedImport> {
    resolve_call_with_modules(files, path, call_start, &BTreeMap::new())
}
fn resolve_call_with_modules(
    files: &BTreeMap<String, TsFileFacts>,
    path: &str,
    call_start: usize,
    modules: &BTreeMap<(String, String), String>,
) -> Option<ResolvedImport> {
    let file = files.get(path)?;
    if !file.valid {
        return None;
    }
    let calls: Vec<_> = file
        .calls
        .iter()
        .filter(|call| call.call[0] == call_start)
        .collect();
    let [call] = calls.as_slice() else {
        return None;
    };
    let target = module_path(files, path, &call.import.module, modules)?;
    let mut dependencies = vec![path.to_owned()];
    let (path, target) = resolve_export(
        files,
        &target,
        &call.import.imported,
        &mut BTreeSet::new(),
        &mut dependencies,
        0,
        modules,
    )?;
    Some(ResolvedImport {
        path,
        target,
        dependencies,
    })
}

fn resolve_receiver_call(
    files: &BTreeMap<String, TsFileFacts>,
    path: &str,
    call: &ReceiverCall,
    modules: &BTreeMap<(String, String), String>,
) -> Option<ResolvedImport> {
    let target = module_path(files, path, &call.receiver_import.module, modules)?;
    let mut dependencies = vec![path.to_owned()];
    let (target_path, class_name) = resolve_export_binding(
        files,
        &target,
        &call.receiver_import.imported,
        &mut BTreeSet::new(),
        &mut dependencies,
        0,
        modules,
    )?;
    let target_file = files.get(&target_path)?;
    if !target_file.valid {
        return None;
    }
    let [class] = target_file.classes.get(&class_name)?.as_slice() else {
        return None;
    };
    let [method] = class.methods.get(&call.method)?.as_slice() else {
        return None;
    };
    Some(ResolvedImport {
        path: target_path,
        target: *method,
        dependencies,
    })
}

fn resolve_export_binding(
    files: &BTreeMap<String, TsFileFacts>,
    path: &str,
    name: &str,
    seen: &mut BTreeSet<(String, String)>,
    dependencies: &mut Vec<String>,
    depth: usize,
    modules: &BTreeMap<(String, String), String>,
) -> Option<(String, String)> {
    if depth >= 8 || !seen.insert((path.to_owned(), name.to_owned())) {
        return None;
    }
    let file = files.get(path)?;
    if !file.valid {
        return None;
    }
    dependencies.push(path.to_owned());
    let [export] = file.exports.get(name)?.as_slice() else {
        return None;
    };
    let (module, imported) = match export {
        Export::Local(local) => {
            let imports: Vec<_> = file
                .imports
                .iter()
                .filter(|item| &item.local == local)
                .collect();
            if imports.is_empty() {
                return Some((path.to_owned(), local.clone()));
            }
            let [import] = imports.as_slice() else {
                return None;
            };
            (&import.module, &import.imported)
        }
        Export::From { module, imported } => (module, imported),
    };
    if module.is_empty() || imported.is_empty() {
        return None;
    }
    let next = module_path(files, path, module, modules)?;
    resolve_export_binding(
        files,
        &next,
        imported,
        seen,
        dependencies,
        depth + 1,
        modules,
    )
}

fn resolve_export(
    files: &BTreeMap<String, TsFileFacts>,
    path: &str,
    name: &str,
    seen: &mut BTreeSet<(String, String)>,
    dependencies: &mut Vec<String>,
    depth: usize,
    modules: &BTreeMap<(String, String), String>,
) -> Option<(String, [usize; 2])> {
    if depth >= 8 || !seen.insert((path.to_owned(), name.to_owned())) {
        return None;
    }
    let file = files.get(path)?;
    if !file.valid {
        return None;
    }
    dependencies.push(path.to_owned());
    let [export] = file.exports.get(name)?.as_slice() else {
        return None;
    };
    let (module, imported) = match export {
        Export::Local(local) => {
            if let Some(declarations) = file.declarations.get(local) {
                let [target] = declarations.as_slice() else {
                    return None;
                };
                if target[0] >= target[1] || file.imports.iter().any(|i| &i.local == local) {
                    return None;
                }
                return Some((path.to_owned(), *target));
            }
            let imports: Vec<_> = file.imports.iter().filter(|i| &i.local == local).collect();
            let [import] = imports.as_slice() else {
                return None;
            };
            (&import.module, &import.imported)
        }
        Export::From { module, imported } => (module, imported),
    };
    let next = module_path(files, path, module, modules)?;
    resolve_export(
        files,
        &next,
        imported,
        seen,
        dependencies,
        depth + 1,
        modules,
    )
}

#[cfg(test)]
#[path = "ts_imports_tests.rs"]
mod tests;
