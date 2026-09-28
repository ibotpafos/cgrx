import type { GraphResponse } from './types';
export function loadTopology(url: string, token: string, signal: AbortSignal): Promise<GraphResponse> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('/assets/topology-worker.js', { type: 'module' });
    const done = (): void => { worker.terminate(); signal.removeEventListener('abort', abort); };
    const abort = (): void => { done(); reject(new DOMException('Topology superseded', 'AbortError')); };
    worker.onmessage = ({ data }) => { done(); data.error ? reject(new Error(data.error)) : resolve(data.graph); };
    worker.onerror = () => { done(); reject(new Error('Topology worker failed')); };
    worker.onmessageerror = () => { done(); reject(new Error('Invalid topology worker response')); };
    if (signal.aborted) { abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    worker.postMessage({ url, token });
  });
}
