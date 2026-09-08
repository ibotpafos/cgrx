//! CGRX Language Server Protocol (LSP) binary.
//!
//! Runs over the standard `Content-Length` framed stdio transport.

use cgrx_lsp::lsp::{LspError, LspServer};
use cgrx_lsp::protocol::{
    DidChangeTextDocumentParams, DidCloseTextDocumentParams, DidOpenTextDocumentParams,
    GotoDefinitionParams, InitializeParams, ReferenceParams,
};
use lsp_server::{Connection, ErrorCode, Message, Notification, Request, Response};
use serde::de::DeserializeOwned;
use std::path::{Path, PathBuf};
use std::process::Command;

fn main() -> std::io::Result<()> {
    let (connection, io_threads) = Connection::stdio();
    let mut server = load_server()?;

    for message in &connection.receiver {
        match message {
            Message::Request(request) => {
                let response = handle_request(&mut server, &request);
                if connection.sender.send(response.into()).is_err() {
                    break;
                }
            }
            Message::Notification(notification) => {
                if handle_notification(&mut server, &notification) {
                    break;
                }
            }
            Message::Response(_) => {}
        }
    }

    drop(connection);
    io_threads.join()
}

fn load_server() -> std::io::Result<LspServer> {
    let root = parse_root(std::env::args().skip(1))?;
    let state = managed_state_path(&root)?;
    cgrx_cli::Runtime::index_committed_head(&root, &state).map_err(other_io_error)?;
    let runtime = cgrx_cli::Runtime::open(&state).map_err(other_io_error)?;
    Ok(LspServer::with_graph_at_root(runtime.base_graph(), root))
}

fn parse_root(args: impl Iterator<Item = String>) -> std::io::Result<PathBuf> {
    let args: Vec<_> = args.collect();
    let root = match args.as_slice() {
        [] => std::env::current_dir()?,
        [flag, value] if flag == "--root" => PathBuf::from(value),
        _ => {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "usage: cgrx-lsp [--root PATH]",
            ));
        }
    };
    let root = root.canonicalize()?;
    let output = Command::new(cgrx_cli::git_executable())
        .args(["rev-parse", "--show-toplevel"])
        .current_dir(&root)
        .output()?;
    if !output.status.success() {
        return Err(std::io::Error::other(
            String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        ));
    }
    PathBuf::from(String::from_utf8_lossy(&output.stdout).trim()).canonicalize()
}

fn managed_state_path(root: &Path) -> std::io::Result<PathBuf> {
    let output = Command::new(cgrx_cli::git_executable())
        .args(["rev-parse", "--git-path", "cgrx/managed"])
        .current_dir(root)
        .output()?;
    if !output.status.success() {
        return Err(std::io::Error::other(
            String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        ));
    }
    let path = PathBuf::from(String::from_utf8_lossy(&output.stdout).trim());
    Ok(if path.is_absolute() {
        path
    } else {
        root.join(path)
    })
}

fn other_io_error(error: impl std::fmt::Display) -> std::io::Error {
    std::io::Error::other(error.to_string())
}

fn parse_params<T: DeserializeOwned>(request: &Request) -> Result<T, Response> {
    serde_json::from_value(request.params.clone()).map_err(|error| {
        Response::new_err(
            request.id.clone(),
            ErrorCode::InvalidParams as i32,
            error.to_string(),
        )
    })
}

fn handle_request(server: &mut LspServer, request: &Request) -> Response {
    let id = request.id.clone();
    match request.method.as_str() {
        "initialize" => {
            let params = match parse_params::<InitializeParams>(request) {
                Ok(params) => params,
                Err(response) => return response,
            };
            match server.initialize(params) {
                Ok(result) => Response::new_ok(id, result),
                Err(error) => error_response(id, error),
            }
        }
        "shutdown" => match server.shutdown() {
            Ok(()) => Response::new_ok(id, serde_json::Value::Null),
            Err(error) => error_response(id, error),
        },
        "textDocument/definition" => {
            let params = match parse_params::<GotoDefinitionParams>(request) {
                Ok(params) => params,
                Err(response) => return response,
            };
            match server.goto_definition(params) {
                Ok(result) => Response::new_ok(id, result),
                Err(error) => error_response(id, error),
            }
        }
        "textDocument/references" => {
            let params = match parse_params::<ReferenceParams>(request) {
                Ok(params) => params,
                Err(response) => return response,
            };
            match server.find_references(params) {
                Ok(result) => Response::new_ok(id, result),
                Err(error) => error_response(id, error),
            }
        }
        _ => Response::new_err(
            id,
            ErrorCode::MethodNotFound as i32,
            format!("method not found: {}", request.method),
        ),
    }
}

/// Returns true when the LSP session should terminate.
fn handle_notification(server: &mut LspServer, notification: &Notification) -> bool {
    match notification.method.as_str() {
        "initialized" => {}
        "textDocument/didOpen" => {
            if let Ok(params) =
                serde_json::from_value::<DidOpenTextDocumentParams>(notification.params.clone())
            {
                let _ = server.did_open(params);
            }
        }
        "textDocument/didChange" => {
            if let Ok(params) =
                serde_json::from_value::<DidChangeTextDocumentParams>(notification.params.clone())
            {
                let _ = server.did_change(params);
            }
        }
        "textDocument/didClose" => {
            if let Ok(params) =
                serde_json::from_value::<DidCloseTextDocumentParams>(notification.params.clone())
            {
                let _ = server.did_close(params);
            }
        }
        "exit" => return true,
        _ => {}
    }
    false
}

fn error_response(id: lsp_server::RequestId, error: LspError) -> Response {
    let code = match error {
        LspError::MethodNotFound(_) => ErrorCode::MethodNotFound,
        LspError::InvalidParams(_) | LspError::Serialization(_) => ErrorCode::InvalidParams,
        LspError::NotInitialized => ErrorCode::ServerNotInitialized,
        LspError::Internal(_) | LspError::Graph(_) => ErrorCode::InternalError,
    };
    Response::new_err(id, code as i32, error.to_string())
}
