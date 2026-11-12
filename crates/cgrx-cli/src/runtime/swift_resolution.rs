//! Bind parser-proven Swift dependencies by exact same-file declaration spans.
//! No Swift relation falls back to a global name or suffix lookup.

use std::collections::BTreeMap;

use cgrx_core::{ByteRange, ConfidenceClass, EdgeEvidence, Hash32, RelationKind, ResolverClass};

use super::{StoredArc, StoredDocument};

type Definitions<'a> = BTreeMap<(&'a str, usize, usize), Vec<&'a StoredDocument>>;

fn declaration<'a>(
    definitions: &Definitions<'a>,
    path: &str,
    span: ByteRange,
) -> Option<&'a StoredDocument> {
    if span.start >= span.end {
        return None;
    }
    let [definition] = definitions.get(&(path, span.start, span.end))?.as_slice() else {
        return None;
    };
    (definition
        .semantic_tags
        .iter()
        .any(|tag| tag == "SWIFT_DECLARATION")
        && definition.body_start <= definition.span_start
        && definition.span_end <= definition.body_end)
        .then_some(*definition)
}

pub(super) fn rebuild(
    documents: &[StoredDocument],
    path_hashes: &BTreeMap<String, Hash32>,
) -> Vec<StoredArc> {
    let mut definitions = Definitions::new();
    let mut by_path = BTreeMap::<&str, Vec<&StoredDocument>>::new();
    for definition in documents
        .iter()
        .filter(|document| document.path.ends_with(".swift") && document.provenance == "SYNTAX")
    {
        definitions
            .entry((
                definition.path.as_str(),
                definition.span_start,
                definition.span_end,
            ))
            .or_default()
            .push(definition);
        by_path
            .entry(&definition.path)
            .or_default()
            .push(definition);
    }

    let mut arcs = Vec::new();
    for dependency in documents
        .iter()
        .filter(|document| document.path.ends_with(".swift"))
    {
        let kind = match (
            dependency.provenance.as_str(),
            dependency.semantic_tags.as_slice(),
        ) {
            ("CALLS", [exact, swift]) if exact == "EXACT_CALL" && swift == "SWIFT_EXACT_CALL" => {
                RelationKind::Calls
            }
            ("REFERENCES", [reference, swift])
                if reference == "REFERENCES" && swift == "SWIFT_EXACT_REFERENCE" =>
            {
                RelationKind::References
            }
            _ => continue,
        };
        let Some(proof) = &dependency.ts_lexical_target else {
            continue;
        };
        let Some(source_hash) = path_hashes.get(&dependency.path).copied() else {
            continue;
        };
        if source_hash == Hash32([0; 32]) || dependency.span_start >= dependency.span_end {
            continue;
        }
        let Some(owner) = declaration(&definitions, &dependency.path, proof.caller) else {
            continue;
        };
        let Some(target) = declaration(&definitions, &dependency.path, proof.target) else {
            continue;
        };
        if target.qualified_name != dependency.qualified_name
            || target.text != dependency.qualified_name
            || owner.body_start > dependency.span_start
            || dependency.span_end > owner.body_end
        {
            continue;
        }

        // A nested declaration owns its sites. Corrupt proof metadata must not
        // silently assign a method's call to its enclosing type or extension.
        let mut nearest = by_path[dependency.path.as_str()]
            .iter()
            .filter(|candidate| {
                candidate.body_start <= dependency.span_start
                    && dependency.span_end <= candidate.body_end
            })
            .map(|candidate| (candidate.body_end - candidate.body_start, candidate.node_id))
            .collect::<Vec<_>>();
        nearest.sort_unstable();
        let Some((length, node)) = nearest.first().copied() else {
            continue;
        };
        if node != owner.node_id
            || nearest
                .get(1)
                .is_some_and(|(next_length, _)| *next_length == length)
        {
            continue;
        }

        arcs.push(StoredArc {
            source: owner.node_id,
            target: target.node_id,
            kind,
            evidence: Some(EdgeEvidence {
                path: dependency.path.clone(),
                span: ByteRange::new(dependency.span_start, dependency.span_end),
                source_hash,
                resolver: ResolverClass::SyntaxExact,
                confidence: ConfidenceClass::Proven,
                assumptions: Vec::new(),
                counter_evidence: Vec::new(),
            }),
        });
    }
    arcs
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn swift_proof_metadata_cannot_fall_back_to_a_matching_name() {
        let source = b"struct Value {}\nfunc target() {}\nfunc caller() { target() }\nfunc consume(_ value: Value) {}\n";
        let documents = super::super::extract_path("proof.swift", source)
            .unwrap()
            .documents;
        let hashes = BTreeMap::from([(
            "proof.swift".to_owned(),
            Hash32(*blake3::hash(source).as_bytes()),
        )]);
        for (kind, tag) in [
            ("CALLS", "SWIFT_EXACT_CALL"),
            ("REFERENCES", "SWIFT_EXACT_REFERENCE"),
        ] {
            let original = rebuild(&documents, &hashes);
            let relation = if kind == "CALLS" {
                RelationKind::Calls
            } else {
                RelationKind::References
            };
            assert_eq!(
                original.iter().filter(|edge| edge.kind == relation).count(),
                1,
                "{kind}: {original:?}"
            );
            for mutation in [
                "proof",
                "owner",
                "target",
                "tag",
                "declaration",
                "duplicate",
            ] {
                let mut changed = documents.clone();
                let index = changed
                    .iter()
                    .position(|document| document.provenance == kind)
                    .unwrap();
                let target = changed[index].ts_lexical_target.as_ref().unwrap().target;
                match mutation {
                    "proof" => changed[index].ts_lexical_target = None,
                    "owner" => {
                        changed[index]
                            .ts_lexical_target
                            .as_mut()
                            .unwrap()
                            .caller
                            .start += 1
                    }
                    "target" => {
                        changed[index]
                            .ts_lexical_target
                            .as_mut()
                            .unwrap()
                            .target
                            .start += 1
                    }
                    "tag" => changed[index].semantic_tags.retain(|value| value != tag),
                    "declaration" => changed
                        .iter_mut()
                        .find(|document| {
                            document.provenance == "SYNTAX"
                                && document.span_start == target.start
                                && document.span_end == target.end
                        })
                        .unwrap()
                        .semantic_tags
                        .clear(),
                    "duplicate" => {
                        let definition = changed
                            .iter()
                            .find(|document| {
                                document.provenance == "SYNTAX"
                                    && document.span_start == target.start
                                    && document.span_end == target.end
                            })
                            .unwrap()
                            .clone();
                        changed.push(definition);
                    }
                    _ => unreachable!(),
                }
                assert!(
                    !rebuild(&changed, &hashes)
                        .iter()
                        .any(|edge| edge.kind == relation),
                    "{kind}: {mutation}"
                );
            }
        }
        assert!(rebuild(&documents, &BTreeMap::new()).is_empty());
    }
}
