/**
 * AUTH-03 Task 03 — REST auth responses must not leak stored secrets.
 * JWT accessToken/refreshToken strings on login/signup/refresh are expected.
 */
import { DocumentType } from '@prisma/client';
import { AuthService } from '../service/auth.service';
import { AuthRepository } from '../repository/auth.repository';
import { AuthEmailRepository } from '../repository/auth-email.repository';
import { AuthEmailService } from '../service/auth-email.service';
import { AuditService } from '../../audit/service/audit.service';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('bcrypt');
import * as bcrypt from 'bcrypt';

const FORBIDDEN_KEYS = [
  'password',
  'passwordHash',
  'pin',
  'pinHash',
  'cedulaHash',
  'tokenHash',
  'secret',
] as const;

function expectNoStoredSecrets(value: Record<string, unknown>): void {
  for (const key of FORBIDDEN_KEYS) {
    expect(value).not.toHaveProperty(key);
  }
}

const TENANT_ID = 'palos-de-lena';

const mockUserSafe = {
  id: 'user-1',
  tenantId: TENANT_ID,
  cedula: '12345678',
  documentType: DocumentType.CC,
  email: 'test@example.com',
  roleId: 'role-1',
  loginAttempts: 0,
  lockedUntil: null,
  lastLoginAt: null,
  passwordChangedAt: null,
  isActive: true,
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  createdBy: null,
};

const mockUserWithPassword = { ...mockUserSafe, passwordHash: 'hashed-password' };

const repoMock = {
  findByTenantAndEmail: jest.fn(),
  findByTenantAndEmailForAuth: jest.fn(),
  findByTenantAndCedula: jest.fn(),
  findByIdForRefresh: jest.fn(),
  findByIdForAuth: jest.fn(),
  findByIdWithRoleCode: jest.fn(),
  findRoleByTenantAndCode: jest.fn(),
  createUser: jest.fn(),
  incrementLoginAttempts: jest.fn(),
  lockUser: jest.fn(),
  resetLoginAttempts: jest.fn(),
  saveRefreshToken: jest.fn(),
  updatePassword: jest.fn(),
};

const authEmailRepoMock = {
  findResetToken: jest.fn(),
  markResetTokenUsed: jest.fn(),
};

const auditServiceMock = { logLogin: jest.fn() };
const jwtMock = { signAsync: jest.fn() };
const authEmailServiceMock = { sendVerifyEmail: jest.fn() };

describe('AuthService sensitive response shapes (AUTH-03)', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repoMock },
        { provide: AuthEmailRepository, useValue: authEmailRepoMock },
        { provide: AuthEmailService, useValue: authEmailServiceMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: AuditService, useValue: auditServiceMock },
      ],
    }).compile();
    service = module.get(AuthService);
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtMock.signAsync.mockResolvedValue('jwt-token');
    repoMock.saveRefreshToken.mockResolvedValue(undefined);
    repoMock.resetLoginAttempts.mockResolvedValue(undefined);
    authEmailServiceMock.sendVerifyEmail.mockResolvedValue({ otpCode: '123456' });
  });

  it('signup returns only JWT tokens, no stored secrets', async () => {
    repoMock.findByTenantAndEmail.mockResolvedValue(null);
    repoMock.findByTenantAndCedula.mockResolvedValue(null);
    repoMock.findRoleByTenantAndCode.mockResolvedValue({
      id: 'role-1',
      code: 'OPERATOR',
      isActive: true,
    });
    repoMock.createUser.mockResolvedValue({ ...mockUserSafe, email: 'new@example.com' });

    const result = await service.signup(TENANT_ID, {
      email: 'new@example.com',
      cedula: '87654321',
      documentType: DocumentType.CC,
      password: 'validpass9',
    });

    expect(result).toEqual({ accessToken: 'jwt-token', refreshToken: 'jwt-token' });
    expectNoStoredSecrets(result as unknown as Record<string, unknown>);
  });

  it('login returns only JWT tokens, no stored secrets', async () => {
    repoMock.findByTenantAndEmailForAuth.mockResolvedValue(mockUserWithPassword);

    const result = await service.login(TENANT_ID, {
      email: 'test@example.com',
      password: 'correct-password',
    });

    expectNoStoredSecrets(result as unknown as Record<string, unknown>);
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('refresh returns only JWT tokens, no stored secrets', async () => {
    repoMock.findByIdForRefresh.mockResolvedValue({
      ...mockUserSafe,
      refreshToken: 'hashed-refresh-stored',
    });

    const result = await service.refresh('user-1', 'raw-refresh-jwt');

    expectNoStoredSecrets(result as unknown as Record<string, unknown>);
  });

  it('me returns safe profile without passwordHash or refreshToken', async () => {
    repoMock.findByIdWithRoleCode.mockResolvedValue({
      id: mockUserSafe.id,
      tenantId: mockUserSafe.tenantId,
      email: mockUserSafe.email,
      cedula: mockUserSafe.cedula,
      documentType: mockUserSafe.documentType,
      emailVerified: mockUserSafe.emailVerified,
      isActive: mockUserSafe.isActive,
      roleCode: 'OPERATOR',
      createdAt: mockUserSafe.createdAt,
    });

    const result = await service.me('user-1');
    expectNoStoredSecrets(result as unknown as Record<string, unknown>);
  });

  it('changePassword returns message only', async () => {
    repoMock.findByIdForAuth.mockResolvedValue(mockUserWithPassword);
    repoMock.updatePassword.mockResolvedValue(undefined);

    const result = await service.changePassword('user-1', 'oldpass123', 'newpass1234');
    expect(result).toEqual({ message: 'Password updated successfully.' });
    expectNoStoredSecrets(result as unknown as Record<string, unknown>);
  });
});
