# CGRX Evidence Graph Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ship a local graph explorer that visualizes current evidence and three snapshot-bound refactor futures, while returning the identical structured plan to coding agents through `suggest_refactors`.

**Architecture:** Extend the existing runtime with deterministic strategy derivation and a bounded graph-view projection. Add a read-only loopback HTTP server to the CLI and embed a dependency-free SVG frontend in the binary. Keep current, uncertain, hypothetical, and not-run evidence distinct at every layer.

**Tech Stack:** Rust workspace, `serde_json`, standard-library TCP/HTTP, embedded HTML/CSS/JavaScript, SVG, Node.js 26 built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-06-evidence-graph-explorer-design.md`

## Global Constraints

- Work only in `/Volumes/D/Projects/cgrx-opensource/.worktrees/ibo-289-graph-explorer` on `feat/ibo-289-graph-explorer`.
- Use an isolated checkout-local `CARGO_TARGET_DIR=/Volumes/D/Projects/cgrx-opensource/.worktrees/ibo-289-graph-explorer/target-ibo-289`.
- Keep `suggest_refactors` as the existing MCP tool; the model-visible tool count must remain 11 and schema cost at or below 2,000 tokens.
- Treat current `CALLS` and `IMPLEMENTS` arcs as proven only when they carry current indexed evidence. Treat refactor deltas as hypothetical and candidate tests as `not_run`.
- Any coverage, truncation, public-surface, or unresolved-dispatch gap blocks a node-removal strategy.
- Bind the visualizer only to `127.0.0.1`; accept only GET and HEAD; require a per-process capability token for every `/api/` request.
- Keep graph requests bounded: default depth 1, 80 nodes, 160 edges; maximum depth 4 and 500 nodes, with explicit totals, truncation, partial state, and gaps.
- Use Node.js 26 for browser-module tests. The released executable must not require Node at runtime.
- Keep IBO-289 current with verification, commits, PR, and remaining release gates.

---

## Task 1: Derive three deterministic refactor strategies

**Files:**
- Create: `crates/cgrx-cli/src/runtime/refactors/strategies.rs`
- Modify: `crates/cgrx-cli/src/runtime/refactors.rs`
- Test: `crates/cgrx-cli/tests/refactor_strategies.rs`

- [x] **Step 1: Add a failing positive contract test**

Create a two-function TypeScript fixture with a shared callee. Call `Runtime::suggest_refactors` and assert that the first candidate has exactly these policies in order:

```rust
assert_eq!(policies, [
    "preserve_entrypoints",
    "canonical_entrypoint",
    "consolidate",
]);
assert_eq!(strategies[0]["recommended"], true);
assert_eq!(strategies[0]["risk"], "low");
assert_eq!(strategies[0]["verification"]["execution_status"], "not_run");
```

Run:

```bash
CARGO_TARGET_DIR=target-ibo-289 cargo test -p cgrx-cli --test refactor_strategies positive_candidate_has_three_snapshot_bound_strategies
```

Expected: FAIL because `strategies` is absent.

- [x] **Step 2: Implement typed strategy derivation**

Move projection-policy construction into `runtime/refactors/strategies.rs`. Define private serializable structs or deterministic `Value` builders for:

```text
StrategyPolicy = preserve_entrypoints | canonical_entrypoint | consolidate
StrategyStatus = hypothetical | blocked_by_gaps
GraphDelta = preserve + add + redirect + move_to_helper + remove
AgentHandoff = objective + constraints + ordered_steps + acceptance
```

Expose one module function to `refactors.rs`:

```rust
pub(super) fn derive_strategies(
    candidate: &RefactorCandidate<'_>,
    projection: &Value,
    snapshot: &RepoSnapshot,
    coverage_gaps: &[Value],
    partial: bool,
) -> Vec<Value>;
```

Derive every `strategy_id` from the full snapshot identity, candidate identity, and policy using the existing canonical hash utilities. Preserve entry points is recommended and low risk. Canonical entry point redirects only proven internal callers and retains a wrapper when removal is uncertain. Consolidate may contain a removal only when all explicit preconditions pass.

- [x] **Step 3: Add blocked-removal tests**

Cover each blocker independently: partial result, truncated evidence, dynamic dispatch gap, parser/stale gap, and unknown external/public surface. Assert `status == "blocked_by_gaps"`, non-empty `blocking_gaps`, and an empty `graph_delta.remove`.

Run:

```bash
CARGO_TARGET_DIR=target-ibo-289 cargo test -p cgrx-cli --test refactor_strategies
```

Expected: PASS.

- [x] **Step 4: Add stability and payload tests**

Assert deterministic ordering, stable ids for the same snapshot, changed ids after a source edit, no source body in `agent_handoff`, and identical graph delta references between the legacy `projection` and recommended strategy.

Run:

```bash
CARGO_TARGET_DIR=target-ibo-289 cargo test -p cgrx-cli refactor
```

Expected: PASS.

- [x] **Step 5: Commit the strategy slice**

```bash
git add crates/cgrx-cli/src/runtime/refactors.rs crates/cgrx-cli/src/runtime/refactors/strategies.rs crates/cgrx-cli/tests/refactor_strategies.rs
git commit -m "feat: add refactor strategy paths"
```

---

## Task 2: Add a bounded evidence graph view

**Files:**
- Create: `crates/cgrx-cli/src/runtime/graph_view.rs`
- Modify: `crates/cgrx-cli/src/runtime.rs`
- Test: `crates/cgrx-cli/tests/graph_view.rs`

- [x] **Step 1: Write a failing focused-view test**

Index a fixture with two callers, one selected function, two callees, and one related test. Call:

```rust
runtime.graph_view(GraphViewRequest {
    symbol: "selected".into(),
    path: Some("src/service.ts".into()),
    direction: GraphDirection::Both,
    depth: 1,
    scope: Scope::default(),
    node_limit: 80,
    edge_limit: 160,
})
```

Assert deterministic lanes `callers`, `entrypoints`, `callees`, `tests`; stable node order; explicit relation/evidence fields; snapshot envelope; totals; `partial`; and `coverage_gaps`.

Run:

```bash
CARGO_TARGET_DIR=target-ibo-289 cargo test -p cgrx-cli --test graph_view focused_view_orders_semantic_lanes
```

Expected: FAIL because the API does not exist.

- [x] **Step 2: Implement the public request types and runtime method**

Export from `cgrx_cli`:

```rust
pub enum GraphDirection { Callers, Callees, Both }

pub struct GraphViewRequest {
    pub symbol: String,
    pub path: Option<String>,
    pub direction: GraphDirection,
    pub depth: u8,
    pub scope: Scope,
    pub node_limit: usize,
    pub edge_limit: usize,
}
```

Implement `Runtime::graph_view(request) -> Result<Value, RuntimeError>` from stored syntax documents and definitive arcs. Resolve ambiguity exactly like `trace_path`. Sort by lane, path, span, node id. Include source identity and evidence metadata, but no source body. Attach file/module container ids without inventing semantic relationships.

- [x] **Step 3: Enforce bounds and uncertainty**

Reject depth outside `1..=4`, node limits outside `1..=500`, and edge limits outside `1..=500`. When a frontier or result cap is hit, set `partial=true`, return uncapped totals where known, and add typed budget gaps. Do not infer missing edges from graph absence.

- [x] **Step 4: Cover every supported language pack**

Add deterministic fixtures for TypeScript/TSX, Go, Python, and Rust. Verify current relation fields and symbol identity. Add negative tests for ambiguous symbols, missing symbols, out-of-scope paths, parser gaps, and a capped graph.

Run:

```bash
CARGO_TARGET_DIR=target-ibo-289 cargo test -p cgrx-cli --test graph_view
```

Expected: PASS.

- [x] **Step 5: Commit the graph-view slice**

```bash
git add crates/cgrx-cli/src/runtime.rs crates/cgrx-cli/src/runtime/graph_view.rs crates/cgrx-cli/tests/graph_view.rs
git commit -m "feat: add bounded evidence graph views"
```

---

## Task 3: Add the secure local visualization server

**Files:**
- Create: `crates/cgrx-cli/src/visualize.rs`
- Create: `crates/cgrx-cli/src/visualize/http.rs`
- Create: `crates/cgrx-cli/src/visualize/assets.rs`
- Modify: `crates/cgrx-cli/src/main.rs`
- Test: `crates/cgrx-cli/tests/visualize_http.rs`

- [x] **Step 1: Add failing CLI and authorization tests**

Spawn `cgrx visualize --root <fixture> --port 0 --no-open`, read one structured startup line, and assert it contains loopback origin plus a URL-fragment token. Exercise:

```text
GET /                 -> 200 with CSP and no-store
GET /api/status       -> 401 without X-CGRX-Token
GET /api/status       -> 200 with the token
POST /api/status      -> 405
oversized request     -> 413
```

Run:

```bash
CARGO_TARGET_DIR=target-ibo-289 cargo test -p cgrx-cli --test visualize_http starts_on_loopback_and_requires_capability
```

Expected: FAIL because `visualize` is unknown.

- [x] **Step 2: Parse the CLI command**

Add `visualize` to command help and dispatch. Accept `--root`, `--port 0..=65535`, and `--no-open`. Canonicalize the repository through the existing managed-runtime path before binding. Reject extra positional arguments and non-loopback bind configuration.

- [x] **Step 3: Implement a bounded standard-library HTTP loop**

Use `TcpListener::bind((Ipv4Addr::LOCALHOST, port))`. Read at most 8 KiB of request headers, set read/write timeouts, process one request per connection, and close it. Accept GET and HEAD only. Percent-decode query values with strict malformed-escape rejection. Return JSON errors with CGRX codes and omit response bodies for HEAD.

Generate 32 random bytes from the operating system random source and hex-encode them. Fail closed if secure randomness is unavailable. Open `http://127.0.0.1:<port>/#token=<hex>` with `open` on macOS or `xdg-open` on Linux unless `--no-open` is set. Never log the token separately or include it in telemetry.

- [x] **Step 4: Route read-only APIs**

Implement:

```text
/api/status
/api/search?q=&scope=&limit=
/api/graph?symbol=&path=&direction=&depth=&node_limit=&edge_limit=
/api/refactors?scope=&language=&min_score=&limit=
/api/snippet?symbol=&path=
```

Before each API call, refresh the managed runtime through the same state/revision path used by the MCP backend. Return `snapshot`, typed errors, bounded data, `partial`, and gaps. Require `X-CGRX-Token` for every `/api/` path.

- [x] **Step 5: Complete HTTP boundary tests**

Test malformed query encoding, missing arguments, invalid bounds, path traversal, ambiguous symbols, HEAD behavior, asset MIME types, CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and `Cache-Control: no-store`. Verify the listener address is always loopback.

Run:

```bash
CARGO_TARGET_DIR=target-ibo-289 cargo test -p cgrx-cli --test visualize_http
```

Expected: PASS.

- [x] **Step 6: Commit the server slice**

```bash
git add crates/cgrx-cli/src/main.rs crates/cgrx-cli/src/visualize.rs crates/cgrx-cli/src/visualize crates/cgrx-cli/tests/visualize_http.rs
git commit -m "feat: serve the local graph explorer"
```

---

## Task 4: Build the deterministic SVG explorer

**Files:**
- Create: `crates/cgrx-cli/web/index.html`
- Create: `crates/cgrx-cli/web/styles.css`
- Create: `crates/cgrx-cli/web/layout.js`
- Create: `crates/cgrx-cli/web/state.js`
- Create: `crates/cgrx-cli/web/app.js`
- Create: `crates/cgrx-cli/web/tests/layout.test.js`
- Create: `crates/cgrx-cli/web/tests/state.test.js`
- Create: `package.json`
- Modify: `crates/cgrx-cli/src/visualize/assets.rs`

- [x] **Step 1: Create failing Node.js 26 layout tests**

Use `node:test` and `node:assert/strict`. Cover stable lane positions, file-container grouping, preserved coordinates for the same identity, bounded viewport fitting, and the four edge styles:

```text
proven=current solid/check
gap=uncertain dashed/question
hypothetical=added dotted/plus
preserved=current grey
```

Run:

```bash
npm test
```

Expected: FAIL because modules are absent.

- [x] **Step 2: Implement pure layout and state modules**

`layout.js` must accept graph JSON and return deterministic SVG coordinates sorted by lane/path/span/id. `state.js` must own mode, selected identity, strategy id, camera, freshness, and request generation. A changed snapshot must clear hypothetical overlays and abort or ignore older responses.

- [x] **Step 3: Build the accessible application shell**

Create a three-part layout: repository/search header, SVG graph canvas, and evidence inspector. Add Current, Changes, Refactor Preview, and Compare modes. Render text labels, shape markers, keyboard focus, accessible node/edge names, pan, zoom, drag, pin, reset, and responsive narrow-screen panels.

- [x] **Step 4: Render evidence without overstating certainty**

Show path, symbol, span, source hash, resolver, confidence, snapshot, assumptions, counter-evidence, and coverage gaps. Fetch snippets only after explicit node selection. Mark every candidate test `not run`; never style it as passed. Surface truncation and stale data visibly.

- [x] **Step 5: Embed and serve frontend assets**

Use `include_str!` in `visualize/assets.rs` for all five assets. Serve fixed paths only; do not map request paths to the filesystem. Keep scripts as ES modules and CSP-compatible without inline script or style.

Run:

```bash
node --version
npm test
CARGO_TARGET_DIR=target-ibo-289 cargo test -p cgrx-cli --test visualize_http serves_embedded_assets_with_security_headers
```

Expected: Node reports `v26.x`; all tests PASS.

- [x] **Step 6: Commit the frontend slice**

```bash
git add package.json crates/cgrx-cli/web crates/cgrx-cli/src/visualize/assets.rs
git commit -m "feat: add the SVG graph explorer"
```

---

## Task 5: Connect live refactor comparison and agent handoff

**Files:**
- Modify: `crates/cgrx-cli/web/app.js`
- Modify: `crates/cgrx-cli/web/state.js`
- Modify: `crates/cgrx-cli/web/styles.css`
- Modify: `crates/cgrx-cli/web/tests/state.test.js`
- Modify: `crates/cgrx-cli/tests/visualize_http.rs`
- Test: `crates/cgrx-cli/tests/visualize_refresh.rs`

- [x] **Step 1: Add failing stale-projection and copy tests**

Assert that a snapshot change clears `strategy_id`, ignores an older graph response, preserves the selected node only if the identity still exists, and serializes Copy agent plan as the exact `agent_handoff` object returned by `/api/refactors`.

Run:

```bash
npm test
```

Expected: FAIL until live state transitions are connected.

- [x] **Step 2: Connect candidate and strategy navigation**

Load top refactor candidates on the landing view. Selecting a candidate must display all three strategy tabs in server order. Overlay only the selected `graph_delta`, with removals and redirects conditional on strategy status. Compare mode uses synchronized view transforms while retaining separate current/future semantics.

- [x] **Step 3: Implement copy actions**

Copy agent plan writes canonical pretty JSON for `agent_handoff`. Copy MCP call writes a valid `suggest_refactors` argument object containing the current scope/language/min-score/limit and the snapshot used to choose the candidate as a revalidation constraint. Announce copy success through an ARIA live region.

- [x] **Step 4: Implement compact live refresh**

Poll `/api/status` only. On revision, digest, or graph-generation change, mark the old view stale, clear projections, refetch current selection, and restore camera/selection when identity survives. Do not poll snippets or whole graphs in the background.

- [x] **Step 5: Verify refresh against a real managed fixture**

Start the server once, fetch a strategy, edit a participating source file, and poll status until the digest changes. Assert the next refactor response has different strategy ids and the prior strategy is absent. Repeat for add, delete, and rename transitions within bounded fixtures.

Run:

```bash
CARGO_TARGET_DIR=target-ibo-289 cargo test -p cgrx-cli --test visualize_refresh
npm test
```

Expected: PASS.

- [x] **Step 6: Commit the connected workflow**

```bash
git add crates/cgrx-cli/web crates/cgrx-cli/tests/visualize_http.rs crates/cgrx-cli/tests/visualize_refresh.rs
git commit -m "feat: connect refactor previews and agent handoff"
```

---

## Task 6: Document, validate, and prepare the release

**Files:**
- Modify: `README.md`
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/superpowers/specs/2026-09-06-evidence-graph-explorer-design.md`
- Modify: `docs/superpowers/plans/2026-09-06-evidence-graph-explorer.md`

- [x] **Step 1: Add user and agent documentation**

Document `cgrx visualize --root <repo>`, fixed/automatic ports, `--no-open`, the four modes, evidence legend, progressive bounds, strategy meanings, `blocked_by_gaps`, copy actions, Node runtime boundary, privacy, and failure behavior. Change design status from proposed to implemented only after verification passes.

- [x] **Step 2: Add Node.js 26 CI validation**

Pin the frontend job/setup action to Node 26 and run `npm test`. Keep existing Linux and macOS Rust jobs. Do not introduce a frontend dependency install step beyond the package script because the browser code has no external packages.

- [x] **Step 3: Run focused and workspace verification**

```bash
cargo fmt --all -- --check
CARGO_TARGET_DIR=target-ibo-289 cargo clippy --workspace --all-targets --all-features -- -D warnings
CARGO_TARGET_DIR=target-ibo-289 cargo test --workspace
node --version
npm test
CARGO_TARGET_DIR=target-ibo-289 cargo build --release -p cgrx-cli
```

Expected: Node is `v26.x`; every command exits 0.

- [x] **Step 4: Run contract and budget gates**

```bash
CARGO_TARGET_DIR=target-ibo-289 cargo run -q -p cgrx-cli -- schema --json
CARGO_TARGET_DIR=target-ibo-289 cargo test -p cgrx-cli schema
CARGO_TARGET_DIR=target-ibo-289 cargo test -p cgrx-cli --test visualize_http
```

Assert 11 MCP tools, schema cost at or below 2,000 tokens, no mutation endpoint, successful stdio MCP initialize/tools-list/status smoke, and no source/query/token fields in usage telemetry.

- [x] **Step 5: Inspect the browser on desktop and narrow layouts**

Launch the release binary against the CGRX repository with an automatic port. Verify search, semantic lanes, node and edge inspector, Current/Changes/Refactor Preview/Compare, all three strategies, blocked removals, pan/zoom/reset, keyboard navigation, copy payloads, stale refresh, and narrow layout. Record screenshots or concise observed evidence without treating the visual check as compiler/test proof.

- [x] **Step 6: Verify implementation coverage and risk candidates**

Run CGRX `status`, structural search/trace/snippet, `check_index_coverage` for every changed Rust source path, and `scan_risks(mode=changes)`. Validate each risk candidate against exact source and test/compiler output. Record remaining graph gaps as uncertainty, not repository bugs.

- [x] **Step 7: Commit docs and CI**

```bash
git add README.md .github/workflows/ci.yml docs/superpowers/specs/2026-09-06-evidence-graph-explorer-design.md docs/superpowers/plans/2026-09-06-evidence-graph-explorer.md
git commit -m "docs: document the evidence graph explorer"
```

- [x] **Step 8: Prepare review and release evidence**

Push the branch, open a PR linked to IBO-289, wait for Linux/macOS CI, and update the issue with commits, verification, screenshots, and remaining release gates. After merge, create the next prerelease tag, install the exact merged artifact behind the existing reversible launcher, smoke the installed binary and visualizer, and retain the previous launcher as rollback.
