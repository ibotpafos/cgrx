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

## Event-driven watcher: `cgrx watch`

`cgrx watch` is the event-driven alternative to `cgrx daemon`. Instead
of polling on an interval, it uses the `notify` crate (inotify on
Linux, FSEvents on macOS, ReadDirectoryChanges on Windows) to watch the
filesystem directly. When a supported source file changes, it triggers
a `Runtime::refresh` — the same incremental re-index used by `daemon`
and `serve --watch-root`.

### Usage

~~~sh
# Watch a repository, using the managed state path:
cgrx watch --root <repo> --json

# Watch with an explicit state directory:
cgrx watch --root <repo> --state <state-dir> --json
~~~

`--json` and `--root` are required. `--state` is optional; when omitted
the managed state path (`git rev-parse --git-path cgrx/managed`) is
used, matching `cgrx serve --root`.

### What gets watched

The watcher monitors the root recursively and filters events to:

- **Supported extensions**: `.rs`, `.ts`, `.go`, `.py`, `.java`
- **Ignored directories**: `.git/`, `target/`, `node_modules/` (and any
  nested content beneath them)

All other files are ignored. This keeps the event stream focused on
source code that the index can extract.

### Debounce

Rapid successive changes (e.g. a save that triggers multiple write
events) are coalesced into a single `refresh` call. The debounce window
is 500 ms — events arriving within that window are batched, and one
refresh runs for the whole batch.

### Event schema

Same JSON-line schema as `daemon`, with one addition:

| Field           | Meaning                                                        |
| --------------- | -------------------------------------------------------------- |
| `command`       | always `"watch"`                                               |
| `iteration`     | 1-based refresh counter for this process                       |
| `changed`       | whether this `refresh` moved the snapshot                      |
| `watched_paths` | paths the file watcher reported as changed (pre-filter)        |
| `changed_paths` | sorted working-tree paths differing from the indexed base     |
| `snapshot`      | current `RepoSnapshot`                                         |
| `refresh_us`    | wall-clock microseconds spent inside `Runtime::refresh`        |
| `error`         | `null`, or `{"code", "message"}` on failure                    |
| `measurement`   | always `"wall_clock_monotonic"`                                |

### Failure policy

A new `HEAD` fails closed with `revision_changed` and the command exits
non-zero. This matches `daemon --once` behavior. The operator runs
`cgrx index` to rebuild for the new revision, then restarts `cgrx watch`.

### Comparison with `cgrx daemon`

| Aspect           | `cgrx daemon`                      | `cgrx watch`                         |
| ---------------- | ---------------------------------- | ------------------------------------ |
| Trigger          | Polling (interval)                 | Filesystem events (notify)           |
| Latency          | Up to `--interval-secs` seconds    | Near-real-time (event-driven)        |
| CPU usage        | Periodic git status                | Event-driven, no polling             |
| Use case         | CI gates, simple supervisors       | Editor hooks, live-reload scenarios  |
| Debounce         | N/A (interval acts as debounce)    | 500 ms event coalescing              |

Both commands use the same `Runtime::refresh` path, so the incremental
re-index behavior (only changed files re-read, only changed paths
re-extracted) is identical.
