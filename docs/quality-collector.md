# Paired quality collector (bounded CALLS slice)

`collect_quality.py` produces the existing `compare_quality.py` schema without
changing the comparator or either corpus. Python 3.9+ is supported; install a
pinned `tiktoken` in a dedicated environment (the development smoke used 0.12.0).
This is **tool-request measurement**, not agent end-task correctness or agent
whole-task token totals. No heldout tuning or superiority result is supplied.

## Inputs and endpoint discovery

Supply the existing independently curated real-task corpus and a separate JSON
collector configuration. `validate_real_tasks.py` validates provenance and source
anchors before execution. The collector additionally requires a clean canonical
Git root, exact HEAD and byte-equal tracked files (no submodules/symlinks). Its
SHA-256 snapshot digest frames sorted tracked paths and file bytes with 8-byte
big-endian lengths. It rechecks source and executable hashes after each arm.
This is before/after verification, not an OS-enforced source lock.

`validate_language_coverage.py` checks the corpus against
`contracts/language_coverage_v1.json`. The contract is tied to the language packs
registered by `pack_for_path` and requires CALLS, IMPORTS, REFERENCE and
UNRESOLVED tasks for every supported source extension. A newly registered pack,
extension, missing relation cell, stale task ID, wrong relation or wrong source
extension fails closed. This proves the declared matrix is populated; it does
not claim every construct in a language grammar has a semantic oracle.

Discover CBM from the installed purpose-built MCP registration/launcher, **not**
by guessing a binary name. Verify the resolved executable with `--help`, then
record its stdio/CLI surfaces and initialization version. Resolve the CGRX
launcher the same way and inspect/pin both launcher targets. The collector never
installs, replaces, stops an existing
daemon, or edits MCP configuration. `argv[0]` must be an explicit absolute file;
all commands use subprocess argv, not a shell.

Example configuration (replace paths and project mapping with verified inputs):

```json
{
  "tokenizer": "cl100k_base",
  "selection": {
    "relations": ["CALLS"], "splits": ["train"],
    "repos": ["/absolute/canonical/repo"]
  },
  "protocol": {
    "cache": "warm", "repetitions": 3, "warmups": 1, "retries": 0,
    "limit": 20, "timeout_seconds": 60, "max_response_bytes": 2000000,
    "request_budget": 9
  },
  "engines": {
    "cgrx": {
      "argv": ["/absolute/verified/cgrx", "serve", "--multi-repo"],
      "cwd": "/absolute/working/directory", "mode": "multi-repo-default",
      "artifacts": ["/absolute/underlying/binary"],
      "rss_scope": "direct-process"
    },
    "cbm": {
      "argv": ["/absolute/verified/cbm-launcher"],
      "cwd": "/absolute/working/directory", "mode": "fast",
      "projects": {"/absolute/canonical/repo": "dedicated-measurement-project"},
      "rss_scope": "endpoint-only"
    }
  }
}
```

Optional `env` maps explicit environment variables for each endpoint. Pin mode
and all relevant launcher/interpreter artifacts. `mode` describes operator
configuration; CBM indexing actually receives its configured mode. Initial
server versions and tools/list digests are recorded and must stay stable.
The config/corpus content hashes and tokenizer implementation/version/encoding
vocabulary digest are retained. Tool protocol/schema failures are not successes.
Use dedicated endpoint state where supported; a shared daemon is not isolated.
`selection` is optional and preregistered: it may contain nonempty `ids`,
`relations`, `splits`, `repos`, or `categories` arrays. Unknown keys, duplicate
values, or a selection matching no tasks fail before an endpoint starts. The
output retains both the full-corpus hash and a hash of the selected task records.

```sh
/absolute/venv/bin/python /absolute/checkout/scripts/collect_quality.py \
  /absolute/corpus.json /absolute/collector-config.json /absolute/measurements.json
python3 /absolute/checkout/scripts/compare_quality.py /absolute/measurements.json
```

The collector returns 2 on missing inputs, errors, unsupported tasks or unknown
required measurements. Per-arm failures remain in the output; a corpus-level
validation failure is printed before launching engines. The unchanged comparator
rejects incomplete or unknown measurements. Do not substitute zero for null.
Every selected repository is frozen before the first engine starts. Its snapshot
is then checked before each arm. If an engine changes a tracked source or index
artifact, that arm fails and later arms on other clean repositories continue;
the collector never resets or hides the mutation.

## Query semantics and truth

This first adapter measures **membership of the independently designated target
in the source's direct CALLS results**. It does not treat a single curated target
as an exhaustive outgoing-edge oracle. Expected records use the target's curated
`path:symbol:start_line`. Actual membership requires returned path, symbol and
line within that same source-verified target anchor. Other outgoing relationships
are not scored as false positives. Optional lexical distractors in the corpus
are not automatically converted into semantic negative CALLS truth.

CGRX uses depth-1 `trace_path`, an exact source path/name and verified root span.
The response must attest depth 1 and direction `callees`; every returned node
must have integer hop 1 and direction `callees`. Missing or contradictory
metadata fails the arm instead of counting a caller or transitive node as a hit.
CBM uses a separately checked unique source anchor and a bounded `query_graph`
CALLS query. The lookup must return the requested normalized path, symbol and
line within the curated source anchor, not merely one arbitrary row.
CBM's installed table contract (including empty-result hints) accepts only
`name path line` or `name path line strategy confidence` columns, including
zero-row tables. Unknown table columns, invalid row shapes/counts and malformed
optional continuation flags fail closed. Present `truncated`/`has_more` flags
must be booleans; `next` must be null or a string (nonempty means incomplete).
Tool `isError` must be boolean when present; malformed text blocks, nodes and
spans become failed arms, not uncaught attribute errors. Full returned
responses and matching target evidence are retained. CBM resolver/confidence
values are preserved, **not upgraded** to exact proof; graph assertions remain
engine assertions. Source truth never comes from either graph. REFERENCE tasks
remain explicit failed/unsupported rows in both arms, never empty successes.

CGRX `truncated`, CBM cap equality/continuation flags, malformed counts, RPC
errors, duplicate JSON keys, non-finite JSON, wrong response IDs, ambiguous or
missing source, timeouts, byte-budget overruns and changing answers prevent
complete collection. `complete` concerns bounded output collection, not global
semantic coverage. Status coverage and raw responses remain available for audit.

## Paired protocol and metrics

* Same corpus/order, query limit and per-arm request ceiling. Arm order alternates
  by task, independent of results. No task selection based on engine outputs.
* `request_budget = repetitions*(1+retries) + warmups + 5*sessions`, with one
  session for `warm`, or one per repetition for `process-cold`. This common
  ceiling includes initialize, tools/list, status and CBM index/source lookup;
  actual usage is recorded. Notifications do not consume request slots.
* Warm mode keeps one process per task/arm and runs the declared warmup count.
  Process-cold restarts endpoints and forbids warmups. It does **not** clear disk
  indexes or OS caches; setup/index/status precedes timed requests. A CBM proxy
  restart does not restart its account daemon. Do not call this engine-cold.
* Setup (handshake, tools/list, index preparation, status, source lookup and
  warmups) is recorded separately and excluded from timed query samples.
  CBM explicitly indexes with `persistence=false` into the supplied project;
  CGRX status opens/refreshes its managed index. Neither writes source files.
* Each request shares one monotonic deadline across nonblocking stdin writes
  and response reads. Notifications also have bounded writes. A failed write
  invalidates that transport so retries cannot append to a partial JSON frame.
  Closing stdin does not flush pending Python-buffered bytes. Process teardown
  has its separate existing bounded waits; it is not part of query latency.
* Timings use `perf_counter_ns` around each measured request/retry sequence.
  Failed attempts retain timing/error metadata. Only RPC/transport failures
  retry, within the fixed budget; tool errors fail immediately. Lost response
  bytes imply unknown tokens even if a later attempt succeeds, so that arm
  remains incomplete. No error sample is silently dropped for a better median.
* Response tokens sum exact received JSON-RPC response frames across measured
  repetitions/attempts using the same pinned tokenizer; setup is excluded.
  These are **not whole-task agent token totals**, nor bytes divided by four.
* A background `ps` sampler measures actual endpoint PID RSS about every 20 ms.
  `endpoint_peak_rss_bytes` is a sampled high-water lower bound, not OS peak RSS,
  whole-machine memory, process-tree memory or daemon memory. Sampler overhead
  may perturb timings. `peak_rss_bytes` is populated only for an independently
  verified direct engine process (`rss_scope=direct-process`). For a proxy,
  leave `endpoint-only`/`unknown`: engine RSS stays null and the comparator is
  deliberately blocked. Do not relabel a CBM proxy to make a benchmark pass.

## Verification boundaries

Dedicated tests use explicit synthetic in-memory and local Python mock transports.
They verify failure handling, pairing, budgets, warm/process-cold behavior and
comparator schema, not engine quality. Genuine smoke may use manually authored
synthetic source; label that separately from both mock transport tests and the
heldout product corpus. The genuine smoke reached both local engines (checkout CGRX and installed CBM)
on one train-only Python assertion. CBM used an existing shared account daemon:
its engine RSS remained unknown; no comparator-ready product benchmark resulted.
The older installed CGRX release also missed five of eight current relationship
corpus cases; use the assigned checkout build for the unchanged-corpus control,
not that stale release as evidence of current-checkout recall.

Remaining product work: independently curated semantic negatives/exhaustive
oracles where required, REFERENCE adapter, controlled daemon/process memory,
true cold-index protocol if desired, and a separately preregistered agent-level
plain-source/CGRX/CBM experiment measuring end-task correctness and all tokens.

### Frozen-source validation cost

The collector streams committed blobs through one `git cat-file --batch` process
per snapshot instead of spawning `git show` once per tracked file. It still
compares every working file byte-for-byte with its pinned blob (including files
marked assume-unchanged), checks inventory, and preserves the framed SHA-256
source digest. Symlinks/submodules remain unsupported. This reduces validation
setup cost; it is not an improvement to the measured engine query latency.
