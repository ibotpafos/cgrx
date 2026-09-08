use crate::fusion::LaneHit;
use crate::graph::GraphDocument;
use std::collections::BTreeSet;

/// Deterministic structural-fingerprint lane. Finds symbols whose normalized
/// body matches the body of the symbol named in the query — catches renamed
/// or lightly rewritten duplicates. No external models: the signal is
/// structural only (name tokens + normalized body hash).
pub(crate) fn rank(query: &str, documents: &[GraphDocument]) -> Vec<LaneHit> {
    if documents.is_empty() {
        return Vec::new();
    }
    let query_tokens: BTreeSet<String> = tokenize(query);
    if query_tokens.is_empty() {
        return Vec::new();
    }

    // If the query names a known symbol, adopt its body hash as the target.
    let matched_body_hash = documents
        .iter()
        .find(|doc| tokenize(&document_key(doc)).is_subset(&query_tokens))
        .and_then(|doc| structural_body(&doc.text));

    let mut hits = Vec::new();
    for document in documents {
        let name_tokens = tokenize(&document.qualified_name);
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
        let body_score = match (&matched_body_hash, structural_body(&document.text)) {
            (Some(target), Some(doc_hash)) if *target == doc_hash => 300_000.0,
            _ => 0.0,
        };

        let total = name_score + body_score;
        if total > 0.0 {
            hits.push(LaneHit {
                node_id: document.node_id,
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

/// Stable key for matching query to a document's identity.
fn document_key(document: &GraphDocument) -> String {
    document.qualified_name.clone()
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
    let mut tokens = BTreeSet::new();
    let mut current = String::new();
    let mut prev_lower = false;
    for ch in value.chars() {
        if ch.is_alphanumeric() {
            if ch.is_uppercase() && prev_lower && !current.is_empty() {
                tokens.insert(current.to_lowercase());
                current.clear();
            }
            prev_lower = ch.is_lowercase();
            current.extend(ch.to_lowercase());
        } else if !current.is_empty() {
            tokens.insert(std::mem::take(&mut current));
            prev_lower = false;
        }
    }
    if !current.is_empty() {
        tokens.insert(current);
    }
    tokens
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tokenize_splits_camel_and_path() {
        let t = tokenize("foo::BarBaz::qux");
        assert!(t.contains("foo"));
        assert!(t.contains("bar"));
        assert!(t.contains("baz"));
        assert!(t.contains("qux"));
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
