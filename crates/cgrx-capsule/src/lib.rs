//! Exact token accounting and versioned CGRX capsule wire records.

mod packer;
mod qbec;
mod rcc;
mod slicer;
mod tokenizer;

pub use packer::{
    EvidencePacker, EvidenceRecord, ExcludedRecord, PackInput, PackResult, packed_records_tokens,
};
pub use qbec::{QbecV1, verify_hashes};
pub use rcc::{
    CapsuleError, ObligationId, RccAnchor, RccRecord, RccV1, ResidualObligation, to_canonical_json,
    wire_schema_json,
};
pub use slicer::{ContextWindow, SourceSlice, merge_slices, slice_source};
pub use tokenizer::Tokenizer;
