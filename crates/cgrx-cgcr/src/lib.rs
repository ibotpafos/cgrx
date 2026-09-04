//! Deterministic query obligations and uncertainty inventory for CGCR.

mod engine;
mod obligations;
mod probe;
mod scheduler;
mod uncertainty;

pub use engine::{CgcrEngine, CompileRequest, CompiledContext, EngineResidual, EphemeralGraph};
pub use obligations::{
    EvidenceRef, Obligation, ObligationCompiler, ObligationKind, ObligationSet, ObligationState,
    QueryClass, ResidualReason, ResolvedAnchor,
};
pub use probe::{
    Probe, ProbeCost, ProbeError, ProbeFact, ProbeKind, ProbeOracle, ProbeOutcome,
    RevisionBoundSpan,
};
pub use scheduler::{CostTable, Counterexample, ProbePlan, RemainingBudget, choose_probe};
pub use uncertainty::{CoverageMetadata, SourceRange, Uncertainty, UncertaintyKind};
