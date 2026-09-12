const API_BASE_URL = "https://cookhub-api.unischool.jp";

export type Account = {
  id: number;
  username: string;
  email: string;
  [key: string]: unknown;
};

export type AuthResult = {
  account: Account;
  token: string;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
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

function splitAccountAndToken(body: Record<string, unknown>): AuthResult {
  const { token, ...rest } = body;
  const account = rest.account && typeof rest.account === "object" ? (rest.account as Account) : (rest as Account);
  return { account, token: token as string };
}

export async function login(username: string, password: string): Promise<AuthResult> {
  const body = await request<Record<string, unknown>>("/api/accounts/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return splitAccountAndToken(body);
}

export async function register(username: string, email: string, password: string): Promise<AuthResult> {
  const body = await request<Record<string, unknown>>("/api/accounts/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
  return splitAccountAndToken(body);
}

export async function fetchSession(token: string): Promise<Account> {
  return request<Account>("/api/accounts/session", {
    method: "GET",
    headers: { Authorization: `token ${token}` },
  });
}
