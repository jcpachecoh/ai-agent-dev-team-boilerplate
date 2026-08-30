# Epic: Employee Assets — Gestión de activos asignados a empleados (OS-558)

**Domain:** `[BE]` `[GRAPHQL]` `[REST]` `[PAYROLL]`  
**Branch sugerida:** `feat/OS-558-employee-assets`  
**Status:** `pending`  
**Priority:** High  
**Jira:** https://opssynk.atlassian.net/browse/OS-558

---

## Goal

Crear el módulo `employee_assets` para gestionar activos asignados a empleados: registro, consulta histórica, actualización de estado y desvinculación trazable. Exponer CRUD vía REST y GraphQL, integrar con el motor de nómina para calcular deducciones/beneficios, y asegurar consistencia multi-tenant.

---

## Contexto actual del dominio

| Artefacto               | Estado hoy                                                         |
| ----------------------- | ------------------------------------------------------------------ |
| `EmployeeDetails`       | Modelo central de empleado — sin relación a activos                |
| `PayrollModule`         | Motor de nómina, cálculo de deducciones — sin fuente de activos    |
| `employee_positions`    | Patrón de referencia para este módulo (mismo patrón arquitectural) |
| `EmployeeCatalogOption` | Catálogo genérico — no modela activos con valor/estado             |

No existe ninguna tabla ni módulo de activos en el schema actual.

---

## Design principles

### 1. Multi-tenancy obligatorio

Toda query/mutation filtra por `tenantId` del JWT (`@CurrentUser()`).  
`EmployeeAsset.tenantId` se persiste y valida en repository/service.

### 2. Soft delete vía `status`

No hard delete de activos. El ciclo de vida se gestiona mediante el campo `status`:

- `ACTIVO` — activo asignado al empleado
- `RETORNADO` — devuelto, desvinculado del empleado
- `DADO_DE_BAJA` — fuera de servicio / irreparable

Solo activos con `status = ACTIVO` se consideran para cálculos de nómina.

### 3. Restricción de duplicados activos

Un empleado no puede tener dos activos del mismo tipo/nombre con `status = ACTIVO` simultáneamente. Validar con `ConflictException`.

### 4. Integración con nómina

El motor de nómina (`PayrollService` / `PayrollCalculationService`) debe poder consultar `employee_assets` filtrando por `employeeId` y `status = ACTIVO` para determinar deducciones o beneficios asociados.

### 5. Trazabilidad completa

Ninguna operación borra registros. Los cambios de estado quedan registrados en `updatedAt`. En MVP: el campo `status` + `value` + `assignmentDate` forman la trazabilidad básica.

### 6. API surface

| Capa    | Endpoints                                                                                 |
| ------- | ----------------------------------------------------------------------------------------- |
| REST    | `POST /employee-assets`, `GET /employee-assets?employeeId=`, `PATCH /employee-assets/:id` |
| GraphQL | `employeeAssets`, `createEmployeeAsset`, `updateEmployeeAsset`                            |

Patrón: mismo que `employee-positions` (controller + resolver dentro de `PayrollModule`).

---

## Module structure (backend)

Extender `PayrollModule` con subcapas dedicadas:

```
apps/api/src/payroll/
├── interfaces/
│   └── employee-assets.interfaces.ts
├── repository/
│   └── employee-assets.repository.ts
├── service/
│   └── employee-assets.service.ts
├── controller/
│   ├── employee-assets.controller.ts
│   └── dto/
│       ├── create-employee-asset.dto.ts
│       ├── update-employee-asset.dto.ts
│       └── employee-asset.response.dto.ts
├── resolver/
│   └── employee-assets.resolver.ts
└── test/
    ├── employee-assets.repository.spec.ts
    ├── employee-assets.service.spec.ts
    ├── employee-assets.controller.spec.ts
    └── employee-assets.resolver.spec.ts
```

---

## Subtask breakdown

| File                        | Title                                                                   | Status  |
| --------------------------- | ----------------------------------------------------------------------- | ------- |
| `01-schema.md`              | Prisma — `EmployeeAsset` + enum `AssetStatus` + FK en `EmployeeDetails` | Pending |
| `01b-migration.md`          | Migración SQL                                                           | Pending |
| `02-interfaces.md`          | Contratos repository + service                                          | Pending |
| `03-repository.md`          | `EmployeeAssetsRepository` + tests                                      | Pending |
| `04-service.md`             | `EmployeeAssetsService` + reglas de negocio + tests                     | Pending |
| `05-dtos.md`                | DTOs REST (Swagger) + InputTypes GraphQL                                | Pending |
| `06-controller.md`          | `EmployeeAssetsController` REST                                         | Pending |
| `07-resolver.md`            | `EmployeeAssetsResolver` GraphQL                                        | Pending |
| `08-payroll-integration.md` | Integración con motor de nómina (`PayrollCalculationService`)           | Pending |
| `09-module-wiring.md`       | Registrar en `PayrollModule` + validate-structure                       | Pending |
| `10-tests-rollout.md`       | E2E, documentación Postman, checklist rollout                           | Pending |

---

## Acceptance criteria (epic-level)

- [ ] Existe tabla `employee_assets` con `employeeId`, `assetName`, `type`, `assignmentDate`, `value`, `status`, `tenantId`.
- [ ] Enum `AssetStatus` con valores `ACTIVO`, `RETORNADO`, `DADO_DE_BAJA`.
- [ ] Enum `AssetType` con valores `EDUCATIONAL`, `FINANCIAL`, `LEGAL`, `DEPENDANTS`.
- [ ] CRUD de activos disponible vía REST y GraphQL.
- [ ] No se puede crear activo duplicado activo para el mismo empleado (`ConflictException`).
- [ ] Motor de nómina consulta activos activos para deducciones/beneficios.
- [ ] Tests unitarios repository/service ≥ 80% cobertura.
- [ ] `node scripts/validate-structure.js` pasa.
- [ ] `pnpm --filter=@restopsiq/api test` pasa.

---

## Out of scope (MVP)

- Catálogo centralizado de tipos de activo (asset_id FK a catálogo separado).
- Historial de cambios de estado detallado (audit log dedicado).
- Frontend UI para gestión de activos.
- Fotografías/documentos del activo.
- Depreciación automática del valor.
