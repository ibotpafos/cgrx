# IBO-271: exported TypeScript const arrow identity

Base: `b8d828524b903abeb053db9faef5abba40fea509`.
Branch: `fix/ibo-271-ts-arrow-exports`.

Named imports and bounded named reexports previously missed a module-level
`export const target = () => 42`, despite existing local arrow extraction.
The import facts recorded variable declarations as unsupported spans and only
accepted ordinary function bindings. They now retain the exact const-arrow
name span and require agreement with the existing unique lexical binding.
Existing write, collision, module, export and inventory guards remain active.
Extraction revision 21 forces older managed indexes to reextract.

## Verified behavior

Six frozen positive source variants: direct export, separate export, renamed
export, async arrow, multiple declarators, and an unrelated local shadow write.
All use an imported alias through a named reexport with same-name decoys.
Exact target path/name/start, reopen, const-to-let invalidation and restoration
are checked by the runtime tests. Fourteen negative variants cover mutable or
unsupported values, missing/duplicate exports, conflicting declarations,
destructuring and direct/nested/loop binding writes.

Actual stdio MCP comparison on the same six synthetic source repositories:

| Build | TP | FP | FN |
| --- | ---: | ---: | ---: |
| Baseline debug | 0 | 0 | 6 |
| Modified release | 6 | 0 | 0 |

This is an identity comparison, not a latency comparison between build profiles.
The unchanged relationship corpus passes on both: 8 TP / 0 FP / 0 FN.
Six positive variants also execute successfully as Node ESM through real imports
and reexports. No claim of TypeScript compiler validation or runtime
initialization-order analysis is made.

## Local validation

- RED: original resolver misses the first positive; negative matrix passes.
- GREEN: positive and negative matrices pass.
- Workspace: 538 passed, 0 failed, 8 ignored; an additional revision-20 migration
  test was subsequently added and passed (539 distinct passing tests total).
- Python: 115 run, 2 skipped, no failures.
- Clippy with `-D warnings`, fmt, diff check and release build pass.
- MCP smoke: 8 tools; scope smoke: 8 coverage cases and 2 pagination cases pass.
- Isolated baseline source archive with the unchanged final regression matrix:
  positive fails again, negatives pass; no edits to the working implementation.
- CGRX changes scan: no candidates, partial coverage; source and tests were
  reviewed directly. This is not a proof of absence of bugs.

Reproduce the focused test with:

```sh
cargo test --locked -p cgrx-cli --test ts_import_runtime exported_const_arrow
cargo test --locked -p cgrx-cli --test ts_lexical managed_revision_twenty_reindexes_to_distinct_generation
python3 scripts/eval_relationships.py target/release/cgrx
```

Local raw logs, native examples, comparison harness/results, source hashes and
isolated baseline source are in this worktree's `target/verification/`.
The heldout real-task corpus was not changed or used for tuning. Broader
IBO-271 parity, agent-level plain-source/CGRX/CBM evaluation, performance,
client rollout and release gates remain open. No publication or client update.
