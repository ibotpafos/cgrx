"""Offline real-source manifest regressions using disposable Git repositories."""
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import validate_real_tasks as validator


def sha(data):
    return hashlib.sha256(data).hexdigest()


class ManifestTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve()
        self.source = b'def caller():\n    return callee()\ndef callee():\n    return 1\n'
        (self.root / 'sample.py').write_bytes(self.source)
        self.git('init', '-q')
        self.git('add', 'sample.py')
        self.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture')
        self.revision = self.git('rev-parse', 'HEAD').strip()
        def anchor(start, end, symbol):
            return dict(path='sample.py', sha256=sha(self.source), start_line=start,
                        end_line=end, span_sha256=sha(b''.join(self.source.splitlines(keepends=True)[start-1:end])), symbol=symbol)
        self.task = dict(id='fixture-1', repo=str(self.root), revision=self.revision,
                         split='train', question='Which function does caller invoke?',
                         rationale='Direct same-module call to the declared function.',
                         provenance=dict(method='manual-source-read', verified_on='2026-09-05'),
                         evidence=dict(source=anchor(1,2,'caller'), target=anchor(3,4,'callee'), site=anchor(2,2,'callee')),
                         expected=dict(relation='CALLS', source='source', target='target', site='site'),
                         negative=dict(kind='identifier_absent', symbol='distractor', scope='source', rationale='Identifier absent in this bounded source span only.'))
        self.doc = dict(schema_version=1, tasks=[self.task])

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.root), *args], text=True, stderr=subprocess.DEVNULL)

    def invalid(self, doc=None):
        with self.assertRaises(ValueError):
            validator.validate(self.doc if doc is None else doc)

    def test_valid(self):
        self.assertEqual(validator.validate(self.doc), 1)

    def test_schema(self):
        for key, value in [('schema_version', True), ('schema_version', 2), ('tasks', []), ('tasks', {})]:
            with self.subTest(key=key, value=value):
                doc = copy.deepcopy(self.doc); doc[key] = value; self.invalid(doc)
        for key in self.task:
            if key == 'negative':
                continue
            with self.subTest(missing=key):
                doc = copy.deepcopy(self.doc); del doc['tasks'][0][key]; self.invalid(doc)

    def test_duplicate_id_and_duplicate_assertion(self):
        self.doc['tasks'].append(copy.deepcopy(self.task)); self.invalid()
        self.doc['tasks'][1]['id'] = 'other'; self.invalid()

    def test_mixed_revisions(self):
        other = copy.deepcopy(self.task); other.update(id='other', revision='0'*40)
        self.doc['tasks'].append(other); self.invalid()

    def test_stale_head(self):
        self.git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--allow-empty','-qm','new head')
        self.invalid()

    def test_stale_file_and_hash_relabeling(self):
        new = self.source.replace(b'return 1', b'return 2')
        (self.root/'sample.py').write_bytes(new); self.invalid()
        for a in self.task['evidence'].values():
            a['sha256'] = sha(new)
            a['span_sha256'] = sha(b''.join(new.splitlines(keepends=True)[a['start_line']-1:a['end_line']]))
        self.invalid()  # dirty content cannot masquerade as HEAD

    def test_untracked_and_missing_file(self):
        (self.root/'sample.py').unlink(); self.invalid()
        (self.root/'other.py').write_bytes(self.source)
        for a in self.task['evidence'].values(): a['path']='other.py'
        self.invalid()

    def test_bad_span_hash_bounds_and_symbol(self):
        for key, value in [('span_sha256','0'*64),('sha256','bad'),('start_line',0),('start_line',True),('end_line',999),('end_line',0),('symbol','missing')]:
            with self.subTest(key=key,value=value):
                doc=copy.deepcopy(self.doc); doc['tasks'][0]['evidence']['source'][key]=value; self.invalid(doc)

    def test_paths_are_canonical_and_contained(self):
        for path in ('../sample.py','/tmp/sample.py','./sample.py'):
            doc=copy.deepcopy(self.doc)
            doc['tasks'][0]['evidence']['source']['path']=path; self.invalid(doc)
        doc=copy.deepcopy(self.doc); doc['tasks'][0]['repo']=str(self.root)+'/.'; self.invalid(doc)
        (self.root/'alias.py').symlink_to(self.root/'sample.py')
        doc=copy.deepcopy(self.doc); doc['tasks'][0]['evidence']['source']['path']='alias.py'; self.invalid(doc)

    def test_bad_relation_link_split_and_provenance(self):
        for key,value in [('relation','MAGIC'),('source','missing'),('target','site')]:
            doc=copy.deepcopy(self.doc); doc['tasks'][0]['expected'][key]=value; self.invalid(doc)
        for key,value in [('split','test'),('question',''),('provenance',{'method':'graph','verified_on':'2026-09-05'})]:
            doc=copy.deepcopy(self.doc); doc['tasks'][0][key]=value; self.invalid(doc)

    def test_negative_must_be_bounded_and_absent(self):
        for key,value in [('symbol','callee'),('scope','repository'),('kind','no_runtime_call')]:
            doc=copy.deepcopy(self.doc); doc['tasks'][0]['negative'][key]=value; self.invalid(doc)

    def test_optional_negative(self):
        del self.task['negative']; self.assertEqual(validator.validate(self.doc),1)

    def test_site_must_be_inside_source(self):
        self.task['evidence']['site']=copy.deepcopy(self.task['evidence']['target']); self.invalid()

    def test_split_leakage(self):
        other=copy.deepcopy(self.task)
        other.update(id='heldout-copy', split='heldout')
        self.doc['tasks'].append(other)
        with self.assertRaisesRegex(ValueError, 'leaks across splits'):
            validator.validate(self.doc)

    def test_revision_and_file_change_during_validation(self):
        original=validator.git
        calls=0
        def moving_head(repo, *args):
            nonlocal calls
            if args == ('rev-parse','HEAD'):
                calls += 1
                if calls == 2:
                    return b'0'*40+b'\n'
            return original(repo,*args)
        with patch.object(validator,'git',side_effect=moving_head):
            self.invalid()
        def moving_file(repo,*args):
            result=original(repo,*args)
            if args[0] == 'show':
                (self.root/'sample.py').write_bytes(self.source+b'# changed\n')
            return result
        with patch.object(validator,'git',side_effect=moving_file):
            self.invalid()

    def test_unknown_fields_and_embedded_revision_rejected(self):
        doc=copy.deepcopy(self.doc)
        doc['tasks'][0]['evidence']['source']['revision']='0'*40
        self.invalid(doc)
        doc=copy.deepcopy(self.doc); doc['tasks'][0]['source_copy']='unexpected'
        self.invalid(doc)

    def test_cli_and_duplicate_json_keys(self):
        manifest=self.root/'tasks.json'; manifest.write_text(json.dumps(self.doc))
        cmd=[sys.executable,str(Path(validator.__file__)),str(manifest)]
        result=subprocess.run(cmd,capture_output=True,text=True)
        self.assertEqual((result.returncode,result.stdout),(0,'VALID tasks=1 repos=1\n'))
        manifest.write_text('{"schema_version":1,"schema_version":1,"tasks":[]}')
        result=subprocess.run(cmd,capture_output=True,text=True)
        self.assertEqual(result.returncode,1)
        self.assertIn('INVALID',result.stderr)


if __name__ == '__main__':
    unittest.main()
