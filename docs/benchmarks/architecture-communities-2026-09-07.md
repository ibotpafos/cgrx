# Architecture community benchmark — 2026-09-07

This benchmark checks whether architecture clustering returns inspectable,
bounded evidence on real repositories. It does not claim that package-level
communities and function-level communities are interchangeable.

## CGRX candidate

Command contract: release binary, a fresh MCP process per sample, `scope="**"`,
`package_depth=2`, `limit=100`, three repeats. The table uses median wall time
including process startup and repository loading. Every result was partial
because the real repositories contain recorded coverage gaps; truncated results
reached at least one response limit.

| Project | Revision | Package groups / Q | Symbol groups / Q | Unclustered symbols | Median ms | Visible bytes |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| CGRX | `99df2d61` | 3 / 0.0325 | 226 / 0.7904 | 877 | 297.3 | 11,926 |
| Private corpus A | `9d77eb9b` | 21 / 0.2343 | 2,367 / 0.8436 | 10,330 | 2,849.8 | 14,008 |
| Private corpus B | `da5cd1a2` | 16 / 0.1818 | 2,492 / 0.7348 | 4,649 | 3,420.7 | 25,198 |
| Private corpus C | `8613b9fc` | 3 / 0.0000 | 187 / 0.7339 | 511 | 497.5 | 10,027 |
| Private corpus D | `dbca43c5` | 3 / 0.0000 | 287 / 0.6868 | 1,191 | 852.8 | 10,441 |

`Q` is modularity. The three latency samples are retained in the benchmark JSON;
the command fails when any non-latency result changes between repeats.

The zero-edge private corpus C package projection correctly stays as three singleton
communities. Private corpus D's zero modularity shows that its two observed boundaries do
not yet provide a useful package partition. These are abstention/weak-signal
results, not evidence that the repositories have no architecture.

Reproduce the CGRX side with:

```bash
python3 scripts/benchmark_architecture.py \
  --binary target/release/cgrx \
  --repeat 3 \
  --repo cgrx=. \
  --repo corpus-a=<path-to-private-corpus-a> \
  --repo corpus-b=<path-to-private-corpus-b> \
  --repo corpus-c=<path-to-private-corpus-c> \
  --repo corpus-d=<path-to-private-corpus-d>
```

## CBM comparison

CBM 0.10.8 `get_architecture(aspects=["clusters"])` was run on indexes whose
reported Git heads matched the five revisions above. It returned 12 displayed
Leiden clusters for each project. Those clusters operate on the call/import graph
at symbol granularity and include representative top nodes and cohesion. Warm
observed response times were 85–710 ms and responses were 1,238–1,910 characters.

CGRX now covers the same response ingredients at package and symbol granularity:
weighted communities, cohesion, representative symbols, binding packages and
edge types. It additionally reports internal/cut weights, total modularity,
unclustered symbols, exact boundary evidence and explicit partial/truncation
state. CBM uses Leiden and includes import edges in its symbol graph; CGRX uses a
deterministic local modularity pass over proven `CALLS`/`IMPLEMENTS`. Their raw
cluster counts and scores are therefore not interchangeable accuracy metrics.

## Trace comparison

Trace was not installed locally, so no runtime latency or output-size result is
claimed. Its current documentation exposes project/import/module/service maps,
PageRank and optional AI architecture explanations, but does not document a
deterministic community-detection result with modularity and cut/internal weight.
Trace remains broader in framework, ORM, route, DI and cross-service topology.
