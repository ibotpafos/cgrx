use std::collections::{BTreeMap, BTreeSet};

use cgrx_core::{ByteRange, ConfidenceClass, EdgeEvidence, Hash32, ResolverClass, Scope};
use serde_json::{Value, json};

use super::{
    Runtime, RuntimeError, coverage_for_scope, coverage_gap_count, coverage_gap_page,
    definitive_stored_arcs, go_module_for, path_in_scope, ts_config_modules,
};

#[derive(Default)]
struct PackageStats {
    files: BTreeSet<String>,
    symbols: usize,
    fan_in: usize,
    fan_out: usize,
}

#[derive(Default)]
struct BoundaryStats {
    edges: usize,
    relations: BTreeSet<String>,
    evidence: Vec<Value>,
}

struct SemanticCommunity<T> {
    members: Vec<T>,
    internal_weight: u64,
    cut_weight: u64,
    cohesion: f64,
}

struct CommunityDetection<T> {
    communities: Vec<SemanticCommunity<T>>,
    modularity: f64,
    iterations: usize,
}

enum ImportResolution {
    Proven(String),
    External,
    UnresolvedLocal,
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
        for path in self
            .stored
            .path_hashes
            .keys()
            .filter(|path| supported_source_path(path) && path_in_scope(path, scope))
        {
            package_stats
                .entry(package_name(path, package_depth))
                .or_default()
                .files
                .insert(path.clone());
        }
        for document in documents.values() {
            let package = package_name(&document.path, package_depth);
            package_by_node.insert(document.node_id, package.clone());
            let stats = package_stats.entry(package).or_default();
            stats.symbols += 1;
        }

        let arcs = definitive_stored_arcs(&self.stored, scope);
        let mut incoming = BTreeMap::<u64, usize>::new();
        let mut boundaries = BTreeMap::<(String, String), BoundaryStats>::new();
        let mut package_adjacency = BTreeMap::<String, BTreeSet<String>>::new();
        let mut semantic_adjacency = BTreeMap::<String, BTreeMap<String, u64>>::new();
        let mut symbol_adjacency = BTreeMap::<u64, BTreeMap<u64, u64>>::new();
        let mut symbol_edge_types = BTreeMap::<(u64, u64), BTreeSet<String>>::new();
        for arc in arcs {
            *incoming.entry(arc.target).or_default() += 1;
            let (relation, semantic_weight) = match arc.kind {
                cgrx_core::RelationKind::Calls => ("CALLS", 4),
                cgrx_core::RelationKind::Implements => ("IMPLEMENTS", 4),
            };
            if documents.contains_key(&arc.source) && documents.contains_key(&arc.target) {
                add_semantic_edge(
                    &mut symbol_adjacency,
                    &arc.source,
                    &arc.target,
                    semantic_weight,
                );
                symbol_edge_types
                    .entry((arc.source.min(arc.target), arc.source.max(arc.target)))
                    .or_default()
                    .insert(relation.to_owned());
            }
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
            add_semantic_edge(
                &mut semantic_adjacency,
                source_package,
                target_package,
                semantic_weight,
            );
            let boundary = boundaries
                .entry((source_package.clone(), target_package.clone()))
                .or_default();
            boundary.edges += 1;
            boundary.relations.insert(relation.to_owned());
            if boundary.evidence.len() < 8
                && let Some(evidence) = arc.evidence.as_ref()
            {
                boundary
                    .evidence
                    .push(serde_json::to_value(evidence).expect("serialize edge evidence"));
            }
        }

        let ts_files = self
            .stored
            .ts_files
            .iter()
            .filter(|(path, facts)| {
                !facts.inventory_only
                    && self.stored.path_hashes.get(*path) == Some(&facts.source_hash)
            })
            .map(|(path, facts)| (path.clone(), facts.facts.clone()))
            .collect::<BTreeMap<_, _>>();
        let ts_modules =
            ts_config_modules(&self.stored.ts_files, &self.stored.ts_resolution_configs);
        let mut proven_imports = 0usize;
        let mut external_imports = 0usize;
        let mut out_of_scope_imports = 0usize;
        let mut unresolved_imports = Vec::new();
        for import in self.stored.documents.iter().filter(|document| {
            document.provenance == "IMPORTS" && path_in_scope(&document.path, scope)
        }) {
            for specifier in import_specifiers(&import.path, &import.text) {
                let resolution = resolve_import(
                    &import.path,
                    &specifier,
                    &self.stored.path_hashes,
                    &self.stored.go_modules,
                    &self.stored.cargo_manifests,
                    &ts_files,
                    &ts_modules,
                );
                let target_path = match resolution {
                    ImportResolution::Proven(path) if path_in_scope(&path, scope) => path,
                    ImportResolution::Proven(_) => {
                        out_of_scope_imports += 1;
                        continue;
                    }
                    ImportResolution::External => {
                        external_imports += 1;
                        continue;
                    }
                    ImportResolution::UnresolvedLocal => {
                        unresolved_imports.push(json!({
                            "code":"UNRESOLVED_LOCAL_IMPORT",
                            "path":import.path,
                            "span":{"start":import.span_start,"end":import.span_end}
                        }));
                        continue;
                    }
                };
                let source_package = package_name(&import.path, package_depth);
                let target_package = package_name(&target_path, package_depth);
                if source_package == target_package {
                    proven_imports += 1;
                    continue;
                }
                let Some(source_stats) = package_stats.get_mut(&source_package) else {
                    continue;
                };
                source_stats.fan_out += 1;
                let Some(target_stats) = package_stats.get_mut(&target_package) else {
                    continue;
                };
                target_stats.fan_in += 1;
                package_adjacency
                    .entry(source_package.clone())
                    .or_default()
                    .insert(target_package.clone());
                add_semantic_edge(&mut semantic_adjacency, &source_package, &target_package, 2);
                let boundary = boundaries
                    .entry((source_package, target_package))
                    .or_default();
                boundary.edges += 1;
                boundary.relations.insert("IMPORTS".to_owned());
                if boundary.evidence.len() < 8 {
                    let evidence = EdgeEvidence {
                        path: import.path.clone(),
                        span: ByteRange::new(import.span_start, import.span_end),
                        source_hash: self.stored.path_hashes[&import.path],
                        resolver: ResolverClass::ImportExact,
                        confidence: ConfidenceClass::Proven,
                        assumptions: Vec::new(),
                        counter_evidence: Vec::new(),
                    };
                    boundary
                        .evidence
                        .push(serde_json::to_value(evidence).expect("serialize import evidence"));
                }
                proven_imports += 1;
            }
        }

        let mut proven_references = 0usize;
        let mut external_references = 0usize;
        let mut out_of_scope_references = 0usize;
        let mut unresolved_references = Vec::new();
        for reference in self.stored.documents.iter().filter(|document| {
            document.provenance == "REFERENCES" && path_in_scope(&document.path, scope)
        }) {
            let resolution = resolve_import(
                &reference.path,
                &reference.qualified_name,
                &self.stored.path_hashes,
                &self.stored.go_modules,
                &self.stored.cargo_manifests,
                &ts_files,
                &ts_modules,
            );
            let target_path = match resolution {
                ImportResolution::Proven(path) if path_in_scope(&path, scope) => path,
                ImportResolution::Proven(_) => {
                    out_of_scope_references += 1;
                    continue;
                }
                ImportResolution::External => {
                    external_references += 1;
                    continue;
                }
                ImportResolution::UnresolvedLocal => {
                    unresolved_references.push(json!({
                        "code":"UNRESOLVED_LOCAL_REFERENCE",
                        "path":reference.path,
                        "span":{"start":reference.span_start,"end":reference.span_end}
                    }));
                    continue;
                }
            };
            let source_package = package_name(&reference.path, package_depth);
            let target_package = package_name(&target_path, package_depth);
            if source_package == target_package {
                proven_references += 1;
                continue;
            }
            let Some(source_stats) = package_stats.get_mut(&source_package) else {
                continue;
            };
            source_stats.fan_out += 1;
            let Some(target_stats) = package_stats.get_mut(&target_package) else {
                continue;
            };
            target_stats.fan_in += 1;
            package_adjacency
                .entry(source_package.clone())
                .or_default()
                .insert(target_package.clone());
            add_semantic_edge(&mut semantic_adjacency, &source_package, &target_package, 1);
            let boundary = boundaries
                .entry((source_package, target_package))
                .or_default();
            boundary.edges += 1;
            boundary.relations.insert("REFERENCES".to_owned());
            if boundary.evidence.len() < 8 {
                let evidence = EdgeEvidence {
                    path: reference.path.clone(),
                    span: ByteRange::new(reference.span_start, reference.span_end),
                    source_hash: self.stored.path_hashes[&reference.path],
                    resolver: ResolverClass::TypeExact,
                    confidence: ConfidenceClass::Proven,
                    assumptions: Vec::new(),
                    counter_evidence: Vec::new(),
                };
                boundary
                    .evidence
                    .push(serde_json::to_value(evidence).expect("serialize reference evidence"));
            }
            proven_references += 1;
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
            .map(|((source, target), boundary)| {
                json!({
                    "source":source,
                    "target":target,
                    "edges":boundary.edges,
                    "relations":boundary.relations,
                    "confidence":"PROVEN",
                    "evidence":boundary.evidence,
                    "evidence_truncated":boundary.edges > 8
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
            .map(|packages| json!({"packages":packages,"kind":"PACKAGE_DEPENDENCY_CYCLE"}))
            .collect::<Vec<_>>();
        cycles.sort_by_key(|cycle| cycle["packages"].to_string());
        let total_cycles = cycles.len();
        cycles.truncate(limit);

        let community_detection = detect_semantic_communities(&package_names, &semantic_adjacency);
        let community_modularity = community_detection.modularity;
        let community_iterations = community_detection.iterations;
        let mut communities = community_detection
            .communities
            .into_iter()
            .map(|community| {
                json!({
                    "packages":community.members,
                    "method":"DETERMINISTIC_WEIGHTED_MODULARITY",
                    "internal_weight":community.internal_weight,
                    "cut_weight":community.cut_weight,
                    "cohesion":community.cohesion
                })
            })
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

        let symbol_nodes = documents.keys().copied().collect::<BTreeSet<_>>();
        let symbol_detection = detect_semantic_communities(&symbol_nodes, &symbol_adjacency);
        let symbol_modularity = symbol_detection.modularity;
        let symbol_iterations = symbol_detection.iterations;
        let mut clustered_symbol_count = 0usize;
        let mut symbol_communities = symbol_detection
            .communities
            .into_iter()
            .filter(|community| community.internal_weight > 0)
            .map(|community| {
                clustered_symbol_count += community.members.len();
                let member_set = community.members.iter().copied().collect::<BTreeSet<_>>();
                let mut edge_types = BTreeSet::new();
                for source in &community.members {
                    for target in symbol_adjacency
                        .get(source)
                        .into_iter()
                        .flatten()
                        .map(|(target, _)| target)
                    {
                        if source < target && member_set.contains(target) {
                            edge_types.extend(
                                symbol_edge_types
                                    .get(&(*source, *target))
                                    .into_iter()
                                    .flatten()
                                    .cloned(),
                            );
                        }
                    }
                }
                let packages = community
                    .members
                    .iter()
                    .map(|node_id| package_by_node[node_id].clone())
                    .collect::<BTreeSet<_>>();
                let mut ranked = community
                    .members
                    .iter()
                    .map(|node_id| {
                        let document = documents[node_id];
                        let weighted_degree = symbol_adjacency
                            .get(node_id)
                            .into_iter()
                            .flatten()
                            .map(|(_, weight)| *weight)
                            .sum::<u64>();
                        (document, weighted_degree)
                    })
                    .collect::<Vec<_>>();
                ranked.sort_by_key(|(document, weighted_degree)| {
                    (
                        std::cmp::Reverse(*weighted_degree),
                        document.path.as_str(),
                        document.span_start,
                        document.node_id,
                    )
                });
                let label = ranked
                    .first()
                    .map(|(document, _)| document.qualified_name.clone())
                    .unwrap_or_default();
                let top_nodes = ranked
                    .into_iter()
                    .take(5)
                    .map(|(document, weighted_degree)| {
                        json!({
                            "node_id":document.node_id,
                            "symbol":document.qualified_name,
                            "path":document.path,
                            "weighted_degree":weighted_degree
                        })
                    })
                    .collect::<Vec<_>>();
                json!({
                    "label":label,
                    "members":community.members.len(),
                    "packages":packages,
                    "edge_types":edge_types,
                    "internal_weight":community.internal_weight,
                    "cut_weight":community.cut_weight,
                    "cohesion":community.cohesion,
                    "top_nodes":top_nodes
                })
            })
            .collect::<Vec<_>>();
        symbol_communities.sort_by(|left, right| {
            right["members"]
                .as_u64()
                .cmp(&left["members"].as_u64())
                .then_with(|| left["label"].as_str().cmp(&right["label"].as_str()))
        });
        let total_symbol_communities = symbol_communities.len();
        let unclustered_symbols = documents.len().saturating_sub(clustered_symbol_count);
        symbol_communities.truncate(limit);

        let coverage = coverage_for_scope(&self.stored.coverage, scope);
        let coverage_gap_count = coverage_gap_count(&coverage);
        let unresolved_import_count = unresolved_imports.len();
        let unresolved_reference_count = unresolved_references.len();
        let packages_truncated = total_packages > limit;
        let boundaries_truncated = total_boundaries > boundary_values.len();
        let hotspots_truncated = total_hotspots > limit;
        let cycles_truncated = total_cycles > limit;
        let communities_truncated = total_communities > limit;
        let symbol_communities_truncated = total_symbol_communities > limit;
        let truncated = packages_truncated
            || boundaries_truncated
            || hotspots_truncated
            || cycles_truncated
            || communities_truncated
            || symbol_communities_truncated;
        let mut gaps = coverage_gap_page(&coverage, 0, 20);
        gaps.extend(
            unresolved_imports
                .into_iter()
                .take(20usize.saturating_sub(gaps.len())),
        );
        gaps.extend(
            unresolved_references
                .into_iter()
                .take(20usize.saturating_sub(gaps.len())),
        );
        if truncated {
            gaps.push(json!({"code":"ARCHITECTURE_RESULT_LIMIT"}));
        }

        Ok(json!({
            "snapshot":self.snapshot(),
            "package_depth":package_depth,
            "relation_kinds":["CALLS","IMPLEMENTS","IMPORTS","REFERENCES"],
            "packages":packages,
            "boundaries":boundary_values,
            "hotspots":hotspots,
            "cycles":cycles,
            "communities":communities,
            "community_detection":{
                "method":"DETERMINISTIC_WEIGHTED_MODULARITY",
                "relation_weights":{"CALLS":4,"IMPLEMENTS":4,"IMPORTS":2,"REFERENCES":1},
                "modularity":community_modularity,
                "iterations":community_iterations
            },
            "symbol_communities":symbol_communities,
            "symbol_community_detection":{
                "method":"DETERMINISTIC_WEIGHTED_MODULARITY",
                "relation_weights":{"CALLS":4,"IMPLEMENTS":4},
                "modularity":symbol_modularity,
                "iterations":symbol_iterations,
                "unclustered_symbols":unclustered_symbols
            },
            "totals":{
                "packages":total_packages,
                "boundaries":total_boundaries,
                "hotspots":total_hotspots,
                "cycles":total_cycles,
                "communities":total_communities,
                "symbol_communities":total_symbol_communities
            },
            "import_resolution":{
                "proven":proven_imports,
                "external":external_imports,
                "out_of_scope":out_of_scope_imports,
                "unresolved_local":unresolved_import_count
            },
            "reference_resolution":{
                "proven":proven_references,
                "external":external_references,
                "out_of_scope":out_of_scope_references,
                "unresolved_local":unresolved_reference_count
            },
            "truncated":truncated,
            "partial":truncated || coverage_gap_count > 0 || unresolved_import_count > 0 || unresolved_reference_count > 0,
            "coverage_gaps":gaps,
            "coverage_gap_count":coverage_gap_count + unresolved_import_count + unresolved_reference_count + usize::from(truncated),
            "coverage_gaps_truncated":coverage_gap_count + unresolved_import_count + unresolved_reference_count > 20,
            "limitations":[
                "Architecture uses proven CALLS, IMPLEMENTS, unambiguous repository-local IMPORTS and conservative static REFERENCES relationships.",
                "External imports are counted but omitted from the repository graph.",
                "REFERENCES currently covers imported type or qualified symbol usage and omits calls and unqualified dynamic names.",
                "Communities use deterministic weighted modularity over proven package relationships; weights are heuristic and reported in community_detection.",
                "Symbol communities use proven CALLS and IMPLEMENTS only; unconnected or unresolved symbols are counted as unclustered instead of guessed into a cluster.",
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

fn supported_source_path(path: &str) -> bool {
    matches!(
        std::path::Path::new(path)
            .extension()
            .and_then(|extension| extension.to_str()),
        Some("rs" | "go" | "ts" | "tsx" | "py")
    )
}

fn import_specifiers(path: &str, source: &str) -> Vec<String> {
    if path.ends_with(".py") {
        let source = source.trim();
        if let Some(rest) = source.strip_prefix("from ") {
            return rest
                .split_whitespace()
                .next()
                .map(|module| vec![module.to_owned()])
                .unwrap_or_default();
        }
        if let Some(rest) = source.strip_prefix("import ") {
            return rest
                .split(',')
                .filter_map(|item| item.split_whitespace().next())
                .map(str::to_owned)
                .collect();
        }
        return Vec::new();
    }
    if path.ends_with(".rs") {
        return source
            .trim()
            .strip_prefix("use ")
            .and_then(|value| value.strip_suffix(';'))
            .map(|value| vec![value.trim().to_owned()])
            .unwrap_or_default();
    }
    quoted_strings(source)
}

fn quoted_strings(source: &str) -> Vec<String> {
    let bytes = source.as_bytes();
    let mut values = Vec::new();
    let mut index = 0;
    while index < bytes.len() {
        let quote = bytes[index];
        if !matches!(quote, b'\'' | b'"' | b'`') {
            index += 1;
            continue;
        }
        let start = index + 1;
        index = start;
        while index < bytes.len() && bytes[index] != quote {
            if bytes[index] == b'\\' {
                index += 1;
            }
            index += 1;
        }
        if index < bytes.len() {
            values.push(source[start..index].to_owned());
            index += 1;
        }
    }
    values
}

fn resolve_import(
    source_path: &str,
    specifier: &str,
    paths: &BTreeMap<String, Hash32>,
    go_modules: &BTreeMap<String, String>,
    cargo_manifests: &BTreeMap<String, String>,
    ts_files: &BTreeMap<String, cgrx_languages::ts_imports::TsFileFacts>,
    ts_modules: &BTreeMap<(String, String), String>,
) -> ImportResolution {
    if source_path.ends_with(".ts") || source_path.ends_with(".tsx") {
        let local = specifier.starts_with('.')
            || ts_modules.contains_key(&(source_path.to_owned(), specifier.to_owned()));
        if !local {
            return ImportResolution::External;
        }
        return cgrx_languages::ts_imports::resolve_module_path(
            ts_files,
            source_path,
            specifier,
            ts_modules,
        )
        .map_or(ImportResolution::UnresolvedLocal, ImportResolution::Proven);
    }
    if source_path.ends_with(".go") {
        let Some((module_dir, module_name)) = go_module_for(source_path, go_modules) else {
            return ImportResolution::External;
        };
        let Some(suffix) = specifier
            .strip_prefix(module_name)
            .and_then(|value| value.strip_prefix('/'))
        else {
            return ImportResolution::External;
        };
        if module_name.is_empty()
            || suffix
                .split('/')
                .any(|part| part.is_empty() || matches!(part, "." | ".."))
        {
            return ImportResolution::UnresolvedLocal;
        }
        let directory = if module_dir.is_empty() {
            suffix.to_owned()
        } else {
            format!("{module_dir}/{suffix}")
        };
        return paths
            .keys()
            .find(|path| {
                path.ends_with(".go")
                    && std::path::Path::new(path).parent() == Some(std::path::Path::new(&directory))
            })
            .cloned()
            .map_or(ImportResolution::UnresolvedLocal, ImportResolution::Proven);
    }
    if source_path.ends_with(".py") {
        return resolve_python_import(source_path, specifier, paths);
    }
    if source_path.ends_with(".rs") {
        return resolve_rust_import(source_path, specifier, paths, cargo_manifests);
    }
    ImportResolution::External
}

fn resolve_python_import(
    source_path: &str,
    specifier: &str,
    paths: &BTreeMap<String, Hash32>,
) -> ImportResolution {
    let leading = specifier.bytes().take_while(|byte| *byte == b'.').count();
    let module = &specifier[leading..];
    let mut base = if leading == 0 {
        Vec::new()
    } else {
        let mut parts = source_path.split('/').collect::<Vec<_>>();
        parts.pop();
        for _ in 1..leading {
            if parts.pop().is_none() {
                return ImportResolution::UnresolvedLocal;
            }
        }
        parts
    };
    base.extend(module.split('.').filter(|part| !part.is_empty()));
    let joined = base.join("/");
    let candidates = [format!("{joined}.py"), format!("{joined}/__init__.py")]
        .into_iter()
        .filter(|path| paths.contains_key(path))
        .collect::<Vec<_>>();
    if let [path] = candidates.as_slice() {
        return ImportResolution::Proven(path.clone());
    }
    if leading > 0
        || module.split('.').next().is_some_and(|root| {
            paths.contains_key(&format!("{root}.py"))
                || paths
                    .keys()
                    .any(|path| path.starts_with(&format!("{root}/")))
        })
    {
        ImportResolution::UnresolvedLocal
    } else {
        ImportResolution::External
    }
}

fn resolve_rust_import(
    source_path: &str,
    specifier: &str,
    paths: &BTreeMap<String, Hash32>,
    cargo_manifests: &BTreeMap<String, String>,
) -> ImportResolution {
    if specifier.contains(['{', '}', '*']) {
        return if specifier.starts_with("crate::")
            || specifier.starts_with("self::")
            || specifier.starts_with("super::")
        {
            ImportResolution::UnresolvedLocal
        } else {
            ImportResolution::External
        };
    }
    let parts = specifier.split("::").collect::<Vec<_>>();
    let Some(root) = parts.first().copied() else {
        return ImportResolution::External;
    };
    if !matches!(root, "crate" | "self" | "super") {
        return ImportResolution::External;
    }
    let source_parent = std::path::Path::new(source_path)
        .parent()
        .unwrap_or(std::path::Path::new(""));
    let mut base = match root {
        "crate" => {
            let manifest = cargo_manifests
                .keys()
                .filter(|directory| {
                    directory.is_empty() || std::path::Path::new(source_path).starts_with(directory)
                })
                .max_by_key(|directory| directory.len());
            let Some(manifest) = manifest else {
                return ImportResolution::UnresolvedLocal;
            };
            std::path::Path::new(manifest).join("src")
        }
        "self" => source_parent.to_path_buf(),
        "super" => source_parent
            .parent()
            .unwrap_or(std::path::Path::new(""))
            .to_path_buf(),
        _ => unreachable!(),
    };
    for part in &parts[1..] {
        if part.is_empty() || matches!(*part, "." | "..") {
            return ImportResolution::UnresolvedLocal;
        }
        base.push(part);
    }
    let mut candidates = Vec::new();
    for candidate_base in [base.clone(), base.parent().unwrap_or(&base).to_path_buf()] {
        for candidate in [
            candidate_base.with_extension("rs"),
            candidate_base.join("mod.rs"),
        ] {
            let candidate = candidate.to_string_lossy().replace('\\', "/");
            if paths.contains_key(&candidate) {
                candidates.push(candidate);
            }
        }
    }
    candidates.sort();
    candidates.dedup();
    match candidates.as_slice() {
        [path] => ImportResolution::Proven(path.clone()),
        _ => ImportResolution::UnresolvedLocal,
    }
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

fn add_semantic_edge<T: Ord + Clone>(
    adjacency: &mut BTreeMap<T, BTreeMap<T, u64>>,
    source: &T,
    target: &T,
    weight: u64,
) {
    if source == target || weight == 0 {
        return;
    }
    *adjacency
        .entry(source.clone())
        .or_default()
        .entry(target.clone())
        .or_default() += weight;
    *adjacency
        .entry(target.clone())
        .or_default()
        .entry(source.clone())
        .or_default() += weight;
}

fn detect_semantic_communities<T: Ord + Clone>(
    nodes: &BTreeSet<T>,
    adjacency: &BTreeMap<T, BTreeMap<T, u64>>,
) -> CommunityDetection<T> {
    let degrees = nodes
        .iter()
        .map(|node| {
            let degree = adjacency
                .get(node)
                .into_iter()
                .flatten()
                .map(|(_, weight)| *weight)
                .sum::<u64>();
            (node.clone(), degree)
        })
        .collect::<BTreeMap<_, _>>();
    let total_degree = degrees.values().sum::<u64>();
    let mut labels = nodes
        .iter()
        .enumerate()
        .map(|(index, node)| (node.clone(), index))
        .collect::<BTreeMap<_, _>>();
    let mut totals = labels
        .iter()
        .map(|(node, label)| (*label, degrees[node]))
        .collect::<BTreeMap<_, _>>();
    let mut iterations = 0usize;

    if total_degree > 0 {
        for _ in 0..20 {
            iterations += 1;
            let mut moved = false;
            for node in nodes {
                let degree = degrees[node];
                if degree == 0 {
                    continue;
                }
                let current = labels[node];
                *totals.get_mut(&current).expect("current community") -= degree;
                let mut weights_by_community = BTreeMap::<usize, u64>::new();
                for (neighbor, weight) in adjacency.get(node).into_iter().flatten() {
                    *weights_by_community.entry(labels[neighbor]).or_default() += *weight;
                }
                weights_by_community.entry(current).or_default();

                let score = |community: usize, internal_weight: u64| {
                    internal_weight as f64
                        - degree as f64 * totals.get(&community).copied().unwrap_or(0) as f64
                            / total_degree as f64
                };
                let current_score = score(
                    current,
                    weights_by_community.get(&current).copied().unwrap_or(0),
                );
                let mut best = current;
                let mut best_score = current_score;
                for (community, internal_weight) in weights_by_community {
                    let candidate_score = score(community, internal_weight);
                    if candidate_score > best_score + f64::EPSILON
                        || ((candidate_score - best_score).abs() <= f64::EPSILON
                            && best != current
                            && community < best)
                    {
                        best = community;
                        best_score = candidate_score;
                    }
                }
                labels.insert(node.clone(), best);
                *totals.entry(best).or_default() += degree;
                moved |= best != current;
            }
            if !moved {
                break;
            }
        }
    }

    let mut members_by_label = BTreeMap::<usize, Vec<T>>::new();
    for (member, label) in &labels {
        members_by_label
            .entry(*label)
            .or_default()
            .push(member.clone());
    }
    let total_edge_weight = total_degree as f64 / 2.0;
    let mut modularity = 0.0;
    let mut communities = Vec::new();
    for members in members_by_label.values() {
        let member_set = members.iter().collect::<BTreeSet<_>>();
        let degree_sum = members.iter().map(|member| degrees[member]).sum::<u64>();
        let mut internal_weight = 0u64;
        let mut cut_weight = 0u64;
        for member in members {
            for (neighbor, weight) in adjacency.get(member).into_iter().flatten() {
                if member_set.contains(neighbor) {
                    if member < neighbor {
                        internal_weight += *weight;
                    }
                } else {
                    cut_weight += *weight;
                }
            }
        }
        if total_edge_weight > 0.0 {
            modularity += internal_weight as f64 / total_edge_weight
                - (degree_sum as f64 / (2.0 * total_edge_weight)).powi(2);
        }
        let denominator = internal_weight + cut_weight;
        let cohesion = if denominator == 0 {
            1.0
        } else {
            internal_weight as f64 / denominator as f64
        };
        communities.push(SemanticCommunity {
            members: members.clone(),
            internal_weight,
            cut_weight,
            cohesion,
        });
    }
    CommunityDetection {
        communities,
        modularity,
        iterations,
    }
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
