const STORAGE_KEY = 'restopsiq.mes.token';

function isUsableToken(value: string): boolean {
  const token = value.trim();
  return token.length > 0 && !token.includes('<');
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1])) as Record<string, unknown>;
    if (typeof payload['exp'] !== 'number') return false;
    return Date.now() >= (payload['exp'] as number) * 1000 - 10_000;
  } catch {
    return true;
  }
}

export function getMesAccessToken(): string | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isUsableToken(stored) && !isTokenExpired(stored)) {
      return stored.trim();
    }
    if (stored) localStorage.removeItem(STORAGE_KEY);
    return undefined;
  } catch {
    return undefined;
  }
}

export function setMesAccessToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearMesAccessToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}
