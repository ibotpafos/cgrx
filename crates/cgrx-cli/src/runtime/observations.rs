use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Component, Path};

use cgrx_core::{
    EvidenceSelector, MAX_TRACE_BYTES, MAX_TRACE_SPANS, NormalizedBatch, NormalizedObservation,
    ObservationGap, RUNTIME_EVIDENCE_SCHEMA, ResolutionKind, RuntimeEndpoint, Scope,
};
use cgrx_store::{ObservationStatus, ObservationStore, ResolvedBatch, ResolvedObservation};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use super::{Runtime, RuntimeError, ScopedQuery, StoredDocument, path_in_scope};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RuntimeEvidenceFormat {
    Auto,
    Ndjson,
    OtlpJson,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct ImportRuntimeEvidenceReport {
    pub accepted: usize,
    pub ambiguous: u64,
    pub unresolved: u64,
    pub duplicate: bool,
    pub edges: usize,
    pub warnings: Vec<String>,
    pub gaps: Vec<ObservationGap>,
}

#[derive(Deserialize)]
struct NdjsonObservation {
    schema: String,
    repo_revision: String,
    environment: String,
    observed_at_unix_nanos: U64Value,
    #[serde(default = "one")]
    count: u64,
    caller: RuntimeEndpoint,
    callee: RuntimeEndpoint,
}

#[derive(Deserialize)]
#[serde(untagged)]
enum U64Value {
    Number(u64),
    String(String),
}

impl U64Value {
    fn parse(self) -> Result<u64, RuntimeError> {
        match self {
            Self::Number(value) => Ok(value),
            Self::String(value) => value.parse().map_err(|_| {
                RuntimeError::new(
                    "cgrx.invalid_runtime_evidence",
                    "invalid nanosecond timestamp",
                )
            }),
        }
    }
}

const fn one() -> u64 {
    1
}

impl Runtime {
    pub fn import_runtime_evidence(
        &self,
        root: &Path,
        input: &[u8],
        format: RuntimeEvidenceFormat,
        revision_override: Option<&str>,
        environment_override: Option<&str>,
    ) -> Result<ImportRuntimeEvidenceReport, RuntimeError> {
        if input.len() > MAX_TRACE_BYTES {
            return Err(RuntimeError::new(
                "cgrx.runtime_evidence_too_large",
                format!("runtime evidence exceeds {MAX_TRACE_BYTES} bytes"),
            ));
        }
        let format = match format {
            RuntimeEvidenceFormat::Auto if looks_like_otlp(input) => {
                RuntimeEvidenceFormat::OtlpJson
            }
            RuntimeEvidenceFormat::Auto => RuntimeEvidenceFormat::Ndjson,
            value => value,
        };
        let (normalized, warnings) = match format {
            RuntimeEvidenceFormat::Ndjson => (
                parse_ndjson(input, revision_override, environment_override)?,
                Vec::new(),
            ),
            RuntimeEvidenceFormat::OtlpJson => {
                parse_otlp(input, revision_override, environment_override)?
            }
            RuntimeEvidenceFormat::Auto => unreachable!(),
        };
        if normalized.repo_revision != self.stored.snapshot.repo_revision {
            return Err(RuntimeError::new(
                "cgrx.runtime_revision_mismatch",
                format!(
                    "runtime revision {} does not match graph revision {}",
                    normalized.repo_revision, self.stored.snapshot.repo_revision
                ),
            ));
        }

        let canonical_root = root
            .canonicalize()
            .map_err(|error| RuntimeError::new("cgrx.repository_open", error.to_string()))?;
        let mut resolved = Vec::new();
        let mut ambiguous = 0_u64;
        let mut unresolved = 0_u64;
        let mut gaps = Vec::new();
        for observation in &normalized.observations {
            let source = self.resolve_runtime_endpoint(&canonical_root, &observation.caller)?;
            let target = self.resolve_runtime_endpoint(&canonical_root, &observation.callee)?;
            match (source, target) {
                (
                    Resolution::Unique(source, source_resolution),
                    Resolution::Unique(target, target_resolution),
                ) => {
                    resolved.push(ResolvedObservation {
                        source,
                        target,
                        count: observation.count,
                        first_seen_unix_nanos: observation.first_seen_unix_nanos,
                        last_seen_unix_nanos: observation.last_seen_unix_nanos,
                        source_resolution,
                        target_resolution,
                    });
                }
                (Resolution::Ambiguous, _) => {
                    ambiguous += 1;
                    gaps.push(runtime_gap("runtime_ambiguous", &observation.caller));
                }
                (_, Resolution::Ambiguous) => {
                    ambiguous += 1;
                    gaps.push(runtime_gap("runtime_ambiguous", &observation.callee));
                }
                (Resolution::Missing, _) => {
                    unresolved += 1;
                    gaps.push(runtime_gap("runtime_unresolved", &observation.caller));
                }
                (_, Resolution::Missing) => {
                    unresolved += 1;
                    gaps.push(runtime_gap("runtime_unresolved", &observation.callee));
                }
            }
        }
        let repository_id = blake3::hash(canonical_root.as_os_str().as_encoded_bytes())
            .to_hex()
            .to_string();
        let batch_id = normalized.canonical_id(&repository_id).map_err(|error| {
            RuntimeError::new("cgrx.invalid_runtime_evidence", error.to_string())
        })?;
        let batch = ResolvedBatch {
            batch_id,
            snapshot: self.stored.snapshot.clone(),
            environment: normalized.environment,
            observations: resolved,
            unresolved,
            ambiguous,
        };
        let publication = ObservationStore::open(&self.state_root)
            .and_then(|store| store.publish(&batch))
            .map_err(|error| RuntimeError::new("cgrx.runtime_evidence_store", error.to_string()))?;
        Ok(ImportRuntimeEvidenceReport {
            accepted: batch.observations.len(),
            ambiguous,
            unresolved,
            duplicate: publication.duplicate,
            edges: publication.edges,
            warnings,
            gaps,
        })
    }

    pub fn runtime_evidence_status(&self) -> Result<ObservationStatus, RuntimeError> {
        ObservationStore::open(&self.state_root)
            .and_then(|store| store.status(Some(&self.stored.snapshot.repo_revision)))
            .map_err(|error| RuntimeError::new("cgrx.runtime_evidence_store", error.to_string()))
    }

    pub fn find_usages_with_evidence(
        &self,
        symbol: &str,
        path: Option<&str>,
        scope: &Scope,
        depth: u8,
        limit: usize,
        evidence: EvidenceSelector,
    ) -> Result<Value, RuntimeError> {
        self.trace_path_with_evidence(
            symbol,
            path,
            "callers",
            depth,
            scope,
            limit.min(50),
            evidence,
        )
    }

    #[allow(clippy::too_many_arguments)]
    pub fn trace_path_with_evidence(
        &self,
        symbol: &str,
        path: Option<&str>,
        direction: &str,
        depth: u8,
        scope: &Scope,
        limit: usize,
        evidence: EvidenceSelector,
    ) -> Result<Value, RuntimeError> {
        if evidence == EvidenceSelector::Static {
            return self.trace_path(symbol, path, direction, depth, scope, limit);
        }
        if symbol.trim().is_empty()
            || !matches!(direction, "callers" | "callees" | "both")
            || !(1..=4).contains(&depth)
            || !(1..=50).contains(&limit)
        {
            return Err(RuntimeError::new(
                "cgrx.invalid_arguments",
                "symbol, direction, depth 1..4, and limit 1..50 are required",
            ));
        }
        let mut scoped = ScopedQuery::new(&self.stored, scope, path_in_scope);
        let by_id: BTreeMap<_, _> = self
            .stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX" && scoped.contains_path(&document.path)
            })
            .map(|document| (document.node_id, document))
            .collect();
        let root = unique_root(by_id.values().copied(), symbol, path)?;
        let observed = ObservationStore::open(&self.state_root)
            .and_then(|store| store.load(&self.stored.snapshot.repo_revision))
            .map_err(|error| RuntimeError::new("cgrx.runtime_evidence_store", error.to_string()))?;

        let mut edges = BTreeMap::<(u64, u64), EdgeMetadata>::new();
        if evidence == EvidenceSelector::All {
            for arc in scoped.definitive_arcs(&self.stored) {
                edges
                    .entry((arc.source, arc.target))
                    .or_default()
                    .static_edge = true;
            }
        }
        if let Some(snapshot) = observed {
            for edge in snapshot.edges {
                if by_id.contains_key(&edge.source) && by_id.contains_key(&edge.target) {
                    edges.entry((edge.source, edge.target)).or_default().count = edges
                        .get(&(edge.source, edge.target))
                        .map_or(edge.count, |current| {
                            current.count.saturating_add(edge.count)
                        });
                }
            }
        }
        let mut adjacency = BTreeMap::<u64, Vec<(u64, &'static str, EdgeMetadata)>>::new();
        for ((source, target), metadata) in edges {
            if matches!(direction, "callees" | "both") {
                adjacency
                    .entry(source)
                    .or_default()
                    .push((target, "callees", metadata));
            }
            if matches!(direction, "callers" | "both") {
                adjacency
                    .entry(target)
                    .or_default()
                    .push((source, "callers", metadata));
            }
        }
        for neighbors in adjacency.values_mut() {
            neighbors.sort_by_key(|(node, edge_direction, _)| {
                let document = by_id[node];
                (&document.path, document.span_start, *edge_direction, *node)
            });
        }
        let mut visited = BTreeSet::from([root.node_id]);
        let mut frontier = vec![root.node_id];
        let mut traced = Vec::new();
        for hop in 1..=depth {
            let mut next = Vec::new();
            for source in &frontier {
                for (target, edge_direction, metadata) in
                    adjacency.get(source).into_iter().flatten()
                {
                    if visited.insert(*target) {
                        traced.push((*target, hop, *edge_direction, *metadata));
                        next.push(*target);
                    }
                }
            }
            if next.is_empty() {
                break;
            }
            frontier = next;
        }
        traced.sort_by_key(|(node, hop, edge_direction, _)| {
            let document = by_id[node];
            (
                *hop,
                &document.path,
                document.span_start,
                *edge_direction,
                *node,
            )
        });
        let total = traced.len();
        let nodes = traced
            .into_iter()
            .take(limit)
            .map(|(node, hop, edge_direction, metadata)| {
                let document = by_id[&node];
                json!({
                    "node_id":node,
                    "symbol":document.qualified_name,
                    "path":document.path,
                    "span":{"start":document.span_start,"end":document.span_end},
                    "hop":hop,
                    "direction":edge_direction,
                    "evidence":metadata.label(),
                    "count":metadata.count,
                })
            })
            .collect::<Vec<_>>();
        Ok(json!({
            "snapshot":self.stored.snapshot,
            "root":{"node_id":root.node_id,"symbol":root.qualified_name,"path":root.path,"span":{"start":root.span_start,"end":root.span_end}},
            "direction":direction,
            "depth":depth,
            "evidence":evidence,
            "nodes":nodes,
            "total":total,
            "truncated":total > limit,
        }))
    }

    fn resolve_runtime_endpoint(
        &self,
        root: &Path,
        endpoint: &RuntimeEndpoint,
    ) -> Result<Resolution, RuntimeError> {
        let path = endpoint
            .file
            .as_deref()
            .map(normalize_runtime_path)
            .transpose()?;
        let syntax = self
            .stored
            .documents
            .iter()
            .filter(|document| document.provenance == "SYNTAX");
        if let (Some(path), Some(line)) = (path.as_deref(), endpoint.line) {
            let source = fs::read(root.join(path))
                .map_err(|error| RuntimeError::new("cgrx.runtime_source", error.to_string()))?;
            let actual_hash = cgrx_core::Hash32(*blake3::hash(&source).as_bytes());
            if self.stored.path_hashes.get(path) != Some(&actual_hash) {
                return Err(RuntimeError::new(
                    "cgrx.runtime_source_stale",
                    format!("runtime path {path} does not match the active graph generation"),
                ));
            }
            let offset = line_offset(&source, line).ok_or_else(|| {
                RuntimeError::new(
                    "cgrx.invalid_runtime_evidence",
                    format!("line {line} is outside {path}"),
                )
            })?;
            let candidates = syntax
                .clone()
                .filter(|document| {
                    document.path == path
                        && document.span_start <= offset
                        && offset < document.span_end
                })
                .collect::<Vec<_>>();
            if let Some(result) = classify_candidates(candidates, ResolutionKind::PathLine) {
                return Ok(result);
            }
        }
        if let Some(path) = path.as_deref() {
            let candidates = syntax
                .clone()
                .filter(|document| {
                    document.path == path && document.qualified_name == endpoint.function
                })
                .collect::<Vec<_>>();
            if let Some(result) = classify_candidates(candidates, ResolutionKind::PathFqn) {
                return Ok(result);
            }
        }
        let candidates = syntax
            .clone()
            .filter(|document| document.qualified_name == endpoint.function)
            .collect::<Vec<_>>();
        if let Some(result) = classify_candidates(candidates, ResolutionKind::Fqn) {
            return Ok(result);
        }
        if let Some(path) = path.as_deref() {
            let name = terminal_name(&endpoint.function);
            let candidates = syntax
                .clone()
                .filter(|document| {
                    document.path == path && terminal_name(&document.qualified_name) == name
                })
                .collect::<Vec<_>>();
            if let Some(result) = classify_candidates(candidates, ResolutionKind::PathName) {
                return Ok(result);
            }
        }
        let name = terminal_name(&endpoint.function);
        let candidates = syntax
            .filter(|document| terminal_name(&document.qualified_name) == name)
            .collect::<Vec<_>>();
        Ok(classify_candidates(candidates, ResolutionKind::UniqueName)
            .unwrap_or(Resolution::Missing))
    }
}

#[derive(Clone, Copy, Default)]
struct EdgeMetadata {
    static_edge: bool,
    count: u64,
}

impl EdgeMetadata {
    fn label(self) -> &'static str {
        match (self.static_edge, self.count > 0) {
            (true, true) => "static+observed",
            (true, false) => "static",
            (false, true) => "observed",
            (false, false) => "unknown",
        }
    }
}

enum Resolution {
    Unique(u64, ResolutionKind),
    Ambiguous,
    Missing,
}

fn classify_candidates(
    candidates: Vec<&StoredDocument>,
    kind: ResolutionKind,
) -> Option<Resolution> {
    match candidates.as_slice() {
        [] => None,
        [document] => Some(Resolution::Unique(document.node_id, kind)),
        _ => Some(Resolution::Ambiguous),
    }
}

fn runtime_gap(code: &str, endpoint: &RuntimeEndpoint) -> ObservationGap {
    ObservationGap {
        code: code.to_owned(),
        endpoint: endpoint.clone(),
        candidates: Vec::new(),
    }
}

fn unique_root<'a>(
    documents: impl Iterator<Item = &'a StoredDocument>,
    symbol: &str,
    path: Option<&str>,
) -> Result<&'a StoredDocument, RuntimeError> {
    let mut candidates = documents
        .filter(|document| {
            path.is_none_or(|path| document.path == path)
                && document.qualified_name.eq_ignore_ascii_case(symbol)
        })
        .collect::<Vec<_>>();
    candidates.sort_by_key(|document| (&document.path, document.span_start, document.node_id));
    match candidates.as_slice() {
        [] => Err(RuntimeError::new(
            "cgrx.symbol_not_found",
            format!("symbol {symbol} was not found in scope"),
        )),
        [document] => Ok(*document),
        _ => Err(RuntimeError::new(
            "cgrx.ambiguous_symbol",
            format!("symbol {symbol} is ambiguous; pass path"),
        )),
    }
}

fn parse_ndjson(
    input: &[u8],
    revision_override: Option<&str>,
    environment_override: Option<&str>,
) -> Result<NormalizedBatch, RuntimeError> {
    let text = std::str::from_utf8(input)
        .map_err(|error| RuntimeError::new("cgrx.invalid_runtime_evidence", error.to_string()))?;
    let mut revision = revision_override.map(str::to_owned);
    let mut environment = environment_override.map(str::to_owned);
    let mut observations = Vec::new();
    for (index, line) in text.lines().enumerate() {
        if line.trim().is_empty() {
            continue;
        }
        let row: NdjsonObservation = serde_json::from_str(line).map_err(|error| {
            RuntimeError::new(
                "cgrx.invalid_runtime_evidence",
                format!("line {}: {error}", index + 1),
            )
        })?;
        if row.schema != RUNTIME_EVIDENCE_SCHEMA {
            return Err(RuntimeError::new(
                "cgrx.invalid_runtime_evidence",
                "unsupported runtime evidence schema",
            ));
        }
        merge_metadata(&mut revision, row.repo_revision, "repo_revision")?;
        merge_metadata(&mut environment, row.environment, "environment")?;
        let observed_at = row.observed_at_unix_nanos.parse()?;
        observations.push(NormalizedObservation {
            caller: row.caller,
            callee: row.callee,
            first_seen_unix_nanos: observed_at,
            last_seen_unix_nanos: observed_at,
            count: row.count,
        });
    }
    NormalizedBatch::new(
        revision.ok_or_else(|| {
            RuntimeError::new("cgrx.invalid_runtime_evidence", "repo_revision is required")
        })?,
        environment.ok_or_else(|| {
            RuntimeError::new("cgrx.invalid_runtime_evidence", "environment is required")
        })?,
        observations,
    )
    .map_err(|error| RuntimeError::new("cgrx.invalid_runtime_evidence", error.to_string()))
}

#[derive(Clone)]
struct OtlpSpan {
    id: String,
    parent_id: Option<String>,
    endpoint: RuntimeEndpoint,
    first_seen: u64,
    last_seen: u64,
}

fn parse_otlp(
    input: &[u8],
    revision_override: Option<&str>,
    environment_override: Option<&str>,
) -> Result<(NormalizedBatch, Vec<String>), RuntimeError> {
    let document: Value = serde_json::from_slice(input)
        .map_err(|error| RuntimeError::new("cgrx.invalid_runtime_evidence", error.to_string()))?;
    let resources = document
        .get("resourceSpans")
        .and_then(Value::as_array)
        .ok_or_else(|| {
            RuntimeError::new(
                "cgrx.invalid_runtime_evidence",
                "OTLP resourceSpans is required",
            )
        })?;
    let mut revision = revision_override.map(str::to_owned);
    let mut environment = environment_override.map(str::to_owned);
    let mut spans = Vec::new();
    let mut warnings = Vec::new();
    for resource in resources {
        let attributes = array_at(resource, "/resource/attributes");
        if revision_override.is_none()
            && let Some(value) = attribute_string(attributes, "vcs.repository.ref.revision")
        {
            merge_metadata(&mut revision, value.to_owned(), "repo_revision")?;
        }
        if environment_override.is_none()
            && let Some(value) = attribute_string(attributes, "deployment.environment.name")
        {
            merge_metadata(&mut environment, value.to_owned(), "environment")?;
        }
        for scope in array_field(resource, "scopeSpans") {
            for span in array_field(scope, "spans") {
                if spans.len() >= MAX_TRACE_SPANS {
                    return Err(RuntimeError::new(
                        "cgrx.runtime_evidence_too_large",
                        format!("OTLP span count exceeds {MAX_TRACE_SPANS}"),
                    ));
                }
                let attributes = array_field(span, "attributes");
                let function = attribute_string(attributes, "code.function.name").or_else(|| {
                    let value = attribute_string(attributes, "code.function");
                    if value.is_some() {
                        warnings
                            .push("deprecated OTLP attribute code.function was used".to_owned());
                    }
                    value
                });
                let Some(function) = function else { continue };
                let file = attribute_string(attributes, "code.file.path")
                    .or_else(|| attribute_string(attributes, "code.filepath"))
                    .map(str::to_owned);
                let line = attribute_u64(attributes, "code.line.number")
                    .or_else(|| attribute_u64(attributes, "code.lineno"))
                    .and_then(|value| u32::try_from(value).ok());
                let first_seen = json_u64(span.get("startTimeUnixNano"))?;
                let last_seen = span
                    .get("endTimeUnixNano")
                    .map(|value| json_u64(Some(value)))
                    .transpose()?
                    .unwrap_or(first_seen);
                spans.push(OtlpSpan {
                    id: required_string(span, "spanId")?.to_owned(),
                    parent_id: span
                        .get("parentSpanId")
                        .and_then(Value::as_str)
                        .filter(|value| !value.is_empty())
                        .map(str::to_owned),
                    endpoint: RuntimeEndpoint {
                        function: function.to_owned(),
                        file,
                        line,
                    },
                    first_seen,
                    last_seen,
                });
            }
        }
    }
    let by_id = spans
        .iter()
        .map(|span| (span.id.as_str(), span))
        .collect::<BTreeMap<_, _>>();
    let observations = spans
        .iter()
        .filter_map(|callee| {
            let caller = by_id.get(callee.parent_id.as_deref()?)?;
            Some(NormalizedObservation {
                caller: caller.endpoint.clone(),
                callee: callee.endpoint.clone(),
                first_seen_unix_nanos: caller.first_seen.min(callee.first_seen),
                last_seen_unix_nanos: caller.last_seen.max(callee.last_seen),
                count: 1,
            })
        })
        .collect();
    warnings.sort();
    warnings.dedup();
    let batch = NormalizedBatch::new(
        revision.ok_or_else(|| {
            RuntimeError::new("cgrx.invalid_runtime_evidence", "repo_revision is required")
        })?,
        environment.unwrap_or_else(|| "unknown".to_owned()),
        observations,
    )
    .map_err(|error| RuntimeError::new("cgrx.invalid_runtime_evidence", error.to_string()))?;
    Ok((batch, warnings))
}

fn array_at<'a>(value: &'a Value, pointer: &str) -> &'a [Value] {
    value
        .pointer(pointer)
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or_default()
}

fn array_field<'a>(value: &'a Value, field: &str) -> &'a [Value] {
    value
        .get(field)
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or_default()
}

fn required_string<'a>(object: &'a Value, field: &str) -> Result<&'a str, RuntimeError> {
    object
        .get(field)
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| {
            RuntimeError::new(
                "cgrx.invalid_runtime_evidence",
                format!("OTLP {field} is required"),
            )
        })
}

fn json_u64(value: Option<&Value>) -> Result<u64, RuntimeError> {
    match value {
        Some(Value::Number(value)) => value.as_u64(),
        Some(Value::String(value)) => value.parse().ok(),
        _ => None,
    }
    .ok_or_else(|| {
        RuntimeError::new(
            "cgrx.invalid_runtime_evidence",
            "invalid OTLP nanosecond timestamp",
        )
    })
}

fn attribute_string<'a>(attributes: &'a [Value], key: &str) -> Option<&'a str> {
    let attribute = attributes
        .iter()
        .find(|attribute| attribute.get("key").and_then(Value::as_str) == Some(key))?;
    attribute
        .pointer("/value/stringValue")
        .and_then(Value::as_str)
}

fn attribute_u64(attributes: &[Value], key: &str) -> Option<u64> {
    let attribute = attributes
        .iter()
        .find(|attribute| attribute.get("key").and_then(Value::as_str) == Some(key))?;
    match attribute.pointer("/value/intValue")? {
        Value::Number(value) => value.as_u64(),
        Value::String(value) => value.parse().ok(),
        _ => None,
    }
}

fn merge_metadata(
    target: &mut Option<String>,
    value: String,
    label: &str,
) -> Result<(), RuntimeError> {
    if target.as_ref().is_some_and(|current| current != &value) {
        return Err(RuntimeError::new(
            "cgrx.invalid_runtime_evidence",
            format!("mixed {label} values"),
        ));
    }
    target.get_or_insert(value);
    Ok(())
}

fn normalize_runtime_path(path: &str) -> Result<String, RuntimeError> {
    let path = Path::new(path);
    if path.is_absolute()
        || path.components().any(|part| {
            matches!(
                part,
                Component::ParentDir | Component::RootDir | Component::Prefix(_)
            )
        })
    {
        return Err(RuntimeError::new(
            "cgrx.invalid_runtime_path",
            "runtime paths must be repository-relative",
        ));
    }
    Ok(path
        .components()
        .filter_map(|part| match part {
            Component::Normal(value) => Some(value.to_string_lossy()),
            _ => None,
        })
        .collect::<Vec<_>>()
        .join("/"))
}

fn line_offset(source: &[u8], line: u32) -> Option<usize> {
    if line == 0 {
        return None;
    }
    let mut current = 1_u32;
    for (offset, byte) in source.iter().enumerate() {
        if current == line {
            return Some(offset);
        }
        if *byte == b'\n' {
            current += 1;
        }
    }
    (current == line).then_some(source.len())
}

fn terminal_name(value: &str) -> &str {
    value
        .rsplit([':', '.', '#', '/'])
        .find(|part| !part.is_empty())
        .unwrap_or(value)
}

fn looks_like_otlp(input: &[u8]) -> bool {
    serde_json::from_slice::<Value>(input)
        .ok()
        .is_some_and(|value| value.get("resourceSpans").is_some())
}
