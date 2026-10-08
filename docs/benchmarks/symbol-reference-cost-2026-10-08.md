# Symbol reference cost, 2026-10-08

Exact selection made same-name definitions addressable, but its 71-character
hexadecimal references increased response costs. This iteration emits a
50-character `cgrxs2` reference using the complete 32-byte BLAKE3 digest.
References issued by the preceding `cgrxs1` implementation remain accepted
within their original index and snapshot.

## Identity, compatibility and reuse

Only the wire encoding changes. The digest still binds the index location,
revision/working-tree/generation snapshot, extraction policy, node ID,
definition name/path/range and indexed source hash. Selection decodes either
supported format and compares full digests; it also retains the globally unique
syntax-node check and all name, path, scope and freshness constraints. Invalid
or unmatched references never trigger name fallback. Responses emit the current
format even when a request supplies a legacy reference.

The implementation reuses the already locked and cached `base64` 0.22.1
dependency, its [URL_SAFE_NO_PAD engine](https://docs.rs/base64/0.22.1/base64/engine/general_purpose/constant.URL_SAFE_NO_PAD.html),
and the core's strict lowercase-hex deserializer. The
[RFC 4648 canonical encoding rules](https://www.rfc-editor.org/rfc/rfc4648.html#section-3.5)
were reviewed. Decoding rejects padding, foreign alphabet bytes, nonzero unused
bits, incorrect lengths and unsupported versions. No package download, version
update, external configuration or installed-server change was required.

This is a query-only change. The JavaScript-enabled binary keeps extraction
revision 101, and saved graph segments do not need reindexing. The complete
schema remains 4137 tokens under the original 4150 ceiling. Initialization
instructions retain their original 512-byte ceiling.

## Paired measurement

The baseline is commit `1aca167ca2f0ecd1e83ccac84cbf5bf7966549d8`, binary SHA-256
`f7b827feb37eebebbdcea1bd3435d78ca93d968e3dd06e7f6b54d6a2efee3689`.
The candidate binary is SHA-256
`9a602476215a4eb93d4025dda5f930fe8a0b99729f5f70c1029ee4ec7d28492b`.
Source-file and tokenizer hashes are recorded with the saved observations.

The saved workload selects the first five syntax definitions per index, sorted
by path, definition start/end and node ID, across all ten retained snapshots.
All 50 anchors remain in the plan. Each profile makes 300 paired queries:
discovery, outline, snippet, incoming trace, outgoing trace and usages for every
anchor. Paired RPC IDs and arguments match apart from the reference encoding.
Query scopes and existing limits remain bounded. Decoding references to the
same complete digest makes each paired response equal, including all other
fields; snippets also match the frozen definition ranges and indexed hashes.

The project's bundled `o200k_base` tokenizer counts the exact emitted text,
serialized requests and serialized JSON responses. Response bytes include the
framing LF; token counts exclude it. Counts exclude initialization, tools/list,
chat wrappers, reasoning and the separate compatibility checks.

| Metric | Profile | Baseline | Candidate | Reduction |
|---|---|---:|---:|---:|
| Emitted content text tokens | Both, per profile | 75,979 | 69,586 | 8.414% |
| Serialized request tokens | Both, per profile | 37,180 | 35,540 | 4.411% |
| Serialized response tokens | Token-efficient | 88,413 | 82,020 | 7.231% |
| Serialized response tokens | Full | 201,860 | 189,074 | 6.334% |
| Response bytes | Token-efficient | 234,095 | 217,988 | 6.881% |
| Response bytes | Full | 538,645 | 506,431 | 5.981% |

Both profiles emit the same compact content text; the full profile additionally
includes structured content. In each profile, 295 individual content responses
use fewer tokens and five use one or two more. Shorter encodings therefore do
not guarantee a token reduction for every individual string or response.

## Verification and retained evidence

All 300 separate candidate calls using actual legacy references from the old
binary pass across the three selection tools, 50 anchors and both profiles.
All ten indexes retain identical node/edge segment hashes after replay.
The eight original constructed Go compiler cases retain six designated exact
targets and two abstentions per profile; all 226 original source assertions
revalidate. These checks do not grade the complete negative corpus.

Three new regressions cover full-byte preservation, strict canonical decoding,
and cross-version selection/snapshot guards. The actual MCP lifecycle test now
sends both formats in both profiles, verifies rejection in another repository
with the same Git commit and after refresh, and checks that neither format,
source text nor raw arguments enter usage logs. Existing static/observed/all
selection and colliding-identity regressions remain in place.

Formatting, 895 default workspace tests, 907 JavaScript-enabled workspace tests,
732 combined CLI/language tests, both all-target Clippy profiles with warnings
denied, and the optimized JavaScript-enabled build pass. The existing ignored
counts remain nine, nine and three respectively. Product sources stay unchanged
through final verification and public replay. The CGRX risk scan is partial;
its empty findings do not establish absence of risks.

Local reproduction and JSON evidence are saved beneath
`local/evidence/competitive-20261007/corpus-recovery` in the evidence repository:
`reproduction-symbol-ref-cost/{verify,public,cost,probe}.py`, `count_tokens.rs`,
`symbol-ref-cost-{source-provenance,tokenizer-provenance,plan,public-selections,public-measurements}.json`,
and `verification-summary-symbol-ref-cost.json`. The immutable workload hash is
`6d2c69173d76e30c854f426775e1024065a4938b1962a3579da1a42b8dcc4de9`.
The first three measurement adapters are preserved separately: an unsupported
search limit, an assumed full-profile ID field, and an incorrect compact ID
conjecture. Their fixes change neither product source nor the 50-anchor plan.
The tokenizer probe's initial panic-strategy build error is recorded separately
from its successful release-compatible build.

## Limits

This is a deterministic local comparison with the preceding CGRX version.
It measures published query payloads on existing snapshots, rather than an
independent agent workload or competitor result. Whole-task agent costs,
paired latency/RSS and complete quality/negative grading remain open. The
installed discovery MCP has not been replaced. Overall competitive superiority
has not been established, and the broader goal remains active.
