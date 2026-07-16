# CONN-12 Task 01 — Schema: aprobación semanal de malla

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `completed`  
**Depends on:** — (D1 cerrada: Opción A)  
**Epic:** [CONN-12](./00-epic-and-decisions.md)

---

## Goal

Persistir el ciclo de vida de la planeación semanal de turnos (draft → pendiente → aprobada / rechazada) de forma que CONN-11 y liquidación puedan filtrar solo malla activa.

---

## Scope

### Modelo (propuesta — Opción A del epic)

```prisma
enum WeeklyShiftPlanStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
}

model WeeklyShiftPlan {
  id              String                 @id @default(cuid())
  tenantId        String
  locationId      String
  weekStart       DateTime               @db.Date // lunes de la semana (TZ Bogotá) — confirmar D open Q3
  status          WeeklyShiftPlanStatus  @default(DRAFT)
  submittedByUserId String?
  submittedAt     DateTime?
  approvedByUserId  String?
  approvedAt      DateTime?
  rejectedByUserId  String?
  rejectedAt      DateTime?
  rejectionReason String?
  createdAt       DateTime               @default(now())
  updatedAt       DateTime               @updatedAt

  location Location @relation(...)

  @@unique([tenantId, locationId, weekStart])
  @@index([tenantId, status, weekStart])
  @@map("weekly_shift_plans")
}
```

### Relación con `TurnoAssignment`

- Opción preferida: las asignaciones de esa semana/sede quedan asociadas implícitamente por `workDate ∈ week` + sede del turno/empleado, **o** FK opcional `weeklyShiftPlanId`.
- Documentar en migración la estrategia elegida tras cerrar D1.

### Si se elige Opción B

- Agregar `approvalStatus` (o `isOperational`) a `TurnoAssignment` + índices; sin entidad `WeeklyShiftPlan`.

---

## Out of scope

- API de aprobación (task 02).
- Cambios UI (task 07).
- Lógica CONN-11 (task 04).

---

## Files allowed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/<timestamp>_conn12_weekly_shift_plan_approval/migration.sql`
- Este archivo de tarea (marcar status)

## Files forbidden

- Services, controllers, frontend
- `package.json`, `pnpm-lock.yaml`
- Otros módulos no listados

---

## Acceptance criteria

- [x] Schema válido (`prisma validate`).
- [x] Migración solo con SQL de este cambio.
- [x] Unique por tenant + sede + weekStart (Opción A).
- [x] Decisión D1 documentada como cerrada en el epic.

---

## Validation commands

```bash
pnpm --filter=api exec prisma format
pnpm --filter=api exec prisma validate
```
