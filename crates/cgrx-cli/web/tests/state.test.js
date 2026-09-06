import test from "node:test";
import assert from "node:assert/strict";

import { createState, reduce } from "../state.js";

const snapshot = {
  repo_revision: "a".repeat(40),
  working_tree_digest: "b".repeat(64),
  graph_generation: 7
};

test("state keeps selection and camera for the same graph identity", () => {
  let state = createState(snapshot);
  state = reduce(state, { type: "select", nodeId: 42 });
  state = reduce(state, { type: "camera", camera: { x: 10, y: 20, scale: 1.4 } });
  state = reduce(state, { type: "graph", snapshot, nodeIds: [42, 51], generation: 2 });
  assert.equal(state.selectedNodeId, 42);
  assert.deepEqual(state.camera, { x: 10, y: 20, scale: 1.4 });
  assert.equal(state.requestGeneration, 2);
});

test("state exposes current changes preview and compare modes", () => {
  for (const mode of ["current", "changes", "preview", "compare"]) {
    assert.equal(reduce(createState(snapshot), { type: "mode", mode }).mode, mode);
  }
  assert.throws(() => reduce(createState(snapshot), { type: "mode", mode: "unknown" }));
});
