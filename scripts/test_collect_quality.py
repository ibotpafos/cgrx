"""Explicit mock transports only: these tests are not engine benchmarks."""
import copy
import json
from pathlib import Path
import tempfile
import unittest

try:
    import collect_quality as c
except ImportError:
    c = None

class CollectorTests(unittest.TestCase):
    def test_collector_exists(self):
        self.assertIsNotNone(c, 'paired measurement collector missing')

    @unittest.skipIf(c is None, 'collector not implemented')
    def test_rpc_errors_and_schema_fail_closed(self):
        for raw in ['{"jsonrpc":"2.0","id":1,"error":{"code":-1}}',
                    '{"jsonrpc":"2.0","id":2,"result":{}}',
                    '{"jsonrpc":"2.0","id":1,"result":{},"result":{}}',
                    '{"jsonrpc":"2.0","id":1,"result":{"x":NaN}}']:
            with self.assertRaises(ValueError): c.response(raw, 1)

    @unittest.skipIf(c is None, 'collector not implemented')
    def test_unsupported_reference_is_not_empty_success(self):
        with self.assertRaisesRegex(ValueError, 'unsupported'):
            c.call_request('cgrx', {'expected': {'relation': 'REFERENCE'}}, {}, 20)

    @unittest.skipIf(c is None, 'collector not implemented')
    def test_truncation_and_unknown_schema_are_not_complete(self):
        for value in [{'truncated': True, 'nodes': []}, {'nodes': []},
                      {'truncated': False, 'nodes': [], 'total': 1}]:
            with self.assertRaises(ValueError): c.cgrx_nodes(value, '/repo')

    @unittest.skipIf(c is None, 'collector not implemented')
    def test_unknown_rss_is_not_zero(self):
        self.assertIsNone(c.sample_rss(-1))

    @unittest.skipIf(c is None, 'collector not implemented')
    def test_selection_is_explicit_strict_and_outcome_independent(self):
        tasks = [
            {'id':'train-call','repo':'/a','split':'train','category':'call',
             'expected':{'relation':'CALLS'}},
            {'id':'heldout-call','repo':'/b','split':'heldout','category':'receiver',
             'expected':{'relation':'CALLS'}},
            {'id':'heldout-import','repo':'/b','split':'heldout','category':'import',
             'expected':{'relation':'IMPORTS'}},
        ]
        selected = c.select_tasks(tasks, {
            'relations':['CALLS'], 'splits':['heldout'], 'repos':['/b'],
            'ids':['heldout-call']})
        self.assertEqual([task['id'] for task in selected], ['heldout-call'])
        for bad in ({'unknown':['x']}, {'relations':[]},
                    {'relations':['CALLS','CALLS']}, {'repos':['/missing']}):
            with self.subTest(selection=bad), self.assertRaises(ValueError):
                c.select_tasks(tasks, bad)

    @unittest.skipIf(c is None, 'collector not implemented')
    def test_cbm_unknown_shape_rejected(self):
        with self.assertRaises(ValueError): c.cbm_nodes({'total':0}, '/repo', 20)

    @unittest.skipIf(c is None, 'collector not implemented')
    def test_synthetic_mock_retry_accounting(self):
        class Mock:
            def __init__(self): self.calls=0
            def request(self, method, params):
                self.calls += 1
                if self.calls == 1: raise ValueError('synthetic retryable failure')
                return {'ok':True}, '{"ok":true}'
        mock=Mock()
        result, attempts=c.request_attempts(mock, 'tools/call', {}, retries=1)
        self.assertEqual(mock.calls,2)
        self.assertFalse(attempts[0]['success'])
        self.assertTrue(attempts[1]['success'])
        self.assertEqual(result, {'ok':True})


# Explicit in-memory mock endpoints exercise orchestration without claiming measurements.
from unittest.mock import patch
import test_validate_real_tasks as task_tests

@unittest.skipIf(c is None, 'collector not implemented')
class PairedMockTests(unittest.TestCase):
    def setUp(self):
        self.fixture = task_tests.ManifestTests('test_valid'); self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.doc = self.fixture.doc
        repo = str(self.fixture.root)
        self.config = {'tokenizer':'synthetic-token-counter', 'protocol':{
            'cache':'warm','repetitions':3,'warmups':1,'retries':0,'limit':20,
            'timeout_seconds':1,'max_response_bytes':20000,'request_budget':9},
            'engines':{e:{'argv':[str(Path(__file__).resolve())], 'cwd':repo,
                           'mode':'fast','projects':{repo:'synthetic'},'rss_scope':'direct-process'} for e in ('cgrx','cbm')}}
        self.mode = None; self.transports = []

    def run_mock(self):
        outer = self
        class Mock:
            def __init__(self,spec,*_):
                self.rss=[12345]; self.closed=False; self.queries=0
                outer.transports.append(self)
            def notify(self,method): pass
            def close(self): self.closed=True
            def request(self,method,params):
                if method == 'initialize': value={'serverInfo':{'name':'synthetic','version':'mock-1'}}
                elif method == 'tools/list': value={'tools':[{'name':'trace_path'},{'name':'query_graph'}]}
                else:
                    task=outer.doc['tasks'][0]; repo=task['repo']; rev=task['revision']
                    name=params['name']
                    if name == 'status':
                        data={'repo':repo,'snapshot':{'repo_revision':rev},'freshness':'WATCHED','changed_paths':[]}
                    elif name == 'index_status':
                        data={'root_path':repo,'git':{'head_sha':rev},'status':'ready'}
                    elif name == 'index_repository': data={'indexed':True}
                    elif name == 'trace_path':
                        self.queries+=1
                        if outer.mode == 'tool-error': return {'isError':True,'content':[]}, '{}'
                        nodes=[{'path':'sample.py','symbol':'callee','span':{'start':41,'end':47},'hop':1,'direction':'callees'}]
                        data={'repo':repo,'snapshot':{'repo_revision':rev},'root':{'path':'sample.py','symbol':'caller','span':{'start':4,'end':10}},'nodes':nodes,'total':1,'truncated':False,'depth':1,'direction':'callees'}
                        if outer.mode == 'bad-content': return {'content':[None]}, '{}'
                        if outer.mode == 'bad-text': return {'content':[{'type':'text','text':None}]}, '{}'
                        if outer.mode == 'bad-error-flag': return {'isError':'true','structuredContent':data}, '{}'
                        if outer.mode == 'bad-node': data['nodes']=[None]
                        if outer.mode == 'bad-span': nodes[0]['span']=None
                        if outer.mode == 'bad-root': data['root']=None
                        if outer.mode == 'bad-snapshot': data['snapshot']=None
                        if outer.mode == 'wrong-hop': nodes[0]['hop']=2
                        if outer.mode == 'bool-hop': nodes[0]['hop']=True
                        if outer.mode == 'wrong-direction': nodes[0]['direction']='callers'
                        if outer.mode == 'wrong-depth': data['depth']=2
                        if outer.mode == 'wrong-trace-direction': data['direction']='callers'
                        if outer.mode == 'missing-hop': del nodes[0]['hop']
                        if outer.mode == 'truncated': data['truncated']=True
                        if outer.mode == 'wrong-root': data['root']['span']={'start':41,'end':47}
                    else:
                        if 'RETURN s.name' in params['arguments']['query']:
                            data={'results':[{'path':'sample.py','name':'caller','line':1}],'total':1}
                            if outer.mode == 'wrong-source-name': data['results'][0]['name']='callee'
                            if outer.mode == 'wrong-source-line': data['results'][0]['line']=3
                            if outer.mode == 'absolute-source': data['results'][0]['path']=str(Path(repo)/'sample.py')
                        else:
                            self.queries+=1
                            data={'results':[{'path':'sample.py','name':'callee','line':3,'strategy':'synthetic','confidence':'1'}],'total':1}
                            if outer.mode == 'mutate-source':
                                (outer.fixture.root/'sample.py').write_text('reference changed source')
                            if outer.mode == 'unknown-schema': data={}
                            if outer.mode == 'empty-unknown-columns':
                                return {'content':[{'type':'text','text':'rows: 0  (cols: unexpected)\ntotal: 0'}]}, '{}'
                            if outer.mode == 'null-truncated': data['truncated']=None
                            if outer.mode == 'numeric-more': data['has_more']=0
                            if outer.mode == 'list-next': data['next']=[]
                            if outer.mode == 'valid-empty': data={'results':[],'total':0,'truncated':False,'has_more':False,'next':None}
                    value={'structuredContent':data}
                return value,json.dumps(value)
        return c.collect(self.doc,self.config,factory=Mock,counter=('synthetic-counter-v1',lambda raw:len(raw)))

    def test_paired_mock_comparator_schema(self):
        result=self.run_mock()
        for engine in ('cgrx','cbm'):
            row=result['cases'][0][engine]
            self.assertTrue(row['success'],row['errors'])
            self.assertEqual(row['actual'], ['sample.py:callee:3'])
            self.assertEqual(len(row['latency_ms']),3)
            self.assertEqual(row['peak_rss_bytes'],12345)
        import compare_quality
        # Tiny train-only synthetic input is structurally valid, not a passing benchmark.
        self.assertFalse(compare_quality.compare(result,1,1)['passed'])
        self.assertTrue(all(t.closed for t in self.transports))

    def test_mock_negatives_fail_closed(self):
        for mode in ('truncated','wrong-root','tool-error','unknown-schema'):
            with self.subTest(mode=mode):
                self.mode=mode
                result=self.run_mock()
                self.assertFalse(all(result['cases'][0][e]['success'] for e in ('cgrx','cbm')))
                self.assertTrue(all(t.closed for t in self.transports))

    def test_review_blockers_fail_closed_per_arm(self):
        modes = {
            'cgrx': ('bad-content','bad-text','bad-error-flag','bad-node','bad-span',
                     'bad-root','bad-snapshot','wrong-hop','bool-hop','missing-hop',
                     'wrong-direction','wrong-depth','wrong-trace-direction'),
            'cbm': ('wrong-source-name','wrong-source-line','empty-unknown-columns',
                    'null-truncated','numeric-more','list-next'),
        }
        for engine, values in modes.items():
            for mode in values:
                with self.subTest(mode=mode):
                    self.mode=mode
                    row=self.run_mock()['cases'][0][engine]
                    self.assertFalse(row['success'])
                    self.assertFalse(row['complete'])
                    self.assertTrue(row['errors'])
                    self.assertTrue(all(t.closed for t in self.transports))

    def test_valid_empty_and_absolute_anchor(self):
        for mode in ('valid-empty','absolute-source'):
            with self.subTest(mode=mode):
                self.mode=mode
                row=self.run_mock()['cases'][0]['cbm']
                self.assertTrue(row['success'],row['errors'])
                self.assertEqual(row['actual'], [] if mode == 'valid-empty' else ['sample.py:callee:3'])

    def test_proxy_rss_stays_unknown(self):
        self.config['engines']['cbm']['rss_scope']='endpoint-only'
        result=self.run_mock()['cases'][0]['cbm']
        self.assertIsNone(result['peak_rss_bytes'])
        self.assertEqual(result['endpoint_peak_rss_bytes'],12345)
        self.assertFalse(result['success'])

    def test_request_budget_is_enforced(self):
        self.config['protocol']['request_budget']=500
        with self.assertRaisesRegex(ValueError,'budget'): self.run_mock()
        self.assertEqual(self.transports,[])

    def test_process_cold_restarts_with_no_warmup(self):
        self.config['protocol'].update(cache='process-cold',warmups=0,request_budget=18)
        result=self.run_mock()
        self.assertEqual(len(self.transports),6)
        self.assertTrue(all(t.queries == 1 for t in self.transports))
        self.assertTrue(result['cases'][0]['cbm']['success'])

    def test_reference_failure_preserved(self):
        self.doc['tasks'][0]['expected']['relation']='REFERENCE'
        result=self.run_mock()
        self.assertEqual(self.transports,[])
        for engine in ('cgrx','cbm'):
            self.assertFalse(result['cases'][0][engine]['success'])
            self.assertIn('unsupported',result['cases'][0][engine]['errors'][0])

    def test_reference_source_mutation_does_not_abort_remaining_cases(self):
        other = copy.deepcopy(self.doc['tasks'][0])
        other['id'] = 'fixture-2'
        data = self.fixture.source
        def anchor(start, end, symbol):
            lines = data.splitlines(keepends=True)
            return dict(path='sample.py', sha256=task_tests.sha(data), start_line=start,
                        end_line=end, span_sha256=task_tests.sha(b''.join(lines[start-1:end])),
                        symbol=symbol)
        other['evidence']['source'] = anchor(5, 6, 'other')
        other['evidence']['site'] = anchor(6, 6, 'callee')
        self.doc['tasks'].append(other)
        self.mode = 'mutate-source'
        result = self.run_mock()
        self.assertEqual(len(result['cases']), 2)
        self.assertTrue(result['cases'][0]['cgrx']['success'])
        self.assertFalse(result['cases'][0]['cbm']['success'])
        self.assertTrue(result['cases'][1]['cgrx']['errors'])
        self.assertTrue(result['cases'][1]['cbm']['errors'])

    def test_dirty_source_rejected_before_transport(self):
        (self.fixture.root/'sample.py').write_text('changed')
        with self.assertRaises(ValueError): self.run_mock()
        self.assertEqual(self.transports,[])

    def test_snapshot_hash_not_oracle(self):
        before=c.frozen_snapshot(str(self.fixture.root),self.fixture.revision)
        self.assertEqual(len(before['source_digest']),64)
        (self.fixture.root/'untracked.py').write_text('extra')
        with self.assertRaisesRegex(ValueError,'clean'): c.frozen_snapshot(str(self.fixture.root),self.fixture.revision)

@unittest.skipIf(c is None, 'collector not implemented')
class TableTests(unittest.TestCase):
    def test_installed_cbm_table_shape_synthetic_values(self):
        text='rows: 1  (cols: name path line strategy confidence)\n  target src/a.py "1" - "0.55"\ntotal: 1'
        data=c.cbm_table(text)
        self.assertEqual(data['results'][0]['line'],1)
        self.assertEqual(data['results'][0]['confidence'],'0.55')
    def test_empty_cbm_result_with_installed_hint(self):
        text='rows: 0  (cols: name path line strategy confidence)\ntotal: 0\nhint: "Query returned no results."'
        self.assertEqual(c.cbm_table(text)['results'], [])
    def test_zero_rows_require_supported_columns(self):
        for columns in ('unexpected','name path','name path line extra'):
            with self.subTest(columns=columns), self.assertRaises(ValueError):
                c.cbm_table('rows: 0  (cols: '+columns+')\ntotal: 0')
        self.assertEqual(c.cbm_table('rows: 0  (cols: name path line)\ntotal: 0')['results'],[])

    def test_capped_schema_and_duplicate_columns(self):
        for text in ('rows: 0  (cols: name name)\ntotal: 0',
                     'rows: 2  (cols: name)\n x\ntotal: 2',
                     'rows: 0  (cols: name)\ntotal: 1'):
            with self.assertRaises(ValueError): c.cbm_table(text)

@unittest.skipIf(c is None, 'collector not implemented')
class StdioMockTests(unittest.TestCase):
    def transport(self, body, timeout=.5, size=4096):
        import sys
        t=c.Stdio({'argv':[sys.executable,'-u','-c',body], 'cwd':str(Path.cwd())},timeout,size)
        self.addCleanup(t.close)
        return t
    def test_mock_process_valid_rpc(self):
        t=self.transport('import sys,json; q=json.loads(sys.stdin.readline()); print(json.dumps(dict(jsonrpc="2.0",id=q["id"],result={"synthetic":True})))')
        value,raw=t.request('mock',{})
        self.assertTrue(value['synthetic'])
    def test_stdin_write_deadline(self):
        import time
        t=self.transport('import time; time.sleep(.8)',timeout=.05)
        start=time.monotonic()
        try:
            t.request('mock',{'large':'x'*1000000})
        except (ValueError,OSError) as exc:
            error=exc
        else:
            self.fail('nonreading endpoint succeeded')
        self.assertLess(time.monotonic()-start,.4,'stdin exceeded request deadline')
        self.assertIsInstance(error,ValueError)
        self.assertIn('timeout',str(error))
        with self.assertRaisesRegex(ValueError,'stream invalid'):
            t.request('mock',{})
        with self.assertRaisesRegex(ValueError,'stream invalid'):
            t.notify('notifications/initialized')

    def test_large_write_preserves_frame(self):
        t=self.transport('import sys,json; q=json.loads(sys.stdin.readline()); print(json.dumps(dict(jsonrpc="2.0",id=q["id"],result={"length":len(q["params"]["large"])})))',timeout=2)
        value,_=t.request('mock',{'large':'x'*1000000})
        self.assertEqual(value['length'],1000000)

    def test_mock_process_bad_id(self):
        t=self.transport('import sys,json; sys.stdin.readline(); print(json.dumps(dict(jsonrpc="2.0",id=9,result={})))')
        with self.assertRaisesRegex(ValueError,'id mismatch'): t.request('mock',{})
    def test_mock_process_timeout(self):
        t=self.transport('import sys,time; sys.stdin.readline(); time.sleep(5)',timeout=.05)
        with self.assertRaisesRegex(ValueError,'timeout'): t.request('mock',{})
    def test_mock_process_size_limit(self):
        t=self.transport('import sys; sys.stdin.readline(); print("x"*8192)',size=1024)
        with self.assertRaisesRegex(ValueError,'budget'): t.request('mock',{})

if __name__ == '__main__': unittest.main()
