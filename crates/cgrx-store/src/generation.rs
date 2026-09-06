use std::fs::{self, File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use cgrx_core::RepoSnapshot;
use serde::{Deserialize, Serialize};

use crate::segment::{self, REQUIRED_SEGMENTS, SegmentManifest};

const SCHEMA_VERSION: u32 = 1;

/// Named durable-publication operation where the subprocess crash harness can terminate.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[doc(hidden)]
pub enum CrashSite {
    SegmentsFsynced,
    ManifestFsynced,
    GenerationTempDirectoryFsynced,
    GenerationValidated,
    GenerationRenamed,
    GenerationsDirectoryFsynced,
    CurrentByteWritten,
    CurrentTempFsynced,
    CurrentRenamed,
    StoreDirectoryFsynced,
}

/// One explicit executable crash event; repeated trials retain the same event identity.
#[derive(Clone, Debug, Eq, PartialEq)]
#[doc(hidden)]
pub struct CrashInjection {
    site: CrashSite,
    current_byte_boundary: Option<usize>,
}

impl CrashInjection {
    #[must_use]
    pub fn operation(site: CrashSite) -> Self {
        assert!(
            site != CrashSite::CurrentByteWritten,
            "CURRENT byte crashes require an explicit byte boundary"
        );
        Self {
            site,
            current_byte_boundary: None,
        }
    }

    #[must_use]
    pub fn current_byte(boundary: usize) -> Self {
        assert!(
            (1..=17).contains(&boundary),
            "CURRENT byte boundary must be in 1..=17"
        );
        Self {
            site: CrashSite::CurrentByteWritten,
            current_byte_boundary: Some(boundary),
        }
    }

    #[must_use]
    pub fn encode(&self) -> String {
        match (self.site, self.current_byte_boundary) {
            (CrashSite::SegmentsFsynced, None) => "segments_fsynced".to_owned(),
            (CrashSite::ManifestFsynced, None) => "manifest_fsynced".to_owned(),
            (CrashSite::GenerationTempDirectoryFsynced, None) => {
                "generation_temp_directory_fsynced".to_owned()
            }
            (CrashSite::GenerationValidated, None) => "generation_validated".to_owned(),
            (CrashSite::GenerationRenamed, None) => "generation_renamed".to_owned(),
            (CrashSite::GenerationsDirectoryFsynced, None) => {
                "generations_directory_fsynced".to_owned()
            }
            (CrashSite::CurrentByteWritten, Some(boundary)) => {
                format!("current_byte_written:{boundary}")
            }
            (CrashSite::CurrentTempFsynced, None) => "current_temp_fsynced".to_owned(),
            (CrashSite::CurrentRenamed, None) => "current_renamed".to_owned(),
            (CrashSite::StoreDirectoryFsynced, None) => "store_directory_fsynced".to_owned(),
            _ => "invalid".to_owned(),
        }
    }

    pub fn decode(encoded: &str) -> io::Result<Self> {
        let operation = match encoded {
            "segments_fsynced" => Self::operation(CrashSite::SegmentsFsynced),
            "manifest_fsynced" => Self::operation(CrashSite::ManifestFsynced),
            "generation_temp_directory_fsynced" => {
                Self::operation(CrashSite::GenerationTempDirectoryFsynced)
            }
            "generation_validated" => Self::operation(CrashSite::GenerationValidated),
            "generation_renamed" => Self::operation(CrashSite::GenerationRenamed),
            "generations_directory_fsynced" => {
                Self::operation(CrashSite::GenerationsDirectoryFsynced)
            }
            "current_temp_fsynced" => Self::operation(CrashSite::CurrentTempFsynced),
            "current_renamed" => Self::operation(CrashSite::CurrentRenamed),
            "store_directory_fsynced" => Self::operation(CrashSite::StoreDirectoryFsynced),
            _ => {
                let boundary = encoded
                    .strip_prefix("current_byte_written:")
                    .ok_or_else(|| invalid_input("unknown crash injection event"))?
                    .parse::<usize>()
                    .map_err(invalid_input)?;
                if !(1..=17).contains(&boundary) {
                    return Err(invalid_input("CURRENT byte boundary must be in 1..=17"));
                }
                Self::current_byte(boundary)
            }
        };
        Ok(operation)
    }
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
struct GenerationManifest {
    schema_version: u32,
    generation: u64,
    snapshot: RepoSnapshot,
    segments: Vec<SegmentManifest>,
}

/// Builds one immutable generation in a sibling temporary directory.
pub struct GenerationWriter {
    root: PathBuf,
    temporary: PathBuf,
    final_path: PathBuf,
    snapshot: RepoSnapshot,
    validated: bool,
    crash_injection: Option<CrashInjection>,
    _writer_lock: WriterLock,
}

impl GenerationWriter {
    pub fn begin(root: impl AsRef<Path>, snapshot: RepoSnapshot) -> io::Result<Self> {
        let root = root.as_ref().to_path_buf();
        let writer_lock = acquire_writer_lock(&root)?;
        let cgrx = root.join(".cgrx");
        let generations = cgrx.join("generations");
        fs::create_dir_all(&generations)?;
        let generation_name = format!("{:016}", snapshot.graph_generation);
        let temporary = generations.join(format!(".{generation_name}.tmp"));
        let final_path = generations.join(&generation_name);
        if temporary.exists() {
            fs::remove_dir_all(&temporary)?;
        }
        if final_path.exists() {
            return Err(io::Error::new(
                io::ErrorKind::AlreadyExists,
                "generation is immutable and already exists",
            ));
        }
        fs::create_dir(&temporary)?;
        segment::sync_dir(&generations)?;
        Ok(Self {
            root,
            temporary,
            final_path,
            snapshot,
            validated: false,
            crash_injection: None,
            _writer_lock: writer_lock,
        })
    }

    pub fn write_segment(&mut self, name: &str, bytes: &[u8]) -> io::Result<()> {
        if !segment::valid_name(name) {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                format!("unsupported segment name: {name}"),
            ));
        }
        segment::write_synced(&self.temporary.join(name), bytes)?;
        self.validated = false;
        Ok(())
    }

    pub fn validate(&mut self) -> io::Result<()> {
        let mut segments = Vec::with_capacity(REQUIRED_SEGMENTS.len());
        for name in REQUIRED_SEGMENTS {
            segments.push(segment::inspect(&self.temporary.join(name), name)?);
        }
        let manifest = GenerationManifest {
            schema_version: SCHEMA_VERSION,
            generation: self.snapshot.graph_generation,
            snapshot: self.snapshot.clone(),
            segments,
        };
        let bytes = serde_json::to_vec(&manifest).map_err(invalid_data)?;
        segment::write_synced(&self.temporary.join("manifest.json"), &bytes)?;
        validate_generation_dir(&self.temporary, Some(self.snapshot.graph_generation))?;
        self.validated = true;
        Ok(())
    }

    /// Configures one subprocess crash event without changing the production I/O path.
    #[doc(hidden)]
    pub fn set_crash_injection(&mut self, injection: CrashInjection) {
        self.crash_injection = Some(injection);
    }

    pub fn publish(self) -> io::Result<()> {
        if !self.validated {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "generation must validate before publication",
            ));
        }

        for name in REQUIRED_SEGMENTS {
            OpenOptions::new()
                .read(true)
                .open(self.temporary.join(name))?
                .sync_all()?;
        }
        self.crash_at(CrashSite::SegmentsFsynced, None);
        OpenOptions::new()
            .read(true)
            .open(self.temporary.join("manifest.json"))?
            .sync_all()?;
        self.crash_at(CrashSite::ManifestFsynced, None);
        segment::sync_dir(&self.temporary)?;
        self.crash_at(CrashSite::GenerationTempDirectoryFsynced, None);
        validate_generation_dir(&self.temporary, Some(self.snapshot.graph_generation))?;
        self.crash_at(CrashSite::GenerationValidated, None);

        fs::rename(&self.temporary, &self.final_path)?;
        self.crash_at(CrashSite::GenerationRenamed, None);
        segment::sync_dir(self.final_path.parent().expect("generation has parent"))?;
        self.crash_at(CrashSite::GenerationsDirectoryFsynced, None);

        publish_current(
            &self.root,
            self.snapshot.graph_generation,
            |site, boundary| {
                self.crash_at(site, boundary);
            },
        )
    }

    /// Reactivate a byte-identical, fully verified immutable generation.
    /// This never repairs or overwrites generation contents. Contention returns
    /// WouldBlock before cleanup, validation or CURRENT changes.
    pub fn reactivate(
        root: impl AsRef<Path>,
        snapshot: &RepoSnapshot,
        expected: &[(&str, &[u8])],
    ) -> io::Result<()> {
        Self::reactivate_with_crash(root, snapshot, expected, None)
    }

    #[doc(hidden)]
    pub fn reactivate_with_crash(
        root: impl AsRef<Path>,
        snapshot: &RepoSnapshot,
        expected: &[(&str, &[u8])],
        injection: Option<CrashInjection>,
    ) -> io::Result<()> {
        let root = root.as_ref();
        let _writer_lock = acquire_writer_lock(root)?;
        let path = root
            .join(".cgrx/generations")
            .join(format!("{:016}", snapshot.graph_generation));
        let manifest = validate_generation_dir(&path, Some(snapshot.graph_generation))?;
        if &manifest.snapshot != snapshot || expected.len() != REQUIRED_SEGMENTS.len() {
            return Err(invalid_data(
                "existing generation snapshot or segment set differs",
            ));
        }
        for name in REQUIRED_SEGMENTS {
            let candidates: Vec<_> = expected.iter().filter(|(n, _)| *n == name).collect();
            let [(_, bytes)] = candidates.as_slice() else {
                return Err(invalid_data("expected segment missing or duplicated"));
            };
            if fs::read(path.join(name))?.as_slice() != *bytes {
                return Err(invalid_data("existing generation content differs"));
            }
        }
        // CURRENT may have been lost after the original generation rename.
        // Ensure directory durability before publishing a fresh pointer.
        segment::sync_dir(path.parent().expect("generation parent"))?;
        publish_current(root, snapshot.graph_generation, |site, boundary| {
            if injection
                .as_ref()
                .is_some_and(|i| i.site == site && i.current_byte_boundary == boundary)
            {
                std::process::exit(86);
            }
        })
    }

    fn crash_at(&self, site: CrashSite, current_byte_boundary: Option<usize>) {
        if self.crash_injection.as_ref().is_some_and(|injection| {
            injection.site == site && injection.current_byte_boundary == current_byte_boundary
        }) {
            std::process::exit(86);
        }
    }
}

// Persistent inode: never unlink this file, including after crashes. flock is
// tied to the open file description: close alone can leave it held by a
// concurrently forked child's descriptor until that child execs/exits.
pub(crate) struct WriterLock {
    file: File,
    owner_pid: u32,
}

impl Drop for WriterLock {
    fn drop(&mut self) {
        // Only the acquiring process may unlock the shared description. A fork
        // child dropping its copied guard must only close its descriptor, not
        // release a lock protecting the still-live parent's publication.
        if self.owner_pid == std::process::id() {
            let _ = self.file.unlock();
        }
        // File then closes normally. No pid-file/unlink scheme: the OS still
        // releases the lock if its owner exits or is killed without running Drop.
    }
}

pub(crate) fn acquire_writer_lock(root: &Path) -> io::Result<WriterLock> {
    let directory = root.join(".cgrx");
    fs::create_dir_all(&directory)?;
    let file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(directory.join("WRITER.lock"))?;
    file.try_lock().map_err(io::Error::from)?;
    Ok(WriterLock {
        file,
        owner_pid: std::process::id(),
    })
}

fn publish_current(
    root: &Path,
    generation: u64,
    mut crash_at: impl FnMut(CrashSite, Option<usize>),
) -> io::Result<()> {
    let cgrx = root.join(".cgrx");
    let current_tmp = cgrx.join("CURRENT.tmp");
    if current_tmp.exists() {
        fs::remove_file(&current_tmp)?;
    }
    let mut pointer = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&current_tmp)?;
    let pointer_bytes = format!("{:016}\n", generation);
    for (index, byte) in pointer_bytes.bytes().enumerate() {
        pointer.write_all(&[byte])?;
        crash_at(CrashSite::CurrentByteWritten, Some(index + 1));
    }
    pointer.sync_all()?;
    crash_at(CrashSite::CurrentTempFsynced, None);
    fs::rename(&current_tmp, cgrx.join("CURRENT"))?;
    crash_at(CrashSite::CurrentRenamed, None);
    segment::sync_dir(&cgrx)?;
    crash_at(CrashSite::StoreDirectoryFsynced, None);
    Ok(())
}

/// A generation whose manifest and every segment were validated before exposure.
#[derive(Debug)]
pub struct GenerationReader {
    path: PathBuf,
    manifest: GenerationManifest,
}

impl GenerationReader {
    pub fn open_current(root: impl AsRef<Path>) -> io::Result<Self> {
        let root = root.as_ref();
        let pointer = fs::read_to_string(root.join(".cgrx/CURRENT"))?;
        let name = pointer
            .strip_suffix('\n')
            .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidData, "CURRENT lacks newline"))?;
        if name.len() != 16 || !name.bytes().all(|byte| byte.is_ascii_digit()) {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "CURRENT is not a 16-digit generation",
            ));
        }
        let generation = name.parse::<u64>().map_err(invalid_data)?;
        let path = root.join(".cgrx/generations").join(name);
        let manifest = validate_generation_dir(&path, Some(generation))?;
        Ok(Self { path, manifest })
    }

    #[must_use]
    pub const fn id(&self) -> u64 {
        self.manifest.generation
    }

    #[must_use]
    pub const fn snapshot(&self) -> &RepoSnapshot {
        &self.manifest.snapshot
    }

    pub fn read_segment(&self, name: &str) -> io::Result<Vec<u8>> {
        if !segment::valid_name(name) {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "invalid segment",
            ));
        }
        fs::read(self.path.join(name))
    }
}

fn validate_generation_dir(
    path: &Path,
    expected_generation: Option<u64>,
) -> io::Result<GenerationManifest> {
    let bytes = fs::read(path.join("manifest.json"))?;
    let manifest: GenerationManifest = serde_json::from_slice(&bytes).map_err(invalid_data)?;
    if manifest.schema_version != SCHEMA_VERSION
        || expected_generation.is_some_and(|expected| manifest.generation != expected)
        || manifest.snapshot.graph_generation != manifest.generation
        || manifest.segments.len() != REQUIRED_SEGMENTS.len()
    {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "invalid generation manifest",
        ));
    }
    for name in REQUIRED_SEGMENTS {
        let entry = manifest
            .segments
            .iter()
            .find(|entry| entry.name == name)
            .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidData, "missing segment"))?;
        segment::verify(&path.join(name), entry)?;
    }
    Ok(manifest)
}

fn invalid_data(error: impl std::fmt::Display) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, error.to_string())
}

fn invalid_input(error: impl std::fmt::Display) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidInput, error.to_string())
}

#[cfg(all(test, unix))]
mod writer_lock_fork_tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};
    static ID: AtomicU64 = AtomicU64::new(0);

    struct Fixture(PathBuf);
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    struct Child(libc::pid_t);
    impl Drop for Child {
        fn drop(&mut self) {
            if self.0 > 0 {
                // SAFETY: this PID is our unreaped child. Reap even on panic.
                unsafe {
                    libc::kill(self.0, libc::SIGKILL);
                    while libc::waitpid(self.0, std::ptr::null_mut(), 0) == -1
                        && io::Error::last_os_error().kind() == io::ErrorKind::Interrupted
                    {
                    }
                }
            }
        }
    }
    fn receive(fd: libc::c_int) -> bool {
        let mut poll = libc::pollfd {
            fd,
            events: libc::POLLIN,
            revents: 0,
        };
        let mut byte = 0u8;
        // SAFETY: valid pipe descriptor and initialized stack buffers. Timeout
        // bounds a failing child without lock retries or scheduler sleeps.
        unsafe {
            libc::poll(&mut poll, 1, 5000) == 1
                && libc::read(fd, (&mut byte as *mut u8).cast(), 1) == 1
        }
    }
    fn fork_case(child_drops_first: bool) {
        let root = Fixture(std::env::temp_dir().join(format!(
            "cgrx-fork-lock-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        )));
        let lock = acquire_writer_lock(&root.0).unwrap();
        let mut ready = [-1; 2];
        let mut release = [-1; 2];
        // SAFETY: the child executes only raw async-signal-safe syscalls and
        // drops the File/lock guard (PID check, unlock/close), never the test
        // harness or heap-backed parent state. _exit skips other destructors.
        let pid = unsafe {
            assert_eq!(libc::pipe(ready.as_mut_ptr()), 0);
            assert_eq!(libc::pipe(release.as_mut_ptr()), 0);
            libc::fork()
        };
        assert!(pid >= 0, "fork failed");
        if pid == 0 {
            unsafe {
                libc::close(ready[0]);
                libc::close(release[1]);
                libc::alarm(5);
                if child_drops_first {
                    drop(lock);
                }
                let byte = 1u8;
                if libc::write(ready[1], (&byte as *const u8).cast(), 1) != 1 {
                    libc::_exit(91);
                }
                let mut input = 0u8;
                if libc::read(release[0], (&mut input as *mut u8).cast(), 1) != 1 {
                    libc::_exit(92);
                }
                // In the other case retain the inherited descriptor until exit.
                libc::_exit(0);
            }
        }
        let mut child = Child(pid);
        unsafe {
            libc::close(ready[1]);
            libc::close(release[0]);
        }
        let ready_ok = receive(ready[0]);
        let held_result = acquire_writer_lock(&root.0).err().map(|e| e.kind());
        drop(lock);
        // Single immediate attempt while the child still owns its inherited FD.
        let released_result = acquire_writer_lock(&root.0);
        let released_error = released_result.as_ref().err().map(|e| e.kind());
        drop(released_result);
        let mut status = 0;
        let byte = 1u8;
        let sent = unsafe { libc::write(release[1], (&byte as *const u8).cast(), 1) };
        unsafe {
            libc::close(ready[0]);
            libc::close(release[1]);
        }
        let waited = unsafe { libc::waitpid(pid, &mut status, 0) };
        if waited == pid {
            child.0 = 0;
        }
        assert!(ready_ok, "fork child failed to signal readiness");
        assert_eq!(sent, 1);
        assert_eq!(waited, pid);
        assert_eq!(status, 0);
        assert_eq!(
            held_result,
            Some(io::ErrorKind::WouldBlock),
            "fork child Drop must not unlock live parent"
        );
        assert_eq!(
            released_error, None,
            "parent Drop must unlock despite a live inherited descriptor"
        );
    }
    #[test]
    fn writer_lock_fork_parent_drop_releases_with_live_inherited_fd() {
        fork_case(false);
    }
    #[test]
    fn writer_lock_fork_child_drop_preserves_parent_lock() {
        fork_case(true);
    }
}
