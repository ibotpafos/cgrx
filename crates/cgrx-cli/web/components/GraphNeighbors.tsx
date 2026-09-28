import React, { useEffect, useMemo, useState } from 'react';
import type { GraphEdge, GraphId, ProjectLayout, ProjectLayoutNode, ProjectMap } from '../types';
export function GraphNeighbors({ graph, layout, selectedId, onNodeSelect, onEdgeSelect }: {
  graph: ProjectMap; layout: ProjectLayout | null; selectedId: GraphId | null;
  onNodeSelect: (node: ProjectLayoutNode) => void;
  onEdgeSelect: (edge: GraphEdge, source: ProjectLayoutNode, target: ProjectLayoutNode) => void;
}) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [selectedId, graph]);
  const nodes = useMemo(() => new Map(layout?.nodes.map(n => [String(n.node_id), n])), [layout]);
  const edges = useMemo(() => graph.edges.filter(e => String(e.source) === String(selectedId) || String(e.target) === String(selectedId)), [graph, selectedId]);
  if (selectedId == null) return null;
  return <details className="graph-neighbors"><summary>Connections ({edges.length}) — keyboard navigation</summary>
    {edges.slice(page * 30, page * 30 + 30).map((e, i) => {
      const source = nodes.get(String(e.source)), target = nodes.get(String(e.target));
      const neighbor = String(e.source) === String(selectedId) ? target : source;
      return <div key={i}><button disabled={!neighbor} onClick={() => neighbor && onNodeSelect(neighbor)}>{neighbor?.symbol || 'Node loading'}</button>
        <button disabled={!source || !target} onClick={() => source && target && onEdgeSelect(e, source, target)}>Inspect {e.relation}</button></div>;
    })}
    <button disabled={!page} onClick={() => setPage(p => p - 1)}>Previous</button>
    <button disabled={(page + 1) * 30 >= edges.length} onClick={() => setPage(p => p + 1)}>Next</button>
  </details>;
}
