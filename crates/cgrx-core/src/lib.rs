//! Revision-pinned contracts shared by CGRX components.

mod canonical;
mod evidence;
mod model;
mod revision;
mod runtime_evidence;

pub use canonical::canonical_hash;
pub use evidence::{ConfidenceClass, EdgeEvidence, EvidenceEdge, ResolverClass};
pub use model::{
    ByteRange, CapsuleStatus, CoreError, Edge, Hash32, IoAccounting, Mode, NodeId, QueryRequest,
    RelationKind, Scope,
};
pub use revision::RepoSnapshot;
pub use runtime_evidence::{
    EvidenceSelector, MAX_RUNTIME_ENVIRONMENT_BYTES, MAX_RUNTIME_FUNCTION_BYTES,
    MAX_RUNTIME_PATH_BYTES, MAX_TRACE_BYTES, MAX_TRACE_CALLS, MAX_TRACE_SPANS, NormalizedBatch,
    NormalizedObservation, ObservationGap, RUNTIME_EVIDENCE_SCHEMA, ResolutionKind,
    RuntimeEndpoint, RuntimeEvidenceError,
};
