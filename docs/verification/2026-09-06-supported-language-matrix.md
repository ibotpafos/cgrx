# IBO-271 supported-language coverage contract

## Registered scope

`pack_for_path` registers four language packs and five source extensions:
TypeScript (`.ts`, `.tsx`), Go (`.go`), Python (`.py`) and Rust (`.rs`). The
previous 195-task corpus represented the four language names but omitted `.tsx`
entirely and left six language/relation cells empty.

The corpus now has 206 source-anchored tasks. Eleven new tasks close the missing
cells with real source from Pyramid, Vocal School, VEX and CGRX:

| Extension | CALLS | IMPORTS | REFERENCE | UNRESOLVED |
| --- | --- | --- | --- | --- |
| `.ts` | populated | populated | populated | populated |
| `.tsx` | populated | populated | populated | populated |
| `.go` | populated | populated | populated | populated |
| `.py` | populated | populated | populated | populated |
| `.rs` | populated | populated | populated | populated |

`contracts/language_coverage_v1.json` names the source-verified task for every
cell. `scripts/validate_language_coverage.py` compares that contract with the
actual language-pack registry and extension declarations, then verifies every
task ID, relation and source suffix. Adding a pack or extension without updating
the corpus now fails validation. CI exercises the complete contract and its
failure cases on Linux and macOS.

## Cross-extension CALLS control

A frozen five-task control selected one source-anchored CALLS assertion for
each supported extension. Before the implementation change, CGRX found 4/5:
`.ts`, `.go`, `.py` and `.rs` passed, while the real Pyramid `.tsx` call from
`createProject` to the stable outer `fetchProjects` arrow was absent. The CBM
reference observed 4/5, finding that `.tsx` target but missing the Vocal `.ts`
service receiver.

The TypeScript lexical resolver now accepts a named function or named const
arrow calling a stable outer const arrow when both caller and target have exact
syntax identity, the binding is unique, has not been written, is initialized
before the call and the tree has no parser error. Anonymous callbacks, parameter
shadowing, mutable bindings, TDZ, class initializers and unsupported scopes still
abstain. Extraction revision 23 forces existing indexes to rebuild instead of
retaining an older graph.

The identical post-change selection produced CGRX 5/5 complete target matches.
Warm request medians were `.go` 85.13 ms, `.py` 10.07 ms, `.ts` 29.86 ms,
`.rs` 14.65 ms and `.tsx` 10.35 ms. CBM again observed 4/5 targets, while its
arms remain formally incomplete because the proxy endpoint exposes no process
RSS. These are bounded designated-target checks, not global precision/recall or
whole-task resource measurements.

The contract defines complete coverage of the supported-language matrix. It is
deliberately narrower than “every possible program”: parser errors, dispatch
variants and resolution constructs still need separate scenario inventories and
multiple examples where they are material. Exact receiver and callback claims
continue to fail closed when source does not identify one concrete target.

## Verification boundary

The real-source validator reports 206 valid tasks across seven pinned
repositories. The language contract reports four languages, five extensions,
20 populated relation cells and 20 designated coverage tasks. Unit tests cover
registry drift, missing cells, stale IDs, wrong relations and wrong extensions.

Raw before/after configurations, logs and measurements are under
`local/evidence/IBO-271-LANGUAGE-MATRIX-20260906/` in the primary checkout.

This is local source and contract evidence. It does not imply a pushed branch,
merged release, launcher installation or deployment.
