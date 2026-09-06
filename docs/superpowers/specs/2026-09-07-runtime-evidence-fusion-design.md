# Runtime Evidence Fusion

Date: 2026-09-07
Status: approved for implementation
Linear: IBO-292

## Purpose

CGRX will combine revision-pinned static graph evidence with observed runtime
execution without weakening the meaning of a proven static edge. Runtime traces
will make dynamic call paths visible to navigation, impact analysis, refactor
planning, visualization, and agent handoff while preserving explicit uncertainty.

The first release accepts local trace files, maps observations to symbols in one
Git revision, stores the resulting evidence separately from immutable graph
generations, and exposes the fused view through the existing compact MCP surface.
It supports every language CGRX currently supports: Go, TypeScript/TSX, Python,
and Rust.

## Competitive position

codebase-memory-mcp exposes `ingest_traces` to validate runtime HTTP edges.
Trace documents no runtime ingestion. CGRX will provide a broader evidence
model: runtime calls remain a distinct provenance and can enrich any call path,
not only HTTP links. Every observation is bound to a repository revision and
reports how it was resolved. Ambiguous or stale observations remain visible as
gaps instead of silently becoming graph edges.

This design builds on CGRX's existing strengths: immutable graph generations,
source-hash evidence, explicit coverage gaps, bounded responses, hypothetical
refactor graphs, and a local graph explorer.

## Design principles

1. A runtime observation is evidence that a call occurred, not proof that a
   static call site resolves uniquely.
2. Absence from a trace never proves dead code or an impossible path.
3. Runtime evidence is valid only for its declared Git revision.
4. Imports are idempotent and crash-safe.
5. Raw attributes, arguments, request bodies, and source code are never stored.
6. Existing tools gain an evidence selector; the default static behavior and
   tool count remain stable.
7. Every limit and unresolved record is returned explicitly.
8. Intelligent recommendations are computed locally from graph and observation
   evidence; CGRX does not bundle, call, or require a separate LLM.

## Input formats

### CGRX observation NDJSON

The normalized interchange format contains one JSON object per observed
parent-child call:

```json
{
  "schema": "cgrx.runtime.v1",
  "repo_revision": "40-hex-git-oid",
  "environment": "test",
  "observed_at_unix_nanos": "1788737000000000000",
  "count": 3,
  "caller": {
    "function": "crate::module::caller",
    "file": "src/module.rs",
    "line": 42
  },
  "callee": {
    "function": "crate::module::callee",
    "file": "src/module.rs",
    "line": 57
  }
}
```

Required fields are `schema`, `repo_revision`, `observed_at_unix_nanos`,
`caller.function`, and `callee.function`. `environment` defaults to `unknown`.
`count` defaults to one and must be positive. File paths and one-based lines are
optional but provide the strongest resolution evidence.

### OTLP/JSON

The importer accepts the OpenTelemetry file-exporter representation of
`TracesData`: `resourceSpans[].scopeSpans[].spans[]`. Parent-child relationships
come from `spanId` and `parentSpanId`. Symbol attributes use the stable
`code.function.name`, `code.file.path`, and `code.line.number` keys. Deprecated
`code.function`, `code.filepath`, and `code.lineno` are accepted with a reported
compatibility warning.

Repository revision is read in order from `vcs.ref.head.revision`,
`service.version`, or the explicit import argument. An import without a revision
is rejected. Environment comes from `deployment.environment.name`, then
`service.namespace`, then `unknown`.

The first release accepts files and stdin. It does not run a network collector.

## Resolution

Each endpoint is independently resolved against the graph generation whose
`repo_revision` exactly matches the trace batch.

Resolution order:

1. canonical repository-relative file path plus one-based source line contained
   by exactly one indexed callable;
2. canonical file path plus exact or suffix-normalized fully qualified name;
3. exact fully qualified name within the repository;
4. unique terminal symbol name within the declared file;
5. unique terminal symbol name within the repository.

Path normalization accepts absolute paths only when the repository root is an
exact component prefix. Parent traversal, NUL bytes, paths outside the root, and
symlink escapes are rejected. Runtime-specific separators such as `::`, `.`,
`#`, and `/` are normalized only for comparison; stored symbol identities remain
the indexed qualified names.

Successful resolutions carry a `resolution` value of `path_line`, `path_fqn`,
`fqn`, `path_name`, or `unique_name`. Any zero-match or multi-match endpoint
keeps the observation out of the fused graph and records an `unresolved` or
`ambiguous` gap with bounded candidate identities. Resolution never chooses the
first result from a tie.

## Evidence model

Runtime evidence is not added to `RelationKind` or immutable `GraphArc` records.
A separate query-layer type joins observations to the current snapshot:

```text
ObservedCall {
  snapshot: RepoSnapshot,
  source: NodeId,
  target: NodeId,
  environment: String,
  count: u64,
  first_seen_unix_nanos: u64,
  last_seen_unix_nanos: u64,
  source_resolution: ResolutionKind,
  target_resolution: ResolutionKind,
  batch_ids: bounded set,
}
```

The fused response represents evidence as:

- `static`: a current definitive static graph arc;
- `observed`: one or more matching runtime observations and no definitive static
  arc;
- `static+observed`: both forms exist for the same source and target;
- `unresolved`: retained only in coverage/gap summaries, never traversed.

Observed-only edges participate in traversal only when the caller requests
`evidence: "observed"` or `evidence: "all"`. Existing calls default to
`evidence: "static"`, preserving compatibility and proof semantics.

## Storage and publication

Runtime evidence lives under `.cgrx/observations/`, outside immutable graph
generation directories:

```text
.cgrx/observations/
  batches/<batch-id>.json
  by-revision/<git-oid>.snapshot.json
  quarantine/<batch-id>.json
  LOCK
```

A normalized batch ID is the BLAKE3 hash of the canonical schema version,
repository identity, revision, environment, and sorted normalized observations.
Reimporting the same batch is a no-op. Import writes a private temporary file,
fsyncs it, validates it, atomically renames it into `batches`, rebuilds the
revision snapshot into a new file, fsyncs, and atomically publishes it. The
existing repository writer lock serializes imports with graph publication.
Readers retain the previous complete snapshot during publication.

Per revision and environment, identical `(source, target)` observations merge by
saturating count addition and min/max timestamps. Batch IDs are capped at eight
per edge; `additional_batches` reports the omitted count. Imports are bounded to
4 MiB compressed or uncompressed input, 100,000 spans, 100,000 normalized calls,
64 environments, and 256 candidates per unresolved endpoint. Limit violations
reject the whole batch before publication.

Trace data for an indexed but non-current revision is stored and reported as
`inactive_revision`; it becomes queryable only when that exact immutable graph
generation is active. Data for an unknown revision is quarantined without symbol
IDs and can be resolved after that revision is indexed. Quarantine never enters
traversal.

## User interfaces

### CLI

```text
cgrx observe import --root <repo> --input <file|-> --format auto \
  [--revision <git-oid>] [--environment <name>] [--json]
cgrx observe status --root <repo> [--revision <git-oid>] [--json]
cgrx observe prune --root <repo> --before <unix-seconds> --dry-run
```

Import returns batch identity, accepted/merged/unresolved counts, active or
inactive revision state, limits, warnings, and no raw trace attributes.

### MCP

One new write tool, `ingest_runtime_evidence`, accepts `repo`, `input_path`,
`format`, optional `revision`, and optional `environment`. It accepts only a
local path within the repository or `.cgrx/imports`; stdin and inline payloads
are CLI-only. This prevents large trace bodies from entering model context.

The existing `trace_path`, `find_usages`, `scan_risks`, `suggest_refactors`, and
`orient` tools gain an optional `evidence` enum: `static`, `observed`, or `all`.
Their compact rows add provenance/count fields only when runtime evidence was
requested or exists. `status` reports batch, edge, unresolved, active-revision,
and storage counts.

Tool descriptions tell agents to use `all` for debugging and impact discovery,
then distinguish observed-only paths from static proof before editing.

### Visual explorer

The graph explorer adds a `Static / Runtime / Combined` evidence selector and an
environment filter. Observed edges use a distinct dashed lane; width reflects a
log-scaled call count and opacity reflects age. Selecting an edge shows
provenance, resolution methods, counts, timestamps, environments, revision, and
whether a static proof also exists. Unresolved observations appear in a bounded
diagnostic panel, not as guessed graph edges.

## Integration with analysis

- `trace_path` and `find_usages` can traverse observed-only dynamic dispatch.
- `scan_risks` ranks a changed target higher when it has recent observed callers,
  but reports this as runtime impact rather than a confirmed source break.
- `suggest_refactors` preserves observed entry points and includes observed edge
  changes in each hypothetical future graph. It does not suggest deleting an
  observed-only target merely because static callers are absent.
- `orient` prefers nodes present in both static and runtime evidence and can add
  bounded observed-only paths relevant to the task.
- Agent handoff includes the exact evidence selector, environment, revision, and
  unresolved gaps required to reproduce the result.

No analysis treats trace coverage as exhaustive.

## Explainable intelligence without an LLM

Runtime Evidence Fusion provides deterministic AI-assist signals derived from
the evidence graph:

- `dynamic_hot_path`: an observed-only edge with high log-scaled call count;
- `static_runtime_divergence`: a frequently observed path absent from the
  definitive static graph;
- `high_runtime_blast_radius`: a changed symbol with multiple recent observed
  callers or environments;
- `refactor_priority`: a duplicate-code candidate weighted by observed entry
  points, frequency, and preserved static evidence;
- `next_action`: a bounded, reproducible search/trace/test instruction generated
  from the finding's exact symbols, paths, revision, evidence selector, and gaps.

Every signal includes its formula inputs and a stable reason code. Scores use
integer arithmetic, deterministic ordering, documented caps, and frozen
fixtures. No model weights, embeddings, prompts, network calls, or generated
natural-language explanations are involved.

## Privacy and security

Only function names, normalized repository-relative paths, line numbers, counts,
timestamps, revision, environment, trace/span identity hashes, and resolution
metadata survive normalization. Attribute values unrelated to resolution are
discarded before any write. Original trace IDs and span IDs are hashed with a
repository-local salt. Arguments, URLs, SQL, request bodies, stack traces,
resource attributes, and source snippets are never persisted or logged.

All files are local and owner-readable. Import does no network I/O. MCP usage
telemetry records tool metadata and counts only, never paths, symbols, trace
identifiers, or observation content.

## Failure behavior

- malformed JSON, mixed schemas, invalid counts, and size limits reject the
  batch without mutation;
- duplicate batch import succeeds as an idempotent no-op;
- unknown revisions go to quarantine and never affect queries;
- graph refresh cannot attach an observation to a different source hash merely
  because a node ID was reused;
- corrupted observation snapshots fail closed while static graph queries remain
  available;
- interrupted publication exposes either the previous or new complete snapshot;
- partial resolution is reported with exact accepted and rejected counts.

## Benchmark and acceptance gates

The release includes frozen train and heldout runtime fixtures for Go,
TypeScript/TSX, Python, and Rust. Fixtures cover direct calls, interface or trait
dispatch, callbacks, reflection-shaped names, closures, duplicate terminal
names, absolute and relative paths, stale revisions, missing revisions,
deprecated OTLP attributes, duplicate batches, and malicious paths.

Acceptance requires:

1. 100% precision for emitted observed edges in the frozen heldout corpus;
2. no runtime observation emitted as a definitive static edge;
3. every ambiguous/stale/unknown input represented as an explicit gap;
4. identical output bytes for repeated imports and input-order permutations;
5. crash-injection proof that readers see the old or new complete snapshot;
6. warm fused depth-two traversal p95 no more than 10% slower than static-only
   traversal on the same graph;
7. static-only output tokens unchanged when no runtime evidence is requested;
8. bounded model-visible import responses below 1,000 tokens;
9. release smoke over all four languages and both input formats;
10. a reproducible side-by-side capability result against the installed CBM
    `ingest_traces`, without claiming superiority outside the measured tasks.
11. identical explainable-insight scores across repeated runs and input-order
    permutations, with every score reconstructible from returned inputs.

The existing repository quality gate remains authoritative for static graph
precision, latency, memory, and token regressions.

## Delivery sequence

1. Core observation schema, normalization, matching, and immutable snapshot join.
2. Crash-safe observation store and CLI import/status.
3. MCP ingestion and evidence selectors for traversal and status.
4. Impact, refactor, orient, and agent-handoff enrichment.
5. Runtime overlay in the TypeScript graph explorer.
6. Four-language evaluation corpus, CBM comparison, documentation, release, and
   installed-binary smoke.

Each step must keep static-only behavior passing and independently reviewable.

## Deferred work

The first release does not expose an OTLP network listener, collect profiles,
instrument applications, infer negative coverage, accept arbitrary inline MCP
payloads, or automatically delete historical observations. Those capabilities
require separate threat, resource, and lifecycle designs after file ingestion is
measured in real projects.
