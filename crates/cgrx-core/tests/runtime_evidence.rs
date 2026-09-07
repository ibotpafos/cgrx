use cgrx_core::{EvidenceSelector, NormalizedBatch, NormalizedObservation, RuntimeEndpoint};

const REVISION: &str = "0123456789abcdef0123456789abcdef01234567";

fn endpoint(function: &str) -> RuntimeEndpoint {
    RuntimeEndpoint {
        function: function.to_owned(),
        file: Some("src/main.rs".to_owned()),
        line: Some(1),
    }
}

fn observation(caller: &str, callee: &str) -> NormalizedObservation {
    NormalizedObservation {
        caller: endpoint(caller),
        callee: endpoint(callee),
        first_seen_unix_nanos: 42,
        last_seen_unix_nanos: 42,
        count: 1,
    }
}

#[test]
fn batch_identity_ignores_input_order_but_includes_environment() {
    let left = NormalizedBatch::new(
        REVISION,
        "test",
        vec![observation("a", "b"), observation("b", "c")],
    )
    .unwrap();
    let right = NormalizedBatch::new(
        REVISION,
        "test",
        vec![observation("b", "c"), observation("a", "b")],
    )
    .unwrap();
    let production = NormalizedBatch::new(
        REVISION,
        "production",
        vec![observation("a", "b"), observation("b", "c")],
    )
    .unwrap();

    assert_eq!(
        left.canonical_id("repo").unwrap(),
        right.canonical_id("repo").unwrap()
    );
    assert_ne!(
        left.canonical_id("repo").unwrap(),
        production.canonical_id("repo").unwrap()
    );
}

#[test]
fn batch_merges_duplicate_observations_without_overflow() {
    let mut first = observation("a", "b");
    first.count = u64::MAX;
    first.first_seen_unix_nanos = 10;
    first.last_seen_unix_nanos = 10;
    let mut second = observation("a", "b");
    second.count = 2;
    second.first_seen_unix_nanos = 20;
    second.last_seen_unix_nanos = 20;

    let batch = NormalizedBatch::new(REVISION, "test", vec![second, first]).unwrap();

    assert_eq!(batch.observations.len(), 1);
    assert_eq!(batch.observations[0].count, u64::MAX);
    assert_eq!(batch.observations[0].first_seen_unix_nanos, 10);
    assert_eq!(batch.observations[0].last_seen_unix_nanos, 20);
}

#[test]
fn batch_rejects_invalid_revision_empty_names_and_zero_count() {
    assert!(NormalizedBatch::new("main", "test", vec![observation("a", "b")]).is_err());
    assert!(NormalizedBatch::new(REVISION, "test", vec![observation("", "b")]).is_err());
    let mut zero = observation("a", "b");
    zero.count = 0;
    assert!(NormalizedBatch::new(REVISION, "test", vec![zero]).is_err());
}

#[test]
fn evidence_selector_defaults_to_static_and_has_stable_json_names() {
    assert_eq!(EvidenceSelector::default(), EvidenceSelector::Static);
    assert_eq!(
        serde_json::to_string(&EvidenceSelector::Observed).unwrap(),
        "\"observed\""
    );
    assert_eq!(
        serde_json::from_str::<EvidenceSelector>("\"all\"").unwrap(),
        EvidenceSelector::All
    );
}
