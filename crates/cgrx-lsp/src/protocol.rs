//! LSP protocol types for cgrx-lsp.
//!
//! Implements a subset of the Language Server Protocol (LSP) specification
//! sufficient for `textDocument/definition` and `textDocument/references`
//! requests over stdio transport.

use serde::{Deserialize, Serialize};
use std::fmt;

// ── Common LSP types ────────────────────────────────────────────────────────

/// A position in a text document expressed as zero-based line and character offset.
#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct Position {
    /// Line position in a document (zero-based).
    pub line: u32,
    /// Character offset on a line in a document (zero-based).
    pub character: u32,
}

/// A range in a text document expressed as (zero-based) start and end positions.
#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct Range {
    /// The range's start position.
    pub start: Position,
    /// The range's end position.
    pub end: Position,
}

/// Represents a location inside a resource, such as a line inside a text file.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Location {
    /// The URI of the location.
    pub uri: String,
    /// The range inside the document.
    pub range: Range,
}

/// A literal to identify a text document in the client.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct TextDocumentIdentifier {
    /// The text document's URI.
    pub uri: String,
}

/// A parameter literal used in requests to pass a position and text document identifier.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct TextDocumentPositionParams {
    /// The text document.
    #[serde(rename = "textDocument")]
    pub text_document: TextDocumentIdentifier,
    /// The position inside the text document.
    pub position: Position,
}

// ── LSP Message envelope ────────────────────────────────────────────────────

/// A LSP message envelope.
#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(untagged)]
pub enum Message {
    /// A request message.
    Request(RequestMessage),
    /// A response message.
    Response(ResponseMessage),
    /// A notification message.
    Notification(NotificationMessage),
}

/// A request message to describe a request between the client and server.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct RequestMessage {
    /// The request id.
    pub id: RequestId,
    /// The method to be invoked.
    pub method: String,
    /// The method's params.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub params: Option<serde_json::Value>,
}

/// A Response Message sent as a result of a request.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ResponseMessage {
    /// The request id.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub id: Option<RequestId>,
    /// The result of a request. Required if no error.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    /// The error object in case a request fails.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<ResponseError>,
}

/// An error object returned in a response.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ResponseError {
    /// A number indicating the error type that occurred.
    pub code: i64,
    /// A string providing a short description of the error.
    pub message: String,
    /// A primitive or structured value that contains additional information.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

/// A notification message.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct NotificationMessage {
    /// The method to be invoked.
    pub method: String,
    /// The notification's params.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub params: Option<serde_json::Value>,
}

/// A RequestId can be either an integer or a string.
#[derive(Clone, Debug, Deserialize, Eq, Hash, PartialEq, Serialize)]
#[serde(untagged)]
pub enum RequestId {
    Int(i64),
    Str(String),
}

impl fmt::Display for RequestId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Int(id) => write!(f, "{id}"),
            Self::Str(id) => write!(f, "{id}"),
        }
    }
}

// ── LSP error codes ─────────────────────────────────────────────────────────

/// Predefined LSP error codes.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ErrorCode {
    /// JSON-RPC Parse error.
    ParseError = -32700,
    /// JSON-RPC Invalid Request.
    InvalidRequest = -32600,
    /// JSON-RPC Method not found.
    MethodNotFound = -32601,
    /// JSON-RPC Invalid params.
    InvalidParams = -32602,
    /// JSON-RPC Internal error.
    InternalError = -32603,
    /// Server not initialized.
    ServerNotInitialized = -32002,
    /// Unknown error code.
    UnknownErrorCode = -32001,
    /// Request cancelled.
    RequestCancelled = -32800,
    /// Content modified.
    ContentModified = -32801,
}

impl ErrorCode {
    /// Returns the numeric error code.
    #[must_use]
    pub const fn code(self) -> i64 {
        self as i64
    }
}

// ── Initialize ──────────────────────────────────────────────────────────────

/// The initialize request is sent from the client to the server.
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct InitializeParams {
    /// The process Id of the parent process that started the server.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub process_id: Option<i64>,
    /// Information about the client.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub client_info: Option<ClientInfo>,
    /// The locale the client is currently showing the user interface in.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub locale: Option<String>,
    /// The rootPath of the workspace.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub root_path: Option<String>,
    /// The rootUri of the workspace.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub root_uri: Option<String>,
    /// User provided initialization options.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub initialization_options: Option<serde_json::Value>,
    /// The capabilities provided by the client.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub capabilities: Option<ClientCapabilities>,
    /// The initial trace setting.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub trace: Option<String>,
    /// The workspace folders configured in the client.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub workspace_folders: Option<Vec<WorkspaceFolder>>,
}

/// Information about the client.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ClientInfo {
    /// The name of the client.
    pub name: String,
    /// The client's version.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
}

/// The capabilities provided by the client.
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct ClientCapabilities {
    /// Text document specific client capabilities.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub text_document: Option<TextDocumentClientCapabilities>,
    /// Workspace specific client capabilities.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub workspace: Option<WorkspaceClientCapabilities>,
}

/// Text document specific client capabilities.
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct TextDocumentClientCapabilities {
    /// Capabilities specific to the `textDocument/definition` request.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub definition: Option<DefinitionClientCapabilities>,
    /// Capabilities specific to the `textDocument/references` request.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub references: Option<ReferencesClientCapabilities>,
}

/// Capabilities specific to the `textDocument/definition` request.
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct DefinitionClientCapabilities {
    /// Whether declaration supports dynamic registration.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dynamic_registration: Option<bool>,
    /// The client supports additional metadata in the form of definition links.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub link_support: Option<bool>,
}

/// Capabilities specific to the `textDocument/references` request.
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct ReferencesClientCapabilities {
    /// Whether references supports dynamic registration.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dynamic_registration: Option<bool>,
}

/// Workspace specific client capabilities.
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct WorkspaceClientCapabilities {
    /// The client supports workspace folders.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub workspace_folders: Option<bool>,
    /// The client supports `workspace/configuration` requests.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub configuration: Option<bool>,
}

/// A workspace folder.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct WorkspaceFolder {
    /// The associated URI for this workspace folder.
    pub uri: String,
    /// The name of the workspace folder.
    pub name: String,
}

/// The result of the initialize request.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct InitializeResult {
    /// The capabilities the language server provides.
    pub capabilities: ServerCapabilities,
    /// Information about the server.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub server_info: Option<ServerInfo>,
}

/// Information about the server.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ServerInfo {
    /// The name of the server.
    pub name: String,
    /// The server's version.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
}

/// The capabilities the language server provides.
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct ServerCapabilities {
    /// The position encoding the server picked.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub position_encoding: Option<String>,
    /// Defines how text documents are synced.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub text_document_sync: Option<TextDocumentSyncOptions>,
    /// The server provides goto definition support.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub definition_provider: Option<bool>,
    /// The server provides find references support.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub references_provider: Option<bool>,
}

/// Defines how text documents are synced.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct TextDocumentSyncOptions {
    /// Open and close notifications are sent to the server.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub open_close: Option<bool>,
    /// Change notifications are sent to the server.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub change: Option<i32>,
}

// ── References ───────────────────────────────────────────────────────────────

/// Context for the references request.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ReferenceContext {
    /// Include the declaration of the current symbol.
    pub include_declaration: bool,
}

/// Params for the references request.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ReferenceParams {
    /// The text document.
    #[serde(rename = "textDocument")]
    pub text_document: TextDocumentIdentifier,
    /// The position inside the text document.
    pub position: Position,
    /// The context of the references request.
    pub context: ReferenceContext,
}

// ── GotoDefinition ──────────────────────────────────────────────────────────

/// Params for the definition request.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct GotoDefinitionParams {
    /// The text document.
    #[serde(rename = "textDocument")]
    pub text_document: TextDocumentIdentifier,
    /// The position inside the text document.
    pub position: Position,
}

/// The result of a goto definition request.
#[derive(Clone, Debug, Serialize)]
#[serde(untagged)]
pub enum GotoDefinitionResponse {
    /// A single location.
    Scalar(Location),
    /// Multiple locations.
    Array(Vec<Location>),
}

// ── Text document sync ──────────────────────────────────────────────────────

/// An item to transfer a text document from the client to the server.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct TextDocumentItem {
    /// The text document's URI.
    pub uri: String,
    /// The text document's language identifier.
    #[serde(rename = "languageId")]
    pub language_id: String,
    /// The version number of this document.
    pub version: i32,
    /// The content of the opened text document.
    pub text: String,
}

/// DidOpenTextDocument notification params.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct DidOpenTextDocumentParams {
    /// The document that was opened.
    #[serde(rename = "textDocument")]
    pub text_document: TextDocumentItem,
}

/// An event describing a change to a text document.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct TextDocumentContentChangeEvent {
    /// The range of the document that changed.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub range: Option<Range>,
    /// The optional length of the range that got replaced.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub range_length: Option<u32>,
    /// The new text of the range/document.
    pub text: String,
}

/// An identifier to denote a specific version of a text document.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct VersionedTextDocumentIdentifier {
    /// The text document's URI.
    pub uri: String,
    /// The version number of this document.
    pub version: i32,
}

/// DidChangeTextDocument notification params.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct DidChangeTextDocumentParams {
    /// The document that did change.
    #[serde(rename = "textDocument")]
    pub text_document: VersionedTextDocumentIdentifier,
    /// The actual content changes.
    #[serde(rename = "contentChanges")]
    pub content_changes: Vec<TextDocumentContentChangeEvent>,
}

/// DidCloseTextDocument notification params.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct DidCloseTextDocumentParams {
    /// The document that was closed.
    #[serde(rename = "textDocument")]
    pub text_document: TextDocumentIdentifier,
}

// ── Diagnostics ─────────────────────────────────────────────────────────────

/// Represents a diagnostic, such as a compiler error or warning.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Diagnostic {
    /// The range at which the message applies.
    pub range: Range,
    /// The diagnostic's severity.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub severity: Option<DiagnosticSeverity>,
    /// The diagnostic's code.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub code: Option<serde_json::Value>,
    /// The diagnostic's message.
    pub message: String,
}

/// The diagnostic's severity.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DiagnosticSeverity {
    /// Reports an error.
    Error = 1,
    /// Reports a warning.
    Warning = 2,
    /// Reports an information.
    Information = 3,
    /// Reports a hint.
    Hint = 4,
}

/// PublishDiagnostics notification params.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct PublishDiagnosticsParams {
    /// The URI for which diagnostic information is reported.
    pub uri: String,
    /// An array of diagnostic information items.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub diagnostics: Option<Vec<Diagnostic>>,
    /// Optional the version number of the document the diagnostics are published for.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub version: Option<i32>,
}

// ── Logging ──────────────────────────────────────────────────────────────────

/// LogMessage notification params.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct LogMessageParams {
    /// The message type.
    #[serde(rename = "type")]
    pub message_type: MessageType,
    /// The actual message.
    pub message: String,
}

/// The message type.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum MessageType {
    /// An error message.
    Error = 1,
    /// A warning message.
    Warning = 2,
    /// An info message.
    Info = 3,
    /// A log message.
    Log = 4,
}
