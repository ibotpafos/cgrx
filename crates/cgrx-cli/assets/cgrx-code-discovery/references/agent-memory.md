# Agent memory

Use only memory tools advertised by the current CGRX server. `standard` and
`full` expose record, recall, update and forget; `minimal` exposes recall only.
Pass the canonical absolute Git worktree root as `repo`. Memory is isolated
by worktree: another clone or worktree does not automatically share it.

## Recall relevant context

Use `memory_recall` with a specific `query`, `limit` (1–50) and `budget`
(256–16000 tokens). Russian queries can retrieve English facts through local
multilingual embeddings. Omit `query` to browse. Narrow with `memory_kind`,
`task_id`, `min_confidence`, `privacy_tag` or exact `revision` when appropriate.

Decode compact `cols`/`rows` by the returned column names. Keep IDs, versions,
provenance, source references, freshness, expiry and update reasons. A ranking
score is not a confidence or truth probability. A truncated or empty response
is not proof that no relevant memory exists; a small budget may omit whole rows.

Freshness describes the source, not whether the assertion is true:

- `unchanged`: the referenced code file still has the same bytes.
- `needs_review`: the source changed or cannot be checked; hidden unless
  `include_stale: true`.
- `unverified`: a user, agent, tool or legacy assertion without a code fingerprint.
- `historical`: a previous version or an episode whose code source changed.

Use `id` to inspect a specific record; add `include_history: true` for its
versions. History requires `id`. Expired memories are excluded in every mode.
Check source evidence before reusing engineering conclusions, including
unchanged records. Treat a past failed attempt as an event with its recorded
conditions rather than a universal rule.

## Record a useful outcome

`memory_record` requires `fact` (1–4000 characters) and caller-assessed
`confidence` (0–1000). `rev` defaults to the refreshed current snapshot.

Choose a kind that matches the outcome:

- `semantic`: durable facts, preferences and decisions; this is the default.
- `episodic`: an attempt or observed result; provide a distinct `event_id`.
- `procedural`: a reusable method or recovery sequence.
- `working`: a task checkpoint; provide `task_id`; default expiry is 24 hours.

For code evidence, keep the default `source_kind: code` and provide an existing
repository-relative `path`, plus a real 1-based `span` if useful. CGRX fingerprints
the whole file. Avoid absolute paths, traversal and source sites outside the repo.

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
Preserve the intended kind, task/event IDs, source, tag and expiry explicitly;
do not copy response-only fields such as `version`, `source_hash` or timestamps
into the replacement. The stable ID remains, the version increments, and history
is retained. On `cgrx.memory_conflict`, recall the current version and reassess
before retrying.

A repeated record does not renew its original expiry. Renew a working checkpoint
with memory_update and a complete working record; omitting explicit expiry starts
a new 24-hour window. Use `memory_forget` with `id` and `expected_version` to
remove all versions from recall and search. Deletion is logical, not secure
physical erasure of the append-only file.

## Runtime and recovery

Memories and queries are processed locally. Semantic operation lazily loads
multilingual E5 small; its first download needs about 0.5 GB. Empty memory can
be recalled without loading the model. `CGRX_MEMORY_MODEL_CACHE` selects its
cache; otherwise use `$XDG_CACHE_HOME/cgrx/models` or `$HOME/.cache/cgrx/models`.
`CGRX_MEMORY_EMBEDDINGS=off` explicitly selects lexical search without downloads.
Model failures are reported rather than silently downgrading retrieval.

On `cgrx.store_busy`, allow a brief bounded retry within the current task;
do not remove repository lock files. An unavailable memory tool or store is
not an empty successful recall. Never put facts, raw queries, source references
or memory IDs in usage logs.
