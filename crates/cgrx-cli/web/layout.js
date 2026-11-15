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
        || identity(left).localeCompare(identity(right));
    })
    .map((node) => {
      const lane = LANE_ORDER.includes(node.lane) ? node.lane : "entrypoints";
      const laneIndex = counts.get(lane) || 0;
      counts.set(lane, laneIndex + 1);
      const y = lane === "tests" ? 448 + laneIndex * 92 : 152 + laneIndex * 92;
      const pin = viewport.pins?.[identity(node)];
      return {
        ...node,
        lane,
        x: pin?.x ?? LANE_X[lane],
        y: pin?.y ?? y,
        pinned: Boolean(pin),
        width: 216,
        height: 64
      };
    });
  const containers = containerBounds(nodes);
  return { width, height: Math.max(height, contentHeight(nodes)), nodes, containers };
}

export function layoutProjectMap(graph, viewport = {}) {
  const width = Math.max(980, Number(viewport.width) || 1180);
  const height = Math.max(620, Number(viewport.height) || 760);
  const sourceNodes = [...(graph.nodes || [])].sort((left, right) =>
    String(left.community).localeCompare(String(right.community))
      || Number(right.degree || 0) - Number(left.degree || 0)
      || identity(left).localeCompare(identity(right))
  );
  const communityRows = [...(graph.communities || [])]
    .map((community) => ({
      ...community,
      members: sourceNodes.filter((node) => node.community === community.id)
    }))
    .filter((community) => community.members.length)
    .sort((left, right) => right.members.length - left.members.length || left.id.localeCompare(right.id));
  const centerX = width / 2;
  const centerY = height / 2;
  const maxCenterRadius = Math.max(112, Math.min(width, height) * .34);
  const centers = new Map();
  communityRows.forEach((community, index) => {
    if (communityRows.length === 1) {
      centers.set(community.id, { x: centerX, y: centerY });
      return;
    }
    const progress = Math.sqrt((index + .7) / Math.max(1, communityRows.length));
    const angle = index * 2.399963229728653 - Math.PI / 2;
    centers.set(community.id, {
      x: centerX + Math.cos(angle) * maxCenterRadius * progress,
      y: centerY + Math.sin(angle) * maxCenterRadius * progress
    });
  });

  const nodes = [];
  const palette = ["#58d6c7", "#7aa7ff", "#b999ff", "#f0a36b", "#e27fa8", "#80d68a", "#73c7ff", "#d9bd6d"];
  for (const community of communityRows) {
    const center = centers.get(community.id);
    const members = community.members;
    members.forEach((node, index) => {
      const radius = Math.max(5, Math.min(17, 5 + Math.log2(Number(node.degree || 0) + 1) * 1.9));
      const pin = viewport.pins?.[identity(node)];
      const angle = seededAngle(identity(node));
      const distance = members.length === 1 ? 0 : 30 + Math.sqrt(index + 1) * 34;
      nodes.push({
        ...node,
        x: pin?.x ?? center.x + Math.cos(angle) * distance,
        y: pin?.y ?? center.y + Math.sin(angle) * distance,
        vx: 0,
        vy: 0,
        radius,
        color: palette[Math.max(0, communityRows.findIndex((row) => row.id === community.id)) % palette.length],
        pinned: Boolean(pin)
      });
    });
  }

  settleProjectMap(nodes, graph.edges || [], centers, width, height, viewport.pins || {});
  const communityLayouts = communityRows.map((community) => {
    const members = nodes.filter((node) => node.community === community.id);
    const x = members.reduce((sum, node) => sum + node.x, 0) / Math.max(1, members.length);
    const y = members.reduce((sum, node) => sum + node.y, 0) / Math.max(1, members.length);
    const radius = Math.max(46, ...members.map((node) => Math.hypot(node.x - x, node.y - y) + node.radius + 34));
    return { ...community, x, y, radius };
  });
  const ranked = [...nodes].sort((left, right) => Number(right.degree || 0) - Number(left.degree || 0));
  const labelLimit = Math.min(36, Math.max(16, Math.floor(width / 52)), ranked.length);
  const labelIds = new Set(ranked.slice(0, labelLimit).map(identity));
  return {
    width,
    height,
    communities: communityLayouts,
    nodes: nodes.map(({ vx, vy, ...node }) => ({ ...node, showLabel: labelIds.has(identity(node)) }))
  };
}

function settleProjectMap(nodes, edges, centers, width, height, pins) {
  if (nodes.length < 2) return;
  const byId = new Map(nodes.map((node, index) => [identity(node), index]));
  const links = edges.map((edge) => ({
    source: byId.get(String(edge.source)),
    target: byId.get(String(edge.target)),
    weight: Math.max(1, Number(edge.weight || 1))
  })).filter((edge) => edge.source !== undefined && edge.target !== undefined && edge.source !== edge.target);
  const margin = 32;
  for (let iteration = 0; iteration < 180; iteration += 1) {
    const alpha = 1 - iteration / 180;
    for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
      const left = nodes[leftIndex];
      for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
        const right = nodes[rightIndex];
        let dx = right.x - left.x;
        let dy = right.y - left.y;
        let distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < .01) {
          const angle = seededAngle(`${identity(left)}:${identity(right)}`);
          dx = Math.cos(angle) * .1;
          dy = Math.sin(angle) * .1;
          distanceSquared = .01;
        }
        const distance = Math.sqrt(distanceSquared);
        const repulsion = (left.community === right.community ? 980 : 1420) * alpha / distanceSquared;
        const rx = dx / distance * repulsion;
        const ry = dy / distance * repulsion;
        left.vx -= rx;
        left.vy -= ry;
        right.vx += rx;
        right.vy += ry;

        const minimum = left.radius + right.radius + 10;
        if (distance < minimum) {
          const overlap = (minimum - distance) * .08 * alpha;
          const ox = dx / distance * overlap;
          const oy = dy / distance * overlap;
          left.vx -= ox;
          left.vy -= oy;
          right.vx += ox;
          right.vy += oy;
        }
      }
    }

    for (const link of links) {
      const source = nodes[link.source];
      const target = nodes[link.target];
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const preferred = source.community === target.community ? 92 : 164;
      const strength = Math.min(.09, .018 + Math.log2(link.weight + 1) * .009) * alpha;
      const pull = (distance - preferred) * strength;
      const px = dx / distance * pull;
      const py = dy / distance * pull;
      source.vx += px;
      source.vy += py;
      target.vx -= px;
      target.vy -= py;
    }

    for (const node of nodes) {
      const pin = pins[identity(node)];
      if (pin) {
        node.x = pin.x;
        node.y = pin.y;
        node.vx = 0;
        node.vy = 0;
        continue;
      }
      const center = centers.get(node.community) || { x: width / 2, y: height / 2 };
      node.vx += (center.x - node.x) * .0048 * alpha;
      node.vy += (center.y - node.y) * .0048 * alpha;
      node.vx += (width / 2 - node.x) * .00055 * alpha;
      node.vy += (height / 2 - node.y) * .00055 * alpha;
      node.vx *= .78;
      node.vy *= .78;
      node.x = Math.max(margin, Math.min(width - margin, node.x + node.vx));
      node.y = Math.max(margin, Math.min(height - margin, node.y + node.vy));
    }
  }
}

function seededAngle(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) / 4294967296) * Math.PI * 2;
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

function identity(node) {
  return String(node.node_id ?? node.id ?? "");
}
