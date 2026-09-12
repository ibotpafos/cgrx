import json
from pathlib import Path
import tempfile
import unittest

import eval_agent_tasks as evaluation


class AgentEvaluationTests(unittest.TestCase):
    def test_treatment_requires_mcp_startup_and_disables_memory(self):
        cmd = evaluation.command(Path("/codex"), "gpt-6-astra", "medium", Path("/repo"),
                                 Path("/schema"), Path("/answer"), Path("/cgrx"))
        self.assertIn("mcp_servers.cgrx.required=true", cmd)
        self.assertIn("memories", cmd)
        self.assertIn("external_agent_memory_import", cmd)
        baseline = evaluation.command(Path("/codex"), "gpt-6-astra", "medium", Path("/repo"),
                                      Path("/schema"), Path("/answer"))
        self.assertFalse(any("mcp_servers" in arg for arg in baseline))

    def test_failed_turn_is_not_successful_empty_answer(self):
        result = evaluation.parse_events(json.dumps({"type": "turn.failed"}))
        self.assertFalse(result["complete"])
        self.assertIsNone(result["usage"])

    def test_events_preserve_usage_and_treatment_use(self):
        rows = [
            {"type": "item.completed", "item": {"type": "mcp_tool_call", "server": "cgrx"}},
            {"type": "turn.completed", "usage": {"input_tokens": 123, "output_tokens": 9}}
        ]
        result = evaluation.parse_events("\n".join(map(json.dumps, rows)))
        self.assertTrue(result["complete"])
        self.assertEqual(result["cgrx_calls"], 1)
        self.assertEqual(result["usage"]["input_tokens"], 123)

    def test_exact_target_identity_not_symbol_only(self):
        task = {"expected": {"relation": "CALLS"},
                "evidence": {"target": {"symbol": "run", "path": "a.py"}}}
        self.assertTrue(evaluation.score(task, {"relation": "CALLS", "target": {"symbol": "run", "path": "a.py"}}))
        self.assertFalse(evaluation.score(task, {"relation": "CALLS", "target": {"symbol": "run", "path": "b.py"}}))

    def test_abstention_does_not_accept_invented_target(self):
        task = {"expected": {"relation": "UNRESOLVED"}, "evidence": {}}
        self.assertTrue(evaluation.score(task, {"relation": "UNRESOLVED", "target": None}))
        self.assertFalse(evaluation.score(task, {"relation": "UNRESOLVED", "target": {"symbol": "run", "path": "a.py"}}))

    def test_package_import_accepts_directory_only_with_source_proof(self):
        task = {"expected": {"relation": "IMPORTS"},
                "evidence": {"target": {"symbol": "domain", "path": "internal/domain/types.go"}}}
        answer = {"relation": "IMPORTS", "target": {"symbol": "domain", "path": "internal/domain"}}
        self.assertFalse(evaluation.score(task, answer))
        self.assertTrue(evaluation.score(dict(task, package_target=True), answer))
        self.assertFalse(evaluation.score(dict(task, package_target=True),
            {"relation": "IMPORTS", "target": {"symbol": "domain", "path": "other/domain"}}))

    def test_prompt_does_not_leak_target(self):
        task = {"question": "Which function?", "expected": {"relation": "CALLS"},
                "evidence": {"source": {"path": "a.py", "symbol": "caller"},
                             "site": {"start_line": 3, "end_line": 3, "symbol": "SECRET_TARGET"},
                             "target": {"symbol": "SECRET_TARGET", "path": "secret.py"}}}
        for arm in evaluation.ARMS:
            self.assertNotIn("SECRET_TARGET", evaluation.prompt(task, arm))
            self.assertNotIn("secret.py", evaluation.prompt(task, arm))

    def test_no_complete_pair_means_no_score(self):
        result = evaluation.summarize([{"task": "x", "arm": "baseline", "status": "timeout"}])
        self.assertEqual(result["complete_pairs"], 0)
        self.assertEqual(len(result["failed_runs"]), 1)

    def test_incomplete_collection_returns_nonzero(self):
        import contextlib
        import io
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            binary = root/"binary"
            binary.write_bytes(b"fixture")
            args = ["eval", "--run", "--output", str(root/"output"),
                    "--codex", str(binary), "--cgrx", str(binary)]
            records = [{"task": "x", "arm": arm, "status": "failed", "correct": None,
                        "latency_ms": 1} for arm in evaluation.ARMS]
            with patch("sys.argv", args), patch.object(evaluation, "load_tasks", return_value=[{"id": "x"}]), \
                    patch.object(evaluation, "snapshot", return_value={}), \
                    patch.object(evaluation, "run_one", side_effect=records), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(evaluation.main(), 1)

    def test_mismatched_model_rejected(self):
        base = {"task": "x", "status": "completed", "correct": True, "latency_ms": 1,
                "model_requested": "gpt-6-astra", "effort": "medium", "timeout_seconds": 10,
                "snapshot": {"source_digest": "abc"}}
        with self.assertRaisesRegex(ValueError, "unpaired protocol"):
            evaluation.summarize([dict(base, arm="baseline"), dict(base, arm="cgrx", model_requested="other")])

    def test_duplicate_arm_rejected(self):
        with self.assertRaisesRegex(ValueError, "duplicate arm"):
            evaluation.summarize([{"task": "x", "arm": "baseline"}] * 2)

    def test_missing_usage_is_not_zero(self):
        base = {"task": "x", "status": "completed", "correct": True, "latency_ms": 1,
                "model_requested": "gpt-6-astra", "effort": "medium", "timeout_seconds": 10,
                "snapshot": {"source_digest": "abc"}}
        report = evaluation.summarize([dict(base, arm=arm) for arm in evaluation.ARMS])
        self.assertIsNone(report["arms"]["cgrx"]["input_tokens"])
        self.assertIsNone(report["arms"]["baseline"]["output_tokens"])

    def test_changed_oracle_fails_before_model_execution(self):
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            selection, corpus = root/"selection.json", root/"corpus.json"
            selection.write_text(json.dumps({"schema_version": 1, "split": "exploratory", "tasks": ["x"]}))
            corpus.write_text(json.dumps({"tasks": [{"id": "x", "repo": "/repo", "revision": "a"*40,
                "evidence": {"source": {"path": "a.py", "start_line": 1, "end_line": 1,
                    "sha256": evaluation.sha(b"original\n"), "span_sha256": evaluation.sha(b"original\n")}}}]}))
            with patch.object(evaluation, "git", return_value=b"changed\n"):
                with self.assertRaisesRegex(ValueError, "stale oracle"):
                    evaluation.load_tasks(selection, corpus)

    def test_private_repo_mapping_keeps_source_validation(self):
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            data = b"def f(): pass\n"
            selection, corpus, mapping = root/"selection.json", root/"corpus.json", root/"map.json"
            selection.write_text(json.dumps({"schema_version": 1, "split": "exploratory", "tasks": ["x"]}))
            corpus.write_text(json.dumps({"tasks": [{"id": "x", "repo": "/private/alias", "revision": "a"*40,
                "evidence": {"source": {"path": "a.py", "start_line": 1, "end_line": 1,
                    "sha256": evaluation.sha(data), "span_sha256": evaluation.sha(data)}}}]}))
            mapping.write_text(json.dumps({"/private/alias": "/local/repository"}))
            with patch.object(evaluation, "git", return_value=data) as git:
                tasks = evaluation.load_tasks(selection, corpus, mapping)
                self.assertEqual(tasks[0]["repo"], "/local/repository")
                git.assert_called_once_with("/local/repository", "show", "a"*40+":a.py")

    def test_snapshot_excludes_answer_manifests(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            repo = root / "original"
            repo.mkdir()
            (repo / "a.py").write_text("def f(): pass\n")
            (repo / ".gitignore").write_text("hidden.py\n")
            (repo / "hidden.py").write_text("original = True\n")
            (repo / ".env").write_text("EXAMPLE=fixture\n")
            (repo / "contracts").mkdir()
            (repo / "contracts/answers.json").write_text('{"answer":"f"}')
            evaluation.git(repo, "init", "-q")
            evaluation.git(repo, "add", "--force", ".")
            evaluation.git(repo, "-c", "user.name=Test", "-c", "user.email=test@localhost",
                           "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", "commit", "-qm", "test")
            task = {"repo": str(repo), "revision": evaluation.git(repo, "rev-parse", "HEAD").decode().strip(), "evidence": {}}
            identity = evaluation.snapshot(task, root / "copy")
            self.assertIn("contracts/answers.json", identity["excluded"])
            self.assertFalse((root / "copy/contracts/answers.json").exists())
            self.assertFalse((root / "copy/.env").exists())
            self.assertIn("hidden.py", evaluation.git(root / "copy", "ls-files").decode().splitlines())
            (root / "copy/hidden.py").write_text("modified\n")
            self.assertNotEqual(identity["source_digest"], evaluation.tree_digest(root / "copy"))


if __name__ == "__main__":
    unittest.main()
