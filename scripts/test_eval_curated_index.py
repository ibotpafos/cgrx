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


if __name__ == '__main__':
    unittest.main()
