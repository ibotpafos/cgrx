//! Tests for runtime module.

#[cfg(test)]
use std::collections::{BTreeMap, BTreeSet};

#[cfg(test)]
use cgrx_core::{Hash32, Scope};

#[cfg(test)]
#[allow(unused_imports)]
use cgrx_languages::Span;

#[cfg(test)]
use super::scan_helpers::{rebuild_query_index, syntax_document};
#[cfg(test)]
use super::*;

#[cfg(test)]
fn rebuild_arcs(
    documents: &[StoredDocument],
    path_hashes: &BTreeMap<String, Hash32>,
    go_modules: &BTreeMap<String, String>,
) -> Vec<StoredArc> {
    rebuild_arcs_with_cargo(
        documents,
        path_hashes,
        go_modules,
        &BTreeMap::new(),
        &BTreeMap::new(),
        &BTreeMap::new(),
        &BTreeMap::new(),
    )
}

#[allow(unused_imports)]
use super::git_helpers::{git_bytes, git_text, store_writer_error};

#[cfg(test)]
mod proof_edge_tests {
    use super::*;
    #[test]
    fn unreadable_config_presence_is_an_explicit_resolution_blocker() {
        let mut hashes = BTreeMap::new();
        let mut files = BTreeMap::new();
        let mut configs = BTreeMap::new();
        let marker = Hash32([9; 32]);
        store_ts_presence_blocker(
            "src/tsconfig.json",
            marker,
            &mut hashes,
            &mut files,
            &mut configs,
        );
        assert_eq!(hashes.get("src/tsconfig.json"), Some(&marker));
        assert!(!configs["src/tsconfig.json"].supported);
        assert!(files["src/tsconfig.json"].inventory_only);
        assert!(!ts_config_supported_for("src/main.ts", &configs));
    }

    #[test]
    fn rust_module_proof_missing_stale_or_duplicate_metadata_never_guesses() {
        let source = b"fn run() {} mod inner { fn run() {} fn caller() { self::run(); } }";
        let extracted = extract_path("main.rs", source).unwrap();
        let hashes = BTreeMap::from([(
            "main.rs".to_owned(),
            Hash32(*blake3::hash(source).as_bytes()),
        )]);
        assert_eq!(
            rebuild_arcs(&extracted.documents, &hashes, &BTreeMap::new()).len(),
            1
        );
        for case in ["missing", "caller", "target", "tag", "duplicate"] {
            let mut docs = extracted.documents.clone();
            let call = docs
                .iter_mut()
                .find(|d| d.rust_module_target.is_some())
                .unwrap();
            match case {
                "missing" => call.rust_module_target = None,
                "caller" => call.rust_module_target.as_mut().unwrap().caller.start += 1,
                "target" => call.rust_module_target.as_mut().unwrap().target.start += 1,
                "tag" => call.semantic_tags.retain(|t| t != "RUST_MODULE_CALL"),
                "duplicate" => {
                    let span = call.rust_module_target.as_ref().unwrap().target;
                    let target = docs
                        .iter()
                        .find(|d| d.provenance == "SYNTAX" && d.span_start == span.start)
                        .unwrap()
                        .clone();
                    docs.push(target);
                }
                _ => unreachable!(),
            }
            assert!(
                rebuild_arcs(&docs, &hashes, &BTreeMap::new()).is_empty(),
                "{case}"
            );
        }
    }

    #[test]
    fn rust_self_owner_proof_missing_or_stale_metadata_never_guesses() {
        let source = b"struct A; impl A { fn caller(&self) { self.run(); } fn run(&self) {} }";
        let extracted = extract_path("main.rs", source).unwrap();
        let hashes = BTreeMap::from([(
            "main.rs".to_owned(),
            Hash32(*blake3::hash(source).as_bytes()),
        )]);
        assert_eq!(
            rebuild_arcs(&extracted.documents, &hashes, &BTreeMap::new()).len(),
            1
        );
        for case in [
            "missing",
            "caller",
            "target",
            "owner",
            "impl",
            "target_impl",
            "missing_target_impl",
            "tag",
        ] {
            let mut docs = extracted.documents.clone();
            let call = docs
                .iter_mut()
                .find(|d| d.rust_self_target.is_some())
                .unwrap();
            if case == "missing" {
                call.rust_self_target = None;
            } else if case == "tag" {
                call.semantic_tags.retain(|t| t != "RUST_SELF_CALL");
            } else {
                let proof = call.rust_self_target.as_mut().unwrap();
                match case {
                    "caller" => proof.caller.start += 1,
                    "target" => proof.target.start += 1,
                    "owner" => proof.owner.start += 1,
                    "impl" => proof.implementation.end = proof.implementation.start,
                    "target_impl" => proof.target_implementation.as_mut().unwrap().end = 0,
                    "missing_target_impl" => proof.target_implementation = None,
                    _ => unreachable!(),
                }
            }
            assert!(
                rebuild_arcs(&docs, &hashes, &BTreeMap::new()).is_empty(),
                "{case}"
            );
        }
    }

    use cgrx_core::Mode;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::time::{SystemTime, UNIX_EPOCH};

    static TEST_DIRECTORY_SEQUENCE: AtomicU64 = AtomicU64::new(0);

    struct TestDirectory(PathBuf);

    impl TestDirectory {
        fn new(label: &str) -> Self {
            let nonce = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock after epoch")
                .as_nanos();
            let sequence = TEST_DIRECTORY_SEQUENCE.fetch_add(1, Ordering::Relaxed);
            let path = std::env::temp_dir().join(format!(
                "cgrx-{label}-{}-{nonce}-{sequence}",
                std::process::id()
            ));
            fs::create_dir_all(&path).expect("create test directory");
            Self(path)
        }

        fn path(&self) -> &Path {
            &self.0
        }
    }

    impl Drop for TestDirectory {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn git(root: &Path, args: &[&str]) {
        assert!(
            std::process::Command::new("git")
                .args(args)
                .current_dir(root)
                .status()
                .expect("git executable")
                .success(),
            "git command failed: {args:?}"
        );
    }

    fn refresh_fixture(label: &str) -> (TestDirectory, TestDirectory, Runtime, StoredArc) {
        let repository = TestDirectory::new(label);
        git(repository.path(), &["init", "-q"]);
        git(
            repository.path(),
            &["config", "user.email", "test@example.invalid"],
        );
        git(repository.path(), &["config", "user.name", "CGRX Test"]);
        fs::write(
            repository.path().join("impl.rs"),
            b"fn implementation() {}\nfn contract() {}\n",
        )
        .expect("write implementation fixture");
        fs::write(
            repository.path().join("calls.rs"),
            b"fn target() {}\nfn caller() { target(); }\n",
        )
        .expect("write call fixture");
        git(repository.path(), &["add", "."]);
        git(repository.path(), &["commit", "-qm", "fixture"]);
        let state = TestDirectory::new(&format!("{label}-state"));
        Runtime::index(repository.path(), state.path()).expect("index repository");
        let mut runtime = Runtime::open(state.path()).expect("open runtime");
        let node_ids: Vec<_> = runtime
            .stored
            .documents
            .iter()
            .filter(|document| document.provenance == "SYNTAX" && document.path == "impl.rs")
            .map(|document| document.node_id)
            .collect();
        let preserved = StoredArc {
            source: node_ids[0],
            target: node_ids[1],
            kind: RelationKind::Implements,
            evidence: Some(EdgeEvidence {
                path: "impl.rs".to_owned(),
                span: ByteRange::new(0, 21),
                source_hash: runtime.stored.path_hashes["impl.rs"],
                resolver: ResolverClass::CompilerConfirmed,
                confidence: ConfidenceClass::Proven,
                assumptions: Vec::new(),
                counter_evidence: Vec::new(),
            }),
        };
        runtime.stored.arcs.push(preserved.clone());
        rebuild_query_index(&mut runtime.stored);
        (repository, state, runtime, preserved)
    }

    fn syntax(node_id: u64, name: &str, path: &str, start: usize, end: usize) -> StoredDocument {
        StoredDocument {
            php_function_target: None,
            php_type_target: None,
            rust_module_target: None,
            rust_self_target: None,
            ts_lexical_target: None,
            ts_constructor_target: None,
            go_field_target: None,
            go_local_constructor_target: None,
            java_constructor_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: None,
            go_receiver_target: None,
            semantic_fingerprint: None,
            node_id,
            qualified_name: name.to_owned(),
            path: path.to_owned(),
            text: name.to_owned(),
            search_text: name.to_owned(),
            span_start: start,
            span_end: end,
            body_start: start,
            body_end: end,
            provenance: "SYNTAX".to_owned(),
            semantic_tags: Vec::new(),
        }
    }

    fn call(node_id: u64, name: &str, path: &str, start: usize, end: usize) -> StoredDocument {
        StoredDocument {
            php_function_target: None,
            php_type_target: None,
            rust_module_target: None,
            rust_self_target: None,
            ts_lexical_target: None,
            ts_constructor_target: None,
            go_field_target: None,
            go_local_constructor_target: None,
            java_constructor_target: None,
            go_import_path: None,
            go_import_explicit_alias: false,
            go_package: None,
            go_receiver_target: None,
            semantic_fingerprint: None,
            node_id,
            qualified_name: name.to_owned(),
            path: path.to_owned(),
            text: name.to_owned(),
            search_text: name.to_owned(),
            span_start: start,
            span_end: end,
            body_start: start,
            body_end: end,
            provenance: "CALLS".to_owned(),
            semantic_tags: vec!["EXACT_CALL".to_owned()],
        }
    }

    #[test]
    fn go_field_exact_proof_never_falls_back_with_missing_or_stale_identity() {
        let source = b"package queue\ntype TaskQueue struct { items PriorityQueue }\ntype PriorityQueue []int\nfunc (p PriorityQueue) Len() int { return 0 }\nfunc (q *TaskQueue) Peek() int { return q.items.Len() }";
        let documents = extract_path("queue.go", source).unwrap().documents;
        let hashes = BTreeMap::from([(
            "queue.go".to_owned(),
            Hash32(*blake3::hash(source).as_bytes()),
        )]);
        assert_eq!(rebuild_arcs(&documents, &hashes, &BTreeMap::new()).len(), 1);
        let proof = documents
            .iter()
            .find_map(|d| d.go_field_target.clone())
            .unwrap();
        for removed in [
            &proof.caller,
            &proof.receiver_type,
            &proof.field_type,
            &proof.target,
        ] {
            let filtered: Vec<_> = documents
                .iter()
                .filter(|d| {
                    !(d.provenance == "SYNTAX"
                        && d.span_start == removed.start
                        && d.span_end == removed.end)
                })
                .cloned()
                .collect();
            assert!(rebuild_arcs(&filtered, &hashes, &BTreeMap::new()).is_empty());
        }
        for variant in 0..4 {
            let mut changed = documents.clone();
            let call = changed
                .iter_mut()
                .find(|d| d.go_field_target.is_some())
                .unwrap();
            match variant {
                0 => call.go_field_target = None,
                1 => call.go_field_target.as_mut().unwrap().package = "wrong".to_owned(),
                2 => call.go_field_target.as_mut().unwrap().field.end = source.len() + 1,
                _ => call.go_field_target.as_mut().unwrap().caller.start += 1,
            }
            assert!(rebuild_arcs(&changed, &hashes, &BTreeMap::new()).is_empty());
        }
        let mut duplicate = documents.clone();
        duplicate.push(
            documents
                .iter()
                .find(|d| d.provenance == "SYNTAX" && d.span_start == proof.target.start)
                .unwrap()
                .clone(),
        );
        assert!(rebuild_arcs(&duplicate, &hashes, &BTreeMap::new()).is_empty());
    }

    // Frozen pre-cache predicate: keeps the differential control independent
    // of the optimized live-set and membership plumbing.
    fn uncached_definitive_arcs<'a>(stored: &'a StoredIndex, scope: &Scope) -> Vec<&'a StoredArc> {
        let live: BTreeSet<_> = stored
            .documents
            .iter()
            .filter(|document| {
                document.provenance == "SYNTAX" && path_in_scope(&document.path, scope)
            })
            .map(|document| document.node_id)
            .collect();
        stored
            .arcs
            .iter()
            .filter(|arc| {
                scope.relation_kinds.contains(&arc.kind)
                    && live.contains(&arc.source)
                    && live.contains(&arc.target)
                    && arc.evidence.as_ref().is_some_and(|evidence| {
                        evidence.is_definitive()
                            && path_in_scope(&evidence.path, scope)
                            && stored.path_hashes.get(&evidence.path) == Some(&evidence.source_hash)
                    })
            })
            .collect()
    }

    #[test]
    fn query_scope_cache_preserves_document_paths_when_node_ids_collide() {
        let (_repo, _state, mut runtime, mut proof) = refresh_fixture("scope-id-collision");
        runtime.stored.documents = vec![
            syntax(1, "scope_node_root", "a.rs", 0, 10),
            syntax(2, "scope_node_target", "m.rs", 0, 10),
            syntax(1, "scope_node_root", "z.rs", 0, 10),
            syntax(2, "scope_node_target", "zz.rs", 0, 10),
        ];
        proof.source = 1;
        proof.target = 2;
        proof.kind = RelationKind::Calls;
        proof.evidence.as_mut().unwrap().path = "a.rs".into();
        proof.evidence.as_mut().unwrap().source_hash = Hash32([7; 32]);
        runtime
            .stored
            .path_hashes
            .insert("a.rs".into(), Hash32([7; 32]));
        runtime.stored.arcs = vec![proof];
        runtime.stored.coverage = CoverageMetadata::default();
        // Load/refresh normalization deduplicates adjacent IDs after sorting
        // by path, not globally: nonadjacent collisions really do survive.
        normalize_stored(&mut runtime.stored);
        assert_eq!(runtime.stored.documents.len(), 4);
        assert!(syntax_document(&runtime.stored, 1).is_none());
        assert!(syntax_document(&runtime.stored, 2).is_none());
        let scope = Scope {
            exclude: vec!["z*.rs".into()],
            ..proof_scope()
        };
        assert_eq!(
            definitive_stored_arcs(&runtime.stored, &scope),
            uncached_definitive_arcs(&runtime.stored, &scope),
        );
        let baseline_paths: Vec<_> = runtime
            .stored
            .documents
            .iter()
            .filter(|d| d.provenance == "SYNTAX" && path_in_scope(&d.path, &scope))
            .map(|d| d.path.as_str())
            .collect();
        assert_eq!(baseline_paths, ["a.rs", "m.rs"]);
        let searched = runtime.search_graph("scope_node", &scope, 10).unwrap();
        let paths: Vec<_> = searched["matches"]
            .as_array()
            .unwrap()
            .iter()
            .map(|row| row["path"].as_str().unwrap())
            .collect();
        assert_eq!(paths, baseline_paths);
        assert_eq!(searched["matches"][0]["callees"], 1);
        assert_eq!(searched["matches"][1]["callers"], 1);
        for root in ["scope_node_root", "SCOPE_NODE_ROOT"] {
            let trace = runtime
                .trace_path(root, None, "callees", 1, &scope, 10)
                .unwrap();
            assert_eq!(trace["root"]["path"], "a.rs");
            assert_eq!(trace["nodes"].as_array().unwrap().len(), 1);
            assert_eq!(trace["nodes"][0]["path"], "m.rs");
        }
        let callers = runtime
            .trace_path("scope_node_target", None, "callers", 1, &scope, 10)
            .unwrap();
        assert_eq!(callers["root"]["path"], "m.rs");
        assert_eq!(callers["nodes"][0]["path"], "a.rs");
    }

    #[test]
    fn query_scope_cache_preserves_proof_filters_and_distinct_degrees() {
        let (_repo, _state, mut runtime, mut proof) = refresh_fixture("scope-proof-matrix");
        proof.kind = RelationKind::Calls;
        let base_documents = runtime.stored.documents.clone();
        // The evidence file has no document: endpoint membership cannot substitute
        // for checking the evidence path or its hash.
        proof.evidence.as_mut().unwrap().path = "proof.rs".into();
        proof.evidence.as_mut().unwrap().source_hash = Hash32([7; 32]);
        runtime
            .stored
            .path_hashes
            .insert("proof.rs".into(), Hash32([7; 32]));
        for case in [
            "valid",
            "candidate",
            "bounded",
            "unresolved",
            "missing-proof",
            "stale-hash",
            "missing-hash",
            "missing-source",
            "missing-target",
            "non-syntax-source",
            "non-syntax-target",
            "excluded-source",
            "excluded-target",
            "excluded-evidence",
            "different-relation",
        ] {
            runtime.stored.documents = base_documents.clone();
            let mut arc = proof.clone();
            let mut scope = proof_scope();
            let expected = usize::from(case == "valid");
            match case {
                "valid" => {}
                "candidate" => {
                    arc.evidence.as_mut().unwrap().confidence = ConfidenceClass::Candidate
                }
                "bounded" => {
                    arc.evidence.as_mut().unwrap().confidence = ConfidenceClass::BoundedSet
                }
                "unresolved" => {
                    arc.evidence.as_mut().unwrap().confidence = ConfidenceClass::Unresolved
                }
                "missing-proof" => arc.evidence = None,
                "stale-hash" => arc.evidence.as_mut().unwrap().source_hash = Hash32([8; 32]),
                "missing-hash" => arc.evidence.as_mut().unwrap().path = "missing.rs".into(),
                "missing-source" => arc.source = u64::MAX,
                "missing-target" => arc.target = u64::MAX,
                "non-syntax-source" | "non-syntax-target" => {
                    let id = if case == "non-syntax-source" {
                        arc.source
                    } else {
                        arc.target
                    };
                    runtime
                        .stored
                        .documents
                        .iter_mut()
                        .find(|d| d.node_id == id)
                        .unwrap()
                        .provenance = "CALLS".into();
                }
                "excluded-source" | "excluded-target" => {
                    let id = if case == "excluded-source" {
                        arc.source
                    } else {
                        arc.target
                    };
                    runtime
                        .stored
                        .documents
                        .iter_mut()
                        .find(|d| d.node_id == id)
                        .unwrap()
                        .path = "outside.rs".into();
                    scope.exclude.push("outside.rs".into());
                }
                "excluded-evidence" => scope.exclude.push("proof.rs".into()),
                "different-relation" => arc.kind = RelationKind::Implements,
                _ => unreachable!(),
            }
            let mut repeated = arc.clone();
            if let Some(evidence) = repeated.evidence.as_mut() {
                evidence.span = ByteRange::new(30, 40);
            }
            runtime.stored.arcs = vec![arc, repeated];
            rebuild_query_index(&mut runtime.stored);
            let baseline = uncached_definitive_arcs(&runtime.stored, &scope);
            assert_eq!(baseline.len(), expected * 2, "{case}");
            assert_eq!(
                definitive_stored_arcs(&runtime.stored, &scope),
                baseline,
                "{case}"
            );
            for name in ["implementation", "contract"] {
                let found = runtime.search_graph(name, &scope, 10).unwrap();
                for row in found["matches"].as_array().unwrap() {
                    assert_eq!(
                        row["callers"].as_u64().unwrap() + row["callees"].as_u64().unwrap(),
                        expected as u64,
                        "{case}"
                    );
                }
            }
        }
        // Relation identity remains part of degree deduplication; duplicate
        // proofs collapse, while CALLS and IMPLEMENTS remain distinct.
        runtime.stored.documents = base_documents;
        let mut implements = proof.clone();
        implements.kind = RelationKind::Implements;
        runtime.stored.arcs = vec![proof.clone(), proof, implements];
        rebuild_query_index(&mut runtime.stored);
        let mut scope = proof_scope();
        scope.relation_kinds.push(RelationKind::Implements);
        assert_eq!(definitive_stored_arcs(&runtime.stored, &scope).len(), 3);
        assert_eq!(
            runtime.search_graph("implementation", &scope, 10).unwrap()["matches"][0]["callees"],
            2
        );
        assert_eq!(
            runtime.search_graph("contract", &scope, 10).unwrap()["matches"][0]["callers"],
            2
        );
        let usages = runtime
            .find_usages("contract", None, &scope, 1, 10)
            .expect("find proven usages across relations");
        assert_eq!(usages["total"], 2);
        assert_eq!(usages["usages"][0]["relation"], "CALLS");
        assert_eq!(usages["usages"][1]["relation"], "IMPLEMENTS");
    }

    #[test]
    fn query_scope_cache_evaluates_each_consulted_path_once() {
        let (_repo, _state, mut runtime, proof) = refresh_fixture("scope-count");
        for node_id in 100..200 {
            runtime
                .stored
                .documents
                .push(syntax(node_id, "repeated", "excluded.rs", 0, 10));
        }
        // Evidence-only paths must share the cache too, including negative results.
        for path in ["proof.rs", "rejected-proof.rs"] {
            runtime
                .stored
                .path_hashes
                .insert(path.into(), Hash32([7; 32]));
            for _ in 0..100 {
                let mut arc = proof.clone();
                let evidence = arc.evidence.as_mut().unwrap();
                evidence.path = path.into();
                evidence.source_hash = Hash32([7; 32]);
                runtime.stored.arcs.push(arc);
            }
        }
        runtime.stored.coverage.excluded_paths = vec![
            "impl.rs".into(),
            "excluded.rs".into(),
            "coverage-only.rs".into(),
        ];
        runtime.stored.coverage.stale_paths = vec!["coverage-only.rs".into(), "proof.rs".into()];
        runtime.stored.coverage.dynamic_dispatch =
            vec!["impl.rs:1-2".into(), "coverage-only.rs:3-4".into()];
        runtime.stored.coverage.parser_error_ranges = vec![
            SourceRange {
                path: "impl.rs".into(),
                start: 1,
                end: 2,
            },
            SourceRange {
                path: "excluded.rs".into(),
                start: 3,
                end: 4,
            },
        ];
        runtime.stored.coverage.traversal_truncated = true;
        rebuild_query_index(&mut runtime.stored);
        let scope = Scope {
            include: vec!["**/*.rs".into()],
            exclude: vec!["excluded.rs".into(), "rejected-*.rs".into()],
            relation_kinds: vec![RelationKind::Calls, RelationKind::Implements],
            max_depth: 1,
        };
        let mut evaluations = BTreeMap::<String, usize>::new();
        let result = runtime
            .search_graph_with_matcher("repeated", &scope, 50, None, false, |path, scope| {
                *evaluations.entry(path.to_owned()).or_default() += 1;
                path_in_scope(path, scope)
            })
            .unwrap();
        assert_eq!(result["total"], 0);
        let expected = BTreeMap::from([
            ("calls.rs".to_owned(), 1),
            ("impl.rs".to_owned(), 1),
            ("excluded.rs".to_owned(), 1),
            ("proof.rs".to_owned(), 1),
            ("rejected-proof.rs".to_owned(), 1),
            ("coverage-only.rs".to_owned(), 1),
        ]);
        assert_eq!(result["coverage_gap_count"], 8);
        println!("path evaluations: {evaluations:?}");
        assert_eq!(evaluations, expected);
    }

    #[test]
    fn rebuilt_arc_carries_exact_call_site_evidence() {
        let documents = vec![
            syntax(1, "caller", "src/main.py", 0, 80),
            syntax(2, "target", "src/main.py", 90, 110),
            call(3, "target", "src/main.py", 20, 28),
        ];
        let hash = Hash32([4; 32]);
        let arcs = rebuild_arcs(
            &documents,
            &BTreeMap::from([("src/main.py".to_owned(), hash)]),
            &BTreeMap::new(),
        );
        assert_eq!(
            arcs,
            vec![StoredArc {
                source: 1,
                target: 2,
                kind: RelationKind::Calls,
                evidence: Some(EdgeEvidence {
                    path: "src/main.py".to_owned(),
                    span: ByteRange::new(20, 28),
                    source_hash: hash,
                    resolver: ResolverClass::SyntaxExact,
                    confidence: ConfidenceClass::Proven,
                    assumptions: Vec::new(),
                    counter_evidence: Vec::new(),
                }),
            }]
        );
    }

    #[test]
    fn legacy_arc_without_evidence_is_rebuilt_from_documents() {
        let mut stored = StoredIndex {
            extraction_revision: EXTRACTION_REVISION,
            cargo_manifests: BTreeMap::new(),
            rust_files: BTreeMap::new(),
            ts_files: BTreeMap::new(),
            ts_resolution_configs: BTreeMap::new(),
            go_modules: BTreeMap::new(),
            snapshot: RepoSnapshot {
                repo_revision: "test".to_owned(),
                working_tree_digest: Hash32([0; 32]),
                graph_generation: 7,
            },
            index_input_bytes: 0,
            indexed_files: 1,
            scip_edges: 0,
            path_hashes: BTreeMap::from([("src/main.py".to_owned(), Hash32([4; 32]))]),
            documents: vec![
                syntax(1, "caller", "src/main.py", 0, 80),
                syntax(2, "target", "src/main.py", 90, 110),
                call(3, "target", "src/main.py", 20, 28),
            ],
            arcs: vec![StoredArc {
                source: 1,
                target: 2,
                kind: RelationKind::Calls,
                evidence: None,
            }],
            query_index: Default::default(),
            similarity_index: Default::default(),
            coverage: CoverageMetadata::default(),
        };
        normalize_stored(&mut stored);
        assert_eq!(stored.arcs.len(), 1);
        assert!(stored.arcs.iter().all(|arc| arc.evidence.is_some()));
    }

    #[test]
    fn proof_bearing_non_calls_arc_survives_open_normalization_unchanged() {
        let preserved = StoredArc {
            source: 1,
            target: 2,
            kind: RelationKind::Implements,
            evidence: Some(EdgeEvidence {
                path: "src/trait.rs".to_owned(),
                span: ByteRange::new(5, 11),
                source_hash: Hash32([7; 32]),
                resolver: ResolverClass::CompilerConfirmed,
                confidence: ConfidenceClass::Proven,
                assumptions: vec![Hash32([8; 32])],
                counter_evidence: vec![Hash32([9; 32])],
            }),
        };
        let mut stored = StoredIndex {
            extraction_revision: EXTRACTION_REVISION,
            cargo_manifests: BTreeMap::new(),
            rust_files: BTreeMap::new(),
            ts_files: BTreeMap::new(),
            ts_resolution_configs: BTreeMap::new(),
            go_modules: BTreeMap::new(),
            snapshot: RepoSnapshot {
                repo_revision: "test".to_owned(),
                working_tree_digest: Hash32([0; 32]),
                graph_generation: 7,
            },
            index_input_bytes: 0,
            indexed_files: 1,
            scip_edges: 0,
            path_hashes: BTreeMap::from([("src/trait.rs".to_owned(), Hash32([7; 32]))]),
            documents: vec![
                syntax(1, "implementation", "src/trait.rs", 0, 40),
                syntax(2, "trait", "src/trait.rs", 41, 80),
            ],
            arcs: vec![preserved.clone()],
            query_index: Default::default(),
            similarity_index: Default::default(),
            coverage: CoverageMetadata::default(),
        };

        normalize_stored(&mut stored);

        assert_eq!(stored.arcs, vec![preserved]);
    }

    #[test]
    fn refresh_invalidates_non_calls_even_on_unrelated_source_change() {
        let (repository, _state, mut runtime, preserved) =
            refresh_fixture("preserve-non-calls-refresh");
        fs::write(
            repository.path().join("calls.rs"),
            b"fn target() {}\nfn caller() { target(); target(); }\n",
        )
        .expect("change unrelated call source");

        assert!(runtime.refresh(repository.path()).expect("refresh source"));

        assert!(!runtime.stored.arcs.contains(&preserved));
    }

    #[test]
    fn refresh_drops_changed_or_deleted_non_calls_evidence() {
        let (changed_repository, _changed_state, mut changed_runtime, _) =
            refresh_fixture("changed-non-calls-refresh");
        fs::write(
            changed_repository.path().join("impl.rs"),
            b"fn implementation() { println!(\"changed\"); }\nfn contract() {}\n",
        )
        .expect("change evidence source");
        assert!(
            changed_runtime
                .refresh(changed_repository.path())
                .expect("refresh changed evidence source")
        );
        assert!(
            changed_runtime
                .stored
                .arcs
                .iter()
                .all(|arc| arc.kind != RelationKind::Implements)
        );

        let (deleted_repository, _deleted_state, mut deleted_runtime, _) =
            refresh_fixture("deleted-non-calls-refresh");
        fs::remove_file(deleted_repository.path().join("impl.rs")).expect("delete evidence source");
        assert!(
            deleted_runtime
                .refresh(deleted_repository.path())
                .expect("refresh deleted evidence source")
        );
        assert!(!deleted_runtime.stored.path_hashes.contains_key("impl.rs"));
        assert!(
            deleted_runtime
                .stored
                .arcs
                .iter()
                .all(|arc| arc.kind != RelationKind::Implements)
        );
    }
    #[test]
    fn legacy_rust_rebuild_rejects_shadowed_binding_with_positive_control() {
        for (source, expected) in [
            ("fn target() {} fn caller(target: fn()) { target(); }", 0),
            ("fn target() {} fn caller() { target(); }", 1),
        ] {
            let path = "main.rs";
            let mut extracted = extract_path(path, source.as_bytes()).unwrap();
            let call_start = source.rfind("target();").unwrap();
            if extracted
                .documents
                .iter()
                .all(|document| document.provenance != "CALLS")
            {
                extracted.documents.push(call(
                    999,
                    "target",
                    path,
                    call_start,
                    call_start + "target()".len(),
                ));
            }
            let hash = Hash32(*blake3::hash(source.as_bytes()).as_bytes());
            let mut stored = StoredIndex {
                extraction_revision: EXTRACTION_REVISION,
                cargo_manifests: BTreeMap::new(),
                rust_files: BTreeMap::new(),
                ts_files: BTreeMap::new(),
                ts_resolution_configs: BTreeMap::new(),
                go_modules: BTreeMap::new(),
                snapshot: RepoSnapshot {
                    repo_revision: "test".into(),
                    working_tree_digest: Hash32([0; 32]),
                    graph_generation: 7,
                },
                index_input_bytes: 0,
                indexed_files: 1,
                scip_edges: 0,
                path_hashes: BTreeMap::from([(path.to_owned(), hash)]),
                documents: extracted.documents,
                arcs: vec![StoredArc {
                    source: 999,
                    target: 998,
                    kind: RelationKind::Calls,
                    evidence: None,
                }],
                query_index: Default::default(),
                similarity_index: Default::default(),
                coverage: CoverageMetadata::default(),
            };
            normalize_stored(&mut stored);
            assert_eq!(stored.arcs.len(), expected, "{source}");
        }
    }

    #[test]
    fn rebuild_omits_arc_without_path_hash() {
        let documents = vec![
            syntax(1, "caller", "main.py", 0, 80),
            syntax(2, "target", "main.py", 90, 110),
            call(3, "target", "main.py", 20, 28),
        ];
        assert!(rebuild_arcs(&documents, &BTreeMap::new(), &BTreeMap::new()).is_empty());
    }

    #[test]
    fn legacy_json_is_rebuilt_from_documents_not_old_endpoints() {
        let legacy: StoredArc = serde_json::from_str(r#"{"source":999,"target":998}"#).unwrap();
        assert_eq!(legacy.kind, RelationKind::Calls);
        assert!(legacy.evidence.is_none());
        let hash = Hash32([4; 32]);
        let mut stored = StoredIndex {
            extraction_revision: EXTRACTION_REVISION,
            cargo_manifests: BTreeMap::new(),
            rust_files: BTreeMap::new(),
            ts_files: BTreeMap::new(),
            ts_resolution_configs: BTreeMap::new(),
            go_modules: BTreeMap::new(),
            snapshot: RepoSnapshot {
                repo_revision: "test".into(),
                working_tree_digest: Hash32([0; 32]),
                graph_generation: 7,
            },
            index_input_bytes: 0,
            indexed_files: 1,
            scip_edges: 0,
            path_hashes: BTreeMap::from([("main.py".to_owned(), hash)]),
            documents: vec![
                syntax(1, "caller", "main.py", 0, 80),
                syntax(2, "target", "main.py", 90, 110),
                call(3, "target", "main.py", 20, 28),
            ],
            arcs: vec![legacy],
            query_index: Default::default(),
            similarity_index: Default::default(),
            coverage: CoverageMetadata::default(),
        };
        normalize_stored(&mut stored);
        assert_eq!(
            stored.arcs,
            vec![StoredArc {
                source: 1,
                target: 2,
                kind: RelationKind::Calls,
                evidence: Some(EdgeEvidence {
                    path: "main.py".into(),
                    span: ByteRange::new(20, 28),
                    source_hash: hash,
                    resolver: ResolverClass::SyntaxExact,
                    confidence: ConfidenceClass::Proven,
                    assumptions: vec![],
                    counter_evidence: vec![]
                })
            }]
        );
    }

    fn proof_scope() -> Scope {
        Scope {
            include: vec![],
            exclude: vec![],
            relation_kinds: vec![RelationKind::Calls],
            max_depth: 2,
        }
    }

    #[test]
    fn runtime_definitive_consumers_reject_non_proven_and_out_of_relation_arcs() {
        for confidence in [
            ConfidenceClass::Candidate,
            ConfidenceClass::BoundedSet,
            ConfidenceClass::Unresolved,
            ConfidenceClass::Proven,
        ] {
            for kind in [RelationKind::Calls, RelationKind::Implements] {
                let (_repo, _state, mut runtime, mut proof) =
                    refresh_fixture("definitive-consumers");
                proof.kind = kind;
                proof.evidence.as_mut().unwrap().confidence = confidence;
                runtime.stored.arcs = vec![proof.clone()];
                normalize_stored(&mut runtime.stored);
                let scope = proof_scope();
                let expected = confidence == ConfidenceClass::Proven && kind == RelationKind::Calls;
                let search = runtime.search_graph("implementation", &scope, 1).unwrap();
                assert_eq!(
                    search["matches"][0]["callees"],
                    usize::from(expected),
                    "search {confidence:?} {kind:?}"
                );
                let trace = runtime
                    .trace_path("implementation", None, "callees", 1, &scope, 10)
                    .unwrap();
                assert_eq!(
                    trace["nodes"].as_array().unwrap().len(),
                    usize::from(expected),
                    "trace {confidence:?} {kind:?}"
                );
                let report = runtime
                    .orient(QueryRequest {
                        task: "implementation".to_owned(),
                        scope,
                        mode: Mode::Precise,
                        token_budget: 800,
                    })
                    .unwrap();
                assert_eq!(
                    report
                        .compiled
                        .packed
                        .records
                        .iter()
                        .any(|r| r.node_id == proof.target),
                    expected,
                    "orient {confidence:?} {kind:?}"
                );
                assert_eq!(
                    report
                        .compiled
                        .packed
                        .records
                        .iter()
                        .any(|r| r.neighbors.contains(&proof.target)),
                    expected,
                    "neighbors {confidence:?} {kind:?}"
                );
            }
        }
    }

    #[test]
    fn refresh_keeps_non_calls_only_without_source_change() {
        let (repo, _state, mut runtime, preserved) = refresh_fixture("no-change-proof");
        assert!(!runtime.refresh(repo.path()).unwrap());
        assert!(runtime.stored.arcs.contains(&preserved));
    }

    #[test]
    fn refresh_invalidates_non_calls_on_target_only_change_or_deletion() {
        for delete in [false, true] {
            let (repo, _state, mut runtime, mut proof) = refresh_fixture("target-change-proof");
            let target = runtime
                .stored
                .documents
                .iter()
                .find(|d| d.provenance == "SYNTAX" && d.qualified_name == "target")
                .unwrap()
                .node_id;
            proof.target = target;
            runtime.stored.arcs = vec![proof.clone()];
            if delete {
                fs::remove_file(repo.path().join("calls.rs")).unwrap();
            } else {
                fs::write(
                    repo.path().join("calls.rs"),
                    b"fn target() { let required = 1; }\nfn caller() {}\n",
                )
                .unwrap();
            }
            assert!(runtime.refresh(repo.path()).unwrap());
            assert_eq!(
                runtime.stored.path_hashes.get("impl.rs"),
                Some(&proof.evidence.as_ref().unwrap().source_hash)
            );
            if !delete {
                assert!(runtime.stored.documents.iter().any(|d| d.node_id == target));
            }
            assert!(
                !runtime
                    .stored
                    .arcs
                    .iter()
                    .any(|a| a.kind == RelationKind::Implements)
            );
        }
    }

    #[test]
    fn mixed_legacy_migration_preserves_valid_non_calls_proof() {
        let (_repo, _state, mut runtime, proof) = refresh_fixture("mixed-legacy");
        runtime
            .stored
            .arcs
            .push(serde_json::from_str(r#"{"source":999,"target":998}"#).unwrap());
        normalize_stored(&mut runtime.stored);
        assert!(runtime.stored.arcs.contains(&proof));
        assert!(
            runtime
                .stored
                .arcs
                .iter()
                .all(|a| a.evidence.is_some() && a.source != 999)
        );
        assert!(
            runtime
                .stored
                .arcs
                .iter()
                .any(|a| a.kind == RelationKind::Calls)
        );
    }
}

#[cfg(test)]
mod go_replacement_parser_tests {
    use super::go_module_name;

    #[test]
    fn ancestor_replacement_and_ambiguous_blocks_are_not_module_proof() {
        for source in [
            "module example/vpn\nreplace example => ./other\n",
            "module vpn\nreplace (\nexample/lib => ./lib\nreplace other/lib => ./other\n)\n",
            "module vpn\nreplace example/lib nope => ./lib\n",
            "module vpn\nreplace example/lib => ./lib unexpected\n",
        ] {
            assert_eq!(go_module_name(source.as_bytes()), None, "{source}");
        }
    }
}

#[cfg(test)]
mod compact_storage_tests {
    use super::*;

    fn document() -> StoredDocument {
        serde_json::from_value(json!({
            "node_id": 7, "qualified_name": "Target", "path": "src/api.go",
            "text": "Target", "span_start": 11, "span_end": 17,
            "provenance": "SYNTAX"
        }))
        .unwrap()
    }

    #[test]
    fn sparse_go_field_proof_uses_one_pointer_per_document() {
        let mut doc = document();
        assert_eq!(
            std::mem::size_of_val(&doc.go_field_target),
            std::mem::size_of::<usize>()
        );
        doc.go_field_target = Some(
            serde_json::from_value(json!({
                "package": "queue", "caller": {"start": 1, "end": 5},
                "receiver_type": {"start": 10, "end": 19}, "field": {"start": 22, "end": 27},
                "field_type": {"start": 30, "end": 43}, "target": {"start": 50, "end": 53}
            }))
            .unwrap(),
        );
        assert_eq!(
            std::mem::size_of_val(&doc.go_field_target),
            std::mem::size_of::<usize>()
        );
    }

    #[test]
    fn sparse_go_field_proof_preserves_json_shape() {
        let mut doc = document();
        assert!(
            serde_json::to_value(&doc)
                .unwrap()
                .get("go_field_target")
                .is_none()
        );
        let proof = json!({
            "package": "queue", "caller": {"start": 1, "end": 5},
            "receiver_type": {"start": 10, "end": 19}, "field": {"start": 22, "end": 27},
            "field_type": {"start": 30, "end": 43}, "target": {"start": 50, "end": 53}
        });
        doc.go_field_target = Some(serde_json::from_value(proof.clone()).unwrap());
        let encoded = serde_json::to_value(&doc).unwrap();
        assert_eq!(encoded["go_field_target"], proof);
        assert_eq!(
            serde_json::from_value::<StoredDocument>(encoded).unwrap(),
            doc
        );
        assert_eq!(
            EXTRACTION_REVISION,
            if cgrx_languages::EXPERIMENTAL_PHP_ENABLED {
                31
            } else {
                29
            }
        );
    }

    #[test]
    fn compact_storage_omits_only_default_metadata() {
        let doc = document();
        let value = serde_json::to_value(&doc).unwrap();
        for field in [
            "go_import_explicit_alias",
            "search_text",
            "body_start",
            "body_end",
            "semantic_tags",
        ] {
            assert!(value.get(field).is_none(), "redundant default: {field}");
        }
        for field in [
            "node_id",
            "qualified_name",
            "path",
            "text",
            "span_start",
            "span_end",
            "provenance",
        ] {
            assert!(
                value.get(field).is_some(),
                "required identity lost: {field}"
            );
        }
        assert_eq!(
            serde_json::from_value::<StoredDocument>(value).unwrap(),
            doc
        );
    }

    #[test]
    fn compact_storage_retains_nondefault_proof_and_search_metadata() {
        let mut doc = document();
        doc.go_import_path = Some("example.test/foo".to_owned());
        doc.go_import_explicit_alias = true;
        doc.go_package = Some("actual".to_owned());
        doc.search_text = "func Target() {}".to_owned();
        doc.body_start = 3;
        doc.body_end = 42;
        doc.semantic_tags = vec!["EXACT_CALL".to_owned()];
        let value = serde_json::to_value(&doc).unwrap();
        assert_eq!(value["go_import_explicit_alias"], true);
        assert_eq!(value["go_package"], "actual");
        assert_eq!(value["search_text"], "func Target() {}");
        assert_eq!(value["body_start"], 3);
        assert_eq!(value["body_end"], 42);
        assert_eq!(value["semantic_tags"], json!(["EXACT_CALL"]));
        assert_eq!(
            serde_json::from_value::<StoredDocument>(value).unwrap(),
            doc
        );
    }

    #[test]
    fn compact_storage_accepts_legacy_dense_and_missing_defaults_identically() {
        let doc = document();
        let mut dense = serde_json::to_value(&doc).unwrap();
        for (key, value) in [
            ("go_import_explicit_alias", json!(false)),
            ("search_text", json!("")),
            ("body_start", json!(0)),
            ("body_end", json!(0)),
            ("semantic_tags", json!([])),
        ] {
            dense[key] = value;
        }
        let from_dense: StoredDocument = serde_json::from_value(dense).unwrap();
        assert_eq!(from_dense, doc);
        let encoded = serde_json::to_value(&from_dense).unwrap();
        assert!(encoded.get("go_import_explicit_alias").is_none());
        assert_eq!(
            serde_json::from_value::<StoredDocument>(encoded).unwrap(),
            doc
        );
    }

    #[test]
    fn compact_storage_does_not_coerce_invalid_metadata_to_defaults() {
        for (key, invalid) in [
            ("go_import_explicit_alias", json!("false")),
            ("go_import_explicit_alias", json!(null)),
            ("body_start", json!(-1)),
            ("semantic_tags", json!("")),
            ("search_text", json!(false)),
        ] {
            let mut value = serde_json::to_value(document()).unwrap();
            value[key] = invalid;
            assert!(
                serde_json::from_value::<StoredDocument>(value).is_err(),
                "{key}"
            );
        }
    }
}

#[cfg(test)]
mod ts_inventory_cache_tests {
    use super::ts_helpers::{
        DIRECTORY_READS, INVENTORY_BUILDS, MODULE_EXPANSIONS, SOURCE_READS, TsDirectoryCache,
    };
    use super::*;
    use std::cell::Cell;
    use std::sync::atomic::{AtomicU64, Ordering};
    static ID: AtomicU64 = AtomicU64::new(0);
    struct Fixture(PathBuf);
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    #[test]
    fn repeated_named_imports_expand_once_per_inventory_pass() {
        let fixture = Fixture(std::env::temp_dir().join(format!(
            "cgrx-candidate-cache-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        )));
        fs::create_dir_all(&fixture.0).unwrap();
        let source = "import { a, b, c } from './worker'; export { d, e } from './worker';";
        fs::write(fixture.0.join("main.ts"), source).unwrap();
        let hash = Hash32(*blake3::hash(source.as_bytes()).as_bytes());
        let mut files = BTreeMap::from([(
            "main.ts".to_owned(),
            StoredTsFileFacts {
                source_hash: hash,
                facts: TsFileFacts::parse("main.ts", source.as_bytes()),
                inventory_only: false,
            },
        )]);
        let mut hashes = BTreeMap::from([("main.ts".to_owned(), hash)]);
        let mut configs = BTreeMap::new();
        for pass in 0..2 {
            INVENTORY_BUILDS.with(|n| n.set(0));
            MODULE_EXPANSIONS.with(|n| n.set(0));
            let (_, invalid) =
                scan_ts_inventory(&fixture.0, &mut hashes, &mut files, &mut configs).unwrap();
            assert!(invalid.is_empty());
            assert_eq!(
                INVENTORY_BUILDS.with(Cell::get),
                1,
                "one candidate set per pass"
            );
            assert_eq!(
                MODULE_EXPANSIONS.with(Cell::get),
                1,
                "one expansion per distinct module"
            );
            if pass == 0 {
                fs::write(fixture.0.join("worker.ts"), "export function a() {}").unwrap();
            } else {
                assert!(
                    files["worker.ts"].inventory_only,
                    "new filesystem target remains a presence blocker"
                );
            }
        }
    }

    #[test]
    fn directory_reads_are_shared_within_inventory_but_not_across_refreshes() {
        let fixture = Fixture(std::env::temp_dir().join(format!(
            "cgrx-dir-cache-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        )));
        fs::create_dir_all(fixture.0.join("src/nested")).unwrap();
        let mut files = BTreeMap::new();
        let mut hashes = BTreeMap::new();
        let mut add = |path: String, source: String| {
            fs::write(fixture.0.join(&path), &source).unwrap();
            let hash = Hash32(*blake3::hash(source.as_bytes()).as_bytes());
            hashes.insert(path.clone(), hash);
            files.insert(
                path.clone(),
                StoredTsFileFacts {
                    source_hash: hash,
                    facts: TsFileFacts::parse(&path, source.as_bytes()),
                    inventory_only: false,
                },
            );
        };
        let mut imports = String::new();
        for i in 0..8 {
            add(
                format!("src/nested/worker{i}.ts"),
                format!("export function f{i}() {{}}"),
            );
            imports.push_str(&format!("import {{ f{i} }} from './worker{i}';\n"));
        }
        add("src/nested/main.ts".into(), imports);
        let mut configs = BTreeMap::new();
        DIRECTORY_READS.with(|n| n.set(0));
        assert!(
            !scan_ts_inventory(&fixture.0, &mut hashes, &mut files, &mut configs)
                .unwrap()
                .0
        );
        assert_eq!(
            DIRECTORY_READS.with(Cell::get),
            3,
            "enumerate root/src/nested once, not once for every import target"
        );
        assert!(
            !scan_ts_inventory(&fixture.0, &mut hashes, &mut files, &mut configs)
                .unwrap()
                .0
        );
        assert_eq!(
            DIRECTORY_READS.with(Cell::get),
            6,
            "a new refresh must re-enumerate directories"
        );
    }

    #[test]
    fn verified_sources_are_not_rehashed_until_metadata_changes() {
        let fixture = Fixture(std::env::temp_dir().join(format!(
            "cgrx-source-fingerprint-cache-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        )));
        fs::create_dir_all(&fixture.0).unwrap();
        let source = "export const value = 1;";
        fs::write(fixture.0.join("target.ts"), source).unwrap();
        let hash = Hash32(*blake3::hash(source.as_bytes()).as_bytes());
        let mut files = BTreeMap::from([(
            "target.ts".to_owned(),
            StoredTsFileFacts {
                source_hash: hash,
                facts: TsFileFacts::parse("target.ts", source.as_bytes()),
                inventory_only: false,
            },
        )]);
        let mut hashes = BTreeMap::from([("target.ts".to_owned(), hash)]);
        let mut configs = BTreeMap::new();
        let mut fingerprints = BTreeMap::new();

        SOURCE_READS.with(|count| count.set(0));
        for _ in 0..2 {
            let (_, invalid) = scan_ts_inventory_cached(
                &fixture.0,
                &mut hashes,
                &mut files,
                &mut configs,
                &mut fingerprints,
            )
            .unwrap();
            assert!(invalid.is_empty());
        }
        assert_eq!(SOURCE_READS.with(Cell::get), 1);

        fs::write(fixture.0.join("target.ts"), "export const value = 2;").unwrap();
        let (_, invalid) = scan_ts_inventory_cached(
            &fixture.0,
            &mut hashes,
            &mut files,
            &mut configs,
            &mut fingerprints,
        )
        .unwrap();
        assert_eq!(SOURCE_READS.with(Cell::get), 2);
        assert_eq!(invalid.len(), 1);
        assert_eq!(invalid[0].0, "target.ts");
    }
    #[test]
    fn cached_directory_identity_rechecks_case_and_symlink_changes() {
        let fixture = Fixture(std::env::temp_dir().join(format!(
            "cgrx-dir-mutation-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        )));
        fs::create_dir_all(fixture.0.join("src")).unwrap();
        fs::write(fixture.0.join("src/worker.ts"), "export function run() {}").unwrap();
        let mut cache = TsDirectoryCache::default();
        assert!(ts_path_is_plain(
            &fixture.0,
            Path::new("src/worker.ts"),
            &mut cache
        ));
        fs::rename(
            fixture.0.join("src/worker.ts"),
            fixture.0.join("src/temp.ts"),
        )
        .unwrap();
        fs::rename(
            fixture.0.join("src/temp.ts"),
            fixture.0.join("src/Worker.ts"),
        )
        .unwrap();
        assert!(!ts_path_is_plain(
            &fixture.0,
            Path::new("src/worker.ts"),
            &mut cache
        ));
        assert!(ts_path_is_plain(
            &fixture.0,
            Path::new("src/Worker.ts"),
            &mut cache
        ));
        fs::rename(fixture.0.join("src"), fixture.0.join("real")).unwrap();
        std::os::unix::fs::symlink("real", fixture.0.join("src")).unwrap();
        assert!(!ts_path_is_plain(
            &fixture.0,
            Path::new("src/Worker.ts"),
            &mut cache
        ));
    }

    #[test]
    fn missing_directory_can_be_created_without_reusing_absence() {
        let fixture = Fixture(std::env::temp_dir().join(format!(
            "cgrx-dir-missing-{}-{}",
            std::process::id(),
            ID.fetch_add(1, Ordering::Relaxed)
        )));
        fs::create_dir_all(&fixture.0).unwrap();
        let mut cache = TsDirectoryCache::default();
        assert!(!ts_path_is_plain(
            &fixture.0,
            Path::new("src/worker.ts"),
            &mut cache
        ));
        fs::create_dir(fixture.0.join("src")).unwrap();
        fs::write(fixture.0.join("src/worker.ts"), "export function run() {}").unwrap();
        assert!(ts_path_is_plain(
            &fixture.0,
            Path::new("src/worker.ts"),
            &mut cache
        ));
    }
}
