# Go indexed-field receiver evidence — 2026-10-08

CGRX proves a local Go method call through a binding such as
`shard := &l.shards[i]` when the explicit array/slice element and direct target
method are uniquely declared in the same source file. The receipt binds owner,
caller, field, element, target, collection, statement, binding, initializer and
receiver spans to the current source hash. Runtime rebuild verifies exact
declarations and receiver signatures. Both named and unnamed target receivers
are supported.

The binding must be a single top-level short declaration before the call.
Reassignment or another binding of that name, receiver shadowing, closures,
interfaces, aliases, imported/generic/pointer elements, named containers and
method promotion remain outside this proof. Writes to a field or an element do
not rebind the receiver. This extends existing Go field receipts and binding
checks without adding a dependency.

The [Go specification](https://go.dev/ref/spec#Index_expressions) defines an
array/slice index expression's type as its element type. Its
[method-set rules](https://go.dev/ref/spec#Method_sets) describe the declared
methods available on the element and its pointer. The existing compiler-backed
alternative is CGRX's SCIP bridge with an indexer such as
[scip-go](https://github.com/scip-code/scip-go); it remains appropriate for wider
semantic resolution. The native extension uses the already installed Go grammar
for this explicit local subset.

## Frozen source case and comparison

The repository is the unchanged Vex snapshot
`da5cd1a21f8f4650798cc19c92ff8790b324e6d3`. The retained assertion is
`vex-ratelimit-allow-cleanup`: `Allow` at lines 47–71 calls
`cleanupLocked` at line 58, whose declaration begins at line 73 of
`internal/ratelimit/ratelimit.go`.

The task's original anchors, hashes and split label are retained. Its complete
source was inspected during implementation, so this measurement is
implementation-informed evidence rather than a blind heldout result.

| Observation | Previous CGRX | Current CGRX | CBM 0.10.8, full index |
|---|---|---|---|
| Anchored cleanup call | Missing | Exact target/site and current-hash receipt | Target membership; heuristic 0.9 |
| Direct `Run` target from `Allow` | Absent | Absent | Returned at heuristic 0.07 |

The complete frozen `Allow` body contains no `Run` call or selector. The latter
CBM result is therefore an extraneous returned target for this depth-one source
trace. It does not measure CBM's whole-graph precision. Its target observation
also lacks CGRX's exact callsite receipt, so the two evidence scopes remain
separate. The interface `ctx.Err()` call is not graded as a static concrete call.

CGRX's compact `find_usages` response exposes the exact cleanup definition and
callsite. Its compact outgoing trace contains three proven local targets:
`cleanupLocked`, `bucketExpiry` and `shardIndex`.

## Preservation and compiler checks

All ten frozen indexes were freshly rebuilt with the final binary. Exact
relationship-set comparison removes zero previous arcs and adds exactly one
`CALLS` arc in Vex. That added arc passes strict source-curated grading and the
compact public MCP check. The original Rust cohort remains 4/5 with its callback
abstention respected; all three earlier supplemental Rust proofs and all 24
selected Python import assertions continue to pass.

Eight independently compiled and executed constructed programs use Go
`go1.27.0 darwin/arm64`. Six expected targets pass native grading; shadowed and
interface-element bindings retain explicit dispatch gaps. All eight policies
also pass public MCP checks with the full response profile, which exposes
target spans even when an unrelated method has the same name in that file.
These are regression fixtures, not independent competitive evidence.

The first prototype missed the unnamed target receiver in native grading:
5/6 positives and 2/2 abstentions. The signature helper incorrectly required a
receiver binding name. That defect was fixed, all six positives were retained,
and final suites, indexes and public checks were repeated. Prototype artifacts
are preserved separately from the final binary and manifests.

The final workspace passes 886 default tests and 898 with JavaScript; both
Clippy profiles pass with warnings denied. The combined CLI/language profile
with JavaScript/PHP/Swift passes 725 tests. Dependency-feature unification passes,
and 24 evaluator-integrity tests reject missing, damaged and inconsistent
receipts or false clean abstentions.

## Provenance and limits

The previous binary is
`b2124d3b53acb6769f2d3185cd1ec37d86ccf2140b48723527a876040ec5844b`.
The final Go binary is
`fea505b44dea108758901a2860f3b20af9e525d01d5fa0323a7d07f5fa0bd6d2`.
CBM's binary is
`996bad5fe6fb89c0c50363d87f03dc78f6e536aeea746c06679a294d14eca435`.
The native extraction revision is base 93 plus PHP 2, Swift 4 and JavaScript 8;
the measured build uses 101. JavaScript remains opt-in.

Evidence is saved under the ignored local directory
`local/evidence/competitive-20261007/corpus-recovery/`:

- `index-manifest-go-indexed-fields-reviewed.json` pins all ten final indexes.
- `go-indexed-field-relationship-delta-reviewed.json` preserves the exact delta.
- `go-indexed-field-original-task.json`, `go-indexed-field-before.json` and
  `go-indexed-field-after-reviewed.json` retain and grade the original assertion.
- `cgrx-go-indexed-field-public-observations-reviewed.json` and
  `cbm-go-indexed-field-observations.json` record public observations and coverage.
- `go-indexed-field-compiler-evidence-reviewed.json` retains compiler outputs,
  six native positives, two abstentions and all eight public full-profile checks.
- `go-indexed-field-source-provenance.json` and
  `verification-summary-go-indexed-fields.json` record source, binary and log hashes.
- `reproduction-go-indexed-fields/` contains the local reproduction scripts.

Reproduce the strict source-case grade with:

```bash
python3 scripts/eval_curated_index.py /path/to/go-indexed-field-original-task.json \
  /path/to/final-state --go-indexed-fields --output /path/to/report.json
```

The original 226-assertion source corpus remains intact. Its diagnostic CALLS
target-membership result improves from 144/146 to 145/146, with Vex at 30/30.
The remaining missed target is Rust's local constructed `reader.options`.
This diagnostic does not grade all negative cases or establish precision.
Broader import/reference
ownership, negatives, independent cases and paired latency/memory/agent-token
costs still need grading. A risk scan was partial and hosted workflows have not
run locally. Overall superiority over competitors is not established.
