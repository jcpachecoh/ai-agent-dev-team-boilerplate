// ─── UserRole ─────────────────────────────────────────────────────────────────
// Mirrors Prisma OperationalRole enum exactly.

export enum UserRole {
  OWNER = 'OWNER',
  SUPERVISOR = 'SUPERVISOR',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR',
}

export type AuthKind = 'global' | 'operational' | null;

// ─── JWT payloads ────────────────────────────────────────────────────────────

/** Global User JWT (apps/api AuthService) — signed with JWT_SECRET */
export interface GlobalJwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

/** OperationalUser JWT (apps/api MesAuthService) — signed with MES_JWT_SECRET (or JWT_SECRET in dev) */
export interface OperationalJwtPayload {
  sub: string;
  cedulaHash?: string;
  role: string;
  sedeId?: string | null;
  tenantId: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

/** @deprecated Use OperationalJwtPayload — kept for legacy auth.service helpers */
export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: string;
  sedeId?: string;
  iat: number;
  exp: number;
}

// ─── Authenticated principals on GraphQL context ─────────────────────────────

export interface GlobalUser {
  id: string;
  email: string;
}

export interface OperationalContextUser {
  id: string;
  tenantId: string;
  role: UserRole;
  sedeId?: string;
  jti?: string;
}

/** Legacy operational profile used by existing domain resolvers (supplier, me, etc.) */
export interface AuthUser {
  id: string;
  tenantId: string;
  role: UserRole;
  sedeId?: string;
}

export interface AuthSession {
  authKind: AuthKind;
  globalUser: GlobalUser | null;
  operationalUser: OperationalContextUser | null;
  /** Operational legacy alias — null for global JWT sessions */
  user: AuthUser | null;
  isAuthenticated: boolean;
  tenantId: string | null;
}

export const UNAUTHENTICATED_SESSION: AuthSession = {
  authKind: null,
  globalUser: null,
  operationalUser: null,
  user: null,
  isAuthenticated: false,
  tenantId: null,
};
