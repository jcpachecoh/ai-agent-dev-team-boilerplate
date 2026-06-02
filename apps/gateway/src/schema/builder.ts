import SchemaBuilder from '@pothos/core';
import ErrorsPlugin from '@pothos/plugin-errors';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import ValidationPlugin from '@pothos/plugin-validation';
import DataloaderPlugin from '@pothos/plugin-dataloader';
import { GraphQLContext } from '../context/types';
import { UserRole } from '../auth/types';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

export type { UserRole };

/**
 * Pothos SchemaBuilder configured with all plugins.
 *
 * Auth scopes:
 *  - `isAuthenticated`             — any supported JWT (global or operational)
 *  - `isGlobalAuthenticated`         — global User JWT only
 *  - `isOperationalAuthenticated`    — operational MES JWT only
 *  - `hasRole`                       — operational role check (legacy resolvers)
 */
export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  AuthScopes: {
    isAuthenticated: boolean;
    isGlobalAuthenticated: boolean;
    isOperationalAuthenticated: boolean;
    hasRole: UserRole | UserRole[];
  };
  AuthContexts: {
    isAuthenticated: GraphQLContext & { isAuthenticated: true };
    isGlobalAuthenticated: GraphQLContext & {
      authKind: 'global';
      globalUser: NonNullable<GraphQLContext['globalUser']>;
    };
    isOperationalAuthenticated: GraphQLContext & {
      authKind: 'operational';
      operationalUser: NonNullable<GraphQLContext['operationalUser']>;
      user: NonNullable<GraphQLContext['user']>;
    };
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
      isGlobalAuthenticated: context.isGlobalAuthenticated,
      isOperationalAuthenticated: context.isOperationalAuthenticated,
      hasRole: (roleOrRoles: UserRole | UserRole[]) => {
        if (context.authKind !== 'operational' || !context.user) return false;
        const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
        return roles.includes(context.user.role);
      },
    }),
    unauthorizedError: (_parent: unknown, context: GraphQLContext) => {
      if (!context.isAuthenticated) {
        return new AuthenticationError('Not authenticated');
      }
      return new AuthorizationError('Insufficient permissions');
    },
    treatErrorsAsUnauthorized: false,
  },
  errors: {},
});
