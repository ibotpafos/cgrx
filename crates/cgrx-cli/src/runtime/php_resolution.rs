//! PHP function proofs are positional, source-bound and never name-only.
//! The experimental registry must be explicitly enabled; default builds do not
//! accept its cache revision or resurrect PHP relationships from stored arcs.

use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;

use cgrx_core::{ByteRange, ConfidenceClass, EdgeEvidence, Hash32, RelationKind, ResolverClass};
use serde::{Deserialize, Serialize};

use super::{StoredArc, StoredDocument, StoredIndex};

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub(super) struct PhpFunctionTarget {
    pub(super) source_hash: Hash32,
    pub(super) caller: ByteRange,
    pub(super) target: ByteRange,
}

pub(super) fn is_php_path(path: &str) -> bool {
    matches!(
        Path::new(path).extension().and_then(|value| value.to_str()),
        Some("php" | "phtml" | "php3" | "php4" | "php5" | "phps")
    )
}

fn tagged(document: &StoredDocument, tag: &str) -> bool {
    document.semantic_tags.iter().any(|value| value == tag)
}

fn consistent_symbol(document: &StoredDocument) -> bool {
    let Some(start) = document.span_start.checked_sub(document.body_start) else {
        return false;
    };
    let Some(end) = document.span_end.checked_sub(document.body_start) else {
        return false;
    };
    start < end
        && document.body_end.checked_sub(document.body_start) == Some(document.search_text.len())
        && document.text == document.qualified_name
        && document.search_text.get(start..end) == Some(document.qualified_name.as_str())
}

pub(super) fn rebuild(
    documents: &[StoredDocument],
    path_hashes: &BTreeMap<String, Hash32>,
) -> Vec<StoredArc> {
    if !cgrx_languages::EXPERIMENTAL_PHP_ENABLED {
        return Vec::new();
    }
    // Build one exact identity index for the pass. Duplicate identities are
    // blockers, not a reason to choose the first declaration encountered.
    let mut symbols = BTreeMap::new();
    for document in documents
        .iter()
        .filter(|doc| doc.provenance == "SYNTAX" && is_php_path(&doc.path))
    {
        symbols
            .entry((document.path.as_str(), document.span_start, document.span_end))
            .and_modify(|entry| *entry = None)
            .or_insert(Some(document));
    }
    let mut arcs = Vec::new();
    for call in documents
        .iter()
        .filter(|doc| doc.provenance == "CALLS" && is_php_path(&doc.path))
    {
        let resolved = (|| {
            if !tagged(call, "EXACT_CALL") || !tagged(call, "PHP_FUNCTION_CALL") {
                return None;
            }
            let proof = call.php_function_target.as_ref()?;
            if path_hashes.get(&call.path) != Some(&proof.source_hash) {
                return None;
            }
            let caller = (*symbols.get(&(
                call.path.as_str(),
                proof.caller.start,
                proof.caller.end,
            ))?)?;
            let target = (*symbols.get(&(
                call.path.as_str(),
                proof.target.start,
                proof.target.end,
            ))?)?;
            if !consistent_symbol(caller)
                || !consistent_symbol(target)
                || !tagged(target, "PHP_GLOBAL_FUNCTION")
                || target.qualified_name != call.qualified_name
                || call.span_start >= call.span_end
                || call.span_end > caller.body_end
                || call.text != call.search_text
            {
                return None;
            }
            let start = call.span_start.checked_sub(caller.body_start)?;
            let end = call.span_end.checked_sub(caller.body_start)?;
            // The persisted call bytes must still be the exact substring of
            // the persisted caller, including spelling, comments and UTF-8.
            if caller.search_text.get(start..end) != Some(call.text.as_str()) {
                return None;
            }
            Some(StoredArc {
                source: caller.node_id,
                target: target.node_id,
                kind: RelationKind::Calls,
                evidence: Some(EdgeEvidence {
                    path: call.path.clone(),
                    span: ByteRange::new(call.span_start, call.span_end),
                    source_hash: proof.source_hash,
                    resolver: ResolverClass::SyntaxExact,
                    confidence: ConfidenceClass::Proven,
                    assumptions: Vec::new(),
                    counter_evidence: Vec::new(),
                }),
            })
        })();
        if let Some(arc) = resolved {
            arcs.push(arc);
        }
    }
    arcs.sort_by_key(|arc| (arc.source, arc.target, arc.kind, arc.evidence.clone()));
    arcs.dedup();
    arcs
}

pub(super) fn normalize(stored: &mut StoredIndex) {
    let php_nodes: BTreeSet<_> = stored
        .documents
        .iter()
        .filter(|doc| is_php_path(&doc.path))
        .map(|doc| doc.node_id)
        .collect();
    let touches_php = |arc: &StoredArc| {
        php_nodes.contains(&arc.source)
            || php_nodes.contains(&arc.target)
            || arc.evidence.as_ref().is_some_and(|proof| is_php_path(&proof.path))
    };
    if php_nodes.is_empty() && !stored.arcs.iter().any(touches_php) {
        return;
    }
    // Even proof-bearing serialized CALLS must be reconstructed. A missing,
    // stale or altered document proof cannot survive merely because edges.seg
    // still contains an earlier successful relationship.
    stored
        .arcs
        .retain(|arc| arc.kind != RelationKind::Calls || !touches_php(arc));
    stored.arcs.extend(rebuild(&stored.documents, &stored.path_hashes));
    stored.arcs.sort_by_key(|arc| (arc.source, arc.target, arc.kind, arc.evidence.clone()));
    stored.arcs.dedup();
}
