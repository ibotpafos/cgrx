import { gpuResources } from "./webgl-meter";
// Local real-GPU harness. Build with esbuild; see docs/alpha15-performance.md.
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ProjectCanvas } from '../crates/cgrx-cli/web/components/ProjectCanvas';
import type { ProjectCanvasHandle } from '../crates/cgrx-cli/web/components/ProjectCanvas';
import { createProjectGraphRenderer } from '../crates/cgrx-cli/web/project-three';
import { graphFixture } from '../crates/cgrx-cli/web/graph-fixtures.js';
import { decodeTopology } from '../crates/cgrx-cli/web/topology.js';
import { projectCodeMap } from '../crates/cgrx-cli/web/repository-map.js';
import { requestLayout, layoutMetrics } from '../crates/cgrx-cli/web/layout-client.js';
import type { ProjectMap, ProjectLayout } from '../crates/cgrx-cli/web/types';
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const p95 = (a: number[]) => [...a].sort((a,b) => a-b)[Math.ceil(a.length * .95) - 1];
function Bench() {
  const [graph, setGraph] = useState<ProjectMap | null>(null), [dimension, setDimension] = useState('2d'), [report, setReport] = useState<any>({ status: 'idle' });
  const ref = useRef<ProjectCanvasHandle>(null), canvas = useRef<HTMLCanvasElement>(null);
  const handle3d = useRef<ReturnType<typeof createProjectGraphRenderer> | null>(null);
  const picked = useRef(0), running = useRef(false), clickStarted = useRef(0);
  const [pickReport, setPickReport] = useState<any>(null);
  useEffect(() => {
    const start = () => { clickStarted.current = performance.now(); };
    document.addEventListener('click', start, true);
    return () => document.removeEventListener('click', start, true);
  }, []);
  function pick(kind: string) {
    picked.current = performance.now();
    requestAnimationFrame(() => {
      const result = { type: 'selection', kind, dimension, reactionMs: performance.now() - clickStarted.current };
      setPickReport(result); void fetch('/report', { method: 'POST', body: JSON.stringify(result) });
    });
  }
  useEffect(() => {
    if (dimension !== '3d' || !canvas.current || !graph) return;
    const renderer = createProjectGraphRenderer(canvas.current, { onNodeSelect: () => pick("node"), onEdgeSelect: () => pick("edge") }); handle3d.current = renderer;
    const job = requestLayout(graph, { width: 1400, height: 1000 }, undefined, (layout: ProjectLayout) => renderer.render(graph, layout));
    void job.promise.then((layout: ProjectLayout) => renderer.render(graph, layout)).catch(() => {});
    return () => { job.cancel(); renderer.dispose(); handle3d.current = null; };
  }, [graph, dimension]);
  async function run(count: number, dim: string) {
    if (running.current) return; running.current = true;
    setGraph(null); setDimension(dim); setReport({ status: 'running', count, dimension: dim }); await wait(200);
    const glCanvas = document.createElement('canvas'), gl = glCanvas.getContext('webgl2')!;
    const info = gl.getExtension('WEBGL_debug_renderer_info'); const gpu = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); gl.getExtension('WEBGL_lose_context')?.loseContext();
    const wire = graphFixture(count), received = performance.now(), started = received, value = decodeTopology(wire).graph;
    const next = projectCodeMap(value) as ProjectMap;
    setGraph(next);
    const deadline = performance.now() + 20000;
    while (dim === '2d' ? Number(document.querySelector<HTMLElement>('.project-sigma')?.dataset.renderedEdges) !== count * 6 : Number(canvas.current?.dataset.renderedEdges) !== count * 6) {
      if (performance.now() > deadline) throw Error('interactive deadline'); await wait(10);
    }
    const interactiveMs = performance.now() - received;
    while (layoutMetrics.activeWorkers) { if (performance.now() > deadline) throw Error('layout deadline'); await wait(50); }
    await wait(500);
    const frameMs: number[] = []; let last = performance.now();
    for (let i = 0; i < 180; i++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => { const now = performance.now(); frameMs.push(now - last); last = now; (dim === '2d' ? ref.current : handle3d.current)?.zoom(i % 60 < 30 ? 1.005 : 1 / 1.005); resolve(); }));
    }
    const output = { status: 'complete', count, edges: count * 6, dimension: dim, gpu, browser: navigator.userAgent, devicePixelRatio,
      interactiveMs, layoutMs: layoutMetrics.lastDurationMs, frameP95Ms: p95(frameMs), activeWorkers: layoutMetrics.activeWorkers, gpuResources: { ...gpuResources }, totalMs: performance.now() - started };
    setReport(output); running.current = false; await fetch('/report', { method: 'POST', body: JSON.stringify(output) });
  }
  async function switches() {
    if (running.current) return; running.current = true;
    const samples = [];
    for (let i = 0; i < 20; i++) {
      setGraph(null); await wait(60); setDimension(i % 2 ? '3d' : '2d');
      setGraph(projectCodeMap(decodeTopology(graphFixture(1000)).graph) as ProjectMap);
      await wait(300);
      while (layoutMetrics.activeWorkers) await wait(30);
      samples.push({ workers: layoutMetrics.activeWorkers, resources: { ...gpuResources }, canvases: document.querySelectorAll('canvas').length });
    }
    setGraph(null); await wait(100);
    const result = { type: 'switches', samples, after: { workers: layoutMetrics.activeWorkers, resources: { ...gpuResources }, canvases: document.querySelectorAll('canvas').length } };
    setReport(result); running.current = false; await fetch('/report', { method: 'POST', body: JSON.stringify(result) });
  }
  return <><header style={{ height: 70 }}>{[1000,5000,20000].flatMap(n => ['2d','3d'].map(d => <button key={`${n}${d}`} onClick={() => void run(n,d).catch(error => { running.current = false; setReport({ error: error.message }); })}>{n} {d}</button>))}<button onClick={() => (dimension === '2d' ? ref.current : handle3d.current)?.focusNode(graph!.nodes[0].node_id)}>Focus node</button><button onClick={() => void switches()}>20 switches</button><button onClick={() => { for (const c of document.querySelectorAll<HTMLCanvasElement>('.project-sigma canvas')) { const gl = c.getContext('webgl2') || c.getContext('webgl'); if (gl) { gl.getExtension('WEBGL_lose_context')?.loseContext(); break; } } }}>Lose context</button></header>
    <div style={{ position: 'absolute', top: 80, bottom: 150, left: 0, right: 0 }}>
      {graph && (dimension === '2d' ? <ProjectCanvas graph={graph} selectedId={null} ref={ref} onNodeSelect={() => pick("node")} onNodeOpen={() => {}} onEdgeSelect={() => pick("edge")}/>: <canvas ref={canvas} className="project-three-canvas"/>)}</div>
    <pre id="report" style={{ position: 'absolute', bottom: 0, height: 140, overflow: 'auto', color: 'white' }}>{JSON.stringify({ ...report, pick: pickReport }, null, 2)}</pre></>;
}
createRoot(document.getElementById('root')!).render(<Bench/>);
