import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OperationalUser } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AuthRepository } from '../repository/auth.repository';
import type { IAuthService, JwtPayload, LoginResult } from '../interfaces/auth.interfaces';
import { MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MS } from '../../utils/constants';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const { sub, ...rest } = payload;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.jwtService.sign(rest as any, {
      subject: sub,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ?? '8h') as any,
    });
  }

  async loginWithPin(cedula: string, pin: string, tenantId: string): Promise<LoginResult> {
    const cedulaHash = crypto.createHash('sha256').update(cedula.trim()).digest('hex');
    const user = await this.authRepository.findUserByTenantAndCedula(tenantId, cedulaHash);

    if (!user) {
      // Constant-time response to avoid user enumeration
      await bcrypt.compare(pin, '$2b$12$invalidhashfortimingprotection00000000000000000');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMins = Math.ceil(remainingMs / 60000);
      throw new UnauthorizedException(
        `Account is locked. Try again in ${remainingMins} minute${remainingMins !== 1 ? 's' : ''}`,
      );
    }

    const pinValid = await bcrypt.compare(pin, user.pinHash);

    if (!pinValid) {
      const newAttempts = user.loginAttempts + 1;
      const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;
      await this.authRepository.updateLoginAttempts(
        user.id,
        newAttempts,
        shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
      );
      if (shouldLock) {
        throw new UnauthorizedException('Too many failed attempts. Account locked for 15 minutes.');
      }
      const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
      throw new UnauthorizedException(
        `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      );
    }

    const updatedUser = await this.authRepository.resetLoginAttempts(user.id);

    const token = this.signToken({
      sub: updatedUser.id,
      tenantId: updatedUser.tenantId,
      role: updatedUser.role,
      sedeId: updatedUser.sedeId ?? undefined,
    });

    return { user: updatedUser, token };
  }

  async getUserById(id: string): Promise<OperationalUser> {
    const user = await this.authRepository.findUserById(id);
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}
