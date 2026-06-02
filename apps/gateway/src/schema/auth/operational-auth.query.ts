import { builder } from '../builder';
import type { GraphQLContext } from '../../context/types';
import type { MesMeResponse } from '../../services/api-client';
import { AuthorizationError } from '../../utils/errors';
import { OperationalUserObject, type OperationalUserShape } from './auth.types';
import { buildApiRequestContext, requireAuthorizationHeader } from './global-auth.helpers';

export async function resolveOperationalMe(
  _root: unknown,
  _args: Record<string, never>,
  ctx: GraphQLContext,
): Promise<OperationalUserShape> {
  if (ctx.authKind !== 'operational') {
    throw new AuthorizationError('Operational authentication required');
  }

  const profile = await ctx.services.api.mesAuthMe(
    buildApiRequestContext(ctx, { authorization: requireAuthorizationHeader(ctx) }),
  );

  return mapApiProfileToOperationalUser(profile);
}

function mapApiProfileToOperationalUser(profile: MesMeResponse): OperationalUserShape {
  return {
    id: profile.id,
    role: profile.role,
    tenantId: profile.tenantId,
    sedeId: profile.sedeId,
  };
}

builder.queryField('meOperational', (t) =>
  t.field({
    type: OperationalUserObject,
    description:
      'Returns the authenticated operational MES user profile — delegates to GET /api/mes/auth/me',
    authScopes: { isOperationalAuthenticated: true },
    resolve: resolveOperationalMe,
  }),
);
