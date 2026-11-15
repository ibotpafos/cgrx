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

Within each recall phase, records referring to the same path share one file read
and hash. Each record still checks its own fingerprint and line span. These
observations expire before the next phase or request, including failed reads;
source changes and restored files are checked again. Returned code fragments
independently verify their source bytes.

## Linking memory to code

Add `symbol` to a code-backed record to bind it to a function, class or other indexed definition. Carry its `path` and current opaque `symbol_ref` from `search_graph` or `get_outline` when names repeat. CGRX resolves the definition through the graph, verifies the indexed source against the file, derives the line span, and persists a `code_link` containing the symbol, byte ranges and source hash. An explicitly supplied line span must be inside the selected symbol. Ambiguous names, stale selectors and index/source mismatches fail the write.

The link persists verified source coordinates rather than the snapshot-bound selector. It survives a restart or an unrelated commit while the linked file remains unchanged. Symbol names and paths are indexed alongside the assertion for lexical and semantic retrieval. Memory assertions remain caller-supplied context and do not become graph relations.

`memory_recall` with `include_code: true` returns a `code` object for each hit. `available` includes the verified source and actual line span; `needs_review` withholds changed or missing source; `file_only` means the record has neither a symbol link nor a line span; `not_code` identifies an external assertion. Unreadable fragments report `unavailable`. Existing code records with a saved line span can also return source without a symbol link.

For an available symbol link, CGRX reissues `code.symbol_ref` from the refreshed graph only when the file hash, symbol, definition range and body range match exactly. Use `code.symbol`, `code.path` and that selector directly with `trace_path`, `find_usages` or `get_code_snippet`. The selector is not persisted and changes with the index snapshot. It is omitted when source is stale, the exact definition is missing or ambiguous, or the backend cannot resolve it; verified source can still be returned without graph navigation.

For a stale symbol link, `code.candidates` can provide up to five current definitions with the exact saved name, first in the original path and then in other paths. Each candidate carries `path`, `symbol`, a fresh `symbol_ref`, its current `definition_span` and `match_kind` (`same_path` or `other_path`). These are navigation hints for changed or moved code, not proof that the old assertion still applies. Inspect a candidate with `get_code_snippet`, then pass the verified current selector to `memory_update` to renew the link. Repeated names retain distinct selectors; the memory's original path, fingerprint, version and freshness are never changed by recall. `candidates_truncated` reports omitted candidates. An empty list does not prove absence, especially with partial graph coverage.

Each fragment is limited to 40 lines and 4000 Unicode characters. The normal recall budget bounds memories and code together; respect fragment, candidate and response truncation. When needed, CGRX removes lower-priority candidates and shortens source at Unicode boundaries before omitting memory rows. The returned line span describes the retained source. `budget_omitted` means the optional source could not fit; a verified selector can still be used for a separate snippet. Extremely small budgets can omit the entire optional `code` object. Older versions retain their original fingerprint and do not expose changed code as their historical source.

## Local semantic search

Recall combines BM25 and 384-dimensional [multilingual E5 small](https://huggingface.co/intfloat/multilingual-e5-small) embeddings with reciprocal rank fusion. This supports Russian queries over English facts. The returned `score` is a ranking score, not a probability or truth measure. Without `query`, recall browses by confidence then stable ID. No generative LLM is called (`llm_used: false`).

The model loads lazily: first use downloads its weights (about 0.5 GB including tokenizer files); subsequent calls reuse a disk cache and in-process model. A semantic query returns without loading the model when the locked preflight read has no current record eligible under its filters, expiry and stale-record policy. This also handles nonempty stores whose records are all excluded or expired. Only model files are downloaded; facts, queries and sources are processed locally. Set `CGRX_MEMORY_MODEL_CACHE` to choose the cache, otherwise it uses `$XDG_CACHE_HOME/cgrx/models` or `$HOME/.cache/cgrx/models`.

Set `CGRX_MEMORY_EMBEDDINGS=off` in the server environment for BM25-only operation without a model download (`search_mode: lexical`). Otherwise results report `hybrid` and the model name. Model errors are reported rather than silently substituting lexical results. Records created offline or migrated from JSON receive vectors lazily when an eligible current version matches a semantic recall. Backfill skips history, expired records, hidden stale sources and records excluded by the query filters.

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
  "symbol": "invalidate_cache"
}
~~~

`fact` is 1–4000 Unicode characters; keep concise conclusions and next steps here and put detailed reports in `source_ref`. Invalid memory arguments are rejected before index refresh or resource admission; length errors expose `field`, `actual_chars`, `max_chars` and `mutation_applied:false`, without echoing the assertion. Caller-assessed `confidence` is an integer 0–1000 (use 990 for 99%, not 0.99). `rev` defaults to the current snapshot; an explicitly different revision is rejected. The compact `status.at` tag is not a Git revision. Identical normalized input returns the same ID with `duplicate: true`. Distinct episodes need distinct `event_id` values even when their text matches.

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
  "budget": 2048,
  "include_code": true
}
~~~

Optional filters: `memory_kind`, `task_id`, `min_confidence`, `privacy_tag`, exact `revision`, `path`, `symbol`, and `include_stale`. `path` is an exact, case-sensitive repository-relative source path without traversal or globs; it may refer to a missing file when recalling stale context. `symbol` is the exact linked name returned by code discovery. Combine them for repeated names. Filters apply before ranking and the final limit, including to ID/history reads. `limit` is 1–50, default 20. Omit `query` to browse; use `id` to read a specific record and `include_history: true` for its versions. History requires `id`. All recall modes exclude expired records.

`budget` (256–16000 tokens, default 2048) bounds both full and compact recall payloads before multi-repo routing metadata and the JSON-RPC wrapper. Optional code context is reduced first; complete rows are then removed if their facts and provenance still cannot fit. Facts and provenance are never shortened. `truncated: true` means more rows exist or the budget clipped code context or prevented inclusion. A large record can still yield no rows within a small budget. Top-level `budget_omitted` counts rows removed for this reason; `minimum_budget` fits the first complete assertion without optional code. Retry within the supported 16000-token maximum rather than treating this as empty memory. Compact responses retain version, kind, source, provenance, freshness, timestamps, expiry and correction reason, including `privacy_tag` and `source_hash`. These fields are appended to compact recall columns; decode by column name. Compact record/update acknowledgements retain the same tag and hash. Non-code sources have a null hash. Metadata is counted in the recall budget and is never shortened to keep a row.

### Correct or forget

Freshness is resolved before rank fusion: hidden `needs_review` records cannot
occupy lexical or vector rank positions. `include_stale: true` ranks them for
explicit review. Episodes and requested previous versions remain available as
historical evidence even when their source changed.

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
    "path": "src/parser.rs",
    "symbol": "invalidate_cache"
  }
}
~~~

The nested `record` follows `memory_record` arguments. Repeat all context that should remain, including kind, task/event IDs, references and expiry. Replacement sources are validated against the current snapshot. A stale `expected_version` returns `cgrx.memory_conflict`.

`memory_forget` accepts `id` and `expected_version`, plus `repo` in multi-repo mode. It tombstones all versions and their search entries. Memvid is append-only: this is logical deletion, not secure physical erasure.

An unavailable managed memory backend returns `cgrx.memory_unavailable`. Storage I/O and invalid primary files fail through a JSON-RPC error instead of returning an empty successful recall. Agent memory waits up to two seconds for its writer lease, then returns `cgrx.store_busy` before the requested mutation starts; a brief bounded retry is safe. Only lock acquisition is retried, never a mutation. Duplicate records and already missing/conflicting updates avoid model initialization; writes still recheck identity/version under the publication lease. Never remove lock files to force access.

Initial creation also commits an empty disposable file, closes it and verifies
its clean journal and empty inventory through a read-only handle before atomic
publication. An interrupted SDK create cannot leave a partial primary file that
would poison the next pre-write retry.

If a commit fails with a transient index lock error, CGRX discards the failed handle and reopens the existing journal on a disposable copy while retaining the repository writer lock. Failed recovery cannot overwrite the original store. The recovered copy is atomically published and success reported only when the latest record exactly matches the complete intended replacement, or every version of a forgotten ID is absent. Recovery attempts are bounded; CGRX does not repeat the mutation or create another version. Other commit errors are not automatically recovered this way. Pending journals detected on later opens, including after a restart, also recover on a copy before publishing validated envelopes. Clean opens inspect the header and journal through Memvid's public IO APIs without copying the store or loading a second search index.

Before publishing journal recovery, CGRX closes the writable SDK handle and
reopens the copy read-only. Its journal must be clean, and all complete versions,
frame metadata and embedding bits must match the recovered in-memory inventory.
A damaged copy or lost unrelated history fails verification and preserves the
primary file, even when the pending record itself still matches.

When the result cannot be confirmed, `cgrx.memory_write_uncertain` carries `id`, `operation` (`record`, `update` or `forget`), and `expected_version` (null for a new record) in JSON-RPC error data. A failed commit may already be durable: do not blindly repeat a write. Read the ID with `include_stale: true`, enough budget and no unrelated filters, and compare its version, complete content and provenance against the intended operation. For an update, check its reason and the expected version increment as well. An empty recall is inconclusive because expired records are excluded and budgets can omit rows. If deletion is still desired, repeating `memory_forget` with the same ID and expected version preserves the concurrency guard; `cgrx.memory_not_found` confirms there are no active versions, while a conflict requires reassessment. Report an unconfirmed outcome if reconciliation is unavailable.

SDK index fragmentation can exhaust capacity even when the stored facts are small. On a typed pre-journal capacity rejection, CGRX rebuilds a disposable file under the existing writer lock. It preserves all visible historical versions, duplicate multiplicities, frame metadata and embedding bits, then checks the complete inventory through a fresh read-only reopen before atomic publication. One append retry follows this verified rebuild. This does not raise the SDK's capacity or replay uncertain commits. If the compacted store still cannot fit the mutation, `cgrx.memory_capacity_exhausted` reports the sizes and `mutation_applied:false`.

Usage and metrics logs contain tool names, timings and counts, without memory facts, queries, references or IDs. Uncertain-write errors include a bounded `backend_class` and `io_kind`; they do not expose potentially private SDK diagnostic strings.

## Migration and maintenance

The first memory operation validates `.cgrx/memory/decisions/*.json` envelopes and imports them, preserving IDs. JSON files are renamed to `.json.migrated` only after committing the import. Invalid envelopes fail the operation and remain untouched. Migration is retry-safe. Imported memories stay `unverified` until explicitly corrected with a current source.

The compatibility `MemoryStore::record`, `recall`, `status` and `prune_expired` APIs use the same backend. `status` counts latest logical records and reports physical file size. `prune_expired(now, dry_run)` removes all versions of expired records from recall and matching migration backups. Its `bytes_reclaimed` reports logical record bytes, not a shrink of the append-only file. There is no MCP prune command.

Migration, vector backfill and expiry pruning stage their changes on a disposable
copy under the repository writer lock. Only an explicitly committed copy with no
pending journal entries and the exact intended inventory of complete records is
atomically published. Verification uses a read-only handle and includes every
version, so backfill cannot silently discard history or alter assertions. Errors
before publication preserve the original bytes; a busy staged write can be retried
without repeating the requested record/update/forget. Legacy files are archived
after publication; interrupted archiving can be retried without importing an old
decision over a newer version. A clean browse, status, ID read or prune dry run
does not dirty the vector index or cause an implicit commit on close.

Abrupt process termination can leave an unpublished `.agent-recovery-<pid>-<sequence>.mv2`
copy. On the next locked open, CGRX validates the primary store and all its record
envelopes, removes only regular files with that exact generated name format, and
syncs the memory directory. The writer lock prevents cleaning another active
process's copy. Directories, symlinks and similarly named backups are preserved.
The memory directory itself must be the worktree's native `.cgrx/memory` path;
directory aliases are rejected because another worktree's lock cannot protect
a shared target's active copies.
Unpublished copies are never promoted automatically. A corrupt primary preserves
the copies for inspection; a missing primary with abandoned copies fails instead
of silently creating empty memory. Restore the confirmed primary from a verified
backup before retrying; do not rename an unconfirmed copy into place.

Mutations and migration use the repository writer lock and Memvid commits. Record envelopes carry an integrity hash; corrupted payloads fail reads. The hash detects corruption, not an actor rewriting both the record and checksum.

## Validation

The regular workspace suite checks persistence, source changes, revision refresh,
version conflicts, migration, expiry, response budgets, log privacy, multi-repo
isolation and exact symbol links without downloading an embedding model. Recovery
tests cover failed commits, exact journal verification, concurrent version guards
and intentional forks during writes, plus interrupted backfill, archive retry,
unchanged bytes after clean reads and preservation of history during reindexing.
Exec-isolated subprocess tests force termination after a partial backfill, after
its copy commit and after publication. They verify preserved assertions/history,
lock release, cleanup after restart and subsequent guarded deletion. Missing or
invalid primaries preserve evidence and cannot masquerade as empty memory.
Raw fork tests execute in separate processes
so their inherited index descriptors cannot interfere with unrelated tests.
Run the real multilingual
recall check explicitly; it also exercises vector backfill, correction and deletion:

~~~sh
cargo test --locked --workspace
CGRX_MEMORY_EMBEDDINGS=on cargo test --locked --workspace multilingual_semantic_recall_finds_english_fact_from_russian_query -- --ignored
~~~
