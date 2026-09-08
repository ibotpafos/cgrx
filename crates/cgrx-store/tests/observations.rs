use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};

use cgrx_core::{Hash32, RepoSnapshot, ResolutionKind};
use cgrx_store::{ObservationCrashSite, ObservationStore, ResolvedBatch, ResolvedObservation};

const REVISION: &str = "0123456789abcdef0123456789abcdef01234567";

fn temp_root(label: &str) -> PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let path = std::env::temp_dir().join(format!(
        "cgrx-observations-{label}-{}-{nonce}",
        std::process::id()
    ));
    fs::create_dir_all(&path).unwrap();
    path
}

fn snapshot() -> RepoSnapshot {
    RepoSnapshot {
        repo_revision: REVISION.to_owned(),
        working_tree_digest: Hash32([7; 32]),
        graph_generation: 17,
    }
}

fn observation(count: u64, first: u64, last: u64) -> ResolvedObservation {
    ResolvedObservation {
        source: 11,
        target: 12,
        count,
        first_seen_unix_nanos: first,
        last_seen_unix_nanos: last,
        source_resolution: ResolutionKind::PathLine,
        target_resolution: ResolutionKind::Fqn,
        semantic_fingerprint: None,
    }
}

fn batch(id: u8, count: u64, first: u64, last: u64) -> ResolvedBatch {
    ResolvedBatch {
        batch_id: Hash32([id; 32]),
        snapshot: snapshot(),
        environment: "test".to_owned(),
        observations: vec![observation(count, first, last)],
        unresolved: 0,
        ambiguous: 0,
    }
}

fn revision_bytes(root: &Path) -> Vec<u8> {
    fs::read(
        root.join(".cgrx/observations/by-revision")
            .join(format!("{REVISION}.snapshot.json")),
    )
    .unwrap()
}

#[test]
fn repeated_batch_is_a_byte_stable_no_op() {
    let root = temp_root("idempotent");
    let store = ObservationStore::open(&root).unwrap();

    let first = store.publish(&batch(1, 2, 10, 20)).unwrap();
    let before = revision_bytes(&root);
    let second = store.publish(&batch(1, 2, 10, 20)).unwrap();

    assert!(!first.duplicate);
    assert!(second.duplicate);
    assert_eq!(first.batch_id, second.batch_id);
    assert_eq!(before, revision_bytes(&root));
}

#[test]
fn different_batches_merge_counts_timestamps_and_batch_provenance() {
    let root = temp_root("merge");
    let store = ObservationStore::open(&root).unwrap();
    store.publish(&batch(1, 2, 20, 30)).unwrap();
    store.publish(&batch(2, 5, 10, 40)).unwrap();

    let loaded = store.load(REVISION).unwrap().unwrap();

    assert_eq!(loaded.edges.len(), 1);
    assert_eq!(loaded.edges[0].count, 7);
    assert_eq!(loaded.edges[0].first_seen_unix_nanos, 10);
    assert_eq!(loaded.edges[0].last_seen_unix_nanos, 40);
    assert_eq!(
        loaded.edges[0].batch_ids,
        vec![Hash32([1; 32]), Hash32([2; 32])]
    );
    assert_eq!(loaded.edges[0].additional_batches, 0);
}

#[test]
fn corrupted_observation_snapshot_fails_closed() {
    let root = temp_root("corrupt");
    let store = ObservationStore::open(&root).unwrap();
    store.publish(&batch(1, 2, 10, 20)).unwrap();
    let path = root
        .join(".cgrx/observations/by-revision")
        .join(format!("{REVISION}.snapshot.json"));
    fs::write(path, b"{bad").unwrap();

    assert_eq!(
        store.load(REVISION).unwrap_err().kind(),
        std::io::ErrorKind::InvalidData
    );
}

#[test]
fn status_and_dry_run_prune_are_non_mutating() {
    let root = temp_root("status");
    let store = ObservationStore::open(&root).unwrap();
    store.publish(&batch(1, 2, 10, 20)).unwrap();
    let before = revision_bytes(&root);

    let status = store.status(Some(REVISION)).unwrap();
    let prune = store.prune_before(1, true).unwrap();

    assert_eq!(status.batches, 1);
    assert_eq!(status.edges, 1);
    assert_eq!(prune.removed_batches, 0);
    assert_eq!(before, revision_bytes(&root));
}

#[test]
fn rejected_mixed_snapshot_does_not_publish_an_orphan_batch() {
    let root = temp_root("mixed-snapshot");
    let store = ObservationStore::open(&root).unwrap();
    store.publish(&batch(1, 2, 10, 20)).unwrap();
    let mut incompatible = batch(2, 1, 30, 30);
    incompatible.snapshot.graph_generation = 18;

    assert_eq!(
        store.publish(&incompatible).unwrap_err().kind(),
        std::io::ErrorKind::InvalidData
    );
    assert_eq!(
        fs::read_dir(root.join(".cgrx/observations/batches"))
            .unwrap()
            .count(),
        1
    );
    assert_eq!(store.status(Some(REVISION)).unwrap().batches, 1);
}

#[test]
#[ignore = "subprocess helper"]
fn observation_crash_child() {
    if std::env::var_os("CGRX_OBSERVATION_CRASH_CHILD").is_none() {
        return;
    }
    let root = PathBuf::from(std::env::var_os("CGRX_OBSERVATION_CRASH_ROOT").unwrap());
    let site = match std::env::var("CGRX_OBSERVATION_CRASH_SITE")
        .unwrap()
        .as_str()
    {
        "batch_fsynced" => ObservationCrashSite::BatchFsynced,
        "snapshot_fsynced" => ObservationCrashSite::SnapshotFsynced,
        "snapshot_renamed" => ObservationCrashSite::SnapshotRenamed,
        other => panic!("unknown crash site {other}"),
    };
    let mut store = ObservationStore::open(&root).unwrap();
    store.set_crash_injection(site);
    store
        .publish(&batch(2, 5, 30, 40))
        .expect("configured crash site must terminate the child");
}

#[test]
fn crashes_expose_the_old_or_new_complete_observation_snapshot() {
    for (name, site) in [
        ("batch_fsynced", ObservationCrashSite::BatchFsynced),
        ("snapshot_fsynced", ObservationCrashSite::SnapshotFsynced),
        ("snapshot_renamed", ObservationCrashSite::SnapshotRenamed),
    ] {
        let root = temp_root(name);
        ObservationStore::open(&root)
            .unwrap()
            .publish(&batch(1, 2, 10, 20))
            .unwrap();
        let status = Command::new(std::env::current_exe().unwrap())
            .arg("--exact")
            .arg("observation_crash_child")
            .arg("--ignored")
            .arg("--nocapture")
            .env("CGRX_OBSERVATION_CRASH_CHILD", "1")
            .env("CGRX_OBSERVATION_CRASH_ROOT", &root)
            .env("CGRX_OBSERVATION_CRASH_SITE", name)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .unwrap();
        assert_eq!(
            status.code(),
            Some(86),
            "{site:?} did not crash at its site"
        );
        let snapshot = ObservationStore::open(&root)
            .unwrap()
            .load(REVISION)
            .unwrap()
            .unwrap();
        assert!(
            snapshot.edges[0].count == 2 || snapshot.edges[0].count == 7,
            "{site:?} exposed a partial aggregate"
        );
        assert!(snapshot.batch_ids.len() == 1 || snapshot.batch_ids.len() == 2);
    }
}
