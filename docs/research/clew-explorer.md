# Clew explorer adaptation

Upstream: https://github.com/miuuyy/Clew
Reviewed revision: `85b7af12c992593568f6564ad322c9e3d258a919` (2026-09-19).
License: MIT, copyright Aleksandr Vechenkov; retained in `licenses/clew-MIT.txt`.

## Decision

Adapt the graph workspace and pure rendering primitives into CGRX's existing
React 19 application. Clew is a React/TypeScript learning workspace with custom
Canvas 2D and Three.js renderers; its Python service, topic progress, quizzes,
Codex account integration and graph mutation APIs are separate product concerns.
The CGRX web app already used React, so this change adds React components rather
than migrating frameworks or introducing another frontend runtime.

The adopted surface is a full-canvas workspace, compact icon dock, collapsible
explorer, floating evidence card, a default 2D graph and optional 3D view.
`clew-geometry.js` adapts Clew's `buildZoneContour` and convex-hull helpers directly,
plus cursor-anchored zoom and six-candidate collision-avoiding label placement.
`WorkspaceChrome.tsx` and the shell stylesheet adapt the dock/panel composition.
The new `ProjectCanvas.tsx` uses React SVG to retain keyboard-addressable nodes
and relationships while connecting these primitives to the bounded CGRX package
projection. It is an adaptation of the visual workspace, not an upstream fork
or a drop-in copy of Clew's complete application.

## Data contract

Displayed nodes, communities and edges come from the existing CGRX architecture
response. Rendering never invents dependencies or upgrades confidence. Partial
coverage remains visible; relationship selection opens the existing evidence
inspector, and package representatives open the existing focused graph.
Focused code, architecture futures, change missions and Git history remain
available from the dock. The evidence layer selector is shown only in focused
views because the repository map is the static architecture projection.

The 2D graph supports node arrangement for the current mounted snapshot, pan,
cursor zoom, keyboard selection, package inspection and double-click drill-down.
Reset clears manual arrangement; source snapshot changes invalidate it. There
is no durable layout storage or graph mutation API. No new runtime dependency,
remote asset, font fetch, account or service is required. Assets remain embedded
in the Rust binary.

## Verification

Run `npm run typecheck:web`, `npm run build:web`, `npm test`,
`npm run verify:web-csp`, and the `visualize_http` / `visualize_refresh` Rust tests.
Geometry tests cover cluster containment, cursor invariance at zoom limits and
collision-free labels under dense input. Browser checks cover package and edge
inspection, 2D/3D switching, focused navigation, panel controls and narrow layouts.

Validated on 2026-09-22: TypeScript, bundle build, 25 web tests, CSP verification,
and 9 HTTP/refresh integration tests passed. Browser verification used the real
CGRX alpha.12 repository (14 packages, 18 relationships) through a local asset
preview proxy: package selection, keyboard edge inspection, double-click to the
`index_source` focused graph, 2D/3D switching, and a 390×844 mobile viewport.
No browser console warnings or errors were reported. CGRX risk scanning found
no broken-call candidates, but web coverage is partial; direct source review
and the executed checks provide the validation for those coverage gaps.

## Symbol-level overview follow-up

Codebase Memory was reviewed as a reference for graph granularity:
https://github.com/DeusData/codebase-memory-mcp/blob/main/graph-ui/src/hooks/useGraphData.ts
Its overview loads code nodes with an explicit initial node budget, rather than
only aggregated package boundaries. CGRX now exposes its own snapshot-bound
repository symbol graph through `/api/repository-graph` and defaults to symbols.
The existing proven-arc and scoped-document query helpers are reused. No CBM
source is copied. Missing resolution remains a coverage gap, never an invented
edge. Graph nodes and endpoints use decimal strings to preserve u64 identity.

`projectCodeMap` supplies symbol/file projections, including intrafile calls and
isolates. File edges aggregate by direction and relation, retaining a real
evidence site. Symbols return the exact stored qualified name, path and span.
The server reports full scoped node/edge counts separately from bounded output;
the UI offers path-glob narrowing when the 5,000-node / 30,000-edge view is capped.

D3 force 3.0.0 is adopted for the dense layout, using Barnes–Hut repulsion:
https://d3js.org/d3-force/many-body . Its ISC license and transitive notices are
retained. The existing all-pairs package layout would be quadratic at this size.
Layout runs once per graph, while dragging only overrides node coordinates.
A local 3,200-node / 9,585-edge synthetic layout completed in about 0.9 seconds;
this is a layout measurement, not an end-to-end browser benchmark.

Follow-up validation: 28 web tests and 15 Rust graph/HTTP/refresh tests passed.
The real alpha.12 checkout returned 3,216 symbols and 2,250 proven relationships,
including 1,851 intrafile links, without truncation. File projection produced
260 files and 314 aggregated relationships. Selecting `pack_for_path` opened
its source in the inspector; 2D and 3D overview modes were exercised.
