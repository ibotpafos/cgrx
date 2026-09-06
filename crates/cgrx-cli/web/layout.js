const LANE_ORDER = ["callers", "entrypoints", "callees", "tests"];
const LANE_X = {
  callers: 96,
  entrypoints: 382,
  callees: 668,
  tests: 382
};

export function layoutGraph(graph, viewport = {}) {
  const width = Math.max(820, Number(viewport.width) || 980);
  const height = Math.max(480, Number(viewport.height) || 620);
  const counts = new Map();
  const nodes = [...(graph.nodes || [])]
    .sort((left, right) => {
      return laneRank(left.lane) - laneRank(right.lane)
        || String(left.path).localeCompare(String(right.path))
        || Number(left.span?.start || 0) - Number(right.span?.start || 0)
        || Number(left.node_id) - Number(right.node_id);
    })
    .map((node) => {
      const lane = LANE_ORDER.includes(node.lane) ? node.lane : "entrypoints";
      const laneIndex = counts.get(lane) || 0;
      counts.set(lane, laneIndex + 1);
      const y = lane === "tests" ? 448 + laneIndex * 92 : 152 + laneIndex * 92;
      return {
        ...node,
        lane,
        x: LANE_X[lane],
        y,
        width: 216,
        height: 64
      };
    });
  const containers = containerBounds(nodes);
  return { width, height: Math.max(height, contentHeight(nodes)), nodes, containers };
}

export function edgeStyle(edge) {
  if (edge.status === "remove") {
    return { className: "edge edge--remove", marker: "×", dash: "6 6" };
  }
  if (edge.status === "hypothetical") {
    return { className: "edge edge--hypothetical", marker: "+", dash: "3 7" };
  }
  if (edge.status === "gap" || edge.confidence === "UNKNOWN") {
    return { className: "edge edge--gap", marker: "?", dash: "9 7" };
  }
  if (edge.status === "preserved") {
    return { className: "edge edge--preserved", marker: "=", dash: "" };
  }
  return { className: "edge edge--proven", marker: "✓", dash: "" };
}

function laneRank(lane) {
  const index = LANE_ORDER.indexOf(lane);
  return index === -1 ? LANE_ORDER.length : index;
}

function containerBounds(nodes) {
  const groups = new Map();
  for (const node of nodes) {
    const points = groups.get(node.path) || [];
    points.push(node);
    groups.set(node.path, points);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, points]) => {
      const minX = Math.min(...points.map((node) => node.x));
      const maxX = Math.max(...points.map((node) => node.x + node.width));
      const minY = Math.min(...points.map((node) => node.y));
      const maxY = Math.max(...points.map((node) => node.y + node.height));
      return {
        id: `file:${path}`,
        path,
        x: minX - 18,
        y: minY - 32,
        width: maxX - minX + 36,
        height: maxY - minY + 50
      };
    });
}

function contentHeight(nodes) {
  return Math.max(480, ...nodes.map((node) => node.y + node.height + 48));
}
