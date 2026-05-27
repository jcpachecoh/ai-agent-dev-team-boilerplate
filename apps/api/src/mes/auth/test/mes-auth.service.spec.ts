import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OperationalRole } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MesAuthService } from '../service/mes-auth.service';
import { MesAuthRepository } from '../repository/mes-auth.repository';
import { MesAuthRedisService } from '../service/mes-auth-redis.service';

jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

const GENERIC_AUTH_MESSAGE = 'Cédula o PIN incorrecto';
const VALID_CEDULA = '12345678';
const VALID_PIN = '1234';
const TENANT_ID = 'tenant-abc';

const hashCedula = (cedula: string): string =>
  crypto.createHash('sha256').update(cedula).digest('hex');

const baseUser = {
  id: 'op-user-1',
  cedulaHash: hashCedula(VALID_CEDULA),
  pinHash: 'hashed-pin',
  role: OperationalRole.OPERATOR,
  tenantId: 'tenant-abc',
  sedeId: null as string | null,
  isActive: true,
  loginAttempts: 0,
  lockedUntil: null as Date | null,
  refreshToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const repoMock = {
  findByCedulaHash: jest.fn(),
  findById: jest.fn(),
  incrementLoginAttempts: jest.fn(),
  lockUser: jest.fn(),
  resetLoginAttempts: jest.fn(),
  saveRefreshToken: jest.fn(),
};

const ACCESS_TOKEN_BLACKLIST_TTL_SECONDS = 8 * 60 * 60;

const redisMock = {
  checkRateLimit: jest.fn(),
  blacklistToken: jest.fn(),
};

const jwtMock = {
  signAsync: jest.fn(),
};

describe('MesAuthService', () => {
  let service: MesAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MesAuthService,
        { provide: MesAuthRepository, useValue: repoMock },
        { provide: MesAuthRedisService, useValue: redisMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<MesAuthService>(MesAuthService);
    jest.clearAllMocks();

    redisMock.checkRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 5,
      resetAt: new Date(),
    });
    repoMock.findByCedulaHash.mockResolvedValue(baseUser);
    (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
    jwtMock.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
    (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');
    repoMock.resetLoginAttempts.mockResolvedValue(undefined);
    repoMock.saveRefreshToken.mockResolvedValue(undefined);
    redisMock.blacklistToken.mockResolvedValue(undefined);
  });

  describe('login', () => {
    it('throws BadRequestException when tenantId is missing', async () => {
      await expect(
        service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, '192.168.1.1', ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('looks up user by tenantId and cedulaHash', async () => {
      await service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, '192.168.1.1', TENANT_ID);

      expect(repoMock.findByCedulaHash).toHaveBeenCalledWith(TENANT_ID, hashCedula(VALID_CEDULA));
    });

    it('returns tokens on valid cédula and PIN', async () => {
      const result = await service.login(
        { cedula: VALID_CEDULA, pin: VALID_PIN },
        '192.168.1.1',
        TENANT_ID,
      );

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        operator: {
          id: baseUser.id,
          role: baseUser.role,
          tenantId: baseUser.tenantId,
          sedeId: baseUser.sedeId,
        },
      });
    });

    it('signs access JWT with required claims and 8h expiry', async () => {
      await service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, '192.168.1.1', TENANT_ID);

      expect(jwtMock.signAsync).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          sub: baseUser.id,
          cedulaHash: baseUser.cedulaHash,
          role: baseUser.role,
          sedeId: baseUser.sedeId,
          tenantId: baseUser.tenantId,
          jti: expect.any(String),
        }),
        expect.objectContaining({ expiresIn: '8h' }),
      );
    });

    it('throws generic 401 for wrong PIN', async () => {
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ cedula: VALID_CEDULA, pin: '9999' }, '192.168.1.1', TENANT_ID),
      ).rejects.toThrow(new UnauthorizedException(GENERIC_AUTH_MESSAGE));
    });

    it('increments login attempts on wrong PIN', async () => {
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ cedula: VALID_CEDULA, pin: '9999' }, '192.168.1.1', TENANT_ID),
      ).rejects.toThrow(UnauthorizedException);

      expect(repoMock.incrementLoginAttempts).toHaveBeenCalledWith(baseUser.id);
    });

    it('locks user for 15 minutes on third failed attempt', async () => {
      repoMock.findByCedulaHash.mockResolvedValue({ ...baseUser, loginAttempts: 2 });
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);

      const before = Date.now();
      await expect(
        service.login({ cedula: VALID_CEDULA, pin: '9999' }, '192.168.1.1', TENANT_ID),
      ).rejects.toThrow(UnauthorizedException);

      expect(repoMock.lockUser).toHaveBeenCalledWith(baseUser.id, expect.any(Date));
      const lockUntil = repoMock.lockUser.mock.calls[0][1] as Date;
      const lockMs = lockUntil.getTime() - before;
      expect(lockMs).toBeGreaterThanOrEqual(14 * 60 * 1000);
      expect(lockMs).toBeLessThanOrEqual(16 * 60 * 1000);
    });

    it('rejects login when user is locked', async () => {
      const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
      repoMock.findByCedulaHash.mockResolvedValue({ ...baseUser, lockedUntil });

      await expect(
        service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, '192.168.1.1', TENANT_ID),
      ).rejects.toThrow(new UnauthorizedException(GENERIC_AUTH_MESSAGE));

      expect(bcryptMock.compare).not.toHaveBeenCalled();
      expect(repoMock.incrementLoginAttempts).not.toHaveBeenCalled();
    });

    it('rejects login for inactive user', async () => {
      repoMock.findByCedulaHash.mockResolvedValue({
        ...baseUser,
        isActive: false,
      });

      await expect(
        service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, '192.168.1.1', TENANT_ID),
      ).rejects.toThrow(new UnauthorizedException(GENERIC_AUTH_MESSAGE));

      expect(bcryptMock.compare).not.toHaveBeenCalled();
    });

    it('throws generic 401 for unknown cédula', async () => {
      repoMock.findByCedulaHash.mockResolvedValue(null);

      await expect(
        service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, '192.168.1.1', TENANT_ID),
      ).rejects.toThrow(new UnauthorizedException(GENERIC_AUTH_MESSAGE));
    });

    it('throws 429 when IP is rate limited', async () => {
      redisMock.checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(),
      });

      await expect(
        service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, '192.168.1.1', TENANT_ID),
      ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });

      expect(repoMock.findByCedulaHash).not.toHaveBeenCalled();
    });

    it('resets login attempts and saves hashed refresh token on success', async () => {
      await service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, '192.168.1.1', TENANT_ID);

      expect(repoMock.resetLoginAttempts).toHaveBeenCalledWith(baseUser.id);
      expect(bcryptMock.hash).toHaveBeenCalledWith('refresh-token', 12);
      expect(repoMock.saveRefreshToken).toHaveBeenCalledWith(baseUser.id, 'hashed-refresh-token');
    });

    it('does not include raw cédula or PIN in thrown error messages', async () => {
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);

      try {
        await service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, '192.168.1.1', TENANT_ID);
        fail('expected UnauthorizedException');
      } catch (error) {
        const message = (error as UnauthorizedException).message;
        expect(message).toBe(GENERIC_AUTH_MESSAGE);
        expect(message).not.toContain(VALID_CEDULA);
        expect(message).not.toContain(VALID_PIN);
      }
    });
  });

  describe('me', () => {
    it('returns safe user response without sensitive fields', async () => {
      repoMock.findById.mockResolvedValue(baseUser);

      const result = await service.me(baseUser.id);

      expect(result).toEqual({
        id: baseUser.id,
        role: baseUser.role,
        tenantId: baseUser.tenantId,
        sedeId: baseUser.sedeId,
      });
      expect(result).not.toHaveProperty('pinHash');
      expect(result).not.toHaveProperty('cedulaHash');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('throws NotFoundException when user does not exist', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.me('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRole', () => {
    it('returns role when requester and target share tenant', async () => {
      const requester = { ...baseUser, id: 'requester-1', role: OperationalRole.OWNER };
      const target = { ...baseUser, id: 'target-1', role: OperationalRole.MANAGER };
      repoMock.findById.mockResolvedValueOnce(requester).mockResolvedValueOnce(target);

      const result = await service.getRole('requester-1', 'target-1');

      expect(result).toEqual({ role: OperationalRole.MANAGER });
    });

    it('throws ForbiddenException when target is in another tenant', async () => {
      const requester = { ...baseUser, id: 'requester-1', tenantId: 'tenant-a' };
      const target = { ...baseUser, id: 'target-1', tenantId: 'tenant-b' };
      repoMock.findById.mockResolvedValueOnce(requester).mockResolvedValueOnce(target);

      await expect(service.getRole('requester-1', 'target-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when requester does not exist', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.getRole('unknown', 'target-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when target does not exist', async () => {
      repoMock.findById.mockResolvedValueOnce(baseUser).mockResolvedValueOnce(null);

      await expect(service.getRole(baseUser.id, 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('logout', () => {
    it('clears refresh token in repository', async () => {
      await service.logout(baseUser.id);

      expect(repoMock.saveRefreshToken).toHaveBeenCalledWith(baseUser.id, null);
    });

    it('blacklists jti in Redis when provided', async () => {
      await service.logout(baseUser.id, 'jti-abc-123');

      expect(repoMock.saveRefreshToken).toHaveBeenCalledWith(baseUser.id, null);
      expect(redisMock.blacklistToken).toHaveBeenCalledWith(
        'jti-abc-123',
        ACCESS_TOKEN_BLACKLIST_TTL_SECONDS,
      );
    });

    it('does not blacklist when jti is missing', async () => {
      await service.logout(baseUser.id);

      expect(redisMock.blacklistToken).not.toHaveBeenCalled();
    });
  });
});
