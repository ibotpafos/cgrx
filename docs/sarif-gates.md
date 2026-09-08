# CGRX gates as SARIF and GitHub Action

`cgrx check-gates` runs `check_change_gates` (`--gate change`) or
`check_repository_gates` (`--gate repository`) against the managed index and
renders the result as JSON (default) or SARIF 2.1.0 (`--format sarif`). The
converter is a pure function over the gate `structuredContent` in
`crates/cgrx-mcp/src/sarif.rs`: no tests are executed, no LLM is invoked, and
no location is invented. Golden SARIF fixtures live in
`crates/cgrx-mcp/tests/sarif/` and are asserted by
`crates/cgrx-mcp/tests/sarif_golden.rs`.

## CLI

```sh
cgrx check-gates --root . --gate change --format sarif --output cgrx-change.sarif
cgrx check-gates --root . --gate repository --format sarif --output cgrx-repository.sarif \
  --max-package-cycles 0 --max-package-fan-out 20 --max-symbol-fan-in 50 \
  --max-unresolved-local-dependencies 0 --max-coverage-gaps 0
```

Flags mirror the MCP tool arguments, including defaults: `--limit` (1..50,
default 20), `--package-depth` (1..4, default 2), `--fail-on`
(`error`/`warning`/`none`, default `error`), and per-rule thresholds
(`--max-warning-findings`, `--max-blocked-missions`,
`--max-unverified-impacts`, `--max-package-cycles`, `--max-package-fan-out`
default 20, `--max-symbol-fan-in` default 50,
`--max-unresolved-local-dependencies`, `--max-coverage-gaps`). Change-gate
thresholds accept 0..10000, repository-gate thresholds 0..1000000.
`--output -` (default) writes to stdout, otherwise to the given file.

Exit status is CI-oriented: the rendered report is always written first; when
the gate `would_block`, the command exits 2 with
`<tool> verdict <VERDICT> would block (fail_on=...)` on stderr. Use
`--fail-on none` for an advisory run that always exits 0.

## SARIF mapping

- `version` is `2.1.0` with the standard `$schema`; the driver is `cgrx` with
  one rule descriptor per gate rule (`cgrx/<rule>`, `defaultConfiguration`
  from the rule severity) plus `cgrx/gate-verdict` for the overall outcome.
- Verdict to level: `PASS` to `note`, `WARN` to `warning`, `FAIL` to `error`,
  `INCONCLUSIVE` to `warning`. `INCONCLUSIVE` means the evidence was partial:
  it stays blocking unless `fail_on` is `none`, so it surfaces as a warning,
  never as a silent pass. Every SARIF run carries exactly one
  `cgrx/gate-verdict` summary result; a `PASS` run carries only that note.
- Each breached rule adds one result whose level follows the rule severity
  (`error` to `error`, `warning` to `warning`) with
  `value`/`threshold` in the message.
- When `max_coverage_gaps` is breached, every coverage gap that names a
  repository path adds one result under that rule with a `physicalLocation`
  (`artifactLocation.uri` is the repo-relative path from the gate). Gaps
  without a path (for example `TRAVERSAL_TRUNCATED`) are covered by the
  breached-rule result and add no separate entry.
- Regions: parser-error spans are byte offsets in the gate JSON. The CLI
  resolves them to 1-based `startLine`/`endLine` by reading the file under
  `--root`; when the file is unreadable or an offset is out of range, the
  region falls back to spec-valid `byteOffset`/`byteLength`. Dynamic-dispatch
  locations are opaque `path:span` strings whose span units are not
  machine-readable here, so they contribute a path but no region. Nothing is
  ever defaulted to line 1.
- Run `properties` record `cgrxGate`, `cgrxAlgorithm`, `cgrxVerdict`,
  `cgrxWouldBlock`, `cgrxFailOn`, `cgrxPartial`, and `llmUsed: false`.

## GitHub Action

`.github/workflows/cgrx-gates.yml.example` is a reusable workflow
(`workflow_call`) that builds `cgrx`, runs both gates with SARIF output,
uploads the reports with `upload-sarif`, and fails the job exactly when a
gate `would_block`. Copy it to `.github/workflows/cgrx-gates.yml` and call
it from your CI workflow, or inline its steps. SARIF upload steps use
`if: always()` so blocking verdicts still produce code-scanning alerts; the
reports are written before the command exits nonzero, which is what makes
that ordering safe.
