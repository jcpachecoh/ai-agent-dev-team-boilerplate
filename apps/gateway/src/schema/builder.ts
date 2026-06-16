import SchemaBuilder from '@pothos/core';
import ErrorsPlugin from '@pothos/plugin-errors';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import ValidationPlugin from '@pothos/plugin-validation';
import DataloaderPlugin from '@pothos/plugin-dataloader';
import type { ForbiddenResult } from '@pothos/plugin-scope-auth';
import { GraphQLContext } from '../context/types';
import { UserRole } from '../auth/types';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

export type { UserRole };

/**
 * Pothos SchemaBuilder configured with all plugins.
 *
 * Auth scopes:
 *  - `isAuthenticated`  — any logged-in user
 *  - `hasRole`          — specific role(s) required
 */
export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  AuthScopes: {
    isAuthenticated: boolean;
    hasRole: UserRole | UserRole[];
  };
  AuthContexts: {
    isAuthenticated: GraphQLContext & { user: NonNullable<GraphQLContext['user']> };
    hasRole: GraphQLContext & { user: NonNullable<GraphQLContext['user']> };
  };
  Scalars: {
    DateTime: { Input: Date; Output: Date };
    JSON: { Input: unknown; Output: unknown };
  };
}>({
  plugins: [ScopeAuthPlugin, ValidationPlugin, ErrorsPlugin, DataloaderPlugin],
  scopeAuth: {
    authScopes: (context: GraphQLContext) => ({
      isAuthenticated: context.isAuthenticated,
      hasRole: (roleOrRoles: UserRole | UserRole[]) => {
        if (!context.user) return false;
        const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
        return roles.includes(context.user.role);
      },
    }),
    unauthorizedError: (
      _parent: unknown,
      _context: unknown,
      _info: unknown,
      result: ForbiddenResult,
    ) => {
      // Check if the failure is due to being unauthenticated vs unauthorized
      const msg = result.message ?? '';
      if (msg.toLowerCase().includes('unauth') || !_context) {
        return new AuthenticationError('Not authenticated');
      }
      return new AuthorizationError('Insufficient permissions');
    },
    treatErrorsAsUnauthorized: false,
  },
  errors: {},
});
