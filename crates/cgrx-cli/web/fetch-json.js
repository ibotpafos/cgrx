// Retry only explicit backpressure/accepted work; disposal aborts both I/O and waits.
export async function fetchJson(url, token, signal) {
  const deadline = Date.now() + 120000;
  for (;;) {
    const response = await fetch(url, { headers: { 'X-CGRX-Token': token }, cache: 'no-store', signal });
    const value = await response.json();
    if (response.status === 202 || (response.status === 503 && value.error?.code === 'cgrx.queue_full')) {
      if (Date.now() >= deadline) throw new Error('Project is still busy. Retry when indexing completes.');
      const delay = Math.min(2000, Math.max(50, value.retry_after_ms || Number(response.headers.get('Retry-After') || 1) * 1000));
      await new Promise((resolve, reject) => {
        const abort = () => { clearTimeout(timer); reject(signal.reason || new DOMException('Cancelled', 'AbortError')); };
        const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, delay);
        if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
      });
      continue;
    }
    if (!response.ok) throw Object.assign(new Error(value?.error?.detail || `Request failed: ${response.status}`), { status: response.status });
    return value;
  }
}
