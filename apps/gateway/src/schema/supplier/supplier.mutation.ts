import { builder } from '../builder';
import { SupplierObject } from './supplier';
import { requireAuth } from '../../auth/roles.guard';

// ─── Input types ─────────────────────────────────────────────────────────────

const CreateSupplierInput = builder.inputType('CreateSupplierInput', {
  description: 'Input for creating a new supplier',
  fields: (t) => ({
    razonSocial: t.string({ required: true }),
    nit: t.string({ required: true }),
    dv: t.string({ required: false }),
    tipo: t.string({ required: true }),
    direccion: t.string({ required: false }),
    ciudad: t.string({ required: false }),
    telefono: t.string({ required: false }),
    email: t.string({ required: false }),
    contactoNombre: t.string({ required: false }),
    condicionPago: t.string({ required: true }),
    cupoCredito: t.int({ required: false, defaultValue: 0 }),
    calificacion: t.float({ required: false, defaultValue: 3 }),
  }),
});

const UpdateSupplierInput = builder.inputType('UpdateSupplierInput', {
  description: 'Input for updating an existing supplier',
  fields: (t) => ({
    razonSocial: t.string({ required: false }),
    nit: t.string({ required: false }),
    dv: t.string({ required: false }),
    tipo: t.string({ required: false }),
    direccion: t.string({ required: false }),
    ciudad: t.string({ required: false }),
    telefono: t.string({ required: false }),
    email: t.string({ required: false }),
    contactoNombre: t.string({ required: false }),
    condicionPago: t.string({ required: false }),
    cupoCredito: t.int({ required: false }),
    calificacion: t.float({ required: false }),
    isActive: t.boolean({ required: false }),
  }),
});

// ─── Mutations ────────────────────────────────────────────────────────────────

builder.mutationField('createSupplier', (t) =>
  t.field({
    type: SupplierObject,
    description: 'Create a new supplier for the authenticated tenant',
    authScopes: { isAuthenticated: true },
    args: {
      input: t.arg({ type: CreateSupplierInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);
      return ctx.services.supplier.create(user.tenantId, args.input);
    },
  }),
);

builder.mutationField('updateSupplier', (t) =>
  t.field({
    type: SupplierObject,
    description: 'Update an existing supplier',
    authScopes: { isAuthenticated: true },
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateSupplierInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);
      return ctx.services.supplier.update(String(args.id), user.tenantId, args.input);
    },
  }),
);

builder.mutationField('deleteSupplier', (t) =>
  t.boolean({
    description: 'Soft-delete a supplier (sets isActive = false)',
    authScopes: { isAuthenticated: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);
      return ctx.services.supplier.delete(String(args.id), user.tenantId);
    },
  }),
);
