# Java constructor benchmark — 2026-09-07

CGRX proves Java construction sites as call edges. `new X(args)` resolves to
the single declared constructor of a concrete non-abstract class defined in
the same file, or to the class itself when no constructor is declared (the
implicit default). `this(args)` and `super(args)` resolve under the same
exactly-one-constructor rule against the enclosing and superclass
declarations. Constructor invocation is statically bound, so superclasses and
subclasses cannot change which declaration runs; only overloads, generics,
anonymous bodies, qualified allocations, abstract and imported types stay
explicit dispatch gaps.

Edges carry a span-exact `JavaConstructor` proof (caller plus constructor or
class name spans) joined at runtime without name guessing; unproven sites
stay `DYNAMIC_DISPATCH` gaps via the qualified-call refresh. The frozen
relationship evaluator is unchanged at eleven cases with precision 1.0 and
recall 1.0 — constructor symbols share their name with the class, so a
name-only callers trace over an explicit constructor is ambiguous exactly
like overloaded methods, and frozen eval does not address ambiguous shapes.
Coverage comes from two extraction tests (single/default/`this`/`super`
positives plus eight fail-closed negatives) and two runtime semantics tests
proving end-to-end `trace_path` resolution and the overload gap. The Gson
heldout tasks are unaffected: `new MalformedJsonException(...)` gains no
proven edge (external type, zero local declarations) and `in.nextDouble()`
stays unresolved.

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
