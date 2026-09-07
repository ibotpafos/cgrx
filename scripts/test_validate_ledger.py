#!/usr/bin/env python3
"""Integrity tests for the mistake ledger pipeline (Slice A)."""
import copy
import hashlib
import io
import json
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parent
ROOT = SCRIPTS.parent
sys.path.insert(0, str(SCRIPTS))

import validate_ledger
import eval_mistake_ledger


SEED = json.loads((ROOT / "contracts" / "mistake_ledger_v1.json").read_text())


def make_repo(files):
    tmp = tempfile.TemporaryDirectory(prefix="cgrx-ledger-test-")
    repo = Path(tmp.name).resolve()
    for rel, text in files.items():
        full = repo / rel
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_text(text)
    env = {"GIT_AUTHOR_NAME": "T", "GIT_AUTHOR_EMAIL": "t@e", "GIT_COMMITTER_NAME": "T",
           "GIT_COMMITTER_EMAIL": "t@e"}
    import os
    run = lambda *a: subprocess.run(["git", "-C", str(repo), *a], check=True,
                                    capture_output=True, env={**os.environ, **env})
    run("init", "-q")
    run("add", ".")
    run("commit", "-qm", "fixture")
    head = run("rev-parse", "HEAD").stdout.decode().strip()
    return tmp, repo, head


class LedgerValidationTests(unittest.TestCase):
    def test_seed_ledger_is_valid(self):
        self.assertTrue(validate_ledger.validate(copy.deepcopy(SEED)))

    def test_rule_keys_are_frozen(self):
        self.assertEqual(validate_ledger.RULE_KEYS, (
            "syntax_plain", "rust_module", "rust_self", "go_field", "go_local_ctor",
            "go_self", "go_import", "ts_lexical", "java_ctor", "syntax_java_receiver",
            "syntax_other"))

    def test_duplicate_id_rejected(self):
        doc = copy.deepcopy(SEED)
        doc["cases"].append(copy.deepcopy(doc["cases"][0]))
        with self.assertRaises(ValueError):
            validate_ledger.validate(doc)

    def test_unknown_rule_key_rejected(self):
        doc = copy.deepcopy(SEED)
        doc["cases"][0]["rule_key"] = "mind_reading"
        with self.assertRaises(ValueError):
            validate_ledger.validate(doc)

    def test_missing_fixture_rejected(self):
        doc = copy.deepcopy(SEED)
        doc["cases"][0]["fixture"] = "no-such-fixture"
        with self.assertRaises(ValueError):
            validate_ledger.validate(doc)

    def test_fixture_drift_rejected(self):
        with tempfile.TemporaryDirectory() as root:
            src = ROOT / "fixtures" / "mistake-ledger" / "fn-java-single-ctor"
            dst = Path(root) / "fixtures" / "mistake-ledger" / "fn-java-single-ctor"
            dst.mkdir(parents=True)
            (dst / "Service.java").write_text((src / "Service.java").read_text() + "\n// drift\n")
            doc = copy.deepcopy(SEED)
            with self.assertRaises(ValueError):
                validate_ledger.validate(doc, Path(root))

    def test_public_clone_round_trip(self):
        tmp, repo, head = make_repo({"Service.java": "class A { int f() { return 1; } }\n"})
        try:
            blob = subprocess.check_output(
                ["git", "-C", str(repo), "show", "HEAD:Service.java"], stderr=subprocess.DEVNULL)
            digest = hashlib.sha256(blob).hexdigest()
            doc = {"schema_version": 1, "cases": [{
                "id": "fp-x-001", "rule_key": "syntax_other", "kind": "false_positive",
                "repo_kind": "public_clone", "repo": str(repo), "revision": head,
                "caller": {"symbol": "f", "path": "Service.java"},
                "target": {"symbol": "g", "path": "Service.java"},
                "evidence": {"caller": {"path": "Service.java", "sha256": digest},
                             "target": {"path": "Service.java", "sha256": digest}},
                "reported_from": "test", "cgrx_version": "t", "extraction_revision": 1,
                "date": "2026-09-07"}]}
            self.assertTrue(validate_ledger.validate(doc))
            bad = copy.deepcopy(doc)
            bad["cases"][0]["revision"] = "0" * 40
            with self.assertRaises(ValueError):
                validate_ledger.validate(bad)
        finally:
            tmp.cleanup()


class ScoringTests(unittest.TestCase):
    def test_false_positive_passes_when_absent(self):
        verdict = eval_mistake_ledger.score_case("false_positive", {("a", "F")}, ("b", "F"))
        self.assertTrue(verdict["pass"])

    def test_false_positive_fails_when_present(self):
        verdict = eval_mistake_ledger.score_case("false_positive", {("b", "F")}, ("b", "F"))
        self.assertFalse(verdict["pass"])
        self.assertEqual(verdict["detail"], [("b", "F")])

    def test_false_negative_passes_when_present(self):
        verdict = eval_mistake_ledger.score_case("false_negative", {("b", "F")}, ("b", "F"))
        self.assertTrue(verdict["pass"])

    def test_false_negative_fails_when_missing(self):
        verdict = eval_mistake_ledger.score_case("false_negative", {("a", "F")}, ("b", "F"))
        self.assertFalse(verdict["pass"])


class ReportMistakeTests(unittest.TestCase):
    def test_scaffold_on_clean_repo(self):
        import report_mistake
        tmp, repo, head = make_repo({"Service.java": "class A { int f() { return 1; } }\n"})
        try:
            argv = ["--repo", str(repo), "--revision", head, "--kind", "false_positive",
                    "--rule-key", "syntax_other", "--caller", "f:Service.java",
                    "--target", "g:Service.java", "--reported-from", "test", "--id", "fp-x-002"]
            old = sys.argv
            sys.argv = ["report_mistake.py", *argv]
            try:
                buf = io.StringIO()
                with redirect_stdout(buf):
                    self.assertEqual(report_mistake.main(), 0)
            finally:
                sys.argv = old
            case = json.loads(buf.getvalue())
            self.assertEqual(case["repo"], str(repo))
            self.assertEqual(case["evidence"]["caller"]["sha256"],
                             hashlib.sha256(b"class A { int f() { return 1; } }\n").hexdigest())
        finally:
            tmp.cleanup()

    def test_dirty_worktree_rejected(self):
        import report_mistake
        tmp, repo, head = make_repo({"Service.java": "class A {}\n"})
        try:
            (repo / "Service.java").write_text("class A {}\n// dirty\n")
            old = sys.argv
            sys.argv = ["report_mistake.py", "--repo", str(repo), "--revision", head,
                        "--kind", "false_positive", "--rule-key", "syntax_other",
                        "--caller", "f:Service.java", "--target", "g:Service.java",
                        "--reported-from", "test", "--id", "fp-x-003"]
            try:
                with self.assertRaises(SystemExit) as ctx:
                    report_mistake.main()
                self.assertEqual(ctx.exception.code, 2)
            finally:
                sys.argv = old
        finally:
            tmp.cleanup()


if __name__ == "__main__":
    unittest.main()
