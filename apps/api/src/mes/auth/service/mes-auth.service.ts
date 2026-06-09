import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthMethod, LoginAuditStatus, OperationalUser } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';
import { OperationalRole } from '@prisma/client';
import type {
  IMesAuthService,
  MesAuthTokens,
  MesCreateUserInput,
  MesCreatedUserResponse,
  MesJwtPayload,
  MesLoginInput,
  MesMeResponse,
} from '../interfaces/mes-auth.interfaces';
import { MesAuthRepository } from '../repository/mes-auth.repository';
import { MesAuthRedisService } from './mes-auth-redis.service';
import { AuditService } from '../../../audit/service/audit.service';

const MAX_ATTEMPTS = 3;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const ACCESS_TOKEN_TTL = '8h';
const ACCESS_TOKEN_BLACKLIST_TTL_SECONDS = 8 * 60 * 60;
const REFRESH_TOKEN_TTL = '7d';
const SALT_ROUNDS = 12;
const CEDULA_PATTERN = /^\d{8,11}$/;
const PIN_PATTERN = /^\d{4,6}$/;

const GENERIC_AUTH_MESSAGE = 'Cédula o PIN incorrecto';

@Injectable()
export class MesAuthService implements IMesAuthService {
  constructor(
    private readonly mesAuthRepository: MesAuthRepository,
    private readonly mesAuthRedisService: MesAuthRedisService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async login(
    dto: MesLoginInput,
    ipAddress: string,
    tenantId: string,
    userAgent?: string,
  ): Promise<MesAuthTokens> {
    if (!tenantId?.trim()) {
      throw new BadRequestException('Tenant context is required');
    }

    const maskedCedula = this.maskCedula(dto.cedula);

    try {
      this.assertCredentialsFormat(dto.cedula, dto.pin);
    } catch (error) {
      await this.auditService.logLogin({
        tenantId: tenantId.trim(),
        identifier: maskedCedula,
        authMethod: AuthMethod.PIN,
        status: LoginAuditStatus.FAILED,
        failureReason: 'Invalid format',
        ipAddress,
        userAgent,
      });
      throw error;
    }

    const rateLimit = await this.mesAuthRedisService.checkRateLimit(ipAddress);
    if (!rateLimit.allowed) {
      await this.auditService.logLogin({
        tenantId: tenantId.trim(),
        identifier: maskedCedula,
        authMethod: AuthMethod.PIN,
        status: LoginAuditStatus.FAILED,
        failureReason: 'Rate limit exceeded',
        ipAddress,
        userAgent,
      });
      throw new HttpException(
        'Too many login attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const cedulaHash = this.hashCedula(dto.cedula);
    const user = await this.mesAuthRepository.findByCedulaHash(tenantId.trim(), cedulaHash);

    if (!user || !user.isActive) {
      await this.auditService.logLogin({
        tenantId: tenantId.trim(),
        userId: user?.id,
        identifier: maskedCedula,
        authMethod: AuthMethod.PIN,
        status: LoginAuditStatus.FAILED,
        failureReason: user ? 'User inactive' : 'User not found',
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException(GENERIC_AUTH_MESSAGE);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.auditService.logLogin({
        tenantId: tenantId.trim(),
        userId: user.id,
        identifier: maskedCedula,
        authMethod: AuthMethod.PIN,
        status: LoginAuditStatus.LOCKED,
        failureReason: 'Account locked',
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException(GENERIC_AUTH_MESSAGE);
    }

    const pinMatch = await bcrypt.compare(dto.pin, user.pinHash);
    if (!pinMatch) {
      await this.handleFailedLogin(user);
      await this.auditService.logLogin({
        tenantId: tenantId.trim(),
        userId: user.id,
        identifier: maskedCedula,
        authMethod: AuthMethod.PIN,
        status: LoginAuditStatus.FAILED,
        failureReason: 'Invalid PIN',
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException(GENERIC_AUTH_MESSAGE);
    }

    await this.mesAuthRepository.resetLoginAttempts(user.id);
    await this.auditService.logLogin({
      tenantId: tenantId.trim(),
      userId: user.id,
      identifier: maskedCedula,
      authMethod: AuthMethod.PIN,
      status: LoginAuditStatus.SUCCESS,
      ipAddress,
      userAgent,
    });

    return this.issueTokens(user);
  }

  async logout(
    userId: string,
    jti?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const user = await this.mesAuthRepository.findById(userId);
    await this.mesAuthRepository.saveRefreshToken(userId, null);
    if (jti) {
      await this.mesAuthRedisService.blacklistToken(jti, ACCESS_TOKEN_BLACKLIST_TTL_SECONDS);
    }

    if (user) {
      await this.auditService.logLogin({
        tenantId: user.tenantId,
        userId: user.id,
        identifier: user.cedulaHash, // We use cedulaHash since we don't have the raw cédula here
        authMethod: AuthMethod.PIN,
        status: LoginAuditStatus.LOGOUT,
        ipAddress,
        userAgent,
      });
    }
  }

  async me(userId: string): Promise<MesMeResponse> {
    const user = await this.mesAuthRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      role: user.role,
      tenantId: user.tenantId,
      sedeId: user.sedeId,
    };
  }

  async getRole(
    requesterUserId: string,
    targetUserId: string,
  ): Promise<{ role: OperationalUser['role'] }> {
    const requester = await this.mesAuthRepository.findById(requesterUserId);
    if (!requester) {
      throw new NotFoundException('User not found');
    }

    const target = await this.mesAuthRepository.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.tenantId !== requester.tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return { role: target.role };
  }

  async createUser(
    requesterUserId: string,
    dto: MesCreateUserInput,
  ): Promise<MesCreatedUserResponse> {
    const requester = await this.mesAuthRepository.findById(requesterUserId);
    if (!requester) {
      throw new NotFoundException('User not found');
    }

    if (!requester.isActive) {
      throw new ForbiddenException('Access denied');
    }

    this.assertOperatorSede(dto.role, dto.sedeId);

    const cedulaHash = this.hashCedula(dto.cedula);
    const existing = await this.mesAuthRepository.findByCedulaHash(requester.tenantId, cedulaHash);
    if (existing) {
      throw new ConflictException('La cédula ya está registrada en este tenant');
    }

    const pinHash = await bcrypt.hash(dto.pin, SALT_ROUNDS);
    const sedeId = dto.sedeId?.trim() ?? null;

    let user: OperationalUser;
    try {
      user = await this.mesAuthRepository.createUser({
        tenantId: requester.tenantId,
        cedulaHash,
        pinHash,
        role: dto.role,
        sedeId,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('La cédula ya está registrada en este tenant');
      }
      throw error;
    }

    return {
      id: user.id,
      cedula: this.maskCedula(dto.cedula),
      role: user.role,
      tenantId: user.tenantId,
      sedeId: user.sedeId,
    };
  }

  private assertOperatorSede(role: OperationalRole, sedeId?: string): void {
    if (role === OperationalRole.OPERATOR && !sedeId?.trim()) {
      throw new BadRequestException('sedeId is required for OPERATOR role');
    }
  }

  private maskCedula(cedula: string): string {
    if (cedula.length <= 4) {
      return '****';
    }
    return `${'*'.repeat(cedula.length - 4)}${cedula.slice(-4)}`;
  }

  private assertCredentialsFormat(cedula: string, pin: string): void {
    if (!CEDULA_PATTERN.test(cedula) || !PIN_PATTERN.test(pin)) {
      throw new UnauthorizedException(GENERIC_AUTH_MESSAGE);
    }
  }

  private hashCedula(cedula: string): string {
    const hmacSecret = process.env.CEDULA_HMAC_SECRET;
    if (hmacSecret) {
      return crypto.createHmac('sha256', hmacSecret).update(cedula).digest('hex');
    }
    return crypto.createHash('sha256').update(cedula).digest('hex');
  }

  private async handleFailedLogin(user: OperationalUser): Promise<void> {
    await this.mesAuthRepository.incrementLoginAttempts(user.id);
    if (user.loginAttempts + 1 >= MAX_ATTEMPTS) {
      await this.mesAuthRepository.lockUser(user.id, new Date(Date.now() + LOCK_DURATION_MS));
    }
  }

  private async issueTokens(user: OperationalUser): Promise<MesAuthTokens> {
    const jti = randomUUID();
    const payload: MesJwtPayload = {
      sub: user.id,
      cedulaHash: user.cedulaHash,
      role: user.role,
      sedeId: user.sedeId,
      tenantId: user.tenantId,
      jti,
    };

    const accessSecret =
      process.env.MES_JWT_SECRET || process.env.JWT_SECRET || 'mes-dev-secret-change-in-production';
    const refreshSecret =
      process.env.MES_JWT_REFRESH_SECRET ||
      process.env.JWT_MES_REFRESH_SECRET ||
      process.env.JWT_REFRESH_SECRET ||
      'mes-dev-refresh-secret-change-in-production';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: ACCESS_TOKEN_TTL,
        secret: accessSecret,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: REFRESH_TOKEN_TTL,
        secret: refreshSecret,
      }),
    ]);

    const hashedRefresh = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await this.mesAuthRepository.saveRefreshToken(user.id, hashedRefresh);

    return {
      accessToken,
      refreshToken,
      operator: {
        id: user.id,
        role: user.role,
        tenantId: user.tenantId,
        sedeId: user.sedeId,
      },
    };
  }
}
