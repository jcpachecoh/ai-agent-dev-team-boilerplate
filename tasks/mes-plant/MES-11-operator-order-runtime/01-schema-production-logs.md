# MES-11 Task 01 — Schema: production_logs

## Goal

Agregar persistencia de auditoría de ejecución operario.

**Depends on:** Task 00.

---

## Scope

- Enum `ProductionLogEvent`.
- Modelo `ProductionLog` en `schema.prisma`.
- Migración SQL (solo esta tabla + enum).
- `prisma format` + `prisma validate`.

---

## Out of Scope

- Servicios o controllers.
- `prisma migrate dev` en CI (solo crear migración).
- Cambios a `PhaseExecution` salvo índices si necesarios.

---

## Files allowed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/*_production_logs/migration.sql`

---

## Files forbidden

- `apps/api/src/**` (excepto ninguno)
- `package.json` / `pnpm-lock.yaml`
- Seeds (task 08 opcional)

---

## Implementation notes

```prisma
enum ProductionLogEvent {
  ORDER_STARTED
  ORDER_PAUSED
  ORDER_RESUMED
  STEP_COMPLETED
  ORDER_COMPLETED
  NOVELTY_ADDED
}

model ProductionLog {
  id                 String              @id @default(cuid())
  tenantId           String
  orderId            String
  phaseExecutionId   String?
  employeeId         String              // OperationalUser.id
  workStationId      String
  event              ProductionLogEvent
  timestamp          DateTime            @default(now())
  notes              String?
  durationSeconds    Int?
  idempotencyKey     String?

  order            ProductionOrder   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  phaseExecution   PhaseExecution?   @relation(fields: [phaseExecutionId], references: [id])
  employee         OperationalUser   @relation(fields: [employeeId], references: [id])
  workStation      WorkStation       @relation(fields: [workStationId], references: [id])

  @@index([tenantId, orderId, timestamp])
  @@index([tenantId, orderId, event])
  @@unique([tenantId, idempotencyKey])
  @@map("production_logs")
}
```

Agregar relaciones inversas en `ProductionOrder`, `PhaseExecution`, `OperationalUser`, `WorkStation`.

---

## Acceptance criteria

- [ ] Migración idempotente y acotada a `production_logs`.
- [ ] `pnpm --filter api exec prisma validate` pasa.
- [ ] `pnpm --filter api exec prisma generate` sin errores.

---

## Validation commands

```bash
pnpm --filter api exec prisma format
pnpm --filter api exec prisma validate
pnpm --filter api exec prisma generate
```
