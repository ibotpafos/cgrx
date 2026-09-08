# Add visible keyboard help to the graph explorer

Labels: good first issue, explorer, accessibility
Outcome: Keyboard users can discover the existing pan, selection, and reset controls without reading source code.

## Why this matters

The explorer supports keyboard interaction, but undiscoverable shortcuts make
the feature effectively unavailable to new users.

## Scope

Add a compact help affordance using the existing explorer styles and document
only shortcuts already implemented. Add or update DOM-level tests. Likely files:
`crates/cgrx-cli/web/app.js`, `crates/cgrx-cli/web/styles.css`, and
`crates/cgrx-cli/web/tests/`.

Non-goals: redesigning the explorer, introducing a component framework,
changing graph layout, or adding new keyboard behavior.

## Acceptance criteria

- Help is reachable and dismissible with keyboard alone.
- Text lists only shortcuts verified in current code.
- Focus remains visible and returns to the invoking control on close.
- Existing mouse and keyboard behavior remains unchanged.

## Verification

~~~sh
npm run typecheck:web
npm test
npm run verify:web-csp
~~~

Maintainer help: ask for confirmation of the smallest acceptable UI treatment.
Availability: unclaimed draft; include browser evidence in the pull request.
