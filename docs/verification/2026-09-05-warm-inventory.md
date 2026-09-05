# IBO-271: real-source replay and warm inventory deduplication

Base: `3974bf3a7127a4563b15a3a59e3ba49249d93652` (includes const-arrow fix).
Branch: `perf/ibo-271-warm-config`.

The existing eight Go train CALLS assertions were replayed on a clean,
source-hash-verified VEX snapshot at the corpus revision. Only its canonical
local path was remapped; oracle, task IDs, splits and byte anchors were retained.
No heldout source was used for tuning. Both CGRX and CBM found all eight
specified targets. This is designated-target membership, not exhaustive CALLS
precision or finished agent task correctness.

The initial paired collector measured CGRX queries around 93–126 ms and CBM
around 25–34 ms. CBM uses a shared account daemon, so endpoint RSS is not engine
RSS. Engine RSS stayed null and strict comparison correctly exited 2 with
`failed or incomplete collection`. These eight training assertions also cannot
satisfy heldout corpus requirements. No overall superiority claim is made.

## Cause and change

Diagnostic-only profiling attributed about 22–25 ms to Git status and 66–72 ms
to TypeScript inventory validation on this mixed repository (8932 candidates).
The same candidate set was constructed twice per pass. Multiple named imports
or reexports of one module also repeatedly expanded identical candidate paths.

The runtime now builds candidates once and shares them with configuration
collection, and deduplicates module specifiers per source before expansion or
config mapping. Only pure in-memory work is shared. All Git checks, filesystem
reads, directory/config witnesses and final validation remain. Nothing is
cached across refreshes. Extraction revision remains 21 because semantics and
stored representation are unchanged. Diagnostic logging is not shipped.

## Release-to-release replay

Four alternating AB/BA rounds, eight fixed tasks, one warmup and five timed
requests per task: 160 requests per arm. Setup and validation are outside query
timing; disk/OS caches remain warm. No task-owned builds/tests ran concurrently.
The machine was not exclusively reserved. Every full response was compared,
including target spans, snapshots, coverage and model-visible text.

| Run | Baseline median | Modified median | Baseline p95 | Modified p95 |
| --- | ---: | ---: | ---: | ---: |
| Initial screen | 109.65 ms | 96.64 ms | 134.50 ms | 242.67 ms |
| Diagnostic replication | 101.92 ms | 89.45 ms | 108.43 ms | 93.15 ms |

Median improved about 12% in both runs. Initial p95 FAILED the no-regression
screen: a burst in modified round 0 reached 603.62 ms. Baseline also had a later
burst. The cause of those stalls was not established; no samples were discarded.
Replication is reported separately and does not erase the first failed screen.
A stable tail-latency acceptance claim remains open.

All 640 timed responses were identical per task across builds and runs. Source
snapshots and binary hashes were stable. Each arm returned 75940 raw response
tokens per run, unchanged. Replication also observed about 14.5% lower median
CGRX process CPU counter delta and zero page-ins in both arms, using macOS
proc_pid_rusage V0. These raw CPU counter ratios exclude child Git CPU and do
not establish the cause of the earlier stalls. No cold-start, whole-agent,
whole-process-tree-memory or general market performance claim is made.

## Verification and retained gates

- RED cost regression: two candidate constructions versus required one.
- GREEN: one construction and one expansion per distinct module per pass;
  a target created between passes is still detected as a presence blocker.
- Workspace: 540 passed, zero failed, 8 ignored.
- Clippy `-D warnings`, release build, formatting and diff check passed.
- Python: 115 run, 2 skipped, no failures. Unchanged relationship corpus:
  8 TP / 0 FP / 0 FN. MCP smoke and scope/pagination smoke passed.
- Isolated baseline archive with the final regression test and test-only
  counters reproduced the original two-versus-one failure (exit 101).
  The modified working source and measured binaries were not altered.
- Existing freshness, alias, ignored competitor, race and source mutation tests
  remain in the workspace suite.
- CGRX changes scan returned no candidates with partial coverage; exact source
  was reviewed. Empty findings are not proof of absence of bugs.

Raw measurements, preregistered protocols, replay harnesses, profile, validation
logs and rollback evidence are local under
`local/evidence/IBO-271-REAL-REPLAY-20260905/` in the primary checkout.
IBO-271 remains In Progress. Stable p95, a controlled CBM memory comparison,
plain-source/CGRX/CBM agent end-task experiments and release gates remain open.
No client binary/configuration replacement or publication was performed.
