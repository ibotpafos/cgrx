//! Index coverage checking: check_index_coverage function.
//!
//! Extracted from impl Runtime as a standalone function.

use std::collections::{BTreeMap, BTreeSet};

use cgrx_core::Scope;
use serde_json::{Value, json};

use super::{
    RuntimeError, StoredIndex, coverage_for_scope, coverage_gap_count, coverage_gap_page,
    dynamic_dispatch_path, path_in_scope,
};

pub(super) fn check_index_coverage(
    stored: &StoredIndex,
    paths: &[String],
    scopes: &[String],
    gap_offset: usize,
    gap_limit: usize,
) -> Result<Value, RuntimeError> {
    if !(1..=500).contains(&gap_limit) {
        return Err(RuntimeError::new(
            "cgrx.invalid_arguments",
            "coverage limit must be from 1 to 500",
        ));
    }
    if paths.is_empty() && scopes.is_empty() {
        return Err(RuntimeError::new(
            "cgrx.invalid_arguments",
            "at least one exact path or bounded scope is required",
        ));
    }
    if paths
        .iter()
        .chain(scopes)
        .any(|value| value.trim().is_empty())
    {
        return Err(RuntimeError::new(
            "cgrx.invalid_arguments",
            "paths and scopes must be non-empty",
        ));
    }

    let mut counts = BTreeMap::from([
        ("indexed", 0_usize),
        ("partial", 0),
        ("excluded", 0),
        ("unknown", 0),
    ]);
    let path_rows: Vec<_> = paths
        .iter()
        .map(|path| {
            let indexed = stored.documents.iter().any(|document| {
                document.provenance == "SYNTAX" && document.path == *path
            });
            let excluded = stored.coverage.excluded_paths.iter().any(|item| item == path);
            let mut gaps = Vec::new();
            gaps.extend(
                stored
                    .coverage
                    .parser_error_ranges
                    .iter()
                    .filter(|range| range.path == *path)
                    .map(|range| json!({"code":"PARSER_ERROR_RANGE","start":range.start,"end":range.end})),
            );
            gaps.extend(
                stored
                    .coverage
                    .stale_paths
                    .iter()
                    .filter(|item| *item == path)
                    .map(|_| json!({"code":"STALE_PATH"})),
            );
            gaps.extend(
                stored
                    .coverage
                    .dynamic_dispatch
                    .iter()
                    .filter(|location| dynamic_dispatch_path(location) == path)
                    .map(|location| json!({"code":"DYNAMIC_DISPATCH","location":location})),
            );
            let status = if indexed && gaps.is_empty() {
                "indexed"
            } else if indexed {
                "partial"
            } else if excluded {
                "excluded"
            } else {
                "unknown"
            };
            *counts.get_mut(status).expect("known coverage status") += 1;
            json!({"path":path,"status":status,"gaps":gaps,"gap_count":gaps.len()})
        })
        .collect();

    let scope_rows: Vec<_> = scopes
        .iter()
        .map(|pattern| {
            let scope = Scope {
                include: vec![pattern.clone()],
                exclude: Vec::new(),
                relation_kinds: Vec::new(),
                max_depth: 1,
            };
            let indexed_paths: BTreeSet<_> = stored
                .documents
                .iter()
                .filter(|document| {
                    document.provenance == "SYNTAX" && path_in_scope(&document.path, &scope)
                })
                .map(|document| document.path.as_str())
                .collect();
            let coverage = coverage_for_scope(&stored.coverage, &scope);
            let gap_count = coverage_gap_count(&coverage);
            let page = coverage_gap_page(&coverage, gap_offset, gap_limit);
            let returned = page.len();
            let has_more = gap_offset.saturating_add(returned) < gap_count;
            let next_offset = has_more.then_some(gap_offset.saturating_add(returned));
            let status = if !indexed_paths.is_empty() && gap_count == 0 {
                "indexed"
            } else if !indexed_paths.is_empty() {
                "partial"
            } else if !coverage.excluded_paths.is_empty() {
                "excluded"
            } else {
                "unknown"
            };
            json!({
                "scope":pattern,
                "status":status,
                "indexed_paths":indexed_paths.len(),
                "coverage_gap_count":gap_count,
                "gap_offset":gap_offset,
                "gap_limit":gap_limit,
                "gaps":page,
                "returned":returned,
                "has_more":has_more,
                "next_offset":next_offset,
                "coverage_summary":{
                    "excluded_paths":coverage.excluded_paths.len(),
                    "parser_error_ranges":coverage.parser_error_ranges.len(),
                    "stale_paths":coverage.stale_paths.len(),
                    "dynamic_dispatch":coverage.dynamic_dispatch.len(),
                    "traversal_truncated":coverage.traversal_truncated
                }
            })
        })
        .collect();

    let mut scope_counts = BTreeMap::from([
        ("indexed", 0_usize),
        ("partial", 0),
        ("excluded", 0),
        ("unknown", 0),
    ]);
    for row in &scope_rows {
        if let Some(status) = row["status"].as_str() {
            *scope_counts.get_mut(status).expect("known scope status") += 1;
        }
    }

    Ok(json!({
        "snapshot":stored.snapshot,
        "paths":path_rows,
        "scopes":scope_rows,
        "summary":counts,
        "scope_summary":scope_counts,
        "meaning":"indexed means no recorded gap; partial means indexed with recorded parser, dynamic, or stale gaps"
    }))
}
