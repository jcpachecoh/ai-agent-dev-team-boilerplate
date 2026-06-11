/**
 * AUTH-10 — MES LoginAudit integration (MesAuthService + real AuditService + captured repository).
 */
import { OperationalRole, AuthMethod, LoginAuditStatus } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuditService } from '../../../audit/service/audit.service';
import { AuditRepository } from '../../../audit/repository/audit.repository';
import type { IAuditRepository } from '../../../audit/interfaces/audit.interfaces';
import { MesAuthService } from '../service/mes-auth.service';
import { MesAuthRepository } from '../repository/mes-auth.repository';
import { MesAuthRedisService } from '../service/mes-auth-redis.service';
import type { OperationalUser } from '@prisma/client';

jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

const TENANT_ID = 'palos-de-lena';
const VALID_CEDULA = '12345678';
const VALID_PIN = '1234';
const LINKED_USER_ID = '11111111-0000-0000-0000-000000000004';
const IP = '203.0.113.60';
const UA = 'mes-login-audit-integration';

const hashCedula = (cedula: string): string =>
  crypto.createHash('sha256').update(cedula).digest('hex');

type CapturedLoginAudit = Parameters<IAuditRepository['createLoginAudit']>[0];

function baseOperationalUser(overrides: Partial<OperationalUser> = {}): OperationalUser {
  return {
    id: 'op-audit-1',
    userId: null,
    cedulaHash: hashCedula(VALID_CEDULA),
    pinHash: 'hashed-pin',
    role: OperationalRole.OPERATOR,
    tenantId: TENANT_ID,
    sedeId: null,
    isActive: true,
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as OperationalUser;
}

describe('MesAuthService LoginAudit integration (AUTH-10)', () => {
  const captured: CapturedLoginAudit[] = [];
  let service: MesAuthService;

  const auditRepositoryMock = {
    create: jest.fn(),
    createLoginAudit: jest.fn(async (data: CapturedLoginAudit) => {
      captured.push(data);
    }),
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

  const redisMock = {
    checkRateLimit: jest.fn(),
    blacklistToken: jest.fn(),
  };

  const jwtMock = { signAsync: jest.fn() };

  beforeEach(async () => {
    captured.length = 0;
    delete process.env.CEDULA_HMAC_SECRET;

    redisMock.checkRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 5,
      resetAt: new Date(),
    });
    repoMock.findByCedulaHash.mockResolvedValue(baseOperationalUser());
    (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
    jwtMock.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
    (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-refresh');
    repoMock.resetLoginAttempts.mockResolvedValue(undefined);
    repoMock.saveRefreshToken.mockResolvedValue(undefined);
    auditRepositoryMock.createLoginAudit.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MesAuthService,
        {
          provide: AuditService,
          useFactory: () => new AuditService(auditRepositoryMock as unknown as AuditRepository),
        },
        { provide: MesAuthRepository, useValue: repoMock },
        { provide: MesAuthRedisService, useValue: redisMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get(MesAuthService);
  });

  const lastAudit = () => captured[captured.length - 1];

  it('records PIN SUCCESS with masked cédula, null userId for pure operational user', async () => {
    await service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, IP, TENANT_ID, UA);

    expect(lastAudit()).toMatchObject({
      tenantId: TENANT_ID,
      userId: null,
      identifier: '****5678',
      authMethod: AuthMethod.PIN,
      status: LoginAuditStatus.SUCCESS,
      ipAddress: IP,
      userAgent: UA,
    });
    expect(lastAudit()?.userId).not.toBe('op-audit-1');
  });

  it('records PIN SUCCESS with linked global User.id', async () => {
    repoMock.findByCedulaHash.mockResolvedValue(
      baseOperationalUser({ userId: LINKED_USER_ID, role: OperationalRole.OWNER }),
    );

    await service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, IP, TENANT_ID);

    expect(lastAudit()).toMatchObject({
      userId: LINKED_USER_ID,
      status: LoginAuditStatus.SUCCESS,
      identifier: '****5678',
    });
  });

  it('records FAILED for wrong PIN', async () => {
    (bcryptMock.compare as jest.Mock).mockResolvedValue(false);
    repoMock.incrementLoginAttempts.mockResolvedValue(undefined);
    repoMock.lockUser.mockResolvedValue(undefined);

    await expect(
      service.login({ cedula: VALID_CEDULA, pin: '9999' }, IP, TENANT_ID),
    ).rejects.toThrow(UnauthorizedException);

    expect(lastAudit()).toMatchObject({
      status: LoginAuditStatus.FAILED,
      failureReason: 'Invalid PIN',
      authMethod: AuthMethod.PIN,
    });
  });

  it('records LOCKED when account is locked', async () => {
    repoMock.findByCedulaHash.mockResolvedValue(
      baseOperationalUser({
        userId: LINKED_USER_ID,
        lockedUntil: new Date(Date.now() + 60_000),
      }),
    );

    await expect(
      service.login({ cedula: VALID_CEDULA, pin: VALID_PIN }, IP, TENANT_ID),
    ).rejects.toThrow(UnauthorizedException);

    expect(lastAudit()).toMatchObject({
      status: LoginAuditStatus.LOCKED,
      userId: LINKED_USER_ID,
      failureReason: 'Account locked',
    });
  });

  it('records LOGOUT with safe identifier and linked userId', async () => {
    const op = baseOperationalUser({ userId: LINKED_USER_ID });
    repoMock.findById.mockResolvedValue(op);

    await service.logout(op.id, 'jti-logout-1', IP, UA);

    expect(lastAudit()).toMatchObject({
      status: LoginAuditStatus.LOGOUT,
      userId: LINKED_USER_ID,
      identifier: `operational-user:${op.id}`,
      authMethod: AuthMethod.PIN,
      ipAddress: IP,
      userAgent: UA,
    });
    expect(lastAudit()?.identifier).not.toContain(op.cedulaHash);
    expect(redisMock.blacklistToken).toHaveBeenCalledWith('jti-logout-1', expect.any(Number));
  });
});
