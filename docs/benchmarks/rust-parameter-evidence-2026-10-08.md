# Rust parameter receiver evidence — 2026-10-08

Development builds prove method identity for a named, explicitly typed Rust
parameter when its receiver type matches the first method-lookup candidate
of a unique same-module inherent method. The stored receipt includes the
parameter, binding, receiver type, use site, owner, caller, target and target
impl ranges, bound to the full source hash. It survives reopening and is
recomputed when the parameter's type changes.

This extends the existing Tree-sitter Rust 0.24.2 extraction and receipt
validation; no new dependency or external configuration is needed. The
existing optional SCIP bridge remains available for broader type resolution.
This source proof does not perform Rust type checking.

## Lookup boundary

The Rust Reference specifies ordered receiver candidates and gives inherent
methods precedence over traits at each candidate. A trait method can still
win at an earlier candidate before an inherent method requiring autoref.
See [method-call lookup](https://doc.rust-lang.org/reference/expressions/method-call-expr.html).
Consequently, `value: &A` can prove a matching `run(&self)` declaration,
`value: &mut A` a matching `run(&mut self)`, and `value: A` a matching
`run(self)`. Later candidates remain unresolved.

Only local nominal structs/enums without type/const parameters or lifetime
bounds are eligible. Unbounded lifetime parameters preserve owner identity.
Derive attributes on the owner are allowed for this first-candidate proof:
they append items and cannot replace that declaration, while newly introduced
traits cannot preempt the matching inherent method. This exception is specific
to the parameter proof. See [derive expansion](https://doc.rust-lang.org/reference/procedural-macros.html#derive-macros).
Replacing or conditional owner/impl/caller attributes, unknown parameter
attributes, competing declarations/impls, aliases, qualified types, destructured
parameters, closures, shadowing and unexpanded macros in the caller remain
blockers. Parser errors in the enclosing module also block the proof.

Eight constructed examples compiled and executed under Rust 1.89.0 validate
this boundary. Six select the intended inherent target and receive native
proofs; two select trait targets at earlier candidates and retain native
dispatch gaps with zero proven arcs. These are regression checks, not blind
competitive evidence.

## Preserved frozen observations

The original CGRX source snapshot remains
`b8d828524b903abeb053db9faef5abba40fea509`. The original five diagnosed
receiver cases, declaration anchors and site hashes are preserved. The
`ts_config.rs` file SHA-256 remains
`5461b4db7e66e1ae2f080df1c94ec61a27b50fd95d05e183f52944f0c0607acf`.
All five are implementation-informed train cases from one source file.

| Original receiver cases | Previous CGRX | Current CGRX | CBM designated-target membership |
| --- | --- | --- | --- |
| `self` in `Reader<'_>`: read, recursive options, workspace_extend | 3/3 | 3/3 | 0/3 |
| local `reader` in collect: options | 0/1 | 0/1 | 1/1 |
| `witness: &Witness` in validate_final: valid | 0/1 | 1/1 | 1/1 |
| All five original cases | 3/5 | 4/5 | 2/5 |

The report still fails overall because the local constructed `reader` case
remains missing. The original `read` callback abstention is preserved with a
real unresolved call gap and zero proven arcs at its anchored site. Each CGRX
match requires one exact source/target/site binding, current source hash,
`SYNTAX_EXACT` / `PROVEN`, intact receipts, and no assumptions or counter-evidence.
No unmatched proven arcs occur at these selected positive sites.

All four matches, including recursion and the witness parameter, are also
visible through compact public MCP `find_usages` responses with exact target
and site ranges. The absent local receiver remains absent in that report.

CBM 0.10.8 freshly indexed the same snapshot in full mode with persistence
disabled. Its binary SHA-256 is
`996bad5fe6fb89c0c50363d87f03dc78f6e536aeea746c06679a294d14eca435`.
All designated target definitions were checked. Its bounded queries constrain
the caller's file/name/declaration lines and verify the target's file/name/lines.
Coverage metadata matched with no recorded issue, a best-effort signal. These
queries establish designated-target membership, not exact call-site proof;
CBM negatives and whole-graph precision were not scored.

## Regression controls and artifacts

Ten freshly rebuilt frozen repository indexes preserve every previous arc.
Only three CALLS arcs are added, all in the CGRX snapshot: witness validation,
`ts_path_is_plain` to `TsDirectoryCache::contains_exact`, and
`collect_untracked_sources` to `GitIgnoreMatcher::is_ignored`. All three pass
strict source-curated receipt checks. The latter two checks were selected after
implementation and then reviewed against the frozen source; they are not
independent heldout evidence. The selected Python import checks remain 24/24.

Two extraction tests cover ten supported forms and 29 refusal forms. Runtime
checks reject twelve kinds of missing/corrupted receipt data and a changed
source hash, and verify reopen, retargeting, abstention and recovery after edits.
The evaluator's twenty integrity tests preserve its previous evidence modes
and validate the new `--rust-receivers` mode. The default workspace passes
882 tests, and the JavaScript workspace 894, with nine ignored in each. Both
Clippy profiles pass with warnings denied. The complete CLI/language suite
with JavaScript, PHP and Swift enabled passes 721 tests with three ignored.

The previous reviewed binary has SHA-256
`89f4b2060ca6045ee0296624ab8adaf6526e798f538a7e21599c2776b6860456`;
the new reviewed binary has SHA-256
`b2124d3b53acb6769f2d3185cd1ec37d86ccf2140b48723527a876040ec5844b`.
Both are optimized macOS builds with JavaScript enabled. The extraction base
is 77, with PHP adding 2, Swift 4 and JavaScript 8; the measured build uses 85.
Earlier extraction caches require a source reindex.

Local artifacts remain under
`local/evidence/competitive-20261007/corpus-recovery/`:

- `index-manifest-rust-parameters-reviewed.json` and
  `rust-parameter-relationship-delta-reviewed.json` pin all ten rebuilt indexes.
- `rust-receiver-tasks.json`, `rust-receivers-before.json` and
  `rust-receivers-after-reviewed.json` retain all five original positive cases
  and the callback abstention. The after report intentionally remains failing.
- `rust-parameter-added-tasks.json` and `rust-parameter-added-after-reviewed.json`
  strictly grade all three added arcs.
- `cgrx-rust-parameter-public-observations-reviewed.json` and
  `cbm-rust-parameter-observations.json` preserve the public API observations.
- `cgrx-rust-parameter-added-public-observations-reviewed.json` confirms all
  three added bindings through the compact MCP API.
- `rust-parameter-compiler-evidence-reviewed.json` records compiler execution,
  fixture/source pins and native proof/abstention outcomes.
- `rust-parameter-source-provenance.json` and
  `verification-summary-rust-parameters.json` record binary/source and check hashes.

Reproduce the original receiver report with the source-curated task file and
matching reviewed index state:

```sh
python3 scripts/eval_curated_index.py /path/to/rust-receiver-tasks.json \
  /path/to/reviewed-state --rust-receivers --output /path/to/report.json
```

This command returns a nonzero status while the local receiver case remains
missing. No whole-repository precision, broad Rust superiority, latency, memory
or agent-token efficiency claim follows from these measurements. The complete
226-assertion source corpus and seven-language/40-cell coverage contract still
validate; engine grading remains incomplete beyond the stated scopes.
