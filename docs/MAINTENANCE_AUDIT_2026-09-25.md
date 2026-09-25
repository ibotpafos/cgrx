# Maintenance audit — 2026-09-25

This audit covers the public repository at base commit
`dbd52c47b1e1f6a92e385805ef7cb74bceb5625f` and the maintenance changes in
PR #83.

## Scope and method

The review covered the repository tree, Rust workspace boundaries, CLI/MCP
adapters, source extraction, web build artifacts, GitHub Actions, contribution
metadata, and existing refactor evidence. The baseline contained 564 tracked
blobs, including 162 Rust source files.

The audit deliberately separates mechanical/refactoring work from resolver
changes that could alter graph evidence. High-risk semantic decompositions are
listed as follow-ups rather than bundled into the maintenance PR.

## Findings addressed in PR #83

### Source extraction duplication and lookup cost

`extract_path` was the largest function found in the extraction path at roughly
714 lines before the maintenance pass. Repeated `StoredDocument` literals
duplicated the same optional/default fields across syntax, import, reference,
statement, unresolved, route, and implements records.

The maintenance branch centralizes the common document construction while
keeping the proof-bearing call record explicit. `extract_path` is reduced to
about 601 lines without changing the persisted schema.

TypeScript enrichment previously used repeated
`documents.iter_mut().find(...)` scans for import-call and receiver-call
matching. Those lookups are now indexed by deterministic `BTreeMap` keys:

- source span for import-call enrichment;
- source span plus qualified identity for receiver-call enrichment.

For `D` extracted documents and `S + R` TypeScript sites/receivers, this
replaces repeated linear scans with one indexed build plus logarithmic lookups.
First-match behavior is preserved with `or_insert`.

### CLI security-gate flag bug

`check-gates --gate security` parsed security-specific thresholds and
allowlists later in the command, but the initial value-flag whitelist omitted
those names. Explicit values such as `--max-secret-findings` could therefore be
rejected before reaching the security gate.

The whitelist now includes all security-specific flags, comma-separated flag
parsing is shared, and a CLI regression test exercises the full flag surface.

### Repeated MCP backend adapter code

Graph-facing backend methods repeated the same scope decoding, `u32 -> usize`
validation, and runtime-error conversion. These paths now share helpers while
preserving the existing error codes and messages.

### Generated web asset drift

The Rust executable embeds committed browser bundles. CI previously rebuilt and
checked vendor bundles but did not rebuild/check the first-party `app.js` and
layout-worker bundle.

CI now rebuilds both first-party bundles and rejects a dirty generated diff.
The committed bundles are also marked as generated in `.gitattributes`.

### GitHub Actions supply-chain consistency

Most workflow dependencies were already pinned to immutable SHAs, but the main
CI still used mutable `Swatinem/rust-cache@v2` references while PHP validation
already used a fixed SHA. Main CI now uses the same immutable cache-action SHA.

### Repository hygiene

Added or strengthened:

- `.editorconfig` and `.gitattributes`;
- CODEOWNERS;
- Dependabot for Cargo, npm, and GitHub Actions;
- pull-request and structured issue templates;
- `git diff --check` in CI;
- contribution rules for toolchains, generated files, evidence, tests, and
  commit/PR conventions.

## Remaining hotspots

These are intentionally not decomposed in PR #83 because their behavior is
evidence-sensitive and deserves focused changes with dedicated tests.

| Priority | Area | Observation | Recommended next step |
| --- | --- | --- | --- |
| P1 | `crates/cgrx-mcp/src/tools.rs` | ~138 KB / ~3.6k lines; protocol schemas, dispatch, compacting, gates and helpers share one module | Split by protocol/schema, dispatch, response compaction and gate/reporting concerns without changing the public MCP schema |
| P1 | `runtime/architecture.rs::get_architecture` | ~648-line orchestration function | Extract collection, boundary analysis, hotspot/cycle projection and pagination into typed phases |
| P1 | `runtime/security.rs` | Module-wide `#![allow(clippy::all)]` can hide new lint regressions | Remove broad suppression incrementally; use narrow lint allows with comments only where necessary |
| P1 | remaining `extract_path` call branch | Still owns many language-specific proof targets | Move relation-specific document builders behind typed helpers only alongside exact persistence/refresh regressions |
| P2 | `crates/cgrx-cli/src/main.rs` | CLI parsing, managed runtime lifecycle and MCP backend adapter remain in one ~2k-line file | Move command parsing and the runtime MCP adapter into dedicated modules |
| P2 | `crates/cgrx-cli/web/app.tsx` | ~58 KB single UI source | Split state/data access from atlas, discovery and evidence panels; keep generated output deterministic |
| P2 | very large test files | Runtime and CLI tests exceed many production modules in size | Organize tests by behavior boundary while retaining fixture helpers and exact assertions |

The ~918 KB `web/app.js` is generated output, not a hand-maintained source
hotspot. It remains committed because the binary embeds it; deterministic
rebuild verification is the appropriate control.

## Repository settings

The repository currently exposes no GitHub repository rulesets through the
available API. Branch-protection administration is not available to the
connected GitHub integration, so those settings were not changed in this audit.

After PR #83 is green and merged, configure `main` to require pull requests and
the repository's blocking CI workflows, disallow force pushes/deletion, and
require the branch to be up to date before merge. Keep these controls aligned
with the actual required workflow names so maintenance does not deadlock.

## Verification strategy

PR #83 is verified by the repository's own GitHub Actions matrix: Rust
formatting, Clippy, workspace tests and release build on Ubuntu/macOS; frontend
typecheck/build/generated-drift/CSP/tests; Python validators; integration
evaluators; and PHP validation.
