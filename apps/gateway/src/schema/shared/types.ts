import { builder } from '../builder';

// ─── PageInfo ─────────────────────────────────────────────────────────────────

export interface PageInfoShape {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount?: number;
}

export const PageInfoObject = builder.objectRef<PageInfoShape>('PageInfo');

PageInfoObject.implement({
  description: 'Pagination cursor metadata',
  fields: (t) => ({
    hasNextPage: t.boolean({ resolve: (p) => p.hasNextPage }),
    hasPreviousPage: t.boolean({ resolve: (p) => p.hasPreviousPage }),
    totalCount: t.int({ nullable: true, resolve: (p) => p.totalCount ?? null }),
  }),
});

// ─── ErrorInterface (Pothos errors plugin) ───────────────────────────────────

export const ErrorInterface = builder.interfaceRef<Error>('Error');

ErrorInterface.implement({
  description: 'Base interface for all application errors exposed in the schema',
  fields: (t) => ({
    message: t.exposeString('message'),
  }),
});

// ─── BaseError object (concrete implementation) ──────────────────────────────

builder.objectType(Error, {
  name: 'BaseError',
  interfaces: [ErrorInterface],
});
