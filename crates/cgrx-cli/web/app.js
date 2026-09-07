import { edgeStyle, layoutGraph } from "./layout.js";
import "./vendor/web-git-graph.js";
import { CgrxGitGraphProvider } from "./git-history.js";
import { graphEvidenceQuery, runtimeAgentHandoff, runtimeEdgePresentation } from "./runtime-evidence.js";
import { architectureAgentHandoff, createState, projectArchitecture, projectArchitectureFuture, projectGraph, reduce, serializeAgentPlan, snapshotKey, summarizeBoundedResult } from "./state.js";

const NS = "http://www.w3.org/2000/svg";
const tokenKey = `cgrx-token:${location.host}`;
const fragment = new URLSearchParams(location.hash.slice(1));
const capability = fragment.get("token") || sessionStorage.getItem(tokenKey) || "";
if (capability) sessionStorage.setItem(tokenKey, capability);
if (location.hash) history.replaceState(null, "", `${location.pathname}${location.search}`);

let state = createState();
let currentGraph = null;
let currentArchitecture = null;
let currentArchitectureIssue = null;
let currentCandidate = null;
let currentStrategy = null;
let historyConnected = false;
let requestGeneration = 0;
let changedPaths = [];
let panStart = null;
let nodeDrag = null;
let pinnedPositions = {};
let evidenceMode = "static";
let runtimeStatus = null;

const ids = [
  "freshness", "revision", "search-form", "search-input", "search-results", "match-count",
  "refactor-list", "candidate-count", "runtime-list", "runtime-count", "architecture-future-list", "architecture-future-count", "graph-title", "graph-message", "graph-canvas",
  "graph-svg", "camera-layer", "git-history-panel", "git-history", "inspector-content", "selection-kind", "strategy-panel", "strategy-tabs",
  "strategy-detail", "copy-agent", "copy-mcp", "copy-runtime-agent", "runtime-environment", "announcer", "zoom-in", "zoom-out", "reset-view"
];
const el = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));

async function api(path, signal) {
  const response = await fetch(path, {
    headers: { "X-CGRX-Token": capability },
    cache: "no-store",
    signal
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
    currentArchitectureIssue = null;
    el["strategy-panel"].hidden = true;
    await loadRefactors();
    await loadArchitecture();
    if (historyConnected) el["git-history"].refresh();
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
    `/api/graph?symbol=${encodeURIComponent(symbol)}&path=${encodeURIComponent(path)}&direction=both&depth=1&node_limit=80&edge_limit=160&${graphEvidenceQuery(evidenceMode, el["runtime-environment"].value ? [el["runtime-environment"].value] : [])}`
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
    const summary = summarizeBoundedResult(value);
    el["candidate-count"].textContent = summary.count;
    const children = value.candidates.map((candidate) => itemButton(
      `${candidate.left.symbol} ↔ ${candidate.right.symbol}`,
      `${candidate.language} · score ${candidate.similarity.total}`,
      () => selectCandidate(candidate)
    ));
    if (summary.note) {
      const note = document.createElement("p");
      note.className = "quiet bounded-note";
      note.textContent = summary.note;
      children.push(note);
    }
    el["refactor-list"].replaceChildren(...children);
    if (!value.candidates.length) {
      el["refactor-list"].innerHTML = '<p class="quiet">No candidate crossed the current threshold.</p>';
    }
  } catch (error) {
    el["refactor-list"].innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  }
}

async function loadRuntimeIntelligence() {
  runtimeStatus = await api("/api/runtime-status");
  const selectedEnvironment = el["runtime-environment"].value;
  el["runtime-environment"].replaceChildren(new Option("All", ""), ...(runtimeStatus.environments || []).map((environment) => new Option(environment, environment)));
  if ((runtimeStatus.environments || []).includes(selectedEnvironment)) el["runtime-environment"].value = selectedEnvironment;
  const rows = runtimeStatus.insights?.rows || [];
  el["runtime-count"].textContent = rows.length ? `${rows.length}/${runtimeStatus.insights.total}` : "0";
  if (!rows.length) {
    el["runtime-list"].innerHTML = '<p class="quiet">Import a trace to rank hot paths, divergence and blast radius.</p>';
    return runtimeStatus;
  }
  el["runtime-list"].replaceChildren(...rows.map((row) => itemButton(
    row.symbol,
    `priority ${row.refactor_priority} · ${row.observed_count} calls · ${row.next_action.replaceAll("_", " ")}`,
    () => loadGraph(row.symbol, row.path)
  )));
  return runtimeStatus;
}

async function loadArchitecture() {
  const value = await api("/api/architecture?scope=**&package_depth=2&limit=50");
  currentArchitecture = projectArchitecture(value);
  const issues = value.architecture_plan?.issues || [];
  const visibleIssueCount = Math.min(12, issues.length);
  el["architecture-future-count"].textContent = `${visibleIssueCount}${issues.length > visibleIssueCount ? `/${issues.length}` : ""}${value.partial ? " · partial" : ""}`;
  if (!issues.length) {
    el["architecture-future-list"].innerHTML = '<p class="quiet">No cycle or high fan-in future is available in this scope.</p>';
  } else {
    el["architecture-future-list"].replaceChildren(...issues.slice(0, 12).map((issue) => {
      const winner = issue.strategies.find((strategy) => strategy.recommended) || issue.strategies[0];
      const title = issue.kind === "PACKAGE_DEPENDENCY_CYCLE"
        ? (issue.packages || []).join(" ↔ ")
        : `${issue.symbol?.symbol || "hotspot"} · ${shorten(issue.symbol?.path || "unknown path", 25)}`;
      const evidence = issue.kind === "PACKAGE_DEPENDENCY_CYCLE"
        ? `${issue.selected_boundary?.edges || 0} boundary edges`
        : `${issue.symbol?.fan_in || 0} proven callers`;
      return itemButton(title, `${winner.policy.replaceAll("_", " ")} · ${evidence}`, () => selectArchitectureIssue(issue));
    }));
  }
  if (state.mode === "architecture") renderMode();
  return value;
}

function connectGitHistory() {
  if (historyConnected) return;
  el["git-history"].theme = "dark";
  el["git-history"].density = "compact";
  el["git-history"].columns = "commit";
  el["git-history"].dateFormat = "relative";
  el["git-history"].avatars = false;
  el["git-history"].provider = new CgrxGitGraphProvider(api);
  historyConnected = true;
}

function renderGraph(graph) {
  const layer = el["camera-layer"];
  layer.replaceChildren();
  drawGraph(graph, layer);
  applyCamera();
}

function drawGraph(graph, layer) {
  const viewport = el["graph-canvas"].getBoundingClientRect();
  const layout = layoutGraph(graph, { width: viewport.width, height: viewport.height, pins: pinnedPositions });
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
  const history = state.mode === "history";
  el["graph-canvas"].hidden = history;
  el["git-history-panel"].hidden = !history;
  document.querySelector(".view-actions").hidden = history;
  document.querySelector(".legend").hidden = history;
  if (history) {
    el["graph-title"].textContent = "Git history";
    el["graph-message"].hidden = true;
    return;
  }
  if (state.mode === "architecture") {
    if (!currentArchitecture) {
      setMessage("Loading architecture projection…");
      return;
    }
    const graph = currentArchitectureIssue && currentStrategy
      ? projectArchitectureFuture(currentArchitecture, currentArchitectureIssue, currentStrategy)
      : currentArchitecture;
    el["graph-title"].textContent = currentArchitectureIssue && currentStrategy
      ? `Architecture · ${currentStrategy.policy.replaceAll("_", " ")}`
      : "Architecture";
    el["graph-message"].hidden = true;
    renderGraph(graph);
    return;
  }
  if (!currentGraph) return;
  el["graph-title"].textContent = currentGraph.root.symbol;
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
  const runtimeStyle = runtimeEdgePresentation(edge);
  group.append(
    svg("path", {
      d: `M ${sx} ${sy} H ${middle} V ${ty} H ${tx}`,
      class: style.className,
      "stroke-dasharray": runtimeStyle?.dash || style.dash,
      "stroke-width": runtimeStyle?.width || 1.7,
      opacity: runtimeStyle?.opacity || 1
    }),
    svgText(runtimeStyle?.marker || style.marker, middle + 5, ty - 6, "edge-label")
  );
  const inspect = () => inspectEdge(edge, source, target);
  group.addEventListener("click", inspect);
  group.addEventListener("keydown", activate(inspect));
  return group;
}

function renderNode(node) {
  const group = svg("g", {
    transform: `translate(${node.x} ${node.y})`,
    class: `node ${node.lane === "tests" ? "node--test " : ""}${node.changed ? "node--changed " : ""}${node.status === "hypothetical" ? "node--future " : ""}${node.status === "remove" ? "node--remove " : ""}${node.pinned ? "node--pinned " : ""}${state.selectedNodeId === node.node_id ? "is-selected" : ""}`,
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
  group.addEventListener("pointerdown", (event) => {
    if (state.mode === "compare") return;
    event.stopPropagation();
    nodeDrag = {
      key: String(node.node_id ?? node.id),
      start: graphPoint(event),
      origin: { x: node.x, y: node.y }
    };
  });
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
    ["State", node.status === "hypothetical" ? "hypothetical future" : node.lane === "tests" ? "candidate · not run" : "current · indexed"],
    ...(node.kind === "package" ? [
      ["Files", node.files], ["Symbols", node.symbols], ["Fan in", node.fan_in],
      ["Fan out", node.fan_out], ["Cycle", node.cycle ? "candidate package cycle" : "none detected"]
    ] : [])
  ]);
  renderMode();
  if (node.kind === "package") return;
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
    ,...[edge.count ? [["Observed calls", edge.count], ["Environments", (edge.environments || []).join(", ")], ["Last seen", edge.last_seen_unix_nanos]] : []]
  ]);
}

function selectCandidate(candidate) {
  currentCandidate = candidate;
  currentArchitectureIssue = null;
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

function selectArchitectureIssue(issue) {
  currentCandidate = null;
  currentArchitectureIssue = issue;
  el["strategy-panel"].hidden = false;
  el["strategy-tabs"].replaceChildren(...issue.strategies.map((strategy) => {
    const button = document.createElement("button");
    button.type = "button";
    button.role = "tab";
    button.textContent = strategy.policy.replaceAll("_", " ");
    button.addEventListener("click", () => selectStrategy(strategy));
    return button;
  }));
  selectStrategy(issue.strategies[0]);
  activateMode("architecture");
}

function selectStrategy(strategy) {
  currentStrategy = currentArchitectureIssue
    ? { ...strategy, agent_handoff: architectureAgentHandoff(state.snapshot, currentArchitectureIssue, strategy) }
    : strategy;
  state = reduce(state, { type: "strategy", strategyId: strategy.strategy_id });
  const strategies = currentArchitectureIssue?.strategies || currentCandidate?.strategies || [];
  [...el["strategy-tabs"].children].forEach((button, index) => {
    button.setAttribute(
      "aria-selected",
      String(strategies[index].strategy_id === strategy.strategy_id)
    );
  });
  const blocked = strategy.status === "blocked_by_gaps";
  const summary = strategy.summary
    || `${(strategy.counterfactual?.reasons || []).map((reason) => reason.replaceAll("_", " ")).join(" · ")} · graph ${JSON.stringify(strategy.predicted_graph || {})}`;
  el["strategy-detail"].innerHTML =
    `<p class="strategy-summary">${escapeHtml(summary)}</p>`
    + `<span class="risk ${blocked ? "risk--blocked" : ""}">`
    + escapeHtml(blocked ? "blocked by gaps" : `${strategy.counterfactual?.score ?? strategy.risk} · hypothetical`)
    + "</span>";
  if (state.mode === "preview" || state.mode === "compare" || state.mode === "architecture") renderMode();
}

function activateMode(mode) {
  state = reduce(state, { type: "mode", mode });
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === mode);
  });
  renderMode();
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
  activateMode(button.dataset.mode);
  if (state.mode === "architecture" && !currentArchitecture) {
    loadArchitecture().catch((error) => setMessage(error.message));
  }
  if (state.mode === "history") connectGitHistory();
}));
document.querySelectorAll("[data-evidence]").forEach((button) => button.addEventListener("click", () => {
  evidenceMode = button.dataset.evidence;
  document.querySelectorAll("[data-evidence]").forEach((candidate) => candidate.classList.toggle("is-active", candidate === button));
  if (currentGraph?.root) loadGraph(currentGraph.root.symbol, currentGraph.root.path).catch((error) => setMessage(error.message));
}));
el["runtime-environment"].addEventListener("change", () => {
  if (currentGraph?.root) loadGraph(currentGraph.root.symbol, currentGraph.root.path).catch((error) => setMessage(error.message));
});
el["git-history"].addEventListener("gitgraph-commit-select", (event) => {
  const commit = event.detail.commit;
  const refs = (el["git-history"].data?.refs || []).filter((ref) => ref.target === commit.oid).map((ref) => ref.name);
  el["selection-kind"].textContent = "commit";
  el["inspector-content"].innerHTML = facts([
    ["Commit", commit.oid],
    ["Subject", commit.message],
    ["Author", commit.author?.name],
    ["Authored", commit.authoredAt],
    ["Parents", commit.parents.join(", ") || "root"],
    ["Refs", refs.join(", ") || "none"]
  ]);
});
el["git-history"].addEventListener("gitgraph-error", (event) => {
  setMessage(event.detail?.error?.message || "Git history request failed");
});
el["zoom-in"].addEventListener("click", () => zoom(1.2));
el["zoom-out"].addEventListener("click", () => zoom(1 / 1.2));
el["reset-view"].addEventListener("click", () => {
  pinnedPositions = {};
  state = reduce(state, { type: "camera", camera: { x: 0, y: 0, scale: 1 } });
  renderMode();
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
document.addEventListener("pointermove", (event) => {
  if (!nodeDrag) return;
  const point = graphPoint(event);
  pinnedPositions = {
    ...pinnedPositions,
    [nodeDrag.key]: {
      x: nodeDrag.origin.x + point.x - nodeDrag.start.x,
      y: nodeDrag.origin.y + point.y - nodeDrag.start.y
    }
  };
  renderMode();
});
document.addEventListener("pointerup", () => { nodeDrag = null; });
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
  if (currentArchitectureIssue) {
    copy(JSON.stringify({
      tool: "get_architecture",
      arguments: { scope: "**", package_depth: 2, limit: 50 },
      selected_issue_id: currentArchitectureIssue.issue_id,
      selected_strategy_id: currentStrategy?.strategy_id,
      revalidate_snapshot: state.snapshot
    }, null, 2), "Architecture MCP call copied");
    return;
  }
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
el["copy-runtime-agent"].addEventListener("click", () => {
  if (currentGraph) copy(runtimeAgentHandoff(currentGraph, runtimeStatus?.insights?.rows || []), "Runtime agent context copied");
});

async function copy(value, announcement) {
  await navigator.clipboard.writeText(value);
  el.announcer.textContent = announcement;
}

function graphPoint(event) {
  const matrix = el["graph-svg"].getScreenCTM();
  if (!matrix) return { x: event.clientX, y: event.clientY };
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  return {
    x: (point.x - state.camera.x) / state.camera.scale,
    y: (point.y - state.camera.y) / state.camera.scale
  };
}

Promise.all([loadStatus(), loadRefactors(), loadArchitecture(), loadRuntimeIntelligence()]).catch((error) => {
  el.freshness.textContent = "offline";
  el.freshness.className = "badge badge--stale";
  setMessage(error.message);
});
setInterval(() => loadStatus().catch(() => {
  el.freshness.textContent = "offline";
  el.freshness.className = "badge badge--stale";
}), 2500);
