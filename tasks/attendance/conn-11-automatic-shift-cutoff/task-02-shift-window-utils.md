# CONN-11 Task 02 — Utilidades ventana de turno y minutos ordinarios

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 01](./task-01-schema-migration.md)  
**Epic:** CONN-11

---

## Goal

Centralizar el cálculo de tiempo pagable dentro de la jornada planificada, recortando entradas anticipadas y salidas post-corte.

---

## Scope

### Archivos nuevos

- `apps/api/src/attendance/utils/shift-window.util.ts`
- `apps/api/src/attendance/utils/shift-window.util.spec.ts`

### Funciones

```typescript
/** Par de shiftStart/shiftEnd como DateTime en workDate (soporta turno nocturno). */
export function computeShiftStartDateTime(
  workDate: Date,
  horaInicio: string,
  horaFin: string,
): Date;

/** Reutilizar computeShiftEndDateTime de overtime/shift-end.util.ts o mover a shared util. */

export interface OrdinaryTimeResult {
  ordinaryMinutes: number;
  effectiveStart: Date | null;
  effectiveEnd: Date | null;
  clippedEarlyMinutes: number; // minutos antes de shiftStart descartados
  clippedLateMinutes: number; // minutos después de shiftEnd/corte descartados
}

/** Calcula minutos ordinarios de un par ENTRY→EXIT recortado a ventana planificada. */
export function computeOrdinaryPairMinutes(params: {
  entryTimestamp: Date;
  exitTimestamp: Date;
  shiftStartTime: Date;
  shiftEndTime: Date;
  cutoffTime?: Date | null; // min(exit, shiftEnd, cutoff) si aplica
}): OrdinaryTimeResult;

/** Agrupa logs por markingScope y calcula minutos por scope. */
export function computeDayMinutesByScope(params: {
  logs: AttendanceLog[];
  shiftStartTime: Date;
  shiftEndTime: Date;
  cutoffTime?: Date | null;
}): {
  ordinaryMinutes: number;
  overtimeScopeMinutes: number;
};
```

### Reglas de recorte (PC-1)

```
effectiveStart = max(entryTimestamp, shiftStartTime)
effectiveEnd   = min(exitTimestamp, shiftEndTime, cutoffTime ?? shiftEndTime)
ordinaryMinutes = max(0, floor((effectiveEnd - effectiveStart) / 60000))
```

### Tests obligatorios

| Caso                               | Entrada                    | Turno       | Salida | ordinaryMinutes               |
| ---------------------------------- | -------------------------- | ----------- | ------ | ----------------------------- |
| Anticipada 15 min                  | 07:45                      | 08:00–17:00 | 17:00  | 540 (9h) — no 555             |
| Exacta                             | 08:00                      | 08:00–17:00 | 17:00  | 540                           |
| Salida tardía sin corte en cálculo | 08:00                      | 08:00–17:00 | 17:45  | 540 (recortada a 17:00)       |
| Par OVERTIME post-corte            | scope=OVERTIME 17:05–18:00 | —           | —      | 0 ordinary, 55 overtime scope |

---

## Out of scope

- Persistencia de corte
- Cambios en services consumidores (task 05)

---

## Files allowed

- `apps/api/src/attendance/utils/shift-window.util.ts` — create
- `apps/api/src/attendance/utils/shift-window.util.spec.ts` — create
- `apps/api/src/overtime/utils/shift-end.util.ts` — modify solo si se extrae `computeShiftStartDateTime` compartido

---

## Files forbidden

- `prisma/schema.prisma`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] Entrada 15 min antes → `clippedEarlyMinutes = 15`, `ordinaryMinutes` sin anticipación
- [ ] Salida 45 min después → `clippedLateMinutes = 45`, ordinary capped at shiftEnd
- [ ] Pares OVERTIME no suman a `ordinaryMinutes`
- [ ] Cobertura tests ≥ 80% del util

---

## Validation

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=shift-window
pnpm --filter=@restopsiq/api run typecheck
```
