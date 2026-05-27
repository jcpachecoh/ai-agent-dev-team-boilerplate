import { builder } from '../builder';
import { Supplier } from '@prisma/client';

/**
 * GraphQL type for the Supplier model.
 */
export const SupplierObject = builder.objectRef<Supplier>('Supplier');

SupplierObject.implement({
  description: 'A product/service supplier',
  fields: (t) => ({
    id: t.exposeID('id'),
    tenantId: t.exposeString('tenantId'),
    razonSocial: t.exposeString('razonSocial'),
    nit: t.exposeString('nit'),
    dv: t.exposeString('dv', { nullable: true }),
    tipo: t.exposeString('tipo'),
    direccion: t.exposeString('direccion', { nullable: true }),
    ciudad: t.exposeString('ciudad', { nullable: true }),
    telefono: t.exposeString('telefono', { nullable: true }),
    email: t.exposeString('email', { nullable: true }),
    contactoNombre: t.exposeString('contactoNombre', { nullable: true }),
    condicionPago: t.exposeString('condicionPago'),
    cupoCredito: t.exposeInt('cupoCredito'),
    calificacion: t.float({
      description: 'Supplier quality rating (0–5)',
      resolve: (s) => Number(s.calificacion),
    }),
    isActive: t.exposeBoolean('isActive'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});
