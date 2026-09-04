use serde::{Deserialize, Serialize};

use crate::{CoreError, Hash32};

/// Repository state pinned to one source revision and graph generation.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct RepoSnapshot {
    pub repo_revision: String,
    pub working_tree_digest: Hash32,
    pub graph_generation: u64,
}

impl RepoSnapshot {
    /// Rejects attempts to combine snapshots from different repository states.
    pub fn assert_compatible(&self, other: &Self) -> Result<(), CoreError> {
        if self.repo_revision != other.repo_revision {
            return Err(CoreError::MixedRevision);
        }
        if self.working_tree_digest != other.working_tree_digest {
            return Err(CoreError::MixedWorkingTreeDigest);
        }
        if self.graph_generation != other.graph_generation {
            return Err(CoreError::MixedGeneration);
        }
        Ok(())
    }
}
