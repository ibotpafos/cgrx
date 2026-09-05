#!/usr/bin/env python3
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import textwrap
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
                        structured = {{}} if malformed else {{"freshness":"WATCHED","snapshot":{{"repo_revision":"abc","graph_generation":7}}}}
                        print(json.dumps({{"jsonrpc":"2.0","id":request["id"],"result":{{
                            "structuredContent":structured
                        }}}}), flush=True)
        """))
        path.chmod(0o755)
        return path

    def run_doctor(self, executable, reference=None, launcher=None, metadata=None):
        command = [
            sys.executable,
            str(DOCTOR),
            "--executable", str(executable),
            "--repo", str(self.repo),
            "--json",
        ]
        if reference:
            command.extend(["--reference-executable", str(reference)])
        if launcher:
            command.extend(["--launcher", str(launcher)])
        if metadata:
            command.extend(["--metadata", str(metadata)])
        environment = os.environ.copy()
        environment["CGRX_DOCTOR_SECRET_SENTINEL"] = "DO_NOT_PRINT_THIS"
        result = subprocess.run(command, text=True, capture_output=True, env=environment)
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


if __name__ == "__main__":
    unittest.main()
