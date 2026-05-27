// ─── UserRole ─────────────────────────────────────────────────────────────────
// Mirrors Prisma OperationalRole enum exactly.

export enum UserRole {
  OWNER = 'OWNER',
  SUPERVISOR = 'SUPERVISOR',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR',
}

// ─── JWT payload ─────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;       // OperationalUser id
  tenantId: string;
  role: string;      // UserRole value
  sedeId?: string;
  iat: number;
  exp: number;
}

// ─── Authenticated user attached to GraphQL context ──────────────────────────

export interface AuthUser {
  id: string;
  tenantId: string;
  role: UserRole;
  sedeId?: string;
}
