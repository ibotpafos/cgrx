---
name: cgrx-code-discovery
description: Use the CGRX MCP for code discovery, architecture inspection, change verification and persistent project memory in local Git repositories. Trigger when work needs graph evidence, previous decisions or failures, reusable procedures, or task checkpoints; use direct text search for literals and configuration.
---

# CGRX code discovery

Use one registered `cgrx` MCP server across repositories. The user's instructions
and repository rules take precedence over this workflow. Select CGRX only when
graph relationships, impact analysis, or prior project context help the task.
Routine commands and self-contained edits do not require CGRX or project memory.

## Bind every request

Resolve the absolute canonical Git worktree root with
`git rev-parse --show-toplevel`. Pass that root as `repo` on every CGRX call.
Never pass a subdirectory or another repository's root.

Start with `status(repo, paths_or_scope=[relevant_path])`. Confirm the revision,
graph generation, freshness, changed paths, and coverage state. Repeat after
switching repositories or after source changes when later evidence depends on
the refreshed graph.

When checking a server update, inspect `status.server`: its `pid` and optional
`build_id` identify the running process. Compare the build ID with the installed
build receipt; a null ID means the binary was not stamped. Repository revision
and graph freshness do not identify the executable serving the chat.
An absent `server` object can indicate an older implementation. Replacing the
installed binary or successfully probing a separate process does not verify
the chat's live connection; check status through that chat after restarting
the MCP client and confirm that its advertised tools include the new arguments.

## Gather evidence

Select only the evidence operations needed for the question; the following
are available steps, not a mandatory four-call sequence:

1. `search_graph` with a symbol or intent and a small limit.
2. `trace_path` from a returned definition, initially at depth 1.
3. `get_code_snippet` for definitions behind material claims.
4. `check_index_coverage` for every evidence path used in the conclusion.

Use `get_outline` for file structure, `find_usages` for bounded references,
`get_architecture` for package and symbol topology, and `suggest_refactors` for
candidate refactors. Treat returned limits and `truncated` as real boundaries;
narrow the request instead of inventing pagination fields.

When `search_graph` advertises pagination, follow `page.next_offset` with
`offset` and pass `expected_snapshot=page.snapshot_id`. On a stale snapshot,
refresh status and restart from the first page. Identifier tokens match
compound names; `include_body` also searches function bodies.

For syntax patterns, use `search_graph` with `match_mode: "ast"`, an explicit
`language` (`rust`, `typescript`, `python`, or `go`), and a query such as
`fetch($ARG)`. Inspect `ast_matches.spans`, `ast_matches.source_hash`, and
`ast_scan.partial`.
Use AST mode only when the live tool schema advertises `match_mode`; an older
server may ignore an unknown argument and perform lexical search instead.
These are syntax matches within indexed definitions; use tracing or usages to
verify callee identity. Read [structural search limits](references/budgeted-context.md#structural-search)
before treating an empty or partial result as evidence.

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

When supported by `trace_path`, use `scope.relation_kinds: ["CONTAINS"]` to
inspect source-proven nesting. A shared symbol-name prefix is not containment
evidence. Check coverage and source ranges before relying on the relation.

Decode compact `cols`/`rows` responses by their returned column names. Preserve
evidence, coverage, and truncation fields just as with the `full` profile.

Read source directly when coverage is partial, unknown, excluded, or stale,
when an answer is ambiguous, or when a relation looks suspicious. Use direct
text search for literals, generated files, configuration, and relationships the
graph does not model. A missing graph edge is not proof that code is unused.

## Use project memory

Recall memory after status when previous decisions, failed attempts, or
continuation state could affect the task. A Git task does not by itself require
recall or recording. Save only useful verified decisions, failures, reusable
procedures, or meaningful checkpoints; routine command success needs no entry.
Correct existing records rather than duplicating them. Report unavailable memory
without treating it as empty, and continue without inventing saved results.

When recall is useful, after status use `memory_recall` for relevant decisions, failed
approaches, procedures or task checkpoints when the server advertises it.
Keep the query, kind/task filters and token budget specific to the task.
Use `include_code: true` only when source fragments are needed with memories.
Narrow code context with exact `path` and `symbol` filters when available.
An available fragment can return a current `code.symbol_ref`; carry it with
`code.symbol` and `code.path` into tracing, usage lookup or a full snippet.
For changed or moved code, inspect any returned `code.candidates` using their
own selectors before updating the memory. Candidates keep the saved assertion
stale until explicitly rechecked. Code can be shortened or omitted to fit the
budget while retaining the fact; respect all truncation flags.
Verify recalled assertions against current evidence and respect source
freshness; memory does not override the current user or repository rules.

Save useful durable outcomes with `memory_record`, correct them with
`memory_update`, and use `memory_forget` when a record should be removed.
Use `semantic` for facts and decisions, `episodic` for distinct attempts,
`procedural` for reusable workflows, and `working` for task checkpoints.
Bind code-backed records to the discovered `symbol`, `path`, and current
`symbol_ref`; CGRX saves the source fingerprint and exact ranges. Rediscover
the symbol before updating a record after source changes.
Read [agent memory](references/agent-memory.md) when recalling or saving context
for provenance, expiry, version checks and supported arguments.
On `cgrx.memory_write_uncertain`, reconcile the returned ID and expected version
before repeating a mutation; a failed commit may already be durable.
Semantic recall indexes only eligible current records; backfill preserves
assertions and history and publishes a verified copy before returning results.
After a crash, an unavailable primary with recovery copies requires a verified
backup; do not treat it as empty memory or promote an unconfirmed copy.

## Prefer established dependencies

When a substantial infrastructure or UI choice warrants research, evaluate maintained,
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

## Required quality patch gate

For a quality candidate, call prepare_candidate_patch(repo, candidate_id,
run_project_checks=true) before applying anything. Require
patch_verification.status=project_checks_passed, all three stages passed on BOTH
baseline and modified copies, source_modified=false and stable checked sources.
Only apply the returned formatted diff if its source hash still matches.
Syntax-only, blocked, unavailable, timeout and baseline failures never authorize
a patch. Re-list stale candidates; review graph impact; verify after application.
Unsupported patches need equivalent isolated project checks and review, not a
fabricated candidate. Never silently bypass a missing script/tool or failing test.
Review the repository's .cgrx/quality-checks.json commands before opting in.
Filesystem copies are not a security sandbox. Never use deploy/migrate/seed/watch
commands as checks or download dependencies during verification.
