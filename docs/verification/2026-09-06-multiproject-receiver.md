# IBO-271 multiproject receiver-call slice

## Scope

This slice extends the existing paired CALLS corpus from five to seven pinned
repositories and from 111 to 117 assertions. The six new train assertions were
read directly from Vocal School, General Digits and CGRX source before either
engine was run. Configuration selection is explicit and outcome-independent.

The implementation adds exact TypeScript resolution for
`this.<constructor parameter property>.<method>()` when the property is a unique
`readonly` parameter, its type is a unique normal import, the imported class and
export chain are unique, and the target method has one exact syntax span. Regular
nested functions, mutable/plain parameters, ambiguous modules, duplicate exports,
source/config hash changes and unsupported configuration still abstain. The
reviewed Vocal configuration chain now accepts the neutral options it uses and
`moduleResolution: "node"`; other unreviewed resolution values still fail closed.

The collector now preflights every selected repository, records full and selected
corpus hashes, and continues with unrelated frozen repositories after a per-arm
source mutation. It never cleans the mutated repository itself.

## Paired observations

All query times below are the median of three warm requests. Response-token
counts describe each engine's JSON-RPC response shape and are not comparable
agent token budgets. CBM process memory remained unknown because the installed
endpoint is a proxy, so every CBM arm is formally incomplete even when target
membership is observable.

| Snapshot/task slice | CGRX designated targets | CBM designated targets | CGRX median | CBM median | Result boundary |
| --- | ---: | ---: | ---: | ---: | --- |
| Vocal controller receivers, baseline CGRX | 0/3 | 0/3 | 30-32 ms | 14-20 ms | Both missed before this slice |
| Vocal controller receivers, candidate CGRX | 3/3 | 0/3 | 26-27 ms | 12-16 ms | Candidate adds three exact edges |
| CGRX `git_text -> git_bytes` control | 1/1 | 1/1 | 14 ms | 13 ms | Both return the designated target |
| GD dashboard alias canary | 1/1 | unknown | 387 ms | 44 ms before failure | CBM changed tracked index artifacts |
| GD engineers alias canary | 1/1 | unknown | 390 ms | 44 ms before failure | CBM changed tracked index artifacts |

The earlier unchanged-binary screen also found the designated target in all four
selected VEX, Pyramid, Blinker and ItsDangerous CALLS assertions for both engines.
CGRX warm medians were about 81 ms on VEX and 9-11 ms on the three smaller
snapshots; CBM was about 29-34 ms on VEX and 12-16 ms on the smaller snapshots.
This bounded membership screen does not establish global precision, recall or
superiority.

CBM was configured with `persistence=false`, yet its shared daemon rewrote
`.codebase-memory/artifact.json` and `.codebase-memory/graph.db.zst` in the clean
GD snapshot. The collector detected the byte change and failed the CBM arm. Each
mutation was preserved in a named reversible stash before the next canary; no
reference result is claimed for those two GD tasks.

## Evidence and release boundary

Raw configurations, collector logs, JSON measurements, source-mutation patch and
snapshot material are under
`local/evidence/IBO-271-MULTIPROJECT-20260905/`. The candidate results are
`measurements-candidate-final.json`, `measurements-candidate-gd-dashboard.json`
and `measurements-candidate-gd-engineers.json`.

This document records local source, build and paired-tool evidence only. The
branch is not pushed, merged, installed into the registered launcher, or deployed.
