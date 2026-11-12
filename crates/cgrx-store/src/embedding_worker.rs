//! Request-scoped native inference isolation. No project files enter the worker.
use std::io::{self, BufRead, BufReader, Read, Write};
use std::path::PathBuf;
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::{Mutex, OnceLock, mpsc};
use std::thread;
use std::time::{Duration, Instant};

static EXECUTABLE: OnceLock<PathBuf> = OnceLock::new();
static WORKER: Mutex<Option<Worker>> = Mutex::new(None);
const MAX_FRAME: u64 = 16 * 1024 * 1024;

/// Opt in before serving. Library and single-root callers keep local inference.
pub fn configure_memory_model_worker(executable: PathBuf) -> io::Result<()> {
    EXECUTABLE
        .set(executable)
        .map_err(|_| io::Error::other("embedding worker already configured"))
}

pub(super) fn embed(text: &str) -> Option<io::Result<Vec<f32>>> {
    let executable = EXECUTABLE.get()?;
    Some((|| {
        let mut worker = WORKER
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        if worker.is_none() {
            *worker = Some(Worker::spawn(executable)?);
        }
        let result = worker.as_mut().expect("initialized worker").embed(text);
        if result.is_err() {
            // Never retry a failed operation or replay a request.
            *worker = None;
        }
        result
    })())
}

pub(super) fn release() -> bool {
    let mut worker = WORKER
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    let released = worker.is_some();
    *worker = None;
    released
}

struct Worker {
    child: Child,
    input: Option<ChildStdin>,
    receive: mpsc::Receiver<io::Result<Vec<f32>>>,
    reader: Option<thread::JoinHandle<()>>,
}

impl Worker {
    fn spawn(executable: &PathBuf) -> io::Result<Self> {
        let mut child = Command::new(executable)
            .arg("__memory-embed")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()?;
        let input = child.stdin.take();
        let output = child.stdout.take().expect("piped worker stdout");
        let (send, receive) = mpsc::sync_channel(1);
        let reader = thread::Builder::new()
            .name("cgrx-embedding-response".to_owned())
            .spawn(move || {
                let mut output = BufReader::new(output);
                loop {
                    let response = read_frame(&mut output).and_then(|line| {
                        let vector = serde_json::from_str::<Vec<f32>>(&line)
                            .map_err(|_| io::Error::other("invalid embedding worker response"))?;
                        if vector.len() != 384 || vector.iter().any(|v| !v.is_finite()) {
                            return Err(io::Error::other("invalid embedding worker vector"));
                        }
                        Ok(vector)
                    });
                    let failed = response.is_err();
                    if send.send(response).is_err() || failed {
                        break;
                    }
                }
            });
        match reader {
            Ok(reader) => Ok(Self {
                child,
                input,
                receive,
                reader: Some(reader),
            }),
            Err(error) => {
                drop(input);
                let _ = child.kill();
                let _ = child.wait();
                Err(error)
            }
        }
    }

    fn embed(&mut self, text: &str) -> io::Result<Vec<f32>> {
        let input = self.input.as_mut().expect("live worker stdin");
        serde_json::to_writer(&mut *input, text)?;
        input.write_all(b"\n")?;
        input.flush()?;
        self.receive
            .recv_timeout(Duration::from_secs(120))
            .map_err(|_| io::Error::other("embedding worker did not respond"))?
    }
}

impl Drop for Worker {
    fn drop(&mut self) {
        drop(self.input.take());
        let deadline = Instant::now() + Duration::from_secs(2);
        loop {
            match self.child.try_wait() {
                Ok(Some(_)) => break,
                Ok(None) if Instant::now() < deadline => thread::sleep(Duration::from_millis(10)),
                _ => {
                    // This is our read-only inference child, never another MCP helper.
                    let _ = self.child.kill();
                    let _ = self.child.wait();
                    break;
                }
            }
        }
        // The receiver is dropped before join: a failed worker can have filled
        // the bounded channel with a response followed by an EOF error.
        let (_, replacement) = mpsc::sync_channel(1);
        drop(std::mem::replace(&mut self.receive, replacement));
        if let Some(reader) = self.reader.take() {
            let _ = reader.join();
        }
    }
}

fn read_frame(input: &mut impl BufRead) -> io::Result<String> {
    let mut line = Vec::new();
    let bytes = input.take(MAX_FRAME + 1).read_until(b'\n', &mut line)?;
    if bytes == 0 || bytes as u64 > MAX_FRAME || !line.ends_with(b"\n") {
        return Err(io::Error::other(
            "embedding worker connection closed or frame too large",
        ));
    }
    String::from_utf8(line).map_err(|_| io::Error::other("invalid embedding worker frame"))
}

/// Private stdio worker. It only computes the existing E5 vectors; no project writes,
/// project roots, usage logs, or tool dispatch are available in this process.
pub fn serve_memory_model_worker() -> io::Result<()> {
    let (send, receive) = mpsc::sync_channel(1);
    let _lifetime: thread::JoinHandle<()> = thread::Builder::new()
        .name("cgrx-embedding-lifetime".to_owned())
        .spawn(move || {
            let mut input = io::stdin().lock();
            loop {
                let Ok(line) = read_frame(&mut input) else {
                    worker_disconnected();
                };
                if send.send(line).is_err() {
                    worker_disconnected();
                }
            }
        })?;
    let mut output = io::stdout().lock();
    for line in receive {
        let text: String = serde_json::from_str(&line)
            .map_err(|_| io::Error::other("invalid embedding worker input"))?;
        let vector = crate::agent_memory::embed_local(&text)?;
        serde_json::to_writer(&mut output, &vector)?;
        output.write_all(b"\n")?;
        output.flush()?;
    }
    Ok(())
}

fn worker_disconnected() -> ! {
    // This process has no project writes. EOF cancels even an inference/model
    // initialization in progress, so a dead parent cannot leave its model
    // resident. The parent keeps stdin open until it receives every vector.
    #[cfg(unix)]
    unsafe {
        unsafe extern "C" {
            fn _exit(status: i32) -> !;
        }
        // Skip native-library exit hooks that may hold inference locks.
        _exit(0)
    }
    #[cfg(not(unix))]
    std::process::exit(0)
}
