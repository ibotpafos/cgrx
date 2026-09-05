# Agent usage

Use one multi-repo CGRX MCP server. Pass the absolute Git worktree root
in repo on every call; never reuse handles across repositories/sessions.

Reusable agent instruction:

~~~text
Use CGRX for task-directed code discovery.
1. status: confirm repo revision, freshness and graph state.
2. search_graph: find relevant symbols with a small limit.
3. trace_path: follow callers/callees, initially depth=1.
4. get_code_snippet: read definitions behind material claims.
5. check_index_coverage: check all evidence paths together.
For partial, unknown, excluded or stale coverage, inspect source directly.
Use text search for literals, configuration and unsupported relationships.
A missing edge is not proof of dead code. scan_risks reports candidates,
not confirmed bugs. Verify findings with source and compiler/tests.
Use orient/expand for budgeted context and only reuse returned handles
within the same live session and repository.
Do not put source code, credentials or raw queries in usage logs.
~~~

## Patch-impact evidence

`scan_risks` compares the working tree with HEAD. An informational
`CHANGED_CALLEE_IMPACT` is a candidate for review, not a confirmed bug.
`caller` and `changed_target` identify the actual endpoint paths/symbols.
`base_edge` is historical proof; `current_edge` is one definitive live CALLS
proof for that exact current endpoint pair, with its repository-relative path,
byte span, source hash, resolver and relation confidence. Its span locates the
callsite, unlike `caller.span`, which locates the caller's definition name.
Interpret current evidence with the response `snapshot`, and baseline evidence
with `base_revision`. A proven relation does not prove a defect. Multiple
callsites for a pair are not exhaustively listed. Existing scan/result/source
budgets, `partial` and coverage gaps still apply; absent impacts are not
whole-program coverage or evidence of correctness.

## Small agent A/B protocol

Use a fixed task set with independently specified acceptance tests and expected
source evidence. Pin repository revision/patch, model, prompt, tool versions,
budget and cache policy. Run A (ordinary source discovery) and B (CGRX discovery
plus required source fallback) in separate clean copies. Alternate run order and
repeat paired tasks; keep failed/incomplete runs in the report.

Record **end-task correctness** first: acceptance-test results, source-supported
claims, false positives, missed expected impacts and completion status. Report
**whole-task token totals** for each arm from start through final verification,
including all model turns, tool results and retries; distinguish input, output
and cached tokens using the same accounting source. Mark unavailable counts
unknown, not zero. Compare paired totals only alongside correctness, with run
count and spread, not a token-savings claim from a single successful task.

Keep tool microbenchmarks separate: per-call latency, serialized response bytes,
warm/cold index state and repetitions diagnose tool costs. They do not measure
agent task correctness or total tokens. This protocol is a proposed experiment,
not measured A/B results.
