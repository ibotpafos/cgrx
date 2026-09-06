#!/usr/bin/env python3
"""Benchmark a release CGRX architecture response on pinned Git worktrees."""

import argparse
import json
from pathlib import Path
import subprocess
import time


def benchmark(binary: Path, label: str, repo: Path, depth: int, limit: int) -> dict:
    canonical_repo = Path(
        subprocess.run(
            ["git", "-C", repo, "rev-parse", "--show-toplevel"],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
    ).resolve()
    frames = [
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2025-06-18",
                "capabilities": {},
                "clientInfo": {"name": "architecture-benchmark", "version": "1"},
            },
        },
        {"jsonrpc": "2.0", "method": "notifications/initialized"},
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": "get_architecture",
                "arguments": {
                    "repo": str(canonical_repo),
                    "scope": "**",
                    "package_depth": depth,
                    "limit": limit,
                },
            },
        },
    ]
    started = time.perf_counter()
    process = subprocess.run(
        [binary, "serve", "--multi-repo"],
        input="".join(json.dumps(frame, separators=(",", ":")) + "\n" for frame in frames),
        text=True,
        capture_output=True,
        timeout=300,
    )
    elapsed_ms = round((time.perf_counter() - started) * 1000, 1)
    if process.returncode != 0:
        raise RuntimeError(process.stderr.strip() or f"CGRX exited {process.returncode}")
    responses = [json.loads(line) for line in process.stdout.splitlines()]
    response = next(item for item in responses if item.get("id") == 2)
    if "error" in response:
        raise RuntimeError(json.dumps(response["error"], sort_keys=True))
    result = response["result"]
    architecture = result["structuredContent"]
    visible = result["content"][0]["text"]
    return {
        "project": label,
        "repo": str(canonical_repo),
        "snapshot": architecture["snapshot"],
        "elapsed_ms": elapsed_ms,
        "model_visible_bytes": len(visible.encode()),
        "totals": architecture["totals"],
        "community_detection": architecture["community_detection"],
        "partial": architecture["partial"],
        "truncated": architecture["truncated"],
        "coverage_gap_count": architecture["coverage_gap_count"],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True, type=Path)
    parser.add_argument(
        "--repo",
        action="append",
        required=True,
        metavar="LABEL=PATH",
        help="repeat for each Git worktree",
    )
    parser.add_argument("--package-depth", type=int, default=2)
    parser.add_argument("--limit", type=int, default=100)
    args = parser.parse_args()
    binary = args.binary.resolve()
    rows = []
    for value in args.repo:
        label, separator, path = value.partition("=")
        if not separator or not label or not path:
            parser.error(f"invalid --repo {value!r}; expected LABEL=PATH")
        rows.append(
            benchmark(
                binary,
                label,
                Path(path),
                args.package_depth,
                args.limit,
            )
        )
    print(
        json.dumps(
            {
                "schema_version": 1,
                "package_depth": args.package_depth,
                "limit": args.limit,
                "results": rows,
            },
            indent=2,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
