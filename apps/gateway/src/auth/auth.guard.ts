import { Request } from 'express';
import { authService } from './auth.service';
import { AuthUser } from './types';
import { createChildLogger } from '../utils/logging';

const log = createChildLogger('auth.guard');

/**
 * Extracts and verifies a Bearer token from the request's Authorization header.
 * Returns an AuthUser if valid, or null for unauthenticated requests.
 * Does NOT throw — callers decide whether auth is required.
 */
export function authenticate(req: Request): AuthUser | null {
  const authHeader = req.headers['authorization'];
  const token = authService.extractToken(authHeader);

  if (!token) {
    return null;
  }

  try {
    const payload = authService.verifyToken(token);
    return authService.toAuthUser(payload);
  } catch (err) {
    log.debug({ err }, 'Token verification failed — treating as unauthenticated');
    return null;
  }
}
