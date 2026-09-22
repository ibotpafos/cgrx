import { layoutRepositoryMap } from './dense-layout.js';

self.onmessage = ({ data }) => {
  try {
    self.postMessage({ layout: layoutRepositoryMap(data.graph, data.viewport) });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
};
