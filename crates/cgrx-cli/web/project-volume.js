// Presentation-only embedding: retain the force layout's XY neighborhoods and
// give each community real thickness. Depth is NOT dependency confidence/rank.
// Hash strings, never Number(id): graph IDs can span the full u64 range.
function unitHash(value) {
  let hash = 2166136261;
  for (const c of String(value)) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  hash ^= hash >>> 16; hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13; hash = Math.imul(hash, 0xc2b2ae35);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

export function buildProjectVolume(layout) {
  const groups = new Map();
  for (const node of layout.nodes) {
    let group = groups.get(node.community);
    if (!group) { group = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity, color: node.color }; groups.set(node.community, group); }
    group.minX = Math.min(group.minX, node.x); group.maxX = Math.max(group.maxX, node.x);
    group.minY = Math.min(group.minY, node.y); group.maxY = Math.max(group.maxY, node.y);
  }
  const zones = new Map();
  for (const [id, group] of groups) {
    const rx = Math.max(24, (group.maxX - group.minX) / 2);
    const ry = Math.max(24, (group.maxY - group.minY) / 2);
    const depth = Math.max(48, Math.sqrt(rx * ry));
    zones.set(id, { id, color: group.color,
      center: [(group.minX + group.maxX - layout.width) / 2, (layout.height - group.minY - group.maxY) / 2,
        (unitHash(id) * 2 - 1) * Math.min(240, Math.max(layout.width, layout.height) * .2)],
      radii: [rx + 16, ry + 16, depth + 16], depth, scale: 1 });
  }
  const positions = new Float64Array(layout.nodes.length * 3);
  layout.nodes.forEach((node, i) => {
    const zone = zones.get(node.community);
    const x = node.x - layout.width / 2, y = layout.height / 2 - node.y;
    const nx = (x - zone.center[0]) / zone.radii[0], ny = (y - zone.center[1]) / zone.radii[1];
    const dz = (unitHash(node.node_id) * 2 - 1) * zone.depth * Math.sqrt(Math.max(.2, 1 - (nx * nx + ny * ny) / 2));
    positions.set([x, y, zone.center[2] + dz], i * 3);
    // Enclose actual members, including the corners of a non-elliptical group.
    zone.scale = Math.max(zone.scale, Math.hypot(nx, ny, dz / zone.radii[2]) + node.radius / Math.min(...zone.radii));
  });
  return { positions, zones: [...zones.values()].map(zone => ({ ...zone, radii: zone.radii.map(r => r * zone.scale) })) };
}

export function fitVolumeDistance(radius, verticalFovDegrees, aspect) {
  const vertical = verticalFovDegrees * Math.PI / 360;
  const horizontal = Math.atan(Math.tan(vertical) * Math.max(.01, aspect));
  return Math.max(30, radius * 1.08 / Math.sin(Math.min(vertical, horizontal)));
}
