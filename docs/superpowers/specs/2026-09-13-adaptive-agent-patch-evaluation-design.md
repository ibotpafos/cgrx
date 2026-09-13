# Adaptive Agent Patch Evaluation Design

## Purpose

CGRX is primarily an optional tool for coding agents. Its value must therefore
be measured at the end of a coding task: whether the agent produces a correct
patch without regressions, rather than whether it can answer a relationship
question or whether it called the graph.

This design adds a reproducible paired evaluation over historical CGRX fixes.
The ordinary arm receives local shell and source access. The treatment arm has
the same capabilities plus CGRX MCP, but the prompt does not require its use.
Both arms use the same model, reasoning effort, buggy source snapshot, task
prompt, timeout, and hidden acceptance tests.

## First corpus

Version 1 contains six fixes from the public CGRX history:

1. preserve the Git index during metadata-only runtime reads;
2. retain proven impacts alongside unrelated dynamic-dispatch gaps;
3. resolve named exports of TypeScript const arrow functions conservatively;
4. limit Go receiver-field conflicts to direct struct members;
5. resolve explicit Rust crate-module aliases with namespace guards;
6. accept root and relative directory scopes without broadening unsafe forms.

Each task pins the buggy parent revision and reference-fix revision. The
contract lists production paths the agent may edit, hidden test paths introduced
or changed by the reference fix, an argv-form acceptance command, and a human
written problem statement. Repository aliases are resolved only through an
untracked local map.

These are frozen historical tasks, not a claim that they are unknown to a model
provider. Inspecting an evaluation failure does not authorize changing CGRX to
fit that task. Any product change inspired by a result requires a new training
case and a separate frozen evaluation task.

## Snapshot and hidden tests

The runner exports the buggy revision without Git history, documentation,
contracts, agent instructions, environment files, or symlinks. It creates a
single-commit repository so agents can inspect and edit normally but cannot
recover the reference fix from local history.

The hidden test patch is derived at runtime from the pinned reference commit and
the contract's test paths. It is never added to the model-visible repository.
After the agent finishes, the runner stages all changes, captures a binary Git
patch, and materializes a separate grading copy. It applies the agent patch,
then the hidden test patch, and executes the acceptance command there.

Before model runs, preflight proves that every hidden acceptance command fails
on the buggy revision and passes on the complete reference revision. A task is
invalid if the reference commit is not a direct child of the buggy revision,
the declared paths did not change, a path escapes the repository, or preflight
does not distinguish buggy and fixed behavior.

## Agent isolation and scoring

Codex runs with personal config, plugins, apps, hooks, skills, memories, web
search, and multi-agent features disabled. The sandbox permits workspace edits
and denies network access. The treatment starts CGRX as a required MCP server so
availability is known, while the task wording says to use it only when useful.

A run is correct only when:

- Codex completes successfully;
- the agent produces a non-empty patch;
- every changed path is in the task's production allowlist;
- the hidden acceptance command exits zero within its timeout.

Changing visible or hidden tests, manifests, documentation, or unrelated source
is therefore rejected even if tests pass. Exact equality with the historical
fix is not required; alternative correct implementations are accepted.

The result records terminal state, acceptance status, changed paths, patch
hash/size, input/output/cache tokens, elapsed agent time, all tool calls, and
actual CGRX calls. Raw events, patches, grading logs, and source copies remain in
the explicitly chosen local output directory and are never committed.

## Repetition and interpretation

The default comparison runs each task three times per arm and alternates arm
order by task and repetition. Summaries report correct runs, per-task success
rates, paired wins/losses/ties, token totals, latency distributions, policy
violations, failures, and treatment runs that actually called CGRX.

The first run is a diagnostic baseline. CGRX earns further investment only if
it raises patch success or prevents material regressions at a resource premium
we can justify. A tie does not prove value. A small six-task run is not a broad
model or language claim, and shared-host latency is not a controlled performance
measurement.

## Repository changes

- `contracts/agent_patch_tasks_v1.json` freezes the six task definitions.
- `scripts/eval_agent_patches.py` validates, preflights, runs, grades, and
  summarizes paired patch attempts.
- `scripts/test_eval_agent_patches.py` tests contract safety, hidden-test
  isolation, patch policy, grading, pairing, and incomplete-run handling.
- `docs/agent-patch-evaluation.md` documents commands and the measured first run.
- `.github/workflows/ci.yml` runs the harness unit tests without making model
  calls or requiring private mappings.

No MCP API or index format changes are part of this stage.
