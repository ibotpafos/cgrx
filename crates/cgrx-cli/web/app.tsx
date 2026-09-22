import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";
import { projectCodeMap } from "./repository-map.js";
import { layoutRepositoryMap } from "./dense-layout.js";
import { ProjectPicker } from "./components/ProjectPicker";
import type { ProjectCatalogue } from "./components/ProjectPicker";
import { ProjectCanvas } from "./components/ProjectCanvas";
import { WorkspaceDock, PanelHeading } from "./components/WorkspaceChrome";
import { createRoot } from "react-dom/client";
import { defineWebGitGraph } from "@web-git-graph/web";
import { edgeStyle, layoutGraph } from "./layout.js";
import { CgrxGitGraphProvider } from "./git-history.js";
import {
  createProjectGraphRenderer,
  type ProjectGraphRendererHandle
} from "./project-three.js";
import {
  graphEvidenceQuery,
  runtimeAgentHandoff,
  runtimeEdgePresentation,
  type EvidenceMode
} from "./runtime-evidence.js";
import {
  architectureAgentHandoff,
  projectArchitecture,
  projectArchitectureFuture,
  projectChangeMissions,
  projectGraph,
  projectRepositoryMap,
  serializeAgentPlan,
  serializeChangeMissionHandoff,
  snapshotKey,
  summarizeBoundedResult
} from "./state.js";
import type {
  ArchitectureIssue,
  CameraState,
  ChangeMission,
  ChangeMissionProjection,
  GraphEdge,
  GraphId,
  GraphLayout,
  GraphNode,
  GraphResponse,
  InspectorState,
  LayoutNode,
  Mode,
  ProjectLayout,
  ProjectLayoutNode,
  ProjectNode,
  ProjectMap,
  RefactorCandidate,
  RuntimeStatus,
  SearchMatch,
  SearchResponse,
  Snapshot,
  StatusResponse,
  Strategy
} from "./types.js";

interface ArchitectureResponse {
  snapshot: Snapshot;
  packages?: unknown[];
  boundaries?: unknown[];
  cycles?: unknown[];
  communities?: unknown[];
  symbol_communities?: unknown[];
  architecture_plan?: { issues?: ArchitectureIssue[] };
  partial?: boolean;
  coverage_gap_count?: number;
  [key: string]: unknown;
}

interface RefactorResponse {
  candidates: RefactorCandidate[];
  total: number;
  partial?: boolean;
  coverage_gap_count?: number;
}

interface SnippetResponse {
  source?: string;
  declaration?: string;
}

interface GitGraphCommit {
  oid: string;
  message: string;
  author?: { name?: string };
  authoredAt?: string;
  parents?: string[];
}

interface GitGraphSelectEvent extends CustomEvent {
  detail: { commit: GitGraphCommit };
}

interface GitGraphErrorEvent extends CustomEvent {
  detail: { error?: { message?: string } } | undefined;
}

interface GitGraphElement extends HTMLElement {
  theme: string;
  density: string;
  columns: string;
  dateFormat: string;
  avatars: boolean;
  provider: CgrxGitGraphProvider;
  data?: { refs?: Array<{ target: string; name: string }> };
  refresh?: () => void;
}

interface ProjectMapCanvasHandle {
  zoom(factor: number): void;
  resetView(): void;
  focusNode(nodeId: GraphId): void;
}

interface ProjectMapCanvasProps {
  graph: ProjectMap;
  selectedId: GraphId | null;
  onNodeSelect: (node: ProjectLayoutNode) => void;
  onNodeOpen: (node: ProjectLayoutNode) => void;
  onEdgeSelect: (edge: GraphEdge, source: ProjectLayoutNode, target: ProjectLayoutNode) => void;
}

const DEFAULT_CAMERA: CameraState = { x: 0, y: 0, scale: 1 };
const MODES: Array<{ id: Mode; label: string }> = [
  { id: "project", label: "Project map" },
  { id: "current", label: "Current" },
  { id: "architecture", label: "Architecture" },
  { id: "changes", label: "Changes" },
  { id: "preview", label: "Preview" },
  { id: "compare", label: "Compare" },
  { id: "history", label: "Git history" }
];
const EVIDENCE_MODES: Array<{ id: EvidenceMode; label: string }> = [
  { id: "static", label: "Static" },
  { id: "observed", label: "Runtime" },
  { id: "all", label: "Combined" }
];

const tokenKey = `cgrx-token:${location.host}`;
const fragment = new URLSearchParams(location.hash.slice(1));
const capability = fragment.get("token") || sessionStorage.getItem(tokenKey) || "";
if (capability) sessionStorage.setItem(tokenKey, capability);
if (location.hash) history.replaceState(null, "", `${location.pathname}${location.search}`);
// Project selection lives in the URL. Navigating to another project creates a
// fresh React tree, so responses/selection/history from the old repo cannot leak.
const selectedProjectId = new URLSearchParams(location.search).get("project");
defineWebGitGraph();

async function api<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = new URL(path, location.origin);
  if (selectedProjectId && url.pathname !== "/api/projects") url.searchParams.set("project", selectedProjectId);
  const response = await fetch(url, {
    headers: { "X-CGRX-Token": capability },
    cache: "no-store",
    signal
  });
  const value = await response.json() as { error?: { detail?: string } } & T;
  if (!response.ok) throw new Error(value?.error?.detail || `Request failed: ${response.status}`);
  return value;
}

function App(): React.JSX.Element {
  const [projectCatalogue, setProjectCatalogue] = useState<ProjectCatalogue | null>(null);
  const [projectListError, setProjectListError] = useState("");
  const selectedProject = projectCatalogue?.projects.find(project => project.id === (selectedProjectId || projectCatalogue.default_project));
  const loadProjects = useCallback(async (): Promise<void> => {
    try {
      setProjectCatalogue(await api<ProjectCatalogue>("/api/projects"));
      setProjectListError("");
    } catch (error) { setProjectListError(errorMessage(error)); }
  }, []);
  useEffect(() => { void loadProjects(); }, [loadProjects]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [freshness, setFreshness] = useState<"connecting" | "live" | "refreshing" | "offline">("connecting");
  const [mode, setMode] = useState<Mode>("project");
  const [graphDimension, setGraphDimension] = useState<"2d" | "3d">("2d");
  const [discoveryOpen, setDiscoveryOpen] = useState(true);
  const [inspectorDismissed, setInspectorDismissed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [evidenceMode, setEvidenceMode] = useState<EvidenceMode>("static");
  const [runtimeEnvironment, setRuntimeEnvironment] = useState("");
  const [camera, setCamera] = useState<CameraState>(DEFAULT_CAMERA);
  const [pinnedPositions, setPinnedPositions] = useState<Record<string, { x: number; y: number }>>({});

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchError, setSearchError] = useState("");

  const [currentGraph, setCurrentGraph] = useState<GraphResponse | null>(null);
  const [currentArchitecture, setCurrentArchitecture] = useState<GraphResponse | null>(null);
  const [packageMap, setPackageMap] = useState<ProjectMap | null>(null);
  const [repositoryGraph, setRepositoryGraph] = useState<GraphResponse | null>(null);
  const [graphDetail, setGraphDetail] = useState<"symbols" | "files" | "packages">("symbols");
  const [graphScope, setGraphScope] = useState("**");
  const [scopeDraft, setScopeDraft] = useState("**");
  const [repositoryError, setRepositoryError] = useState("");
  const repositoryRequest = useRef(0);
  const currentProjectMap = useMemo(() => graphDetail === "packages" ? packageMap
    : repositoryGraph ? projectCodeMap(repositoryGraph, graphDetail) as ProjectMap : null,
    [graphDetail, packageMap, repositoryGraph]);
  const [architectureIssues, setArchitectureIssues] = useState<ArchitectureIssue[]>([]);
  const [architecturePartial, setArchitecturePartial] = useState(false);
  const [refactors, setRefactors] = useState<RefactorResponse | null>(null);
  const [refactorError, setRefactorError] = useState("");
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus | null>(null);
  const [runtimeError, setRuntimeError] = useState("");
  const [changeMissions, setChangeMissions] = useState<ChangeMissionProjection | null>(null);
  const [missionError, setMissionError] = useState("");

  const [selectedNodeId, setSelectedNodeId] = useState<GraphId | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<RefactorCandidate | null>(null);
  const [selectedArchitectureIssue, setSelectedArchitectureIssue] = useState<ArchitectureIssue | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [inspector, setInspector] = useState<InspectorState>({ kind: "none", facts: [] });
  const [message, setMessage] = useState("Trace evidence, then compare futures.");
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => { setInspectorDismissed(false); }, [inspector]);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, select") || target.isContentEditable) return;
      if (event.key === "/") { event.preventDefault(); setDiscoveryOpen(true); requestAnimationFrame(() => document.getElementById("search-input")?.focus()); }
      if (event.key === "?") setHelpOpen(v => !v);
      if (event.key === "Escape") { setHelpOpen(false); setInspectorDismissed(true); }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [inspector]);

  const snapshotRef = useRef<Snapshot | null>(null);
  const graphRef = useRef<GraphResponse | null>(null);
  const evidenceRef = useRef<EvidenceMode>(evidenceMode);
  const environmentRef = useRef(runtimeEnvironment);
  const cameraRef = useRef(camera);
  const projectMapHandle = useRef<ProjectMapCanvasHandle>(null);
  const requestGeneration = useRef(0);
  const panRef = useRef<{ pointerId: number; x: number; y: number; camera: CameraState } | null>(null);
  const dragRef = useRef<{ key: string; x: number; y: number; origin: { x: number; y: number } } | null>(null);

  useEffect(() => { snapshotRef.current = snapshot; }, [snapshot]);
  useEffect(() => { graphRef.current = currentGraph; }, [currentGraph]);
  useEffect(() => { evidenceRef.current = evidenceMode; }, [evidenceMode]);
  useEffect(() => { environmentRef.current = runtimeEnvironment; }, [runtimeEnvironment]);
  useEffect(() => { cameraRef.current = camera; }, [camera]);

  const loadFocusedGraph = useCallback(async (symbol: string, path: string): Promise<void> => {
    const generation = ++requestGeneration.current;
    setMessage("Loading verified neighborhood…");
    const environments = environmentRef.current ? [environmentRef.current] : [];
    const value = await api<GraphResponse>(
      `/api/graph?symbol=${encodeURIComponent(symbol)}&path=${encodeURIComponent(path)}&direction=both&depth=1&node_limit=80&edge_limit=160&${graphEvidenceQuery(evidenceRef.current, environments)}`
    );
    if (generation !== requestGeneration.current) return;
    setCurrentGraph(value);
    graphRef.current = value;
    setSnapshot(value.snapshot);
    snapshotRef.current = value.snapshot;
    setSelectedNodeId((selected) => value.nodes.some((node) => String(node.node_id) === String(selected)) ? selected : null);
    setMessage("");
  }, []);

  const openFocusedGraph = useCallback(async (symbol: string, path: string): Promise<void> => {
    setMode("current");
    await loadFocusedGraph(symbol, path);
  }, [loadFocusedGraph]);

  const loadRepository = useCallback(async (): Promise<void> => {
    const request = ++repositoryRequest.current;
    setRepositoryError("");
    setRepositoryGraph(null);
    try {
      const value = await api<GraphResponse>(`/api/repository-graph?scope=${encodeURIComponent(graphScope)}&node_limit=5000&edge_limit=30000`);
      if (request === repositoryRequest.current) setRepositoryGraph(value);
    } catch (error) {
      if (request === repositoryRequest.current) setRepositoryError(errorMessage(error));
    }
  }, [graphScope]);

  const loadArchitecture = useCallback(async (): Promise<void> => {
    const value = await api<ArchitectureResponse>("/api/architecture?scope=**&package_depth=2&limit=300");
    setCurrentArchitecture(projectArchitecture(value) as GraphResponse);
    setPackageMap(projectRepositoryMap(value) as ProjectMap);
    setArchitectureIssues(value.architecture_plan?.issues || []);
    setArchitecturePartial(Boolean(value.partial));
  }, []);

  const loadRefactors = useCallback(async (): Promise<void> => {
    try {
      const value = await api<RefactorResponse>("/api/refactors?scope=**&min_score=760&limit=8");
      setRefactors(value);
      setRefactorError("");
    } catch (error) {
      setRefactorError(errorMessage(error));
    }
  }, []);

  const loadRuntime = useCallback(async (): Promise<void> => {
    try {
      const value = await api<RuntimeStatus>("/api/runtime-status");
      setRuntimeStatus(value);
      setRuntimeError("");
      const environments = value.environments || [];
      if (environmentRef.current && !environments.includes(environmentRef.current)) {
        environmentRef.current = "";
        setRuntimeEnvironment("");
      }
    } catch (error) {
      setRuntimeError(errorMessage(error));
    }
  }, []);

  const loadMissions = useCallback(async (): Promise<void> => {
    try {
      const value = await api<Record<string, unknown>>("/api/change-plan?limit=20");
      setChangeMissions(projectChangeMissions(value) as ChangeMissionProjection);
      setMissionError("");
    } catch (error) {
      setChangeMissions(null);
      setMissionError(errorMessage(error));
    }
  }, []);

  const refreshSecondaryData = useCallback(async (): Promise<void> => {
    await Promise.all([loadRepository(), loadArchitecture(), loadMissions(), loadRuntime(), loadRefactors()]);
  }, [loadRepository, loadArchitecture, loadMissions, loadRefactors, loadRuntime]);

  const statusInFlight = useRef(false);
  const loadStatus = useCallback(async (refreshOnChange = true): Promise<void> => {
    // Cold projects can take longer than the polling interval to index.
    // Keep one refresh in flight instead of queuing requests behind it.
    if (statusInFlight.current) return;
    statusInFlight.current = true;
    try {
      const value = await api<StatusResponse>("/api/status");
      const previousKey = snapshotKey(snapshotRef.current);
      const nextKey = snapshotKey(value.snapshot);
      const changed = Boolean(previousKey && previousKey !== nextKey);
      setSnapshot(value.snapshot);
      snapshotRef.current = value.snapshot;
      setFreshness(changed ? "refreshing" : "live");
      if (changed && refreshOnChange) {
        setSelectedCandidate(null);
        setSelectedArchitectureIssue(null);
        setSelectedStrategy(null);
        await refreshSecondaryData();
        const root = graphRef.current?.root;
        if (root) await loadFocusedGraph(root.symbol, root.path);
        setFreshness("live");
      }
    } catch (error) {
      setFreshness("offline");
      setMessage(errorMessage(error));
    } finally {
      statusInFlight.current = false;
    }
  }, [loadFocusedGraph, refreshSecondaryData]);

  useEffect(() => {
    let cancelled = false;
    const start = async (): Promise<void> => {
      await loadStatus(false);
      if (!cancelled) await refreshSecondaryData();
    };
    void start();
    const interval = window.setInterval(() => { void loadStatus(true); }, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [loadStatus, refreshSecondaryData]);

  useEffect(() => {
    const move = (event: PointerEvent): void => {
      const drag = dragRef.current;
      if (!drag) return;
      const scale = Math.max(0.1, cameraRef.current.scale);
      setPinnedPositions((current) => ({
        ...current,
        [drag.key]: {
          x: drag.origin.x + (event.clientX - drag.x) / scale,
          y: drag.origin.y + (event.clientY - drag.y) / scale
        }
      }));
    };
    const up = (): void => { dragRef.current = null; };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
    };
  }, []);

  const doSearch = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    try {
      const result = await api<SearchResponse>(`/api/search?q=${encodeURIComponent(value)}&scope=**&limit=12`);
      setSearchResults(result.matches);
      setSearchTotal(result.total);
      setSearchError("");
    } catch (error) {
      setSearchError(errorMessage(error));
    }
  };

  const selectProjectNode = (node: ProjectNode): void => {
    if (node.kind === "symbol") {
      void selectNode(node);
      projectMapHandle.current?.focusNode(node.node_id);
      return;
    }
    setSelectedNodeId(node.node_id);
    setInspector({
      kind: node.kind === "file" ? "file" : "package",
      facts: [
        [node.kind === "file" ? "File" : "Package", node.symbol],
        ["Community", node.community.replace("community:", "")],
        ["Files", node.files],
        ["Symbols", node.symbols],
        ["Incoming", node.fan_in],
        ["Outgoing", node.fan_out],
        ["Cycle", node.cycle ? "candidate package cycle" : "none detected"]
      ],
      representatives: node.representatives
    });
    projectMapHandle.current?.focusNode(node.node_id);
  };

  const selectNode = async (node: GraphNode): Promise<void> => {
    setSelectedNodeId(node.node_id);
    const facts: Array<[string, unknown]> = [
      ["Symbol", node.symbol],
      ["Path", node.path],
      ["Span", node.span ? `${node.span.start}–${node.span.end}` : "unknown"],
      ["Source hash", node.source_hash],
      ["State", node.status === "hypothetical" ? "hypothetical future" : node.lane === "tests" ? "candidate · not run" : "current · indexed"]
    ];
    if (node.kind === "package") {
      facts.push(
        ["Files", node.files],
        ["Symbols", node.symbols],
        ["Fan in", node.fan_in],
        ["Fan out", node.fan_out],
        ["Cycle", node.cycle ? "candidate package cycle" : "none detected"]
      );
    }
    setInspector({ kind: node.lane || "node", facts });
    if (node.kind === "package") return;
    try {
      const snippet = await api<SnippetResponse>(
        `/api/snippet?symbol=${encodeURIComponent(node.symbol)}&path=${encodeURIComponent(node.path)}`
      );
      setInspector(current => current.facts === facts ? { kind: node.lane || "node", facts, code: snippet.source || snippet.declaration || "Source unavailable." } : current);
    } catch (error) {
      setInspector(current => current.facts === facts ? { kind: node.lane || "node", facts, error: errorMessage(error) } : current);
    }
  };

  const inspectEdge = (edge: GraphEdge, source: GraphNode, target: GraphNode): void => {
    const evidence = typeof edge.evidence === "object" && edge.evidence ? edge.evidence : {};
    setInspector({
      kind: "edge",
      facts: [
        ["Relationship", `${source.symbol} → ${target.symbol}`],
        ["Kind", edge.relation],
        ["Confidence", edge.confidence],
        ...(Number(edge.weight) > 1 ? [["Aggregated relationships", edge.weight] as [string, unknown]] : []),
        ["Resolver", "resolver" in evidence ? evidence.resolver : "indexed"],
        ["Evidence site", "path" in evidence ? `${evidence.path}:${evidence.span?.start ?? "?"}` : "hypothetical"],
        ["Source hash", "source_hash" in evidence ? evidence.source_hash : "not applicable"],
        ...(edge.count ? [
          ["Observed calls", edge.count],
          ["Environments", (edge.environments || []).join(", ")],
          ["Last seen", edge.last_seen_unix_nanos]
        ] as Array<[string, unknown]> : [])
      ]
    });
  };

  const selectMission = (mission: ChangeMission): void => {
    setMode("changes");
    setInspector({
      kind: "mission",
      facts: [
        ["Mission", mission.mission_id],
        ["Kind", mission.kind],
        ["Parallel group", mission.parallel_group + 1],
        ["Depends on", mission.depends_on?.join(", ") || "none"],
        ["Change paths", mission.change_paths?.join(", ") || "none"],
        ["Review paths", mission.review_paths?.join(", ") || "none"],
        ["Evidence", mission.evidenceCount],
        ["Candidate tests", mission.testCount],
        ["Coverage", mission.blocked_by_gaps ? "blocked by gaps" : "ready for review"],
        ["Steps", mission.steps?.join(" → ") || "inspect"]
      ]
    });
  };

  const chooseStrategy = (strategy: Strategy, issue = selectedArchitectureIssue): void => {
    const next = issue
      ? { ...strategy, agent_handoff: architectureAgentHandoff(snapshot, issue, strategy) }
      : strategy;
    setSelectedStrategy(next);
  };

  const selectCandidate = (candidate: RefactorCandidate): void => {
    setSelectedCandidate(candidate);
    setSelectedArchitectureIssue(null);
    setMode("current");
    chooseStrategy(candidate.strategies[0], null);
    void loadFocusedGraph(candidate.left.symbol, candidate.left.path);
  };

  const selectArchitectureIssue = (issue: ArchitectureIssue): void => {
    setSelectedCandidate(null);
    setSelectedArchitectureIssue(issue);
    setMode("architecture");
    chooseStrategy(issue.strategies[0], issue);
  };

  const copy = async (value: string, notice: string): Promise<void> => {
    await navigator.clipboard.writeText(value);
    setAnnouncement(notice);
  };

  const copyAgent = (): void => {
    if (selectedStrategy) void copy(serializeAgentPlan(selectedStrategy), "Agent plan copied");
  };

  const copyMcp = (): void => {
    if (selectedArchitectureIssue) {
      void copy(JSON.stringify({
        tool: "get_architecture",
        arguments: { scope: "**", package_depth: 2, limit: 50 },
        selected_issue_id: selectedArchitectureIssue.issue_id,
        selected_strategy_id: selectedStrategy?.strategy_id,
        revalidate_snapshot: snapshot
      }, null, 2), "Architecture MCP call copied");
      return;
    }
    if (!selectedCandidate) return;
    void copy(JSON.stringify({
      tool: "suggest_refactors",
      arguments: {
        scope: { include: ["**"], exclude: [], relation_kinds: ["CALLS", "IMPLEMENTS"], max_depth: 1 },
        language: selectedCandidate.language,
        min_score: 760,
        limit: 8
      },
      revalidate_snapshot: snapshot
    }, null, 2), "MCP call copied");
  };

  const zoom = (factor: number): void => {
    if (mode === "project") {
      projectMapHandle.current?.zoom(factor);
      return;
    }
    setCamera((current) => ({ ...current, scale: clamp(current.scale * factor, 0.45, 2.4) }));
  };

  const resetView = (): void => {
    setPinnedPositions({});
    if (mode === "project") {
      projectMapHandle.current?.resetView();
      return;
    }
    setCamera(DEFAULT_CAMERA);
  };

  const selectEvidenceMode = (next: EvidenceMode): void => {
    evidenceRef.current = next;
    setEvidenceMode(next);
    const root = graphRef.current?.root;
    if (root) void loadFocusedGraph(root.symbol, root.path).catch((error) => setMessage(errorMessage(error)));
  };

  const selectEnvironment = (next: string): void => {
    environmentRef.current = next;
    setRuntimeEnvironment(next);
    const root = graphRef.current?.root;
    if (root) void loadFocusedGraph(root.symbol, root.path).catch((error) => setMessage(errorMessage(error)));
  };

  const panStart = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (mode === "project") return;
    const target = event.target as Element;
    if (target.closest?.("[data-graph-interactive='true']")) return;
    panRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, camera };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const panMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const start = panRef.current;
    if (!start || start.pointerId !== event.pointerId || mode === "project") return;
    setCamera({
      ...start.camera,
      x: start.camera.x + event.clientX - start.x,
      y: start.camera.y + event.clientY - start.y
    });
  };

  const panEnd = (): void => { panRef.current = null; };

  const graphForStage = useMemo((): GraphResponse | null => {
    if (mode === "architecture") {
      if (!currentArchitecture) return null;
      if (selectedArchitectureIssue && selectedStrategy) {
        return projectArchitectureFuture(currentArchitecture, selectedArchitectureIssue, selectedStrategy) as GraphResponse;
      }
      return currentArchitecture;
    }
    if (!currentGraph) return null;
    if (mode === "preview" && selectedStrategy) return projectGraph(currentGraph, selectedStrategy) as GraphResponse;
    return currentGraph;
  }, [currentArchitecture, currentGraph, mode, selectedArchitectureIssue, selectedStrategy]);

  const stageTitle = mode === "project"
    ? "Project map"
    : mode === "architecture"
      ? selectedArchitectureIssue && selectedStrategy
        ? `Architecture · ${selectedStrategy.policy.replaceAll("_", " ")}`
        : "Architecture"
      : mode === "changes"
        ? "Change missions"
        : mode === "history"
          ? "Git history"
          : currentGraph?.root.symbol || "Focused graph";
  const stageEyebrow = mode === "project"
    ? "Repository topology"
    : mode === "architecture"
      ? "Architecture projection"
      : mode === "changes"
        ? "Deterministic execution DAG"
        : mode === "history"
          ? "Repository history"
          : "Focused neighborhood";

  const refactorSummary = refactors ? summarizeBoundedResult(refactors) as { count: string; note: string } : { count: "0", note: "" };
  const visibleIssues = architectureIssues.slice(0, 12);
  const runtimeRows = runtimeStatus?.insights?.rows || [];
  const strategySet = selectedArchitectureIssue?.strategies || selectedCandidate?.strategies || [];

  return <>
    <a className="skip-link" href="#graph-canvas">Skip to graph</a>
    <header className="topbar">
      <div className="brand" aria-label="CGRX Evidence Graph Explorer"><strong>CGRX</strong><small title={selectedProject?.path}>{selectedProject?.name || "Code atlas"}</small></div>
      <div className="atlas-stats" aria-label="Repository summary">
        <span>{currentProjectMap?.nodes.length ?? "—"} {graphDetail}</span>
        <span>{currentProjectMap?.edges.length ?? "—"} connections</span>
        {currentProjectMap?.truncated && <span className="atlas-stat--partial">Showing part of {currentProjectMap.totals?.symbols} symbols / {currentProjectMap.totals?.relationships} links · narrow scope</span>}
        {currentProjectMap?.partial && <span className="atlas-stat--partial">Partial coverage</span>}
      </div>
      <div className="snapshot" aria-live="polite">
        <span className={`badge badge--${freshness === "live" ? "live" : freshness === "connecting" ? "loading" : "stale"}`}>{freshness}</span>
        <code title={snapshot?.repo_revision}>{snapshot ? snapshot.repo_revision.slice(0, 9) : "loading snapshot"}</code>
      </div>
    </header>

    <main className={`workspace atlas-workspace${mode === "project" ? " workspace--project" : ""}`}>
      <WorkspaceDock mode={mode} modes={MODES} onMode={setMode} discoveryOpen={discoveryOpen} onDiscovery={() => setDiscoveryOpen(v => !v)} />
      <aside id="discovery-panel" className="rail floating-panel" aria-label="Graph discovery" hidden={!discoveryOpen}>
        <PanelHeading title="Explore repository" detail={selectedProject?.name || "Choose a project and follow its connections"} onClose={() => setDiscoveryOpen(false)} />
        <ProjectPicker catalogue={projectCatalogue} selectedId={selectedProjectId} error={projectListError} onRefresh={() => void loadProjects()} />
        <form className="search" role="search" onSubmit={(event) => { void doSearch(event); }}>
          <label htmlFor="search-input">Find a symbol</label>
          <div className="search__row">
            <input id="search-input" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" placeholder="Runtime, handler, save…" required />
            <button type="submit" aria-label="Search">↵</button>
          </div>
        </form>
        {mode === "project" && graphDetail !== "packages" && <form className="search" onSubmit={e => { e.preventDefault(); setGraphScope(scopeDraft.trim() || "**"); }}>
          <label htmlFor="graph-scope">Graph scope · path glob</label><div className="search__row"><input id="graph-scope" value={scopeDraft} onChange={e => setScopeDraft(e.target.value)} placeholder="crates/cgrx-core/**"/><button type="submit" aria-label="Apply graph scope">↵</button></div>
          <small className="quiet">{currentProjectMap?.truncated ? "View limited to 5,000 symbols / 30,000 links. Narrow scope to explore more." : "All indexed symbols in scope · calls and implementations"}</small>
        </form>}
        {mode === "project" && currentProjectMap && <RailSection title={graphDetail === "packages" ? "Packages" : graphDetail === "files" ? "Files" : "Symbols"} count={String(currentProjectMap.nodes.length)} defaultOpen>
          {currentProjectMap.nodes.slice(0, 100).map(node => <ItemButton key={String(node.node_id)} title={node.symbol} subtitle={node.kind === "symbol" ? `${node.path}:${node.span?.start ?? "?"}` : `${node.symbols} symbols · ${node.degree} connections`} onClick={() => selectProjectNode(node)} />)}
          {currentProjectMap.nodes.length > 100 && <p className="quiet">First 100 shown in list. All {currentProjectMap.nodes.length} nodes are on the map; use search or narrow scope.</p>}
        </RailSection>}
        <RailSection key={`matches-${searchTotal}-${searchError}`} title="Matches" count={String(searchTotal)} defaultOpen={searchTotal > 0 || Boolean(searchError)}>
          {searchError ? <p className="error">{searchError}</p> : searchResults.length
            ? searchResults.map((match) => <ItemButton key={`${match.path}:${match.span.start}:${match.symbol}`} title={match.symbol} subtitle={`${match.path}:${match.span.start}`} onClick={() => { void openFocusedGraph(match.symbol, match.path); }} />)
            : <p className="quiet">Search by intent or symbol.</p>}
        </RailSection>
        <RailSection title="Runtime intelligence" count={runtimeRows.length ? `${runtimeRows.length}/${runtimeStatus?.insights?.total ?? runtimeRows.length}` : "0"}>
          {runtimeError ? <p className="error">{runtimeError}</p> : runtimeRows.length
            ? runtimeRows.map((row) => <ItemButton key={`${row.path}:${row.symbol}`} title={row.symbol} subtitle={`priority ${row.refactor_priority} · ${row.observed_count} calls · ${row.next_action.replaceAll("_", " ")}`} onClick={() => { void openFocusedGraph(row.symbol, row.path); }} />)
            : <p className="quiet">Import a trace to rank hot paths, divergence and blast radius.</p>}
        </RailSection>
        <RailSection title="Architecture futures" count={`${visibleIssues.length}${architectureIssues.length > visibleIssues.length ? `/${architectureIssues.length}` : ""}${architecturePartial ? " · partial" : ""}`} maxClass="architecture-future-list">
          {visibleIssues.length ? visibleIssues.map((issue) => {
            const winner = issue.strategies.find((strategy) => strategy.recommended) || issue.strategies[0];
            const title = issue.kind === "PACKAGE_DEPENDENCY_CYCLE"
              ? (issue.packages || []).join(" ↔ ")
              : `${issue.symbol?.symbol || "hotspot"} · ${shorten(issue.symbol?.path || "unknown path", 25)}`;
            const evidence = issue.kind === "PACKAGE_DEPENDENCY_CYCLE"
              ? `${issue.selected_boundary?.edges || 0} boundary edges`
              : `${issue.symbol?.fan_in || 0} proven callers`;
            return <ItemButton key={issue.issue_id} title={title} subtitle={`${winner?.policy?.replaceAll("_", " ") || "inspect"} · ${evidence}`} onClick={() => selectArchitectureIssue(issue)} />;
          }) : <p className="quiet">No cycle or high fan-in future is available in this scope.</p>}
        </RailSection>
        <RailSection title="Change missions" count={changeMissions ? `${changeMissions.totals.missions}${changeMissions.partial ? " · partial" : ""}` : "0"} maxClass="mission-list">
          {missionError ? <p className="error">{missionError}</p> : changeMissions?.missions.length
            ? changeMissions.missions.slice(0, 12).map((mission) => <ItemButton key={mission.mission_id} title={mission.title} subtitle={`group ${mission.parallel_group + 1} · ${mission.kind.replaceAll("_", " ")}${mission.blocked_by_gaps ? " · blocked" : ""}`} onClick={() => selectMission(mission)} />)
            : <p className="quiet">No source changes. The plan will appear as files change.</p>}
        </RailSection>
        <RailSection title="Refactor paths" count={refactorSummary.count} grow>
          {refactorError ? <p className="error">{refactorError}</p> : refactors?.candidates.length
            ? <>{refactors.candidates.map((candidate) => <ItemButton key={`${candidate.left.node_id}:${candidate.right.node_id}`} title={`${candidate.left.symbol} ↔ ${candidate.right.symbol}`} subtitle={`${candidate.language} · score ${candidate.similarity.total}`} onClick={() => selectCandidate(candidate)} />)}{refactorSummary.note && <p className="quiet bounded-note">{refactorSummary.note}</p>}</>
            : <p className="quiet">No candidate crossed the current threshold.</p>}
        </RailSection>
      </aside>

      <section className="stage" aria-labelledby="graph-title">
        <div className="stage__toolbar">
          <div><p className="eyebrow">{stageEyebrow}</p><h1 id="graph-title">{stageTitle}</h1></div>
          {mode === "project" && <label className="detail-select">Detail<select aria-label="Graph detail" value={graphDetail} onChange={e => { setGraphDetail(e.target.value as typeof graphDetail); setSelectedNodeId(null); setInspector({ kind: "none", facts: [] }); }}>
            <option value="symbols">Symbols</option><option value="files">Files</option><option value="packages">Packages</option>
          </select></label>}
          {mode === "project" && <div className="dimension-switch" role="group" aria-label="Graph dimensions">
            <button type="button" aria-pressed={graphDimension === "2d"} onClick={() => setGraphDimension("2d")}>2D</button>
            <button type="button" aria-pressed={graphDimension === "3d"} onClick={() => setGraphDimension("3d")}>3D</button>
          </div>}
          <button className="help-toggle" aria-label="Graph keyboard help" aria-expanded={helpOpen} onClick={() => setHelpOpen(v => !v)}>?</button>
          {mode !== "project" && <><div className="evidence-switch" role="group" aria-label="Evidence layer">
            {EVIDENCE_MODES.map((item) => <button key={item.id} type="button" className={evidenceMode === item.id ? "is-active" : ""} onClick={() => selectEvidenceMode(item.id)}>{item.label}</button>)}
          </div>
          <label className="environment-filter" htmlFor="runtime-environment">Environment
            <select id="runtime-environment" value={runtimeEnvironment} onChange={(event) => selectEnvironment(event.target.value)}>
              <option value="">All</option>
              {(runtimeStatus?.environments || []).map((environment) => <option key={environment} value={environment}>{environment}</option>)}
            </select>
          </label></>}
          {mode !== "history" && mode !== "changes" && <div className="view-actions">
            <button type="button" onClick={() => zoom(1 / 1.2)} aria-label="Zoom out">−</button>
            <button type="button" onClick={resetView}>Reset</button>
            <button type="button" onClick={() => zoom(1.2)} aria-label="Zoom in">+</button>
          </div>}
        </div>

        {helpOpen && <div className="keyboard-help floating-panel" role="region" aria-label="Graph help">
          <PanelHeading title="Graph controls" onClose={() => setHelpOpen(false)} />
          <p>Drag the canvas to move · Scroll to zoom</p><p>Click a node to inspect · Double-click to open code</p>
          <p>2D: drag nodes to arrange · 3D: drag to orbit, right-drag to pan</p><p><kbd>/</kbd> Search · <kbd>Tab</kbd> Navigate · <kbd>Enter</kbd> Inspect · <kbd>Esc</kbd> Close · <kbd>?</kbd> Help</p>
        </div>}
        {mode === "history" ? <GitHistoryPanel snapshot={snapshot} onInspect={setInspector} onError={setMessage} />
          : mode === "changes" ? <MissionDag projection={changeMissions} onSelect={selectMission} onCopy={() => changeMissions?.agent_handoff && void copy(serializeChangeMissionHandoff(changeMissions), "Change mission handoff copied")} />
            : <div
              id="graph-canvas"
              className={`graph-canvas${mode === "project" ? " graph-canvas--project" : ""}`}
              tabIndex={0}
              aria-label="Interactive code relationship graph"
              onWheel={(event) => {
                if (mode === "project") return;
                event.preventDefault();
                zoom(event.deltaY < 0 ? 1.08 : 1 / 1.08);
              }}
              onPointerDown={panStart}
              onPointerMove={panMove}
              onPointerUp={panEnd}
              onKeyDown={(event) => {
                if (mode === "project") return;
                const movement: Record<string, [number, number]> = { ArrowLeft: [-28, 0], ArrowRight: [28, 0], ArrowUp: [0, -28], ArrowDown: [0, 28] };
                const delta = movement[event.key];
                if (!delta) return;
                event.preventDefault();
                setCamera((current) => ({ ...current, x: current.x + delta[0], y: current.y + delta[1] }));
              }}
            >
              {mode === "project" && currentProjectMap
                ? <ProjectCanvasSwitch dimension={graphDimension} ref={projectMapHandle} graph={currentProjectMap} selectedId={selectedNodeId} onNodeSelect={selectProjectNode} onNodeOpen={(node) => { const representative = node.representatives?.[0]; if (representative) void openFocusedGraph(representative.symbol, representative.path); }} onEdgeSelect={inspectEdge} />
                : mode === "project" ? <div className="graph-message"><strong>{repositoryError || "Loading repository relationships…"}</strong>{repositoryError && <button onClick={() => void loadRepository()}>Retry</button>}</div>
                : mode === "compare" && currentGraph && selectedStrategy
                  ? <CompareGraph current={currentGraph} future={projectGraph(currentGraph, selectedStrategy) as GraphResponse} camera={camera} selectedNodeId={selectedNodeId} pins={pinnedPositions} onSelectNode={(node) => { void selectNode(node); }} onInspectEdge={inspectEdge} onNodeDrag={(event, node) => { dragRef.current = { key: String(node.node_id ?? node.id), x: event.clientX, y: event.clientY, origin: { x: node.x, y: node.y } }; }} />
                  : graphForStage
                    ? <SvgGraph graph={graphForStage} camera={camera} selectedNodeId={selectedNodeId} pins={pinnedPositions} onSelectNode={(node) => { void selectNode(node); }} onInspectEdge={inspectEdge} onNodeDrag={(event, node) => { dragRef.current = { key: String(node.node_id ?? node.id), x: event.clientX, y: event.clientY, origin: { x: node.x, y: node.y } }; }} />
                    : <div className="graph-message"><strong>{message || (mode === "architecture" ? "Loading architecture projection…" : "Select a symbol to inspect its neighborhood.")}</strong></div>}
            </div>}

        {mode !== "history" && mode !== "changes" && <footer className="legend" aria-label="Evidence legend">
          <span><i className="key key--proven">✓</i> proven now</span>
          <span><i className="key key--gap">?</i> unresolved gap</span>
          <span><i className="key key--future">+</i> proposed future</span>
          <span><i className="key key--test">T</i> candidate test · not run</span>
          <span><i className="key key--runtime">●</i> observed runtime · width=count · opacity=age</span>
          <button className="legend__action" type="button" onClick={() => currentGraph && void copy(runtimeAgentHandoff(currentGraph as unknown as Record<string, unknown>, runtimeRows), "Runtime agent context copied")}>Copy runtime agent context</button>
        </footer>}
      </section>

      <aside className="inspector floating-panel" aria-label="Evidence inspector" hidden={inspector.kind === "none" || inspectorDismissed}>
        <PanelHeading title="Evidence" detail={inspector.kind} onClose={() => setInspectorDismissed(true)} />
        <Inspector inspector={inspector} onOpenRepresentative={(symbol, path) => { void openFocusedGraph(symbol, path); }} />
        {strategySet.length > 0 && selectedStrategy && <StrategyPanel strategies={strategySet} selected={selectedStrategy} onSelect={(strategy) => chooseStrategy(strategy)} onCopyAgent={copyAgent} onCopyMcp={copyMcp} />}
      </aside>
    </main>
    <div className="sr-only" aria-live="polite">{announcement}</div>
  </>;
}

function RailSection({ title, count, children, maxClass, defaultOpen = false }: { title: string; count: string; children: React.ReactNode; grow?: boolean; maxClass?: string; defaultOpen?: boolean }): React.JSX.Element {
  return <details className="rail__section" open={defaultOpen || undefined}>
    <summary className="section-title"><h2>{title}</h2><span>{count}</span></summary>
    <div className="item-list" id={maxClass}>{children}</div>
  </details>;
}

function ItemButton({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }): React.JSX.Element {
  return <button type="button" className="item" onClick={onClick}><strong>{title}</strong><small>{subtitle}</small></button>;
}

const ProjectCanvasSwitch = forwardRef<ProjectMapCanvasHandle, ProjectMapCanvasProps & { dimension: "2d" | "3d" }>(function ProjectCanvasSwitch({ dimension, ...props }, ref) {
  return dimension === "2d" ? <ProjectCanvas {...props} ref={ref} /> : <ProjectMapCanvas {...props} ref={ref} />;
});

const ProjectMapCanvas = forwardRef<ProjectMapCanvasHandle, ProjectMapCanvasProps>(function ProjectMapCanvas(props, forwardedRef) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ProjectGraphRendererHandle | null>(null);
  const callbacksRef = useRef(props);
  const [size, setSize] = useState({ width: 980, height: 620 });
  callbacksRef.current = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    rendererRef.current = createProjectGraphRenderer(canvas, {
      onNodeSelect: (node) => callbacksRef.current.onNodeSelect(node),
      onNodeOpen: (node) => callbacksRef.current.onNodeOpen(node),
      onEdgeSelect: (edge, source, target) => callbacksRef.current.onEdgeSelect(edge, source, target)
    });
    const observer = new ResizeObserver(() => {
      const parent = canvas.parentElement;
      if (parent) setSize({ width: Math.max(1, parent.clientWidth), height: Math.max(1, parent.clientHeight) });
    });
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    return () => {
      observer.disconnect();
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  const layout = useMemo(() => layoutRepositoryMap(props.graph, { width: size.width, height: size.height }) as ProjectLayout, [props.graph, size.height, size.width]);
  useEffect(() => { rendererRef.current?.render(props.graph, layout, { selectedId: props.selectedId }); }, [layout, props.graph]);
  useEffect(() => { rendererRef.current?.setSelected(props.selectedId); }, [props.selectedId]);
  useImperativeHandle(forwardedRef, () => ({
    zoom: (factor) => rendererRef.current?.zoom(factor),
    resetView: () => rendererRef.current?.resetView(),
    focusNode: (nodeId) => rendererRef.current?.focusNode(nodeId)
  }), []);

  return <canvas ref={canvasRef} className="project-three-canvas" aria-label="Three-dimensional repository dependency map" />;
});

function SvgGraph({ graph, camera, selectedNodeId, pins, onSelectNode, onInspectEdge, onNodeDrag }: {
  graph: GraphResponse;
  camera: CameraState;
  selectedNodeId: GraphId | null;
  pins: Record<string, { x: number; y: number }>;
  onSelectNode: (node: LayoutNode) => void;
  onInspectEdge: (edge: GraphEdge, source: LayoutNode, target: LayoutNode) => void;
  onNodeDrag: (event: React.PointerEvent<SVGGElement>, node: LayoutNode) => void;
}): React.JSX.Element {
  const layout = useMemo(() => layoutGraph(graph, { width: 980, height: 620, pins }) as GraphLayout, [graph, pins]);
  return <svg id="graph-svg" viewBox="0 0 980 620" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Focused code relationship graph">
    <GraphBody graph={graph} layout={layout} transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} onInspectEdge={onInspectEdge} onNodeDrag={onNodeDrag} />
  </svg>;
}

function CompareGraph({ current, future, camera, selectedNodeId, pins, onSelectNode, onInspectEdge, onNodeDrag }: {
  current: GraphResponse;
  future: GraphResponse;
  camera: CameraState;
  selectedNodeId: GraphId | null;
  pins: Record<string, { x: number; y: number }>;
  onSelectNode: (node: LayoutNode) => void;
  onInspectEdge: (edge: GraphEdge, source: LayoutNode, target: LayoutNode) => void;
  onNodeDrag: (event: React.PointerEvent<SVGGElement>, node: LayoutNode) => void;
}): React.JSX.Element {
  const currentLayout = useMemo(() => layoutGraph(current, { width: 980, height: 620, pins }) as GraphLayout, [current, pins]);
  const futureLayout = useMemo(() => layoutGraph(future, { width: 980, height: 620, pins }) as GraphLayout, [future, pins]);
  return <svg id="graph-svg" viewBox="0 0 980 620" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Current and proposed code graphs">
    <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`}>
      <text x="34" y="34" className="comparison-title">CURRENT EVIDENCE</text>
      <text x="524" y="34" className="comparison-title">SELECTED FUTURE</text>
      <GraphBody graph={current} layout={currentLayout} transform="translate(0 46) scale(.5)" selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} onInspectEdge={onInspectEdge} onNodeDrag={onNodeDrag} />
      <GraphBody graph={future} layout={futureLayout} transform="translate(490 46) scale(.5)" selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} onInspectEdge={onInspectEdge} onNodeDrag={onNodeDrag} />
    </g>
  </svg>;
}

function GraphBody({ graph, layout, transform, selectedNodeId, onSelectNode, onInspectEdge, onNodeDrag }: {
  graph: GraphResponse;
  layout: GraphLayout;
  transform: string;
  selectedNodeId: GraphId | null;
  onSelectNode: (node: LayoutNode) => void;
  onInspectEdge: (edge: GraphEdge, source: LayoutNode, target: LayoutNode) => void;
  onNodeDrag: (event: React.PointerEvent<SVGGElement>, node: LayoutNode) => void;
}): React.JSX.Element {
  const byId = new Map(layout.nodes.map((node) => [String(node.node_id), node]));
  const laneLabels: Array<[string, number, number]> = [
    ["CALLERS", 96, 54],
    ["ENTRY POINT", 382, 54],
    ["CALLEES", 668, 54],
    ["TESTS · NOT RUN", 382, 380]
  ];
  return <g transform={transform}>
    {laneLabels.map(([label, x, y]) => <text key={label} x={x} y={y} className="lane-label">{label}</text>)}
    {layout.containers.map((container) => <React.Fragment key={container.id}>
      <rect x={container.x} y={container.y} width={container.width} height={container.height} className="file-container" />
      <text x={container.x + 10} y={container.y + 17} className="file-label">{shorten(container.path, 46)}</text>
    </React.Fragment>)}
    {(graph.edges || []).map((edge, index) => {
      const source = byId.get(String(edge.source));
      const target = byId.get(String(edge.target));
      return source && target ? <GraphEdgeView key={`${edge.source}:${edge.target}:${edge.relation}:${index}`} edge={edge} source={source} target={target} onInspect={onInspectEdge} /> : null;
    })}
    {layout.nodes.map((node) => <GraphNodeView key={String(node.node_id ?? node.id)} node={node} selected={String(selectedNodeId) === String(node.node_id)} onSelect={onSelectNode} onDrag={onNodeDrag} />)}
  </g>;
}

function GraphEdgeView({ edge, source, target, onInspect }: { edge: GraphEdge; source: LayoutNode; target: LayoutNode; onInspect: (edge: GraphEdge, source: LayoutNode, target: LayoutNode) => void }): React.JSX.Element {
  const sx = source.x + source.width;
  const sy = source.y + source.height / 2;
  const tx = target.x;
  const ty = target.y + target.height / 2;
  const middle = (sx + tx) / 2;
  const style = edgeStyle(edge) as { className: string; marker: string; dash: string };
  const runtimeStyle = runtimeEdgePresentation(edge as Parameters<typeof runtimeEdgePresentation>[0]);
  return <g data-graph-interactive="true" tabIndex={0} role="button" aria-label={`${source.symbol} ${edge.relation} ${target.symbol}, ${edge.confidence || "unknown confidence"}`} onClick={() => onInspect(edge, source, target)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onInspect(edge, source, target); } }}>
    <path d={`M ${sx} ${sy} H ${middle} V ${ty} H ${tx}`} className={style.className} strokeDasharray={runtimeStyle?.dash || style.dash} strokeWidth={runtimeStyle?.width || 1.7} opacity={runtimeStyle?.opacity || 1} />
    <text x={middle + 5} y={ty - 6} className="edge-label">{runtimeStyle?.marker || style.marker}</text>
  </g>;
}

function GraphNodeView({ node, selected, onSelect, onDrag }: { node: LayoutNode; selected: boolean; onSelect: (node: LayoutNode) => void; onDrag: (event: React.PointerEvent<SVGGElement>, node: LayoutNode) => void }): React.JSX.Element {
  const className = [
    "node",
    node.lane === "tests" ? "node--test" : "",
    node.changed ? "node--changed" : "",
    node.status === "hypothetical" ? "node--future" : "",
    node.status === "remove" ? "node--remove" : "",
    node.pinned ? "node--pinned" : "",
    selected ? "is-selected" : ""
  ].filter(Boolean).join(" ");
  return <g data-graph-interactive="true" transform={`translate(${node.x} ${node.y})`} className={className} tabIndex={0} role="button" aria-label={`${node.symbol}, ${node.path}, ${node.lane}`} onClick={() => onSelect(node)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(node); } }} onPointerDown={(event) => { event.stopPropagation(); onDrag(event, node); }}>
    <rect width={node.width} height={node.height} />
    <circle cx="15" cy="17" r="4" className="node__status" />
    <text x="27" y="21" className="node__title">{shorten(node.symbol, 27)}</text>
    <text x="14" y="45" className="node__path">{shorten(node.path, 31)}</text>
  </g>;
}

function MissionDag({ projection, onSelect, onCopy }: { projection: ChangeMissionProjection | null; onSelect: (mission: ChangeMission) => void; onCopy: () => void }): React.JSX.Element {
  if (!projection) return <div className="mission-panel"><p className="quiet">Loading change missions…</p></div>;
  const totals = projection.totals;
  return <div className="mission-panel" aria-label="Change mission execution graph">
    <div className="mission-panel__header">
      <div><p className="eyebrow">Deterministic execution DAG</p><p className="quiet">{totals.missions} missions · {totals.parallel_groups} sequential groups · {totals.blocked} blocked by coverage gaps</p></div>
      <button type="button" className="mission-copy" onClick={onCopy}>Copy agent handoff</button>
    </div>
    <div className="mission-dag">{projection.groups.map((group) => <section className="mission-group" key={group.index}>
      <h2>Group {group.index + 1}</h2><p>{group.missions.length > 1 ? `${group.missions.length} missions can run in parallel` : "Run after dependencies"}</p>
      {group.missions.map((mission) => {
        const readiness = mission.blocked_by_gaps ? "blocked · inspect gaps" : mission.depends_on?.length ? `after ${mission.depends_on.length}` : "ready";
        return <button type="button" key={mission.mission_id} className={`mission-card${mission.blocked_by_gaps ? " mission-card--blocked" : ""}`} onClick={() => onSelect(mission)}>
          <span className="mission-card__kind">{mission.kind.replaceAll("_", " ")}</span><strong>{shorten(mission.title, 38)}</strong><small>{mission.evidenceCount} evidence · {mission.testCount} tests</small><small>{readiness}</small>
        </button>;
      })}
    </section>)}</div>
  </div>;
}

function GitHistoryPanel({ snapshot, onInspect, onError }: { snapshot: Snapshot | null; onInspect: (value: InspectorState) => void; onError: (message: string) => void }): React.JSX.Element {
  const ref = useRef<GitGraphElement | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.theme = "dark";
    element.density = "compact";
    element.columns = "commit";
    element.dateFormat = "relative";
    element.avatars = false;
    element.provider = new CgrxGitGraphProvider(api);
    const select = (rawEvent: Event): void => {
      const event = rawEvent as GitGraphSelectEvent;
      const commit = event.detail.commit;
      const refs = (element.data?.refs || []).filter((item) => item.target === commit.oid).map((item) => item.name);
      onInspect({ kind: "commit", facts: [
        ["Commit", commit.oid], ["Subject", commit.message], ["Author", commit.author?.name], ["Authored", commit.authoredAt], ["Parents", commit.parents?.join(", ") || "root"], ["Refs", refs.join(", ") || "none"]
      ] });
    };
    const error = (rawEvent: Event): void => onError((rawEvent as GitGraphErrorEvent).detail?.error?.message || "Git history request failed");
    element.addEventListener("gitgraph-commit-select", select);
    element.addEventListener("gitgraph-error", error);
    return () => {
      element.removeEventListener("gitgraph-commit-select", select);
      element.removeEventListener("gitgraph-error", error);
    };
  }, [onError, onInspect]);
  useEffect(() => { if (snapshot) ref.current?.refresh?.(); }, [snapshot]);
  return <div className="git-history-panel">{React.createElement("web-git-graph", { ref, "aria-label": "Git commit history" })}</div>;
}

function Inspector({ inspector, onOpenRepresentative }: { inspector: InspectorState; onOpenRepresentative: (symbol: string, path: string) => void }): React.JSX.Element {
  return <div className="inspector__content">
    {inspector.facts.length ? <dl>{inspector.facts.map(([term, value], index) => <div className="fact" key={`${term}:${index}`}><dt>{term}</dt><dd><code>{String(value ?? "unknown")}</code></dd></div>)}</dl> : <p className="quiet">Select a node or edge to inspect its source identity, resolver and confidence.</p>}
    {inspector.representatives?.length ? <div className="project-representatives"><p className="quiet">Representative symbols · open focused graph</p>{inspector.representatives.map((representative) => <ItemButton key={String(representative.node_id)} title={representative.symbol} subtitle={shorten(representative.path, 34)} onClick={() => onOpenRepresentative(representative.symbol, representative.path)} />)}</div> : null}
    {inspector.code && <pre className="code">{inspector.code}</pre>}
    {inspector.error && <p className="error">{inspector.error}</p>}
  </div>;
}

function StrategyPanel({ strategies, selected, onSelect, onCopyAgent, onCopyMcp }: { strategies: Strategy[]; selected: Strategy; onSelect: (strategy: Strategy) => void; onCopyAgent: () => void; onCopyMcp: () => void }): React.JSX.Element {
  const blocked = selected.status === "blocked_by_gaps";
  const summary = selected.summary || `${(selected.counterfactual?.reasons || []).map((reason) => reason.replaceAll("_", " ")).join(" · ")} · graph ${JSON.stringify(selected.predicted_graph || {})}`;
  return <section className="strategy-panel">
    <div className="strategy-tabs" role="tablist" aria-label="Refactor strategies">{strategies.map((strategy) => <button type="button" role="tab" key={strategy.strategy_id} aria-selected={strategy.strategy_id === selected.strategy_id} onClick={() => onSelect(strategy)}>{strategy.policy.replaceAll("_", " ")}</button>)}</div>
    <div><p className="strategy-summary">{summary}</p><span className={`risk${blocked ? " risk--blocked" : ""}`}>{blocked ? "blocked by gaps" : `${selected.counterfactual?.score ?? selected.risk} · hypothetical`}</span></div>
    <div className="copy-actions"><button type="button" onClick={onCopyAgent}>Copy agent plan</button><button type="button" className="button--quiet" onClick={onCopyMcp}>Copy MCP call</button></div>
  </section>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function shorten(value: unknown, limit: number): string {
  const text = String(value ?? "");
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

const root = document.getElementById("root");
if (!root) throw new Error("CGRX visualizer root is missing");
createRoot(root).render(<App />);
