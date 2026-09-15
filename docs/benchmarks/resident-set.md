# Resident-set benchmark (P3 prerequisite)

This benchmark is the **P3 prerequisite** named in
[../COMPETITIVE.md](../COMPETITIVE.md#p3--team--shared-index-server). P3 moves
CGRX from explicit repo-scoped runtimes to a shared, team-accessible
index/daemon. The competitive note is explicit:

> "Measure resident cost per loaded project before introducing a daemon cache
> or eviction policy."

This script is that measurement. It is a **pure-Python, stdlib-only, offline**
deliverable -- no Rust, no cargo, no network calls -- so it can be reviewed and
run before any shared-cache or eviction design is started.

## Why measure per-project resident cost first?

A shared daemon would hold many project indexes resident at once. Its memory
footprint is dominated by the **resident set size (RSS)** of each loaded
project, not by peak transient allocations. Designing a cache/eviction policy
(LRU/TTL, like Trace's documented multi-project daemon) *before* you know the
per-project baseline means guessing the very number the policy is supposed to
bound.

This benchmark establishes, per project and in aggregate:

- **peak_bytes** -- the worst-case resident cost while the managed server holds
  that repo loaded.
- **avg_bytes** -- the typical resident cost across the sampling window.

With those numbers you can size an eviction budget (e.g. "keep N projects
resident under M MiB") and predict steady-state daemon memory from the project
mix, rather than reverse-engineering it after the daemon exists.

## How to run

The script lives at `scripts/benchmark_resident_set.py`. It always passes
arguments to `subprocess` as a **list** (never `shell=True`), so repo paths
cannot be interpreted as shell syntax.

### Mock mode (offline, no build)

Use `--mock` to exercise the full report shape with deterministic synthetic
RSS numbers. No `cgrx` binary is launched, so this works without a Rust build:

~~~sh
python3 scripts/benchmark_resident_set.py --mock \
    --repo /abs/path/to/repoA \
    --repo /abs/path/to/repoB \
    --output /tmp/resident_mock.json
~~~

### Real mode (launches the managed server per repo)

With a built `cgrx` on your `PATH` (or passed via `--cgrx`), the script launches
`cgrx serve --root <repo>` for each repo, samples its RSS over the window, then
terminates the process:

~~~sh
python3 scripts/benchmark_resident_set.py \
    --repo /abs/path/to/repoA \
    --repo /abs/path/to/repoB \
    --sample-window-sec 30 \
    --sample-interval-sec 2 \
    --output /tmp/resident_real.json
~~~

If the `cgrx` binary cannot be resolved, the script prints a clear message and
exits non-zero (it never crashes with a traceback).

### Repo selection

- `--repo <abs-git-root>` -- repeat once per project.
- `--repo-map FILE.json` -- a JSON object mapping a stable **id** to a repo
  path, e.g. `{"alpha": "/abs/a", "beta": "/abs/b"}`. Ids from the map are
  preserved in the report; for bare `--repo` the resolved absolute path is used
  as the id.

### Options

| Option | Default | Meaning |
| --- | --- | --- |
| `--sample-window-sec` | `10` | Total duration to sample each project. |
| `--sample-interval-sec` | `1` | Seconds between RSS samples. |
| `--cgrx PATH` | resolve `cgrx` from PATH | Explicit binary location. |
| `--launch-cmd TEMPLATE` | `{cgrx} serve --root {repo}` | Alternative launch command; `{cgrx}` and `{repo}` are substituted, then whitespace-split into argv (no shell). |
| `--output FILE.json` | stdout | Where to write the JSON report. |
| `--mock` | off | Synthesize deterministic RSS, launch nothing. |

## What the JSON report means

~~~json
{
  "schema_version": 1,
  "measured_at_unix": 1700000000.0,
  "config": { "sample_window_sec": 10, "sample_interval_sec": 1, "mock": true, "cgrx": null },
  "per_project": [
    {
      "id": "/abs/path/to/repoA",
      "repo": "/abs/path/to/repoA",
      "peak_bytes": 188743680,
      "avg_bytes": 180355072,
      "samples": [67108864, 73400320]
    }
  ],
  "totals": { "peak_bytes": 188743680, "avg_bytes": 178467634 },
  "notes": ["platform=Darwin 23.0.0", "MOCK MODE: ..."]
}
~~~

- **schema_version** -- report format version (currently `1`).
- **measured_at_unix** -- epoch seconds when the report was produced.
- **config** -- the effective run parameters (echoed for reproducibility).
- **per_project** -- one entry per repo:
  - **id** -- the project identifier (map key, or resolved path).
  - **repo** -- the resolved repo path.
  - **peak_bytes** / **avg_bytes** -- resident set size in **bytes** (KB from
    `ps`/`VmRSS` converted to bytes).
  - **samples** -- the raw per-interval RSS samples in bytes.
- **totals** -- the **sum across projects** of `peak_bytes` and `avg_bytes`.
  This is a conservative upper bound assuming every measured project is resident
  in one address space with **no shared-page deduplication**; a real shared
  daemon may share pages (e.g. the Rust runtime, shared grammar data) and
  therefore report lower combined RSS. Treat `totals` as "worst case if fully
  co-located", not a measured single-process figure.
- **notes** -- platform, sampling config, and mode (including the MOCK warning
  when `--mock` is used).

## Offline guarantee

The script makes **no network calls**. In real mode it only spawns the local
`cgrx` binary and reads local process memory counters
(`ps -o rss=` on macOS, `/proc/<pid>/status` `VmRSS` on Linux). In mock mode it
launches nothing at all.
