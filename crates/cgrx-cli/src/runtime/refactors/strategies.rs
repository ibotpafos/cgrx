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

    [
        ("preserve_entrypoints", true, "low"),
        ("canonical_entrypoint", false, "medium"),
        ("consolidate", false, "high"),
    ]
    .into_iter()
    .map(|(policy, recommended, risk)| {
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
        json!({
            "strategy_id":strategy_id,
            "policy":policy,
            "status":if blocked { "blocked_by_gaps" } else { "hypothetical" },
            "recommended":recommended,
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
                ]
            }
        })
    })
    .collect()
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
