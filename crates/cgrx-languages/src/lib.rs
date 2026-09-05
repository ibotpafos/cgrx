//! Narrow, deterministic TypeScript, Python, and Rust extraction packs.

mod go;
mod pack;
mod python;
mod rust;
mod typescript;

pub use pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, RepoPath, Span, Symbol,
    Unresolved, UnresolvedKind, pack_for_path,
};

pub use rust::RustFileFacts;

// Exact import facts and conservative site classification for runtime integration.
pub use typescript::ts_imports;
