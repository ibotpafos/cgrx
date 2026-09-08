# Contributing to CGRX

Thank you for improving CGRX. Contributions may be code, synthetic regression
fixtures, documentation, platform validation, bug reports, or design feedback.
Small, evidence-backed changes are easier to review than broad rewrites.

By participating, you agree to follow [our code of conduct](CODE_OF_CONDUCT.md).
Contributions are submitted under the MIT license unless explicitly agreed
otherwise before work begins.

## Prerequisites

- Git;
- Rust 1.89.0 with `rustfmt` and `clippy`;
- Python 3;
- Node.js and npm;
- a C compiler for Tree-sitter dependencies.

The alpha uses Unix APIs. macOS is locally verified and Linux is exercised in
CI; native Windows is not currently supported.

## Setup

Fork the repository, then prepare a local checkout:

~~~sh
git clone https://github.com/<your-user>/cgrx.git
cd cgrx
git remote add upstream https://github.com/ibotpafos/cgrx.git
rustup toolchain install 1.89.0 --profile minimal --component clippy,rustfmt
npm ci
cargo build --locked
~~~

Create a focused branch from current upstream `main`. Do not mix unrelated
cleanup into the same pull request.

## Choosing and claiming work

Look for [`good first issue`](https://github.com/ibotpafos/cgrx/labels/good%20first%20issue)
or [`help wanted`](https://github.com/ibotpafos/cgrx/labels/help%20wanted).
Comment with your intended approach and wait for a maintainer to confirm that
the issue is available before investing in a large change. If you stop working,
leave a comment so somebody else can continue.

Open an issue before a pull request when behavior, public schemas, architecture,
dependencies, or more than one subsystem would change. Typo fixes and other
obviously local corrections may go directly to a pull request.

Usage questions and early ideas belong in
[GitHub Discussions](https://github.com/ibotpafos/cgrx/discussions). Security
reports follow [SECURITY.md](SECURITY.md), never a public issue.

## Verification

Run the smallest relevant check while developing, then the complete applicable
group before requesting review.

Documentation and community files:

~~~sh
python3 -m unittest scripts.test_validate_community -v
python3 scripts/validate_community.py
~~~

Web explorer changes:

~~~sh
npm run typecheck:web
npm test
npm run verify:web-csp
~~~

Rust changes:

~~~sh
cargo fmt --all -- --check
cargo clippy --locked --workspace --all-targets -- -D warnings
cargo test --locked --workspace
~~~

MCP and relationship changes also require the release build and relevant
evaluators documented in the README. Report literal commands and results in the
pull request. A focused local test is not evidence that CI or another platform
passed.

## Resolver changes

Resolver changes require both a positive test and an ambiguity or
false-positive control. Retain source-span evidence and coverage gaps. Never
replace an unknown target with a coincidentally matching name.

Every observed wrong or missed edge becomes a permanent case in
`contracts/mistake_ledger_v1.json`. Generate a skeleton and validate it with:

~~~sh
python3 scripts/report_mistake.py --help
python3 scripts/validate_ledger.py
python3 scripts/eval_mistake_ledger.py target/release/cgrx --warn-only
~~~

## Pull requests

A review-ready pull request has:

- one bounded outcome and a linked issue when required;
- a minimal synthetic or public reproducer and explicit non-goals;
- tests that fail without the change and pass with it when behavior changes;
- coverage status and unresolved gaps;
- exact verification commands and results;
- updated public documentation when a contract changes;
- disclosure of material AI assistance and confirmation that the submitter
  understands and can support the change.

Keep commits reviewable and use imperative commit subjects. Maintainers may ask
for a smaller pull request when independent changes are combined.

## Review expectations

The maintainer target is a first response within **two business days**. That
response may be a review, a request for evidence, a scope correction, or a note
that more time is needed; it is not a promise to merge or complete review within
two days.

Reviews evaluate correctness, precision, privacy, determinism, compatibility,
and maintenance cost—not the amount of code produced. Accepted contributors are
credited in the pull request and release notes where applicable.

## Privacy

Use the smallest synthetic fixture that reproduces the behavior. Do not submit
credentials, production logs, private source, private repositories, customer
data, local indexes, or unredacted repository data. Inspect generated files and
screenshots before attaching them.

If a report cannot be safely reduced to public synthetic evidence, use the
private route in [SECURITY.md](SECURITY.md).
