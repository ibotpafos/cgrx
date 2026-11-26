use serde_json::{Value, json};
use std::fs;
use std::io::Write;
use std::process::{Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};

struct Fixture(std::path::PathBuf);
impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn check_attachment_failure(multi: bool, blocked: bool) {
    static NEXT: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
    let unique = NEXT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    let dir = std::env::temp_dir().join(format!(
        "cgrx-PRIVATE_PATH-{}-{}-{unique}",
        std::process::id(),
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir_all(&dir).unwrap();
    let fixture = Fixture(dir.canonicalize().unwrap());
    let root = &fixture.0;
    fs::write(root.join("main.rs"), "fn graph_survives() {}\n").unwrap();
    for args in [
        vec!["init", "-q"],
        vec!["add", "."],
        vec!["commit", "-qm", "fixture"],
    ] {
        let output = Command::new("git")
            .args([
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.invalid",
            ])
            .args(args)
            .current_dir(root)
            .env_remove("GIT_CONFIG_COUNT")
            .output()
            .unwrap();
        assert!(output.status.success(), "{output:?}");
    }
    if blocked {
        fs::create_dir(root.join(".cgrx")).unwrap();
        fs::write(root.join(".cgrx/memory"), "PRIVATE_STORE_VALUE").unwrap();
    }
    let log = root.join("usage.jsonl");
    let mut command = Command::new(env!("CARGO_BIN_EXE_cgrx"));
    command.args(["serve", "--toolset", "full", "--response-profile", "full"]);
    if multi {
        command.arg("--multi-repo");
    } else {
        command.arg("--root").arg(root);
    }
    let mut child = command
        .current_dir(root)
        .env_remove("GIT_CONFIG_COUNT")
        .env_remove("CGRX_FAST_ANYTHING_CONFIG")
        .env_remove("CGRX_TOOLSET")
        .env_remove("CGRX_RESPONSE_PROFILE")
        .env(
            "CGRX_MEMORY_EMBEDDINGS",
            if blocked {
                "off"
            } else {
                "PRIVATE_CONFIG_VALUE"
            },
        )
        .env("CGRX_USAGE_LOG", &log)
        .env("CGRX_RESOURCE_DIR", root.join("resources"))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    let requests = [
        ("memory_recall", json!({"repo":root})),
        (
            "search_graph",
            json!({"repo":root,"query":"graph_survives","limit":5}),
        ),
        ("memory_recall", json!({"repo":root})),
    ];
    let mut input = child.stdin.take().unwrap();
    for (id, (name, arguments)) in requests.into_iter().enumerate() {
        writeln!(input, "{}", json!({"jsonrpc":"2.0","id":id,"method":"tools/call","params":{"name":name,"arguments":arguments}})).unwrap();
    }
    drop(input);
    let output = child.wait_with_output().unwrap();
    assert!(output.status.success(), "{output:?}");
    let stdout = String::from_utf8(output.stdout).unwrap();
    let responses: Vec<Value> = stdout
        .lines()
        .map(|line| serde_json::from_str(line).unwrap())
        .collect();
    assert_eq!(responses.len(), 3, "{stdout}");
    for index in [0, 2] {
        let error = &responses[index]["error"];
        assert_eq!(error["data"]["code"], "cgrx.memory_unavailable", "{error}");
        assert_eq!(
            error["data"]["io_kind"],
            if blocked {
                "NotADirectory"
            } else {
                "InvalidInput"
            },
            "{error}"
        );
        assert!(
            error["message"]
                .as_str()
                .unwrap()
                .contains("attachment failed"),
            "{error}"
        );
        let text = error.to_string();
        for private in [
            "PRIVATE_PATH",
            "PRIVATE_STORE_VALUE",
            "PRIVATE_CONFIG_VALUE",
        ] {
            assert!(!text.contains(private), "{text}");
        }
    }
    let graph = &responses[1];
    assert!(graph.get("error").is_none(), "{graph}");
    assert!(
        graph["result"].to_string().contains("graph_survives"),
        "{graph}"
    );
    let usage = fs::read_to_string(log).unwrap();
    let stderr = String::from_utf8(output.stderr).unwrap();
    for private in [
        "PRIVATE_PATH",
        "PRIVATE_STORE_VALUE",
        "PRIVATE_CONFIG_VALUE",
        "graph_survives",
    ] {
        assert!(!usage.contains(private), "{usage}");
        assert!(!stderr.contains(private), "{stderr}");
    }
}

#[test]
fn blocked_store_keeps_single_repo_graph_usable() {
    check_attachment_failure(false, true);
}
#[test]
fn blocked_store_keeps_multi_repo_graph_usable() {
    check_attachment_failure(true, true);
}
#[test]
fn invalid_configuration_keeps_single_repo_graph_usable() {
    check_attachment_failure(false, false);
}
#[test]
fn invalid_configuration_keeps_multi_repo_graph_usable() {
    check_attachment_failure(true, false);
}

#[test]
fn multi_repo_permission_guard_precedes_admission_and_redacts_unknown_tools() {
    let root = std::env::temp_dir().join(format!("cgrx-permission-{}", std::process::id()));
    fs::create_dir(&root).unwrap();
    let fixture = Fixture(root.canonicalize().unwrap());
    let root = &fixture.0;
    let resource = root.join("blocked-resources");
    fs::write(&resource, "blocked").unwrap();
    let log = root.join("usage.jsonl");
    let mut child = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["serve", "--multi-repo", "--toolset", "minimal"])
        .env_remove("GIT_CONFIG_COUNT")
        .env_remove("CGRX_FAST_ANYTHING_CONFIG")
        .env_remove("CGRX_TOOLSET")
        .env("CGRX_RESOURCE_DIR", resource)
        .env("CGRX_USAGE_LOG", &log)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    let mut input = child.stdin.take().unwrap();
    for (id, name) in ["PRIVATE_TOOL_SENTINEL", "memory_record", "status"]
        .into_iter()
        .enumerate()
    {
        writeln!(input, "{}", json!({"jsonrpc":"2.0","id":id,"method":"tools/call","params":{"name":name,"arguments":{"repo":root.join("PRIVATE_REPO_SENTINEL"),"fact":"PRIVATE_FACT_SENTINEL"}}})).unwrap();
    }
    drop(input);
    let output = child.wait_with_output().unwrap();
    assert!(output.status.success(), "{output:?}");
    let responses: Vec<Value> = String::from_utf8(output.stdout)
        .unwrap()
        .lines()
        .map(|line| serde_json::from_str(line).unwrap())
        .collect();
    assert_eq!(responses.len(), 3);
    for response in &responses[..2] {
        assert_eq!(
            response["error"]["data"]["code"], "cgrx.tool_not_found",
            "{response}"
        );
    }
    assert_eq!(
        responses[2]["error"]["data"]["code"],
        "cgrx.resource_unavailable"
    );
    assert_eq!(responses[2]["error"]["data"]["request_started"], false);
    assert!(!root.join("PRIVATE_REPO_SENTINEL").exists());
    let usage = fs::read_to_string(log).unwrap();
    assert!(usage.contains("unknown"), "{usage}");
    for private in [
        "PRIVATE_TOOL_SENTINEL",
        "PRIVATE_REPO_SENTINEL",
        "PRIVATE_FACT_SENTINEL",
    ] {
        assert!(!usage.contains(private), "{usage}");
    }
}
