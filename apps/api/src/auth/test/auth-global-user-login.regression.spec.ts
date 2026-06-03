import { DocumentType } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../service/auth.service';
import { AuthRepository } from '../repository/auth.repository';
import { AuthEmailRepository } from '../repository/auth-email.repository';
import { AuditService } from '../../audit/service/audit.service';

jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

const TENANT_ID = 'palos-de-lena';

/** Task 07/09 seeded global User fixture (email auth after Task 08). */
const seededGlobalUser = {
  id: '11111111-0000-0000-0000-000000000004',
  tenantId: TENANT_ID,
  cedula: '12345678',
  documentType: DocumentType.CC,
  email: 'mes-owner@palos-de-lena.dev',
  roleId: 'aaaaaaaa-0000-0000-0000-000000000001',
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
};

const repoMock = {
  findByTenantAndEmail: jest.fn(),
  findByTenantAndEmailForAuth: jest.fn(),
  findByTenantAndCedula: jest.fn(),
  findByIdForRefresh: jest.fn(),
  findJwtClaimsByUserId: jest.fn(),
  findRoleByTenantAndCode: jest.fn(),
  createUser: jest.fn(),
  saveRefreshToken: jest.fn(),
  updatePassword: jest.fn(),
};

const authEmailRepoMock = {
  findResetToken: jest.fn(),
  markResetTokenUsed: jest.fn(),
  createResetToken: jest.fn(),
  deleteExpiredResetTokens: jest.fn(),
};

const auditServiceMock = {
  logLogin: jest.fn(),
};

const jwtMock = {
  signAsync: jest.fn(),
};

describe('AuthService — global User email login regression (USR-01 Task 09)', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repoMock },
        { provide: AuthEmailRepository, useValue: authEmailRepoMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: AuditService, useValue: auditServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    auditServiceMock.logLogin.mockResolvedValue(undefined);
  });

  it('logs in seeded mes-owner@palos-de-lena.dev with x-tenant-id palos-de-lena', async () => {
    repoMock.findByTenantAndEmailForAuth.mockResolvedValue(seededGlobalUser);
    repoMock.findJwtClaimsByUserId.mockResolvedValue({
      sub: seededGlobalUser.id,
      email: seededGlobalUser.email,
      tenantId: TENANT_ID,
      roleId: seededGlobalUser.roleId,
      roleCode: 'OWNER',
    });
    (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
    jwtMock.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
    (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-refresh');
    repoMock.saveRefreshToken.mockResolvedValue(undefined);

    const result = await service.login(TENANT_ID, {
      email: 'mes-owner@palos-de-lena.dev',
      password: 'TestPass123!',
    });

    expect(repoMock.findByTenantAndEmailForAuth).toHaveBeenCalledWith(
      TENANT_ID,
      'mes-owner@palos-de-lena.dev',
    );
    expect(repoMock.findJwtClaimsByUserId).toHaveBeenCalledWith(seededGlobalUser.id);
    expect(result).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
    expect(result).not.toHaveProperty('passwordHash');
    expect(jwtMock.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: seededGlobalUser.id,
        tenantId: TENANT_ID,
        roleCode: 'OWNER',
      }),
      { expiresIn: '15m' },
    );
  });

  it('rejects login when global User is inactive', async () => {
    repoMock.findByTenantAndEmailForAuth.mockResolvedValue({
      ...seededGlobalUser,
      isActive: false,
    });

    await expect(
      service.login(TENANT_ID, {
        email: 'mes-owner@palos-de-lena.dev',
        password: 'TestPass123!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
