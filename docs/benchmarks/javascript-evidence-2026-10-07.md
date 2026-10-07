# Opt-in JavaScript evidence — 2026-10-07

The source build adds a separate `experimental-javascript` policy for `.js`,
`.mjs` and `.cjs`. The released alpha.16 default registry excludes these files.
The default seven-language coverage contract remains unchanged. The prototype
uses the MIT-licensed [Tree-sitter JavaScript grammar](https://github.com/tree-sitter/tree-sitter-javascript)
pinned to `0.25.0`, rather than parsing JavaScript with a TypeScript grammar.

The resolver tracks lexical identity, caller and target byte spans, module
binding and current file hashes. Accepted relationships are `SYNTAX_EXACT` /
`PROVEN`; a missing, stale, shadowed or ambiguous proof cannot fall back to a
global name match. Reopen reconstructs JavaScript arcs from the current ledger.
Refresh rechecks relative-module inventories and ancestor `package.json` type.
The measured `c5c5bb1` JS build has extraction revision 37; PHP adds 2 and Swift
adds 4, so all eight feature combinations have distinct cache identities.
The subsequent Python import change moves the source-build base to 45 and the
JS policy to 53. The following Rust lifetime iteration raises the source base
to 61 and the JS policy to 69. Existing indexes require a source reindex.

## Source-curated Express slice

`contracts/javascript_tasks_v1.json` preserves the four assertions curated on
2026-09-28, including full-file and raw inclusive-line SHA-256 anchors. Express
is pinned to [`98bd4cd96b250d25e1672c36f49cfc743bc801e7`](https://github.com/expressjs/express/tree/98bd4cd96b250d25e1672c36f49cfc743bc801e7).
These examples informed the implementation; this is a small source-anchored
validation slice, not a blind generalization benchmark.

| Assertion | CGRX opt-in result |
| --- | --- |
| `lib/utils.js`: `normalizeType` calls `acceptParams` | Exact caller, target and callsite proof |
| `lib/application.js`: `require('./view')` binds `View` | Exact import target in `lib/view.js` |
| `defaultConfiguration` references `View` | Exact caller, reference site and imported target |
| `mounted_app`: dynamic `fn.handle(...)` | No proven call target; an explicit enclosing dispatch gap remains |

The evaluator validates source provenance independently before reading the
index. It requires matching source/target identities and spans, current
evidence/ledger hashes, the exact resolver and no assumptions or counter
evidence. An abstention needs both a recorded unresolved call and a covering
dispatch gap. Calls that continue onto later lines are anchored by their start
line. The four assertions pass: 3/3 positives, 1/1 abstention, zero proven edges
at the curated negative site. These counts do not estimate repository-wide
precision, recall or completeness.

The optimized macOS build indexed 141 files (548,685 input bytes), producing
12,209 stored documents and 291 arcs. One fresh-state run took 214.3 ms with
uncontrolled OS page cache; this is a single observation, not a latency
distribution. The tested binary SHA-256 was
`7575d8d59655649caab9f91a9f1151db71de83d71bd4c076457857ab538bc258`.

The installed [codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)
server was indexed on the same Express SHA. It reported 1,263 nodes and 2,212
edges; the three cited JavaScript files had no recorded indexing issue and
metadata freshness matched. Its selected observations were:

| Trace | Installed CBM observation | CGRX opt-in |
| --- | --- | --- |
| Inbound `acceptParams` | Caller `utils`, `heuristic`, confidence 0.9; exact `normalizeType` search returned zero results | Exact function caller `normalizeType` |
| Outbound `mounted_app` | Candidate `handle`, `heuristic`, confidence 0.5 | Abstention for the dynamic receiver |

CBM explicitly labels those candidates as heuristic; this comparison does not
count them as proven false edges. The original Express comparison did not capture
the server version; the subsequent installed-binary check reported CBM 0.10.8.
Document/node counts use different schemas and are not a size-efficiency score.
The two traces do not establish overall superiority, and import/reference,
latency, memory and agent-token costs were not compared between engines.

## Verification and boundaries

JavaScript controls exercise lexical shadows, local arrows, ordinary function
expressions, `new`, ESM aliases, CommonJS defaults, unstable exports, module
modes, competing files, changed package type, refresh, deletion and reopen.
`new` requires an ordinary constructable function at the exact resolved target;
arrows, async/generator functions and unsupported class targets abstain.
The runtime unit controls also remove or corrupt 21 individual proof inputs.
The evaluator's eight integrity tests reject stale snapshots, inconsistent
hashes, wrong identities, extra proven targets and a falsely clean abstention.
The dedicated CI workflow checks Linux/macOS and dependency-only feature
unification; its hosted run is separate from the local checks.

Local `cargo test` completed with 860 default-workspace tests passed and 872
JS-workspace tests passed (nine existing ignored tests in each), and 700 tests
passed with JS/PHP/Swift enabled together in the CLI/language packages (three
ignored). Both default and JS workspace Clippy checks use `-D warnings`.

This slice excludes `.jsx` files and does not model JSX component bindings,
package aliases, namespace/destructured module
bindings, re-export chains, arbitrary receivers or complete Node resolution.
ESM relative imports require an explicit JS-family extension. CommonJS accepts
only a unique relative candidate and a stable callable default export. JSON,
native modules, manifests, case mismatches and ignored/symlink targets can block
a proof. Unsupported import parts remain coverage gaps even when a sibling
binding resolves. Missing package `type` permits the statically recognized
source mode; this is not a claim about every Node version's runtime behavior.

The standard contract still contains seven languages and 40 required relation
cells. The subsequent iteration restored four exact snapshots into separate
copies and validated all 226 assertions in ten repositories, preserving the
source hashes and line anchors. The old descriptive count of 210 omitted the
16 appended C/Kotlin assertions. Source validation does not mean every engine
relationship assertion passes. [Python import evidence](python-import-evidence-2026-10-08.md)
records this recovery and the next measured improvement. JS promotion still
requires broader reviewed `.js`/`.mjs`/`.cjs` coverage and remains opt-in.

## Reproduce

Use Python 3.14 or later for the standard-library Zstandard reader. The corpus's
local repository paths can be rebound without changing source anchors:

```sh
git clone https://github.com/expressjs/express.git /tmp/cgrx-js-express
git -C /tmp/cgrx-js-express checkout --detach 98bd4cd96b250d25e1672c36f49cfc743bc801e7
python3 - <<'PY'
import json
from pathlib import Path
corpus = json.loads(Path('contracts/javascript_tasks_v1.json').read_text())
for task in corpus['tasks']:
    task['repo'] = str(Path('/tmp/cgrx-js-express').resolve())
Path('/tmp/cgrx-js-tasks.json').write_text(json.dumps(corpus, indent=2) + '\n')
PY
cargo build --locked --release -p cgrx-cli --features experimental-javascript
target/release/cgrx index --root /tmp/cgrx-js-express --state /tmp/cgrx-js-state --json
python3 scripts/eval_curated_index.py /tmp/cgrx-js-tasks.json /tmp/cgrx-js-state
cargo test --locked --workspace --features cgrx-cli/experimental-javascript --no-fail-fast
cargo test --locked -p cgrx-cli --features cgrx-languages/experimental-javascript --test javascript_policy
```
