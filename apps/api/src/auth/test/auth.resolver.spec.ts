import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from '../resolver/auth.resolver';
import { AuthService } from '../service/auth.service';
import { AuthEmailService } from '../service/auth-email.service';

const tenantId = 'palos-de-lena';

const gqlContext = {
  req: {
    headers: {
      'x-tenant-id': tenantId,
      'x-forwarded-for': '203.0.113.10',
      'user-agent': 'jest-graphql',
    },
  },
};

const authServiceMock = {
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
};

describe('AuthResolver', () => {
  let resolver: AuthResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        { provide: AuthService, useValue: authServiceMock },
        { provide: AuthEmailService, useValue: authEmailServiceMock },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    jest.clearAllMocks();
  });

  it('delegates login to AuthService using x-tenant-id from context', async () => {
    authServiceMock.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    const result = await resolver.login(gqlContext, {
      email: 'test@example.com',
      password: 'secret',
    });

    expect(result).toEqual({ accessToken: 'a', refreshToken: 'r' });
    expect(authServiceMock.login).toHaveBeenCalledWith(
      tenantId,
      {
        email: 'test@example.com',
        password: 'secret',
      },
      '203.0.113.10',
      'jest-graphql',
    );
  });

  it('delegates refreshToken with IP and user-agent from context', async () => {
    authServiceMock.refresh.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    await resolver.refreshToken(gqlContext, {
      sub: 'user-1',
      email: 'test@example.com',
      tenantId,
      roleId: 'role-1',
      roleCode: 'OPERATOR',
      refreshToken: 'raw-refresh',
    });

    expect(authServiceMock.refresh).toHaveBeenCalledWith(
      'user-1',
      'raw-refresh',
      '203.0.113.10',
      'jest-graphql',
    );
  });

  it('delegates logout with IP and user-agent from context', async () => {
    authServiceMock.logout.mockResolvedValue(undefined);

    await resolver.logout(gqlContext, {
      sub: 'user-1',
      email: 'test@example.com',
      tenantId,
      roleId: 'role-1',
      roleCode: 'OPERATOR',
    });

    expect(authServiceMock.logout).toHaveBeenCalledWith('user-1', '203.0.113.10', 'jest-graphql');
  });

  it('returns the authenticated user profile for me', async () => {
    authServiceMock.me.mockResolvedValue({ id: 'user-1', tenantId, email: 'test@example.com' });

    const result = await resolver.me({
      sub: 'user-1',
      email: 'test@example.com',
      tenantId: tenantId,
      roleId: 'role-1',
      roleCode: 'OPERATOR',
    });

    expect(result).toEqual({ id: 'user-1', tenantId, email: 'test@example.com' });
    expect(authServiceMock.me).toHaveBeenCalledWith('user-1');
  });

  it('requests a reset email for forgotPassword with tenant from context', async () => {
    authEmailServiceMock.sendResetPassword.mockResolvedValue(undefined);

    const result = await resolver.forgotPassword(gqlContext, { email: 'test@example.com' });

    expect(result).toEqual({ message: 'If the email exists, a reset link has been sent.' });
    expect(authEmailServiceMock.sendResetPassword).toHaveBeenCalledWith(
      'test@example.com',
      expect.objectContaining({ tenantId, tenantName: tenantId }),
    );
  });

  it('returns true from logout even when AuthService throws', async () => {
    authServiceMock.logout.mockRejectedValue(new Error('already logged out'));

    await expect(
      resolver.logout(gqlContext, {
        sub: 'user-1',
        email: 'test@example.com',
        tenantId,
        roleId: 'role-1',
        roleCode: 'OPERATOR',
      }),
    ).resolves.toBe(true);
  });
});
