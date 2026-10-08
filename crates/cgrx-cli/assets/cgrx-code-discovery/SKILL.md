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
2. `trace_path` from a returned definition, initially at depth 1.
3. `get_code_snippet` for definitions behind material claims.
4. `check_index_coverage` for every evidence path used in the conclusion.

Use `get_outline` for file structure, `find_usages` for bounded references,
`get_architecture` for package and symbol topology, and `suggest_refactors` for
candidate refactors. Treat returned limits and `truncated` as real boundaries;
narrow the request instead of inventing pagination fields.

Carry the returned `symbol`, `path`, and `symbol_ref` together when selecting a
definition with `get_code_snippet`, `trace_path`, or `find_usages`. Select the
correct definition span from `search_graph` or `get_outline` when names repeat.
Treat `symbol_ref` as opaque and bound to that repository's index snapshot;
never derive it from a name or node ID. After `cgrx.symbol_ref_not_found`, refresh
status and rediscover the definition. Older servers without `symbol_ref` need a
unique symbol/path match; inspect ambiguity instead of choosing the first match.

For import or declaration dependency questions, use `find_usages` with an
explicit `scope.relation_kinds` such as `IMPORTS` or `REFERENCES`, depth 1, and a
small limit. Select the destination's syntax definition. An import binding may
have no definition `symbol_ref`; do not turn its source site into a selector.
`IMPORTS` and `REFERENCES` establish dependency identity, not a `CALLS` callee.
Keep type, value, and `typeof` uses distinct and inspect owned coverage gaps for
unsupported module configuration, shadowing, merges, or dynamic dispatch.

Decode compact `cols`/`rows` responses by their returned column names. Preserve
evidence, coverage, and truncation fields just as with the `full` profile.

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
