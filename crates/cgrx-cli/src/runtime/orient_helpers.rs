//! Orient/query helper functions.
//!
//! These functions support the orient tool by providing task evidence
//! collection, symbol matching, definition body matching, lexical term
//! extraction, neighbor mapping, and graph evidence gathering.

use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;

use cgrx_core::Scope;
use cgrx_retrieval::GraphArc;

const GRAPH_FANOUT_LIMIT: usize = 8;

use super::{StoredDocument, path_in_scope};
use crate::intent::{TaskIntent, classify};

pub(super) fn task_evidence_ids(
    task: &str,
    documents: &[StoredDocument],
    arcs: &[GraphArc],
    scope: &Scope,
) -> Vec<u64> {
    let has_tag = |document: &StoredDocument, tag: &str| {
        document.semantic_tags.iter().any(|value| value == tag)
    };
    let scoped: Vec<_> = documents
        .iter()
        .filter(|document| path_in_scope(&document.path, scope))
        .collect();
    let mut selected: Vec<_> = match classify(task) {
        TaskIntent::DecoratedRoute => scoped
            .iter()
            .copied()
            .filter(|document| document.provenance == "ROUTE_HANDLER")
            .collect(),
        TaskIntent::Implementations => scoped
            .iter()
            .copied()
            .filter(|document| {
                document.provenance == "IMPLEMENTS"
                    || (has_tag(document, "DYNAMIC_DISPATCH")
                        && document.text.to_lowercase().contains("worker"))
            })
            .collect(),
        TaskIntent::OverloadCall => scoped
            .iter()
            .copied()
            .filter(|document| has_tag(document, "OVERLOAD_CALL"))
            .collect(),
        TaskIntent::BoundedDepth => {
            let by_name: BTreeMap<_, _> = scoped
                .iter()
                .copied()
                .filter(|document| document.provenance == "SYNTAX")
                .map(|document| (document.qualified_name.as_str(), document.node_id))
                .collect();
            let outgoing: std::collections::BTreeSet<_> =
                arcs.iter().map(|arc| arc.source).collect();
            scoped
                .iter()
                .copied()
                .filter(|document| has_tag(document, "EXACT_CALL"))
                .filter(|document| {
                    by_name
                        .get(document.qualified_name.as_str())
                        .is_some_and(|node_id| !outgoing.contains(node_id))
                })
                .collect()
        }
        TaskIntent::AliasedImport => scoped
            .iter()
            .copied()
            .filter(|document| has_tag(document, "EXACT_CALL"))
            .collect(),
        TaskIntent::CallSite => scoped
            .iter()
            .copied()
            .filter(|document| has_tag(document, "STATEMENT_CALL"))
            .collect(),
        TaskIntent::DynamicProperty => scoped
            .iter()
            .copied()
            .filter(|document| has_tag(document, "DYNAMIC_PROPERTY"))
            .collect(),
        TaskIntent::DynamicDispatch => scoped
            .iter()
            .copied()
            .filter(|document| has_tag(document, "DYNAMIC_DISPATCH"))
            .collect(),
        TaskIntent::Unknown => Vec::new(),
    };
    selected.sort_by_key(|document| (&document.path, document.span_start, document.node_id));
    selected
        .into_iter()
        .map(|document| document.node_id)
        .collect()
}

pub(super) fn exact_symbol_ids(
    task: &str,
    documents: &[StoredDocument],
    scope: &Scope,
) -> Vec<u64> {
    let exact_terms: BTreeSet<_> = task
        .split(|character: char| !character.is_alphanumeric() && character != '_')
        .filter(|term| term.len() >= 4)
        .collect();
    let has_symbol_shape = task.contains(['.', '_'])
        || exact_terms.iter().any(|term| {
            term.chars()
                .skip(1)
                .any(|character| character.is_uppercase())
        });
    if !has_symbol_shape {
        return Vec::new();
    }
    let folded_terms: BTreeSet<_> = exact_terms.iter().copied().map(str::to_lowercase).collect();
    let mut selected: Vec<_> = documents
        .iter()
        .filter(|document| path_in_scope(&document.path, scope))
        .filter(|document| document.provenance == "SYNTAX")
        .filter(|document| folded_terms.contains(&document.qualified_name.to_lowercase()))
        .collect();
    if selected
        .iter()
        .any(|document| exact_terms.contains(document.qualified_name.as_str()))
    {
        selected.retain(|document| exact_terms.contains(document.qualified_name.as_str()));
    }
    selected.sort_by(|left, right| {
        right
            .qualified_name
            .chars()
            .count()
            .cmp(&left.qualified_name.chars().count())
            .then_with(|| left.path.cmp(&right.path))
            .then_with(|| left.span_start.cmp(&right.span_start))
            .then_with(|| left.node_id.cmp(&right.node_id))
    });
    selected
        .into_iter()
        .map(|document| document.node_id)
        .collect()
}

pub(super) fn definition_body_ids(
    task: &str,
    documents: &[StoredDocument],
    scope: &Scope,
) -> Vec<u64> {
    let terms = lexical_terms(task);
    if terms.len() < 3 {
        return Vec::new();
    }
    let mut scored: Vec<_> = documents
        .iter()
        .filter(|document| path_in_scope(&document.path, scope))
        .filter(|document| document.provenance == "SYNTAX")
        .filter_map(|document| {
            let haystack = lexical_terms(&format!(
                "{} {} {}",
                document.qualified_name, document.path, document.search_text
            ));
            let score = terms.intersection(&haystack).count();
            (score >= 2).then_some((document, score))
        })
        .collect();
    let is_test = |path: &str| {
        let test_file = Path::new(path)
            .file_name()
            .and_then(|name| name.to_str())
            .is_some_and(|name| name.starts_with("test_"));
        path.starts_with("tests/")
            || path.contains("/tests/")
            || path.ends_with("_test.rs")
            || path.ends_with(".test.ts")
            || path.ends_with("_test.py")
            || test_file
    };
    let best_production = scored
        .iter()
        .filter(|(document, _)| !is_test(&document.path))
        .map(|(_, score)| *score)
        .max();
    let best_score = best_production.or_else(|| scored.iter().map(|(_, score)| *score).max());
    let Some(best_score) = best_score else {
        return Vec::new();
    };
    scored.retain(|(document, score)| {
        *score == best_score && (best_production.is_none() || !is_test(&document.path))
    });
    scored.sort_by_key(|(document, _)| (&document.path, document.span_start, document.node_id));
    scored
        .into_iter()
        .take(3)
        .map(|(document, _)| document.node_id)
        .collect()
}

pub(super) fn lexical_terms(text: &str) -> BTreeSet<String> {
    let normalized: String = text
        .to_lowercase()
        .chars()
        .map(|character| {
            if character.is_alphanumeric() {
                character
            } else {
                ' '
            }
        })
        .collect();
    normalized
        .split_whitespace()
        .filter(|term| term.chars().count() >= 4)
        .map(|term| {
            for suffix in ["ing", "ers", "er", "ed", "es", "s"] {
                if let Some(stem) = term.strip_suffix(suffix)
                    && stem.chars().count() >= 4
                {
                    return stem.to_owned();
                }
            }
            term.to_owned()
        })
        .collect()
}

pub(super) fn neighbor_map(arcs: &[GraphArc], scope: &Scope) -> BTreeMap<u64, Vec<u64>> {
    let mut neighbors = BTreeMap::<u64, Vec<u64>>::new();
    for arc in arcs
        .iter()
        .filter(|arc| scope.relation_kinds.contains(&arc.kind) && arc.evidence.is_definitive())
    {
        neighbors.entry(arc.source).or_default().push(arc.target);
        neighbors.entry(arc.target).or_default().push(arc.source);
    }
    for values in neighbors.values_mut() {
        values.sort_unstable();
        values.dedup();
        values.truncate(GRAPH_FANOUT_LIMIT);
    }
    neighbors
}

pub(super) fn graph_evidence_ids(
    roots: &[u64],
    arcs: &[GraphArc],
    documents: &[StoredDocument],
    scope: &Scope,
) -> Vec<u64> {
    let scoped: BTreeSet<_> = documents
        .iter()
        .filter(|document| path_in_scope(&document.path, scope))
        .map(|document| document.node_id)
        .collect();
    let mut adjacency = BTreeMap::<u64, Vec<u64>>::new();
    for arc in arcs
        .iter()
        .filter(|arc| scope.relation_kinds.contains(&arc.kind) && arc.evidence.is_definitive())
    {
        if scoped.contains(&arc.source) && scoped.contains(&arc.target) {
            adjacency.entry(arc.source).or_default().push(arc.target);
            adjacency.entry(arc.target).or_default().push(arc.source);
        }
    }
    for targets in adjacency.values_mut() {
        targets.sort_unstable();
        targets.dedup();
        targets.truncate(GRAPH_FANOUT_LIMIT);
    }
    let mut ordered = Vec::new();
    let mut visited = BTreeSet::new();
    let mut frontier = roots.to_vec();
    frontier.sort_unstable();
    for root in roots {
        if scoped.contains(root) && visited.insert(*root) {
            ordered.push(*root);
        }
    }
    for _ in 0..scope.max_depth {
        let mut next = Vec::new();
        for source in &frontier {
            for target in adjacency.get(source).into_iter().flatten() {
                if visited.insert(*target) {
                    ordered.push(*target);
                    next.push(*target);
                }
            }
        }
        next.sort_unstable();
        if next.is_empty() {
            break;
        }
        frontier = next;
    }
    ordered
}

// stable_node_id and generation_id are defined in helpers.rs
