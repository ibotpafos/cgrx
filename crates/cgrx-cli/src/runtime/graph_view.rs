use std::collections::{BTreeMap, BTreeSet};

use cgrx_core::{EvidenceSelector, Scope};
use serde_json::{Value, json};

use super::{
    Runtime, RuntimeError, StoredArc, StoredDocument, coverage_for_scope, coverage_gap_count,
    coverage_gap_page, definitive_stored_arcs, path_in_scope,
};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum GraphDirection {
    Callers,
    Callees,
    Both,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GraphViewRequest {
    pub symbol: String,
    pub path: Option<String>,
    pub direction: GraphDirection,
    pub depth: u8,
    pub scope: Scope,
    pub node_limit: usize,
    pub edge_limit: usize,
}

impl Runtime {
    pub fn graph_view(&self, request: GraphViewRequest) -> Result<Value, RuntimeError> {
        validate(&request)?;
        let root = resolve_root(self, &request)?;
        let documents = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX" && path_in_scope(&document.path, &request.scope)
            })
            .map(|document| (document.node_id, document))
            .collect::<BTreeMap<_, _>>();
        let arcs = definitive_stored_arcs(&self.stored, &request.scope);
        let mut adjacency = BTreeMap::<u64, Vec<(u64, &'static str, &StoredArc)>>::new();
        for arc in &arcs {
            if matches!(
                request.direction,
                GraphDirection::Callees | GraphDirection::Both
            ) {
                adjacency
                    .entry(arc.source)
                    .or_default()
                    .push((arc.target, "callees", arc));
            }
            if matches!(
                request.direction,
                GraphDirection::Callers | GraphDirection::Both
            ) {
                adjacency
                    .entry(arc.target)
                    .or_default()
                    .push((arc.source, "callers", arc));
            }
        }
        for neighbors in adjacency.values_mut() {
            neighbors.sort_by_key(|(node_id, edge_direction, arc)| {
                let document = documents[node_id];
                (
                    document.path.as_str(),
                    document.span_start,
                    *edge_direction,
                    arc.kind,
                    *node_id,
                )
            });
            neighbors.dedup_by_key(|(node_id, direction, arc)| (*node_id, *direction, arc.kind));
        }

        let mut reached = BTreeMap::from([(root.node_id, (0_u8, "entrypoints"))]);
        let mut traversed = Vec::<&StoredArc>::new();
        let mut frontier = vec![root.node_id];
        for hop in 1..=request.depth {
            let mut next = BTreeSet::new();
            for node_id in &frontier {
                for (neighbor, direction, arc) in adjacency.get(node_id).into_iter().flatten() {
                    traversed.push(*arc);
                    if !reached.contains_key(neighbor) {
                        let document = documents[neighbor];
                        let lane = if is_test_path(&document.path) {
                            "tests"
                        } else {
                            direction
                        };
                        reached.insert(*neighbor, (hop, lane));
                        next.insert(*neighbor);
                    }
                }
            }
            if next.is_empty() {
                break;
            }
            frontier = next.into_iter().collect();
        }

        let mut reached_nodes = reached.into_iter().collect::<Vec<_>>();
        reached_nodes.sort_by_key(|(node_id, (hop, lane))| {
            let document = documents[node_id];
            (
                lane_rank(lane),
                *hop,
                document.path.as_str(),
                document.span_start,
                *node_id,
            )
        });
        let total_nodes = reached_nodes.len();
        reached_nodes.truncate(request.node_limit);
        let included_ids = reached_nodes
            .iter()
            .map(|(node_id, _)| *node_id)
            .collect::<BTreeSet<_>>();

        traversed.sort_by_key(|arc| {
            let evidence = arc.evidence.as_ref().expect("definitive arc evidence");
            (
                evidence.path.as_str(),
                evidence.span.start,
                arc.source,
                arc.target,
                arc.kind,
            )
        });
        traversed.dedup_by_key(|arc| (arc.source, arc.target, arc.kind));
        let total_edges = traversed.len();
        traversed
            .retain(|arc| included_ids.contains(&arc.source) && included_ids.contains(&arc.target));
        traversed.truncate(request.edge_limit);

        let nodes = reached_nodes
            .iter()
            .map(|(node_id, (hop, lane))| {
                let document = documents[node_id];
                node_value(
                    document,
                    &self.stored.path_hashes[&document.path],
                    lane,
                    *hop,
                )
            })
            .collect::<Vec<_>>();
        let edges = traversed
            .into_iter()
            .map(|arc| {
                json!({
                    "source":arc.source,
                    "target":arc.target,
                    "relation":arc.kind,
                    "confidence":"PROVEN",
                    "status":"current",
                    "evidence":arc.evidence
                })
            })
            .collect::<Vec<_>>();
        let containers = nodes
            .iter()
            .filter_map(|node| node["path"].as_str())
            .collect::<BTreeSet<_>>()
            .into_iter()
            .map(|path| json!({"id":format!("file:{path}"),"kind":"file","path":path}))
            .collect::<Vec<_>>();

        let coverage = coverage_for_scope(&self.stored.coverage, &request.scope);
        let gap_count = coverage_gap_count(&coverage);
        let mut gaps = coverage_gap_page(&coverage, 0, 20);
        let node_truncated = total_nodes > request.node_limit;
        let edge_truncated = total_edges > request.edge_limit;
        if node_truncated {
            gaps.push(json!({"code":"GRAPH_NODE_LIMIT"}));
        }
        if edge_truncated {
            gaps.push(json!({"code":"GRAPH_EDGE_LIMIT"}));
        }
        let truncated = node_truncated || edge_truncated;

        Ok(json!({
            "snapshot":self.snapshot(),
            "root":node_value(root, &self.stored.path_hashes[&root.path], "entrypoints", 0),
            "direction":direction_name(request.direction),
            "depth":request.depth,
            "nodes":nodes,
            "edges":edges,
            "containers":containers,
            "total_nodes":total_nodes,
            "total_edges":total_edges,
            "truncated":truncated,
            "partial":truncated || gap_count > 0,
            "coverage_gaps":gaps,
            "coverage_gap_count":gap_count + usize::from(node_truncated) + usize::from(edge_truncated),
            "coverage_gaps_truncated":gap_count > 20
        }))
    }

    pub fn graph_view_with_evidence(
        &self,
        request: GraphViewRequest,
        evidence: EvidenceSelector,
        environments: &[String],
    ) -> Result<Value, RuntimeError> {
        if evidence == EvidenceSelector::Static {
            return self.graph_view(request);
        }
        validate(&request)?;
        let root = resolve_root(self, &request)?;
        let documents = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX" && path_in_scope(&document.path, &request.scope)
            })
            .map(|document| (document.node_id, document))
            .collect::<BTreeMap<_, _>>();
        let selected_environments = environments.iter().collect::<BTreeSet<_>>();
        let mut edges = BTreeMap::<(u64, u64), RuntimeGraphEdge>::new();
        if evidence == EvidenceSelector::All {
            for arc in definitive_stored_arcs(&self.stored, &request.scope) {
                edges
                    .entry((arc.source, arc.target))
                    .or_default()
                    .static_edge = true;
            }
        }
        let observations = self.load_current_observations()?;
        if let Some(snapshot) = observations.as_ref() {
            for edge in &snapshot.edges {
                if (!selected_environments.is_empty()
                    && !selected_environments.contains(&edge.environment))
                    || !documents.contains_key(&edge.source)
                    || !documents.contains_key(&edge.target)
                {
                    continue;
                }
                let aggregate = edges.entry((edge.source, edge.target)).or_default();
                aggregate.count = aggregate.count.saturating_add(edge.count);
                aggregate.first_seen = match aggregate.first_seen {
                    0 => edge.first_seen_unix_nanos,
                    current => current.min(edge.first_seen_unix_nanos),
                };
                aggregate.last_seen = aggregate.last_seen.max(edge.last_seen_unix_nanos);
                aggregate.environments.insert(edge.environment.clone());
            }
        }
        if evidence == EvidenceSelector::Observed {
            edges.retain(|_, edge| edge.count > 0);
        }

        let mut adjacency = BTreeMap::<u64, Vec<(u64, &'static str)>>::new();
        for &(source, target) in edges.keys() {
            if matches!(
                request.direction,
                GraphDirection::Callees | GraphDirection::Both
            ) {
                adjacency
                    .entry(source)
                    .or_default()
                    .push((target, "callees"));
            }
            if matches!(
                request.direction,
                GraphDirection::Callers | GraphDirection::Both
            ) {
                adjacency
                    .entry(target)
                    .or_default()
                    .push((source, "callers"));
            }
        }
        for neighbors in adjacency.values_mut() {
            neighbors.sort_by_key(|(node, direction)| {
                let document = documents[node];
                (&document.path, document.span_start, *direction, *node)
            });
        }
        let mut reached = BTreeMap::from([(root.node_id, (0_u8, "entrypoints"))]);
        let mut frontier = vec![root.node_id];
        for hop in 1..=request.depth {
            let mut next = BTreeSet::new();
            for node in &frontier {
                for (neighbor, direction) in adjacency.get(node).into_iter().flatten() {
                    if !reached.contains_key(neighbor) {
                        let document = documents[neighbor];
                        let lane = if is_test_path(&document.path) {
                            "tests"
                        } else {
                            direction
                        };
                        reached.insert(*neighbor, (hop, lane));
                        next.insert(*neighbor);
                    }
                }
            }
            if next.is_empty() {
                break;
            }
            frontier = next.into_iter().collect();
        }
        let total_nodes = reached.len();
        let mut reached_nodes = reached.into_iter().collect::<Vec<_>>();
        reached_nodes.sort_by_key(|(node, (hop, lane))| {
            let document = documents[node];
            (
                lane_rank(lane),
                *hop,
                document.path.as_str(),
                document.span_start,
                *node,
            )
        });
        reached_nodes.truncate(request.node_limit);
        let included = reached_nodes
            .iter()
            .map(|(node, _)| *node)
            .collect::<BTreeSet<_>>();
        let total_edges = edges
            .keys()
            .filter(|(source, target)| included.contains(source) && included.contains(target))
            .count();
        let edge_values = edges
            .into_iter()
            .filter(|((source, target), _)| included.contains(source) && included.contains(target))
            .take(request.edge_limit)
            .map(|((source, target), edge)| {
                json!({
                    "source":source,
                    "target":target,
                    "relation":"CALLS",
                    "confidence":if edge.static_edge { "PROVEN" } else { "OBSERVED" },
                    "status":if edge.count > 0 { "observed" } else { "current" },
                    "evidence":edge.label(),
                    "count":edge.count,
                    "first_seen_unix_nanos":edge.first_seen,
                    "last_seen_unix_nanos":edge.last_seen,
                    "environments":edge.environments,
                })
            })
            .collect::<Vec<_>>();
        let nodes = reached_nodes
            .iter()
            .map(|(node, (hop, lane))| {
                let document = documents[node];
                node_value(
                    document,
                    &self.stored.path_hashes[&document.path],
                    lane,
                    *hop,
                )
            })
            .collect::<Vec<_>>();
        let containers = nodes
            .iter()
            .filter_map(|node| node["path"].as_str())
            .collect::<BTreeSet<_>>()
            .into_iter()
            .map(|path| json!({"id":format!("file:{path}"),"kind":"file","path":path}))
            .collect::<Vec<_>>();
        let unresolved = observations
            .as_ref()
            .map_or(0, |snapshot| snapshot.unresolved);
        let ambiguous = observations
            .as_ref()
            .map_or(0, |snapshot| snapshot.ambiguous);
        let truncated = total_nodes > request.node_limit || total_edges > request.edge_limit;
        Ok(json!({
            "snapshot":self.snapshot(),
            "root":node_value(root, &self.stored.path_hashes[&root.path], "entrypoints", 0),
            "direction":direction_name(request.direction), "depth":request.depth,
            "evidence":evidence, "environment_filter":environments,
            "nodes":nodes, "edges":edge_values, "containers":containers,
            "total_nodes":total_nodes, "total_edges":total_edges, "truncated":truncated,
            "partial":truncated || unresolved > 0 || ambiguous > 0,
            "runtime_gaps":{"unresolved":unresolved,"ambiguous":ambiguous},
            "coverage_gaps":[], "coverage_gap_count":unresolved + ambiguous,
            "coverage_gaps_truncated":false
        }))
    }
}

#[derive(Default)]
struct RuntimeGraphEdge {
    static_edge: bool,
    count: u64,
    first_seen: u64,
    last_seen: u64,
    environments: BTreeSet<String>,
}

impl RuntimeGraphEdge {
    fn label(&self) -> &'static str {
        match (self.static_edge, self.count > 0) {
            (true, true) => "static+observed",
            (true, false) => "static",
            (false, true) => "observed",
            (false, false) => "unknown",
        }
    }
}

fn validate(request: &GraphViewRequest) -> Result<(), RuntimeError> {
    if request.symbol.trim().is_empty()
        || request
            .path
            .as_ref()
            .is_some_and(|path| path.trim().is_empty())
        || !(1..=4).contains(&request.depth)
        || !(1..=500).contains(&request.node_limit)
        || !(1..=500).contains(&request.edge_limit)
    {
        return Err(RuntimeError::new(
            "cgrx.invalid_arguments",
            "symbol must be non-empty, depth must be 1..4, and graph limits must be 1..500",
        ));
    }
    Ok(())
}

fn resolve_root<'a>(
    runtime: &'a Runtime,
    request: &GraphViewRequest,
) -> Result<&'a StoredDocument, RuntimeError> {
    let mut matches = runtime
        .stored
        .documents
        .iter()
        .filter(|document| {
            document.provenance == "SYNTAX"
                && path_in_scope(&document.path, &request.scope)
                && request
                    .path
                    .as_ref()
                    .is_none_or(|path| path == &document.path)
                && document.qualified_name == request.symbol
        })
        .collect::<Vec<_>>();
    if matches.is_empty() {
        let folded = request.symbol.to_lowercase();
        matches = runtime
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX"
                    && path_in_scope(&document.path, &request.scope)
                    && request
                        .path
                        .as_ref()
                        .is_none_or(|path| path == &document.path)
                    && document.qualified_name.to_lowercase() == folded
            })
            .collect();
    }
    matches.sort_by_key(|document| {
        (
            document.path.as_str(),
            document.span_start,
            document.node_id,
        )
    });
    match matches.as_slice() {
        [] => Err(RuntimeError::new(
            "cgrx.symbol_not_found",
            format!("symbol {} was not found in scope", request.symbol),
        )),
        [root] => Ok(*root),
        _ => Err(RuntimeError::new(
            "cgrx.ambiguous_symbol",
            format!(
                "symbol {} matches multiple definitions; pass path",
                request.symbol
            ),
        )),
    }
}

fn node_value(
    document: &StoredDocument,
    source_hash: &cgrx_core::Hash32,
    lane: &str,
    hop: u8,
) -> Value {
    json!({
        "node_id":document.node_id,
        "symbol":document.qualified_name,
        "path":document.path,
        "span":{"start":document.span_start,"end":document.span_end},
        "source_hash":source_hash,
        "container_id":format!("file:{}", document.path),
        "lane":lane,
        "hop":hop,
        "status":"current"
    })
}

const fn lane_rank(lane: &str) -> u8 {
    match lane.as_bytes() {
        b"callers" => 0,
        b"entrypoints" => 1,
        b"callees" => 2,
        b"tests" => 3,
        _ => 4,
    }
}

fn is_test_path(path: &str) -> bool {
    path.contains("/tests/")
        || path.starts_with("tests/")
        || path.ends_with("_test.go")
        || path.ends_with("_test.py")
        || path.contains(".test.")
        || path.contains(".spec.")
}

const fn direction_name(direction: GraphDirection) -> &'static str {
    match direction {
        GraphDirection::Callers => "callers",
        GraphDirection::Callees => "callees",
        GraphDirection::Both => "both",
    }
}
