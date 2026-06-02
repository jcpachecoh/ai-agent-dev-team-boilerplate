/**
 * Context factory and dual JWT auth session tests
 */

const TEST_JWT_SECRET = 'test-jwt-secret-minimum-32-characters!!';
const TEST_MES_JWT_SECRET = 'test-mes-jwt-secret-minimum-32-chars!!';

jest.mock('../src/config/env', () => ({
  env: {
    JWT_SECRET: TEST_JWT_SECRET,
    MES_JWT_SECRET: TEST_MES_JWT_SECRET,
    graphqlAuthDisabled: false,
    graphqlDevTenantId: 'palos-de-lena',
  },
}));

jest.mock('../src/config/prisma', () => ({
  prisma: { operationalUser: { findUnique: jest.fn() } },
}));

jest.mock('../src/config/redis', () => ({
  redis: {
    status: 'ready',
    on: jest.fn(),
  },
}));

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
  })),
}));

jest.mock('../src/services/types', () => ({
  createServices: jest.fn(() => ({
    supplier: {},
    auth: {},
    tenant: {},
    email: {},
    file: {},
    purchaseOrder: {},
    recipe: {},
    api: {},
  })),
}));

import jwt from 'jsonwebtoken';
import { createContext } from '../src/context/createContext';
import { resolveAuthSession } from '../src/auth/auth.guard';
import { UserRole } from '../src/auth/types';
import type { Request } from 'express';

function makeRequest(authHeader?: string): Request {
  return {
    headers: { authorization: authHeader },
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Request;
}

function signGlobalToken(payload: { sub: string; email: string }): string {
  return jwt.sign(payload, TEST_JWT_SECRET, { algorithm: 'HS256' });
}

function signOperationalToken(
  payload: {
    sub: string;
    tenantId: string;
    role: string;
    sedeId?: string;
    jti?: string;
  },
  secret = TEST_MES_JWT_SECRET,
): string {
  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}

describe('resolveAuthSession', () => {
  it('returns unauthenticated session when no Authorization header is present', () => {
    const session = resolveAuthSession(makeRequest());

    expect(session.isAuthenticated).toBe(false);
    expect(session.authKind).toBeNull();
    expect(session.globalUser).toBeNull();
    expect(session.operationalUser).toBeNull();
    expect(session.user).toBeNull();
    expect(session.tenantId).toBeNull();
  });

  it('returns global session for JWT signed with JWT_SECRET and email claim', () => {
    const token = signGlobalToken({ sub: 'user-global', email: 'user@example.com' });
    const session = resolveAuthSession(makeRequest(`Bearer ${token}`));

    expect(session.isAuthenticated).toBe(true);
    expect(session.authKind).toBe('global');
    expect(session.globalUser).toEqual({ id: 'user-global', email: 'user@example.com' });
    expect(session.operationalUser).toBeNull();
    expect(session.user).toBeNull();
    expect(session.tenantId).toBeNull();
  });

  it('returns operational session for JWT signed with MES_JWT_SECRET', () => {
    const token = signOperationalToken({
      sub: 'op-user-1',
      tenantId: 'tenant-abc',
      role: UserRole.OPERATOR,
      sedeId: 'sede-1',
      jti: 'jti-123',
    });
    const session = resolveAuthSession(makeRequest(`Bearer ${token}`));

    expect(session.isAuthenticated).toBe(true);
    expect(session.authKind).toBe('operational');
    expect(session.globalUser).toBeNull();
    expect(session.operationalUser).toEqual({
      id: 'op-user-1',
      tenantId: 'tenant-abc',
      role: UserRole.OPERATOR,
      sedeId: 'sede-1',
      jti: 'jti-123',
    });
    expect(session.user).toEqual({
      id: 'op-user-1',
      tenantId: 'tenant-abc',
      role: UserRole.OPERATOR,
      sedeId: 'sede-1',
    });
    expect(session.tenantId).toBe('tenant-abc');
  });

  it('returns operational session for JWT signed with JWT_SECRET when no email claim (dev parity)', () => {
    const token = signOperationalToken(
      {
        sub: 'op-user-2',
        tenantId: 'tenant-dev',
        role: UserRole.MANAGER,
      },
      TEST_JWT_SECRET,
    );
    const session = resolveAuthSession(makeRequest(`Bearer ${token}`));

    expect(session.authKind).toBe('operational');
    expect(session.operationalUser?.id).toBe('op-user-2');
    expect(session.tenantId).toBe('tenant-dev');
  });

  it('returns unauthenticated session for invalid token', () => {
    const session = resolveAuthSession(makeRequest('Bearer not-a-valid-jwt'));

    expect(session.isAuthenticated).toBe(false);
    expect(session.authKind).toBeNull();
    expect(session.user).toBeNull();
  });
});

describe('createContext', () => {
  it('maps resolveAuthSession into GraphQLContext flags', async () => {
    const token = signGlobalToken({ sub: 'user-global', email: 'user@example.com' });
    const ctx = await createContext({ req: makeRequest(`Bearer ${token}`) });

    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.isGlobalAuthenticated).toBe(true);
    expect(ctx.isOperationalAuthenticated).toBe(false);
    expect(ctx.authKind).toBe('global');
    expect(ctx.globalUser?.email).toBe('user@example.com');
    expect(ctx.user).toBeNull();
    expect(ctx.tenantId).toBeNull();
  });

  it('sets operational auth flags for MES token', async () => {
    const token = signOperationalToken({
      sub: 'op-user-1',
      tenantId: 'tenant-abc',
      role: UserRole.OWNER,
    });
    const ctx = await createContext({ req: makeRequest(`Bearer ${token}`) });

    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.isGlobalAuthenticated).toBe(false);
    expect(ctx.isOperationalAuthenticated).toBe(true);
    expect(ctx.authKind).toBe('operational');
    expect(ctx.user?.tenantId).toBe('tenant-abc');
  });

  it('returns unauthenticated context when no token is present', async () => {
    const ctx = await createContext({ req: makeRequest() });

    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.isGlobalAuthenticated).toBe(false);
    expect(ctx.isOperationalAuthenticated).toBe(false);
    expect(ctx.user).toBeNull();
    expect(ctx.tenantId).toBeNull();
  });

  it('attaches a requestId and startTime to every context', async () => {
    const ctx = await createContext({ req: makeRequest() });

    expect(typeof ctx.requestId).toBe('string');
    expect(ctx.requestId.length).toBeGreaterThan(0);
    expect(typeof ctx.startTime).toBe('number');
  });
});
