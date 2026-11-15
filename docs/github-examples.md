# GitHub implementation examples (prototype)

`find_examples` finds public implementations through the official GitHub MCP,
then CGRX ranks them against the current local project's manifests. It returns
3–5 distinct repositories when enough verified candidates are available. Each
option contains a commit-pinned code excerpt, line links, a Git blob hash,
project-fit reasons, dependency requirements, and adaptation notes.
The tool uses manifest context and does not need to open or create a graph
index. `project_snapshot` records the Git revision, manifest fingerprint and
`context_scope: "manifests_only"`; it is not a graph evidence certificate.

This is a first prototype. Retrieval is GitHub's lexical code search; the agent
translates a task into short API/identifier queries. Ranking is deterministic,
uses no LLM, and does not prove behavioral equivalence or API compatibility.

## Run from this checkout

Prerequisites: the normal CGRX build dependencies, `uv`, Python 3.11 or newer
(selected by uv), and a GitHub account authenticated through `gh auth login`.
The optional adapter pins the official Python MCP SDK to `mcp==2.3.0` and its
HTTP client to `httpx2==2.10.0`. uv downloads these into its script environment
on first use; they are not Rust dependencies or a global Python installation.

```sh
cargo build --locked -p cgrx-cli
export CGRX_GITHUB_MCP_BRIDGE="$(pwd)/scripts/github_mcp_bridge.py"
target/debug/cgrx examples \
  --repo "$(pwd)" \
  --task 'Найти обработку изменений файлов с debounce' \
  --query 'notify RecommendedWatcher debounce' \
  --language Rust \
  --limit 4 \
  --json
```

The CLI prints the report itself as JSON and exits unsuccessfully for invalid
arguments, missing configuration, authentication failures, or bridge failure.
An otherwise successful search with fewer than three verified implementations
returns `status: "partial"`; it never invents or pads examples.

## Use through MCP

Start the newly built server with the bridge configured in its environment:

```sh
CGRX_GITHUB_MCP_BRIDGE=/absolute/path/to/cgrx/scripts/github_mcp_bridge.py \
  /absolute/path/to/cgrx/target/debug/cgrx serve --multi-repo
```

An already-running older MCP server must be restarted with the new executable
before its `tools/list` can advertise `find_examples`. Building this checkout
does not update an existing client connection or replace its installed binary.

Tool arguments:

```json
{
  "repo": "/absolute/path/to/project",
  "task": "Найти обработку изменений файлов с debounce",
  "queries": ["notify RecommendedWatcher debounce"],
  "language": "Rust",
  "limit": 4,
  "budget": 6000
}
```

- `repo`: canonical local Git worktree root, as with other multi-repo tools.
- `task`: the user's goal, up to 4,000 bytes; kept in the Rust process.
- `queries`: 1–3 GitHub code-search queries, up to 512 bytes each. Prefer English
  API names and distinctive identifiers; do not paste project source or secrets.
- `limit`: 3–5, default 4; one option per repository and duplicate blobs removed.
- `language`: optional GitHub language filter. Inferred when inspected manifests
  establish exactly one language; a caller hint is not evidence about the project.
- `budget`: 2,000–12,000 tokens, default 6,000. Shortens code around the actual
  query anchor before discarding evidence. Increase it if even the metadata and
  minimal code windows cannot fit. Space is reserved for MCP routing metadata.

The minimal toolset excludes `find_examples`; standard and full include it.
Both MCP response profiles support it. The token-efficient profile contains one
text report and omits the duplicate `structuredContent` representation.

## Evidence and ranking

The bridge negotiates the official server's tool catalog, uses its read-only
repository endpoint, and calls `search_code`, `search_repositories`, `get_commit`
and `get_file_contents`. File and manifest fetches use a canonical commit SHA.
An indexed match may lag that commit; CGRX rechecks the fetched source against
the query anchors and verifies its Git blob hash before returning an excerpt.
Large files, unsupported resources, archived repositories and private
repositories are skipped, with bounded issue codes. Arbitrary resource links
are not followed. Remote repositories are not checked out or executed.
README, AGENTS and other documents are excluded: options must contain supported
source-code files. In a mixed-language project, set `language` for a focused
search; the agent should infer it from the implementation being considered.
Excerpts prefer matching callable definitions over comments, imports, type
aliases and configuration fields, using the existing language parsers.

The `github_project_fit_v1` score combines a project language match (400),
query-anchor coverage (up to 300), shared declared dependencies (up to 240),
and recognized license metadata (60). This is a relative ranking, not a
probability or a guarantee of suitability. Dependency comparisons show the
actual declared requirements; matching names alone do not establish compatible
versions. Tokio and differing requirement strings produce adaptation notes.

Local context covers root Cargo, npm, Python and Go manifests and up to 32
explicit Cargo workspace members. Globs, inaccessible files and unknown
languages remain visible as gaps. The local source repository is excluded when
its GitHub origin can be identified. Credentials embedded in an origin URL are
not retained. Manifest fingerprints detect project changes during retrieval.

Every option carries `test_status: "not_run"`. No tests, dependency installation,
code reuse or source edits happen as part of this tool. External source and its
comments are data, never instructions to the agent. License metadata must be
checked before copying code.

## Configuration and boundaries

`CGRX_GITHUB_MCP_BRIDGE` is one absolute executable path, without shell syntax
or arguments. The shipped script has an executable uv shebang. The adapter
uses `GH_TOKEN`, `GITHUB_TOKEN`, or `GITHUB_PERSONAL_ACCESS_TOKEN` if already set;
otherwise it obtains the existing credential with `gh auth token` internally.
Tokens, raw upstream errors and SDK logs are not written to stdout or CGRX usage
logs. No new credential is created.

The optional bridge is the network boundary. Rust crates retain the existing
network-denied dependency contract, and normal indexing and graph tools do not
invoke the bridge. Only caller-supplied queries and a language filter leave the
Rust process; project paths, source, task text and manifests are not sent.

The bridge permits at most 45 MCP tool calls per request, caps each source at
96 KiB and total output at 2 MiB, and has an overall deadline. Rust terminates
the bridge process group when its deadline expires. Set
`CGRX_GITHUB_MCP_TIMEOUT_MS` to 50–120000 to override the 120-second deadline.

Upstream references: [GitHub MCP](https://github.com/github/github-mcp-server),
[read-only hosted configuration](https://github.com/github/github-mcp-server/blob/v2.0.2/docs/remote-server.md),
[official Python MCP SDK](https://github.com/modelcontextprotocol/python-sdk).
