use std::collections::BTreeMap;

use cgrx_capsule::{EvidenceRecord, ObligationId, PackResult, Tokenizer, packed_records_tokens};
use cgrx_cgcr::{
    CgcrEngine, CompileRequest, CostTable, Counterexample, CoverageMetadata, EvidenceRef,
    ObligationCompiler, Probe, ProbeError, ProbeFact, ProbeKind, ProbeOracle, QueryClass,
    RemainingBudget, ResidualReason, ResolvedAnchor, RevisionBoundSpan, UncertaintyKind,
};
use cgrx_core::{CapsuleStatus, Hash32, Mode, QueryRequest, RelationKind, RepoSnapshot, Scope};

#[derive(Clone, Copy)]
enum Behavior {
    Discharge,
    DischargeRecord,
    Residual,
    BadHash,
}

struct ScriptedOracle {
    behavior: Behavior,
}

impl ProbeOracle for ScriptedOracle {
    fn execute(
        &self,
        probe: &Probe,
        snapshot: &RepoSnapshot,
    ) -> Result<Vec<ProbeFact>, ProbeError> {
        let span = RevisionBoundSpan {
            path: probe.target.clone(),
            start: 0,
            end: 8,
            source_hash: if matches!(self.behavior, Behavior::BadHash) {
                Hash32([99; 32])
            } else {
                snapshot.working_tree_digest
            },
        };
        Ok(probe
            .obligation_ids
            .iter()
            .map(|obligation_id| {
                let mut fact = match self.behavior {
                    Behavior::Discharge | Behavior::DischargeRecord | Behavior::BadHash => {
                        ProbeFact::discharged(
                            &probe.id,
                            snapshot.clone(),
                            obligation_id.clone(),
                            EvidenceRef {
                                handle: format!("probe:{}", probe.id),
                            },
                            span.clone(),
                        )
                    }
                    Behavior::Residual => ProbeFact::residual(
                        &probe.id,
                        snapshot.clone(),
                        obligation_id.clone(),
                        ResidualReason {
                            code: "REFLECTION_UNRESOLVED".to_owned(),
                            detail: "runtime target remains data-dependent".to_owned(),
                        },
                        span.clone(),
                    ),
                };
                if matches!(self.behavior, Behavior::DischargeRecord) {
                    fact.record = Some(EvidenceRecord {
                        node_id: 42,
                        path: probe.target.clone(),
                        span_start: 0,
                        span_end: 8,
                        text: "charge()".to_owned(),
                        provenance: "SOURCE_SCAN".to_owned(),
                        obligation_ids: probe.obligation_ids.clone(),
                        neighbors: Vec::new(),
                        uncertainty_penalty: 0,
                    });
                }
                fact
            })
            .collect())
    }
}

fn snapshot(generation: u64) -> RepoSnapshot {
    RepoSnapshot {
        repo_revision: "abc123".to_owned(),
        working_tree_digest: Hash32([generation as u8; 32]),
        graph_generation: generation,
    }
}

fn query(task: &str, budget: u32) -> QueryRequest {
    QueryRequest {
        task: task.to_owned(),
        scope: Scope {
            include: vec!["src/**".to_owned()],
            exclude: Vec::new(),
            relation_kinds: vec![RelationKind::Calls],
            max_depth: 5,
        },
        mode: Mode::Bounded,
        token_budget: budget,
    }
}

fn obligations(request: &QueryRequest) -> cgrx_cgcr::ObligationSet {
    ObligationCompiler::compile(
        request,
        &[ResolvedAnchor {
            node_id: 1,
            path: "src/main.ts".to_owned(),
            qualified_name: "main::charge".to_owned(),
        }],
        &CoverageMetadata::default(),
        Some(QueryClass::NegativeExhaustive),
    )
}

fn empty_pack() -> PackResult {
    PackResult {
        records: Vec::new(),
        excluded: Vec::new(),
        tokens: 0,
        residual: Vec::new(),
        accounting: cgrx_core::IoAccounting::default(),
    }
}

fn counterexample(kind: UncertaintyKind, obligations: &[&str]) -> Counterexample {
    Counterexample {
        id: "reflection:src/main.ts".to_owned(),
        uncertainty: kind,
        target: "src/main.ts".to_owned(),
        obligation_ids: obligations
            .iter()
            .map(|value| ObligationId((*value).to_owned()))
            .collect(),
        allowed: vec![
            ProbeKind::SourceScan,
            ProbeKind::ImportedScip,
            ProbeKind::LspCommand,
        ],
    }
}

fn compile_request(
    request: QueryRequest,
    current_snapshot: RepoSnapshot,
    budget: RemainingBudget,
    counterexamples: Vec<Counterexample>,
) -> CompileRequest {
    let pinned = snapshot(7);
    CompileRequest {
        obligations: obligations(&request),
        initial_pack: empty_pack(),
        pinned_snapshot: pinned.clone(),
        current_snapshot,
        pinned_source_hashes: BTreeMap::from([(
            "src/main.ts".to_owned(),
            pinned.working_tree_digest,
        )]),
        counterexamples,
        budget,
        tokenizer: Tokenizer::o200k_base().unwrap(),
    }
}

#[test]
fn unresolved_reflection_returns_partial_with_residual() {
    let request = query("all calls", 800);
    let engine = CgcrEngine::new(
        ScriptedOracle {
            behavior: Behavior::Residual,
        },
        CostTable::default(),
    );
    let result = engine.compile(compile_request(
        request,
        snapshot(7),
        RemainingBudget::unlimited(),
        vec![counterexample(UncertaintyKind::DynamicDispatch, &["O3"])],
    ));
    assert_eq!(result.status, CapsuleStatus::Partial);
    assert!(
        result
            .residual
            .iter()
            .any(|item| item.obligation_id.0 == "O3" && item.reason.code == "REFLECTION_UNRESOLVED")
    );
    assert_ne!(result.status, CapsuleStatus::CompleteBounded);
    assert_eq!(
        result
            .executed_probes
            .iter()
            .map(|probe| probe.kind)
            .collect::<Vec<_>>(),
        vec![ProbeKind::SourceScan, ProbeKind::ImportedScip]
    );
}

#[test]
fn all_six_discharged_obligations_return_complete_bounded() {
    let request = query("all calls", 800);
    let engine = CgcrEngine::new(
        ScriptedOracle {
            behavior: Behavior::Discharge,
        },
        CostTable::default(),
    );
    let result = engine.compile(compile_request(
        request,
        snapshot(7),
        RemainingBudget::unlimited(),
        vec![counterexample(
            UncertaintyKind::DynamicDispatch,
            &["O1", "O2", "O3", "O4", "O5", "O6"],
        )],
    ));
    assert_eq!(result.status, CapsuleStatus::CompleteBounded);
    assert!(result.residual.is_empty());
    assert_eq!(result.facts.len(), 6);
}

#[test]
fn probe_records_refine_only_ephemeral_context_and_recount_exact_tokens() {
    let request = query("all calls", 800);
    let tokenizer = Tokenizer::o200k_base().unwrap();
    let engine = CgcrEngine::new(
        ScriptedOracle {
            behavior: Behavior::DischargeRecord,
        },
        CostTable::default(),
    );
    let result = engine.compile(compile_request(
        request,
        snapshot(7),
        RemainingBudget::unlimited(),
        vec![counterexample(
            UncertaintyKind::DynamicDispatch,
            &["O1", "O2", "O3", "O4", "O5", "O6"],
        )],
    ));
    assert_eq!(result.status, CapsuleStatus::CompleteBounded);
    assert_eq!(result.packed.records.len(), 1);
    assert_eq!(result.ephemeral_graph.record_node_ids, vec![42]);
    assert_eq!(
        result.packed.tokens,
        packed_records_tokens(&tokenizer, &result.packed.records)
    );
}

#[test]
fn exact_record_tokens_cannot_overrun_remaining_budget() {
    let request = query("all calls", 16);
    let engine = CgcrEngine::new(
        ScriptedOracle {
            behavior: Behavior::DischargeRecord,
        },
        CostTable::default(),
    );
    let result = engine.compile(compile_request(
        request,
        snapshot(7),
        RemainingBudget {
            latency_us: 1_000_000,
            source_bytes: 1_000_000,
            token_delta: 16,
        },
        vec![counterexample(
            UncertaintyKind::DynamicDispatch,
            &["O1", "O2", "O3", "O4", "O5", "O6"],
        )],
    ));
    assert_eq!(result.status, CapsuleStatus::BudgetExhausted);
    assert!(result.packed.records.is_empty());
    assert_eq!(result.packed.tokens, 0);
}

#[test]
fn exhausted_token_budget_returns_budget_exhausted() {
    let request = query("all calls", 0);
    let engine = CgcrEngine::new(
        ScriptedOracle {
            behavior: Behavior::Discharge,
        },
        CostTable::default(),
    );
    let result = engine.compile(compile_request(
        request,
        snapshot(7),
        RemainingBudget {
            latency_us: 1_000_000,
            source_bytes: 1_000_000,
            token_delta: 0,
        },
        vec![counterexample(UncertaintyKind::DynamicDispatch, &["O3"])],
    ));
    assert_eq!(result.status, CapsuleStatus::BudgetExhausted);
    assert_eq!(
        result
            .residual
            .iter()
            .map(|item| item.obligation_id.0.as_str())
            .collect::<Vec<_>>(),
        vec!["O1", "O2", "O3", "O4", "O5", "O6"]
    );
}

#[test]
fn snapshot_change_returns_stale_before_any_probe() {
    let request = query("all calls", 800);
    let engine = CgcrEngine::new(
        ScriptedOracle {
            behavior: Behavior::Discharge,
        },
        CostTable::default(),
    );
    let result = engine.compile(compile_request(
        request,
        snapshot(8),
        RemainingBudget::unlimited(),
        vec![counterexample(UncertaintyKind::StalePath, &["O5"])],
    ));
    assert_eq!(result.status, CapsuleStatus::Stale);
    assert!(result.executed_probes.is_empty());
}

#[test]
fn mismatched_source_span_hash_returns_stale() {
    let request = query("all calls", 800);
    let engine = CgcrEngine::new(
        ScriptedOracle {
            behavior: Behavior::BadHash,
        },
        CostTable::default(),
    );
    let result = engine.compile(compile_request(
        request,
        snapshot(7),
        RemainingBudget::unlimited(),
        vec![counterexample(UncertaintyKind::DynamicDispatch, &["O3"])],
    ));
    assert_eq!(result.status, CapsuleStatus::Stale);
    assert!(result.facts.is_empty());
}

#[test]
fn adversarial_profiles_have_terminal_status_and_revision_bound_facts() {
    let mut unsupported_negative = 0_u32;
    for index in 0..20 {
        let behavior = if index % 3 == 0 {
            Behavior::Residual
        } else {
            Behavior::Discharge
        };
        let engine = CgcrEngine::new(ScriptedOracle { behavior }, CostTable::default());
        let request = query(&format!("all calls profile {index}"), 800);
        let result = engine.compile(compile_request(
            request,
            snapshot(7),
            RemainingBudget::unlimited(),
            vec![counterexample(UncertaintyKind::DynamicDispatch, &["O3"])],
        ));
        if result.unsupported_negative {
            unsupported_negative += 1;
        }
        assert!(matches!(
            result.status,
            CapsuleStatus::CompleteBounded | CapsuleStatus::Partial
        ));
        for fact in &result.facts {
            assert_eq!(fact.snapshot, snapshot(7));
            assert_eq!(fact.span.source_hash, snapshot(7).working_tree_digest);
        }
        println!(
            "profile={index} status={:?} facts={} residual={}",
            result.status,
            result.facts.len(),
            result.residual.len()
        );
    }
    println!("unsupported_negative_rate={unsupported_negative}/20");
    assert_eq!(unsupported_negative, 0);
}
