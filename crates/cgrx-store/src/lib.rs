//! Immutable, revision-pinned CGRX graph generations.

mod agent_memory;
mod delta;
mod embedding_worker;
mod generation;
mod memory;
mod observations;
mod segment;

pub use agent_memory::{
    AgentMemoryHit, AgentMemoryInput, AgentMemoryPublication, AgentMemoryQuery, AgentMemoryRecall,
    AgentMemoryRecord, MemoryCapacityExceeded, MemoryCodeCandidate, MemoryCodeExcerpt,
    MemoryCodeLink, MemoryCodeRange, MemoryFreshness, MemoryKind, MemorySourceKind,
    MemoryWriteUncertain, release_memory_model,
};
pub use delta::{
    DeltaKey, DeltaOverlay, DeltaRecord, FreshnessError, PathChange, PathError, PathId,
};
pub use embedding_worker::{configure_memory_model_worker, serve_memory_model_worker};
pub use generation::{CrashInjection, CrashSite, GenerationReader, GenerationWriter};
pub use memory::{
    DEFAULT_PRIVACY_TAG, DecisionRecord, MAX_CONFIDENCE, MAX_FACT_CHARS, MEMORY_SCHEMA_VERSION,
    MemoryProvenance, MemoryPruneReport, MemoryRecallQuery, MemoryRecordInput, MemorySpan,
    MemoryStatus, MemoryStore, RecordPublication,
};
pub use observations::{
    ObservationCrashSite, ObservationPublication, ObservationSnapshot, ObservationStatus,
    ObservationStore, PruneReport, ResolvedBatch, ResolvedObservation, StoredObservationEdge,
};
