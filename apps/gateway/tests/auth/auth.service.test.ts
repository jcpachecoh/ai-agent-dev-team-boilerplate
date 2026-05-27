/**
 * AuthService tests
 *
 * Covers token signing/verification, token extraction, cedula hashing,
 * PIN comparison, and toAuthUser conversion.
 */

// Mock env so the module loads without real env vars
jest.mock('../../src/config/env', () => ({
  env: {
    JWT_SECRET: 'super-secret-key-for-testing-at-least-32-chars',
    JWT_EXPIRES_IN: '8h',
    NODE_ENV: 'test',
  },
}));

import { AuthService } from '../../src/auth/auth.service';
import { UserRole } from '../../src/auth/types';
import { AuthenticationError } from '../../src/utils/errors';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
  });

  // ─── extractToken ──────────────────────────────────────────────────────────

  describe('extractToken', () => {
    it('returns undefined for missing header', () => {
      expect(service.extractToken(undefined)).toBeUndefined();
    });

    it('returns undefined when scheme is not Bearer', () => {
      expect(service.extractToken('Basic abc123')).toBeUndefined();
    });

    it('returns undefined for malformed header (only one part)', () => {
      expect(service.extractToken('Bearer')).toBeUndefined();
    });

    it('returns the token for a valid Bearer header', () => {
      expect(service.extractToken('Bearer my.jwt.token')).toBe('my.jwt.token');
    });

    it('is case-insensitive on the Bearer scheme', () => {
      expect(service.extractToken('bearer my.jwt.token')).toBe('my.jwt.token');
    });
  });

  // ─── hashCedula ───────────────────────────────────────────────────────────

  describe('hashCedula', () => {
    it('returns a 64-character hex SHA-256 string', () => {
      const hash = service.hashCedula('12345678');
      expect(typeof hash).toBe('string');
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });

    it('is deterministic', () => {
      expect(service.hashCedula('12345678')).toBe(service.hashCedula('12345678'));
    });

    it('produces different hashes for different inputs', () => {
      expect(service.hashCedula('11111111')).not.toBe(service.hashCedula('22222222'));
    });

    it('trims leading/trailing whitespace before hashing', () => {
      expect(service.hashCedula('  12345678  ')).toBe(service.hashCedula('12345678'));
    });
  });

  // ─── signToken / verifyToken ──────────────────────────────────────────────

  describe('signToken and verifyToken', () => {
    it('signs and verifies a token round-trip', () => {
      const payload = { sub: 'user-1', tenantId: 'tenant-abc', role: UserRole.OPERATOR };
      const token = service.signToken(payload);
      const decoded = service.verifyToken(token);

      expect(decoded.sub).toBe('user-1');
      expect(decoded.tenantId).toBe('tenant-abc');
      expect(decoded.role).toBe(UserRole.OPERATOR);
    });

    it('throws AuthenticationError for a tampered token', () => {
      const token = service.signToken({ sub: 'u1', tenantId: 't1', role: UserRole.OWNER });
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => service.verifyToken(tampered)).toThrow(AuthenticationError);
    });

    it('throws AuthenticationError for a completely invalid token', () => {
      expect(() => service.verifyToken('not.a.token')).toThrow(AuthenticationError);
    });

    it('throws AuthenticationError with "Invalid token" message for bad token', () => {
      expect(() => service.verifyToken('bad.token.here')).toThrow('Invalid token');
    });
  });

  // ─── toAuthUser ───────────────────────────────────────────────────────────

  describe('toAuthUser', () => {
    it('converts a JwtPayload into an AuthUser', () => {
      const payload = {
        sub: 'user-42',
        tenantId: 'tenant-xyz',
        role: UserRole.MANAGER,
        sedeId: 'sede-1',
        iat: 1000,
        exp: 9999999999,
      };
      const user = service.toAuthUser(payload);
      expect(user.id).toBe('user-42');
      expect(user.tenantId).toBe('tenant-xyz');
      expect(user.role).toBe(UserRole.MANAGER);
      expect(user.sedeId).toBe('sede-1');
    });

    it('sets sedeId to undefined when not present in payload', () => {
      const payload = {
        sub: 'u1',
        tenantId: 't1',
        role: UserRole.OPERATOR,
        iat: 0,
        exp: 9999999999,
      };
      const user = service.toAuthUser(payload);
      expect(user.sedeId).toBeUndefined();
    });
  });

  // ─── comparePin ──────────────────────────────────────────────────────────

  describe('comparePin', () => {
    it('returns true for matching PIN and hash', async () => {
      const hash = await service.hashPin('5678');
      const result = await service.comparePin('5678', hash);
      expect(result).toBe(true);
    });

    it('returns false for non-matching PIN', async () => {
      const hash = await service.hashPin('5678');
      const result = await service.comparePin('9999', hash);
      expect(result).toBe(false);
    });
  });
});
