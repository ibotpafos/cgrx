use std::fs;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{Shutdown, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

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

struct Server {
    child: Child,
    address: String,
    token: String,
}

impl Drop for Server {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

fn git(root: &Path, args: &[&str]) {
    assert!(
        Command::new("git")
            .args(args)
            .current_dir(root)
            .status()
            .expect("git executable")
            .success()
    );
}

fn start_server() -> (TestDirectory, Server) {
    let repository = TestDirectory::new("visualizer-repository");
    git(repository.path(), &["init", "-q", "-b", "main"]);
    git(
        repository.path(),
        &["config", "user.email", "test@example.invalid"],
    );
    git(repository.path(), &["config", "user.name", "CGRX Test"]);
    fs::write(
        repository.path().join("main.rs"),
        "fn target() {}\nfn selected() { target(); }\n",
    )
    .expect("write source");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "fixture"]);
    git(repository.path(), &["checkout", "-qb", "feature"]);
    fs::write(repository.path().join("feature.rs"), "fn feature() {}\n")
        .expect("write feature source");
    fs::write(repository.path().join("large.txt"), "x".repeat(300_000))
        .expect("write large diff fixture");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "feature commit"]);
    git(repository.path(), &["checkout", "-q", "main"]);
    fs::write(
        repository.path().join("main_only.rs"),
        "fn main_only() {}\n",
    )
    .expect("write main source");
    git(repository.path(), &["add", "."]);
    git(repository.path(), &["commit", "-qm", "main commit"]);
    git(
        repository.path(),
        &["merge", "-q", "--no-ff", "feature", "-m", "merge feature"],
    );

    let server = launch_server(repository.path(), repository.path());
    (repository, server)
}

fn launch_server(root: &Path, projects_dir: &Path) -> Server {
    let mut child = Command::new(env!("CARGO_BIN_EXE_cgrx"))
        .args(["visualize", "--root"])
        .arg(root)
        .arg("--projects-dir")
        .arg(projects_dir)
        .args(["--port", "0", "--no-open"])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("start visualizer");
    let mut stdout = BufReader::new(child.stdout.take().expect("stdout"));
    let mut line = String::new();
    stdout.read_line(&mut line).expect("startup line");
    let url = line
        .trim()
        .strip_prefix("visualizer_url=")
        .expect("structured startup URL");
    let (origin, token) = url.split_once("/#token=").expect("capability URL fragment");
    assert!(origin.starts_with("http://127.0.0.1:"), "{origin}");
    assert_eq!(token.len(), 64);
    Server {
        child,
        address: origin.trim_start_matches("http://").to_owned(),
        token: token.to_owned(),
    }
}

fn request(server: &Server, method: &str, path: &str, authorized: bool) -> String {
    let deadline = std::time::Instant::now() + Duration::from_secs(20);
    loop {
        let response = request_once(server, method, path, authorized);
        if !response.starts_with("HTTP/1.1 202") {
            return response;
        }
        assert!(
            std::time::Instant::now() < deadline,
            "timed out: {path}: {response}"
        );
        std::thread::sleep(Duration::from_millis(25));
    }
}

fn request_once(server: &Server, method: &str, path: &str, authorized: bool) -> String {
    let mut stream = TcpStream::connect(&server.address).expect("connect visualizer");
    stream
        .set_read_timeout(Some(Duration::from_secs(3)))
        .expect("read timeout");
    let capability = if authorized {
        format!("X-CGRX-Token: {}\r\n", server.token)
    } else {
        String::new()
    };
    write!(
        stream,
        "{method} {path} HTTP/1.1\r\nHost: {}\r\n{capability}Connection: close\r\n\r\n",
        server.address
    )
    .expect("write request");
    let mut response = String::new();
    stream
        .read_to_string(&mut response)
        .unwrap_or_else(|error| panic!("{method} {path}: {error}"));
    response
}

#[test]
fn disconnected_client_does_not_stop_project_server() {
    let (_repository, server) = start_server();
    let mut stream = TcpStream::connect(&server.address).expect("connect visualizer");
    stream
        .set_read_timeout(Some(Duration::from_secs(3)))
        .unwrap();
    write!(
        stream,
        "GET /assets/app.js HTTP/1.1\r\nHost: {}\r\n\r\n",
        server.address
    )
    .unwrap();
    let mut prefix = [0; 64];
    stream.read_exact(&mut prefix).expect("response started");
    // The peer may already have closed after sending the response prefix.
    let _ = stream.shutdown(Shutdown::Both);
    drop(stream);
    let catalogue = request(&server, "GET", "/api/projects", true);
    assert!(catalogue.starts_with("HTTP/1.1 200"), "{catalogue}");
    let status = request(&server, "GET", "/api/status", true);
    assert!(status.starts_with("HTTP/1.1 200"), "{status}");
}

#[test]
fn starts_on_loopback_and_requires_capability() {
    let (_repository, server) = start_server();

    let index = request(&server, "GET", "/", false);
    assert!(index.starts_with("HTTP/1.1 200"), "{index}");
    assert!(index.contains("Content-Security-Policy:"), "{index}");
    assert!(index.contains("Cache-Control: no-store"), "{index}");

    let unauthorized = request(&server, "GET", "/api/status", false);
    assert!(unauthorized.starts_with("HTTP/1.1 401"), "{unauthorized}");

    let authorized = request(&server, "GET", "/api/status", true);
    assert!(authorized.starts_with("HTTP/1.1 200"), "{authorized}");
    assert!(authorized.contains("\"snapshot\""), "{authorized}");

    let post = request(&server, "POST", "/api/status", true);
    assert!(post.starts_with("HTTP/1.1 405"), "{post}");
}

#[test]
fn read_only_api_routes_share_the_current_snapshot() {
    let (_repository, server) = start_server();
    let paths = [
        "/api/repository-graph?node_limit=5000&edge_limit=30000",
        "/api/runtime-status",
        "/api/search?q=selected&scope=**&limit=8",
        "/api/graph?symbol=selected&path=main.rs&direction=both&depth=1&node_limit=80&edge_limit=160",
        "/api/refactors?scope=**&language=rust&min_score=760&limit=8",
        "/api/change-plan?limit=20",
        "/api/architecture?scope=**&package_depth=1&limit=20",
        "/api/snippet?symbol=selected&path=main.rs",
        "/api/git-history?limit=200",
    ];
    let mut snapshots = Vec::new();
    for path in paths {
        let response = request(&server, "GET", path, true);
        assert!(response.starts_with("HTTP/1.1 200"), "{path}: {response}");
        let body = response.split_once("\r\n\r\n").expect("HTTP body").1;
        let value: serde_json::Value = serde_json::from_str(body).expect("JSON response");
        snapshots.push(value["snapshot"].clone());
    }
    assert!(snapshots.windows(2).all(|pair| pair[0] == pair[1]));
}

#[test]
fn serves_snapshot_bound_change_missions() {
    let (_repository, server) = start_server();
    let response = request(&server, "GET", "/api/change-plan?limit=20", true);
    assert!(response.starts_with("HTTP/1.1 200"), "{response}");
    let body = response.split_once("\r\n\r\n").expect("HTTP body").1;
    let value: serde_json::Value = serde_json::from_str(body).expect("JSON response");
    assert_eq!(value["change_plan"]["algorithm"], "change_missions_v1");
    assert_eq!(value["change_plan"]["llm_used"], false);
    assert_eq!(
        value["change_plan"]["agent_handoff"]["schema_version"],
        "cgrx.agent.change-missions.v1"
    );

    let invalid = request(&server, "GET", "/api/change-plan?limit=51", true);
    assert!(invalid.starts_with("HTTP/1.1 400"), "{invalid}");
    assert!(invalid.contains("cgrx.invalid_arguments"), "{invalid}");
}

#[test]
fn serves_runtime_overlay_asset_and_validates_evidence_selector() {
    let (_repository, server) = start_server();
    let asset = request(&server, "GET", "/assets/runtime-evidence.js", false);
    assert!(asset.starts_with("HTTP/1.1 200"), "{asset}");
    assert!(asset.contains("text/javascript"), "{asset}");

    let observed = request(
        &server,
        "GET",
        "/api/graph?symbol=selected&path=main.rs&direction=both&depth=1&node_limit=80&edge_limit=160&evidence=observed",
        true,
    );
    assert!(observed.starts_with("HTTP/1.1 200"), "{observed}");
    assert!(observed.contains("\"evidence\":\"observed\""), "{observed}");

    let invalid = request(
        &server,
        "GET",
        "/api/graph?symbol=selected&path=main.rs&evidence=magic",
        true,
    );
    assert!(invalid.starts_with("HTTP/1.1 400"), "{invalid}");
    assert!(invalid.contains("cgrx.invalid_arguments"), "{invalid}");
}

#[test]
fn serves_bounded_git_history_in_web_git_graph_protocol_shape() {
    let (_repository, server) = start_server();
    let response = request(&server, "GET", "/api/git-history?limit=10", true);
    assert!(response.starts_with("HTTP/1.1 200"), "{response}");
    let body = response.split_once("\r\n\r\n").expect("HTTP body").1;
    let value: serde_json::Value = serde_json::from_str(body).expect("JSON response");
    let commit = &value["commits"][0];
    assert_eq!(commit["message"], "merge feature");
    assert_eq!(commit["kind"], "commit");
    assert_eq!(commit["oid"].as_str().expect("oid").len(), 40);
    assert!(commit["parents"].is_array());
    assert_eq!(commit["parents"].as_array().expect("parents").len(), 2);
    assert_eq!(commit["author"]["name"], "CGRX Test");
    assert_eq!(value["head"], commit["oid"]);
    assert_eq!(value["hasMore"], false);
    assert_eq!(value["repositoryId"], "local");
    assert!(
        value["refs"]
            .as_array()
            .is_some_and(|refs| !refs.is_empty())
    );

    let bounded = request(&server, "GET", "/api/git-history?limit=1", true);
    let bounded_body = bounded.split_once("\r\n\r\n").expect("HTTP body").1;
    let bounded_value: serde_json::Value =
        serde_json::from_str(bounded_body).expect("JSON response");
    assert_eq!(
        bounded_value["commits"].as_array().expect("commits").len(),
        1
    );
    assert_eq!(bounded_value["hasMore"], true);
    assert_eq!(bounded_value["cursor"], "1");

    let selected_ref = request(
        &server,
        "GET",
        "/api/git-history?limit=10&ref=feature",
        true,
    );
    let selected_ref_body = selected_ref.split_once("\r\n\r\n").expect("HTTP body").1;
    let selected_ref_value: serde_json::Value =
        serde_json::from_str(selected_ref_body).expect("selected ref JSON");
    assert_eq!(
        selected_ref_value["commits"][0]["message"],
        "feature commit"
    );

    let invalid = request(&server, "GET", "/api/git-history?limit=501", true);
    assert!(invalid.starts_with("HTTP/1.1 400"), "{invalid}");
    assert!(invalid.contains("cgrx.invalid_arguments"), "{invalid}");
}

#[test]
fn serves_lazy_commit_details_and_bounded_file_diff() {
    let (_repository, server) = start_server();
    let history = request(&server, "GET", "/api/git-history?limit=10", true);
    let history_body = history.split_once("\r\n\r\n").expect("HTTP body").1;
    let history_value: serde_json::Value =
        serde_json::from_str(history_body).expect("history JSON");
    let head = history_value["commits"][0]["oid"]
        .as_str()
        .expect("head oid");
    let base = history_value["commits"][0]["parents"][0]
        .as_str()
        .expect("first parent");

    let details = request(&server, "GET", &format!("/api/git-commit?oid={head}"), true);
    assert!(details.starts_with("HTTP/1.1 200"), "{details}");
    let details_body = details.split_once("\r\n\r\n").expect("HTTP body").1;
    let details_value: serde_json::Value =
        serde_json::from_str(details_body).expect("details JSON");
    assert_eq!(details_value["commit"]["oid"], head);
    assert_eq!(details_value["body"], "merge feature\n");
    assert!(details_value["changes"].as_array().is_some_and(|changes| {
        changes
            .iter()
            .any(|change| change["path"] == "feature.rs" && change["kind"] == "add")
    }));

    let diff = request(
        &server,
        "GET",
        &format!("/api/git-diff?base={base}&head={head}&path=feature.rs&context=2"),
        true,
    );
    assert!(diff.starts_with("HTTP/1.1 200"), "{diff}");
    let diff_body = diff.split_once("\r\n\r\n").expect("HTTP body").1;
    let diff_value: serde_json::Value = serde_json::from_str(diff_body).expect("diff JSON");
    assert!(
        diff_value["patch"]
            .as_str()
            .is_some_and(|patch| patch.contains("+fn feature() {}"))
    );
    assert_eq!(diff_value["truncated"], false);

    let large_diff = request(
        &server,
        "GET",
        &format!("/api/git-diff?base={base}&head={head}&path=large.txt"),
        true,
    );
    assert!(large_diff.starts_with("HTTP/1.1 200"), "{large_diff}");
    let large_body = large_diff.split_once("\r\n\r\n").expect("HTTP body").1;
    let large_value: serde_json::Value = serde_json::from_str(large_body).expect("large JSON");
    assert_eq!(large_value["truncated"], true);
    assert!(
        large_value["patch"]
            .as_str()
            .is_some_and(|patch| patch.ends_with("… output truncated by CGRX …\n"))
    );

    let invalid = request(
        &server,
        "GET",
        &format!("/api/git-diff?base={base}&head={head}&path=../feature.rs"),
        true,
    );
    assert!(invalid.starts_with("HTTP/1.1 400"), "{invalid}");
    assert!(invalid.contains("cgrx.invalid_path"), "{invalid}");
}

#[test]
fn http_boundary_rejects_malformed_and_traversal_requests() {
    let (_repository, server) = start_server();

    let malformed = request(&server, "GET", "/api/search?q=%ZZ", true);
    assert!(malformed.starts_with("HTTP/1.1 400"), "{malformed}");
    assert!(malformed.contains("cgrx.invalid_query"), "{malformed}");

    let traversal = request(
        &server,
        "GET",
        "/api/snippet?symbol=selected&path=../main.rs",
        true,
    );
    assert!(traversal.starts_with("HTTP/1.1 400"), "{traversal}");
    assert!(traversal.contains("cgrx.invalid_path"), "{traversal}");

    let head = request(&server, "HEAD", "/api/status", true);
    assert!(head.starts_with("HTTP/1.1 200"), "{head}");
    assert_eq!(head.split_once("\r\n\r\n").expect("HEAD response").1, "");

    let mut stream = TcpStream::connect(&server.address).expect("connect visualizer");
    write!(stream, "GET /{} HTTP/1.1\r\n\r\n", "x".repeat(9_000)).expect("write oversized request");
    stream
        .shutdown(Shutdown::Write)
        .expect("finish oversized request");
    let mut oversized = String::new();
    let _ = stream.read_to_string(&mut oversized);
    assert!(oversized.starts_with("HTTP/1.1 413"), "{oversized}");
}

#[test]
fn serves_embedded_assets_with_security_headers() {
    let (_repository, server) = start_server();
    for (path, content_type, marker) in [
        ("/", "text/html", "id=\"root\""),
        ("/assets/styles.css", "text/css", "--surface"),
        ("/assets/layout.js", "text/javascript", "layoutGraph"),
        ("/assets/layout-worker.js", "text/javascript", "postMessage"),
        (
            "/assets/state.js",
            "text/javascript",
            "projectArchitectureFuture",
        ),
        (
            "/assets/git-history.js",
            "text/javascript",
            "pageForGitGraph",
        ),
        (
            "/assets/vendor/web-git-graph.js",
            "text/javascript",
            "web-git-graph",
        ),
        (
            "/assets/app.js",
            "text/javascript",
            "Three-dimensional repository dependency map",
        ),
    ] {
        let response = request(&server, "GET", path, false);
        assert!(response.starts_with("HTTP/1.1 200"), "{path}: {response}");
        assert!(
            response.contains(&format!("Content-Type: {content_type}")),
            "{path}: {response}"
        );
        assert!(
            response.contains("Content-Security-Policy:"),
            "{path}: {response}"
        );
        assert!(response.contains(marker), "{path}: {response}");
    }
}

#[test]
fn repository_graph_route_is_bounded_and_capability_protected() {
    let (_repository, server) = start_server();
    assert!(request(&server, "GET", "/api/repository-graph", false).starts_with("HTTP/1.1 401"));
    for query in [
        "node_limit=0",
        "node_limit=20001",
        "edge_limit=120001",
        "edge_limit=oops",
    ] {
        assert!(
            request(
                &server,
                "GET",
                &format!("/api/repository-graph?{query}"),
                true
            )
            .starts_with("HTTP/1.1 400")
        );
    }
}

#[test]
fn projects_catalogue_routes_isolated_graphs_and_recovers_after_cache_eviction() {
    let directory = TestDirectory::new("project-catalogue");
    for name in ["alpha", "beta", "gamma", "delta", "epsilon", ".hidden"] {
        let root = directory.path().join(name);
        fs::create_dir(&root).unwrap();
        git(&root, &["init", "-q"]);
        git(&root, &["config", "user.email", "test@example.invalid"]);
        git(&root, &["config", "user.name", "CGRX Test"]);
        fs::write(
            root.join("main.rs"),
            format!("fn only_{}() {{}}\n", name.trim_start_matches('.')),
        )
        .unwrap();
        git(&root, &["add", "."]);
        git(&root, &["commit", "-qm", name]);
    }
    fs::create_dir(directory.path().join("not-a-repo")).unwrap();
    let server = launch_server(&directory.path().join("alpha"), directory.path());
    assert!(request(&server, "GET", "/api/projects", false).starts_with("HTTP/1.1 401"));
    let read_json = |path: &str| -> serde_json::Value {
        let response = request(&server, "GET", path, true);
        assert!(response.starts_with("HTTP/1.1 200"), "{response}");
        serde_json::from_str(response.split_once("\r\n\r\n").unwrap().1).unwrap()
    };
    let catalogue = loop {
        let catalogue = read_json("/api/projects");
        if catalogue["discovering"] == false {
            break catalogue;
        }
        std::thread::sleep(Duration::from_millis(25));
    };
    let projects = catalogue["projects"].as_array().unwrap();
    assert_eq!(projects.len(), 5);
    assert!(
        projects
            .iter()
            .all(|p| !p["name"].as_str().unwrap().starts_with('.'))
    );
    assert!(
        projects
            .iter()
            .filter(|p| p["name"] != "alpha")
            .all(|p| p["indexed"] == false)
    );
    for project in projects {
        let id = project["id"].as_str().unwrap();
        let graph = read_json(&format!("/api/repository-graph?project={id}"));
        let expected = format!("only_{}", project["name"].as_str().unwrap());
        assert_eq!(graph["nodes"].as_array().unwrap().len(), 1);
        assert_eq!(graph["nodes"][0]["symbol"], expected);
        assert_eq!(
            read_json(&format!("/api/status?project={id}"))["repo"],
            project["path"]
        );
    }
    // Alpha was evicted by the bounded cache. A request without a project still
    // selects the launch repository, independent of the last browser request.
    assert_eq!(
        read_json("/api/repository-graph")["nodes"][0]["symbol"],
        "only_alpha"
    );
    assert!(request(&server, "GET", "/api/status?project=/tmp", true).starts_with("HTTP/1.1 404"));
    // An uninitialized repository remains listed, but failure cannot switch the
    // current/default graph or make the project chooser unavailable.
    let empty = directory.path().join("empty");
    fs::create_dir(&empty).unwrap();
    git(&empty, &["init", "-q"]);
    read_json("/api/projects?refresh=1");
    let updated = loop {
        let catalogue = read_json("/api/projects");
        if catalogue["discovering"] == false {
            break catalogue;
        }
        std::thread::sleep(Duration::from_millis(25));
    };
    let empty_id = updated["projects"]
        .as_array()
        .unwrap()
        .iter()
        .find(|p| p["name"] == "empty")
        .unwrap()["id"]
        .as_str()
        .unwrap();
    assert!(
        request(
            &server,
            "GET",
            &format!("/api/status?project={empty_id}"),
            true
        )
        .starts_with("HTTP/1.1 503")
    );
    assert_eq!(
        read_json("/api/projects")["projects"]
            .as_array()
            .unwrap()
            .len(),
        6
    );
    assert_eq!(
        read_json("/api/repository-graph")["nodes"][0]["symbol"],
        "only_alpha"
    );
}

#[test]
fn incomplete_client_does_not_block_assets_catalogue_or_project_status() {
    let (_repository, server) = start_server();
    let mut slow = TcpStream::connect(&server.address).unwrap();
    write!(slow, "GET / HTTP/1.1\r\nHost: localhost\r\n").unwrap();
    for path in ["/assets/styles.css", "/api/projects", "/api/project-status"] {
        let start = std::time::Instant::now();
        let response = request_once(&server, "GET", path, true);
        assert!(response.starts_with("HTTP/1.1 200"), "{path}: {response}");
        // Loose CI timeout; the separate machine report enforces the 200ms p95 SLO.
        assert!(
            start.elapsed() < Duration::from_secs(1),
            "{path} blocked behind an incomplete request"
        );
    }
}

#[test]
fn edge_evidence_requires_exact_project_snapshot() {
    let (_repository, server) = start_server();
    let graph = request(&server, "GET", "/api/repository-graph?format=compact", true);
    let graph: serde_json::Value =
        serde_json::from_str(graph.split_once("\r\n\r\n").unwrap().1).unwrap();
    let edge = &graph["edges"][0];
    let source = &graph["nodes"][edge[0].as_u64().unwrap() as usize][0];
    let target = &graph["nodes"][edge[1].as_u64().unwrap() as usize][0];
    let encode = |s: &str| s.bytes().map(|b| format!("%{b:02X}")).collect::<String>();
    let path = format!(
        "/api/edge-evidence?source={}&target={}&relation={}&snapshot={}",
        source.as_str().unwrap(),
        target.as_str().unwrap(),
        edge[2].as_str().unwrap(),
        encode(&graph["snapshot"].to_string())
    );
    let evidence = request(&server, "GET", &path, true);
    assert!(evidence.starts_with("HTTP/1.1 200"), "{evidence}");
    let stale = request(
        &server,
        "GET",
        "/api/edge-evidence?source=1&target=2&relation=CALLS&snapshot=%7B%7D",
        true,
    );
    assert!(stale.starts_with("HTTP/1.1 409"), "{stale}");
    assert!(request(&server, "GET", &path, false).starts_with("HTTP/1.1 401"));
}

#[test]
fn queued_projects_status_is_read_only_and_runtime_limit_survives_twenty_switches() {
    let directory = TestDirectory::new("bounded-projects");
    for i in 0..6 {
        let root = directory.path().join(format!("p{i}"));
        fs::create_dir(&root).unwrap();
        git(&root, &["init", "-q"]);
        git(&root, &["config", "user.email", "test@example.invalid"]);
        git(&root, &["config", "user.name", "Test"]);
        fs::write(root.join("a.rs"), format!("fn project_{i}() {{}}\n")).unwrap();
        git(&root, &["add", "."]);
        git(&root, &["commit", "-qm", "fixture"]);
    }
    let server = launch_server(&directory.path().join("p0"), directory.path());
    let json = |path: &str| -> serde_json::Value {
        let r = request(&server, "GET", path, true);
        assert!(r.starts_with("HTTP/1.1 200"), "{r}");
        serde_json::from_str(r.split_once("\r\n\r\n").unwrap().1).unwrap()
    };
    let deadline = std::time::Instant::now() + Duration::from_secs(5);
    let catalogue = loop {
        let c = json("/api/projects");
        if c["discovering"] == false {
            break c;
        }
        assert!(std::time::Instant::now() < deadline);
        std::thread::sleep(Duration::from_millis(20));
    };
    let projects = catalogue["projects"].as_array().unwrap();
    for p in projects.iter().skip(1) {
        let status = json(&format!(
            "/api/project-status?project={}",
            p["id"].as_str().unwrap()
        ));
        assert_eq!(status["state"], "queued");
        assert_eq!(status["resources"]["open_runtimes"], 1);
    }
    for i in 0..20 {
        let p = &projects[i % projects.len()];
        let id = p["id"].as_str().unwrap();
        let graph = json(&format!("/api/repository-graph?project={id}"));
        assert_eq!(
            graph["nodes"][0]["symbol"],
            format!("project_{}", i % projects.len())
        );
        let status = json(&format!("/api/project-status?project={id}"));
        assert!(status["resources"]["open_runtimes"].as_u64().unwrap() <= 4);
        assert!(status["resources"]["cache_bytes"].as_u64().unwrap() <= 128 * 1024 * 1024);
    }
}
