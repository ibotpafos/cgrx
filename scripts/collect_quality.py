#!/usr/bin/env python3
"""Paired bounded CALLS measurements over explicitly configured local MCP stdio.

Never an oracle: validate_real_tasks checks the independently curated corpus.
Unknown metrics/errors are retained and make comparator input fail closed.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import selectors
import signal
import re
import shlex
import subprocess
import sys
import time
import threading

from compare_quality import read_json, require
from validate_real_tasks import validate, git


def digest(data):
    return hashlib.sha256(data).hexdigest()


def select_tasks(tasks, selection):
    """Select a preregistered corpus slice without consulting engine output."""
    require(isinstance(selection, dict), 'selection must be an object')
    allowed = {'ids', 'relations', 'splits', 'repos', 'categories'}
    require(set(selection) <= allowed, 'unknown selection field')
    selected = list(tasks)
    fields = {
        'ids': lambda task: task['id'],
        'relations': lambda task: task['expected']['relation'],
        'splits': lambda task: task['split'],
        'repos': lambda task: task['repo'],
        'categories': lambda task: task.get('category', 'legacy'),
    }
    for key, value in selection.items():
        require(isinstance(value, list) and value
                and all(isinstance(item, str) and item for item in value),
                'invalid selection '+key)
        require(len(value) == len(set(value)), 'duplicate selection '+key)
        selected = [task for task in selected if fields[key](task) in value]
    require(selected, 'selection matched no tasks')
    return selected


def response(raw, request_id):
    obj = read_json(raw)
    require(isinstance(obj, dict) and obj.get('jsonrpc') == '2.0', 'invalid RPC envelope')
    require(type(obj.get('id')) is int and obj['id'] == request_id, 'RPC id mismatch')
    require('error' not in obj and 'result' in obj, 'RPC error: ' + str(obj.get('error')))
    require(isinstance(obj['result'], dict), 'RPC result must be an object')
    return obj['result']


def payload(result):
    require(isinstance(result, dict), 'tool result must be an object')
    require('isError' not in result or type(result['isError']) is bool, 'invalid isError flag')
    require(result.get('isError') is not True, 'tool error: ' + str(result))
    if 'structuredContent' in result:
        value = result['structuredContent']
    else:
        blocks = result.get('content')
        require(isinstance(blocks, list) and len(blocks) == 1 and
                isinstance(blocks[0], dict) and blocks[0].get('type') == 'text'
                and isinstance(blocks[0].get('text'), str), 'unsupported tool content')
        text = blocks[0]['text']
        value = cbm_table(text) if text.startswith('rows:') else read_json(text)
    require(isinstance(value, dict), 'tool payload must be an object')
    require('error' not in value, 'tool payload error: '+str(value.get('error')))
    return value


def cbm_table(text):
    """Strict installed CBM query_graph table contract; unknown encodings fail."""
    lines = text.strip().splitlines()
    if lines and lines[-1].startswith('hint: '):
        require(isinstance(read_json(lines[-1][6:]),str), 'invalid CBM hint')
        lines.pop()
    require(len(lines) >= 2, 'invalid CBM table')
    header = re.fullmatch(r'rows: (\d+)  \(cols: ([a-z_ ]+)\)', lines[0])
    footer = re.fullmatch(r'total: (\d+)', lines[-1])
    require(header is not None and footer is not None, 'unknown CBM table schema')
    columns = header[2].split()
    require(len(set(columns)) == len(columns), 'duplicate CBM columns')
    require(columns in (['name','path','line'], ['name','path','line','strategy','confidence']),
            'unsupported CBM columns')
    rows = []
    for line in lines[1:-1]:
        values = shlex.split(line)
        require(len(values) == len(columns), 'CBM row width mismatch')
        row = dict(zip(columns, values))
        if 'line' in row:
            require(row['line'].isdigit(), 'missing CBM line')
            row['line'] = int(row['line'])
        rows.append(row)
    require(int(header[1]) == int(footer[1]) == len(rows), 'CBM table truncated')
    return {'results':rows,'total':len(rows)}


def sample_rss(pid):
    """Actual endpoint PID RSS sample, not machine RSS or process-tree peak."""
    if type(pid) is not int or pid <= 0:
        return None
    try:
        raw = subprocess.check_output(['ps', '-o', 'rss=', '-p', str(pid)],
                                      stderr=subprocess.DEVNULL, timeout=1)
        value = int(raw.strip())
        return value * 1024 if value > 0 else None
    except (OSError, ValueError, subprocess.SubprocessError):
        return None


class Stdio:
    """NDJSON MCP, bounded frames/time, no shell; one outstanding request."""
    def __init__(self, spec, timeout, max_bytes):
        self.spec, self.timeout, self.max_bytes = spec, timeout, max_bytes
        self.seq, self.buffer, self.rss = 0, b'', []
        env = os.environ.copy()
        env.update(spec.get('env', {}))
        self.proc = subprocess.Popen(spec['argv'], stdin=subprocess.PIPE,
                                     stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                                     cwd=spec['cwd'], env=env, start_new_session=True)
        os.set_blocking(self.proc.stdin.fileno(), False)
        self.write_failed = False
        self.selector = selectors.DefaultSelector()
        self.selector.register(self.proc.stdout, selectors.EVENT_READ)
        self.stop = threading.Event()
        self.sampler = threading.Thread(target=self._sample, daemon=True)
        self.sampler.start()

    def _sample(self):
        while not self.stop.is_set():
            rss = sample_rss(self.proc.pid)
            if rss is not None: self.rss.append(rss)
            self.stop.wait(.02)

    def _write(self, wire, end):
        # Never buffer partial JSON in Python: close must not flush a stalled pipe.
        require(not self.write_failed, 'endpoint stream invalid after failed write')
        remaining = memoryview(wire)
        try:
            with selectors.DefaultSelector() as writable:
                writable.register(self.proc.stdin, selectors.EVENT_WRITE)
                while remaining:
                    left = end - time.monotonic()
                    require(left > 0, 'request timeout during stdin write')
                    if not writable.select(left):
                        raise ValueError('request timeout during stdin write')
                    try:
                        written = os.write(self.proc.stdin.fileno(), remaining)
                    except BlockingIOError:
                        continue
                    require(written > 0, 'endpoint stdin closed')
                    remaining = remaining[written:]
        except (ValueError, OSError):
            self.write_failed = True
            raise

    def notify(self, method):
        end = time.monotonic() + self.timeout
        self._write((json.dumps({'jsonrpc':'2.0','method':method})+'\n').encode(), end)

    def request(self, method, params):
        end = time.monotonic() + self.timeout
        self.seq += 1
        wire = json.dumps({'jsonrpc':'2.0','id':self.seq,'method':method,'params':params})+'\n'
        self._write(wire.encode(), end)
        received = 0
        while time.monotonic() < end:
            if b'\n' not in self.buffer:
                if not self.selector.select(min(.05, max(0, end-time.monotonic()))): continue
                chunk = os.read(self.proc.stdout.fileno(), 65536)
                require(bool(chunk), 'endpoint EOF')
                self.buffer += chunk; received += len(chunk)
                require(received <= self.max_bytes, 'response byte budget exceeded')
                continue
            raw, self.buffer = self.buffer.split(b'\n', 1)
            obj = read_json(raw.decode('utf-8'))
            if isinstance(obj, dict) and 'id' not in obj and 'method' in obj:
                continue  # notifications count against byte/time budgets
            return response(raw.decode('utf-8'), self.seq), raw.decode('utf-8')
        raise ValueError('request timeout')

    def close(self):
        self.stop.set(); self.sampler.join(timeout=2)
        self.selector.close()
        self.proc.stdin.close()
        try:
            self.proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            os.killpg(self.proc.pid, signal.SIGTERM)
            try: self.proc.wait(timeout=2)
            except subprocess.TimeoutExpired:
                os.killpg(self.proc.pid, signal.SIGKILL); self.proc.wait(timeout=2)
        self.proc.stdout.close()


class Budgeted:
    """One shared per-arm ceiling includes initialization, discovery and retries."""
    def __init__(self, transport, budget):
        self.transport, self.budget = transport, budget
    @property
    def rss(self): return self.transport.rss
    def notify(self, method): return self.transport.notify(method)
    def close(self): return self.transport.close()
    def request(self, method, params):
        require(self.budget['used'] < self.budget['limit'], 'request budget exhausted')
        self.budget['used'] += 1
        return self.transport.request(method, params)


def request_attempts(transport, method, params, retries):
    attempts, result = [], None
    for retry in range(retries + 1):
        start = time.perf_counter_ns()
        try:
            result, raw = transport.request(method, params)
            attempts.append({'retry':retry,'success':True,'raw':raw})
        except (ValueError, OSError) as exc:
            attempts.append({'retry':retry,'success':False,'error':str(exc), 'raw':None})
        attempts[-1]['latency_ms'] = (time.perf_counter_ns()-start)/1e6
        if attempts[-1]['success']: break
    return result, attempts


def frozen_snapshot(repo, revision):
    root = Path(repo)
    require(root.is_absolute() and str(root.resolve()) == repo, 'canonical repo required')
    require(git(repo, 'rev-parse', '--show-toplevel').decode().strip() == repo, 'Git root mismatch')
    require(git(repo, 'rev-parse', 'HEAD').decode().strip() == revision, 'revision mismatch')
    require(not git(repo, 'status', '--porcelain', '--untracked-files=normal'), 'repository must be clean')
    # Resolve committed names once, then stream blobs through one Git process.
    # Working bytes are still compared with every committed blob, including
    # assume-unchanged files; this is not a git-status-only shortcut.
    entries = {}
    for row in git(repo, 'ls-tree', '-r', '-z', '--full-tree', revision).split(b'\0'):
        if not row: continue
        metadata, name = row.split(b'\t', 1)
        mode, kind, oid = metadata.split()
        require(kind == b'blob' and mode in (b'100644', b'100755'),
                'submodules/symlinks unsupported')
        entries[name] = oid
    names = sorted(name for name in git(repo, 'ls-files', '-z').split(b'\0') if name)
    require(set(names) == set(entries), 'tracked inventory changed')
    h = hashlib.sha256()
    proc = subprocess.Popen(['git', '-C', repo, 'cat-file', '--batch'],
                            stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                            stderr=subprocess.DEVNULL)
    try:
        for name in names:
            p = root / os.fsdecode(name)
            require(p.is_file() and not p.is_symlink() and p.resolve() == p,
                    'submodules/symlinks unsupported')
            data = p.read_bytes()
            oid = entries[name]
            proc.stdin.write(oid + b'\n'); proc.stdin.flush()
            header = proc.stdout.readline(256).split()
            require(len(header) == 3 and header[:2] == [oid, b'blob']
                    and header[2].isdigit(), 'invalid Git blob header')
            size = int(header[2])
            require(size == len(data), 'source changed')
            require(proc.stdout.read(size) == data and proc.stdout.read(1) == b'\n',
                    'source changed')
            h.update(len(name).to_bytes(8,'big')); h.update(name)
            h.update(len(data).to_bytes(8,'big')); h.update(data)
        proc.stdin.close()
        require(proc.wait(timeout=10) == 0, 'Git blob reader failed')
    finally:
        try:
            proc.stdin.close()
        except OSError:
            pass
        try:
            proc.stdout.close()
        finally:
            if proc.poll() is None:
                proc.kill(); proc.wait(timeout=10)
    return {'repo':repo,'revision':revision,'source_digest':h.hexdigest()}


def safe_path(path, repo):
    require(isinstance(path, str) and bool(path), 'missing evidence path')
    p = Path(path)
    if p.is_absolute():
        try: p = p.relative_to(repo)
        except ValueError as exc: raise ValueError('outside-repo evidence') from exc
    require('..' not in p.parts and str(p) != '.' and p.as_posix() == str(p), 'unsafe evidence path')
    return p.as_posix()


def cgrx_node(node, repo):
    require(isinstance(node, dict), 'invalid CGRX node')
    path = safe_path(node.get('path'), repo)
    span = node.get('span')
    require(isinstance(span, dict) and type(span.get('start')) is int
            and type(span.get('end')) is int and 0 <= span['start'] < span['end'],
            'invalid CGRX span')
    data = (Path(repo)/path).read_bytes()
    require(span['end'] <= len(data), 'span outside source')
    require(isinstance(node.get('symbol'), str) and node['symbol'], 'missing symbol')
    return {'path':path,'symbol':node['symbol'],
            'line':data[:span['start']].count(b'\n')+1,'raw':node}


def cgrx_nodes(value, repo):
    require(value.get('truncated') is False, 'CGRX truncated/unknown completeness')
    require(type(value.get('depth')) is int and value['depth'] == 1
            and value.get('direction') == 'callees', 'CGRX trace direction/depth mismatch')
    nodes = value.get('nodes')
    require(isinstance(nodes, list) and type(value.get('total')) is int
            and value['total'] == len(nodes), 'CGRX node count/schema mismatch')
    result = []
    for node in nodes:
        require(isinstance(node, dict) and type(node.get('hop')) is int
                and node['hop'] == 1 and node.get('direction') == 'callees',
                'CGRX node is not a direct callee')
        result.append(cgrx_node(node, repo))
    return result


def cbm_nodes(value, repo, limit):
    # query_graph's JSON rows are explicitly requested, not parsed from a tree.
    rows = value.get('results')
    require(isinstance(rows, list) and type(value.get('total')) is int
            and value['total'] == len(rows), 'CBM row count/schema mismatch')
    for flag in ('truncated', 'has_more'):
        require(flag not in value or type(value[flag]) is bool, 'invalid CBM '+flag)
    require(value.get('next') is None or isinstance(value['next'], str), 'invalid CBM next')
    require(len(rows) < limit and not value.get('truncated') and not value.get('has_more')
            and not value.get('next'), 'CBM truncated or capped')
    result = []
    for row in rows:
        require(isinstance(row,dict), 'unsupported CBM row schema')
        path = safe_path(row.get('path'), repo)
        require(type(row.get('line')) is int and row['line'] > 0, 'missing CBM source line')
        require(isinstance(row.get('name'),str) and row['name'], 'missing CBM symbol')
        require((Path(repo)/path).is_file(), 'missing CBM source file')
        result.append({'path':path,'symbol':row['name'],'line':row['line'],'raw':row})
    return result


def call_request(engine, task, spec, limit):
    require(task['expected']['relation'] == 'CALLS', 'unsupported relation: REFERENCE')
    source = task['evidence']['source']
    if engine == 'cgrx':
        return {'name':'trace_path','arguments':{'repo':task['repo'],'symbol':source['symbol'],
                'path':source['path'],'direction':'callees','depth':1,'limit':limit}}
    # Exact independently supplied source anchor, not an oracle learned from graph output.
    quoted = json.dumps(str(Path(task['repo'])/source['path']))
    name = json.dumps(source['symbol'])
    query = (f'MATCH (s)-[r:CALLS]->(t) WHERE (s.file_path = {quoted} OR s.file_path = {json.dumps(source["path"])}) AND s.name = {name} '
             f'AND s.start_line >= {source["start_line"]} AND s.start_line <= {source["end_line"]} '
             'RETURN t.name AS name, t.file_path AS path, t.start_line AS line, '
             'r.resolution_strategy AS strategy, r.confidence AS confidence '
             f'LIMIT {limit}')
    return {'name':'query_graph','arguments':{'project':spec['projects'][task['repo']],
                                             'query':query,'max_rows':limit}}


def engine_identity(spec):
    argv = spec.get('argv')
    require(isinstance(argv,list) and argv and all(isinstance(x,str) and x for x in argv), 'invalid argv')
    exe = Path(argv[0])
    require(exe.is_absolute() and exe.is_file(), 'explicit installed executable required')
    require(isinstance(spec.get('mode'),str) and spec['mode'], 'explicit engine mode required')
    require(Path(spec['cwd']).is_dir(), 'endpoint cwd missing')
    require(spec.get('rss_scope','unknown') in ('direct-process','endpoint-only','unknown'), 'invalid RSS scope')
    # Also pin launch scripts/interpreters supplied by the operator, not just argv[0].
    artifacts = spec.get('artifacts', [])
    require(isinstance(artifacts,list), 'invalid artifacts')
    hashes = {str(p.resolve()):digest(p.read_bytes()) for p in [exe,*map(Path,artifacts)]}
    return {'argv':argv,'executable':str(exe.resolve()),'sha256':hashes,'mode':spec['mode'],
            'version':'unknown-uninitialized','rss_scope':spec.get('rss_scope','unknown')}


def tokenizer(name):
    import tiktoken
    enc = tiktoken.get_encoding(name)
    identity = 'tiktoken/'+tiktoken.__version__+'/'+name
    # Pin actual encoder vocabulary; a name alone does not pin implementation data.
    vocabulary = sorted((key.hex(), value) for key,value in enc._mergeable_ranks.items())
    identity += '/'+digest(json.dumps([vocabulary,enc._special_tokens,enc._pat_str],sort_keys=True).encode())
    return identity, lambda raw: len(enc.encode(raw, disallowed_special=()))


def initialize(transport):
    result, raw = transport.request('initialize', {'protocolVersion':'2025-06-18',
        'capabilities':{},'clientInfo':{'name':'collect-quality','version':'1'}})
    require(isinstance(result.get('serverInfo'),dict) and result['serverInfo'].get('version'),
            'missing server version')
    transport.notify('notifications/initialized')
    listed, _ = transport.request('tools/list', {})
    require(isinstance(listed.get('tools'),list), 'invalid tools/list')
    return result['serverInfo'], listed


def status_request(engine, task, spec):
    if engine == 'cgrx': return {'name':'status','arguments':{'repo':task['repo'],'paths_or_scope':['**']}}
    return {'name':'index_status','arguments':{'project':spec['projects'][task['repo']],'verbose':True}}


def attest(engine, value, task):
    if engine == 'cgrx':
        require(isinstance(value.get('snapshot'), dict) and value.get('repo') == task['repo'] and value['snapshot'].get('repo_revision') == task['revision'],
                'CGRX snapshot mismatch')
        require(value.get('freshness') == 'WATCHED' and value.get('changed_paths') == [], 'CGRX freshness mismatch')
    else:
        # Installed index_status fields; forced index before this check binds source to this run.
        require(value.get('status') == 'ready', 'CBM index not ready')
        require(value.get('root_path') == task['repo'], 'CBM root attestation unavailable')
        require(value.get('git',{}).get('head_sha') == task['revision'], 'CBM revision attestation unavailable')


def collect(corpus, config, factory=Stdio, counter=None):
    validate(corpus)
    selection = config.get('selection')
    tasks = select_tasks(corpus['tasks'], selection) if selection is not None else corpus['tasks']
    protocol = config['protocol']
    require(protocol['cache'] in ('warm','process-cold'), 'unsupported cache protocol')
    for key, low, high in [('repetitions',3,100),('warmups',0,10),('retries',0,3),('limit',1,50),('max_response_bytes',1024,16777216)]:
        require(type(protocol.get(key)) is int and low <= protocol[key] <= high, 'invalid '+key)
    require(type(protocol.get('timeout_seconds')) in (float,int) and 0 < protocol['timeout_seconds'] <= 300, 'invalid timeout')
    require(protocol['cache'] != 'warm' or protocol['warmups'] >= 1, 'warm needs warmup')
    require(protocol['cache'] != 'process-cold' or protocol['warmups'] == 0, 'cold forbids warmup')
    sessions = 1 if protocol['cache'] == 'warm' else protocol['repetitions']
    require(type(protocol.get('request_budget')) is int and protocol['request_budget'] ==
            protocol['repetitions']*(1+protocol['retries'])+protocol['warmups']+5*sessions,
            'request budget must equal repetitions*(1+retries)+warmups+5*sessions')
    snapshots = {}
    for task in tasks:
        key = (task['repo'], task['revision'])
        if key not in snapshots:
            snapshots[key] = frozen_snapshot(*key)
    identity, count = counter if counter else tokenizer(config['tokenizer'])
    specs = config['engines']
    output = {'schema_version':1,'environment':platform.platform()+'; single sequential collector',
              'tokenizer':identity,'engines':{e:engine_identity(specs[e]) for e in ('cgrx','cbm')},
              'config_sha256':digest(json.dumps(config,sort_keys=True).encode()),
              'protocol':protocol,'corpus_sha256':digest(json.dumps(corpus,sort_keys=True).encode()),
              'selection':selection,
              'selected_corpus_sha256':digest(json.dumps(tasks,sort_keys=True).encode()),
              'cases':[], 'collector':{'version':1,'metric_scope':'tool requests, not end-task agent totals',
                  'rss':'sampled endpoint PID high-water; excludes daemon/children and is not OS peak',
                  'cache':'process-cold retains persistent index and OS page cache; setup status precedes query'}}
    for task_index, task in enumerate(tasks):
        snap = snapshots[(task['repo'],task['revision'])]
        target = task['evidence']['target']
        record = f'{target["path"]}:{target["symbol"]}:{target["start_line"]}'
        suffix = Path(task['evidence']['source']['path']).suffix
        language = {'.go':'go','.ts':'typescript','.tsx':'typescript','.py':'python','.rs':'rust'}.get(suffix)
        require(language is not None, 'unsupported language')
        row = {'id':task['id'],'language':language,'split':task['split'],'snapshot':snap,
               'expected':[record], 'assertion':'bounded source-to-designated-target CALLS membership'}
        output['cases'].append(row)
        # Alternate arm order by task, not according to outcomes. Same request budget in each arm.
        order = ('cgrx','cbm') if task_index % 2 == 0 else ('cbm','cgrx')
        row['order'] = list(order)
        for engine in order:
            result = {'success':False,'complete':False,'snapshot':snap,'actual':[],
                      'latency_ms':[],'peak_rss_bytes':None,'response_tokens':None,
                      'samples':[], 'setup':[], 'errors':[]}
            row[engine] = result
            transport = None
            budget = {'used':0,'limit':protocol['request_budget']}
            all_rss, token_total, actuals = [], 0, []
            try:
                require(frozen_snapshot(task['repo'],task['revision']) == snap,
                        'snapshot changed before engine collection')
                params = call_request(engine,task,specs[engine],protocol['limit'])
                for repetition in range(protocol['repetitions']):
                    if transport is None:
                        transport = Budgeted(factory(specs[engine], protocol['timeout_seconds'],protocol['max_response_bytes']), budget)
                        info, listed = initialize(transport)
                        prior = output['engines'][engine]['version']
                        require(prior in ('unknown-uninitialized',info['version']), 'engine version changed')
                        output['engines'][engine]['version'] = info['version']
                        schema_digest = digest(json.dumps(listed,sort_keys=True).encode())
                        previous_schema = output['engines'][engine].setdefault('tools_digest', schema_digest)
                        require(previous_schema == schema_digest, 'tool schema changed between sessions')
                        result['setup'].append({'serverInfo':info,'tools_digest':digest(json.dumps(listed,sort_keys=True).encode())})
                        require(params['name'] in [t.get('name') for t in listed['tools']], 'missing endpoint tool')
                        if engine == 'cbm':
                            indexed, indexed_raw = transport.request('tools/call', {'name':'index_repository',
                                'arguments':{'repo_path':task['repo'], 'name':specs[engine]['projects'][task['repo']],
                                             'mode':specs[engine]['mode'], 'persistence':False}})
                            payload(indexed)
                            result['setup'][-1]['index_response'] = indexed_raw
                            source = task['evidence']['source']
                            query = (f'MATCH (s) WHERE (s.file_path = {json.dumps(source["path"])} OR '
                                     f's.file_path = {json.dumps(str(Path(task["repo"])/source["path"]))}) '
                                     f'AND s.name = {json.dumps(source["symbol"])} '
                                     f'AND s.start_line >= {source["start_line"]} AND s.start_line <= {source["end_line"]} '
                                     'RETURN s.name AS name, s.file_path AS path, s.start_line AS line LIMIT 2')
                            found, found_raw = transport.request('tools/call', {'name':'query_graph','arguments':{
                                'project':specs[engine]['projects'][task['repo']],'query':query,'max_rows':2}})
                            found_nodes = cbm_nodes(payload(found), task['repo'], 2)
                            require(len(found_nodes) == 1, 'CBM source missing or ambiguous')
                            found_node = found_nodes[0]
                            require(found_node['path'] == source['path']
                                    and found_node['symbol'] == source['symbol']
                                    and source['start_line'] <= found_node['line'] <= source['end_line'],
                                    'CBM source anchor mismatch')
                            result['setup'][-1]['source_response'] = found_raw
                        state, _ = transport.request('tools/call', status_request(engine,task,specs[engine]))
                        state = payload(state); attest(engine,state,task)
                        result['setup'][-1]['status'] = state
                        for _ in range(protocol['warmups']):
                            warmed, raw = transport.request('tools/call',params)
                            payload(warmed)
                            result['setup'].append({'warmup_raw':raw})
                    start = time.perf_counter_ns()
                    answer, attempts = request_attempts(transport,'tools/call',params,protocol['retries'])
                    latency = (time.perf_counter_ns()-start)/1e6
                    result['samples'].append({'repetition':repetition,'attempts':attempts})
                    result['latency_ms'].append(latency)
                    require(answer is not None, 'request retries exhausted')
                    require(all(a['raw'] is not None for a in attempts), 'failed attempt response tokens unknown')
                    token_total += sum(count(a['raw']) for a in attempts)
                    value = payload(answer)
                    if engine == 'cgrx':
                        require(isinstance(value.get('snapshot'), dict) and value.get('repo') == task['repo'] and value['snapshot'].get('repo_revision') == task['revision'], 'trace snapshot mismatch')
                        root = value.get('root', {})
                        require(isinstance(root, dict) and root.get('path') == task['evidence']['source']['path'] and root.get('symbol') == task['evidence']['source']['symbol'], 'trace root mismatch')
                        root_node = cgrx_node(root,task['repo'])
                        require(task['evidence']['source']['start_line'] <= root_node['line'] <= task['evidence']['source']['end_line'], 'trace root outside source anchor')
                        nodes = cgrx_nodes(value,task['repo'])
                    else: nodes = cbm_nodes(value,task['repo'],protocol['limit'])
                    matches = [n for n in nodes if n['path'] == target['path'] and n['symbol'] == target['symbol']
                               and target['start_line'] <= n['line'] <= target['end_line']]
                    actuals.append([record] if matches else [])
                    result['samples'][-1]['target_evidence'] = matches
                    all_rss.extend(transport.rss)
                    if protocol['cache'] == 'process-cold': transport.close(); transport = None
                require(all(a == actuals[0] for a in actuals), 'unstable repeated answers')
                require(frozen_snapshot(task['repo'],task['revision']) == snap, 'snapshot changed during collection')
                require(engine_identity(specs[engine])['sha256'] == output['engines'][engine]['sha256'], 'engine changed during run')
                result.update(actual=actuals[0],response_tokens=token_total,
                              endpoint_peak_rss_bytes=max(all_rss) if all_rss else None,
                              peak_rss_bytes=max(all_rss) if all_rss and specs[engine].get('rss_scope') == 'direct-process' else None)
                require(result['peak_rss_bytes'] is not None, 'engine RSS unavailable: endpoint proxy/unknown process scope')
                result.update(success=True,complete=True)
            except (ValueError,KeyError,TypeError,OSError,subprocess.SubprocessError) as exc:
                result['errors'].append(str(exc))
            finally:
                result['requests_used'] = budget['used']
                if transport is not None: transport.close()
    return output


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('corpus',type=Path); p.add_argument('config',type=Path); p.add_argument('output',type=Path)
    args=p.parse_args()
    try:
        result=collect(read_json(args.corpus.read_text()),read_json(args.config.read_text()))
        args.output.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
        good=all(row[e]['success'] and row[e]['complete'] for row in result['cases'] for e in ('cgrx','cbm'))
        print(json.dumps({'collected':good,'cases':len(result['cases']),'output':str(args.output.resolve())}))
        return 0 if good else 2
    except (ValueError,KeyError,TypeError,OSError,ImportError) as exc:
        print(json.dumps({'collected':False,'error':str(exc)}));return 2

if __name__ == '__main__': sys.exit(main())
