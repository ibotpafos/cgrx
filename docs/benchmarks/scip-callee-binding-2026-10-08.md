# SCIP callee binding and cache migration, 2026-10-08

The previous import policy could prove `caller -> helper` for
`worker.work(helper)` solely because SCIP referenced the callback argument.
When SCIP supplied both `work` and `helper`, it instead lost the valid method
edge. Discarding unresolved alternatives could also turn ambiguity into a
`SCIP_CONFIRMED` edge.

The reviewed change binds a semantic reference to the exact lexical callee
range obtained from the existing Tree-sitter pack. It selects one semantic
identity before looking up graph targets, preserving unknown, local and marked
polymorphic alternatives. Receivers, type arguments and arguments do not resolve
an enclosing call. Calls with unsupported syntax or parser errors remain open.
References are sorted once per file and exact-range lookup uses binary search.

SCIP resolution policy **2** participates in the semantic generation hash.
Opening a legacy semantic cache returns `scip_resolution_revision`; a managed
server can rebuild native evidence or use its supplied SCIP file. Existing
native extraction policies and their generation identities are unchanged.

SCIP references express symbol locations rather than call edges, and document
text is optional. This motivates the callee-range check; source freshness still
depends on generating SCIP for the indexed revision when text is omitted.
[SCIP schema](https://github.com/scip-code/scip/blob/main/scip.proto),
[rust-analyzer SCIP exporter](https://github.com/rust-lang/rust-analyzer/blob/master/crates/rust-analyzer/src/cli/scip.rs).

## Source and fixed inputs

Baseline source: `8c0ab75e8617b74df38d1c0d8ee6b1529ac16b45`.
Candidate: the reviewed SCIP binding diff on this baseline, with SHA-256 hashes
of the tested Rust files recorded in the local source-provenance artifact.
No dependency versions, package installations, MCP configuration or installed
server were changed.

| Artifact | SHA-256 |
| --- | --- |
| Baseline release executable | `9a602476215a4eb93d4025dda5f930fe8a0b99729f5f70c1029ee4ec7d28492b` |
| Candidate release executable | `6ac211f5853be78fcf7f57cc1306b33182d0da546c2bd3f157303b640c97f84a` |

Eleven fixed SCIP inputs were deliberately serialized with the existing
`scip = 0.10.0` crate. The Rust compiler successfully checked their source
fixture. **Their semantic indexes are synthetic, not rust-analyzer output.**
Unknown identities, local alternatives, partial ranges and contradictory trait
metadata are import-policy tests; they do not grade real negative-call quality.

## Public MCP results

Each input ran through the actual baseline and candidate executables, in both
`full` and `token-efficient` profiles. `status` preceded discovery, and the
queries checked exact incoming targets, complete call-site byte ranges and
preserved nested native calls. Definition bodies and snippet source hashes
matched the frozen source; stored proof source hashes were checked independently
against hashes emitted by the fixture encoder. Result artifacts contain no raw
queries, symbol references or source excerpts.

| Fixed input | Previous semantic proof | Candidate semantic proof |
| --- | --- | --- |
| Callee only | `work` | `work` |
| Callback argument only | `helper`, wrong enclosing target | Gap |
| Callee and callback argument | Gap | `work` |
| Unknown competing callee identity | `work`, unsupported uniqueness | Gap |
| Local competing callee identity | `work`, unsupported uniqueness | Gap |
| External trait metadata | `work`, marked polymorphic | Gap |
| Duplicate identity, omitted text, callback argument | Gap | `work` |
| Nested argument reference | `helper`, wrong enclosing target | Gap; native `helper()` retained |
| Receiver call reference | `maker`, wrong enclosing target | Gap; native `maker()` retained |
| Partial callee-name range | `work`, insufficient range | Gap |
| UTF-16 callee and argument after a supplementary character | Gap | `work` |

Per profile, the candidate resolved **four designated semantic targets**,
preserved **seven gaps** and retained **two exact native nested calls**.
This removes three wrong enclosing-call targets, withdraws four unsupported
proofs and recovers three valid method references in this controlled input set.

The baseline executable also created an actual legacy semantic cache. The
candidate refused to serve it, then reindexed at the same Git commit using the
same SCIP bytes. Its new snapshot and arcs matched a fresh candidate index,
while the pinned old generation remained unchanged. Integration tests also
cover legacy, previous and future policy revisions, a misleading zero edge
counter, repeat indexing and managed startup without a supplied SCIP file.

## Compatibility and validation

The retained native replay kept all ten saved indexes' node and edge segments
unchanged. Eight existing Go compiler cases still yielded six exact selections
and two abstentions in both profiles. All **226** frozen corpus source assertions
were revalidated, with corpus SHA-256 unchanged:
`d3c1d686392f835000c0db40b58b85e36b54fa4b4ea0f1467457661f2ba935a9`.
Schema count remains **4137** tokens under the existing **4150** ceiling.

| Check | Passed | Ignored |
| --- | ---: | ---: |
| Default workspace tests | 906 | 9 |
| JavaScript workspace tests | 918 | 9 |
| CLI/languages with JavaScript, PHP and Swift | 743 | 3 |

Formatting, both default and JavaScript all-target Clippy checks with
`-D warnings`, and the JavaScript release build passed. Three lexical-range
tests exercise all seven production packs and the three opt-in packs; nine
SCIP integration tests pass. The original focused run preserved three failures
against the old import policy before the implementation changed.

Local artifacts are under
`/Volumes/D/Projects/cgrx-opensource/local/evidence/competitive-20261007/corpus-recovery/`:

- `verification-summary-scip-callee.json` and `verification-scip-callee/`
- `scip-callee-source-provenance.json`
- `scip-callee-public-plan.json` and `scip-callee-public-regressions.json`
- `scip-callee-public-selections.json`
- `reproduction-scip-callee/{verify.py,public_native.py,public_scip.py,encode_scip.rs}`

## Remaining evidence

This is a bounded correctness and compatibility result. It does not establish
an overall advantage over competitors, real compiler-index coverage, agent-task
latency or memory savings. The real local Rust `reader.options` receiver case
remains unresolved by native extraction. A usable rust-analyzer executable is
absent in this environment; no analyzer was installed. Real provider output,
trait metadata and omitted-text freshness need further validation. Independent
competitor comparisons, broad negative grading and whole-task resource
measurements remain open requirements of the active goal.
