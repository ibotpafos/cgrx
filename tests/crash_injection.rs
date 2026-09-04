use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, ExitStatus, Stdio};
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};

use cgrx_core::{Hash32, RepoSnapshot};
use cgrx_store::{CrashInjection, CrashSite, GenerationReader, GenerationWriter};

const CHILD_EXIT: i32 = 86;
const CURRENT_BYTES: usize = 17;

fn snapshot(id: u64) -> RepoSnapshot {
    RepoSnapshot {
        repo_revision: format!("revision-{id}"),
        working_tree_digest: Hash32([id as u8; 32]),
        graph_generation: id,
    }
}

fn build(root: &Path, id: u64, injection: Option<CrashInjection>) -> std::io::Result<()> {
    let mut writer = GenerationWriter::begin(root, snapshot(id))?;
    writer.write_segment("nodes.seg", format!("nodes-{id}").as_bytes())?;
    writer.write_segment("edges.seg", format!("edges-{id}").as_bytes())?;
    writer.write_segment("terms.fst", format!("terms-{id}").as_bytes())?;
    writer.validate()?;
    if let Some(injection) = injection {
        writer.set_crash_injection(injection);
    }
    writer.publish()
}

fn injection_events() -> Vec<CrashInjection> {
    let mut events = vec![
        CrashInjection::operation(CrashSite::SegmentsFsynced),
        CrashInjection::operation(CrashSite::ManifestFsynced),
        CrashInjection::operation(CrashSite::GenerationTempDirectoryFsynced),
        CrashInjection::operation(CrashSite::GenerationValidated),
        CrashInjection::operation(CrashSite::GenerationRenamed),
        CrashInjection::operation(CrashSite::GenerationsDirectoryFsynced),
        CrashInjection::operation(CrashSite::CurrentTempFsynced),
        CrashInjection::operation(CrashSite::CurrentRenamed),
        CrashInjection::operation(CrashSite::StoreDirectoryFsynced),
    ];
    events.extend((1..=CURRENT_BYTES).map(CrashInjection::current_byte));
    events
}

fn fixture(name: &str) -> PathBuf {
    let root = std::env::temp_dir().join(format!("cgrx-crash-{name}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    fs::create_dir_all(&root).unwrap();
    root
}

fn clone_template(template: &Path, destination: &Path) {
    let source_generation = template.join(".cgrx/generations/0000000000000001");
    let destination_generation = destination.join(".cgrx/generations/0000000000000001");
    fs::create_dir_all(&destination_generation).unwrap();
    for name in ["manifest.json", "nodes.seg", "edges.seg", "terms.fst"] {
        fs::hard_link(
            source_generation.join(name),
            destination_generation.join(name),
        )
        .unwrap();
    }
    fs::copy(
        template.join(".cgrx/CURRENT"),
        destination.join(".cgrx/CURRENT"),
    )
    .unwrap();
}

fn run_helper(test: &str, root: &Path, injection: Option<&CrashInjection>) -> ExitStatus {
    let mut command = Command::new(std::env::current_exe().unwrap());
    command
        .arg("--exact")
        .arg(test)
        .arg("--ignored")
        .arg("--nocapture")
        .env("CGRX_CRASH_CHILD_ROOT", root)
        .env("CGRX_CRASH_HELPER", "1")
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    if let Some(injection) = injection {
        command.env("CGRX_CRASH_EVENT", injection.encode());
    }
    command.status().unwrap()
}

#[test]
fn crash_event_table_has_explicit_unique_round_trippable_identities() {
    let events = injection_events();
    let identities = events
        .iter()
        .map(CrashInjection::encode)
        .collect::<BTreeSet<_>>();
    assert_eq!(events.len(), 26);
    assert_eq!(identities.len(), events.len());
    for event in events {
        assert_eq!(CrashInjection::decode(&event.encode()).unwrap(), event);
    }
    assert!(CrashInjection::decode("current_byte_written:0").is_err());
    assert!(CrashInjection::decode("current_byte_written:18").is_err());
    assert!(CrashInjection::decode("unknown").is_err());
}

#[test]
#[ignore = "subprocess helper"]
fn crash_trial_child() {
    if std::env::var_os("CGRX_CRASH_HELPER").is_none() {
        return;
    }
    let root = PathBuf::from(std::env::var_os("CGRX_CRASH_CHILD_ROOT").unwrap());
    let injection = CrashInjection::decode(&std::env::var("CGRX_CRASH_EVENT").unwrap()).unwrap();
    build(&root, 2, Some(injection)).expect("configured crash event must terminate first");
    panic!("configured crash event did not terminate the child");
}

#[test]
#[ignore = "subprocess helper"]
fn crash_validation_child() {
    if std::env::var_os("CGRX_CRASH_HELPER").is_none() {
        return;
    }
    let root = PathBuf::from(std::env::var_os("CGRX_CRASH_CHILD_ROOT").unwrap());
    let reader = GenerationReader::open_current(&root).unwrap();
    let id = reader.id();
    assert!(
        id == 1 || id == 2,
        "CURRENT must resolve to strictly old or fully valid new"
    );
    assert_eq!(reader.snapshot(), &snapshot(id));
    for (name, prefix) in [
        ("nodes.seg", "nodes"),
        ("edges.seg", "edges"),
        ("terms.fst", "terms"),
    ] {
        assert_eq!(
            reader.read_segment(name).unwrap(),
            format!("{prefix}-{id}").as_bytes()
        );
    }
    fs::write(root.join("VALIDATION"), format!("valid_generation={id}\n")).unwrap();
}

#[test]
#[ignore = "10,000 deterministic subprocess crash trials"]
fn ten_thousand_subprocess_crash_trials_publish_only_complete_generations() {
    let trials: usize = std::env::var("CGRX_CRASH_POINTS")
        .expect("CGRX_CRASH_POINTS must be set")
        .parse()
        .expect("CGRX_CRASH_POINTS must be an integer");
    assert_eq!(trials, 10_000);

    let events = injection_events();
    assert_eq!(events.len(), 9 + CURRENT_BYTES);
    let mut event_counts = BTreeMap::<String, usize>::new();
    for trial in 0..trials {
        let event_index = trial * events.len() / trials;
        *event_counts
            .entry(events[event_index].encode())
            .or_default() += 1;
    }
    let template = fixture("template");
    build(&template, 1, None).unwrap();
    let trials_root = fixture("trials");

    let events = Arc::new(events);
    let template = Arc::new(template);
    let trials_root = Arc::new(trials_root);
    let corrupt_published_generations = Arc::new(AtomicU64::new(0));
    let mixed_revision_results = Arc::new(AtomicU64::new(0));
    let completed_trials = Arc::new(AtomicUsize::new(0));
    let workers = std::thread::available_parallelism()
        .map_or(8, usize::from)
        .clamp(8, 32);

    let mut handles = Vec::with_capacity(workers);
    for worker in 0..workers {
        let events = Arc::clone(&events);
        let template = Arc::clone(&template);
        let trials_root = Arc::clone(&trials_root);
        let corrupt = Arc::clone(&corrupt_published_generations);
        let mixed = Arc::clone(&mixed_revision_results);
        let completed = Arc::clone(&completed_trials);
        handles.push(std::thread::spawn(move || {
            for trial in (worker..trials).step_by(workers) {
                // Evenly partition the declared trial count over the explicit event table. This
                // repeats events truthfully; no arbitrary ordinal aliases through modulo.
                let event_index = trial * events.len() / trials;
                let injection = &events[event_index];
                let root = trials_root.join(format!("{trial:05}"));
                clone_template(&template, &root);

                let crashed = run_helper("crash_trial_child", &root, Some(injection));
                if crashed.code() != Some(CHILD_EXIT) {
                    corrupt.fetch_add(1, Ordering::Relaxed);
                }
                let validated = run_helper("crash_validation_child", &root, None);
                if !validated.success() {
                    corrupt.fetch_add(1, Ordering::Relaxed);
                } else {
                    let result = fs::read_to_string(root.join("VALIDATION")).unwrap();
                    if result != "valid_generation=1\n" && result != "valid_generation=2\n" {
                        mixed.fetch_add(1, Ordering::Relaxed);
                    }
                }
                fs::remove_dir_all(root).unwrap();
                completed.fetch_add(1, Ordering::Relaxed);
            }
        }));
    }
    for handle in handles {
        handle.join().unwrap();
    }

    let corrupt_published_generations = corrupt_published_generations.load(Ordering::Relaxed);
    let mixed_revision_results = mixed_revision_results.load(Ordering::Relaxed);

    println!("crash_trials={trials}");
    println!("unique_injection_events={}", event_counts.len());
    println!("operation_sites=9");
    println!("current_byte_boundaries={CURRENT_BYTES}");
    println!("corrupt_published_generations={corrupt_published_generations}");
    println!("mixed_revision_results={mixed_revision_results}");
    assert_eq!(event_counts.len(), events.len());
    assert_eq!(completed_trials.load(Ordering::Relaxed), trials);
    assert!(
        event_counts
            .values()
            .all(|count| *count >= 384 && *count <= 385)
    );
    assert_eq!(corrupt_published_generations, 0);
    assert_eq!(mixed_revision_results, 0);

    fs::remove_dir_all(&*template).unwrap();
    fs::remove_dir_all(&*trials_root).unwrap();
}
