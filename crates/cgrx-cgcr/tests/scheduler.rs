use cgrx_capsule::ObligationId;
use cgrx_cgcr::{
    CostTable, Counterexample, ProbeKind, RemainingBudget, UncertaintyKind, choose_probe,
};

#[test]
fn stale_file_selects_hash_reparse_before_lsp() {
    let counterexample = Counterexample {
        id: "stale:src/main.ts".to_owned(),
        uncertainty: UncertaintyKind::StalePath,
        target: "src/main.ts".to_owned(),
        obligation_ids: vec![ObligationId("O5".to_owned())],
        allowed: vec![ProbeKind::LspCommand, ProbeKind::ReparseRange],
    };
    let probe = choose_probe(
        &[counterexample],
        &CostTable::default(),
        RemainingBudget {
            latency_us: 1_000_000,
            source_bytes: 1_000_000,
            token_delta: 800,
        },
    )
    .expect("probe fits");
    assert_eq!(probe.kind, ProbeKind::ReparseRange);
    assert_eq!(probe.id, "stale:src/main.ts:reparse");
}

#[test]
fn stable_probe_id_breaks_equal_cost_ties() {
    let costs = CostTable::uniform(10, 10, 10);
    let open = vec![
        Counterexample {
            id: "b".to_owned(),
            uncertainty: UncertaintyKind::DynamicDispatch,
            target: "b".to_owned(),
            obligation_ids: vec![ObligationId("O3".to_owned())],
            allowed: vec![ProbeKind::SourceScan],
        },
        Counterexample {
            id: "a".to_owned(),
            uncertainty: UncertaintyKind::DynamicDispatch,
            target: "a".to_owned(),
            obligation_ids: vec![ObligationId("O3".to_owned())],
            allowed: vec![ProbeKind::SourceScan],
        },
    ];
    let probe = choose_probe(&open, &costs, RemainingBudget::unlimited()).unwrap();
    assert_eq!(probe.id, "a:source_scan");
}

#[test]
fn default_oracle_order_prefers_source_scan_before_scip_and_lsp() {
    let counterexample = Counterexample {
        id: "dynamic".to_owned(),
        uncertainty: UncertaintyKind::DynamicDispatch,
        target: "src/main.ts".to_owned(),
        obligation_ids: vec![ObligationId("O3".to_owned())],
        allowed: vec![
            ProbeKind::LspCommand,
            ProbeKind::ImportedScip,
            ProbeKind::SourceScan,
        ],
    };
    let probe = choose_probe(
        &[counterexample],
        &CostTable::default(),
        RemainingBudget::unlimited(),
    )
    .unwrap();
    assert_eq!(probe.kind, ProbeKind::SourceScan);
}
