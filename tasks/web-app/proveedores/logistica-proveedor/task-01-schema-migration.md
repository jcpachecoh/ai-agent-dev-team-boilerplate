# PROV-LOG Task 01 — Prisma schema + migración: logística proveedor

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `pending`  
**Depends on:** [00-epic-and-decisions.md](./00-epic-and-decisions.md)

---

## Goal

Modelar la información logística del proveedor en Prisma: relación 1:1 con `Supplier`, cobertura por sedes (`Location`) y estado borrador/completo.

---

## Scope

- Enums: `SupplierDeliveryMode`, `SupplierDeliveryPlace`, `SupplierTransportType`, `SupplierLogisticsStatus`.
- Modelo `SupplierLogistics` con todos los campos del catálogo.
- Tabla puente `SupplierLogisticsCoverage` (`supplierLogisticsId` + `locationId`).
- Relación inversa en `Supplier`, `User`, `Location`.
- Migración SQL idempotente.
- `prisma format`, `prisma validate`, `prisma generate`.

---

## Out of scope

- Código en `apps/api/src/`.
- GraphQL / REST.
- Seeds de datos de ejemplo (opcional un registro en seed de proveedor demo).

---

## Files allowed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed.ts` (solo si se agrega registro demo opcional)
- `apps/api/prisma/migrations/**` (solo migración de esta task)

---

## Files forbidden

- `apps/api/src/**`
- `apps/web-app/**`
- `packages/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`

---

## Campos y tipos

| Campo Prisma                              | Tipo                      | Notas                                 |
| ----------------------------------------- | ------------------------- | ------------------------------------- |
| `deliveryMode`                            | `SupplierDeliveryMode`    | Obligatorio en COMPLETE               |
| `deliveryPlace`                           | `SupplierDeliveryPlace`   | Obligatorio en COMPLETE               |
| `deliveryPlaceCustom`                     | `String?`                 | Requerido si `deliveryPlace = OTHER`  |
| `deliveryDays`                            | `Int[]`                   | 1–6 (Lun–Sáb), al menos 1 en COMPLETE |
| `leadTimeDays`                            | `Int`                     | > 0                                   |
| `timeWindowStart` / `timeWindowEnd`       | `String?`                 | Formato `HH:mm`                       |
| `receptionResponsibleUserId`              | `String`                  | FK `User`                             |
| `transportType`                           | `SupplierTransportType`   | OWN / THIRD_PARTY                     |
| `requiresColdChain`                       | `Boolean`                 | default false                         |
| `transportTempMinC` / `transportTempMaxC` | `Decimal?`                | Obligatorios si cold chain            |
| `transportCost`                           | `Decimal?`                | Recomendado                           |
| `transportCostCurrency`                   | `String?` o enum          | `COP` \| `USD`                        |
| `minimumOrderQty`                         | `Decimal?`                | Recomendado                           |
| `minimumOrderUnit`                        | `String?`                 | ej. `UNIT`, `KILOGRAMS`, `BOX`        |
| `status`                                  | `SupplierLogisticsStatus` | `DRAFT` \| `COMPLETE`                 |

Índices obligatorios: `tenantId`, `supplierId` unique, `receptionResponsibleUserId`.

---

## Acceptance criteria

- [ ] Migración aplica sin error en DB vacía y con datos existentes de `suppliers`.
- [ ] `Supplier` sin registro logístico sigue siendo válido (relación opcional 1:1).
- [ ] `prisma validate` y `prisma generate` en verde.

---

## Validation commands

```bash
cd apps/api && pnpm prisma format
cd apps/api && pnpm prisma validate
cd apps/api && pnpm prisma generate
```
