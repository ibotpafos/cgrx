use std::cell::Cell;
use std::collections::{BTreeMap, HashSet};

use cgrx_core::{
    CapsuleStatus, CoreError, Edge, Hash32, Mode, NodeId, QueryRequest, RelationKind, RepoSnapshot,
    Scope, canonical_hash,
};
use serde::Serialize;
use serde::ser::SerializeMap;

#[derive(Clone)]
struct OrderedObject(Vec<(&'static str, u64)>);

impl Serialize for OrderedObject {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut map = serializer.serialize_map(Some(self.0.len()))?;
        for (key, value) in &self.0 {
            map.serialize_entry(key, value)?;
        }
        map.end()
    }
}

fn digest(byte: u8) -> Hash32 {
    Hash32([byte; 32])
}

fn snapshot(revision: &str, digest_byte: u8, generation: u64) -> RepoSnapshot {
    RepoSnapshot {
        repo_revision: revision.to_owned(),
        working_tree_digest: digest(digest_byte),
        graph_generation: generation,
    }
}

#[test]
fn canonical_hash_ignores_map_insertion_order() {
    let forward = OrderedObject(vec![("alpha", 1), ("beta", 2), ("gamma", 3)]);
    let reverse = OrderedObject(vec![("gamma", 3), ("beta", 2), ("alpha", 1)]);

    assert_eq!(
        canonical_hash(&forward).unwrap(),
        canonical_hash(&reverse).unwrap()
    );
}

#[test]
fn canonical_hash_is_stable_for_1000_permutations() {
    let mut permutation = vec![
        ("alpha", 1),
        ("beta", 2),
        ("delta", 4),
        ("epsilon", 5),
        ("eta", 7),
        ("gamma", 3),
        ("zeta", 6),
    ];
    let expected = canonical_hash(&OrderedObject(permutation.clone())).unwrap();
    let mut distinct = HashSet::new();

    for _ in 0..1000 {
        assert!(distinct.insert(permutation.clone()));
        assert_eq!(
            canonical_hash(&OrderedObject(permutation.clone())).unwrap(),
            expected
        );
        assert!(next_permutation(&mut permutation));
    }

    assert_eq!(distinct.len(), 1000);
}

fn next_permutation<T: Ord>(values: &mut [T]) -> bool {
    let Some(pivot) = (0..values.len() - 1)
        .rev()
        .find(|&index| values[index] < values[index + 1])
    else {
        return false;
    };
    let successor = (pivot + 1..values.len())
        .rev()
        .find(|&index| values[pivot] < values[index])
        .unwrap();
    values.swap(pivot, successor);
    values[pivot + 1..].reverse();
    true
}

#[test]
fn canonical_hash_rejects_every_float_kind() {
    for value in [0.0, 1.5, f64::NAN, f64::INFINITY, f64::NEG_INFINITY] {
        assert_eq!(canonical_hash(&value).unwrap_err().code(), "floating_point");
    }
}

#[test]
fn canonical_hash_rejects_absolute_path_strings_everywhere() {
    let cases = [
        serde_json::json!("/private/tmp/source.rs"),
        serde_json::json!(["safe", "/private/tmp/source.rs"]),
        serde_json::json!(["unknown", ["C:\\temp\\source.rs"]]),
        serde_json::json!({"unknown_field": "C:/temp/source.rs"}),
        serde_json::json!({"unknown_field": "\\\\server\\share\\source.rs"}),
        serde_json::json!({"/absolute/object/key": "relative-value"}),
    ];

    for value in cases {
        assert_eq!(canonical_hash(&value).unwrap_err().code(), "absolute_path");
    }
}

#[test]
fn canonical_hash_accepts_relative_paths() {
    let value = serde_json::json!({"unknown": ["src/lib.rs", "C:relative\\file.rs"]});
    canonical_hash(&value).unwrap();
}

#[test]
fn canonical_hash_serializes_input_exactly_once() {
    struct Counted<'a>(&'a Cell<u8>);

    impl Serialize for Counted<'_> {
        fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
        where
            S: serde::Serializer,
        {
            self.0.set(self.0.get() + 1);
            "relative/value".serialize(serializer)
        }
    }

    let serializations = Cell::new(0);
    canonical_hash(&Counted(&serializations)).unwrap();
    assert_eq!(serializations.get(), 1);
}

#[test]
fn hash32_uses_exact_lowercase_hex_json_and_round_trips() {
    let hash = digest(0xab);
    let expected = format!("\"{}\"", "ab".repeat(32));

    let json = serde_json::to_string(&hash).unwrap();
    assert_eq!(json, expected);
    assert_eq!(serde_json::from_str::<Hash32>(&json).unwrap(), hash);
}

#[test]
fn hash32_rejects_malformed_hex_length_and_characters() {
    for malformed in [
        format!("\"{}\"", "ab".repeat(31)),
        format!("\"{}\"", "ab".repeat(33)),
        format!("\"{}ag\"", "ab".repeat(31)),
        format!("\"{}aA\"", "ab".repeat(31)),
    ] {
        assert!(serde_json::from_str::<Hash32>(&malformed).is_err());
    }
}

#[test]
fn snapshots_reject_mixed_revision() {
    let error = snapshot("abc", 1, 7)
        .assert_compatible(&snapshot("def", 1, 7))
        .unwrap_err();
    assert_eq!(error.code(), "mixed_revision");
}

#[test]
fn snapshots_reject_mixed_working_tree_digest() {
    let error = snapshot("abc", 1, 7)
        .assert_compatible(&snapshot("abc", 2, 7))
        .unwrap_err();
    assert_eq!(error.code(), "mixed_working_tree_digest");
}

#[test]
fn snapshots_reject_mixed_generation() {
    let error = snapshot("abc", 1, 7)
        .assert_compatible(&snapshot("abc", 1, 8))
        .unwrap_err();
    assert_eq!(error.code(), "mixed_generation");
}

#[test]
fn snapshots_accept_matching_revision_digest_and_generation() {
    let value = snapshot("abc", 1, 7);
    assert_eq!(value.assert_compatible(&value), Ok(()));
}

#[test]
fn public_contracts_are_minimal_and_serializable() {
    let scope = Scope {
        include: vec!["src/**".to_owned()],
        exclude: vec!["target/**".to_owned()],
        relation_kinds: vec![RelationKind::Calls, RelationKind::Implements],
        max_depth: 3,
    };
    let request = QueryRequest {
        task: "find callers".to_owned(),
        scope,
        mode: Mode::Bounded,
        token_budget: 800,
    };
    let edge = Edge {
        source: NodeId(1),
        target: NodeId(2),
        kind: RelationKind::Calls,
    };
    let statuses = [
        CapsuleStatus::CompleteBounded,
        CapsuleStatus::Partial,
        CapsuleStatus::Stale,
        CapsuleStatus::BudgetExhausted,
        CapsuleStatus::NoExtraContext,
    ];

    let mut value = BTreeMap::new();
    value.insert("request", serde_json::to_value(request).unwrap());
    value.insert("edge", serde_json::to_value(edge).unwrap());
    value.insert("statuses", serde_json::to_value(statuses).unwrap());
    canonical_hash(&value).unwrap();
}

#[test]
fn core_error_is_a_typed_standard_error() {
    fn assert_error<T: std::error::Error>() {}
    assert_error::<CoreError>();
}
