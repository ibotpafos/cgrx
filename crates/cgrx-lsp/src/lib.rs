//! CGRX Language Server Protocol (LSP) bridge.
//!
//! Provides IDE integration for CGRX through the Language Server Protocol,
//! supporting `textDocument/definition` and `textDocument/references` requests
//! backed by the CGRX graph.

pub mod lsp;
pub mod protocol;

pub use lsp::{Document, LspError, LspResult, LspServer};
pub use protocol::{
    GotoDefinitionParams, GotoDefinitionResponse, InitializeParams, InitializeResult, Location,
    Position, Range, ReferenceParams, RequestId, RequestMessage, ResponseError, ResponseMessage,
    ServerCapabilities, TextDocumentIdentifier,
};
