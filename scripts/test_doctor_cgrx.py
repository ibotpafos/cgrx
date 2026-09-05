#!/usr/bin/env python3
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import textwrap
import signal
import time
import unittest


DOCTOR = Path(__file__).with_name("doctor_cgrx.py")


class DoctorCgrxTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="doctor-cgrx-test-")
        self.root = Path(self.temporary.name)
        self.repo = self.root / "repo"
        self.repo.mkdir()
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True)
        (self.repo / "main.rs").write_text("fn target() {}\n")
        subprocess.run(["git", "-C", str(self.repo), "add", "main.rs"], check=True)
        subprocess.run(
            [
                "git", "-C", str(self.repo),
                "-c", "user.name=CGRX Test",
                "-c", "user.email=test@example.invalid",
                "commit", "-qm", "fixture",
            ],
            check=True,
        )

    def tearDown(self):
        self.temporary.cleanup()

    def fake_binary(self, name="cgrx", status_error=None, malformed=False):
        path = self.root / name
        error = repr(status_error)
        path.write_text(textwrap.dedent(f"""\
            #!/usr/bin/env python3
            import json
            import sys
            import subprocess
            if sys.argv[1:] == ["--version"]:
                print("cgrx 9.8.7")
                raise SystemExit(0)
            if sys.argv[1:] != ["serve", "--multi-repo"]:
                raise SystemExit(2)
            status_error = {error}
            malformed = {malformed!r}
            for line in sys.stdin:
                request = json.loads(line)
                if request.get("method") == "initialize":
                    result = {{}} if malformed else {{
                        "protocolVersion":"2025-06-18",
                        "serverInfo":{{"name":"cgrx","version":"9.8.7"}},
                        "capabilities":{{}}
                    }}
                    print(json.dumps({{"jsonrpc":"2.0","id":request["id"],"result":result}}), flush=True)
                elif request.get("method") == "tools/call":
                    if status_error:
                        print(json.dumps({{"jsonrpc":"2.0","id":request["id"],"error":status_error}}), flush=True)
                    else:
                        repo = request["params"]["arguments"]["repo"]
                        revision = subprocess.check_output(["git","-C",repo,"rev-parse","HEAD"],text=True).strip()
                        structured = {{}} if malformed else {{"repo":repo,"freshness":"WATCHED","snapshot":{{"repo_revision":revision,"graph_generation":7}}}}
                        print(json.dumps({{"jsonrpc":"2.0","id":request["id"],"result":{{
                            "structuredContent":structured
                        }}}}), flush=True)
        """))
        path.chmod(0o755)
        return path

    def run_doctor(self, executable, reference=None, launcher=None, metadata=None, timeout=None):
        command = [
            sys.executable,
            str(DOCTOR),
            "--executable", str(executable),
            "--repo", str(self.repo),
            "--json",
        ]
        if timeout is not None:
            command.extend(["--timeout", str(timeout)])
        if reference:
            command.extend(["--reference-executable", str(reference)])
        if launcher:
            command.extend(["--launcher", str(launcher)])
        if metadata:
            command.extend(["--metadata", str(metadata)])
        environment = os.environ.copy()
        environment["CGRX_DOCTOR_SECRET_SENTINEL"] = "DO_NOT_PRINT_THIS"
        result = subprocess.run(command, text=True, capture_output=True, env=environment, timeout=8)
        self.assertNotIn("DO_NOT_PRINT_THIS", result.stdout + result.stderr)
        return result

    def test_resolves_launcher_symlink_and_verifies_initialize_and_status(self):
        binary = self.fake_binary()
        launcher = self.root / "launcher"
        launcher.symlink_to(binary)
        metadata = self.root / "build.json"
        metadata.write_text(json.dumps({
            "commit": "a" * 40,
            "sha256": __import__("hashlib").sha256(binary.read_bytes()).hexdigest(),
            "command": "cargo build --release --locked -p cgrx-cli",
        }))
        result = self.run_doctor(binary, binary, launcher, metadata)
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(result.stdout)
        self.assertTrue(report["launcher"]["is_symlink"])
        self.assertFalse(report["executable"]["is_symlink"])
        self.assertEqual(report["executable"]["canonical"], str(binary.resolve()))
        self.assertEqual(report["executable"]["sha256"], report["reference"]["sha256"])
        self.assertTrue(report["metadata"]["hash_matches"])
        self.assertEqual(report["version_probe"]["value"], "cgrx 9.8.7")
        self.assertEqual(report["jsonrpc"]["initialize"]["server_name"], "cgrx")
        self.assertEqual(report["jsonrpc"]["status"]["freshness"], "WATCHED")
        self.assertEqual(report["drift"], [])

    def test_hash_mismatch_is_actionable_drift(self):
        binary = self.fake_binary()
        reference = self.root / "reference"
        reference.write_bytes(binary.read_bytes() + b"\n# newer build\n")
        reference.chmod(0o755)
        result = self.run_doctor(binary, reference)
        self.assertEqual(result.returncode, 1)
        report = json.loads(result.stdout)
        self.assertIn("binary_hash_mismatch", [item["code"] for item in report["drift"]])

    def test_generation_collision_failure_is_reported_without_being_downgraded(self):
        binary = self.fake_binary(
            status_error={
                "code": -32602,
                "message": "repository indexing failed",
                "data": {
                    "code": "cgrx.repository_unavailable",
                    "detail": "store_begin: generation is immutable and already exists",
                },
            }
        )
        result = self.run_doctor(binary)
        self.assertEqual(result.returncode, 1)
        report = json.loads(result.stdout)
        codes = [item["code"] for item in report["drift"]]
        self.assertIn("jsonrpc_status_failed", codes)
        self.assertIn("generation_reactivation_missing", codes)
        self.assertEqual(
            report["jsonrpc"]["status"]["error_code"],
            "cgrx.repository_unavailable",
        )

    def test_incomplete_success_shapes_are_rejected(self):
        result = self.run_doctor(self.fake_binary(malformed=True))
        self.assertEqual(result.returncode, 1)
        report = json.loads(result.stdout)
        codes = [item["code"] for item in report["drift"]]
        self.assertIn("jsonrpc_initialize_failed", codes)
        self.assertIn("jsonrpc_status_failed", codes)


    def test_arbitrary_version_output_is_not_emitted(self):
        binary=self.fake_binary()
        binary.write_text(binary.read_text().replace('print("cgrx 9.8.7")','print("DO_NOT_PRINT_THIS")'))
        result=self.run_doctor(binary)
        self.assertEqual(result.returncode,1)

    def test_untrusted_projected_fields_are_not_emitted(self):
        for old,new in [('"version":"9.8.7"','"version":{"token":"DO_NOT_PRINT_THIS"}'),
                        ('"freshness":"WATCHED"','"freshness":"DO_NOT_PRINT_THIS"'),
                        ('"repo_revision":revision','"repo_revision":"DO_NOT_PRINT_THIS"')]:
            with self.subTest(field=old):
                binary=self.fake_binary();binary.write_text(binary.read_text().replace(old,new))
                result=self.run_doctor(binary)
                self.assertEqual(result.returncode,1)

    def test_unknown_typed_error_is_redacted(self):
        result=self.run_doctor(self.fake_binary(status_error={'code':-32602,'data':{'code':'DO_NOT_PRINT_THIS'}}))
        self.assertEqual(result.returncode,1)

    def test_different_launcher_is_unverified_even_with_same_version(self):
        binary=self.fake_binary();other=self.fake_binary('other')
        result=self.run_doctor(binary,launcher=other)
        self.assertEqual(result.returncode,1)
        self.assertIn('launch_identity_unverified',[d['code'] for d in json.loads(result.stdout)['drift']])

    def test_bad_protocol_repo_revision_and_generation_fail(self):
        for old,new in [('"protocolVersion":"2025-06-18"','"protocolVersion":"wrong"'),
                        ('"repo":repo','"repo":"/wrong"'),
                        ('"repo_revision":revision','"repo_revision":"'+'a'*40+'"'),
                        ('"graph_generation":7','"graph_generation":-1')]:
            with self.subTest(field=old):
                binary=self.fake_binary();binary.write_text(binary.read_text().replace(old,new))
                result=self.run_doctor(binary)
                self.assertEqual(result.returncode,1)

    def test_malformed_status_result_returns_json_not_traceback(self):
        import doctor_cgrx as doctor
        for bad in [[], None, "DO_NOT_PRINT_THIS", 7]:
            raw={'process':{'exit_status':0},'responses':{1:{'result':{}},2:{'result':bad}},'generation_collision':False}
            drift=[]
            summary=doctor.summarize_rpc(raw,drift)
            self.assertFalse(summary['status']['ok'])
            self.assertNotIn('DO_NOT_PRINT_THIS',json.dumps(summary))

    def test_timeout_kills_launcher_descendants(self):
        # Owned mock child only. Never signal a pre-existing process.
        import doctor_cgrx as doctor
        pidfile=self.root/'child.pid';launcher=self.root/'hung'
        launcher.write_text('#!/bin/sh\n/bin/sleep 30 &\necho $! > '+str(pidfile)+'\nwait\n')
        launcher.chmod(0o755)
        try:
            result=doctor.probe_version(str(launcher),.5)
            self.assertTrue(result['timed_out'])
            pid=int(pidfile.read_text())
            def running():
                out=subprocess.run(['ps','-o','stat=','-p',str(pid)],capture_output=True,text=True,timeout=2).stdout.strip()
                return bool(out) and not out.startswith('Z')
            end=time.monotonic()+1
            while running() and time.monotonic()<end: time.sleep(.02)
            self.assertFalse(running(),'timed-out descendant is still running')
        finally:
            if pidfile.exists():
                try:os.kill(int(pidfile.read_text()),signal.SIGKILL)
                except ProcessLookupError:pass

    def test_output_budget_and_invalid_utf8_fail_closed(self):
        import doctor_cgrx as doctor
        for body in ["import sys;sys.stdout.write('x'*2000000)","import sys;sys.stdout.buffer.write(bytes([255]))"]:
            binary=self.root/'flood';binary.write_text('#!'+sys.executable+'\n'+body+'\n');binary.chmod(0o755)
            result=doctor.probe_version(str(binary),2)
            self.assertIsNone(result['value'])
            self.assertTrue(result.get('output_limited') or result.get('invalid_output'))


    def test_pipe_eof_and_blocked_stdin_keep_deadlines(self):
        import doctor_cgrx as doctor
        for script, payload in [
            ('exec 1>&- 2>&-; sleep 30', b''),
            ('sleep 30', b'x' * 2000000),
        ]:
            started = time.monotonic()
            status, _ = doctor.bounded_process(['/bin/sh', '-c', script], .1, payload)
            self.assertTrue(status['timed_out'])
            self.assertFalse(status['cleanup_failed'])
            self.assertLess(time.monotonic() - started, 2)

    def test_metadata_and_stderr_are_sanitized(self):
        binary=self.fake_binary()
        binary.write_text(binary.read_text().replace('import json','import json\nimport sys;sys.stderr.write("DO_NOT_PRINT_THIS")',1))
        metadata=self.root/'metadata.json'
        metadata.write_text(json.dumps({'commit':'a'*40,'sha256':__import__('hashlib').sha256(binary.read_bytes()).hexdigest(),
            'command':'cargo build --config DO_NOT_PRINT_THIS','source':'DO_NOT_PRINT_THIS'}))
        self.assertEqual(self.run_doctor(binary,metadata=metadata).returncode,0)
        for invalid in ['[]','{"command":"DO_NOT_PRINT_THIS"}', 'DO_NOT_PRINT_THIS', '['*2000+']'*2000]:
            metadata.write_text(invalid)
            result=self.run_doctor(binary,metadata=metadata)
            self.assertEqual(result.returncode,2)
            self.assertNotIn('Traceback',result.stderr)

    def test_version_timeout_is_drift_with_healthy_rpc(self):
        binary=self.fake_binary()
        binary.write_text(binary.read_text().replace('print("cgrx 9.8.7")','import time;time.sleep(3);print("cgrx 9.8.7")'))
        result=self.run_doctor(binary,timeout=.5)
        self.assertEqual(result.returncode,1)
        report=json.loads(result.stdout)
        self.assertTrue(report['version_probe']['timed_out'])
        self.assertTrue(report['jsonrpc']['status']['ok'])

    def test_timeout_argument_is_finite_positive_and_bounded(self):
        binary=self.fake_binary()
        for value in ['nan','inf','-1','0','301']:
            result=self.run_doctor(binary,timeout=value)
            self.assertEqual(result.returncode,2)
            self.assertNotIn('Traceback',result.stderr)

    def test_invalid_framing_is_not_ignored(self):
        binary=self.fake_binary()
        original=binary.read_text()
        duplicate = '{"jsonrpc":"2.0","id":1,"id":1,"result":{}}'
        for replacement in ['print("not JSON",flush=True)\nfor line in sys.stdin:',
                            f'print({duplicate!r},flush=True)\nfor line in sys.stdin:']:
            binary.write_text(original.replace('for line in sys.stdin:',replacement))
            result=self.run_doctor(binary)
            self.assertEqual(result.returncode,1)
            self.assertIn('jsonrpc_invalid_output',[d['code'] for d in json.loads(result.stdout)['drift']])


if __name__ == "__main__":
    unittest.main()
