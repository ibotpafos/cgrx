import { layoutRepositoryMap } from './dense-layout.js';
function send(layout, progress) {
  const positions = new Float64Array(layout.nodes.length * 2);
  const nodes = layout.nodes.map(({ x, y, ...node }, i) => { positions[i * 2] = x; positions[i * 2 + 1] = y; return node; });
  self.postMessage({ layout: { ...layout, nodes }, positions, progress }, [positions.buffer]);
}
self.onmessage = ({ data }) => {
  try {
    if (data.endpoints) {
      for (let i = 0; i < data.endpoints.length; i += 2) {
        const s = data.graph.nodes[data.endpoints[i]], t = data.graph.nodes[data.endpoints[i + 1]];
        if (s && t) data.graph.edges.push({ source: s.node_id, target: t.node_id });
      }
    }
    if (data.graph.level) send(layoutRepositoryMap(data.graph, data.viewport, 0), true);
    send(layoutRepositoryMap(data.graph, data.viewport), false);
  } catch (error) { self.postMessage({ error: error instanceof Error ? error.message : String(error) }); }
};
