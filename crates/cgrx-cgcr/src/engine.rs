use std::collections::{BTreeMap, BTreeSet};

use cgrx_capsule::{ObligationId, PackResult, Tokenizer, packed_records_tokens};
use cgrx_core::{CapsuleStatus, Hash32, RepoSnapshot};
use serde::{Deserialize, Serialize};

use crate::{
    CostTable, Counterexample, ObligationSet, ObligationState, Probe, ProbeCost, ProbeFact,
    ProbeOracle, ProbeOutcome, RemainingBudget, ResidualReason, choose_probe,
};

pub struct CompileRequest {
    pub obligations: ObligationSet,
    pub initial_pack: PackResult,
    pub pinned_snapshot: RepoSnapshot,
    pub current_snapshot: RepoSnapshot,
    pub pinned_source_hashes: BTreeMap<String, Hash32>,
    pub counterexamples: Vec<Counterexample>,
    pub budget: RemainingBudget,
    pub tokenizer: Tokenizer,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct EngineResidual {
    pub obligation_id: ObligationId,
    pub reason: ResidualReason,
}

#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct EphemeralGraph {
    pub facts: Vec<ProbeFact>,
    pub record_node_ids: Vec<u64>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct CompiledContext {
    pub status: CapsuleStatus,
    pub obligations: ObligationSet,
    pub packed: PackResult,
    pub residual: Vec<EngineResidual>,
    pub executed_probes: Vec<Probe>,
    pub facts: Vec<ProbeFact>,
    pub ephemeral_graph: EphemeralGraph,
    pub remaining_budget: RemainingBudget,
    pub unsupported_negative: bool,
}

pub struct CgcrEngine<O> {
    oracle: O,
    costs: CostTable,
}

impl<O: ProbeOracle> CgcrEngine<O> {
    #[must_use]
    pub const fn new(oracle: O, costs: CostTable) -> Self {
        Self { oracle, costs }
    }

    #[must_use]
    pub fn compile(&self, mut request: CompileRequest) -> CompiledContext {
        if request
            .pinned_snapshot
            .assert_compatible(&request.current_snapshot)
            .is_err()
        {
            return stale_context(request);
        }

        request
            .counterexamples
            .sort_by(|left, right| left.id.cmp(&right.id));
        request
            .counterexamples
            .dedup_by(|left, right| left.id == right.id);
        let mut packed = request.initial_pack;
        let mut budget = request.budget;
        let mut executed_probes = Vec::new();
        let mut facts = Vec::new();
        let mut remaining = request.counterexamples;
        let mut budget_exhausted = false;
        let mut stale = false;
        let mut no_growth_rounds = 0_u8;
        let mut provisional_residual = BTreeMap::<ObligationId, ResidualReason>::new();

        loop {
            if all_discharged(&request.obligations) || remaining.is_empty() {
                break;
            }
            let actionable = actionable_counterexamples(&remaining, &request.obligations);
            if actionable.is_empty() {
                break;
            }
            let Some(probe) = choose_probe(&actionable, &self.costs, budget) else {
                budget_exhausted = actionable.iter().any(|counterexample| {
                    counterexample
                        .allowed
                        .iter()
                        .any(|kind| self.costs.cost(*kind).is_some())
                });
                break;
            };
            budget.consume(ProbeCost {
                latency_us: probe.cost.latency_us,
                source_bytes: probe.cost.source_bytes,
                token_delta: 0,
            });
            let Some(probe_input_bytes) = packed
                .accounting
                .probe_input_bytes
                .checked_add(probe.cost.source_bytes)
            else {
                budget_exhausted = true;
                break;
            };
            packed.accounting.probe_input_bytes = probe_input_bytes;
            let probe_id = probe.id.clone();
            let before_records = packed.records.len();
            let before_tokens = packed.tokens;
            let obligations_before = request.obligations.clone();
            let packed_before = packed.clone();
            let provisional_before = provisional_residual.clone();
            let facts_before = facts.len();
            match self.oracle.execute(&probe, &request.pinned_snapshot) {
                Ok(mut emitted) => {
                    emitted.sort_by(|left, right| {
                        (
                            &left.obligation_id,
                            &left.probe_id,
                            &left.span.path,
                            left.span.start,
                        )
                            .cmp(&(
                                &right.obligation_id,
                                &right.probe_id,
                                &right.span.path,
                                right.span.start,
                            ))
                    });
                    for fact in emitted {
                        if fact.probe_id != probe.id
                            || !probe.obligation_ids.contains(&fact.obligation_id)
                        {
                            for obligation_id in &probe.obligation_ids {
                                provisional_residual.insert(
                                    obligation_id.clone(),
                                    ResidualReason {
                                        code: "INVALID_PROBE_FACT".to_owned(),
                                        detail: "oracle emitted a fact outside the selected probe"
                                            .to_owned(),
                                    },
                                );
                            }
                            continue;
                        }
                        if !fact_is_fresh(
                            &fact,
                            &request.pinned_snapshot,
                            &request.pinned_source_hashes,
                        ) {
                            stale = true;
                            break;
                        }
                        apply_fact(&mut request.obligations, &mut provisional_residual, &fact);
                        if let Some(record) = &fact.record
                            && !packed
                                .records
                                .iter()
                                .any(|existing| existing.node_id == record.node_id)
                        {
                            packed.records.push(record.clone());
                        }
                        facts.push(fact);
                    }
                }
                Err(error) => {
                    for obligation_id in &probe.obligation_ids {
                        provisional_residual.insert(
                            obligation_id.clone(),
                            ResidualReason {
                                code: error.code.clone(),
                                detail: error.detail.clone(),
                            },
                        );
                    }
                }
            }
            executed_probes.push(probe);
            let executed_kind = executed_probes
                .last()
                .expect("executed probe was just appended")
                .kind;
            for counterexample in &mut remaining {
                if counterexample.id == probe_id_without_suffix(&probe_id) {
                    counterexample.allowed.retain(|kind| *kind != executed_kind);
                }
            }
            packed.records.sort_by_key(|record| record.node_id);
            packed.records.dedup_by_key(|record| record.node_id);
            packed.tokens = packed_records_tokens(&request.tokenizer, &packed.records);
            packed
                .refresh_accounting()
                .expect("in-memory probe accounting overflow");
            let actual_token_delta = packed.tokens.saturating_sub(before_tokens);
            if actual_token_delta > budget.token_delta {
                request.obligations = obligations_before;
                packed = packed_before;
                provisional_residual = provisional_before;
                facts.truncate(facts_before);
                budget_exhausted = true;
                break;
            }
            budget.token_delta = budget.token_delta.saturating_sub(actual_token_delta);
            if packed.records.len() == before_records {
                no_growth_rounds = no_growth_rounds.saturating_add(1);
            } else {
                no_growth_rounds = 0;
            }
            if stale || no_growth_rounds >= 2 {
                break;
            }
        }

        let terminal_code = if budget_exhausted {
            "BUDGET_EXHAUSTED"
        } else if no_growth_rounds >= 2 {
            "NO_NEW_EVIDENCE"
        } else {
            "NO_PROBE_EVIDENCE"
        };
        if stale {
            mark_all_open_residual(&mut request.obligations, "STALE_SNAPSHOT", &BTreeMap::new());
        } else {
            mark_all_open_residual(
                &mut request.obligations,
                terminal_code,
                &provisional_residual,
            );
        }
        let residual = collect_residual(&request.obligations);
        let status = if stale {
            CapsuleStatus::Stale
        } else if budget_exhausted {
            CapsuleStatus::BudgetExhausted
        } else if residual.is_empty() && request.obligations.uncertainties.is_empty() {
            CapsuleStatus::CompleteBounded
        } else if packed.records.is_empty() && executed_probes.is_empty() && residual.is_empty() {
            CapsuleStatus::NoExtraContext
        } else {
            CapsuleStatus::Partial
        };
        let ephemeral_graph = EphemeralGraph {
            facts: facts.clone(),
            record_node_ids: packed.records.iter().map(|record| record.node_id).collect(),
        };
        CompiledContext {
            status,
            obligations: request.obligations,
            packed,
            residual,
            executed_probes,
            facts,
            ephemeral_graph,
            remaining_budget: budget,
            unsupported_negative: false,
        }
    }
}

fn actionable_counterexamples(
    counterexamples: &[Counterexample],
    obligations: &ObligationSet,
) -> Vec<Counterexample> {
    let open: BTreeSet<_> = obligations
        .obligations
        .iter()
        .filter(|obligation| matches!(obligation.state, ObligationState::Open))
        .map(|obligation| obligation.id.clone())
        .collect();
    counterexamples
        .iter()
        .filter_map(|counterexample| {
            let mut candidate = counterexample.clone();
            candidate
                .obligation_ids
                .retain(|obligation| open.contains(obligation));
            (!candidate.obligation_ids.is_empty()).then_some(candidate)
        })
        .collect()
}

fn all_discharged(obligations: &ObligationSet) -> bool {
    obligations
        .obligations
        .iter()
        .all(|obligation| matches!(obligation.state, ObligationState::Discharged(_)))
}

fn fact_is_fresh(
    fact: &ProbeFact,
    snapshot: &RepoSnapshot,
    source_hashes: &BTreeMap<String, Hash32>,
) -> bool {
    fact.snapshot.assert_compatible(snapshot).is_ok()
        && source_hashes
            .get(&fact.span.path)
            .is_some_and(|expected| *expected == fact.span.source_hash)
}

fn apply_fact(
    obligations: &mut ObligationSet,
    provisional_residual: &mut BTreeMap<ObligationId, ResidualReason>,
    fact: &ProbeFact,
) {
    if let Some(obligation) = obligations
        .obligations
        .iter_mut()
        .find(|obligation| obligation.id == fact.obligation_id)
    {
        match &fact.outcome {
            ProbeOutcome::Discharged(evidence) => {
                obligation.state = ObligationState::Discharged(evidence.clone());
                provisional_residual.remove(&fact.obligation_id);
            }
            ProbeOutcome::Residual(reason) => {
                provisional_residual.insert(fact.obligation_id.clone(), reason.clone());
            }
        }
    }
}

fn mark_all_open_residual(
    obligations: &mut ObligationSet,
    code: &str,
    provisional: &BTreeMap<ObligationId, ResidualReason>,
) {
    for obligation in &mut obligations.obligations {
        if matches!(obligation.state, ObligationState::Open) {
            obligation.state =
                ObligationState::Residual(provisional.get(&obligation.id).cloned().unwrap_or_else(
                    || ResidualReason {
                        code: code.to_owned(),
                        detail:
                            "counterexample-guided refinement reached a terminal bound".to_owned(),
                    },
                ));
        }
    }
}

fn collect_residual(obligations: &ObligationSet) -> Vec<EngineResidual> {
    obligations
        .obligations
        .iter()
        .filter_map(|obligation| {
            let ObligationState::Residual(reason) = &obligation.state else {
                return None;
            };
            Some(EngineResidual {
                obligation_id: obligation.id.clone(),
                reason: reason.clone(),
            })
        })
        .collect()
}

fn stale_context(mut request: CompileRequest) -> CompiledContext {
    mark_all_open_residual(&mut request.obligations, "STALE_SNAPSHOT", &BTreeMap::new());
    let residual = collect_residual(&request.obligations);
    CompiledContext {
        status: CapsuleStatus::Stale,
        obligations: request.obligations,
        packed: request.initial_pack,
        residual,
        executed_probes: Vec::new(),
        facts: Vec::new(),
        ephemeral_graph: EphemeralGraph::default(),
        remaining_budget: request.budget,
        unsupported_negative: false,
    }
}

fn probe_id_without_suffix(probe_id: &str) -> &str {
    probe_id
        .rsplit_once(':')
        .map_or(probe_id, |(prefix, _)| prefix)
}
