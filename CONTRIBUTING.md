# Contributing

CGRX treats code-intelligence output as evidence. Changes must preserve that
property: unresolved or ambiguous relationships stay explicit instead of being
silently converted into guessed edges.

## Before opening a change

Open an issue for behavior changes with a minimal synthetic reproducer,
expected/actual result, CGRX version or commit, platform, and coverage status.
Do not upload private repositories, credentials, production logs, or sensitive
local paths.

Keep pull requests bounded. Separate mechanical cleanup from semantic resolver
changes when practical, and call out compatibility, persistence, protocol, or
generated-artifact impact in the PR description.

## Toolchains

The repository pins Rust in `rust-toolchain.toml`. The web workspace requires
the Node.js major declared in `package.json`.

~~~sh
rustc --version
node --version
npm ci
~~~

Do not weaken or bypass pinned versions to make a local environment pass.

## Required checks

Run the checks relevant to the files you changed. Before requesting review,
the default expectation is:

~~~sh
git diff --check
cargo fmt --all -- --check
cargo clippy --locked --workspace --all-targets -- -D warnings
cargo test --locked --workspace --no-fail-fast

npm ci
npm run typecheck:web
npm run build:web
git diff --exit-code -- crates/cgrx-cli/web/app.js crates/cgrx-cli/web/layout-worker.bundle.js
npm run build:web-vendor
git diff --exit-code -- crates/cgrx-cli/web/vendor/
npm run verify:web-csp
npm test

python3 -m unittest discover -s scripts -p 'test_validate_*.py'
~~~

The full GitHub Actions matrix remains authoritative for platform-specific and
integration coverage.

## Resolver and graph changes

Resolver changes need positive and ambiguity/false-positive tests. Retain exact
source-span evidence and coverage gaps; never replace unknown targets with
coincidentally matching names.

Every observed engine mistake (a wrong edge or a missed edge) becomes a
permanent case in `contracts/mistake_ledger_v1.json`: scaffold it with
`python3 scripts/report_mistake.py --help`, paste the skeleton into a PR, and
include the reproducer plus coverage status. Validate with
`python3 scripts/validate_ledger.py`; warn-only scoring runs via
`python3 scripts/eval_mistake_ledger.py target/release/cgrx --warn-only`.

When a language or relationship claim changes, update the corresponding
contract only with reviewed evidence. Do not relax a threshold merely to make a
new result pass.

## Generated web assets

The built explorer assets are committed because the Rust binary embeds them.
When web sources change, rebuild both first-party and vendor bundles and commit
the resulting deterministic files. CI rejects source/bundle drift.

Do not hand-edit:

- `crates/cgrx-cli/web/app.js`
- `crates/cgrx-cli/web/layout-worker.bundle.js`
- `crates/cgrx-cli/web/vendor/*.js`

## Commits and pull requests

Use focused, imperative commit subjects. The repository convention is compatible
with Conventional Commits, for example `fix(cli): ...`, `refactor(runtime): ...`,
`test(web): ...`, and `docs: ...`.

A PR should state:

- the problem and intended outcome;
- the main implementation choices;
- risk and compatibility considerations;
- exact verification commands and results;
- evidence/coverage implications for resolver or graph behavior;
- known follow-ups that are intentionally outside the change.

Contributions are submitted under MIT unless explicitly stated otherwise and
agreed before merging.
