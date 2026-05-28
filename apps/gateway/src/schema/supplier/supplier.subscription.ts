import { Supplier } from '@prisma/client';
import { builder } from '../builder';
import { SupplierObject } from './supplier';
import { pubsub } from '../pubsub';

builder.subscriptionField('supplierUpdated', (t) =>
  t.field({
    type: SupplierObject,
    description: 'Subscribe to supplier update events for the authenticated tenant',
    authScopes: { isAuthenticated: true },
    subscribe: (_root, _args, ctx): AsyncIterable<Supplier> => {
      const tenantId = ctx.tenantId ?? '';
      return pubsub.asyncIterator<Supplier>(`SUPPLIER_UPDATED:${tenantId}`);
    },
    resolve: (payload: Supplier) => payload,
  }),
);

builder.subscriptionField('supplierCreated', (t) =>
  t.field({
    type: SupplierObject,
    description: 'Subscribe to new supplier creation events for the authenticated tenant',
    authScopes: { isAuthenticated: true },
    subscribe: (_root, _args, ctx): AsyncIterable<Supplier> => {
      const tenantId = ctx.tenantId ?? '';
      return pubsub.asyncIterator<Supplier>(`SUPPLIER_CREATED:${tenantId}`);
    },
    resolve: (payload: Supplier) => payload,
  }),
);

// ─── Helpers for publishing events ────────────────────────────────────────────

export function publishSupplierCreated(tenantId: string, supplier: Supplier): void {
  pubsub.publish(`SUPPLIER_CREATED:${tenantId}`, supplier);
}

export function publishSupplierUpdated(tenantId: string, supplier: Supplier): void {
  pubsub.publish(`SUPPLIER_UPDATED:${tenantId}`, supplier);
}
