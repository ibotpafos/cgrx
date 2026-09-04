use cgrx_core::{Hash32, RepoSnapshot};
use cgrx_mcp::Server;
use serde_json::{Value, json};
use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};

fn snapshot() -> RepoSnapshot {
    RepoSnapshot {
        repo_revision: "abc123".to_owned(),
        working_tree_digest: Hash32([7; 32]),
        graph_generation: 9,
    }
}

fn dispatch(server: &mut Server, request: Value) -> Value {
    let frame = serde_json::to_string(&request).expect("request serializes");
    let response = server.dispatch_line(&frame);
    serde_json::from_str(&response).expect("response is one JSON frame")
}

#[test]
fn usage_log_records_only_metadata_for_tool_calls() {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock after epoch")
        .as_nanos();
    let path =
        std::env::temp_dir().join(format!("cgrx-usage-{}-{nonce}.jsonl", std::process::id()));
    let mut server = Server::new(snapshot());
    server.enable_usage_log(&path, "codex-test", "session-test");

    let response = dispatch(
        &mut server,
        json!({
            "jsonrpc":"2.0","id":1,"method":"tools/call",
            "params":{"name":"status","arguments":{"paths_or_scope":["secret/project/path"]}}
        }),
    );
    assert!(response.get("result").is_some());

    let contents = fs::read_to_string(&path).expect("usage log written");
    let rows: Vec<Value> = contents
        .lines()
        .map(|line| serde_json::from_str(line).expect("usage row is JSON"))
        .collect();
    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0]["event"], "tool_call");
    assert_eq!(rows[0]["tool"], "status");
    assert_eq!(rows[0]["client"], "codex-test");
    assert_eq!(rows[0]["session"], "session-test");
    assert_eq!(rows[0]["ok"], true);
    assert_eq!(rows[0]["repo_revision"], "abc123");
    assert!(rows[0]["latency_us"].as_u64().is_some());
    assert!(rows[0]["request_bytes"].as_u64().is_some());
    assert!(rows[0]["response_bytes"].as_u64().is_some());
    assert!(!contents.contains("secret/project/path"));
    assert!(!contents.contains("paths_or_scope"));
    fs::remove_file(path).expect("remove usage log");
}

#[test]
fn unwritable_usage_log_never_breaks_a_tool_call() {
    let mut server = Server::new(snapshot());
    server.enable_usage_log(std::env::temp_dir(), "codex-test", "session-test");
    let response = dispatch(
        &mut server,
        json!({
            "jsonrpc":"2.0","id":1,"method":"tools/call",
            "params":{"name":"status","arguments":{"paths_or_scope":["src/**"]}}
        }),
    );
    assert!(response.get("result").is_some(), "response: {response}");
}

#[test]
fn initialize_then_orient_returns_rcc_qbec_and_handles() {
    let mut server = Server::new(snapshot());
    let initialized = dispatch(
        &mut server,
        json!({"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}),
    );
    assert_eq!(initialized["jsonrpc"], "2.0");
    assert_eq!(initialized["id"], 1);
    assert_eq!(initialized["result"]["protocolVersion"], "2025-06-18");

    let oriented = dispatch(
        &mut server,
        json!({
            "jsonrpc":"2.0",
            "id":2,
            "method":"tools/call",
            "params":{
                "name":"orient",
                "arguments":{
                    "task":"find all charge callers",
                    "budget":320,
                    "mode":"BOUNDED",
                    "scope":{"include":["src/**"],"exclude":[],"relation_kinds":["CALLS"],"max_depth":4}
                }
            }
        }),
    );
    assert_eq!(oriented["jsonrpc"], "2.0");
    assert_eq!(oriented["id"], 2);
    let payload = &oriented["result"]["structuredContent"];
    assert_eq!(payload["rcc"]["capsule_version"], "rcc/1");
    assert_eq!(payload["qbec"]["certificate_version"], "qbec/1");
    assert!(
        payload["next_handles"]
            .as_array()
            .is_some_and(|v| !v.is_empty())
    );
    assert_eq!(payload["rcc"]["snapshot"], payload["qbec"]["snapshot"]);
    let visible = oriented["result"]["content"][0]["text"]
        .as_str()
        .expect("orient emits model-visible text");
    let compact: Value = serde_json::from_str(visible).expect("visible text is compact JSON");
    assert_eq!(compact["at"], "abc123@9");
    assert_eq!(compact["status"], "PARTIAL");
    assert_eq!(
        compact["cols"],
        json!(["path", "start", "end", "text", "provenance"])
    );
    assert_eq!(compact["records"], json!([]));
    assert!(compact.get("rcc").is_none());
    assert!(compact.get("qbec").is_none());
    assert!(
        visible.len() < 1_000,
        "visible orient bytes={}",
        visible.len()
    );
}

#[test]
fn unknown_handle_is_typed_error_not_empty_context() {
    let mut server = Server::new(snapshot());
    let response = dispatch(
        &mut server,
        json!({
            "jsonrpc":"2.0",
            "id":7,
            "method":"tools/call",
            "params":{"name":"expand","arguments":{"handle":"missing","budget":128}}
        }),
    );
    assert_eq!(response["error"]["code"], -32004);
    assert_eq!(response["error"]["data"]["code"], "cgrx.handle_not_found");
    assert!(response.get("result").is_none());
}

#[test]
fn initialized_notification_has_no_response_frame() {
    let mut server = Server::new(snapshot());
    let response = server
        .dispatch_line(r#"{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}"#);
    assert!(response.is_empty());
}

#[test]
fn issued_handle_expands_only_against_its_pinned_snapshot() {
    let mut server = Server::new(snapshot());
    let oriented = dispatch(
        &mut server,
        json!({
            "jsonrpc":"2.0","id":1,"method":"tools/call",
            "params":{"name":"orient","arguments":{
                "task":"find charge","budget":320,"mode":"BOUNDED",
                "scope":{"include":["src/**"],"exclude":[],"relation_kinds":["CALLS"],"max_depth":4}
            }}
        }),
    );
    let handle = oriented["result"]["structuredContent"]["next_handles"][0]
        .as_str()
        .expect("orient emits a handle");
    let expanded = dispatch(
        &mut server,
        json!({
            "jsonrpc":"2.0","id":2,"method":"tools/call",
            "params":{"name":"expand","arguments":{"handle":handle,"budget":64}}
        }),
    );
    assert_eq!(
        expanded["result"]["structuredContent"]["status"],
        "NO_EXTRA_CONTEXT"
    );
    assert_eq!(
        expanded["result"]["structuredContent"]["snapshot"],
        serde_json::to_value(snapshot()).unwrap()
    );
}

#[test]
fn handle_rejects_a_different_graph_generation_with_same_source_digest() {
    let mut original = Server::new(snapshot());
    let oriented = dispatch(
        &mut original,
        json!({
            "jsonrpc":"2.0","id":1,"method":"tools/call",
            "params":{"name":"orient","arguments":{
                "task":"find charge","budget":320,"mode":"BOUNDED",
                "scope":{"include":["src/**"],"exclude":[],"relation_kinds":["CALLS"],"max_depth":4}
            }}
        }),
    );
    let handle = oriented["result"]["structuredContent"]["next_handles"][0]
        .as_str()
        .unwrap();
    let mut changed = snapshot();
    changed.graph_generation += 1;
    let mut other = Server::new(changed);
    let response = dispatch(
        &mut other,
        json!({
            "jsonrpc":"2.0","id":2,"method":"tools/call",
            "params":{"name":"expand","arguments":{"handle":handle,"budget":64}}
        }),
    );
    assert_eq!(response["error"]["data"]["code"], "cgrx.handle_not_found");
}

#[test]
fn status_reports_pinned_freshness_and_explicit_coverage_gap() {
    let mut server = Server::new(snapshot());
    let response = dispatch(
        &mut server,
        json!({
            "jsonrpc":"2.0","id":3,"method":"tools/call",
            "params":{"name":"status","arguments":{"paths_or_scope":["src/**"]}}
        }),
    );
    let payload = &response["result"]["structuredContent"];
    assert_eq!(payload["freshness"], "PINNED");
    assert_eq!(
        payload["coverage_gaps"][0]["code"],
        "INDEX_ADAPTER_NOT_CONNECTED"
    );
}

#[test]
fn tools_list_advertises_bounded_graph_search_and_trace() {
    let mut server = Server::new(snapshot());
    let response = dispatch(
        &mut server,
        json!({"jsonrpc":"2.0","id":4,"method":"tools/list","params":{}}),
    );
    let names: Vec<_> = response["result"]["tools"]
        .as_array()
        .expect("tools array")
        .iter()
        .filter_map(|tool| tool["name"].as_str())
        .collect();

    assert!(names.contains(&"search_graph"), "tools: {names:?}");
    assert!(names.contains(&"trace_path"), "tools: {names:?}");
    assert!(names.contains(&"get_code_snippet"), "tools: {names:?}");
    assert!(names.contains(&"check_index_coverage"), "tools: {names:?}");
}

#[test]
fn tools_list_documents_the_exact_scope_contract() {
    let mut server = Server::new(snapshot());
    let response = dispatch(
        &mut server,
        json!({"jsonrpc":"2.0","id":9,"method":"tools/list","params":{}}),
    );
    let tools = response["result"]["tools"].as_array().expect("tools array");

    let orient = tools
        .iter()
        .find(|tool| tool["name"] == "orient")
        .expect("orient schema");
    assert_eq!(
        orient["inputSchema"]["properties"]["scope"]["properties"]["relation_kinds"]["items"]["enum"],
        json!(["CALLS", "IMPLEMENTS"])
    );
    assert_eq!(
        orient["inputSchema"]["properties"]["scope"]["required"],
        json!(["include", "exclude", "relation_kinds", "max_depth"])
    );

    for name in ["search_graph", "trace_path"] {
        let tool = tools
            .iter()
            .find(|tool| tool["name"] == name)
            .expect("graph tool schema");
        let scope = &tool["inputSchema"]["properties"]["scope"];
        assert_eq!(scope["anyOf"][0]["type"], "string");
        assert_eq!(scope["anyOf"][1]["items"]["type"], "string");
        assert_eq!(
            scope["anyOf"][2]["properties"]["relation_kinds"]["items"]["enum"],
            json!(["CALLS", "IMPLEMENTS"])
        );
    }
}

#[test]
fn graph_tools_without_a_backend_return_a_typed_adapter_error() {
    let mut server = Server::new(snapshot());
    let searched = dispatch(
        &mut server,
        json!({
            "jsonrpc":"2.0","id":5,"method":"tools/call",
            "params":{"name":"search_graph","arguments":{"query":"target"}}
        }),
    );
    let traced = dispatch(
        &mut server,
        json!({
            "jsonrpc":"2.0","id":6,"method":"tools/call",
            "params":{"name":"trace_path","arguments":{"symbol":"target"}}
        }),
    );
    let snippet = dispatch(
        &mut server,
        json!({
            "jsonrpc":"2.0","id":7,"method":"tools/call",
            "params":{"name":"get_code_snippet","arguments":{"symbol":"target"}}
        }),
    );
    let coverage = dispatch(
        &mut server,
        json!({
            "jsonrpc":"2.0","id":8,"method":"tools/call",
            "params":{"name":"check_index_coverage","arguments":{"paths":["src/lib.rs"]}}
        }),
    );

    assert_eq!(
        searched["error"]["data"]["code"],
        "cgrx.index_adapter_not_connected"
    );
    assert_eq!(
        traced["error"]["data"]["code"],
        "cgrx.index_adapter_not_connected"
    );
    assert_eq!(
        snippet["error"]["data"]["code"],
        "cgrx.index_adapter_not_connected"
    );
    assert_eq!(
        coverage["error"]["data"]["code"],
        "cgrx.index_adapter_not_connected"
    );
}

#[test]
fn initialize_advertises_compact_evidence_workflow() {
    let mut server = Server::new(snapshot());
    let response = dispatch(
        &mut server,
        json!({
            "jsonrpc":"2.0", "id":1, "method":"initialize",
            "params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1"}}
        }),
    );
    let instructions = response["result"]["instructions"].as_str().unwrap();
    assert!(instructions.starts_with("Use status first"));
    assert!(instructions.len() <= 512);
    assert!(instructions.contains("coverage"));
    assert!(instructions.contains("repo"));
}
