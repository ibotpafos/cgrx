//! Revision-pinned contracts shared by CGRX components.

mod canonical;
mod evidence;
mod model;
mod revision;

pub use canonical::canonical_hash;
pub use evidence::{ConfidenceClass, EdgeEvidence, EvidenceEdge, ResolverClass};
pub use model::{
    ByteRange, CapsuleStatus, CoreError, Edge, Hash32, IoAccounting, Mode, NodeId, QueryRequest,
    RelationKind, Scope,
};
pub use revision::RepoSnapshot;
