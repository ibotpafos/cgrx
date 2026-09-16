//! Narrow, deterministic C, Go, Java, Kotlin, TypeScript, Python, and Rust extraction packs.

mod c;
mod cpp;
mod csharp;
mod elixir;
mod go;
mod java;
mod kotlin;
mod pack;
mod php;
mod python;
mod ruby;
mod rust;
mod scala;
mod swift;
mod typescript;

pub use pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, RepoPath, Span, Symbol,
    Unresolved, UnresolvedKind, pack_for_path,
};

pub use go::{GoCallableKind, GoCallableType, go_callable_type};
pub use rust::RustFileFacts;

// Exact import facts and conservative site classification for runtime integration.
pub use typescript::ts_imports;
