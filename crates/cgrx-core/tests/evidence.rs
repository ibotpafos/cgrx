use cgrx_core::{
    ByteRange, ConfidenceClass, EdgeEvidence, EvidenceEdge, Hash32, NodeId, RelationKind,
    ResolverClass, canonical_hash,
};

fn evidence(confidence: ConfidenceClass) -> EdgeEvidence {
    EdgeEvidence {
        path: "src/service.rs".to_owned(),
        span: ByteRange::new(12, 27),
        source_hash: Hash32([7; 32]),
        resolver: ResolverClass::SyntaxExact,
        confidence,
        assumptions: Vec::new(),
        counter_evidence: Vec::new(),
    }
}

#[test]
fn evidence_contract_serializes_with_stable_screaming_snake_case() {
    let edge = EvidenceEdge {
        source: NodeId(1),
        target: NodeId(2),
        kind: RelationKind::Calls,
        evidence: evidence(ConfidenceClass::Proven),
    };
    let value = serde_json::to_value(&edge).unwrap();
    assert_eq!(value["kind"], "CALLS");
    assert_eq!(value["evidence"]["resolver"], "SYNTAX_EXACT");
    assert_eq!(value["evidence"]["confidence"], "PROVEN");
    assert_eq!(serde_json::from_value::<EvidenceEdge>(value).unwrap(), edge);
}

#[test]
fn only_proven_evidence_is_definitive_in_slice_a() {
    assert!(evidence(ConfidenceClass::Proven).is_definitive());
    assert!(!evidence(ConfidenceClass::BoundedSet).is_definitive());
    assert!(!evidence(ConfidenceClass::Candidate).is_definitive());
    assert!(!evidence(ConfidenceClass::Unresolved).is_definitive());
}

#[test]
fn evidence_hash_changes_for_span_hash_resolver_and_counter_evidence() {
    let base = evidence(ConfidenceClass::Proven);
    let mut changed = base.clone();
    changed.counter_evidence.push(Hash32([9; 32]));
    assert_ne!(
        canonical_hash(&base).unwrap(),
        canonical_hash(&changed).unwrap()
    );
    changed = base.clone();
    changed.span = ByteRange::new(13, 27);
    assert_ne!(
        canonical_hash(&base).unwrap(),
        canonical_hash(&changed).unwrap()
    );
    changed = base.clone();
    changed.source_hash = Hash32([8; 32]);
    assert_ne!(
        canonical_hash(&base).unwrap(),
        canonical_hash(&changed).unwrap()
    );
    changed = base.clone();
    changed.resolver = ResolverClass::CompilerConfirmed;
    assert_ne!(
        canonical_hash(&base).unwrap(),
        canonical_hash(&changed).unwrap()
    );
}

#[test]
fn canonicalization_rejects_absolute_evidence_paths() {
    let mut value = evidence(ConfidenceClass::Proven);
    value.path = "/private/source.rs".to_owned();
    assert_eq!(canonical_hash(&value).unwrap_err().code(), "absolute_path");
}

#[test]
fn canonicalization_rejects_noncanonical_evidence_paths() {
    for path in [
        "../outside.rs",
        "src/../../outside.rs",
        "./src/service.rs",
        "src//service.rs",
        "src/service.rs/",
        "src\\service.rs",
        "C:outside.rs",
        "z:outside.rs",
        "",
    ] {
        let mut value = evidence(ConfidenceClass::Proven);
        value.path = path.to_owned();
        assert!(
            canonical_hash(&value).is_err(),
            "noncanonical evidence path received a canonical hash: {path:?}"
        );
    }
}
