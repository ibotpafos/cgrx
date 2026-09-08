use cgrx_core::{EdgeEvidence, Hash32};
use cgrx_languages::Span;
use cgrx_languages::{Edge, RelationKind};
use cgrx_store::{DeltaOverlay, DeltaRecord, FreshnessError};
use std::collections::BTreeMap;
use std::fmt;
use std::path::Path;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GraphEdge {
    pub path: String,
    pub source_hash: Hash32,
    pub semantic_fingerprint: Option<String>,
    pub edge: Edge,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CandidateProvenance {
    Syntax,
    Text,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GraphDocument {
    pub node_id: u64,
    pub qualified_name: String,
    pub path: String,
    pub text: String,
    pub span: Span,
    pub provenance: CandidateProvenance,
    pub semantic_fingerprint: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GraphArc {
    pub source: u64,
    pub target: u64,
    pub kind: cgrx_core::RelationKind,
    pub evidence: EdgeEvidence,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BaseGraph {
    pub generation: u64,
    pub path_hashes: BTreeMap<String, Hash32>,
    pub edges: Vec<GraphEdge>,
    pub documents: Vec<GraphDocument>,
    pub arcs: Vec<GraphArc>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ViewError {
    MixedGeneration { base: u64, overlay: u64 },
    Freshness(FreshnessError),
}

impl fmt::Display for ViewError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MixedGeneration { base, overlay } => {
                write!(
                    formatter,
                    "mixed graph generations: base={base} overlay={overlay}"
                )
            }
            Self::Freshness(error) => error.fmt(formatter),
        }
    }
}

impl std::error::Error for ViewError {}

pub struct SnapshotView<'a> {
    base: &'a BaseGraph,
    overlay: &'a DeltaOverlay,
}

impl<'a> SnapshotView<'a> {
    pub fn new(base: &'a BaseGraph, overlay: &'a DeltaOverlay) -> Result<Self, ViewError> {
        if base.generation != overlay.base_generation() {
            return Err(ViewError::MixedGeneration {
                base: base.generation,
                overlay: overlay.base_generation(),
            });
        }
        Ok(Self { base, overlay })
    }

    pub fn assert_fresh(&self, paths: &[(&Path, Hash32)]) -> Result<(), ViewError> {
        self.overlay
            .assert_fresh(paths)
            .map_err(ViewError::Freshness)?;
        for (path, actual) in paths {
            if self.overlay.is_shadowed(path) {
                continue;
            }
            let normalized = path.to_string_lossy().replace('\\', "/");
            if let Some(expected) = self.base.path_hashes.get(&normalized)
                && expected != actual
            {
                return Err(ViewError::Freshness(FreshnessError::StalePath {
                    path: normalized,
                    expected: *expected,
                    actual: *actual,
                }));
            }
        }
        Ok(())
    }

    pub fn edge_iter(&self, kind: RelationKind) -> std::vec::IntoIter<GraphEdge> {
        let mut merged: Vec<_> = self
            .base
            .edges
            .iter()
            .filter(|edge| edge.edge.relation == kind)
            .filter(|edge| !self.overlay.is_shadowed(Path::new(&edge.path)))
            .cloned()
            .collect();
        merged.extend(self.overlay.records().iter().filter_map(|record| {
            let DeltaRecord::UpsertEdge { key, path, edge } = record else {
                return None;
            };
            let is_current = matches!(
                self.overlay.change(Path::new(path)),
                Some(cgrx_store::PathChange::Active { current, .. })
                    if current == key.source_hash
            );
            (is_current && edge.relation == kind).then(|| GraphEdge {
                path: path.clone(),
                source_hash: key.source_hash,
                semantic_fingerprint: None,
                edge: edge.clone(),
            })
        }));
        merged.sort_by(|left, right| {
            (&left.path, left.edge.span, &left.edge.target).cmp(&(
                &right.path,
                right.edge.span,
                &right.edge.target,
            ))
        });
        merged.into_iter()
    }

    pub fn edges_if_fresh(
        &self,
        kind: RelationKind,
        paths: &[(&Path, Hash32)],
    ) -> Result<std::vec::IntoIter<GraphEdge>, ViewError> {
        self.assert_fresh(paths)?;
        Ok(self.edge_iter(kind))
    }

    #[must_use]
    pub fn documents(&self) -> Vec<GraphDocument> {
        let mut documents: Vec<_> = self
            .base
            .documents
            .iter()
            .filter(|document| !self.overlay.is_shadowed(Path::new(&document.path)))
            .cloned()
            .collect();
        documents.extend(self.overlay.records().iter().filter_map(|record| {
            let DeltaRecord::UpsertNode { key, path, node } = record else {
                return None;
            };
            let is_current = matches!(
                self.overlay.change(Path::new(path)),
                Some(cgrx_store::PathChange::Active { current, .. })
                    if current == key.source_hash
            );
            is_current.then(|| GraphDocument {
                node_id: stable_node_id(path, node.span, &node.name),
                qualified_name: node.name.clone(),
                path: path.clone(),
                text: node.name.clone(),
                span: node.span,
                provenance: CandidateProvenance::Syntax,
                semantic_fingerprint: None,
            })
        }));
        documents.sort_by(|left, right| {
            (&left.path, left.span, left.node_id).cmp(&(&right.path, right.span, right.node_id))
        });
        documents
    }

    #[must_use]
    pub fn arcs(&self) -> &[GraphArc] {
        &self.base.arcs
    }

    pub fn definitive_arcs(&self) -> impl Iterator<Item = &GraphArc> {
        let live_nodes: std::collections::BTreeSet<_> = self
            .documents()
            .into_iter()
            .map(|document| document.node_id)
            .collect();
        self.base.arcs.iter().filter(move |arc| {
            let evidence_path = Path::new(&arc.evidence.path);
            arc.evidence.is_definitive()
                && live_nodes.contains(&arc.source)
                && live_nodes.contains(&arc.target)
                && !self.overlay.is_shadowed(evidence_path)
                && self.base.path_hashes.get(&arc.evidence.path) == Some(&arc.evidence.source_hash)
                && self
                    .base
                    .documents
                    .iter()
                    .find(|document| document.node_id == arc.source)
                    .is_some_and(|document| !self.overlay.is_shadowed(Path::new(&document.path)))
                && self
                    .base
                    .documents
                    .iter()
                    .find(|document| document.node_id == arc.target)
                    .is_some_and(|document| !self.overlay.is_shadowed(Path::new(&document.path)))
        })
    }
}

fn stable_node_id(path: &str, span: Span, name: &str) -> u64 {
    let mut hasher = blake3::Hasher::new();
    hasher.update(path.as_bytes());
    hasher.update(&(span.start as u64).to_le_bytes());
    hasher.update(&(span.end as u64).to_le_bytes());
    hasher.update(name.as_bytes());
    let mut bytes = [0_u8; 8];
    bytes.copy_from_slice(&hasher.finalize().as_bytes()[..8]);
    u64::from_le_bytes(bytes)
}

#[cfg(test)]
mod tests {
    use super::*;
    use cgrx_languages::{Extraction, Provenance, Span};

    fn hash(value: u8) -> Hash32 {
        Hash32([value; 32])
    }

    fn edge(path: &str, source_hash: Hash32, target: &str) -> GraphEdge {
        GraphEdge {
            semantic_fingerprint: None,
            path: path.to_owned(),
            source_hash,
            edge: Edge {
                relation: RelationKind::Calls,
                target: target.to_owned(),
                span: Span { start: 1, end: 9 },
                context_span: Span { start: 1, end: 9 },
                provenance: Provenance::Syntax,
            },
        }
    }

    #[test]
    fn delta_edges_shadow_base_and_stale_fails_before_results() {
        let base = BaseGraph {
            generation: 7,
            path_hashes: BTreeMap::from([("src/main.ts".to_owned(), hash(1))]),
            edges: vec![edge("src/main.ts", hash(1), "old")],
            documents: Vec::new(),
            arcs: Vec::new(),
        };
        let mut overlay = DeltaOverlay::new(7);
        overlay
            .apply(
                Path::new("src/main.ts"),
                hash(1),
                hash(2),
                Extraction {
                    rust_file: None,
                    package_span: None,
                    lexical_arrows: Vec::new(),
                    symbols: Vec::new(),
                    edges: vec![edge("", hash(2), "new").edge],
                    parser_error_ranges: Vec::new(),
                    unresolved: Vec::new(),
                },
            )
            .unwrap();
        let view = SnapshotView::new(&base, &overlay).unwrap();
        assert!(
            view.edges_if_fresh(RelationKind::Calls, &[(Path::new("src/main.ts"), hash(3))],)
                .is_err()
        );
        let edges: Vec<_> = view
            .edges_if_fresh(RelationKind::Calls, &[(Path::new("src/main.ts"), hash(2))])
            .unwrap()
            .collect();
        assert_eq!(edges.len(), 1);
        assert_eq!(edges[0].edge.target, "new");
    }

    #[test]
    fn mixed_generation_is_rejected() {
        let base = BaseGraph {
            generation: 8,
            path_hashes: BTreeMap::new(),
            edges: Vec::new(),
            documents: Vec::new(),
            arcs: Vec::new(),
        };
        assert!(matches!(
            SnapshotView::new(&base, &DeltaOverlay::new(7)),
            Err(ViewError::MixedGeneration { .. })
        ));
    }

    #[test]
    fn latest_delta_for_a_path_wins_without_mutating_history() {
        let base = BaseGraph {
            generation: 7,
            path_hashes: BTreeMap::new(),
            edges: Vec::new(),
            documents: Vec::new(),
            arcs: Vec::new(),
        };
        let mut overlay = DeltaOverlay::new(7);
        for (old, new, target) in [(1, 2, "first"), (2, 3, "second")] {
            overlay
                .apply(
                    Path::new("src/main.ts"),
                    hash(old),
                    hash(new),
                    Extraction {
                        rust_file: None,
                        package_span: None,
                        lexical_arrows: Vec::new(),
                        symbols: Vec::new(),
                        edges: vec![edge("", hash(new), target).edge],
                        parser_error_ranges: Vec::new(),
                        unresolved: Vec::new(),
                    },
                )
                .unwrap();
        }
        let history_len = overlay.records().len();
        let edges: Vec<_> = SnapshotView::new(&base, &overlay)
            .unwrap()
            .edge_iter(RelationKind::Calls)
            .collect();
        assert_eq!(history_len, 6);
        assert_eq!(edges.len(), 1);
        assert_eq!(edges[0].edge.target, "second");
    }
}
