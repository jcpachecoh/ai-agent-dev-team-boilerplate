import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthMethod, LoginAuditStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type {
  AuthTokens,
  AuthUserProfile,
  IAuthService,
  JwtPayload,
  UserLocationSummary,
} from '../interfaces/auth.interfaces';
import { AuthRepository } from '../repository/auth.repository';
import { AuthEmailRepository } from '../repository/auth-email.repository';
import { AuthEmailService } from './auth-email.service';
import { AuditService } from '../../audit/service/audit.service';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import type { SignupDto } from '../controller/dto/signup.dto';
import type { LoginDto } from '../controller/dto/login.dto';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = '60m';
const REFRESH_TOKEN_TTL = '7d';
const DEFAULT_ROLE_CODE = 'OPERATOR';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const FAILURE_PASSWORD_INVALID = 'password_invalido';
const FAILURE_ACCOUNT_LOCKED = 'cuenta_bloqueada';

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authEmailRepository: AuthEmailRepository,
    private readonly authEmailService: AuthEmailService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly userLocationsService: UserLocationsService,
  ) {}

  async signup(tenantId: string, dto: SignupDto): Promise<AuthTokens> {
    const resolvedTenantId = this.requireTenantId(tenantId);

    const existingEmail = await this.authRepository.findByTenantAndEmail(
      resolvedTenantId,
      dto.email,
    );
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const existingCedula = await this.authRepository.findByTenantAndCedula(
      resolvedTenantId,
      dto.cedula,
    );
    if (existingCedula) {
      throw new ConflictException('Cédula already registered');
    }

    const roleCode = dto.roleCode?.trim() || DEFAULT_ROLE_CODE;
    const role = await this.authRepository.findRoleByTenantAndCode(resolvedTenantId, roleCode);
    if (!role?.isActive) {
      throw new BadRequestException('Invalid or inactive role');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    let user;
    try {
      user = await this.authRepository.createUser({
        tenantId: resolvedTenantId,
        cedula: dto.cedula,
        documentType: dto.documentType,
        email: dto.email,
        passwordHash,
        roleId: role.id,
      });
    } catch (error) {
      this.rethrowUserUniqueViolation(error);
    }

    try {
      await this.authEmailService.sendVerifyEmail(
        { id: user.id, email: user.email },
        { tenantId: resolvedTenantId, tenantName: resolvedTenantId },
      );
    } catch (error) {
      this.logger.warn(
        `[signup] Verification email enqueue failed for userId="${user.id}" — ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return this.issueSessionTokens(await this.resolveJwtPayload(user.id), resolvedTenantId);
  }

  async login(
    tenantId: string,
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const resolvedTenantId = this.requireTenantId(tenantId);
    const maskedIdentifier = this.maskIdentifier(dto.email);

    try {
      const user = await this.authRepository.findByTenantAndEmailForAuth(
        resolvedTenantId,
        dto.email,
      );

      if (!user || !user.isActive || user.deletedAt) {
        this.logger.warn(
          `Login denied: user not found or inactive (tenant=${resolvedTenantId}, identifier=${maskedIdentifier}, ip=${ipAddress ?? 'n/a'})`,
        );
        await this.auditService.logLogin({
          tenantId: resolvedTenantId,
          identifier: dto.email,
          authMethod: AuthMethod.PASSWORD,
          status: LoginAuditStatus.FAILED,
          failureReason: 'User not found or inactive',
          ipAddress,
          userAgent,
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        this.logger.warn(
          `Login denied: account locked (tenant=${resolvedTenantId}, userId=${user.id}, identifier=${maskedIdentifier}, lockedUntil=${user.lockedUntil.toISOString()}, ip=${ipAddress ?? 'n/a'})`,
        );
        await this.auditService.logLogin({
          tenantId: resolvedTenantId,
          userId: user.id,
          identifier: dto.email,
          authMethod: AuthMethod.PASSWORD,
          status: LoginAuditStatus.LOCKED,
          failureReason: FAILURE_ACCOUNT_LOCKED,
          ipAddress,
          userAgent,
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!passwordMatch) {
        this.logger.warn(
          `Login denied: password mismatch (tenant=${resolvedTenantId}, userId=${user.id}, identifier=${maskedIdentifier}, ip=${ipAddress ?? 'n/a'})`,
        );
        const lockedNow = await this.handleFailedPasswordLogin(user.id);
        await this.auditService.logLogin({
          tenantId: resolvedTenantId,
          userId: user.id,
          identifier: dto.email,
          authMethod: AuthMethod.PASSWORD,
          status: lockedNow ? LoginAuditStatus.LOCKED : LoginAuditStatus.FAILED,
          failureReason: lockedNow ? FAILURE_ACCOUNT_LOCKED : FAILURE_PASSWORD_INVALID,
          ipAddress,
          userAgent,
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.authRepository.resetLoginAttempts(user.id);
      await this.auditService.logLogin({
        tenantId: resolvedTenantId,
        userId: user.id,
        identifier: dto.email,
        authMethod: AuthMethod.PASSWORD,
        status: LoginAuditStatus.SUCCESS,
        ipAddress,
        userAgent,
      });

      this.logger.log(
        `Login success (tenant=${resolvedTenantId}, userId=${user.id}, identifier=${maskedIdentifier}, ip=${ipAddress ?? 'n/a'})`,
      );
      return this.issueSessionTokens(await this.resolveJwtPayload(user.id), resolvedTenantId);
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Login failed with unexpected error (tenant=${resolvedTenantId}, identifier=${maskedIdentifier}, ip=${ipAddress ?? 'n/a'}): ${message}`,
      );
      throw error;
    }
  }

  async refresh(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
    previousLocationId?: string | null,
  ): Promise<AuthTokens> {
    const user = await this.authRepository.findByIdForRefresh(userId);

    if (!user?.refreshToken || !user.isActive || user.deletedAt) {
      await this.auditService.logLogin({
        tenantId: user?.tenantId ?? 'SYSTEM',
        userId: user?.id ?? userId,
        identifier: user?.email ?? userId,
        authMethod: AuthMethod.REFRESH_TOKEN,
        status: LoginAuditStatus.FAILED,
        failureReason: 'Invalid user or missing refresh token',
        ipAddress,
        userAgent,
      });
      throw new ForbiddenException('Access denied');
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) {
      await this.auditService.logLogin({
        tenantId: user.tenantId,
        userId: user.id,
        identifier: user.email,
        authMethod: AuthMethod.REFRESH_TOKEN,
        status: LoginAuditStatus.FAILED,
        failureReason: 'Invalid refresh token',
        ipAddress,
        userAgent,
      });
      throw new ForbiddenException('Access denied');
    }

    await this.auditService.logLogin({
      tenantId: user.tenantId,
      userId: user.id,
      identifier: user.email,
      authMethod: AuthMethod.REFRESH_TOKEN,
      status: LoginAuditStatus.SUCCESS,
      ipAddress,
      userAgent,
    });

    const claims = await this.resolveJwtPayload(user.id);
    const locations = await this.getAssignedLocations(user.tenantId, user.id);
    const resolvedLocationId = this.resolveActiveLocationId(locations, previousLocationId);

    return this.issueSessionTokens(
      { ...claims, locationId: resolvedLocationId },
      user.tenantId,
      locations,
      resolvedLocationId,
    );
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const user = await this.authRepository.findByIdForRefresh(userId);
    await this.authRepository.saveRefreshToken(userId, null);

    if (user) {
      await this.auditService.logLogin({
        tenantId: user.tenantId,
        userId: user.id,
        identifier: user.email,
        authMethod: AuthMethod.PASSWORD, // Default to PASSWORD for manual logout
        status: LoginAuditStatus.LOGOUT,
        ipAddress,
        userAgent,
      });
    }
  }

  findByTenantAndEmail(tenantId: string, email: string) {
    return this.authRepository.findByTenantAndEmail(this.requireTenantId(tenantId), email);
  }

  async me(userId: string, activeLocationId?: string | null): Promise<AuthUserProfile> {
    const user = await this.authRepository.findByIdWithRoleCode(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }

  async myLocations(tenantId: string, userId: string): Promise<UserLocationSummary[]> {
    return this.getAssignedLocations(this.requireTenantId(tenantId), userId);
  }

  async selectLocation(tenantId: string, userId: string, locationId: string): Promise<AuthTokens> {
    const resolvedTenantId = this.requireTenantId(tenantId);
    const trimmedLocationId = locationId.trim();
    const locations = await this.getAssignedLocations(resolvedTenantId, userId);
    const isAssigned = locations.some((location) => location.id === trimmedLocationId);
    if (!isAssigned) {
      throw new ForbiddenException('La sede no está asignada a este usuario');
    }

    const claims = await this.resolveJwtPayload(userId);
    return this.issueSessionTokens(
      { ...claims, locationId: trimmedLocationId },
      resolvedTenantId,
      locations,
      trimmedLocationId,
    );
  }

  async issueKioskAuthTokens(
    userId: string,
    tenantId: string,
    locationId: string,
  ): Promise<Pick<AuthTokens, 'accessToken' | 'refreshToken'>> {
    const resolvedTenantId = this.requireTenantId(tenantId);
    const trimmedLocationId = locationId.trim();
    const claims = await this.resolveJwtPayload(userId);
    const session = await this.issueSessionTokens(
      claims,
      resolvedTenantId,
      undefined,
      trimmedLocationId,
    );
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.authRepository.findByIdForAuth(userId);
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.authRepository.updatePassword(userId, passwordHash, true);
    return { message: 'Password updated successfully.' };
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await this.authEmailRepository.findResetToken(tokenHash);

    if (!record) throw new BadRequestException('Invalid or expired reset token');
    if (record.usedAt) throw new BadRequestException('Reset token has already been used');
    if (record.expiresAt < new Date()) throw new BadRequestException('Reset token has expired');

    await this.authEmailRepository.markResetTokenUsed(record.id);
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.authRepository.updatePassword(record.userId, passwordHash, true);
    await this.authRepository.markEmailVerified(record.userId);
  }

  /**
   * Increments failed login attempts; locks the account when attempts reach MAX_LOGIN_ATTEMPTS.
   * @returns true when this failure triggered a lock (5th attempt).
   */
  private async handleFailedPasswordLogin(userId: string): Promise<boolean> {
    const attempts = await this.authRepository.incrementLoginAttempts(userId);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await this.authRepository.lockUser(userId, new Date(Date.now() + LOCK_DURATION_MS));
      return true;
    }
    return false;
  }

  private requireTenantId(tenantId: string): string {
    const trimmed = tenantId?.trim();
    if (!trimmed) {
      throw new BadRequestException('x-tenant-id header is required');
    }
    return trimmed;
  }

  /**
   * Maps Prisma unique violations on User (tenantId+email / tenantId+cedula) to safe 409 responses.
   */
  private rethrowUserUniqueViolation(error: unknown): never {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = error.meta?.target;
      const fields: string[] = Array.isArray(target)
        ? target.map(String)
        : typeof target === 'string'
          ? [target]
          : [];
      const normalized = fields.join(',').toLowerCase();
      if (normalized.includes('email')) {
        throw new ConflictException('Email already registered');
      }
      if (normalized.includes('cedula')) {
        throw new ConflictException('Cédula already registered');
      }
      throw new ConflictException('User already registered');
    }
    throw error;
  }

  private async resolveJwtPayload(userId: string): Promise<JwtPayload> {
    const claims = await this.authRepository.findJwtClaimsByUserId(userId);
    if (!claims) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return claims;
  }

  private maskIdentifier(identifier: string): string {
    const value = identifier.trim();
    const [local, domain] = value.split('@');
    if (!local || !domain) {
      return 'redacted';
    }

    const localMasked = local.length <= 2 ? `${local[0]}*` : `${local.slice(0, 2)}***`;
    return `${localMasked}@${domain}`;
  }

  private async getAssignedLocations(
    tenantId: string,
    userId: string,
  ): Promise<UserLocationSummary[]> {
    const locations = await this.userLocationsService.getActiveUserLocations(tenantId, userId);
    return locations.map((location) => ({
      id: location.id,
      name: location.name,
      code: location.code,
      city: location.city,
      address: location.address,
    }));
  }

  private resolveLoginLocation(
    locations: UserLocationSummary[],
    selectedLocationId?: string | null,
  ): { locationId: string | null; requiresLocationSelection: boolean } {
    if (selectedLocationId) {
      return { locationId: selectedLocationId, requiresLocationSelection: false };
    }
    if (locations.length === 0) {
      return { locationId: null, requiresLocationSelection: false };
    }
    if (locations.length === 1) {
      return { locationId: locations[0].id, requiresLocationSelection: false };
    }
    return { locationId: null, requiresLocationSelection: true };
  }

  private resolveActiveLocationId(
    locations: UserLocationSummary[],
    activeLocationId?: string | null,
  ): string | null {
    if (activeLocationId && locations.some((location) => location.id === activeLocationId)) {
      return activeLocationId;
    }
    return this.resolveLoginLocation(locations).locationId;
  }

  private async issueSessionTokens(
    baseClaims: JwtPayload,
    tenantId: string,
    preloadedLocations?: UserLocationSummary[],
    selectedLocationId?: string | null,
  ): Promise<AuthTokens> {
    const locations =
      preloadedLocations ?? (await this.getAssignedLocations(tenantId, baseClaims.sub));
    const { locationId, requiresLocationSelection } = this.resolveLoginLocation(
      locations,
      selectedLocationId ?? baseClaims.locationId ?? null,
    );
    const payload: JwtPayload = { ...baseClaims, locationId };
    const tokens = await this.issueTokens(payload);
    return {
      ...tokens,
      locations,
      locationId,
      requiresLocationSelection,
    };
  }

  private async issueTokens(
    payload: JwtPayload,
  ): Promise<Pick<AuthTokens, 'accessToken' | 'refreshToken'>> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: ACCESS_TOKEN_TTL }),
      this.jwtService.signAsync(payload, {
        expiresIn: REFRESH_TOKEN_TTL,
        secret: process.env.JWT_REFRESH_SECRET,
      }),
    ]);
    const hashedRefresh = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.authRepository.saveRefreshToken(payload.sub, hashedRefresh);
    return { accessToken, refreshToken };
  }
}
