use cgrx_core::Hash32;
use cgrx_languages::{
    Edge, Extraction, Provenance, RelationKind, Span, Symbol, Unresolved, UnresolvedKind,
};
use cgrx_store::{DeltaOverlay, DeltaRecord, FreshnessError};
use std::fs;
use std::path::Path;
use std::time::Instant;

fn hash(byte: u8) -> Hash32 {
    Hash32([byte; 32])
}

fn extraction(name: &str, target: &str) -> Extraction {
    Extraction {
        rust_file: None,
        package_span: None,
        lexical_arrows: Vec::new(),
        symbols: vec![Symbol {
            name: name.to_owned(),
            span: Span { start: 0, end: 4 },
            search_span: Span { start: 0, end: 4 },
        }],
        edges: vec![Edge {
            relation: RelationKind::Calls,
            target: target.to_owned(),
            span: Span { start: 5, end: 13 },
            context_span: Span { start: 5, end: 13 },
            provenance: Provenance::Syntax,
        }],
        parser_error_ranges: Vec::new(),
        unresolved: Vec::new(),
    }
}

#[test]
fn changed_file_shadows_base_edges_without_rewriting_generation() {
    let root = std::env::temp_dir().join(format!("cgrx-delta-{}", std::process::id()));
    let generation = root.join(".cgrx/generations/0000000000000007");
    fs::create_dir_all(&generation).unwrap();
    fs::write(generation.join("edges.seg"), b"immutable-generation-7").unwrap();
    let before = blake3::hash(&fs::read(generation.join("edges.seg")).unwrap());

    let mut overlay = DeltaOverlay::new(7);
    overlay
        .apply(
            Path::new("src/main.ts"),
            hash(1),
            hash(2),
            extraction("caller", "new_target"),
        )
        .unwrap();

    assert!(
        overlay
            .records()
            .iter()
            .any(|record| matches!(record, DeltaRecord::DeleteEdge { .. }))
    );
    assert!(overlay.records().iter().any(|record| matches!(
        record,
        DeltaRecord::UpsertEdge { edge, .. } if edge.target == "new_target"
    )));
    assert_eq!(
        before,
        blake3::hash(&fs::read(generation.join("edges.seg")).unwrap())
    );
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn delete_and_rename_shadow_old_paths_with_append_only_records() {
    let mut overlay = DeltaOverlay::new(7);
    overlay
        .delete(Path::new("src/deleted.py"), hash(3))
        .unwrap();
    overlay
        .rename(
            Path::new("src/old.ts"),
            Path::new("src/new.ts"),
            hash(4),
            hash(5),
            extraction("moved", "target"),
        )
        .unwrap();

    assert!(overlay.is_shadowed(Path::new("src/deleted.py")));
    assert!(overlay.is_shadowed(Path::new("src/old.ts")));
    assert!(overlay.is_shadowed(Path::new("src/new.ts")));
    let ordinals: Vec<_> = overlay.records().iter().map(DeltaRecord::ordinal).collect();
    assert!(ordinals.windows(2).all(|pair| pair[0] < pair[1]));
}

#[test]
fn stale_path_returns_stale_before_query_results() {
    let mut overlay = DeltaOverlay::new(7);
    overlay
        .apply(
            Path::new("src/main.py"),
            hash(6),
            hash(7),
            extraction("caller", "target"),
        )
        .unwrap();

    let error = overlay
        .assert_fresh(&[(Path::new("src/main.py"), hash(8))])
        .unwrap_err();
    assert_eq!(
        error,
        FreshnessError::StalePath {
            path: "src/main.py".to_owned(),
            expected: hash(7),
            actual: hash(8),
        }
    );
}

#[test]
fn parser_gaps_remain_explicit_delta_records() {
    let mut value = extraction("caller", "target");
    value.parser_error_ranges.push(Span { start: 20, end: 25 });
    value.unresolved.push(Unresolved {
        kind: UnresolvedKind::ParserError,
        span: Span { start: 20, end: 25 },
        text: "broken".to_owned(),
    });
    let mut overlay = DeltaOverlay::new(7);
    overlay
        .apply(Path::new("src/broken.py"), hash(9), hash(10), value)
        .unwrap();
    assert!(overlay.records().iter().any(|record| matches!(
        record,
        DeltaRecord::CoverageGap { span, .. } if *span == Span { start: 20, end: 25 }
    )));
}

#[test]
fn portable_paths_reject_unix_windows_unc_and_traversal_forms() {
    for path in [
        "/tmp/main.ts",
        "C:\\tmp\\main.ts",
        "\\\\server\\share\\main.ts",
        "../main.ts",
    ] {
        assert!(
            DeltaOverlay::new(7)
                .delete(Path::new(path), hash(1))
                .is_err(),
            "{path}"
        );
    }
    let mut overlay = DeltaOverlay::new(7);
    overlay.delete(Path::new("src\\main.ts"), hash(1)).unwrap();
    assert!(overlay.is_shadowed(Path::new("src/main.ts")));
}

#[test]
#[ignore = "release-only latency contract"]
fn edit_freshness_p95_under_50ms() {
    let mut samples = Vec::with_capacity(2_000);
    for ordinal in 0..2_000_u32 {
        let mut overlay = DeltaOverlay::new(7);
        let started = Instant::now();
        overlay
            .apply(
                Path::new("src/main.ts"),
                hash(11),
                hash((ordinal % 251) as u8),
                extraction("caller", "target"),
            )
            .unwrap();
        std::hint::black_box(overlay.records().len());
        samples.push(started.elapsed());
    }
    samples.sort();
    let percentile = |value: usize| samples[(samples.len() - 1) * value / 100];
    let p50 = percentile(50);
    let p95 = percentile(95);
    let p99 = percentile(99);
    println!("edit_freshness_p50_ns={}", p50.as_nanos());
    println!("edit_freshness_p95_ns={}", p95.as_nanos());
    println!("edit_freshness_p99_ns={}", p99.as_nanos());
    assert!(p95.as_millis() < 50, "p95 {:?} exceeds 50ms", p95);
}
