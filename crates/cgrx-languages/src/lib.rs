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
#[cfg(any(test, feature = "experimental-php"))]
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

/// Effective registry policy, including Cargo dependency feature unification.
pub const EXPERIMENTAL_PHP_ENABLED: bool = cfg!(feature = "experimental-php");

pub use go::{GoCallableKind, GoCallableType, go_callable_type};
pub use rust::RustFileFacts;

// Exact import facts and conservative site classification for runtime integration.
pub use typescript::ts_imports;

#[cfg(test)]
mod experimental_tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn experimental_grammars_follow_the_explicit_build_policy() {
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
                assert_eq!(
                    pack_for_path(Path::new(&path)).is_some(),
                    pack.id() == "php" && EXPERIMENTAL_PHP_ENABLED,
                    "{path}"
                );
                // Parser initialization is not evidence of semantic support.
                pack.extract(Path::new(&path), b"").unwrap();
            }
        }
    }

    #[test]
    fn cpp_project_fit_shadow_respects_parameters_and_block_boundaries() {
        let source = br#"
namespace daw {
bool supportedRate(unsigned rate) { return rate == 48000; }
void sibling() {
    { auto supportedRate = [](unsigned) { return false; }; supportedRate(48000); }
    supportedRate(48000);
}
void parameter(bool (*supportedRate)(unsigned)) { supportedRate(48000); }
void later() {
    supportedRate(48000);
    auto supportedRate = [](unsigned) { return false; };
}
}
"#;
        let extraction = cpp::CPP_PACK
            .extract(Path::new("project-fit-shadow-scopes.cpp"), source)
            .unwrap();
        let calls: Vec<&str> = extraction
            .edges
            .iter()
            .filter(|edge| edge.relation == RelationKind::Calls)
            .map(|edge| edge.target.as_str())
            .collect();
        assert_eq!(calls, ["supportedRate", "supportedRate"]);
        assert_eq!(
            extraction
                .unresolved
                .iter()
                .filter(|site| site.kind == UnresolvedKind::Dispatch)
                .count(),
            2
        );
        assert!(extraction.parser_error_ranges.is_empty());
    }

    #[test]
    fn cpp_project_fit_local_shadow_does_not_prove_free_function_call() {
        let source = br#"
namespace daw {
bool supportedRate(unsigned rate) { return rate == 48000; }
void direct() { supportedRate(48000); }
void shadowed() {
    auto supportedRate = [](unsigned) { return false; };
    supportedRate(48000);
}
}
"#;
        let extraction = cpp::CPP_PACK
            .extract(Path::new("project-fit-shadow.cpp"), source)
            .unwrap();
        let calls: Vec<&str> = extraction
            .edges
            .iter()
            .filter(|edge| edge.relation == RelationKind::Calls)
            .map(|edge| edge.target.as_str())
            .collect();
        assert_eq!(calls, ["supportedRate"]);
        assert!(extraction.unresolved.iter().any(
            |site| site.kind == UnresolvedKind::Dispatch && site.text == "supportedRate(48000)"
        ));
    }

    #[test]
    fn cpp_project_fit_calls_do_not_promote_unknown_receivers() {
        // DAW uses direct helper calls; VocalClean uses receiver calls such as
        // wola_.prepare(). The latter must not become a proven CALLS edge.
        let source = br#"
namespace daw {
bool supportedRate(unsigned rate) { return rate == 48000; }
void process() { supportedRate(48000); engine.prepare(); }
}
"#;
        let extraction = cpp::CPP_PACK
            .extract(Path::new("project-fit-calls.cpp"), source)
            .unwrap();
        let calls: Vec<&str> = extraction
            .edges
            .iter()
            .filter(|edge| edge.relation == RelationKind::Calls)
            .map(|edge| edge.target.as_str())
            .collect();
        assert_eq!(calls, ["supportedRate"]);
        let dispatch_gaps: Vec<&str> = extraction
            .unresolved
            .iter()
            .filter(|site| site.kind == UnresolvedKind::Dispatch)
            .map(|site| site.text.as_str())
            .collect();
        assert_eq!(dispatch_gaps, ["engine.prepare()"]);
    }

    #[test]
    fn cpp_project_fit_definitions_from_daw_and_vocal_patterns() {
        // Reduced from the definition shapes in My DAW/engine/audio/clip.cpp and
        // VocalCleanLive/Source/DSP/LiveCleanEngine.cpp. This is an extractor
        // canary, not evidence that C++ call resolution is production-ready.
        let source = br#"
namespace daw {
namespace {
bool supportedRate(unsigned rate) { return rate == 48000; }
}
Clip::Clip(int count) : count_(count) {}
const float* Clip::samples() const { return data_; }
}
namespace clarity::clean {
float clampUnit(float value) noexcept { return value; }
void LiveCleanEngine::prepare(double sampleRate) noexcept { reset(); }
}
"#;
        let extraction = cpp::CPP_PACK
            .extract(Path::new("project-fit.cpp"), source)
            .unwrap();
        let names: Vec<&str> = extraction
            .symbols
            .iter()
            .map(|symbol| symbol.name.as_str())
            .collect();
        assert_eq!(
            names,
            ["Clip", "clampUnit", "prepare", "samples", "supportedRate"]
        );
        for symbol in &extraction.symbols {
            assert_eq!(
                &source[symbol.span.start..symbol.span.end],
                symbol.name.as_bytes()
            );
            assert!(symbol.search_span.start <= symbol.span.start);
            assert!(symbol.span.end <= symbol.search_span.end);
        }
        assert!(
            extraction.parser_error_ranges.is_empty(),
            "parser errors: {:?}",
            extraction.parser_error_ranges
        );
    }
}
