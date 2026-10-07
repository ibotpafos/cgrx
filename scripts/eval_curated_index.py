#!/usr/bin/env python3
"""Check source-curated relationship sites against a persisted CGRX index.

This scores supplied JavaScript assertions, or explicit Python import
assertions with --python-imports, not whole-repository precision or completeness.
Source truth is validated before scoring.
Compressed segments require Python 3.14's standard compression.zstd module.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

from validate_real_tasks import validate


def require(condition, message):
    if not condition:
        raise ValueError(message)


def load_index(state):
    store = state / '.cgrx'
    current = store.joinpath('CURRENT').read_text().strip()
    require(current.isascii() and current.isdecimal(), 'invalid generation pointer')
    data = store.joinpath('generations', current, 'nodes.seg').read_bytes()
    if data.startswith(b'CZST'):
        try:
            from compression import zstd
        except ImportError as exc:
            raise ValueError('compressed indexes require Python 3.14 or later') from exc
        data = zstd.decompress(data[4:])
    index = json.loads(data)
    generation = index['snapshot']['graph_generation']
    require(type(generation) is int and generation == int(current), 'generation mismatch')
    return index


def score(corpus, index, python_imports=False):
    tasks = corpus['tasks']
    if python_imports:
        require(all(Path(t['evidence']['source']['path']).suffix == '.py'
                    and t['expected']['relation'] == 'IMPORTS' for t in tasks),
                'Python mode requires explicit import assertions')
    else:
        require(all(Path(t['evidence']['source']['path']).suffix in ('.js', '.mjs', '.cjs')
                    for t in tasks), 'this evaluator requires JavaScript evidence')
    require(len({t['repo'] for t in tasks}) == 1, 'one repository per index required')
    require({t['revision'] for t in tasks} == {index['snapshot']['repo_revision']}, 'stale snapshot')
    documents = {d['node_id']: d for d in index['documents']}
    require(len(documents) == len(index['documents']), 'duplicate document identity')
    hashes = index['path_hashes']
    source_cache = {}

    def bounds(task, anchor):
        key = (task['repo'], anchor['path'])
        if key not in source_cache:
            source_cache[key] = (Path(key[0]) / key[1]).read_bytes().splitlines(keepends=True)
        lines = source_cache[key]
        return sum(map(len, lines[:anchor['start_line'] - 1])), sum(map(len, lines[:anchor['end_line']]))

    def in_anchor(task, document, anchor):
        start, end = bounds(task, anchor)
        return (document['path'] == anchor['path']
                and document['qualified_name'] == anchor['symbol']
                and start <= document['span_start'] < document['span_end'] <= end)

    outcomes = []
    for task in tasks:
        anchors = task['evidence']
        start, end = bounds(task, anchors['site'])
        kind = {'REFERENCE': 'REFERENCES', 'UNRESOLVED': 'CALLS'}.get(
            task['expected']['relation'], task['expected']['relation'])
        at_site = []
        # A Python line can import several members. Each curated assertion
        # owns a named member, so unrelated members on the line are not FPs.
        member_spans = {(d['span_start'], d['span_end']) for d in documents.values()
                        if d['provenance'] == 'IMPORTS'
                        and d.get('semantic_tags') == ['PY_IMPORT_BINDING']
                        and in_anchor(task, d, anchors['source'])} if python_imports else None
        for arc in index['arcs']:
            evidence = arc.get('evidence') or {}
            site = evidence.get('span', {})
            if (arc['kind'] == kind and evidence.get('path') == anchors['site']['path']
                    and start <= site.get('start', -1) < end
                    and (member_spans is None or (site.get('start'), site.get('end')) in member_spans)
                    and site.get('start', -1) < site.get('end', -1)):
                at_site.append(arc)
        proven = [arc for arc in at_site if arc['evidence'].get('confidence') == 'PROVEN']
        matched = []
        for arc in proven:
            proof = arc['evidence']
            source = documents.get(arc['source'])
            target = documents.get(arc['target'])
            if not source or not target or task['expected']['relation'] == 'UNRESOLVED':
                continue
            source_ok = in_anchor(task, source, anchors['source'])
            if kind == 'IMPORTS' and not python_imports:
                src_start, src_end = bounds(task, anchors['source'])
                source_ok = (source['provenance'] == 'IMPORTS'
                             and source['path'] == anchors['source']['path']
                             and src_start <= source['span_start'] < source['span_end'] <= src_end)
            ledger = index.get('python_files' if python_imports else 'ts_files', {})
            ledger_ok = proof.get('source_hash') == ledger.get(proof['path'], {}).get('source_hash')
            if python_imports:
                source_facts = ledger.get(proof['path'], {}).get('facts', {})
                target_entry = ledger.get(target['path'], {})
                target_facts = target_entry.get('facts', {})
                ledger_ok &= (source_facts.get('valid') is True and target_facts.get('valid') is True
                              and source['provenance'] == 'IMPORTS'
                              and source.get('semantic_tags') == ['PY_IMPORT_BINDING']
                              and target_entry.get('source_hash') == hashes.get(target['path'])
                              and target_facts.get('exports', {}).get(target['qualified_name'])
                                  == [target['span_start'], target['span_end']]
                              and any(i.get('span') == [source['span_start'], source['span_end']]
                                      and i.get('local') == source['qualified_name']
                                      and i.get('imported') == target['qualified_name']
                                      for i in source_facts.get('imports', [])))
            if (source_ok and target['provenance'] == 'SYNTAX'
                    and in_anchor(task, target, anchors['target'])
                    and proof.get('resolver') == 'SYNTAX_EXACT'
                    and proof.get('source_hash') == hashes.get(proof['path'])
                    and ledger_ok
                    and not proof.get('assumptions') and not proof.get('counter_evidence')):
                matched.append(arc)
        # A call may start on the anchored line and end several lines later.
        # CGRX coalesces nested dynamic gaps into their enclosing expression.
        unresolved_calls = [d for d in documents.values()
                            if d['path'] == anchors['site']['path'] and d['provenance'] == 'CALLS'
                            and start <= d['span_start'] < end
                            and 'DYNAMIC_DISPATCH' in d.get('semantic_tags', [])]
        gap = False
        for location in index['coverage']['dynamic_dispatch']:
            prefix = anchors['site']['path'] + ':'
            if location.startswith(prefix):
                gap_start, gap_end = map(int, location[len(prefix):].split('-'))
                gap |= any(gap_start <= d['span_start'] < d['span_end'] <= gap_end
                           for d in unresolved_calls)
        unresolved = task['expected']['relation'] == 'UNRESOLVED'
        passed = (not proven and gap) if unresolved else len(matched) == len(proven) == 1
        outcomes.append({
            'id': task['id'], 'relation': task['expected']['relation'],
            'passed': passed, 'proven_arcs_at_site': len(proven),
            'matching_exact_arcs': len(matched), 'dispatch_gap_at_site': gap,
        })
    positives = [o for o in outcomes if o['relation'] != 'UNRESOLVED']
    negatives = [o for o in outcomes if o['relation'] == 'UNRESOLVED']
    return {
        'schema_version': 1, 'snapshot': index['snapshot'],
        'extraction_revision': index['extraction_revision'],
        'indexed_files': index['indexed_files'], 'documents': len(documents),
        'arcs': len(index['arcs']),
        'positive_assertions': len(positives), 'matched_positive_assertions': sum(o['passed'] for o in positives),
        'unmatched_proven_at_positive_sites': sum(o['proven_arcs_at_site'] - o['matching_exact_arcs'] for o in positives),
        'abstention_assertions': len(negatives), 'respected_abstentions': sum(o['passed'] for o in negatives),
        'false_proven_at_abstention_sites': sum(o['proven_arcs_at_site'] for o in negatives),
        'passed': all(o['passed'] for o in outcomes), 'outcomes': outcomes,
        'language_scope': 'python explicit imports' if python_imports else 'javascript',
        'scope': 'supplied source-curated sites only; not whole-repository precision or completeness',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('corpus', type=Path)
    parser.add_argument('state', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--python-imports', action='store_true')
    args = parser.parse_args()
    try:
        data = args.corpus.read_bytes()
        corpus = json.loads(data)
        validate(corpus)
        report = score(corpus, load_index(args.state), python_imports=args.python_imports)
        report['corpus_sha256'] = hashlib.sha256(data).hexdigest()
        encoded = json.dumps(report, indent=2) + '\n'
        if args.output:
            args.output.write_text(encoded)
        print(encoded, end='')
        return 0 if report['passed'] else 1
    except (OSError, ValueError, TypeError, KeyError) as exc:
        print('INVALID: ' + str(exc), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
