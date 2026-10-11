//! Syntax containment backed by actual declaration/body extents.

use std::cmp::Reverse;
use std::collections::{BTreeMap, BTreeSet};

use cgrx_core::{ByteRange, ConfidenceClass, EdgeEvidence, Hash32, RelationKind, ResolverClass};

use super::{StoredArc, StoredDocument};

struct BodyGroup {
    start: usize,
    end: usize,
    first_symbol: usize,
    past_last_symbol: usize,
    crossing: bool,
}

/// Emit every strict syntax ancestor, never an invented file-anchor parent.
///
/// Equal extents cannot identify a unique parent. Partially overlapping extents
/// cannot describe a syntax tree, so both overlapping groups abstain; valid
/// outer ancestors and unrelated branches remain eligible. A declaration name
/// may precede its own body (for example, a named function initializer), but a
/// name cannot extend beyond its own body. A child's complete body and name
/// must both lie inside its parent's body.
///
/// Sorting, interval validation and ancestor lookup cost O(n log n + a), where
/// a is the number of emitted ancestors. Scratch space is O(n).
pub(super) fn syntax_containment_arcs(
    documents: &[StoredDocument],
    path_hashes: &BTreeMap<String, Hash32>,
) -> Vec<StoredArc> {
    let mut identity_counts = BTreeMap::<u64, usize>::new();
    let mut symbols_by_path = BTreeMap::<&str, Vec<&StoredDocument>>::new();
    for document in documents
        .iter()
        .filter(|document| document.provenance == "SYNTAX")
    {
        *identity_counts.entry(document.node_id).or_default() += 1;
        if !document.path.is_empty()
            && document.span_start < document.span_end
            && document.body_start < document.body_end
            && document.span_end <= document.body_end
        {
            symbols_by_path
                .entry(&document.path)
                .or_default()
                .push(document);
        }
    }

    let identity_is_unique = |document: &StoredDocument| {
        identity_counts
            .get(&document.node_id)
            .is_some_and(|count| *count == 1)
    };
    let mut arcs = Vec::new();
    for (path, mut symbols) in symbols_by_path {
        let Some(source_hash) = path_hashes
            .get(path)
            .copied()
            .filter(|hash| *hash != Hash32([0; 32]))
        else {
            continue;
        };
        symbols.sort_by_key(|document| {
            (
                document.body_start,
                Reverse(document.body_end),
                document.span_start,
                document.node_id,
            )
        });

        let mut groups = Vec::<BodyGroup>::new();
        for (index, symbol) in symbols.iter().enumerate() {
            if let Some(group) = groups.last_mut()
                && group.start == symbol.body_start
                && group.end == symbol.body_end
            {
                group.past_last_symbol = index + 1;
            } else {
                groups.push(BodyGroup {
                    start: symbol.body_start,
                    end: symbol.body_end,
                    first_symbol: index,
                    past_last_symbol: index + 1,
                    crossing: false,
                });
            }
        }
        reject_crossing_groups(&mut groups);

        let mut parents = Vec::<&StoredDocument>::new();
        for group in groups.iter().filter(|group| !group.crossing) {
            while parents
                .last()
                .is_some_and(|parent| parent.body_end <= group.start)
            {
                parents.pop();
            }
            for child in &symbols[group.first_symbol..group.past_last_symbol] {
                if !identity_is_unique(child) {
                    continue;
                }
                // The laminar stack gets narrower toward its end. Find the
                // prefix enclosing the name without scanning rejected inner
                // ancestors when malformed names sit outside their bodies.
                let parent_count = parents.partition_point(|parent| {
                    parent.body_start <= child.span_start && child.span_end <= parent.body_end
                });
                for parent in &parents[..parent_count] {
                    if parent.node_id == child.node_id {
                        continue;
                    }
                    // Noncrossing, start-sorted groups on the stack strictly
                    // enclose this entire child extent, including its end.
                    arcs.push(StoredArc {
                        source: parent.node_id,
                        target: child.node_id,
                        kind: RelationKind::Contains,
                        evidence: Some(EdgeEvidence {
                            path: path.to_owned(),
                            span: ByteRange::new(child.span_start, child.span_end),
                            source_hash,
                            resolver: ResolverClass::SyntaxExact,
                            confidence: ConfidenceClass::Proven,
                            assumptions: Vec::new(),
                            counter_evidence: Vec::new(),
                        }),
                    });
                }
            }
            // Equal-body peers may be children of an unambiguous outer scope,
            // but cannot prove which peer owns definitions inside their body.
            if group.past_last_symbol - group.first_symbol == 1 {
                let parent = symbols[group.first_symbol];
                if identity_is_unique(parent) {
                    parents.push(parent);
                }
            }
        }
    }
    arcs
}

/// Mark crossing endpoints in O(n log n), including overlaps with a group that
/// was already rejected. Every active interval is inserted and removed once;
/// the second set prevents repeatedly visiting rejected crossing groups.
fn reject_crossing_groups(groups: &mut [BodyGroup]) {
    let mut active = BTreeSet::<(usize, usize)>::new();
    let mut unmarked = BTreeSet::<(usize, usize)>::new();
    for index in 0..groups.len() {
        let start = groups[index].start;
        let end = groups[index].end;
        while let Some(&(active_end, active_index)) = active.first()
            && active_end <= start
        {
            active.pop_first();
            unmarked.remove(&(active_end, active_index));
        }
        if active
            .first()
            .is_some_and(|&(active_end, _)| active_end < end)
        {
            groups[index].crossing = true;
        }
        while let Some(&(active_end, active_index)) = unmarked.first()
            && active_end < end
        {
            unmarked.pop_first();
            groups[active_index].crossing = true;
        }
        active.insert((end, index));
        if !groups[index].crossing {
            unmarked.insert((end, index));
        }
    }
}
