//! Explicitly opted-in project commands. Copy isolation is NOT a security sandbox.
use super::verification::CopyDir;
use serde::Deserialize;
use serde_json::{Value, json};
use std::{
    collections::BTreeMap,
    fs, io,
    path::{Path, PathBuf},
    process::{Command, Stdio},
    time::{Duration, Instant},
};
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Config {
    version: u8,
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
        "local"
            | "evidence"
            | "WORKSPACE.local.md"
            | ".kilo"
            | ".pt"
            | ".agent"
            | ".git"
            | ".cgrx"
            | "target"
            | ".worktrees"
            | ".next"
            | ".cache"
            | "coverage"
            | "dist"
            | "build"
            | ".ssh"
            | ".aws"
            | ".npmrc"
            | ".yarnrc.yml"
            | ".netrc"
    ) || name == ".env"
        || name.starts_with(".env.")
        || name.ends_with(".pem")
        || name.ends_with(".key")
        || name.ends_with(".tsbuildinfo")
}
fn excluded_from_copy(path: &Path) -> bool {
    let mut dependency = false;
    for component in path.components() {
        let name = component.as_os_str().to_string_lossy();
        if name == "node_modules" {
            dependency = true;
        }
        if excluded(&name)
            && !(dependency
                && matches!(
                    name.as_ref(),
                    "dist" | "build" | "target" | "coverage" | ".cache" | ".next"
                ))
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
}
impl Budget {
    fn new(c: &Config) -> Self {
        Self {
            files: 0,
            bytes: 0,
            start: Instant::now(),
            max_bytes: c.snapshot_max_bytes,
            max_files: c.snapshot_max_files,
            timeout_ms: c.snapshot_timeout_ms,
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
        if excluded_from_copy(
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
            let resolved = from.canonicalize().map_err(|_| bad("dangling_symlink"))?;
            let relative = resolved.strip_prefix(root).map_err(|_| {
                bad(&format!(
                    "external_symlink: {}",
                    from.strip_prefix(root).unwrap_or(&from).display()
                ))
            })?;
            if excluded_from_copy(relative) {
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
fn hashes(root: &Path) -> io::Result<BTreeMap<PathBuf, String>> {
    fn visit(root: &Path, path: &Path, out: &mut BTreeMap<PathBuf, String>) -> io::Result<()> {
        for e in fs::read_dir(path)? {
            let e = e?;
            let name = e.file_name();
            if excluded(&name.to_string_lossy()) || name == "node_modules" {
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
            if bytes > 131072 || start.elapsed() > Duration::from_millis(timeout) {
                reason = Some(if bytes > 131072 {
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
        Ok(
            json!({"status":reason.unwrap_or(if status.success(){"passed"}else{"failed"}),"exit_code":status.code(),"duration_ms":start.elapsed().as_millis(),
            "output_bytes":fs::metadata(&stdout)?.len()+fs::metadata(&stderr)?.len(),"diagnostics":"withheld: project output may contain secrets"}),
        )
    };
    let mut result = execute()
        .unwrap_or_else(|_| json!({"status":"unavailable","reason":"command_or_io_unavailable"}));
    result["command"] = json!(argv);
    result
}
fn check_config(root: &Path) -> io::Result<Config> {
    let p = root.join(".cgrx/quality-checks.json").canonicalize()?;
    if !p.starts_with(root) || fs::metadata(&p)?.len() > 16384 {
        return Err(bad("unsafe_config"));
    }
    let c: Config = serde_json::from_slice(&fs::read(p)?).map_err(|_| bad("invalid_config"))?;
    if c.version != 1
        || !(100..=30000).contains(&c.timeout_ms)
        || c.snapshot_max_bytes > 8 * 1024 * 1024 * 1024
        || c.snapshot_max_bytes == 0
        || c.snapshot_max_files == 0
        || c.snapshot_max_files > 500000
        || !(100..=120000).contains(&c.snapshot_timeout_ms)
    {
        return Err(bad("invalid_version_or_timeout"));
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
    #[test]
    fn compiled_dependency_directories_are_copied() {
        assert!(!excluded_from_copy(Path::new(
            "node_modules/example/dist/index.js"
        )));
        assert!(!excluded_from_copy(Path::new(
            "node_modules/example/build/index.js"
        )));
        assert!(excluded_from_copy(Path::new("dist/index.js")));
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
        let dep = Path::new("node_modules/pkg/dist/index.js");
        fs::write(target.0.join(dep), "changed").unwrap();
        assert_eq!(fs::read_to_string(source.0.join(dep)).unwrap(), "original");
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
            run(&dir.0, &dir.0, "output", &args, "a.ts", 2000)["status"],
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
    let result = run(&dir.0, &dir.0, "descendant", &argv, "a.ts", 300);
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
