"""Transport-integrity regressions for the relationship quality gate."""
import contextlib
import copy
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import eval_relationships as evaluator


class IntegrityTests(unittest.TestCase):
    def responses(self):
        cases = json.loads((evaluator.ROOT / 'contracts/relationship_cases_v1.json').read_text())['cases']
        replies = [{'id': 1, 'result': {'protocolVersion': '2025-06-18'}}]
        for i, case in enumerate(cases, 2):
            nodes = [dict(n, hop=1) for n in case['expected_callers']]
            replies.append({'id': i, 'result': {'structuredContent': {
                'nodes': nodes, 'total': len(nodes), 'truncated': False}}})
        return replies

    def run_gate(self, replies):
        result = subprocess.CompletedProcess([], 0, '\n'.join(map(json.dumps, replies)), '')
        with patch.object(sys, 'argv', ['eval', '/unused']), patch.object(evaluator, 'git'), \
                patch.object(evaluator.subprocess, 'run', return_value=result), \
                contextlib.redirect_stdout(io.StringIO()):
            return evaluator.main()

    def test_complete_replies_pass(self):
        self.assertEqual(self.run_gate(self.responses()), 0)

    def test_incomplete_or_inconsistent_traces_fail(self):
        for changes in ({'truncated': True}, {'total': 51}, {'total': True},
                        {'total': -1}, {'truncated': None}):
            with self.subTest(changes=changes):
                replies = self.responses()
                replies[1]['result']['structuredContent'].update(changes)
                with self.assertRaises(RuntimeError):
                    self.run_gate(replies)

    def test_missing_completeness_metadata_fails(self):
        for key in ('total', 'truncated'):
            with self.subTest(key=key):
                replies = self.responses()
                del replies[1]['result']['structuredContent'][key]
                with self.assertRaises(RuntimeError):
                    self.run_gate(replies)

    def test_duplicate_response_ids_fail(self):
        replies = self.responses()
        replies.append(copy.deepcopy(replies[1]))
        with self.assertRaises(RuntimeError):
            self.run_gate(replies)

    def test_duplicate_nodes_fail(self):
        replies = self.responses()
        trace = replies[1]['result']['structuredContent']
        trace['nodes'].append(copy.deepcopy(trace['nodes'][0]))
        trace['total'] = len(trace['nodes'])
        with self.assertRaisesRegex(RuntimeError, 'duplicate'):
            self.run_gate(replies)

    def test_distinct_nodes_sharing_symbol_and_path_pass(self):
        replies = self.responses()
        trace = replies[1]['result']['structuredContent']
        trace['nodes'][0]['node_id'] = 'caller-a'
        other = dict(trace['nodes'][0], node_id='caller-b')
        trace['nodes'].append(other)
        trace['total'] = len(trace['nodes'])
        self.assertEqual(self.run_gate(replies), 0)

    def test_missing_response_fails(self):
        with self.assertRaises(RuntimeError):
            self.run_gate(self.responses()[:-1])

    def test_failed_initialize_fails(self):
        replies = self.responses()
        replies[0] = {'id': 1, 'error': {'code': -32603}}
        with self.assertRaises(RuntimeError):
            self.run_gate(replies)

    def test_unexpected_hop_fails(self):
        replies = self.responses()
        replies[1]['result']['structuredContent']['nodes'][0]['hop'] = 2
        with self.assertRaises(RuntimeError):
            self.run_gate(replies)

    def test_failed_tool_fails(self):
        replies = self.responses()
        replies[1]['result']['isError'] = True
        with self.assertRaises(RuntimeError):
            self.run_gate(replies)

    @unittest.skipUnless(os.environ.get('CGRX_EVAL_BINARY'), 'set CGRX_EVAL_BINARY for real MCP')
    def test_real_mcp_fifty_one_callers_rejected(self):
        with self.assertRaisesRegex(RuntimeError, 'truncated'):
            self.run_real_fanout(51)

    @unittest.skipUnless(os.environ.get('CGRX_EVAL_BINARY'), 'set CGRX_EVAL_BINARY for real MCP')
    def test_real_mcp_fifty_callers_pass(self):
        self.assertEqual(self.run_real_fanout(50), 0)

    def run_real_fanout(self, count):
        binary = str(Path(os.environ['CGRX_EVAL_BINARY']).resolve())
        with tempfile.TemporaryDirectory(prefix='cgrx-eval-fanout-') as directory:
            root = Path(directory)
            fixture = root / 'fixtures/relationship-eval'
            fixture.mkdir(parents=True)
            (fixture / 'main.py').write_text('def target():\n    return 1\n' + ''.join(
                f'\ndef caller_{i}():\n    return target()\n' for i in range(count)))
            (root / 'contracts').mkdir()
            contract = {'schema_version': 1, 'cases': [{'id': 'fanout', 'language': 'python',
                'target': {'symbol': 'target', 'path': 'main.py'}, 'expected_callers': [
                    {'symbol': f'caller_{i}', 'path': 'main.py'} for i in range(count)]}]}
            (root / 'contracts/relationship_cases_v1.json').write_text(json.dumps(contract))
            with patch.object(evaluator, 'ROOT', root), patch.object(sys, 'argv', ['eval', binary]):
                with contextlib.redirect_stdout(io.StringIO()):
                    return evaluator.main()


if __name__ == '__main__':
    unittest.main()
