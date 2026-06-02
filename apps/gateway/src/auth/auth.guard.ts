import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { authService } from './auth.service';
import { env } from '../config/env';
import {
  AuthSession,
  AuthUser,
  GlobalJwtPayload,
  OperationalContextUser,
  OperationalJwtPayload,
  UNAUTHENTICATED_SESSION,
  UserRole,
} from './types';
import { createChildLogger } from '../utils/logging';

const log = createChildLogger('auth.guard');

function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}

function isOperationalPayload(payload: jwt.JwtPayload): payload is OperationalJwtPayload {
  return (
    typeof payload.sub === 'string' &&
    typeof payload.tenantId === 'string' &&
    typeof payload.role === 'string' &&
    isUserRole(payload.role)
  );
}

function isGlobalPayload(payload: jwt.JwtPayload): payload is GlobalJwtPayload {
  return typeof payload.sub === 'string' && typeof payload.email === 'string';
}

function verifyWithSecret(token: string, secret: string): jwt.JwtPayload | null {
  try {
    return jwt.verify(token, secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
  } catch {
    return null;
  }
}

function resolveMesJwtSecret(): string {
  return env.MES_JWT_SECRET ?? env.JWT_SECRET;
}

function toOperationalContextUser(payload: OperationalJwtPayload): OperationalContextUser {
  return {
    id: payload.sub,
    tenantId: payload.tenantId,
    role: payload.role as UserRole,
    sedeId: payload.sedeId ?? undefined,
    jti: payload.jti,
  };
}

function toLegacyAuthUser(operational: OperationalContextUser): AuthUser {
  return {
    id: operational.id,
    tenantId: operational.tenantId,
    role: operational.role,
    sedeId: operational.sedeId,
  };
}

function operationalSession(payload: OperationalJwtPayload): AuthSession {
  const operationalUser = toOperationalContextUser(payload);
  return {
    authKind: 'operational',
    globalUser: null,
    operationalUser,
    user: toLegacyAuthUser(operationalUser),
    isAuthenticated: true,
    tenantId: operationalUser.tenantId,
  };
}

function globalSession(payload: GlobalJwtPayload): AuthSession {
  return {
    authKind: 'global',
    globalUser: { id: payload.sub, email: payload.email },
    operationalUser: null,
    user: null,
    isAuthenticated: true,
    tenantId: null,
  };
}

/**
 * Resolves dual auth from Bearer token:
 * 1. JWT_SECRET + `email` claim → global User session
 * 2. JWT_SECRET without `email` but with tenantId/role → operational (dev parity)
 * 3. MES_JWT_SECRET → operational MES session
 */
export function resolveAuthSession(req: Request): AuthSession {
  const token = authService.extractToken(req.headers.authorization);
  if (!token) {
    return UNAUTHENTICATED_SESSION;
  }

  const globalSecretPayload = verifyWithSecret(token, env.JWT_SECRET);
  if (globalSecretPayload) {
    if (isGlobalPayload(globalSecretPayload)) {
      return globalSession(globalSecretPayload);
    }
    if (isOperationalPayload(globalSecretPayload)) {
      return operationalSession(globalSecretPayload);
    }
  }

  const mesSecret = resolveMesJwtSecret();
  if (mesSecret !== env.JWT_SECRET) {
    const mesPayload = verifyWithSecret(token, mesSecret);
    if (mesPayload && isOperationalPayload(mesPayload)) {
      return operationalSession(mesPayload);
    }
  }

  log.debug('Token verification failed — treating as unauthenticated');
  return UNAUTHENTICATED_SESSION;
}

/**
 * @deprecated Prefer resolveAuthSession. Returns legacy operational AuthUser only.
 */
export function authenticate(req: Request): AuthUser | null {
  return resolveAuthSession(req).user;
}
