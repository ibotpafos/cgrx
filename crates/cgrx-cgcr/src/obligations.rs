use cgrx_capsule::ObligationId;
use cgrx_core::{QueryRequest, Scope};
use serde::{Deserialize, Serialize};

use crate::{CoverageMetadata, Uncertainty, UncertaintyKind};

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum QueryClass {
    Locate,
    Trace,
    Impact,
    NegativeExhaustive,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ObligationKind {
    ResolveTargets,
    EnumerateRelations,
    AccountDynamicDispatch,
    AccountCoverageGaps,
    BindSourceRevision,
    EnforceBudget,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct EvidenceRef {
    pub handle: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ResidualReason {
    pub code: String,
    pub detail: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ObligationState {
    Open,
    Discharged(EvidenceRef),
    Residual(ResidualReason),
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Obligation {
    pub id: ObligationId,
    pub kind: ObligationKind,
    pub scope: Scope,
    pub state: ObligationState,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ResolvedAnchor {
    pub node_id: u64,
    pub path: String,
    pub qualified_name: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct ObligationSet {
    pub query_class: QueryClass,
    pub obligations: Vec<Obligation>,
    pub uncertainties: Vec<Uncertainty>,
}

impl ObligationSet {
    #[must_use]
    pub fn complete_bounded_possible(&self) -> bool {
        self.uncertainties.is_empty()
            && self
                .obligations
                .iter()
                .all(|obligation| matches!(obligation.state, ObligationState::Discharged(_)))
    }
}

pub struct ObligationCompiler;

impl ObligationCompiler {
    #[must_use]
    pub fn compile(
        request: &QueryRequest,
        anchors: &[ResolvedAnchor],
        coverage: &CoverageMetadata,
        explicit_class: Option<QueryClass>,
    ) -> ObligationSet {
        let query_class = explicit_class.unwrap_or_else(|| classify(&request.task));
        let kinds: &[ObligationKind] = match query_class {
            QueryClass::Locate => &[
                ObligationKind::ResolveTargets,
                ObligationKind::BindSourceRevision,
                ObligationKind::EnforceBudget,
            ],
            QueryClass::Trace | QueryClass::Impact | QueryClass::NegativeExhaustive => &[
                ObligationKind::ResolveTargets,
                ObligationKind::EnumerateRelations,
                ObligationKind::AccountDynamicDispatch,
                ObligationKind::AccountCoverageGaps,
                ObligationKind::BindSourceRevision,
                ObligationKind::EnforceBudget,
            ],
        };
        let obligations = kinds
            .iter()
            .map(|kind| Obligation {
                id: ObligationId(id_for_kind(*kind).to_owned()),
                kind: *kind,
                scope: request.scope.clone(),
                state: ObligationState::Open,
            })
            .collect();
        let mut uncertainties = inventory(coverage);
        if anchors.is_empty() {
            uncertainties.push(Uncertainty {
                kind: UncertaintyKind::MissingAnchor,
                path: None,
                start: None,
                end: None,
                detail: "query target did not resolve to an anchor".to_owned(),
            });
        }
        uncertainties.sort();
        uncertainties.dedup();
        ObligationSet {
            query_class,
            obligations,
            uncertainties,
        }
    }
}

const fn id_for_kind(kind: ObligationKind) -> &'static str {
    match kind {
        ObligationKind::ResolveTargets => "O1",
        ObligationKind::EnumerateRelations => "O2",
        ObligationKind::AccountDynamicDispatch => "O3",
        ObligationKind::AccountCoverageGaps => "O4",
        ObligationKind::BindSourceRevision => "O5",
        ObligationKind::EnforceBudget => "O6",
    }
}

fn classify(task: &str) -> QueryClass {
    let normalized = task.to_lowercase();
    let negative = contains_word(&normalized, "all")
        || contains_word(&normalized, "все")
        || normalized.contains("any other")
        || normalized.contains("other calls")
        || normalized.contains("есть ли ещё")
        || normalized.contains("есть ли еще")
        || normalized.contains("все вызовы");
    if negative {
        QueryClass::NegativeExhaustive
    } else if normalized.contains("impact")
        || normalized.contains("affected")
        || normalized.contains("затрон")
    {
        QueryClass::Impact
    } else if normalized.contains("trace")
        || normalized.contains("call path")
        || normalized.contains("путь вызова")
        || normalized.contains("кто вызывает")
    {
        QueryClass::Trace
    } else {
        QueryClass::Locate
    }
}

fn contains_word(value: &str, expected: &str) -> bool {
    value
        .split(|character: char| !character.is_alphanumeric())
        .any(|word| word == expected)
}

fn inventory(coverage: &CoverageMetadata) -> Vec<Uncertainty> {
    let mut result = Vec::new();
    for path in &coverage.excluded_paths {
        result.push(Uncertainty {
            kind: UncertaintyKind::ExcludedPath,
            path: Some(path.clone()),
            start: None,
            end: None,
            detail: "path is outside indexed scope".to_owned(),
        });
    }
    for range in &coverage.parser_error_ranges {
        result.push(Uncertainty {
            kind: UncertaintyKind::ParserErrorRange,
            path: Some(range.path.clone()),
            start: Some(range.start),
            end: Some(range.end),
            detail: "parser error range is not structurally covered".to_owned(),
        });
    }
    for path in &coverage.stale_paths {
        result.push(Uncertainty {
            kind: UncertaintyKind::StalePath,
            path: Some(path.clone()),
            start: None,
            end: None,
            detail: "path hash differs from the pinned snapshot".to_owned(),
        });
    }
    if coverage.traversal_truncated {
        result.push(Uncertainty {
            kind: UncertaintyKind::TraversalTruncated,
            path: None,
            start: None,
            end: None,
            detail: "bounded traversal ended with a remaining frontier".to_owned(),
        });
    }
    for callsite in &coverage.dynamic_dispatch {
        result.push(Uncertainty {
            kind: UncertaintyKind::DynamicDispatch,
            path: None,
            start: None,
            end: None,
            detail: callsite.clone(),
        });
    }
    result
}
