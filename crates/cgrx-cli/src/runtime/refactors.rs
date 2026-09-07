mod strategies;

use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;

use cgrx_core::RelationKind;
use cgrx_core::Scope;
use serde_json::{Value, json};

use super::{
    Runtime, RuntimeError, StoredArc, StoredDocument, coverage_for_scope, coverage_gap_count,
    coverage_gap_page, definitive_stored_arcs, pack_for_path, path_in_scope,
};

const MIN_BODY_TOKENS: usize = 8;
const SHINGLE_WIDTH: usize = 4;
const DOCUMENT_LIMIT: usize = 20_000;
const PAIR_LIMIT: usize = 100_000;
const EVIDENCE_LIMIT: usize = 2_000;

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

fn is_callable_candidate(language: &str, source: &str) -> bool {
    let tokens = normalized_tokens(source);
    match language {
        "rust" => has_block_after_keyword(&tokens, "fn"),
        "go" => has_block_after_keyword(&tokens, "func"),
        "python" => tokens.iter().any(|token| token == "def"),
        "java" => source.contains('(') && source.contains('{'),
        "typescript" => {
            let declares_container = tokens
                .iter()
                .any(|token| matches!(token.as_str(), "class" | "enum" | "interface" | "type"));
            tokens.iter().any(|token| token == "function")
                || source.contains("=>")
                || (!declares_container && source.contains('(') && source.contains('{'))
        }
        _ => false,
    }
}

fn has_block_after_keyword(tokens: &[String], keyword: &str) -> bool {
    tokens.iter().enumerate().any(|(index, token)| {
        token == keyword
            && tokens[index + 1..]
                .iter()
                .take_while(|token| token.as_str() != ";")
                .any(|token| token == "{")
    })
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

struct CandidateDocument<'a> {
    document: &'a StoredDocument,
    language: &'static str,
    fingerprint: RefactorFingerprint,
}

struct RefactorCandidate<'a> {
    left: &'a CandidateDocument<'a>,
    right: &'a CandidateDocument<'a>,
    similarity: Similarity,
}

impl Runtime {
    pub fn suggest_refactors(
        &self,
        scope: &Scope,
        language: Option<&str>,
        min_score: u16,
        limit: usize,
    ) -> Result<Value, RuntimeError> {
        let language = language.map(str::trim);
        if language
            .is_some_and(|value| !matches!(value, "typescript" | "go" | "java" | "python" | "rust"))
            || min_score > 1000
            || !(1..=50).contains(&limit)
        {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "language must be typescript, go, java, python, or rust; min_score must be 0..1000; limit must be 1..50",
            ));
        }

        let definitive = definitive_stored_arcs(&self.stored, scope);
        let mut outgoing = BTreeMap::<u64, BTreeSet<(RelationKind, u64)>>::new();
        for arc in &definitive {
            outgoing
                .entry(arc.source)
                .or_default()
                .insert((arc.kind, arc.target));
        }

        let mut selected = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX" && path_in_scope(&document.path, scope)
            })
            .filter_map(|document| {
                let document_language = pack_for_path(Path::new(&document.path))?.id();
                (language.is_none_or(|expected| expected == document_language)
                    && is_callable_candidate(document_language, &document.search_text))
                .then_some((document, document_language))
            })
            .collect::<Vec<_>>();
        selected.sort_by_key(|(document, _)| {
            (
                document.path.as_str(),
                document.span_start,
                document.span_end,
                document.node_id,
            )
        });

        let mut gaps = BTreeSet::new();
        let mut partial = selected.len() > DOCUMENT_LIMIT;
        if partial {
            gaps.insert("REFACTOR_DOCUMENT_BUDGET");
            selected.truncate(DOCUMENT_LIMIT);
        }

        let documents = selected
            .into_iter()
            .map(|(document, document_language)| {
                let mut fingerprint = fingerprint_text(&document.search_text);
                fingerprint.outgoing = outgoing.remove(&document.node_id).unwrap_or_default();
                CandidateDocument {
                    document,
                    language: document_language,
                    fingerprint,
                }
            })
            .collect::<Vec<_>>();

        let mut buckets = BTreeMap::<(&str, &str), Vec<usize>>::new();
        for (index, document) in documents.iter().enumerate() {
            if !document.fingerprint.eligible {
                continue;
            }
            for shingle in &document.fingerprint.shingles {
                buckets
                    .entry((document.language, shingle))
                    .or_default()
                    .push(index);
            }
        }
        let mut ordered_buckets = buckets.into_iter().collect::<Vec<_>>();
        ordered_buckets.sort_by(|left, right| {
            left.1
                .len()
                .cmp(&right.1.len())
                .then_with(|| left.0.cmp(&right.0))
        });

        let mut pairs = BTreeSet::new();
        'buckets: for (_, members) in ordered_buckets {
            for (offset, left) in members.iter().enumerate() {
                for right in members.iter().skip(offset + 1) {
                    let pair = (*left.min(right), *left.max(right));
                    if !pairs.contains(&pair) && pairs.len() >= PAIR_LIMIT {
                        partial = true;
                        gaps.insert("REFACTOR_PAIR_BUDGET");
                        break 'buckets;
                    }
                    pairs.insert(pair);
                }
            }
        }

        let inspected_pairs = pairs.len();
        let mut candidates = pairs
            .into_iter()
            .filter_map(|(left_index, right_index)| {
                let left = &documents[left_index];
                let right = &documents[right_index];
                let score = similarity(&left.fingerprint, &right.fingerprint);
                (score.total >= min_score && (score.callees > 0 || score.ordered_shingles >= 820))
                    .then_some(RefactorCandidate {
                        left,
                        right,
                        similarity: score,
                    })
            })
            .collect::<Vec<_>>();
        candidates.sort_by(|left, right| {
            rank_similarity(right.similarity)
                .cmp(&rank_similarity(left.similarity))
                .then_with(|| candidate_identity(left).cmp(&candidate_identity(right)))
        });

        let total = candidates.len();
        if total > limit {
            partial = true;
            gaps.insert("RESULT_LIMIT");
        }
        candidates.truncate(limit);

        let by_node = self
            .stored
            .documents
            .iter()
            .filter(|document| document.provenance == "SYNTAX")
            .map(|document| (document.node_id, document))
            .collect::<BTreeMap<_, _>>();
        let observations = self.load_current_observations()?;
        let mut evidence_count = 0;
        let mut values = Vec::with_capacity(candidates.len());
        for candidate in candidates {
            let (mut value, evidence_truncated) = candidate_json(
                &candidate,
                &definitive,
                &by_node,
                self.snapshot(),
                &mut evidence_count,
            );
            if evidence_truncated {
                partial = true;
                gaps.insert("REFACTOR_EVIDENCE_BUDGET");
            }
            value["runtime_profile"] =
                runtime_profile(&candidate, observations.as_ref(), &definitive);
            values.push(value);
        }

        let coverage = coverage_for_scope(&self.stored.coverage, scope);
        let index_gap_count = coverage_gap_count(&coverage);
        partial |= index_gap_count > 0;
        let mut coverage_gaps = coverage_gap_page(&coverage, 0, 20);
        coverage_gaps.extend(gaps.iter().map(|code| json!({"code":code})));
        let coverage_gap_count = index_gap_count + gaps.len();
        for candidate in &mut values {
            candidate["strategies"] =
                strategies::derive(candidate, self.snapshot(), &coverage_gaps, partial).into();
        }

        Ok(json!({
            "snapshot":self.snapshot(),
            "kind":"refactor_candidates",
            "status":"hypothetical",
            "candidates":values,
            "total":total,
            "truncated":total > limit,
            "partial":partial,
            "coverage_gaps":coverage_gaps,
            "coverage_gap_count":coverage_gap_count,
            "coverage_gaps_truncated":index_gap_count > 20,
            "inspected_documents":documents.len(),
            "inspected_pairs":inspected_pairs,
            "limitations":[
                "Candidates require review; structural similarity is not proof that code should be merged.",
                "Projections are hypothetical and never mutate source or the stored graph.",
                "Empty results apply only to the inspected scope, language, threshold, and budgets."
            ]
        }))
    }
}

fn runtime_profile(
    candidate: &RefactorCandidate<'_>,
    observations: Option<&cgrx_store::ObservationSnapshot>,
    definitive: &[&StoredArc],
) -> Value {
    let left = candidate.left.document.node_id;
    let right = candidate.right.document.node_id;
    let static_pairs = definitive
        .iter()
        .map(|arc| (arc.source, arc.target))
        .collect::<BTreeSet<_>>();
    let mut left_incoming_count = 0_u64;
    let mut duplicate_incoming_count = 0_u64;
    let mut candidate_outgoing_count = 0_u64;
    let mut observed_only_edges = 0_usize;
    let mut last_seen_unix_nanos = 0_u64;
    let mut environments = BTreeSet::new();
    for edge in observations
        .into_iter()
        .flat_map(|snapshot| &snapshot.edges)
    {
        if ![left, right].contains(&edge.source) && ![left, right].contains(&edge.target) {
            continue;
        }
        if edge.target == left {
            left_incoming_count = left_incoming_count.saturating_add(edge.count);
        }
        if edge.target == right {
            duplicate_incoming_count = duplicate_incoming_count.saturating_add(edge.count);
        }
        if edge.source == left || edge.source == right {
            candidate_outgoing_count = candidate_outgoing_count.saturating_add(edge.count);
        }
        if !static_pairs.contains(&(edge.source, edge.target)) {
            observed_only_edges += 1;
        }
        last_seen_unix_nanos = last_seen_unix_nanos.max(edge.last_seen_unix_nanos);
        environments.insert(edge.environment.clone());
    }
    json!({
        "left_incoming_count":left_incoming_count,
        "duplicate_incoming_count":duplicate_incoming_count,
        "candidate_outgoing_count":candidate_outgoing_count,
        "observed_only_edges":observed_only_edges,
        "last_seen_unix_nanos":last_seen_unix_nanos,
        "environments":environments,
        "evidence_revision":observations.map(|snapshot| &snapshot.snapshot.repo_revision),
    })
}

fn rank_similarity(similarity: Similarity) -> (u16, u16, u16, u16, u16) {
    (
        similarity.total,
        similarity.ordered_shingles,
        similarity.body_tokens,
        similarity.callees,
        similarity.size,
    )
}

fn candidate_identity<'a>(
    candidate: &'a RefactorCandidate<'a>,
) -> (&'a str, usize, &'a str, usize) {
    (
        candidate.left.document.path.as_str(),
        candidate.left.document.span_start,
        candidate.right.document.path.as_str(),
        candidate.right.document.span_start,
    )
}

fn candidate_json(
    candidate: &RefactorCandidate<'_>,
    definitive: &[&StoredArc],
    by_node: &BTreeMap<u64, &StoredDocument>,
    snapshot: &cgrx_core::RepoSnapshot,
    evidence_count: &mut usize,
) -> (Value, bool) {
    let left = candidate.left.document;
    let right = candidate.right.document;
    let shared = candidate
        .left
        .fingerprint
        .outgoing
        .intersection(&candidate.right.fingerprint.outgoing)
        .copied()
        .collect::<Vec<_>>();
    let projection_id = projection_id(snapshot, left.node_id, right.node_id);
    let helper = json!({
        "id":format!("virtual:{projection_id}:helper"),
        "symbol":format!("shared_{}_{}", left.qualified_name, right.qualified_name),
        "status":"hypothetical"
    });

    let mut evidence_truncated = false;
    let mut included_shared = Vec::new();
    let mut shared_callees = Vec::new();
    for (relation, target) in &shared {
        let Some(target_document) = by_node.get(target) else {
            continue;
        };
        let proofs = definitive
            .iter()
            .filter(|arc| {
                arc.kind == *relation
                    && arc.target == *target
                    && (arc.source == left.node_id || arc.source == right.node_id)
            })
            .filter_map(|arc| arc.evidence.as_ref())
            .collect::<Vec<_>>();
        if !reserve_evidence(evidence_count, proofs.len(), EVIDENCE_LIMIT) {
            evidence_truncated = true;
            continue;
        }
        included_shared.push((*relation, *target));
        shared_callees.push(json!({
            "relation":relation,
            "target":node_json(target_document),
            "confidence":"PROVEN",
            "evidence":proofs
        }));
    }

    let mut preserve = Vec::new();
    for arc in definitive
        .iter()
        .filter(|arc| arc.target == left.node_id || arc.target == right.node_id)
    {
        if !reserve_evidence(evidence_count, 1, EVIDENCE_LIMIT) {
            evidence_truncated = true;
            continue;
        }
        if let Some(value) = edge_json(arc, by_node) {
            preserve.push(value);
        }
    }
    let add = [left, right]
        .into_iter()
        .map(|document| {
            json!({
                "relation":"CALLS",
                "source":node_json(document),
                "target":helper,
                "confidence":"hypothetical"
            })
        })
        .collect::<Vec<_>>();
    let move_to_helper = included_shared
        .iter()
        .filter_map(|(relation, target)| {
            by_node.get(target).map(|target_document| {
                json!({
                    "relation":relation,
                    "from":[node_json(left),node_json(right)],
                    "source":helper,
                    "target":node_json(target_document),
                    "confidence":"hypothetical"
                })
            })
        })
        .collect::<Vec<_>>();

    let projection = json!({
        "id":projection_id,
        "status":"hypothetical",
        "helper":helper,
        "preserve":preserve,
        "add":add,
        "move_to_helper":move_to_helper,
        "remove":[]
    });
    (
        json!({
            "kind":"extract_shared_helper",
            "confidence":"candidate",
            "language":candidate.left.language,
            "left":node_json(left),
            "right":node_json(right),
            "similarity":{
                "body_tokens":candidate.similarity.body_tokens,
                "ordered_shingles":candidate.similarity.ordered_shingles,
                "callees":candidate.similarity.callees,
                "size":candidate.similarity.size,
                "total":candidate.similarity.total
            },
            "shared_callees":shared_callees,
            "projection":projection
        }),
        evidence_truncated,
    )
}

fn reserve_evidence(used: &mut usize, requested: usize, limit: usize) -> bool {
    let Some(next) = used.checked_add(requested) else {
        return false;
    };
    if next > limit {
        return false;
    }
    *used = next;
    true
}

fn node_json(document: &StoredDocument) -> Value {
    json!({
        "node_id":document.node_id,
        "path":document.path,
        "symbol":document.qualified_name,
        "span":{"start":document.span_start,"end":document.span_end}
    })
}

fn edge_json(arc: &StoredArc, by_node: &BTreeMap<u64, &StoredDocument>) -> Option<Value> {
    Some(json!({
        "relation":arc.kind,
        "source":node_json(by_node.get(&arc.source)?),
        "target":node_json(by_node.get(&arc.target)?),
        "confidence":"PROVEN",
        "evidence":arc.evidence
    }))
}

fn projection_id(
    snapshot: &cgrx_core::RepoSnapshot,
    left_node_id: u64,
    right_node_id: u64,
) -> String {
    let (left_node_id, right_node_id) = (
        left_node_id.min(right_node_id),
        left_node_id.max(right_node_id),
    );
    let encoded = serde_json::to_vec(&json!({
        "snapshot":snapshot,
        "left":left_node_id,
        "right":right_node_id
    }))
    .expect("snapshot and node identity serialize");
    let digest = blake3::hash(&encoded).to_hex().to_string();
    format!("refactor1.{}", &digest[..16])
}

#[cfg(test)]
mod tests {
    use super::{
        Similarity, fingerprint_text, is_callable_candidate, jaccard, normalized_tokens,
        rank_similarity, reserve_evidence, similarity,
    };

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

    #[test]
    fn evidence_budget_keeps_proof_groups_atomic() {
        let mut used = 1_998;
        assert!(reserve_evidence(&mut used, 2, 2_000));
        assert_eq!(used, 2_000);

        assert!(!reserve_evidence(&mut used, 1, 2_000));
        assert_eq!(used, 2_000);
    }

    #[test]
    fn total_score_has_priority_when_ranking_candidates() {
        let higher_total = Similarity {
            body_tokens: 800,
            ordered_shingles: 800,
            callees: 800,
            size: 800,
            total: 800,
        };
        let lower_total = Similarity {
            body_tokens: 900,
            ordered_shingles: 500,
            callees: 500,
            size: 500,
            total: 700,
        };

        assert!(rank_similarity(higher_total) > rank_similarity(lower_total));
    }

    #[test]
    fn non_callable_declarations_are_not_refactor_candidates() {
        for (language, source) in [
            ("rust", "struct Entry { value: usize }"),
            ("rust", "trait Entry { fn run(); }"),
            ("go", "type Entry struct { Value int }"),
            ("python", "class Entry:\n    pass"),
            ("java", "final class Entry { int value; }"),
            ("typescript", "interface Entry { value: number }"),
            ("typescript", "@sealed class Entry { run() {} }"),
        ] {
            assert!(!is_callable_candidate(language, source), "{language}");
        }
        for (language, source) in [
            ("rust", "fn run() {}"),
            ("go", "func run() {}"),
            ("python", "async def run():\n    pass"),
            ("java", "int run() { return 1; }"),
            ("typescript", "constructor() {}"),
            ("typescript", "const run = () => 1"),
        ] {
            assert!(is_callable_candidate(language, source), "{language}");
        }
    }
}
