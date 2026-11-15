# Rust lifetime receiver evidence — 2026-10-08

Development builds resolve `self.method()` and `Self::method()` to exact
declarations on local structs/enums parameterized only by lifetimes. Named
and anonymous lifetime arguments, multiple lifetimes and separate inherent
impl blocks retain the same nominal declaration identity. Type/const
substitutions, lifetime bounds, where clauses, traits and ambiguous or
unsupported competing impls remain gaps.

This extends the existing Rust owner proof and the pinned Tree-sitter Rust
0.24.2 grammar. No new dependency is installed. Rust's
[generic parameters](https://doc.rust-lang.org/reference/items/generics.html)
and [inherent implementations](https://doc.rust-lang.org/reference/items/implementations.html)
describe the declaration structure. Compiler analysis through the existing
SCIP integration remains available for broader type resolution; this change
does not replace Rust type checking.

## Frozen observations

The source is the original CGRX corpus snapshot
`b8d828524b903abeb053db9faef5abba40fea509`. The measured file,
`crates/cgrx-cli/src/runtime/ts_config.rs`, has SHA-256
`5461b4db7e66e1ae2f080df1c94ec61a27b50fd95d05e183f52944f0c0607acf`.
The original tasks, declaration anchors and call-site hashes were preserved.
These five misses were already identified by the full-corpus diagnostic.
They are train cases inspected during implementation, not blind heldout data.

| Receiver and original assertions | CGRX before | CGRX after | CBM designated-target membership |
| --- | --- | --- | --- |
| `self` in `Reader<'_>`: read, recursive options, workspace_extend | 0/3 | 3/3 | 0/3 |
| local `reader` in collect: options | 0/1 | 0/1 | 1/1 |
| typed `witness: &Witness` parameter in validate_final: valid | 0/1 | 0/1 | 1/1 |
| All five pre-existing misses | 0/5 | 3/5 | 2/5 |

The complete four-candidate receiver report retains the local `reader` miss
as a failure (3/4 positives); it is not shortened to turn the report green.
The companion `read` callback abstention remains respected with a real
unresolved-call gap and zero proven arcs at its anchored site. General corpus
quality thresholds were not relaxed.

For CGRX, the three new matches require exact caller/target and call-site
spans, current evidence hash, `SYNTAX_EXACT` / `PROVEN`, no assumptions or
counter-evidence, and stored owner/impl identities enclosing the actual
declarations. The selected positive sites have zero unmatched proven arcs.
This is not whole-graph precision.

CBM initialized as version 0.10.8, binary SHA-256
`996bad5fe6fb89c0c50363d87f03dc78f6e536aeea746c06679a294d14eca435`.
It freshly indexed the same snapshot in full mode with persistence disabled.
The file's coverage metadata matched with no recorded issue; this signal is
best-effort. All four source definitions were verified in its graph. Bounded
CALLS queries constrained the caller's name, source file and declaration
line range, then checked each designated target's name, file and declaration
line. They did not identify exact call sites. No conclusion about CBM's
abstention correctness or whole-graph false positives follows from these
observations.

The before binary is the Python iteration at
`3ee48970b2e5f3f4d05eba9949aa69d4493bfc01`, SHA-256
`6027fe4167c12bcacc5140a92695533955e765e3192eb3058b0f2a72b872eeda`.
The final after binary has SHA-256
`89f4b2060ca6045ee0296624ab8adaf6526e798f538a7e21599c2776b6860456`.
Both are optimized macOS builds with JavaScript enabled. The extraction base
at this iteration is 61; PHP adds 2, Swift 4 and JavaScript 8, so this build uses
revision 69. The subsequent [parameter iteration](rust-parameter-evidence-2026-10-08.md)
uses base 77 and JS revision 85; the binary and indexes measured here retain 69.
Earlier caches require a source reindex.

The final binary also includes the recursion correction described below.
It exposes all three new bindings through the
public compact MCP `find_usages` response, including the recursive call's
actual site and target definition span. The local `reader` miss remains visible
in the saved observations.

## Query behavior and regression controls

The public MCP check exposed a separate query bug: `find_usages` omitted a
proven recursive call because its source was already in the traversal's
visited set. Static usages now record each recursive call site once without
rescheduling that symbol. Depth and result limits still bound traversal.
A regression covers two direct recursive sites, recursion on a transitive
caller, exact call-site bytes and truncation.

Two extraction tests exercise five supported owner shapes and fourteen
unsupported/competing shapes. Two runtime tests verify exact declarations,
reopen, dependency refresh and seven competing-impl variants. The shared
evaluator's sixteen integrity tests reject missing/corrupted owner, caller,
target, impl, source hash and call receipts, as well as false clean abstentions.
An owner declaration with parser errors is also a blocker even when its impl
block parses cleanly.

The final default workspace passes 878 tests (9 ignored), and the final
JavaScript workspace passes 890 (9 ignored). Default and JavaScript workspace
Clippy pass with warnings denied. The combined CLI/language suite passes 716
tests (3 ignored) before the query-only correction; its three usage tests also
pass on the final code. Dependency-only JavaScript feature unification,
formatting and diff checks pass.

Across the ten frozen repositories, every previous relationship is preserved.
Nine Rust CALLS arcs are added in the CGRX snapshot; the other nine graphs are
unchanged. Only the three new curated bindings above received the complete
assertion checks. The additional arcs are not a precision benchmark. All 24
Python import assertions still pass after the Rust change.

The broader CALLS diagnostic improves from 140/146 to 143/146 designated-target
matches. The two Rust receiver cases above and Vex's Go cleanup call remain
missing. General import/reference and abstention scoring is incomplete;
the source validator passing 226 assertions is separate from engine scoring.
These results show a narrow Rust advantage and remaining gaps, not overall
superiority. Paired latency, memory and agent-token costs remain unmeasured.

## Reproduce

Restore the original corpus snapshot and select the original four receiver
CALLS cases plus `rust-tsconfig-read-closure-unresolved`, preserving all source
anchors. Keep the typed-parameter receiver observation alongside them. Then run:

```sh
cargo build --locked --release -p cgrx-cli --features experimental-javascript
target/release/cgrx index --root /path/to/frozen/cgrx --state /tmp/rust-state --json
python3 scripts/eval_curated_index.py /tmp/rust-receiver-tasks.json /tmp/rust-state --rust-self
cargo test --locked -p cgrx-languages rust_lifetime
cargo test --locked -p cgrx-cli --test runtime rust_lifetime
cargo test --locked -p cgrx-cli --test runtime find_usages
python3 -m unittest discover -s scripts -p 'test_eval_curated_index.py'
```

The four-candidate evaluator intentionally exits nonzero while the local
`reader` call is missing. Use Python 3.14 or later for compressed segment
reading and a short temporary directory for Unix socket tests.
