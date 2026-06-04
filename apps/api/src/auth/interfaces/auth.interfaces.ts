import type { User, PasswordResetToken } from '@prisma/client';
import type { SignupDto } from '../controller/dto/signup.dto';
import type { LoginDto } from '../controller/dto/login.dto';

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  createUser(data: { email: string; name: string; passwordHash: string }): Promise<User>;
  saveRefreshToken(userId: string, hashedToken: string | null): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface IAuthService {
  signup(dto: SignupDto): Promise<AuthTokens>;
  login(dto: LoginDto): Promise<AuthTokens>;
  refresh(userId: string, refreshToken: string): Promise<AuthTokens>;
  logout(userId: string): Promise<void>;
  resetPassword(rawToken: string, newPassword: string): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
}

// ---------------------------------------------------------------------------
// Tenant context (no Prisma Tenant model exists)
// ---------------------------------------------------------------------------

export interface TenantContext {
  tenantId: string;
  tenantName: string;
  tenantLogoUrl?: string;
  primaryColor?: string;
}

// ---------------------------------------------------------------------------
// Auth email repository
// ---------------------------------------------------------------------------

export interface CreateResetTokenData {
  tenantId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface IAuthEmailRepository {
  createResetToken(data: CreateResetTokenData): Promise<PasswordResetToken>;
  findResetToken(tokenHash: string): Promise<PasswordResetToken | null>;
  markResetTokenUsed(id: string): Promise<void>;
  deleteExpiredResetTokens(userId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Auth email service
// ---------------------------------------------------------------------------

export interface IAuthEmailService {
  sendResetPassword(userEmail: string, tenant: TenantContext, ipAddress?: string): Promise<void>;

  sendVerifyEmail(
    user: { id: string; email: string; name: string },
    tenant: TenantContext,
  ): Promise<{ otpCode: string }>;

  verifyOtp(otpCode: string): Promise<void>;

  sendWelcome(
    user: { email: string; name: string; role: string },
    tenant: TenantContext,
    temporaryPassword?: string,
  ): Promise<void>;

  sendInvitation(
    invitee: { email: string; name: string },
    inviter: { name: string },
    tenant: TenantContext,
    role: string,
    workspaceName: string,
  ): Promise<void>;
}
