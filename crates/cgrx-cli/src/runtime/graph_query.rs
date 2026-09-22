//! Graph query methods for Runtime.
//!
//! These methods are extracted into a separate impl block for the same type.

use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;

use cgrx_core::{RelationKind, Scope};
use cgrx_languages::pack_for_path;
use serde_json::{Value, json};

use super::scan_helpers::{ScopedQuery, matching_symbols as matching_symbol_documents};
use super::{RuntimeError, coverage_gap_count, path_in_scope};

impl super::Runtime {
    pub fn get_outline(&self, path: &str, limit: usize) -> Result<Value, RuntimeError> {
        let path = path.trim();
        if path.is_empty() || Path::new(path).is_absolute() || !(1..=500).contains(&limit) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "path must be relative and non-empty; limit must be between 1 and 500",
            ));
        }
        let language = pack_for_path(Path::new(path))
            .map(|pack| pack.id())
            .ok_or_else(|| RuntimeError::new("cgrx.unsupported_path", path.to_owned()))?;
        if !self.stored.path_hashes.contains_key(path) {
            return Err(RuntimeError::new(
                "cgrx.path_not_indexed",
                format!("path {path} was not indexed"),
            ));
        }
        let scope = Scope {
            include: vec![path.to_owned()],
            exclude: Vec::new(),
            relation_kinds: vec![RelationKind::Calls, RelationKind::Implements],
            max_depth: 0,
        };
        let mut scoped = ScopedQuery::new(&self.stored, &scope, path_in_scope);
        let mut documents = scoped.syntax_documents(&self.stored);
        documents.sort_by_key(|document| (document.span_start, document.node_id));
        let total = documents.len();
        let symbols: Vec<_> = documents
            .into_iter()
            .take(limit)
            .map(|document| {
                json!({
                    "node_id":document.node_id,
                    "symbol":document.qualified_name,
                    "span":{"start":document.span_start,"end":document.span_end}
                })
            })
            .collect();
        Ok(json!({
            "snapshot":self.stored.snapshot,
            "path":path,
            "language":language,
            "symbols":symbols,
            "total":total,
            "truncated":total > limit,
            "coverage_gap_count":coverage_gap_count(&scoped.coverage(&self.stored.coverage))
        }))
    }

    pub(super) fn search_graph_with_matcher(
        &self,
        query: &str,
        scope: &Scope,
        limit: usize,
        language: Option<&str>,
        include_body: bool,
        matches_scope: impl FnMut(&str, &Scope) -> bool,
    ) -> Result<Value, RuntimeError> {
        let query = query.trim();
        if query.is_empty() || !(1..=50).contains(&limit) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "query must be non-empty and limit must be between 1 and 50",
            ));
        }
        let folded = query.to_lowercase();
        let mut scoped = ScopedQuery::new(&self.stored, scope, matches_scope);
        let qualifying = scoped.definitive_arcs(&self.stored);
        let distinct: BTreeSet<_> = qualifying
            .iter()
            .map(|arc| (arc.source, arc.target, arc.kind))
            .collect();
        let mut caller_counts = BTreeMap::<u64, usize>::new();
        let mut callee_counts = BTreeMap::<u64, usize>::new();
        for (source, target, _kind) in distinct {
            debug_assert!(scoped.live.contains(&source) && scoped.live.contains(&target));
            *caller_counts.entry(target).or_default() += 1;
            *callee_counts.entry(source).or_default() += 1;
        }
        let mut matches: Vec<_> = scoped
            .syntax_documents(&self.stored)
            .into_iter()
            .filter(|document| {
                language.is_none_or(|language| {
                    pack_for_path(Path::new(&document.path))
                        .is_some_and(|pack| pack.id() == language)
                })
            })
            .filter_map(|document| {
                let name = document.qualified_name.to_lowercase();
                let (rank, matched_by) = if name == folded {
                    (0, "symbol")
                } else if name.starts_with(&folded) {
                    (1, "symbol")
                } else if name.contains(&folded) {
                    (2, "symbol")
                } else if include_body && document.search_text.to_lowercase().contains(&folded) {
                    (3, "body")
                } else {
                    // Fuzzy matching: allow up to 2 edits for short queries, 3 for longer
                    let max_distance = if folded.len() <= 4 {
                        1
                    } else if folded.len() <= 8 {
                        2
                    } else {
                        3
                    };
                    if levenshtein::levenshtein(&name, &folded) <= max_distance {
                        (4, "fuzzy")
                    } else {
                        return None;
                    }
                };
                let callers = caller_counts.get(&document.node_id).copied().unwrap_or(0);
                let callees = callee_counts.get(&document.node_id).copied().unwrap_or(0);
                Some((rank, document, callers, callees, matched_by))
            })
            .collect();
        matches.sort_by_key(|(rank, document, _, _, _)| {
            (*rank, &document.path, document.span_start, document.node_id)
        });
        let total = matches.len();
        let rows: Vec<_> = matches
            .into_iter()
            .take(limit)
            .map(|(_, document, callers, callees, matched_by)| {
                json!({
                    "node_id":document.node_id,
                    "symbol":document.qualified_name,
                    "path":document.path,
                    "span":{"start":document.span_start,"end":document.span_end},
                    "matched_by":matched_by,
                    "callers":callers,
                    "callees":callees
                })
            })
            .collect();
        Ok(json!({
            "snapshot":self.stored.snapshot,
            "query":query,
            "language":language,
            "include_body":include_body,
            "matches":rows,
            "total":total,
            "truncated":total > limit,
            "coverage_gap_count":coverage_gap_count(&scoped.coverage(&self.stored.coverage))
        }))
    }

    /// Exact duplicate-implementation lookup over structural body
    /// fingerprints. Only SYNTAX documents with a computed fingerprint match;
    /// results are scoped, sorted deterministically, and never guessed.
    /// Detect symbols with zero incoming calls within the given scope.
    /// Returns symbols that are defined (SYNTAX provenance) but never called
    /// by any other symbol in the codebase, filtered to the given scope.
    pub fn detect_dead_code(
        &self,
        scope: &Scope,
        language: Option<&str>,
        limit: usize,
    ) -> Result<Value, RuntimeError> {
        if !(1..=200).contains(&limit) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "limit must be between 1 and 200",
            ));
        }
        let mut scoped = ScopedQuery::new(&self.stored, scope, path_in_scope);
        let arcs = scoped.definitive_arcs(&self.stored);
        // Count incoming calls for each SYNTAX node
        let mut incoming: BTreeMap<u64, usize> = BTreeMap::new();
        for arc in &arcs {
            if arc.kind == RelationKind::Calls {
                *incoming.entry(arc.target).or_default() += 1;
            }
        }
        // Find SYNTAX documents with zero incoming calls
        let mut candidates: Vec<_> = scoped
            .syntax_documents(&self.stored)
            .into_iter()
            .filter(|document| {
                language.is_none_or(|lang| {
                    pack_for_path(Path::new(&document.path)).is_some_and(|pack| pack.id() == lang)
                }) && !incoming.contains_key(&document.node_id)
            })
            .map(|document| {
                let outgoing = arcs
                    .iter()
                    .filter(|arc| arc.source == document.node_id && arc.kind == RelationKind::Calls)
                    .count();
                (document, outgoing)
            })
            .collect();
        candidates.sort_by_key(|(doc, outgoing)| (doc.path.clone(), doc.span_start, *outgoing));
        let total = candidates.len();
        let rows: Vec<_> = candidates
            .into_iter()
            .take(limit)
            .map(|(document, outgoing)| {
                json!({
                    "node_id": document.node_id,
                    "symbol": document.qualified_name,
                    "path": document.path,
                    "span": {"start": document.span_start, "end": document.span_end},
                    "outgoing_calls": outgoing
                })
            })
            .collect();
        Ok(json!({
            "snapshot": self.stored.snapshot,
            "dead_symbols": rows,
            "total": total,
            "truncated": total > limit,
            "coverage_gap_count": coverage_gap_count(&scoped.coverage(&self.stored.coverage))
        }))
    }

    pub fn find_similar(
        &self,
        symbol: &str,
        path: Option<&str>,
        limit: usize,
        scope: &Scope,
    ) -> Result<Value, RuntimeError> {
        if symbol.trim().is_empty() || !(1..=50).contains(&limit) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "symbol and limit 1..50 are required",
            ));
        }
        let mut scoped = ScopedQuery::new(&self.stored, scope, path_in_scope);
        let roots = scoped.matching_symbols(&self.stored, symbol, path);
        let root = match roots.as_slice() {
            [] => {
                return Err(RuntimeError::new(
                    "cgrx.symbol_not_found",
                    format!("symbol {symbol} was not found in scope"),
                ));
            }
            [root] => *root,
            _ => {
                let candidates = roots
                    .iter()
                    .map(|document| format!("{}:{}", document.path, document.span_start))
                    .collect::<Vec<_>>()
                    .join(", ");
                return Err(RuntimeError::new(
                    "cgrx.ambiguous_symbol",
                    format!("symbol {symbol} matches {candidates}; pass path"),
                ));
            }
        };
        let root_json = json!({
            "qualified_name": root.qualified_name,
            "path": root.path,
            "span_start": root.span_start,
            "span_end": root.span_end,
            "node_id": root.node_id,
        });
        let lookup = self.background_similarity_lookup(root, scope, limit);
        Ok(json!({
            "root": root_json,
            "fingerprint": root.semantic_fingerprint,
            "matches": lookup["matches"],
            "matched": lookup["matched"],
            "truncated": lookup["truncated"],
            "similar_matches":lookup["similar_matches"],
            "similar_matched":lookup["similar_matched"],
            "similar_truncated":lookup["similar_truncated"],
            "similarity_partial":lookup["similarity_partial"],
            "similarity_index":lookup["similarity_index"]
        }))
    }

    pub fn trace_path(
        &self,
        symbol: &str,
        path: Option<&str>,
        direction: &str,
        depth: u8,
        scope: &Scope,
        limit: usize,
    ) -> Result<Value, RuntimeError> {
        if symbol.trim().is_empty()
            || !matches!(direction, "callers" | "callees" | "both")
            || !(1..=4).contains(&depth)
            || !(1..=50).contains(&limit)
        {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "symbol, direction, depth 1..4, and limit 1..50 are required",
            ));
        }
        let mut scoped = ScopedQuery::new(&self.stored, scope, path_in_scope);
        let roots = scoped.matching_symbols(&self.stored, symbol, path);
        let scoped_documents = scoped.syntax_documents(&self.stored);
        let root = match roots.as_slice() {
            [] => {
                return Err(RuntimeError::new(
                    "cgrx.symbol_not_found",
                    format!("symbol {symbol} was not found in scope"),
                ));
            }
            [root] => *root,
            _ => {
                let candidates = roots
                    .iter()
                    .map(|document| format!("{}:{}", document.path, document.span_start))
                    .collect::<Vec<_>>()
                    .join(", ");
                return Err(RuntimeError::new(
                    "cgrx.ambiguous_symbol",
                    format!("symbol {symbol} matches {candidates}; pass path"),
                ));
            }
        };
        let by_id: BTreeMap<_, _> = scoped_documents
            .iter()
            .copied()
            .map(|document| (document.node_id, document))
            .collect();
        let mut visited = BTreeSet::from([root.node_id]);
        let mut frontier = vec![root.node_id];
        let mut traced = Vec::new();
        for hop in 1..=depth {
            let mut next = Vec::new();
            for source in &frontier {
                let mut neighbors = Vec::<(u64, &'static str)>::new();
                if matches!(direction, "callees" | "both") {
                    neighbors.extend(
                        scoped
                            .outgoing_arcs(&self.stored, *source)
                            .into_iter()
                            .map(|arc| (arc.target, "callees")),
                    );
                }
                if matches!(direction, "callers" | "both") {
                    neighbors.extend(
                        scoped
                            .incoming_arcs(&self.stored, *source)
                            .into_iter()
                            .map(|arc| (arc.source, "callers")),
                    );
                }
                neighbors.sort_by_key(|(node_id, edge_direction)| {
                    let document = by_id[node_id];
                    (
                        &document.path,
                        document.span_start,
                        *edge_direction,
                        *node_id,
                    )
                });
                neighbors.dedup();
                for (target, edge_direction) in neighbors {
                    debug_assert!(by_id.contains_key(&target));
                    if visited.insert(target) {
                        traced.push((target, hop, edge_direction));
                        next.push(target);
                    }
                }
            }
            next.sort_by_key(|node_id| {
                let document = by_id[node_id];
                (&document.path, document.span_start, *node_id)
            });
            if next.is_empty() {
                break;
            }
            frontier = next;
        }
        traced.sort_by_key(|(node_id, hop, edge_direction)| {
            let document = by_id[node_id];
            (
                *hop,
                &document.path,
                document.span_start,
                *edge_direction,
                *node_id,
            )
        });
        let total = traced.len();
        let nodes: Vec<_> = traced
            .into_iter()
            .take(limit)
            .map(|(node_id, hop, edge_direction)| {
                let document = by_id[&node_id];
                json!({
                    "node_id":node_id,
                    "symbol":document.qualified_name,
                    "path":document.path,
                    "span":{"start":document.span_start,"end":document.span_end},
                    "hop":hop,
                    "direction":edge_direction
                })
            })
            .collect();
        Ok(json!({
            "snapshot":self.stored.snapshot,
            "root":{"node_id":root.node_id,"symbol":root.qualified_name,"path":root.path,"span":{"start":root.span_start,"end":root.span_end}},
            "direction":direction,
            "depth":depth,
            "nodes":nodes,
            "total":total,
            "truncated":total > limit,
            "coverage_gap_count":coverage_gap_count(&scoped.coverage(&self.stored.coverage))
        }))
    }

    pub fn find_usages(
        &self,
        symbol: &str,
        path: Option<&str>,
        scope: &Scope,
        depth: u8,
        limit: usize,
    ) -> Result<Value, RuntimeError> {
        let symbol = symbol.trim();
        if symbol.is_empty()
            || path.is_some_and(|path| path.trim().is_empty())
            || !(1..=4).contains(&depth)
            || !(1..=500).contains(&limit)
        {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "symbol and depth 1..4 are required; path must be non-empty when supplied; limit must be 1..500",
            ));
        }
        let mut scoped = ScopedQuery::new(&self.stored, scope, path_in_scope);
        let roots = scoped.matching_symbols(&self.stored, symbol, path);
        let scoped_documents = scoped.syntax_documents(&self.stored);
        let root = match roots.as_slice() {
            [] => {
                return Err(RuntimeError::new(
                    "cgrx.symbol_not_found",
                    format!("symbol {symbol} was not found in scope"),
                ));
            }
            [root] => *root,
            _ => {
                let candidates = roots
                    .iter()
                    .map(|document| format!("{}:{}", document.path, document.span_start))
                    .collect::<Vec<_>>()
                    .join(", ");
                return Err(RuntimeError::new(
                    "cgrx.ambiguous_symbol",
                    format!("symbol {symbol} matches {candidates}; pass path"),
                ));
            }
        };
        let by_id: BTreeMap<_, _> = scoped_documents
            .iter()
            .copied()
            .map(|document| (document.node_id, document))
            .collect();
        let mut visited = BTreeSet::from([root.node_id]);
        let mut frontier = vec![root.node_id];
        let mut usages = Vec::new();
        for hop in 1..=depth {
            let mut next = BTreeSet::new();
            for target_id in &frontier {
                let Some(target) = by_id.get(target_id).copied() else {
                    continue;
                };
                let mut incoming = scoped.incoming_arcs(&self.stored, *target_id);
                incoming.sort_by_key(|arc| {
                    let evidence = arc.evidence.as_ref().expect("definitive edge evidence");
                    (&evidence.path, evidence.span.start, arc.kind, arc.source)
                });
                for arc in incoming {
                    if visited.contains(&arc.source) {
                        continue;
                    }
                    let Some(source) = by_id.get(&arc.source).copied() else {
                        continue;
                    };
                    let Some(evidence) = arc.evidence.as_ref() else {
                        continue;
                    };
                    usages.push((arc, source, target, evidence, hop));
                    next.insert(arc.source);
                }
            }
            if next.is_empty() {
                break;
            }
            visited.extend(&next);
            frontier = next.into_iter().collect();
        }
        usages.sort_by_key(|(arc, source, target, evidence, hop)| {
            (
                *hop,
                &evidence.path,
                evidence.span.start,
                &source.path,
                source.span_start,
                target.node_id,
                arc.kind,
                source.node_id,
            )
        });
        usages.dedup_by_key(|(arc, source, target, evidence, hop)| {
            (
                *hop,
                evidence.path.clone(),
                evidence.span,
                source.node_id,
                target.node_id,
                arc.kind,
            )
        });
        let total = usages.len();
        let rows: Vec<_> = usages
            .into_iter()
            .take(limit)
            .map(|(arc, source, target, evidence, hop)| {
                json!({
                    "source":{"node_id":source.node_id,"symbol":source.qualified_name,"path":source.path,"span":{"start":source.span_start,"end":source.span_end}},
                    "via":{"node_id":target.node_id,"symbol":target.qualified_name,"path":target.path},
                    "relation":arc.kind,
                    "site":{"path":evidence.path,"span":evidence.span},
                    "resolver":evidence.resolver,
                    "confidence":evidence.confidence,
                    "hop":hop
                })
            })
            .collect();
        Ok(json!({
            "snapshot":self.stored.snapshot,
            "target":{"node_id":root.node_id,"symbol":root.qualified_name,"path":root.path,"span":{"start":root.span_start,"end":root.span_end}},
            "depth":depth,
            "usages":rows,
            "total":total,
            "truncated":total > limit,
            "coverage_gap_count":coverage_gap_count(&scoped.coverage(&self.stored.coverage))
        }))
    }

    pub fn get_code_snippet(
        &self,
        symbol: &str,
        path: Option<&str>,
    ) -> Result<Value, RuntimeError> {
        let symbol = symbol.trim();
        if symbol.is_empty() || path.is_some_and(|path| path.trim().is_empty()) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "symbol must be non-empty and path, when supplied, must be non-empty",
            ));
        }
        let matches = matching_symbol_documents(&self.stored, symbol, path);
        let document = match matches.as_slice() {
            [] => {
                return Err(RuntimeError::new(
                    "cgrx.symbol_not_found",
                    format!("symbol {symbol} was not found"),
                ));
            }
            [document] => *document,
            _ => {
                let candidates = matches
                    .iter()
                    .map(|document| format!("{}:{}", document.path, document.span_start))
                    .collect::<Vec<_>>()
                    .join(", ");
                return Err(RuntimeError::new(
                    "cgrx.ambiguous_symbol",
                    format!("symbol {symbol} matches {candidates}; pass path"),
                ));
            }
        };
        Ok(json!({
            "snapshot":self.stored.snapshot,
            "node_id":document.node_id,
            "symbol":document.qualified_name,
            "path":document.path,
            "definition_span":{"start":document.span_start,"end":document.span_end},
            "body_span":{"start":document.body_start,"end":document.body_end},
            "declaration":document.text,
            "source":document.search_text,
            "provenance":document.provenance
        }))
    }

    /// Explain a symbol: return its definition, callers, callees, and usages.
    /// Combines get_code_snippet + find_usages + trace_path into one call.
    pub fn explain_symbol(
        &self,
        symbol: &str,
        path: Option<&str>,
        scope: &Scope,
        depth: u8,
        limit: usize,
    ) -> Result<Value, RuntimeError> {
        let symbol = symbol.trim();
        if symbol.is_empty() || path.is_some_and(|path| path.trim().is_empty()) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "symbol must be non-empty and path, when supplied, must be non-empty",
            ));
        }
        let limit = limit.min(50);
        let depth = depth.min(4);

        // 1. Get definition
        let matches = matching_symbol_documents(&self.stored, symbol, path);
        let document = match matches.as_slice() {
            [] => {
                return Err(RuntimeError::new(
                    "cgrx.symbol_not_found",
                    format!("symbol {symbol} was not found"),
                ));
            }
            [document] => *document,
            _ => {
                let candidates = matches
                    .iter()
                    .map(|document| format!("{}:{}", document.path, document.span_start))
                    .collect::<Vec<_>>()
                    .join(", ");
                return Err(RuntimeError::new(
                    "cgrx.ambiguous_symbol",
                    format!("symbol {symbol} matches {candidates}; pass path"),
                ));
            }
        };

        let definition = json!({
            "symbol": document.qualified_name,
            "path": document.path,
            "span": {"start": document.span_start, "end": document.span_end},
            "declaration": document.text,
            "source": document.search_text,
        });

        // 2. Get callers (incoming calls)
        let mut scoped = ScopedQuery::new(&self.stored, scope, path_in_scope);
        let by_id: BTreeMap<_, _> = scoped
            .syntax_documents(&self.stored)
            .into_iter()
            .map(|document| (document.node_id, document))
            .collect();

        let mut callers = Vec::new();
        let mut callees = Vec::new();

        for arc in scoped.incoming_arcs(&self.stored, document.node_id) {
            if let Some(source) = by_id.get(&arc.source) {
                callers.push(json!({
                    "symbol": source.qualified_name,
                    "path": source.path,
                    "span": {"start": source.span_start, "end": source.span_end},
                }));
            }
        }
        for arc in scoped.outgoing_arcs(&self.stored, document.node_id) {
            if let Some(target) = by_id.get(&arc.target) {
                callees.push(json!({
                    "symbol": target.qualified_name,
                    "path": target.path,
                    "span": {"start": target.span_start, "end": target.span_end},
                }));
            }
        }

        callers.truncate(limit);
        callees.truncate(limit);

        // 3. Get usages (deeper trace)
        let mut visited = BTreeSet::from([document.node_id]);
        let mut frontier = vec![document.node_id];
        let mut usages = Vec::new();

        for hop in 1..=depth {
            let mut next = BTreeSet::new();
            for target_id in &frontier {
                for arc in scoped.incoming_arcs(&self.stored, *target_id) {
                    if visited.contains(&arc.source) {
                        continue;
                    }
                    if let Some(source) = by_id.get(&arc.source) {
                        usages.push(json!({
                            "symbol": source.qualified_name,
                            "path": source.path,
                            "span": {"start": source.span_start, "end": source.span_end},
                            "hop": hop,
                        }));
                        next.insert(arc.source);
                    }
                }
            }
            visited.extend(&next);
            frontier = next.into_iter().collect();
        }

        usages.truncate(limit);

        Ok(json!({
            "snapshot": self.stored.snapshot,
            "definition": definition,
            "callers": callers,
            "callees": callees,
            "usages": usages,
            "callers_count": callers.len(),
            "callees_count": callees.len(),
            "usages_count": usages.len(),
        }))
    }
}
