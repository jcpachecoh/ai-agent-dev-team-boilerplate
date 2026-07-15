# NOM-14 Task 12 — Amendment: edición, auditoría, calamidad y luto

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[PRISMA]`  
**Status:** `completed`  
**Depends on:** [Task 11](./task-11-tests-validation.md) (o base tasks 01–10 si ya implementadas)  
**Epic:** [NOM-14](./00-epic-and-decisions.md) — PC-6, PC-7, PC-8, D10, D11, D12

---

## Goal

Extender NOM-14 con:

1. **Edición** de novedades post-creación (RRHH/admin) con **auditoría completa** (`NovedadAuditLog`).
2. **Calamidad doméstica** no autosolicitable — solo líder inmediato / RRHH en tiempo real.
3. **Licencia de luto** con cálculo automático de **5 días hábiles remunerados** (Ley 1280/2009), excluyendo sábados, domingos y **festivos legales colombianos**.
4. **Bloqueo de edición** cuando la novedad ya fue consumida por una liquidación de nómina procesada (OS-380).

> **Nota:** Las incapacidades médicas (NOM-13) **no** entran en este flujo — permanecen inmutables en `MedicalLeave`.

---

## Scope

### 1. Schema (migración amendment)

Migración: `nom_14_edit_audit_legal_types` (SQL solo de esta task).

**`PayrollNovedad`**

| Campo nuevo  | Tipo    | Default | Notas                                      |
| ------------ | ------- | ------- | ------------------------------------------ |
| `isEditable` | Boolean | `true`  | `false` solo si negocio lo marca explícito |

**`NovedadTypeConfig`**

| Campo nuevo       | Tipo    | Default | Notas                                   |
| ----------------- | ------- | ------- | --------------------------------------- |
| `autoSolicitable` | Boolean | `true`  | Seed `false` para `CALAMIDAD_DOMESTICA` |

**Nuevo modelo `NovedadAuditLog`**

```prisma
model NovedadAuditLog {
  id            String   @id @default(cuid())
  tenantId      String
  novedadId     String
  changedBy     String   // User.id
  changedAt     DateTime @default(now())
  previousValue Json
  newValue      Json

  novedad PayrollNovedad @relation(fields: [novedadId], references: [id])

  @@index([tenantId])
  @@index([novedadId])
  @@index([changedAt])
  @@map("novedad_audit_logs")
}
```

**Seed amendment (idempotente):**

- `CALAMIDAD_DOMESTICA.autoSolicitable = false` para todos los tenants existentes.

---

### 2. Backend — util luto

Archivo: `apps/api/src/payroll-novedades/utils/luto-end-date.util.ts`

```typescript
import { isColombianHoliday } from '../../reports/service/colombia-holidays.util';

const LUTO_BUSINESS_DAYS = 5;

/**
 * Ley 1280/2009 — 5 días hábiles REMUNERADOS desde startDate (inclusive).
 * Día hábil = lun–vie que NO es festivo legal colombiano.
 * Sábado, domingo y festivos NO consumen uno de los 5 días; la licencia se extiende.
 */
export function calculateLutoEndDate(startDate: Date): Date;

export function isBusinessDay(date: Date): boolean; // lun–vie && !isColombianHoliday
```

**Tests obligatorios:**

| Caso                               | startDate | Festivo en rango | endDate esperado                              |
| ---------------------------------- | --------- | ---------------- | --------------------------------------------- |
| Cruza fin de semana                | viernes   | no               | jueves siguiente (5 hábiles)                  |
| Ejemplo producto (festivo viernes) | miércoles | viernes festivo  | miércoles siguiente (mié, jue, lun, mar, mié) |
| Año bisiesto / cambio de año       | 30-dic    | no               | calcula 5 hábiles sin off-by-one              |

**Seed / submit:** `LICENCIA_LUTO` fuerza `isPaid = true` (o `isPaidDefault: true` en config); no editable a no remunerado por empleado.

---

### 3. Backend — repository

**`NovedadAuditLogRepository`** (o métodos en `PayrollNovedadesRepository`):

| Método                     | Descripción                                   |
| -------------------------- | --------------------------------------------- |
| `createAuditLog`           | Insert con `tenantId`, `novedadId`, JSON diff |
| `listAuditLogsByNovedadId` | Orden `changedAt desc`                        |

**`PayrollNovedadesRepository`:**

| Método                         | Descripción                                         |
| ------------------------------ | --------------------------------------------------- |
| `updateFields`                 | Update parcial campos editables + `updatedAt`       |
| `isConsumedByProcessedPayroll` | true si intersecta período OS-380 procesado/cerrado |

> Integración OS-380: delegar al servicio/repositorio de cierre de período existente o stub documentado hasta que OS-380 exponga flag de liquidación procesada por `tenantId + YYYY-MM`.

---

**`NovedadTypeConfigRepository`:**

- Incluir `autoSolicitable` en upsert/list.
- Seed `LICENCIA_LUTO.isPaidDefault = true`.

---

### 4. Backend — service

#### Cambios en `submit()`

1. Si `type === CALAMIDAD_DOMESTICA` y `requestedBy === EMPLEADO` → `ForbiddenException`.
2. Si `type === LICENCIA_LUTO` → `endDate = calculateLutoEndDate(startDate)`; `isPaid = true` (ignorar input de fin y override no remunerado).
3. Filtrar tipos no autosolicitables cuando el actor es empleado (doble validación con config).

#### Nuevo `edit(tenantId, actorUserId, novedadId, input: EditNovedadInput)`

Precondiciones:

- Novedad existe, `deletedAt: null`, `isEditable === true`.
- Actor rol `NOMINA` (o permiso `payroll-novedades.write`).
- Estado no terminal `RECHAZADA` (MVP).
- **`assertNovedadNotConsumedByProcessedPayroll`** — si true → `ConflictException`:

```json
{
  "statusCode": 409,
  "code": "NOVEDAD_CONSUMED_BY_PROCESSED_PAYROLL",
  "message": "Esta novedad ya fue incluida en una liquidación procesada. Debe gestionarse como ajuste manual."
}
```

Campos editables MVP: `startDate`, `endDate`, `isPaid`, `notes`.

Flujo:

1. Cargar registro actual → construir `previousValue` JSON (solo campos editables).
2. Si tipo `LICENCIA_LUTO` y cambia `startDate` → recalcular `endDate`.
3. Validar `startDate <= endDate`.
4. Re-ejecutar `findOverlapping` excluyendo la novedad actual; respetar PC-5 / `overlapWarningAck`.
5. `updateFields` + `createAuditLog` en **una transacción**.
6. Retornar novedad actualizada + último audit entry.

#### Cambios en `listEmployeeTypeConfigs()`

- Filtrar `autoSolicitable === true` (empleado / CONN-07 no ve calamidad).

#### Cambios en `NovedadTypeConfigService.updateConfig()`

- Campo editable adicional: `autoSolicitable`.

---

### 5. Backend — API

| Método  | Ruta                           | Rol / permiso                        |
| ------- | ------------------------------ | ------------------------------------ |
| `PATCH` | `/payroll-novedades/:id`       | `NOMINA` / `payroll-novedades.write` |
| `GET`   | `/payroll-novedades/:id/audit` | `NOMINA` (histórico ediciones)       |

**DTO `EditNovedadDto`:**

- `startDate?`, `endDate?`, `isPaid?`, `notes?`, `overlapWarningAck?`
- Para `LICENCIA_LUTO`: ignorar `endDate` en DTO si viene.

**Response `PayrollNovedadRecord`:** incluir `isEditable: boolean` y `editBlockedReason?: string | null` (poblado cuando liquidación procesada bloquea edición).

**Constante compartida FE/BE:**

```typescript
export const NOVEDAD_EDIT_BLOCKED_PROCESSED_PAYROLL_MESSAGE =
  'Esta novedad ya fue incluida en una liquidación procesada. Debe gestionarse como ajuste manual.';
```

**Response audit:** array de `{ changedBy, changedAt, previousValue, newValue, changedByName? }`.

Postman: agregar requests PATCH edit + GET audit en carpeta NOM-14.

---

### 6. Frontend — web-app

#### Bandeja / histórico RRHH (`PayrollNovedadesScreen`)

- Botón **Editar** en fila/detalle solo si `isEditable === true`, rol write, y `editBlockedReason == null`.
- Si `editBlockedReason` presente: botón deshabilitado + tooltip con mensaje de ajuste manual.
- `PayrollNovedadEditModal`:
  - Campos según tipo.
  - `LICENCIA_LUTO`: solo `startDate`; preview en vivo del rango (5 hábiles incl. exclusión de festivos — espejo de `calculateLutoEndDate` en util FE compartido o `@restopsiq/shared`).
  - Calamidad: RRHH/supervisor puede acortar `endDate` (caso reintegro anticipado) **solo si no hay liquidación procesada**.
  - Soporte overlap dialog reutilizado de task 10.
  - Capturar error 409 `NOVEDAD_CONSUMED_BY_PROCESSED_PAYROLL` y mostrar toast con mensaje de ajuste manual.

#### Mi Perfil empleado (`MyNovedadRequestModal`)

- Selector de tipo: **excluir** tipos con `autoSolicitable === false` (API ya filtra en `me/type-config`).
- Verificar que `CALAMIDAD_DOMESTICA` no aparece.

#### Formulario RRHH (`PayrollNovedadFormModal`)

- Incluir `CALAMIDAD_DOMESTICA` para RRHH/supervisor.
- `LICENCIA_LUTO`: ocultar/deshabilitar `endDate`; mostrar rango calculado.

#### Detalle / drawer

- Sección **Historial de cambios** con lista de `NovedadAuditLog` (GET audit).

#### Cliente API

- `editPayrollNovedad(id, input)`
- `fetchPayrollNovedadAuditLog(id)`
- `updateNovedadTypeConfig` — incluir `autoSolicitable` si panel config existe.

---

### 7. Tests obligatorios

| Caso                                                          | Esperado                                                |
| ------------------------------------------------------------- | ------------------------------------------------------- |
| RRHH edita calamidad: acorta `endDate` tras reintegro         | 200 + audit log con previous/new                        |
| Editar novedad con `isEditable: false`                        | 403 o 400                                               |
| `CALAMIDAD_DOMESTICA` + `requestedBy: EMPLEADO`               | 403                                                     |
| Empleado lista type-config                                    | No incluye calamidad                                    |
| `LICENCIA_LUTO` submit miércoles con viernes festivo en rango | `endDate` = miércoles siguiente (5 hábiles remunerados) |
| `LICENCIA_LUTO`                                               | `isPaid === true` siempre                               |
| Editar novedad consumida por liquidación procesada            | 409 + código + mensaje ajuste manual                    |
| List/detail novedad consumida                                 | `editBlockedReason` poblado; botón Editar deshabilitado |
| Edición calamidad sin liquidación procesada                   | 200 + audit log                                         |
| Editar luto cambiando `startDate`                             | Recalcula `endDate` (festivos excluidos) + audit        |
| Incapacidad NOM-13                                            | Sin endpoint edit (regresión — no tocar MedicalLeave)   |
| Multi-tenant audit                                            | Tenant A no ve logs de tenant B                         |

---

## Out of scope

- Edición de incapacidades NOM-13 (`MedicalLeave`).
- **Ajuste manual** retroactivo post-liquidación procesada (solo mensaje guía; flujo de ajuste fuera de NOM-14).
- Notificación al empleado post-edición (follow-up opcional).
- App móvil CONN-07 (solo filtrar `autoSolicitable` en contrato API existente).
- Festivos regionales/departamentales distintos al calendario legal CO central (`colombia-holidays.util.ts`).

---

## Files allowed

- `prisma/schema.prisma` — modify
- `prisma/migrations/**` — create (amendment)
- `prisma/seed.ts` — modify (seed `autoSolicitable`)
- `apps/api/src/payroll-novedades/**` — modify/create
- `apps/web-app/src/features/payroll/**` — modify
- `apps/web-app/src/features/my-profile/**` — modify (filtro tipos empleado)
- `postman/restopsiq-api.collection.json` — modify

---

## Files forbidden

- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts` (salvo instrucción explícita)
- `apps/api/src/medical-leaves/**` (NOM-13 inmutable)
- `packages/**`

---

## Acceptance criteria

- [x] Migración amendment aplicada; `pnpm prisma validate` pasa.
- [x] `edit()` con auditoría transaccional implementado.
- [x] Calamidad no autosolicitable en backend y frontend empleado.
- [x] Luto: 5 días hábiles remunerados con exclusión de festivos CO (ejemplo producto verificado).
- [x] Edición bloqueada si liquidación procesada; mensaje de ajuste manual en API y UI.
- [x] UI editar visible solo con permiso + `isEditable`.
- [x] Tests amendment en verde; cobertura service ≥ 80%.
- [x] Criterios de aceptación nuevos del epic verificados.

---

## Validation commands

```bash
pnpm prisma format
pnpm prisma validate
pnpm prisma generate
pnpm --filter=api test -- payroll-novedades --coverage
pnpm --filter=web-app typecheck
node scripts/validate-structure.js
```
