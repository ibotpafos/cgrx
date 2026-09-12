# Agent evaluation for GPT-6 Astra

`scripts/eval_agent_tasks.py` runs the same read-only task with ordinary local
tools and with CGRX MCP available. The default model is `gpt-6-astra`; `--model`
permits a separate run with another explicitly selected model. There is no
automatic model fallback.

The first selection contains 20 previously curated tasks: seven CGRX, six private
corpus A, and seven private corpus B tasks, including references, imports and two
ambiguity cases. Published identifiers preserve the repository's corpus aliases.
This is an **exploratory discovery benchmark**, not heldout evidence, patch
correctness, or a claim of superiority. Exact file/site hints make many cases
easy for direct source reading. Future multi-file bug fixes need independently
curated acceptance tests and repetitions before measuring coding outcomes.

## Run

Use a recent official Codex CLI supporting `--ignore-user-config`,
`--ephemeral` and `--output-schema`. The unrelated npm executable named
`codex` is not sufficient. A signed-in CLI is required; no API key is embedded.
The runner uses [Codex non-interactive execution](https://learn.chatgpt.com/docs/non-interactive-mode).

```sh
python3 scripts/eval_agent_tasks.py --repo-map /private/repo-map.json --output /tmp/agent-validation
python3 scripts/eval_agent_tasks.py --run \
  --codex /absolute/path/to/codex --cgrx /absolute/path/to/cgrx \
  --model gpt-6-astra --effort medium --timeout 120 \
  --repo-map /private/repo-map.json \
  --output /absolute/private/output-directory
```

The validation command makes no model calls. `--limit 1` runs a pilot when
combined with `--run`. The output directory must not exist, preventing accidental
overwrite of evidence. The historical source repositories referenced by
`contracts/real_tasks_v1.json` must be available locally with their Git objects.
Public clones without those private fixtures cannot run this selection. Supply
`--repo-map` with a private JSON object mapping `/private/cgrx-corpus/cgrx`,
`/private/cgrx-corpus/corpus-a`, and `/private/cgrx-corpus/corpus-b` to their actual
local Git repositories. Never commit that mapping. Overrides change only local
locations; committed source and span hashes must still match exactly.

Each task uses a fresh source copy at its curated revision. Oracle file and span
hashes are verified against committed blobs. Answer manifests, documentation,
local reports, environment files, agent instructions and symlinks are excluded from model-visible
copies; exclusions and the resulting source digest are recorded. Both arms use
the same read-only source copy, checked for changes after each arm. CGRX index
startup is included in elapsed time. OS/provider cache state is uncontrolled,
so order alternates and a single repetition is not a significance test.
The initial exploratory run shared the host with development/build activity;
its wall times are diagnostics, not controlled performance acceptance.
Retained archive files are force-added to the snapshot inventory, including
files matching local/global ignore rules. Ignore rules must not hide source
mutations from the integrity check. The initial collections used an earlier
exclusion/inventory policy recorded with those runs; their retained files are
also checked independently against the original Git archive after collection.

Personal config, plugins, apps, hooks, skill entries, memory and web search are
disabled by explicit CLI configuration. Both arms retain ordinary shell reading.
Only the treatment adds CGRX MCP. The task asks the model to stay in the source
copy; the read-only sandbox is not an independent filesystem read-isolation
boundary. Raw tool transcripts permit auditing this constraint.

Both arms use the same model, effort and hard wall-clock timeout. Token usage is
measured, **not hard-capped**. `model_requested` records the requested identifier;
the CLI event stream does not attest an immutable provider model snapshot.
`protocol.json` records executable hashes and corpus/selection hashes. No package
installation, external messages, deployments or source edits are requested.

## Results and limits

`summary.json` aggregates only complete pairs and separately lists failed runs.
Each arm preserves its answer, terminal status, elapsed time, token usage, tool
counts and observed CGRX calls. Unknown usage stays unknown. Correctness requires
the exact target declaration path/name and relation, or a justified unresolved
target matching the curated oracle. Explanation quality still needs manual
review. An incorrect answer is a completed, incorrect run; a failed process or
timeout is incomplete and never a correct empty answer.

For a Go package import, a directory is also accepted when the validated target
span is an actual `package NAME` declaration. The representative source file is
evidence of a package, not the package's identity. This scorer correction was
made after the first run and is disclosed separately from its frozen raw scores.

Raw answers, logs and frozen private sources stay in the chosen local output
directory. Do not commit them to the public repository. A passing harness test
does not establish model quality, saved tokens, or successful code changes.

## First actionable finding

The initial pilot returned the correct target in both arms. Ordinary reading took
11.86 s and 22,308 input tokens; CGRX-assisted reading took 34.04 s and 72,108 input
tokens. This one task is diagnostic only. The coverage tool returned about 150 KB
for one file despite `limit=2`: exact-path results ignored pagination while scope
results already respected it.

Exact-path coverage now applies `offset`/`limit`, preserves the full `gap_count`
and `partial` status, and exposes `returned`, `has_more`, and `next_offset` in
both structured and compact output. Exhausting a page never makes a partially
indexed file clean. The embedded discovery skill now permits direct reading of
an already-known source span and small coverage pages. Neither change alters
the requirement to verify evidence actually derived from the graph.

A real MCP invocation on the pilot source snapshot with `limit=2` returned
1,284 bytes after this fix, retaining `gap_count=1674`, `returned=2`,
`has_more=true`, and `next_offset=2`. This measures response size, not an
end-task model improvement.

The first local base had unrelated build/watch integration failures. This branch
was subsequently rebased onto current `origin/main`; those temporary prerequisite
repairs are not part of this change.

A patched-model pilot returned the right answer but did not call CGRX, so its
timing is not evidence of the patch's benefit. A separate explicit Astra tool
smoke did call the patched coverage endpoint and correctly reported the total,
page size and continuation flag. Tool availability/configuration and actual
tool use must be distinguished when interpreting the paired run.

The initial 20-pair diagnostic run completed without process failures. Frozen
exact-file scoring gave 19/20 for both arms; source review found the remaining
case was a correct Go package-directory answer. Source-validated package
identity scoring gives 20/20 for both. Baseline input/output totals were
621,610 / 3,588 tokens; configured-CGRX totals were 1,359,618 / 7,122. CGRX was
actually called in 12 of 20 configured runs. This did not establish a quality
gain. The separate Codex `memories` feature was not explicitly disabled in this
first collection (no memory-file access appeared in recorded commands), so it
is retained only as diagnostic evidence. A corrected run disables that feature
and external memory import explicitly, as well as skill search.
