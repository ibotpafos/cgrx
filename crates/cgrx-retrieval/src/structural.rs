use crate::fusion::LaneHit;
use crate::graph::RetrievalDocument;
use crate::identifier_tokens;
use std::collections::BTreeSet;

/// Deterministic structural-fingerprint lane. Finds symbols whose normalized
/// body matches the body of the symbol named in the query — catches renamed
/// or lightly rewritten duplicates. No external models: the signal is
/// structural only (name tokens + normalized body hash).
pub(crate) fn rank<D: RetrievalDocument>(query: &str, documents: &[D]) -> Vec<LaneHit> {
    if documents.is_empty() {
        return Vec::new();
    }
    let query_tokens: BTreeSet<String> = tokenize(query);
    if query_tokens.is_empty() {
        return Vec::new();
    }

    // Prefer the symbol the query actually names over shorter name-token
    // subsets (for example, SHA256 over SHA). Ambiguous anchors abstain from
    // body propagation rather than depending on document iteration order.
    let matched_body_hash = target_body(query, &query_tokens, documents);

    let mut hits = Vec::new();
    for document in documents {
        let name_tokens = tokenize(document.qualified_name());
        if name_tokens.is_empty() {
            continue;
        }

        // Name-token overlap (recall/precision blend).
        let common = query_tokens.intersection(&name_tokens).count();
        let name_score = if common > 0 {
            let recall = common as f64 / query_tokens.len().max(1) as f64;
            let precision = common as f64 / name_tokens.len().max(1) as f64;
            (recall * 0.6 + precision * 0.4) * 700_000.0
        } else {
            0.0
        };

        // Body-hash match: only when the query named a specific symbol whose
        // body we can propagate. Renamed symbols with identical bodies score.
        let body_score = match (&matched_body_hash, structural_body(document.text())) {
            (Some(target), Some(doc_hash)) if *target == doc_hash => 300_000.0,
            _ => 0.0,
        };

        let total = name_score + body_score;
        if total > 0.0 {
            hits.push(LaneHit {
                node_id: document.node_id(),
                raw_score: total.round() as u64,
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

fn target_body<D: RetrievalDocument>(
    query: &str,
    query_tokens: &BTreeSet<String>,
    documents: &[D],
) -> Option<String> {
    let normalized_query = crate::exact::normalize(query);
    let mut best_specificity = None;
    let mut matched_body = None;
    let mut ambiguous = false;
    for document in documents {
        let name_tokens = tokenize(document.qualified_name());
        let literal_match = crate::exact::normalize(document.qualified_name()) == normalized_query;
        if name_tokens.is_empty() || (!literal_match && !name_tokens.is_subset(query_tokens)) {
            continue;
        }
        let specificity = (literal_match, name_tokens.len());
        match best_specificity {
            Some(best) if specificity < best => {}
            Some(best) if specificity == best => {
                if structural_body(document.text()) != matched_body {
                    ambiguous = true;
                }
            }
            _ => {
                best_specificity = Some(specificity);
                matched_body = structural_body(document.text());
                ambiguous = false;
            }
        }
    }
    if ambiguous { None } else { matched_body }
}

/// Whitespace-normalized body hash.
fn structural_body(body: &str) -> Option<String> {
    let normalized = normalize_whitespace(body);
    if normalized.trim().is_empty() {
        return None;
    }
    Some(blake3::hash(normalized.as_bytes()).to_hex().to_string())
}

fn normalize_whitespace(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    let mut pending = false;
    for ch in value.chars() {
        if ch.is_whitespace() {
            pending = !out.is_empty();
        } else {
            if pending {
                out.push(' ');
                pending = false;
            }
            out.push(ch);
        }
    }
    out
}

fn tokenize(value: &str) -> BTreeSet<String> {
    identifier_tokens(value).into_iter().collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::graph::GraphDocument;

    fn doc(node_id: u64, name: &str, text: &str) -> GraphDocument {
        GraphDocument {
            node_id,
            qualified_name: name.to_owned(),
            path: "src/lib.rs".to_owned(),
            text: text.to_owned(),
            span: cgrx_languages::Span { start: 0, end: 10 },
            provenance: crate::graph::CandidateProvenance::Syntax,
            semantic_fingerprint: None,
        }
    }

    #[test]
    fn tokenize_splits_camel_and_path() {
        let t = tokenize("foo::BarBaz::qux");
        assert!(t.contains("foo"));
        assert!(t.contains("bar"));
        assert!(t.contains("baz"));
        assert!(t.contains("qux"));
    }

    #[test]
    fn acronym_query_matches_snake_symbol_without_unrelated_body_hits() {
        let docs = vec![
            doc(1, "http_request", "return send();"),
            doc(2, "dispatch", "return  send();"),
            doc(3, "MetricsCollector", "return collect();"),
        ];
        let expected = rank("http request", &docs);
        assert_eq!(
            expected.iter().map(|hit| hit.node_id).collect::<Vec<_>>(),
            [1, 2]
        );
        assert_eq!(rank("HTTPRequest", &docs), expected);
        assert_eq!(rank("HTTP_REQUEST", &docs), expected);
        assert!(rank("XMLParser", &docs).is_empty());
    }

    #[test]
    fn versioned_identifier_adopts_the_specific_body_in_any_document_order() {
        let mut docs = vec![
            doc(1, "SHA", "return legacy();"),
            doc(2, "SHA256", "return digest();"),
            doc(3, "legacyChecksum", "return legacy();"),
            doc(4, "digestPayload", "return digest();"),
        ];
        for query in ["SHA256", "sha 256", "find SHA256"] {
            let expected = rank(query, &docs);
            assert!(expected.iter().any(|hit| hit.node_id == 4), "{query}");
            assert!(!expected.iter().any(|hit| hit.node_id == 3), "{query}");
            docs.reverse();
            assert_eq!(rank(query, &docs), expected, "{query}");
        }
    }

    #[test]
    fn literal_name_wins_over_equivalent_token_sets() {
        let mut docs = vec![
            doc(1, "http_request", "return legacy();"),
            doc(2, "HTTPRequest", "return send();"),
            doc(3, "legacyHandler", "return legacy();"),
            doc(4, "dispatch", "return send();"),
        ];
        let expected = rank("HTTPRequest", &docs);
        assert!(expected.iter().any(|hit| hit.node_id == 4));
        assert!(!expected.iter().any(|hit| hit.node_id == 3));
        docs.reverse();
        assert_eq!(rank("HTTPRequest", &docs), expected);
    }

    #[test]
    fn lowercase_literal_queries_can_anchor_cased_identifiers() {
        let docs = vec![
            doc(1, "HTTPRequest", "return send();"),
            doc(2, "dispatch", "return send();"),
            doc(3, "MetricsCollector", "return collect();"),
        ];
        let hits = rank("httprequest", &docs);
        assert_eq!(
            hits.iter().map(|hit| hit.node_id).collect::<Vec<_>>(),
            [1, 2]
        );
    }

    #[test]
    fn equally_specific_different_bodies_do_not_propagate_ambiguous_matches() {
        let mut docs = vec![
            doc(1, "http_request", "return legacy();"),
            doc(2, "HTTPRequest", "return send();"),
            doc(3, "legacyRunner", "return legacy();"),
            doc(4, "dispatch", "return send();"),
        ];
        let expected = rank("http request handler", &docs);
        assert_eq!(
            expected.iter().map(|hit| hit.node_id).collect::<Vec<_>>(),
            [1, 2]
        );
        docs.reverse();
        assert_eq!(rank("http request handler", &docs), expected);
    }

    #[test]
    fn empty_symbol_names_cannot_anchor_an_unrelated_body() {
        let docs = vec![
            doc(1, "___", "return send();"),
            doc(2, "dispatch", "return send();"),
        ];
        assert!(rank("HTTPRequest", &docs).is_empty());
    }

    #[test]
    fn normalize_whitespace_collapses() {
        assert_eq!(normalize_whitespace("a   b\tc\n"), "a b c");
    }

    #[test]
    fn structural_body_stable_across_whitespace() {
        let a = structural_body("let x = 1;  let y = 2;");
        let b = structural_body("let x = 1; let y = 2;");
        assert_eq!(a, b);
    }

    #[test]
    fn structural_body_empty_input() {
        assert!(structural_body("   \n\t  ").is_none());
    }

    #[test]
    fn rank_finds_renamed_by_body_hash() {
        let docs = vec![
            GraphDocument {
                node_id: 1,
                qualified_name: "processData".to_string(),
                path: "a.rs".to_string(),
                text: "let x = 1; let y = 2; return x + y;".to_string(),
                span: cgrx_languages::Span { start: 0, end: 10 },
                provenance: crate::graph::CandidateProvenance::Syntax,
                semantic_fingerprint: None,
            },
            GraphDocument {
                node_id: 2,
                qualified_name: "transformValue".to_string(),
                path: "b.rs".to_string(),
                text: "let x = 1; let y = 2; return x + y;".to_string(),
                span: cgrx_languages::Span { start: 0, end: 10 },
                provenance: crate::graph::CandidateProvenance::Syntax,
                semantic_fingerprint: None,
            },
            GraphDocument {
                node_id: 3,
                qualified_name: "unrelated".to_string(),
                path: "c.rs".to_string(),
                text: "fn nothing() {}".to_string(),
                span: cgrx_languages::Span { start: 0, end: 10 },
                provenance: crate::graph::CandidateProvenance::Syntax,
                semantic_fingerprint: None,
            },
        ];
        let hits = rank("transformValue", &docs);
        let ids: Vec<u64> = hits.iter().map(|h| h.node_id).collect();
        assert!(ids.contains(&2), "exact name match should be present");
        assert!(
            ids.contains(&1),
            "renamed symbol with same body should be present"
        );
        assert!(!ids.contains(&3), "unrelated symbol should not match");
    }

    #[test]
    fn rank_negative_different_body() {
        let docs = vec![
            GraphDocument {
                node_id: 1,
                qualified_name: "calculateTotal".to_string(),
                path: "a.rs".to_string(),
                text: "let a = 5; return a * 2;".to_string(),
                span: cgrx_languages::Span { start: 0, end: 10 },
                provenance: crate::graph::CandidateProvenance::Syntax,
                semantic_fingerprint: None,
            },
            GraphDocument {
                node_id: 2,
                qualified_name: "printMessage".to_string(),
                path: "b.rs".to_string(),
                text: "console.log('hello');".to_string(),
                span: cgrx_languages::Span { start: 0, end: 10 },
                provenance: crate::graph::CandidateProvenance::Syntax,
                semantic_fingerprint: None,
            },
        ];
        let hits = rank("calculateTotal", &docs);
        let ids: Vec<u64> = hits.iter().map(|h| h.node_id).collect();
        assert!(ids.contains(&1), "exact match should be present");
        assert!(!ids.contains(&2), "different body should not match");
    }
}
