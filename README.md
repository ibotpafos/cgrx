# CGRX

**Local, evidence-oriented code intelligence for AI coding agents.**

One Rust executable. One stdio MCP server. Multiple Git repositories selected
explicitly on each request. No embedding service, hosted index or API key.

[Русская инструкция](docs/installation.md) ·
[Releases](https://github.com/ibotpafos/cgrx/releases) ·
[Agent skill](docs/agent-usage.md) · [Contributing](CONTRIBUTING.md)

## Features

- Symbol search, exact source definitions and bounded caller/callee traces.
- Task-sized context with token budgets and follow-up retrieval handles.
- Coverage reporting: unresolved relationships remain unknown, not absent.
- Candidate relationship-risk detection for working-tree changes.
- Deterministic change missions that group impacts, order conflicting work and
  expose safe parallel batches to coding agents without a model.
- Snapshot-bound refactoring candidates with hypothetical graph projections.
- Local evidence graph explorer with current, changed and refactor-future views.
- Snapshot-bound architecture projection with packages, proven boundaries,
  hotspots, package cycles and deterministic weighted communities.
- Incremental working-tree refresh, isolated repo identities and writer locks.
- Rust, Go, Java, TypeScript/JavaScript/TSX and Python parsing. Resolution depth varies
  by language; this does not replace a compiler or language server.

## Install with one command

~~~sh
curl -fsSL https://raw.githubusercontent.com/ibotpafos/cgrx/v0.1.0-alpha.7/install.sh | sh
~~~

Installs to `$HOME/.local/bin/cgrx`, without sudo. Apple Silicon macOS downloads
and verifies the release archive; Linux and Intel macOS build the pinned tag
(requires rustup with Rust 1.89.0, Git and a C compiler). Existing binaries are
backed up before replacement. MCP initialization is checked before activation.
Client configurations and shell profiles are left unchanged.

Install the reusable agent workflow once:

~~~sh
"$HOME/.local/bin/cgrx" skill install
~~~

This writes the `cgrx-code-discovery` skill to
`$HOME/.agents/skills`. If an older managed CGRX instruction block exists in
`$HOME/.codex/AGENTS.md`, the command backs up that file and removes only that
block. Codex discovers the skill automatically; restart it only if the skill
does not appear.

Override the destination with `CGRX_INSTALL_DIR=/absolute/path` on the `sh` side
of the pipeline; use `sh -s -- --source` to force a source build.

## Install from source

Prerequisites: Git, Rust **1.89.0**, and a C compiler for Tree-sitter.
The alpha uses Unix APIs: macOS is locally verified; Linux is covered by CI.
Native Windows is not supported.

~~~sh
git clone https://github.com/ibotpafos/cgrx.git
cd cgrx
git checkout v0.1.0-alpha.7
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

The Architecture futures rail turns package cycles and high-fan-in hotspots
from `get_architecture` into three selectable graph projections. Each strategy
keeps proven evidence visible, draws its hypothetical nodes and edges
separately, shows the exact score and coverage blockers, and copies the same
snapshot-bound, model-free handoff that an agent can execute and revalidate.
Changing the source snapshot clears the selection instead of presenting a
stale future as current.

## Add observed runtime calls

CGRX can fuse revision-pinned runtime calls with its static graph. It accepts
the compact `cgrx.runtime.v1` NDJSON format and OpenTelemetry OTLP/JSON. Only
function, repository-relative file, line, timestamps, count, revision and
environment are retained; trace IDs, URLs, SQL, arguments and stack traces are
discarded.

~~~sh
cgrx observe import --root /absolute/path/to/repository \
  --input traces.json --format auto --json
cgrx observe status --root /absolute/path/to/repository --json
cgrx observe insights --root /absolute/path/to/repository --limit 20 --json
cgrx observe prune --root /absolute/path/to/repository \
  --before-unix-nanos 1788738444000000000 --dry-run --json
~~~

Use `--input -` for stdin. Pruning requires exactly one of `--dry-run` or
`--apply`. Imports fail closed when their exact Git revision or source hashes do
not match the active graph generation. Runtime evidence is stored separately
from static arcs and does not change normal static traversal results.

`observe insights` deterministically ranks observed hot paths, static/runtime
divergence and caller blast radius. Every row includes the formula inputs,
signals, `refactor_priority`, and `next_action`; it uses no LLM, prompt,
embedding model, model weights, or external AI API.

`suggest_refactors` uses the same evidence to rank three counterfactual future
graphs. Each strategy includes a predicted graph delta, a 0–1000 score, exact
integer formula inputs, reason codes, coverage blockers and an agent handoff.
Complete low-traffic evidence can favor consolidation; observed traffic or
coverage gaps increase the cost of redirecting or removing an entry point. The
ranking algorithm is `counterfactual_refactor_v1` and reports `llm_used=false`.
See the [seven-project benchmark](docs/benchmarks/counterfactual-refactor-2026-09-07.md).

`scan_risks` turns the current working-tree diff into snapshot-bound Change
Missions. Calls into the same changed target are grouped, independent path sets
share a parallel group, overlapping path sets gain explicit dependencies, and
coverage gaps block only affected missions. Each plan carries exact finding,
impact and candidate-test indexes plus a reproducible agent handoff with
`llm_used=false`; it never edits code or runs tests. The compact MCP response
keeps the handoff while omitting duplicated proof bodies. See the
[end-to-end benchmark](docs/benchmarks/change-missions-2026-09-07.md).

`check_change_gates` evaluates that evidence as a conservative, configurable
quality gate. Warning findings, blocked missions and coverage gaps are error
rules by default; unverified impacts are warnings. The result distinguishes
`PASS`, `WARN`, `FAIL` and `INCONCLUSIVE`, so missing graph evidence can never
be reported as a clean pass. `fail_on=error|warning|none` controls whether the
reported state would block an agent or CI policy. Thresholds are explicit call
arguments, the response carries exact rule inputs and evidence indexes, and
the algorithm `change_quality_gate_v1` reports `llm_used=false`.
See the [four-case contract benchmark](docs/benchmarks/change-quality-gates-2026-09-07.md).

`check_repository_gates` applies the same explicit policy model to the current
architecture snapshot. It checks package cycles, maximum package fan-out,
maximum symbol fan-in, unresolved repository-local dependencies and graph
coverage. Defaults fail proven cycles, unresolved local dependencies and
coverage gaps; unusually coupled packages or symbols are warnings. Partial or
truncated architecture evidence produces `INCONCLUSIVE` unless an observed
error rule already proves `FAIL`. The response embeds the model-free
`architecture_futures_v1` plan so an agent can move from a failed gate to
ranked graph repair strategies without another broad query. See the
[repository gate benchmark](docs/benchmarks/repository-quality-gates-2026-09-07.md).

The explorer's **Changes** mode renders that same plan as an execution DAG.
Columns are sequential groups, cards within a column can run in parallel, and
each card exposes its paths, evidence indexes, candidate tests, dependencies
and coverage blockers. **Copy agent handoff** copies the canonical
`cgrx.agent.change-missions.v1` object returned by `scan_risks`; the UI does
not reconstruct or reinterpret the task plan.

The workspace has six modes:

The evidence switch independently selects **Static**, **Runtime**, or
**Combined** traversal. Runtime edges are dashed, their logarithmic width is
bounded by observed call count, and their opacity decays with age but never
below 0.35. The Runtime intelligence list ranks hot paths, divergence and blast
radius with the same `runtime_priority_v1` formula exposed to CLI agents. Copy
runtime agent context exports the pinned snapshot, visible observed edges,
filters, unresolved/ambiguous counts and deterministic insights; the handoff
sets `llm_used=false` and requires snapshot revalidation before edits.

- **Current** shows only indexed evidence from the active snapshot.
- **Architecture** aggregates the same proven relationships into packages and
  exposes fan-in, fan-out, file and symbol counts in the inspector.
- **Changes** renders the current Change Missions execution DAG.
- **Preview** overlays one selected refactor strategy.
- **Compare** shows current and selected future graphs with one synchronized
  camera.
- **Git history** shows the repository's branches, tags, commits and merges in
  a virtualized read-only lane graph. Commit details and changed files load only
  when opened, and selecting a file lazily requests a bounded patch. History is
  capped at 500 commits, details at 500 files and an individual patch at 256 KiB.

Every refactor candidate exposes preserve-entry-points, canonical-entry-point
and consolidate paths. A path that could remove an entry point is marked
`blocked_by_gaps` whenever coverage, dispatch, truncation or public-surface
uncertainty remains. **Copy agent plan** copies the exact structured
`agent_handoff` returned by `suggest_refactors`; the agent must revalidate the
snapshot before editing. The Git history renderer is bundled into the binary,
so Node.js is used only for frontend tests and rebuilding web dependencies and
is not required by the released executable.

## MCP tools

| Tool | Purpose |
| --- | --- |
| status | Snapshot, graph counts, freshness, coverage |
| search_graph | Bounded symbol/body discovery with optional language filter |
| get_outline | File symbols and definition spans without bodies |
| get_architecture | Packages, proven call, implementation, local-import and static-reference boundaries, hotspots, cycles and weighted semantic communities |
| trace_path | Caller/callee traversal |
| find_usages | Proven direct or transitive incoming call/implementation sites |
| get_code_snippet | Exact source definition |
| check_index_coverage | Recorded gaps for paths/scopes |
| orient | Budgeted task context |
| expand | Follow-up context using a returned handle |
| scan_risks | Candidate relationship risks, tests and deterministic parallel Change Missions |
| check_change_gates | Conservative change gate with explicit pass, warning, failure and inconclusive states |
| check_repository_gates | Architecture gate for cycles, coupling, unresolved local dependencies and graph coverage |
| suggest_refactors | Similar callable bodies and a hypothetical extract-helper graph delta |

`search_graph` searches symbol names by default. Set `include_body: true` to
also locate a term inside symbol bodies, and use `language` (`typescript`, `go`,
`java`, `python`, or `rust`) to keep mixed-repository results focused. TypeScript covers
both `.ts` and `.tsx`. Every match reports `matched_by` as `symbol` or `body`.
Use `get_outline` with a repository-relative source path to inspect its symbols
in source order without paying for function bodies; `limit` defaults to 200 and
is capped at 500.
`get_architecture` groups source files and symbols by the first `package_depth`
path components. It aggregates proven `CALLS` and `IMPLEMENTS` relationships
plus unambiguous repository-local `IMPORTS` and conservative static `REFERENCES`
for Rust, Go, Java, Python and TypeScript/TSX. References require an actual imported
type or qualified symbol usage; calls and unqualified dynamic names are omitted.
External targets stay outside the graph, while ambiguous local targets become
explicit coverage gaps. Every cross-package boundary carries exact source
evidence. Results are bound to the current snapshot and report truncation,
resolution counts and coverage gaps. General traversal remains limited to
`CALLS` and `IMPLEMENTS`. Communities optimize deterministic weighted modularity
over proven package relationships (`CALLS`/`IMPLEMENTS` 4, `IMPORTS` 2,
`REFERENCES` 1). Every community reports internal and cut weight plus cohesion;
the response reports modularity, iteration count and the exact heuristic weights.
The same response also clusters proven `CALLS`/`IMPLEMENTS` at symbol granularity.
Each bounded symbol cluster includes a stable label, representative symbols with
paths and weighted degree, binding packages, edge types and cohesion. Symbols
without a proven internal edge remain visible in `unclustered_symbols` instead
of being assigned speculatively.
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

Java (`.java`) uses a grammar-backed parser for classes, interfaces, enums,
records, constructors, methods and imports. CGRX proves an unqualified method
call only when the target is unique in the file, belongs to a concrete class
without inheritance, and is not shadowed by a static import. The same proof
covers `this` receivers and singly-typed local, parameter and field receivers
(including `this.field`) when the declared type is a concrete class defined in
the same file with no superclass, no interfaces, no local subclasses and no
overloads of the target. Foreign or unbound receivers, overloads and inherited
calls remain explicit dispatch gaps. Construction sites (`new X()`, `this()`
and `super()`) prove a call edge to the constructor when the type is a
concrete non-abstract class defined in the same file with exactly one
constructor declaration, or to the class itself for the implicit default;
overloaded, generic, anonymous, qualified and imported constructions stay
gaps. A constructor shares its name with the class, so name-only callers
traces over an explicit constructor are ambiguous the same way overloaded
methods are. This
conservative slice participates in graph traversal, usages, runtime overlays,
refactor futures and the visualizer without an LSP or model runtime.

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
npm ci
npm run typecheck:web
npm run build:web-vendor
npm run verify:web-csp
npm test
cargo clippy --locked --workspace --all-targets -- -D warnings
cargo test --locked --workspace
cargo build --locked --release -p cgrx-cli
python3 scripts/smoke_mcp.py target/release/cgrx
python3 scripts/eval_relationships.py target/release/cgrx
python3 scripts/eval_change_missions.py target/release/cgrx
python3 scripts/eval_refactors.py target/release/cgrx
python3 scripts/benchmark_architecture.py --help
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

The [architecture community benchmark](docs/benchmarks/architecture-communities-2026-09-07.md)
records the pinned five-project CGRX/CBM comparison and its limits.

The [Java call graph benchmark](docs/benchmarks/java-call-graph-2026-09-07.md)
adds a fifth call-aware language with positive and same-name negative controls,
plus source-anchored Gson coverage for calls, imports, references and abstention.

`get_architecture` also finds package cycles and high-fan-in symbols, builds
three deterministic future graphs for each issue, ranks them from proven graph
cost and coverage blockers, and returns a snapshot-bound agent handoff. The
planner does not call or bundle an LLM. The
[architecture futures benchmark](docs/benchmarks/architecture-futures-2026-09-07.md)
validates ranks, graph predictions, handoff identity, abstention, determinism,
latency, and exact model-visible token cost on five frozen projects.

## License

[MIT](LICENSE). Bundled tokenizer resources and dependencies retain their
respective notices: [Third-party notices](THIRD_PARTY_NOTICES.md).
