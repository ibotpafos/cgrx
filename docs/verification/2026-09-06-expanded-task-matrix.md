# IBO-271 expanded multiproject task matrix

## Corpus change

The source-curated corpus grows from 117 to 195 assertions across the same seven
pinned repositories. The 78 added assertions were selected and anchored before
either engine was run:

| Added slice | Assertions | Split | Evidence form |
| --- | ---: | --- | --- |
| Private corpus C TypeScript | 38 | heldout | `this.<readonly constructor service>.<method>()` |
| CGRX Rust | 18 | train | direct, method and recursive repository-local calls |
| Private corpus B Go | 22 | heldout | package-local and receiver calls |

Each source, target and call site is pinned to a committed revision with a
full-file SHA-256 and an inclusive raw-line SHA-256. The validator also enforces
that no evidence file crosses train and heldout. Standard-library Rust receiver
calls were excluded because their definitions cannot be anchored inside the
repository. Graph output was not used to choose or label an assertion.

The resulting language balance is Python 87, TypeScript 51, Go 38 and Rust 19.
It contains 140 CALLS, 24 IMPORTS, 17 REFERENCE and 14 UNRESOLVED assertions;
155 are heldout and 40 are train. This remains a bounded corpus rather than an
exhaustive claim about every language construct.

## Full paired observation of the added layer

The frozen 78-ID selection was run with three warm measurements after one
warmup. “Target observed” means the designated source-anchored target appeared
in the tool result. It does not turn incomplete telemetry into a successful
measurement.

| Engine | TypeScript | Rust | Go | Total | Median warm request |
| --- | ---: | ---: | ---: | ---: | ---: |
| CGRX candidate | 38/38 | 11/18 | 21/22 | 70/78 | TS 31.75 ms; Rust 15.62 ms; Go 93.59 ms |
| CBM reference | 0/38 | 13/18 | 22/22 | 35/78 | TS 15.08 ms; Rust 14.16 ms; Go 32.40 ms |

CGRX completed every arm with frozen source identity. CBM returned stable query
responses and designated-target observations where shown, but all of its arms
remain formally incomplete because the installed endpoint is a proxy and its
process RSS is unavailable. Therefore the table is a bounded target-membership
comparison, not a complete precision/recall or resource-efficiency result.

CGRX's misses are concentrated in seven Rust calls and one Go receiver call:
Rust `self` method resolution, recursive calls, a `Witness::valid` receiver and
Go `shard.cleanupLocked`. The reference misses all 38 exact TypeScript service
receiver calls and five Rust calls. These clusters provide concrete next slices
for implementation and regression tests without changing the heldout answers.

## Evidence and boundary

The frozen configuration, raw collector log and JSON measurements are under
`local/evidence/IBO-271-EXPANDED-20260906/` in the primary checkout. The corpus
validator passed all 195 assertions. The comparison also left private corpora C and B
and CGRX snapshot working trees unchanged.

This records local corpus and paired-tool evidence only. The branch is not
pushed, merged, installed into the registered launcher, or deployed.
