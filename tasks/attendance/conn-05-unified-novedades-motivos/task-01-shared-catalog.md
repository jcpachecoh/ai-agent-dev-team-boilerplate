# CONN-05 Task 01 — Catálogo compartido (packages)

**Domain:** `[PACKAGES]` `[BACKEND]`  
**Status:** `pending`  
**Depends on:** —  
**Epic:** [CONN-05](./00-epic-and-decisions.md)

---

## Goal

Definir **una sola fuente de verdad** para los motivos del modal OS-553, compartida entre API y `packages/ui`, eliminando la duplicación documentada en OS-553.

---

## Scope

### Nuevo módulo compartido

- `packages/shared/src/attendance/manual-marking-reason.catalog.ts` (o ruta equivalente en el monorepo)

### Tipos

```typescript
/** Unión: NovedadType | incapacidades NOM-13 | corrección pura */
export type ManualMarkingReasonCode = ...

export type ManualMarkingReasonTarget =
  | 'ATTENDANCE_ONLY'
  | 'PAYROLL_NOVEDAD'
  | 'MEDICAL_LEAVE';

export interface ManualMarkingReasonOption {
  code: ManualMarkingReasonCode;
  label: string;
  target: ManualMarkingReasonTarget;
  novedadType?: NovedadType;      // si target PAYROLL_NOVEDAD
  leaveOrigin?: 'COMUN' | 'LABORAL'; // si target MEDICAL_LEAVE
}
```

### Exportar

- `MANUAL_MARKING_REASON_CATALOG: ManualMarkingReasonOption[]`
- Helpers: `isPayrollNovedadReason(code)`, `isMedicalLeaveReason(code)`, `isAttendanceOnlyReason(code)`

### Labels (español)

Alinear con `NOVEDAD_TYPE_LABELS` (NOM-14) y textos NOM-13:

| Código                 | Label UI                     |
| ---------------------- | ---------------------------- |
| `CORRECCION_MARCACION` | Corrección de marcación      |
| `INCAPACIDAD_COMUN`    | Incapacidad médica (común)   |
| `INCAPACIDAD_LABORAL`  | Incapacidad médica (laboral) |
| `PERMISO_REMUNERADO`   | Permiso remunerado           |
| …                      | (resto de `NovedadType`)     |

### Consumidores (en tasks posteriores)

- `apps/api` — validación `@IsIn` / mapa destino
- `packages/ui` — default de `AsistenciaTarjetaMarkingModal`

---

## Out of scope

- Migración Prisma.
- Servicio de provisionamiento.
- Cambios en `web-app`.

---

## Files allowed

- `packages/shared/src/attendance/**` — create
- `packages/shared/src/index.ts` — modify (re-export)
- `packages/shared/package.json` — modify **solo si** hace falta entry point (evitar si no es necesario)

---

## Files forbidden

- `prisma/schema.prisma`
- `apps/api/src/**` (salvo re-export temporal en task 04)
- `apps/web-app/**`
- `packages/ui/**` (task 05)

---

## Acceptance criteria

- [ ] Catálogo incluye todos los `NovedadType` + `CORRECCION_MARCACION` + incapacidades COMUN/LABORAL.
- [ ] Cada entrada tiene `target` explícito.
- [ ] No quedan strings mágicos duplicados para labels en shared.
- [ ] `pnpm --filter=@restopsiq/shared typecheck` pasa (si existe script).

---

## Validation commands

```bash
pnpm --filter=@restopsiq/shared typecheck
pnpm typecheck
```
