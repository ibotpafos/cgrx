// Adapted from miuuyy/Clew, 85b7af12c992593568f6564ad322c9e3d258a919.
// Copyright (c) 2026 Aleksandr Vechenkov. MIT: licenses/clew-MIT.txt.
// Pure geometry; CGRX retains its own graph and evidence contracts.
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function buildZoneContour(points, intensity) {
  if (points.length === 0) return [];
  const contourPoints =
    points.length === 1
      ? expandSinglePointContourSeed(points[0], intensity)
      : points;

  const center = contourPoints.reduce(
    (acc, point) => ({ x: acc.x + point.x / contourPoints.length, y: acc.y + point.y / contourPoints.length }),
    { x: 0, y: 0 },
  );
  const basePadding = 42 + intensity * 10;

  if (contourPoints.length === 2) {
    const [first, second] = contourPoints;
    const dx = second.x - first.x;
    const dy = second.y - first.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / distance;
    const uy = dy / distance;
    const px = -uy;
    const py = ux;
    const sidePadding = 44 + intensity * 10;
    const capPadding = 32 + intensity * 8;
    return [
      { x: first.x - ux * capPadding + px * sidePadding, y: first.y - uy * capPadding + py * sidePadding },
      { x: first.x - ux * capPadding - px * sidePadding, y: first.y - uy * capPadding - py * sidePadding },
      { x: second.x + ux * capPadding - px * sidePadding, y: second.y + uy * capPadding - py * sidePadding },
      { x: second.x + ux * capPadding + px * sidePadding, y: second.y + uy * capPadding + py * sidePadding },
    ];
  }

  const expanded = contourPoints
    .map((point) => {
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const nx = dx / distance;
      const ny = dy / distance;
      const padding = basePadding + clamp(distance * 0.18, 10, 28);
      return {
        x: point.x + nx * padding,
        y: point.y + ny * padding,
        angle: Math.atan2(dy, dx),
      };
    })
    .sort((a, b) => a.angle - b.angle)
    .map(({ x, y }) => ({ x, y }));

  return convexHull(expanded);
}

function expandSinglePointContourSeed(point, intensity) {
  const radiusX = 34 + intensity * 6;
  const radiusY = 28 + intensity * 5;
  return Array.from({ length: 6 }, (_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 6;
    return {
      ...point,
      x: point.x + Math.cos(angle) * radiusX,
      y: point.y + Math.sin(angle) * radiusY,
    };
  });
}

function convexHull(points) {
  if (points.length <= 3) return points;
  const sorted = [...points].sort((left, right) => {
    if (left.x !== right.x) return left.x - right.x;
    return left.y - right.y;
  });

  const cross = (
    origin,
    a,
    b,
  ) => {
    return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
  };

  const lower = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper = [];
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}


// Cursor anchored zoom, adapted from Clew graphCanvasInteractions.ts to an SVG camera.
export function zoomAt(camera, point, factor) {
  const scale = clamp(camera.scale * factor, 0.25, 4);
  return { scale, x: point.x - (point.x - camera.x) * scale / camera.scale,
    y: point.y - (point.y - camera.y) * scale / camera.scale };
}

export function intersectsAny(box, others) {
  return others.some(other => !(box.right < other.left || box.left > other.right || box.bottom < other.top || box.top > other.bottom));
}

// Clew's six candidate placements, adapted to return the node identity and
// screen-space text coordinates. Priority nodes claim space before context.
export function placeLabels(nodes, camera, width, height, focusIds = new Set()) {
  const occupied = [];
  const result = [];
  const candidatesForLabels = focusIds.size ? nodes.filter(node => focusIds.has(String(node.node_id))) : nodes;
  const sorted = [...candidatesForLabels].sort((a, b) => Number(focusIds.has(String(b.node_id))) - Number(focusIds.has(String(a.node_id))) || b.degree - a.degree || String(a.node_id).localeCompare(String(b.node_id)));
  for (const node of sorted) {
    if (result.length >= (focusIds.size ? 120 : 60)) break;
    if (focusIds.size && !focusIds.has(String(node.node_id))) continue;
    const x = node.x * camera.scale + camera.x;
    const y = node.y * camera.scale + camera.y;
    const text = node.symbol.length > 35 ? `${node.symbol.slice(0, 32)}…` : node.symbol;
    const w = text.length * 7 + 12;
    const gap = node.radius * camera.scale * 0.45 + 9;
    const candidates = [
      { x: x + gap, y: y - 8 }, { x: x - gap - w, y: y - 8 },
      { x: x - w / 2, y: y - gap - 18 }, { x: x - w / 2, y: y + gap },
      { x: x + gap, y: y + gap }, { x: x - gap - w, y: y - gap - 18 },
    ];
    for (const pos of candidates) {
      const box = { left: pos.x, top: pos.y, right: pos.x + w, bottom: pos.y + 18 };
      if (box.left < 8 || box.top < 8 || box.right > width - 8 || box.bottom > height - 8 || intersectsAny(box, occupied)) continue;
      occupied.push(box);
      result.push({ id: String(node.node_id), x: pos.x + 6, y: pos.y + 13, text });
      break;
    }
  }
  return result;
}
