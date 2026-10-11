use serde_json::{Value, json};

#[must_use]
pub fn model_visible_schema_json() -> String {
    serde_json::to_string(&model_visible_schema()).expect("static schema must serialize")
}

pub(super) fn model_visible_schema() -> Value {
    let bounded_scope = bounded_scope_schema();
    let path_or_scope = path_or_scope_schema(&bounded_scope);
    let mut tools = json!([
            {"name":"scan_risks","description":"Change risks, candidate tests and deterministic parallel agent missions; arguments are mode, limit, and optional runs only; no tests or LLM executed.","inputSchema":{"type":"object","additionalProperties":false,"properties":{"mode":{"enum":["changes"]},"limit":{"type":"integer","minimum":1,"maximum":50},"runs":{"type":"array","items":{"type":"object","properties":{"runner_command":{"type":"string"},"revision":{"type":"string"},"results":{"type":"array","items":{"type":"object","properties":{"path":{"type":"string"},"symbol":{"type":"string"},"status":{"enum":["passed","failed"]},"source_hash":{"type":"string"}}}}}}}}}},
            {"name":"check_change_gates","description":"Snapshot-bound conservative change gate over findings, impacts, missions and graph coverage; no tests or LLM executed.","inputSchema":{"type":"object","properties":{"limit":{"type":"integer","minimum":1,"maximum":50},"fail_on":{"enum":["error","warning","none"],"default":"error"},"max_warning_findings":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_blocked_missions":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_coverage_gaps":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_unverified_impacts":{"type":"integer","minimum":0,"maximum":10000,"default":0},"runs":{"type":"array","items":{"type":"object","properties":{"runner_command":{"type":"string"},"revision":{"type":"string"},"results":{"type":"array","items":{"type":"object","properties":{"path":{"type":"string"},"symbol":{"type":"string"},"status":{"enum":["passed","failed"]},"source_hash":{"type":"string"}}}}}}}}}},
            {"name":"check_repository_gates","description":"Snapshot-bound architecture gate over package cycles, graph coupling, unresolved local dependencies and coverage; no LLM executed.","inputSchema":{"type":"object","properties":{"scope":path_or_scope.clone(),"package_depth":{"type":"integer","minimum":1,"maximum":4,"default":2},"fail_on":{"enum":["error","warning","none"],"default":"error"},"max_package_cycles":{"type":"integer","minimum":0,"maximum":1000000,"default":0},"max_package_fan_out":{"type":"integer","minimum":0,"maximum":1000000,"default":20},"max_symbol_fan_in":{"type":"integer","minimum":0,"maximum":1000000,"default":50},"max_unresolved_local_dependencies":{"type":"integer","minimum":0,"maximum":1000000,"default":0},"max_coverage_gaps":{"type":"integer","minimum":0,"maximum":1000000,"default":0}}}},
            {"name":"ingest_runtime_evidence","description":"Import revision-pinned runtime call evidence from a local file.","inputSchema":{"type":"object","required":["input_path"],"properties":{"input_path":{"type":"string"},"format":{"enum":["auto","ndjson","otlp-json"],"default":"auto"},"revision":{"type":"string"},"environment":{"type":"string"}}}},
            {"name":"orient","description":"Adaptive context","inputSchema":{"type":"object","required":["task","mode","scope"],"properties":{"task":{"type":"string"},"budget":{"type":"integer","minimum":1},"budget_preset":{"enum":["quick","standard","deep"]},"mode":{"enum":["FAST","PRECISE","BOUNDED"]},"scope":bounded_scope.clone()}}},
            {"name":"search_graph","description":"Paginated symbol and body discovery with identifier tokens","inputSchema":{"type":"object","required":["query"],"properties":{"query":{"type":"string"},"language":{"enum":["typescript","javascript","go","java","python","rust","c","cpp","csharp","ruby","php","swift","scala","elixir","kotlin"]},"include_body":{"type":"boolean"},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":50},"offset":{"type":"integer","minimum":0,"maximum":1000000,"default":0},"expected_snapshot":{"type":"string","pattern":"^[0-9a-f]{64}$","description":"First page.snapshot_id; rejects changed snapshots."}}}},
            {"name":"get_outline","description":"File symbols and proven named imports","inputSchema":{"type":"object","required":["path"],"properties":{"path":{"type":"string"},"limit":{"type":"integer","minimum":1,"maximum":500}}}},
            {"name":"get_architecture","description":"Paginated packages, proven boundaries, communities and graph futures","inputSchema":{"type":"object","properties":{"scope":path_or_scope.clone(),"package_depth":{"type":"integer","minimum":1,"maximum":4},"limit":{"type":"integer","minimum":1,"maximum":100},"offset":{"type":"integer","minimum":0,"maximum":1000000}}}},
            {"name":"trace_path","description":"Calls","inputSchema":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"},"direction":{"enum":["callers","callees","both"]},"depth":{"type":"integer","minimum":1,"maximum":4},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":50},"evidence":{"enum":["static","observed","all"],"default":"static"}}}},
            {"name":"find_usages","description":"Proven usages","inputSchema":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"},"depth":{"type":"integer","minimum":1,"maximum":4},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":500},"evidence":{"enum":["static","observed","all"],"default":"static"}}}},
            {"name":"suggest_refactors","description":"Similar code and hypothetical graph delta","inputSchema":{"type":"object","properties":{"language":{"enum":["typescript","javascript","go","java","python","rust","c","cpp","csharp","ruby","php","swift","scala","elixir","kotlin"]},"min_score":{"type":"integer","minimum":0,"maximum":1000},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":50},"max_documents":{"type":"integer","minimum":0,"maximum":1000000,"default":0},"max_pairs":{"type":"integer","minimum":0,"maximum":1000000,"default":0}}}},
            {"name":"get_code_snippet","description":"Source","inputSchema":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"}}}},
            {"name":"explain_symbol","description":"Explain symbol with definition, callers, callees, and usages","inputSchema":{"type":"object","required":["symbol","scope"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"},"scope":path_or_scope.clone(),"depth":{"type":"integer","minimum":1,"maximum":4,"default":2},"limit":{"type":"integer","minimum":1,"maximum":50,"default":20}}}},
    {"name":"detect_dead_code","description":"Detect symbols with zero incoming calls — candidates for dead code removal. Returns SYNTAX definitions never referenced by any CALLS arc in the scope.","inputSchema":{"type":"object","required":["scope"],"properties":{"scope":path_or_scope.clone(),"language":{"type":"string","description":"Filter by language pack id (e.g. rust, typescript, python)"},"limit":{"type":"integer","minimum":1,"maximum":200,"default":50}}}},
            {"name":"check_index_coverage","description":"Coverage","inputSchema":{"type":"object","properties":{"paths":{"type":"array","items":{"type":"string"}},"scopes":{"type":"array","items":{"type":"string"}},"offset":{"type":"integer","minimum":0},"limit":{"type":"integer","minimum":1,"maximum":500}}}},
            {"name":"check_framework_gates","description":"Framework-aware detection gate for Django/FastAPI/Express with explicit PASS/WARN/FAIL/INCONCLUSIVE verdict; no LLM executed.","inputSchema":{"type":"object","properties":{"paths":{"type":"array","items":{"type":"string"}},"scopes":{"type":"array","items":{"type":"string"}},"fail_on":{"enum":["error","warning","none"],"default":"error"},"max_framework_confidence":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_false_positive_matches":{"type":"integer","minimum":0,"maximum":10000,"default":0}}}},
            {"name":"expand","description":"Expand","inputSchema":{"type":"object","required":["handle","budget"],"properties":{"handle":{"type":"string"},"budget":{"type":"integer","minimum":1}}}},
            {"name":"status","description":"Check repository revision, index freshness and gaps; paths_or_scope defaults to the full repository.","inputSchema":{"type":"object","properties":{"paths_or_scope":{}}}},
            {"name":"memory_record","description":"Record","inputSchema":{"type":"object","required":["fact","confidence","repo","path"],"properties":{"fact":{"type":"string"},"confidence":{"type":"integer","minimum":0,"maximum":1000},"repo":{"type":"string"},"rev":{"type":"string"},"path":{"type":"string"},"span":{"type":"object","required":["start_line","end_line"],"properties":{"start_line":{"type":"integer","minimum":1},"end_line":{"type":"integer","minimum":1}}},"valid_until_unix_nanos":{"type":"integer","minimum":1},"privacy_tag":{"type":"string"}}}},
            {"name":"memory_recall","description":"Recall","inputSchema":{"type":"object","properties":{"query":{"type":"string"},"min_confidence":{"type":"integer","minimum":0,"maximum":1000,"default":0},"privacy_tag":{"type":"string"},"revision":{"type":"string"},"limit":{"type":"integer","minimum":1,"maximum":50,"default":20}}}},
            {"name":"check_security_gates","description":"Snapshot-bound security gate over working-tree secrets, Cargo.lock dependency hygiene and license allowlist with explicit PASS/WARN/FAIL/INCONCLUSIVE verdict; no LLM executed.","inputSchema":{"type":"object","properties":{"fail_on":{"enum":["error","warning","none"],"default":"error"},"max_secret_findings":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_dependency_findings":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_license_findings":{"type":"integer","minimum":0,"maximum":10000,"default":0},"allowlist_paths":{"type":"array","items":{"type":"string"}},"allowlist_licenses":{"type":"array","items":{"type":"string"}}}}}
        ]);
    for tool in tools.as_array_mut().unwrap() {
        if tool["name"] == "trace_path" {
            let mut scope = bounded_scope.clone();
            scope["properties"]["relation_kinds"]["items"]["enum"] =
                json!(["CALLS", "IMPLEMENTS", "CONTAINS"]);
            tool["inputSchema"]["properties"]["scope"] = path_or_scope_schema(&scope);
        }
        if tool["name"] == "find_usages" {
            let mut scope = bounded_scope.clone();
            scope["properties"]["relation_kinds"]["items"]["enum"] =
                json!(["CALLS", "IMPLEMENTS", "IMPORTS", "REFERENCES"]);
            tool["inputSchema"]["properties"]["scope"] = path_or_scope_schema(&scope);
        }
        if matches!(
            tool["name"].as_str(),
            Some("get_code_snippet" | "trace_path" | "find_usages")
        ) {
            tool["inputSchema"]["properties"]["symbol_ref"] = json!({"type":"string"});
        }
        let name = tool["name"].as_str().expect("tool name is static");
        let (title, description) = tool_metadata(name)
            .unwrap_or_else(|| panic!("missing OpenAI metadata for tool {name}"));
        tool["title"] = json!(title);
        tool["description"] = json!(description);
        // All managed calls may refresh persistent indexes and session state.
        // Conservative hints describe actual behavior, not just source-file writes.
        tool["annotations"] =
            json!({"readOnlyHint":false,"destructiveHint":false,"openWorldHint":false});
        tool["outputSchema"] = json!({"type":"object","additionalProperties":true});
    }
    let status = tools
        .as_array_mut()
        .unwrap()
        .iter_mut()
        .find(|tool| tool["name"] == "status")
        .expect("status tool is static");
    status["inputSchema"]["properties"]["paths_or_scope"] = path_or_scope;
    tools
}

fn tool_metadata(name: &str) -> Option<(&'static str, &'static str)> {
    Some(match name {
        "scan_risks" => (
            "Scan change risks",
            "Find possible broken calls, candidate tests and deterministic parallel agent missions for working-tree changes versus HEAD.",
        ),
        "check_change_gates" => (
            "Check change quality gates",
            "Evaluate snapshot-bound findings, mission blockers and coverage: pass, warning, fail or inconclusive.",
        ),
        "check_repository_gates" => (
            "Check repository quality gates",
            "Evaluate proven repository architecture with explicit cycle, coupling, unresolved-dependency and coverage policies.",
        ),
        "ingest_runtime_evidence" => (
            "Import runtime evidence",
            "Import bounded OTLP/JSON or CGRX NDJSON from approved local files; no inline traces.",
        ),
        "orient" => (
            "Orient on a task",
            "Retrieve budgeted task evidence; keep handles for follow-up.",
        ),
        "search_graph" => (
            "Search symbols",
            "Find all query tokens in names or optional bodies; filter by language. Continue with page.next_offset and expected_snapshot=page.snapshot_id; restart after snapshot changes.",
        ),
        "get_outline" => (
            "Outline a file",
            "List ordered symbol spans and proven named imports with targets. Each collection has its own limit and truncation.",
        ),
        "get_architecture" => (
            "Map architecture",
            "Summarize proven packages and weighted symbol communities with representatives.",
        ),
        "trace_path" => (
            "Trace relations",
            "Trace selected relations; path or symbol_ref selects definitions.",
        ),
        "find_usages" => (
            "Find usages",
            "Find proven calls, imports, references and implementations; scope selects relations, symbol_ref selects definitions.",
        ),
        "suggest_refactors" => (
            "Suggest refactors",
            "Find structurally similar functions and preview a snapshot-bound hypothetical extract-helper graph delta.",
        ),
        "get_code_snippet" => (
            "Read source",
            "Read a definition; path or symbol_ref selects the definition.",
        ),
        "explain_symbol" => (
            "Explain symbol",
            "Get a symbol's definition, callers, callees and usages together.",
        ),
        "detect_dead_code" => (
            "Detect dead code",
            "Find symbols with zero incoming CALLS arcs in the code graph.",
        ),
        "check_index_coverage" => (
            "Check coverage",
            "Check evidence paths or scopes before relying on graph results; gaps require source inspection.",
        ),
        "check_framework_gates" => (
            "Check framework gates",
            "Detect scoped Django/FastAPI/Express usage; deterministic snapshot-bound pass, warning, fail or inconclusive gate.",
        ),
        "expand" => (
            "Expand context",
            "Expand a handle in the same repository and server session.",
        ),
        "status" => (
            "Check index status",
            "Check revision, freshness and coverage gaps before discovery.",
        ),
        "memory_record" => (
            "Record decision",
            "Save revision-pinned decisions with confidence, provenance and TTL; identical facts are idempotent. No LLM calls.",
        ),
        "memory_recall" => (
            "Recall decisions",
            "Recall non-expired decisions by confidence within limit; deterministic, no LLM calls.",
        ),
        "check_security_gates" => (
            "Check security gates",
            "Check working-tree secrets, Cargo.lock dependencies and allowed licenses; deterministic snapshot-bound pass, warning, fail or inconclusive gate.",
        ),
        _ => return None,
    })
}

pub(super) fn bounded_scope_schema() -> Value {
    json!({
        "type":"object",
        "required":["include","exclude","relation_kinds","max_depth"],
        "properties":{
            "include":{"type":"array","items":{"type":"string"}},
            "exclude":{"type":"array","items":{"type":"string"}},
            "relation_kinds":{"type":"array","items":{"enum":["CALLS","IMPLEMENTS"]}},
            "max_depth":{"type":"integer","minimum":0,"maximum":255}
        }
    })
}

pub(super) fn path_or_scope_schema(bounded_scope: &Value) -> Value {
    let mut partial = bounded_scope.clone();
    partial.as_object_mut().unwrap().remove("required");
    json!({"anyOf":[{"type":"string"},{"type":"array","items":{"type":"string"}},partial]})
}
