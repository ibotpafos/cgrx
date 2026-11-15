// Reproducible synthetic topology; never mixed with repository evidence.
export function graphFixture(count = 1000, edges = count * 6) {
  if (![1000, 5000, 20000].includes(count) || edges > 120000) throw new Error('Unsupported benchmark fixture');
  const nodes = Array.from({ length: count }, (_, i) => [(18446744073700000000n + BigInt(i)).toString(), `symbol_${i}`, `src/group${i % 20}/module${i % 80}.rs`]);
  return { format: 'cgrx.topology.v1', snapshot: { repo_revision: 'synthetic-v1', working_tree_digest: 'synthetic-v1', graph_generation: 1 }, root: { symbol: 'Synthetic fixture', path: '**' },
    nodes, edges: Array.from({ length: edges }, (_, i) => {
      const s = Math.floor(i / 6) % count, lane = i % 6;
      return [s, (s + 1 + (lane % 3) * 17) % count, lane < 3 ? 'CALLS' : 'REFERENCES'];
    }), total_nodes: count, total_edges: edges, truncated: false, partial: false, coverage_gap_count: 0 };
}
