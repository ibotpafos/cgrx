use cgrx_core::{
    ByteRange, ConfidenceClass, EdgeEvidence, Hash32, Mode, QueryRequest, RelationKind,
    ResolverClass, Scope,
};
use cgrx_languages::Span;
use cgrx_retrieval::{
    BaseGraph, CandidateProvenance, GraphArc, GraphDocument, RetrievalEngine, SnapshotView,
    Uncertainty, path_in_scope,
};
use cgrx_store::DeltaOverlay;
use std::collections::BTreeMap;
use std::hint::black_box;
use std::time::{Duration, Instant};

fn hash(value: u8) -> Hash32 {
    Hash32([value; 32])
}

fn arc(source: u64, target: u64, confidence: ConfidenceClass) -> GraphArc {
    GraphArc {
        source,
        target,
        kind: cgrx_core::RelationKind::Calls,
        evidence: EdgeEvidence {
            path: "src/main.rs".to_owned(),
            span: ByteRange::new(10, 18),
            source_hash: Hash32([1; 32]),
            resolver: if confidence == ConfidenceClass::Proven {
                ResolverClass::SyntaxExact
            } else {
                ResolverClass::HeuristicCandidate
            },
            confidence,
            assumptions: Vec::new(),
            counter_evidence: Vec::new(),
        },
    }
}

fn document(id: u64, qualified_name: &str, path: &str, text: &str) -> GraphDocument {
    GraphDocument {
        node_id: id,
        qualified_name: qualified_name.to_owned(),
        path: path.to_owned(),
        text: text.to_owned(),
        span: Span {
            start: 0,
            end: text.len(),
        },
        provenance: CandidateProvenance::Syntax,
        semantic_fingerprint: None,
    }
}

fn request(task: &str, max_depth: u8) -> QueryRequest {
    QueryRequest {
        task: task.to_owned(),
        scope: Scope {
            include: vec!["src/**".to_owned()],
            exclude: Vec::new(),
            relation_kinds: vec![RelationKind::Calls],
            max_depth,
        },
        mode: Mode::Precise,
        token_budget: 800,
    }
}

#[test]
fn scope_globs_match_recursive_files_and_apply_exclusions() {
    let recursive_tsx = Scope {
        include: vec!["frontend/**/pages/*.tsx".to_owned()],
        exclude: vec!["**/Other.tsx".to_owned()],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 2,
    };

    assert!(path_in_scope(
        "frontend/src/pages/TeamDashboard.tsx",
        &recursive_tsx
    ));
    assert!(path_in_scope("frontend/pages/Home.tsx", &recursive_tsx));
    assert!(!path_in_scope(
        "frontend/src/pages/nested/Deep.tsx",
        &recursive_tsx
    ));
    assert!(!path_in_scope(
        "frontend/src/pages/Other.tsx",
        &recursive_tsx
    ));
    assert!(!path_in_scope(
        "frontend/src/pages/TeamDashboard.ts",
        &recursive_tsx
    ));
}

#[test]
fn empty_include_means_all_paths_except_exclusions() {
    let scope = Scope {
        include: Vec::new(),
        exclude: vec!["target/**".to_owned(), "src/private/?.rs".to_owned()],
        relation_kinds: vec![RelationKind::Calls],
        max_depth: 2,
    };

    assert!(path_in_scope("src/public/a.rs", &scope));
    assert!(!path_in_scope("target/debug/cgrx", &scope));
    assert!(!path_in_scope("src/private/a.rs", &scope));
    assert!(path_in_scope("src/private/long.rs", &scope));
}

#[test]
fn exact_qualified_symbol_beats_bm25_text_match() {
    let mut exact = document(1, "billing::charge", "src/billing.rs", "fn charge() {}");
    exact.provenance = CandidateProvenance::Syntax;
    let mut comment = document(
        2,
        "notes::billing_comment",
        "src/notes.rs",
        "comment explaining billing charge retry behavior",
    );
    comment.provenance = CandidateProvenance::Text;
    let base = BaseGraph {
        generation: 7,
        path_hashes: BTreeMap::from([
            (exact.path.clone(), hash(1)),
            (comment.path.clone(), hash(2)),
        ]),
        edges: Vec::new(),
        documents: vec![comment, exact],
        arcs: Vec::new(),
    };
    let overlay = DeltaOverlay::new(7);
    let view = SnapshotView::new(&base, &overlay).unwrap();
    let candidates = RetrievalEngine::default()
        .retrieve(&request("billing::charge", 2), &view)
        .unwrap();

    assert_eq!(candidates.candidates[0].qualified_name, "billing::charge");
    assert!(candidates.candidates[0].scores.exact > 0);
    assert!(
        candidates.candidates[0]
            .selection_reason
            .contains("exact_qualified_name")
    );
}

#[test]
fn graph_cut_emits_traversal_truncated_uncertainty() {
    let documents: Vec<_> = (1..=4)
        .map(|id| {
            document(
                id,
                &format!("graph::node{id}"),
                &format!("src/{id}.rs"),
                "node",
            )
        })
        .collect();
    let mut path_hashes: BTreeMap<_, _> = documents
        .iter()
        .map(|doc| (doc.path.clone(), hash(doc.node_id as u8)))
        .collect();
    path_hashes.insert("src/main.rs".to_owned(), hash(1));
    let arcs = (1..4)
        .map(|source| arc(source, source + 1, ConfidenceClass::Proven))
        .collect();
    let base = BaseGraph {
        generation: 7,
        path_hashes,
        edges: Vec::new(),
        documents,
        arcs,
    };
    let overlay = DeltaOverlay::new(7);
    let view = SnapshotView::new(&base, &overlay).unwrap();
    let result = RetrievalEngine::default()
        .retrieve(&request("graph::node1", 2), &view)
        .unwrap();

    assert!(
        result
            .candidates
            .iter()
            .any(|candidate| candidate.node_id == 3)
    );
    assert!(
        result
            .candidates
            .iter()
            .find(|candidate| candidate.node_id == 3)
            .is_some_and(|candidate| candidate.scores.graph > 0)
    );
    assert!(
        result
            .candidates
            .iter()
            .find(|candidate| candidate.node_id == 4)
            .is_none_or(|candidate| candidate.scores.graph == 0)
    );
    assert!(result.uncertainties.iter().any(|uncertainty| matches!(
        uncertainty,
        Uncertainty::TraversalTruncated { max_depth: 2, .. }
    )));
}

#[test]
fn candidate_arc_never_enters_definitive_graph_results() {
    let root = document(1, "target", "src/main.rs", "target");
    let candidate = document(
        2,
        "candidate_neighbor",
        "src/candidate.rs",
        "candidate_neighbor",
    );
    let proven = document(3, "proven_neighbor", "src/proven.rs", "proven_neighbor");
    let base = BaseGraph {
        generation: 7,
        path_hashes: BTreeMap::from([("src/main.rs".to_owned(), hash(1))]),
        edges: Vec::new(),
        documents: vec![root, candidate, proven],
        arcs: vec![
            arc(1, 2, ConfidenceClass::Candidate),
            arc(1, 3, ConfidenceClass::Proven),
        ],
    };
    let overlay = DeltaOverlay::new(7);
    let view = SnapshotView::new(&base, &overlay).unwrap();
    let result = RetrievalEngine::default()
        .retrieve(&request("target", 2), &view)
        .unwrap();
    let ids: Vec<_> = result.candidates.iter().map(|item| item.node_id).collect();
    assert!(ids.contains(&3));
    assert!(!ids.contains(&2));
}

#[test]
fn identical_inputs_produce_byte_stable_candidate_order_and_scores() {
    let base = BaseGraph {
        generation: 7,
        path_hashes: BTreeMap::from([("src/a.rs".to_owned(), hash(1))]),
        edges: Vec::new(),
        documents: vec![document(1, "a::chargeNow", "src/a.rs", "charge now")],
        arcs: Vec::new(),
    };
    let overlay = DeltaOverlay::new(7);
    let view = SnapshotView::new(&base, &overlay).unwrap();
    let engine = RetrievalEngine::default();
    let expected = engine.retrieve(&request("charge_now", 2), &view).unwrap();
    for _ in 0..100 {
        assert_eq!(
            engine.retrieve(&request("charge_now", 2), &view).unwrap(),
            expected
        );
    }
}

#[test]
#[ignore = "release-only latency contract"]
fn retrieval_latency_gates() {
    let documents: Vec<_> = (0..1_000)
        .map(|id| {
            document(
                id,
                &format!("service::{id}::charge"),
                &format!("src/{id}.rs"),
                "charge payment retry handler",
            )
        })
        .collect();
    let path_hashes = documents
        .iter()
        .map(|doc| (doc.path.clone(), hash((doc.node_id % 251) as u8)))
        .collect();
    let arcs = (0..999)
        .map(|source| arc(source, source + 1, ConfidenceClass::Proven))
        .collect();
    let base = BaseGraph {
        generation: 7,
        path_hashes,
        edges: Vec::new(),
        documents,
        arcs,
    };
    let overlay = DeltaOverlay::new(7);
    let view = SnapshotView::new(&base, &overlay).unwrap();
    let engine = RetrievalEngine::default();
    let mut exact_samples = Vec::with_capacity(200);
    let mut graph_samples = Vec::with_capacity(200);
    for _ in 0..200 {
        let start = Instant::now();
        black_box(
            engine
                .retrieve(&request("service::500::charge", 0), &view)
                .unwrap(),
        );
        exact_samples.push(start.elapsed());
        let start = Instant::now();
        black_box(
            engine
                .retrieve(&request("service::0::charge", 5), &view)
                .unwrap(),
        );
        graph_samples.push(start.elapsed());
    }
    fn report(name: &str, values: &mut [Duration]) -> Duration {
        values.sort();
        let p50 = values[(values.len() - 1) * 50 / 100];
        let p95 = values[(values.len() - 1) * 95 / 100];
        let p99 = values[(values.len() - 1) * 99 / 100];
        println!("{name}_p50_ns={}", p50.as_nanos());
        println!("{name}_p95_ns={}", p95.as_nanos());
        println!("{name}_p99_ns={}", p99.as_nanos());
        p95
    }
    assert!(report("exact", &mut exact_samples).as_millis() < 3);
    assert!(report("depth5", &mut graph_samples).as_millis() < 8);
}

#[test]
fn definitive_arcs_reject_stale_missing_and_dead_endpoint_proofs() {
    for defect in ["none", "hash", "missing", "source", "target"] {
        let mut base = BaseGraph {
            generation: 7,
            path_hashes: BTreeMap::from([("src/main.rs".to_owned(), hash(1))]),
            edges: vec![],
            documents: vec![
                document(1, "root", "src/main.rs", "root"),
                document(2, "neighbor", "src/other.rs", "neighbor"),
            ],
            arcs: vec![arc(1, 2, ConfidenceClass::Proven)],
        };
        match defect {
            "hash" => base.arcs[0].evidence.source_hash = hash(2),
            "missing" => {
                base.path_hashes.clear();
            }
            "source" => base.arcs[0].source = 99,
            "target" => base.arcs[0].target = 99,
            _ => {}
        }
        let overlay = DeltaOverlay::new(7);
        let view = SnapshotView::new(&base, &overlay).unwrap();
        assert_eq!(
            view.definitive_arcs().count(),
            usize::from(defect == "none"),
            "{defect}"
        );
        let result = RetrievalEngine::default()
            .retrieve(&request("root", 1), &view)
            .unwrap();
        assert_eq!(
            result
                .candidates
                .iter()
                .any(|c| c.node_id == 2 && c.scores.graph > 0),
            defect == "none",
            "{defect}"
        );
    }
}

#[test]
fn body_edit_overlay_with_same_node_id_does_not_reuse_base_arc() {
    let path = std::path::Path::new("src/main.rs");
    let old = b"fn root() { neighbor(); }";
    let new = b"fn root() { }";
    let pack = cgrx_languages::pack_for_path(path).unwrap();
    let mut overlay = DeltaOverlay::new(7);
    overlay
        .apply(path, hash(1), hash(2), pack.extract(path, old).unwrap())
        .unwrap();
    let empty = BaseGraph {
        generation: 7,
        path_hashes: BTreeMap::new(),
        edges: vec![],
        documents: vec![],
        arcs: vec![],
    };
    let root = SnapshotView::new(&empty, &overlay)
        .unwrap()
        .documents()
        .remove(0);
    let mut proof = arc(root.node_id, 2, ConfidenceClass::Proven);
    proof.evidence.source_hash = hash(2);
    let base = BaseGraph {
        generation: 7,
        path_hashes: BTreeMap::from([("src/main.rs".to_owned(), hash(2))]),
        edges: vec![],
        documents: vec![
            root.clone(),
            document(2, "neighbor", "src/other.rs", "neighbor"),
        ],
        arcs: vec![proof],
    };
    let mut changed = DeltaOverlay::new(7);
    changed
        .apply(path, hash(2), hash(3), pack.extract(path, new).unwrap())
        .unwrap();
    let view = SnapshotView::new(&base, &changed).unwrap();
    assert!(view.documents().iter().any(|d| d.node_id == root.node_id));
    assert_eq!(view.definitive_arcs().count(), 0);
    let result = RetrievalEngine::default()
        .retrieve(&request("root", 1), &view)
        .unwrap();
    assert!(
        !result
            .candidates
            .iter()
            .any(|c| c.node_id == 2 && c.scores.graph > 0)
    );
}

#[test]
fn directory_scopes_accept_root_and_relative_prefixes() {
    for pattern in [".", "./", "././", "src", "src/", "./src", "./src/"] {
        let mut scope = request("", 1).scope;
        scope.include = vec![pattern.to_owned()];
        assert!(path_in_scope("src/nested/main.rs", &scope), "{pattern}");
        if ![".", "./", "././"].contains(&pattern) {
            assert!(!path_in_scope("src-other/main.rs", &scope), "{pattern}");
            assert!(!path_in_scope("other/src/main.rs", &scope), "{pattern}");
        }
    }
}

#[test]
fn directory_scopes_preserve_exclusions_files_and_globs() {
    let mut scope = request("", 1).scope;
    scope.include = vec![".".to_owned()];
    scope.exclude = vec!["src/private".to_owned()];
    assert!(!path_in_scope("src/private/a.rs", &scope));
    assert!(path_in_scope("src/private-other/a.rs", &scope));
    scope.include = vec!["src/main.rs".to_owned()];
    assert!(path_in_scope("src/main.rs", &scope));
    assert!(!path_in_scope("src/main.rs.bak", &scope));
    scope.include = vec!["./src/*.rs".to_owned()];
    assert!(path_in_scope("src/main.rs", &scope));
    assert!(!path_in_scope("src/nested/main.rs", &scope));
    scope.exclude = vec![".".to_owned()];
    assert!(!path_in_scope("src/main.rs", &scope));
}

#[test]
fn directory_scopes_do_not_broaden_empty_absolute_or_parent_patterns() {
    let mut scope = request("", 1).scope;
    for pattern in ["", "/", "../src", "/src"] {
        scope.include = vec![pattern.to_owned()];
        assert!(!path_in_scope("src/main.rs", &scope), "{pattern}");
    }
    scope.include = vec!["данные".to_owned()];
    assert!(path_in_scope("данные/main.rs", &scope));
    assert!(!path_in_scope("данные2/main.rs", &scope));
}
