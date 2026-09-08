# Add a minimal generic MCP client example

Labels: good first issue, documentation, mcp
Outcome: A developer can start CGRX over stdio, list tools, and make one repository-scoped request without using a specific agent client.

## Why this matters

A protocol-level example separates CGRX behavior from Codex, OpenCode, or other
client configuration problems.

## Scope

Add one small Python standard-library example or extend the existing smoke
client to demonstrate initialization, tool listing, and one safe read-only
request. Document invocation. Likely files: `scripts/smoke_mcp.py`, a focused
test under `scripts/`, and `docs/installation.md`.

Non-goals: publishing an SDK, async abstractions, network transports, or a
general-purpose interactive client.

## Acceptance criteria

- The example uses JSON-RPC over stdio and accepts an absolute repository path.
- It checks process failure and protocol error responses.
- It prints no source body unless explicitly requested.
- A focused test covers framing or response validation.

## Verification

~~~sh
python3 -m unittest discover -s scripts -p 'test_*.py'
python3 scripts/smoke_mcp.py target/release/cgrx
python3 scripts/validate_community.py
~~~

Maintainer help: ask for the current MCP protocol fixture before implementation.
Availability: unclaimed draft; release binary build is required for the smoke.
