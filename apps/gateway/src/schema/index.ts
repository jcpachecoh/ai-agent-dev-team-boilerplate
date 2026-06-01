/**
 * schema/index.ts — assembles the full Pothos schema.
 *
 * Import order matters: scalars and shared types must be registered before
 * object types that reference them, and mutation/query/subscription fields
 * must be registered before builder.toSchema() is called.
 */

// 1. Scalars + shared types
import './shared/scalars';
import './shared/types';

// 2. Domain object types
import './user/user';
import './supplier/supplier';
import './supply-item/supply-item';
import './supplier-product/supplier-product';
import './recipe/recipe';

// 3. Query root — must define builder.queryType before any queryField calls
import { builder } from './builder';

builder.queryType({
  description: 'RestOpsIQ GraphQL query root',
  fields: () => ({}),
});

// 4. Query fields
import './user/user.query';
import './supplier/supplier.query';
import './supply-item/supply-item.query';
import './supplier-product/supplier-product.query';
import './recipe/recipe.query';

// 5. Mutation root + fields
// auth.mutation.ts calls builder.mutationType — import it once
import './auth/auth.mutation';
// Additional mutation fields
import './user/user.mutation';
import './supplier/supplier.mutation';
import './supplier-product/supplier-product.mutation';
import './recipe/recipe.mutation';

// 6. Subscription root + fields
builder.subscriptionType({
  description: 'RestOpsIQ GraphQL subscription root',
  fields: () => ({}),
});

import './supplier/supplier.subscription';
import './recipe/recipe.subscription';

// 7. Auth query (re-exports user.query, which is already imported above — safe)
// No-op import kept for clarity
// import './auth/auth.query';

export const schema = builder.toSchema();
