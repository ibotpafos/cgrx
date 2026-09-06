# CGRX

**Local, evidence-oriented code intelligence for AI coding agents.**

One Rust executable. One stdio MCP server. Multiple Git repositories selected
explicitly on each request. No embedding service, hosted index or API key.

[Русская инструкция](docs/installation.md) ·
[Releases](https://github.com/ibotpafos/cgrx/releases) ·
[Agent guide](docs/agent-usage.md) · [Contributing](CONTRIBUTING.md)

## Features

- Symbol search, exact source definitions and bounded caller/callee traces.
- Task-sized context with token budgets and follow-up retrieval handles.
- Coverage reporting: unresolved relationships remain unknown, not absent.
- Candidate relationship-risk detection for working-tree changes.
- Snapshot-bound refactoring candidates with hypothetical graph projections.
- Local evidence graph explorer with current, changed and refactor-future views.
- Incremental working-tree refresh, isolated repo identities and writer locks.
- Rust, Go, TypeScript/JavaScript/TSX and Python parsing. Resolution depth varies
  by language; this does not replace a compiler or language server.

## Install with one command

~~~sh
curl -fsSL https://raw.githubusercontent.com/ibotpafos/cgrx/v0.1.0-alpha.6/install.sh | sh
~~~

Installs to `$HOME/.local/bin/cgrx`, without sudo. Apple Silicon macOS downloads
and verifies the release archive; Linux and Intel macOS build the pinned tag
(requires rustup with Rust 1.89.0, Git and a C compiler). Existing binaries are
backed up before replacement. MCP initialization is checked before activation.
Client configurations and shell profiles are left unchanged.

Override the destination with `CGRX_INSTALL_DIR=/absolute/path` on the `sh` side
of the pipeline; use `sh -s -- --source` to force a source build.

## Install from source

Prerequisites: Git, Rust **1.89.0**, and a C compiler for Tree-sitter.
The alpha uses Unix APIs: macOS is locally verified; Linux is covered by CI.
Native Windows is not supported.

~~~sh
git clone https://github.com/ibotpafos/cgrx.git
cd cgrx
git checkout v0.1.0-alpha.6
cargo install --locked --path crates/cgrx-cli
~~~

The default executable path is $HOME/.cargo/bin/cgrx. Cargo downloads dependencies
during installation; MCP queries require no runtime network client.
A macOS Apple Silicon binary with SHA-256 checksums is available on the release page.

## Connect once, query many repositories

OpenAI Codex CLI:

~~~sh
codex mcp add cgrx -- "$HOME/.local/bin/cgrx" serve --multi-repo
~~~

Restart the MCP client after configuration changes. Every tool request must
include the absolute Git worktree root in **repo**. Example status arguments:

~~~json
{"repo": "/absolute/path/to/repository", "paths_or_scope": ["src"]}
~~~

CGRX writes its managed index under Git metadata, not into source files.
See [installation](docs/installation.md) for OpenCode, binary installation,
updates, uninstalling and troubleshooting.

## Explore the graph locally

Start the read-only explorer for any Git worktree:

~~~sh
cgrx visualize --repo /absolute/path/to/repository
~~~

CGRX selects an available loopback port and opens the browser. Use `--port
4317` for a fixed port or `--no-open` to print the URL without opening it. The
server binds only to `127.0.0.1`, gives the browser a random process-local
capability, accepts only GET and HEAD, and never sends graph or source data to
an external service.

The default graph is a bounded neighborhood arranged as callers → selected
entry point → callees, with candidate tests below. Current proven edges, known
coverage gaps, hypothetical refactor edges, conditional removals and not-run
tests have separate colors, line patterns and text marks. Search and the
evidence inspector remain available without pointer-only interaction. Dragging
a node pins it, arrow keys pan the canvas, and Reset restores the deterministic
layout.

The workspace has four modes:

- **Current** shows only indexed evidence from the active snapshot.
- **Changes** marks nodes from changed source paths.
- **Preview** overlays one selected refactor strategy.
- **Compare** shows current and selected future graphs with one synchronized
  camera.

Every refactor candidate exposes preserve-entry-points, canonical-entry-point
and consolidate paths. A path that could remove an entry point is marked
`blocked_by_gaps` whenever coverage, dispatch, truncation or public-surface
uncertainty remains. **Copy agent plan** copies the exact structured
`agent_handoff` returned by `suggest_refactors`; the agent must revalidate the
snapshot before editing. Node.js is used only for frontend contract tests and
is not required by the released executable.

## MCP tools

| Tool | Purpose |
| --- | --- |
| status | Snapshot, graph counts, freshness, coverage |
| search_graph | Bounded symbol/body discovery with optional language filter |
| get_outline | File symbols and definition spans without bodies |
| trace_path | Caller/callee traversal |
| find_usages | Proven direct or transitive incoming call/implementation sites |
| get_code_snippet | Exact source definition |
| check_index_coverage | Recorded gaps for paths/scopes |
| orient | Budgeted task context |
| expand | Follow-up context using a returned handle |
| scan_risks | Candidate relationship risks, not confirmed defects |
| suggest_refactors | Similar callable bodies and a hypothetical extract-helper graph delta |

`search_graph` searches symbol names by default. Set `include_body: true` to
also locate a term inside symbol bodies, and use `language` (`typescript`, `go`,
`python`, or `rust`) to keep mixed-repository results focused. TypeScript covers
both `.ts` and `.tsx`. Every match reports `matched_by` as `symbol` or `body`.
Use `get_outline` with a repository-relative source path to inspect its symbols
in source order without paying for function bodies; `limit` defaults to 200 and
is capped at 500.
`find_usages` resolves an exact target symbol, then returns only proven incoming
`CALLS`/`IMPLEMENTS` edges allowed by `scope`, including callsite path/span and
resolver class. `depth` defaults to 1 and is capped at 4; transitive rows include
`hop` and the immediate `via` target so every step remains inspectable. It fails
on ambiguous symbols unless `path` disambiguates them.

`suggest_refactors` compares callable bodies within one supported language and
returns review candidates for extracting a shared helper. Each candidate also
contains three deterministic strategy paths and a compact structured agent
handoff. Each response is tied
to the current revision, working-tree digest and graph generation; the managed
runtime refreshes changed source before analysis. Existing entry points are
preserved, projected edges are marked `hypothetical`, blocked removals retain
their gaps, and no source or stored graph is changed. Empty or partial results apply only to the requested scope,
threshold and reported budgets and coverage gaps.

See [the Trace MCP reference comparison](docs/reference-trace-mcp.md) for the
evidence behind this search slice and the capabilities that remain separate.

For repeatable local refresh measurements, run:

```bash
cgrx bench refresh --root /absolute/repository --samples 20 --json
```

The report separates managed-runtime open time and one cache-warming refresh
from the measured warm refreshes. It includes p50, p95, maximum, sample count,
snapshot identity, and whether the warmup or any measured sample observed a
graph change. It is a tool microbenchmark; compare identical repositories,
revisions, build profiles, and sample counts.

## Maturity and privacy

**Alpha.** Rust Cargo-root resolution covers bounded same-package lib/bin/module
cases. Development builds additionally resolve explicit file-level aliases of
direct crate-root modules (`use crate::worker as api; api::target()`). Grouped forms
`use crate::{worker as api, other as backup}` and
`use {crate::worker as api}` also preserve exact module identity, including comments.
Module-self imports `use crate::worker::{self as api}` and
`use crate::{worker::{self as api}}` resolve the same direct module.
Aliases with nested suffixes (`api::inner::target()`), function aliases
and reexport chains are not covered by this Rust alias proof.

Development builds resolve named imports and bounded named reexports to direct
module-level `const` arrow functions as well as free-function declarations.
Mutable bindings, duplicate declarations and binding writes remain unresolved;
this proves target identity, not runtime initialization order.

Development builds resolve bounded TypeScript named imports through `baseUrl`
and single-target `paths` mappings, including `@/*` and dotted basenames such as
`time.utils`. Relative JSON `extends` and explicitly declared workspace-package
config exports are supported. Config bytes, missing config paths and workspace
membership are rechecked on refresh; ambiguity, local shadowing, reassignment,
symlinks and competing installed config packages do not become guessed edges.
This is not a full TypeScript compiler resolver: JSONC, overlapping mappings,
fallback arrays, unsupported compiler options and committed-HEAD-only inherited
aliases can remain unresolved. Installed workspace-package links currently also
cause abstention. Extraction revision 21 requires rebuilding older indexes;
managed startup recognizes revision-18 config records and requests reindexing.

External dependencies, reexports, custom module paths, macros and dynamic
dispatch can remain unresolved. No recorded gap does not prove completeness.
Verify findings against source and compiler/tests. No overall superiority over
other code-intelligence tools is claimed.

Telemetry is opt-in via CGRX_USAGE_LOG and contains usage metadata, not raw
queries/source. Treat indexes and logs as private repository data. The local
stdio server trusts its client and can read repositories accessible to the OS
account; it is not a remote authenticated hosting service.

## Development

~~~sh
cargo fmt --all -- --check
cargo clippy --locked --workspace --all-targets -- -D warnings
cargo test --locked --workspace
cargo build --locked --release -p cgrx-cli
python3 scripts/smoke_mcp.py target/release/cgrx
python3 scripts/eval_relationships.py target/release/cgrx
python3 scripts/eval_refactors.py target/release/cgrx
~~~

The relationship evaluator copies the public synthetic fixture into a temporary
committed repository, queries the real stdio MCP server, and reports exact
TP/FP/FN, precision, recall and F1 for direct caller-to-callee edges. Its v1
contract covers seven Rust, Go, TypeScript and Python cases, including same-name
package/module competitors and a private Rust target. A changed resolver must
keep the default 1.0 precision and recall thresholds; extend the fixture when
adding a new relationship shape. Truncated traces fail instead of producing
incomplete "exact" metrics.

The refactoring evaluator runs the real stdio tool over seven frozen projects,
rejects changed snapshots and truncated results, and records exact graph-node
identities for manual labeling. It reports response-token cost immediately;
precision remains `null` while any candidate is `unreviewed`.

## License

[MIT](LICENSE). Bundled tokenizer resources and dependencies retain their
respective notices: [Third-party notices](THIRD_PARTY_NOTICES.md).
