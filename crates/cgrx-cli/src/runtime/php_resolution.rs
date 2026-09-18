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
    let mut symbols = SymbolIndex::new();
    for document in documents
        .iter()
        .filter(|doc| doc.provenance == "SYNTAX" && is_php_path(&doc.path))
    {
        symbols
            .entry((
                document.path.as_str(),
                document.span_start,
                document.span_end,
            ))
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
            let caller =
                (*symbols.get(&(call.path.as_str(), proof.caller.start, proof.caller.end))?)?;
            let target =
                (*symbols.get(&(call.path.as_str(), proof.target.start, proof.target.end))?)?;
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
            // Containment alone also holds for an enclosing function or class.
            // Restrict the existing positional index to this file and reject
            // any inner declaration that owns the same site. Never silently
            // substitute that inner owner for a corrupted caller proof.
            let first = (call.path.as_str(), 0, 0);
            let last = (call.path.as_str(), call.span_end, usize::MAX);
            if symbols.range(first..=last).any(|(_, symbol)| {
                symbol.is_some_and(|inner| {
                    inner.node_id != caller.node_id
                        && caller.body_start <= inner.body_start
                        && inner.body_end <= caller.body_end
                        && inner.body_start <= call.span_start
                        && call.span_end <= inner.body_end
                })
            }) {
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
    arcs.extend(rebuild_types(documents, path_hashes, &symbols));
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
            || arc
                .evidence
                .as_ref()
                .is_some_and(|proof| is_php_path(&proof.path))
    };
    if php_nodes.is_empty() && !stored.arcs.iter().any(touches_php) {
        return;
    }
    // Reconstruct semantic edges instead of trusting previously serialized
    // CALLS, IMPORTS or REFERENCES that lost their supporting document proof.
    stored
        .arcs
        .retain(|arc| arc.kind == RelationKind::Contains || !touches_php(arc));
    stored
        .arcs
        .extend(rebuild(&stored.documents, &stored.path_hashes));
    stored
        .arcs
        .sort_by_key(|arc| (arc.source, arc.target, arc.kind, arc.evidence.clone()));
    stored.arcs.dedup();
}

// An optional fixed-size witness avoids copying the entire PHP source into
// every reference record. The binding checksum detects inconsistent metadata;
// it is not a signature or a boundary against deliberately regenerated indexes.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub(super) struct PhpTypeTarget {
    source_hash: Hash32,
    owner: ByteRange,
    target: ByteRange,
    import: Option<PhpImportSite>,
    binding_hash: Hash32,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
struct PhpImportSite {
    span: ByteRange,
    text_hash: Hash32,
}

impl PhpTypeTarget {
    pub(super) fn new(
        source_hash: Hash32,
        owner: cgrx_languages::Span,
        target: cgrx_languages::Span,
        import: Option<cgrx_languages::Span>,
        path: &str,
        edge: &cgrx_languages::Edge,
        source: &[u8],
    ) -> Self {
        let mut proof = Self {
            source_hash,
            owner: ByteRange::new(owner.start, owner.end),
            target: ByteRange::new(target.start, target.end),
            import: import.map(|span| PhpImportSite {
                span: ByteRange::new(span.start, span.end),
                text_hash: Hash32(*blake3::hash(&source[span.start..span.end]).as_bytes()),
            }),
            binding_hash: Hash32([0; 32]),
        };
        proof.binding_hash = proof.checksum(
            path,
            edge.span.start,
            edge.span.end,
            &edge.target,
            &source[edge.span.start..edge.span.end],
        );
        proof
    }

    fn checksum(&self, path: &str, start: usize, end: usize, name: &str, text: &[u8]) -> Hash32 {
        let mut hash = blake3::Hasher::new();
        hash.update(b"CGRX_PHP_TYPE_BINDING_V1\0");
        hash.update(&self.source_hash.0);
        for value in [
            self.owner.start,
            self.owner.end,
            self.target.start,
            self.target.end,
            start,
            end,
        ] {
            hash.update(&(value as u64).to_le_bytes());
        }
        for bytes in [path.as_bytes(), name.as_bytes(), text] {
            hash.update(&(bytes.len() as u64).to_le_bytes());
            hash.update(bytes);
        }
        hash.update(&[u8::from(self.import.is_some())]);
        if let Some(import) = &self.import {
            hash.update(&(import.span.start as u64).to_le_bytes());
            hash.update(&(import.span.end as u64).to_le_bytes());
            hash.update(&import.text_hash.0);
        }
        Hash32(*hash.finalize().as_bytes())
    }
}

type SymbolIndex<'a> = BTreeMap<(&'a str, usize, usize), Option<&'a StoredDocument>>;

fn rebuild_types(
    documents: &[StoredDocument],
    path_hashes: &BTreeMap<String, Hash32>,
    symbols: &SymbolIndex<'_>,
) -> Vec<StoredArc> {
    let mut imports = SymbolIndex::new();
    for doc in documents
        .iter()
        .filter(|d| d.provenance == "IMPORTS" && is_php_path(&d.path))
    {
        imports
            .entry((doc.path.as_str(), doc.span_start, doc.span_end))
            .and_modify(|entry| *entry = None)
            .or_insert(Some(doc));
    }
    let mut arcs = Vec::new();
    for site in documents
        .iter()
        .filter(|d| d.provenance == "REFERENCES" && is_php_path(&d.path))
    {
        let resolved = (|| {
            if !tagged(site, "PHP_TYPE_REFERENCE") || site.text != site.search_text {
                return None;
            }
            let proof = site.php_type_target.as_ref()?;
            if path_hashes.get(&site.path) != Some(&proof.source_hash)
                || proof.binding_hash
                    != proof.checksum(
                        &site.path,
                        site.span_start,
                        site.span_end,
                        &site.qualified_name,
                        site.text.as_bytes(),
                    )
            {
                return None;
            }
            let owner =
                (*symbols.get(&(site.path.as_str(), proof.owner.start, proof.owner.end))?)?;
            let target =
                (*symbols.get(&(site.path.as_str(), proof.target.start, proof.target.end))?)?;
            if !consistent_symbol(owner)
                || !consistent_symbol(target)
                || !tagged(target, "PHP_TYPE_DECLARATION")
                || target.qualified_name != site.qualified_name
                || site.span_start >= site.span_end
                || site.span_end > owner.body_end
            {
                return None;
            }
            let start = site.span_start.checked_sub(owner.body_start)?;
            let end = site.span_end.checked_sub(owner.body_start)?;
            if owner.search_text.get(start..end) != Some(site.text.as_str()) {
                return None;
            }
            if symbols
                .range((site.path.as_str(), 0, 0)..=(site.path.as_str(), site.span_end, usize::MAX))
                .any(|(_, entry)| {
                    entry.is_some_and(|inner| {
                        inner.node_id != owner.node_id
                            && owner.body_start <= inner.body_start
                            && inner.body_end <= owner.body_end
                            && inner.body_start <= site.span_start
                            && site.span_end <= inner.body_end
                    })
                })
            {
                return None;
            }
            if let Some(import) = &proof.import {
                let doc =
                    (*imports.get(&(site.path.as_str(), import.span.start, import.span.end))?)?;
                if doc.text != doc.search_text
                    || import.span.start >= import.span.end
                    || import.span.end.checked_sub(import.span.start) != Some(doc.text.len())
                    || Hash32(*blake3::hash(doc.text.as_bytes()).as_bytes()) != import.text_hash
                {
                    return None;
                }
            }
            Some((owner.node_id, target.node_id, proof))
        })();
        let Some((owner, target, proof)) = resolved else {
            continue;
        };
        let mut append = |kind, span| {
            arcs.push(StoredArc {
                source: owner,
                target,
                kind,
                evidence: Some(EdgeEvidence {
                    path: site.path.clone(),
                    span,
                    source_hash: proof.source_hash,
                    resolver: ResolverClass::SyntaxExact,
                    confidence: ConfidenceClass::Proven,
                    assumptions: Vec::new(),
                    counter_evidence: Vec::new(),
                }),
            })
        };
        append(
            RelationKind::References,
            ByteRange::new(site.span_start, site.span_end),
        );
        if let Some(import) = &proof.import {
            // A used import creates a dependency from its consuming declaration,
            // not from an arbitrary first symbol or an unused use statement.
            append(RelationKind::Imports, import.span);
        }
    }
    arcs
}
