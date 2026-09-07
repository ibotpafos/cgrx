import assert from "node:assert/strict";
import test from "node:test";
import { graphEvidenceQuery, runtimeAgentHandoff, runtimeEdgePresentation } from "../vendor/runtime-evidence.js";

test("runtime edge presentation is deterministic and bounded", () => {
  const style = runtimeEdgePresentation({ evidence: "observed", count: 1024, last_seen_unix_nanos: 1, environments: ["prod"] }, 60 * 86_400_000_000_000);
  assert.equal(style.width, 6);
  assert.equal(style.opacity, 0.35);
  assert.equal(style.dash, "5 5");
  assert.match(style.label, /1,024 calls.*prod/);
  assert.equal(runtimeEdgePresentation({ evidence: { path: "x" } }), null);
});

test("evidence query and agent handoff remain reproducible and model-free", () => {
  assert.equal(graphEvidenceQuery("all", ["prod", "dev", "prod"]), "evidence=all&environment=dev&environment=prod");
  const handoff = JSON.parse(runtimeAgentHandoff({ snapshot: { graph_generation: 3 }, evidence: "all", edges: [{ evidence: "observed", count: 2 }, { evidence: "static" }] }, [{ refactor_priority: 900 }]));
  assert.equal(handoff.observed_edges.length, 1);
  assert.equal(handoff.constraints.llm_used, false);
  assert.equal(handoff.constraints.revalidate_snapshot_before_edit, true);
  assert.equal(handoff.deterministic_insights[0].refactor_priority, 900);
});
