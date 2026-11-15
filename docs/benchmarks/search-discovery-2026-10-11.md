# Search discovery and compact transport, 2026-10-11

The updated `search_graph` discovers identifiers and definition bodies containing
all query tokens, keeps name precedence, and returns resumable pages. Compact
responses now retain every requested match up to the existing limit of 50.
The shared retrieval tokenizer also handles acronym boundaries, Unicode case
and letter/digit transitions for the existing BM25 and structural lanes.

This experiment compares two CGRX binaries through their public stdio MCP
interface. It measures selected synthetic discovery and transport contracts;
it does not compare competitors or measure whole-agent effectiveness.

## Paired source and binaries

The baseline source is commit `a4efd523dff418489965f1055cee5ec64e390d96`.
Both binaries use the default language features and a debug build. The candidate
was built from the upgrade working tree based on that commit.

| Build | Binary SHA-256 |
| --- | --- |
| Baseline | `6359c51c275e7469f6b077e2c2dc6a8f72600311afc99dbb1894c3ffde7bb464` |
| Candidate | `2883bac46b61f4d82f0f367fc5ea8e830cf5c9a1fe7855bb37fc6254d2247159` |

The harness creates four TypeScript/Python source files in a temporary Git
repository and fixes the author and committer timestamps. Its fixture commit
is `c674c7a55172ca0fde60e2aff8d95cbfb17e5c93` and its source-map SHA-256 is
`f16ec21c321ec85605bfdcc2dd304190241d6179ad34e75a8f56be44002a2750`.
The retained [JSON observations](search-discovery-2026-10-11.json) include
both binary hashes, the fixture identity, per-check results, model-visible byte
counts and snapshot identities. Snapshot IDs include the local index identity
and therefore change between temporary directories.

## Public MCP results

The same 15 `search_graph` requests run against each binary in both `full` and
`compact` profiles. The harness checks expected symbols and order, whole-query
totals, complete compact rows, addressable symbol references and pagination
metadata. Repeated responses and snapshot identity add three stability checks.

| Contract | Baseline | Candidate |
| --- | --- | --- |
| All checks across both profiles | 17/33 | 33/33 |
| `http server`, TypeScript: `HTTPServer` and `HTTPServerFactory` | 1 of 2 designated names | Both designated names |
| `invalidate cache`, opt-in body search across separate source lines | No designated body | `replenish` |
| Request 50 matches from 57 definitions: compact rows | 12 | 50 |
| Pages at offsets 0, 20, 40, 60 with limit 20: compact row counts | 12, 12, 12, 12 | 20, 20, 17, 0 |

The baseline's first acronym match uses fuzzy matching; the second name is
missing. Its structured first search page contains the requested 50 matches,
but model-visible compact output silently drops 38. Offset requests repeat the
first page. The candidate preserves all requested rows and the final page has
`next_offset: null` and `has_more: false`; an offset beyond the result set
returns an empty page while retaining the total of 57.

Existing exact-name precedence, literal opt-in body discovery, language and
path filters, Unicode discovery, absence of a partial conjunctive match and
repeat identity all pass in the candidate. Body matches stay disabled unless
explicitly requested. These are lexical retrieval observations, not evidence
of proven call relationships or complete repository coverage.

Returning additional requested rows increases the model-visible response. For
the 50-match request, compact text grows from 1,471 to 5,916 UTF-8 bytes. This
repairs missing output; it is not a token-saving claim. Clients can keep a small
`limit` and follow `page.next_offset`. Token counts, latency, resident memory,
monorepo scale and independent agent-task performance were not measured here.

## Reproduction

```sh
cargo build --locked -p cgrx-cli
python3 scripts/eval_search_discovery.py target/debug/cgrx \
  --baseline /path/to/baseline/cgrx \
  --output search-discovery.json
```

The baseline receives exactly the same requests, including the newly supported
offset argument. Baseline failures are reported but only candidate failures
make the harness exit nonzero. Without `--baseline`, the harness verifies the
candidate contracts independently. No frozen external repository, API key,
network request or Python package installation is needed.

The fixture stays unchanged during these requests. Snapshot-change rejection
is exercised separately by the CLI and MCP regression tests; this experiment
validates that all returned page IDs remain stable and use the full digest.

## Competitive reference and reuse

[Trace MCP's public tools reference](https://trace-mcp.com/tools-reference.html)
documents FTS5/BM25 discovery with language/file filters. CGRX already used BM25
inside `orient`; this update brings useful multi-token identifier discovery to
the smaller `search_graph` surface and fixes its compact transport.

[Tantivy](https://github.com/quickwit-oss/tantivy) (MIT),
[ast-grep](https://github.com/ast-grep/ast-grep) (MIT) and
[SCIP](https://github.com/scip-code/scip) (Apache-2.0) were reviewed as useful
open-source references. SCIP is already integrated. This update reuses CGRX's
own retrieval code and adds no dependency, copied third-party source or fork.
The measurements establish the selected CGRX regressions and gains, with no
overall superiority claim against these tools or other competitors.
