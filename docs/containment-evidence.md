# Containment evidence

Issue [#117](https://github.com/ibotpafos/cgrx/issues/117) records two errors in
syntax-derived `CONTAINS` relationships. An empty first function was treated as
the container of its file's remaining symbols, even when their definitions
were outside its body. Cold indexing also omitted real nested definitions
when their parent was not the file's first symbol. Those stored arcs carried
`SyntaxExact` / `PROVEN` evidence despite the false enclosure.

Containment now requires both the target name and its complete body to lie
inside the source symbol's body span, with unequal parent and child extents.
Declarations whose name extends past their own body are rejected; initializer
names before their own body remain eligible. Equal or crossing body extents and
duplicate symbol identities cannot establish an unambiguous parent proof.
Cold indexing and refresh apply the same rule. This
does not turn unrelated functions into file or module containers. The
extraction revision advances to a separate range; indexes from the old
containment policy require rebuilding before their evidence can be reused.

## Permanent reproductions

The mistake ledger pins the following public synthetic sources by SHA-256.
The observations were made on 2026-10-11 against published source
`18708ff694f8587022d3854a4b9dacb981b232f6`, release label
`v0.1.0-alpha.17`, default-feature extraction revision 125. Both source files
parse with zero recorded coverage gaps. These fields describe the observed
engine; they do not claim that the fixed engine retains revision 125.

Sibling definitions, whose edge must be absent:

```rust
fn ledgerFirst() {}
fn ledgerSibling() {}
```

Actual nesting, whose edge must be present:

```rust
fn ledgerAnchor() {}
fn ledgerOuter() {
    fn ledgerInner() {}
}
```

`ledgerOuter` is deliberately the second top-level definition. The old
first-symbol shortcut cannot satisfy the positive case by accident.

| Ledger case | Expected `CONTAINS` relationship | Fixture SHA-256 |
| --- | --- | --- |
| `fp-rust-sibling-contains-001` | `ledgerFirst → ledgerSibling` absent | `12fffa6b87c36dfbe883dbc8601cd4129183aae56026e406d571cb1f24d735de` |
| `fn-rust-nested-contains-001` | `ledgerOuter → ledgerInner` present | `18fd8ecc72abfa53d21c82d2df25d89d1baf8377c4fe3232142de43ac1b0807c` |

## Relation-specific ledger checks

Cases can specify a validated `relation_kind`. Omission means `CALLS`, so the
existing Java call cases retain their meaning. The evaluator requests a
single relationship kind with depth one and rejects truncated or incomplete
results before scoring the exact `(symbol, path)` pair. The containment cases
use `CONTAINS`; default call tracing would miss the faulty arcs entirely.
The public `trace_path` scope advertises `CONTAINS` alongside its existing
`CALLS` and `IMPLEMENTS` values. Default call tracing remains unchanged.

Validate and evaluate the pinned cases:

```sh
python3 scripts/validate_ledger.py
python3 scripts/eval_mistake_ledger.py /path/to/cgrx
```

The saved preceding binary has SHA-256
`78394936a5a12f5dda8ad6acf81c152a7563af7b7a5af55ae87b5c90a3763648`.
Evaluating it with the extended ledger returned `LEDGER_EVAL=FAIL` and exit
code 1. Both existing Java `CALLS` cases passed. The sibling case failed
because `ledgerSibling` was returned; the nested case failed because
`ledgerInner` was absent. Separate complete public MCP receipts confirmed
`truncated=false` and `coverage_gap_count=0` for both containment cases.

The fixed release binary has SHA-256
`e92b3ccdc0cebb579eadedd787739c09fa180c927acf768c9e9c18e439056118`.
An independent strict evaluation returned `LEDGER_EVAL=PASS`, exit code 0,
with all four cases passing and no inconclusive cases. Separate complete
public MCP responses confirmed the following selected results:

| Case | Preceding binary | Fixed binary | Ledger verdict before → after |
| --- | --- | --- | --- |
| Sibling edge must be absent | Returned `ledgerSibling` | No returned nodes | FAIL → PASS |
| Nested edge must be present | No returned nodes | Returned `ledgerInner` | FAIL → PASS |

Both fixed responses have `truncated=false` and `coverage_gap_count=0`.
The existing Java call cases pass in both binaries. This is a correctness
comparison for pinned examples, not a performance measurement.

## Existing indexes

The default-feature extraction revision moves from 125 to 141, with separate
feature offsets. This invalidates indexes carrying the old containment policy.
Managed repository sessions rebuild incompatible extraction revisions when
opening an index. Explicit `--state` sessions reject the old index; rebuild
the same state with:

```sh
cgrx index --root /path/to/repository --state /path/to/state --json
```

Include the original `--scip /path/to/index.scip` option when rebuilding an
index that uses imported SCIP evidence.

## Adding evidence

Follow [CONTRIBUTING.md](../CONTRIBUTING.md). Scaffold each case from a clean
canonical worktree at its committed revision, then paste the generated
case into the pull request. For example, with the sibling fixture committed:

```sh
python3 scripts/report_mistake.py \
  --repo /absolute/canonical/worktree --revision FULL_40_HEX_HEAD \
  --kind false_positive --rule-key syntax_other --relation-kind CONTAINS \
  --caller ledgerFirst:fixtures/mistake-ledger/fp-rust-sibling-contains/siblings.rs \
  --target ledgerSibling:fixtures/mistake-ledger/fp-rust-sibling-contains/siblings.rs \
  --reported-from github:ibotpafos/cgrx#117 --id fp-rust-sibling-contains-001 \
  --synthetic --fixture fp-rust-sibling-contains \
  --cgrx-version v0.1.0-alpha.17 --extraction-revision 125
```

The reporter verifies committed bytes, rejects symlinks, special files and
Git metadata within fixtures, converts
repository-relative fixture anchors into fixture-relative ledger paths, and
hashes every fixture file, including hidden source, hidden directories and
`.gitignore`. Files outside the committed inventory are rejected. The evaluator
copies only pinned bytes, force-stages ignored files, and verifies committed
blob hashes before opening the index, so Git attributes cannot silently change
the evaluated source. Version and extraction revision
are explicit observations; its legacy defaults remain available for old
commands and must be overridden for new evidence from a different engine.
