"""MCP lifecycle regressions. CGRX_TEST_BINARY selects a built executable.

No network or model is needed by default. Set CGRX_RUN_SEMANTIC_RESOURCE_TEST=1
with an existing CGRX_MEMORY_MODEL_CACHE for the real inference-session case.
"""
import concurrent.futures
import json
import os
from pathlib import Path
import selectors
import shutil
import subprocess
import sys
import tempfile
import time
import unittest

BINARY = Path(os.environ.get("CGRX_TEST_BINARY", "target/debug/cgrx")).resolve()


def records(value):
    if "cols" in value:
        return [dict(zip(value["cols"], row)) for row in value["rows"]]
    return value.get("results", [])


class Client:
    def __init__(self, fixture, flags=(), semantic=False, extra_env=None):
        env = dict(os.environ, CGRX_MEMORY_EMBEDDINGS="on" if semantic else "off",
                   CGRX_RESOURCE_DIR=str(fixture / "slots"))
        env.pop("CGRX_USAGE_LOG", None)
        env.update(extra_env or {})
        self.child = subprocess.Popen(
            [str(BINARY), "serve", "--multi-repo", "--response-profile", "full", *flags],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            text=True, env=env)
        self.selector = selectors.DefaultSelector()
        self.selector.register(self.child.stdout, selectors.EVENT_READ)
        self.serial = 0
        self.rpc("initialize", {})

    def rpc(self, method, params):
        self.serial += 1
        self.child.stdin.write(json.dumps({"jsonrpc": "2.0", "id": self.serial,
                                         "method": method, "params": params}) + "\n")
        self.child.stdin.flush()
        return self.receive()

    def receive(self):
        if not self.selector.select(timeout=120):
            raise AssertionError("MCP response timed out")
        line = self.child.stdout.readline()
        if not line:
            raise AssertionError("MCP connection unexpectedly closed")
        value = json.loads(line)
        assert value["id"] == self.serial, value
        return value

    def raw_tool(self, name, repo, **arguments):
        return self.rpc("tools/call", {"name": name, "arguments": {"repo": str(repo), **arguments}})

    def tool(self, name, repo, **arguments):
        value = self.raw_tool(name, repo, **arguments)
        assert "error" not in value, value
        value = value["result"]
        assert not value.get("isError"), value
        return value.get("structuredContent") or json.loads(value["content"][0]["text"])

    def close(self):
        if self.child.stdin:
            try:
                self.child.stdin.close()
            except BrokenPipeError:
                pass
        try:
            self.child.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.child.kill()  # Only this test's own process.
            self.child.wait(timeout=5)
        self.child.stdout.close()
        self.selector.close()


@unittest.skipUnless(BINARY.is_file(), "build CGRX or set CGRX_TEST_BINARY")
class ResourceTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="cgrx-resource-tests-")
        self.fixture = Path(self.temporary.name).resolve()
        self.clients = []
        self.a = self.repo("A", 111)
        self.b = self.repo("B", 222)

    def tearDown(self):
        for client in self.clients:
            client.close()
        self.temporary.cleanup()

    def repo(self, name, number):
        path = self.fixture / name
        path.mkdir()
        subprocess.run(["git", "-C", str(path), "init", "-q"], check=True)
        (path / "main.rs").write_text(f"fn Same() -> u32 {{ {number} }}\n")
        subprocess.run(["git", "-C", str(path), "add", "."], check=True)
        subprocess.run(["git", "-C", str(path), "-c", "user.name=Test", "-c",
                        "user.email=test@example.invalid", "commit", "-qm", "fixture"], check=True)
        return path

    def client(self, *flags, **kwargs):
        client = Client(self.fixture, flags, **kwargs)
        self.clients.append(client)
        return client

    @staticmethod
    def save(client, repo, fact="Keep the native resource lifecycle bounded"):
        value = client.tool("memory_record", repo, fact=fact, confidence=1000,
                            memory_kind="semantic", source_kind="tool", source_ref="resource-regression")
        return value.get("record", value)

    @staticmethod
    def orient(client, repo, task="Same"):
        return client.tool("orient", repo, task=task, budget=1,
                           scope={"include": ["main.rs"], "relation_kinds": ["CALLS"], "max_depth": 1})

    @staticmethod
    def inference_children(client):
        listing = subprocess.check_output(["ps", "-axo", "pid=,ppid=,args="], text=True)
        rows = [line.strip().split(maxsplit=2) for line in listing.splitlines()]
        return [int(row[0]) for row in rows if len(row) == 3
                and int(row[1]) == client.child.pid and "__memory-embed" in row[2]]

    def wait_for_queue(self, count):
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            if len(list((self.fixture / "slots").glob("wait-*.lock"))) >= count:
                return
            time.sleep(.01)
        self.fail(f"expected {count} queued requests")

    def test_idle_keepalive_wake_memory_and_expired_handle(self):
        client = self.client("--idle-seconds", "0.15")
        saved = self.save(client, self.a)
        handle = self.orient(client, self.a)["next_handles"][0]
        deadline = time.monotonic() + .5
        while time.monotonic() < deadline:
            self.assertEqual(client.rpc("ping", {})["result"], {})
            client.rpc("tools/list", {})
            time.sleep(.03)
        expired = client.raw_tool("expand", self.a, handle=handle, budget=1000)
        self.assertEqual(expired["error"]["data"]["code"], "cgrx.handle_not_found")
        state = client.tool("status", self.a)["resource_control"]
        self.assertGreaterEqual(state["reclaimed_repos"], 1)
        self.assertEqual(records(client.tool("memory_recall", self.a, id=saved["id"]))[0]["version"], 1)
        updated = client.tool("memory_update", self.a, id=saved["id"], expected_version=1,
                              reason="after native idle", record={"fact": "Idle memory state is durable",
                              "confidence": 1000, "memory_kind": "semantic", "source_kind": "tool",
                              "source_ref": "resource-regression"})
        self.assertEqual(updated.get("record", updated)["version"], 2)
        time.sleep(.25)
        self.assertEqual(records(client.tool("memory_recall", self.a, id=saved["id"]))[0]["version"], 2)

    def test_lru_replacement_isolates_worktrees_and_recovers_sources(self):
        client = self.client("--max-repos", "1")
        saved = self.save(client, self.a)
        handle = self.orient(client, self.a)["next_handles"][0]
        self.assertIn("222", client.tool("get_code_snippet", self.b, symbol="Same")["source"])
        self.assertEqual(records(client.tool("memory_recall", self.b, id=saved["id"])), [])
        response = client.raw_tool("expand", self.a, handle=handle, budget=1000)
        self.assertEqual(response["error"]["data"]["code"], "cgrx.handle_not_found")
        self.assertIn("111", client.tool("get_code_snippet", self.a, symbol="Same")["source"])
        self.assertEqual(records(client.tool("memory_recall", self.a, id=saved["id"]))[0]["version"], 1)

    @unittest.skipUnless(os.name == "posix", "OS file leases")
    def test_admission_failure_has_no_write_and_recovers_after_unlock(self):
        import fcntl
        slots = self.fixture / "slots"
        slots.mkdir()
        locks = [(slots / f"active-{i}.lock").open("w+") for i in range(2)]
        try:
            for lock in locks:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            client = self.client("--resource-wait-seconds", "0.01")
            response = client.raw_tool("memory_record", self.a, fact="This must not be written", confidence=900,
                                       source_kind="tool", source_ref="resource-regression")
            self.assertEqual(response["error"]["data"]["code"], "cgrx.resource_busy")
            self.assertEqual(response["error"]["code"], -32020)
            self.assertFalse(response["error"]["data"]["request_started"])
            self.assertNotIn("result", response)
            self.assertNotIn("result", client.raw_tool("status", self.a))
            self.assertFalse((self.a / ".cgrx/memory").exists())
        finally:
            for lock in locks:
                lock.close()
        self.assertEqual(records(client.tool("memory_recall", self.a)), [])
        self.assertEqual(self.save(client, self.a)["version"], 1)

    @unittest.skipUnless(os.name == "posix", "OS file leases")
    def test_admission_fifo_preserves_ordered_memory_updates(self):
        import fcntl
        seed = self.client("--max-active-requests", "1")
        saved = self.save(seed, self.a)
        clients = [self.client("--max-active-requests", "1", "--resource-wait-seconds", "60") for _ in range(8)]
        lock = (self.fixture / "slots/active-0.lock").open("r+")
        fcntl.flock(lock, fcntl.LOCK_EX)
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            responses = []
            try:
                for index, client in enumerate(clients):
                    responses.append(pool.submit(client.tool, "memory_update", self.a, id=saved["id"],
                        expected_version=index+1, reason="FIFO regression", record={
                            "fact": f"Ordered update {index}", "confidence": 1000,
                            "source_kind": "tool", "source_ref": "resource-regression"}))
                    self.wait_for_queue(index+1)
            finally:
                lock.close()
            results = [response.result(timeout=75) for response in responses]
        self.assertEqual([r.get("record", r)["version"] for r in results], list(range(2, 10)))
        self.assertEqual(records(seed.tool("memory_recall", self.a, id=saved["id"]))[0]["version"], 9)
        self.assertEqual(list((self.fixture / "slots").glob("wait-*.lock")), [])

    @unittest.skipUnless(os.name == "posix", "OS file leases")
    def test_crashed_waiter_does_not_block_the_next_request(self):
        import fcntl
        slots = self.fixture / "slots"
        slots.mkdir()
        lock = (slots / "active-0.lock").open("w+")
        fcntl.flock(lock, fcntl.LOCK_EX)
        first = self.client("--max-active-requests", "1")
        second = self.client("--max-active-requests", "1")
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            try:
                lost = pool.submit(first.tool, "status", self.a)
                self.wait_for_queue(1)
                following = pool.submit(second.tool, "status", self.b)
                self.wait_for_queue(2)
                first.child.kill()  # Only this test's own waiting MCP process.
                first.child.wait(timeout=5)
                with self.assertRaises(AssertionError):
                    lost.result(timeout=5)
            finally:
                lock.close()
            self.assertIn("resource_control", following.result(timeout=10))
        self.assertEqual(list(slots.glob("wait-*.lock")), [])

    def test_continuations_bound_oldest_expire_latest_expands(self):
        client = self.client()
        handles = [self.orient(client, self.a, task=f"Same {i}")["next_handles"][0] for i in range(36)]
        response = client.raw_tool("expand", self.a, handle=handles[0], budget=1000)
        self.assertEqual(response["error"]["data"]["code"], "cgrx.handle_not_found")
        client.tool("expand", self.a, handle=handles[-1], budget=1000)
        response = client.raw_tool("expand", self.a, handle=handles[-1], budget=1000)
        self.assertEqual(response["error"]["data"]["code"], "cgrx.handle_not_found")

    @unittest.skipUnless(os.name == "posix", "OS file leases")
    def test_leases_are_released_when_holder_process_crashes(self):
        slots = self.fixture / "slots"
        slots.mkdir()
        script = ("import fcntl,sys,pathlib\n"
                  "files=[(pathlib.Path(sys.argv[1])/('active-%d.lock'%i)).open('w+') for i in range(2)]\n"
                  "for f in files: fcntl.flock(f,fcntl.LOCK_EX)\n"
                  "print('locked',flush=True)\nsys.stdin.read()\n")
        holder = subprocess.Popen([sys.executable, "-B", "-c", script, str(slots)],
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        try:
            self.assertEqual(holder.stdout.readline().strip(), "locked")
            client = self.client("--resource-wait-seconds", "0.01")
            self.assertEqual(client.raw_tool("status", self.a)["error"]["data"]["code"], "cgrx.resource_busy")
            holder.kill()  # This test's own isolated lease holder, never a user helper.
            holder.wait(timeout=10)
            self.assertIn("resource_control", client.tool("status", self.a))
        finally:
            if holder.poll() is None:
                holder.kill()
            holder.wait(timeout=10)
            holder.stdin.close()
            holder.stdout.close()

    def test_write_completes_at_input_eof_and_is_read_by_new_process(self):
        client = self.client()
        client.serial += 1
        client.child.stdin.write(json.dumps({"jsonrpc": "2.0", "id": client.serial,
            "method": "tools/call", "params": {"name": "memory_record", "arguments": {
                "repo": str(self.a), "fact": "Commit before closing the connection", "confidence": 1000,
                "source_kind": "tool", "source_ref": "resource-regression"}}}) + "\n")
        client.child.stdin.close()
        client.child.stdin = None
        saved = client.receive()["result"]["structuredContent"]
        saved = saved.get("record", saved)
        self.assertEqual(client.child.wait(timeout=30), 0)
        other = self.client()
        self.assertEqual(records(other.tool("memory_recall", self.a, id=saved["id"]))[0]["version"], 1)

    @unittest.skipUnless(os.name == "posix", "executable Git wrapper")
    def test_idle_never_interrupts_a_long_active_request(self):
        wrapper = self.fixture / "slow-git"
        wrapper.write_text('#!/bin/sh\nif [ ! -f "$RESOURCE_READY" ]; then\n'
            '  : > "$RESOURCE_READY"\n  sleep 0.6\nfi\nexec "$RESOURCE_GIT" "$@"\n')
        wrapper.chmod(0o700)
        client = self.client("--idle-seconds", "0.1", extra_env={"CGRX_GIT": str(wrapper),
             "RESOURCE_READY": str(self.fixture / "ready"), "RESOURCE_GIT": shutil.which("git")})
        started = time.monotonic()
        value = client.tool("status", self.a)
        self.assertGreaterEqual(time.monotonic() - started, .6)
        self.assertEqual(value["resource_control"]["retained_repos"], 1)
        self.assertEqual(value["resource_control"]["reclaimed_repos"], 0)

    def test_twenty_four_sessions_idle_wake_and_close(self):
        clients = [self.client("--idle-seconds", "0.2") for _ in range(24)]
        clients[0].tool("status", self.a)  # Publish the common immutable index before parallel opens.
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            values = list(pool.map(lambda c: c.tool("status", self.a), clients))
        self.assertTrue(all(v["resource_control"]["max_active_requests"] == 2 for v in values))
        time.sleep(.4)
        for client in clients:
            self.assertEqual(client.rpc("ping", {})["result"], {})
            state = client.tool("status", self.a)["resource_control"]
            self.assertGreaterEqual(state["reclaimed_repos"], 1)
            self.assertIn("111", client.tool("get_code_snippet", self.a, symbol="Same")["source"])

    def test_idle_starts_after_a_slow_reader_receives_the_response(self):
        (self.a / "main.rs").write_text("fn Same() -> u32 { /*" + "x"*1024*1024 + "*/ 111 }\n")
        client = self.client("--idle-seconds", "0.5")
        client.serial += 1
        client.child.stdin.write(json.dumps({"jsonrpc": "2.0", "id": client.serial,
            "method": "tools/call", "params": {"name": "get_code_snippet",
            "arguments": {"repo": str(self.a), "symbol": "Same"}}}) + "\n")
        client.child.stdin.flush()
        time.sleep(1.2)  # The response exceeds the pipe capacity.
        response = client.receive()
        self.assertNotIn("error", response)
        control = client.tool("status", self.a)["resource_control"]
        self.assertEqual(control["reclaimed_repos"], 0)

    @unittest.skipUnless(sys.platform in ("darwin", "linux"), "footprint accounting")
    def test_post_request_budget_reclaims_without_losing_committed_memory(self):
        client = self.client("--memory-budget-mib", "1")
        saved = self.save(client, self.a)
        control = client.tool("status", self.a)["resource_control"]
        self.assertEqual(control["retained_repos"], 0)
        self.assertGreater(control["reclaimed_repos"], 0)
        self.assertEqual(records(client.tool("memory_recall", self.a, id=saved["id"]))[0]["version"], 1)
        self.assertIn("111", client.tool("get_code_snippet", self.a, symbol="Same")["source"])
        handle = self.orient(client, self.a)["next_handles"][0]
        expired = client.raw_tool("expand", self.a, handle=handle, budget=1000)
        self.assertEqual(expired["error"]["data"]["code"], "cgrx.handle_not_found")

    def test_invalid_resource_options(self):
        for flag, value in [("--idle-seconds", "0"), ("--idle-seconds", "NaN"),
                            ("--memory-budget-mib", "0"), ("--max-active-requests", "0"),
                            ("--resource-wait-seconds", "-1")]:
            result = subprocess.run([str(BINARY), "serve", "--multi-repo", flag, value],
                                    input="", text=True, capture_output=True)
            self.assertEqual(result.returncode, 2, (flag, result))

    def test_duplicate_and_conflict_do_not_require_a_model(self):
        lexical = self.client()
        saved = self.save(lexical, self.a)
        # A fresh empty cache plus denied network makes accidental inference fail.
        cache = self.fixture / "no-model"
        semantic = self.client(semantic=True, extra_env={
            "CGRX_MEMORY_MODEL_CACHE": str(cache), "CGRX_NETWORK": "deny"})
        duplicate = self.save(semantic, self.a)
        self.assertEqual(duplicate["id"], saved["id"])
        self.assertEqual(duplicate["version"], 1)
        replacement = dict(fact="Keep the next checkpoint", confidence=1000,
                           memory_kind="semantic", source_kind="tool", source_ref="regression")
        conflict = semantic.raw_tool("memory_update", self.a, id=saved["id"],
                                     expected_version=2, reason="Stale caller", record=replacement)
        self.assertEqual(conflict["error"]["data"]["code"], "cgrx.memory_conflict")
        missing = semantic.raw_tool("memory_update", self.a, id="0" * 32,
                                    expected_version=1, reason="Missing record", record=replacement)
        self.assertEqual(missing["error"]["data"]["code"], "cgrx.memory_not_found")
        self.assertEqual(semantic.tool("status", self.a)["resource_control"]["model_releases"], 0)
        self.assertEqual(records(semantic.tool("memory_recall", self.a, id=saved["id"]))[0]["version"], 1)
        self.assertFalse(cache.exists())

    @unittest.skipUnless(os.environ.get("CGRX_RUN_SEMANTIC_RESOURCE_TEST") == "1", "requires cached real model")
    def test_semantic_model_reloads_and_persistent_versions_survive(self):
        offline = self.client()
        saved = self.save(offline, self.a, fact="Swift operators retain exact compiler identity")
        semantic = self.client("--idle-seconds", "0.2", semantic=True)
        for _ in range(2):
            found = records(semantic.tool("memory_recall", self.a, query="Swift оператор компилятор", budget=1600))
            self.assertTrue(any(r["id"] == saved["id"] and r["version"] == 1 for r in found))
            if os.name == "posix":
                self.assertEqual(self.inference_children(semantic), [])
            time.sleep(.4)
        control = semantic.tool("status", self.a)["resource_control"]
        self.assertGreaterEqual(control["model_releases"], 2)

    @unittest.skipUnless(os.name == "posix" and os.environ.get("CGRX_RUN_SEMANTIC_RESOURCE_TEST") == "1",
                         "requires cached real model and POSIX processes")
    def test_inference_child_crash_preserves_memory_and_next_call_recovers(self):
        import signal
        offline = self.client()
        saved = self.save(offline, self.a)
        semantic = self.client(semantic=True)
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            response = pool.submit(semantic.raw_tool, "memory_recall", self.a, query="resource lifecycle")
            deadline = time.monotonic() + 10
            children = []
            while not response.done() and time.monotonic() < deadline:
                children = self.inference_children(semantic)
                if children:
                    break
                time.sleep(.01)
            self.assertTrue(children, "the request must start its inference child")
            os.kill(children[0], signal.SIGKILL)  # Only this client's own read-only child.
            failed = response.result(timeout=10)
        self.assertTrue("error" in failed or failed.get("result", {}).get("isError"), failed)
        self.assertEqual(self.inference_children(semantic), [])
        current = records(semantic.tool("memory_recall", self.a, id=saved["id"]))
        self.assertEqual(current[0]["version"], 1)
        found = records(semantic.tool("memory_recall", self.a, query="resource lifecycle"))
        self.assertTrue(any(record["id"] == saved["id"] for record in found))
        self.assertEqual(self.inference_children(semantic), [])

    @unittest.skipUnless(os.name == "posix" and os.environ.get("CGRX_RUN_SEMANTIC_RESOURCE_TEST") == "1",
                         "requires cached real model and POSIX processes")
    def test_client_crash_does_not_orphan_its_inference_child(self):
        offline = self.client()
        self.save(offline, self.a)
        semantic = self.client(semantic=True)
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            response = pool.submit(semantic.raw_tool, "memory_recall", self.a, query="resource lifecycle")
            deadline = time.monotonic() + 10
            children = []
            while not response.done() and time.monotonic() < deadline:
                children = self.inference_children(semantic)
                if children:
                    break
                time.sleep(.01)
            self.assertTrue(children)
            semantic.child.kill()  # Only the test's own MCP parent.
            semantic.child.wait(timeout=5)
            with self.assertRaises(AssertionError):
                response.result(timeout=10)
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            state = subprocess.run(["ps", "-o", "state=", "-p", str(children[0])],
                                   text=True, capture_output=True).stdout.strip()
            if not state or state.startswith("Z"):
                break
            time.sleep(.05)
        self.assertTrue(not state or state.startswith("Z"), "inference child must exit after parent EOF")


if __name__ == "__main__":
    unittest.main()
