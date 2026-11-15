#!/usr/bin/env python3
"""Measure cold process startup and repeated read-only graph requests (no tokens logged)."""
import argparse
import hashlib
import json
from pathlib import Path
import selectors
import statistics
import subprocess
import time
import urllib.request


def benchmark(binary, repo, repeats):
    results = []
    for _ in range(repeats):
        started = time.perf_counter()
        process = subprocess.Popen([str(binary), 'visualize', '--repo', str(repo),
                                    '--projects-dir', str(repo), '--port', '0', '--no-open'],
                                   stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
        try:
            with selectors.DefaultSelector() as selector:
                selector.register(process.stdout, selectors.EVENT_READ)
                if not selector.select(180):
                    raise TimeoutError('visualizer startup exceeded 180 seconds')
                line = process.stdout.readline().strip()
            if not line.startswith('visualizer_url='):
                raise RuntimeError('visualizer did not start')
            origin, token = line.removeprefix('visualizer_url=').split('/#token=')
            sample = {'startup_ms': (time.perf_counter() - started) * 1000}
            for name, route in [('status', '/api/status'), ('graph', '/api/repository-graph'),
                                ('graph_repeat', '/api/repository-graph')]:
                before = time.perf_counter()
                request = urllib.request.Request(origin + route, headers={'X-CGRX-Token': token})
                with urllib.request.urlopen(request, timeout=180) as response:
                    body = response.read()
                sample[name + '_ms'] = (time.perf_counter() - before) * 1000
                value = json.loads(body)
                if name == 'graph':
                    sample.update(nodes=len(value['nodes']), edges=len(value['edges']),
                                  graph_sha256=hashlib.sha256(body).hexdigest(), snapshot=value['snapshot'])
            results.append(sample)
        finally:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
    return {'samples': results, 'median_ms': {
        key: statistics.median(sample[key] for sample in results)
        for key in ('startup_ms', 'status_ms', 'graph_ms', 'graph_repeat_ms')}}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--binary', type=Path, required=True)
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--repeats', type=int, default=3)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.repeats < 1:
        parser.error('--repeats must be positive')
    result = benchmark(args.binary.resolve(), args.repo.resolve(), args.repeats)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result['median_ms']))
