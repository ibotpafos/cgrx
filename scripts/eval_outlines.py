#!/usr/bin/env python3
"""Measure compact get_outline responses against frozen real-task source files."""
import argparse
import json
from pathlib import Path
import subprocess

from validate_real_tasks import validate


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("binary", type=Path)
    parser.add_argument(
        "corpus",
        nargs="?",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "contracts/real_tasks_v1.json",
    )
    args = parser.parse_args()
    corpus = json.loads(args.corpus.read_text())
    validate(corpus)
    selected = {}
    for task in corpus["tasks"]:
        selected.setdefault(task["repo"], task["evidence"]["source"]["path"])

    frames = [{
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2025-06-18",
            "capabilities": {},
            "clientInfo": {"name": "outline-eval", "version": "1"},
        },
    }]
    for request_id, (repo, path) in enumerate(selected.items(), 2):
        frames.append({
            "jsonrpc": "2.0",
            "id": request_id,
            "method": "tools/call",
            "params": {
                "name": "get_outline",
                "arguments": {"repo": repo, "path": path, "limit": 500},
            },
        })
    result = subprocess.run(
        [str(args.binary.resolve()), "serve", "--multi-repo"],
        input="".join(json.dumps(frame) + "\n" for frame in frames),
        text=True,
        capture_output=True,
        timeout=300,
        check=False,
    )
    if result.returncode != 0:
        raise SystemExit(result.stderr)
    responses = [json.loads(line) for line in result.stdout.splitlines()]
    if len(responses) != len(frames):
        raise SystemExit("incomplete MCP response set")

    rows = []
    for response, (repo, path) in zip(responses[1:], selected.items()):
        if "error" in response:
            raise SystemExit(json.dumps(response["error"]))
        tool_result = response["result"]
        visible_bytes = len(tool_result["content"][0]["text"].encode())
        raw_bytes = len((Path(repo) / path).read_bytes())
        rows.append({
            "repo": Path(repo).name,
            "path": path,
            "symbols": tool_result["structuredContent"]["total"],
            "raw_bytes": raw_bytes,
            "outline_bytes": visible_bytes,
            "ratio": round(visible_bytes / max(1, raw_bytes), 3),
        })
    raw_total = sum(row["raw_bytes"] for row in rows)
    outline_total = sum(row["outline_bytes"] for row in rows)
    ratios = sorted(row["ratio"] for row in rows)
    report = {
        "schema_version": 1,
        "method": "first preregistered source path per frozen repository",
        "projects": len(rows),
        "raw_bytes": raw_total,
        "outline_bytes": outline_total,
        "aggregate_ratio": round(outline_total / max(1, raw_total), 3),
        "median_ratio": ratios[len(ratios) // 2],
        "rows": rows,
    }
    print(json.dumps(report, indent=2))
    print(
        "OUTLINE_EVAL=PASS; "
        f"PROJECTS={len(rows)}; RATIO={report['aggregate_ratio']:.3f}; "
        f"MEDIAN={report['median_ratio']:.3f}"
    )


if __name__ == "__main__":
    main()
