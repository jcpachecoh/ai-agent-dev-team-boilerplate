/**
 * AUTH-10 — Logout session chain (global refresh invalidation + MES jti blacklist).
 */
import { DocumentType, LoginAuditStatus } from '@prisma/client';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../../audit/service/audit.service';
import { AuthService } from '../service/auth.service';
import { AuthEmailService } from '../service/auth-email.service';
import { AuthRepository } from '../repository/auth.repository';
import { AuthEmailRepository } from '../repository/auth-email.repository';
import { MesAuthService } from '../../mes/auth/service/mes-auth.service';
import { MesAuthRepository } from '../../mes/auth/repository/mes-auth.repository';
import { MesAuthRedisService } from '../../mes/auth/service/mes-auth-redis.service';
import { MesJwtStrategy } from '../../mes/auth/strategies/mes-jwt.strategy';
import { OperationalRole } from '@prisma/client';

jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

const TENANT_ID = 'palos-de-lena';

describe('Global auth logout chain (AUTH-10)', () => {
  const auditServiceMock = { logLogin: jest.fn() };
  const repoMock = {
    findByTenantAndEmail: jest.fn(),
    findByTenantAndEmailForAuth: jest.fn(),
    findByTenantAndCedula: jest.fn(),
    findByIdForRefresh: jest.fn(),
    findByIdForAuth: jest.fn(),
    findByIdWithRoleCode: jest.fn(),
    findJwtClaimsByUserId: jest.fn(),
    findRoleByTenantAndCode: jest.fn(),
    createUser: jest.fn(),
    saveRefreshToken: jest.fn(),
    updatePassword: jest.fn(),
    incrementLoginAttempts: jest.fn(),
    lockUser: jest.fn(),
    resetLoginAttempts: jest.fn(),
  };
  const jwtMock = { signAsync: jest.fn() };
  let service: AuthService;

  const mockUser = {
    id: 'user-1',
    tenantId: TENANT_ID,
    email: 'chain@palos-de-lena.dev',
    refreshToken: 'hashed-refresh-stored',
    isActive: true,
    deletedAt: null,
    cedula: '1',
    documentType: DocumentType.CC,
    roleId: 'r1',
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    passwordChangedAt: null,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    passwordHash: 'hash',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuditService, useValue: auditServiceMock },
        { provide: AuthRepository, useValue: repoMock },
        { provide: AuthEmailRepository, useValue: {} },
        { provide: AuthEmailService, useValue: { sendVerifyEmail: jest.fn() } },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();
    service = module.get(AuthService);
    jest.clearAllMocks();
    auditServiceMock.logLogin.mockResolvedValue(undefined);
    repoMock.saveRefreshToken.mockResolvedValue(undefined);
  });

  it('clears refresh token on logout so refresh fails afterward', async () => {
    repoMock.findByIdForRefresh
      .mockResolvedValueOnce({ ...mockUser, refreshToken: 'hashed-refresh-stored' })
      .mockResolvedValueOnce({ ...mockUser, refreshToken: null });

    await service.logout('user-1');
    expect(repoMock.saveRefreshToken).toHaveBeenCalledWith('user-1', null);

    (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
    await expect(service.refresh('user-1', 'any-refresh')).rejects.toThrow(ForbiddenException);
    expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
      expect.objectContaining({ status: LoginAuditStatus.FAILED }),
    );
  });
});

describe('MES auth logout chain (AUTH-10)', () => {
  const redisMock = {
    checkRateLimit: jest.fn(),
    blacklistToken: jest.fn(),
    isTokenBlacklisted: jest.fn(),
  };
  const repoMock = {
    findById: jest.fn(),
    saveRefreshToken: jest.fn(),
  };
  const auditServiceMock = { logLogin: jest.fn() };
  let mesAuthService: MesAuthService;
  let mesJwtStrategy: MesJwtStrategy;

  const opUser = {
    id: 'op-chain-1',
    userId: null,
    tenantId: TENANT_ID,
    cedulaHash: 'hash',
    pinHash: 'p',
    role: OperationalRole.OPERATOR,
    sedeId: null,
    isActive: true,
    loginAttempts: 0,
    lockedUntil: null,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MesAuthService,
        MesJwtStrategy,
        { provide: MesAuthRepository, useValue: repoMock },
        { provide: MesAuthRedisService, useValue: redisMock },
        { provide: AuditService, useValue: auditServiceMock },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
      ],
    }).compile();

    mesAuthService = module.get(MesAuthService);
    mesJwtStrategy = module.get(MesJwtStrategy);
    jest.clearAllMocks();
    auditServiceMock.logLogin.mockResolvedValue(undefined);
    repoMock.findById.mockResolvedValue(opUser);
    repoMock.saveRefreshToken.mockResolvedValue(undefined);
    redisMock.blacklistToken.mockResolvedValue(undefined);
  });

  it('blacklists jti on logout so MesJwtStrategy rejects the token', async () => {
    await mesAuthService.logout(opUser.id, 'jti-revoked-99');

    expect(redisMock.blacklistToken).toHaveBeenCalledWith('jti-revoked-99', expect.any(Number));

    redisMock.isTokenBlacklisted.mockResolvedValue(true);
    await expect(
      mesJwtStrategy.validate({
        sub: opUser.id,
        cedulaHash: opUser.cedulaHash,
        role: opUser.role,
        sedeId: opUser.sedeId,
        tenantId: TENANT_ID,
        jti: 'jti-revoked-99',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
