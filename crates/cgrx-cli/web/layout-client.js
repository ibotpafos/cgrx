export const layoutMetrics = { activeWorkers: 0, completed: 0, lastDurationMs: 0 };
// Each job owns a worker, so a superseded graph can stop CPU work immediately.
// Weak keys release cached layouts with their immutable graph snapshots.
const cache = new WeakMap();
export function cachedLayout(graph, viewport) {
  return cache.get(graph)?.get(`${viewport.width}:${viewport.height}`) || null;
}

export function requestLayout(graph, viewport, createWorker = () => new Worker('/assets/layout-worker.js', { type: 'module' }), onProgress = (_layout) => {}) {
  const cached = cachedLayout(graph, viewport);
  if (cached) return { promise: Promise.resolve(cached), cancel() {} };
  let worker;
  const started = performance.now();
  let rejectJob;
  let settled = false;
  const promise = new Promise((resolve, reject) => {
    rejectJob = reject;
    const finish = (error, layout) => {
      if (settled) return;
      settled = true;
      if (worker) { worker.terminate(); layoutMetrics.activeWorkers--; worker = null; }
      if (error) reject(error);
      else {
        let layouts = cache.get(graph);
        if (!layouts) { layouts = new Map(); cache.set(graph, layouts); }
        if (layouts.size >= 4) layouts.delete(layouts.keys().next().value);
        layouts.set(`${viewport.width}:${viewport.height}`, layout);
        layoutMetrics.completed++; layoutMetrics.lastDurationMs = performance.now() - started;
        resolve(layout);
      }
    };
    try {
      worker = createWorker(); layoutMetrics.activeWorkers++;
      worker.onmessage = ({ data }) => {
        if (settled) return;
        if (data.error) { finish(new Error(data.error)); return; }
        if (data.positions) data.layout.nodes = data.layout.nodes.map((node, i) => ({ ...graph.nodes[i], ...node, x: data.positions[i * 2], y: data.positions[i * 2 + 1] }));
        if (data.progress) onProgress(data.layout); else finish(null, data.layout);
      };
      worker.onerror = () => finish(new Error('Graph layout worker failed. Reload to retry.'));
      worker.onmessageerror = () => finish(new Error('Graph layout response could not be read.'));
      if (graph.level) {
        const ids = new Map(graph.nodes.map((n, i) => [String(n.node_id), i]));
        const endpoints = new Uint32Array(graph.edges.length * 2);
        graph.edges.forEach((edge, i) => { endpoints[i * 2] = ids.get(String(edge.source)) ?? 0xffffffff; endpoints[i * 2 + 1] = ids.get(String(edge.target)) ?? 0xffffffff; });
        const nodes = graph.nodes.map(({ node_id, community, degree }) => ({ node_id, community, degree }));
        worker.postMessage({ graph: { level: graph.level, communities: graph.communities, nodes, edges: [] }, viewport, endpoints }, [endpoints.buffer]);
      } else worker.postMessage({ graph, viewport });
    } catch (error) { finish(error); }
  });
  return { promise, cancel() {
    if (settled) return;
    settled = true;
    if (worker) { worker.terminate(); layoutMetrics.activeWorkers--; worker = null; }
    rejectJob(new DOMException('Layout replaced by a newer graph', 'AbortError'));
  } };
}
