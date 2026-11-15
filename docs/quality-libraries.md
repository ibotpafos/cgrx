# Local quality analysis: first integration

Selected stack: ast-grep-core =0.39.6 (MIT), existing Tree-sitter 0.25.10 (MIT), existing BLAKE3 for indexed fingerprints. Only ast-grep-core is a new direct dependency. Upstream: https://github.com/ast-grep/ast-grep . Newer 0.45.2 requires Tree-sitter 0.26 and conflicts with the native links requirement; do not upgrade all parsers implicitly.

Runtime::suggest_refactors now attaches quality_checks to each returned duplicate/refactor candidate, including compact MCP responses. Checks cover Rust unwrap/expect and Python eval/exec and TypeScript eval. Findings are syntax candidates, not confirmed vulnerabilities: identifiers may be shadowed and panic-on-error may be intentional. No source snippets or values are returned. Offsets refer to indexed_search_text, NOT file byte offsets.

Limits: 64 KiB per snippet, 20 findings per side, unsupported/budget/parse statuses explicit. This is candidate enrichment, NOT an automatic whole-repository security audit or a background findings backlog. No source changes are applied automatically. No inference server or network needed at runtime.

Deferred: semgrep adapter and RustSec vulnerability data ingestion need explicit data freshness, engine licensing and budget handling. Embedding models, TEI, Zoekt and a second graph store are not required for this first step. Dead code still requires entry-point/reachability evidence; absence of CALLS alone is not proof.
