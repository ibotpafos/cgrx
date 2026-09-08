# Add one bounded Python relationship fixture

Labels: good first issue, language-python
Outcome: One agreed Python call shape is represented by positive and same-name negative controls in the public relationship contract.

## Why this matters

Small synthetic fixtures improve coverage without asking a contributor to
understand or rewrite the resolver.

## Scope

Choose one currently supported but underrepresented Python call shape, add a
minimal fixture with a competing same-name symbol, and update the frozen
relationship expectation. Likely files: `contracts/relationship_cases_v1.json`
and the fixture paths referenced by that contract.

Non-goals: changing resolver algorithms, dynamic dispatch, decorators, runtime
monkey patching, or broad language support claims.

## Acceptance criteria

- The fixture contains one expected edge and one plausible same-name non-edge.
- Expected source spans and identities are explicit.
- Index coverage for every fixture file is recorded during verification.
- Existing relationship thresholds remain unchanged and pass.

## Verification

~~~sh
python3 scripts/eval_relationships.py target/release/cgrx
cargo test --locked --workspace
python3 scripts/validate_community.py
~~~

Maintainer help: the maintainer must approve the exact call shape before work.
Availability: unclaimed draft.
