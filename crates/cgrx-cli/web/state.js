const MODES = new Set(["current", "architecture", "changes", "preview", "compare", "history"]);

export function createState(snapshot = null) {
  return {
    snapshot,
    mode: "current",
    selectedNodeId: null,
    selectedStrategyId: null,
    camera: { x: 0, y: 0, scale: 1 },
    requestGeneration: 0,
    freshness: "live"
  };
}

export function reduce(state, action) {
  switch (action.type) {
    case "mode": {
      if (!MODES.has(action.mode)) throw new Error(`unknown graph mode: ${action.mode}`);
      return { ...state, mode: action.mode };
    }
    case "select":
      return { ...state, selectedNodeId: action.nodeId };
    case "strategy":
      return { ...state, selectedStrategyId: action.strategyId };
    case "camera":
      return { ...state, camera: { ...action.camera } };
    case "request":
      return { ...state, requestGeneration: action.generation };
    case "status": {
      const changed = snapshotKey(state.snapshot)
        && snapshotKey(state.snapshot) !== snapshotKey(action.snapshot);
      return {
        ...state,
        snapshot: action.snapshot,
        selectedStrategyId: changed ? null : state.selectedStrategyId,
        freshness: changed ? "stale" : "live"
      };
    }
    case "graph": {
      if (action.generation < state.requestGeneration) return state;
      const selectedNodeId = action.nodeIds.includes(state.selectedNodeId)
        ? state.selectedNodeId
        : null;
      return {
        ...state,
        snapshot: action.snapshot,
        selectedNodeId,
        requestGeneration: action.generation,
        freshness: "live"
      };
    }
    default:
      throw new Error(`unknown state action: ${action.type}`);
  }
}

export function serializeAgentPlan(strategy) {
  return JSON.stringify(strategy.agent_handoff, null, 2);
}

export function summarizeBoundedResult(value) {
  const shown = value.candidates?.length || 0;
  const partial = Boolean(value.partial);
  const count = `${value.total > shown ? `${shown}/${value.total}` : value.total}${partial ? " · partial" : ""}`;
  const gaps = value.coverage_gap_count || 0;
  return {
    count,
    note: partial
      ? `Bounded result · ${gaps} coverage gaps. Destructive paths stay blocked.`
      : ""
  };
}

export function projectGraph(current, strategy) {
  const nodes = new Map();
  for (const node of current.nodes || []) nodes.set(identity(node), { ...node });
  const addNode = (node, lane = "entrypoints") => {
    if (!node || identity(node) === "") return;
    const key = identity(node);
    if (!nodes.has(key)) {
      nodes.set(key, {
        ...node,
        node_id: node.node_id ?? node.id,
        lane,
        path: node.path || "proposed",
        span: node.span || { start: 0, end: 0 },
        source_hash: node.source_hash || "hypothetical",
        status: node.status || "hypothetical"
      });
    }
  };
  for (const node of strategy.verification?.review_symbols || []) addNode(node);

  const edges = (current.edges || []).map((edge) => ({ ...edge, status: "preserved" }));
  const delta = strategy.graph_delta || {};
  for (const edge of delta.preserve || []) {
    addNode(edge.source, "callers");
    addNode(edge.target, "entrypoints");
    const source = identity(edge.source);
    const target = identity(edge.target);
    const duplicate = edges.some((candidate) =>
      String(candidate.source) === source
      && String(candidate.target) === target
      && candidate.relation === edge.relation
    );
    if (!duplicate) edges.push({ ...edge, source, target, status: "preserved" });
  }
  for (const [collection, status] of [
    [delta.add, "hypothetical"],
    [delta.redirect, "hypothetical"],
    [delta.move_to_helper, "hypothetical"]
  ]) {
    for (const edge of collection || []) {
      addNode(edge.source, edge.source?.status === "hypothetical" ? "entrypoints" : "entrypoints");
      addNode(edge.target, edge.target?.status === "hypothetical" ? "entrypoints" : "callees");
      edges.push({
        ...edge,
        source: identity(edge.source),
        target: identity(edge.target),
        confidence: status === "hypothetical" ? "hypothetical" : edge.confidence,
        status
      });
    }
  }
  for (const removed of delta.remove || []) {
    addNode(removed);
    const key = identity(removed);
    nodes.set(key, { ...nodes.get(key), status: "remove" });
  }
  return { ...current, nodes: [...nodes.values()], edges, projection: strategy.strategy_id };
}

export function projectArchitecture(value) {
  const cyclic = new Set((value.cycles || []).flatMap((cycle) => cycle.packages || []));
  const nodes = (value.packages || []).map((item) => ({
    node_id: `package:${item.name}`,
    symbol: item.name,
    path: item.name,
    span: { start: 0, end: 0 },
    source_hash: "package-projection",
    lane: "entrypoints",
    kind: "package",
    files: item.files,
    symbols: item.symbols,
    fan_in: item.fan_in,
    fan_out: item.fan_out,
    cycle: cyclic.has(item.name),
    status: "current"
  }));
  const edges = (value.boundaries || []).map((item) => ({
    source: `package:${item.source}`,
    target: `package:${item.target}`,
    relation: (item.relations || []).join("+") || "CALLS",
    confidence: item.confidence,
    status: "current",
    evidence: item.evidence?.[0],
    evidence_count: item.edges
  }));
  return {
    snapshot: value.snapshot,
    root: { symbol: "Architecture", path: "." },
    nodes,
    edges,
    containers: [],
    partial: value.partial,
    coverage_gap_count: value.coverage_gap_count
  };
}

function identity(node) {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  return String(node.node_id ?? node.id ?? "");
}

export function snapshotKey(snapshot) {
  if (!snapshot) return "";
  return `${snapshot.repo_revision}:${snapshot.working_tree_digest}:${snapshot.graph_generation}`;
}
