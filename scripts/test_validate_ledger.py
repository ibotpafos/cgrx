#!/usr/bin/env python3
"""Integrity tests for the mistake ledger pipeline (Slice A)."""
import copy
import hashlib
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest.mock import patch


SCRIPTS = Path(__file__).resolve().parent
ROOT = SCRIPTS.parent
sys.path.insert(0, str(SCRIPTS))

import validate_ledger
import eval_mistake_ledger
import report_mistake


SEED = json.loads((ROOT / "contracts" / "mistake_ledger_v1.json").read_text())


def synthetic_case(fixture, files):
    case = copy.deepcopy(SEED["cases"][0])
    case.update({"id": "fp-pinned-fixture-001", "fixture": fixture,
                 "caller": {"symbol": "first", "path": "src.rs"},
                 "target": {"symbol": "second", "path": "src.rs"},
                 "fixture_sha256": {path: hashlib.sha256(data).hexdigest()
                                    for path, data in files.items()}})
    return case


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

    def test_relation_kind_is_optional_for_legacy_cases(self):
        doc = copy.deepcopy(SEED)
        for case in doc["cases"]:
            case.pop("relation_kind", None)
        self.assertTrue(validate_ledger.validate(doc))

    def test_all_supported_relation_kinds_are_valid(self):
        for relation_kind in ("CALLS", "IMPLEMENTS", "CONTAINS"):
            with self.subTest(relation_kind=relation_kind):
                doc = copy.deepcopy(SEED)
                doc["cases"][0]["relation_kind"] = relation_kind
                self.assertTrue(validate_ledger.validate(doc))

    def test_invalid_relation_kind_rejected(self):
        for relation_kind in (None, "", "calls", "Contains", "UNKNOWN", "IMPORTS", "REFERENCES", 1, True,
                              [], ["CALLS"], {}, {"kind": "CONTAINS"}):
            with self.subTest(relation_kind=relation_kind):
                doc = copy.deepcopy(SEED)
                doc["cases"][0]["relation_kind"] = relation_kind
                with self.assertRaises(ValueError):
                    validate_ledger.validate(doc)

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
            doc["cases"] = [case for case in doc["cases"] if case["fixture"] == "fn-java-single-ctor"]
            with self.assertRaisesRegex(ValueError, "fixture drift"):
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


class FixtureInventoryTests(unittest.TestCase):
    def test_hidden_files_and_hidden_directories_are_hashed(self):
        files = {"src.rs": b"fn first() {}\nfn second() {}\n",
                 ".extra.rs": b"fn hidden() {}\n", ".gitignore": b"ignored.rs\n",
                 ".evidence/nested.rs": b"fn nested() {}\n"}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for path, data in files.items():
                full = root / path
                full.parent.mkdir(parents=True, exist_ok=True)
                full.write_bytes(data)
            self.assertEqual(validate_ledger.fixture_hashes(root), {
                path: hashlib.sha256(data).hexdigest() for path, data in files.items()})

    def test_hidden_source_and_gitignore_byte_drift_rejected(self):
        for changed in (".extra.rs", ".gitignore"):
            with self.subTest(changed=changed), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                fixture = root / "fixtures" / "mistake-ledger" / "pinned-hidden"
                fixture.mkdir(parents=True)
                files = {"src.rs": b"fn first() {}\nfn second() {}\n",
                         ".extra.rs": b"fn hidden() {}\n", ".gitignore": b"ignored.rs\n"}
                for path, data in files.items():
                    (fixture / path).write_bytes(data)
                doc = {"schema_version": 1, "cases": [synthetic_case("pinned-hidden", files)]}
                self.assertTrue(validate_ledger.validate(doc, root))
                (fixture / changed).write_bytes(files[changed] + b"// changed bytes\n")
                with self.assertRaisesRegex(ValueError, "fixture drift"):
                    validate_ledger.validate(doc, root)

    def test_symlink_file_or_directory_rejected(self):
        for kind in ("file", "directory", "broken"):
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                if kind == "directory":
                    target = root / "target"
                    target.mkdir()
                    (target / "src.rs").write_bytes(b"fn first() {}\n")
                elif kind == "file":
                    target = root / "src.rs"
                    target.write_bytes(b"fn first() {}\n")
                else:
                    target = root / "missing"
                (root / ".hidden-link").symlink_to(target, target_is_directory=kind == "directory")
                with self.assertRaisesRegex(ValueError, "symlink"):
                    validate_ledger.fixture_hashes(root)

    def test_git_metadata_file_or_directory_rejected_case_insensitively(self):
        for name in (".git", ".GIT", ".GiT"):
            for kind in ("file", "directory"):
                with self.subTest(name=name, kind=kind), tempfile.TemporaryDirectory() as directory:
                    root = Path(directory)
                    nested = root / ".nested"
                    nested.mkdir()
                    metadata = nested / name
                    if kind == "directory":
                        metadata.mkdir()
                    else:
                        metadata.write_bytes(b"gitdir: /outside\n")
                    with self.assertRaisesRegex(ValueError, "Git metadata"):
                        validate_ledger.fixture_hashes(root)

    @unittest.skipUnless(hasattr(os, "mkfifo"), "FIFO fixtures require mkfifo")
    def test_nonregular_fixture_entry_rejected_without_reading(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            os.mkfifo(root / ".pipe")
            with self.assertRaises(ValueError):
                validate_ledger.fixture_hashes(root)


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


class TraceRelationTests(unittest.TestCase):
    @staticmethod
    def response(structured):
        return subprocess.CompletedProcess(
            [], 0, stdout="\n".join(json.dumps(response) for response in (
                {"jsonrpc": "2.0", "id": 1, "result": {}},
                {"jsonrpc": "2.0", "id": 2,
                 "result": {"structuredContent": structured}},
            )) + "\n", stderr="",
        )

    @staticmethod
    def complete_rows():
        return {"truncated": False, "total": 2, "nodes": [
            {"symbol": "second", "path": "src/lib.rs", "hop": 1},
            {"symbol": "third", "path": "src/lib.rs", "hop": 1},
        ]}

    def test_relation_scope_and_complete_result_projection(self):
        for relation_kind in (None, "CALLS", "IMPLEMENTS", "CONTAINS"):
            with self.subTest(relation_kind=relation_kind):
                kwargs = {} if relation_kind is None else {"relation_kind": relation_kind}
                with patch.object(eval_mistake_ledger.subprocess, "run",
                                  return_value=self.response(self.complete_rows())) as run:
                    observed = eval_mistake_ledger.trace_callees(
                        Path("/test/cgrx"), Path("/test/repo"), "first", "src/lib.rs", **kwargs)
                self.assertEqual(observed, {("second", "src/lib.rs"), ("third", "src/lib.rs")})
                frames = [json.loads(line) for line in run.call_args.kwargs["input"].splitlines()]
                request = next(frame for frame in frames if frame.get("id") == 2)
                self.assertEqual(request["params"], {
                    "name": "trace_path", "arguments": {
                        "repo": "/test/repo", "symbol": "first", "path": "src/lib.rs",
                        "direction": "callees", "depth": 1, "limit": 50,
                        "scope": {"include": ["**"], "exclude": [],
                                  "relation_kinds": [relation_kind or "CALLS"], "max_depth": 1},
                    },
                })
                self.assertFalse(eval_mistake_ledger.score_case(
                    "false_positive", observed, ("second", "src/lib.rs"))["pass"])
                self.assertTrue(eval_mistake_ledger.score_case(
                    "false_negative", observed, ("third", "src/lib.rs"))["pass"])

    def test_empty_complete_trace_is_a_valid_absence(self):
        with patch.object(eval_mistake_ledger.subprocess, "run", return_value=self.response(
                {"truncated": False, "total": 0, "nodes": []})):
            observed = eval_mistake_ledger.trace_callees(
                Path("/test/cgrx"), Path("/test/repo"), "first", "src/lib.rs", "CONTAINS")
        self.assertEqual(observed, set())
        self.assertTrue(eval_mistake_ledger.score_case(
            "false_positive", observed, ("second", "src/lib.rs"))["pass"])

    def test_truncated_or_incomplete_metadata_rejected(self):
        broken = []
        for field, values in (("truncated", (True, None, 0)),
                              ("total", (None, "2", True, 1, 3))):
            for value in values:
                payload = self.complete_rows()
                payload[field] = value
                broken.append((f"{field}={value!r}", payload))
            payload = self.complete_rows()
            payload.pop(field)
            broken.append((f"missing {field}", payload))
        for label, payload in broken:
            with self.subTest(label=label), patch.object(
                    eval_mistake_ledger.subprocess, "run", return_value=self.response(payload)):
                with self.assertRaises(RuntimeError):
                    eval_mistake_ledger.trace_callees(
                        Path("/test/cgrx"), Path("/test/repo"), "first", "src/lib.rs", "CONTAINS")

    def test_missing_or_non_depth_one_hops_rejected(self):
        for hop in (None, "1", True, 0, 2):
            with self.subTest(hop=hop):
                payload = self.complete_rows()
                if hop is None:
                    payload["nodes"][0].pop("hop")
                else:
                    payload["nodes"][0]["hop"] = hop
                with patch.object(eval_mistake_ledger.subprocess, "run",
                                  return_value=self.response(payload)):
                    with self.assertRaises(RuntimeError):
                        eval_mistake_ledger.trace_callees(
                            Path("/test/cgrx"), Path("/test/repo"), "first", "src/lib.rs", "CONTAINS")

    def test_main_propagates_explicit_relation_and_legacy_calls(self):
        legacy = copy.deepcopy(SEED["cases"][0])
        legacy.pop("relation_kind", None)
        legacy["id"] = "legacy-call"
        legacy["kind"] = "false_positive"
        contains = copy.deepcopy(legacy)
        contains["id"] = "contains-pair"
        contains["relation_kind"] = "CONTAINS"
        target = (contains["target"]["symbol"], contains["target"]["path"])
        output = io.StringIO()
        with patch.object(sys, "argv", ["eval_mistake_ledger.py", "/test/cgrx"]), \
                patch.object(Path, "read_text", return_value=json.dumps({"cases": [legacy, contains]})), \
                patch.object(eval_mistake_ledger, "copy_fixture"), \
                patch.object(eval_mistake_ledger, "verify_fixture_commit"), \
                patch.object(eval_mistake_ledger, "git") as git, \
                patch.object(eval_mistake_ledger, "trace_callees", side_effect=[set(), {target}]) as trace, \
                redirect_stdout(output):
            result = eval_mistake_ledger.main()
        self.assertEqual(result, 1)
        kinds = [call.kwargs.get("relation_kind", call.args[4] if len(call.args) > 4 else "CALLS")
                 for call in trace.call_args_list]
        self.assertEqual(kinds, ["CALLS", "CONTAINS"])
        report = json.loads(output.getvalue())
        self.assertEqual(report["failed"], ["contains-pair"])
        self.assertTrue(report["cases"][0]["pass"])
        self.assertFalse(report["cases"][1]["pass"])
        additions = [call.args[1:] for call in git.call_args_list if call.args[1] == "add"]
        self.assertEqual(len(additions), 2)
        self.assertTrue(all("--force" in args or "-f" in args for args in additions))

    def test_unpinned_hidden_bytes_rejected_before_copy_or_execution(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fixture = root / "fixtures" / "mistake-ledger" / "unpinned-hidden"
            fixture.mkdir(parents=True)
            files = {"src.rs": b"fn first() {}\nfn second() {}\n"}
            (fixture / "src.rs").write_bytes(files["src.rs"])
            (fixture / ".extra.rs").write_bytes(b"fn injected() {}\n")
            doc = {"schema_version": 1, "cases": [synthetic_case("unpinned-hidden", files)]}
            with patch.object(sys, "argv", ["eval_mistake_ledger.py", "/test/cgrx"]), \
                    patch.object(Path, "read_text", return_value=json.dumps(doc)), \
                    patch.object(eval_mistake_ledger, "ROOT", root), \
                    patch.object(eval_mistake_ledger, "FIXTURES", fixture.parent), \
                    patch.object(Path, "write_bytes") as write_bytes, \
                    patch.object(eval_mistake_ledger, "git") as git, \
                    patch.object(eval_mistake_ledger.subprocess, "run") as run:
                with self.assertRaisesRegex((ValueError, RuntimeError), "fixture drift"):
                    eval_mistake_ledger.main()
            write_bytes.assert_not_called()
            git.assert_not_called()
            run.assert_not_called()

    def test_committed_fixture_bytes_must_match_pinned_hashes(self):
        repo = Path("/test/repo")
        pinned = b"*.rs\n"
        recorded = {".gitignore": hashlib.sha256(pinned).hexdigest()}
        with patch.object(eval_mistake_ledger, "git", return_value=pinned) as git:
            eval_mistake_ledger.verify_fixture_commit(repo, recorded)
        git.assert_called_once_with(repo, "show", "HEAD:.gitignore")
        with patch.object(eval_mistake_ledger, "git", return_value=b"*.rs\n.extra.rs\n"):
            with self.assertRaisesRegex(ValueError, "committed fixture differs"):
                eval_mistake_ledger.verify_fixture_commit(repo, recorded)


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


class ReportRelationTests(unittest.TestCase):
    def run_scaffold(self, files, extra=(), caller="first:src.rs", target="second:src.rs",
                     expect_error=False, worktree_overrides=None):
        with tempfile.TemporaryDirectory(prefix="cgrx-reporter-test-") as directory:
            repo = Path(directory).resolve()
            for relative, data in {**files, **(worktree_overrides or {})}.items():
                full = repo / relative
                full.parent.mkdir(parents=True, exist_ok=True)
                full.write_bytes(data)
            revision = "1" * 40

            def git_read(git_repo, *arguments):
                self.assertEqual(Path(git_repo), repo)
                if arguments == ("rev-parse", "--show-toplevel"):
                    return (str(repo) + "\n").encode()
                if arguments == ("rev-parse", "HEAD"):
                    return (revision + "\n").encode()
                if arguments == ("status", "--porcelain"):
                    return b""
                if arguments[0] == "show":
                    commit, relative = arguments[1].split(":", 1)
                    self.assertEqual(commit, revision)
                    return files[relative]
                if arguments[:5] == ("ls-tree", "-r", "--name-only", "-z", revision):
                    self.assertEqual(arguments[5], "--")
                    prefix = arguments[6].rstrip("/") + "/"
                    return "".join(name + "\0" for name in sorted(files)
                                   if name.startswith(prefix)).encode()
                self.fail(f"unexpected Git read: {arguments}")

            argv = ["report_mistake.py", "--repo", str(repo), "--revision", revision,
                    "--kind", "false_positive", "--rule-key", "syntax_other",
                    "--caller", caller, "--target", target, "--reported-from", "test",
                    "--id", "fp-relation-001", *extra]
            output, errors = io.StringIO(), io.StringIO()
            with patch.object(sys, "argv", argv), patch.object(report_mistake, "git", side_effect=git_read), \
                    redirect_stdout(output), redirect_stderr(errors):
                if expect_error:
                    with self.assertRaises(SystemExit) as exit:
                        report_mistake.main()
                    self.assertEqual(exit.exception.code, 2)
                    self.assertEqual(output.getvalue(), "")
                    return errors.getvalue()
                self.assertEqual(report_mistake.main(), 0)
            case = json.loads(output.getvalue())
            if case["repo_kind"] == "synthetic":
                self.assertTrue(validate_ledger.validate({"schema_version": 1, "cases": [case]}, repo))
            return case

    def test_legacy_relation_and_metadata_defaults_are_preserved(self):
        for extra in ((), ("--relation-kind", "CALLS")):
            with self.subTest(extra=extra):
                case = self.run_scaffold({"src.rs": b"fn first() {}\nfn second() {}\n"}, extra)
                self.assertNotIn("relation_kind", case)
                self.assertEqual(case["cgrx_version"], "v0.1.0-alpha.7")
                self.assertEqual(case["extraction_revision"], 28)

    def test_relation_and_metadata_overrides_are_recorded(self):
        case = self.run_scaffold({"src.rs": b"fn first() {}\nfn second() {}\n"}, (
            "--relation-kind", "CONTAINS", "--cgrx-version", "v0.1.0-containment",
            "--extraction-revision", "37"))
        self.assertEqual(case["relation_kind"], "CONTAINS")
        self.assertEqual(case["cgrx_version"], "v0.1.0-containment")
        self.assertEqual(case["extraction_revision"], 37)

    def test_clean_status_does_not_allow_modified_anchor_bytes(self):
        self.run_scaffold({"src.rs": b"fn first() {}\nfn second() {}\n"},
                          expect_error=True, worktree_overrides={"src.rs": b"fn changed() {}\n"})

    def test_synthetic_fixture_hashes_all_committed_files_including_hidden(self):
        prefix = "fixtures/mistake-ledger/contains-check/"
        pinned = {"src.rs": b"fn first() {}\nfn second() {}\n",
                  "nested/README.md": b"Permanent containment evidence.\n",
                  ".extra.rs": b"fn hidden() {}\n", ".gitignore": b"ignored.rs\n",
                  ".evidence/note": b"Hidden evidence is pinned too.\n"}
        files = {prefix + name: data for name, data in pinned.items()}
        files["outside.rs"] = b"fn unrelated() {}\n"
        case = self.run_scaffold(files, ("--synthetic", "--fixture", "contains-check",
                                        "--relation-kind", "CONTAINS"),
                                 caller="first:" + prefix + "src.rs",
                                 target="second:" + prefix + "src.rs")
        self.assertEqual(case["fixture_sha256"], {
            name: hashlib.sha256(data).hexdigest() for name, data in pinned.items()})
        self.assertEqual(case["caller"], {"symbol": "first", "path": "src.rs"})
        self.assertEqual(case["target"], {"symbol": "second", "path": "src.rs"})
        self.assertEqual(case["repo_kind"], "synthetic")
        self.assertNotIn("repo", case)
        self.assertNotIn("revision", case)
        self.assertNotIn("evidence", case)

    def test_gitignored_visible_fixture_extra_is_rejected(self):
        prefix = "fixtures/mistake-ledger/contains-check/"
        errors = self.run_scaffold({
            prefix + "src.rs": b"fn first() {}\nfn second() {}\n",
            prefix + ".gitignore": b"debug.log\n",
        }, ("--synthetic", "--fixture", "contains-check", "--relation-kind", "CONTAINS"),
            caller="first:" + prefix + "src.rs", target="second:" + prefix + "src.rs",
            expect_error=True, worktree_overrides={prefix + "debug.log": b"ignored worktree content\n"})
        self.assertIn("fixture contains files outside its committed evidence", errors)

    def test_uncommitted_hidden_fixture_extra_is_rejected(self):
        prefix = "fixtures/mistake-ledger/contains-check/"
        errors = self.run_scaffold({prefix + "src.rs": b"fn first() {}\nfn second() {}\n"},
            ("--synthetic", "--fixture", "contains-check", "--relation-kind", "CONTAINS"),
            caller="first:" + prefix + "src.rs", target="second:" + prefix + "src.rs",
            expect_error=True, worktree_overrides={prefix + ".extra.rs": b"fn injected() {}\n"})
        self.assertIn("fixture contains files outside its committed evidence", errors)

    def test_synthetic_anchor_outside_selected_fixture_is_rejected(self):
        prefix = "fixtures/mistake-ledger/contains-check/"
        files = {prefix + "src.rs": b"fn first() {}\nfn second() {}\n",
                 "outside.rs": b"fn outside() {}\n"}
        for caller, target in (("first:outside.rs", "second:" + prefix + "src.rs"),
                               ("first:" + prefix + "src.rs", "second:outside.rs")):
            with self.subTest(caller=caller, target=target):
                self.run_scaffold(files, ("--synthetic", "--fixture", "contains-check"),
                                  caller=caller, target=target, expect_error=True)

    def test_invalid_synthetic_fixture_name_is_rejected(self):
        for name in ("", "../escape", "contains-check/child"):
            with self.subTest(name=name):
                self.run_scaffold({"src.rs": b"fn first() {}\nfn second() {}\n"},
                                  ("--synthetic", "--fixture", name), expect_error=True)


if __name__ == "__main__":
    unittest.main()
