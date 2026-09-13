# Adaptive Agent Patch Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and run a paired, repeated coding-agent benchmark that measures whether optional CGRX improves correct multi-file patches.

**Architecture:** A Python standard-library runner materializes a history-free buggy Git snapshot, runs ordinary and CGRX-enabled Codex arms, captures each agent patch, applies hidden tests in a separate grading copy, and aggregates end-task outcomes. A committed six-task contract contains only revision, path, prompt, and command metadata; raw source, model logs, and local repository mappings stay outside Git.

**Tech Stack:** Python 3 standard library, Git, Codex CLI, CGRX MCP, Cargo/Rust test commands, JSON contracts.

**Spec:** `docs/superpowers/specs/2026-09-13-adaptive-agent-patch-evaluation-design.md`

## Global Constraints

- CGRX use is optional for the treatment agent; required MCP startup proves availability only.
- The same model, effort, timeout, buggy snapshot, prompt, and hidden tests apply to both arms.
- A patch passes only with allowed production-path changes and a successful hidden acceptance command.
- Model-visible snapshots contain no reference commit, hidden test patch, contracts, evaluation code, personal config, memory, skills, web access, or symlinks.
- The default run uses three repetitions and preserves every failure and incomplete attempt.
- Raw evaluation artifacts and repository mappings are local and uncommitted.

---

### Task 1: Contract validation and hidden acceptance preflight

**Files:**
- Create: `scripts/eval_agent_patches.py`
- Create: `scripts/test_eval_agent_patches.py`

**Interfaces:**
- Consumes: a version-1 selection JSON and optional repository-alias map.
- Produces: `load_tasks(selection: Path, repo_map: Path | None) -> list[dict]`, `hidden_test_patch(task: dict) -> bytes`, and `preflight(task: dict, timeout: int, cache_root: Path) -> dict`.

- [x] **Step 1: Write failing validation tests**

Add tests named `test_load_tasks_rejects_non_direct_fix`,
`test_load_tasks_rejects_unsafe_and_unchanged_paths`, and
`test_hidden_test_patch_contains_only_declared_tests`. Build tiny temporary Git
repositories with one buggy and one fixed commit; assert unsafe paths, a fix with
the wrong parent, and unchanged declared paths raise `ValueError`.

- [x] **Step 2: Run validation tests and verify RED**

Run: `python3 -m unittest scripts.test_eval_agent_patches.ContractTests -v`
Expected: import failure because `eval_agent_patches` does not exist.

- [x] **Step 3: Implement strict task loading and patch derivation**

Implement path validation with `Path.is_absolute()` and `".." in path.parts`;
resolve aliases only through the supplied map; require
`git rev-list --parents -n 1 FIX` to equal `FIX BUGGY`; require every allowed and
hidden-test path to appear in `git diff --name-only BUGGY FIX`; derive the hidden
patch with `git diff --binary BUGGY FIX -- <hidden paths>`.

- [x] **Step 4: Add and pass preflight behavior tests**

Create `test_preflight_requires_buggy_failure_and_reference_success` using a
temporary Python project whose hidden unittest fails on the buggy commit and
passes on the fixed commit. Assert preflight records the two exit codes and
rejects fail/fail and pass/pass fixtures.

- [x] **Step 5: Run focused tests**

Run: `python3 -m unittest scripts.test_eval_agent_patches.ContractTests scripts.test_eval_agent_patches.PreflightTests -v`
Expected: all tests pass.

- [x] **Step 6: Commit the independently useful validator**

Run: `git add scripts/eval_agent_patches.py scripts/test_eval_agent_patches.py && git commit -m "test(eval): Validate historical patch tasks"`

### Task 2: Paired agent execution and isolated grading

**Files:**
- Modify: `scripts/eval_agent_patches.py`
- Modify: `scripts/test_eval_agent_patches.py`

**Interfaces:**
- Consumes: validated task dictionaries and the same Codex/model/effort settings for both arms.
- Produces: `agent_command(...) -> list[str]`, `collect_patch(repo: Path) -> tuple[bytes, list[str]]`, `grade_patch(task: dict, patch: bytes, directory: Path, timeout: int, cache_root: Path) -> dict`, and `run_one(...) -> dict`.

- [x] **Step 1: Write failing command and patch-policy tests**

Add `test_command_disables_personal_state_and_only_treatment_adds_cgrx`,
`test_collect_patch_includes_untracked_files`, and
`test_grade_rejects_disallowed_paths_before_tests`. Assert workspace-write,
disabled web/memory/skills, required treatment MCP startup, exact changed-path
capture, and no acceptance subprocess on a policy violation.

- [x] **Step 2: Run the new tests and verify RED**

Run: `python3 -m unittest scripts.test_eval_agent_patches.ExecutionTests -v`
Expected: failures for missing execution functions.

- [x] **Step 3: Implement minimal execution and grading**

Run Codex with a JSON summary schema and a workspace-write sandbox. Stage all
agent changes, generate `git diff --cached --binary HEAD`, reject empty or
out-of-policy patches, materialize a fresh buggy grading copy, apply the agent
patch and hidden test patch with `git apply`, and execute argv-form commands with
network proxy variables removed and a task-specific `CARGO_TARGET_DIR`.

- [x] **Step 4: Test alternative valid patches and hidden-test isolation**

Add `test_grade_accepts_alternative_patch_that_passes_hidden_test` and
`test_model_snapshot_does_not_contain_hidden_test`. The former must use a patch
different from the reference fix; the latter must assert the model snapshot
lacks the hidden test file before grading.

- [x] **Step 5: Run all harness tests**

Run: `python3 -m unittest scripts.test_eval_agent_patches -v`
Expected: all tests pass.

- [x] **Step 6: Commit execution and grading**

Run: `git add scripts/eval_agent_patches.py scripts/test_eval_agent_patches.py && git commit -m "feat(eval): Grade optional CGRX patch attempts"`

### Task 3: Repetitions, summaries, and frozen six-task corpus

**Files:**
- Create: `contracts/agent_patch_tasks_v1.json`
- Modify: `scripts/eval_agent_patches.py`
- Modify: `scripts/test_eval_agent_patches.py`

**Interfaces:**
- Consumes: per-run records with task, repetition, arm, correctness, usage, latency, tool calls, CGRX calls, and grading status.
- Produces: `summarize(records: list[dict], repetitions: int) -> dict` and resumable `result.json`, `summary.json`, `protocol.json`, patch, event, and grading artifacts under the output directory.

- [x] **Step 1: Write failing summary tests**

Add `test_summary_reports_per_task_rates_and_paired_outcomes`,
`test_summary_keeps_incomplete_runs_out_of_correctness_denominator`, and
`test_existing_output_resumes_only_matching_protocol`. Cover one baseline win,
one CGRX win, one tie, unknown token usage, and a protocol-hash mismatch.

- [x] **Step 2: Run summary tests and verify RED**

Run: `python3 -m unittest scripts.test_eval_agent_patches.SummaryTests -v`
Expected: failures for missing repetition and resume behavior.

- [x] **Step 3: Implement repetition, aggregation, and safe resume**

Default `--repetitions` to 3, alternate order by `(task_index + repetition) % 2`,
write every run before updating the summary, and resume only when every protocol
hash and source identity matches. Report per-task success rates, paired
wins/losses/ties, median and total latency, measured usage, failures, policy
violations, and treatment runs with at least one CGRX call.

- [x] **Step 4: Add the six immutable task records**

Pin the direct parent/fix pairs `be81f1d/a1caa1d`, `38252ca/f076819`,
`b8d8285/3974bf3`, `e401e3a/1345bc1`, `a473d1e/d4baf11`, and
`bc97c00/e05b8a3`. Declare only production source paths as editable and only
the focused regression-test paths as hidden. Use Cargo test filters
`refresh_does_not_rewrite`, `positive_impact_survives_unrelated_dynamic_gap`,
`exported_const_arrow`, `nested_named_struct_fields_do_not_hide_receiver_methods`,
`rust_module_alias`, and `directory_scopes` respectively.

- [x] **Step 5: Validate unit tests and all six contracts without model calls**

Run: `python3 -m unittest scripts.test_eval_agent_patches -v`
Run: `python3 scripts/eval_agent_patches.py --repo-map /tmp/cgrx-agent-patch-repo-map.json --output /tmp/cgrx-agent-patch-validation`
Expected: tests pass and six task oracles validate without creating model runs.

- [x] **Step 6: Commit the corpus and aggregation**

Run: `git add contracts/agent_patch_tasks_v1.json scripts/eval_agent_patches.py scripts/test_eval_agent_patches.py && git commit -m "feat(eval): Freeze repeated CGRX patch comparison"`

### Task 4: Documentation, CI, and measured diagnostic run

**Files:**
- Create: `docs/agent-patch-evaluation.md`
- Modify: `.github/workflows/ci.yml`
- Modify: `scripts/test_validate_public_docs_privacy.py`

**Interfaces:**
- Consumes: the committed runner/contract and local Codex/CGRX/repository paths.
- Produces: public methodology and aggregate results with no private paths, prompts containing secrets, raw model logs, or source patches.

- [x] **Step 1: Add a failing public-document validation test**

Require the new document to state optional CGRX use, hidden-test preflight,
three repetitions, end-task correctness, resource accounting, and the limits of
the six-task corpus. Assert it contains no `/Users/`, `/Volumes/`, private repo
mapping, or raw patch body.

- [x] **Step 2: Run the document test and verify RED**

Run: `python3 -m unittest scripts.test_validate_public_docs_privacy -v`
Expected: failure because `docs/agent-patch-evaluation.md` is absent.

- [x] **Step 3: Document commands and add harness tests to CI**

Write validation, preflight, pilot, resume, and full-run commands. Add
`python3 -m unittest discover -s scripts -p test_eval_agent_patches.py` to the
Python CI job. Explain that model runs and historical preflight remain local.

- [ ] **Step 4: Run a one-task, one-repetition pilot**

Run the official bundled Codex CLI with `gpt-6-astra`, medium effort, a
600-second task timeout, and the merged `/Users/ila/.local/bin/cgrx`. Require
both arms to finish and grading to distinguish the buggy and reference states.

- [ ] **Step 5: Run the six-task, three-repetition diagnostic comparison**

Use a new local output directory and preserve all 36 arm attempts. Do not tune
CGRX or task grading after inspecting failures. Record exact success, usage,
latency, policy, actual CGRX-call, and source-integrity results in the document.

- [ ] **Step 6: Run repository verification**

Run: `python3 -m unittest scripts.test_eval_agent_patches scripts.test_validate_public_docs_privacy -v`
Run: `cargo fmt --all -- --check`
Run: `cargo clippy --locked --workspace --all-targets -- -D warnings`
Run: `cargo test --locked --workspace`
Run: `git diff --check`
Expected: all commands pass.

- [ ] **Step 7: Commit and open a draft pull request**

Run: `git add .github/workflows/ci.yml docs/agent-patch-evaluation.md scripts/test_validate_public_docs_privacy.py && git commit -m "docs(eval): Publish optional CGRX patch evidence"`
Push `feat/agent-patch-eval`, open a draft PR against `main`, link IBO-292, and
report local verification, measured limitations, CI state, and the separate
merge/release gate.
