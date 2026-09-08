//! Immutable, revision-pinned CGRX graph generations.

mod delta;
mod generation;
mod memory;
mod observations;
mod segment;

pub use delta::{
    DeltaKey, DeltaOverlay, DeltaRecord, FreshnessError, PathChange, PathError, PathId,
};
pub use generation::{CrashInjection, CrashSite, GenerationReader, GenerationWriter};
pub use memory::{
    DEFAULT_PRIVACY_TAG, DecisionRecord, MAX_CONFIDENCE, MEMORY_SCHEMA_VERSION, MemoryProvenance,
    MemoryPruneReport, MemoryRecallQuery, MemoryRecordInput, MemorySpan, MemoryStatus, MemoryStore,
    RecordPublication,
};
pub use observations::{
    ObservationCrashSite, ObservationPublication, ObservationSnapshot, ObservationStatus,
    ObservationStore, PruneReport, ResolvedBatch, ResolvedObservation, StoredObservationEdge,
};
