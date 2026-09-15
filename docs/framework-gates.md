# Framework Gates

CGRX detects framework usage inside an indexed repository and evaluates a
deterministic, model-free gate. The gate recognizes Django, FastAPI, and
Express from frozen positive/negative pattern sets and reports an explicit
verdict with no LLM and no network access.

## Why

AI coding agents routinely generate code inside web frameworks (Django,
FastAPI, Express). When a change lands inside one of these frameworks the agent
should pause and confirm the framework contract (routing, ORM, middleware) is
preserved, exactly as it does for package cycles or coverage gaps. Framework
Gates give every agent the same conservative, snapshot-bound signal instead of
guessing from naming.

## Tool

`check_framework_gates` (MCP tool and `cgrx check-gates --gate framework`)

| Argument | Type | Default | Meaning |
| --- | --- | --- | --- |
| `paths` | string[] | required* | Exact repo-relative file paths to scope. |
| `scopes` | string[] | required* | Glob/bounded scopes to scope. |
| `fail_on` | `error` / `warning` / `none` | `error` | Blocking policy. |
| `max_framework_confidence` | integer 0..10000 | `0` | Max tolerated framework confidence (0 = no framework tolerated). |
| `max_false_positive_matches` | integer 0..10000 | `0` | Max tolerated false-positive guards (0 = zero tolerance). |

* At least one of `paths` / `scopes` is required.

### Verdicts

The gate computes two rules and folds them into one verdict:

- `PASS` - no error-severity rule breached and evidence is complete.
- `WARN` - only a warning-severity rule breached.
- `FAIL` - an error-severity rule breached.
- `INCONCLUSIVE` - evidence is partial (snapshot truncated); stays blocking
  unless `fail_on` is `none`.

`would_block` follows `fail_on`: with `fail_on=error` a warning alone does
not block, but an `INCONCLUSIVE` verdict always blocks (partial evidence is
never a silent pass).

### Detection

Detection scans only `SYNTAX`-provenance documents inside scope:

- **Django / FastAPI** (`.py`): route decorators (`@app.get`, `@router.post`,
  `@bp.*`), URL patterns (`path(...)`), ORM access (`.objects.*`),
  `models.Model` subclasses, and framework imports.
- **Express** (`.ts/.tsx/.js/.jsx/.mjs/.cjs`): `express` imports,
  `app.use` / `router.use` middleware, route methods, built-in middleware,
  and `express()` app creation.

Each positive match is accompanied by false-positive guards - patterns that look
like the framework but are plain code (`def get(` without a decorator,
`http.createServer` without express). Guards lower confidence; they do not by
themselves confirm or deny a framework, which keeps the verdict conservative.

Confidence is `HIGH` (>=3 positives, no guards), `MEDIUM` (>=1 positive, no
guards), `LOW` (more positives than guards), or `NONE`.

## Frozen contract

`contracts/framework_gates_v1.json` pins the algorithm
(`framework_detection_gate_v1`), `llm_used: false`, and the positive/
negative pattern sets. The patterns are deterministic: detection never calls a
model and never reaches the network. Editing the contract without also updating
the unit tests is a breaking change.

## Tests

The detection and gate logic is covered by frozen positive and false-positive
tests in `crates/cgrx-cli/src/runtime/frameworks.rs`:

- Positive: Django route decorators, FastAPI routes, Express middleware+routes
  are detected with `DETECTED` verdict.
- False-positive: plain Python `def get`/`class Model` and plain
  `http.createServer` without express stay `ABSENT`; guards lower confidence
  rather than flip the verdict.
- Gate: no framework -> `PASS`; framework detected under a zero threshold ->
  `WARN`; false-positive guards exceeding the threshold -> `FAIL`.

## Bounds and limitations

- Purely structural: pattern-based, not semantic confirmation of correctness.
- Scoped to indexed `SYNTAX` documents; unindexed or truncated snapshots
  yield `INCONCLUSIVE` rather than `PASS`.
- `INCONCLUSIVE` is distinct from `PASS` and remains blocking unless
  `fail_on` is `none`.
