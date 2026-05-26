// ioredis must be mocked before any import that pulls AuthEmailService, so that
// onModuleInit() does not attempt a real Redis connection even if called.
jest.mock('ioredis');

import { createHash } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../controller/auth.controller';
import { AuthService } from '../service/auth.service';
import { AuthEmailService } from '../service/auth-email.service';
import { AuthRepository } from '../repository/auth.repository';
import { AuthEmailRepository } from '../repository/auth-email.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '@restopsiq/email';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockUser = {
  id: 'user-001',
  email: 'alice@example.com',
  name: 'Alice',
  passwordHash: '$2b$10$Elo.kWNs5.bh93LOaBPH7OtQ23EuF38MBKm4XUL2mH1WnpBhOsXiS', // bcrypt("pass1234")
  refreshToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTokenRecord = {
  id: 'token-001',
  tenantId: 'global',
  userId: 'user-001',
  tokenHash: 'placeholder-hash',
  expiresAt: new Date(Date.now() + 3600 * 1000),
  usedAt: null,
  createdAt: new Date(),
};

// ---------------------------------------------------------------------------
// Module-level mocks (reset in beforeEach)
// ---------------------------------------------------------------------------

const prismaMock = {
  userTestLab: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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

const jwtServiceMock = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
  verifyAsync: jest.fn(),
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

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
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();

    // Inject a controlled Redis mock directly after clearing — avoids relying on
    // onModuleInit() being called (compile() does not trigger lifecycle hooks).
    redisMock = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      quit: jest.fn().mockResolvedValue('OK'),
    };
    const authEmailService = module.get<AuthEmailService>(AuthEmailService);
    (authEmailService as unknown as { redis: typeof redisMock }).redis = redisMock;

    // Default: user not found, emailService resolves, no tokens exist
    prismaMock.userTestLab.findUnique.mockResolvedValue(null);
    prismaMock.userTestLab.update.mockResolvedValue(mockUser);
    prismaMock.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.passwordResetToken.create.mockResolvedValue(mockTokenRecord);
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);
    prismaMock.passwordResetToken.update.mockResolvedValue({
      ...mockTokenRecord,
      usedAt: new Date(),
    });
    emailServiceMock.send.mockResolvedValue({ jobId: 'job-integration-001' });
    jwtServiceMock.signAsync.mockResolvedValue('mock-token');
  });

  // ── Scenario 1 ─────────────────────────────────────────────────────────────
  // POST /auth/forgot-password: returns 200 even when email does not exist

  it('forgot-password returns 200 response even when the email is not registered', async () => {
    prismaMock.userTestLab.findUnique.mockResolvedValue(null);

    const result = await controller.forgotPassword({ email: 'nobody@example.com' });

    expect(result).toEqual({ message: 'If the email exists, a reset link has been sent.' });
    expect(emailServiceMock.send).not.toHaveBeenCalled();
  });

  // ── Scenario 2 ─────────────────────────────────────────────────────────────
  // POST /auth/forgot-password: enqueues the email job in BullMQ (G4 — core gap)

  it('forgot-password enqueues a reset-password email job via EmailService.send', async () => {
    prismaMock.userTestLab.findUnique.mockResolvedValue(mockUser);

    await controller.forgotPassword({ email: 'alice@example.com' });

    expect(emailServiceMock.send).toHaveBeenCalledTimes(1);
    expect(emailServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alice@example.com',
        template: expect.objectContaining({ type: 'reset-password' }),
        priority: 'urgent',
      }),
    );
  });

  // ── Scenario 3 ─────────────────────────────────────────────────────────────
  // POST /auth/reset-password: valid token changes the password

  it('reset-password with a valid token calls user.update (password changed)', async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(mockTokenRecord);

    await controller.resetPassword({ token: 'raw-valid-token', newPassword: 'newpassword123' });

    expect(prismaMock.userTestLab.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockTokenRecord.userId },
        data: expect.objectContaining({ passwordHash: expect.any(String) }),
      }),
    );
  });

  // ── Scenario 4 ─────────────────────────────────────────────────────────────
  // POST /auth/reset-password: token used twice returns 400

  it('reset-password throws BadRequestException when token has already been used', async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      ...mockTokenRecord,
      usedAt: new Date(),
    });

    await expect(
      controller.resetPassword({ token: 'used-token', newPassword: 'newpassword123' }),
    ).rejects.toThrow(BadRequestException);
  });

  // ── Scenario 5 ─────────────────────────────────────────────────────────────
  // POST /auth/reset-password: expired token returns 400

  it('reset-password throws BadRequestException when token is expired', async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      ...mockTokenRecord,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      controller.resetPassword({ token: 'expired-token', newPassword: 'newpassword123' }),
    ).rejects.toThrow(BadRequestException);
  });

  // ── Scenario 6 ─────────────────────────────────────────────────────────────
  // POST /auth/verify-email: valid OTP verifies the email

  it('verify-email with a valid OTP resolves and consumes the OTP from Redis', async () => {
    const otpCode = '847291';
    const otpHash = createHash('sha256').update(otpCode).digest('hex');
    const redisPayload = JSON.stringify({ userId: 'user-001', email: 'alice@example.com' });

    redisMock.get.mockImplementation(async (key: string) => {
      return key === `otp:${otpHash}` ? redisPayload : null;
    });

    const result = await controller.verifyEmail({ otpCode });

    expect(result).toEqual({ message: 'Email verified successfully.' });
    expect(redisMock.del).toHaveBeenCalledWith(`otp:${otpHash}`);
  });

  // ── Scenario 7 ─────────────────────────────────────────────────────────────
  // POST /auth/verify-email: expired/missing OTP returns 400

  it('verify-email throws BadRequestException when OTP is expired or not found', async () => {
    redisMock.get.mockResolvedValue(null);

    await expect(controller.verifyEmail({ otpCode: '000000' })).rejects.toThrow(
      BadRequestException,
    );
  });

  // ── Scenario 8 ─────────────────────────────────────────────────────────────
  // Reset token is stored as SHA-256, not plaintext, in DB

  it('forgot-password stores a SHA-256 tokenHash (not the raw token) in passwordResetToken.create', async () => {
    prismaMock.userTestLab.findUnique.mockResolvedValue(mockUser);

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

    await controller.forgotPassword({ email: 'alice@example.com' });

    expect(capturedTokenHash).toBeDefined();
    expect(capturedResetUrl).toBeDefined();

    // Extract raw token from the reset URL
    const rawToken = new URL(capturedResetUrl!).searchParams.get('token')!;
    const expectedHash = createHash('sha256').update(rawToken).digest('hex');

    expect(capturedTokenHash).toBe(expectedHash);
    expect(capturedTokenHash).not.toBe(rawToken);
    expect(capturedTokenHash).toHaveLength(64); // SHA-256 hex = 64 chars
    expect(capturedTokenHash).toMatch(/^[0-9a-f]{64}$/);
  });
});
