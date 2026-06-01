import { builder } from '../builder';
import { SupplierProductObject } from './supplier-product';
import { requireAuth } from '../../auth/roles.guard';

builder.queryField('supplierProducts', (t) =>
  t.field({
    type: [SupplierProductObject],
    description: 'Catalog products linked to a supplier',
    authScopes: { isAuthenticated: true },
    args: {
      supplierId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);
      return ctx.services.supplierProduct.findBySupplierId(user.tenantId, String(args.supplierId));
    },
  }),
);
