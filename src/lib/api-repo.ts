import { request, authHeaders } from "./api"

export type Owner = {
    user_id: number;
    username: string;
};

export type Permissions = {
    admin: boolean;
    push: boolean;
    pull: boolean;
};

export type Repository = {
    id: number;
    name: string;
    full_name: string;
    description: string;
    owner: Owner;
    private: boolean;
    draft: boolean;
    thumbnail: string | null;
    permissions: Permissions;
    default_branch: string;
    fork: boolean;
    fork_type: number;
    parent_id: number | null;
    stars_count: number;
    created_at: string;
    updated_at: string;
};

// 下書き(draft)と公開範囲(private)は独立した2つの軸として扱う。
//   draft   : 執筆中かどうか。下書きの間は公開範囲に関わらず他人には表示されない。
//   private : 公開済みになったときに誰が見られるか（自分のみ / 全体）。
export type RepoStateTone = "draft" | "private" | "public";

export type RepoStateBadge = {
    key: "status" | "visibility";
    label: string;
    tone: RepoStateTone;
};

export type RepoState = Pick<Repository, "draft" | "private">;

export function getRepoStatusLabel(repo: RepoState): string {
    return repo.draft ? "下書き" : "公開済み";
}

export function getRepoVisibilityLabel(repo: RepoState): string {
    return repo.private ? "自分のみ" : "全体公開";
}

export function getRepoStateBadges(repo: RepoState): RepoStateBadge[] {
    return [
        { key: "status", label: getRepoStatusLabel(repo), tone: repo.draft ? "draft" : "public" },
        { key: "visibility", label: getRepoVisibilityLabel(repo), tone: repo.private ? "private" : "public" },
    ];
}

// 2つの軸の組み合わせを、閲覧できる相手の観点で説明する。
export function getRepoStateNotice(repo: RepoState): string | null {
    if (repo.draft && repo.private) {
        return "下書きです。公開範囲も「自分のみ」なので、自分だけが閲覧できます。";
    }
    if (repo.draft) {
        return "下書きです。公開範囲は「全体公開」ですが、公開するまで他の人には表示されません。";
    }
    if (repo.private) {
        return "公開済みですが、公開範囲が「自分のみ」のため他の人には表示されません。";
    }
    return null;
}

export type Environment = {
    key_name: string;
    value: string;
};

export type Ingredient = {
    name: string;
    amount: number | string;
    unit: string;
};

export type Step = {
    body: string;
    image_url: string | null;
};

export type CommitAuthor = string | { username?: string; email?: string } | null;

export type Commit = {
    sha: string;
    message: string;
    author: CommitAuthor;
    date: string;
    [key: string]: unknown;
};

export function getCommitAuthorName(author: CommitAuthor): string {
    if (!author) return "unknown";
    if (typeof author === "string") return author;
    if (author.username) return author.username;
    if (author.email) return author.email;
    return "unknown";
}

export function formatCommitDate(value: string | null | undefined): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("ja-JP");
}

export type DiffRow = {
    diff_type: "added" | "modified" | "removed";
    [key: string]: unknown;
};

export type CommitDetail = Commit & {
    changes: {
        info: DiffRow[];
        environment: DiffRow[];
        ingredients: DiffRow[];
        steps: DiffRow[];
    };
};

export type RepositoryDetail = Repository & {
    environment: Environment[];
    ingredients: Ingredient[];
    steps: Step[];
    latest_commit: Commit | null;
};

export type ReposResponse = {
    ok: boolean;
    data: Repository[];
};

export type RepoResponse = {
    ok: boolean;
    commit?: string | null;
    data: RepositoryDetail;
};

export type CommitsResponse = {
    ok: boolean;
    data: Commit[];
};

export type CommitResponse = {
    ok: boolean;
    data: CommitDetail;
};

export type RepoInput = {
    title?: string;
    name?: string;
    description?: string;
    is_private?: boolean;
    is_draft?: boolean;
    thumbnail?: string | null;
    environment?: Environment[];
    ingredients?: Ingredient[];
    steps?: Step[];
    commit_message?: string;
};

export type ForkInput = RepoInput & {
    fork_type?: 1 | 2;
};

export async function getTrend(token?: string | null): Promise<ReposResponse> {
    return request<ReposResponse>("/api/repos/trend", {
        method: "GET",
        headers: authHeaders(token),
    });
}

export async function getUserRepo(token: string): Promise<ReposResponse> {
    return request<ReposResponse>("/api/repos/mine", {
        method: "GET",
        headers: authHeaders(token),
    });
}

export async function getRepo(id: number, token?: string | null): Promise<RepoResponse> {
    return request<RepoResponse>(`/api/repos/${id}`, {
        method: "GET",
        headers: authHeaders(token),
    });
}

export async function getRepoCommits(id: number, token?: string | null): Promise<CommitsResponse> {
    return request<CommitsResponse>(`/api/repos/${id}/commits`, {
        method: "GET",
        headers: authHeaders(token),
    });
}

export async function getRepoCommit(id: number, commitId: string, token?: string | null): Promise<CommitResponse> {
    return request<CommitResponse>(`/api/repos/${id}/commits/${commitId}`, {
        method: "GET",
        headers: authHeaders(token),
    });
}

export async function createRepo(input: RepoInput, token: string): Promise<RepoResponse> {
    return request<RepoResponse>("/api/repos", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(input),
    });
}

export async function updateRepo(id: number, input: RepoInput, token: string): Promise<RepoResponse> {
    return request<RepoResponse>(`/api/repos/${id}`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(input),
    });
}

export async function deleteRepo(id: number, token: string): Promise<{ ok: boolean; commit?: string | null; data: { id: number } }> {
    return request(`/api/repos/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
    });
}

export async function forkRepo(id: number, input: ForkInput, token: string): Promise<RepoResponse> {
    return request<RepoResponse>(`/api/repos/${id}/fork`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(input),
    });
}
