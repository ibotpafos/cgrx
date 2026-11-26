# Tool presets

Presets restrict both the advertised MCP tools and calls accepted by the server.
They do not change enabled tools' behavior or guarantee a read-only process:
managed calls may refresh persistent indexes and session state.

## Presets

| Preset | Count | Tools |
| --- | ---: | --- |
| `minimal` | 10 | `status`, `memory_recall`, `search_graph`, `get_outline`, `trace_path`, `find_usages`, `get_code_snippet`, `check_index_coverage`, `check_framework_gates`, `check_security_gates` |
| `standard` | 17 | `minimal` + `orient`, `expand`, `get_architecture`, `explain_symbol`, `memory_record`, `memory_update`, `memory_forget` |
| `full` | 29 | `standard` + `find_examples`, `scan_risks`, `check_change_gates`, `check_repository_gates`, `ingest_runtime_evidence`, `suggest_refactors`, `detect_dead_code`, `list_quality_candidates`, `get_candidate_details`, `prepare_candidate_patch`, `get_quality_index_status`, `update_quality_candidate_status` |

Single-repository serving defaults to **standard**. Multi-repository serving
defaults to **full** for compatibility. `find_similar` is not a wire tool and is
not enabled by any preset.

## Selection

Both serving modes use the same resolution:

1. A nonempty, trimmed `CGRX_TOOLSET` environment value wins over the flag.
2. Otherwise, `--toolset minimal|standard|full` selects the preset.
3. Without either, the mode-specific default applies.

Values are trimmed and case-insensitive. An invalid selected value warns on
stderr and falls back to **standard**, even in multi-repo mode; an invalid
nonempty environment value does not fall through to the flag. Empty or
whitespace-only environment values are ignored. A missing multi-repo flag value
is a CLI error.

```bash
# Single-repository default: standard
cgrx serve --root /absolute/project

# Multi-repository default: full
cgrx serve --multi-repo

# Explicit minimal, with each tool call routed by its repo argument
cgrx serve --multi-repo --toolset minimal

# Environment wins over --toolset full
CGRX_TOOLSET=standard cgrx serve --multi-repo --toolset full
```

## Wire behavior

The `initialize` result's `instructions` reports
`Toolset: <name>; response profile: <profile>.`
`tools/list` advertises only enabled tools. Disabled and unknown tool calls
return JSON-RPC `-32602` with `error.data.code = "cgrx.tool_not_found"`.

Multi-repo tool schemas require an absolute Git worktree-root `repo` argument
on every call. Disabled calls are rejected before memory validation, resource
admission, repository loading or tool execution. Enabled calls keep the existing
routing, repository isolation and handle lifetime rules. Usage logs retain known
public tool names (including disabled tools), redact unknown names to `unknown`,
and never record arguments, source, raw queries or handles.

## Response profiles

Both serving modes default to `token-efficient`. Successful repository tool
calls return compact model-visible JSON text in `content` **and** an object in
`structuredContent`, as required by the advertised `outputSchema`.
In `token-efficient`, that object is the same compact projection, not an omitted
channel. In `full`, it is the complete internal report; `content` stays compact.
Multi-repo responses preserve repository and handle decoration in both channels.

```bash
CGRX_RESPONSE_PROFILE=full cgrx serve --multi-repo
cgrx serve --multi-repo --response-profile full
```

A nonempty `CGRX_RESPONSE_PROFILE` wins over `--response-profile`.
Values are trimmed and case-insensitive: `full`, `token-efficient`,
`token_efficient` and `compact` are accepted. Invalid selected values warn and
fall back to `token-efficient`.

Toolset/profile settings do not replace runtime configuration. In particular,
the existing `CGRX_FAST_ANYTHING_CONFIG` configuration still selects profiling
projects and commands; its quality-report tools require `full`. No client
configuration file needs to be edited to select these server settings.
