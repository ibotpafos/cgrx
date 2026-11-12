# Continuous quality index and triage

## Contract gate

`npm ci --prefix scripts/mcp-contract --ignore-scripts` followed by `node scripts/mcp-contract/run.mjs target/release/cgrx`. The pinned official MCP SDK 1.25.2 validates every advertised tool in full and token-efficient profiles. Unknown/new tools without a fixture case fail the gate. Successful compact responses must have equal structuredContent and text JSON. Explicit negatives cover a missing runtime-evidence file and the intentionally unconfigured optional GitHub bridge. Temporary repositories and lexical-only memory keep the test local and isolated. The integration CI job runs this on Linux and macOS; local execution does not claim a remote CI run.

## Producer and incremental work

Each managed repository starts a cancellable worker when opened by MCP. A cross-process file lease elects one producer per managed state; standbys take over on a later poll. Default polling is 2 seconds; CGRX_QUALITY_POLL_MS accepts 100..60000 ms. Runtime refresh uses existing source fingerprints and graph extraction. The producer memoizes AST hardcode sites and declaration visibility by indexed file hash, and removes deleted paths from its memo. Unchanged supported files reuse their facts without AST reparsing. Candidate graph context and bounded duplicate search are recomputed globally on a changed snapshot to avoid invalid reverse dependencies; this is file-fact incremental, not a fully incremental graph/pair algorithm.

Bounds retain the MVP's 500 files, 2,000 definitions, 20,000 duplicate pair budget, per-kind 300 candidates and 100 hardcode sites/file. Worker analysis has a 10-second deadline and cancellation checks between bounded units. Repo refresh/reindex has the existing runtime bounds; the analysis deadline does not interrupt native parser calls or Git refresh. Drop signals cancellation, wakes the worker and joins it. Snapshots prevent stale caches being served; publication is atomic. Source/triage/index locks serialize processes. Status/health errors are explicit.

`get_quality_index_status {repo}` reports phase, snapshot, fresh, producer_pid and analysis.parsed_files/reused_files. Index state and memo are in quality-candidates-v1.json and quality-file-facts-v2.json under managed state, not source files. A foreground request can synchronously fill a not-yet-ready snapshot.

## Decisions

`update_quality_candidate_status {repo,candidate_id OR finding_id,status,expected_version,reason}` supports new/confirmed/dismissed/fixed. The initial version is 0; initial detections are persisted, so a stable finding_id can be used after the code is fixed and its candidate disappears. Every write uses a file lock, atomic replacement and per-finding compare-and-swap. Dismissed/fixed require a reason of at most 1000 UTF-8 bytes. A stable finding_id is separate from snapshot-bound candidate_id. Unrelated edits preserve decisions; changed finding content reopens it as new. Up to 20 recent history entries are retained. Corrupt triage JSON is not silently overwritten.

`list_quality_candidates` hides dismissed/fixed by default. Use status, include_resolved and include_inactive to inspect decisions/history. A finding absent from a bounded/partial index is not automatically proved fixed. `fixed` is an explicit user-reported resolution, with still_detected=true while it remains in current detection. A substantive change reopens even a manually fixed finding. Pagination snapshot describes code; restart pagination after mutating triage.

Triage state is quality-finding-states-v1.json, separate from disposable graph caches. No source literals are retained: site facts carry offsets, identifiers and content hashes. Patch preparation remains review-only and never deletes unproven dead code or changes source automatically.
