# Agent usage

Use one multi-repo CGRX MCP server. Pass the absolute Git worktree root
in repo on every call; never reuse handles across repositories/sessions.

Reusable agent instruction:

~~~text
Use CGRX for task-directed code discovery.
1. status: confirm repo revision, freshness and graph state.
2. search_graph: find relevant symbols with a small limit.
3. trace_path: follow callers/callees, initially depth=1.
4. get_code_snippet: read definitions behind material claims.
5. check_index_coverage: check all evidence paths together.
For partial, unknown, excluded or stale coverage, inspect source directly.
Use text search for literals, configuration and unsupported relationships.
A missing edge is not proof of dead code. scan_risks reports candidates,
not confirmed bugs. Verify findings with source and compiler/tests.
Use orient/expand for budgeted context and only reuse returned handles
within the same live session and repository.
Do not put source code, credentials or raw queries in usage logs.
~~~
