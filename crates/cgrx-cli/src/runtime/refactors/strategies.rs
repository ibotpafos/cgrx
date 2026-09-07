use cgrx_core::RepoSnapshot;
use serde_json::{Value, json};

pub(super) fn derive(
    candidate: &Value,
    snapshot: &RepoSnapshot,
    coverage_gaps: &[Value],
    partial: bool,
) -> Vec<Value> {
    let projection = &candidate["projection"];
    let preserve = projection["preserve"].clone();
    let helper_add = projection["add"].clone();
    let helper_moves = projection["move_to_helper"].clone();
    let helper = projection["helper"].clone();
    let left_node = candidate["left"].clone();
    let right_node = candidate["right"].clone();
    let review_symbols = json!([left_node, right_node]);

    let mut strategies = [
        ("preserve_entrypoints", "low"),
        ("canonical_entrypoint", "medium"),
        ("consolidate", "high"),
    ]
    .into_iter()
    .map(|(policy, risk)| {
        let strategy_id = strategy_id(snapshot, projection, policy);
        let destructive = policy != "preserve_entrypoints";
        let blocked = destructive && (partial || !coverage_gaps.is_empty());
        let redirected_callers = redirect_callers(&preserve, &right_node, &left_node);
        let compatibility_edge = json!([{
            "relation":"CALLS",
            "source":right_node,
            "target":left_node,
            "confidence":"hypothetical"
        }]);
        let (summary, add, redirect, move_to_helper, remove, edit_obligations) = match policy {
            "preserve_entrypoints" => (
                "Extract a shared helper and preserve both entry points.",
                helper_add.clone(),
                json!([]),
                json!([]),
                helper_moves.clone(),
                json!([
                    {"action":"inspect","target":left_node},
                    {"action":"inspect","target":right_node},
                    {"action":"introduce_helper","target":helper}
                ]),
            ),
            "canonical_entrypoint" => (
                "Redirect proven internal callers to one canonical entry point and retain compatibility.",
                compatibility_edge,
                redirected_callers.clone(),
                json!([]),
                json!([]),
                json!([
                    {"action":"inspect","target":left_node},
                    {"action":"redirect_proven_callers","target":left_node},
                    {"action":"retain_compatibility_wrapper","target":right_node}
                ]),
            ),
            _ => (
                "Consolidate the duplicate only after every removal precondition is verified.",
                json!([]),
                redirected_callers,
                json!([]),
                if blocked { json!([]) } else { json!([right_node]) },
                json!([
                    {"action":"inspect","target":left_node},
                    {"action":"redirect_proven_callers","target":left_node},
                    {"action":"remove_duplicate_when_unblocked","target":right_node}
                ]),
            ),
        };
        let counterfactual = counterfactual(
            candidate,
            policy,
            blocked,
            &preserve,
            &add,
            &redirect,
            &move_to_helper,
            &remove,
        );
        json!({
            "strategy_id":strategy_id,
            "policy":policy,
            "status":if blocked { "blocked_by_gaps" } else { "hypothetical" },
            "recommended":false,
            "risk":risk,
            "summary":summary,
            "preconditions":if destructive {
                json!([
                    "All relevant callers are proven and within the inspected scope.",
                    "No parser, stale-source, truncation, dispatch, or public-surface gap remains."
                ])
            } else {
                json!([])
            },
            "blocking_gaps":if blocked { Value::Array(coverage_gaps.to_vec()) } else { json!([]) },
            "graph_delta":{
                "preserve":preserve,
                "add":add,
                "redirect":redirect,
                "move_to_helper":move_to_helper,
                "remove":remove
            },
            "counterfactual":counterfactual,
            "edit_obligations":edit_obligations,
            "verification":{
                "review_symbols":review_symbols,
                "candidate_tests":[],
                "execution_status":"not_run",
                "coverage_reference":"coverage_gaps"
            },
            "agent_handoff":{
                "objective":summary,
                "constraints":[
                    "Recheck the repository snapshot before editing.",
                    "Preserve every proven relationship listed in graph_delta.preserve.",
                    "Treat candidate tests as not run until a runner executes them."
                ],
                "ordered_steps":[
                    "Inspect both candidate symbols and their cited evidence.",
                    "Apply only the selected hypothetical graph delta.",
                    "Run the candidate verification and report remaining coverage gaps."
                ],
                "acceptance":[
                    "The selected graph delta is reflected in indexed source relationships.",
                    "All preserved proven relationships remain present.",
                    "Executed and unexecuted checks are reported separately."
                ],
                "decision":{}
            }
        })
    })
    .collect::<Vec<_>>();
    strategies.sort_by(|left, right| {
        right["counterfactual"]["score"]
            .as_u64()
            .cmp(&left["counterfactual"]["score"].as_u64())
            .then_with(|| policy_rank(&left["policy"]).cmp(&policy_rank(&right["policy"])))
    });
    for (index, strategy) in strategies.iter_mut().enumerate() {
        let rank = index + 1;
        strategy["recommended"] = (rank == 1).into();
        strategy["counterfactual"]["rank"] = rank.into();
        strategy["agent_handoff"]["decision"] = json!({
            "algorithm":"counterfactual_refactor_v1",
            "rank":rank,
            "score":strategy["counterfactual"]["score"],
            "formula":strategy["counterfactual"]["formula"],
            "reasons":strategy["counterfactual"]["reasons"],
            "llm_used":false
        });
    }
    strategies
}

#[allow(clippy::too_many_arguments)]
fn counterfactual(
    candidate: &Value,
    policy: &str,
    blocked: bool,
    preserve: &Value,
    add: &Value,
    redirect: &Value,
    move_to_helper: &Value,
    remove: &Value,
) -> Value {
    let similarity = candidate["similarity"]["total"].as_u64().unwrap_or(0);
    let shared = candidate["shared_callees"].as_array().map_or(0, Vec::len) as u64;
    let duplicate_calls = candidate["runtime_profile"]["duplicate_incoming_count"]
        .as_u64()
        .unwrap_or(0);
    let observed_only = candidate["runtime_profile"]["observed_only_edges"]
        .as_u64()
        .unwrap_or(0);
    let (similarity_weight, graph_benefit, base_risk, runtime_weight) = match policy {
        "preserve_entrypoints" => (70, 80 + shared * 30, 50, 0),
        "canonical_entrypoint" => (75, 140 + shared * 30, 180, 2),
        _ => (85, 240 + shared * 30, 300, 4),
    };
    let duplicate_reduction = similarity.saturating_mul(similarity_weight) / 100;
    let runtime_penalty =
        duplicate_calls.min(100).saturating_mul(runtime_weight) + observed_only.saturating_mul(50);
    let gap_penalty = if blocked { 1_000 } else { 0 };
    let score = duplicate_reduction
        .saturating_add(graph_benefit)
        .saturating_sub(base_risk)
        .saturating_sub(runtime_penalty)
        .saturating_sub(gap_penalty)
        .min(1_000);
    let mut reasons = vec!["structural_duplication_reduction"];
    if duplicate_calls > 0 {
        reasons.push("observed_entrypoint_change_cost");
    }
    if observed_only > 0 {
        reasons.push("static_runtime_divergence");
    }
    if blocked {
        reasons.push("coverage_gaps_block_destructive_change");
    }
    json!({
        "algorithm":"counterfactual_refactor_v1",
        "score":score,
        "rank":0,
        "llm_used":false,
        "reasons":reasons,
        "formula":{
            "duplicate_reduction":duplicate_reduction,
            "graph_benefit":graph_benefit,
            "base_risk":base_risk,
            "runtime_penalty":runtime_penalty,
            "gap_penalty":gap_penalty,
            "score":"clamp(duplicate_reduction + graph_benefit - base_risk - runtime_penalty - gap_penalty, 0, 1000)",
            "inputs":{
                "similarity":similarity,
                "shared_callees":shared,
                "duplicate_incoming_count":duplicate_calls,
                "observed_only_edges":observed_only,
                "blocked":blocked
            }
        },
        "predicted_graph":{
            "preserved_edges":preserve.as_array().map_or(0, Vec::len),
            "edges_added":add.as_array().map_or(0, Vec::len),
            "edges_redirected":redirect.as_array().map_or(0, Vec::len),
            "edges_moved":move_to_helper.as_array().map_or(0, Vec::len),
            "nodes_added":u64::from(policy == "preserve_entrypoints"),
            "nodes_removed":remove.as_array().map_or(0, Vec::len)
        }
    })
}

fn policy_rank(policy: &Value) -> u8 {
    match policy.as_str() {
        Some("preserve_entrypoints") => 0,
        Some("canonical_entrypoint") => 1,
        _ => 2,
    }
}

fn redirect_callers(preserve: &Value, duplicate: &Value, canonical: &Value) -> Value {
    let duplicate_id = duplicate["node_id"].as_u64();
    Value::Array(
        preserve
            .as_array()
            .into_iter()
            .flatten()
            .filter(|edge| edge["target"]["node_id"].as_u64() == duplicate_id)
            .map(|edge| {
                json!({
                    "relation":edge["relation"],
                    "source":edge["source"],
                    "from":duplicate,
                    "target":canonical,
                    "confidence":"hypothetical",
                    "evidence":edge["evidence"]
                })
            })
            .collect(),
    )
}

fn strategy_id(snapshot: &RepoSnapshot, projection: &Value, policy: &str) -> String {
    let encoded = serde_json::to_vec(&json!({
        "snapshot":snapshot,
        "projection":projection["id"],
        "policy":policy
    }))
    .expect("strategy identity serializes");
    let digest = blake3::hash(&encoded).to_hex().to_string();
    format!("strategy1.{}", &digest[..16])
}
