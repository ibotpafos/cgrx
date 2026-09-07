#!/usr/bin/env python3
"""Exercise conservative change quality gates through the real stdio MCP server."""
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
            "source": "fn target() {}\nfn caller() { target(); }\n",
            "changed": None,
            "verdict": "PASS",
            "block": False,
        },
        {
            "id": "impact-warning",
            "source": "fn target() -> u32 { 1 }\nfn caller() { target(); }\n",
            "changed": "fn target() -> u32 { 2 }\nfn caller() { target(); }\n",
            "verdict": "WARN",
            "block": False,
        },
        {
            "id": "retained-call-failure",
            "source": "fn target() {}\nfn caller() { target(); }\n",
            "changed": "fn caller() { target(); }\n",
            "verdict": "FAIL",
            "block": True,
        },
        {
            "id": "coverage-failure",
            "source": "fn target() -> u32 { 1 }\nfn caller() { target(); }\ntrait Service { fn run(&self); }\nfn dynamic(service: &dyn Service) { service.run(); }\n",
            "changed": "fn target() -> u32 { 2 }\nfn caller() { target(); }\ntrait Service { fn run(&self); }\nfn dynamic(service: &dyn Service) { service.run(); }\n",
            "verdict": "FAIL",
            "block": True,
        },
    ]
    rows = []
    with tempfile.TemporaryDirectory(prefix="cgrx-change-gates-") as directory:
        root = Path(directory)
        mcp = Mcp(binary)
        try:
            for scenario in scenarios:
                repo = repository(root, scenario["id"], {"main.rs": scenario["source"]})
                mcp.tool("status", {"repo": str(repo), "paths_or_scope": ["main.rs"]})
                if scenario["changed"] is not None:
                    (repo / "main.rs").write_text(scenario["changed"])
                arguments = {"repo": str(repo), "fail_on": "error", "limit": 20}
                started = time.perf_counter_ns()
                response = mcp.tool("check_change_gates", arguments)
                elapsed = (time.perf_counter_ns() - started) / 1_000_000
                result = response["structuredContent"]
                visible = json.loads(response["content"][0]["text"])
                repeated = mcp.tool("check_change_gates", arguments)["structuredContent"]
                assert result == repeated
                assert result["algorithm"] == "change_quality_gate_v1"
                assert result["llm_used"] is False
                assert result["verdict"] == scenario["verdict"], result
                assert result["would_block"] is scenario["block"], result
                assert visible["agent_handoff"] == result["agent_handoff"]
                if scenario["id"] == "impact-warning":
                    strict = mcp.tool("check_change_gates", {**arguments, "fail_on": "warning"})
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
        "algorithm": "change_quality_gate_v1",
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
        "CHANGE_QUALITY_GATES=PASS; "
        f"cases={len(rows)}; median_ms={report['totals']['median_latency_ms']}; "
        f"max_ms={report['totals']['max_latency_ms']}"
    )


if __name__ == "__main__":
    main()
