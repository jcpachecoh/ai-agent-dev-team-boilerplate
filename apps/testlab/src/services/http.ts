import { authService } from './auth.service';

const API_ORIGIN = import.meta.env.VITE_API_URL ?? '';
const BASE_URL = `${API_ORIGIN}/api/testlab`;

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAndGetToken(): Promise<string> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = authService
      .refresh()
      .then((tokens) => tokens.accessToken)
      .finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
  }
  return refreshPromise!;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authService.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401) {
    try {
      const newToken = await refreshAndGetToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      const retry = await fetch(`${BASE_URL}${path}`, { ...init, headers });
      if (!retry.ok) {
        authService.clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
      return retry.json() as Promise<T>;
    } catch {
      authService.clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const message: string = await response.text().catch(() => response.statusText);
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const http = { request };
