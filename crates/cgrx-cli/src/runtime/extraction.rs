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
        documents.push(StoredDocument {
            rust_module_target: None,
            rust_self_target: None,
            ts_lexical_target: None,
            ts_constructor_target: None,
            go_field_target: None,
            go_local_constructor_target: None,
            java_constructor_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: go_package.clone(),
            go_receiver_target: None,
            semantic_fingerprint,
            node_id: stable_node_id(relative, symbol.span, &symbol.name),
            qualified_name: symbol.name.clone(),
            path: relative.to_owned(),
            text,
            search_text,
            span_start: symbol.span.start,
            span_end: symbol.span.end,
            body_start: symbol.search_span.start,
            body_end: symbol.search_span.end,
            provenance: "SYNTAX".to_owned(),
            semantic_tags: if lexical_arrows.contains(&symbol.span) {
                vec!["TS_LEXICAL_ARROW".to_owned()]
            } else {
                Vec::new()
            },
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
        documents.push(StoredDocument {
            rust_module_target: None,
            rust_self_target: None,
            ts_lexical_target: None,
            ts_constructor_target: None,
            go_field_target: None,
            go_local_constructor_target: None,
            java_constructor_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: None,
            go_receiver_target: None,
            semantic_fingerprint: None,
            node_id: stable_node_id(relative, edge.span, &format!("import:{text}")),
            qualified_name: edge.target.clone(),
            path: relative.to_owned(),
            text: text.clone(),
            search_text: text,
            span_start: edge.span.start,
            span_end: edge.span.end,
            body_start: edge.span.start,
            body_end: edge.span.end,
            provenance: "IMPORTS".to_owned(),
            semantic_tags: vec!["IMPORTS".to_owned()],
        });
    }
    for edge in edges
        .iter()
        .filter(|edge| edge.relation == LanguageRelation::References)
    {
        let text = String::from_utf8_lossy(&source[edge.span.start..edge.span.end]).into_owned();
        documents.push(StoredDocument {
            rust_module_target: None,
            rust_self_target: None,
            ts_lexical_target: None,
            ts_constructor_target: None,
            go_field_target: None,
            go_local_constructor_target: None,
            java_constructor_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: None,
            go_receiver_target: None,
            semantic_fingerprint: None,
            node_id: stable_node_id(relative, edge.span, &format!("reference:{text}")),
            qualified_name: edge.target.clone(),
            path: relative.to_owned(),
            text: text.clone(),
            search_text: text,
            span_start: edge.span.start,
            span_end: edge.span.end,
            body_start: edge.span.start,
            body_end: edge.span.end,
            provenance: "REFERENCES".to_owned(),
            semantic_tags: vec!["REFERENCES".to_owned()],
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
        documents.push(StoredDocument {
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
            text: String::from_utf8_lossy(&slice.bytes).into_owned(),
            search_text: String::from_utf8_lossy(&slice.bytes).into_owned(),
            span_start: edge.span.start,
            span_end: edge.span.end,
            body_start: edge.span.start,
            body_end: edge.span.end,
            provenance: "CALLS".to_owned(),
            semantic_tags: if matches!(edge.provenance, LanguageProvenance::RustModule { .. }) {
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
            documents.push(StoredDocument {
                rust_module_target: None,
                rust_self_target: None,
                ts_lexical_target: None,
                ts_constructor_target: None,
                go_field_target: None,
                go_local_constructor_target: None,
                java_constructor_target: None,
                go_import_path: None,
                go_import_explicit_alias: false,
                go_package: None,
                go_receiver_target: None,
                semantic_fingerprint: None,
                node_id: stable_node_id(
                    relative,
                    edge.context_span,
                    &format!("statement:{target}"),
                ),
                qualified_name: target,
                path: relative.to_owned(),
                text: String::from_utf8_lossy(&context.bytes).into_owned(),
                search_text: String::from_utf8_lossy(&context.bytes).into_owned(),
                span_start: edge.context_span.start,
                span_end: edge.context_span.end,
                body_start: edge.context_span.start,
                body_end: edge.context_span.end,
                provenance: "CALLS".to_owned(),
                semantic_tags: vec!["STATEMENT_CALL".to_owned()],
            });
        }
    }
    let ts_receiver_spans: BTreeSet<_> = ts_file
        .as_ref()
        .into_iter()
        .flat_map(|facts| facts.receiver_calls.iter().map(|receiver| receiver.call))
        .collect();
    if let Some(facts) = ts_file.as_ref() {
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
            documents.push(StoredDocument {
                rust_module_target: None,
                rust_self_target: None,
                ts_lexical_target: None,
                ts_constructor_target: None,
                go_field_target: None,
                go_local_constructor_target: None,
                java_constructor_target: None,
                go_import_path: None,
                go_import_explicit_alias: false,
                go_package: None,
                go_receiver_target: None,
                semantic_fingerprint: None,
                node_id: stable_node_id(relative, span, &format!("call:{}", import.local)),
                qualified_name: import.local.clone(),
                path: relative.to_owned(),
                text: String::from_utf8_lossy(&slice.bytes).into_owned(),
                search_text: String::from_utf8_lossy(&slice.bytes).into_owned(),
                span_start: span.start,
                span_end: span.end,
                body_start: span.start,
                body_end: span.end,
                provenance: "CALLS".to_owned(),
                semantic_tags: vec!["EXACT_CALL".to_owned(), tag.to_owned()],
            });
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
            documents.push(StoredDocument {
                rust_module_target: None,
                rust_self_target: None,
                ts_lexical_target: None,
                ts_constructor_target: None,
                go_field_target: None,
                go_local_constructor_target: None,
                java_constructor_target: None,
                go_import_path: None,
                go_import_explicit_alias: false,
                go_package: None,
                go_receiver_target: None,
                semantic_fingerprint: None,
                node_id: stable_node_id(relative, span, &format!("call:{}", receiver.method)),
                qualified_name: receiver.method.clone(),
                path: relative.to_owned(),
                text: String::from_utf8_lossy(&slice.bytes).into_owned(),
                search_text: String::from_utf8_lossy(&slice.bytes).into_owned(),
                span_start: span.start,
                span_end: span.end,
                body_start: span.start,
                body_end: span.end,
                provenance: "CALLS".to_owned(),
                semantic_tags: vec!["EXACT_CALL".to_owned(), "TS_RECEIVER_CALL".to_owned()],
            });
        }
    }
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
            documents.push(StoredDocument {
                rust_module_target: None,
                rust_self_target: None,
                ts_lexical_target: None,
                ts_constructor_target: None,
                go_field_target: None,
                go_local_constructor_target: None,
                java_constructor_target: None,
                go_import_path: None,
                go_import_explicit_alias: false,
                go_package: None,
                go_receiver_target: None,
                semantic_fingerprint: None,
                node_id: stable_node_id(relative, span, &format!("unresolved:{text}")),
                qualified_name: format!("unresolved:{text}"),
                path: relative.to_owned(),
                text,
                search_text: String::new(),
                span_start: start,
                span_end: end,
                body_start: start,
                body_end: end,
                provenance: "CALLS".to_owned(),
                semantic_tags,
            });
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
        documents.push(StoredDocument {
            rust_module_target: None,
            rust_self_target: None,
            ts_lexical_target: None,
            ts_constructor_target: None,
            go_field_target: None,
            go_local_constructor_target: None,
            java_constructor_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: None,
            go_receiver_target: None,
            semantic_fingerprint: None,
            node_id: stable_node_id(relative, span, &format!("route:{text}")),
            qualified_name: symbol.name.clone(),
            path: relative.to_owned(),
            text,
            search_text: String::new(),
            span_start: span.start,
            span_end: span.end,
            body_start: span.start,
            body_end: span.end,
            provenance: "ROUTE_HANDLER".to_owned(),
            semantic_tags: vec!["DECORATOR_HANDLER".to_owned()],
        });
    }
    for span in implements_spans(source, relative_path) {
        let text = String::from_utf8_lossy(&source[span.start..span.end]).into_owned();
        documents.push(StoredDocument {
            rust_module_target: None,
            rust_self_target: None,
            ts_lexical_target: None,
            ts_constructor_target: None,
            go_field_target: None,
            go_local_constructor_target: None,
            java_constructor_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: None,
            go_receiver_target: None,
            semantic_fingerprint: None,
            node_id: stable_node_id(relative, span, &format!("implements:{text}")),
            qualified_name: text.clone(),
            path: relative.to_owned(),
            text,
            search_text: String::new(),
            span_start: span.start,
            span_end: span.end,
            body_start: span.start,
            body_end: span.end,
            provenance: "IMPLEMENTS".to_owned(),
            semantic_tags: vec!["IMPLEMENTS".to_owned()],
        });
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
