//! Exact, revision-bound JavaScript relationships; no legacy resolver fallback.
use super::{StoredArc, StoredDocument, StoredIndex, StoredTsFileFacts};
use cgrx_languages::javascript::{ModuleKind, PackageKind};
use std::path::Path;

fn environment_matches(
    path: &str,
    facts: &FileFacts,
    stored: &BTreeMap<String, StoredTsFileFacts>,
    hashes: &BTreeMap<String, Hash32>,
) -> bool {
    if !path.ends_with(".js") {
        return true;
    }
    let Some(kind) = facts
        .module_kind
        .or_else(|| facts.imports.first().map(|import| import.kind))
    else {
        return true;
    };
    let mut directory = Path::new(path).parent();
    while let Some(parent) = directory {
        let package = parent.join("package.json").to_string_lossy().into_owned();
        if stored.contains_key(&package) || hashes.contains_key(&package) {
            let Some(file) = stored.get(&package) else {
                return false;
            };
            if hashes.get(&package) != Some(&file.source_hash) {
                return false;
            }
            return match file.facts.javascript_package {
                Some(PackageKind::Automatic) => true,
                Some(PackageKind::Esm) => kind == ModuleKind::Esm,
                Some(PackageKind::CommonJs) => kind == ModuleKind::CommonJs,
                _ => false,
            };
        }
        directory = parent.parent();
    }
    true
}
use cgrx_core::{ByteRange, ConfidenceClass, EdgeEvidence, Hash32, RelationKind, ResolverClass};
use cgrx_languages::javascript::{FileFacts, SiteKind, is_javascript_path, resolve_site};
use std::collections::{BTreeMap, BTreeSet};

fn relation(kind: SiteKind) -> RelationKind {
    match kind {
        SiteKind::Call => RelationKind::Calls,
        SiteKind::Import => RelationKind::Imports,
        SiteKind::Reference => RelationKind::References,
    }
}
type Documents<'a> = BTreeMap<(&'a str, usize, usize, &'a str), Vec<&'a StoredDocument>>;
fn exact<'a>(
    documents: &Documents<'a>,
    path: &str,
    span: [usize; 2],
    provenance: &str,
) -> Option<&'a StoredDocument> {
    let [document] = documents
        .get(&(path, span[0], span[1], provenance))?
        .as_slice()
    else {
        return None;
    };
    Some(*document)
}

fn evaluate(
    documents: &[StoredDocument],
    hashes: &BTreeMap<String, Hash32>,
    stored: &BTreeMap<String, StoredTsFileFacts>,
) -> (Vec<StoredArc>, BTreeSet<String>, BTreeSet<String>) {
    let files: BTreeMap<String, FileFacts> = stored
        .iter()
        .filter(|(path, facts)| hashes.get(*path) == Some(&facts.source_hash))
        .filter(|(path, file)| {
            file.facts
                .javascript
                .as_ref()
                .is_none_or(|facts| environment_matches(path, facts, stored, hashes))
        })
        .filter_map(|(path, stored)| {
            stored
                .facts
                .javascript
                .clone()
                .map(|facts| (path.clone(), facts))
        })
        .collect();
    let mut inventory = BTreeMap::<String, Vec<String>>::new();
    for path in hashes.keys().chain(stored.keys()).collect::<BTreeSet<_>>() {
        inventory
            .entry(path.to_ascii_lowercase())
            .or_default()
            .push(path.clone());
    }
    let mut by_span = Documents::new();
    for document in documents.iter().filter(|d| is_javascript_path(&d.path)) {
        if document.provenance == "CALLS"
            && !document.semantic_tags.iter().any(|tag| tag == "EXACT_CALL")
        {
            continue;
        }
        by_span
            .entry((
                &document.path,
                document.span_start,
                document.span_end,
                &document.provenance,
            ))
            .or_default()
            .push(document);
    }
    let mut arcs = Vec::new();
    let mut locations = BTreeSet::new();
    let mut gaps = BTreeSet::new();
    for (path, stored_file) in stored {
        let Some(file) = &stored_file.facts.javascript else {
            continue;
        };
        for unsupported in &file.unsupported_sites {
            let location = format!("{}:{}-{}", path, unsupported[0], unsupported[1]);
            locations.insert(location.clone());
            gaps.insert(location);
        }
        for site in &file.sites {
            let location = format!("{}:{}-{}", path, site.span[0], site.span[1]);
            locations.insert(location.clone());
            let arc = (|| {
                let (target_path, target_span) = resolve_site(&files, &inventory, path, site)?;
                let target = exact(&by_span, &target_path, target_span, "SYNTAX")?;
                let source = if let Some(caller) = site.caller {
                    exact(&by_span, path, caller, "SYNTAX")?
                } else {
                    exact(
                        &by_span,
                        path,
                        site.span,
                        match site.kind {
                            SiteKind::Import => "IMPORTS",
                            SiteKind::Reference => "REFERENCES",
                            SiteKind::Call => return None,
                        },
                    )?
                };
                if site.kind == SiteKind::Call {
                    exact(&by_span, path, site.span, "CALLS")?;
                }
                Some(StoredArc {
                    source: source.node_id,
                    target: target.node_id,
                    kind: relation(site.kind),
                    evidence: Some(EdgeEvidence {
                        path: path.clone(),
                        span: ByteRange::new(site.span[0], site.span[1]),
                        source_hash: hashes[path],
                        resolver: ResolverClass::SyntaxExact,
                        confidence: ConfidenceClass::Proven,
                        assumptions: Vec::new(),
                        counter_evidence: Vec::new(),
                    }),
                })
            })();
            if let Some(arc) = arc {
                arcs.push(arc);
            } else {
                gaps.insert(location);
            }
        }
    }
    (arcs, locations, gaps)
}

pub(super) fn rebuild(
    documents: &[StoredDocument],
    hashes: &BTreeMap<String, Hash32>,
    stored: &BTreeMap<String, StoredTsFileFacts>,
) -> Vec<StoredArc> {
    evaluate(documents, hashes, stored).0
}

pub(super) fn normalize(stored: &mut StoredIndex) {
    // Several imported names may share one statement span. The statement stays
    // partial until every candidate at that span has its own exact target proof.
    let (arcs, locations, gaps) =
        evaluate(&stored.documents, &stored.path_hashes, &stored.ts_files);
    let javascript_nodes: BTreeSet<_> = stored
        .documents
        .iter()
        .filter(|document| is_javascript_path(&document.path))
        .map(|document| document.node_id)
        .collect();
    // Reopen must revalidate persisted proofs just as watched refresh does.
    stored.arcs.retain(|arc| {
        arc.kind == RelationKind::Contains
            || !(javascript_nodes.contains(&arc.source)
                || javascript_nodes.contains(&arc.target)
                || arc
                    .evidence
                    .as_ref()
                    .is_some_and(|proof| is_javascript_path(&proof.path)))
    });
    stored.arcs.extend(arcs);
    stored
        .arcs
        .sort_by_key(|arc| (arc.source, arc.target, arc.kind, arc.evidence.clone()));
    stored.arcs.dedup();
    stored
        .coverage
        .dynamic_dispatch
        .retain(|location| !locations.contains(location));
    stored.coverage.dynamic_dispatch.extend(gaps);
}

#[cfg(test)]
mod tests {
    use super::super::{arc_resolution::rebuild_arcs_with_cargo, extraction::extract_path};
    use super::*;

    #[test]
    fn javascript_proofs_require_intact_identity_hashes_and_unique_documents() {
        // Language dependency features may be unified without the CLI feature.
        if !cgrx_languages::EXPERIMENTAL_JAVASCRIPT_ENABLED {
            return;
        }
        let mut documents = Vec::new();
        let mut hashes = BTreeMap::new();
        let mut files = BTreeMap::new();
        for (path, source) in [
            (
                "main.js",
                "const View = require('./view'); function caller() { View(); }",
            ),
            ("view.js", "function View() {} module.exports = View;"),
            ("noise.js", "function View() {} function caller() {}"),
        ] {
            let extracted = extract_path(path, source.as_bytes()).unwrap();
            let hash = Hash32(*blake3::hash(source.as_bytes()).as_bytes());
            hashes.insert(path.to_owned(), hash);
            files.insert(
                path.to_owned(),
                StoredTsFileFacts {
                    source_hash: hash,
                    facts: extracted.ts_file.unwrap(),
                    inventory_only: false,
                },
            );
            documents.extend(extracted.documents);
        }
        let calls = |docs: &[StoredDocument],
                     hashes: &BTreeMap<String, Hash32>,
                     files: &BTreeMap<String, StoredTsFileFacts>| {
            rebuild_arcs_with_cargo(
                docs,
                hashes,
                &BTreeMap::new(),
                &BTreeMap::new(),
                &BTreeMap::new(),
                files,
                &BTreeMap::new(),
            )
            .into_iter()
            .filter(|arc| arc.kind == RelationKind::Calls)
            .collect::<Vec<_>>()
        };
        let baseline = calls(&documents, &hashes, &files);
        assert_eq!(baseline.len(), 1);
        let evidence = baseline[0].evidence.as_ref().unwrap();
        assert_eq!(evidence.source_hash, hashes["main.js"]);
        assert_eq!(evidence.resolver, ResolverClass::SyntaxExact);
        assert_eq!(evidence.confidence, ConfidenceClass::Proven);

        for case in [
            "missing-ledger",
            "missing-target-ledger",
            "stale-source",
            "stale-target",
            "missing-source-hash",
            "missing-target-hash",
            "invalid-source",
            "invalid-target",
            "missing-site",
            "duplicate-site",
            "wrong-caller",
            "wrong-target-export",
            "missing-call-tag",
            "wrong-call-span",
            "missing-caller",
            "missing-target",
            "missing-call",
            "duplicate-caller",
            "duplicate-target",
            "duplicate-call",
            "package-without-metadata",
        ] {
            let mut docs = documents.clone();
            let mut hashes = hashes.clone();
            let mut files = files.clone();
            match case {
                "missing-ledger" => files.get_mut("main.js").unwrap().facts.javascript = None,
                "missing-target-ledger" => {
                    files.remove("view.js");
                }
                "stale-source" | "stale-target" => {
                    hashes.insert(
                        if case == "stale-source" {
                            "main.js"
                        } else {
                            "view.js"
                        }
                        .to_owned(),
                        Hash32([9; 32]),
                    );
                }
                "missing-source-hash" | "missing-target-hash" => {
                    hashes.remove(if case == "missing-source-hash" {
                        "main.js"
                    } else {
                        "view.js"
                    });
                }
                "invalid-source" | "invalid-target" => {
                    files
                        .get_mut(if case == "invalid-source" {
                            "main.js"
                        } else {
                            "view.js"
                        })
                        .unwrap()
                        .facts
                        .javascript
                        .as_mut()
                        .unwrap()
                        .valid = false;
                }
                "missing-site" | "duplicate-site" | "wrong-caller" => {
                    let sites = &mut files
                        .get_mut("main.js")
                        .unwrap()
                        .facts
                        .javascript
                        .as_mut()
                        .unwrap()
                        .sites;
                    let index = sites
                        .iter()
                        .position(|site| site.kind == SiteKind::Call)
                        .unwrap();
                    match case {
                        "missing-site" => {
                            sites.remove(index);
                        }
                        "duplicate-site" => sites.push(sites[index].clone()),
                        _ => sites[index].caller.as_mut().unwrap()[0] += 1,
                    }
                }
                "wrong-target-export" => {
                    files
                        .get_mut("view.js")
                        .unwrap()
                        .facts
                        .javascript
                        .as_mut()
                        .unwrap()
                        .exports
                        .get_mut("default")
                        .unwrap()[0][0] += 1;
                }
                "missing-call-tag" | "wrong-call-span" => {
                    let call = docs
                        .iter_mut()
                        .find(|document| document.provenance == "CALLS")
                        .unwrap();
                    if case == "missing-call-tag" {
                        call.semantic_tags.retain(|tag| tag != "EXACT_CALL");
                    } else {
                        call.span_start += 1;
                    }
                }
                "package-without-metadata" => {
                    hashes.insert("package.json".to_owned(), Hash32([8; 32]));
                }
                _ => {
                    let target = case.ends_with("target");
                    let call = case.ends_with("call");
                    let index = docs
                        .iter()
                        .position(|document| {
                            document.path == if target { "view.js" } else { "main.js" }
                                && document.provenance == if call { "CALLS" } else { "SYNTAX" }
                                && (call
                                    || document.qualified_name
                                        == if target { "View" } else { "caller" })
                        })
                        .unwrap();
                    if case.starts_with("missing") {
                        docs.remove(index);
                    } else {
                        docs.push(docs[index].clone());
                    }
                }
            }
            assert!(
                calls(&docs, &hashes, &files).is_empty(),
                "fallback after {case}"
            );
        }
    }
}
