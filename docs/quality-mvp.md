# Quality candidates MVP

MCP tools (full toolset; repo is an absolute Git root):
- list_quality_candidates {repo, kind?: duplicate|dead_code|hardcode, offset?: 0, limit?: 20, expected_snapshot?: <snapshot returned by previous page>}.
- get_candidate_details {repo, candidate_id}.
- prepare_candidate_patch {repo, candidate_id}.

The index is built lazily on first request, cached in runtime memory and persisted in the managed state directory as quality-candidates-v1.json. Every refreshed graph/source snapshot invalidates candidate IDs. This is not an independent always-running background scanner.

Duplicates reuse the existing similarity index/scanner (threshold 760, at most 2,000 documents, 20,000 pairs and 50 returned duplicate pairs; omissions marked partial). Dead code means possible unreferenced callable, not proven unreachable code. Global proven incoming calls, implementations and other available relations suppress candidates; known exports/public declarations, test paths, decorators and entry points are conservatively suppressed. No absence claim overrides coverage gaps.

Hardcodes: AST string assignments in Rust, Python and TypeScript, with credential-like names, HTTP(S) endpoints or local absolute /Users and /home paths. Not arbitrary magic numbers or all secrets. Literals are redacted in the inventory. At most 500 files, 256 KiB/file, 8 MiB hardcode input, 100 sites/file; a separately bounded visibility stage reads at most 500 files/approximately 8 MiB. Unsupported languages, invalid syntax, exclusions and exhausted budgets are explicit gaps.

Graph context: global incoming evidence plus reverse impact depth 2, at most 50 affected symbols. Partial coverage and traversal truncation are exposed, never treated as proof of safety.

Patch preparation: review-only unified diff with BLAKE3 source precondition, maximum 16 KiB output. Only extraction of non-sensitive TypeScript endpoint/path literals to a uniquely named module constant is automatic. It does not externalize configuration. Directives/shebang/BOM, multiline literals, credential-containing files and ambiguous remediation are blocked. Dead-code deletion and duplicate consolidation require manual semantics-aware planning. Source is never changed by any of the three tools.

Dependencies: existing ast-grep/Tree-sitter for syntax and BLAKE3 for fingerprints; similar =2.7.0 for standard unified diffs (https://github.com/mitsuhiko/similar). No model or cloud service required. Each candidate kind is capped at 300 records; omissions are explicit CANDIDATE_LIMIT gaps. Similar 2.7.0 is Apache-2.0 licensed.
