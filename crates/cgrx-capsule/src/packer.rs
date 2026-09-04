use std::cmp::Ordering;
use std::collections::{BTreeMap, BTreeSet, VecDeque};

use cgrx_core::IoAccounting;
use cgrx_retrieval::{Candidate, CandidateProvenance, CandidateSet};
use serde::{Deserialize, Serialize};

use crate::{ObligationId, ResidualObligation, Tokenizer, to_canonical_json};

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct EvidenceRecord {
    pub node_id: u64,
    pub path: String,
    pub span_start: usize,
    pub span_end: usize,
    pub text: String,
    pub provenance: String,
    pub obligation_ids: Vec<ObligationId>,
    pub neighbors: Vec<u64>,
    pub uncertainty_penalty: u32,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ExcludedRecord {
    pub node_id: u64,
    pub reason: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct PackResult {
    pub records: Vec<EvidenceRecord>,
    pub excluded: Vec<ExcludedRecord>,
    pub tokens: u32,
    pub residual: Vec<ResidualObligation>,
    pub accounting: IoAccounting,
}

impl PackResult {
    pub fn verify_accounting(&self) -> Result<(), crate::CapsuleError> {
        let emitted_source_bytes = record_source_bytes(&self.records)?;
        if emitted_source_bytes != self.accounting.emitted_source_bytes
            || self.tokens != self.accounting.model_visible_tokens
        {
            return Err(crate::CapsuleError::AccountingMismatch);
        }
        Ok(())
    }

    pub fn refresh_accounting(&mut self) -> Result<(), crate::CapsuleError> {
        self.accounting.emitted_source_bytes = record_source_bytes(&self.records)?;
        self.accounting.model_visible_tokens = self.tokens;
        Ok(())
    }
}

pub struct PackInput<'a> {
    pub candidates: &'a CandidateSet,
    pub records: Vec<EvidenceRecord>,
    pub obligations: Vec<ObligationId>,
    pub required_anchors: Vec<u64>,
    pub allow_disconnected_required_anchors: bool,
    pub tokenizer: &'a Tokenizer,
    pub budget: u32,
}

pub struct EvidencePacker;

impl EvidencePacker {
    #[must_use]
    pub fn pack(input: PackInput<'_>) -> PackResult {
        let records = normalize_records(input.records);
        let adjacency = adjacency(&records);
        let required: BTreeSet<_> = input.obligations.into_iter().collect();
        let mut selected = BTreeSet::new();
        let mut residual = BTreeMap::<ObligationId, ResidualObligation>::new();
        let mut excluded = BTreeMap::<u64, String>::new();

        let mut anchors = input.required_anchors;
        anchors.sort_by_key(|node_id| tie_key(*node_id, &records));
        anchors.dedup();
        for anchor in anchors {
            let Some(record) = records.get(&anchor) else {
                add_residual(
                    &mut residual,
                    ObligationId(format!("ANCHOR:{anchor}")),
                    "MISSING_ANCHOR",
                    "required anchor is absent from evidence records",
                    anchor,
                );
                continue;
            };
            let path = if selected.is_empty() || input.allow_disconnected_required_anchors {
                Some(vec![anchor])
            } else {
                shortest_path_to_set(anchor, &selected, &adjacency, &records)
            };
            let Some(path) = path else {
                excluded.insert(anchor, "disconnected_required_anchor".to_owned());
                for obligation in &record.obligation_ids {
                    add_residual(
                        &mut residual,
                        obligation.clone(),
                        "CONNECTOR_MISSING",
                        "required anchor has no connector path",
                        anchor,
                    );
                }
                continue;
            };
            let proposed = with_bundle(&selected, &path);
            if fits_budget(input.tokenizer, &records, &proposed, input.budget) {
                selected = proposed;
                for node_id in path {
                    excluded.remove(&node_id);
                }
            } else {
                excluded.insert(anchor, "required_anchor_exceeds_budget".to_owned());
                for obligation in &record.obligation_ids {
                    add_residual(
                        &mut residual,
                        obligation.clone(),
                        "BUDGET_EXHAUSTED",
                        "required anchor and connector path do not fit",
                        anchor,
                    );
                }
            }
        }

        loop {
            let current_tokens = token_count(input.tokenizer, &records, &selected);
            let covered = covered_obligations(&selected, &records);
            let selected_paths: BTreeSet<_> = selected
                .iter()
                .filter_map(|node_id| records.get(node_id).map(|record| record.path.as_str()))
                .collect();
            let mut best: Option<Choice> = None;
            for candidate in &input.candidates.candidates {
                if selected.contains(&candidate.node_id)
                    || !records.contains_key(&candidate.node_id)
                {
                    continue;
                }
                let path = if selected.is_empty() {
                    Some(vec![candidate.node_id])
                } else {
                    shortest_path_to_set(candidate.node_id, &selected, &adjacency, &records)
                };
                let Some(path) = path else {
                    excluded
                        .entry(candidate.node_id)
                        .or_insert_with(|| "disconnected".to_owned());
                    continue;
                };
                let proposed = with_bundle(&selected, &path);
                let proposed_tokens = token_count(input.tokenizer, &records, &proposed);
                if !fits_budget(input.tokenizer, &records, &proposed, input.budget) {
                    excluded
                        .entry(candidate.node_id)
                        .or_insert_with(|| "budget".to_owned());
                    continue;
                }
                let incremental = proposed_tokens.saturating_sub(current_tokens).max(1);
                let numerator = utility(
                    candidate,
                    &records[&candidate.node_id],
                    &required,
                    &covered,
                    &selected_paths,
                );
                if numerator == 0 {
                    continue;
                }
                let choice = Choice {
                    path,
                    numerator,
                    denominator: incremental,
                    tie: tie_key(candidate.node_id, &records),
                };
                if best
                    .as_ref()
                    .is_none_or(|current| choice.better_than(current))
                {
                    best = Some(choice);
                }
            }
            let Some(choice) = best else {
                break;
            };
            selected = with_bundle(&selected, &choice.path);
            for node_id in choice.path {
                excluded.remove(&node_id);
            }
        }

        let covered = covered_obligations(&selected, &records);
        residual.retain(|obligation, _| !covered.contains(obligation));
        for obligation in required.difference(&covered) {
            add_residual(
                &mut residual,
                obligation.clone(),
                "NOT_PACKED",
                "no connected evidence for obligation fits the exact budget",
                0,
            );
        }
        let packed = sorted_records(&records, &selected);
        let tokens = packed_records_tokens(input.tokenizer, &packed);
        let emitted_source_bytes =
            record_source_bytes(&packed).expect("in-memory evidence byte accounting overflow");
        PackResult {
            records: packed,
            excluded: excluded
                .into_iter()
                .map(|(node_id, reason)| ExcludedRecord { node_id, reason })
                .collect(),
            tokens,
            residual: residual.into_values().collect(),
            accounting: IoAccounting {
                emitted_source_bytes,
                model_visible_tokens: tokens,
                ..IoAccounting::default()
            },
        }
    }
}

fn record_source_bytes(records: &[EvidenceRecord]) -> Result<u64, crate::CapsuleError> {
    records.iter().try_fold(0_u64, |total, record| {
        total
            .checked_add(record.text.len() as u64)
            .ok_or(crate::CapsuleError::AccountingOverflow)
    })
}

#[must_use]
pub fn packed_records_tokens(tokenizer: &Tokenizer, records: &[EvidenceRecord]) -> u32 {
    to_canonical_json(&records)
        .map(|json| tokenizer.count(&json))
        .unwrap_or(u32::MAX)
}

fn normalize_records(values: Vec<EvidenceRecord>) -> BTreeMap<u64, EvidenceRecord> {
    let mut records = BTreeMap::new();
    for mut record in values {
        record.neighbors.sort_unstable();
        record.neighbors.dedup();
        record.obligation_ids.sort();
        record.obligation_ids.dedup();
        records
            .entry(record.node_id)
            .and_modify(|current| {
                if record_key(&record) < record_key(current) {
                    *current = record.clone();
                }
            })
            .or_insert(record);
    }
    records
}

fn adjacency(records: &BTreeMap<u64, EvidenceRecord>) -> BTreeMap<u64, Vec<u64>> {
    let mut adjacency = BTreeMap::<u64, BTreeSet<u64>>::new();
    for record in records.values() {
        adjacency.entry(record.node_id).or_default();
        for neighbor in &record.neighbors {
            if records.contains_key(neighbor) {
                adjacency
                    .entry(record.node_id)
                    .or_default()
                    .insert(*neighbor);
                adjacency
                    .entry(*neighbor)
                    .or_default()
                    .insert(record.node_id);
            }
        }
    }
    adjacency
        .into_iter()
        .map(|(node_id, values)| (node_id, values.into_iter().collect()))
        .collect()
}

fn shortest_path_to_set(
    start: u64,
    targets: &BTreeSet<u64>,
    adjacency: &BTreeMap<u64, Vec<u64>>,
    records: &BTreeMap<u64, EvidenceRecord>,
) -> Option<Vec<u64>> {
    if targets.contains(&start) {
        return Some(Vec::new());
    }
    let mut queue = VecDeque::from([start]);
    let mut visited = BTreeSet::from([start]);
    let mut parent = BTreeMap::<u64, u64>::new();
    while let Some(node) = queue.pop_front() {
        let mut neighbors = adjacency.get(&node).cloned().unwrap_or_default();
        neighbors.sort_by_key(|node_id| tie_key(*node_id, records));
        for neighbor in neighbors {
            if !visited.insert(neighbor) {
                continue;
            }
            parent.insert(neighbor, node);
            if targets.contains(&neighbor) {
                let mut path = vec![neighbor];
                let mut cursor = neighbor;
                while cursor != start {
                    cursor = parent[&cursor];
                    path.push(cursor);
                }
                path.reverse();
                return Some(path);
            }
            queue.push_back(neighbor);
        }
    }
    None
}

fn with_bundle(selected: &BTreeSet<u64>, bundle: &[u64]) -> BTreeSet<u64> {
    selected
        .iter()
        .copied()
        .chain(bundle.iter().copied())
        .collect()
}

fn sorted_records(
    records: &BTreeMap<u64, EvidenceRecord>,
    selected: &BTreeSet<u64>,
) -> Vec<EvidenceRecord> {
    let mut values: Vec<_> = selected
        .iter()
        .filter_map(|node_id| records.get(node_id).cloned())
        .collect();
    values.sort_by_key(|record| record.node_id);
    values
}

fn token_count(
    tokenizer: &Tokenizer,
    records: &BTreeMap<u64, EvidenceRecord>,
    selected: &BTreeSet<u64>,
) -> u32 {
    packed_records_tokens(tokenizer, &sorted_records(records, selected))
}

fn fits_budget(
    tokenizer: &Tokenizer,
    records: &BTreeMap<u64, EvidenceRecord>,
    selected: &BTreeSet<u64>,
    budget: u32,
) -> bool {
    let packed = sorted_records(records, selected);
    (0..=packed.len()).all(|end| packed_records_tokens(tokenizer, &packed[..end]) <= budget)
}

fn record_key(
    record: &EvidenceRecord,
) -> (&str, usize, usize, &str, &str, &[ObligationId], &[u64], u32) {
    (
        &record.path,
        record.span_start,
        record.span_end,
        &record.text,
        &record.provenance,
        &record.obligation_ids,
        &record.neighbors,
        record.uncertainty_penalty,
    )
}

fn covered_obligations(
    selected: &BTreeSet<u64>,
    records: &BTreeMap<u64, EvidenceRecord>,
) -> BTreeSet<ObligationId> {
    selected
        .iter()
        .filter_map(|node_id| records.get(node_id))
        .flat_map(|record| record.obligation_ids.iter().cloned())
        .collect()
}

fn utility(
    candidate: &Candidate,
    record: &EvidenceRecord,
    required: &BTreeSet<ObligationId>,
    covered: &BTreeSet<ObligationId>,
    selected_paths: &BTreeSet<&str>,
) -> u64 {
    let obligation_gain = record
        .obligation_ids
        .iter()
        .filter(|obligation| required.contains(*obligation) && !covered.contains(*obligation))
        .count() as u64;
    let path_gain = u64::from(!selected_paths.contains(record.path.as_str()));
    let redundancy = u64::from(selected_paths.contains(record.path.as_str())) * 50_000;
    let provenance_gain = match candidate.provenance {
        CandidateProvenance::Syntax => 2,
        CandidateProvenance::Text => 1,
    };
    (obligation_gain * 1_000_000
        + path_gain * 100_000
        + provenance_gain * 10_000
        + candidate.scores.graph.min(50_000)
        + candidate.scores.rrf.min(9_999))
    .saturating_sub(redundancy + u64::from(record.uncertainty_penalty).min(9_999))
}

fn tie_key(node_id: u64, records: &BTreeMap<u64, EvidenceRecord>) -> (u64, usize, u64) {
    records
        .get(&node_id)
        .map_or((u64::MAX, usize::MAX, node_id), |record| {
            (path_id(&record.path), record.span_start, node_id)
        })
}

fn path_id(path: &str) -> u64 {
    let digest = blake3::hash(path.as_bytes());
    let mut bytes = [0_u8; 8];
    bytes.copy_from_slice(&digest.as_bytes()[..8]);
    u64::from_le_bytes(bytes)
}

fn add_residual(
    residual: &mut BTreeMap<ObligationId, ResidualObligation>,
    obligation_id: ObligationId,
    kind: &str,
    reason: &str,
    node_id: u64,
) {
    residual
        .entry(obligation_id.clone())
        .or_insert(ResidualObligation {
            obligation_id,
            kind: kind.to_owned(),
            reason: reason.to_owned(),
            expansion_handle: (node_id != 0).then(|| format!("node:{node_id}")),
        });
}

struct Choice {
    path: Vec<u64>,
    numerator: u64,
    denominator: u32,
    tie: (u64, usize, u64),
}

impl Choice {
    fn better_than(&self, other: &Self) -> bool {
        let left = u128::from(self.numerator) * u128::from(other.denominator);
        let right = u128::from(other.numerator) * u128::from(self.denominator);
        match left.cmp(&right) {
            Ordering::Greater => true,
            Ordering::Less => false,
            Ordering::Equal => self.tie < other.tie,
        }
    }
}
