## Summary

Describe what changed and why.

## Validation

List the checks you ran and their results.

## Evidence / coverage impact

Describe any graph-resolution, evidence, coverage-gap, indexing, or schema
changes. Write `none` when not applicable.

## Checklist

- [ ] The change is focused and does not mix unrelated cleanup.
- [ ] Tests cover behavior changes and regressions.
- [ ] `cargo fmt --all -- --check` passes when Rust changed.
- [ ] `cargo clippy --locked --workspace --all-targets -- -D warnings` passes when Rust changed.
- [ ] Relevant Rust, Python, and web tests pass.
- [ ] Generated web bundles are updated when their sources changed.
- [ ] No secrets, private repository data, or production logs are included.
