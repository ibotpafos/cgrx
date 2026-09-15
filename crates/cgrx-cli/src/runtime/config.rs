//! Runtime caps that bound memory and work for large, monorepo-scale indexes.
//!
//! These were previously hard-coded `const`s scattered across `risks.rs` and
//! `refactors.rs`. Centralizing them in `RuntimeConfig` keeps the call sites
//! stable while making the caps tunable without editing each site. The
//! `Default` values reproduce the previously hard-coded constants exactly so
//! behavior is unchanged for the common path.

/// Tunable caps that bound how many documents, edges, candidate pairs, and
/// evidence records a single scan will consider before degrading to a
/// `partial` (best-effort) result.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RuntimeConfig {
    /// Maximum number of stored documents a scan will fully process.
    pub max_documents: usize,
    /// Maximum number of stored edges a scan will fully process.
    pub max_edges: usize,
    /// Maximum number of candidate pairs considered during refactor matching.
    pub max_pairs: usize,
    /// Maximum number of evidence records included in a result projection.
    pub max_evidence: usize,
}

impl Default for RuntimeConfig {
    fn default() -> Self {
        Self {
            max_documents: 100_000,
            max_edges: 20_000,
            max_pairs: 100_000,
            max_evidence: 2_000,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::RuntimeConfig;

    #[test]
    fn default_matches_documented_constants() {
        let config = RuntimeConfig::default();
        assert_eq!(config.max_documents, 100_000);
        assert_eq!(config.max_edges, 20_000);
        assert_eq!(config.max_pairs, 100_000);
        assert_eq!(config.max_evidence, 2_000);
    }
}
