#![cfg(unix)]

//! A separate executable keeps intentional raw forks away from other memory tests.

use std::{
    fs, io,
    path::PathBuf,
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
};

use cgrx_store::{
    AgentMemoryInput, AgentMemoryPublication, AgentMemoryQuery, AgentMemoryRecord, DecisionRecord,
    MemoryKind, MemoryProvenance, MemoryRecallQuery, MemoryRecordInput, MemorySourceKind,
    MemoryStore, MemoryWriteUncertain,
};

const NOW: u64 = 1_800_000_000_000_000_000;

struct Fixture(PathBuf);

impl Drop for Fixture {
    fn drop(&mut self) {
        if std::thread::panicking() {
            eprintln!("preserving failed recovery fixture: {}", self.0.display());
            return;
        }
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn input(store: &MemoryStore, fact: String) -> AgentMemoryInput {
    AgentMemoryInput {
        decision: MemoryRecordInput {
            fact,
            confidence: 800,
            provenance: MemoryProvenance {
                repo: store.root().to_string_lossy().into_owned(),
                rev: "fork-regression".to_owned(),
                path: String::new(),
                span: None,
            },
            valid_until_unix_nanos: None,
            privacy_tag: None,
        },
        memory_kind: MemoryKind::Semantic,
        source_kind: MemorySourceKind::Agent,
        source_ref: Some("isolated fork regression".to_owned()),
        task_id: None,
        event_id: None,
        code_link: None,
    }
}

fn retry_prewrite_busy<T>(mut operation: impl FnMut() -> io::Result<T>) -> io::Result<T> {
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(5);
    loop {
        match operation() {
            Err(error)
                if error.kind() == io::ErrorKind::WouldBlock
                    && error
                        .get_ref()
                        .and_then(|error| error.downcast_ref::<MemoryWriteUncertain>())
                        .is_none()
                    && std::time::Instant::now() < deadline =>
            {
                std::thread::sleep(std::time::Duration::from_millis(5));
            }
            outcome => return outcome,
        }
    }
}

fn write_during_forks<T>(
    mut operation: impl FnMut() -> io::Result<T>,
    stop: &AtomicBool,
    quiet: &AtomicBool,
) -> io::Result<T> {
    let outcome = retry_prewrite_busy(&mut operation);
    if let Err(error) = &outcome
        && error.kind() == io::ErrorKind::WouldBlock
        && error
            .get_ref()
            .and_then(|error| error.downcast_ref::<MemoryWriteUncertain>())
            .is_none()
    {
        // Continuous fork inheritance can starve an SDK writer handoff before
        // any logical write starts. End the deliberate interference after the
        // bounded retry window; this outcome is safe to retry, unlike uncertainty.
        eprintln!("prewrite busy deadline reached; quiescing intentional forks");
        stop_forks(stop, quiet);
        return retry_prewrite_busy(operation);
    }
    outcome
}

fn query(id: Option<String>) -> AgentMemoryQuery {
    AgentMemoryQuery {
        recall: MemoryRecallQuery {
            query: None,
            min_confidence: 0,
            privacy_tag: None,
            revision: None,
            limit: 50,
            now_unix_nanos: NOW + 2,
        },
        memory_kind: None,
        task_id: None,
        path: None,
        symbol: None,
        include_stale: true,
        id,
        include_history: false,
    }
}

fn stop_forks(stop: &AtomicBool, quiet: &AtomicBool) {
    stop.store(true, Ordering::Release);
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(2);
    while !quiet.load(Ordering::Acquire) {
        assert!(
            std::time::Instant::now() < deadline,
            "fork interference did not stop"
        );
        std::thread::sleep(std::time::Duration::from_millis(5));
    }
}

fn quiesce(error: &io::Error, stop: &AtomicBool, quiet: &AtomicBool) -> String {
    let uncertain = error
        .get_ref()
        .and_then(|error| error.downcast_ref::<MemoryWriteUncertain>())
        .unwrap_or_else(|| panic!("expected an unconfirmed write outcome, received {error:?}"));
    stop_forks(stop, quiet);
    uncertain.id.clone()
}

fn reconcile_record(
    outcome: io::Result<AgentMemoryPublication>,
    store: &MemoryStore,
    stop: &AtomicBool,
    quiet: &AtomicBool,
) -> AgentMemoryRecord {
    match outcome {
        Ok(publication) => {
            assert!(
                !publication.duplicate,
                "a prewrite busy retry cannot replay a record"
            );
            publication.record
        }
        Err(error) => {
            let id = quiesce(&error, stop, quiet);
            let query = query(Some(id));
            let mut records = retry_prewrite_busy(|| store.agent_recall(&query))
                .unwrap()
                .results;
            assert_eq!(records.len(), 1, "the original WAL must remain recoverable");
            records.remove(0).record
        }
    }
}

fn expected(input: &AgentMemoryInput, id: String, version: u32) -> AgentMemoryRecord {
    AgentMemoryRecord {
        decision: DecisionRecord {
            id,
            fact: input.decision.fact.clone(),
            confidence: input.decision.confidence,
            provenance: input.decision.provenance.clone(),
            recorded_unix_nanos: NOW,
            valid_until_unix_nanos: None,
            privacy_tag: "default".to_owned(),
        },
        memory_kind: input.memory_kind,
        source_kind: input.source_kind,
        source_ref: input.source_ref.clone(),
        source_hash: None,
        task_id: None,
        event_id: None,
        version,
        updated_unix_nanos: NOW + u64::from(version - 1),
        update_reason: (version == 2).then(|| "Rechecked outcome".to_owned()),
        code_link: None,
    }
}

#[test]
fn fork_during_commits_preserves_records_updates_and_deletions() {
    let nonce = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let root = std::env::temp_dir().join(format!(
        "cgrx-memory-fork-recovery-{}-{nonce}",
        std::process::id()
    ));
    fs::create_dir(&root).unwrap();
    eprintln!("fork recovery fixture: {}", root.display());
    let fixture = Fixture(root);
    let store = MemoryStore::open_lexical(&fixture.0).unwrap();
    let finished = Arc::new(AtomicBool::new(false));
    let signal = finished.clone();
    let stop = Arc::new(AtomicBool::new(false));
    let quiet = Arc::new(AtomicBool::new(false));
    let writer_stop = stop.clone();
    let writer_quiet = quiet.clone();
    let writer = std::thread::spawn(move || {
        // Signal on unwinding as well, so a failure cannot keep the fork loop alive.
        struct Done(Arc<AtomicBool>);
        impl Drop for Done {
            fn drop(&mut self) {
                self.0.store(true, Ordering::Release);
            }
        }
        let _done = Done(signal);
        let mut retained = Vec::new();
        let mut deleted = Vec::new();
        for i in 0..24 {
            eprintln!("fork recovery {i}: record");
            let original = input(&store, format!("Observed outcome {i}"));
            let first = reconcile_record(
                write_during_forks(
                    || store.agent_record(&original, NOW),
                    &writer_stop,
                    &writer_quiet,
                ),
                &store,
                &writer_stop,
                &writer_quiet,
            );
            assert_eq!(first, expected(&original, first.decision.id.clone(), 1));
            eprintln!("fork recovery {i}: update");
            let replacement = input(&store, format!("Verified outcome {i}"));
            let second = reconcile_record(
                write_during_forks(
                    || {
                        store.agent_update(
                            &first.decision.id,
                            1,
                            &replacement,
                            "Rechecked outcome",
                            NOW + 1,
                        )
                    },
                    &writer_stop,
                    &writer_quiet,
                ),
                &store,
                &writer_stop,
                &writer_quiet,
            );
            assert_eq!(second, expected(&replacement, first.decision.id.clone(), 2));
            if i % 3 == 0 {
                match write_during_forks(
                    || store.agent_forget(&first.decision.id, 2),
                    &writer_stop,
                    &writer_quiet,
                ) {
                    Ok(removed) => assert_eq!(removed, 2),
                    Err(error) => {
                        assert_eq!(
                            quiesce(&error, &writer_stop, &writer_quiet),
                            first.decision.id
                        );
                        // No repeat deletion: verify the guarded result from unfiltered history.
                        let mut history = query(Some(first.decision.id.clone()));
                        history.include_history = true;
                        assert!(
                            retry_prewrite_busy(|| store.agent_recall(&history))
                                .unwrap()
                                .results
                                .is_empty()
                        );
                    }
                }
                deleted.push(first.decision.id);
            } else {
                retained.push(second);
            }
        }
        (retained, deleted)
    });
    let mut children = 0;
    while !finished.load(Ordering::Acquire) && !stop.load(Ordering::Acquire) && children < 128 {
        // The child retains descriptors briefly, using only async-signal-safe syscalls.
        let pid = unsafe { libc::fork() };
        assert!(pid >= 0);
        if pid == 0 {
            unsafe {
                libc::alarm(2);
                let pause = libc::timespec {
                    tv_sec: 0,
                    tv_nsec: 100_000_000,
                };
                libc::nanosleep(&pause, std::ptr::null_mut());
                libc::_exit(0);
            }
        }
        let mut status = 0;
        loop {
            let waited = unsafe { libc::waitpid(pid, &mut status, 0) };
            if waited == pid {
                break;
            }
            assert!(
                waited == -1 && io::Error::last_os_error().kind() == io::ErrorKind::Interrupted
            );
        }
        assert!(libc::WIFEXITED(status) && libc::WEXITSTATUS(status) == 0);
        children += 1;
    }
    quiet.store(true, Ordering::Release);
    let (retained, deleted) = writer.join().unwrap();
    let reopened = MemoryStore::open_lexical(&fixture.0).unwrap();
    let mut query = query(None);
    let records = reopened.agent_recall(&query).unwrap().results;
    assert_eq!(records.len(), 16);
    assert!(
        retained
            .iter()
            .all(|expected| records.iter().any(|hit| hit.record == *expected))
    );
    query.recall.query = Some("Verified outcome".to_owned());
    assert_eq!(reopened.agent_recall(&query).unwrap().results.len(), 16);
    query.recall.query = None;
    query.include_history = true;
    for expected in retained {
        query.id = Some(expected.decision.id);
        let history = reopened.agent_recall(&query).unwrap().results;
        assert_eq!(history.len(), 2, "recovery must not add logical versions");
        assert!(history.iter().any(|hit| hit.record.version == 1));
        assert!(history.iter().any(|hit| hit.record.version == 2));
    }
    for id in deleted {
        query.id = Some(id);
        assert!(reopened.agent_recall(&query).unwrap().results.is_empty());
    }
    assert!(
        !fs::read_dir(fixture.0.join(".cgrx/memory"))
            .unwrap()
            .any(|entry| {
                entry
                    .unwrap()
                    .file_name()
                    .to_string_lossy()
                    .starts_with(".agent-recovery-")
            })
    );
    eprintln!("confirmed 56 mutations across {children} raw forks without replaying writes");
}
