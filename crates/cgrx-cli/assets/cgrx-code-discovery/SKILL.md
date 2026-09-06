---
name: cgrx-code-discovery
description: Use the CGRX MCP for task-directed code discovery, architecture inspection, refactor analysis, and evidence-backed verification in local Git repositories. Trigger when CGRX is available and work needs symbols, call paths, snippets, architecture, change risks, or graph coverage; use direct text search for literals and configuration.
---

# CGRX code discovery

Use one registered `cgrx` MCP server across repositories. The user's instructions
and repository rules take precedence over this workflow.

## Bind every request

Resolve the absolute canonical Git worktree root with
`git rev-parse --show-toplevel`. Pass that root as `repo` on every CGRX call.
Never pass a subdirectory or another repository's root.

Start with `status(repo, paths_or_scope=[relevant_path])`. Confirm the revision,
graph generation, freshness, changed paths, and coverage state. Repeat after
switching repositories or after source changes when later evidence depends on
the refreshed graph.

## Gather evidence

Use the smallest useful sequence:

1. `search_graph` with a symbol or intent and a small limit.
2. `trace_path` from a returned symbol and path, initially at depth 1.
3. `get_code_snippet` for definitions behind material claims.
4. `check_index_coverage` for every evidence path used in the conclusion.

Use `get_outline` for file structure, `find_usages` for bounded references,
`get_architecture` for package and symbol topology, and `suggest_refactors` for
candidate refactors. Treat returned limits and `truncated` as real boundaries;
narrow the request instead of inventing pagination fields.

Read source directly when coverage is partial, unknown, excluded, or stale,
when an answer is ambiguous, or when a relation looks suspicious. Use direct
text search for literals, generated files, configuration, and relationships the
graph does not model. A missing graph edge is not proof that code is unused.

## Prefer established dependencies

Before implementing infrastructure or UI primitives, evaluate maintained,
license-compatible libraries that solve the exact need. Prefer a pinned library
when it materially reduces custom logic and its security, size, performance, and
maintenance costs fit the project. Record the choice and upstream license.
Implement custom code when the available libraries fail the project's offline,
security, bundle-size, performance, or API requirements.

## Report verified conclusions

Keep revision/generation, evidence paths, source hashes or spans when relevant,
and coverage gaps with the conclusion. Separate proven graph evidence from
inference. Confirm suspected defects with source and compiler or test results.

For working-tree review, read
[change verification](references/change-verification.md). For a broad task that
needs bounded context, read
[budgeted context](references/budgeted-context.md).

Do not place source, credentials, raw queries, snippets, or handles in usage
logs. Handles are session-bound: use only handles returned by the current live
server for the same repository.
