import { describe, expect, it } from 'vitest';

import {
  formatRoleCode,
  formatUserDisplayName,
  mapAuthUserToViewModel,
  resolveUserDisplayName,
} from './display';

describe('auth display mappers', () => {
  it('formats display name from email local part', () => {
    expect(formatUserDisplayName('mes-owner@palos-de-lena.dev')).toBe('Mes Owner');
  });

  it('prefers API name over email fallback', () => {
    expect(
      resolveUserDisplayName({
        name: 'Propietario Principal',
        email: 'signup.1781213262141@example.com',
      }),
    ).toBe('Propietario Principal');
  });

  it('falls back to generic label when name is missing', () => {
    expect(
      resolveUserDisplayName({
        name: null,
        email: 'signup.1781213262141@example.com',
      }),
    ).toBe('Usuario');
  });

  it('maps role code to Spanish label', () => {
    expect(formatRoleCode('OPERATOR')).toBe('Operador');
  });

  it('maps API profile to view model', () => {
    expect(
      mapAuthUserToViewModel({
        id: 'user-1',
        tenantId: 'palos-de-lena',
        email: 'admin@example.com',
        name: 'Patricia Álvarez',
        cedula: '1',
        documentType: 'CC',
        emailVerified: true,
        isActive: true,
        roleCode: 'ADMIN',
        createdAt: '2024-01-01T00:00:00.000Z',
      }),
    ).toEqual({
      id: 'user-1',
      tenantId: 'palos-de-lena',
      email: 'admin@example.com',
      displayName: 'Patricia Álvarez',
      displayRole: 'Administrador',
      roleCode: 'ADMIN',
    });
  });
});
