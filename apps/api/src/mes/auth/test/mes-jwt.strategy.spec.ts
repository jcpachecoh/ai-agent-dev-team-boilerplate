import { UnauthorizedException } from '@nestjs/common';
import { OperationalRole } from '@prisma/client';
import { MesJwtStrategy, normaliseMesPayload } from '../strategies/mes-jwt.strategy';
import { MesAuthRedisService } from '../service/mes-auth-redis.service';

const mockRedisService = {
  isTokenBlacklisted: jest.fn(),
} as unknown as MesAuthRedisService;

const basePayload = {
  sub: 'op-user-1',
  cedulaHash: 'sha256-cedula-hash',
  role: OperationalRole.OPERATOR,
  locationId: null,
  tenantId: 'tenant-abc',
};

describe('MesJwtStrategy', () => {
  let strategy: MesJwtStrategy;

  beforeEach(() => {
    strategy = new MesJwtStrategy(mockRedisService);
    jest.clearAllMocks();
  });

  it('returns the full payload unchanged when token has no jti', async () => {
    const result = await strategy.validate(basePayload);
    expect(result).toEqual(basePayload);
  });

  it('does not call isTokenBlacklisted when jti is absent', async () => {
    await strategy.validate(basePayload);
    expect(mockRedisService.isTokenBlacklisted).not.toHaveBeenCalled();
  });

  it('returns payload when token has a jti that is not blacklisted', async () => {
    (mockRedisService.isTokenBlacklisted as jest.Mock).mockResolvedValue(false);
    const payload = { ...basePayload, jti: 'jti-valid-abc' };

    const result = await strategy.validate(payload);

    expect(result).toEqual(payload);
    expect(mockRedisService.isTokenBlacklisted).toHaveBeenCalledWith('jti-valid-abc');
  });

  it('throws UnauthorizedException when token jti is blacklisted', async () => {
    (mockRedisService.isTokenBlacklisted as jest.Mock).mockResolvedValue(true);
    const payload = { ...basePayload, jti: 'jti-revoked-xyz' };

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  it('passes sub, cedulaHash, role, tenantId, locationId through in the returned user', async () => {
    const result = await strategy.validate(basePayload);

    expect(result.sub).toBe('op-user-1');
    expect(result.cedulaHash).toBe('sha256-cedula-hash');
    expect(result.role).toBe(OperationalRole.OPERATOR);
    expect(result.tenantId).toBe('tenant-abc');
    expect(result.locationId).toBeNull();
  });

  it('includes jti in the returned payload when present and not blacklisted', async () => {
    (mockRedisService.isTokenBlacklisted as jest.Mock).mockResolvedValue(false);
    const payload = { ...basePayload, jti: 'jti-included' };

    const result = await strategy.validate(payload);

    expect(result.jti).toBe('jti-included');
  });

  it('validates and normalises a global JWT payload with OWNER roleCode', async () => {
    (mockRedisService.isTokenBlacklisted as jest.Mock).mockResolvedValue(false);
    const globalPayload = {
      sub: 'global-user-1',
      email: 'owner@test.com',
      tenantId: 'tenant-abc',
      roleId: 'role-id-1',
      roleCode: 'OWNER',
      jti: 'jti-global-abc',
    };

    const result = await strategy.validate(globalPayload);

    expect(result.sub).toBe('global-user-1');
    expect(result.tenantId).toBe('tenant-abc');
    expect(result.role).toBe(OperationalRole.OWNER);
    expect(result.cedulaHash).toBe('');
    expect(result.locationId).toBeNull();
    expect(result.jti).toBe('jti-global-abc');
    expect(mockRedisService.isTokenBlacklisted).toHaveBeenCalledWith('jti-global-abc');
  });
});

describe('normaliseMesPayload', () => {
  const globalBase = {
    sub: 'global-user-1',
    email: 'owner@test.com',
    tenantId: 'tenant-abc',
    roleId: 'role-id-1',
  };

  it('normalises global payload with valid OWNER roleCode to MES shape', () => {
    const result = normaliseMesPayload({ ...globalBase, roleCode: 'OWNER' });

    expect(result).toEqual({
      sub: 'global-user-1',
      tenantId: 'tenant-abc',
      cedulaHash: '',
      role: OperationalRole.OWNER,
      locationId: null,
      jti: undefined,
    });
  });

  it('normalises global payload with valid OPERATOR roleCode', () => {
    const result = normaliseMesPayload({ ...globalBase, roleCode: 'OPERATOR' });

    expect(result.role).toBe(OperationalRole.OPERATOR);
    expect(result.cedulaHash).toBe('');
    expect(result.locationId).toBeNull();
  });

  it('preserves jti from global payload when present', () => {
    const result = normaliseMesPayload({ ...globalBase, roleCode: 'MANAGER', jti: 'jti-xyz' });

    expect(result.jti).toBe('jti-xyz');
  });

  it('sets role to null when roleCode is not a valid OperationalRole', () => {
    // Global tokens from admin users (e.g. SUPER_ADMIN) won't map to OperationalRole.
    // normaliseMesPayload returns null rather than throwing — the guard rejects downstream.
    const result = normaliseMesPayload({ ...globalBase, roleCode: 'SUPER_ADMIN' });

    expect(result.role).toBeNull();
    expect(result.sub).toBe('global-user-1');
  });

  it('returns MES payload unchanged when role field is present', () => {
    const mesPayload = {
      sub: 'op-user-1',
      cedulaHash: 'sha256-hash',
      role: OperationalRole.OPERATOR,
      locationId: 'location-1',
      tenantId: 'tenant-abc',
      jti: 'jti-mes',
    };

    const result = normaliseMesPayload(mesPayload);

    expect(result).toBe(mesPayload);
  });
});
