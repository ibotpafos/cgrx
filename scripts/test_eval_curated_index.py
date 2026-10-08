"""Evidence scoring must reject corrupted proofs and false clean abstentions."""
import copy
import json
from pathlib import Path
import tempfile
import unittest

from eval_curated_index import load_index, score


class EvidenceIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        data = b'function target() {}\nfunction caller() {\n target(\n  1\n );\n}\n'
        self.root.joinpath('main.js').write_bytes(data)
        self.site_start = data.index(b'target(', data.index(b'caller'))
        self.site_end = data.index(b');', self.site_start) + 1
        anchor = lambda symbol, start, end: {
            'path': 'main.js', 'symbol': symbol, 'start_line': start, 'end_line': end}
        self.task = {
            'id': 'multiline-call', 'repo': str(self.root), 'revision': 'a' * 40,
            'evidence': {'source': anchor('caller', 2, 6), 'target': anchor('target', 1, 1),
                         'site': anchor('target', 3, 3)},
            'expected': {'relation': 'CALLS'},
        }
        docs = []
        for node_id, name in [(1, 'target'), (2, 'caller')]:
            start = data.index(name.encode())
            docs.append({'node_id': node_id, 'path': 'main.js', 'qualified_name': name,
                         'provenance': 'SYNTAX', 'span_start': start, 'span_end': start + len(name)})
        docs.append({'node_id': 3, 'path': 'main.js', 'qualified_name': 'target',
                     'provenance': 'CALLS', 'span_start': self.site_start,
                     'span_end': self.site_end, 'semantic_tags': ['EXACT_CALL']})
        self.arc = {'source': 2, 'target': 1, 'kind': 'CALLS', 'evidence': {
            'path': 'main.js', 'span': {'start': self.site_start, 'end': self.site_end},
            'source_hash': 'ab' * 32, 'confidence': 'PROVEN', 'resolver': 'SYNTAX_EXACT',
            'assumptions': [], 'counter_evidence': []}}
        self.index = {'snapshot': {'repo_revision': 'a' * 40, 'graph_generation': 123},
                      'extraction_revision': 37, 'indexed_files': 1, 'documents': docs,
                      'arcs': [self.arc], 'path_hashes': {'main.js': 'ab' * 32},
                      'ts_files': {'main.js': {'source_hash': 'ab' * 32}},
                      'coverage': {'dynamic_dispatch': []}}

    def report(self, index=None, task=None):
        return score({'tasks': [task or self.task]}, index or self.index)

    def negative(self):
        task = copy.deepcopy(self.task)
        task['expected']['relation'] = 'UNRESOLVED'
        del task['evidence']['target']
        index = copy.deepcopy(self.index)
        index['arcs'] = []
        index['documents'][-1]['semantic_tags'] = ['DYNAMIC_DISPATCH']
        index['coverage']['dynamic_dispatch'] = [f'main.js:0-{self.site_end}']
        return task, index

    def test_multiline_ast_call_matches_its_start_line(self):
        self.assertTrue(self.report()['passed'])

    def test_missing_or_inconsistent_evidence_cannot_pass(self):
        for case in ('hash', 'ledger', 'resolver', 'confidence', 'assumption', 'counter',
                     'source', 'target', 'span', 'missing-target'):
            with self.subTest(case=case):
                index = copy.deepcopy(self.index)
                proof = index['arcs'][0]['evidence']
                if case == 'hash':
                    proof['source_hash'] = 'cd' * 32
                elif case == 'ledger':
                    index['ts_files']['main.js']['source_hash'] = 'cd' * 32
                elif case == 'resolver':
                    proof['resolver'] = 'FALLBACK'
                elif case == 'confidence':
                    proof['confidence'] = 'CANDIDATE'
                elif case == 'assumption':
                    proof['assumptions'] = ['unknown']
                elif case == 'counter':
                    proof['counter_evidence'] = ['unknown']
                elif case in ('source', 'target'):
                    index['documents'][1 if case == 'source' else 0]['qualified_name'] = 'other'
                elif case == 'span':
                    proof['span']['start'] = 0
                else:
                    index['documents'] = index['documents'][1:]
                self.assertFalse(self.report(index)['passed'])

    def test_duplicate_documents_are_invalid(self):
        self.index['documents'].append(copy.deepcopy(self.index['documents'][0]))
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            self.report()

    def test_extra_proven_edge_at_the_curated_site_fails(self):
        arc = copy.deepcopy(self.arc)
        arc['target'] = 3
        self.index['arcs'].append(arc)
        result = self.report()
        self.assertFalse(result['passed'])
        self.assertEqual(result['unmatched_proven_at_positive_sites'], 1)

    def test_stale_snapshot_is_invalid(self):
        self.index['snapshot']['repo_revision'] = 'b' * 40
        with self.assertRaisesRegex(ValueError, 'stale'):
            self.report()

    def test_abstention_accepts_an_enclosing_gap_with_a_real_unresolved_call(self):
        task, index = self.negative()
        self.assertTrue(self.report(index, task)['passed'])

    def test_absence_of_edges_is_insufficient_for_abstention(self):
        task, index = self.negative()
        for case in ('gap', 'document', 'tag', 'unrelated-gap', 'false-proven'):
            with self.subTest(case=case):
                changed = copy.deepcopy(index)
                if case == 'gap':
                    changed['coverage']['dynamic_dispatch'] = []
                elif case == 'document':
                    changed['documents'].pop()
                elif case == 'tag':
                    changed['documents'][-1]['semantic_tags'] = []
                elif case == 'unrelated-gap':
                    changed['coverage']['dynamic_dispatch'] = ['main.js:0-10']
                else:
                    changed['arcs'] = [self.arc]
                self.assertFalse(self.report(changed, task)['passed'])

    def test_generation_pointer_and_payload_must_agree(self):
        store = self.root / '.cgrx'
        generation = store / 'generations' / '123'
        generation.mkdir(parents=True)
        store.joinpath('CURRENT').write_text('123\n')
        generation.joinpath('nodes.seg').write_text(json.dumps(self.index))
        self.assertEqual(load_index(self.root), self.index)
        self.index['snapshot']['graph_generation'] = 124
        generation.joinpath('nodes.seg').write_text(json.dumps(self.index))
        with self.assertRaisesRegex(ValueError, 'generation'):
            load_index(self.root)

    def test_zero_padded_generation_pointer_matches_numeric_payload(self):
        store = self.root / '.cgrx'
        generation = store / 'generations' / '0000000000000123'
        generation.mkdir(parents=True)
        store.joinpath('CURRENT').write_text(generation.name + '\n')
        generation.joinpath('nodes.seg').write_text(json.dumps(self.index))
        self.assertEqual(load_index(self.root), self.index)
        for invalid in ('123', True, 123.0):
            with self.subTest(generation=invalid):
                self.index['snapshot']['graph_generation'] = invalid
                generation.joinpath('nodes.seg').write_text(json.dumps(self.index))
                with self.assertRaisesRegex(ValueError, 'generation'):
                    load_index(self.root)

    def test_generation_pointer_rejects_paths_and_non_ascii_digits(self):
        store = self.root / '.cgrx'
        store.mkdir()
        for invalid in ('../123', '/123', '', '１２３'):
            with self.subTest(pointer=invalid):
                store.joinpath('CURRENT').write_text(invalid)
                with self.assertRaisesRegex(ValueError, 'pointer'):
                    load_index(self.root)


class RustSelfIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        data = b"struct A<'a>(&'a u8);\nimpl A<'_> {\n fn caller(&self) { self.target(); }\n fn target(&self) {}\n}\n"
        self.root.joinpath('main.rs').write_bytes(data)
        anchor = lambda name, line: {'path': 'main.rs', 'symbol': name,
                                    'start_line': line, 'end_line': line}
        self.task = {'id': 'rust-self', 'repo': str(self.root), 'revision': 'a' * 40,
                     'expected': {'relation': 'CALLS'}, 'evidence': {
                         'source': anchor('caller', 3), 'site': anchor('target', 3),
                         'target': anchor('target', 4)}}
        docs = []
        for node_id, name in ((1, 'caller'), (2, 'target'), (4, 'A')):
            body_start = data.index(b'struct') if name == 'A' else data.index(f'fn {name}'.encode())
            start = data.index(name.encode(), body_start)
            docs.append({'node_id': node_id, 'path': 'main.rs', 'qualified_name': name,
                         'provenance': 'SYNTAX', 'span_start': start, 'span_end': start + len(name),
                         'body_start': body_start, 'body_end': data.index(b'\n', body_start)})
        span = lambda d: {'start': d['span_start'], 'end': d['span_end']}
        implementation = {'start': data.index(b'impl'), 'end': len(data) - 1}
        call_start = data.index(b'self.target()')
        call_end = call_start + len(b'self.target()')
        docs.append({'node_id': 3, 'path': 'main.rs', 'qualified_name': 'target',
                     'provenance': 'CALLS', 'span_start': call_start, 'span_end': call_end,
                     'semantic_tags': ['EXACT_CALL', 'RUST_SELF_CALL'], 'rust_self_target': {
                         'caller': span(docs[0]), 'target': span(docs[1]), 'owner': span(docs[2]),
                         'implementation': implementation, 'target_implementation': implementation}})
        self.index = {'snapshot': {'repo_revision': 'a' * 40, 'graph_generation': 123},
                      'extraction_revision': 61, 'indexed_files': 1, 'documents': docs,
                      'rust_files': {'main.rs': {}}, 'path_hashes': {'main.rs': 'ab' * 32},
                      'coverage': {'dynamic_dispatch': []}, 'arcs': [{
                          'source': 1, 'target': 2, 'kind': 'CALLS', 'evidence': {
                              'path': 'main.rs', 'span': {'start': call_start, 'end': call_end},
                              'source_hash': 'ab' * 32, 'confidence': 'PROVEN',
                              'resolver': 'SYNTAX_EXACT', 'assumptions': [], 'counter_evidence': []}}]}

    def report(self, index=None, task=None):
        return score({'tasks': [task or self.task]}, index or self.index, rust_self=True)

    def test_exact_owner_caller_target_and_impl_receipts_pass(self):
        self.assertTrue(self.report()['passed'])

    def test_damaged_receipt_cannot_turn_membership_into_proof(self):
        for case in ('caller', 'target', 'owner', 'implementation', 'target_implementation',
                     'tag', 'missing-call', 'missing-ledger', 'duplicate-owner', 'hash'):
            with self.subTest(case=case):
                index = copy.deepcopy(self.index)
                call = index['documents'][-1]
                if case in ('caller', 'target', 'owner', 'implementation', 'target_implementation'):
                    call['rust_self_target'][case]['start'] = 9999
                elif case == 'tag':
                    call['semantic_tags'] = ['EXACT_CALL']
                elif case == 'missing-call':
                    index['documents'].pop()
                elif case == 'missing-ledger':
                    del index['rust_files']
                elif case == 'duplicate-owner':
                    owner = copy.deepcopy(index['documents'][2])
                    owner['node_id'] = 99
                    index['documents'].append(owner)
                else:
                    index['arcs'][0]['evidence']['source_hash'] = 'cd' * 32
                self.assertFalse(self.report(index)['passed'])

    def test_rust_abstention_requires_a_real_call_gap(self):
        task, index = copy.deepcopy(self.task), copy.deepcopy(self.index)
        task['expected']['relation'] = 'UNRESOLVED'
        del task['evidence']['target']
        index['arcs'] = []
        call = index['documents'][-1]
        call['semantic_tags'] = ['DYNAMIC_DISPATCH']
        index['coverage']['dynamic_dispatch'] = [f"main.rs:{call['span_start']}-{call['span_end']}"]
        self.assertTrue(self.report(index, task)['passed'])
        index['coverage']['dynamic_dispatch'] = []
        self.assertFalse(self.report(index, task)['passed'])


class RustParameterIntegrityTests(RustSelfIntegrityTests):
    def setUp(self):
        super().setUp()
        data = b"#[derive(Default)] struct A;\nimpl A { fn target(&self) {} }\nfn caller(value: &A) { value.target(); }\n"
        self.root.joinpath('main.rs').write_bytes(data)
        docs = []
        for node_id, name in ((1, 'caller'), (2, 'target'), (4, 'A')):
            body_start = data.index(b'struct') if name == 'A' else data.index(f'fn {name}'.encode())
            start = data.index(name.encode(), body_start)
            docs.append({'node_id': node_id, 'path': 'main.rs', 'qualified_name': name,
                         'provenance': 'SYNTAX', 'span_start': start, 'span_end': start + len(name),
                         'body_start': body_start, 'body_end': data.index(b'\n', body_start)})
        span = lambda d: {'start': d['span_start'], 'end': d['span_end']}
        position = lambda fragment: {'start': data.index(fragment),
                                     'end': data.index(fragment) + len(fragment)}
        call_start = data.index(b'value.target()')
        call_end = call_start + len(b'value.target()')
        docs.append({'node_id': 3, 'path': 'main.rs', 'qualified_name': 'target',
                     'provenance': 'CALLS', 'span_start': call_start, 'span_end': call_end,
                     'semantic_tags': ['EXACT_CALL', 'RUST_PARAMETER_CALL'], 'rust_parameter_target': {
                         'source_hash': 'ab' * 32, 'caller': span(docs[0]), 'target': span(docs[1]),
                         'owner': span(docs[2]), 'parameter': position(b'value: &A'),
                         'binding': position(b'value'), 'receiver_type': position(b'&A'),
                         'receiver': {'start': call_start, 'end': call_start + len(b'value')},
                         'target_implementation': position(b'impl A { fn target(&self) {} }')}})
        self.index.update(extraction_revision=77, documents=docs)
        self.index['arcs'][0]['evidence']['span'] = {'start': call_start, 'end': call_end}
        self.task['evidence']['target'].update(start_line=2, end_line=2)

    def report(self, index=None, task=None):
        return score({'tasks': [task or self.task]}, index or self.index, rust_receivers=True)

    def test_damaged_receipt_cannot_turn_membership_into_proof(self):
        for case in ('caller', 'target', 'owner', 'target_implementation', 'parameter',
                     'binding', 'receiver_type', 'receiver', 'source_hash', 'tag',
                     'missing-receipt', 'missing-ledger', 'duplicate-owner', 'hash'):
            with self.subTest(case=case):
                index = copy.deepcopy(self.index)
                call = index['documents'][-1]
                if case in ('caller', 'target', 'owner', 'target_implementation', 'parameter',
                            'binding', 'receiver_type', 'receiver'):
                    call['rust_parameter_target'][case]['start'] = 9999
                elif case == 'source_hash':
                    call['rust_parameter_target']['source_hash'] = 'cd' * 32
                elif case == 'tag':
                    call['semantic_tags'] = ['EXACT_CALL']
                elif case == 'missing-receipt':
                    del call['rust_parameter_target']
                elif case == 'missing-ledger':
                    del index['rust_files']
                elif case == 'duplicate-owner':
                    owner = copy.deepcopy(index['documents'][2])
                    owner['node_id'] = 99
                    index['documents'].append(owner)
                else:
                    index['arcs'][0]['evidence']['source_hash'] = 'cd' * 32
                self.assertFalse(self.report(index)['passed'])

    def test_parameter_receipt_requires_parameter_mode(self):
        self.assertFalse(score({'tasks': [self.task]}, self.index, rust_self=True)['passed'])


class PythonImportIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        source = b'from .helper import target, other\n'
        target = b'def target(): pass\ndef other(): pass\n'
        (self.root / 'main.py').write_bytes(source)
        (self.root / 'helper.py').write_bytes(target)
        anchor = lambda path, name, line: {
            'path': path, 'symbol': name, 'start_line': line, 'end_line': line}
        self.task = {'id': 'py-member', 'repo': str(self.root), 'revision': 'a' * 40,
                     'expected': {'relation': 'IMPORTS'}, 'evidence': {
                         'source': anchor('main.py', 'target', 1),
                         'site': anchor('main.py', 'target', 1),
                         'target': anchor('helper.py', 'target', 1)}}
        documents = []
        imports, exports, arcs = [], {}, []
        for number, name in enumerate(('target', 'other'), 1):
            start = source.index(name.encode())
            span = [start, start + len(name)]
            target_start = target.index(name.encode())
            target_span = [target_start, target_start + len(name)]
            imports.append({'module': '.helper', 'imported': name, 'local': name, 'span': span})
            exports[name] = target_span
            documents.extend([
                {'node_id': number, 'path': 'main.py', 'qualified_name': name,
                 'span_start': span[0], 'span_end': span[1], 'provenance': 'IMPORTS',
                 'semantic_tags': ['PY_IMPORT_BINDING']},
                {'node_id': number + 2, 'path': 'helper.py', 'qualified_name': name,
                 'span_start': target_span[0], 'span_end': target_span[1], 'provenance': 'SYNTAX'}])
            arcs.append({'source': number, 'target': number + 2, 'kind': 'IMPORTS',
                         'evidence': {'path': 'main.py', 'span': {'start': span[0], 'end': span[1]},
                                      'source_hash': 'ab' * 32, 'confidence': 'PROVEN',
                                      'resolver': 'SYNTAX_EXACT', 'assumptions': [], 'counter_evidence': []}})
        self.index = {'snapshot': {'repo_revision': 'a' * 40, 'graph_generation': 123},
                      'extraction_revision': 45, 'indexed_files': 2, 'documents': documents,
                      'arcs': arcs, 'path_hashes': {'main.py': 'ab' * 32, 'helper.py': 'cd' * 32},
                      'python_files': {
                          'main.py': {'source_hash': 'ab' * 32,
                                      'facts': {'valid': True, 'imports': imports, 'exports': {}}},
                          'helper.py': {'source_hash': 'cd' * 32,
                                        'facts': {'valid': True, 'imports': [], 'exports': exports}}},
                      'coverage': {'dynamic_dispatch': []}}

    def report(self, index=None):
        return score({'tasks': [self.task]}, index or self.index, python_imports=True)

    def test_other_member_on_same_line_is_not_a_false_edge(self):
        result = self.report()
        self.assertTrue(result['passed'])
        self.assertEqual(result['outcomes'][0]['proven_arcs_at_site'], 1)

    def test_wrong_target_at_same_member_is_a_false_edge(self):
        arc = copy.deepcopy(self.index['arcs'][0])
        arc['target'] = 4
        self.index['arcs'].append(arc)
        result = self.report()
        self.assertFalse(result['passed'])
        self.assertEqual(result['unmatched_proven_at_positive_sites'], 1)

    def test_missing_or_inconsistent_source_and_target_ledgers_fail(self):
        for case in ('source', 'target', 'invalid-source', 'invalid-target', 'target-hash',
                     'export-span', 'import-span', 'imported-name', 'source-tag'):
            with self.subTest(case=case):
                index = copy.deepcopy(self.index)
                files = index['python_files']
                if case in ('source', 'target'):
                    del files['main.py' if case == 'source' else 'helper.py']
                elif case.startswith('invalid'):
                    files['main.py' if case == 'invalid-source' else 'helper.py']['facts']['valid'] = False
                elif case == 'target-hash':
                    files['helper.py']['source_hash'] = 'ef' * 32
                elif case == 'export-span':
                    files['helper.py']['facts']['exports']['target'] = [0, 1]
                elif case == 'source-tag':
                    index['documents'][0]['semantic_tags'] = []
                else:
                    files['main.py']['facts']['imports'][0][
                        'span' if case == 'import-span' else 'imported'] = [0, 1] if case == 'import-span' else 'other'
                self.assertFalse(self.report(index)['passed'])


if __name__ == '__main__':
    unittest.main()
