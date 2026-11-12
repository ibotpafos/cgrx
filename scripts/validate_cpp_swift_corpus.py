#!/usr/bin/env python3
"""Materialize immutable synthetic TRAIN fixtures; never relabel as heldout data."""
import json,os,shutil,subprocess,tempfile
from pathlib import Path
from validate_real_tasks import validate
ROOT=Path(__file__).resolve().parents[1]
SLOT='/CGRX_CPP_SWIFT_TRAINING_FIXTURE'
def validate_training():
    doc=json.loads((ROOT/'contracts/real_tasks_v1.json').read_text())
    tasks=[t for t in doc['tasks'] if t['repo']==SLOT]
    if len(tasks)!=28 or any(t['split']!='train' for t in tasks):raise ValueError('28 explicit training assertions required')
    with tempfile.TemporaryDirectory(prefix='cgrx-training-') as temporary:
        repo=Path(temporary).resolve();shutil.copytree(ROOT/'contracts/fixtures/cpp-swift',repo,dirs_exist_ok=True)
        env={**os.environ,'GIT_AUTHOR_NAME':'CGRX Coverage Fixture','GIT_AUTHOR_EMAIL':'fixture@example.invalid','GIT_COMMITTER_NAME':'CGRX Coverage Fixture','GIT_COMMITTER_EMAIL':'fixture@example.invalid','GIT_AUTHOR_DATE':'2026-11-12T00:00:00+00:00','GIT_COMMITTER_DATE':'2026-11-12T00:00:00+00:00','GIT_CONFIG_GLOBAL':'/dev/null','GIT_CONFIG_NOSYSTEM':'1'}
        for args in [['init','-q'],['add','.'],['-c','commit.gpgsign=false','commit','-qm','CGRX C++/Swift training coverage v1']]:subprocess.run(['git','-C',str(repo),*args],env=env,check=True)
        for task in tasks:task['repo']=str(repo)
        return validate({'schema_version':2,'tasks':tasks})
if __name__=='__main__':print('VALID cpp_swift_training_assertions='+str(validate_training()))
