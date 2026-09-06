import assert from "node:assert/strict";
import test from "node:test";

import { CgrxGitGraphProvider, pageForGitGraph } from "../git-history.ts";

test("adapts bounded history without dropping graph protocol fields", () => {
  const commit = { oid: "a".repeat(40), parents: [], message: "initial", kind: "commit" };
  const ref = { name: "main", target: commit.oid, kind: "head" };
  const page = pageForGitGraph({
    commits: [commit], refs: [ref], head: commit.oid, hasMore: true,
    repositoryId: "/repo", repositoryName: "repo", snapshot: { repo_revision: commit.oid }
  });

  assert.deepEqual(page.commits, [commit]);
  assert.deepEqual(page.refs, [ref]);
  assert.equal(page.head, commit.oid);
  assert.equal(page.hasMore, true);
  assert.equal("snapshot" in page, false);
});

test("provider keeps history paging and ref filters bounded", async () => {
  const calls = [];
  const provider = new CgrxGitGraphProvider(async (path) => {
    calls.push(path);
    return { commits: [], refs: [], hasMore: false, snapshot: {} };
  });

  await provider.getHistory({ limit: 500, cursor: "200", refs: ["main", "release/1"] });

  const query = new URL(calls[0], "http://cgrx.local").searchParams;
  assert.equal(query.get("limit"), "200");
  assert.equal(query.get("cursor"), "200");
  assert.deepEqual(query.getAll("ref"), ["main", "release/1"]);
});

test("provider maps details and file diff to read-only API routes", async () => {
  const calls = [];
  const provider = new CgrxGitGraphProvider(async (path) => {
    calls.push(path);
    if (path.startsWith("/api/git-commit")) return { commit: {}, refs: [], changes: [] };
    return { base: {}, head: {}, path: "src/a b.ts", patch: "" };
  });
  const base = { kind: "commit", oid: "a".repeat(40) };
  const head = { kind: "commit", oid: "b".repeat(40) };

  await provider.getCommitDetails(undefined, head);
  await provider.getFileDiff(undefined, base, head, "src/a b.ts", 5);

  assert.match(calls[0], /^\/api\/git-commit\?oid=b{40}$/);
  const diff = new URL(calls[1], "http://cgrx.local").searchParams;
  assert.equal(diff.get("path"), "src/a b.ts");
  assert.equal(diff.get("context"), "5");
});
