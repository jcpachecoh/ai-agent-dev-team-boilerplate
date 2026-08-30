const PIN_PATTERN = /^\d{4,6}$/;

function bytesToBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export function generateWebUserPassword(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export function generateOperatorPin(): string {
  const value = (crypto.getRandomValues(new Uint32Array(1))[0] % 900000) + 100000;
  return String(value);
}

export function generatePasswordForRole(roleCode?: string): string {
  return roleCode === 'OPERATOR' ? generateOperatorPin() : generateWebUserPassword();
}

export function isValidGeneratedPassword(password: string, roleCode?: string): boolean {
  if (roleCode === 'OPERATOR') {
    return PIN_PATTERN.test(password);
  }
  return password.length >= 8;
}
