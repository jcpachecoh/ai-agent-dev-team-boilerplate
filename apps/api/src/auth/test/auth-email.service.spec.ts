import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthEmailService } from '../service/auth-email.service';
import { AuthRepository } from '../repository/auth.repository';
import { AuthEmailRepository } from '../repository/auth-email.repository';
import { EmailService } from '@restopsiq/email';
import type { TenantContext } from '../interfaces/auth.interfaces';
import Redis from 'ioredis';

jest.mock('ioredis', () => {
  const MockRedis = jest.fn().mockImplementation(() => ({
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
  }));
  return MockRedis;
});

const MockRedis = Redis as unknown as jest.Mock;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockUser = {
  id: 'user-001',
  email: 'alice@example.com',
  name: 'Alice',
  passwordHash: 'hashed',
  refreshToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTenant: TenantContext = {
  tenantId: 'tenant-abc',
  tenantName: 'Restaurante Demo',
  tenantLogoUrl: undefined,
  primaryColor: '#E8943A',
};

const mockToken = {
  id: 'token-001',
  tenantId: 'tenant-abc',
  userId: 'user-001',
  tokenHash: 'sha256hash',
  expiresAt: new Date(Date.now() + 3600 * 1000),
  usedAt: null,
  createdAt: new Date(),
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const authRepoMock = {
  findByEmail: jest.fn(),
};

const authEmailRepoMock = {
  deleteExpiredResetTokens: jest.fn(),
  createResetToken: jest.fn(),
};

const emailServiceMock = {
  send: jest.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthEmailService — sendResetPassword', () => {
  let service: AuthEmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthEmailService,
        { provide: AuthRepository, useValue: authRepoMock },
        { provide: AuthEmailRepository, useValue: authEmailRepoMock },
        { provide: EmailService, useValue: emailServiceMock },
      ],
    }).compile();

    service = module.get<AuthEmailService>(AuthEmailService);
    jest.clearAllMocks();

    // Default happy-path setup
    authRepoMock.findByEmail.mockResolvedValue(mockUser);
    authEmailRepoMock.deleteExpiredResetTokens.mockResolvedValue(undefined);
    authEmailRepoMock.createResetToken.mockResolvedValue(mockToken);
    emailServiceMock.send.mockResolvedValue({ jobId: 'job-001' });
  });

  it('returns void and calls emailService.send when user exists', async () => {
    const result = await service.sendResetPassword('alice@example.com', mockTenant);
    expect(result).toBeUndefined();
    expect(emailServiceMock.send).toHaveBeenCalledTimes(1);
  });

  it('returns void silently when user does not exist (no throw)', async () => {
    authRepoMock.findByEmail.mockResolvedValue(null);
    const result = await service.sendResetPassword('nobody@example.com', mockTenant);
    expect(result).toBeUndefined();
    expect(emailServiceMock.send).not.toHaveBeenCalled();
  });

  it('calls deleteExpiredResetTokens before creating token', async () => {
    const callOrder: string[] = [];
    authEmailRepoMock.deleteExpiredResetTokens.mockImplementation(async () => {
      callOrder.push('delete');
    });
    authEmailRepoMock.createResetToken.mockImplementation(async () => {
      callOrder.push('create');
      return mockToken;
    });

    await service.sendResetPassword('alice@example.com', mockTenant);

    expect(callOrder).toEqual(['delete', 'create']);
  });

  it('stores SHA-256 tokenHash, not the plaintext token', async () => {
    let capturedTokenHash: string | undefined;
    let capturedResetUrl: string | undefined;

    authEmailRepoMock.createResetToken.mockImplementation(async (data) => {
      capturedTokenHash = data.tokenHash;
      return mockToken;
    });
    emailServiceMock.send.mockImplementation(async (opts) => {
      capturedResetUrl = opts.template.props.resetUrl;
      return { jobId: 'ok' };
    });

    await service.sendResetPassword('alice@example.com', mockTenant);

    // Extract raw token from the resetUrl
    const rawToken = new URL(capturedResetUrl!).searchParams.get('token')!;
    const expectedHash = createHash('sha256').update(rawToken).digest('hex');

    expect(capturedTokenHash).toBe(expectedHash);
    expect(capturedTokenHash).not.toBe(rawToken);
    expect(capturedTokenHash).toHaveLength(64); // SHA-256 hex = 64 chars
  });

  it('sets expiresAt approximately 1 hour in the future', async () => {
    let capturedExpiresAt: Date | undefined;
    authEmailRepoMock.createResetToken.mockImplementation(async (data) => {
      capturedExpiresAt = data.expiresAt;
      return mockToken;
    });

    const before = Date.now();
    await service.sendResetPassword('alice@example.com', mockTenant);
    const after = Date.now();

    expect(capturedExpiresAt).toBeDefined();
    const expiresMs = capturedExpiresAt!.getTime();
    expect(expiresMs).toBeGreaterThanOrEqual(before + 3600 * 1000 - 50);
    expect(expiresMs).toBeLessThanOrEqual(after + 3600 * 1000 + 50);
  });

  it('calls emailService.send with priority: urgent', async () => {
    await service.sendResetPassword('alice@example.com', mockTenant);
    expect(emailServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'urgent' }),
    );
  });

  it('calls emailService.send with reset-password template type', async () => {
    await service.sendResetPassword('alice@example.com', mockTenant);
    expect(emailServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        template: expect.objectContaining({ type: 'reset-password' }),
      }),
    );
  });

  it('includes the raw token in the resetUrl (not the hash)', async () => {
    let capturedTokenHash: string | undefined;
    let capturedResetUrl: string | undefined;

    authEmailRepoMock.createResetToken.mockImplementation(async (data) => {
      capturedTokenHash = data.tokenHash;
      return mockToken;
    });
    emailServiceMock.send.mockImplementation(async (opts) => {
      capturedResetUrl = opts.template.props.resetUrl;
      return { jobId: 'ok' };
    });

    await service.sendResetPassword('alice@example.com', mockTenant);

    // The resetUrl must contain the raw token parameter
    expect(capturedResetUrl).toContain('token=');
    const rawToken = new URL(capturedResetUrl!).searchParams.get('token')!;

    // raw token must be 64-char hex (32 random bytes)
    expect(rawToken).toMatch(/^[0-9a-f]{64}$/);
    // raw token must NOT be the stored hash
    expect(rawToken).not.toBe(capturedTokenHash);
  });

  it('passes userName, resetUrl, expiresAt, and ipAddress in template props', async () => {
    await service.sendResetPassword('alice@example.com', mockTenant, '192.168.1.1');

    const [sendCall] = emailServiceMock.send.mock.calls;
    const props = sendCall[0].template.props;
    expect(props).toMatchObject({
      userName: mockUser.name,
      resetUrl: expect.stringContaining('token='),
      expiresAt: expect.any(String),
      ipAddress: '192.168.1.1',
    });
  });

  it('does not throw when emailService.send resolves', async () => {
    emailServiceMock.send.mockResolvedValue({ jobId: 'ok' });
    await expect(
      service.sendResetPassword('alice@example.com', mockTenant),
    ).resolves.toBeUndefined();
  });

  it('uses email as userName fallback when user.name is null', async () => {
    authRepoMock.findByEmail.mockResolvedValue({ ...mockUser, name: null });

    await service.sendResetPassword('alice@example.com', mockTenant);

    const [sendCall] = emailServiceMock.send.mock.calls;
    expect(sendCall[0].template.props.userName).toBe('alice@example.com');
  });

  it('propagates error when authEmailRepository.createResetToken rejects', async () => {
    authEmailRepoMock.createResetToken.mockRejectedValue(new Error('DB write failed'));
    await expect(service.sendResetPassword('alice@example.com', mockTenant)).rejects.toThrow(
      'DB write failed',
    );
  });
});

// ---------------------------------------------------------------------------
// sendVerifyEmail & verifyOtp
// ---------------------------------------------------------------------------

describe('AuthEmailService — sendVerifyEmail & verifyOtp', () => {
  let service: AuthEmailService;

  const mockVerifyUser = {
    id: 'user-002',
    email: 'bob@example.com',
    name: 'Bob',
  };

  const mockVerifyTenant: TenantContext = {
    tenantId: 'tenant-xyz',
    tenantName: 'Bistro Demo',
    primaryColor: '#3B82F6',
  };

  const redisMock = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthEmailService,
        { provide: AuthRepository, useValue: { findByEmail: jest.fn() } },
        {
          provide: AuthEmailRepository,
          useValue: { deleteExpiredResetTokens: jest.fn(), createResetToken: jest.fn() },
        },
        { provide: EmailService, useValue: emailServiceMock },
      ],
    }).compile();

    service = module.get<AuthEmailService>(AuthEmailService);
    // Inject mock Redis directly instead of initialising a real connection
    (service as any)['redis'] = redisMock;
    jest.clearAllMocks();

    redisMock.set.mockResolvedValue('OK');
    redisMock.get.mockResolvedValue(null);
    redisMock.del.mockResolvedValue(1);
    emailServiceMock.send.mockResolvedValue({ jobId: 'job-otp-001' });
  });

  describe('sendVerifyEmail', () => {
    it('stores OTP under a SHA-256 hash-based Redis key (not otp:{userId}) with TTL 900s', async () => {
      const result = await service.sendVerifyEmail(mockVerifyUser, mockVerifyTenant);

      const expectedHash = createHash('sha256').update(result.otpCode).digest('hex');
      expect(redisMock.set).toHaveBeenCalledWith(
        `otp:${expectedHash}`,
        expect.any(String),
        'EX',
        900,
      );
    });

    it('does NOT use otp:{userId} as the Redis key', async () => {
      await service.sendVerifyEmail(mockVerifyUser, mockVerifyTenant);

      const [setCall] = redisMock.set.mock.calls;
      const key: string = setCall[0];
      expect(key).not.toBe(`otp:${mockVerifyUser.id}`);
    });

    it('stores userId in the Redis value for context', async () => {
      await service.sendVerifyEmail(mockVerifyUser, mockVerifyTenant);

      const [setCall] = redisMock.set.mock.calls;
      const value: string = setCall[1];
      expect(JSON.parse(value)).toMatchObject({ userId: mockVerifyUser.id });
    });

    it('returns the generated otpCode', async () => {
      const result = await service.sendVerifyEmail(mockVerifyUser, mockVerifyTenant);
      expect(result).toHaveProperty('otpCode');
      expect(typeof result.otpCode).toBe('string');
    });

    it('generates a 6-digit numeric OTP', async () => {
      const result = await service.sendVerifyEmail(mockVerifyUser, mockVerifyTenant);
      expect(result.otpCode).toMatch(/^\d{6}$/);
    });

    it('calls emailService.send with type verify-email and priority urgent', async () => {
      await service.sendVerifyEmail(mockVerifyUser, mockVerifyTenant);

      expect(emailServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'urgent',
          template: expect.objectContaining({ type: 'verify-email' }),
        }),
      );
    });

    it('sends to the correct email address', async () => {
      await service.sendVerifyEmail(mockVerifyUser, mockVerifyTenant);

      expect(emailServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: mockVerifyUser.email }),
      );
    });

    it('includes userName, otpCode, and expiresInMinutes in template props', async () => {
      const result = await service.sendVerifyEmail(mockVerifyUser, mockVerifyTenant);

      const [sendCall] = emailServiceMock.send.mock.calls;
      const props = sendCall[0].template.props;
      expect(props).toMatchObject({
        userName: mockVerifyUser.name,
        otpCode: result.otpCode,
        expiresInMinutes: 15,
      });
    });

    it('does not call authEmailRepository (OTP is Redis-only, not DB)', async () => {
      const authEmailRepoMockLocal = {
        createResetToken: jest.fn(),
        deleteExpiredResetTokens: jest.fn(),
      };
      const module = await Test.createTestingModule({
        providers: [
          AuthEmailService,
          { provide: AuthRepository, useValue: { findByEmail: jest.fn() } },
          { provide: AuthEmailRepository, useValue: authEmailRepoMockLocal },
          { provide: EmailService, useValue: emailServiceMock },
        ],
      }).compile();
      const svc = module.get<AuthEmailService>(AuthEmailService);
      (svc as any)['redis'] = redisMock;

      await svc.sendVerifyEmail(mockVerifyUser, mockVerifyTenant);

      expect(authEmailRepoMockLocal.createResetToken).not.toHaveBeenCalled();
      expect(authEmailRepoMockLocal.deleteExpiredResetTokens).not.toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    const validOtp = '847291';

    it('calls redis.del on success using the hash-based key', async () => {
      const otpHash = createHash('sha256').update(validOtp).digest('hex');
      redisMock.get.mockResolvedValue(JSON.stringify({ userId: mockVerifyUser.id }));

      await service.verifyOtp(validOtp);

      expect(redisMock.del).toHaveBeenCalledWith(`otp:${otpHash}`);
    });

    it('does not require userId as an argument', async () => {
      redisMock.get.mockResolvedValue(JSON.stringify({ userId: mockVerifyUser.id }));
      // verifyOtp takes only otpCode — if it compiled and ran, the signature is correct
      await expect(service.verifyOtp(validOtp)).resolves.toBeUndefined();
    });

    it('throws BadRequestException when OTP hash key is not found in Redis', async () => {
      redisMock.get.mockResolvedValue(null);

      await expect(service.verifyOtp(validOtp)).rejects.toMatchObject({ status: 400 });
    });

    it('does not call redis.del when OTP is not found', async () => {
      redisMock.get.mockResolvedValue(null);

      await expect(service.verifyOtp(validOtp)).rejects.toThrow();

      expect(redisMock.del).not.toHaveBeenCalled();
    });

    it('OTP is single-use: redis.del called exactly once on success', async () => {
      redisMock.get.mockResolvedValue(JSON.stringify({ userId: mockVerifyUser.id }));

      await service.verifyOtp(validOtp);

      expect(redisMock.del).toHaveBeenCalledTimes(1);
    });
  });
});

// ---------------------------------------------------------------------------
// sendWelcome & sendInvitation
// ---------------------------------------------------------------------------

describe('AuthEmailService — sendWelcome & sendInvitation', () => {
  let service: AuthEmailService;

  const mockWelcomeTenant: TenantContext = {
    tenantId: 'tenant-welcome',
    tenantName: 'Panadería Demo',
    tenantLogoUrl: 'https://example.com/logo.png',
    primaryColor: '#F59E0B',
  };

  const redisMock = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthEmailService,
        { provide: AuthRepository, useValue: { findByEmail: jest.fn() } },
        {
          provide: AuthEmailRepository,
          useValue: { deleteExpiredResetTokens: jest.fn(), createResetToken: jest.fn() },
        },
        { provide: EmailService, useValue: emailServiceMock },
      ],
    }).compile();

    service = module.get<AuthEmailService>(AuthEmailService);
    (service as any)['redis'] = redisMock;
    jest.clearAllMocks();

    redisMock.set.mockResolvedValue('OK');
    emailServiceMock.send.mockResolvedValue({ jobId: 'job-welcome-001' });
  });

  // -------------------------------------------------------------------------
  // sendWelcome
  // -------------------------------------------------------------------------

  describe('sendWelcome', () => {
    const welcomeUser = { email: 'maria@example.com', name: 'María García', role: 'owner' };

    it('calls emailService.send with type welcome', async () => {
      await service.sendWelcome(welcomeUser, mockWelcomeTenant);

      expect(emailServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          template: expect.objectContaining({ type: 'welcome' }),
        }),
      );
    });

    it('passes userName, role, and loginUrl in template props', async () => {
      await service.sendWelcome(welcomeUser, mockWelcomeTenant);

      const [sendCall] = emailServiceMock.send.mock.calls;
      const props = sendCall[0].template.props;
      expect(props).toMatchObject({
        userName: welcomeUser.name,
        role: welcomeUser.role,
        loginUrl: expect.stringContaining('/login'),
      });
    });

    it('passes temporaryPassword in template props when provided', async () => {
      await service.sendWelcome(welcomeUser, mockWelcomeTenant, 'Temp@1234');

      const [sendCall] = emailServiceMock.send.mock.calls;
      expect(sendCall[0].template.props.temporaryPassword).toBe('Temp@1234');
    });

    it('does not pass temporaryPassword when not provided', async () => {
      await service.sendWelcome(welcomeUser, mockWelcomeTenant);

      const [sendCall] = emailServiceMock.send.mock.calls;
      expect(sendCall[0].template.props.temporaryPassword).toBeUndefined();
    });

    it('uses tenant branding fields (tenantName, tenantLogoUrl, primaryColor)', async () => {
      await service.sendWelcome(welcomeUser, mockWelcomeTenant);

      expect(emailServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockWelcomeTenant.tenantId,
          tenantName: mockWelcomeTenant.tenantName,
          tenantLogoUrl: mockWelcomeTenant.tenantLogoUrl,
          primaryColor: mockWelcomeTenant.primaryColor,
        }),
      );
    });

    it('sends to the correct email address', async () => {
      await service.sendWelcome(welcomeUser, mockWelcomeTenant);

      expect(emailServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: welcomeUser.email }),
      );
    });

    it('does not use Redis (welcome has no token)', async () => {
      await service.sendWelcome(welcomeUser, mockWelcomeTenant);

      expect(redisMock.set).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // sendInvitation
  // -------------------------------------------------------------------------

  describe('sendInvitation', () => {
    const invitee = { email: 'carlos@example.com', name: 'Carlos Mendoza' };
    const inviter = { name: 'Ana García' };
    const role = 'manager';
    const workspaceName = 'Restaurante Demo';

    it('stores invite token in Redis with key invite:{token} and TTL 172800s', async () => {
      await service.sendInvitation(invitee, inviter, mockWelcomeTenant, role, workspaceName);

      expect(redisMock.set).toHaveBeenCalledWith(
        expect.stringMatching(/^invite:[0-9a-f]{64}$/),
        invitee.email,
        'EX',
        172800,
      );
    });

    it('calls emailService.send with type invite-user', async () => {
      await service.sendInvitation(invitee, inviter, mockWelcomeTenant, role, workspaceName);

      expect(emailServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          template: expect.objectContaining({ type: 'invite-user' }),
        }),
      );
    });

    it('passes inviteeName, inviterName, role, workspaceName, acceptUrl and expiresAt', async () => {
      await service.sendInvitation(invitee, inviter, mockWelcomeTenant, role, workspaceName);

      const [sendCall] = emailServiceMock.send.mock.calls;
      const props = sendCall[0].template.props;
      expect(props).toMatchObject({
        inviteeName: invitee.name,
        inviterName: inviter.name,
        role,
        workspaceName,
        acceptUrl: expect.stringContaining('accept-invite?token='),
        expiresAt: expect.any(String),
      });
    });

    it('sends to the correct invitee email', async () => {
      await service.sendInvitation(invitee, inviter, mockWelcomeTenant, role, workspaceName);

      expect(emailServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: invitee.email }),
      );
    });

    it('does not call Resend directly (all sending via emailService.send)', async () => {
      await service.sendInvitation(invitee, inviter, mockWelcomeTenant, role, workspaceName);

      // emailService.send was called, not a direct HTTP client
      expect(emailServiceMock.send).toHaveBeenCalledTimes(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

describe('AuthEmailService — lifecycle hooks', () => {
  let service: AuthEmailService;

  beforeEach(async () => {
    MockRedis.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthEmailService,
        { provide: AuthRepository, useValue: { findByEmail: jest.fn() } },
        {
          provide: AuthEmailRepository,
          useValue: { deleteExpiredResetTokens: jest.fn(), createResetToken: jest.fn() },
        },
        { provide: EmailService, useValue: { send: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthEmailService>(AuthEmailService);
  });

  describe('onModuleInit', () => {
    it('creates Redis with the REDIS_URL env var when set', () => {
      const original = process.env.REDIS_URL;
      process.env.REDIS_URL = 'redis://custom-host:6380';

      service.onModuleInit();

      expect(MockRedis).toHaveBeenCalledWith('redis://custom-host:6380');

      process.env.REDIS_URL = original;
    });

    it('falls back to default redis://localhost:6379 when REDIS_URL is not set', () => {
      const original = process.env.REDIS_URL;
      delete process.env.REDIS_URL;

      service.onModuleInit();

      expect(MockRedis).toHaveBeenCalledWith('redis://localhost:6379');

      if (original !== undefined) process.env.REDIS_URL = original;
    });
  });

  describe('onModuleDestroy', () => {
    it('calls redis.quit exactly once', async () => {
      const quitMock = jest.fn().mockResolvedValue('OK');
      (service as any)['redis'] = { quit: quitMock };

      await service.onModuleDestroy();

      expect(quitMock).toHaveBeenCalledTimes(1);
    });
  });
});
