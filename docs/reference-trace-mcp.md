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
  supplies a path, and uncertain edges stay out of the result.

The coverage tests exercise body discovery and file outlines across `.ts`,
`.tsx`, `.go`, `.py`, and `.rs`, including language rejection, deterministic
source order, truncation, and missing-path errors.
Usage-site tests cover direct calls in all five extensions plus relation-aware
deduplication between `CALLS` and `IMPLEMENTS` evidence.

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
- <https://trace-mcp.com/architecture.html>
- <https://trace-mcp.com/language-matrix.html>
- <https://github.com/nikolai-vysotskyi/trace-mcp>
