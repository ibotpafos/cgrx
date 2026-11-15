#!/usr/bin/env python3
"""Fail closed: release only the exact SHA with CI, PHP and real-GPU evidence."""
import argparse, json, re, subprocess, time
from pathlib import Path

def gpu_context(version):
    match = re.fullmatch(r'v\d+\.\d+\.\d+-alpha\.(\d+)', version)
    if not match:
        raise ValueError(f'invalid release version: {version}')
    return f'alpha{match.group(1)}/real-gpu'

def ready(runs, statuses, sha, version):
    workflows = {name: next((r for r in runs if r.get('head_sha') == sha and r.get('name') == name), {}).get('conclusion') == 'success' for name in ['CI', 'PHP validation']}
    # Statuses are newest first: an older success cannot override a newer failure.
    gpu = next((s for s in statuses if s.get('context') == gpu_context(version)), {})
    return all(workflows.values()) and gpu.get('state') == 'success'

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--repo', required=True); parser.add_argument('--sha', required=True); parser.add_argument('--timeout', type=int, default=1800); args = parser.parse_args()
    version = (Path(__file__).resolve().parents[1] / 'RELEASE_VERSION').read_text().strip()
    gpu_context(version)
    def api(path): return json.loads(subprocess.check_output(['gh', 'api', f'repos/{args.repo}/{path}'], text=True))
    deadline = time.monotonic() + args.timeout
    while True:
        runs = api(f'actions/runs?head_sha={args.sha}&per_page=100')['workflow_runs']
        statuses = api(f'commits/{args.sha}/statuses?per_page=100')
        if ready(runs, statuses, args.sha, version): print(f'all release gates passed for {args.sha}'); break
        if time.monotonic() >= deadline: raise SystemExit(f'release gates incomplete for {args.sha}; no publication')
        time.sleep(15)
