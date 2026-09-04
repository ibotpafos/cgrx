use cgrx_core::Hash32;
use cgrx_languages::{Edge, Extraction, Span, Symbol, UnresolvedKind};
use std::collections::BTreeMap;
use std::fmt;
use std::path::{Component, Path};

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct PathId(pub u64);

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct DeltaKey {
    pub path_id: PathId,
    pub source_hash: Hash32,
    pub ordinal: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DeltaRecord {
    UpsertNode {
        key: DeltaKey,
        path: String,
        node: Symbol,
    },
    DeleteNode {
        key: DeltaKey,
        path: String,
    },
    UpsertEdge {
        key: DeltaKey,
        path: String,
        edge: Edge,
    },
    DeleteEdge {
        key: DeltaKey,
        path: String,
    },
    CoverageGap {
        key: DeltaKey,
        path: String,
        span: Span,
        reason: String,
    },
}

impl DeltaRecord {
    #[must_use]
    pub const fn key(&self) -> DeltaKey {
        match self {
            Self::UpsertNode { key, .. }
            | Self::DeleteNode { key, .. }
            | Self::UpsertEdge { key, .. }
            | Self::DeleteEdge { key, .. }
            | Self::CoverageGap { key, .. } => *key,
        }
    }

    #[must_use]
    pub const fn ordinal(&self) -> u64 {
        self.key().ordinal
    }

    #[must_use]
    pub fn path(&self) -> &str {
        match self {
            Self::UpsertNode { path, .. }
            | Self::DeleteNode { path, .. }
            | Self::UpsertEdge { path, .. }
            | Self::DeleteEdge { path, .. }
            | Self::CoverageGap { path, .. } => path,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum PathChange {
    Active { old: Hash32, current: Hash32 },
    Deleted { old: Hash32 },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PathError {
    Absolute(String),
    Traversal(String),
    Empty,
    NonUtf8,
}

impl fmt::Display for PathError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Absolute(path) => write!(formatter, "absolute repository path: {path}"),
            Self::Traversal(path) => write!(formatter, "repository path escapes root: {path}"),
            Self::Empty => formatter.write_str("repository path is empty"),
            Self::NonUtf8 => formatter.write_str("repository path is not UTF-8"),
        }
    }
}

impl std::error::Error for PathError {}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum FreshnessError {
    InvalidPath(PathError),
    StalePath {
        path: String,
        expected: Hash32,
        actual: Hash32,
    },
    DeletedPathPresent {
        path: String,
        actual: Hash32,
    },
}

impl fmt::Display for FreshnessError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidPath(error) => error.fmt(formatter),
            Self::StalePath { path, .. } => write!(formatter, "stale path: {path}"),
            Self::DeletedPathPresent { path, .. } => {
                write!(formatter, "deleted path is present: {path}")
            }
        }
    }
}

impl std::error::Error for FreshnessError {}

#[derive(Clone, Debug)]
pub struct DeltaOverlay {
    base_generation: u64,
    next_ordinal: u64,
    changes: BTreeMap<String, PathChange>,
    records: Vec<DeltaRecord>,
}

impl DeltaOverlay {
    #[must_use]
    pub fn new(base_generation: u64) -> Self {
        Self {
            base_generation,
            next_ordinal: 0,
            changes: BTreeMap::new(),
            records: Vec::new(),
        }
    }

    #[must_use]
    pub const fn base_generation(&self) -> u64 {
        self.base_generation
    }

    pub fn apply(
        &mut self,
        path: &Path,
        old_hash: Hash32,
        new_hash: Hash32,
        extraction: Extraction,
    ) -> Result<(), PathError> {
        let path = normalize(path)?;
        self.changes.insert(
            path.clone(),
            PathChange::Active {
                old: old_hash,
                current: new_hash,
            },
        );
        self.push_delete_records(&path, old_hash);
        for node in extraction.symbols {
            let key = self.key(&path, new_hash);
            self.records.push(DeltaRecord::UpsertNode {
                key,
                path: path.clone(),
                node,
            });
        }
        for edge in extraction.edges {
            let key = self.key(&path, new_hash);
            self.records.push(DeltaRecord::UpsertEdge {
                key,
                path: path.clone(),
                edge,
            });
        }
        for span in extraction.parser_error_ranges {
            self.push_gap(&path, new_hash, span, "parser_error");
        }
        for candidate in extraction.unresolved {
            let reason = match candidate.kind {
                UnresolvedKind::DynamicProperty => "dynamic_property",
                UnresolvedKind::Dispatch => "dispatch",
                UnresolvedKind::Decorator => "decorator",
                UnresolvedKind::Overload => "overload",
                UnresolvedKind::ParserError => "parser_error",
            };
            self.push_gap(&path, new_hash, candidate.span, reason);
        }
        Ok(())
    }

    pub fn delete(&mut self, path: &Path, old_hash: Hash32) -> Result<(), PathError> {
        let path = normalize(path)?;
        self.changes
            .insert(path.clone(), PathChange::Deleted { old: old_hash });
        self.push_delete_records(&path, old_hash);
        Ok(())
    }

    pub fn rename(
        &mut self,
        old_path: &Path,
        new_path: &Path,
        old_hash: Hash32,
        new_hash: Hash32,
        extraction: Extraction,
    ) -> Result<(), PathError> {
        self.delete(old_path, old_hash)?;
        self.apply(new_path, old_hash, new_hash, extraction)
    }

    pub fn assert_fresh(&self, paths: &[(&Path, Hash32)]) -> Result<(), FreshnessError> {
        for (path, actual) in paths {
            let path = normalize(path).map_err(FreshnessError::InvalidPath)?;
            match self.changes.get(&path) {
                Some(PathChange::Active { current, .. }) if current != actual => {
                    return Err(FreshnessError::StalePath {
                        path,
                        expected: *current,
                        actual: *actual,
                    });
                }
                Some(PathChange::Deleted { .. }) => {
                    return Err(FreshnessError::DeletedPathPresent {
                        path,
                        actual: *actual,
                    });
                }
                _ => {}
            }
        }
        Ok(())
    }

    #[must_use]
    pub fn is_shadowed(&self, path: &Path) -> bool {
        normalize(path)
            .ok()
            .is_some_and(|path| self.changes.contains_key(&path))
    }

    #[must_use]
    pub fn change(&self, path: &Path) -> Option<PathChange> {
        normalize(path)
            .ok()
            .and_then(|path| self.changes.get(&path).copied())
    }

    #[must_use]
    pub fn records(&self) -> &[DeltaRecord] {
        &self.records
    }

    fn push_delete_records(&mut self, path: &str, source_hash: Hash32) {
        let key = self.key(path, source_hash);
        self.records.push(DeltaRecord::DeleteNode {
            key,
            path: path.to_owned(),
        });
        let key = self.key(path, source_hash);
        self.records.push(DeltaRecord::DeleteEdge {
            key,
            path: path.to_owned(),
        });
    }

    fn push_gap(&mut self, path: &str, source_hash: Hash32, span: Span, reason: &str) {
        let key = self.key(path, source_hash);
        self.records.push(DeltaRecord::CoverageGap {
            key,
            path: path.to_owned(),
            span,
            reason: reason.to_owned(),
        });
    }

    fn key(&mut self, path: &str, source_hash: Hash32) -> DeltaKey {
        let ordinal = self.next_ordinal;
        self.next_ordinal += 1;
        DeltaKey {
            path_id: path_id(path),
            source_hash,
            ordinal,
        }
    }
}

fn path_id(path: &str) -> PathId {
    let digest = blake3::hash(path.as_bytes());
    let mut bytes = [0_u8; 8];
    bytes.copy_from_slice(&digest.as_bytes()[..8]);
    PathId(u64::from_le_bytes(bytes))
}

fn normalize(path: &Path) -> Result<String, PathError> {
    if path.as_os_str().is_empty() {
        return Err(PathError::Empty);
    }
    let raw = path.to_str().ok_or(PathError::NonUtf8)?;
    let bytes = raw.as_bytes();
    let windows_absolute = bytes.len() >= 3
        && bytes[0].is_ascii_alphabetic()
        && bytes[1] == b':'
        && matches!(bytes[2], b'/' | b'\\');
    if path.is_absolute() || raw.starts_with("\\\\") || windows_absolute {
        return Err(PathError::Absolute(raw.to_owned()));
    }
    let portable = raw.replace('\\', "/");
    let mut parts = Vec::new();
    for component in Path::new(&portable).components() {
        match component {
            Component::Normal(part) => parts.push(part.to_string_lossy().into_owned()),
            Component::CurDir => {}
            Component::ParentDir | Component::RootDir | Component::Prefix(_) => {
                return Err(PathError::Traversal(raw.to_owned()));
            }
        }
    }
    if parts.is_empty() {
        return Err(PathError::Empty);
    }
    Ok(parts.join("/"))
}
