use std::sync::{Arc, Mutex, mpsc};
use std::thread;

type Job = Box<dyn FnOnce() + Send + 'static>;

/// Bounded queues prevent cancelled tabs from creating unbounded threads/work.
pub(super) struct Pool(mpsc::SyncSender<Job>);

impl Pool {
    pub(super) fn new(name: &str, workers: usize, capacity: usize) -> Result<Self, String> {
        let (tx, rx) = mpsc::sync_channel::<Job>(capacity);
        let rx = Arc::new(Mutex::new(rx));
        for index in 0..workers {
            let rx = Arc::clone(&rx);
            thread::Builder::new()
                .name(format!("{name}-{index}"))
                .spawn(move || {
                    loop {
                        let job = rx
                            .lock()
                            .unwrap_or_else(std::sync::PoisonError::into_inner)
                            .recv();
                        let Ok(job) = job else { break };
                        let _ = std::panic::catch_unwind(std::panic::AssertUnwindSafe(job));
                    }
                })
                .map_err(|error| error.to_string())?;
        }
        Ok(Self(tx))
    }

    pub(super) fn submit(&self, job: impl FnOnce() + Send + 'static) -> bool {
        self.0.try_send(Box::new(job)).is_ok()
    }
}
