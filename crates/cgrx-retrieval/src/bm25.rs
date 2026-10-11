use crate::fusion::LaneHit;
use crate::graph::RetrievalDocument;
use crate::identifier::{identifier_tokens, visit_identifier_tokens};
use std::collections::BTreeMap;

#[derive(Clone, Debug)]
struct DocumentStats {
    length: usize,
    term_frequency: Vec<usize>,
}

pub(crate) fn rank<D: RetrievalDocument>(query: &str, documents: &[D]) -> Vec<LaneHit> {
    let query_tokens = identifier_tokens(query);
    if query_tokens.is_empty() || documents.is_empty() {
        return Vec::new();
    }

    let mut query_index = BTreeMap::<String, usize>::new();
    for token in &query_tokens {
        if !query_index.contains_key(token) {
            let index = query_index.len();
            query_index.insert(token.clone(), index);
        }
    }
    let mut document_frequency = vec![0_usize; query_index.len()];
    let mut total_length = 0_usize;
    let mut stats = Vec::with_capacity(documents.len());
    let mut token_buffer = String::new();
    for document in documents {
        let mut length = 0_usize;
        let mut term_frequency = vec![0_usize; query_index.len()];
        for value in [document.qualified_name(), document.path(), document.text()] {
            visit_identifier_tokens(value, &mut token_buffer, |token| {
                length = length.saturating_add(1);
                if let Some(index) = query_index.get(token) {
                    term_frequency[*index] = term_frequency[*index].saturating_add(1);
                }
            });
        }
        for (index, frequency) in term_frequency.iter().enumerate() {
            if *frequency > 0 {
                document_frequency[index] = document_frequency[index].saturating_add(1);
            }
        }
        total_length = total_length.saturating_add(length);
        stats.push(DocumentStats {
            length,
            term_frequency,
        });
    }
    let average_length = total_length as f64 / stats.len().max(1) as f64;
    let count = documents.len() as f64;
    let mut hits = Vec::new();
    for (document, stats) in documents.iter().zip(&stats) {
        let mut score = 0.0_f64;
        for query_token in &query_tokens {
            let index = query_index[query_token];
            let term_frequency = stats.term_frequency[index] as f64;
            if term_frequency == 0.0 {
                continue;
            }
            let frequency = document_frequency[index] as f64;
            let inverse = (1.0 + (count - frequency + 0.5) / (frequency + 0.5)).ln();
            let denominator = term_frequency
                + 1.2 * (1.0 - 0.75 + 0.75 * stats.length as f64 / average_length.max(1.0));
            score += inverse * (term_frequency * 2.2 / denominator);
        }
        if score > 0.0 {
            hits.push(LaneHit {
                node_id: document.node_id(),
                raw_score: (score * 1_000_000.0).round() as u64,
            });
        }
    }
    hits.sort_by(|left, right| {
        right
            .raw_score
            .cmp(&left.raw_score)
            .then_with(|| left.node_id.cmp(&right.node_id))
    });
    hits
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::graph::{CandidateProvenance, GraphDocument};
    use cgrx_languages::Span;

    fn doc(node_id: u64, name: &str, path: &str, text: &str) -> GraphDocument {
        GraphDocument {
            node_id,
            qualified_name: name.to_string(),
            path: path.to_string(),
            text: text.to_string(),
            span: Span { start: 0, end: 10 },
            provenance: CandidateProvenance::Syntax,
            semantic_fingerprint: None,
        }
    }

    // A document that contains all of the query terms must rank strictly above
    // a document that contains only one of them, and with a higher raw score.
    #[test]
    fn more_query_terms_ranks_above_fewer() {
        let documents = vec![
            doc(1, "alpha", "src/a.rs", "foo bar baz foo bar baz"),
            doc(2, "beta", "src/b.rs", "foo"),
        ];
        let hits = rank("foo bar baz", &documents);
        assert!(!hits.is_empty(), "expected at least one ranked hit");
        assert_eq!(
            hits[0].node_id, 1,
            "document matching all three query terms must rank first"
        );
        assert!(
            hits[0].raw_score > hits[1].raw_score,
            "more matched terms must yield a strictly higher score"
        );
    }

    // For a single query term, a higher term frequency must outrank a lower
    // term frequency.
    #[test]
    fn higher_term_frequency_ranks_above_lower() {
        let documents = vec![
            doc(1, "rep", "src/a.rs", "foo foo foo"),
            doc(2, "once", "src/b.rs", "foo"),
        ];
        let hits = rank("foo", &documents);
        assert_eq!(hits.len(), 2, "both documents should be ranked");
        assert_eq!(
            hits[0].node_id, 1,
            "document with higher term frequency must rank first"
        );
        assert!(
            hits[0].raw_score > hits[1].raw_score,
            "higher term frequency must yield a strictly higher score"
        );
    }

    // No query-term overlap means no hits at all.
    #[test]
    fn no_overlap_yields_no_hits() {
        let documents = vec![doc(1, "alpha", "src/a.rs", "completely unrelated text")];
        let hits = rank("foo bar baz", &documents);
        assert!(
            hits.is_empty(),
            "documents without query terms must not rank"
        );
    }

    #[test]
    fn acronym_queries_retrieve_words_across_name_path_and_body() {
        let documents = vec![
            doc(1, "HTTPRequest", "src/a.rs", "send"),
            doc(2, "handler", "src/http_request.rs", "send"),
            doc(3, "handler", "src/c.rs", "HTTP_REQUEST"),
            doc(4, "MetricsCollector", "src/d.rs", "collect"),
            doc(5, "requester", "src/e.rs", "shipping"),
        ];
        let expected = rank("http request", &documents);
        assert_eq!(
            expected
                .iter()
                .map(|hit| hit.node_id)
                .collect::<std::collections::BTreeSet<_>>(),
            [1, 2, 3].into_iter().collect()
        );
        for query in ["HTTPRequest", "httpRequest", "HTTP_REQUEST"] {
            assert_eq!(rank(query, &documents), expected, "{query}");
        }
    }

    #[test]
    fn unicode_and_version_queries_use_complete_numeric_terms() {
        let documents = vec![
            doc(1, "ОбработатьHTTP2Запрос", "src/a.rs", "send"),
            doc(2, "ОбработатьHTTP12Запрос", "src/b.rs", "send"),
            doc(3, "MetricsCollector", "src/c.rs", "collect"),
        ];
        assert_eq!(
            rank("2", &documents)
                .iter()
                .map(|hit| hit.node_id)
                .collect::<Vec<_>>(),
            [1]
        );
        let hits = rank("обработать http 2 запрос", &documents);
        assert_eq!(hits[0].node_id, 1);
        assert_eq!(hits.len(), 2);
        assert!(hits[0].raw_score > hits[1].raw_score);
        assert_eq!(rank("ОбработатьHTTP2Запрос", &documents), hits);
    }

    #[test]
    fn unicode_expanding_lowercase_retrieves_the_original_identifier() {
        let documents = vec![
            doc(1, "İstanbul", "src/a.rs", "send"),
            doc(2, "Berlin", "src/b.rs", "collect"),
        ];
        let expected = rank("İstanbul", &documents);
        assert_eq!(
            expected.iter().map(|hit| hit.node_id).collect::<Vec<_>>(),
            [1]
        );
        assert_eq!(rank(&"İstanbul".to_lowercase(), &documents), expected);
    }

    #[test]
    fn identifier_tokenization_preserves_stable_tie_order() {
        let mut documents = vec![
            doc(9, "HTTPRequest", "src/a.rs", "send"),
            doc(2, "HTTPRequest", "src/a.rs", "send"),
        ];
        let expected = rank("http request", &documents);
        assert_eq!(
            expected.iter().map(|hit| hit.node_id).collect::<Vec<_>>(),
            [2, 9]
        );
        documents.reverse();
        assert_eq!(rank("HTTPRequest", &documents), expected);
    }
}
