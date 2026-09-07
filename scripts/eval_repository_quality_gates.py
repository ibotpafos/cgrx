#!/usr/bin/env python3
"""Exercise repository architecture quality gates through the real stdio MCP server."""
import json
from pathlib import Path
import statistics
import sys
import tempfile
import time

from eval_change_missions import Mcp, repository


def main():
    binary = str(Path(sys.argv[1]).resolve())
    scenarios = [
        {
            "id": "clean-pass",
            "files": {"main.rs": "fn target() {}\nfn caller() { target(); }\n"},
            "arguments": {},
            "verdict": "PASS",
            "block": False,
        },
        {
            "id": "fanin-warning",
            "files": {"main.rs": "fn target() {}\nfn a() { target(); }\nfn b() { target(); }\n"},
            "arguments": {"max_symbol_fan_in": 0},
            "verdict": "WARN",
            "block": False,
        },
        {
            "id": "package-cycle-failure",
            "files": {
                "a/index.ts": "import { b } from '../b/index';\nexport function a() { return b(); }\n",
                "b/index.ts": "import { a } from '../a/index';\nexport function b() { return a(); }\n",
            },
            "arguments": {"package_depth": 1},
            "verdict": "FAIL",
            "block": True,
        },
        {
            "id": "unresolved-inconclusive",
            "files": {"src/index.ts": "import { missing } from './missing';\nexport const value = missing;\n"},
            "arguments": {
                "package_depth": 1,
                "max_unresolved_local_dependencies": 100,
                "max_coverage_gaps": 100,
            },
            "verdict": "INCONCLUSIVE",
            "block": True,
        },
    ]
    rows = []
    with tempfile.TemporaryDirectory(prefix="cgrx-repository-gates-") as directory:
        root = Path(directory)
        mcp = Mcp(binary)
        try:
            for scenario in scenarios:
                repo = repository(root, scenario["id"], scenario["files"])
                arguments = {
                    "repo": str(repo),
                    "fail_on": "error",
                    **scenario["arguments"],
                }
                started = time.perf_counter_ns()
                response = mcp.tool("check_repository_gates", arguments)
                elapsed = (time.perf_counter_ns() - started) / 1_000_000
                result = response["structuredContent"]
                visible = json.loads(response["content"][0]["text"])
                repeated = mcp.tool("check_repository_gates", arguments)["structuredContent"]
                assert result == repeated
                assert result["algorithm"] == "repository_quality_gate_v1"
                assert result["llm_used"] is False
                assert result["verdict"] == scenario["verdict"], result
                assert result["would_block"] is scenario["block"], result
                assert visible["agent_handoff"] == result["agent_handoff"]
                if scenario["id"] == "fanin-warning":
                    strict = mcp.tool(
                        "check_repository_gates",
                        {**arguments, "fail_on": "warning"},
                    )
                    assert strict["structuredContent"]["would_block"] is True
                rows.append({
                    "id": scenario["id"],
                    "verdict": result["verdict"],
                    "would_block": result["would_block"],
                    "latency_ms": round(elapsed, 3),
                    "visible_bytes": len(response["content"][0]["text"].encode()),
                })
        finally:
            mcp.close()
    latencies = [row["latency_ms"] for row in rows]
    report = {
        "schema_version": 1,
        "algorithm": "repository_quality_gate_v1",
        "llm_used": False,
        "cases": rows,
        "totals": {
            "cases": len(rows),
            "median_latency_ms": round(statistics.median(latencies), 3),
            "max_latency_ms": round(max(latencies), 3),
            "visible_bytes": sum(row["visible_bytes"] for row in rows),
        },
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    print(
        "REPOSITORY_QUALITY_GATES=PASS; "
        f"cases={len(rows)}; median_ms={report['totals']['median_latency_ms']}; "
        f"max_ms={report['totals']['max_latency_ms']}"
    )


if __name__ == "__main__":
    main()
