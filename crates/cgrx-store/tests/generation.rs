use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

use cgrx_core::{Hash32, RepoSnapshot};
use cgrx_store::{GenerationReader, GenerationWriter};

static NEXT_FIXTURE: AtomicU64 = AtomicU64::new(0);

fn fixture() -> PathBuf {
    let root = std::env::temp_dir().join(format!(
        "cgrx-store-generation-{}-{}",
        std::process::id(),
        NEXT_FIXTURE.fetch_add(1, Ordering::Relaxed)
    ));
    let _ = fs::remove_dir_all(&root);
    fs::create_dir_all(&root).unwrap();
    root
}

fn snapshot(id: u64) -> RepoSnapshot {
    RepoSnapshot {
        repo_revision: format!("revision-{id}"),
        working_tree_digest: Hash32([id as u8; 32]),
        graph_generation: id,
    }
}

fn publish(root: &Path, id: u64) {
    let mut writer = GenerationWriter::begin(root, snapshot(id)).unwrap();
    writer
        .write_segment("nodes.seg", format!("nodes-{id}").as_bytes())
        .unwrap();
    writer
        .write_segment("edges.seg", format!("edges-{id}").as_bytes())
        .unwrap();
    writer
        .write_segment("terms.fst", format!("terms-{id}").as_bytes())
        .unwrap();
    writer.validate().unwrap();
    writer.publish().unwrap();
}

#[test]
fn publication_uses_immutable_generation_layout_and_current_pointer() {
    let root = fixture();
    publish(&root, 42);

    let generation = root.join(".cgrx/generations/0000000000000042");
    assert!(generation.join("manifest.json").is_file());
    assert_eq!(
        fs::read_to_string(root.join(".cgrx/CURRENT")).unwrap(),
        "0000000000000042\n"
    );

    let reader = GenerationReader::open_current(&root).unwrap();
    assert_eq!(reader.id(), 42);
    assert_eq!(reader.snapshot(), &snapshot(42));
    assert_eq!(reader.read_segment("nodes.seg").unwrap(), b"nodes-42");
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn abandoning_build_before_pointer_swap_keeps_previous_generation() {
    let root = fixture();
    publish(&root, 41);

    let mut writer = GenerationWriter::begin(&root, snapshot(42)).unwrap();
    writer.write_segment("nodes.seg", b"nodes-42").unwrap();
    writer.write_segment("edges.seg", b"edges-42").unwrap();
    writer.write_segment("terms.fst", b"terms-42").unwrap();
    writer.validate().unwrap();
    drop(writer);

    assert_eq!(GenerationReader::open_current(&root).unwrap().id(), 41);
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn reader_rejects_a_corrupt_manifest_before_segment_access() {
    let root = fixture();
    publish(&root, 7);
    fs::write(
        root.join(".cgrx/generations/0000000000000007/nodes.seg"),
        b"tampered",
    )
    .unwrap();

    let error = GenerationReader::open_current(&root).unwrap_err();
    assert_eq!(error.kind(), std::io::ErrorKind::InvalidData);
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn writer_rejects_invalid_segment_names_and_incomplete_manifests() {
    let root = fixture();
    let mut writer = GenerationWriter::begin(&root, snapshot(9)).unwrap();
    assert!(writer.write_segment("../escape", b"bad").is_err());
    writer.write_segment("nodes.seg", b"nodes").unwrap();
    assert!(writer.validate().is_err());
    fs::remove_dir_all(root).unwrap();
}

fn original_segments() -> [(&'static str, &'static [u8]); 3] {
    [
        ("nodes.seg", b"nodes-41"),
        ("edges.seg", b"edges-41"),
        ("terms.fst", b"terms-41"),
    ]
}

#[test]
fn reactivation_validates_content_and_preserves_immutable_bytes() {
    let root = fixture();
    publish(&root, 41);
    publish(&root, 42);
    let manifest = root.join(".cgrx/generations/0000000000000041/manifest.json");
    let before = fs::read(&manifest).unwrap();
    GenerationWriter::reactivate(&root, &snapshot(41), &original_segments()).unwrap();
    assert_eq!(GenerationReader::open_current(&root).unwrap().id(), 41);
    assert_eq!(fs::read(manifest).unwrap(), before);
    assert!(GenerationWriter::begin(&root, snapshot(41)).is_err());
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn repeated_same_generation_begin_reports_typed_collision_then_reactivates() {
    let root = fixture();
    publish(&root, 41);
    let generation = root.join(".cgrx/generations/0000000000000041");
    let manifest_before = fs::read(generation.join("manifest.json")).unwrap();

    for _ in 0..3 {
        let error = GenerationWriter::begin(&root, snapshot(41)).err().unwrap();
        assert_eq!(error.kind(), std::io::ErrorKind::AlreadyExists);
        assert_eq!(
            error.to_string(),
            "generation is immutable and already exists"
        );
        GenerationWriter::reactivate(&root, &snapshot(41), &original_segments()).unwrap();
        let reader = GenerationReader::open_current(&root).unwrap();
        assert_eq!(reader.id(), 41);
        assert_eq!(reader.read_segment("nodes.seg").unwrap(), b"nodes-41");
    }

    assert_eq!(
        fs::read(generation.join("manifest.json")).unwrap(),
        manifest_before,
        "idempotent reactivation must not rewrite immutable generation bytes"
    );
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn same_generation_collision_never_accepts_different_snapshot_or_bytes() {
    let root = fixture();
    publish(&root, 41);
    let before = fs::read(root.join(".cgrx/generations/0000000000000041/manifest.json")).unwrap();
    assert_eq!(
        GenerationWriter::begin(&root, snapshot(41))
            .err()
            .unwrap()
            .kind(),
        std::io::ErrorKind::AlreadyExists
    );

    let mut different_snapshot = snapshot(41);
    different_snapshot.repo_revision = "different-revision".to_owned();
    let snapshot_error =
        GenerationWriter::reactivate(&root, &different_snapshot, &original_segments()).unwrap_err();
    assert_eq!(snapshot_error.kind(), std::io::ErrorKind::InvalidData);

    let mut different_segments = original_segments();
    different_segments[0].1 = b"different-nodes";
    let content_error =
        GenerationWriter::reactivate(&root, &snapshot(41), &different_segments).unwrap_err();
    assert_eq!(content_error.kind(), std::io::ErrorKind::InvalidData);
    assert_eq!(GenerationReader::open_current(&root).unwrap().id(), 41);
    assert_eq!(
        fs::read(root.join(".cgrx/generations/0000000000000041/manifest.json")).unwrap(),
        before
    );
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn reactivation_rejects_collision_corruption_and_bad_segment_sets() {
    for kind in ["snapshot", "bytes", "corrupt", "duplicate", "missing"] {
        let root = fixture();
        publish(&root, 41);
        publish(&root, 42);
        let mut expected = original_segments().to_vec();
        let mut snap = snapshot(41);
        match kind {
            "snapshot" => snap.repo_revision = "different".into(),
            "bytes" => expected[0].1 = b"not-original",
            "corrupt" => fs::write(
                root.join(".cgrx/generations/0000000000000041/nodes.seg"),
                b"corrupt",
            )
            .unwrap(),
            "duplicate" => expected[0].0 = "edges.seg",
            "missing" => {
                expected.pop();
            }
            _ => unreachable!(),
        }
        assert!(
            GenerationWriter::reactivate(&root, &snap, &expected).is_err(),
            "{kind}"
        );
        assert_eq!(
            GenerationReader::open_current(&root).unwrap().id(),
            42,
            "{kind}"
        );
        fs::remove_dir_all(root).unwrap();
    }
}

#[test]
fn reactivation_recovers_lost_current_and_abandoned_pointer_temp() {
    let root = fixture();
    publish(&root, 41);
    fs::remove_file(root.join(".cgrx/CURRENT")).unwrap();
    fs::write(root.join(".cgrx/CURRENT.tmp"), b"partial").unwrap();
    GenerationWriter::reactivate(&root, &snapshot(41), &original_segments()).unwrap();
    assert_eq!(GenerationReader::open_current(&root).unwrap().id(), 41);
    assert!(!root.join(".cgrx/CURRENT.tmp").exists());
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn reactivation_crash_child() {
    let Ok(root) = std::env::var("CGRX_REACTIVATE_TEST_ROOT") else {
        return;
    };
    let event = std::env::var("CGRX_REACTIVATE_TEST_EVENT").unwrap();
    GenerationWriter::reactivate_with_crash(
        root,
        &snapshot(41),
        &original_segments(),
        Some(cgrx_store::CrashInjection::decode(&event).unwrap()),
    )
    .unwrap();
    panic!("crash event not reached");
}

#[test]
fn reactivation_crashes_leave_old_or_new_complete_generation() {
    use cgrx_store::{CrashInjection, CrashSite};
    let mut events: Vec<_> = (1..=17).map(CrashInjection::current_byte).collect();
    for site in [
        CrashSite::CurrentTempFsynced,
        CrashSite::CurrentRenamed,
        CrashSite::StoreDirectoryFsynced,
    ] {
        events.push(CrashInjection::operation(site));
    }
    for event in events {
        let root = fixture();
        publish(&root, 41);
        publish(&root, 42);
        let status = std::process::Command::new(std::env::current_exe().unwrap())
            .args(["--exact", "reactivation_crash_child"])
            .env("CGRX_REACTIVATE_TEST_ROOT", &root)
            .env("CGRX_REACTIVATE_TEST_EVENT", event.encode())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .status()
            .unwrap();
        assert_eq!(status.code(), Some(86), "{}", event.encode());
        let reader = GenerationReader::open_current(&root).unwrap();
        assert!([41, 42].contains(&reader.id()));
        assert_eq!(
            reader.read_segment("nodes.seg").unwrap(),
            format!("nodes-{}", reader.id()).as_bytes()
        );
        GenerationWriter::reactivate(&root, &snapshot(41), &original_segments()).unwrap();
        assert_eq!(GenerationReader::open_current(&root).unwrap().id(), 41);
        fs::remove_dir_all(root).unwrap();
    }
}

#[test]
fn writer_lock_prevents_live_temporary_deletion() {
    let root = fixture();
    let mut first = GenerationWriter::begin(&root, snapshot(41)).unwrap();
    first.write_segment("nodes.seg", b"sentinel").unwrap();
    let second = GenerationWriter::begin(&root, snapshot(41));
    assert!(second.is_err(), "second writer must not enter");
    assert_eq!(
        fs::read(root.join(".cgrx/generations/.0000000000000041.tmp/nodes.seg")).unwrap(),
        b"sentinel"
    );
    drop(first);
    assert!(GenerationWriter::begin(&root, snapshot(41)).is_ok());
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn writer_lock_guards_reactivation_but_not_readers_or_other_stores() {
    let root = fixture();
    let other = fixture();
    publish(&root, 41);
    let held = GenerationWriter::begin(&root, snapshot(42)).unwrap();
    let error =
        GenerationWriter::reactivate(&root, &snapshot(41), &original_segments()).unwrap_err();
    assert_eq!(error.kind(), std::io::ErrorKind::WouldBlock);
    assert_eq!(GenerationReader::open_current(&root).unwrap().id(), 41);
    assert!(GenerationWriter::begin(&other, snapshot(1)).is_ok());
    drop(held);
    GenerationWriter::reactivate(&root, &snapshot(41), &original_segments()).unwrap();
    fs::remove_dir_all(root).unwrap();
    fs::remove_dir_all(other).unwrap();
}

#[test]
fn writer_lock_holder_child() {
    let Ok(root) = std::env::var("CGRX_WRITER_TEST_ROOT") else {
        return;
    };
    let mut writer = GenerationWriter::begin(&root, snapshot(41)).unwrap();
    writer
        .write_segment("nodes.seg", b"child-sentinel")
        .unwrap();
    fs::write(Path::new(&root).join("ready"), b"ready").unwrap();
    let mut input = String::new();
    std::io::stdin().read_line(&mut input).unwrap();
    assert_eq!(input.trim(), "release");
    drop(writer);
}

#[test]
fn writer_lock_cross_process_releases_after_exit_and_kill() {
    use std::io::Write;
    use std::time::{Duration, Instant};
    for kill in [false, true] {
        let root = fixture();
        let mut child = std::process::Command::new(std::env::current_exe().unwrap())
            .args(["--exact", "writer_lock_holder_child"])
            .env("CGRX_WRITER_TEST_ROOT", &root)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .unwrap();
        let deadline = Instant::now() + Duration::from_secs(5);
        while !root.join("ready").is_file() && Instant::now() < deadline {
            std::thread::sleep(Duration::from_millis(5));
        }
        if !root.join("ready").is_file() {
            let _ = child.kill();
            let _ = child.wait();
            panic!("child did not acquire lock");
        }
        // Always reap the child before assertions so failures cannot orphan it.
        let attempt = GenerationWriter::begin(&root, snapshot(41));
        let sentinel = fs::read(root.join(".cgrx/generations/.0000000000000041.tmp/nodes.seg"));
        if kill {
            child.kill().unwrap();
        } else {
            child.stdin.take().unwrap().write_all(b"release\n").unwrap();
        }
        let status = child.wait().unwrap();
        if !kill {
            assert!(status.success());
        }
        assert!(attempt.is_err(), "concurrent writer entered");
        assert_eq!(
            attempt.err().unwrap().kind(),
            std::io::ErrorKind::WouldBlock
        );
        assert_eq!(sentinel.unwrap(), b"child-sentinel");
        assert!(GenerationWriter::begin(&root, snapshot(41)).is_ok());
        assert!(root.join(".cgrx/WRITER.lock").is_file());
        fs::remove_dir_all(root).unwrap();
    }
}
