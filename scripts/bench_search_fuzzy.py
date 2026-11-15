#!/usr/bin/env python3
"""Pair bounded fuzzy search timings with complete public MCP payload parity.

Both binaries use the same baseline-built static index. Query recipes and
hashes describe the 16k identifier without copying it into the report. Warm
latencies come from CGRX_USAGE_LOG; no timing value is a CI threshold.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import tempfile

from bench_search_latency import binary_metadata, checked_run, measure, summary


def digest(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def canonical_digest(value):
    return digest(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":")))


def repeated(character, count, substitutions=()):
    characters = [character] * count
    for index, replacement in substitutions:
        characters[index] = replacement
    return "".join(characters), {
        "operation": "repeat_then_substitute", "character": character, "count": count,
        "substitutions": [{"index": index, "character": replacement}
                          for index, replacement in substitutions],
    }


def fixture(directory, length):
    root = directory / "repo"
    root.mkdir()
    long_name = "a" * length
    short_names = ["cot", "cotExtra", "cat", "coat", "cut", "x", "δοκιμή", "ОбновитьКэш", "İstanbul"]
    sources = {
        "long.rs": f"fn {long_name}() {{}}\n",
        "short.rs": "".join(f"fn {name}() {{}}\n" for name in short_names),
        "unicode.rs": "fn cət() {}\n",
    }
    for name, source in sources.items():
        (root / name).write_text(source, encoding="utf-8")
    for arguments in (
        ["init", "-q"], ["add", "."],
        ["-c", "user.name=CGRX Benchmark", "-c", "user.email=bench@example.invalid",
         "-c", "commit.gpgsign=false", "commit", "-qm", "bounded fuzzy search fixture"],
    ):
        checked_run(["git", "-C", str(root), *arguments], env={
            **os.environ, "GIT_AUTHOR_DATE": "2026-10-11T00:00:00Z",
            "GIT_COMMITTER_DATE": "2026-10-11T00:00:00Z",
        })
    metadata = {
        "commit": checked_run(["git", "-C", str(root), "rev-parse", "HEAD"]).stdout.strip(),
        "definitions": len(short_names) + 2,
        "long_identifier": {"recipe": {"operation": "repeat", "character": "a", "count": length},
                            "chars": len(long_name), "bytes": len(long_name.encode()),
                            "sha256": digest(long_name)},
        "files": [{"path": name, "bytes": len(source.encode()), "sha256": digest(source)}
                  for name, source in sorted(sources.items())],
    }
    return root, metadata, {long_name: "long_a", "cət": "cət",
                            **{name: name for name in short_names}}


def specifications(length):
    cases = []

    def long_case(name, character, count, substitutions=(), expected=()):
        query, recipe = repeated(character, count, substitutions)
        cases.append((name, {"query": query, "scope": "long.rs", "limit": 50},
                      recipe, list(expected)))

    long_case("equal_length_miss", "b", length)
    long_case("one_edit_hit", "a", length, [(length // 2, "b")], ["long_a"])
    long_case("three_edits_hit", "a", length,
              [(0, "b"), (length // 2, "b"), (length - 1, "b")], ["long_a"])
    long_case("four_edits_miss", "a", length,
              [(0, "b"), (length // 3, "b"), (2 * length // 3, "b"), (length - 1, "b")])
    long_case("length_guard_miss", "b", length + 4)
    for name, query, expected in (
        ("normal_rank", "cot", ["cot", "cotExtra", "cat", "coat", "cut"]),
        ("unicode_scalar_edit", "δοκιμα", ["δοκιμή"]),
        ("unicode_camel_edit", "ОбновитбКэш", ["ОбновитьКэш"]),
        ("unicode_lowercase_expansion_edit", "İstanbuł", ["İstanbul"]),
        ("unicode_literal_casefold", "İSTANBUL", ["İstanbul"]),
        ("whitespace_excludes_fuzzy", "co t", []),
        ("empty_tokens_excludes_fuzzy", "_", []),
        ("snake_identifier_preserves_fuzzy", "co_t", ["cot", "coat"]),
    ):
        cases.append((name, {"query": query, "scope": "short.rs", "limit": 50},
                      {"operation": "literal", "value": query}, expected))
    cases.append(("unicode_scalar_threshold", {"query": "cot", "scope": "unicode.rs", "limit": 50},
                  {"operation": "literal", "value": "cot"}, ["cət"]))
    return cases


def source_metadata(root):
    commit = checked_run(["git", "rev-parse", "HEAD"], cwd=root).stdout.strip()
    tree = checked_run(["git", "rev-parse", "HEAD^{tree}"], cwd=root).stdout.strip()
    tracked_diff = checked_run(
        ["git", "diff", "HEAD", "--", "Cargo.toml", "Cargo.lock", "rust-toolchain.toml", "crates"],
        cwd=root,
    ).stdout
    untracked = checked_run(
        ["git", "ls-files", "--others", "--exclude-standard", "--", "crates"], cwd=root,
    ).stdout.splitlines()
    untracked_rust = [{"path": path, "sha256": hashlib.sha256((root / path).read_bytes()).hexdigest()}
                      for path in sorted(untracked) if path.endswith((".rs", "Cargo.toml"))]
    return {"commit": commit, "tree": tree, "tracked_rust_diff_sha256": digest(tracked_diff),
            "has_tracked_rust_changes": bool(tracked_diff), "untracked_rust_files": untracked_rust}


def complete_status(binary, state):
    frames = [
        {"jsonrpc": "2.0", "id": 0, "method": "initialize", "params": {}},
        {"jsonrpc": "2.0", "id": 1, "method": "tools/call",
         "params": {"name": "status", "arguments": {}}},
    ]
    output = checked_run(
        [str(binary), "serve", "--state", str(state), "--response-profile", "full"],
        input="".join(json.dumps(frame) + "\n" for frame in frames),
        env={**os.environ, "CGRX_RESPONSE_PROFILE": "full", "CGRX_TOOLSET": "standard"},
    ).stdout
    responses = [json.loads(line) for line in output.splitlines()]
    if [response.get("id") for response in responses] != [0, 1] or any(
        "error" in response or response.get("result", {}).get("isError")
        for response in responses
    ):
        raise RuntimeError("complete status request failed")
    return responses[1]["result"]


def run(args):
    baseline, candidate = args.baseline.resolve(), args.candidate.resolve()
    cases = specifications(args.identifier_chars)
    requests = [(name, arguments) for name, arguments, _, _ in cases]
    with tempfile.TemporaryDirectory(prefix="cgrx-search-fuzzy-") as temporary:
        directory = Path(temporary)
        root, fixture_metadata, labels = fixture(directory, args.identifier_chars)
        state = directory / "state"
        index = json.loads(checked_run([str(baseline), "index", "--root", str(root),
                                       "--state", str(state), "--json"]).stdout)
        baseline_complete_status = complete_status(baseline, state)
        status, before = measure(baseline, state, requests, args.warmup + args.samples,
                                 directory / "baseline.jsonl")
        candidate_status, after = measure(candidate, state, requests, args.warmup + args.samples,
                                          directory / "candidate.jsonl")
        candidate_complete_status = complete_status(candidate, state)
        if (baseline_complete_status != candidate_complete_status
                or status != candidate_status
                or baseline_complete_status.get("structuredContent") != status
                or candidate_complete_status.get("structuredContent") != candidate_status):
            raise RuntimeError("baseline and candidate complete status payloads differ")
        results = []
        for name, arguments, recipe, expected in cases:
            old = [row for row in before if row["case"] == name]
            new = [row for row in after if row["case"] == name]
            if len(old) != len(new) or len(old) != args.warmup + args.samples:
                raise RuntimeError(f"{name}: request count differs")
            for old_row, new_row in zip(old, new):
                if old_row["result"] != new_row["result"]:
                    raise RuntimeError(f"{name}: complete MCP result payload differs")
                if old_row["result"] != old[0]["result"]:
                    raise RuntimeError(f"{name}: repeated result is not deterministic")
            payload = old[0]["result"]["structuredContent"]
            observed = [labels[row["symbol"]] for row in payload["matches"]]
            if observed != expected or payload["total"] != len(expected) or payload["truncated"]:
                raise RuntimeError(f"{name}: synthetic expected-result contract differs")
            compact = json.loads(old[0]["result"]["content"][0]["text"])
            symbol_index = compact["cols"].index("symbol")
            if [labels[row[symbol_index]] for row in compact["rows"]] != observed:
                raise RuntimeError(f"{name}: compact rows omit or reorder structured matches")
            old_samples = [row["latency_us"] for row in old[args.warmup:]]
            new_samples = [row["latency_us"] for row in new[args.warmup:]]
            old_summary, new_summary = summary(old_samples), summary(new_samples)
            query = arguments["query"]
            results.append({
                "case": name, "query": {"recipe": recipe, "chars": len(query),
                                         "bytes": len(query.encode()), "sha256": digest(query)},
                "other_arguments": {key: value for key, value in arguments.items() if key != "query"},
                "expected_labels": expected, "returned_labels": observed,
                "matched_by": [row["matched_by"] for row in payload["matches"]],
                "returned": len(observed), "total": payload["total"],
                "full_payload_parity": True, "complete_result_sha256": canonical_digest(old[0]["result"]),
                "baseline": {**old_summary, "samples_us": old_samples},
                "candidate": {**new_summary, "samples_us": new_samples},
                "p50_speedup": round(old_summary["p50_us"] / max(1, new_summary["p50_us"]), 3),
            })
        fixture_metadata.update({"graph_nodes": status["graph"]["nodes"],
                                 "graph_edges": status["graph"]["edges"],
                                 "coverage_gap_count": status["coverage_gap_count"],
                                 "snapshot": index["snapshot"]})
        report = {
            "schema_version": 1, "measurement": "CGRX_USAGE_LOG latency_us, static public stdio MCP",
            "scope": "selected CGRX fuzzy-search queries, not competitor or agent-task performance",
            "timing_is_ci_threshold": False, "full_payload_parity": True,
            "complete_status_parity": True,
            "complete_status_sha256": canonical_digest(baseline_complete_status),
            "platform": platform.platform(), "baseline": binary_metadata(baseline),
            "candidate": binary_metadata(candidate), "baseline_source_commit": args.baseline_commit,
            "baseline_source_tree": args.baseline_tree,
            "candidate_source": source_metadata(args.candidate_source.resolve()),
            "declared_build": {"profile": args.build_profile, "rust_toolchain": args.rust_toolchain},
            "fixture": fixture_metadata, "warmup_rounds": args.warmup,
            "measured_rounds": args.samples, "query_cases": len(cases), "results": results,
            "excluded_from_request_latency": ["fixture creation", "indexing", "process startup",
                                              "static-runtime open", "source refresh"],
        }
        rendered = json.dumps(report, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(rendered, encoding="utf-8")
        print(rendered, end="")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("baseline", type=Path)
    parser.add_argument("candidate", type=Path)
    parser.add_argument("--candidate-source", type=Path, required=True)
    parser.add_argument("--baseline-commit")
    parser.add_argument("--baseline-tree")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--build-profile", default="release")
    parser.add_argument("--rust-toolchain", default="1.89.0")
    parser.add_argument("--identifier-chars", type=int, default=16_000)
    parser.add_argument("--samples", type=int, default=15)
    parser.add_argument("--warmup", type=int, default=3)
    args = parser.parse_args()
    if args.identifier_chars < 16 or args.samples < 1 or args.warmup < 0:
        parser.error("identifier-chars must be at least16; samples positive; warmup nonnegative")
    run(args)


if __name__ == "__main__":
    main()
