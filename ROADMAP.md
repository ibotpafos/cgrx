# CGRX Roadmap

This roadmap describes current themes, not delivery promises. Priorities may
change when real repository evidence exposes a more important correctness,
privacy, or usability problem. Proposed work should begin with a GitHub issue or
Discussion and a reproducible outcome.

## Trustworthy relationship coverage

- deepen proven resolution for supported Rust, Go, Java, TypeScript/JavaScript,
  TSX, and Python constructs;
- preserve fail-closed behavior for ambiguous targets;
- turn every confirmed wrong or missed edge into a permanent synthetic case;
- make coverage gaps easier for agents and humans to interpret.

## Fast local feedback

- keep working-tree indexes fresh without blocking stable-generation reads;
- reduce first-result and refresh latency on representative repositories;
- keep runtime networking optional and repository data local.

## Agent-ready evidence

- improve bounded impact, candidate-test, and change-mission responses;
- make snapshot identity and stale evidence visible;
- measure precision, recall, latency, and model-visible response cost using
  reproducible contracts.

## Contributor experience

- validate installers and client integrations across supported Unix platforms;
- maintain genuinely bounded beginner issues;
- shorten the path from a missing-edge report to a regression case;
- recognize repeat contributors and grow trusted triage capacity.

## How priorities are decided

Correctness and privacy regressions come first, followed by failures observed on
real user tasks, onboarding blockers, supported-language gaps, and measured
performance problems. Popularity alone does not turn a speculative feature into
a commitment.

See [GOVERNANCE.md](GOVERNANCE.md) for decisions and roles, and open a
[Discussion](https://github.com/ibotpafos/cgrx/discussions) to propose a new
theme or substantial change.
