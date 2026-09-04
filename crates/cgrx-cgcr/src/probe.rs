use std::fmt;

use cgrx_capsule::{EvidenceRecord, ObligationId};
use cgrx_core::{Hash32, RepoSnapshot};
use serde::{Deserialize, Serialize};

use crate::{EvidenceRef, ResidualReason};

#[derive(Clone, Copy, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ProbeKind {
    ReparseRange,
    SourceScan,
    ImportedScip,
    LspCommand,
}

impl ProbeKind {
    #[must_use]
    pub const fn suffix(self) -> &'static str {
        match self {
            Self::ReparseRange => "reparse",
            Self::SourceScan => "source_scan",
            Self::ImportedScip => "imported_scip",
            Self::LspCommand => "lsp",
        }
    }
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ProbeCost {
    pub latency_us: u64,
    pub source_bytes: u64,
    pub token_delta: u32,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Probe {
    pub id: String,
    pub kind: ProbeKind,
    pub target: String,
    pub obligation_ids: Vec<ObligationId>,
    pub cost: ProbeCost,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct RevisionBoundSpan {
    pub path: String,
    pub start: usize,
    pub end: usize,
    pub source_hash: Hash32,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ProbeOutcome {
    Discharged(EvidenceRef),
    Residual(ResidualReason),
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ProbeFact {
    pub probe_id: String,
    pub snapshot: RepoSnapshot,
    pub obligation_id: ObligationId,
    pub outcome: ProbeOutcome,
    pub span: RevisionBoundSpan,
    pub record: Option<EvidenceRecord>,
}

impl ProbeFact {
    #[must_use]
    pub fn discharged(
        probe_id: &str,
        snapshot: RepoSnapshot,
        obligation_id: ObligationId,
        evidence: EvidenceRef,
        span: RevisionBoundSpan,
    ) -> Self {
        Self {
            probe_id: probe_id.to_owned(),
            snapshot,
            obligation_id,
            outcome: ProbeOutcome::Discharged(evidence),
            span,
            record: None,
        }
    }

    #[must_use]
    pub fn residual(
        probe_id: &str,
        snapshot: RepoSnapshot,
        obligation_id: ObligationId,
        reason: ResidualReason,
        span: RevisionBoundSpan,
    ) -> Self {
        Self {
            probe_id: probe_id.to_owned(),
            snapshot,
            obligation_id,
            outcome: ProbeOutcome::Residual(reason),
            span,
            record: None,
        }
    }
}

pub trait ProbeOracle {
    fn execute(&self, probe: &Probe, snapshot: &RepoSnapshot)
    -> Result<Vec<ProbeFact>, ProbeError>;
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProbeError {
    pub code: String,
    pub detail: String,
}

impl ProbeError {
    #[must_use]
    pub fn new(code: impl Into<String>, detail: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            detail: detail.into(),
        }
    }
}

impl fmt::Display for ProbeError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{}: {}", self.code, self.detail)
    }
}

impl std::error::Error for ProbeError {}
