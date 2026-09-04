use crate::fusion::LaneHit;
use crate::graph::GraphDocument;
use fst::{Set, SetBuilder};
use std::collections::BTreeMap;

pub(crate) fn rank(query: &str, documents: &[GraphDocument]) -> Result<Vec<LaneHit>, String> {
    let query = normalize(query);
    if query.is_empty() {
        return Ok(Vec::new());
    }
    let mut by_name = BTreeMap::<String, Vec<&GraphDocument>>::new();
    for document in documents {
        by_name
            .entry(normalize(&document.qualified_name))
            .or_default()
            .push(document);
    }
    let mut builder = SetBuilder::memory();
    for name in by_name.keys() {
        builder.insert(name).map_err(|error| error.to_string())?;
    }
    let index = Set::new(builder.into_inner().map_err(|error| error.to_string())?)
        .map_err(|error| error.to_string())?;
    if !index.contains(&query) {
        return Ok(Vec::new());
    }
    let mut hits: Vec<_> = by_name[&query]
        .iter()
        .map(|document| LaneHit {
            node_id: document.node_id,
            raw_score: 1_000_000,
        })
        .collect();
    hits.sort_by_key(|hit| hit.node_id);
    Ok(hits)
}

pub(crate) fn normalize(value: &str) -> String {
    value
        .chars()
        .filter(|character| !character.is_whitespace())
        .flat_map(char::to_lowercase)
        .collect()
}
