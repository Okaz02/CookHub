import { request, authHeaders } from "./api"

export type PullRequestStatus = 0 | 1;

export type PullRequest = {
    id: number;
    target_recipe_id: number;
    source_recipe_id: number;
    user_id: number;
    title: string;
    content: string | null;
    status: PullRequestStatus;
    merged_commit_hash: string | null;
    created_at: string;
    updated_at: string;
    merged_at: string | null;
};

export type PullRequestResponse = {
    ok: boolean;
    commit?: string | null;
    data: PullRequest;
};

export type CreatePullRequestInput = {
    title: string;
    content?: string;
    commit_message?: string;
};

export type MergePullRequestInput = {
    commit_message?: string;
};

export async function createPullRequest(
    forkRecipeId: number,
    input: CreatePullRequestInput,
    token: string
): Promise<PullRequestResponse> {
    return request<PullRequestResponse>(`/api/repos/${forkRecipeId}/pull-request/create`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(input),
    });
}

export async function mergePullRequest(
    pullRequestId: number,
    input: MergePullRequestInput,
    token: string
): Promise<PullRequestResponse> {
    return request<PullRequestResponse>(`/api/repos/${pullRequestId}/pull-request/merge`, {
        method: "POST",
        headers: authHeaders(token),
        body: input.commit_message ? JSON.stringify(input) : undefined,
    });
}
