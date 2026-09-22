import test from "node:test";
import assert from "node:assert/strict";
import { projectCodeMap } from "../repository-map.js";
import { layoutRepositoryMap } from "../dense-layout.js";

const graph = { snapshot: {}, root: { path: "**" }, total_nodes: 4, total_edges: 3, truncated: false, nodes: [
  { node_id: "9007199254740992", symbol: "caller", path: "src/service.ts", span: { start: 1, end: 2 } },
  { node_id: "9007199254740993", symbol: "target", path: "src/service.ts" },
  { node_id: "3", symbol: "entry", path: "src/main.ts" },
  { node_id: "4", symbol: "isolated", path: "lib/lonely.ts" },
], edges: [
  { source: "9007199254740992", target: "9007199254740993", relation: "CALLS", evidence: { path: "src/service.ts" } },
  { source: "3", target: "9007199254740992", relation: "CALLS" },
  { source: "3", target: "9007199254740993", relation: "CALLS" },
] };

test("symbol overview retains intrafile relationships, isolates, u64 identity and proof", () => {
  const map = projectCodeMap(graph);
  assert.equal(map.nodes.length, 4);
  assert.equal(map.edges.length, 3);
  assert.notEqual(map.nodes[0].node_id, map.nodes[1].node_id);
  assert.equal(map.nodes.find(n => n.symbol === "isolated").degree, 0);
  assert.deepEqual(map.edges[0].evidence, graph.edges[0].evidence);
  assert.equal(map.nodes[0].representatives[0].symbol, "caller");
});

test("file overview keeps internal calls and aggregates boundaries without inventing edges", () => {
  const map = projectCodeMap(graph, "files");
  assert.equal(map.nodes.length, 3);
  assert.equal(map.edges.length, 2);
  assert.ok(map.edges.some(e => e.source === e.target && e.weight === 1));
  assert.ok(map.edges.some(e => e.source === "file:src/main.ts" && e.weight === 2));
  assert.equal(map.nodes.find(n => n.node_id === "file:src/service.ts").symbols, 2);
  assert.equal(projectCodeMap({ ...graph, truncated: true, total_nodes: 10 }).totals.symbols, 10);
  assert.equal(projectCodeMap({ ...graph, truncated: true }).truncated, true);
});

test("dense layout is deterministic, finite and does not mutate graph evidence", () => {
  const map = projectCodeMap(graph);
  const before = structuredClone(map);
  const first = layoutRepositoryMap(map);
  assert.deepEqual(first, layoutRepositoryMap(map));
  assert.deepEqual(map, before);
  assert.equal(first.nodes.length, 4);
  assert.ok(first.nodes.every(n => Number.isFinite(n.x) && Number.isFinite(n.y)));
  assert.equal(layoutRepositoryMap(projectCodeMap({ nodes: [], edges: [] })).nodes.length, 0);
});
