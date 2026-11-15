use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use cgrx_cli::Runtime;
use cgrx_core::Scope;

static SEQUENCE: AtomicU64 = AtomicU64::new(0);

struct TestDirectory(PathBuf);

impl TestDirectory {
    fn new(label: &str) -> Self {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock after epoch")
            .as_nanos();
        let sequence = SEQUENCE.fetch_add(1, Ordering::Relaxed);
        let path = std::env::temp_dir().join(format!(
            "cgrx-{label}-{}-{nonce}-{sequence}",
            std::process::id()
        ));
        fs::create_dir_all(&path).expect("create test directory");
        Self(path)
    }

    fn path(&self) -> &Path {
        &self.0
    }
}

impl Drop for TestDirectory {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn git(root: &Path, args: &[&str]) {
    assert!(
        Command::new("git")
            .args(args)
            .current_dir(root)
            .status()
            .expect("git executable")
            .success(),
        "git command failed: {args:?}"
    );
}

fn runtime_with_dynamic_gap(dynamic_gap: bool) -> (TestDirectory, TestDirectory, Runtime) {
    let repository = TestDirectory::new("refactor-strategy-repository");
    git(repository.path(), &["init", "-q"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    let mut fixture = "function save(value: number) {}\nfunction first(input: number) { const prepared = input + 1; eval(String(prepared)); save(prepared); return prepared; }\nfunction second(value: number) { const output = value + 9; eval(String(output)); save(output); return output; }\nfunction useSecond() { return second(1); }\n".to_owned();
    if dynamic_gap {
        fixture.push_str("function dynamic(callback: () => number) { return callback(); }\n");
    }
    fs::write(repository.path().join("service.ts"), fixture).expect("write fixture");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);

    let state = TestDirectory::new("refactor-strategy-state");
    Runtime::index(repository.path(), state.path()).expect("index repository");
    let runtime = Runtime::open(state.path()).expect("open runtime");
    (repository, state, runtime)
}

fn runtime() -> (TestDirectory, TestDirectory, Runtime) {
    runtime_with_dynamic_gap(true)
}

fn matching_candidate(result: &serde_json::Value) -> &serde_json::Value {
    result["candidates"]
        .as_array()
        .expect("candidate array")
        .iter()
        .find(|candidate| {
            candidate["left"]["symbol"] == "first" && candidate["right"]["symbol"] == "second"
        })
        .expect("first/second candidate")
}

#[test]
fn quality_transaction_probe() {
    let (_r, _s, runtime) = runtime();
    let result = runtime
        .suggest_refactors(
            &Scope {
                include: vec!["service.ts".into()],
                exclude: vec![],
                relation_kinds: vec![],
                max_depth: 1,
            },
            Some("typescript"),
            600,
            50,
            0,
            0,
        )
        .unwrap();
    let candidate = matching_candidate(&result);
    println!("QUALITY_PROBE={}", candidate["quality_checks"]);
}

fn quality_runtime() -> (TestDirectory, TestDirectory, Runtime) {
    let (repository, state, _runtime) = runtime_with_dynamic_gap(false);
    fs::write(repository.path().join("service.ts"), "function alpha(x: number) { const p = x + 1; return p * 2; }\nfunction beta(v: number) { const q = v + 1; return q * 2; }\nfunction unusedLocal() { return 4; }\nexport function publicApi() { return 5; }\nexport function usedElsewhere() { return 6; }\nexport function configuration() { const endpoint = \"https://example.invalid/api\"; return endpoint; }\n").unwrap();
    fs::write(repository.path().join("caller.ts"), "import { usedElsewhere, configuration } from './service';\nfunction caller() { return usedElsewhere() + configuration().length; }\n").unwrap();
    fs::write(repository.path().join("secrets.ts"), "const api_key = \"fixture-secret-not-real-12345\";\n// const password = 'comment-secret';\n").unwrap();
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "quality fixture"]);
    Runtime::index(repository.path(), state.path()).unwrap();
    let runtime = Runtime::open(state.path()).unwrap();
    (repository, state, runtime)
}
#[test]
fn quality_mvp_inventory_context_patch_and_stale_ids() {
    use serde_json::json;
    let (repository, state, mut runtime) = quality_runtime();
    let listing = runtime
        .quality_tool(
            repository.path(),
            "list_quality_candidates",
            json!({"limit":100}),
        )
        .unwrap();
    let candidates = listing["candidates"].as_array().unwrap();
    for kind in ["duplicate", "dead_code", "hardcode"] {
        assert!(
            candidates.iter().any(|c| c["kind"] == kind),
            "missing {kind}: {listing}"
        );
    }
    assert!(!listing.to_string().contains("fixture-secret-not-real"));
    assert!(!candidates.iter().any(|c| c["kind"] == "dead_code"
        && (c["evidence"]["symbol"]["symbol"] == "usedElsewhere"
            || c["evidence"]["symbol"]["symbol"] == "publicApi")));
    let endpoint = candidates
        .iter()
        .find(|c| c["evidence"]["rule"] == "HARDCODED_ENDPOINT_OR_PATH")
        .unwrap();
    assert!(
        endpoint["context"]["incoming_uses"].as_u64().unwrap() > 0,
        "cross-file impact {endpoint}"
    );
    assert!(
        !endpoint["context"]["impacted_symbols"]
            .as_array()
            .unwrap()
            .is_empty()
    );
    let args = json!({"candidate_id":endpoint["id"]});
    let detail = runtime
        .quality_tool(repository.path(), "get_candidate_details", args.clone())
        .unwrap();
    assert_eq!(detail["candidate"], *endpoint);
    let original = fs::read(repository.path().join("service.ts")).unwrap();
    let patch = runtime
        .quality_tool(repository.path(), "prepare_candidate_patch", args.clone())
        .unwrap();
    assert_eq!(patch["status"], "prepared");
    assert_eq!(
        fs::read(repository.path().join("service.ts")).unwrap(),
        original
    );
    let file = state.path().join("prepared.patch");
    fs::write(&file, patch["diff"].as_str().unwrap()).unwrap();
    assert!(
        Command::new("git")
            .args(["apply", "--check"])
            .arg(&file)
            .current_dir(repository.path())
            .status()
            .unwrap()
            .success()
    );
    assert!(
        Command::new("git")
            .args(["apply"])
            .arg(&file)
            .current_dir(repository.path())
            .status()
            .unwrap()
            .success()
    );
    runtime.refresh(repository.path()).unwrap();
    assert_eq!(
        runtime
            .quality_tool(repository.path(), "get_candidate_details", args)
            .unwrap_err()
            .code(),
        "cgrx.quality_stale_candidate"
    );
    let stale = runtime
        .quality_tool(
            repository.path(),
            "list_quality_candidates",
            json!({"expected_snapshot":listing["snapshot"]}),
        )
        .unwrap_err();
    assert_eq!(stale.code(), "cgrx.quality_stale_candidate");
}
#[test]
fn quality_mvp_secret_and_unproven_deletion_are_blocked_and_cache_is_persisted() {
    use serde_json::json;
    let (repository, state, runtime) = quality_runtime();
    let listing = runtime
        .quality_tool(
            repository.path(),
            "list_quality_candidates",
            json!({"limit":100}),
        )
        .unwrap();
    for c in listing["candidates"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|c| c["kind"] != "hardcode" || c["evidence"]["sensitive"] == true)
    {
        let patch = runtime
            .quality_tool(
                repository.path(),
                "prepare_candidate_patch",
                json!({"candidate_id":c["id"]}),
            )
            .unwrap();
        assert_eq!(patch["status"], "blocked");
        assert!(patch["diff"].is_null());
    }
    let bytes = fs::read(state.path().join("quality-candidates-v1.json")).unwrap();
    assert!(!String::from_utf8_lossy(&bytes).contains("fixture-secret-not-real"));
    drop(runtime);
    let runtime = Runtime::open(state.path()).unwrap();
    let again = runtime
        .quality_tool(
            repository.path(),
            "list_quality_candidates",
            json!({"limit":100}),
        )
        .unwrap();
    assert_eq!(listing, again);
    assert!(
        runtime
            .quality_tool(
                repository.path(),
                "list_quality_candidates",
                json!({"limit":0})
            )
            .is_err()
    );
    assert!(
        runtime
            .quality_tool(
                repository.path(),
                "get_candidate_details",
                json!({"candidate_id":"../../anything"})
            )
            .is_err()
    );
}

#[test]
fn quality_mvp_preserves_directives_and_rejects_bad_pagination() {
    use serde_json::json;
    let (repository, state, _) = quality_runtime();
    let path = repository.path().join("service.ts");
    let original = fs::read_to_string(&path).unwrap();
    fs::write(&path, format!("\"use client\";\n{original}")).unwrap();
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "directive fixture"]);
    Runtime::index(repository.path(), state.path()).unwrap();
    let runtime = Runtime::open(state.path()).unwrap();
    let listing = runtime
        .quality_tool(
            repository.path(),
            "list_quality_candidates",
            json!({"kind":"hardcode","limit":100}),
        )
        .unwrap();
    let candidate = listing["candidates"]
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["evidence"]["sensitive"] == false)
        .unwrap();
    assert_eq!(
        runtime
            .quality_tool(
                repository.path(),
                "prepare_candidate_patch",
                json!({"candidate_id":candidate["id"]})
            )
            .unwrap()["status"],
        "blocked"
    );
    for args in [
        json!({"limit":"100"}),
        json!({"offset":-1}),
        json!({"kind":"unknown"}),
    ] {
        assert_eq!(
            runtime
                .quality_tool(repository.path(), "list_quality_candidates", args)
                .unwrap_err()
                .code(),
            "cgrx.invalid_arguments"
        );
    }
}

#[test]
fn quality_statuses_survive_edits_reopen_and_use_compare_and_swap() {
    use serde_json::json;
    let (repository, state, mut runtime) = quality_runtime();
    let list = runtime
        .quality_tool(
            repository.path(),
            "list_quality_candidates",
            json!({"limit":100}),
        )
        .unwrap();
    let candidate = list["candidates"]
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["evidence"]["rule"] == "HARDCODED_ENDPOINT_OR_PATH")
        .unwrap();
    let stable = candidate["finding_id"].clone();
    let id = candidate["id"].clone();
    let updated=runtime.quality_tool(repository.path(),"update_quality_candidate_status",json!({"candidate_id":id,"status":"confirmed","expected_version":0,"reason":"checked context"})).unwrap();
    assert_eq!(updated["finding"]["version"], 1);
    assert_eq!(runtime.quality_tool(repository.path(),"update_quality_candidate_status",json!({"candidate_id":id,"status":"dismissed","expected_version":0,"reason":"stale client"})).unwrap_err().code(),"cgrx.quality_status_conflict");
    runtime.quality_tool(repository.path(),"update_quality_candidate_status",json!({"candidate_id":id,"status":"dismissed","expected_version":1,"reason":"deliberate fixture URL"})).unwrap();
    let file = repository.path().join("service.ts");
    let original = fs::read_to_string(&file).unwrap();
    fs::write(&file, format!("// unrelated leading comment\n{original}")).unwrap();
    runtime.refresh(repository.path()).unwrap();
    let dismissed = runtime
        .quality_tool(
            repository.path(),
            "list_quality_candidates",
            json!({"status":"dismissed","limit":100}),
        )
        .unwrap();
    let c = dismissed["candidates"]
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["finding_id"] == stable)
        .unwrap();
    assert_eq!(c["triage"]["version"], 2);
    let default = runtime
        .quality_tool(
            repository.path(),
            "list_quality_candidates",
            json!({"limit":100}),
        )
        .unwrap();
    assert!(
        !default["candidates"]
            .as_array()
            .unwrap()
            .iter()
            .any(|c| c["finding_id"] == stable)
    );
    let mut other = Runtime::open(state.path()).unwrap();
    other.refresh(repository.path()).unwrap();
    let again = other
        .quality_tool(
            repository.path(),
            "get_candidate_details",
            json!({"candidate_id":c["id"]}),
        )
        .unwrap();
    assert_eq!(again["candidate"]["triage"]["status"], "dismissed");
    fs::write(
        &file,
        fs::read_to_string(&file).unwrap().replace("/api", "/v2"),
    )
    .unwrap();
    runtime.refresh(repository.path()).unwrap();
    let reopened = runtime
        .quality_tool(
            repository.path(),
            "list_quality_candidates",
            json!({"limit":100}),
        )
        .unwrap();
    let c = reopened["candidates"]
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["finding_id"] == stable)
        .unwrap();
    assert_eq!(c["triage"]["status"], "new");
    assert_eq!(c["triage"]["version"], 3);
    assert_eq!(reopened["analysis"]["parsed_files"], 1);
    assert!(reopened["analysis"]["reused_files"].as_u64().unwrap() >= 2);
    let fixed=runtime.quality_tool(repository.path(),"update_quality_candidate_status",json!({"candidate_id":c["id"],"status":"fixed","expected_version":3,"reason":"user reported resolution"})).unwrap();
    assert_eq!(fixed["finding"]["verification"], "user_reported");
    assert_eq!(fixed["still_detected"], true);
    fs::remove_file(&file).unwrap();
    runtime.refresh(repository.path()).unwrap();
    let inactive = runtime
        .quality_tool(
            repository.path(),
            "list_quality_candidates",
            json!({"include_inactive":true}),
        )
        .unwrap();
    assert!(
        inactive["inactive_findings"]
            .as_array()
            .unwrap()
            .iter()
            .any(|r| r["finding"]["finding_id"] == stable)
    );
}
#[test]
fn quality_background_updates_without_requests_and_stops_on_drop() {
    use std::time::{Duration, Instant};
    let (repository, state, runtime) = quality_runtime();
    let worker = runtime.start_quality_worker(repository.path(), None);
    let wait = |predicate: &dyn Fn(&serde_json::Value) -> bool| {
        let deadline = Instant::now() + Duration::from_secs(20);
        loop {
            if let Ok(bytes) = fs::read(state.path().join("quality-candidates-v1.json"))
                && let Ok(v) = serde_json::from_slice(&bytes)
                && predicate(&v)
            {
                return v;
            }
            assert!(Instant::now() < deadline, "worker timeout");
            std::thread::sleep(Duration::from_millis(100));
        }
    };
    wait(&|v| v["version"] == "quality-index-v3");
    let file = repository.path().join("service.ts");
    let mut source = fs::read_to_string(&file).unwrap();
    source.push_str("\nconst workerEndpoint = 'https://worker.example.invalid';\n");
    fs::write(file, source).unwrap();
    let result = wait(&|v| {
        v["candidates"].as_array().is_some_and(|cs| {
            cs.iter()
                .any(|c| c["evidence"]["binding"] == "workerEndpoint")
        })
    });
    assert_eq!(result["analysis"]["parsed_files"], 1);
    assert!(result["analysis"]["reused_files"].as_u64().unwrap() >= 2);
    let start = Instant::now();
    drop(worker);
    assert!(start.elapsed() < Duration::from_secs(3));
}
#[test]
fn quality_corrupt_status_file_is_not_silently_overwritten() {
    use serde_json::json;
    let (repository, state, runtime) = quality_runtime();
    let path = state.path().join("quality-finding-states-v1.json");
    fs::write(&path, b"{broken").unwrap();
    assert_eq!(
        runtime
            .quality_tool(repository.path(), "list_quality_candidates", json!({}))
            .unwrap_err()
            .code(),
        "cgrx.quality_state_corrupt"
    );
    assert_eq!(fs::read(path).unwrap(), b"{broken");
}

#[test]
fn quality_incremental_cache_is_redacted_and_malformed_sites_are_reparsed() {
    use serde_json::json;
    let (repository, state, mut runtime) = quality_runtime();
    runtime
        .quality_tool(repository.path(), "list_quality_candidates", json!({}))
        .unwrap();
    let memo = state.path().join("quality-file-facts-v2.json");
    let bytes = fs::read(&memo).unwrap();
    assert!(!String::from_utf8_lossy(&bytes).contains("fixture-secret-not-real"));
    let mut data: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    data["secrets.ts"]["sites"][0]["start"] = json!("corrupt offset");
    fs::write(&memo, serde_json::to_vec(&data).unwrap()).unwrap();
    let file = repository.path().join("caller.ts");
    fs::write(
        &file,
        format!("// change\n{}", fs::read_to_string(&file).unwrap()),
    )
    .unwrap();
    runtime.refresh(repository.path()).unwrap();
    let list = runtime
        .quality_tool(
            repository.path(),
            "list_quality_candidates",
            json!({"limit":100}),
        )
        .unwrap();
    assert_eq!(list["analysis"]["parsed_files"], 2);
    assert!(list["analysis"]["reused_files"].as_u64().unwrap() >= 1);
}

#[test]
fn quality_can_mark_fixed_by_stable_id_after_the_code_is_fixed() {
    use serde_json::json;
    let (repository, _state, mut runtime) = quality_runtime();
    let list = runtime
        .quality_tool(
            repository.path(),
            "list_quality_candidates",
            json!({"limit":100}),
        )
        .unwrap();
    let c = list["candidates"]
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["evidence"]["rule"] == "HARDCODED_ENDPOINT_OR_PATH")
        .unwrap();
    let file = repository.path().join("service.ts");
    fs::write(
        &file,
        fs::read_to_string(&file)
            .unwrap()
            .replace("https://example.invalid/api", "configured-at-runtime"),
    )
    .unwrap();
    runtime.refresh(repository.path()).unwrap();
    let fixed=runtime.quality_tool(repository.path(),"update_quality_candidate_status",json!({"finding_id":c["finding_id"],"status":"fixed","expected_version":0,"reason":"literal removed from code"})).unwrap();
    assert_eq!(fixed["finding"]["status"], "fixed");
    assert_eq!(fixed["still_detected"], false);
    assert_eq!(fixed["finding"]["version"], 1);
}

#[test]
fn quality_reachability_retains_public_chains_and_groups_private_cycles() {
    use serde_json::json;
    let repo = TestDirectory::new("reachability");
    let state = TestDirectory::new("reachability-state");
    git(repo.path(), &["init", "-q"]);
    git(
        repo.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repo.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(repo.path().join("a.ts"), "export function entry() { return retained(); }\nfunction retained() { return 1; }\nfunction orphanA() { return orphanB(); }\nfunction orphanB() { return orphanA(); }\n").unwrap();
    git(repo.path(), &["add", "."]);
    git(repo.path(), &["commit", "-qm", "fixture"]);
    Runtime::index(repo.path(), state.path()).unwrap();
    let runtime = Runtime::open(state.path()).unwrap();
    let result = runtime
        .quality_tool(
            repo.path(),
            "list_quality_candidates",
            json!({"kind":"dead_code","limit":100}),
        )
        .unwrap();
    let candidates = result["candidates"].as_array().unwrap();
    assert!(!candidates.is_empty(), "{result}");
    let text = serde_json::to_string(candidates).unwrap();
    assert!(!text.contains("\"symbol\":\"retained\""), "{text}");
    assert!(!text.contains("\"symbol\":\"entry\""), "{text}");
    assert!(
        candidates.iter().any(|c| c["evidence"]["members"]
            .as_array()
            .is_some_and(|m| m.len() == 2)),
        "{result}"
    );
}
