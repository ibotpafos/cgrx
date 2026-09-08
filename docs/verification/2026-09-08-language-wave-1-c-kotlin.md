# Language Wave 1: C and Kotlin support

## Summary

Added two new language packs to CGRX: **C** (`.c`, `.h`) and **Kotlin** (`.kt`, `.kts`). Both follow the existing conservative extraction model: symbols, imports, and direct calls to same-file declarations only. All other call shapes stay as explicit `UnresolvedKind::Dispatch` gaps.

## Why C and Kotlin

From the candidate list (C/C++, C#, Kotlin, Ruby, PHP, Swift), C and Kotlin were selected for wave 1 because:

1. **C** — the foundational systems language. Required for any codebase touching OS kernels, embedded, crypto, runtimes, or FFI. Sourcegraph and Trace both support it; CGRX could not. The tree-sitter-c grammar is mature and stable.
2. **Kotlin** — the modern JVM language. Dominant for Android, increasingly used for server-side (Ktor, Spring). Shares Java's static-call discipline but with different syntax. The tree-sitter-kotlin-ng grammar is actively maintained and compatible with the workspace's tree-sitter version.

Both languages have deterministic same-file call resolution that fits CGRX's existing proof model without requiring new provenance variants.

## Design

### C language pack (`crates/cgrx-languages/src/c.rs`)

- **Symbols**: `function_definition` (name extracted via `declarator.declarator`), `struct_specifier`, `union_specifier`, `enum_specifier`, `type_definition`.
- **Imports**: `preproc_include` (`#include <...>` and `#include "..."`).
- **Calls**: `call_expression` where `function` is an `identifier` AND that identifier matches a `function_definition` declared in this file. All other calls (function pointers, struct member calls, external functions) become `UnresolvedKind::Dispatch`.
- **Context**: `CContext` collects declared function names in a single pass before classification.

### Kotlin language pack (`crates/cgrx-languages/src/kotlin.rs`)

- **Symbols**: `function_declaration` (first `identifier` child), `class_declaration`, `object_declaration`, `enum_class_declaration`, `type_alias`.
- **Imports**: `import` statements.
- **Calls**: `call_expression` where `function` is an `identifier` AND that identifier matches a `function_declaration` in this file. Method calls on objects, constructors, and external functions become `UnresolvedKind::Dispatch`.
- **Context**: `KotlinContext` collects declared function names in a single pass before classification.

## Frozen fixtures

Each language has two frozen fixtures in `fixtures/adversarial/cases/`:

| Fixture | Purpose |
| --- | --- |
| `c-direct-call/` | Positive: `add()` is declared and called in same file |
| `c-parser-error-range/` | Negative: parser error produces explicit gap |
| `kotlin-direct-call/` | Positive: `greet()` is declared and called in same file |
| `kotlin-parser-error-range/` | Negative: parser error produces explicit gap |

Each fixture has a `gold.json` with source SHA-256, expected spans, and scorer type.

## Tests

All tests pass (`cargo test -p cgrx-languages`):

- **104 tests** in `extraction.rs` (existing 100 + 8 new for C/Kotlin)
- **3 unit tests** in `c.rs` module
- **3 unit tests** in `kotlin.rs` module

Test categories per language:
- Direct call has exact span and `Provenance::Syntax`
- Symbols, imports, and calls are fail-closed (no over-approximation)
- Function pointer / method calls are `Dispatch`, not `Calls`
- Parser errors produce explicit coverage gaps

## Contract update

`contracts/language_coverage_v1.json` extended with two new language entries:

| Language | Extensions | CALLS cell | IMPORTS cell | UNRESOLVED cell |
| --- | --- | --- | --- | --- |
| `c` | `.c`, `.h` | `c-direct-call-add` | `c-direct-call-stdio-import` | `c-function-pointer-dispatch` |
| `kotlin` | `.kt`, `.kts` | `kotlin-direct-call-greet` | `kotlin-direct-call-import-list` | `kotlin-method-dispatch` |

## Verification

```bash
cd /Volumes/D/Projects/cgrx-opensource/.worktrees/agent-langs
CARGO_TARGET_DIR=~/cgrx-build-cache/agent-langs cargo fmt --all -- --check
CARGO_TARGET_DIR=~/cgrx-build-cache/agent-langs cargo clippy --locked --workspace --all-targets -- -D warnings
CARGO_TARGET_DIR=~/cgrx-build-cache/agent-langs cargo test -p cgrx-languages
```

All three checks pass cleanly.

## Files created/modified

- `crates/cgrx-languages/Cargo.toml` — added `tree-sitter-c` and `tree-sitter-kotlin-ng` dependencies
- `crates/cgrx-languages/src/c.rs` — new C language pack
- `crates/cgrx-languages/src/kotlin.rs` — new Kotlin language pack
- `crates/cgrx-languages/src/lib.rs` — registered new modules
- `crates/cgrx-languages/src/pack.rs` — added C and Kotlin to `pack_for_path`
- `crates/cgrx-languages/tests/extraction.rs` — added 8 integration tests
- `contracts/language_coverage_v1.json` — added C and Kotlin contract entries
- `fixtures/adversarial/cases/c-direct-call/` — positive C fixture
- `fixtures/adversarial/cases/c-parser-error-range/` — negative C fixture
- `fixtures/adversarial/cases/kotlin-direct-call/` — positive Kotlin fixture
- `fixtures/adversarial/cases/kotlin-parser-error-range/` — negative Kotlin fixture
