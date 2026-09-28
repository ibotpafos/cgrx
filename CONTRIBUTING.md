# Contributing

Thanks for improving CGRX. Keep changes small enough to review and preserve the
project's evidence-first behavior.

## Before opening a pull request

Open an issue for behavior changes with a minimal synthetic reproducer,
expected/actual result, CGRX version, platform, and coverage status. Do not
upload private repositories, credentials, production logs, or proprietary
source.

Resolver changes need positive and ambiguity/false-positive tests. Retain
source-span evidence and coverage gaps; never replace unknown targets with
coincidentally matching names.

Every observed engine mistake (a wrong edge or a missed edge) becomes a
permanent case in `contracts/mistake_ledger_v1.json`. Scaffold it with:

```sh
python3 scripts/report_mistake.py --help
```

Paste the generated skeleton into the pull request, include the reproducer and
coverage status, then validate it with:

```sh
python3 scripts/validate_ledger.py
python3 scripts/eval_mistake_ledger.py target/release/cgrx --warn-only
```

## Local validation

Use the pinned toolchains from `rust-toolchain.toml` and `package.json`.

```sh
cargo fmt --all -- --check
cargo clippy --locked --workspace --all-targets -- -D warnings
cargo test --locked --workspace --no-fail-fast
cargo build --locked --release -p cgrx-cli

npm ci
npm run typecheck:web
npm run build:web-vendor
git diff --exit-code -- crates/cgrx-cli/web/vendor/
npm run verify:web-csp
npm test

python3 -m unittest discover -s scripts -p 'test_validate_*.py'
```

Run the integration/evaluator commands from `.github/workflows/ci.yml` when a
change affects indexing, MCP behavior, graph resolution, refactor suggestions,
or quality gates.

## Pull request hygiene

- Keep generated web bundles in sync with their TypeScript sources.
- Do not mix unrelated refactors and behavior changes in the same commit.
- Explain user-visible behavior changes and compatibility risks.
- Add or update tests before removing legacy behavior.
- Keep dependency updates pinned through the repository lockfiles.
- Prefer squash merging for a clean main-branch history.

Contributions are submitted under MIT unless explicitly stated otherwise and
agreed before merging.
