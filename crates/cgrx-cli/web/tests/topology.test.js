import test from 'node:test';
import assert from 'node:assert/strict';
import { graphFixture } from '../graph-fixtures.js';
import { decodeTopology } from '../topology.js';
import { projectCodeMap } from '../repository-map.js';
for (const count of [1000, 5000, 20000]) test(`compact ${count}/${count * 6} preserves u64 IDs, parallel relationships and coverage`, () => {
  const wire = graphFixture(count), { graph, endpoints } = decodeTopology(wire);
  const projected = projectCodeMap(graph);
  assert.equal(projected.nodes.length, count); assert.equal(projected.edges.length, count * 6);
  assert.equal(endpoints.length, count * 12);
  assert.equal(new Set(graph.nodes.map(n => n.node_id)).size, count);
  assert.ok(BigInt(graph.nodes[0].node_id) > BigInt(Number.MAX_SAFE_INTEGER));
  assert.notEqual(graph.edges[0].relation, graph.edges[3].relation);
  assert.equal(graph.edges[0].target, graph.edges[3].target);
  for (let i = 0; i < graph.edges.length; i++) {
    assert.equal(graph.edges[i].source, graph.nodes[endpoints[i * 2]].node_id);
    assert.equal(graph.edges[i].target, graph.nodes[endpoints[i * 2 + 1]].node_id);
  }
  assert.equal(graph.coverage_gap_count, 0);
});
test('invalid and duplicate IDs or endpoints cannot silently corrupt evidence', () => {
  const invalid = graphFixture(); invalid.nodes[1][0] = invalid.nodes[0][0];
  assert.throws(() => decodeTopology(invalid), /ID table/);
  const dangling = graphFixture(); dangling.edges[0][0] = 1000;
  assert.throws(() => decodeTopology(dangling), /endpoint/);
});
