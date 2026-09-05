#!/usr/bin/env python3
"""Validate curated references offline; never infer semantic truth from a graph.

One-based inclusive line spans hash raw bytes, including existing line endings.
Every referenced file must equal its committed HEAD blob. Other dirty files are
irrelevant. This checks provenance integrity, not the curator's semantic judgment.
Only bounded identifier absence is machine-checked for optional distractors.

Version 2 adds optional category and public repository_url provenance, IMPORTS,
and UNRESOLVED. UNRESOLVED has target=null and no target evidence: it is an
abstention, never a definitive edge. Impact tasks assert an existing dependency
only, not an executed patch or a bug. Version 1 manifests remain supported.
The historical manifest filename is retained; schema_version governs decoding.
"""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys


def require(condition, message):
    if not condition:
        raise ValueError(message)


def fields(obj, required, optional=()):
    require(isinstance(obj, dict), 'expected object')
    require(set(required) <= obj.keys() <= set(required) | set(optional), 'invalid fields')


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def digest(data):
    return hashlib.sha256(data).hexdigest()


def git(repo, *args):
    try:
        return subprocess.check_output(['git', '-C', repo, *args], stderr=subprocess.DEVNULL)
    except (OSError, subprocess.CalledProcessError) as exc:
        raise ValueError('Git evidence unavailable') from exc


def identifier(symbol, data):
    return re.search(rb'(?<![A-Za-z0-9_$])' + re.escape(symbol.encode()) + rb'(?![A-Za-z0-9_$])', data) is not None


def validate(doc):
    fields(doc, ('schema_version','tasks'), ('provenance',))
    require(type(doc['schema_version']) is int and doc['schema_version'] in (1, 2), 'unsupported schema')
    require(isinstance(doc['tasks'], list) and doc['tasks'], 'tasks must be nonempty list')
    if 'provenance' in doc:
        require(nonempty(doc['provenance']), 'invalid corpus provenance')
    v2 = doc['schema_version'] == 2
    ids, fingerprints, revisions, cache, splits = set(), set(), {}, {}, {}
    for task in doc['tasks']:
        fields(task, ('id','repo','revision','split','question','rationale','provenance','evidence','expected'), ('negative','category') if v2 else ('negative',))
        for key in ('id','repo','revision','question','rationale'):
            require(nonempty(task[key]), 'invalid '+key)
        require(task['id'] not in ids, 'duplicate task id'); ids.add(task['id'])
        require(task['split'] in ('train','heldout'), 'invalid split')
        fields(task['provenance'], ('method','verified_on'), ('repository_url',) if v2 else ())
        if 'repository_url' in task['provenance']:
            url = task['provenance']['repository_url']
            require(isinstance(url,str) and re.fullmatch(r'https://[A-Za-z0-9.-]+/[A-Za-z0-9._/-]+',url), 'invalid public origin')
        require(task['provenance']['method'] == 'manual-source-read', 'source-read provenance required')
        date = task['provenance']['verified_on']
        require(isinstance(date,str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}',date), 'invalid date')
        datetime.date.fromisoformat(date)
        repo, revision = task['repo'], task['revision']
        if 'repository_url' in task['provenance']:
            require(git(repo,'remote','get-url','origin').decode().strip() == task['provenance']['repository_url'], 'public origin mismatch')
        require(Path(repo).is_absolute() and str(Path(repo).resolve()) == repo, 'noncanonical repo')
        require(re.fullmatch(r'[0-9a-f]{40}',revision) is not None, 'invalid revision')
        require(repo not in revisions or revisions[repo] == revision, 'mixed revisions')
        if repo not in revisions:
            require(git(repo,'rev-parse','--show-toplevel').decode().strip() == repo, 'not canonical Git root')
            require(git(repo,'rev-parse','HEAD').decode().strip() == revision, 'stale revision')
            revisions[repo] = revision
        expected=task['expected']
        fields(expected, ('relation','source','target','site'))
        relation=expected['relation']
        require(relation in (('CALLS','REFERENCE','IMPORTS','UNRESOLVED') if v2 else ('CALLS','REFERENCE')), 'invalid relation')
        unresolved=relation == 'UNRESOLVED'
        categories={'call':'CALLS','receiver':'CALLS','impact':'CALLS',
                    'reference':'REFERENCE','import':'IMPORTS','ambiguous':'UNRESOLVED'}
        if 'category' in task:
            require(isinstance(task['category'],str) and categories.get(task['category']) == relation, 'category mismatch')
        require(not unresolved or task.get('category') == 'ambiguous', 'unresolved category required')
        require(expected['source'] == 'source' and expected['site'] == 'site'
                and expected['target'] == (None if unresolved else 'target'), 'invalid evidence link')
        fields(task['evidence'], ('source','site') if unresolved else ('source','target','site'))
        spans = {}
        for name, anchor in task['evidence'].items():
            fields(anchor, ('path','sha256','start_line','end_line','span_sha256','symbol'))
            path = anchor['path']
            require(nonempty(path), 'invalid path')
            rel = Path(path)
            require(not rel.is_absolute() and '..' not in rel.parts and rel.as_posix() == path, 'unsafe path')
            full = Path(repo)/rel
            require(str(full.resolve()) == str(full), 'symlink evidence forbidden')
            require(nonempty(anchor['symbol']) and re.fullmatch(r'[A-Za-z_$][A-Za-z0-9_$]*',anchor['symbol']), 'invalid symbol')
            for key in ('sha256','span_sha256'):
                require(isinstance(anchor[key],str) and re.fullmatch(r'[0-9a-f]{64}',anchor[key]), 'invalid hash')
            key=(repo,path)
            if key not in cache:
                try:
                    data=full.read_bytes()
                except OSError as exc:
                    raise ValueError('source file unavailable') from exc
                require(data == git(repo,'show',revision+':'+path), 'file differs from revision')
                cache[key]=data
            data=cache[key]
            require(digest(data) == anchor['sha256'], 'stale file hash')
            require(key not in splits or splits[key] == task['split'], 'file leaks across splits')
            splits[key]=task['split']
            start,end=anchor['start_line'],anchor['end_line']
            lines=data.splitlines(keepends=True)
            require(type(start) is int and type(end) is int and 1 <= start <= end <= len(lines), 'invalid line span')
            span=b''.join(lines[start-1:end])
            require(digest(span) == anchor['span_sha256'], 'stale span contents')
            require(identifier(anchor['symbol'],span), 'symbol absent from span')
            spans[name]=span
        source,site=(task['evidence'][k] for k in ('source','site'))
        require(source['path'] == site['path'] and source['start_line'] <= site['start_line'] <= site['end_line'] <= source['end_line'], 'site outside source')
        target=task['evidence'].get('target')
        if target is not None:
            require(site['symbol'] == target['symbol'], 'site target mismatch')
        # Categories, questions, source-span widening and relation relabeling do
        # not create a new assertion at the same source site. A site also
        # cannot simultaneously assert a definitive and an unresolved target.
        fingerprint=(repo,revision,site['path'],site['start_line'],site['end_line'],site['symbol'])
        require(fingerprint not in fingerprints, 'duplicate assertion'); fingerprints.add(fingerprint)
        if 'negative' in task:
            negative=task['negative']
            fields(negative, ('kind','symbol','scope','rationale'))
            require(negative['kind'] == 'identifier_absent' and negative['scope'] == 'source', 'unbounded negative')
            require(nonempty(negative['rationale']), 'negative rationale required')
            require(isinstance(negative['symbol'],str) and re.fullmatch(r'[A-Za-z_$][A-Za-z0-9_$]*',negative['symbol']), 'invalid negative symbol')
            require(not identifier(negative['symbol'],spans['source']), 'negative identifier present')
    # Reject evidence that moves during validation, not just before it.
    for repo,revision in revisions.items():
        require(git(repo,'rev-parse','HEAD').decode().strip() == revision, 'revision changed during validation')
    for (repo,path),data in cache.items():
        require((Path(repo)/path).read_bytes() == data, 'file changed during validation')
    return len(ids)


def unique_object(pairs):
    obj={}
    for key,value in pairs:
        require(key not in obj, 'duplicate JSON key')
        obj[key]=value
    return obj


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', nargs='?', type=Path,
                        default=Path(__file__).resolve().parents[1]/'contracts/real_tasks_v1.json')
    args=parser.parse_args()
    try:
        doc=json.loads(args.manifest.read_text(),object_pairs_hook=unique_object)
        count=validate(doc)
    except (ValueError,OSError,TypeError) as exc:
        print('INVALID: '+str(exc),file=sys.stderr)
        return 1
    print(f"VALID tasks={count} repos={len({t['repo'] for t in doc['tasks']})}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
