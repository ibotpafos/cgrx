use std::fmt;

use cgrx_core::{CoreError, Hash32, RepoSnapshot, Scope, canonical_hash};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::Tokenizer;

#[derive(Clone, Debug, Deserialize, Eq, Hash, Ord, PartialEq, PartialOrd, Serialize)]
pub struct ObligationId(pub String);

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ResidualObligation {
    pub obligation_id: ObligationId,
    pub kind: String,
    pub reason: String,
    pub expansion_handle: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct RccAnchor {
    pub node_id: u64,
    pub qualified_name: String,
    pub path: String,
    pub span_start: usize,
    pub span_end: usize,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct RccRecord {
    pub node_id: u64,
    pub path: String,
    pub span_start: usize,
    pub span_end: usize,
    pub text: String,
    pub provenance: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct RccV1 {
    pub capsule_version: String,
    pub snapshot: RepoSnapshot,
    pub scope: Scope,
    pub anchors: Vec<RccAnchor>,
    pub records: Vec<RccRecord>,
    pub residual: Vec<ResidualObligation>,
    pub expansion_handles: Vec<String>,
    pub tokenizer: String,
    pub capsule_tokens: u32,
    pub capsule_hash: Hash32,
}

impl RccV1 {
    pub fn seal(mut self, tokenizer: &Tokenizer, budget: u32) -> Result<Self, CapsuleError> {
        self.tokenizer = tokenizer.name().to_owned();
        self.capsule_tokens = 0;
        self.capsule_hash = Hash32([0; 32]);
        for _ in 0..16 {
            self.capsule_hash = self.compute_hash()?;
            let required = tokenizer.count(&self.to_canonical_json()?);
            if required == self.capsule_tokens {
                if required > budget {
                    return Err(CapsuleError::BudgetExceeded { budget, required });
                }
                return Ok(self);
            }
            self.capsule_tokens = required;
        }
        Err(CapsuleError::TokenCountDidNotConverge)
    }

    pub fn to_canonical_json(&self) -> Result<String, CapsuleError> {
        to_canonical_json(self)
    }

    pub fn to_compact(&self) -> Result<String, CapsuleError> {
        serde_json::to_string(&(
            &self.capsule_version,
            &self.snapshot,
            &self.scope,
            &self.anchors,
            &self.records,
            &self.residual,
            &self.expansion_handles,
            &self.tokenizer,
            self.capsule_tokens,
            self.capsule_hash,
        ))
        .map_err(|error| CapsuleError::Serialization(error.to_string()))
    }

    pub(crate) fn compute_hash(&self) -> Result<Hash32, CapsuleError> {
        #[derive(Serialize)]
        struct HashPayload<'a> {
            capsule_version: &'a str,
            snapshot: &'a RepoSnapshot,
            scope: &'a Scope,
            anchors: &'a [RccAnchor],
            records: &'a [RccRecord],
            residual: &'a [ResidualObligation],
            expansion_handles: &'a [String],
            tokenizer: &'a str,
        }
        canonical_hash(&HashPayload {
            capsule_version: &self.capsule_version,
            snapshot: &self.snapshot,
            scope: &self.scope,
            anchors: &self.anchors,
            records: &self.records,
            residual: &self.residual,
            expansion_handles: &self.expansion_handles,
            tokenizer: &self.tokenizer,
        })
        .map_err(CapsuleError::Core)
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CapsuleError {
    Core(CoreError),
    Serialization(String),
    BudgetExceeded { budget: u32, required: u32 },
    TokenCountDidNotConverge,
    HashMismatch,
    CertificateMismatch,
    AccountingOverflow,
    AccountingMismatch,
}

impl fmt::Display for CapsuleError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Core(error) => write!(formatter, "canonical capsule error: {error}"),
            Self::Serialization(error) => {
                write!(formatter, "capsule serialization failed: {error}")
            }
            Self::BudgetExceeded { budget, required } => {
                write!(
                    formatter,
                    "token budget {budget} is below required {required}"
                )
            }
            Self::TokenCountDidNotConverge => {
                formatter.write_str("capsule token count did not converge")
            }
            Self::HashMismatch => formatter.write_str("capsule hash mismatch"),
            Self::CertificateMismatch => {
                formatter.write_str("certificate does not bind this capsule")
            }
            Self::AccountingOverflow => formatter.write_str("I/O accounting overflow"),
            Self::AccountingMismatch => {
                formatter.write_str("I/O accounting does not match packed records")
            }
        }
    }
}

impl std::error::Error for CapsuleError {}

pub fn to_canonical_json<T: Serialize>(value: &T) -> Result<String, CapsuleError> {
    canonical_hash(value).map_err(CapsuleError::Core)?;
    let value = serde_json::to_value(value)
        .map_err(|error| CapsuleError::Serialization(error.to_string()))?;
    serde_json::to_string(&sort_json(value))
        .map_err(|error| CapsuleError::Serialization(error.to_string()))
}

fn sort_json(value: Value) -> Value {
    match value {
        Value::Array(values) => Value::Array(values.into_iter().map(sort_json).collect()),
        Value::Object(entries) => {
            let mut entries: Vec<_> = entries.into_iter().collect();
            entries.sort_unstable_by(|left, right| left.0.cmp(&right.0));
            Value::Object(
                entries
                    .into_iter()
                    .map(|(key, value)| (key, sort_json(value)))
                    .collect(),
            )
        }
        scalar => scalar,
    }
}

#[must_use]
pub fn wire_schema_json() -> &'static str {
    r#"{"$id":"cgrx-wire/1","oneOf":[{"required":["capsule_version","snapshot","scope","anchors","records","residual","tokenizer","capsule_tokens","capsule_hash"],"properties":{"capsule_version":{"const":"rcc/1"},"capsule_tokens":{"type":"integer","minimum":0},"capsule_hash":{"type":"string","pattern":"^[0-9a-f]{64}$"}}},{"required":["certificate_version","query_hash","snapshot","scope","discharged","residual","status","tokenizer","capsule_tokens","capsule_hash"],"properties":{"certificate_version":{"const":"qbec/1"},"query_hash":{"type":"string","pattern":"^[0-9a-f]{64}$"},"status":{"enum":["COMPLETE_BOUNDED","PARTIAL","STALE","BUDGET_EXHAUSTED","NO_EXTRA_CONTEXT"]}}}]}"#
}
