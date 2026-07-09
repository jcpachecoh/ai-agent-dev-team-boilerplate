# NOM-13 Task 01 — Schema Prisma y migración

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `pending`  
**Depends on:** —  
**Epic:** [NOM-13](./00-epic-and-decisions.md)

---

## Goal

Agregar al schema Prisma el modelo `MedicalLeave` y enums `LeaveOrigin`, `LeaveStatus` según el epic, y generar la migración SQL correspondiente.

---

## Scope

### Enums

```prisma
enum LeaveOrigin {
  COMUN
  LABORAL
}

enum LeaveStatus {
  REGISTRADA
  RADICADA_EPS
  RECOBRADA
  RECHAZADA
}
```

### Modelo `MedicalLeave`

Implementar según epic **D1** (usar `supportStorageObjectId` FK a `StorageObject`, no `supportDocUrl` string).

| Campo                    | Tipo / notas                                  |
| ------------------------ | --------------------------------------------- |
| `tenantId`               | String, índice obligatorio                    |
| `employeeId`             | FK `EmployeeDetails.id`, `onDelete: Restrict` |
| `origin`                 | `LeaveOrigin`                                 |
| `startDate` / `endDate`  | `@db.Date`                                    |
| `totalDays`              | Int                                           |
| `employerPaidDays`       | Int                                           |
| `epsArlPaidDays`         | Int                                           |
| `epsArlAmount`           | `Decimal? @db.Decimal(12, 2)`                 |
| `employerAmount`         | `Decimal @db.Decimal(12, 2)`                  |
| `supportStorageObjectId` | String? opcional, FK `StorageObject`          |
| `status`                 | `LeaveStatus @default(REGISTRADA)`            |
| `radicatedAt`            | DateTime?                                     |
| `recoveredAt`            | DateTime?                                     |
| `rejectedAt`             | DateTime?                                     |
| `rejectionReason`        | String?                                       |
| `deletedAt`              | DateTime? (soft delete)                       |

### Índices

- `@@index([tenantId])`
- `@@index([tenantId, employeeId])`
- `@@index([tenantId, status])`
- `@@index([tenantId, deletedAt])`
- `@@index([tenantId, startDate, endDate])`
- `@@map("medical_leaves")`

### Migración

- Nombre: `medical_leaves`.
- SQL solo de esta task.

---

## Out of scope

- Repository, service, controller.
- Integración con liquidación.
- Seed masivo.

---

## Files allowed

- `prisma/schema.prisma` — modify
- `prisma/migrations/**` — create

---

## Files forbidden

- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/**`
- `apps/web-app/**`
- `packages/**`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [ ] Modelo y enums en `schema.prisma` con convenciones multi-tenant.
- [ ] Migración SQL creada y revisada.
- [ ] `pnpm prisma format` y `pnpm prisma validate` pasan.
- [ ] `pnpm prisma generate` ejecutado localmente.

---

## Validation commands

```bash
pnpm prisma format
pnpm prisma validate
pnpm prisma generate
```
