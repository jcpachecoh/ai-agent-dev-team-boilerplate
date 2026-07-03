import { describe, expect, it } from 'vitest';

import {
  formatUsuarioDocumentType,
  formatUsuarioLastLogin,
  resolveUsuarioRoleVariant,
} from './usuario-utils';

describe('formatUsuarioLastLogin', () => {
  it('returns em dash when date is null', () => {
    expect(formatUsuarioLastLogin(null)).toBe('—');
  });

  it('returns em dash when date is undefined', () => {
    expect(formatUsuarioLastLogin(undefined)).toBe('—');
  });

  it('formats valid ISO dates in es-CO locale', () => {
    const formatted = formatUsuarioLastLogin('2026-06-15T10:30:00.000Z');
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/2026/);
  });

  it('returns original string for invalid dates', () => {
    expect(formatUsuarioLastLogin('invalid-date')).toBe('invalid-date');
  });
});

describe('formatUsuarioDocumentType', () => {
  it('normalizes known document types', () => {
    expect(formatUsuarioDocumentType('cc')).toBe('CC');
    expect(formatUsuarioDocumentType('PASAPORTE')).toBe('PASAPORTE');
  });

  it('returns unknown types unchanged', () => {
    expect(formatUsuarioDocumentType('CUSTOM')).toBe('CUSTOM');
  });
});

describe('resolveUsuarioRoleVariant', () => {
  it('maps OWNER and SUPERVISOR to dedicated variants', () => {
    expect(resolveUsuarioRoleVariant('OWNER')).toBe('owner');
    expect(resolveUsuarioRoleVariant('supervisor')).toBe('supervisor');
  });

  it('maps MANAGER to manager variant', () => {
    expect(resolveUsuarioRoleVariant('MANAGER')).toBe('manager');
  });

  it('falls back to default for unknown roles', () => {
    expect(resolveUsuarioRoleVariant('OPERATOR')).toBe('default');
    expect(resolveUsuarioRoleVariant(undefined)).toBe('default');
  });
});
