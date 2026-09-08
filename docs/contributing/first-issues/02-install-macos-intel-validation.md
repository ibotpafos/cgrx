# Validate the source installer on Intel macOS

Labels: good first issue, installation, macos
Outcome: A fresh Intel macOS environment can build and install the pinned CGRX release through the documented source fallback.

## Why this matters

The published binary targets Apple Silicon; Intel macOS users follow a separate
source-build path that needs independent evidence.

## Scope

Exercise `install.sh` on Intel macOS, record sanitized command outcomes, and fix
only incorrect platform detection, source fallback behavior, or related
documentation. Likely files: `install.sh`, `docs/installation.md`, and
`scripts/test_install.py`.

Non-goals: producing or signing a new binary, universal binaries, notarization,
or changing release infrastructure.

## Acceptance criteria

- Intel macOS selects the documented source path rather than the arm64 archive.
- The installed executable completes its initialization check.
- Reinstallation behavior matches the backup documentation.
- Any defect is protected by a failing-before and passing-after test.
- Captured evidence contains no private paths, credentials, or source.

## Verification

~~~sh
python3 -m unittest scripts.test_install -v
file "$HOME/.local/bin/cgrx"
"$HOME/.local/bin/cgrx" --help
~~~

Maintainer help: ask on the published issue before changing release behavior.
Availability: unclaimed draft; physical Intel macOS evidence is required.
