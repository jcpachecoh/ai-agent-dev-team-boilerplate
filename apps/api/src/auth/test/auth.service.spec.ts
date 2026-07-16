import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { DocumentType, AuthMethod, LoginAuditStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthService } from '../service/auth.service';
import { AuthRepository } from '../repository/auth.repository';
import { AuthEmailRepository } from '../repository/auth-email.repository';
import { AuthEmailService } from '../service/auth-email.service';
import { AuditService } from '../../audit/service/audit.service';
import { UserLocationsService } from '../../locations/service/user-locations.service';

jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

const TENANT_ID = 'palos-de-lena';

const expectedJwtPayload = {
  sub: 'user-1',
  email: 'test@example.com',
  tenantId: TENANT_ID,
  roleId: 'role-1',
  roleCode: 'OPERATOR',
  locationId: null,
};

const emptySessionMeta = {
  locations: [] as const,
  locationId: null,
  requiresLocationSelection: false,
};

const userLocationsServiceMock = {
  getActiveUserLocations: jest.fn(),
};

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
  findByIdForAuth: jest.fn(),
  findByIdWithRoleCode: jest.fn(),
  findJwtClaimsByUserId: jest.fn(),
  findRoleByTenantAndCode: jest.fn(),
  createUser: jest.fn(),
  incrementLoginAttempts: jest.fn(),
  lockUser: jest.fn(),
  resetLoginAttempts: jest.fn(),
  saveRefreshToken: jest.fn(),
  updatePassword: jest.fn(),
  markEmailVerified: jest.fn(),
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

const authEmailServiceMock = {
  sendVerifyEmail: jest.fn(),
};

describe('AuthService', () => {
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
        { provide: UserLocationsService, useValue: userLocationsServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    auditServiceMock.logLogin.mockResolvedValue(undefined);
    userLocationsServiceMock.getActiveUserLocations.mockResolvedValue([]);
    repoMock.incrementLoginAttempts.mockResolvedValue(1);
    repoMock.lockUser.mockResolvedValue(undefined);
    repoMock.resetLoginAttempts.mockResolvedValue(undefined);
    authEmailServiceMock.sendVerifyEmail.mockResolvedValue({ otpCode: '123456' });
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
      repoMock.createUser.mockResolvedValue({
        ...mockUserSafe,
        id: 'user-2',
        email: dto.email,
        roleId: 'role-op',
        emailVerified: false,
      });
      repoMock.findJwtClaimsByUserId.mockResolvedValue({
        sub: 'user-2',
        email: dto.email,
        tenantId: TENANT_ID,
        roleId: 'role-op',
        roleCode: 'OPERATOR',
      });
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-pw');
      jwtMock.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      repoMock.saveRefreshToken.mockResolvedValue(undefined);

      const result = await service.signup(TENANT_ID, dto);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        ...emptySessionMeta,
      });
      expect(jwtMock.signAsync).toHaveBeenCalledWith(
        {
          sub: 'user-2',
          email: dto.email,
          tenantId: TENANT_ID,
          roleId: 'role-op',
          roleCode: 'OPERATOR',
          locationId: null,
        },
        { expiresIn: '60m' },
      );
      expect(jwtMock.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-2',
          tenantId: TENANT_ID,
          roleId: 'role-op',
          roleCode: 'OPERATOR',
        }),
        expect.objectContaining({ expiresIn: '7d' }),
      );
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
      expect(authEmailServiceMock.sendVerifyEmail).toHaveBeenCalledWith(
        { id: 'user-2', email: dto.email },
        { tenantId: TENANT_ID, tenantName: TENANT_ID },
      );
    });

    it('does not set emailVerified on signup (remains false until verifyEmail)', async () => {
      repoMock.findByTenantAndEmail.mockResolvedValue(null);
      repoMock.findByTenantAndCedula.mockResolvedValue(null);
      repoMock.findRoleByTenantAndCode.mockResolvedValue({
        id: 'role-op',
        code: 'OPERATOR',
        isActive: true,
      });
      repoMock.createUser.mockResolvedValue({
        id: 'user-2',
        email: dto.email,
        emailVerified: false,
      });
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-pw');
      jwtMock.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      repoMock.saveRefreshToken.mockResolvedValue(undefined);

      await service.signup(TENANT_ID, dto);

      expect(repoMock.createUser).toHaveBeenCalledWith(
        expect.not.objectContaining({ emailVerified: expect.anything() }),
      );
      expect(authEmailServiceMock.sendVerifyEmail).toHaveBeenCalled();
    });

    it('returns tokens when verification email enqueue fails', async () => {
      repoMock.findByTenantAndEmail.mockResolvedValue(null);
      repoMock.findByTenantAndCedula.mockResolvedValue(null);
      repoMock.findRoleByTenantAndCode.mockResolvedValue({
        id: 'role-op',
        code: 'OPERATOR',
        isActive: true,
      });
      repoMock.createUser.mockResolvedValue({
        id: 'user-2',
        email: dto.email,
        emailVerified: false,
      });
      repoMock.findJwtClaimsByUserId.mockResolvedValue({
        sub: 'user-2',
        email: dto.email,
        tenantId: TENANT_ID,
        roleId: 'role-op',
        roleCode: 'OPERATOR',
      });
      authEmailServiceMock.sendVerifyEmail.mockRejectedValue(new Error('Redis unavailable'));
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-pw');
      jwtMock.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      repoMock.saveRefreshToken.mockResolvedValue(undefined);

      const result = await service.signup(TENANT_ID, dto);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        ...emptySessionMeta,
      });
    });

    it('does not send verification email when email is already registered', async () => {
      repoMock.findByTenantAndEmail.mockResolvedValue(mockUserSafe);

      await expect(service.signup(TENANT_ID, dto)).rejects.toThrow(ConflictException);

      expect(repoMock.createUser).not.toHaveBeenCalled();
      expect(authEmailServiceMock.sendVerifyEmail).not.toHaveBeenCalled();
    });

    it('does not send verification email when cédula is already registered', async () => {
      repoMock.findByTenantAndEmail.mockResolvedValue(null);
      repoMock.findByTenantAndCedula.mockResolvedValue(mockUserSafe);

      await expect(service.signup(TENANT_ID, dto)).rejects.toThrow(ConflictException);

      expect(repoMock.createUser).not.toHaveBeenCalled();
      expect(authEmailServiceMock.sendVerifyEmail).not.toHaveBeenCalled();
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
      repoMock.createUser.mockResolvedValue({
        ...mockUserSafe,
        id: 'user-3',
        email: dto.email,
        roleId: 'role-op',
      });
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
      repoMock.createUser.mockResolvedValue({
        ...mockUserSafe,
        id: 'user-2',
        email: dto.email,
        roleId: 'role-op',
      });
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

    it('throws ConflictException on P2002 unique violation for email (race)', async () => {
      repoMock.findByTenantAndEmail.mockResolvedValue(null);
      repoMock.findByTenantAndCedula.mockResolvedValue(null);
      repoMock.findRoleByTenantAndCode.mockResolvedValue({
        id: 'role-op',
        code: 'OPERATOR',
        isActive: true,
      });
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-pw');
      const p2002 = new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['tenantId', 'email'] },
      });
      repoMock.createUser.mockRejectedValue(p2002);

      await expect(service.signup(TENANT_ID, dto)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException on P2002 unique violation for cedula (race)', async () => {
      repoMock.findByTenantAndEmail.mockResolvedValue(null);
      repoMock.findByTenantAndCedula.mockResolvedValue(null);
      repoMock.findRoleByTenantAndCode.mockResolvedValue({
        id: 'role-op',
        code: 'OPERATOR',
        isActive: true,
      });
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-pw');
      const p2002 = new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['tenantId', 'cedula'] },
      });
      repoMock.createUser.mockRejectedValue(p2002);

      await expect(service.signup(TENANT_ID, dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const dto = { email: 'test@example.com', password: 'correct-password' };

    it('returns tokens and logs SUCCESS on valid credentials', async () => {
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue(mockUserWithPassword);
      repoMock.findJwtClaimsByUserId.mockResolvedValue(expectedJwtPayload);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
      repoMock.resetLoginAttempts.mockResolvedValue(undefined);
      jwtMock.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      repoMock.saveRefreshToken.mockResolvedValue(undefined);
      repoMock.resetLoginAttempts.mockResolvedValue(undefined);

      const result = await service.login(TENANT_ID, dto, '1.2.3.4', 'Mozilla');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(jwtMock.signAsync).toHaveBeenCalledWith(expectedJwtPayload, { expiresIn: '60m' });
      expect(repoMock.findJwtClaimsByUserId).toHaveBeenCalledWith('user-1');
      expect(repoMock.resetLoginAttempts).toHaveBeenCalledWith(mockUserWithPassword.id);
      expect(repoMock.findByTenantAndEmailForAuth).toHaveBeenCalledWith(TENANT_ID, dto.email);
      expect(jwtMock.signAsync).toHaveBeenCalledWith(
        expectedJwtPayload,
        expect.objectContaining({ expiresIn: '7d' }),
      );
      expect(repoMock.incrementLoginAttempts).not.toHaveBeenCalled();
      expect(auditServiceMock.logLogin).toHaveBeenCalledWith({
        tenantId: TENANT_ID,
        userId: mockUserWithPassword.id,
        identifier: dto.email,
        authMethod: AuthMethod.PASSWORD,
        status: LoginAuditStatus.SUCCESS,
        ipAddress: '1.2.3.4',
        userAgent: 'Mozilla',
      });
    });

    it('throws UnauthorizedException and logs FAILED when user does not exist', async () => {
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue(null);
      await expect(service.login(TENANT_ID, dto, '1.2.3.4')).rejects.toThrow(UnauthorizedException);
      expect(repoMock.incrementLoginAttempts).not.toHaveBeenCalled();
      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LoginAuditStatus.FAILED,
          failureReason: 'User not found or inactive',
          ipAddress: '1.2.3.4',
        }),
      );
    });

    it('throws UnauthorizedException and logs LOCKED when account is locked', async () => {
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue({
        ...mockUserWithPassword,
        lockedUntil: new Date(Date.now() + 10000),
      });
      await expect(service.login(TENANT_ID, dto)).rejects.toThrow(UnauthorizedException);
      expect(repoMock.incrementLoginAttempts).not.toHaveBeenCalled();
      expect(bcryptMock.compare).not.toHaveBeenCalled();
      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LoginAuditStatus.LOCKED,
          failureReason: 'cuenta_bloqueada',
        }),
      );
      expect(repoMock.incrementLoginAttempts).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException and logs FAILED when password does not match', async () => {
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue(mockUserWithPassword);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);
      repoMock.incrementLoginAttempts.mockResolvedValue(1);
      await expect(service.login(TENANT_ID, dto)).rejects.toThrow(UnauthorizedException);
      expect(repoMock.incrementLoginAttempts).toHaveBeenCalledWith(mockUserWithPassword.id);
      expect(repoMock.lockUser).not.toHaveBeenCalled();
      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LoginAuditStatus.FAILED,
          failureReason: 'password_invalido',
        }),
      );
    });

    it('increments loginAttempts on each wrong password without locking before 5th attempt', async () => {
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue({
        ...mockUserWithPassword,
        loginAttempts: 3,
      });
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);
      repoMock.incrementLoginAttempts.mockResolvedValue(4);

      await expect(service.login(TENANT_ID, dto)).rejects.toThrow(UnauthorizedException);

      expect(repoMock.lockUser).not.toHaveBeenCalled();
      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({ status: LoginAuditStatus.FAILED }),
      );
    });

    it('does not increment loginAttempts when user does not exist', async () => {
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue(null);
      await expect(service.login(TENANT_ID, dto)).rejects.toThrow(UnauthorizedException);
      expect(repoMock.incrementLoginAttempts).not.toHaveBeenCalled();
    });

    it('locks account for 15 minutes on fifth failed password attempt', async () => {
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue({
        ...mockUserWithPassword,
        loginAttempts: 4,
      });
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);
      repoMock.incrementLoginAttempts.mockResolvedValue(5);

      const before = Date.now();
      await expect(service.login(TENANT_ID, dto)).rejects.toThrow(UnauthorizedException);

      expect(repoMock.incrementLoginAttempts).toHaveBeenCalledWith(mockUserWithPassword.id);
      expect(repoMock.lockUser).toHaveBeenCalledWith(mockUserWithPassword.id, expect.any(Date));
      const lockUntil = repoMock.lockUser.mock.calls[0][1] as Date;
      const lockMs = lockUntil.getTime() - before;
      expect(lockMs).toBeGreaterThanOrEqual(14 * 60 * 1000);
      expect(lockMs).toBeLessThanOrEqual(16 * 60 * 1000);
      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LoginAuditStatus.LOCKED,
          failureReason: 'cuenta_bloqueada',
        }),
      );
    });

    it('does not increment loginAttempts when logging in while already locked', async () => {
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue({
        ...mockUserWithPassword,
        loginAttempts: 5,
        lockedUntil: new Date(Date.now() + 60_000),
      });

      await expect(service.login(TENANT_ID, dto)).rejects.toThrow(UnauthorizedException);

      expect(repoMock.incrementLoginAttempts).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('issues new tokens and logs SUCCESS when refresh token matches', async () => {
      repoMock.findByIdForRefresh.mockResolvedValue(mockUserWithRefresh);
      repoMock.findJwtClaimsByUserId.mockResolvedValue(expectedJwtPayload);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
      jwtMock.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');
      (bcryptMock.hash as jest.Mock).mockResolvedValue('new-hashed-refresh');
      repoMock.saveRefreshToken.mockResolvedValue(undefined);

      const result = await service.refresh('user-1', 'raw-refresh', '1.2.3.4');
      expect(result).toHaveProperty('accessToken', 'access');
      expect(jwtMock.signAsync).toHaveBeenCalledWith(expectedJwtPayload, { expiresIn: '60m' });
      expect(repoMock.findJwtClaimsByUserId).toHaveBeenCalledWith('user-1');
      expect(repoMock.saveRefreshToken).toHaveBeenCalledWith('user-1', 'new-hashed-refresh');
      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LoginAuditStatus.SUCCESS,
          authMethod: AuthMethod.REFRESH_TOKEN,
          ipAddress: '1.2.3.4',
        }),
      );
    });

    it('throws ForbiddenException and logs FAILED when refresh token does not match', async () => {
      repoMock.findByIdForRefresh.mockResolvedValue(mockUserWithRefresh);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.refresh('user-1', 'bad-token')).rejects.toThrow(ForbiddenException);
      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LoginAuditStatus.FAILED,
          authMethod: AuthMethod.REFRESH_TOKEN,
        }),
      );
    });

    it('throws ForbiddenException when user is missing or has no refresh token', async () => {
      repoMock.findByIdForRefresh.mockResolvedValue(null);

      await expect(service.refresh('user-1', 'raw-refresh')).rejects.toThrow(ForbiddenException);
      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LoginAuditStatus.FAILED,
          failureReason: 'Invalid user or missing refresh token',
        }),
      );
    });

    it('throws ForbiddenException when user is inactive', async () => {
      repoMock.findByIdForRefresh.mockResolvedValue({
        ...mockUserWithRefresh,
        isActive: false,
      });

      await expect(service.refresh('user-1', 'raw-refresh')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout', () => {
    it('clears refresh token and logs LOGOUT', async () => {
      repoMock.findByIdForRefresh.mockResolvedValue(mockUserSafe);
      repoMock.saveRefreshToken.mockResolvedValue(undefined);
      await service.logout('user-1', '1.2.3.4');
      expect(repoMock.saveRefreshToken).toHaveBeenCalledWith('user-1', null);
      expect(auditServiceMock.logLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LoginAuditStatus.LOGOUT,
          ipAddress: '1.2.3.4',
        }),
      );
    });
  });

  describe('JWT payload', () => {
    const signupDto = {
      email: 'jwt@example.com',
      cedula: '11111111',
      documentType: DocumentType.CC,
      password: 'password123',
    };

    it('signup access JWT includes tenantId, roleId, roleCode and no secrets', async () => {
      repoMock.findByTenantAndEmail.mockResolvedValue(null);
      repoMock.findByTenantAndCedula.mockResolvedValue(null);
      repoMock.findRoleByTenantAndCode.mockResolvedValue({
        id: 'role-op',
        code: 'OPERATOR',
        isActive: true,
      });
      repoMock.createUser.mockResolvedValue({
        ...mockUserSafe,
        id: 'user-jwt',
        email: signupDto.email,
        roleId: 'role-op',
      });
      repoMock.findJwtClaimsByUserId.mockResolvedValue({
        sub: 'user-jwt',
        email: signupDto.email,
        tenantId: TENANT_ID,
        roleId: 'role-op',
        roleCode: 'OPERATOR',
      });
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed');
      jwtMock.signAsync.mockResolvedValue('token');
      repoMock.saveRefreshToken.mockResolvedValue(undefined);

      await service.signup(TENANT_ID, signupDto);

      const accessCall = jwtMock.signAsync.mock.calls.find((call) => call[1]?.expiresIn === '60m');
      expect(accessCall?.[0]).toEqual({
        sub: 'user-jwt',
        email: signupDto.email,
        tenantId: TENANT_ID,
        roleId: 'role-op',
        roleCode: 'OPERATOR',
        locationId: null,
      });
      expect(accessCall?.[0]).not.toHaveProperty('permissions');
      expect(accessCall?.[0]).not.toHaveProperty('passwordHash');
      expect(accessCall?.[0]).not.toHaveProperty('refreshToken');
    });

    it('login refresh JWT uses the same identity claims as access', async () => {
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue(mockUserWithPassword);
      repoMock.findJwtClaimsByUserId.mockResolvedValue(expectedJwtPayload);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
      jwtMock.signAsync.mockResolvedValue('token');
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed');
      repoMock.saveRefreshToken.mockResolvedValue(undefined);

      await service.login(TENANT_ID, { email: mockUserWithPassword.email, password: 'pw' });

      expect(jwtMock.signAsync).toHaveBeenCalledTimes(2);
      const [accessPayload, refreshPayload] = jwtMock.signAsync.mock.calls.map((call) => call[0]);
      expect(accessPayload).toEqual(expectedJwtPayload);
      expect(refreshPayload).toEqual(expectedJwtPayload);
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

  describe('me', () => {
    const profile = {
      id: mockUserSafe.id,
      tenantId: mockUserSafe.tenantId,
      email: mockUserSafe.email,
      name: null,
      cedula: mockUserSafe.cedula,
      documentType: mockUserSafe.documentType,
      emailVerified: mockUserSafe.emailVerified,
      isActive: mockUserSafe.isActive,
      roleCode: 'OPERATOR',
      createdAt: mockUserSafe.createdAt,
    };

    it('returns safe user profile with roleCode', async () => {
      repoMock.findByIdWithRoleCode.mockResolvedValue(profile);
      const result = await service.me('user-1');
      expect(result).toEqual(profile);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('throws UnauthorizedException when user is not found', async () => {
      repoMock.findByIdWithRoleCode.mockResolvedValue(null);
      await expect(service.me('missing')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user is inactive', async () => {
      repoMock.findByIdWithRoleCode.mockResolvedValue({ ...profile, isActive: false });
      await expect(service.me('user-1')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('updates password when current password matches', async () => {
      repoMock.findByIdForAuth.mockResolvedValue(mockUserWithPassword);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
      (bcryptMock.hash as jest.Mock).mockResolvedValue('new-hash');
      repoMock.updatePassword.mockResolvedValue(undefined);

      const result = await service.changePassword('user-1', 'old-pass', 'new-pass123');

      expect(result).toEqual({ message: 'Password updated successfully.' });
      expect(bcryptMock.hash).toHaveBeenCalledWith('new-pass123', 12);
      expect(repoMock.updatePassword).toHaveBeenCalledWith('user-1', 'new-hash', true);
    });

    it('throws UnauthorizedException when current password is wrong', async () => {
      repoMock.findByIdForAuth.mockResolvedValue(mockUserWithPassword);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword('user-1', 'wrong', 'new-pass123')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repoMock.updatePassword).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user is not found', async () => {
      repoMock.findByIdForAuth.mockResolvedValue(null);
      await expect(service.changePassword('user-1', 'old', 'new-pass123')).rejects.toThrow(
        UnauthorizedException,
      );
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
      repoMock.markEmailVerified.mockResolvedValue(true);

      await service.resetPassword('rawtoken', 'newpass123');

      expect(bcryptMock.hash).toHaveBeenCalledWith('newpass123', 12);
      expect(repoMock.updatePassword).toHaveBeenCalledWith('user-1', 'hashed-new-pw', true);
      expect(repoMock.markEmailVerified).toHaveBeenCalledWith('user-1');
    });
  });

  describe('location session', () => {
    const assignedLocations = [
      {
        id: 'loc-1',
        name: 'Sede Centro',
        code: 'PL-01',
        city: 'Bogotá',
        address: 'Calle 1',
        tenantId: TENANT_ID,
        isActive: true,
        deletedAt: null,
      },
      {
        id: 'loc-2',
        name: 'Sede Norte',
        code: 'PL-02',
        city: 'Bogotá',
        address: 'Calle 2',
        tenantId: TENANT_ID,
        isActive: true,
        deletedAt: null,
      },
    ];

    beforeEach(() => {
      repoMock.findJwtClaimsByUserId.mockResolvedValue(expectedJwtPayload);
      jwtMock.signAsync.mockResolvedValue('token');
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashed-refresh');
      repoMock.saveRefreshToken.mockResolvedValue(undefined);
    });

    it('login auto-selects location when user has one assigned sede', async () => {
      userLocationsServiceMock.getActiveUserLocations.mockResolvedValue([assignedLocations[0]]);
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue(mockUserWithPassword);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(TENANT_ID, {
        email: mockUserWithPassword.email,
        password: 'pw',
      });

      expect(result.locationId).toBe('loc-1');
      expect(result.requiresLocationSelection).toBe(false);
      expect(result.locations).toHaveLength(1);
    });

    it('login requires selection when user has multiple assigned sedes', async () => {
      userLocationsServiceMock.getActiveUserLocations.mockResolvedValue(assignedLocations);
      repoMock.findByTenantAndEmailForAuth.mockResolvedValue(mockUserWithPassword);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(TENANT_ID, {
        email: mockUserWithPassword.email,
        password: 'pw',
      });

      expect(result.locationId).toBeNull();
      expect(result.requiresLocationSelection).toBe(true);
      expect(result.locations).toHaveLength(2);
    });

    it('selectLocation issues tokens with chosen locationId', async () => {
      userLocationsServiceMock.getActiveUserLocations.mockResolvedValue(assignedLocations);

      const result = await service.selectLocation(TENANT_ID, 'user-1', 'loc-2');

      expect(result.locationId).toBe('loc-2');
      expect(result.requiresLocationSelection).toBe(false);
      expect(jwtMock.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ locationId: 'loc-2' }),
        expect.any(Object),
      );
    });

    it('selectLocation rejects sede not assigned to user', async () => {
      userLocationsServiceMock.getActiveUserLocations.mockResolvedValue([assignedLocations[0]]);

      await expect(service.selectLocation(TENANT_ID, 'user-1', 'loc-2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('myLocations returns active assigned sedes for user', async () => {
      userLocationsServiceMock.getActiveUserLocations.mockResolvedValue(assignedLocations);

      const result = await service.myLocations(TENANT_ID, 'user-1');

      expect(result).toEqual([
        {
          id: 'loc-1',
          name: 'Sede Centro',
          code: 'PL-01',
          city: 'Bogotá',
          address: 'Calle 1',
        },
        {
          id: 'loc-2',
          name: 'Sede Norte',
          code: 'PL-02',
          city: 'Bogotá',
          address: 'Calle 2',
        },
      ]);
    });
  });

  describe('issueKioskMarkingToken / verifyUserPassword', () => {
    beforeEach(() => {
      repoMock.findJwtClaimsByUserId.mockResolvedValue({ ...expectedJwtPayload });
      jwtMock.signAsync.mockResolvedValue('kiosk-marking-jwt');
    });

    it('issues scoped KIOSK_MARKING access token without refresh', async () => {
      const result = await service.issueKioskMarkingToken(
        'user-1',
        TENANT_ID,
        'loc-1',
        'session-1',
      );

      expect(result.accessToken).toBe('kiosk-marking-jwt');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(jwtMock.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenType: 'KIOSK_MARKING',
          sessionId: 'session-1',
          locationId: 'loc-1',
        }),
        expect.objectContaining({ expiresIn: 20 * 60 }),
      );
      expect(repoMock.saveRefreshToken).not.toHaveBeenCalled();
    });

    it('rejects empty locationId', async () => {
      await expect(
        service.issueKioskMarkingToken('user-1', TENANT_ID, '  ', 'session-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects empty sessionId', async () => {
      await expect(
        service.issueKioskMarkingToken('user-1', TENANT_ID, 'loc-1', ' '),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects tenant mismatch', async () => {
      repoMock.findJwtClaimsByUserId.mockResolvedValue({
        ...expectedJwtPayload,
        tenantId: 'other-tenant',
      });
      await expect(
        service.issueKioskMarkingToken('user-1', TENANT_ID, 'loc-1', 'session-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('verifyUserPassword returns true on match', async () => {
      repoMock.findByIdForAuth.mockResolvedValue(mockUserWithPassword);
      bcryptMock.compare.mockResolvedValue(true as never);
      await expect(service.verifyUserPassword('user-1', 'secret')).resolves.toBe(true);
    });

    it('verifyUserPassword returns false when user inactive', async () => {
      repoMock.findByIdForAuth.mockResolvedValue({ ...mockUserWithPassword, isActive: false });
      await expect(service.verifyUserPassword('user-1', 'secret')).resolves.toBe(false);
      expect(bcryptMock.compare).not.toHaveBeenCalled();
    });

    it('verifyUserPassword returns false when user missing', async () => {
      repoMock.findByIdForAuth.mockResolvedValue(null);
      await expect(service.verifyUserPassword('user-1', 'secret')).resolves.toBe(false);
    });
  });
});
