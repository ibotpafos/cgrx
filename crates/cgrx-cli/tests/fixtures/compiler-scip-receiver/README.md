These unedited SCIP files came from the official rust-analyzer 2026-10-05
standalone release. `provenance.json` records source revisions, SHA-256 hashes,
and the provider's offline sysroot metadata limitation.

Both sources passed `cargo check --offline` with Rust 1.89.0. Version B changes
only `caller(worker: A)` to `caller(worker: B)`, preserving every declaration
and call-site byte range. Its fresh compiler reference changes from `A.work`
to `B.work`. The real provider also resolves the local `Reader.options` call.

The source crate has no external dependencies. Export reported an unavailable
`r-efi-alloc` dependency in standard-library metadata, so tests exercise these
reduced receiver bindings rather than complete sysroot or full-project coverage.
Generated document text is empty. Provider metadata retains its original
evidence path; it is not rewritten.

The live MCP test serves the initial index, changes receiver type, checks that
old proofs are withdrawn, then supplies the fresh index without restarting.
It also verifies that replacing identical bytes cannot restore the old proof,
dirty working sources defer import, and missing or truncated files produce
typed errors before a complete publication recovers.
The checked import refuses a file whose bytes changed after observation, before
publishing a semantic generation; retrying with the current input succeeds.
