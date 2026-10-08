#!/usr/bin/env python3
"""Check source-curated relationship sites against a persisted CGRX index.

This scores supplied JavaScript assertions, explicit Python imports with
--python-imports, Rust receivers, or indexed Go field bindings, not repository precision.
Source truth is validated before scoring.
Compressed segments require Python 3.14's standard compression.zstd module.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
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


def score(corpus, index, python_imports=False, rust_self=False, rust_receivers=False,
          go_indexed_fields=False, source_relationships=False):
    tasks = corpus['tasks']
    require(sum((python_imports, rust_self, rust_receivers, go_indexed_fields,
                 source_relationships)) <= 1,
            'choose one evidence mode')
    if source_relationships:
        require(all(t['expected']['relation'] in ('CALLS', 'IMPORTS', 'REFERENCE', 'UNRESOLVED')
                    for t in tasks), 'unsupported source relationship')
    elif python_imports:
        require(all(Path(t['evidence']['source']['path']).suffix == '.py'
                    and t['expected']['relation'] == 'IMPORTS' for t in tasks),
                'Python mode requires explicit import assertions')
    elif go_indexed_fields:
        require(all(Path(t['evidence']['source']['path']).suffix == '.go'
                    and t['expected']['relation'] in ('CALLS', 'UNRESOLVED') for t in tasks),
                'Go mode requires call or abstention assertions')
    elif rust_self or rust_receivers:
        require(all(Path(t['evidence']['source']['path']).suffix == '.rs'
                    and t['expected']['relation'] in ('CALLS', 'UNRESOLVED') for t in tasks),
                'Rust mode requires call or abstention assertions')
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

    def called_name(document):
        name = document['qualified_name']
        if name.startswith('unresolved:'):
            # Use only the callee prefix, never identifiers in call arguments.
            expression = name[len('unresolved:'):]
            prefix, opening, _ = expression.partition('(')
            if not opening:
                return None
            match = re.search(r'([A-Za-z_$][\w$]*)\s*$', prefix)
            return match.group(1) if match else None
        return re.split(r'\.|::', name)[-1]

    def rust_identity(proof, source, target):
        path = proof['path']
        span = proof['span']
        calls = [d for d in documents.values() if d['path'] == path
                 and d['provenance'] == 'CALLS'
                 and [d['span_start'], d['span_end']] == [span['start'], span['end']]]
        if len(calls) != 1 or path not in index.get('rust_files', {}):
            return False
        call = calls[0]
        parameter_call = rust_receivers and 'RUST_PARAMETER_CALL' in call.get('semantic_tags', [])
        receipt = call.get('rust_parameter_target' if parameter_call else 'rust_self_target') or {}
        owner = receipt.get('owner') or {}
        owners = [d for d in documents.values() if d['path'] == path
                  and d['provenance'] == 'SYNTAX'
                  and d['span_start'] == owner.get('start') and d['span_end'] == owner.get('end')]
        if (len(owners) != 1 or call['qualified_name'] != target['qualified_name']
                or not {'EXACT_CALL', 'RUST_PARAMETER_CALL' if parameter_call else 'RUST_SELF_CALL'}
                    .issubset(call.get('semantic_tags', []))):
            return False
        for name, document in (('caller', source), ('target', target)):
            identity = receipt.get(name) or {}
            if (identity != {'start': document['span_start'], 'end': document['span_end']}
                    or document.get('body_start', -1) >= document.get('body_end', -1)):
                return False

        def encloses(outer, inner):
            return (0 <= outer.get('start', -1) <= inner.get('start', -1)
                    < inner.get('end', -1) <= outer.get('end', -1)
                    and outer['start'] < outer['end'])

        body = lambda d: {'start': d.get('body_start', -1), 'end': d.get('body_end', -1)}
        if not encloses(receipt.get('target_implementation') or {}, body(target)):
            return False
        if parameter_call:
            parameter = receipt.get('parameter') or {}
            binding = receipt.get('binding') or {}
            receiver_type = receipt.get('receiver_type') or {}
            receiver = receipt.get('receiver') or {}
            if (receipt.get('source_hash') != hashes.get(path)
                    or not encloses(body(source), parameter)
                    or not encloses(parameter, binding)
                    or not encloses(parameter, receiver_type)
                    or binding['end'] >= receiver_type['start']
                    or parameter['start'] < source['span_end']
                    or parameter['end'] >= span['start']
                    or not encloses(span, receiver) or receiver['start'] != span['start']):
                return False
        elif not encloses(receipt.get('implementation') or {}, body(source)):
            return False
        return True

    def go_indexed_identity(proof, source, target):
        path, span = proof['path'], proof['span']
        calls = [d for d in documents.values() if d['path'] == path
                 and d['provenance'] == 'CALLS'
                 and [d['span_start'], d['span_end']] == [span['start'], span['end']]]
        if len(calls) != 1:
            return False
        call = calls[0]
        receipt = call.get('go_field_target') or {}
        binding = receipt.get('indexed_binding') or {}
        if (not {'EXACT_CALL', 'GO_FIELD_CALL', 'GO_INDEXED_FIELD_CALL'}
                    .issubset(call.get('semantic_tags', []))
                or call['qualified_name'].rsplit('.', 1)[-1] != target['qualified_name']
                or not receipt.get('package')
                or binding.get('source_hash') != hashes.get(path)):
            return False

        def exact(identity):
            matches = [d for d in documents.values() if d['path'] == path
                       and d['provenance'] == 'SYNTAX'
                       and [d['span_start'], d['span_end']]
                           == [identity.get('start'), identity.get('end')]]
            return matches[0] if len(matches) == 1 else None

        def encloses(outer, inner):
            return (0 <= outer.get('start', -1) <= inner.get('start', -1)
                    < inner.get('end', -1) <= outer.get('end', -1))

        body = lambda d: {'start': d.get('body_start', -1), 'end': d.get('body_end', -1)}
        owner = exact(receipt.get('receiver_type') or {})
        element = exact(receipt.get('field_type') or {})
        if not owner or not element:
            return False
        for name, document in [('caller', source), ('target', target),
                               ('receiver_type', owner), ('field_type', element)]:
            if (receipt.get(name) != {'start': document['span_start'], 'end': document['span_end']}
                    or exact(receipt.get(name) or {}) != document
                    or document.get('go_package') != receipt['package']):
                return False
        field = receipt.get('field') or {}
        collection, statement = binding.get('collection') or {}, binding.get('statement') or {}
        local, initializer = binding.get('binding') or {}, binding.get('initializer') or {}
        receiver = binding.get('receiver') or {}
        return (encloses(body(owner), field) and encloses(body(owner), collection)
                and field['end'] <= collection['start']
                and encloses(body(source), statement)
                and encloses(statement, local) and encloses(statement, initializer)
                and local['end'] < initializer['start'] and statement['end'] < span['start']
                and encloses(span, receiver) and receiver['start'] == span['start']
                and local['end'] - local['start'] == receiver['end'] - receiver['start'])

    outcomes = []
    for task in tasks:
        anchors = task['evidence']
        start, end = bounds(task, anchors['site'])
        kind = {'REFERENCE': 'REFERENCES', 'UNRESOLVED': 'CALLS'}.get(
            task['expected']['relation'], task['expected']['relation'])
        at_site = []
        owned_calls = [d for d in documents.values()
                       if d['path'] == anchors['site']['path'] and d['provenance'] == 'CALLS'
                       and start <= d['span_start'] < end
                       and 'STATEMENT_CALL' not in d.get('semantic_tags', [])
                       and called_name(d) == anchors['site']['symbol']]
        call_spans = {(d['span_start'], d['span_end']) for d in owned_calls}

        def reference_owned(site):
            lines = source_cache[(task['repo'], anchors['site']['path'])]
            text = b''.join(lines)[site['start']:site['end']].decode('utf-8', errors='replace')
            return (re.fullmatch(r'[A-Za-z_$][\w$]*(?:(?:\.|::)[A-Za-z_$][\w$]*)*', text)
                    is not None and re.split(r'\.|::', text)[-1] == anchors['site']['symbol'])
        # A Python line can import several members. Each curated assertion
        # owns a named member, so unrelated members on the line are not FPs.
        member_spans = {(d['span_start'], d['span_end']) for d in documents.values()
                        if d['provenance'] == 'IMPORTS'
                        and d.get('semantic_tags') == ['PY_IMPORT_BINDING']
                        and in_anchor(task, d, anchors['source'])} if (python_imports
                            or (source_relationships and kind == 'IMPORTS')) else None
        for arc in index['arcs']:
            evidence = arc.get('evidence') or {}
            site = evidence.get('span', {})
            if (arc['kind'] == kind and evidence.get('path') == anchors['site']['path']
                    and start <= site.get('start', -1) < end
                    and site.get('start', -1) < site.get('end', -1)
                    and (kind != 'CALLS' or (site.get('start'), site.get('end')) in call_spans)
                    and (not source_relationships or kind != 'REFERENCES' or reference_owned(site))
                    and (member_spans is None or (site.get('start'), site.get('end')) in member_spans)):
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
            if source_relationships:
                # All-language grading checks the source-bound graph contract.
                # Language-specific receipt grading remains in the existing modes.
                ledger_ok = proof.get('source_hash') == hashes.get(proof['path'])
                source_ok = in_anchor(task, source, anchors['source'])
            source_ok &= source['provenance'] == ('IMPORTS' if kind == 'IMPORTS' else 'SYNTAX')
            if rust_self or rust_receivers:
                ledger_ok = rust_identity(proof, source, target)
            if go_indexed_fields:
                ledger_ok = go_indexed_identity(proof, source, target)
            if python_imports or (source_relationships and kind == 'IMPORTS'
                                  and source.get('semantic_tags') == ['PY_IMPORT_BINDING']):
                ledger = index.get('python_files', {})
                source_facts = ledger.get(proof['path'], {}).get('facts', {})
                target_entry = ledger.get(target['path'], {})
                target_facts = target_entry.get('facts', {})
                ledger_ok &= (source_facts.get('valid') is True and target_facts.get('valid') is True
                              and ledger.get(proof['path'], {}).get('source_hash') == proof.get('source_hash')
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
        unresolved_calls = [d for d in owned_calls
                            if 'DYNAMIC_DISPATCH' in d.get('semantic_tags', [])
                            or (source_relationships and 'EXACT_CALL' in d.get('semantic_tags', []))]
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
            'owned_call_spans': len(call_spans) if kind == 'CALLS' else None,
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
        'language_scope': ('source-curated native relationships' if source_relationships else
                          'python explicit imports' if python_imports else
                          'go indexed field calls' if go_indexed_fields else
                          'rust receiver calls' if rust_receivers else
                          'rust self calls' if rust_self else 'javascript'),
        'scope': 'supplied source-curated sites only; not whole-repository precision or completeness',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('corpus', type=Path)
    parser.add_argument('state', type=Path)
    parser.add_argument('--output', type=Path)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument('--python-imports', action='store_true')
    modes.add_argument('--rust-self', action='store_true')
    modes.add_argument('--rust-receivers', action='store_true')
    modes.add_argument('--go-indexed-fields', action='store_true')
    modes.add_argument('--source-relationships', action='store_true',
                       help='grade native caller, target, named-site and hash ownership across languages')
    args = parser.parse_args()
    try:
        data = args.corpus.read_bytes()
        corpus = json.loads(data)
        validate(corpus)
        report = score(corpus, load_index(args.state), python_imports=args.python_imports,
                       rust_self=args.rust_self, rust_receivers=args.rust_receivers,
                       go_indexed_fields=args.go_indexed_fields,
                       source_relationships=args.source_relationships)
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
