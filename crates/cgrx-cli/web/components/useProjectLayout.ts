import { useEffect, useState } from 'react';
import { cachedLayout, requestLayout } from '../layout-client.js';
import type { ProjectLayout, ProjectMap } from '../types';

export function useProjectLayout(graph: ProjectMap, width = 1400, height = 1000) {
  const [result, setResult] = useState<{ graph: ProjectMap; width: number; height: number; layout: ProjectLayout | null; error: string } | null>(null);
  useEffect(() => {
    let active = true;
    const job = requestLayout(graph, { width, height });
    void job.promise.then((layout: unknown) => {
      if (active) setResult({ graph, width, height, layout: layout as ProjectLayout, error: '' });
    }).catch((error: Error) => {
      if (active) setResult({ graph, width, height, layout: null, error: error.message });
    });
    return () => { active = false; job.cancel(); };
  }, [graph, width, height]);
  const current = result?.graph === graph && result.width === width && result.height === height ? result : null;
  const layout = current?.layout || cachedLayout(graph, { width, height }) as ProjectLayout | null;
  return { layout, pending: !layout && !current?.error, error: current?.error || '' };
}
