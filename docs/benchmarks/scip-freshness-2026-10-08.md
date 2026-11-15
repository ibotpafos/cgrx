# Managed SCIP freshness and real Rust receiver evidence

A managed server previously reused the same SCIP file after Git HEAD changed.
With real rust-analyzer output whose document text was omitted, changing
`caller(worker: A)` to `caller(worker: B)` preserved all byte positions but left
an incorrect `PROVEN / SCIP_CONFIRMED` call to `A.work`.

Live serving now withdraws the previous semantic proofs when HEAD changes and
rebuilds native evidence. A different compiler artifact can restore semantic
edges when indexed working sources match committed HEAD. Republishing identical
bytes cannot restore the old proof. The importer checks the expected input hash
before publishing its generation and refreshes working sources again afterward.
Missing or truncated artifacts return typed errors; a completed publication can
recover without restarting the server. Semantic policy revision 3 persists the
accepted input hash and quarantines old or incomplete semantic caches. Native
extraction revision 101 and native generation encoding are unchanged.

This guards automatic reuse and publication races. Omitted document text does
not attest source content: the producer must supply an artifact generated for
the current source, including the first explicit import and later updates.
Changing artifact bytes alone is not a proof of source freshness. Changes to
compiler inputs outside indexed source/config coverage remain a limitation.

## Compiler inputs

The official [rust-analyzer 2026-10-05 release](https://github.com/rust-lang/rust-analyzer/releases/tag/2026-10-05)
is pinned as `0.3.3073-standalone (65ac641199 2026-10-04)`. Its ARM64 macOS archive
matched GitHub's published SHA-256. The binary and standard-library source copy
are isolated in the evidence directory. The first export automatically added
`rust-src` through rustup; its original installed component set was restored.
Subsequent runs use the isolated source copy and offline Cargo inputs.

Two unchanged provider outputs belong to compiler-checked reduced sources A
and B. The sources differ only in the receiver parameter type, with identical
byte lengths and declaration/call positions. The real provider also resolves
an inherent local `Reader.options` call. These raw `.scip` files, source, and
provenance are checked into `tests/fixtures/compiler-scip-receiver`.

A second export uses the original frozen CGRX repository at
`b8d828524b903abeb053db9faef5abba40fea509`. Its default `cgrx-cli` library passed
`cargo check --offline --locked`; source files and commit stayed unchanged.
The 79-document SCIP contains a reference to the exact `Reader.options`
definition at line 312 from the existing call at line 437. It also carries 13
trait-method metadata entries. An independent semantic state imports 372 edges;
only the explicitly curated sites below are graded.

Exports warned that offline sysroot metadata lacked `r-efi-alloc`; the larger
export also reported duplicate symbols. Successful export does not establish
complete sysroot, workspace configuration, or imported-edge coverage.

## Fixed public observations

The live comparison uses the saved policy-2 release built from `0b827027ad74`
and the checked policy-3 candidate, on identical source and SCIP inputs in both
`full` and `token-efficient` response profiles. Every chosen target is selected
with its exact symbol reference; declaration, caller, callsite and source hash
are checked without putting queries or references into result logs.

| Stage | Saved policy-2 server | Checked policy-3 server |
| --- | --- | --- |
| Initial compiled A source and A SCIP | Exact `A.work` proof | Exact `A.work` proof |
| Commit compiled B source, keep A SCIP | Wrong `A.work` proof | Semantic proof withdrawn |
| Atomically republish identical A bytes | Wrong proof retained | Proof remains withdrawn |
| Publish real B SCIP, same live process | Old proof retained | Exact `B.work` proof restored |

For six previously curated receiver assertions in unchanged real CGRX, the
native state matches 4/5 positive calls. With the real SCIP, the hybrid state
matches 5/5: the added call is `collect → Reader.options`, span `15744..15776`.
The callback abstention remains a dispatch gap with no proven call. This result
checks the complete caller, target, callsite, source hashes and absence of proof
assumptions at these six sites. Native receiver inference remains 4/5.

A real cache written by the saved policy-2 executable is refused by the checked
candidate and rebuilt at the same source commit using identical SCIP bytes.
The old generation is preserved. The native replay retains ten saved indexes,
eight compiler-checked Go cases, and the 226 original source assertions; source
assertion validation does not grade broad negative or ownership quality.

## Verification and reproduction

Four new freshness regressions cover live HEAD changes and recovery, deferred
import during dirty source changes, interrupted publication, and refusal of
changed input before generation publication. Nine existing SCIP resolution
regressions are retained, including current-policy caches with a missing input
hash.

| Check | Passed | Ignored |
| --- | ---: | ---: |
| Default workspace | 910 | 9 |
| JavaScript workspace | 922 | 9 |
| Combined JavaScript/PHP/Swift CLI and language packages | 747 | 3 |

Format, both workspace Clippy profiles with `-D warnings`, and the JavaScript
release build are required for the checked artifact. Source hashes are frozen
before the checks and verified again before the executable is copied.

Local reproduction and hashed evidence live under
`local/evidence/competitive-20261007/corpus-recovery`:

- `reproduction-scip-freshness/verify_checked.py` and
  `verification-summary-scip-freshness-checked.json` bind the final source and checks.
- `reproduction-scip-freshness/public_compiler.py` and
  `scip-freshness-public-compiler.json` replay the unedited A/B compiler inputs,
  both profiles and actual policy-2 cache migration.
- `reproduction-scip-freshness/public_reader.py` and
  `scip-freshness-real-reader.json` grade the frozen receiver sites through the
  stored graph and public API.
- `reproduction-scip-freshness/public_native.py` and
  `scip-freshness-public-selections.json` check retained native snapshots and
  original source assertions.
- `compiler-scip-20261008` preserves provider pins, raw outputs, compile/export
  logs, the original failing probe, and intermediate test failures.

These are bounded correctness improvements. Independent comparable competitor
agent tasks, complete corpus negative/ownership grading, and whole-task latency,
RSS and token costs remain open. No overall competitor superiority is claimed.
