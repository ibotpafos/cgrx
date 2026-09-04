use std::fmt;

use serde::de::Visitor;
use serde::{Deserialize, Deserializer, Serialize, Serializer};

/// A BLAKE3 digest stored as exactly 32 bytes.
#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct Hash32(pub [u8; 32]);

impl Serialize for Hash32 {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        const HEX: &[u8; 16] = b"0123456789abcdef";
        let mut encoded = String::with_capacity(64);
        for byte in self.0 {
            encoded.push(char::from(HEX[usize::from(byte >> 4)]));
            encoded.push(char::from(HEX[usize::from(byte & 0x0f)]));
        }
        serializer.serialize_str(&encoded)
    }
}

impl<'de> Deserialize<'de> for Hash32 {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct Hash32Visitor;

        impl Visitor<'_> for Hash32Visitor {
            type Value = Hash32;

            fn expecting(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
                formatter.write_str("a lowercase 64-character hexadecimal string")
            }

            fn visit_str<E: serde::de::Error>(self, value: &str) -> Result<Hash32, E> {
                if value.len() != 64 {
                    return Err(E::invalid_length(value.len(), &self));
                }

                let mut bytes = [0_u8; 32];
                for (index, pair) in value.as_bytes().chunks_exact(2).enumerate() {
                    let high = decode_lower_hex(pair[0]).ok_or_else(|| {
                        E::custom(format!(
                            "invalid lowercase hexadecimal at byte {}",
                            index * 2
                        ))
                    })?;
                    let low = decode_lower_hex(pair[1]).ok_or_else(|| {
                        E::custom(format!(
                            "invalid lowercase hexadecimal at byte {}",
                            index * 2 + 1
                        ))
                    })?;
                    bytes[index] = (high << 4) | low;
                }
                Ok(Hash32(bytes))
            }
        }

        deserializer.deserialize_str(Hash32Visitor)
    }
}

const fn decode_lower_hex(byte: u8) -> Option<u8> {
    match byte {
        b'0'..=b'9' => Some(byte - b'0'),
        b'a'..=b'f' => Some(byte - b'a' + 10),
        _ => None,
    }
}

/// A bounded repository graph scope.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Scope {
    pub include: Vec<String>,
    pub exclude: Vec<String>,
    pub relation_kinds: Vec<RelationKind>,
    pub max_depth: u8,
}

/// Retrieval mode selected by a query.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Mode {
    Fast,
    Precise,
    Bounded,
}

/// Graph relations supported by the initial core contract.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RelationKind {
    Calls,
    Implements,
}

/// Stable integer identity of a graph node within a generation.
#[derive(Clone, Copy, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
pub struct NodeId(pub u64);

/// Half-open byte range within one revision-pinned source file.
#[derive(
    Clone, Copy, Debug, Default, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize,
)]
pub struct ByteRange {
    pub start: usize,
    pub end: usize,
}

impl ByteRange {
    #[must_use]
    pub const fn new(start: usize, end: usize) -> Self {
        Self { start, end }
    }

    #[must_use]
    pub const fn len(self) -> usize {
        self.end.saturating_sub(self.start)
    }

    #[must_use]
    pub const fn is_empty(self) -> bool {
        self.start >= self.end
    }
}

/// Separate counters for indexing, probes, emitted source, and model-visible context.
#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct IoAccounting {
    pub index_input_bytes: u64,
    pub probe_input_bytes: u64,
    pub emitted_source_bytes: u64,
    pub model_visible_tokens: u32,
}

/// A directed, typed graph edge.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Edge {
    pub source: NodeId,
    pub target: NodeId,
    pub kind: RelationKind,
}

/// Completion status carried by a compiled capsule.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CapsuleStatus {
    CompleteBounded,
    Partial,
    Stale,
    BudgetExhausted,
    NoExtraContext,
}

/// Minimal request accepted by core retrieval contracts.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct QueryRequest {
    pub task: String,
    pub scope: Scope,
    pub mode: Mode,
    pub token_budget: u32,
}

/// Typed failures produced by core canonicalization and revision checks.
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CoreError {
    Serialization(String),
    FloatingPoint,
    AbsolutePath { field: String, path: String },
    MixedRevision,
    MixedWorkingTreeDigest,
    MixedGeneration,
}

impl CoreError {
    /// Stable machine-readable error code.
    #[must_use]
    pub const fn code(&self) -> &'static str {
        match self {
            Self::Serialization(_) => "serialization",
            Self::FloatingPoint => "floating_point",
            Self::AbsolutePath { .. } => "absolute_path",
            Self::MixedRevision => "mixed_revision",
            Self::MixedWorkingTreeDigest => "mixed_working_tree_digest",
            Self::MixedGeneration => "mixed_generation",
        }
    }
}

impl fmt::Display for CoreError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Serialization(message) => write!(formatter, "serialization failed: {message}"),
            Self::FloatingPoint => formatter.write_str("floating-point values are not canonical"),
            Self::AbsolutePath { field, path } => {
                write!(formatter, "absolute path in field {field}: {path}")
            }
            Self::MixedRevision => formatter.write_str("repository revisions do not match"),
            Self::MixedWorkingTreeDigest => {
                formatter.write_str("working-tree digests do not match")
            }
            Self::MixedGeneration => formatter.write_str("graph generations do not match"),
        }
    }
}

impl std::error::Error for CoreError {}
