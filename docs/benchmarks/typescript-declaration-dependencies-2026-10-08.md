# TypeScript declaration dependencies

CGRX now proves named TypeScript imports and declaration-owned references to
types, `typeof` operands and ordinary values. Previously, the frozen native
corpus had no supported REFERENCE assertions; a decorated exported class also
lacked its named import dependency. `find_usages` now accepts IMPORTS and
REFERENCES scopes, and `get_outline` exposes proven named import bindings.

For example, `notificationEnvelopeSchema` now references the declaration of
`notificationPayloadSchema` used as the receiver of `extend`. This establishes
the schema binding's identity, without establishing the callee of Zod's
`extend`. Type aliases such as `NotificationChannel` reference their schema
declarations through `typeof`. The Vocal controller's `AuthService` import
points to its decorated exported class.

The implementation extends the existing Tree-sitter parser and conservative
module/configuration resolver. It adds declaration facts separately from
callable facts: functions, classes, plain variables, interfaces and type aliases
can be dependency targets. Named/default imports, aliases, explicit re-exports
and type-only bindings retain their namespace restrictions. New dependency
definitions never enter the generic CALLS fallback. The TypeScript
[module reference](https://www.typescriptlang.org/docs/handbook/modules/reference)
describes the different type, value and namespace roles; this implementation
supports a bounded subset of those semantics.

References belong to an exact indexed declaration, not a synthetic identifier
node. Parameters, type parameters, block bindings, hoisted `var`, catch and loop
bindings, conditional/mapped types, anonymous owners and namespace/module
ambiguity can prevent a proof. Relevant module augmentations and ambient
module overrides also prevent unsupported merges. An unrelated `declare global`
or augmentation of another resolved module does not merge a module's local
declarations. Script-global lookup remains unsupported. A refused parsed site
retains an owned coverage gap; a missing edge never establishes absence.

Proofs carry exact source/definition spans, current source hashes and
`PROVEN / SYNTAX_EXACT` evidence. Opening or refreshing an index rederives native
dependency arcs from its declaration ledger. Missing source/target facts,
conflicting candidates or stale required metadata withdraw affected proofs.
Public import sources have no definition `symbol_ref`; symbol selection remains
limited to actual syntax definitions. Architecture reference dependencies reuse
the current native receipt. Existing file-level architecture import resolution
has its separate contract.

Extraction policy is default125, JavaScript133, and combined
JavaScript/PHP/Swift139. SCIP policy remains3. The ten old native117 corpus
states were rejected with `extraction_revision` and preserved byte-for-byte.
The ten independently rebuilt133 states have identical source inventories,
source hashes and repository revisions.

| Original frozen assertions | Native117 | Native133 |
| --- | ---: | ---: |
| CALLS | 145/146 | 145/146 |
| IMPORTS | 24/33 | 25/33 |
| REFERENCE | 0/24 | 9/24 |
| UNRESOLVED with owned gap | 23/23 | 23/23 |
| Total | 192/226 | 202/226 |

All226 assertions remain in the denominator. No unmatched PROVEN edge occurs
at their owned sites. The24 source-validated lexical distractors remain lexical
provenance checks, not runtime negatives. This result does not establish
whole-repository precision. The stronger evaluator also checks TypeScript
declaration roles, namespaces, binding/member ownership, caller identity and
source/target ledgers; corrupt receipt cases are tested separately.

The selected TypeScript slice remains **10/11**: nine references and the Vocal
class import pass in both public response profiles. The Pyramid `main.tsx`
default `App` import is still a failed positive with an owned gap because its
project references/`resolveJsonModule` configuration exceeds the native module
policy. Local same-module references do not need module-resolution configuration;
this closes the separate Pyramid `openProject → Project` reference. No original
requirement was removed to obtain the improved score. Eight other imports,
15 references and the previously reviewed native Rust receiver assertion remain
missing in the complete corpus.

Independent identity evidence uses the isolated official
[TypeScript6.0.3 package](https://registry.npmjs.org/typescript/6.0.3), its
`createProgram`, `getSymbolAtLocation` and `getAliasedSymbol` API. The official
tarball's SHA1/SHA512 integrity was verified before bounded extraction; archive
SHA256 is `33cd0ee1beaa8c9e9d15a9da836c62ddea4c34a42d7c2d349dbc80d94165d22a`.
The SDK is evidence-only: no package installation, product dependency or global
MCP configuration changed. This is a pinned compiler experiment, without a claim
about other compiler versions or successful whole-project type checking.

The compiler independently resolves all11 original identities. All46 constructed
controls are also checked against compiler declarations:30 single/no-declaration
expectations were already explicit in the frozen manifest;16 shadow/merge cases
have additional manually read binding or complete declaration-set expectations.
The native result is21 exact targets (eight imports,12 references, one retained
named call) and25 owned refusals (three imports,19 references, three calls).
Deliberate invalid namespace/callee uses produce compiler diagnostics and remain
native refusals. Two early manual wrong-namespace expectations were corrected
without changing fixtures, native requirements or the original40 controls.
Earlier observations are retained.

Public replays verify both `full` and `token-efficient` profiles, exact target
selection, snippet/source agreement, relation filters and index immutability.
For negative controls, queries check compiler declarations present in the native
syntax inventory; all25 refusals separately require owned native gaps. The
retained Go experiment still selects six exact targets and refuses two cases;
real Rust remains native4/5 and hybrid5/5. Live real SCIP A/B replay withdraws
stale A, rejects unchanged stale republication, and restores B without restarting.
The two CPython-executed shadowing cases still remove four actual wrong global
proofs across both profiles and restore exact proofs after source reversion.

| Verification | Passed | Skipped/ignored |
| --- | ---: | ---: |
| Python script tests | 192 | 2 |
| Default workspace | 938 | 9 |
| JavaScript workspace | 950 | 9 |
| Combined language CLI/languages | 774 | 3 |

Format, both workspace Clippy profiles with `-D warnings`, and the JavaScript
release build pass. After these checks, only the PHP-feature-gated migration
test's current-policy expectation changed111→127. Its previous bytes are
hash-verified; the combined suite, format and release were checked at the final
freeze, while the unaffected successful checks retain their original logs.
Failed intermediate runs are preserved. The reviewed binary SHA256 is
`791b125d4733ea0828ac139574a7b73bb6c586bae7f2a6c4833bfdd7984ce2ba`.
Schema size is4145 tokens against the unchanged4150 ceiling.

Resource observations use one jointly correct retained CALLS task per each of
the ten repositories, one warmup and three sequential repeats per role/profile.
Role order alternates between repositories. These are endpoint measurements,
without independent agent runs or competitor measurements.

| Observed cost | Native117 | Native133 |
| --- | ---: | ---: |
| Full: median warm query | 0.266ms | 0.402ms |
| Compact: median warm query | 0.235ms | 0.366ms |
| Full: median maximum sampled PID RSS | 57.75MiB | 79.10MiB |
| Compact: median maximum sampled PID RSS | 55.62MiB | 82.07MiB |
| Full: wire bytes across30 requests | 84,003 | 83,997 |
| Compact: wire bytes across30 requests | 29,478 | 29,475 |

RSS sampling is not process-tree peak measurement; startup time is recorded
separately. Model-visible content text uses the same bundled `o200k_base`
tokenizer:11,208 versus11,133 tokens per profile. Wire envelopes, prompts,
structured-content duplication and whole-agent cost are outside that token
measure. Snapshot/reference variation can explain small token differences; no
token-cost improvement is claimed. The extra dependency inventory raises memory
and warm-query cost, so reducing that overhead is outstanding work.

Evidence lives under the local ignored directory
`local/evidence/competitive-20261007/corpus-recovery`: the
`typescript-dependencies-*` reports, official SDK provenance, immutable index
manifests, verification logs and `reproduction-typescript-dependencies` scripts.
The authoritative goal checkpoint links the committed source, binary and sealed
observations. All source input hashes are matched to committed Git blobs.

The overall competitive goal remains ACTIVE. Independent equivalent whole-task
agent comparisons, broader compiler truth and the remaining language/module
relationships still need evidence. This iteration establishes ten additional
correct native corpus answers with retained refusals, not overall competitor
superiority.
