#!/usr/bin/env python3
"""Validate the deterministic mistake ledger offline.

Every observed engine mistake becomes a permanent, hash-pinned case:
false positives must never resolve, false negatives must always resolve.
Synthetic fixtures must equal their recorded bytes; public clones must equal
their committed revision. This checks ledger integrity, never engine output.
"""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import re
import stat
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "mistake-ledger"

# Frozen rule-key table. Renaming is forbidden; additions are additive only.
RULE_KEYS = (
    "syntax_plain",
    "rust_module",
    "rust_self",
    "go_field",
    "go_local_ctor",
    "go_self",
    "go_import",
    "ts_lexical",
    "java_ctor",
    "syntax_java_receiver",
    "syntax_other",
)

# These are the relationship kinds advertised by trace_path. Missing
# relation_kind preserves the original call-only ledger contract.
RELATION_KINDS = ("CALLS", "IMPLEMENTS", "CONTAINS")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def fields(obj, required, optional=()):
    require(isinstance(obj, dict), 'expected object')
    require(set(required) <= obj.keys() <= set(required) | set(optional), 'invalid fields')


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def digest(data):
    return hashlib.sha256(data).hexdigest()


def fixture_hashes(directory):
    """Pin every materialized byte, including hidden source and ignore files."""
    directory = Path(directory)
    actual = {}

    def visit(full):
        require(full.name.casefold() != '.git', 'Git metadata forbidden in fixture')
        mode = full.lstat().st_mode
        require(not stat.S_ISLNK(mode), 'symlink fixture evidence forbidden')
        if stat.S_ISDIR(mode):
            for child in sorted(full.iterdir()):
                visit(child)
        else:
            require(stat.S_ISREG(mode), 'special fixture evidence forbidden')
            actual[full.relative_to(directory).as_posix()] = digest(full.read_bytes())

    try:
        visit(directory)
    except OSError as exc:
        raise ValueError('fixture evidence unavailable') from exc
    return actual


def git(repo, *args):
    try:
        return subprocess.check_output(['git', '-C', str(repo), *args], stderr=subprocess.DEVNULL)
    except (OSError, subprocess.CalledProcessError) as exc:
        raise ValueError('Git evidence unavailable') from exc


def check_symbol_ref(ref, what):
    fields(ref, ('symbol', 'path'))
    require(nonempty(ref['symbol']) and re.fullmatch(r'[A-Za-z_$][A-Za-z0-9_$.]*', ref['symbol']), 'invalid ' + what + ' symbol')
    path = ref['path']
    require(nonempty(path), 'invalid ' + what + ' path')
    rel = Path(path)
    require(not rel.is_absolute() and '..' not in rel.parts and rel.as_posix() == path, 'unsafe ' + what + ' path')


def validate(doc, root=ROOT):
    fields(doc, ('schema_version', 'cases'), ('description',))
    require(doc['schema_version'] == 1, 'unsupported schema')
    require(isinstance(doc['cases'], list) and doc['cases'], 'cases must be nonempty list')
    ids = set()
    for case in doc['cases']:
        fields(case, ('id', 'rule_key', 'kind', 'repo_kind', 'caller', 'target',
                      'reported_from', 'cgrx_version', 'extraction_revision', 'date'),
               ('fixture', 'fixture_sha256', 'repo', 'revision', 'evidence', 'relation_kind'))
        for key in ('id', 'rule_key', 'kind', 'repo_kind', 'reported_from', 'cgrx_version'):
            require(nonempty(case[key]), 'invalid ' + key)
        require(case['id'] not in ids, 'duplicate case id')
        ids.add(case['id'])
        require(case['rule_key'] in RULE_KEYS, 'unknown rule_key')
        require(case['kind'] in ('false_positive', 'false_negative'), 'invalid kind')
        require(case.get('relation_kind', 'CALLS') in RELATION_KINDS, 'invalid relation_kind')
        require(case['repo_kind'] in ('synthetic', 'public_clone'), 'invalid repo_kind')
        require(isinstance(case['extraction_revision'], int) and case['extraction_revision'] > 0,
                'invalid extraction_revision')
        date = case['date']
        require(isinstance(date, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', date), 'invalid date')
        datetime.date.fromisoformat(date)
        check_symbol_ref(case['caller'], 'caller')
        check_symbol_ref(case['target'], 'target')
        if case['repo_kind'] == 'synthetic':
            require('fixture' in case and 'fixture_sha256' in case, 'synthetic case needs fixture')
            require('repo' not in case and 'revision' not in case and 'evidence' not in case,
                    'synthetic case must not carry clone provenance')
            name = case['fixture']
            require(nonempty(name) and re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]*', name), 'invalid fixture')
            directory = Path(root) / 'fixtures' / 'mistake-ledger' / name
            require(directory.is_dir(), 'missing fixture directory')
            recorded = case['fixture_sha256']
            require(isinstance(recorded, dict) and recorded, 'fixture_sha256 must be nonempty map')
            actual = fixture_hashes(directory)
            require(actual == recorded, 'fixture drift: %s' % name)
            require(case['caller']['path'] in recorded and case['target']['path'] in recorded,
                    'caller/target path must be fixture files')
        else:
            require('repo' in case and 'revision' in case and 'evidence' in case,
                    'public_clone case needs repo provenance')
            require('fixture' not in case and 'fixture_sha256' not in case,
                    'public_clone case must not carry fixture')
            repo, revision = case['repo'], case['revision']
            require(Path(repo).is_absolute() and str(Path(repo).resolve()) == repo, 'noncanonical repo')
            require(re.fullmatch(r'[0-9a-f]{40}', revision) is not None, 'invalid revision')
            require(git(repo, 'rev-parse', '--show-toplevel').decode().strip() == repo,
                    'not canonical Git root')
            require(git(repo, 'rev-parse', 'HEAD').decode().strip() == revision, 'stale revision')
            for anchor in ('caller', 'target'):
                ref = case['evidence'][anchor] if isinstance(case.get('evidence'), dict) else None
                require(isinstance(ref, dict), 'missing evidence anchor')
                fields(ref, ('path', 'sha256'))
                full = Path(repo) / ref['path']
                require(str(full.resolve()) == str(full), 'symlink evidence forbidden')
                blob = git(repo, 'show', '%s:%s' % (revision, ref['path']))
                require(digest(blob) == ref['sha256'], 'evidence hash mismatch')
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--contract", type=Path, default=ROOT / "contracts" / "mistake_ledger_v1.json")
    args = parser.parse_args()
    try:
        validate(json.loads(args.contract.read_text()))
    except ValueError as exc:
        print(f"INVALID: {exc}", file=sys.stderr)
        return 1
    print("VALID")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
