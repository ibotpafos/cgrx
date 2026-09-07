//! Executable CGRX runtime shared by the CLI and real-execution benchmark.

mod cargo_roots;
mod intent;
mod runtime;

pub use runtime::{
    GraphDirection, GraphViewRequest, ImportRuntimeEvidenceReport, IndexReport, OrientReport,
    RiskBaseline, Runtime, RuntimeError, RuntimeEvidenceFormat, RuntimeInsight,
    RuntimeInsightsReport,
};

/// Git executable used by all runtime subprocesses.
///
/// An explicit override is a single executable path, never shell arguments.
/// Invalid overrides fail normally; unset preserves PATH lookup.
pub fn git_executable() -> std::ffi::OsString {
    std::env::var_os("CGRX_GIT").unwrap_or_else(|| "git".into())
}
