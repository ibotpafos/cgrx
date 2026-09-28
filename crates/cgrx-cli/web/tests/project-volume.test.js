import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProjectVolume, fitVolumeDistance } from '../project-volume.js';

function fixture(n = 1000) {
  return { width: 1000, height: 800, nodes: Array.from({ length: n }, (_, i) => ({
    node_id: String(18446744073709551615n - BigInt(i)), community: 'src/main', color: '#abcdef', radius: 4,
    x: 200 + (i % 32) * 16, y: 150 + Math.floor(i / 32) * 16,
  })) };
}

test('a single community stays volumetric when viewed edge-on', () => {
  const input = fixture(), before = structuredClone(input), result = buildProjectVolume(input);
  const spans = [0, 1, 2].map(axis => {
    const values = input.nodes.map((_, i) => result.positions[i * 3 + axis]);
    return Math.max(...values) - Math.min(...values);
  });
  assert.ok(spans[2] > Math.max(spans[0], spans[1]) * .5, `real depth required: ${spans}`);
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
    const projected = input.nodes.map((_, i) => result.positions[i * 3] * Math.cos(angle) + result.positions[i * 3 + 2] * Math.sin(angle));
    assert.ok(Math.max(...projected) - Math.min(...projected) > 200, 'rotation must not collapse the community into a strip');
  }
  assert.deepEqual(input, before, 'embedding must not change graph/evidence or 2D layout');
});

test('depth is deterministic, preserves full u64 IDs, and survives reordering', () => {
  const input = fixture(), first = buildProjectVolume(input);
  assert.deepEqual(buildProjectVolume(input), first);
  const reversed = buildProjectVolume({ ...input, nodes: [...input.nodes].reverse() });
  input.nodes.forEach((node, i) => {
    assert.equal(first.positions[i * 3], node.x - input.width / 2);
    assert.equal(first.positions[i * 3 + 2], reversed.positions[(input.nodes.length - 1 - i) * 3 + 2]);
  });
  assert.notEqual(first.positions[2], first.positions[5]);
});

test('community volume contours contain their actual members', () => {
  const input = fixture(), result = buildProjectVolume(input), zone = result.zones[0];
  input.nodes.forEach((_, i) => {
    assert.ok(Math.hypot(...[0, 1, 2].map(a => (result.positions[i * 3 + a] - zone.center[a]) / zone.radii[a])) <= 1);
  });
  assert.equal(buildProjectVolume({ ...input, nodes: [] }).positions.length, 0);
  assert.ok([...buildProjectVolume({ ...input, nodes: input.nodes.slice(0, 1) }).positions].every(Number.isFinite));
});

test('camera fit encloses a sphere in both portrait and landscape viewports', () => {
  for (const aspect of [.25, .5, 1, 2, 4]) {
    const distance = fitVolumeDistance(600, 48, aspect), angularRadius = Math.asin(600 / distance);
    assert.ok(angularRadius < 48 * Math.PI / 360);
    assert.ok(angularRadius < Math.atan(Math.tan(48 * Math.PI / 360) * aspect));
  }
  assert.ok(fitVolumeDistance(600, 48, .5) > fitVolumeDistance(600, 48, 2));
});
