import Redis from 'ioredis';
import { Test, TestingModule } from '@nestjs/testing';
import { MesAuthRedisService } from '../service/mes-auth-redis.service';

jest.mock('ioredis', () => {
  const MockRedis = jest.fn().mockImplementation(() => ({
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    set: jest.fn(),
    exists: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
  }));
  return MockRedis;
});

const MockRedis = Redis as unknown as jest.Mock;

describe('MesAuthRedisService', () => {
  let service: MesAuthRedisService;
  let redisMock: {
    incr: jest.Mock;
    expire: jest.Mock;
    ttl: jest.Mock;
    set: jest.Mock;
    exists: jest.Mock;
    quit: jest.Mock;
  };

  beforeEach(async () => {
    MockRedis.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MesAuthRedisService],
    }).compile();

    service = module.get<MesAuthRedisService>(MesAuthRedisService);
    await service.onModuleInit();

    redisMock = {
      incr: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      set: jest.fn(),
      exists: jest.fn(),
      quit: jest.fn().mockResolvedValue('OK'),
    };
    (service as unknown as { redis: typeof redisMock }).redis = redisMock;
  });

  // ── checkRateLimit ─────────────────────────────────────────────────────────

  describe('checkRateLimit', () => {
    it('allows request when count is below the limit', async () => {
      redisMock.incr.mockResolvedValue(1);
      redisMock.expire.mockResolvedValue(1);
      redisMock.ttl.mockResolvedValue(60);

      const result = await service.checkRateLimit('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetAt).toBeInstanceOf(Date);
      expect(redisMock.incr).toHaveBeenCalledWith('mes:auth:rate-limit:192.168.1.1');
    });

    it('returns remaining 0 when at the limit (count === 5)', async () => {
      redisMock.incr.mockResolvedValue(5);
      redisMock.ttl.mockResolvedValue(20);

      const result = await service.checkRateLimit('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('blocks request when count exceeds the limit', async () => {
      redisMock.incr.mockResolvedValue(6);
      redisMock.ttl.mockResolvedValue(30);

      const result = await service.checkRateLimit('192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('sets TTL window on the first attempt (count === 1)', async () => {
      redisMock.incr.mockResolvedValue(1);
      redisMock.expire.mockResolvedValue(1);
      redisMock.ttl.mockResolvedValue(60);

      await service.checkRateLimit('192.168.1.1');

      expect(redisMock.expire).toHaveBeenCalledWith('mes:auth:rate-limit:192.168.1.1', 60);
    });

    it('does not reset TTL on subsequent attempts (count > 1)', async () => {
      redisMock.incr.mockResolvedValue(3);
      redisMock.ttl.mockResolvedValue(45);

      await service.checkRateLimit('192.168.1.1');

      expect(redisMock.expire).not.toHaveBeenCalled();
    });

    it('uses an IP-scoped key for each client', async () => {
      redisMock.incr.mockResolvedValue(1);
      redisMock.expire.mockResolvedValue(1);
      redisMock.ttl.mockResolvedValue(60);

      await service.checkRateLimit('10.0.0.42');

      expect(redisMock.incr).toHaveBeenCalledWith('mes:auth:rate-limit:10.0.0.42');
    });

    it('computes resetAt from the remaining TTL', async () => {
      const before = Date.now();
      redisMock.incr.mockResolvedValue(2);
      redisMock.ttl.mockResolvedValue(45);

      const result = await service.checkRateLimit('192.168.1.1');
      const after = Date.now();

      const resetMs = result.resetAt.getTime();
      expect(resetMs).toBeGreaterThanOrEqual(before + 45 * 1000);
      expect(resetMs).toBeLessThanOrEqual(after + 45 * 1000);
    });
  });

  // ── blacklistToken ─────────────────────────────────────────────────────────

  describe('blacklistToken', () => {
    it('stores the JTI key in Redis with the given TTL', async () => {
      redisMock.set.mockResolvedValue('OK');

      await service.blacklistToken('jti-abc-123', 3600);

      expect(redisMock.set).toHaveBeenCalledWith('mes:auth:blacklist:jti-abc-123', '1', 'EX', 3600);
    });
  });

  // ── isTokenBlacklisted ─────────────────────────────────────────────────────

  describe('isTokenBlacklisted', () => {
    it('returns true when the token JTI exists in Redis', async () => {
      redisMock.exists.mockResolvedValue(1);

      const result = await service.isTokenBlacklisted('jti-abc-123');

      expect(result).toBe(true);
      expect(redisMock.exists).toHaveBeenCalledWith('mes:auth:blacklist:jti-abc-123');
    });

    it('returns false when the token JTI is not in Redis', async () => {
      redisMock.exists.mockResolvedValue(0);

      const result = await service.isTokenBlacklisted('jti-xyz-999');

      expect(result).toBe(false);
    });
  });

  // ── lifecycle ──────────────────────────────────────────────────────────────

  describe('onModuleDestroy', () => {
    it('calls redis.quit to close the connection', async () => {
      await service.onModuleDestroy();

      expect(redisMock.quit).toHaveBeenCalledTimes(1);
    });
  });
});
