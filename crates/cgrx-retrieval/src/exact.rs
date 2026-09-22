use crate::fusion::LaneHit;
use crate::graph::RetrievalDocument;

pub(crate) fn rank<D: RetrievalDocument>(
    query: &str,
    documents: &[D],
) -> Result<Vec<LaneHit>, String> {
    let query = normalize(query);
    if query.is_empty() {
        return Ok(Vec::new());
    }
    let mut hits: Vec<_> = documents
        .iter()
        .filter(|document| normalized_chars(document.qualified_name()).eq(query.chars()))
        .map(|document| LaneHit {
            node_id: document.node_id(),
            raw_score: 1_000_000,
        })
        .collect();
    hits.sort_by_key(|hit| hit.node_id);
    Ok(hits)
}

pub(crate) fn normalize(value: &str) -> String {
    normalized_chars(value).collect()
}

fn normalized_chars(value: &str) -> impl Iterator<Item = char> + '_ {
    value
        .chars()
        .filter(|character| !character.is_whitespace())
        .flat_map(char::to_lowercase)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::graph::{CandidateProvenance, GraphDocument};
    use cgrx_languages::Span;

    fn doc(node_id: u64, name: &str) -> GraphDocument {
        GraphDocument {
            node_id,
            qualified_name: name.to_owned(),
            path: "src/lib.rs".to_owned(),
            text: String::new(),
            span: Span { start: 0, end: 1 },
            provenance: CandidateProvenance::Syntax,
            semantic_fingerprint: None,
        }
    }

    #[test]
    fn rank_preserves_whitespace_and_unicode_case_normalization() {
        let documents = vec![doc(2, "Straße Value"), doc(1, "STRASSEValue")];
        let hits = rank("straßevalue", &documents).unwrap();
        assert_eq!(
            hits.iter().map(|hit| hit.node_id).collect::<Vec<_>>(),
            vec![2]
        );
    }
}
