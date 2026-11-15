import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { requestLayout } from '../layout-client.js';
import { layoutRepositoryMap } from '../dense-layout.js';
import { projectCodeMap } from '../repository-map.js';

function workerFactory() {
  const entry = new URL('../layout-worker.bundle.js', import.meta.url).href;
  const nodeWorker = new Worker(`const { parentPort } = require('node:worker_threads');
    globalThis.self = { postMessage: data => parentPort.postMessage(data) };
    import(${JSON.stringify(entry)}).then(() => parentPort.on('message', data => self.onmessage({ data })));`, { eval: true });
  const adapter = { postMessage: data => nodeWorker.postMessage(data), terminate: () => { void nodeWorker.terminate(); } };
  nodeWorker.on('message', data => adapter.onmessage?.({ data }));
  nodeWorker.on('error', error => adapter.onerror?.(error));
  return adapter;
}
function fixture(count = 60) {
  return projectCodeMap({ nodes: Array.from({ length: count }, (_, i) => ({ node_id: String(i), symbol: `f${i}`, path: `src/g${i%3}/file.rs` })),
    edges: Array.from({ length: count - 1 }, (_, i) => ({ source: String(i), target: String(i+1), relation: 'CALLS' })) });
}

test('bundled worker preserves deterministic positions and leaves the main event loop available', async () => {
  const graph = fixture(600), viewport = { width: 1400, height: 1000 };
  const before = structuredClone(graph);
  let heartbeats = 0;
  const timer = setInterval(() => { heartbeats++; }, 1);
  const job = requestLayout(graph, viewport, workerFactory);
  const layout = await job.promise.finally(() => clearInterval(timer));
  assert.ok(heartbeats > 0, 'main event loop must run before layout completes');
  assert.deepEqual(layout, layoutRepositoryMap(graph, viewport));
  assert.deepEqual(graph, before, 'evidence must not be mutated');
  const cached = requestLayout(graph, viewport, () => { throw Error('cached layout must not start another worker'); });
  assert.equal(await cached.promise, layout);
  const resized = await requestLayout(graph, { width: 800, height: 600 }, workerFactory).promise;
  assert.equal(resized.width, 800);
});

test('cancelled layouts terminate work and cannot populate cache with stale results', async () => {
  const graph = fixture();
  let terminated = false, worker;
  const job = requestLayout(graph, {}, () => (worker = { postMessage() {}, terminate() { terminated = true; } }));
  job.cancel();
  await assert.rejects(job.promise, { name: 'AbortError' });
  worker.onmessage({ data: { layout: { stale: true } } });
  assert.ok(terminated);
  const fresh = await requestLayout(graph, {}, workerFactory).promise;
  assert.equal(fresh.nodes.length, graph.nodes.length);
});

test('worker failures reject instead of freezing the UI with a synchronous fallback', async () => {
  await assert.rejects(requestLayout(fixture(), {}, () => { throw Error('worker blocked'); }).promise, /worker blocked/);
  let worker, stopped = false;
  const job = requestLayout(fixture(), {}, () => (worker = { postMessage() {}, terminate() { stopped = true; } }));
  worker.onerror();
  await assert.rejects(job.promise, /worker failed/);
  assert.ok(stopped);
});
