# PHP runtime validation

PHP is an explicit, non-default validation build. It is **not** promoted into the reviewed production language contract by this work. Issue #69 remains open.

```sh
cargo test --locked --workspace --features cgrx-cli/experimental-php --no-fail-fast
cargo run --locked -p cgrx-cli --features experimental-php -- --version
python3 scripts/validate_php_validation.py
```

## What is implemented

The parser emits positional `PhpFunction` provenance for a unique unconditional same-file global function called from a named body. Function identity is ASCII case-insensitive, while declaration spelling and callsite bytes remain unchanged. Both endpoint spans participate in the extraction hash.

The runtime persists an optional boxed `php_function_target` containing the full source hash and exact caller/target name ranges. It uses a pass-local positional symbol index, rejects duplicate identities, checks the caller's exact callsite substring and verifies the target's declaration identity. PHP symbols are not candidates for other languages' name-only resolution. PHP calls never use the generic resolver, even when the PHP proof or tag is missing.

Opening an index reconstructs PHP calls from current document proofs instead of trusting previously serialized arcs. Refresh reextracts changed files and removes obsolete relationships; reopening an immutable base and refreshing its worktree produces the same result. Unresolved sites remain explicit coverage gaps.

## Cache isolation

Default builds retain extraction revision 29 and the seven reviewed language packs. PHP-validation builds use revision 30. The choice follows the **effective cgrx-languages feature**, including Cargo dependency feature unification, rather than only the CLI crate's feature flag.

The generation key contains the extraction revision. The other policy's state is rejected and reindexing the same Git commit selects a different generation. Migration tests use real immutable storage with a modeled opposite-policy record; they do not claim execution of a historical binary. Pinned readers retain their original bytes.

## Local evidence matrix

`contracts/php_validation_v1.json` references six checked-in fixtures, one for each of `php`, `phtml`, `php3`, `php4`, `php5`, and `phps`. Every file has four explicit byte-span cells: CALLS, IMPORTS, REFERENCE and UNRESOLVED. Python checks hashes, complete extension coverage and source-span integrity. The Rust `php_runtime` suite checks those same cells against the actual parser and verifies positional call proofs in persisted/reopened runtime graphs.

These **24 local source cells are not 24 proven graph-edge cases**. CALLS has runtime proof. IMPORTS and REFERENCE currently retain exact syntactic source evidence only; external namespaces, aliases and Composer loading are not guessed into definitive edges. UNRESOLVED is an abstention and has no target. The historical `real_tasks_v1.json` and its original 40 reviewed production cells are unchanged.

The runtime suite additionally covers UTF-8 and CRLF bytes, distinct callsites, same-name classes/methods, changed offsets, deletion, rename, recreation, foreign-file and foreign-language distractors, invalid syntax, dynamic and conditional calls, missing/corrupt metadata, and stale serialized arcs. The separate `php_policy` test runs under both policies. CI also checks dependency-only feature activation.

## Boundaries before production promotion

Variable, member, nullsafe and static dispatch, constructors, first-class callable references, anonymous-body attribution, conditional/nested/duplicate/missing target declarations, namespaces and function imports remain unresolved. This phase does not add Composer or PSR-4 resolution.

Promotion requires review of the supported semantic subset and production evidence, including explicit decisions for PHP import/type-reference resolution and coverage reporting. Default registry/contract equality and blocking CI must remain intact. Passing experimental tests is not permission to label all PHP constructs or all fourteen language packs supported.
