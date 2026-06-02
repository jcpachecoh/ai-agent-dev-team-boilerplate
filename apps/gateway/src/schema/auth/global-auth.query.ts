import { AuthorizationError } from '../../utils/errors';
import type { GlobalUserMeResponse } from '../../services/api-client';
import type { GraphQLContext } from '../../context/types';
import type { DocumentTypeValue, GlobalUserShape } from './auth.types';
import { builder } from '../builder';
import { GlobalUserObject } from './auth.types';
import { buildApiRequestContext, requireAuthorizationHeader } from './global-auth.helpers';

export async function resolveGlobalMe(
  _root: unknown,
  _args: Record<string, never>,
  ctx: GraphQLContext,
): Promise<GlobalUserShape> {
  if (ctx.authKind !== 'global') {
    throw new AuthorizationError('Global authentication required');
  }

  const profile = await ctx.services.api.authMe(
    buildApiRequestContext(ctx, { authorization: requireAuthorizationHeader(ctx) }),
  );

  return mapApiProfileToGlobalUser(profile);
}

function mapApiProfileToGlobalUser(profile: GlobalUserMeResponse): GlobalUserShape {
  return {
    id: profile.id,
    tenantId: profile.tenantId,
    email: profile.email,
    cedula: profile.cedula,
    documentType: profile.documentType as DocumentTypeValue,
    emailVerified: profile.emailVerified,
    isActive: profile.isActive,
    roleCode: profile.roleCode,
    createdAt: new Date(profile.createdAt),
  };
}

builder.queryField('me', (t) =>
  t.field({
    type: GlobalUserObject,
    description: 'Returns the authenticated global User profile — delegates to GET /api/auth/me',
    authScopes: { isGlobalAuthenticated: true },
    resolve: resolveGlobalMe,
  }),
);
