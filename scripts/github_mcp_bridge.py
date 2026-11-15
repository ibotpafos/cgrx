#!/usr/bin/env -S uv run --quiet --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["mcp==2.3.0", "httpx2==2.10.0"]
# ///
"""Optional read-only official GitHub MCP bridge for CGRX implementation examples.

Receives public code queries, a language and a result limit over stdin. Project
paths, manifests and local source never enter this process through the protocol.
Credentials remain inside the bridge; stdout contains bounded source evidence.
"""

import argparse
import asyncio
import base64
import hashlib
import json
import logging
import os
import re
import subprocess
import sys
import tomllib

import httpx2
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

PROTOCOL = "cgrx.github-examples.v1"
ENDPOINT = "https://api.githubcopilot.com/mcp/x/repos/readonly"
TOOLS = ("search_code", "search_repositories", "get_commit", "get_file_contents")
MAX_SOURCE_BYTES = 96 * 1024
MAX_INPUT_BYTES = 8 * 1024
MAX_OUTPUT_BYTES = 2 * 1024 * 1024
MAX_CALLS = 45
CODE_EXTENSIONS = {"rs", "ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "go", "java", "kt", "kts", "c", "h", "cc", "cpp", "hpp", "cs", "rb", "php", "swift"}


class BridgeError(Exception):
    def __init__(self, code):
        self.code = code
        super().__init__(code)


def plain(value):
    if isinstance(value, dict):
        return value
    return value.model_dump(mode="json", by_alias=True)


def content_blocks(result):
    return plain(result).get("content", [])


def check_result(result):
    data = plain(result)
    if data.get("isError", data.get("is_error", False)):
        # Classify failures without forwarding upstream text, headers or tokens.
        text = " ".join(str(block.get("text", "")) for block in data.get("content", []))
        lowered = text.lower()
        if "rate limit" in lowered or "429" in lowered:
            raise BridgeError("rate_limited")
        if "401" in lowered or "bad credentials" in lowered:
            raise BridgeError("authentication_required")
        if "404" in lowered or "not found" in lowered:
            raise BridgeError("not_found")
        raise BridgeError("tool_failed")
    return data


def decode_json(result):
    data = check_result(result)
    structured = data.get("structuredContent", data.get("structured_content"))
    if structured is not None:
        return structured
    for block in data.get("content", []):
        if block.get("type") == "text":
            try:
                return json.loads(block["text"])
            except (ValueError, KeyError):
                continue
    raise BridgeError("invalid_response")


def decode_file(result):
    data = check_result(result)
    for block in data.get("content", []):
        if block.get("type") == "resource":
            resource = block.get("resource", {})
            if "text" in resource:
                source = resource["text"]
            elif "blob" in resource:
                try:
                    source = base64.b64decode(resource["blob"], validate=True).decode("utf-8")
                except (ValueError, UnicodeError):
                    raise BridgeError("unsupported_file") from None
            else:
                continue
            if len(source.encode("utf-8")) > MAX_SOURCE_BYTES:
                raise BridgeError("file_too_large")
            return source
        if block.get("type") == "resource_link":
            # Do not follow arbitrary returned URLs or download unbounded files.
            raise BridgeError("file_too_large")
    # Older servers return the GitHub Contents object as JSON in a text block.
    legacy = decode_json(result)
    if isinstance(legacy, dict) and legacy.get("encoding") == "base64":
        try:
            source = base64.b64decode(legacy["content"]).decode("utf-8")
        except (ValueError, KeyError, UnicodeError):
            raise BridgeError("unsupported_file") from None
        if len(source.encode("utf-8")) > MAX_SOURCE_BYTES:
            raise BridgeError("file_too_large")
        return source
    raise BridgeError("unsupported_file")


def token():
    for name in ("GH_TOKEN", "GITHUB_TOKEN", "GITHUB_PERSONAL_ACCESS_TOKEN"):
        value = os.environ.get(name, "").strip()
        if value:
            if any(character.isspace() for character in value):
                raise BridgeError("authentication_required")
            return value
    try:
        result = subprocess.run(
            ["gh", "auth", "token", "--hostname", "github.com"],
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, timeout=10,
        )
    except (OSError, subprocess.TimeoutExpired):
        raise BridgeError("authentication_required") from None
    value = result.stdout.strip()
    if result.returncode or not value or any(character.isspace() for character in value):
        raise BridgeError("authentication_required")
    return value


def repository_name(hit):
    repository = hit.get("repository", "")
    if isinstance(repository, dict):
        repository = repository.get("full_name", "")
    if not isinstance(repository, str) or not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repository) or any(part in (".", "..") for part in repository.split("/")):
        raise BridgeError("invalid_response")
    return repository


def valid_path(path):
    return isinstance(path, str) and bool(path) and not path.startswith("/") and "\\" not in path and all(
        part not in ("", ".", "..") for part in path.split("/")
    ) and not any(ord(character) < 32 for character in path)


def blob_sha(source):
    encoded = source.encode("utf-8")
    return hashlib.sha1(b"blob " + str(len(encoded)).encode("ascii") + b"\0" + encoded).hexdigest()


def dependencies(source, path):
    result = {}
    try:
        if path.endswith("Cargo.toml"):
            document = tomllib.loads(source)
            for section in (document.get("dependencies", {}), document.get("workspace", {}).get("dependencies", {})):
                for name, value in section.items():
                    if isinstance(value, str):
                        result[name] = value
                    elif isinstance(value, dict) and "version" in value and "path" not in value:
                        result[value.get("package", name)] = str(value["version"])
        elif path.endswith("package.json"):
            document = json.loads(source)
            for section in ("dependencies", "peerDependencies"):
                result.update({name: value for name, value in document.get(section, {}).items() if isinstance(value, str)})
        elif path == "pyproject.toml":
            document = tomllib.loads(source)
            for dependency in document.get("project", {}).get("dependencies", []):
                match = re.match(r"([A-Za-z0-9_.-]+)(.*)", dependency)
                if match:
                    result[match[1]] = match[2]
        elif path == "go.mod":
            for line in source.splitlines():
                match = re.match(r"\s*(?:require\s+)?(\S+)\s+(v\S+)", line)
                if match:
                    result[match[1]] = match[2]
    except (ValueError, TypeError, AttributeError):
        return {}
    # Remote metadata is advisory and cannot grow the Rust response unboundedly.
    return dict(sorted(result.items())[:64])


def manifest_paths(path):
    extension = path.rsplit(".", 1)[-1]
    if extension == "rs":
        manifest = "Cargo.toml"
    elif extension in ("ts", "tsx", "js", "jsx", "mjs", "cjs"):
        manifest = "package.json"
    elif extension == "go":
        return ["go.mod"]
    elif extension == "py":
        return ["pyproject.toml"]
    else:
        return []
    prefix = path.split("/src/", 1)[0] if "/src/" in path else path.rsplit("/", 1)[0] if "/" in path else ""
    nearest = f"{prefix}/{manifest}" if prefix else manifest
    return list(dict.fromkeys([nearest, manifest]))


def classify_error(error):
    if isinstance(error, BridgeError):
        return error.code
    if isinstance(error, (TimeoutError, asyncio.TimeoutError)):
        return "request_timeout"
    if isinstance(error, BaseExceptionGroup):
        codes = [classify_error(child) for child in error.exceptions]
        return next((code for code in codes if code != "mcp_unavailable"), "mcp_unavailable")
    status = getattr(getattr(error, "response", None), "status_code", None)
    if status in (401, 403):
        return "authentication_required"
    if status == 429:
        return "rate_limited"
    return "mcp_unavailable"


class Collector:
    def __init__(self, session, tools):
        self.session = session
        self.tools = {tool["name"]: tool for tool in tools}
        self.calls = 0
        self.manifests = {}
        self.repositories = {}
        self.issues = set()

    async def call(self, name, arguments):
        self.calls += 1
        if self.calls > MAX_CALLS:
            raise BridgeError("request_budget_exhausted")
        schema = self.tools[name].get("inputSchema", self.tools[name].get("input_schema", {}))
        properties = schema.get("properties", {})
        # Keep optional arguments compatible with the actually advertised server.
        arguments = {key: value for key, value in arguments.items() if key in properties}
        result = await self.session.call_tool(name, arguments)
        check_result(result)
        return result

    async def file(self, owner, repo, path, revision):
        properties = self.tools["get_file_contents"].get("inputSchema", self.tools["get_file_contents"].get("input_schema", {})).get("properties", {})
        selector = {"sha": revision} if "sha" in properties else {"ref": revision}
        result = await self.call("get_file_contents", {"owner": owner, "repo": repo, "path": path, **selector})
        return decode_file(result)

    async def metadata(self, name):
        if name in self.repositories:
            return self.repositories[name]
        owner, repo = name.split("/", 1)
        result = await self.call("search_repositories", {
            "query": f"{repo} in:name user:{owner} fork:true", "perPage": 10,
            "minimal_output": False,
        })
        items = decode_json(result).get("items", [])
        metadata = next((item for item in items if item.get("full_name", "").lower() == name.lower()), None)
        if metadata is None:
            raise BridgeError("repository_metadata_missing")
        if metadata.get("private") is True or metadata.get("visibility") == "private":
            raise BridgeError("private_repository_skipped")
        if metadata.get("private") is not False and metadata.get("visibility") != "public":
            raise BridgeError("repository_visibility_unknown")
        if metadata.get("archived"):
            raise BridgeError("archived_repository_skipped")
        commit = decode_json(await self.call("get_commit", {
            "owner": owner, "repo": repo, "sha": metadata.get("default_branch", "HEAD"),
            "detail": "none", "include_diff": False,
        }))
        revision = commit.get("sha", "")
        if not re.fullmatch(r"[0-9a-fA-F]{40}", revision):
            raise BridgeError("invalid_response")
        license_data = metadata.get("license") or {}
        license_id = license_data.get("spdx_id") if isinstance(license_data, dict) else None
        metadata = (revision, license_id if license_id not in ("NOASSERTION", "OTHER") else None)
        self.repositories[name] = metadata
        return metadata

    async def candidate(self, hit, query_index, rank):
        name = repository_name(hit)
        path = hit.get("path", "")
        if not valid_path(path):
            raise BridgeError("invalid_response")
        owner, repo = name.split("/", 1)
        revision, license_id = await self.metadata(name)
        source = await self.file(owner, repo, path, revision)
        declared = {}
        for manifest in manifest_paths(path):
            key = (name, revision, manifest)
            if key not in self.manifests:
                try:
                    self.manifests[key] = dependencies(await self.file(owner, repo, manifest, revision), manifest)
                except BridgeError as error:
                    if error.code in ("authentication_required", "rate_limited"):
                        raise
                    self.manifests[key] = {}
            for dependency, requirement in self.manifests[key].items():
                declared.setdefault(dependency, requirement)
        current_blob = blob_sha(source)
        if hit.get("sha") and hit["sha"] != current_blob:
            self.issues.add("search_index_differed_from_pinned_source")
        return {"repository": name, "path": path, "revision": revision,
                "blob_sha": current_blob, "source": source, "license": license_id,
                "dependencies": declared, "query_index": query_index, "search_rank": rank}

    async def collect(self, request):
        hits = []
        for query_index, query in enumerate(request["queries"]):
            language = request.get("language")
            if language and "language:" not in query:
                query += f' language:"{language}"'
            try:
                found = decode_json(await self.call("search_code", {"query": query, "perPage": 25, "page": 1}))
                if found.get("incomplete_results"):
                    self.issues.add("search_results_incomplete")
                hits.extend((hit, query_index, rank) for rank, hit in enumerate(found.get("items", []), 1))
            except BridgeError as error:
                if error.code == "authentication_required":
                    raise
                self.issues.add(error.code)
        # Interleave queries rather than letting the first query occupy every slot.
        hits.sort(key=lambda item: (item[2], item[1]))
        seen = set()
        candidates = []
        for hit, query_index, rank in hits:
            if len(candidates) >= min(request["limit"] + 3, 8) or self.calls >= MAX_CALLS - 5:
                break
            try:
                path = hit.get("path", "")
                if not valid_path(path) or path.rsplit(".", 1)[-1] not in CODE_EXTENSIONS:
                    self.issues.add("non_code_search_hit_skipped")
                    continue
                name = repository_name(hit)
                if name.lower() in seen:
                    continue
                candidates.append(await self.candidate(hit, query_index, rank))
                seen.add(name.lower())
            except BridgeError as error:
                if error.code == "authentication_required":
                    raise
                self.issues.add(error.code)
                if error.code in ("private_repository_skipped", "archived_repository_skipped", "repository_visibility_unknown", "repository_metadata_missing"):
                    seen.add(name.lower())
                if error.code in ("rate_limited", "request_budget_exhausted"):
                    break
        return {"protocol": PROTOCOL, "candidates": candidates, "issues": sorted(self.issues)}


async def search(request):
    headers = {"Authorization": f"Bearer {token()}", "X-MCP-Readonly": "true", "X-MCP-Toolsets": "repos"}
    async with httpx2.AsyncClient(headers=headers, timeout=httpx2.Timeout(30.0, read=40.0)) as http:
        async with streamable_http_client(ENDPOINT, http_client=http, max_sse_event_size=MAX_OUTPUT_BYTES) as (read, write):
            async with ClientSession(read, write, read_timeout_seconds=30.0) as session:
                await session.initialize()
                advertised = await session.list_tools()
                tools = [plain(tool) for tool in advertised.tools]
                if not set(TOOLS).issubset(tool["name"] for tool in tools):
                    raise BridgeError("tool_missing")
                return await Collector(session, tools).collect(request)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stdio", action="store_true", required=True)
    parser.parse_args()
    logging.disable(logging.CRITICAL)
    try:
        raw = sys.stdin.buffer.read(MAX_INPUT_BYTES + 1)
        if len(raw) > MAX_INPUT_BYTES:
            raise BridgeError("invalid_request")
        request = json.loads(raw)
        if request.get("protocol") != PROTOCOL or not isinstance(request.get("queries"), list) or not 1 <= len(request["queries"]) <= 3:
            raise BridgeError("invalid_request")
        if any(not isinstance(query, str) or not query.strip() or len(query) > 512 for query in request["queries"]):
            raise BridgeError("invalid_request")
        if request.get("limit") not in (3, 4, 5):
            raise BridgeError("invalid_request")
        response = asyncio.run(asyncio.wait_for(search(request), timeout=105.0))
    except Exception as error:
        response = {"protocol": PROTOCOL, "error": classify_error(error), "candidates": []}
    encoded = json.dumps(response, ensure_ascii=False, separators=(",", ":"))
    if len(encoded.encode("utf-8")) > MAX_OUTPUT_BYTES:
        encoded = json.dumps({"protocol": PROTOCOL, "error": "output_too_large", "candidates": []})
    print(encoded)


if __name__ == "__main__":
    main()
