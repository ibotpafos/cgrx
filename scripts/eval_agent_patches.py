#!/usr/bin/env python3
"""Evaluate optional CGRX on historical coding-agent patch tasks."""

import json
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile


ROOT = Path(__file__).resolve().parents[1]


def git(repo, *args, input_bytes=None):
    return subprocess.check_output(
        ["git", "-C", str(repo), *args],
        input=input_bytes,
        stderr=subprocess.PIPE,
    )


def safe_paths(values, field):
    if not isinstance(values, list) or not values or len(values) != len(set(values)):
        raise ValueError(f"{field} must contain unique paths")
    for value in values:
        if not isinstance(value, str):
            raise ValueError(f"{field} must contain string paths")
        path = Path(value)
        if path.is_absolute() or ".." in path.parts or value in {"", "."}:
            raise ValueError(f"unsafe {field} path: {value}")
    return values


def load_tasks(selection, repo_map=None):
    manifest = json.loads(Path(selection).read_text())
    if manifest.get("schema_version") != 1 or manifest.get("split") != "historical_patch":
        raise ValueError("unsupported patch-task selection")
    tasks = manifest.get("tasks")
    if not isinstance(tasks, list) or not tasks:
        raise ValueError("patch-task selection is empty")
    ids = [task.get("id") for task in tasks]
    if not all(isinstance(task_id, str) and task_id for task_id in ids) or len(ids) != len(set(ids)):
        raise ValueError("patch-task IDs must be unique non-empty strings")
    mapping = json.loads(Path(repo_map).read_text()) if repo_map else {}
    if not isinstance(mapping, dict) or not all(
            isinstance(key, str) and isinstance(value, str) for key, value in mapping.items()):
        raise ValueError("repo map must map aliases to local paths")

    loaded = []
    for original in tasks:
        task = dict(original)
        alias = task.get("repo")
        if not isinstance(alias, str) or not alias:
            raise ValueError("task repo must be a non-empty string")
        repo = Path(mapping.get(alias, alias)).resolve()
        if not repo.is_dir():
            raise ValueError(f"repository unavailable for {task['id']}")
        buggy = git(repo, "rev-parse", f"{task.get('buggy_revision')}^{{commit}}").decode().strip()
        fixed = git(repo, "rev-parse", f"{task.get('fix_revision')}^{{commit}}").decode().strip()
        lineage = git(repo, "rev-list", "--parents", "-n", "1", fixed).decode().split()
        if lineage != [fixed, buggy]:
            raise ValueError(f"fix revision must be a direct child of buggy revision: {task['id']}")

        editable = safe_paths(task.get("editable_paths"), "editable_paths")
        hidden = safe_paths(task.get("hidden_test_paths"), "hidden_test_paths")
        if set(editable) & set(hidden):
            raise ValueError(f"editable and hidden test paths overlap: {task['id']}")
        changed = set(git(repo, "diff", "--name-only", buggy, fixed).decode().splitlines())
        for path in editable + hidden:
            if path not in changed:
                raise ValueError(f"declared path did not change in reference fix: {path}")

        acceptance = task.get("acceptance")
        if not isinstance(acceptance, dict):
            raise ValueError("acceptance must be an object")
        argv = acceptance.get("argv")
        timeout = acceptance.get("timeout_seconds")
        if not isinstance(argv, list) or not argv or not all(isinstance(arg, str) and arg for arg in argv):
            raise ValueError("acceptance argv must contain non-empty strings")
        if type(timeout) is not int or timeout < 1:
            raise ValueError("acceptance timeout_seconds must be positive")
        if not isinstance(task.get("prompt"), str) or not task["prompt"].strip():
            raise ValueError("task prompt must be non-empty")

        task.update(_repo=str(repo), buggy_revision=buggy, fix_revision=fixed)
        loaded.append(task)
    return loaded


def hidden_test_patch(task):
    return git(
        task["_repo"], "diff", "--binary", task["buggy_revision"],
        task["fix_revision"], "--", *task["hidden_test_paths"]
    )


def materialize(task, revision, destination):
    destination.mkdir(parents=True, exist_ok=False)
    with tempfile.TemporaryFile() as archive:
        subprocess.run(
            ["git", "-C", task["_repo"], "archive", revision],
            stdout=archive,
            check=True,
        )
        archive.seek(0)
        with tarfile.open(fileobj=archive) as source:
            for member in source:
                path = Path(member.name)
                if path.is_absolute() or ".." in path.parts:
                    raise ValueError("unsafe archive path")
                if not member.isfile():
                    continue
                target = destination / path
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(source.extractfile(member).read())
    git(destination, "init", "-q")
    git(destination, "add", "--force", "--all")
    git(
        destination,
        "-c", "user.name=Evaluation",
        "-c", "user.email=eval@localhost",
        "-c", "core.hooksPath=/dev/null",
        "-c", "commit.gpgsign=false",
        "commit", "-qm", "Frozen patch evaluation source",
    )
    return destination


def run_acceptance(task, repo):
    environment = os.environ.copy()
    result = subprocess.run(
        task["acceptance"]["argv"],
        cwd=repo,
        env=environment,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        timeout=task["acceptance"]["timeout_seconds"],
    )
    return result.returncode, result.stdout


def preflight(task, directory):
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=False)
    buggy = materialize(task, task["buggy_revision"], directory / "buggy")
    patch = hidden_test_patch(task)
    subprocess.run(
        ["git", "-C", str(buggy), "apply", "--binary", "-"],
        input=patch,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    reference = materialize(task, task["fix_revision"], directory / "reference")
    try:
        buggy_code, buggy_output = run_acceptance(task, buggy)
        reference_code, reference_output = run_acceptance(task, reference)
    except subprocess.TimeoutExpired as error:
        raise ValueError(f"acceptance preflight timed out: {task['id']}") from error
    if reference_code != 0:
        raise ValueError(f"acceptance fails on reference revision: {task['id']}")
    if buggy_code == 0:
        raise ValueError(f"acceptance passes on buggy revision: {task['id']}")
    result = {
        "task": task["id"],
        "buggy_exit_code": buggy_code,
        "reference_exit_code": reference_code,
        "buggy_output": buggy_output,
        "reference_output": reference_output,
    }
    (directory / "result.json").write_text(json.dumps(result, indent=2) + "\n")
    return result
