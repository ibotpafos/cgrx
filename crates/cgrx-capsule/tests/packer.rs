use cgrx_capsule::{
    EvidencePacker, EvidenceRecord, ObligationId, PackInput, Tokenizer, packed_records_tokens,
};
use cgrx_languages::Span;
use cgrx_retrieval::{Candidate, CandidateProvenance, CandidateSet, ScoreComponents};

fn candidate(id: u64, name: &str, path: &str, score: u64) -> Candidate {
    Candidate {
        node_id: id,
        qualified_name: name.to_owned(),
        path: path.to_owned(),
        span: Span { start: 0, end: 12 },
        provenance: CandidateProvenance::Syntax,
        semantic_fingerprint: None,
        scores: ScoreComponents {
            exact: score,
            bm25: score / 2,
            graph: score / 3,
            rrf: score,
        },
        selection_reason: "test".to_owned(),
    }
}

fn record(id: u64, path: &str, neighbors: &[u64]) -> EvidenceRecord {
    EvidenceRecord {
        node_id: id,
        path: path.to_owned(),
        span_start: 0,
        span_end: 12,
        text: format!("record {id}"),
        provenance: "SYNTAX".to_owned(),
        obligation_ids: vec![ObligationId(format!("O{id}"))],
        neighbors: neighbors.to_vec(),
        uncertainty_penalty: 0,
    }
}

fn chain() -> (CandidateSet, Vec<EvidenceRecord>) {
    (
        CandidateSet {
            candidates: vec![
                candidate(3, "payment::impl", "src/impl.rs", 700_000),
                candidate(1, "billing::caller", "src/caller.rs", 1_000_000),
                candidate(2, "payment::interface", "src/interface.rs", 200_000),
                candidate(4, "unrelated", "src/unrelated.rs", 900_000),
            ],
            uncertainties: Vec::new(),
        },
        vec![
            record(4, "src/unrelated.rs", &[]),
            record(2, "src/interface.rs", &[1, 3]),
            record(3, "src/impl.rs", &[2]),
            record(1, "src/caller.rs", &[2]),
        ],
    )
}

#[test]
fn packer_keeps_required_anchor_path_connected() {
    let tokenizer = Tokenizer::o200k_base().unwrap();
    let (candidates, records) = chain();
    let result = EvidencePacker::pack(PackInput {
        candidates: &candidates,
        records,
        obligations: vec![ObligationId("O1".to_owned()), ObligationId("O3".to_owned())],
        required_anchors: vec![1, 3],
        allow_disconnected_required_anchors: false,
        tokenizer: &tokenizer,
        budget: 800,
    });

    let ids: Vec<_> = result.records.iter().map(|record| record.node_id).collect();
    assert_eq!(ids, vec![1, 2, 3]);
    assert!(result.residual.is_empty());
    assert!(result.tokens <= 800);
    assert_eq!(result.accounting.model_visible_tokens, result.tokens);
    assert_eq!(
        result.accounting.emitted_source_bytes,
        result
            .records
            .iter()
            .map(|record| record.text.len() as u64)
            .sum::<u64>()
    );
    result
        .verify_accounting()
        .expect("accounting matches records");
}

#[test]
fn packer_rejects_tampered_accounting() {
    let tokenizer = Tokenizer::o200k_base().unwrap();
    let (candidates, records) = chain();
    let mut result = EvidencePacker::pack(PackInput {
        candidates: &candidates,
        records,
        obligations: vec![ObligationId("O1".to_owned())],
        required_anchors: vec![1],
        allow_disconnected_required_anchors: false,
        tokenizer: &tokenizer,
        budget: 800,
    });
    result.accounting.emitted_source_bytes += 1;

    assert!(result.verify_accounting().is_err());
}

#[test]
fn packer_never_exceeds_budget_for_any_prefix() {
    let tokenizer = Tokenizer::o200k_base().unwrap();
    for budget in 32..=800 {
        let (candidates, records) = chain();
        let result = EvidencePacker::pack(PackInput {
            candidates: &candidates,
            records,
            obligations: vec![ObligationId("O1".to_owned())],
            required_anchors: vec![1],
            allow_disconnected_required_anchors: false,
            tokenizer: &tokenizer,
            budget,
        });
        assert!(result.tokens <= budget, "budget={budget}");
        for end in 0..=result.records.len() {
            assert!(
                packed_records_tokens(&tokenizer, &result.records[..end]) <= budget,
                "budget={budget} prefix={end}"
            );
        }
    }
}

#[test]
fn explicitly_required_disconnected_evidence_is_kept_when_enabled() {
    let tokenizer = Tokenizer::o200k_base().unwrap();
    let candidates = CandidateSet {
        candidates: vec![
            candidate(1, "first", "src/main.rs", 1_000_000),
            candidate(2, "second", "src/main.rs", 900_000),
        ],
        uncertainties: Vec::new(),
    };
    let records = vec![record(1, "src/main.rs", &[]), record(2, "src/main.rs", &[])];

    let result = EvidencePacker::pack(PackInput {
        candidates: &candidates,
        records,
        obligations: vec![ObligationId("O1".to_owned()), ObligationId("O2".to_owned())],
        required_anchors: vec![1, 2],
        allow_disconnected_required_anchors: true,
        tokenizer: &tokenizer,
        budget: 800,
    });

    assert_eq!(
        result
            .records
            .iter()
            .map(|record| record.node_id)
            .collect::<Vec<_>>(),
        vec![1, 2]
    );
}
