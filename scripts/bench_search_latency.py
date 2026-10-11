#!/usr/bin/env python3
"""Compare static MCP search latency while requiring complete payload parity.

Timing is descriptive, never a CI threshold. Both binaries read the same
baseline-built snapshot; indexing, process startup and source refresh are
excluded from per-request timings recorded by CGRX's public usage log.
"""

import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import statistics
import subprocess
import tempfile


def checked_run(arguments, **kwargs):
    result = subprocess.run(arguments, capture_output=True, text=True, timeout=120, **kwargs)
    if result.returncode:
        raise RuntimeError(f"{arguments[0]} exited {result.returncode}: {result.stderr[-2000:]}")
    return result


def fixture(directory, nodes, fanout, body_repetitions):
    root = directory / "repo"
    root.mkdir()
    sources = {
        "graph.rs": "".join(
            f"fn node_{index:04}() {{ "
            + " ".join(f"node_{(index + step + 1) % nodes:04}();" for step in range(fanout))
            + " }\n"
            for index in range(nodes)
        ),
        "marker.rs": "fn marker() {}\n",
        "body.rs": "fn body_payload() { /* "
        + "cacheKey expiryPolicy repeated_value " * body_repetitions
        + " */ }\n",
    }
    for name, source in sources.items():
        (root / name).write_text(source, encoding="utf-8")
    for arguments in (
        ["init", "-q"],
        ["add", "."],
        ["-c", "user.name=CGRX Benchmark", "-c", "user.email=bench@example.invalid",
         "-c", "commit.gpgsign=false", "commit", "-qm", "search latency fixture"],
    ):
        checked_run(["git", "-C", str(root), *arguments], env={
            **os.environ, "GIT_AUTHOR_DATE": "2026-10-11T00:00:00Z",
            "GIT_COMMITTER_DATE": "2026-10-11T00:00:00Z",
        })
    return root, {name: len(source.encode("utf-8")) for name, source in sources.items()}


def specifications(nodes):
    return [
        ("empty", {"query": "absent requested", "limit": 1}),
        ("isolated_marker", {"query": "marker", "limit": 1}),
        ("connected_symbol", {"query": "node_0000", "limit": 1}),
        ("fifty_row_page", {"query": "node_", "limit": 50}),
        ("late_offset", {"query": "node_", "limit": 50, "offset": max(0, nodes - 50)}),
        ("body_token_hit", {"query": "cache expiry", "scope": "body.rs", "include_body": True}),
        ("body_token_miss", {"query": "cache missing_term", "scope": "body.rs", "include_body": True}),
        ("body_literal", {"query": "repeated_value", "scope": "body.rs", "include_body": True}),
    ]


def measure(binary, state, cases, rounds, usage_log):
    frames = [json.dumps({"jsonrpc": "2.0", "id": 0, "method": "initialize", "params": {}})]
    frames.append(json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                              "params": {"name": "status", "arguments": {}}}))
    labels = {}
    for round_index in range(rounds):
        for name, arguments in cases:
            request_id = len(labels) + 2
            labels[request_id] = (name, round_index)
            frames.append(json.dumps({"jsonrpc": "2.0", "id": request_id, "method": "tools/call",
                                      "params": {"name": "search_graph", "arguments": arguments}}))
    result = checked_run(
        [str(binary), "serve", "--state", str(state), "--response-profile", "full"],
        input="\n".join(frames) + "\n",
        env={**os.environ, "CGRX_USAGE_LOG": str(usage_log),
             "CGRX_RESPONSE_PROFILE": "full", "CGRX_TOOLSET": "standard"},
    )
    responses = [json.loads(line) for line in result.stdout.splitlines()]
    if [response.get("id") for response in responses] != list(range(len(labels) + 2)):
        raise RuntimeError("missing, duplicate or unordered MCP response")
    for response in responses:
        if "error" in response or response.get("result", {}).get("isError"):
            raise RuntimeError(f"MCP request failed: {response}")
    events = [json.loads(line) for line in usage_log.read_text().splitlines()]
    if len(events) != len(labels) + 1 or events[0]["tool"] != "status":
        raise RuntimeError("usage log does not match tool requests")
    measured = []
    for response, event in zip(responses[2:], events[1:]):
        if event["tool"] != "search_graph" or not event["ok"]:
            raise RuntimeError("missing successful search latency event")
        name, round_index = labels[response["id"]]
        measured.append({"case": name, "round": round_index,
                         "latency_us": event["latency_us"], "result": response["result"]})
    return responses[1]["result"]["structuredContent"], measured


def summary(values):
    values = sorted(values)
    return {"samples": len(values), "p50_us": statistics.median(values),
            "p95_us": values[math.ceil(len(values) * .95) - 1],
            "min_us": values[0], "max_us": values[-1]}


def binary_metadata(binary):
    return {"sha256": hashlib.sha256(binary.read_bytes()).hexdigest(),
            "version": checked_run([str(binary), "--version"]).stdout.strip(),
            "bytes": binary.stat().st_size}


def run(args):
    baseline = args.baseline.resolve()
    candidate = args.candidate.resolve()
    with tempfile.TemporaryDirectory(prefix="cgrx-search-latency-") as temporary:
        directory = Path(temporary)
        root, sizes = fixture(directory, args.nodes, args.fanout, args.body_repetitions)
        state = directory / "state"
        index = json.loads(checked_run([str(baseline), "index", "--root", str(root),
                                       "--state", str(state), "--json"]).stdout)
        cases = specifications(args.nodes)
        status, before = measure(baseline, state, cases, args.warmup + args.samples,
                                 directory / "baseline.jsonl")
        candidate_status, after = measure(candidate, state, cases, args.warmup + args.samples,
                                          directory / "candidate.jsonl")
        if status != candidate_status:
            raise RuntimeError("baseline and candidate status payloads differ")
        results = []
        for name, arguments in cases:
            old = [row for row in before if row["case"] == name]
            new = [row for row in after if row["case"] == name]
            if len(old) != len(new):
                raise RuntimeError(f"{name}: request counts differ")
            for old_row, new_row in zip(old, new):
                if old_row["result"] != new_row["result"]:
                    raise RuntimeError(f"{name}: complete MCP result payloads differ")
                if old_row["result"] != old[0]["result"]:
                    raise RuntimeError(f"{name}: repeated baseline result is not deterministic")
            old_summary = summary([row["latency_us"] for row in old[args.warmup:]])
            new_summary = summary([row["latency_us"] for row in new[args.warmup:]])
            result = old[0]["result"]["structuredContent"]
            results.append({"case": name, "arguments": arguments, "full_payload_parity": True,
                            "returned": len(result["matches"]), "total": result["total"],
                            "baseline": old_summary, "candidate": new_summary,
                            "p50_speedup": round(old_summary["p50_us"] / max(1, new_summary["p50_us"]), 3)})
        source_root = Path(__file__).resolve().parents[1]
        source_commit = checked_run(["git", "rev-parse", "HEAD"], cwd=source_root).stdout.strip()
        source_diff = checked_run(["git", "diff", "HEAD", "--", "Cargo.toml", "Cargo.lock",
                                   "rust-toolchain.toml", "crates"], cwd=source_root).stdout
        report = {"schema_version": 1, "measurement": "CGRX_USAGE_LOG latency_us, static stdio MCP",
                  "timing_is_ci_threshold": False, "full_payload_parity": True,
                  "platform": platform.platform(), "baseline": binary_metadata(baseline),
                  "candidate": binary_metadata(candidate),
                  "baseline_source_commit": args.baseline_commit,
                  "candidate_source": {"commit": source_commit,
                                       "tracked_rust_diff_sha256": hashlib.sha256(source_diff.encode()).hexdigest(),
                                       "has_tracked_rust_changes": bool(source_diff)},
                  "declared_build": {"profile": args.build_profile, "rust_toolchain": args.rust_toolchain},
                  "fixture": {"definitions": args.nodes + 2, "graph_nodes": status["graph"]["nodes"],
                              "graph_edges": status["graph"]["edges"], "fanout": args.fanout,
                              "source_bytes": sum(sizes.values()), "file_bytes": sizes,
                              "coverage_gap_count": status["coverage_gap_count"],
                              "snapshot": index["snapshot"]},
                  "warmup_rounds": args.warmup, "measured_rounds": args.samples, "results": results}
        rendered = json.dumps(report, indent=2, sort_keys=True) + "\n"
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(rendered)
        print(rendered, end="")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("baseline", type=Path)
    parser.add_argument("candidate", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--baseline-commit", help="Source commit used to build the baseline binary")
    parser.add_argument("--build-profile", default="release", help="Declared profile for both binaries")
    parser.add_argument("--rust-toolchain", default="1.89.0", help="Declared toolchain for both binaries")
    parser.add_argument("--nodes", type=int, default=1000)
    parser.add_argument("--fanout", type=int, default=20)
    parser.add_argument("--body-repetitions", type=int, default=100_000)
    parser.add_argument("--warmup", type=int, default=5)
    parser.add_argument("--samples", type=int, default=25)
    args = parser.parse_args()
    if args.nodes < 1 or not 0 <= args.fanout < args.nodes or args.body_repetitions < 1:
        parser.error("nodes and body-repetitions must be positive; fanout must be 0..nodes-1")
    if args.warmup < 0 or args.samples < 1:
        parser.error("warmup must be nonnegative and samples positive")
    run(args)


if __name__ == "__main__":
    main()
