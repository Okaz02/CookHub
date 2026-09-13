import { request } from "./api"

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
