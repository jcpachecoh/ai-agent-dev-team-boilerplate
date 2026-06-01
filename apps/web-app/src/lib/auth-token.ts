const STORAGE_KEY = 'restopsiq.graphql.token';

/**
 * Session JWT set only after a successful /login (MES).
 */
function isUsableToken(value: string): boolean {
  const token = value.trim();
  if (!token) return false;
  if (token.includes('<') || token.includes('>')) return false;
  if (token.toLowerCase().includes('token del login')) return false;
  return true;
}

export function getAuthSessionToken(): string | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isUsableToken(stored)) return stored.trim();
    return undefined;
  } catch {
    return undefined;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthSessionToken());
}

/** Bearer token for GraphQL (same as session after login). */
export function getGraphqlAuthToken(): string | undefined {
  return getAuthSessionToken();
}

export function setGraphqlAuthToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearGraphqlAuthToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}
