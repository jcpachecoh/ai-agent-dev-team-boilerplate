import { BadRequestException } from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../controller/auth.controller';
import { AuthService } from '../service/auth.service';
import { AuthEmailService } from '../service/auth-email.service';

const TENANT_ID = 'palos-de-lena';
const tokens = { accessToken: 'access', refreshToken: 'refresh' };

const mockUserSafe = {
  id: 'user-1',
  tenantId: TENANT_ID,
  cedula: '12345678',
  documentType: DocumentType.CC,
  email: 'a@b.com',
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

const mockUserProfile = {
  id: mockUserSafe.id,
  tenantId: mockUserSafe.tenantId,
  email: mockUserSafe.email,
  cedula: mockUserSafe.cedula,
  documentType: mockUserSafe.documentType,
  emailVerified: mockUserSafe.emailVerified,
  isActive: mockUserSafe.isActive,
  roleCode: 'OPERATOR',
  createdAt: mockUserSafe.createdAt,
};

const serviceMock = {
  signup: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  me: jest.fn(),
  changePassword: jest.fn(),
  resetPassword: jest.fn(),
  findByTenantAndEmail: jest.fn(),
};

const authEmailServiceMock = {
  sendResetPassword: jest.fn(),
  verifyOtp: jest.fn(),
  sendVerifyEmail: jest.fn(),
  sendWelcome: jest.fn(),
  sendInvitation: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: serviceMock },
        { provide: AuthEmailService, useValue: authEmailServiceMock },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('delegates to AuthService.signup with tenant header and returns tokens', async () => {
      serviceMock.signup.mockResolvedValue(tokens);
      const dto = {
        email: 'a@b.com',
        cedula: '12345678',
        documentType: DocumentType.CC,
        password: 'pass12345',
      };
      const result = await controller.signup(dto, TENANT_ID);
      expect(result).toEqual(tokens);
      expect(result).not.toHaveProperty('passwordHash');
      expect(serviceMock.signup).toHaveBeenCalledWith(TENANT_ID, dto);
    });

    it('throws BadRequestException when x-tenant-id is missing', async () => {
      const dto = {
        email: 'a@b.com',
        cedula: '12345678',
        documentType: DocumentType.CC,
        password: 'pass12345',
      };
      expect(() => controller.signup(dto, '')).toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('delegates to AuthService.login with tenant header and returns tokens', async () => {
      serviceMock.login.mockResolvedValue(tokens);
      const dto = { email: 'a@b.com', password: 'pass1234' };
      const req = { headers: {}, socket: { remoteAddress: '1.2.3.4' } } as never;
      const result = await controller.login(dto, TENANT_ID, req);
      expect(result).toEqual(tokens);
      expect(result).not.toHaveProperty('passwordHash');
      expect(serviceMock.login).toHaveBeenCalledWith(TENANT_ID, dto, '1.2.3.4', undefined);
    });

    it('throws BadRequestException when x-tenant-id is missing', () => {
      const req = { headers: {}, socket: { remoteAddress: '1.2.3.4' } } as never;
      expect(() => controller.login({ email: 'a@b.com', password: 'pass' }, '  ', req)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('refresh', () => {
    it('delegates to AuthService.refresh using req.user', async () => {
      serviceMock.refresh.mockResolvedValue(tokens);
      const req = {
        user: { sub: 'user-1', refreshToken: 'raw-refresh' },
        headers: {},
        socket: { remoteAddress: '1.2.3.4' },
      } as never;
      const result = await controller.refresh(req);
      expect(result).toEqual(tokens);
      expect(result).not.toHaveProperty('passwordHash');
      expect(serviceMock.refresh).toHaveBeenCalledWith(
        'user-1',
        'raw-refresh',
        '1.2.3.4',
        undefined,
        null,
      );
    });
  });

  describe('logout', () => {
    it('delegates to AuthService.logout using req.user.sub', async () => {
      serviceMock.logout.mockResolvedValue(undefined);
      const req = {
        user: { sub: 'user-1' },
        headers: {},
        socket: { remoteAddress: '1.2.3.4' },
      } as never;
      await controller.logout(req);
      expect(serviceMock.logout).toHaveBeenCalledWith('user-1', '1.2.3.4', undefined);
    });
  });

  describe('me', () => {
    it('delegates to AuthService.me using req.user.sub', async () => {
      serviceMock.me.mockResolvedValue(mockUserProfile);
      const req = { user: { sub: 'user-1', email: 'a@b.com' } } as never;

      const result = await controller.me(req);

      expect(serviceMock.me).toHaveBeenCalledWith('user-1', null);
      expect(result).toEqual(mockUserProfile);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshToken');
    });
  });

  describe('changePassword', () => {
    it('delegates to AuthService.changePassword with user sub and dto', async () => {
      serviceMock.changePassword.mockResolvedValue({ message: 'Password updated successfully.' });
      const req = { user: { sub: 'user-1', email: 'a@b.com' } } as never;
      const dto = { currentPassword: 'OldPass123!', newPassword: 'NewPass123!' };

      const result = await controller.changePassword(dto, req);

      expect(serviceMock.changePassword).toHaveBeenCalledWith(
        'user-1',
        'OldPass123!',
        'NewPass123!',
      );
      expect(result).toEqual({ message: 'Password updated successfully.' });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('propagates UnauthorizedException from AuthService.changePassword', async () => {
      const { UnauthorizedException } = await import('@nestjs/common');
      serviceMock.changePassword.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );
      const req = { user: { sub: 'user-1', email: 'a@b.com' } } as never;

      await expect(
        controller.changePassword({ currentPassword: 'wrong', newPassword: 'NewPass123!' }, req),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('delegates to authEmailService.sendResetPassword with tenant context and returns 200 message', async () => {
      authEmailServiceMock.sendResetPassword.mockResolvedValue(undefined);
      const dto = { email: 'alice@example.com' };

      const result = await controller.forgotPassword(dto, TENANT_ID);

      expect(authEmailServiceMock.sendResetPassword).toHaveBeenCalledWith('alice@example.com', {
        tenantId: TENANT_ID,
        tenantName: TENANT_ID,
      });
      expect(result).toHaveProperty('message');
    });

    it('returns 200 even when sendResetPassword resolves (user not found — silent)', async () => {
      authEmailServiceMock.sendResetPassword.mockResolvedValue(undefined);
      const result = await controller.forgotPassword({ email: 'nobody@example.com' }, TENANT_ID);
      expect(result).toHaveProperty('message');
    });

    it('returns the same message regardless of whether user exists (anti-enumeration)', async () => {
      authEmailServiceMock.sendResetPassword.mockResolvedValue(undefined);

      const resultExisting = await controller.forgotPassword(
        { email: 'alice@example.com' },
        TENANT_ID,
      );
      const resultMissing = await controller.forgotPassword(
        { email: 'nobody@example.com' },
        TENANT_ID,
      );

      expect(resultExisting).toEqual(resultMissing);
    });

    it('throws BadRequestException when x-tenant-id is missing', async () => {
      await expect(controller.forgotPassword({ email: 'a@b.com' }, '')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resetPassword', () => {
    it('delegates to authService.resetPassword with token and newPassword', async () => {
      serviceMock.resetPassword.mockResolvedValue(undefined);
      const dto = { token: 'raw-token-hex', newPassword: 'NewPass123!' };

      const result = await controller.resetPassword(dto);

      expect(serviceMock.resetPassword).toHaveBeenCalledWith('raw-token-hex', 'NewPass123!');
      expect(result).toHaveProperty('message');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('propagates BadRequestException from authService.resetPassword', async () => {
      serviceMock.resetPassword.mockRejectedValue(
        new BadRequestException('Invalid or expired reset token'),
      );

      await expect(
        controller.resetPassword({ token: 'bad-token', newPassword: 'NewPass123!' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyEmail', () => {
    it('delegates to authEmailService.verifyOtp with only the otpCode (no userId)', async () => {
      authEmailServiceMock.verifyOtp.mockResolvedValue(undefined);
      const dto = { otpCode: '847291' };

      const result = await controller.verifyEmail(dto);

      expect(authEmailServiceMock.verifyOtp).toHaveBeenCalledWith('847291');
      expect(authEmailServiceMock.verifyOtp).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('message');
    });

    it('returns 200 message on successful OTP verification', async () => {
      authEmailServiceMock.verifyOtp.mockResolvedValue(undefined);

      const result = await controller.verifyEmail({ otpCode: '123456' });

      expect(result).toEqual({ message: 'Email verified successfully.' });
    });

    it('propagates BadRequestException from verifyOtp', async () => {
      authEmailServiceMock.verifyOtp.mockRejectedValue(
        new BadRequestException('Invalid or expired verification code'),
      );

      await expect(controller.verifyEmail({ otpCode: '000000' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resendVerification', () => {
    it('calls sendVerifyEmail when user exists and returns 200 message', async () => {
      serviceMock.findByTenantAndEmail.mockResolvedValue(mockUserSafe);
      authEmailServiceMock.sendVerifyEmail.mockResolvedValue({ otpCode: '123456' });

      const result = await controller.resendVerification({ email: 'a@b.com' }, TENANT_ID);

      expect(serviceMock.findByTenantAndEmail).toHaveBeenCalledWith(TENANT_ID, 'a@b.com');
      expect(authEmailServiceMock.sendVerifyEmail).toHaveBeenCalledWith(
        { id: mockUserSafe.id, email: mockUserSafe.email },
        { tenantId: TENANT_ID, tenantName: TENANT_ID },
      );
      expect(result).toHaveProperty('message');
    });

    it('returns 200 silently when user does not exist (no sendVerifyEmail call)', async () => {
      serviceMock.findByTenantAndEmail.mockResolvedValue(null);

      const result = await controller.resendVerification(
        { email: 'nobody@example.com' },
        TENANT_ID,
      );

      expect(authEmailServiceMock.sendVerifyEmail).not.toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });

    it('throws BadRequestException when x-tenant-id is missing', async () => {
      await expect(controller.resendVerification({ email: 'a@b.com' }, '')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
