# Trace MCP reference comparison

Reviewed 2026-09-06 against the public Trace MCP documentation and repository.

## Adopted search strengths

Trace MCP exposes full-text search with language and file filters. CGRX already
bounded paths through `scope`, so this slice extends the existing `search_graph`
contract instead of adding another always-visible MCP tool:

- `include_body: true` searches a symbol's indexed body after higher-priority
  exact, prefix, and substring symbol-name matches;
- `language` accepts every CGRX language pack: `typescript`, `go`, `python`, and
  `rust`; TypeScript includes `.ts` and `.tsx`;
- each result reports `matched_by: symbol | body`, so callers can distinguish
  direct symbol discovery from content discovery;
- the default remains name-only for stable precision and response cost.
- `get_outline` returns a file's symbols and definition spans in source order,
  without returning bodies; this gives agents a compact navigation step before
  requesting exact source.
- `find_usages` returns proven incoming `CALLS` and `IMPLEMENTS` sites with exact
  evidence spans and resolver classes. Ambiguous targets fail until the caller
  supplies a path, and uncertain edges stay out of the result. Its optional
  `depth` performs a bounded reverse traversal from 1 to 4 hops; every row reports
  `hop` and the immediate `via` target, keeping a transitive impact chain auditable.

The coverage tests exercise body discovery and file outlines across `.ts`,
`.tsx`, `.go`, `.py`, and `.rs`, including language rejection, deterministic
source order, truncation, and missing-path errors.
Usage-site tests cover direct calls in all five extensions, a two-hop reverse
impact chain, and relation-aware deduplication between `CALLS` and `IMPLEMENTS`
evidence.

Trace's graph and quality-gate ideas also informed `suggest_refactors`. CGRX
uses its already-live graph to combine normalized callable-body similarity with
definitive outgoing relationships, then shows a snapshot-bound hypothetical
extract-helper delta. It preserves both entry points, never writes source, and
keeps candidates separate from proven graph facts.

## Transfer matrix

The comparison below separates useful product patterns from headline feature
counts. Trace's public tool index currently describes a much larger surface,
while its own measurements show that tool schemas and oversized default results
can cost more tokens than the reads they replace. CGRX therefore extends compact
existing contracts before adding another always-visible tool.

| Trace strength | CGRX state | Decision |
| --- | --- | --- |
| Outline → exact symbol → impact workflow | `get_outline`, `get_code_snippet`, `find_usages` | Adopted; reverse impact now supports 1–4 proven hops. |
| PR context benchmark with pinned SHAs and exact tokenizer counts | Frozen seven-project corpus exists, but current outline metric is bytes and does not measure review quality | Next measurement priority: reproduce both context arms with tokenizer counts and report truncation separately. |
| Per-tool response-cost table and build-stamped results | MCP schema has a strict budget; `suggest_refactors` reports tokenizer-counted compact payload cost | Extend the same measurement to every tool before changing encodings or defaults. |
| Per-shape output encoding | Compact tabular model-visible rows already coexist with full structured JSON | Keep tool-specific shaping; do not adopt TOON globally because Trace measured regressions for nested rows. |
| Minimal/standard/full tool presets | CGRX exposes 11 focused tools with a model-visible schema budget below 2,000 tokens | Keep the small default surface; add a preset only when optional tools justify its fixed cost. |
| Budgeted context bundles and project maps | `orient` + revision-bound `expand` already return bounded task context | Evaluate recall and round trips against Trace's benchmark shape before adding aliases. |
| Framework-aware routes, ORM links, DI, and tests | CGRX currently proves compiler-checked `CALLS`/`IMPLEMENTS` for TypeScript/TSX, Go, Python, and Rust | Build framework packs only with frozen positive/negative relation fixtures; do not count symbol-only extraction as relationship support. |
| Calibrated quality gates | `scan_risks` returns candidates, evidence, candidate tests, and explicit gaps | Defer merge-blocking scores until thresholds are calibrated on labeled changes and false positives. |
| Decision memory with confidence, provenance, temporal validity, and privacy tags | Outside the current code-index contract | Reuse those data-quality rules if memory is added; keep reconstructible code out of durable memory. |
| Local session analytics and opt-in tracing | No exported source/query telemetry in the current core | Add local latency/error/response-size metrics first; any exporter must remain opt-in and metadata-only. Trace documents its anonymous daily usage ping as a separate subsystem, so that policy must not be inferred from the tracing switch. |
| Multi-project daemon LRU/TTL and measured RSS attribution | Current work targets explicit repo-scoped runtimes | Measure resident cost per loaded project before introducing a daemon cache or eviction policy. |
| Automated client hooks and prompt rewrites | Repository instructions already route discovery through CGRX | Do not patch client prompts from the core binary; keep setup changes explicit and reversible. |

The next measurement priorities are the PR context benchmark, response cost for
the remaining tools, and manual review of the refactoring inventory. Framework
edges, decision memory, quality gates, and daemon lifecycle follow only after
their accuracy and resource budgets can be tested independently.

## Seven-project refactoring inventory

The release stdio server scanned seven frozen repositories with
`min_score=760` and `limit=50`. It returned 37 callable pairs in deterministic
repeated runs: 13 in Pyramid, 2 in itsdangerous, 1 in blinker, 1 in Vocal
School, 20 in CGRX, and none in GD or VEX. The compact model-visible responses
cost 2,506 o200k tokens in aggregate.

All 37 rows remain `unreviewed`, so measured precision is intentionally `null`.
Every project also reported at least one existing index coverage gap; the
inventory therefore records `partial_projects=7` and does not treat zero results
as proof that a repository has no duplication. The callable filter excludes
container declarations and Rust/Go prototypes without bodies; exact path,
symbol, node id and span keep overloaded or same-name methods distinct.

Reproduce with:

```sh
python3 scripts/eval_refactors.py target/release/cgrx
```

## Seven-project outline measurement

The release stdio server was run against the first preregistered source path in
each of the seven frozen real-task repositories. The comparison uses UTF-8 bytes
of the model-visible compact outline JSON versus bytes of the complete source
file; it is a response-size measurement, not a tokenizer or task-accuracy claim.

| Snapshot | Raw bytes | Outline bytes | Ratio |
| --- | ---: | ---: | ---: |
| GD | 994 | 413 | 0.415 |
| VEX | 2,802 | 651 | 0.232 |
| Pyramid | 6,405 | 817 | 0.128 |
| itsdangerous | 1,409 | 452 | 0.321 |
| blinker | 19,132 | 1,078 | 0.056 |
| Vocal School | 1,067 | 459 | 0.430 |
| CGRX | 203,614 | 6,430 | 0.032 |
| **Total** | **235,423** | **10,300** | **0.044** |

The median per-project ratio is 0.232. The aggregate is dominated by CGRX's
large runtime file, so both figures are retained.

Reproduce with:

```sh
python3 scripts/eval_outlines.py target/release/cgrx
```

## Deliberately separate capabilities

Trace MCP documents BM25/FTS5 and PageRank-based hybrid scoring, framework-aware
request flows, and a much wider symbol-only language surface. CGRX does not claim
those capabilities from this slice. Ranking remains deterministic name-first
substring ranking, with body matches last. Broader language count is also not a
substitute for CGRX's compiler-checked relationship matrix across its supported
packs.

Sources:

- <https://trace-mcp.com/tools-reference.html>
- <https://trace-mcp.com/tools-index.html>
- <https://trace-mcp.com/pr-context-benchmark.html>
- <https://trace-mcp.com/reduce-claude-code-token-usage.html>
- <https://trace-mcp.com/perf/response-tokens/>
- <https://trace-mcp.com/toon-savings.html>
- <https://trace-mcp.com/architecture.html>
- <https://trace-mcp.com/language-matrix.html>
- <https://trace-mcp.com/supported-frameworks.html>
- <https://trace-mcp.com/configuration.html>
- <https://trace-mcp.com/quality-gates.html>
- <https://trace-mcp.com/decision-memory.html>
- <https://trace-mcp.com/analytics.html>
- <https://trace-mcp.com/telemetry.html>
- <https://trace-mcp.com/daemon-memory.html>
- <https://trace-mcp.com/tweakcc.html>
- <https://trace-mcp.com/development.html>
- <https://github.com/nikolai-vysotskyi/trace-mcp>
