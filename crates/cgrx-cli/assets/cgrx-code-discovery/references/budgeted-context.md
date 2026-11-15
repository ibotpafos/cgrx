# Budgeted context

Use `orient` when a broad task benefits from a task-sized evidence capsule.
Provide a concrete task and explicit include/exclude, `relation_kinds`, and
`max_depth` scope. Omit `budget` for the adaptive 400-1000 token first pass,
or choose `budget_preset`: `quick` (400), `standard` (800), or `deep`
(1600). Prefer `quick` unless the task spans architecture or a refactor.
Only `task` is required. Missing fields default to `BOUNDED`, all paths,
`CALLS` at depth 1; a path, paths or partial scope object is accepted. Prefer
explicit narrow scopes. An explicit `budget` overrides `budget_preset`.

Expand only handles returned by that call, with the same `repo` and a bounded
budget. Never construct handles or reuse them across repositories, server
restarts, or eviction. Request a fresh handle after a stale or not-found error.

Treat dynamic-dispatch counts as unresolved call sites, not confirmed defects.
Use the compact per-kind and per-path counts first; inspect exact sites only for
paths that affect the task.

Use `CALLS` and `IMPLEMENTS` in orient scopes. Use the dedicated architecture,
usage, outline, or text-search paths when the requested relationship is outside
that scope.

## Structural search

In a managed repository, `search_graph` accepts `match_mode: "ast"` and
`language: "rust"`, `"typescript"`, `"python"`, or `"go"`. TypeScript includes
TSX. Keep lexical search for names and natural-language terms; use AST patterns
for source constructs. For example, `fetch($ARG)` matches one argument,
`fetch($$$ARGS)` matches an argument list, and `$VALUE == $VALUE` requires the
same captured syntax on both sides. `include_body` belongs to lexical mode.

Results are indexed definitions containing the pattern. Carry their `symbol`,
`path`, and `symbol_ref` into normal navigation or code-bound memory. Inspect
`ast_matches.spans` for exact source byte ranges and `ast_matches.source_hash`
for the verified file fingerprint. A syntax match does not establish which
callee a name resolves to.

Read `ast_scan` before relying on absence. Each request considers at most 4096
definitions, reads at most 64 MiB of source (16 MiB per file), and parses at most
16 MiB of definition bodies. Non-UTF-8 source and unavailable body ranges are
skipped. `partial` and `skipped_definitions` report incomplete scanning; narrow
the scope and retry. Each matching definition retains at most eight match
spans; its `ast_matches.truncated` reports further occurrences.

Pagination orders definitions by path, definition span and node identity.
Use `page.next_offset` with the same query, mode, language and scope, and pass
`expected_snapshot: page.snapshot_id`. On `cgrx.ast_source_changed`, refresh
status and rediscover. Changed hashes or missing files cannot return stale
match ranges. Structural search requires current repository source; static
state-only servers report `cgrx.ast_search_unavailable`.

## Argument compatibility

`trace_path` accepts `incoming` for `callers` and `outgoing` for `callees`;
responses keep the canonical direction names and the same evidence selectors.

`scan_risks` compares the current working tree with `HEAD` by default. Its `base`
also accepts any local commit revision: full or short OID, tag, branch, or
`HEAD~N`. The returned `base_revision` (`base` in compact responses) is the
resolved full OID. Historical comparisons include committed changes plus current
edits; they neither check out the commit nor replace the live HEAD graph.
Unavailable or non-commit references return `cgrx.invalid_base`. See
[change verification](change-verification.md) for evidence and test-run limits.
