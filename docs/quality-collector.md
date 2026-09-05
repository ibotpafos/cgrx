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

Discover CBM from the installed purpose-built MCP registration/launcher, **not**
by guessing a binary name. On the development host the `codebase-memory-mcp`
registration identified `/Users/ila/.local/bin/codebase-memory-mcp`; `--help`
confirmed stdio and `cli` surfaces and initialization reported 0.10.8. CGRX's
registered launcher was `/Users/ila/.local/share/cgrx/bin/cgrx-mcp`. Inspect/pin
launcher targets too. The collector never installs, replaces, stops an existing
daemon, or edits MCP configuration. `argv[0]` must be an explicit absolute file;
all commands use subprocess argv, not a shell.

Example configuration (replace paths and project mapping with verified inputs):

```json
{
  "tokenizer": "cl100k_base",
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

```sh
/absolute/venv/bin/python /absolute/checkout/scripts/collect_quality.py \
  /absolute/corpus.json /absolute/collector-config.json /absolute/measurements.json
python3 /absolute/checkout/scripts/compare_quality.py /absolute/measurements.json
```

The collector returns 2 on missing inputs, errors, unsupported tasks or unknown
required measurements. Per-arm failures remain in the output; a corpus-level
validation failure is printed before launching engines. The unchanged comparator
rejects incomplete or unknown measurements. Do not substitute zero for null.

## Query semantics and truth

This first adapter measures **membership of the independently designated target
in the source's direct CALLS results**. It does not treat a single curated target
as an exhaustive outgoing-edge oracle. Expected records use the target's curated
`path:symbol:start_line`. Actual membership requires returned path, symbol and
line within that same source-verified target anchor. Other outgoing relationships
are not scored as false positives. Optional lexical distractors in the corpus
are not automatically converted into semantic negative CALLS truth.

CGRX uses depth-1 `trace_path`, an exact source path/name and verified root span;
CBM uses a separately checked unique source anchor and a bounded `query_graph`
CALLS query. CBM's installed table contract (including empty-result hints) is
parsed strictly; unknown fields/row shapes/counts fail closed. Full returned
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
