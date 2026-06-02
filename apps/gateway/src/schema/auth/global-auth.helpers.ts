import type { Request } from 'express';
import type { ApiRequestContext } from '../../services/api-client';
import type { GraphQLContext } from '../../context/types';
import { AuthenticationError, ValidationError } from '../../utils/errors';

export function getHeaderValue(headers: Request['headers'], name: string): string | undefined {
  const lower = name.toLowerCase();
  const value = headers[lower] ?? headers[name];
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : undefined;
}

export function requireTenantHeader(ctx: GraphQLContext): string {
  const tenantId = getHeaderValue(ctx.request.headers, 'x-tenant-id');
  if (!tenantId?.trim()) {
    throw new ValidationError('x-tenant-id header is required');
  }
  return tenantId.trim();
}

export function buildApiRequestContext(
  ctx: GraphQLContext,
  overrides: Partial<ApiRequestContext> = {},
): ApiRequestContext {
  return {
    tenantId: overrides.tenantId,
    authorization: overrides.authorization ?? getHeaderValue(ctx.request.headers, 'authorization'),
    userAgent: overrides.userAgent ?? getHeaderValue(ctx.request.headers, 'user-agent'),
    forwardedFor: overrides.forwardedFor ?? ctx.ip,
  };
}

export function resolveRefreshAuthorization(
  ctx: GraphQLContext,
  inputRefreshToken?: string | null,
): string {
  const authHeader = getHeaderValue(ctx.request.headers, 'authorization');
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const token = bearer ?? inputRefreshToken?.trim();
  if (!token) {
    throw new ValidationError(
      'Refresh token required via Authorization Bearer header or input.refreshToken',
    );
  }
  return `Bearer ${token}`;
}

export function requireAuthorizationHeader(ctx: GraphQLContext): string {
  const authorization = getHeaderValue(ctx.request.headers, 'authorization');
  if (!authorization?.trim()) {
    throw new AuthenticationError('Authorization header is required');
  }
  return authorization.trim();
}
