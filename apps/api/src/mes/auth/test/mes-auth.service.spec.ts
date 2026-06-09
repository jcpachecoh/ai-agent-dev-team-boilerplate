import {
  BadRequestException,
  ConflictException,
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
import { AuditService } from '../../../audit/service/audit.service';

jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

const GENERIC_AUTH_MESSAGE = 'Cédula o PIN incorrecto';
const VALID_CEDULA = '12345678';
const VALID_PIN = '1234';
const TENANT_ID = 'tenant-abc';

/** Mirrors MesAuthService.hashCedula (HMAC when CEDULA_HMAC_SECRET is set). */
const hashCedula = (cedula: string): string => {
  const hmacSecret = process.env.CEDULA_HMAC_SECRET;
  if (hmacSecret) {
    return crypto.createHmac('sha256', hmacSecret).update(cedula).digest('hex');
  }
  return crypto.createHash('sha256').update(cedula).digest('hex');
};

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
  createUser: jest.fn(),
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

const auditServiceMock = {
  logLogin: jest.fn(),
};

describe('MesAuthService', () => {
  let service: MesAuthService;

  beforeEach(async () => {
    delete process.env.CEDULA_HMAC_SECRET;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MesAuthService,
        { provide: MesAuthRepository, useValue: repoMock },
        { provide: MesAuthRedisService, useValue: redisMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: AuditService, useValue: auditServiceMock },
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
    auditServiceMock.logLogin.mockResolvedValue(undefined);
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

    it('returns tokens and logs SUCCESS on valid cédula and PIN', async () => {
      const result = await service.login(
        { cedula: VALID_CEDULA, pin: VALID_PIN },
        '192.168.1.1',
        TENANT_ID,
        'Mozilla',
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

      expect(auditServiceMock.logLogin).toHaveBeenCalledWith({
        tenantId: TENANT_ID,
        userId: baseUser.id,
        identifier: '****5678',
        authMethod: 'PIN',
        status: 'SUCCESS',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla',
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

    it('throws generic 401 and logs FAILED for wrong PIN', async () => {
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ cedula: VALID_CEDULA, pin: '9999' }, '192.168.1.1', TENANT_ID),
      ).rejects.toThrow(new UnauthorizedException(GENERIC_AUTH_MESSAGE));

      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          failureReason: 'Invalid PIN',
        }),
      );
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

    it('rejects login and logs LOCKED when user is already locked', async () => {
      const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
      repoMock.findByCedulaHash.mockResolvedValue({ ...baseUser, lockedUntil });

      await expect(
        service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, '192.168.1.1', TENANT_ID),
      ).rejects.toThrow(new UnauthorizedException(GENERIC_AUTH_MESSAGE));

      expect(bcryptMock.compare).not.toHaveBeenCalled();
      expect(repoMock.incrementLoginAttempts).not.toHaveBeenCalled();

      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'LOCKED',
          failureReason: 'Account locked',
        }),
      );
    });

    it('rejects login and logs FAILED for inactive user', async () => {
      repoMock.findByCedulaHash.mockResolvedValue({
        ...baseUser,
        isActive: false,
      });

      await expect(
        service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, '192.168.1.1', TENANT_ID),
      ).rejects.toThrow(new UnauthorizedException(GENERIC_AUTH_MESSAGE));

      expect(bcryptMock.compare).not.toHaveBeenCalled();
      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          failureReason: 'User inactive',
        }),
      );
    });

    it('throws generic 401 and logs FAILED for unknown cédula', async () => {
      repoMock.findByCedulaHash.mockResolvedValue(null);

      await expect(
        service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, '192.168.1.1', TENANT_ID),
      ).rejects.toThrow(new UnauthorizedException(GENERIC_AUTH_MESSAGE));

      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          failureReason: 'User not found',
        }),
      );
    });

    it('throws 429 and logs FAILED when IP is rate limited', async () => {
      redisMock.checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(),
      });

      await expect(
        service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, '192.168.1.1', TENANT_ID),
      ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });

      expect(repoMock.findByCedulaHash).not.toHaveBeenCalled();
      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          failureReason: 'Rate limit exceeded',
        }),
      );
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

    it('logs FAILED when credentials format is invalid', async () => {
      await expect(
        service.login({ cedula: 'abc', pin: VALID_PIN }, '192.168.1.1', TENANT_ID),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          failureReason: 'Invalid format',
        }),
      );
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

  describe('createUser', () => {
    const owner = {
      ...baseUser,
      id: 'owner-1',
      role: OperationalRole.OWNER,
      tenantId: TENANT_ID,
    };

    const createDto = {
      cedula: '87654321',
      pin: '4321',
      role: OperationalRole.OPERATOR,
      sedeId: 'sede-principal',
    };

    beforeEach(() => {
      bcryptMock.hash.mockResolvedValue('hashed-new-pin' as never);
    });

    it('creates user with hashed credentials in requester tenant', async () => {
      const created = {
        ...baseUser,
        id: 'new-op-1',
        cedulaHash: hashCedula(createDto.cedula),
        role: OperationalRole.OPERATOR,
        sedeId: 'sede-principal',
      };
      repoMock.findById.mockResolvedValue(owner);
      repoMock.findByCedulaHash.mockResolvedValue(null);
      repoMock.createUser.mockResolvedValue(created);

      const result = await service.createUser(owner.id, createDto);

      expect(repoMock.createUser).toHaveBeenCalledWith({
        tenantId: TENANT_ID,
        cedulaHash: hashCedula(createDto.cedula),
        pinHash: 'hashed-new-pin',
        role: OperationalRole.OPERATOR,
        sedeId: 'sede-principal',
      });
      expect(result).toEqual({
        id: 'new-op-1',
        cedula: '****4321',
        role: OperationalRole.OPERATOR,
        tenantId: TENANT_ID,
        sedeId: 'sede-principal',
      });
      expect(result).not.toHaveProperty('pinHash');
      expect(result).not.toHaveProperty('cedulaHash');
    });

    it('throws ConflictException when cédula already exists in tenant', async () => {
      repoMock.findById.mockResolvedValue(owner);
      repoMock.findByCedulaHash.mockResolvedValue({
        ...baseUser,
        cedulaHash: hashCedula(createDto.cedula),
      });

      await expect(service.createUser(owner.id, createDto)).rejects.toThrow(ConflictException);
      expect(repoMock.createUser).not.toHaveBeenCalled();
    });

    it('throws ConflictException on P2002 when create races duplicate cedulaHash', async () => {
      const { PrismaClientKnownRequestError } = jest.requireActual(
        '@prisma/client/runtime/library',
      ) as typeof import('@prisma/client/runtime/library');
      repoMock.findById.mockResolvedValue(owner);
      repoMock.findByCedulaHash.mockResolvedValue(null);
      const p2002 = new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['tenantId', 'cedulaHash'] },
      });
      repoMock.createUser.mockRejectedValue(p2002);

      await expect(service.createUser(owner.id, createDto)).rejects.toThrow(ConflictException);
    });

    it('throws ForbiddenException when requester is inactive', async () => {
      repoMock.findById.mockResolvedValue({ ...owner, isActive: false });

      await expect(service.createUser(owner.id, createDto)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when requester does not exist', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.createUser('unknown', createDto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when OPERATOR has no sedeId', async () => {
      repoMock.findById.mockResolvedValue(owner);

      await expect(
        service.createUser(owner.id, {
          cedula: '11112222',
          pin: '1234',
          role: OperationalRole.OPERATOR,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows MANAGER without sedeId', async () => {
      const created = {
        ...baseUser,
        id: 'mgr-1',
        role: OperationalRole.MANAGER,
        sedeId: null,
      };
      repoMock.findById.mockResolvedValue(owner);
      repoMock.findByCedulaHash.mockResolvedValue(null);
      repoMock.createUser.mockResolvedValue(created);

      const result = await service.createUser(owner.id, {
        cedula: '55556666',
        pin: '9999',
        role: OperationalRole.MANAGER,
      });

      expect(result.sedeId).toBeNull();
      expect(repoMock.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: OperationalRole.MANAGER, sedeId: null }),
      );
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
    it('clears refresh token in repository and logs LOGOUT', async () => {
      repoMock.findById.mockResolvedValue(baseUser);
      await service.logout(baseUser.id, undefined, '1.2.3.4', 'Mozilla');

      expect(repoMock.saveRefreshToken).toHaveBeenCalledWith(baseUser.id, null);
      expect(auditServiceMock.logLogin).toHaveBeenCalledWith({
        tenantId: baseUser.tenantId,
        userId: baseUser.id,
        identifier: baseUser.cedulaHash,
        authMethod: 'PIN',
        status: 'LOGOUT',
        ipAddress: '1.2.3.4',
        userAgent: 'Mozilla',
      });
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

  describe('assertCredentialsFormat (via login)', () => {
    it('throws UnauthorizedException when cédula has an invalid format', async () => {
      await expect(
        service.login({ cedula: 'abc', pin: VALID_PIN }, '192.168.1.1', TENANT_ID),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when PIN has an invalid format', async () => {
      await expect(
        service.login({ cedula: VALID_CEDULA, pin: 'ab' }, '192.168.1.1', TENANT_ID),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('hashCedula with HMAC secret', () => {
    it('uses HMAC-SHA256 when CEDULA_HMAC_SECRET env var is set', async () => {
      process.env.CEDULA_HMAC_SECRET = 'my-secret';

      const hmacHash = crypto.createHmac('sha256', 'my-secret').update(VALID_CEDULA).digest('hex');

      repoMock.findByCedulaHash.mockResolvedValue({
        ...baseUser,
        cedulaHash: hmacHash,
      });

      await service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, '192.168.1.1', TENANT_ID);

      expect(repoMock.findByCedulaHash).toHaveBeenCalledWith(TENANT_ID, hmacHash);

      delete process.env.CEDULA_HMAC_SECRET;
    });
  });
});
