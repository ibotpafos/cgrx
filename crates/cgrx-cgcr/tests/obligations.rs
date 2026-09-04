use cgrx_cgcr::{
    CoverageMetadata, ObligationCompiler, ObligationKind, ObligationState, QueryClass,
    ResolvedAnchor, SourceRange, UncertaintyKind,
};
use cgrx_core::{Mode, QueryRequest, RelationKind, Scope};

fn request(task: &str) -> QueryRequest {
    QueryRequest {
        task: task.to_owned(),
        scope: Scope {
            include: vec!["src/**".to_owned()],
            exclude: vec!["vendor/**".to_owned()],
            relation_kinds: vec![RelationKind::Calls],
            max_depth: 5,
        },
        mode: Mode::Bounded,
        token_budget: 800,
    }
}

fn anchor() -> ResolvedAnchor {
    ResolvedAnchor {
        node_id: 7,
        path: "src/billing.rs".to_owned(),
        qualified_name: "billing::charge".to_owned(),
    }
}

#[test]
fn negative_call_query_requires_all_six_bounded_obligations() {
    let set = ObligationCompiler::compile(
        &request("есть ли ещё вызовы billing::charge"),
        &[anchor()],
        &CoverageMetadata::default(),
        None,
    );
    assert_eq!(set.query_class, QueryClass::NegativeExhaustive);
    assert_eq!(set.obligations.len(), 6);
    assert_eq!(
        set.obligations
            .iter()
            .map(|obligation| obligation.kind)
            .collect::<Vec<_>>(),
        vec![
            ObligationKind::ResolveTargets,
            ObligationKind::EnumerateRelations,
            ObligationKind::AccountDynamicDispatch,
            ObligationKind::AccountCoverageGaps,
            ObligationKind::BindSourceRevision,
            ObligationKind::EnforceBudget,
        ]
    );
    assert!(
        set.obligations
            .iter()
            .all(|obligation| obligation.state == ObligationState::Open)
    );
}

#[test]
fn excluded_path_prevents_complete_bounded() {
    let metadata = CoverageMetadata {
        excluded_paths: vec!["plugins/**".to_owned()],
        ..CoverageMetadata::default()
    };
    let set = ObligationCompiler::compile(
        &request("all calls to charge"),
        &[anchor()],
        &metadata,
        Some(QueryClass::NegativeExhaustive),
    );
    assert!(set.uncertainties.iter().any(|uncertainty| {
        uncertainty.kind == UncertaintyKind::ExcludedPath
            && uncertainty.path.as_deref() == Some("plugins/**")
    }));
    assert!(!set.complete_bounded_possible());
}

#[test]
fn fixture_obligation_matrix() {
    for index in 0..20 {
        let mut metadata = CoverageMetadata::default();
        let expected = match index % 5 {
            0 => {
                metadata.excluded_paths.push(format!("excluded/{index}/**"));
                UncertaintyKind::ExcludedPath
            }
            1 => {
                metadata.parser_error_ranges.push(SourceRange {
                    path: format!("src/{index}.ts"),
                    start: 10,
                    end: 20,
                });
                UncertaintyKind::ParserErrorRange
            }
            2 => {
                metadata.stale_paths.push(format!("src/{index}.ts"));
                UncertaintyKind::StalePath
            }
            3 => {
                metadata.traversal_truncated = true;
                UncertaintyKind::TraversalTruncated
            }
            _ => {
                metadata.dynamic_dispatch.push(format!("callsite:{index}"));
                UncertaintyKind::DynamicDispatch
            }
        };
        let task = if index % 2 == 0 {
            format!("all calls case {index}")
        } else {
            format!("locate symbol case {index}")
        };
        let set = ObligationCompiler::compile(&request(&task), &[anchor()], &metadata, None);
        println!(
            "case={index} class={:?} obligations={} uncertainty={expected:?}",
            set.query_class,
            set.obligations.len()
        );
        assert!(!set.obligations.is_empty());
        assert!(set.uncertainties.iter().any(|item| item.kind == expected));
        if set.query_class == QueryClass::NegativeExhaustive {
            assert!(
                set.obligations
                    .iter()
                    .all(|obligation| obligation.state == ObligationState::Open)
            );
        }
    }
}

#[test]
fn explicit_sdk_class_overrides_natural_language_and_missing_anchor_is_visible() {
    let set = ObligationCompiler::compile(
        &request("all calls"),
        &[],
        &CoverageMetadata::default(),
        Some(QueryClass::Locate),
    );
    assert_eq!(set.query_class, QueryClass::Locate);
    assert!(
        set.uncertainties
            .iter()
            .any(|item| item.kind == UncertaintyKind::MissingAnchor)
    );
}

#[test]
fn calls_is_not_misclassified_as_the_word_all() {
    let set = ObligationCompiler::compile(
        &request("calls to billing::charge"),
        &[anchor()],
        &CoverageMetadata::default(),
        None,
    );
    assert_eq!(set.query_class, QueryClass::Locate);
    assert_eq!(
        set.obligations
            .iter()
            .map(|obligation| obligation.id.0.as_str())
            .collect::<Vec<_>>(),
        vec!["O1", "O5", "O6"]
    );
}
