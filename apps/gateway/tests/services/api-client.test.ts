import {
  ApiClient,
  DEFAULT_API_BASE_URL,
  mapApiError,
  parseApiErrorMessage,
  type FetchFn,
} from '../../src/services/api-client';
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  ValidationError,
} from '../../src/utils/errors';

function makeFetchMock(
  impl: (url: string, init?: RequestInit) => Promise<Response>,
): jest.MockedFunction<FetchFn> {
  return jest.fn(impl) as jest.MockedFunction<FetchFn>;
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe('ApiClient', () => {
  describe('base URL', () => {
    it('uses default base URL when none is provided', () => {
      const client = new ApiClient(undefined, jest.fn() as FetchFn);
      expect(client.getBaseUrl()).toBe(DEFAULT_API_BASE_URL);
    });

    it('uses custom API_BASE_URL and strips trailing slash', async () => {
      const fetchMock = makeFetchMock(async () =>
        jsonResponse(200, { accessToken: 'a', refreshToken: 'r' }),
      );
      const client = new ApiClient('http://api.example:3001/', fetchMock);

      await client.authLogin({ email: 'a@b.com', password: 'secret' }, { tenantId: 'tenant-1' });

      expect(client.getBaseUrl()).toBe('http://api.example:3001');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.example:3001/api/auth/login',
        expect.any(Object),
      );
    });
  });

  describe('header forwarding', () => {
    it('forwards x-tenant-id, Authorization, user-agent, and x-forwarded-for', async () => {
      const fetchMock = makeFetchMock(async () =>
        jsonResponse(200, { accessToken: 'a', refreshToken: 'r' }),
      );
      const client = new ApiClient('http://localhost:3001', fetchMock);

      await client.authLogin(
        { email: 'a@b.com', password: 'secret' },
        {
          tenantId: 'palos-de-lena',
          authorization: 'Bearer access-token',
          userAgent: 'jest-test-agent',
          forwardedFor: '10.0.0.1',
        },
      );

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-tenant-id': 'palos-de-lena',
            Authorization: 'Bearer access-token',
            'user-agent': 'jest-test-agent',
            'x-forwarded-for': '10.0.0.1',
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
          body: JSON.stringify({ email: 'a@b.com', password: 'secret' }),
        }),
      );
    });

    it('omits optional headers when not provided', async () => {
      const fetchMock = makeFetchMock(async () => jsonResponse(200, { message: 'ok' }));
      const client = new ApiClient('http://localhost:3001', fetchMock);

      await client.authVerifyEmail({ otpCode: '123456' });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.headers).toEqual(
        expect.objectContaining({
          Accept: 'application/json',
          'Content-Type': 'application/json',
        }),
      );
      expect(init.headers).not.toHaveProperty('x-tenant-id');
      expect(init.headers).not.toHaveProperty('Authorization');
    });

    it('uses GET for mesAuthMe', async () => {
      const fetchMock = makeFetchMock(async () =>
        jsonResponse(200, { id: 'op-1', role: 'OWNER', tenantId: 't-1', sedeId: null }),
      );
      const client = new ApiClient('http://localhost:3001', fetchMock);

      await client.mesAuthMe({ authorization: 'Bearer mes-token' });

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/mes/auth/me',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('uses GET for authMe with Authorization header', async () => {
      const fetchMock = makeFetchMock(async () =>
        jsonResponse(200, {
          id: 'user-1',
          tenantId: 't-1',
          email: 'a@b.com',
          cedula: '12345678',
          documentType: 'CC',
          emailVerified: true,
          isActive: true,
          roleCode: 'OPERATOR',
          createdAt: '2026-06-01T00:00:00.000Z',
        }),
      );
      const client = new ApiClient('http://localhost:3001', fetchMock);

      const profile = await client.authMe({ authorization: 'Bearer global-token' });

      expect(profile.id).toBe('user-1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/me',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Authorization: 'Bearer global-token' }),
        }),
      );
    });
  });

  describe('successful JSON responses', () => {
    it('returns parsed JSON on success', async () => {
      const fetchMock = makeFetchMock(async () =>
        jsonResponse(200, {
          accessToken: 'access',
          refreshToken: 'refresh',
          operator: { id: 'op-1', role: 'OWNER', tenantId: 't-1', sedeId: null },
        }),
      );
      const client = new ApiClient('http://localhost:3001', fetchMock);

      const result = await client.mesAuthLogin(
        { cedula: '12345678', pin: '1234' },
        { tenantId: 't-1' },
      );

      expect(result.accessToken).toBe('access');
      expect(result.operator.id).toBe('op-1');
    });

    it('allows void responses for logout', async () => {
      const fetchMock = makeFetchMock(async () => jsonResponse(200, null));
      const client = new ApiClient('http://localhost:3001', fetchMock);

      await expect(
        client.authLogout({ authorization: 'Bearer access-token' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('auth endpoint paths', () => {
    it('calls expected REST paths for typed auth methods', async () => {
      const fetchMock = makeFetchMock(async () => jsonResponse(200, { message: 'ok' }));
      const client = new ApiClient('http://localhost:3001', fetchMock);
      const ctx = { tenantId: 't-1', authorization: 'Bearer token' };

      await client.authSignup(
        {
          email: 'a@b.com',
          password: 'secret',
          cedula: '123',
          documentType: 'CC',
        },
        ctx,
      );
      await client.authRefresh(ctx);
      await client.authChangePassword(
        { currentPassword: 'OldPass123!', newPassword: 'NewPass123!' },
        ctx,
      );
      await client.mesAuthLogout(ctx);
      await client.authForgotPassword({ email: 'a@b.com' }, ctx);
      await client.authResetPassword({ token: 'raw-token', newPassword: 'NewPass123!' });
      await client.authResendVerification({ email: 'a@b.com' }, ctx);

      const urls = fetchMock.mock.calls.map(([url]) => url);
      expect(urls).toEqual([
        'http://localhost:3001/api/auth/signup',
        'http://localhost:3001/api/auth/refresh',
        'http://localhost:3001/api/auth/change-password',
        'http://localhost:3001/api/mes/auth/logout',
        'http://localhost:3001/api/auth/forgot-password',
        'http://localhost:3001/api/auth/reset-password',
        'http://localhost:3001/api/auth/resend-verification',
      ]);
    });

    it('forgotPassword and resendVerification forward x-tenant-id; resetPassword does not', async () => {
      const fetchMock = makeFetchMock(async () =>
        jsonResponse(200, { message: 'If the email exists, a reset link has been sent.' }),
      );
      const client = new ApiClient('http://localhost:3001', fetchMock);

      await client.authForgotPassword({ email: 'a@b.com' }, { tenantId: 'palos-de-lena' });
      await client.authResetPassword({ token: 't', newPassword: 'NewPass123!' });
      await client.authResendVerification({ email: 'a@b.com' }, { tenantId: 'palos-de-lena' });

      const [, forgotInit] = fetchMock.mock.calls[0] as [string, RequestInit];
      const [, resetInit] = fetchMock.mock.calls[1] as [string, RequestInit];
      const [, resendInit] = fetchMock.mock.calls[2] as [string, RequestInit];

      expect((forgotInit.headers as Record<string, string>)['x-tenant-id']).toBe('palos-de-lena');
      expect(resetInit.headers).not.toHaveProperty('x-tenant-id');
      expect((resendInit.headers as Record<string, string>)['x-tenant-id']).toBe('palos-de-lena');
    });
  });

  describe('error mapping on auth endpoints', () => {
    it('maps 401 from authChangePassword to AuthenticationError', async () => {
      const fetchMock = makeFetchMock(async () =>
        jsonResponse(401, { statusCode: 401, message: 'Invalid credentials' }),
      );
      const client = new ApiClient('http://localhost:3001', fetchMock);

      await expect(
        client.authChangePassword(
          { currentPassword: 'wrong', newPassword: 'NewPass123!' },
          { authorization: 'Bearer access-token' },
        ),
      ).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('maps 400 from authResetPassword to ValidationError', async () => {
      const fetchMock = makeFetchMock(async () =>
        jsonResponse(400, { statusCode: 400, message: 'Invalid or expired reset token' }),
      );
      const client = new ApiClient('http://localhost:3001', fetchMock);

      await expect(
        client.authResetPassword({ token: 'bad', newPassword: 'NewPass123!' }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('maps 401 from mesAuthLogin to AuthenticationError', async () => {
      const fetchMock = makeFetchMock(async () =>
        jsonResponse(401, { statusCode: 401, message: 'Invalid credentials' }),
      );
      const client = new ApiClient('http://localhost:3001', fetchMock);

      await expect(
        client.mesAuthLogin({ cedula: '12345678', pin: '0000' }, { tenantId: 't-1' }),
      ).rejects.toBeInstanceOf(AuthenticationError);
    });
  });
});

describe('parseApiErrorMessage', () => {
  it('extracts string message from NestJS error body', () => {
    expect(
      parseApiErrorMessage({ statusCode: 400, message: 'x-tenant-id header is required' }),
    ).toBe('x-tenant-id header is required');
  });

  it('uses first message when NestJS returns an array', () => {
    expect(
      parseApiErrorMessage({ message: ['email must be an email', 'password too short'] }),
    ).toBe('email must be an email');
  });
});

describe('mapApiError', () => {
  it('maps 400 to ValidationError with BAD_USER_INPUT', () => {
    const error = mapApiError(400, { message: 'Invalid input' });
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.extensions?.code).toBe('BAD_USER_INPUT');
    expect(error.message).toBe('Invalid input');
  });

  it('maps 401 to AuthenticationError with UNAUTHENTICATED', () => {
    const error = mapApiError(401, { message: 'Invalid credentials' });
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('maps 403 to AuthorizationError with FORBIDDEN', () => {
    const error = mapApiError(403, { message: 'Access denied' });
    expect(error).toBeInstanceOf(AuthorizationError);
    expect(error.extensions?.code).toBe('FORBIDDEN');
  });

  it('maps 404 to NOT_FOUND', () => {
    const error = mapApiError(404, { message: 'User not found' });
    expect(error.extensions?.code).toBe('NOT_FOUND');
    expect(error.message).toBe('User not found');
  });

  it('maps 409 to ConflictError with CONFLICT', () => {
    const error = mapApiError(409, { message: 'Email already registered' });
    expect(error).toBeInstanceOf(ConflictError);
    expect(error.extensions?.code).toBe('CONFLICT');
  });

  it('maps 500 to INTERNAL_SERVER_ERROR without leaking response details', () => {
    const error = mapApiError(500, {
      message: 'DB connection failed',
      stack: 'Error: DB connection failed\n    at SecretModule',
    });

    expect(error.extensions?.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.message).toBe('Internal server error');
    expect(error.message).not.toContain('DB connection');
    expect(JSON.stringify(error.extensions)).not.toContain('stack');
  });

  it('does not attach stack traces to thrown GraphQL errors from client failures', async () => {
    const fetchMock = makeFetchMock(async () =>
      jsonResponse(500, {
        statusCode: 500,
        message: 'Unexpected failure',
        stack: 'secret stack trace',
      }),
    );
    const client = new ApiClient('http://localhost:3001', fetchMock);

    await expect(
      client.authLogin({ email: 'a@b.com', password: 'x' }, { tenantId: 't-1' }),
    ).rejects.toMatchObject({
      message: 'Internal server error',
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  });
});
