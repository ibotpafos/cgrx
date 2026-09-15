#!/usr/bin/env python3
"""Offline resident-set (RSS) benchmark for CGRX multi-project indexing.

This is the P3 prerequisite deliverable described in docs/COMPETITIVE.md:
before any shared team index / daemon cache or eviction policy is designed,
measure the resident memory cost of loading each project as an independent
managed server process. It is pure-Python, stdlib-only, and makes no network
calls. Use --mock to synthesize deterministic numbers without building or
launching the cgrx binary.

CLI conventions and output style follow scripts/benchmark_architecture.py.
"""

import argparse
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

import platform

SCHEMA_VERSION = 1
KILOBYTE = 1024

# PIDs of live child processes, so a signal can clean them up.
_running: list = []


def _cleanup_on_signal(signum, _frame):
    for proc in list(_running):
        try:
            if proc.poll() is None:
                proc.terminate()
        except Exception:
            pass
    sys.exit(128 + signum)


signal.signal(signal.SIGINT, _cleanup_on_signal)
signal.signal(signal.SIGTERM, _cleanup_on_signal)


def resolve_cgrx(cli_path):
    """Resolve the cgrx binary or exit nonzero with a clear message.

    No network access; only the local filesystem and PATH are consulted.
    """
    if cli_path:
        candidate = Path(os.path.expanduser(cli_path))
        if candidate.is_file() and os.access(str(candidate), os.X_OK):
            return candidate.resolve()
        sys.exit(f"cgrx binary not found or not executable at: {candidate}")
    path_env = os.environ.get("PATH", "")
    for directory in path_env.split(os.pathsep):
        if not directory:
            continue
        candidate = Path(directory) / "cgrx"
        if candidate.is_file() and os.access(str(candidate), os.X_OK):
            return candidate.resolve()
    sys.exit(
        "cgrx binary not found on PATH; pass --cgrx /path/to/cgrx "
        "(or use --mock to skip launching a binary)"
    )


def build_launch_args(launch_cmd_template, binary, repo_path):
    """Build the argv list for launching the managed server for one repo.

    Args are always passed as a list (never shell=True), so interpolated repo
    paths cannot be interpreted as shell syntax.
    """
    if launch_cmd_template:
        # Whitespace-split template; safe substitution, no shell.
        cmd = (
            launch_cmd_template
            .replace("{cgrx}", str(binary))
            .replace("{repo}", str(repo_path))
        )
        return cmd.split()
    return [str(binary), "serve", "--root", str(repo_path)]


def sample_rss(pid):
    """Return the resident set size (bytes) of pid, or None if unreadable."""
    if platform.system() == "Linux":
        status_path = f"/proc/{pid}/status"
        try:
            with open(status_path, "r", encoding="utf-8") as handle:
                for line in handle:
                    if line.startswith("VmRSS:"):
                        # VmRSS:     12345 kB
                        fields = line.split()
                        kb = int(fields[1])
                        return kb * KILOBYTE
        except (OSError, ValueError, IndexError):
            return None
        return None
    # macOS (and any non-Linux fallback) uses ps.
    try:
        result = subprocess.run(
            ["ps", "-o", "rss=", "-p", str(pid)],
            capture_output=True,
            text=True,
            timeout=5,
        )
    except (subprocess.SubprocessError, OSError):
        return None
    value = result.stdout.strip()
    if not value:
        return None
    try:
        kb = int(float(value))
    except ValueError:
        return None
    return kb * KILOBYTE


def _sample_loop(pid, window_sec, interval_sec):
    """Sample RSS once per interval across the window; return bytes list."""
    count = max(1, int(round(window_sec / interval_sec)))
    samples = []
    start = time.perf_counter()
    for index in range(count):
        rss = sample_rss(pid)
        if rss is not None:
            samples.append(rss)
        elapsed = time.perf_counter() - start
        next_at = (index + 1) * interval_sec
        remaining = next_at - elapsed
        if remaining > 0:
            time.sleep(remaining)
    return samples


def _terminate(proc):
    if proc.poll() is not None:
        try:
            proc.wait(timeout=1)
        except subprocess.TimeoutExpired:
            pass
        if proc in _running:
            _running.remove(proc)
        return
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            pass
    if proc in _running:
        _running.remove(proc)


def measure_real(launch_args, window_sec, interval_sec, notes):
    """Launch the managed server and sample its RSS over the window."""
    try:
        proc = subprocess.Popen(
            launch_args,
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except (OSError, ValueError) as exc:
        notes.append(f"launch failed: {exc}")
        return []
    _running.append(proc)
    if proc.poll() is not None:
        notes.append("process exited before sampling started")
        _terminate(proc)
        return []
    samples = _sample_loop(proc.pid, window_sec, interval_sec)
    _terminate(proc)
    if not samples:
        notes.append("no RSS samples collected; process may have exited early")
    return samples


def measure_mock(index, window_sec, interval_sec):
    """Synthesize deterministic per-project RSS samples (no binary launched)."""
    count = max(1, int(round(window_sec / interval_sec)))
    baseline = 64 * 1024 * 1024  # 64 MiB baseline resident set
    per_project = 32 * 1024 * 1024  # +32 MiB per project index
    samples = []
    for i in range(count):
        # Deterministic sawtooth so peak != avg and the math is exercised.
        delta = ((i * 7) % 11) * (1024 * 1024)
        samples.append(baseline + index * per_project + delta)
    return samples


def _aggregate(samples):
    if not samples:
        return 0, 0
    peak = max(samples)
    avg = sum(samples) // len(samples)
    return peak, avg


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Offline resident-set (RSS) benchmark for CGRX multi-project "
            "indexing. Measures per-project memory cost before a shared "
            "team index / daemon is designed (P3 prerequisite)."
        )
    )
    parser.add_argument(
        "--repo",
        action="append",
        metavar="PATH",
        help="absolute git root; repeat once per project (ignored with --repo-map)",
    )
    parser.add_argument(
        "--repo-map",
        metavar="FILE.json",
        help="JSON file mapping project id -> repo path",
    )
    parser.add_argument("--sample-window-sec", type=float, default=10.0)
    parser.add_argument("--sample-interval-sec", type=float, default=1.0)
    parser.add_argument(
        "--cgrx",
        metavar="PATH",
        help="path to the cgrx binary (default: resolve 'cgrx' from PATH)",
    )
    parser.add_argument(
        "--launch-cmd",
        metavar="TEMPLATE",
        help="launch template with {cgrx} and {repo} placeholders "
             "(default: '{cgrx} serve --root {repo}')",
    )
    parser.add_argument(
        "--output",
        metavar="FILE.json",
        help="write the JSON report to this file (default: stdout)",
    )
    parser.add_argument(
        "--mock",
        action="store_true",
        help="synthesize deterministic RSS numbers without launching any binary",
    )
    args = parser.parse_args()

    if args.sample_window_sec <= 0:
        parser.error("--sample-window-sec must be positive")
    if args.sample_interval_sec <= 0:
        parser.error("--sample-interval-sec must be positive")

    repos = []  # list of (id, path)
    if args.repo_map:
        try:
            with open(args.repo_map, "r", encoding="utf-8") as handle:
                mapping = json.load(handle)
        except (OSError, json.JSONDecodeError) as exc:
            parser.error(f"--repo-map: {exc}")
        if not isinstance(mapping, dict) or not mapping:
            parser.error("--repo-map must be a non-empty JSON object mapping id -> path")
        for project_id, path in mapping.items():
            repos.append((str(project_id), str(path)))
    if args.repo:
        for path in args.repo:
            resolved = str(Path(path).resolve())
            repos.append((resolved, resolved))
    if not repos:
        parser.error("provide at least one --repo PATH or a --repo-map FILE.json")

    binary = None
    if not args.mock:
        binary = resolve_cgrx(args.cgrx)

    notes = [
        f"platform={platform.system()} {platform.release()}",
        f"sample_window_sec={args.sample_window_sec} "
        f"sample_interval_sec={args.sample_interval_sec}",
        "totals are the sum across projects and assume every measured project "
        "is resident in one address space (no shared-page deduplication); a real "
        "shared daemon may share pages and report lower combined RSS.",
    ]
    if args.mock:
        notes.append(
            "MOCK MODE: no binary launched; RSS values are synthetic and "
            "deterministic for offline testing."
        )
    else:
        notes.append(f"cgrx={binary}")

    per_project = []
    for index, (project_id, path) in enumerate(repos):
        repo_path = Path(path).resolve() if not args.mock else Path(path)
        if args.mock:
            samples = measure_mock(index, args.sample_window_sec, args.sample_interval_sec)
        else:
            launch_args = build_launch_args(args.launch_cmd, binary, repo_path)
            samples = measure_real(launch_args, args.sample_window_sec, args.sample_interval_sec, notes)
        peak, avg = _aggregate(samples)
        per_project.append(
            {
                "id": project_id,
                "repo": str(repo_path),
                "peak_bytes": peak,
                "avg_bytes": avg,
                "samples": samples,
            }
        )

    total_peak = sum(item["peak_bytes"] for item in per_project)
    total_avg = sum(item["avg_bytes"] for item in per_project)

    report = {
        "schema_version": SCHEMA_VERSION,
        "measured_at_unix": round(time.time(), 3),
        "config": {
            "sample_window_sec": args.sample_window_sec,
            "sample_interval_sec": args.sample_interval_sec,
            "mock": args.mock,
            "cgrx": str(binary) if binary else None,
        },
        "per_project": per_project,
        "totals": {"peak_bytes": total_peak, "avg_bytes": total_avg},
        "notes": notes,
    }

    text = json.dumps(report, indent=2, sort_keys=True)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as handle:
            handle.write(text + "\n")
    else:
        print(text)


if __name__ == "__main__":
    main()
