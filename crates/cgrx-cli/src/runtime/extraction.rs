//! Source extraction: parsing files into StoredDocument records.
//!
//! This module contains extract_path (the core per-file extraction) and
//! extract_sources_parallel (the multi-threaded driver).

use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;

use cgrx_capsule::{ContextWindow, slice_source};
use cgrx_core::{ByteRange, Hash32};
use cgrx_languages::ts_imports::{SiteBinding, TsFileFacts};
use cgrx_languages::{
    Provenance as LanguageProvenance, RelationKind as LanguageRelation, Span, UnresolvedKind,
    pack_for_path,
};

use super::RuntimeError;
use super::helpers::{
    body_fingerprint, declaration_name, declaration_span, implements_spans, stable_node_id,
};
use super::{
    GoFieldTarget, GoLocalConstructorTarget, GoReceiverTarget, JavaConstructorTarget,
    RustSelfTarget, StoredArc, StoredDocument, TsLexicalTarget,
};

use cgrx_cgcr::SourceRange;

pub(super) struct ExtractedPath {
    pub(super) rust_file: Option<cgrx_languages::RustFileFacts>,
    pub(super) ts_file: Option<TsFileFacts>,
    pub(super) documents: Vec<StoredDocument>,
    #[allow(dead_code)]
    pub(super) reference_arcs: Vec<StoredArc>,
    pub(super) parser_error_ranges: Vec<SourceRange>,
    pub(super) dynamic_dispatch: Vec<String>,
}

pub(super) struct ExtractedSource {
    pub(super) relative: String,
    pub(super) hash: Hash32,
    pub(super) extracted: ExtractedPath,
}

pub(super) fn extract_sources_parallel(
    sources: &[(String, Vec<u8>)],
) -> Result<Vec<ExtractedSource>, RuntimeError> {
    if sources.is_empty() {
        return Ok(Vec::new());
    }
    let workers = std::thread::available_parallelism()
        .map_or(1, usize::from)
        .min(16)
        .min(sources.len());
    let chunk_size = sources.len().div_ceil(workers);
    let chunks = std::thread::scope(|scope| {
        let handles: Vec<_> = sources
            .chunks(chunk_size)
            .map(|chunk| {
                scope.spawn(move || {
                    chunk
                        .iter()
                        .map(|(relative, source)| {
                            Ok(ExtractedSource {
                                relative: relative.clone(),
                                hash: Hash32(*blake3::hash(source).as_bytes()),
                                extracted: extract_path(relative, source)?,
                            })
                        })
                        .collect::<Result<Vec<_>, RuntimeError>>()
                })
            })
            .collect();
        handles
            .into_iter()
            .map(|handle| {
                handle.join().map_err(|_| {
                    RuntimeError::new("extract_worker", "source extraction worker panicked")
                })?
            })
            .collect::<Result<Vec<_>, RuntimeError>>()
    })?;
    let mut extracted: Vec<_> = chunks.into_iter().flatten().collect();
    extracted.sort_by(|left, right| left.relative.cmp(&right.relative));
    Ok(extracted)
}

struct DocumentSeed {
    node_id: u64,
    qualified_name: String,
    text: String,
    search_text: String,
    span: Span,
    provenance: &'static str,
    semantic_tags: Vec<String>,
}

fn plain_document(relative: &str, seed: DocumentSeed) -> StoredDocument {
    StoredDocument {
        php_function_target: None,
        php_type_target: None,
        rust_module_target: None,
        rust_self_target: None,
        ts_lexical_target: None,
        ts_constructor_target: None,
        go_field_target: None,
        go_local_constructor_target: None,
        java_constructor_target: None,
        semantic_fingerprint: None,
        node_id: seed.node_id,
        qualified_name: seed.qualified_name,
        path: relative.to_owned(),
        text: seed.text,
        search_text: seed.search_text,
        span_start: seed.span.start,
        span_end: seed.span.end,
        body_start: seed.span.start,
        body_end: seed.span.end,
        provenance: seed.provenance.to_owned(),
        semantic_tags: seed.semantic_tags,
        go_receiver_target: None,
        go_import_path: None,
        go_import_explicit_alias: false,
        go_package: None,
    }
}

fn apply_ts_call_facts(
    relative: &str,
    source: &[u8],
    facts: Option<&TsFileFacts>,
    documents: &mut Vec<StoredDocument>,
) -> BTreeSet<[usize; 2]> {
    let ts_receiver_spans: BTreeSet<_> = facts
        .into_iter()
        .flat_map(|facts| facts.receiver_calls.iter().map(|receiver| receiver.call))
        .collect();
    if let Some(facts) = facts {
        for site in &facts.sites {
            let tag = match &site.binding {
                SiteBinding::Candidate(_) => "TS_IMPORT_CALL",
                SiteBinding::Rejected => "TS_IMPORT_REJECTED",
                SiteBinding::NotImport => continue,
            };
            if let Some(document) = documents.iter_mut().find(|document| {
                document.provenance == "CALLS"
                    && document.span_start == site.call[0]
                    && document.span_end == site.call[1]
            }) {
                document
                    .semantic_tags
                    .retain(|value| value != "DYNAMIC_DISPATCH");
                if !document.semantic_tags.iter().any(|value| value == tag) {
                    document.semantic_tags.push(tag.to_owned());
                }
                continue;
            }
            let SiteBinding::Candidate(import) = &site.binding else {
                continue;
            };
            let span = Span {
                start: site.call[0],
                end: site.call[1],
            };
            let slice = slice_source(
                source,
                ByteRange::new(span.start, span.end),
                ContextWindow::lines(0),
            );
            let text = String::from_utf8_lossy(&slice.bytes).into_owned();
            let identity = format!("call:{}", import.local);
            documents.push(plain_document(
                relative,
                DocumentSeed {
                    node_id: stable_node_id(relative, span, &identity),
                    qualified_name: import.local.clone(),
                    text: text.clone(),
                    search_text: text,
                    span,
                    provenance: "CALLS",
                    semantic_tags: vec!["EXACT_CALL".to_owned(), tag.to_owned()],
                },
            ));
        }
        for receiver in &facts.receiver_calls {
            let span = Span {
                start: receiver.call[0],
                end: receiver.call[1],
            };
            if let Some(document) = documents.iter_mut().find(|document| {
                document.provenance == "CALLS"
                    && document.span_start == span.start
                    && document.span_end == span.end
                    && document.qualified_name == receiver.method
            }) {
                document
                    .semantic_tags
                    .retain(|value| value != "DYNAMIC_DISPATCH");
                for tag in ["EXACT_CALL", "TS_RECEIVER_CALL"] {
                    if !document.semantic_tags.iter().any(|value| value == tag) {
                        document.semantic_tags.push(tag.to_owned());
                    }
                }
                continue;
            }
            let slice = slice_source(
                source,
                ByteRange::new(span.start, span.end),
                ContextWindow::lines(0),
            );
            let text = String::from_utf8_lossy(&slice.bytes).into_owned();
            let identity = format!("call:{}", receiver.method);
            documents.push(plain_document(
                relative,
                DocumentSeed {
                    node_id: stable_node_id(relative, span, &identity),
                    qualified_name: receiver.method.clone(),
                    text: text.clone(),
                    search_text: text,
                    span,
                    provenance: "CALLS",
                    semantic_tags: vec!["EXACT_CALL".to_owned(), "TS_RECEIVER_CALL".to_owned()],
                },
            ));
        }
    }

    ts_receiver_spans
}

pub(super) fn extract_path(relative: &str, source: &[u8]) -> Result<ExtractedPath, RuntimeError> {
    let relative_path = Path::new(relative);
    let ts_file = matches!(
        relative_path.extension().and_then(|value| value.to_str()),
        Some("ts" | "tsx")
    )
    .then(|| TsFileFacts::parse(relative, source));
    let pack = pack_for_path(relative_path)
        .ok_or_else(|| RuntimeError::new("unsupported_path", relative.to_owned()))?;
    let extraction = pack
        .extract(relative_path, source)
        .map_err(|error| RuntimeError::new("extract", error.to_string()))?;
    let go_package = extraction
        .package_span
        .and_then(|span| source.get(span.start..span.end))
        .and_then(|bytes| std::str::from_utf8(bytes).ok())
        .map(str::to_owned);
    let lexical_arrows: BTreeSet<_> = extraction.lexical_arrows.into_iter().collect();
    let symbols = extraction.symbols;
    let edges = extraction.edges;
    let php_targets: BTreeSet<_> = edges
        .iter()
        .filter_map(|edge| {
            if let LanguageProvenance::PhpFunction { target, .. } = edge.provenance {
                Some(target)
            } else {
                None
            }
        })
        .collect();
    let php_type_targets: BTreeSet<_> = edges
        .iter()
        .filter_map(|edge| {
            if let LanguageProvenance::PhpType { target, .. } = edge.provenance {
                Some(target)
            } else {
                None
            }
        })
        .collect();
    let php_source_hash = (!php_targets.is_empty() || !php_type_targets.is_empty())
        .then(|| Hash32(*blake3::hash(source).as_bytes()));
    let unresolved = extraction.unresolved;
    let overload_names: BTreeSet<_> = unresolved
        .iter()
        .filter(|candidate| candidate.kind == UnresolvedKind::Overload)
        .filter_map(|candidate| declaration_name(&candidate.text))
        .collect();
    let mut documents = Vec::new();
    for symbol in &symbols {
        let text = source
            .get(symbol.span.start..symbol.span.end)
            .and_then(|bytes| std::str::from_utf8(bytes).ok())
            .unwrap_or(&symbol.name)
            .to_owned();
        let search_text = source
            .get(symbol.search_span.start..symbol.search_span.end)
            .map_or_else(String::new, |bytes| {
                String::from_utf8_lossy(bytes).into_owned()
            });
        let semantic_fingerprint = body_fingerprint(&symbol.name, &search_text);
        let semantic_tags = if lexical_arrows.contains(&symbol.span) {
            vec!["TS_LEXICAL_ARROW".to_owned()]
        } else if php_type_targets.contains(&symbol.span) {
            vec!["PHP_TYPE_DECLARATION".to_owned()]
        } else if php_targets.contains(&symbol.span) {
            vec!["PHP_GLOBAL_FUNCTION".to_owned()]
        } else {
            Vec::new()
        };
        documents.push(StoredDocument {
            go_package: go_package.clone(),
            semantic_fingerprint,
            body_start: symbol.search_span.start,
            body_end: symbol.search_span.end,
            ..plain_document(
                relative,
                DocumentSeed {
                    node_id: stable_node_id(relative, symbol.span, &symbol.name),
                    qualified_name: symbol.name.clone(),
                    text,
                    search_text,
                    span: symbol.span,
                    provenance: "SYNTAX",
                    semantic_tags,
                },
            )
        });
    }
    for edge in edges
        .iter()
        .filter(|edge| edge.relation == LanguageRelation::Imports)
    {
        // Import resolution must use the exact parser-owned statement. A
        // line-oriented context slice can contain adjacent imports and make an
        // external specifier look like a second repository-local dependency.
        let text = String::from_utf8_lossy(&source[edge.span.start..edge.span.end]).into_owned();
        let identity = format!("import:{text}");
        documents.push(plain_document(
            relative,
            DocumentSeed {
                node_id: stable_node_id(relative, edge.span, &identity),
                qualified_name: edge.target.clone(),
                text: text.clone(),
                search_text: text,
                span: edge.span,
                provenance: "IMPORTS",
                semantic_tags: vec!["IMPORTS".to_owned()],
            },
        ));
    }
    for edge in edges
        .iter()
        .filter(|edge| edge.relation == LanguageRelation::References)
    {
        let text = String::from_utf8_lossy(&source[edge.span.start..edge.span.end]).into_owned();
        let php_type_target = if let LanguageProvenance::PhpType {
            owner,
            target,
            import,
        } = edge.provenance
        {
            Some(Box::new(super::php_resolution::PhpTypeTarget::new(
                php_source_hash.expect("PHP type identity was collected"),
                owner,
                target,
                import,
                relative,
                edge,
                source,
            )))
        } else {
            None
        };
        let semantic_tags = if php_type_target.is_some() {
            vec!["REFERENCES".to_owned(), "PHP_TYPE_REFERENCE".to_owned()]
        } else {
            vec!["REFERENCES".to_owned()]
        };
        let identity = format!("reference:{text}");
        documents.push(StoredDocument {
            php_type_target,
            ..plain_document(
                relative,
                DocumentSeed {
                    node_id: stable_node_id(relative, edge.span, &identity),
                    qualified_name: edge.target.clone(),
                    text: text.clone(),
                    search_text: text,
                    span: edge.span,
                    provenance: "REFERENCES",
                    semantic_tags,
                },
            )
        });
    }
    for edge in edges {
        if edge.relation != LanguageRelation::Calls {
            continue;
        }
        let target = edge.target;
        let go_receiver_target = match edge.provenance {
            LanguageProvenance::GoSelfReceiver {
                package,
                receiver_type,
                target,
            } => {
                let source_text = |span: Span| {
                    String::from_utf8_lossy(&source[span.start..span.end]).into_owned()
                };
                Some(GoReceiverTarget {
                    package: source_text(package),
                    receiver_type: source_text(receiver_type),
                    path: relative.to_owned(),
                    symbol: source_text(target),
                    span_start: target.start,
                    span_end: target.end,
                })
            }
            LanguageProvenance::Syntax
            | LanguageProvenance::PhpFunction { .. }
            | LanguageProvenance::PhpType { .. }
            | LanguageProvenance::GoFieldReceiver { .. }
            | LanguageProvenance::GoLocalConstructor { .. }
            | LanguageProvenance::GoImport { .. }
            | LanguageProvenance::TsLexical { .. }
            | LanguageProvenance::TsConstructor { .. }
            | LanguageProvenance::JavaConstructor { .. }
            | LanguageProvenance::RustSelf { .. }
            | LanguageProvenance::RustModule { .. }
            | LanguageProvenance::RustConstructor { .. } => None,
        };
        let is_go_receiver = go_receiver_target.is_some();
        let go_import_path =
            if let LanguageProvenance::GoImport { import_path, .. } = edge.provenance {
                Some(
                    String::from_utf8_lossy(&source[import_path.start..import_path.end])
                        .trim_matches(['"', '`'])
                        .to_owned(),
                )
            } else {
                None
            };
        let slice = slice_source(
            source,
            ByteRange::new(edge.span.start, edge.span.end),
            ContextWindow::lines(0),
        );
        let call_text = if matches!(edge.provenance, LanguageProvenance::PhpFunction { .. }) {
            String::from_utf8_lossy(&source[edge.span.start..edge.span.end]).into_owned()
        } else {
            String::from_utf8_lossy(&slice.bytes).into_owned()
        };
        documents.push(StoredDocument {
            php_type_target: None,
            php_function_target: match edge.provenance {
                LanguageProvenance::PhpFunction { caller, target } => {
                    Some(Box::new(super::php_resolution::PhpFunctionTarget {
                        source_hash: php_source_hash.expect("PHP target identity was collected"),
                        caller: ByteRange::new(caller.start, caller.end),
                        target: ByteRange::new(target.start, target.end),
                    }))
                }
                _ => None,
            },
            semantic_fingerprint: None,
            go_field_target: match edge.provenance {
                LanguageProvenance::GoFieldReceiver {
                    package,
                    caller,
                    receiver_type,
                    field,
                    field_type,
                    target,
                } => {
                    let range = |span: Span| ByteRange::new(span.start, span.end);
                    Some(Box::new(GoFieldTarget {
                        package: String::from_utf8_lossy(&source[package.start..package.end])
                            .into_owned(),
                        caller: range(caller),
                        receiver_type: range(receiver_type),
                        field: range(field),
                        field_type: range(field_type),
                        target: range(target),
                    }))
                }
                _ => None,
            },
            go_local_constructor_target: match edge.provenance {
                LanguageProvenance::GoLocalConstructor {
                    package,
                    caller,
                    binding,
                    constructor,
                    target,
                } => {
                    let source_text = |span: Span| {
                        String::from_utf8_lossy(&source[span.start..span.end]).into_owned()
                    };
                    Some(GoLocalConstructorTarget {
                        package: source_text(package),
                        caller: ByteRange::new(caller.start, caller.end),
                        binding: source_text(binding),
                        constructor: source_text(constructor),
                        target: source_text(target),
                    })
                }
                _ => None,
            },
            java_constructor_target: match edge.provenance {
                LanguageProvenance::JavaConstructor { caller, target } => {
                    Some(Box::new(JavaConstructorTarget {
                        caller: ByteRange::new(caller.start, caller.end),
                        target: ByteRange::new(target.start, target.end),
                    }))
                }
                _ => None,
            },
            rust_module_target: match edge.provenance {
                LanguageProvenance::RustModule { caller, target } => Some(TsLexicalTarget {
                    caller: ByteRange::new(caller.start, caller.end),
                    target: ByteRange::new(target.start, target.end),
                }),
                _ => None,
            },
            rust_self_target: match edge.provenance {
                LanguageProvenance::RustSelf {
                    owner,
                    implementation,
                    target_implementation,
                    caller,
                    target,
                } => {
                    let range = |s: Span| ByteRange::new(s.start, s.end);
                    Some(Box::new(RustSelfTarget {
                        owner: range(owner),
                        implementation: range(implementation),
                        target_implementation: Some(range(target_implementation)),
                        caller: range(caller),
                        target: range(target),
                    }))
                }
                _ => None,
            },
            ts_lexical_target: match edge.provenance {
                LanguageProvenance::TsLexical { target, caller } => Some(TsLexicalTarget {
                    target: ByteRange::new(target.start, target.end),
                    caller: ByteRange::new(caller.start, caller.end),
                }),
                _ => None,
            },
            ts_constructor_target: match edge.provenance {
                LanguageProvenance::TsConstructor { target, caller } => Some(TsLexicalTarget {
                    target: ByteRange::new(target.start, target.end),
                    caller: ByteRange::new(caller.start, caller.end),
                }),
                _ => None,
            },
            go_import_path,
            go_import_explicit_alias: matches!(
                edge.provenance,
                LanguageProvenance::GoImport {
                    explicit_alias: true,
                    ..
                }
            ),
            go_package: None,
            go_receiver_target,
            node_id: stable_node_id(relative, edge.span, &format!("call:{target}")),
            qualified_name: target.clone(),
            path: relative.to_owned(),
            text: call_text.clone(),
            search_text: call_text,
            span_start: edge.span.start,
            span_end: edge.span.end,
            body_start: edge.span.start,
            body_end: edge.span.end,
            provenance: "CALLS".to_owned(),
            semantic_tags: if matches!(edge.provenance, LanguageProvenance::PhpFunction { .. }) {
                vec!["EXACT_CALL".to_owned(), "PHP_FUNCTION_CALL".to_owned()]
            } else if matches!(edge.provenance, LanguageProvenance::RustModule { .. }) {
                vec!["EXACT_CALL".to_owned(), "RUST_MODULE_CALL".to_owned()]
            } else if matches!(edge.provenance, LanguageProvenance::RustSelf { .. }) {
                vec!["EXACT_CALL".to_owned(), "RUST_SELF_CALL".to_owned()]
            } else if matches!(edge.provenance, LanguageProvenance::GoFieldReceiver { .. }) {
                vec!["EXACT_CALL".to_owned(), "GO_FIELD_CALL".to_owned()]
            } else if matches!(
                edge.provenance,
                LanguageProvenance::GoLocalConstructor { .. }
            ) {
                vec![
                    "EXACT_CALL".to_owned(),
                    "GO_LOCAL_CONSTRUCTOR_CALL".to_owned(),
                ]
            } else if matches!(edge.provenance, LanguageProvenance::TsLexical { .. }) {
                vec!["EXACT_CALL".to_owned(), "TS_LEXICAL_CALL".to_owned()]
            } else if matches!(edge.provenance, LanguageProvenance::TsConstructor { .. }) {
                vec!["EXACT_CALL".to_owned(), "TS_CONSTRUCTOR_CALL".to_owned()]
            } else if matches!(edge.provenance, LanguageProvenance::RustConstructor { .. }) {
                vec!["EXACT_CALL".to_owned(), "RUST_CONSTRUCTOR_CALL".to_owned()]
            } else if matches!(edge.provenance, LanguageProvenance::JavaConstructor { .. }) {
                vec!["EXACT_CALL".to_owned(), "JAVA_CONSTRUCTOR_CALL".to_owned()]
            } else if is_go_receiver {
                vec!["EXACT_CALL".to_owned(), "GO_SELF_CALL".to_owned()]
            } else if overload_names.contains(&target) {
                vec!["EXACT_CALL".to_owned(), "OVERLOAD_CALL".to_owned()]
            } else {
                vec!["EXACT_CALL".to_owned()]
            },
        });
        if edge.context_span != edge.span {
            let context = slice_source(
                source,
                ByteRange::new(edge.context_span.start, edge.context_span.end),
                ContextWindow::lines(0),
            );
            let text = String::from_utf8_lossy(&context.bytes).into_owned();
            let identity = format!("statement:{target}");
            documents.push(plain_document(
                relative,
                DocumentSeed {
                    node_id: stable_node_id(relative, edge.context_span, &identity),
                    qualified_name: target,
                    text: text.clone(),
                    search_text: text,
                    span: edge.context_span,
                    provenance: "CALLS",
                    semantic_tags: vec!["STATEMENT_CALL".to_owned()],
                },
            ));
        }
    }
    let ts_receiver_spans = apply_ts_call_facts(relative, source, ts_file.as_ref(), &mut documents);
    let mut unresolved_by_span = BTreeMap::<(usize, usize), Vec<UnresolvedKind>>::new();
    for candidate in &unresolved {
        if ts_receiver_spans.contains(&[candidate.span.start, candidate.span.end]) {
            continue;
        }
        unresolved_by_span
            .entry((candidate.span.start, candidate.span.end))
            .or_default()
            .push(candidate.kind);
    }
    for ((start, end), mut kinds) in unresolved_by_span {
        kinds.sort();
        kinds.dedup();
        if kinds.iter().any(|kind| {
            matches!(
                kind,
                UnresolvedKind::DynamicProperty | UnresolvedKind::Dispatch
            )
        }) {
            let span = Span { start, end };
            let text = source.get(start..end).map_or_else(String::new, |bytes| {
                String::from_utf8_lossy(bytes).into_owned()
            });
            let semantic_tags = kinds
                .iter()
                .filter_map(|kind| match kind {
                    UnresolvedKind::DynamicProperty => Some("DYNAMIC_PROPERTY".to_owned()),
                    UnresolvedKind::Dispatch => Some("DYNAMIC_DISPATCH".to_owned()),
                    _ => None,
                })
                .collect();
            let qualified_name = format!("unresolved:{text}");
            documents.push(plain_document(
                relative,
                DocumentSeed {
                    node_id: stable_node_id(relative, span, &qualified_name),
                    qualified_name,
                    text,
                    search_text: String::new(),
                    span,
                    provenance: "CALLS",
                    semantic_tags,
                },
            ));
        }
    }
    for candidate in unresolved
        .iter()
        .filter(|candidate| candidate.kind == UnresolvedKind::Decorator)
    {
        let Some(symbol) = symbols
            .iter()
            .filter(|symbol| symbol.span.start >= candidate.span.end)
            .min_by_key(|symbol| symbol.span.start)
        else {
            continue;
        };
        let Some(span) = declaration_span(source, symbol.span, relative_path) else {
            continue;
        };
        let text = String::from_utf8_lossy(&source[span.start..span.end]).into_owned();
        let identity = format!("route:{text}");
        documents.push(plain_document(
            relative,
            DocumentSeed {
                node_id: stable_node_id(relative, span, &identity),
                qualified_name: symbol.name.clone(),
                text,
                search_text: String::new(),
                span,
                provenance: "ROUTE_HANDLER",
                semantic_tags: vec!["DECORATOR_HANDLER".to_owned()],
            },
        ));
    }
    for span in implements_spans(source, relative_path) {
        let text = String::from_utf8_lossy(&source[span.start..span.end]).into_owned();
        let identity = format!("implements:{text}");
        documents.push(plain_document(
            relative,
            DocumentSeed {
                node_id: stable_node_id(relative, span, &identity),
                qualified_name: text.clone(),
                text,
                search_text: String::new(),
                span,
                provenance: "IMPLEMENTS",
                semantic_tags: vec!["IMPLEMENTS".to_owned()],
            },
        ));
    }
    let dynamic_dispatch = outer_dynamic_spans(&unresolved)
        .into_iter()
        .map(|span| format!("{}:{}-{}", relative, span.start, span.end))
        .collect();
    Ok(ExtractedPath {
        rust_file: extraction.rust_file,
        ts_file,
        documents,
        reference_arcs: Vec::new(),
        parser_error_ranges: extraction
            .parser_error_ranges
            .into_iter()
            .map(|span| SourceRange {
                path: relative.to_owned(),
                start: span.start,
                end: span.end,
            })
            .collect(),
        dynamic_dispatch,
    })
}

pub(super) fn outer_dynamic_spans(unresolved: &[cgrx_languages::Unresolved]) -> Vec<Span> {
    let spans: BTreeSet<_> = unresolved
        .iter()
        .filter(|candidate| {
            matches!(
                candidate.kind,
                UnresolvedKind::DynamicProperty | UnresolvedKind::Dispatch
            )
        })
        .map(|candidate| candidate.span)
        .collect();
    spans
        .iter()
        .copied()
        .filter(|span| {
            !spans
                .iter()
                .any(|outer| outer != span && outer.start <= span.start && outer.end >= span.end)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn plain_document_preserves_identity_span_and_empty_proof_targets() {
        let span = Span { start: 4, end: 12 };
        let document = plain_document(
            "src/example.ts",
            DocumentSeed {
                node_id: stable_node_id("src/example.ts", span, "call:demo"),
                qualified_name: "demo".to_owned(),
                text: "demo()".to_owned(),
                search_text: "demo()".to_owned(),
                span,
                provenance: "CALLS",
                semantic_tags: vec!["EXACT_CALL".to_owned()],
            },
        );

        assert_eq!(
            document.node_id,
            stable_node_id("src/example.ts", span, "call:demo")
        );
        assert_eq!((document.span_start, document.span_end), (4, 12));
        assert_eq!((document.body_start, document.body_end), (4, 12));
        assert_eq!(document.provenance, "CALLS");
        assert_eq!(document.semantic_tags, vec!["EXACT_CALL"]);
        assert!(document.php_function_target.is_none());
        assert!(document.php_type_target.is_none());
        assert!(document.rust_module_target.is_none());
        assert!(document.rust_self_target.is_none());
        assert!(document.ts_lexical_target.is_none());
        assert!(document.ts_constructor_target.is_none());
        assert!(document.go_field_target.is_none());
        assert!(document.go_local_constructor_target.is_none());
        assert!(document.java_constructor_target.is_none());
        assert!(document.go_receiver_target.is_none());
        assert!(document.go_import_path.is_none());
        assert!(!document.go_import_explicit_alias);
        assert!(document.go_package.is_none());
        assert!(document.semantic_fingerprint.is_none());
    }
}
