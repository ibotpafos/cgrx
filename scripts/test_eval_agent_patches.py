import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parent))
import eval_agent_patches as evaluation


def git(repo, *args):
    return subprocess.check_output(
        ["git", "-C", str(repo), *args], stderr=subprocess.PIPE, text=True
    ).strip()


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


def fixture(root):
    repo = root / "repo"
    repo.mkdir()
    git(repo, "init", "-q")
    write(repo / "app.py", "def value():\n    return 1\n")
    git(repo, "add", ".")
    git(repo, "-c", "user.name=Test", "-c", "user.email=test@localhost",
        "commit", "-qm", "buggy")
    buggy = git(repo, "rev-parse", "HEAD")
    write(repo / "app.py", "def value():\n    return 2\n")
    write(repo / "test_hidden.py",
          "import unittest\nfrom app import value\n\n"
          "class HiddenTest(unittest.TestCase):\n"
          "    def test_value(self):\n        self.assertEqual(value(), 2)\n")
    git(repo, "add", ".")
    git(repo, "-c", "user.name=Test", "-c", "user.email=test@localhost",
        "commit", "-qm", "fixed")
    fixed = git(repo, "rev-parse", "HEAD")
    task = {
        "id": "value-fix",
        "repo": "/corpus/project",
        "buggy_revision": buggy,
        "fix_revision": fixed,
        "prompt": "Make value return two.",
        "editable_paths": ["app.py"],
        "hidden_test_paths": ["test_hidden.py"],
        "acceptance": {
            "argv": [sys.executable, "-m", "unittest", "test_hidden.py"],
            "timeout_seconds": 20,
        },
    }
    return repo, task


def selection(root, task):
    path = root / "selection.json"
    path.write_text(json.dumps({
        "schema_version": 1,
        "split": "historical_patch",
        "tasks": [task],
    }))
    mapping = root / "repo-map.json"
    mapping.write_text(json.dumps({"/corpus/project": str(root / "repo")}))
    return path, mapping


class ContractTests(unittest.TestCase):
    def test_load_tasks_rejects_non_direct_fix(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            repo, task = fixture(root)
            write(repo / "later.txt", "later\n")
            git(repo, "add", ".")
            git(repo, "-c", "user.name=Test", "-c", "user.email=test@localhost",
                "commit", "-qm", "later")
            task["fix_revision"] = git(repo, "rev-parse", "HEAD")
            manifest, mapping = selection(root, task)

            with self.assertRaisesRegex(ValueError, "direct child"):
                evaluation.load_tasks(manifest, mapping)

    def test_load_tasks_rejects_unsafe_and_unchanged_paths(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            _, task = fixture(root)
            for field, value, message in (
                ("editable_paths", ["../app.py"], "unsafe"),
                ("hidden_test_paths", ["/test_hidden.py"], "unsafe"),
                ("editable_paths", ["unchanged.py"], "did not change"),
            ):
                candidate = dict(task)
                candidate[field] = value
                manifest, mapping = selection(root, candidate)
                with self.assertRaisesRegex(ValueError, message):
                    evaluation.load_tasks(manifest, mapping)

    def test_hidden_test_patch_contains_only_declared_tests(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            _, task = fixture(root)
            manifest, mapping = selection(root, task)
            loaded = evaluation.load_tasks(manifest, mapping)[0]

            patch = evaluation.hidden_test_patch(loaded).decode()

            self.assertIn("test_hidden.py", patch)
            self.assertNotIn("app.py", patch)


class PreflightTests(unittest.TestCase):
    def test_preflight_requires_buggy_failure_and_reference_success(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            _, task = fixture(root)
            manifest, mapping = selection(root, task)
            loaded = evaluation.load_tasks(manifest, mapping)[0]

            result = evaluation.preflight(loaded, root / "preflight")

            self.assertNotEqual(result["buggy_exit_code"], 0)
            self.assertEqual(result["reference_exit_code"], 0)

            always_fails = dict(loaded)
            always_fails["acceptance"] = {
                "argv": [sys.executable, "-c", "raise SystemExit(7)"],
                "timeout_seconds": 20,
            }
            with self.assertRaisesRegex(ValueError, "reference revision"):
                evaluation.preflight(always_fails, root / "always-fails")

            always_passes = dict(loaded)
            always_passes["acceptance"] = {
                "argv": [sys.executable, "-c", "raise SystemExit(0)"],
                "timeout_seconds": 20,
            }
            with self.assertRaisesRegex(ValueError, "buggy revision"):
                evaluation.preflight(always_passes, root / "always-passes")


if __name__ == "__main__":
    unittest.main()
