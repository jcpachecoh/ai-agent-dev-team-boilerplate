import { describe, expect, it } from 'vitest';

import { formatRoleCode, formatUserDisplayName, mapAuthUserToViewModel } from './display';

describe('auth display mappers', () => {
  it('formats display name from email local part', () => {
    expect(formatUserDisplayName('mes-owner@palos-de-lena.dev')).toBe('Mes Owner');
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
      displayName: 'Admin',
      displayRole: 'Administrador',
      roleCode: 'ADMIN',
    });
  });
});
