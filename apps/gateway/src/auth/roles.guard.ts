import { AuthUser, UserRole } from './types';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

/**
 * Asserts the request is authenticated.
 * Throws AuthenticationError if user is null.
 */
export function requireAuth(user: AuthUser | null): AuthUser {
  if (!user) {
    throw new AuthenticationError('You must be logged in to perform this action');
  }
  return user;
}

/**
 * Asserts the authenticated user has one of the required roles.
 * Throws AuthenticationError if not logged in, AuthorizationError if wrong role.
 */
export function requireRole(user: AuthUser | null, ...roles: UserRole[]): AuthUser {
  const authed = requireAuth(user);
  if (!roles.includes(authed.role)) {
    throw new AuthorizationError(
      `Access denied. Required roles: ${roles.join(', ')}. Your role: ${authed.role}`,
    );
  }
  return authed;
}
