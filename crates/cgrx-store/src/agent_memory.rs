//! Typed, versioned agent memory backed by Memvid. Evidence stays separate from assertions.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io;
use std::path::{Component, Path, PathBuf};
use std::sync::{Mutex, OnceLock};

use fastembed::{EmbeddingModel, InitOptions, TextEmbedding};
use memvid_core::{DocMetadata, FrameStatus, Memvid, PutManyOpts, PutOptions};
use serde::{Deserialize, Serialize};

use crate::generation::acquire_writer_lock;
use crate::memory::{
    DEFAULT_PRIVACY_TAG, DecisionRecord, MAX_CONFIDENCE, MAX_FACT_CHARS, MemoryProvenance,
    MemoryRecallQuery, MemoryRecordInput, MemoryStore, fingerprint, invalid_data, invalid_input,
};

const AGENT_SCHEMA: u32 = 2;
// A non-UTF-8 prefix keeps Memvid's document chunker from splitting the
// structured envelope. Only the separately supplied fact is searchable.
const PAYLOAD_MAGIC: &[u8] = b"CGRX-MEMORY\xff\x02";
const MODEL: &str = "intfloat/multilingual-e5-small";
const WORKING_TTL: u64 = 24 * 60 * 60 * 1_000_000_000;
static EMBEDDER: OnceLock<Mutex<Option<TextEmbedding>>> = OnceLock::new();

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
}

#[derive(Clone, Debug)]
pub struct AgentMemoryQuery {
    pub recall: MemoryRecallQuery,
    pub memory_kind: Option<MemoryKind>,
    pub task_id: Option<String>,
    pub include_stale: bool,
    /// Reading by ID includes history only when explicitly requested.
    pub id: Option<String>,
    pub include_history: bool,
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

impl MemoryStore {
    #[must_use]
    pub fn root(&self) -> &Path {
        &self.root
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
        // Model preparation and inference happen before acquiring the repository writer lock.
        let vector = self.vector(&record.decision.fact, false)?;
        let _lock = acquire_writer_lock(&self.root)?;
        let mut memory = self.open_agent_memory()?;
        let versions = read_versions(&mut memory)?;
        if let Some((_, existing)) = latest(&versions).remove(&record.decision.id) {
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
            return Err(io::Error::new(
                io::ErrorKind::AlreadyExists,
                "memory ID already has different content; use memory_update",
            ));
        }
        append(&mut memory, &record, vector)?;
        memory.commit().map_err(memvid_error)?;
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
        let vector = self.vector(&replacement.decision.fact, false)?;
        let _lock = acquire_writer_lock(&self.root)?;
        let mut memory = self.open_agent_memory()?;
        let current = latest(&read_versions(&mut memory)?)
            .remove(id)
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "memory not found"))?
            .1;
        if current.version != expected_version {
            return Err(io::Error::new(
                io::ErrorKind::AlreadyExists,
                "memory version changed; recall it before retrying",
            ));
        }
        replacement.decision.id = id.to_owned();
        replacement.decision.recorded_unix_nanos = current.decision.recorded_unix_nanos;
        replacement.version = current
            .version
            .checked_add(1)
            .ok_or_else(|| invalid_data("memory version exhausted"))?;
        replacement.update_reason = Some(reason.trim().to_owned());
        append(&mut memory, &replacement, vector)?;
        memory.commit().map_err(memvid_error)?;
        Ok(AgentMemoryPublication {
            record: replacement,
            duplicate: false,
        })
    }

    /// Tombstone all versions, including their derived search entries.
    pub fn agent_forget(&self, id: &str, expected_version: u32) -> io::Result<usize> {
        validate_id(id)?;
        let _lock = acquire_writer_lock(&self.root)?;
        let mut memory = self.open_agent_memory()?;
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
        for (frame, record) in versions {
            if record.decision.id == id {
                memory.delete_frame(frame).map_err(memvid_error)?;
                removed += 1;
            }
        }
        memory.commit().map_err(memvid_error)?;
        self.remove_legacy_backup(id)?;
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
        // A fresh repository has nothing to embed. Inspect it before model
        // initialization so the first recall works offline without downloading
        // weights. The empty result belongs to this locked read's snapshot.
        if self.embeddings
            && query.recall.query.is_some()
            && query.id.is_none()
            && self.all_agent_records()?.is_empty()
        {
            return Ok(AgentMemoryRecall {
                results: Vec::new(),
                truncated: false,
                search_mode: "hybrid",
                embedding_model: Some(MODEL),
            });
        }
        let query_vector = match query.recall.query.as_deref() {
            Some(text) if query.id.is_none() => self.vector(text, true)?,
            _ => None,
        };
        // Exact-ID recalls need neither vector backfill nor an exclusive writer.
        // Legacy migration still uses the writer path before reading.
        let read_only =
            query.id.is_some() && self.agent_path().is_file() && self.legacy_records()?.is_empty();
        let _lock = if read_only {
            None
        } else {
            Some(acquire_writer_lock(&self.root)?)
        };
        let mut memory = if read_only {
            Memvid::open_read_only(self.agent_path()).map_err(memvid_error)?
        } else {
            self.open_agent_memory()?
        };
        if !read_only {
            self.ensure_vectors(&mut memory, query_vector.is_some())?;
        }
        let versions = read_versions_filtered(&mut memory, query.id.as_deref())?;
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
        candidates.retain(|(_, record)| {
            let decision = &record.decision;
            !decision.expired(query.recall.now_unix_nanos)
                && decision.confidence >= query.recall.min_confidence
                && query
                    .recall
                    .privacy_tag
                    .as_ref()
                    .is_none_or(|t| t == &decision.privacy_tag)
                && query
                    .recall
                    .revision
                    .as_ref()
                    .is_none_or(|r| r == &decision.provenance.rev)
                && query.memory_kind.is_none_or(|k| k == record.memory_kind)
                && query
                    .task_id
                    .as_ref()
                    .is_none_or(|t| record.task_id.as_ref() == Some(t))
                && query.id.as_ref().is_none_or(|id| id == &decision.id)
        });
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
                .map_err(memvid_error)?
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
                    .map_err(memvid_error)?
                    .into_iter()
                    .filter(|hit| eligible.contains(&hit.frame_id))
                    .enumerate()
                {
                    *scores.entry(hit.frame_id).or_default() += 1.0 / (61 + rank) as f64;
                }
            }
            // Exact source terms and punctuation remain searchable alongside BM25.
            let needle = text.to_lowercase();
            for (frame, record) in &candidates {
                if record.decision.fact.to_lowercase().contains(&needle) {
                    *scores.entry(*frame).or_default() += 1.0 / 61.0;
                }
            }
            candidates.retain(|(frame, _)| scores.contains_key(frame));
        }
        let mut results = Vec::new();
        for (frame, record) in candidates {
            let historical = latest_versions
                .get(&record.decision.id)
                .is_some_and(|(_, current)| current.version != record.version);
            let freshness = if historical {
                MemoryFreshness::Historical
            } else {
                self.freshness(&record)
            };
            if freshness == MemoryFreshness::NeedsReview && !query.include_stale {
                continue;
            }
            results.push(AgentMemoryHit {
                record,
                freshness,
                score: scores.get(&frame).copied().unwrap_or(0.0),
            });
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
        let mut memory = self.open_agent_memory()?;
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
        let mut memory = self.open_agent_memory()?;
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
        for (frame, record) in versions {
            if expired.contains(&record.decision.id) {
                report.bytes_reclaimed +=
                    serde_json::to_vec(&record).map_err(memvid_error)?.len() as u64;
                if !dry_run {
                    memory.delete_frame(frame).map_err(memvid_error)?;
                }
            }
        }
        if !dry_run {
            memory.commit().map_err(memvid_error)?;
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
            Some(source_hash(&self.root, &decision.provenance)?)
        } else {
            if input.source_ref.is_none() {
                return Err(invalid_input("non-code memory requires source_ref"));
            }
            if !decision.provenance.path.is_empty() || decision.provenance.span.is_some() {
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
        })
    }

    fn freshness(&self, record: &AgentMemoryRecord) -> MemoryFreshness {
        match &record.source_hash {
            None => MemoryFreshness::Unverified,
            Some(expected) => match source_hash(&self.root, &record.decision.provenance) {
                Ok(current) if &current == expected => MemoryFreshness::Unchanged,
                _ if record.memory_kind == MemoryKind::Episodic => MemoryFreshness::Historical,
                _ => MemoryFreshness::NeedsReview,
            },
        }
    }

    pub(crate) fn agent_path(&self) -> PathBuf {
        self.root.join(".cgrx/memory/agent.mv2")
    }

    /// Called with the repository writer lock. Committed migration is retry-safe.
    fn open_agent_memory(&self) -> io::Result<Memvid> {
        let path = self.agent_path();
        let mut memory = if path.exists() {
            Memvid::open(&path)
        } else {
            Memvid::create(&path)
        }
        .map_err(memvid_error)?;
        memory.enable_lex().map_err(memvid_error)?;
        if self.embeddings {
            memory.enable_vec().map_err(memvid_error)?;
        }
        let legacy = self.legacy_records()?;
        if !legacy.is_empty() {
            let existing = latest(&read_versions(&mut memory)?);
            memory
                .begin_batch(PutManyOpts::default())
                .map_err(memvid_error)?;
            for (_, record) in &legacy {
                if !existing.contains_key(&record.id) {
                    append(&mut memory, &legacy_record(record.clone()), None)?;
                }
            }
            memory.end_batch().map_err(memvid_error)?;
            memory.commit().map_err(memvid_error)?;
            for (path, _) in legacy {
                fs::rename(&path, path.with_extension("json.migrated"))?;
            }
            fs::File::open(self.root.join(".cgrx/memory/decisions"))?.sync_all()?;
        }
        Ok(memory)
    }

    fn ensure_vectors(&self, memory: &mut Memvid, enabled: bool) -> io::Result<()> {
        if !enabled {
            return Ok(());
        }
        let mut changed = false;
        for (frame, record) in read_versions(memory)? {
            if memory
                .frame_embedding(frame)
                .map_err(memvid_error)?
                .is_none()
            {
                append(memory, &record, self.vector(&record.decision.fact, false)?)?;
                memory.delete_frame(frame).map_err(memvid_error)?;
                changed = true;
            }
        }
        if changed {
            memory.commit().map_err(memvid_error)?;
        }
        Ok(())
    }

    fn vector(&self, text: &str, query: bool) -> io::Result<Option<Vec<f32>>> {
        if !self.embeddings {
            return Ok(None);
        }
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
        let prefix = if query { "query" } else { "passage" };
        let mut vectors = guard
            .as_mut()
            .expect("initialized model")
            .embed(vec![format!("{prefix}: {text}")], Some(1))
            .map_err(memvid_error)?;
        let vector = vectors
            .pop()
            .ok_or_else(|| invalid_data("embedding model returned no vector"))?;
        if vector.len() != 384 || vector.iter().any(|v| !v.is_finite()) {
            return Err(invalid_data("invalid multilingual embedding"));
        }
        Ok(Some(vector))
    }
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
    let envelope = Envelope {
        schema_version: AGENT_SCHEMA,
        content_hash: fingerprint(record)?,
        record: record.clone(),
    };
    let mut bytes = PAYLOAD_MAGIC.to_vec();
    bytes.extend(serde_json::to_vec(&envelope).map_err(memvid_error)?);
    let mut options = PutOptions::builder()
        .uri(format!(
            "cgrx-memory://{}/{}",
            record.decision.id, record.version
        ))
        .search_text(&record.decision.fact)
        .metadata(DocMetadata {
            mime: Some("application/json".to_owned()),
            ..DocMetadata::default()
        })
        .tag("cgrx.memory", "v2")
        .auto_tag(false)
        .extract_dates(false)
        .extract_triplets(false)
        .build();
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
        Some(vector) => memory.put_with_embedding_and_options(&bytes, vector, options),
        None => memory.put_bytes_with_options(&bytes, options),
    }
    .map_err(memvid_error)?;
    Ok(())
}

fn read_versions(memory: &mut Memvid) -> io::Result<Vec<(u64, AgentMemoryRecord)>> {
    read_versions_filtered(memory, None)
}

fn read_versions_filtered(
    memory: &mut Memvid,
    id: Option<&str>,
) -> io::Result<Vec<(u64, AgentMemoryRecord)>> {
    let mut records = Vec::new();
    let prefix = id.map(|id| format!("cgrx-memory://{id}/"));
    for frame_id in 0..memory.frame_count() as u64 {
        let frame = memory.frame_by_id(frame_id).map_err(memvid_error)?;
        if frame.status != FrameStatus::Active {
            continue;
        }
        if prefix.as_ref().is_some_and(|prefix| {
            !frame
                .uri
                .as_deref()
                .is_some_and(|uri| uri.starts_with(prefix))
        }) {
            continue;
        }
        if frame.extra_metadata.get("cgrx.memory").map(String::as_str) != Some("v2") {
            continue;
        }
        let payload = memory
            .frame_canonical_payload(frame_id)
            .map_err(memvid_error)?;
        let envelope: Envelope =
            serde_json::from_slice(payload.strip_prefix(PAYLOAD_MAGIC).unwrap_or(&payload))
                .map_err(memvid_error)?;
        if envelope.schema_version != AGENT_SCHEMA
            || fingerprint(&envelope.record)? != envelope.content_hash
        {
            return Err(invalid_data("invalid agent memory envelope"));
        }
        records.push((frame_id, envelope.record));
    }
    records.sort_by_key(|(frame, _)| *frame);
    Ok(records)
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
    }
}

fn source_hash(root: &Path, provenance: &MemoryProvenance) -> io::Result<String> {
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
    let bytes = fs::read(resolved)?;
    if let Some(span) = &provenance.span {
        let lines = bytes.iter().filter(|b| **b == b'\n').count()
            + usize::from(!bytes.is_empty() && !bytes.ends_with(b"\n"));
        if span.start_line == 0 || span.end_line < span.start_line || span.end_line as usize > lines
        {
            return Err(invalid_input(
                "span must address existing 1-based source lines",
            ));
        }
    }
    Ok(blake3::hash(&bytes).to_hex().to_string())
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
                include_stale: false,
                id: None,
                include_history: false,
            }
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.root);
        }
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
    fn exact_id_recall_remains_readable_during_repository_writer_contention() {
        let f = Fixture::new();
        let id = f
            .store
            .agent_record(&f.input("Stable concurrent recall"), NOW)
            .unwrap()
            .record
            .decision
            .id;
        let mut query = f.query(None);
        query.id = Some(id.clone());
        let held = acquire_writer_lock(&f.root).unwrap();
        let results = std::thread::scope(|scope| {
            let readers = (0..4)
                .map(|_| scope.spawn(|| f.store.agent_recall(&query)))
                .collect::<Vec<_>>();
            readers
                .into_iter()
                .map(|reader| reader.join().unwrap())
                .collect::<Vec<_>>()
        });
        for result in results {
            let hits = result.unwrap().results;
            assert_eq!(hits.len(), 1);
            assert_eq!(hits[0].record.decision.id, id);
        }
        drop(held);
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
