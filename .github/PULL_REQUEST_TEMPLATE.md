## Summary

Describe the user-visible or engineering outcome and why this change is needed.

## Changes

- 

## Risk and compatibility

Describe compatibility impact, migrations, security-sensitive behavior, generated artifacts, and known limitations.

## Verification

List the exact commands, tests, benchmarks, or manual checks run.

## Evidence and coverage

For resolver or graph changes, include positive evidence, ambiguity/false-positive controls, source spans, and any remaining coverage gaps.

## Checklist

- [ ] The change is scoped and does not silently broaden evidence claims.
- [ ] Tests cover the changed behavior and important negative cases.
- [ ] `cargo fmt --all -- --check` and relevant lint/test commands pass.
- [ ] Generated web assets were rebuilt when their sources changed.
- [ ] Documentation, contracts, release notes, and third-party notices were updated when required.
- [ ] No credentials, private repositories, production logs, or sensitive local paths were committed.
