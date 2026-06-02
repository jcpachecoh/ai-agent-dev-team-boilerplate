/**
 * Global auth GraphQL resolver tests — mock ApiClient and assert delegate calls.
 */

import type { Request } from 'express';
import type { GraphQLContext } from '../../src/context/types';
import { ValidationError } from '../../src/utils/errors';
import {
  resolveForgotPassword,
  resolveGlobalLogin,
  resolveGlobalLogout,
  resolveGlobalRefreshToken,
  resolveResendVerification,
  resolveResetPassword,
  resolveSignup,
  resolveVerifyEmail,
} from '../../src/schema/auth/global-auth.mutation';

function makeRequest(headers: Record<string, string | undefined> = {}): Request {
  return {
    headers,
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as Request;
}

function makeContext(
  request: Request,
  apiOverrides: Partial<{
    authSignup: jest.Mock;
    authLogin: jest.Mock;
    authLogout: jest.Mock;
    authRefresh: jest.Mock;
    authVerifyEmail: jest.Mock;
    authForgotPassword: jest.Mock;
    authResetPassword: jest.Mock;
    authResendVerification: jest.Mock;
  }> = {},
): GraphQLContext {
  return {
    request,
    ip: '10.0.0.1',
    authKind: null,
    globalUser: null,
    operationalUser: null,
    user: null,
    tenantId: null,
    isAuthenticated: false,
    isGlobalAuthenticated: false,
    isOperationalAuthenticated: false,
    services: {
      api: {
        authSignup: apiOverrides.authSignup ?? jest.fn(),
        authLogin: apiOverrides.authLogin ?? jest.fn(),
        authLogout: apiOverrides.authLogout ?? jest.fn(),
        authRefresh: apiOverrides.authRefresh ?? jest.fn(),
        authVerifyEmail: apiOverrides.authVerifyEmail ?? jest.fn(),
        authForgotPassword: apiOverrides.authForgotPassword ?? jest.fn(),
        authResetPassword: apiOverrides.authResetPassword ?? jest.fn(),
        authResendVerification: apiOverrides.authResendVerification ?? jest.fn(),
      },
    },
  } as unknown as GraphQLContext;
}

const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

describe('global auth resolvers', () => {
  describe('resolveSignup', () => {
    it('delegates to authSignup with tenant header and forwarded metadata', async () => {
      const authSignup = jest.fn().mockResolvedValue(tokens);
      const ctx = makeContext(
        makeRequest({
          'x-tenant-id': 'palos-de-lena',
          'user-agent': 'jest-agent',
        }),
        { authSignup },
      );

      const result = await resolveSignup(
        null,
        {
          input: {
            email: 'user@example.com',
            password: 'TestPass123!',
            cedula: '12345678',
            documentType: 'CC',
            roleCode: 'OPERATOR',
          },
        },
        ctx,
      );

      expect(result).toEqual(tokens);
      expect(authSignup).toHaveBeenCalledWith(
        {
          email: 'user@example.com',
          password: 'TestPass123!',
          cedula: '12345678',
          documentType: 'CC',
          roleCode: 'OPERATOR',
        },
        {
          tenantId: 'palos-de-lena',
          authorization: undefined,
          userAgent: 'jest-agent',
          forwardedFor: '10.0.0.1',
        },
      );
    });

    it('throws ValidationError when x-tenant-id header is missing', async () => {
      const ctx = makeContext(makeRequest(), { authSignup: jest.fn() });

      await expect(
        resolveSignup(
          null,
          {
            input: {
              email: 'user@example.com',
              password: 'TestPass123!',
              cedula: '12345678',
              documentType: 'CC',
            },
          },
          ctx,
        ),
      ).rejects.toThrow(ValidationError);

      await expect(
        resolveSignup(
          null,
          {
            input: {
              email: 'user@example.com',
              password: 'TestPass123!',
              cedula: '12345678',
              documentType: 'CC',
            },
          },
          ctx,
        ),
      ).rejects.toThrow('x-tenant-id header is required');
    });
  });

  describe('resolveGlobalLogin', () => {
    it('delegates to authLogin with tenant header', async () => {
      const authLogin = jest.fn().mockResolvedValue(tokens);
      const ctx = makeContext(makeRequest({ 'x-tenant-id': 'tenant-abc', 'user-agent': 'jest' }), {
        authLogin,
      });

      const result = await resolveGlobalLogin(
        null,
        { input: { email: 'user@example.com', password: 'secret' } },
        ctx,
      );

      expect(result).toEqual(tokens);
      expect(authLogin).toHaveBeenCalledWith(
        { email: 'user@example.com', password: 'secret' },
        {
          tenantId: 'tenant-abc',
          authorization: undefined,
          userAgent: 'jest',
          forwardedFor: '10.0.0.1',
        },
      );
    });

    it('throws ValidationError when x-tenant-id header is missing', async () => {
      const ctx = makeContext(makeRequest(), { authLogin: jest.fn() });

      await expect(
        resolveGlobalLogin(null, { input: { email: 'a@b.com', password: 'x' } }, ctx),
      ).rejects.toThrow('x-tenant-id header is required');
    });
  });

  describe('resolveGlobalLogout', () => {
    it('delegates to authLogout with Authorization header', async () => {
      const authLogout = jest.fn().mockResolvedValue(undefined);
      const ctx = makeContext(
        makeRequest({ authorization: 'Bearer access-token', 'user-agent': 'jest' }),
        { authLogout },
      );

      const result = await resolveGlobalLogout(null, {}, ctx);

      expect(result).toBe(true);
      expect(authLogout).toHaveBeenCalledWith({
        tenantId: undefined,
        authorization: 'Bearer access-token',
        userAgent: 'jest',
        forwardedFor: '10.0.0.1',
      });
    });
  });

  describe('resolveGlobalRefreshToken', () => {
    it('uses refresh JWT from Authorization Bearer header', async () => {
      const authRefresh = jest.fn().mockResolvedValue(tokens);
      const ctx = makeContext(makeRequest({ authorization: 'Bearer refresh-jwt-token' }), {
        authRefresh,
      });

      const result = await resolveGlobalRefreshToken(null, {}, ctx);

      expect(result).toEqual(tokens);
      expect(authRefresh).toHaveBeenCalledWith({
        tenantId: undefined,
        authorization: 'Bearer refresh-jwt-token',
        userAgent: undefined,
        forwardedFor: '10.0.0.1',
      });
    });

    it('falls back to input.refreshToken when Authorization header is absent', async () => {
      const authRefresh = jest.fn().mockResolvedValue(tokens);
      const ctx = makeContext(makeRequest(), { authRefresh });

      await resolveGlobalRefreshToken(null, { input: { refreshToken: 'body-refresh-token' } }, ctx);

      expect(authRefresh).toHaveBeenCalledWith(
        expect.objectContaining({
          authorization: 'Bearer body-refresh-token',
        }),
      );
    });
  });

  describe('resolveVerifyEmail', () => {
    it('delegates to authVerifyEmail with otpCode body', async () => {
      const authVerifyEmail = jest.fn().mockResolvedValue({ message: 'Email verified.' });
      const ctx = makeContext(makeRequest(), { authVerifyEmail });

      const result = await resolveVerifyEmail(null, { input: { otpCode: '847291' } }, ctx);

      expect(result).toEqual({ message: 'Email verified.' });
      expect(authVerifyEmail).toHaveBeenCalledWith({ otpCode: '847291' });
    });
  });

  describe('resolveForgotPassword', () => {
    it('delegates to authForgotPassword with tenant header', async () => {
      const authForgotPassword = jest
        .fn()
        .mockResolvedValue({ message: 'If the email exists, a reset link has been sent.' });
      const ctx = makeContext(
        makeRequest({ 'x-tenant-id': 'palos-de-lena', 'user-agent': 'jest' }),
        { authForgotPassword },
      );

      const result = await resolveForgotPassword(
        null,
        { input: { email: 'user@example.com' } },
        ctx,
      );

      expect(result.message).toContain('reset link');
      expect(authForgotPassword).toHaveBeenCalledWith(
        { email: 'user@example.com' },
        {
          tenantId: 'palos-de-lena',
          authorization: undefined,
          userAgent: 'jest',
          forwardedFor: '10.0.0.1',
        },
      );
    });

    it('throws ValidationError when x-tenant-id header is missing', async () => {
      const ctx = makeContext(makeRequest(), { authForgotPassword: jest.fn() });

      await expect(
        resolveForgotPassword(null, { input: { email: 'a@b.com' } }, ctx),
      ).rejects.toThrow('x-tenant-id header is required');
    });
  });

  describe('resolveResetPassword', () => {
    it('delegates to authResetPassword without tenant header', async () => {
      const authResetPassword = jest
        .fn()
        .mockResolvedValue({ message: 'Password updated successfully.' });
      const ctx = makeContext(makeRequest({ 'x-tenant-id': 'palos-de-lena' }), {
        authResetPassword,
      });

      const result = await resolveResetPassword(
        null,
        { input: { token: 'raw-reset-token', newPassword: 'NewPass123!' } },
        ctx,
      );

      expect(result).toEqual({ message: 'Password updated successfully.' });
      expect(authResetPassword).toHaveBeenCalledWith({
        token: 'raw-reset-token',
        newPassword: 'NewPass123!',
      });
    });
  });

  describe('resolveResendVerification', () => {
    it('delegates to authResendVerification with tenant header', async () => {
      const authResendVerification = jest
        .fn()
        .mockResolvedValue({ message: 'If the email exists, a verification code has been sent.' });
      const ctx = makeContext(makeRequest({ 'x-tenant-id': 'tenant-abc' }), {
        authResendVerification,
      });

      const result = await resolveResendVerification(
        null,
        { input: { email: 'user@example.com' } },
        ctx,
      );

      expect(result.message).toContain('verification code');
      expect(authResendVerification).toHaveBeenCalledWith(
        { email: 'user@example.com' },
        {
          tenantId: 'tenant-abc',
          authorization: undefined,
          userAgent: undefined,
          forwardedFor: '10.0.0.1',
        },
      );
    });

    it('throws ValidationError when x-tenant-id header is missing', async () => {
      const ctx = makeContext(makeRequest(), { authResendVerification: jest.fn() });

      await expect(
        resolveResendVerification(null, { input: { email: 'a@b.com' } }, ctx),
      ).rejects.toThrow('x-tenant-id header is required');
    });
  });
});
