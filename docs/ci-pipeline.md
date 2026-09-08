# CGRX CI Pipeline

GitHub Actions workflow and CLI command for running CGRX quality gates in CI.

## Overview

The CGRX CI pipeline runs three categories of checks on every PR:

1. **Format** — `cargo fmt --all -- --check`
2. **Clippy** — `cargo clippy --locked --workspace --all-targets -- -D warnings`
3. **Test** — `cargo test --locked --workspace`
4. **Quality Gates** — `check_change_gates` and `check_repository_gates` via `cgrx ci`

The quality gates job runs after the basic checks pass, using the release binary.

## GitHub Action Workflow

`.github/workflows/cgrx-ci.yml` defines the CI pipeline:

- **Triggers**: PRs to `main`, pushes to `main`, tags `v*`
- **Concurrency**: cancels in-progress runs for the same ref
- **Matrix**: `ubuntu-latest` and `macos-latest` for clippy/test/gates

### Jobs

| Job | Description |
|-----|-------------|
| `fmt` | Format check |
| `clippy` | Clippy with `-D warnings` |
| `test` | Workspace tests |
| `gates` | Quality gates (needs fmt, clippy, test) |

## CLI Command

```bash
cgrx ci --repo <path> [--format github|human] [--gate change|repository|both] [thresholds]
```

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--repo <path>` | Repository path (required) | — |
| `--format <fmt>` | Output format (`github` or `human`) | `human` |
| `--gate <gate>` | Which gates to run (`change`, `repository`, `both`) | `both` |
| `--fail-on <level>` | Fail level (`error`, `warning`, `none`) | `error` |

### Threshold Flags (Change Gates)

| Flag | Default |
|------|---------|
| `--max-warning-findings` | 0 |
| `--max-blocked-missions` | 0 |
| `--max-coverage-gaps` | 0 |
| `--max-unverified-impacts` | 0 |

### Threshold Flags (Repository Gates)

| Flag | Default |
|------|---------|
| `--max-package-cycles` | 0 |
| `--max-package-fan-out` | 20 |
| `--max-symbol-fan-in` | 50 |
| `--max-unresolved-local-dependencies` | 0 |
| `--repository-max-coverage-gaps` | 0 |

### Examples

```bash
# Run all gates with human-readable output
cgrx ci --repo . --format human

# Run only change gates with GitHub Actions output
cgrx ci --repo . --format github --gate change

# Run with custom thresholds
cgrx ci --repo . --max-coverage-gaps 10 --max-package-fan-out 30
```

## GitHub Actions Output Format

When `--format github` is used, the command emits `::notice::` messages for each gate result and `::error::` if any gate fails. This integrates natively with GitHub Actions annotations.

## Exit Codes

- `0`: All gates passed
- `1`: At least one gate would block (and `fail_on` level triggered)

## Testing

Unit tests for the `ci` module are in `crates/cgrx-cli/src/ci.rs`:

```bash
cargo test -p cgrx-cli --bin cgrx ci::
```

Integration tests use the real binary against temporary repositories (see `tests/cli.rs`).

## Architecture

The `ci` module:

1. Opens a managed runtime for the repository
2. Creates an MCP server with `RuntimeMcpBackend::managed`
3. Calls `scan_risks` then `check_change_gates` (for change gates)
4. Calls `get_architecture` then `check_repository_gates` (for repository gates)
5. Reports results in the requested format

The implementation reuses the existing MCP tool infrastructure — no separate gate logic is duplicated.
