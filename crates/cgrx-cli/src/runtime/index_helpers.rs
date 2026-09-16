//! Index construction: index_source function for building the index from git.
//!
//! Extracted from impl Runtime as a standalone function (no self dependency).

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

use cgrx_core::Hash32;
use cgrx_languages::{pack_for_path, Span};

use cgrx_cgcr::CoverageMetadata;

use super::{crosses_nested_git_boundary, open_current_report, normalize_stored, EXTRACTION_REVISION, NODES_SEGMENT, EDGES_SEGMENT, TERMS_SEGMENT, TERMS_MARKER, RuntimeError, GenerationWriter, IndexReport, RepoSnapshot, StoredIndex, StoredTsFileFacts, TsFileFacts, TsResolutionConfig};
use super::git_helpers::{git_text, git_bytes, store_writer_error};
use super::scan_helpers::refresh_qualified_call_gaps;
use super::arc_resolution::{rebuild_arcs_with_cargo, go_module_name};
use super::extraction::extract_sources_parallel;
use super::git_helpers::{parse_committed_tree, GitBlobBatch};
use super::helpers::{generation_id, stable_node_id};
use super::scan_helpers::{collect_untracked_sources, expand_untracked_directories, watch_scan_path};
use super::ts_helpers::{is_ts_inventory_path, is_ts_resolution_config, scan_ts_inventory, store_ts_presence_blocker, ts_path_is_plain};

pub(super) fn index_source(
    root: &Path,
    state: &Path,
    committed_head: bool,
) -> Result<IndexReport, RuntimeError> {
    let root = root
        .canonicalize()
        .map_err(|error| RuntimeError::new("root", error.to_string()))?;
    let revision = git_text(&root, &["rev-parse", "HEAD"])?;
    let status = if committed_head {
        Vec::new()
    } else {
        git_bytes(
            &root,
            &["status", "--porcelain=v1", "--untracked-files=all"],
        )?
    };
    if !committed_head && !status.is_empty() {
        return Err(RuntimeError::new(
            "dirty_worktree",
            "runtime indexing requires committed HEAD content",
        ));
    }
    let committed_objects = if committed_head {
        parse_committed_tree(&git_bytes(&root, &["ls-tree", "-r", "-z", "HEAD", "--"])?)?
    } else {
        BTreeMap::new()
    };
    let mut paths: Vec<_> = if committed_head {
        committed_objects.keys().cloned().collect()
    } else {
        git_bytes(&root, &["ls-files", "-z"])?
            .split(|byte| *byte == 0)
            .filter(|value| !value.is_empty())
            .map(|value| String::from_utf8_lossy(value).into_owned())
            .collect()
    };
    paths.sort();
    let working_tree_digest =
        Hash32(*blake3::hash(if committed_head { &[] } else { &status }).as_bytes());
    let graph_generation = generation_id(&revision);
    let snapshot = RepoSnapshot {
        repo_revision: revision,
        working_tree_digest,
        graph_generation,
    };
    if let Some(report) = open_current_report(state, &snapshot) {
        return Ok(report);
    }
    let mut documents = Vec::new();
    let mut path_hashes = BTreeMap::new();
    let mut parser_error_ranges = Vec::new();
    let mut dynamic_dispatch = Vec::new();
    let mut excluded_paths = Vec::new();
    let mut index_input_bytes = 0_u64;
    let mut blob_batch = committed_head
        .then(|| GitBlobBatch::spawn(&root))
        .transpose()?;
    let mut sources = Vec::new();
    let mut go_modules = BTreeMap::new();
    let mut cargo_manifests = BTreeMap::new();
    let mut rust_files = BTreeMap::new();
    let mut ts_files = BTreeMap::new();
    let mut ts_resolution_configs = BTreeMap::new();
    for relative in paths {
        let relative_path = Path::new(&relative);
        let is_go_module = relative_path
            .file_name()
            .is_some_and(|name| name == "go.mod");
        let is_cargo = relative_path.file_name().is_some_and(|n| n == "Cargo.toml");
        let is_ts_inventory = is_ts_inventory_path(relative_path);
        if pack_for_path(relative_path).is_none()
            && !is_go_module
            && !is_cargo
            && !is_ts_inventory
        {
            excluded_paths.push(relative);
            continue;
        }
        let source = if committed_head {
            let object = committed_objects.get(&relative).ok_or_else(|| {
                RuntimeError::new("git_tree", format!("missing object for {relative}"))
            })?;
            blob_batch
                .as_mut()
                .expect("committed indexing has a blob batch")
                .read_blob(object)?
        } else {
            fs::read(root.join(relative_path))
                .map_err(|error| RuntimeError::new("source_read", error.to_string()))?
        };
        if is_cargo {
            let directory = relative_path
                .parent()
                .unwrap_or(Path::new(""))
                .to_string_lossy()
                .into_owned();
            path_hashes.insert(relative.clone(), Hash32(*blake3::hash(&source).as_bytes()));
            cargo_manifests.insert(directory, String::from_utf8(source).unwrap_or_default());
            excluded_paths.push(relative);
            continue;
        }
        if is_go_module {
            let directory = relative_path
                .parent()
                .unwrap_or(Path::new(""))
                .to_string_lossy()
                .into_owned();
            // Empty values retain invalid/unsupported nested-module boundaries.
            go_modules.insert(directory, go_module_name(&source).unwrap_or_default());
            path_hashes.insert(relative.clone(), Hash32(*blake3::hash(&source).as_bytes()));
            excluded_paths.push(relative);
            continue;
        }
        if is_ts_inventory && pack_for_path(relative_path).is_none() {
            let hash = Hash32(*blake3::hash(&source).as_bytes());
            path_hashes.insert(relative.clone(), hash);
            ts_files.insert(
                relative.clone(),
                StoredTsFileFacts {
                    source_hash: hash,
                    facts: TsFileFacts::default(),
                    inventory_only: true,
                },
            );
            if is_ts_resolution_config(relative_path) {
                ts_resolution_configs
                    .insert(relative.clone(), TsResolutionConfig::legacy(&source));
            }
            excluded_paths.push(relative);
            continue;
        }
        index_input_bytes = index_input_bytes
            .checked_add(source.len() as u64)
            .ok_or_else(|| RuntimeError::new("overflow", "index byte counter overflow"))?;
        sources.push((relative, source));
    }
    if let Some(batch) = blob_batch {
        batch.finish()?;
    }
    let indexed_files = sources.len() as u64;
    for source in extract_sources_parallel(&sources)? {
        path_hashes.insert(source.relative.clone(), source.hash);
        let extracted = source.extracted;
        if let Some(facts) = extracted.rust_file {
            rust_files.insert(source.relative.clone(), facts);
        }
        if let Some(facts) = extracted.ts_file {
            ts_files.insert(
                source.relative.clone(),
                StoredTsFileFacts {
                    source_hash: source.hash,
                    facts,
                    inventory_only: false,
                },
            );
        }
        documents.extend(extracted.documents);
        parser_error_ranges.extend(extracted.parser_error_ranges);
        dynamic_dispatch.extend(extracted.dynamic_dispatch);
    }
    if !committed_head {
        let (_, invalid_ts_sources) = scan_ts_inventory(
            &root,
            &mut path_hashes,
            &mut ts_files,
            &mut ts_resolution_configs,
        )?;
        if !invalid_ts_sources.is_empty() {
            return Err(RuntimeError::new(
                "source_changed",
                "TypeScript source changed identity during coherent indexing",
            ));
        }
    }
    documents.sort_by(|left, right| {
        (&left.path, left.span_start, left.node_id).cmp(&(
            &right.path,
            right.span_start,
            right.node_id,
        ))
    });
    documents.dedup_by_key(|document| document.node_id);
    let mut arcs = rebuild_arcs_with_cargo(
        &documents,
        &path_hashes,
        &go_modules,
        &cargo_manifests,
        &rust_files,
        &ts_files,
        &ts_resolution_configs,
    );

    // Add CONTAINS arcs: each file's first SYNTAX symbol contains all others
    {
        use std::collections::BTreeMap;
        let mut symbols_by_file: BTreeMap<&str, Vec<&super::StoredDocument>> = BTreeMap::new();
        for document in documents.iter().filter(|d| d.provenance == "SYNTAX") {
            symbols_by_file.entry(document.path.as_str()).or_default().push(document);
        }
        for (file_path, symbols) in &symbols_by_file {
            let mut sorted: Vec<_> = symbols.clone();
            sorted.sort_by_key(|d| (d.span_start, d.node_id));
            if let Some(module) = sorted.first() {
                let source_hash = path_hashes.get(*file_path).copied().unwrap_or(cgrx_core::Hash32([0; 32]));
                for symbol in sorted.iter().skip(1) {
                    arcs.push(super::StoredArc {
                        source: module.node_id,
                        target: symbol.node_id,
                        kind: cgrx_core::RelationKind::Contains,
                        evidence: Some(cgrx_core::EdgeEvidence {
                            path: file_path.to_string(),
                            span: cgrx_core::ByteRange::new(symbol.span_start, symbol.span_end),
                            source_hash,
                            resolver: cgrx_core::ResolverClass::SyntaxExact,
                            confidence: cgrx_core::ConfidenceClass::Proven,
                            assumptions: Vec::new(),
                            counter_evidence: Vec::new(),
                        }),
                    });
                }
            }
        }
        arcs.sort_by_key(|arc| (arc.source, arc.target, arc.kind, arc.evidence.clone()));
        arcs.dedup();
    }

    parser_error_ranges.sort();
    parser_error_ranges.dedup();
    dynamic_dispatch.sort();
    dynamic_dispatch.dedup();
    let mut stored = StoredIndex {
        extraction_revision: EXTRACTION_REVISION,
        cargo_manifests,
        rust_files,
        ts_files,
        ts_resolution_configs,
        go_modules,
        snapshot: snapshot.clone(),
        index_input_bytes,
        indexed_files,
        path_hashes,
        documents,
        arcs,
        coverage: CoverageMetadata {
            excluded_paths,
            parser_error_ranges,
            dynamic_dispatch,
            ..CoverageMetadata::default()
        },
    };
    refresh_qualified_call_gaps(&mut stored);
    let nodes = serde_json::to_vec(&stored)
        .map_err(|error| RuntimeError::new("serialize", error.to_string()))?;
    let segments: [(&str, &[u8]); 3] = [
        (NODES_SEGMENT, &nodes),
        (EDGES_SEGMENT, b"[]"),
        (TERMS_SEGMENT, TERMS_MARKER),
    ];
    match GenerationWriter::begin(state, snapshot.clone()) {
        Ok(mut writer) => {
            for (name, bytes) in segments {
                writer
                    .write_segment(name, bytes)
                    .map_err(|error| RuntimeError::new("store_write", error.to_string()))?;
            }
            writer
                .validate()
                .map_err(|error| RuntimeError::new("store_validate", error.to_string()))?;
            writer
                .publish()
                .map_err(|error| RuntimeError::new("store_publish", error.to_string()))?;
        }
        Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
            GenerationWriter::reactivate(state, &snapshot, &segments)
                .map_err(|error| store_writer_error("store_reactivate", error))?;
        }
        Err(error) => return Err(store_writer_error("store_begin", error)),
    }
    Ok(IndexReport {
        snapshot,
        index_input_bytes,
        indexed_files,
    })
}
