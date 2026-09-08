# CGRX OSS contributor readiness design

## Outcome

Prepare CGRX for its first external contributors before broad promotion. A
developer who has not spoken with the maintainer must be able to understand the
project, install it, obtain one useful result, select an available task, and
submit a verifiable pull request.

The first audience is deliberately narrow: developers building AI coding
agents and maintainers of large Rust, Go, Java, TypeScript, Python, or polyglot
repositories who need local, evidence-backed change impact instead of another
hosted embedding index.

## Current baseline

As observed on 2026-09-09, the public repository has one star, no forks, no
open issues, one contributor, no topics, and no homepage. Its README is
technically detailed, but the contributor path is incomplete:

- `CONTRIBUTING.md` describes correctness expectations but not the full local
  setup, task-claiming, review, and pull-request flow.
- There is no code of conduct, public roadmap, governance note, issue template,
  or pull-request template.
- There is no visible `good first issue` or `help wanted` backlog.
- There is no primary public place for questions or design discussion.
- The opening README has no compact before/after proof that a visitor can
  reproduce in a few minutes.

GitHub reported 663 clones from 150 unique cloners and 56 views from one unique
visitor in the available 14-day window. These figures may include CI and other
automation and must not be treated as verified human adoption.

The Rust baseline is currently blocked before compilation because `Cargo.lock`
contains two `cgrx-metrics` package entries on `main` at merge `d935e4b`. Web
type-checking and web tests pass. The lockfile repair is a separate prerequisite
and is not part of this community-facing change.

## Positioning and primary action

The proposed public promise is:

> CGRX gives coding agents a local, evidence-backed map of what a change can
> affect, while keeping unknown relationships visibly unknown and keeping the
> repository on the developer's machine.

The repository will have one primary visitor action:

> Install CGRX and run the first evidence-backed query on your repository.

Starring, joining a chat, and contributing are secondary actions. The README
must not ask a developer to contribute before demonstrating personal utility.

## Contributor funnel

The designed path is:

1. **Discover:** a technical example, integration, or search result leads to
   the repository.
2. **Understand:** the opening screen names the problem, audience, privacy
   boundary, and supported languages.
3. **Activate:** a copyable quickstart produces a useful result in five minutes
   or less.
4. **Engage:** the developer can ask a question, report a missing relationship,
   or propose an improvement through a clearly routed GitHub surface.
5. **Contribute:** a prepared issue supplies scope, expected behavior,
   reproducer, likely files, verification commands, and maintainer support.
6. **Return:** the maintainer reviews promptly, credits the contributor, and
   suggests a sensible follow-up.

Each public asset must serve one of these transitions. Assets that do not move
a developer forward are excluded from the initial sprint.

## Repository changes

### 1. README opening

Keep the existing technical reference, but replace the opening experience with:

- one-sentence promise and explicit target audience;
- a compact diagram or terminal transcript showing a risky change, the proven
  relationships CGRX finds, and the coverage gap it refuses to guess;
- a five-minute quickstart with a single supported happy path;
- three concrete use cases: change impact, candidate tests, and bounded context
  for a coding agent;
- honest language-support and maturity links;
- primary installation CTA and secondary links to contributing and discussion.

Claims must be reproducible from a checked-in fixture or command. No benchmark
or superiority claim will be added without a linked method and captured result.

### 2. Contribution contract

Expand `CONTRIBUTING.md` into the complete contribution path:

- prerequisites and repository setup;
- focused and full verification commands;
- how to find and claim an issue;
- when an issue is required before a pull request;
- resolver-specific positive and ambiguity test requirements;
- mistake-ledger procedure;
- pull-request review expectations;
- maintainer response target of two business days;
- privacy and synthetic-reproducer rules;
- definition of a contribution that is ready for review.

The response target is a service expectation, not a promise that every pull
request will be merged or fully reviewed within two days.

### 3. Community health files

Add:

- `CODE_OF_CONDUCT.md` using Contributor Covenant 2.1 with a real private
  enforcement contact selected by the maintainer before merge;
- `.github/ISSUE_TEMPLATE/bug.yml`;
- `.github/ISSUE_TEMPLATE/missing-relationship.yml`;
- `.github/ISSUE_TEMPLATE/feature.yml`;
- `.github/ISSUE_TEMPLATE/config.yml` routing usage questions to GitHub
  Discussions once Discussions is enabled;
- `.github/pull_request_template.md`;
- `ROADMAP.md` describing current themes rather than speculative delivery
  dates;
- `GOVERNANCE.md` documenting the current maintainer-led model, decision
  process, path to triage/maintainer responsibility, and conflict handling.

Issue forms must request the CGRX version, platform, minimal synthetic fixture,
expected and actual relationship, coverage output, and relevant command. They
must warn against submitting credentials, production logs, private source, or
unredacted repository data.

### 4. Contribution backlog

Prepare 8–12 public GitHub issues before promotion. At least five must be
genuinely suitable for `good first issue`; the rest may use `help wanted`.

Every ready issue must contain:

- user-visible outcome;
- reason the work matters;
- bounded scope and explicit non-goals;
- minimal fixture or reproduction steps;
- likely files or subsystem;
- acceptance criteria;
- exact focused verification commands;
- maintainer available to answer questions;
- an unambiguous availability state.

Suitable initial categories are documentation examples, client presets,
installer validation, diagnostic messages, isolated language fixtures, and
small explorer accessibility improvements. Ambiguous resolver architecture,
cross-language dispatch, storage concurrency, and broad refactors are excluded
from beginner tasks.

GitHub issues are external mutations and will be drafted first. Publishing them,
enabling Discussions, and changing repository metadata require a separate
explicit approval after the repository files have been reviewed.

### 5. Discovery metadata

After approval, update the GitHub About panel with a focused description,
homepage or documentation link, and topics such as `code-intelligence`, `mcp`,
`coding-agents`, `static-analysis`, `code-graph`, `local-first`, `rust`, and
`developer-tools`.

The sprint will not create an empty Discord server. GitHub Discussions is the
initial community surface because it keeps questions adjacent to the code and
requires less moderation overhead.

## First-user validation

Before public promotion, recruit three developers who have not previously used
CGRX. Observe each participant attempting, without private setup instructions,
to:

1. explain what CGRX is for;
2. install or build it;
3. run the documented first query on a repository;
4. interpret proven relationships and coverage gaps;
5. locate a suitable contribution and explain how they would claim it.

Record completion, elapsed time, where assistance was required, and the exact
confusing text or failure. Repair repeated onboarding failures before launch.
The gate passes when all three obtain a useful result, and at least two can
identify and understand an available contribution without private guidance.

## Launch experiments

Only after the validation gate passes, run three attributable experiments:

1. a technical case study showing a concrete missed-impact failure and the CGRX
   evidence that exposes it;
2. targeted personal invitations to ten maintainers or agent developers to try
   one scenario, with no request for a star or contribution;
3. one public developer-channel launch, such as Show HN or a narrowly relevant
   community, centered on the reproducible example rather than an announcement.

Each experiment uses a distinguishable source link or launch window. Outreach
must be individual and relevant; mass messaging and reciprocal-star campaigns
are out of scope.

## Measurement

Measure a funnel rather than raw stars:

| Stage | Measure | Initial 30-day target |
| --- | --- | ---: |
| Discovery | Attributable unique visitors | baseline established |
| Activation | Confirmed external successful installs | 10 |
| Utility | External repositories with a useful result | 5 |
| Engagement | External discussions or issues | 5 |
| Contribution | First-time pull requests | 3 |
| Acceptance | Merged first-time pull requests | 2 |
| Retention | Contributors making a second contribution | 1 |
| Responsiveness | Median first maintainer response | under 2 business days |
| Time to value | Clone/install to first useful result | under 5 minutes |

Opt-in product telemetry may support aggregate activation measurement, but the
launch must also work with manual confirmations and GitHub evidence. Telemetry
must remain clearly optional and must not collect repository source.

## Review and trust boundaries

- New contributors never receive write or release permissions by default.
- Pull requests must use synthetic or public fixtures and pass the documented
  deterministic checks.
- AI-assisted contributions are welcome only when the submitter understands the
  change, supplies evidence, and responds to review.
- Security reports follow `SECURITY.md`, not public issues.
- Maintainer or triage permissions are earned through repeated, reviewed
  contributions and sound project judgment.
- Every benchmark and adoption claim distinguishes local tests, CI, public
  repository evidence, and confirmed external-user evidence.

## Delivery order

1. Repair or land the separate `Cargo.lock` baseline fix.
2. Implement the README opening and expanded contribution contract.
3. Add community health files and local validation for their required fields
   and links.
4. Draft the first issue backlog without publishing it.
5. Review repository changes and obtain approval for GitHub mutations.
6. Publish issues, enable Discussions, and update repository metadata.
7. Run the three-person onboarding test and repair blocking friction.
8. Run launch experiments and report the measured funnel after 30 days.

## Acceptance criteria for this sprint

The repository-readiness sprint is complete only when:

- all repository files above are reviewed and merged;
- current required build, test, lint, and documentation checks pass;
- at least eight contribution issues are published and at least five are
  accurately labeled `good first issue`;
- Discussions and repository metadata are live;
- the three-person first-user validation gate passes;
- measurement sources and a 30-day review date are recorded;
- remaining launch or external-user gates are explicitly reported rather than
  treated as complete through local evidence.

