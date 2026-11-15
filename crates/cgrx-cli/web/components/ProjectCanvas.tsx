import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Sigma from 'sigma';
import { MultiDirectedGraph } from 'graphology';
import EdgeCurveProgram from '@sigma/edge-curve';
import { SelfLoopProgram, nextCurvature } from '../sigma-programs';
import { buildZoneContour } from '../clew-geometry.js';
import { ProjectCanvas as SvgCanvas } from './SvgProjectCanvas';
import { useProjectLayout } from './useProjectLayout';
import { GraphNeighbors } from './GraphNeighbors';
import type { ProjectCanvasHandle, ProjectCanvasProps } from './SvgProjectCanvas';
import type { ProjectLayoutNode } from '../types';
export type { ProjectCanvasHandle, ProjectCanvasProps } from './SvgProjectCanvas';

// React owns panels, not tens of thousands of individual graph elements.
export const ProjectCanvas = forwardRef<ProjectCanvasHandle, ProjectCanvasProps>(function ProjectCanvas(props, ref) {
  const container = useRef<HTMLDivElement>(null), contours = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<Sigma | null>(null), fallback = useRef<ProjectCanvasHandle>(null);
  const callbacks = useRef(props); callbacks.current = props;
  const nodes = useRef(new Map<string, ProjectLayoutNode>());
  const [failed, setFailed] = useState(false), [populating, setPopulating] = useState(true);
  const { layout, pending, error } = useProjectLayout(props.graph, 1400, 1000, !failed);
  const zones = useRef<Array<{ color: string; points: Array<{ x: number; y: number }> }>>([]);
  useEffect(() => {
    if (!container.current || failed) return;
    let sigma: Sigma;
    try {
      sigma = new Sigma(new MultiDirectedGraph(), container.current, {
        edgeProgramClasses: { curved: EdgeCurveProgram, loop: SelfLoopProgram }, defaultEdgeType: 'curved',
        enableEdgeEvents: true, labelColor: { color: '#bbc9c3' }, labelFont: 'system-ui',
        labelSize: 11, labelRenderedSizeThreshold: 5, labelDensity: .08,
        defaultNodeColor: '#91aaa1', defaultEdgeColor: '#30413b', minCameraRatio: .02, maxCameraRatio: 10,
        // Project switches may mount the canvas before its container has a width.
        allowInvalidContainer: true,
      });
    } catch { setFailed(true); return; }
    renderer.current = sigma;
    sigma.on('clickNode', ({ node }) => { const n = nodes.current.get(node); if (n) callbacks.current.onNodeSelect(n); });
    sigma.on('doubleClickNode', ({ node, event }) => { event.preventSigmaDefault(); const n = nodes.current.get(node); if (n) callbacks.current.onNodeOpen(n); });
    sigma.on('clickEdge', ({ edge }) => {
      const e = sigma.getGraph().getEdgeAttribute(edge, 'evidence');
      const source = nodes.current.get(String(e.source)), target = nodes.current.get(String(e.target));
      if (source && target) callbacks.current.onEdgeSelect(e, source, target);
    });
    sigma.on('afterRender', () => {
      const canvas = contours.current, ctx = canvas?.getContext('2d'); if (!canvas || !ctx) return;
      const { width, height } = sigma.getDimensions();
      const dpr = Math.min(devicePixelRatio, 2); canvas.width = width * dpr; canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      for (const zone of zones.current) {
        ctx.beginPath(); zone.points.forEach((p, i) => { const v = sigma.graphToViewport({ x: p.x, y: -p.y }); if (i) ctx.lineTo(v.x, v.y); else ctx.moveTo(v.x, v.y); });
        ctx.closePath(); ctx.fillStyle = zone.color; ctx.globalAlpha = .07; ctx.fill(); ctx.globalAlpha = .18; ctx.strokeStyle = zone.color; ctx.stroke();
      }
    });
    const lost = (event: Event): void => { event.preventDefault(); setFailed(true); };
    container.current.addEventListener('webglcontextlost', lost, true);
    const element = container.current;
    return () => { element.removeEventListener('webglcontextlost', lost, true); sigma.kill(); renderer.current = null; zones.current = []; nodes.current.clear(); };
  }, [failed]);
  useEffect(() => {
    const sigma = renderer.current; if (!sigma || !layout || failed) return;
    // Build away from Sigma's event listeners: otherwise every chunk reprocesses
    // all preceding edges, turning incremental loading into quadratic work.
    const ordinals = new Map<string, number>();
    const graph = new MultiDirectedGraph(); let cancelled = false, frame = 0, ni = 0, ei = 0;
    setPopulating(true);
    nodes.current = new Map(layout.nodes.map(n => [String(n.node_id), n]));
    const groups = new Map<string, ProjectLayoutNode[]>();
    for (const n of layout.nodes) { if (!groups.has(n.community)) groups.set(n.community, []); groups.get(n.community)!.push(n); }
    zones.current = [...groups.values()].map(members => ({ color: members[0].color, points: buildZoneContour(members, .55) }));
    const xs = layout.nodes.map(n => n.x), ys = layout.nodes.map(n => -n.y);
    if (xs.length) sigma.setCustomBBox({ x: [Math.min(...xs) - 50, Math.max(...xs) + 50], y: [Math.min(...ys) - 50, Math.max(...ys) + 50] });
    const populate = (): void => {
      if (cancelled) return;
      const until = performance.now() + 8;
      while (ni < layout.nodes.length && performance.now() < until) {
        const n = layout.nodes[ni++], id = String(n.node_id);
        graph.addNode(id, { x: n.x, y: -n.y, label: n.symbol, color: n.color, size: Math.max(1.5, n.radius * .5), highlighted: id === String(callbacks.current.selectedId) });
      }
      while (ni === layout.nodes.length && ei < props.graph.edges.length && performance.now() < until) {
        const i = ei++, e = props.graph.edges[i], source = String(e.source), target = String(e.target);
        if (graph.hasNode(source) && graph.hasNode(target)) graph.addDirectedEdgeWithKey(String(i), source, target, { type: source === target ? 'loop' : 'curved', curvature: nextCurvature(ordinals, source, target), size: .5, color: e.confidence === 'PROVEN' ? '#364c44' : '#786440', evidence: e });
      }
      if (ni < layout.nodes.length || ei < props.graph.edges.length) frame = requestAnimationFrame(populate);
      else {
        sigma.setGraph(graph); sigma.refresh(); setPopulating(false);
        if (container.current) { container.current.dataset.renderedNodes = String(graph.order); container.current.dataset.renderedEdges = String(graph.size); }
      }
    };
    frame = requestAnimationFrame(populate);
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [layout, props.graph, failed]);
  const prior = useRef<string | null>(null);
  useEffect(() => {
    const graph = renderer.current?.getGraph(); if (!graph) return;
    if (prior.current && graph.hasNode(prior.current)) graph.setNodeAttribute(prior.current, 'highlighted', false);
    const id = props.selectedId == null ? null : String(props.selectedId);
    if (id && graph.hasNode(id)) graph.setNodeAttribute(id, 'highlighted', true);
    prior.current = id;
  }, [props.selectedId]);
  useImperativeHandle(ref, () => ({
    zoom: factor => { if (failed) fallback.current?.zoom(factor); else { const c = renderer.current?.getCamera(); if (c) void c.animate({ ratio: c.ratio / factor }); } },
    resetView: () => { if (failed) fallback.current?.resetView(); else void renderer.current?.getCamera().animatedReset(); },
    focusNode: id => {
      if (failed) { fallback.current?.focusNode(id); return; }
      const sigma = renderer.current; const p = sigma?.getNodeDisplayData(String(id));
      if (p) void sigma?.getCamera().animate({ x: p.x, y: p.y });
    },
  }), [failed]);
  const bounded = useMemo(() => {
    const ns = props.graph.nodes.slice(0, 500), ids = new Set(ns.map(n => String(n.node_id)));
    return { ...props.graph, nodes: ns, edges: props.graph.edges.filter(e => ids.has(String(e.source)) && ids.has(String(e.target))).slice(0, 2000), truncated: true, partial: true };
  }, [props.graph]);
  if (failed) return <><SvgCanvas {...props} graph={bounded} ref={fallback}/><p className="layout-status" role="status">WebGL unavailable: SVG fallback limited to 500 nodes / 2,000 edges. Evidence totals are unchanged.</p></>;
  return <><div ref={container} className="project-sigma" aria-label="Repository dependency graph" role="group"/><canvas ref={contours} className="project-contours" aria-hidden="true"/>
    {(pending || populating || error) && <p className="layout-status" role="status">{error || 'Building interactive graph…'}</p>}
    <GraphNeighbors {...props} layout={layout}/>

  </>;
});
