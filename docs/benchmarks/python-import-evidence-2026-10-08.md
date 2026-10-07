# Python relative import evidence — 2026-10-08

Explicit Python `from .module import name` clauses now produce named import
relationships to unique plain function/class declarations. `get_outline`
exposes each local name, target path and definition span, and the import
clause's span, source hash, resolver and confidence. The normal token-efficient
MCP profile includes these bindings in an `imports` table. Symbols and imports
have separate counts and truncation flags; `limit` bounds each collection.

The implementation composes the existing pinned Tree-sitter Python grammar,
file hash ledger and runtime normalization. No new dependency is installed.
It models explicit source dependencies inside regular packages, rather than
executing [Python's extensible import system](https://docs.python.org/3/reference/import.html).

## Source recovery and before/after measurement

The frozen contract contains **226 assertions in ten repositories** across the
seven default languages. Its older description counted the original 210 cases
without the 16 appended C/Kotlin assertions. Four snapshots were restored into
separate Git copies using their original commits:

| Fixture | Exact revision |
| --- | --- |
| CGRX | `b8d828524b903abeb053db9faef5abba40fea509` |
| gd | `9d77eb9b8feea3c9063240eeefdacdd1b4b83bc0` |
| pyramid-agent | `dbca43c53d7f49bbf988813cd97720098be3ac3f` |
| Vex | `da5cd1a21f8f4650798cc19c92ff8790b324e6d3` |

Only task repository roots were remapped. Full-file SHA-256, raw inclusive-line
SHA-256, symbols, source pins and semantic assertions were preserved. The
source validator passes all 226 cases, and the default coverage validator
passes seven languages, ten extensions and 40 relation cells. Every repository
was indexed into a separate fresh state with the tested binary.

The following 24 import assertions were selected by relation and language
before scoring, without changing their targets or anchors. They are marked
heldout in the original corpus, but were inspected while implementing this
change; this is validation informed by the cases, not blind generalization.

| Frozen source | CGRX before | CGRX after | CBM designated-target membership |
| --- | --- | --- | --- |
| [Blinker](https://github.com/pallets-eco/blinker/tree/c3364059663df1ddce32799d6b1922af89a345f6) | 0/6 | 6/6 | 6/6 |
| [itsdangerous](https://github.com/pallets/itsdangerous/tree/672971d66a2ef9f85151e53283113f33d642dabd) | 0/18 | 18/18 | 18/18 |
| Total | 0/24 | 24/24 | 24/24 |

The before arm uses commit `c5c5bb1043bb386e07aa1a8c06c447d3b60767ca`,
binary SHA-256
`7575d8d59655649caab9f91a9f1151db71de83d71bd4c076457857ab538bc258`.
The after binary SHA-256 is
`6027fe4167c12bcacc5140a92695533955e765e3192eb3058b0f2a72b872eeda`.
Both are optimized macOS builds with the same JavaScript opt-in policy.
The default seven-language registry is preserved. The new cache base is 45;
PHP adds 2, Swift 4 and JavaScript 8, so this measured build uses revision 53.
Old caches require a source reindex.

For CGRX, each assertion requires the right named import member, exact source
and target identities/spans, matching evidence and ledger hashes, and
`SYNTAX_EXACT` / `PROVEN` evidence without assumptions or counter-evidence.
Other legitimate members on the same import line are not false edges for that
assertion. The 24 selected members have zero unmatched proven targets. This
does not estimate repository-wide precision. All 24 bindings also pass through
the public token-efficient MCP `get_outline` response, including a `limit=1`
truncation control.

The [CBM](https://github.com/DeusData/codebase-memory-mcp) arm initialized the
explicit installed binary as version 0.10.8, SHA-256
`996bad5fe6fb89c0c50363d87f03dc78f6e536aeea746c06679a294d14eca435`.
It freshly indexed both exact source snapshots in full mode with persistence
disabled. Git identity and complete path-coverage responses were checked.
No cited path had a recorded issue; CBM's coverage signal is best-effort.

CBM was scored on the designated target's name, file and declaration line in
bounded source-file `IMPORTS` results. Those selected edge observations did not
supply strategy, confidence or import-site fields, so this arm does not score
the same proof obligations as CGRX. Missing fields are not treated as wrong
edges. This closes a measured gap and does not establish overall superiority.
Latency, memory and agent-token costs were not paired between the engines.

## Proof boundaries and verification

Relative clauses retain per-member spans, including aliases and multiple
members. Resolution requires current matching source/target/package ledgers,
regular package initializers and a unique source module candidate. Nested
relative paths cannot escape the known package chain. Stale or malformed
competing candidates remain blockers. Target declarations must be top-level,
undecorated, unique and unrebound in the supported source slice.

Namespace packages, absolute imports, wildcard/conditional/nested imports,
re-exports, imported variable aliases, dynamic loaders and complete Python
runtime behavior are outside this change. This source inventory does not
resolve native extension modules or external module-cache/loader overrides.
Supported relative clauses without a sufficient proof remain coverage gaps;
this is not complete coverage of all import syntax or Python calls/references.
Reading `self.__dict__` does not invalidate unrelated module declarations;
namespace writes and calls through `__dict__` remain conservative blockers.

Reopen reconstructs Python import arcs from current supporting facts. Refresh
rechecks target and package dependencies, removes obsolete facts on deletion
and restores proofs when valid source returns. Six source-fact tests cover
aliases, scopes, rebindings, decorators, namespace mutation and parser errors.
Six runtime tests cover actual storage, distractors, nested packages, ambiguous
modules, target/package changes and nine damaged supporting-ledger variants.
The compact formatter has an additional model-visible identity/truncation test.
The shared evaluator's 13 integrity tests and 58 provenance-validator tests pass.

The complete default workspace suite passes 873 tests (9 ignored), and the
JavaScript-enabled workspace passes 885 (9 ignored). The CLI/language suite
with JavaScript, PHP and Swift together passes 712 (3 ignored). Default and
JavaScript workspace Clippy checks pass with warnings denied. The dependency
feature-unification check, formatting and diff checks also pass.

Across the ten frozen repositories, existing CALLS, REFERENCES and CONTAINS
arcs are byte-equivalent before and after this change. Existing IMPORTS arcs
are preserved; 87 new Python IMPORTS arcs appear (6 Blinker, 44 itsdangerous,
37 gd). Only the 24 curated members above received the full assertion checks;
the additional arcs are not a precision benchmark.

The broader 226-case source validation is separate from relationship scoring.
General import/reference and abstention scoring remains incomplete. A bounded
designated-target CALLS diagnostic still identifies five Rust resolver misses
and one Go miss; it cannot be used as a whole-graph false-positive rate.
The original quality-comparator thresholds were not relaxed for this result.

## Reproduce

Use Python 3.14 or later for the standard-library Zstandard reader. Restore each
repository at its corpus revision and rebind only task roots. Select each
repository's `.py` / `IMPORTS` tasks into a separate schema-v2 corpus, preserving
their source assertions. Then run:

```sh
cargo build --locked --release -p cgrx-cli --features experimental-javascript
target/release/cgrx index --root /path/to/frozen/repo --state /tmp/python-import-state --json
python3 scripts/eval_curated_index.py /tmp/python-import-tasks.json /tmp/python-import-state --python-imports
python3 scripts/validate_real_tasks.py /tmp/restored-full-corpus.json
python3 scripts/validate_language_coverage.py /tmp/restored-full-corpus.json
cargo test --locked -p cgrx-cli --test python_import_runtime
cargo test --locked -p cgrx-languages import_fact_tests
cargo test --locked -p cgrx-mcp outline_import_tests
python3 -m unittest discover -s scripts -p 'test_eval_curated_index.py'
```

Use a short temporary directory on a volume with free space when running the
full suite: existing Unix socket tests require paths shorter than `SUN_LEN`.
