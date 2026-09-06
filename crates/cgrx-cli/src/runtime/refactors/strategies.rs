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
    let add = projection["add"].clone();
    let move_to_helper = projection["move_to_helper"].clone();
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
        let (summary, redirect, remove) = match policy {
            "preserve_entrypoints" => (
                "Extract a shared helper and preserve both entry points.",
                json!([]),
                json!([]),
            ),
            "canonical_entrypoint" => (
                "Redirect proven internal callers to one canonical entry point and retain compatibility.",
                json!([]),
                json!([]),
            ),
            _ => (
                "Consolidate the duplicate only after every removal precondition is verified.",
                json!([]),
                json!([]),
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
            "edit_obligations":[
                {"action":"inspect","target":left_node},
                {"action":"inspect","target":right_node},
                {"action":"introduce_helper","target":helper}
            ],
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
