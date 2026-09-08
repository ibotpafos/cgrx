//! LSP server implementation for CGRX.
//!
//! Provides `textDocument/definition` and `textDocument/references` capabilities
//! backed by the CGRX graph.

#[cfg(test)]
use crate::protocol::TextDocumentIdentifier;
use crate::protocol::{
    DidChangeTextDocumentParams, DidCloseTextDocumentParams, DidOpenTextDocumentParams,
    GotoDefinitionParams, GotoDefinitionResponse, InitializeParams, InitializeResult, Location,
    Position, Range, ReferenceContext, ReferenceParams, ServerCapabilities, ServerInfo,
    TextDocumentContentChangeEvent, TextDocumentItem, TextDocumentSyncOptions,
};
use cgrx_languages::{Edge, Span, Symbol, pack_for_path};
use cgrx_retrieval::BaseGraph;
use cgrx_store::DeltaOverlay;
use std::collections::BTreeMap;
use std::fmt;
use std::path::Path;

/// Errors that can occur during LSP operations.
#[derive(Debug)]
pub enum LspError {
    /// The requested method is not supported.
    MethodNotFound(String),
    /// Invalid parameters were provided.
    InvalidParams(String),
    /// An internal error occurred.
    Internal(String),
    /// The server was not initialized.
    NotInitialized,
    /// JSON serialization/deserialization error.
    Serialization(serde_json::Error),
    /// Graph operation error.
    Graph(String),
}

impl fmt::Display for LspError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MethodNotFound(method) => write!(f, "method not found: {method}"),
            Self::InvalidParams(msg) => write!(f, "invalid params: {msg}"),
            Self::Internal(msg) => write!(f, "internal error: {msg}"),
            Self::NotInitialized => write!(f, "server not initialized"),
            Self::Serialization(e) => write!(f, "serialization error: {e}"),
            Self::Graph(msg) => write!(f, "graph error: {msg}"),
        }
    }
}

impl std::error::Error for LspError {}

impl From<serde_json::Error> for LspError {
    fn from(e: serde_json::Error) -> Self {
        Self::Serialization(e)
    }
}

/// Result type for LSP operations.
pub type LspResult<T> = Result<T, LspError>;

/// A document tracked by the LSP server.
#[derive(Clone, Debug)]
pub struct Document {
    /// The document URI.
    pub uri: String,
    /// The document content.
    pub content: String,
    /// The document version.
    pub version: i32,
    /// The extracted symbols from this document.
    pub symbols: Vec<Symbol>,
    /// The extracted edges from this document.
    pub edges: Vec<Edge>,
}

impl Document {
    /// Creates a new document from a text document item.
    pub fn new(item: &TextDocumentItem) -> Self {
        let mut doc = Self {
            uri: item.uri.clone(),
            content: item.text.clone(),
            version: item.version,
            symbols: Vec::new(),
            edges: Vec::new(),
        };
        doc.extract_symbols();
        doc
    }

    /// Updates the document content and re-extracts symbols.
    pub fn update(&mut self, changes: &[TextDocumentContentChangeEvent], version: i32) {
        for change in changes {
            if let Some(range) = &change.range {
                // Apply range-based change
                let start = self.position_to_offset(&range.start);
                let end = self.position_to_offset(&range.end);
                if start <= end && end <= self.content.len() {
                    self.content.replace_range(start..end, &change.text);
                }
            } else {
                // Full document replacement
                self.content = change.text.clone();
            }
        }
        self.version = version;
        self.extract_symbols();
    }

    /// Extracts symbols from the document content using the appropriate language pack.
    fn extract_symbols(&mut self) {
        self.symbols.clear();
        self.edges.clear();

        let path = Path::new(&self.uri);
        let content = self.content.as_bytes();

        if let Some(pack) = pack_for_path(path) {
            match pack.extract(path, content) {
                Ok(extraction) => {
                    self.symbols = extraction.symbols;
                    self.edges = extraction.edges;
                }
                Err(_) => {
                    // Extraction failed, leave symbols empty
                }
            }
        }
    }

    /// Converts a Position to a byte offset in the document content.
    fn position_to_offset(&self, pos: &Position) -> usize {
        let mut offset = 0;
        let target_line = pos.line as usize;
        let target_char = pos.character as usize;

        for (line_idx, line) in self.content.lines().enumerate() {
            if line_idx == target_line {
                // Find the character position in this line
                let mut char_offset = 0;
                for (char_idx, ch) in line.char_indices() {
                    if char_idx >= target_char {
                        break;
                    }
                    char_offset = char_idx + ch.len_utf8();
                }
                // If target_char is beyond the line length, clamp to end of line
                if target_char > line.chars().count() {
                    char_offset = line.len();
                }
                offset += char_offset;
                break;
            }
            offset += line.len() + 1; // +1 for newline
        }

        offset.min(self.content.len())
    }

    /// Returns the symbol at the given position, if any.
    pub fn symbol_at(&self, pos: &Position) -> Option<&Symbol> {
        let offset = self.position_to_offset(pos);
        self.symbols
            .iter()
            .find(|s| s.span.start <= offset && offset <= s.span.end)
    }

    /// Returns the word at the given position.
    pub fn word_at(&self, pos: &Position) -> Option<String> {
        let offset = self.position_to_offset(pos);
        let content = &self.content;

        // Find word boundaries
        let start = content[..offset]
            .char_indices()
            .rev()
            .find(|(_, c)| !is_word_char(*c))
            .map(|(i, c)| i + c.len_utf8())
            .unwrap_or(0);

        let end = content[offset..]
            .char_indices()
            .find(|(_, c)| !is_word_char(*c))
            .map(|(i, _)| offset + i)
            .unwrap_or(content.len());

        if start < end {
            Some(content[start..end].to_string())
        } else {
            None
        }
    }
}

/// Checks if a character is a word character (identifier character).
fn is_word_char(c: char) -> bool {
    c.is_alphanumeric() || c == '_'
}

/// The LSP server state.
pub struct LspServer {
    /// Whether the server has been initialized.
    initialized: bool,
    /// The server capabilities.
    capabilities: ServerCapabilities,
    /// Open documents, keyed by URI.
    documents: BTreeMap<String, Document>,
    /// The CGRX base graph.
    graph: Option<BaseGraph>,
    /// The delta overlay for the graph.
    _overlay: Option<DeltaOverlay>,
}

impl LspServer {
    /// Creates a new LSP server with default capabilities.
    pub fn new() -> Self {
        Self {
            initialized: false,
            capabilities: ServerCapabilities {
                position_encoding: Some("utf-16".to_string()),
                text_document_sync: Some(TextDocumentSyncOptions {
                    open_close: Some(true),
                    change: Some(1), // Full document sync
                }),
                definition_provider: Some(true),
                references_provider: Some(true),
            },
            documents: BTreeMap::new(),
            graph: None,
            _overlay: None,
        }
    }

    /// Creates a new LSP server with a pre-loaded graph.
    pub fn with_graph(graph: BaseGraph) -> Self {
        Self {
            initialized: false,
            capabilities: ServerCapabilities {
                position_encoding: Some("utf-16".to_string()),
                text_document_sync: Some(TextDocumentSyncOptions {
                    open_close: Some(true),
                    change: Some(1),
                }),
                definition_provider: Some(true),
                references_provider: Some(true),
            },
            documents: BTreeMap::new(),
            graph: Some(graph),
            _overlay: None,
        }
    }

    /// Returns whether the server has been initialized.
    pub fn is_initialized(&self) -> bool {
        self.initialized
    }

    /// Returns a reference to the documents map.
    pub fn documents(&self) -> &BTreeMap<String, Document> {
        &self.documents
    }

    /// Returns a reference to the graph, if loaded.
    pub fn graph(&self) -> Option<&BaseGraph> {
        self.graph.as_ref()
    }

    /// Sets the graph for the server.
    pub fn set_graph(&mut self, graph: BaseGraph) {
        self.graph = Some(graph);
    }

    /// Handles an initialize request.
    pub fn initialize(&mut self, _params: InitializeParams) -> LspResult<InitializeResult> {
        self.initialized = true;
        Ok(InitializeResult {
            capabilities: self.capabilities.clone(),
            server_info: Some(ServerInfo {
                name: "cgrx-lsp".to_string(),
                version: Some(env!("CARGO_PKG_VERSION").to_string()),
            }),
        })
    }

    /// Handles a shutdown request.
    pub fn shutdown(&mut self) -> LspResult<()> {
        self.initialized = false;
        Ok(())
    }

    /// Handles a textDocument/didOpen notification.
    pub fn did_open(&mut self, params: DidOpenTextDocumentParams) -> LspResult<()> {
        let doc = Document::new(&params.text_document);
        self.documents.insert(doc.uri.clone(), doc);
        Ok(())
    }

    /// Handles a textDocument/didChange notification.
    pub fn did_change(&mut self, params: DidChangeTextDocumentParams) -> LspResult<()> {
        if let Some(doc) = self.documents.get_mut(&params.text_document.uri) {
            doc.update(&params.content_changes, params.text_document.version);
        }
        Ok(())
    }

    /// Handles a textDocument/didClose notification.
    pub fn did_close(&mut self, params: DidCloseTextDocumentParams) -> LspResult<()> {
        self.documents.remove(&params.text_document.uri);
        Ok(())
    }

    /// Handles a textDocument/definition request.
    pub fn goto_definition(
        &self,
        params: GotoDefinitionParams,
    ) -> LspResult<Option<GotoDefinitionResponse>> {
        if !self.initialized {
            return Err(LspError::NotInitialized);
        }

        let uri = &params.text_document.uri;
        let position = &params.position;

        let doc = self
            .documents
            .get(uri)
            .ok_or_else(|| LspError::InvalidParams(format!("document not found: {uri}")))?;

        // Get the word at the position
        let word = doc
            .word_at(position)
            .ok_or_else(|| LspError::InvalidParams("no word at position".to_string()))?;

        // Find the definition in the graph
        let locations = self.find_definitions(&word, uri)?;

        Ok(Some(GotoDefinitionResponse::Array(locations)))
    }

    /// Handles a textDocument/references request.
    pub fn find_references(&self, params: ReferenceParams) -> LspResult<Option<Vec<Location>>> {
        if !self.initialized {
            return Err(LspError::NotInitialized);
        }

        let uri = &params.text_document.uri;
        let position = &params.position;

        let doc = self
            .documents
            .get(uri)
            .ok_or_else(|| LspError::InvalidParams(format!("document not found: {uri}")))?;

        // Get the word at the position
        let word = doc
            .word_at(position)
            .ok_or_else(|| LspError::InvalidParams("no word at position".to_string()))?;

        // Find references in the graph
        let locations = self.find_references_internal(&word, uri, &params.context)?;

        Ok(Some(locations))
    }

    /// Finds definitions of a symbol in the graph.
    fn find_definitions(&self, name: &str, _source_uri: &str) -> LspResult<Vec<Location>> {
        let mut locations = Vec::new();

        // First, check the documents in the graph
        if let Some(graph) = &self.graph {
            for doc in &graph.documents {
                if doc.qualified_name == name {
                    let range = self.span_to_lsp_range(&doc.span);
                    locations.push(Location {
                        uri: doc.path.clone(),
                        range,
                    });
                }
            }

            // Also check edges for call targets
            for edge in &graph.edges {
                if edge.edge.target == name {
                    let range = self.span_to_lsp_range(&edge.edge.span);
                    locations.push(Location {
                        uri: edge.path.clone(),
                        range,
                    });
                }
            }
        }

        // Check open documents for symbol definitions
        for (uri, doc) in &self.documents {
            for symbol in &doc.symbols {
                if symbol.name == name {
                    let range = self.span_to_lsp_range(&symbol.span);
                    locations.push(Location {
                        uri: uri.clone(),
                        range,
                    });
                }
            }
        }

        // Deduplicate locations
        locations.sort_by(|a, b| {
            (&a.uri, a.range.start.line, a.range.start.character).cmp(&(
                &b.uri,
                b.range.start.line,
                b.range.start.character,
            ))
        });
        locations.dedup_by(|a, b| a.uri == b.uri && a.range.start.line == b.range.start.line);

        Ok(locations)
    }

    /// Finds references to a symbol in the graph.
    fn find_references_internal(
        &self,
        name: &str,
        _source_uri: &str,
        context: &ReferenceContext,
    ) -> LspResult<Vec<Location>> {
        let mut locations = Vec::new();

        // Check edges in the graph for references
        if let Some(graph) = &self.graph {
            for edge in &graph.edges {
                if edge.edge.target == name {
                    let range = self.span_to_lsp_range(&edge.edge.span);
                    locations.push(Location {
                        uri: edge.path.clone(),
                        range,
                    });
                }
            }
        }

        // Check open documents for references
        for (uri, doc) in &self.documents {
            for edge in &doc.edges {
                if edge.target == name {
                    let range = self.span_to_lsp_range(&edge.span);
                    locations.push(Location {
                        uri: uri.clone(),
                        range,
                    });
                }
            }
        }

        // Include declaration if requested
        if context.include_declaration
            && let Some(graph) = &self.graph
        {
            for doc in &graph.documents {
                if doc.qualified_name == name {
                    let range = self.span_to_lsp_range(&doc.span);
                    locations.push(Location {
                        uri: doc.path.clone(),
                        range,
                    });
                }
            }
        }

        // Deduplicate locations
        locations.sort_by(|a, b| {
            (&a.uri, a.range.start.line, a.range.start.character).cmp(&(
                &b.uri,
                b.range.start.line,
                b.range.start.character,
            ))
        });
        locations.dedup_by(|a, b| a.uri == b.uri && a.range.start.line == b.range.start.line);

        Ok(locations)
    }

    /// Converts a CGRX Span to an LSP Range.
    fn span_to_lsp_range(&self, span: &Span) -> Range {
        Range {
            start: Position {
                line: span.start as u32,
                character: 0,
            },
            end: Position {
                line: span.end as u32,
                character: 0,
            },
        }
    }
}

impl Default for LspServer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn document_extracts_symbols() {
        let item = TextDocumentItem {
            uri: "file:///test.rs".to_string(),
            language_id: "rust".to_string(),
            version: 1,
            text: "fn hello() {}\nfn world() {}".to_string(),
        };

        let doc = Document::new(&item);
        assert!(!doc.symbols.is_empty());
    }

    #[test]
    fn document_word_at_position() {
        let item = TextDocumentItem {
            uri: "file:///test.rs".to_string(),
            language_id: "rust".to_string(),
            version: 1,
            text: "fn hello() {}".to_string(),
        };

        let doc = Document::new(&item);
        let pos = Position {
            line: 0,
            character: 4,
        };
        let word = doc.word_at(&pos);
        assert_eq!(word, Some("hello".to_string()));
    }

    #[test]
    fn server_initialize() {
        let mut server = LspServer::new();
        let params = InitializeParams::default();
        let result = server.initialize(params).unwrap();
        assert!(server.is_initialized());
        assert!(result.capabilities.definition_provider.unwrap_or(false));
        assert!(result.capabilities.references_provider.unwrap_or(false));
    }

    #[test]
    fn server_goto_definition() {
        let mut server = LspServer::new();
        server.initialize(InitializeParams::default()).unwrap();

        // Open a document
        let item = TextDocumentItem {
            uri: "file:///test.rs".to_string(),
            language_id: "rust".to_string(),
            version: 1,
            text: "fn hello() {}\nfn world() { hello(); }".to_string(),
        };
        server
            .did_open(DidOpenTextDocumentParams {
                text_document: item,
            })
            .unwrap();

        // Request definition
        let params = GotoDefinitionParams {
            text_document: TextDocumentIdentifier {
                uri: "file:///test.rs".to_string(),
            },
            position: Position {
                line: 0,
                character: 4,
            },
        };

        let result = server.goto_definition(params).unwrap();
        assert!(result.is_some());
    }

    #[test]
    fn server_find_references() {
        let mut server = LspServer::new();
        server.initialize(InitializeParams::default()).unwrap();

        // Open a document
        let item = TextDocumentItem {
            uri: "file:///test.rs".to_string(),
            language_id: "rust".to_string(),
            version: 1,
            text: "fn hello() {}\nfn world() { hello(); }".to_string(),
        };
        server
            .did_open(DidOpenTextDocumentParams {
                text_document: item,
            })
            .unwrap();

        // Request references
        let params = ReferenceParams {
            text_document: TextDocumentIdentifier {
                uri: "file:///test.rs".to_string(),
            },
            position: Position {
                line: 0,
                character: 4,
            },
            context: ReferenceContext {
                include_declaration: true,
            },
        };

        let result = server.find_references(params).unwrap();
        assert!(result.is_some());
    }
}
