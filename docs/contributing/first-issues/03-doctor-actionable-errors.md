# Make one CGRX doctor failure actionable

Labels: help wanted, diagnostics
Outcome: One currently vague doctor failure names the failing check, observed state, and a safe next command.

## Why this matters

A first-time user cannot distinguish a missing binary, stale client config, and
an MCP initialization problem from a generic failure.

## Scope

Choose one existing diagnostic branch in `scripts/doctor_cgrx.py`, agree on the
message in the issue, add a focused test, and implement the smallest message or
exit-status correction. Likely files: `scripts/doctor_cgrx.py` and
`scripts/test_doctor_cgrx.py`.

Non-goals: a new diagnostics framework, automatic configuration edits, network
checks, or changes to unrelated doctor branches.

## Acceptance criteria

- A focused test reproduces the old ambiguous result.
- The new result states check, observed failure, and one safe next action.
- Output does not reveal full private paths or configuration contents.
- Existing doctor tests continue to pass.

## Verification

~~~sh
python3 -m unittest scripts.test_doctor_cgrx -v
python3 scripts/doctor_cgrx.py --help
python3 scripts/validate_community.py
~~~

Maintainer help: the maintainer will help select one bounded diagnostic branch.
Availability: unclaimed draft.
