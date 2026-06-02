/**
 * Operational auth GraphQL resolver tests — mock ApiClient and assert delegate calls.
 */

import type { Request } from 'express';
import type { GraphQLContext } from '../../src/context/types';
import { AuthorizationError, ValidationError } from '../../src/utils/errors';
import {
  resolveOperationalLogin,
  resolveOperationalLogout,
} from '../../src/schema/auth/operational-auth.mutation';
import { resolveOperationalMe } from '../../src/schema/auth/operational-auth.query';

function makeRequest(headers: Record<string, string | undefined> = {}): Request {
  return {
    headers,
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Request;
}

function makeContext(
  request: Request,
  authKind: GraphQLContext['authKind'] = null,
  apiOverrides: Partial<{
    mesAuthLogin: jest.Mock;
    mesAuthMe: jest.Mock;
    mesAuthLogout: jest.Mock;
  }> = {},
): GraphQLContext {
  return {
    request,
    ip: '10.0.0.1',
    authKind,
    globalUser: authKind === 'global' ? { id: 'user-1', email: 'a@b.com' } : null,
    operationalUser: authKind === 'operational' ? { id: 'op-1', role: 'OWNER' } : null,
    user: authKind === 'operational' ? { id: 'op-1', role: 'OWNER' } : null,
    tenantId: null,
    isAuthenticated: authKind !== null,
    isGlobalAuthenticated: authKind === 'global',
    isOperationalAuthenticated: authKind === 'operational',
    services: {
      api: {
        mesAuthLogin: apiOverrides.mesAuthLogin ?? jest.fn(),
        mesAuthMe: apiOverrides.mesAuthMe ?? jest.fn(),
        mesAuthLogout: apiOverrides.mesAuthLogout ?? jest.fn(),
      },
    },
  } as unknown as GraphQLContext;
}

const mesTokens = {
  accessToken: 'mes-access-token',
  refreshToken: 'mes-refresh-token',
  operator: {
    id: 'op-1',
    role: 'OWNER',
    tenantId: 'palos-de-lena',
    sedeId: null,
  },
};

const mesProfile = {
  id: 'op-1',
  role: 'OWNER',
  tenantId: 'palos-de-lena',
  sedeId: null,
};

describe('resolveOperationalLogin', () => {
  it('delegates to mesAuthLogin with tenant header and forwarded metadata', async () => {
    const mesAuthLogin = jest.fn().mockResolvedValue(mesTokens);
    const ctx = makeContext(
      makeRequest({
        'x-tenant-id': 'palos-de-lena',
        'user-agent': 'jest-agent',
      }),
      null,
      { mesAuthLogin },
    );

    const result = await resolveOperationalLogin(
      null,
      { input: { cedula: '12345678', pin: '1234' } },
      ctx,
    );

    expect(result).toEqual(mesTokens);
    expect(mesAuthLogin).toHaveBeenCalledWith(
      { cedula: '12345678', pin: '1234' },
      {
        tenantId: 'palos-de-lena',
        authorization: undefined,
        userAgent: 'jest-agent',
        forwardedFor: '10.0.0.1',
      },
    );
  });

  it('throws ValidationError when x-tenant-id header is missing', async () => {
    const ctx = makeContext(makeRequest(), null, { mesAuthLogin: jest.fn() });

    await expect(
      resolveOperationalLogin(null, { input: { cedula: '12345678', pin: '1234' } }, ctx),
    ).rejects.toThrow(ValidationError);

    await expect(
      resolveOperationalLogin(null, { input: { cedula: '12345678', pin: '1234' } }, ctx),
    ).rejects.toThrow('x-tenant-id header is required');
  });
});

describe('resolveOperationalMe', () => {
  it('delegates to mesAuthMe with Authorization header', async () => {
    const mesAuthMe = jest.fn().mockResolvedValue(mesProfile);
    const ctx = makeContext(
      makeRequest({ authorization: 'Bearer mes-access-token', 'user-agent': 'jest' }),
      'operational',
      { mesAuthMe },
    );

    const result = await resolveOperationalMe(null, {}, ctx);

    expect(mesAuthMe).toHaveBeenCalledWith({
      tenantId: undefined,
      authorization: 'Bearer mes-access-token',
      userAgent: 'jest',
      forwardedFor: '10.0.0.1',
    });
    expect(result).toEqual({
      id: 'op-1',
      role: 'OWNER',
      tenantId: 'palos-de-lena',
      sedeId: null,
    });
    expect(result).not.toHaveProperty('pinHash');
    expect(result).not.toHaveProperty('cedulaHash');
  });

  it('throws AuthorizationError when authKind is global', async () => {
    const ctx = makeContext(makeRequest({ authorization: 'Bearer global-token' }), 'global', {
      mesAuthMe: jest.fn(),
    });

    await expect(resolveOperationalMe(null, {}, ctx)).rejects.toThrow(AuthorizationError);
    await expect(resolveOperationalMe(null, {}, ctx)).rejects.toThrow(
      'Operational authentication required',
    );
  });
});

describe('resolveOperationalLogout', () => {
  it('delegates to mesAuthLogout with Authorization header and forwarded metadata', async () => {
    const mesAuthLogout = jest.fn().mockResolvedValue({ message: 'Logged out successfully.' });
    const ctx = makeContext(
      makeRequest({ authorization: 'Bearer mes-access-token', 'user-agent': 'jest' }),
      'operational',
      { mesAuthLogout },
    );

    const result = await resolveOperationalLogout(null, {}, ctx);

    expect(result).toEqual({ message: 'Logged out successfully.' });
    expect(mesAuthLogout).toHaveBeenCalledWith({
      tenantId: undefined,
      authorization: 'Bearer mes-access-token',
      userAgent: 'jest',
      forwardedFor: '10.0.0.1',
    });
  });

  it('throws AuthorizationError when authKind is global', async () => {
    const ctx = makeContext(makeRequest({ authorization: 'Bearer global-token' }), 'global', {
      mesAuthLogout: jest.fn(),
    });

    await expect(resolveOperationalLogout(null, {}, ctx)).rejects.toThrow(AuthorizationError);
    await expect(resolveOperationalLogout(null, {}, ctx)).rejects.toThrow(
      'Operational authentication required',
    );
  });
});
