# TypeScript dependency reconstruction cost

Opening a retained TypeScript index rebuilt its dependency arcs by repeatedly
copying declaration facts and checking the complete augmentation and portability
inventories. On the largest frozen fixture (GD), this made endpoint startup take
about 23 seconds before any MCP query.

The reconstruction now borrows current facts, copies only stale valid facts to
withdraw their validity, and builds an immutable declaration resolver once per
pass. Augmentation guards are checked once for that pass. Portability results
are reused by the complete dependency chain and local/module policy; source,
target and configuration hashes are still checked for every resolution. Invalid
and stale candidate paths remain present. The cache is discarded when the pass
ends. Arc ordering compares borrowed evidence with the same ordering and dedup
semantics. No extraction, serialization or SCIP policy changes.

The experiment compares the reviewed declaration-dependency binary at commit
`9407e47e403c128946fc812c101e585416d47aed` with the optimized Rust sources.
Both use the opt-in JavaScript extraction policy 133. The baseline SHA256 is
`791b125d4733ea0828ac139574a7b73bb6c586bae7f2a6c4833bfdd7984ce2ba`;
the optimized experimental binary SHA256 is
`4ceb8014fd5188556eb55c97ef3732f830c5213f3a8584317b9b89e824450258`.
That binary embeds the previous skill documents. The alpha.17 release uses the
default extraction policy 125 and updated bundled skill documents; its artifact
has its own identity and release checks.

## Paired endpoint starts

All ten frozen corpus indexes retain policy 133, repository revision and source
hashes. Each role starts a fresh endpoint process with stdin EOF after opening
the index, three times per repository, in alternating order. Sixty observations
are retained without trimming. These are local macOS process timings with
uncontrolled filesystem/page caches, not cold-OS timings, query latency,
whole-agent cost or competitor comparisons. `/usr/bin/time -l` reports actual
process maximum RSS in bytes; the table converts that to MiB.

| Frozen repository | Before median seconds | After median seconds | Before median max RSS MiB | After median max RSS MiB |
| --- | ---: | ---: | ---: | ---: |
| c-fixtures | 0.007515 | 0.009636 | 7.859 | 7.859 |
| kotlin-fixtures | 0.005401 | 0.005558 | 7.859 | 7.812 |
| vocal-snapshot | 0.437841 | 0.176570 | 118.828 | 116.562 |
| blinker | 0.008903 | 0.008834 | 12.750 | 12.656 |
| itsdangerous | 0.012001 | 0.011587 | 16.938 | 16.984 |
| cgrx-b8 | 0.122730 | 0.121351 | 179.484 | 179.219 |
| gd-9d | 22.819081 | 6.366339 | 1591.172 | 1538.328 |
| pyramid-db | 0.032885 | 0.032173 | 41.203 | 41.609 |
| vex-da | 3.013585 | 1.245906 | 1009.734 | 1003.094 |
| gson-java | 0.128428 | 0.131200 | 156.906 | 158.500 |

GD's median startup falls from 22.819 to 6.366 seconds; VEX falls from 3.014 to
1.246 seconds. Smaller fixtures have mixed changes. GD's three before maximum
RSS observations are 1591.172, 1600.016 and 1590.422 MiB; after they are 1650.234,
1538.016 and 1538.328 MiB. The candidate's first observation exceeds every
baseline observation. This establishes a startup improvement on the large
fixtures, without a consistent memory improvement claim.

## Evidence preservation

Fresh indexes in all ten frozen repositories have identical complete documents,
arcs, coverage, TypeScript facts, resolution configuration and source hashes.
Fresh graph generations can change serialized snapshot bytes; equality is
checked on the complete inventories independently. The old indexes remain
unchanged and reopen under the same extraction policy.

The original frozen corpus remains 202/226: CALLS 145/146, IMPORTS 25/33,
REFERENCE 9/24 and UNRESOLVED with an owned gap 23/23. All requirements remain
in the denominator. No unmatched PROVEN edge occurs at the checked owned sites.
The 24 lexical distractors remain source provenance checks. These checks do not
establish whole-repository precision.

The official-compiler controls retain 21 exact targets and 25 explicit owned
refusals across all 46 cases. Public MCP replays retain the original TypeScript
slice at 10/11 and all controls in both `full` and `token-efficient` profiles,
including exact definition selection, source/snippet agreement and relation
filters. Pyramid's default `App` import remains a failed positive with an owned
gap. Schema size remains 4145 tokens against the 4150 ceiling.

| Verification | Passed | Skipped/ignored |
| --- | ---: | ---: |
| Python script tests | 192 | 2 |
| Default workspace | 939 | 9 |
| JavaScript workspace | 951 | 9 |
| Combined CLI/languages | 775 | 3 |

Format, default and JavaScript Clippy with `-D warnings`, and the JavaScript
release build pass. The default checks retain successful original logs whose
compiled inputs are hash-identical; Python/format and the interrupted JavaScript
checks were rerun with terminal results. Earlier incomplete logs are preserved.
The added test verifies that a reused augmentation inventory retains the same
refusals when blockers are added, removed or contain invalid facts.

Local ignored evidence is retained under
`local/evidence/competitive-20261007/corpus-recovery`, including
`typescript-memory-source-provenance.json`,
`typescript-memory-startup-prototype-3-paired.json`,
`typescript-memory-corpus-grade-reviewed.json`,
`typescript-memory-control-native-grade.json`, `typescript-memory-public-reviewed.json`
and `verification-summary-typescript-memory-complete.json`.
`reproduction-typescript-memory` contains the commands and independent graph,
compiler and public API checks. No overall competitor superiority is claimed.
