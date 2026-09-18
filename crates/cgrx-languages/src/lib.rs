//! Narrow, deterministic C, Go, Java, Kotlin, TypeScript, Python, and Rust extraction packs.

mod c;
mod go;
mod java;
mod kotlin;
mod pack;
mod python;
mod rust;
mod typescript;

// These prototypes have not met the production evidence contract. Keep them
// buildable and testable without exposing unvalidated relationships at runtime.
#[cfg(test)]
mod cpp;
#[cfg(test)]
mod csharp;
#[cfg(test)]
mod elixir;
#[cfg(test)]
mod php;
#[cfg(test)]
mod ruby;
#[cfg(test)]
mod scala;
#[cfg(test)]
mod swift;

pub use pack::{
    Edge, ExtractError, Extraction, LanguagePack, Provenance, RelationKind, RepoPath, Span, Symbol,
    Unresolved, UnresolvedKind, pack_for_path,
};

pub use go::{GoCallableKind, GoCallableType, go_callable_type};
pub use rust::RustFileFacts;

// Exact import facts and conservative site classification for runtime integration.
pub use typescript::ts_imports;

#[cfg(test)]
mod experimental_tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn experimental_grammars_compile_without_runtime_registration() {
        let packs: [&dyn LanguagePack; 7] = [
            &cpp::CPP_PACK,
            &csharp::CSHARP_PACK,
            &elixir::ELIXIR_PACK,
            &php::PHP_PACK,
            &ruby::RUBY_PACK,
            &scala::SCALA_PACK,
            &swift::SWIFT_PACK,
        ];
        for pack in packs {
            assert!(!pack.id().is_empty());
            for extension in pack.extensions() {
                let path = format!("example.{extension}");
                assert!(pack_for_path(Path::new(&path)).is_none(), "{path}");
                // Parser initialization is not evidence of semantic support.
                pack.extract(Path::new(&path), b"").unwrap();
            }
        }
    }
}
