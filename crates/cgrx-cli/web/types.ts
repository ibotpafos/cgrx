export type GraphId = string | number;
export type Mode = "project" | "current" | "architecture" | "changes" | "preview" | "compare" | "history";

export interface Snapshot {
  repo_revision: string;
  working_tree_digest: string;
  graph_generation: number;
}

export interface Span {
  start: number;
  end: number;
}

export interface RepresentativeNode {
  node_id: GraphId;
  symbol: string;
  path: string;
  weighted_degree?: number;
}

export interface GraphNode {
  node_id: GraphId;
  id?: GraphId;
  symbol: string;
  path: string;
  span?: Span;
  source_hash?: string;
  lane?: string;
  kind?: string;
  status?: string;
  changed?: boolean;
  files?: number;
  symbols?: number;
  fan_in?: number;
  fan_out?: number;
  cycle?: boolean;
  pinned?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface EvidenceSite {
  resolver?: string;
  path?: string;
  span?: Span;
  source_hash?: string;
}

export interface GraphEdge {
  source: GraphId;
  target: GraphId;
  relation: string;
  confidence?: string;
  status?: string;
  evidence?: EvidenceSite | string;
  evidence_count?: number;
  weight?: number;
  count?: number;
  environments?: string[];
  last_seen_unix_nanos?: number;
}

export interface GraphRoot {
  symbol: string;
  path: string;
}

export interface GraphResponse {
  snapshot: Snapshot;
  root: GraphRoot;
  nodes: GraphNode[];
  edges: GraphEdge[];
  evidence?: unknown;
  environment_filter?: string[];
  runtime_gaps?: unknown;
  partial?: boolean;
  coverage_gap_count?: number;
  projection?: string;
}

export interface SearchMatch {
  symbol: string;
  path: string;
  span: Span;
}

export interface SearchResponse {
  total: number;
  matches: SearchMatch[];
}

export interface RuntimeInsight {
  symbol: string;
  path: string;
  refactor_priority: number;
  observed_count: number;
  next_action: string;
}

export interface RuntimeStatus {
  environments?: string[];
  insights?: {
    rows?: RuntimeInsight[];
    total?: number;
  };
}

export interface ProjectNode extends GraphNode {
  community: string;
  files: number;
  symbols: number;
  fan_in: number;
  fan_out: number;
  degree: number;
  cycle: boolean;
  representatives: RepresentativeNode[];
}

export interface ProjectCommunity {
  id: string;
  label: string;
  packages: string[];
  cohesion?: number;
  internal_weight?: number;
  cut_weight?: number;
}

export interface ProjectMap {
  snapshot: Snapshot;
  root: GraphRoot;
  nodes: ProjectNode[];
  edges: GraphEdge[];
  communities: ProjectCommunity[];
  totals?: Record<string, number>;
  partial?: boolean;
  coverage_gap_count?: number;
  package_depth?: number;
}

export interface ProjectLayoutNode extends ProjectNode {
  x: number;
  y: number;
  radius: number;
  color: string;
  showLabel: boolean;
  pinned: boolean;
}

export interface ProjectLayoutCommunity extends ProjectCommunity {
  x: number;
  y: number;
  radius: number;
}

export interface ProjectLayout {
  width: number;
  height: number;
  nodes: ProjectLayoutNode[];
  communities: ProjectLayoutCommunity[];
}

export interface CameraState {
  x: number;
  y: number;
  scale: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface LayoutNode extends GraphNode {
  lane: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
}

export interface LayoutContainer {
  id: string;
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GraphLayout {
  width: number;
  height: number;
  nodes: LayoutNode[];
  containers: LayoutContainer[];
}

export interface Strategy {
  strategy_id: string;
  policy: string;
  status?: string;
  recommended?: boolean;
  summary?: string;
  risk?: string | number;
  counterfactual?: {
    reasons?: string[];
    score?: string | number;
  };
  predicted_graph?: unknown;
  graph_delta?: unknown;
  verification?: unknown;
  agent_handoff?: unknown;
  [key: string]: unknown;
}

export interface ArchitectureIssue {
  issue_id: string;
  kind: string;
  packages?: string[];
  selected_boundary?: {
    source?: string;
    target?: string;
    edges?: number;
  };
  symbol?: {
    symbol?: string;
    path?: string;
    fan_in?: number;
  };
  strategies: Strategy[];
  [key: string]: unknown;
}

export interface RefactorCandidate {
  language: string;
  left: RepresentativeNode;
  right: RepresentativeNode;
  similarity: { total: number };
  strategies: Strategy[];
  [key: string]: unknown;
}

export interface ChangeMission {
  mission_id: string;
  title: string;
  kind: string;
  parallel_group: number;
  blocked_by_gaps?: boolean;
  depends_on?: string[];
  change_paths?: string[];
  review_paths?: string[];
  evidenceCount: number;
  testCount: number;
  steps?: string[];
}

export interface ChangeMissionGroup {
  index: number;
  missions: ChangeMission[];
}

export interface ChangeMissionProjection {
  partial?: boolean;
  totals: {
    missions: number;
    parallel_groups: number;
    blocked: number;
  };
  missions: ChangeMission[];
  groups: ChangeMissionGroup[];
  agent_handoff?: unknown;
}

export interface InspectorState {
  kind: string;
  facts: Array<[string, unknown]>;
  code?: string;
  error?: string;
  representatives?: RepresentativeNode[];
}

export interface StatusResponse {
  snapshot: Snapshot;
  repo?: string;
  graph?: { nodes?: number; edges?: number };
  freshness?: string;
}
