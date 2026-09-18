# PHP runtime validation

PHP is an explicit, non-default validation build. It is **not** promoted into the reviewed production language contract by this work. Issue #69 remains open.

```sh
cargo test --locked --workspace --features cgrx-cli/experimental-php --no-fail-fast
cargo run --locked -p cgrx-cli --features experimental-php -- --version
python3 scripts/validate_php_validation.py
```

## Function calls

The parser emits positional `PhpFunction` provenance for a unique unconditional same-file global function called from a named body. Function identity is ASCII case-insensitive, while declaration spelling and callsite bytes remain unchanged. Both endpoint spans participate in the extraction hash.

The runtime persists an optional boxed `php_function_target` containing the full source hash and exact caller/target name ranges. A pass-local positional symbol index rejects duplicate identities, checks the caller's exact callsite substring, and verifies the target's declaration identity and the innermost owner. PHP symbols are not candidates for other languages' name-only resolution. PHP calls never use the generic resolver, even when proof metadata is missing.

Class declaration initializers and attribute expressions cannot borrow an enclosing function as their caller. Real named method bodies and anonymous-class constructor arguments retain their actual owners. Parser-level negative fixtures include invalid constant-expression examples: this validates conservative extraction, not successful PHP execution of those examples.

## Same-file type references and used imports

`PhpType` provenance identifies a consuming declaration, an exact class/interface/enum declaration, and optionally the exact `use` clause. The parser collects namespace scopes and imports once per file. Supported bounded shapes include bracketed and unbracketed namespaces, the explicit global namespace, repeated namespace blocks with independent import tables, ordinary/group imports, aliases and namespace-prefix aliases, fully qualified names and `namespace\\`-relative names. Simple `declare(strict_types=0/1);` preambles are supported.

Only unique, unconditional **same-file** class-like declarations qualify. Function and constant imports do not enter the type import table. Import targets are absolute, not recursively expanded through other imports. A later import is never applied retroactively to an earlier type site. Duplicate or conflicting aliases, ambiguous declarations, conditional/nested targets, traits as types, anonymous function type ownership, unsupported source shapes and external targets retain syntax evidence without a guessed definitive edge. Names in this bounded resolver are ASCII; broader PHP identifier support is not claimed.

A proven usage produces a `REFERENCES` edge from the consuming function, method or class to the exact type. When that usage depends on a `use` clause, it also produces an `IMPORTS` edge between those same declarations, with evidence pointing to the import clause. **Unused imports do not create graph edges.** An import dependency here proves a compile-time type binding, not autoloader execution, a Composer path, or a runtime invocation.

Each sparse boxed `php_type_target` includes the source hash, endpoint ranges, optional import-site range/hash and a domain-separated binding checksum. Reopening validates the endpoints, innermost owner, exact source substring and import record before reconstructing either edge. The checksum detects inconsistent serialized metadata; it is not a signature or a security boundary against deliberately regenerated indexes.

Missing or rejected PHP reference proofs remain explicit coverage gaps. For compatibility, the v1 coverage schema reports these unresolved bindings in its existing `dynamic_dispatch` list; this field does not assert that a type reference executed a dynamic call. A gap is removed only by a proof of the **expected relation and current source hash**. An unrelated `CONTAINS` proof at the same byte location cannot clear it.

## Persistence and cache isolation

Opening an index reconstructs PHP semantic relationships instead of trusting previously serialized arcs. Refresh reextracts changed files and removes obsolete relationships. Reopening an immutable base and refreshing its worktree yields the same current graph; pinned readers keep their original bytes.

Default builds retain extraction revision **29** and the seven reviewed language packs. PHP-validation builds now use revision **31** (revision 30 predates type proofs). The choice follows the effective `cgrx-languages` feature, including Cargo dependency feature unification, rather than only the CLI crate's feature flag.

The generation key contains the extraction revision. Both opposite-policy state and old revision-30 PHP state require reindexing the same Git commit into the correct distinct generation. Migration tests publish modeled old serialization through real immutable storage; they do not claim execution of a historical binary.

## Evidence and tests

`contracts/php_validation_v1.json` is unchanged. It references six checked-in fixtures, one for each of `php`, `phtml`, `php3`, `php4`, `php5`, and `phps`. Every file has four explicit byte-span cells: CALLS, IMPORTS, REFERENCE and UNRESOLVED. Python checks hashes, complete extension coverage and source-span integrity. The original `php_runtime` suite checks those cells against actual extraction and persisted CALLS proofs.

These **24 local source cells are not 24 proven graph-edge cases**. In that frozen corpus, the imported types are external and still have no definitive IMPORTS/REFERENCE graph edges. The historical `real_tasks_v1.json` and original 40 reviewed production cells are also unchanged.

Separate `php_types` suites in `cgrx-languages` and `cgrx-cli` cover the new namespace/type/import subset. Tests exercise exact target ranges for identical short names, alias isolation and retargeting, source-order guards, all six extensions with UTF-8 and CRLF, persisted/reopened/independently reindexed graphs, no-op refresh, deletion/rename/recreation, foreign-file/language distractors, rejected or altered witnesses, explicit gaps and recovery, and revision-30 migration. Existing call, owner and opposite-policy tests remain enabled. The PHP CI workflow runs the full feature-enabled workspace suite on Linux and macOS, so the new suites are not optional manual checks.

## Remaining boundaries

Function calls in namespaces, imported functions, variable/member/nullsafe/static dispatch, constructors, first-class callable references, anonymous-body call attribution and conditional/duplicate/missing call targets remain unresolved. Type-name support above does not silently broaden function-call support.

Cross-file PHP type/function identity, Composer/PSR-4 configuration and loading, inheritance-aware `self`/`parent`, trait composition and broader language semantics remain future work. Promotion requires reviewed production evidence and an explicit coverage decision. Default registry/contract equality and blocking CI remain intact. Passing this experimental subset is not permission to label all PHP constructs or all fourteen language packs supported.

Semantic references: [PHP name resolution](https://www.php.net/manual/en/language.namespaces.rules.php), [aliasing/importing and namespace-block scope](https://www.php.net/manual/en/language.namespaces.importing.php), and [initializer boundaries](https://www.php.net/manual/en/language.oop5.decon.php).
