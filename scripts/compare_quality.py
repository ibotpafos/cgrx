#!/usr/bin/env python3
"""Fail-closed comparison of paired, externally measured CGRX/CBM runs.

This consumes evidence; it neither runs engines nor certifies an untrusted
collector. Identical snapshot IDs, measurement protocol and tokenizer must be
established by the collector. `complete` means untruncated result collection,
not whole-program semantic completeness. Unit-test fixtures are not benchmarks.
"""
import argparse
import json
import math
from pathlib import Path
import re
import sys

LANGUAGES = ('go', 'typescript', 'python', 'rust')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def number(value):
    return type(value) in (int, float) and math.isfinite(value) and value >= 0


def records(value):
    require(isinstance(value, list) and all(nonempty(x) for x in value), 'invalid records')
    require(len(value) == len(set(value)), 'duplicate records')
    return set(value)


def snapshot(value):
    require(isinstance(value, dict), 'missing snapshot')
    require(nonempty(value.get('repo')) and value['repo'].startswith('/'), 'absolute repo required')
    require(isinstance(value.get('revision'), str) and
            re.fullmatch(r'[0-9a-f]{40}|[0-9a-f]{64}', value['revision']), 'invalid revision')
    require(isinstance(value.get('source_digest'), str) and
            re.fullmatch(r'[0-9a-f]{64}', value['source_digest']), 'invalid source digest')


def p95(values):
    return sorted(values)[math.ceil(len(values) * 0.95) - 1]


def quality(rows, engine):
    tp = fp = fn = 0
    for row in rows:
        expected, actual = set(row['expected']), set(row[engine]['actual'])
        tp += len(expected & actual)
        fp += len(actual - expected)
        fn += len(expected - actual)
    precision = tp / (tp + fp) if tp + fp else float(fn == 0)
    recall = tp / (tp + fn) if tp + fn else 1.0
    f1 = 2 * tp / (2 * tp + fp + fn) if 2 * tp + fp + fn else 1.0
    return dict(tp=tp, fp=fp, fn=fn, precision=precision, recall=recall, f1=f1)


def compare(data, minimum_cases=100, minimum_per_language=20, minimum_gain=0.005):
    require(type(minimum_cases) is int and minimum_cases > 0, 'invalid minimum cases')
    require(type(minimum_per_language) is int and minimum_per_language > 0, 'invalid language minimum')
    require(number(minimum_gain) and 0 < minimum_gain <= 1, 'invalid gain')
    require(isinstance(data, dict) and type(data.get('schema_version')) is int
            and data['schema_version'] == 1, 'invalid schema version')
    for field in ('environment', 'tokenizer'):
        require(nonempty(data.get(field)), f'missing {field}')
    engines = data.get('engines')
    require(isinstance(engines, dict), 'missing engines')
    for engine in ('cgrx', 'cbm'):
        require(isinstance(engines.get(engine), dict), 'missing engine')
        for field in ('version', 'mode'):
            require(nonempty(engines[engine].get(field)), f'missing {engine} {field}')
    cases = data.get('cases')
    require(isinstance(cases, list) and cases, 'missing cases')
    seen = set()
    for row in cases:
        require(isinstance(row, dict) and nonempty(row.get('id')), 'invalid case')
        require(row['id'] not in seen, 'duplicate case id'); seen.add(row['id'])
        require(row.get('language') in LANGUAGES, 'unsupported language')
        require(row.get('split') in ('train', 'heldout'), 'missing split')
        snapshot(row.get('snapshot'))
        records(row.get('expected'))
        for engine in ('cgrx', 'cbm'):
            result = row.get(engine)
            require(isinstance(result, dict), 'missing result')
            require(result.get('success') is True and result.get('complete') is True,
                    'failed or incomplete collection')
            require(result.get('snapshot') == row['snapshot'], 'mismatched snapshot')
            records(result.get('actual'))
            latencies = result.get('latency_ms')
            require(isinstance(latencies, list) and len(latencies) >= 3
                    and all(number(x) for x in latencies), 'invalid latency samples')
            for field in ('peak_rss_bytes', 'response_tokens'):
                require(type(result.get(field)) is int and result[field] >= 0,
                        f'invalid {field}')
        require(len(row['cgrx']['latency_ms']) == len(row['cbm']['latency_ms']),
                'unpaired latency samples')
    rows = [row for row in cases if row['split'] == 'heldout']
    failures = []
    def check(condition, reason):
        if not condition:
            failures.append(reason)
    check(len(rows) >= minimum_cases, 'insufficient heldout cases')
    per_language = {}
    for language in LANGUAGES:
        group = [row for row in rows if row['language'] == language]
        check(len(group) >= minimum_per_language, f'{language}: insufficient heldout cases')
        check(any(row['expected'] for row in group), f'{language}: missing positive cases')
        check(any(not row['expected'] for row in group), f'{language}: missing negative cases')
        scores = {engine: quality(group, engine) for engine in ('cgrx', 'cbm')}
        for metric in ('precision', 'recall'):
            check(scores['cgrx'][metric] >= scores['cbm'][metric], f'{language}: {metric} regression')
        per_language[language] = dict(cases=len(group), **scores)
    for row in rows:
        a, b = quality([row], 'cgrx'), quality([row], 'cbm')
        check(a['fp'] <= b['fp'] and a['fn'] <= b['fn'], f"{row['id']}: quality regression")
        check(p95(row['cgrx']['latency_ms']) <= p95(row['cbm']['latency_ms']),
              f"{row['id']}: p95 latency regression")
        for metric in ('peak_rss_bytes', 'response_tokens'):
            check(row['cgrx'][metric] <= row['cbm'][metric], f"{row['id']}: {metric} regression")
    scores = {engine: quality(rows, engine) for engine in ('cgrx', 'cbm')}
    gain = scores['cgrx']['f1'] - scores['cbm']['f1']
    check(gain >= minimum_gain, 'insufficient F1 improvement')
    resources = {}
    for engine in ('cgrx', 'cbm'):
        samples = [v for row in rows for v in row[engine]['latency_ms']]
        resources[engine] = {
            'p95_latency_ms': p95(samples) if samples else None,
            'peak_rss_bytes': max((row[engine]['peak_rss_bytes'] for row in rows), default=None),
            'response_tokens': sum(row[engine]['response_tokens'] for row in rows),
        }
    return {'passed': not failures, 'failures': failures, 'heldout_cases': len(rows),
            'quality': scores, 'f1_gain': gain, 'languages': per_language,
            'resources': resources, 'engines': engines, 'environment': data['environment'],
            'tokenizer': data['tokenizer'], 'thresholds': {
                'minimum_cases': minimum_cases, 'minimum_per_language': minimum_per_language,
                'minimum_f1_gain': minimum_gain},
            'limitations': ['Collector and oracle require independent verification.',
                            'Passing proves only the supplied heldout workload, not universal superiority.']}


def read_json(text):
    def object_pairs(pairs):
        result = {}
        for key, value in pairs:
            require(key not in result, f'duplicate JSON key: {key}')
            result[key] = value
        return result

    def reject_constant(value):
        raise ValueError(f'non-finite JSON constant: {value}')

    return json.loads(text, object_pairs_hook=object_pairs, parse_constant=reject_constant)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('--minimum-cases', type=int, default=100)
    parser.add_argument('--minimum-per-language', type=int, default=20)
    parser.add_argument('--minimum-gain', type=float, default=0.005)
    args = parser.parse_args()
    try:
        data = read_json(args.input.read_text())
        report = compare(data, args.minimum_cases, args.minimum_per_language, args.minimum_gain)
    except (ValueError, OSError) as exc:
        print(json.dumps({'passed': False, 'invalid': str(exc)}))
        return 2
    print(json.dumps(report, indent=2, allow_nan=False))
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    sys.exit(main())
