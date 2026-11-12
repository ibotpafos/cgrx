//! Bounded, read-only structural discovery with the same parsers as the index.

use std::borrow::Cow;
use std::collections::BTreeMap;
use std::fs;
use std::io::Read;
use std::path::{Component, Path};

use ast_grep_core::AstGrep;
use ast_grep_core::language::Language;
use ast_grep_core::matcher::PatternBuilder;
use ast_grep_core::tree_sitter::{LanguageExt, StrDoc, TSLanguage};
use ast_grep_core::{Pattern, PatternError};
use cgrx_core::{Hash32, Scope};
use cgrx_languages::pack_for_path;
use serde_json::{Value, json};

use super::graph_query::search_continuation;
use super::scan_helpers::ScopedQuery;
use super::{Runtime, RuntimeError, coverage_gap_count, path_in_scope};

const MAX_PATTERN_BYTES: usize = 4096;
const MAX_DEFINITIONS: usize = 4096;
const MAX_SOURCE_BYTES: usize = 16 * 1024 * 1024;
const MAX_READ_BYTES: usize = 64 * 1024 * 1024;
const MAX_PARSE_BYTES: usize = 16 * 1024 * 1024;
const MAX_MATCH_SPANS: usize = 8;

#[derive(Clone)]
struct IndexedLanguage {
    parser: TSLanguage,
    expando: char,
}

impl IndexedLanguage {
    fn for_path(path: &Path) -> Option<Self> {
        let pack = pack_for_path(path)?;
        let expando = match pack.id() {
            "typescript" => '$',
            "rust" | "python" | "go" => 'µ',
            _ => return None,
        };
        Some(Self {
            parser: pack.language_for_path(path),
            expando,
        })
    }
}

impl Language for IndexedLanguage {
    fn kind_to_id(&self, kind: &str) -> u16 {
        self.parser.id_for_node_kind(kind, true)
    }

    fn field_to_id(&self, field: &str) -> Option<u16> {
        self.parser.field_id_for_name(field).map(|id| id.get())
    }

    fn expando_char(&self) -> char {
        self.expando
    }

    fn pre_process_pattern<'q>(&self, query: &'q str) -> Cow<'q, str> {
        if self.expando == '$' {
            return Cow::Borrowed(query);
        }
        // Translate ast-grep metavariables to identifiers accepted by these
        // grammars. Ordinary dollar signs retain their literal spelling.
        let mut chars = query.chars().peekable();
        let mut translated = String::with_capacity(query.len());
        while let Some(ch) = chars.next() {
            if ch != '$' {
                translated.push(ch);
                continue;
            }
            let mut count = 1;
            while chars.peek() == Some(&'$') {
                chars.next();
                count += 1;
            }
            let replace = count == 3
                || chars
                    .peek()
                    .is_some_and(|ch| ch.is_ascii_uppercase() || *ch == '_');
            translated.extend(std::iter::repeat_n(
                if replace { self.expando } else { '$' },
                count,
            ));
        }
        Cow::Owned(translated)
    }

    fn build_pattern(&self, builder: &PatternBuilder) -> Result<Pattern, PatternError> {
        builder.build(|source| StrDoc::try_new(source, self.clone()))
    }
}

impl LanguageExt for IndexedLanguage {
    fn get_ts_language(&self) -> TSLanguage {
        self.parser.clone()
    }
}

fn pattern(query: &str, language: IndexedLanguage) -> Result<Pattern, RuntimeError> {
    let pattern = Pattern::try_new(query, language).map_err(|_| {
        RuntimeError::new(
            "cgrx.invalid_ast_pattern",
            "pattern must describe one syntax node; use $NAME or $$$ARGS for metavariables",
        )
    })?;
    if pattern.has_error() {
        return Err(RuntimeError::new(
            "cgrx.invalid_ast_pattern",
            "pattern has no valid syntax node in the selected language",
        ));
    }
    Ok(pattern)
}

// Read each selected file once per request. The bytes, source hash and ranges
// are checked independently of the refresh that preceded this request.
fn source(
    root: &Path,
    path: &str,
    expected: Hash32,
    read_bytes: &mut usize,
) -> Result<Option<String>, RuntimeError> {
    let relative = Path::new(path);
    if relative
        .components()
        .any(|component| !matches!(component, Component::Normal(_)))
    {
        return Err(RuntimeError::new(
            "cgrx.ast_source_unavailable",
            "indexed path is not repository-relative",
        ));
    }
    let absolute = root.join(relative);
    let metadata = fs::symlink_metadata(&absolute).map_err(|_| {
        RuntimeError::new(
            "cgrx.ast_source_changed",
            "indexed source is unavailable; refresh status and retry",
        )
    })?;
    let canonical = absolute.canonicalize().map_err(|_| {
        RuntimeError::new(
            "cgrx.ast_source_changed",
            "indexed source is unavailable; refresh status and retry",
        )
    })?;
    if !metadata.is_file() || metadata.file_type().is_symlink() || !canonical.starts_with(root) {
        return Err(RuntimeError::new(
            "cgrx.ast_source_unavailable",
            "structural search requires a regular file inside this repository",
        ));
    }
    if metadata.len() > MAX_SOURCE_BYTES as u64
        || metadata.len() > MAX_READ_BYTES.saturating_sub(*read_bytes) as u64
    {
        return Ok(None);
    }
    let file = fs::File::open(&canonical).map_err(|_| {
        RuntimeError::new(
            "cgrx.ast_source_changed",
            "indexed source is unavailable; refresh status and retry",
        )
    })?;
    let mut bytes = Vec::new();
    file.take(MAX_SOURCE_BYTES as u64 + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| {
            RuntimeError::new(
                "cgrx.ast_source_changed",
                "indexed source could not be read; refresh status and retry",
            )
        })?;
    *read_bytes = read_bytes.saturating_add(bytes.len());
    if bytes.len() > MAX_SOURCE_BYTES || *read_bytes > MAX_READ_BYTES {
        return Ok(None);
    }
    if Hash32(*blake3::hash(&bytes).as_bytes()) != expected {
        return Err(RuntimeError::new(
            "cgrx.ast_source_changed",
            "source changed after indexing; refresh status and retry",
        ));
    }
    Ok(String::from_utf8(bytes).ok())
}

impl Runtime {
    /// Find indexed definitions containing a syntax pattern, with exact byte
    /// spans in verified current source. This is not a callee binding proof.
    pub fn search_ast_graph_page(
        &self,
        root: &Path,
        query: &str,
        scope: &Scope,
        page: (usize, usize),
        language: &str,
    ) -> Result<Value, RuntimeError> {
        let query = query.trim();
        let (limit, offset) = page;
        if query.is_empty()
            || query.len() > MAX_PATTERN_BYTES
            || !(1..=50).contains(&limit)
            || offset > 1_000_000
        {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "AST query must be 1..4096 bytes; limit must be 1..50; offset must be 0..1000000",
            ));
        }
        let extension = match language {
            "rust" => "rs",
            "typescript" => "ts",
            "python" => "py",
            "go" => "go",
            _ => {
                return Err(RuntimeError::new(
                    "cgrx.invalid_arguments",
                    "AST mode requires language rust, typescript, python, or go",
                ));
            }
        };
        let default_language =
            IndexedLanguage::for_path(Path::new(&format!("pattern.{extension}")))
                .expect("released language pack");
        let default_pattern = pattern(query, default_language)?;
        let root = root.canonicalize().map_err(|_| {
            RuntimeError::new(
                "cgrx.ast_source_unavailable",
                "repository source root is unavailable",
            )
        })?;
        let mut scoped = ScopedQuery::new(&self.stored, scope, path_in_scope);
        let mut documents = scoped.syntax_documents(&self.stored);
        documents.retain(|document| {
            pack_for_path(Path::new(&document.path)).is_some_and(|pack| pack.id() == language)
        });
        documents.sort_by_key(|document| (&document.path, document.span_start, document.node_id));
        let total_definitions = documents.len();
        let mut sources = BTreeMap::<&str, Option<String>>::new();
        let mut read_bytes = 0_usize;
        let mut parsed_bytes = 0_usize;
        let mut searched = 0_usize;
        let mut hits = Vec::new();
        let mut tsx_pattern = None;
        for document in documents.into_iter().take(MAX_DEFINITIONS) {
            let body_len = document.body_end.saturating_sub(document.body_start);
            if body_len == 0 || body_len > MAX_PARSE_BYTES.saturating_sub(parsed_bytes) {
                continue;
            }
            let Some(&hash) = self.stored.path_hashes.get(&document.path) else {
                continue;
            };
            let cached = match sources.entry(document.path.as_str()) {
                std::collections::btree_map::Entry::Occupied(entry) => entry.into_mut(),
                std::collections::btree_map::Entry::Vacant(entry) => {
                    entry.insert(source(&root, &document.path, hash, &mut read_bytes)?)
                }
            };
            let Some(text) = cached.as_deref() else {
                continue;
            };
            let Some(body) = text.get(document.body_start..document.body_end) else {
                continue;
            };
            let language = IndexedLanguage::for_path(Path::new(&document.path))
                .expect("filtered language pack");
            let selected_pattern = if document.path.ends_with(".tsx") {
                if tsx_pattern.is_none() {
                    tsx_pattern = Some(pattern(query, language.clone())?);
                }
                tsx_pattern.as_ref().expect("initialized TSX pattern")
            } else {
                &default_pattern
            };
            let tree = AstGrep::try_new(body, language).map_err(|_| {
                RuntimeError::new("cgrx.ast_parser", "structural parser is unavailable")
            })?;
            searched += 1;
            parsed_bytes += body.len();
            let node = tree.root();
            let mut matches = node.find_all(selected_pattern);
            let spans = matches.by_ref().take(MAX_MATCH_SPANS).map(|hit| {
                let range = hit.range();
                json!({"start":document.body_start + range.start,"end":document.body_start + range.end})
            }).collect::<Vec<_>>();
            if !spans.is_empty() {
                hits.push((
                    document,
                    json!({"spans":spans,"truncated":matches.next().is_some(),"source_hash":hash}),
                ));
            }
        }
        let total = hits.len();
        let page = hits
            .into_iter()
            .skip(offset)
            .take(limit)
            .collect::<Vec<_>>();
        let node_ids = page.iter().map(|(document, _)| document.node_id).collect();
        let degrees = scoped.relationship_degrees(&self.stored, &node_ids);
        let rows = page.into_iter().map(|(document, evidence)| {
            let (callers, callees) = degrees.get(&document.node_id).copied().unwrap_or_default();
            json!({"node_id":document.node_id,"symbol":document.qualified_name,"path":document.path,"span":{"start":document.span_start,"end":document.span_end},"symbol_ref":self.symbol_reference(document),"callers":callers,"callees":callees,"matched_by":"ast","ast_matches":evidence})
        }).collect::<Vec<_>>();
        let next_offset = search_continuation(offset, rows.len(), total)?;
        Ok(json!({
            "snapshot":self.stored.snapshot,"query":query,"language":language,"algorithm":"ast_grep_v1","llm_used":false,
            "matches":rows,"total":total,"truncated":next_offset.is_some(),
            "page":{"offset":offset,"limit":limit,"next_offset":next_offset,"has_more":next_offset.is_some(),"snapshot_id":self.search_snapshot_id()?},
            "coverage_gap_count":coverage_gap_count(&scoped.coverage(&self.stored.coverage)),
            "ast_scan":{"definitions":total_definitions,"searched_definitions":searched,"skipped_definitions":total_definitions - searched,"parsed_bytes":parsed_bytes,"partial":searched < total_definitions,"max_definitions":MAX_DEFINITIONS,"max_source_bytes":MAX_SOURCE_BYTES,"max_read_bytes":MAX_READ_BYTES,"max_parse_bytes":MAX_PARSE_BYTES,"max_match_spans":MAX_MATCH_SPANS}
        }))
    }
}
