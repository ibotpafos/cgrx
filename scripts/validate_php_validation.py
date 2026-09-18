#!/usr/bin/env python3
"""Check local PHP fixture integrity, not semantic truth or production maturity.

The Rust php_runtime test checks the same spans against actual extraction and
persisted graphs. This corpus is separate from the historical real-task corpus.
"""
import hashlib
import json
from pathlib import Path

from validate_language_coverage import source_extensions

EXTENSIONS = ['php', 'phtml', 'php3', 'php4', 'php5', 'phps']
RELATIONS = ['CALLS', 'IMPORTS', 'REFERENCE', 'UNRESOLVED']
ROOT = Path(__file__).resolve().parents[1]


def require(value, message):
    if not value:
        raise ValueError(message)


def fields(value, names):
    require(isinstance(value, dict) and set(value) == set(names), 'invalid matrix fields')


def source_span(data, span):
    fields(span, ('start', 'end'))
    start, end = span['start'], span['end']
    require(type(start) is int and type(end) is int and 0 <= start < end <= len(data), 'invalid byte span')
    try:
        return data[start:end].decode('utf-8')
    except UnicodeDecodeError as exc:
        raise ValueError('span splits UTF-8') from exc


def validate(manifest, root=ROOT):
    root = root.resolve()
    fields(manifest, ('schema_version', 'maturity', 'relations', 'cases'))
    require(type(manifest['schema_version']) is int and manifest['schema_version'] == 1, 'unsupported matrix version')
    require(manifest['maturity'] == 'experimental', 'matrix must not claim production validation')
    require(manifest['relations'] == RELATIONS, 'relation contract changed')
    require(isinstance(manifest['cases'], list), 'cases must be a list')
    require([case.get('extension') for case in manifest['cases']] == EXTENSIONS, 'missing, duplicate or reordered extension')
    declared = source_extensions(root, {'id': 'php', 'source': 'crates/cgrx-languages/src/php.rs'})
    require(declared == EXTENSIONS, 'matrix differs from PHP extension declarations')
    for case in manifest['cases']:
        fields(case, ('extension', 'path', 'sha256', 'cells', 'caller', 'target'))
        expected_path = 'fixtures/php-validation/sample.' + case['extension']
        require(case['path'] == expected_path, 'unexpected fixture path')
        path = root / case['path']
        require(path.resolve() == path and path.is_file(), 'fixture unavailable or symlinked')
        data = path.read_bytes()
        require(hashlib.sha256(data).hexdigest() == case['sha256'], 'fixture hash mismatch')
        fields(case['cells'], RELATIONS)
        for relation, cell in case['cells'].items():
            fields(cell, ('target', 'span'))
            snippet = source_span(data, cell['span'])
            require(bool(snippet), 'empty source evidence')
            if relation == 'UNRESOLVED':
                require(cell['target'] is None, 'unresolved evidence cannot assert a target')
            else:
                require(isinstance(cell['target'], str) and bool(cell['target']), 'missing relation target')
        for endpoint in ['caller', 'target']:
            fields(case[endpoint], ('symbol', 'span'))
            require(source_span(data, case[endpoint]['span']) == case[endpoint]['symbol'], 'endpoint identity differs from source')
        require(case['cells']['CALLS']['target'] == case['target']['symbol'], 'call target differs from endpoint')
    return len(manifest['cases']), len(manifest['cases']) * len(RELATIONS)


def load(path=ROOT / 'contracts/php_validation_v1.json'):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            require(key not in result, 'duplicate JSON key')
            result[key] = value
        return result
    return json.loads(path.read_text(), object_pairs_hook=unique)


if __name__ == '__main__':
    extensions, cells = validate(load())
    print(f'VALID experimental_php_extensions={extensions} source_cells={cells}; semantic checks require Rust php_runtime tests')
