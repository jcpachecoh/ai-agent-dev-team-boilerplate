/**
 * Global me query and changePassword mutation resolver tests.
 */

import type { Request } from 'express';
import { AuthenticationError, AuthorizationError } from '../../src/utils/errors';
import { resolveChangePassword } from '../../src/schema/auth/global-auth.mutation';
import { resolveGlobalMe } from '../../src/schema/auth/global-auth.query';
import type { GraphQLContext } from '../../src/context/types';

function makeRequest(headers: Record<string, string | undefined> = {}): Request {
  return {
    headers,
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Request;
}

function makeContext(
  request: Request,
  authKind: GraphQLContext['authKind'] = 'global',
  apiOverrides: Partial<{
    authMe: jest.Mock;
    authChangePassword: jest.Mock;
  }> = {},
): GraphQLContext {
  return {
    request,
    ip: '10.0.0.1',
    authKind,
    globalUser: authKind === 'global' ? { id: 'user-1', email: 'a@b.com' } : null,
    operationalUser: null,
    user: null,
    tenantId: null,
    isAuthenticated: authKind !== null,
    isGlobalAuthenticated: authKind === 'global',
    isOperationalAuthenticated: authKind === 'operational',
    services: {
      api: {
        authMe: apiOverrides.authMe ?? jest.fn(),
        authChangePassword: apiOverrides.authChangePassword ?? jest.fn(),
      },
    },
  } as unknown as GraphQLContext;
}

const apiProfile = {
  id: 'user-1',
  tenantId: 'palos-de-lena',
  email: 'user@example.com',
  cedula: '12345678',
  documentType: 'CC',
  emailVerified: true,
  isActive: true,
  roleCode: 'OPERATOR',
  createdAt: '2026-06-01T12:00:00.000Z',
};

describe('resolveGlobalMe', () => {
  it('delegates to authMe with Authorization header', async () => {
    const authMe = jest.fn().mockResolvedValue(apiProfile);
    const ctx = makeContext(
      makeRequest({ authorization: 'Bearer access-token', 'user-agent': 'jest' }),
      'global',
      { authMe },
    );

    const result = await resolveGlobalMe(null, {}, ctx);

    expect(authMe).toHaveBeenCalledWith({
      tenantId: undefined,
      authorization: 'Bearer access-token',
      userAgent: 'jest',
      forwardedFor: '10.0.0.1',
    });
    expect(result.id).toBe('user-1');
    expect(result.email).toBe('user@example.com');
    expect(result.roleCode).toBe('OPERATOR');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('refreshToken');
  });

  it('throws AuthorizationError when authKind is operational', async () => {
    const ctx = makeContext(makeRequest({ authorization: 'Bearer mes-token' }), 'operational', {
      authMe: jest.fn(),
    });

    await expect(resolveGlobalMe(null, {}, ctx)).rejects.toThrow(AuthorizationError);
    await expect(resolveGlobalMe(null, {}, ctx)).rejects.toThrow('Global authentication required');
  });
});

describe('resolveChangePassword', () => {
  it('delegates to authChangePassword with body and Authorization header', async () => {
    const authChangePassword = jest
      .fn()
      .mockResolvedValue({ message: 'Password updated successfully.' });
    const ctx = makeContext(makeRequest({ authorization: 'Bearer access-token' }), 'global', {
      authChangePassword,
    });

    const result = await resolveChangePassword(
      null,
      { input: { currentPassword: 'OldPass123!', newPassword: 'NewPass123!' } },
      ctx,
    );

    expect(result).toEqual({ message: 'Password updated successfully.' });
    expect(authChangePassword).toHaveBeenCalledWith(
      { currentPassword: 'OldPass123!', newPassword: 'NewPass123!' },
      expect.objectContaining({ authorization: 'Bearer access-token' }),
    );
  });

  it('throws AuthorizationError when authKind is operational', async () => {
    const ctx = makeContext(makeRequest({ authorization: 'Bearer mes-token' }), 'operational', {
      authChangePassword: jest.fn(),
    });

    await expect(
      resolveChangePassword(
        null,
        { input: { currentPassword: 'old', newPassword: 'NewPass123!' } },
        ctx,
      ),
    ).rejects.toThrow(AuthorizationError);
  });

  it('propagates AuthenticationError from API client on wrong current password', async () => {
    const authChangePassword = jest
      .fn()
      .mockRejectedValue(new AuthenticationError('Invalid credentials'));
    const ctx = makeContext(makeRequest({ authorization: 'Bearer access-token' }), 'global', {
      authChangePassword,
    });

    await expect(
      resolveChangePassword(
        null,
        { input: { currentPassword: 'wrong', newPassword: 'NewPass123!' } },
        ctx,
      ),
    ).rejects.toThrow(AuthenticationError);
  });
});
