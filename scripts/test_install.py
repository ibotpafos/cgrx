"""Offline installer contract tests: real archives/checksums, fake network/toolchain."""
import hashlib
import io
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'install.sh'
BINARY = b'#!/bin/sh\ncat >/dev/null\nprintf \'%s\\n\' \'{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18"}}\'\n'

class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='cgrx installer ')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.bin = self.root/'tools'; self.bin.mkdir()
        self.dest = self.root/'install space'
        self.release = self.root/'release'; self.release.mkdir()
        self.asset = 'cgrx-v0.1.0-alpha.6-aarch64-apple-darwin.tar.gz'
        self.archive(BINARY)
        self.stub('uname', 'if [ "$1" = -s ]; then echo "${TEST_OS:-Darwin}"; else echo arm64; fi')
        self.stub('curl', '''out=''; url=''
while [ "$#" -gt 0 ]; do
 case "$1" in -o) out=$2; shift 2;; https://*) url=$1; shift;; *) shift;; esac
done
[ "${FAIL_DOWNLOAD:-0}" = 0 ] || exit 22
cp "$TEST_RELEASE/${url##*/}" "$out"''')
        self.env = dict(os.environ, PATH=str(self.bin)+os.pathsep+os.environ['PATH'], HOME=str(self.root), CGRX_INSTALL_DIR=str(self.dest), TEST_RELEASE=str(self.release))
    def stub(self, name, text):
        p=self.bin/name; p.write_text('#!/bin/sh\nset -eu\n'+text+'\n'); p.chmod(0o755)
    def archive(self, binary):
        with tarfile.open(self.release/self.asset,'w:gz') as t:
            info=tarfile.TarInfo('cgrx'); info.size=len(binary); info.mode=0o755; t.addfile(info,io.BytesIO(binary))
        digest=hashlib.sha256((self.release/self.asset).read_bytes()).hexdigest()
        (self.release/'SHA256SUMS').write_text(digest+'  '+self.asset+'\n')
    def run_install(self, *args, **env):
        return subprocess.run(['sh',str(SCRIPT),*args],env=dict(self.env,**env),text=True,capture_output=True,timeout=30)
    def test_binary_install_spaces(self):
        r=self.run_install(); self.assertEqual(r.returncode,0,r.stderr); self.assertEqual((self.dest/'cgrx').read_bytes(),BINARY)
    def test_update_preserves_previous(self):
        self.dest.mkdir(); (self.dest/'cgrx').write_text('OLD')
        r=self.run_install(); self.assertEqual(r.returncode,0,r.stderr)
        backups=list(self.dest.glob('cgrx.backup.*')); self.assertEqual(len(backups),1); self.assertEqual(backups[0].read_text(),'OLD')
    def test_bad_checksum_preserves_old(self):
        self.dest.mkdir(); (self.dest/'cgrx').write_text('OLD')
        (self.release/'SHA256SUMS').write_text('0'*64+'  '+self.asset+'\n')
        r=self.run_install(); self.assertNotEqual(r.returncode,0); self.assertEqual((self.dest/'cgrx').read_text(),'OLD')
    def test_download_failure(self):
        r=self.run_install(FAIL_DOWNLOAD='1'); self.assertNotEqual(r.returncode,0); self.assertFalse((self.dest/'cgrx').exists())
    def test_broken_binary_not_installed(self):
        self.archive(b'#!/bin/sh\nexit 1\n'); r=self.run_install(); self.assertNotEqual(r.returncode,0); self.assertFalse((self.dest/'cgrx').exists())
    def test_bad_version_rejected_before_download(self):
        r=self.run_install(CGRX_VERSION='../bad'); self.assertNotEqual(r.returncode,0); self.assertIn('version',r.stderr.lower())
    def test_unsupported_os(self):
        r=self.run_install(TEST_OS='MINGW64_NT'); self.assertNotEqual(r.returncode,0); self.assertIn('Unsupported',r.stderr)
    def test_source_install_pinned(self):
        self.stub('cargo', '''printf '%s\\n' "$@" > "$HOME/cargo-args"
root=''; while [ "$#" -gt 0 ]; do case "$1" in --root) root=$2; shift 2;; *) shift;; esac; done
mkdir -p "$root/bin"; cp "$TEST_RELEASE/source-binary" "$root/bin/cgrx"; chmod +x "$root/bin/cgrx"''')
        (self.release/'source-binary').write_bytes(BINARY)
        r=self.run_install(TEST_OS='Linux'); self.assertEqual(r.returncode,0,r.stderr)
        args=(self.root/'cargo-args').read_text(); self.assertIn('--locked\n',args); self.assertIn('--tag\nv0.1.0-alpha.6\n',args); self.assertIn('+1.89.0\n',args)
    def test_existing_lock_preserves_old(self):
        self.dest.mkdir(); (self.dest/'.cgrx-install.lock').mkdir(); (self.dest/'cgrx').write_text('OLD')
        r=self.run_install(); self.assertNotEqual(r.returncode,0); self.assertEqual((self.dest/'cgrx').read_text(),'OLD'); self.assertTrue((self.dest/'.cgrx-install.lock').is_dir())
    def test_unknown_flag_rejected(self):
        r=self.run_install('--nonsense'); self.assertNotEqual(r.returncode,0); self.assertIn('Unknown',r.stderr)

if __name__ == '__main__': unittest.main()
