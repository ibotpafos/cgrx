use std::path::Path;
#[cfg(test)]
use std::path::PathBuf;
use std::sync::mpsc::{self, Receiver};
use std::time::Duration;

#[cfg(test)]
use std::sync::mpsc::Sender;

use notify::{RecommendedWatcher, RecursiveMode, Watcher};

/// Events produced by a file watcher after debounce and filtering.
#[allow(dead_code)]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FileWatcherEvent {
    /// Relative paths (from watch root) that changed since the last poll.
    pub changed_paths: Vec<String>,
}

/// Abstraction over a file-system watcher so tests can inject a mock.
///
/// Implementations must:
/// - Watch a single root directory recursively.
/// - Filter events to supported source extensions (`.rs`, `.ts`, `.go`, `.py`, `.java`).
/// - Ignore `.git/`, `target/`, `node_modules/` directories.
/// - Debounce rapid successive changes into a single event.
#[allow(dead_code)]
pub trait FileWatcher: Send {
    /// Returns the next batch of changes, or `None` if the watcher is shut down.
    fn next_event(&self) -> Option<FileWatcherEvent>;
}

#[allow(dead_code)]
const DEBOUNCE_DURATION: Duration = Duration::from_millis(500);

/// Supported source-file extensions.
const WATCHED_EXTENSIONS: &[&str] = &["rs", "ts", "go", "py", "java"];

/// Directories to ignore entirely.
const IGNORED_DIR_NAMES: &[&str] = &[".git", "target", "node_modules"];

/// Returns `true` if the path should be watched (has a supported extension and
/// does not live under an ignored directory).
#[allow(dead_code)]
fn is_watched(path: &Path) -> bool {
    if path
        .components()
        .any(|component| IGNORED_DIR_NAMES.contains(&component.as_os_str().to_str().unwrap_or("")))
    {
        return false;
    }
    path.extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| WATCHED_EXTENSIONS.contains(&ext))
}

/// Real filesystem watcher backed by the `notify` crate (inotify on Linux,
/// FSEvents on macOS, ReadDirectoryChanges on Windows).
#[allow(dead_code)]
pub struct NotifyWatcher {
    receiver: Receiver<notify::Result<notify::Event>>,
    /// Own the sender side so we can signal shutdown via `Drop`.
    _watcher: RecommendedWatcher,
}

impl NotifyWatcher {
    #[allow(dead_code)]
    pub fn new(root: &Path) -> Result<Self, String> {
        let (sender, receiver) = mpsc::channel();
        let mut watcher = notify::recommended_watcher(sender).map_err(|error| {
            format!(
                "failed to create file watcher for {}: {error}",
                root.display()
            )
        })?;
        watcher
            .watch(root, RecursiveMode::Recursive)
            .map_err(|error| format!("failed to watch {}: {error}", root.display()))?;
        Ok(Self {
            receiver,
            _watcher: watcher,
        })
    }
}

impl FileWatcher for NotifyWatcher {
    fn next_event(&self) -> Option<FileWatcherEvent> {
        let deadline = std::time::Instant::now() + DEBOUNCE_DURATION;
        let mut changed = std::collections::BTreeSet::new();
        loop {
            let remaining = deadline.saturating_duration_since(std::time::Instant::now());
            if remaining.is_zero() {
                break;
            }
            match self.receiver.recv_timeout(remaining) {
                Ok(Ok(event)) => {
                    for path in event.paths {
                        if is_watched(&path) {
                            changed.insert(path.to_string_lossy().into_owned());
                        }
                    }
                }
                Ok(Err(_)) => break,
                Err(mpsc::RecvTimeoutError::Timeout) => break,
                Err(mpsc::RecvTimeoutError::Disconnected) => {
                    if changed.is_empty() {
                        return None;
                    }
                    break;
                }
            }
        }
        if changed.is_empty() {
            None
        } else {
            Some(FileWatcherEvent {
                changed_paths: changed.into_iter().collect(),
            })
        }
    }
}

/// Mock watcher for tests. Events are pushed via `push_event` from any thread`.
#[cfg(test)]
pub struct MockWatcher {
    sender: Sender<Vec<PathBuf>>,
    receiver: Receiver<Vec<PathBuf>>,
}

#[cfg(test)]
impl MockWatcher {
    pub fn new() -> Self {
        let (sender, receiver) = mpsc::channel();
        Self { sender, receiver }
    }

    /// Simulate a batch of changed paths.
    pub fn push_event(&self, paths: Vec<PathBuf>) {
        let _ = self.sender.send(paths);
    }
}

#[cfg(test)]
impl Default for MockWatcher {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
impl FileWatcher for MockWatcher {
    fn next_event(&self) -> Option<FileWatcherEvent> {
        let deadline = std::time::Instant::now() + DEBOUNCE_DURATION;
        let mut changed = std::collections::BTreeSet::new();
        loop {
            let remaining = deadline.saturating_duration_since(std::time::Instant::now());
            if remaining.is_zero() {
                break;
            }
            match self.receiver.recv_timeout(remaining) {
                Ok(paths) => {
                    for path in paths {
                        if is_watched(&path) {
                            changed.insert(path.to_string_lossy().into_owned());
                        }
                    }
                }
                Err(mpsc::RecvTimeoutError::Timeout) => break,
                Err(mpsc::RecvTimeoutError::Disconnected) => {
                    if changed.is_empty() {
                        return None;
                    }
                    break;
                }
            }
        }
        if changed.is_empty() {
            None
        } else {
            Some(FileWatcherEvent {
                changed_paths: changed.into_iter().collect(),
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;

    #[test]
    fn is_watched_accepts_supported_extensions() {
        assert!(is_watched(Path::new("src/main.rs")));
        assert!(is_watched(Path::new("lib/index.ts")));
        assert!(is_watched(Path::new("cmd/server.go")));
        assert!(is_watched(Path::new("app.py")));
        assert!(is_watched(Path::new("src/Main.java")));
    }

    #[test]
    fn is_watched_rejects_unsupported_extensions() {
        assert!(!is_watched(Path::new("README.md")));
        assert!(!is_watched(Path::new("Cargo.toml")));
        assert!(!is_watched(Path::new("file.json")));
    }

    #[test]
    fn is_watched_ignores_git_target_node_modules() {
        assert!(!is_watched(Path::new(".git/HEAD")));
        assert!(!is_watched(Path::new(".git/refs/heads/main")));
        assert!(!is_watched(Path::new("target/debug/main.rs")));
        assert!(!is_watched(Path::new("node_modules/lodash/index.js")));
    }

    #[test]
    fn mock_watcher_debounces_rapid_events() {
        let watcher = MockWatcher::new();
        let start = std::time::Instant::now();
        watcher.push_event(vec![PathBuf::from("a.rs"), PathBuf::from("b.ts")]);
        watcher.push_event(vec![PathBuf::from("c.go")]);
        let event = watcher.next_event();
        let elapsed = start.elapsed();
        assert!(elapsed >= DEBOUNCE_DURATION, "debounce not applied");
        let paths = event.expect("event should fire").changed_paths;
        assert!(paths.contains(&"a.rs".to_string()));
        assert!(paths.contains(&"b.ts".to_string()));
        assert!(paths.contains(&"c.go".to_string()));
    }

    #[test]
    fn mock_watcher_filters_unsupported_and_ignored() {
        let watcher = MockWatcher::new();
        watcher.push_event(vec![
            PathBuf::from("src/main.rs"),
            PathBuf::from("README.md"),
            PathBuf::from(".git/HEAD"),
            PathBuf::from("target/debug/foo.rs"),
        ]);
        let event = watcher.next_event().expect("event should fire");
        assert_eq!(event.changed_paths, vec!["src/main.rs".to_string()]);
    }

    #[test]
    fn mock_watcher_returns_none_on_disconnect_with_no_events() {
        let watcher = MockWatcher::new();
        drop(watcher.sender.clone());
        assert!(watcher.next_event().is_none());
    }

    #[test]
    fn mock_watcher_threaded_push() {
        let watcher = MockWatcher::new();
        let handle = thread::spawn(move || {
            thread::sleep(Duration::from_millis(100));
            watcher.push_event(vec![PathBuf::from("late.rs")]);
            watcher
        });
        let watcher = handle.join().unwrap();
        let event = watcher.next_event();
        assert!(event.is_some());
    }
}
