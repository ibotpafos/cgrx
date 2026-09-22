# CGRX competitive positioning

**Local, evidence-oriented code intelligence for AI coding agents** — one Rust
executable, one stdio MCP server, multiple Git repositories selected explicitly
on each request. No embedding service, hosted index, or API key.

This document compares CGRX against three references:

- **CodeQL** — the semantic code-analysis engine (GitHub/Microsoft) used for
  security, vulnerability and bug detection via QL queries and GitHub code
  scanning.
- **Sourcegraph** — the centralized code search and navigation platform, plus
  its Cody AI coding assistant.
- **Trace MCP** — the reference described in
  [`docs/reference-trace-mcp.md`](reference-trace-mcp.md), reviewed against its
  public documentation and repository.

The comparison is grounded in real CGRX behavior documented in `README.md` and
`docs/reference-trace-mcp.md`. Capabilities that CGRX does *not* claim are called
out explicitly rather than glossed over. No overall superiority over other
tools is asserted.

## (a) Feature comparison

Capabilities are scored against how CGRX actually behaves today. Cells marked
**different scope** mean the tool targets a different job and is not directly
comparable on that axis.

| Capability | CGRX | CodeQL | Sourcegraph | Trace MCP (reference) |
| --- | --- | --- | --- | --- |
| Local, offline execution (no API key) | ✅ One binary, no embedding/API key | ⚠️ CLI is local but needs build/extraction and a licensed runner for some flows | ❌ Centrally hosted server / Cody uses LLM APIs | ✅ Local stdio server, no API key |
| Stdio MCP server for agents | ✅ `cgrx serve`, 22 focused tools | ❌ different scope (CI/scanning, not an agent MCP) | ❌ different scope (search UI + Cody API) | ✅ MCP tool surface |
| Symbol search (name, prefix, substring, fuzzy) | ✅ `search_graph`, name-first deterministic ranking + fuzzy matching (Levenshtein) | ❌ different scope | ✅ Full-text + structural search | ✅ Full-text + language/file filters |
| Exact source definitions | ✅ `get_code_snippet`, `get_outline` (spans, no bodies) | ❌ different scope | ✅ Go to definition | ✅ `get_code_snippet` / outline → exact |
| Bounded caller/callee traces | ✅ `trace_path`, `find_usages` (1–4 hop, proven edges only) | ❌ different scope (data-flow, not call trace) | ✅ Find references / call graph (broader language coverage) | ✅ `find_usages` with `depth`, `via` |
| Task-sized context with token budgets | ✅ `orient` + `expand` with handles; budgeted | ❌ different scope | ❌ different scope | ✅ Budgeted context bundles (`orient`-class) |
| Coverage reporting (unresolved stays *unknown*, not *absent*) | ✅ Explicit coverage gaps; "no recorded gap ≠ completeness" | ⚠️ Extraction gaps exist but not surfaced as first-class agent evidence | ❌ different scope | ⚠️ Coverage gaps not made first-class |
| Change-mission risk detection | ✅ `scan_risks` deterministic Change Missions (paths, batches, blockers) | ❌ different scope | ❌ different scope | ✅ Decision-memory/decomposition ideas; CGRX implements model-free DAG |
| Deterministic refactor candidates | ✅ `suggest_refactors` + `get_architecture` futures, `llm_used=false` | ❌ different scope | ❌ different scope | ⚠️ Architecture explanation is optional AI (Ollama/OpenAI) |
| Runtime-evidence fusion | ✅ Revision-pinned observed calls merged with static graph; `observe insights` | ❌ different scope | ❌ different scope | ✅ Static/runtime overlays described |
| SARIF quality gates | ✅ `check_change_gates` / `check_repository_gates` → SARIF 2.1.0 (`crates/cgrx-mcp/src/sarif.rs`) | ✅ Native SARIF output (its core format) | ❌ different scope | ⚠️ Quality-gate documented, but missing coverage not first-class |
| Framework-aware detection gate | ✅ `check_framework_gates` model-free, snapshot-bound detector for Django/FastAPI/Express with explicit PASS/WARN/FAIL/INCONCLUSIVE (`docs/framework-gates.md`) | ❌ different scope | ❌ different scope | ⚠️ No equivalent framework-packet recognition described |
| Security audit gate | ✅ `check_security_gates` model-free secret/dependency/license gate with explicit verdict and coverage-gap honesty (`docs/security-gates.md`) | ⚠️ CodeQL detects secrets via queries (different scope: vulnerability finding vs. CI gate) | ❌ different scope | ⚠️ No equivalent security gate described |
| Deterministic, model-free (`llm_used=false`) | ✅ All planners report `llm_used=false` | ✅ Static analysis, no LLM | ❌ Cody is LLM-backed | ❌ Optional AI paths use Ollama/OpenAI |
| Revision-pinned snapshots | ✅ Graph bound to revision/working-tree digest | ✅ Analysis bound to a commit/checkout | ✅ Indexed at a commit | ✅ Pinned SHAs in benchmark |
| Language breadth | ⚠️ 7 validated packs today (Rust, Go, Java, TS/JS/TSX, Python, C, Kotlin); additional parsers remain experimental until coverage evidence is reviewed | ✅ Very broad language support | ✅ Very broad (SCIP/LSIF) | ✅ Larger symbol-only surface documented |

**Reading the table honestly.** CGRX wins on the agent-facing, evidence-honest,
model-free axes: token-budgeted context, first-class coverage gaps,
deterministic change missions and refactor futures, runtime-evidence fusion, and
SARIF gates that can never report a silent pass. CodeQL and Sourcegraph win
decisively on raw language breadth and (for Sourcegraph) on cross-repository
navigation at scale. Trace MCP shares CGRX's local/agent orientation but routes
several capabilities through optional AI, whereas CGRX keeps every planner
`llm_used=false`.

## (b) CGRX differentiators

These are the properties that distinguish CGRX from the references above. Each is
grounded in shipped behavior, not a roadmap promise.

1. **Deterministic, model-free algorithms that report `llm_used=false`.**
   Every planner — `scan_risks` (`change_missions_v1`), `check_change_gates`
   (`change_quality_gate_v1`), `check_repository_gates`, `suggest_refactors`
   (`counterfactual_refactor_v1`), `check_framework_gates`
   (`framework_detection_gate_v1`), and `observe insights` (`runtime_priority_v1`)
   — is a pure function over the evidence graph. No LLM, embedding runtime, model
   weights, or external AI API is involved. Compare Trace MCP, whose architecture
   explanation is optional AI backed by Ollama/OpenAI.

2. **Coverage-honest gaps.** Unresolved relationships *stay unknown, not
   absent*. CGRX records explicit coverage gaps (e.g. `TRAVERSAL_TRUNCATED`,
   dynamic-dispatch targets, ambiguous local symbols) and surfaces them through
   `check_index_coverage`, the gates, and the explorer. The `README.md` is
   explicit: "No recorded gap does not prove completeness." Neither CodeQL nor
   Sourcegraph present coverage status as a first-class, agent-visible input the
   way CGRX does, and Trace's documented gate can report a clean pass on partial
   evidence.

3. **Local/offline with no embedding service or API key.** One binary, one stdio
   server, no network client at query time (`README.md`: "MCP queries require no
   runtime network client"). Sourcegraph's value is a centralized index and Cody
   is LLM-backed; both depart from the offline, key-free model.

4. **Revision-pinned snapshots.** The graph is bound to the current Git revision
   and working-tree digest; imports fail closed when exact revision or source
   hashes do not match the active generation (`README.md`, `observe import`).
   Runtime evidence and refactor futures are all snapshot-bound.

5. **Runtime-evidence fusion.** Revision-pinned observed calls (the compact
   `cgrx.runtime.v1` NDJSON or OTLP/JSON) merge with the static graph and can be
   viewed alone or combined, filtered by environment, and copied as a
   snapshot-bound agent handoff (`README.md`, "Add observed runtime calls"). No
   competitor in this set combines a model-free static graph with a bounded,
   privacy-trimmed runtime overlay on the same evidence switch.

6. **Deterministic Change Missions.** `scan_risks` groups working-tree findings
   into snapshot-bound Change Missions, derives path-conflict dependencies,
   exposes deterministic parallel batches, and blocks only the affected missions
   on coverage gaps (`crates/cgrx-cli/src/runtime/risks.rs`,
   `crates/cgrx-cli/src/runtime/risks/missions.rs`). It is a model-free execution
   DAG, not an LLM task decomposition.

7. **SARIF quality gates that cannot silently pass.** `check_change_gates` and
   `check_repository_gates` render to SARIF 2.1.0 via a pure converter
   (`crates/cgrx-mcp/src/sarif.rs`); `INCONCLUSIVE` partial evidence stays
   blocking unless `fail_on=none`, so missing coverage can never become a clean
   pass. This is stricter than Trace's documented gate, where partial evidence
   can produce a pass.

   CGRX also ships `check_framework_gates`, a model-free framework-packet
   detector (Django/FastAPI/Express) that feeds the same conservative verdict
   logic: positive patterns raise confidence while false-positive guards lower
   it, and `INCONCLUSIVE` stays blocking unless `fail_on=none`. It is a pure
   function over the indexed documents with `llm_used=false`
   (`docs/framework-gates.md`, `crates/cgrx-cli/src/runtime/frameworks.rs`).
   `check_security_gates` extends this pattern to working-tree secrets,
   Cargo.lock dependency hygiene and license allowlist scanning
   (`docs/security-gates.md`, `crates/cgrx-cli/src/runtime/security.rs`).

## (c) Road to competitive parity

Honest gaps remain. The phases below name concrete work, cite real files, and
reference the existing benchmarks that will measure progress. This is a roadmap,
not a claim of current parity.

### P1 — Language breadth

**Goal:** grow from the current 7 packs (Rust, Go, Java, TypeScript/JS/TSX,
Python, C, Kotlin) toward 10+ languages.

- Today's parsers live in `crates/cgrx-languages/src/` (`rust.rs`, `go.rs`,
  `java.rs`, `python.rs`, `typescript.rs`, `ts_imports.rs`) and are wired through
  Tree-sitter grammars declared in `crates/cgrx-languages/Cargo.toml`
  (`tree-sitter-go`, `tree-sitter-java`, `tree-sitter-python`,
  `tree-sitter-rust`, `tree-sitter-typescript`).
- Each new language requires both a grammar and a conservative relationship proof
  (the bar set by Java's `java.rs`: unique-target call proof, constructor proof,
  explicit dispatch gaps). Symbol-only extraction is explicitly *not* counted as
  relationship support (`docs/reference-trace-mcp.md`).
- **Measured today:** `docs/benchmarks/java-call-graph-2026-09-07.md` shows the
  cost of adding a fifth call-aware language with positive/negative controls.
  New languages should follow the same fixture discipline so precision/recall
  stays exact.

### P2 — Monorepo scale

**Goal:** remove the hard caps that bound today's algorithms and replace them
with streaming, pagination, and caller-configurable limits.

- Current hard limits are literal constants:
  - `crates/cgrx-cli/src/runtime/risks.rs:9-10` —
    `DOCUMENT_LIMIT: usize = 100_000`, `EDGE_LIMIT: usize = 20_000`.
  - `crates/cgrx-cli/src/runtime/refactors.rs:17-18` —
    `DOCUMENT_LIMIT: usize = 20_000`, `PAIR_LIMIT: usize = 100_000`.
  - `crates/cgrx-core/src/runtime_evidence.rs:10-11` —
    `MAX_TRACE_SPANS: usize = 100_000`, `MAX_TRACE_CALLS: usize = 100_000`.
- These are safety caps, not scale features. P2 first step: indexing maintains a
  persisted bounded snapshot-local similarity projection and watched refreshes
  rebuild it on a generation-bound background worker, with up to
  100,000 callable documents, 100,000 structural pairs and 50,000 shared-callee
  functional pairs. `find_similar` keeps exact duplicate evidence separate from
  heuristic structural/functional matches, while default-budget
  `suggest_refactors` reuses the projection instead of rebuilding fingerprints
  and candidate buckets per request. A stale worker cannot publish into a newer
  snapshot. A pair-truncated projection stays useful as a fast partial
  `suggest_refactors` candidate layer and reports `SIMILARITY_PAIR_BUDGET`;
  explicit document/pair budgets force the wider direct scan when the caller
  needs a recheck. A building or document-truncated projection falls back to
  direct scanning. `find_similar` uses a current direct root scan while
  rebuilding and reports projection status and truncation explicitly. `suggest_refactors`
  also accepts optional `max_documents` and `max_pairs` arguments (default 0 =
  use original safety caps), so callers on large monorepos can raise or lower
  the direct-scan budgets explicitly. `get_architecture` now returns deterministic resumable
  pages using `limit`, `offset` and `page.next_offset`, while preserving totals,
  truncation and coverage-gap semantics. `orient` now separates expensive
  retrieval/preparation from budget-dependent packing: `expand` reuses the
  snapshot-bound preparation instead of rerunning retrieval, and live MCP
  sessions keep a bounded per-snapshot preparation cache for repeated `orient`
  calls when no external semantic reranker is active. `bench orient` measures
  full warm orientation and prepared repacking separately. Remaining work:
  reducing first-pass `orient` preparation cost and the full in-memory
  architecture calculation itself on very large monorepos.
- **Measured today:** `docs/benchmarks/architecture-communities-2026-09-07.md`
  and `docs/benchmarks/architecture-futures-2026-09-07.md` pin five-project
  runs; the same harness should be re-run on a large single-repository corpus to
  size the streaming work.

### P3 — Team / shared index server

**Goal:** move from explicit repo-scoped runtimes to a shared, team-accessible
index.

- Today the model is "explicit repo-scoped runtimes" with incremental
  working-tree refresh and writer locks (`README.md`, "Incremental working-tree
  refresh, isolated repo identities and writer locks").
- `docs/reference-trace-mcp.md` flags the prior art: Trace documents a
  multi-project daemon with LRU/TTL and measured RSS attribution. CGRX's own note
  is explicit — "Measure resident cost per loaded project before introducing a
  daemon cache or eviction policy." P3 therefore starts with resident-cost
  measurement per project before any shared-cache or eviction design.
- **Measured today:** `docs/benchmarks/` currently covers correctness and
  token-cost, not multi-project memory footprint; a resident-set benchmark is a
  prerequisite deliverable for P3.

### P4 — Safe model-free apply

**Goal:** let agents execute the deterministic plans CGRX already produces,
without introducing an LLM into the loop.

- `suggest_refactors` already emits a snapshot-bound `agent_handoff` with
  `preserve_entry_points` and an explicit `blocked_by_gaps` flag when coverage,
  dispatch, truncation, or public-surface uncertainty remains; it "never writes
  source" (`README.md`).
- `scan_risks` Change Missions carry exact finding/impact/candidate-test indexes
  and a reproducible handoff, also non-editing.
- P4 adds a *safe, model-free apply* path: a guarded executor that consumes those
  handoffs, revalidates the snapshot, refuses any edit that would remove a
  preserve-listed entry point or cross a `blocked_by_gaps` boundary, and reports
  `llm_used=false`. The foundation is the existing `blocked_by_gaps` semantics in
  `suggest_refactors` and the deterministic batches in
  `crates/cgrx-cli/src/runtime/risks/missions.rs`.
- **Measured today:** the apply layer should reuse the verification discipline in
  `docs/benchmarks/change-missions-2026-09-07.md` and
  `docs/benchmarks/counterfactual-refactor-2026-09-07.md`, extending them with
  pre/post-apply graph-diff assertions so a blocked apply is provably a no-op.

---

### Disclosure

Written in **public** disclosure mode. All claims are grounded in `README.md`,
`docs/reference-trace-mcp.md`, `docs/sarif-gates.md`, the cited source files, and
`docs/benchmarks/*`. CGRX does not claim overall superiority over CodeQL,
Sourcegraph, or Trace MCP; it claims a specific, defensible position on local,
offline, model-free, evidence-honest code intelligence for agents.
