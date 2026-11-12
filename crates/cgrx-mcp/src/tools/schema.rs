use serde_json::{Value, json};

#[must_use]
pub fn model_visible_schema_json() -> String {
    serde_json::to_string(&model_visible_schema()).expect("static schema must serialize")
}

fn memory_record_schema() -> Value {
    json!({"type":"object","additionalProperties":false,"required":["fact","confidence"],
        "properties": {
            "repo":{"type":"string"}, "fact":{"type":"string","minLength":1,"maxLength":4000,"description":"Detailed evidence: source_ref."},
            "confidence":{"type":"integer","minimum":0,"maximum":1000,"description":"Integer 0..1000; 990 means 99%, not 0.99."},
            "rev":{"type":"string","description":"Omit for current revision; status.at is not a Git OID."}, "path":{"type":"string","maxLength":1024},
            "symbol":{"type":"string","minLength":1,"maxLength":1024,"description":"Bind to an indexed definition; derives path and line span."},
            "symbol_ref":{"type":"string","maxLength":128,"description":"Current opaque selector from search_graph or get_outline; use for repeated names."},
            "span":{"type":"object","additionalProperties":false,"required":["start_line","end_line"],
                "properties":{"start_line":{"type":"integer","minimum":1},"end_line":{"type":"integer","minimum":1}}},
            "valid_until_unix_nanos":{"type":"integer","minimum":1},
            "privacy_tag":{"type":"string","minLength":1,"maxLength":64},
            "memory_kind":{"enum":["semantic","episodic","procedural","working"],"default":"semantic"},
            "source_kind":{"enum":["code","user","agent","tool"],"default":"code"},
            "source_ref":{"type":"string","minLength":1,"maxLength":1024},
            "task_id":{"type":"string","minLength":1,"maxLength":1024},
            "event_id":{"type":"string","minLength":1,"maxLength":1024}
        }
    })
}

pub(super) fn model_visible_schema() -> Value {
    let bounded_scope = bounded_scope_schema();
    let path_or_scope = path_or_scope_schema(&bounded_scope);
    let memory_record_schema = memory_record_schema();
    let test_runs = json!({"type":"array","description":"Test claims; incomplete summaries stay unverified.","items":{
        "type":"object","additionalProperties":false,"required":["runner_command"],
        "properties":{
            "runner_command":{"type":"string","description":"Command already executed."},
            "revision":{"type":"string","description":"Exact Git revision at test time."},
            "results":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["path","status"],"properties":{
                "path":{"type":"string"},"symbol":{"type":"string","description":"Exact test symbol."},
                "status":{"enum":["passed","failed"]},"source_hash":{"type":["string","null"],"description":"Candidate test file hash."}
            }}}
        }
    }});
    let mut tools = json!([
            {"name":"scan_risks","inputSchema":{"type":"object","additionalProperties":false,"properties":{"mode":{"enum":["changes"],"default":"changes"},"limit":{"type":"integer","minimum":1,"maximum":50,"default":20},"runs":test_runs.clone()}}},
            {"name":"check_change_gates","inputSchema":{"type":"object","properties":{"limit":{"type":"integer","minimum":1,"maximum":50},"fail_on":{"enum":["error","warning","none"],"default":"error"},"max_warning_findings":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_blocked_missions":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_coverage_gaps":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_unverified_impacts":{"type":"integer","minimum":0,"maximum":10000,"default":0},"runs":test_runs}}},
            {"name":"check_repository_gates","description":"Snapshot-bound architecture gate over package cycles, graph coupling, unresolved local dependencies and coverage; no LLM executed.","inputSchema":{"type":"object","properties":{"scope":path_or_scope.clone(),"package_depth":{"type":"integer","minimum":1,"maximum":4,"default":2},"fail_on":{"enum":["error","warning","none"],"default":"error"},"max_package_cycles":{"type":"integer","minimum":0,"maximum":1000000,"default":0},"max_package_fan_out":{"type":"integer","minimum":0,"maximum":1000000,"default":20},"max_symbol_fan_in":{"type":"integer","minimum":0,"maximum":1000000,"default":50},"max_unresolved_local_dependencies":{"type":"integer","minimum":0,"maximum":1000000,"default":0},"max_coverage_gaps":{"type":"integer","minimum":0,"maximum":1000000,"default":0}}}},
            {"name":"ingest_runtime_evidence","description":"Import revision-pinned runtime call evidence from a local file.","inputSchema":{"type":"object","required":["input_path"],"properties":{"input_path":{"type":"string"},"format":{"enum":["auto","ndjson","otlp-json"],"default":"auto"},"revision":{"type":"string"},"environment":{"type":"string"}}}},
            {"name":"orient","inputSchema":{"type":"object","required":["task"],"properties":{"task":{"type":"string","minLength":1},"budget":{"type":"integer","minimum":1,"description":"Explicit token budget; takes precedence over budget_preset."},"budget_preset":{"enum":["quick","standard","deep"]},"mode":{"enum":["FAST","PRECISE","BOUNDED"],"default":"BOUNDED"},"scope":path_or_scope.clone()}}},
            {"name":"search_graph","description":"Paginated symbol and body discovery with identifier tokens","inputSchema":{"type":"object","required":["query"],"properties":{"query":{"type":"string"},"language":{"enum":["typescript","javascript","go","java","python","rust","c","cpp","csharp","ruby","php","swift","scala","elixir","kotlin"]},"include_body":{"type":"boolean"},"match_mode":{"enum":["lexical","ast"]},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":50},"offset":{"type":"integer","minimum":0,"maximum":1000000,"default":0},"expected_snapshot":{"type":"string","pattern":"^[0-9a-f]{64}$","description":"First page.snapshot_id; rejects changed snapshots."}}}},
            {"name":"get_outline","description":"File symbols and proven named imports","inputSchema":{"type":"object","required":["path"],"properties":{"path":{"type":"string"},"limit":{"type":"integer","minimum":1,"maximum":500}}}},
            {"name":"get_architecture","description":"Paginated packages, proven boundaries, communities and graph futures","inputSchema":{"type":"object","properties":{"scope":path_or_scope.clone(),"package_depth":{"type":"integer","minimum":1,"maximum":4},"limit":{"type":"integer","minimum":1,"maximum":100},"offset":{"type":"integer","minimum":0,"maximum":1000000}}}},
            {"name":"trace_path","description":"Calls","inputSchema":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"},"direction":{"enum":["callers","callees","both"]},"depth":{"type":"integer","minimum":1,"maximum":4},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":50},"evidence":{"enum":["static","observed","all"],"default":"static"}}}},
            {"name":"find_usages","description":"Proven usages","inputSchema":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"},"depth":{"type":"integer","minimum":1,"maximum":4},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":500},"evidence":{"enum":["static","observed","all"],"default":"static"}}}},
            {"name":"get_quality_index_status","description":"Inspect the background quality producer, its snapshot freshness and incremental parse/reuse counters without forcing a quality scan.","inputSchema":{"type":"object","properties":{}}},
            {"name":"update_quality_candidate_status","description":"Persist a user-reported finding status with compare-and-swap versioning and bounded history. Dismissed/fixed require a reason; source is never modified.","inputSchema":{"type":"object","required":["status","expected_version"],"properties":{"finding_id":{"type":"string","maxLength":64},"candidate_id":{"type":"string"},"status":{"enum":["new","confirmed","dismissed","fixed"]},"expected_version":{"type":"integer","minimum":0},"reason":{"type":"string","maxLength":1000}}}},
            {"name":"list_quality_candidates","description":"Snapshot-bound inventory of duplicate, possible dead-code and hardcoded literal candidates with global graph usage evidence and bounded reverse impact. Values are redacted; partial coverage never proves safety.","inputSchema":{"type":"object","properties":{"kind":{"enum":["duplicate","dead_code","hardcode"]},"limit":{"type":"integer","minimum":1,"maximum":100,"default":20},"offset":{"type":"integer","minimum":0,"maximum":100000,"default":0},"expected_snapshot":{"type":"object"}}}},
            {"name":"get_candidate_details","description":"Resolve a quality candidate ID against the current snapshot; stale IDs are rejected.","inputSchema":{"type":"object","required":["candidate_id"],"properties":{"candidate_id":{"type":"string","maxLength":64}}}},
            {"name":"prepare_candidate_patch","description":"Return a review-only TypeScript literal-extraction diff, apply it in an isolated temporary copy and compare baseline/modified Node syntax checks. Opt in with run_project_checks to trusted format/typecheck/tests from .cgrx/quality-checks.json (copies, not a security sandbox).","inputSchema":{"type":"object","required":["candidate_id"],"properties":{"candidate_id":{"type":"string","maxLength":64},"run_project_checks":{"type":"boolean","default":false}}}},
            {"name":"suggest_refactors","description":"Similar code and hypothetical graph delta","inputSchema":{"type":"object","properties":{"language":{"enum":["typescript","javascript","go","java","python","rust","c","cpp","csharp","ruby","php","swift","scala","elixir","kotlin"]},"min_score":{"type":"integer","minimum":0,"maximum":1000},"scope":path_or_scope.clone(),"limit":{"type":"integer","minimum":1,"maximum":50},"max_documents":{"type":"integer","minimum":0,"maximum":1000000,"default":0},"max_pairs":{"type":"integer","minimum":0,"maximum":1000000,"default":0}}}},
            {"name":"get_code_snippet","description":"Source","inputSchema":{"type":"object","required":["symbol"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"}}}},
            {"name":"explain_symbol","description":"Explain symbol with definition, callers, callees, and usages","inputSchema":{"type":"object","required":["symbol","scope"],"properties":{"symbol":{"type":"string"},"path":{"type":"string"},"scope":path_or_scope.clone(),"depth":{"type":"integer","minimum":1,"maximum":4,"default":2},"limit":{"type":"integer","minimum":1,"maximum":50,"default":20}}}},
    {"name":"detect_dead_code","description":"Detect symbols with zero incoming calls — candidates for dead code removal. Returns SYNTAX definitions never referenced by any CALLS arc in the scope.","inputSchema":{"type":"object","required":["scope"],"properties":{"scope":path_or_scope.clone(),"language":{"type":"string","description":"Filter by language pack id (e.g. rust, typescript, python)"},"limit":{"type":"integer","minimum":1,"maximum":200,"default":50}}}},
            {"name":"check_index_coverage","description":"Coverage","inputSchema":{"type":"object","additionalProperties":false,"properties":{"paths":{"type":"array","items":{"type":"string"}},"scopes":{"type":"array","items":{"type":"string"}},"offset":{"type":"integer","minimum":0},"limit":{"type":"integer","minimum":1,"maximum":500}}}},
            {"name":"check_framework_gates","description":"Framework-aware detection gate for Django/FastAPI/Express with explicit PASS/WARN/FAIL/INCONCLUSIVE verdict; no LLM executed.","inputSchema":{"type":"object","properties":{"paths":{"type":"array","items":{"type":"string"}},"scopes":{"type":"array","items":{"type":"string"}},"fail_on":{"enum":["error","warning","none"],"default":"error"},"max_framework_confidence":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_false_positive_matches":{"type":"integer","minimum":0,"maximum":10000,"default":0}}}},
            {"name":"expand","description":"Expand","inputSchema":{"type":"object","required":["handle","budget"],"properties":{"handle":{"type":"string"},"budget":{"type":"integer","minimum":1}}}},
            {"name":"status","description":"Check repository revision, index freshness and gaps; paths_or_scope defaults to the full repository.","inputSchema":{"type":"object","properties":{"paths_or_scope":{}}}},
            {"name":"memory_record","inputSchema":memory_record_schema.clone()},
            {"name":"memory_recall","inputSchema":{"type":"object","additionalProperties":false,"properties":{"repo":{"type":"string"},"query":{"type":"string","minLength":1,"maxLength":4000},"min_confidence":{"type":"integer","minimum":0,"maximum":1000,"default":0},"privacy_tag":{"type":"string"},"revision":{"type":"string"},"memory_kind":{"enum":["semantic","episodic","procedural","working"]},"task_id":{"type":"string"},"id":{"type":"string","pattern":"^[0-9a-f]{32}$"},"include_history":{"type":"boolean","default":false},"include_stale":{"type":"boolean","default":false},"budget":{"type":"integer","minimum":256,"maximum":16000,"default":2048},"limit":{"type":"integer","minimum":1,"maximum":50,"default":20}}}},
            {"name":"memory_update","inputSchema":{"type":"object","additionalProperties":false,"required":["id","expected_version","reason","record"],"properties":{"repo":{"type":"string"},"id":{"type":"string","pattern":"^[0-9a-f]{32}$"},"expected_version":{"type":"integer","minimum":1},"reason":{"type":"string","minLength":1,"maxLength":1024},"record":memory_record_schema.clone()}}},
            {"name":"memory_forget","inputSchema":{"type":"object","additionalProperties":false,"required":["id","expected_version"],"properties":{"repo":{"type":"string"},"id":{"type":"string","pattern":"^[0-9a-f]{32}$"},"expected_version":{"type":"integer","minimum":1}}}},
            {"name":"check_security_gates","description":"Snapshot-bound security gate over working-tree secrets, Cargo.lock dependency hygiene and license allowlist with explicit PASS/WARN/FAIL/INCONCLUSIVE verdict; no LLM executed.","inputSchema":{"type":"object","properties":{"fail_on":{"enum":["error","warning","none"],"default":"error"},"max_secret_findings":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_dependency_findings":{"type":"integer","minimum":0,"maximum":10000,"default":0},"max_license_findings":{"type":"integer","minimum":0,"maximum":10000,"default":0},"allowlist_paths":{"type":"array","items":{"type":"string"}},"allowlist_licenses":{"type":"array","items":{"type":"string"}}}}}
        ]);
    for tool in tools.as_array_mut().unwrap() {
        if tool["name"] == "scan_risks" {
            tool["inputSchema"]["properties"]["base"] = json!({"type":"string","minLength":1,"maxLength":1024,"description":"Git commit revision: full/short OID, tag, branch or HEAD~N. Defaults to HEAD; resolved once to base_revision."});
        }
        if tool["name"] == "trace_path" {
            tool["inputSchema"]["properties"]["direction"] = json!({"enum":["callers","callees","both","incoming","outgoing"],"description":"incoming=callers; outgoing=callees."});
            let mut scope = bounded_scope.clone();
            scope["properties"]["relation_kinds"]["items"]["enum"] =
                json!(["CALLS", "IMPLEMENTS", "CONTAINS"]);
            tool["inputSchema"]["properties"]["scope"] = path_or_scope_schema(&scope);
        }
        if tool["name"] == "memory_recall" {
            let mut alias = tool["inputSchema"]["properties"]["budget"].clone();
            alias
                .as_object_mut()
                .expect("budget schema")
                .remove("default");
            alias["description"] = json!("Alias of budget; supply only one.");
            tool["inputSchema"]["properties"]["token_budget"] = alias;
            tool["inputSchema"]["properties"]["include_code"] = json!({"type":"boolean","default":false,"description":"Include verified code and current navigation hints for stale links. Code context is reduced before facts to fit the recall budget; changed source is withheld."});
            tool["inputSchema"]["properties"]["path"] = json!({"type":"string","minLength":1,"maxLength":1024,"description":"Exact repository-relative path, including removed files with include_stale. No globs."});
            tool["inputSchema"]["properties"]["symbol"] = json!({"type":"string","minLength":1,"maxLength":1024,"description":"Exact linked symbol name returned by code discovery. Combine with path for repeated names."});
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
        if tool["name"] == "list_quality_candidates" {
            let props = &mut tool["inputSchema"]["properties"];
            props["status"] = json!({"enum":["new","confirmed","dismissed","fixed"]});
            props["include_resolved"] = json!({"type":"boolean","default":false});
            props["include_inactive"] = json!({"type":"boolean","default":false});
        }
        let name = tool["name"].as_str().expect("tool name is static");
        let destructive = matches!(name, "memory_forget" | "prepare_candidate_patch");
        let open_world = name == "prepare_candidate_patch";
        let (title, description) = tool_metadata(name)
            .unwrap_or_else(|| panic!("missing OpenAI metadata for tool {name}"));
        tool["title"] = json!(title);
        tool["description"] = json!(description);
        // All managed calls may refresh persistent indexes and session state.
        // Conservative hints describe actual behavior, not just source-file writes.
        tool["annotations"] =
            json!({"readOnlyHint":false,"destructiveHint":destructive,"openWorldHint":open_world});
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
            "Risks from a Git commit to the current working tree, including committed and uncommitted changes. base defaults to HEAD. Exact current revision/symbol/hash needed to verify tests.",
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
            "Retrieve task context. Defaults: BOUNDED, CALLS depth 1. Scope: path, paths or partial object. budget overrides budget_preset.",
        ),
        "search_graph" => (
            "Search symbols",
            "Find name/body tokens (include_body), or AST patterns with match_mode=ast (rust/typescript/python/go). Page via next_offset and expected_snapshot.",
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
        "get_quality_index_status" => (
            "Check background quality index",
            "Inspect background producer freshness, incremental file parse/reuse counts, resource bounds and errors without forcing a quality scan.",
        ),
        "update_quality_candidate_status" => (
            "Set finding status",
            "Persist user-reported new, confirmed, dismissed or fixed status with expected_version compare-and-swap. Dismissed/fixed require a reason. Decisions survive snapshot changes and changed content reopens findings. Use stable finding_id for inactive findings after a fix.",
        ),
        "list_quality_candidates" => (
            "List quality candidates",
            "List snapshot-bound duplicate, possible dead-code and hardcoded-literal candidates, with redacted values, global graph usage and bounded impact evidence. Coverage gaps and exhausted budgets are explicit.",
        ),
        "get_candidate_details" => (
            "Inspect a quality candidate",
            "Retrieve current evidence and graph context for an opaque candidate_id returned by list_quality_candidates. Reject IDs from stale snapshots.",
        ),
        "prepare_candidate_patch" => (
            "Prepare a review-only patch",
            "Prepare a source-hash-pinned TypeScript patch. run_project_checks=true runs trusted format/typecheck/tests from .cgrx/quality-checks.json on baseline and modified copies. Returns the formatted diff and stage results. Not a security sandbox; dependencies must exist. Secrets and dead-code deletion blocked.",
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
            "Check paths/scopes before graph claims; gaps need source inspection. Use paths or scopes, not status.paths_or_scope.",
        ),
        "check_framework_gates" => (
            "Check framework gates",
            "Detect scoped Django/FastAPI/Express usage; deterministic snapshot-bound pass, warning, fail or inconclusive gate.",
        ),
        "memory_update" => (
            "Update agent memory",
            "Complete replacement: fact <=4000 chars; preserve kind, task_id/event_id, privacy and source. Non-code: source_ref, no code fields. expected_version guards history. Reconcile cgrx.memory_write_uncertain before retrying.",
        ),
        "memory_forget" => (
            "Forget agent memory",
            "Tombstone all versions and search entries, checking expected_version. Append-only storage does not securely erase data. Reconcile cgrx.memory_write_uncertain by its ID and version before retrying.",
        ),
        "expand" => (
            "Expand context",
            "Expand a handle in the same repository and server session.",
        ),
        "status" => (
            "Check index status",
            "Revision, freshness and coverage. Recall useful prior context; save verified outcomes. Memory is worktree-local.",
        ),
        "memory_record" => (
            "Record agent memory",
            "Store facts <=4000 chars; details in source_ref. confidence:0..1000. Code:path/symbol; non-code:source_ref, no code fields. Working:task_id; episodes:event_id. Reconcile cgrx.memory_write_uncertain before retrying.",
        ),
        "memory_recall" => (
            "Recall agent memory",
            "Search multilingual memory; filter path/symbol. include_code gives verified source/selectors. budget_omitted counts hidden rows; minimum_budget fits first fact. Empty truncated results are inconclusive. id+include_history reads versions.",
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
