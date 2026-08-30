# Task: domain modules — supplier, supplier-product, supply-item, recipe, purchase-order

**Domain:** `[BACKEND]`  
**Assigned Agent:** backend-developer  
**Status:** `pending`  
**Created:** 2026-06-02  
**Depends On:** `03-graphql-core.md`

---

## Context

The current gateway has five domain services and their Pothos-based resolvers:

| Domain          | Current service               | Current schema files       |
| --------------- | ----------------------------- | -------------------------- |
| Supplier        | `supplier.service.ts`         | `schema/supplier/`         |
| SupplierProduct | `supplier-product.service.ts` | `schema/supplier-product/` |
| SupplyItem      | `supply-item.service.ts`      | `schema/supply-item/`      |
| Recipe          | `recipe.service.ts`           | `schema/recipe/`           |
| PurchaseOrder   | `purchase-order.service.ts`   | `schema/purchase-order/`   |

Each domain must be extracted into a self-contained NestJS module following the
`interfaces/ → repository/ → service/ → resolver/ → test/` convention from
`docs/MODULE-STRUCTURE.md`. **All existing GraphQL field and mutation names must be
preserved** to avoid breaking the web-app and plant clients.

---

## Requirements

For **each** of the five domains:

- [ ] `interfaces/{domain}.interfaces.ts` — input types, result types, `I{Domain}Repository`,
      `I{Domain}Service` (interfaces only)
- [ ] `repository/{domain}.repository.ts` — Prisma queries, no HTTP exceptions, implements
      `I{Domain}Repository`
- [ ] `service/{domain}.service.ts` — business logic, throws NestJS HTTP exceptions,
      implements `I{Domain}Service`
- [ ] `resolver/{domain}.resolver.ts` — `@Resolver()` with `@Query()` / `@Mutation()` /
      `@Subscription()` matching existing field names exactly
- [ ] `{domain}.module.ts` — imports `PrismaModule`, exports service
- [ ] `test/{domain}.service.spec.ts` — unit tests, happy path + error paths
- [ ] Tenant isolation enforced: every query/mutation receives `tenantId` from `@CurrentUser()`

### Specific resolver shapes to preserve

**Supplier**

- `Query.suppliers(pagination)` → `SupplierConnection`
- `Mutation.createSupplier(input)`, `updateSupplier(id, input)`, `deleteSupplier(id)`

**SupplierProduct**

- `Query.supplierProducts(supplierId, pagination)`
- `Mutation.createSupplierProduct`, `updateSupplierProduct`, `deleteSupplierProduct`

**SupplyItem**

- `Query.supplyItems(pagination, filters)` → `SupplyItemConnection`
- `Query.supplyItem(id)` → `SupplyItem`
- `Mutation.createSupplyItem`, `updateSupplyItem`, `deactivateSupplyItem`

**Recipe**

- `Query.recipes(pagination)`, `Query.recipe(id)`
- `Mutation.createRecipe`, `updateRecipe`

**PurchaseOrder**

- `Query.purchaseOrders(filters, pagination)`, `Query.purchaseOrder(id)`
- `Mutation.createPurchaseOrder`, `approvePurchaseOrder`, `cancelPurchaseOrder`

---

## Acceptance Criteria

- [ ] All queries and mutations listed above return correct data in dev environment
- [ ] Every repository method has a corresponding integration test stub (can be skipped with
      `NODE_ENV=test` guard but must exist)
- [ ] Service unit tests cover at least: not-found error, conflict error, happy path
- [ ] `pnpm tsc --noEmit` passes with zero errors
- [ ] No direct `PrismaService` injection in resolvers or services — only via repository

---

## Files to Create or Modify

For each domain `{d}` in `[supplier, supplier-product, supply-item, recipe, purchase-order]`:

- `apps/gateway/src/{d}/interfaces/{d}.interfaces.ts`
- `apps/gateway/src/{d}/repository/{d}.repository.ts`
- `apps/gateway/src/{d}/service/{d}.service.ts`
- `apps/gateway/src/{d}/resolver/{d}.resolver.ts`
- `apps/gateway/src/{d}/{d}.module.ts`
- `apps/gateway/src/{d}/test/{d}.service.spec.ts`
- `apps/gateway/src/app.module.ts` — import each new module
