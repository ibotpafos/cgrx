import test from "node:test";
import assert from "node:assert/strict";
import { buildZoneContour, zoomAt, placeLabels, intersectsAny } from "../clew-geometry.js";

function inside(polygon, point) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) result = !result;
  }
  return result;
}

test("Clew contours enclose singleton, two-node and irregular communities without changing nodes", () => {
  // Irregular-cluster case adapted from Clew graphCanvasCore.test.ts (MIT).
  for (const points of [[{ x: 10, y: 30 }], [{ x: 10, y: 30 }, { x: 90, y: 120 }], [
    { x: 120, y: 120 }, { x: 280, y: 140 }, { x: 190, y: 230 },
    { x: 340, y: 260 }, { x: 140, y: 300 }, { x: 260, y: 360 },
  ]]) {
    const before = structuredClone(points);
    const contour = buildZoneContour(points, .55);
    assert.ok(contour.length >= 3);
    assert.ok(points.every(point => inside(contour, point)));
    assert.deepEqual(points, before);
  }
  assert.deepEqual(buildZoneContour([], .55), []);
});

test("cursor zoom retains the same graph point, including at zoom limits", () => {
  const camera = { x: -81, y: 37, scale: .8 }, point = { x: 431, y: 285 };
  for (const factor of [1.3, .6, 100, .001]) {
    const next = zoomAt(camera, point, factor);
    assert.ok(next.scale >= .25 && next.scale <= 4);
    assert.ok(Math.abs((point.x - camera.x) / camera.scale - (point.x - next.x) / next.scale) < 1e-8);
    assert.ok(Math.abs((point.y - camera.y) / camera.scale - (point.y - next.y) / next.scale) < 1e-8);
  }
});

test("dense labels do not overlap and selection claims space first", () => {
  const nodes = Array.from({ length: 80 }, (_, i) => ({ node_id: String(i), symbol: `package/service-${i}`, degree: i, radius: 7, x: 300 + i % 10 * 8, y: 200 + Math.floor(i / 10) * 8 }));
  const camera = { x: 0, y: 0, scale: 1 };
  const labels = placeLabels(nodes, camera, 800, 600);
  const boxes = [];
  for (const label of labels) {
    const box = { left: label.x - 6, top: label.y - 13, right: label.x - 6 + label.text.length * 7 + 12, bottom: label.y + 5 };
    assert.equal(intersectsAny(box, boxes), false);
    boxes.push(box);
  }
  assert.ok(labels.length > 0 && labels.length < nodes.length);
  const focused = placeLabels(nodes, camera, 800, 600, new Set(["0"]));
  assert.deepEqual(focused.map(l => l.id), ["0"]);
});
