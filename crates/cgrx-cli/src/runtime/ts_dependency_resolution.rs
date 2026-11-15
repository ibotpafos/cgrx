//! Source-bound TypeScript dependency identity. These edges do not prove calls.
use std::borrow::Borrow;
use std::collections::BTreeMap;

use cgrx_core::{ByteRange, ConfidenceClass, EdgeEvidence, Hash32, RelationKind, ResolverClass};
use cgrx_languages::ts_declarations::{DeclarationResolver, DependencyUse, ResolvedDeclaration};
use cgrx_languages::ts_imports::TsFileFacts;

use super::ts_config::{self, TsResolutionConfig};
use super::{StoredArc, StoredDocument, StoredIndex, StoredTsFileFacts};

pub(super) fn normalize(stored: &mut StoredIndex) {
    if !stored.documents.iter().any(|d| {
        d.semantic_tags.iter().any(|tag| {
            matches!(
                tag.as_str(),
                "TS_IMPORT_BINDING" | "TS_DECLARATION_REFERENCE"
            )
        })
    }) && !stored.arcs.iter().any(|a| {
        matches!(a.kind, RelationKind::Imports | RelationKind::References)
            && a.evidence.as_ref().is_some_and(|e| {
                e.resolver == ResolverClass::SyntaxExact
                    && matches!(
                        std::path::Path::new(&e.path)
                            .extension()
                            .and_then(|s| s.to_str()),
                        Some("ts" | "tsx")
                    )
            })
    }) {
        return;
    }
    // Reopened indexes must recheck the ledger, not trust an old native arc.
    stored.arcs.retain(|arc| {
        !matches!(arc.kind, RelationKind::Imports | RelationKind::References)
            || arc.evidence.as_ref().is_none_or(|e| {
                e.resolver != ResolverClass::SyntaxExact
                    || !matches!(
                        std::path::Path::new(&e.path)
                            .extension()
                            .and_then(|s| s.to_str()),
                        Some("ts" | "tsx")
                    )
            })
    });
    let files = super::ts_helpers::ts_current_inventory(&stored.ts_files, &stored.path_hashes);
    let modules = super::ts_config_modules(&stored.ts_files, &stored.ts_resolution_configs);
    let mut syntax = BTreeMap::<&str, Vec<&StoredDocument>>::new();
    for document in stored.documents.iter().filter(|d| d.provenance == "SYNTAX") {
        syntax.entry(&document.path).or_default().push(document);
    }
    append_arcs(
        &stored.documents,
        &stored.path_hashes,
        &stored.ts_files,
        &files,
        &stored.ts_resolution_configs,
        &modules,
        &syntax,
        &mut stored.arcs,
    );
    stored.arcs.sort_by(|a, b| {
        (a.source, a.target, a.kind, &a.evidence).cmp(&(b.source, b.target, b.kind, &b.evidence))
    });
    stored.arcs.dedup();
}

fn dependencies_current(
    resolved: &ResolvedDeclaration,
    hashes: &BTreeMap<String, Hash32>,
    files: &BTreeMap<String, StoredTsFileFacts>,
    configs: &BTreeMap<String, TsResolutionConfig>,
    augmentations_current: bool,
    portability: &mut BTreeMap<(bool, Vec<String>), bool>,
) -> bool {
    if !augmentations_current {
        return false;
    }
    let current = if !resolved.module_dependency {
        resolved.dependencies.iter().all(|path| {
            files
                .get(path)
                .is_some_and(|file| hashes.get(path) == Some(&file.source_hash))
        })
    } else {
        resolved.dependencies.iter().all(|path| {
            files
                .get(path)
                .is_some_and(|file| hashes.get(path) == Some(&file.source_hash))
                && super::ts_config_supported_for(path, configs)
                && ts_config::nearest(path, configs).is_none_or(|config| {
                    config
                        .dependencies
                        .iter()
                        .all(|(path, hash)| hashes.get(path) == Some(hash))
                })
        })
    };
    if !current {
        return false;
    }
    // The source/candidate/config maps cannot change within append_arcs. Keep
    // the complete dependency chain and local/module policy in the key: a
    // different route may expose different candidate or case collisions.
    *portability
        .entry((resolved.module_dependency, resolved.dependencies.clone()))
        .or_insert_with(|| {
            if resolved.module_dependency {
                super::ts_paths_portable_for(&resolved.dependencies, files, configs)
            } else {
                super::ts_paths_portable_for(&resolved.dependencies, files, &BTreeMap::new())
            }
        })
}

#[allow(clippy::too_many_arguments)]
pub(super) fn append_arcs<F: Borrow<TsFileFacts>>(
    documents: &[StoredDocument],
    hashes: &BTreeMap<String, Hash32>,
    stored: &BTreeMap<String, StoredTsFileFacts>,
    files: &BTreeMap<String, F>,
    configs: &BTreeMap<String, TsResolutionConfig>,
    modules: &BTreeMap<(String, String), String>,
    syntax: &BTreeMap<&str, Vec<&StoredDocument>>,
    arcs: &mut Vec<StoredArc>,
) {
    // Hash/augmentation inventory is immutable throughout this pass. Recheck it
    // once per reconstruction, while retaining all per-target/config guards.
    let augmentations_current = !stored.iter().any(|(path, file)| {
        file.facts
            .declaration_facts
            .as_ref()
            .is_some_and(|facts| !facts.augmentations.is_empty())
            && hashes.get(path) != Some(&file.source_hash)
    });
    let resolver = DeclarationResolver::new(files, modules);
    let mut portability = BTreeMap::new();
    let exact = |path: &str, span: [usize; 2]| {
        let mut matches = syntax
            .get(path)?
            .iter()
            .copied()
            .filter(|d| d.span_start == span[0] && d.span_end == span[1]);
        let document = matches.next()?;
        matches.next().is_none().then_some(document)
    };
    for document in documents {
        let site = [document.span_start, document.span_end];
        let resolved = if document.provenance == "IMPORTS"
            && document
                .semantic_tags
                .iter()
                .any(|t| t == "TS_IMPORT_BINDING")
        {
            if !files
                .get(&document.path)
                .map(Borrow::borrow)
                .and_then(|f| f.declaration_facts.as_ref())
                .is_some_and(|facts| {
                    facts
                        .imports
                        .iter()
                        .any(|i| i.member == site && i.local == document.qualified_name)
                })
            {
                continue;
            }
            resolver
                .resolve_import(&document.path, site, DependencyUse::Import)
                .map(|target| (RelationKind::Imports, document.node_id, target))
        } else if document.provenance == "REFERENCES"
            && document
                .semantic_tags
                .iter()
                .any(|t| t == "TS_DECLARATION_REFERENCE")
        {
            resolver
                .resolve_reference(&document.path, site)
                .and_then(|(reference, target)| {
                    let caller = exact(&document.path, reference.caller?)?;
                    (reference.local == document.qualified_name
                        && caller.body_start <= site[0]
                        && site[0] < site[1]
                        && site[1] <= caller.body_end)
                        .then_some((RelationKind::References, caller.node_id, target))
                })
        } else {
            continue;
        };
        let Some((kind, source, resolved)) = resolved else {
            continue;
        };
        if !dependencies_current(
            &resolved,
            hashes,
            stored,
            configs,
            augmentations_current,
            &mut portability,
        ) {
            continue;
        }
        let Some(target) = exact(&resolved.path, resolved.target)
            .filter(|target| target.qualified_name == resolved.name)
        else {
            continue;
        };
        let Some(source_hash) = hashes.get(&document.path).copied() else {
            continue;
        };
        arcs.push(StoredArc {
            source,
            target: target.node_id,
            kind,
            evidence: Some(EdgeEvidence {
                path: document.path.clone(),
                span: ByteRange::new(site[0], site[1]),
                source_hash,
                resolver: ResolverClass::SyntaxExact,
                confidence: ConfidenceClass::Proven,
                assumptions: Vec::new(),
                counter_evidence: Vec::new(),
            }),
        });
    }
}
