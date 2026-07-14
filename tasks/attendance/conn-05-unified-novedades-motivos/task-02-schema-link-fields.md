# CONN-05 Task 02 — Schema: vínculo marcación ↔ nómina

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `pending`  
**Depends on:** [Task 01](./task-01-shared-catalog.md)  
**Epic:** [CONN-05](./00-epic-and-decisions.md)

---

## Goal

Permitir trazabilidad entre una marcación manual de asistencia y el registro de nómina/incapacidad que provocó, sin romper soft-delete ni multi-tenancy.

---

## Scope

### Opción preferida (decisión D5 — validar en PR)

Agregar campo opcional en modelos existentes:

```prisma
model PayrollNovedad {
  // ...
  sourceAttendanceLogId String?  @unique
  sourceAttendanceLog   AttendanceLog? @relation(...)
}

model MedicalLeave {
  // ...
  sourceAttendanceLogId String?  @unique
  sourceAttendanceLog   AttendanceLog? @relation(...)
}
```

Índices: `@@index([tenantId, sourceAttendanceLogId])` donde aplique.

### Migración

- Una migración SQL con solo columnas/FK de CONN-05.
- **No** ejecutar `prisma migrate dev` en agente — solo `prisma format` + `prisma validate`.

### Seed

- Sin cambios obligatorios.

---

## Out of scope

- Tabla puente alternativa (solo si la opción preferida se rechaza en review).
- Backfill de logs históricos.

---

## Files allowed

- `apps/api/prisma/schema.prisma` — modify
- `apps/api/prisma/migrations/*_conn05_manual_marking_link/` — create

---

## Files forbidden

- `apps/api/src/**` (implementación en task 03+)
- `packages/**`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] FK opcional `sourceAttendanceLogId` en `PayrollNovedad` y/o `MedicalLeave`.
- [ ] Migración SQL acotada a CONN-05.
- [ ] `prisma validate` y `prisma format` pasan.

---

## Validation commands

```bash
cd apps/api && npx prisma format && npx prisma validate
```
