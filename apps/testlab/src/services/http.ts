const BASE_URL = '/api/testlab';

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    const message: string = await response.text().catch(() => response.statusText);
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const http = { request }; // keep backward compat
