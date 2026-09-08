# Validate the source installer on Linux

Labels: good first issue, installation, linux
Outcome: A fresh supported Linux environment can install the pinned CGRX release and complete the documented MCP initialization check.

## Why this matters

Linux is exercised in CI, but a contributor-facing source installation needs
clear evidence from a clean user environment.

## Scope

Run `install.sh` with `--source` on Ubuntu 24.04 or another agreed current Linux
distribution, record sanitized results, and fix only installer documentation or
one isolated installer defect discovered by the run. Likely files:
`install.sh`, `docs/installation.md`, and `scripts/test_install.py`.

Non-goals: binary distribution, native Windows, changing the Rust toolchain, or
redesigning the installer.

## Acceptance criteria

- A clean environment installs the pinned release without `sudo`.
- Checksum/tag selection and MCP initialization outcomes are recorded.
- Re-running the installer preserves or backs up an existing binary as documented.
- Any behavior change has a failing-before and passing-after installer test.
- Evidence contains no username, private path, token, or repository source.

## Verification

~~~sh
python3 -m unittest scripts.test_install -v
python3 scripts/doctor_cgrx.py --help
python3 scripts/validate_community.py
~~~

Maintainer help: ask on the published issue before expanding scope.
Availability: unclaimed draft; platform evidence is required before completion.
