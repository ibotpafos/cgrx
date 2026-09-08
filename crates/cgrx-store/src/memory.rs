//! Durable decision memory: agent-recorded facts pinned to repository state.
//!
//! A decision record captures `{fact, confidence 0..=1000, provenance, valid_until,
//! privacy_tag}` and persists it under `.cgrx/memory/decisions/<id>.json`, next to
//! the runtime observation store. Record identity is a deterministic content hash,
//! so re-recording the same fact is idempotent. Expired records are excluded from
//! recall and removed by TTL pruning.

use std::fs::{self, File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::generation::acquire_writer_lock;

pub const MEMORY_SCHEMA_VERSION: u32 = 1;
pub const MAX_CONFIDENCE: u16 = 1000;
pub const MAX_FACT_CHARS: usize = 4000;
pub const MAX_PATH_CHARS: usize = 1024;
pub const MAX_REPO_CHARS: usize = 1024;
pub const MAX_REV_CHARS: usize = 256;
pub const MAX_PRIVACY_TAG_CHARS: usize = 64;
pub const DEFAULT_PRIVACY_TAG: &str = "default";

/// Line span inside [`MemoryProvenance::path`]; both bounds are 1-based inclusive.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct MemorySpan {
    pub start_line: u32,
    pub end_line: u32,
}

/// Where a recorded fact was observed.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct MemoryProvenance {
    pub repo: String,
    pub rev: String,
    pub path: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub span: Option<MemorySpan>,
}

/// A single durable decision record.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct DecisionRecord {
    /// Deterministic content identity (32 lowercase hex chars).
    pub id: String,
    pub fact: String,
    /// Caller-assessed confidence, 0..=1000.
    pub confidence: u16,
    pub provenance: MemoryProvenance,
    pub recorded_unix_nanos: u64,
    /// Expiry instant; [`None`] means the fact does not expire.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub valid_until_unix_nanos: Option<u64>,
    pub privacy_tag: String,
}

impl DecisionRecord {
    #[must_use]
    pub fn expired(&self, now_unix_nanos: u64) -> bool {
        self.valid_until_unix_nanos
            .is_some_and(|deadline| deadline <= now_unix_nanos)
    }
}

/// Input for [`MemoryStore::record`]; identity and timestamp are assigned by the store.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct MemoryRecordInput {
    pub fact: String,
    pub confidence: u16,
    pub provenance: MemoryProvenance,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub valid_until_unix_nanos: Option<u64>,
    /// [`None`] normalizes to [`DEFAULT_PRIVACY_TAG`].
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub privacy_tag: Option<String>,
}

/// Bounded, deterministic recall query.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct MemoryRecallQuery {
    /// Case-insensitive substring filter over `fact`; [`None`] matches everything.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub query: Option<String>,
    #[serde(default)]
    pub min_confidence: u16,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub privacy_tag: Option<String>,
    /// Exact match over `provenance.rev`; [`None`] matches all revisions.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub revision: Option<String>,
    pub limit: usize,
    pub now_unix_nanos: u64,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
struct RecordEnvelope {
    schema_version: u32,
    content_hash: String,
    record: DecisionRecord,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct RecordPublication {
    pub id: String,
    pub duplicate: bool,
    pub record: DecisionRecord,
}

#[derive(Clone, Debug, Default, Eq, PartialEq, Serialize)]
pub struct MemoryStatus {
    pub decisions: usize,
    pub expired: usize,
    pub bytes: u64,
}

#[derive(Clone, Debug, Default, Eq, PartialEq, Serialize)]
pub struct MemoryPruneReport {
    pub removed: usize,
    pub retained: usize,
    pub bytes_reclaimed: u64,
    pub dry_run: bool,
}

#[derive(Clone, Debug)]
pub struct MemoryStore {
    root: PathBuf,
}

impl MemoryStore {
    pub fn open(root: impl AsRef<Path>) -> io::Result<Self> {
        let root = root.as_ref().to_path_buf();
        fs::create_dir_all(root.join(".cgrx/memory/decisions"))?;
        sync_dir(&root.join(".cgrx/memory"))?;
        Ok(Self { root })
    }

    /// Persist a decision; identical content replays deterministically as a duplicate.
    pub fn record(
        &self,
        input: &MemoryRecordInput,
        now_unix_nanos: u64,
    ) -> io::Result<RecordPublication> {
        let normalized = normalize_input(input, now_unix_nanos)?;
        let _lock = acquire_writer_lock(&self.root)?;
        let id = record_id(&normalized)?;
        let path = self.decision_path(&id);
        if path.exists() {
            let stored = read_record(&path)?;
            if stored.record
                == normalized_record(&normalized, &id, stored.record.recorded_unix_nanos)
            {
                let record = stored.record;
                return Ok(RecordPublication {
                    id,
                    duplicate: true,
                    record,
                });
            }
            return Err(invalid_data("decision record identity collision"));
        }
        let record = normalized_record(&normalized, &id, now_unix_nanos);
        let envelope = RecordEnvelope {
            schema_version: MEMORY_SCHEMA_VERSION,
            content_hash: fingerprint(&record)?,
            record: record.clone(),
        };
        let bytes =
            serde_json::to_vec(&envelope).map_err(|error| invalid_data(error.to_string()))?;
        write_atomic_new(&path, &bytes)?;
        Ok(RecordPublication {
            id,
            duplicate: false,
            record,
        })
    }

    /// Deterministic recall: non-expired matches ordered by confidence desc, id asc.
    pub fn recall(&self, query: &MemoryRecallQuery) -> io::Result<(Vec<DecisionRecord>, bool)> {
        let needle = query.query.as_deref().map(str::to_lowercase);
        let mut matches = Vec::new();
        for path in sorted_files(&self.decisions_dir())? {
            let envelope = read_record(&path)?;
            let record = envelope.record;
            if record.expired(query.now_unix_nanos) {
                continue;
            }
            if record.confidence < query.min_confidence {
                continue;
            }
            if query
                .privacy_tag
                .as_ref()
                .is_some_and(|tag| tag != &record.privacy_tag)
            {
                continue;
            }
            if query
                .revision
                .as_ref()
                .is_some_and(|rev| rev != &record.provenance.rev)
            {
                continue;
            }
            if needle
                .as_ref()
                .is_some_and(|needle| !record.fact.to_lowercase().contains(needle.as_str()))
            {
                continue;
            }
            matches.push(record);
        }
        matches.sort_by(|left, right| {
            right
                .confidence
                .cmp(&left.confidence)
                .then_with(|| left.id.cmp(&right.id))
        });
        let truncated = matches.len() > query.limit;
        matches.truncate(query.limit);
        Ok((matches, truncated))
    }

    pub fn status(&self, now_unix_nanos: u64) -> io::Result<MemoryStatus> {
        let mut status = MemoryStatus::default();
        for path in sorted_files(&self.decisions_dir())? {
            let record = read_record(&path)?.record;
            status.decisions += 1;
            if record.expired(now_unix_nanos) {
                status.expired += 1;
            }
            status.bytes = status.bytes.saturating_add(fs::metadata(&path)?.len());
        }
        Ok(status)
    }

    /// Remove records expired at `now_unix_nanos`.
    pub fn prune_expired(
        &self,
        now_unix_nanos: u64,
        dry_run: bool,
    ) -> io::Result<MemoryPruneReport> {
        let _lock = acquire_writer_lock(&self.root)?;
        let mut report = MemoryPruneReport {
            dry_run,
            ..MemoryPruneReport::default()
        };
        for path in sorted_files(&self.decisions_dir())? {
            let record = read_record(&path)?.record;
            if !record.expired(now_unix_nanos) {
                report.retained += 1;
                continue;
            }
            report.removed += 1;
            report.bytes_reclaimed = report
                .bytes_reclaimed
                .saturating_add(fs::metadata(&path)?.len());
            if !dry_run {
                fs::remove_file(&path)?;
            }
        }
        if !dry_run {
            sync_dir(&self.decisions_dir())?;
        }
        Ok(report)
    }

    fn decisions_dir(&self) -> PathBuf {
        self.root.join(".cgrx/memory/decisions")
    }

    fn decision_path(&self, id: &str) -> PathBuf {
        self.decisions_dir().join(format!("{id}.json"))
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
struct NormalizedInput {
    fact: String,
    confidence: u16,
    provenance: MemoryProvenance,
    valid_until_unix_nanos: Option<u64>,
    privacy_tag: String,
}

fn normalize_input(input: &MemoryRecordInput, now_unix_nanos: u64) -> io::Result<NormalizedInput> {
    let fact = input.fact.trim().to_owned();
    if fact.is_empty() || fact.chars().count() > MAX_FACT_CHARS {
        return Err(invalid_input("fact must be 1..4000 characters"));
    }
    if input.confidence > MAX_CONFIDENCE {
        return Err(invalid_input("confidence must be 0..1000"));
    }
    validate_provenance(&input.provenance)?;
    if input
        .valid_until_unix_nanos
        .is_some_and(|deadline| deadline <= now_unix_nanos)
    {
        return Err(invalid_input(
            "valid_until_unix_nanos must be in the future",
        ));
    }
    let privacy_tag = input
        .privacy_tag
        .clone()
        .unwrap_or_else(|| DEFAULT_PRIVACY_TAG.to_owned());
    if privacy_tag.is_empty()
        || privacy_tag.chars().count() > MAX_PRIVACY_TAG_CHARS
        || privacy_tag.bytes().any(|byte| byte.is_ascii_control())
    {
        return Err(invalid_input(
            "privacy_tag must be 1..64 printable characters",
        ));
    }
    Ok(NormalizedInput {
        fact,
        confidence: input.confidence,
        provenance: input.provenance.clone(),
        valid_until_unix_nanos: input.valid_until_unix_nanos,
        privacy_tag,
    })
}

fn validate_provenance(provenance: &MemoryProvenance) -> io::Result<()> {
    if provenance.repo.is_empty() || provenance.repo.chars().count() > MAX_REPO_CHARS {
        return Err(invalid_input("provenance.repo must be 1..1024 characters"));
    }
    if provenance.rev.is_empty() || provenance.rev.chars().count() > MAX_REV_CHARS {
        return Err(invalid_input("provenance.rev must be 1..256 characters"));
    }
    if provenance.path.is_empty()
        || provenance.path.chars().count() > MAX_PATH_CHARS
        || provenance.path.bytes().any(|byte| byte == 0)
    {
        return Err(invalid_input("provenance.path must be 1..1024 characters"));
    }
    if provenance
        .span
        .as_ref()
        .is_some_and(|span| span.start_line == 0 || span.end_line < span.start_line)
    {
        return Err(invalid_input(
            "provenance.span requires 1-based start_line <= end_line",
        ));
    }
    Ok(())
}

fn normalized_record(normalized: &NormalizedInput, id: &str, recorded: u64) -> DecisionRecord {
    DecisionRecord {
        id: id.to_owned(),
        fact: normalized.fact.clone(),
        confidence: normalized.confidence,
        provenance: normalized.provenance.clone(),
        recorded_unix_nanos: recorded,
        valid_until_unix_nanos: normalized.valid_until_unix_nanos,
        privacy_tag: normalized.privacy_tag.clone(),
    }
}

/// Deterministic content identity over everything except the record timestamp.
fn record_id(normalized: &NormalizedInput) -> io::Result<String> {
    fingerprint(normalized)
}

/// blake3 over JSON bytes. `canonical_hash` is unsuitable here: it rejects
/// absolute paths, while provenance repos are absolute worktree roots.
fn fingerprint(value: &impl Serialize) -> io::Result<String> {
    let bytes = serde_json::to_vec(value).map_err(|error| invalid_data(error.to_string()))?;
    Ok(blake3::hash(&bytes).to_hex().to_string()[..32].to_owned())
}

fn read_record(path: &Path) -> io::Result<RecordEnvelope> {
    let envelope: RecordEnvelope = serde_json::from_slice(&fs::read(path)?)
        .map_err(|error| invalid_data(error.to_string()))?;
    if envelope.schema_version != MEMORY_SCHEMA_VERSION
        || fingerprint(&envelope.record)? != envelope.content_hash
    {
        return Err(invalid_data("invalid decision record envelope"));
    }
    Ok(envelope)
}

fn sorted_files(directory: &Path) -> io::Result<Vec<PathBuf>> {
    if !directory.exists() {
        return Ok(Vec::new());
    }
    let mut paths = fs::read_dir(directory)?
        .map(|entry| entry.map(|value| value.path()))
        .collect::<io::Result<Vec<_>>>()?;
    paths.retain(|path| path.is_file() && path.extension().is_some_and(|ext| ext == "json"));
    paths.sort();
    Ok(paths)
}

fn write_atomic_new(path: &Path, bytes: &[u8]) -> io::Result<()> {
    let temporary = path.with_extension(format!("tmp-{}", std::process::id()));
    let mut file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&temporary)?;
    file.write_all(bytes)?;
    file.sync_all()?;
    fs::rename(&temporary, path)?;
    sync_dir(path.parent().expect("decision file has parent"))
}

fn sync_dir(path: &Path) -> io::Result<()> {
    File::open(path)?.sync_all()
}

fn invalid_input(detail: impl Into<String>) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidInput, detail.into())
}

fn invalid_data(detail: impl Into<String>) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, detail.into())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn input(fact: &str) -> MemoryRecordInput {
        MemoryRecordInput {
            fact: fact.to_owned(),
            confidence: 800,
            provenance: MemoryProvenance {
                repo: "/repo".to_owned(),
                rev: "abc".to_owned(),
                path: "src/lib.rs".to_owned(),
                span: Some(MemorySpan {
                    start_line: 10,
                    end_line: 20,
                }),
            },
            valid_until_unix_nanos: None,
            privacy_tag: None,
        }
    }

    fn store() -> (MemoryStore, PathBuf) {
        static SEQ: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
        let seq = SEQ.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let dir = std::env::temp_dir().join(format!(
            "cgrx-memory-{}-{}-{seq}",
            std::process::id(),
            now_nanos()
        ));
        let store = MemoryStore::open(&dir).expect("open memory store");
        (store, dir)
    }

    fn now_nanos() -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("clock after epoch")
            .as_nanos() as u64
    }

    fn cleanup(dir: &Path) {
        let _ = fs::remove_dir_all(dir);
    }

    #[test]
    fn record_roundtrip_applies_default_privacy_tag() {
        let (store, dir) = store();
        let now = now_nanos();
        let publication = store.record(&input("use cache here"), now).expect("record");
        assert!(!publication.duplicate);
        assert_eq!(publication.id.len(), 32);
        let (hits, truncated) = store
            .recall(&MemoryRecallQuery {
                query: None,
                min_confidence: 0,
                privacy_tag: None,
                revision: None,
                limit: 10,
                now_unix_nanos: now,
            })
            .expect("recall");
        assert!(!truncated);
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].privacy_tag, "default");
        assert_eq!(hits[0].recorded_unix_nanos, now);
        cleanup(&dir);
    }

    #[test]
    fn identical_content_replays_as_duplicate() {
        let (store, dir) = store();
        let now = now_nanos();
        let first = store.record(&input("same fact"), now).expect("record");
        let second = store.record(&input("same fact"), now + 1).expect("record");
        assert_eq!(first.id, second.id);
        assert!(second.duplicate);
        cleanup(&dir);
    }

    #[test]
    fn confidence_bounds_are_rejected() {
        let (store, dir) = store();
        let mut bad = input("overconfident");
        bad.confidence = 1001;
        assert!(store.record(&bad, now_nanos()).is_err());
        cleanup(&dir);
    }

    #[test]
    fn empty_fact_and_past_deadline_are_rejected() {
        let (store, dir) = store();
        let now = now_nanos();
        let bad = input("   ");
        assert!(store.record(&bad, now).is_err());
        let mut stale = input("stale");
        stale.valid_until_unix_nanos = Some(now);
        assert!(store.record(&stale, now).is_err());
        cleanup(&dir);
    }

    #[test]
    fn recall_orders_by_confidence_then_id_and_bounds_limit() {
        let (store, dir) = store();
        let now = now_nanos();
        for (fact, confidence) in [("low", 100), ("high", 900), ("mid", 500)] {
            let mut entry = input(fact);
            entry.confidence = confidence;
            store.record(&entry, now).expect("record");
        }
        let (hits, truncated) = store
            .recall(&MemoryRecallQuery {
                query: None,
                min_confidence: 0,
                privacy_tag: None,
                revision: None,
                limit: 2,
                now_unix_nanos: now,
            })
            .expect("recall");
        assert!(truncated);
        assert_eq!(hits.len(), 2);
        assert_eq!(hits[0].fact, "high");
        assert_eq!(hits[1].fact, "mid");
        let (filtered, _) = store
            .recall(&MemoryRecallQuery {
                query: Some("HIGH".to_owned()),
                min_confidence: 900,
                privacy_tag: Some("default".to_owned()),
                revision: Some("abc".to_owned()),
                limit: 10,
                now_unix_nanos: now,
            })
            .expect("recall");
        assert_eq!(filtered.len(), 1);
        assert_eq!(filtered[0].fact, "high");
        cleanup(&dir);
    }

    #[test]
    fn expired_records_are_hidden_and_pruned() {
        let (store, dir) = store();
        let now = now_nanos();
        let mut short = input("short-lived");
        short.valid_until_unix_nanos = Some(now + 1_000);
        store.record(&short, now).expect("record");
        let mut eternal = input("eternal");
        eternal.valid_until_unix_nanos = None;
        store.record(&eternal, now).expect("record");

        let (visible, _) = store
            .recall(&MemoryRecallQuery {
                query: None,
                min_confidence: 0,
                privacy_tag: None,
                revision: None,
                limit: 10,
                now_unix_nanos: now,
            })
            .expect("recall");
        assert_eq!(visible.len(), 2);

        let later = now + 2_000;
        let (hidden, _) = store
            .recall(&MemoryRecallQuery {
                query: None,
                min_confidence: 0,
                privacy_tag: None,
                revision: None,
                limit: 10,
                now_unix_nanos: later,
            })
            .expect("recall");
        assert_eq!(hidden.len(), 1);

        let dry = store.prune_expired(later, true).expect("dry prune");
        assert_eq!(dry.removed, 1);
        assert_eq!(dry.retained, 1);
        assert!(dry.dry_run);
        let report = store.prune_expired(later, false).expect("prune");
        assert_eq!(report.removed, 1);
        assert!(report.bytes_reclaimed > 0);
        let status = store.status(later).expect("status");
        assert_eq!(status.decisions, 1);
        assert_eq!(status.expired, 0);
        cleanup(&dir);
    }

    #[test]
    fn tampered_record_is_rejected_on_read() {
        let (store, dir) = store();
        let now = now_nanos();
        let publication = store.record(&input("honest"), now).expect("record");
        let path = dir
            .join(".cgrx/memory/decisions")
            .join(format!("{}.json", publication.id));
        let mut envelope: RecordEnvelope =
            serde_json::from_slice(&fs::read(&path).expect("read")).expect("parse");
        envelope.record.fact = "dishonest".to_owned();
        fs::write(&path, serde_json::to_vec(&envelope).expect("serialize")).expect("tamper");
        assert!(store.status(now).is_err());
        cleanup(&dir);
    }
}
