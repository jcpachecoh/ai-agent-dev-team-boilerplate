/**
 * AUTH-10 — Global LoginAudit integration (service + real AuditService + captured repository).
 * No live database required.
 */
import { DocumentType, AuthMethod, LoginAuditStatus } from '@prisma/client';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../../audit/service/audit.service';
import { AuditRepository } from '../../audit/repository/audit.repository';
import type { IAuditRepository } from '../../audit/interfaces/audit.interfaces';
import { AuthService } from '../service/auth.service';
import { AuthEmailService } from '../service/auth-email.service';
import { AuthRepository } from '../repository/auth.repository';
import { AuthEmailRepository } from '../repository/auth-email.repository';
import type { AuthUserWithPassword } from '../interfaces/auth.interfaces';
import { UserLocationsService } from '../../locations/service/user-locations.service';

jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

const TENANT_ID = 'palos-de-lena';
const EMAIL = 'audit-user@palos-de-lena.dev';
const IP = '203.0.113.50';
const UA = 'auth-login-audit-integration';

type CapturedLoginAudit = Parameters<IAuditRepository['createLoginAudit']>[0];

function buildUser(overrides: Partial<AuthUserWithPassword> = {}): AuthUserWithPassword {
  return {
    id: 'user-audit-1',
    tenantId: TENANT_ID,
    cedula: '12345678',
    documentType: DocumentType.CC,
    email: EMAIL,
    roleId: 'role-1',
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    passwordChangedAt: null,
    isActive: true,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    passwordHash: 'hashed-password',
    ...overrides,
  };
}

describe('AuthService LoginAudit integration (AUTH-10)', () => {
  const captured: CapturedLoginAudit[] = [];
  let service: AuthService;
  let userState: AuthUserWithPassword;

  const auditRepositoryMock = {
    create: jest.fn(),
    createLoginAudit: jest.fn(async (data: CapturedLoginAudit) => {
      captured.push(data);
    }),
  };

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
  const userLocationsServiceMock = { getActiveUserLocations: jest.fn() };

  beforeEach(async () => {
    captured.length = 0;
    userState = buildUser();

    repoMock.findByTenantAndEmailForAuth.mockImplementation(async () => ({ ...userState }));
    repoMock.incrementLoginAttempts.mockImplementation(async () => {
      userState = { ...userState, loginAttempts: userState.loginAttempts + 1 };
      return userState.loginAttempts;
    });
    repoMock.lockUser.mockImplementation(async (_id, until) => {
      userState = { ...userState, lockedUntil: until };
    });
    repoMock.resetLoginAttempts.mockImplementation(async () => {
      userState = { ...userState, loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() };
    });
    repoMock.findJwtClaimsByUserId.mockResolvedValue({
      sub: userState.id,
      email: userState.email,
      tenantId: TENANT_ID,
      roleId: userState.roleId,
      roleCode: 'OPERATOR',
    });
    repoMock.saveRefreshToken.mockResolvedValue(undefined);
    jwtMock.signAsync.mockResolvedValue('token');
    (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-refresh');
    auditRepositoryMock.createLoginAudit.mockClear();
    auditRepositoryMock.create.mockClear();
    userLocationsServiceMock.getActiveUserLocations.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuditService,
          useFactory: () => new AuditService(auditRepositoryMock as unknown as AuditRepository),
        },
        { provide: AuthRepository, useValue: repoMock },
        { provide: AuthEmailRepository, useValue: {} },
        { provide: AuthEmailService, useValue: { sendVerifyEmail: jest.fn() } },
        { provide: JwtService, useValue: jwtMock },
        { provide: UserLocationsService, useValue: userLocationsServiceMock },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  const lastAudit = () => captured[captured.length - 1];

  it('records PASSWORD SUCCESS with email identifier and IP/UA', async () => {
    (bcryptMock.compare as jest.Mock).mockResolvedValue(true);

    await service.login(TENANT_ID, { email: EMAIL, password: 'ok' }, IP, UA);

    expect(lastAudit()).toMatchObject({
      tenantId: TENANT_ID,
      userId: userState.id,
      identifier: EMAIL,
      authMethod: AuthMethod.PASSWORD,
      status: LoginAuditStatus.SUCCESS,
      ipAddress: IP,
      userAgent: UA,
    });
    expect(repoMock.resetLoginAttempts).toHaveBeenCalledWith(userState.id);
  });

  it('records FAILED for wrong password (attempts 1–4)', async () => {
    (bcryptMock.compare as jest.Mock).mockResolvedValue(false);
    userState = buildUser({ loginAttempts: 1 });

    await expect(
      service.login(TENANT_ID, { email: EMAIL, password: 'bad' }, IP, UA),
    ).rejects.toThrow(UnauthorizedException);

    expect(lastAudit()).toMatchObject({
      status: LoginAuditStatus.FAILED,
      failureReason: 'password_invalido',
      authMethod: AuthMethod.PASSWORD,
      ipAddress: IP,
      userAgent: UA,
    });
    expect(repoMock.lockUser).not.toHaveBeenCalled();
  });

  it('records LOCKED on 5th failed password and sets lockedUntil', async () => {
    (bcryptMock.compare as jest.Mock).mockResolvedValue(false);
    userState = buildUser({ loginAttempts: 4 });

    await expect(service.login(TENANT_ID, { email: EMAIL, password: 'bad' })).rejects.toThrow(
      UnauthorizedException,
    );

    expect(lastAudit()).toMatchObject({
      status: LoginAuditStatus.LOCKED,
      failureReason: 'cuenta_bloqueada',
    });
    expect(repoMock.lockUser).toHaveBeenCalledWith(userState.id, expect.any(Date));
    expect(userState.loginAttempts).toBe(5);
  });

  it('records LOCKED when already locked without incrementing', async () => {
    userState = buildUser({
      loginAttempts: 5,
      lockedUntil: new Date(Date.now() + 60_000),
    });

    await expect(service.login(TENANT_ID, { email: EMAIL, password: 'any' })).rejects.toThrow(
      UnauthorizedException,
    );

    expect(lastAudit()).toMatchObject({
      status: LoginAuditStatus.LOCKED,
      failureReason: 'cuenta_bloqueada',
    });
    expect(repoMock.incrementLoginAttempts).not.toHaveBeenCalled();
    expect(bcryptMock.compare).not.toHaveBeenCalled();
  });

  it('records FAILED for unknown user without increment', async () => {
    repoMock.findByTenantAndEmailForAuth.mockResolvedValue(null);

    await expect(service.login(TENANT_ID, { email: 'ghost@x.dev', password: 'x' })).rejects.toThrow(
      UnauthorizedException,
    );

    expect(lastAudit()).toMatchObject({
      status: LoginAuditStatus.FAILED,
      failureReason: 'User not found or inactive',
    });
    expect(lastAudit()?.userId).toBeNull();
    expect(repoMock.incrementLoginAttempts).not.toHaveBeenCalled();
  });

  it('records LOGOUT on logout', async () => {
    repoMock.findByIdForRefresh.mockResolvedValue({ ...userState, refreshToken: 'hash' });

    await service.logout(userState.id, IP, UA);

    expect(lastAudit()).toMatchObject({
      status: LoginAuditStatus.LOGOUT,
      authMethod: AuthMethod.PASSWORD,
      identifier: EMAIL,
      ipAddress: IP,
      userAgent: UA,
    });
    expect(repoMock.saveRefreshToken).toHaveBeenCalledWith(userState.id, null);
  });

  it('records REFRESH_TOKEN SUCCESS and FAILED', async () => {
    const refreshUser = { ...userState, refreshToken: 'stored-hash' };
    repoMock.findByIdForRefresh.mockResolvedValue(refreshUser);

    (bcryptMock.compare as jest.Mock).mockResolvedValueOnce(true);
    await service.refresh(userState.id, 'raw-refresh', IP, UA);
    expect(lastAudit()).toMatchObject({
      authMethod: AuthMethod.REFRESH_TOKEN,
      status: LoginAuditStatus.SUCCESS,
      ipAddress: IP,
      userAgent: UA,
    });

    (bcryptMock.compare as jest.Mock).mockResolvedValueOnce(false);
    await expect(service.refresh(userState.id, 'bad-refresh')).rejects.toThrow(ForbiddenException);
    expect(lastAudit()).toMatchObject({
      authMethod: AuthMethod.REFRESH_TOKEN,
      status: LoginAuditStatus.FAILED,
      failureReason: 'Invalid refresh token',
    });
  });
});
