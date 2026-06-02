import { OperationalUser } from '@prisma/client';

export interface AuthUser {
  id: string;
  tenantId: string;
  role: string;
  sedeId?: string;
}

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: string;
  sedeId?: string;
  iat?: number;
  exp?: number;
}

export interface LoginInput {
  cedula: string;
  pin: string;
  tenantId: string;
}

export interface LoginResult {
  token: string;
  user: OperationalUser;
}

export interface IAuthRepository {
  findUserByTenantAndCedula(tenantId: string, cedulaHash: string): Promise<OperationalUser | null>;
  updateLoginAttempts(id: string, attempts: number, lockedUntil: Date | null): Promise<void>;
  resetLoginAttempts(id: string): Promise<OperationalUser>;
  findUserById(id: string): Promise<OperationalUser | null>;
}

export interface IAuthService {
  loginWithPin(cedula: string, pin: string, tenantId: string): Promise<LoginResult>;
  getUserById(id: string): Promise<OperationalUser>;
  signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;
}
