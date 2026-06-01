import { builder } from '../builder';
import { SupplierProductObject } from './supplier-product';
import { requireAuth } from '../../auth/roles.guard';

const CreateSupplierProductInput = builder.inputType('CreateSupplierProductInput', {
  description: 'Input for linking a supply item to a supplier catalog',
  fields: (t) => ({
    supplierId: t.id({ required: true }),
    supplyItemId: t.id({ required: true }),
    precioUnitario: t.float({ required: true }),
    unidadCompra: t.string({ required: true }),
    factorConversion: t.float({ required: true }),
    tiempoEntregaDias: t.int({ required: false, defaultValue: 1 }),
    esProveedorPrincipal: t.boolean({ required: false, defaultValue: false }),
  }),
});

const UpdateSupplierProductInput = builder.inputType('UpdateSupplierProductInput', {
  description: 'Input for updating supplier catalog terms',
  fields: (t) => ({
    precioUnitario: t.float({ required: false }),
    unidadCompra: t.string({ required: false }),
    factorConversion: t.float({ required: false }),
    tiempoEntregaDias: t.int({ required: false }),
    esProveedorPrincipal: t.boolean({ required: false }),
  }),
});

builder.mutationField('createSupplierProduct', (t) =>
  t.field({
    type: SupplierProductObject,
    description: 'Link a supply item to a supplier catalog',
    authScopes: { isAuthenticated: true },
    args: {
      input: t.arg({ type: CreateSupplierProductInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);
      return ctx.services.supplierProduct.create(user.tenantId, args.input);
    },
  }),
);

builder.mutationField('updateSupplierProduct', (t) =>
  t.field({
    type: SupplierProductObject,
    description: 'Update supplier catalog terms for a linked product',
    authScopes: { isAuthenticated: true },
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateSupplierProductInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);
      return ctx.services.supplierProduct.update(String(args.id), user.tenantId, args.input);
    },
  }),
);

builder.mutationField('deleteSupplierProduct', (t) =>
  t.boolean({
    description: 'Remove a supply item from a supplier catalog',
    authScopes: { isAuthenticated: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);
      return ctx.services.supplierProduct.delete(String(args.id), user.tenantId);
    },
  }),
);
