import type {
  GitGraphCapabilities,
  GitGraphCommitDetails,
  GitGraphFileDiff,
  GitGraphPage,
  GitGraphRevision
} from "@web-git-graph/protocol";
import type { GitGraphHistoryRequest, GitGraphProvider } from "@web-git-graph/web";

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

export type GitGraphApi = (path: string, signal?: AbortSignal) => Promise<unknown>;

export class CgrxGitGraphProvider implements GitGraphProvider {
  private readonly api: GitGraphApi;

  constructor(api: GitGraphApi) {
    this.api = api;
  }

  async getCapabilities(): Promise<GitGraphCapabilities> {
    return {
      protocolVersion: "1",
      history: true,
      details: true,
      compare: false,
      diff: true,
      workingTree: false,
      stashes: false,
      maxPageSize: 200,
      maxDiffBytes: 256 * 1024
    };
  }

  async getHistory(request: GitGraphHistoryRequest = {}): Promise<GitGraphPage> {
    const query = new URLSearchParams();
    query.set("limit", String(Math.min(200, Math.max(1, request.limit ?? 200))));
    if (request.cursor) query.set("cursor", request.cursor);
    for (const ref of request.refs ?? []) query.append("ref", ref);
    const value = await this.api(`/api/git-history?${query}`, request.signal) as GitHistoryResponse;
    return pageForGitGraph(value);
  }

  async getCommitDetails(
    _repositoryId: string | undefined,
    revision: GitGraphRevision,
    signal?: AbortSignal
  ): Promise<GitGraphCommitDetails> {
    const oid = commitOid(revision);
    return await this.api(`/api/git-commit?oid=${encodeURIComponent(oid)}`, signal) as GitGraphCommitDetails;
  }

  async getFileDiff(
    _repositoryId: string | undefined,
    base: GitGraphRevision,
    head: GitGraphRevision,
    path: string,
    context = 3,
    signal?: AbortSignal
  ): Promise<GitGraphFileDiff> {
    const query = new URLSearchParams({
      base: commitOid(base),
      head: commitOid(head),
      path,
      context: String(context)
    });
    return await this.api(`/api/git-diff?${query}`, signal) as GitGraphFileDiff;
  }
}

function commitOid(revision: GitGraphRevision): string {
  if (revision.kind !== "commit") throw new Error("CGRX Git history supports commit revisions only");
  return revision.oid;
}
