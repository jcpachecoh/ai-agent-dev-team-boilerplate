import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { AuthTokens, IAuthService, JwtPayload } from '../interfaces/auth.interfaces';
import { AuthRepository } from '../repository/auth.repository';
import { AuthEmailRepository } from '../repository/auth-email.repository';
import type { SignupDto } from '../controller/dto/signup.dto';
import type { LoginDto } from '../controller/dto/login.dto';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const DEFAULT_ROLE_CODE = 'OPERATOR';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authEmailRepository: AuthEmailRepository,
    private readonly jwtService: JwtService,
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
    return this.issueTokens(user.id, user.email);
  }

  async login(tenantId: string, dto: LoginDto): Promise<AuthTokens> {
    const resolvedTenantId = this.requireTenantId(tenantId);

    const user = await this.authRepository.findByTenantAndEmailForAuth(resolvedTenantId, dto.email);
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id, user.email);
  }

  async refresh(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.authRepository.findByIdForRefresh(userId);
    if (!user?.refreshToken || !user.isActive || user.deletedAt) {
      throw new ForbiddenException('Access denied');
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) {
      throw new ForbiddenException('Access denied');
    }

    return this.issueTokens(user.id, user.email);
  }

  async logout(userId: string): Promise<void> {
    await this.authRepository.saveRefreshToken(userId, null);
  }

  findByTenantAndEmail(tenantId: string, email: string) {
    return this.authRepository.findByTenantAndEmail(this.requireTenantId(tenantId), email);
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
