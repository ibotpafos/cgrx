use super::*;

#[test]
fn graph_tools_advertise_dependency_and_containment_scopes() {
    let tools = model_visible_schema();
    for (name, kinds) in [
        (
            "find_usages",
            json!(["CALLS", "IMPLEMENTS", "IMPORTS", "REFERENCES"]),
        ),
        ("trace_path", json!(["CALLS", "IMPLEMENTS", "CONTAINS"])),
    ] {
        let tool = tools
            .as_array()
            .unwrap()
            .iter()
            .find(|t| t["name"] == name)
            .unwrap();
        assert_eq!(
            tool["inputSchema"]["properties"]["scope"]["anyOf"][2]["properties"]["relation_kinds"]
                ["items"]["enum"],
            kinds
        );
    }
}

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
        assert_eq!(
            tool["annotations"]["destructiveHint"],
            matches!(
                tool["name"].as_str(),
                Some("memory_forget" | "prepare_candidate_patch")
            )
        );
        assert_eq!(
            tool["annotations"]["openWorldHint"],
            tool["name"] == "prepare_candidate_patch"
        );
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
            "javascript",
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
        ("memory_record", "Record agent memory"),
        ("memory_recall", "Recall agent memory"),
        ("memory_update", "Update agent memory"),
        ("memory_forget", "Forget agent memory"),
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
        "partial":false,"coverage_gap_count":0,"coverage_gaps_truncated":false,
        "unindexed_changed_path_count":2,
        "unindexed_changed_paths":["dsp.cpp","view.swift"]
    });
    let compact = compact_risks(&structured);
    assert_eq!(compact["change_plan"]["agent_handoff"], handoff);
    assert_eq!(compact["change_plan"]["llm_used"], false);
    assert_eq!(compact["verification_plan"]["tests"][0][1], "test_target");
    assert_eq!(compact["unindexed_changed_path_count"], 2);
    assert_eq!(
        compact["unindexed_changed_paths"],
        json!(["dsp.cpp", "view.swift"])
    );
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
fn compact_discovery_and_traces_preserve_addressable_symbol_references() {
    let reference = "cgrxs1.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    let caller_ref = "cgrxs1.1123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    let node = json!({"symbol":"Run","path":"main.go","span":{"start":100,"end":103},"symbol_ref":reference,"callers":1,"callees":1,"hop":1,"direction":"callees"});
    let search = compact_search(&json!({"matches":[node.clone()],"total":1}));
    assert_eq!(search["cols"][6], "symbol_ref");
    assert_eq!(search["rows"][0][6], reference);
    let outline = compact_outline(&json!({"symbols":[node.clone()],"total":1}));
    assert_eq!(outline["cols"][3], "symbol_ref");
    assert_eq!(outline["rows"][0][3], reference);
    let mut structured = json!({"root":node,"nodes":[node.clone()],"total":1});
    for evidence in [false, true] {
        if evidence {
            structured["evidence"] = json!("observed");
        }
        let trace = compact_trace(&structured);
        assert_eq!(trace["root"]["symbol_ref"], reference);
        let last = trace["cols"].as_array().unwrap().len() - 1;
        assert_eq!(trace["cols"][last], "symbol_ref");
        assert_eq!(trace["rows"][0][last], reference);
        let mut usages = json!({"target":node,"usages":[{"source":{"symbol":"Caller","symbol_ref":caller_ref},"via":node,"site":{"path":"main.go","span":{"start":200,"end":210}},"hop":1,"relation":"CALLS","resolver":"SYNTAX_EXACT"}]});
        if evidence {
            usages["evidence"] = json!("observed");
        }
        let usages = compact_usages(&usages);
        assert_eq!(usages["target"]["symbol_ref"], reference);
        let refs = usages["cols"].as_array().unwrap().len() - 2;
        assert_eq!(usages["cols"][refs], "source_ref");
        assert_eq!(usages["cols"][refs + 1], "via_ref");
        assert_eq!(usages["rows"][0][refs], caller_ref);
        assert_eq!(usages["rows"][0][refs + 1], reference);
        assert_eq!(usages["rows"][0][5], 200);
    }
    let snippet = compact_snippet(
        &json!({"symbol":"Run","symbol_ref":reference,"source_hash":"ab12","source":"func (*A) Run() {}"}),
    );
    assert_eq!(snippet["symbol_ref"], reference);
    assert_eq!(snippet["source_hash"], "ab12");
}

#[test]
fn compact_search_keeps_the_complete_page_and_continuation_identity() {
    let rows = (0..50)
        .map(|index| {
            json!({
                "symbol":format!("item_{index:02}"),"path":"main.rs",
                "span":{"start":index,"end":index+1},"callers":0,"callees":0,
                "symbol_ref":format!("reference_{index}"),"matched_by":"symbol_tokens"
            })
        })
        .collect::<Vec<_>>();
    let snapshot_id = json!("a".repeat(64));
    let page =
        json!({"offset":0,"limit":50,"next_offset":50,"has_more":true,"snapshot_id":snapshot_id});
    let compact = compact_search(
        &json!({"query":"item","matches":rows,"total":53,"truncated":true,"page":page}),
    );
    assert_eq!(compact["rows"].as_array().unwrap().len(), 50);
    assert_eq!(compact["rows"][49][0], "item_49");
    assert_eq!(compact["rows"][49][6], "reference_49");
    assert_eq!(compact["rows"][49][7], "symbol_tokens");
    assert_eq!(compact["cols"][7], "matched_by");
    assert_eq!(compact["n"], 53);
    assert_eq!(compact["more"], true);
    assert_eq!(compact["page"], page);
    let final_page = json!({"offset":50,"limit":50,"next_offset":null,"has_more":false,"snapshot_id":snapshot_id});
    let empty =
        compact_search(&json!({"matches":[],"total":0,"truncated":false,"page":final_page}));
    assert_eq!(empty["rows"], json!([]));
    assert_eq!(empty["page"], final_page);
    assert!(empty.get("more").is_none());
}

#[test]
fn search_schema_and_argument_validation_agree_on_page_bounds() {
    let tools = model_visible_schema();
    let search = tools
        .as_array()
        .unwrap()
        .iter()
        .find(|tool| tool["name"] == "search_graph")
        .unwrap();
    assert_eq!(search["inputSchema"]["properties"]["offset"]["default"], 0);
    assert_eq!(
        search["inputSchema"]["properties"]["offset"]["maximum"],
        1_000_000
    );
    assert_eq!(
        search["inputSchema"]["properties"]["expected_snapshot"]["pattern"],
        "^[0-9a-f]{64}$"
    );
    let valid: SearchGraphArguments = from_value(json!({"query":"http request"})).unwrap();
    assert_eq!(valid.offset, 0);
    assert!(valid.expected_snapshot.is_none());
    let mut server = Server::new(RepoSnapshot {
        repo_revision: "test".into(),
        working_tree_digest: Hash32([0; 32]),
        graph_generation: 1,
    });
    for arguments in [
        json!({"query":" "}),
        json!({"query":"x","limit":0}),
        json!({"query":"x","limit":51}),
        json!({"query":"x","offset":1_000_001}),
        json!({"query":"x","offset":-1}),
        json!({"query":"x","expected_snapshot":"not-a-snapshot"}),
    ] {
        let response: Value = serde_json::from_str(&server.dispatch_line(&json!({
            "jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_graph","arguments":arguments}
        }).to_string())).unwrap();
        assert_eq!(response["error"]["code"], -32602, "{response}");
        assert_eq!(
            response["error"]["data"]["code"], "cgrx.invalid_arguments",
            "{response}"
        );
    }
}

#[test]
fn symbol_selection_schema_keeps_legacy_arguments_and_optional_references() {
    let tools = model_visible_schema();
    for name in ["get_code_snippet", "trace_path", "find_usages"] {
        let tool = tools
            .as_array()
            .unwrap()
            .iter()
            .find(|tool| tool["name"] == name)
            .unwrap();
        assert_eq!(tool["inputSchema"]["required"], json!(["symbol"]));
        assert_eq!(
            tool["inputSchema"]["properties"]["symbol_ref"]["type"],
            "string"
        );
        assert_eq!(tool["inputSchema"]["properties"]["path"]["type"], "string");
    }
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
            "strategy_id",
            "quality_checks"
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

#[test]
fn orient_accepts_minimal_partial_and_path_scopes_with_bounded_defaults() {
    let mut server = Server::new(memory_snapshot("chat-fixture"));
    for (scope, include) in [
        (None, json!(["**"])),
        (Some(json!("src/**")), json!(["src/**"])),
        (
            Some(json!(["src/**", "tests/**"])),
            json!(["src/**", "tests/**"]),
        ),
        (Some(json!({"include":["src/**"]})), json!(["src/**"])),
    ] {
        let mut arguments =
            json!({"task":"Inspect parser calls", "budget":1200,"budget_preset":"quick"});
        if let Some(scope) = scope {
            arguments["scope"] = scope;
        }
        let response: Value = serde_json::from_str(
            &server.dispatch_line(
                &json!({
                    "jsonrpc":"2.0","id":1,"method":"tools/call",
                    "params":{"name":"orient","arguments":arguments}
                })
                .to_string(),
            ),
        )
        .unwrap();
        assert!(response.get("error").is_none(), "{response}");
        let result = &response["result"]["structuredContent"];
        assert_eq!(result["budget"], 1200);
        assert_eq!(result["rcc"]["scope"]["include"], include);
        assert_eq!(result["rcc"]["scope"]["relation_kinds"], json!(["CALLS"]));
        assert_eq!(result["rcc"]["scope"]["max_depth"], 1);
    }
    for arguments in [
        json!({"task":" "}),
        json!({"task":"Inspect parser", "budget":0}),
    ] {
        let response: Value = serde_json::from_str(
            &server.dispatch_line(
                &json!({
                    "jsonrpc":"2.0","id":1,"method":"tools/call",
                    "params":{"name":"orient","arguments":arguments}
                })
                .to_string(),
            ),
        )
        .unwrap();
        assert_eq!(response["error"]["data"]["code"], "cgrx.invalid_arguments");
    }
}

#[test]
fn status_distinguishes_running_server_identity_from_repository_snapshot() {
    let mut server = Server::new(memory_snapshot("repo-revision"));
    let full = server
        .status(from_value(json!({"paths_or_scope":["src"]})).unwrap())
        .unwrap();
    assert_eq!(full["snapshot"]["repo_revision"], "repo-revision");
    assert_eq!(full["server"]["name"], "cgrx");
    assert_eq!(full["server"]["version"], env!("CARGO_PKG_VERSION"));
    assert_eq!(full["server"]["pid"], std::process::id());
    assert!(full["server"].get("build_id").is_some());
    let compact = model_visible_result("status", &full);
    assert_eq!(compact["server"], full["server"]);
    assert_eq!(compact["freshness"], full["freshness"]);
    assert_eq!(compact["at"], "repo-revisio@3");
    server.snapshot = memory_snapshot("another-revision");
    let next = server
        .status(from_value(json!({"paths_or_scope":["src"]})).unwrap())
        .unwrap();
    assert_eq!(next["server"], full["server"]);
    assert_ne!(next["snapshot"], full["snapshot"]);
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
    fs::create_dir_all(dir.join("src")).unwrap();
    fs::write(dir.join("src/lib.rs"), "one\ntwo\nthree\nfour\nfive\n").unwrap();
    server.set_memory_store(MemoryStore::open_lexical(&dir).expect("open memory store"));
    (server, dir)
}

fn record_arguments(fact: &str, confidence: u16) -> Value {
    json!({
        "fact": fact,
        "confidence": confidence,
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
    assert!(
        compact["cols"]
            .as_array()
            .unwrap()
            .contains(&json!("freshness"))
    );
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn compact_memory_metadata_preserves_update_context_and_history() {
    let (mut server, dir) = memory_server("rev-compact-metadata");
    let mut arguments = record_arguments("Keep parser context", 850);
    arguments["privacy_tag"] = json!("maintenance/команда");
    let recorded = server
        .memory_record(from_value(arguments).unwrap())
        .unwrap();
    let record = &recorded["record"];
    let acknowledgement = model_visible_result("memory_record", &recorded);
    for key in ["privacy_tag", "source_hash"] {
        assert_eq!(
            acknowledgement.get(key),
            record.get(key),
            "write metadata {key}"
        );
    }
    let recalled = server
        .memory_recall(from_value(json!({"id":record["id"], "budget":4000})).unwrap())
        .unwrap();
    let compact = model_visible_result("memory_recall", &recalled);
    let decode = |value: &Value, index: usize| {
        Value::Object(
            value["cols"]
                .as_array()
                .unwrap()
                .iter()
                .zip(value["rows"][index].as_array().unwrap())
                .map(|(key, item)| (key.as_str().unwrap().to_owned(), item.clone()))
                .collect(),
        )
    };
    let hit = decode(&compact, 0);
    for (key, expected) in record.as_object().unwrap() {
        assert_eq!(hit.get(key), Some(expected), "recall metadata {key}");
    }
    let replaced = server.memory_update(from_value(json!({
        "id":hit["id"], "expected_version":hit["version"], "reason":"Verified parser context",
        "record":{"fact":"Keep verified parser context", "confidence":hit["confidence"],
            "memory_kind":hit["memory_kind"], "source_kind":hit["source_kind"],
            "privacy_tag":hit["privacy_tag"], "path":hit["provenance"]["path"],
            "span":hit["provenance"]["span"]}
    })).unwrap()).unwrap();
    let acknowledgement = model_visible_result("memory_update", &replaced);
    assert_eq!(acknowledgement["version"], 2);
    assert_eq!(acknowledgement["privacy_tag"], record["privacy_tag"]);
    assert_eq!(acknowledgement["source_hash"], record["source_hash"]);
    let history = server.memory_recall(from_value(json!({
        "id":record["id"], "include_history":true, "privacy_tag":hit["privacy_tag"], "budget":4000
    })).unwrap()).unwrap();
    let compact = model_visible_result("memory_recall", &history);
    assert_eq!(compact["rows"].as_array().unwrap().len(), 2);
    for index in 0..2 {
        let hit = decode(&compact, index);
        assert_eq!(hit["privacy_tag"], record["privacy_tag"]);
        assert_eq!(hit["source_hash"], record["source_hash"]);
        assert_eq!(hit["version"], 2 - index);
    }
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn compact_memory_metadata_keeps_unverified_source_hash_explicitly_null() {
    let (mut server, dir) = memory_server("rev-compact-unverified");
    let recorded = server
        .memory_record(
            from_value(json!({
                "fact":"User prefers the local workflow", "confidence":850,
                "source_kind":"user", "source_ref":"explicit fixture preference",
                "privacy_tag":"team/preferences"
            }))
            .unwrap(),
        )
        .unwrap();
    let acknowledgement = model_visible_result("memory_record", &recorded);
    assert_eq!(acknowledgement.get("source_hash"), Some(&Value::Null));
    assert_eq!(acknowledgement["privacy_tag"], "team/preferences");
    let recalled = server.memory_recall(from_value(json!({
        "id":acknowledgement["id"], "privacy_tag":acknowledgement["privacy_tag"], "budget":4000
    })).unwrap()).unwrap();
    let compact = model_visible_result("memory_recall", &recalled);
    let cols = compact["cols"].as_array().unwrap();
    let row = compact["rows"][0].as_array().unwrap();
    for key in ["privacy_tag", "source_hash", "source_ref", "source_kind"] {
        let column = cols
            .iter()
            .position(|name| name == key)
            .expect("metadata column");
        assert_eq!(row[column], recorded["record"][key]);
    }
    assert_eq!(recalled["results"][0]["freshness"], "unverified");
    fs::remove_dir_all(dir).unwrap();
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

fn memory_rpc(server: &mut Server, name: &str, arguments: Value) -> Value {
    serde_json::from_str(
        &server.dispatch_line(
            &json!({
                "jsonrpc": "2.0", "id": 1, "method": "tools/call",
                "params": {"name": name, "arguments": arguments},
            })
            .to_string(),
        ),
    )
    .unwrap()
}

#[test]
fn memory_rpc_updates_history_forgets_and_checks_versions() {
    let (server, dir) = memory_server("rev-current");
    let mut server = server.with_response_profile(ResponseProfile::Full);
    let recorded = memory_rpc(
        &mut server,
        "memory_record",
        record_arguments("old choice", 700),
    );
    let id = recorded["result"]["structuredContent"]["record"]["id"]
        .as_str()
        .unwrap();
    let update = json!({"id":id, "expected_version":1, "reason":"new fixture result",
        "record": record_arguments("new choice", 900)});
    let replaced = memory_rpc(&mut server, "memory_update", update.clone());
    assert_eq!(
        replaced["result"]["structuredContent"]["record"]["version"], 2,
        "{replaced}"
    );
    let conflict = memory_rpc(&mut server, "memory_update", update);
    assert_eq!(conflict["error"]["data"]["code"], "cgrx.memory_conflict");
    let history = memory_rpc(
        &mut server,
        "memory_recall",
        json!({"id":id, "include_history":true}),
    );
    assert_eq!(
        history["result"]["structuredContent"]["results"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
    let forgotten = memory_rpc(
        &mut server,
        "memory_forget",
        json!({"id":id,"expected_version":2}),
    );
    assert_eq!(
        forgotten["result"]["structuredContent"]["removed_versions"],
        2
    );
    let recalled = memory_rpc(&mut server, "memory_recall", json!({"query":"choice"}));
    assert!(
        recalled["result"]["structuredContent"]["results"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    let _ = fs::remove_dir_all(dir);
}

#[test]
fn memory_profiles_advertise_only_callable_tools() {
    let (server, dir) = memory_server("rev-profiles");
    let mut server = server.with_toolset(Toolset::Standard);
    let listed: Value = serde_json::from_str(
        &server.dispatch_line(r#"{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}"#),
    )
    .unwrap();
    let names: Vec<_> = listed["result"]["tools"]
        .as_array()
        .unwrap()
        .iter()
        .map(|t| t["name"].as_str().unwrap())
        .collect();
    for name in [
        "memory_record",
        "memory_recall",
        "memory_update",
        "memory_forget",
    ] {
        assert!(names.contains(&name), "missing {name}");
        assert!(Toolset::Standard.allows(name));
    }
    server = server.with_toolset(Toolset::Minimal);
    let denied = memory_rpc(
        &mut server,
        "memory_record",
        record_arguments("denied", 500),
    );
    assert_eq!(denied["error"]["data"]["code"], "cgrx.tool_not_found");
    assert!(
        memory_rpc(&mut server, "memory_recall", json!({}))
            .get("result")
            .is_some()
    );
    let _ = fs::remove_dir_all(dir);
}

#[test]
fn memory_response_budget_and_usage_logs_keep_content_bounded_and_private() {
    let (server, dir) = memory_server("rev-budget");
    let mut server = server.with_response_profile(ResponseProfile::Full);
    let usage = dir.join("usage.jsonl");
    let metrics = dir.join("metrics.jsonl");
    server.enable_usage_log(&usage, "test", "memory-session");
    server.enable_metrics_log(&metrics);
    let fact = "private-memory-text ".repeat(150);
    let stored = memory_rpc(&mut server, "memory_record", record_arguments(&fact, 500));
    assert!(stored.get("result").is_some(), "{stored}");
    let response = memory_rpc(&mut server, "memory_recall", json!({"budget":256}));
    let recalled = &response["result"]["structuredContent"];
    assert_eq!(recalled["truncated"], true);
    assert_eq!(recalled["budget_omitted"], 1);
    let minimum = recalled["minimum_budget"].as_u64().unwrap();
    assert!(minimum > 256 && minimum <= 16000);
    assert_eq!(compact_memory_recall(recalled)["budget_omitted"], 1);
    let id = stored["result"]["structuredContent"]["record"]["id"].clone();
    let retry = memory_rpc(
        &mut server,
        "memory_recall",
        json!({"id":id,"budget":minimum}),
    );
    assert_eq!(
        retry["result"]["structuredContent"]["results"][0]["fact"],
        fact.trim()
    );
    let tokenizer = Tokenizer::o200k_base().unwrap();
    assert!(tokenizer.count(&recalled.to_string()) <= 256);
    assert!(tokenizer.count(&compact_memory_recall(recalled).to_string()) <= 256);
    let mut foreign = record_arguments("foreign", 500);
    foreign["repo"] = json!("/not-the-managed-repository");
    assert_eq!(
        memory_rpc(&mut server, "memory_record", foreign)["error"]["data"]["code"],
        "cgrx.invalid_repository"
    );
    memory_rpc(
        &mut server,
        "memory_recall",
        json!({"query":"private-query-marker"}),
    );
    for path in [usage, metrics] {
        let contents = fs::read_to_string(path).unwrap();
        assert!(contents.contains("memory_record"));
        assert!(contents.contains("memory_recall"));
        for private in [
            "private-memory-text",
            "private-query-marker",
            "src/main.rs",
            "/not-the-managed-repository",
        ] {
            assert!(
                !contents.contains(private),
                "memory content leaked into logs"
            );
        }
    }
    let _ = fs::remove_dir_all(dir);
}

#[test]
fn memory_code_budget_keeps_fact_provenance_and_valid_unicode_excerpt() {
    let (mut server, dir) = memory_server("rev-code-budget");
    let source = format!(
        "fn process() {{\n{}    finish();\n}}\n",
        (0..35)
            .map(|i| format!(
                "    // Проверка маршрута и входных данных {i} 🦀 abcdefghijklmnopqrstuvwxyz\n"
            ))
            .collect::<String>()
    );
    fs::write(dir.join("src/lib.rs"), &source).unwrap();
    let record = server
        .memory_record(
            from_value(json!({"fact":"Process incoming data", "confidence":900, "privacy_tag":"team/память",
            "path":"src/lib.rs", "span":{"start_line":1,"end_line":38}}))
            .unwrap(),
        )
        .unwrap()["record"]
        .clone();
    let tokenizer = Tokenizer::o200k_base().unwrap();
    for budget in [512, 700, 1024] {
        let recalled = server
            .memory_recall(
                from_value(json!({"id":record["id"],"include_code":true,"budget":budget})).unwrap(),
            )
            .unwrap();
        assert_eq!(
            recalled["results"].as_array().unwrap().len(),
            1,
            "{recalled}"
        );
        let hit = &recalled["results"][0];
        for key in [
            "id",
            "version",
            "fact",
            "confidence",
            "provenance",
            "source_hash",
            "privacy_tag",
        ] {
            assert_eq!(hit[key], record[key], "record field {key} was altered");
        }
        assert_eq!(recalled["truncated"], true);
        if let Some(code) = hit.get("code") {
            assert_eq!(code["truncated"], true);
            if let Some(fragment) = code["source"].as_str() {
                assert!(source.starts_with(fragment));
                assert_eq!(code["status"], "available");
                assert_eq!(code["span"]["start_line"], 1);
                assert_eq!(
                    code["span"]["end_line"],
                    fragment.split_inclusive('\n').count()
                );
            } else {
                assert_eq!(code["status"], "budget_omitted");
                assert!(code.get("span").is_none());
            }
        }
        assert!(tokenizer.count(&recalled.to_string()) <= budget);
        let compact = compact_memory_recall(&recalled);
        for key in ["privacy_tag", "source_hash"] {
            let column = compact["cols"]
                .as_array()
                .unwrap()
                .iter()
                .position(|name| name == key)
                .expect("metadata column");
            assert_eq!(compact["rows"][0][column], record[key]);
        }
        assert!(tokenizer.count(&compact.to_string()) <= budget);
    }
    let full = server
        .memory_recall(
            from_value(json!({"id":record["id"],"include_code":true,"budget":4000})).unwrap(),
        )
        .unwrap();
    assert_eq!(full["truncated"], false);
    assert_eq!(full["results"][0]["code"]["source"], source);
    server
        .memory_record(
            from_value(
                json!({"fact":"Preserve the next checkpoint", "confidence":800,
        "path":"src/lib.rs", "span":{"start_line":1,"end_line":38}}),
            )
            .unwrap(),
        )
        .unwrap();
    let facts = server
        .memory_recall(from_value(json!({"budget":16000})).unwrap())
        .unwrap();
    let budget = tokenizer
        .count(&facts.to_string())
        .max(tokenizer.count(&compact_memory_recall(&facts).to_string()))
        + 16;
    let with_code = server
        .memory_recall(from_value(json!({"include_code":true,"budget":budget})).unwrap())
        .unwrap();
    assert_eq!(with_code["results"].as_array().unwrap().len(), 2);
    for (actual, expected) in with_code["results"]
        .as_array()
        .unwrap()
        .iter()
        .zip(facts["results"].as_array().unwrap())
    {
        assert_eq!(actual["id"], expected["id"]);
        assert_eq!(actual["fact"], expected["fact"]);
        assert_eq!(actual["provenance"], expected["provenance"]);
    }
    assert!(tokenizer.count(&with_code.to_string()) <= budget);
    assert!(tokenizer.count(&compact_memory_recall(&with_code).to_string()) <= budget);
    let _ = fs::remove_dir_all(dir);
}

#[test]
fn uncertain_memory_write_exposes_reconciliation_context_without_private_cause_or_logs() {
    let (mut server, dir) = memory_server("rev-uncertain");
    let usage = dir.join("usage.jsonl");
    let metrics = dir.join("metrics.jsonl");
    server.enable_usage_log(&usage, "test", "uncertain-session");
    server.enable_metrics_log(&metrics);
    let id = "0123456789abcdef0123456789abcdef";
    let error = memory_error(std::io::Error::other(MemoryWriteUncertain {
        id: id.to_owned(),
        operation: "update",
        expected_version: Some(7),
        cause: std::io::Error::other("private fact /private/source.rs private-selector"),
    }));
    assert_eq!(error.code, -32020);
    let encoded = serde_json::to_string(&error).unwrap();
    let data = error.data.unwrap();
    assert_eq!(data["code"], "cgrx.memory_write_uncertain");
    assert_eq!(data["id"], id);
    assert_eq!(data["operation"], "update");
    assert_eq!(data["expected_version"], 7);
    assert_eq!(data["backend_class"], "other");
    assert!(!encoded.contains("private fact") && !encoded.contains("/private/source.rs"));
    server.record_usage("memory_update", false, 1, 100, encoded.len(), None);
    server.record_metrics("memory_update", false, 1, encoded.len());
    for log in [usage, metrics] {
        let contents = fs::read_to_string(log).unwrap();
        assert!(contents.contains("memory_update"));
        for private in [id, "private fact", "/private/source.rs", "private-selector"] {
            assert!(!contents.contains(private));
        }
    }
    let _ = fs::remove_dir_all(dir);
}

#[test]
fn exhausted_capacity_is_distinct_from_an_uncertain_mutation() {
    let error = memory_error(std::io::Error::other(MemoryCapacityExceeded {
        current: 52_677_802,
        limit: 52_428_800,
        required: 657,
    }));
    let data = error.data.unwrap();
    assert_eq!(data["code"], "cgrx.memory_capacity_exhausted");
    assert_eq!(data["limit"], 52_428_800);
    assert_eq!(data["mutation_applied"], false);
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

#[test]
fn structural_search_compact_preserves_all_spans_hashes_and_scan_limits() {
    let hash = "a".repeat(64);
    let evidence = json!({"source_hash":hash,"spans":[{"start":24,"end":38}],"truncated":true});
    let scan =
        json!({"definitions":9,"searched_definitions":4,"skipped_definitions":5,"partial":true});
    let full = json!({"algorithm":"ast_grep_v1","language":"rust","query":"fetch($ARG)","matches":[
        {"symbol":"run","path":"src/main.rs","symbol_ref":"current-reference","span":{"start":3,"end":6},"callers":0,"callees":1,"matched_by":"ast","ast_matches":evidence}],
        "total":1,"ast_scan":scan,"page":{"snapshot_id":hash,"offset":0,"limit":20,"next_offset":null,"has_more":false},"llm_used":false});
    let compact = compact_search(&full);
    assert_eq!(compact["cols"][8], "ast_matches");
    assert_eq!(compact["rows"][0][8], evidence);
    assert_eq!(compact["cols"][6], "symbol_ref");
    assert_eq!(compact["cols"][7], "matched_by");
    assert_eq!(compact["ast_scan"], scan);
    assert_eq!(compact["page"], full["page"]);
    let mut empty = full;
    empty["matches"] = json!([]);
    empty["total"] = json!(0);
    let compact = compact_search(&empty);
    assert_eq!(compact["algorithm"], "ast_grep_v1");
    assert_eq!(compact["cols"][7], "ast_matches");
    assert_eq!(compact["ast_scan"]["partial"], true);
}

#[test]
fn structural_search_requires_explicit_language_and_preserves_default_search() {
    let tools = model_visible_schema();
    let search = tools
        .as_array()
        .unwrap()
        .iter()
        .find(|tool| tool["name"] == "search_graph")
        .unwrap();
    assert_eq!(
        search["inputSchema"]["properties"]["match_mode"]["enum"],
        json!(["lexical", "ast"])
    );
    let legacy: SearchGraphArguments = from_value(json!({"query":"http request"})).unwrap();
    assert!(matches!(legacy.match_mode, SearchMatchMode::Lexical));
    let mut server = Server::new(RepoSnapshot {
        repo_revision: "test".into(),
        working_tree_digest: Hash32([0; 32]),
        graph_generation: 1,
    });
    for arguments in [
        json!({"query":"fetch($ARG)","match_mode":"ast"}),
        json!({"query":"fetch($ARG)","match_mode":"ast","language":"java"}),
        json!({"query":"fetch($ARG)","match_mode":"ast","language":"rust","include_body":true}),
        json!({"query":"a".repeat(4097),"match_mode":"ast","language":"rust"}),
        json!({"query":"fetch($ARG)","match_mode":"unknown"}),
    ] {
        let response: Value = serde_json::from_str(&server.dispatch_line(&json!({"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_graph","arguments":arguments}}).to_string())).unwrap();
        assert_eq!(response["error"]["code"], -32602);
        assert_eq!(response["error"]["data"]["code"], "cgrx.invalid_arguments");
    }
}
