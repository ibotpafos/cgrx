"""Offline installer contract tests: real archives/checksums, fake network/toolchain."""
import hashlib
import io
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'install.sh'
VERSION = (ROOT / 'RELEASE_VERSION').read_text().strip()
BINARY = b'#!/bin/sh\ncat >/dev/null\nprintf \'%s\\n\' \'{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18"}}\'\n'

class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='cgrx installer ')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.bin = self.root/'tools'; self.bin.mkdir()
        self.dest = self.root/'install space'
        self.release = self.root/'release'; self.release.mkdir()
        self.asset = f'cgrx-{VERSION}-aarch64-apple-darwin.tar.gz'
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
        args=(self.root/'cargo-args').read_text(); self.assertIn('--locked\n',args); self.assertIn(f'--tag\n{VERSION}\n',args); self.assertIn('+1.89.0\n',args)
    def test_existing_lock_preserves_old(self):
        self.dest.mkdir(); (self.dest/'.cgrx-install.lock').mkdir(); (self.dest/'cgrx').write_text('OLD')
        r=self.run_install(); self.assertNotEqual(r.returncode,0); self.assertEqual((self.dest/'cgrx').read_text(),'OLD'); self.assertTrue((self.dest/'.cgrx-install.lock').is_dir())
    def test_unknown_flag_rejected(self):
        r=self.run_install('--nonsense'); self.assertNotEqual(r.returncode,0); self.assertIn('Unknown',r.stderr)

class HermesInstallerTests(InstallerTests):
    def setUp(self):
        super().setUp()
        self.wrapper = self.root / 'installer space' / 'install-hermes.sh'
        self.wrapper.parent.mkdir()
        self.wrapper.write_bytes((ROOT / 'install-hermes.sh').read_bytes())
        (self.wrapper.parent / 'install.sh').write_bytes(SCRIPT.read_bytes())
        self.stub('hermes', 'printf "%s\\n" "$@" >> "$HOME/hermes-args"')
        self.stub('cargo', 'echo "Unexpected cargo invocation" >&2; exit 99')
        self.stub('git', 'echo "Unexpected git invocation" >&2; exit 99')

    def run_install(self, *args, **env):
        return subprocess.run(['bash', str(self.wrapper), *args],
                              env=dict(self.env, **env), text=True,
                              capture_output=True, timeout=30)

    def test_help_neither_installs_nor_registers(self):
        r = self.run_install('--source', '--help')
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn('Usage:', r.stdout)
        self.assertFalse((self.root / 'hermes-args').exists())
        self.assertFalse((self.dest / 'cgrx').exists())

    def test_registers_after_canonical_install(self):
        r = self.run_install()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual((self.root / 'hermes-args').read_text().splitlines(),
                         ['mcp', 'add', 'cgrx', '--command', str(self.dest / 'cgrx'),
                          '--args', 'serve', '--multi-repo'])

    def test_local_delegation_forwards_arguments_and_environment(self):
        (self.wrapper.parent / 'install.sh').write_text(
            'printf "%s\\n" "$CGRX_VERSION" "$CGRX_INSTALL_DIR" "$@" > "$HOME/delegate-args"\n')
        r = self.run_install('--source', CGRX_VERSION='v9.8.7', FAIL_DOWNLOAD='1')
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual((self.root / 'delegate-args').read_text().splitlines(),
                         ['v9.8.7', str(self.dest), '--source'])

    def test_failure_stops_before_registration(self):
        self.dest.mkdir()
        (self.dest / 'cgrx').write_text('OLD')
        (self.wrapper.parent / 'install.sh').write_text('exit 42\n')
        r = self.run_install()
        self.assertEqual(r.returncode, 42, r.stderr)
        self.assertFalse((self.root / 'hermes-args').exists())
        self.assertEqual((self.dest / 'cgrx').read_text(), 'OLD')

    def test_checksum_failure_stops_before_registration(self):
        (self.release / 'SHA256SUMS').write_text('0' * 64 + '  ' + self.asset + '\n')
        r = self.run_install()
        self.assertNotEqual(r.returncode, 0)
        self.assertFalse((self.root / 'hermes-args').exists())

    def test_downloads_only_pinned_official_installer(self):
        (self.wrapper.parent / 'install.sh').unlink()
        (self.release / 'install.sh').write_bytes(SCRIPT.read_bytes())
        curl = self.bin / 'curl'
        curl.write_text(curl.read_text().replace("out=''; url=''",
                        'printf "%s\\n" "$@" >> "$HOME/curl-args"\nout=\'\'; url=\'\''))
        r = self.run_install()
        self.assertEqual(r.returncode, 0, r.stderr)
        args = (self.root / 'curl-args').read_text()
        self.assertIn(f'https://raw.githubusercontent.com/ibotpafos/cgrx/{VERSION}/install.sh', args)
        self.assertNotIn('/main/', args)
        self.assertEqual((self.dest / 'cgrx').read_bytes(), BINARY)

    def test_streamed_wrapper_uses_pinned_installer(self):
        (self.release / 'install.sh').write_bytes(SCRIPT.read_bytes())
        r = subprocess.run(['bash'], input=self.wrapper.read_text(), cwd=self.root,
                           env=self.env, text=True, capture_output=True, timeout=30)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual((self.dest / 'cgrx').read_bytes(), BINARY)
        self.assertTrue((self.root / 'hermes-args').exists())

    def test_registration_failure_is_propagated(self):
        self.stub('hermes', 'exit 43')
        r = self.run_install()
        self.assertEqual(r.returncode, 43, r.stderr)
        self.assertEqual((self.dest / 'cgrx').read_bytes(), BINARY)

    def test_remote_failure_does_not_fall_back_or_register(self):
        (self.wrapper.parent / 'install.sh').unlink()
        r = self.run_install(FAIL_DOWNLOAD='1')
        self.assertEqual(r.returncode, 22, r.stderr)
        self.assertFalse((self.root / 'hermes-args').exists())
        self.assertFalse((self.dest / 'cgrx').exists())

    def test_remote_invalid_version_rejected_before_download(self):
        (self.wrapper.parent / 'install.sh').unlink()
        r = self.run_install(CGRX_VERSION='../main')
        self.assertEqual(r.returncode, 2, r.stderr)
        self.assertFalse((self.root / 'hermes-args').exists())


class SwiftCompatibilityCiTests(unittest.TestCase):
    def test_alias_has_compile_check_not_duplicate_suites(self):
        ci = (ROOT / '.github/workflows/ci.yml').read_text()
        swift_commands = [line.strip() for line in ci.splitlines()
                          if '--features cgrx-cli/experimental-swift' in line]
        self.assertEqual(swift_commands, [
            'run: cargo check --locked -p cgrx-cli --features cgrx-cli/experimental-swift'])
        self.assertIn('cargo clippy --locked --workspace --all-targets -- -D warnings', ci)
        self.assertIn('cargo test --locked --workspace --no-fail-fast', ci)
        self.assertIn('cargo build --locked --release -p cgrx-cli', ci)


if __name__ == '__main__': unittest.main()
