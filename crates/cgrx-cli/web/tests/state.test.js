import test from "node:test";
import assert from "node:assert/strict";

import { createState, projectGraph, reduce, serializeAgentPlan, summarizeBoundedResult } from "../state.js";

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

test("new snapshot invalidates strategies and older graph responses", () => {
  let state = reduce(createState(snapshot), { type: "strategy", strategyId: "strategy1.old" });
  state = reduce(state, { type: "request", generation: 4 });
  const nextSnapshot = { ...snapshot, graph_generation: 8 };
  state = reduce(state, { type: "status", snapshot: nextSnapshot });
  assert.equal(state.freshness, "stale");
  assert.equal(state.selectedStrategyId, null);

  const ignored = reduce(state, {
    type: "graph",
    snapshot,
    nodeIds: [42],
    generation: 3
  });
  assert.deepEqual(ignored, state);
});

test("projectGraph marks proposed edges without mutating current evidence", () => {
  const current = {
    nodes: [{ node_id: 1, symbol: "first", path: "a.ts", lane: "entrypoints" }],
    edges: [{ source: 1, target: 9, confidence: "PROVEN", status: "current" }]
  };
  const helper = { id: "virtual:helper", symbol: "shared", status: "hypothetical" };
  const second = { node_id: 2, symbol: "second", path: "a.ts" };
  const strategy = {
    strategy_id: "strategy1.preview",
    graph_delta: {
      preserve: [{ source: second, target: current.nodes[0], relation: "CALLS", confidence: "PROVEN" }],
      add: [{ source: current.nodes[0], target: helper, relation: "CALLS" }],
      redirect: [],
      move_to_helper: [],
      remove: []
    },
    verification: { review_symbols: [current.nodes[0], second] }
  };
  const projected = projectGraph(current, strategy);
  assert.equal(current.edges[0].status, "current");
  assert.equal(projected.edges[0].status, "preserved");
  assert.equal(projected.edges.filter((edge) => edge.status === "preserved").length, 2);
  assert.equal(projected.edges.at(-1).status, "hypothetical");
  assert.ok(projected.nodes.some((node) => node.id === "virtual:helper"));
});

test("agent copy is the exact canonical handoff object", () => {
  const handoff = { objective: "Extract helper", constraints: ["recheck snapshot"] };
  const serialized = serializeAgentPlan({ agent_handoff: handoff });
  assert.equal(serialized, JSON.stringify(handoff, null, 2));
  assert.deepEqual(JSON.parse(serialized), handoff);
});

test("bounded refactor results expose shown count and coverage limits", () => {
  assert.deepEqual(summarizeBoundedResult({
    total: 680,
    candidates: Array(8).fill({}),
    partial: true,
    coverage_gap_count: 2351
  }), {
    count: "8/680 · partial",
    note: "Bounded result · 2351 coverage gaps. Destructive paths stay blocked."
  });
  assert.deepEqual(summarizeBoundedResult({ total: 1, candidates: [{}], partial: false }), {
    count: "1",
    note: ""
  });
});

test("projectGraph marks removed symbols as future removals", () => {
  const duplicate = { node_id: 2, symbol: "second", path: "service.ts", lane: "entrypoints" };
  const projected = projectGraph({ nodes: [duplicate], edges: [] }, {
    strategy_id: "strategy1.consolidate",
    graph_delta: { preserve: [], add: [], redirect: [], move_to_helper: [], remove: [duplicate] },
    verification: { review_symbols: [duplicate] }
  });
  assert.equal(projected.nodes[0].status, "remove");
  assert.equal(projected.edges.length, 0);
});
