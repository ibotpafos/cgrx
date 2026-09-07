#!/usr/bin/env python3
"""Evaluate the mistake ledger against the real MCP server (warn-only).

False positives must never resolve; false negatives must always resolve.
Public-clone cases whose repository is absent report INCONCLUSIVE, never a
pass. Slice A runs warn-only; Slice B promotes LEDGER_EVAL=FAIL to blocking.
"""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "mistake-ledger"


def git(repo: Path, *args: str) -> None:
    subprocess.run(["git", "-C", str(repo), *args], check=True, capture_output=True)


def score_case(kind, observed, target):
    """Pure scoring: observed is a set of (symbol, path) callee pairs."""
    if kind == "false_positive":
        offenders = sorted(pair for pair in observed if pair == target)
        return {"pass": not offenders, "detail": offenders}
    required = target
    return {"pass": required in observed, "detail": [] if required in observed else [required]}


def trace_callees(binary, repo, caller, path):
    frames = [
        {"jsonrpc": "2.0", "id": 1, "method": "initialize",
         "params": {"protocolVersion": "2025-06-18", "capabilities": {},
                    "clientInfo": {"name": "cgrx-mistake-ledger-eval", "version": "1"}}},
        {"jsonrpc": "2.0", "method": "notifications/initialized"},
        {"jsonrpc": "2.0", "id": 2, "method": "tools/call",
         "params": {"name": "trace_path",
                    "arguments": {"repo": str(repo), "symbol": caller, "path": path,
                                  "direction": "callees", "depth": 1, "limit": 50}}},
    ]
    result = subprocess.run(
        [str(binary), "serve", "--multi-repo"],
        input="".join(json.dumps(frame, separators=(",", ":")) + "\n" for frame in frames),
        text=True, capture_output=True, timeout=120,
    )
    if result.returncode != 0:
        raise RuntimeError(f"CGRX exited {result.returncode}: {result.stderr}")
    by_id = {}
    for line in result.stdout.splitlines():
        response = json.loads(line)
        if isinstance(response.get("id"), int):
            by_id[response["id"]] = response
    response = by_id.get(2)
    if response is None or "error" in response or response["result"].get("isError"):
        raise RuntimeError(f"trace failed: {response}")
    structured = response["result"]["structuredContent"]
    if structured.get("truncated"):
        raise RuntimeError("trace truncated; exact scoring requires complete rows")
    if structured.get("truncated") is not False or type(structured.get("total")) is not int:
        raise RuntimeError("missing completeness metadata")
    nodes = structured["nodes"]
    if structured["total"] != len(nodes):
        raise RuntimeError("incomplete trace: total does not match rows")
    if any(type(node.get("hop")) is not int or node["hop"] != 1 for node in nodes):
        raise RuntimeError("unexpected hop in depth-one trace")
    return {(node["symbol"], node["path"]) for node in nodes}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("binary", type=Path)
    parser.add_argument("--warn-only", action="store_true")
    args = parser.parse_args()
    binary = args.binary.resolve()
    ledger = json.loads((ROOT / "contracts" / "mistake_ledger_v1.json").read_text())

    scored, inconclusive = [], []
    for case in ledger["cases"]:
        if case["repo_kind"] == "public_clone" and not Path(case["repo"]).is_dir():
            inconclusive.append({"id": case["id"], "state": "INCONCLUSIVE"})
            continue
        with tempfile.TemporaryDirectory(prefix="cgrx-ledger-eval-") as directory:
            repo = Path(directory)
            if case["repo_kind"] == "synthetic":
                shutil.copytree(FIXTURES / case["fixture"], repo, dirs_exist_ok=True)
            else:
                raise RuntimeError("public_clone eval not implemented in Slice A")
            git(repo, "init", "-q")
            git(repo, "add", ".")
            git(repo, "-c", "user.name=CGRX Eval", "-c", "user.email=eval@example.invalid",
                "commit", "-qm", "mistake ledger fixture")
            observed = trace_callees(binary, repo, case["caller"]["symbol"], case["caller"]["path"])
            target = (case["target"]["symbol"], case["target"]["path"])
            verdict = score_case(case["kind"], observed, target)
            scored.append({"id": case["id"], "kind": case["kind"],
                           "pass": verdict["pass"], "detail": verdict["detail"]})

    failed = [entry["id"] for entry in scored if not entry["pass"]]
    report = {"cases": scored, "inconclusive": inconclusive,
              "failed": failed,
              "verdict": "LEDGER_EVAL=" + ("PASS" if not failed else "FAIL")}
    print(json.dumps(report, indent=2, sort_keys=True))
    if failed and not args.warn_only:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
