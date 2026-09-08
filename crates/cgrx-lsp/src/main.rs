//! CGRX Language Server Protocol (LSP) binary.
//!
//! Runs the LSP server over stdio, handling JSON-RPC messages
//! for `textDocument/definition` and `textDocument/references`.

use cgrx_lsp::lsp::LspServer;
use cgrx_lsp::protocol::{
    DidChangeTextDocumentParams, DidCloseTextDocumentParams, DidOpenTextDocumentParams,
    GotoDefinitionParams, InitializeParams, NotificationMessage, ReferenceParams, RequestId,
    RequestMessage, ResponseError, ResponseMessage,
};
use serde_json::Value;
use std::io::{self, BufRead, Write};

fn main() -> io::Result<()> {
    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut server = LspServer::new();

    for line in stdin.lock().lines() {
        let line = line?;
        if line.is_empty() {
            continue;
        }

        // Parse the LSP message
        match serde_json::from_str::<serde_json::Value>(&line) {
            Ok(value) => {
                let response = handle_message(&mut server, &value);
                if let Some(resp) = response {
                    let json = serde_json::to_string(&resp).unwrap();
                    let mut stdout = stdout.lock();
                    writeln!(stdout, "Content-Length: {}\r", json.len())?;
                    writeln!(stdout, "\r")?;
                    writeln!(stdout, "{}", json)?;
                    stdout.flush()?;
                }
            }
            Err(e) => {
                eprintln!("Failed to parse message: {}", e);
            }
        }
    }

    Ok(())
}

/// Handles an incoming LSP message and returns an optional response.
fn handle_message(server: &mut LspServer, value: &Value) -> Option<ResponseMessage> {
    // Determine message type
    if value.get("id").is_some() && value.get("method").is_some() {
        // Request message
        let request: RequestMessage = match serde_json::from_value(value.clone()) {
            Ok(req) => req,
            Err(e) => {
                return Some(error_response(
                    RequestId::Int(0),
                    -32600,
                    &format!("Invalid request: {}", e),
                ));
            }
        };
        handle_request(server, &request)
    } else if value.get("method").is_some() {
        // Notification message
        let notification: NotificationMessage = match serde_json::from_value(value.clone()) {
            Ok(notif) => notif,
            Err(_) => return None,
        };
        handle_notification(server, &notification);
        None
    } else {
        // Response or other
        None
    }
}

/// Handles a request message.
fn handle_request(server: &mut LspServer, request: &RequestMessage) -> Option<ResponseMessage> {
    let id = request.id.clone();
    let method = request.method.as_str();
    let params = request.params.clone().unwrap_or(Value::Null);

    match method {
        "initialize" => {
            let params: InitializeParams = match serde_json::from_value(params) {
                Ok(p) => p,
                Err(e) => {
                    return Some(error_response(
                        id,
                        -32602,
                        &format!("Invalid initialize params: {}", e),
                    ));
                }
            };
            match server.initialize(params) {
                Ok(result) => Some(ResponseMessage {
                    id: Some(id),
                    result: Some(serde_json::to_value(result).unwrap()),
                    error: None,
                }),
                Err(e) => Some(error_response(id, -32603, &e.to_string())),
            }
        }
        "shutdown" => match server.shutdown() {
            Ok(()) => Some(ResponseMessage {
                id: Some(id),
                result: Some(Value::Null),
                error: None,
            }),
            Err(e) => Some(error_response(id, -32603, &e.to_string())),
        },
        "textDocument/definition" => {
            let params: GotoDefinitionParams = match serde_json::from_value(params) {
                Ok(p) => p,
                Err(e) => {
                    return Some(error_response(
                        id,
                        -32602,
                        &format!("Invalid definition params: {}", e),
                    ));
                }
            };
            match server.goto_definition(params) {
                Ok(result) => Some(ResponseMessage {
                    id: Some(id),
                    result: Some(serde_json::to_value(result).unwrap()),
                    error: None,
                }),
                Err(e) => Some(error_response(id, -32603, &e.to_string())),
            }
        }
        "textDocument/references" => {
            let params: ReferenceParams = match serde_json::from_value(params) {
                Ok(p) => p,
                Err(e) => {
                    return Some(error_response(
                        id,
                        -32602,
                        &format!("Invalid references params: {}", e),
                    ));
                }
            };
            match server.find_references(params) {
                Ok(result) => Some(ResponseMessage {
                    id: Some(id),
                    result: Some(serde_json::to_value(result).unwrap()),
                    error: None,
                }),
                Err(e) => Some(error_response(id, -32603, &e.to_string())),
            }
        }
        _ => Some(error_response(
            id,
            -32601,
            &format!("Method not found: {}", method),
        )),
    }
}

/// Handles a notification message.
fn handle_notification(server: &mut LspServer, notification: &NotificationMessage) {
    match notification.method.as_str() {
        "initialized" => {
            // Client is ready
        }
        "textDocument/didOpen" => {
            if let Ok(params) = serde_json::from_value::<DidOpenTextDocumentParams>(
                notification.params.clone().unwrap_or(Value::Null),
            ) {
                let _ = server.did_open(params);
            }
        }
        "textDocument/didChange" => {
            if let Ok(params) = serde_json::from_value::<DidChangeTextDocumentParams>(
                notification.params.clone().unwrap_or(Value::Null),
            ) {
                let _ = server.did_change(params);
            }
        }
        "textDocument/didClose" => {
            if let Ok(params) = serde_json::from_value::<DidCloseTextDocumentParams>(
                notification.params.clone().unwrap_or(Value::Null),
            ) {
                let _ = server.did_close(params);
            }
        }
        "exit" => {
            std::process::exit(0);
        }
        _ => {
            // Unknown notification, ignore
        }
    }
}

/// Creates an error response.
fn error_response(id: RequestId, code: i64, message: &str) -> ResponseMessage {
    ResponseMessage {
        id: Some(id),
        result: None,
        error: Some(ResponseError {
            code,
            message: message.to_string(),
            data: None,
        }),
    }
}
