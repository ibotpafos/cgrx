# Incremental watcher daemon

`cgrx daemon` is a background freshness monitor built on the existing
`Runtime::refresh`. It does not replace the lazy per-request refresh in
`cgrx serve --watch-root` / managed `serve --root`; it reports freshness
for supervisors, editor hooks, and CI gates without starting an MCP
session.

## Usage

~~~sh
# Single freshness probe (useful as an editor/hook gate):
cgrx daemon --root <repo> --state <state-dir> --json --once

# Background watch: one JSON event per freshness transition on stdout.
# Runs until interrupted; `--max-iterations` bounds it (tests, one-shots):
cgrx daemon --root <repo> --state <state-dir> --json \
  --interval-secs 2 --max-iterations 1000
~~~

`--json` is required. `--root` and `--state` are required.
`--interval-secs` must be between 1 and 3600 (default 2).
`--once` cannot be combined with `--max-iterations`.

## Event schema

Each line on stdout is one JSON object:

| Field           | Meaning                                                        |
| --------------- | -------------------------------------------------------------- |
| `iteration`     | 1-based refresh counter for this process                       |
| `changed`       | whether this `refresh` moved the snapshot                      |
| `changed_paths` | sorted working-tree paths differing from the indexed base     |
| `snapshot`      | current `RepoSnapshot` (`repo_revision` + `working_tree_digest`) |
| `refresh_us`    | wall-clock microseconds spent inside `Runtime::refresh`        |
| `error`         | `null`, or `{"code", "message"}` on failure                    |
| `measurement`   | always `"wall_clock_monotonic"`                                |

## No polling in the hot loop

An event is printed only when the freshness signature
(`changed` + `changed_paths` + error code) differs from the previous
iteration. An idle tree emits exactly one event and then stays silent;
every iteration blocks inside `refresh` (one `git status` batch plus
re-reads of only the changed files — files whose mtime fingerprint is
unchanged are skipped without reading) and then sleeps
`--interval-secs`. No busy loop, no log spam.

The daemon is read-only with respect to the state directory: refresh
happens in memory, exactly like `serve --watch-root`. It never rewrites
the stored index.

## Failure policy

A new `HEAD` fails closed with `revision_changed`: `--once` exits
non-zero (stderr names the code), while watch mode keeps running and
re-reports only on transitions, so a later `cgrx index` unblocks the
next iterations without restarting the supervisor.
