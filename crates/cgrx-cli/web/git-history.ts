import type { GitGraphPage } from "@web-git-graph/protocol";

export interface GitHistoryResponse extends GitGraphPage {
  snapshot: {
    repo_revision: string;
    working_tree_digest: string;
    graph_generation: number;
  };
}

export function pageForGitGraph(value: GitHistoryResponse): GitGraphPage {
  return {
    commits: value.commits ?? [],
    refs: value.refs ?? [],
    head: value.head,
    hasMore: Boolean(value.hasMore),
    repositoryId: value.repositoryId,
    repositoryName: value.repositoryName
  };
}
