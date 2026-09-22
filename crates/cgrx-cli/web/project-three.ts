import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type {
  GraphEdge,
  GraphId,
  ProjectLayout,
  ProjectLayoutCommunity,
  ProjectLayoutNode,
  ProjectMap
} from "./types";

const NODE_SEGMENTS = 18;
const COMMUNITY_SEGMENTS = 72;
const COMMUNITY_COLORS = [
  "#49d9c5",
  "#6f9cff",
  "#a67cff",
  "#ed9361",
  "#db6f9d",
  "#69c982",
  "#5bbbea",
  "#d8b95f"
];

export interface ProjectGraphCallbacks {
  onNodeSelect?: (node: ProjectLayoutNode) => void;
  onNodeOpen?: (node: ProjectLayoutNode) => void;
  onEdgeSelect?: (edge: GraphEdge, source: ProjectLayoutNode, target: ProjectLayoutNode) => void;
}

interface PointerOrigin {
  x: number;
  y: number;
}

interface FocusAnimation {
  startedAt: number;
  duration: number;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  fromCamera: THREE.Vector3;
  toCamera: THREE.Vector3;
}

interface TextSpriteOptions {
  color?: string;
  opacity?: number;
  fontSize?: number;
}

interface ProjectRenderOptions {
  selectedId?: GraphId | null;
}

type NodeMesh = THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
type EdgeLine = THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
type LabelSprite = THREE.Sprite;
type CommunitySprite = THREE.Sprite;

export interface ProjectGraphRendererHandle {
  render(graph: ProjectMap, layout: ProjectLayout, options?: ProjectRenderOptions): void;
  setSelected(nodeId: GraphId | null): void;
  focusNode(nodeId: GraphId): void;
  resetView(animate?: boolean): void;
  zoom(factor: number): void;
  dispose(): void;
}

export function createProjectGraphRenderer(
  canvas: HTMLCanvasElement,
  callbacks: ProjectGraphCallbacks = {}
): ProjectGraphRendererHandle {
  return new ProjectGraphRenderer(canvas, callbacks);
}

class ProjectGraphRenderer implements ProjectGraphRendererHandle {
  private readonly canvas: HTMLCanvasElement;
  private readonly callbacks: ProjectGraphCallbacks;
  private graph: ProjectMap | null = null;
  private layout: ProjectLayout | null = null;
  private selectedId: string | null = null;
  private hoveredId: string | null = null;
  private nodeObjects: NodeMesh[] = [];
  private edgeObjects: EdgeLine[] = [];
  private communityObjects: CommunitySprite[] = [];
  private readonly nodeById = new Map<string, NodeMesh>();
  private readonly positionById = new Map<string, THREE.Vector3>();
  private labelObjects: LabelSprite[] = [];
  private activeLabelIds: Set<string> | null = null;
  private disposables: Array<{ dispose?: () => void }> = [];
  private pointerDown: PointerOrigin | null = null;
  private focusAnimation: FocusAnimation | null = null;
  private lastSignature: string | null = null;
  private frameId = 0;
  private disposed = false;
  private readonly eventController = new AbortController();

  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(48, 1, 1, 5000);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly graphGroup = new THREE.Group();
  private readonly nodeGeometry = new THREE.SphereGeometry(1, NODE_SEGMENTS, Math.max(10, NODE_SEGMENTS - 6));
  private readonly glowTexture = makeGlowTexture();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly resizeObserver: ResizeObserver;
  private readonly starfield = makeStarfield();

  constructor(canvas: HTMLCanvasElement, callbacks: ProjectGraphCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    this.scene.background = null;
    this.scene.fog = new THREE.FogExp2(0x080b10, 0.00048);
    this.camera.position.set(0, 0, 900);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x080b10, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.zoomToCursor = true;
    this.controls.minDistance = 100;
    this.controls.maxDistance = 2800;
    this.controls.rotateSpeed = 0.46;
    this.controls.panSpeed = 0.82;
    this.controls.zoomSpeed = 0.85;
    this.controls.target.set(0, 0, 0);

    this.graphGroup.name = "cgrx-project-graph";
    this.scene.add(this.graphGroup);
    this.scene.add(this.starfield);

    this.raycaster.params.Line.threshold = 5;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement || canvas);
    this.bindEvents();
    this.resize();
    this.animate();
  }

  private bindEvents(): void {
    const options = { signal: this.eventController.signal };
    this.canvas.addEventListener("pointerdown", (event) => {
      this.pointerDown = { x: event.clientX, y: event.clientY };
    }, options);
    this.canvas.addEventListener("pointermove", (event) => this.handlePointerMove(event), options);
    this.canvas.addEventListener("pointerleave", () => {
      this.hoveredId = null;
      this.canvas.style.cursor = "grab";
      this.applyFocus(this.selectedId);
    }, options);
    this.canvas.addEventListener("click", (event) => this.handleClick(event), options);
    this.canvas.addEventListener("dblclick", (event) => this.handleDoubleClick(event), options);
  }

  private resize(): void {
    const parent = this.canvas.parentElement;
    const width = Math.max(1, parent?.clientWidth || this.canvas.clientWidth || 1);
    const height = Math.max(1, parent?.clientHeight || this.canvas.clientHeight || 1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render(graph: ProjectMap, layout: ProjectLayout, { selectedId = null }: ProjectRenderOptions = {}): void {
    this.graph = graph;
    this.layout = layout;
    this.selectedId = selectedId == null ? null : String(selectedId);
    const signature = `${graph.snapshot?.repo_revision || ""}:${graph.snapshot?.graph_generation || ""}:${layout.nodes.length}:${graph.edges?.length || 0}`;
    const shouldFit = this.lastSignature !== signature;
    this.lastSignature = signature;
    this.clearGraph();

    const communityIndex = new Map((layout.communities || []).map((community, index) => [community.id, index]));
    const communityCount = Math.max(1, communityIndex.size);
    const scale = Math.max(0.9, Math.min(1.45, 1180 / Math.max(980, layout.width)));

    for (const community of layout.communities || []) {
      this.addCommunity(community, communityIndex.get(community.id) || 0, communityCount, layout, scale);
    }

    for (const node of layout.nodes || []) {
      const position = projectPosition(node, layout, communityIndex, communityCount, scale);
      this.positionById.set(String(node.node_id), position);
      this.addNode(node, position);
    }

    for (const edge of graph.edges || []) this.addEdge(edge);
    this.applyFocus(this.selectedId);
    if (shouldFit) this.resetView(false);
    this.updateLabelVisibility();
  }

  private clearGraph(): void {
    this.graphGroup.clear();
    for (const disposable of this.disposables) disposable.dispose?.();
    this.disposables = [];
    this.nodeObjects = [];
    this.edgeObjects = [];
    this.communityObjects = [];
    this.nodeById.clear();
    this.positionById.clear();
    this.labelObjects = [];
    this.activeLabelIds = null;
  }

  private addCommunity(
    community: ProjectLayoutCommunity,
    index: number,
    communityCount: number,
    layout: ProjectLayout,
    scale: number
  ): void {
    const center = projectPoint(community.x, community.y, layout, scale);
    center.z = communityDepth(index, communityCount) * 0.72;
    const radius = Math.max(44, community.radius * scale);
    const communityColor = new THREE.Color(COMMUNITY_COLORS[index % COMMUNITY_COLORS.length]);

    const cloudMaterial = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: communityColor,
      transparent: true,
      opacity: 0.065,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending
    });
    const cloud = new THREE.Sprite(cloudMaterial);
    cloud.position.copy(center).add(new THREE.Vector3(0, 0, -18));
    cloud.scale.set(radius * 2.75, radius * 2.2, 1);
    cloud.renderOrder = -3;
    cloud.userData = { kind: "community", communityId: community.id, baseOpacity: cloudMaterial.opacity };
    this.graphGroup.add(cloud);
    this.communityObjects.push(cloud);
    this.disposables.push(cloudMaterial);

    const points: THREE.Vector3[] = [];
    for (let step = 0; step < COMMUNITY_SEGMENTS; step += 1) {
      const angle = step / COMMUNITY_SEGMENTS * Math.PI * 2;
      points.push(new THREE.Vector3(
        center.x + Math.cos(angle) * radius,
        center.y + Math.sin(angle) * radius,
        center.z
      ));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: communityColor,
      transparent: true,
      opacity: 0.1,
      depthWrite: false
    });
    const ring = new THREE.LineLoop(geometry, material);
    ring.renderOrder = -1;
    this.graphGroup.add(ring);
    this.disposables.push(geometry, material);

    const label = makeTextSprite(shorten(community.label || `cluster ${index + 1}`, 28), {
      color: COMMUNITY_COLORS[index % COMMUNITY_COLORS.length],
      opacity: 0.62,
      fontSize: 12
    });
    label.position.set(center.x - radius * 0.72, center.y + radius * 0.72, center.z + 4);
    label.scale.multiplyScalar(0.9);
    this.graphGroup.add(label);
    this.disposables.push(label.material);
    if (label.material.map) this.disposables.push(label.material.map);
  }

  private addNode(node: ProjectLayoutNode, position: THREE.Vector3): void {
    const baseColor = new THREE.Color(node.color || "#69d8ff");
    const material = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.9,
      depthWrite: true
    });
    const mesh: NodeMesh = new THREE.Mesh(this.nodeGeometry, material);
    mesh.position.copy(position);
    mesh.scale.setScalar(Math.max(3.2, node.radius * 0.64));
    mesh.userData = { kind: "node", node, baseColor: baseColor.clone() };
    this.graphGroup.add(mesh);
    this.nodeObjects.push(mesh);
    this.nodeById.set(String(node.node_id), mesh);
    this.disposables.push(material);

    const haloMaterial = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: baseColor,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const halo = new THREE.Sprite(haloMaterial);
    const haloSize = Math.max(13, node.radius * 3.4);
    halo.scale.set(haloSize / mesh.scale.x, haloSize / mesh.scale.y, 1);
    halo.userData = { kind: "halo", nodeId: String(node.node_id), baseOpacity: 0.11 };
    mesh.add(halo);
    this.disposables.push(haloMaterial);

    if (node.cycle) {
      const cycleMaterial = new THREE.MeshBasicMaterial({
        color: 0xf2c66d,
        wireframe: true,
        transparent: true,
        opacity: 0.72,
        depthWrite: false
      });
      const shell = new THREE.Mesh(this.nodeGeometry, cycleMaterial);
      shell.scale.setScalar(1.17);
      mesh.add(shell);
      this.disposables.push(cycleMaterial);
    }

    const label = makeTextSprite(shorten(node.symbol, 28), {
      color: "#dcebf6",
      opacity: node.showLabel ? 0.88 : 0,
      fontSize: 13
    });
    label.position.copy(position).add(new THREE.Vector3(Math.max(12, node.radius + 8), 0, 4));
    label.userData = {
      kind: "label",
      nodeId: String(node.node_id),
      major: Boolean(node.showLabel)
    };
    this.graphGroup.add(label);
    this.labelObjects.push(label);
    this.disposables.push(label.material);
    if (label.material.map) this.disposables.push(label.material.map);
  }

  private addEdge(edge: GraphEdge): void {
    const source = this.positionById.get(String(edge.source));
    const target = this.positionById.get(String(edge.target));
    if (!source || !target) return;
    const geometry = new THREE.BufferGeometry().setFromPoints(curvedEdgePoints(source, target, `${edge.source}:${edge.target}`));
    const weight = Math.max(1, Number(edge.weight || 1));
    const opacity = Math.max(0.045, Math.min(0.28, 0.05 + Math.log2(weight + 1) * 0.038));
    const material = new THREE.LineBasicMaterial({
      color: 0x718092,
      transparent: true,
      opacity,
      depthWrite: false
    });
    const line: EdgeLine = new THREE.Line(geometry, material);
    line.userData = { kind: "edge", edge, baseOpacity: opacity };
    this.graphGroup.add(line);
    this.edgeObjects.push(line);
    this.disposables.push(geometry, material);
  }

  setSelected(nodeId: GraphId | null): void {
    this.selectedId = nodeId == null ? null : String(nodeId);
    this.applyFocus(this.hoveredId || this.selectedId);
  }

  focusNode(nodeId: GraphId): void {
    const object = this.nodeById.get(String(nodeId));
    if (!object) return;
    const target = object.position.clone();
    const offset = this.camera.position.clone().sub(this.controls.target);
    const distance = THREE.MathUtils.clamp(offset.length(), 260, 560);
    if (offset.lengthSq() < 1) offset.set(0, 0, 1);
    offset.normalize().multiplyScalar(distance);
    const destination = target.clone().add(offset);
    this.focusAnimation = {
      startedAt: performance.now(),
      duration: 420,
      fromTarget: this.controls.target.clone(),
      toTarget: target,
      fromCamera: this.camera.position.clone(),
      toCamera: destination
    };
  }

  resetView(animate = true): void {
    if (!this.nodeObjects.length) return;
    const box = new THREE.Box3();
    for (const node of this.nodeObjects) box.expandByPoint(node.position);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(90, sphere.radius + 70);
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const distance = THREE.MathUtils.clamp(radius / Math.tan(fov / 2) * 1.06, 320, 2200);
    const target = sphere.center;
    const destination = new THREE.Vector3(target.x, target.y + radius * 0.08, target.z + distance);
    if (!animate) {
      this.controls.target.copy(target);
      this.camera.position.copy(destination);
      this.controls.update();
      return;
    }
    this.focusAnimation = {
      startedAt: performance.now(),
      duration: 460,
      fromTarget: this.controls.target.clone(),
      toTarget: target.clone(),
      fromCamera: this.camera.position.clone(),
      toCamera: destination
    };
  }

  zoom(factor: number): void {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const distance = THREE.MathUtils.clamp(
      offset.length() / factor,
      this.controls.minDistance,
      this.controls.maxDistance
    );
    if (offset.lengthSq() < 1) offset.set(0, 0, 1);
    this.camera.position.copy(this.controls.target).add(offset.normalize().multiplyScalar(distance));
    this.controls.update();
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.layout) return;
    const hit = this.pick(event, true);
    const nextId = hit?.object?.userData?.kind === "node" ? String(hit.object.userData.node.node_id) : null;
    if (nextId === this.hoveredId) return;
    this.hoveredId = nextId;
    this.canvas.style.cursor = nextId ? "pointer" : "grab";
    this.applyFocus(this.hoveredId || this.selectedId);
  }

  private handleClick(event: MouseEvent): void {
    if (!this.layout || movedTooFar(this.pointerDown, event)) return;
    const hit = this.pick(event, false);
    if (!hit) return;
    if (hit.object.userData.kind === "node") {
      this.callbacks.onNodeSelect?.(hit.object.userData.node as ProjectLayoutNode);
      return;
    }
    if (hit.object.userData.kind === "edge") {
      const edge = hit.object.userData.edge as GraphEdge;
      const source = this.layout.nodes.find((node) => String(node.node_id) === String(edge.source));
      const target = this.layout.nodes.find((node) => String(node.node_id) === String(edge.target));
      if (source && target) this.callbacks.onEdgeSelect?.(edge, source, target);
    }
  }

  private handleDoubleClick(event: MouseEvent): void {
    const hit = this.pick(event, true);
    if (hit?.object?.userData?.kind === "node") {
      this.callbacks.onNodeOpen?.(hit.object.userData.node as ProjectLayoutNode);
    }
  }

  private pick(event: MouseEvent | PointerEvent, nodesOnly: boolean): THREE.Intersection | null {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const nodes = this.raycaster.intersectObjects(this.nodeObjects, false);
    if (nodes.length || nodesOnly) return nodes[0] || null;
    const edges = this.raycaster.intersectObjects(this.edgeObjects, false);
    return edges[0] || null;
  }

  private applyFocus(nodeId: string | null): void {
    const focus = nodeId == null ? null : String(nodeId);
    const neighborhood = new Set<string>(focus ? [focus] : []);
    if (focus) {
      for (const edge of this.graph?.edges || []) {
        const source = String(edge.source);
        const target = String(edge.target);
        if (source === focus) neighborhood.add(target);
        if (target === focus) neighborhood.add(source);
      }
    }
    this.activeLabelIds = focus ? neighborhood : null;
    const focusedCommunity = focus
      ? this.layout?.nodes.find((node) => String(node.node_id) === focus)?.community
      : null;

    for (const mesh of this.nodeObjects) {
      const id = String(mesh.userData.node.node_id);
      const active = !focus || neighborhood.has(id);
      const direct = id === focus;
      mesh.material.opacity = active ? 0.94 : 0.075;
      mesh.material.color.copy(mesh.userData.baseColor as THREE.Color);
      if (direct) mesh.material.color.lerp(new THREE.Color(0xffffff), 0.34);
      const halo = mesh.children.find((child) => child.userData.kind === "halo") as LabelSprite | undefined;
      if (halo) halo.material.opacity = direct ? 0.48 : active ? 0.14 : 0.012;
    }

    for (const line of this.edgeObjects) {
      const edge = line.userData.edge as GraphEdge;
      const connected = Boolean(focus && (String(edge.source) === focus || String(edge.target) === focus));
      line.material.opacity = !focus ? Number(line.userData.baseOpacity) : connected ? 0.92 : 0.014;
      line.material.color.setHex(connected ? 0xf1fbff : 0x718092);
    }
    for (const cloud of this.communityObjects) {
      const active = !focus || cloud.userData.communityId === focusedCommunity;
      cloud.material.opacity = Number(cloud.userData.baseOpacity) * (active ? 1 : 0.24);
    }
    this.updateLabelVisibility();
  }

  private updateLabelVisibility(): void {
    const distance = this.camera.position.distanceTo(this.controls.target);
    const showMinor = distance < 650;
    const focus = this.hoveredId || this.selectedId;
    for (const label of this.labelObjects) {
      const nodeId = String(label.userData.nodeId);
      const focused = Boolean(focus && nodeId === String(focus));
      const inFocus = !this.activeLabelIds || this.activeLabelIds.has(nodeId);
      label.visible = inFocus && (Boolean(label.userData.major) || showMinor || focused);
      label.material.opacity = focused ? 1 : label.userData.major ? 0.84 : 0.66;
    }
  }

  private animate(): void {
    if (this.disposed) return;
    this.frameId = requestAnimationFrame(() => this.animate());
    if (this.canvas.hidden) return;
    if (this.focusAnimation) this.stepFocusAnimation();
    this.controls.update();
    this.updateLabelVisibility();
    this.renderer.render(this.scene, this.camera);
  }

  private stepFocusAnimation(): void {
    const animation = this.focusAnimation;
    if (!animation) return;
    const progress = THREE.MathUtils.clamp(
      (performance.now() - animation.startedAt) / animation.duration,
      0,
      1
    );
    const eased = 1 - Math.pow(1 - progress, 3);
    this.controls.target.lerpVectors(animation.fromTarget, animation.toTarget, eased);
    this.camera.position.lerpVectors(animation.fromCamera, animation.toCamera, eased);
    if (progress >= 1) this.focusAnimation = null;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    this.eventController.abort();
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.clearGraph();
    this.nodeGeometry.dispose();
    this.glowTexture.dispose();
    this.starfield.geometry.dispose();
    this.starfield.material.dispose();
    this.renderer.dispose();
  }
}

function projectPosition(
  node: ProjectLayoutNode,
  layout: ProjectLayout,
  communityIndex: Map<string, number>,
  communityCount: number,
  scale: number
): THREE.Vector3 {
  const point = projectPoint(node.x, node.y, layout, scale);
  const index = communityIndex.get(node.community) || 0;
  point.z = communityDepth(index, communityCount) + seededSigned(String(node.node_id)) * 58;
  return point;
}

function curvedEdgePoints(source: THREE.Vector3, target: THREE.Vector3, seed: string): THREE.Vector3[] {
  const midpoint = source.clone().lerp(target, 0.5);
  const direction = target.clone().sub(source);
  const distance = Math.max(1, direction.length());
  const normal = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
  const bend = Math.min(42, Math.max(8, distance * 0.085)) * seededSigned(seed);
  midpoint.addScaledVector(normal, bend);
  midpoint.z += Math.min(24, distance * 0.035);
  return new THREE.QuadraticBezierCurve3(source, midpoint, target).getPoints(18);
}

function projectPoint(x: number, y: number, layout: ProjectLayout, scale: number): THREE.Vector3 {
  return new THREE.Vector3(
    (Number(x) - layout.width / 2) * scale,
    -(Number(y) - layout.height / 2) * scale,
    0
  );
}

function communityDepth(index: number, count: number): number {
  if (count <= 1) return 0;
  const centered = index - (count - 1) / 2;
  return THREE.MathUtils.clamp(centered * 26, -150, 150);
}

function seededSigned(value: string): number {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) / 4294967295) * 2 - 1;
}

function makeGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas context is unavailable");
  const gradient = context.createRadialGradient(48, 48, 0, 48, 48, 48);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.34, "rgba(255,255,255,.62)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 96, 96);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeTextSprite(text: string, options: TextSpriteOptions = {}): LabelSprite {
  const fontSize = options.fontSize || 13;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas context is unavailable");
  context.font = `600 ${fontSize * 2}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  const width = Math.ceil(context.measureText(text).width + 28);
  canvas.width = Math.max(64, width);
  canvas.height = Math.ceil(fontSize * 3.2);
  context.font = `600 ${fontSize * 2}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  context.textBaseline = "middle";
  context.fillStyle = options.color || "#dcebf6";
  context.shadowColor = "rgba(0,0,0,.94)";
  context.shadowBlur = 7;
  context.fillText(text, 12, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: options.opacity ?? 0.86,
    depthWrite: false,
    depthTest: false
  });
  const sprite: LabelSprite = new THREE.Sprite(material);
  const worldHeight = 18;
  sprite.scale.set(worldHeight * canvas.width / canvas.height, worldHeight, 1);
  sprite.center.set(0, 0.5);
  sprite.renderOrder = 10;
  return sprite;
}

function makeStarfield(): THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> {
  const geometry = new THREE.BufferGeometry();
  const count = 850;
  const positions = new Float32Array(count * 3);
  let seed = 0x8f31d92b;
  const random = (): number => {
    seed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    seed ^= seed + Math.imul(seed ^ (seed >>> 7), 61 | seed);
    return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 2600;
    positions[index * 3 + 1] = (random() - 0.5) * 1800;
    positions[index * 3 + 2] = -250 - random() * 1200;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0x678095,
    size: 1.7,
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });
  return new THREE.Points(geometry, material);
}

function movedTooFar(start: PointerOrigin | null, event: MouseEvent): boolean {
  if (!start) return false;
  return Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5;
}

function shorten(value: unknown, limit: number): string {
  const text = String(value || "");
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}
