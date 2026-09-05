# IBO-271: preserve the user's Git index during read-only refresh

Base: `be81f1d005043be3730050d496496e0613fc5839`.
Branch: `fix/ibo-271-readonly-git`.

Refreshing an unchanged source file after its mtime changed caused ordinary
`git status` to persist stat-cache metadata in the user's Git index. This was
reproduced in both primary and linked worktrees. The runtime's read-only
`git_bytes` helper now sets `GIT_OPTIONAL_LOCKS=0` on its child commands only.
No user configuration is changed. Extraction revision remains 21.

Regression tests compare actual index bytes before and after metadata-only
refresh, check unchanged snapshots and source bytes, then verify that changed
content is still discovered while an existing `index.lock` sentinel is preserved.
Both tests failed against the original helper and pass with the change.
Existing staged, HEAD-change and freshness tests remain in the full suite.
Disabling persisted stat-cache updates can require repeated content checks after
metadata-only changes; this is a read-only behavior fix, not a speed claim.

## Phase replay

Four preregistered three-arm permutations, eight unchanged VEX train CALLS
assertions, one warmup and five timed requests per task: 160 requests per arm.
Git Trace2 was enabled for every arm. Each request had exactly one successful
Git status exit; source and binary hashes stayed unchanged. No task-owned
builds or tests ran concurrently, but the host was not exclusively reserved.

| Release | Request median | Request p95 | Git median | Git p95 |
| --- | ---: | ---: | ---: | ---: |
| Original `3974bf3` | 94.36 ms | 103.31 ms | 12.43 ms | 14.71 ms |
| Inventory dedup `be81f1d` | 83.31 ms | 92.76 ms | 12.57 ms | 14.85 ms |
| Read-only Git candidate | 84.43 ms | 94.37 ms | 12.69 ms | 14.71 ms |

All 480 full responses were identical per task, including provenance, spans,
coverage and model-visible text. Each arm returned 75940 raw response tokens.
The candidate was about 1.3% slower at median and 1.7% slower at p95 than dedup
in this diagnostic run. No speed improvement is attributed to this fix.
Trace2 time excludes process spawning; the residual includes transport,
inventory and query work. This run did not reproduce or explain the earlier
large stalls. It does not erase the failed uninstrumented p95 screen recorded
in the preceding warm-inventory report. Stable tail-latency acceptance remains
open, as do controlled CBM engine-memory and whole-agent comparisons.

## Verification

- Rust workspace: 542 passed, zero failed, 8 ignored.
- Clippy with warnings denied, release build, formatting and diff checks passed.
- Python: 115 run, 2 skipped, no failures.
- Release MCP smoke and scope/pagination smoke passed; unchanged relationship
  corpus: 8 TP / 0 FP / 0 FN.
- CGRX changes scan returned no candidates with partial coverage; exact helper
  and test source were reviewed. This is not proof of whole-program absence.
- Initial full build attempts hit disk exhaustion. Their failure logs were
  retained; only task-owned rebuildable caches were removed before successful
  complete reruns. Cleanup is documented in the evidence directory.

Raw traces, response samples, hashes, protocol, RED/GREEN and validation logs
are under the primary checkout's local directory
`local/evidence/IBO-271-READONLY-GIT-20260905/`.
This is a local development commit; no client replacement, publication or
release has been performed. IBO-271 remains In Progress.
