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
use std::collections::BTreeMap;
use std::fmt;
use std::path::{Path, PathBuf};
use url::Url;

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
    pub fn update(
        &mut self,
        changes: &[TextDocumentContentChangeEvent],
        version: i32,
    ) -> LspResult<()> {
        for change in changes {
            if let Some(range) = &change.range {
                let start = self.position_to_offset(&range.start).ok_or_else(|| {
                    LspError::InvalidParams("change start is outside the document".to_string())
                })?;
                let end = self.position_to_offset(&range.end).ok_or_else(|| {
                    LspError::InvalidParams("change end is outside the document".to_string())
                })?;
                if start > end {
                    return Err(LspError::InvalidParams(
                        "change range starts after it ends".to_string(),
                    ));
                }
                self.content.replace_range(start..end, &change.text);
            } else {
                self.content = change.text.clone();
            }
        }
        self.version = version;
        self.extract_symbols();
        Ok(())
    }

    /// Extracts symbols from the document content using the appropriate language pack.
    fn extract_symbols(&mut self) {
        self.symbols.clear();
        self.edges.clear();

        let uri_path = Url::parse(&self.uri)
            .ok()
            .and_then(|uri| uri.to_file_path().ok());
        let path = uri_path.as_deref().unwrap_or_else(|| Path::new(&self.uri));
        let extraction_path = path.file_name().map(Path::new).unwrap_or(path);
        let content = self.content.as_bytes();

        if let Some(pack) = pack_for_path(extraction_path) {
            match pack.extract(extraction_path, content) {
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
    fn position_to_offset(&self, pos: &Position) -> Option<usize> {
        let (line_start, line_end) = line_bounds(&self.content, pos.line)?;
        let line = &self.content[line_start..line_end];
        let target = usize::try_from(pos.character).ok()?;
        let mut utf16_offset = 0;
        for (byte_offset, character) in line.char_indices() {
            if utf16_offset == target {
                return Some(line_start + byte_offset);
            }
            utf16_offset += character.len_utf16();
            if utf16_offset > target {
                return None;
            }
        }
        (utf16_offset == target).then_some(line_end)
    }

    /// Returns the symbol at the given position, if any.
    pub fn symbol_at(&self, pos: &Position) -> Option<&Symbol> {
        let offset = self.position_to_offset(pos)?;
        self.symbols
            .iter()
            .find(|s| s.span.start <= offset && offset <= s.span.end)
    }

    /// Returns the word at the given position.
    pub fn word_at(&self, pos: &Position) -> Option<String> {
        let offset = self.position_to_offset(pos)?;
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

fn line_bounds(content: &str, target_line: u32) -> Option<(usize, usize)> {
    let mut start = 0;
    for line in 0..=target_line {
        let end = content[start..]
            .find('\n')
            .map_or(content.len(), |offset| start + offset);
        if line == target_line {
            let logical_end = if end > start && content.as_bytes()[end - 1] == b'\r' {
                end - 1
            } else {
                end
            };
            return Some((start, logical_end));
        }
        if end == content.len() {
            return None;
        }
        start = end + 1;
    }
    None
}

fn offset_to_position(content: &str, offset: usize) -> Option<Position> {
    if offset > content.len() || !content.is_char_boundary(offset) {
        return None;
    }
    let prefix = &content[..offset];
    let line = u32::try_from(prefix.bytes().filter(|byte| *byte == b'\n').count()).ok()?;
    let line_start = prefix.rfind('\n').map_or(0, |index| index + 1);
    let character = u32::try_from(content[line_start..offset].encode_utf16().count()).ok()?;
    Some(Position { line, character })
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
    /// Canonical repository root used to resolve graph paths.
    workspace_root: Option<PathBuf>,
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
            workspace_root: None,
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
            workspace_root: None,
        }
    }

    /// Creates a server backed by a graph whose paths are relative to `workspace_root`.
    pub fn with_graph_at_root(graph: BaseGraph, workspace_root: PathBuf) -> Self {
        let mut server = Self::with_graph(graph);
        server.workspace_root = Some(workspace_root);
        server
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
    pub fn initialize(&mut self, params: InitializeParams) -> LspResult<InitializeResult> {
        if self.workspace_root.is_none() {
            self.workspace_root = params
                .root_uri
                .as_deref()
                .and_then(|uri| Url::parse(uri).ok())
                .and_then(|uri| uri.to_file_path().ok());
        }
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
        let doc = self
            .documents
            .get_mut(&params.text_document.uri)
            .ok_or_else(|| {
                LspError::InvalidParams(format!("document not found: {}", params.text_document.uri))
            })?;
        doc.update(&params.content_changes, params.text_document.version)
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
                if graph_name_matches(&doc.qualified_name, name)
                    && let Some(location) = self.location_for_span(&doc.path, &doc.span)
                {
                    locations.push(location);
                }
            }
        }

        // Check open documents for symbol definitions
        for (uri, doc) in &self.documents {
            for symbol in &doc.symbols {
                if symbol.name == name
                    && let Some(location) = self.location_for_span(uri, &symbol.span)
                {
                    locations.push(location);
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
        locations.dedup_by(|a, b| a.uri == b.uri && a.range == b.range);

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
            let targets: std::collections::BTreeSet<_> = graph
                .documents
                .iter()
                .filter(|document| graph_name_matches(&document.qualified_name, name))
                .map(|document| document.node_id)
                .collect();
            for arc in &graph.arcs {
                if targets.contains(&arc.target)
                    && let Some(location) = self.location_for_span(
                        &arc.evidence.path,
                        &Span {
                            start: arc.evidence.span.start,
                            end: arc.evidence.span.end,
                        },
                    )
                {
                    locations.push(location);
                }
            }
        }

        // Check open documents for references
        for (uri, doc) in &self.documents {
            for edge in &doc.edges {
                if edge.target == name
                    && let Some(location) = self.location_for_span(uri, &edge.span)
                {
                    locations.push(location);
                }
            }
        }

        // Include declaration if requested
        if context.include_declaration
            && let Some(graph) = &self.graph
        {
            for doc in &graph.documents {
                if graph_name_matches(&doc.qualified_name, name)
                    && let Some(location) = self.location_for_span(&doc.path, &doc.span)
                {
                    locations.push(location);
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
        locations.dedup_by(|a, b| a.uri == b.uri && a.range == b.range);

        Ok(locations)
    }

    fn location_for_span(&self, path_or_uri: &str, span: &Span) -> Option<Location> {
        let (uri, source) = if let Some(document) = self.documents.get(path_or_uri) {
            (path_or_uri.to_owned(), document.content.clone())
        } else {
            let path = if let Ok(uri) = Url::parse(path_or_uri) {
                uri.to_file_path().ok()?
            } else {
                let path = Path::new(path_or_uri);
                if path.is_absolute() {
                    path.to_path_buf()
                } else {
                    self.workspace_root.as_ref()?.join(path)
                }
            };
            let uri = Url::from_file_path(&path).ok()?.to_string();
            let source = std::fs::read_to_string(path).ok()?;
            (uri, source)
        };
        let start = offset_to_position(&source, span.start)?;
        let end = offset_to_position(&source, span.end)?;
        Some(Location {
            uri,
            range: Range { start, end },
        })
    }
}

fn graph_name_matches(qualified_name: &str, name: &str) -> bool {
    qualified_name == name
        || qualified_name
            .rsplit([':', '.', '#', '/'])
            .find(|part| !part.is_empty())
            == Some(name)
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
    fn document_positions_use_utf16_code_units() {
        let item = TextDocumentItem {
            uri: "file:///test.rs".to_string(),
            language_id: "rust".to_string(),
            version: 1,
            text: "😀 alpha".to_string(),
        };

        let doc = Document::new(&item);
        assert_eq!(
            doc.word_at(&Position {
                line: 0,
                character: 3,
            }),
            Some("alpha".to_string())
        );
    }

    #[test]
    fn document_rejects_positions_beyond_the_last_line() {
        let item = TextDocumentItem {
            uri: "file:///test.rs".to_string(),
            language_id: "rust".to_string(),
            version: 1,
            text: "fn last_word() {}".to_string(),
        };

        let doc = Document::new(&item);
        assert_eq!(
            doc.word_at(&Position {
                line: 99,
                character: 0,
            }),
            None
        );
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
    fn definition_range_uses_source_lines_not_byte_offsets() {
        let mut server = LspServer::new();
        server.initialize(InitializeParams::default()).unwrap();
        let uri = "file:///test.rs".to_string();
        server
            .did_open(DidOpenTextDocumentParams {
                text_document: TextDocumentItem {
                    uri: uri.clone(),
                    language_id: "rust".to_string(),
                    version: 1,
                    text: "fn first() {}\nfn target() {}\nfn caller() { target(); }".to_string(),
                },
            })
            .unwrap();

        let response = server
            .goto_definition(GotoDefinitionParams {
                text_document: TextDocumentIdentifier { uri: uri.clone() },
                position: Position {
                    line: 2,
                    character: 15,
                },
            })
            .unwrap()
            .unwrap();
        let GotoDefinitionResponse::Array(locations) = response else {
            panic!("definition returns a location array");
        };
        assert!(locations.iter().any(|location| {
            location.uri == uri
                && location.range.start.line == 1
                && location.range.start.character == 3
        }));
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

    #[test]
    fn references_keep_distinct_calls_on_the_same_line() {
        let mut server = LspServer::new();
        server.initialize(InitializeParams::default()).unwrap();
        let uri = "file:///test.rs".to_string();
        server
            .did_open(DidOpenTextDocumentParams {
                text_document: TextDocumentItem {
                    uri: uri.clone(),
                    language_id: "rust".to_string(),
                    version: 1,
                    text: "fn target() {}\nfn caller() { target(); target(); }".to_string(),
                },
            })
            .unwrap();

        let locations = server
            .find_references(ReferenceParams {
                text_document: TextDocumentIdentifier { uri },
                position: Position {
                    line: 0,
                    character: 4,
                },
                context: ReferenceContext {
                    include_declaration: false,
                },
            })
            .unwrap()
            .unwrap();
        assert_eq!(
            locations.len(),
            2,
            "extracted edges: {:?}",
            server.documents["file:///test.rs"].edges
        );
        assert_ne!(
            locations[0].range.start.character,
            locations[1].range.start.character
        );
    }
}
