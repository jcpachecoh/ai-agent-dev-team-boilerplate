import type { DocumentType, PasswordResetToken, User } from '@prisma/client';
import type { SignupDto } from '../controller/dto/signup.dto';
import type { LoginDto } from '../controller/dto/login.dto';

export type AuthUserSafe = Omit<User, 'passwordHash' | 'refreshToken'>;
export type AuthUserWithPassword = AuthUserSafe & { passwordHash: string };
export type AuthUserWithRefresh = AuthUserSafe & { refreshToken: string | null };

export interface CreateUserData {
  tenantId: string;
  cedula: string;
  documentType: DocumentType;
  email: string;
  passwordHash: string;
  roleId: string;
}

export interface AuthRoleRef {
  id: string;
  code: string;
  isActive: boolean;
}

/** Safe global User profile for GET /api/auth/me (no secrets) */
export interface AuthUserProfile {
  id: string;
  tenantId: string;
  email: string;
  cedula: string;
  documentType: DocumentType;
  emailVerified: boolean;
  isActive: boolean;
  roleCode: string;
  createdAt: Date;
}

export interface IAuthRepository {
  findByTenantAndEmail(tenantId: string, email: string): Promise<AuthUserSafe | null>;
  findByTenantAndEmailForAuth(
    tenantId: string,
    email: string,
  ): Promise<AuthUserWithPassword | null>;
  findByTenantAndCedula(tenantId: string, cedula: string): Promise<AuthUserSafe | null>;
  findByIdForRefresh(id: string): Promise<AuthUserWithRefresh | null>;
  findByIdForAuth(id: string): Promise<AuthUserWithPassword | null>;
  findByIdWithRoleCode(id: string): Promise<AuthUserProfile | null>;
  findJwtClaimsByUserId(id: string): Promise<JwtPayload | null>;
  findRoleByTenantAndCode(tenantId: string, code: string): Promise<AuthRoleRef | null>;
  createUser(data: CreateUserData): Promise<AuthUserSafe>;
  incrementLoginAttempts(userId: string): Promise<number>;
  lockUser(userId: string, lockedUntil: Date): Promise<void>;
  resetLoginAttempts(userId: string): Promise<void>;
  saveRefreshToken(userId: string, hashedToken: string | null): Promise<void>;
  updatePassword(
    userId: string,
    passwordHash: string,
    trackPasswordChange?: boolean,
  ): Promise<void>;
  markEmailVerified(userId: string, tenantId?: string): Promise<boolean>;
}

export interface UserLocationSummary {
  id: string;
  name: string;
  code: string | null;
  city: string | null;
  address: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  locations: UserLocationSummary[];
  locationId: string | null;
  requiresLocationSelection: boolean;
}

/** Global access/refresh JWT claims (no secrets, no permissions array). */
export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  roleId: string;
  roleCode: string;
  locationId?: string | null;
}

export interface IAuthService {
  signup(tenantId: string, dto: SignupDto): Promise<AuthTokens>;
  login(tenantId: string, dto: LoginDto): Promise<AuthTokens>;
  refresh(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
    previousLocationId?: string | null,
  ): Promise<AuthTokens>;
  logout(userId: string): Promise<void>;
  me(userId: string, activeLocationId?: string | null): Promise<AuthUserProfile>;
  myLocations(tenantId: string, userId: string): Promise<UserLocationSummary[]>;
  selectLocation(tenantId: string, userId: string, locationId: string): Promise<AuthTokens>;
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }>;
  resetPassword(rawToken: string, newPassword: string): Promise<void>;
  findByTenantAndEmail(tenantId: string, email: string): Promise<AuthUserSafe | null>;
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
    user: { id: string; email: string },
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

  sendAccountConfirmation(
    user: { id: string; email: string; name: string },
    tenant: TenantContext,
  ): Promise<void>;
}
