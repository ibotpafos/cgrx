import hashlib
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import collect_quality as c

class SnapshotBatchTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name).resolve()
        self.files={'a.py':b'def a(): pass\n','space name':b'\0\xff\n','line\nname':b'line\n', 'empty':b''}
        for name,data in self.files.items(): (self.root/name).write_bytes(data)
        self.git('init','-q');self.git('add','.')
        self.git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','fixture')
        self.rev=self.git('rev-parse','HEAD').decode().strip()
    def git(self,*args):return subprocess.check_output(['git','-C',str(self.root),*args],stderr=subprocess.DEVNULL)
    def test_digest_preserved_without_per_file_git_show(self):
        h=hashlib.sha256()
        for name,data in sorted(self.files.items()):
            name=name.encode();h.update(len(name).to_bytes(8,'big'));h.update(name);h.update(len(data).to_bytes(8,'big'));h.update(data)
        with patch.object(c,'git',wraps=c.git) as calls:
            result=c.frozen_snapshot(str(self.root),self.rev)
        self.assertEqual(result['source_digest'],h.hexdigest())
        self.assertFalse(any(call.args[1]=='show' for call in calls.call_args_list),'per-file Git subprocess remains')
    def test_assume_unchanged_does_not_hide_modified_bytes(self):
        self.git('update-index','--assume-unchanged','a.py')
        (self.root/'a.py').write_bytes(b'def b(): pass\n')
        self.assertEqual(self.git('status','--porcelain'),b'')
        with self.assertRaisesRegex(ValueError,'source changed'):c.frozen_snapshot(str(self.root),self.rev)
    def test_staged_change_is_rejected(self):
        (self.root/'a.py').write_bytes(b'changed');self.git('add','a.py')
        with self.assertRaises(ValueError):c.frozen_snapshot(str(self.root),self.rev)
    def test_symlink_is_rejected(self):
        os.symlink('a.py',self.root/'link');self.git('add','link');self.git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','link')
        with self.assertRaises(ValueError):c.frozen_snapshot(str(self.root),self.git('rev-parse','HEAD').decode().strip())
    def test_broken_stdin_close_still_reaps_child(self):
        import io
        from unittest.mock import Mock
        proc=Mock();proc.stdin=Mock();proc.stdin.flush.side_effect=BrokenPipeError('write')
        proc.stdin.close.side_effect=BrokenPipeError('close');proc.stdout=io.BytesIO()
        proc.poll.return_value=None;proc.wait.return_value=0
        original = subprocess.Popen
        def popen(args, **kwargs):
            return proc if 'cat-file' in args else original(args, **kwargs)
        with patch.object(c.subprocess,'Popen',side_effect=popen), self.assertRaises(BrokenPipeError):
            c.frozen_snapshot(str(self.root),self.rev)
        self.assertTrue(proc.stdout.closed)
        proc.kill.assert_called_once();proc.wait.assert_called_once()
