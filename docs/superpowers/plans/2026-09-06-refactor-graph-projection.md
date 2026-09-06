# Refactor Graph Projection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only `suggest_refactors` tool that finds structurally similar functions across every supported CGRX language and returns a snapshot-bound hypothetical extract-helper graph projection.

**Architecture:** A focused `runtime/refactors.rs` module derives bounded lexical fingerprints and definitive graph-neighborhood sets from the live stored graph. `RuntimeMcpBackend` refreshes the managed graph before each request, then the MCP adapter returns full evidence plus a compact candidate table.

**Tech Stack:** Rust, serde/serde_json, blake3, existing CGRX language packs and proof-carrying graph, JSON-RPC MCP, Python evaluation scripts.

**Spec:** `docs/superpowers/specs/2026-09-06-refactor-graph-projection-design.md`

## Global Constraints

- The first version is read-only and never changes source.
- Every projection has `status: hypothetical` and preserves both existing entry points.
- Only current definitive `CALLS` and `IMPLEMENTS` edges count as graph evidence.
- TypeScript and TSX share one language; other comparisons stay within Go, Python or Rust.
- Every call uses the refreshed revision, working-tree digest and graph generation.
- Candidate generation and evidence collection are bounded and report `partial=true` with explicit gap codes.
- The model-visible MCP schema remains at or below 2,000 o200k tokens.
- No push, pull request, merge or deployment is part of this plan.

---

### Task 1: Deterministic structural fingerprints

**Files:**
- Create: `crates/cgrx-cli/src/runtime/refactors.rs`
- Modify: `crates/cgrx-cli/src/runtime.rs:1-4`
- Test: `crates/cgrx-cli/src/runtime/refactors.rs`

**Interfaces:**
- Consumes: private parent-module `StoredDocument`, `StoredArc`, `RuntimeError`, and `pack_for_path`.
- Produces: `normalized_tokens(source: &str) -> Vec<String>`, `RefactorFingerprint`, and deterministic `Similarity` components.

- [ ] **Step 1: Add failing normalization and scoring tests**

Add tests proving renamed locals and changed literals retain the same structural shape, control-flow changes do not, and bodies below eight normalized tokens are ineligible:

```rust
#[test]
fn normalization_ignores_local_spelling_and_literal_values() {
    assert_eq!(
        normalized_tokens("fn a(x: i32) { let y = x + 1; save(y); }"),
        normalized_tokens("fn b(input: i32) { let result = input + 9; save(result); }")
    );
}

#[test]
fn ordered_shingles_distinguish_changed_control_flow() {
    let left = fingerprint_text("if ready { save(item); }");
    let right = fingerprint_text("while ready { save(item); }");
    assert!(jaccard(&left.shingles, &right.shingles) < 800);
}

#[test]
fn tiny_bodies_are_ineligible() {
    assert!(!fingerprint_text("return value").eligible);
}
```

- [ ] **Step 2: Run the new unit tests and verify failure**

Run: `cargo test -p cgrx-cli runtime::refactors::tests -- --nocapture`

Expected: compilation fails because the fingerprint helpers do not exist.

- [ ] **Step 3: Implement the bounded fingerprint types**

```rust
const MIN_BODY_TOKENS: usize = 8;
const SHINGLE_WIDTH: usize = 4;

#[derive(Clone, Debug, Eq, PartialEq)]
struct RefactorFingerprint {
    tokens: BTreeSet<String>,
    shingles: BTreeSet<String>,
    outgoing: BTreeSet<(RelationKind, u64)>,
    token_count: usize,
    eligible: bool,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
struct Similarity {
    body_tokens: u16,
    ordered_shingles: u16,
    callees: u16,
    size: u16,
    total: u16,
}

fn jaccard<T: Ord>(left: &BTreeSet<T>, right: &BTreeSet<T>) -> u16 {
    let union = left.union(right).count();
    if union == 0 { return 0; }
    ((left.intersection(right).count() * 1000) / union) as u16
}
```

The scanner retains punctuation and a fixed cross-language keyword set, maps quoted/numeric literals to `lit`, maps all other identifiers to `id`, and removes line/block comments. Build four-token ordered shingles. Calculate total as 35% body-token overlap, 35% ordered-shingle overlap, 20% callee overlap, and 10% body-size compatibility. All values use 0..=1000.

- [ ] **Step 4: Run unit tests**

Run: `cargo test -p cgrx-cli runtime::refactors::tests -- --nocapture`

Expected: PASS.

- [ ] **Step 5: Commit the fingerprint engine**

```sh
git add crates/cgrx-cli/src/runtime.rs crates/cgrx-cli/src/runtime/refactors.rs
git commit -m "feat: fingerprint refactor candidates"
```

### Task 2: Candidate discovery and hypothetical graph delta

**Files:**
- Modify: `crates/cgrx-cli/src/runtime/refactors.rs`
- Test: `crates/cgrx-cli/tests/runtime.rs`

**Interfaces:**
- Consumes: Task 1 `RefactorFingerprint` and `Similarity`.
- Produces:

```rust
impl Runtime {
    pub fn suggest_refactors(
        &self,
        scope: &Scope,
        language: Option<&str>,
        min_score: u16,
        limit: usize,
    ) -> Result<Value, RuntimeError>;
}
```

- [ ] **Step 1: Write failing supported-language and negative fixtures**

Add one committed repository fixture containing structurally matching functions for `.ts`, `.tsx`, `.go`, `.py` and `.rs`. Each pair calls the same proven `save*` target and differs in local names/literals. Add negative pairs for a tiny wrapper and same-name code with different control flow.

Assert for every positive pair:

```rust
assert_eq!(candidate["kind"], "extract_shared_helper");
assert_eq!(candidate["confidence"], "candidate");
assert_eq!(candidate["projection"]["status"], "hypothetical");
assert_eq!(candidate["projection"]["remove"], json!([]));
assert_eq!(candidate["projection"]["add"].as_array().unwrap().len(), 2);
assert_eq!(candidate["shared_callees"][0]["confidence"], "PROVEN");
```

Also assert deterministic ordering, invalid language rejection, `min_score` above 1000 rejection, and `limit` outside 1..=50 rejection.

- [ ] **Step 2: Run the focused integration test and verify failure**

Run: `cargo test -p cgrx-cli suggest_refactors -- --nocapture`

Expected: compilation fails because `Runtime::suggest_refactors` is missing.

- [ ] **Step 3: Implement bounded candidate generation**

Use:

```rust
const DOCUMENT_LIMIT: usize = 20_000;
const PAIR_LIMIT: usize = 100_000;
const EVIDENCE_LIMIT: usize = 2_000;
const DEFAULT_MIN_SCORE: u16 = 760;
```

Select current `SYNTAX` documents in the requested scope. Use `pack_for_path(Path::new(&document.path)).id()` for language identity. Add each eligible document to a bucket for every structural shingle, compare documents that share at least one bucket, and deduplicate pair ids with `BTreeSet<(u64, u64)>`. Stop candidate generation at the pair budget and report the gap instead of silently sampling past it.

Emit only when:

```rust
fingerprints_are_eligible
    && similarity.total >= min_score
    && (similarity.callees > 0 || similarity.ordered_shingles >= 820)
```

Set `partial=true` with `REFACTOR_DOCUMENT_BUDGET`, `REFACTOR_PAIR_BUDGET`, or `REFACTOR_EVIDENCE_BUDGET` when a bound is hit.

- [ ] **Step 4: Implement snapshot-bound projections**

Hash canonical snapshot fields plus sorted pair node ids into `refactor1.<16 hex>`. Return `preserve` from definitive incoming edges, `add` as both entry points calling the helper, `move_to_helper` from the intersection of definitive outgoing targets, and empty `remove`. Sort every edge set by relation, path, span and node identity.

- [ ] **Step 5: Run focused tests**

Run: `cargo test -p cgrx-cli suggest_refactors -- --nocapture`

Expected: PASS for five extensions and all negative/validation cases.

- [ ] **Step 6: Commit runtime discovery**

```sh
git add crates/cgrx-cli/src/runtime/refactors.rs crates/cgrx-cli/tests/runtime.rs
git commit -m "feat: discover refactor graph candidates"
```

### Task 3: MCP contract and compact response

**Files:**
- Modify: `crates/cgrx-mcp/src/tools.rs`
- Modify: `crates/cgrx-cli/src/main.rs`
- Test: `tests/mcp_stdio.rs`
- Test: `tests/cli.rs`

**Interfaces:**
- Consumes: Task 2 `Runtime::suggest_refactors`.
- Produces:

```rust
fn suggest_refactors(
    &mut self,
    scope: Value,
    language: Option<&str>,
    min_score: u16,
    limit: u32,
) -> Result<Value, BackendError>;
```

- [ ] **Step 1: Add failing MCP schema and compact-response tests**

Require `suggest_refactors` in `tools/list`, validate language/minimum/limit schema constraints, and assert compact columns:

```rust
assert_eq!(
    visible["cols"],
    json!(["left", "right", "language", "score", "shared_callees", "projection_id"])
);
assert_eq!(visible["status"], "hypothetical");
```

- [ ] **Step 2: Run MCP tests and verify failure**

Run: `cargo test -p cgrx-mcp && cargo test --test mcp_stdio tools_list_advertises_bounded_graph_search_and_trace`

Expected: FAIL because the tool is not registered.

- [ ] **Step 3: Wire backend arguments and schema**

Add `SuggestRefactorsArguments` with defaults `min_score=760` and `limit=20`. Call `RuntimeMcpBackend::refresh()`, parse the existing graph scope, and invoke the runtime method. Register one schema with optional `language`, `min_score` 0..=1000, `scope`, and `limit` 1..=50.

- [ ] **Step 4: Add compact shaping**

`compact_refactors` deduplicates paths; emits the six asserted columns plus `at`, `status: hypothetical`, `n`, `gaps`, and `payload_tokens`; and adds `more=true` only for truncation. Calculate `payload_tokens` with the existing bundled `Tokenizer::o200k_base()` over the canonical compact payload before adding the telemetry field, so evaluators do not need a second tokenizer implementation.

- [ ] **Step 5: Run MCP and schema gates**

Run:

```sh
cargo test -p cgrx-mcp
cargo test --test mcp_stdio
cargo test --test cli schema_count_is_machine_readable_and_under_two_thousand_tokens
```

Expected: PASS and schema token count <= 2000.

- [ ] **Step 6: Commit MCP exposure**

```sh
git add crates/cgrx-mcp/src/tools.rs crates/cgrx-cli/src/main.rs tests/mcp_stdio.rs tests/cli.rs
git commit -m "feat: expose refactor suggestions over MCP"
```

### Task 4: Live graph refresh contract

**Files:**
- Modify: `tests/cli.rs`
- Modify: `scripts/smoke_mcp.py`

**Interfaces:**
- Consumes: Task 3 MCP `suggest_refactors`.
- Produces: watched-server E2E evidence that projections follow the live graph.

- [ ] **Step 1: Add a failing watched-server test**

Start `cgrx serve --state ... --watch-root ...`, request a candidate, edit one source body so the pair is no longer similar, then request again without restarting:

```rust
assert_ne!(before["snapshot"], after["snapshot"]);
assert_eq!(after["total"], 0);
```

Restore similarity, commit it, call through the same server and assert a changed snapshot plus a projection id different from the first response.

- [ ] **Step 2: Run the watcher test and verify failure**

Run: `cargo test --test cli watched_suggest_refactors_refreshes_projection_without_restart -- --nocapture`

Expected: FAIL until the MCP route exists.

- [ ] **Step 3: Complete watcher and smoke coverage**

Keep the tool on the normal backend refresh path. Extend `scripts/smoke_mcp.py` with matching Python functions and assert one hypothetical candidate, exact snapshot fields, empty remove set, and tool count 11.

- [ ] **Step 4: Run E2E tests**

```sh
cargo test --test cli watched_suggest_refactors_refreshes_projection_without_restart -- --nocapture
cargo build --release -p cgrx-cli
python3 scripts/smoke_mcp.py target/release/cgrx
```

Expected: watched refresh PASS; smoke reports `TOOLS=11` and `REFACTORS=1`.

- [ ] **Step 5: Commit live refresh coverage**

```sh
git add tests/cli.rs scripts/smoke_mcp.py
git commit -m "test: verify live refactor projections"
```

### Task 5: Frozen-corpus evaluator and documentation

**Files:**
- Create: `scripts/eval_refactors.py`
- Create: `contracts/refactor_candidates_v1.json`
- Create: `scripts/test_eval_refactors.py`
- Modify: `README.md`
- Modify: `docs/reference-trace-mcp.md`

**Interfaces:**
- Consumes: release stdio `suggest_refactors` and the seven repositories in `contracts/real_tasks_v1.json`.
- Produces: reproducible candidate inventory with response tokens and explicit review labels.

- [ ] **Step 1: Add failing evaluator integrity tests**

Test duplicate ids, unsafe paths, missing repositories, snapshot mismatch, truncation, unknown labels and malformed candidate rows. Accepted labels are `useful | false_positive | uncertain | unreviewed`.

- [ ] **Step 2: Run evaluator tests and verify failure**

Run: `python3 -m unittest scripts/test_eval_refactors.py`

Expected: import or validation failure because the evaluator does not exist.

- [ ] **Step 3: Implement the evaluator**

For each frozen repository, invoke the release MCP server with `min_score=760` and `limit=50`. Write deterministic JSON with project count, candidate count, reviewed count, label counts, the server-reported `payload_tokens`, nullable precision and rows. Do not calculate precision while any row is unreviewed; fail on truncation or snapshot mismatch.

- [ ] **Step 4: Add contract and documentation**

Check in seven canonical repo ids/scopes with initial labels `unreviewed`. Document candidate semantics, hypothetical status, live refresh and absence of automatic edits. Add the tool to the README table without claiming measured usefulness.

- [ ] **Step 5: Run evaluator and docs checks**

```sh
python3 -m unittest scripts/test_eval_refactors.py
python3 scripts/eval_refactors.py target/release/cgrx
git diff --check
```

Expected: PASS with seven projects and precision `null` until manual labels exist.

- [ ] **Step 6: Commit evaluator and docs**

```sh
git add scripts/eval_refactors.py scripts/test_eval_refactors.py contracts/refactor_candidates_v1.json README.md docs/reference-trace-mcp.md
git commit -m "test: evaluate refactor suggestions"
```

### Task 6: Full verification and issue evidence

**Files:**
- Modify only if verification reveals a defect in files from Tasks 1-5.
- Update: Linear IBO-282.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: a locally verified clean branch with explicit remaining gates.

- [ ] **Step 1: Run formatting, linting and full tests**

```sh
cargo fmt --all -- --check
cargo clippy --locked --workspace --all-targets -- -D warnings
cargo test --locked --workspace
```

Expected: PASS; report intentionally ignored release/special tests.

- [ ] **Step 2: Run release and product gates**

```sh
cargo build --locked --release -p cgrx-cli
python3 scripts/smoke_mcp.py target/release/cgrx
python3 scripts/eval_relationships.py target/release/cgrx
python3 scripts/eval_outlines.py target/release/cgrx
python3 scripts/validate_real_tasks.py
python3 scripts/validate_language_coverage.py
python3 scripts/eval_refactors.py target/release/cgrx
target/release/cgrx schema --count-tokens
```

Expected: existing relationship precision/recall 1.0, all frozen contracts valid, and schema <= 2000 tokens.

- [ ] **Step 3: Run dogfood risk and coverage checks**

Run status, search, trace, snippet, coverage and changes-risk tools through the installed CGRX MCP for every changed Rust/Python path. Read exact source for partial coverage. Treat scan findings as candidates.

- [ ] **Step 4: Update Linear and verify final tree**

Post commits, verification, corpus label state and remaining manual-review gate to IBO-282. Verify `git status --short` is clean. Do not push, open a PR, merge or deploy.
