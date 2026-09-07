# Change quality gate benchmark — 2026-09-07

`check_change_gates` turns the existing bounded `scan_risks` evidence into a
deterministic policy result. It does not execute tests or call an LLM. The gate
keeps absence uncertainty explicit: partial evidence produces
`INCONCLUSIVE`, never `PASS`, even when no candidate defect was found.

`scripts/eval_change_quality_gates.py` creates four temporary Git repositories
and calls the real stdio MCP server twice per case. The frozen matrix proves:

- an unchanged repository returns `PASS` without blocking;
- a changed dependency returns `WARN`, and `fail_on=warning` blocks it;
- a retained call to a removed target returns `FAIL`;
- a changed path with a dynamic-dispatch coverage gap returns `FAIL`;
- repeated calls return the identical structured result and canonical agent
  handoff;
- every result reports `change_quality_gate_v1` and `llm_used=false`.

Run the release gate with:

```sh
python3 scripts/eval_change_quality_gates.py target/release/cgrx
```

This is a CGRX contract benchmark, not a common-corpus speed comparison with
Trace. Trace documents configurable repository-wide gates for complexity,
cycles, coupling, dead exports, security, antipatterns and smells. Its quality
gate documentation explicitly says it has no coverage rule. CGRX's first gate
is narrower and change-aware: graph coverage and blocked execution missions are
first-class inputs, and incomplete evidence cannot silently pass. Broader
repository-health parity remains future work.
