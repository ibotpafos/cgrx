use std::path::Path;

use serde::{Deserialize, Serialize, Serializer};

use crate::{ByteRange, Hash32, NodeId, RelationKind};

#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ResolverClass {
    SyntaxExact,
    ImportExact,
    TypeExact,
    CompilerConfirmed,
    LspConfirmed,
    ScipConfirmed,
    HeuristicCandidate,
    Unresolved,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ConfidenceClass {
    Proven,
    BoundedSet,
    Candidate,
    Unresolved,
}

#[derive(Clone, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
pub struct EdgeEvidence {
    #[serde(serialize_with = "serialize_evidence_path")]
    pub path: String,
    pub span: ByteRange,
    pub source_hash: Hash32,
    pub resolver: ResolverClass,
    pub confidence: ConfidenceClass,
    pub assumptions: Vec<Hash32>,
    pub counter_evidence: Vec<Hash32>,
}

fn serialize_evidence_path<S>(path: &str, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    if is_absolute_path(path) || is_canonical_repo_relative_path(path) {
        serializer.serialize_str(path)
    } else {
        Err(serde::ser::Error::custom(
            "evidence path must be canonical and repository-relative",
        ))
    }
}

fn is_canonical_repo_relative_path(path: &str) -> bool {
    !path.is_empty()
        && !path.contains(['\\', '\0'])
        && !has_windows_drive_prefix(path)
        && path
            .split('/')
            .all(|component| !component.is_empty() && !matches!(component, "." | ".."))
}

fn is_absolute_path(path: &str) -> bool {
    Path::new(path).is_absolute()
        || (has_windows_drive_prefix(path)
            && path
                .as_bytes()
                .get(2)
                .is_some_and(|separator| matches!(separator, b'/' | b'\\')))
        || path.starts_with("\\\\")
}

fn has_windows_drive_prefix(path: &str) -> bool {
    path.as_bytes()
        .get(..2)
        .is_some_and(|prefix| prefix[0].is_ascii_alphabetic() && prefix[1] == b':')
}

impl EdgeEvidence {
    #[must_use]
    pub const fn is_definitive(&self) -> bool {
        matches!(self.confidence, ConfidenceClass::Proven)
    }
}

#[derive(Clone, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
pub struct EvidenceEdge {
    pub source: NodeId,
    pub target: NodeId,
    pub kind: RelationKind,
    pub evidence: EdgeEvidence,
}
