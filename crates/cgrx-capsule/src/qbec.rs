use cgrx_core::{CapsuleStatus, Hash32, RepoSnapshot, Scope};
use serde::{Deserialize, Serialize};

use crate::{CapsuleError, ObligationId, RccV1, ResidualObligation};

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct QbecV1 {
    pub certificate_version: String,
    pub query_hash: Hash32,
    pub snapshot: RepoSnapshot,
    pub scope: Scope,
    pub discharged: Vec<ObligationId>,
    pub residual: Vec<ResidualObligation>,
    pub status: CapsuleStatus,
    pub tokenizer: String,
    pub capsule_tokens: u32,
    pub capsule_hash: Hash32,
}

impl QbecV1 {
    #[must_use]
    pub fn bind_capsule(mut self, capsule: &RccV1) -> Self {
        self.snapshot = capsule.snapshot.clone();
        self.scope = capsule.scope.clone();
        self.tokenizer = capsule.tokenizer.clone();
        self.capsule_tokens = capsule.capsule_tokens;
        self.capsule_hash = capsule.capsule_hash;
        self
    }

    pub fn to_canonical_json(&self) -> Result<String, CapsuleError> {
        crate::to_canonical_json(self)
    }

    pub fn to_compact(&self) -> Result<String, CapsuleError> {
        serde_json::to_string(&(
            &self.certificate_version,
            self.query_hash,
            &self.snapshot,
            &self.scope,
            &self.discharged,
            &self.residual,
            self.status,
            &self.tokenizer,
            self.capsule_tokens,
            self.capsule_hash,
        ))
        .map_err(|error| CapsuleError::Serialization(error.to_string()))
    }
}

pub fn verify_hashes(capsule: &RccV1, certificate: &QbecV1) -> Result<(), CapsuleError> {
    if capsule.compute_hash()? != capsule.capsule_hash {
        return Err(CapsuleError::HashMismatch);
    }
    if certificate.capsule_hash != capsule.capsule_hash
        || certificate.capsule_tokens != capsule.capsule_tokens
        || certificate.tokenizer != capsule.tokenizer
        || certificate.scope != capsule.scope
        || certificate
            .snapshot
            .assert_compatible(&capsule.snapshot)
            .is_err()
    {
        return Err(CapsuleError::CertificateMismatch);
    }
    Ok(())
}
