# Java call graph benchmark — 2026-09-07

CGRX adds Java as its fifth grammar-backed, call-aware language. The resolver
proves only unique unqualified calls inside a concrete class without inheritance.
Overloads, receiver calls, constructors, inherited calls and explicit static
imports abstain as dispatch gaps instead of guessing a target.

The frozen relationship evaluator contains one positive Java caller and a
same-name target in another class as a negative control. It runs the release
MCP server against a freshly committed fixture and requires complete depth-one
results, exact symbol/path identities, precision 1.0 and recall 1.0. Java also
participates in graph-view, runtime-evidence and refactor-future extension
matrices.

The release build produced `TP=9`, `FP=0`, `FN=0`, precision `1.000`, recall
`1.000` and F1 `1.000` across the full 11-case five-language fixture. The Java
cell contributed one true caller and one same-name negative with no error. Four
additional source-anchored Gson tasks cover Java CALLS, IMPORTS, REFERENCES and
UNRESOLVED behavior in the supported-language contract.

Trace's published matrix lists Java symbol and import extraction but no Java
call resolver. CBM documents Java tree-sitter and Hybrid LSP coverage; this
benchmark does not claim superiority over CBM until the same real Java corpus
is run through both engines.

Reproduce with:

```bash
cargo build --locked --release -p cgrx-cli
python3 scripts/eval_relationships.py target/release/cgrx
```

Sources:

- <https://trace-mcp.com/language-matrix.html>
- <https://github.com/DeusData/codebase-memory-mcp>
