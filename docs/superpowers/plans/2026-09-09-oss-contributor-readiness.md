# CGRX OSS Contributor Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a developer unfamiliar with CGRX a complete, safe path from the repository landing page to a reproducible first result and a review-ready first contribution.

**Architecture:** Treat the repository as a staged contributor funnel. A small deterministic Python validator protects the public contract, while README, community-health files, and locally stored issue drafts implement the discover, activate, engage, and contribute stages without publishing external GitHub state prematurely.

**Tech Stack:** Markdown, GitHub issue forms YAML, Python 3 standard library, existing npm and Cargo checks.

**Spec:** `docs/superpowers/specs/2026-09-09-oss-contributor-readiness-design.md`

## Global Constraints

- The first audience is developers building AI coding agents and maintainers of large Rust, Go, Java, TypeScript, Python, or polyglot repositories.
- The primary visitor action is: install CGRX and run the first evidence-backed query on your repository.
- Claims must be reproducible from a checked-in fixture or command.
- Maintainer first-response target is two business days, not a merge promise.
- Issue forms must prohibit credentials, production logs, private source, and unredacted repository data.
- GitHub issues remain local drafts until a separate explicit approval to publish them.
- Enabling Discussions and changing repository metadata also require separate explicit approval.
- The existing duplicate `cgrx-metrics` entry in `Cargo.lock` is a separate baseline gate and must not be changed in this branch.

---

### Task 1: Community contract validator

**Files:**
- Create: `scripts/validate_community.py`
- Create: `scripts/test_validate_community.py`

**Interfaces:**
- Consumes: repository root resolved from `Path(__file__).parents[1]`.
- Produces: `validate(root: Path) -> list[str]`, where an empty list means the repository community contract passes; CLI exit `0` on pass and `1` with one diagnostic per failure.

- [ ] **Step 1: Write failing validator tests**

Use `unittest` and a temporary repository fixture. Cover missing required files, forbidden placeholders, absent privacy warning, fewer than eight first-issue drafts, fewer than five `good first issue` drafts, missing acceptance/verification sections, and one complete passing fixture.

- [ ] **Step 2: Verify the tests fail before implementation**

Run: `python3 -m unittest scripts.test_validate_community -v`

Expected: FAIL because `scripts.validate_community` does not exist.

- [ ] **Step 3: Implement the validator**

Validate these required paths:

```python
REQUIRED_FILES = (
    "README.md",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "ROADMAP.md",
    "GOVERNANCE.md",
    ".github/ISSUE_TEMPLATE/bug.yml",
    ".github/ISSUE_TEMPLATE/missing-relationship.yml",
    ".github/ISSUE_TEMPLATE/feature.yml",
    ".github/ISSUE_TEMPLATE/config.yml",
    ".github/pull_request_template.md",
    "docs/contributing/first-issues/README.md",
)
```

Reject `TBD`, `TODO`, `FIXME`, and `example@example.com` in community files.
Require every issue draft to contain YAML-like metadata lines `Labels:`,
`Outcome:`, and headings `## Why this matters`, `## Scope`,
`## Acceptance criteria`, and `## Verification`. Count at least eight drafts
excluding their README and at least five whose `Labels:` contains
`good first issue`.

- [ ] **Step 4: Verify unit tests pass**

Run: `python3 -m unittest scripts.test_validate_community -v`

Expected: all validator tests PASS.

- [ ] **Step 5: Run validator against the incomplete repository**

Run: `python3 scripts/validate_community.py`

Expected: exit `1`, listing community files and drafts still to be created.

- [ ] **Step 6: Commit the validator**

```bash
git add scripts/validate_community.py scripts/test_validate_community.py
git commit -m "test: define community readiness contract"
```

### Task 2: README activation path

**Files:**
- Modify: `README.md:1-45`
- Test: `scripts/test_validate_community.py`

**Interfaces:**
- Consumes: existing `install.sh`, `cgrx index`, `cgrx serve`, MCP tool names, and `docs/installation.md`.
- Produces: landing-page sections with stable markers `Who CGRX is for`, `See the difference`, and `First useful result` for validator assertions.

- [ ] **Step 1: Add failing README contract assertions**

Extend the passing-fixture test and real-repository validation to require the
three section names, the privacy phrase `stays on your machine`, and links to
`CONTRIBUTING.md` and GitHub Discussions.

- [ ] **Step 2: Verify the focused test fails**

Run: `python3 -m unittest scripts.test_validate_community.CommunityValidationTests.test_real_repository -v`

Expected: FAIL with missing README activation markers.

- [ ] **Step 3: Rewrite the README opening**

Keep the detailed reference below it. Add:

- the approved one-sentence promise;
- the explicit audience;
- a compact before/after terminal example using commands already supported by
  the repository;
- a first-use path targeting five minutes;
- three use cases: change impact, candidate tests, and bounded agent context;
- primary install CTA and secondary contribution/discussion links;
- an honest note linking to language coverage and maturity sections.

- [ ] **Step 4: Verify README and link contract**

Run: `python3 -m unittest scripts.test_validate_community -v`

Expected: README assertions PASS; remaining missing community files continue to
fail only in the real-repository aggregate.

- [ ] **Step 5: Commit README changes**

```bash
git add README.md scripts/test_validate_community.py scripts/validate_community.py
git commit -m "docs: add five-minute CGRX activation path"
```

### Task 3: Contribution, conduct, roadmap, and governance

**Files:**
- Modify: `CONTRIBUTING.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `ROADMAP.md`
- Create: `GOVERNANCE.md`
- Test: `scripts/test_validate_community.py`

**Interfaces:**
- Consumes: test commands already documented in README and the existing
  mistake-ledger workflow.
- Produces: a contributor contract, behavior policy, current theme roadmap, and
  maintainer-led governance model.

- [ ] **Step 1: Add failing document-content tests**

Require contribution headings for prerequisites, setup, choosing and claiming
work, verification, pull requests, review expectations, privacy, and resolver
changes. Require governance to contain `two business days`, `triage`, and
`maintainer`. Require the code of conduct to name Contributor Covenant 2.1 and
the existing private security contact from `SECURITY.md` rather than a
placeholder.

- [ ] **Step 2: Verify focused tests fail**

Run: `python3 -m unittest scripts.test_validate_community -v`

Expected: FAIL for the four incomplete or missing documents.

- [ ] **Step 3: Expand the contribution guide**

Document prerequisites, setup, focused and full checks, task claiming, when an
issue is required, resolver and mistake-ledger evidence, PR readiness, the
two-business-day first-response target, and privacy rules.

- [ ] **Step 4: Add behavior, roadmap, and governance documents**

Use Contributor Covenant 2.1 with the existing private security reporting
contact. Describe roadmap themes without speculative dates. State that the
project is currently maintainer-led and document how repeated contributors can
earn triage and maintainer responsibilities.

- [ ] **Step 5: Verify the document contract**

Run: `python3 -m unittest scripts.test_validate_community -v`

Expected: document-content assertions PASS.

- [ ] **Step 6: Commit the contributor contract**

```bash
git add CONTRIBUTING.md CODE_OF_CONDUCT.md ROADMAP.md GOVERNANCE.md scripts/test_validate_community.py scripts/validate_community.py
git commit -m "docs: establish CGRX contribution contract"
```

### Task 4: GitHub issue and pull-request routing

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug.yml`
- Create: `.github/ISSUE_TEMPLATE/missing-relationship.yml`
- Create: `.github/ISSUE_TEMPLATE/feature.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/pull_request_template.md`
- Test: `scripts/test_validate_community.py`

**Interfaces:**
- Consumes: GitHub issue-form schema and repository Discussions URL.
- Produces: structured bug, missing-relationship, and feature intake; private
  security and usage-question routing; PR evidence checklist.

- [ ] **Step 1: Add failing template assertions**

Parse YAML files using a minimal text contract without adding a YAML dependency.
Require `name`, `description`, `body`, version, platform, reproducer, expected,
actual, coverage, and privacy-warning markers where relevant. Require the PR
template to mention linked issue, synthetic reproducer, coverage status,
verification commands/results, privacy, and AI assistance disclosure.

- [ ] **Step 2: Verify template tests fail**

Run: `python3 -m unittest scripts.test_validate_community -v`

Expected: FAIL because templates are absent.

- [ ] **Step 3: Create issue forms and routing config**

Set blank issues to disabled. Route questions to
`https://github.com/ibotpafos/cgrx/discussions` and security reports to
`SECURITY.md`. Include explicit acknowledgement that private repository source,
credentials, and production logs must not be submitted.

- [ ] **Step 4: Create the pull-request template**

Require outcome, linked issue, scope, evidence, tests, coverage gaps, privacy,
AI-assistance disclosure, and rollback notes when relevant.

- [ ] **Step 5: Verify all template tests pass**

Run: `python3 -m unittest scripts.test_validate_community -v`

Expected: template assertions PASS.

- [ ] **Step 6: Commit GitHub templates**

```bash
git add .github scripts/test_validate_community.py scripts/validate_community.py
git commit -m "docs: add structured contributor intake"
```

### Task 5: Draft the first contribution backlog

**Files:**
- Create: `docs/contributing/first-issues/README.md`
- Create: `docs/contributing/first-issues/01-install-linux-validation.md`
- Create: `docs/contributing/first-issues/02-install-macos-intel-validation.md`
- Create: `docs/contributing/first-issues/03-doctor-actionable-errors.md`
- Create: `docs/contributing/first-issues/04-mcp-client-example.md`
- Create: `docs/contributing/first-issues/05-python-language-fixture.md`
- Create: `docs/contributing/first-issues/06-explorer-keyboard-help.md`
- Create: `docs/contributing/first-issues/07-java-language-fixture.md`
- Create: `docs/contributing/first-issues/08-agent-integration-guide.md`
- Test: `scripts/test_validate_community.py`

**Interfaces:**
- Consumes: issue-draft schema enforced by `validate_community.py`.
- Produces: eight publishable local drafts; issues 1, 2, 4, 5, 6, and 8 carry
  `good first issue`, while 3 and 7 carry `help wanted`.

- [ ] **Step 1: Verify backlog-count tests fail**

Run: `python3 -m unittest scripts.test_validate_community -v`

Expected: FAIL for fewer than eight drafts and fewer than five beginner tasks.

- [ ] **Step 2: Create the backlog index**

Explain that files are drafts, name the publication approval gate, list all
eight titles and labels, and document the claim/release convention.

- [ ] **Step 3: Write eight complete issue drafts**

Each draft must include `Labels:`, `Outcome:`, why the work matters, bounded
scope and non-goals, likely files, acceptance criteria, exact focused checks,
maintainer help, and availability. Use only tasks that can be verified against
the current repository; flag platform-specific checks as requiring evidence on
that platform.

- [ ] **Step 4: Verify the full community contract passes**

Run: `python3 scripts/validate_community.py`

Expected: `community readiness contract: PASS` and exit `0`.

- [ ] **Step 5: Commit the draft backlog**

```bash
git add docs/contributing/first-issues scripts/test_validate_community.py scripts/validate_community.py
git commit -m "docs: draft first external contribution backlog"
```

### Task 6: Repository verification and handoff

**Files:**
- Modify: `docs/superpowers/plans/2026-09-09-oss-contributor-readiness.md`
- No production or GitHub settings changes.

**Interfaces:**
- Consumes: all readiness files and existing project test commands.
- Produces: a reviewed local candidate plus an explicit list of baseline and
  external gates.

- [ ] **Step 1: Run readiness and Python tests**

```bash
python3 -m unittest scripts.test_validate_community -v
python3 scripts/validate_community.py
python3 -m unittest discover -s scripts -p 'test_*.py'
```

Expected: all community checks and existing Python tests PASS.

- [ ] **Step 2: Run web checks**

```bash
npm run typecheck:web
npm test
npm run verify:web-csp
```

Expected: all commands exit `0`.

- [ ] **Step 3: Recheck Rust baseline without altering the lockfile**

```bash
cargo build --locked
cargo test --locked --workspace
```

Expected until the separate baseline fix lands: both fail before compilation
with `package cgrx-metrics is specified twice in the lockfile`. If upstream is
fixed, both must pass before completion.

- [ ] **Step 4: Check repository diff quality**

```bash
git diff --check main...HEAD
git status --short
```

Expected: no whitespace errors and no unintended generated files.

- [ ] **Step 5: Review against the design and update Linear**

Record the branch, commits, literal verification results, independent review
status, duplicate-lockfile gate, and the still-unapproved GitHub mutations.

- [ ] **Step 6: Stop at the external mutation gate**

Present the local diff for review. Do not enable Discussions, edit GitHub About,
or publish issue drafts until the user explicitly approves those exact actions.

### Task 7: Approved GitHub activation

**Files:**
- Consume: `docs/contributing/first-issues/*.md`
- No repository source files modified.

**Interfaces:**
- Consumes: the reviewed local candidate and a new explicit user approval for
  the named GitHub mutations.
- Produces: enabled Discussions, focused About metadata and topics, and eight
  public contribution issues with verified labels and links.

- [ ] **Step 1: Obtain explicit mutation approval**

Present the exact description, homepage, topic set, Discussions change, issue
titles, labels, and bodies. Stop unless the user approves this reviewed set.

- [ ] **Step 2: Enable Discussions and set discovery metadata**

Set the approved description and homepage. Add the approved topics including
`code-intelligence`, `mcp`, `coding-agents`, `static-analysis`, `code-graph`,
`local-first`, `rust`, and `developer-tools`. Verify the live repository values
through the GitHub API.

- [ ] **Step 3: Publish and label the issue backlog**

Create exactly the eight reviewed drafts. Apply `good first issue` to drafts
1, 2, 4, 5, 6, and 8; apply `help wanted` to drafts 3 and 7; apply any additional
area labels already approved in the drafts.

- [ ] **Step 4: Verify the live contributor surface**

Fetch the public About metadata, Discussions state, open issues, and labels.
Confirm eight issue URLs, at least five open `good first issue` tasks, working
question/security links, and no accidental publication of private data.

- [ ] **Step 5: Record external evidence in Linear**

Post the live URLs, timestamps, verified counts, and any remaining launch gate.

### Task 8: First-user validation and launch measurement

**Files:**
- Create after approval: `docs/contributing/onboarding-study.md`

**Interfaces:**
- Consumes: the live contributor surface and three developers who have not used
  CGRX.
- Produces: anonymized task outcomes, elapsed times, observed friction, fixes,
  activation decision, and a dated 30-day funnel review.

- [ ] **Step 1: Prepare the observation sheet**

Record only participant code, platform, whether they could explain CGRX,
install outcome, first useful result, correct interpretation of coverage gaps,
task-selection outcome, elapsed time, and assistance required. Do not record
repository source or personal data.

- [ ] **Step 2: Run the three-person onboarding study**

Each participant follows public documentation without private setup steps.
Capture the exact public text or command at every point where assistance is
required.

- [ ] **Step 3: Repair repeated blocking friction**

Convert each repeated failure into a bounded change with its own failing check,
implementation, verification, and review. Re-run the affected step with a new
participant or a clean environment.

- [ ] **Step 4: Evaluate the launch gate**

Pass only when all three participants obtain a useful result and at least two
can identify and explain an available contribution without private guidance.

- [ ] **Step 5: Run three attributable launch experiments**

Publish the approved technical case study, send ten individual trial
invitations, and run one approved public developer-channel launch. Keep source
links or distinct launch windows for attribution.

- [ ] **Step 6: Report the 30-day funnel**

Report attributable visitors, confirmed installs, repositories with a useful
result, discussions/issues, first-time pull requests, merged first-time pull
requests, repeat contributors, median first response time, and median time to
first useful result. Separate GitHub observations, optional telemetry, and
manual confirmations.
