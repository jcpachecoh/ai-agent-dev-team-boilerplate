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
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type {
  AuthTokens,
  AuthUserProfile,
  IAuthService,
  JwtPayload,
} from '../interfaces/auth.interfaces';
import { AuthRepository } from '../repository/auth.repository';
import { AuthEmailRepository } from '../repository/auth-email.repository';
import { AuthEmailService } from './auth-email.service';
import { AuditService } from '../../audit/service/audit.service';
import type { SignupDto } from '../controller/dto/signup.dto';
import type { LoginDto } from '../controller/dto/login.dto';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const DEFAULT_ROLE_CODE = 'OPERATOR';

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authEmailRepository: AuthEmailRepository,
    private readonly authEmailService: AuthEmailService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
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
    const user = await this.authRepository.createUser({
      tenantId: resolvedTenantId,
      cedula: dto.cedula,
      documentType: dto.documentType,
      email: dto.email,
      passwordHash,
      roleId: role.id,
    });

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

    return this.issueTokens(user.id, user.email);
  }

  async login(
    tenantId: string,
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const resolvedTenantId = this.requireTenantId(tenantId);

    const user = await this.authRepository.findByTenantAndEmailForAuth(resolvedTenantId, dto.email);

    if (!user || !user.isActive || user.deletedAt) {
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
      await this.auditService.logLogin({
        tenantId: resolvedTenantId,
        userId: user.id,
        identifier: dto.email,
        authMethod: AuthMethod.PASSWORD,
        status: LoginAuditStatus.LOCKED,
        failureReason: 'Account locked',
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      await this.auditService.logLogin({
        tenantId: resolvedTenantId,
        userId: user.id,
        identifier: dto.email,
        authMethod: AuthMethod.PASSWORD,
        status: LoginAuditStatus.FAILED,
        failureReason: 'Invalid password',
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.auditService.logLogin({
      tenantId: resolvedTenantId,
      userId: user.id,
      identifier: dto.email,
      authMethod: AuthMethod.PASSWORD,
      status: LoginAuditStatus.SUCCESS,
      ipAddress,
      userAgent,
    });

    return this.issueTokens(user.id, user.email);
  }

  async refresh(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
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

    return this.issueTokens(user.id, user.email);
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

  async me(userId: string): Promise<AuthUserProfile> {
    const user = await this.authRepository.findByIdWithRoleCode(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
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
    await this.authRepository.updatePassword(record.userId, passwordHash);
  }

  private requireTenantId(tenantId: string): string {
    const trimmed = tenantId?.trim();
    if (!trimmed) {
      throw new BadRequestException('x-tenant-id header is required');
    }
    return trimmed;
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: ACCESS_TOKEN_TTL }),
      this.jwtService.signAsync(payload, {
        expiresIn: REFRESH_TOKEN_TTL,
        secret: process.env.JWT_REFRESH_SECRET,
      }),
    ]);
    const hashedRefresh = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.authRepository.saveRefreshToken(userId, hashedRefresh);
    return { accessToken, refreshToken };
  }
}
