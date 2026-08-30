# PROV-LOG Task 02 — Backend API logística proveedor

**Domain:** `[BACKEND]` `[GRAPHQL]`  
**Status:** `pending`  
**Depends on:** [task-01-schema-migration.md](./task-01-schema-migration.md)

---

## Goal

Exponer creación, lectura y actualización de logística del proveedor vía GraphQL (extensión del módulo `supplier`), con validación de negocio y tenant safety.

---

## Scope

- Módulo `supplier-logistics/` **o** extensión de `supplier/` (elegir una; documentar en PR).
- Repository: CRUD `SupplierLogistics` + sync cobertura sedes.
- Service: validación COMPLETE vs DRAFT, reglas cadena de frío.
- GraphQL: campos en `Supplier` type + inputs anidados en `createSupplier` / `updateSupplier`.
- DTOs Zod en `apps/api/src/utils/validation.ts` (o schema dedicado).
- Tests unitarios service + resolver.

---

## Out of scope

- Historial audit (Task 03).
- Frontend.
- Permisos granulares nuevos en seed (usar roles existentes PROVEEDORES).

---

## Files allowed

- `apps/api/src/supplier-logistics/**` **o** archivos listados en `supplier/` si se integra ahí
- `apps/api/src/supplier/**` (service, resolver, repository, interfaces, dto)
- `apps/api/src/utils/validation.ts`
- `apps/api/src/app.module.ts` (solo wiring módulo si aplica)

---

## Files forbidden

- `apps/web-app/**`
- `packages/**`
- `package.json` / `pnpm-lock.yaml`
- Cambios de schema Prisma (salvo hotfix bloqueante)

---

## Contrato GraphQL (borrador)

```graphql
type SupplierLogistics {
  deliveryMode: SupplierDeliveryMode!
  deliveryPlace: SupplierDeliveryPlace!
  deliveryPlaceCustom: String
  deliveryDays: [Int!]!
  leadTimeDays: Int!
  timeWindowStart: String
  timeWindowEnd: String
  receptionResponsible: UserSummary
  receptionResponsibleStale: Boolean!
  transportType: SupplierTransportType!
  requiresColdChain: Boolean!
  transportTempMinC: Float
  transportTempMaxC: Float
  transportCost: Float
  transportCostCurrency: String
  minimumOrderQty: Float
  minimumOrderUnit: String
  coverageLocations: [Location!]!
  status: SupplierLogisticsStatus!
}

input SupplierLogisticsInput {
  deliveryMode: SupplierDeliveryMode
  deliveryPlace: SupplierDeliveryPlace
  deliveryPlaceCustom: String
  deliveryDays: [Int!]
  leadTimeDays: Int
  timeWindowStart: String
  timeWindowEnd: String
  receptionResponsibleUserId: String
  transportType: SupplierTransportType
  requiresColdChain: Boolean
  transportTempMinC: Float
  transportTempMaxC: Float
  transportCost: Float
  transportCostCurrency: String
  minimumOrderQty: Float
  minimumOrderUnit: String
  coverageLocationIds: [ID!]
}

# En CreateSupplierInput / UpdateSupplierInput:
# logistics: SupplierLogisticsInput
# saveLogisticsAsDraft: Boolean
```

---

## Reglas de validación (COMPLETE)

| Regla                                                                                                               | Error                 |
| ------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `deliveryMode`, `deliveryPlace`, `leadTimeDays`, `deliveryDays` (≥1), `receptionResponsibleUserId`, `transportType` | `400` campo requerido |
| `deliveryPlace = OTHER` sin `deliveryPlaceCustom`                                                                   | `400`                 |
| `leadTimeDays` no entero positivo                                                                                   | `400`                 |
| `requiresColdChain = true` sin rango temperatura                                                                    | `400`                 |
| `timeWindowStart` > `timeWindowEnd`                                                                                 | `400`                 |
| Usuario recepción fuera del tenant                                                                                  | `403` / `404`         |
| `coverageLocationIds` con sede de otro tenant                                                                       | `403`                 |

`saveLogisticsAsDraft: true` → persiste con `status = DRAFT`, sin reglas anteriores.

---

## Acceptance criteria

- [ ] `createSupplier` con `logistics` + `saveLogisticsAsDraft: false` valida obligatorios.
- [ ] `updateSupplier` actualiza logística y cobertura (replace all locations).
- [ ] Query `supplier(id)` devuelve nodo `logistics` o `null`.
- [ ] Tests service cubren cold chain, días vacíos, tenant isolation.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern="supplier-logistics|supplier.service|supplier.resolver"
```
