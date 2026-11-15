"""Offline GitHub MCP contract and boundary tests; run in the bridge's SDK environment."""
import asyncio
import base64
import hashlib
import json
import unittest

import github_mcp_bridge as bridge


def envelope(value):
    return {"content": [{"type": "text", "text": json.dumps(value)}], "isError": False}


def resource(source):
    return {"content": [{"type": "text", "text": "Downloaded text file"},
                        {"type": "resource", "resource": {"uri": "repo://public/source", "text": source}}]}


class Session:
    def __init__(self):
        self.calls = []

    async def call_tool(self, name, arguments):
        self.calls.append((name, arguments))
        if name == "search_code":
            return envelope({"total_count": 5, "items": [{"repository":"public/docs", "path":"AGENTS.md", "sha":"b"*40}] + [
                {"repository": name, "path": "src/cache.rs", "sha": "b" * 40}
                for name in ["private/secret", "public/one", "public/two", "public/three"]
            ]})
        if name == "search_repositories":
            repository = arguments["query"].split()[0]
            private = "user:private" in arguments["query"]
            return envelope({"items": [{"full_name": f"{'private' if private else 'public'}/{repository}",
                                        "private": private, "archived": False, "default_branch": "main",
                                        "license": {"spdx_id": "MIT"}}]})
        if name == "get_commit":
            return envelope({"sha": "a" * 40})
        if name == "get_file_contents":
            if arguments["path"] == "src/cache.rs":
                return resource(f"fn cache_{arguments['repo']}() {{ let mutex = 1; }}\n")
            if arguments["path"] == "Cargo.toml":
                return resource("[dependencies]\nnotify='6.1'\n")
            raise bridge.BridgeError("not_found")
        raise AssertionError(f"unexpected tool {name}")


TOOLS = [{"name": name, "inputSchema": {"properties": {key: {} for key in (
    "query", "perPage", "page", "minimal_output", "owner", "repo", "path", "sha", "detail"
)}}} for name in bridge.TOOLS]


class Contracts(unittest.IsolatedAsyncioTestCase):
    def test_resource_and_legacy_file_decoders_preserve_exact_source(self):
        source = "// Пример\r\nfn cache() {}\r\n"
        self.assertEqual(bridge.decode_file(resource(source)), source)
        legacy = envelope({"encoding": "base64", "content": base64.b64encode(source.encode()).decode()})
        self.assertEqual(bridge.decode_file(legacy), source)
        binary = {"content": [{"type": "resource", "resource": {"blob": base64.b64encode(source.encode()).decode()}}]}
        self.assertEqual(bridge.decode_file(binary), source)

    def test_large_resource_links_are_not_followed(self):
        with self.assertRaises(bridge.BridgeError) as failure:
            bridge.decode_file({"content": [{"type": "resource_link", "uri": "https://untrusted.invalid/file"}]})
        self.assertEqual(failure.exception.code, "file_too_large")

    def test_structured_and_legacy_search_outputs_and_repo_names(self):
        expected = {"items": [{"repository": "public/one"}]}
        self.assertEqual(bridge.decode_json({"structuredContent": expected}), expected)
        self.assertEqual(bridge.decode_json({"structured_content": expected}), expected)
        self.assertEqual(bridge.decode_json(envelope(expected)), expected)
        self.assertEqual(bridge.repository_name({"repository": {"full_name": "public/one"}}), "public/one")
        with self.assertRaises(bridge.BridgeError):
            bridge.repository_name({"repository": "public/one/../../private"})

    def test_errors_are_classified_without_propagating_secret_text(self):
        result = {"isError": True, "content": [{"type": "text", "text": "429 rate limit; Bearer PRIVATE_SENTINEL"}]}
        with self.assertRaises(bridge.BridgeError) as failure:
            bridge.decode_json(result)
        self.assertEqual(str(failure.exception), "rate_limited")
        self.assertEqual(bridge.classify_error(RuntimeError("Bearer PRIVATE_SENTINEL")), "mcp_unavailable")

    async def test_collect_skips_private_code_and_pins_public_fetches_to_commit_not_blob(self):
        session = Session()
        result = await bridge.Collector(session, TOOLS).collect({"queries": ["cache mutex"], "language": "Rust", "limit": 3})
        self.assertEqual(len(result["candidates"]), 3)
        self.assertIn("private_repository_skipped", result["issues"])
        self.assertIn("non_code_search_hit_skipped", result["issues"])
        self.assertIn("search_index_differed_from_pinned_source", result["issues"])
        file_calls = [arguments for name, arguments in session.calls if name == "get_file_contents"]
        self.assertTrue(file_calls)
        self.assertTrue(all(call["owner"] == "public" for call in file_calls))
        self.assertFalse(any(call.get("path") == "AGENTS.md" for call in file_calls))
        self.assertTrue(all(call["sha"] == "a" * 40 for call in file_calls))
        for candidate in result["candidates"]:
            source = candidate["source"].encode()
            expected = hashlib.sha1(b"blob " + str(len(source)).encode() + b"\0" + source).hexdigest()
            self.assertEqual(candidate["blob_sha"], expected)
            self.assertEqual(candidate["revision"], "a" * 40)
            self.assertEqual(candidate["dependencies"], {"notify": "6.1"})
        self.assertIn('language:"Rust"', session.calls[0][1]["query"])

    async def test_nearest_manifest_requirement_wins_over_workspace_fallback(self):
        class Manifests(Session):
            async def call_tool(self, name, arguments):
                if name == "get_file_contents" and arguments["path"].endswith("Cargo.toml"):
                    return resource("[dependencies]\nnotify='7'\n" if arguments["path"].startswith("crates/") else "[workspace.dependencies]\nnotify='6'\nserde='1'\n")
                return await super().call_tool(name, arguments)
        collector = bridge.Collector(Manifests(), TOOLS)
        async def file(owner, repo, path, revision):
            if path.endswith("cache.rs"):
                return "fn cache() { let mutex = 1; }\n"
            return "[dependencies]\nnotify='7'\n" if path.startswith("crates/") else "[workspace.dependencies]\nnotify='6'\nserde='1'\n"
        collector.file = file
        candidate = await collector.candidate({"repository": "public/one", "path": "crates/cache/src/cache.rs"}, 0, 1)
        self.assertEqual(candidate["dependencies"], {"notify": "7", "serde": "1"})


if __name__ == "__main__":
    unittest.main()
