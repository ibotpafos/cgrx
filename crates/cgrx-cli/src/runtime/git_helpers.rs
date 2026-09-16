//! Git operations, tree parsing, status refresh, and coverage helpers.
//!
//! These functions handle git cat-file batch operations, tree parsing,
//! status refresh, and coverage metadata filtering.

use std::collections::{BTreeMap, BTreeSet};
use std::io::{BufRead, BufReader, Read, Write};
use std::path::Path;
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};

use cgrx_cgcr::CoverageMetadata;
use cgrx_core::Scope;
use serde_json::{Value, json};

use super::{RuntimeError, path_in_scope};

pub(super) fn git_bytes(root: &Path, args: &[&str]) -> Result<Vec<u8>, RuntimeError> {
    let output = Command::new(crate::git_executable())
        .env("GIT_OPTIONAL_LOCKS", "0")
        .args(args)
        .current_dir(root)
        .output()
        .map_err(|error| RuntimeError::new("git_spawn", error.to_string()))?;
    if !output.status.success() {
        return Err(RuntimeError::new("git_exit", "git command failed"));
    }
    Ok(output.stdout)
}

pub(super) fn store_writer_error(code: &'static str, error: std::io::Error) -> RuntimeError {
    if error.kind() == std::io::ErrorKind::WouldBlock {
        RuntimeError::new(
            "store_busy",
            "another process is publishing this index; retry after it finishes",
        )
    } else {
        RuntimeError::new(code, error.to_string())
    }
}

pub(super) fn git_text(root: &Path, args: &[&str]) -> Result<String, RuntimeError> {
    String::from_utf8(git_bytes(root, args)?)
        .map(|value| value.trim().to_owned())
        .map_err(|error| RuntimeError::new("git_utf8", error.to_string()))
}

pub(super) fn parse_committed_tree(bytes: &[u8]) -> Result<BTreeMap<String, String>, RuntimeError> {
    let mut entries = BTreeMap::new();
    for record in bytes
        .split(|byte| *byte == 0)
        .filter(|record| !record.is_empty())
    {
        let separator = record
            .iter()
            .position(|byte| *byte == b'\t')
            .ok_or_else(|| RuntimeError::new("git_tree", "ls-tree record has no path"))?;
        let (metadata, path_with_separator) = record.split_at(separator);
        let path = &path_with_separator[1..];
        let mut fields = metadata.split(|byte| *byte == b' ');
        let _mode = fields.next();
        let kind = fields.next();
        let object = fields.next();
        if kind != Some(b"blob".as_slice()) {
            continue;
        }
        let object = object
            .and_then(|value| std::str::from_utf8(value).ok())
            .filter(|value| value.len() >= 40 && value.bytes().all(|byte| byte.is_ascii_hexdigit()))
            .ok_or_else(|| RuntimeError::new("git_tree", "ls-tree record has an invalid object"))?;
        entries.insert(
            String::from_utf8_lossy(path).into_owned(),
            object.to_owned(),
        );
    }
    Ok(entries)
}

pub(super) struct GitBlobBatch {
    child: Child,
    stdin: Option<ChildStdin>,
    stdout: BufReader<ChildStdout>,
}

impl GitBlobBatch {
    pub(super) fn spawn(root: &Path) -> Result<Self, RuntimeError> {
        let mut child = Command::new(crate::git_executable())
            .args(["cat-file", "--batch"])
            .current_dir(root)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|error| RuntimeError::new("git_spawn", error.to_string()))?;
        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| RuntimeError::new("git_spawn", "cat-file stdin is unavailable"))?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| RuntimeError::new("git_spawn", "cat-file stdout is unavailable"))?;
        Ok(Self {
            child,
            stdin: Some(stdin),
            stdout: BufReader::new(stdout),
        })
    }

    pub(super) fn read_blob(&mut self, object: &str) -> Result<Vec<u8>, RuntimeError> {
        let stdin = self
            .stdin
            .as_mut()
            .ok_or_else(|| RuntimeError::new("git_batch", "cat-file stdin is closed"))?;
        writeln!(stdin, "{object}")
            .and_then(|()| stdin.flush())
            .map_err(|error| RuntimeError::new("git_batch", error.to_string()))?;
        let mut header = String::new();
        self.stdout
            .read_line(&mut header)
            .map_err(|error| RuntimeError::new("git_batch", error.to_string()))?;
        let mut fields = header.split_whitespace();
        let returned_object = fields.next();
        let kind = fields.next();
        let size = fields.next().and_then(|value| value.parse::<usize>().ok());
        if returned_object != Some(object) || kind != Some("blob") || size.is_none() {
            return Err(RuntimeError::new(
                "git_batch",
                format!("unexpected cat-file header: {}", header.trim()),
            ));
        }
        let mut source = vec![0; size.expect("validated blob size")];
        self.stdout
            .read_exact(&mut source)
            .map_err(|error| RuntimeError::new("git_batch", error.to_string()))?;
        let mut newline = [0_u8; 1];
        self.stdout
            .read_exact(&mut newline)
            .map_err(|error| RuntimeError::new("git_batch", error.to_string()))?;
        if newline != [b'\n'] {
            return Err(RuntimeError::new(
                "git_batch",
                "cat-file blob was not newline terminated",
            ));
        }
        Ok(source)
    }

    pub(super) fn finish(mut self) -> Result<(), RuntimeError> {
        self.stdin.take();
        let status = self
            .child
            .wait()
            .map_err(|error| RuntimeError::new("git_batch", error.to_string()))?;
        if !status.success() {
            return Err(RuntimeError::new("git_exit", "git cat-file --batch failed"));
        }
        Ok(())
    }
}

pub(super) fn refresh_status(bytes: &[u8]) -> Result<(String, BTreeSet<String>), RuntimeError> {
    let records: Vec<_> = bytes.split(|byte| *byte == 0).collect();
    let mut revision = None;
    let mut paths = BTreeSet::new();
    let mut cursor = 0;
    while cursor < records.len() {
        let record = records[cursor];
        if let Some(value) = record.strip_prefix(b"# branch.oid ") {
            revision = Some(String::from_utf8_lossy(value).into_owned());
        } else if record.starts_with(b"1 ") {
            if let Some(path) = record.splitn(9, |byte| *byte == b' ').nth(8) {
                paths.insert(String::from_utf8_lossy(path).into_owned());
            }
        } else if record.starts_with(b"2 ") {
            if let Some(path) = record.splitn(10, |byte| *byte == b' ').nth(9) {
                paths.insert(String::from_utf8_lossy(path).into_owned());
            }
            cursor += 1;
            if let Some(original) = records.get(cursor).filter(|path| !path.is_empty()) {
                paths.insert(String::from_utf8_lossy(original).into_owned());
            }
        } else if record.starts_with(b"u ") {
            if let Some(path) = record.splitn(11, |byte| *byte == b' ').nth(10) {
                paths.insert(String::from_utf8_lossy(path).into_owned());
            }
        } else if let Some(path) = record
            .strip_prefix(b"? ")
            .or_else(|| record.strip_prefix(b"! "))
        {
            paths.insert(String::from_utf8_lossy(path).into_owned());
        }
        cursor += 1;
    }
    let revision = revision.ok_or_else(|| {
        RuntimeError::new(
            "git_status",
            "git status did not report the current branch revision",
        )
    })?;
    Ok((revision, paths))
}

pub(super) fn coverage_for_scope(coverage: &CoverageMetadata, scope: &Scope) -> CoverageMetadata {
    coverage_for_scope_with_matcher(coverage, scope, &mut path_in_scope)
}

pub(super) fn coverage_for_scope_with_matcher<'a>(
    coverage: &'a CoverageMetadata,
    scope: &Scope,
    matches_scope: &mut impl FnMut(&'a str, &Scope) -> bool,
) -> CoverageMetadata {
    CoverageMetadata {
        excluded_paths: coverage
            .excluded_paths
            .iter()
            .filter(|path| matches_scope(path, scope))
            .cloned()
            .collect(),
        parser_error_ranges: coverage
            .parser_error_ranges
            .iter()
            .filter(|range| matches_scope(&range.path, scope))
            .cloned()
            .collect(),
        stale_paths: coverage
            .stale_paths
            .iter()
            .filter(|path| matches_scope(path, scope))
            .cloned()
            .collect(),
        traversal_truncated: coverage.traversal_truncated,
        dynamic_dispatch: coverage
            .dynamic_dispatch
            .iter()
            .filter(|location| matches_scope(dynamic_dispatch_path(location), scope))
            .cloned()
            .collect(),
    }
}

pub(super) fn coverage_gap_page(
    coverage: &CoverageMetadata,
    offset: usize,
    limit: usize,
) -> Vec<Value> {
    coverage
        .excluded_paths
        .iter()
        .map(|path| json!({"code":"EXCLUDED_PATH","path":path}))
        .chain(coverage.parser_error_ranges.iter().map(|range| {
            json!({"code":"PARSER_ERROR_RANGE","path":range.path,"start":range.start,"end":range.end})
        }))
        .chain(
            coverage
                .stale_paths
                .iter()
                .map(|path| json!({"code":"STALE_PATH","path":path})),
        )
        .chain(coverage.dynamic_dispatch.iter().map(|location| {
            json!({"code":"DYNAMIC_DISPATCH","path":dynamic_dispatch_path(location),"location":location})
        }))
        .chain(
            coverage
                .traversal_truncated
                .then(|| json!({"code":"TRAVERSAL_TRUNCATED"})),
        )
        .skip(offset)
        .take(limit)
        .collect()
}

pub(super) fn coverage_gap_count(coverage: &CoverageMetadata) -> usize {
    coverage.excluded_paths.len()
        + coverage.parser_error_ranges.len()
        + coverage.stale_paths.len()
        + coverage.dynamic_dispatch.len()
        + usize::from(coverage.traversal_truncated)
}

pub(super) fn dynamic_dispatch_path(location: &str) -> &str {
    location
        .rsplit_once(':')
        .map_or(location, |(path, _span)| path)
}
