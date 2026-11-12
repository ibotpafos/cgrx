//! Typed, versioned agent memory backed by Memvid. Evidence stays separate from assertions.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io;
use std::io::Read;
use std::path::{Component, Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, OnceLock};

use fastembed::{EmbeddingModel, InitOptions, TextEmbedding};
use memvid_core::io::header::HeaderCodec;
use memvid_core::{DocMetadata, EmbeddedWal, Memvid, MemvidError, PutOptions, TimelineQuery};
use serde::{Deserialize, Serialize};

use crate::generation::{WriterLock, acquire_writer_lock_with_timeout};
use crate::memory::{
    DEFAULT_PRIVACY_TAG, DecisionRecord, MAX_CONFIDENCE, MAX_FACT_CHARS, MemoryProvenance,
    MemoryRecallQuery, MemoryRecordInput, MemorySpan, MemoryStore, fingerprint, invalid_data,
    invalid_input,
};

const AGENT_SCHEMA: u32 = 2;
// A non-UTF-8 prefix keeps Memvid's document chunker from splitting the
// structured envelope. Only the separately supplied retrieval text is searchable.
const PAYLOAD_MAGIC: &[u8] = b"CGRX-MEMORY\xff\x02";
const MODEL: &str = "intfloat/multilingual-e5-small";
const WORKING_TTL: u64 = 24 * 60 * 60 * 1_000_000_000;
static EMBEDDER: OnceLock<Mutex<Option<TextEmbedding>>> = OnceLock::new();
static RECOVERY_FILE_SEQUENCE: AtomicU64 = AtomicU64::new(0);

// Only wait before obtaining the writer lease: never replay a mutation after
// a commit or an uncertain write. Graph publication retains its fail-fast lock.
fn acquire_writer_lock(root: &Path) -> io::Result<WriterLock> {
    acquire_writer_lock_with_timeout(root, std::time::Duration::from_secs(2))
}

/// Release the process-local inference session, never persistent memory data.
/// The same mutex serializes embedding calls; an active inference finishes
/// before its session can be taken. A later semantic operation loads it again.
pub fn release_memory_model() -> bool {
    let worker_released = crate::embedding_worker::release();
    let Some(lock) = EMBEDDER.get() else {
        return worker_released;
    };
    let mut guard = lock
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    let model = guard.take();
    let released = model.is_some();
    // Keep serialization through native-session destruction as well as use.
    drop(model);
    lock.clear_poison();
    released || worker_released
}

struct RecoveryFile(PathBuf);

impl Drop for RecoveryFile {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.0);
    }
}

/// A failed write may already be durable through WAL recovery. Reconcile before retrying.
#[derive(Debug)]
pub struct MemoryWriteUncertain {
    pub id: String,
    pub operation: &'static str,
    pub expected_version: Option<u32>,
    pub cause: io::Error,
}

impl std::fmt::Display for MemoryWriteUncertain {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter
            .write_str("memory write outcome is unconfirmed; verify current state before retrying")
    }
}

impl std::error::Error for MemoryWriteUncertain {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        Some(&self.cause)
    }
}

impl MemoryWriteUncertain {
    /// Bounded diagnostics only: never expose SDK strings containing user data.
    #[must_use]
    pub fn backend_class(&self) -> &'static str {
        match self
            .cause
            .get_ref()
            .and_then(|error| error.downcast_ref::<MemvidError>())
        {
            Some(MemvidError::CapacityExceeded { .. }) => "capacity_exceeded",
            Some(MemvidError::Tantivy { .. }) => "search_index",
            Some(MemvidError::Locked(_)) => "locked",
            Some(MemvidError::Io { .. }) => "io",
            _ => "other",
        }
    }
}

/// The SDK rejected ingestion before WAL append, even after checked compaction.
#[derive(Debug)]
pub struct MemoryCapacityExceeded {
    pub current: u64,
    pub limit: u64,
    pub required: u64,
}

impl std::fmt::Display for MemoryCapacityExceeded {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(
            "project memory capacity exhausted after compaction; mutation was not appended",
        )
    }
}

impl std::error::Error for MemoryCapacityExceeded {}

enum PendingAgentWrite<'a> {
    Record(&'a AgentMemoryRecord),
    Update(&'a AgentMemoryRecord, u32),
    Forget(&'a str, u32),
}

impl PendingAgentWrite<'_> {
    fn confirmed(&self, versions: &[(u64, AgentMemoryRecord)]) -> bool {
        match self {
            Self::Record(expected) | Self::Update(expected, _) => latest(versions)
                .get(&expected.decision.id)
                .is_some_and(|(_, record)| record == *expected),
            Self::Forget(id, _) => versions.iter().all(|(_, record)| record.decision.id != *id),
        }
    }

    fn uncertain(&self, cause: io::Error) -> io::Error {
        let (id, operation, expected_version) = match self {
            Self::Record(record) => (record.decision.id.clone(), "record", None),
            Self::Update(record, version) => (record.decision.id.clone(), "update", Some(*version)),
            Self::Forget(id, version) => (id.to_string(), "forget", Some(*version)),
        };
        io::Error::other(MemoryWriteUncertain {
            id,
            operation,
            expected_version,
            cause,
        })
    }
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum MemoryKind {
    #[default]
    Semantic,
    Episodic,
    Procedural,
    Working,
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum MemorySourceKind {
    #[default]
    Code,
    User,
    Agent,
    Tool,
    /// Only used by the compatibility API and migration; never accepted by MCP writes.
    Legacy,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum MemoryFreshness {
    /// The source bytes still match. This does not verify the assertion's truth.
    Unchanged,
    NeedsReview,
    Unverified,
    Historical,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct MemoryCodeRange {
    pub start: usize,
    pub end: usize,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct MemoryCodeLink {
    pub symbol: String,
    pub definition_span: MemoryCodeRange,
    pub body_span: MemoryCodeRange,
    pub source_hash: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct MemoryCodeCandidate {
    pub path: String,
    pub symbol: String,
    pub symbol_ref: String,
    pub definition_span: MemoryCodeRange,
    pub match_kind: &'static str,
}

#[derive(Clone, Debug, Serialize)]
pub struct MemoryCodeExcerpt {
    pub status: &'static str,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub symbol: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub symbol_ref: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub definition_span: Option<MemoryCodeRange>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub span: Option<MemorySpan>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub candidates: Vec<MemoryCodeCandidate>,
    pub candidates_truncated: bool,
    pub truncated: bool,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct AgentMemoryInput {
    #[serde(flatten)]
    pub decision: MemoryRecordInput,
    #[serde(default)]
    pub memory_kind: MemoryKind,
    #[serde(default)]
    pub source_kind: MemorySourceKind,
    #[serde(default)]
    pub source_ref: Option<String>,
    #[serde(default)]
    pub task_id: Option<String>,
    #[serde(default)]
    pub event_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub code_link: Option<MemoryCodeLink>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct AgentMemoryRecord {
    #[serde(flatten)]
    pub decision: DecisionRecord,
    pub memory_kind: MemoryKind,
    pub source_kind: MemorySourceKind,
    pub source_ref: Option<String>,
    pub source_hash: Option<String>,
    pub task_id: Option<String>,
    pub event_id: Option<String>,
    pub version: u32,
    pub updated_unix_nanos: u64,
    pub update_reason: Option<String>,
    // Omission preserves the serialized integrity hash of earlier v2 envelopes.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub code_link: Option<MemoryCodeLink>,
}

#[derive(Clone, Debug, Serialize)]
pub struct AgentMemoryPublication {
    pub record: AgentMemoryRecord,
    pub duplicate: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct AgentMemoryHit {
    #[serde(flatten)]
    pub record: AgentMemoryRecord,
    pub freshness: MemoryFreshness,
    pub score: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<MemoryCodeExcerpt>,
}

#[derive(Clone, Debug)]
pub struct AgentMemoryQuery {
    pub recall: MemoryRecallQuery,
    pub memory_kind: Option<MemoryKind>,
    pub task_id: Option<String>,
    pub path: Option<String>,
    pub symbol: Option<String>,
    pub include_stale: bool,
    /// Reading by ID includes history only when explicitly requested.
    pub id: Option<String>,
    pub include_history: bool,
}

impl AgentMemoryQuery {
    fn matches(&self, record: &AgentMemoryRecord) -> bool {
        let decision = &record.decision;
        !decision.expired(self.recall.now_unix_nanos)
            && decision.confidence >= self.recall.min_confidence
            && self
                .recall
                .privacy_tag
                .as_ref()
                .is_none_or(|t| t == &decision.privacy_tag)
            && self
                .recall
                .revision
                .as_ref()
                .is_none_or(|r| r == &decision.provenance.rev)
            && self.memory_kind.is_none_or(|k| k == record.memory_kind)
            && self
                .task_id
                .as_ref()
                .is_none_or(|t| record.task_id.as_ref() == Some(t))
            && self
                .path
                .as_ref()
                .is_none_or(|p| p == &decision.provenance.path)
            && self.symbol.as_ref().is_none_or(|s| {
                record
                    .code_link
                    .as_ref()
                    .is_some_and(|link| s == &link.symbol)
            })
            && self.id.as_ref().is_none_or(|id| id == &decision.id)
    }
}

#[derive(Clone, Debug, Serialize)]
pub struct AgentMemoryRecall {
    pub results: Vec<AgentMemoryHit>,
    pub truncated: bool,
    pub search_mode: &'static str,
    pub embedding_model: Option<&'static str>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
struct Envelope {
    schema_version: u32,
    content_hash: String,
    record: AgentMemoryRecord,
}

struct SourceFingerprint {
    hash: String,
    lines: usize,
}

// One short-lived observation per path in a single recall phase. Do not retain
// this across embedding work, requests or writes, including failed reads.
#[derive(Default)]
struct SourceFingerprints(BTreeMap<String, Option<SourceFingerprint>>);

impl SourceFingerprints {
    fn freshness(
        &mut self,
        record: &AgentMemoryRecord,
        read: impl FnOnce() -> io::Result<Vec<u8>>,
    ) -> MemoryFreshness {
        let Some(expected) = &record.source_hash else {
            return MemoryFreshness::Unverified;
        };
        let provenance = &record.decision.provenance;
        let current = self.0.entry(provenance.path.clone()).or_insert_with(|| {
            read().ok().map(|bytes| SourceFingerprint {
                hash: blake3::hash(&bytes).to_hex().to_string(),
                lines: source_line_count(&bytes),
            })
        });
        if current.as_ref().is_some_and(|current| {
            &current.hash == expected && source_span_valid(provenance, current.lines)
        }) {
            MemoryFreshness::Unchanged
        } else if record.memory_kind == MemoryKind::Episodic {
            MemoryFreshness::Historical
        } else {
            MemoryFreshness::NeedsReview
        }
    }
}

impl MemoryStore {
    #[must_use]
    pub fn root(&self) -> &Path {
        &self.root
    }

    /// Bind a discovered definition only when its indexed bytes match the file.
    pub fn bind_code(
        &self,
        provenance: &MemoryProvenance,
        link: MemoryCodeLink,
        expected_source: &str,
    ) -> io::Result<(MemoryCodeLink, MemorySpan)> {
        let bytes = source_bytes(&self.root, provenance)?;
        validate_code_link(&link, &bytes)?;
        if bytes[link.body_span.start..link.body_span.end] != *expected_source.as_bytes() {
            return Err(invalid_input(
                "indexed symbol source changed; rediscover it",
            ));
        }
        let span = source_lines(&bytes, link.body_span);
        if let Some(requested) = &provenance.span
            && (requested.start_line < span.start_line || requested.end_line > span.end_line)
        {
            return Err(invalid_input("span must be inside the selected symbol"));
        }
        Ok((link, provenance.span.clone().unwrap_or(span)))
    }

    /// Return current source bytes only when the recorded fingerprint matches.
    pub fn agent_code_excerpt(&self, record: &AgentMemoryRecord) -> MemoryCodeExcerpt {
        let mut excerpt = MemoryCodeExcerpt {
            status: "not_code",
            path: record.decision.provenance.path.clone(),
            symbol: record.code_link.as_ref().map(|link| link.symbol.clone()),
            symbol_ref: None,
            definition_span: record.code_link.as_ref().map(|link| link.definition_span),
            span: record.decision.provenance.span.clone(),
            source: None,
            candidates: Vec::new(),
            candidates_truncated: false,
            truncated: false,
        };
        if record.source_kind != MemorySourceKind::Code {
            return excerpt;
        }
        excerpt.status = "needs_review";
        let Ok(bytes) = source_bytes(&self.root, &record.decision.provenance) else {
            return excerpt;
        };
        let digest = blake3::hash(&bytes).to_hex().to_string();
        if record.source_hash.as_ref() != Some(&digest) {
            return excerpt;
        }
        let line_range = record
            .decision
            .provenance
            .span
            .as_ref()
            .map(|span| source_line_range(&bytes, span));
        let range = match &record.code_link {
            Some(link) => {
                if validate_code_link(link, &bytes).is_err() {
                    return excerpt;
                }
                let mut range = link.body_span;
                if let Some(lines) = line_range {
                    range.start = range.start.max(lines.start);
                    range.end = range.end.min(lines.end);
                }
                range
            }
            None => match line_range {
                Some(range) => range,
                None => {
                    excerpt.status = "file_only";
                    return excerpt;
                }
            },
        };
        excerpt.status = "unavailable";
        let Some(selected) = bytes.get(range.start..range.end) else {
            return excerpt;
        };
        let Ok(text) = std::str::from_utf8(selected) else {
            return excerpt;
        };
        let line_end: usize = text.split_inclusive('\n').take(40).map(str::len).sum();
        let char_end = text.char_indices().nth(4000).map_or(text.len(), |(i, _)| i);
        let end = line_end.min(char_end);
        if end == 0 {
            return excerpt;
        }
        excerpt.status = "available";
        excerpt.span = Some(source_lines(
            &bytes,
            MemoryCodeRange {
                start: range.start,
                end: range.start + end,
            },
        ));
        excerpt.source = Some(text[..end].to_owned());
        excerpt.truncated = end < text.len();
        excerpt
    }

    pub fn agent_record(
        &self,
        input: &AgentMemoryInput,
        now: u64,
    ) -> io::Result<AgentMemoryPublication> {
        let mut record = self.prepare(input, now)?;
        let mut identity = record.clone();
        identity.decision.recorded_unix_nanos = 0;
        identity.updated_unix_nanos = 0;
        if input.decision.valid_until_unix_nanos.is_none() {
            identity.decision.valid_until_unix_nanos = None;
        }
        record.decision.id = fingerprint(&identity)?;
        self.publish(record)
    }

    pub(crate) fn publish_legacy(
        &self,
        record: DecisionRecord,
    ) -> io::Result<AgentMemoryPublication> {
        self.publish(legacy_record(record))
    }

    fn publish(&self, record: AgentMemoryRecord) -> io::Result<AgentMemoryPublication> {
        if self.embeddings
            && let Some(existing) = self
                .all_agent_records()?
                .into_iter()
                .find(|existing| existing.decision.id == record.decision.id)
        {
            return duplicate_publication(&record, existing);
        }
        // Model preparation and inference happen before acquiring the repository writer lock.
        let vector = self.vector(&indexed_text(&record), false)?;
        let _lock = acquire_writer_lock(&self.root)?;
        let mut memory = self.open_agent_memory(&_lock)?;
        let versions = read_versions(&mut memory)?;
        if let Some((_, existing)) = latest(&versions).remove(&record.decision.id) {
            return duplicate_publication(&record, existing);
        }
        let pending = PendingAgentWrite::Record(&record);
        self.append_agent_write(memory, &record, vector, pending, &versions)?;
        Ok(AgentMemoryPublication {
            record,
            duplicate: false,
        })
    }

    pub fn agent_update(
        &self,
        id: &str,
        expected_version: u32,
        input: &AgentMemoryInput,
        reason: &str,
        now: u64,
    ) -> io::Result<AgentMemoryPublication> {
        validate_id(id)?;
        bounded_text(reason, "reason", 1024)?;
        let mut replacement = self.prepare(input, now)?;
        if self.embeddings {
            let current = self
                .all_agent_records()?
                .into_iter()
                .find(|record| record.decision.id == id)
                .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "memory not found"))?;
            check_version(current.version, expected_version)?;
        }
        let vector = self.vector(&indexed_text(&replacement), false)?;
        let _lock = acquire_writer_lock(&self.root)?;
        let mut memory = self.open_agent_memory(&_lock)?;
        let versions = read_versions(&mut memory)?;
        let current = latest(&versions)
            .remove(id)
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "memory not found"))?
            .1;
        // Recheck under the publication lease: another process may have written
        // while inference ran. Preflight never replaces this atomic guard.
        check_version(current.version, expected_version)?;
        replacement.decision.id = id.to_owned();
        replacement.decision.recorded_unix_nanos = current.decision.recorded_unix_nanos;
        replacement.version = current
            .version
            .checked_add(1)
            .ok_or_else(|| invalid_data("memory version exhausted"))?;
        replacement.update_reason = Some(reason.trim().to_owned());
        let pending = PendingAgentWrite::Update(&replacement, expected_version);
        self.append_agent_write(memory, &replacement, vector, pending, &versions)?;
        Ok(AgentMemoryPublication {
            record: replacement,
            duplicate: false,
        })
    }

    /// Tombstone all versions, including their derived search entries.
    pub fn agent_forget(&self, id: &str, expected_version: u32) -> io::Result<usize> {
        validate_id(id)?;
        let _lock = acquire_writer_lock(&self.root)?;
        let mut memory = self.open_agent_memory(&_lock)?;
        let versions = read_versions(&mut memory)?;
        let current = latest(&versions)
            .remove(id)
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "memory not found"))?
            .1;
        if current.version != expected_version {
            return Err(io::Error::new(
                io::ErrorKind::AlreadyExists,
                "memory version changed",
            ));
        }
        let mut removed = 0;
        let pending = PendingAgentWrite::Forget(id, expected_version);
        for (frame, record) in versions {
            if record.decision.id == id {
                memory
                    .delete_frame(frame)
                    .map_err(memvid_backend_error)
                    .map_err(|error| pending.uncertain(error))?;
                removed += 1;
            }
        }
        self.commit_agent_write(memory, pending)?;
        self.remove_legacy_backup(id)
            .map_err(|error| PendingAgentWrite::Forget(id, expected_version).uncertain(error))?;
        Ok(removed)
    }

    pub fn agent_recall(&self, query: &AgentMemoryQuery) -> io::Result<AgentMemoryRecall> {
        if query.recall.limit == 0 || query.recall.min_confidence > MAX_CONFIDENCE {
            return Err(invalid_input(
                "limit must be positive and confidence must be 0..1000",
            ));
        }
        if query.include_history && query.id.is_none() {
            return Err(invalid_input("include_history requires id"));
        }
        if let Some(id) = &query.id {
            validate_id(id)?;
        }
        if let Some(text) = &query.recall.query {
            bounded_text(text, "query", MAX_FACT_CHARS)?;
        }
        if let Some(path) = &query.path {
            bounded_text(path, "path", 1024)?;
            if Path::new(path)
                .components()
                .any(|c| !matches!(c, Component::Normal(_)))
            {
                return Err(invalid_input("path must be relative without traversal"));
            }
        }
        if let Some(symbol) = &query.symbol {
            bounded_text(symbol, "symbol", 1024)?;
        }
        // Skip model initialization when this locked read has no eligible
        // current records, including expired, filtered and hidden stale ones.
        if self.embeddings && query.recall.query.is_some() && query.id.is_none() {
            let mut sources = SourceFingerprints::default();
            if !self.all_agent_records()?.iter().any(|record| {
                query.matches(record)
                    && (query.include_stale
                        || self.freshness(record, &mut sources) != MemoryFreshness::NeedsReview)
            }) {
                return Ok(AgentMemoryRecall {
                    results: Vec::new(),
                    truncated: false,
                    search_mode: "hybrid",
                    embedding_model: Some(MODEL),
                });
            }
        }
        let query_vector = match query.recall.query.as_deref() {
            Some(text) if query.id.is_none() => self.vector(text, true)?,
            _ => None,
        };
        let _lock = acquire_writer_lock(&self.root)?;
        let memory = self.open_agent_memory(&_lock)?;
        let mut memory = if query_vector.is_some() {
            self.ensure_vectors(memory, query, |text| {
                self.vector(text, false)?
                    .ok_or_else(|| invalid_data("semantic recall requires an embedding"))
            })?
        } else {
            memory
        };
        let versions = read_versions(&mut memory)?;
        let mut candidates = if query.include_history {
            // Reindexing replaces the storage frame, not the logical version.
            let mut unique = BTreeMap::new();
            for (frame, record) in &versions {
                unique.insert(
                    (record.decision.id.clone(), record.version),
                    (*frame, record.clone()),
                );
            }
            unique.into_values().collect::<Vec<_>>()
        } else {
            latest(&versions).into_values().collect::<Vec<_>>()
        };
        let latest_versions = latest(&versions);
        candidates.retain(|(_, record)| query.matches(record));
        // Only visible records may occupy a rank in either retrieval channel.
        // Keep the resolved freshness with each hit, including explicit history.
        // Recheck after embedding/backfill; their preflight observations have expired.
        let mut sources = SourceFingerprints::default();
        let mut candidates: Vec<_> = candidates
            .into_iter()
            .filter_map(|(frame, record)| {
                let historical = latest_versions
                    .get(&record.decision.id)
                    .is_some_and(|(_, current)| current.version != record.version);
                let freshness = if historical {
                    MemoryFreshness::Historical
                } else {
                    self.freshness(&record, &mut sources)
                };
                if freshness == MemoryFreshness::NeedsReview && !query.include_stale {
                    return None;
                }
                Some((
                    frame,
                    AgentMemoryHit {
                        record,
                        freshness,
                        score: 0.0,
                        code: None,
                    },
                ))
            })
            .collect();
        let eligible: BTreeSet<_> = candidates.iter().map(|(frame, _)| *frame).collect();
        let mut scores = BTreeMap::<u64, f64>::new();
        if !candidates.is_empty()
            && let Some(text) = query.recall.query.as_deref().filter(|_| query.id.is_none())
        {
            let terms = text
                .split_whitespace()
                .map(|term| format!("\"{}\"", term.replace('\\', "\\\\").replace('"', "\\\"")))
                .collect::<Vec<_>>()
                .join(" OR ");
            // Current Memvid commits Tantivy segments; search_lex only reads the
            // legacy monolithic lexical index and fails after reopening such a file.
            let request = serde_json::from_value(serde_json::json!({
                "query": terms, "top_k": memory.frame_count().max(1),
                // One snippet covers a whole fact, so repeated matches cannot
                // consume the limit before another eligible record is returned.
                "snippet_chars": MAX_FACT_CHARS * 4, "no_sketch": true,
            }))
            .map_err(memvid_error)?;
            let mut seen = BTreeSet::new();
            for (rank, hit) in memory
                .search(request)
                .map_err(memvid_backend_error)?
                .hits
                .into_iter()
                .filter(|hit| eligible.contains(&hit.frame_id))
                .filter(|hit| seen.insert(hit.frame_id))
                .enumerate()
            {
                *scores.entry(hit.frame_id).or_default() += 1.0 / (61 + rank) as f64;
            }
            if let Some(vector) = query_vector {
                for (rank, hit) in memory
                    .search_vec(&vector, memory.frame_count().max(1))
                    .map_err(memvid_backend_error)?
                    .into_iter()
                    .filter(|hit| eligible.contains(&hit.frame_id))
                    .enumerate()
                {
                    *scores.entry(hit.frame_id).or_default() += 1.0 / (61 + rank) as f64;
                }
            }
            // Exact source terms and punctuation remain searchable alongside BM25.
            let needle = text.to_lowercase();
            for (frame, hit) in &candidates {
                if hit.record.decision.fact.to_lowercase().contains(&needle) {
                    *scores.entry(*frame).or_default() += 1.0 / 61.0;
                }
            }
            candidates.retain(|(frame, _)| scores.contains_key(frame));
        }
        let mut results = Vec::new();
        for (frame, mut hit) in candidates {
            hit.score = scores.get(&frame).copied().unwrap_or(0.0);
            results.push(hit);
        }
        results.sort_by(|a, b| {
            b.score
                .total_cmp(&a.score)
                .then_with(|| {
                    b.record
                        .decision
                        .confidence
                        .cmp(&a.record.decision.confidence)
                })
                .then_with(|| a.record.decision.id.cmp(&b.record.decision.id))
                .then_with(|| b.record.version.cmp(&a.record.version))
        });
        let truncated = results.len() > query.recall.limit;
        results.truncate(query.recall.limit);
        Ok(AgentMemoryRecall {
            results,
            truncated,
            search_mode: if self.embeddings { "hybrid" } else { "lexical" },
            embedding_model: self.embeddings.then_some(MODEL),
        })
    }

    pub(crate) fn all_agent_records(&self) -> io::Result<Vec<AgentMemoryRecord>> {
        let _lock = acquire_writer_lock(&self.root)?;
        let mut memory = self.open_agent_memory(&_lock)?;
        Ok(latest(&read_versions(&mut memory)?)
            .into_values()
            .map(|(_, r)| r)
            .collect())
    }

    pub(crate) fn prune_agent_records(
        &self,
        now: u64,
        dry_run: bool,
    ) -> io::Result<crate::MemoryPruneReport> {
        let _lock = acquire_writer_lock(&self.root)?;
        let mut memory = self.open_agent_memory(&_lock)?;
        let versions = read_versions(&mut memory)?;
        let current = latest(&versions);
        let expired: BTreeSet<_> = current
            .iter()
            .filter(|(_, (_, r))| r.decision.expired(now))
            .map(|(id, _)| id.clone())
            .collect();
        let mut report = crate::MemoryPruneReport {
            removed: expired.len(),
            retained: current.len() - expired.len(),
            dry_run,
            bytes_reclaimed: 0,
        };
        let mut removed_frames = Vec::new();
        let mut retained_versions = Vec::new();
        for (frame, record) in versions {
            if expired.contains(&record.decision.id) {
                report.bytes_reclaimed +=
                    serde_json::to_vec(&record).map_err(memvid_error)?.len() as u64;
                removed_frames.push(frame);
            } else {
                retained_versions.push(record);
            }
        }
        if !dry_run && !removed_frames.is_empty() {
            drop(memory);
            self.edit_agent_copy(&retained_versions, |memory| {
                for frame in removed_frames {
                    memory.delete_frame(frame).map_err(memvid_backend_error)?;
                }
                Ok(())
            })?;
            for id in expired {
                self.remove_legacy_backup(&id)?;
            }
        }
        Ok(report)
    }

    fn remove_legacy_backup(&self, id: &str) -> io::Result<()> {
        let directory = self.root.join(".cgrx/memory/decisions");
        let backup = directory.join(format!("{id}.json.migrated"));
        match fs::remove_file(backup) {
            Ok(()) => crate::segment::sync_dir(&directory),
            Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(()),
            Err(error) => Err(error),
        }
    }

    fn prepare(&self, input: &AgentMemoryInput, now: u64) -> io::Result<AgentMemoryRecord> {
        let decision = &input.decision;
        bounded_text(&decision.fact, "fact", MAX_FACT_CHARS)?;
        if decision.confidence > MAX_CONFIDENCE {
            return Err(invalid_input("confidence must be 0..1000"));
        }
        if decision.provenance.repo != self.root.to_string_lossy() {
            return Err(invalid_input(
                "provenance repo must equal the managed repository root",
            ));
        }
        bounded_text(&decision.provenance.rev, "rev", 256)?;
        for (value, label) in [
            (input.source_ref.as_deref(), "source_ref"),
            (input.task_id.as_deref(), "task_id"),
            (input.event_id.as_deref(), "event_id"),
        ] {
            if let Some(value) = value {
                bounded_text(value, label, 1024)?;
            }
        }
        if input.source_kind == MemorySourceKind::Legacy {
            return Err(invalid_input(
                "legacy source kind is reserved for migration",
            ));
        }
        if input.memory_kind == MemoryKind::Working && input.task_id.is_none() {
            return Err(invalid_input("working memory requires task_id"));
        }
        if input.memory_kind == MemoryKind::Episodic && input.event_id.is_none() {
            return Err(invalid_input("episodic memory requires event_id"));
        }
        let source_hash = if input.source_kind == MemorySourceKind::Code {
            let bytes = source_bytes(&self.root, &decision.provenance)?;
            if let Some(link) = &input.code_link {
                validate_code_link(link, &bytes)?;
                let lines = source_lines(&bytes, link.body_span);
                if decision.provenance.span.as_ref().is_none_or(|span| {
                    span.start_line < lines.start_line || span.end_line > lines.end_line
                }) {
                    return Err(invalid_input(
                        "linked code requires a span inside the symbol",
                    ));
                }
            }
            Some(blake3::hash(&bytes).to_hex().to_string())
        } else {
            if input.source_ref.is_none() {
                return Err(invalid_input("non-code memory requires source_ref"));
            }
            if !decision.provenance.path.is_empty()
                || decision.provenance.span.is_some()
                || input.code_link.is_some()
            {
                return Err(invalid_input(
                    "path and span are only valid for code sources",
                ));
            }
            None
        };
        let valid_until = decision.valid_until_unix_nanos.or_else(|| {
            (input.memory_kind == MemoryKind::Working).then(|| now.saturating_add(WORKING_TTL))
        });
        if valid_until.is_some_and(|deadline| deadline <= now) {
            return Err(invalid_input(
                "valid_until_unix_nanos must be in the future",
            ));
        }
        let privacy_tag = decision
            .privacy_tag
            .clone()
            .unwrap_or_else(|| DEFAULT_PRIVACY_TAG.to_owned());
        bounded_text(&privacy_tag, "privacy_tag", 64)?;
        if privacy_tag.bytes().any(|b| b.is_ascii_control()) {
            return Err(invalid_input(
                "privacy_tag must contain printable characters",
            ));
        }
        Ok(AgentMemoryRecord {
            decision: DecisionRecord {
                id: String::new(),
                fact: decision.fact.trim().to_owned(),
                confidence: decision.confidence,
                provenance: decision.provenance.clone(),
                recorded_unix_nanos: now,
                valid_until_unix_nanos: valid_until,
                privacy_tag,
            },
            memory_kind: input.memory_kind,
            source_kind: input.source_kind,
            source_ref: input.source_ref.clone(),
            source_hash,
            task_id: input.task_id.clone(),
            event_id: input.event_id.clone(),
            version: 1,
            updated_unix_nanos: now,
            update_reason: None,
            code_link: input.code_link.clone(),
        })
    }

    fn freshness(
        &self,
        record: &AgentMemoryRecord,
        sources: &mut SourceFingerprints,
    ) -> MemoryFreshness {
        sources.freshness(record, || {
            // Observe the file once; each record validates its own span below.
            let mut provenance = record.decision.provenance.clone();
            provenance.span = None;
            source_bytes(&self.root, &provenance)
        })
    }

    pub(crate) fn agent_path(&self) -> PathBuf {
        self.root.join(".cgrx/memory/agent.mv2")
    }

    /// The caller keeps the writer lock. CapacityExceeded is a pre-WAL SDK
    /// rejection; it alone permits one append retry after a verified rebuild.
    fn append_agent_write(
        &self,
        mut memory: Memvid,
        record: &AgentMemoryRecord,
        vector: Option<Vec<f32>>,
        pending: PendingAgentWrite<'_>,
        versions: &[(u64, AgentMemoryRecord)],
    ) -> io::Result<()> {
        if let Err(error) = append(&mut memory, record, vector.clone()) {
            if capacity_exceeded(&error).is_none() {
                return Err(pending.uncertain(error));
            }
            // Drop can finish derived SDK work. Reopen and validate all versions
            // before rebuilding; never reuse the failed writer or replay commit.
            drop(memory);
            memory = self
                .compact_agent_memory(versions)
                .map_err(|error| pending.uncertain(error))?;
            if let Err(error) = append(&mut memory, record, vector) {
                if let Some((current, limit, required)) = capacity_exceeded(&error) {
                    return Err(io::Error::other(MemoryCapacityExceeded {
                        current,
                        limit,
                        required,
                    }));
                }
                return Err(pending.uncertain(error));
            }
        }
        self.commit_agent_write(memory, pending)
    }

    /// Reclaim fragmented index layouts within the SDK's existing capacity.
    /// Keep every visible historical version, duplicate and embedding; a fresh
    /// read-only inventory must match before the new file can become primary.
    fn compact_agent_memory(&self, expected: &[(u64, AgentMemoryRecord)]) -> io::Result<Memvid> {
        if agent_journal_pending(&self.agent_path())? {
            return Err(invalid_data(
                "cannot compact a memory with pending journal entries",
            ));
        }
        let mut source = Memvid::open_read_only(self.agent_path()).map_err(memvid_backend_error)?;
        let versions = read_versions(&mut source)?;
        if record_inventory(versions.iter().map(|(_, record)| record))?
            != record_inventory(expected.iter().map(|(_, record)| record))?
            || source
                .timeline(TimelineQuery::default())
                .map_err(memvid_backend_error)?
                .len()
                != versions.len()
        {
            return Err(invalid_data(
                "memory compaction baseline changed or contains unknown frames",
            ));
        }
        let before = storage_inventory(&mut source)?;
        let snapshot = self.new_agent_copy()?;
        {
            let mut rebuilt = Memvid::create(&snapshot.0).map_err(memvid_backend_error)?;
            if rebuilt.get_capacity() != source.get_capacity() {
                return Err(invalid_data(
                    "memory compaction cannot change the SDK capacity policy",
                ));
            }
            rebuilt.enable_lex().map_err(memvid_backend_error)?;
            for (frame_id, record) in &versions {
                let frame = source
                    .frame_by_id(*frame_id)
                    .map_err(memvid_backend_error)?;
                let vector = source
                    .frame_embedding(*frame_id)
                    .map_err(memvid_backend_error)?;
                let options = PutOptions {
                    timestamp: Some(frame.timestamp),
                    track: frame.track,
                    kind: frame.kind,
                    uri: frame.uri,
                    metadata: frame.metadata,
                    tags: frame.tags,
                    labels: frame.labels,
                    extra_metadata: frame.extra_metadata,
                    role: frame.role,
                    source_path: frame.source_path,
                    search_text: Some(indexed_text(record)),
                    auto_tag: false,
                    extract_dates: false,
                    extract_triplets: false,
                    instant_index: false,
                    dedup: false,
                    ..PutOptions::default()
                };
                append_with_options(&mut rebuilt, record, vector, options)?;
            }
            rebuilt.commit().map_err(memvid_backend_error)?;
        }
        if agent_journal_pending(&snapshot.0)? {
            return Err(invalid_data(
                "compacted memory still has pending journal entries",
            ));
        }
        let mut verified = Memvid::open_read_only(&snapshot.0).map_err(memvid_backend_error)?;
        if storage_inventory(&mut verified)? != before
            || record_inventory(
                read_versions(&mut verified)?
                    .iter()
                    .map(|(_, record)| record),
            )? != record_inventory(expected.iter().map(|(_, record)| record))?
        {
            return Err(invalid_data(
                "compacted memory does not preserve complete history and embeddings",
            ));
        }
        drop(verified);
        drop(source);
        self.publish_agent_copy(snapshot)?;
        Memvid::open(self.agent_path()).map_err(memvid_backend_error)
    }

    /// Caller retains the repository writer lock across commit and verification.
    /// Never replay a mutation: only reopen its existing WAL and check exact state.
    fn commit_agent_write(&self, memory: Memvid, pending: PendingAgentWrite<'_>) -> io::Result<()> {
        self.finish_agent_write(memory, pending, Memvid::commit)
    }

    fn finish_agent_write(
        &self,
        mut memory: Memvid,
        pending: PendingAgentWrite<'_>,
        commit: impl FnOnce(&mut Memvid) -> memvid_core::Result<()>,
    ) -> io::Result<()> {
        let Err(error) = commit(&mut memory) else {
            return Ok(());
        };
        let retryable = transient_memvid_busy(&error);
        let cause = memvid_backend_error(error);
        // A failed Tantivy commit may have consumed its writer. Reuse is unsafe.
        drop(memory);
        if retryable {
            match self.recover_agent_journal(Some(&pending), |path| Memvid::open(path)) {
                Ok(true) => return Ok(()),
                Ok(false) => {}
                Err(error) => return Err(pending.uncertain(error)),
            }
        }
        Err(pending.uncertain(cause))
    }

    /// Memvid's open-time WAL recovery writes in place before rebuilding indexes.
    /// Retry only disposable copies, preserving the original even if recovery fails.
    fn recover_agent_journal(
        &self,
        pending: Option<&PendingAgentWrite<'_>>,
        mut open: impl FnMut(&Path) -> memvid_core::Result<Memvid>,
    ) -> io::Result<bool> {
        for attempt in 0..3 {
            let snapshot = self.copy_agent_memory()?;
            let outcome = (|| {
                let mut memory = open(&snapshot.0).map_err(memvid_backend_error)?;
                let versions = read_versions(&mut memory)?;
                let inventory = storage_inventory(&mut memory)?;
                // Drop may finalize SDK writes and ignores its own commit error.
                // A cached TOC is not evidence that the closed file is durable.
                drop(memory);
                if agent_journal_pending(&snapshot.0)? {
                    return Err(invalid_data(
                        "recovered memory still has pending journal entries",
                    ));
                }
                let mut verified =
                    Memvid::open_read_only(&snapshot.0).map_err(memvid_backend_error)?;
                let actual = read_versions(&mut verified)?;
                if record_inventory(actual.iter().map(|(_, record)| record))?
                    != record_inventory(versions.iter().map(|(_, record)| record))?
                    || storage_inventory(&mut verified)? != inventory
                {
                    return Err(invalid_data(
                        "recovered memory changed history, metadata or embeddings on close",
                    ));
                }
                Ok(actual)
            })();
            match outcome {
                Ok(versions) => {
                    if pending.is_some_and(|pending| !pending.confirmed(&versions)) {
                        return Ok(false);
                    }
                    self.publish_agent_copy(snapshot)?;
                    return Ok(true);
                }
                Err(error) => {
                    if error.kind() != io::ErrorKind::WouldBlock || attempt == 2 {
                        return Err(error);
                    }
                    std::thread::sleep(std::time::Duration::from_millis(10 * (attempt + 1)));
                }
            }
        }
        unreachable!("bounded recovery loop returns on its final attempt")
    }

    fn copy_agent_memory(&self) -> io::Result<RecoveryFile> {
        let source = fs::File::open(self.agent_path())?;
        let snapshot = self.new_agent_copy()?;
        let mut file = fs::OpenOptions::new().write(true).open(&snapshot.0)?;
        std::io::copy(&mut &source, &mut file)?;
        file.sync_all()?;
        Ok(snapshot)
    }

    fn new_agent_copy(&self) -> io::Result<RecoveryFile> {
        let permissions = match fs::metadata(self.agent_path()) {
            Ok(metadata) => Some(metadata.permissions()),
            Err(error) if error.kind() == io::ErrorKind::NotFound => None,
            Err(error) => return Err(error),
        };
        for _ in 0..16 {
            let path = self.root.join(".cgrx/memory").join(format!(
                ".agent-recovery-{}-{}.mv2",
                std::process::id(),
                RECOVERY_FILE_SEQUENCE.fetch_add(1, Ordering::Relaxed)
            ));
            let mut options = fs::OpenOptions::new();
            options.write(true).create_new(true);
            #[cfg(unix)]
            {
                use std::os::unix::fs::OpenOptionsExt;
                options.mode(0o600);
            }
            match options.open(&path) {
                Ok(file) => {
                    let snapshot = RecoveryFile(path);
                    if let Some(permissions) = &permissions {
                        file.set_permissions(permissions.clone())?;
                    }
                    file.sync_all()?;
                    return Ok(snapshot);
                }
                Err(error) if error.kind() == io::ErrorKind::AlreadyExists => continue,
                Err(error) => return Err(error),
            }
        }
        Err(io::Error::other("cannot create memory recovery copy"))
    }

    fn publish_agent_copy(&self, snapshot: RecoveryFile) -> io::Result<()> {
        fs::File::open(&snapshot.0)?.sync_all()?;
        fs::rename(&snapshot.0, self.agent_path())?;
        crate::segment::sync_dir(&self.root.join(".cgrx/memory"))
    }

    /// A failed SDK create can leave a header/WAL without a committed TOC.
    /// Never expose that partial initialization at the primary path.
    fn create_agent_memory(
        &self,
        create: impl FnOnce(&Path) -> memvid_core::Result<Memvid>,
    ) -> io::Result<Memvid> {
        let snapshot = self.new_agent_copy()?;
        {
            let mut memory = create(&snapshot.0).map_err(memvid_backend_error)?;
            memory.enable_lex().map_err(memvid_backend_error)?;
            memory.commit().map_err(memvid_backend_error)?;
        }
        if agent_journal_pending(&snapshot.0)? {
            return Err(invalid_data("new memory still has pending journal entries"));
        }
        {
            let mut verified = Memvid::open_read_only(&snapshot.0).map_err(memvid_backend_error)?;
            if !storage_inventory(&mut verified)?.is_empty() {
                return Err(invalid_data("new memory must have an empty inventory"));
            }
        }
        self.publish_agent_copy(snapshot)?;
        Memvid::open(self.agent_path()).map_err(memvid_backend_error)
    }

    /// Derived writes cannot change assertions or discard unmentioned history.
    /// The caller holds the repository writer lock and has dropped the old handle.
    fn edit_agent_copy(
        &self,
        expected: &[AgentMemoryRecord],
        edit: impl FnOnce(&mut Memvid) -> io::Result<()>,
    ) -> io::Result<Memvid> {
        let snapshot = self.copy_agent_memory()?;
        {
            let mut memory = Memvid::open(&snapshot.0).map_err(memvid_backend_error)?;
            memory.enable_lex().map_err(memvid_backend_error)?;
            edit(&mut memory)?;
            memory.commit().map_err(memvid_backend_error)?;
        }
        // A successful close is insufficient: Drop ignores its own commit error.
        // Verify the committed copy through a read-only handle before publishing.
        if agent_journal_pending(&snapshot.0)? {
            return Err(invalid_data(
                "memory copy still has pending journal entries",
            ));
        }
        let actual =
            read_versions(&mut Memvid::open_read_only(&snapshot.0).map_err(memvid_backend_error)?)?;
        if record_inventory(actual.iter().map(|(_, record)| record))?
            != record_inventory(expected.iter())?
        {
            return Err(invalid_data("memory copy does not match intended versions"));
        }
        self.publish_agent_copy(snapshot)?;
        Memvid::open(self.agent_path()).map_err(memvid_backend_error)
    }

    /// Called with the repository writer lock. Committed migration is retry-safe.
    fn open_agent_memory(&self, lock: &WriterLock) -> io::Result<Memvid> {
        let directory = self.root.join(".cgrx/memory");
        if directory.canonicalize()? != directory {
            // A directory alias can point at a different worktree whose active
            // copies are protected by another WRITER.lock. Never clean that store.
            return Err(invalid_data("memory directory aliases are not supported"));
        }
        let path = self.agent_path();
        let abandoned = self.abandoned_agent_copies(lock)?;
        if !path.exists() && !abandoned.is_empty() {
            // Do not replace a missing primary with an empty store, or promote
            // an unconfirmed copy just because it is the only remaining file.
            return Err(invalid_data(
                "primary memory is missing; abandoned copies require review",
            ));
        }
        let mut memory = if path.exists() {
            // Decode through upstream public IO APIs, without changing the header
            // or WAL. Clean opens do not copy the store or load a second index.
            if agent_journal_pending(&path)? {
                self.recover_agent_journal(None, |path| Memvid::open(path))?;
            }
            Memvid::open(&path).map_err(memvid_backend_error)?
        } else {
            self.create_agent_memory(|path| Memvid::create(path))?
        };
        if !abandoned.is_empty() {
            // Abrupt termination skips RecoveryFile::drop. A successful primary
            // open and complete envelope validation establish which file to keep.
            // The root writer lock excludes live copies from other CGRX processes.
            read_versions(&mut memory)?;
            let mut removed = false;
            for path in abandoned {
                match fs::remove_file(path) {
                    Ok(()) => removed = true,
                    Err(error) if error.kind() == io::ErrorKind::NotFound => {}
                    Err(error) => return Err(error),
                }
            }
            if removed {
                crate::segment::sync_dir(&self.root.join(".cgrx/memory"))?;
            }
        }
        memory.enable_lex().map_err(memvid_backend_error)?;
        let legacy = self.legacy_records()?;
        if !legacy.is_empty() {
            let versions = read_versions(&mut memory)?;
            let existing = latest(&versions);
            let missing: Vec<_> = legacy
                .iter()
                .filter(|(_, record)| !existing.contains_key(&record.id))
                .map(|(_, record)| legacy_record(record.clone()))
                .collect();
            if !missing.is_empty() {
                let mut expected: Vec<_> = versions.into_iter().map(|(_, record)| record).collect();
                expected.extend(missing.iter().cloned());
                drop(memory);
                memory = self.edit_agent_copy(&expected, |memory| {
                    for record in &missing {
                        append(memory, record, None)?;
                    }
                    Ok(())
                })?;
            }
            for (path, _) in legacy {
                fs::rename(&path, path.with_extension("json.migrated"))?;
            }
            fs::File::open(self.root.join(".cgrx/memory/decisions"))?.sync_all()?;
        }
        Ok(memory)
    }

    /// Called at the start of a locked open, before creating any live copy.
    fn abandoned_agent_copies(&self, _lock: &WriterLock) -> io::Result<Vec<PathBuf>> {
        let mut copies = Vec::new();
        for entry in fs::read_dir(self.root.join(".cgrx/memory"))? {
            let entry = entry?;
            // Never follow symlinks or remove directories or similarly named backups.
            if is_agent_recovery_name(&entry.file_name()) && entry.file_type()?.is_file() {
                copies.push(entry.path());
            }
        }
        Ok(copies)
    }

    fn ensure_vectors(
        &self,
        mut memory: Memvid,
        query: &AgentMemoryQuery,
        mut embed: impl FnMut(&str) -> io::Result<Vec<f32>>,
    ) -> io::Result<Memvid> {
        let versions = read_versions(&mut memory)?;
        let mut missing = Vec::new();
        let mut sources = SourceFingerprints::default();
        for (frame, record) in latest(&versions).into_values() {
            if query.matches(&record)
                && (query.include_stale
                    || self.freshness(&record, &mut sources) != MemoryFreshness::NeedsReview)
                && memory
                    .frame_embedding(frame)
                    .map_err(memvid_backend_error)?
                    .is_none()
            {
                missing.push((frame, record));
            }
        }
        if missing.is_empty() {
            return Ok(memory);
        }
        let expected: Vec<_> = versions.into_iter().map(|(_, record)| record).collect();
        drop(memory);
        self.edit_agent_copy(&expected, |memory| {
            for (frame, record) in missing {
                append(memory, &record, Some(embed(&indexed_text(&record))?))?;
                memory.delete_frame(frame).map_err(memvid_backend_error)?;
            }
            Ok(())
        })
    }

    fn vector(&self, text: &str, query: bool) -> io::Result<Option<Vec<f32>>> {
        if !self.embeddings {
            return Ok(None);
        }
        let prefix = if query { "query" } else { "passage" };
        let text = format!("{prefix}: {text}");
        crate::embedding_worker::embed(&text)
            .unwrap_or_else(|| embed_local(&text))
            .map(Some)
    }
}

pub(super) fn embed_local(text: &str) -> io::Result<Vec<f32>> {
    let mut guard = EMBEDDER
        .get_or_init(|| Mutex::new(None))
        .lock()
        .map_err(|_| io::Error::other("embedding model lock poisoned"))?;
    if guard.is_none() {
        let options = InitOptions::new(EmbeddingModel::MultilingualE5Small)
            .with_cache_dir(model_cache())
            .with_show_download_progress(false);
        *guard = Some(TextEmbedding::try_new(options).map_err(memvid_error)?);
    }
    let mut vectors = guard
        .as_mut()
        .expect("initialized model")
        .embed(vec![text.to_owned()], Some(1))
        .map_err(memvid_error)?;
    let vector = vectors
        .pop()
        .ok_or_else(|| invalid_data("embedding model returned no vector"))?;
    if vector.len() != 384 || vector.iter().any(|v| !v.is_finite()) {
        return Err(invalid_data("invalid multilingual embedding"));
    }
    Ok(vector)
}

fn duplicate_publication(
    record: &AgentMemoryRecord,
    existing: AgentMemoryRecord,
) -> io::Result<AgentMemoryPublication> {
    let mut replay = record.clone();
    replay.decision.recorded_unix_nanos = existing.decision.recorded_unix_nanos;
    replay.updated_unix_nanos = existing.updated_unix_nanos;
    if record.memory_kind == MemoryKind::Working {
        replay.decision.valid_until_unix_nanos = existing.decision.valid_until_unix_nanos;
    }
    if replay == existing {
        return Ok(AgentMemoryPublication {
            record: existing,
            duplicate: true,
        });
    }
    Err(io::Error::new(
        io::ErrorKind::AlreadyExists,
        "memory ID already has different content; use memory_update",
    ))
}

fn check_version(current: u32, expected: u32) -> io::Result<()> {
    if current != expected {
        return Err(io::Error::new(
            io::ErrorKind::AlreadyExists,
            "memory version changed; recall it before retrying",
        ));
    }
    Ok(())
}

fn agent_journal_pending(path: &Path) -> io::Result<bool> {
    let mut file = fs::File::open(path)?;
    let mut bytes = [0; memvid_core::constants::HEADER_SIZE];
    file.read_exact(&mut bytes)?;
    let header = HeaderCodec::decode(&bytes).map_err(memvid_backend_error)?;
    let wal = EmbeddedWal::open_read_only(&file, &header).map_err(memvid_backend_error)?;
    Ok(wal.stats().pending_bytes != 0)
}

fn is_agent_recovery_name(name: &std::ffi::OsStr) -> bool {
    let Some(name) = name
        .to_str()
        .and_then(|name| name.strip_prefix(".agent-recovery-"))
        .and_then(|name| name.strip_suffix(".mv2"))
    else {
        return false;
    };
    let Some((pid, sequence)) = name.split_once('-') else {
        return false;
    };
    let (Ok(parsed_pid), Ok(parsed_sequence)) = (pid.parse::<u32>(), sequence.parse::<u64>())
    else {
        return false;
    };
    parsed_pid > 0 && parsed_pid.to_string() == pid && parsed_sequence.to_string() == sequence
}

fn model_cache() -> PathBuf {
    if let Some(path) = std::env::var_os("CGRX_MEMORY_MODEL_CACHE") {
        return PathBuf::from(path);
    }
    let base = std::env::var_os("XDG_CACHE_HOME")
        .map(PathBuf::from)
        .or_else(|| std::env::var_os("HOME").map(|p| PathBuf::from(p).join(".cache")))
        .unwrap_or_else(std::env::temp_dir);
    base.join("cgrx/models")
}

fn append(
    memory: &mut Memvid,
    record: &AgentMemoryRecord,
    vector: Option<Vec<f32>>,
) -> io::Result<()> {
    let options = PutOptions::builder()
        .uri(format!(
            "cgrx-memory://{}/{}",
            record.decision.id, record.version
        ))
        .search_text(indexed_text(record))
        .metadata(DocMetadata {
            mime: Some("application/json".to_owned()),
            ..DocMetadata::default()
        })
        .tag("cgrx.memory", "v2")
        .auto_tag(false)
        .extract_dates(false)
        .extract_triplets(false)
        .build();
    append_with_options(memory, record, vector, options)
}

fn append_with_options(
    memory: &mut Memvid,
    record: &AgentMemoryRecord,
    vector: Option<Vec<f32>>,
    mut options: PutOptions,
) -> io::Result<()> {
    let envelope = Envelope {
        schema_version: AGENT_SCHEMA,
        content_hash: fingerprint(record)?,
        record: record.clone(),
    };
    let mut bytes = PAYLOAD_MAGIC.to_vec();
    bytes.extend(serde_json::to_vec(&envelope).map_err(memvid_error)?);
    // Every caller commits the complete mutation. Avoid a second soft commit
    // per record, especially when importing a batch of legacy decisions.
    options.instant_index = false;
    // Do not ask Memvid to infer facts from our serialized envelope.
    if vector.is_some() {
        options
            .extra_metadata
            .insert("memvid.embedding.model".to_owned(), MODEL.to_owned());
        options.extra_metadata.insert(
            "memvid.embedding.provider".to_owned(),
            "fastembed".to_owned(),
        );
        options
            .extra_metadata
            .insert("memvid.embedding.dimension".to_owned(), "384".to_owned());
        options
            .extra_metadata
            .insert("memvid.embedding.normalized".to_owned(), "true".to_owned());
    }
    match vector {
        Some(vector) => {
            // Enabling vectors marks the handle dirty, even when already enabled.
            // Do it only for a vector mutation, never while opening a clean read.
            memory.enable_vec().map_err(memvid_backend_error)?;
            memory.put_with_embedding_and_options(&bytes, vector, options)
        }
        None => memory.put_bytes_with_options(&bytes, options),
    }
    .map_err(memvid_backend_error)?;
    Ok(())
}

fn indexed_text(record: &AgentMemoryRecord) -> String {
    match &record.code_link {
        Some(link) => format!(
            "{}\nCode symbol: {}\nSource: {}",
            record.decision.fact, link.symbol, record.decision.provenance.path
        ),
        None => record.decision.fact.clone(),
    }
}

fn read_versions(memory: &mut Memvid) -> io::Result<Vec<(u64, AgentMemoryRecord)>> {
    let mut records = Vec::new();
    for entry in memory
        .timeline(TimelineQuery::default())
        .map_err(memvid_backend_error)?
    {
        let frame = memory
            .frame_by_id(entry.frame_id)
            .map_err(memvid_backend_error)?;
        if frame.extra_metadata.get("cgrx.memory").map(String::as_str) != Some("v2") {
            continue;
        }
        let payload = memory
            .frame_canonical_payload(entry.frame_id)
            .map_err(memvid_backend_error)?;
        let envelope: Envelope =
            serde_json::from_slice(payload.strip_prefix(PAYLOAD_MAGIC).unwrap_or(&payload))
                .map_err(memvid_error)?;
        if envelope.schema_version != AGENT_SCHEMA
            || fingerprint(&envelope.record)? != envelope.content_hash
        {
            return Err(invalid_data("invalid agent memory envelope"));
        }
        records.push((entry.frame_id, envelope.record));
    }
    records.sort_by_key(|(frame, _)| *frame);
    Ok(records)
}

fn record_inventory<'a>(
    records: impl Iterator<Item = &'a AgentMemoryRecord>,
) -> io::Result<BTreeMap<String, usize>> {
    let mut inventory = BTreeMap::new();
    for record in records {
        *inventory.entry(fingerprint(record)?).or_default() += 1;
    }
    Ok(inventory)
}

fn storage_inventory(memory: &mut Memvid) -> io::Result<BTreeMap<String, usize>> {
    let mut inventory = BTreeMap::new();
    for entry in memory
        .timeline(TimelineQuery::default())
        .map_err(memvid_backend_error)?
    {
        let mut frame = serde_json::to_value(
            memory
                .frame_by_id(entry.frame_id)
                .map_err(memvid_backend_error)?,
        )
        .map_err(memvid_error)?;
        let fields = frame
            .as_object_mut()
            .ok_or_else(|| invalid_data("invalid memory frame metadata"))?;
        fields.remove("id");
        fields.remove("payload_offset");
        let payload = memory
            .frame_canonical_payload(entry.frame_id)
            .map_err(memvid_backend_error)?;
        let vector = memory
            .frame_embedding(entry.frame_id)
            .map_err(memvid_backend_error)?
            .map(|values| values.into_iter().map(f32::to_bits).collect::<Vec<_>>());
        let key = fingerprint(
            &serde_json::json!({"frame":frame,"payload":blake3::hash(&payload).to_hex().to_string(),"vector":vector}),
        )?;
        *inventory.entry(key).or_default() += 1;
    }
    Ok(inventory)
}

fn capacity_exceeded(error: &io::Error) -> Option<(u64, u64, u64)> {
    match error.get_ref()?.downcast_ref::<MemvidError>()? {
        MemvidError::CapacityExceeded {
            current,
            limit,
            required,
        } => Some((*current, *limit, *required)),
        _ => None,
    }
}

fn latest(versions: &[(u64, AgentMemoryRecord)]) -> BTreeMap<String, (u64, AgentMemoryRecord)> {
    let mut result = BTreeMap::new();
    for (frame, record) in versions {
        let entry = result
            .entry(record.decision.id.clone())
            .or_insert((*frame, record.clone()));
        if (record.version, *frame) > (entry.1.version, entry.0) {
            *entry = (*frame, record.clone());
        }
    }
    result
}

fn legacy_record(decision: DecisionRecord) -> AgentMemoryRecord {
    AgentMemoryRecord {
        updated_unix_nanos: decision.recorded_unix_nanos,
        decision,
        memory_kind: MemoryKind::Semantic,
        source_kind: MemorySourceKind::Legacy,
        source_ref: Some("legacy decision record".to_owned()),
        source_hash: None,
        task_id: None,
        event_id: None,
        version: 1,
        update_reason: None,
        code_link: None,
    }
}

fn source_bytes(root: &Path, provenance: &MemoryProvenance) -> io::Result<Vec<u8>> {
    let path = Path::new(&provenance.path);
    if path.as_os_str().is_empty()
        || path
            .components()
            .any(|c| !matches!(c, Component::Normal(_)))
        || provenance.path.len() > 1024
    {
        return Err(invalid_input(
            "path must be a relative source file without traversal",
        ));
    }
    let resolved = root
        .join(path)
        .canonicalize()
        .map_err(|_| invalid_input("source file does not exist"))?;
    if !resolved.starts_with(root) || !resolved.is_file() {
        return Err(invalid_input(
            "source must be a file inside the managed repository",
        ));
    }
    if fs::metadata(&resolved)?.len() > 16 * 1024 * 1024 {
        return Err(invalid_input("source file exceeds 16 MiB"));
    }
    let mut bytes = Vec::new();
    fs::File::open(resolved)?
        .take(16 * 1024 * 1024 + 1)
        .read_to_end(&mut bytes)?;
    if bytes.len() > 16 * 1024 * 1024 {
        return Err(invalid_input("source file exceeds 16 MiB"));
    }
    if provenance.span.is_some() && !source_span_valid(provenance, source_line_count(&bytes)) {
        return Err(invalid_input(
            "span must address existing 1-based source lines",
        ));
    }
    Ok(bytes)
}

fn source_line_count(bytes: &[u8]) -> usize {
    bytes.iter().filter(|b| **b == b'\n').count()
        + usize::from(!bytes.is_empty() && !bytes.ends_with(b"\n"))
}

fn source_span_valid(provenance: &MemoryProvenance, lines: usize) -> bool {
    provenance.span.as_ref().is_none_or(|span| {
        span.start_line > 0 && span.end_line >= span.start_line && span.end_line as usize <= lines
    })
}

fn validate_code_link(link: &MemoryCodeLink, bytes: &[u8]) -> io::Result<()> {
    bounded_text(&link.symbol, "symbol", 1024)?;
    let body = link.body_span;
    let definition = link.definition_span;
    let text =
        std::str::from_utf8(bytes).map_err(|_| invalid_input("linked source must be UTF-8"))?;
    if body.start >= body.end
        || body.end > bytes.len()
        || definition.start < body.start
        || definition.start >= definition.end
        || definition.end > body.end
        || text.get(body.start..body.end).is_none()
        || text.get(definition.start..definition.end).is_none()
        || link.source_hash != blake3::hash(bytes).to_hex().as_str()
    {
        return Err(invalid_input(
            "symbol range or fingerprint changed; rediscover it",
        ));
    }
    Ok(())
}

fn source_lines(bytes: &[u8], range: MemoryCodeRange) -> MemorySpan {
    MemorySpan {
        start_line: 1 + bytes[..range.start].iter().filter(|b| **b == b'\n').count() as u32,
        end_line: 1 + bytes[..range.end.saturating_sub(1)]
            .iter()
            .filter(|b| **b == b'\n')
            .count() as u32,
    }
}

fn source_line_range(bytes: &[u8], span: &MemorySpan) -> MemoryCodeRange {
    let mut start = 0;
    let mut end = bytes.len();
    let mut line = 1;
    for (i, byte) in bytes.iter().enumerate() {
        if *byte == b'\n' {
            if line == span.end_line {
                end = i + 1;
                break;
            }
            line += 1;
            if line == span.start_line {
                start = i + 1;
            }
        }
    }
    MemoryCodeRange { start, end }
}

fn validate_id(id: &str) -> io::Result<()> {
    if id.len() != 32
        || !id
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
    {
        return Err(invalid_input("id must be 32 lowercase hex characters"));
    }
    Ok(())
}

fn bounded_text(text: &str, label: &str, max: usize) -> io::Result<()> {
    if text.trim().is_empty() || text.chars().count() > max || text.contains('\0') {
        return Err(invalid_input(format!(
            "{label} must be 1..{max} characters without NUL"
        )));
    }
    Ok(())
}

fn memvid_error(error: impl std::fmt::Display) -> io::Error {
    io::Error::other(error.to_string())
}

fn transient_memvid_busy(error: &MemvidError) -> bool {
    match error {
        MemvidError::Tantivy { reason } => {
            reason.starts_with("Failed to acquire Lockfile: LockBusy")
        }
        MemvidError::Locked(_) => true,
        MemvidError::Io { source, .. } => source.kind() == io::ErrorKind::WouldBlock,
        _ => false,
    }
}

fn memvid_backend_error(error: MemvidError) -> io::Error {
    let kind = if transient_memvid_busy(&error) {
        io::ErrorKind::WouldBlock
    } else {
        io::ErrorKind::Other
    };
    io::Error::new(kind, error)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{MEMORY_SCHEMA_VERSION, MemorySpan};
    use std::sync::atomic::{AtomicU64, Ordering};

    static NEXT: AtomicU64 = AtomicU64::new(0);
    const NOW: u64 = 1_800_000_000_000_000_000;

    struct Fixture {
        store: MemoryStore,
        root: PathBuf,
    }

    impl Fixture {
        fn new() -> Self {
            let root = std::env::temp_dir().join(format!(
                "cgrx-agent-memory-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            fs::create_dir_all(root.join("src")).unwrap();
            fs::write(root.join("src/lib.rs"), "pub fn parse() {}\n").unwrap();
            let store = MemoryStore::open_lexical(&root).unwrap();
            Self {
                root: store.root().to_owned(),
                store,
            }
        }

        fn input(&self, fact: &str) -> AgentMemoryInput {
            AgentMemoryInput {
                decision: MemoryRecordInput {
                    fact: fact.to_owned(),
                    confidence: 800,
                    provenance: MemoryProvenance {
                        repo: self.root.to_string_lossy().into_owned(),
                        rev: "revision-a".to_owned(),
                        path: "src/lib.rs".to_owned(),
                        span: Some(MemorySpan {
                            start_line: 1,
                            end_line: 1,
                        }),
                    },
                    valid_until_unix_nanos: None,
                    privacy_tag: None,
                },
                memory_kind: MemoryKind::Semantic,
                source_kind: MemorySourceKind::Code,
                source_ref: None,
                task_id: None,
                event_id: None,
                code_link: None,
            }
        }

        fn query(&self, text: Option<&str>) -> AgentMemoryQuery {
            AgentMemoryQuery {
                recall: MemoryRecallQuery {
                    query: text.map(str::to_owned),
                    min_confidence: 0,
                    privacy_tag: None,
                    revision: None,
                    limit: 50,
                    now_unix_nanos: NOW,
                },
                memory_kind: None,
                task_id: None,
                path: None,
                symbol: None,
                include_stale: false,
                id: None,
                include_history: false,
            }
        }

        fn linked_input(&self, source: &str) -> AgentMemoryInput {
            fs::write(self.root.join("src/lib.rs"), source).unwrap();
            let mut input = self.input("Discard obsolete state after modifications");
            input.decision.provenance.span = None;
            let start = source.find("pub fn parse").unwrap();
            let definition = start + "pub fn ".len();
            let (link, span) = self
                .store
                .bind_code(
                    &input.decision.provenance,
                    MemoryCodeLink {
                        symbol: "parse".to_owned(),
                        definition_span: MemoryCodeRange {
                            start: definition,
                            end: definition + 5,
                        },
                        body_span: MemoryCodeRange {
                            start,
                            end: source.len(),
                        },
                        source_hash: blake3::hash(source.as_bytes()).to_hex().to_string(),
                    },
                    &source[start..],
                )
                .unwrap();
            input.code_link = Some(link);
            input.decision.provenance.span = Some(span);
            input
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.root);
        }
    }

    #[test]
    fn terminated_backfill_cleans_abandoned_copies_on_next_locked_open() {
        const TEST: &str =
            "agent_memory::tests::terminated_backfill_cleans_abandoned_copies_on_next_locked_open";
        fn vector() -> Vec<f32> {
            let mut vector = vec![0.0; 384];
            vector[0] = 1.0;
            vector
        }
        fn ready_and_wait(root: &Path) -> ! {
            fs::write(root.join(".cgrx/crash-ready"), b"ready").unwrap();
            loop {
                std::thread::sleep(std::time::Duration::from_secs(1));
            }
        }
        if let Some(root) = std::env::var_os("CGRX_MEMORY_CRASH_TEST_ROOT") {
            let store = MemoryStore::open_lexical(root).unwrap();
            let _lock = acquire_writer_lock(&store.root).unwrap();
            let mut memory = store.open_agent_memory(&_lock).unwrap();
            let expected: Vec<_> = read_versions(&mut memory)
                .unwrap()
                .into_iter()
                .map(|(_, record)| record)
                .collect();
            let query = AgentMemoryQuery {
                recall: MemoryRecallQuery {
                    query: Some("assertion".to_owned()),
                    min_confidence: 0,
                    privacy_tag: None,
                    revision: None,
                    limit: 50,
                    now_unix_nanos: NOW + 2,
                },
                memory_kind: None,
                task_id: None,
                path: None,
                symbol: None,
                include_stale: true,
                id: None,
                include_history: false,
            };
            match std::env::var("CGRX_MEMORY_CRASH_TEST_STAGE")
                .unwrap()
                .as_str()
            {
                "partial" => {
                    let mut calls = 0;
                    store
                        .ensure_vectors(memory, &query, |_| {
                            calls += 1;
                            if calls == 2 {
                                // The first replacement and tombstone are already in the copy's WAL.
                                ready_and_wait(&store.root);
                            }
                            Ok(vector())
                        })
                        .unwrap();
                    panic!("two current records must reach the second inference");
                }
                "committed" => {
                    drop(memory);
                    store
                        .edit_agent_copy(&expected, |memory| {
                            for (frame, record) in latest(&read_versions(memory)?).into_values() {
                                append(memory, &record, Some(vector()))?;
                                memory.delete_frame(frame).map_err(memvid_backend_error)?;
                            }
                            memory.commit().map_err(memvid_backend_error)?;
                            // The copy is committed, but the adapter has not published it.
                            ready_and_wait(&store.root);
                        })
                        .unwrap();
                }
                "published" => {
                    drop(
                        store
                            .ensure_vectors(memory, &query, |_| Ok(vector()))
                            .unwrap(),
                    );
                    ready_and_wait(&store.root);
                }
                _ => panic!("unknown crash stage"),
            }
            return;
        }

        struct Child(std::process::Child);
        impl Drop for Child {
            fn drop(&mut self) {
                let _ = self.0.kill();
                let _ = self.0.wait();
            }
        }
        for stage in ["partial", "committed", "published"] {
            let f = Fixture::new();
            let first = f
                .store
                .agent_record(&f.input("Original assertion"), NOW)
                .unwrap()
                .record;
            let current = f
                .store
                .agent_update(
                    &first.decision.id,
                    1,
                    &f.input("Corrected assertion"),
                    "Verified",
                    NOW + 1,
                )
                .unwrap()
                .record;
            let other = f
                .store
                .agent_record(&f.input("Separate assertion"), NOW)
                .unwrap()
                .record;
            let before = fs::read(f.store.agent_path()).unwrap();
            let mut child = Child(
                std::process::Command::new(std::env::current_exe().unwrap())
                    .args(["--exact", TEST])
                    .env("CGRX_MEMORY_CRASH_TEST_ROOT", &f.root)
                    .env("CGRX_MEMORY_CRASH_TEST_STAGE", stage)
                    .stdout(std::process::Stdio::null())
                    .spawn()
                    .unwrap(),
            );
            let deadline = std::time::Instant::now() + std::time::Duration::from_secs(20);
            while !f.root.join(".cgrx/crash-ready").is_file() {
                assert!(
                    child.0.try_wait().unwrap().is_none(),
                    "child exited before {stage}"
                );
                assert!(
                    std::time::Instant::now() < deadline,
                    "child did not reach {stage}"
                );
                std::thread::sleep(std::time::Duration::from_millis(10));
            }
            let copies: Vec<_> = fs::read_dir(f.root.join(".cgrx/memory"))
                .unwrap()
                .map(|entry| entry.unwrap().path())
                .filter(|path| {
                    path.file_name()
                        .unwrap()
                        .to_string_lossy()
                        .starts_with(".agent-recovery-")
                })
                .collect();
            assert_eq!(copies.len(), usize::from(stage != "published"));
            assert_eq!(
                f.store.status(NOW).unwrap_err().kind(),
                io::ErrorKind::WouldBlock
            );
            assert!(
                copies.iter().all(|path| path.is_file()),
                "busy reader must not clean an active copy"
            );
            child.0.kill().unwrap();
            assert!(!child.0.wait().unwrap().success());
            let published = fs::read(f.store.agent_path()).unwrap();
            if stage != "published" {
                assert!(
                    published == before,
                    "unpublished edits must preserve the primary bytes"
                );
            } else {
                assert!(
                    published != before,
                    "published vectors must survive termination"
                );
            }
            assert_eq!(f.store.status(NOW).unwrap().decisions, 2);
            assert!(
                fs::read(f.store.agent_path()).unwrap() == published,
                "restart must not rewrite the primary"
            );
            assert!(
                copies.iter().all(|path| !path.exists()),
                "abandoned snapshots must disappear after a successful locked open"
            );
            let mut history = f.query(None);
            history.id = Some(first.decision.id.clone());
            history.include_history = true;
            let records = f.store.agent_recall(&history).unwrap().results;
            assert_eq!(records.len(), 2);
            assert_eq!(records[0].record, current);
            assert_eq!(records[1].record, first);
            history.id = Some(other.decision.id.clone());
            assert_eq!(
                f.store.agent_recall(&history).unwrap().results[0].record,
                other
            );
            f.store.agent_forget(&first.decision.id, 2).unwrap();
            assert!(
                f.store
                    .agent_recall(&f.query(Some("Corrected")))
                    .unwrap()
                    .results
                    .is_empty()
            );
        }
    }

    #[test]
    fn abandoned_copy_cleanup_preserves_unrelated_files_directories_and_symlinks() {
        let f = Fixture::new();
        let original = f
            .store
            .agent_record(&f.input("Confirmed original"), NOW)
            .unwrap()
            .record;
        let before = fs::read(f.store.agent_path()).unwrap();
        let directory = f.root.join(".cgrx/memory");
        let abandoned = directory.join(".agent-recovery-123-0.mv2");
        fs::write(&abandoned, b"an unconfirmed and corrupt disposable copy").unwrap();
        let preserved = [
            "agent.mv2.backup",
            ".agent-recovery-user-backup.mv2",
            ".agent-recovery-123-1.mv2.backup",
            ".agent-recovery-123.mv2",
            ".agent-recovery-0-1.mv2",
            ".agent-recovery-0123-1.mv2",
            ".agent-recovery-123-01.mv2",
            ".agent-recovery-4294967296-1.mv2",
            ".agent-recovery-123-18446744073709551616.mv2",
        ];
        for name in preserved {
            fs::write(directory.join(name), b"preserve this file").unwrap();
        }
        let folder = directory.join(".agent-recovery-123-2.mv2");
        fs::create_dir(&folder).unwrap();
        fs::write(folder.join("owned-by-user"), b"preserve this directory").unwrap();
        #[cfg(unix)]
        {
            let outside = f.root.join("outside-memory");
            fs::write(&outside, b"preserve the symlink target").unwrap();
            std::os::unix::fs::symlink(&outside, directory.join(".agent-recovery-123-3.mv2"))
                .unwrap();
            std::os::unix::fs::symlink(
                f.root.join("missing-target"),
                directory.join(".agent-recovery-123-4.mv2"),
            )
            .unwrap();
        }
        assert_eq!(f.store.status(NOW).unwrap().decisions, 1);
        assert!(!abandoned.exists());
        assert!(fs::read(f.store.agent_path()).unwrap() == before);
        for name in preserved {
            assert_eq!(
                fs::read(directory.join(name)).unwrap(),
                b"preserve this file"
            );
        }
        assert_eq!(
            fs::read(folder.join("owned-by-user")).unwrap(),
            b"preserve this directory"
        );
        #[cfg(unix)]
        {
            assert!(
                fs::symlink_metadata(directory.join(".agent-recovery-123-3.mv2"))
                    .unwrap()
                    .file_type()
                    .is_symlink()
            );
            assert!(
                fs::symlink_metadata(directory.join(".agent-recovery-123-4.mv2"))
                    .unwrap()
                    .file_type()
                    .is_symlink()
            );
            assert_eq!(
                fs::read(f.root.join("outside-memory")).unwrap(),
                b"preserve the symlink target"
            );
        }
        assert_eq!(
            f.store.agent_recall(&f.query(None)).unwrap().results[0].record,
            original
        );
    }

    #[test]
    #[cfg(unix)]
    fn a_memory_directory_alias_cannot_clean_another_worktrees_active_copy() {
        let owner = Fixture::new();
        let alias = Fixture::new();
        owner
            .store
            .agent_record(&owner.input("Owner's confirmed record"), NOW)
            .unwrap();
        let _lock = acquire_writer_lock(&owner.root).unwrap();
        let active = owner.store.copy_agent_memory().unwrap();
        let before = fs::read(owner.store.agent_path()).unwrap();
        let alias_directory = alias.root.join(".cgrx/memory");
        fs::remove_dir_all(&alias_directory).unwrap();
        std::os::unix::fs::symlink(owner.root.join(".cgrx/memory"), &alias_directory).unwrap();
        assert_eq!(
            alias.store.status(NOW).unwrap_err().kind(),
            io::ErrorKind::InvalidData
        );
        assert!(
            active.0.is_file(),
            "a different root's lock cannot authorize cleanup"
        );
        assert!(fs::read(owner.store.agent_path()).unwrap() == before);
        // Remove the alias before its fixture destructor so it cannot traverse owner data.
        fs::remove_file(alias_directory).unwrap();
    }

    #[test]
    fn missing_or_invalid_primary_preserves_copies_instead_of_creating_empty_memory() {
        let f = Fixture::new();
        let record = f
            .store
            .agent_record(&f.input("Keep the confirmed primary"), NOW)
            .unwrap()
            .record;
        let before = fs::read(f.store.agent_path()).unwrap();
        let abandoned = f.root.join(".cgrx/memory/.agent-recovery-123-5.mv2");
        fs::write(&abandoned, &before).unwrap();
        fs::write(f.store.agent_path(), b"invalid primary header").unwrap();
        assert!(f.store.status(NOW).is_err());
        assert!(fs::read(&abandoned).unwrap() == before);
        assert_eq!(
            fs::read(f.store.agent_path()).unwrap(),
            b"invalid primary header"
        );

        // A valid Memvid container with a bad record envelope must also preserve evidence.
        {
            fs::write(f.store.agent_path(), &before).unwrap();
            let mut memory = Memvid::open(f.store.agent_path()).unwrap();
            let options = PutOptions::builder()
                .tag("cgrx.memory", "v2")
                .auto_tag(false)
                .build();
            memory
                .put_bytes_with_options(b"invalid record envelope", options)
                .unwrap();
            memory.commit().unwrap();
        }
        let invalid_envelope = fs::read(f.store.agent_path()).unwrap();
        assert!(f.store.status(NOW).is_err());
        assert!(fs::read(&abandoned).unwrap() == before);
        assert!(fs::read(f.store.agent_path()).unwrap() == invalid_envelope);
        fs::remove_file(f.store.agent_path()).unwrap();
        assert_eq!(
            f.store.status(NOW).unwrap_err().kind(),
            io::ErrorKind::InvalidData
        );
        assert!(
            !f.store.agent_path().exists(),
            "do not silently create an empty replacement"
        );
        assert!(fs::read(&abandoned).unwrap() == before);
        fs::write(f.store.agent_path(), &before).unwrap();
        assert_eq!(
            f.store.agent_recall(&f.query(None)).unwrap().results[0].record,
            record
        );
        assert!(!abandoned.exists());
    }

    #[test]
    fn clean_reads_do_not_recommit_or_change_the_store() {
        let f = Fixture::new();
        let record = f
            .store
            .agent_record(&f.input("Keep committed state stable"), NOW)
            .unwrap()
            .record;
        let before = fs::read(f.store.agent_path()).unwrap();
        let mut hybrid = f.store.clone();
        hybrid.embeddings = true;
        assert_eq!(
            hybrid.agent_recall(&f.query(None)).unwrap().results.len(),
            1
        );
        assert_eq!(hybrid.status(NOW).unwrap().decisions, 1);
        assert_eq!(hybrid.prune_expired(NOW, true).unwrap().removed, 0);
        assert_eq!(
            hybrid
                .agent_forget(&record.decision.id, 2)
                .unwrap_err()
                .kind(),
            io::ErrorKind::AlreadyExists
        );
        assert!(
            fs::read(f.store.agent_path()).unwrap() == before,
            "reads and a rejected deletion must not rewrite the committed file"
        );
    }

    #[test]
    fn shared_source_reads_preserve_individual_fingerprints_and_spans() {
        let f = Fixture::new();
        let path = f.root.join("src/lib.rs");
        fs::write(&path, "// old context\n\npub fn parse() {}\n").unwrap();
        let mut input = f.input("Old context from line three");
        input.decision.provenance.span = Some(MemorySpan {
            start_line: 3,
            end_line: 3,
        });
        let old = f.store.prepare(&input, NOW).unwrap();
        fs::write(&path, "pub fn parse() {}\n").unwrap();
        let current = f.store.prepare(&f.input("Current context"), NOW).unwrap();
        let mut invalid_span = current.clone();
        invalid_span
            .decision
            .provenance
            .span
            .as_mut()
            .unwrap()
            .end_line = 2;
        let mut episode = old.clone();
        episode.memory_kind = MemoryKind::Episodic;

        let mut sources = SourceFingerprints::default();
        let reads = std::cell::Cell::new(0);
        for (record, expected) in [
            (&old, MemoryFreshness::NeedsReview),
            (&current, MemoryFreshness::Unchanged),
            (&invalid_span, MemoryFreshness::NeedsReview),
            (&episode, MemoryFreshness::Historical),
        ] {
            assert_eq!(
                sources.freshness(record, || {
                    reads.set(reads.get() + 1);
                    source_bytes(&f.root, &current.decision.provenance)
                }),
                expected
            );
        }
        assert_eq!(reads.get(), 1);

        fs::write(f.root.join("src/other.rs"), "pub fn other() {}\n").unwrap();
        let mut input = f.input("Other file context");
        input.decision.provenance.path = "src/other.rs".to_owned();
        let other = f.store.prepare(&input, NOW).unwrap();
        assert_eq!(
            sources.freshness(&other, || {
                reads.set(reads.get() + 1);
                source_bytes(&f.root, &other.decision.provenance)
            }),
            MemoryFreshness::Unchanged
        );
        assert_eq!(reads.get(), 2);
    }

    #[test]
    fn failed_source_reads_are_shared_only_within_one_phase() {
        let f = Fixture::new();
        let record = f.store.prepare(&f.input("Current context"), NOW).unwrap();
        let path = f.root.join("src/lib.rs");
        fs::remove_file(&path).unwrap();
        let mut sources = SourceFingerprints::default();
        assert_eq!(
            f.store.freshness(&record, &mut sources),
            MemoryFreshness::NeedsReview
        );
        let mut episode = record.clone();
        episode.memory_kind = MemoryKind::Episodic;
        assert_eq!(
            sources.freshness(&episode, || panic!("same failed observation")),
            MemoryFreshness::Historical
        );
        let mut unverified = record.clone();
        unverified.source_hash = None;
        assert_eq!(
            sources.freshness(&unverified, || panic!("unverified sources require no read")),
            MemoryFreshness::Unverified
        );
        fs::write(path, "pub fn parse() {}\n").unwrap();
        assert_eq!(
            f.store
                .freshness(&record, &mut SourceFingerprints::default()),
            MemoryFreshness::Unchanged
        );
    }

    #[test]
    fn shared_sources_are_rechecked_on_every_recall_after_change_and_restore() {
        let f = Fixture::new();
        let path = f.root.join("src/lib.rs");
        let old = f
            .store
            .agent_record(&f.input("Old context"), NOW)
            .unwrap()
            .record;
        let source = "pub fn current() {}\n";
        fs::write(&path, source).unwrap();
        let current = f
            .store
            .agent_record(&f.input("Current context"), NOW + 1)
            .unwrap()
            .record;
        let before = fs::read(f.store.agent_path()).unwrap();
        let query = f.query(None);
        let recalled = f.store.agent_recall(&query).unwrap();
        assert_eq!(recalled.results.len(), 1);
        assert_eq!(recalled.results[0].record, current);
        assert_eq!(recalled.results[0].freshness, MemoryFreshness::Unchanged);
        let mut review = query.clone();
        review.include_stale = true;
        let recalled = f.store.agent_recall(&review).unwrap();
        assert_eq!(recalled.results.len(), 2);
        let stale = recalled
            .results
            .iter()
            .find(|hit| hit.record == old)
            .unwrap();
        assert_eq!(stale.freshness, MemoryFreshness::NeedsReview);

        fs::write(&path, "pub fn changed_again() {}\n").unwrap();
        assert!(f.store.agent_recall(&query).unwrap().results.is_empty());
        fs::remove_file(&path).unwrap();
        assert!(f.store.agent_recall(&query).unwrap().results.is_empty());
        fs::write(path, source).unwrap();
        let recalled = f.store.agent_recall(&query).unwrap();
        assert_eq!(recalled.results.len(), 1);
        assert_eq!(recalled.results[0].record, current);
        assert_eq!(recalled.results[0].freshness, MemoryFreshness::Unchanged);
        assert_eq!(fs::read(f.store.agent_path()).unwrap(), before);
    }

    #[test]
    fn hidden_stale_memories_do_not_reduce_the_rank_of_visible_matches() {
        for kind in [
            MemoryKind::Semantic,
            MemoryKind::Procedural,
            MemoryKind::Working,
        ] {
            let f = Fixture::new();
            let current = f
                .store
                .agent_record(&f.input("The parser saves the current cache"), NOW)
                .unwrap()
                .record;
            fs::write(f.root.join("src/stale.rs"), "pub fn old_cache() {}\n").unwrap();
            let mut input = f.input("parser cache");
            input.memory_kind = kind;
            if kind == MemoryKind::Working {
                input.task_id = Some("ranking-checkpoint".to_owned());
            }
            input.decision.provenance.path = "src/stale.rs".to_owned();
            let stale = f.store.agent_record(&input, NOW).unwrap().record;
            fs::write(f.root.join("src/stale.rs"), "pub fn new_cache() {}\n").unwrap();

            let query = f.query(Some("parser cache"));
            let recalled = f.store.agent_recall(&query).unwrap();
            assert_eq!(recalled.results.len(), 1);
            assert_eq!(recalled.results[0].record, current);
            let mut scoped = query.clone();
            scoped.path = Some("src/lib.rs".to_owned());
            let exact = f.store.agent_recall(&scoped).unwrap();
            assert_eq!(exact.results.len(), 1);
            assert_eq!(exact.results[0].record, current);
            assert!(exact.results[0].score > 0.0);
            assert_eq!(recalled.results[0].score, exact.results[0].score);
            assert!(!recalled.truncated);

            let mut review = query;
            review.include_stale = true;
            let recalled = f.store.agent_recall(&review).unwrap();
            assert_eq!(recalled.results[0].record, stale);
            assert_eq!(recalled.results[0].freshness, MemoryFreshness::NeedsReview);
            assert_eq!(recalled.results[1].record, current);
            assert!(recalled.results[1].score < exact.results[0].score);
        }
    }

    #[test]
    fn changed_sources_keep_episodes_and_explicit_history_searchable() {
        let f = Fixture::new();
        let mut input = f.input("parser cache");
        input.memory_kind = MemoryKind::Episodic;
        input.event_id = Some("observed-cache-reset".to_owned());
        let episode = f.store.agent_record(&input, NOW).unwrap().record;
        let first = f
            .store
            .agent_record(&f.input("The parser saves the current cache"), NOW)
            .unwrap()
            .record;
        let updated = f
            .store
            .agent_update(
                &first.decision.id,
                1,
                &f.input("The parser refreshes its cache"),
                "Rechecked cache behavior",
                NOW + 1,
            )
            .unwrap()
            .record;
        fs::write(f.root.join("src/lib.rs"), "pub fn replacement() {}\n").unwrap();

        let recalled = f
            .store
            .agent_recall(&f.query(Some("parser cache")))
            .unwrap();
        assert_eq!(recalled.results.len(), 1);
        assert_eq!(recalled.results[0].record, episode);
        assert_eq!(recalled.results[0].freshness, MemoryFreshness::Historical);
        assert!(recalled.results[0].score > 0.0);

        let mut history = f.query(None);
        history.id = Some(first.decision.id.clone());
        history.include_history = true;
        let recalled = f.store.agent_recall(&history).unwrap();
        assert_eq!(recalled.results.len(), 1);
        assert_eq!(recalled.results[0].record, first);
        assert_eq!(recalled.results[0].freshness, MemoryFreshness::Historical);
        history.include_stale = true;
        let recalled = f.store.agent_recall(&history).unwrap();
        assert_eq!(recalled.results.len(), 2);
        assert_eq!(recalled.results[0].record, updated);
        assert_eq!(recalled.results[0].freshness, MemoryFreshness::NeedsReview);
        assert_eq!(recalled.results[1].record, first);
        assert_eq!(recalled.results[1].freshness, MemoryFreshness::Historical);
    }

    #[test]
    fn vector_backfill_only_indexes_visible_current_matches_and_preserves_history() {
        let f = Fixture::new();
        let mut input = f.input("Old selected assertion");
        input.task_id = Some("selected".to_owned());
        let first = f.store.agent_record(&input, NOW).unwrap().record;
        input.decision.fact = "Current selected assertion".to_owned();
        let current = f
            .store
            .agent_update(
                &first.decision.id,
                1,
                &input,
                "Verified correction",
                NOW + 1,
            )
            .unwrap()
            .record;
        for (fact, task, expiry, confidence, path) in [
            ("Other task", "other", None, 800, "src/lib.rs"),
            (
                "Expired assertion",
                "selected",
                Some(NOW + 1),
                800,
                "src/lib.rs",
            ),
            ("Low confidence", "selected", None, 100, "src/lib.rs"),
            ("Changed source", "selected", None, 800, "src/changed.rs"),
        ] {
            if path == "src/changed.rs" {
                fs::write(f.root.join(path), "pub fn old() {}\n").unwrap();
            }
            let mut input = f.input(fact);
            input.task_id = Some(task.to_owned());
            input.decision.valid_until_unix_nanos = expiry;
            input.decision.confidence = confidence;
            input.decision.provenance.path = path.to_owned();
            f.store.agent_record(&input, NOW).unwrap();
        }
        fs::write(f.root.join("src/changed.rs"), "pub fn new() {}\n").unwrap();
        let mut query = f.query(Some("selected assertion"));
        query.task_id = Some("selected".to_owned());
        query.recall.min_confidence = 700;
        query.recall.now_unix_nanos = NOW + 2;
        {
            let _lock = acquire_writer_lock(&f.root).unwrap();
            let mut memory = f.store.open_agent_memory(&_lock).unwrap();
            let expected = read_versions(&mut memory).unwrap();
            let mut embedded = Vec::new();
            let mut memory = f
                .store
                .ensure_vectors(memory, &query, |text| {
                    embedded.push(text.to_owned());
                    let mut vector = vec![0.0; 384];
                    vector[0] = 1.0;
                    Ok(vector)
                })
                .unwrap();
            assert_eq!(
                embedded.as_slice(),
                std::slice::from_ref(&current.decision.fact)
            );
            let actual = read_versions(&mut memory).unwrap();
            assert_eq!(
                record_inventory(actual.iter().map(|(_, record)| record)).unwrap(),
                record_inventory(expected.iter().map(|(_, record)| record)).unwrap()
            );
            for (frame, record) in actual {
                assert_eq!(
                    memory.frame_embedding(frame).unwrap().is_some(),
                    record == current
                );
            }
            let before = fs::read(f.store.agent_path()).unwrap();
            let memory = f
                .store
                .ensure_vectors(memory, &query, |_| panic!("already indexed"))
                .unwrap();
            drop(memory);
            assert!(fs::read(f.store.agent_path()).unwrap() == before);
        }
        let mut history = f.query(None);
        history.id = Some(first.decision.id.clone());
        history.include_history = true;
        let records = f.store.agent_recall(&history).unwrap().results;
        assert_eq!(records.len(), 2);
        assert_eq!(records[0].record, current);
        assert_eq!(records[1].record, first);
        let found = f.store.agent_recall(&query).unwrap().results;
        assert_eq!(found.len(), 1);
        assert_eq!(found[0].record, current);
    }

    #[test]
    fn failed_backfill_and_invalid_copy_preserve_original_bytes_and_allow_retry() {
        let f = Fixture::new();
        for fact in ["First committed assertion", "Second committed assertion"] {
            f.store.agent_record(&f.input(fact), NOW).unwrap();
        }
        let before = fs::read(f.store.agent_path()).unwrap();
        let query = f.query(Some("assertion"));
        let _lock = acquire_writer_lock(&f.root).unwrap();
        let mut memory = f.store.open_agent_memory(&_lock).unwrap();
        let expected: Vec<_> = read_versions(&mut memory)
            .unwrap()
            .into_iter()
            .map(|(_, record)| record)
            .collect();
        let mut calls = 0;
        let outcome = f.store.ensure_vectors(memory, &query, |_| {
            calls += 1;
            if calls == 2 {
                return Err(io::Error::other("embedding inference interrupted"));
            }
            let mut vector = vec![0.0; 384];
            vector[0] = 1.0;
            Ok(vector)
        });
        assert!(outcome.is_err());
        assert_eq!(
            calls, 2,
            "failure follows a staged replacement and deletion"
        );
        assert!(fs::read(f.store.agent_path()).unwrap() == before);

        for busy in [true, false] {
            let outcome = f.store.edit_agent_copy(&expected, |memory| {
                let frame = read_versions(memory)?[0].0;
                memory.delete_frame(frame).map_err(memvid_backend_error)?;
                if busy {
                    Err(memvid_backend_error(MemvidError::Tantivy {
                        reason: "Failed to acquire Lockfile: LockBusy. test".to_owned(),
                    }))
                } else {
                    Ok(())
                }
            });
            let error = match outcome {
                Err(error) => error,
                Ok(_) => panic!("partial or failed edits must not be published"),
            };
            assert_eq!(
                error.kind(),
                if busy {
                    io::ErrorKind::WouldBlock
                } else {
                    io::ErrorKind::InvalidData
                }
            );
            assert!(fs::read(f.store.agent_path()).unwrap() == before);
        }
        memory = f.store.open_agent_memory(&_lock).unwrap();
        let mut memory = f
            .store
            .ensure_vectors(memory, &query, |_| {
                let mut vector = vec![0.0; 384];
                vector[0] = 1.0;
                Ok(vector)
            })
            .unwrap();
        let actual = read_versions(&mut memory).unwrap();
        assert_eq!(actual.len(), expected.len());
        for (frame, _) in &actual {
            assert!(memory.frame_embedding(*frame).unwrap().is_some());
        }
        assert_eq!(
            record_inventory(actual.iter().map(|(_, record)| record)).unwrap(),
            record_inventory(expected.iter()).unwrap()
        );
        assert!(
            !fs::read_dir(f.root.join(".cgrx/memory"))
                .unwrap()
                .any(|entry| entry
                    .unwrap()
                    .file_name()
                    .to_string_lossy()
                    .starts_with(".agent-recovery-"))
        );
    }

    #[test]
    fn typed_memory_survives_reopen_and_keeps_source_provenance() {
        let f = Fixture::new();
        let first = f
            .store
            .agent_record(
                &f.input("Invalidate parser cache after source changes"),
                NOW,
            )
            .unwrap();
        assert!(!first.duplicate);
        let second = f
            .store
            .agent_record(
                &f.input("Invalidate parser cache after source changes"),
                NOW + 1,
            )
            .unwrap();
        assert!(second.duplicate);
        let reopened = MemoryStore::open_lexical(&f.root).unwrap();
        let recall = reopened
            .agent_recall(&f.query(Some("parser source")))
            .unwrap();
        assert_eq!(
            recall.results.len(),
            1,
            "BM25 supports separated query terms"
        );
        let hit = &recall.results[0];
        assert_eq!(hit.record.decision.id, first.record.decision.id);
        assert_eq!(hit.freshness, MemoryFreshness::Unchanged);
        assert!(hit.record.source_hash.is_some());
        assert_eq!(recall.search_mode, "lexical");
        assert!(f.store.agent_path().is_file());
    }

    #[test]
    fn code_links_survive_reopen_and_make_symbol_names_searchable() {
        let f = Fixture::new();
        let source = "// Проверка UTF-8\n\npub fn parse() {\n    let value = \"кеш\";\n}\n";
        let input = f.linked_input(source);
        let written = f.store.agent_record(&input, NOW).unwrap();
        let reopened = MemoryStore::open_lexical(&f.root).unwrap();
        let found = reopened.agent_recall(&f.query(Some("parse"))).unwrap();
        assert_eq!(
            found.results[0].record.decision.id,
            written.record.decision.id
        );
        let code = reopened.agent_code_excerpt(&found.results[0].record);
        assert_eq!(code.status, "available");
        assert_eq!(code.symbol.as_deref(), Some("parse"));
        assert_eq!(
            code.source.as_deref(),
            Some(&source[source.find("pub fn").unwrap()..])
        );
        assert_eq!(
            code.span.unwrap(),
            MemorySpan {
                start_line: 3,
                end_line: 5
            }
        );
        assert!(!code.truncated);
    }

    #[test]
    fn changed_code_never_returns_a_fragment_for_the_old_memory() {
        let f = Fixture::new();
        let input = f.linked_input("pub fn parse() {\n    old_cache();\n}\n");
        let record = f.store.agent_record(&input, NOW).unwrap().record;
        fs::write(
            f.root.join("src/lib.rs"),
            "pub fn parse() {\n    new_cache();\n}\n",
        )
        .unwrap();
        let code = f.store.agent_code_excerpt(&record);
        assert_eq!(code.status, "needs_review");
        assert!(code.source.is_none());
        assert!(f.store.agent_record(&input, NOW + 1).is_err());
        let mut query = f.query(None);
        query.include_stale = true;
        assert_eq!(
            f.store.agent_recall(&query).unwrap().results[0].freshness,
            MemoryFreshness::NeedsReview
        );
    }

    #[test]
    fn code_excerpts_are_bounded_without_splitting_unicode() {
        let f = Fixture::new();
        let source = format!(
            "pub fn parse() {{\n{}\n}}\n",
            "    // 🚀 длинный комментарий\n".repeat(90)
        );
        let input = f.linked_input(&source);
        let record = f.store.agent_record(&input, NOW).unwrap().record;
        let code = f.store.agent_code_excerpt(&record);
        assert_eq!(code.status, "available");
        assert!(code.truncated);
        let text = code.source.unwrap();
        assert!(text.lines().count() <= 40);
        assert!(text.chars().count() <= 4000);
        assert_eq!(code.span.unwrap().end_line, text.lines().count() as u32);
    }

    #[test]
    fn symbol_binding_rejects_stale_bytes_and_outside_spans() {
        let f = Fixture::new();
        let input = f.linked_input("// контекст\n\npub fn parse() {}\n");
        let link = input.code_link.unwrap();
        let mut provenance = input.decision.provenance;
        assert!(
            f.store
                .bind_code(&provenance, link.clone(), "wrong indexed source")
                .is_err()
        );
        provenance.span = Some(MemorySpan {
            start_line: 1,
            end_line: 1,
        });
        assert!(
            f.store
                .bind_code(&provenance, link, "pub fn parse() {}\n")
                .is_err()
        );
    }

    #[test]
    fn source_changes_require_review() {
        let f = Fixture::new();
        f.store
            .agent_record(&f.input("Keep parse cache"), NOW)
            .unwrap();
        assert_eq!(
            f.store.agent_recall(&f.query(None)).unwrap().results.len(),
            1
        );
        fs::write(f.root.join("src/lib.rs"), "pub fn parse() { panic!() }\n").unwrap();
        assert!(
            f.store
                .agent_recall(&f.query(None))
                .unwrap()
                .results
                .is_empty()
        );
        let mut query = f.query(None);
        query.include_stale = true;
        assert_eq!(
            f.store.agent_recall(&query).unwrap().results[0].freshness,
            MemoryFreshness::NeedsReview
        );
    }

    #[test]
    fn long_multiline_facts_keep_their_envelope_and_full_search_text() {
        let f = Fixture::new();
        let fact = format!(
            "{}\n\nПоследний маркер: cache-reset",
            "parser context ".repeat(240)
        );
        let record = f.store.agent_record(&f.input(&fact), NOW).unwrap().record;
        let reopened = MemoryStore::open_lexical(&f.root).unwrap();
        let result = reopened
            .agent_recall(&f.query(Some("cache-reset")))
            .unwrap();
        assert_eq!(result.results.len(), 1);
        assert_eq!(result.results[0].record.decision.fact, fact);
        assert_eq!(reopened.agent_forget(&record.decision.id, 1).unwrap(), 1);
        assert!(
            reopened
                .agent_recall(&f.query(Some("parser")))
                .unwrap()
                .results
                .is_empty()
        );
    }

    #[test]
    fn separate_repositories_and_episode_ids_never_deduplicate_each_other() {
        let a = Fixture::new();
        let b = Fixture::new();
        let one = a
            .store
            .agent_record(&a.input("Same project decision"), NOW)
            .unwrap();
        let two = b
            .store
            .agent_record(&b.input("Same project decision"), NOW)
            .unwrap();
        assert_ne!(one.record.decision.id, two.record.decision.id);
        let mut foreign = a.input("Wrong repository");
        foreign.decision.provenance.repo = b.root.to_string_lossy().into_owned();
        assert!(a.store.agent_record(&foreign, NOW).is_err());
        let mut episode = a.input("Resolver attempt failed");
        episode.memory_kind = MemoryKind::Episodic;
        assert!(a.store.agent_record(&episode, NOW).is_err());
        episode.event_id = Some("attempt-1".to_owned());
        let first = a.store.agent_record(&episode, NOW).unwrap();
        episode.event_id = Some("attempt-2".to_owned());
        let second = a.store.agent_record(&episode, NOW).unwrap();
        assert_ne!(first.record.decision.id, second.record.decision.id);
        fs::write(a.root.join("src/lib.rs"), "pub fn different() {}\n").unwrap();
        let mut query = a.query(None);
        query.memory_kind = Some(MemoryKind::Episodic);
        let results = a.store.agent_recall(&query).unwrap().results;
        assert_eq!(results.len(), 2);
        assert!(
            results
                .iter()
                .all(|h| h.freshness == MemoryFreshness::Historical)
        );
    }

    #[test]
    fn updates_preserve_identity_history_and_reject_lost_updates() {
        let f = Fixture::new();
        let record = f
            .store
            .agent_record(&f.input("Use old parser"), NOW)
            .unwrap()
            .record;
        let id = record.decision.id;
        let updated = f
            .store
            .agent_update(
                &id,
                1,
                &f.input("Use new parser"),
                "old parser failed the fixture",
                NOW + 1,
            )
            .unwrap()
            .record;
        assert_eq!(updated.version, 2);
        assert_eq!(updated.decision.id, id);
        assert_eq!(updated.decision.recorded_unix_nanos, NOW);
        assert!(
            f.store
                .agent_update(&id, 1, &f.input("Lost edit"), "stale", NOW + 2)
                .is_err()
        );
        let current = f.store.agent_recall(&f.query(None)).unwrap();
        assert_eq!(current.results.len(), 1);
        assert_eq!(current.results[0].record.decision.fact, "Use new parser");
        let mut history = f.query(None);
        history.id = Some(id.clone());
        history.include_history = true;
        let result = f.store.agent_recall(&history).unwrap();
        assert_eq!(result.results.len(), 2);
        assert!(
            result
                .results
                .iter()
                .any(|h| h.freshness == MemoryFreshness::Historical)
        );
        assert!(f.store.agent_forget(&id, 1).is_err());
        assert_eq!(f.store.agent_forget(&id, 2).unwrap(), 2);
        assert!(f.store.agent_recall(&history).unwrap().results.is_empty());
        assert!(
            f.store
                .agent_recall(&f.query(Some("parser")))
                .unwrap()
                .results
                .is_empty()
        );
    }

    #[test]
    fn working_memory_has_task_scope_idempotence_and_default_expiry() {
        let f = Fixture::new();
        let mut input = f.input("Remaining: run resolver fixtures");
        input.memory_kind = MemoryKind::Working;
        input.source_kind = MemorySourceKind::Agent;
        input.source_ref = Some("task checkpoint".to_owned());
        input.decision.provenance.path.clear();
        input.decision.provenance.span = None;
        assert!(f.store.agent_record(&input, NOW).is_err());
        input.task_id = Some("resolver-task".to_owned());
        let first = f.store.agent_record(&input, NOW).unwrap();
        assert_eq!(
            first.record.decision.valid_until_unix_nanos,
            Some(NOW + WORKING_TTL)
        );
        assert!(f.store.agent_record(&input, NOW + 1).unwrap().duplicate);
        let mut query = f.query(None);
        query.task_id = Some("another-task".to_owned());
        assert!(f.store.agent_recall(&query).unwrap().results.is_empty());
        query.task_id = input.task_id;
        assert_eq!(f.store.agent_recall(&query).unwrap().results.len(), 1);
        query.recall.now_unix_nanos = NOW + WORKING_TTL;
        assert!(f.store.agent_recall(&query).unwrap().results.is_empty());
        assert_eq!(
            f.store
                .prune_expired(NOW + WORKING_TTL, false)
                .unwrap()
                .removed,
            1
        );
    }

    #[test]
    fn code_filters_are_exact_before_limits_and_apply_to_history() {
        let f = Fixture::new();
        let source = "pub fn parse() {}\n";
        let mut first = f.linked_input(source);
        first.decision.confidence = 900;
        let saved = f.store.agent_record(&first, NOW).unwrap().record;
        fs::write(f.root.join("src/other.rs"), source).unwrap();
        let mut second = first.clone();
        second.decision.provenance.path = "src/other.rs".to_owned();
        second.decision.confidence = 100;
        let other = f.store.agent_record(&second, NOW + 1).unwrap().record;
        let mut query = f.query(Some("obsolete"));
        query.recall.limit = 1;
        query.path = Some("src/other.rs".to_owned());
        query.symbol = Some("parse".to_owned());
        let found = f.store.agent_recall(&query).unwrap();
        assert_eq!(found.results.len(), 1);
        assert_eq!(found.results[0].record.decision.id, other.decision.id);
        assert!(!found.truncated);
        query.symbol = Some("Parse".to_owned());
        assert!(f.store.agent_recall(&query).unwrap().results.is_empty());
        query.symbol = Some("parse".to_owned());
        query.path = Some("src/missing.rs".to_owned());
        assert!(f.store.agent_recall(&query).unwrap().results.is_empty());
        for path in ["", "/absolute.rs", "../outside.rs", "src/../lib.rs"] {
            query.path = Some(path.to_owned());
            assert!(f.store.agent_recall(&query).is_err(), "{path}");
        }
        query.path = None;
        for symbol in [String::new(), "x".repeat(1025), "parse\0".to_owned()] {
            query.symbol = Some(symbol);
            assert!(f.store.agent_recall(&query).is_err());
        }
        f.store
            .agent_update(&saved.decision.id, 1, &second, "source relocated", NOW + 2)
            .unwrap();
        query = f.query(None);
        query.id = Some(saved.decision.id.clone());
        query.include_history = true;
        query.path = Some("src/lib.rs".to_owned());
        query.symbol = Some("parse".to_owned());
        let history = f.store.agent_recall(&query).unwrap();
        assert_eq!(history.results.len(), 1);
        assert_eq!(history.results[0].record.version, 1);
        assert_eq!(history.results[0].freshness, MemoryFreshness::Historical);
        query.include_history = false;
        assert!(f.store.agent_recall(&query).unwrap().results.is_empty());
    }

    #[test]
    fn paths_and_spans_cannot_escape_or_invent_evidence() {
        let f = Fixture::new();
        for path in ["../outside", "/etc/passwd", "missing.rs"] {
            let mut input = f.input("Unsupported assertion");
            input.decision.provenance.path = path.to_owned();
            assert!(f.store.agent_record(&input, NOW).is_err());
        }
        let mut input = f.input("Unsupported lines");
        input.decision.provenance.span.as_mut().unwrap().end_line = 100;
        assert!(f.store.agent_record(&input, NOW).is_err());
        input.source_kind = MemorySourceKind::User;
        input.decision.provenance.path.clear();
        input.decision.provenance.span = None;
        assert!(f.store.agent_record(&input, NOW).is_err());
        input.source_ref = Some("explicit user instruction".to_owned());
        let record = f.store.agent_record(&input, NOW).unwrap().record;
        let recalled = f.store.agent_recall(&f.query(None)).unwrap();
        assert_eq!(recalled.results[0].record.decision.id, record.decision.id);
        assert_eq!(recalled.results[0].freshness, MemoryFreshness::Unverified);
    }

    #[cfg(unix)]
    #[test]
    fn symlink_outside_repository_is_rejected() {
        let f = Fixture::new();
        let outside = Fixture::new();
        std::os::unix::fs::symlink(outside.root.join("src/lib.rs"), f.root.join("linked.rs"))
            .unwrap();
        let mut input = f.input("Escaped evidence");
        input.decision.provenance.path = "linked.rs".to_owned();
        assert!(f.store.agent_record(&input, NOW).is_err());
    }

    #[test]
    fn migration_retry_keeps_updated_history_when_archiving_is_interrupted() {
        let f = Fixture::new();
        let first = f
            .store
            .agent_record(&f.input("Original decision"), NOW)
            .unwrap()
            .record;
        let current = f
            .store
            .agent_update(
                &first.decision.id,
                1,
                &f.input("Corrected decision"),
                "Checked current evidence",
                NOW + 1,
            )
            .unwrap()
            .record;
        let mut imported = first.decision.clone();
        imported.id = format!("{:032x}", 1);
        imported.fact = "Imported decision".to_owned();
        for record in [&first.decision, &imported] {
            let envelope = serde_json::json!({
                "schema_version": MEMORY_SCHEMA_VERSION,
                "content_hash": fingerprint(record).unwrap(), "record": record,
            });
            fs::write(
                f.root
                    .join(".cgrx/memory/decisions")
                    .join(format!("{}.json", record.id)),
                serde_json::to_vec(&envelope).unwrap(),
            )
            .unwrap();
        }
        // Import commits before archiving; a failed rename must not cause reimport
        // or replace a newer existing version with its old legacy decision.
        let blocked = f
            .root
            .join(".cgrx/memory/decisions")
            .join(format!("{}.json.migrated", imported.id));
        fs::create_dir(&blocked).unwrap();
        assert!(f.store.status(NOW).is_err());
        fs::remove_dir(blocked).unwrap();
        assert_eq!(f.store.status(NOW).unwrap().decisions, 2);
        let mut history = f.query(None);
        history.id = Some(first.decision.id.clone());
        history.include_history = true;
        let records = f.store.agent_recall(&history).unwrap().results;
        assert_eq!(records.len(), 2);
        assert_eq!(records[0].record, current);
        assert_eq!(records[1].record, first);
        history.id = Some(imported.id.clone());
        let records = f.store.agent_recall(&history).unwrap().results;
        assert_eq!(records.len(), 1);
        assert_eq!(records[0].record.decision, imported);
        assert_eq!(records[0].record.version, 1);
        assert_eq!(f.store.status(NOW).unwrap().decisions, 2);
    }

    #[test]
    fn legacy_migration_is_complete_past_one_hundred_records_and_forget_is_durable() {
        let f = Fixture::new();
        let mut last_id = String::new();
        for i in 0..121 {
            let decision = DecisionRecord {
                id: format!("{i:032x}"),
                fact: format!("legacy decision number {i}"),
                confidence: 500,
                provenance: f.input("unused").decision.provenance,
                recorded_unix_nanos: NOW,
                valid_until_unix_nanos: None,
                privacy_tag: DEFAULT_PRIVACY_TAG.to_owned(),
            };
            let envelope = serde_json::json!({
                "schema_version": MEMORY_SCHEMA_VERSION,
                "content_hash": fingerprint(&decision).unwrap(), "record": decision,
            });
            last_id = format!("{i:032x}");
            fs::write(
                f.root
                    .join(".cgrx/memory/decisions")
                    .join(format!("{last_id}.json")),
                serde_json::to_vec(&envelope).unwrap(),
            )
            .unwrap();
        }
        assert_eq!(f.store.status(NOW).unwrap().decisions, 121);
        assert!(
            f.root
                .join(".cgrx/memory/decisions")
                .join(format!("{last_id}.json.migrated"))
                .is_file()
        );
        f.store.agent_forget(&last_id, 1).unwrap();
        let reopened = MemoryStore::open_lexical(&f.root).unwrap();
        assert_eq!(reopened.status(NOW).unwrap().decisions, 120);
        assert!(
            !f.root
                .join(".cgrx/memory/decisions")
                .join(format!("{last_id}.json.migrated"))
                .exists()
        );
    }

    #[test]
    fn writer_contention_returns_busy_without_accepting_partial_writes() {
        let f = Fixture::new();
        let held = acquire_writer_lock(&f.root).unwrap();
        let result = f.store.agent_record(&f.input("Concurrent edit"), NOW);
        assert_eq!(result.unwrap_err().kind(), io::ErrorKind::WouldBlock);
        drop(held);
        assert!(
            f.store
                .agent_recall(&f.query(None))
                .unwrap()
                .results
                .is_empty()
        );
    }

    #[test]
    fn brief_writer_contention_waits_and_publishes_exactly_once() {
        let f = Fixture::new();
        let held = acquire_writer_lock(&f.root).unwrap();
        let release = std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(60));
            drop(held);
        });
        let published = f
            .store
            .agent_record(&f.input("Wait for the current publisher"), NOW)
            .unwrap();
        release.join().unwrap();
        assert!(!published.duplicate);
        let recalled = f.store.agent_recall(&f.query(None)).unwrap();
        assert_eq!(recalled.results.len(), 1);
        assert_eq!(recalled.results[0].record.version, 1);
        assert_eq!(
            recalled.results[0].record.decision.id,
            published.record.decision.id
        );
    }

    #[test]
    fn compaction_preserves_history_vectors_and_forgetting_then_allows_consecutive_updates() {
        let f = Fixture::new();
        let first = f
            .store
            .agent_record(&f.input("Original decision"), NOW)
            .unwrap()
            .record;
        let forgotten = f
            .store
            .agent_record(&f.input("Forget this decision"), NOW)
            .unwrap()
            .record;
        for version in 1..3 {
            f.store
                .agent_update(
                    &first.decision.id,
                    version,
                    &f.input(&format!("Correction {version}")),
                    "verified correction",
                    NOW + u64::from(version),
                )
                .unwrap();
        }
        f.store.agent_forget(&forgotten.decision.id, 1).unwrap();
        let before_size = fs::metadata(f.store.agent_path()).unwrap().len();
        {
            let lock = acquire_writer_lock(&f.root).unwrap();
            let mut memory = f.store.open_agent_memory(&lock).unwrap();
            let versions = read_versions(&mut memory).unwrap();
            let (old_frame, record) = versions[0].clone();
            append(&mut memory, &record, Some(vec![0.125; 384])).unwrap();
            memory.delete_frame(old_frame).unwrap();
            memory.commit().unwrap();
            let versions = read_versions(&mut memory).unwrap();
            let before = storage_inventory(&mut memory).unwrap();
            drop(memory);
            let mut compacted = f.store.compact_agent_memory(&versions).unwrap();
            assert_eq!(storage_inventory(&mut compacted).unwrap(), before);
            assert!(
                read_versions(&mut compacted)
                    .unwrap()
                    .iter()
                    .all(|(_, r)| r.decision.id != forgotten.decision.id)
            );
        }
        assert!(fs::metadata(f.store.agent_path()).unwrap().len() < before_size);
        for version in 3..5 {
            let updated = f
                .store
                .agent_update(
                    &first.decision.id,
                    version,
                    &f.input(&format!("After compaction {version}")),
                    "verified continuation",
                    NOW + u64::from(version),
                )
                .unwrap();
            assert_eq!(updated.record.version, version + 1);
        }
        let reopened = MemoryStore::open_lexical(&f.root).unwrap();
        let mut query = f.query(None);
        query.id = Some(first.decision.id);
        query.include_history = true;
        let history = reopened.agent_recall(&query).unwrap();
        assert_eq!(
            history
                .results
                .iter()
                .map(|hit| hit.record.version)
                .collect::<BTreeSet<_>>(),
            BTreeSet::from([1, 2, 3, 4, 5])
        );
    }

    #[test]
    fn compaction_rejects_a_changed_inventory_and_unknown_frames_without_publishing() {
        let f = Fixture::new();
        f.store
            .agent_record(&f.input("Preserved decision"), NOW)
            .unwrap();
        let lock = acquire_writer_lock(&f.root).unwrap();
        let mut memory = f.store.open_agent_memory(&lock).unwrap();
        let versions = read_versions(&mut memory).unwrap();
        drop(memory);
        let before = fs::read(f.store.agent_path()).unwrap();
        assert!(f.store.compact_agent_memory(&[]).is_err());
        assert_eq!(fs::read(f.store.agent_path()).unwrap(), before);
        let mut memory = f.store.open_agent_memory(&lock).unwrap();
        memory.put_bytes(b"unknown independent document").unwrap();
        memory.commit().unwrap();
        drop(memory);
        let before = fs::read(f.store.agent_path()).unwrap();
        assert!(f.store.compact_agent_memory(&versions).is_err());
        assert_eq!(fs::read(f.store.agent_path()).unwrap(), before);
    }

    #[test]
    fn failed_commit_recovers_exact_wal_update_without_replaying_mutation() {
        let f = Fixture::new();
        let first = f
            .store
            .agent_record(&f.input("Original decision"), NOW)
            .unwrap()
            .record;
        let mut expected = f
            .store
            .prepare(&f.input("Corrected decision"), NOW + 1)
            .unwrap();
        expected.decision.id = first.decision.id.clone();
        expected.decision.recorded_unix_nanos = first.decision.recorded_unix_nanos;
        expected.version = 2;
        expected.update_reason = Some("Verified replacement".to_owned());
        {
            let _lock = acquire_writer_lock(&f.root).unwrap();
            let mut memory = f.store.open_agent_memory(&_lock).unwrap();
            append(&mut memory, &expected, None).unwrap();
            let calls = std::cell::Cell::new(0);
            f.store
                .finish_agent_write(memory, PendingAgentWrite::Update(&expected, 1), |_| {
                    calls.set(calls.get() + 1);
                    Err(MemvidError::Tantivy {
                        reason: "Failed to acquire Lockfile: LockBusy. test".to_owned(),
                    })
                })
                .unwrap();
            assert_eq!(calls.get(), 1);
        }
        let mut query = f.query(None);
        query.id = Some(first.decision.id.clone());
        query.include_history = true;
        let history = f.store.agent_recall(&query).unwrap().results;
        assert_eq!(
            history.len(),
            2,
            "WAL recovery must not append another logical version"
        );
        assert!(history.iter().any(|hit| hit.record == expected));
        // Delete markers also survive through WAL recovery; verify every version.
        {
            let _lock = acquire_writer_lock(&f.root).unwrap();
            let mut memory = f.store.open_agent_memory(&_lock).unwrap();
            for (frame, _) in read_versions(&mut memory).unwrap() {
                memory.delete_frame(frame).unwrap();
            }
            let calls = std::cell::Cell::new(0);
            f.store
                .finish_agent_write(
                    memory,
                    PendingAgentWrite::Forget(&first.decision.id, 2),
                    |_| {
                        calls.set(calls.get() + 1);
                        Err(MemvidError::Tantivy {
                            reason: "Failed to acquire Lockfile: LockBusy. test".to_owned(),
                        })
                    },
                )
                .unwrap();
            assert_eq!(calls.get(), 1);
        }
        assert!(f.store.agent_recall(&query).unwrap().results.is_empty());
    }

    #[test]
    fn commit_recovery_never_claims_a_different_record_or_hides_corruption() {
        let f = Fixture::new();
        let first = f
            .store
            .agent_record(&f.input("Unchanged original"), NOW)
            .unwrap()
            .record;
        let mut expected = first.clone();
        expected.version = 2;
        expected.decision.fact = "Uncommitted replacement".to_owned();
        for reason in [
            "Failed to acquire Lockfile: LockBusy. test",
            "checksum mismatch mentioning LockBusy",
        ] {
            let error = {
                let _lock = acquire_writer_lock(&f.root).unwrap();
                let memory = f.store.open_agent_memory(&_lock).unwrap();
                f.store
                    .finish_agent_write(memory, PendingAgentWrite::Update(&expected, 1), |_| {
                        Err(MemvidError::Tantivy {
                            reason: reason.to_owned(),
                        })
                    })
                    .unwrap_err()
            };
            assert!(
                error
                    .get_ref()
                    .unwrap()
                    .downcast_ref::<MemoryWriteUncertain>()
                    .is_some()
            );
            let current = f.store.agent_recall(&f.query(None)).unwrap().results;
            assert_eq!(current.len(), 1);
            assert_eq!(current[0].record, first);
        }
        let error = {
            let _lock = acquire_writer_lock(&f.root).unwrap();
            let memory = f.store.open_agent_memory(&_lock).unwrap();
            f.store
                .finish_agent_write(
                    memory,
                    PendingAgentWrite::Forget(&first.decision.id, 1),
                    |_| {
                        Err(MemvidError::Tantivy {
                            reason: "Failed to acquire Lockfile: LockBusy. test".to_owned(),
                        })
                    },
                )
                .unwrap_err()
        };
        let uncertain = error
            .get_ref()
            .unwrap()
            .downcast_ref::<MemoryWriteUncertain>()
            .unwrap();
        assert_eq!(uncertain.id, first.decision.id);
        assert_eq!(uncertain.operation, "forget");
        assert_eq!(uncertain.expected_version, Some(1));
        assert_eq!(
            f.store.agent_recall(&f.query(None)).unwrap().results.len(),
            1
        );
        {
            let _lock = acquire_writer_lock(&f.root).unwrap();
            let original_bytes = fs::read(f.store.agent_path()).unwrap();
            let mut attempts = 0;
            let error = f
                .store
                .recover_agent_journal(None, |path| {
                    attempts += 1;
                    // Model an upstream recovery that overwrites its TOC before failing.
                    fs::write(path, b"failed recovery destroyed this disposable copy").unwrap();
                    Err(MemvidError::Tantivy {
                        reason: "Failed to acquire Lockfile: LockBusy. test".to_owned(),
                    })
                })
                .unwrap_err();
            assert_eq!(error.kind(), io::ErrorKind::WouldBlock);
            assert_eq!(attempts, 3, "recovery attempts must be bounded");
            assert_eq!(fs::read(f.store.agent_path()).unwrap(), original_bytes);
            assert!(
                !fs::read_dir(f.root.join(".cgrx/memory"))
                    .unwrap()
                    .any(|entry| {
                        entry
                            .unwrap()
                            .file_name()
                            .to_string_lossy()
                            .starts_with(".agent-recovery-")
                    })
            );
        }
        assert_eq!(
            memvid_backend_error(MemvidError::Tantivy {
                reason: "Failed to acquire Lockfile: LockBusy. test".to_owned(),
            })
            .kind(),
            io::ErrorKind::WouldBlock
        );
        assert_eq!(
            memvid_backend_error(MemvidError::Tantivy {
                reason: "invalid index mentioning LockBusy".to_owned(),
            })
            .kind(),
            io::ErrorKind::Other
        );
    }

    #[test]
    fn failed_initialization_keeps_primary_absent_and_allows_a_safe_retry() {
        let f = Fixture::new();
        let lock = acquire_writer_lock(&f.root).unwrap();
        let error = f
            .store
            .create_agent_memory(|path| {
                // SDK create can write its header/WAL before a staging-lock error.
                fs::write(path, b"incomplete SDK initialization").unwrap();
                Err(MemvidError::Tantivy {
                    reason: "Failed to acquire Lockfile: LockBusy. test".to_owned(),
                })
            })
            .err()
            .unwrap();
        assert_eq!(error.kind(), io::ErrorKind::WouldBlock);
        assert!(!f.store.agent_path().exists());
        assert!(f.store.abandoned_agent_copies(&lock).unwrap().is_empty());
        drop(lock);
        let record = f
            .store
            .agent_record(&f.input("First durable decision"), NOW)
            .unwrap()
            .record;
        assert_eq!(record.version, 1);
        assert_eq!(
            f.store.agent_recall(&f.query(None)).unwrap().results[0].record,
            record
        );
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            assert_eq!(
                fs::metadata(f.store.agent_path())
                    .unwrap()
                    .permissions()
                    .mode()
                    & 0o777,
                0o600
            );
        }
    }

    #[test]
    fn initialization_cannot_publish_an_unexpected_nonempty_store() {
        let f = Fixture::new();
        let lock = acquire_writer_lock(&f.root).unwrap();
        let outcome = f.store.create_agent_memory(|path| {
            let mut memory = Memvid::create(path)?;
            memory.put_bytes(b"unexpected bootstrap record")?;
            Ok(memory)
        });
        assert!(outcome.is_err());
        assert!(!f.store.agent_path().exists());
        assert!(f.store.abandoned_agent_copies(&lock).unwrap().is_empty());
    }

    #[test]
    fn journal_recovery_rejects_a_copy_damaged_after_open_without_changing_primary() {
        use std::io::Write;

        let f = Fixture::new();
        let first = f
            .store
            .agent_record(&f.input("Preserved decision"), NOW)
            .unwrap()
            .record;
        let lock = acquire_writer_lock(&f.root).unwrap();
        let original_bytes = fs::read(f.store.agent_path()).unwrap();
        let outcome =
            f.store
                .recover_agent_journal(Some(&PendingAgentWrite::Record(&first)), |path| {
                    let memory = Memvid::open(path)?;
                    // Model a late storage/finalization fault after the SDK cached its
                    // TOC. The open handle can still read every envelope successfully.
                    let mut file = fs::OpenOptions::new().write(true).open(path).unwrap();
                    file.write_all(b"BROKEN!!").unwrap();
                    file.sync_all().unwrap();
                    Ok(memory)
                });
        assert!(
            outcome.is_err(),
            "cached recovery reads cannot confirm a damaged on-disk copy"
        );
        assert_eq!(fs::read(f.store.agent_path()).unwrap(), original_bytes);
        assert!(f.store.abandoned_agent_copies(&lock).unwrap().is_empty());
        drop(lock);
        assert_eq!(
            f.store.agent_recall(&f.query(None)).unwrap().results[0].record,
            first
        );
    }

    #[test]
    fn journal_recovery_rejects_lost_unrelated_history_even_when_pending_record_survives() {
        let f = Fixture::new();
        let first = f
            .store
            .agent_record(&f.input("Pending decision"), NOW)
            .unwrap()
            .record;
        f.store
            .agent_record(&f.input("Unrelated history must survive"), NOW + 1)
            .unwrap();
        let alternate = f.root.join("incomplete-copy.mv2");
        {
            let mut memory = Memvid::create(&alternate).unwrap();
            append(&mut memory, &first, None).unwrap();
            memory.commit().unwrap();
        }
        let lock = acquire_writer_lock(&f.root).unwrap();
        let original_bytes = fs::read(f.store.agent_path()).unwrap();
        let outcome =
            f.store
                .recover_agent_journal(Some(&PendingAgentWrite::Record(&first)), |path| {
                    let memory = Memvid::open(path)?;
                    // The cached SDK view contains both records; model a late TOC
                    // replacement that retains the pending write but loses other data.
                    fs::rename(&alternate, path).unwrap();
                    Ok(memory)
                });
        assert!(
            outcome.is_err(),
            "confirmation must cover the entire recovered inventory"
        );
        assert_eq!(fs::read(f.store.agent_path()).unwrap(), original_bytes);
        assert!(f.store.abandoned_agent_copies(&lock).unwrap().is_empty());
        drop(lock);
        assert_eq!(
            f.store.agent_recall(&f.query(None)).unwrap().results.len(),
            2
        );
    }

    #[test]
    fn concurrent_memory_updates_preserve_one_winner_and_exact_history() {
        let f = Fixture::new();
        let first = f
            .store
            .agent_record(&f.input("Original"), NOW)
            .unwrap()
            .record;
        let barrier = std::sync::Arc::new(std::sync::Barrier::new(4));
        let writers: Vec<_> = (0..4)
            .map(|i| {
                let store = MemoryStore::open_lexical(&f.root).unwrap();
                let id = first.decision.id.clone();
                let input = f.input(&format!("Concurrent correction {i}"));
                let barrier = barrier.clone();
                std::thread::spawn(move || {
                    barrier.wait();
                    // Contending before a mutation is retryable. Leave time for the
                    // winning commit even when other suite workers load the host.
                    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(30);
                    loop {
                        match store.agent_update(&id, 1, &input, "Concurrent verification", NOW + 1)
                        {
                            Err(error)
                                if error.kind() == io::ErrorKind::WouldBlock
                                    && std::time::Instant::now() < deadline =>
                            {
                                std::thread::sleep(std::time::Duration::from_millis(5));
                            }
                            outcome => break outcome,
                        }
                    }
                })
            })
            .collect();
        let mut winners = Vec::new();
        let mut conflicts = 0;
        for writer in writers {
            match writer.join().unwrap() {
                Ok(publication) => winners.push(publication.record),
                Err(error) => {
                    assert_eq!(error.kind(), io::ErrorKind::AlreadyExists);
                    conflicts += 1;
                }
            }
        }
        assert_eq!(winners.len(), 1);
        assert_eq!(conflicts, 3);
        assert_eq!(winners[0].version, 2);
        let mut query = f.query(None);
        query.id = Some(first.decision.id);
        query.include_history = true;
        let history = f.store.agent_recall(&query).unwrap().results;
        assert_eq!(history.len(), 2);
        assert!(history.iter().any(|hit| hit.record == winners[0]));
    }

    #[test]
    #[ignore = "downloads and runs the multilingual E5 model; run explicitly for release validation"]
    fn multilingual_semantic_recall_finds_english_fact_from_russian_query() {
        let mut f = Fixture::new();
        // Records created offline are indexed lazily when semantic recall is enabled.
        let wanted = f
            .store
            .agent_record(
                &f.input("Invalidate the parser cache whenever a source file changes."),
                NOW,
            )
            .unwrap();
        let other = f
            .store
            .agent_record(
                &f.input("The preferred output format is compact JSON."),
                NOW,
            )
            .unwrap();
        f.store.embeddings = true;
        let mut query = f.query(Some("Когда нужно сбрасывать кеш парсера?"));
        query.recall.limit = 1;
        let result = f.store.agent_recall(&query).unwrap();
        assert_eq!(result.search_mode, "hybrid");
        assert_eq!(result.embedding_model, Some(MODEL));
        assert_eq!(
            result.results[0].record.decision.id,
            wanted.record.decision.id
        );
        assert_eq!(f.store.status(NOW).unwrap().decisions, 2);
        let id = &wanted.record.decision.id;
        f.store
            .agent_update(
                id,
                1,
                &f.input("Refresh the parser cache after modifying source files."),
                "clarify wording",
                NOW + 1,
            )
            .unwrap();
        let reopened = MemoryStore::open(&f.root).unwrap();
        assert_eq!(
            reopened.agent_recall(&query).unwrap().results[0]
                .record
                .version,
            2
        );
        assert_eq!(reopened.agent_forget(id, 2).unwrap(), 2);
        query.id = Some(id.clone());
        query.include_history = true;
        assert!(reopened.agent_recall(&query).unwrap().results.is_empty());
        reopened.agent_forget(&other.record.decision.id, 1).unwrap();
        query.id = None;
        query.include_history = false;
        assert!(reopened.agent_recall(&query).unwrap().results.is_empty());
    }
}
