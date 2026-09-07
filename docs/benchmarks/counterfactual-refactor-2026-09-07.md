# Counterfactual refactor planner benchmark — 2026-09-07

This benchmark exercises `suggest_refactors` through the release MCP server on
seven frozen repositories. It validates each returned candidate and all of its
future graph strategies; it is not a claim that every suggested refactor is
useful or safe.

## Result

| Measure | Observed result |
| --- | ---: |
| Frozen projects | 7 |
| Languages represented | Go, Python, TypeScript, Rust |
| Refactor candidates | 43 |
| Counterfactual graph futures validated | 129 |
| Fresh-process samples | 3 |
| End-to-end median | 5,647.087 ms |
| Sample times | 5,905.028 / 5,647.087 / 5,076.877 ms |
| Model-visible result tokens | 4,132 o200k tokens |
| Repeated output equality | exact across all 3 samples |
| Separate LLM or embedding model | none |

All seven results were partial because the frozen scopes contain explicit index
coverage gaps. The planner therefore selected `preserve_entrypoints` for all 43
candidates instead of recommending a destructive removal. Recommended scores
ranged from 590 to 760. This is conservative behavior under incomplete evidence,
not measured recommendation precision: all candidate labels remain unreviewed.

The controlled integration matrix separately proves decision sensitivity. With
complete coverage and no observed traffic, `consolidate` ranks first. Adding 100
revision-pinned production calls to the duplicate entry point changes the winner
to `preserve_entrypoints`. Both outputs expose the exact integer inputs,
penalties, graph deltas, reason codes and `llm_used=false`.

Reproduce:

```sh
cargo build --locked --release -p cgrx-cli
python3 -m unittest scripts/test_eval_refactors.py
python3 scripts/eval_refactors.py target/release/cgrx --samples 3
cargo test -p cgrx-cli --test refactor_strategies counterfactual_planner
```

## Competitive boundary

Trace documents refactoring actions and optional AI suggestions, but its current
tool reference does not list runtime trace ingestion; its semantic similarity
mode uses vector search and AI reranking. codebase-memory-mcp documents runtime
trace ingestion and clone detection, while its public comparison describes it as
read-only with no refactoring tools. CGRX's measured slice combines
revision-pinned runtime evidence, three explicit future graph projections,
formula-based ranking, coverage blockers and an agent handoff without a separate
model. This comparison is feature-contract evidence, not a common-corpus speed or
accuracy win over either competitor.

Sources inspected on 2026-09-07:

- <https://trace-mcp.com/tools-reference.html>
- <https://trace-mcp.com/vs/codebase-memory-mcp.html>
- <https://github.com/DeusData/codebase-memory-mcp>

