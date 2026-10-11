#!/usr/bin/env python3
"""Scaffold a mistake-ledger case from pinned source evidence.

Verifies the repository is a clean canonical root at the given revision and
that every evidence file equals its committed blob, then prints a JSON case
skeleton to stdout. Never edits contracts itself: paste the skeleton into a
PR appending to contracts/mistake_ledger_v1.json. Never paste private
repositories, credentials, or raw logs; file evidence paths only.
"""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

from validate_ledger import RELATION_KINDS, RULE_KEYS, fixture_hashes


def fail(message):
    print(f"Invalid: {message}", file=sys.stderr)
    raise SystemExit(2)


def git(repo, *args):
    try:
        return subprocess.check_output(['git', '-C', str(repo), *args], stderr=subprocess.DEVNULL)
    except (OSError, subprocess.CalledProcessError):
        fail('Git evidence unavailable')


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True, help="absolute canonical Git worktree root")
    parser.add_argument("--revision", required=True, help="40-hex HEAD the evidence was read from")
    parser.add_argument("--kind", required=True, choices=("false_positive", "false_negative"))
    parser.add_argument("--rule-key", required=True, choices=RULE_KEYS,
                        help="entry of the frozen RULE_KEYS table")
    parser.add_argument("--relation-kind", choices=RELATION_KINDS, default="CALLS",
                        help="relationship being checked (default: CALLS)")
    parser.add_argument("--cgrx-version", default="v0.1.0-alpha.7",
                        help="observed engine version; legacy default: v0.1.0-alpha.7")
    parser.add_argument("--extraction-revision", type=int, default=28,
                        help="observed engine extraction revision; legacy default: 28")
    parser.add_argument("--caller", required=True, help="CALLER_SYMBOL:repo/relative/path.ext")
    parser.add_argument("--target", required=True, help="TARGET_SYMBOL:repo/relative/path.ext")
    parser.add_argument("--reported-from", required=True, help="opaque origin ref, no raw logs")
    parser.add_argument("--id", required=True, help="stable case id, e.g. fp-java-overloaded-ctor-002")
    parser.add_argument("--synthetic", action="store_true",
                        help="evidence lives in fixtures/mistake-ledger/<fixture>")
    parser.add_argument("--fixture", default="", help="fixture directory name (synthetic only)")
    args = parser.parse_args()

    if not args.cgrx_version.strip() or args.extraction_revision <= 0:
        fail('invalid observed engine provenance')

    repo = args.repo
    if not (Path(repo).is_absolute() and str(Path(repo).resolve()) == repo):
        fail('noncanonical repo')
    if not re.fullmatch(r'[0-9a-f]{40}', args.revision):
        fail('invalid revision')
    if git(repo, 'rev-parse', '--show-toplevel').decode().strip() != repo:
        fail('not canonical Git root')
    if git(repo, 'rev-parse', 'HEAD').decode().strip() != args.revision:
        fail('stale revision; re-read evidence at current HEAD')
    if git(repo, 'status', '--porcelain').decode().strip():
        fail('dirty worktree; commit or stash first')

    refs = {}
    for role, spec in (("caller", args.caller), ("target", args.target)):
        if spec.count(':') != 1:
            fail('use SYMBOL:path for --' + role)
        symbol, path = spec.split(':')
        if not re.fullmatch(r'[A-Za-z_$][A-Za-z0-9_$.]*', symbol or ''):
            fail('invalid ' + role + ' symbol')
        rel = Path(path or '')
        if not str(path) or rel.is_absolute() or '..' in rel.parts or rel.as_posix() != path:
            fail('unsafe ' + role + ' path')
        full = Path(repo) / rel
        if str(full.resolve()) != str(full):
            fail('symlink evidence forbidden')
        blob = git(repo, 'show', '%s:%s' % (args.revision, path))
        if not full.is_file() or full.read_bytes() != blob:
            fail('evidence differs from committed blob')
        refs[role] = {"symbol": symbol, "path": path,
                      "sha256": hashlib.sha256(blob).hexdigest()}

    case = {
        "id": args.id,
        "rule_key": args.rule_key,
        "kind": args.kind,
        "caller": {"symbol": refs["caller"]["symbol"], "path": refs["caller"]["path"]},
        "target": {"symbol": refs["target"]["symbol"], "path": refs["target"]["path"]},
        "reported_from": args.reported_from,
        "cgrx_version": args.cgrx_version,
        "extraction_revision": args.extraction_revision,
        "date": datetime.date.today().isoformat(),
    }
    if args.relation_kind != "CALLS":
        case["relation_kind"] = args.relation_kind
    if args.synthetic:
        if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]*', args.fixture or ''):
            fail('invalid fixture name')
        case["repo_kind"] = "synthetic"
        case["fixture"] = args.fixture
        prefix = Path('fixtures') / 'mistake-ledger' / args.fixture
        for role in ('caller', 'target'):
            try:
                relative = Path(refs[role]['path']).relative_to(prefix)
            except ValueError:
                fail(role + ' must be inside the named synthetic fixture')
            case[role]['path'] = relative.as_posix()
        recorded = {}
        paths = git(repo, 'ls-tree', '-r', '--name-only', '-z', args.revision,
                    '--', prefix.as_posix()).decode().split('\0')
        for path in paths:
            if not path:
                continue
            relative = Path(path).relative_to(prefix)
            full = Path(repo) / path
            if str(full.resolve()) != str(full):
                fail('symlink evidence forbidden')
            blob = git(repo, 'show', '%s:%s' % (args.revision, path))
            if not full.is_file() or full.read_bytes() != blob:
                fail('fixture differs from committed evidence')
            recorded[relative.as_posix()] = hashlib.sha256(blob).hexdigest()
        if not recorded or any(case[role]['path'] not in recorded for role in ('caller', 'target')):
            fail('synthetic fixture needs committed caller/target files')
        directory = Path(repo) / prefix
        try:
            actual = fixture_hashes(directory)
        except ValueError as exc:
            fail(str(exc))
        if actual != recorded:
            fail('fixture contains files outside its committed evidence')
        case["fixture_sha256"] = recorded
    else:
        case["repo_kind"] = "public_clone"
        case["repo"] = repo
        case["revision"] = args.revision
        case["evidence"] = {
            "caller": {"path": refs["caller"]["path"], "sha256": refs["caller"]["sha256"]},
            "target": {"path": refs["target"]["path"], "sha256": refs["target"]["sha256"]},
        }
    print(json.dumps(case, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
