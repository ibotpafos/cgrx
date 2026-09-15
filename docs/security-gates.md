# Security Gates

CGRX `check_security_gates` — a snapshot-bound, model-free security audit gate.

## What it checks

| Component         | How it works |
|-------------------|--------------|
| **Secret detection** | Scans the git diff (staged + unstaged + untracked files) for private keys, API keys, hardcoded passwords, AWS credentials and generic long secret values using conservative pattern matching. Results are candidates — confirm with repository owner before rotation. |
| **Dependency audit**  | Inspects `Cargo.lock` for missing/empty versions and unknown packages against a curated allowlist of common safe crates. |
| **License checking**  | Reads a markdown license inventory (e.g. `licenses/dependencies.md`) and flags entries whose license is not in the allowlist. Supports SPDX OR/AND expressions. |

Any scan failure produces a **coverage gap** instead of silently passing, making the verdict **INCONCLUSIVE** and still blocking unless `fail_on=none`.

## MCP tool

```json
{
  "name": "check_security_gates",
  "inputSchema": {
    "type": "object",
    "properties": {
      "fail_on":              { "enum": ["error","warning","none"], "default": "error" },
      "max_secret_findings":       { "type": "integer", "minimum": 0, "maximum": 10000, "default": 0 },
      "max_dependency_findings":   { "type": "integer", "minimum": 0, "maximum": 10000, "default": 0 },
      "max_license_findings":      { "type": "integer", "minimum": 0, "maximum": 10000, "default": 0 },
      "allowlist_paths":           { "type": "array", "items": { "type": "string" } },
      "allowlist_licenses":        { "type": "array", "items": { "type": "string" } }
    }
  }
}
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| `fail_on` | Blocking threshold: `error` (default), `warning`, or `none`. |
| `max_secret_findings` | Maximum allowed secret candidates before the gate breaches (default 0). |
| `max_dependency_findings` | Maximum allowed dependency hygiene findings (default 0). |
| `max_license_findings` | Maximum allowed unapproved license findings (default 0). |
| `allowlist_paths` | Comma-separated glob prefixes — paths matching these are skipped during secret scanning. Useful for fixtures and test data. |
| `allowlist_licenses` | SPDX license identifiers allowed. Entries whose declared license is in this list are accepted; all others produce findings. |

### Output shape

The `structuredContent` contains:

- `verdict`: one of `PASS`, `WARN`, `FAIL`, `INCONCLUSIVE`.
- `would_block`: boolean indicating whether the CI gate should fail.
- `rules`: array of threshold checks with status `passed` / `breached`.
- `secret_findings`, `dependency_findings`, `license_findings`: detail arrays.
- `coverage_gaps`: scan failures that made the evidence partial.
- `agent_handoff`: schema-pinned handoff block for downstream automation.

### Limitations

- Secret detection is **pattern-based** and conservative — false positives are possible, especially with long string literals in test fixtures.
- Dependency audit uses local heuristics only — no network, no crates.io API.
- License checking relies on declared metadata in the inventory file; manual verification recommended for legal compliance.

## CLI usage

```bash
cgrx check-gates --gate security --fail-on error   --max-secret-findings 5   --allowlist-paths "fixtures,tests/data"   --allowlist-licenses "MIT,Apache-2.0,ISC,BSD-2-Clause"
```

Add `--format sarif` for SARIF 2.1.0 output suitable for CI integrations.

## Preset tiers

`check_security_gates` is included in **all three** preset tiers:

- **minimal** — lightweight CI fast-fail on secrets only
- **standard** — same tool available alongside orient/expand
- **full** — same tool alongside scan_risks, check_change_gates, etc.

## Design principles

- **Snapshot-bound**: result is deterministic for the same working tree state.
- **No LLM executed**: pure pattern + heuristic, never calls an AI model.
- **Coverage-gap honest**: if a scan component fails, the gate is INCONCLUSIVE rather than falsely passing.
- **Agent-handoff pinned**: output includes a schema version for downstream agents to parse.
