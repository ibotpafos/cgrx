use std::collections::BTreeSet;

use cgrx_core::RelationKind;

const MIN_BODY_TOKENS: usize = 8;
const SHINGLE_WIDTH: usize = 4;

#[derive(Clone, Debug, Eq, PartialEq)]
struct RefactorFingerprint {
    tokens: BTreeSet<String>,
    shingles: BTreeSet<String>,
    outgoing: BTreeSet<(RelationKind, u64)>,
    token_count: usize,
    eligible: bool,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
struct Similarity {
    body_tokens: u16,
    ordered_shingles: u16,
    callees: u16,
    size: u16,
    total: u16,
}

fn normalized_tokens(source: &str) -> Vec<String> {
    let chars = source.chars().collect::<Vec<_>>();
    let mut tokens = Vec::new();
    let mut index = 0;

    while index < chars.len() {
        let current = chars[index];
        let next = chars.get(index + 1).copied();

        if current.is_whitespace() {
            index += 1;
            continue;
        }
        if current == '/' && next == Some('/') {
            index += 2;
            while index < chars.len() && chars[index] != '\n' {
                index += 1;
            }
            continue;
        }
        if current == '/' && next == Some('*') {
            index += 2;
            while index + 1 < chars.len() && !(chars[index] == '*' && chars[index + 1] == '/') {
                index += 1;
            }
            index = (index + 2).min(chars.len());
            continue;
        }
        if current == '#' && next != Some('[') && (index == 0 || chars[index - 1].is_whitespace()) {
            index += 1;
            while index < chars.len() && chars[index] != '\n' {
                index += 1;
            }
            continue;
        }
        if matches!(current, '\'' | '"' | '`') {
            let delimiter = current;
            index += 1;
            while index < chars.len() {
                if chars[index] == '\\' {
                    index = (index + 2).min(chars.len());
                } else if chars[index] == delimiter {
                    index += 1;
                    break;
                } else {
                    index += 1;
                }
            }
            tokens.push("lit".to_owned());
            continue;
        }
        if current.is_ascii_digit() {
            index += 1;
            while index < chars.len()
                && (chars[index].is_ascii_alphanumeric()
                    || matches!(chars[index], '.' | '_' | '+' | '-'))
            {
                index += 1;
            }
            tokens.push("lit".to_owned());
            continue;
        }
        if is_identifier_start(current) {
            let start = index;
            index += 1;
            while index < chars.len() && is_identifier_continue(chars[index]) {
                index += 1;
            }
            let word = chars[start..index].iter().collect::<String>();
            let normalized = word.to_ascii_lowercase();
            tokens.push(if is_structural_keyword(&normalized) {
                normalized
            } else {
                "id".to_owned()
            });
            continue;
        }

        tokens.push(current.to_string());
        index += 1;
    }

    tokens
}

fn is_identifier_start(value: char) -> bool {
    value == '_' || value == '$' || value.is_alphabetic()
}

fn is_identifier_continue(value: char) -> bool {
    is_identifier_start(value) || value.is_ascii_digit()
}

fn is_structural_keyword(value: &str) -> bool {
    matches!(
        value,
        "and"
            | "async"
            | "await"
            | "break"
            | "case"
            | "catch"
            | "class"
            | "const"
            | "continue"
            | "def"
            | "defer"
            | "do"
            | "else"
            | "enum"
            | "except"
            | "false"
            | "finally"
            | "fn"
            | "for"
            | "func"
            | "function"
            | "go"
            | "if"
            | "impl"
            | "in"
            | "interface"
            | "let"
            | "loop"
            | "match"
            | "mut"
            | "nil"
            | "none"
            | "not"
            | "null"
            | "or"
            | "pass"
            | "raise"
            | "return"
            | "select"
            | "struct"
            | "switch"
            | "throw"
            | "true"
            | "try"
            | "type"
            | "var"
            | "while"
            | "with"
            | "yield"
    )
}

fn fingerprint_text(source: &str) -> RefactorFingerprint {
    let normalized = normalized_tokens(source);
    let shingles = normalized
        .windows(SHINGLE_WIDTH)
        .map(|window| window.join("\u{1f}"))
        .collect();

    RefactorFingerprint {
        tokens: normalized.iter().cloned().collect(),
        shingles,
        outgoing: BTreeSet::new(),
        token_count: normalized.len(),
        eligible: normalized.len() >= MIN_BODY_TOKENS,
    }
}

fn jaccard<T: Ord>(left: &BTreeSet<T>, right: &BTreeSet<T>) -> u16 {
    let union = left.union(right).count();
    if union == 0 {
        return 0;
    }
    ((left.intersection(right).count() * 1000) / union) as u16
}

fn similarity(left: &RefactorFingerprint, right: &RefactorFingerprint) -> Similarity {
    let body_tokens = jaccard(&left.tokens, &right.tokens);
    let ordered_shingles = jaccard(&left.shingles, &right.shingles);
    let callees = jaccard(&left.outgoing, &right.outgoing);
    let largest = left.token_count.max(right.token_count);
    let size = if largest == 0 {
        0
    } else {
        ((left.token_count.min(right.token_count) * 1000) / largest) as u16
    };
    let total = ((u32::from(body_tokens) * 35
        + u32::from(ordered_shingles) * 35
        + u32::from(callees) * 20
        + u32::from(size) * 10)
        / 100) as u16;

    Similarity {
        body_tokens,
        ordered_shingles,
        callees,
        size,
        total,
    }
}

#[cfg(test)]
mod tests {
    use super::{fingerprint_text, jaccard, normalized_tokens, similarity};

    #[test]
    fn normalization_ignores_local_spelling_and_literal_values() {
        assert_eq!(
            normalized_tokens("fn a(x: i32) { let y = x + 1; save(y); }"),
            normalized_tokens("fn b(input: i32) { let result = input + 9; save(result); }")
        );
    }

    #[test]
    fn ordered_shingles_distinguish_changed_control_flow() {
        let left = fingerprint_text("if ready { save(item); }");
        let right = fingerprint_text("while ready { save(item); }");

        assert!(jaccard(&left.shingles, &right.shingles) < 800);
    }

    #[test]
    fn tiny_bodies_are_ineligible() {
        assert!(!fingerprint_text("return value").eligible);
    }

    #[test]
    fn identical_structure_without_graph_neighbors_scores_eight_hundred() {
        let left = fingerprint_text("fn a(x: i32) { let y = x + 1; save(y); }");
        let right = fingerprint_text("fn b(input: i32) { let result = input + 9; save(result); }");

        assert_eq!(similarity(&left, &right).total, 800);
    }
}
