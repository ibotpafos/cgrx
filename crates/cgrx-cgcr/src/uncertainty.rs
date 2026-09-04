use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
pub struct CoverageMetadata {
    pub excluded_paths: Vec<String>,
    pub parser_error_ranges: Vec<SourceRange>,
    pub stale_paths: Vec<String>,
    pub traversal_truncated: bool,
    pub dynamic_dispatch: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
pub struct SourceRange {
    pub path: String,
    pub start: usize,
    pub end: usize,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UncertaintyKind {
    ExcludedPath,
    ParserErrorRange,
    StalePath,
    TraversalTruncated,
    DynamicDispatch,
    MissingAnchor,
}

#[derive(Clone, Debug, Deserialize, Eq, Ord, PartialEq, PartialOrd, Serialize)]
pub struct Uncertainty {
    pub kind: UncertaintyKind,
    pub path: Option<String>,
    pub start: Option<usize>,
    pub end: Option<usize>,
    pub detail: String,
}
