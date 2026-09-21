#!/usr/bin/env python3
"""Optional local Laya sidecar for CGRX semantic candidate scoring.

The server speaks cgrx.semantic-rerank.v1 over a Unix domain socket. CGRX keeps
all structural evidence authoritative: this process only returns a 0..1000
relevance hint for candidates CGRX already discovered.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import socket
import sys


SCHEMA = "cgrx.semantic-rerank.v1"
MAX_REQUEST_BYTES = 64 * 1024
MAX_CANDIDATES = 12


def validate_request(payload):
    if not isinstance(payload, dict) or set(payload) != {"schema", "task", "candidates"}:
        raise ValueError("invalid request fields")
    if payload["schema"] != SCHEMA:
        raise ValueError("unsupported schema")
    if not isinstance(payload["task"], str) or not payload["task"].strip():
        raise ValueError("task must be non-empty text")
    candidates = payload["candidates"]
    if not isinstance(candidates, list) or not 2 <= len(candidates) <= MAX_CANDIDATES:
        raise ValueError("candidate count outside supported range")
    seen = set()
    for candidate in candidates:
        if not isinstance(candidate, dict) or set(candidate) != {
            "node_id",
            "qualified_name",
            "path",
            "text",
        }:
            raise ValueError("invalid candidate fields")
        node_id = candidate["node_id"]
        if type(node_id) is not int or node_id < 0 or node_id in seen:
            raise ValueError("invalid candidate node_id")
        seen.add(node_id)
        for key in ("qualified_name", "path", "text"):
            if not isinstance(candidate[key], str):
                raise ValueError("candidate text fields must be strings")
    return payload


def candidate_instruction(candidate):
    excerpt = " ".join(candidate["text"].split())
    return (
        "Is this code candidate relevant to the developer task? "
        f"Symbol: {candidate['qualified_name']}. "
        f"Path: {candidate['path']}. "
        f"Code excerpt: {excerpt}"
    )


def score_request(router, payload, model=None):
    payload = validate_request(payload)
    questions = {
        str(candidate["node_id"]): {
            "type": "noul",
            "instructions": candidate_instruction(candidate),
        }
        for candidate in payload["candidates"]
    }
    result = router.predict(payload["task"], questions, model=model)
    answers = result.get("answers", {})
    scores = []
    for candidate in payload["candidates"]:
        node_id = candidate["node_id"]
        answer = answers.get(str(node_id), {})
        probability = answer.get("noul")
        if not isinstance(probability, (int, float)) or isinstance(probability, bool):
            raise ValueError(f"missing relevance probability for node {node_id}")
        relevance = round(max(0.0, min(1.0, float(probability))) * 1000)
        scores.append({"node_id": node_id, "relevance": relevance})
    return {"schema": SCHEMA, "scores": scores}


def read_request(connection):
    data = bytearray()
    while len(data) <= MAX_REQUEST_BYTES:
        chunk = connection.recv(min(4096, MAX_REQUEST_BYTES + 1 - len(data)))
        if not chunk:
            break
        data.extend(chunk)
        if b"\n" in chunk:
            break
    if len(data) > MAX_REQUEST_BYTES:
        raise ValueError("request exceeds size limit")
    line = bytes(data).split(b"\n", 1)[0]
    return json.loads(line.decode("utf-8"))


def serve(router, socket_path, model=None):
    path = Path(socket_path).expanduser().resolve()
    if path.exists():
        raise RuntimeError(f"socket already exists: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    try:
        server.bind(str(path))
        os.chmod(path, 0o600)
        server.listen(16)
        print(f"Laya reranker listening on {path}", flush=True)
        while True:
            connection, _ = server.accept()
            with connection:
                try:
                    payload = read_request(connection)
                    response = score_request(router, payload, model=model)
                    connection.sendall(json.dumps(response, separators=(",", ":")).encode() + b"\n")
                except Exception as exc:
                    print(f"rerank request failed: {exc}", file=sys.stderr, flush=True)
    finally:
        server.close()
        try:
            path.unlink()
        except FileNotFoundError:
            pass


def build_router(device=None, preload=False):
    from laya import Router

    router = Router(device=device, max_loaded=2)
    if preload:
        router.preload(["english", "multilingual"])
    return router


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--socket",
        default=f"/tmp/cgrx-laya-{os.getuid()}.sock",
        help="Unix socket path (default: per-user path under /tmp)",
    )
    parser.add_argument(
        "--model",
        choices=("auto", "english", "multilingual", "typed-decisions"),
        default="auto",
        help="Laya checkpoint selection; auto routes English/non-English per request",
    )
    parser.add_argument("--device", default=None, help="Laya device override, e.g. cpu, mps, cuda")
    parser.add_argument(
        "--preload",
        action="store_true",
        help="Preload English and multilingual checkpoints for stable warm latency",
    )
    args = parser.parse_args()
    router = build_router(device=args.device, preload=args.preload)
    model = None if args.model == "auto" else args.model
    serve(router, args.socket, model=model)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
