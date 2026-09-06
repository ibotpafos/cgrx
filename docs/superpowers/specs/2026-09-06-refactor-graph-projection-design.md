# Refactor candidate discovery and graph projection

Date: 2026-09-06
Linear: IBO-282
Status: proposed for implementation

## Purpose

CGRX should find functions or methods that may benefit from consolidation and
show how the dependency graph could change after a conservative refactor. The
first version is advisory. It never edits source and never presents a projected
edge as an observed relationship.

The repository graph stays available through the existing managed runtime.
Before every analysis call, the backend refreshes changed, added, renamed and
deleted supported source files and rebuilds affected relationships. The
refactoring analyzer never owns a second persistent graph.

The feature answers three questions in one bounded response:

1. Which two implementations are structurally similar?
2. What current evidence makes them a useful refactoring candidate?
3. What hypothetical nodes and edges would an extract-shared-helper refactor
   add or preserve?

## Considered approaches

### Extend `scan_risks`

This keeps the advertised tool count unchanged, but combines two different
contracts. `scan_risks` compares working-tree changes with HEAD, while
refactoring discovery scans current code for future work. A shared mode would
make defaults, limits, evidence and completion semantics harder to understand.

### Add `suggest_refactors` (selected)

One focused read-only tool keeps discovery explicit and allows a compact
tabular response. It reuses current stored syntax documents, definitive graph
edges, scope filtering, snapshot identity and coverage reporting. The MCP schema
budget remains a release gate.

### General hypothetical graph language

A generic add/remove/rewire DSL could represent many refactors, but would need
language-aware rewrite semantics before its projections were trustworthy. It is
deferred until one conservative projection has measured value.

## Public contract

`suggest_refactors` accepts:

- `scope`: the existing bounded path and relation scope;
- `language`: optional `typescript | go | python | rust` filter;
- `min_score`: optional integer threshold with a conservative default;
- `limit`: 1 to 50 candidates.

Each candidate contains:

- the repository revision, working-tree digest and graph generation used for
  the analysis;
- two source symbols with repository-relative paths and exact definition/body
  spans;
- `kind: extract_shared_helper`;
- `confidence: candidate`;
- transparent similarity components rather than an unexplained risk score;
- shared definitive callees with their current evidence;
- disqualifiers and coverage gaps;
- a hypothetical graph projection;
- a short verification action.

The projection contains a deterministic virtual helper id and separate edge
sets:

- `preserve`: existing incoming edges to both entry points;
- `add`: each entry point calls the virtual helper;
- `move_to_helper`: shared outgoing calls that the common body may own;
- `remove`: empty in v1 because both entry points are preserved.

Every projection carries `status: hypothetical`. It is a planning model, not
a claim that an AST rewrite will compile.

Projection ids are snapshot-bound. A source edit that changes the working-tree
digest invalidates projections from the previous snapshot. The next call
recomputes candidates and projections from the refreshed graph.

## Candidate discovery

Only current `SYNTAX` documents with non-empty, bounded bodies participate.
Candidates are compared within the same language pack. TypeScript and TSX share
one pack. Generated, excluded, stale, parser-partial and out-of-scope paths are
reported or skipped through existing coverage rules.

The implementation creates two deterministic fingerprints per symbol:

1. a normalized lexical fingerprint from the body, with comments, whitespace,
   literal values and local identifier spelling reduced so formatting and
   renaming do not dominate;
2. a graph-neighborhood fingerprint from definitive outgoing `CALLS` and
   `IMPLEMENTS` targets.

Candidate generation uses fingerprint buckets before pairwise scoring, avoiding
an unrestricted all-pairs scan. Hard document, pair and evidence budgets set
`partial=true` with explicit codes when reached.

The score exposes its inputs:

- normalized-body token overlap;
- ordered structural-shingle overlap;
- definitive callee overlap;
- body-size compatibility.

Names are explanatory metadata and do not raise the score. Tiny accessors,
empty bodies, test fixtures and identical generated boilerplate must not become
high-confidence suggestions solely because they are short.

V1 emits a candidate only when body structure is strong and at least one
independent signal agrees: shared definitive callees or a sufficiently large
matching structural region. Missing graph edges reduce available evidence; they
never count as negative proof.

## Data flow

1. Refresh the managed runtime from the current working tree. A changed HEAD
   reopens the newly indexed generation through the existing managed path.
2. Resolve the requested scope against that exact revision-bound snapshot.
3. Select eligible syntax documents and read their already-indexed bodies.
4. Build bounded lexical and graph-neighborhood fingerprints.
5. Generate and score candidate pairs deterministically.
6. Attach exact current graph evidence and relevant coverage gaps.
7. Construct an `extract_shared_helper` virtual projection bound to the
   snapshot.
8. Sort by score components, then path/span identity, and truncate honestly.
9. Return full structured JSON and a compact model-visible table.

The analysis belongs in a dedicated runtime module. MCP registration, compact
response shaping and schema metadata stay in the existing tool adapter. The
core stored graph format does not change in the first slice.

## Failure and uncertainty handling

- Ambiguous or unproven relationships remain absent from shared-callee evidence
  and surface through coverage gaps.
- Unreadable or stale bodies exclude the affected pair.
- Budget exhaustion returns partial results and a specific gap code.
- A candidate never uses `proven` confidence; only its cited current edges can
  be proven.
- No projected node or edge is persisted in the index.
- Supplying or expanding a projection against another snapshot fails stale
  rather than silently reusing the previous graph.
- Empty results mean no candidate crossed the configured threshold within the
  inspected scope. They do not prove the repository has no duplication.

## Evaluation

Unit fixtures cover positive and negative pairs for `.ts`, `.tsx`, `.go`,
`.py` and `.rs`. Required negatives include same-name/different-behavior,
tiny wrappers, shared callee/different-control-flow, formatting-only similarity,
dynamic calls and parser gaps.

A golden projection test verifies deterministic virtual ids and exact
preserve/add/move/remove sets. Schema and response budgets remain below their
existing limits.

A watcher test edits one participating implementation without restarting the
server and verifies that the working-tree digest changes, old projection ids
are rejected, and the next `suggest_refactors` call reflects the refreshed
nodes and edges. Add, delete, rename and committed-HEAD transitions use the same
managed refresh path and receive bounded integration coverage.

The seven-project frozen corpus provides a labeled review sample. For every
project, reviewers record useful, false-positive or uncertain. The first
accuracy claim requires:

- no regression in the existing relationship evaluator;
- zero known unsafe `remove` projections;
- per-language positive and negative coverage;
- reported precision with sample size and unresolved cases;
- p95 runtime and response-token cost;
- unchanged network-denied and metadata-only telemetry guarantees.

## Deferred work

Patch generation, automatic application, API-merging projections, class-level
refactors, cross-language candidates, embeddings and merge-blocking quality
gates are separate slices. They depend on the read-only evaluator demonstrating
useful precision and acceptable cost.
