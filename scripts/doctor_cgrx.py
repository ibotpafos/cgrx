#!/usr/bin/env python3
"""Report the exact CGRX executable and probe its stdio MCP lifecycle.

The report deliberately contains only executable metadata and a projection of
initialize/status responses. Environment values, source snippets, stderr, and
arbitrary MCP payloads are never emitted.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


PROTOCOL_VERSION = "2025-06-18"


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def resolve_executable(value):
    requested = Path(value).expanduser()
    if requested.parent == Path(".") and not requested.is_absolute():
        located = shutil.which(value)
        if located:
            requested = Path(located)
    requested = requested.absolute()
    canonical = requested.resolve(strict=True)
    if not canonical.is_file():
        raise ValueError("executable does not resolve to a regular file")
    if not os.access(canonical, os.X_OK):
        raise ValueError("resolved file is not executable")
    stat = canonical.stat()
    return {
        "requested": str(requested),
        "canonical": str(canonical),
        "is_symlink": requested.is_symlink(),
        "symlink_target": os.readlink(requested) if requested.is_symlink() else None,
        "sha256": sha256(canonical),
        "size": stat.st_size,
        "mtime_ns": stat.st_mtime_ns,
    }


def probe_version(executable, timeout):
    try:
        with tempfile.TemporaryDirectory(prefix="doctor-cgrx-version-") as directory:
            environment = os.environ.copy()
            environment.update(
                CGRX_INSTALL_PROBE="1",
                CGRX_CLIENT="doctor-cgrx",
                CGRX_LOG_DIR=str(Path(directory) / "usage"),
            )
            result = subprocess.run(
                [executable, "--version"],
                text=True,
                capture_output=True,
                timeout=timeout,
                env=environment,
            )
    except subprocess.TimeoutExpired:
        return {"exit_status": None, "value": None, "timed_out": True}
    value = result.stdout.strip() if result.returncode == 0 else None
    if value and ("\n" in value or len(value) > 160):
        value = None
    return {
        "exit_status": result.returncode,
        "value": value,
        "timed_out": False,
    }


def rpc_frames(repo):
    return [
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {},
                "clientInfo": {"name": "doctor-cgrx", "version": "1"},
            },
        },
        {"jsonrpc": "2.0", "method": "notifications/initialized"},
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": "status",
                "arguments": {"repo": repo, "paths_or_scope": []},
            },
        },
    ]


def projected_error(response):
    error = response.get("error") if isinstance(response, dict) else None
    if not isinstance(error, dict):
        return None
    data = error.get("data")
    typed = data.get("code") if isinstance(data, dict) else None
    return {
        "rpc_code": error.get("code") if isinstance(error.get("code"), int) else None,
        "error_code": typed if isinstance(typed, str) else None,
    }


def run_rpc(executable, repo, timeout):
    payload = "".join(json.dumps(frame, separators=(",", ":")) + "\n" for frame in rpc_frames(repo))
    try:
        with tempfile.TemporaryDirectory(prefix="doctor-cgrx-rpc-") as directory:
            environment = os.environ.copy()
            environment.update(
                CGRX_INSTALL_PROBE="1",
                CGRX_CLIENT="doctor-cgrx",
                CGRX_LOG_DIR=str(Path(directory) / "usage"),
            )
            result = subprocess.run(
                [executable, "serve", "--multi-repo"],
                input=payload,
                text=True,
                capture_output=True,
                timeout=timeout,
                env=environment,
            )
    except subprocess.TimeoutExpired:
        return {
            "process": {"exit_status": None, "timed_out": True},
            "responses": {},
            "generation_collision": False,
        }
    responses = {}
    raw_responses = []
    invalid_lines = 0
    for line in result.stdout.splitlines():
        try:
            response = json.loads(line)
        except json.JSONDecodeError:
            invalid_lines += 1
            continue
        raw_responses.append(response)
        if isinstance(response, dict) and response.get("id") in (1, 2):
            responses[response["id"]] = response
    combined_errors = json.dumps(
        [response.get("error") for response in raw_responses if isinstance(response, dict)],
        sort_keys=True,
    )
    return {
        "process": {
            "exit_status": result.returncode,
            "timed_out": False,
            "stdout_lines": len(result.stdout.splitlines()),
            "invalid_stdout_lines": invalid_lines,
            "stderr_bytes": len(result.stderr.encode()),
            "stderr_sha256": hashlib.sha256(result.stderr.encode()).hexdigest(),
        },
        "responses": responses,
        "generation_collision": (
            "generation is immutable and already exists" in combined_errors
            or "store_begin" in combined_errors
        ),
    }


def summarize_rpc(raw, drift):
    initialize = raw["responses"].get(1, {})
    status = raw["responses"].get(2, {})
    initialize_error = projected_error(initialize)
    status_error = projected_error(status)
    init_result = initialize.get("result", {}) if isinstance(initialize, dict) else {}
    server_info = init_result.get("serverInfo", {}) if isinstance(init_result, dict) else {}
    status_result = status.get("result", {}) if isinstance(status, dict) else {}
    structured = status_result.get("structuredContent", {}) if isinstance(status_result, dict) else {}
    snapshot = structured.get("snapshot", {}) if isinstance(structured, dict) else {}
    server_name = server_info.get("name") if isinstance(server_info, dict) else None
    server_version = server_info.get("version") if isinstance(server_info, dict) else None
    protocol_version = init_result.get("protocolVersion") if isinstance(init_result, dict) else None
    freshness = structured.get("freshness") if isinstance(structured, dict) else None
    repo_revision = snapshot.get("repo_revision") if isinstance(snapshot, dict) else None
    graph_generation = snapshot.get("graph_generation") if isinstance(snapshot, dict) else None
    initialize_ok = (
        initialize_error is None
        and server_name == "cgrx"
        and isinstance(server_version, str)
        and bool(server_version)
        and isinstance(protocol_version, str)
        and bool(protocol_version)
    )
    status_ok = (
        status_error is None
        and status_result.get("isError") is not True
        and freshness in ("WATCHED", "PINNED")
        and isinstance(repo_revision, str)
        and bool(repo_revision)
        and type(graph_generation) is int
    )
    summary = {
        "process": raw["process"],
        "initialize": {
            "ok": initialize_ok,
            "server_name": server_name,
            "server_version": server_version,
            "protocol_version": protocol_version,
            "error_code": initialize_error["error_code"] if initialize_error else None,
        },
        "status": {
            "ok": status_ok,
            "error_code": status_error["error_code"] if status_error else None,
            "freshness": freshness,
            "repo_revision": repo_revision,
            "graph_generation": graph_generation,
        },
    }
    if raw["process"].get("timed_out"):
        drift.append({"code": "jsonrpc_timeout", "action": "inspect launcher startup and writer lock state"})
    elif raw["process"].get("exit_status") != 0:
        drift.append({"code": "jsonrpc_process_failed", "action": "run the canonical executable directly and inspect local stderr"})
    if not summary["initialize"]["ok"]:
        drift.append({"code": "jsonrpc_initialize_failed", "action": "verify the launch target is a CGRX MCP executable"})
    if not summary["status"]["ok"]:
        drift.append({"code": "jsonrpc_status_failed", "action": "inspect the typed status error and managed generation state"})
    if raw["generation_collision"]:
        drift.append({
            "code": "generation_reactivation_missing",
            "action": "compare the launched executable with a build containing the existing-generation reactivation path",
        })
    return summary


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--executable", required=True)
    parser.add_argument("--reference-executable")
    parser.add_argument("--launcher")
    parser.add_argument("--metadata")
    parser.add_argument("--repo", required=True)
    parser.add_argument("--timeout", type=float, default=120.0)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)
    if not args.json:
        parser.error("--json is required")
    try:
        repo = Path(args.repo).expanduser().resolve(strict=True)
        if not repo.is_dir() or not (repo / ".git").exists():
            raise ValueError("repo must be an existing Git worktree root")
        executable = resolve_executable(args.executable)
        launcher = resolve_executable(args.launcher) if args.launcher else executable
        reference = resolve_executable(args.reference_executable) if args.reference_executable else None
    except (OSError, ValueError) as error:
        parser.error(str(error))

    drift = []
    metadata = None
    if args.metadata:
        try:
            raw_metadata = json.loads(Path(args.metadata).read_text())
            commit = raw_metadata.get("commit")
            recorded_hash = raw_metadata.get("sha256")
            command = raw_metadata.get("command")
            if not (
                isinstance(commit, str)
                and len(commit) == 40
                and all(character in "0123456789abcdefABCDEF" for character in commit)
                and isinstance(recorded_hash, str)
                and len(recorded_hash) == 64
                and all(character in "0123456789abcdefABCDEF" for character in recorded_hash)
                and isinstance(command, str)
                and len(command) <= 240
            ):
                raise ValueError("metadata fields are invalid")
            metadata = {
                "path": str(Path(args.metadata).expanduser().resolve(strict=True)),
                "commit": commit,
                "sha256": recorded_hash,
                "command_kind": "cargo_build" if command.startswith("cargo build ") else "other",
                "command_sha256": hashlib.sha256(command.encode()).hexdigest(),
                "hash_matches": recorded_hash == executable["sha256"],
            }
            if not metadata["hash_matches"]:
                drift.append({
                    "code": "metadata_hash_mismatch",
                    "action": "reconcile build metadata with the executable selected by the launcher",
                })
        except (OSError, ValueError, json.JSONDecodeError) as error:
            parser.error(str(error))
    if reference and reference["sha256"] != executable["sha256"]:
        drift.append({
            "code": "binary_hash_mismatch",
            "action": "coordinate launcher or installed-binary update, then restart the MCP client",
        })
    version = probe_version(launcher["canonical"], args.timeout)
    rpc = summarize_rpc(run_rpc(launcher["canonical"], str(repo), args.timeout), drift)
    probed = version.get("value")
    server_version = rpc["initialize"].get("server_version")
    if probed and server_version and probed.split()[-1] != server_version:
        drift.append({
            "code": "version_mismatch",
            "action": "verify the launcher does not dispatch to a different executable",
        })
    report = {
        "schema_version": 1,
        "result": "PASS" if not drift else "DRIFT",
        "executable": executable,
        "launcher": launcher,
        "reference": reference,
        "metadata": metadata,
        "version_probe": version,
        "jsonrpc": rpc,
        "drift": drift,
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if not drift else 1


if __name__ == "__main__":
    sys.exit(main())
