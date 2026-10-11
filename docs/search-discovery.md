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
| [ast-grep](https://github.com/ast-grep/ast-grep) | Structural source search and rewrites | MIT | Future apply workflows require separate snapshot and ambiguity validation |
| [SCIP](https://github.com/scip-code/scip) | Compiler-produced navigation evidence | Apache-2.0 | Already supported by CGRX; continue using source-bound proofs |
| [Trace MCP](https://github.com/nikolai-vysotskyi/trace-mcp) | Agent code intelligence and search workflow reference | MIT | Compare documented behavior; no source copied or fork introduced |

No new dependency or third-party source is bundled by this update. License
information is linked to each repository and applies to the reviewed tools,
not an adoption claim.

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
