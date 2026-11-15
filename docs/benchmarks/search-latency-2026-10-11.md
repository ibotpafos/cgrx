# Static MCP search latency, 2026-10-11

The candidate returns the same complete search results as PR #110 while avoiding
whole-graph degree aggregation and collection of every body token. In this
synthetic run, median graph searches fell from 3.4–3.7 ms to 0.25–0.75 ms.
The 3.7 MB body with matching terms near its beginning fell from 80.546 ms to
0.318 ms; the missing-term query still scans the body and fell to 43.040 ms.

The [machine-readable report](search-latency-2026-10-11.json) records binary
hashes, source commits, fixture revision, coverage, arguments and all measured
percentiles. The [benchmark script](../../scripts/bench_search_latency.py)
requires complete MCP result and status parity and exits unsuccessfully when
either differs. Timing is descriptive and has no CI threshold.

## Build and method

Both binaries were built with pinned Rust 1.89.0 using
`cargo build --locked --release -p cgrx-cli`. The workspace release profile uses
thin LTO, one codegen unit, aborting panics and stripped symbols.

- Baseline: PR #110, commit `2e9d3514140126f871302d4f8bf3cb4ca34173ff`.
- Candidate: commit `9218e7e4b51b1662f841909d9b4308cfda21da4f`, with no uncommitted
  Rust changes when measured.
- The measured candidate source is published as commit
  `9a077e3f3e8cecd70fffbf898a757cdcfe37da70`. Its complete Git tree matches the
  measured local commit: `069547e24db9b2eb6ea8ffc3a5c9e67d28690122`.
- Environment: Linux 6.18.44, x86-64, glibc 2.41.

The baseline indexed one temporary synthetic Git repository. Both servers
opened that exact snapshot and state path with `serve --state ...
--response-profile full`; no source refresh ran. Each binary received the same
eight search requests for five warmup rounds and 25 measured rounds. Latency
came from the server's `CGRX_USAGE_LOG`, excluding indexing and process startup.
No other Cargo build ran during the paired experiment.

All 240 search result payloads per binary matched, including source spans,
symbol references, graph degrees, totals, match lanes, pagination, snapshot
identity and model-visible text. The status payloads also matched. No
fields were normalized or discarded for comparison.

The fixture has 1,002 definitions and 20,999 stored graph edges. Its 1,000 graph
functions each call 20 neighboring functions; the isolated marker has no
relationships. Total source size is 3,979,044 bytes, including a 3,700,029-byte
function with a repeated comment. Recorded coverage gaps are zero. Body token
hit and miss requests scope to that function's file. The hit terms occur near
the start of the comment, exercising early exit; the miss requires the complete
body scan.

## Results

Times below are milliseconds. Exact microsecond values and extrema remain in
the JSON report.

| Search case | Baseline p50 | Candidate p50 | Baseline p95 | Candidate p95 | p50 ratio |
| --- | ---: | ---: | ---: | ---: | ---: |
| Empty result | 3.465 | 0.273 | 3.748 | 0.377 | 12.7× |
| Isolated marker, limit 1 | 3.379 | 0.251 | 3.642 | 0.287 | 13.5× |
| Connected symbol, limit 1 | 3.745 | 0.470 | 4.355 | 0.911 | 8.0× |
| First 50-row page | 3.630 | 0.747 | 4.152 | 2.807 | 4.9× |
| Offset 950, final 50 rows | 3.591 | 0.690 | 4.257 | 0.784 | 5.2× |
| Body token hit | 80.546 | 0.318 | 84.578 | 0.376 | 253.3× |
| Body token miss | 82.295 | 43.040 | 85.308 | 82.113 | 1.9× |
| Literal body hit | 2.382 | 0.272 | 2.624 | 0.472 | 8.8× |

These are synthetic hot search measurements, not competitor results or a
whole-agent cost comparison. They do not establish indexing, startup,
repository refresh or arbitrary monorepo speedups. Fuzzy matching is unchanged
and this fixture does not exercise its unusually long-identifier case.

## Reproduction

Build the two source revisions with the same pinned toolchain and preserve
their release binaries separately, then run:

```sh
python3 scripts/bench_search_latency.py /path/to/pr110/cgrx /path/to/candidate/cgrx \
  --baseline-commit 2e9d3514140126f871302d4f8bf3cb4ca34173ff \
  --output /tmp/search-latency.json
```

The script creates and removes its own temporary repository and index. Use
`--nodes`, `--fanout`, `--body-repetitions`, `--warmup` and `--samples` to inspect
other workloads; changed parameters produce a different fixture and are
recorded in the report. For candidate source provenance, run the script from
the candidate checkout with its compiled sources committed or recorded by the
report's Rust diff digest.

The separate pagination regression from issue #113 is covered by numeric
boundary tests: continuation at offset 1,000,000 is valid, a required larger
offset returns `cgrx.search_pagination_limit`, and a final page may cross the
boundary without a continuation. The performance fixture stays below that
limit so every compared payload retains PR #110 behavior.
