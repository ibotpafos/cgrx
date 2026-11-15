# Bounded Unicode fuzzy search, 2026-10-11

Four selected 16,000-character fuzzy-search queries reduce warm p50 dispatch
latency from 286–288 ms to 0.483–0.780 ms. Both binaries return identical complete
MCP search results and status results. Several short controls are 6–17 µs slower
in this same sample; this experiment does not establish a general speed gain.

## Source and binary identity

Both executables use Rust 1.89.0, the release profile and default language
features. Both report `cgrx 0.1.0` and are 23,400,224 bytes.

| Build | Source commit | Source tree | Binary SHA-256 |
| --- | --- | --- | --- |
| Baseline | `9a077e3f3e8cecd70fffbf898a757cdcfe37da70` | `069547e24db9b2eb6ea8ffc3a5c9e67d28690122` | `2b503901ee68503e39bd58d7c0d29f466b1af47efc7df37bfcad72067b6d8279` |
| Measured candidate | `8469a8bd61723a78155775153db10f394082e8f4` | `103aba91b6017f434639bb917190fa599a3a1d00` | `78394936a5a12f5dda8ad6acf81c152a7563af7b7a5af55ae87b5c90a3763648` |

The measured candidate is the clean local source commit. The independently
verified [published equivalent](https://github.com/ibotpafos/cgrx/commit/18708ff694f8587022d3854a4b9dacb981b232f6)
is `18708ff694f8587022d3854a4b9dacb981b232f6`, with the exact same candidate tree.
The baseline's Rust, Cargo and toolchain files also match merged main
`4fae80c`; its subsequent merge changes only non-Rust material.

The [retained observations](search-fuzzy-2026-10-11.json) contain source trees,
binary and script hashes, individual timing samples, query recipes, source-file
hashes and complete-result hashes. No 16,000-character query or symbol is
expanded into that artifact.

## What changes

The fuzzy fallback previously calculated the full exact Levenshtein distance,
even though search accepts only distances at most 1, 2 or 3. The replacement
computes exact accepted distances inside the `|i-j| <= k` band and rejects when
the remaining match cannot fit the unchanged threshold. It operates on Unicode
scalars and keeps the existing length, whitespace and nonempty-token guards.
Literal and identifier-token tiers, fuzzy-distance ordering, snapshot identity
and wire output remain unchanged. No new dependency is introduced.

For a name of `n` scalars and threshold `k <= 3`, the distance calculation uses
`O(k*n)` work instead of a full `O(m*n)` calculation against `m` query scalars.
Its dynamic-programming workspace is two seven-cell stack rows. The lowercased
query scalars are cached once per search in an `O(m)` vector; this is not a
constant-memory claim for the complete search or its other data structures.

## Fixture and protocol

The harness creates a committed, unchanged Rust fixture with eleven definitions
in three files. One definition has the valid identifier consisting of 16,000
`a` characters. Short definitions exercise ordinary ranking and Greek, Cyrillic
and Turkish lowercase behavior. A separate `cət` definition queried with `cot`
distinguishes Unicode scalar distance 1 from UTF-8 byte distance 2 at threshold 1.
The punctuation-only `_` query against the valid identifier `x` would be one
edit away, so its empty result specifically exercises the nonempty-token guard.

Fixture commit: `bbf76b3059fe8eef3d07e9e1b6e236a2eaaff923`. The index contains
eleven graph nodes, eight graph edges and zero recorded coverage gaps. Zero
recorded gaps is not a claim of complete semantic relationship coverage.
The source files total 16,168 UTF-8 bytes; per-file hashes are retained in JSON.

The baseline builds one static index. Both binaries then read that same state
using `serve --state ... --response-profile full`, with no source refresh or
reindexing inside the timed requests. Each binary executes the same fourteen
cases in fixed order for three warmup rounds and fifteen measured rounds:
252 search requests per binary, including 210 retained timing samples.

Every repeated complete MCP tool result is compared directly, including both
model-visible content and structured content. Complete status results before
and after the runs are compared as well. All comparisons pass, alongside the
explicit expected symbol, ordering, total and compact-row checks. The exact
one-edit and three-edit hits retain `matched_by: fuzzy`; four edits remain a miss.

`CGRX_USAGE_LOG.latency_us` measures dispatch from JSON-RPC parsing through
complete response serialization. It excludes fixture creation, indexing,
process startup, static-runtime opening, usage-log writing and stdout transport.
The reported p50 is the median and p95 uses nearest rank; at fifteen samples
the latter equals the observed maximum. Builds and integration checks were held
while these paired timings ran. Timing is descriptive and is never a CI gate.

## Results

All times below are microseconds. The long cases use a query recipe over 16,000
characters; the length-guard query contains 16,004 `b` characters.

| Case | Returned | Baseline p50 | Candidate p50 | Baseline p95 | Candidate p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Equal-length long miss | 0 | 286,437 | 483 | 306,754 | 494 |
| Long one-edit hit | 1 | 287,689 | 780 | 307,598 | 793 |
| Long three-edit hit | 1 | 286,537 | 767 | 353,337 | 778 |
| Long four-edit miss | 0 | 287,162 | 716 | 338,369 | 734 |
| Length-guard miss | 0 | 365 | 355 | 466 | 359 |
| Normal exact/prefix/fuzzy ranking | 5 | 72 | 69 | 117 | 81 |
| Greek Unicode edit | 1 | 28 | 42 | 60 | 60 |
| Cyrillic camel-case edit | 1 | 26 | 40 | 65 | 41 |
| Turkish lowercase-expansion edit | 1 | 23 | 37 | 64 | 40 |
| Turkish literal casefold | 1 | 21 | 38 | 59 | 57 |
| Whitespace excludes fuzzy | 0 | 15 | 23 | 41 | 25 |
| Empty tokens exclude fuzzy | 0 | 14 | 20 | 22 | 23 |
| Snake identifier retains fuzzy | 2 | 28 | 39 | 42 | 71 |
| Scalar-versus-byte threshold | 1 | 17 | 25 | 28 | 28 |

The four long fallback cases show p50 ratios of 369–593× in this selected
fixture. Short Unicode and eligibility controls have recorded p50 increases of
6–17 µs. The literal-casefold and whitespace paths, whose distance work is
unchanged, are also slower in this sample. These observations are retained;
the single fixed-order run cannot isolate algorithm overhead from host and
measurement variation. No claim that every search becomes faster follows.

## Reproduction and limits

```sh
python3 scripts/bench_search_fuzzy.py /path/to/baseline/cgrx /path/to/candidate/cgrx \
  --candidate-source /path/to/candidate/source \
  --baseline-commit 9a077e3f3e8cecd70fffbf898a757cdcfe37da70 \
  --baseline-tree 069547e24db9b2eb6ea8ffc3a5c9e67d28690122 \
  --warmup 3 --samples 15 --output search-fuzzy.json
```

The fixture and requests are generated locally without external packages, API
keys or network calls. Reports describe long queries by recipe, character/byte
counts and SHA-256. Fixture and graph snapshots can remain content-identical
across reproductions. Search-result hashes include symbol references and
continuation IDs bound to the temporary index location, so those hashes vary
between directories.

This is one paired synthetic experiment against the preceding CGRX release
binary. It deliberately exercises an unusually long valid identifier and does
not measure common-repository throughput, monorepo scaling, peak resident memory,
agent-task cost or competitor performance. Correctness outside the selected
public workload is covered separately by algorithm and product regression tests.
