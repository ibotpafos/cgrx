//! Git boundary detection, untracked source collection, and index normalization.
//!
//! These functions handle git boundary detection, untracked directory expansion,
//! source collection, watch scan paths, index normalization, and qualified call
//! gap refreshing.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};

use cgrx_cgcr::CoverageMetadata;
use cgrx_core::{Hash32, Scope};
use cgrx_languages::pack_for_path;

use super::{path_in_scope, RuntimeError, StoredArc, StoredIndex, StoredDocument, UntrackedScanCache};
use super::arc_resolution::rebuild_arcs_with_cargo;
use super::ts_helpers::{remove_path, source_fingerprint};
use super::SourceFingerprint;
use super::coverage_for_scope_with_matcher;

const UNTRACKED_SCAN_ENTRY_LIMIT: usize = 64;

pub(super) fn crosses_nested_git_boundary(
    root: &Path,
    relative: &Path,
    cache: &mut BTreeMap<PathBuf, bool>,
) -> bool {
    let Some(parent) = relative.parent() else {
        return false;
    };
    let mut prefix = PathBuf::new();
    for component in parent.components() {
        let std::path::Component::Normal(component) = component else {
            return true;
        };
        prefix.push(component);
        let boundary = *cache
            .entry(prefix.clone())
            .or_insert_with(|| root.join(&prefix).join(".git").exists());
        if boundary {
            return true;
        }
    }
    false
}

pub(super) fn expand_untracked_directories(
    root: &Path,
    discovered: BTreeSet<String>,
) -> Result<UntrackedScanCache, RuntimeError> {
    let mut expanded = BTreeSet::new();
    let mut watched_metadata = BTreeMap::new();
    watch_scan_path(root, Path::new(".gitignore"), &mut watched_metadata)?;
    let mut ignored = GitIgnoreMatcher::spawn(root)?;
    let mut remaining = UNTRACKED_SCAN_ENTRY_LIMIT;
    let mut truncated = false;
    for relative in &discovered {
        let absolute = root.join(relative);
        if fs::symlink_metadata(&absolute).is_ok_and(|metadata| metadata.file_type().is_symlink()) {
            expanded.insert(relative.clone());
            continue;
        }
        if absolute.is_dir() {
            if remaining == 0 {
                truncated = true;
                continue;
            }
            truncated |= collect_untracked_sources(
                root,
                &absolute,
                &mut ignored,
                &mut remaining,
                &mut watched_metadata,
                &mut expanded,
            )?;
        } else {
            expanded.insert(relative.clone());
        }
    }
    ignored.finish()?;
    Ok(UntrackedScanCache {
        discovered,
        expanded,
        watched_metadata,
        truncated,
    })
}

pub(super) fn collect_untracked_sources(
    root: &Path,
    directory: &Path,
    ignored: &mut GitIgnoreMatcher,
    remaining: &mut usize,
    watched_metadata: &mut BTreeMap<String, SourceFingerprint>,
    paths: &mut BTreeSet<String>,
) -> Result<bool, RuntimeError> {
    let relative_directory = directory
        .strip_prefix(root)
        .map_err(|error| RuntimeError::new("path", error.to_string()))?;
    watch_scan_path(root, relative_directory, watched_metadata)?;
    if directory.join(".git").exists() {
        return Ok(false);
    }
    let mut entries = fs::read_dir(directory)
        .map_err(|error| RuntimeError::new("source_read", error.to_string()))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| RuntimeError::new("source_read", error.to_string()))?;
    entries.sort_by_key(|entry| entry.file_name());
    for entry in entries {
        let Some(next_remaining) = remaining.checked_sub(1) else {
            return Ok(true);
        };
        *remaining = next_remaining;
        let file_type = entry
            .file_type()
            .map_err(|error| RuntimeError::new("source_read", error.to_string()))?;
        if file_type.is_symlink() {
            continue;
        }
        let path = entry.path();
        let relative = path
            .strip_prefix(root)
            .map_err(|error| RuntimeError::new("path", error.to_string()))?;
        let portable = relative
            .to_str()
            .ok_or_else(|| RuntimeError::new("path", "source path is not UTF-8"))?
            .replace('\\', "/");
        if entry.file_name() == ".gitignore" {
            watch_scan_path(root, relative, watched_metadata)?;
        }
        if ignored.is_ignored(&portable)? {
            continue;
        }
        if file_type.is_dir() {
            if collect_untracked_sources(root, &path, ignored, remaining, watched_metadata, paths)?
            {
                return Ok(true);
            }
            continue;
        }
        if !file_type.is_file() {
            continue;
        }
        if pack_for_path(relative).is_none()
            && relative
                .file_name()
                .is_none_or(|name| name != "go.mod" && name != "Cargo.toml")
        {
            continue;
        }
        paths.insert(portable);
    }
    Ok(false)
}

pub(super) fn watch_scan_path(
    root: &Path,
    relative: &Path,
    watched: &mut BTreeMap<String, SourceFingerprint>,
) -> Result<(), RuntimeError> {
    let absolute = root.join(relative);
    let Ok(metadata) = fs::metadata(&absolute) else {
        return Ok(());
    };
    let portable = relative
        .to_str()
        .ok_or_else(|| RuntimeError::new("path", "source path is not UTF-8"))?
        .replace('\\', "/");
    watched.insert(portable, source_fingerprint(&metadata));
    Ok(())
}

struct GitIgnoreMatcher {
    child: Child,
    stdin: Option<ChildStdin>,
    stdout: BufReader<ChildStdout>,
}

impl GitIgnoreMatcher {
    fn spawn(root: &Path) -> Result<Self, RuntimeError> {
        let mut child = Command::new(crate::git_executable())
            .args(["check-ignore", "-z", "-v", "-n", "--stdin"])
            .current_dir(root)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|error| RuntimeError::new("git", error.to_string()))?;
        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| RuntimeError::new("git", "git check-ignore stdin unavailable"))?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| RuntimeError::new("git", "git check-ignore stdout unavailable"))?;
        Ok(Self {
            child,
            stdin: Some(stdin),
            stdout: BufReader::new(stdout),
        })
    }

    fn is_ignored(&mut self, path: &str) -> Result<bool, RuntimeError> {
        let stdin = self
            .stdin
            .as_mut()
            .ok_or_else(|| RuntimeError::new("git", "git check-ignore stdin unavailable"))?;
        stdin
            .write_all(path.as_bytes())
            .and_then(|()| stdin.write_all(&[0]))
            .and_then(|()| stdin.flush())
            .map_err(|error| RuntimeError::new("git", error.to_string()))?;
        let mut fields = Vec::with_capacity(4);
        for _ in 0..4 {
            let mut field = Vec::new();
            self.stdout
                .read_until(0, &mut field)
                .map_err(|error| RuntimeError::new("git", error.to_string()))?;
            if field.pop() != Some(0) {
                return Err(RuntimeError::new(
                    "git",
                    "git check-ignore returned an incomplete response",
                ));
            }
            fields.push(field);
        }
        Ok(!fields[0].is_empty() && !fields[2].starts_with(b"!"))
    }

    fn finish(mut self) -> Result<(), RuntimeError> {
        self.stdin.take();
        let status = self
            .child
            .wait()
            .map_err(|error| RuntimeError::new("git", error.to_string()))?;
        if !status.success() && status.code() != Some(1) {
            return Err(RuntimeError::new(
                "git",
                "git check-ignore failed while filtering untracked sources",
            ));
        }
        Ok(())
    }
}

pub(super) fn normalize_stored(stored: &mut StoredIndex) {
    for document in &mut stored.documents {
        if document.provenance == "SYNTAX" && document.body_start == 0 && document.body_end == 0 {
            document.body_start = document.span_start;
            document.body_end = usize::MAX;
        }
    }
    stored.documents.sort_by(|left, right| {
        (&left.path, left.span_start, left.node_id).cmp(&(
            &right.path,
            right.span_start,
            right.node_id,
        ))
    });
    stored.documents.dedup_by_key(|document| document.node_id);
    stored.coverage.excluded_paths.sort();
    stored.coverage.excluded_paths.dedup();
    stored.coverage.parser_error_ranges.sort();
    stored.coverage.parser_error_ranges.dedup();
    stored.coverage.dynamic_dispatch.sort();
    stored.coverage.dynamic_dispatch.dedup();
    stored.coverage.stale_paths.sort();
    stored.coverage.stale_paths.dedup();
    if stored.arcs.iter().any(|arc| arc.evidence.is_none()) {
        let mut migrated = rebuild_arcs_with_cargo(
            &stored.documents,
            &stored.path_hashes,
            &stored.go_modules,
            &stored.cargo_manifests,
            &stored.rust_files,
            &stored.ts_files,
            &stored.ts_resolution_configs,
        );
        migrated.extend(
            stored
                .arcs
                .iter()
                .filter(|arc| arc.evidence.is_some())
                .cloned(),
        );
        migrated.sort_by_key(|arc| (arc.source, arc.target, arc.kind, arc.evidence.clone()));
        migrated.dedup();
        stored.arcs = migrated;
    }
    refresh_qualified_call_gaps(stored);
}

// Qualified Go/Rust syntax alone is not a proof. Keep a recorded gap until
// cross-file package identity resolves; refresh recalculates even when only
// the target's package clause changed and every symbol span stayed identical.
pub(super) fn refresh_qualified_call_gaps(stored: &mut StoredIndex) {
    let sites: BTreeSet<_> = stored
        .documents
        .iter()
        .filter(|doc| {
            doc.go_import_path.is_some()
                || doc
                    .semantic_tags
                    .iter()
                    .any(|tag| tag == "GO_LOCAL_CONSTRUCTOR_CALL")
                || doc
                    .semantic_tags
                    .iter()
                    .any(|tag| tag == "JAVA_CONSTRUCTOR_CALL")
                || doc
                    .semantic_tags
                    .iter()
                    .any(|tag| tag == "TS_IMPORT_CALL" || tag == "TS_IMPORT_REJECTED")
                || doc.path.ends_with(".rs")
                    && doc.provenance == "CALLS"
                    && doc.qualified_name.contains("::")
        })
        .map(|doc| format!("{}:{}-{}", doc.path, doc.span_start, doc.span_end))
        .collect();
    if sites.is_empty() {
        return;
    }
    let proven: BTreeSet<_> = stored
        .arcs
        .iter()
        .filter_map(|arc| arc.evidence.as_ref())
        .filter(|evidence| evidence.is_definitive())
        .map(|evidence| {
            format!(
                "{}:{}-{}",
                evidence.path, evidence.span.start, evidence.span.end
            )
        })
        .collect();
    stored
        .coverage
        .dynamic_dispatch
        .retain(|location| !sites.contains(location));
    stored
        .coverage
        .dynamic_dispatch
        .extend(sites.difference(&proven).cloned());
    stored.coverage.dynamic_dispatch.sort();
    stored.coverage.dynamic_dispatch.dedup();
}

// Bounded by distinct consulted document/evidence/coverage paths, and dropped
// at query end. Never attach this cache to Runtime or a persisted generation.
pub(super) struct ScopedQuery<'a, F> {
    scope: &'a Scope,
    paths: BTreeMap<&'a str, bool>,
    // Endpoint eligibility only; document filtering must retain path identity
    // even when distinct records share a node ID.
    pub(super) live: BTreeSet<u64>,
    matches_scope: F,
}

impl<'a, F: FnMut(&str, &Scope) -> bool> ScopedQuery<'a, F> {
    pub(super) fn new(stored: &'a StoredIndex, scope: &'a Scope, matches_scope: F) -> Self {
        let mut query = Self {
            scope,
            paths: BTreeMap::new(),
            live: BTreeSet::new(),
            matches_scope,
        };
        query.live = stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX" && query.contains_path(&document.path)
            })
            .map(|document| document.node_id)
            .collect();
        query
    }

    pub(super) fn contains_path(&mut self, path: &'a str) -> bool {
        *self
            .paths
            .entry(path)
            .or_insert_with(|| (self.matches_scope)(path, self.scope))
    }

    pub(super) fn coverage(&mut self, coverage: &'a CoverageMetadata) -> CoverageMetadata {
        coverage_for_scope_with_matcher(coverage, self.scope, &mut |path, _| {
            self.contains_path(path)
        })
    }

    pub(super) fn definitive_arcs<'s: 'a>(&mut self, stored: &'s StoredIndex) -> Vec<&'s StoredArc> {
        stored
            .arcs
            .iter()
            .filter(|arc| {
                self.scope.relation_kinds.contains(&arc.kind)
                    && self.live.contains(&arc.source)
                    && self.live.contains(&arc.target)
                    && arc.evidence.as_ref().is_some_and(|evidence| {
                        evidence.is_definitive()
                            && self.contains_path(&evidence.path)
                            && stored.path_hashes.get(&evidence.path) == Some(&evidence.source_hash)
                    })
            })
            .collect()
    }
}

pub(super) fn definitive_stored_arcs<'a>(stored: &'a StoredIndex, scope: &Scope) -> Vec<&'a StoredArc> {
    ScopedQuery::new(stored, scope, path_in_scope).definitive_arcs(stored)
}

pub(super) fn rebuild_refreshed_arcs(stored: &StoredIndex) -> Vec<StoredArc> {
    // Slice A has no dependency footprint or non-CALLS rebuilder. Any effective
    // source update therefore invalidates every non-CALLS proof conservatively.
    let mut arcs = rebuild_arcs_with_cargo(
        &stored.documents,
        &stored.path_hashes,
        &stored.go_modules,
        &stored.cargo_manifests,
        &stored.rust_files,
        &stored.ts_files,
        &stored.ts_resolution_configs,
    );

    // Add CONTAINS arcs: each file's first SYNTAX symbol contains all others
    // Also add hierarchical containment: parent symbols contain child symbols by span
    {
        use std::collections::BTreeMap;
        let mut symbols_by_file: BTreeMap<&str, Vec<&StoredDocument>> = BTreeMap::new();
        for document in stored.documents.iter().filter(|d| d.provenance == "SYNTAX") {
            symbols_by_file.entry(document.path.as_str()).or_default().push(document);
        }
        for (file_path, symbols) in &symbols_by_file {
            let mut sorted: Vec<_> = symbols.clone();
            sorted.sort_by_key(|d| (d.span_start, d.node_id));
            let source_hash = stored.path_hashes.get(*file_path).copied().unwrap_or(cgrx_core::Hash32([0; 32]));
            
            // File-level containment: first symbol contains all others
            if let Some(module) = sorted.first() {
                for symbol in sorted.iter().skip(1) {
                    arcs.push(StoredArc {
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
            
            // Hierarchical containment: parent symbols contain children whose span is inside theirs
            // Use body_start/body_end for containment (body spans include nested definitions)
            for (i, parent) in sorted.iter().enumerate() {
                let p_start = parent.body_start;
                let p_end = parent.body_end;
                if p_start == p_end { continue; }
                for child in sorted.iter().skip(i + 1) {
                    // Stop if child starts after parent ends
                    if child.span_start >= p_end { break; }
                    // Child is inside parent's body
                    if child.span_start >= p_start && child.span_end <= p_end {
                        arcs.push(StoredArc {
                            source: parent.node_id,
                            target: child.node_id,
                            kind: cgrx_core::RelationKind::Contains,
                            evidence: Some(cgrx_core::EdgeEvidence {
                                path: file_path.to_string(),
                                span: cgrx_core::ByteRange::new(child.span_start, child.span_end),
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
        }
        arcs.sort_by_key(|arc| (arc.source, arc.target, arc.kind, arc.evidence.clone()));
        arcs.dedup();
    }

    arcs
}

pub(super) fn changed_paths(
    base: &BTreeMap<String, Hash32>,
    current: &BTreeMap<String, Hash32>,
) -> BTreeSet<String> {
    base.keys()
        .chain(current.keys())
        .filter(|path| base.get(*path) != current.get(*path))
        .cloned()
        .collect()
}

pub(super) fn working_tree_digest(changed: &BTreeSet<String>, current: &BTreeMap<String, Hash32>) -> Hash32 {
    let mut hasher = blake3::Hasher::new();
    hasher.update(b"cgrx-working-tree-v1\0");
    for path in changed {
        hasher.update(path.as_bytes());
        hasher.update(b"\0");
        if let Some(hash) = current.get(path) {
            hasher.update(&hash.0);
        } else {
            hasher.update(b"deleted");
        }
        hasher.update(b"\0");
    }
    Hash32(*hasher.finalize().as_bytes())
}

