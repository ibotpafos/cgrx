# Python shadowing and complete native corpus ownership grading

A Python parameter or local assignment could shadow a global function while
the native graph continued to report a `PROVEN / SYNTAX_EXACT` call to that
global function. A separate coverage problem left some bare callback calls
without either a definitive edge or an explicit dispatch gap.

Python extraction now checks parameters and collected local bindings in
enclosing function and lambda bodies before emitting an exact unqualified
call. Shadowed calls become dispatch sites. Binding sets are cached per AST
scope. Default expressions are evaluated outside the function body scope;
unrelated nested parameters do not shadow the outer caller. A unique direct
local function declaration retains the existing exact-call path.

The tested forms include typed/default parameters, positional-only and
keyword-only parameters, `*args`/`**kwargs`, destructuring, assignment after a
call, deletion, loop targets, `with`/exception aliases, imports and closures.
Python's [name-resolution rules](https://docs.python.org/3/reference/executionmodel.html#resolution-of-names)
explain why a binding later in a function can affect an earlier call.
This guard is not a complete Python interpreter or name resolver: module and
class bindings, comprehensions, pattern matching and dynamic namespace changes
need broader independent evidence. Nested callable bindings can still be
conservatively rejected by an enclosing shadow.

Every parsed Python bare call without a definitive current-source proof now
gets a dispatch gap. Known exact calls remain free of that gap. A watched
source change removes an obsolete proof and adds the gap together; restoring
the original bytes restores the original exact proof. A removed Python target
now also makes absence-based `scan_risks` findings incomplete, as its unresolved
call has a recorded relationship gap.

Native extraction uses a new nonoverlapping policy block: default revision
109, JavaScript revision 117, and combined JavaScript/PHP/Swift revision 123.
Old revision-101 states return `extraction_revision` until source is reindexed.
The ten old corpus states were preserved byte-for-byte; new states use exactly
the same source inventories and hashes. SCIP semantic policy remains revision 3.

## Ownership grading

`scripts/eval_curated_index.py --source-relationships` grades native CALLS,
IMPORTS, REFERENCE and UNRESOLVED assertions for one repository per index.
The corpus runner groups the unchanged 226 assertions across ten repositories.

A call assertion owns a parsed call with the named callee and exact evidence
span. An enclosing `wrap(target())` proof cannot be credited to the inner
`target()` assertion. The same ownership check prevents an unrelated dynamic
call containing the target name only as an argument from satisfying abstention.
Caller and target must be the named definitions at the source-curated anchors;
proof hashes, resolver, confidence and proof conditions must agree.

Named Python import assertions additionally check member spans, source/target
fact hashes and exact exported declarations. Other legacy lexical import rows
without named bindings remain unsupported. A reference assertion requires an
identifier evidence span naming its target. This mode checks graph ownership;
the stronger language-specific receiver receipt checks remain in their existing
Rust and Go modes. It does not independently certify every language's semantics.

The 24 `negative.identifier_absent` annotations are revalidated against source
as lexical distractors. They are not treated as runtime noncall assertions.
All 23 explicitly curated UNRESOLVED assertions require both no owned proven
edge and an owned dispatch gap. Missing graph edges alone never pass abstention.

| Original native assertions | Previous release | Checked release |
| --- | ---: | ---: |
| CALLS | 145/146 | 145/146 |
| IMPORTS | 24/33 | 24/33 |
| REFERENCE | 0/24 | 0/24 |
| UNRESOLVED with owned gap | 20/23 | 23/23 |

There are no unmatched proven edges at these owned assertion sites in either
release. This is not whole-repository precision. Nine import assertions and
all 24 reference assertions remain missing or outside the supported definition
roles. The remaining native call is the previously reviewed Rust
`collect → Reader.options`; its separate real SCIP state still closes that site.

## Public and independent checks

Two additional Python fixtures are executed by CPython: a parameter shadow
and a local callback assignment. The global function returns 1 and the supplied
callback returns 2. The saved `f33052a4d380` release nevertheless proves a call
to the global function in both `full` and `token-efficient` profiles, for four
wrong observations. The checked release returns zero such proofs and four
owned gaps. Original exact calls and source reversion are checked in the same
live processes; snippet bodies and definition/call spans match source bytes.

The three previously silent corpus callbacks in Blinker and ItsDangerous now
expose owned gaps through the public coverage API in both profiles. The same
frozen source, caller definitions and source hashes are checked before and after.

Retained public replays still select six exact Go targets and abstain on two
compiler-checked cases in both profiles. Real frozen Rust receiver evidence
remains native 4/5 and hybrid 5/5, with the callback gap preserved. The unchanged
real A/B SCIP artifacts still withdraw stale A proofs, refuse identical stale
republication, and restore exact B proofs without restarting. An actual native
101 / SCIP-policy-2 cache is rejected and rebuilt, preserving its old generation.
The existing omitted-text compiler-source attestation limits still apply.

## Verification and evidence

| Check | Passed | Skipped/ignored |
| --- | ---: | ---: |
| Python script tests | 189 | 2 |
| Default workspace | 917 | 9 |
| JavaScript workspace | 929 | 9 |
| Combined JavaScript/PHP/Swift CLI and language packages | 754 | 3 |

Format, both workspace Clippy profiles with `-D warnings`, release build and
source-freeze hashes pass. The schema remains 4,137 tokens against its 4,150
ceiling. No dependency, installed MCP or global configuration change is needed.

Hashed local evidence lives under
`local/evidence/competitive-20261007/corpus-recovery`:

- `reproduction-corpus-ownership/verify_local.py` and
  `verification-summary-corpus-ownership-local.json` bind source and checks.
- `corpus-ownership-source-provenance.json` binds the reviewed executable.
- `reproduction-corpus-ownership/reindex_grade.py`,
  `index-manifest-corpus-ownership-reviewed.json` and
  `corpus-ownership-grade-reviewed.json` compare all 226 unchanged assertions.
- `public_shadow_checked.py`, `public_callbacks.py`, `public_native.py`,
  `public_reader.py` and `public_compiler.py` in that reproduction directory
  replay the independent target and retained source/compiler checks.

Intermediate failing shadow regressions, outdated policy assertions, a
read-only-serving reproduction setup error and unrelated short-deadline doctor
test failures are retained. Final Python checks use `/private/tmp`; Rust tests
retain the short Unix-socket temporary root. Production tests were not weakened
to bypass those doctor failures.

The goal remains active. Independent comparable competitor agent tasks,
whole-task latency/RSS/token cost, broader compiler truth, missing native
imports/references and the remaining Python lookup boundaries are still open.
No overall competitor superiority is claimed.
