use std::collections::BTreeMap;
use std::fmt;

use serde::{Deserialize, Serialize};

use crate::{Hash32, canonical_hash};

pub const RUNTIME_EVIDENCE_SCHEMA: &str = "cgrx.runtime.v1";
pub const MAX_TRACE_BYTES: usize = 4 * 1024 * 1024;
pub const MAX_TRACE_SPANS: usize = 100_000;
pub const MAX_TRACE_CALLS: usize = 100_000;
pub const MAX_RUNTIME_FUNCTION_BYTES: usize = 4_096;
pub const MAX_RUNTIME_PATH_BYTES: usize = 16_384;
pub const MAX_RUNTIME_ENVIRONMENT_BYTES: usize = 128;

#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum EvidenceSelector {
    #[default]
    Static,
    Observed,
    All,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ResolutionKind {
    PathLine,
    PathFqn,
    Fqn,
    PathName,
    UniqueName,
}

#[derive(Clone, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
pub struct RuntimeEndpoint {
    pub function: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub line: Option<u32>,
}

#[derive(Clone, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
pub struct NormalizedObservation {
    pub caller: RuntimeEndpoint,
    pub callee: RuntimeEndpoint,
    pub first_seen_unix_nanos: u64,
    pub last_seen_unix_nanos: u64,
    pub count: u64,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct NormalizedBatch {
    pub schema: String,
    pub repo_revision: String,
    pub environment: String,
    pub observations: Vec<NormalizedObservation>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ObservationGap {
    pub code: String,
    pub endpoint: RuntimeEndpoint,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub candidates: Vec<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RuntimeEvidenceError {
    detail: String,
}

impl RuntimeEvidenceError {
    fn new(detail: impl Into<String>) -> Self {
        Self {
            detail: detail.into(),
        }
    }
}

impl fmt::Display for RuntimeEvidenceError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(&self.detail)
    }
}

impl std::error::Error for RuntimeEvidenceError {}

impl NormalizedBatch {
    pub fn new(
        repo_revision: impl Into<String>,
        environment: impl Into<String>,
        observations: Vec<NormalizedObservation>,
    ) -> Result<Self, RuntimeEvidenceError> {
        let repo_revision = repo_revision.into().to_ascii_lowercase();
        validate_revision(&repo_revision)?;
        let environment = environment.into();
        validate_text("environment", &environment, MAX_RUNTIME_ENVIRONMENT_BYTES)?;
        if observations.len() > MAX_TRACE_CALLS {
            return Err(RuntimeEvidenceError::new(format!(
                "runtime observation count exceeds {MAX_TRACE_CALLS}"
            )));
        }

        let mut merged =
            BTreeMap::<(RuntimeEndpoint, RuntimeEndpoint), NormalizedObservation>::new();
        for observation in observations {
            validate_observation(&observation)?;
            let key = (observation.caller.clone(), observation.callee.clone());
            if let Some(current) = merged.get_mut(&key) {
                current.count = current.count.saturating_add(observation.count);
                current.first_seen_unix_nanos = current
                    .first_seen_unix_nanos
                    .min(observation.first_seen_unix_nanos);
                current.last_seen_unix_nanos = current
                    .last_seen_unix_nanos
                    .max(observation.last_seen_unix_nanos);
            } else {
                merged.insert(key, observation);
            }
        }

        Ok(Self {
            schema: RUNTIME_EVIDENCE_SCHEMA.to_owned(),
            repo_revision,
            environment,
            observations: merged.into_values().collect(),
        })
    }

    pub fn canonical_id(&self, repo_id: &str) -> Result<Hash32, RuntimeEvidenceError> {
        validate_text("repository identity", repo_id, 4_096)?;
        canonical_hash(&CanonicalBatch {
            repo_id,
            schema: &self.schema,
            repo_revision: &self.repo_revision,
            environment: &self.environment,
            observations: &self.observations,
        })
        .map_err(|error| RuntimeEvidenceError::new(error.to_string()))
    }
}

#[derive(Serialize)]
struct CanonicalBatch<'a> {
    repo_id: &'a str,
    schema: &'a str,
    repo_revision: &'a str,
    environment: &'a str,
    observations: &'a [NormalizedObservation],
}

fn validate_revision(revision: &str) -> Result<(), RuntimeEvidenceError> {
    if revision.len() != 40 || !revision.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err(RuntimeEvidenceError::new(
            "repo_revision must be an exact 40-hex Git object id",
        ));
    }
    Ok(())
}

fn validate_observation(observation: &NormalizedObservation) -> Result<(), RuntimeEvidenceError> {
    validate_endpoint("caller", &observation.caller)?;
    validate_endpoint("callee", &observation.callee)?;
    if observation.count == 0 {
        return Err(RuntimeEvidenceError::new(
            "runtime observation count must be positive",
        ));
    }
    if observation.first_seen_unix_nanos > observation.last_seen_unix_nanos {
        return Err(RuntimeEvidenceError::new(
            "first_seen_unix_nanos must not exceed last_seen_unix_nanos",
        ));
    }
    Ok(())
}

fn validate_endpoint(label: &str, endpoint: &RuntimeEndpoint) -> Result<(), RuntimeEvidenceError> {
    validate_text(
        &format!("{label}.function"),
        &endpoint.function,
        MAX_RUNTIME_FUNCTION_BYTES,
    )?;
    if let Some(path) = &endpoint.file {
        validate_text(&format!("{label}.file"), path, MAX_RUNTIME_PATH_BYTES)?;
    }
    if endpoint.line == Some(0) {
        return Err(RuntimeEvidenceError::new(format!(
            "{label}.line must be one-based"
        )));
    }
    Ok(())
}

fn validate_text(label: &str, value: &str, maximum: usize) -> Result<(), RuntimeEvidenceError> {
    if value.is_empty() || value.len() > maximum || value.as_bytes().contains(&0) {
        return Err(RuntimeEvidenceError::new(format!(
            "{label} must contain 1..={maximum} non-NUL UTF-8 bytes"
        )));
    }
    Ok(())
}
