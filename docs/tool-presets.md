# Tool Presets

CGRX can restrict the set of tools exposed to clients by an active **toolset**.
This lets a deployment expose only the capabilities it needs (for example a
read-only CI reporter) without changing any tool behavior.

## Presets

| Preset | Tools |
| --- | --- |
| `minimal` | `status`, `search_graph`, `get_outline`, `trace_path`, `find_usages`, `get_code_snippet`, `check_index_coverage` |
| `standard` (default) | `minimal` + `orient`, `expand`, `get_architecture` |
| `full` | `standard` + `scan_risks`, `check_change_gates`, `check_repository_gates`, `ingest_runtime_evidence`, `find_similar`, `suggest_refactors` |

The default toolset is **`standard`**.

## Response profiles

MCP serving defaults to `token-efficient`. It returns the existing compact
projection in `content` and omits optional `structuredContent`, so clients do not
place a second copy in model context. Select `full` only for programmatic clients
that consume internal report fields:

```bash
CGRX_RESPONSE_PROFILE=full cgrx serve --multi-repo
cgrx serve --multi-repo --response-profile full
```

`CGRX_RESPONSE_PROFILE` takes precedence over `--response-profile`. Accepted
values are `token-efficient` (also `compact`) and `full`.

`memory_record` and `memory_recall` are not part of any preset, so they are
not enabled under any of the three presets (they remain available through the
full tool schema and via the dedicated CLI subcommands).

## Selecting a toolset

The active toolset is resolved in this order:

1. The `CGRX_TOOLSET` environment variable (preferred).
2. The `--toolset <minimal|standard|full>` CLI flag (fallback).
3. If neither is set, or the value is not one of the three presets, the server
   falls back to `standard` and prints a warning to stderr.

The resolution is case-insensitive: `Minimal`, `MINIMAL`, and `minimal`
are equivalent.

### Environment variable

```bash
export CGRX_TOOLSET=minimal
cgrx serve --repository . --port 8787
```

### CLI flag

```bash
cgrx serve --repository . --port 8787 --toolset standard
```

## Client-visible behavior

The active toolset is reported to clients in the `initialize` response: the
`instructions` field ends with ` Active toolset: <name>.` (e.g.
` Active toolset: standard.`).

The tool *schema* returned by `tools/list` is unchanged (it always advertises
the full surface), but any `tools/call` for a tool that is not in the active
toolset is rejected with a `cgrx.tool_not_found` error
(`code: -32602`). This keeps clients from invoking disabled tools while
preserving the documented schema contract.

## Examples

```bash
# Read-only, deterministic CI reporting surface
CGRX_TOOLSET=minimal cgrx serve --repository . --port 8787

# Explicit standard (default) surface
cgrx serve --repository . --port 8787 --toolset standard

# Full surface, including risk/change-gate tools and refactor suggestions
CGRX_TOOLSET=full cgrx serve --repository . --port 8787
```
