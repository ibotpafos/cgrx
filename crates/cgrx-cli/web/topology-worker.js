import { fetchJson } from './fetch-json.js';
import { decodeTopology } from './topology.js';
self.onmessage = async ({ data }) => {
  try {
    const result = decodeTopology(await fetchJson(data.url, data.token));
    self.postMessage(result, [result.endpoints.buffer]);
  } catch (error) { self.postMessage({ error: error.message }); }
};
