use std::fmt;
use std::path::Path;
use tree_sitter::{Language, Node, Parser};

pub type RepoPath = Path;

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct Span {
    pub start: usize,
    pub end: usize,
}

impl From<Node<'_>> for Span {
    fn from(node: Node<'_>) -> Self {
        Self {
            start: node.start_byte(),
            end: node.end_byte(),
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum RelationKind {
    Calls,
    Imports,
    References,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum Provenance {
    Syntax,
    /// Exact same-file self/super module path to a free function.
    RustModule {
        caller: Span,
        target: Span,
    },
    /// Direct own method across plain same-module inherent impls; exact spans.
    RustSelf {
        owner: Span,
        implementation: Span,
        target_implementation: Span,
        caller: Span,
        target: Span,
    },
    /// Same-file own receiver -> direct concrete field -> declared method.
    /// Type spans identify declarations, not guessed names; field is its name.
    GoFieldReceiver {
        package: Span,
        caller: Span,
        receiver_type: Span,
        field: Span,
        field_type: Span,
        target: Span,
    },
    /// Same-file lexical binding, with exact target and enclosing caller names.
    TsLexical {
        target: Span,
        caller: Span,
    },
    /// Actual import path and whether its local name was explicitly declared.
    GoImport {
        import_path: Span,
        explicit_alias: bool,
    },
    /// Same-source package/type identifiers and exact target method name span.
    GoSelfReceiver {
        package: Span,
        receiver_type: Span,
        target: Span,
    },
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct Symbol {
    pub name: String,
    pub span: Span,
    pub search_span: Span,
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct Edge {
    pub relation: RelationKind,
    pub target: String,
    pub span: Span,
    pub context_span: Span,
    pub provenance: Provenance,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum UnresolvedKind {
    DynamicProperty,
    Dispatch,
    Decorator,
    Overload,
    ParserError,
}

#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct Unresolved {
    pub kind: UnresolvedKind,
    pub span: Span,
    pub text: String,
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub struct Extraction {
    pub rust_file: Option<crate::rust::RustFileFacts>,
    /// Ancillary source identity; consumers bind this span to the full source
    /// hash. The existing structural digest/goldens remain symbol/edge based.
    pub package_span: Option<Span>,
    /// Const arrows are discoverable but never eligible for name-only resolution.
    pub lexical_arrows: Vec<Span>,
    pub symbols: Vec<Symbol>,
    pub edges: Vec<Edge>,
    pub parser_error_ranges: Vec<Span>,
    pub unresolved: Vec<Unresolved>,
}

impl Extraction {
    pub fn stable_hash(&self) -> [u8; 32] {
        let mut hasher = blake3::Hasher::new();
        for symbol in &self.symbols {
            update(&mut hasher, b"symbol", &symbol.name, symbol.span);
            update(
                &mut hasher,
                b"symbol_search",
                &symbol.name,
                symbol.search_span,
            );
        }
        for edge in &self.edges {
            update(
                &mut hasher,
                match edge.relation {
                    RelationKind::Calls => b"calls",
                    RelationKind::Imports => b"imports",
                    RelationKind::References => b"references",
                },
                &edge.target,
                edge.span,
            );
            update(&mut hasher, b"context", &edge.target, edge.context_span);
            if let Provenance::GoFieldReceiver {
                package,
                caller,
                receiver_type,
                field,
                field_type,
                target,
            } = edge.provenance
            {
                for (kind, span) in [
                    (b"go_field_package".as_slice(), package),
                    (b"go_field_caller", caller),
                    (b"go_field_receiver_type", receiver_type),
                    (b"go_field_name", field),
                    (b"go_field_type", field_type),
                    (b"go_field_target", target),
                ] {
                    update(&mut hasher, kind, "", span);
                }
            }
            if let Provenance::RustSelf {
                owner,
                implementation,
                target_implementation,
                caller,
                target,
            } = edge.provenance
            {
                for (kind, span) in [
                    (b"rust_self_owner".as_slice(), owner),
                    (b"rust_self_impl", implementation),
                    (b"rust_self_target_impl", target_implementation),
                    (b"rust_self_caller", caller),
                    (b"rust_self_target", target),
                ] {
                    update(&mut hasher, kind, "", span);
                }
            }
            if let Provenance::RustModule { caller, target } = edge.provenance {
                update(&mut hasher, b"rust_module_caller", "", caller);
                update(&mut hasher, b"rust_module_target", "", target);
            }
            if let Provenance::TsLexical { target, caller } = edge.provenance {
                update(&mut hasher, b"ts_lexical_target", "", target);
                update(&mut hasher, b"ts_lexical_caller", "", caller);
            }
            if let Provenance::GoImport {
                import_path,
                explicit_alias,
            } = edge.provenance
            {
                update(
                    &mut hasher,
                    b"go_import_path",
                    if explicit_alias {
                        "explicit"
                    } else {
                        "implicit"
                    },
                    import_path,
                );
            }
            if let Provenance::GoSelfReceiver {
                package,
                receiver_type,
                target,
            } = edge.provenance
            {
                update(&mut hasher, b"go_self_package", "", package);
                update(&mut hasher, b"go_self_type", "", receiver_type);
                update(&mut hasher, b"go_self_target", "", target);
            }
        }
        for span in &self.lexical_arrows {
            update(&mut hasher, b"lexical_arrow", "", *span);
        }
        for span in &self.parser_error_ranges {
            update(&mut hasher, b"parser_error", "", *span);
        }
        for candidate in &self.unresolved {
            let kind: &[u8] = match candidate.kind {
                UnresolvedKind::DynamicProperty => b"dynamic_property",
                UnresolvedKind::Dispatch => b"dispatch",
                UnresolvedKind::Decorator => b"decorator",
                UnresolvedKind::Overload => b"overload",
                UnresolvedKind::ParserError => b"parser_error",
            };
            update(&mut hasher, kind, &candidate.text, candidate.span);
        }
        *hasher.finalize().as_bytes()
    }
}

fn update(hasher: &mut blake3::Hasher, kind: &[u8], text: &str, span: Span) {
    hasher.update(&(kind.len() as u64).to_le_bytes());
    hasher.update(kind);
    hasher.update(&(text.len() as u64).to_le_bytes());
    hasher.update(text.as_bytes());
    hasher.update(&(span.start as u64).to_le_bytes());
    hasher.update(&(span.end as u64).to_le_bytes());
}

#[derive(Debug, Eq, PartialEq)]
pub enum ExtractError {
    AbsolutePath,
    ParserLanguage,
    ParseFailed,
}

impl fmt::Display for ExtractError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(match self {
            Self::AbsolutePath => "repository path must be relative",
            Self::ParserLanguage => "parser language initialization failed",
            Self::ParseFailed => "parser returned no syntax tree",
        })
    }
}

impl std::error::Error for ExtractError {}

pub trait LanguagePack: Send + Sync {
    fn id(&self) -> &'static str;
    fn extensions(&self) -> &'static [&'static str];
    fn language(&self) -> Language;
    fn language_for_path(&self, _path: &RepoPath) -> Language {
        self.language()
    }
    fn classify(&self, node: Node<'_>, source: &[u8], extraction: &mut Extraction);

    fn extract(&self, path: &RepoPath, source: &[u8]) -> Result<Extraction, ExtractError> {
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
        let mut extraction = Extraction::default();
        walk_with(
            tree.root_node(),
            source,
            &mut extraction,
            false,
            &mut |node, source, extraction| self.classify(node, source, extraction),
        );
        normalize_extraction(&mut extraction);
        Ok(extraction)
    }
}

pub(crate) fn normalize_extraction(extraction: &mut Extraction) {
    extraction.lexical_arrows.sort();
    extraction.lexical_arrows.dedup();
    extraction.symbols.sort();
    extraction.symbols.dedup();
    extraction.edges.sort();
    extraction.edges.dedup();
    extraction.parser_error_ranges.sort();
    extraction.parser_error_ranges.dedup();
    extraction.unresolved.sort();
    extraction.unresolved.dedup();
}

pub(crate) fn walk_with<'tree>(
    node: Node<'tree>,
    source: &[u8],
    extraction: &mut Extraction,
    inside_error: bool,
    classify: &mut impl FnMut(Node<'tree>, &[u8], &mut Extraction),
) {
    let covered_by_error = inside_error || node.is_error() || node.is_missing();
    if node.is_error() || node.is_missing() {
        let span = Span::from(node);
        extraction.parser_error_ranges.push(span);
        extraction.unresolved.push(Unresolved {
            kind: UnresolvedKind::ParserError,
            span,
            text: text(node, source),
        });
    }
    if !covered_by_error {
        classify(node, source, extraction);
    }
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        walk_with(child, source, extraction, covered_by_error, classify);
    }
}

pub(crate) fn has_ancestor(mut node: Node<'_>, kind: &str) -> bool {
    while let Some(parent) = node.parent() {
        if parent.kind() == kind {
            return true;
        }
        node = parent;
    }
    false
}

pub(crate) fn text(node: Node<'_>, source: &[u8]) -> String {
    node.utf8_text(source).unwrap_or_default().to_owned()
}

pub(crate) fn symbol(node: Node<'_>, source: &[u8], extraction: &mut Extraction) {
    if let Some(name) = node.child_by_field_name("name") {
        extraction.symbols.push(Symbol {
            name: text(name, source),
            span: Span::from(name),
            search_span: Span::from(node),
        });
    }
}

pub(crate) fn unresolved(
    kind: UnresolvedKind,
    node: Node<'_>,
    source: &[u8],
    extraction: &mut Extraction,
) {
    extraction.unresolved.push(Unresolved {
        kind,
        span: Span::from(node),
        text: text(node, source),
    });
}

pub(crate) fn evidence_span(mut node: Node<'_>, statement_kinds: &[&str]) -> Span {
    while let Some(parent) = node.parent() {
        if statement_kinds.contains(&parent.kind()) {
            return Span::from(parent);
        }
        node = parent;
    }
    Span::from(node)
}

pub fn pack_for_path(path: &RepoPath) -> Option<&'static dyn LanguagePack> {
    let extension = path.extension()?.to_str()?;
    [
        &crate::typescript::TYPESCRIPT as &dyn LanguagePack,
        &crate::go::GO,
        &crate::python::PYTHON,
        &crate::rust::RUST,
    ]
    .into_iter()
    .find(|pack| pack.extensions().contains(&extension))
}
