use cgrx_core::{EvidenceSelector, Mode, Scope};
use serde::Deserialize;
use serde_json::{Value, json};

use crate::JsonRpcError;

#[derive(Deserialize)]
pub(super) struct ToolCall {
    pub(super) name: String,
    #[serde(default)]
    pub(super) arguments: Value,
}

#[derive(Deserialize)]
pub(super) struct OrientArguments {
    pub(super) task: String,
    #[serde(default)]
    pub(super) budget: Option<u32>,
    #[serde(default)]
    pub(super) budget_preset: Option<BudgetPreset>,
    pub(super) mode: Mode,
    pub(super) scope: Scope,
}

#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub(super) enum BudgetPreset {
    Quick,
    Standard,
    Deep,
}

impl BudgetPreset {
    const fn tokens(self) -> u32 {
        match self {
            Self::Quick => 400,
            Self::Standard => 800,
            Self::Deep => 1_600,
        }
    }
}

impl OrientArguments {
    pub(super) fn resolved_budget(&self) -> Result<u32, JsonRpcError> {
        if self.budget.is_some() && self.budget_preset.is_some() {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_arguments",
                "use budget or budget_preset, not both",
            ));
        }
        let budget = self
            .budget
            .or_else(|| self.budget_preset.map(BudgetPreset::tokens))
            .unwrap_or_else(|| adaptive_orient_budget(&self.task, self.mode, &self.scope));
        if budget == 0 {
            return Err(JsonRpcError::typed(
                -32602,
                "cgrx.invalid_arguments",
                "budget must be greater than zero",
            ));
        }
        Ok(budget)
    }
}

fn adaptive_orient_budget(task: &str, mode: Mode, scope: &Scope) -> u32 {
    let mut budget = match mode {
        Mode::Fast => 400,
        Mode::Bounded => 600,
        Mode::Precise => 1_000,
    };
    let normalized = task.to_ascii_lowercase();
    let complex = [
        "architecture",
        "refactor",
        "migration",
        "impact",
        "архитект",
        "рефактор",
        "миграц",
        "влияни",
    ]
    .iter()
    .any(|marker| normalized.contains(marker));
    if complex {
        budget = budget.max(1_000);
    } else if task.len() > 120
        || scope.include.len() > 2
        || (scope.max_depth > 2
            && scope
                .include
                .iter()
                .any(|path| matches!(path.as_str(), "**" | "**/*")))
    {
        budget = budget.max(800);
    }
    budget
}

#[derive(Deserialize)]
pub(super) struct ExpandArguments {
    pub(super) handle: String,
    pub(super) budget: u32,
}

#[derive(Deserialize)]
pub(super) struct SearchGraphArguments {
    pub(super) query: String,
    #[serde(default)]
    pub(super) scope: Value,
    #[serde(default = "default_graph_limit")]
    pub(super) limit: u32,
    #[serde(default)]
    pub(super) language: Option<String>,
    #[serde(default)]
    pub(super) include_body: bool,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct IngestRuntimeEvidenceArguments {
    pub(super) input_path: String,
    #[serde(default = "default_runtime_format")]
    pub(super) format: String,
    #[serde(default)]
    pub(super) revision: Option<String>,
    #[serde(default)]
    pub(super) environment: Option<String>,
}

fn default_runtime_format() -> String {
    "auto".to_owned()
}

#[derive(Deserialize)]
pub(super) struct GetOutlineArguments {
    pub(super) path: String,
    #[serde(default = "default_outline_limit")]
    pub(super) limit: u32,
}

#[derive(Deserialize)]
pub(super) struct GetArchitectureArguments {
    #[serde(default)]
    pub(super) scope: Value,
    #[serde(default = "default_package_depth")]
    pub(super) package_depth: u8,
    #[serde(default = "default_architecture_limit")]
    pub(super) limit: u32,
    #[serde(default)]
    pub(super) offset: u32,
}

pub(super) const fn default_package_depth() -> u8 {
    2
}

const fn default_architecture_limit() -> u32 {
    50
}

#[derive(Deserialize)]
pub(super) struct TracePathArguments {
    pub(super) symbol: String,
    #[serde(default)]
    pub(super) path: Option<String>,
    #[serde(default = "default_trace_direction")]
    pub(super) direction: String,
    #[serde(default = "default_trace_depth")]
    pub(super) depth: u8,
    #[serde(default)]
    pub(super) scope: Value,
    #[serde(default = "default_graph_limit")]
    pub(super) limit: u32,
    #[serde(default)]
    pub(super) evidence: EvidenceSelector,
}

#[derive(Deserialize)]
pub(super) struct FindUsagesArguments {
    pub(super) symbol: String,
    #[serde(default)]
    pub(super) path: Option<String>,
    #[serde(default)]
    pub(super) scope: Value,
    #[serde(default = "default_usage_depth")]
    pub(super) depth: u8,
    #[serde(default = "default_outline_limit")]
    pub(super) limit: u32,
    #[serde(default)]
    pub(super) evidence: EvidenceSelector,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct SuggestRefactorsArguments {
    #[serde(default)]
    pub(super) scope: Value,
    #[serde(default)]
    pub(super) language: Option<String>,
    #[serde(default = "default_refactor_score")]
    pub(super) min_score: u16,
    #[serde(default = "default_graph_limit")]
    pub(super) limit: u32,
    #[serde(default)]
    pub(super) max_documents: usize,
    #[serde(default)]
    pub(super) max_pairs: usize,
}

const fn default_refactor_score() -> u16 {
    760
}

#[derive(Deserialize)]
pub(super) struct GetCodeSnippetArguments {
    pub(super) symbol: String,
    #[serde(default)]
    pub(super) path: Option<String>,
}

#[derive(Deserialize)]
pub(super) struct ExplainSymbolArguments {
    pub(super) symbol: String,
    #[serde(default)]
    pub(super) path: Option<String>,
    pub(super) scope: Value,
    #[serde(default = "default_depth")]
    pub(super) depth: u8,
    #[serde(default = "default_explain_limit")]
    pub(super) limit: u32,
}

fn default_depth() -> u8 {
    2
}

fn default_explain_limit() -> u32 {
    20
}

#[derive(Deserialize)]
pub(super) struct DetectDeadCodeArguments {
    pub(super) scope: Value,
    #[serde(default)]
    pub(super) language: Option<String>,
    #[serde(default = "default_dead_code_limit")]
    pub(super) limit: u32,
}

fn default_dead_code_limit() -> u32 {
    50
}

#[derive(Deserialize)]
pub(super) struct CheckIndexCoverageArguments {
    #[serde(default)]
    pub(super) paths: Vec<String>,
    #[serde(default)]
    pub(super) scopes: Vec<String>,
    #[serde(default)]
    pub(super) offset: usize,
    #[serde(default = "default_coverage_limit")]
    pub(super) limit: usize,
}

#[derive(Deserialize)]
pub(super) struct CheckFrameworkGatesArguments {
    #[serde(default)]
    pub(super) paths: Vec<String>,
    #[serde(default)]
    pub(super) scopes: Vec<String>,
    #[serde(default)]
    pub(super) fail_on: String,
    #[serde(default)]
    pub(super) max_framework_confidence: usize,
    #[serde(default)]
    pub(super) max_false_positive_matches: usize,
}

#[derive(Deserialize)]
pub(super) struct CheckSecurityGatesArguments {
    #[serde(default)]
    pub(super) fail_on: String,
    #[serde(default)]
    pub(super) max_secret_findings: usize,
    #[serde(default)]
    pub(super) max_dependency_findings: usize,
    #[serde(default)]
    pub(super) max_license_findings: usize,
    #[serde(default)]
    pub(super) allowlist_paths: Vec<String>,
    #[serde(default)]
    pub(super) allowlist_licenses: Vec<String>,
}

const fn default_coverage_limit() -> usize {
    100
}

const fn default_graph_limit() -> u32 {
    20
}

const fn default_outline_limit() -> u32 {
    200
}

const fn default_usage_depth() -> u8 {
    1
}

fn default_trace_direction() -> String {
    "both".to_owned()
}

const fn default_trace_depth() -> u8 {
    2
}

#[derive(Deserialize)]
pub(super) struct StatusArguments {
    #[serde(default = "default_status_paths_or_scope")]
    pub(super) paths_or_scope: Value,
}

fn default_status_paths_or_scope() -> Value {
    json!(["**/*"])
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct MemorySpanArguments {
    pub(super) start_line: u32,
    pub(super) end_line: u32,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct MemoryRecordArguments {
    pub(super) fact: String,
    pub(super) confidence: u16,
    pub(super) repo: String,
    #[serde(default)]
    pub(super) rev: Option<String>,
    pub(super) path: String,
    #[serde(default)]
    pub(super) span: Option<MemorySpanArguments>,
    #[serde(default)]
    pub(super) valid_until_unix_nanos: Option<u64>,
    #[serde(default)]
    pub(super) privacy_tag: Option<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct MemoryRecallArguments {
    #[serde(default)]
    pub(super) query: Option<String>,
    #[serde(default)]
    pub(super) min_confidence: Option<u16>,
    #[serde(default)]
    pub(super) privacy_tag: Option<String>,
    #[serde(default)]
    pub(super) revision: Option<String>,
    #[serde(default)]
    pub(super) limit: Option<usize>,
}
