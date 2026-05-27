import { builder } from '../builder';
import { RecipeObject } from './recipe';
import { requireAuth } from '../../auth/roles.guard';

builder.queryField('recipes', (t) =>
  t.field({
    type: [RecipeObject],
    description: 'List recipes for the authenticated tenant (in-memory store until DB migration)',
    authScopes: { isAuthenticated: true },
    args: {
      limit: t.arg.int({ required: false }),
      offset: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);
      return ctx.services.recipe.findAll(user.tenantId, {
        limit: args.limit,
        offset: args.offset,
      });
    },
  }),
);

builder.queryField('recipe', (t) =>
  t.field({
    type: RecipeObject,
    nullable: true,
    description: 'Find a recipe by id',
    authScopes: { isAuthenticated: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);
      return ctx.services.recipe.findById(String(args.id), user.tenantId);
    },
  }),
);
