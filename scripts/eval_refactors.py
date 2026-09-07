#!/usr/bin/env python3
"""Evaluate bounded refactor candidates across frozen real-project snapshots."""
import argparse
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import time


LABELS = ("useful", "false_positive", "uncertain", "unreviewed")
POLICIES = {"preserve_entrypoints", "canonical_entrypoint", "consolidate"}
REVISION = re.compile(r"[0-9a-f]{40}")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def safe_relative(value, label):
    require(isinstance(value, str) and value.strip(), f"{label} must be non-empty")
    require("\\" not in value, f"unsafe {label}")
    path = PurePosixPath(value)
    require(not path.is_absolute() and ".." not in path.parts, f"unsafe {label}")


def validate_endpoint(endpoint):
    require(isinstance(endpoint, dict), "candidate endpoint must be an object")
    require(
        set(endpoint) == {"path", "symbol", "node_id", "span"},
        "candidate endpoint fields invalid",
    )
    safe_relative(endpoint["path"], "candidate path")
    require(
        isinstance(endpoint["symbol"], str) and endpoint["symbol"].strip(),
        "candidate endpoint symbol must be non-empty",
    )
    require(isinstance(endpoint["node_id"], int), "candidate node_id must be an integer")
    span = endpoint["span"]
    require(
        isinstance(span, dict)
        and set(span) == {"start", "end"}
        and isinstance(span["start"], int)
        and isinstance(span["end"], int)
        and 0 <= span["start"] <= span["end"],
        "candidate span invalid",
    )


def git(repo, *args):
    result = subprocess.run(
        ["git", "-C", str(repo), *args],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise ValueError("repository is not a readable Git worktree")
    return result.stdout.strip()


def validate_contract(document, check_repositories=True):
    require(isinstance(document, dict), "contract must be an object")
    require(
        set(document) == {"schema_version", "method", "min_score", "limit", "projects"},
        "contract fields invalid",
    )
    require(document["schema_version"] == 1, "unsupported schema version")
    require(isinstance(document["method"], str) and document["method"], "method required")
    require(
        isinstance(document["min_score"], int) and 0 <= document["min_score"] <= 1000,
        "min_score must be 0..1000",
    )
    require(
        isinstance(document["limit"], int) and 1 <= document["limit"] <= 50,
        "limit must be 1..50",
    )
    require(isinstance(document["projects"], list) and document["projects"], "projects required")
    project_ids = set()
    candidate_ids = set()
    for project in document["projects"]:
        require(
            isinstance(project, dict)
            and set(project) == {"id", "repo", "revision", "scope", "candidates"},
            "project fields invalid",
        )
        project_id = project["id"]
        require(
            isinstance(project_id, str) and re.fullmatch(r"[a-z0-9][a-z0-9-]*", project_id),
            "invalid project id",
        )
        require(project_id not in project_ids, "duplicate project id")
        project_ids.add(project_id)
        repo = Path(project["repo"])
        require(repo.is_absolute(), "repository path must be absolute")
        require(
            isinstance(project["revision"], str) and REVISION.fullmatch(project["revision"]),
            "revision must be lowercase 40-hex",
        )
        safe_relative(project["scope"], "scope")
        require(isinstance(project["candidates"], list), "candidates must be an array")
        for candidate in project["candidates"]:
            require(
                isinstance(candidate, dict)
                and set(candidate) == {"id", "left", "right", "label"},
                "candidate row fields invalid",
            )
            candidate_id = candidate["id"]
            require(
                isinstance(candidate_id, str) and candidate_id.startswith(project_id + ":"),
                "candidate id must be project-qualified",
            )
            require(candidate_id not in candidate_ids, "duplicate candidate id")
            candidate_ids.add(candidate_id)
            validate_endpoint(candidate["left"])
            validate_endpoint(candidate["right"])
            require(candidate["label"] in LABELS, "unknown label")
        if check_repositories:
            require(repo.is_dir(), "repository missing")
            top = Path(git(repo, "rev-parse", "--show-toplevel")).resolve()
            require(top == repo.resolve(), "repo must be the Git worktree root")
            require(git(repo, "rev-parse", "HEAD") == project["revision"], "snapshot mismatch")


def build_report(document, responses):
    validate_contract(document, check_repositories=False)
    require(len(responses) == len(document["projects"]), "incomplete MCP response set")
    rows = []
    payload_tokens = 0
    partial_projects = 0
    seen_ids = set()
    policy_counts = {policy: 0 for policy in sorted(POLICIES)}
    planner_scores = []
    for project, response in zip(document["projects"], responses):
        require(isinstance(response, dict) and "error" not in response, "MCP tool error")
        result = response.get("result")
        require(isinstance(result, dict), "malformed MCP result")
        structured = result.get("structuredContent")
        require(isinstance(structured, dict), "malformed structured result")
        snapshot = structured.get("snapshot")
        require(
            isinstance(snapshot, dict)
            and snapshot.get("repo_revision") == project["revision"],
            "snapshot mismatch",
        )
        require(structured.get("truncated") is False, "truncated candidate result")
        candidates = structured.get("candidates")
        require(isinstance(candidates, list), "malformed candidate rows")
        require(structured.get("total") == len(candidates), "candidate total mismatch")
        if structured.get("partial") is True:
            partial_projects += 1
        content = result.get("content")
        require(isinstance(content, list) and content, "missing model-visible result")
        visible = json.loads(content[0].get("text", ""))
        tokens = visible.get("payload_tokens")
        require(isinstance(tokens, int) and tokens >= 0, "missing payload_tokens")
        payload_tokens += tokens
        existing = {item["id"]: item for item in project["candidates"]}
        returned_ids = set()
        for candidate in candidates:
            require(isinstance(candidate, dict), "malformed candidate row")
            left_full = candidate.get("left")
            right_full = candidate.get("right")
            require(
                isinstance(left_full, dict) and isinstance(right_full, dict),
                "malformed candidate row",
            )
            validate_endpoint(left_full)
            validate_endpoint(right_full)
            left = left_full
            right = right_full
            projection = candidate.get("projection")
            require(
                isinstance(projection, dict)
                and projection.get("status") == "hypothetical"
                and isinstance(projection.get("id"), str),
                "malformed projection",
            )
            candidate_id = f"{project['id']}:{projection['id']}"
            require(candidate_id not in seen_ids, "duplicate candidate id")
            seen_ids.add(candidate_id)
            returned_ids.add(candidate_id)
            prior = existing.get(candidate_id)
            if prior is not None:
                require(prior["left"] == left and prior["right"] == right, "candidate identity drift")
            strategies = candidate.get("strategies")
            require(isinstance(strategies, list) and len(strategies) == 3, "three strategies required")
            require({item.get("policy") for item in strategies} == POLICIES, "strategy policy set invalid")
            recommended = [item for item in strategies if item.get("recommended") is True]
            require(len(recommended) == 1, "exactly one recommended strategy required")
            scores = []
            for rank, strategy in enumerate(strategies, 1):
                counterfactual = strategy.get("counterfactual")
                require(isinstance(counterfactual, dict), "counterfactual missing")
                require(counterfactual.get("algorithm") == "counterfactual_refactor_v1", "algorithm drift")
                require(counterfactual.get("llm_used") is False, "planner must be model-free")
                require(counterfactual.get("rank") == rank, "strategy rank mismatch")
                require(isinstance(counterfactual.get("formula"), dict), "formula missing")
                require(isinstance(counterfactual.get("predicted_graph"), dict), "graph prediction missing")
                score = counterfactual.get("score")
                require(isinstance(score, int) and 0 <= score <= 1000, "strategy score invalid")
                scores.append(score)
            require(scores == sorted(scores, reverse=True), "strategies are not score-ranked")
            winner = recommended[0]
            require(winner is strategies[0], "recommended strategy must rank first")
            policy_counts[winner["policy"]] += 1
            planner_scores.append(winner["counterfactual"]["score"])
            rows.append(
                {
                    "id": candidate_id,
                    "project": project["id"],
                    "language": candidate.get("language"),
                    "score": candidate.get("similarity", {}).get("total"),
                    "left": left,
                    "right": right,
                    "label": prior["label"] if prior is not None else "unreviewed",
                    "recommended_policy": winner["policy"],
                    "counterfactual_score": winner["counterfactual"]["score"],
                    "reason_codes": winner["counterfactual"]["reasons"],
                }
            )
        missing_reviewed = [
            item["id"]
            for item in project["candidates"]
            if item["label"] != "unreviewed" and item["id"] not in returned_ids
        ]
        require(not missing_reviewed, "reviewed candidate disappeared")
    label_counts = {label: sum(row["label"] == label for row in rows) for label in LABELS}
    unresolved = label_counts["unreviewed"]
    denominator = label_counts["useful"] + label_counts["false_positive"]
    precision = None
    if unresolved == 0 and denominator:
        precision = round(label_counts["useful"] / denominator, 4)
    return {
        "schema_version": 1,
        "method": document["method"],
        "projects": len(document["projects"]),
        "candidate_count": len(rows),
        "reviewed_count": len(rows) - unresolved,
        "label_counts": label_counts,
        "payload_tokens": payload_tokens,
        "precision": precision,
        "partial_projects": partial_projects,
        "planner": {
            "algorithm": "counterfactual_refactor_v1",
            "llm_used": False,
            "validated_futures": len(rows) * 3,
            "policy_counts": policy_counts,
            "recommended_score_min": min(planner_scores) if planner_scores else None,
            "recommended_score_max": max(planner_scores) if planner_scores else None,
        },
        "rows": rows,
    }


def invoke(binary, document):
    frames = [
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2025-06-18",
                "capabilities": {},
                "clientInfo": {"name": "refactor-eval", "version": "1"},
            },
        }
    ]
    for request_id, project in enumerate(document["projects"], 2):
        frames.append(
            {
                "jsonrpc": "2.0",
                "id": request_id,
                "method": "tools/call",
                "params": {
                    "name": "suggest_refactors",
                    "arguments": {
                        "repo": project["repo"],
                        "scope": project["scope"],
                        "min_score": document["min_score"],
                        "limit": document["limit"],
                    },
                },
            }
        )
    started = time.perf_counter_ns()
    result = subprocess.run(
        [str(binary.resolve()), "serve", "--multi-repo", "--max-repos", "8"],
        input="".join(json.dumps(frame, separators=(",", ":")) + "\n" for frame in frames),
        text=True,
        capture_output=True,
        timeout=900,
        check=False,
    )
    if result.returncode != 0:
        raise ValueError(result.stderr.strip() or "MCP server failed")
    elapsed_ms = round((time.perf_counter_ns() - started) / 1_000_000, 3)
    responses = [json.loads(line) for line in result.stdout.splitlines()]
    require(len(responses) == len(frames), "incomplete MCP response set")
    return build_report(document, responses[1:]), elapsed_ms


def refresh_contract(document, report, path):
    by_project = {project["id"]: [] for project in document["projects"]}
    for row in report["rows"]:
        by_project[row["project"]].append(
            {
                "id": row["id"],
                "left": row["left"],
                "right": row["right"],
                "label": row["label"],
            }
        )
    for project in document["projects"]:
        project["candidates"] = by_project[project["id"]]
    path.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("binary", type=Path)
    parser.add_argument(
        "contract",
        nargs="?",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "contracts/refactor_candidates_v1.json",
    )
    parser.add_argument("--refresh-contract", action="store_true")
    parser.add_argument("--samples", type=int, default=3)
    args = parser.parse_args()
    try:
        document = json.loads(args.contract.read_text())
        validate_contract(document, check_repositories=True)
        require(3 <= args.samples <= 9, "samples must be 3..9")
        measured = [invoke(args.binary, document) for _ in range(args.samples)]
        report = measured[0][0]
        require(all(candidate == report for candidate, _ in measured[1:]), "planner output changed between samples")
        latencies = [elapsed for _, elapsed in measured]
        ordered = sorted(latencies)
        report["benchmark"] = {
            "samples": args.samples,
            "latency_ms": latencies,
            "median_ms": ordered[len(ordered) // 2],
            "deterministic": True,
            "scope": "one fresh multi-repo MCP process over seven frozen projects",
        }
        if args.refresh_contract:
            refresh_contract(document, report, args.contract)
        for project in document["projects"]:
            require(git(Path(project["repo"]), "rev-parse", "HEAD") == project["revision"], "snapshot changed during evaluation")
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"REFACTOR_EVAL=FAIL; {error}", file=sys.stderr)
        return 1
    print(json.dumps(report, indent=2, ensure_ascii=False))
    print(
        "REFACTOR_EVAL=PASS; "
        f"PROJECTS={report['projects']}; CANDIDATES={report['candidate_count']}; "
        f"REVIEWED={report['reviewed_count']}; TOKENS={report['payload_tokens']}; "
        f"PRECISION={report['precision']}; MEDIAN_MS={report['benchmark']['median_ms']}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
