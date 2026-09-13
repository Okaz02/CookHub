import { request } from "./api"

export type Repository = {
    id: number;
    name: string;
    full_name: string;
    description: string;
    stars_count: number;
    html_url: string;
    owner: {
        login: string;
        avatar_url: string;
    };
}

export type ReposResponse = {
    ok: boolean;
    data: Repository[];
}

export async function getTrend(): Promise<ReposResponse> {
    return request<ReposResponse>("/api/repos/trend", {
        method: "GET"
    });
}

export async function getUserRepo(token: string): Promise<ReposResponse> {
    return request<ReposResponse>("/api/repos/mine", {
        method: "GET",
        headers: { Authorization: `token ${token}` }
    });
}