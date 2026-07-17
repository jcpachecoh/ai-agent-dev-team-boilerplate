# CONN-04b Task 07 — Tarjeta OS-551: origen y estado

**Domain:** `[FRONTEND]` `[WEB-APP]`  
**Status:** `done`  
**Depends on:** [Task 04](./task-04-api-permissions.md) (API expone `type`)  
**Epic:** [CONN-04b](./00-epic-and-decisions.md)

---

## Goal

En la Tarjeta de Asistencia (OS-551), mostrar el **origen** (`DETECCION_AUTOMATICA` | `SOLICITUD_ADMINISTRATIVA`) y el **estado** de la solicitud de tiempo extra relevante del período/día.

---

## Scope

- Extender consumo de overtime en `AttendanceCardScreen` / mappers / hooks.
- Indicador legible: origen + estado (+ minutos propuestos o acumulados según tipo).
- Reutilizar `AsistenciaOvertimeBadge` en `@restopsiq/ui` **solo si** ya soporta variantes; si no, extender wiring en web-app sin reinventar la tarjeta.
- Si coexisten auto + admin en el período: mostrar ambos o el más relevante según regla FE documentada (preferir listar estados sin inventar prioridad de pago — pago es task-08).

---

## Out of scope

- Cambiar marcación manual OS-553.
- Reglas de liquidación.
- Backend salvo gaps de API ya cubiertos en task-04.

---

## Files allowed

- `apps/web-app/src/features/attendance/screens/AttendanceCardScreen.tsx`
- `apps/web-app/src/features/attendance/mappers/**`
- `apps/web-app/src/features/attendance/hooks/**`
- `apps/web-app/src/features/attendance/types/**`
- `packages/ui/src/components/asistencia/asistencia-overtime-badge/**` — solo si es estrictamente necesario

---

## Files forbidden

- `apps/api/**` (salvo bug bloqueante de contrato — elevar a task-04)
- Nueva pantalla de overtime

---

## Acceptance criteria

- [x] Fila/día con solicitud admin muestra origen administrativo y estado.
- [x] Detección automática sigue mostrándose correctamente.
- [x] Tests de mapper/indicador actualizados.

---

## Validation commands

```bash
cd apps/web-app && pnpm exec vitest run src/features/attendance --passWithNoTests
```
