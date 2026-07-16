# CONN-11 Task 01 — Schema: markingScope, JornadaCutoff, source SYSTEM

**Domain:** `[BACKEND]` `[DATA]`  
**Status:** `pending`  
**Depends on:** [Epic](./00-epic-and-decisions.md)  
**Epic:** CONN-11

---

## Goal

Extender el schema Prisma con los tipos necesarios para corte automático de jornada y marcación de tiempo adicional.

---

## Scope

### Enums nuevos

```prisma
enum AttendanceMarkingScope {
  ORDINARY
  OVERTIME
}

enum JornadaCutoffType {
  AUTOMATIC
  MANUAL
}
```

### Extender `AttendanceLogSource`

```prisma
enum AttendanceLogSource {
  DEVICE    // @deprecated
  APP_MOVIL
  MANUAL
  SYSTEM    // CONN-11 — EXIT de corte automático
}
```

### Campos en `AttendanceLog`

```prisma
markingScope AttendanceMarkingScope @default(ORDINARY)
```

Índice sugerido: `@@index([tenantId, employeeId, workDate, markingScope])`

### Modelo `JornadaCutoff`

Ver epic — incluir relaciones a `EmployeeDetails` y `Location`.

### Backfill migración

```sql
UPDATE attendance_logs SET "markingScope" = 'ORDINARY' WHERE "markingScope" IS NULL;
-- (si columna nullable en migración intermedia; preferir DEFAULT en ADD COLUMN)
```

No crear `JornadaCutoff` retroactivo para jornadas pasadas en MVP.

---

## Out of scope

- Lógica de negocio
- Job scheduler
- Cambios en `OvertimeRequest`

---

## Files allowed

- `apps/api/prisma/schema.prisma` — modify
- `apps/api/prisma/migrations/*_conn_11_jornada_cutoff/` — create

---

## Files forbidden

- `apps/api/src/**` (task 02+)
- `apps/web-app/**`
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [ ] `pnpm prisma validate` pasa
- [ ] `pnpm prisma format` sin cambios pendientes
- [ ] Migración SQL revisada: enums, FKs, índices, default `ORDINARY`
- [ ] `prisma generate` exitoso

---

## Validation

```bash
pnpm prisma validate
pnpm prisma format
pnpm prisma migrate dev --name conn_11_jornada_cutoff
pnpm prisma generate
```
