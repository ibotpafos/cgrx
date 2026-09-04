#!/usr/bin/env python3
"""Black-box regression for directory scopes through the public MCP transport."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile

binary = str(Path(sys.argv[1]).resolve())
with tempfile.TemporaryDirectory(prefix="cgrx-scopes-") as directory:
    repo = Path(directory)
    for name in ["main.py", "src/main.py", "src-other/main.py"]:
        path = repo / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("def target():\n    return 1\n")
    (repo / "dynamic.ts").write_text(
        "function run(service: any, method: string) { service[method](); }\n"
    )
    (repo / "README.md").write_text("# excluded fixture\n")
    def git(*args):
        subprocess.run(["git", "-C", directory, *args], check=True, capture_output=True)
    git("init", "-q")
    git("add", ".")
    git("-c", "user.name=CGRX Test", "-c", "user.email=test@example.invalid",
        "commit", "-qm", "scope fixture")
    frames = [
        {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {
            "protocolVersion": "2025-06-18", "capabilities": {},
            "clientInfo": {"name": "cgrx-scopes", "version": "1"}}},
        {"jsonrpc": "2.0", "method": "notifications/initialized"},
    ]
    cases = [(".", 4), ("./", 4), ("**", 4), ("src", 1),
             ("src/", 1), ("./src", 1), ("src/**", 1), ("main.py", 1)]
    for i, (scope, _) in enumerate(cases, 2):
        frames.append({"jsonrpc": "2.0", "id": i, "method": "tools/call", "params": {
            "name": "check_index_coverage", "arguments": {"repo": directory, "scopes": [scope]}}})
    for identifier, offset in [(90, 0), (91, 1)]:
        frames.append({"jsonrpc": "2.0", "id": identifier, "method": "tools/call", "params": {
            "name": "check_index_coverage", "arguments": {"repo": directory,
            "scopes": ["**"], "offset": offset, "limit": 1}}})
    frames.append({"jsonrpc": "2.0", "id": 100, "method": "tools/call", "params": {
        "name": "search_graph", "arguments": {"repo": directory, "query": "target",
        "scope": {"include": ["."], "exclude": ["src"]}, "limit": 10}}})
    result = subprocess.run([binary, "serve", "--multi-repo"],
        input="".join(json.dumps(frame) + "\n" for frame in frames),
        text=True, capture_output=True, timeout=60)
    assert result.returncode == 0, result.stderr
    responses = {r["id"]: r for r in map(json.loads, result.stdout.splitlines())}
    assert len(responses) == 12, responses
    for i, (scope, expected) in enumerate(cases, 2):
        response = responses[i]
        assert "error" not in response, response
        data = response["result"]["structuredContent"]["scopes"][0]
        assert data["indexed_paths"] == expected, (scope, data)
        assert data["status"] != "unknown", (scope, data)
    first = responses[90]["result"]["structuredContent"]["scopes"][0]
    second = responses[91]["result"]["structuredContent"]["scopes"][0]
    assert first["coverage_gap_count"] == 2 and first["returned"] == 1, first
    assert first["has_more"] is True and first["next_offset"] == 1, first
    assert second["returned"] == 1 and second["has_more"] is False, second
    assert first["gaps"] != second["gaps"], (first, second)
    matches = responses[100]["result"]["structuredContent"]["matches"]
    assert {m["path"] for m in matches} == {"main.py", "src-other/main.py"}, matches
print("SCOPE_MCP=PASS; coverage_cases=8; pagination=2/2; directory_exclusion=PASS")
