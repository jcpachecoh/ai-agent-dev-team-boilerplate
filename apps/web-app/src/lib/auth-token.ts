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

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1])) as Record<string, unknown>;
    if (typeof payload['exp'] !== 'number') return false;
    // Add 10s leeway for clock skew
    return Date.now() >= (payload['exp'] as number) * 1000 - 10_000;
  } catch {
    return true;
  }
}

export function getAuthSessionToken(): string | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isUsableToken(stored) && !isTokenExpired(stored)) return stored.trim();
    if (stored) localStorage.removeItem(STORAGE_KEY); // auto-clear expired/invalid tokens
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

export function getRoleCodeFromToken(): string | undefined {
  const token = getAuthSessionToken();
  if (!token) return undefined;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;
    const payload = JSON.parse(atob(parts[1])) as Record<string, unknown>;
    const roleCode = payload['roleCode'];
    return typeof roleCode === 'string' ? roleCode : undefined;
  } catch {
    return undefined;
  }
}
