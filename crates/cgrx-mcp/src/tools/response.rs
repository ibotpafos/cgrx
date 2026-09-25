use cgrx_capsule::Tokenizer;
use serde_json::{Value, json};

pub(super) fn model_visible_result(tool: &str, structured: &Value) -> Value {
    match tool {
        "scan_risks" => compact_risks(structured),
        "check_change_gates" => compact_change_gates(structured),
        "check_repository_gates" => compact_repository_gates(structured),
        "orient" => compact_orient(structured),
        "ingest_runtime_evidence" => compact_runtime_import(structured),
        "expand" => compact_expand(structured),
        "search_graph" => compact_search(structured),
        "get_outline" => compact_outline(structured),
        "get_architecture" => compact_architecture(structured),
        "trace_path" => compact_trace(structured),
        "find_usages" => compact_usages(structured),
        "suggest_refactors" => compact_refactors(structured),
        "get_code_snippet" => compact_snippet(structured),
        "explain_symbol" => compact_explain(structured),
        "detect_dead_code" => compact_dead_code(structured),
        "check_index_coverage" => compact_coverage(structured),
        "check_framework_gates" => compact_framework_gates(structured),
        "check_security_gates" => compact_security_gates(structured),
        "status" => compact_status(structured),
        "memory_record" => compact_memory_record(structured),
        "memory_recall" => compact_memory_recall(structured),
        _ => structured.clone(),
    }
}

pub(super) fn evaluate_change_gates(scan: &Value, fail_on: &str, thresholds: [usize; 4]) -> Value {
    let finding_count = scan
        .get("findings")
        .and_then(Value::as_array)
        .map_or(0, Vec::len);
    let impact_count = scan
        .get("impacts")
        .and_then(Value::as_array)
        .map_or(0, Vec::len);
    let blocked = scan
        .pointer("/change_plan/totals/blocked")
        .and_then(Value::as_u64)
        .unwrap_or(0) as usize;
    let gaps = scan
        .get("coverage_gap_count")
        .and_then(Value::as_u64)
        .unwrap_or(0) as usize;
    let specs = [
        (
            "max_warning_findings",
            finding_count,
            thresholds[0],
            "error",
        ),
        ("max_blocked_missions", blocked, thresholds[1], "error"),
        ("max_coverage_gaps", gaps, thresholds[2], "error"),
        (
            "max_unverified_impacts",
            impact_count,
            thresholds[3],
            "warning",
        ),
    ];
    let rules = specs
        .iter()
        .map(|(rule, value, threshold, severity)| {
            json!({
                "rule":rule,
                "value":value,
                "threshold":threshold,
                "severity":severity,
                "status":if value > threshold {"breached"} else {"passed"}
            })
        })
        .collect::<Vec<_>>();
    let errors = rules
        .iter()
        .filter(|rule| rule["status"] == "breached" && rule["severity"] == "error")
        .count();
    let warnings = rules
        .iter()
        .filter(|rule| rule["status"] == "breached" && rule["severity"] == "warning")
        .count();
    let partial = scan.get("partial").and_then(Value::as_bool).unwrap_or(true);
    let verdict = if errors > 0 {
        "FAIL"
    } else if partial {
        "INCONCLUSIVE"
    } else if warnings > 0 {
        "WARN"
    } else {
        "PASS"
    };
    let would_block = match fail_on {
        "none" => false,
        "warning" => errors > 0 || warnings > 0 || partial,
        _ => errors > 0 || partial,
    };
    let failed_rules = rules
        .iter()
        .filter(|rule| rule["status"] == "breached")
        .map(|rule| rule["rule"].clone())
        .collect::<Vec<_>>();
    json!({
        "snapshot":scan.get("snapshot"),
        "base_revision":scan.get("base_revision"),
        "algorithm":"change_quality_gate_v1",
        "llm_used":false,
        "verdict":verdict,
        "would_block":would_block,
        "fail_on":fail_on,
        "rules":rules,
        "totals":{"errors":errors,"warnings":warnings},
        "partial":partial,
        "coverage_gaps":scan.get("coverage_gaps"),
        "coverage_gap_count":gaps,
        "change_plan":{
            "totals":scan.pointer("/change_plan/totals"),
            "execution_order":scan.pointer("/change_plan/execution_order")
        },
        "agent_handoff":{
            "schema_version":"cgrx.agent.change-quality-gate.v1",
            "algorithm":"change_quality_gate_v1",
            "llm_used":false,
            "snapshot":scan.get("snapshot"),
            "verdict":verdict,
            "would_block":would_block,
            "failed_rules":failed_rules,
            "finding_indexes":(0..finding_count).collect::<Vec<_>>(),
            "impact_indexes":(0..impact_count).collect::<Vec<_>>(),
            "change_mission_handoff":scan.pointer("/change_plan/agent_handoff"),
            "requirements":[
                "Revalidate the snapshot before acting on this gate.",
                "Inspect every referenced finding, impact, mission, and coverage gap.",
                "Record actual test execution separately; candidate tests are not execution proof."
            ]
        },
        "limitations":[
            "This gate evaluates bounded change evidence, not whole-program correctness.",
            "INCONCLUSIVE is distinct from PASS and remains blocking unless fail_on is none."
        ]
    })
}

pub(super) fn compact_change_gates(value: &Value) -> Value {
    json!({
        "at":snapshot_tag(value.get("snapshot")),
        "algorithm":value.get("algorithm"),
        "llm_used":value.get("llm_used"),
        "verdict":value.get("verdict"),
        "would_block":value.get("would_block"),
        "fail_on":value.get("fail_on"),
        "rules":value.get("rules"),
        "partial":value.get("partial"),
        "gaps":value.get("coverage_gap_count"),
        "agent_handoff":value.get("agent_handoff")
    })
}

pub(super) fn evaluate_repository_gates(
    architecture: &Value,
    fail_on: &str,
    thresholds: [usize; 5],
) -> Value {
    let package_cycles = architecture
        .pointer("/totals/cycles")
        .and_then(Value::as_u64)
        .unwrap_or(0) as usize;
    let max_package_fan_out = architecture
        .get("packages")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|package| package.get("fan_out").and_then(Value::as_u64))
        .max()
        .unwrap_or(0) as usize;
    let max_symbol_fan_in = architecture
        .get("hotspots")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|hotspot| hotspot.get("fan_in").and_then(Value::as_u64))
        .max()
        .unwrap_or(0) as usize;
    let unresolved_local_dependencies = [
        "/import_resolution/unresolved_local",
        "/reference_resolution/unresolved_local",
    ]
    .into_iter()
    .filter_map(|pointer| architecture.pointer(pointer).and_then(Value::as_u64))
    .sum::<u64>() as usize;
    let coverage_gaps = architecture
        .get("coverage_gap_count")
        .and_then(Value::as_u64)
        .unwrap_or(0) as usize;
    let specs = [
        ("max_package_cycles", package_cycles, thresholds[0], "error"),
        (
            "max_package_fan_out",
            max_package_fan_out,
            thresholds[1],
            "warning",
        ),
        (
            "max_symbol_fan_in",
            max_symbol_fan_in,
            thresholds[2],
            "warning",
        ),
        (
            "max_unresolved_local_dependencies",
            unresolved_local_dependencies,
            thresholds[3],
            "error",
        ),
        ("max_coverage_gaps", coverage_gaps, thresholds[4], "error"),
    ];
    let rules = specs
        .iter()
        .map(|(rule, value, threshold, severity)| {
            json!({
                "rule":rule,"value":value,"threshold":threshold,"severity":severity,
                "status":if value > threshold {"breached"} else {"passed"}
            })
        })
        .collect::<Vec<_>>();
    let errors = rules
        .iter()
        .filter(|rule| rule["status"] == "breached" && rule["severity"] == "error")
        .count();
    let warnings = rules
        .iter()
        .filter(|rule| rule["status"] == "breached" && rule["severity"] == "warning")
        .count();
    let partial = architecture
        .get("partial")
        .and_then(Value::as_bool)
        .unwrap_or(true);
    let verdict = if errors > 0 {
        "FAIL"
    } else if partial {
        "INCONCLUSIVE"
    } else if warnings > 0 {
        "WARN"
    } else {
        "PASS"
    };
    let would_block = match fail_on {
        "none" => false,
        "warning" => errors > 0 || warnings > 0 || partial,
        _ => errors > 0 || partial,
    };
    let failed_rules = rules
        .iter()
        .filter(|rule| rule["status"] == "breached")
        .map(|rule| rule["rule"].clone())
        .collect::<Vec<_>>();
    let cycle_count = architecture
        .get("cycles")
        .and_then(Value::as_array)
        .map_or(0, Vec::len);
    json!({
        "snapshot":architecture.get("snapshot"),
        "algorithm":"repository_quality_gate_v1",
        "llm_used":false,
        "verdict":verdict,"would_block":would_block,"fail_on":fail_on,
        "rules":rules,"totals":{"errors":errors,"warnings":warnings},
        "partial":partial,
        "coverage_gaps":architecture.get("coverage_gaps"),
        "coverage_gap_count":coverage_gaps,
        "architecture_totals":architecture.get("totals"),
        "agent_handoff":{
            "schema_version":"cgrx.agent.repository-quality-gate.v1",
            "algorithm":"repository_quality_gate_v1","llm_used":false,
            "snapshot":architecture.get("snapshot"),"verdict":verdict,
            "would_block":would_block,"failed_rules":failed_rules,
            "cycle_indexes":(0..cycle_count).collect::<Vec<_>>(),
            "architecture_plan":architecture.get("architecture_plan"),
            "requirements":[
                "Revalidate the snapshot and gate policy before acting.",
                "Inspect referenced cycles, hotspots, unresolved dependencies, and coverage gaps.",
                "Treat observed maxima as lower bounds whenever architecture evidence is partial."
            ]
        },
        "limitations":[
            "The gate evaluates proven repository-local architecture and does not claim whole-program correctness.",
            "Package fan-out and symbol fan-in are graph metrics, not cyclomatic complexity.",
            "INCONCLUSIVE is distinct from PASS and remains blocking unless fail_on is none."
        ]
    })
}

pub(super) fn compact_repository_gates(value: &Value) -> Value {
    json!({
        "at":snapshot_tag(value.get("snapshot")),"algorithm":value.get("algorithm"),
        "llm_used":value.get("llm_used"),"verdict":value.get("verdict"),
        "would_block":value.get("would_block"),"fail_on":value.get("fail_on"),
        "rules":value.get("rules"),"partial":value.get("partial"),
        "gaps":value.get("coverage_gap_count"),"agent_handoff":value.get("agent_handoff")
    })
}

pub(super) fn compact_risks(value: &Value) -> Value {
    let findings = value
        .get("findings")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.get("rule"),
                item.get("path"),
                item.get("line"),
                item.get("caller"),
                item.pointer("/removed_target/path"),
                item.pointer("/removed_target/symbol")
            ])
        })
        .collect::<Vec<_>>();
    let impacts = value
        .get("impacts")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.pointer("/caller/path"),
                item.pointer("/caller/symbol"),
                item.pointer("/changed_target/path"),
                item.pointer("/changed_target/symbol"),
                item.get("line")
            ])
        })
        .collect::<Vec<_>>();
    let tests = value
        .pointer("/verification_plan/related_tests")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.get("path"),
                item.get("symbol"),
                item.get("line"),
                item.get("impact_index"),
                item.pointer("/reach/call_depth"),
                item.get("execution_status")
            ])
        })
        .collect::<Vec<_>>();
    json!({
        "at":snapshot_tag(value.get("snapshot")),
        "base":value.get("base_revision"),
        "finding_cols":["rule","path","line","caller","removed_path","removed_symbol"],
        "findings":findings,
        "impact_cols":["caller_path","caller","target_path","target","line"],
        "impacts":impacts,
        "verification_plan":{
            "test_cols":["path","symbol","line","impact","depth","status"],
            "tests":tests,
            "discovery":value.pointer("/verification_plan/test_discovery"),
            "complete_suite":value.pointer("/verification_plan/complete_test_suite"),
            "execution_status":value.pointer("/verification_plan/execution_status"),
            "truncated":value.pointer("/verification_plan/truncated")
        },
        "change_plan":{
            "algorithm":value.pointer("/change_plan/algorithm"),
            "llm_used":value.pointer("/change_plan/llm_used"),
            "totals":value.pointer("/change_plan/totals"),
            "execution_order":value.pointer("/change_plan/execution_order"),
            "agent_handoff":value.pointer("/change_plan/agent_handoff")
        },
        "partial":value.get("partial"),
        "gaps":value.get("coverage_gap_count"),
        "more_gaps":value.get("coverage_gaps_truncated")
    })
}

pub(super) fn compact_runtime_import(value: &Value) -> Value {
    json!({
        "accepted":value.get("accepted"),
        "ambiguous":value.get("ambiguous"),
        "unresolved":value.get("unresolved"),
        "duplicate":value.get("duplicate"),
        "edges":value.get("edges"),
        "warnings":value.get("warnings"),
        "gaps":value.get("gaps").and_then(Value::as_array).into_iter().flatten().take(12).collect::<Vec<_>>()
    })
}

pub(super) fn compact_orient(value: &Value) -> Value {
    let snapshot = value
        .get("snapshot")
        .or_else(|| value.pointer("/rcc/snapshot"));
    let records = value
        .pointer("/compiled/packed/records")
        .or_else(|| value.pointer("/rcc/records"))
        .and_then(Value::as_array)
        .map_or_else(Vec::new, |records| {
            records.iter().map(compact_record_row).collect()
        });
    let uncertainties = value
        .pointer("/compiled/obligations/uncertainties")
        .and_then(Value::as_array)
        .map_or(0, Vec::len);
    let residual = value
        .pointer("/compiled/residual")
        .or_else(|| value.pointer("/qbec/residual"))
        .and_then(Value::as_array)
        .map_or(0, Vec::len);
    json!({
        "at": snapshot_tag(snapshot),
        "status": value.pointer("/compiled/status").or_else(|| value.pointer("/qbec/status")),
        "cols": ["path", "start", "end", "text", "provenance"],
        "records": records,
        "n": records.len(),
        "budget": value.get("budget"),
        "gaps": uncertainties,
        "gap_kinds": compact_uncertainty_counts(value.pointer("/compiled/obligations/uncertainties")),
        "residual": residual,
        "semantic_rerank": value.get("semantic_rerank"),
        "next": value.get("next_handles"),
    })
}

pub(super) fn compact_expand(value: &Value) -> Value {
    let snapshot = value.get("snapshot");
    let records = value
        .get("records")
        .and_then(Value::as_array)
        .map_or_else(Vec::new, |records| {
            records.iter().map(compact_record_row).collect()
        });
    json!({
        "handle": value.get("handle"),
        "at": snapshot_tag(snapshot),
        "status": value.get("status"),
        "cols": ["path", "start", "end", "text", "provenance"],
        "records": records,
        "n": records.len(),
        "next": value.get("next_handles"),
        "budget": value.get("cumulative_budget"),
    })
}

pub(super) fn compact_search(value: &Value) -> Value {
    let snapshot = value.get("snapshot");
    let rows: Vec<_> = value
        .get("matches")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .take(12)
        .map(|item| {
            json!([
                item.get("symbol"),
                item.get("path"),
                item.pointer("/span/start"),
                item.pointer("/span/end"),
                item.get("callers"),
                item.get("callees"),
            ])
        })
        .collect();
    let mut compact = json!({
        "q": value.get("query"),
        "at": snapshot_tag(snapshot),
        "cols": ["symbol", "path", "start", "end", "callers", "callees"],
        "rows": rows,
        "n": value.get("total"),
        "gaps": value.get("coverage_gap_count"),
    });
    insert_more_when_true(&mut compact, value.get("truncated"));
    compact
}

pub(super) fn compact_outline(value: &Value) -> Value {
    let rows: Vec<_> = value
        .get("symbols")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.get("symbol"),
                item.pointer("/span/start"),
                item.pointer("/span/end")
            ])
        })
        .collect();
    let mut compact = json!({
        "at":snapshot_tag(value.get("snapshot")),
        "path":value.get("path"),
        "language":value.get("language"),
        "cols":["symbol","start","end"],
        "rows":rows,
        "n":value.get("total"),
        "gaps":value.get("coverage_gap_count"),
    });
    insert_more_when_true(&mut compact, value.get("truncated"));
    compact
}

pub(super) fn compact_architecture(value: &Value) -> Value {
    let packages = value
        .get("packages")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.get("name"),
                item.get("files"),
                item.get("symbols"),
                item.get("fan_in"),
                item.get("fan_out")
            ])
        })
        .collect::<Vec<_>>();
    let boundaries = value
        .get("boundaries")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            let evidence = item
                .get("evidence")
                .and_then(Value::as_array)
                .and_then(|items| items.first());
            json!([
                item.get("source"),
                item.get("target"),
                item.get("edges"),
                item.get("relations"),
                item.get("confidence"),
                evidence.and_then(|row| row.get("path")),
                evidence.and_then(|row| row.pointer("/span/start")),
                evidence.and_then(|row| row.pointer("/span/end"))
            ])
        })
        .collect::<Vec<_>>();
    let hotspots = value
        .get("hotspots")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| json!([item.get("symbol"), item.get("path"), item.get("fan_in")]))
        .collect::<Vec<_>>();
    let cycles = value
        .get("cycles")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|item| item.get("packages"))
        .collect::<Vec<_>>();
    let communities = value
        .get("communities")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.get("packages"),
                item.get("internal_weight"),
                item.get("cut_weight"),
                item.get("cohesion")
            ])
        })
        .collect::<Vec<_>>();
    let symbol_communities = value
        .get("symbol_communities")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .take(12)
        .map(|item| {
            let top_nodes = item
                .get("top_nodes")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
                .collect::<Vec<_>>();
            let representative_path = top_nodes.first().and_then(|node| node.get("path"));
            let top_symbols = top_nodes
                .iter()
                .filter_map(|node| node.get("symbol"))
                .collect::<Vec<_>>();
            json!([
                item.get("label"),
                item.get("members"),
                item.get("cohesion"),
                item.get("packages"),
                item.get("edge_types"),
                representative_path,
                top_symbols
            ])
        })
        .collect::<Vec<_>>();
    let architecture_futures = value
        .pointer("/architecture_plan/issues")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .take(6)
        .filter_map(|issue| {
            let winner = issue
                .get("strategies")?
                .as_array()?
                .iter()
                .find(|strategy| strategy["recommended"] == true)?;
            Some(json!({
                "issue_id":issue.get("issue_id"),
                "kind":issue.get("kind"),
                "packages":issue.get("packages"),
                "selected_boundary":issue.get("selected_boundary"),
                "policy":winner.get("policy"),
                "score":winner.pointer("/counterfactual/score"),
                "reasons":winner.pointer("/counterfactual/reasons"),
                "strategy_id":winner.get("strategy_id"),
                "predicted_graph":winner.get("predicted_graph"),
                "agent_handoff":issue.get("agent_handoff")
            }))
        })
        .collect::<Vec<_>>();
    let mut compact = json!({
        "at":snapshot_tag(value.get("snapshot")),
        "page":value.get("page"),
        "relation_kinds":value.get("relation_kinds"),
        "package_cols":["name","files","symbols","fan_in","fan_out"],
        "packages":packages,
        "boundary_cols":["source","target","edges","relations","confidence","path","start","end"],
        "boundaries":boundaries,
        "hotspot_cols":["symbol","path","fan_in"],
        "hotspots":hotspots,
        "cycles":cycles,
        "community_cols":["packages","internal_weight","cut_weight","cohesion"],
        "communities":communities,
        "community_detection":value.get("community_detection"),
        "symbol_community_cols":["label","members","cohesion","packages","edge_types","representative_path","top_symbols"],
        "symbol_communities":symbol_communities,
        "symbol_community_detection":value.get("symbol_community_detection"),
        "architecture_futures":architecture_futures,
        "architecture_planner":{
            "algorithm":value.pointer("/architecture_plan/algorithm"),
            "llm_used":value.pointer("/architecture_plan/llm_used"),
            "totals":value.pointer("/architecture_plan/totals"),
            "shown":architecture_futures.len(),
            "more":value.pointer("/architecture_plan/totals/issues").and_then(Value::as_u64).is_some_and(|total| total > architecture_futures.len() as u64)
        },
        "totals":value.get("totals"),
        "import_resolution":value.get("import_resolution"),
        "reference_resolution":value.get("reference_resolution"),
        "gaps":value.get("coverage_gap_count"),
        "partial":value.get("partial")
    });
    insert_more_when_true(&mut compact, value.get("truncated"));
    let encoded = serde_json::to_string(&compact).expect("compact architecture serializes");
    let payload_tokens = Tokenizer::o200k_base()
        .expect("bundled o200k tokenizer")
        .count(&encoded);
    compact
        .as_object_mut()
        .expect("compact architecture is an object")
        .insert("payload_tokens".to_owned(), json!(payload_tokens));
    compact
}

pub(super) fn compact_trace(value: &Value) -> Value {
    let snapshot = value.get("snapshot");
    let include_evidence = value.get("evidence").is_some();
    let mut paths = Vec::<String>::new();
    let rows: Vec<_> = value
        .get("nodes")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            let path_id = item.get("path").and_then(Value::as_str).map(|path| {
                paths
                    .iter()
                    .position(|stored| stored == path)
                    .unwrap_or_else(|| {
                        paths.push(path.to_owned());
                        paths.len() - 1
                    })
            });
            let mut row = vec![
                item.get("symbol").cloned().unwrap_or(Value::Null),
                json!(path_id),
                item.get("hop").cloned().unwrap_or(Value::Null),
                item.get("direction").cloned().unwrap_or(Value::Null),
            ];
            if include_evidence {
                row.extend([
                    item.get("evidence").cloned().unwrap_or(Value::Null),
                    item.get("count").cloned().unwrap_or(Value::Null),
                ]);
            }
            json!(row)
        })
        .collect();
    let mut compact = json!({
        "root": value.get("root").map(compact_trace_root),
        "at": snapshot_tag(snapshot),
        "paths":paths,
        "cols": ["symbol", "path_id", "hop", "direction"],
        "rows": rows,
        "n": value.get("total"),
        "gaps": value.get("coverage_gap_count"),
    });
    if include_evidence {
        compact["cols"] = json!(["symbol", "path_id", "hop", "direction", "evidence", "count"]);
        compact["evidence"] = value["evidence"].clone();
    }
    insert_more_when_true(&mut compact, value.get("truncated"));
    compact
}

pub(super) fn compact_usages(value: &Value) -> Value {
    let include_evidence = value.get("evidence").is_some();
    let mut paths = Vec::<String>::new();
    let rows: Vec<_> = value
        .get("usages")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            let site_path = item.pointer("/site/path").and_then(Value::as_str);
            let path_id = site_path.map(|path| {
                paths
                    .iter()
                    .position(|stored| stored == path)
                    .unwrap_or_else(|| {
                        paths.push(path.to_owned());
                        paths.len() - 1
                    })
            });
            let mut row = vec![
                item.pointer("/source/symbol")
                    .cloned()
                    .unwrap_or(Value::Null),
                json!(path_id),
                item.get("hop").cloned().unwrap_or(Value::Null),
                item.pointer("/via/symbol").cloned().unwrap_or(Value::Null),
                item.get("relation").cloned().unwrap_or(Value::Null),
                item.pointer("/site/span/start")
                    .cloned()
                    .unwrap_or(Value::Null),
                item.pointer("/site/span/end")
                    .cloned()
                    .unwrap_or(Value::Null),
                item.get("resolver").cloned().unwrap_or(Value::Null),
            ];
            if include_evidence {
                row.extend([
                    item.get("evidence").cloned().unwrap_or(Value::Null),
                    item.get("count").cloned().unwrap_or(Value::Null),
                ]);
            }
            json!(row)
        })
        .collect();
    let mut compact = json!({
        "at":snapshot_tag(value.get("snapshot")),
        "target":value.get("target").map(compact_trace_root),
        "paths":paths,
        "cols":["source","path_id","hop","via","relation","site_start","site_end","resolver"],
        "rows":rows,
        "n":value.get("total"),
        "gaps":value.get("coverage_gap_count")
    });
    if include_evidence {
        compact["cols"] = json!([
            "source",
            "path_id",
            "hop",
            "via",
            "relation",
            "site_start",
            "site_end",
            "resolver",
            "evidence",
            "count"
        ]);
        compact["evidence"] = value["evidence"].clone();
    }
    insert_more_when_true(&mut compact, value.get("truncated"));
    compact
}

pub(super) fn compact_refactors(value: &Value) -> Value {
    let mut paths = Vec::<String>::new();
    let rows = value
        .get("candidates")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|candidate| {
            let left = compact_refactor_symbol(candidate.get("left"), &mut paths);
            let right = compact_refactor_symbol(candidate.get("right"), &mut paths);
            let shared = candidate
                .get("shared_callees")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
                .filter_map(|callee| callee.pointer("/target/symbol"))
                .collect::<Vec<_>>();
            let recommended = candidate
                .get("strategies")
                .and_then(Value::as_array)
                .and_then(|strategies| {
                    strategies
                        .iter()
                        .find(|strategy| strategy["recommended"] == true)
                });
            json!([
                left,
                right,
                candidate.get("language"),
                candidate.pointer("/similarity/total"),
                shared,
                candidate.pointer("/projection/id"),
                recommended.and_then(|strategy| strategy.get("policy")),
                recommended.and_then(|strategy| strategy.pointer("/counterfactual/score")),
                recommended.and_then(|strategy| strategy.pointer("/counterfactual/reasons")),
                recommended.and_then(|strategy| strategy.get("strategy_id"))
            ])
        })
        .collect::<Vec<_>>();
    let mut compact = json!({
        "at":snapshot_tag(value.get("snapshot")),
        "status":value.get("status"),
        "paths":paths,
        "cols":["left","right","language","score","shared_callees","projection_id","recommended_policy","counterfactual_score","reason_codes","strategy_id"],
        "rows":rows,
        "n":value.get("total"),
        "gaps":value.get("coverage_gap_count")
    });
    insert_more_when_true(&mut compact, value.get("truncated"));
    let encoded = serde_json::to_string(&compact).expect("compact refactor result serializes");
    let payload_tokens = Tokenizer::o200k_base()
        .expect("bundled o200k tokenizer")
        .count(&encoded);
    compact
        .as_object_mut()
        .expect("compact result is an object")
        .insert("payload_tokens".to_owned(), json!(payload_tokens));
    compact
}

pub(super) fn compact_refactor_symbol(value: Option<&Value>, paths: &mut Vec<String>) -> Value {
    let Some(value) = value else {
        return Value::Null;
    };
    let path_id = value.get("path").and_then(Value::as_str).map(|path| {
        paths
            .iter()
            .position(|stored| stored == path)
            .unwrap_or_else(|| {
                paths.push(path.to_owned());
                paths.len() - 1
            })
    });
    json!([value.get("symbol"), path_id])
}

pub(super) fn compact_status(value: &Value) -> Value {
    let snapshot = value.get("snapshot");
    let gaps: Vec<_> = value
        .get("coverage_gaps")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .take(8)
        .cloned()
        .collect();
    json!({
        "at": snapshot_tag(snapshot),
        "freshness": value.get("freshness"),
        "graph": value.get("graph"),
        "changed": value.get("changed_paths"),
        "gaps_n": value.get("coverage_gap_count"),
        "gap_kinds": value.get("coverage_summary"),
        "gaps": gaps,
        "more": value.get("coverage_gaps_truncated"),
    })
}

pub(super) fn compact_uncertainty_counts(uncertainties: Option<&Value>) -> Value {
    let mut counts = serde_json::Map::new();
    for uncertainty in uncertainties
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        let Some(kind) = uncertainty.get("kind").and_then(Value::as_str) else {
            continue;
        };
        let count = counts.get(kind).and_then(Value::as_u64).unwrap_or(0) + 1;
        counts.insert(kind.to_owned(), json!(count));
    }
    Value::Object(counts)
}

pub(super) fn compact_snippet(value: &Value) -> Value {
    json!({
        "at":snapshot_tag(value.get("snapshot")),
        "symbol":value.get("symbol"),
        "path":value.get("path"),
        "definition_span":value.get("definition_span"),
        "body_span":value.get("body_span"),
        "source":value.get("source"),
    })
}

pub(super) fn compact_dead_code(value: &Value) -> Value {
    let rows: Vec<_> = value
        .get("dead_symbols")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| {
            json!([
                item.get("symbol"),
                item.get("path"),
                item.get("span"),
                item.get("outgoing_calls")
            ])
        })
        .collect();
    json!({
        "at": snapshot_tag(value.get("snapshot")),
        "cols": ["symbol", "path", "span", "outgoing_calls"],
        "rows": rows,
        "total": value.get("total"),
        "truncated": value.get("truncated"),
    })
}

pub(super) fn compact_explain(value: &Value) -> Value {
    json!({
        "at":snapshot_tag(value.get("snapshot")),
        "definition":value.get("definition"),
        "callers":value.get("callers"),
        "callees":value.get("callees"),
        "usages":value.get("usages"),
        "callers_count":value.get("callers_count"),
        "callees_count":value.get("callees_count"),
        "usages_count":value.get("usages_count"),
    })
}

pub(super) fn compact_coverage(value: &Value) -> Value {
    let rows: Vec<_> = value
        .get("paths")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|item| json!([item.get("path"), item.get("status"), item.get("gap_count")]))
        .collect();
    json!({
        "at":snapshot_tag(value.get("snapshot")),
        "cols":["path","status","gaps"],
        "rows":rows,
        "scopes":value.get("scopes"),
        "summary":value.get("summary"),
        "scope_summary":value.get("scope_summary"),
    })
}

pub(super) fn compact_framework_gates(value: &Value) -> Value {
    let frameworks = value
        .get("frameworks")
        .and_then(Value::as_object)
        .map(|object| {
            let mut map = serde_json::Map::new();
            for (key, framework) in object {
                map.insert(
                    key.clone(),
                    json!({
                        "confidence": framework.get("confidence"),
                        "verdict": framework.get("verdict"),
                        "positive_count": framework
                            .get("positive_matches")
                            .and_then(Value::as_array)
                            .map(Vec::len)
                            .unwrap_or(0),
                        "negative_count": framework
                            .get("negative_matches")
                            .and_then(Value::as_array)
                            .map(Vec::len)
                            .unwrap_or(0),
                    }),
                );
            }
            map
        });
    json!({
        "at": snapshot_tag(value.get("snapshot")),
        "algorithm": value.get("algorithm"),
        "llm_used": value.get("llm_used"),
        "verdict": value.get("verdict"),
        "would_block": value.get("would_block"),
        "fail_on": value.get("fail_on"),
        "rules": value.get("rules"),
        "partial": value.get("partial"),
        "totals": value.get("totals"),
        "frameworks": frameworks,
        "agent_handoff": value.get("agent_handoff"),
    })
}

pub(super) fn compact_security_gates(value: &Value) -> Value {
    let secret_count = value
        .get("secret_findings")
        .and_then(Value::as_array)
        .map(Vec::len)
        .unwrap_or(0);
    let dependency_count = value
        .get("dependency_findings")
        .and_then(Value::as_array)
        .map(Vec::len)
        .unwrap_or(0);
    let license_count = value
        .get("license_findings")
        .and_then(Value::as_array)
        .map(Vec::len)
        .unwrap_or(0);
    json!({
        "at": snapshot_tag(value.get("snapshot")),
        "algorithm": value.get("algorithm"),
        "llm_used": value.get("llm_used"),
        "verdict": value.get("verdict"),
        "would_block": value.get("would_block"),
        "fail_on": value.get("fail_on"),
        "rules": value.get("rules"),
        "partial": value.get("partial"),
        "totals": value.get("totals"),
        "secret_findings_count": secret_count,
        "dependency_findings_count": dependency_count,
        "license_findings_count": license_count,
        "coverage_gap_count": value.get("coverage_gap_count"),
        "agent_handoff": value.get("agent_handoff"),
    })
}

pub(super) fn compact_record_row(value: &Value) -> Value {
    json!([
        value.get("path"),
        value
            .get("span_start")
            .or_else(|| value.pointer("/span/start")),
        value.get("span_end").or_else(|| value.pointer("/span/end")),
        value.get("text"),
        value.get("provenance"),
    ])
}

pub(super) fn snapshot_tag(snapshot: Option<&Value>) -> Option<String> {
    let snapshot = snapshot?;
    let revision: String = snapshot
        .get("repo_revision")?
        .as_str()?
        .chars()
        .take(12)
        .collect();
    let generation = snapshot.get("graph_generation")?.as_u64()?;
    Some(format!("{revision}@{generation}"))
}

pub(super) fn insert_more_when_true(value: &mut Value, more: Option<&Value>) {
    if more.and_then(Value::as_bool) == Some(true) {
        value
            .as_object_mut()
            .expect("compact result is an object")
            .insert("more".to_owned(), Value::Bool(true));
    }
}

pub(super) fn compact_trace_root(value: &Value) -> Value {
    json!({
        "symbol": value.get("symbol").or_else(|| value.get("qualified_name")),
        "path": value.get("path"),
        "span": [
            value.get("span_start").or_else(|| value.pointer("/span/start")),
            value.get("span_end").or_else(|| value.pointer("/span/end")),
        ],
    })
}

pub(super) fn compact_memory_record(value: &Value) -> Value {
    json!({
        "at": snapshot_tag(value.get("snapshot")),
        "id": value.pointer("/record/id"),
        "duplicate": value.get("duplicate"),
        "llm_used": false,
    })
}

pub(super) fn compact_memory_recall(value: &Value) -> Value {
    let rows: Vec<_> = value
        .get("results")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .take(50)
        .map(|item| json!([item.get("id"), item.get("confidence"), item.get("fact")]))
        .collect();
    json!({
        "at": snapshot_tag(value.get("snapshot")),
        "cols": ["id", "confidence", "fact"],
        "rows": rows,
        "truncated": value.get("truncated"),
        "llm_used": false,
    })
}
