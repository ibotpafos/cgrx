#!/usr/bin/env python3
"""Reproducible local HTTP isolation benchmark. Never writes capability tokens."""
import argparse, concurrent.futures, http.client, json, pathlib, socket, statistics, subprocess, tempfile, time
p=argparse.ArgumentParser(); p.add_argument('--binary', required=True); p.add_argument('--output', required=True); a=p.parse_args()
def git(root,*args): subprocess.run(['git','-C',str(root),*args],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
def fixture(root, files):
    root.mkdir(); git(root,'init','-q'); git(root,'config','user.email','fixture@example.invalid'); git(root,'config','user.name','CGRX benchmark')
    for i in range(files): (root/f'm{i}.rs').write_text('\n'.join(f'fn f{i}_{j}() {{ f{i}_{(j+1)%100}(); }}' for j in range(100)))
    git(root,'add','.'); git(root,'commit','-qm','deterministic fixture')
with tempfile.TemporaryDirectory(prefix='cgrx-http-bench-') as tmp:
    root=pathlib.Path(tmp); fixture(root/'ready',1); fixture(root/'cold-a',100); fixture(root/'cold-b',100)
    proc=subprocess.Popen([a.binary,'visualize','--root',str(root/'ready'),'--projects-dir',str(root),'--no-open'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    try:
        url=proc.stdout.readline().strip().split('=',1)[1]; origin,token=url.split('/#token='); host=origin.removeprefix('http://')
        def req(path):
            c=http.client.HTTPConnection(host,timeout=5); start=time.perf_counter(); c.request('GET',path,headers={'X-CGRX-Token':token}); r=c.getresponse(); data=r.read(); c.close()
            return r.status, (time.perf_counter()-start)*1000, json.loads(data) if path.startswith('/api') else None
        def ready(path):
            end=time.monotonic()+90
            while True:
                status,ms,value=req(path)
                if status==200:return value
                if status!=202: raise RuntimeError((status,value))
                if time.monotonic()>end:raise TimeoutError(path)
                time.sleep(.05)
        ready('/api/status'); end=time.monotonic()+10
        while True:
            catalogue=ready('/api/projects')
            if not catalogue['discovering']:break
            if time.monotonic()>end:raise TimeoutError('catalogue')
        projects={x['name']:x['id'] for x in catalogue['projects']}
        initial=[req('/api/repository-graph?project='+projects[name])[0] for name in ['cold-a','cold-b']]
        slow=socket.create_connection(tuple([host.split(':')[0],int(host.split(':')[1])]))
        slow.sendall(b'GET / HTTP/1.1\r\nHost: localhost\r\n')
        samples={path:[] for path in ['/assets/styles.css','/api/projects','/api/project-status']}; phases=[]
        for _ in range(60):
            for path in samples:
                status,ms,_=req(path); assert status==200, status; samples[path].append(ms)
            phases.append([req('/api/project-status?project='+projects[name])[2]['state'] for name in ['cold-a','cold-b']]); time.sleep(.02)
        slow.close()
        cold=[ready('/api/repository-graph?project='+projects[name]) for name in ['cold-a','cold-b']]
        result={'initial_statuses':initial,'cold_states_observed':phases,'latency_ms':{path:{'p95':sorted(v)[int(len(v)*.95)-1],'median':statistics.median(v),'n':len(v)} for path,v in samples.items()},'cold_graphs':[{'nodes':len(g['nodes']),'edges':len(g['edges']),'snapshot':g['snapshot']} for g in cold], 'resources':req('/api/project-status')[2]['resources']}
        pathlib.Path(a.output).write_text(json.dumps(result,indent=2)+'\n'); print(json.dumps({'latency_ms':result['latency_ms'],'initial_statuses':initial,'cold_sizes':[(len(g['nodes']),len(g['edges'])) for g in cold]}))
    finally:
        proc.terminate(); proc.wait(timeout=10)
