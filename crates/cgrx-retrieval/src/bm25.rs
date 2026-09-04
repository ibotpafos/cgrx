use crate::fusion::LaneHit;
use crate::graph::GraphDocument;
use std::collections::{BTreeMap, BTreeSet};

pub(crate) fn rank(query: &str, documents: &[GraphDocument]) -> Vec<LaneHit> {
    let query_tokens = tokenize(query);
    if query_tokens.is_empty() || documents.is_empty() {
        return Vec::new();
    }
    let tokenized: Vec<Vec<String>> = documents
        .iter()
        .map(|document| {
            let mut value = tokenize(&document.qualified_name);
            value.extend(tokenize(&document.path));
            value.extend(tokenize(&document.text));
            value
        })
        .collect();
    let average_length =
        tokenized.iter().map(Vec::len).sum::<usize>() as f64 / tokenized.len().max(1) as f64;
    let mut document_frequency = BTreeMap::<&str, usize>::new();
    for tokens in &tokenized {
        let unique: BTreeSet<_> = tokens.iter().map(String::as_str).collect();
        for token in unique {
            *document_frequency.entry(token).or_default() += 1;
        }
    }
    let count = documents.len() as f64;
    let mut hits = Vec::new();
    for (document, tokens) in documents.iter().zip(&tokenized) {
        let mut score = 0.0_f64;
        for query_token in &query_tokens {
            let term_frequency = tokens.iter().filter(|token| *token == query_token).count() as f64;
            if term_frequency == 0.0 {
                continue;
            }
            let frequency = *document_frequency.get(query_token.as_str()).unwrap_or(&0) as f64;
            let inverse = (1.0 + (count - frequency + 0.5) / (frequency + 0.5)).ln();
            let denominator = term_frequency
                + 1.2 * (1.0 - 0.75 + 0.75 * tokens.len() as f64 / average_length.max(1.0));
            score += inverse * (term_frequency * 2.2 / denominator);
        }
        if score > 0.0 {
            hits.push(LaneHit {
                node_id: document.node_id,
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

pub(crate) fn tokenize(value: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut current = String::new();
    let mut previous_lowercase = false;
    for character in value.chars() {
        if character.is_alphanumeric() {
            if character.is_uppercase() && previous_lowercase && !current.is_empty() {
                tokens.push(current.to_lowercase());
                current.clear();
            }
            previous_lowercase = character.is_lowercase();
            current.extend(character.to_lowercase());
        } else {
            if !current.is_empty() {
                tokens.push(std::mem::take(&mut current));
            }
            previous_lowercase = false;
        }
    }
    if !current.is_empty() {
        tokens.push(current);
    }
    tokens
}
