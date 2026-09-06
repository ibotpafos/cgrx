mod assets;
mod http;

use std::fs::File;
use std::io;
use std::io::{Read, Write};
use std::net::{Ipv4Addr, TcpListener};
use std::path::{Component, Path, PathBuf};
use std::process::Command;
use std::time::Duration;

use cgrx_cli::{GraphDirection, GraphViewRequest, Runtime, RuntimeError};
use cgrx_core::{RelationKind, Scope};
use serde_json::json;

use self::http::{HttpRequest, HttpResponse};
use super::{managed_state_path, open_managed_runtime};

pub(super) fn run(args: &[String]) -> Result<(), String> {
    let options = Options::parse(args)?;
    let root = options
        .root
        .canonicalize()
        .map_err(|error| error.to_string())?;
    let state = managed_state_path(&root)?;
    let runtime = open_managed_runtime(&root, &state)?;
    let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, options.port))
        .map_err(|error| error.to_string())?;
    let address = listener.local_addr().map_err(|error| error.to_string())?;
    let token = capability_token()?;
    let url = format!("http://127.0.0.1:{}/#token={token}", address.port());
    println!("visualizer_url={url}");
    io::stdout().flush().map_err(|error| error.to_string())?;
    if options.open_browser {
        open_browser(&url)?;
    }

    let mut server = Visualizer {
        root,
        state,
        runtime,
        token,
    };
    for connection in listener.incoming() {
        let mut connection = connection.map_err(|error| error.to_string())?;
        connection
            .set_read_timeout(Some(Duration::from_secs(3)))
            .map_err(|error| error.to_string())?;
        connection
            .set_write_timeout(Some(Duration::from_secs(3)))
            .map_err(|error| error.to_string())?;
        let response = match HttpRequest::read(&mut connection) {
            Ok(request) => server.handle(&request),
            Err(response) => response,
        };
        response.write(&mut connection)?;
    }
    Ok(())
}

struct Options {
    root: PathBuf,
    port: u16,
    open_browser: bool,
}

impl Options {
    fn parse(args: &[String]) -> Result<Self, String> {
        let mut root = PathBuf::from(".");
        let mut port = 0_u16;
        let mut open_browser = true;
        let mut index = 0;
        while index < args.len() {
            match args[index].as_str() {
                "--root" | "--repo" => {
                    index += 1;
                    root = PathBuf::from(
                        args.get(index)
                            .ok_or_else(|| "--root requires a path".to_owned())?,
                    );
                }
                "--port" => {
                    index += 1;
                    port = args
                        .get(index)
                        .ok_or_else(|| "--port requires an integer".to_owned())?
                        .parse()
                        .map_err(|_| "--port must be an integer from 0 to 65535".to_owned())?;
                }
                "--no-open" => open_browser = false,
                argument => return Err(format!("unknown visualize argument {argument}")),
            }
            index += 1;
        }
        Ok(Self {
            root,
            port,
            open_browser,
        })
    }
}

struct Visualizer {
    root: PathBuf,
    state: PathBuf,
    runtime: Runtime,
    token: String,
}

impl Visualizer {
    fn handle(&mut self, request: &HttpRequest) -> HttpResponse {
        if !matches!(request.method.as_str(), "GET" | "HEAD") {
            return HttpResponse::json_error(
                405,
                "cgrx.method_not_allowed",
                "GET or HEAD required",
            )
            .with_header("Allow", "GET, HEAD");
        }
        let head = request.method == "HEAD";
        if request.path.starts_with("/api/") && request.header("x-cgrx-token") != Some(&self.token)
        {
            return HttpResponse::json_error(
                401,
                "cgrx.invalid_capability",
                "a valid X-CGRX-Token header is required",
            )
            .head(head);
        }
        if request.path.starts_with("/api/")
            && let Err(error) = self.refresh()
        {
            return HttpResponse::json_error(500, "cgrx.refresh_failed", &error).head(head);
        }
        let response = match request.path.as_str() {
            "/" | "/index.html" => HttpResponse::html(assets::INDEX),
            "/assets/styles.css" => HttpResponse::css(assets::STYLES),
            "/assets/layout.js" => HttpResponse::javascript(assets::LAYOUT),
            "/assets/state.js" => HttpResponse::javascript(assets::STATE),
            "/assets/git-history.js" => HttpResponse::javascript(assets::GIT_HISTORY),
            "/assets/vendor/web-git-graph.js" => HttpResponse::javascript(assets::WEB_GIT_GRAPH),
            "/assets/app.js" => HttpResponse::javascript(assets::APP),
            "/api/status" => self.status(),
            "/api/search" => self.api_result(self.search(request)),
            "/api/graph" => self.api_result(self.graph(request)),
            "/api/architecture" => self.api_result(self.architecture(request)),
            "/api/refactors" => self.api_result(self.refactors(request)),
            "/api/snippet" => self.api_result(self.snippet(request)),
            "/api/git-history" => self.api_result(self.git_history(request)),
            _ => HttpResponse::json_error(404, "cgrx.not_found", "route not found"),
        };
        response.head(head)
    }

    fn status(&mut self) -> HttpResponse {
        HttpResponse::json(json!({
            "snapshot":self.runtime.snapshot(),
            "repo":self.root,
            "graph":{
                "nodes":self.runtime.graph_node_count(),
                "edges":self.runtime.graph_edge_count()
            },
            "changed_paths":self.runtime.changed_paths(),
            "freshness":"WATCHED"
        }))
    }

    fn api_result(&self, result: Result<serde_json::Value, RuntimeError>) -> HttpResponse {
        match result {
            Ok(value) => HttpResponse::json(value),
            Err(error) => HttpResponse::json_error(400, error.code(), &error.to_string()),
        }
    }

    fn search(&self, request: &HttpRequest) -> Result<serde_json::Value, RuntimeError> {
        self.runtime.search_graph_filtered(
            required(request, "q")?,
            &scope(request, 1),
            number(request, "limit", 8)?,
            None,
            false,
        )
    }

    fn graph(&self, request: &HttpRequest) -> Result<serde_json::Value, RuntimeError> {
        let direction = match request.query("direction").unwrap_or("both") {
            "callers" => GraphDirection::Callers,
            "callees" => GraphDirection::Callees,
            "both" => GraphDirection::Both,
            _ => {
                return Err(RuntimeError::public(
                    "cgrx.invalid_arguments",
                    "direction must be callers, callees, or both",
                ));
            }
        };
        let depth = number::<u8>(request, "depth", 1)?;
        self.runtime.graph_view(GraphViewRequest {
            symbol: required(request, "symbol")?.to_owned(),
            path: optional_path(request)?.map(str::to_owned),
            direction,
            depth,
            scope: scope(request, depth),
            node_limit: number(request, "node_limit", 80)?,
            edge_limit: number(request, "edge_limit", 160)?,
        })
    }

    fn refactors(&self, request: &HttpRequest) -> Result<serde_json::Value, RuntimeError> {
        self.runtime.suggest_refactors(
            &scope(request, 1),
            request.query("language").filter(|value| !value.is_empty()),
            number(request, "min_score", 760)?,
            number(request, "limit", 8)?,
        )
    }

    fn architecture(&self, request: &HttpRequest) -> Result<serde_json::Value, RuntimeError> {
        self.runtime.get_architecture(
            &scope(request, 4),
            number(request, "package_depth", 2)?,
            number(request, "limit", 50)?,
        )
    }

    fn snippet(&self, request: &HttpRequest) -> Result<serde_json::Value, RuntimeError> {
        self.runtime
            .get_code_snippet(required(request, "symbol")?, optional_path(request)?)
    }

    fn git_history(&self, request: &HttpRequest) -> Result<serde_json::Value, RuntimeError> {
        let limit = number::<usize>(request, "limit", 200)?;
        if !(1..=500).contains(&limit) {
            return Err(RuntimeError::public(
                "cgrx.invalid_arguments",
                "query parameter limit must be from 1 to 500",
            ));
        }
        let output = Command::new(cgrx_cli::git_executable())
            .args([
                "log",
                "-z",
                "--all",
                "--topo-order",
                &format!("--max-count={}", limit + 1),
                "--format=%H%x00%P%x00%an%x00%aI%x00%cI%x00%s",
            ])
            .current_dir(&self.root)
            .output()
            .map_err(|error| git_history_error("read commit history", error))?;
        if !output.status.success() {
            return Err(git_output_error("read commit history", &output.stderr));
        }
        let fields = output.stdout.split(|byte| *byte == 0).collect::<Vec<_>>();
        let mut commits = Vec::new();
        for record in fields.chunks(6).take(limit) {
            if record.len() < 6 || record[0].is_empty() {
                continue;
            }
            commits.push(json!({
                "oid":utf8(record[0], "commit id")?,
                "parents":utf8(record[1], "commit parents")?.split_whitespace().collect::<Vec<_>>(),
                "message":utf8(record[5], "commit subject")?,
                "kind":"commit",
                "author":{"name":utf8(record[2], "commit author")?},
                "authoredAt":utf8(record[3], "author date")?,
                "committedAt":utf8(record[4], "commit date")?
            }));
        }
        let has_more = fields
            .chunks(6)
            .filter(|record| !record[0].is_empty())
            .count()
            > limit;
        let refs = self.git_refs()?;
        let head_output = Command::new(cgrx_cli::git_executable())
            .args(["rev-parse", "HEAD"])
            .current_dir(&self.root)
            .output()
            .map_err(|error| git_history_error("read HEAD", error))?;
        if !head_output.status.success() {
            return Err(git_output_error("read HEAD", &head_output.stderr));
        }
        let head = utf8(&head_output.stdout, "HEAD")?.trim();
        let repository_name = self
            .root
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("repository");
        Ok(json!({
            "snapshot":self.runtime.snapshot(),
            "commits":commits,
            "refs":refs,
            "head":head,
            "hasMore":has_more,
            "repositoryId":self.root,
            "repositoryName":repository_name
        }))
    }

    fn git_refs(&self) -> Result<Vec<serde_json::Value>, RuntimeError> {
        let output = Command::new(cgrx_cli::git_executable())
            .args([
                "for-each-ref",
                "--format=%(refname)%00%(objectname)%00%(*objectname)%00",
            ])
            .current_dir(&self.root)
            .output()
            .map_err(|error| git_history_error("read refs", error))?;
        if !output.status.success() {
            return Err(git_output_error("read refs", &output.stderr));
        }
        let mut refs = Vec::new();
        for line in output.stdout.split(|byte| *byte == b'\n') {
            let record = line.split(|byte| *byte == 0).collect::<Vec<_>>();
            if record.len() < 3 || record[0].is_empty() {
                continue;
            }
            let full_name = utf8(record[0], "ref name")?;
            let (kind, name) = if let Some(name) = full_name.strip_prefix("refs/heads/") {
                ("head", name)
            } else if let Some(name) = full_name.strip_prefix("refs/remotes/") {
                ("remote", name)
            } else if let Some(name) = full_name.strip_prefix("refs/tags/") {
                ("tag", name)
            } else {
                continue;
            };
            let target_bytes = if record[2].is_empty() {
                record[1]
            } else {
                record[2]
            };
            refs.push(json!({"name":name,"target":utf8(target_bytes, "ref target")?,"kind":kind}));
        }
        Ok(refs)
    }

    fn refresh(&mut self) -> Result<(), String> {
        match self.runtime.refresh(&self.root) {
            Ok(_) => Ok(()),
            Err(error) if error.code() == "revision_changed" => {
                Runtime::index_committed_head(&self.root, &self.state)
                    .map_err(|error| error.to_string())?;
                self.runtime = Runtime::open(&self.state).map_err(|error| error.to_string())?;
                self.runtime
                    .refresh(&self.root)
                    .map_err(|error| error.to_string())?;
                Ok(())
            }
            Err(error) => Err(error.to_string()),
        }
    }
}

fn utf8<'a>(value: &'a [u8], label: &str) -> Result<&'a str, RuntimeError> {
    std::str::from_utf8(value).map_err(|_| {
        RuntimeError::public(
            "cgrx.git_history_failed",
            format!("{label} is not valid UTF-8"),
        )
    })
}

fn git_history_error(action: &str, error: impl std::fmt::Display) -> RuntimeError {
    RuntimeError::public(
        "cgrx.git_history_failed",
        format!("failed to {action}: {error}"),
    )
}

fn git_output_error(action: &str, stderr: &[u8]) -> RuntimeError {
    let detail = String::from_utf8_lossy(stderr);
    git_history_error(action, detail.trim())
}

fn required<'a>(request: &'a HttpRequest, name: &str) -> Result<&'a str, RuntimeError> {
    request
        .query(name)
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| {
            RuntimeError::public(
                "cgrx.invalid_arguments",
                format!("query parameter {name} is required"),
            )
        })
}

fn optional_path(request: &HttpRequest) -> Result<Option<&str>, RuntimeError> {
    let Some(value) = request.query("path") else {
        return Ok(None);
    };
    if value.trim().is_empty()
        || Path::new(value).is_absolute()
        || Path::new(value).components().any(|component| {
            matches!(
                component,
                Component::ParentDir | Component::RootDir | Component::Prefix(_)
            )
        })
    {
        return Err(RuntimeError::public(
            "cgrx.invalid_path",
            "path must be a non-empty repository-relative path without parent traversal",
        ));
    }
    Ok(Some(value))
}

fn number<T>(request: &HttpRequest, name: &str, default: T) -> Result<T, RuntimeError>
where
    T: std::str::FromStr,
{
    request.query(name).map_or(Ok(default), |value| {
        value.parse().map_err(|_| {
            RuntimeError::public(
                "cgrx.invalid_arguments",
                format!("query parameter {name} is invalid"),
            )
        })
    })
}

fn scope(request: &HttpRequest, max_depth: u8) -> Scope {
    let include = request
        .query("scope")
        .filter(|value| !value.trim().is_empty())
        .map_or_else(
            || vec!["**".to_owned()],
            |value| value.split(',').map(str::to_owned).collect(),
        );
    Scope {
        include,
        exclude: Vec::new(),
        relation_kinds: vec![RelationKind::Calls, RelationKind::Implements],
        max_depth,
    }
}

fn capability_token() -> Result<String, String> {
    let mut bytes = [0_u8; 32];
    File::open("/dev/urandom")
        .and_then(|mut source| source.read_exact(&mut bytes))
        .map_err(|error| format!("secure random source unavailable: {error}"))?;
    let mut token = String::with_capacity(64);
    for byte in bytes {
        use std::fmt::Write as _;
        write!(&mut token, "{byte:02x}").expect("writing to String cannot fail");
    }
    Ok(token)
}

fn open_browser(url: &str) -> Result<(), String> {
    let executable = if cfg!(target_os = "macos") {
        "open"
    } else {
        "xdg-open"
    };
    Command::new(executable)
        .arg(url)
        .spawn()
        .map_err(|error| format!("failed to open browser with {executable}: {error}"))?;
    Ok(())
}
