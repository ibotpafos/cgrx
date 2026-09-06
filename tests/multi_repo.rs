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
struct Mcp {
    child: Child,
    input: ChildStdin,
    output: BufReader<ChildStdout>,
}
impl Mcp {
    fn new(cwd: &Path, cap: &str, log: &Path) -> Self {
        let mut child = Command::new(env!("CARGO_BIN_EXE_cgrx"))
            .args(["serve", "--multi-repo", "--max-repos", cap])
            .current_dir(cwd)
            .env("CGRX_USAGE_LOG", log)
            .env("CGRX_CLIENT", "test")
            .env("CGRX_USAGE_SESSION", "test-session")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .unwrap();
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
    assert_eq!(ts.len(), 12);
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
        json!({"repo":repo,"scope":"**","package_depth":1,"limit":20}),
    );
    assert!(response.get("result").is_some(), "{response}");
    let payload = &response["result"]["structuredContent"];
    assert!(payload["snapshot"]["repo_revision"].is_string());
    assert_eq!(
        payload["relation_kinds"],
        json!(["CALLS", "IMPLEMENTS", "IMPORTS", "REFERENCES"])
    );
    assert_eq!(payload["packages"][0]["name"], ".");
    assert_eq!(payload["packages"][0]["symbols"], 2);
    assert_eq!(payload["partial"], false);
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
        assert_eq!(r["findings"].as_array().unwrap().len(), 1, "{ext}: {v}");
        assert_eq!(r["baseline_cache_hit"], false);
        let warm = risks(&mut m, &a);
        assert_eq!(
            warm["result"]["structuredContent"]["baseline_cache_hit"],
            true
        );
        fs::write(&path, fixed).unwrap();
        assert_eq!(
            risks(&mut m, &a)["result"]["structuredContent"]["findings"],
            json!([])
        );
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
    assert_eq!(visible["verification_plan"], result["verification_plan"]);
    assert_eq!(result["verification_plan"]["execution_status"], "not_run");
    let unchanged = risks(&mut m, &b);
    assert_eq!(
        unchanged["result"]["structuredContent"]["verification_plan"]["related_tests"],
        json!([])
    );
}
