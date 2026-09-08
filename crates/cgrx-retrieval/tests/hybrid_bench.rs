/// Benchmark: BM25 baseline vs Hybrid (BM25 + exact + structural) on 3 queries.
///
/// Run with: `cargo test -p cgrx-retrieval --test hybrid_bench -- --nocapture`
use cgrx_core::{Mode, QueryRequest, Scope};
use cgrx_languages::Span;
use cgrx_retrieval::{
    BaseGraph, CandidateSet, FusionProfile, GraphDocument, RetrievalEngine, SnapshotView,
};
use cgrx_store::DeltaOverlay;
use std::collections::BTreeMap;

fn doc(node_id: u64, name: &str, text: &str) -> GraphDocument {
    GraphDocument {
        node_id,
        qualified_name: name.to_string(),
        path: "src/lib.rs".to_string(),
        text: text.to_string(),
        span: Span { start: 0, end: 10 },
        provenance: cgrx_retrieval::CandidateProvenance::Syntax,
        semantic_fingerprint: None,
    }
}

fn base_scope() -> Scope {
    Scope {
        include: Vec::new(),
        exclude: Vec::new(),
        relation_kinds: Vec::new(),
        max_depth: 2,
    }
}

fn build_view(docs: Vec<GraphDocument>) -> (BaseGraph, DeltaOverlay) {
    let base = BaseGraph {
        generation: 1,
        path_hashes: BTreeMap::new(),
        edges: Vec::new(),
        documents: docs,
        arcs: Vec::new(),
    };
    let overlay = DeltaOverlay::new(1);
    (base, overlay)
}

fn run_retrieval(
    _docs: &[GraphDocument],
    base: &BaseGraph,
    overlay: &DeltaOverlay,
    task: &str,
    profile: FusionProfile,
) -> CandidateSet {
    let view = SnapshotView::new(base, overlay).unwrap();
    let request = QueryRequest {
        task: task.to_string(),
        scope: base_scope(),
        mode: Mode::Precise,
        token_budget: 1000,
    };
    RetrievalEngine::new(profile)
        .retrieve(&request, &view)
        .unwrap()
}

fn baseline_profile() -> FusionProfile {
    FusionProfile {
        rrf_k: 60,
        exact_weight: 4,
        bm25_weight: 1,
        graph_weight: 0,
        structural_weight: 0,
        max_candidates: 50,
    }
}

fn hybrid_profile() -> FusionProfile {
    FusionProfile {
        rrf_k: 60,
        exact_weight: 4,
        bm25_weight: 1,
        graph_weight: 0,
        structural_weight: 3,
        max_candidates: 50,
    }
}

fn print_results(_label: &str, candidates: &[cgrx_retrieval::Candidate]) {
    for (i, c) in candidates.iter().enumerate().take(5) {
        println!(
            "  {}. [{}] {} (rrf={}, structural={}, exact={}, bm25={})",
            i + 1,
            c.node_id,
            c.qualified_name,
            c.scores.rrf,
            c.scores.structural,
            c.scores.exact,
            c.scores.bm25,
        );
    }
    if candidates.is_empty() {
        println!("  (no results)");
    }
}

#[test]
fn hybrid_bench_query1_renamed_symbol_same_body() {
    println!("\n=== Query 1: 'transformValue' (renamed, same body) ===");
    let docs = vec![
        doc(1, "processData", "let x = 1; let y = 2; return x + y;"),
        doc(2, "transformValue", "let x = 1; let y = 2; return x + y;"),
        doc(3, "unrelatedA", "fn nothing_a() {}"),
        doc(4, "unrelatedB", "fn nothing_b() {}"),
        doc(5, "unrelatedC", "fn nothing_c() {}"),
    ];
    let (base, overlay) = build_view(docs.clone());

    let baseline = run_retrieval(&docs, &base, &overlay, "transformValue", baseline_profile());
    unsafe { std::env::set_var("CGRX_HYBRID", "1") };
    let hybrid = run_retrieval(&docs, &base, &overlay, "transformValue", hybrid_profile());
    unsafe { std::env::remove_var("CGRX_HYBRID") };

    println!("BM25 baseline ({} candidates):", baseline.candidates.len());
    print_results("baseline", &baseline.candidates);
    println!("Hybrid ({} candidates):", hybrid.candidates.len());
    print_results("hybrid", &hybrid.candidates);

    let hybrid_ids: Vec<u64> = hybrid.candidates.iter().map(|c| c.node_id).collect();
    assert!(hybrid_ids.contains(&2), "hybrid should find exact match");
    assert!(
        hybrid_ids.contains(&1),
        "hybrid should find renamed symbol with same body"
    );
}

#[test]
fn hybrid_bench_query2_partial_name_overlap() {
    println!("\n=== Query 2: 'DataProcessor' (partial name overlap, different bodies) ===");
    let docs = vec![
        doc(1, "processData", "let x = 1; let y = 2; return x + y;"),
        doc(2, "DataProcessor", "fn complex_logic() { return 42; }"),
        doc(
            3,
            "DataValidator",
            "fn validate(data) { return data != null; }",
        ),
        doc(
            4,
            "UserAuthenticator",
            "fn authenticate(user) { return check(user); }",
        ),
    ];
    let (base, overlay) = build_view(docs.clone());

    let baseline = run_retrieval(&docs, &base, &overlay, "DataProcessor", baseline_profile());
    unsafe { std::env::set_var("CGRX_HYBRID", "1") };
    let hybrid = run_retrieval(&docs, &base, &overlay, "DataProcessor", hybrid_profile());
    unsafe { std::env::remove_var("CGRX_HYBRID") };

    println!("BM25 baseline ({} candidates):", baseline.candidates.len());
    print_results("baseline", &baseline.candidates);
    println!("Hybrid ({} candidates):", hybrid.candidates.len());
    print_results("hybrid", &hybrid.candidates);

    let hybrid_ids: Vec<u64> = hybrid.candidates.iter().map(|c| c.node_id).collect();
    assert!(hybrid_ids.contains(&2), "hybrid should find exact match");
}

#[test]
fn hybrid_bench_query3_rewrite_similar_body() {
    println!("\n=== Query 3: 'computeTotal' (rewritten body, same logic) ===");
    let docs = vec![
        doc(
            1,
            "calculateSum",
            "let total = 0; for (let i = 0; i < arr.length; i++) { total += arr[i]; } return total;",
        ),
        doc(
            2,
            "computeTotal",
            "let total = 0; for (let i = 0; i < arr.length; i++) { total += arr[i]; } return total;",
        ),
        doc(3, "printArray", "console.log('not related at all');"),
    ];
    let (base, overlay) = build_view(docs.clone());

    let baseline = run_retrieval(&docs, &base, &overlay, "computeTotal", baseline_profile());
    unsafe { std::env::set_var("CGRX_HYBRID", "1") };
    let hybrid = run_retrieval(&docs, &base, &overlay, "computeTotal", hybrid_profile());
    unsafe { std::env::remove_var("CGRX_HYBRID") };

    println!("BM25 baseline ({} candidates):", baseline.candidates.len());
    print_results("baseline", &baseline.candidates);
    println!("Hybrid ({} candidates):", hybrid.candidates.len());
    print_results("hybrid", &hybrid.candidates);

    let hybrid_ids: Vec<u64> = hybrid.candidates.iter().map(|c| c.node_id).collect();
    assert!(hybrid_ids.contains(&2), "hybrid should find exact match");
    assert!(
        hybrid_ids.contains(&1),
        "hybrid should find renamed symbol with identical body"
    );
}
