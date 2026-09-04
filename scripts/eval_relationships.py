#!/usr/bin/env python3
"""Measure exact CGRX relationship precision/recall on a committed fixture."""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[1]


def git(repo: Path, *args: str) -> None:
    subprocess.run(["git", "-C", str(repo), *args], check=True, capture_output=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("binary", type=Path)
    parser.add_argument("--minimum-precision", type=float, default=1.0)
    parser.add_argument("--minimum-recall", type=float, default=1.0)
    args = parser.parse_args()
    binary = args.binary.resolve()
    contract = json.loads((ROOT / "contracts/relationship_cases_v1.json").read_text())

    with tempfile.TemporaryDirectory(prefix="cgrx-relationship-eval-") as directory:
        repo = Path(directory)
        shutil.copytree(ROOT / "fixtures/relationship-eval", repo, dirs_exist_ok=True)
        git(repo, "init", "-q")
        git(repo, "add", ".")
        git(
            repo,
            "-c",
            "user.name=CGRX Eval",
            "-c",
            "user.email=eval@example.invalid",
            "commit",
            "-qm",
            "relationship fixture",
        )
        frames = [
            {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2025-06-18",
                    "capabilities": {},
                    "clientInfo": {"name": "cgrx-relationship-eval", "version": "1"},
                },
            },
            {"jsonrpc": "2.0", "method": "notifications/initialized"},
        ]
        for request_id, case in enumerate(contract["cases"], 2):
            frames.append(
                {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "method": "tools/call",
                    "params": {
                        "name": "trace_path",
                        "arguments": {
                            "repo": str(repo),
                            "symbol": case["target"]["symbol"],
                            "path": case["target"]["path"],
                            "direction": "callers",
                            "depth": 1,
                            "limit": 50,
                        },
                    },
                }
            )
        result = subprocess.run(
            [str(binary), "serve", "--multi-repo"],
            input="".join(json.dumps(frame, separators=(",", ":")) + "\n" for frame in frames),
            text=True,
            capture_output=True,
            timeout=120,
        )
        if result.returncode != 0:
            raise RuntimeError(f"CGRX exited {result.returncode}: {result.stderr}")
        responses = [json.loads(line) for line in result.stdout.splitlines()]
        by_id = {response.get("id"): response for response in responses}

        totals = {"tp": 0, "fp": 0, "fn": 0}
        scored_cases = []
        for request_id, case in enumerate(contract["cases"], 2):
            response = by_id[request_id]
            if "error" in response or response["result"].get("isError"):
                raise RuntimeError(f"trace failed for {case['id']}: {response}")
            structured = response["result"]["structuredContent"]
            if structured.get("truncated"):
                raise RuntimeError(
                    f"trace truncated for {case['id']}; exact scoring requires all callers"
                )
            nodes = structured["nodes"]
            observed = {(node["symbol"], node["path"]) for node in nodes if node["hop"] == 1}
            expected = {
                (caller["symbol"], caller["path"]) for caller in case["expected_callers"]
            }
            tp = sorted(observed & expected)
            fp = sorted(observed - expected)
            fn = sorted(expected - observed)
            totals["tp"] += len(tp)
            totals["fp"] += len(fp)
            totals["fn"] += len(fn)
            scored_cases.append(
                {
                    "id": case["id"],
                    "language": case["language"],
                    "tp": tp,
                    "fp": fp,
                    "fn": fn,
                }
            )

    precision = totals["tp"] / (totals["tp"] + totals["fp"]) if totals["tp"] + totals["fp"] else 0.0
    recall = totals["tp"] / (totals["tp"] + totals["fn"]) if totals["tp"] + totals["fn"] else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    report = {
        "schema_version": contract["schema_version"],
        "cases": scored_cases,
        **totals,
        "precision": round(precision, 6),
        "recall": round(recall, 6),
        "f1": round(f1, 6),
        "thresholds": {
            "minimum_precision": args.minimum_precision,
            "minimum_recall": args.minimum_recall,
        },
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    passed = precision >= args.minimum_precision and recall >= args.minimum_recall
    print(
        f"RELATIONSHIP_EVAL={'PASS' if passed else 'FAIL'}; "
        f"TP={totals['tp']}; FP={totals['fp']}; FN={totals['fn']}; "
        f"PRECISION={precision:.3f}; RECALL={recall:.3f}; F1={f1:.3f}"
    )
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
