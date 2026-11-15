import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTopology } from '../topology-client.ts';
test('superseded topology terminates the worker and ignores late data', async () => {
  const previous = globalThis.Worker; let worker, terminations = 0;
  globalThis.Worker = class { constructor() { worker = this; } postMessage() {} terminate() { terminations++; } };
  try {
    const abort = new AbortController(), result = loadTopology('http://localhost/fixture', 'fixture-token', abort.signal);
    abort.abort(); await assert.rejects(result, { name: 'AbortError' });
    worker.onmessage({ data: { graph: { stale: true } } });
    assert.ok(terminations >= 1);
  } finally { globalThis.Worker = previous; }
});
