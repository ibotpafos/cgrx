use std::cmp::Ordering;
use std::collections::BTreeMap;

use cgrx_capsule::ObligationId;
use serde::{Deserialize, Serialize};

use crate::{Probe, ProbeCost, ProbeKind, UncertaintyKind};

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Counterexample {
    pub id: String,
    pub uncertainty: UncertaintyKind,
    pub target: String,
    pub obligation_ids: Vec<ObligationId>,
    pub allowed: Vec<ProbeKind>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ProbePlan {
    pub probes: Vec<Probe>,
    pub total_cost: ProbeCost,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct RemainingBudget {
    pub latency_us: u64,
    pub source_bytes: u64,
    pub token_delta: u32,
}

impl RemainingBudget {
    #[must_use]
    pub const fn unlimited() -> Self {
        Self {
            latency_us: u64::MAX,
            source_bytes: u64::MAX,
            token_delta: u32::MAX,
        }
    }

    #[must_use]
    pub const fn fits(self, cost: ProbeCost) -> bool {
        cost.latency_us <= self.latency_us
            && cost.source_bytes <= self.source_bytes
            && cost.token_delta <= self.token_delta
    }

    pub fn consume(&mut self, cost: ProbeCost) {
        self.latency_us = self.latency_us.saturating_sub(cost.latency_us);
        self.source_bytes = self.source_bytes.saturating_sub(cost.source_bytes);
        self.token_delta = self.token_delta.saturating_sub(cost.token_delta);
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CostTable {
    costs: BTreeMap<ProbeKind, ProbeCost>,
}

impl Default for CostTable {
    fn default() -> Self {
        Self {
            costs: BTreeMap::from([
                (
                    ProbeKind::ReparseRange,
                    ProbeCost {
                        latency_us: 1_000,
                        source_bytes: 4_096,
                        token_delta: 8,
                    },
                ),
                (
                    ProbeKind::SourceScan,
                    ProbeCost {
                        latency_us: 5_000,
                        source_bytes: 65_536,
                        token_delta: 16,
                    },
                ),
                (
                    ProbeKind::ImportedScip,
                    ProbeCost {
                        latency_us: 150_000,
                        source_bytes: 0,
                        token_delta: 32,
                    },
                ),
                (
                    ProbeKind::LspCommand,
                    ProbeCost {
                        latency_us: 500_000,
                        source_bytes: 131_072,
                        token_delta: 64,
                    },
                ),
            ]),
        }
    }
}

impl CostTable {
    #[must_use]
    pub fn uniform(latency_us: u64, source_bytes: u64, token_delta: u32) -> Self {
        let cost = ProbeCost {
            latency_us,
            source_bytes,
            token_delta,
        };
        Self {
            costs: BTreeMap::from([
                (ProbeKind::ReparseRange, cost),
                (ProbeKind::SourceScan, cost),
                (ProbeKind::ImportedScip, cost),
                (ProbeKind::LspCommand, cost),
            ]),
        }
    }

    #[must_use]
    pub fn cost(&self, kind: ProbeKind) -> Option<ProbeCost> {
        self.costs.get(&kind).copied()
    }
}

#[must_use]
pub fn choose_probe(
    open: &[Counterexample],
    costs: &CostTable,
    budget: RemainingBudget,
) -> Option<Probe> {
    let mut best: Option<Probe> = None;
    for counterexample in open {
        let mut obligations = counterexample.obligation_ids.clone();
        obligations.sort();
        obligations.dedup();
        let mut kinds = counterexample.allowed.clone();
        kinds.sort();
        kinds.dedup();
        for kind in kinds {
            let Some(cost) = costs.cost(kind) else {
                continue;
            };
            if !budget.fits(cost) {
                continue;
            }
            let probe = Probe {
                id: format!("{}:{}", counterexample.id, kind.suffix()),
                kind,
                target: counterexample.target.clone(),
                obligation_ids: obligations.clone(),
                cost,
            };
            if best.as_ref().is_none_or(|current| better(&probe, current)) {
                best = Some(probe);
            }
        }
    }
    best
}

fn better(left: &Probe, right: &Probe) -> bool {
    let left_gain = left.obligation_ids.len().max(1) as u128;
    let right_gain = right.obligation_ids.len().max(1) as u128;
    let left_cost = normalized_cost(left.cost);
    let right_cost = normalized_cost(right.cost);
    match (left_gain * right_cost).cmp(&(right_gain * left_cost)) {
        Ordering::Greater => true,
        Ordering::Less => false,
        Ordering::Equal => left.id < right.id,
    }
}

fn normalized_cost(cost: ProbeCost) -> u128 {
    (u128::from(cost.latency_us)
        + u128::from(cost.source_bytes)
        + u128::from(cost.token_delta) * 1_000)
        .max(1)
}
