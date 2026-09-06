#!/usr/bin/env python3
"""End-to-end stdio MCP smoke test on a temporary synthetic repository."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile

binary = str(Path(sys.argv[1]).resolve())
with tempfile.TemporaryDirectory(prefix="cgrx-smoke-") as directory:
    repo = Path(directory)
    (repo / "main.py").write_text(
        "def target():\n    return 'smoke_body_token'\n\ndef caller():\n    return target()\n\n"
        "def save(value):\n    pass\n\ndef first(input_value):\n    prepared = input_value + 1\n"
        "    save(prepared)\n    return prepared\n\ndef second(value):\n    output = value + 9\n"
        "    save(output)\n    return output\n"
    )
    def git(*args):
        subprocess.run(["git", "-C", directory, *args], check=True, capture_output=True)
    git("init", "-q")
    git("add", "main.py")
    git("-c", "user.name=CGRX Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "fixture")
    frames = [
        {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {
            "protocolVersion": "2025-06-18", "capabilities": {},
            "clientInfo": {"name": "cgrx-smoke", "version": "1"}}},
        {"jsonrpc": "2.0", "method": "notifications/initialized"},
        {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
        {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {
            "name": "trace_path", "arguments": {"repo": directory, "symbol": "target",
            "path": "main.py", "direction": "callers", "depth": 1, "limit": 10}}},
        {"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {
            "name": "search_graph", "arguments": {"repo": directory,
            "query": "smoke_body_token", "language": "python", "include_body": True}}},
        {"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {
            "name": "get_outline", "arguments": {"repo": directory,
            "path": "main.py", "limit": 20}}},
        {"jsonrpc": "2.0", "id": 6, "method": "tools/call", "params": {
            "name": "find_usages", "arguments": {"repo": directory,
            "symbol": "target", "path": "main.py", "limit": 20}}},
        {"jsonrpc": "2.0", "id": 7, "method": "tools/call", "params": {
            "name": "suggest_refactors", "arguments": {"repo": directory,
            "scope": "main.py", "language": "python", "min_score": 760, "limit": 20}}},
    ]
    result = subprocess.run([binary, "serve", "--multi-repo"],
                            input="".join(json.dumps(f) + "\n" for f in frames),
                            text=True, capture_output=True, timeout=60)
    assert result.returncode == 0, result.stderr
    responses = [json.loads(line) for line in result.stdout.splitlines()]
    assert len(responses) == 7, responses
    assert all("error" not in r for r in responses), responses
    assert len(responses[1]["result"]["tools"]) == 11, responses[1]
    nodes = responses[2]["result"]["structuredContent"]["nodes"]
    assert len(nodes) == 1 and nodes[0]["symbol"] == "caller", responses[2]
    matches = responses[3]["result"]["structuredContent"]["matches"]
    assert len(matches) == 1 and matches[0]["symbol"] == "target", responses[3]
    assert matches[0]["matched_by"] == "body", responses[3]
    symbols = responses[4]["result"]["structuredContent"]["symbols"]
    assert [item["symbol"] for item in symbols] == ["target", "caller", "save", "first", "second"], responses[4]
    usages = responses[5]["result"]["structuredContent"]["usages"]
    assert len(usages) == 1 and usages[0]["source"]["symbol"] == "caller", responses[5]
    assert usages[0]["confidence"] == "PROVEN", responses[5]
    assert usages[0]["hop"] == 1 and usages[0]["via"]["symbol"] == "target", responses[5]
    assert responses[5]["result"]["structuredContent"]["depth"] == 1, responses[5]
    refactors = responses[6]["result"]["structuredContent"]
    assert refactors["total"] == 1 and refactors["status"] == "hypothetical", responses[6]
    assert set(refactors["snapshot"]) == {"repo_revision", "working_tree_digest", "graph_generation"}, responses[6]
    assert refactors["candidates"][0]["projection"]["remove"] == [], responses[6]
    visible = json.loads(responses[6]["result"]["content"][0]["text"])
    assert visible["payload_tokens"] > 0, visible
print("MCP_SMOKE=PASS; TOOLS=11; CALLER=caller; BODY_SEARCH=target; OUTLINE=5; USAGES=1; REFACTORS=1")
