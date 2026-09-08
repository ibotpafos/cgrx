use std::collections::BTreeMap;
use std::fs::{self, File, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use cgrx_core::{Hash32, RepoSnapshot, ResolutionKind, canonical_hash};
use serde::{Deserialize, Serialize};

use crate::generation::acquire_writer_lock;

const OBSERVATION_SCHEMA_VERSION: u32 = 1;
const MAX_BATCH_PROVENANCE: usize = 8;

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ResolvedObservation {
    pub source: u64,
    pub target: u64,
    pub count: u64,
    pub first_seen_unix_nanos: u64,
    pub last_seen_unix_nanos: u64,
    pub source_resolution: ResolutionKind,
    pub target_resolution: ResolutionKind,
    /// Semantic fingerprint for code entity matching across reindexes
    #[serde(default)]
    pub semantic_fingerprint: Option<SemanticFingerprint>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ResolvedBatch {
    pub batch_id: Hash32,
    pub snapshot: RepoSnapshot,
    pub environment: String,
    pub observations: Vec<ResolvedObservation>,
    pub unresolved: u64,
    pub ambiguous: u64,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct StoredObservationEdge {
    pub source: u64,
    pub target: u64,
    pub environment: String,
    pub count: u64,
    pub first_seen_unix_nanos: u64,
    pub last_seen_unix_nanos: u64,
    pub source_resolution: ResolutionKind,
    pub target_resolution: ResolutionKind,
    /// Semantic fingerprint for code entity matching across reindexes
    #[serde(default)]
    pub semantic_fingerprint: Option<SemanticFingerprint>,
    pub batch_ids: Vec<Hash32>,
    pub additional_batches: u64,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ObservationSnapshot {
    pub snapshot: RepoSnapshot,
    pub edges: Vec<StoredObservationEdge>,
    pub batch_ids: Vec<Hash32>,
    pub unresolved: u64,
    pub ambiguous: u64,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
struct SnapshotEnvelope {
    schema_version: u32,
    content_hash: Hash32,
    snapshot: ObservationSnapshot,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct ObservationPublication {
    pub batch_id: Hash32,
    pub duplicate: bool,
    pub edges: usize,
}

#[derive(Clone, Debug, Default, Eq, PartialEq, Serialize)]
pub struct ObservationStatus {
    pub revisions: usize,
    pub batches: usize,
    pub edges: usize,
    pub unresolved: u64,
    pub ambiguous: u64,
    pub bytes: u64,
}

#[derive(Clone, Debug, Default, Eq, PartialEq, Serialize)]
pub struct PruneReport {
    pub removed_batches: usize,
    pub removed_bytes: u64,
    pub dry_run: bool,
}

#[derive(Clone, Debug)]
pub struct ObservationStore {
    root: PathBuf,
    crash_injection: Option<ObservationCrashSite>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ObservationCrashSite {
    BatchFsynced,
    SnapshotFsynced,
    SnapshotRenamed,
}

impl ObservationStore {
    pub fn open(root: impl AsRef<Path>) -> io::Result<Self> {
        let root = root.as_ref().to_path_buf();
        let observations = root.join(".cgrx/observations");
        for child in ["batches", "by-revision", "quarantine"] {
            fs::create_dir_all(observations.join(child))?;
        }
        sync_dir(&observations)?;
        Ok(Self {
            root,
            crash_injection: None,
        })
    }

    #[doc(hidden)]
    pub fn set_crash_injection(&mut self, site: ObservationCrashSite) {
        self.crash_injection = Some(site);
    }

    pub fn publish(&self, batch: &ResolvedBatch) -> io::Result<ObservationPublication> {
        validate_batch(batch)?;
        let _lock = acquire_writer_lock(&self.root)?;
        let existing_snapshot = self.load(&batch.snapshot.repo_revision)?;
        if existing_snapshot
            .as_ref()
            .is_some_and(|snapshot| snapshot.snapshot != batch.snapshot)
        {
            return Err(invalid_data(
                "runtime batch graph snapshot does not match the stored revision snapshot",
            ));
        }
        let batch_path = self.batch_path(batch.batch_id)?;
        let batch_bytes =
            serde_json::to_vec(batch).map_err(|error| invalid_data(error.to_string()))?;
        if batch_path.exists() {
            let existing: ResolvedBatch = serde_json::from_slice(&fs::read(&batch_path)?)
                .map_err(|error| invalid_data(error.to_string()))?;
            if &existing != batch {
                return Err(invalid_data("runtime batch identity collision"));
            }
            let edges = self
                .load(&batch.snapshot.repo_revision)?
                .map_or(0, |snapshot| snapshot.edges.len());
            return Ok(ObservationPublication {
                batch_id: batch.batch_id,
                duplicate: true,
                edges,
            });
        }

        write_atomic_new(&batch_path, &batch_bytes, || {
            self.crash_at(ObservationCrashSite::BatchFsynced);
        })?;
        let mut snapshot = existing_snapshot.unwrap_or_else(|| ObservationSnapshot {
            snapshot: batch.snapshot.clone(),
            edges: Vec::new(),
            batch_ids: Vec::new(),
            unresolved: 0,
            ambiguous: 0,
        });
        merge_batch(&mut snapshot, batch);
        self.publish_snapshot(&snapshot)?;
        Ok(ObservationPublication {
            batch_id: batch.batch_id,
            duplicate: false,
            edges: snapshot.edges.len(),
        })
    }

    pub fn load(&self, revision: &str) -> io::Result<Option<ObservationSnapshot>> {
        let path = self.revision_path(revision)?;
        if !path.exists() {
            return Ok(None);
        }
        let envelope: SnapshotEnvelope = serde_json::from_slice(&fs::read(path)?)
            .map_err(|error| invalid_data(error.to_string()))?;
        if envelope.schema_version != OBSERVATION_SCHEMA_VERSION
            || canonical_hash(&envelope.snapshot)
                .map_err(|error| invalid_data(error.to_string()))?
                != envelope.content_hash
            || envelope.snapshot.snapshot.repo_revision != revision
        {
            return Err(invalid_data("invalid runtime observation snapshot"));
        }
        Ok(Some(envelope.snapshot))
    }

    pub fn status(&self, revision: Option<&str>) -> io::Result<ObservationStatus> {
        let mut status = ObservationStatus::default();
        let directory = self.observations_root().join("by-revision");
        for entry in sorted_files(&directory)? {
            let Some(name) = entry.file_name().and_then(|value| value.to_str()) else {
                continue;
            };
            let Some(found_revision) = name.strip_suffix(".snapshot.json") else {
                continue;
            };
            if revision.is_some_and(|expected| expected != found_revision) {
                continue;
            }
            let Some(snapshot) = self.load(found_revision)? else {
                continue;
            };
            status.revisions += 1;
            status.batches += snapshot.batch_ids.len();
            status.edges += snapshot.edges.len();
            status.unresolved = status.unresolved.saturating_add(snapshot.unresolved);
            status.ambiguous = status.ambiguous.saturating_add(snapshot.ambiguous);
            status.bytes = status.bytes.saturating_add(fs::metadata(entry)?.len());
        }
        Ok(status)
    }

    pub fn prune_before(&self, unix_nanos: u64, dry_run: bool) -> io::Result<PruneReport> {
        let _lock = acquire_writer_lock(&self.root)?;
        let batch_directory = self.observations_root().join("batches");
        let mut retained = Vec::new();
        let mut removed = Vec::new();
        for path in sorted_files(&batch_directory)? {
            let batch: ResolvedBatch = serde_json::from_slice(&fs::read(&path)?)
                .map_err(|error| invalid_data(error.to_string()))?;
            let latest = batch
                .observations
                .iter()
                .map(|observation| observation.last_seen_unix_nanos)
                .max()
                .unwrap_or_default();
            if latest < unix_nanos {
                let bytes = fs::metadata(&path)?.len();
                removed.push((path, bytes));
            } else {
                retained.push(batch);
            }
        }
        let report = PruneReport {
            removed_batches: removed.len(),
            removed_bytes: removed.iter().map(|(_, bytes)| *bytes).sum(),
            dry_run,
        };
        if dry_run || removed.is_empty() {
            return Ok(report);
        }
        for (path, _) in removed {
            fs::remove_file(path)?;
        }
        self.rebuild_revision_snapshots(&retained)?;
        Ok(report)
    }

    fn rebuild_revision_snapshots(&self, batches: &[ResolvedBatch]) -> io::Result<()> {
        let directory = self.observations_root().join("by-revision");
        for path in sorted_files(&directory)? {
            fs::remove_file(path)?;
        }
        let mut snapshots = BTreeMap::<String, ObservationSnapshot>::new();
        for batch in batches {
            let snapshot = snapshots
                .entry(batch.snapshot.repo_revision.clone())
                .or_insert_with(|| ObservationSnapshot {
                    snapshot: batch.snapshot.clone(),
                    edges: Vec::new(),
                    batch_ids: Vec::new(),
                    unresolved: 0,
                    ambiguous: 0,
                });
            if snapshot.snapshot != batch.snapshot {
                return Err(invalid_data("mixed graph snapshots during prune"));
            }
            merge_batch(snapshot, batch);
        }
        for snapshot in snapshots.values() {
            self.publish_snapshot(snapshot)?;
        }
        sync_dir(&directory)
    }

    fn publish_snapshot(&self, snapshot: &ObservationSnapshot) -> io::Result<()> {
        let content_hash =
            canonical_hash(snapshot).map_err(|error| invalid_data(error.to_string()))?;
        let envelope = SnapshotEnvelope {
            schema_version: OBSERVATION_SCHEMA_VERSION,
            content_hash,
            snapshot: snapshot.clone(),
        };
        let bytes =
            serde_json::to_vec(&envelope).map_err(|error| invalid_data(error.to_string()))?;
        write_atomic_replace(
            &self.revision_path(&snapshot.snapshot.repo_revision)?,
            &bytes,
            || self.crash_at(ObservationCrashSite::SnapshotFsynced),
            || self.crash_at(ObservationCrashSite::SnapshotRenamed),
        )
    }

    fn observations_root(&self) -> PathBuf {
        self.root.join(".cgrx/observations")
    }

    fn batch_path(&self, batch_id: Hash32) -> io::Result<PathBuf> {
        Ok(self
            .observations_root()
            .join("batches")
            .join(format!("{}.json", hash_hex(batch_id)?)))
    }

    fn revision_path(&self, revision: &str) -> io::Result<PathBuf> {
        if revision.len() != 40 || !revision.bytes().all(|byte| byte.is_ascii_hexdigit()) {
            return Err(invalid_input(
                "revision must be an exact 40-hex Git object id",
            ));
        }
        Ok(self
            .observations_root()
            .join("by-revision")
            .join(format!("{}.snapshot.json", revision.to_ascii_lowercase())))
    }

    fn crash_at(&self, site: ObservationCrashSite) {
        if self.crash_injection == Some(site) {
            std::process::exit(86);
        }
    }
}

fn merge_batch(snapshot: &mut ObservationSnapshot, batch: &ResolvedBatch) {
    snapshot.batch_ids.push(batch.batch_id);
    snapshot.batch_ids.sort_unstable();
    snapshot.batch_ids.dedup();
    snapshot.unresolved = snapshot.unresolved.saturating_add(batch.unresolved);
    snapshot.ambiguous = snapshot.ambiguous.saturating_add(batch.ambiguous);

    let mut edges = BTreeMap::<(u64, u64, String), StoredObservationEdge>::new();
    for edge in snapshot.edges.drain(..) {
        edges.insert((edge.source, edge.target, edge.environment.clone()), edge);
    }
    for observation in &batch.observations {
        let key = (
            observation.source,
            observation.target,
            batch.environment.clone(),
        );
        let edge = edges.entry(key).or_insert_with(|| StoredObservationEdge {
            source: observation.source,
            target: observation.target,
            environment: batch.environment.clone(),
            count: 0,
            first_seen_unix_nanos: observation.first_seen_unix_nanos,
            last_seen_unix_nanos: observation.last_seen_unix_nanos,
            source_resolution: observation.source_resolution,
            target_resolution: observation.target_resolution,
            semantic_fingerprint: None,
            batch_ids: Vec::new(),
            additional_batches: 0,
        });
        edge.count = edge.count.saturating_add(observation.count);
        edge.first_seen_unix_nanos = edge
            .first_seen_unix_nanos
            .min(observation.first_seen_unix_nanos);
        edge.last_seen_unix_nanos = edge
            .last_seen_unix_nanos
            .max(observation.last_seen_unix_nanos);
        edge.source_resolution = edge.source_resolution.min(observation.source_resolution);
        edge.target_resolution = edge.target_resolution.min(observation.target_resolution);
        if !edge.batch_ids.contains(&batch.batch_id) {
            if edge.batch_ids.len() < MAX_BATCH_PROVENANCE {
                edge.batch_ids.push(batch.batch_id);
                edge.batch_ids.sort_unstable();
            } else {
                edge.additional_batches = edge.additional_batches.saturating_add(1);
            }
        }
    }
    snapshot.edges = edges.into_values().collect();
}

fn validate_batch(batch: &ResolvedBatch) -> io::Result<()> {
    if batch.snapshot.repo_revision.len() != 40
        || !batch
            .snapshot
            .repo_revision
            .bytes()
            .all(|byte| byte.is_ascii_hexdigit())
        || batch.environment.is_empty()
        || batch.environment.len() > 128
        || batch.environment.as_bytes().contains(&0)
    {
        return Err(invalid_input("invalid resolved runtime batch metadata"));
    }
    for observation in &batch.observations {
        if observation.count == 0
            || observation.first_seen_unix_nanos > observation.last_seen_unix_nanos
        {
            return Err(invalid_input("invalid resolved runtime observation"));
        }
    }
    Ok(())
}

fn sorted_files(directory: &Path) -> io::Result<Vec<PathBuf>> {
    let mut paths = fs::read_dir(directory)?
        .map(|entry| entry.map(|value| value.path()))
        .collect::<io::Result<Vec<_>>>()?;
    paths.retain(|path| path.is_file());
    paths.sort();
    Ok(paths)
}

fn write_atomic_new(path: &Path, bytes: &[u8], before_rename: impl FnOnce()) -> io::Result<()> {
    let temporary = temporary_path(path);
    let mut file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&temporary)?;
    file.write_all(bytes)?;
    file.sync_all()?;
    before_rename();
    fs::rename(&temporary, path)?;
    sync_dir(path.parent().expect("observation file has parent"))
}

fn write_atomic_replace(
    path: &Path,
    bytes: &[u8],
    before_rename: impl FnOnce(),
    after_rename: impl FnOnce(),
) -> io::Result<()> {
    let temporary = temporary_path(path);
    if temporary.exists() {
        fs::remove_file(&temporary)?;
    }
    let mut file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&temporary)?;
    file.write_all(bytes)?;
    file.sync_all()?;
    before_rename();
    fs::rename(&temporary, path)?;
    after_rename();
    sync_dir(path.parent().expect("observation snapshot has parent"))
}

fn temporary_path(path: &Path) -> PathBuf {
    path.with_extension(format!("tmp-{}", std::process::id()))
}

fn sync_dir(path: &Path) -> io::Result<()> {
    File::open(path)?.sync_all()
}

fn hash_hex(hash: Hash32) -> io::Result<String> {
    let encoded = serde_json::to_string(&hash).map_err(|error| invalid_data(error.to_string()))?;
    Ok(encoded.trim_matches('"').to_owned())
}

fn invalid_input(detail: impl Into<String>) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidInput, detail.into())
}

fn invalid_data(detail: impl Into<String>) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, detail.into())
}

// Semantic fingerprint for code entities, persisted across reindexes
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct SemanticFingerprint {
    /// Hash of the function/method signature
    pub signature_hash: String,
    /// Hash of the enclosing type/class name
    pub type_hash: String,
    /// Language-specific provenance
    pub provenance: String,
    /// File path and line range context
    pub context: String,
    /// Additional metadata hash
    pub metadata_hash: String,
}
