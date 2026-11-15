// Numeric indices are local to this exact ID table, never converted u64 IDs.
export function decodeTopology(value) {
  if (value.format !== 'cgrx.topology.v1') return { graph: value, endpoints: new Uint32Array() };
  const ids = new Set();
  const nodes = value.nodes.map(([id, symbol, path]) => {
    if (typeof id !== 'string' || ids.has(id)) throw new Error('Invalid topology ID table');
    ids.add(id);
    return { node_id: id, symbol, path, kind: 'symbol', status: 'current' };
  });
  const endpoints = new Uint32Array(value.edges.length * 2);
  const edges = value.edges.map(([s, t, relation], i) => {
    if (!Number.isInteger(s) || !Number.isInteger(t) || !nodes[s] || !nodes[t]) throw new Error('Invalid topology endpoint');
    endpoints[i * 2] = s; endpoints[i * 2 + 1] = t;
    return { source: nodes[s].node_id, target: nodes[t].node_id, relation, confidence: 'PROVEN', status: 'current', evidence_ref: { source: nodes[s].node_id, target: nodes[t].node_id, relation } };
  });
  return { graph: { ...value, nodes, edges }, endpoints };
}
