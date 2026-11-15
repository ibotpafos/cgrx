# CGRX gates as SARIF and GitHub Action

`cgrx check-gates` runs change, repository, framework or security gates against the managed index and
renders the result as JSON (default) or SARIF 2.1.0 (`--format sarif`). The
converter is a pure function over the gate `structuredContent` in
`crates/cgrx-mcp/src/sarif.rs`: no tests are executed, no LLM is invoked, and
no location is invented. Golden SARIF fixtures live in
`crates/cgrx-mcp/tests/sarif/` and are asserted by
`crates/cgrx-mcp/tests/sarif_golden.rs`.

## CLI

```sh
CGRX_GATE_REPORT_DIR="$(mktemp -d)"
cgrx check-gates --root . --gate change --format sarif --output "$CGRX_GATE_REPORT_DIR/cgrx-change.sarif"
cgrx check-gates --root . --gate repository --format sarif --output "$CGRX_GATE_REPORT_DIR/cgrx-repository.sarif" \
  --max-package-cycles 0 --max-package-fan-out 20 --max-symbol-fan-in 50 \
  --max-unresolved-local-dependencies 0 --max-coverage-gaps 0
cgrx check-gates --root . --gate security --format sarif --output "$CGRX_GATE_REPORT_DIR/cgrx-security.sarif"
cgrx check-gates --root . --gate framework --scopes 'src/**' --format sarif --output "$CGRX_GATE_REPORT_DIR/cgrx-framework.sarif"
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
  one deterministically ordered descriptor per gate rule (`cgrx/<rule>`, `defaultConfiguration`
  from the rule severity) plus `cgrx/gate-verdict` for the overall outcome.
- Verdict to level: `PASS` to `note`, `WARN` to `warning`, `FAIL` to `error`,
  `INCONCLUSIVE` to `warning`. `INCONCLUSIVE` means the evidence was partial:
  it stays blocking unless `fail_on` is `none`, so it surfaces as a warning,
  never as a silent pass. Every SARIF run carries exactly one
  `cgrx/gate-verdict` summary result; a `PASS` run carries only that note.
- Each breached rule adds one result whose level follows the rule severity
  (`error` to `error`, `warning` to `warning`) with
  `value`/`threshold` in the message.
- Partial evidence and breached `max_coverage_gaps` rules include individual
  coverage-gap warnings. Gates with no coverage threshold declare the separate
  `cgrx/coverage-gap` rule. Pathless gaps, including `TRAVERSAL_TRUNCATED`, retain
  their warning and evidence without a source location.
- Locations contain only repository-relative paths. Absolute paths, parent
  traversal and control characters produce no location and never reach the
  source resolver. Filenames are URI-escaped, preserving spaces, `%`, `#` and
  other reserved characters. Machine-readable evidence remains in result properties;
  arbitrary scan-error details and source text are omitted because parser errors
  can contain credentials from the offending source line.
- Regions: parser-error spans are byte offsets in the gate JSON. The CLI
  resolves them to 1-based `startLine`/`endLine` by reading the file under
  `--root`; when the file is unreadable or an offset is out of range, the
  region falls back to spec-valid `byteOffset`/`byteLength`. Dynamic-dispatch
  locations are opaque `path:span` strings whose span units are not
  machine-readable here, so they contribute a path but no region. Nothing is
  ever defaulted to line 1. Parser spans have an exclusive end: the resolved
  end line belongs to the last covered byte, avoiding an extra line at a
  newline boundary.
- Breached security rules also export their bounded secret, dependency and
  license findings. Secret candidates retain their detector rule and exact
  supplied line, without exporting source text or credential values. Dependency
  and license records retain package metadata without invented source locations.
- Run `properties` record `cgrxGate`, `cgrxAlgorithm`, `cgrxVerdict`,
  `cgrxWouldBlock`, `cgrxFailOn`, `cgrxPartial`, `cgrxSnapshot`,
  `cgrxCoverageGapCount`, `cgrxAgentHandoff`, and `llmUsed: false`.
  Each result preserves its evidence in `properties.cgrxEvidence` and carries a
  stable BLAKE3 `partialFingerprints.cgrxEvidence/v1` digest namespaced by gate,
  rule and evidence identity. Rule descriptors and findings have deterministic
  order, so repeated exports of one snapshot produce identical JSON.

The adapter consumes the actual gate `verdict`, `rules`, `partial`, and policy
fields from raw structured content or an MCP `structuredContent` envelope.
Malformed reports, inconsistent rule thresholds, and verdicts that disagree
with their evidence return an error. They cannot turn into an empty successful
SARIF report. Golden fixtures cover all four verdicts, and real CLI integration
tests check blocking exit status, exact locations and secret redaction.

## GitHub Action

`.github/workflows/cgrx-gates.yml.example` is a reusable workflow
(`workflow_call`) that builds `cgrx`, runs both gates with SARIF output,
uploads the reports with `upload-sarif`, and a blocking gate verdict fails the job.
Copy it to `.github/workflows/cgrx-gates.yml` and call
it from your CI workflow, or inline its steps. SARIF upload steps use
`if: always()` so blocking verdicts still produce code-scanning alerts; the
reports are written before the command exits nonzero, which is what makes
that ordering safe.

Both gates run after a successful build, even when the change gate blocks.
Upload steps require an existing report, so an indexing or startup error does
not trigger an upload of a missing file. Workflow inputs are passed through
environment variables and quoted CLI arguments.

The workflow writes SARIF into `RUNNER_TEMP`, outside the analyzed working tree.
Writing an untracked report into the repository before the next gate would
change its snapshot and add an unsupported-file coverage gap.

The change gate compares uncommitted working-tree changes with HEAD. A clean
checkout does not review a pull request's committed base-to-head diff. Use it
after local or generated changes; the repository gate evaluates the checked-out
architecture snapshot. Historical-range change analysis is a separate feature.
