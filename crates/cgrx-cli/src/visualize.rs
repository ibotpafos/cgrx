mod assets;
mod http;

use std::fs::File;
use std::io;
use std::io::{Read, Write};
use std::net::{Ipv4Addr, TcpListener};
use std::path::{Component, Path, PathBuf};
use std::process::Command;

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
            "/assets/app.js" => HttpResponse::javascript(assets::APP),
            "/api/status" => self.status(),
            "/api/search" => self.api_result(self.search(request)),
            "/api/graph" => self.api_result(self.graph(request)),
            "/api/refactors" => self.api_result(self.refactors(request)),
            "/api/snippet" => self.api_result(self.snippet(request)),
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

    fn snippet(&self, request: &HttpRequest) -> Result<serde_json::Value, RuntimeError> {
        self.runtime
            .get_code_snippet(required(request, "symbol")?, optional_path(request)?)
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
