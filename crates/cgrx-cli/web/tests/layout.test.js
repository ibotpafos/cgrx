import test from "node:test";
import assert from "node:assert/strict";

import { edgeStyle, layoutGraph, layoutProjectMap } from "../layout.js";

const graph = {
  nodes: [
    { node_id: 3, symbol: "target", path: "service.ts", lane: "callees", span: { start: 1 } },
    { node_id: 1, symbol: "caller", path: "service.ts", lane: "callers", span: { start: 9 } },
    { node_id: 4, symbol: "scenario", path: "service.test.ts", lane: "tests", span: { start: 2 } },
    { node_id: 2, symbol: "selected", path: "service.ts", lane: "entrypoints", span: { start: 5 } }
  ],
  edges: []
};

test("layoutGraph assigns stable semantic lanes and file containers", () => {
  const first = layoutGraph(graph, { width: 980, height: 620 });
  const second = layoutGraph({ ...graph, nodes: [...graph.nodes].reverse() }, { width: 980, height: 620 });
  assert.deepEqual(first, second);
  assert.deepEqual(
    first.nodes.map(({ node_id, lane, x }) => ({ node_id, lane, x })),
    [
      { node_id: 1, lane: "callers", x: 96 },
      { node_id: 2, lane: "entrypoints", x: 382 },
      { node_id: 3, lane: "callees", x: 668 },
      { node_id: 4, lane: "tests", x: 382 }
    ]
  );
  assert.equal(first.containers.length, 2);
  assert.ok(first.width >= 820);
  assert.ok(first.height >= 480);
});

test("edgeStyle keeps certainty readable without color", () => {
  assert.deepEqual(edgeStyle({ confidence: "PROVEN", status: "current" }), {
    className: "edge edge--proven",
    marker: "✓",
    dash: ""
  });
  assert.equal(edgeStyle({ status: "gap" }).marker, "?");
  assert.equal(edgeStyle({ status: "hypothetical" }).marker, "+");
  assert.equal(edgeStyle({ status: "preserved" }).className, "edge edge--preserved");
  assert.equal(edgeStyle({ status: "remove" }).marker, "×");
});

test("layoutGraph preserves explicit node pins until reset", () => {
  const pinned = layoutGraph(graph, {
    width: 980,
    height: 620,
    pins: { "2": { x: 510, y: 92 } }
  });
  const selected = pinned.nodes.find((node) => node.node_id === 2);
  assert.deepEqual({ x: selected.x, y: selected.y, pinned: selected.pinned }, {
    x: 510,
    y: 92,
    pinned: true
  });
});

test("layoutProjectMap produces a deterministic clustered star field", () => {
  const project = {
    communities: [
      { id: "community:0", label: "clients", packages: ["clients/web", "clients/mobile"] },
      { id: "community:1", label: "services", packages: ["services/api"] }
    ],
    nodes: [
      { node_id: "package:clients/web", symbol: "clients/web", community: "community:0", degree: 12 },
      { node_id: "package:clients/mobile", symbol: "clients/mobile", community: "community:0", degree: 4 },
      { node_id: "package:services/api", symbol: "services/api", community: "community:1", degree: 20 }
    ]
  };
  const first = layoutProjectMap(project, { width: 1200, height: 760 });
  const second = layoutProjectMap({ ...project, nodes: [...project.nodes].reverse() }, { width: 1200, height: 760 });
  assert.deepEqual(first, second);
  assert.equal(first.communities.length, 2);
  assert.equal(first.nodes.length, 3);
  assert.ok(first.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y) && node.radius >= 6));
  assert.ok(first.nodes.some((node) => node.showLabel));
});
