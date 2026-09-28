# alpha.15: bounded, asynchronous graph explorer

Base: `a31d515f974ff271bb82e14d60b027f7fce3a79a` (last published alpha.14:
`dbd52c47b1e1f6a92e385805ef7cb74bceb5625f`). No language, proof policy,
similarity score, or on-disk schema change is intended.

## Architecture and API

- 8 HTTP workers / 32 waiting connections; disconnects and incomplete requests
  are isolated. Initial indexing starts after binding the listening socket.
- 2 opening/refresh workers and 4 read-query workers, bounded waiting queues,
  one job per project, at most 4 open runtimes. `/api/status` advances the watched
  snapshot at most twice per second; read panels share that snapshot.
  Catalogue discovery has its own single worker and bounded traversal.
- `GET /api/projects` reads a cached catalogue; `?refresh=1` requests rediscovery.
- `GET /api/project-status?project=ID` is read-only and never opens an index.
  States: `queued`, `indexing`, `ready`, `refreshing`, `error`. Includes snapshot,
  stale flag, retry interval, and bounded-resource counters.
- Not-ready API responses are **202**; queue saturation is **503** with
  `Retry-After`. Failed project loads remain errors rather than silently opening
  another repository. Per-project writes/refreshes are serialized.
- `/api/repository-graph` allows 20,000 nodes / 120,000 edges. Existing JSON stays
  available. `format=compact` returns `cgrx.topology.v1`: node rows
  `[string_u64_id,symbol,path]`, edge rows `[source_index,target_index,relation]`.
  All indices reference this response's node table, never numeric u64 IDs.
- `/api/edge-evidence?project=ID&snapshot=JSON&source=ID&target=ID&relation=KIND`
  returns proven evidence only; snapshot mismatch is **409**, triggering reload.
  File aggregation retains a reference to representative source evidence.
- A global response LRU is limited to **128 MiB / 512 entries**, keyed by project,
  snapshot and query. Eviction drops that project's responses and runtime.
- A similarity runtime has one active and one replaceable pending input;
  generation checks interrupt fingerprint construction and comparison batches.

## Rendering

2D uses Sigma **3.0.3**, Graphology **0.26.0**, edge-curve **3.1.0** (MIT).
Graphology batches are built away from renderer event listeners, avoiding repeated
reprocessing of all previous chunks. Shallow curves reduce fragment overdraw at
large scale without dropping relationships. Clew community contours are retained.

Dedicated topology/layout workers keep parsing and D3 off the UI thread. Layout
messages use transferable endpoint/position buffers and preserve the string ID
table. A deterministic initial layout precedes the final 90-tick layout.

3D uses one instanced node mesh, shared segmented edge buffers, and at most 32
visible text textures. Frames are requested only for changes or damping. Renderer,
worker and GPU resources are disposed on unmount. Selection/camera survive refresh.
Without WebGL, SVG is explicitly capped at 500 nodes / 2,000 edges; those are
rendering limits, **not** evidence totals. Partial coverage/truncation remain visible.

## Reproduction and release gates

- `npm ci && npm run typecheck:web && npm run build:web && npm test`
- `cargo test --locked --workspace`
- `cargo test --locked --workspace --features cgrx-cli/experimental-php`
- `python3 scripts/bench_visualize.py --binary /absolute/path/to/cgrx --output report.json`
  generates two independent 10k-symbol cold repos and measures assets/catalogue/
  status while opening both and holding an incomplete HTTP request.
- `scripts/bench_graph.tsx` is a local real-GPU harness. Bundle it with esbuild and
  serve with the web assets (`/assets/layout-worker.js` maps to the bundled worker).
  Fixtures in `web/graph-fixtures.js` reproduce 1k/6k, 5k/30k and 20k/120k graphs,
  including parallel relationship kinds and IDs above JavaScript's exact range.
- CI Playwright tests check embedded assets under CSP, topology counts, 3D,
  keyboard search, and context-loss fallback. Software-rendered CI is **not** a
  substitute for the M4 Pro hardware performance gate.
- Publication waits for **CI + PHP validation + alpha15/real-gpu** on the exact
  release SHA. Release metadata must change, and existing tags cannot be moved.

Preliminary local M4 Pro / 24 GiB, Chromium 154, DPR 2 measurements (development
working tree; **not a release attestation**): 20k/120k 2D first interactive 632.5ms,
layout 6499ms, frame p95 10.1ms; 3D first interactive 317.6ms, layout 6441.9ms,
frame p95 9.8ms. Independent HTTP p95: CSS 3.69ms, catalogue 1.67ms, project-status
1.41ms while two cold 10k projects open. Final same-SHA evidence is required before
setting the real-GPU release status or publishing alpha.15.

Sources: [Sigma renderers](https://www.sigmajs.org/docs/advanced/renderers/),
[Three.js instancing](https://threejs.org/docs/pages/InstancedMesh.html),
[Playwright CI](https://playwright.dev/docs/ci-intro).
