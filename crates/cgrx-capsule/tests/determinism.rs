mod common {
    use cgrx_capsule::{EvidenceRecord, ObligationId};
    use cgrx_languages::Span;
    use cgrx_retrieval::{Candidate, CandidateProvenance, CandidateSet, ScoreComponents};

    pub fn fixture() -> (CandidateSet, Vec<EvidenceRecord>) {
        let mut candidates = Vec::new();
        let mut records = Vec::new();
        for id in 1..=8_u64 {
            candidates.push(Candidate {
                semantic_fingerprint: None,

                node_id: id,
                qualified_name: format!("graph::node{id}"),
                path: format!("src/{id}.rs"),
                span: Span { start: 0, end: 8 },
                provenance: CandidateProvenance::Syntax,
                scores: ScoreComponents {
                    exact: id * 10,
                    bm25: id * 20,
                    graph: id * 30,
                    structural: id * 40,
                    rrf: id * 100,
                },
                selection_reason: "fixture".to_owned(),
            });
            let mut neighbors = Vec::new();
            if id > 1 {
                neighbors.push(id - 1);
            }
            if id < 8 {
                neighbors.push(id + 1);
            }
            records.push(EvidenceRecord {
                node_id: id,
                path: format!("src/{id}.rs"),
                span_start: 0,
                span_end: 8,
                text: format!("node {id}"),
                provenance: "SYNTAX".to_owned(),
                obligation_ids: vec![ObligationId(format!("O{}", id % 3))],
                neighbors,
                uncertainty_penalty: (id % 2) as u32,
            });
        }
        (
            CandidateSet {
                candidates,
                uncertainties: Vec::new(),
            },
            records,
        )
    }
}

use cgrx_capsule::{EvidencePacker, ObligationId, PackInput, Tokenizer, to_canonical_json};
use cgrx_core::canonical_hash;

#[test]
fn packer_hash_is_stable_across_one_thousand_shuffled_inputs() {
    let tokenizer = Tokenizer::o200k_base().unwrap();
    let (base_candidates, base_records) = common::fixture();
    let expected = EvidencePacker::pack(PackInput {
        candidates: &base_candidates,
        records: base_records.clone(),
        obligations: vec![ObligationId("O1".to_owned())],
        required_anchors: vec![1, 8],
        allow_disconnected_required_anchors: false,
        tokenizer: &tokenizer,
        budget: 800,
    });
    let expected_hash = canonical_hash(&expected).unwrap();
    let expected_json = to_canonical_json(&expected).unwrap();

    let mut seed = 0x9e37_79b9_u64;
    for _ in 0..1_000 {
        let mut candidates = base_candidates.clone();
        let mut records = base_records.clone();
        shuffle(&mut candidates.candidates, &mut seed);
        shuffle(&mut records, &mut seed);
        let actual = EvidencePacker::pack(PackInput {
            candidates: &candidates,
            records,
            obligations: vec![ObligationId("O1".to_owned())],
            required_anchors: vec![8, 1],
            allow_disconnected_required_anchors: false,
            tokenizer: &tokenizer,
            budget: 800,
        });
        assert_eq!(canonical_hash(&actual).unwrap(), expected_hash);
        assert_eq!(to_canonical_json(&actual).unwrap(), expected_json);
    }
}

fn shuffle<T>(values: &mut [T], seed: &mut u64) {
    for index in (1..values.len()).rev() {
        *seed ^= *seed << 13;
        *seed ^= *seed >> 7;
        *seed ^= *seed << 17;
        values.swap(index, (*seed as usize) % (index + 1));
    }
}
