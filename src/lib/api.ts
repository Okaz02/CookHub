const API_BASE_URL = "https://cookhub-api.unischool.jp";

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export function authHeaders(token?: string | null): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function request<T>(path: string, options: RequestInit): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        });
    } catch {
        throw new ApiError(0, "サーバーに接続できませんでした。");
    }

    const body = await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(response.status, body?.error ?? "リクエストに失敗しました。");
    }

    return body as T;
}