//! Deterministic execution units derived from change evidence.
use super::*;

#[derive(Default)]
struct Mission {
    key: String,
    kind: &'static str,
    change_paths: BTreeSet<String>,
    review_paths: BTreeSet<String>,
    finding_indexes: Vec<usize>,
    impact_indexes: Vec<usize>,
    related_test_indexes: Vec<usize>,
    touched_paths: BTreeSet<String>,
    blocking_gaps: Vec<Value>,
    id: String,
    parallel_group: usize,
    depends_on: Vec<String>,
}

pub(super) struct MissionInput<'a> {
    pub snapshot: RepoSnapshot,
    pub base_revision: &'a str,
    pub findings: &'a [Value],
    pub impacts: &'a [Value],
    pub verification_plan: &'a Value,
    pub changed_paths: &'a BTreeSet<String>,
    pub gaps: &'a [Value],
    pub partial: bool,
}

pub(super) fn build(input: MissionInput<'_>) -> Value {
    let MissionInput {
        snapshot,
        base_revision,
        findings,
        impacts,
        verification_plan,
        changed_paths,
        gaps,
        partial,
    } = input;
    let mut grouped = BTreeMap::<String, Mission>::new();
    for (index, impact) in impacts.iter().enumerate() {
        let Some(path) = impact
            .pointer("/changed_target/path")
            .and_then(Value::as_str)
        else {
            continue;
        };
        let symbol = impact
            .pointer("/changed_target/symbol")
            .and_then(Value::as_str)
            .unwrap_or("");
        let key = format!("impact:{path}:{symbol}");
        let mission = grouped.entry(key.clone()).or_insert_with(|| Mission {
            key,
            kind: "changed_dependency",
            ..Mission::default()
        });
        mission.change_paths.insert(path.to_owned());
        mission.touched_paths.insert(path.to_owned());
        mission.impact_indexes.push(index);
        if let Some(caller_path) = impact.pointer("/caller/path").and_then(Value::as_str) {
            mission.review_paths.insert(caller_path.to_owned());
            mission.touched_paths.insert(caller_path.to_owned());
        }
    }
    for (index, finding) in findings.iter().enumerate() {
        let path = finding
            .pointer("/removed_target/path")
            .and_then(Value::as_str)
            .or_else(|| finding.get("path").and_then(Value::as_str))
            .unwrap_or(".");
        let symbol = finding
            .pointer("/removed_target/symbol")
            .and_then(Value::as_str)
            .unwrap_or("");
        let key = format!("finding:{path}:{symbol}:{index}");
        let mission = grouped.entry(key.clone()).or_insert_with(|| Mission {
            key,
            kind: "retained_call_candidate",
            ..Mission::default()
        });
        mission.change_paths.insert(path.to_owned());
        mission.touched_paths.insert(path.to_owned());
        mission.finding_indexes.push(index);
        if let Some(review_path) = finding.get("path").and_then(Value::as_str) {
            mission.review_paths.insert(review_path.to_owned());
            mission.touched_paths.insert(review_path.to_owned());
        }
    }
    let represented = grouped
        .values()
        .flat_map(|mission| mission.change_paths.iter().cloned())
        .collect::<BTreeSet<_>>();
    for path in changed_paths {
        if represented.contains(path) {
            continue;
        }
        let key = format!("review:{path}");
        grouped.insert(
            key.clone(),
            Mission {
                key,
                kind: "review_changed_path",
                change_paths: BTreeSet::from([path.clone()]),
                review_paths: BTreeSet::from([path.clone()]),
                touched_paths: BTreeSet::from([path.clone()]),
                ..Mission::default()
            },
        );
    }
    let tests = verification_plan
        .get("related_tests")
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[]);
    for (test_index, test) in tests.iter().enumerate() {
        let Some(impact_index) = test.get("impact_index").and_then(Value::as_u64) else {
            continue;
        };
        for mission in grouped.values_mut() {
            if mission.impact_indexes.contains(&(impact_index as usize)) {
                mission.related_test_indexes.push(test_index);
                if let Some(path) = test.get("path").and_then(Value::as_str) {
                    mission.touched_paths.insert(path.to_owned());
                }
            }
        }
    }
    let snapshot_key = serde_json::to_string(&snapshot).expect("snapshot serializes");
    for mission in grouped.values_mut() {
        mission.blocking_gaps = gaps
            .iter()
            .filter(|gap| {
                gap.get("path")
                    .and_then(Value::as_str)
                    .is_some_and(|path| path == "." || mission.touched_paths.contains(path))
            })
            .cloned()
            .collect();
        let digest = blake3::hash(format!("{}:{}", snapshot_key, mission.key).as_bytes())
            .to_hex()
            .to_string();
        mission.id = format!("change-mission.{}", &digest[..16]);
    }
    let mut missions = grouped.into_values().collect::<Vec<_>>();
    let mut occupied = Vec::<BTreeSet<String>>::new();
    for index in 0..missions.len() {
        let prior_conflicts = (0..index)
            .filter(|&prior| {
                !missions[prior]
                    .touched_paths
                    .is_disjoint(&missions[index].touched_paths)
            })
            .collect::<Vec<_>>();
        missions[index].depends_on = prior_conflicts
            .iter()
            .map(|&prior| missions[prior].id.clone())
            .collect();
        let minimum_group = prior_conflicts
            .iter()
            .map(|&prior| missions[prior].parallel_group + 1)
            .max()
            .unwrap_or(0);
        let mut group = minimum_group;
        while occupied
            .get(group)
            .is_some_and(|paths| !paths.is_disjoint(&missions[index].touched_paths))
        {
            group += 1;
        }
        if occupied.len() <= group {
            occupied.resize_with(group + 1, BTreeSet::new);
        }
        occupied[group].extend(missions[index].touched_paths.iter().cloned());
        missions[index].parallel_group = group;
    }
    let mission_values = missions
        .iter()
        .map(|mission| {
            let steps = steps(mission);
            json!({
                "mission_id":mission.id,
                "kind":mission.kind,
                "parallel_group":mission.parallel_group,
                "depends_on":mission.depends_on,
                "change_paths":mission.change_paths,
                "review_paths":mission.review_paths,
                "finding_indexes":mission.finding_indexes,
                "impact_indexes":mission.impact_indexes,
                "related_test_indexes":mission.related_test_indexes,
                "touched_paths":mission.touched_paths,
                "steps":steps,
                "blocked_by_gaps":!mission.blocking_gaps.is_empty(),
                "blocking_gaps":mission.blocking_gaps,
                "execution_status":"not_started"
            })
        })
        .collect::<Vec<_>>();
    let execution_order = (0..occupied.len())
        .map(|group| {
            missions
                .iter()
                .filter(|mission| mission.parallel_group == group)
                .map(|mission| Value::String(mission.id.clone()))
                .collect::<Vec<_>>()
        })
        .collect::<Vec<_>>();
    let handoff_missions = mission_values
        .iter()
        .map(|mission| {
            json!({
                "mission_id":mission["mission_id"],
                "kind":mission["kind"],
                "parallel_group":mission["parallel_group"],
                "depends_on":mission["depends_on"],
                "change_paths":mission["change_paths"],
                "review_paths":mission["review_paths"],
                "finding_indexes":mission["finding_indexes"],
                "impact_indexes":mission["impact_indexes"],
                "related_test_indexes":mission["related_test_indexes"],
                "touched_paths":mission["touched_paths"],
                "steps":mission["steps"],
                "blocked_by_gaps":mission["blocked_by_gaps"],
                "blocking_gaps":mission["blocking_gaps"],
                "execution_status":mission["execution_status"]
            })
        })
        .collect::<Vec<_>>();
    json!({
        "algorithm":"change_missions_v1",
        "llm_used":false,
        "status":"candidate_plan",
        "snapshot":snapshot,
        "base_revision":base_revision,
        "missions":mission_values,
        "execution_order":execution_order,
        "totals":{
            "missions":missions.len(),
            "parallel_groups":occupied.len(),
            "blocked":missions.iter().filter(|mission| !mission.blocking_gaps.is_empty()).count()
        },
        "partial":partial,
        "agent_handoff":{
            "schema_version":"cgrx.agent.change-missions.v1",
            "algorithm":"change_missions_v1",
            "llm_used":false,
            "snapshot":snapshot,
            "base_revision":base_revision,
            "missions":handoff_missions,
            "execution_order":execution_order,
            "requirements":[
                "Revalidate the snapshot before editing.",
                "Inspect every referenced finding and impact in the parent scan_risks result.",
                "Treat related tests as candidates until the repository test runner confirms them.",
                "Resolve or inspect blocking coverage gaps before relying on absence."
            ]
        }
    })
}

fn steps(mission: &Mission) -> Vec<Value> {
    match mission.kind {
        "changed_dependency" => {
            let mut result = vec![
                json!({"action":"inspect_changed_target","paths":mission.change_paths}),
                json!({"action":"review_proven_callers","paths":mission.review_paths,"impact_indexes":mission.impact_indexes}),
            ];
            if mission.related_test_indexes.is_empty() {
                result.push(json!({"action":"identify_repository_tests","status":"required"}));
            } else {
                result.push(json!({"action":"run_candidate_tests","test_indexes":mission.related_test_indexes,"status":"not_run"}));
            }
            if !mission.blocking_gaps.is_empty() {
                result.push(json!({"action":"inspect_coverage_gaps","gaps":mission.blocking_gaps}));
            }
            result
        }
        "retained_call_candidate" => vec![
            json!({"action":"inspect_retained_call","finding_indexes":mission.finding_indexes}),
            json!({"action":"verify_current_resolution","paths":mission.review_paths}),
            json!({"action":"run_repository_checks","status":"not_run"}),
        ],
        _ => vec![
            json!({"action":"review_changed_path","paths":mission.change_paths}),
            json!({"action":"trace_affected_symbols","status":"required"}),
            json!({"action":"run_repository_checks","status":"not_run"}),
        ],
    }
}
