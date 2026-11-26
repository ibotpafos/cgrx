//! Explicitly opted-in project commands. Copy isolation is NOT a security sandbox.
use super::verification::CopyDir;
use serde::Deserialize;
use serde_json::{Value, json};
use std::{
    collections::BTreeMap,
    fs, io,
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::atomic::{AtomicBool, Ordering},
    time::{Duration, Instant},
};
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Config {
    version: u8,
    #[serde(default)]
    dependency_roots: Vec<PathBuf>,
    format: Vec<String>,
    typecheck: Vec<String>,
    tests: Vec<String>,
    #[serde(default = "default_timeout")]
    timeout_ms: u64,
    #[serde(default = "default_snapshot_bytes")]
    snapshot_max_bytes: u64,
    #[serde(default = "default_snapshot_files")]
    snapshot_max_files: usize,
    #[serde(default = "default_snapshot_timeout")]
    snapshot_timeout_ms: u64,
}
fn default_snapshot_bytes() -> u64 {
    256 * 1024 * 1024
}
fn default_snapshot_files() -> usize {
    50000
}
fn default_snapshot_timeout() -> u64 {
    20000
}
fn default_timeout() -> u64 {
    10000
}
fn bad(message: &str) -> io::Error {
    io::Error::other(message)
}
fn excluded(name: &str) -> bool {
    matches!(
        name,
        ".git"
            | ".cgrx"
            | ".fast"
            | ".ssh"
            | ".aws"
            | ".npmrc"
            | ".yarnrc.yml"
            | ".netrc"
            | ".kilo"
            | ".pt"
            | ".agent"
            | ".worktrees"
    ) || name == ".env"
        || name.starts_with(".env.")
        || name.ends_with(".pem")
        || name.ends_with(".key")
        || name.ends_with(".tsbuildinfo")
}
fn excluded_from_copy(path: &Path) -> bool {
    let mut dependency = false;
    for (depth, component) in path.components().enumerate() {
        let name = component.as_os_str().to_string_lossy();
        if name == "node_modules" {
            dependency = true;
        }
        if excluded(&name) {
            return true;
        }
        if depth == 0 && matches!(name.as_ref(), "local" | "evidence" | "WORKSPACE.local.md") {
            return true;
        }
        if !dependency
            && (matches!(name.as_ref(), ".next" | ".cache")
                || (depth == 0
                    && matches!(name.as_ref(), "target" | "dist" | "build" | "coverage")))
        {
            return true;
        }
    }
    false
}
struct Budget {
    files: usize,
    bytes: u64,
    start: Instant,
    max_bytes: u64,
    max_files: usize,
    timeout_ms: u64,
    dependency_roots: Vec<PathBuf>,
}
impl Budget {
    fn excluded(&self, path: &Path) -> bool {
        if self.dependency_roots.iter().any(|r| path.starts_with(r)) {
            excluded_from_copy(&Path::new("node_modules").join(path))
        } else {
            excluded_from_copy(path)
        }
    }
    fn new(c: &Config) -> Self {
        Self {
            files: 0,
            bytes: 0,
            start: Instant::now(),
            max_bytes: c.snapshot_max_bytes,
            max_files: c.snapshot_max_files,
            timeout_ms: c.snapshot_timeout_ms,
            dependency_roots: c.dependency_roots.clone(),
        }
    }
}
fn copy_tree(
    source: &Path,
    dest: &Path,
    root: &Path,
    dest_root: &Path,
    b: &mut Budget,
) -> io::Result<()> {
    fs::create_dir_all(dest)?;
    for e in fs::read_dir(source)? {
        let e = e?;
        let name = e.file_name();
        if b.excluded(
            e.path()
                .strip_prefix(root)
                .map_err(|_| bad("invalid_copy_root"))?,
        ) {
            continue;
        }
        b.files += 1;
        if b.files > b.max_files || b.start.elapsed() > Duration::from_millis(b.timeout_ms) {
            return Err(bad("snapshot_budget_exceeded"));
        }
        let from = e.path();
        let to = dest.join(name);
        let meta = fs::symlink_metadata(&from)?;
        if meta.file_type().is_symlink() {
            let resolved = from.canonicalize().map_err(|_| {
                bad(&format!(
                    "dangling_symlink: {}",
                    from.strip_prefix(root).unwrap_or(&from).display()
                ))
            })?;
            let relative = resolved.strip_prefix(root).map_err(|_| {
                bad(&format!(
                    "external_symlink: {}",
                    from.strip_prefix(root).unwrap_or(&from).display()
                ))
            })?;
            if b.excluded(relative) {
                return Err(bad("excluded_symlink_target"));
            }
            #[cfg(unix)]
            std::os::unix::fs::symlink(dest_root.join(relative), &to)?;
            #[cfg(not(unix))]
            return Err(bad("symlink_copy_unsupported"));
        } else if meta.is_dir() {
            copy_tree(&from, &to, root, dest_root, b)?;
        } else if meta.is_file() {
            b.bytes += meta.len();
            if b.bytes > b.max_bytes {
                return Err(bad("snapshot_byte_budget_exceeded"));
            }
            fs::copy(from, to)?;
        } else {
            return Err(bad("special_file_not_supported"));
        }
    }
    Ok(())
}
fn copy_snapshot(root: &Path, dest: &Path, b: &mut Budget) -> io::Result<()> {
    let inventory = Command::new("git")
        .args(["ls-files", "-c", "-o", "--exclude-standard", "-z"])
        .current_dir(root)
        .env_remove("GIT_DIR")
        .env_remove("GIT_WORK_TREE")
        .output()?;
    if !inventory.status.success() || inventory.stdout.len() > 32 * 1024 * 1024 {
        return Err(bad("git_inventory_unavailable"));
    }
    fs::create_dir_all(dest)?;
    let mut dependencies = std::collections::BTreeSet::from([PathBuf::from("node_modules")]);
    let mut seen = std::collections::BTreeSet::new();
    for name in inventory
        .stdout
        .split(|b| *b == 0)
        .filter(|s| !s.is_empty())
    {
        let name = std::str::from_utf8(name).map_err(|_| bad("non_utf8_snapshot_path"))?;
        let relative = Path::new(name);
        if relative.is_absolute()
            || relative
                .components()
                .any(|c| !matches!(c, std::path::Component::Normal(_)))
        {
            return Err(bad("unsafe_snapshot_path"));
        }
        if excluded_from_copy(relative) || !seen.insert(name.to_owned()) {
            continue;
        }
        let source = root.join(relative);
        if !source.exists() && fs::symlink_metadata(&source).is_err() {
            continue;
        }
        let meta = fs::symlink_metadata(&source)?;
        let target = dest.join(relative);
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent)?;
        }
        b.files += 1;
        b.bytes += meta.len();
        if b.files > b.max_files
            || b.bytes > b.max_bytes
            || b.start.elapsed() > Duration::from_millis(b.timeout_ms)
        {
            return Err(bad("snapshot_budget_exceeded"));
        }
        if meta.file_type().is_symlink() {
            let resolved = source.canonicalize()?;
            let mapped = resolved
                .strip_prefix(root)
                .map_err(|_| bad(&format!("external_symlink: {}", relative.display())))?;
            if excluded_from_copy(mapped) {
                return Err(bad("excluded_symlink_target"));
            }
            #[cfg(unix)]
            std::os::unix::fs::symlink(dest.join(mapped), target)?;
            #[cfg(not(unix))]
            return Err(bad("symlink_copy_unsupported"));
        } else if meta.is_file() {
            fs::copy(source, target)?;
        } else {
            return Err(bad("unsupported_snapshot_entry"));
        }
        if relative.file_name().is_some_and(|s| s == "package.json") {
            dependencies.insert(relative.parent().unwrap().join("node_modules"));
        }
    }
    // Explicit generated dependencies are independent copies, never shared links.
    for dependency in b.dependency_roots.clone() {
        let source = root.join(&dependency);
        if !source.canonicalize()?.starts_with(root)
            || fs::symlink_metadata(&source)?.file_type().is_symlink()
        {
            return Err(bad("unsafe_dependency_root"));
        }
        copy_tree(&source, &dest.join(dependency), root, dest, b)?;
    }
    for dependency in dependencies {
        let source = root.join(&dependency);
        if !source.is_dir() {
            continue;
        }
        if fs::symlink_metadata(&source)?.file_type().is_symlink() {
            return Err(bad("symlink_dependency_root"));
        }
        copy_tree(&source, &dest.join(dependency), root, dest, b)?;
    }
    Ok(())
}
pub(super) fn profile_clean_revision(root: &Path, revision: &str, stop: &AtomicBool) -> bool {
    let Ok(scratch) = super::verification::temporary() else {
        return false;
    };
    let Some(root) = root.to_str() else {
        return false;
    };
    for (label, args, expected) in [
        (
            "status",
            vec![
                "-c",
                "core.fsmonitor=false",
                "-c",
                "core.untrackedCache=false",
                "status",
                "--porcelain=v1",
                "--untracked-files=normal",
            ],
            "",
        ),
        ("head", vec!["rev-parse", "--verify", "HEAD"], revision),
    ] {
        let argv = ["git", "--no-replace-objects", "-C", root]
            .into_iter()
            .chain(args)
            .map(str::to_owned)
            .collect::<Vec<_>>();
        let run = run_bounded(&scratch.0, &scratch.0, label, &argv, 1_000, Some(stop));
        if run["status"] != "passed"
            || !fs::read_to_string(scratch.0.join(format!("{label}.out")))
                .is_ok_and(|value| value.trim() == expected)
        {
            return false;
        }
    }
    !revision.is_empty()
}

// Profile inputs are committed blobs; generated dependencies are explicit, bounded copies.
pub(super) fn copy_for_profile(
    root: &Path,
    dest: &Path,
    revision: &str,
    source_paths: &[PathBuf],
    dependency_roots: &[PathBuf],
    stop: &AtomicBool,
) -> io::Result<()> {
    let scratch = super::verification::temporary()?;
    let mut b = Budget {
        files: 0,
        bytes: 0,
        start: Instant::now(),
        max_bytes: default_snapshot_bytes(),
        max_files: default_snapshot_files(),
        timeout_ms: 5_000,
        dependency_roots: dependency_roots.to_vec(),
    };
    if !matches!(revision.len(), 40 | 64) || !revision.bytes().all(|c| c.is_ascii_hexdigit()) {
        return Err(bad("invalid_revision"));
    }
    let git = |args: &[&str], label: &str, limit: u64, b: &Budget| -> io::Result<Vec<u8>> {
        let remaining = b
            .timeout_ms
            .saturating_sub(b.start.elapsed().as_millis() as u64);
        if remaining == 0 || stop.load(Ordering::Acquire) {
            return Err(bad("snapshot_timeout_or_cancelled"));
        }
        let root_arg = root.to_str().ok_or_else(|| bad("unsafe_snapshot_path"))?;
        let argv = [
            "git",
            "--no-replace-objects",
            "--literal-pathspecs",
            "-C",
            root_arg,
        ]
        .into_iter()
        .chain(args.iter().copied())
        .map(str::to_owned)
        .collect::<Vec<_>>();
        let result = run_bounded_limit(
            &scratch.0,
            &scratch.0,
            label,
            &argv,
            remaining,
            Some(stop),
            limit,
        );
        if result["status"] != "passed" {
            return Err(bad(match result["status"].as_str() {
                Some("output_limit") => "snapshot_byte_budget_exceeded",
                Some("timeout" | "cancelled") => "snapshot_timeout_or_cancelled",
                _ => "committed_blob_unavailable",
            }));
        }
        fs::read(scratch.0.join(format!("{label}.out")))
    };
    if source_paths.is_empty()
        || source_paths
            .iter()
            .chain(dependency_roots)
            .any(|p| !profile_path_valid(p))
    {
        return Err(bad("unsafe_snapshot_path"));
    }
    let mut tree_args = vec!["ls-tree", "-r", "-z", "-l", revision, "--"];
    for path in source_paths.iter().chain(dependency_roots) {
        tree_args.push(path.to_str().ok_or_else(|| bad("unsafe_snapshot_path"))?);
    }
    let tree = git(&tree_args, "tree", 32 * 1024 * 1024, &b)?;
    fs::create_dir_all(dest)?;
    for record in tree.split(|c| *c == 0).filter(|r| !r.is_empty()) {
        // Count every selected inventory entry, including excluded entries.
        b.files += 1;
        if b.files > b.max_files {
            return Err(bad("snapshot_entry_budget_exceeded"));
        }
        let record = std::str::from_utf8(record).map_err(|_| bad("non_utf8_snapshot_path"))?;
        let (header, name) = record
            .split_once('\t')
            .ok_or_else(|| bad("invalid_git_inventory"))?;
        let path = Path::new(name);
        if dependency_roots.iter().any(|p| path.starts_with(p)) {
            return Err(bad("dependency_contains_committed_source"));
        }
        if !source_paths.iter().any(|p| path.starts_with(p))
            || excluded_from_copy(path)
            || path.components().any(|c| c.as_os_str() == "node_modules")
        {
            continue;
        }
        if !profile_path_valid(path) {
            return Err(bad("unsafe_snapshot_path"));
        }
        let fields = header.split_whitespace().collect::<Vec<_>>();
        if fields.len() != 4 || fields[1] != "blob" || !matches!(fields[0], "100644" | "100755") {
            return Err(bad("unsupported_committed_entry"));
        }
        let size: u64 = fields[3].parse().map_err(|_| bad("invalid_blob_size"))?;
        if size > b.max_bytes.saturating_sub(b.bytes) {
            return Err(bad("snapshot_byte_budget_exceeded"));
        }
        // shortcut: one Git process per blob; batch if real workloads hit the copy deadline.
        let bytes = git(&["cat-file", "blob", fields[2]], "blob", size, &b)?;
        if bytes.len() as u64 != size {
            return Err(bad("invalid_blob_size"));
        }
        b.bytes += size;
        let to = dest.join(path);
        fs::create_dir_all(to.parent().unwrap())?;
        fs::write(&to, bytes)?;
        #[cfg(unix)]
        if fields[0] == "100755" {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(to, fs::Permissions::from_mode(0o755))?;
        }
    }
    fn dependencies(
        root: &Path,
        dest: &Path,
        path: &Path,
        b: &mut Budget,
        stop: &AtomicBool,
    ) -> io::Result<()> {
        if stop.load(Ordering::Acquire) || b.start.elapsed() >= Duration::from_millis(b.timeout_ms)
        {
            return Err(bad("snapshot_timeout_or_cancelled"));
        }
        b.files += 1;
        if b.files > b.max_files {
            return Err(bad("snapshot_entry_budget_exceeded"));
        }
        if b.excluded(path) {
            return Ok(());
        }
        let from = root.join(path);
        let to = dest.join(path);
        let meta = fs::symlink_metadata(&from)?;
        // Reject links, including ancestor links, rather than importing unselected data.
        if meta.is_symlink() || from.canonicalize()? != from {
            return Err(bad("unsafe_dependency_symlink"));
        }
        if meta.is_dir() {
            fs::create_dir_all(&to)?;
            for entry in fs::read_dir(from)? {
                dependencies(root, dest, &path.join(entry?.file_name()), b, stop)?;
            }
        } else if meta.is_file() {
            use std::io::Read;
            let remaining = b.max_bytes.saturating_sub(b.bytes);
            if meta.len() > remaining {
                return Err(bad("snapshot_byte_budget_exceeded"));
            }
            let mut bytes = Vec::new();
            fs::File::open(from)?
                .take(remaining + 1)
                .read_to_end(&mut bytes)?;
            if bytes.len() as u64 > remaining {
                return Err(bad("snapshot_byte_budget_exceeded"));
            }
            b.bytes += bytes.len() as u64;
            fs::create_dir_all(to.parent().unwrap())?;
            // Never replace a committed blob with mutable generated data.
            use std::io::Write;
            fs::OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(to)?
                .write_all(&bytes)?;
        } else {
            return Err(bad("special_file_not_supported"));
        }
        Ok(())
    }
    let root = root.canonicalize()?;
    for path in dependency_roots {
        if !profile_path_valid(path) || b.excluded(path) {
            return Err(bad("unsafe_dependency_root"));
        }
        dependencies(&root, dest, path, &mut b, stop)?;
    }
    if stop.load(Ordering::Acquire) || b.start.elapsed() >= Duration::from_millis(b.timeout_ms) {
        return Err(bad("snapshot_timeout_or_cancelled"));
    }
    Ok(())
}

pub(super) fn profile_path_valid(path: &Path) -> bool {
    !path.as_os_str().is_empty()
        && path.as_os_str().len() <= 512
        && path
            .components()
            .all(|c| matches!(c, std::path::Component::Normal(_)))
        && !excluded_from_copy(&Path::new("node_modules").join(path))
        && !path.components().next().is_some_and(|c| {
            matches!(
                c.as_os_str().to_str(),
                Some("local" | "evidence" | "WORKSPACE.local.md")
            )
        })
        && !path.components().any(|c| {
            c.as_os_str()
                .to_string_lossy()
                .chars()
                .any(char::is_control)
        })
}

pub(super) fn profile_copy_reason(error: &io::Error) -> &'static str {
    match error.to_string().as_str() {
        "invalid_revision" => "invalid_revision",
        "snapshot_timeout_or_cancelled" => "snapshot_timeout_or_cancelled",
        "snapshot_byte_budget_exceeded" => "snapshot_byte_budget_exceeded",
        "snapshot_entry_budget_exceeded" => "snapshot_entry_budget_exceeded",
        "unsupported_committed_entry" => "unsupported_committed_entry",
        "dependency_contains_committed_source" => "dependency_contains_committed_source",
        "unsafe_dependency_symlink" => "unsafe_dependency_symlink",
        "unsafe_dependency_root" => "unsafe_dependency_root",
        "unsafe_snapshot_path" | "non_utf8_snapshot_path" => "unsafe_snapshot_path",
        "committed_blob_unavailable" => "committed_blob_unavailable",
        _ if error.kind() == io::ErrorKind::NotFound => "source_or_dependency_missing",
        _ if error.kind() == io::ErrorKind::AlreadyExists => "dependency_overlaps_source",
        _ => "snapshot_io_unavailable",
    }
}

fn hashes(root: &Path) -> io::Result<BTreeMap<PathBuf, String>> {
    fn visit(root: &Path, path: &Path, out: &mut BTreeMap<PathBuf, String>) -> io::Result<()> {
        for e in fs::read_dir(path)? {
            let e = e?;
            let name = e.file_name();
            if excluded_from_copy(
                e.path()
                    .strip_prefix(root)
                    .map_err(|_| bad("unsafe_hash_path"))?,
            ) || name == "node_modules"
            {
                continue;
            }
            let p = e.path();
            let m = fs::symlink_metadata(&p)?;
            if m.is_dir() {
                visit(root, &p, out)?;
            } else if m.is_file() {
                out.insert(
                    p.strip_prefix(root).unwrap().to_owned(),
                    blake3::hash(&fs::read(p)?).to_hex().to_string(),
                );
            }
        }
        Ok(())
    }
    let mut result = BTreeMap::new();
    visit(root, root, &mut result)?;
    Ok(result)
}
#[cfg(unix)]
fn kill_group(pid: u32) {
    // A fresh process group owns all descendants, including npm's shell children.
    let _ = Command::new("/bin/kill")
        .args(["-KILL", "--", &format!("-{pid}")])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status();
}
fn run(root: &Path, logs: &Path, label: &str, argv: &[String], path: &str, timeout: u64) -> Value {
    let argv = argv
        .iter()
        .map(|s| s.replace("{path}", path))
        .collect::<Vec<_>>();
    let mut result = run_bounded(root, logs, label, &argv, timeout, None);
    result["command"] = json!(argv);
    result
}

pub(super) fn run_bounded(
    root: &Path,
    logs: &Path,
    label: &str,
    argv: &[String],
    timeout: u64,
    stop: Option<&AtomicBool>,
) -> Value {
    run_bounded_limit(root, logs, label, argv, timeout, stop, 131072)
}

fn run_bounded_limit(
    root: &Path,
    logs: &Path,
    label: &str,
    argv: &[String],
    timeout: u64,
    stop: Option<&AtomicBool>,
    output_limit: u64,
) -> Value {
    let execute = || -> io::Result<Value> {
        let stdout = logs.join(format!("{label}.out"));
        let stderr = logs.join(format!("{label}.err"));
        let out = fs::File::create(&stdout)?;
        let err = fs::File::create(&stderr)?;
        let host_home = std::env::var("HOME").unwrap_or_default();
        let mut cmd = Command::new(&argv[0]);
        cmd.args(&argv[1..])
            .current_dir(root)
            .env_clear()
            .env(
                "PATH",
                format!(
                    "{}:{}",
                    root.join("node_modules/.bin").display(),
                    std::env::var("PATH").unwrap_or_default()
                ),
            )
            .env("HOME", logs)
            .env("TMPDIR", logs)
            .env("CI", "1")
            .env(
                "RUSTUP_HOME",
                std::env::var("RUSTUP_HOME").unwrap_or_else(|_| format!("{host_home}/.rustup")),
            )
            .env(
                "CARGO_HOME",
                std::env::var("CARGO_HOME").unwrap_or_else(|_| format!("{host_home}/.cargo")),
            )
            .env("RUSTUP_AUTO_INSTALL", "0")
            .env("CARGO_NET_OFFLINE", "true")
            .env("GOPROXY", "off")
            .env("GOSUMDB", "off")
            .env("GOCACHE", logs.join("go-cache"))
            .env(
                "GOMODCACHE",
                std::env::var("GOMODCACHE").unwrap_or_else(|_| format!("{host_home}/go/pkg/mod")),
            )
            .env("CGRX_QUALITY_COPY", "1")
            .env("NO_COLOR", "1")
            .env("npm_config_cache", logs.join("npm-cache"))
            .env("npm_config_offline", "true")
            .env("npm_config_ignore_scripts", "true")
            .env("GIT_CONFIG_NOSYSTEM", "1")
            .env("GIT_CONFIG_GLOBAL", "/dev/null")
            .env("GIT_NO_LAZY_FETCH", "1")
            .stdin(Stdio::null())
            .stdout(Stdio::from(out))
            .stderr(Stdio::from(err));
        #[cfg(unix)]
        {
            use std::os::unix::process::CommandExt;
            cmd.process_group(0);
        }
        #[cfg(not(unix))]
        {
            return Ok(json!({"status":"unavailable","reason":"process_groups_required"}));
        }
        let mut child = cmd.spawn()?;
        let pid = child.id();
        let start = Instant::now();
        let mut reason = None;
        let status = loop {
            let bytes = fs::metadata(&stdout)?.len() + fs::metadata(&stderr)?.len();
            let cancelled = stop.is_some_and(|flag| flag.load(Ordering::Acquire));
            if cancelled || bytes > output_limit || start.elapsed() > Duration::from_millis(timeout)
            {
                reason = Some(if cancelled {
                    "cancelled"
                } else if bytes > output_limit {
                    "output_limit"
                } else {
                    "timeout"
                });
                #[cfg(unix)]
                kill_group(pid);
                let _ = child.kill();
                break child.wait()?;
            }
            if let Some(status) = child.try_wait()? {
                break status;
            }
            std::thread::sleep(Duration::from_millis(20));
        };
        #[cfg(unix)]
        kill_group(pid);
        if fs::metadata(&stdout)?.len() + fs::metadata(&stderr)?.len() > output_limit {
            reason = Some("output_limit");
        }
        Ok(
            json!({"status":reason.unwrap_or(if status.success(){"passed"}else{"failed"}),"exit_code":status.code(),"duration_ms":start.elapsed().as_millis(),
            "output_bytes":fs::metadata(&stdout)?.len()+fs::metadata(&stderr)?.len(),"diagnostics":"withheld: project output may contain secrets"}),
        )
    };
    execute()
        .unwrap_or_else(|_| json!({"status":"unavailable","reason":"command_or_io_unavailable"}))
}
fn check_config(root: &Path) -> io::Result<Config> {
    let p = root.join(".cgrx/quality-checks.json").canonicalize()?;
    if !p.starts_with(root) || fs::metadata(&p)?.len() > 16384 {
        return Err(bad("unsafe_config"));
    }
    let c: Config = serde_json::from_slice(&fs::read(p)?).map_err(|_| bad("invalid_config"))?;
    if c.version != 1
        || !(100..=60000).contains(&c.timeout_ms)
        || c.snapshot_max_bytes > 8 * 1024 * 1024 * 1024
        || c.snapshot_max_bytes == 0
        || c.snapshot_max_files == 0
        || c.snapshot_max_files > 500000
        || !(100..=120000).contains(&c.snapshot_timeout_ms)
    {
        return Err(bad("invalid_version_or_timeout"));
    }
    if c.dependency_roots.len() > 16 {
        return Err(bad("too_many_dependency_roots"));
    }
    for path in &c.dependency_roots {
        if path.is_absolute()
            || path.as_os_str().len() > 512
            || path
                .components()
                .any(|c| !matches!(c, std::path::Component::Normal(_)))
            || !path
                .file_name()
                .is_some_and(|n| n == "dist" || n == "build" || n == "types" || n == "generated")
            || path.components().next().is_some_and(|c| {
                matches!(
                    c.as_os_str().to_str(),
                    Some("local" | "evidence" | "WORKSPACE.local.md")
                )
            })
            || excluded_from_copy(&Path::new("node_modules").join(path))
        {
            return Err(bad("unsafe_dependency_root"));
        }
    }
    for argv in [&c.format, &c.typecheck, &c.tests] {
        if argv.is_empty()
            || argv.len() > 32
            || argv.iter().any(|a| a.len() > 2048 || a.contains('\0'))
        {
            return Err(bad("invalid_command"));
        }
        if Path::new(&argv[0]).is_absolute() || argv[0].contains('/') || argv[0].contains('\\') {
            return Err(bad("command_must_use_path"));
        }
    }
    Ok(c)
}
pub(super) fn verify(root: &Path, path: &str, before: &str, after: &str, diff: &str) -> Value {
    let work = || -> io::Result<Value> {
        let root = root.canonicalize()?;
        let config = check_config(&root)?;
        let dir: CopyDir = super::verification::temporary()?;
        let baseline = dir.0.join("baseline");
        let modified = dir.0.join("modified");
        copy_snapshot(&root, &baseline, &mut Budget::new(&config))?;
        let original_hashes = hashes(&baseline)?;
        // Recopy from the immutable snapshot, rebasing internal symlinks to each copy.
        copy_tree(
            &baseline,
            &modified,
            &baseline,
            &modified,
            &mut Budget::new(&config),
        )?;
        if fs::read_to_string(baseline.join(path))? != before {
            return Err(bad("stale_snapshot"));
        }
        fs::write(dir.0.join("candidate.patch"), diff)?;
        let apply = Command::new("git")
            .args(["apply", "--no-index", "--whitespace=nowarn"])
            .arg(dir.0.join("candidate.patch"))
            .current_dir(&modified)
            .env_clear()
            .env("PATH", std::env::var("PATH").unwrap_or_default())
            .env("GIT_CONFIG_NOSYSTEM", "1")
            .env("GIT_CONFIG_GLOBAL", "/dev/null")
            .output()?;
        if !apply.status.success() || fs::read_to_string(modified.join(path))? != after {
            return Err(bad("patch_application_failed"));
        }
        let initial = hashes(&modified)?;
        let mut base = json!({});
        let mut changed = json!({});
        let mut formatted = None;
        let mut checks_stable = true;
        for (label, copy, out) in [
            ("baseline", &baseline, &mut base),
            ("modified", &modified, &mut changed),
        ] {
            let mut after_format = None;
            for (stage, argv) in [
                ("format", &config.format),
                ("typecheck", &config.typecheck),
                ("tests", &config.tests),
            ] {
                out[stage] = run(
                    copy,
                    &dir.0,
                    &format!("{label}-{stage}"),
                    argv,
                    path,
                    config.timeout_ms,
                );
                if stage == "format" && label == "modified" {
                    let now = hashes(copy)?;
                    if initial
                        .iter()
                        .any(|(p, h)| p != Path::new(path) && now.get(p) != Some(h))
                        || now.keys().any(|p| !initial.contains_key(p))
                    {
                        out[stage]["status"] = json!("failed");
                        out[stage]["reason"] = json!("formatter_changed_other_files");
                    }
                    let text = fs::read_to_string(copy.join(path))?;
                    if text.len() > 262144 {
                        return Err(bad("formatted_file_too_large"));
                    }
                    formatted = Some(text);
                }
                if stage == "format" {
                    after_format = Some(hashes(copy)?);
                }
            }
            checks_stable &= after_format.as_ref() == Some(&hashes(copy)?);
        }
        let formatted = formatted.ok_or_else(|| bad("no_formatted_source"))?;
        let final_source = fs::read_to_string(modified.join(path))?;
        let unchanged = original_hashes.iter().all(|(p, h)| {
            fs::read(root.join(p)).is_ok_and(|b| blake3::hash(&b).to_hex().as_str() == h)
        });
        let stable = final_source == formatted && checks_stable;
        let passed = unchanged
            && stable
            && [&base, &changed].iter().all(|r| {
                ["format", "typecheck", "tests"]
                    .iter()
                    .all(|s| r[*s]["status"] == "passed")
            });
        let final_diff = similar::TextDiff::from_lines(before, &final_source)
            .unified_diff()
            .context_radius(1)
            .header(&format!("a/{path}"), &format!("b/{path}"))
            .to_string();
        if final_diff.len() > 16384 {
            return Err(bad("formatted_diff_too_large"));
        }
        Ok(
            json!({"status":if passed{"project_checks_passed"}else{"project_checks_failed"},"baseline":base,"modified":changed,
            "format":changed["format"],"typecheck":changed["typecheck"],"tests":changed["tests"],"diff_applied":true,
            "formatted_diff":if stable && unchanged && changed["format"]["status"]=="passed"{Some(final_diff)}else{None},"source_modified":!unchanged,"checked_formatted_source":true,"post_checks_source_stable":stable,
            "isolated":true,"security_sandbox":false,"requires_review":true,
            "limitations":"Trusted commands only. Separate copies, not OS/network isolation. Dependencies must already exist; no automatic install. Output withheld to avoid secrets."}),
        )
    };
    match work() {
        Ok(v) => v,
        Err(e) => {
            json!({"status":"blocked","reason":if e.kind()==io::ErrorKind::NotFound{"config_or_dependency_missing"}else{"snapshot_config_or_io_error"},"detail":e.to_string().chars().take(200).collect::<String>(),"diff_applied":false,"source_modified":false,"security_sandbox":false,"format":{"status":"not_run"},"typecheck":{"status":"not_run"},"tests":{"status":"not_run"}})
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn git(root: &Path, args: &[&str]) -> String {
        let output = Command::new("git")
            .args(args)
            .current_dir(root)
            .env_remove("GIT_CONFIG_COUNT")
            .env("GIT_CONFIG_GLOBAL", "/dev/null")
            .output()
            .unwrap();
        assert!(
            output.status.success(),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        String::from_utf8(output.stdout).unwrap().trim().to_owned()
    }

    fn committed_fixture() -> (CopyDir, String) {
        let src = super::super::verification::temporary().unwrap();
        git(&src.0, &["init", "-q"]);
        fs::write(src.0.join("bench.py"), "committed").unwrap();
        fs::write(src.0.join("unused.py"), "unused").unwrap();
        git(&src.0, &["add", "."]);
        git(
            &src.0,
            &[
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-qm",
                "fixture",
            ],
        );
        let revision = git(&src.0, &["rev-parse", "HEAD"]);
        (src, revision)
    }

    #[test]
    fn profile_copies_exact_revision_even_with_assume_unchanged() {
        let (src, revision) = committed_fixture();
        git(&src.0, &["update-index", "--assume-unchanged", "bench.py"]);
        fs::write(src.0.join("bench.py"), "mutable secret").unwrap();
        assert!(profile_clean_revision(
            &src.0,
            &revision,
            &AtomicBool::new(false)
        ));
        fs::create_dir_all(src.0.join("node_modules/unneeded")).unwrap();
        fs::write(src.0.join("node_modules/unneeded/raw"), "private").unwrap();
        let dst = super::super::verification::temporary().unwrap();
        copy_for_profile(
            &src.0,
            &dst.0,
            &revision,
            &["bench.py".into()],
            &[],
            &AtomicBool::new(false),
        )
        .unwrap();
        assert_eq!(
            fs::read_to_string(dst.0.join("bench.py")).unwrap(),
            "committed"
        );
        assert!(!dst.0.join("unused.py").exists());
        assert!(!dst.0.join("node_modules").exists());
        // An older exact revision is independent of the index and current HEAD too.
        git(
            &src.0,
            &["update-index", "--no-assume-unchanged", "bench.py"],
        );
        git(&src.0, &["add", "bench.py"]);
        git(
            &src.0,
            &[
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-qm",
                "next",
            ],
        );
        let dst = super::super::verification::temporary().unwrap();
        copy_for_profile(
            &src.0,
            &dst.0,
            &revision,
            &["bench.py".into()],
            &[],
            &AtomicBool::new(false),
        )
        .unwrap();
        assert_eq!(
            fs::read_to_string(dst.0.join("bench.py")).unwrap(),
            "committed"
        );
    }

    #[test]
    fn profile_dependencies_are_explicit_and_bounded() {
        let (src, revision) = committed_fixture();
        fs::create_dir_all(src.0.join("node_modules/needed/dist")).unwrap();
        fs::create_dir_all(src.0.join("node_modules/other")).unwrap();
        fs::write(
            src.0.join("node_modules/needed/dist/index.js"),
            "dependency",
        )
        .unwrap();
        fs::write(src.0.join("node_modules/needed/.env"), "private").unwrap();
        let dst = super::super::verification::temporary().unwrap();
        let deps = [PathBuf::from("node_modules/needed")];
        copy_for_profile(
            &src.0,
            &dst.0,
            &revision,
            &["bench.py".into()],
            &deps,
            &AtomicBool::new(false),
        )
        .unwrap();
        assert!(dst.0.join("node_modules/needed/dist/index.js").is_file());
        assert!(!dst.0.join("node_modules/needed/.env").exists());
        assert!(!dst.0.join("node_modules/other").exists());
        fs::File::create(src.0.join("node_modules/needed/huge"))
            .unwrap()
            .set_len(default_snapshot_bytes() + 1)
            .unwrap();
        let dst = super::super::verification::temporary().unwrap();
        let error = copy_for_profile(
            &src.0,
            &dst.0,
            &revision,
            &["bench.py".into()],
            &deps,
            &AtomicBool::new(false),
        )
        .unwrap_err();
        assert_eq!(profile_copy_reason(&error), "snapshot_byte_budget_exceeded");
        let error = copy_for_profile(
            &src.0,
            &dst.0,
            &revision,
            &["bench.py".into()],
            &[],
            &AtomicBool::new(true),
        )
        .unwrap_err();
        assert_eq!(profile_copy_reason(&error), "snapshot_timeout_or_cancelled");
    }

    #[cfg(unix)]
    #[test]
    fn profile_rejects_committed_links_and_dependency_ancestor_links() {
        let (src, _) = committed_fixture();
        std::os::unix::fs::symlink("/etc/passwd", src.0.join("link.py")).unwrap();
        git(&src.0, &["add", "link.py"]);
        git(
            &src.0,
            &[
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid",
                "commit",
                "-qm",
                "link",
            ],
        );
        let revision = git(&src.0, &["rev-parse", "HEAD"]);
        let dst = super::super::verification::temporary().unwrap();
        let error = copy_for_profile(
            &src.0,
            &dst.0,
            &revision,
            &["link.py".into()],
            &[],
            &AtomicBool::new(false),
        )
        .unwrap_err();
        assert_eq!(profile_copy_reason(&error), "unsupported_committed_entry");
        let external = super::super::verification::temporary().unwrap();
        fs::create_dir(external.0.join("dist")).unwrap();
        std::os::unix::fs::symlink(&external.0, src.0.join("deps")).unwrap();
        let error = copy_for_profile(
            &src.0,
            &dst.0,
            &revision,
            &["bench.py".into()],
            &["deps/dist".into()],
            &AtomicBool::new(false),
        )
        .unwrap_err();
        assert_eq!(profile_copy_reason(&error), "unsafe_dependency_symlink");
        assert_eq!(
            profile_copy_reason(&io::Error::other("private /host/path token")),
            "snapshot_io_unavailable"
        );
    }

    #[test]
    fn profile_dependencies_cannot_import_mutable_committed_source() {
        let (src, revision) = committed_fixture();
        fs::write(src.0.join("bench.py"), "mutable secret").unwrap();
        let dst = super::super::verification::temporary().unwrap();
        let error = copy_for_profile(
            &src.0,
            &dst.0,
            &revision,
            &["unused.py".into()],
            &["bench.py".into()],
            &AtomicBool::new(false),
        )
        .unwrap_err();
        assert_eq!(
            profile_copy_reason(&error),
            "dependency_contains_committed_source"
        );
        assert!(!dst.0.join("bench.py").exists());
    }

    #[test]
    fn profile_copy_config_paths_are_relative_and_non_sensitive() {
        for path in [
            "",
            ".",
            "../escape",
            "/absolute",
            "bench/../escape",
            ".env",
            "node_modules/pkg/.env",
            "local/data",
            ".fast/state.json",
            "a\n.py",
        ] {
            assert!(!profile_path_valid(Path::new(path)), "{path}");
        }
        for path in ["bench.py", "bench", "node_modules/pkg", "service/dist"] {
            assert!(profile_path_valid(Path::new(path)), "{path}");
        }
    }

    #[test]
    fn fast_exiting_command_still_obeys_output_budget() {
        let dir = super::super::verification::temporary().unwrap();
        let argv = vec![
            "node".to_owned(),
            "-e".to_owned(),
            "process.stdout.write('x'.repeat(200000))".to_owned(),
        ];
        assert_eq!(
            run_bounded(&dir.0, &dir.0, "output", &argv, 10000, None)["status"],
            "output_limit"
        );
    }

    #[test]
    fn compiled_dependency_directories_are_copied() {
        assert!(!excluded_from_copy(Path::new(
            "node_modules/example/dist/index.js"
        )));
        assert!(!excluded_from_copy(Path::new(
            "node_modules/example/build/index.js"
        )));
        assert!(excluded_from_copy(Path::new("dist/index.js")));
        assert!(!excluded_from_copy(Path::new(
            "clients/web/src/app/api/coverage/route.ts"
        )));
        assert!(!excluded_from_copy(Path::new(
            "packages/lib/src/build/index.ts"
        )));
        assert!(!excluded_from_copy(Path::new(
            "node_modules/example/local/index.js"
        )));
        assert!(excluded_from_copy(Path::new("node_modules/example/.env")));
    }
    #[test]
    fn git_snapshot_excludes_ignored_files_and_copies_dependencies() {
        let source = super::super::verification::temporary().unwrap();
        let target = super::super::verification::temporary().unwrap();
        assert!(
            Command::new("git")
                .args(["init", "-q"])
                .current_dir(&source.0)
                .status()
                .unwrap()
                .success()
        );
        fs::write(source.0.join(".gitignore"), "ignored.txt\nnode_modules\n").unwrap();
        fs::write(source.0.join("ignored.txt"), "not source").unwrap();
        fs::write(source.0.join("a.ts"), "const a=1;").unwrap();
        fs::create_dir_all(source.0.join("node_modules/pkg/dist")).unwrap();
        fs::write(source.0.join("node_modules/pkg/dist/index.js"), "original").unwrap();
        let c: Config = serde_json::from_value(
            json!({"version":1,"format":["node"],"typecheck":["node"],"tests":["node"]}),
        )
        .unwrap();
        copy_snapshot(&source.0, &target.0, &mut Budget::new(&c)).unwrap();
        assert!(!target.0.join("ignored.txt").exists());
        assert!(target.0.join("a.ts").exists());
        fs::create_dir_all(target.0.join("src/coverage")).unwrap();
        fs::write(target.0.join("src/coverage/route.ts"), "export const a=1;").unwrap();
        assert!(
            hashes(&target.0)
                .unwrap()
                .contains_key(Path::new("src/coverage/route.ts"))
        );
        let dep = Path::new("node_modules/pkg/dist/index.js");
        fs::write(target.0.join(dep), "changed").unwrap();
        assert_eq!(fs::read_to_string(source.0.join(dep)).unwrap(), "original");
    }
    #[test]
    fn declared_build_dependency_is_copied_and_rebased() {
        let src = super::super::verification::temporary().unwrap();
        let dst = super::super::verification::temporary().unwrap();
        assert!(
            Command::new("git")
                .args(["init", "-q"])
                .current_dir(&src.0)
                .status()
                .unwrap()
                .success()
        );
        fs::write(src.0.join(".gitignore"), "node_modules\ndist\n").unwrap();
        fs::create_dir_all(src.0.join("service/dist")).unwrap();
        fs::write(src.0.join("service/dist/main.js"), "original").unwrap();
        fs::create_dir_all(src.0.join("node_modules/.bin")).unwrap();
        #[cfg(unix)]
        std::os::unix::fs::symlink(
            "../../service/dist/main.js",
            src.0.join("node_modules/.bin/service"),
        )
        .unwrap();
        let c:Config=serde_json::from_value(json!({"version":1,"dependency_roots":["service/dist"],"format":["node"],"typecheck":["node"],"tests":["node"]})).unwrap();
        copy_snapshot(&src.0, &dst.0, &mut Budget::new(&c)).unwrap();
        assert_eq!(
            fs::read_to_string(dst.0.join("service/dist/main.js")).unwrap(),
            "original"
        );
        #[cfg(unix)]
        assert!(
            dst.0
                .join("node_modules/.bin/service")
                .canonicalize()
                .unwrap()
                .starts_with(&dst.0)
        );
        fs::write(dst.0.join("service/dist/main.js"), "changed").unwrap();
        assert_eq!(
            fs::read_to_string(src.0.join("service/dist/main.js")).unwrap(),
            "original"
        );
    }
    #[cfg(unix)]
    #[test]
    fn background_command_can_be_cancelled() {
        let dir = super::super::verification::temporary().unwrap();
        let stop = AtomicBool::new(true);
        let args = ["/bin/sleep".to_owned(), "10".to_owned()];
        let result = run_bounded(&dir.0, &dir.0, "cancel", &args, 10_000, Some(&stop));
        assert_eq!(result["status"], "cancelled");
    }

    #[test]
    fn command_timeout_and_output_limit_are_not_success() {
        let dir = super::super::verification::temporary().unwrap();
        let args = vec![
            "node".to_owned(),
            "-e".to_owned(),
            "setInterval(()=>{},1000)".to_owned(),
        ];
        assert_eq!(
            run(&dir.0, &dir.0, "timeout", &args, "a.ts", 100)["status"],
            "timeout"
        );
        let args = vec![
            "node".to_owned(),
            "-e".to_owned(),
            "process.stdout.write('x'.repeat(200000));setInterval(()=>{},1000)".to_owned(),
        ];
        assert_eq!(
            run(&dir.0, &dir.0, "output", &args, "a.ts", 15000)["status"],
            "output_limit"
        );
    }
    #[test]
    fn external_symlinks_are_rejected() {
        let src = super::super::verification::temporary().unwrap();
        let dst = super::super::verification::temporary().unwrap();
        #[cfg(unix)]
        std::os::unix::fs::symlink("/etc/passwd", src.0.join("escape")).unwrap();
        let result = copy_tree(
            &src.0,
            &dst.0,
            &src.0,
            &dst.0,
            &mut Budget {
                files: 0,
                bytes: 0,
                start: Instant::now(),
                max_bytes: default_snapshot_bytes(),
                max_files: default_snapshot_files(),
                timeout_ms: default_snapshot_timeout(),
                dependency_roots: vec![],
            },
        );
        #[cfg(unix)]
        assert!(result.is_err());
    }
    #[test]
    fn missing_configuration_is_not_a_pass() {
        let dir = super::super::verification::temporary().unwrap();
        let result = verify(&dir.0, "a.ts", "a", "b", "invalid");
        assert_eq!(result["status"], "blocked");
        assert_eq!(result["tests"]["status"], "not_run");
    }
}

#[cfg(all(test, unix))]
#[test]
fn timeout_kills_spawned_descendants() {
    let dir = super::verification::temporary().unwrap();
    let argv=vec!["node".to_owned(),"-e".to_owned(),"const {spawn}=require('node:child_process');const fs=require('node:fs');const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});fs.writeFileSync('child.pid',String(child.pid));setInterval(()=>{},1000);".to_owned()];
    let result = run(&dir.0, &dir.0, "descendant", &argv, "a.ts", 3000);
    assert_eq!(result["status"], "timeout");
    let pid = fs::read_to_string(dir.0.join("child.pid")).unwrap();
    let alive = || {
        Command::new("/bin/kill")
            .args(["-0", &pid])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .unwrap()
            .success()
    };
    for _ in 0..50 {
        if !alive() {
            return;
        }
        std::thread::sleep(Duration::from_millis(20));
    }
    let _ = Command::new("/bin/kill").args(["-KILL", &pid]).status();
    panic!("descendant remained alive after timeout");
}
