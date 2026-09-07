import test from "node:test";
import assert from "node:assert/strict";

import { architectureAgentHandoff, createState, projectArchitecture, projectArchitectureFuture, projectChangeMissions, projectGraph, reduce, serializeAgentPlan, serializeChangeMissionHandoff, summarizeBoundedResult } from "../state.js";

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

test("state exposes code and Git history modes", () => {
  for (const mode of ["current", "architecture", "changes", "preview", "compare", "history"]) {
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

test("architecture projection turns proven package boundaries into graph evidence", () => {
  const graph = projectArchitecture({
    snapshot,
    packages: [
      { name: "api", files: 2, symbols: 4, fan_in: 1, fan_out: 2 },
      { name: "core", files: 1, symbols: 3, fan_in: 2, fan_out: 1 }
    ],
    boundaries: [{
      source: "api", target: "core", edges: 2, relations: ["CALLS"],
      confidence: "PROVEN", evidence: [{ path: "api/handler.ts", span: { start: 10, end: 20 } }]
    }],
    cycles: [{ packages: ["api", "core"], kind: "PACKAGE_CALL_CYCLE" }],
    partial: false
  });
  assert.deepEqual(graph.nodes.map((node) => node.node_id), ["package:api", "package:core"]);
  assert.equal(graph.edges[0].source, "package:api");
  assert.equal(graph.edges[0].target, "package:core");
  assert.equal(graph.edges[0].confidence, "PROVEN");
  assert.equal(graph.nodes[0].cycle, true);
  assert.equal(graph.root.symbol, "Architecture");
});

test("architecture cycle futures project inversion and contract extraction", () => {
  const current = projectArchitecture({
    snapshot,
    packages: [
      { name: "api", files: 1, symbols: 2, fan_in: 1, fan_out: 1 },
      { name: "core", files: 1, symbols: 2, fan_in: 1, fan_out: 1 }
    ],
    boundaries: [
      { source: "api", target: "core", edges: 2, relations: ["CALLS"], confidence: "PROVEN" },
      { source: "core", target: "api", edges: 1, relations: ["IMPORTS"], confidence: "PROVEN" }
    ],
    cycles: [{ packages: ["api", "core"] }]
  });
  const issue = {
    issue_id: "architecture-issue1.cycle",
    kind: "PACKAGE_DEPENDENCY_CYCLE",
    selected_boundary: { source: "api", target: "core" }
  };
  const inverted = projectArchitectureFuture(current, issue, {
    strategy_id: "architecture-strategy1.invert",
    policy: "invert_dependency"
  });
  assert.equal(inverted.edges.some((edge) => edge.source === "package:api" && edge.target === "package:core"), false);
  assert.equal(inverted.edges.filter((edge) => edge.source === "package:core" && edge.target === "package:api").length, 2);
  assert.equal(inverted.edges.at(-1).status, "hypothetical");

  const extracted = projectArchitectureFuture(current, issue, {
    strategy_id: "architecture-strategy1.contract",
    policy: "extract_contract"
  });
  assert.ok(extracted.nodes.some((node) => node.kind === "contract" && node.status === "hypothetical"));
  assert.equal(extracted.edges.filter((edge) => edge.status === "hypothetical").length, 2);
});

test("architecture hotspot futures expose facade and community split nodes", () => {
  const current = projectArchitecture({ snapshot, packages: [], boundaries: [], cycles: [] });
  const issue = {
    issue_id: "architecture-issue1.hot",
    kind: "HIGH_FAN_IN_HOTSPOT",
    symbol: { symbol: "save", path: "core/store.ts", fan_in: 12 }
  };
  const facade = projectArchitectureFuture(current, issue, {
    strategy_id: "architecture-strategy1.facade",
    policy: "introduce_facade"
  });
  assert.ok(facade.nodes.some((node) => node.kind === "hotspot" && node.symbol === "save"));
  assert.ok(facade.nodes.some((node) => node.kind === "facade"));
  assert.equal(facade.edges.at(-1).status, "hypothetical");

  const split = projectArchitectureFuture(current, issue, {
    strategy_id: "architecture-strategy1.split",
    policy: "split_by_community"
  });
  assert.equal(split.nodes.filter((node) => node.kind === "community-split").length, 2);
});

test("architecture alternatives produce exact model-free agent handoffs", () => {
  const issue = {
    kind: "PACKAGE_DEPENDENCY_CYCLE",
    packages: ["api", "core"],
    selected_boundary: { source: "api", target: "core" },
    agent_handoff: {
      schema_version: "cgrx.agent.architecture-future.v1",
      snapshot,
      verification: ["backend verification"]
    }
  };
  const strategy = {
    strategy_id: "architecture-strategy1.contract",
    policy: "extract_contract",
    predicted_graph: { cycles_removed: 1, packages_added: 1 }
  };
  const handoff = architectureAgentHandoff(snapshot, issue, strategy);
  assert.equal(handoff.strategy_id, strategy.strategy_id);
  assert.deepEqual(handoff.predicted_graph, strategy.predicted_graph);
  assert.equal(handoff.llm_used, false);
  assert.equal(handoff.constraints.llm_used, false);
  assert.equal(handoff.constraints.revalidate_snapshot_before_edit, true);
  assert.deepEqual(handoff.verification, ["backend verification"]);
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

test("change missions preserve execution groups, dependencies, blockers and exact handoff", () => {
  const handoff = { schema_version: "cgrx.agent.change-missions.v1", llm_used: false, missions: [{ mission_id: "m1" }] };
  const projection = projectChangeMissions({ change_plan: {
    snapshot,
    missions: [
      { mission_id: "m1", kind: "review_changed_path", parallel_group: 0, change_paths: ["a.ts"], review_paths: ["a.ts"], finding_indexes: [], impact_indexes: [], related_test_indexes: [0], depends_on: [], blocked_by_gaps: false },
      { mission_id: "m2", kind: "changed_dependency", parallel_group: 1, change_paths: ["b.ts"], review_paths: ["a.ts"], finding_indexes: [], impact_indexes: [0], related_test_indexes: [], depends_on: ["m1"], blocked_by_gaps: true }
    ],
    execution_order: [["m1"], ["m2"]],
    totals: { missions: 2, parallel_groups: 2, blocked: 1 },
    partial: true,
    agent_handoff: handoff
  }});
  assert.deepEqual(projection.groups.map((group) => group.missions.map((mission) => mission.mission_id)), [["m1"], ["m2"]]);
  assert.deepEqual(projection.dependencies, [{ source: "m1", target: "m2" }]);
  assert.equal(projection.missions[0].testCount, 1);
  assert.equal(projection.missions[1].evidenceCount, 1);
  assert.equal(projection.missions[1].blocked_by_gaps, true);
  assert.deepEqual(JSON.parse(serializeChangeMissionHandoff(projection)), handoff);
});
