/**
 * AUTH-02 integration-style tests: resolver → ApiClient → mocked fetch (URL, method, headers).
 */

import type { Request } from 'express';
import type { GraphQLContext } from '../../src/context/types';
import { AuthenticationError, ValidationError } from '../../src/utils/errors';
import { ApiClient, type FetchFn } from '../../src/services/api-client';
import {
  resolveForgotPassword,
  resolveGlobalLogin,
  resolveResendVerification,
  resolveResetPassword,
} from '../../src/schema/auth/global-auth.mutation';
import { resolveGlobalMe } from '../../src/schema/auth/global-auth.query';
import { resolveOperationalLogin } from '../../src/schema/auth/operational-auth.mutation';
import { resolveOperationalMe } from '../../src/schema/auth/operational-auth.query';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

function makeFetchMock(
  handler: (url: string, init?: RequestInit) => Promise<Response>,
): jest.MockedFunction<FetchFn> {
  return jest.fn(handler) as jest.MockedFunction<FetchFn>;
}

function makeRequest(headers: Record<string, string | undefined> = {}): Request {
  return {
    headers,
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Request;
}

function makeContext(
  request: Request,
  api: ApiClient,
  authKind: GraphQLContext['authKind'] = null,
): GraphQLContext {
  return {
    request,
    ip: '10.0.0.1',
    authKind,
    globalUser: authKind === 'global' ? { id: 'user-1', email: 'a@b.com' } : null,
    operationalUser:
      authKind === 'operational' ? { id: 'op-1', tenantId: 'palos-de-lena', role: 'OWNER' } : null,
    user:
      authKind === 'operational' ? { id: 'op-1', tenantId: 'palos-de-lena', role: 'OWNER' } : null,
    tenantId: authKind === 'operational' ? 'palos-de-lena' : null,
    isAuthenticated: authKind !== null,
    isGlobalAuthenticated: authKind === 'global',
    isOperationalAuthenticated: authKind === 'operational',
    services: { api },
  } as unknown as GraphQLContext;
}

describe('AUTH-02 resolver → ApiClient delegation (mocked fetch)', () => {
  describe('global login → me', () => {
    it('calls POST /api/auth/login then GET /api/auth/me with forwarded headers', async () => {
      const fetchMock = makeFetchMock(async (url, init) => {
        if (url.endsWith('/api/auth/login')) {
          return jsonResponse(200, {
            accessToken: 'global-access',
            refreshToken: 'global-refresh',
          });
        }
        if (url.endsWith('/api/auth/me')) {
          return jsonResponse(200, {
            id: 'user-1',
            tenantId: 'palos-de-lena',
            email: 'user@example.com',
            cedula: '12345678',
            documentType: 'CC',
            emailVerified: true,
            isActive: true,
            roleCode: 'OPERATOR',
            createdAt: '2026-06-01T12:00:00.000Z',
          });
        }
        return jsonResponse(404, { message: 'Not found' });
      });

      const api = new ApiClient('http://localhost:3001', fetchMock);
      const loginRequest = makeRequest({
        'x-tenant-id': 'palos-de-lena',
        'user-agent': 'integration-test',
      });
      const loginCtx = makeContext(loginRequest, api);

      const tokens = await resolveGlobalLogin(
        null,
        { input: { email: 'user@example.com', password: 'TestPass123!' } },
        loginCtx,
      );

      expect(tokens).toEqual({
        accessToken: 'global-access',
        refreshToken: 'global-refresh',
      });

      const meRequest = makeRequest({
        authorization: 'Bearer global-access',
        'user-agent': 'integration-test',
      });
      const meCtx = makeContext(meRequest, api, 'global');

      const profile = await resolveGlobalMe(null, {}, meCtx);

      expect(profile.email).toBe('user@example.com');
      expect(profile.roleCode).toBe('OPERATOR');

      expect(fetchMock).toHaveBeenCalledTimes(2);

      const [loginUrl, loginInit] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(loginUrl).toBe('http://localhost:3001/api/auth/login');
      expect(loginInit.method).toBe('POST');
      expect(loginInit.headers).toEqual(
        expect.objectContaining({
          'x-tenant-id': 'palos-de-lena',
          'user-agent': 'integration-test',
          'x-forwarded-for': '10.0.0.1',
        }),
      );
      expect(JSON.parse(String(loginInit.body))).toEqual({
        email: 'user@example.com',
        password: 'TestPass123!',
      });

      const [meUrl, meInit] = fetchMock.mock.calls[1] as [string, RequestInit];
      expect(meUrl).toBe('http://localhost:3001/api/auth/me');
      expect(meInit.method).toBe('GET');
      expect(meInit.headers).toEqual(
        expect.objectContaining({
          Authorization: 'Bearer global-access',
          'user-agent': 'integration-test',
        }),
      );
    });

    it('maps API 401 from login to AuthenticationError', async () => {
      const fetchMock = makeFetchMock(async () =>
        jsonResponse(401, { statusCode: 401, message: 'Invalid credentials' }),
      );
      const api = new ApiClient('http://localhost:3001', fetchMock);
      const ctx = makeContext(makeRequest({ 'x-tenant-id': 'palos-de-lena' }), api);

      await expect(
        resolveGlobalLogin(null, { input: { email: 'bad@example.com', password: 'wrong' } }, ctx),
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('operational loginOperational → meOperational', () => {
    it('calls POST /api/mes/auth/login then GET /api/mes/auth/me', async () => {
      const fetchMock = makeFetchMock(async (url, init) => {
        if (url.endsWith('/api/mes/auth/login')) {
          return jsonResponse(200, {
            accessToken: 'mes-access',
            refreshToken: 'mes-refresh',
            operator: {
              id: 'op-1',
              role: 'OWNER',
              tenantId: 'palos-de-lena',
              sedeId: null,
            },
          });
        }
        if (url.endsWith('/api/mes/auth/me')) {
          return jsonResponse(200, {
            id: 'op-1',
            role: 'OWNER',
            tenantId: 'palos-de-lena',
            sedeId: null,
          });
        }
        return jsonResponse(404, { message: 'Not found' });
      });

      const api = new ApiClient('http://localhost:3001', fetchMock);
      const loginRequest = makeRequest({
        'x-tenant-id': 'palos-de-lena',
        'user-agent': 'integration-test',
      });
      const loginCtx = makeContext(loginRequest, api);

      const tokens = await resolveOperationalLogin(
        null,
        { input: { cedula: '12345678', pin: '1234' } },
        loginCtx,
      );

      expect(tokens.accessToken).toBe('mes-access');
      expect(tokens.operator.id).toBe('op-1');

      const meRequest = makeRequest({
        authorization: 'Bearer mes-access',
        'user-agent': 'integration-test',
      });
      const meCtx = makeContext(meRequest, api, 'operational');

      const profile = await resolveOperationalMe(null, {}, meCtx);

      expect(profile).toEqual({
        id: 'op-1',
        role: 'OWNER',
        tenantId: 'palos-de-lena',
        sedeId: null,
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);

      const [loginUrl, loginInit] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(loginUrl).toBe('http://localhost:3001/api/mes/auth/login');
      expect(loginInit.method).toBe('POST');
      expect(loginInit.headers).toEqual(
        expect.objectContaining({
          'x-tenant-id': 'palos-de-lena',
          'x-forwarded-for': '10.0.0.1',
        }),
      );
      expect(JSON.parse(String(loginInit.body))).toEqual({ cedula: '12345678', pin: '1234' });

      const [meUrl, meInit] = fetchMock.mock.calls[1] as [string, RequestInit];
      expect(meUrl).toBe('http://localhost:3001/api/mes/auth/me');
      expect(meInit.method).toBe('GET');
      expect(meInit.headers).toEqual(
        expect.objectContaining({ Authorization: 'Bearer mes-access' }),
      );
    });

    it('maps API 401 from mes login to AuthenticationError', async () => {
      const fetchMock = makeFetchMock(async () =>
        jsonResponse(401, { statusCode: 401, message: 'Invalid credentials' }),
      );
      const api = new ApiClient('http://localhost:3001', fetchMock);
      const ctx = makeContext(makeRequest({ 'x-tenant-id': 'palos-de-lena' }), api);

      await expect(
        resolveOperationalLogin(null, { input: { cedula: '12345678', pin: '0000' } }, ctx),
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('global email auth mutations', () => {
    it('forgotPassword calls POST /api/auth/forgot-password with x-tenant-id', async () => {
      const fetchMock = makeFetchMock(async (url, init) => {
        if (url.endsWith('/api/auth/forgot-password')) {
          return jsonResponse(200, {
            message: 'If the email exists, a reset link has been sent.',
          });
        }
        return jsonResponse(404, { message: 'Not found' });
      });

      const api = new ApiClient('http://localhost:3001', fetchMock);
      const ctx = makeContext(
        makeRequest({ 'x-tenant-id': 'palos-de-lena', 'user-agent': 'integration-test' }),
        api,
      );

      const result = await resolveForgotPassword(
        null,
        { input: { email: 'mes-owner@palos-de-lena.dev' } },
        ctx,
      );

      expect(result.message).toContain('reset link');
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:3001/api/auth/forgot-password');
      expect(init.headers).toEqual(expect.objectContaining({ 'x-tenant-id': 'palos-de-lena' }));
      expect(JSON.parse(String(init.body))).toEqual({ email: 'mes-owner@palos-de-lena.dev' });
    });

    it('resetPassword calls POST /api/auth/reset-password without x-tenant-id', async () => {
      const fetchMock = makeFetchMock(async (url, init) => {
        if (url.endsWith('/api/auth/reset-password')) {
          return jsonResponse(200, { message: 'Password updated successfully.' });
        }
        return jsonResponse(404, { message: 'Not found' });
      });

      const api = new ApiClient('http://localhost:3001', fetchMock);
      const ctx = makeContext(makeRequest({ 'x-tenant-id': 'palos-de-lena' }), api);

      const result = await resolveResetPassword(
        null,
        { input: { token: 'raw-token', newPassword: 'NewPass123!' } },
        ctx,
      );

      expect(result.message).toBe('Password updated successfully.');
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:3001/api/auth/reset-password');
      expect(init.headers).not.toHaveProperty('x-tenant-id');
      expect(JSON.parse(String(init.body))).toEqual({
        token: 'raw-token',
        newPassword: 'NewPass123!',
      });
    });

    it('resendVerification calls POST /api/auth/resend-verification with x-tenant-id', async () => {
      const fetchMock = makeFetchMock(async (url) => {
        if (url.endsWith('/api/auth/resend-verification')) {
          return jsonResponse(200, {
            message: 'If the email exists, a verification code has been sent.',
          });
        }
        return jsonResponse(404, { message: 'Not found' });
      });

      const api = new ApiClient('http://localhost:3001', fetchMock);
      const ctx = makeContext(makeRequest({ 'x-tenant-id': 'palos-de-lena' }), api);

      const result = await resolveResendVerification(
        null,
        { input: { email: 'mes-owner@palos-de-lena.dev' } },
        ctx,
      );

      expect(result.message).toContain('verification code');
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        'http://localhost:3001/api/auth/resend-verification',
      );
    });

    it('maps API 400 from resetPassword to ValidationError', async () => {
      const fetchMock = makeFetchMock(async () =>
        jsonResponse(400, { statusCode: 400, message: 'Invalid or expired reset token' }),
      );
      const api = new ApiClient('http://localhost:3001', fetchMock);
      const ctx = makeContext(makeRequest(), api);

      await expect(
        resolveResetPassword(null, { input: { token: 'bad', newPassword: 'NewPass123!' } }, ctx),
      ).rejects.toThrow(ValidationError);
    });

    it('requires x-tenant-id for forgotPassword', async () => {
      const api = new ApiClient(
        'http://localhost:3001',
        makeFetchMock(async () => jsonResponse(200, {})),
      );
      const ctx = makeContext(makeRequest(), api);

      await expect(
        resolveForgotPassword(null, { input: { email: 'a@b.com' } }, ctx),
      ).rejects.toThrow('x-tenant-id header is required');
    });
  });
});
