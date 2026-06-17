/**
 * Auth resolver tests
 *
 * Tests the GatewayAuthService login flow:
 *  - Successful login returns a token
 *  - Wrong PIN increments loginAttempts on the user record
 */

import { GatewayAuthService } from '../../src/services/auth.service';
import { AuthenticationError } from '../../src/utils/errors';
import { MAX_LOGIN_ATTEMPTS } from '../../src/utils/constants';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock the authService singleton used by GatewayAuthService
jest.mock('../../src/auth/auth.service', () => ({
  authService: {
    hashCedula: jest.fn((c: string) => `hash_${c}`),
    comparePin: jest.fn(),
    signToken: jest.fn(() => 'mock.jwt.token'),
    toAuthUser: jest.fn(),
  },
}));

import { authService } from '../../src/auth/auth.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePrisma(
  overrides: Partial<{
    findUnique: jest.Mock;
    update: jest.Mock;
  }> = {},
) {
  return {
    operationalUser: {
      findUnique: overrides.findUnique ?? jest.fn(),
      update: overrides.update ?? jest.fn(),
    },
  };
}

function makeBaseUser(overrides = {}) {
  return {
    id: 'user-1',
    cedulaHash: 'hash_12345678',
    pinHash: '$2b$12$hashedpin',
    role: 'OPERATOR',
    tenantId: 'tenant-abc',
    sedeId: null,
    isActive: true,
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GatewayAuthService.loginWithPin', () => {
  let service: GatewayAuthService;
  let prismaFindUnique: jest.Mock;
  let prismaUpdate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaFindUnique = jest.fn();
    prismaUpdate = jest.fn();
    const prisma = makePrisma({ findUnique: prismaFindUnique, update: prismaUpdate });
    const redis = {} as never;
    const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as never;
    service = new GatewayAuthService(prisma as never, redis, log);
  });

  it('returns a token on successful login', async () => {
    const user = makeBaseUser();
    prismaFindUnique.mockResolvedValue(user);
    prismaUpdate.mockResolvedValue({ ...user, loginAttempts: 0, lastLoginAt: new Date() });
    (authService.comparePin as jest.Mock).mockResolvedValue(true);

    const result = await service.loginWithPin('12345678', '1234', 'tenant-abc');

    expect(result.token).toBe('mock.jwt.token');
    expect(result.user.id).toBe('user-1');
    expect(prismaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ loginAttempts: 0, lockedUntil: null }),
      }),
    );
  });

  it('throws AuthenticationError for unknown user', async () => {
    prismaFindUnique.mockResolvedValue(null);
    (authService.comparePin as jest.Mock).mockResolvedValue(false);

    await expect(service.loginWithPin('99999999', 'bad', 'tenant-abc')).rejects.toThrow(
      AuthenticationError,
    );
    await expect(service.loginWithPin('99999999', 'bad', 'tenant-abc')).rejects.toThrow(
      'Invalid credentials',
    );
  });

  it('increments loginAttempts on wrong PIN', async () => {
    const user = makeBaseUser({ loginAttempts: 0 });
    prismaFindUnique.mockResolvedValue(user);
    prismaUpdate.mockResolvedValue({ ...user, loginAttempts: 1 });
    (authService.comparePin as jest.Mock).mockResolvedValue(false);

    await expect(service.loginWithPin('12345678', 'wrongpin', 'tenant-abc')).rejects.toThrow(
      AuthenticationError,
    );

    expect(prismaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ loginAttempts: 1 }),
      }),
    );
  });

  it('locks account after MAX_LOGIN_ATTEMPTS failed attempts', async () => {
    const user = makeBaseUser({ loginAttempts: MAX_LOGIN_ATTEMPTS - 1 });
    prismaFindUnique.mockResolvedValue(user);
    prismaUpdate.mockResolvedValue({ ...user, loginAttempts: MAX_LOGIN_ATTEMPTS });
    (authService.comparePin as jest.Mock).mockResolvedValue(false);

    await expect(service.loginWithPin('12345678', 'wrongpin', 'tenant-abc')).rejects.toThrow(
      'locked',
    );

    expect(prismaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lockedUntil: expect.any(Date) }),
      }),
    );
  });

  it('throws AuthenticationError if account is locked', async () => {
    const lockedUntil = new Date(Date.now() + 5 * 60 * 1000); // locked for 5 more minutes
    const user = makeBaseUser({ lockedUntil, loginAttempts: MAX_LOGIN_ATTEMPTS });
    prismaFindUnique.mockResolvedValue(user);

    await expect(service.loginWithPin('12345678', '1234', 'tenant-abc')).rejects.toThrow(
      'Account is locked',
    );
  });

  it('throws AuthenticationError if account is deactivated', async () => {
    const user = makeBaseUser({ isActive: false });
    prismaFindUnique.mockResolvedValue(user);
    (authService.comparePin as jest.Mock).mockResolvedValue(true);

    await expect(service.loginWithPin('12345678', '1234', 'tenant-abc')).rejects.toThrow(
      'deactivated',
    );
  });
});
