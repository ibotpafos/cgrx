# CGRX Evidence Graph Explorer and Multi-Path Refactor Planning

Date: 2026-09-06
Issue: IBO-289
Status: proposed for user review

## Outcome

CGRX will provide a local, read-only graph explorer that lets a developer study
the current evidence graph, working-tree impact, and several possible future
graphs for each refactor candidate. The exact same snapshot-bound alternatives
will be returned to coding agents so that a selected path can become an
evidence-backed implementation task.

The first release will visualize and plan changes. It will never edit source,
select a strategy on the user's behalf, or claim that a hypothetical projection
is an observed relationship.

## Competitor findings

CodeGraphContext provides a React force-directed canvas with search, edge
filters, node details, zoom, pan, and drag. It is a useful general explorer, but
a whole-repository force layout becomes difficult to read and does not visually
separate observed evidence from proposed changes.

Serena's localhost dashboard establishes a convenient local lifecycle and makes
runtime state visible, but it is primarily an operations and configuration
surface rather than a code-graph investigation workflow.

Infigraph demonstrates that a graph UI can ship with a local code-intelligence
binary. Trace demonstrates broad task-specific graph views and change-impact
responses, but its documented tool surface does not provide a human graph
explorer.

CGRX will combine the useful parts: a local browser surface, focused graph
navigation, task-specific modes, and live index state. Its distinguishing
feature is a deterministic evidence view that compares multiple future graph
states without mixing them with the current graph.

## Considered approaches

### Generic force-directed repository graph

Render every indexed node and edge on one canvas. This is familiar and quick to
recognize, but it scales poorly, makes comparison difficult, and encourages
users to read visual proximity as semantic evidence. Rejected as the default.

### Static export to HTML, SVG, Mermaid, or DOT

Exporting requires little runtime work and is useful for reports. It does not
support the always-updated graph, progressive exploration, or agent handoff.
Deferred as a later export action.

### Focused evidence explorer with alternative projections

Render a bounded subgraph around a selected symbol or refactor candidate. Use a
deterministic semantic layout and overlay one proposed graph delta at a time.
This is the selected approach because it preserves readability and maps directly
to CGRX's evidence, coverage, snapshot, and refactor contracts.

## User flow

The user runs:

```text
cgrx visualize --repo /absolute/git/worktree
```

CGRX binds to `127.0.0.1` on an available port and opens the browser. `--port`
selects a fixed port, and `--no-open` only starts the server. The page opens on
the current repository snapshot and never contacts an external service.

The landing view contains repository health, current revision, working-tree
state, language counts, a symbol search field, recent changed paths, and top
refactor candidates. Selecting a symbol opens a bounded evidence subgraph.
Selecting a candidate opens the refactor comparison workspace.

The comparison workspace shows the current graph once and three strategy tabs:

1. **Preserve entry points** — extract a shared helper and retain both public
   entry points. Existing callers are preserved. This is the recommended and
   lowest-risk path.
2. **Canonical entry point** — choose one existing symbol as canonical, redirect
   proven internal callers of the duplicate, and retain a compatibility wrapper
   when external or incomplete coverage prevents removal.
3. **Consolidate** — redirect all proven callers and remove the duplicate node
   only when explicit preconditions are satisfied. Any incomplete coverage,
   unresolved dispatch, public-surface uncertainty, or result truncation marks
   this strategy `blocked_by_gaps` rather than pretending it is safe.

The paths are deterministic policy variants over the same evidence. CGRX does
not invent a language-specific design pattern such as a trait, class hierarchy,
or service abstraction without structural evidence.

## Visual model

The default layout uses semantic lanes instead of a free-running force layout:

```text
callers -> selected/current entry points -> shared targets/callees
                         |
                       tests
```

File and module boundaries appear as subtle containers. Within each lane, nodes
are sorted by path, source span, and node identity so the same snapshot always
produces the same initial layout. Users can pan, zoom, drag, and pin nodes, but a
reset restores the deterministic layout.

The display modes are:

- **Current**: current proven `CALLS` and `IMPLEMENTS` edges;
- **Changes**: changed symbols, returned impact paths, candidate tests, and
  coverage gaps;
- **Refactor Preview**: the current graph plus one selected hypothetical delta;
- **Compare**: two synchronized panes showing current and selected future state.

Encoding is semantic and redundant so it does not rely on color alone:

- solid green edge with check mark: current `PROVEN` relationship;
- amber dashed edge with question mark: coverage gap or unresolved relationship;
- violet dotted edge with plus mark: hypothetical addition or redirect;
- grey edge: preserved current relationship;
- red strike/remove badge: conditional removal;
- blue test node: convention-selected candidate, always labeled `not run`.

Clicking a node or edge opens the evidence inspector. It shows repository path,
symbol, source span, source hash, resolver, confidence, assumptions,
counter-evidence, snapshot identity, and related coverage gaps. Source content is
requested only for a user-selected node and is bounded to the existing snippet
contract.

## Multi-path planning contract

`suggest_refactors` keeps its existing inputs and tool identity. Each candidate
adds a compact `strategies` array. No twelfth always-visible MCP tool is needed.

Each strategy has this logical shape:

```json
{
  "strategy_id": "strategy1.<snapshot>.<candidate>.<policy>",
  "policy": "preserve_entrypoints | canonical_entrypoint | consolidate",
  "status": "hypothetical | blocked_by_gaps",
  "recommended": true,
  "risk": "low | medium | high",
  "summary": "short deterministic description",
  "preconditions": [],
  "blocking_gaps": [],
  "graph_delta": {
    "preserve": [],
    "add": [],
    "redirect": [],
    "move_to_helper": [],
    "remove": []
  },
  "edit_obligations": [],
  "verification": {
    "review_symbols": [],
    "candidate_tests": [],
    "execution_status": "not_run",
    "coverage_reference": "coverage_gaps"
  },
  "agent_handoff": {
    "objective": "...",
    "constraints": [],
    "ordered_steps": [],
    "acceptance": []
  }
}
```

`strategy_id` is derived from the full repository snapshot, candidate identity,
and policy. It changes after any relevant snapshot change. All node and edge
references carry stable identities and evidence references; the handoff contains
paths and symbols but no large source dump.

The `agent_handoff` object is deterministic structured data, not an opaque LLM
prompt. It tells an agent what to inspect, which graph changes are intended,
which relationships must remain, what gaps block destructive edits, and which
checks remain `not_run`. The UI offers **Copy agent plan** and **Copy MCP call**.
An agent calling `suggest_refactors` receives the same object directly and can
perform the edits only after rechecking the snapshot and source.

The conservative strategy is recommended by default. Medium and high-risk paths
are never marked ready solely because all currently returned edges were handled.
Any partial/truncated response blocks removal and keeps uncertainty visible.

## Runtime architecture

The implementation has four bounded units:

1. `runtime/graph_view.rs` assembles a serializable bounded graph view from the
   same definitive arcs and coverage data used by MCP tools.
2. `runtime/refactors/strategies.rs` derives the three policy variants and agent
   handoff objects from one refactor candidate.
3. `visualize.rs` owns the loopback HTTP server, routing, refresh coordination,
   port selection, and browser opening.
4. `web/` contains embedded HTML, CSS, and JavaScript assets. Assets are included
   in the Rust executable at compile time.

The HTTP layer calls `Runtime` methods directly. It does not launch a second MCP
server or parse model-visible MCP output. Initial endpoints are:

- `GET /api/status`
- `GET /api/search?q=&scope=&limit=`
- `GET /api/graph?symbol=&path=&direction=&depth=&limit=`
- `GET /api/refactors?scope=&language=&min_score=&limit=`
- `GET /api/snippet?symbol=&path=`

All endpoints return the same snapshot envelope. Request parameters use the
existing scope and budget limits. Errors retain CGRX typed codes.

The browser polls only the compact status endpoint. When revision, working-tree
digest, or graph generation changes, the server refreshes through the existing
watched runtime. The UI shows a freshness banner, discards stale projections,
refetches the selected view, and preserves camera and selection only when the
selected identity still exists.

## Frontend and Node.js 26

The first version uses dependency-free browser JavaScript and SVG. SVG keeps
text selectable, supports accessible labels, and permits a later deterministic
export without a rendering dependency. A small deterministic lane-layout module
is shared by the UI tests.

Node.js 26 runs frontend contract tests in CI. Node is not required when running
the released CGRX executable. Avoiding a frontend package tree preserves the
single-binary installation and reduces supply-chain and schema cost.

## Security and privacy

- Bind only to `127.0.0.1`; reject non-loopback bind requests in v1.
- Generate a random per-process capability token and place it in the opened URL;
  API requests without the token are rejected.
- Accept GET and HEAD only. There are no source, Git, index, or configuration
  mutation endpoints.
- Apply a restrictive Content Security Policy and `Cache-Control: no-store` to
  API and source responses.
- Canonicalize `repo` exactly like multi-repo MCP and reject traversal paths.
- Never send telemetry, source, queries, graph data, or capability tokens over
  the network or into usage logs.

## Budgets and failure behavior

The default focused graph is depth 1 and at most 80 nodes / 160 edges. The user
may request depth up to 4 and at most 500 nodes through progressive expansion.
Every response reports totals, truncation, partial status, and coverage gaps.

No results never means no relationships exist when coverage is partial. A stale
projection is removed immediately rather than drawn with the new graph. If a
source snippet cannot be verified against the indexed hash, the inspector shows
the typed gap and no source body.

The UI remains usable if layout, snippet, or one overlay request fails. It shows
the error in the affected panel and keeps the last verified current graph with a
stale badge until refresh succeeds.

## Verification

Implementation will follow test-first development in an isolated worktree.

Rust tests will cover deterministic graph-view ordering, budgets, snapshot
binding, three strategy deltas, blocked removals, typed HTTP errors, loopback
binding, capability checks, refresh, and unchanged MCP schema count.

Node.js 26 tests will cover lane layout, layer filtering, selection persistence,
stale projection removal, evidence labels, keyboard navigation, URL state, and
agent-handoff copy serialization.

End-to-end fixtures will cover TypeScript/TSX, Go, Python, and Rust. Browser
verification will inspect desktop and narrow layouts, Current/Changes/Refactor
Preview/Compare modes, search, progressive expansion, code-change refresh, and
the exact agent-plan payload.

Release gates remain workspace fmt, Clippy with warnings denied, full Rust and
Node tests, release build, stdio MCP smoke, schema budget at or below 2,000
tokens, Linux/macOS CI, installed-launcher smoke, and a documented rollback.

## Explicit non-goals for v1

- automatic source edits or one-click refactoring;
- arbitrary Cypher or user-provided JavaScript;
- remote/team hosting;
- a whole-repository unbounded graph;
- persistent UI annotations or decision memory;
- claiming compile, test, or behavioral coverage before those checks run;
- language-specific abstraction generation without a later evidence contract.

