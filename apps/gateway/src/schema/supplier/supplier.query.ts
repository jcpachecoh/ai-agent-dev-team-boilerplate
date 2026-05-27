import { builder } from '../builder';
import { SupplierObject } from './supplier';
import { requireAuth } from '../../auth/roles.guard';

builder.queryField('suppliers', (t) =>
  t.field({
    type: [SupplierObject],
    description: 'List all active suppliers for the authenticated tenant',
    authScopes: { isAuthenticated: true },
    args: {
      filter: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
      offset: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);
      return ctx.services.supplier.findAll(user.tenantId, {
        filter: args.filter,
        limit: args.limit,
        offset: args.offset,
      });
    },
  }),
);

builder.queryField('supplier', (t) =>
  t.field({
    type: SupplierObject,
    nullable: true,
    description: 'Find a single supplier by id (scoped to the authenticated tenant)',
    authScopes: { isAuthenticated: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);
      return ctx.services.supplier.findById(String(args.id), user.tenantId);
    },
  }),
);

builder.queryField('searchSuppliers', (t) =>
  t.field({
    type: [SupplierObject],
    description: 'Full-text search suppliers by razonSocial, NIT, or contact name',
    authScopes: { isAuthenticated: true },
    args: {
      query: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);
      return ctx.services.supplier.search(user.tenantId, args.query);
    },
  }),
);
