# Language Wave 1: C and Kotlin support

## Summary

Added two new language packs to CGRX: **C** (`.c`, `.h`) and **Kotlin** (`.kt`, `.kts`). Both follow the existing conservative extraction model: symbols, imports, exact type references, and direct calls to unique same-file declarations only. All other call shapes stay as explicit `UnresolvedKind::Dispatch` gaps.

## Why C and Kotlin

From the candidate list (C/C++, C#, Kotlin, Ruby, PHP, Swift), C and Kotlin were selected for wave 1 because:

1. **C** — the foundational systems language. Required for any codebase touching OS kernels, embedded, crypto, runtimes, or FFI. Sourcegraph and Trace both support it; CGRX could not. The tree-sitter-c grammar is mature and stable.
2. **Kotlin** — the modern JVM language. Dominant for Android, increasingly used for server-side (Ktor, Spring). Shares Java's static-call discipline but with different syntax. The tree-sitter-kotlin-ng grammar is actively maintained and compatible with the workspace's tree-sitter version.

Both languages have deterministic same-file call resolution that fits CGRX's existing proof model without requiring new provenance variants.

## Design

### C language pack (`crates/cgrx-languages/src/c.rs`)

- **Symbols**: function definitions, aggregate definitions with bodies, and typedef declarations. Aggregate uses are references rather than duplicate declarations.
- **Imports**: `preproc_include` (`#include <...>` and `#include "..."`).
- **References**: `type_identifier` uses resolve only when the same file has exactly one matching aggregate or typedef declaration.
- **Calls**: a direct identifier call resolves only when exactly one same-file function definition has that name. Function pointers, struct member calls, external functions, and duplicate declarations remain `UnresolvedKind::Dispatch`.
- **Context**: `CContext` counts function and type declarations in a single pass before classification.

### Kotlin language pack (`crates/cgrx-languages/src/kotlin.rs`)

- **Symbols**: `function_declaration` (first `identifier` child), `class_declaration`, `object_declaration`, `enum_class_declaration`, `type_alias`.
- **Imports**: `import` statements.
- **References**: `user_type` uses resolve to one unique local type or one explicit non-wildcard import, including aliases.
- **Calls**: a direct identifier call resolves only to one unique top-level function when no member declaration shares the name and the call is outside a type body. Overloads, methods, constructors, and external functions remain `UnresolvedKind::Dispatch`.
- **Context**: `KotlinContext` counts all and top-level functions separately and records local and explicitly imported types.

## Frozen fixtures

Each language has two frozen fixtures in `fixtures/adversarial/cases/`:

| Fixture | Purpose |
| --- | --- |
| `c-direct-call/` | Positive: `add()` is declared and called in same file |
| `c-parser-error-range/` | Negative: parser error produces explicit gap |
| `kotlin-direct-call/` | Positive: `greet()` is declared and called in same file |
| `kotlin-parser-error-range/` | Negative: parser error produces explicit gap |

Each fixture has a `gold.json` with source SHA-256, expected spans, and scorer type. `fixtures/adversarial/manifest.json` pins all 24 current cases; `scripts/validate_adversarial_manifest.py` rejects missing, duplicate, unsafe, or stale entries.

## Tests

`cargo test -p cgrx-languages` runs 142 tests, including 107 integration tests in `extraction.rs`, the C/Kotlin module tests, determinism, and import-site contracts.

Test categories per language:
- Direct call has exact span and `Provenance::Syntax`
- Symbols, imports, and calls are fail-closed (no over-approximation)
- Function pointer / method calls are `Dispatch`, not `Calls`
- Kotlin member-name collisions and overloads do not become name-only calls
- `.h` and `.kts` each exercise `CALLS`, `IMPORTS`, `REFERENCE`, and `UNRESOLVED`
- Parser errors produce explicit coverage gaps

## Contract update

`contracts/language_coverage_v1.json` extends the complete matrix to seven languages, ten extensions, 40 populated relation cells, and 40 designated tasks. Sixteen pinned tasks cover all four relations for `.c`, `.h`, `.kt`, and `.kts`.

| Language | Extensions | CALLS | IMPORTS | REFERENCE | UNRESOLVED |
| --- | --- | --- | --- | --- | --- |
| `c` | `.c`, `.h` | populated | populated | populated | populated |
| `kotlin` | `.kt`, `.kts` | populated | populated | populated | populated |

The MCP schema and runtime filters expose both languages through `search_graph` and `suggest_refactors`; runtime tests exercise body search and refactor candidates for C and Kotlin.

## Verification

```bash
cd /absolute/cgrx-worktree
CARGO_TARGET_DIR=/tmp/cgrx-pr54-target cargo fmt --all -- --check
CARGO_TARGET_DIR=/tmp/cgrx-pr54-target cargo clippy --locked --workspace --all-targets -- -D warnings
CARGO_TARGET_DIR=/tmp/cgrx-pr54-target cargo test --locked --workspace
python3 -m unittest discover -s scripts -p 'test_*.py'
python3 scripts/validate_adversarial_manifest.py
python3 scripts/smoke_mcp.py /tmp/cgrx-pr54-target/debug/cgrx
```

## Files created/modified

- `crates/cgrx-languages/Cargo.toml` — added `tree-sitter-c` and `tree-sitter-kotlin-ng` dependencies
- `crates/cgrx-languages/src/c.rs` — new C language pack
- `crates/cgrx-languages/src/kotlin.rs` — new Kotlin language pack
- `crates/cgrx-languages/src/lib.rs` — registered new modules
- `crates/cgrx-languages/src/pack.rs` — added C and Kotlin to `pack_for_path`
- `crates/cgrx-languages/tests/extraction.rs` — extraction, coverage, and ambiguity regressions
- `crates/cgrx-cli/src/runtime.rs` and `runtime/refactors.rs` — public C/Kotlin filters
- `crates/cgrx-mcp/src/tools.rs` — schema enums for both new languages
- `contracts/language_coverage_v1.json` — added C and Kotlin contract entries
- `contracts/real_tasks_v1.json` — 16 pinned coverage tasks
- `scripts/validate_adversarial_manifest.py` — frozen-fixture manifest validator
- `fixtures/adversarial/cases/c-direct-call/` — positive C fixture
- `fixtures/adversarial/cases/c-parser-error-range/` — negative C fixture
- `fixtures/adversarial/cases/kotlin-direct-call/` — positive Kotlin fixture
- `fixtures/adversarial/cases/kotlin-parser-error-range/` — negative Kotlin fixture
