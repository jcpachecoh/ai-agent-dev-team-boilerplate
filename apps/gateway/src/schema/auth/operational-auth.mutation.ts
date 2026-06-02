import { builder } from '../builder';
import type { GraphQLContext } from '../../context/types';
import type { MesAuthTokensResponse, MessageResponse } from '../../services/api-client';
import { AuthorizationError } from '../../utils/errors';
import { validate, OperationalLoginSchema } from '../../utils/validation';
import {
  MessagePayloadObject,
  OperationalAuthTokensObject,
  OperationalLoginInput,
} from './auth.types';
import {
  buildApiRequestContext,
  requireAuthorizationHeader,
  requireTenantHeader,
} from './global-auth.helpers';

interface OperationalLoginArgs {
  input: {
    cedula: string;
    pin: string;
  };
}

export async function resolveOperationalLogin(
  _root: unknown,
  args: OperationalLoginArgs,
  ctx: GraphQLContext,
): Promise<MesAuthTokensResponse> {
  const tenantId = requireTenantHeader(ctx);
  const input = validate(OperationalLoginSchema, args.input);

  return ctx.services.api.mesAuthLogin(
    { cedula: input.cedula, pin: input.pin },
    buildApiRequestContext(ctx, { tenantId }),
  );
}

export async function resolveOperationalLogout(
  _root: unknown,
  _args: Record<string, never>,
  ctx: GraphQLContext,
): Promise<MessageResponse> {
  if (ctx.authKind !== 'operational') {
    throw new AuthorizationError('Operational authentication required');
  }

  return ctx.services.api.mesAuthLogout(
    buildApiRequestContext(ctx, { authorization: requireAuthorizationHeader(ctx) }),
  );
}

builder.mutationField('loginOperational', (t) =>
  t.field({
    type: OperationalAuthTokensObject,
    description:
      'Authenticate an operational MES user with cédula and PIN — delegates to POST /api/mes/auth/login',
    args: {
      input: t.arg({ type: OperationalLoginInput, required: true }),
    },
    resolve: resolveOperationalLogin,
  }),
);

builder.mutationField('logoutOperational', (t) =>
  t.field({
    type: MessagePayloadObject,
    description:
      'Logout operational user and invalidate tokens — delegates to POST /api/mes/auth/logout',
    authScopes: { isOperationalAuthenticated: true },
    resolve: resolveOperationalLogout,
  }),
);

import './operational-auth.query';
