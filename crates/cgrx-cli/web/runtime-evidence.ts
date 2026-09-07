export type EvidenceMode = "static" | "observed" | "all";

export interface RuntimeGraphEdge {
  evidence?: string | Record<string, unknown>;
  count?: number;
  last_seen_unix_nanos?: number;
  environments?: string[];
}

export interface RuntimeEdgePresentation {
  dash: string;
  marker: string;
  width: number;
  opacity: number;
  label: string;
}

export function runtimeEdgePresentation(edge: RuntimeGraphEdge, nowUnixNanos = Date.now() * 1_000_000): RuntimeEdgePresentation | null {
  const evidence = typeof edge.evidence === "string" ? edge.evidence : "";
  if (!evidence.includes("observed")) return null;
  const count = Math.max(1, Number(edge.count) || 1);
  const ageDays = Math.max(0, (nowUnixNanos - Number(edge.last_seen_unix_nanos || nowUnixNanos)) / 86_400_000_000_000);
  const opacity = Math.max(0.35, Math.min(1, 1 - ageDays / 30));
  const width = Math.min(6, 1.7 + Math.log2(count + 1));
  return {
    dash: evidence === "observed" ? "5 5" : "2 3",
    marker: "●",
    width,
    opacity,
    label: `${count.toLocaleString("en-US")} calls · ${(edge.environments || []).join(", ") || "runtime"}`
  };
}

export function graphEvidenceQuery(mode: EvidenceMode, environments: string[]): string {
  const query = new URLSearchParams({ evidence: mode });
  for (const environment of [...new Set(environments)].sort()) query.append("environment", environment);
  return query.toString();
}

export function runtimeAgentHandoff(graph: Record<string, unknown>, insights: unknown[] = []): string {
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const observed = edges.filter((edge: RuntimeGraphEdge) => typeof edge.evidence === "string" && edge.evidence.includes("observed"));
  return JSON.stringify({
    schema: "cgrx.agent.runtime-overlay.v1",
    snapshot: graph.snapshot,
    root: graph.root,
    evidence: graph.evidence,
    environment_filter: graph.environment_filter || [],
    observed_edges: observed,
    runtime_gaps: graph.runtime_gaps || { unresolved: 0, ambiguous: 0 },
    deterministic_insights: insights,
    constraints: {
      llm_used: false,
      revalidate_snapshot_before_edit: true,
      observed_paths_are_execution_evidence_not_exhaustive_coverage: true
    }
  }, null, 2);
}
