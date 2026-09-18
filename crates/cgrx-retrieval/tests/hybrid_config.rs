//! Per-engine mode isolation and backwards-compatible environment opt-in.
use cgrx_core::{Mode, QueryRequest, Scope};
use cgrx_languages::Span;
use cgrx_retrieval::{
    BaseGraph, CandidateProvenance, CandidateSet, FusionProfile, GraphDocument, RetrievalEngine,
    SnapshotView,
};
use cgrx_store::DeltaOverlay;
use std::collections::BTreeMap;
use std::process::Command;
use std::sync::Barrier;

fn retrieve(engine: RetrievalEngine) -> CandidateSet {
    let body = "let x = 1; let y = 2; return x + y;";
    let documents = [(1, "processData", body), (2, "transformValue", body)]
        .into_iter()
        .map(|(node_id, name, text)| GraphDocument {
            node_id,
            qualified_name: name.to_owned(),
            path: "src/lib.rs".to_owned(),
            text: text.to_owned(),
            span: Span { start: 0, end: 10 },
            provenance: CandidateProvenance::Syntax,
            semantic_fingerprint: None,
        })
        .collect();
    let base = BaseGraph {
        generation: 1,
        path_hashes: BTreeMap::new(),
        edges: Vec::new(),
        documents,
        arcs: Vec::new(),
    };
    let overlay = DeltaOverlay::new(1);
    let view = SnapshotView::new(&base, &overlay).unwrap();
    let request = QueryRequest {
        task: "transformValue".to_owned(),
        scope: Scope {
            include: Vec::new(),
            exclude: Vec::new(),
            relation_kinds: Vec::new(),
            max_depth: 2,
        },
        mode: Mode::Precise,
        token_budget: 1000,
    };
    engine.retrieve(&request, &view).unwrap()
}

fn assert_mode(result: &CandidateSet, enabled: bool) {
    let ids: Vec<_> = result.candidates.iter().map(|c| c.node_id).collect();
    if enabled {
        assert_eq!(ids, vec![2, 1]);
        assert!(result.candidates.iter().all(|c| c.scores.structural > 0));
    } else {
        assert_eq!(ids, vec![2]);
        assert!(result.candidates.iter().all(|c| c.scores.structural == 0));
        assert!(result.candidates.iter().all(|c| !c
            .selection_reason
            .contains("structural_fingerprint")));
    }
    assert!(result.uncertainties.is_empty());
}

#[test]
fn opposite_modes_are_deterministic_under_parallel_load() {
    // Equal weights ensure that the override, not a zero-weight workaround,
    // keeps structural candidates out of the disabled engine.
    let engines = [
        RetrievalEngine::default().with_hybrid(false),
        RetrievalEngine::default().with_hybrid(true),
    ];
    let expected = [retrieve(engines[0]), retrieve(engines[1])];
    assert_mode(&expected[0], false);
    assert_mode(&expected[1], true);
    let start = Barrier::new(8);
    std::thread::scope(|scope| {
        for worker in 0..8 {
            let start = &start;
            let expected = &expected;
            scope.spawn(move || {
                start.wait();
                for iteration in 0..32 {
                    let mode = (worker + iteration) % 2;
                    assert_eq!(retrieve(engines[mode]), expected[mode]);
                }
            });
        }
    });
}

#[test]
fn environment_opt_in_and_explicit_overrides_in_fresh_processes() {
    // Command::env affects only the child. Never mutate the multithreaded
    // test process's environment, even behind a test-local mutex.
    for value in [None, Some("1"), Some("0"), Some(""), Some("true"), Some(" 1")] {
        let mut child = Command::new(std::env::current_exe().unwrap());
        child.args(["--exact", "environment_configuration_child", "--nocapture"]);
        child.env(
            "CGRX_TEST_HYBRID_CHILD",
            if value == Some("1") { "on" } else { "off" },
        );
        child.env_remove("CGRX_HYBRID");
        if let Some(value) = value {
            child.env("CGRX_HYBRID", value);
        }
        let output = child.output().unwrap();
        assert!(
            output.status.success(),
            "environment case {value:?}:\n{}\n{}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr),
        );
        assert!(String::from_utf8_lossy(&output.stdout).contains("hybrid environment verified"));
    }
}

#[test]
fn environment_configuration_child() {
    let Ok(mode) = std::env::var("CGRX_TEST_HYBRID_CHILD") else {
        return;
    };
    assert!(matches!(mode.as_str(), "on" | "off"));
    let enabled = mode == "on";
    let automatic = retrieve(RetrievalEngine::default());
    assert_mode(&automatic, enabled);
    assert_eq!(
        automatic,
        retrieve(RetrievalEngine::new(FusionProfile::default()))
    );
    for explicit in [false, true] {
        let engine = RetrievalEngine::default().with_hybrid(explicit);
        assert_mode(&retrieve(engine), explicit);
        assert_mode(&retrieve(engine.with_hybrid(!explicit)), !explicit);
    }
    println!("hybrid environment verified");
}
