//! Profile jobs outlive graph-cache entries, not the MCP process.
use super::{Runtime, fast_anything::Profile};
use serde_json::{Value, json};
use std::{
    collections::BTreeSet,
    fs::OpenOptions,
    path::{Path, PathBuf},
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
        mpsc::{SyncSender, TrySendError, sync_channel},
    },
    thread::{self, JoinHandle},
};

struct Job {
    root: PathBuf,
    state: PathBuf,
    revision: String,
}

struct Queue {
    send: SyncSender<Job>,
    pending: Arc<Mutex<BTreeSet<(PathBuf, String)>>>,
    stop: Arc<AtomicBool>,
    worker: JoinHandle<()>,
}

static QUEUE: Mutex<Option<Queue>> = Mutex::new(None);

impl Queue {
    fn start() -> std::io::Result<Self> {
        let (send, recv) = sync_channel::<Job>(8);
        let pending = Arc::new(Mutex::new(BTreeSet::<(PathBuf, String)>::new()));
        let stop = Arc::new(AtomicBool::new(false));
        let pending_jobs = pending.clone();
        let stopped = stop.clone();
        let worker = thread::Builder::new()
            .name("cgrx-fast-anything".into())
            .spawn(move || {
                while let Ok(job) = recv.recv() {
                    if stopped.load(Ordering::Acquire) {
                        break;
                    }
                    run_job(&job, &stopped);
                    pending_jobs
                        .lock()
                        .unwrap()
                        .remove(&(job.state, job.revision));
                }
            })?;
        Ok(Self {
            send,
            pending,
            stop,
            worker,
        })
    }

    fn push(&self, job: Job) {
        let mut pending = self.pending.lock().unwrap();
        if pending.insert((job.state.clone(), job.revision.clone()))
            && let Err(TrySendError::Full(job) | TrySendError::Disconnected(job)) =
                self.send.try_send(job)
        {
            pending.remove(&(job.state, job.revision));
        }
    }
}

fn run_job(job: &Job, stop: &AtomicBool) {
    let Ok(lease) = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(job.state.join("fast-anything-worker.lease"))
    else {
        return;
    };
    if lease.try_lock().is_err() {
        return;
    }
    if let Ok(Some(mut profile)) = Profile::load(&job.root, &job.state) {
        profile.poll(&job.state, &job.root, &job.revision, stop);
    }
}

impl Runtime {
    pub fn schedule_profile(&self, root: &Path) {
        let revision = &self.snapshot().repo_revision;
        let Ok(Some(profile)) = Profile::load(root, &self.state_root) else {
            return;
        };
        if revision.is_empty() || !profile.needs_attempt(&self.state_root, revision) {
            return;
        }
        let state = self
            .state_root
            .canonicalize()
            .unwrap_or_else(|_| self.state_root.clone());
        let mut queue = QUEUE.lock().unwrap();
        if queue.is_none() {
            *queue = Queue::start().ok();
        }
        if let Some(queue) = queue.as_ref() {
            queue.push(Job {
                root: root.to_path_buf(),
                state,
                revision: revision.clone(),
            });
        }
    }

    pub fn stop_profile_jobs() {
        if let Some(queue) = QUEUE.lock().unwrap().take() {
            queue.stop.store(true, Ordering::Release);
            drop(queue.send);
            let _ = queue.worker.join();
        }
    }
}

pub(super) fn status(root: &Path, state: &Path, revision: &str) -> Option<Value> {
    match Profile::load(root, state) {
        Ok(Some(profile)) => Some(
            profile
                .last_status(state, revision)
                .unwrap_or_else(|| json!({"status":"pending","revision":revision})),
        ),
        Err(reason) => Some(json!({"status":"unavailable","reason":reason})),
        Ok(None) => None,
    }
}
