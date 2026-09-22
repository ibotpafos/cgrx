// Project the same repository evidence at symbol or file granularity.
// File edges aggregate real relationships; symbol edges retain original evidence.
export function projectCodeMap(value, level = "symbols") {
  const source = value.nodes || [];
  const nodes = new Map(), sourceToNode = new Map(), communities = new Map();
  for (const symbol of source) {
    const id = level === "files" ? `file:${symbol.path}` : String(symbol.node_id);
    sourceToNode.set(String(symbol.node_id), id);
    const parts = symbol.path.split("/");
    const group = parts.length > 2 ? parts.slice(0, 2).join("/") : parts.length > 1 ? parts[0] : "root";
    const community = `code:${group}`;
    if (!communities.has(community)) communities.set(community, { id: community, label: group, packages: [group] });
    if (!nodes.has(id)) nodes.set(id, {
      ...symbol, node_id: id, symbol: level === "files" ? symbol.path : symbol.symbol,
      kind: level === "files" ? "file" : "symbol", community,
      files: 1, symbols: 0, fan_in: 0, fan_out: 0, degree: 0, cycle: false, representatives: [],
    });
    const node = nodes.get(id);
    node.symbols++;
    if (node.representatives.length < 6) node.representatives.push(symbol);
  }
  const edges = new Map();
  for (const edge of value.edges || []) {
    const from = sourceToNode.get(String(edge.source)), to = sourceToNode.get(String(edge.target));
    if (!from || !to) continue;
    const weight = Number(edge.weight || 1);
    nodes.get(from).fan_out += weight;
    nodes.get(to).fan_in += weight;
    const key = JSON.stringify([from, to, edge.relation]);
    if (edges.has(key)) edges.get(key).weight += weight;
    else edges.set(key, { ...edge, source: from, target: to, weight });
  }
  for (const node of nodes.values()) node.degree = node.fan_in + node.fan_out;
  return {
    snapshot: value.snapshot, root: { symbol: level === "files" ? "File relationships" : "Symbol relationships", path: value.root?.path || "." },
    nodes: [...nodes.values()], edges: [...edges.values()], communities: [...communities.values()],
    partial: value.partial, coverage_gap_count: value.coverage_gap_count,
    truncated: value.truncated, level,
    totals: { symbols: value.total_nodes, relationships: value.total_edges },
  };
}
