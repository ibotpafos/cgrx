# Project-fit baseline: our repositories

This is a product baseline, not a claim of agent speedup. The observations
below used the registered CGRX MCP server against the named worktrees on
2026-09-28. Source revisions and working trees can change; rerun each canary
before comparing a candidate build. The private `cgrx` repository is a
container, not the product source; product source is `cgrx-opensource`.

| Project | Revision | Reproducible limitation |
| --- | --- | --- |
| My DAW | `4cc8bff` | 30/30 sampled Swift/C++ files were `excluded`; `scan_risks` returned one graph change path while `git diff --name-only HEAD` returned 97 tracked paths. `apps/macos/CommandPalette.swift` is a canary. |
| VocalClean Live | `40a3ddf` | 22/26 sampled primary DSP source/test paths were `unknown`, three `excluded`, one `partial`; the risk scan returned 17 paths while Git returned 130 tracked paths. `VocalCleanLive/Source/DSP/LiveCleanEngine.cpp` is a canary. |
| GD Music | `78bc9b7` | `find_usages` returned no callers for `buildRoyaltyCalculationXlsx`, while its route and tests call it directly. |
| VEX VPN | `c7d630f` | `find_usages` returned no callers for the support-panel `requestRefund`, while a JSX `onClick` calls it. UI, MCP and Go refund routes also require literal-route search. |

Sampled path statuses are *not* a whole-repository coverage percentage. Graph
gaps are not proof that a relation is absent. The production language registry
at `d74293b` exposes C, Go, Java, Kotlin, TypeScript, Python and Rust; C++ and
Swift packs exist only as unvalidated prototypes. Do not enable them merely to
increase indexed counts. The existing real-task corpus has 226 mostly atomic
relationship assertions and no current My DAW or VocalClean Live snapshot.

## First acceptance slice

1. Every changed first-party path must either appear in the graph change set
   or as an explicit, counted `UNINDEXED_CHANGED_PATH`/other coverage gap. An
   empty finding list must never silently stand in for an unindexed C++/Swift
   change. The current patch fixes this for `scan_risks`, not for all tools.
2. Promote C++ and Swift only after source-pinned positive and negative cases
   from DAW and VocalClean validate definitions, calls, header relations and
   uncertainty. This is separate from the concurrent Swift evidence work.
3. Add source-pinned GD/VEX cases for imported TS aliases, JSX callbacks,
   route handlers and tests. A route-string match may be a *candidate*, never
   an invented proven CALLS edge.
4. For each project, freeze 10–15 actual maintenance tasks and independently
   verify final patches. Compare ordinary discovery versus CGRX plus required
   source fallback on identical snapshots. Record correctness first, then
   whole-task time, tokens, source reads and retries. Do not infer savings from
   graph size or tool latency alone.

The local verification record for the first `scan_risks` correction is under
`/Volumes/D/Projects/cgrx-move-evidence/project-fit-20260928/`; the baseline
test fails, the patched test passes, a rollback copy fails identically, and
the re-applied patch passes.

## C++ definition canary (test-only)

Reduced definition shapes from DAW's `engine/audio/clip.cpp` and VocalClean's
`VocalCleanLive/Source/DSP/LiveCleanEngine.cpp` exposed a concrete prototype
gap: only `Clip` and `prepare` were extracted from five expected definitions.
The test-only C++ pack now emits all five names, including free functions and
qualified methods; its own registry policy test still confirms `.cpp` files
are excluded from production. This does **not** validate call resolution,
header relations or a project-wide coverage claim. Those remain promotion gates.
