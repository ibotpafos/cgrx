# Maintenance audit — 2026-09-25

This document records the repository-wide maintenance pass performed against
`ibotpafos/cgrx`. The goal is behavior-preserving cleanup: reduce duplication,
make module ownership clearer, harden CI/repository hygiene, and identify the
next refactors that need dedicated regression coverage.

## Completed

### CLI and MCP structure

- Extracted the CLI MCP adapter from the former ~2,065-line `main.rs` into
  `crates/cgrx-cli/src/mcp_backend.rs`.
- Removed five historical copies of the same release-inventory unit test.
- Split `crates/cgrx-mcp/src/tools.rs` into focused layers:
  - response/model-visible shaping;
  - static tool schemas and metadata;
  - contract/regression tests;
  - request argument DTO/default parsing.
- The central MCP tools implementation is now focused on server state, dispatch,
  backend calls, logging, memory operations, and handle semantics rather than
  presentation/schema/test concerns.

### Workspace and CI

- Centralized shared Cargo package/dependency metadata where compatible with the
  existing release-version contract.
- Reused per-OS release binaries between `rust-core` and `integration` jobs
  instead of rebuilding the release binary a second time.
- Pinned all external GitHub Actions used by repository workflows to immutable
  commit SHAs.
- Frontend CI now regenerates and clean-diff checks the primary `app.js` and
  `layout-worker.bundle.js` files that are embedded into the explorer binary,
  in addition to the existing vendor-bundle checks.
- Existing Rust, integration, Python, web and experimental-PHP validation stays
  blocking.

### Repository hygiene

- Added CODEOWNERS, Dependabot, issue forms, pull-request template and
  EditorConfig.
- Expanded CONTRIBUTING with local validation and data-safety requirements.
- Removed duplicate maintenance documentation (`README2.md`).
- Exact-blob review found no meaningful duplicate production source files;
  repeated dependency-license texts and deliberate fixture variants are
  expected and should not be deduplicated.
- Repository rulesets are still an admin-setting task; see issue #92.

## Remaining priorities

### P1 — narrow blanket lint suppression

`crates/cgrx-cli/src/runtime/security.rs` currently begins with
`#![allow(clippy::all)]`. Remove the blanket suppression and fix or narrowly
annotate the actual warnings. Keep any necessary exception local and documented.

Tracked by issue #87.

### P1 — decompose very large runtime paths with regression proof

The following functions/modules carry enough evidence semantics that mechanical
splitting without tests would be unsafe:

- `Runtime::refresh` in `runtime.rs`;
- `get_architecture` in `runtime/architecture.rs`;
- `rebuild_arcs_with_cargo` in `runtime/arc_resolution.rs`;
- `extract_path` in `runtime/extraction.rs`.

For these, extract one concern at a time and preserve snapshot identities,
source spans, ambiguity behavior, persisted data shape, refresh semantics and
coverage gaps. Prefer golden/regression tests before each move.

### P2 — continue MCP dispatch decomposition

After presentation/schema/arguments/test extraction, the remaining MCP tools
module is materially smaller. Future splitting should follow behavioral
boundaries (dispatch, memory, telemetry) rather than file-size targets.

### P2 — repository protection

Issue #92 documents the desired `main` ruleset: PR-only changes, required
checks, conversation resolution, and force-push/deletion protection. This
requires repository-admin settings and cannot be applied by the current GitHub
App connection.

## Guardrails

Maintenance refactors must not:

- turn unresolved evidence into a guessed edge;
- change MCP schemas or compact response semantics accidentally;
- change node IDs/source spans merely to make code shorter;
- relax blocking CI to make a refactor pass;
- mutate historical release tags or artifacts.

Every structural change should pass workspace fmt/Clippy/tests, integration
evaluators, Python validation, frontend checks, and the experimental PHP matrix
when applicable.
