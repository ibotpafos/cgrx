//! Optional compiler-backed call resolution from a SCIP index.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Component, Path};

use cgrx_core::{ByteRange, ConfidenceClass, EdgeEvidence, Hash32, RelationKind, ResolverClass};
use protobuf::Message;
use scip::types::occurrence::Typed_range;
use scip::types::symbol_information::Kind as SymbolKind;
use scip::types::{Index, Occurrence, PositionEncoding, SymbolRole};

use super::{RuntimeError, StoredArc, StoredDocument};

const MAX_SCIP_BYTES: u64 = 512 * 1024 * 1024;

pub(super) fn read_index(path: &Path) -> Result<Vec<u8>, RuntimeError> {
    let metadata =
        fs::metadata(path).map_err(|error| RuntimeError::new("scip_read", error.to_string()))?;
    if metadata.len() > MAX_SCIP_BYTES {
        return Err(RuntimeError::new(
            "scip_too_large",
            format!("SCIP index exceeds {MAX_SCIP_BYTES} bytes"),
        ));
    }
    fs::read(path).map_err(|error| RuntimeError::new("scip_read", error.to_string()))
}

pub(super) fn resolve(
    bytes: &[u8],
    sources: &[(String, Vec<u8>)],
    documents: &[StoredDocument],
    path_hashes: &BTreeMap<String, Hash32>,
) -> Result<Vec<StoredArc>, RuntimeError> {
    let index = Index::parse_from_bytes(bytes)
        .map_err(|error| RuntimeError::new("scip_parse", error.to_string()))?;
    let source_by_path: BTreeMap<_, _> = sources
        .iter()
        .map(|(path, source)| (path.as_str(), source.as_slice()))
        .collect();
    let syntax_by_span: BTreeMap<_, Vec<_>> = documents
        .iter()
        .filter(|document| document.provenance == "SYNTAX")
        .fold(BTreeMap::new(), |mut by_span, document| {
            by_span
                .entry((
                    document.path.as_str(),
                    document.span_start,
                    document.span_end,
                ))
                .or_default()
                .push(document.node_id);
            by_span
        });
    let polymorphic_symbols: BTreeSet<_> = index
        .documents
        .iter()
        .flat_map(|document| &document.symbols)
        .filter_map(|symbol| {
            symbol
                .kind
                .enum_value()
                .ok()
                .filter(|kind| is_polymorphic_method(*kind))
                .map(|_| symbol.symbol.clone())
        })
        .collect();
    let mut occurrences = BTreeMap::<String, Vec<ResolvedOccurrence>>::new();
    for document in &index.documents {
        let Some(path) = canonical_relative_path(&document.relative_path) else {
            continue;
        };
        let Some(source) = source_by_path.get(path.as_str()).copied() else {
            continue;
        };
        if !document.text.is_empty() && document.text.as_bytes() != source {
            return Err(RuntimeError::new(
                "scip_source_mismatch",
                format!("SCIP text does not match indexed source for {path}"),
            ));
        }
        let Ok(encoding) = document.position_encoding.enum_value() else {
            continue;
        };
        if encoding == PositionEncoding::UnspecifiedPositionEncoding {
            continue;
        }
        let line_starts = line_starts(source);
        for occurrence in &document.occurrences {
            if occurrence.symbol.is_empty() || scip::symbol::is_local_symbol(&occurrence.symbol) {
                continue;
            }
            let Some(span) = occurrence_span(occurrence, source, &line_starts, encoding) else {
                continue;
            };
            occurrences
                .entry(path.clone())
                .or_default()
                .push(ResolvedOccurrence {
                    start: span.start,
                    end: span.end,
                    symbol: occurrence.symbol.clone(),
                    definition: occurrence.symbol_roles & SymbolRole::Definition as i32 != 0,
                });
        }
    }

    let mut targets = BTreeMap::<String, BTreeSet<u64>>::new();
    for (path, items) in &occurrences {
        for occurrence in items.iter().filter(|occurrence| occurrence.definition) {
            if polymorphic_symbols.contains(&occurrence.symbol) {
                continue;
            }
            if let Some(nodes) =
                syntax_by_span.get(&(path.as_str(), occurrence.start, occurrence.end))
            {
                targets
                    .entry(occurrence.symbol.clone())
                    .or_default()
                    .extend(nodes);
            }
        }
    }

    let syntax_by_path: BTreeMap<_, Vec<_>> = documents
        .iter()
        .filter(|document| document.provenance == "SYNTAX")
        .fold(BTreeMap::new(), |mut by_path, document| {
            by_path
                .entry(document.path.as_str())
                .or_default()
                .push(document);
            by_path
        });
    let mut arcs = Vec::new();
    for call in documents.iter().filter(|document| {
        document.provenance == "CALLS"
            && document
                .semantic_tags
                .iter()
                .any(|tag| tag == "DYNAMIC_DISPATCH" || tag == "DYNAMIC_PROPERTY")
    }) {
        let Some(source_hash) = path_hashes.get(&call.path).copied() else {
            continue;
        };
        let Some(source) = syntax_by_path
            .get(call.path.as_str())
            .into_iter()
            .flatten()
            .filter(|document| {
                document.body_start <= call.span_start && document.body_end >= call.span_end
            })
            .min_by_key(|document| {
                (
                    document.body_end.saturating_sub(document.body_start),
                    std::cmp::Reverse(document.body_start),
                )
            })
        else {
            continue;
        };
        let candidate_targets: BTreeSet<_> = occurrences
            .get(&call.path)
            .into_iter()
            .flatten()
            .filter(|occurrence| {
                !occurrence.definition
                    && occurrence.start >= call.span_start
                    && occurrence.end <= call.span_end
            })
            .filter_map(|occurrence| {
                let nodes = targets.get(&occurrence.symbol)?;
                let mut nodes = nodes.iter().copied();
                let target = nodes.next()?;
                nodes.next().is_none().then_some(target)
            })
            .collect();
        let mut candidate_targets = candidate_targets.into_iter();
        let Some(target) = candidate_targets.next() else {
            continue;
        };
        if candidate_targets.next().is_some() {
            continue;
        }
        arcs.push(StoredArc {
            source: source.node_id,
            target,
            kind: RelationKind::Calls,
            evidence: Some(EdgeEvidence {
                path: call.path.clone(),
                span: ByteRange::new(call.span_start, call.span_end),
                source_hash,
                resolver: ResolverClass::ScipConfirmed,
                confidence: ConfidenceClass::Proven,
                assumptions: Vec::new(),
                counter_evidence: Vec::new(),
            }),
        });
    }
    arcs.sort_by_key(|arc| (arc.source, arc.target, arc.kind, arc.evidence.clone()));
    arcs.dedup();
    Ok(arcs)
}

#[derive(Clone, Debug)]
struct ResolvedOccurrence {
    start: usize,
    end: usize,
    symbol: String,
    definition: bool,
}

const fn is_polymorphic_method(kind: SymbolKind) -> bool {
    matches!(
        kind,
        SymbolKind::AbstractMethod
            | SymbolKind::MethodSpecification
            | SymbolKind::ProtocolMethod
            | SymbolKind::PureVirtualMethod
            | SymbolKind::TraitMethod
    )
}

fn canonical_relative_path(path: &str) -> Option<String> {
    if path.is_empty() || path.contains(['\\', '\0']) || Path::new(path).is_absolute() {
        return None;
    }
    let mut normalized = Vec::new();
    for component in Path::new(path).components() {
        match component {
            Component::Normal(value) => normalized.push(value.to_str()?),
            _ => return None,
        }
    }
    (!normalized.is_empty()).then(|| normalized.join("/"))
}

fn line_starts(source: &[u8]) -> Vec<usize> {
    std::iter::once(0)
        .chain(
            source
                .iter()
                .enumerate()
                .filter_map(|(index, byte)| (*byte == b'\n').then_some(index + 1)),
        )
        .collect()
}

fn occurrence_span(
    occurrence: &Occurrence,
    source: &[u8],
    line_starts: &[usize],
    encoding: PositionEncoding,
) -> Option<ByteRange> {
    let (start_line, start_character, end_line, end_character) = match &occurrence.typed_range {
        Some(Typed_range::SingleLineRange(range)) => (
            range.line,
            range.start_character,
            range.line,
            range.end_character,
        ),
        Some(Typed_range::MultiLineRange(range)) => (
            range.start_line,
            range.start_character,
            range.end_line,
            range.end_character,
        ),
        Some(_) => return None,
        None => match occurrence.range.as_slice() {
            [line, start, end] => (*line, *start, *line, *end),
            [start_line, start, end_line, end] => (*start_line, *start, *end_line, *end),
            _ => return None,
        },
    };
    let start = position_to_byte(source, line_starts, start_line, start_character, encoding)?;
    let end = position_to_byte(source, line_starts, end_line, end_character, encoding)?;
    (start <= end).then(|| ByteRange::new(start, end))
}

fn position_to_byte(
    source: &[u8],
    line_starts: &[usize],
    line: i32,
    character: i32,
    encoding: PositionEncoding,
) -> Option<usize> {
    let line = usize::try_from(line).ok()?;
    let character = usize::try_from(character).ok()?;
    let start = *line_starts.get(line)?;
    let end = line_starts.get(line + 1).copied().unwrap_or(source.len());
    let line_bytes = &source[start..end];
    match encoding {
        PositionEncoding::UnspecifiedPositionEncoding
        | PositionEncoding::UTF8CodeUnitOffsetFromLineStart => {
            let offset = character.min(line_bytes.len());
            (offset == character
                && (offset == line_bytes.len()
                    || std::str::from_utf8(line_bytes)
                        .ok()?
                        .is_char_boundary(offset)))
            .then_some(start + offset)
        }
        PositionEncoding::UTF16CodeUnitOffsetFromLineStart => {
            encoded_character_offset(line_bytes, character, char::len_utf16)
                .map(|value| start + value)
        }
        PositionEncoding::UTF32CodeUnitOffsetFromLineStart => {
            encoded_character_offset(line_bytes, character, |_| 1).map(|value| start + value)
        }
    }
}

fn encoded_character_offset(
    line: &[u8],
    requested: usize,
    width: impl Fn(char) -> usize,
) -> Option<usize> {
    let line = std::str::from_utf8(line).ok()?;
    let mut units = 0;
    for (offset, character) in line.char_indices() {
        if units == requested {
            return Some(offset);
        }
        units += width(character);
        if units > requested {
            return None;
        }
    }
    (units == requested).then_some(line.len())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_utf16_positions_without_splitting_code_points() {
        let source = "a😀z\n".as_bytes();
        let starts = line_starts(source);
        assert_eq!(
            position_to_byte(
                source,
                &starts,
                0,
                3,
                PositionEncoding::UTF16CodeUnitOffsetFromLineStart,
            ),
            Some(5)
        );
        assert_eq!(
            position_to_byte(
                source,
                &starts,
                0,
                2,
                PositionEncoding::UTF16CodeUnitOffsetFromLineStart,
            ),
            None
        );
    }

    #[test]
    fn rejects_non_canonical_paths() {
        assert_eq!(
            canonical_relative_path("src/main.rs"),
            Some("src/main.rs".into())
        );
        assert_eq!(canonical_relative_path("../main.rs"), None);
        assert_eq!(canonical_relative_path("src\\main.rs"), None);
    }

    #[test]
    fn abstract_method_kinds_remain_runtime_dispatch() {
        for kind in [
            SymbolKind::AbstractMethod,
            SymbolKind::MethodSpecification,
            SymbolKind::ProtocolMethod,
            SymbolKind::PureVirtualMethod,
            SymbolKind::TraitMethod,
        ] {
            assert!(is_polymorphic_method(kind));
        }
        assert!(!is_polymorphic_method(SymbolKind::Method));
    }
}
