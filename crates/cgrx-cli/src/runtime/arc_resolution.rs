//! Arc resolution: rebuilding call graph edges from stored documents.
//!
//! This module contains rebuild_arcs_with_cargo (the core arc resolution
//! function) and related helper functions for Go module resolution,
//! call target splitting, and qualifier matching.

use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;

use cgrx_core::{ByteRange, ConfidenceClass, EdgeEvidence, Hash32, RelationKind, ResolverClass};
use cgrx_languages::ts_imports::{ImportClassification, SiteBinding, TsFileFacts};
use cgrx_languages::{RelationKind as LanguageRelation, Span, pack_for_path};

use super::helpers::stable_node_id;
use super::ts_config::{self, TsResolutionConfig};
use super::{
    GoFieldTarget, GoLocalConstructorTarget, GoReceiverTarget, JavaConstructorTarget,
    RustSelfTarget, StoredArc, StoredDocument, StoredIndex, StoredTsFileFacts,
};
use super::{ts_config_modules, ts_config_supported_for, ts_paths_portable_for};

pub(super) fn rebuild_arcs_with_cargo(
    documents: &[StoredDocument],
    path_hashes: &BTreeMap<String, Hash32>,
    go_modules: &BTreeMap<String, String>,
    cargo_manifests: &BTreeMap<String, String>,
    rust_files: &BTreeMap<String, cgrx_languages::RustFileFacts>,
    ts_files: &BTreeMap<String, StoredTsFileFacts>,
    ts_resolution_configs: &BTreeMap<String, TsResolutionConfig>,
) -> Vec<StoredArc> {
    let cargo = crate::cargo_roots::CargoRoots::new(cargo_manifests, rust_files);
    let ts_inventory: BTreeMap<_, _> = ts_files
        .iter()
        .filter(|(path, stored)| path_hashes.get(*path) == Some(&stored.source_hash))
        .map(|(path, stored)| (path.clone(), stored.facts.clone()))
        .collect();
    let modules = ts_config_modules(ts_files, ts_resolution_configs);
    let mut by_name = BTreeMap::<&str, Vec<&StoredDocument>>::new();
    let mut syntax_by_path = BTreeMap::<&str, Vec<&StoredDocument>>::new();
    // Only exact-proof files need this auxiliary identity lookup. Do not
    // allocate an additional symbol index for TS-dominant repositories.
    let field_proof_paths: BTreeSet<_> = documents
        .iter()
        .filter(|document| {
            (document.path.ends_with(".go") && document.go_field_target.is_some())
                || (document.path.ends_with(".rs") && document.rust_module_target.is_some())
                || (document.path.ends_with(".java") && document.java_constructor_target.is_some())
        })
        .map(|document| document.path.as_str())
        .collect();
    let mut syntax_by_span = BTreeMap::<(&str, usize, usize), Vec<&StoredDocument>>::new();
    for document in documents
        .iter()
        .filter(|document| document.provenance == "SYNTAX")
    {
        // Newly exposed arrows require lexical proof, even for other languages'
        // callsites. Never let the legacy resolver discover them by name.
        if !document
            .semantic_tags
            .iter()
            .any(|tag| tag == "TS_LEXICAL_ARROW")
        {
            by_name
                .entry(document.qualified_name.as_str())
                .or_default()
                .push(document);
        }
        if field_proof_paths.contains(document.path.as_str()) {
            syntax_by_span
                .entry((
                    document.path.as_str(),
                    document.span_start,
                    document.span_end,
                ))
                .or_default()
                .push(document);
        }

        syntax_by_path
            .entry(document.path.as_str())
            .or_default()
            .push(document);
    }
    let has_go_local_constructor_calls = documents.iter().any(|document| {
        document
            .semantic_tags
            .iter()
            .any(|tag| tag == "GO_LOCAL_CONSTRUCTOR_CALL")
    });
    let go_callable_types: BTreeMap<_, _> = if has_go_local_constructor_calls {
        documents
            .iter()
            .filter(|document| document.provenance == "SYNTAX" && document.path.ends_with(".go"))
            .filter_map(|document| {
                cgrx_languages::go_callable_type(document.search_text.as_bytes()).map(|signature| {
                    (
                        (
                            document.path.as_str(),
                            document.span_start,
                            document.span_end,
                        ),
                        signature,
                    )
                })
            })
            .collect()
    } else {
        BTreeMap::new()
    };
    let rust_valid_calls: BTreeSet<_> = documents
        .iter()
        .filter(|document| document.provenance == "SYNTAX" && document.path.ends_with(".rs"))
        .flat_map(|source| {
            let path = Path::new(&source.path);
            pack_for_path(path)
                .and_then(|pack| pack.extract(path, source.search_text.as_bytes()).ok())
                .into_iter()
                .flat_map(|extraction| extraction.edges)
                .filter(|edge| edge.relation == LanguageRelation::Calls)
                .map(|edge| {
                    (
                        source.path.clone(),
                        edge.span.start.saturating_add(source.body_start),
                        edge.span.end.saturating_add(source.body_start),
                        edge.target,
                    )
                })
                .collect::<Vec<_>>()
        })
        .collect();
    let mut arcs = Vec::new();
    for call in documents.iter().filter(|document| {
        document.provenance == "CALLS"
            && document.semantic_tags.iter().any(|tag| tag == "EXACT_CALL")
    }) {
        let source_document = syntax_by_path
            .get(call.path.as_str())
            .into_iter()
            .flatten()
            .filter(|document| {
                document.body_start <= call.span_start && document.body_end >= call.span_end
            })
            .min_by_key(|document| {
                (
                    document.body_end.saturating_sub(document.body_start),
                    std::cmp::Reverse(document.body_start),
                )
            })
            .copied();
        if call.path.ends_with(".rs")
            && !call
                .semantic_tags
                .iter()
                .any(|tag| tag == "RUST_SELF_CALL" || tag == "RUST_MODULE_CALL")
            && !rust_valid_calls.contains(&(
                call.path.clone(),
                call.span_start,
                call.span_end,
                call.qualified_name.clone(),
            ))
        {
            continue;
        }
        let source = source_document.map(|document| document.node_id);
        let (qualifier, target_name) = split_call_target(&call.qualified_name);
        // A receiver proof is never eligible for name/package guessing, even
        // when its target has disappeared during refresh or metadata is absent.
        let target = if call
            .semantic_tags
            .iter()
            .any(|tag| tag == "TS_RECEIVER_CALL")
        {
            if !ts_config_supported_for(&call.path, ts_resolution_configs) {
                None
            } else {
                let classified = cgrx_languages::ts_imports::classify_receiver_call_with_modules(
                    &ts_inventory,
                    &call.path,
                    [call.span_start, call.span_end],
                    &modules,
                );
                match classified.classification {
                    ImportClassification::Exact(resolved) => (|| {
                        let caller = source_document?;
                        let caller_span = classified.caller?;
                        if caller.span_start != caller_span[0]
                            || caller.span_end != caller_span[1]
                            || resolved.dependencies.iter().any(|path| {
                                ts_files.get(path).is_none_or(|facts| {
                                    path_hashes.get(path) != Some(&facts.source_hash)
                                })
                            })
                            || resolved.dependencies.iter().any(|path| {
                                ts_config::nearest(path, ts_resolution_configs).is_some_and(|c| {
                                    c.dependencies
                                        .iter()
                                        .any(|(path, hash)| path_hashes.get(path) != Some(hash))
                                })
                            })
                            || !ts_paths_portable_for(
                                &resolved.dependencies,
                                ts_files,
                                ts_resolution_configs,
                            )
                            || resolved
                                .dependencies
                                .iter()
                                .any(|path| !ts_config_supported_for(path, ts_resolution_configs))
                        {
                            return None;
                        }
                        let mut matches = syntax_by_path
                            .get(resolved.path.as_str())?
                            .iter()
                            .filter(|document| {
                                document.qualified_name == target_name
                                    && document.span_start == resolved.target[0]
                                    && document.span_end == resolved.target[1]
                            });
                        let target = matches.next()?;
                        matches.next().is_none().then_some(target.node_id)
                    })(),
                    ImportClassification::Rejected | ImportClassification::NotImport => None,
                }
            }
        } else if call
            .semantic_tags
            .iter()
            .any(|tag| tag == "TS_IMPORT_CALL" || tag == "TS_IMPORT_REJECTED")
        {
            if !ts_config_supported_for(&call.path, ts_resolution_configs) {
                None
            } else {
                let classified = cgrx_languages::ts_imports::classify_call_with_modules(
                    &ts_inventory,
                    &call.path,
                    [call.span_start, call.span_end],
                    &modules,
                );
                match classified.classification {
                    ImportClassification::Exact(resolved) => (|| {
                        let caller = source_document?;
                        let caller_span = classified.caller?;
                        if caller.span_start != caller_span[0]
                            || caller.span_end != caller_span[1]
                            || resolved.dependencies.iter().any(|path| {
                                ts_files.get(path).is_none_or(|facts| {
                                    path_hashes.get(path) != Some(&facts.source_hash)
                                })
                            })
                            || resolved.dependencies.iter().any(|p| {
                                ts_config::nearest(p, ts_resolution_configs).is_some_and(|c| {
                                    c.dependencies
                                        .iter()
                                        .any(|(p, h)| path_hashes.get(p) != Some(h))
                                })
                            })
                            || !ts_paths_portable_for(
                                &resolved.dependencies,
                                ts_files,
                                ts_resolution_configs,
                            )
                            || resolved
                                .dependencies
                                .iter()
                                .any(|path| !ts_config_supported_for(path, ts_resolution_configs))
                        {
                            None
                        } else {
                            let mut matches = syntax_by_path
                                .get(resolved.path.as_str())?
                                .iter()
                                .filter(|document| {
                                    document.span_start == resolved.target[0]
                                        && document.span_end == resolved.target[1]
                                });
                            let target = matches.next()?;
                            matches.next().is_none().then_some(target.node_id)
                        }
                    })(),
                    ImportClassification::Rejected | ImportClassification::NotImport => None,
                }
            }
        } else if call
            .semantic_tags
            .iter()
            .any(|tag| tag == "RUST_MODULE_CALL")
        {
            call.rust_module_target.as_ref().and_then(|proof| {
                if !call.path.ends_with(".rs") {
                    return None;
                }
                let caller = source_document?;
                if caller.span_start != proof.caller.start || caller.span_end != proof.caller.end {
                    return None;
                }
                let candidates = syntax_by_span.get(&(
                    call.path.as_str(),
                    proof.target.start,
                    proof.target.end,
                ))?;
                let [target] = candidates.as_slice() else {
                    return None;
                };
                (target.qualified_name == target_name).then_some(target.node_id)
            })
        } else if call.semantic_tags.iter().any(|tag| tag == "RUST_SELF_CALL") {
            call.rust_self_target.as_ref().and_then(|proof| {
                if !call.path.ends_with(".rs") {
                    return None;
                }
                let exact = |span: &ByteRange| {
                    let mut found = syntax_by_path
                        .get(call.path.as_str())?
                        .iter()
                        .filter(|d| d.span_start == span.start && d.span_end == span.end);
                    let d = *found.next()?;
                    found.next().is_none().then_some(d)
                };
                let caller = exact(&proof.caller)?;
                let target = exact(&proof.target)?;
                let _owner = exact(&proof.owner)?;
                let target_impl = proof.target_implementation.as_ref()?;
                if source != Some(caller.node_id)
                    || target.qualified_name != call.qualified_name
                    || proof.implementation.start >= proof.implementation.end
                    || target_impl.start >= target_impl.end
                    || caller.body_start < proof.implementation.start
                    || caller.body_end > proof.implementation.end
                    || target.body_start < target_impl.start
                    || target.body_end > target_impl.end
                {
                    return None;
                }
                Some(target.node_id)
            })
        } else if call
            .semantic_tags
            .iter()
            .any(|tag| tag == "GO_LOCAL_CONSTRUCTOR_CALL")
        {
            call.go_local_constructor_target.as_ref().and_then(|proof| {
                if !call.path.ends_with(".go")
                    || proof.package.is_empty()
                    || proof.binding.is_empty()
                    || qualifier != Some(proof.binding.as_str())
                    || target_name != proof.target
                {
                    return None;
                }
                let caller = source_document?;
                if caller.span_start != proof.caller.start
                    || caller.span_end != proof.caller.end
                    || caller.go_package.as_deref() != Some(proof.package.as_str())
                {
                    return None;
                }
                let directory = Path::new(&call.path).parent();
                let same_package = |document: &&&StoredDocument| {
                    document.path.ends_with(".go")
                        && Path::new(&document.path).parent() == directory
                        && document.go_package.as_deref() == Some(proof.package.as_str())
                };
                let constructors: Vec<_> = by_name
                    .get(proof.constructor.as_str())?
                    .iter()
                    .filter(same_package)
                    .filter_map(|document| {
                        let signature = go_callable_types.get(&(
                            document.path.as_str(),
                            document.span_start,
                            document.span_end,
                        ))?;
                        (signature.kind == cgrx_languages::GoCallableKind::Function
                            && signature.name == proof.constructor)
                            .then_some((*document, signature))
                    })
                    .collect();
                let [(constructor, constructor_signature)] = constructors.as_slice() else {
                    return None;
                };
                if !go_function_declaration(constructor) {
                    return None;
                }
                let targets: Vec<_> = by_name
                    .get(target_name)?
                    .iter()
                    .filter(same_package)
                    .filter_map(|document| {
                        let signature = go_callable_types.get(&(
                            document.path.as_str(),
                            document.span_start,
                            document.span_end,
                        ))?;
                        (signature.kind == cgrx_languages::GoCallableKind::Method
                            && signature.name == target_name
                            && signature.named_type == constructor_signature.named_type)
                            .then_some(*document)
                    })
                    .collect();
                let [target] = targets.as_slice() else {
                    return None;
                };
                Some(target.node_id)
            })
        } else if call.semantic_tags.iter().any(|tag| tag == "GO_FIELD_CALL") {
            call.go_field_target.as_ref().and_then(|proof| {
                if !call.path.ends_with(".go") || proof.package.is_empty() {
                    return None;
                }
                let exact = |span: &ByteRange| {
                    let candidates =
                        syntax_by_span.get(&(call.path.as_str(), span.start, span.end))?;
                    let [document] = candidates.as_slice() else {
                        return None;
                    };
                    (document.go_package.as_deref() == Some(proof.package.as_str()))
                        .then_some(*document)
                };
                let caller = exact(&proof.caller)?;
                if source_document.map(|d| d.node_id) != Some(caller.node_id) {
                    return None;
                }
                let owner = exact(&proof.receiver_type)?;
                let field_type = exact(&proof.field_type)?;
                if owner.body_start > proof.field.start
                    || proof.field.end > owner.body_end
                    || proof.field.start >= proof.field.end
                    || field_type.qualified_name.is_empty()
                {
                    return None;
                }
                let target = exact(&proof.target)?;
                (target.qualified_name == target_name).then_some(target.node_id)
            })
        } else if call
            .semantic_tags
            .iter()
            .any(|tag| tag == "JAVA_CONSTRUCTOR_CALL")
        {
            call.java_constructor_target.as_ref().and_then(|proof| {
                if !call.path.ends_with(".java") {
                    return None;
                }
                let exact = |span: &ByteRange| {
                    let candidates =
                        syntax_by_span.get(&(call.path.as_str(), span.start, span.end))?;
                    let [document] = candidates.as_slice() else {
                        return None;
                    };
                    Some(*document)
                };
                let caller = exact(&proof.caller)?;
                if source_document.map(|d| d.node_id) != Some(caller.node_id) {
                    return None;
                }
                let target = exact(&proof.target)?;
                (target.qualified_name == target_name).then_some(target.node_id)
            })
        } else if call
            .semantic_tags
            .iter()
            .any(|tag| tag == "TS_LEXICAL_CALL")
        {
            call.ts_lexical_target.as_ref().and_then(|proof| {
                let caller = source_document?;
                if caller.path != call.path
                    || caller.span_start != proof.caller.start
                    || caller.span_end != proof.caller.end
                {
                    return None;
                }
                let mut matches =
                    syntax_by_path
                        .get(call.path.as_str())?
                        .iter()
                        .filter(|document| {
                            document.qualified_name == call.qualified_name
                                && document.span_start == proof.target.start
                                && document.span_end == proof.target.end
                                && document
                                    .semantic_tags
                                    .iter()
                                    .any(|tag| tag == "TS_LEXICAL_ARROW")
                        });
                let target = matches.next()?;
                matches.next().is_none().then_some(target.node_id)
            })
        } else if call
            .semantic_tags
            .iter()
            .any(|tag| tag == "TS_CONSTRUCTOR_CALL")
        {
            // Same-file class construction: the proof carries the class name
            // span and the enclosing caller name span. The target must be the
            // unique same-file SYNTAX document at that exact span; anything
            // else (renamed, moved, duplicated class) abstains.
            call.ts_constructor_target.as_ref().and_then(|proof| {
                let caller = source_document?;
                if caller.path != call.path
                    || caller.span_start != proof.caller.start
                    || caller.span_end != proof.caller.end
                {
                    return None;
                }
                let mut matches =
                    syntax_by_path
                        .get(call.path.as_str())?
                        .iter()
                        .filter(|document| {
                            document.qualified_name == call.qualified_name
                                && document.span_start == proof.target.start
                                && document.span_end == proof.target.end
                        });
                let target = matches.next()?;
                matches.next().is_none().then_some(target.node_id)
            })
        } else if call.semantic_tags.iter().any(|tag| tag == "GO_SELF_CALL") {
            call.go_receiver_target.as_ref().and_then(|proof| {
                if proof.path != call.path
                    || proof.package.is_empty()
                    || proof.receiver_type.is_empty()
                {
                    return None;
                }
                let mut matches =
                    syntax_by_path
                        .get(proof.path.as_str())?
                        .iter()
                        .filter(|document| {
                            document.qualified_name == proof.symbol
                                && document.span_start == proof.span_start
                                && document.span_end == proof.span_end
                        });
                let target = matches.next()?;
                matches.next().is_none().then_some(target.node_id)
            })
        } else if call.path.ends_with(".rs") && qualifier.is_some() {
            // Exact Cargo target/root + AST module membership, never a name guess.
            cargo
                .target(
                    &call.path,
                    call.span_start,
                    call.span_end,
                    &call.qualified_name,
                )
                .and_then(|(path, start, end)| {
                    let mut matches = syntax_by_path
                        .get(path)?
                        .iter()
                        .filter(|d| d.span_start == start && d.span_end == end);
                    let target = matches.next()?;
                    (matches.next().is_none() && path_hashes.contains_key(path))
                        .then_some(target.node_id)
                })
        } else if call.path.ends_with(".go") && qualifier.is_some() {
            // Import-qualified Go selectors cannot fall through to same-file,
            // basename, or global matching. Only the caller's own module is
            // supported; stdlib/external/workspace/replaced modules stay out.
            call.go_import_path.as_deref().and_then(|import| {
                let (module_dir, module_name) = go_module_for(&call.path, go_modules)?;
                if module_name.is_empty() {
                    return None;
                }
                let suffix = import.strip_prefix(module_name)?.strip_prefix('/')?;
                if suffix
                    .split('/')
                    .any(|p| p.is_empty() || matches!(p, "." | ".."))
                {
                    return None;
                }
                let directory = Path::new(module_dir).join(suffix);
                let mut targets = by_name.get(target_name)?.iter().filter(|document| {
                    document.path.ends_with(".go")
                        && Path::new(&document.path).parent() == Some(directory.as_path())
                        && go_module_for(&document.path, go_modules)
                            == Some((module_dir, module_name))
                        && go_function_declaration(document)
                        && document.go_package.as_deref().is_some_and(|package| {
                            package != "_"
                                && !package.is_empty()
                                && (call.go_import_explicit_alias || Some(package) == qualifier)
                        })
                });
                let target = targets.next()?;
                targets.next().is_none().then_some(target.node_id)
            })
        } else {
            by_name.get(target_name).and_then(|matches| {
                let same_path: Vec<_> = matches
                    .iter()
                    .filter(|document| document.path == call.path)
                    .collect();
                if same_path.len() == 1 {
                    Some(same_path[0].node_id)
                } else if let Some(qualifier) = qualifier {
                    let qualified: Vec<_> = matches
                        .iter()
                        .filter(|document| path_matches_qualifier(&document.path, qualifier))
                        .collect();
                    (qualified.len() == 1).then(|| qualified[0].node_id)
                } else if call.path.ends_with(".go") {
                    let package = Path::new(&call.path).parent();
                    let same_package: Vec<_> = matches
                        .iter()
                        .filter(|document| Path::new(&document.path).parent() == package)
                        .collect();
                    (same_package.len() == 1).then(|| same_package[0].node_id)
                } else if same_path.is_empty() && matches.len() == 1 {
                    Some(matches[0].node_id)
                } else {
                    None
                }
            })
        };
        if let (Some(source), Some(target)) = (source, target) {
            let Some(source_hash) = path_hashes.get(&call.path).copied() else {
                continue;
            };
            arcs.push(StoredArc {
                source,
                target,
                kind: cgrx_core::RelationKind::Calls,
                evidence: Some(EdgeEvidence {
                    path: call.path.clone(),
                    span: ByteRange::new(call.span_start, call.span_end),
                    source_hash,
                    resolver: ResolverClass::SyntaxExact,
                    confidence: ConfidenceClass::Proven,
                    assumptions: Vec::new(),
                    counter_evidence: Vec::new(),
                }),
            });
        }
    }
    // Create References arcs from reference documents to their targets
    for document in documents.iter().filter(|d| d.provenance == "REFERENCES") {
        // Try exact match first, then extract last segment for qualified names
        let targets = by_name.get(document.qualified_name.as_str()).or_else(|| {
            // For qualified names like "cgrx_core::IoAccounting", try "IoAccounting"
            document
                .qualified_name
                .rsplit("::")
                .next()
                .and_then(|name| by_name.get(name))
        });
        let Some(targets) = targets else {
            continue;
        };
        for target in targets {
            if target.provenance == "SYNTAX" {
                let source_hash = path_hashes
                    .get(&document.path)
                    .copied()
                    .unwrap_or(Hash32([0; 32]));
                arcs.push(StoredArc {
                    source: document.node_id,
                    target: target.node_id,
                    kind: RelationKind::References,
                    evidence: Some(EdgeEvidence {
                        path: document.path.clone(),
                        span: ByteRange::new(document.span_start, document.span_end),
                        source_hash,
                        resolver: ResolverClass::SyntaxExact,
                        confidence: ConfidenceClass::Proven,
                        assumptions: Vec::new(),
                        counter_evidence: Vec::new(),
                    }),
                });
            }
        }
    }

    // Create IMPORTS arcs from import documents to their targets
    // Match import targets to SYNTAX documents by path
    for document in documents.iter().filter(|d| d.provenance == "IMPORTS") {
        // Try to find the imported module by matching the qualified_name to a file path
        let import_target = &document.qualified_name;

        // For relative imports (./foo, ../foo), try to resolve to a file path
        // For absolute imports (fmt, std::io), skip as they're external
        if import_target.starts_with("./") || import_target.starts_with("../") {
            // Try to find a matching file in syntax_by_path
            let importing_dir = Path::new(&document.path).parent().unwrap_or(Path::new("."));
            let resolved = importing_dir.join(import_target);
            let resolved_str = resolved.to_string_lossy().to_string();

            // Try exact match and with common extensions
            for candidate in [
                resolved_str.clone(),
                format!("{}.rs", resolved_str),
                format!("{}.go", resolved_str),
                format!("{}.ts", resolved_str),
                format!("{}.js", resolved_str),
                format!("{}.py", resolved_str),
                format!("{}/mod.rs", resolved_str),
                format!("{}/index.ts", resolved_str),
                format!("{}/index.js", resolved_str),
            ] {
                if let Some(targets) = syntax_by_path.get(candidate.as_str()) {
                    if let Some(target) = targets.first() {
                        let source_hash = path_hashes
                            .get(&document.path)
                            .copied()
                            .unwrap_or(Hash32([0; 32]));
                        arcs.push(StoredArc {
                            source: document.node_id,
                            target: target.node_id,
                            kind: RelationKind::Imports,
                            evidence: Some(EdgeEvidence {
                                path: document.path.clone(),
                                span: ByteRange::new(document.span_start, document.span_end),
                                source_hash,
                                resolver: ResolverClass::SyntaxExact,
                                confidence: ConfidenceClass::Proven,
                                assumptions: Vec::new(),
                                counter_evidence: Vec::new(),
                            }),
                        });
                        break;
                    }
                }
            }
        }

        // For crate:: and internal crate imports, extract symbol names and match to SYNTAX documents
        let is_internal = import_target.starts_with("crate::")
            || import_target.starts_with("use crate::")
            || import_target.starts_with("use cgrx_")
            || import_target.starts_with("use super::")
            || import_target.starts_with("use self::");
        if is_internal {
            // Extract symbol names from various patterns:
            // - use crate::Symbol -> ["Symbol"]
            // - use crate::module::Symbol -> ["Symbol"]
            // - use crate::{A, B, C} -> ["A", "B", "C"]
            // - use crate::module::{A, B} -> ["A", "B"]
            // Remove "use " prefix if present
            let clean_target = import_target.strip_prefix("use ").unwrap_or(import_target);
            // Remove trailing semicolon
            let clean_target = clean_target.trim_end_matches(';');
            let symbols: Vec<&str> = if clean_target.contains('{') {
                // Handle brace-enclosed imports: crate::{A, B, C} or crate::module::{A, B}
                if let Some(brace_start) = clean_target.find('{') {
                    let inner = &clean_target[brace_start + 1..];
                    if let Some(brace_end) = inner.find('}') {
                        inner[..brace_end]
                            .split(',')
                            .map(|s| s.trim())
                            .filter(|s| !s.is_empty())
                            .collect()
                    } else {
                        Vec::new()
                    }
                } else {
                    Vec::new()
                }
            } else {
                // Handle simple imports: crate::Symbol or crate::module::Symbol
                clean_target.rsplit("::").next().into_iter().collect()
            };

            for symbol_name in symbols {
                if let Some(targets) = by_name.get(symbol_name) {
                    for target in targets {
                        if target.provenance == "SYNTAX" {
                            let source_hash = path_hashes
                                .get(&document.path)
                                .copied()
                                .unwrap_or(Hash32([0; 32]));
                            arcs.push(StoredArc {
                                source: document.node_id,
                                target: target.node_id,
                                kind: RelationKind::Imports,
                                evidence: Some(EdgeEvidence {
                                    path: document.path.clone(),
                                    span: ByteRange::new(document.span_start, document.span_end),
                                    source_hash,
                                    resolver: ResolverClass::SyntaxExact,
                                    confidence: ConfidenceClass::Proven,
                                    assumptions: Vec::new(),
                                    counter_evidence: Vec::new(),
                                }),
                            });
                        }
                    }
                }
            }
        }
    }

    arcs.sort_by_key(|arc| (arc.source, arc.target, arc.kind, arc.evidence.clone()));
    arcs.dedup();
    arcs
}

pub(super) fn go_module_name(source: &[u8]) -> Option<String> {
    let source = std::str::from_utf8(source).ok()?;
    if source.contains("/*") {
        return None;
    }
    let names: Vec<_> = source
        .lines()
        .filter_map(|line| {
            let line = line.split("//").next()?.trim();
            let rest = line.strip_prefix("module")?;
            if !rest.starts_with(char::is_whitespace) {
                return None;
            }
            let name = rest.trim().trim_matches('"');
            (!name.is_empty() && !name.contains(char::is_whitespace)).then(|| name.to_owned())
        })
        .collect();
    if names.len() != 1 {
        return None;
    }
    let module = &names[0];
    let mut in_replace = false;
    for line in source.lines() {
        let tokens: Vec<_> = line.split("//").next()?.split_whitespace().collect();
        if tokens.is_empty() {
            continue;
        }
        if in_replace {
            if tokens == [")"] {
                in_replace = false;
            } else if !go_replacement_is_unrelated(&tokens, module) {
                return None;
            }
        } else if tokens[0] == "replace" {
            if tokens == ["replace", "("] {
                in_replace = true;
            } else if !go_replacement_is_unrelated(&tokens[1..], module) {
                return None;
            }
        } else if tokens.contains(&"=>") {
            // Unrecognized or split replacement syntax must not be ignored.
            return None;
        }
    }
    (!in_replace).then(|| module.clone())
}

fn go_replacement_is_unrelated(tokens: &[&str], module: &str) -> bool {
    let Some(arrow) = tokens.iter().position(|token| *token == "=>") else {
        return false;
    };
    let (left, right) = (&tokens[..arrow], &tokens[arrow + 1..]);
    // Bounded unquoted grammar: old [version] => new [version]. Inline blocks,
    // escaped/quoted paths, extra tokens/arrows and malformed versions fail closed.
    let valid_side = |side: &[&str]| {
        (1..=2).contains(&side.len())
            && side[0]
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"./_-+~".contains(&b))
            && (side.len() == 1
                || (side[1].starts_with('v')
                    && side[1].as_bytes().get(1).is_some_and(u8::is_ascii_digit)
                    && side[1]
                        .bytes()
                        .all(|b| b.is_ascii_alphanumeric() || b".-+".contains(&b))))
    };
    if !valid_side(left) || !valid_side(right) {
        return false;
    }
    let old = left[0];
    if old
        .split('/')
        .any(|part| part.is_empty() || matches!(part, "." | ".."))
    {
        return false;
    }
    // Module path boundaries, not text prefixes: vpnextra is unrelated to vpn.
    // Both directions are conservative: replacing vpn or vpn/auth can affect
    // vpn's own imports; replacing an ancestor of example/vpn is also ambiguous.
    old != module
        && !old
            .strip_prefix(module)
            .is_some_and(|rest| rest.starts_with('/'))
        && !module
            .strip_prefix(old)
            .is_some_and(|rest| rest.starts_with('/'))
}

pub(super) fn go_module_for<'a>(
    path: &str,
    modules: &'a BTreeMap<String, String>,
) -> Option<(&'a str, &'a str)> {
    modules
        .iter()
        .filter(|(directory, _)| directory.is_empty() || Path::new(path).starts_with(directory))
        .max_by_key(|(directory, _)| directory.len())
        .map(|(directory, module)| (directory.as_str(), module.as_str()))
}

fn go_function_declaration(document: &StoredDocument) -> bool {
    document
        .search_text
        .strip_prefix("func")
        .and_then(|s| s.trim_start().strip_prefix(&document.qualified_name))
        .is_some_and(|s| s.trim_start().starts_with('('))
}

pub(super) fn split_call_target(target: &str) -> (Option<&str>, &str) {
    target
        .rsplit_once("::")
        .or_else(|| target.rsplit_once('.'))
        .map_or((None, target), |(qualifier, name)| {
            (qualifier.rsplit([':', '.']).next(), name)
        })
}

pub(super) fn path_matches_qualifier(path: &str, qualifier: &str) -> bool {
    Path::new(path)
        .components()
        .any(|component| component.as_os_str().to_str() == Some(qualifier))
}
