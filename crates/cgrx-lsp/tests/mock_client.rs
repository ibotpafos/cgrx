//! Mock LSP client tests for cgrx-lsp.
//!
//! These tests simulate a full LSP client-server interaction over stdio,
//! verifying that the server correctly handles the LSP protocol.

use cgrx_lsp::lsp::LspServer;
use cgrx_lsp::protocol::{
    DidChangeTextDocumentParams, DidCloseTextDocumentParams, DidOpenTextDocumentParams,
    GotoDefinitionParams, InitializeParams, InitializeResult, Location, MessageType,
    NotificationMessage, Position, Range, ReferenceContext, ReferenceParams, RequestId,
    RequestMessage, ResponseError, ResponseMessage, TextDocumentContentChangeEvent,
    TextDocumentIdentifier, TextDocumentItem, VersionedTextDocumentIdentifier,
};
use serde_json::Value;

/// A mock LSP client that captures server responses.
struct MockLspClient {
    /// The LSP server.
    server: LspServer,
    /// The next request ID to use.
    next_id: i64,
    /// Captured responses.
    responses: Vec<ResponseMessage>,
    /// Captured notifications.
    notifications: Vec<NotificationMessage>,
}

impl MockLspClient {
    /// Creates a new mock LSP client.
    fn new() -> Self {
        Self {
            server: LspServer::new(),
            next_id: 1,
            responses: Vec::new(),
            notifications: Vec::new(),
        }
    }

    /// Sends a request to the server and captures the response.
    fn send_request(&mut self, method: &str, params: Option<Value>) -> RequestId {
        let id = RequestId::Int(self.next_id);
        self.next_id += 1;

        let request = RequestMessage {
            id: id.clone(),
            method: method.to_string(),
            params,
        };

        let response = handle_request(&mut self.server, &request);
        if let Some(resp) = response {
            self.responses.push(resp);
        }
        id
    }

    /// Sends a notification to the server.
    fn send_notification(&mut self, method: &str, params: Option<Value>) {
        let notification = NotificationMessage {
            method: method.to_string(),
            params,
        };
        handle_notification(&mut self.server, &notification);
    }

    /// Gets the last response.
    fn last_response(&self) -> Option<&ResponseMessage> {
        self.responses.last()
    }

    /// Gets all responses.
    fn responses(&self) -> &[ResponseMessage] {
        &self.responses
    }
}

/// Handles a request message (copied from main.rs for testing).
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

/// Handles a notification message (copied from main.rs for testing).
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

// ── Tests ────────────────────────────────────────────────────────────────────

#[test]
fn mock_client_initialize() {
    let mut client = MockLspClient::new();

    let id = client.send_request(
        "initialize",
        Some(serde_json::json!({
            "capabilities": {}
        })),
    );

    let response = client.last_response().expect("Expected response");
    assert_eq!(response.id, Some(id));
    assert!(response.result.is_some());
    assert!(response.error.is_none());

    let result: InitializeResult =
        serde_json::from_value(response.result.clone().unwrap()).unwrap();
    assert_eq!(result.server_info.as_ref().unwrap().name, "cgrx-lsp");
    assert!(result.capabilities.definition_provider.unwrap_or(false));
    assert!(result.capabilities.references_provider.unwrap_or(false));
}

#[test]
fn mock_client_shutdown() {
    let mut client = MockLspClient::new();

    // Initialize first
    client.send_request("initialize", Some(serde_json::json!({})));

    // Then shutdown
    let id = client.send_request("shutdown", None);

    let response = client.last_response().expect("Expected response");
    assert_eq!(response.id, Some(id));
    assert!(response.result.is_some());
    assert!(response.error.is_none());
}

#[test]
fn mock_client_unknown_method() {
    let mut client = MockLspClient::new();

    let id = client.send_request("unknown/method", None);

    let response = client.last_response().expect("Expected response");
    assert_eq!(response.id, Some(id));
    assert!(response.result.is_none());
    assert!(response.error.is_some());
    assert_eq!(response.error.as_ref().unwrap().code, -32601);
}

#[test]
fn mock_client_goto_definition() {
    let mut client = MockLspClient::new();

    // Initialize
    client.send_request("initialize", Some(serde_json::json!({})));

    // Open a document
    client.send_notification(
        "textDocument/didOpen",
        Some(serde_json::json!({
            "textDocument": {
                "uri": "file:///test.rs",
                "languageId": "rust",
                "version": 1,
                "text": "fn hello() {}\nfn world() { hello(); }"
            }
        })),
    );

    // Request definition
    let id = client.send_request(
        "textDocument/definition",
        Some(serde_json::json!({
            "textDocument": {
                "uri": "file:///test.rs"
            },
            "position": {
                "line": 0,
                "character": 4
            }
        })),
    );

    let response = client.last_response().expect("Expected response");
    assert_eq!(response.id, Some(id));
    assert!(
        response.result.is_some(),
        "Expected result, got error: {:?}",
        response.error
    );
}

#[test]
fn mock_client_find_references() {
    let mut client = MockLspClient::new();

    // Initialize
    client.send_request("initialize", Some(serde_json::json!({})));

    // Open a document
    client.send_notification(
        "textDocument/didOpen",
        Some(serde_json::json!({
            "textDocument": {
                "uri": "file:///test.rs",
                "languageId": "rust",
                "version": 1,
                "text": "fn hello() {}\nfn world() { hello(); }"
            }
        })),
    );

    // Request references
    let id = client.send_request(
        "textDocument/references",
        Some(serde_json::json!({
            "textDocument": {
                "uri": "file:///test.rs"
            },
            "position": {
                "line": 0,
                "character": 4
            },
            "context": {
                "include_declaration": true
            }
        })),
    );

    let response = client.last_response().expect("Expected response");
    assert_eq!(response.id, Some(id));
    assert!(
        response.result.is_some(),
        "Expected result, got error: {:?}",
        response.error
    );
}

#[test]
fn mock_client_did_change() {
    let mut client = MockLspClient::new();

    // Initialize
    client.send_request("initialize", Some(serde_json::json!({})));

    // Open a document
    client.send_notification(
        "textDocument/didOpen",
        Some(serde_json::json!({
            "textDocument": {
                "uri": "file:///test.rs",
                "languageId": "rust",
                "version": 1,
                "text": "fn hello() {}"
            }
        })),
    );

    // Change the document
    client.send_notification(
        "textDocument/didChange",
        Some(serde_json::json!({
            "textDocument": {
                "uri": "file:///test.rs",
                "version": 2
            },
            "contentChanges": [
                {
                    "text": "fn hello() {}\nfn world() { hello(); }"
                }
            ]
        })),
    );

    // Request definition after change
    let id = client.send_request(
        "textDocument/definition",
        Some(serde_json::json!({
            "textDocument": {
                "uri": "file:///test.rs"
            },
            "position": {
                "line": 0,
                "character": 4
            }
        })),
    );

    let response = client.last_response().expect("Expected response");
    assert_eq!(response.id, Some(id));
    assert!(
        response.result.is_some(),
        "Expected result, got error: {:?}",
        response.error
    );
}

#[test]
fn mock_client_did_close() {
    let mut client = MockLspClient::new();

    // Initialize
    client.send_request("initialize", Some(serde_json::json!({})));

    // Open a document
    client.send_notification(
        "textDocument/didOpen",
        Some(serde_json::json!({
            "textDocument": {
                "uri": "file:///test.rs",
                "languageId": "rust",
                "version": 1,
                "text": "fn hello() {}"
            }
        })),
    );

    // Close the document
    client.send_notification(
        "textDocument/didClose",
        Some(serde_json::json!({
            "textDocument": {
                "uri": "file:///test.rs"
            }
        })),
    );

    // Request definition after close (should fail)
    let id = client.send_request(
        "textDocument/definition",
        Some(serde_json::json!({
            "textDocument": {
                "uri": "file:///test.rs"
            },
            "position": {
                "line": 0,
                "character": 4
            }
        })),
    );

    let response = client.last_response().expect("Expected response");
    assert_eq!(response.id, Some(id));
    // Should get an error since document is closed
    assert!(response.error.is_some());
}

#[test]
fn mock_client_multiple_documents() {
    let mut client = MockLspClient::new();

    // Initialize
    client.send_request("initialize", Some(serde_json::json!({})));

    // Open first document
    client.send_notification(
        "textDocument/didOpen",
        Some(serde_json::json!({
            "textDocument": {
                "uri": "file:///lib.rs",
                "languageId": "rust",
                "version": 1,
                "text": "pub fn helper() {}"
            }
        })),
    );

    // Open second document
    client.send_notification(
        "textDocument/didOpen",
        Some(serde_json::json!({
            "textDocument": {
                "uri": "file:///main.rs",
                "languageId": "rust",
                "version": 1,
                "text": "fn main() { helper(); }"
            }
        })),
    );

    // Request definition in second document
    let id = client.send_request(
        "textDocument/definition",
        Some(serde_json::json!({
            "textDocument": {
                "uri": "file:///main.rs"
            },
            "position": {
                "line": 0,
                "character": 16
            }
        })),
    );

    let response = client.last_response().expect("Expected response");
    assert_eq!(response.id, Some(id));
    assert!(
        response.result.is_some(),
        "Expected result, got error: {:?}",
        response.error
    );
}

#[test]
fn mock_client_initialized_notification() {
    let mut client = MockLspClient::new();

    // Initialize
    client.send_request("initialize", Some(serde_json::json!({})));

    // Send initialized notification
    client.send_notification("initialized", Some(serde_json::json!({})));

    // Should not crash
    assert_eq!(client.responses().len(), 1);
}

#[test]
fn mock_client_request_before_init() {
    let mut client = MockLspClient::new();

    // Request definition before initialization
    let id = client.send_request(
        "textDocument/definition",
        Some(serde_json::json!({
            "textDocument": {
                "uri": "file:///test.rs"
            },
            "position": {
                "line": 0,
                "character": 4
            }
        })),
    );

    let response = client.last_response().expect("Expected response");
    assert_eq!(response.id, Some(id));
    // Should get an error since server is not initialized
    assert!(response.error.is_some());
    assert_eq!(response.error.as_ref().unwrap().code, -32603);
}
