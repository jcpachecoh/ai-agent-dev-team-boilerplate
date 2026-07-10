# NOM-14 Task 01 — Schema Prisma y migración

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `pending`  
**Depends on:** —  
**Epic:** [NOM-14](./00-epic-and-decisions.md)

---

## Goal

Agregar al schema Prisma los modelos `PayrollNovedad`, `NovedadTypeConfig` y enums `NovedadType`, `RequestSource`, `NovedadStatus` según el epic, generar migración SQL y seed idempotente de configuración por tenant.

---

## Scope

### Enums

```prisma
enum NovedadType {
  AUSENCIA_INJUSTIFICADA
  LICENCIA_LUTO
  LICENCIA_PATERNIDAD
  LICENCIA_MATERNIDAD
  LICENCIA_NO_REMUNERADA
  PERMISO_REMUNERADO
  CALAMIDAD_DOMESTICA
  DIA_FAMILIA
}

enum RequestSource {
  EMPLEADO
  RRHH
}

enum NovedadStatus {
  SOLICITADA
  PENDIENTE_SUPERVISOR
  PENDIENTE_RRHH
  APROBADA
  RECHAZADA
}
```

### Modelo `PayrollNovedad`

Implementar según epic **D3** (`supportStorageObjectId`, no `supportDocUrl` string).

| Campo                    | Tipo / notas                                  |
| ------------------------ | --------------------------------------------- |
| `tenantId`               | String, índice obligatorio                    |
| `employeeId`             | FK `EmployeeDetails.id`, `onDelete: Restrict` |
| `type`                   | `NovedadType`                                 |
| `startDate` / `endDate`  | `@db.Date`                                    |
| `isPaid`                 | Boolean                                       |
| `linkedLeaveId`          | String? opcional                              |
| `supportStorageObjectId` | String? FK `StorageObject`                    |
| `notes`                  | String?                                       |
| `requestedBy`            | `RequestSource`                               |
| `status`                 | `NovedadStatus`                               |
| `supervisorApproverId`   | String?                                       |
| `supervisorDecisionAt`   | DateTime?                                     |
| `supervisorComment`      | String?                                       |
| `rrhhApproverId`         | String?                                       |
| `rrhhDecisionAt`         | DateTime?                                     |
| `rejectionReason`        | String?                                       |
| `overlapWarningAck`      | Boolean `@default(false)`                     |
| `deletedAt`              | DateTime? (soft delete)                       |

### Modelo `NovedadTypeConfig`

| Campo                        | Default MVP                                                      |
| ---------------------------- | ---------------------------------------------------------------- |
| `requiresSupervisorApproval` | ver tabla defaults en epic                                       |
| `requiresSupportDocument`    | `true` para licencias legales                                    |
| `isPaidDefault`              | `false` para `AUSENCIA_INJUSTIFICADA` y `LICENCIA_NO_REMUNERADA` |

`@@unique([tenantId, type])`

### Relación en `EmployeeDetails`

Agregar `payrollNovedades PayrollNovedad[]` en el modelo.

### Índices `PayrollNovedad`

- `@@index([tenantId])`
- `@@index([tenantId, employeeId])`
- `@@index([tenantId, status])`
- `@@index([tenantId, deletedAt])`
- `@@index([tenantId, startDate, endDate])`
- `@@index([tenantId, type])`
- `@@map("payroll_novedades")`

### Migración

- Nombre: `payroll_novedades`.
- SQL solo de esta task.

### Seed (idempotente)

En `prisma/seed.ts` o script dedicado: para cada tenant existente, `upsert` de los 8 tipos con defaults del epic (PC-1). No ejecutar `migrate dev` salvo instrucción explícita.

---

## Out of scope

- Repository, service, controller.
- Integración liquidación.
- Campo `EmployeeDetails.supervisorId`.

---

## Files allowed

- `prisma/schema.prisma` — modify
- `prisma/migrations/**` — create
- `prisma/seed.ts` — modify (solo upsert `NovedadTypeConfig`)

---

## Files forbidden

- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/**`
- `apps/web-app/**`
- `packages/**`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [ ] Modelos y enums en `schema.prisma` con convenciones multi-tenant.
- [ ] Migración SQL creada y revisada.
- [ ] Seed idempotente de `NovedadTypeConfig` documentado.
- [ ] `pnpm prisma format` y `pnpm prisma validate` pasan.
- [ ] `pnpm prisma generate` ejecutado localmente.

---

## Validation commands

```bash
pnpm prisma format
pnpm prisma validate
pnpm prisma generate
```
