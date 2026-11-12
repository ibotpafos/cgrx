//! Process retention and cross-process admission, independent of worktree data.
use std::fs::{self, File, OpenOptions};
use std::io;
use std::path::PathBuf;
use std::time::{Duration, Instant};

pub(super) struct Limits {
    pub idle: Duration,
    pub memory_bytes: u64,
    pub active: usize,
    pub wait: Duration,
}

impl Default for Limits {
    fn default() -> Self {
        Self {
            idle: Duration::from_secs(180),
            memory_bytes: 512 * 1024 * 1024,
            active: 2,
            wait: Duration::from_secs(30),
        }
    }
}

pub(super) struct Permit {
    file: File,
    owner_pid: u32,
}

struct Waiter {
    path: PathBuf,
    _lease: Permit,
}
impl Drop for Waiter {
    fn drop(&mut self) {
        if self._lease.owner_pid == std::process::id() {
            let _ = fs::remove_file(&self.path);
        }
    }
}
impl Drop for Permit {
    fn drop(&mut self) {
        // Explicitly unlock the acquiring parent's open-file description;
        // a concurrent fork can briefly inherit it before exec closes it.
        if self.owner_pid == std::process::id() {
            let _ = self.file.unlock();
        }
    }
}

fn directory() -> PathBuf {
    std::env::var_os("CGRX_RESOURCE_DIR")
        .map(PathBuf::from)
        .or_else(|| {
            std::env::var_os("XDG_CACHE_HOME").map(|p| PathBuf::from(p).join("cgrx/resources-v1"))
        })
        .or_else(|| {
            std::env::var_os("HOME").map(|p| PathBuf::from(p).join(".cache/cgrx/resources-v1"))
        })
        .unwrap_or_else(|| std::env::temp_dir().join("cgrx-resources-v1"))
}

pub(super) fn acquire(limits: &Limits) -> io::Result<Permit> {
    let root = directory();
    fs::create_dir_all(&root)?;
    let started = Instant::now();
    // Tickets are registered under a short OS lease, before competing for
    // active slots. A hot caller cannot repeatedly bypass an older request.
    // The ticket's own lease lets the next caller reclaim crashed waiters,
    // without PID-reuse assumptions, persistent counters, or request contents.
    let waiter = loop {
        if let Some(_queue) = try_lease(open_lock(&root.join("queue.lock"), false)?)? {
            let waiting = waiting(&root, None)?;
            let ticket = waiting
                .last()
                .map_or(Some(0), |(ticket, _)| ticket.checked_add(1))
                .ok_or_else(|| io::Error::other("resource queue exhausted"))?;
            let path = root.join(format!("wait-{ticket:020}.lock"));
            let lease = try_lease(open_lock(&path, true)?)?
                .ok_or_else(|| io::Error::other("resource ticket unavailable"))?;
            break Waiter {
                path,
                _lease: lease,
            };
        }
        wait_turn(started, limits.wait)?;
    };
    let mut files = Vec::with_capacity(limits.active);
    for index in 0..limits.active {
        files.push(open_lock(
            &root.join(format!("active-{index}.lock")),
            false,
        )?);
    }
    let mut head = false;
    let mut blocker: Option<File> = None;
    loop {
        if let Some(file) = blocker.take() {
            match file.try_lock() {
                Err(fs::TryLockError::WouldBlock) => {
                    blocker = Some(file);
                    wait_turn(started, limits.wait)?;
                    continue;
                }
                Err(fs::TryLockError::Error(error)) => return Err(error),
                Ok(()) => {
                    let _ = file.unlock();
                }
            }
        }
        if !head
            && let Some(_queue) = try_lease(open_lock(&root.join("queue.lock"), false)?)?
            && let Some((_, path)) = waiting(&root, Some(&waiter.path))?.first()
        {
            head = path == &waiter.path;
            if !head {
                blocker = match OpenOptions::new().read(true).write(true).open(path) {
                    Ok(file) => Some(file),
                    Err(error) if error.kind() == io::ErrorKind::NotFound => None,
                    Err(error) => return Err(error),
                };
            }
        }
        // Follow one leased head inode while blocked, rather than repeatedly
        // scanning every ticket from every process. Admission or a crash
        // unlocks it; only then rescan under the queue mutex.
        if head {
            for index in 0..files.len() {
                match files[index].try_lock() {
                    Ok(()) => {
                        return Ok(Permit {
                            file: files.swap_remove(index),
                            owner_pid: std::process::id(),
                        });
                    }
                    Err(fs::TryLockError::WouldBlock) => {}
                    Err(fs::TryLockError::Error(error)) => return Err(error),
                }
            }
        }
        wait_turn(started, limits.wait)?;
    }
}

fn wait_turn(started: Instant, timeout: Duration) -> io::Result<()> {
    let Some(remaining) = timeout
        .checked_sub(started.elapsed())
        .filter(|n| !n.is_zero())
    else {
        return Err(io::Error::new(
            io::ErrorKind::WouldBlock,
            "active request budget exhausted",
        ));
    };
    std::thread::sleep(remaining.min(Duration::from_millis(10)));
    Ok(())
}

fn open_lock(path: &std::path::Path, new: bool) -> io::Result<File> {
    let mut options = OpenOptions::new();
    options.read(true).write(true);
    if new {
        options.create_new(true);
    } else {
        options.create(true).truncate(false);
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    options.open(path)
}

fn try_lease(file: File) -> io::Result<Option<Permit>> {
    match file.try_lock() {
        Ok(()) => Ok(Some(Permit {
            file,
            owner_pid: std::process::id(),
        })),
        Err(fs::TryLockError::WouldBlock) => Ok(None),
        Err(fs::TryLockError::Error(error)) => Err(error),
    }
}

fn waiting(
    root: &std::path::Path,
    own: Option<&std::path::Path>,
) -> io::Result<Vec<(u64, PathBuf)>> {
    let mut result = Vec::new();
    for entry in fs::read_dir(root)? {
        let entry = entry?;
        let name = entry.file_name();
        let Some(ticket) = name
            .to_str()
            .and_then(|s| s.strip_prefix("wait-"))
            .and_then(|s| s.strip_suffix(".lock"))
            .filter(|s| s.len() == 20)
            .and_then(|s| s.parse::<u64>().ok())
        else {
            continue;
        };
        let path = entry.path();
        if own == Some(path.as_path()) {
            result.push((ticket, path));
            continue;
        }
        let file = match OpenOptions::new().read(true).write(true).open(&path) {
            Ok(file) => file,
            Err(error) if error.kind() == io::ErrorKind::NotFound => continue,
            Err(error) => return Err(error),
        };
        if let Some(_stale) = try_lease(file)? {
            // Only unlocked queue tickets are removed. Active-slot inodes and
            // the queue mutex are stable for the lifetime of every server.
            let _ = fs::remove_file(path);
        } else {
            result.push((ticket, path));
        }
    }
    result.sort_by_key(|(ticket, _)| *ticket);
    Ok(result)
}

#[cfg(target_os = "macos")]
pub(super) fn footprint() -> Option<u64> {
    #[repr(C)]
    struct Usage {
        uuid: [u8; 16],
        user: u64,
        system: u64,
        pkg: u64,
        interrupt: u64,
        pageins: u64,
        wired: u64,
        resident: u64,
        footprint: u64,
        start: u64,
        exit: u64,
    }
    #[link(name = "proc")]
    unsafe extern "C" {
        fn proc_pid_rusage(pid: i32, flavor: i32, buffer: *mut std::ffi::c_void) -> i32;
    }
    let mut usage = std::mem::MaybeUninit::<Usage>::zeroed();
    // RUSAGE_INFO_V0 from libproc: physical footprint includes compressed pages.
    let ok = unsafe { proc_pid_rusage(std::process::id() as i32, 0, usage.as_mut_ptr().cast()) };
    (ok == 0).then(|| unsafe { usage.assume_init().footprint })
}

#[cfg(target_os = "linux")]
pub(super) fn footprint() -> Option<u64> {
    let status = fs::read_to_string("/proc/self/status").ok()?;
    let mut bytes = 0;
    for line in status
        .lines()
        .filter(|line| line.starts_with("VmRSS:") || line.starts_with("VmSwap:"))
    {
        bytes += line.split_whitespace().nth(1)?.parse::<u64>().ok()? * 1024;
    }
    Some(bytes)
}

#[cfg(not(any(target_os = "macos", target_os = "linux")))]
pub(super) const fn footprint() -> Option<u64> {
    None
}

pub(super) fn relieve() {
    #[cfg(target_os = "macos")]
    {
        unsafe extern "C" {
            fn malloc_zone_pressure_relief(zone: *mut std::ffi::c_void, goal: usize) -> usize;
        }
        // Apple's supported best-effort purge of already freed allocations.
        unsafe {
            malloc_zone_pressure_relief(std::ptr::null_mut(), 0);
        }
    }
    #[cfg(all(target_os = "linux", target_env = "gnu"))]
    {
        unsafe extern "C" {
            fn malloc_trim(pad: usize) -> i32;
        }
        unsafe {
            malloc_trim(0);
        }
    }
}
