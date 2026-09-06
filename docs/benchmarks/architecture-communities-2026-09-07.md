# Architecture community benchmark — 2026-09-07

This benchmark checks whether architecture clustering returns inspectable,
bounded evidence on real repositories. It does not claim that package-level
communities and function-level communities are interchangeable.

## CGRX candidate

Command contract: release binary, a fresh MCP process, `scope="**"`,
`package_depth=2`, `limit=100`. Times include process startup and lazy repository
loading. Every result was partial because the real repositories contain recorded
coverage gaps; truncated results reached at least one response limit.

| Project | Revision | Packages | Communities | Modularity | Iterations | Initial / warm ms | Visible bytes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| CGRX | `5599c846` | 12 | 3 | 0.0327 | 3 | 812.4 / 171.0 | 8,664 |
| General Digits | `9d77eb9b` | 28 | 21 | 0.2343 | 3 | 7,999.7 / 2,461.7 | 10,756 |
| VEX | `da5cd1a2` | 52 | 16 | 0.1818 | 4 | 4,028.1 / 1,871.0 | 21,953 |
| Vocal School | `8613b9fc` | 3 | 3 | 0.0000 | 0 | 828.8 / 458.6 | 7,518 |
| Pyramid Agent | `dbca43c5` | 5 | 3 | 0.0000 | 2 | 929.5 / 693.2 | 7,261 |

The initial column is the first lazy load in a multi-repository MCP process. The
warm column is a repeat with existing index state and a fresh MCP process. These
are observed wall-clock samples, not latency percentiles.

The zero-edge Vocal School package projection correctly stays as three singleton
communities. Pyramid's zero modularity shows that its two observed boundaries do
not yet provide a useful package partition. These are abstention/weak-signal
results, not evidence that the repositories have no architecture.

Reproduce the CGRX side with:

```bash
python3 scripts/benchmark_architecture.py \
  --binary target/release/cgrx \
  --repo cgrx=/Volumes/D/Projects/cgrx-opensource \
  --repo gd=/Volumes/D/Projects/gd-main \
  --repo vex=/Volumes/D/Projects/vpn-main \
  --repo vocal=/Volumes/D/Projects/music/vocal-school \
  --repo pyramid=/Volumes/D/Projects/pyramid-agent
```

## CBM comparison

CBM 0.10.8 `get_architecture(aspects=["clusters"])` was run on indexes whose
reported Git heads matched the five revisions above. It returned 12 displayed
Leiden clusters for each project. Those clusters operate on the call/import graph
at symbol granularity and include representative top nodes and cohesion. Warm
observed response times were 85–710 ms and responses were 1,238–1,910 characters.

CGRX now matches the useful quality signals at package granularity: deterministic
weighted clustering, cohesion, internal/cut weights, modularity, exact relation
weights and snapshot binding. CBM remains stronger for function-level cluster
labels and representative symbols. CGRX remains stronger in this response for
exact boundary evidence and explicit partial/truncation state.

## Trace comparison

Trace was not installed locally, so no runtime latency or output-size result is
claimed. Its current documentation exposes project/import/module/service maps,
PageRank and optional AI architecture explanations, but does not document a
deterministic community-detection result with modularity and cut/internal weight.
Trace remains broader in framework, ORM, route, DI and cross-service topology.
