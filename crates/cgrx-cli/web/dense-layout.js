import { forceSimulation, forceManyBody, forceLink, forceX, forceY, forceCollide } from "d3-force";
import { layoutProjectMap } from "./layout.js";

// Barnes-Hut avoids the package layout's quadratic all-pairs loop for code maps.
export function layoutRepositoryMap(graph, viewport = {}) {
  if (!graph.level) return layoutProjectMap(graph, viewport);
  const width = viewport.width || 1400, height = viewport.height || 1000;
  const palette = ["#58d6c7", "#7aa7ff", "#b999ff", "#f0a36b", "#e27fa8", "#80d68a", "#73c7ff", "#d9bd6d"];
  const groups = new Map(graph.communities.map((g, i) => [g.id, i]));
  const spread = Math.max(200, Math.sqrt(graph.nodes.length) * 24);
  const centers = new Map(graph.communities.map((g, i) => {
    const angle = i * 2.3999632297, radius = spread * Math.sqrt((i + .5) / groups.size);
    return [g.id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }];
  }));
  const nodes = graph.nodes.map((node, i) => {
    const center = centers.get(node.community);
    const angle = i * 2.3999632297;
    return { ...node, x: center.x + Math.cos(angle) * Math.sqrt(i + 1) * 8, y: center.y + Math.sin(angle) * Math.sqrt(i + 1) * 8,
      radius: Math.min(12, 3 + Math.log2(node.degree + 1)), color: palette[groups.get(node.community) % palette.length], pinned: false, showLabel: node.degree > 3 };
  });
  const ids = new Set(nodes.map(n => String(n.node_id)));
  const links = graph.edges.filter(e => ids.has(String(e.source)) && ids.has(String(e.target)) && e.source !== e.target).map(e => ({ source: String(e.source), target: String(e.target) }));
  const simulation = forceSimulation(nodes).stop()
    .force("charge", forceManyBody().strength(-35).theta(1))
    .force("links", forceLink(links).id(n => String(n.node_id)).distance(32).strength(.15))
    .force("collision", forceCollide(n => n.radius + 2).iterations(1))
    .force("x", forceX(n => centers.get(n.community).x).strength(.025))
    .force("y", forceY(n => centers.get(n.community).y).strength(.025));
  simulation.tick(90);
  if (nodes.length) {
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const scale = Math.min((width - 100) / Math.max(1, maxX - minX), (height - 100) / Math.max(1, maxY - minY));
    for (const n of nodes) {
      n.x = width / 2 + (n.x - (minX + maxX) / 2) * scale;
      n.y = height / 2 + (n.y - (minY + maxY) / 2) * scale;
    }
  }
  const communities = graph.communities.map(g => {
    const members = nodes.filter(n => n.community === g.id);
    const x = members.reduce((s, n) => s + n.x, 0) / Math.max(1, members.length);
    const y = members.reduce((s, n) => s + n.y, 0) / Math.max(1, members.length);
    return { ...g, x, y, radius: Math.max(35, ...members.map(n => Math.hypot(n.x - x, n.y - y) + 18)) };
  });
  const major = new Set([...nodes].sort((a, b) => b.degree - a.degree).slice(0, 60).map(n => n.node_id));
  for (const node of nodes) node.showLabel = major.has(node.node_id);
  return { width, height, nodes, communities };
}
