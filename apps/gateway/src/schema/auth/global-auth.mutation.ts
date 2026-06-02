import { builder } from '../builder';
import type { GraphQLContext } from '../../context/types';
import type { AuthTokensResponse, MessageResponse } from '../../services/api-client';
import { AuthorizationError } from '../../utils/errors';
import {
  GlobalAuthTokensObject,
  GlobalLoginInput,
  MessagePayloadObject,
  RefreshTokenInput,
  SignupInput,
  VerifyEmailInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ResendVerificationInput,
} from './auth.types';
import {
  buildApiRequestContext,
  getHeaderValue,
  requireAuthorizationHeader,
  requireTenantHeader,
  resolveRefreshAuthorization,
} from './global-auth.helpers';
import {
  validate,
  SignupSchema,
  GlobalLoginSchema,
  VerifyEmailSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ResendVerificationSchema,
} from '../../utils/validation';

interface SignupArgs {
  input: {
    email: string;
    password: string;
    cedula: string;
    documentType: string;
    roleCode?: string | null;
  };
}

interface GlobalLoginArgs {
  input: {
    email: string;
    password: string;
  };
}

interface RefreshTokenArgs {
  input?: {
    refreshToken?: string | null;
  } | null;
}

interface VerifyEmailArgs {
  input: {
    otpCode: string;
  };
}

interface ChangePasswordArgs {
  input: {
    currentPassword: string;
    newPassword: string;
  };
}

interface ForgotPasswordArgs {
  input: {
    email: string;
  };
}

interface ResetPasswordArgs {
  input: {
    token: string;
    newPassword: string;
  };
}

interface ResendVerificationArgs {
  input: {
    email: string;
  };
}

export async function resolveSignup(
  _root: unknown,
  args: SignupArgs,
  ctx: GraphQLContext,
): Promise<AuthTokensResponse> {
  const tenantId = requireTenantHeader(ctx);
  const input = validate(SignupSchema, args.input);

  return ctx.services.api.authSignup(
    {
      email: input.email,
      password: input.password,
      cedula: input.cedula,
      documentType: input.documentType,
      roleCode: input.roleCode,
    },
    buildApiRequestContext(ctx, { tenantId }),
  );
}

export async function resolveGlobalLogin(
  _root: unknown,
  args: GlobalLoginArgs,
  ctx: GraphQLContext,
): Promise<AuthTokensResponse> {
  const tenantId = requireTenantHeader(ctx);
  const input = validate(GlobalLoginSchema, args.input);

  return ctx.services.api.authLogin(
    { email: input.email, password: input.password },
    buildApiRequestContext(ctx, { tenantId }),
  );
}

export async function resolveGlobalLogout(
  _root: unknown,
  _args: Record<string, never>,
  ctx: GraphQLContext,
): Promise<boolean> {
  const authorization = getHeaderValue(ctx.request.headers, 'authorization')?.trim();
  if (!authorization) {
    return true;
  }

  try {
    await ctx.services.api.authLogout(buildApiRequestContext(ctx, { authorization }));
  } catch {
    // Best-effort: API may reject expired or rotated tokens; client still clears locally.
  }
  return true;
}

export async function resolveGlobalRefreshToken(
  _root: unknown,
  args: RefreshTokenArgs,
  ctx: GraphQLContext,
): Promise<AuthTokensResponse> {
  return ctx.services.api.authRefresh(
    buildApiRequestContext(ctx, {
      authorization: resolveRefreshAuthorization(ctx, args.input?.refreshToken),
    }),
  );
}

export async function resolveVerifyEmail(
  _root: unknown,
  args: VerifyEmailArgs,
  ctx: GraphQLContext,
): Promise<MessageResponse> {
  const input = validate(VerifyEmailSchema, args.input);
  return ctx.services.api.authVerifyEmail({ otpCode: input.otpCode });
}

export async function resolveChangePassword(
  _root: unknown,
  args: ChangePasswordArgs,
  ctx: GraphQLContext,
): Promise<MessageResponse> {
  if (ctx.authKind !== 'global') {
    throw new AuthorizationError('Global authentication required');
  }

  const input = validate(ChangePasswordSchema, args.input);

  return ctx.services.api.authChangePassword(
    {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    },
    buildApiRequestContext(ctx, { authorization: requireAuthorizationHeader(ctx) }),
  );
}

export async function resolveForgotPassword(
  _root: unknown,
  args: ForgotPasswordArgs,
  ctx: GraphQLContext,
): Promise<MessageResponse> {
  const tenantId = requireTenantHeader(ctx);
  const input = validate(ForgotPasswordSchema, args.input);

  return ctx.services.api.authForgotPassword(
    { email: input.email },
    buildApiRequestContext(ctx, { tenantId }),
  );
}

export async function resolveResetPassword(
  _root: unknown,
  args: ResetPasswordArgs,
  _ctx: GraphQLContext,
): Promise<MessageResponse> {
  const input = validate(ResetPasswordSchema, args.input);

  return _ctx.services.api.authResetPassword({
    token: input.token,
    newPassword: input.newPassword,
  });
}

export async function resolveResendVerification(
  _root: unknown,
  args: ResendVerificationArgs,
  ctx: GraphQLContext,
): Promise<MessageResponse> {
  const tenantId = requireTenantHeader(ctx);
  const input = validate(ResendVerificationSchema, args.input);

  return ctx.services.api.authResendVerification(
    { email: input.email },
    buildApiRequestContext(ctx, { tenantId }),
  );
}

builder.mutationField('signup', (t) =>
  t.field({
    type: GlobalAuthTokensObject,
    description: 'Register a global User — delegates to POST /api/auth/signup',
    args: {
      input: t.arg({ type: SignupInput, required: true }),
    },
    resolve: resolveSignup,
  }),
);

builder.mutationField('login', (t) =>
  t.field({
    type: GlobalAuthTokensObject,
    description: 'Authenticate a global User — delegates to POST /api/auth/login',
    args: {
      input: t.arg({ type: GlobalLoginInput, required: true }),
    },
    resolve: resolveGlobalLogin,
  }),
);

builder.mutationField('logout', (t) =>
  t.boolean({
    description:
      'Logout global User and invalidate refresh token — POST /api/auth/logout (Bearer optional; idempotent)',
    resolve: resolveGlobalLogout,
  }),
);

builder.mutationField('refreshToken', (t) =>
  t.field({
    type: GlobalAuthTokensObject,
    description:
      'Rotate global auth tokens — POST /api/auth/refresh (Bearer refresh JWT in Authorization header)',
    args: {
      input: t.arg({ type: RefreshTokenInput, required: false }),
    },
    resolve: resolveGlobalRefreshToken,
  }),
);

builder.mutationField('verifyEmail', (t) =>
  t.field({
    type: MessagePayloadObject,
    description: 'Verify email with OTP — delegates to POST /api/auth/verify-email',
    args: {
      input: t.arg({ type: VerifyEmailInput, required: true }),
    },
    resolve: resolveVerifyEmail,
  }),
);

builder.mutationField('changePassword', (t) =>
  t.field({
    type: MessagePayloadObject,
    description:
      'Change password for the authenticated global User — delegates to POST /api/auth/change-password',
    authScopes: { isGlobalAuthenticated: true },
    args: {
      input: t.arg({ type: ChangePasswordInput, required: true }),
    },
    resolve: resolveChangePassword,
  }),
);

builder.mutationField('forgotPassword', (t) =>
  t.field({
    type: MessagePayloadObject,
    description:
      'Request a password reset email — delegates to POST /api/auth/forgot-password (requires x-tenant-id)',
    args: {
      input: t.arg({ type: ForgotPasswordInput, required: true }),
    },
    resolve: resolveForgotPassword,
  }),
);

builder.mutationField('resetPassword', (t) =>
  t.field({
    type: MessagePayloadObject,
    description:
      'Reset password with a single-use token — delegates to POST /api/auth/reset-password (no x-tenant-id)',
    args: {
      input: t.arg({ type: ResetPasswordInput, required: true }),
    },
    resolve: resolveResetPassword,
  }),
);

builder.mutationField('resendVerification', (t) =>
  t.field({
    type: MessagePayloadObject,
    description:
      'Resend email verification OTP — delegates to POST /api/auth/resend-verification (requires x-tenant-id)',
    args: {
      input: t.arg({ type: ResendVerificationInput, required: true }),
    },
    resolve: resolveResendVerification,
  }),
);

import './global-auth.query';
import './operational-auth.mutation';
