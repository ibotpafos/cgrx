# Contributing

Open an issue with a minimal synthetic reproducer, expected/actual result,
version, platform and coverage status. Do not upload private repositories,
credentials or production logs.

Resolver changes need positive and ambiguity/false-positive tests.
Retain source-span evidence and coverage gaps; never replace unknown targets
with coincidentally matching names. Run all checks listed in README.

Every observed engine mistake (a wrong edge or a missed edge) becomes a
permanent case in `contracts/mistake_ledger_v1.json`: scaffold it with
`python3 scripts/report_mistake.py --help`, paste the skeleton into a PR, and
include the reproducer plus coverage status. Validate with
`python3 scripts/validate_ledger.py`; warn-only scoring runs via
`python3 scripts/eval_mistake_ledger.py target/release/cgrx --warn-only`.

Contributions are submitted under MIT unless explicitly stated otherwise
and agreed before merging.
