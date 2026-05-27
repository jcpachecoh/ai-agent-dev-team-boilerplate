/**
 * Context factory tests
 *
 * Tests that:
 *  - A request with a valid JWT returns an authenticated context
 *  - A request without a token returns isAuthenticated: false
 */

// ─── Module mocks ─────────────────────────────────────────────────────────────

// Mock out infrastructure dependencies so tests don't need real DB/Redis
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
  })),
}));

// Mock authService to control token verification
jest.mock('../src/auth/auth.service', () => ({
  authService: {
    extractToken: jest.fn(),
    verifyToken: jest.fn(),
    toAuthUser: jest.fn(),
    hashCedula: jest.fn(),
    comparePin: jest.fn(),
    signToken: jest.fn(),
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { createContext } from '../src/context/createContext';
import { authService } from '../src/auth/auth.service';
import { UserRole } from '../src/auth/types';
import type { Request } from 'express';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(authHeader?: string): Request {
  return {
    headers: { authorization: authHeader },
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Request;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('createContext', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns isAuthenticated: false when no Authorization header is present', async () => {
    (authService.extractToken as jest.Mock).mockReturnValue(undefined);

    const ctx = await createContext({ req: makeRequest() });

    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.user).toBeNull();
    expect(ctx.tenantId).toBeNull();
  });

  it('returns isAuthenticated: false when token is missing (no Bearer)', async () => {
    (authService.extractToken as jest.Mock).mockReturnValue(undefined);

    const ctx = await createContext({ req: makeRequest('NotBearer token') });

    expect(ctx.isAuthenticated).toBe(false);
  });

  it('returns isAuthenticated: true with correct user fields for a valid JWT', async () => {
    const mockUser = { id: 'user-1', tenantId: 'tenant-abc', role: UserRole.OPERATOR };
    const mockPayload = {
      sub: 'user-1',
      tenantId: 'tenant-abc',
      role: 'OPERATOR',
      iat: 1000,
      exp: 9999999999,
    };

    (authService.extractToken as jest.Mock).mockReturnValue('valid.jwt.token');
    (authService.verifyToken as jest.Mock).mockReturnValue(mockPayload);
    (authService.toAuthUser as jest.Mock).mockReturnValue(mockUser);

    const ctx = await createContext({ req: makeRequest('Bearer valid.jwt.token') });

    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.user).toEqual(mockUser);
    expect(ctx.tenantId).toBe('tenant-abc');
  });

  it('returns isAuthenticated: false when token verification throws', async () => {
    (authService.extractToken as jest.Mock).mockReturnValue('expired.token');
    (authService.verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Token expired');
    });

    const ctx = await createContext({ req: makeRequest('Bearer expired.token') });

    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.user).toBeNull();
  });

  it('attaches a requestId and startTime to every context', async () => {
    (authService.extractToken as jest.Mock).mockReturnValue(undefined);

    const ctx = await createContext({ req: makeRequest() });

    expect(typeof ctx.requestId).toBe('string');
    expect(ctx.requestId.length).toBeGreaterThan(0);
    expect(typeof ctx.startTime).toBe('number');
  });
});
