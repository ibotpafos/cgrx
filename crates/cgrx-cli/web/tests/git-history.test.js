import assert from "node:assert/strict";
import test from "node:test";

import { pageForGitGraph } from "../git-history.ts";

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
