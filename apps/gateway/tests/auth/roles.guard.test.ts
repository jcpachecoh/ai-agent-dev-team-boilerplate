/**
 * roles.guard tests
 *
 * Covers requireAuth (already partially covered) and requireRole.
 */

import { requireAuth, requireRole } from '../../src/auth/roles.guard';
import { AuthenticationError, AuthorizationError } from '../../src/utils/errors';
import { UserRole, AuthUser } from '../../src/auth/types';

function makeUser(role: UserRole = UserRole.OPERATOR): AuthUser {
  return { id: 'u1', tenantId: 't1', role };
}

describe('requireAuth', () => {
  it('throws AuthenticationError when user is null', () => {
    expect(() => requireAuth(null)).toThrow(AuthenticationError);
  });

  it('returns the user when authenticated', () => {
    const user = makeUser();
    expect(requireAuth(user)).toBe(user);
  });
});

describe('requireRole', () => {
  it('throws AuthenticationError when user is null', () => {
    expect(() => requireRole(null, UserRole.OWNER)).toThrow(AuthenticationError);
  });

  it('throws AuthorizationError when user has wrong role', () => {
    const user = makeUser(UserRole.OPERATOR);
    expect(() => requireRole(user, UserRole.OWNER)).toThrow(AuthorizationError);
  });

  it('returns user when user has the required role', () => {
    const user = makeUser(UserRole.OWNER);
    expect(requireRole(user, UserRole.OWNER)).toBe(user);
  });

  it('returns user when role matches one of multiple allowed roles', () => {
    const user = makeUser(UserRole.MANAGER);
    expect(requireRole(user, UserRole.OWNER, UserRole.MANAGER)).toBe(user);
  });

  it('AuthorizationError message lists required roles', () => {
    const user = makeUser(UserRole.OPERATOR);
    try {
      requireRole(user, UserRole.OWNER, UserRole.MANAGER);
      fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthorizationError);
      const ae = err as AuthorizationError;
      expect(ae.message).toContain('OWNER');
      expect(ae.message).toContain('MANAGER');
    }
  });
});
