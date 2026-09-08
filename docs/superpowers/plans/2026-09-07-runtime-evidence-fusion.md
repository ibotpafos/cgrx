# Runtime Evidence Fusion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add revision-bound runtime call evidence that safely enriches CGRX navigation, impact, refactor, agent context, and visualization across Go, TypeScript/TSX, Python, and Rust.

**Architecture:** Normalize CGRX NDJSON and OTLP/JSON into a privacy-reduced observation batch, resolve endpoints against an exact immutable graph generation, and publish an append-only observation snapshot outside the graph generation. Query code joins static arcs and observed calls only when requested, preserving static-only compatibility and provenance.

**Tech Stack:** Rust 2024 workspace, serde/serde_json, blake3, existing CGRX immutable generation and writer-lock primitives, JSON-RPC MCP, TypeScript/Node.js 26 graph explorer, Python benchmark harness.

**Spec:** `docs/superpowers/specs/2026-09-07-runtime-evidence-fusion-design.md`

## Global Constraints

- Support Go, TypeScript/TSX, Python, and Rust in every public evidence path.
- Keep immutable `nodes.seg`, `edges.seg`, and `terms.fst` unchanged by trace import.
- Never upgrade runtime evidence to a definitive static `CALLS` relation.
- Bind every accepted observation to an exact 40-hex Git revision.
- Reject inputs larger than 4 MiB and batches above 100,000 spans or calls.
- Persist no arguments, URLs, request bodies, SQL, stack traces, arbitrary resource attributes, source text, raw trace IDs, or raw span IDs.
- Preserve the existing twelve-tool behavior and response shape for static-only calls; adding one ingestion tool must pass the schema-token gate.
- Use Node.js 26 for TypeScript checks and web tests.
- Treat benchmark fixtures and successful imports as bounded evidence, not universal trace coverage.
- Do not bundle, call, or require an LLM, embedding model, model weights, prompts,
  or external AI API; all intelligent signals must be deterministic and explainable.

## File map

- `crates/cgrx-core/src/runtime_evidence.rs`: normalized public evidence types, enums, bounds, and canonical batch identity.
- `crates/cgrx-core/src/lib.rs`: exports the runtime evidence contract.
- `crates/cgrx-store/src/observations.rs`: crash-safe batch and revision-snapshot persistence.
- `crates/cgrx-store/src/lib.rs`: exports observation store interfaces.
- `crates/cgrx-store/tests/observations.rs`: idempotency, validation, publication, and corruption tests.
- `crates/cgrx-cli/src/runtime/observations.rs`: NDJSON/OTLP parsing, endpoint resolution, fused edge assembly, and status.
- `crates/cgrx-cli/src/runtime.rs`: runtime integration and evidence-aware query entry points.
- `crates/cgrx-cli/src/main.rs`: `observe import/status/prune` CLI.
- `crates/cgrx-cli/tests/runtime_evidence.rs`: four-language mapping and query integration.
- `crates/cgrx-cli/tests/cli.rs`: real CLI import/status/prune behavior.
- `crates/cgrx-mcp/src/tools.rs`: ingestion tool schema and optional evidence selector.
- `crates/cgrx-cli/src/multi_repo.rs`: repository routing for ingestion and evidence-aware queries.
- `crates/cgrx-cli/tests/mcp_runtime_evidence.rs`: MCP contracts and compact response limits.
- `crates/cgrx-cli/src/runtime/risks.rs`: observed impact annotations.
- `crates/cgrx-cli/src/runtime/refactors.rs`: observed entry-point preservation and future graph metadata.
- `crates/cgrx-cli/src/visualize.rs`: runtime evidence/status HTTP endpoints.
- `crates/cgrx-cli/web/runtime-evidence.ts`: browser model, filters, and edge styling.
- `crates/cgrx-cli/web/app.js`: evidence-mode wiring and inspector rendering.
- `crates/cgrx-cli/web/index.html`: runtime controls and diagnostics panel.
- `crates/cgrx-cli/web/styles.css`: observed-edge and status styles.
- `crates/cgrx-cli/web/tests/runtime-evidence.test.js`: TypeScript/browser state tests.
- `contracts/runtime_evidence_v1.json`: frozen train/heldout fixture manifest.
- `scripts/eval_runtime_evidence.py`: real-binary evaluator and timing collector.
- `scripts/test_eval_runtime_evidence.py`: harness contract tests.
- `docs/benchmarks/runtime-evidence-2026-09-07.md`: measured result and limits.
- `README.md`, `docs/reference-trace-mcp.md`: user workflow and competitive matrix.

---

### Task 1: Normalized runtime evidence contract

**Files:**
- Create: `crates/cgrx-core/src/runtime_evidence.rs`
- Modify: `crates/cgrx-core/src/lib.rs`
- Test: `crates/cgrx-core/tests/runtime_evidence.rs`

**Interfaces:**
- Produces: `RuntimeEndpoint`, `NormalizedObservation`, `NormalizedBatch`, `ResolutionKind`, `ObservationGap`, `EvidenceSelector`, `RuntimeEvidenceError`, `MAX_TRACE_BYTES`, `MAX_TRACE_SPANS`, and `MAX_TRACE_CALLS`.
- Produces: `NormalizedBatch::canonical_id(&self, repo_id: &str) -> Hash32`.

- [x] **Step 1: Write failing canonicalization and validation tests**

```rust
#[test]
fn batch_identity_ignores_input_order_but_includes_revision_and_environment() {
    let left = batch(vec![call("a", "b"), call("b", "c")]);
    let right = batch(vec![call("b", "c"), call("a", "b")]);
    assert_eq!(left.canonical_id("repo"), right.canonical_id("repo"));
    assert_ne!(left.canonical_id("repo"), with_environment(right, "prod").canonical_id("repo"));
}

#[test]
fn evidence_selector_defaults_to_static() {
    assert_eq!(EvidenceSelector::default(), EvidenceSelector::Static);
}
```

- [x] **Step 2: Run the tests and verify missing types fail**

Run: `cargo test -p cgrx-core --test runtime_evidence`

Expected: compilation fails because `cgrx_core::runtime_evidence` does not exist.

- [x] **Step 3: Implement exact normalized types and bounds**

```rust
pub const MAX_TRACE_BYTES: usize = 4 * 1024 * 1024;
pub const MAX_TRACE_SPANS: usize = 100_000;
pub const MAX_TRACE_CALLS: usize = 100_000;

#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum EvidenceSelector { #[default] Static, Observed, All }

#[derive(Clone, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
pub struct RuntimeEndpoint {
    pub function: String,
    pub file: Option<String>,
    pub line: Option<u32>,
}

#[derive(Clone, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
pub struct NormalizedObservation {
    pub caller: RuntimeEndpoint,
    pub callee: RuntimeEndpoint,
    pub observed_at_unix_nanos: u64,
    pub count: u64,
}
```

Validate revision length/hex, nonempty bounded names/environment, positive count,
valid lines, and total count using checked or saturating arithmetic. Sort and
merge identical normalized observations before hashing canonical JSON with the
existing `canonical_hash` helper.

- [x] **Step 4: Run core tests**

Run: `cargo test -p cgrx-core`

Expected: all core unit and integration tests pass.

- [x] **Step 5: Commit the contract**

```bash
git add crates/cgrx-core/src/lib.rs crates/cgrx-core/src/runtime_evidence.rs crates/cgrx-core/tests/runtime_evidence.rs
git commit -m "feat: define runtime evidence contract"
```

### Task 2: Crash-safe observation store

**Files:**
- Create: `crates/cgrx-store/src/observations.rs`
- Modify: `crates/cgrx-store/src/lib.rs`
- Test: `crates/cgrx-store/tests/observations.rs`

**Interfaces:**
- Consumes: `NormalizedBatch`, `Hash32`, `RepoSnapshot`.
- Produces: `ObservationStore::open(root)`, `publish(resolved_batch)`, `status(revision)`, `load(revision)`, and `prune_before(unix_seconds, dry_run)`.
- Produces: `ResolvedObservation`, `ResolvedBatch`, `ObservationSnapshot`, `ObservationStatus`, and `PruneReport`.

- [x] **Step 1: Write failing idempotency and old-or-new publication tests**

```rust
#[test]
fn repeated_batch_is_a_byte_stable_no_op() {
    let first = store.publish(batch()).unwrap();
    let before = snapshot_bytes(&root);
    let second = store.publish(batch()).unwrap();
    assert_eq!(first.batch_id, second.batch_id);
    assert!(second.duplicate);
    assert_eq!(before, snapshot_bytes(&root));
}

#[test]
fn invalid_snapshot_never_hides_static_generation() {
    corrupt_revision_snapshot(&root);
    assert!(store.load(REVISION).is_err());
    assert!(GenerationReader::open(&root).is_ok());
}
```

- [x] **Step 2: Verify the store tests fail before implementation**

Run: `cargo test -p cgrx-store --test observations`

Expected: compilation fails because `ObservationStore` is missing.

- [x] **Step 3: Implement append-only batches and atomic revision snapshots**

Use `.cgrx/observations/{batches,by-revision,quarantine}`. Reuse the same
repository writer-lock implementation through a crate-private shared helper.
Write with `create_new`, `sync_all`, directory sync, and same-filesystem rename.
Validate schema version, revision, snapshot identity, canonical batch ID, and
content hash on every read.

- [x] **Step 4: Add crash injection at batch fsync, snapshot fsync, and rename**

```rust
pub enum ObservationCrashSite {
    BatchFsynced,
    SnapshotFsynced,
    SnapshotRenamed,
}
```

Each subprocess trial must observe the old complete snapshot or the new complete
snapshot. A partial batch may remain unreferenced and is cleaned during the next
writer entry.

- [x] **Step 5: Run store and crash tests**

Run: `cargo test -p cgrx-store --test observations && cargo test -p cgrx-store --test crash_injection`

Expected: all tests pass.

- [x] **Step 6: Commit the store**

```bash
git add crates/cgrx-store/src/lib.rs crates/cgrx-store/src/observations.rs crates/cgrx-store/tests/observations.rs tests/crash_injection.rs
git commit -m "feat: persist runtime observations safely"
```

### Task 3: OTLP/NDJSON parsing, symbol resolution, and fused traversal

**Files:**
- Create: `crates/cgrx-cli/src/runtime/observations.rs`
- Modify: `crates/cgrx-cli/src/runtime.rs`
- Modify: `crates/cgrx-cli/src/lib.rs`
- Test: `crates/cgrx-cli/tests/runtime_evidence.rs`

**Interfaces:**
- Consumes: core observation types, `BaseGraph`, `RepoSnapshot`, and `ObservationStore`.
- Produces: `Runtime::import_runtime_evidence(request) -> Result<ImportReport, RuntimeError>`.
- Produces: `Runtime::runtime_evidence_status() -> Result<RuntimeEvidenceStatus, RuntimeError>`.
- Produces: evidence-aware `trace_path_with_evidence` and `find_usages_with_evidence` methods.

- [x] **Step 1: Write four-language resolution fixtures**

Create one indexed project containing `.go`, `.ts`, `.tsx`, `.py`, and `.rs`
callables. Feed observations with runtime-style qualified names and assert exact
source/target node IDs and `path_line`, `path_fqn`, or `fqn` resolution.

```rust
assert_eq!(report.accepted, 5);
assert_eq!(report.ambiguous, 1);
assert_eq!(report.unresolved, 1);
assert!(report.gaps.iter().any(|gap| gap.code == "runtime_ambiguous"));
```

- [x] **Step 2: Add OTLP privacy and hierarchy tests**

Construct `resourceSpans/scopeSpans/spans` with a parent-child pair, code
attributes, URL, SQL, arguments, stack trace, and raw trace IDs. Assert the
normalized batch contains only allowed fields and serialized store bytes contain
none of the forbidden values.

- [x] **Step 3: Run the focused tests and verify failure**

Run: `cargo test -p cgrx-cli --test runtime_evidence`

Expected: compilation fails because runtime observation methods are missing.

- [x] **Step 4: Implement bounded parsers**

Read at most `MAX_TRACE_BYTES + 1`; detect NDJSON versus OTLP top-level JSON;
decode only known scalar attributes; enforce 100,000 span/call caps before
allocation growth; hash trace/span IDs immediately and discard raw values.

- [x] **Step 5: Implement fail-closed endpoint resolution**

Build deterministic indexes by canonical path and span, qualified name, and
terminal name. Apply the five-stage resolution order from the spec. A stage with
multiple candidates returns an ambiguity and does not continue to a weaker
stage. Verify node path hashes belong to the requested generation before
publishing the resolved batch.

- [x] **Step 6: Implement fused traversal without changing static arcs**

For `Static`, call the existing traversal unchanged. For `Observed`, traverse
only active-revision resolved observations. For `All`, union by `(source,target)`
and label each result `observed` or `static+observed`. Keep deterministic ordering
and apply depth/limit after evidence fusion; return independent truncation and
runtime-gap metadata.

- [x] **Step 7: Run runtime and regression tests**

Run: `cargo test -p cgrx-cli --test runtime_evidence && cargo test -p cgrx-cli --test runtime && cargo test -p cgrx-retrieval`

Expected: all tests pass; existing static traversal snapshots remain unchanged.

- [x] **Step 8: Commit parsing and fusion**

```bash
git add crates/cgrx-cli/src/lib.rs crates/cgrx-cli/src/runtime.rs crates/cgrx-cli/src/runtime/observations.rs crates/cgrx-cli/tests/runtime_evidence.rs
git commit -m "feat: fuse observed runtime call paths"
```

### Task 4: CLI lifecycle

**Files:**
- Modify: `crates/cgrx-cli/src/main.rs`
- Test: `crates/cgrx-cli/tests/cli.rs`
- Modify: `README.md`

**Interfaces:**
- Consumes: runtime import/status and store prune interfaces.
- Produces: `cgrx observe import`, `cgrx observe status`, and `cgrx observe prune`.

- [x] **Step 1: Write real-binary CLI tests**

Assert missing `--input`, missing revision, traversal paths, over-limit files,
duplicate imports, JSON status, dry-run prune, and real prune. Verify every error
exits 2 and leaves observation hashes unchanged.

- [x] **Step 2: Run the CLI tests and verify unknown command failure**

Run: `cargo test -p cgrx-cli --test cli observe_ -- --nocapture`

Expected: tests fail with `unknown command observe`.

- [x] **Step 3: Implement strict argument parsing and JSON reports**

Accept only the exact flags in the spec. `--format auto` supports `ndjson` and
`otlp-json`. Canonicalize `--root`, accept stdin only for `--input -`, and emit a
single JSON object under `--json`. Prune requires `--dry-run` unless `--apply` is
present, with the two flags mutually exclusive.

- [x] **Step 4: Run CLI and full cgrx-cli tests**

Run: `cargo test -p cgrx-cli --test cli && cargo test -p cgrx-cli`

Expected: all tests pass.

- [x] **Step 5: Commit CLI lifecycle**

```bash
git add crates/cgrx-cli/src/main.rs crates/cgrx-cli/tests/cli.rs README.md
git commit -m "feat: import runtime evidence from the CLI"
```

### Task 5: MCP ingestion and compact evidence selectors

**Files:**
- Modify: `crates/cgrx-mcp/src/tools.rs`
- Modify: `crates/cgrx-cli/src/main.rs`
- Modify: `crates/cgrx-cli/src/multi_repo.rs`
- Create: `crates/cgrx-cli/tests/mcp_runtime_evidence.rs`
- Modify: `scripts/smoke_mcp.py`

**Interfaces:**
- Produces: MCP tool `ingest_runtime_evidence`.
- Extends: `trace_path`, `find_usages`, `scan_risks`, `suggest_refactors`, and `orient` with optional `evidence`.
- Extends: `status` with compact runtime observation counts.

- [x] **Step 1: Write tool schema and routing tests**

Assert thirteen tools, a bounded `ingest_runtime_evidence` schema, `evidence`
enum values, required absolute `repo`, cross-repo isolation, and no inline trace
body property. Measure `model_visible_schema_json()` and set a reviewed maximum
equal to the current token count plus the measured ingestion schema cost.

- [x] **Step 2: Verify schema tests fail**

Run: `cargo test -p cgrx-mcp && cargo test -p cgrx-cli --test mcp_runtime_evidence`

Expected: tool count and missing ingestion method fail.

- [x] **Step 3: Add backend methods and dispatch**

```rust
fn ingest_runtime_evidence(
    &mut self,
    input_path: &str,
    format: &str,
    revision: Option<&str>,
    environment: Option<&str>,
) -> Result<Value, BackendError>;
```

Require `input_path` to resolve inside the repository or `.cgrx/imports`, pass
the canonical file to the runtime, and compact the report to bounded columns.

- [ ] **Step 4: Add evidence selector to routed query methods**

Parse with `EvidenceSelector`; invalid values fail before backend access. Add
runtime fields only for `observed`/`all` calls or nonzero status counts. Preserve
the exact serialized static response fixtures.

- [x] **Step 5: Run MCP tests and smoke**

Run: `cargo test -p cgrx-mcp && cargo test -p cgrx-cli --test mcp_runtime_evidence && cargo build -p cgrx-cli && python3 scripts/smoke_mcp.py target/debug/cgrx`

Expected: all tests pass and smoke reports `TOOLS=13`.

- [ ] **Step 6: Commit MCP support**

```bash
git add crates/cgrx-mcp/src/tools.rs crates/cgrx-cli/src/main.rs crates/cgrx-cli/src/multi_repo.rs crates/cgrx-cli/tests/mcp_runtime_evidence.rs scripts/smoke_mcp.py
git commit -m "feat: expose runtime evidence over MCP"
```

### Task 6: Impact, refactor, and agent-context integration

**Files:**
- Modify: `crates/cgrx-cli/src/runtime/risks.rs`
- Modify: `crates/cgrx-cli/src/runtime/refactors.rs`
- Modify: `crates/cgrx-cli/src/runtime.rs`
- Modify: `crates/cgrx-cli/tests/risk_explainability.rs`
- Modify: `crates/cgrx-cli/tests/refactor_strategies.rs`
- Modify: `crates/cgrx-cli/tests/runtime_evidence.rs`

**Interfaces:**
- Consumes: active-revision fused evidence view.
- Produces: `runtime_impacts`, observed entry-point preservation, observed future graph deltas, and reproducible agent handoff metadata.

- [ ] **Step 1: Write failing positive and negative integration tests**

Positive: a changed dynamically called target gets an informational runtime
impact and an observed entry point is preserved in all refactor strategies.
Negative: no observation must not create a dead-code claim, stale-revision
observations must not rank current risks, and ambiguous evidence must remain a
gap.

- [ ] **Step 2: Run focused integration tests and verify missing fields**

Run: `cargo test -p cgrx-cli --test risk_explainability runtime_ && cargo test -p cgrx-cli --test refactor_strategies observed_`

Expected: assertions fail because runtime integration fields are absent.

- [ ] **Step 3: Add runtime impacts and ranking**

Join changed current targets to observed incoming edges. Return them separately
from proven impacts, with count/last-seen/environment and `informational: true`.
Use runtime recency/count only as a stable tie-breaker after confirmed findings
and proven static impacts.

- [ ] **Step 4: Preserve runtime entry points in future graphs**

For every strategy, attach observed incoming edges to `preserve`; add the
selected evidence mode, revision, and environments to `agent_handoff`. Never put
an observed-only edge into a static `remove` set.

Compute deterministic `dynamic_hot_path`, `static_runtime_divergence`,
`high_runtime_blast_radius`, `refactor_priority`, and `next_action` signals from
integer-capped count, recency, caller, environment, and static-evidence inputs.
Return the formula inputs and stable reason code with each signal. Add repeated
run and input-permutation tests; no model or embedding dependency is allowed.

- [ ] **Step 5: Enrich orient under the existing budget**

When `evidence=all`, score nodes with both proven and observed evidence above
observed-only nodes. Pack observed-only records with source/target identities and
metadata but no source text. Charge their actual serialized tokens to the same
budget and emit a truncation gap when omitted.

- [ ] **Step 6: Run integration and workspace tests**

Run: `cargo test -p cgrx-cli --test risk_explainability && cargo test -p cgrx-cli --test refactor_strategies && cargo test -p cgrx-cli --test runtime_evidence`

Expected: all tests pass.

- [ ] **Step 7: Commit analysis integration**

```bash
git add crates/cgrx-cli/src/runtime.rs crates/cgrx-cli/src/runtime/risks.rs crates/cgrx-cli/src/runtime/refactors.rs crates/cgrx-cli/tests/risk_explainability.rs crates/cgrx-cli/tests/refactor_strategies.rs crates/cgrx-cli/tests/runtime_evidence.rs
git commit -m "feat: use runtime evidence in agent analysis"
```

### Task 7: TypeScript runtime overlay

**Files:**
- Modify: `crates/cgrx-cli/src/visualize.rs`
- Modify: `crates/cgrx-cli/tests/visualize_http.rs`
- Create: `crates/cgrx-cli/web/runtime-evidence.ts`
- Modify: `crates/cgrx-cli/web/app.js`
- Modify: `crates/cgrx-cli/web/index.html`
- Modify: `crates/cgrx-cli/web/styles.css`
- Create: `crates/cgrx-cli/web/tests/runtime-evidence.test.js`
- Modify: `crates/cgrx-cli/web/vendor-entry.ts`

**Interfaces:**
- Produces: `/api/runtime-status` and evidence/environment parameters on `/api/graph`.
- Produces: `RuntimeEvidenceController`, evidence-mode selector, environment filter, dashed observed edges, and unresolved diagnostic panel.

- [ ] **Step 1: Write failing HTTP and TypeScript tests**

Assert static/runtime/combined requests, invalid evidence mode, environment
escaping, bounded unresolved rows, log-scaled width, age opacity bounds, and
inspector provenance. Assert static mode serializes exactly as before.

- [ ] **Step 2: Run tests and verify missing endpoints/modules**

Run: `cargo test -p cgrx-cli --test visualize_http runtime_ && PATH=/opt/homebrew/opt/node@26/bin:$PATH npm test`

Expected: endpoint and module tests fail.

- [ ] **Step 3: Implement bounded HTTP adapters**

Parse `evidence=static|observed|all` and repeated environment values, call the
runtime fused graph view, and return runtime status with no raw trace fields.
Keep GET/HEAD-only behavior, loopback binding, CSP, and read-only source APIs.

- [ ] **Step 4: Implement the TypeScript controller and styles**

```ts
export type EvidenceMode = "static" | "observed" | "all";
export class RuntimeEvidenceController {
  setMode(mode: EvidenceMode): void;
  setEnvironments(values: readonly string[]): void;
  edgePresentation(edge: RuntimeEdge): { dash: string; width: number; opacity: number };
}
```

Use logarithmic width capped at 6px and age opacity in `[0.35, 1]`. Render all
labels with `textContent`. Refresh on snapshot change and cancel stale requests.

- [ ] **Step 5: Build and verify web assets on Node.js 26**

Run: `PATH=/opt/homebrew/opt/node@26/bin:$PATH npm ci && PATH=/opt/homebrew/opt/node@26/bin:$PATH npm run typecheck:web && PATH=/opt/homebrew/opt/node@26/bin:$PATH npm run build:web-vendor && PATH=/opt/homebrew/opt/node@26/bin:$PATH npm run verify:web-csp && PATH=/opt/homebrew/opt/node@26/bin:$PATH npm test`

Expected: typecheck, deterministic vendor build, CSP verification, and tests pass.

- [ ] **Step 6: Perform browser smoke**

Index a fixture, import runtime evidence, run `cgrx visualize --no-open`, and
verify Static, Runtime, and Combined modes; environment filtering; observed edge
inspection; unresolved diagnostics; and refresh after a new import.

- [ ] **Step 7: Commit visualization**

```bash
git add crates/cgrx-cli/src/visualize.rs crates/cgrx-cli/tests/visualize_http.rs crates/cgrx-cli/web
git commit -m "feat: visualize observed runtime paths"
```

### Task 8: Four-language benchmark, competitor comparison, and release proof

**Files:**
- Create: `contracts/runtime_evidence_v1.json`
- Create: `scripts/eval_runtime_evidence.py`
- Create: `scripts/test_eval_runtime_evidence.py`
- Create: `docs/benchmarks/runtime-evidence-2026-09-07.md`
- Modify: `README.md`
- Modify: `docs/reference-trace-mcp.md`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: installed or explicit CGRX and CBM binaries plus frozen fixture repositories.
- Produces: reproducible precision, recall, latency, token, storage, and compatibility report.

- [ ] **Step 1: Define a source-verified train/heldout contract**

Include at least 40 cases and at least eight per supported language, with positive
and negative runtime mappings. Pin repository revision and full-file hashes.
Record exact expected source/target symbol identities and expected gap codes.
Keep any inspected failure in training, never heldout.

- [ ] **Step 2: Write failing harness contract tests**

Assert minimum language counts, unique IDs, immutable revision/hash anchors,
three paired latency samples, untruncated results, exact edge sets, explicit
errors, and no aggregate-only acceptance.

- [ ] **Step 3: Implement real-binary evaluation**

Run clean isolated stores, import identical normalized observations into CGRX and
the installed CBM format adapter, query each engine, tokenize canonical responses
with the existing tokenizer path, and capture peak RSS and three warm latencies.
Never convert a failed or truncated result into an empty answer.

- [ ] **Step 4: Run evaluator tests and the measured benchmark**

Run: `python3 -m unittest scripts/test_eval_runtime_evidence.py && python3 scripts/eval_runtime_evidence.py --cgrx target/release/cgrx --cbm /absolute/verified/cbm-launcher --output target/runtime-evidence-report.json`

Expected: harness tests pass; report explicitly states each pass/fail gate and
the bounded scope. If CBM rejects the normalized task, record incompatibility
rather than inventing a comparison result.

- [ ] **Step 5: Document measured results and competitive limits**

Populate the benchmark document only from the generated report. Update the
comparison matrix with measured wins, ties, losses, input-format differences,
and exact commands. Do not claim universal superiority.

- [ ] **Step 6: Add deterministic gates to CI**

Run contract validation and evaluator unit tests on Ubuntu and macOS. Keep the
external CBM comparison as a reproducible release task unless its exact binary
and checksum are pinned in CI.

- [ ] **Step 7: Run complete verification**

Run: `PATH=/opt/homebrew/opt/node@26/bin:$PATH npm ci && PATH=/opt/homebrew/opt/node@26/bin:$PATH npm run typecheck:web && PATH=/opt/homebrew/opt/node@26/bin:$PATH npm run build:web-vendor && PATH=/opt/homebrew/opt/node@26/bin:$PATH npm run verify:web-csp && PATH=/opt/homebrew/opt/node@26/bin:$PATH npm test && cargo fmt --all -- --check && cargo clippy --locked --workspace --all-targets -- -D warnings && cargo test --locked --workspace && cargo build --locked --release -p cgrx-cli && python3 scripts/smoke_mcp.py target/release/cgrx`

Expected: every command passes and MCP smoke reports thirteen tools.

- [ ] **Step 8: Commit benchmark and documentation**

```bash
git add contracts/runtime_evidence_v1.json scripts/eval_runtime_evidence.py scripts/test_eval_runtime_evidence.py docs/benchmarks/runtime-evidence-2026-09-07.md README.md docs/reference-trace-mcp.md .github/workflows/ci.yml
git commit -m "test: benchmark runtime evidence fusion"
```

- [ ] **Step 9: Publish and verify**

Push the branch, create a PR linked to IBO-292, wait for Ubuntu/macOS CI, merge,
fast-forward primary `main`, build the merge commit, install it in a
content-addressed release directory, atomically update the launcher, and run the
post-install MCP smoke plus a real observation import/query. Record PR, merge
SHA, CI jobs, binary SHA-256, benchmark report, and remaining gates in Linear.
