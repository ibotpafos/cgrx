# Code discovery and safe continuation

CGRX supports code-oriented lexical discovery without an embedding service,
model or network request. `search_graph` and `cgrx search` use the same managed
index and return indexed definitions with exact spans and symbol references.

## Queries and ranking

Names retain their existing priority: exact, prefix, then substring matches.
Next come names containing **every** query token. A shared tokenizer handles
camel/Pascal case, acronym boundaries, snake case, punctuation, Unicode case
and letter/digit transitions: `HTTPRequest`, `HTTP_REQUEST` and `http request`
share `http` and `request`; `HTTP2Request` also contains `2`.

With `include_body: true`, literal body matches and bodies containing every
query token follow name matches. Thus `cache expiry` can discover a function
that contains `cache_key` and `expiry_policy` on separate lines. Body discovery
is opt-in, and a body missing one term cannot qualify for the token lane.
Single-identifier fuzzy name matching remains the final fallback. Multiword
queries never qualify through that fallback.

`matched_by` distinguishes `symbol`, `symbol_tokens`, `body`, `body_tokens`
and `fuzzy`. Token matches are lexical candidates, not relationship proofs.
Path, definition span and node identity provide deterministic tie breaking.

The same tokenizer serves the existing BM25 orientation lane and optional
structural lane, so acronym queries are interpreted consistently. Orientation
still uses its existing ranking fusion and budgeted context; search does not
claim semantic understanding or compiler completeness.

Resident orientation reuses BM25 document terms in a repository-local cache.
Each request fingerprints the complete name, path and search text before reuse;
working-tree edits therefore cannot reuse terms solely because a node ID or
Git revision stayed the same. Document frequency and average length are computed
within the selected scope on every query, preserving scores, query repetitions
and deterministic ties. The runtime releases cached terms after a changed
snapshot. The cache has a 64 MiB estimated allocation budget and a 256 KiB
per-document budget; full or oversized entries use the streaming scorer. These
are cache accounting limits, not process RSS limits. No extra index or model is
required, and source freshness and graph evidence checks remain authoritative.

Run the synthetic retrieval benchmark with
`cargo run --release -p cgrx-retrieval --example bm25_cache_benchmark`.
It compares cold and warm cached retrieval against the streaming pipeline,
including exact-name and RRF fusion, and asserts complete candidate/score parity.
It excludes repository refresh, context packing and MCP transport.

## MCP

First page:

```json
{"repo":"/absolute/path/to/repository","query":"http request","language":"rust","limit":20}
```

Keep the returned `page.snapshot_id`. For the next page, pass that ID as
`expected_snapshot`, use `page.next_offset` as `offset`, and keep the query,
scope, language, body option and limit unchanged. A changed snapshot returns
`cgrx.search_snapshot_changed`; restart at offset zero and rediscover symbols.
The guard protects source identity, not changes to the query arguments.

## Structural patterns

`search_graph` also accepts `match_mode: "ast"` with an explicit `language`
(`rust`, `typescript`, `python`, or `go`). TypeScript includes TSX. This mode
uses ast-grep-core 0.45.2 with the same Tree-sitter 0.26 parsers as the index:

```json
{"repo":"/absolute/path/to/repository","query":"fetch($ARG)","match_mode":"ast","language":"typescript","scope":"src/**","limit":20}
```

`$ARG` captures one syntax node, `$$$ARGS` captures an argument list, and
repeated metavariables must match the same syntax. Comments and string contents
do not qualify as calls. Results are indexed definitions containing the
pattern, with `matched_by: "ast"`, their existing `symbol_ref`, and
`ast_matches` containing exact source byte spans, the file `source_hash`, and
an occurrence truncation flag. Syntax matches do not prove callee identity;
use the graph's evidence and coverage for that question.

Structural requests recheck source hashes independently of the preceding
refresh. Changed or missing source returns `cgrx.ast_source_changed`.
Symlinks outside the permitted file policy cannot provide matches. Invalid
patterns return `cgrx.invalid_ast_pattern`; lexical search remains the default.
`include_body` is a lexical option and is rejected in AST mode.

Requests accept patterns of at most 4096 UTF-8 bytes and scan at most 4096
indexed definitions. Source reads are capped at 64 MiB (16 MiB per file),
definition parsing at 16 MiB, and stored occurrences at eight per definition.
`ast_scan.partial` and `skipped_definitions` expose skipped definitions,
including non-UTF-8 source and limits; `ast_matches.truncated` exposes further
occurrences. The total counts matching definitions within the scanned subset.
Narrow the scope when scanning is partial. Definitions are paginated with the
same snapshot guard as lexical search; keep query, mode, language and scope
unchanged between pages. Full and compact responses retain all AST evidence
and scanning limits. Static state-only servers lack current source and return
`cgrx.ast_search_unavailable`.

Each page contains `total`, `matches`, `truncated` and `page` metadata. Limits
range from 1 to 50 and offsets from 0 to 1,000,000. Compact MCP responses keep
all requested rows and the continuation metadata, rather than silently dropping
rows above twelve. Complete traversal of matches is distinct from complete
relationship coverage; inspect coverage before relying on a missing edge.

For searches with over one million matches, a page that would require an offset
above 1,000,000 returns `cgrx.search_pagination_limit`. Narrow the query or path
scope before restarting. A final page may cross that position when it needs no
further continuation.

## CLI

```sh
cgrx search --root /path/to/repo --query 'http request' --language rust --limit 20
cgrx search --root /path/to/repo --query 'cache expiry' --include-body true --paths 'src/**' --exclude 'src/generated/**'
cgrx search --root /path/to/repo --query 'http request' --language rust --limit 20 --offset 20 --expected-snapshot SNAPSHOT_ID_FROM_FIRST_PAGE
cgrx search --root /path/to/repo --query 'fetch($$$ARGS)' --match-mode ast --language typescript --paths 'src/**'
```

`--paths` and `--exclude` accept comma-separated repository-relative scope
patterns. The command prints the full JSON report. It refreshes only the managed
index under Git metadata and uses no remote service. Malformed flags, duplicate
flags, invalid numeric bounds and invalid snapshot digests fail before index creation.

## Competitive references and useful GitHub tools

[Trace MCP](https://trace-mcp.com/tools-reference.html) documents FTS5/BM25
search and language/file filters. [Sourcegraph code search](https://sourcegraph.com/docs/code-search)
provides broader centralized search. The concrete discovery hole addressed here
is that CGRX's previous `search_graph` only matched the whole query literally
before fuzzy fallback, even though `orient` already used BM25.

Tools reviewed for potential reuse:

| Tool | Useful capability | License | Decision for this update |
| --- | --- | --- | --- |
| [Tantivy](https://github.com/quickwit-oss/tantivy) | Rust full-text index and BM25 | MIT | Keep existing native retrieval; a new index is unnecessary for the measured gap |
| [ast-grep](https://github.com/ast-grep/ast-grep) | Structural source search and rewrites | MIT | Adopt ast-grep-core 0.45.2 for read-only, source-bound pattern search; rewriting remains separate |
| [Rayon](https://github.com/rayon-rs/rayon) | Dynamic parallel task scheduling | MIT OR Apache-2.0 | Adopt 1.12.0 for a shared extraction pool capped at 16 workers, with deterministic facts and failure order |
| [petgraph](https://github.com/petgraph/petgraph) | Graph algorithms | MIT OR Apache-2.0 | Adopt 0.8.3 iterative SCC analysis over the existing proven package projection |
| [SCIP](https://github.com/scip-code/scip) | Compiler-produced navigation evidence | Apache-2.0 | Already supported by CGRX; continue using source-bound proofs |
| [Trace MCP](https://github.com/nikolai-vysotskyi/trace-mcp) | Agent code intelligence and search workflow reference | MIT | Compare documented behavior; no source copied or fork introduced |

The adopted libraries are pinned in Cargo.lock. Their license notices and
dependency inventory are retained in the repository. Graph storage, lexical
ranking and memory retain their existing contracts.

## Reproducing the experiment

```sh
python3 scripts/eval_search_discovery.py target/release/cgrx --baseline /path/to/cgrx-alpha17
python3 scripts/eval_search_discovery.py target/release/cgrx --output search-discovery.json
```

The harness uses public stdio MCP requests against a temporary synthetic Git
repository and checks discovery, ranking, opt-in body behavior, filters,
compact transport and pagination. The [recorded paired experiment](benchmarks/search-discovery-2026-10-11.md)
reports 17/33 baseline checks and 33/33 candidate checks on the same fixture.
Synthetic retrieval checks do not measure competitor performance,
monorepo scaling or whole-agent task cost.
