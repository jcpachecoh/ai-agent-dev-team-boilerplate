import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '../config/env';
import { AuthenticationError } from '../utils/errors';
import { JwtPayload, AuthUser } from './types';

const BCRYPT_ROUNDS = 12;

export class AuthService {
  /**
   * Sign a JWT token with the application secret.
   */
  signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    });
  }

  /**
   * Verify a JWT token. Throws AuthenticationError if invalid or expired.
   */
  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
      }) as JwtPayload;
      return decoded;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expired');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token');
      }
      throw new AuthenticationError('Token verification failed');
    }
  }

  /**
   * Extract the Bearer token from an Authorization header.
   * Returns undefined if the header is missing or malformed.
   */
  extractToken(authHeader: string | undefined): string | undefined {
    if (!authHeader) return undefined;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') return undefined;
    return parts[1];
  }

  /**
   * Hash a PIN using bcrypt.
   */
  async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, BCRYPT_ROUNDS);
  }

  /**
   * Compare a plain-text PIN against a bcrypt hash.
   */
  async comparePin(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
  }

  /**
   * Hash a cédula using SHA-256 for deterministic lookup.
   * Not a security measure for storage — just a lookup key.
   */
  hashCedula(cedula: string): string {
    return crypto.createHash('sha256').update(cedula.trim()).digest('hex');
  }

  /**
   * Build an AuthUser from a verified JwtPayload.
   */
  toAuthUser(payload: JwtPayload): AuthUser {
    return {
      id: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role as AuthUser['role'],
      sedeId: payload.sedeId,
    };
  }
}

// Singleton instance
export const authService = new AuthService();
