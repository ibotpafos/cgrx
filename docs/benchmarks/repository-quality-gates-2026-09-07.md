# Repository quality gate benchmark — 2026-09-07

`check_repository_gates` converts the existing proven architecture snapshot
into a deterministic policy result without executing tests or calling an LLM.
It evaluates package cycles, package fan-out, symbol fan-in, unresolved local
dependencies and graph coverage. Partial evidence produces `INCONCLUSIVE`,
never `PASS`, unless an observed rule already proves `FAIL`.

`scripts/eval_repository_quality_gates.py` creates four temporary Git
repositories and calls the real stdio MCP server twice per case. The frozen
matrix proves:

- a clean direct-call repository returns `PASS`;
- a configured fan-in ceiling produces `WARN`, with `fail_on=warning` blocking;
- a proven two-package import cycle produces `FAIL`;
- an unresolved local import produces `INCONCLUSIVE` when its numeric rules are
  explicitly tolerated;
- repeated calls return identical structured results and the compact response
  preserves the canonical agent handoff;
- every result reports `repository_quality_gate_v1` and `llm_used=false`.

Run the release gate with:

```sh
python3 scripts/eval_repository_quality_gates.py target/release/cgrx
```

Trace defaults to cyclomatic complexity, circular import chains and coupling
instability, and documents five optional gates. CGRX currently has no
cyclomatic, security or smell rule. Its stronger evidence contract is that
repository-local dependency resolution and graph coverage participate directly
in the verdict, and its failed-cycle handoff includes ranked future graph
strategies. This benchmark proves the CGRX contract; it is not a common-corpus
comparison with Trace.
