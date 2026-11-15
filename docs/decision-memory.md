# Agent memory

CGRX persists project context with [Memvid](https://github.com/memvid/memvid), embedded in the Rust executable. Records and lexical/vector indexes live in `<repo>/.cgrx/memory/agent.mv2`; no separate memory server, database service or API key is required.

Memory contains caller-supplied assertions. It does not prove them true or add graph edges. Agents should recall context at task start, check current evidence, and save useful decisions or outcomes at task end. CGRX does not automatically ingest conversations or infer facts.

## Types and provenance

| `memory_kind` | Purpose | Required context |
|---|---|---|
| `semantic` (default) | Facts, preferences and decisions | Source |
| `episodic` | An attempt, failure or observed outcome | Source and distinct `event_id` |
| `procedural` | A repeatable workflow or recovery procedure | Source |
| `working` | Task checkpoint or remaining work | Source and `task_id`; default expiry 24 hours |

`source_kind` defaults to `code`: provide a relative existing `path` inside the repository and optional actual 1-based `span`. Absolute paths, traversal, and symlinks escaping the repository are rejected. CGRX fingerprints the whole file at write time.

For `user`, `agent` or `tool` sources, provide `source_ref` instead of `path` or `span`, such as an explicit instruction, task ID or test run reference. CGRX records that reference without fetching or verifying it. Imported decisions use the reserved `legacy` source kind.

| `freshness` | Meaning |
|---|---|
| `unchanged` | Source bytes still match; assertion truth remains caller-assessed |
| `needs_review` | Code source changed, disappeared or could not be checked |
| `unverified` | External or legacy source without a code fingerprint |
| `historical` | Previous version, or an episode whose source changed |

`needs_review` records are hidden unless `include_stale: true`. Episodes remain as historical events. A new commit alone does not invalidate an unchanged source file. Memory is isolated by canonical worktree path; different worktrees and clones do not automatically share it.

## Local semantic search

Recall combines BM25 and 384-dimensional [multilingual E5 small](https://huggingface.co/intfloat/multilingual-e5-small) embeddings with reciprocal rank fusion. This supports Russian queries over English facts. The returned `score` is a ranking score, not a probability or truth measure. Without `query`, recall browses by confidence then stable ID. No generative LLM is called (`llm_used: false`).

The model loads lazily: first use downloads its weights (about 0.5 GB including tokenizer files); subsequent calls reuse a disk cache and in-process model. A query against empty memory returns without loading the model. Only model files are downloaded; facts, queries and sources are processed locally. Set `CGRX_MEMORY_MODEL_CACHE` to choose the cache, otherwise it uses `$XDG_CACHE_HOME/cgrx/models` or `$HOME/.cache/cgrx/models`.

Set `CGRX_MEMORY_EMBEDDINGS=off` in the server environment for BM25-only operation without a model download (`search_mode: lexical`). Otherwise results report `hybrid` and the model name. Model errors are reported rather than silently substituting lexical results. Records created offline or migrated from JSON receive vectors lazily on the first semantic recall.

Memvid core **2.0.140** and FastEmbed **5.2.0** are pinned to compatible ONNX Runtime ABIs. Both libraries use Apache-2.0; E5 uses MIT. CGRX enables Memvid's lexical/vector features and supplies its own embeddings and typed lifecycle.

## MCP commands

Memory requires an attached repository backend. Multi-repo calls require the absolute Git worktree root in `repo`. Single-repo mode derives it and accepts `repo` only when it matches. The server refreshes its snapshot before memory operations. `standard` and `full` expose all four commands; `minimal` exposes only recall.

### Record

Call `memory_record`:

~~~json
{
  "repo": "/absolute/path/to/project",
  "fact": "Invalidate the parser cache after changing source files",
  "confidence": 800,
  "memory_kind": "procedural",
  "path": "src/parser.rs",
  "span": {"start_line": 10, "end_line": 30}
}
~~~

`fact` is 1–4000 characters; caller-assessed `confidence` is 0–1000. `rev` defaults to the current snapshot; an explicitly different revision is rejected. Identical normalized input returns the same ID with `duplicate: true`. Distinct episodes need distinct `event_id` values even when their text matches.

Optional `valid_until_unix_nanos` must be a future Unix nanosecond timestamp. `privacy_tag` is an optional printable 1–64 character label, default `default`; it is an exact retrieval filter, not access control.

Replaying a record keeps its original timestamp and expiry. To renew a working
checkpoint, use `memory_update` with the returned ID/version and a complete
replacement; omitting its explicit expiry starts a new 24-hour window.

A task checkpoint can instead use `memory_kind: working`, `task_id: parser-fix`, `source_kind: agent`, and `source_ref: parser-fix checkpoint`, omitting the code path/span.

### Recall

Call `memory_recall`:

~~~json
{
  "repo": "/absolute/path/to/project",
  "query": "Когда сбрасывать кеш парсера?",
  "limit": 10,
  "budget": 2048
}
~~~

Optional filters: `memory_kind`, `task_id`, `min_confidence`, `privacy_tag`, exact `revision`, and `include_stale`. `limit` is 1–50, default 20. Filters apply before the final limit. Omit `query` to browse; use `id` to read a specific record and `include_history: true` for its versions. History requires `id`. All recall modes exclude expired records.

`budget` (256–16000 tokens, default 2048) bounds the recall payload before multi-repo routing metadata and the JSON-RPC wrapper. Complete rows are removed until it fits; `truncated: true` means more rows exist or the budget prevented inclusion. A large record can therefore yield no rows within a small budget. Compact responses retain version, kind, source, provenance, freshness, timestamps, expiry and correction reason.

### Correct or forget

`memory_update` appends a complete replacement, keeps the stable ID and increments `version`. It requires a reason and protects against concurrent lost updates:

~~~json
{
  "repo": "/absolute/path/to/project",
  "id": "0123456789abcdef0123456789abcdef",
  "expected_version": 1,
  "reason": "Rechecked the changed source",
  "record": {
    "fact": "Invalidate the parser cache after changing source files",
    "confidence": 900,
    "memory_kind": "procedural",
    "path": "src/parser.rs"
  }
}
~~~

The nested `record` follows `memory_record` arguments. Repeat all context that should remain, including kind, task/event IDs, references and expiry. Replacement sources are validated against the current snapshot. A stale `expected_version` returns `cgrx.memory_conflict`.

`memory_forget` accepts `id` and `expected_version`, plus `repo` in multi-repo mode. It tombstones all versions and their search entries. Memvid is append-only: this is logical deletion, not secure physical erasure.

An unavailable store returns `cgrx.memory_unavailable`; writer contention returns retryable `cgrx.store_busy`. Usage and metrics logs contain tool names, timings and counts, without memory facts, queries or references.

## Migration and maintenance

The first memory operation validates `.cgrx/memory/decisions/*.json` envelopes and imports them, preserving IDs. JSON files are renamed to `.json.migrated` only after committing the import. Invalid envelopes fail the operation and remain untouched. Migration is retry-safe. Imported memories stay `unverified` until explicitly corrected with a current source.

The compatibility `MemoryStore::record`, `recall`, `status` and `prune_expired` APIs use the same backend. `status` counts latest logical records and reports physical file size. `prune_expired(now, dry_run)` removes all versions of expired records from recall and matching migration backups. Its `bytes_reclaimed` reports logical record bytes, not a shrink of the append-only file. There is no MCP prune command.

Mutations and migration use the repository writer lock and Memvid commits. Record envelopes carry an integrity hash; corrupted payloads fail reads. The hash detects corruption, not an actor rewriting both the record and checksum.

## Validation

The regular workspace suite checks persistence, source changes, revision refresh,
version conflicts, migration, expiry, response budgets, log privacy and multi-repo
isolation without downloading an embedding model. Run the real multilingual
recall check explicitly; it also exercises vector backfill, correction and deletion:

~~~sh
cargo test --locked --workspace
CGRX_MEMORY_EMBEDDINGS=on cargo test --locked --workspace multilingual_semantic_recall_finds_english_fact_from_russian_query -- --ignored
~~~
