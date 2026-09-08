# Decision memory

CGRX agents can persist small, revision-pinned decision facts across sessions
with `memory_record` and read them back with `memory_recall`. Both tools are
offline, deterministic, and never invoke an LLM (`llm_used: false`).

## Record shape

~~~json
{
  "id": "9f2c… (32 hex chars, deterministic content hash)",
  "fact": "Retry the router with a warm cache before reindexing",
  "confidence": 800,
  "provenance": {
    "repo": "/absolute/repository",
    "rev": "44a50ba7b2197caf8ee9ce8ccd108b18166991b5",
    "path": "crates/cgrx-cli/src/main.rs",
    "span": {"start_line": 575, "end_line": 600}
  },
  "recorded_unix_nanos": 1757366400000000000,
  "valid_until_unix_nanos": 1757452800000000000,
  "privacy_tag": "default"
}
~~~

- `fact`: 1–4000 characters, trimmed on write.
- `confidence`: integer 0–1000, caller-assessed. Recall sorts by it.
- `provenance.rev`: must equal the server snapshot revision on write, otherwise
  the call fails with `cgrx.invalid_arguments`. Omit `rev` to pin the current
  snapshot automatically.
- `provenance.span`: optional 1-based `start_line <= end_line`.
- `valid_until_unix_nanos`: optional TTL deadline in unix nanos. Expired records
  are hidden from recall and removable via pruning.
- `privacy_tag`: optional 1–64 printable-character label, defaults to
  `"default"`. Recall can filter on it exactly. CGRX does not interpret tags;
  treat them as coarse audience labels and keep secrets out of facts.

## Tools

`memory_record` arguments: `fact*`, `confidence*` (0–1000), `repo*`, `path*`,
`rev` (default: pinned snapshot), `span`, `valid_until_unix_nanos` (must be in
the future), `privacy_tag`. Recording identical content twice is idempotent:
the second call returns the same `id` with `"duplicate": true`.

`memory_recall` arguments: `query` (case-insensitive substring over facts),
`min_confidence` (default 0), `privacy_tag`, `revision` (exact provenance
revision; default: all revisions), `limit` (1–50, default 20). Results are
ordered by confidence descending, then id ascending, so repeated calls with the
same store state return the same rows. The response carries the pinned
`snapshot` and a `truncated` flag.

Both tools require a managed repository backend. Without one they fail with
`cgrx.memory_unavailable`.

## Storage and TTL cleanup

Records live under `<repo>/.cgrx/memory/decisions/<id>.json` as versioned
envelopes with an integrity hash; tampered files fail loudly on read instead of
returning forged facts. Writes hold the store writer lock and are atomic.

Expiry is enforced on every recall. To reclaim disk, call
`MemoryStore::prune_expired(now_unix_nanos, dry_run)` (used with
`dry_run = true` for a no-op report of `{removed, retained, bytes_reclaimed}`).
There is intentionally no MCP prune tool: cleanup is a local maintenance
operation, not agent conversation state.

`MemoryStore::status(now)` reports `{decisions, expired, bytes}` for
observability.
