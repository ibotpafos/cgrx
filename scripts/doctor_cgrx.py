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
import math
import re
import selectors
import signal
import time


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


MAX_OUTPUT_BYTES = 1024 * 1024
VERSION = re.compile(r"[0-9]{1,6}\.[0-9]{1,6}\.[0-9]{1,6}")
ERROR_CODES = {"cgrx.repository_unavailable", "cgrx.store_busy", "store_busy",
               "cgrx.invalid_arguments", "cgrx.stale_snapshot"}


def bounded_process(argv, timeout, payload=b"", environment=None):
    """Bound both pipes together and kill the owned POSIX process group on all exits.

    No stderr bytes escape this helper. A daemon that deliberately creates a new
    session is outside this process-group guarantee; no existing daemon is killed.
    """
    status = dict(exit_status=None, timed_out=False, output_limited=False,
                  spawn_failed=False, cleanup_failed=False)
    if os.name != "posix":
        status["spawn_failed"] = True
        return status, b""
    process = None
    selector = selectors.DefaultSelector()
    stdout = bytearray()
    stderr_hash = hashlib.sha256()
    received = stderr_bytes = 0
    try:
        process = subprocess.Popen(argv, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, env=environment, start_new_session=True)
        for stream, label in [(process.stdout, "out"), (process.stderr, "err")]:
            os.set_blocking(stream.fileno(), False)
            selector.register(stream, selectors.EVENT_READ, label)
        if payload:
            os.set_blocking(process.stdin.fileno(), False)
            selector.register(process.stdin, selectors.EVENT_WRITE, "in")
        else:
            process.stdin.close()
        remaining = memoryview(payload)
        deadline = time.monotonic() + timeout
        while selector.get_map():
            left = deadline - time.monotonic()
            if left <= 0:
                status["timed_out"] = True
                break
            for key, _ in selector.select(min(left, .05)):
                if key.data == "in":
                    try:
                        written = os.write(key.fd, remaining[:4096])
                        remaining = remaining[written:]
                    except BrokenPipeError:
                        remaining = remaining[:0]
                    if not remaining:
                        selector.unregister(key.fileobj); key.fileobj.close()
                    continue
                chunk = os.read(key.fd, min(65536, MAX_OUTPUT_BYTES - received + 1))
                if not chunk:
                    selector.unregister(key.fileobj); key.fileobj.close()
                    continue
                if received + len(chunk) > MAX_OUTPUT_BYTES:
                    status["output_limited"] = True
                    break
                received += len(chunk)
                if key.data == "out": stdout.extend(chunk)
                else:
                    stderr_bytes += len(chunk); stderr_hash.update(chunk)
            if status["output_limited"]: break
        # Closing stdout/stderr does not mean the process has exited.
        if not status["timed_out"] and not status["output_limited"]:
            try: process.wait(timeout=max(.001, deadline-time.monotonic()))
            except subprocess.TimeoutExpired: status["timed_out"] = True
    except (OSError, ValueError):
        status["spawn_failed"] = True
    finally:
        selector.close()
        if process is not None:
            try: os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError: pass
            except OSError: status["cleanup_failed"] = True
            for stream in [process.stdin, process.stdout, process.stderr]:
                stream.close()
            try: process.wait(timeout=1)
            except subprocess.TimeoutExpired: status["cleanup_failed"] = True
            status["exit_status"] = process.returncode
    status.update(stderr_bytes=stderr_bytes, stderr_sha256=stderr_hash.hexdigest(),
                  captured_bytes=received)
    return status, bytes(stdout)


def probe_environment(directory):
    environment = os.environ.copy()
    environment.update(CGRX_INSTALL_PROBE="1", CGRX_CLIENT="doctor-cgrx",
                       CGRX_LOG_DIR=str(Path(directory) / "usage"))
    return environment


def process_ok(status):
    return status.get("exit_status") == 0 and not any(status.get(key) for key in
        ("timed_out", "output_limited", "spawn_failed", "cleanup_failed"))


def probe_version(executable, timeout):
    with tempfile.TemporaryDirectory(prefix="doctor-cgrx-version-") as directory:
        status, data = bounded_process([executable, "--version"], timeout,
                                       environment=probe_environment(directory))
    try: value = data.decode("utf-8").strip()
    except UnicodeDecodeError: value = ""
    valid = value.startswith("cgrx ") and VERSION.fullmatch(value[5:]) is not None
    status.update(value=value if process_ok(status) and valid else None, invalid_output=not valid)
    return status


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


def strict_json(data):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result: raise ValueError("duplicate key")
            result[key] = value
        return result
    def invalid(_): raise ValueError("nonfinite number")
    def finite(value):
        parsed = float(value)
        if not math.isfinite(parsed): raise ValueError("nonfinite number")
        return parsed
    return json.loads(data, object_pairs_hook=pairs, parse_constant=invalid, parse_float=finite)


def projected_error(response):
    error = response.get("error") if isinstance(response, dict) else None
    if not isinstance(error, dict): return None
    data = error.get("data")
    typed = data.get("code") if isinstance(data, dict) else None
    return {"error_code": typed if isinstance(typed,str) and typed in ERROR_CODES else "unknown"}


def run_rpc(executable, repo, timeout):
    payload = "".join(json.dumps(frame, separators=(",", ":")) + "\n" for frame in rpc_frames(repo)).encode()
    with tempfile.TemporaryDirectory(prefix="doctor-cgrx-rpc-") as directory:
        status, data = bounded_process([executable, "serve", "--multi-repo"], timeout,
                                      payload, probe_environment(directory))
    responses, invalid_lines, collision = {}, 0, False
    for line in data.splitlines():
        try:
            response = strict_json(line)
            if not isinstance(response,dict) or response.get("jsonrpc") != "2.0":
                raise ValueError("envelope")
            request_id = response.get("id")
            if type(request_id) is not int or request_id not in (1,2) or request_id in responses:
                raise ValueError("id")
            if ("result" in response) == ("error" in response): raise ValueError("result/error")
            responses[request_id] = response
            error = response.get("error")
            collision |= isinstance(error,dict) and "generation is immutable and already exists" in json.dumps(error)
        except (ValueError, UnicodeError, RecursionError): invalid_lines += 1
    status.update(stdout_lines=len(data.splitlines()), invalid_stdout_lines=invalid_lines)
    return {"process":status, "responses":responses, "generation_collision":collision}


def object_value(value):
    return value if isinstance(value,dict) else {}


def revision_valid(value):
    return isinstance(value,str) and re.fullmatch(r"[0-9a-f]{40}|[0-9a-f]{64}",value) is not None


def summarize_rpc(raw, drift, expected_repo=None, expected_revision=None):
    initialize = raw["responses"].get(1, {})
    status = raw["responses"].get(2, {})
    initialize_error, status_error = projected_error(initialize), projected_error(status)
    init_result = object_value(initialize.get("result"))
    server_info = object_value(init_result.get("serverInfo"))
    status_result = object_value(status.get("result"))
    structured = object_value(status_result.get("structuredContent"))
    snapshot = object_value(structured.get("snapshot"))
    version = server_info.get("version")
    version_valid = isinstance(version,str) and VERSION.fullmatch(version) is not None
    protocol_valid = init_result.get("protocolVersion") == PROTOCOL_VERSION
    initialize_ok = ("error" not in initialize and server_info.get("name") == "cgrx"
                     and version_valid and protocol_valid and isinstance(init_result.get("capabilities"),dict))
    revision = snapshot.get("repo_revision")
    generation = snapshot.get("graph_generation")
    matched_revision = revision_valid(revision) and revision == expected_revision
    generation_valid = type(generation) is int and 0 <= generation < 2**64
    freshness = structured.get("freshness")
    freshness_valid = isinstance(freshness,str) and freshness in ("WATCHED","PINNED")
    status_ok = ("error" not in status and status_result.get("isError",False) is False
                 and freshness_valid and matched_revision and generation_valid
                 and expected_repo is not None and structured.get("repo") == expected_repo)
    summary = {"process":raw["process"],
        "initialize":{"ok":bool(initialize_ok), "server_name":"cgrx" if server_info.get("name") == "cgrx" else None,
                      "server_version":version if version_valid else None,
                      "protocol_version":PROTOCOL_VERSION if protocol_valid else None,
                      "error_code":initialize_error["error_code"] if initialize_error else None},
        "status":{"ok":bool(status_ok), "error_code":status_error["error_code"] if status_error else None,
                  "freshness":freshness if freshness_valid else None,
                  "repo_revision":revision if matched_revision else None,
                  "graph_generation":generation if generation_valid else None}}
    process = raw["process"]
    if not process_ok(process):
        drift.append({"code":"jsonrpc_timeout" if process.get("timed_out") else "jsonrpc_process_failed",
                      "action":"inspect bounded process outcome and launcher"})
    if process.get("invalid_stdout_lines"):
        drift.append({"code":"jsonrpc_invalid_output","action":"check RPC framing/schema"})
    if not initialize_ok: drift.append({"code":"jsonrpc_initialize_failed","action":"check protocol and server identity"})
    if not status_ok: drift.append({"code":"jsonrpc_status_failed","action":"check repository and snapshot identity"})
    if raw["generation_collision"]:
        drift.append({"code":"generation_reactivation_missing","action":"check managed generation reactivation"})
    return summary


def git_identity(repo, timeout):
    outputs = []
    for field in ("--show-toplevel", "HEAD"):
        status, data = bounded_process(["git","-C",str(repo),"rev-parse",field],timeout)
        if not process_ok(status): raise ValueError("Git identity unavailable")
        outputs.append(data.decode("utf-8").strip())
    if str(Path(outputs[0]).resolve()) != str(repo) or not revision_valid(outputs[1]):
        raise ValueError("Git identity mismatch")
    return outputs[1]


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
    if not math.isfinite(args.timeout) or not .01 <= args.timeout <= 300:
        parser.error("timeout must be finite and between .01 and 300 seconds")
    try:
        repo = Path(args.repo).expanduser().resolve(strict=True)
        if not repo.is_dir() or not (repo / ".git").exists():
            raise ValueError("repo must be an existing Git worktree root")
        revision = git_identity(repo, args.timeout)
        executable = resolve_executable(args.executable)
        launcher = resolve_executable(args.launcher) if args.launcher else executable
        reference = resolve_executable(args.reference_executable) if args.reference_executable else None
    except (OSError, ValueError) as error:
        parser.error("invalid or unavailable input metadata")

    drift = []
    metadata = None
    if args.metadata:
        try:
            with Path(args.metadata).expanduser().open("rb") as stream:
                metadata_bytes = stream.read(65537)
            if len(metadata_bytes) > 65536: raise ValueError("metadata budget")
            raw_metadata = strict_json(metadata_bytes)
            if not isinstance(raw_metadata,dict): raise ValueError("metadata object required")
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
        except (OSError, ValueError, RecursionError) as error:
            parser.error("invalid or unavailable input metadata")
    if reference and reference["sha256"] != executable["sha256"]:
        drift.append({
            "code": "binary_hash_mismatch",
            "action": "coordinate launcher or installed-binary update, then restart the MCP client",
        })
    attested = launcher["canonical"] == executable["canonical"]
    if not attested:
        drift.append({"code":"launch_identity_unverified","action":"invoke the selected executable directly or its canonical symlink"})
    version = probe_version(launcher["canonical"], args.timeout)
    if not process_ok(version) or version["value"] is None:
        drift.append({"code":"version_probe_failed","action":"check bounded version probe"})
    rpc = summarize_rpc(run_rpc(launcher["canonical"], str(repo), args.timeout), drift, str(repo), revision)
    try:
        stable = (git_identity(repo,args.timeout) == revision and
                  all(sha256(Path(item["canonical"])) == item["sha256"] for item in (executable,launcher)))
    except (OSError,ValueError): stable = False
    if not stable:
        attested = False
        drift.append({"code":"identity_changed","action":"retry with stable repository and executable files"})
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
        "launch_identity": {"status":"attested" if attested else "unverified",
                            "basis":"same_canonical_file_before_after" if attested else None,
                            "scope":"invoked_file_only; downstream dispatch is unverified"},
        "version_probe": version,
        "jsonrpc": rpc,
        "drift": drift,
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if not drift else 1


if __name__ == "__main__":
    sys.exit(main())
