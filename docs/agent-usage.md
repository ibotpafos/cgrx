# Agent skill

CGRX ships the reusable `cgrx-code-discovery` skill instead of requiring a
large permanent block in `AGENTS.md`. Install or update it with:

~~~sh
cgrx skill install
~~~

The skill uses OpenAI's progressive-disclosure layout: a concise trigger in
`SKILL.md`, detailed change-verification and budgeted-context references, and
`agents/openai.yaml` metadata declaring the registered `cgrx` MCP dependency.
Its source is under
`crates/cgrx-cli/assets/cgrx-code-discovery` and is embedded in the executable,
so the installed workflow always matches that CGRX build.
The layout follows the
[official OpenAI skill documentation](https://developers.openai.com/codex/skills).

The command writes to `$HOME/.agents/skills/cgrx-code-discovery`. It also
migrates the earlier marked `cgrx-agent` block out of
`$HOME/.codex/AGENTS.md`, preserving all unrelated rules and saving the
pre-migration file as `AGENTS.md.cgrx-backup`.

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

## Change verification plan (development)

`scan_risks(repo, mode="changes", limit=20)` now includes `verification_plan`.
It is a read-only checklist, not a test runner:

- `review_findings` and `review_impacts` are zero-based references into the
  response arrays: inspect those candidates and their evidence first.
- `related_tests` contains **test candidates** selected by conventional symbol
  or file names, connected by one or two current, proven CALLS edges to a
  returned changed-callee impact. `impact_index` identifies the changed target;
  `call_chain` runs from the candidate toward it. Each proof has a current
  source hash and callsite span. This is structural dependency, not proof that
  a test asserts the changed behavior or is discovered by a runner.
- `test_reach` is a per-impact summary that improves on a yes/no reach flag.
  `candidate_paths_found` means at least one convention-selected candidate has
  a current, source-verified one- or two-edge CALLS path. The referenced tests
  carry `reach.status=proven_call_path` and exact depth. Test identity remains
  `convention_candidate`, `behavioral_coverage` remains `unknown`, and
  `execution_status` remains `not_run`. `no_candidate_in_bounded_graph` is an
  abstention within the two-edge budget, not evidence that no relevant test
  exists.
- All selected endpoints are checked against indexed file hashes. Stale source,
  material parser/stale/exclusion gaps and exhausted source budgets suppress
  affected candidates. An unrelated dynamic-dispatch gap keeps the plan partial
  but does not erase an independently proven positive CALLS edge.
- `execution_status="not_run"` means **no test was executed**. Confirm candidate
  identity, inspect its assertions and use the repository's test instructions.
  The tool deliberately does not guess commands, workspace packages or flags.
- Recorded runs are opt-in execution evidence: build a `TestRunRecord` with
  the literal `runner_command`, the exact 40-hex `revision` the runner
  executed against, and per-test `results` (`path`, `symbol`, `passed` /
  `failed`, plus the `source_hash` copied from the scanned `related_tests`
  entry). Pass it to `scan_risks_with_test_runs`. A result annotates a
  candidate only on exact revision match **and** exact file-hash match; a
  fresh `failed` wins over `passed` so failures are never masked. Anything
  stale or mismatched keeps `not_run`, exactly as a scan without runs.
  Annotated candidates carry `execution_status="passed"|"failed"` and an
  `execution` object (`runner_command`, `revision`, `status`); the top-level
  `execution_status` becomes `passed`, `failed` or `partial` (only some
  candidates covered). `test_reach` entries are annotated per impact the same
  way. Refresh the scan after further edits — recorded hashes go stale.
- `partial` inherits scan uncertainty; `truncated` specifically reports the
  test-candidate output cap. Each result array is bounded by `limit`; the two
  arrays do not share one combined cap. See top-level `coverage_gaps` and counts.
- `complete_test_suite=false` always. `no_candidates_in_bounded_graph` does not
  mean no tests exist. Selection starts from returned baseline-backed impacts:
  newly added/removed symbols, paths beyond two calls, unsupported framework
  callbacks, Rust attributes without naming hints and unresolved imports may
  require manual discovery. `review_changed_paths` reminds the agent to inspect
  the changed-path list independently of graph findings.

Reusable agent instruction:

~~~text
After editing, call scan_risks with the same canonical repo and a small limit.
Inspect review_findings and review_impacts using their response-array indices.
For related_tests, verify candidate identity and assertions, then choose test
commands from repository instructions. Record actual command results separately;
never translate not_run into passed. Read changed paths and coverage gaps even
when related_tests is empty. Refresh after further edits; do not reuse old spans.
~~~

This first slice has bounded regression/MCP tests, not a measured improvement
in end-task agent accuracy or total token consumption.

Positive impact evidence is independent of unrelated unresolved calls in the
same file: those gaps keep `partial=true`, but do not erase an existing proven
CALLS relationship. Both caller and changed-target source hashes are checked
before emitting an impact. Parser/stale/exclusion gaps still suppress affected
impacts. Removed-target findings remain stricter: any relevant baseline/current
coverage gap prevents an absence-based candidate.
