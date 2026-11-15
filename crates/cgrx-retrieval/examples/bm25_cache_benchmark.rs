//! Synthetic first-pass retrieval timings; excludes refresh, packing and MCP.
//! Run: cargo run --release -p cgrx-retrieval --example bm25_cache_benchmark
use cgrx_core::{Mode, QueryRequest, Scope};
use cgrx_languages::Span;
use cgrx_retrieval::{
    Bm25Cache, CandidateProvenance, GraphDocument, GraphDocumentRef, RetrievalEngine,
};
use std::hint::black_box;
use std::time::Instant;

fn main() {
    let engine = RetrievalEngine::default().with_hybrid(false);
    for count in [1000, 10_000] {
        let documents: Vec<_> = (0..count)
            .map(|index| GraphDocument {
                node_id: index as u64,
                qualified_name: format!("HTTPWorker{index}"),
                path: format!("src/{}/worker_{index}.rs", index % 10),
                text: format!("{} İstanbul ОбработатьЗапрос marker{index}",
                    "fn dispatch(request) { let cache_key = request.path; retry_request(cache_key); } ".repeat(8)),
                span: Span { start: 0, end: 12 },
                provenance: CandidateProvenance::Syntax,
                semantic_fingerprint: None,
            }).collect();
        let all: Vec<_> = documents
            .iter()
            .map(|document| GraphDocumentRef {
                node_id: document.node_id,
                qualified_name: &document.qualified_name,
                path: &document.path,
                text: &document.text,
                span: document.span,
                provenance: document.provenance,
                semantic_fingerprint: None,
            })
            .collect();
        let cache = Bm25Cache::default();
        for (scope, documents) in [
            ("full", all.clone()),
            (
                "narrow",
                all.iter()
                    .copied()
                    .filter(|document| document.node_id % 10 == 0)
                    .collect(),
            ),
        ] {
            for task in [
                "HTTPWorker",
                "cache retry",
                "İstanbul",
                "ОбработатьЗапрос",
                "marker900",
                "missing",
            ] {
                let request = QueryRequest {
                    task: task.into(),
                    scope: Scope {
                        include: vec![],
                        exclude: vec![],
                        relation_kinds: vec![],
                        max_depth: 1,
                    },
                    mode: Mode::Bounded,
                    token_budget: 800,
                };
                let control = engine
                    .retrieve_scoped_refs(&request, &documents, &[])
                    .unwrap();
                let cold = Bm25Cache::default();
                let start = Instant::now();
                let first = engine
                    .retrieve_scoped_refs_cached(&request, &documents, &[], &cold)
                    .unwrap();
                let cold_us = start.elapsed().as_micros();
                assert_eq!(first, control);
                assert_eq!(
                    engine
                        .retrieve_scoped_refs_cached(&request, &documents, &[], &cache)
                        .unwrap(),
                    control
                );
                let mut streaming = Vec::new();
                let mut cached = Vec::new();
                // Alternate order to avoid always measuring one after the other.
                for iteration in 0..12 {
                    for use_cache in if iteration % 2 == 0 {
                        [false, true]
                    } else {
                        [true, false]
                    } {
                        let start = Instant::now();
                        let result = if use_cache {
                            engine.retrieve_scoped_refs_cached(&request, &documents, &[], &cache)
                        } else {
                            engine.retrieve_scoped_refs(&request, &documents, &[])
                        }
                        .unwrap();
                        let elapsed = start.elapsed().as_micros();
                        assert_eq!(black_box(&result), &control);
                        if use_cache {
                            cached.push(elapsed);
                        } else {
                            streaming.push(elapsed);
                        }
                    }
                }
                streaming.sort_unstable();
                cached.sort_unstable();
                println!(
                    "{{\"corpus\":{count},\"scoped_documents\":{},\"scope\":\"{scope}\",\"query\":\"{task}\",\"cold_cached_us\":{cold_us},\"streaming_p50_us\":{},\"cached_p50_us\":{},\"candidate_parity\":true}}",
                    documents.len(),
                    streaming[streaming.len() / 2],
                    cached[cached.len() / 2]
                );
            }
        }
    }
}
