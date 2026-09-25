use super::*;

#[test]
fn openai_tool_contract() {
    let tools = model_visible_schema();
    assert!(
        tools.as_array().unwrap().len() >= 19,
        "expected at least 19 tools, got {}",
        tools.as_array().unwrap().len()
    );
    for tool in tools.as_array().unwrap() {
        assert!(tool["title"].as_str().is_some_and(|s| !s.is_empty()));
        assert!(tool["description"].as_str().is_some_and(|s| s.len() > 20));
        assert_eq!(tool["annotations"]["readOnlyHint"], false);
        assert_eq!(tool["annotations"]["destructiveHint"], false);
        assert_eq!(tool["annotations"]["openWorldHint"], false);
        assert_eq!(tool["outputSchema"]["type"], "object");
    }
    let scope = bounded_scope_schema();
    for name in scope["required"].as_array().unwrap() {
        assert!(scope["properties"][name.as_str().unwrap()]["type"].is_string());
    }
    let search = tools
        .as_array()
        .unwrap()
        .iter()
        .find(|tool| tool["name"] == "search_graph")
        .unwrap();
    assert_eq!(
        search["inputSchema"]["properties"]["include_body"]["type"],
        "boolean"
    );
    assert_eq!(
        search["inputSchema"]["properties"]["language"]["enum"],
        json!([
            "typescript",
            "go",
            "java",
            "python",
            "rust",
            "c",
            "cpp",
            "csharp",
            "ruby",
            "php",
            "swift",
            "scala",
            "elixir",
            "kotlin"
        ])
    );
    for name in ["trace_path", "find_usages"] {
        let tool = tools
            .as_array()
            .unwrap()
            .iter()
            .find(|tool| tool["name"] == name)
            .unwrap();
        assert_eq!(
            tool["inputSchema"]["properties"]["evidence"]["enum"],
            json!(["static", "observed", "all"])
        );
        assert_eq!(
            tool["inputSchema"]["properties"]["evidence"]["default"],
            "static"
        );
    }
    assert_eq!(
        path_or_scope_schema(&scope)["anyOf"]
            .as_array()
            .unwrap()
            .len(),
        3
    );
    let status = tools
        .as_array()
        .unwrap()
        .iter()
        .find(|tool| tool["name"] == "status")
        .unwrap();
    for (name, title) in [
        ("detect_dead_code", "Detect dead code"),
        ("check_index_coverage", "Check coverage"),
        ("check_framework_gates", "Check framework gates"),
        ("expand", "Expand context"),
        ("status", "Check index status"),
        ("memory_record", "Record decision"),
        ("memory_recall", "Recall decisions"),
        ("check_security_gates", "Check security gates"),
    ] {
        let tool = tools
            .as_array()
            .unwrap()
            .iter()
            .find(|tool| tool["name"] == name)
            .unwrap();
        assert_eq!(tool["title"], title);
    }
    assert!(status["inputSchema"].get("required").is_none());
    assert_eq!(
        status["inputSchema"]["properties"]["paths_or_scope"]["anyOf"]
            .as_array()
            .unwrap()
            .len(),
        3
    );
    let coverage = tools
        .as_array()
        .unwrap()
        .iter()
        .find(|tool| tool["name"] == "check_index_coverage")
        .unwrap();
    assert!(
        coverage["inputSchema"]["properties"]
            .get("paths_or_scope")
            .is_none()
    );
    assert_eq!(
        serde_json::from_value::<StatusArguments>(json!({}))
            .unwrap()
            .paths_or_scope,
        json!(["**/*"])
    );
    let scan = tools
        .as_array()
        .unwrap()
        .iter()
        .find(|tool| tool["name"] == "scan_risks")
        .unwrap();
    assert_eq!(scan["inputSchema"]["additionalProperties"], false);
}

#[test]
fn compact_orient_preserves_semantic_rerank_audit_metadata() {
    let compact = compact_orient(&json!({
        "snapshot":{"repo_revision":"abc","working_tree_digest":"00","graph_generation":1},
        "compiled":{
            "status":"PARTIAL",
            "packed":{"records":[]},
            "obligations":{"uncertainties":[]},
            "residual":[]
        },
        "semantic_rerank":{
            "backend":"local_unix_socket",
            "status":"applied",
            "candidates_scored":8
        }
    }));
    assert_eq!(compact["semantic_rerank"]["status"], "applied");
    assert_eq!(compact["semantic_rerank"]["candidates_scored"], 8);

    let without_sidecar = compact_orient(&json!({
        "snapshot":{},
        "compiled":{
            "status":"PARTIAL",
            "packed":{"records":[]},
            "obligations":{"uncertainties":[]},
            "residual":[]
        }
    }));
    assert!(without_sidecar["semantic_rerank"].is_null());
}

#[test]
fn change_gate_never_turns_partial_evidence_into_a_pass() {
    let scan = json!({
        "snapshot":{"repo_revision":"abc","working_tree_digest":"00","graph_generation":1},
        "base_revision":"abc",
        "findings":[],
        "impacts":[],
        "partial":true,
        "coverage_gap_count":0,
        "coverage_gaps":[],
        "change_plan":{"totals":{"blocked":0,"missions":0,"parallel_groups":0},"execution_order":[],"agent_handoff":{}}
    });
    let gate = evaluate_change_gates(&scan, "error", [0, 0, 0, 0]);
    assert_eq!(gate["verdict"], "INCONCLUSIVE");
    assert_eq!(gate["would_block"], true);
    assert_eq!(gate["llm_used"], false);
}

#[test]
fn change_gate_separates_warning_policy_from_proven_failures() {
    let warning = json!({
        "snapshot":{},"findings":[],"impacts":[{}],"partial":false,
        "coverage_gap_count":0,"coverage_gaps":[],
        "change_plan":{"totals":{"blocked":0},"execution_order":[],"agent_handoff":{}}
    });
    let report = evaluate_change_gates(&warning, "error", [0, 0, 0, 0]);
    assert_eq!(report["verdict"], "WARN");
    assert_eq!(report["would_block"], false);
    let strict = evaluate_change_gates(&warning, "warning", [0, 0, 0, 0]);
    assert_eq!(strict["would_block"], true);

    let failure = json!({
        "snapshot":{},"findings":[{}],"impacts":[],"partial":false,
        "coverage_gap_count":0,"coverage_gaps":[],
        "change_plan":{"totals":{"blocked":0},"execution_order":[],"agent_handoff":{}}
    });
    let failed = evaluate_change_gates(&failure, "error", [0, 0, 0, 0]);
    assert_eq!(failed["verdict"], "FAIL");
    assert_eq!(failed["would_block"], true);
    assert_eq!(failed["agent_handoff"]["finding_indexes"], json!([0]));
}

#[test]
fn repository_gate_separates_architecture_failures_warnings_and_uncertainty() {
    let architecture = json!({
        "snapshot":{"repo_revision":"abc","working_tree_digest":"00","graph_generation":1},
        "packages":[{"fan_out":3}],"hotspots":[{"fan_in":8}],
        "cycles":[{"packages":["a","b"]}],"totals":{"cycles":1},
        "import_resolution":{"unresolved_local":0},
        "reference_resolution":{"unresolved_local":0},
        "coverage_gap_count":0,"coverage_gaps":[],"partial":false,
        "architecture_plan":{"algorithm":"architecture_futures_v1"}
    });
    let failed = evaluate_repository_gates(&architecture, "error", [0, 20, 50, 0, 0]);
    assert_eq!(failed["verdict"], "FAIL");
    assert_eq!(failed["would_block"], true);
    assert_eq!(failed["agent_handoff"]["cycle_indexes"], json!([0]));

    let warning = evaluate_repository_gates(&architecture, "error", [1, 2, 50, 0, 0]);
    assert_eq!(warning["verdict"], "WARN");
    assert_eq!(warning["would_block"], false);
    assert_eq!(
        evaluate_repository_gates(&architecture, "warning", [1, 2, 50, 0, 0])["would_block"],
        true
    );

    let mut partial = architecture;
    partial["partial"] = true.into();
    let inconclusive = evaluate_repository_gates(&partial, "error", [1, 3, 8, 0, 0]);
    assert_eq!(inconclusive["verdict"], "INCONCLUSIVE");
    assert_eq!(inconclusive["would_block"], true);
}

#[test]
fn compact_risks_keeps_exact_agent_handoff_without_duplicate_proofs() {
    let handoff = json!({
        "schema_version":"cgrx.agent.change-missions.v1",
        "llm_used":false,
        "missions":[{"mission_id":"change-mission.abc","impact_indexes":[0]}]
    });
    let structured = json!({
        "snapshot":{"repo_revision":"abc123","working_tree_digest":"00","graph_generation":9},
        "base_revision":"abc123",
        "findings":[],
        "impacts":[{
            "caller":{"path":"caller.rs","symbol":"caller"},
            "changed_target":{"path":"target.rs","symbol":"target"},
            "line":3,
            "current_edge":{"large_proof":"x".repeat(2048)}
        }],
        "verification_plan":{
            "related_tests":[{"path":"tests.rs","symbol":"test_target","line":8,
                "impact_index":0,"reach":{"call_depth":2},"execution_status":"not_run",
                "call_chain":[{"large_proof":"x".repeat(2048)}]}],
            "test_discovery":"candidates_found","complete_test_suite":false,
            "execution_status":"not_run","truncated":false
        },
        "change_plan":{
            "algorithm":"change_missions_v1","llm_used":false,
            "totals":{"missions":1,"parallel_groups":1,"blocked":0},
            "execution_order":[["change-mission.abc"]],"agent_handoff":handoff
        },
        "partial":false,"coverage_gap_count":0,"coverage_gaps_truncated":false
    });
    let compact = compact_risks(&structured);
    assert_eq!(compact["change_plan"]["agent_handoff"], handoff);
    assert_eq!(compact["change_plan"]["llm_used"], false);
    assert_eq!(compact["verification_plan"]["tests"][0][1], "test_target");
    assert!(
        serde_json::to_vec(&compact).unwrap().len()
            < serde_json::to_vec(&structured).unwrap().len() / 2
    );
}

#[test]
fn compact_trace_adds_runtime_columns_only_for_evidence_aware_results() {
    let base = json!({
        "snapshot":{"repo_revision":"abc123","working_tree_digest":"00","graph_generation":9},
        "root":{"symbol":"target","path":"main.rs","span":{"start":0,"end":10}},
        "nodes":[{"symbol":"caller","path":"main.rs","hop":1,"direction":"callers","evidence":"observed","count":7}],
        "total":1,"truncated":false,"coverage_gap_count":0
    });
    let static_result = compact_trace(&base);
    assert_eq!(
        static_result["cols"],
        json!(["symbol", "path_id", "hop", "direction"])
    );
    let mut observed = base;
    observed["evidence"] = json!("observed");
    let observed_result = compact_trace(&observed);
    assert_eq!(
        observed_result["cols"],
        json!(["symbol", "path_id", "hop", "direction", "evidence", "count"])
    );
    assert_eq!(observed_result["rows"][0][4], "observed");
    assert_eq!(observed_result["rows"][0][5], 7);
}

#[test]
fn compact_refactors_reports_exact_payload_tokens() {
    let structured = json!({
        "snapshot":{"repo_revision":"abc123","working_tree_digest":"00","graph_generation":9},
        "status":"hypothetical",
        "total":1,
        "truncated":false,
        "coverage_gap_count":0,
        "candidates":[{
            "language":"rust",
            "left":{"symbol":"left","path":"src/lib.rs"},
            "right":{"symbol":"right","path":"src/lib.rs"},
            "similarity":{"total":900},
            "shared_callees":[{"target":{"symbol":"save"}}],
            "projection":{"id":"refactor1.abc","status":"hypothetical"},
            "strategies":[{
                "strategy_id":"strategy1.best",
                "policy":"consolidate",
                "recommended":true,
                "counterfactual":{"score":812,"reasons":["structural_duplication_reduction"]}
            }]
        }]
    });

    let compact = compact_refactors(&structured);
    assert_eq!(
        compact["cols"],
        json!([
            "left",
            "right",
            "language",
            "score",
            "shared_callees",
            "projection_id",
            "recommended_policy",
            "counterfactual_score",
            "reason_codes",
            "strategy_id"
        ])
    );
    assert_eq!(compact["status"], "hypothetical");
    assert_eq!(compact["rows"][0][6], "consolidate");
    assert_eq!(compact["rows"][0][7], 812);
    assert_eq!(compact["rows"][0][9], "strategy1.best");
    let mut counted = compact.clone();
    counted.as_object_mut().unwrap().remove("payload_tokens");
    let expected = Tokenizer::o200k_base()
        .unwrap()
        .count(&serde_json::to_string(&counted).unwrap());
    assert_eq!(compact["payload_tokens"], expected);
}

#[test]
fn compact_architecture_keeps_agent_payload_bounded_without_losing_evidence_pointer() {
    let symbol_communities = (0..13)
        .map(|index| {
            json!({
                "label": format!("save_{index}"),
                "members": 3,
                "packages": ["api", "core"],
                "edge_types": ["CALLS"],
                "internal_weight": 8,
                "cut_weight": 0,
                "cohesion": 1.0,
                "top_nodes": [{
                    "node_id": index + 7,
                    "symbol": format!("save_{index}"),
                    "path": format!("core/store_{index}.ts"),
                    "weighted_degree": 8
                }]
            })
        })
        .collect::<Vec<_>>();
    let structured = json!({
        "snapshot":{"repo_revision":"abc123","working_tree_digest":"00","graph_generation":9},
        "page":{"offset":0,"limit":50,"next_offset":50,"has_more":true},
        "relation_kinds":["CALLS","IMPLEMENTS","IMPORTS","REFERENCES"],
        "packages":[{"name":"api","files":2,"symbols":4,"fan_in":1,"fan_out":2}],
        "boundaries":[{
            "source":"api","target":"core","edges":2,"relations":["CALLS"],
            "confidence":"PROVEN","evidence":[{
                "path":"api/handler.ts","span":{"start":10,"end":20},
                "proof":"x".repeat(20_000)
            }]
        }],
        "hotspots":[{"symbol":"save","path":"core/store.ts","fan_in":8}],
        "cycles":[{"packages":["api","core"],"kind":"PACKAGE_CALL_CYCLE"}],
        "communities":[{"packages":["api","core"],"method":"DETERMINISTIC_WEIGHTED_MODULARITY","internal_weight":8,"cut_weight":1,"cohesion":0.8888888888888888}],
        "community_detection":{"method":"DETERMINISTIC_WEIGHTED_MODULARITY","relation_weights":{"CALLS":4,"IMPLEMENTS":4,"IMPORTS":2,"REFERENCES":1},"modularity":0.25,"iterations":2},
        "symbol_communities":symbol_communities,
        "symbol_community_detection":{"method":"DETERMINISTIC_WEIGHTED_MODULARITY","relation_weights":{"CALLS":4,"IMPLEMENTS":4},"modularity":0.25,"iterations":2,"unclustered_symbols":1},
        "architecture_plan":{"algorithm":"architecture_futures_v1","llm_used":false,"totals":{"issues":1,"future_graphs":3},"issues":[{
            "issue_id":"architecture-issue1.abc","kind":"PACKAGE_DEPENDENCY_CYCLE","packages":["api","core"],
            "selected_boundary":{"source":"api","target":"core","edges":2,"relations":["CALLS"]},
            "strategies":[{"strategy_id":"architecture-strategy1.best","policy":"invert_dependency","recommended":true,"counterfactual":{"score":820,"reasons":["package_cycle_detected"]},"predicted_graph":{"cycles_removed":1}}],
            "agent_handoff":{"schema_version":"cgrx.agent.architecture-future.v1","strategy_id":"architecture-strategy1.best","llm_used":false}
        }]},
        "totals":{"packages":2,"boundaries":1,"hotspots":1,"cycles":1,"communities":1,"symbol_communities":13},
        "import_resolution":{"proven":1,"external":2,"out_of_scope":0,"unresolved_local":0},
        "reference_resolution":{"proven":2,"external":1,"out_of_scope":0,"unresolved_local":0},
        "coverage_gap_count":0,"partial":false,"truncated":false
    });

    let compact = compact_architecture(&structured);
    assert_eq!(
        compact["boundary_cols"],
        json!([
            "source",
            "target",
            "edges",
            "relations",
            "confidence",
            "path",
            "start",
            "end"
        ])
    );
    assert_eq!(compact["boundaries"][0][5], "api/handler.ts");
    assert_eq!(compact["page"]["next_offset"], 50);
    assert_eq!(compact["page"]["has_more"], true);
    assert_eq!(compact["import_resolution"]["proven"], 1);
    assert_eq!(compact["reference_resolution"]["proven"], 2);
    assert_eq!(compact["communities"][0][1], 8);
    assert_eq!(
        compact["community_detection"]["method"],
        "DETERMINISTIC_WEIGHTED_MODULARITY"
    );
    assert_eq!(compact["symbol_communities"].as_array().unwrap().len(), 12);
    assert_eq!(compact["symbol_communities"][0][0], "save_0");
    assert_eq!(compact["symbol_communities"][0][5], "core/store_0.ts");
    assert_eq!(compact["symbol_communities"][0][6][0], "save_0");
    assert_eq!(compact["totals"]["symbol_communities"], 13);
    assert_eq!(compact["architecture_planner"]["llm_used"], false);
    assert_eq!(
        compact["architecture_futures"][0]["policy"],
        "invert_dependency"
    );
    assert_eq!(compact["architecture_futures"][0]["score"], 820);
    assert_eq!(
        compact["architecture_futures"][0]["agent_handoff"]["llm_used"],
        false
    );
    assert_eq!(
        compact["symbol_community_detection"]["unclustered_symbols"],
        1
    );
    let mut counted = compact.clone();
    counted.as_object_mut().unwrap().remove("payload_tokens");
    let expected_tokens = Tokenizer::o200k_base()
        .unwrap()
        .count(&serde_json::to_string(&counted).unwrap());
    assert_eq!(compact["payload_tokens"], expected_tokens);
    let encoded = serde_json::to_string(&compact).unwrap();
    assert!(!encoded.contains(&"x".repeat(20_000)));
    assert!(
        encoded.len() < 4_000,
        "compact payload bytes: {}",
        encoded.len()
    );
}

fn memory_snapshot(revision: &str) -> RepoSnapshot {
    RepoSnapshot {
        repo_revision: revision.to_owned(),
        working_tree_digest: Hash32([7; 32]),
        graph_generation: 3,
    }
}

fn memory_server(revision: &str) -> (Server, PathBuf) {
    static SEQ: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
    let seq = SEQ.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    let dir = std::env::temp_dir().join(format!(
        "cgrx-mcp-memory-{}-{}-{seq}",
        std::process::id(),
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock after epoch")
            .as_nanos()
    ));
    let mut server = Server::new(memory_snapshot(revision));
    server.set_memory_store(MemoryStore::open(&dir).expect("open memory store"));
    (server, dir)
}

fn record_arguments(fact: &str, confidence: u16) -> Value {
    json!({
        "fact": fact,
        "confidence": confidence,
        "repo": "/repo",
        "path": "src/lib.rs",
        "span": {"start_line": 1, "end_line": 5},
    })
}

#[test]
fn memory_record_pins_revision_and_recalls_deterministically() {
    let (mut server, dir) = memory_server("rev-memory-1");
    let recorded = server
        .memory_record(from_value(record_arguments("cache the router", 900)).unwrap())
        .unwrap();
    assert_eq!(recorded["duplicate"], false);
    assert_eq!(recorded["llm_used"], false);
    assert_eq!(recorded["snapshot"]["repo_revision"], "rev-memory-1");
    assert_eq!(recorded["record"]["fact"], "cache the router");
    assert_eq!(recorded["record"]["privacy_tag"], "default");

    let replayed = server
        .memory_record(from_value(record_arguments("cache the router", 900)).unwrap())
        .unwrap();
    assert_eq!(replayed["duplicate"], true);
    assert_eq!(replayed["record"]["id"], recorded["record"]["id"]);

    server
        .memory_record(from_value(record_arguments("drop the cache", 100)).unwrap())
        .unwrap();
    let recalled = server
        .memory_recall(from_value(json!({"limit": 10})).unwrap())
        .unwrap();
    assert_eq!(recalled["llm_used"], false);
    assert_eq!(recalled["truncated"], false);
    let facts: Vec<_> = recalled["results"]
        .as_array()
        .unwrap()
        .iter()
        .map(|item| item["fact"].as_str().unwrap().to_owned())
        .collect();
    assert_eq!(facts, vec!["cache the router", "drop the cache"]);

    let filtered = server
        .memory_recall(from_value(json!({"query": "CACHE", "min_confidence": 500})).unwrap())
        .unwrap();
    assert_eq!(filtered["results"].as_array().unwrap().len(), 1);

    let compact = model_visible_result("memory_recall", &recalled);
    assert_eq!(compact["llm_used"], false);
    assert_eq!(compact["cols"], json!(["id", "confidence", "fact"]));
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn memory_record_rejects_foreign_revision_and_bad_bounds() {
    let (mut server, dir) = memory_server("rev-memory-2");
    let mut foreign: Value = record_arguments("foreign fact", 500);
    foreign["rev"] = json!("rev-other");
    assert!(server.memory_record(from_value(foreign).unwrap()).is_err());
    assert!(
        server
            .memory_recall(from_value(json!({"limit": 0})).unwrap())
            .is_err()
    );
    assert!(
        server
            .memory_recall(from_value(json!({"min_confidence": 1001})).unwrap())
            .is_err()
    );
    assert!(
        server
            .memory_record(from_value(record_arguments("", 100)).unwrap())
            .is_err()
    );
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn memory_tools_require_an_attached_store() {
    let mut server = Server::new(memory_snapshot("rev-memory-3"));
    assert!(
        server
            .memory_record(from_value(record_arguments("fact", 10)).unwrap())
            .is_err()
    );
    assert!(
        server
            .memory_recall(from_value(json!({})).unwrap())
            .is_err()
    );
}

// ---- Quality-gate verdict + would_block coverage (private functions) ----

#[test]
fn change_gate_verdict_pass_with_clean_full_evidence() {
    // No error-severity rule breached and partial=false => PASS.
    let scan = json!({"partial": false});
    let gate = evaluate_change_gates(&scan, "error", [0, 0, 0, 0]);
    assert_eq!(gate["verdict"], "PASS");
    assert_eq!(gate["would_block"], false);
    assert_eq!(gate["totals"]["errors"], 0);
    assert_eq!(gate["totals"]["warnings"], 0);
    assert_eq!(gate["partial"], false);
}

#[test]
fn change_gate_verdict_warn_only_warning_severity_breached() {
    // Only the warning-severity rule (max_unverified_impacts) breaches: WARN, no errors.
    let scan = json!({"partial": false, "impacts": [{}]});
    let gate = evaluate_change_gates(&scan, "error", [0, 0, 0, 0]);
    assert_eq!(gate["verdict"], "WARN");
    // Under the default "error" policy a warning alone does not block.
    assert_eq!(gate["would_block"], false);
    let strict = evaluate_change_gates(&scan, "warning", [0, 0, 0, 0]);
    assert_eq!(strict["verdict"], "WARN");
    assert_eq!(strict["would_block"], true);
}

#[test]
fn change_gate_verdict_fail_on_error_severity_breach() {
    // findings>0 breaches the error-severity rule => FAIL regardless of partial.
    let scan = json!({"partial": false, "findings": [{}]});
    let gate = evaluate_change_gates(&scan, "error", [0, 0, 0, 0]);
    assert_eq!(gate["verdict"], "FAIL");
    assert_eq!(gate["would_block"], true);
    assert_eq!(gate["totals"]["errors"], 1);

    // coverage_gap_count is also error-severity.
    let gaps = json!({"partial": false, "coverage_gap_count": 2});
    assert_eq!(
        evaluate_change_gates(&gaps, "error", [0, 0, 0, 0])["verdict"],
        "FAIL"
    );
    // blocked missions is also error-severity.
    let blocked = json!({"partial": false, "change_plan": {"totals": {"blocked": 3}}});
    assert_eq!(
        evaluate_change_gates(&blocked, "error", [0, 0, 0, 0])["verdict"],
        "FAIL"
    );
}

#[test]
fn change_gate_verdict_inconclusive_when_partial_and_no_errors() {
    // partial=true with no error-severity breach => INCONCLUSIVE (blocking under error policy).
    let scan = json!({"partial": true});
    let gate = evaluate_change_gates(&scan, "error", [0, 0, 0, 0]);
    assert_eq!(gate["verdict"], "INCONCLUSIVE");
    assert_eq!(gate["would_block"], true);
    assert_eq!(gate["partial"], true);
}

#[test]
fn change_gate_would_block_follows_fail_on() {
    // fail_on="none" never blocks, even when the verdict is FAIL.
    let failing = json!({"partial": false, "findings": [{}]});
    let none = evaluate_change_gates(&failing, "none", [0, 0, 0, 0]);
    assert_eq!(none["verdict"], "FAIL");
    assert_eq!(none["would_block"], false);

    // Under the "error" policy a warning-only scan does not block...
    let warn_only = json!({"partial": false, "impacts": [{}]});
    let error_policy = evaluate_change_gates(&warn_only, "error", [0, 0, 0, 0]);
    assert_eq!(error_policy["would_block"], false);
    // ...but partial alone (no errors) still blocks under the default "error" policy.
    let partial_only = json!({"partial": true});
    let partial_gate = evaluate_change_gates(&partial_only, "error", [0, 0, 0, 0]);
    assert_eq!(partial_gate["verdict"], "INCONCLUSIVE");
    assert_eq!(partial_gate["would_block"], true);
    // Under the "warning" policy, a warning alone does block.
    let warning_policy = evaluate_change_gates(&warn_only, "warning", [0, 0, 0, 0]);
    assert_eq!(warning_policy["would_block"], true);
}

#[test]
fn repository_gate_verdict_pass_with_clean_full_evidence() {
    let architecture = json!({"partial": false});
    let gate = evaluate_repository_gates(&architecture, "error", [0, 0, 0, 0, 0]);
    assert_eq!(gate["verdict"], "PASS");
    assert_eq!(gate["would_block"], false);
    assert_eq!(gate["totals"]["errors"], 0);
    assert_eq!(gate["totals"]["warnings"], 0);
}

#[test]
fn repository_gate_verdict_warn_only_warning_severity_breached() {
    // Only a warning-severity rule (max_package_fan_out) breaches => WARN.
    let architecture = json!({"partial": false, "packages": [{"fan_out": 1}]});
    let gate = evaluate_repository_gates(&architecture, "error", [0, 0, 0, 0, 0]);
    assert_eq!(gate["verdict"], "WARN");
    assert_eq!(gate["would_block"], false);
    let strict = evaluate_repository_gates(&architecture, "warning", [0, 0, 0, 0, 0]);
    assert_eq!(strict["verdict"], "WARN");
    assert_eq!(strict["would_block"], true);
}

#[test]
fn repository_gate_verdict_fail_on_error_severity_breach() {
    // cycles>0 breaches the error-severity rule => FAIL.
    let architecture = json!({"partial": false, "totals": {"cycles": 1}});
    let gate = evaluate_repository_gates(&architecture, "error", [0, 0, 0, 0, 0]);
    assert_eq!(gate["verdict"], "FAIL");
    assert_eq!(gate["would_block"], true);

    // coverage_gap_count is error-severity and drives FAIL, not INCONCLUSIVE.
    let gaps = json!({"partial": false, "coverage_gap_count": 5});
    assert_eq!(
        evaluate_repository_gates(&gaps, "error", [0, 0, 0, 0, 0])["verdict"],
        "FAIL"
    );
    // unresolved local dependencies is also error-severity.
    let unresolved = json!({
        "partial": false,
        "import_resolution": {"unresolved_local": 4},
        "reference_resolution": {"unresolved_local": 1}
    });
    assert_eq!(
        evaluate_repository_gates(&unresolved, "error", [0, 0, 0, 0, 0])["verdict"],
        "FAIL"
    );
}

#[test]
fn repository_gate_verdict_inconclusive_when_partial_and_no_errors() {
    let architecture = json!({"partial": true});
    let gate = evaluate_repository_gates(&architecture, "error", [0, 0, 0, 0, 0]);
    assert_eq!(gate["verdict"], "INCONCLUSIVE");
    assert_eq!(gate["would_block"], true);
    assert_eq!(gate["partial"], true);
}

#[test]
fn repository_gate_partial_and_coverage_gap_keep_inconclusive_under_threshold() {
    // partial=true with a coverage gap UNDER the threshold keeps INCONCLUSIVE:
    // the gap only flips to FAIL once it exceeds the max_coverage_gaps threshold.
    let architecture = json!({"partial": true, "coverage_gap_count": 1});
    let gate = evaluate_repository_gates(&architecture, "error", [0, 0, 0, 0, 10]);
    assert_eq!(gate["verdict"], "INCONCLUSIVE");
    assert_eq!(gate["would_block"], true);

    // fail_on="none" never blocks even when the verdict is FAIL.
    let failing = json!({"partial": false, "totals": {"cycles": 1}});
    let none = evaluate_repository_gates(&failing, "none", [0, 0, 0, 0, 0]);
    assert_eq!(none["verdict"], "FAIL");
    assert_eq!(none["would_block"], false);

    // A warning-only scan does not block under the default "error" policy.
    let warn_only = json!({"partial": false, "packages": [{"fan_out": 1}]});
    let error_policy = evaluate_repository_gates(&warn_only, "error", [0, 0, 0, 0, 0]);
    assert_eq!(error_policy["would_block"], false);
}
