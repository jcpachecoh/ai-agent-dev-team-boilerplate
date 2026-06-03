import { BadRequestException } from '@nestjs/common';

export type GqlRequestContext = {
  req?: { headers?: Record<string, unknown> };
};

export function getTenantIdFromContext(context: GqlRequestContext): string {
  const tenantId = context.req?.headers?.['x-tenant-id'];
  if (typeof tenantId !== 'string' || !tenantId.trim()) {
    throw new BadRequestException('x-tenant-id header is required');
  }
  return tenantId.trim();
}

export function getClientIpFromContext(context: GqlRequestContext): string {
  const forwarded = context.req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return 'unknown';
}

export function getUserAgentFromContext(context: GqlRequestContext): string | undefined {
  const userAgent = context.req?.headers?.['user-agent'];
  return typeof userAgent === 'string' ? userAgent : undefined;
}
