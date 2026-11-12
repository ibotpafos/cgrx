use crate::fusion::LaneHit;
use crate::graph::RetrievalDocument;
use crate::identifier::{identifier_tokens, visit_identifier_tokens};
use std::collections::BTreeMap;
use std::sync::Mutex;

const DEFAULT_CACHE_BYTES: usize = 64 * 1024 * 1024;
const MAX_DOCUMENT_CACHE_BYTES: usize = 256 * 1024;
// Estimated retained allocation, including an allowance for map nodes/keys.
const DOCUMENT_OVERHEAD: usize = 256;
const TERM_OVERHEAD: usize = 128;

#[derive(Debug)]
struct PreparedDocument {
    fingerprint: blake3::Hash,
    length: usize,
    frequencies: BTreeMap<String, usize>,
    estimated_bytes: usize,
}

#[derive(Debug, Default)]
struct CacheState {
    documents: BTreeMap<u64, PreparedDocument>,
    estimated_bytes: usize,
}

/// Repository-local, bounded cache of BM25 document tokens, never query results.
///
/// Each use verifies all three text fields with a length-delimited fingerprint.
/// Scores and corpus statistics are always computed from the supplied scope.
/// The budget is an allocation estimate, not an allocator or RSS limit. A full
/// cache or oversized document falls back to streaming tokenization.
#[derive(Debug)]
pub struct Bm25Cache {
    max_bytes: usize,
    state: Mutex<CacheState>,
}

impl Default for Bm25Cache {
    fn default() -> Self {
        Self::new(DEFAULT_CACHE_BYTES)
    }
}

impl Bm25Cache {
    #[must_use]
    pub const fn new(max_bytes: usize) -> Self {
        Self {
            max_bytes,
            state: Mutex::new(CacheState {
                documents: BTreeMap::new(),
                estimated_bytes: 0,
            }),
        }
    }

    /// Release terms from the previous repository snapshot.
    pub fn clear(&mut self) {
        let state = self
            .state
            .get_mut()
            .unwrap_or_else(|error| error.into_inner());
        *state = CacheState::default();
        self.state.clear_poison();
    }

    fn stats<D: RetrievalDocument>(
        &self,
        documents: &[D],
        query_index: &BTreeMap<String, usize>,
    ) -> Vec<DocumentStats> {
        let Ok(mut state) = self.state.lock() else {
            return streaming_stats(documents, query_index);
        };
        let mut token_buffer = String::new();
        documents
            .iter()
            .map(|document| {
                let fingerprint = document_fingerprint(document);
                let node_id = document.node_id();
                if state
                    .documents
                    .get(&node_id)
                    .is_some_and(|cached| cached.fingerprint != fingerprint)
                {
                    let old = state
                        .documents
                        .remove(&node_id)
                        .expect("present cache entry");
                    state.estimated_bytes -= old.estimated_bytes;
                }
                if !state.documents.contains_key(&node_id) {
                    let available = self.max_bytes.saturating_sub(state.estimated_bytes);
                    if let Some(prepared) = prepare_document(
                        document,
                        fingerprint,
                        available.min(MAX_DOCUMENT_CACHE_BYTES),
                        &mut token_buffer,
                    ) {
                        state.estimated_bytes += prepared.estimated_bytes;
                        state.documents.insert(node_id, prepared);
                    }
                }
                match state.documents.get(&node_id) {
                    Some(prepared) => {
                        let mut term_frequency = vec![0; query_index.len()];
                        for (term, index) in query_index {
                            term_frequency[*index] =
                                prepared.frequencies.get(term).copied().unwrap_or(0);
                        }
                        DocumentStats {
                            length: prepared.length,
                            term_frequency,
                        }
                    }
                    None => document_stats(document, query_index, &mut token_buffer),
                }
            })
            .collect()
    }
}

fn document_fingerprint<D: RetrievalDocument>(document: &D) -> blake3::Hash {
    let mut hasher = blake3::Hasher::new();
    hasher.update(b"cgrx-bm25-document-v1\0");
    for value in [document.qualified_name(), document.path(), document.text()] {
        hasher.update(&(value.len() as u64).to_le_bytes());
        hasher.update(value.as_bytes());
    }
    hasher.finalize()
}

fn prepare_document<D: RetrievalDocument>(
    document: &D,
    fingerprint: blake3::Hash,
    max_bytes: usize,
    token_buffer: &mut String,
) -> Option<PreparedDocument> {
    if max_bytes < DOCUMENT_OVERHEAD {
        return None;
    }
    let mut prepared = PreparedDocument {
        fingerprint,
        length: 0,
        frequencies: BTreeMap::new(),
        estimated_bytes: DOCUMENT_OVERHEAD,
    };
    let mut oversized = false;
    for value in [document.qualified_name(), document.path(), document.text()] {
        visit_identifier_tokens(value, token_buffer, |token| {
            if oversized {
                return;
            }
            prepared.length = prepared.length.saturating_add(1);
            if let Some(frequency) = prepared.frequencies.get_mut(token) {
                *frequency = frequency.saturating_add(1);
            } else {
                let cost = TERM_OVERHEAD.saturating_add(token.len());
                if cost > max_bytes.saturating_sub(prepared.estimated_bytes) {
                    oversized = true;
                    return;
                }
                prepared.estimated_bytes += cost;
                prepared.frequencies.insert(token.to_owned(), 1);
            }
        });
        if oversized {
            return None;
        }
    }
    Some(prepared)
}

#[derive(Clone, Debug)]
struct DocumentStats {
    length: usize,
    term_frequency: Vec<usize>,
}

pub(crate) fn rank<D: RetrievalDocument>(query: &str, documents: &[D]) -> Vec<LaneHit> {
    rank_with_cache(query, documents, None)
}

pub(crate) fn rank_with_cache<D: RetrievalDocument>(
    query: &str,
    documents: &[D],
    cache: Option<&Bm25Cache>,
) -> Vec<LaneHit> {
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
    let stats = cache.map_or_else(
        || streaming_stats(documents, &query_index),
        |cache| cache.stats(documents, &query_index),
    );
    let mut document_frequency = vec![0_usize; query_index.len()];
    let mut total_length = 0_usize;
    for document in &stats {
        for (index, frequency) in document.term_frequency.iter().enumerate() {
            if *frequency > 0 {
                document_frequency[index] = document_frequency[index].saturating_add(1);
            }
        }
        total_length = total_length.saturating_add(document.length);
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

fn streaming_stats<D: RetrievalDocument>(
    documents: &[D],
    query_index: &BTreeMap<String, usize>,
) -> Vec<DocumentStats> {
    let mut token_buffer = String::new();
    documents
        .iter()
        .map(|document| document_stats(document, query_index, &mut token_buffer))
        .collect()
}

fn document_stats<D: RetrievalDocument>(
    document: &D,
    query_index: &BTreeMap<String, usize>,
    token_buffer: &mut String,
) -> DocumentStats {
    let mut stats = DocumentStats {
        length: 0,
        term_frequency: vec![0; query_index.len()],
    };
    for value in [document.qualified_name(), document.path(), document.text()] {
        visit_identifier_tokens(value, token_buffer, |token| {
            stats.length = stats.length.saturating_add(1);
            if let Some(index) = query_index.get(token) {
                stats.term_frequency[*index] = stats.term_frequency[*index].saturating_add(1);
            }
        });
    }
    stats
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

    #[test]
    fn cached_scores_preserve_scope_unicode_duplicates_and_ties() {
        let cache = Bm25Cache::default();
        let mut documents = vec![
            doc(9, "HTTPRequest", "src/a.rs", "http request alpha alpha"),
            doc(2, "HTTPRequest", "src/a.rs", "http request alpha alpha"),
            doc(
                3,
                "ОбработатьHTTP2Запрос",
                "src/b.rs",
                "alpha beta İstanbul",
            ),
            doc(4, "İstanbul", "src/c.rs", "beta beta HTTP_REQUEST"),
            doc(5, "", "", ""),
        ];
        // Warm the full corpus first. Narrow scopes must recompute DF and avgdl.
        rank_with_cache("alpha beta", &documents, Some(&cache));
        for _ in 0..2 {
            for scoped in [
                &documents[..],
                &documents[..2],
                &documents[2..],
                &documents[4..],
                &documents[..0],
            ] {
                for query in [
                    "HTTPRequest",
                    "alpha alpha beta",
                    "ОбработатьHTTP2Запрос",
                    "İstanbul",
                    "missing",
                    "",
                ] {
                    assert_eq!(
                        rank_with_cache(query, scoped, Some(&cache)),
                        rank(query, scoped),
                        "{query}"
                    );
                }
            }
            documents.reverse();
        }
    }

    #[test]
    fn cached_tokens_verify_every_text_field_even_when_node_ids_are_reused() {
        let cache = Bm25Cache::default();
        let mut documents = vec![doc(1, "old_name", "old_path.rs", "old_body")];
        for field in 0..4 {
            for query in [
                "old name path body",
                "new name path body",
                "another repository",
            ] {
                assert_eq!(
                    rank_with_cache(query, &documents, Some(&cache)),
                    rank(query, &documents)
                );
            }
            match field {
                0 => documents[0].qualified_name = "new_name".into(),
                1 => documents[0].path = "new_path.rs".into(),
                2 => documents[0].text = "new_body".into(),
                _ => {}
            }
        }
        let other_repo = [doc(1, "another", "repository.rs", "different")];
        assert_eq!(
            rank_with_cache("another repository", &other_repo, Some(&cache)),
            rank("another repository", &other_repo)
        );
        let left = doc(1, "ab", "c", "d");
        let right = doc(1, "a", "bc", "d");
        assert_ne!(document_fingerprint(&left), document_fingerprint(&right));
    }

    #[test]
    fn full_and_oversized_cache_entries_fall_back_without_changing_scores() {
        let large = (0..3000).map(|i| format!("term{i} ")).collect::<String>();
        let documents = vec![
            doc(1, "target", "a.rs", "alpha beta"),
            doc(2, "large", "b.rs", &large),
            doc(3, "other", "c.rs", "alpha"),
        ];
        for max_bytes in [0, DOCUMENT_OVERHEAD - 1, 1500, DEFAULT_CACHE_BYTES] {
            let mut cache = Bm25Cache::new(max_bytes);
            for _ in 0..2 {
                for query in ["alpha beta", "large term2999", "target", "0"] {
                    assert_eq!(
                        rank_with_cache(query, &documents, Some(&cache)),
                        rank(query, &documents)
                    );
                }
            }
            let state = cache.state.lock().unwrap();
            assert!(state.estimated_bytes <= max_bytes);
            assert!(!state.documents.contains_key(&2));
            drop(state);
            cache.clear();
            assert!(cache.state.lock().unwrap().documents.is_empty());
            assert_eq!(
                rank_with_cache("alpha", &documents, Some(&cache)),
                rank("alpha", &documents)
            );
        }
    }

    #[test]
    fn concurrent_queries_and_poisoned_cache_keep_streaming_results() {
        let documents = vec![
            doc(1, "alpha", "a.rs", "http request"),
            doc(2, "beta", "b.rs", "alpha"),
        ];
        let mut cache = Bm25Cache::default();
        std::thread::scope(|scope| {
            for query in ["alpha", "http request", "beta", "missing"] {
                let cache = &cache;
                let documents = &documents;
                scope.spawn(move || {
                    for _ in 0..16 {
                        assert_eq!(
                            rank_with_cache(query, documents, Some(cache)),
                            rank(query, documents)
                        );
                    }
                });
            }
        });
        let _ = std::panic::catch_unwind(|| {
            let _guard = cache.state.lock().unwrap();
            panic!("simulate interrupted cache preparation");
        });
        assert_eq!(
            rank_with_cache("alpha", &documents, Some(&cache)),
            rank("alpha", &documents)
        );
        cache.clear();
        assert!(!cache.state.is_poisoned());
        assert_eq!(
            rank_with_cache("http", &documents, Some(&cache)),
            rank("http", &documents)
        );
    }
}
