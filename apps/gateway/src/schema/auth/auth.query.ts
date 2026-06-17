/**
 * auth.query.ts
 *
 * The `me` query is defined in user/user.query.ts.
 * This module re-exports it and can be extended with other auth-related queries
 * such as session introspection.
 */

// Re-export to ensure the module is side-effect loaded by schema/index.ts
export * from '../user/user.query';
