//! Explicit source import dependencies inside regular Python packages.
use super::{StoredArc, StoredDocument, StoredIndex, StoredPythonFileFacts};
use cgrx_core::{ByteRange, ConfidenceClass, EdgeEvidence, Hash32, RelationKind, ResolverClass};
use cgrx_languages::PythonImportBinding;
use std::{
    collections::{BTreeMap, BTreeSet},
    path::{Component, Path},
};

fn portable(path: &str) -> bool {
    !path.contains('\\')
        && !path.is_empty()
        && Path::new(path)
            .components()
            .all(|c| matches!(c, Component::Normal(_)))
}

fn current<'a>(
    path: &str,
    files: &'a BTreeMap<String, StoredPythonFileFacts>,
    hashes: &BTreeMap<String, Hash32>,
) -> Option<&'a StoredPythonFileFacts> {
    let facts = files.get(path)?;
    (portable(path) && facts.facts.valid && hashes.get(path) == Some(&facts.source_hash))
        .then_some(facts)
}

fn target_path(
    path: &str,
    import: &PythonImportBinding,
    files: &BTreeMap<String, StoredPythonFileFacts>,
    hashes: &BTreeMap<String, Hash32>,
) -> Option<String> {
    let dots = import.module.bytes().take_while(|c| *c == b'.').count();
    if dots == 0 {
        return None;
    }
    let mut base = Path::new(path).parent()?.to_path_buf();
    for depth in 0..dots {
        if depth > 0 && !base.pop() {
            return None;
        }
        current(&base.join("__init__.py").to_string_lossy(), files, hashes)?;
    }
    let parts: Vec<_> = import.module[dots..].split('.').collect();
    if parts.iter().any(|s| {
        let mut chars = s.chars();
        !chars
            .next()
            .is_some_and(|c| c == '_' || c.is_ascii_alphabetic())
            || !chars.all(|c| c == '_' || c.is_ascii_alphanumeric())
    }) {
        return None;
    }
    for (i, part) in parts.iter().enumerate() {
        base.push(part);
        if i + 1 < parts.len() {
            current(&base.join("__init__.py").to_string_lossy(), files, hashes)?;
        }
    }
    let module = base.with_extension("py").to_string_lossy().into_owned();
    let package = base.join("__init__.py").to_string_lossy().into_owned();
    // Inventory existence is checked before validity: a malformed or stale
    // sibling cannot turn an ambiguous module into a unique candidate.
    let candidates: Vec<_> = [module, package]
        .into_iter()
        .filter(|p| files.contains_key(p) || hashes.contains_key(p))
        .collect();
    let [target] = candidates.as_slice() else {
        return None;
    };
    current(target, files, hashes)?;
    Some(target.clone())
}

type Documents<'a> = BTreeMap<(&'a str, usize, usize, &'a str), Vec<&'a StoredDocument>>;
fn exact<'a>(
    docs: &Documents<'a>,
    path: &str,
    span: [usize; 2],
    provenance: &str,
) -> Option<&'a StoredDocument> {
    let [doc] = docs.get(&(path, span[0], span[1], provenance))?.as_slice() else {
        return None;
    };
    Some(*doc)
}

fn evaluate(
    documents: &[StoredDocument],
    hashes: &BTreeMap<String, Hash32>,
    files: &BTreeMap<String, StoredPythonFileFacts>,
) -> (Vec<StoredArc>, BTreeSet<String>, BTreeSet<String>) {
    let mut docs = Documents::new();
    let mut identities = BTreeMap::<u64, usize>::new();
    for doc in documents {
        *identities.entry(doc.node_id).or_default() += 1;
        if doc.path.ends_with(".py") {
            docs.entry((&doc.path, doc.span_start, doc.span_end, &doc.provenance))
                .or_default()
                .push(doc);
        }
    }
    let mut arcs = Vec::new();
    let mut locations = BTreeSet::new();
    let mut gaps = BTreeSet::new();
    for (path, file) in files {
        for import in &file.facts.imports {
            let location = format!("{}:{}-{}", path, import.span[0], import.span[1]);
            locations.insert(location.clone());
            let proven = (|| {
                current(path, files, hashes)?;
                let target_path = target_path(path, import, files, hashes)?;
                let target_file = current(&target_path, files, hashes)?;
                let target_span = *target_file.facts.exports.get(&import.imported)?;
                let source = exact(&docs, path, import.span, "IMPORTS")?;
                let target = exact(&docs, &target_path, target_span, "SYNTAX")?;
                if source.qualified_name != import.local
                    || source.semantic_tags.as_slice() != ["PY_IMPORT_BINDING"]
                    || target.qualified_name != import.imported
                    || identities.get(&source.node_id) != Some(&1)
                    || identities.get(&target.node_id) != Some(&1)
                {
                    return None;
                }
                Some(StoredArc {
                    source: source.node_id,
                    target: target.node_id,
                    kind: RelationKind::Imports,
                    evidence: Some(EdgeEvidence {
                        path: path.clone(),
                        span: ByteRange::new(import.span[0], import.span[1]),
                        source_hash: file.source_hash,
                        resolver: ResolverClass::SyntaxExact,
                        confidence: ConfidenceClass::Proven,
                        assumptions: vec![],
                        counter_evidence: vec![],
                    }),
                })
            })();
            if let Some(arc) = proven {
                arcs.push(arc);
            } else {
                gaps.insert(location);
            }
        }
    }
    (arcs, locations, gaps)
}

pub(super) fn normalize(stored: &mut StoredIndex) {
    if stored.python_files.is_empty()
        && !stored
            .documents
            .iter()
            .any(|d| d.path.ends_with(".py") && d.provenance == "IMPORTS")
        && !stored.arcs.iter().any(|a| {
            a.kind == RelationKind::Imports
                && a.evidence.as_ref().is_some_and(|e| e.path.ends_with(".py"))
        })
    {
        return;
    }
    let (arcs, locations, gaps) =
        evaluate(&stored.documents, &stored.path_hashes, &stored.python_files);
    let source_ids: BTreeSet<_> = stored
        .documents
        .iter()
        .filter(|d| d.path.ends_with(".py") && d.provenance == "IMPORTS")
        .map(|d| d.node_id)
        .collect();
    stored.arcs.retain(|a| {
        a.kind != RelationKind::Imports
            || (!source_ids.contains(&a.source)
                && a.evidence.as_ref().is_none_or(|e| !e.path.ends_with(".py")))
    });
    stored.arcs.extend(arcs);
    stored
        .arcs
        .sort_by_key(|a| (a.source, a.target, a.kind, a.evidence.clone()));
    stored.arcs.dedup();
    stored
        .coverage
        .dynamic_dispatch
        .retain(|loc| !locations.contains(loc));
    stored.coverage.dynamic_dispatch.extend(gaps);
    stored.coverage.dynamic_dispatch.sort();
    stored.coverage.dynamic_dispatch.dedup();
}
