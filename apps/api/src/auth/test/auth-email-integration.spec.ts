// ioredis must be mocked before any import that pulls AuthEmailService, so that
// onModuleInit() does not attempt a real Redis connection even if called.
jest.mock('ioredis');
jest.mock('bcrypt');

import { createHash } from 'crypto';
import { DocumentType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthController } from '../controller/auth.controller';
import { AuthService } from '../service/auth.service';
import { AuthEmailService } from '../service/auth-email.service';
import { AuthRepository } from '../repository/auth.repository';
import { AuthEmailRepository } from '../repository/auth-email.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/service/audit.service';
import { EmailService } from '@restopsiq/email';

const TENANT_ID = 'palos-de-lena';

const mockUserSafe = {
  id: 'user-001',
  tenantId: TENANT_ID,
  cedula: '12345678',
  documentType: DocumentType.CC,
  email: 'alice@example.com',
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
};

const mockUserWithPassword = {
  ...mockUserSafe,
  passwordHash: '$2b$12$Elo.kWNs5.bh93LOaBPH7OtQ23EuF38MBKm4XUL2mH1WnpBhOsXiS',
};

const mockTokenRecord = {
  id: 'token-001',
  tenantId: TENANT_ID,
  userId: 'user-001',
  tokenHash: 'placeholder-hash',
  expiresAt: new Date(Date.now() + 3600 * 1000),
  usedAt: null,
  createdAt: new Date(),
};

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
  },
  passwordResetToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const emailServiceMock = {
  send: jest.fn(),
};

const auditServiceMock = {
  logLogin: jest.fn(),
};

const jwtServiceMock = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
  verifyAsync: jest.fn(),
};

describe('Auth Email Integration — G4 wiring (AuthController → AuthEmailService → EmailService)', () => {
  let controller: AuthController;
  let redisMock: {
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
    quit: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        AuthEmailService,
        AuthRepository,
        AuthEmailRepository,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EmailService, useValue: emailServiceMock },
        { provide: AuditService, useValue: auditServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();

    redisMock = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      quit: jest.fn().mockResolvedValue('OK'),
    };
    const authEmailService = module.get<AuthEmailService>(AuthEmailService);
    (authEmailService as unknown as { redis: typeof redisMock }).redis = redisMock;

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.update.mockResolvedValue(mockUserSafe);
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.role.findUnique.mockResolvedValue({
      id: 'role-1',
      code: 'OPERATOR',
      isActive: true,
    });
    prismaMock.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.passwordResetToken.create.mockResolvedValue(mockTokenRecord);
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);
    prismaMock.passwordResetToken.update.mockResolvedValue({
      ...mockTokenRecord,
      usedAt: new Date(),
    });
    emailServiceMock.send.mockResolvedValue({ jobId: 'job-integration-001' });
    jwtServiceMock.signAsync.mockResolvedValue('mock-token');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-value');
  });

  it('forgot-password returns 200 response even when the email is not registered', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await controller.forgotPassword({ email: 'nobody@example.com' }, TENANT_ID);

    expect(result).toEqual({ message: 'If the email exists, a reset link has been sent.' });
    expect(emailServiceMock.send).not.toHaveBeenCalled();
  });

  it('forgot-password enqueues a reset-password email job via EmailService.send', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUserSafe);

    await controller.forgotPassword({ email: 'alice@example.com' }, TENANT_ID);

    expect(emailServiceMock.send).toHaveBeenCalledTimes(1);
    expect(emailServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alice@example.com',
        template: expect.objectContaining({ type: 'reset-password' }),
        priority: 'urgent',
      }),
    );
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId_email: { tenantId: TENANT_ID, email: 'alice@example.com' } },
      }),
    );
  });

  it('reset-password with a valid token calls user.update (password changed on global User)', async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(mockTokenRecord);

    await controller.resetPassword({ token: 'raw-valid-token', newPassword: 'newpassword123' });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: mockTokenRecord.userId },
      data: { passwordHash: 'hashed-value' },
    });
  });

  it('reset-password throws BadRequestException when token has already been used', async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      ...mockTokenRecord,
      usedAt: new Date(),
    });

    await expect(
      controller.resetPassword({ token: 'used-token', newPassword: 'newpassword123' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('reset-password throws BadRequestException when token is expired', async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      ...mockTokenRecord,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      controller.resetPassword({ token: 'expired-token', newPassword: 'newpassword123' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('verify-email with a valid OTP resolves, consumes the OTP, and marks emailVerified true', async () => {
    const otpCode = '847291';
    const otpHash = createHash('sha256').update(otpCode).digest('hex');
    const redisPayload = JSON.stringify({
      userId: 'user-001',
      email: 'alice@example.com',
      tenantId: TENANT_ID,
    });

    redisMock.get.mockImplementation(async (key: string) => {
      return key === `otp:${otpHash}` ? redisPayload : null;
    });

    const result = await controller.verifyEmail({ otpCode });

    expect(result).toEqual({ message: 'Email verified successfully.' });
    expect(redisMock.del).toHaveBeenCalledWith(`otp:${otpHash}`);
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-001', deletedAt: null, tenantId: TENANT_ID },
      data: { emailVerified: true },
    });
  });

  it('verify-email does not mark emailVerified when OTP is expired or not found', async () => {
    redisMock.get.mockResolvedValue(null);

    await expect(controller.verifyEmail({ otpCode: '000000' })).rejects.toThrow(
      BadRequestException,
    );

    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  it('forgot-password stores a SHA-256 tokenHash (not the raw token) in passwordResetToken.create', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUserSafe);

    let capturedTokenHash: string | undefined;
    let capturedResetUrl: string | undefined;

    prismaMock.passwordResetToken.create.mockImplementation(
      async ({ data }: { data: { tokenHash: string } }) => {
        capturedTokenHash = data.tokenHash;
        return mockTokenRecord;
      },
    );
    emailServiceMock.send.mockImplementation(
      async (opts: { template: { props: { resetUrl: string } } }) => {
        capturedResetUrl = opts.template.props.resetUrl;
        return { jobId: 'job-sha256-check' };
      },
    );

    await controller.forgotPassword({ email: 'alice@example.com' }, TENANT_ID);

    expect(capturedTokenHash).toBeDefined();
    expect(capturedResetUrl).toBeDefined();

    const rawToken = new URL(capturedResetUrl!).searchParams.get('token')!;
    const expectedHash = createHash('sha256').update(rawToken).digest('hex');

    expect(capturedTokenHash).toBe(expectedHash);
    expect(capturedTokenHash).not.toBe(rawToken);
    expect(capturedTokenHash).toHaveLength(64);
    expect(capturedTokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('login uses tenant-scoped lookup and does not expose passwordHash in response', async () => {
    prismaMock.user.findUnique.mockImplementation(
      ({ select }: { select?: { role?: unknown; passwordHash?: boolean } }) => {
        if (select && 'role' in select) {
          return Promise.resolve({
            id: mockUserSafe.id,
            email: mockUserSafe.email,
            tenantId: TENANT_ID,
            roleId: mockUserSafe.roleId,
            isActive: true,
            deletedAt: null,
            role: { code: 'OPERATOR' },
          });
        }
        return Promise.resolve(mockUserWithPassword);
      },
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');
    jwtServiceMock.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');

    const req = { headers: {}, socket: { remoteAddress: '127.0.0.1' } } as never;
    const result = await controller.login(
      { email: 'alice@example.com', password: 'TestPass123!' },
      TENANT_ID,
      req,
    );

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId_email: { tenantId: TENANT_ID, email: 'alice@example.com' } },
        select: expect.objectContaining({ passwordHash: true }),
      }),
    );
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: mockUserSafe.id,
        email: mockUserSafe.email,
        tenantId: TENANT_ID,
        roleId: mockUserSafe.roleId,
        roleCode: 'OPERATOR',
      }),
      { expiresIn: '60m' },
    );
    expect(result).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
    expect(result).not.toHaveProperty('passwordHash');
    expect(auditServiceMock.logLogin).toHaveBeenCalled();
  });

  it('signup enqueues verify-email with OTP payload containing userId, email, tenantId', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      ...mockUserSafe,
      id: 'user-signup-001',
      email: 'newuser@example.com',
      emailVerified: false,
    });

    let capturedRedisValue: string | undefined;
    redisMock.set.mockImplementation(async (_key: string, value: string) => {
      capturedRedisValue = value;
      return 'OK';
    });

    const result = await controller.signup(
      {
        email: 'newuser@example.com',
        cedula: '99887766',
        documentType: DocumentType.CC,
        password: 'password123',
      },
      TENANT_ID,
    );

    expect(result).toEqual({ accessToken: 'mock-token', refreshToken: 'mock-token' });
    expect(emailServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'newuser@example.com',
        template: expect.objectContaining({ type: 'verify-email' }),
        priority: 'urgent',
      }),
    );
    expect(capturedRedisValue).toBeDefined();
    expect(JSON.parse(capturedRedisValue!)).toMatchObject({
      userId: 'user-signup-001',
      email: 'newuser@example.com',
      tenantId: TENANT_ID,
    });
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });
});
