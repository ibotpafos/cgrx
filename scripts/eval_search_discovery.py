#!/usr/bin/env python3
"""Compare public MCP search discovery on one committed synthetic fixture.

This is a CGRX regression experiment, not a competitor or whole-task benchmark.
The optional baseline receives exactly the same fixture and requests, including
pagination requests unsupported by older binaries. Only candidate failures affect
the exit status. Both full structured results and compact model-visible rows are
checked, so omitted rows cannot count as successful discovery.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile


def fixture_files():
    return {
        "src/transport.ts": (
            "export function HTTPServer() { return 1; }\n"
            "export function HTTPServerFactory() { return HTTPServer(); }\n"
            "export function HTTPOnly() { return 0; }\n"
            'export function dispatch() { return "HTTPServer"; }\n'
        ),
        "src/cache.ts": (
            "export function replenish() {\n"
            "  const invalidate = true;\n"
            "  const cache = [1];\n"
            "  return invalidate ? cache.length : 0;\n"
            "}\n"
            "export function invalidateOnly() { const invalidate = true; return invalidate; }\n"
            "export function cacheOnly() { const cache = [1]; return cache.length; }\n"
            'export function bodySingle() { return "smoke_body_token"; }\n'
        ),
        "src/pages.ts": "".join(
            f"export function cursor_item_{index:02}() {{ return {index}; }}\n"
            for index in range(57)
        ),
        "other.py": (
            "def HTTPServer():\n    return 99\n\n"
            "def ОбновитьКэш():\n    return 1\n"
        ),
    }


def cases():
    page_symbols = [f"cursor_item_{index:02}" for index in range(57)]
    specifications = [
        ("acronym_name", {"query": "http server", "language": "typescript"},
         ["HTTPServer", "HTTPServerFactory"]),
        ("body_conjunction", {"query": "invalidate cache", "include_body": True,
                              "scope": "src/cache.ts"}, ["replenish"]),
        ("body_requires_opt_in", {"query": "invalidate cache", "scope": "src/cache.ts"}, []),
        ("legacy_literal_body", {"query": "smoke_body_token", "include_body": True},
         ["bodySingle"]),
        ("exact_name_precedence", {"query": "HTTPServer", "language": "typescript",
                                   "include_body": True},
         ["HTTPServer", "HTTPServerFactory", "dispatch"]),
        ("conjunction_negative", {"query": "http nonexistentzz", "include_body": True}, []),
        ("unicode_name", {"query": "обновить кэш", "language": "python"}, ["ОбновитьКэш"]),
        ("language_filter", {"query": "HTTPServer", "language": "python"}, ["HTTPServer"]),
        ("scope_filter", {"query": "http server", "scope": "other.py"}, ["HTTPServer"]),
        ("compact_fifty_rows", {"query": "cursor_item", "scope": "src/pages.ts", "limit": 50},
         page_symbols[:50]),
    ]
    result = [
        {"id": identifier, "arguments": arguments, "symbols": symbols,
         "total": 57 if identifier == "compact_fifty_rows" else len(symbols)}
        for identifier, arguments, symbols in specifications
    ]
    for offset in (0, 20, 40, 60):
        symbols = page_symbols[offset:offset + 20]
        result.append({
            "id": f"page_{offset}",
            "arguments": {"query": "cursor_item", "scope": "src/pages.ts",
                          "limit": 20, "offset": offset},
            "symbols": symbols,
            "page": {"offset": offset, "limit": 20,
                     "next_offset": offset + 20 if offset + 20 < 57 else None,
                     "has_more": offset + 20 < 57},
            "total": 57,
        })
    result.append({**result[0], "id": "acronym_repeat"})
    return result


def initialize_repo(repo, files):
    for name, source in files.items():
        destination = repo / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(source, encoding="utf-8")
    commands = [
        ["init", "-q"], ["add", "."],
        ["-c", "user.name=CGRX Eval", "-c", "user.email=eval@example.invalid",
         "-c", "commit.gpgsign=false", "commit", "-qm", "search discovery fixture"],
    ]
    for command in commands:
        subprocess.run(
            ["git", "-C", str(repo), *command], check=True, capture_output=True,
            env={**os.environ, "GIT_AUTHOR_DATE": "2026-10-11T00:00:00Z",
                 "GIT_COMMITTER_DATE": "2026-10-11T00:00:00Z"},
        )


def query(binary, repo, specifications, profile):
    frames = [{
        "jsonrpc": "2.0", "id": 1, "method": "initialize",
        "params": {"protocolVersion": "2025-06-18", "capabilities": {},
                   "clientInfo": {"name": "cgrx-search-discovery-eval", "version": "1"}},
    }, {"jsonrpc": "2.0", "method": "notifications/initialized"}]
    for request_id, case in enumerate(specifications, 2):
        frames.append({
            "jsonrpc": "2.0", "id": request_id, "method": "tools/call",
            "params": {"name": "search_graph",
                       "arguments": {"repo": str(repo), **case["arguments"]}},
        })
    process = subprocess.run(
        [str(binary), "serve", "--multi-repo", "--response-profile", profile],
        input="".join(json.dumps(frame, ensure_ascii=False) + "\n" for frame in frames),
        capture_output=True, text=True, timeout=120,
    )
    if process.returncode:
        raise RuntimeError(f"{profile} server exited {process.returncode}: {process.stderr[-2000:]}")
    responses = {}
    expected_ids = set(range(1, len(specifications) + 2))
    for line in process.stdout.splitlines():
        response = json.loads(line)
        request_id = response.get("id")
        if type(request_id) is not int or request_id not in expected_ids or request_id in responses:
            raise RuntimeError("unexpected or duplicate MCP response id")
        responses[request_id] = response
    if set(responses) != expected_ids or "error" in responses[1]:
        raise RuntimeError("incomplete MCP response set or initialize failed")
    return {case["id"]: responses[request_id]
            for request_id, case in enumerate(specifications, 2)}


def inspect_response(response, profile):
    if "error" in response:
        raise ValueError(json.dumps(response["error"], ensure_ascii=False))
    result = response.get("result", {})
    if result.get("isError"):
        raise ValueError(json.dumps(result.get("content", []), ensure_ascii=False))
    content = result.get("content", [])
    if len(content) != 1 or content[0].get("type") != "text":
        raise ValueError("expected exactly one model-visible text payload")
    payload = json.loads(content[0]["text"])
    columns = payload.get("cols", [])
    rows = payload.get("rows", [])
    if "symbol" not in columns or any(len(row) != len(columns) for row in rows):
        raise ValueError("missing symbol column or malformed compact rows")
    visible_rows = [dict(zip(columns, row)) for row in rows]
    if profile == "full":
        structured = result.get("structuredContent", {})
        structured_rows = structured.get("matches")
        if not isinstance(structured_rows, list):
            raise ValueError("missing structured matches")
        if [(row["symbol"], row["path"]) for row in visible_rows] != [
            (row["symbol"], row["path"]) for row in structured_rows
        ]:
            raise ValueError(f"compact rows omit search matches: {len(visible_rows)}/{len(structured_rows)}")
        if payload.get("n") != structured.get("total"):
            raise ValueError("compact and structured totals disagree")
    return payload, visible_rows, len(content[0]["text"].encode("utf-8"))


def evaluate(binary, repo, specifications):
    checks = []
    snapshots = set()
    page_snapshot_ids = set()
    for profile in ("full", "compact"):
        responses = query(binary, repo, specifications, profile)
        parsed = {}
        for case in specifications:
            check = {"case": case["id"], "profile": profile, "passed": False}
            try:
                payload, rows, visible_bytes = inspect_response(responses[case["id"]], profile)
                parsed[case["id"]] = (payload, rows)
                observed = [row["symbol"] for row in rows]
                check.update({"expected": case["symbols"], "observed": observed,
                              "model_visible_bytes": visible_bytes})
                if observed != case["symbols"]:
                    raise ValueError("search symbols or deterministic order differ")
                if "page" in case:
                    page = payload.get("page")
                    if not isinstance(page, dict) or any(
                        page.get(key) != value for key, value in case["page"].items()
                    ):
                        check["observed_page"] = page
                        raise ValueError("pagination metadata differs")
                    snapshot_id = page.get("snapshot_id", "")
                    if (not isinstance(snapshot_id, str) or len(snapshot_id) != 64
                            or any(character not in "0123456789abcdef" for character in snapshot_id)):
                        raise ValueError("missing full-digest pagination snapshot identity")
                    page_snapshot_ids.add(snapshot_id)
                if "total" in case and payload.get("n") != case["total"]:
                    raise ValueError("whole-query total differs")
                if any(not isinstance(row.get("symbol_ref"), str) for row in rows):
                    raise ValueError("a discovery row has no addressable symbol reference")
                if payload.get("at") is None:
                    raise ValueError("snapshot identity is missing")
                snapshots.add(json.dumps(payload["at"], sort_keys=True))
                check["passed"] = True
            except (KeyError, TypeError, ValueError) as error:
                check["reason"] = str(error)
            checks.append(check)
        first = parsed.get("acronym_name")
        repeat = parsed.get("acronym_repeat")
        checks.append({"case": "repeat_identity", "profile": profile,
                       "passed": first is not None and first == repeat})
    checks.append({"case": "snapshot_stability",
                   "passed": len(snapshots) == 1 and len(page_snapshot_ids) <= 1})
    return {
        "binary_sha256": hashlib.sha256(binary.read_bytes()).hexdigest(),
        "passed": sum(check["passed"] for check in checks),
        "checks": len(checks),
        "all_passed": all(check["passed"] for check in checks),
        "snapshot_tags": [json.loads(snapshot) for snapshot in sorted(snapshots)],
        "page_snapshot_ids": sorted(page_snapshot_ids),
        "results": checks,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("binary", type=Path, help="candidate CGRX executable")
    parser.add_argument("--baseline", type=Path, help="optional earlier CGRX executable")
    parser.add_argument("--output", type=Path, help="also write the JSON report to this path")
    args = parser.parse_args()
    specifications = cases()
    files = fixture_files()
    digest = hashlib.sha256(json.dumps(files, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    report = {"schema_version": 1, "method": "same synthetic source and public MCP queries",
              "fixture_sha256": digest, "scope": "search discovery and transport only",
              "query_count": len(specifications)}
    with tempfile.TemporaryDirectory(prefix="cgrx-search-discovery-") as directory:
        repo = Path(directory)
        initialize_repo(repo, files)
        report["fixture_revision"] = subprocess.check_output(
            ["git", "-C", str(repo), "rev-parse", "HEAD"], text=True,
        ).strip()
        if args.baseline:
            report["baseline"] = evaluate(args.baseline.resolve(), repo, specifications)
        report["candidate"] = evaluate(args.binary.resolve(), repo, specifications)
    encoded = json.dumps(report, indent=2, ensure_ascii=False, sort_keys=True)
    if args.output:
        args.output.write_text(encoded + "\n", encoding="utf-8")
    print(encoded)
    candidate = report["candidate"]
    print(f"SEARCH_DISCOVERY_EVAL={'PASS' if candidate['all_passed'] else 'FAIL'}; "
          f"CHECKS={candidate['passed']}/{candidate['checks']}")
    return 0 if candidate["all_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
