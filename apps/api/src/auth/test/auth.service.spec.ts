import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../service/auth.service';
import { AuthRepository } from '../repository/auth.repository';
import { AuthEmailRepository } from '../repository/auth-email.repository';

jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

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

const mockUserWithPassword = {
  ...mockUserSafe,
  passwordHash: 'hashed-password',
};

const mockUserWithRefresh = {
  ...mockUserSafe,
  refreshToken: 'hashed-refresh',
};

const repoMock = {
  findByTenantAndEmail: jest.fn(),
  findByTenantAndEmailForAuth: jest.fn(),
  findByTenantAndCedula: jest.fn(),
  findByIdForRefresh: jest.fn(),
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

const jwtMock = {
  signAsync: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repoMock },
        { provide: AuthEmailRepository, useValue: authEmailRepoMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const dto = {
      email: 'new@example.com',
      cedula: '87654321',
      documentType: DocumentType.CC,
      password: 'password123',
    };

    it('creates user and returns tokens when email and cedula are new', async () => {
      repoMock.findByTenantAndEmail.mockResolvedValue(null);
      repoMock.findByTenantAndCedula.mockResolvedValue(null);
      repoMock.findRoleByTenantAndCode.mockResolvedValue({
        id: 'role-op',
        code: 'OPERATOR',
        isActive: true,
      });
      repoMock.createUser.mockResolvedValue({ id: 'user-2', email: dto.email });
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-pw');
      jwtMock.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      repoMock.saveRefreshToken.mockResolvedValue(undefined);

      const result = await service.signup(TENANT_ID, dto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(repoMock.findRoleByTenantAndCode).toHaveBeenCalledWith(TENANT_ID, 'OPERATOR');
      expect(repoMock.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          email: dto.email,
          cedula: dto.cedula,
          documentType: dto.documentType,
          roleId: 'role-op',
        }),
      );
      expect(bcryptMock.hash).toHaveBeenCalledWith(dto.password, 12);
    });

    it('allows signup on tenant B when lookup is tenant-scoped (same email may exist on another tenant)', async () => {
      const otherTenant = 'other-tenant';
      repoMock.findByTenantAndEmail.mockResolvedValue(null);
      repoMock.findByTenantAndCedula.mockResolvedValue(null);
      repoMock.findRoleByTenantAndCode.mockResolvedValue({
        id: 'role-op',
        code: 'OPERATOR',
        isActive: true,
      });
      repoMock.createUser.mockResolvedValue({ id: 'user-3', email: dto.email });
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-pw');
      jwtMock.signAsync.mockResolvedValue('token');
      repoMock.saveRefreshToken.mockResolvedValue(undefined);

      await service.signup(otherTenant, dto);

      expect(repoMock.findByTenantAndEmail).toHaveBeenCalledWith(otherTenant, dto.email);
      expect(repoMock.findByTenantAndCedula).toHaveBeenCalledWith(otherTenant, dto.cedula);
      expect(repoMock.createUser).toHaveBeenCalled();
    });

    it('defaults roleCode to OPERATOR when omitted', async () => {
      repoMock.findByTenantAndEmail.mockResolvedValue(null);
      repoMock.findByTenantAndCedula.mockResolvedValue(null);
      repoMock.findRoleByTenantAndCode.mockResolvedValue({
        id: 'role-op',
        code: 'OPERATOR',
        isActive: true,
      });
      repoMock.createUser.mockResolvedValue({ id: 'user-2', email: dto.email });
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-pw');
      jwtMock.signAsync.mockResolvedValue('token');
      repoMock.saveRefreshToken.mockResolvedValue(undefined);

      await service.signup(TENANT_ID, dto);

      expect(repoMock.findRoleByTenantAndCode).toHaveBeenCalledWith(TENANT_ID, 'OPERATOR');
    });

    it('throws ConflictException when email is already registered', async () => {
      repoMock.findByTenantAndEmail.mockResolvedValue(mockUserSafe);
      await expect(service.signup(TENANT_ID, dto)).rejects.toThrow(ConflictException);
      expect(repoMock.createUser).not.toHaveBeenCalled();
    });

    it('throws ConflictException when cedula is already registered', async () => {
      repoMock.findByTenantAndEmail.mockResolvedValue(null);
      repoMock.findByTenantAndCedula.mockResolvedValue(mockUserSafe);
      await expect(service.signup(TENANT_ID, dto)).rejects.toThrow(ConflictException);
      expect(repoMock.createUser).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when role is invalid', async () => {
      repoMock.findByTenantAndEmail.mockResolvedValue(null);
      repoMock.findByTenantAndCedula.mockResolvedValue(null);
      repoMock.findRoleByTenantAndCode.mockResolvedValue(null);
      await expect(service.signup(TENANT_ID, dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when tenantId is missing', async () => {
      await expect(service.signup('', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    const dto = { email: 'test@example.com', password: 'correct-password' };

    it('returns tokens on valid credentials', async () => {
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue(mockUserWithPassword);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
      jwtMock.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      repoMock.saveRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(TENANT_ID, dto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(repoMock.findByTenantAndEmailForAuth).toHaveBeenCalledWith(TENANT_ID, dto.email);
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue(null);
      await expect(service.login(TENANT_ID, dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user is inactive', async () => {
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue({
        ...mockUserWithPassword,
        isActive: false,
      });
      await expect(service.login(TENANT_ID, dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user is soft-deleted', async () => {
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue({
        ...mockUserWithPassword,
        deletedAt: new Date(),
      });
      await expect(service.login(TENANT_ID, dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password does not match', async () => {
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue(mockUserWithPassword);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login(TENANT_ID, dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws BadRequestException when tenantId is missing', async () => {
      await expect(service.login('  ', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('refresh', () => {
    it('issues new tokens when refresh token matches', async () => {
      repoMock.findByIdForRefresh.mockResolvedValue(mockUserWithRefresh);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
      jwtMock.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
      (bcryptMock.hash as jest.Mock).mockResolvedValue('new-hashed-refresh');
      repoMock.saveRefreshToken.mockResolvedValue(undefined);

      const result = await service.refresh('user-1', 'raw-refresh');
      expect(result).toHaveProperty('accessToken', 'access');
    });

    it('throws ForbiddenException when user has no stored refresh token', async () => {
      repoMock.findByIdForRefresh.mockResolvedValue({ ...mockUserWithRefresh, refreshToken: null });
      await expect(service.refresh('user-1', 'token')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user is not found', async () => {
      repoMock.findByIdForRefresh.mockResolvedValue(null);
      await expect(service.refresh('user-1', 'token')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user is inactive', async () => {
      repoMock.findByIdForRefresh.mockResolvedValue({
        ...mockUserWithRefresh,
        isActive: false,
      });
      await expect(service.refresh('user-1', 'token')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when refresh token does not match', async () => {
      repoMock.findByIdForRefresh.mockResolvedValue(mockUserWithRefresh);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.refresh('user-1', 'bad-token')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout', () => {
    it('clears refresh token for user', async () => {
      repoMock.saveRefreshToken.mockResolvedValue(undefined);
      await service.logout('user-1');
      expect(repoMock.saveRefreshToken).toHaveBeenCalledWith('user-1', null);
    });
  });

  describe('findByTenantAndEmail', () => {
    it('delegates to AuthRepository and returns safe user without secrets', async () => {
      repoMock.findByTenantAndEmail.mockResolvedValue(mockUserSafe);
      const result = await service.findByTenantAndEmail(TENANT_ID, 'test@example.com');
      expect(result).toEqual(mockUserSafe);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshToken');
      expect(repoMock.findByTenantAndEmail).toHaveBeenCalledWith(TENANT_ID, 'test@example.com');
    });

    it('returns null when no user exists with that email', async () => {
      repoMock.findByTenantAndEmail.mockResolvedValue(null);
      const result = await service.findByTenantAndEmail(TENANT_ID, 'nobody@example.com');
      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    const validToken = {
      id: 'token-001',
      tenantId: TENANT_ID,
      userId: 'user-1',
      tokenHash: 'sha256hash',
      expiresAt: new Date(Date.now() + 3600 * 1000),
      usedAt: null,
      createdAt: new Date(),
    };

    it('throws BadRequestException when token is not found', async () => {
      authEmailRepoMock.findResetToken.mockResolvedValue(null);
      await expect(service.resetPassword('rawtoken', 'newpass')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when token has already been used', async () => {
      authEmailRepoMock.findResetToken.mockResolvedValue({
        ...validToken,
        usedAt: new Date(),
      });
      await expect(service.resetPassword('rawtoken', 'newpass')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when token is expired', async () => {
      authEmailRepoMock.findResetToken.mockResolvedValue({
        ...validToken,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.resetPassword('rawtoken', 'newpass')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('calls markResetTokenUsed on valid token', async () => {
      authEmailRepoMock.findResetToken.mockResolvedValue(validToken);
      authEmailRepoMock.markResetTokenUsed.mockResolvedValue(undefined);
      (bcryptMock.hash as jest.Mock).mockResolvedValue('new-hash');
      repoMock.updatePassword.mockResolvedValue(undefined);

      await service.resetPassword('rawtoken', 'newpass123');

      expect(authEmailRepoMock.markResetTokenUsed).toHaveBeenCalledWith('token-001');
    });

    it('calls updatePassword with hashed new password on global User', async () => {
      authEmailRepoMock.findResetToken.mockResolvedValue(validToken);
      authEmailRepoMock.markResetTokenUsed.mockResolvedValue(undefined);
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-new-pw');
      repoMock.updatePassword.mockResolvedValue(undefined);

      await service.resetPassword('rawtoken', 'newpass123');

      expect(repoMock.updatePassword).toHaveBeenCalledWith('user-1', 'hashed-new-pw');
    });
  });
});
