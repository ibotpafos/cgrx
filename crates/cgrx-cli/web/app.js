import { edgeStyle, layoutGraph } from "./layout.js";
import { createState, projectGraph, reduce, serializeAgentPlan, snapshotKey } from "./state.js";

const NS = "http://www.w3.org/2000/svg";
const tokenKey = `cgrx-token:${location.host}`;
const fragment = new URLSearchParams(location.hash.slice(1));
const capability = fragment.get("token") || sessionStorage.getItem(tokenKey) || "";
if (capability) sessionStorage.setItem(tokenKey, capability);
if (location.hash) history.replaceState(null, "", `${location.pathname}${location.search}`);

let state = createState();
let currentGraph = null;
let currentCandidate = null;
let currentStrategy = null;
let requestGeneration = 0;
let changedPaths = [];
let panStart = null;

const ids = [
  "freshness", "revision", "search-form", "search-input", "search-results", "match-count",
  "refactor-list", "candidate-count", "graph-title", "graph-message", "graph-canvas",
  "camera-layer", "inspector-content", "selection-kind", "strategy-panel", "strategy-tabs",
  "strategy-detail", "copy-agent", "copy-mcp", "announcer", "zoom-in", "zoom-out", "reset-view"
];
const el = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));

async function api(path) {
  const response = await fetch(path, {
    headers: { "X-CGRX-Token": capability },
    cache: "no-store"
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value?.error?.detail || `Request failed: ${response.status}`);
  return value;
}

export async function loadStatus() {
  const value = await api("/api/status");
  const changed = Boolean(snapshotKey(state.snapshot)
    && snapshotKey(state.snapshot) !== snapshotKey(value.snapshot));
  state = reduce(state, { type: "status", snapshot: value.snapshot });
  changedPaths = value.changed_paths || [];
  el.revision.textContent = `${value.snapshot.repo_revision.slice(0, 9)} · g${value.snapshot.graph_generation}`;
  el.freshness.textContent = changed ? "refreshing" : "live";
  el.freshness.className = `badge badge--${changed ? "stale" : "live"}`;
  if (changed) {
    currentStrategy = null;
    currentCandidate = null;
    el["strategy-panel"].hidden = true;
    await loadRefactors();
    if (currentGraph?.root) await loadGraph(currentGraph.root.symbol, currentGraph.root.path);
  }
  return value;
}

async function search(query) {
  const value = await api(`/api/search?q=${encodeURIComponent(query)}&scope=**&limit=12`);
  el["match-count"].textContent = value.total;
  el["search-results"].replaceChildren(...value.matches.map((match) => itemButton(
    match.symbol,
    `${match.path}:${match.span.start}`,
    () => loadGraph(match.symbol, match.path)
  )));
  if (!value.matches.length) {
    el["search-results"].innerHTML = '<p class="quiet">No match in this bounded search.</p>';
  }
}

async function loadGraph(symbol, path) {
  const generation = ++requestGeneration;
  state = reduce(state, { type: "request", generation });
  setMessage("Loading verified neighborhood…");
  const value = await api(
    `/api/graph?symbol=${encodeURIComponent(symbol)}&path=${encodeURIComponent(path)}&direction=both&depth=1&node_limit=80&edge_limit=160`
  );
  if (generation !== requestGeneration) return;
  currentGraph = value;
  state = reduce(state, {
    type: "graph",
    snapshot: value.snapshot,
    nodeIds: value.nodes.map((node) => node.node_id),
    generation
  });
  el["graph-title"].textContent = value.root.symbol;
  el["graph-message"].hidden = true;
  renderMode();
}

async function loadRefactors() {
  try {
    const value = await api("/api/refactors?scope=**&min_score=760&limit=8");
    el["candidate-count"].textContent = value.total;
    el["refactor-list"].replaceChildren(...value.candidates.map((candidate) => itemButton(
      `${candidate.left.symbol} ↔ ${candidate.right.symbol}`,
      `${candidate.language} · score ${candidate.similarity.total}`,
      () => selectCandidate(candidate)
    )));
    if (!value.candidates.length) {
      el["refactor-list"].innerHTML = '<p class="quiet">No candidate crossed the current threshold.</p>';
    }
  } catch (error) {
    el["refactor-list"].innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  }
}

function renderGraph(graph) {
  const layer = el["camera-layer"];
  layer.replaceChildren();
  drawGraph(graph, layer);
  applyCamera();
}

function drawGraph(graph, layer) {
  const viewport = el["graph-canvas"].getBoundingClientRect();
  const layout = layoutGraph(graph, { width: viewport.width, height: viewport.height });
  for (const [label, x, y] of [
    ["CALLERS", 96, 54],
    ["ENTRY POINT", 382, 54],
    ["CALLEES", 668, 54],
    ["TESTS · NOT RUN", 382, 380]
  ]) {
    layer.append(svgText(label, x, y, "lane-label"));
  }
  for (const container of layout.containers) {
    layer.append(
      svg("rect", {
        x: container.x, y: container.y, width: container.width, height: container.height,
        class: "file-container"
      }),
      svgText(shorten(container.path, 46), container.x + 10, container.y + 17, "file-label")
    );
  }
  const byId = new Map(layout.nodes.map((node) => [String(node.node_id), node]));
  for (const edge of graph.edges || []) {
    const source = byId.get(String(edge.source));
    const target = byId.get(String(edge.target));
    if (source && target) layer.append(renderEdge(source, target, edge));
  }
  for (const node of layout.nodes) layer.append(renderNode(node));
}

function renderMode() {
  if (!currentGraph) return;
  if (state.mode === "compare" && currentStrategy) {
    const layer = el["camera-layer"];
    layer.replaceChildren();
    layer.append(svgText("CURRENT EVIDENCE", 34, 34, "comparison-title"));
    layer.append(svgText("SELECTED FUTURE", 524, 34, "comparison-title"));
    const currentPane = svg("g", { transform: "translate(0 46) scale(.5)" });
    const futurePane = svg("g", { transform: "translate(490 46) scale(.5)" });
    drawGraph(currentGraph, currentPane);
    drawGraph(projectGraph(currentGraph, currentStrategy), futurePane);
    layer.append(currentPane, futurePane);
    applyCamera();
    return;
  }
  if (state.mode === "preview" && currentStrategy) {
    renderGraph(projectGraph(currentGraph, currentStrategy));
    return;
  }
  const graph = state.mode === "changes"
    ? { ...currentGraph, nodes: currentGraph.nodes.map((node) => ({ ...node, changed: changedPaths.includes(node.path) })) }
    : currentGraph;
  renderGraph(graph);
}

function renderEdge(source, target, edge) {
  const group = svg("g", {
    tabindex: "0",
    role: "button",
    "aria-label": `${source.symbol} ${edge.relation} ${target.symbol}, ${edge.confidence}`
  });
  const sx = source.x + source.width;
  const sy = source.y + source.height / 2;
  const tx = target.x;
  const ty = target.y + target.height / 2;
  const middle = (sx + tx) / 2;
  const style = edgeStyle(edge);
  group.append(
    svg("path", {
      d: `M ${sx} ${sy} H ${middle} V ${ty} H ${tx}`,
      class: style.className,
      "stroke-dasharray": style.dash
    }),
    svgText(style.marker, middle + 5, ty - 6, "edge-label")
  );
  const inspect = () => inspectEdge(edge, source, target);
  group.addEventListener("click", inspect);
  group.addEventListener("keydown", activate(inspect));
  return group;
}

function renderNode(node) {
  const group = svg("g", {
    transform: `translate(${node.x} ${node.y})`,
    class: `node ${node.lane === "tests" ? "node--test " : ""}${node.changed ? "node--changed " : ""}${state.selectedNodeId === node.node_id ? "is-selected" : ""}`,
    tabindex: "0",
    role: "button",
    "aria-label": `${node.symbol}, ${node.path}, ${node.lane}`
  });
  group.append(
    svg("rect", { width: node.width, height: node.height }),
    svg("circle", { cx: 15, cy: 17, r: 4, class: "node__status" }),
    svgText(shorten(node.symbol, 27), 27, 21, "node__title"),
    svgText(shorten(node.path, 31), 14, 45, "node__path")
  );
  const select = () => selectNode(node);
  group.addEventListener("click", select);
  group.addEventListener("keydown", activate(select));
  return group;
}

async function selectNode(node) {
  state = reduce(state, { type: "select", nodeId: node.node_id });
  el["selection-kind"].textContent = node.lane;
  el["inspector-content"].innerHTML = facts([
    ["Symbol", node.symbol],
    ["Path", node.path],
    ["Span", `${node.span.start}–${node.span.end}`],
    ["Source hash", node.source_hash],
    ["State", node.lane === "tests" ? "candidate · not run" : "current · indexed"]
  ]);
  renderMode();
  try {
    const snippet = await api(
      `/api/snippet?symbol=${encodeURIComponent(node.symbol)}&path=${encodeURIComponent(node.path)}`
    );
    const pre = document.createElement("pre");
    pre.className = "code";
    pre.textContent = snippet.source || snippet.declaration || "Source unavailable.";
    el["inspector-content"].append(pre);
  } catch (error) {
    appendError(error.message);
  }
}

function inspectEdge(edge, source, target) {
  el["selection-kind"].textContent = "edge";
  const evidence = edge.evidence || {};
  el["inspector-content"].innerHTML = facts([
    ["Relationship", `${source.symbol} → ${target.symbol}`],
    ["Kind", edge.relation],
    ["Confidence", edge.confidence],
    ["Resolver", evidence.resolver || "indexed"],
    ["Evidence site", evidence.path ? `${evidence.path}:${evidence.span?.start ?? "?"}` : "hypothetical"],
    ["Source hash", evidence.source_hash || "not applicable"]
  ]);
}

function selectCandidate(candidate) {
  currentCandidate = candidate;
  el["strategy-panel"].hidden = false;
  el["strategy-tabs"].replaceChildren(...candidate.strategies.map((strategy) => {
    const button = document.createElement("button");
    button.type = "button";
    button.role = "tab";
    button.textContent = strategy.policy.replaceAll("_", " ");
    button.addEventListener("click", () => selectStrategy(strategy));
    return button;
  }));
  selectStrategy(candidate.strategies[0]);
  loadGraph(candidate.left.symbol, candidate.left.path);
}

function selectStrategy(strategy) {
  currentStrategy = strategy;
  state = reduce(state, { type: "strategy", strategyId: strategy.strategy_id });
  [...el["strategy-tabs"].children].forEach((button, index) => {
    button.setAttribute(
      "aria-selected",
      String(currentCandidate.strategies[index].strategy_id === strategy.strategy_id)
    );
  });
  const blocked = strategy.status === "blocked_by_gaps";
  el["strategy-detail"].innerHTML =
    `<p class="strategy-summary">${escapeHtml(strategy.summary)}</p>`
    + `<span class="risk ${blocked ? "risk--blocked" : ""}">`
    + escapeHtml(blocked ? "blocked by gaps" : `${strategy.risk} risk · hypothetical`)
    + "</span>";
  if (state.mode === "preview" || state.mode === "compare") renderMode();
}

function itemButton(title, subtitle, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "item";
  const strong = document.createElement("strong");
  const small = document.createElement("small");
  strong.textContent = title;
  small.textContent = subtitle;
  button.append(strong, small);
  button.addEventListener("click", onClick);
  return button;
}

function setMessage(message) {
  el["graph-message"].hidden = false;
  el["graph-message"].innerHTML = `<strong>${escapeHtml(message)}</strong>`;
}

function facts(entries) {
  return `<dl>${entries.map(([term, value]) =>
    `<div class="fact"><dt>${escapeHtml(term)}</dt><dd><code>${escapeHtml(String(value ?? "unknown"))}</code></dd></div>`
  ).join("")}</dl>`;
}

function appendError(message) {
  const paragraph = document.createElement("p");
  paragraph.className = "error";
  paragraph.textContent = message;
  el["inspector-content"].append(paragraph);
}

function svg(name, attributes = {}) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

function svgText(content, x, y, className) {
  const node = svg("text", { x, y, class: className });
  node.textContent = content;
  return node;
}

function activate(callback) {
  return (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      callback();
    }
  };
}

function shorten(value, limit) {
  const text = String(value);
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}

function escapeHtml(value) {
  const replacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
  return String(value).replace(/[&<>'"]/g, (character) => replacements[character]);
}

function applyCamera() {
  const { x, y, scale } = state.camera;
  el["camera-layer"].setAttribute("transform", `translate(${x} ${y}) scale(${scale})`);
}

function zoom(factor) {
  const scale = Math.max(.45, Math.min(2.4, state.camera.scale * factor));
  state = reduce(state, { type: "camera", camera: { ...state.camera, scale } });
  applyCamera();
}

el["search-form"].addEventListener("submit", (event) => {
  event.preventDefault();
  search(el["search-input"].value.trim()).catch((error) => {
    el["search-results"].innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  });
});
document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => {
  state = reduce(state, { type: "mode", mode: button.dataset.mode });
  document.querySelectorAll("[data-mode]").forEach((candidate) => {
    candidate.classList.toggle("is-active", candidate === button);
  });
  renderMode();
}));
el["zoom-in"].addEventListener("click", () => zoom(1.2));
el["zoom-out"].addEventListener("click", () => zoom(1 / 1.2));
el["reset-view"].addEventListener("click", () => {
  state = reduce(state, { type: "camera", camera: { x: 0, y: 0, scale: 1 } });
  applyCamera();
});
el["graph-canvas"].addEventListener("wheel", (event) => {
  event.preventDefault();
  zoom(event.deltaY < 0 ? 1.08 : 1 / 1.08);
}, { passive: false });
el["graph-canvas"].addEventListener("pointerdown", (event) => {
  if (event.target.closest?.(".node, g[role=button]")) return;
  panStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, camera: state.camera };
  el["graph-canvas"].setPointerCapture(event.pointerId);
});
el["graph-canvas"].addEventListener("pointermove", (event) => {
  if (!panStart || panStart.pointerId !== event.pointerId) return;
  state = reduce(state, {
    type: "camera",
    camera: {
      ...panStart.camera,
      x: panStart.camera.x + event.clientX - panStart.x,
      y: panStart.camera.y + event.clientY - panStart.y
    }
  });
  applyCamera();
});
el["graph-canvas"].addEventListener("pointerup", () => { panStart = null; });
el["graph-canvas"].addEventListener("keydown", (event) => {
  const movement = { ArrowLeft: [-28, 0], ArrowRight: [28, 0], ArrowUp: [0, -28], ArrowDown: [0, 28] }[event.key];
  if (!movement) return;
  event.preventDefault();
  state = reduce(state, {
    type: "camera",
    camera: { ...state.camera, x: state.camera.x + movement[0], y: state.camera.y + movement[1] }
  });
  applyCamera();
});
el["copy-agent"].addEventListener("click", () => {
  if (currentStrategy) copy(serializeAgentPlan(currentStrategy), "Agent plan copied");
});
el["copy-mcp"].addEventListener("click", () => {
  if (!currentCandidate) return;
  copy(JSON.stringify({
    tool: "suggest_refactors",
    arguments: {
      scope: { include: ["**"], exclude: [], relation_kinds: ["CALLS", "IMPLEMENTS"], max_depth: 1 },
      language: currentCandidate.language,
      min_score: 760,
      limit: 8
    },
    revalidate_snapshot: state.snapshot
  }, null, 2), "MCP call copied");
});

async function copy(value, announcement) {
  await navigator.clipboard.writeText(value);
  el.announcer.textContent = announcement;
}

Promise.all([loadStatus(), loadRefactors()]).catch((error) => {
  el.freshness.textContent = "offline";
  el.freshness.className = "badge badge--stale";
  setMessage(error.message);
});
setInterval(() => loadStatus().catch(() => {
  el.freshness.textContent = "offline";
  el.freshness.className = "badge badge--stale";
}), 2500);
