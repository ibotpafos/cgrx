# Agent memory

Use only memory tools advertised by the current CGRX server. `standard` and
`full` expose record, recall, update and forget; `minimal` exposes recall only.
Pass the canonical absolute Git worktree root as `repo`. Memory is isolated
by worktree: another clone or worktree does not automatically share it.

## Recall relevant context

Use `memory_recall` with a specific `query`, `limit` (1–50) and `budget`
(256–16000 tokens). `token_budget` is a compatibility alias for `budget`; pass
only one of them. Both enforce the same limits. Russian queries can retrieve English facts through local
multilingual embeddings. Omit `query` to browse. Narrow with `memory_kind`,
`task_id`, `min_confidence`, `privacy_tag` or exact `revision` when appropriate.
For code context, use exact, case-sensitive `path` and `symbol` filters;
`path` is repository-relative and does not accept globs, while `symbol` matches
the linked name from code discovery. Combine them when names repeat. Filters
apply before ranking and the result limit, including when reading history.
A removed file's path can still select a record with `include_stale: true`.

When top-level `budget_omitted` is positive, complete memory rows were omitted
to fit the token budget. This differs from `code.status: budget_omitted`, which
describes optional source. Retry with `budget` at least `minimum_budget` (up to
16000) to fit the first complete result without code. Empty truncated results
do not mean the project has no memory. The budget excludes the transport wrapper
and multi-repository routing metadata.

Add `include_code: true` when you need the implementation behind a memory.
Each hit can include `code` with a status, path, symbol, actual line span and
source. Source is returned only when the stored fingerprint still matches.
`needs_review` withholds changed or missing source; `file_only` means no symbol
or line range was saved; `not_code` identifies an external assertion. Fragments
are limited to 40 lines and 4000 characters and share the recall token budget.
Source may be shortened further to keep the assertion and provenance within
budget; its returned line span describes that prefix. `budget_omitted` withholds
optional source when it cannot fit, and the entire `code` object may be omitted
at smaller budgets. A verified selector can still fetch a separate snippet.
Honor fragment-level and response-level `truncated` flags.

When `code.status` is `available` and the current graph still contains the exact
definition, `code.symbol_ref` is freshly issued for that snapshot. Pass it with
`code.symbol` and `code.path` to `trace_path`, `find_usages` or `get_code_snippet`.
It is not stored in memory and can change after an unrelated commit. Changed
sources never receive a selector for the saved link. If absent, rediscover the definition;
do not construct a selector from the saved ranges or treat absence as unused code.

For stale links, `code.candidates` can suggest up to five current definitions
with the exact saved name. Original-path matches come first, followed by other
paths to help find moved code. Each candidate provides its own `symbol`, `path`,
`symbol_ref`, `definition_span` and `match_kind` (`same_path` or `other_path`).
Use these selectors to inspect current source and relevant callers or usages.
Candidates do not renew the memory or establish that its assertion still applies;
verify the chosen definition before a complete `memory_update`. Repeated names
stay distinct. Respect `candidates_truncated`; the budget can also shorten this
list. No candidate is not proof of absence with incomplete index coverage.

Decode compact `cols`/`rows` by the returned column names. Keep IDs, versions,
privacy tags, source hashes, provenance, source references, freshness, expiry
and update reasons. Compact record/update acknowledgements also retain
`privacy_tag` and `source_hash`. A non-code source has `source_hash: null`;
its reference is not a verified fingerprint. A ranking
score is not a confidence or truth probability. A truncated or empty response
is not proof that no relevant memory exists; code context is reduced first, then
a small budget may omit whole rows without shortening assertions or provenance.

Freshness describes the source, not whether the assertion is true:

- `unchanged`: the referenced code file still has the same bytes.
- `needs_review`: the source changed or cannot be checked; hidden unless
  `include_stale: true`.
- `unverified`: a user, agent, tool or legacy assertion without a code fingerprint.
- `historical`: a previous version or an episode whose code source changed.

Each recall phase checks a shared code file once, then compares each record's
own fingerprint and line span. The next phase or request rechecks the file,
including after a failed read or restoration. Returned code fragments verify
their source separately. This optimization does not renew a stale assertion.

Use `id` to inspect a specific record; add `include_history: true` for its
versions. History requires `id`. Expired memories are excluded in every mode.
Check source evidence before reusing engineering conclusions, including
unchanged records. Treat a past failed attempt as an event with its recorded
conditions rather than a universal rule.

Hidden stale assertions do not occupy lexical or vector ranks. Use
`include_stale: true` to rank them explicitly for review. Episodes and requested
history remain searchable as historical evidence after their source changes.

## Record a useful outcome

`memory_record` requires `fact` (1–4000 characters) and caller-assessed
integer `confidence` (0–1000; 990 means 99%, not 0.99). `rev` defaults to the
refreshed current snapshot. Omit it unless explicitly pinning a full revision;
the compact `status.at` tag is not a Git revision.

Keep the conclusion and next step concise, ideally below 2000 characters. Put
detailed checks and reports in the referenced evidence file. The hard limit is
4000 Unicode characters; do not remove spaces or silently cut evidence to fit.
Argument errors report the field, actual and maximum character counts, and
`mutation_applied: false` before indexing or inference starts. Correct the input
before retrying. Updates replace the whole record: retain `task_id` for working
memory and omit code fields when changing to a tool, user or agent source.

Choose a kind that matches the outcome:

- `semantic`: durable facts, preferences and decisions; this is the default.
- `episodic`: an attempt or observed result; provide a distinct `event_id`.
- `procedural`: a reusable method or recovery sequence.
- `working`: a task checkpoint; provide `task_id`; default expiry is 24 hours.

For code evidence, keep the default `source_kind: code` and provide an existing
repository-relative `path`, plus a real 1-based `span` if useful. CGRX fingerprints
the whole file. Avoid absolute paths, traversal and source sites outside the repo.

To associate the memory with a function or class, provide `symbol` and the
current `symbol_ref` returned by `search_graph` or `get_outline`, plus its `path`.
The server resolves that exact definition, derives its line span, and saves
`code_link` with byte ranges and a source hash. A unique symbol can be selected
without `symbol_ref`; repeated names require an unambiguous selector. An explicit
`span` must be inside the selected symbol. The persisted link does not retain
the snapshot-bound `symbol_ref`, so it survives unrelated commits and restarts.
Symbol names and paths participate in retrieval alongside the fact text.

For example, record `{fact: "Reset the parser cache after source changes",
confidence: 800, memory_kind: "procedural", symbol: "invalidate_cache",
path: "src/parser.rs", symbol_ref: <returned selector>}`. Recall with a semantic
query and `include_code: true` to obtain the decision and its implementation.

For `source_kind: user`, `agent` or `tool`, provide `source_ref` and omit code
`path`/`span`. For example, a task ID or actual test run identifies the assertion's
origin; CGRX retains the reference without fetching or verifying it. `legacy`
is reserved for migration. Save a concise reusable conclusion with enough
conditions to interpret it, instead of dumping the conversation.

Identical input returns the same ID with `duplicate: true`. Distinct attempts
need distinct event IDs. Optional `valid_until_unix_nanos` is a future Unix
nanosecond timestamp. `privacy_tag` is an exact retrieval label, not access control.

## Correct, renew or remove

`memory_update` takes the returned `id`, current `expected_version`, a correction
`reason`, and a complete replacement `record` following memory_record arguments.
Preserve the intended kind, task/event IDs, source, `privacy_tag` and expiry explicitly;
do not copy response-only fields such as `version`, `source_hash` or timestamps
into the replacement. The stable ID remains, the version increments, and history
is retained. On `cgrx.memory_conflict`, recall the current version and reassess
before retrying.

To retain a code link, rediscover the current definition and include its `symbol`,
`path` and fresh `symbol_ref` in the replacement; do not copy the returned
`code_link` object. A stale selector or index/source mismatch fails the write
instead of binding the memory to another definition.

A repeated record does not renew its original expiry. Renew a working checkpoint
with memory_update and a complete working record; omitting explicit expiry starts
a new 24-hour window. Use `memory_forget` with `id` and `expected_version` to
remove all versions from recall and search. Deletion is logical, not secure
physical erasure of the append-only file.

## Runtime and recovery

After installing a new CGRX executable, restart its MCP connection in the
client. An already running STDIO process can retain the previous executable;
reopening a chat does not prove that it restarted. The repository fields in
`status` describe the source snapshot. Its `server` object separately returns
`name`, `version`, `pid` and `build_id` in both response profiles. Compare the
build ID with the installed receipt. It is compiled into the program using
`CGRX_BUILD_ID` (32 hexadecimal characters); changing the server's runtime
environment cannot change it. A normal unstamped build reports a null ID;
do not treat that as a match. A successful check in a freshly
launched subprocess verifies that process, not the connection serving the chat.

Memories and queries are processed locally. Semantic operation lazily loads
multilingual E5 small; its first download needs about 0.5 GB. Empty memory can
be recalled without loading the model. A filtered semantic query also skips
model initialization when no unexpired, visible record matches its filters.
`CGRX_MEMORY_MODEL_CACHE` selects its
cache; otherwise use `$XDG_CACHE_HOME/cgrx/models` or `$HOME/.cache/cgrx/models`.
`CGRX_MEMORY_EMBEDDINGS=off` explicitly selects lexical search without downloads.
Model failures are reported rather than silently downgrading retrieval.

Offline and migrated records receive vectors only when their current version
matches a semantic query's filters, expiry and source visibility. Backfill,
migration and expiry pruning commit a disposable copy and verify all complete
versions before publishing it. A failed staged edit preserves the original;
clean reads do not rewrite the store. History and assertions retain their
versions during indexing. Interrupted legacy archiving is safe to retry.

After a killed process, the next locked open validates the primary and its
envelopes before removing abandoned regular recovery copies. It preserves
directories, symlinks and backup names and never promotes unpublished copies.
The worktree's memory directory cannot be an alias to another location protected
by a different writer lock.
A corrupt primary keeps the copies for inspection; a missing primary with
copies is an unavailable store, not an empty successful recall. Restore a
verified primary backup before retrying. Do not rename an unconfirmed copy
into place or remove writer locks.

On `cgrx.store_busy`, allow a brief bounded retry within the current task; the
requested mutation has not started. Do not remove repository lock files.
Agent memory waits up to two seconds to acquire its writer lease before
returning busy. Only lock acquisition is retried; mutations are never replayed.
Duplicates and already missing/conflicting updates avoid model initialization;
writes still recheck identity/version under the publication lease.
After a transient commit lock error, CGRX recovers the existing journal on a
disposable copy under the same writer lock. Failed recovery preserves the
original; only a validated copy is atomically published. It returns success
only after exact state verification and does not repeat the mutation.

On `cgrx.memory_write_uncertain`, the operation may already be durable. Error
data contains `id`, `operation` and `expected_version` (null for record). Do not
blindly repeat a write. Recall that ID with `include_stale: true`, adequate
budget and no unrelated filters; compare complete content, provenance, version
and correction reason with the intended result. Empty recall is inconclusive:
expiry or budgets can hide records. If deletion is still desired, repeat forget
with the same ID and expected version; `cgrx.memory_not_found` confirms no active
versions, while a conflict requires reassessment. Report uncertainty if the
result cannot be verified.

On a proven SDK capacity rejection before journal append, CGRX performs one
checked compaction and append retry internally. Every active historical version,
metadata field and embedding is verified before replacing the file. Capacity is
not increased. `cgrx.memory_capacity_exhausted` means the compacted store still
cannot fit the mutation; `mutation_applied:false` distinguishes this from an
uncertain commit. Do not delete history or memory files to force a write.

An unavailable memory tool or store is not an empty successful recall. Never
put facts, raw queries, source references or memory IDs in usage logs.
