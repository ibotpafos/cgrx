import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildProjectVolume, fitVolumeDistance } from './project-volume.js';
import type { GraphEdge, GraphId, ProjectLayout, ProjectLayoutNode, ProjectMap } from './types';
export interface ProjectGraphCallbacks {
  onNodeSelect?: (node: ProjectLayoutNode) => void;
  onNodeOpen?: (node: ProjectLayoutNode) => void;
  onEdgeSelect?: (edge: GraphEdge, source: ProjectLayoutNode, target: ProjectLayoutNode) => void;
}
export interface ProjectGraphRendererHandle {
  render(graph: ProjectMap, layout: ProjectLayout, options?: { selectedId?: GraphId | null }): void;
  setSelected(nodeId: GraphId | null): void;
  focusNode(nodeId: GraphId): void;
  resetView(animate?: boolean): void;
  zoom(factor: number): void;
  dispose(): void;
}
const SEGMENTS = 6, LABEL_LIMIT = 32;
export function createProjectGraphRenderer(canvas: HTMLCanvasElement, callbacks: ProjectGraphCallbacks = {}): ProjectGraphRendererHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(48, 1, 1, 10000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .1; controls.minDistance = 30; controls.maxDistance = 5000;
  camera.position.set(0, 0, 1500);
  let frame = 0, disposed = false, fitted = false, selected: string | null = null;
  let mesh: THREE.InstancedMesh | null = null, lines: THREE.LineSegments | null = null;
  let layout: ProjectLayout | null = null;
  let edgeRecords: GraphEdge[] = [], labelCandidates: ProjectLayoutNode[] = [];
  const index = new Map<string, number>(), positions: THREE.Vector3[] = [];
  const group = new THREE.Group(); scene.add(group);
  const labels = new Map<string, THREE.Sprite>();
  const eventController = new AbortController();
  const projection = new THREE.Vector3(), bounds = new THREE.Sphere(new THREE.Vector3(), 500);
  function releaseLabel(id: string): void {
    const sprite = labels.get(id); if (!sprite) return;
    scene.remove(sprite); sprite.material.map?.dispose(); sprite.material.dispose(); labels.delete(id);
  }
  function updateLabels(): void {
    if (!layout) return;
    const wanted = new Set<string>();
    const chosen = selected && index.has(selected) ? [layout.nodes[index.get(selected)!], ...labelCandidates] : labelCandidates;
    for (const node of chosen) {
      const id = String(node.node_id), i = index.get(id); if (i == null || wanted.has(id) || wanted.size >= LABEL_LIMIT) continue;
      projection.copy(positions[i]).project(camera);
      if (Math.abs(projection.x) > .95 || Math.abs(projection.y) > .95 || projection.z < -1 || projection.z > 1) continue;
      wanted.add(id);
      if (!labels.has(id)) {
        const text = document.createElement('canvas'); text.width = 384; text.height = 48;
        const ctx = text.getContext('2d')!; ctx.font = '24px system-ui'; ctx.fillStyle = '#d2e4d9'; ctx.fillText(node.symbol.slice(0, 28), 2, 32);
        const texture = new THREE.CanvasTexture(text); texture.colorSpace = THREE.SRGBColorSpace;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
        sprite.scale.set(96, 12, 1); sprite.center.set(0, .5); scene.add(sprite); labels.set(id, sprite);
      }
      labels.get(id)!.position.copy(positions[i]).add(new THREE.Vector3(8, 0, 2));
    }
    for (const id of labels.keys()) if (!wanted.has(id)) releaseLabel(id);
  }
  function invalidate(): void {
    if (disposed || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0; if (disposed) return;
      const moving = controls.update(); updateLabels(); renderer.render(scene, camera);
      canvas.dataset.renderedNodes = String(layout?.nodes.length || 0); canvas.dataset.renderedEdges = String(edgeRecords.length);
      canvas.dataset.geometries = String(renderer.info.memory.geometries); canvas.dataset.textures = String(renderer.info.memory.textures);
      canvas.dataset.drawCalls = String(renderer.info.render.calls);
      if (moving) invalidate();
    });
  }
  controls.addEventListener('change', invalidate);
  const resize = (): void => {
    const parent = canvas.parentElement, w = Math.max(1, parent?.clientWidth || 1), h = Math.max(1, parent?.clientHeight || 1);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); invalidate();
  };
  const observer = new ResizeObserver(resize); observer.observe(canvas.parentElement || canvas); resize();
  function clear(): void {
    for (const id of labels.keys()) releaseLabel(id);
    group.traverse(object => {
      const resource = object as THREE.Mesh;
      resource.geometry?.dispose();
      if (Array.isArray(resource.material)) resource.material.forEach(m => m.dispose()); else resource.material?.dispose();
      if (object instanceof THREE.InstancedMesh) object.dispose();
    });
    group.clear(); mesh = null; lines = null; index.clear(); positions.length = 0; edgeRecords = []; labelCandidates = [];
  }
  function setSelected(nodeId: GraphId | null): void {
    if (mesh && layout) {
      const previous = selected == null ? undefined : index.get(selected);
      if (previous != null) mesh.setColorAt(previous, new THREE.Color(layout.nodes[previous].color));
      selected = nodeId == null ? null : String(nodeId);
      const current = selected == null ? undefined : index.get(selected);
      if (current != null) mesh.setColorAt(current, new THREE.Color('#ffffff'));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    } else selected = nodeId == null ? null : String(nodeId);
    invalidate();
  }
  let down = { x: 0, y: 0 };
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; }, { signal: eventController.signal });
  function pick(event: MouseEvent, open: boolean): void {
    if (!mesh || !layout || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return;
    const rect = canvas.getBoundingClientRect();
    const ray = new THREE.Raycaster(); ray.params.Line.threshold = 2;
    ray.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
    const nodeHit = ray.intersectObject(mesh, false)[0];
    if (nodeHit?.instanceId != null) { (open ? callbacks.onNodeOpen : callbacks.onNodeSelect)?.(layout.nodes[nodeHit.instanceId]); return; }
    if (open || !lines) return;
    const hit = ray.intersectObject(lines, false)[0];
    if (hit?.index != null) {
      const edge = edgeRecords[Math.floor(hit.index / (SEGMENTS * 2))];
      if (edge) callbacks.onEdgeSelect?.(edge, layout.nodes[index.get(String(edge.source))!], layout.nodes[index.get(String(edge.target))!]);
    }
  }
  canvas.addEventListener('click', e => pick(e, false), { signal: eventController.signal });
  canvas.addEventListener('dblclick', e => pick(e, true), { signal: eventController.signal });
  return {
    render(graph, nextLayout, options = {}) {
      clear(); layout = nextLayout;
      if (!layout.nodes.length) { invalidate(); return; }
      const volume = buildProjectVolume(layout);
      mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial(), layout.nodes.length);
      const transform = new THREE.Object3D();
      layout.nodes.forEach((node, i) => {
        index.set(String(node.node_id), i);
        const p = new THREE.Vector3().fromArray(volume.positions, i * 3); positions.push(p);
        transform.position.copy(p); transform.scale.setScalar(Math.max(1.6, node.radius * .55)); transform.updateMatrix();
        mesh!.setMatrixAt(i, transform.matrix); mesh!.setColorAt(i, new THREE.Color(node.color));
      });
      mesh.computeBoundingSphere(); group.add(mesh);
      new THREE.Box3().setFromPoints(positions).expandByScalar(20).getBoundingSphere(bounds);
      const extent = new THREE.Box3().setFromPoints(positions).getSize(new THREE.Vector3());
      canvas.dataset.volumeExtent = JSON.stringify(extent.toArray());
      // Three great-circle contours enclose each community in space, rather
      // than parallel filled planes which disappear when viewed edge-on.
      const ringSegments = 48, rings = new Float32Array(volume.zones.length * 3 * ringSegments * 6);
      const ringColors = new Float32Array(rings.length), zoneColor = new THREE.Color();
      let offset = 0;
      for (const zone of volume.zones) {
        zoneColor.set(zone.color);
        for (let plane = 0; plane < 3; plane++) for (let k = 0; k < ringSegments; k++) {
          for (const angle of [k / ringSegments * Math.PI * 2, (k + 1) / ringSegments * Math.PI * 2]) {
            const point = [...zone.center], u = plane, v = (plane + 1) % 3;
            point[u] += Math.cos(angle) * zone.radii[u]; point[v] += Math.sin(angle) * zone.radii[v];
            rings.set(point, offset); zoneColor.toArray(ringColors, offset); offset += 3;
          }
        }
      }
      const ringGeometry = new THREE.BufferGeometry();
      ringGeometry.setAttribute('position', new THREE.BufferAttribute(rings, 3));
      ringGeometry.setAttribute('color', new THREE.BufferAttribute(ringColors, 3));
      group.add(new THREE.LineSegments(ringGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .13, depthWrite: false })));
      edgeRecords = graph.edges.filter(e => index.has(String(e.source)) && index.has(String(e.target)));
      const vertices = new Float32Array(edgeRecords.length * SEGMENTS * 6), colors = new Float32Array(vertices.length);
      const a = new THREE.Vector3(), b = new THREE.Vector3(), control = new THREE.Vector3(), color = new THREE.Color();
      const ordinals = new Map<string, number>();
      edgeRecords.forEach((edge, i) => {
        const source = positions[index.get(String(edge.source))!], target = positions[index.get(String(edge.target))!];
        const key = JSON.stringify([edge.source, edge.target]), ordinal = ordinals.get(key) || 0; ordinals.set(key, ordinal + 1);
        const dx = target.x - source.x, dy = target.y - source.y, bend = .12 + ordinal * .07;
        control.copy(source).add(target).multiplyScalar(.5).add(new THREE.Vector3(-dy * bend, dx * bend, 8));
        const curve = new THREE.QuadraticBezierCurve3(source, control, target);
        color.set(edge.confidence === 'PROVEN' ? '#687f76' : '#c89e58');
        for (let k = 0; k < SEGMENTS; k++) {
          curve.getPoint(k / SEGMENTS, a); curve.getPoint((k + 1) / SEGMENTS, b);
          if (source === target) { const t = k / SEGMENTS * Math.PI * 2, u = (k + 1) / SEGMENTS * Math.PI * 2; a.copy(source).add(new THREE.Vector3(Math.sin(t) * 12, (1 - Math.cos(t)) * 12, 2)); b.copy(source).add(new THREE.Vector3(Math.sin(u) * 12, (1 - Math.cos(u)) * 12, 2)); }
          const offset = (i * SEGMENTS + k) * 6; a.toArray(vertices, offset); b.toArray(vertices, offset + 3); color.toArray(colors, offset); color.toArray(colors, offset + 3);
        }
      });
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3)); geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); geometry.computeBoundingSphere();
      lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .25, depthWrite: false })); group.add(lines);
      labelCandidates = [...layout.nodes].sort((a, b) => b.degree - a.degree).slice(0, 128);
      setSelected(options.selectedId ?? null);
      if (!fitted) { fitted = true; this.resetView(); }
      invalidate();
    },
    setSelected,
    focusNode(id) { const i = index.get(String(id)); if (i == null) return; const delta = positions[i].clone().sub(controls.target); controls.target.add(delta); camera.position.add(delta); invalidate(); },
    resetView() {
      // Flush any pending orbit inertia before applying the fitted oblique view.
      controls.enableDamping = false; controls.update();
      const distance = fitVolumeDistance(bounds.radius, camera.fov, camera.aspect);
      controls.target.copy(bounds.center);
      camera.position.copy(new THREE.Vector3(.65, .35, 1).normalize().multiplyScalar(distance).add(bounds.center));
      camera.near = Math.max(.1, distance / 1000); camera.far = Math.max(10000, distance * 20); camera.updateProjectionMatrix();
      controls.maxDistance = Math.max(5000, distance * 4); controls.update(); controls.enableDamping = true;
      invalidate();
    },
    zoom(factor) { camera.position.sub(controls.target).multiplyScalar(1 / factor).add(controls.target); invalidate(); },
    dispose() { if (disposed) return; disposed = true; cancelAnimationFrame(frame); observer.disconnect(); eventController.abort(); controls.dispose(); clear(); renderer.dispose(); renderer.forceContextLoss(); },
  };
}
