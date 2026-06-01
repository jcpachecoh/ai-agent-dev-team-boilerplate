import { builder } from '../builder';
import { SupplyItemObject } from './supply-item';
import { requireAuth } from '../../auth/roles.guard';

builder.queryField('supplyItems', (t) =>
  t.field({
    type: [SupplyItemObject],
    description: 'Search supply items for linking to a supplier catalog',
    authScopes: { isAuthenticated: true },
    args: {
      search: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);
      return ctx.services.supplyItem.findAll(user.tenantId, {
        search: args.search,
        limit: args.limit,
      });
    },
  }),
);
