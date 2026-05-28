import { OperationalUser } from '@prisma/client';
import { BaseService } from './base.service';
import { AuthenticationError } from '../utils/errors';
import { authService } from '../auth/auth.service';
import { MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MS } from '../utils/constants';

export interface LoginResult {
  user: OperationalUser;
  token: string;
}

export class GatewayAuthService extends BaseService {
  /**
   * Full MES login flow:
   * 1. Hash the cedula deterministically for lookup
   * 2. Find OperationalUser by tenantId + cedulaHash
   * 3. Check account lockout
   * 4. Verify PIN via bcrypt
   * 5. On failure: increment loginAttempts, lock if threshold exceeded
   * 6. On success: reset loginAttempts, update lastLoginAt, return JWT
   */
  async loginWithPin(cedula: string, pin: string, tenantId: string): Promise<LoginResult> {
    const cedulaHash = authService.hashCedula(cedula);

    const user = await this.prisma.operationalUser.findUnique({
      where: { tenantId_cedulaHash: { tenantId, cedulaHash } },
    });

    if (!user) {
      // Constant-time response to avoid user enumeration
      await authService.comparePin(pin, '$2b$12$invalidhashfortimingprotection00000000000000000');
      throw new AuthenticationError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMins = Math.ceil(remainingMs / 60000);
      throw new AuthenticationError(
        `Account is locked. Try again in ${remainingMins} minute${remainingMins !== 1 ? 's' : ''}`,
      );
    }

    const pinValid = await authService.comparePin(pin, user.pinHash);

    if (!pinValid) {
      const newAttempts = user.loginAttempts + 1;
      const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

      await this.prisma.operationalUser.update({
        where: { id: user.id },
        data: {
          loginAttempts: newAttempts,
          ...(shouldLock ? { lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) } : {}),
        },
      });

      if (shouldLock) {
        throw new AuthenticationError(`Too many failed attempts. Account locked for 15 minutes.`);
      }

      const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
      throw new AuthenticationError(
        `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      );
    }

    // Success — reset lockout state
    const updatedUser = await this.prisma.operationalUser.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const token = authService.signToken({
      sub: updatedUser.id,
      tenantId: updatedUser.tenantId,
      role: updatedUser.role,
      sedeId: updatedUser.sedeId ?? undefined,
    });

    return { user: updatedUser, token };
  }

  /**
   * Fetch an OperationalUser by id. Throws AuthenticationError if not found.
   */
  async getUserById(id: string): Promise<OperationalUser> {
    const user = await this.prisma.operationalUser.findUnique({ where: { id } });
    if (!user) throw new AuthenticationError('User not found');
    return user;
  }
}
