#!/usr/bin/env python3
"""Exercise deterministic change missions through the real stdio MCP server."""
import json
from pathlib import Path
import statistics
import subprocess
import sys
import tempfile
import time


def git(repo, *args):
    subprocess.run(["git", "-C", str(repo), *args], check=True, capture_output=True)


def repository(root, name, files):
    repo = root / name
    repo.mkdir()
    for path, source in files.items():
        full = repo / path
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_text(source)
    git(repo, "init", "-q")
    git(repo, "add", ".")
    git(
        repo,
        "-c",
        "user.name=CGRX Benchmark",
        "-c",
        "user.email=benchmark@example.invalid",
        "commit",
        "-qm",
        "fixture",
    )
    return repo


class Mcp:
    def __init__(self, binary):
        self.process = subprocess.Popen(
            [binary, "serve", "--multi-repo"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        self.sequence = 0
        self.call("initialize", {
            "protocolVersion": "2025-06-18",
            "capabilities": {},
            "clientInfo": {"name": "change-missions-eval", "version": "1"},
        })
        self.notify("notifications/initialized")

    def request(self, method, params=None):
        self.sequence += 1
        frame = {"jsonrpc": "2.0", "id": self.sequence, "method": method}
        if params is not None:
            frame["params"] = params
        self.process.stdin.write(json.dumps(frame, separators=(",", ":")) + "\n")
        self.process.stdin.flush()
        row = self.process.stdout.readline()
        if not row:
            raise RuntimeError(self.process.stderr.read())
        response = json.loads(row)
        if "error" in response:
            raise RuntimeError(response["error"])
        return response

    def call(self, method, params=None):
        return self.request(method, params)["result"]

    def tool(self, name, arguments):
        return self.call("tools/call", {"name": name, "arguments": arguments})

    def notify(self, method):
        self.process.stdin.write(json.dumps({"jsonrpc": "2.0", "method": method}) + "\n")
        self.process.stdin.flush()

    def close(self):
        self.process.stdin.close()
        if self.process.wait(timeout=10) != 0:
            raise RuntimeError(self.process.stderr.read())


def main():
    binary = str(Path(sys.argv[1]).resolve())
    scenarios = [
        {
            "id": "group-callers",
            "files": {"main.rs": "fn target() -> u32 { 1 }\nfn caller_a() { target(); }\nfn caller_b() { target(); }\nfn test_a() { caller_a(); }\nfn test_b() { caller_b(); }\n"},
            "changed": {"main.rs": "fn target() -> u32 { 2 }\nfn caller_a() { target(); }\nfn caller_b() { target(); }\nfn test_a() { caller_a(); }\nfn test_b() { caller_b(); }\n"},
            "expect": {"missions": 1, "groups": 1, "impacts": 2, "tests": 2, "kind": "changed_dependency", "blocked": 0},
        },
        {
            "id": "parallel-paths",
            "files": {
                "a.py": "def target_a():\n    return 1\ndef caller_a():\n    return target_a()\ndef test_a():\n    caller_a()\n",
                "b.py": "def target_b():\n    return 1\ndef caller_b():\n    return target_b()\ndef test_b():\n    caller_b()\n",
            },
            "changed": {
                "a.py": "def target_a():\n    return 2\ndef caller_a():\n    return target_a()\ndef test_a():\n    caller_a()\n",
                "b.py": "def target_b():\n    return 3\ndef caller_b():\n    return target_b()\ndef test_b():\n    caller_b()\n",
            },
            "expect": {"missions": 2, "groups": 1, "impacts": 2, "tests": 2, "kind": "changed_dependency", "blocked": 0},
        },
        {
            "id": "review-only",
            "files": {"feature.ts": "export function oldName() { return 1; }\n"},
            "changed": {"feature.ts": "export function newName() { return 1; }\n"},
            "expect": {"missions": 1, "groups": 1, "impacts": 0, "tests": 0, "kind": "review_changed_path", "blocked": 0},
        },
        {
            "id": "retained-call",
            "files": {"main.rs": "fn target() {}\nfn caller() { target(); }\n"},
            "changed": {"main.rs": "fn caller() { target(); }\n"},
            "expect": {"missions": 1, "groups": 1, "impacts": 0, "tests": 0, "kind": "retained_call_candidate", "blocked": 0},
        },
        {
            "id": "java-test-candidate",
            "files": {"FeatureTest.java": "final class FeatureTest { int target() { return 1; } void verifiesFeature() { target(); } }\n"},
            "changed": {"FeatureTest.java": "final class FeatureTest { int target() { return 2; } void verifiesFeature() { target(); } }\n"},
            "expect": {"missions": 1, "groups": 1, "impacts": 1, "tests": 1, "kind": "changed_dependency", "blocked": 0},
        },
        {
            "id": "coverage-blocker",
            "files": {"main.rs": "fn target() -> u32 { 1 }\nfn caller() { target(); }\ntrait Service { fn run(&self); }\nfn dynamic(service: &dyn Service) { service.run(); }\n"},
            "changed": {"main.rs": "fn target() -> u32 { 2 }\nfn caller() { target(); }\ntrait Service { fn run(&self); }\nfn dynamic(service: &dyn Service) { service.run(); }\n"},
            "expect": {"missions": 1, "groups": 1, "impacts": 1, "tests": 0, "kind": "changed_dependency", "blocked": 1},
        },
    ]
    rows = []
    with tempfile.TemporaryDirectory(prefix="cgrx-change-missions-") as directory:
        root = Path(directory)
        mcp = Mcp(binary)
        try:
            for scenario in scenarios:
                repo = repository(root, scenario["id"], scenario["files"])
                mcp.tool("status", {"repo": str(repo), "paths_or_scope": ["**"]})
                for path, source in scenario["changed"].items():
                    (repo / path).write_text(source)
                started = time.perf_counter_ns()
                response = mcp.tool("scan_risks", {"repo": str(repo), "mode": "changes", "limit": 20})
                elapsed = (time.perf_counter_ns() - started) / 1_000_000
                result = response["structuredContent"]
                visible = json.loads(response["content"][0]["text"])
                repeated = mcp.tool("scan_risks", {"repo": str(repo), "mode": "changes", "limit": 20})
                plan = result["change_plan"]
                expected = scenario["expect"]
                assert plan["algorithm"] == "change_missions_v1"
                assert plan["llm_used"] is False
                assert plan == repeated["structuredContent"]["change_plan"]
                assert plan["totals"]["missions"] == expected["missions"]
                assert plan["totals"]["parallel_groups"] == expected["groups"]
                assert plan["totals"]["blocked"] == expected["blocked"]
                assert len(result["impacts"]) == expected["impacts"]
                assert len(result["verification_plan"]["related_tests"]) == expected["tests"]
                assert plan["missions"][0]["kind"] == expected["kind"]
                assert visible["change_plan"]["agent_handoff"] == plan["agent_handoff"]
                rows.append({
                    "id": scenario["id"],
                    "latency_ms": round(elapsed, 3),
                    "missions": expected["missions"],
                    "parallel_groups": expected["groups"],
                    "blocked": expected["blocked"],
                    "visible_bytes": len(response["content"][0]["text"].encode()),
                    "structured_bytes": len(json.dumps(result, separators=(",", ":")).encode()),
                })
        finally:
            mcp.close()
    latencies = [row["latency_ms"] for row in rows]
    visible = sum(row["visible_bytes"] for row in rows)
    structured = sum(row["structured_bytes"] for row in rows)
    report = {
        "schema_version": 1,
        "algorithm": "change_missions_v1",
        "llm_used": False,
        "cases": rows,
        "totals": {
            "cases": len(rows),
            "missions": sum(row["missions"] for row in rows),
            "blocked": sum(row["blocked"] for row in rows),
            "median_latency_ms": round(statistics.median(latencies), 3),
            "max_latency_ms": round(max(latencies), 3),
            "visible_bytes": visible,
            "structured_bytes": structured,
            "visible_ratio": round(visible / structured, 4),
        },
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    print(
        "CHANGE_MISSIONS=PASS; "
        f"cases={len(rows)}; missions={report['totals']['missions']}; "
        f"median_ms={report['totals']['median_latency_ms']}; "
        f"visible_ratio={report['totals']['visible_ratio']}"
    )


if __name__ == "__main__":
    main()
