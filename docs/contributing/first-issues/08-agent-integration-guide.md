# Add an agent integration troubleshooting guide

Labels: good first issue, documentation, integrations
Outcome: Users can distinguish server startup, client registration, restart, repository path, and stale-index failures using public commands.

## Why this matters

Client setup failures currently look similar even though they occur at different
boundaries and require different next actions.

## Scope

Add a troubleshooting decision table to `docs/installation.md` covering Codex
and OpenCode with observed symptom, safe check, expected result, and next step.
Cross-check commands against existing installers and doctor behavior.

Non-goals: changing client configuration automatically, supporting unlisted
clients, adding telemetry, or modifying the MCP protocol.

## Acceptance criteria

- The table covers executable missing, MCP server not registered, client not
  restarted, invalid absolute repository root, and stale index cases.
- Every command is copyable and does not print secrets or private source.
- Claims distinguish local process checks from a successful MCP request.
- Existing installation tests and community validation pass.

## Verification

~~~sh
python3 -m unittest scripts.test_install scripts.test_doctor_cgrx -v
python3 scripts/validate_community.py
git diff --check
~~~

Maintainer help: ask when a client-specific symptom is not reproducible.
Availability: unclaimed draft.
