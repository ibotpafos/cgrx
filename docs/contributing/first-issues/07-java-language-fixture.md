# Add one bounded Java relationship fixture

Labels: help wanted, language-java
Outcome: One agreed Java receiver-resolution shape gains positive, ambiguity, and source-span coverage in the public benchmark.

## Why this matters

Java method names repeat heavily across types, so positive evidence without an
ambiguity control can hide false edges.

## Scope

Add one minimal fixture for an already supported declared or constructor-bound
receiver shape plus a competing type with the same method name. Update the
expected contract. Likely files: Java benchmark fixtures,
`contracts/relationship_cases_v1.json`, and focused language tests.

Non-goals: inheritance-wide dispatch, reflection, dependency classpaths,
framework injection, or a resolver rewrite.

## Acceptance criteria

- The intended receiver edge resolves to the exact type and method.
- The competing same-name method does not receive an edge.
- Source spans and coverage status are asserted.
- Existing Java and cross-language contract scores do not regress.

## Verification

~~~sh
cargo test --locked -p cgrx-languages
python3 scripts/eval_relationships.py target/release/cgrx
python3 scripts/validate_community.py
~~~

Maintainer help: agree on the receiver shape and fixture location first.
Availability: unclaimed draft.
