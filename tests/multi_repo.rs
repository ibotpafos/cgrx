use cgrx_capsule::Tokenizer;
use serde_json::{Value, json};
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};

struct Dir(PathBuf);
impl Dir {
    fn new() -> Self {
        static NEXT: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
        let unique = NEXT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let n = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let p =
            std::env::temp_dir().join(format!("cgrx-multi-{}-{n}-{unique}", std::process::id()));
        fs::create_dir_all(&p).unwrap();
        Self(p.canonicalize().unwrap())
    }
    fn repo(&self, name: &str, source: &str) -> PathBuf {
        let p = self.0.join(name);
        fs::create_dir(&p).unwrap();
        git(&p, &["init", "-q"]);
        fs::write(p.join("main.rs"), source).unwrap();
        git(&p, &["add", "."]);
        git(&p, &["commit", "-qm", "fixture"]);
        p
    }
}
impl Drop for Dir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}
fn git(root: &Path, args: &[&str]) {
    assert!(
        Command::new("git")
            .args([
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid"
            ])
            .args(args)
            .current_dir(root)
            .output()
            .unwrap()
            .status
            .success()
    );
}
fn git_output(root: &Path, args: &[&str]) -> Vec<u8> {
    let output = Command::new("git")
        .args(args)
        .current_dir(root)
        .output()
        .unwrap();
    assert!(output.status.success(), "{output:?}");
    output.stdout
}
fn git_revision(root: &Path, revision: &str) -> String {
    String::from_utf8(git_output(root, &["rev-parse", revision]))
        .unwrap()
        .trim()
        .to_owned()
}
struct Mcp {
    child: Child,
    input: ChildStdin,
    output: BufReader<ChildStdout>,
}
impl Mcp {
    fn new(cwd: &Path, cap: &str, log: &Path) -> Self {
        Self::with_embeddings(cwd, cap, log, "off", None)
    }
    fn with_embeddings(
        cwd: &Path,
        cap: &str,
        log: &Path,
        mode: &str,
        cache: Option<&Path>,
    ) -> Self {
        let mut command = Command::new(env!("CARGO_BIN_EXE_cgrx"));
        command
            .args([
                "serve",
                "--multi-repo",
                "--max-repos",
                cap,
                "--response-profile",
                "full",
            ])
            .current_dir(cwd)
            .env("CGRX_USAGE_LOG", log)
            .env("CGRX_CLIENT", "test")
            .env("CGRX_USAGE_SESSION", "test-session")
            .env("CGRX_MEMORY_EMBEDDINGS", mode)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null());
        if let Some(cache) = cache {
            command.env("CGRX_MEMORY_MODEL_CACHE", cache);
        }
        let mut child = command.spawn().unwrap();
        let input = child.stdin.take().unwrap();
        let output = BufReader::new(child.stdout.take().unwrap());
        Self {
            child,
            input,
            output,
        }
    }
    fn rpc(&mut self, method: &str, params: Value) -> Value {
        writeln!(
            self.input,
            "{}",
            json!({"jsonrpc":"2.0","id":1,"method":method,"params":params})
        )
        .unwrap();
        self.input.flush().unwrap();
        let mut s = String::new();
        self.output.read_line(&mut s).unwrap();
        assert!(
            !s.is_empty(),
            "multi-repo server must remain running and respond"
        );
        serde_json::from_str(&s).unwrap()
    }
    fn tool(&mut self, name: &str, args: Value) -> Value {
        self.rpc("tools/call", json!({"name":name,"arguments":args}))
    }
}
impl Drop for Mcp {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}
fn snippet(m: &mut Mcp, repo: &Path) -> Value {
    m.tool("get_code_snippet", json!({"repo":repo,"symbol":"Same"}))
}
fn orient(m: &mut Mcp, repo: &Path) -> Value {
    m.tool("orient",json!({"repo":repo,"task":"Same","budget":1,"mode":"PRECISE","scope":{"include":["main.rs"],"exclude":[],"relation_kinds":["CALLS"],"max_depth":1}}))
}
fn handle(v: &Value) -> String {
    v["result"]["structuredContent"]["next_handles"][0]
        .as_str()
        .unwrap_or_else(|| panic!("missing handle: {v}"))
        .to_owned()
}
fn error(v: &Value, code: &str) {
    assert_eq!(v["error"]["data"]["code"], code, "{v}");
}
#[test]
fn empty_semantic_memory_recall_works_without_a_usable_model_cache() {
    let d = Dir::new();
    let repo = d.repo("empty-memory", "fn main() {}\n");
    let blocked_cache = d.0.join("model-cache-is-a-file");
    fs::write(&blocked_cache, "not a cache directory").unwrap();
    let mut m = Mcp::with_embeddings(&d.0, "1", &d.0.join("log"), "on", Some(&blocked_cache));
    let response = m.tool(
        "memory_recall",
        json!({"repo":repo,"query":"previous parser decisions"}),
    );
    assert!(response.get("result").is_some(), "{response}");
    let recalled = &response["result"]["structuredContent"];
    assert_eq!(recalled["results"], json!([]));
    assert_eq!(recalled["search_mode"], "hybrid");
    assert_eq!(recalled["truncated"], false);
    assert_eq!(
        fs::read_to_string(blocked_cache).unwrap(),
        "not a cache directory"
    );
}
#[test]
fn filtered_expired_and_hidden_stale_recall_skip_unusable_model_cache() {
    use cgrx_store::{
        AgentMemoryInput, MemoryKind, MemoryProvenance, MemoryRecordInput, MemorySourceKind,
        MemoryStore,
    };
    let d = Dir::new();
    let repo = d.repo("filtered-memory", "fn parse() {}\n");
    let log = d.0.join("filtered-usage.jsonl");
    let mut offline = Mcp::new(&d.0, "1", &log);
    let written = offline.tool(
        "memory_record",
        json!({"repo":repo,"path":"main.rs","fact":"Drop obsolete parser state","confidence":800}),
    );
    let id = written["result"]["structuredContent"]["record"]["id"]
        .as_str()
        .unwrap()
        .to_owned();
    drop(offline);
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos() as u64;
    let store = MemoryStore::open_lexical(&repo).unwrap();
    store
        .agent_record(
            &AgentMemoryInput {
                decision: MemoryRecordInput {
                    fact: "Expired task checkpoint".to_owned(),
                    confidence: 900,
                    provenance: MemoryProvenance {
                        repo: repo.to_string_lossy().into_owned(),
                        rev: "past-revision".to_owned(),
                        path: String::new(),
                        span: None,
                    },
                    valid_until_unix_nanos: Some(now - 1),
                    privacy_tag: None,
                },
                memory_kind: MemoryKind::Working,
                source_kind: MemorySourceKind::Agent,
                source_ref: Some("earlier task checkpoint".to_owned()),
                task_id: Some("expired-task".to_owned()),
                event_id: None,
                code_link: None,
            },
            now - 1_000_000_000,
        )
        .unwrap();
    let blocked_cache = d.0.join("blocked-model-cache");
    fs::write(&blocked_cache, "not a cache directory").unwrap();
    let mut m = Mcp::with_embeddings(&d.0, "1", &log, "on", Some(&blocked_cache));
    for filter in [
        json!({"privacy_tag":"no-matching-tag"}),
        json!({"min_confidence":1000}),
        json!({"memory_kind":"working"}),
        json!({"task_id":"expired-task"}),
        json!({"revision":"past-revision"}),
        json!({"path":"missing.rs"}),
        json!({"symbol":"no-matching-symbol"}),
    ] {
        let mut arguments = json!({"repo":repo,"query":"parser decisions"});
        arguments
            .as_object_mut()
            .unwrap()
            .extend(filter.as_object().unwrap().clone());
        let response = m.tool("memory_recall", arguments);
        assert!(response.get("result").is_some(), "{response}");
        assert_eq!(
            response["result"]["structuredContent"]["results"],
            json!([])
        );
        assert_eq!(
            response["result"]["structuredContent"]["search_mode"],
            "hybrid"
        );
        assert_eq!(response["result"]["structuredContent"]["truncated"], false);
    }
    fs::write(repo.join("main.rs"), "fn parse() { let changed = 1; }\n").unwrap();
    let hidden = m.tool(
        "memory_recall",
        json!({"repo":repo,"query":"parser decisions"}),
    );
    assert_eq!(
        hidden["result"]["structuredContent"]["results"],
        json!([]),
        "{hidden}"
    );
    let stale = m.tool(
        "memory_recall",
        json!({"repo":repo,"id":id,"include_stale":true,"include_code":true,"path":"main.rs"}),
    );
    assert_eq!(
        stale["result"]["structuredContent"]["results"][0]["code"]["status"],
        "needs_review"
    );
    assert_eq!(
        fs::read_to_string(blocked_cache).unwrap(),
        "not a cache directory"
    );
}

#[test]
fn multi_repo_lazy_schema_and_notifications() {
    let d = Dir::new();
    let mut m = Mcp::new(&d.0, "4", &d.0.join("log"));
    writeln!(
        m.input,
        "{}",
        json!({"jsonrpc":"2.0","method":"notifications/initialized"})
    )
    .unwrap();
    assert_eq!(
        m.rpc("initialize", json!({}))["result"]["serverInfo"]["name"],
        "cgrx"
    );
    let r = m.rpc("tools/list", json!({}));
    let ts = r["result"]["tools"].as_array().unwrap();
    assert_eq!(ts.len(), 28);
    for name in [
        "list_quality_candidates",
        "get_candidate_details",
        "prepare_candidate_patch",
    ] {
        assert!(ts.iter().any(|t| t["name"] == name));
    }
    for t in ts {
        assert!(
            t["inputSchema"]["required"]
                .as_array()
                .unwrap()
                .contains(&json!("repo"))
        );
    }
    assert!(!d.0.join(".git").exists());
}

#[test]
fn multi_repo_refactor_payload_tokens_cover_decorated_response() {
    let d = Dir::new();
    let repo = d.repo(
        "refactors",
        "fn save(value: i32) {}\nfn first(input: i32) -> i32 { let prepared = input + 1; save(prepared); prepared }\nfn second(value: i32) -> i32 { let output = value + 9; save(output); output }\n",
    );
    let mut m = Mcp::new(&d.0, "1", &d.0.join("log"));
    let response = m.tool(
        "suggest_refactors",
        json!({"repo":repo,"scope":"main.rs","language":"rust"}),
    );
    assert!(response.get("result").is_some(), "{response}");
    let mut visible: Value = serde_json::from_str(
        response["result"]["content"][0]["text"]
            .as_str()
            .expect("visible text"),
    )
    .expect("visible JSON");
    let reported = visible["payload_tokens"].as_u64().unwrap();
    visible.as_object_mut().unwrap().remove("payload_tokens");
    let expected = Tokenizer::o200k_base()
        .unwrap()
        .count(&serde_json::to_string(&visible).unwrap());
    assert_eq!(reported, u64::from(expected));
}

#[test]
fn multi_repo_architecture_returns_snapshot_bound_package_projection() {
    let d = Dir::new();
    let repo = d.repo(
        "architecture",
        "fn target() {}\nfn caller() { target(); }\n",
    );
    let mut m = Mcp::new(&d.0, "1", &d.0.join("log"));
    let response = m.tool(
        "get_architecture",
        json!({"repo":repo,"scope":"**","package_depth":1,"limit":20,"offset":0}),
    );
    assert!(response.get("result").is_some(), "{response}");
    let payload = &response["result"]["structuredContent"];
    let compact: Value = serde_json::from_str(
        response["result"]["content"][0]["text"]
            .as_str()
            .expect("compact architecture text"),
    )
    .expect("compact architecture JSON");
    assert!(payload["snapshot"]["repo_revision"].is_string());
    assert_eq!(payload["page"]["offset"], 0);
    assert_eq!(compact["page"]["offset"], 0);
    assert_eq!(
        payload["relation_kinds"],
        json!(["CALLS", "IMPLEMENTS", "IMPORTS", "REFERENCES"])
    );
    assert_eq!(payload["packages"][0]["name"], ".");
    assert_eq!(payload["packages"][0]["symbols"], 2);
    assert_eq!(payload["partial"], false);

    let next = m.tool(
        "get_architecture",
        json!({"repo":repo,"scope":"**","package_depth":1,"limit":1,"offset":1}),
    );
    let next_payload = &next["result"]["structuredContent"];
    assert_eq!(next_payload["snapshot"], payload["snapshot"]);
    assert_eq!(next_payload["page"]["offset"], 1);
    assert_eq!(next_payload["page"]["limit"], 1);
    assert!(next_payload["packages"].as_array().unwrap().is_empty());
}

#[test]
fn multi_repo_memory_survives_eviction_restart_and_checks_current_sources() {
    let d = Dir::new();
    let a = d.repo("memory-a", "fn parse() {}\n");
    let b = d.repo("memory-b", "fn parse() {}\n");
    let log = d.0.join("memory-usage.jsonl");
    let mut m = Mcp::new(&d.0, "1", &log);
    let fact = "Invalidate the private-parser cache after editing source";
    let first = m.tool(
        "memory_record",
        json!({"repo":a,"path":"main.rs",
        "fact":fact,"confidence":800}),
    );
    let record = &first["result"]["structuredContent"]["record"];
    let id = record["id"]
        .as_str()
        .unwrap_or_else(|| panic!("{first}"))
        .to_owned();
    let original_rev = record["provenance"]["rev"].clone();
    let second = m.tool(
        "memory_record",
        json!({"repo":b,"path":"main.rs",
        "fact":fact,"confidence":800}),
    );
    assert_ne!(second["result"]["structuredContent"]["record"]["id"], id);
    assert!(a.join(".cgrx/memory/agent.mv2").is_file());
    assert!(b.join(".cgrx/memory/agent.mv2").is_file());
    let recalled = m.tool("memory_recall", json!({"repo":a,"query":"parser cache"}));
    assert_eq!(
        recalled["result"]["structuredContent"]["results"][0]["id"],
        id
    );
    drop(m);
    let mut m = Mcp::new(&d.0, "1", &log);
    fs::write(a.join("unrelated.txt"), "unrelated change\n").unwrap();
    git(&a, &["add", "unrelated.txt"]);
    git(&a, &["commit", "-qm", "unrelated source"]);
    let unchanged = m.tool("memory_recall", json!({"repo":a,"id":id}));
    assert_eq!(
        unchanged["result"]["structuredContent"]["results"][0]["freshness"],
        "unchanged"
    );
    assert_ne!(
        unchanged["result"]["structuredContent"]["snapshot"]["repo_revision"],
        original_rev
    );
    fs::write(a.join("main.rs"), "fn parse() { panic!() }\n").unwrap();
    let stale = m.tool("memory_recall", json!({"repo":a,"id":id}));
    assert!(
        stale["result"]["structuredContent"]["results"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    let review = m.tool(
        "memory_recall",
        json!({"repo":a,"id":id,"include_stale":true}),
    );
    assert_eq!(
        review["result"]["structuredContent"]["results"][0]["freshness"],
        "needs_review"
    );
    let foreign = m.tool("memory_update", json!({"repo":a,"id":id,"expected_version":1,
        "reason":"foreign write","record":{"repo":b,"path":"main.rs","fact":"foreign","confidence":800}}));
    error(&foreign, "cgrx.invalid_repository");
    git(&a, &["add", "main.rs"]);
    git(&a, &["commit", "-qm", "update parser"]);
    let updated = m.tool(
        "memory_update",
        json!({"repo":a,"id":id,"expected_version":1,
        "reason":"checked changed source","record":{"path":"main.rs",
            "fact":"Parser now raises an error","confidence":800}}),
    );
    let payload = &updated["result"]["structuredContent"];
    assert_eq!(payload["record"]["version"], 2, "{updated}");
    assert_eq!(
        payload["record"]["provenance"]["rev"],
        payload["snapshot"]["repo_revision"]
    );
    assert_ne!(payload["record"]["provenance"]["rev"], original_rev);
    error(
        &m.tool(
            "memory_forget",
            json!({"repo":a,"id":id,"expected_version":1}),
        ),
        "cgrx.memory_conflict",
    );
    let forgotten = m.tool(
        "memory_forget",
        json!({"repo":a,"id":id,"expected_version":2}),
    );
    assert_eq!(
        forgotten["result"]["structuredContent"]["removed_versions"],
        2
    );
    drop(m);
    let mut m = Mcp::new(&d.0, "1", &log);
    let empty = m.tool(
        "memory_recall",
        json!({"repo":a,"id":id,"include_history":true}),
    );
    assert!(
        empty["result"]["structuredContent"]["results"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    let isolated = m.tool("memory_recall", json!({"repo":b}));
    assert_eq!(
        isolated["result"]["structuredContent"]["results"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    let logged = fs::read_to_string(log).unwrap();
    assert!(logged.contains("memory_update"));
    assert!(!logged.contains("private-parser"));
    assert!(!logged.contains("checked changed source"));
    assert!(!logged.contains(&id));
}

#[test]
fn memory_links_select_exact_code_and_survive_unrelated_revisions() {
    let d = Dir::new();
    let original = "struct A;\nimpl A {\n    fn parse() -> i32 { 11 }\n}\nstruct B;\nimpl B {\n    fn parse() -> i32 { 22 }\n}\n";
    let repo = d.repo("linked-memory", original);
    let log = d.0.join("linked-usage.jsonl");
    let mut m = Mcp::new(&d.0, "1", &log);
    let fact = "Reset cached parser state after source edits";
    error(
        &m.tool(
            "memory_record",
            json!({"repo":repo,"symbol":"parse","path":"main.rs","fact":fact,"confidence":800}),
        ),
        "cgrx.ambiguous_symbol",
    );
    let found = m.tool(
        "search_graph",
        json!({"repo":repo,"query":"parse","scope":"main.rs","limit":10}),
    );
    let matches = found["result"]["structuredContent"]["matches"]
        .as_array()
        .unwrap();
    assert_eq!(matches.len(), 2, "{found}");
    let chosen = &matches[1];
    let reference = chosen["symbol_ref"].as_str().unwrap();
    let selected = m.tool(
        "get_code_snippet",
        json!({"repo":repo,"symbol":chosen["symbol"],"path":"main.rs","symbol_ref":reference}),
    );
    let selected_source = selected["result"]["structuredContent"]["source"]
        .as_str()
        .unwrap();
    let written = m.tool("memory_record", json!({"repo":repo,"symbol":chosen["symbol"],"symbol_ref":reference,"path":"main.rs","fact":fact,"confidence":800}));
    let record = &written["result"]["structuredContent"]["record"];
    let id = record["id"]
        .as_str()
        .unwrap_or_else(|| panic!("{written}"))
        .to_owned();
    assert_eq!(record["code_link"]["symbol"], chosen["symbol"]);
    let recalled = m.tool(
        "memory_recall",
        json!({"repo":repo,"query":"parser state","include_code":true,"budget":4000}),
    );
    let hit = &recalled["result"]["structuredContent"]["results"][0];
    assert_eq!(hit["id"], id);
    assert_eq!(hit["code"]["status"], "available");
    assert_eq!(hit["code"]["source"], selected_source);
    assert_eq!(hit["code"]["symbol_ref"], reference);
    assert!(hit["code_link"].get("symbol_ref").is_none());
    let compact: Value =
        serde_json::from_str(recalled["result"]["content"][0]["text"].as_str().unwrap()).unwrap();
    let code_col = compact["cols"]
        .as_array()
        .unwrap()
        .iter()
        .position(|col| col == "code")
        .unwrap();
    assert_eq!(compact["rows"][0][code_col]["source"], selected_source);
    assert_eq!(compact["rows"][0][code_col]["symbol_ref"], reference);
    let filtered = m.tool("memory_recall", json!({"repo":repo,"path":"main.rs","symbol":chosen["symbol"],"include_code":true,"limit":1,"budget":4000}));
    assert_eq!(
        filtered["result"]["structuredContent"]["results"][0]["id"],
        id
    );
    drop(m);
    fs::write(repo.join("notes.txt"), "unrelated revision\n").unwrap();
    git(&repo, &["add", "notes.txt"]);
    git(&repo, &["commit", "-qm", "unrelated"]);
    let mut m = Mcp::new(&d.0, "1", &log);
    let restarted = m.tool(
        "memory_recall",
        json!({"repo":repo,"id":id,"include_code":true,"budget":4000}),
    );
    assert_eq!(
        restarted["result"]["structuredContent"]["results"][0]["code"]["source"],
        selected_source
    );
    let code = &restarted["result"]["structuredContent"]["results"][0]["code"];
    let current_ref = code["symbol_ref"].as_str().unwrap();
    assert_ne!(current_ref, reference);
    let followup =
        json!({"repo":repo,"symbol":code["symbol"],"path":code["path"],"symbol_ref":current_ref});
    let snippet = m.tool("get_code_snippet", followup.clone());
    assert_eq!(
        snippet["result"]["structuredContent"]["source"],
        selected_source
    );
    let traced = m.tool("trace_path", followup.clone());
    assert_eq!(
        traced["result"]["structuredContent"]["root"]["symbol_ref"],
        current_ref
    );
    let usages = m.tool("find_usages", followup);
    assert_eq!(
        usages["result"]["structuredContent"]["target"]["symbol_ref"],
        current_ref
    );
    fs::write(
        repo.join("main.rs"),
        original.replace("22", "33").replace("11", "44"),
    )
    .unwrap();
    let stale = m.tool(
        "memory_recall",
        json!({"repo":repo,"id":id,"include_stale":true,"include_code":true,"budget":4000}),
    );
    let stale_hit = &stale["result"]["structuredContent"]["results"][0];
    assert_eq!(stale_hit["code"]["status"], "needs_review");
    assert!(stale_hit["code"].get("source").is_none());
    assert!(stale_hit["code"].get("symbol_ref").is_none());
    let candidates = stale_hit["code"]["candidates"].as_array().unwrap();
    assert_eq!(candidates.len(), 2);
    assert_eq!(stale_hit["code"]["candidates_truncated"], false);
    assert_ne!(candidates[0]["symbol_ref"], candidates[1]["symbol_ref"]);
    for candidate in candidates {
        assert_eq!(candidate["match_kind"], "same_path");
        let snippet = m.tool("get_code_snippet", json!({"repo":repo,
            "symbol":candidate["symbol"],"path":candidate["path"],"symbol_ref":candidate["symbol_ref"]}));
        let source = snippet["result"]["structuredContent"]["source"]
            .as_str()
            .unwrap();
        assert!(source.contains("33") || source.contains("44"));
    }
    error(&m.tool("memory_update", json!({"repo":repo,"id":id,"expected_version":1,"reason":"recheck","record":{"symbol":chosen["symbol"],"symbol_ref":reference,"path":"main.rs","fact":fact,"confidence":800}})), "cgrx.symbol_ref_not_found");
    let fresh = m.tool(
        "search_graph",
        json!({"repo":repo,"query":"parse","scope":"main.rs","limit":10}),
    );
    let fresh_match = &fresh["result"]["structuredContent"]["matches"][1];
    let updated = m.tool("memory_update", json!({"repo":repo,"id":id,"expected_version":1,"reason":"verified changed source","record":{"symbol":fresh_match["symbol"],"symbol_ref":fresh_match["symbol_ref"],"path":"main.rs","fact":fact,"confidence":900}}));
    assert_eq!(
        updated["result"]["structuredContent"]["record"]["version"], 2,
        "{updated}"
    );
    let history = m.tool("memory_recall", json!({"repo":repo,"id":id,"include_history":true,"include_stale":true,"include_code":true,"budget":8000}));
    let history = history["result"]["structuredContent"]["results"]
        .as_array()
        .unwrap();
    assert_eq!(history.len(), 2);
    assert_eq!(
        history
            .iter()
            .filter(|hit| hit["code"]["status"] == "available")
            .count(),
        1
    );
    assert_eq!(
        history
            .iter()
            .filter(|hit| hit["code"].get("source").is_none())
            .count(),
        1
    );
    let bounded = m.tool(
        "memory_recall",
        json!({"repo":repo,"include_code":true,"budget":256}),
    );
    let bounded = &bounded["result"]["structuredContent"];
    assert!(Tokenizer::o200k_base().unwrap().count(&bounded.to_string()) < 300);
    let logged = fs::read_to_string(log).unwrap();
    assert!(!logged.contains(fact));
    assert!(!logged.contains(reference));
    assert!(!logged.contains(selected_source));
}

#[test]
fn stale_memory_suggests_bounded_current_candidates_for_moved_code() {
    let d = Dir::new();
    let original = "fn recover() -> i32 { 7 }\n";
    let repo = d.repo("memory-moved", original);
    let log = d.0.join("moved-usage.jsonl");
    let mut m = Mcp::new(&d.0, "1", &log);
    let saved = m.tool(
        "memory_record",
        json!({"repo":repo,"path":"main.rs",
        "symbol":"recover","fact":"Recover the parser after a failed update", "confidence":800}),
    );
    let record = &saved["result"]["structuredContent"]["record"];
    let id = record["id"].as_str().unwrap();
    fs::rename(repo.join("main.rs"), repo.join("moved.rs")).unwrap();
    let moved = m.tool(
        "memory_recall",
        json!({"repo":repo,"id":id,
        "include_stale":true,"include_code":true,"budget":4000}),
    );
    let hit = &moved["result"]["structuredContent"]["results"][0];
    assert_eq!(hit["freshness"], "needs_review");
    assert_eq!(hit["version"], 1);
    assert_eq!(hit["provenance"]["path"], "main.rs");
    assert!(hit["code"].get("source").is_none());
    assert!(hit["code"].get("symbol_ref").is_none());
    let candidates = hit["code"]["candidates"].as_array().unwrap();
    assert_eq!(candidates.len(), 1);
    let candidate = &candidates[0];
    assert_eq!(candidate["path"], "moved.rs");
    assert_eq!(candidate["match_kind"], "other_path");
    let snippet = m.tool(
        "get_code_snippet",
        json!({"repo":repo,"symbol":candidate["symbol"],
        "path":candidate["path"],"symbol_ref":candidate["symbol_ref"]}),
    );
    assert_eq!(
        snippet["result"]["structuredContent"]["source"]
            .as_str()
            .unwrap()
            .trim(),
        original.trim()
    );
    // A candidate is only a navigation hint: ordinary recall still hides the stale assertion.
    let hidden = m.tool(
        "memory_recall",
        json!({"repo":repo,"id":id,"include_code":true}),
    );
    assert!(
        hidden["result"]["structuredContent"]["results"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    for i in 0..7 {
        fs::write(
            repo.join(format!("candidate-{i}.rs")),
            format!("fn recover() -> i32 {{ {i} }}\n"),
        )
        .unwrap();
    }
    let many = m.tool(
        "memory_recall",
        json!({"repo":repo,"id":id,
        "include_stale":true,"include_code":true,"budget":6000}),
    );
    let code = &many["result"]["structuredContent"]["results"][0]["code"];
    assert_eq!(code["candidates"].as_array().unwrap().len(), 5);
    assert_eq!(code["candidates_truncated"], true);
    let compact: Value =
        serde_json::from_str(many["result"]["content"][0]["text"].as_str().unwrap()).unwrap();
    let code_col = compact["cols"]
        .as_array()
        .unwrap()
        .iter()
        .position(|col| col == "code")
        .unwrap();
    assert_eq!(compact["rows"][0][code_col], *code);
    let bounded = m.tool(
        "memory_recall",
        json!({"repo":repo,"id":id,
        "include_stale":true,"include_code":true,"budget":512}),
    );
    let bounded = &bounded["result"]["structuredContent"];
    assert_eq!(bounded["results"].as_array().unwrap().len(), 1, "{bounded}");
    assert_eq!(bounded["results"][0]["fact"], record["fact"]);
    assert_eq!(bounded["truncated"], true);
    // The recall budget precedes the multi-repo routing envelope.
    let mut payload = bounded.clone();
    for key in ["repo", "repo_id"] {
        payload.as_object_mut().unwrap().remove(key);
    }
    assert!(Tokenizer::o200k_base().unwrap().count(&payload.to_string()) <= 512);
    fs::write(repo.join("moved.rs"), "fn Recover() -> i32 { 7 }\n").unwrap();
    for i in 0..7 {
        fs::remove_file(repo.join(format!("candidate-{i}.rs"))).unwrap();
    }
    let missing = m.tool(
        "memory_recall",
        json!({"repo":repo,"id":id,
        "include_stale":true,"include_code":true,"budget":4000}),
    );
    let code = &missing["result"]["structuredContent"]["results"][0]["code"];
    assert_eq!(code["status"], "needs_review");
    assert!(
        code.get("candidates").is_none(),
        "a different case must not match: {code}"
    );
    let logged = fs::read_to_string(log).unwrap();
    assert!(!logged.contains(id));
    assert!(!logged.contains(candidate["symbol_ref"].as_str().unwrap()));
    assert!(!logged.contains("Recover the parser after a failed update"));
}

#[test]
fn multi_repo_invalid_flags() {
    let d = Dir::new();
    for args in [
        vec!["serve", "--multi-repo", "--root", "."],
        vec!["serve", "--max-repos", "2"],
        vec!["serve", "--multi-repo", "--max-repos", "0"],
        vec!["serve", "--multi-repo", "--max-repos", "17"],
        vec!["serve", "--multi-repo", "--max-repos"],
        vec!["serve", "--multi-repo", "--wat"],
    ] {
        let r = Command::new(env!("CARGO_BIN_EXE_cgrx"))
            .args(args)
            .current_dir(&d.0)
            .stdin(Stdio::null())
            .output()
            .unwrap();
        assert_eq!(r.status.code(), Some(2));
    }
}

#[test]
fn multi_repo_defaults_to_token_efficient_responses() {
    let directory = Dir::new();
    let mut child = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["serve", "--multi-repo"])
        .current_dir(&directory.0)
        .env_remove("CGRX_RESPONSE_PROFILE")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    writeln!(
        child.stdin.take().unwrap(),
        "{}",
        json!({"jsonrpc":"2.0","id":1,"method":"initialize","params":{}})
    )
    .unwrap();
    let output = child.wait_with_output().unwrap();
    assert!(output.status.success());
    let response: Value = serde_json::from_slice(&output.stdout).unwrap();
    assert!(
        response["result"]["instructions"]
            .as_str()
            .is_some_and(|instructions| instructions.contains("response profile: token-efficient"))
    );
}
#[test]
fn multi_repo_isolation_identity_errors_and_privacy() {
    let d = Dir::new();
    let a = d.repo("А repo", "fn Same() -> u32 { 111 }\n");
    let b = d.repo("B", "fn Same() -> u32 { 222 }\n");
    let log = d.0.join("usage.jsonl");
    let mut m = Mcp::new(&d.0, "4", &log);
    for (p, yes, no) in [(&a, "111", "222"), (&b, "222", "111"), (&a, "111", "222")] {
        let v = snippet(&mut m, p);
        assert!(v.get("result").is_some(), "{v}");
        let s = v["result"]["structuredContent"]["source"]
            .as_str()
            .expect("source body");
        assert!(s.contains(yes));
        assert!(!s.contains(no));
        assert_eq!(v["result"]["structuredContent"]["repo"], json!(p));
    }
    for p in [
        json!(null),
        json!("."),
        json!(d.0),
        json!(a.join("main.rs")),
        json!(d.0.join("missing")),
    ] {
        error(
            &m.tool("status", json!({"repo":p,"paths_or_scope":[]})),
            "cgrx.invalid_repository",
        );
    }
    error(
        &m.tool("PRIVATE_SENTINEL", json!({"repo":a})),
        "cgrx.tool_not_found",
    );
    error(
        &m.tool(
            "search_graph",
            json!({"repo":a,"query":"PRIVATE_SENTINEL","limit":0}),
        ),
        "cgrx.invalid_arguments",
    );
    let v = snippet(&mut m, &a);
    assert!(v.get("result").is_some());
    let s = fs::read_to_string(log).unwrap();
    assert!(!s.contains("PRIVATE_SENTINEL"));
    assert!(!s.contains(a.to_str().unwrap()));
    let rows: Vec<Value> = s
        .lines()
        .map(|l| serde_json::from_str(l).unwrap())
        .collect();
    assert_eq!(rows.len(), 11);
    assert_eq!(rows[0]["cache"], "miss");
    assert_eq!(rows[2]["cache"], "hit");
    assert!(rows[0]["repo_id"].is_string());
    assert_eq!(rows[8]["tool"], "unknown");
    assert_eq!(rows[8]["error_code"], "cgrx.tool_not_found");
}
#[test]
fn multi_repo_handles_eviction_failed_load_and_restart() {
    let d = Dir::new();
    let a = d.repo("a", "fn Same() -> u32 { 111 }\n");
    let b = d.0.join("b");
    git(
        &d.0,
        &["clone", "-q", a.to_str().unwrap(), b.to_str().unwrap()],
    );
    let mut m = Mcp::new(&d.0, "1", &d.0.join("log"));
    let h = handle(&orient(&mut m, &a));
    let empty = d.0.join("empty");
    fs::create_dir(&empty).unwrap();
    git(&empty, &["init", "-q"]);
    // A valid unborn repository is usable. Keep this a failed load by making
    // its branch point to a missing object, without invalidating the Git root.
    let branch = fs::read_to_string(empty.join(".git/HEAD")).unwrap();
    let branch = empty
        .join(".git")
        .join(branch.trim().strip_prefix("ref: ").unwrap());
    fs::create_dir_all(branch.parent().unwrap()).unwrap();
    fs::write(branch, format!("{}\n", "f".repeat(40))).unwrap();
    error(
        &m.tool("status", json!({"repo":empty,"paths_or_scope":[]})),
        "cgrx.repository_unavailable",
    );
    let ok = m.tool("expand", json!({"repo":a,"handle":h,"budget":800}));
    assert!(ok.get("result").is_some(), "{ok}");
    error(
        &m.tool("expand", json!({"repo":a,"handle":h,"budget":800})),
        "cgrx.handle_not_found",
    );
    let h = handle(&orient(&mut m, &a));
    let hb = handle(&orient(&mut m, &b));
    assert_ne!(h, hb);
    error(
        &m.tool("expand", json!({"repo":b,"handle":h,"budget":800})),
        "cgrx.handle_not_found",
    );
    error(
        &m.tool("expand", json!({"repo":a,"handle":h,"budget":800})),
        "cgrx.handle_not_found",
    );
    let fresh = handle(&orient(&mut m, &a));
    assert_ne!(h, fresh);
    drop(m);
    let mut m = Mcp::new(&d.0, "4", &d.0.join("log2"));
    error(
        &m.tool("expand", json!({"repo":a,"handle":fresh,"budget":800})),
        "cgrx.handle_not_found",
    );
}
#[test]
fn multi_repo_alias_worktree_and_log_failure() {
    let d = Dir::new();
    let a = d.repo("a", "fn Same() -> u32 { 111 }\n");
    let alias = d.0.join("alias");
    std::os::unix::fs::symlink(&a, &alias).unwrap();
    let b = d.0.join("linked");
    git(
        &a,
        &["worktree", "add", "-q", "-b", "other", b.to_str().unwrap()],
    );
    let mut m = Mcp::new(&d.0, "4", &d.0);
    let x = snippet(&mut m, &a);
    let y = snippet(&mut m, &alias);
    let z = snippet(&mut m, &b);
    assert_eq!(
        x["result"]["structuredContent"]["repo_id"],
        y["result"]["structuredContent"]["repo_id"]
    );
    assert_ne!(
        x["result"]["structuredContent"]["repo_id"],
        z["result"]["structuredContent"]["repo_id"]
    );
    fs::create_dir(a.join("nested")).unwrap();
    error(
        &snippet(&mut m, &a.join("nested")),
        "cgrx.invalid_repository",
    );
}

#[test]
fn multi_repo_usage_report_accepts_old_and_new_events() {
    let d = Dir::new();
    let path = d.0.join("events.jsonl");
    let old = json!({"event":"tool_call","timestamp_ms":1,"client":"test","session":"one","tool":"status","ok":true,"latency_us":4,"request_bytes":1,"response_bytes":2});
    let mut new = old.clone();
    new["repo_id"] = json!("a".repeat(64));
    new["cache"] = json!("miss");
    new["error_code"] = json!("cgrx.invalid_repository");
    new["ok"] = json!(false);
    new["timestamp_ms"] = json!(2);
    fs::write(&path, format!("{old}\n{new}\n")).unwrap();
    let out = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["usage-report", "--json", "--log"])
        .arg(path)
        .output()
        .unwrap();
    assert!(out.status.success());
    let r: Value = serde_json::from_slice(&out.stdout).unwrap();
    assert_eq!(r["events"], 2);
    assert_eq!(r["routing"]["cache_counts"]["miss"], 1);
    assert_eq!(r["routing"]["cache_counts"]["legacy"], 1);
    assert_eq!(r["routing"]["error_counts"]["cgrx.invalid_repository"], 1);
    assert_eq!(r["routing"]["repositories"], 1);
}

#[test]
fn multi_repo_stale_handle_after_source_change_and_compact_consistency() {
    let d = Dir::new();
    let a = d.repo("a", "fn Same() -> u32 { 111 }\n");
    let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
    let v = orient(&mut m, &a);
    let h = handle(&v);
    let text: Value =
        serde_json::from_str(v["result"]["content"][0]["text"].as_str().unwrap()).unwrap();
    assert_eq!(text["next"][0], h);
    assert_eq!(text["repo"], v["result"]["structuredContent"]["repo"]);
    fs::write(a.join("main.rs"), "fn Same() -> u32 { 222 }\n").unwrap();
    error(
        &m.tool("expand", json!({"repo":a,"handle":h,"budget":800})),
        "cgrx.handle_not_found",
    );
    assert!(snippet(&mut m, &a).to_string().contains("222"));
}

#[test]
fn multi_repo_live_identical_repositories_reject_foreign_handles_and_preserve_compiled() {
    let d = Dir::new();
    let a = d.repo("a", "fn Same() -> u32 { 111 }\n");
    let b = d.0.join("b");
    git(
        &d.0,
        &["clone", "-q", a.to_str().unwrap(), b.to_str().unwrap()],
    );
    let mut m = Mcp::new(&d.0, "4", &d.0.join("log"));
    let av = orient(&mut m, &a);
    let ah = handle(&av);
    let bh = handle(&orient(&mut m, &b));
    error(
        &m.tool("expand", json!({"repo":b,"handle":ah,"budget":800})),
        "cgrx.handle_not_found",
    );
    error(
        &m.tool("expand", json!({"repo":a,"handle":bh,"budget":800})),
        "cgrx.handle_not_found",
    );
    let expanded = m.tool("expand", json!({"repo":a,"handle":ah,"budget":800}));
    assert!(
        expanded["result"]["structuredContent"]["records"]
            .as_array()
            .is_some_and(|r| !r.is_empty()),
        "{expanded}"
    );
    let mut single = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["serve", "--root"])
        .arg(&a)
        .args(["--response-profile", "full"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    let mut input = single.stdin.take().unwrap();
    writeln!(input,"{}",json!({"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"orient","arguments":{"task":"Same","budget":1,"mode":"PRECISE","scope":{"include":["main.rs"],"exclude":[],"relation_kinds":["CALLS"],"max_depth":1}}}})).unwrap();
    drop(input);
    let output = single.wait_with_output().unwrap();
    assert!(output.status.success());
    let direct: Value = serde_json::from_slice(&output.stdout).unwrap();
    assert!(direct["result"]["structuredContent"]["compiled"].is_object());
    assert_eq!(
        av["result"]["structuredContent"]["compiled"],
        direct["result"]["structuredContent"]["compiled"]
    );
}

fn risks(m: &mut Mcp, repo: &Path) -> Value {
    m.tool(
        "scan_risks",
        json!({"repo":repo,"mode":"changes","limit":20}),
    )
}
#[test]
fn risk_scan_deleted_target_is_candidate_but_repaired_call_is_not() {
    let d = Dir::new();
    let a = d.repo("a", "fn target() {}\nfn caller() { target(); }\n");
    let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
    fs::write(a.join("main.rs"), "fn caller() { target(); }\n").unwrap();
    let v = risks(&mut m, &a);
    assert!(v.get("result").is_some(), "{v}");
    let r = &v["result"]["structuredContent"];
    assert_eq!(r["findings"].as_array().unwrap().len(), 1, "{v}");
    assert_eq!(r["findings"][0]["rule"], "REMOVED_TARGET_RETAINED_CALL");
    assert_eq!(r["findings"][0]["line"], 1);
    assert_eq!(r["findings"][0]["confidence"], "candidate");
    fs::write(
        a.join("main.rs"),
        "fn renamed() {}\nfn caller() { renamed(); }\n",
    )
    .unwrap();
    let v = risks(&mut m, &a);
    assert_eq!(v["result"]["structuredContent"]["findings"], json!([]));
}

#[test]
fn unborn_repo_supports_live_graph_memory_and_first_commit_without_git_writes() {
    let d = Dir::new();
    let root = d.0.join("unborn repo");
    fs::create_dir_all(root.join("src")).unwrap();
    git(&root, &["init", "-q"]);
    fs::write(root.join("main.rs"), "fn Staged() {}\n").unwrap();
    git(&root, &["add", "main.rs"]);
    fs::write(root.join("main.rs"), "fn Live() {}\n").unwrap();
    fs::write(root.join("src/nested.rs"), "fn Nested() {}\n").unwrap();
    fs::write(root.join(".gitignore"), "ignored.rs\n").unwrap();
    fs::write(root.join("ignored.rs"), "fn Ignored() {}\n").unwrap();
    let head = fs::read(root.join(".git/HEAD")).unwrap();
    let index = fs::read(root.join(".git/index")).unwrap();
    let lock = root.join(".git/index.lock");
    fs::write(&lock, b"owned by fixture").unwrap();
    let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
    let status = m.tool("status", json!({"repo":root}));
    assert_eq!(
        status["result"]["structuredContent"]["snapshot"]["repo_revision"], "unborn",
        "{status}"
    );
    let current = root.join(".git/cgrx/managed/.cgrx/CURRENT");
    let empty_base = fs::read(&current).unwrap();
    let memory = m.tool("memory_record", json!({"repo":root,"memory_kind":"semantic","fact":"Fixture is under initial development","confidence":900,"source_kind":"tool","source_ref":"isolated fixture"}));
    assert!(memory.get("result").is_some(), "{memory}");
    let id = memory["result"]["structuredContent"]["record"]["id"].clone();
    assert!(id.is_string(), "{memory}");
    let recalled = m.tool("memory_recall", json!({"repo":root,"id":id}));
    assert_eq!(
        recalled["result"]["structuredContent"]["results"][0]["version"], 1,
        "{recalled}"
    );
    let found = m.tool("search_graph", json!({"repo":root,"query":"Live"}));
    let selected = found["result"]["structuredContent"]["matches"][0].clone();
    assert_eq!(selected["symbol"], "Live", "{found}");
    let snippet = m.tool(
        "get_code_snippet",
        json!({"repo":root,"symbol":"Live","path":"main.rs","symbol_ref":selected["symbol_ref"]}),
    );
    assert!(
        snippet["result"]["structuredContent"]["source"]
            .as_str()
            .unwrap()
            .contains("fn Live()")
    );
    let ignored = m.tool("search_graph", json!({"repo":root,"query":"Ignored"}));
    assert_eq!(ignored["result"]["structuredContent"]["matches"], json!([]));
    let nested = m.tool("search_graph", json!({"repo":root,"query":"Nested"}));
    assert_eq!(
        nested["result"]["structuredContent"]["matches"][0]["path"],
        "src/nested.rs"
    );
    // Same status and length, different live bytes: the immutable base stays empty.
    fs::write(root.join("main.rs"), "fn Next() {}\n").unwrap();
    let next = m.tool("search_graph", json!({"repo":root,"query":"Next"}));
    assert_eq!(
        next["result"]["structuredContent"]["matches"][0]["symbol"], "Next",
        "{next}"
    );
    let stale = m.tool(
        "get_code_snippet",
        json!({"repo":root,"symbol":"Live","path":"main.rs","symbol_ref":selected["symbol_ref"]}),
    );
    error(&stale, "cgrx.symbol_ref_not_found");
    assert_eq!(fs::read(&current).unwrap(), empty_base);
    let risk = risks(&mut m, &root);
    let risk = &risk["result"]["structuredContent"];
    assert_eq!(risk["partial"], true, "{risk}");
    assert_eq!(risk["partial_reason"], "NO_COMMITTED_BASELINE");
    assert!(
        risk["coverage_gaps"]
            .as_array()
            .unwrap()
            .iter()
            .any(|g| g["code"] == "NO_COMMITTED_BASELINE")
    );
    assert!(risk["findings"].as_array().unwrap().is_empty());
    assert_eq!(fs::read(root.join(".git/HEAD")).unwrap(), head);
    assert_eq!(fs::read(root.join(".git/index")).unwrap(), index);
    assert_eq!(fs::read(&lock).unwrap(), b"owned by fixture");
    drop(m);
    let mut m = Mcp::new(&d.0, "2", &d.0.join("reopen-log"));
    let reopened = m.tool("status", json!({"repo":root}));
    assert_eq!(
        reopened["result"]["structuredContent"]["snapshot"]["repo_revision"],
        "unborn"
    );
    assert_eq!(fs::read(&current).unwrap(), empty_base);
    fs::remove_file(lock).unwrap();
    git(&root, &["add", "."]);
    git(&root, &["commit", "-qm", "fixture first commit"]);
    let committed = m.tool("status", json!({"repo":root}));
    assert_ne!(
        committed["result"]["structuredContent"]["snapshot"]["repo_revision"],
        "unborn"
    );
    let risk = risks(&mut m, &root);
    assert!(risk.get("result").is_some(), "{risk}");
    assert!(!risk.to_string().contains("NO_COMMITTED_BASELINE"));
}

#[test]
fn malformed_or_missing_commit_objects_are_not_successful_unborn_repositories() {
    let d = Dir::new();
    for (name, head) in [
        ("detached", format!("{}\n", "f".repeat(40))),
        ("malformed", "not a valid HEAD\n".to_owned()),
    ] {
        let root = d.0.join(name);
        fs::create_dir(&root).unwrap();
        git(&root, &["init", "-q"]);
        fs::write(root.join(".git/HEAD"), head).unwrap();
        let mut m = Mcp::new(&d.0, "2", &d.0.join(format!("{name}-log")));
        let status = m.tool("status", json!({"repo":root}));
        assert!(status.get("error").is_some(), "{status}");
    }
}

#[test]
fn risk_scan_rebuilds_a_shared_baseline_published_by_an_obsolete_extractor() {
    let d = Dir::new();
    let root = d.repo("mixed-policy", "fn target() {}\n");
    let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
    let status = m.tool("status", json!({"repo":root}));
    assert!(status.get("result").is_some(), "{status}");
    let state = root.join(".git/cgrx/managed");
    let reader = cgrx_store::GenerationReader::open_current(&state).unwrap();
    let mut stored: Value =
        serde_json::from_slice(&reader.read_segment("nodes.seg").unwrap()).unwrap();
    let mut old: cgrx_core::RepoSnapshot =
        serde_json::from_value(stored["snapshot"].clone()).unwrap();
    old.graph_generation += 1;
    stored["snapshot"] = serde_json::to_value(&old).unwrap();
    stored["extraction_revision"] = json!(0);
    let mut writer = cgrx_store::GenerationWriter::begin(&state, old).unwrap();
    writer
        .write_segment("nodes.seg", &serde_json::to_vec(&stored).unwrap())
        .unwrap();
    writer
        .write_segment("edges.seg", &reader.read_segment("edges.seg").unwrap())
        .unwrap();
    writer
        .write_segment("terms.fst", &reader.read_segment("terms.fst").unwrap())
        .unwrap();
    writer.validate().unwrap();
    writer.publish().unwrap();
    assert!(cgrx_cli::Runtime::open(&state).is_err());
    let scan = risks(&mut m, &root);
    assert!(scan.get("result").is_some(), "{scan}");
    assert!(cgrx_cli::Runtime::open(&state).is_ok());
}
#[test]
fn risk_scan_impact_and_negative_cases_are_not_bugs() {
    let d = Dir::new();
    let a = d.repo("a", "fn target() -> u32 { 1 }\nfn caller() { target(); }\n");
    let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
    let clean = risks(&mut m, &a);
    assert!(clean.get("result").is_some(), "{clean}");
    assert_eq!(clean["result"]["structuredContent"]["findings"], json!([]));
    fs::write(
        a.join("main.rs"),
        "fn target() -> u32 { 2 }\nfn caller() { target(); }\n",
    )
    .unwrap();
    let v = risks(&mut m, &a);
    assert_eq!(v["result"]["structuredContent"]["findings"], json!([]));
    assert!(
        !v["result"]["structuredContent"]["impacts"]
            .as_array()
            .unwrap()
            .is_empty(),
        "{v}"
    );
    fs::write(a.join("main.rs"), "fn unrelated() {}\n").unwrap();
    assert_eq!(
        risks(&mut m, &a)["result"]["structuredContent"]["findings"],
        json!([])
    );
    fs::write(a.join("main.rs"), "fn new_caller() { undefined_new(); }\n").unwrap();
    assert_eq!(
        risks(&mut m, &a)["result"]["structuredContent"]["findings"],
        json!([])
    );
    error(
        &m.tool("scan_risks", json!({"repo":a,"mode":"full"})),
        "cgrx.invalid_arguments",
    );
    error(
        &m.tool("scan_risks", json!({"repo":a,"limit":0})),
        "cgrx.invalid_arguments",
    );
    error(
        &m.tool(
            "check_change_gates",
            json!({"repo":a,"fail_on":"sometimes"}),
        ),
        "cgrx.invalid_arguments",
    );
    error(
        &m.tool(
            "check_change_gates",
            json!({"repo":a,"max_coverage_gaps":10001}),
        ),
        "cgrx.invalid_arguments",
    );
}
#[test]
fn risk_scan_parser_gaps_and_other_repos_stay_separate() {
    let d = Dir::new();
    let a = d.repo("a", "fn target() {}\nfn caller() { target(); }\n");
    let b = d.repo("b", "fn other() {}\n");
    let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
    fs::write(
        a.join("main.rs"),
        "fn caller() { target(); }\nfn broken( {\n",
    )
    .unwrap();
    let v = risks(&mut m, &a);
    assert!(v.get("result").is_some(), "{v}");
    let r = &v["result"]["structuredContent"];
    assert_eq!(r["findings"], json!([]));
    assert_eq!(r["partial"], true);
    assert!(!r["coverage_gaps"].as_array().unwrap().is_empty());
    let other = risks(&mut m, &b);
    assert_eq!(other["result"]["structuredContent"]["findings"], json!([]));
}

#[test]
fn risk_scan_four_language_matrix_and_cache() {
    let cases = [
        (
            "rs",
            "fn target() {}\nfn caller() { target(); }\n",
            "fn caller() { target(); }\n",
            "fn target2() {}\nfn caller() { target2(); }\n",
        ),
        (
            "ts",
            "function target() {}\nfunction caller() { target(); }\n",
            "function caller() { target(); }\n",
            "function target2() {}\nfunction caller() { target2(); }\n",
        ),
        (
            "py",
            "def target():\n    pass\ndef caller():\n    target()\n",
            "def caller():\n    target()\n",
            "def target2():\n    pass\ndef caller():\n    target2()\n",
        ),
        (
            "go",
            "package fixture\nfunc target() {}\nfunc caller() { target() }\n",
            "package fixture\nfunc caller() { target() }\n",
            "package fixture\nfunc target2() {}\nfunc caller() { target2() }\n",
        ),
    ];
    for (ext, base, broken, fixed) in cases {
        let d = Dir::new();
        let a = d.repo("a", "");
        fs::remove_file(a.join("main.rs")).unwrap();
        let path = a.join(format!("main.{ext}"));
        fs::write(&path, base).unwrap();
        git(&a, &["add", "-A"]);
        git(&a, &["commit", "-qm", "language fixture"]);
        let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
        fs::write(&path, broken).unwrap();
        let v = risks(&mut m, &a);
        let r = &v["result"]["structuredContent"];
        // Unknown Python callees now carry a dispatch gap, so an absence-based
        // removed-target candidate cannot claim clean relationship coverage.
        assert_eq!(
            r["findings"].as_array().unwrap().len(),
            usize::from(ext != "py"),
            "{ext}: {v}"
        );
        if ext == "py" {
            assert_eq!(r["partial"], true);
            assert!(
                r["coverage_gaps"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .any(|gap| { gap["code"] == "DYNAMIC_DISPATCH" && gap["path"] == "main.py" })
            );
        }
        assert_eq!(r["baseline_cache_hit"], false);
        let warm = risks(&mut m, &a);
        assert_eq!(
            warm["result"]["structuredContent"]["baseline_cache_hit"],
            true
        );
        fs::write(&path, fixed).unwrap();
        let repaired = risks(&mut m, &a);
        assert_eq!(
            repaired["result"]["structuredContent"]["findings"],
            json!([])
        );
        if ext == "py" {
            assert_eq!(
                repaired["result"]["structuredContent"]["coverage_gap_count"],
                0
            );
        }
        git(&a, &["add", "-A"]);
        git(&a, &["commit", "-qm", "repair"]);
        let fresh = risks(&mut m, &a);
        assert_eq!(
            fresh["result"]["structuredContent"]["baseline_cache_hit"],
            false
        );
        assert_eq!(fresh["result"]["structuredContent"]["findings"], json!([]));
    }
}
#[test]
fn risk_scan_limit_and_name_ambiguity_are_conservative() {
    let d = Dir::new();
    let a = d.repo(
        "a",
        "fn target() {}\nfn one() { target(); }\nfn two() { target(); }\n",
    );
    let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
    fs::write(
        a.join("main.rs"),
        "fn one() { target(); }\nfn two() { target(); }\n",
    )
    .unwrap();
    let v = m.tool("scan_risks", json!({"repo":a,"limit":1}));
    assert_eq!(
        v["result"]["structuredContent"]["findings"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    assert_eq!(v["result"]["structuredContent"]["partial"], true);
    fs::write(a.join("other.rs"), "fn target() {}\n").unwrap();
    assert_eq!(
        risks(&mut m, &a)["result"]["structuredContent"]["findings"],
        json!([])
    );
}

#[test]
fn risk_scan_candidates_take_priority_over_informational_impacts() {
    let d = Dir::new();
    let mut base =
        String::from("fn removed() {}\nfn retained() { removed(); }\nfn changed() -> u32 { 1 }\n");
    for i in 0..20 {
        base.push_str(&format!("fn c{i}() {{ changed(); }}\n"));
    }
    let a = d.repo("a", &base);
    let next = base
        .replace("fn removed() {}\n", "")
        .replace("{ 1 }", "{ 2 }");
    fs::write(a.join("main.rs"), next).unwrap();
    let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
    let v = m.tool("scan_risks", json!({"repo":a,"limit":1}));
    let r = &v["result"]["structuredContent"];
    assert_eq!(r["findings"].as_array().unwrap().len(), 1, "{v}");
    assert_eq!(r["impacts"], json!([]));
}

#[test]
fn risk_scan_does_not_report_a_removed_dependency_as_current_impact() {
    let d = Dir::new();
    let a = d.repo("a", "fn target() -> u32 { 1 }\nfn caller() { target(); }\n");
    fs::write(
        a.join("main.rs"),
        "fn target() -> u32 { 2 }\nfn caller() {}\n",
    )
    .unwrap();
    let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
    let v = risks(&mut m, &a);
    assert_eq!(v["result"]["structuredContent"]["findings"], json!([]));
    assert_eq!(v["result"]["structuredContent"]["impacts"], json!([]));
}

#[test]
fn risk_scan_exact_limit_is_not_truncation() {
    for limit in [1, 20] {
        let d = Dir::new();
        let mut base = String::from("fn target() {}\n");
        for i in 0..limit {
            base.push_str(&format!("fn caller{i}() {{ target(); }}\n"));
        }
        // A later baseline edge is irrelevant after its caller disappears.
        base.push_str("fn vanished() { target(); }\n");
        let a = d.repo("a", &base);
        fs::write(
            a.join("main.rs"),
            base.replace("fn target() {}\n", "")
                .replace("fn vanished() { target(); }\n", ""),
        )
        .unwrap();
        let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
        let v = m.tool("scan_risks", json!({"repo":a,"limit":limit}));
        let r = &v["result"]["structuredContent"];
        assert_eq!(r["findings"].as_array().unwrap().len(), limit, "{v}");
        assert_eq!(r["partial"], false, "{v}");
        assert_eq!(r["coverage_gaps"], json!([]), "{v}");
    }
}

#[test]
fn risk_scan_limit_matrix_preserves_real_truncation_and_priority() {
    // candidates, informational impacts, limit, genuinely truncated
    for (candidates, impacts, limit, truncated) in [
        (0, 1, 1, false),
        (1, 1, 2, false),
        (1, 1, 1, true),
        (2, 0, 1, true),
        (0, 2, 1, true),
        (20, 0, 20, false),
        (21, 0, 20, true),
    ] {
        let d = Dir::new();
        let mut base = String::from("fn target() {}\nfn changed() -> u32 { 1 }\n");
        // Multiple call sites in one caller exercise inner-loop overflow.
        base.push_str("fn caller() {");
        for _ in 0..candidates {
            base.push_str("target();");
        }
        base.push_str("}\n");
        for i in 0..impacts {
            base.push_str(&format!("fn affected{i}() {{ changed(); }}\n"));
        }
        let a = d.repo("a", &base);
        fs::write(
            a.join("main.rs"),
            base.replace("fn target() {}\n", "")
                .replace("{ 1 }", "{ 2 }"),
        )
        .unwrap();
        let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
        let v = m.tool("scan_risks", json!({"repo":a,"limit":limit}));
        let r = &v["result"]["structuredContent"];
        let n = candidates.min(limit);
        assert_eq!(r["findings"].as_array().unwrap().len(), n, "{v}");
        assert_eq!(
            r["impacts"].as_array().unwrap().len(),
            impacts.min(limit - n),
            "{v}"
        );
        assert_eq!(r["partial"], truncated, "{v}");
        assert_eq!(
            r["coverage_gaps"]
                .as_array()
                .unwrap()
                .iter()
                .any(|g| g["code"] == "RESULT_LIMIT"),
            truncated,
            "{v}"
        );
    }
}

#[test]
fn risk_verification_plan_visible_over_mcp_and_repo_isolated() {
    let d = Dir::new();
    let source =
        "fn target() -> u32 { 1 }\nfn caller() { target(); }\nfn test_feature() { caller(); }\n";
    let a = d.repo("a", source);
    let b = d.repo("b", source);
    let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
    fs::write(a.join("main.rs"), source.replace("{ 1 }", "{ 2 }")).unwrap();
    let response = risks(&mut m, &a);
    let result = &response["result"]["structuredContent"];
    let visible: Value =
        serde_json::from_str(response["result"]["content"][0]["text"].as_str().unwrap()).unwrap();
    assert_eq!(
        result["verification_plan"]["related_tests"][0]["symbol"], "test_feature",
        "{response}"
    );
    assert_eq!(
        visible["verification_plan"]["tests"][0][1],
        result["verification_plan"]["related_tests"][0]["symbol"]
    );
    assert_eq!(
        visible["change_plan"]["agent_handoff"],
        result["change_plan"]["agent_handoff"]
    );
    assert_eq!(visible["change_plan"]["llm_used"], false);
    assert_eq!(result["verification_plan"]["execution_status"], "not_run");
    let unchanged = risks(&mut m, &b);
    assert_eq!(
        unchanged["result"]["structuredContent"]["verification_plan"]["related_tests"],
        json!([])
    );
}

#[test]
fn change_quality_gate_is_snapshot_bound_model_free_and_policy_aware() {
    let d = Dir::new();
    let source = "fn target() -> u32 { 1 }\nfn caller() { target(); }\n";
    let a = d.repo("a", source);
    let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
    fs::write(a.join("main.rs"), source.replace("{ 1 }", "{ 2 }")).unwrap();
    let response = m.tool(
        "check_change_gates",
        json!({"repo":a,"fail_on":"error","limit":20}),
    );
    let result = &response["result"]["structuredContent"];
    let visible: Value =
        serde_json::from_str(response["result"]["content"][0]["text"].as_str().unwrap()).unwrap();
    assert_eq!(result["algorithm"], "change_quality_gate_v1", "{response}");
    assert_eq!(result["llm_used"], false);
    assert_eq!(result["verdict"], "WARN");
    assert_eq!(result["would_block"], false);
    assert_eq!(result["agent_handoff"]["impact_indexes"], json!([0]));
    assert_eq!(visible["agent_handoff"], result["agent_handoff"]);

    let strict = m.tool(
        "check_change_gates",
        json!({"repo":a,"fail_on":"warning","limit":20}),
    );
    assert_eq!(strict["result"]["structuredContent"]["would_block"], true);
    assert_eq!(
        strict["result"]["structuredContent"]["snapshot"],
        result["snapshot"]
    );
}

#[test]
fn memory_token_budget_alias_enforces_the_same_bound_and_rejects_ambiguity() {
    let d = Dir::new();
    let root = d.repo("memory", "fn main() {}\n");
    let mut m = Mcp::new(&d.0, "1", &d.0.join("log"));
    let saved = m.tool("memory_record", json!({"repo":root,"fact":"Keep complete assertions and their source evidence. ".repeat(50),"confidence":990,"source_kind":"tool","source_ref":"fixture"}));
    let id = saved["result"]["structuredContent"]["record"]["id"].clone();
    assert!(id.is_string(), "{saved}");
    let canonical = m.tool("memory_recall", json!({"repo":root,"id":id,"budget":256}));
    let alias = m.tool(
        "memory_recall",
        json!({"repo":root,"id":id,"token_budget":256}),
    );
    assert_eq!(
        alias["result"]["structuredContent"],
        canonical["result"]["structuredContent"]
    );
    assert_eq!(alias["result"]["structuredContent"]["budget_omitted"], 1);
    for args in [
        json!({"repo":root,"budget":1000,"token_budget":1000}),
        json!({"repo":root,"token_budget":255}),
        json!({"repo":root,"token_budget":16001}),
    ] {
        error(&m.tool("memory_recall", args), "cgrx.invalid_arguments");
    }
    let found = m.tool(
        "memory_recall",
        json!({"repo":root,"id":id,"token_budget":4000}),
    );
    assert_eq!(
        found["result"]["structuredContent"]["results"][0]["version"],
        1
    );
}

#[test]
fn trace_direction_aliases_preserve_proven_nodes_and_canonical_output() {
    let d = Dir::new();
    let root = d.repo("trace", "fn callee() {}\nfn caller() { callee(); }\n");
    let mut m = Mcp::new(&d.0, "1", &d.0.join("log"));
    for (symbol, alias, canonical, expected) in [
        ("caller", "outgoing", "callees", "callee"),
        ("callee", "incoming", "callers", "caller"),
    ] {
        let alias = m.tool(
            "trace_path",
            json!({"repo":root,"symbol":symbol,"path":"main.rs","direction":alias,"depth":1}),
        );
        let canonical = m.tool(
            "trace_path",
            json!({"repo":root,"symbol":symbol,"path":"main.rs","direction":canonical,"depth":1}),
        );
        assert_eq!(
            alias["result"]["structuredContent"],
            canonical["result"]["structuredContent"]
        );
        assert!(
            canonical["result"]["structuredContent"]["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .any(|node| node["symbol"] == expected)
        );
    }
}

#[test]
fn historical_risk_bases_resolve_refs_and_track_moving_branches() {
    let d = Dir::new();
    let source =
        "fn target() -> u32 { 1 }\nfn caller() { target(); }\nfn test_feature() { caller(); }\n";
    let root = d.repo("risks", source);
    let first = git_revision(&root, "HEAD");
    git(&root, &["branch", "review-base"]);
    git(&root, &["tag", "-a", "review-start", "-m", "baseline"]);
    let mut m = Mcp::new(&d.0, "1", &d.0.join("log"));
    let initial = m.tool("scan_risks", json!({"repo":root,"base":first,"limit":2}));
    assert_eq!(
        initial["result"]["structuredContent"]["base_revision"],
        first
    );
    fs::write(root.join("main.rs"), source.replace("{ 1 }", "{ 2 }")).unwrap();
    git(&root, &["commit", "-qam", "second"]);
    let second = git_revision(&root, "HEAD");
    let clean = risks(&mut m, &root);
    assert_eq!(
        clean["result"]["structuredContent"]["changed_path_count"],
        0
    );
    let pointer = root.join(".git/cgrx/managed/.cgrx/CURRENT");
    let before = fs::read(&pointer).unwrap();
    for base in [
        first.as_str(),
        &first[..12],
        "HEAD~1",
        "review-base",
        "review-start",
    ] {
        let response = m.tool("scan_risks", json!({"repo":root,"base":base}));
        let report = &response["result"]["structuredContent"];
        assert_eq!(report["base_revision"], first, "{response}");
        assert_eq!(report["snapshot"]["repo_revision"], second);
        assert_eq!(report["changed_paths"], json!(["main.rs"]));
        assert_eq!(report["impacts"].as_array().unwrap().len(), 1);
        assert_eq!(
            report["impacts"][0]["base_edge"]["source_hash"],
            blake3::hash(source.as_bytes()).to_hex().to_string()
        );
        assert_eq!(fs::read(&pointer).unwrap(), before);
    }
    let current_hash = blake3::hash(source.replace("{ 1 }", "{ 2 }").as_bytes())
        .to_hex()
        .to_string();
    for (revision, expected) in [(first.as_str(), "not_run"), (second.as_str(), "passed")] {
        let response = m.tool("scan_risks", json!({"repo":root,"base":first,"runs":[{
            "revision":revision,"runner_command":"fixture runner",
            "results":[{"path":"main.rs","symbol":"test_feature","status":"passed","source_hash":current_hash}]
        }]}));
        let test =
            &response["result"]["structuredContent"]["verification_plan"]["related_tests"][0];
        assert_eq!(test["symbol"], "test_feature", "{response}");
        assert_eq!(test["execution_status"], expected);
    }
    git(&root, &["branch", "-f", "review-base", &second]);
    let moved = m.tool("scan_risks", json!({"repo":root,"base":"review-base"}));
    assert_eq!(
        moved["result"]["structuredContent"]["base_revision"],
        second
    );
    assert_eq!(
        moved["result"]["structuredContent"]["changed_path_count"],
        0
    );
    assert_eq!(
        moved["result"]["structuredContent"]["baseline_cache_hit"],
        false
    );
    for base in ["HEAD", second.as_str()] {
        let report = m.tool("scan_risks", json!({"repo":root,"base":base,"limit":2}));
        assert_eq!(
            report["result"]["structuredContent"]["base_revision"],
            second
        );
    }
    assert!(git_output(&root, &["status", "--porcelain"]).is_empty());
}

#[test]
fn historical_risk_scan_includes_commits_dirty_sources_renames_and_unindexed_gaps() {
    let d = Dir::new();
    let source = "fn target() -> u32 { 1 }\nfn caller() { target(); }\n";
    let root = d.repo("risks", source);
    for (path, text) in [
        ("deleted.rs", "fn deleted() {}"),
        ("old name.rs", "fn renamed() {}"),
        ("legacy.custom", "before"),
    ] {
        fs::write(root.join(path), text).unwrap();
    }
    git(&root, &["add", "."]);
    git(&root, &["commit", "-qm", "baseline files"]);
    let first = git_revision(&root, "HEAD");
    fs::write(root.join("main.rs"), source.replace("{ 1 }", "{ 2 }")).unwrap();
    fs::remove_file(root.join("deleted.rs")).unwrap();
    fs::rename(root.join("old name.rs"), root.join("new name.rs")).unwrap();
    fs::write(root.join("legacy.custom"), "committed change").unwrap();
    git(&root, &["add", "-A"]);
    git(&root, &["commit", "-qm", "committed changes"]);
    fs::write(root.join("staged.rs"), "fn staged() {}\n").unwrap();
    git(&root, &["add", "staged.rs"]);
    fs::write(root.join("untracked.rs"), "fn untracked() {}\n").unwrap();
    fs::write(root.join("main.rs"), source.replace("{ 1 }", "{ 3 }")).unwrap();
    let status = git_output(&root, &["status", "--porcelain=v1", "-z"]);
    let staged = git_output(&root, &["diff", "--cached", "--binary"]);
    let mut m = Mcp::new(&d.0, "1", &d.0.join("log"));
    let response = m.tool("scan_risks", json!({"repo":root,"base":first}));
    let report = &response["result"]["structuredContent"];
    assert_eq!(
        report["changed_paths"],
        json!([
            "deleted.rs",
            "main.rs",
            "new name.rs",
            "old name.rs",
            "staged.rs",
            "untracked.rs"
        ]),
        "{response}"
    );
    assert_eq!(report["unindexed_changed_paths"], json!(["legacy.custom"]));
    assert_eq!(report["partial"], true);
    assert_eq!(report["impacts"].as_array().unwrap().len(), 1);
    assert_eq!(
        git_output(&root, &["status", "--porcelain=v1", "-z"]),
        status
    );
    assert_eq!(git_output(&root, &["diff", "--cached", "--binary"]), staged);

    // Undoing a committed edit in the working tree cancels it relative to base.
    fs::write(root.join("main.rs"), source).unwrap();
    fs::write(root.join("legacy.custom"), "before").unwrap();
    let restored = m.tool("scan_risks", json!({"repo":root,"base":first}));
    assert!(
        !restored["result"]["structuredContent"]["changed_paths"]
            .as_array()
            .unwrap()
            .contains(&json!("main.rs"))
    );
    assert_eq!(
        restored["result"]["structuredContent"]["impacts"],
        json!([])
    );
    assert_eq!(
        restored["result"]["structuredContent"]["unindexed_changed_path_count"],
        0
    );
    assert!(
        risks(&mut m, &root)["result"]["structuredContent"]["changed_paths"]
            .as_array()
            .unwrap()
            .contains(&json!("main.rs"))
    );
}

#[test]
fn historical_risk_base_need_not_be_an_ancestor() {
    let d = Dir::new();
    let source = "fn target() -> u32 { 1 }\nfn caller() { target(); }\n";
    let root = d.repo("fork", source);
    let first = git_revision(&root, "HEAD");
    fs::write(root.join("main.rs"), source.replace("{ 1 }", "{ 2 }")).unwrap();
    git(&root, &["commit", "-qam", "main side"]);
    let current = git_revision(&root, "HEAD");
    git(&root, &["checkout", "-q", "--detach", &first]);
    let other_source = source.replace("{ 1 }", "{ 99 }");
    fs::write(root.join("main.rs"), &other_source).unwrap();
    git(&root, &["commit", "-qam", "other side"]);
    let other = git_revision(&root, "HEAD");
    git(&root, &["checkout", "-q", "--detach", &current]);
    let mut m = Mcp::new(&d.0, "1", &d.0.join("log"));
    let response = m.tool("scan_risks", json!({"repo":root,"base":other}));
    let report = &response["result"]["structuredContent"];
    assert_eq!(report["base_revision"], other, "{response}");
    assert_eq!(report["snapshot"]["repo_revision"], current);
    assert_eq!(
        report["impacts"][0]["base_edge"]["source_hash"],
        blake3::hash(other_source.as_bytes()).to_hex().to_string()
    );
}

#[test]
fn historical_risk_scan_rejects_invalid_missing_and_non_commit_bases() {
    let d = Dir::new();
    let root = d.repo("invalid-base", "fn main() {}\n");
    let blob = git_revision(&root, "HEAD:main.rs");
    let mut m = Mcp::new(&d.0, "1", &d.0.join("log"));
    for base in ["", "--help", " HEAD", "HEAD\n", &"x".repeat(1025)] {
        error(
            &m.tool("scan_risks", json!({"repo":root,"base":base})),
            "cgrx.invalid_arguments",
        );
    }
    for base in [
        "missing-ref",
        "HEAD..HEAD",
        "HEAD^{tree}",
        &"0".repeat(40),
        &blob,
    ] {
        let response = m.tool("scan_risks", json!({"repo":root,"base":base}));
        error(&response, "cgrx.invalid_base");
        assert!(response.get("result").is_none());
    }
    assert_eq!(
        risks(&mut m, &root)["result"]["structuredContent"]["changed_path_count"],
        0
    );
}

#[test]
fn historical_risk_scan_builds_language_baselines_from_the_selected_tree() {
    for (ext, source, changed) in [
        (
            "rs",
            "fn target() -> u32 { 1 }\nfn caller() { target(); }\n",
            "fn target() -> u32 { 2 }\nfn caller() { target(); }\n",
        ),
        (
            "cpp",
            "int target() { return 1; }\nvoid caller() { target(); }\n",
            "int target() { return 2; }\nvoid caller() { target(); }\n",
        ),
        (
            "swift",
            "private func target() { let value = 1 }\nprivate func caller() { target() }\n",
            "private func target() { let value = 2 }\nprivate func caller() { target() }\n",
        ),
        (
            "ts",
            "function target() { return 1; }\nfunction caller() { target(); }\n",
            "function target() { return 2; }\nfunction caller() { target(); }\n",
        ),
        (
            "go",
            "package fixture\nfunc target() int { return 1 }\nfunc caller() { target() }\n",
            "package fixture\nfunc target() int { return 2 }\nfunc caller() { target() }\n",
        ),
        (
            "py",
            "def target():\n    return 1\ndef caller():\n    target()\n",
            "def target():\n    return 2\ndef caller():\n    target()\n",
        ),
    ] {
        let d = Dir::new();
        let root = d.repo("language", "");
        fs::remove_file(root.join("main.rs")).unwrap();
        let path = format!("main.{ext}");
        fs::write(root.join(&path), source).unwrap();
        git(&root, &["add", "-A"]);
        git(&root, &["commit", "-qm", "language baseline"]);
        let first = git_revision(&root, "HEAD");
        fs::write(root.join(&path), changed).unwrap();
        git(&root, &["commit", "-qam", "changed target"]);
        let mut m = Mcp::new(&d.0, "1", &d.0.join("log"));
        let response = m.tool("scan_risks", json!({"repo":root,"base":"HEAD~1"}));
        let report = &response["result"]["structuredContent"];
        assert_eq!(report["base_revision"], first, "{ext}: {response}");
        assert_eq!(report["changed_paths"], json!([path]));
        assert_eq!(
            report["impacts"].as_array().unwrap().len(),
            1,
            "{ext}: {response}"
        );
        assert_eq!(
            report["impacts"][0]["base_edge"]["source_hash"],
            blake3::hash(source.as_bytes()).to_hex().to_string()
        );
        assert_eq!(
            report["impacts"][0]["current_edge"]["source_hash"],
            blake3::hash(changed.as_bytes()).to_hex().to_string()
        );
    }
}

#[test]
fn invalid_memory_is_rejected_before_opening_or_touching_repository_state() {
    let d = Dir::new();
    let root = d.0.join("not-a-repository");
    fs::create_dir(&root).unwrap();
    let mut m = Mcp::new(&d.0, "1", &d.0.join("log"));
    let response = m.tool("memory_update", json!({"repo":root,
        "id":"0123456789abcdef0123456789abcdef", "expected_version":1, "reason":"Checkpoint",
        "record":{"fact":"я".repeat(5124),"confidence":990,"memory_kind":"working","task_id":"task","source_kind":"tool","source_ref":"report"}}));
    error(&response, "cgrx.invalid_arguments");
    assert_eq!(response["error"]["data"]["actual_chars"], 5124);
    assert_eq!(response["error"]["data"]["mutation_applied"], false);
    assert!(!root.join(".cgrx").exists());
    // The preflight must not swallow legitimate repository validation.
    let response = m.tool("memory_recall", json!({"repo":root,"budget":2048}));
    error(&response, "cgrx.invalid_repository");
}

#[test]
fn repository_quality_gate_reuses_proven_architecture_and_warning_policy() {
    let d = Dir::new();
    let a = d.repo("a", "fn target() {}\nfn caller() { target(); }\n");
    let mut m = Mcp::new(&d.0, "2", &d.0.join("log"));
    let response = m.tool(
        "check_repository_gates",
        json!({"repo":a,"fail_on":"error","max_symbol_fan_in":0,"max_coverage_gaps":20000}),
    );
    let result = &response["result"]["structuredContent"];
    let visible: Value =
        serde_json::from_str(response["result"]["content"][0]["text"].as_str().unwrap()).unwrap();
    assert_eq!(
        result["algorithm"], "repository_quality_gate_v1",
        "{response}"
    );
    assert_eq!(result["llm_used"], false);
    assert_eq!(result["verdict"], "WARN");
    assert_eq!(result["would_block"], false);
    assert_eq!(result["partial"], false);
    assert_eq!(visible["agent_handoff"], result["agent_handoff"]);

    let strict = m.tool(
        "check_repository_gates",
        json!({"repo":a,"fail_on":"warning","max_symbol_fan_in":0}),
    );
    assert_eq!(strict["result"]["structuredContent"]["would_block"], true);
    assert_eq!(
        strict["result"]["structuredContent"]["snapshot"],
        result["snapshot"]
    );

    error(
        &m.tool(
            "check_repository_gates",
            json!({"repo":a,"package_depth":0}),
        ),
        "cgrx.invalid_arguments",
    );
    error(
        &m.tool(
            "check_repository_gates",
            json!({"repo":a,"max_coverage_gaps":1000001}),
        ),
        "cgrx.invalid_arguments",
    );
}
