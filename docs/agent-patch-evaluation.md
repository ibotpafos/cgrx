# Optional CGRX patch evaluation

`scripts/eval_agent_patches.py` measures whether adding CGRX to a coding agent
changes the correctness of completed source patches. CGRX use is optional: the
treatment agent sees the MCP server and chooses whether it is useful. The
baseline agent receives the same source, task, model, effort, timeout, shell,
and workspace access without graph tools.

This is an end-task evaluation. A run succeeds only when the agent completes,
changes at least one allowed production file, changes no disallowed path, and
passes a hidden acceptance command. Tool calls, model-visible tokens, agent
latency, patch size, policy violations, and actual CGRX calls are recorded as
diagnostics; none substitutes for patch correctness.

## Frozen tasks

The version-1 contract contains six historical CGRX fixes spanning Git index
safety, risk propagation, TypeScript export identity, Go receiver precision,
Rust module aliases, and directory-scope boundaries. Each record pins a buggy
revision, its direct reference-fix child, editable production paths, hidden test
paths, and an argv-form acceptance command.

The model receives a history-free archive of the buggy revision. Contracts,
documentation, agent instructions, environment files, personal configuration,
skills, memories, web search, and the reference commit are not visible. Hidden
test changes are derived from the reference commit and applied only to a
separate grading copy after the model finishes.

Before any model call, preflight requires the hidden test command to fail on the
buggy revision and pass on the complete reference revision. The model's patch
does not need to match the historical patch; a different implementation passes
if it respects the path policy and satisfies the hidden tests.

These are frozen historical tasks, not proof that a provider has never seen the
public commits. They exercise real CGRX failures but do not establish broad
model, repository, or language superiority. Once a model failure is inspected,
that task must not be used to tune CGRX and then presented as heldout evidence.

## Commands

Validate task lineage, paths, and commands without running tests or models:

```sh
python3 scripts/eval_agent_patches.py \
  --repo-map <repo-map.json> \
  --output <new-validation-directory>
```

Validate all hidden acceptance tests without model calls:

```sh
python3 scripts/eval_agent_patches.py \
  --repo-map <repo-map.json> \
  --output <new-preflight-directory> \
  --preflight
```

Run a one-task, one-repetition pilot:

```sh
python3 scripts/eval_agent_patches.py \
  --repo-map <repo-map.json> \
  --output <new-pilot-directory> \
  --codex <official-codex-cli> \
  --cgrx <cgrx-binary> \
  --model gpt-6-astra --effort medium \
  --timeout 600 --test-timeout 600 \
  --limit 1 --repetitions 1 --run
```

Remove `--limit 1` and `--repetitions 1` for the default six-task,
three-repetition comparison. Repeating the exact command with the same output
directory resumes missing attempts only after every protocol field and content
hash matches. A different runner, selection, mapping, executable, model, effort,
timeout, repetition count, or task set is rejected.

The repository map is a private JSON object from the committed alias
`/private/cgrx-corpus/cgrx` to a local clone. Keep it and the output directory
outside the repository. Raw source copies, model events, stderr, patches,
acceptance logs, and grading caches remain local.

## Repetition and interpretation

The default is three attempts per task and arm. Order alternates by task and
repetition. The summary reports per-task success rates, baseline wins, CGRX
wins, ties, incomplete runs, resource totals, and treatment runs that actually
called CGRX. Incorrect completed patches remain valid measurements; timeouts or
malformed sessions are incomplete and excluded from the correctness
denominator.

Wall time includes agent tool activity and cold CGRX startup on a shared host.
It is useful for finding large regressions but is not a controlled latency
benchmark. Cached input is reported separately, and token totals are not a
dollar-cost estimate. A tie is not evidence that CGRX helps.

## First diagnostic collection

The first six-task, three-repetition comparison will be recorded here after the
preflight and pilot protocols complete. Until then, this document defines the
method and makes no patch-quality claim.
