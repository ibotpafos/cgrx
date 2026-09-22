import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { layoutRepositoryMap } from '../crates/cgrx-cli/web/dense-layout.js';
import { projectCodeMap } from '../crates/cgrx-cli/web/repository-map.js';
const graph = projectCodeMap(JSON.parse(await readFile(process.argv[2], 'utf8')));
const samples = [];
for (let i = 0; i < 3; i++) {
  const before = performance.now();
  const layout = layoutRepositoryMap(graph, { width: 1400, height: 1000 });
  samples.push(performance.now() - before);
  if (layout.nodes.length !== graph.nodes.length || layout.nodes.some(n => !Number.isFinite(n.x + n.y))) throw Error('Invalid layout');
}
console.log(JSON.stringify({ nodes: graph.nodes.length, edges: graph.edges.length, sync_ms: samples, median_ms: samples.toSorted((a,b)=>a-b)[1] }));
// The same bundled browser worker, hosted by worker_threads for reproducibility.
const { Worker } = await import('node:worker_threads');
const { requestLayout } = await import('../crates/cgrx-cli/web/layout-client.js');
function createWorker() {
  const entry = new URL('../crates/cgrx-cli/web/layout-worker.bundle.js', import.meta.url).href;
  const worker = new Worker(`const { parentPort } = require('node:worker_threads');
    globalThis.self = { postMessage: data => parentPort.postMessage(data) };
    import(${JSON.stringify(entry)}).then(() => parentPort.on('message', data => self.onmessage({ data })));`, { eval: true });
  const bridge = { postMessage: data => worker.postMessage(data), terminate: () => { void worker.terminate(); } };
  worker.on('message', data => bridge.onmessage?.({ data }));
  worker.on('error', error => bridge.onerror?.(error));
  return bridge;
}
const viewport = { width: 1400, height: 1000 };
let heartbeats = 0;
const timer = setInterval(() => { heartbeats++; }, 5);
const started = performance.now();
const job = requestLayout(graph, viewport, createWorker);
const dispatch_ms = performance.now() - started;
await job.promise.finally(() => clearInterval(timer));
const worker_ms = performance.now() - started;
const cachedStarted = performance.now();
await requestLayout(graph, viewport, createWorker).promise;
console.log(JSON.stringify({ worker_ms, main_thread_dispatch_ms: dispatch_ms, heartbeats, cached_ms: performance.now() - cachedStarted }));
