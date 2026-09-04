//! Immutable, revision-pinned CGRX graph generations.

mod delta;
mod generation;
mod segment;

pub use delta::{
    DeltaKey, DeltaOverlay, DeltaRecord, FreshnessError, PathChange, PathError, PathId,
};
pub use generation::{CrashInjection, CrashSite, GenerationReader, GenerationWriter};
