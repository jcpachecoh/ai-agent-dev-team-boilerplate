const API_ORIGIN = import.meta.env.VITE_API_URL ?? '';
const AUTH_BASE = `${API_ORIGIN}/api/auth`;

const ACCESS_TOKEN_KEY = 'riq_access_token';
const REFRESH_TOKEN_KEY = 'riq_refresh_token';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function signup(email: string, name: string, password: string): Promise<AuthTokens> {
  const tokens = await post<AuthTokens>('/signup', { email, name, password });
  storeTokens(tokens);
  return tokens;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const tokens = await post<AuthTokens>('/login', { email, password });
  storeTokens(tokens);
  return tokens;
}

export async function refresh(): Promise<AuthTokens> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  const tokens = await post<AuthTokens>('/refresh', {}, refreshToken);
  storeTokens(tokens);
  return tokens;
}

export async function logout(): Promise<void> {
  const accessToken = getAccessToken();
  if (accessToken) {
    await post<void>('/logout', {}, accessToken).catch(() => {
      /* ignore */
    });
  }
  clearTokens();
}

export const authService = {
  signup,
  login,
  logout,
  refresh,
  getAccessToken,
  getRefreshToken,
  clearTokens,
};
