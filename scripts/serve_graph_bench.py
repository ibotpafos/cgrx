#!/usr/bin/env python3
"""Loopback-only fixture harness; reports contain metrics, never project content."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import argparse, json, os
p=argparse.ArgumentParser(); p.add_argument('--directory', default='/tmp/cgrx-alpha15-browser'); p.add_argument('--port', type=int, default=4320); args=p.parse_args()
WEB=Path(__file__).resolve().parents[1]/'crates/cgrx-cli/web'
class Handler(SimpleHTTPRequestHandler):
    def translate_path(self,path):
        if path.startswith('/assets/'):
            name=path.split('/')[-1]
            if name in ('layout-worker.js','topology-worker.js'): name=name.replace('.js','.bundle.js')
            return str(WEB/name)
        return super().translate_path(path)
    def do_POST(self):
        length=int(self.headers.get('Content-Length',0))
        if self.path!='/report' or length>1048576: self.send_error(400); return
        data=json.loads(self.rfile.read(length))
        with open('reports.jsonl','a') as f: f.write(json.dumps(data)+'\n')
        self.send_response(200); self.end_headers()
os.chdir(args.directory); ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
