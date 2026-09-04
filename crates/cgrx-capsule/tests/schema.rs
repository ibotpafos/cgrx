use cgrx_capsule::{
    CapsuleError, ObligationId, QbecV1, RccAnchor, RccRecord, RccV1, ResidualObligation, Tokenizer,
    to_canonical_json, verify_hashes, wire_schema_json,
};
use cgrx_core::{CapsuleStatus, Hash32, RelationKind, RepoSnapshot, Scope};

fn snapshot(generation: u64) -> RepoSnapshot {
    RepoSnapshot {
        repo_revision: "0123456789abcdef".to_owned(),
        working_tree_digest: Hash32([7; 32]),
        graph_generation: generation,
    }
}

fn scope() -> Scope {
    Scope {
        include: vec!["src/**".to_owned()],
        exclude: vec!["vendor/**".to_owned()],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 5,
    }
}

fn residual(reason: &str) -> ResidualObligation {
    ResidualObligation {
        obligation_id: ObligationId("O3".to_owned()),
        kind: "ACCOUNT_DYNAMIC_DISPATCH".to_owned(),
        reason: reason.to_owned(),
        expansion_handle: Some("symbol:billing::charge".to_owned()),
    }
}

fn capsule() -> RccV1 {
    RccV1 {
        capsule_version: "rcc/1".to_owned(),
        snapshot: snapshot(7),
        scope: scope(),
        anchors: vec![RccAnchor {
            node_id: 1,
            qualified_name: "billing::charge".to_owned(),
            path: "src/billing.rs".to_owned(),
            span_start: 10,
            span_end: 42,
        }],
        records: vec![RccRecord {
            node_id: 1,
            path: "src/billing.rs".to_owned(),
            span_start: 10,
            span_end: 42,
            text: "fn charge() {}".to_owned(),
            provenance: "SYNTAX".to_owned(),
        }],
        residual: vec![residual("runtime receiver type unresolved")],
        expansion_handles: vec!["symbol:billing::charge".to_owned()],
        tokenizer: "o200k_base".to_owned(),
        capsule_tokens: 0,
        capsule_hash: Hash32([0; 32]),
    }
}

fn certificate() -> QbecV1 {
    QbecV1 {
        certificate_version: "qbec/1".to_owned(),
        query_hash: Hash32([3; 32]),
        snapshot: snapshot(7),
        scope: scope(),
        discharged: vec![ObligationId("O1".to_owned())],
        residual: vec![residual("runtime receiver type unresolved")],
        status: CapsuleStatus::Partial,
        tokenizer: "o200k_base".to_owned(),
        capsule_tokens: 0,
        capsule_hash: Hash32([0; 32]),
    }
}

#[test]
fn qbec_hash_changes_when_snapshot_or_residual_changes() {
    let original = certificate();
    let mut snapshot_changed = original.clone();
    snapshot_changed.snapshot.graph_generation += 1;
    let mut residual_changed = original.clone();
    residual_changed.residual[0].reason.push_str(" after probe");

    assert_ne!(
        cgrx_core::canonical_hash(&original).unwrap(),
        cgrx_core::canonical_hash(&snapshot_changed).unwrap()
    );
    assert_ne!(
        cgrx_core::canonical_hash(&original).unwrap(),
        cgrx_core::canonical_hash(&residual_changed).unwrap()
    );
}

#[test]
fn canonical_and_compact_records_are_stable_and_hash_verified() {
    let tokenizer = Tokenizer::o200k_base().unwrap();
    let sealed = capsule().seal(&tokenizer, 800).unwrap();
    let certificate = certificate().bind_capsule(&sealed);

    let canonical = sealed.to_canonical_json().unwrap();
    assert_eq!(canonical, to_canonical_json(&sealed).unwrap());
    assert_eq!(canonical, sealed.to_canonical_json().unwrap());
    assert!(sealed.to_compact().unwrap().starts_with("[\"rcc/1\""));
    assert_eq!(sealed.capsule_tokens, tokenizer.count(&canonical));
    verify_hashes(&sealed, &certificate).unwrap();
}

#[test]
fn schema_and_capsule_token_gates() {
    let tokenizer = Tokenizer::o200k_base().unwrap();
    let schema = wire_schema_json();
    let schema_tokens = tokenizer.count(schema);
    println!("schema_tokens={schema_tokens}");
    assert!(schema_tokens <= 500);

    let sealed = capsule().seal(&tokenizer, 800).unwrap();
    println!("capsule_tokens={}", sealed.capsule_tokens);
    assert!(sealed.capsule_tokens <= 800);

    let mut oversized = capsule();
    oversized.records[0].text = "token ".repeat(2_000);
    let original = oversized.records[0].text.clone();
    assert!(matches!(
        oversized.clone().seal(&tokenizer, 32),
        Err(CapsuleError::BudgetExceeded { budget: 32, .. })
    ));
    assert_eq!(oversized.records[0].text, original);
}
