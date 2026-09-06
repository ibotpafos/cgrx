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

The coverage test exercises body discovery across `.ts`, `.tsx`, `.go`, `.py`,
and `.rs`, including language rejection for unsupported values.

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
