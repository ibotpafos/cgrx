# alpha.16: evidence quality before language breadth

Base: released `v0.1.0-alpha.15` (`d74293b900f8ad79f2cce6efa8d0f6057e2c096e`).
This is a plan and a first opt-in Swift slice, not an alpha.16 release claim.

## Priority and boundary

1. **JS/TS:** JS is not registered in the alpha.15 default pack: `.js` files
   are excluded, so JS support is a new gated scope, not an existing proof to
   preserve. A pinned Express.js held-out candidate now covers CALLS, IMPORTS,
   REFERENCE and UNRESOLVED; its source anchors validate, but no JS engine
   result is claimed. For TS, preserve exact import/receiver proofs, compact
   graph counts and fallback behavior. Add held-out regressions for path
   aliases, re-exports, stale import inventories and receiver shadowing. A
   rejected or stale proof must not fall through to a global name match.
2. **Rust:** focus on the remaining self/recursive and module-qualified misses
   identified by the curated task matrix. Require exact caller, target and
   source-hash provenance; retain ambiguity abstention.
3. **Python:** expand frozen cases for alias chains, relative imports,
   decorators and dynamic attributes. Dynamic dispatch stays unresolved until
   a reproducible binding proof exists.
4. **Swift:** use the existing pinned `tree-sitter-swift` dependency. First ship
   only an opt-in (`experimental-swift`) proof for unique, zero-argument,
   unshadowed top-level free functions in a declaration-only file. Member calls,
   overloads, imports, type references, local bindings and parser errors abstain.
   Default registration waits for a manually curated, pinned Swift CALLS /
   IMPORTS / REFERENCE / UNRESOLVED corpus and its coverage contract. Do not
   relax the default seven-language contract to enable the prototype.
   A pinned Swift System held-out candidate validates four source-truth cells;
   the current opt-in extractor abstains on its argument-bearing CALLS case,
   correctly abstains on closure dispatch, and has not established IMPORTS or
   REFERENCE proofs. This is an open promotion gate, not a passing matrix.
   The opt-in index uses distinct extraction revisions (33 without PHP, 35
   with it); default 29 and PHP-only 31 remain unchanged.

To exercise the opt-in slice without changing the installed alpha.15 binary:

```sh
cargo test --locked -p cgrx-cli -p cgrx-languages --features cgrx-cli/experimental-swift
```

PHP is maintenance-only for this cycle: existing validation remains blocking,
but new PHP language work is not a release priority.

## Verification matrix

| Surface | Positive controls | Negative controls | Observation |
| --- | --- | --- | --- |
| JS/TS | exact local/import receiver calls | shadow, stale config, ambiguous re-export | proven target span/hash or explicit gap |
| Rust | exact self/module/recursive calls | duplicate impl, stale target, external crate | proven target span/hash or explicit gap |
| Python | static local and relative-import binding | decorator, alias ambiguity, dynamic attribute | proven target span/hash or explicit gap |
| Swift opt-in | unique same-file direct call | overload, local shadow, member call, import, malformed syntax | exactly one proven call or dispatch/parser gap |
| Runtime | index, reopen, refresh, delete | stale proof metadata, duplicate target, missing source | old arc disappears; no name-only fallback |
| Explorer | alpha.15 20k/120k fixture, selection, switch, WebGL loss | incomplete request, queue saturation | same-SHA GPU thresholds and resource counters |

Run the frozen corpus before and after each resolver change. Record complete
source commit IDs, fixture hashes, literal outputs, per-language target recall,
false-proven count, gap count and query latency. **Acceptance:** zero
false-proven edges in curated negative cases; no regression in existing frozen
positive cases; all persisted/reopen/refresh/delete and language-policy tests
pass. Investigate any moved node ID, changed source span or altered coverage
gap before accepting it. For the explorer, re-run the alpha.15 exact-SHA GPU
ceilings (2 s interactive, 12 s layout, 20 ms frame p95, 50 ms selection,
zero leaked workers/GPU resources after 20 switches) rather than extrapolating
from software CI. No tag or default Swift registration until those gates and
the full release CI are observed on the final candidate SHA.

## Iteration order

Freeze the four-language fixtures first; fix one resolver family at a time;
run the matrix and compare to alpha.15; curate external Swift held-out tasks;
promote Swift only after the coverage contract is complete; then perform the
real-GPU and release checks. Keep alpha.15's executable as a reversible local
fallback while alpha.16 remains under development.
