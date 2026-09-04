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
- Incremental working-tree refresh, isolated repo identities and writer locks.
- Rust, Go, TypeScript/JavaScript/TSX and Python parsing. Resolution depth varies
  by language; this does not replace a compiler or language server.

## Install from source

Prerequisites: Git, Rust **1.89.0**, and a C compiler for Tree-sitter.
The alpha uses Unix APIs: macOS is locally verified; Linux is covered by CI.
Native Windows is not supported.

~~~sh
git clone https://github.com/ibotpafos/cgrx.git
cd cgrx
git checkout v0.1.0-alpha.2
cargo install --locked --path crates/cgrx-cli
~~~

The default executable path is $HOME/.cargo/bin/cgrx. Cargo downloads dependencies
during installation; MCP queries require no runtime network client.
A macOS Apple Silicon binary with SHA-256 checksums is available on the release page.

## Connect once, query many repositories

OpenAI Codex CLI:

~~~sh
codex mcp add cgrx -- "$HOME/.cargo/bin/cgrx" serve --multi-repo
~~~

Restart the MCP client after configuration changes. Every tool request must
include the absolute Git worktree root in **repo**. Example status arguments:

~~~json
{"repo": "/absolute/path/to/repository", "paths_or_scope": ["src"]}
~~~

CGRX writes its managed index under Git metadata, not into source files.
See [installation](docs/installation.md) for OpenCode, binary installation,
updates, uninstalling and troubleshooting.

## MCP tools

| Tool | Purpose |
| --- | --- |
| status | Snapshot, graph counts, freshness, coverage |
| search_graph | Bounded symbol discovery |
| trace_path | Caller/callee traversal |
| get_code_snippet | Exact source definition |
| check_index_coverage | Recorded gaps for paths/scopes |
| orient | Budgeted task context |
| expand | Follow-up context using a returned handle |
| scan_risks | Candidate relationship risks, not confirmed defects |

## Maturity and privacy

**Alpha.** Rust Cargo-root resolution covers bounded same-package lib/bin/module
cases. Development builds additionally resolve explicit file-level aliases of
direct crate-root modules (`use crate::worker as api; api::target()`). Grouped
imports, aliases with nested suffixes (`api::inner::target()`), function aliases
and reexport chains are not covered by this alias proof. Extraction revision 13
requires rebuilding older indexes.

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
~~~

The relationship evaluator copies the public synthetic fixture into a temporary
committed repository, queries the real stdio MCP server, and reports exact
TP/FP/FN, precision, recall and F1 for direct caller-to-callee edges. Its v1
contract covers seven Rust, Go, TypeScript and Python cases, including same-name
package/module competitors and a private Rust target. A changed resolver must
keep the default 1.0 precision and recall thresholds; extend the fixture when
adding a new relationship shape. Truncated traces fail instead of producing
incomplete "exact" metrics.

## License

[MIT](LICENSE). Bundled tokenizer resources and dependencies retain their
respective notices: [Third-party notices](THIRD_PARTY_NOTICES.md).
