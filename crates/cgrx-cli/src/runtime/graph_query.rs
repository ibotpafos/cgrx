//! Graph query methods for Runtime.
//!
//! These methods are extracted into a separate impl block for the same type.

use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;

use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use cgrx_core::{Hash32, RelationKind, Scope, SymbolSelector, canonical_hash};
use cgrx_languages::pack_for_path;
use cgrx_retrieval::{contains_identifier_tokens, identifier_tokens};
use serde::Deserialize;
use serde_json::{Value, json};

use super::scan_helpers::{ScopedQuery, matching_symbols as matching_symbol_documents};
use super::{RuntimeError, coverage_gap_count, path_in_scope};

const MAX_SEARCH_OFFSET: usize = 1_000_000;

fn search_continuation(
    offset: usize,
    returned: usize,
    total: usize,
) -> Result<Option<usize>, RuntimeError> {
    let returned_end = offset.saturating_add(returned);
    if returned_end >= total {
        return Ok(None);
    }
    if returned_end > MAX_SEARCH_OFFSET {
        return Err(RuntimeError::new(
            "cgrx.search_pagination_limit",
            "search continuation exceeds offset 1000000; narrow the query or path scope",
        ));
    }
    Ok(Some(returned_end))
}

fn parse_symbol_reference(reference: &str) -> Option<Hash32> {
    if let Some(encoded) = reference.strip_prefix("cgrxs1.") {
        // Reuse the strict lowercase-hex parser for references issued by v1.
        return Hash32::deserialize(
            serde::de::value::StrDeserializer::<serde::de::value::Error>::new(encoded),
        )
        .ok();
    }
    let encoded = reference.strip_prefix("cgrxs2.")?;
    if encoded.len() != 43 {
        return None;
    }
    let mut digest = [0_u8; 32];
    // This engine rejects padding, foreign alphabet bytes and nonzero trailing bits.
    let length = URL_SAFE_NO_PAD.decode_slice(encoded, &mut digest).ok()?;
    (length == digest.len()).then_some(Hash32(digest))
}

impl super::Runtime {
    pub(super) fn symbol_reference(&self, document: &super::StoredDocument) -> String {
        format!(
            "cgrxs2.{}",
            URL_SAFE_NO_PAD.encode(self.symbol_reference_digest(document).0)
        )
    }

    fn symbol_reference_digest(&self, document: &super::StoredDocument) -> Hash32 {
        canonical_hash(&(
            // Keep the identity domain stable across wire encodings for v1 compatibility.
            "cgrx.symbol.v1",
            self.state_root.as_os_str().as_encoded_bytes(),
            &self.stored.snapshot,
            self.stored.extraction_revision,
            document.node_id,
            &document.qualified_name,
            &document.path,
            document.span_start,
            document.span_end,
            self.stored.path_hashes.get(&document.path),
        ))
        .expect("symbol reference contains only serializable index identity fields")
    }

    pub(super) fn select_document<'a>(
        &self,
        selector: SymbolSelector<'_>,
        mut candidates: Vec<&'a super::StoredDocument>,
    ) -> Result<&'a super::StoredDocument, RuntimeError> {
        if let Some(reference) = selector.symbol_ref {
            let digest = parse_symbol_reference(reference).ok_or_else(|| {
                RuntimeError::new(
                    "cgrx.invalid_arguments",
                    "symbol_ref must be an opaque reference returned by search_graph or get_outline",
                )
            })?;
            candidates.retain(|document| self.symbol_reference_digest(document) == digest);
            let [document] = candidates.as_slice() else {
                return Err(RuntimeError::new(
                    "cgrx.symbol_ref_not_found",
                    "symbol_ref does not match the current index snapshot, symbol, path, or scope; rediscover the definition",
                ));
            };
            if super::scan_helpers::syntax_document(&self.stored, document.node_id).is_none() {
                return Err(RuntimeError::new(
                    "cgrx.symbol_ref_not_found",
                    "symbol_ref requires a unique definition identity; rediscover the definition",
                ));
            }
            return Ok(*document);
        }
        match candidates.as_slice() {
            [] => Err(RuntimeError::new(
                "cgrx.symbol_not_found",
                format!("symbol {} was not found in scope", selector.symbol),
            )),
            [document] => Ok(*document),
            _ => {
                let candidates = candidates
                    .iter()
                    .map(|document| format!("{}:{}", document.path, document.span_start))
                    .collect::<Vec<_>>()
                    .join(", ");
                Err(RuntimeError::new(
                    "cgrx.ambiguous_symbol",
                    format!(
                        "symbol {} matches {candidates}; pass path or symbol_ref from search_graph or get_outline",
                        selector.symbol
                    ),
                ))
            }
        }
    }

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
                    "symbol_ref":self.symbol_reference(document),
                    "symbol":document.qualified_name,
                    "span":{"start":document.span_start,"end":document.span_end}
                })
            })
            .collect();
        let mut result = json!({
            "snapshot":self.stored.snapshot,
            "path":path,
            "language":language,
            "symbols":symbols,
            "total":total,
            "truncated":total > limit,
            "coverage_gap_count":coverage_gap_count(&scoped.coverage(&self.stored.coverage))
        });
        if matches!(language, "python" | "typescript") {
            let sources: BTreeMap<_, _> = self
                .stored
                .documents
                .iter()
                .filter(|d| d.path == path && d.provenance == "IMPORTS")
                .map(|d| (d.node_id, d))
                .collect();
            let mut imports = Vec::new();
            for arc in self
                .stored
                .arcs
                .iter()
                .filter(|a| a.kind == RelationKind::Imports)
            {
                let Some(source) = sources.get(&arc.source) else {
                    continue;
                };
                let Some(target) = super::scan_helpers::syntax_document(&self.stored, arc.target)
                else {
                    continue;
                };
                let Some(proof) = arc.evidence.as_ref().filter(|e| {
                    e.is_definitive()
                        && self.stored.path_hashes.get(&e.path) == Some(&e.source_hash)
                }) else {
                    continue;
                };
                imports.push(json!({
                    "local":source.qualified_name,
                    "target":{"symbol":target.qualified_name,"path":target.path,
                        "span":{"start":target.span_start,"end":target.span_end}},
                    "evidence":proof
                }));
            }
            imports.sort_by_key(|i| i["evidence"]["span"]["start"].as_u64());
            let total_imports = imports.len();
            imports.truncate(limit);
            result["imports"] = json!(imports);
            result["total_imports"] = json!(total_imports);
            result["imports_truncated"] = json!(total_imports > limit);
        }
        Ok(result)
    }

    #[cfg(test)]
    pub(super) fn search_graph_with_matcher(
        &self,
        query: &str,
        scope: &Scope,
        limit: usize,
        language: Option<&str>,
        include_body: bool,
        matches_scope: impl FnMut(&str, &Scope) -> bool,
    ) -> Result<Value, RuntimeError> {
        self.search_graph_page_with_matcher(
            query,
            scope,
            (limit, 0),
            language,
            include_body,
            matches_scope,
        )
    }

    pub(super) fn search_graph_page_with_matcher(
        &self,
        query: &str,
        scope: &Scope,
        page: (usize, usize),
        language: Option<&str>,
        include_body: bool,
        matches_scope: impl FnMut(&str, &Scope) -> bool,
    ) -> Result<Value, RuntimeError> {
        let (limit, offset) = page;
        let query = query.trim();
        if query.is_empty() || !(1..=50).contains(&limit) || offset > MAX_SEARCH_OFFSET {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "query must be non-empty; limit must be between 1 and 50; offset must be between 0 and 1000000",
            ));
        }
        let folded = query.to_lowercase();
        let mut query_tokens = identifier_tokens(query);
        query_tokens.sort_unstable();
        query_tokens.dedup();
        let query_length = folded.chars().count();
        let max_distance = if query_length <= 4 {
            1
        } else if query_length <= 8 {
            2
        } else {
            3
        };
        let fuzzy_allowed = !query_tokens.is_empty() && !query.chars().any(char::is_whitespace);
        let mut fuzzy_query_characters = None::<Vec<char>>;
        let mut scoped = ScopedQuery::new(&self.stored, scope, matches_scope);
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
                let (rank, detail, matched_by) = if name == folded {
                    (0, 0, "symbol")
                } else if name.starts_with(&folded) {
                    (1, 0, "symbol")
                } else if name.contains(&folded) {
                    (2, 0, "symbol")
                } else {
                    let name_tokens: BTreeSet<_> = identifier_tokens(&document.qualified_name)
                        .into_iter()
                        .collect();
                    if !query_tokens.is_empty()
                        && query_tokens.iter().all(|token| name_tokens.contains(token))
                    {
                        (3, name_tokens.len() - query_tokens.len(), "symbol_tokens")
                    } else if include_body && document.search_text.to_lowercase().contains(&folded)
                    {
                        (4, 0, "body")
                    } else if include_body
                        && !query_tokens.is_empty()
                        && contains_identifier_tokens(&document.search_text, &query_tokens)
                    {
                        (5, 0, "body_tokens")
                    } else {
                        // Multi-term queries require every term, so fuzzy name
                        // matching applies only to a single identifier.
                        if !fuzzy_allowed
                            || name.chars().count().abs_diff(query_length) > max_distance
                        {
                            return None;
                        }
                        let query_characters = fuzzy_query_characters.get_or_insert_with(|| {
                            let mut characters = Vec::with_capacity(query_length);
                            characters.extend(folded.chars());
                            characters
                        });
                        let distance = super::edit_distance::bounded_levenshtein(
                            &name,
                            query_characters,
                            max_distance,
                        )?;
                        (6, distance, "fuzzy")
                    }
                };
                Some((rank, detail, document, matched_by))
            })
            .collect();
        matches.sort_by_key(|(rank, detail, document, _)| {
            (
                *rank,
                *detail,
                &document.path,
                document.span_start,
                document.node_id,
            )
        });
        let total = matches.len();
        let page: Vec<_> = matches.into_iter().skip(offset).take(limit).collect();
        let page_node_ids = page
            .iter()
            .map(|(_, _, document, _)| document.node_id)
            .collect();
        let degrees = scoped.relationship_degrees(&self.stored, &page_node_ids);
        let rows: Vec<_> = page
            .into_iter()
            .map(|(_, _, document, matched_by)| {
                let (callers, callees) =
                    degrees.get(&document.node_id).copied().unwrap_or_default();
                json!({
                    "node_id":document.node_id,
                    "symbol_ref":self.symbol_reference(document),
                    "symbol":document.qualified_name,
                    "path":document.path,
                    "span":{"start":document.span_start,"end":document.span_end},
                    "matched_by":matched_by,
                    "callers":callers,
                    "callees":callees
                })
            })
            .collect();
        let next_offset = search_continuation(offset, rows.len(), total)?;
        let has_more = next_offset.is_some();
        let snapshot_id = canonical_hash(&(
            "cgrx.search.snapshot.v1",
            self.state_root.as_os_str().as_encoded_bytes(),
            &self.stored.snapshot,
            self.stored.extraction_revision,
        ))
        .map_err(|error| RuntimeError::new("cgrx.search_snapshot", error.to_string()))?;
        Ok(json!({
            "snapshot":self.stored.snapshot,
            "query":query,
            "language":language,
            "include_body":include_body,
            "algorithm":"identifier_discovery_v1",
            "llm_used":false,
            "matches":rows,
            "total":total,
            "truncated":has_more,
            "page":{"offset":offset,"limit":limit,"next_offset":next_offset,"has_more":has_more,"snapshot_id":snapshot_id},
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
        self.trace_path_selected(
            SymbolSelector::new(symbol, path),
            direction,
            depth,
            scope,
            limit,
        )
    }

    pub fn trace_path_selected(
        &self,
        selector: SymbolSelector<'_>,
        direction: &str,
        depth: u8,
        scope: &Scope,
        limit: usize,
    ) -> Result<Value, RuntimeError> {
        let SymbolSelector { symbol, path, .. } = selector;
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
        let root = self.select_document(selector, roots)?;
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
                    "symbol_ref":self.symbol_reference(document),
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
            "root":{"node_id":root.node_id,"symbol_ref":self.symbol_reference(root),"symbol":root.qualified_name,"path":root.path,"span":{"start":root.span_start,"end":root.span_end}},
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
        self.find_usages_selected(SymbolSelector::new(symbol, path), scope, depth, limit)
    }

    pub fn find_usages_selected(
        &self,
        selector: SymbolSelector<'_>,
        scope: &Scope,
        depth: u8,
        limit: usize,
    ) -> Result<Value, RuntimeError> {
        let symbol = selector.symbol;
        let path = selector.path;
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
        let scoped_documents = scoped.relationship_documents(&self.stored);
        let root = self.select_document(selector, roots)?;
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
                    let self_call = arc.kind == RelationKind::Calls && arc.source == *target_id;
                    if visited.contains(&arc.source) && !self_call {
                        continue;
                    }
                    let Some(source) = by_id.get(&arc.source).copied() else {
                        continue;
                    };
                    let Some(evidence) = arc.evidence.as_ref() else {
                        continue;
                    };
                    usages.push((arc, source, target, evidence, hop));
                    // Record recursion as a real usage without scheduling the
                    // visited symbol again or repeating its sites at later hops.
                    if !visited.contains(&arc.source) {
                        next.insert(arc.source);
                    }
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
                    "source":{"node_id":source.node_id,"symbol_ref":(source.provenance == "SYNTAX").then(|| self.symbol_reference(source)),"symbol":source.qualified_name,"path":source.path,"span":{"start":source.span_start,"end":source.span_end}},
                    "via":{"node_id":target.node_id,"symbol_ref":self.symbol_reference(target),"symbol":target.qualified_name,"path":target.path},
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
            "target":{"node_id":root.node_id,"symbol_ref":self.symbol_reference(root),"symbol":root.qualified_name,"path":root.path,"span":{"start":root.span_start,"end":root.span_end}},
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
        self.get_code_snippet_selected(SymbolSelector::new(symbol, path))
    }

    pub fn get_code_snippet_selected(
        &self,
        selector: SymbolSelector<'_>,
    ) -> Result<Value, RuntimeError> {
        let symbol = selector.symbol;
        let path = selector.path;
        let symbol = symbol.trim();
        if symbol.is_empty() || path.is_some_and(|path| path.trim().is_empty()) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "symbol must be non-empty and path, when supplied, must be non-empty",
            ));
        }
        let matches = matching_symbol_documents(&self.stored, symbol, path);
        let document = self.select_document(selector, matches)?;
        Ok(json!({
            "snapshot":self.stored.snapshot,
            "node_id":document.node_id,
                    "symbol_ref":self.symbol_reference(document),
            "symbol":document.qualified_name,
            "path":document.path,
            "source_hash":self.stored.path_hashes.get(&document.path),
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

#[cfg(test)]
mod reference_tests {
    use super::*;

    #[test]
    fn search_continuations_stay_within_the_accepted_offset_range() {
        for (offset, returned, total, next) in [
            (0, 20, 57, Some(20)),
            (40, 17, 57, None),
            (60, 0, 57, None),
            (999_999, 1, 1_000_002, Some(1_000_000)),
            (1_000_000, 2, 1_000_002, None),
        ] {
            assert_eq!(search_continuation(offset, returned, total).unwrap(), next);
        }
        let error = search_continuation(1_000_000, 1, 1_000_002).unwrap_err();
        assert_eq!(error.code(), "cgrx.search_pagination_limit");
        assert!(error.to_string().contains("narrow"));
    }

    #[test]
    fn symbol_reference_codecs_preserve_all_digest_bytes() {
        for seed in 0..=u8::MAX {
            let digest = Hash32(std::array::from_fn(|index| {
                seed.wrapping_add(u8::try_from(index).unwrap())
            }));
            let current = format!("cgrxs2.{}", URL_SAFE_NO_PAD.encode(digest.0));
            let legacy = format!(
                "cgrxs1.{}",
                serde_json::to_value(digest).unwrap().as_str().unwrap()
            );
            assert_eq!(current.len(), 50);
            assert_eq!(parse_symbol_reference(&current), Some(digest));
            assert_eq!(parse_symbol_reference(&legacy), Some(digest));
        }
    }

    #[test]
    fn symbol_reference_decoder_rejects_aliases_and_unbounded_inputs() {
        let canonical = format!("cgrxs2.{}", "A".repeat(43));
        assert_eq!(parse_symbol_reference(&canonical), Some(Hash32([0; 32])));
        for invalid in [
            format!("{canonical}="),
            format!("{canonical}\n"),
            format!("cgrxs2.{}", "A".repeat(42)),
            format!("cgrxs2.{}", "A".repeat(44)),
            format!("cgrxs2.{}", "A".repeat(65_536)),
            format!("cgrxs2.{}", "+".repeat(43)),
            format!("cgrxs2.{}", "/".repeat(43)),
            format!("cgrxs2.{}", "é".repeat(22)),
            format!("cgrxs3.{}", "A".repeat(43)),
            format!("cgrxs1.{}", "A".repeat(64)),
        ] {
            assert_eq!(parse_symbol_reference(&invalid), None);
        }
        // Last character has two unused bits for a 32-byte digest. Nonzero
        // values would otherwise alias the canonical string's decoded identity.
        for last in ['B', 'C', 'D'] {
            let alias = format!("cgrxs2.{}{last}", "A".repeat(42));
            assert_eq!(parse_symbol_reference(&alias), None);
        }
    }
}
