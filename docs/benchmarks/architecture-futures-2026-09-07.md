# Architecture futures benchmark — 2026-09-07

This benchmark exercises deterministic architecture planning without an LLM.
For each proven package cycle or high-fan-in symbol, CGRX builds three graph
futures, ranks them, exposes the exact score inputs, and emits a
snapshot-bound agent handoff. Destructive recommendations are blocked when the
architecture graph is partial.

The release binary was run in a fresh MCP process three times per frozen Git
worktree with `scope="**"`, `package_depth=2`, and `limit=100`. The command
fails on response drift, missing futures, invalid ranks, score order, handoff
drift, or any `llm_used` value other than `false`.

| Project | Revision | Issues | Validated futures | Median ms | Visible tokens |
| --- | --- | ---: | ---: | ---: | ---: |
| CGRX | `e5501849` | 100 | 300 | 221.4 | 5,957 |
| Private corpus A | `9d77eb9b` | 100 | 300 | 4,707.9 | 6,268 |
| Private corpus B | `da5cd1a2` | 100 | 300 | 1,721.1 | 9,491 |
| Private corpus C | `8613b9fc` | 20 | 60 | 169.7 | 4,924 |
| Private corpus D | `dbca43c5` | 9 | 27 | 97.9 | 4,118 |
| **Total** | | **329** | **987** | | **30,758** |

All five frozen repositories have explicit coverage gaps, so all 329 safe
recommendations are `preserve_and_monitor`. This is intentional abstention,
not evidence that architecture changes are unnecessary. Controlled complete
fixtures prove both active decisions: `invert_dependency` wins for a package
cycle, and `introduce_facade` wins for a five-caller hotspot. Compact MCP output
shows at most six ranked issues while preserving total counts and an exact
o200k token count.

Reproduce with:

```bash
python3 scripts/benchmark_architecture.py \
  --binary target/release/cgrx --repeat 3 \
  --repo cgrx=. \
  --repo corpus-a=<path-to-private-corpus-a> \
  --repo corpus-b=<path-to-private-corpus-b> \
  --repo corpus-c=<path-to-private-corpus-c> \
  --repo corpus-d=<path-to-private-corpus-d>
```

## Competitor boundary

Trace documents optional AI architecture explanation backed by Ollama/OpenAI,
embeddings and summarization. Its current public tool reference does not
document revision-bound architecture futures, explicit score formulas, graph
delta predictions, or a model-free agent handoff. Trace remains broader in
framework and cross-service topology.

codebase-memory-mcp exposes a large read-only graph and Cypher surface plus
community detection and runtime trace ingestion. Its current public README does
not document a refactor planner that produces and ranks alternative future
graphs. It remains much broader in language parsing and Hybrid LSP coverage.

These are feature-contract comparisons from current public documentation, not
common-corpus superiority claims. No competitor binary was timed in this run.

Sources:

- <https://trace-mcp.com/tools-reference.html>
- <https://trace-mcp.com/architecture.html>
- <https://github.com/DeusData/codebase-memory-mcp>
