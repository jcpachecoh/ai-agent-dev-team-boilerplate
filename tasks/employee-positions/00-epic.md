# Epic: Employee Positions — Catálogo de cargos (Nómina)

**Domain:** `[BE]` `[GRAPHQL]` `[REST]` `[PAYROLL]` `[WEB-APP]`  
**Branch sugerida:** `feat/employee-positions-catalog`  
**Status:** `pending`  
**Priority:** High

---

## Goal

Crear el catálogo de **cargos** del módulo de nómina (`employee_positions`), exponer CRUD con reglas de negocio multi-tenant, vincular empleados mediante `positionId`, y mantener **historial de asignaciones** consultable para auditoría.

Reemplazar progresivamente el campo libre `EmployeeDetails.position` (string) por una relación tipada al catálogo, sin romper integraciones existentes de nómina.

---

## Contexto actual del dominio

| Artefacto actual           | Estado hoy                                                           |
| -------------------------- | -------------------------------------------------------------------- |
| `EmployeeDetails.position` | `String` libre (texto manual en formulario)                          |
| `EmployeeDetails.area`     | `String` + catálogo genérico `EmployeeCatalogOption` tipo `AREA`     |
| `EmployeeCatalogOption`    | EPS, ARL, área, departamento — **no** modela cargos con salario base |
| API nómina                 | REST `/employee-catalogs` + GraphQL `employees` resolver             |

**Decisión de naming:** usar `EmployeePosition` / tabla `employee_positions`.  
No usar `employee_roles` — colisiona semánticamente con RBAC (`Role` / `roleId` en `User`).

---

## Design principles

### 1. Multi-tenancy obligatorio

Toda query/mutation filtra por `tenantId` del JWT (`@CurrentUser()`).  
`EmployeePosition.tenantId` se persiste y valida en repository/service.

### 2. Soft delete vía `isActive`

No hard delete de cargos. Desactivar con `isActive: false`.  
Solo permitir desactivación si **no hay empleados activos** con ese `positionId` (misma regla que eliminar).

### 3. Historial de cargos (auditoría)

Tabla `employee_position_history` registra cada asignación/cambio:

- `employeeDetailsId`, `positionId`, `effectiveFrom`, `effectiveTo?`, `changedBy?`
- Al cambiar cargo de un empleado: cerrar registro vigente (`effectiveTo = now`) y abrir uno nuevo.

### 4. Compatibilidad con empleados existentes

- Agregar `EmployeeDetails.positionId` (FK opcional en migración).
- Mantener `EmployeeDetails.position` (string) como **snapshot denormalizado** del título del cargo para reportes/exports legacy hasta deprecación explícita.
- Al asignar `positionId`, sincronizar `position = EmployeePosition.title`.

### 5. Validación de negocio

| Regla                                  | Comportamiento                                      |
| -------------------------------------- | --------------------------------------------------- |
| Desactivar cargo con empleados activos | `ConflictException` — reasignar primero             |
| Título duplicado en tenant             | `ConflictException` (`@@unique([tenantId, title])`) |
| Asignar cargo inactivo a empleado      | `BadRequestException`                               |
| `baseSalaryRange`                      | `Decimal >= 0`, máx 2 decimales                     |

### 6. API surface

| Capa      | Endpoints                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------- |
| REST      | `GET/POST/PATCH /employee-positions`, `PATCH .../deactivate`                                          |
| GraphQL   | `employeePositions`, `createEmployeePosition`, `updateEmployeePosition`, `deactivateEmployeePosition` |
| Empleados | Extender `createEmployee` / `updateEmployee` para aceptar `positionId`                                |

Patrón existente: `EmployeeCatalogController` (REST) + `EmployeesResolver` (GraphQL).

---

## Module structure (backend)

Extender `PayrollModule` con subcapas dedicadas (mismo patrón que `employee-catalog`):

```
apps/api/src/payroll/
├── interfaces/
│   └── employee-positions.interfaces.ts
├── repository/
│   └── employee-positions.repository.ts
├── service/
│   └── employee-positions.service.ts
├── controller/
│   ├── employee-positions.controller.ts
│   └── dto/
│       ├── create-employee-position.dto.ts
│       ├── update-employee-position.dto.ts
│       └── employee-position.response.dto.ts
├── resolver/
│   └── employee-positions.resolver.ts
└── test/
    ├── employee-positions.repository.spec.ts
    ├── employee-positions.service.spec.ts
    ├── employee-positions.controller.spec.ts
    └── employee-positions.resolver.spec.ts
```

---

## Subtask breakdown

| File                          | Title                                                                             | Status  |
| ----------------------------- | --------------------------------------------------------------------------------- | ------- |
| `01-schema.md`                | Prisma — `EmployeePosition` + `EmployeePositionHistory` + FK en `EmployeeDetails` | Pending |
| `01b-migration.md`            | Migración SQL + backfill opcional                                                 | Pending |
| `02-interfaces.md`            | Contratos repository + service                                                    | Pending |
| `03-repository.md`            | `EmployeePositionsRepository` + tests                                             | Pending |
| `04-service.md`               | `EmployeePositionsService` + tests                                                | Pending |
| `05-dtos.md`                  | DTOs REST (Swagger)                                                               | Pending |
| `06-controller.md`            | `EmployeePositionsController` REST                                                | Pending |
| `07-resolver.md`              | `EmployeePositionsResolver` GraphQL                                               | Pending |
| `08-employee-integration.md`  | Vincular empleados + historial en `PayrollService`                                | Pending |
| `09-module-wiring.md`         | Registrar en `PayrollModule` + validate-structure                                 | Pending |
| `10-frontend-positions-ui.md` | Dropdown dinámico en formulario nómina (web-app)                                  | Pending |
| `11-tests-rollout.md`         | E2E, documentación Postman, checklist rollout                                     | Pending |

---

## Acceptance criteria (epic-level)

- [ ] Existe tabla `employee_positions` con `title`, `area`, `baseSalaryRange`, `isActive`, `tenantId`.
- [ ] CRUD de cargos disponible vía REST y GraphQL.
- [ ] `EmployeeDetails.positionId` vincula empleado ↔ cargo.
- [ ] Cambios de cargo generan filas en `employee_position_history`.
- [ ] No se puede desactivar un cargo con empleados activos asignados.
- [ ] UI nómina consume catálogo en dropdown de cargo (solo activos).
- [ ] Tests unitarios repository/service ≥ 80% cobertura en services.
- [ ] `node scripts/validate-structure.js` pasa.
- [ ] `pnpm --filter=@restopsiq/api test` pasa.

---

## Out of scope (MVP)

- Rangos salariales min/max (solo `baseSalaryRange` referencia).
- Jerarquía de cargos / niveles.
- Sincronización automática con sistemas externos de RRHH.
- Eliminar físicamente registros de historial.

---

## Notas vs `EmployeeCatalogOption`

`EmployeeCatalogOption` (tipo `AREA`, `DEPARTMENT`) sigue siendo el catálogo de **áreas/departamentos organizacionales**.  
`EmployeePosition.area` describe el área **del cargo** en el catálogo; puede alinearse con un valor de `AREA` pero no reemplaza ese catálogo en MVP.
