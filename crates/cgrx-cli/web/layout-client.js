// Each job owns a worker, so a superseded graph can stop CPU work immediately.
// Weak keys release cached layouts with their immutable graph snapshots.
const cache = new WeakMap();
export function cachedLayout(graph, viewport) {
  return cache.get(graph)?.get(`${viewport.width}:${viewport.height}`) || null;
}

export function requestLayout(graph, viewport, createWorker = () => new Worker('/assets/layout-worker.js', { type: 'module' })) {
  const cached = cachedLayout(graph, viewport);
  if (cached) return { promise: Promise.resolve(cached), cancel() {} };
  let worker;
  let rejectJob;
  let settled = false;
  const promise = new Promise((resolve, reject) => {
    rejectJob = reject;
    const finish = (error, layout) => {
      if (settled) return;
      settled = true;
      worker?.terminate();
      if (error) reject(error);
      else {
        let layouts = cache.get(graph);
        if (!layouts) { layouts = new Map(); cache.set(graph, layouts); }
        if (layouts.size >= 4) layouts.delete(layouts.keys().next().value);
        layouts.set(`${viewport.width}:${viewport.height}`, layout);
        resolve(layout);
      }
    };
    try {
      worker = createWorker();
      worker.onmessage = ({ data }) => data.error
        ? finish(new Error(data.error)) : finish(null, data.layout);
      worker.onerror = () => finish(new Error('Graph layout worker failed. Reload to retry.'));
      worker.onmessageerror = () => finish(new Error('Graph layout response could not be read.'));
      worker.postMessage({ graph, viewport });
    } catch (error) { finish(error); }
  });
  return { promise, cancel() {
    if (settled) return;
    settled = true;
    worker?.terminate();
    rejectJob(new DOMException('Layout replaced by a newer graph', 'AbortError'));
  } };
}
