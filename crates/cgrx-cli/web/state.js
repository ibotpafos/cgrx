const MODES = new Set(["current", "changes", "preview", "compare"]);

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
    case "graph": {
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

export function snapshotKey(snapshot) {
  if (!snapshot) return "";
  return `${snapshot.repo_revision}:${snapshot.working_tree_digest}:${snapshot.graph_generation}`;
}
