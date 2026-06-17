import { UnauthorizedException } from '@nestjs/common';
import { OperationalRole } from '@prisma/client';
import { MesJwtStrategy } from '../strategies/mes-jwt.strategy';
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
});
