# Java receiver-call benchmark — 2026-09-07

CGRX extends the Java resolver with `this`-bound and declared-type-bound
receiver calls. A `receiver.method()` site is proven only when the receiver
has one statically declared local type — `this`, a singly-typed local,
parameter or field name, or `this.field` — and the type names a concrete
class defined in the same file with no superclass, no interfaces, no local
subclasses and no overloads of the target. Static-import shadowing, names
declared with two distinct types, interface targets and chained receivers
stay explicit dispatch gaps instead of guessing a target.

The frozen relationship evaluator is unchanged: its two Java cells (one
positive caller, one same-name negative) keep passing with precision 1.0
and recall 1.0, and the four source-anchored Gson tasks are unaffected —
`in.nextDouble()` stays unresolved because `JsonReader` is an imported
external type, never a locally defined class. New coverage comes from three
extraction tests (positive `this`/local/param/`this.field` shapes plus nine
fail-closed negatives) and two runtime semantics tests proving end-to-end
`trace_path` resolution, same-name cross-file isolation and the
`DYNAMIC_DISPATCH` gap for a subclassed receiver type.

Trace's published matrix lists Java symbol and import extraction but no Java
call resolver. CBM documents Java tree-sitter and Hybrid LSP coverage; this
benchmark does not claim superiority over CBM until the same real Java corpus
is run through both engines.

Reproduce with:

```bash
cargo test --locked -p cgrx-languages --test extraction java_
cargo test --locked -p cgrx-cli --test java_semantics
python3 scripts/eval_relationships.py target/release/cgrx
```
