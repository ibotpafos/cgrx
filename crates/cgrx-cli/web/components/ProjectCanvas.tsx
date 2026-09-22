import React, { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useProjectLayout } from "./useProjectLayout";
import { buildZoneContour, placeLabels, zoomAt } from "../clew-geometry.js";
import { edgeStyle } from "../layout.js";
import type { CameraState, GraphEdge, GraphId, ProjectLayout, ProjectLayoutNode, ProjectMap } from "../types";

export interface ProjectCanvasHandle {
  zoom(factor: number): void;
  resetView(): void;
  focusNode(nodeId: GraphId): void;
}
export interface ProjectCanvasProps {
  graph: ProjectMap;
  selectedId: GraphId | null;
  onNodeSelect: (node: ProjectLayoutNode) => void;
  onNodeOpen: (node: ProjectLayoutNode) => void;
  onEdgeSelect: (edge: GraphEdge, source: ProjectLayoutNode, target: ProjectLayoutNode) => void;
}

const EMPTY_LAYOUT: ProjectLayout = { width: 1400, height: 1000, nodes: [], communities: [] };

// React projection of Clew's graph canvas interaction and contour primitives.
// Edges and communities come exclusively from the CGRX evidence projection.
export const ProjectCanvas = forwardRef<ProjectCanvasHandle, ProjectCanvasProps>(function ProjectCanvas(props, ref) {
  const svg = useRef<SVGSVGElement>(null);
  const prefix = useId();
  const [size, setSize] = useState({ width: 1280, height: 800 });
  const [camera, setCamera] = useState<CameraState>({ x: 0, y: 0, scale: 1 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [pins, setPins] = useState<Record<string, { x: number; y: number }>>({});
  const drag = useRef<{ x: number; y: number; camera: CameraState; node?: ProjectLayoutNode; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const { layout: computedLayout, pending, error } = useProjectLayout(props.graph);
  const baseLayout = computedLayout || EMPTY_LAYOUT;
  const layout = useMemo(() => ({ ...baseLayout, nodes: baseLayout.nodes.map(n => pins[String(n.node_id)] ? { ...n, ...pins[String(n.node_id)], pinned: true } : n) }), [baseLayout, pins]);
  const byId = useMemo(() => new Map(layout.nodes.map(n => [String(n.node_id), n])), [layout]);
  const focus = hovered || (props.selectedId == null ? null : String(props.selectedId));
  const focusIds = useMemo(() => {
    const ids = new Set<string>(focus ? [focus] : []);
    if (focus) for (const edge of props.graph.edges) {
      if (String(edge.source) === focus) ids.add(String(edge.target));
      if (String(edge.target) === focus) ids.add(String(edge.source));
    }
    return ids;
  }, [focus, props.graph.edges]);
  const labels = useMemo(() => placeLabels(layout.nodes, camera, size.width, size.height, focusIds), [layout, camera, size, focusIds]);
  const zones = useMemo(() => {
    const members = new Map<string, ProjectLayoutNode[]>();
    for (const node of layout.nodes) {
      if (!members.has(node.community)) members.set(node.community, []);
      members.get(node.community)!.push(node);
    }
    return layout.communities.map((community, index) => {
      const nodes = members.get(community.id) || [];
      const contour = buildZoneContour(nodes, 0.55);
      return { ...community, index, color: nodes[0]?.color || "#7fa69e", path: contour.map((p: {x: number; y: number}, i: number) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ") + "Z" };
    });
  }, [layout]);

  const fit = (nodes = baseLayout.nodes): CameraState => {
    if (!nodes.length) return { x: 0, y: 0, scale: 1 };
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const available = Math.max(240, size.width - (size.width > 800 ? 440 : 80));
    const scale = Math.max(0.25, Math.min(2.5, available / (maxX - minX + 200), (size.height - 180) / (maxY - minY + 120)));
    return { x: size.width * (size.width > 800 ? 0.6 : 0.5) - (minX + maxX) / 2 * scale, y: size.height * 0.51 - (minY + maxY) / 2 * scale, scale };
  };
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const rect = element.getBoundingClientRect();
      setSize({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const generation = `${props.graph.level || "packages"}:${props.graph.root.path}:${props.graph.root.symbol}:${props.graph.snapshot.repo_revision}:${props.graph.snapshot.graph_generation}:${props.graph.snapshot.working_tree_digest}`;
  useEffect(() => { setPins({}); setHovered(null); }, [generation]);
  useEffect(() => { setCamera(fit()); }, [size.width, size.height, generation, baseLayout]);
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      setCamera(current => zoomAt(current, point, Math.exp(-Math.max(-120, Math.min(120, event.deltaY)) * 0.002)));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, []);
  useImperativeHandle(ref, () => ({
    zoom: factor => setCamera(c => zoomAt(c, { x: size.width / 2, y: size.height / 2 }, factor)),
    resetView: () => { setPins({}); setCamera(fit()); },
    // Selecting a node retains spatial context; explicit zoom remains available.
    focusNode: nodeId => {
      const node = byId.get(String(nodeId));
      if (!node) return;
      setCamera(c => {
        const x = node.x * c.scale + c.x, y = node.y * c.scale + c.y;
        return x > 90 && x < size.width - 40 && y > 120 && y < size.height - 60 ? c
          : { ...c, x: size.width * .55 - node.x * c.scale, y: size.height * .5 - node.y * c.scale };
      });
    },
  }));

  const begin = (event: React.PointerEvent<SVGElement>, node?: ProjectLayoutNode): void => {
    if (event.button !== 0) return;
    event.stopPropagation();
    drag.current = { x: event.clientX, y: event.clientY, camera, node, moved: false };
    suppressClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: React.PointerEvent<SVGSVGElement>): void => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.hypot(dx, dy) > 4) { start.moved = true; suppressClick.current = true; }
    if (!start.moved) return;
    if (start.node) {
      const node = start.node;
      setPins(p => ({ ...p, [String(node.node_id)]: { x: node.x + dx / start.camera.scale, y: node.y + dy / start.camera.scale } }));
    } else setCamera({ ...start.camera, x: start.camera.x + dx, y: start.camera.y + dy });
  };
  const end = (event: React.PointerEvent<SVGSVGElement>): void => {
    // Resolve clicks after the drag threshold so arranging a node never selects it.
    const start = drag.current;
    drag.current = null;
    const target = event.target as SVGElement;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
    if (event.type === "pointerup" && start?.node && !start.moved) props.onNodeSelect(start.node);
  };

  return <svg ref={svg} className="project-canvas" viewBox={`0 0 ${size.width} ${size.height}`} aria-label="Repository dependency graph" aria-busy={pending} role="group" onPointerDown={e => begin(e)} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={() => { drag.current = null; }}>
    {(pending || error) && <text x={size.width / 2} y={size.height / 2} textAnchor="middle" fill="#a9b8b0" role="status">{error || "Arranging repository graph…"}</text>}
    <defs>{zones.map(zone => <radialGradient key={zone.id} id={`${prefix}-zone-${zone.index}`}><stop offset="0" stopColor={zone.color} stopOpacity=".2"/><stop offset=".6" stopColor={zone.color} stopOpacity=".08"/><stop offset="1" stopColor={zone.color} stopOpacity="0"/></radialGradient>)}</defs>
    <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`}>
      <g className="map-zones" aria-hidden="true">{zones.map(zone => <path key={zone.id} d={zone.path} fill={`url(#${prefix}-zone-${zone.index})`} />)}</g>
      {props.graph.edges.map((edge, i) => {
        const source = byId.get(String(edge.source)), target = byId.get(String(edge.target));
        if (!source || !target) return null;
        const connected = focus === String(edge.source) || focus === String(edge.target);
        const dx = target.x - source.x, dy = target.y - source.y;
        const d = source === target ? `M${source.x} ${source.y} c-30 -40 30 -40 0 0` : `M${source.x} ${source.y} Q${(source.x + target.x) / 2 - dy * 0.1} ${(source.y + target.y) / 2 + dx * 0.1} ${target.x} ${target.y}`;
        const style = edgeStyle(edge);
        const activate = (): void => props.onEdgeSelect(edge, source, target);
        return <g key={`${edge.source}:${edge.target}:${i}`} role="button" tabIndex={0} aria-label={`${source.symbol} ${edge.relation} ${target.symbol}, ${edge.confidence || "unknown confidence"}`} className={`map-edge ${connected ? "is-lit" : ""}`} opacity={focus && !connected ? 0.06 : connected ? 0.95 : 0.28} onPointerDown={e => { e.stopPropagation(); suppressClick.current = false; }} onClick={() => { if (!suppressClick.current) activate(); }} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); } }}>
          <path d={d} className="map-edge-hit"/><path d={d} className={style.className} strokeDasharray={style.dash}/>
        </g>;
      })}
      {layout.nodes.map(node => {
        const id = String(node.node_id), selected = String(props.selectedId) === id;
        const active = !focus || focusIds.has(id);
        const radius = props.graph.level ? Math.max(1.6, node.radius * .32) : Math.max(3.5, node.radius * .45);
        return <g key={id} className={`map-node${selected ? " is-selected" : ""}`} role="button" tabIndex={0} aria-label={`${node.symbol}, ${node.symbols} symbols${node.cycle ? ", cycle candidate" : ""}`} transform={`translate(${node.x} ${node.y})`} opacity={active ? 1 : .14}
          onPointerDown={e => begin(e, node)} onDoubleClick={() => props.onNodeOpen(node)} onPointerEnter={() => { if (!drag.current) setHovered(id); }} onPointerLeave={() => setHovered(null)} onFocus={() => setHovered(id)} onBlur={() => setHovered(null)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); props.onNodeSelect(node); } }}>
          <title>{node.symbol} · {node.symbols} symbols · {node.files} files</title>
          <circle r={props.graph.level ? radius + 3 : Math.max(12, radius + 6)} fill="transparent"/>
          <circle className="map-node-halo" r={radius + 6} fill="none" stroke={node.color} opacity={selected ? .8 : .12}/>
          <circle className="map-node-dot" r={radius} fill={selected || focusIds.has(id) ? "#f4f6f5" : "#9ca8a5"}/>
          {node.cycle && <circle r={radius + 3} fill="none" stroke="#eac16b" strokeDasharray="3 3"/>}
        </g>;
      })}
    </g>
    <g className="map-labels" aria-hidden="true">{labels.map(label => <text key={label.id} x={label.x} y={label.y} className={label.id === String(props.selectedId) ? "is-selected" : ""}>{label.text}</text>)}</g>
  </svg>;
});
