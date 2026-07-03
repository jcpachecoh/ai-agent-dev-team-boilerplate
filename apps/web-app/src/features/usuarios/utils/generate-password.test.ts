import { describe, expect, it } from 'vitest';

import {
  generateOperatorPin,
  generatePasswordForRole,
  generateWebUserPassword,
  isValidGeneratedPassword,
} from './generate-password';

describe('generate-password', () => {
  it('generates web passwords with at least 8 characters', () => {
    const password = generateWebUserPassword();
    expect(password.length).toBeGreaterThanOrEqual(8);
    expect(isValidGeneratedPassword(password)).toBe(true);
  });

  it('generates operator pins with 6 digits', () => {
    const pin = generateOperatorPin();
    expect(pin).toMatch(/^\d{6}$/);
    expect(isValidGeneratedPassword(pin, 'OPERATOR')).toBe(true);
  });

  it('switches format based on role code', () => {
    expect(generatePasswordForRole('OPERATOR')).toMatch(/^\d{6}$/);
    expect(generatePasswordForRole('OWNER').length).toBeGreaterThanOrEqual(8);
  });
});
