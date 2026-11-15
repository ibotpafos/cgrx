//! Optional, source-bound Swift IndexStore evidence over the existing graph.
//! Nothing is persisted in a HEAD generation: every watched refresh validates
//! the complete module inventory and compiler inputs before reusing USRs.

use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    io::Read,
    path::{Component, Path},
};

use cgrx_core::{ByteRange, ConfidenceClass, EdgeEvidence, Hash32, RelationKind, ResolverClass};
use cgrx_languages::{Span, SwiftCompilerSites, swift_compiler_sites};
use serde::Deserialize;
use serde_json::{Value, json};
use sha2::{Digest, Sha256};

use super::{SourceFingerprint, StoredArc, StoredDocument, StoredIndex, source_fingerprint};

const MAX_BYTES: u64 = 32 * 1024 * 1024;
const DEFINITION: u64 = 1 << 1;
const REFERENCE: u64 = 1 << 2;
const CALL: u64 = 1 << 5;
const DYNAMIC: u64 = 1 << 6;
const IMPLICIT: u64 = 1 << 8;
const CHILD_OF: u64 = 1 << 9;
const CALLED_BY: u64 = 1 << 13;
const ACCESSOR_OF: u64 = 1 << 15;
const CONTAINED_BY: u64 = 1 << 16;

fn fingerprint(path: &Path) -> Option<SourceFingerprint> {
    fs::metadata(path)
        .ok()
        .map(|metadata| source_fingerprint(&metadata))
}

#[derive(Deserialize)]
struct Input {
    schema: u32,
    repo: String,
    toolchain: String,
    configuration: Vec<Value>,
    inventory_roots: Vec<String>,
    sources: BTreeMap<String, String>,
    inputs: BTreeMap<String, String>,
    occurrences: Vec<Occurrence>,
}

#[derive(Deserialize)]
struct Occurrence {
    path: String,
    line: usize,
    column: usize,
    usr: String,
    name: String,
    kind: u32,
    #[serde(default)]
    subkind: u32,
    roles: u64,
    relations: Vec<Related>,
}

#[derive(Deserialize)]
struct Related {
    usr: String,
    roles: u64,
}

#[derive(Default)]
pub(super) struct CompilerCache {
    fingerprint: Option<SourceFingerprint>,
    input: Option<Input>,
    input_hash: Option<Hash32>,
    pub(super) valid_hash: Option<Hash32>,
    verified: BTreeMap<String, (SourceFingerprint, String)>,
    report: Value,
}

impl CompilerCache {
    pub(super) fn status(&self) -> Value {
        if self.report.is_null() {
            json!({"state":"absent"})
        } else {
            self.report.clone()
        }
    }

    pub(super) fn refresh(&mut self, root: &Path, hashes: &BTreeMap<String, Hash32>) -> bool {
        let previous = self.valid_hash;
        let path = root.join(".cgrx/swift-compiler.json");
        let fingerprint = fingerprint(&path);
        if fingerprint != self.fingerprint {
            self.fingerprint = fingerprint;
            self.input = None;
            self.input_hash = None;
            self.verified.clear();
            if let Ok(file) = fs::File::open(&path) {
                let mut bytes = Vec::new();
                if file.take(MAX_BYTES + 1).read_to_end(&mut bytes).is_ok()
                    && bytes.len() as u64 <= MAX_BYTES
                {
                    self.input = serde_json::from_slice(&bytes).ok();
                    self.input_hash = Some(Hash32(*blake3::hash(&bytes).as_bytes()));
                }
            }
        }
        let reason = match self.input.as_ref() {
            Some(input) => validate(root, hashes, input, &mut self.verified).err(),
            None if fingerprint.is_none() => Some("absent"),
            None => Some("invalid_input"),
        };
        self.valid_hash = reason.is_none().then_some(self.input_hash).flatten();
        if let Some(reason) = reason {
            self.report = json!({"state":if reason == "absent" { "absent" } else { "stale_or_invalid" }, "reason":reason});
        } else if self.valid_hash != previous {
            self.report = json!({"state":"current", "input_hash":self.valid_hash, "sources":self.input.as_ref().map(|input| input.sources.len())});
        }
        self.valid_hash != previous
    }

    pub(super) fn apply(&mut self, stored: &mut StoredIndex) {
        let (Some(input), Some(hash)) = (&self.input, self.valid_hash) else {
            return;
        };
        let (arcs, statistics) = rebuild(input, hash, stored);
        stored.arcs.extend(arcs);
        self.report = json!({"state":"current", "input_hash":hash, "toolchain":input.toolchain,
            "sources":input.sources.len(), "occurrences":input.occurrences.len(), "resolution":statistics});
    }
}

fn relative(path: &str) -> bool {
    !path.is_empty()
        && !path.contains(['\\', '\0'])
        && path.split('/').all(|part| !matches!(part, "" | "." | ".."))
        && Path::new(path)
            .components()
            .all(|component| matches!(component, Component::Normal(_)))
}

fn inventory(root: &Path, roots: &[String]) -> Result<BTreeSet<String>, &'static str> {
    let mut pending = roots.iter().map(|path| root.join(path)).collect::<Vec<_>>();
    let mut found = BTreeSet::new();
    let mut count = 0;
    while let Some(path) = pending.pop() {
        if path.is_symlink() {
            return Err("symlink_inventory");
        }
        let entries = fs::read_dir(&path).map_err(|_| "missing_inventory")?;
        for entry in entries {
            let entry = entry.map_err(|_| "unreadable_inventory")?;
            count += 1;
            if count > 20000 {
                return Err("inventory_limit");
            }
            let kind = entry.file_type().map_err(|_| "unreadable_inventory")?;
            if kind.is_symlink() {
                return Err("symlink_inventory");
            }
            if kind.is_dir() {
                if entry.file_name() == ".git" {
                    return Err("nested_repository");
                }
                pending.push(entry.path());
            } else if entry
                .path()
                .extension()
                .is_some_and(|extension| extension == "swift")
            {
                found.insert(
                    entry
                        .path()
                        .strip_prefix(root)
                        .map_err(|_| "external_source")?
                        .to_str()
                        .ok_or("non_utf8_path")?
                        .to_owned(),
                );
            }
        }
    }
    Ok(found)
}

fn verify_file(
    path: &Path,
    expected: &str,
    verified: &mut BTreeMap<String, (SourceFingerprint, String)>,
) -> Result<(), &'static str> {
    if path.canonicalize().ok().as_deref() != Some(path) {
        return Err("changed_input_path");
    }
    let fingerprint = fingerprint(path).ok_or("missing_input")?;
    let key = path.to_str().ok_or("non_utf8_path")?;
    if let Some((saved, hash)) = verified.get(key)
        && *saved == fingerprint
    {
        return if hash == expected {
            Ok(())
        } else {
            Err("changed_input")
        };
    }
    let mut file = fs::File::open(path).map_err(|_| "unreadable_input")?;
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 65536];
    loop {
        let count = file.read(&mut buffer).map_err(|_| "unreadable_input")?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
    }
    if self::fingerprint(path) != Some(fingerprint) {
        return Err("changing_input");
    }
    let hash = format!("{:x}", hasher.finalize());
    let matches = hash == expected;
    verified.insert(key.to_owned(), (fingerprint, hash));
    if matches {
        Ok(())
    } else {
        Err("changed_input")
    }
}

fn validate(
    root: &Path,
    hashes: &BTreeMap<String, Hash32>,
    input: &Input,
    verified: &mut BTreeMap<String, (SourceFingerprint, String)>,
) -> Result<(), &'static str> {
    if input.schema != 1
        || Path::new(&input.repo) != root
        || input.toolchain.is_empty()
        || input.configuration.is_empty()
        || input.inventory_roots.is_empty()
        || input.occurrences.len() > 200000
        || input.sources.len() > 10000
    {
        return Err("invalid_context");
    }
    if !input.inventory_roots.iter().all(|path| relative(path))
        || !input
            .sources
            .keys()
            .all(|path| relative(path) && path.ends_with(".swift"))
    {
        return Err("invalid_source_path");
    }
    let members = inventory(root, &input.inventory_roots)?;
    let indexed = input
        .sources
        .keys()
        .filter(|path| {
            input
                .inventory_roots
                .iter()
                .any(|base| Path::new(path).starts_with(base))
        })
        .cloned()
        .collect();
    if members != indexed {
        return Err("changed_source_membership");
    }
    for (path, source) in &input.sources {
        if members.contains(path)
            && hashes.get(path) != Some(&Hash32(*blake3::hash(source.as_bytes()).as_bytes()))
        {
            return Err("changed_indexed_source");
        }
        verify_file(
            &root.join(path),
            &format!("{:x}", Sha256::digest(source.as_bytes())),
            verified,
        )?;
    }
    for (path, hash) in &input.inputs {
        if !Path::new(path).is_absolute()
            || hash.len() != 64
            || !hash.bytes().all(|byte| byte.is_ascii_hexdigit())
        {
            return Err("invalid_compiler_input");
        }
        verify_file(Path::new(path), hash, verified)?;
    }
    Ok(())
}

struct Sites<'a> {
    source: &'a str,
    starts: Vec<usize>,
    syntax: SwiftCompilerSites,
}

impl Sites<'_> {
    fn offset(&self, occurrence: &Occurrence) -> Option<usize> {
        let start = *self.starts.get(occurrence.line.checked_sub(1)?)?;
        let offset = start.checked_add(occurrence.column.checked_sub(1)?)?;
        if offset
            >= *self
                .starts
                .get(occurrence.line)
                .unwrap_or(&self.source.len())
        {
            return None;
        }
        self.source.is_char_boundary(offset).then_some(offset)
    }

    fn token(&self, occurrence: &Occurrence) -> Option<Span> {
        self.syntax.tokens.get(&self.offset(occurrence)?).copied()
    }
}

fn unique<'a>(
    identities: &BTreeMap<&str, BTreeSet<u64>>,
    documents: &BTreeMap<u64, &'a StoredDocument>,
    usr: &str,
) -> Option<&'a StoredDocument> {
    let ids = identities.get(usr)?;
    (ids.len() == 1).then(|| documents[ids.first().unwrap()])
}

fn rebuild(input: &Input, input_hash: Hash32, stored: &StoredIndex) -> (Vec<StoredArc>, Value) {
    let sites = input
        .sources
        .iter()
        .filter_map(|(path, source)| {
            let mut starts = vec![0];
            starts.extend(
                source
                    .bytes()
                    .enumerate()
                    .filter_map(|(i, byte)| (byte == b'\n').then_some(i + 1)),
            );
            Some((
                path.as_str(),
                Sites {
                    source,
                    starts,
                    syntax: swift_compiler_sites(source.as_bytes())?,
                },
            ))
        })
        .collect::<BTreeMap<_, _>>();
    let documents = stored
        .documents
        .iter()
        .filter(|doc| {
            doc.provenance == "SYNTAX"
                && doc
                    .semantic_tags
                    .iter()
                    .any(|tag| tag == "SWIFT_DECLARATION")
        })
        .map(|doc| (doc.node_id, doc))
        .collect::<BTreeMap<_, _>>();
    let by_span = documents
        .values()
        .map(|doc| {
            (
                (doc.path.as_str(), doc.span_start, doc.span_end),
                doc.node_id,
            )
        })
        .collect::<BTreeMap<_, _>>();
    let mut identities = BTreeMap::<&str, BTreeSet<u64>>::new();
    let mut nominals = BTreeSet::new();
    for occurrence in &input.occurrences {
        if occurrence.roles & DEFINITION == 0
            || occurrence.roles & IMPLICIT != 0
            || occurrence.usr.is_empty()
            || !matches!(occurrence.kind, 5..=24)
        {
            continue;
        }
        let Some(file) = sites.get(occurrence.path.as_str()) else {
            continue;
        };
        let Some(token) = file.token(occurrence) else {
            continue;
        };
        let spelling = file.source[token.start..token.end].trim_matches('`');
        if spelling != occurrence.name.split('(').next().unwrap_or("") {
            continue;
        }
        if let Some(node) = by_span.get(&(occurrence.path.as_str(), token.start, token.end)) {
            identities.entry(&occurrence.usr).or_default().insert(*node);
            if matches!(occurrence.kind, 5..=7) {
                nominals.insert(*node);
            }
        }
    }
    // The compiler locates a synthesized memberwise/default initializer on its
    // nominal declaration and explicitly records CHILD_OF. Model construction
    // as a call to that nominal, rather than inventing a source declaration for
    // an initializer whose spelling does not exist in the file.
    for occurrence in &input.occurrences {
        if occurrence.usr.is_empty()
            || occurrence.kind != 22
            || occurrence.roles & (DEFINITION | IMPLICIT) != (DEFINITION | IMPLICIT)
        {
            continue;
        }
        let Some(file) = sites.get(occurrence.path.as_str()) else {
            continue;
        };
        let Some(offset) = file.offset(occurrence) else {
            continue;
        };
        let targets = occurrence
            .relations
            .iter()
            .filter(|related| related.roles & CHILD_OF != 0)
            .filter_map(|related| unique(&identities, &documents, &related.usr))
            .filter(|nominal| {
                nominals.contains(&nominal.node_id)
                    && nominal.path == occurrence.path
                    && nominal.body_start <= offset
                    && offset < nominal.body_end
            })
            .map(|nominal| nominal.node_id)
            .collect::<BTreeSet<_>>();
        if targets.len() == 1 {
            identities.insert(&occurrence.usr, targets);
        }
    }
    let mut owners = identities.clone();
    // Synthesized accessors may own a computed property's source body. They do
    // not become explicit call targets, nor aliases of other synthetic symbols.
    for occurrence in &input.occurrences {
        if occurrence.usr.is_empty()
            || occurrence.roles & DEFINITION == 0
            || !matches!(occurrence.subkind, 3 | 4)
        {
            continue;
        }
        let Some(file) = sites.get(occurrence.path.as_str()) else {
            continue;
        };
        let Some(offset) = file.offset(occurrence) else {
            continue;
        };
        for relation in &occurrence.relations {
            if relation.roles & ACCESSOR_OF == 0 {
                continue;
            }
            if let Some(owner) = unique(&identities, &documents, &relation.usr)
                && owner.path == occurrence.path
                && owner.body_start <= offset
                && offset < owner.body_end
            {
                owners
                    .entry(&occurrence.usr)
                    .or_default()
                    .insert(owner.node_id);
            }
        }
    }
    // A local binding is not a public graph symbol. Its compiler-recorded
    // parent can own dependencies in its initializer; never resolve the local
    // variable's USR as a target or guess a function from its preceding line.
    for _ in 0..32 {
        let mut changed = false;
        for occurrence in &input.occurrences {
            if occurrence.usr.is_empty()
                || !matches!(occurrence.kind, 13 | 25)
                || occurrence.roles & DEFINITION == 0
                || owners.contains_key(occurrence.usr.as_str())
            {
                continue;
            }
            let Some(file) = sites.get(occurrence.path.as_str()) else {
                continue;
            };
            let Some(token) = file.token(occurrence) else {
                continue;
            };
            let parents = occurrence
                .relations
                .iter()
                .filter(|related| related.roles & CHILD_OF != 0)
                .filter_map(|related| unique(&owners, &documents, &related.usr))
                .filter(|parent| {
                    parent.path == occurrence.path
                        && parent.body_start <= token.start
                        && token.end <= parent.body_end
                })
                .map(|parent| parent.node_id)
                .collect::<BTreeSet<_>>();
            if parents.len() == 1 {
                owners.insert(&occurrence.usr, parents);
                changed = true;
            }
        }
        if !changed {
            break;
        }
    }
    let (mut dynamic, mut missing_target, mut missing_owner, mut calls, mut references) =
        (0_u64, 0_u64, 0_u64, 0_u64, 0_u64);
    let mut arcs = Vec::new();
    for occurrence in &input.occurrences {
        if occurrence.usr.is_empty()
            || occurrence.roles & REFERENCE == 0
            || occurrence.roles & DEFINITION != 0
        {
            continue;
        }
        if occurrence.roles & (DYNAMIC | IMPLICIT) != 0 {
            dynamic += 1;
            continue;
        }
        let is_call = occurrence.roles & CALL != 0;
        if is_call && !matches!(occurrence.kind, 12 | 15..=18 | 22..=24) {
            continue;
        }
        let Some(file) = sites.get(occurrence.path.as_str()) else {
            continue;
        };
        let Some(token) = file.token(occurrence) else {
            continue;
        };
        let Some(target) = unique(&identities, &documents, &occurrence.usr) else {
            missing_target += 1;
            continue;
        };
        let owner_role = if is_call
            && occurrence
                .relations
                .iter()
                .any(|relation| relation.roles & CALLED_BY != 0)
        {
            CALLED_BY
        } else if is_call {
            CONTAINED_BY
        } else {
            CONTAINED_BY | (1 << 14) | (1 << 10)
        };
        let owner_ids = occurrence
            .relations
            .iter()
            .filter(|relation| relation.roles & owner_role != 0)
            .map(|relation| unique(&owners, &documents, &relation.usr).map(|doc| doc.node_id))
            .collect::<Option<BTreeSet<_>>>();
        let Some(owner_ids) = owner_ids else {
            missing_owner += 1;
            continue;
        };
        if owner_ids.len() != 1 {
            missing_owner += 1;
            continue;
        }
        let owner = documents[owner_ids.first().unwrap()];
        let span = if is_call {
            file.syntax
                .calls
                .iter()
                .filter(|(_, callee)| **callee == token)
                .map(|(call, _)| *call)
                .min_by_key(|call| call.end - call.start)
                .unwrap_or(token)
        } else {
            file.syntax
                .types
                .iter()
                .filter(|(_, head)| **head == token)
                .map(|(reference, _)| *reference)
                .min_by_key(|reference| reference.end - reference.start)
                .unwrap_or(token)
        };
        if owner.path != occurrence.path
            || owner.body_start > span.start
            || owner.body_end < span.end
        {
            missing_owner += 1;
            continue;
        }
        let mut nearest = documents
            .values()
            .filter(|doc| {
                doc.path == occurrence.path
                    && doc.body_start <= span.start
                    && span.end <= doc.body_end
            })
            .map(|doc| (doc.body_end - doc.body_start, doc.node_id))
            .collect::<Vec<_>>();
        nearest.sort_unstable();
        if nearest.first().map(|(_, id)| *id) != Some(owner.node_id)
            || nearest
                .get(1)
                .is_some_and(|(length, _)| *length == nearest[0].0)
        {
            missing_owner += 1;
            continue;
        }
        let Some(source_hash) = stored.path_hashes.get(&occurrence.path).copied() else {
            continue;
        };
        let kind = if is_call {
            calls += 1;
            RelationKind::Calls
        } else {
            references += 1;
            RelationKind::References
        };
        arcs.push(StoredArc {
            source: owner.node_id,
            target: target.node_id,
            kind,
            evidence: Some(EdgeEvidence {
                path: occurrence.path.clone(),
                span: ByteRange::new(span.start, span.end),
                source_hash,
                resolver: ResolverClass::CompilerConfirmed,
                confidence: ConfidenceClass::Proven,
                assumptions: vec![input_hash],
                counter_evidence: vec![],
            }),
        });
    }
    (
        arcs,
        json!({"calls":calls, "references":references, "dynamic_or_implicit":dynamic, "external_or_unmapped_targets":missing_target, "unmapped_owners":missing_owner, "recovered_syntax_files":sites.values().filter(|file|file.syntax.recovered).count()}),
    )
}
