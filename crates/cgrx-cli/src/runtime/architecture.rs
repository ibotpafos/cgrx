use std::collections::{BTreeMap, BTreeSet};

use cgrx_core::Scope;
use serde_json::{Value, json};

use super::{
    Runtime, RuntimeError, coverage_for_scope, coverage_gap_count, coverage_gap_page,
    definitive_stored_arcs, path_in_scope,
};

#[derive(Default)]
struct PackageStats {
    files: BTreeSet<String>,
    symbols: usize,
    fan_in: usize,
    fan_out: usize,
}

impl Runtime {
    pub fn get_architecture(
        &self,
        scope: &Scope,
        package_depth: usize,
        limit: usize,
    ) -> Result<Value, RuntimeError> {
        if !(1..=4).contains(&package_depth) || !(1..=100).contains(&limit) {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "package_depth must be 1..4; limit must be 1..100",
            ));
        }

        let documents = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX" && path_in_scope(&document.path, scope)
            })
            .map(|document| (document.node_id, document))
            .collect::<BTreeMap<_, _>>();
        let mut package_by_node = BTreeMap::new();
        let mut package_stats = BTreeMap::<String, PackageStats>::new();
        for document in documents.values() {
            let package = package_name(&document.path, package_depth);
            package_by_node.insert(document.node_id, package.clone());
            let stats = package_stats.entry(package).or_default();
            stats.files.insert(document.path.clone());
            stats.symbols += 1;
        }

        let arcs = definitive_stored_arcs(&self.stored, scope);
        let mut incoming = BTreeMap::<u64, usize>::new();
        let mut boundaries = BTreeMap::<(String, String), Vec<_>>::new();
        let mut package_adjacency = BTreeMap::<String, BTreeSet<String>>::new();
        for arc in arcs {
            *incoming.entry(arc.target).or_default() += 1;
            let Some(source_package) = package_by_node.get(&arc.source) else {
                continue;
            };
            let Some(target_package) = package_by_node.get(&arc.target) else {
                continue;
            };
            if source_package == target_package {
                continue;
            }
            package_stats
                .get_mut(source_package)
                .expect("source package")
                .fan_out += 1;
            package_stats
                .get_mut(target_package)
                .expect("target package")
                .fan_in += 1;
            package_adjacency
                .entry(source_package.clone())
                .or_default()
                .insert(target_package.clone());
            boundaries
                .entry((source_package.clone(), target_package.clone()))
                .or_default()
                .push(arc);
        }

        let total_packages = package_stats.len();
        let visible_package_names = package_stats
            .keys()
            .take(limit)
            .cloned()
            .collect::<BTreeSet<_>>();
        let packages = visible_package_names
            .iter()
            .map(|name| {
                let stats = package_stats.get(name).expect("visible package");
                json!({
                    "name":name,
                    "files":stats.files.len(),
                    "symbols":stats.symbols,
                    "fan_in":stats.fan_in,
                    "fan_out":stats.fan_out
                })
            })
            .collect::<Vec<_>>();

        let total_boundaries = boundaries.len();
        let boundary_values = boundaries
            .into_iter()
            .filter(|((source, target), _)| {
                visible_package_names.contains(source) && visible_package_names.contains(target)
            })
            .take(limit)
            .map(|((source, target), arcs)| {
                let relations = arcs.iter().map(|arc| arc.kind).collect::<BTreeSet<_>>();
                let evidence = arcs
                    .iter()
                    .filter_map(|arc| arc.evidence.as_ref())
                    .take(8)
                    .collect::<Vec<_>>();
                json!({
                    "source":source,
                    "target":target,
                    "edges":arcs.len(),
                    "relations":relations,
                    "confidence":"PROVEN",
                    "evidence":evidence,
                    "evidence_truncated":arcs.len() > 8
                })
            })
            .collect::<Vec<_>>();

        let mut hotspot_rows = incoming
            .into_iter()
            .filter_map(|(node_id, fan_in)| documents.get(&node_id).map(|doc| (doc, fan_in)))
            .collect::<Vec<_>>();
        hotspot_rows.sort_by_key(|(document, fan_in)| {
            (
                std::cmp::Reverse(*fan_in),
                document.path.as_str(),
                document.span_start,
                document.node_id,
            )
        });
        let total_hotspots = hotspot_rows.len();
        let hotspots = hotspot_rows
            .into_iter()
            .take(limit)
            .map(|(document, fan_in)| {
                json!({
                    "node_id":document.node_id,
                    "symbol":document.qualified_name,
                    "path":document.path,
                    "fan_in":fan_in
                })
            })
            .collect::<Vec<_>>();

        let package_names = package_stats.keys().cloned().collect::<BTreeSet<_>>();
        let mut cycles = strongly_connected_components(&package_names, &package_adjacency)
            .into_iter()
            .filter(|component| component.len() > 1)
            .map(|packages| json!({"packages":packages,"kind":"PACKAGE_CALL_CYCLE"}))
            .collect::<Vec<_>>();
        cycles.sort_by_key(|cycle| cycle["packages"].to_string());
        let total_cycles = cycles.len();
        cycles.truncate(limit);

        let mut undirected = BTreeMap::<String, BTreeSet<String>>::new();
        for (source, targets) in &package_adjacency {
            for target in targets {
                undirected
                    .entry(source.clone())
                    .or_default()
                    .insert(target.clone());
                undirected
                    .entry(target.clone())
                    .or_default()
                    .insert(source.clone());
            }
        }
        let mut communities = connected_components(&package_names, &undirected)
            .into_iter()
            .map(|packages| json!({"packages":packages,"method":"DETERMINISTIC_WEAK_COMPONENT"}))
            .collect::<Vec<_>>();
        communities.sort_by(|left, right| {
            let left_items = left["packages"].as_array().expect("packages");
            let right_items = right["packages"].as_array().expect("packages");
            right_items.len().cmp(&left_items.len()).then_with(|| {
                left["packages"]
                    .to_string()
                    .cmp(&right["packages"].to_string())
            })
        });
        let total_communities = communities.len();
        communities.truncate(limit);

        let coverage = coverage_for_scope(&self.stored.coverage, scope);
        let coverage_gap_count = coverage_gap_count(&coverage);
        let packages_truncated = total_packages > limit;
        let boundaries_truncated = total_boundaries > boundary_values.len();
        let hotspots_truncated = total_hotspots > limit;
        let cycles_truncated = total_cycles > limit;
        let communities_truncated = total_communities > limit;
        let truncated = packages_truncated
            || boundaries_truncated
            || hotspots_truncated
            || cycles_truncated
            || communities_truncated;
        let mut gaps = coverage_gap_page(&coverage, 0, 20);
        if truncated {
            gaps.push(json!({"code":"ARCHITECTURE_RESULT_LIMIT"}));
        }

        Ok(json!({
            "snapshot":self.snapshot(),
            "package_depth":package_depth,
            "relation_kinds":["CALLS","IMPLEMENTS"],
            "packages":packages,
            "boundaries":boundary_values,
            "hotspots":hotspots,
            "cycles":cycles,
            "communities":communities,
            "totals":{
                "packages":total_packages,
                "boundaries":total_boundaries,
                "hotspots":total_hotspots,
                "cycles":total_cycles,
                "communities":total_communities
            },
            "truncated":truncated,
            "partial":truncated || coverage_gap_count > 0,
            "coverage_gaps":gaps,
            "coverage_gap_count":coverage_gap_count + usize::from(truncated),
            "coverage_gaps_truncated":coverage_gap_count > 20,
            "limitations":[
                "Architecture currently uses proven CALLS and IMPLEMENTS relationships.",
                "Communities are deterministic weakly connected package components, not semantic clusters.",
                "Missing or unresolved relationships remain coverage gaps, not absent dependencies."
            ]
        }))
    }
}

fn package_name(path: &str, depth: usize) -> String {
    let components = path.split('/').collect::<Vec<_>>();
    if components.len() <= 1 {
        return ".".to_owned();
    }
    components[..depth.min(components.len() - 1)].join("/")
}

fn strongly_connected_components(
    nodes: &BTreeSet<String>,
    adjacency: &BTreeMap<String, BTreeSet<String>>,
) -> Vec<Vec<String>> {
    fn visit(
        node: &str,
        adjacency: &BTreeMap<String, BTreeSet<String>>,
        visited: &mut BTreeSet<String>,
        order: &mut Vec<String>,
    ) {
        if !visited.insert(node.to_owned()) {
            return;
        }
        for next in adjacency.get(node).into_iter().flatten() {
            visit(next, adjacency, visited, order);
        }
        order.push(node.to_owned());
    }
    let mut order = Vec::new();
    let mut visited = BTreeSet::new();
    for node in nodes {
        visit(node, adjacency, &mut visited, &mut order);
    }
    let mut reverse = BTreeMap::<String, BTreeSet<String>>::new();
    for (source, targets) in adjacency {
        for target in targets {
            reverse
                .entry(target.clone())
                .or_default()
                .insert(source.clone());
        }
    }
    visited.clear();
    let mut components = Vec::new();
    for node in order.into_iter().rev() {
        if visited.contains(&node) {
            continue;
        }
        let mut component = Vec::new();
        collect_component(&node, &reverse, &mut visited, &mut component);
        component.sort();
        components.push(component);
    }
    components
}

fn connected_components(
    nodes: &BTreeSet<String>,
    adjacency: &BTreeMap<String, BTreeSet<String>>,
) -> Vec<Vec<String>> {
    let mut visited = BTreeSet::new();
    let mut components = Vec::new();
    for node in nodes {
        if visited.contains(node) {
            continue;
        }
        let mut component = Vec::new();
        collect_component(node, adjacency, &mut visited, &mut component);
        component.sort();
        components.push(component);
    }
    components
}

fn collect_component(
    node: &str,
    adjacency: &BTreeMap<String, BTreeSet<String>>,
    visited: &mut BTreeSet<String>,
    component: &mut Vec<String>,
) {
    if !visited.insert(node.to_owned()) {
        return;
    }
    component.push(node.to_owned());
    for next in adjacency.get(node).into_iter().flatten() {
        collect_component(next, adjacency, visited, component);
    }
}
