# CONN-04a Task 04 — OvertimeDetectionService

**Domain:** `[BACKEND]` `[ATTENDANCE]`  
**Status:** `completed` — **superseded by amendment** ([CONN-11 task-06](../conn-11-automatic-shift-cutoff/task-06-overtime-detection-amendment.md))  
**Depends on:** [Task 03](./task-03-repository.md), CONN-03 (`ShiftResolutionService`)  
**Epic:** [CONN-04a](./00-epic-and-decisions.md)

> ⚠️ **Amendment 2026-07-15:** Esta task implementó detección por EXIT tardío vs `shiftEndTime`. Tras CONN-11, la detección debe usar solo pares `markingScope=OVERTIME` post-corte. Ver [CONN-11 task-06](../conn-11-automatic-shift-cutoff/task-06-overtime-detection-amendment.md). La cascada de aprobación y el modelo `OvertimeRequest` **no cambian**.

---

## Goal

Implementar `OvertimeDetectionService` que, al registrar una salida (`EXIT`), compara contra `shiftEndTime`, acumula minutos de exceso y crea/actualiza `OvertimeRequest` cuando el acumulado supera 30 minutos.

---

## Scope

### Archivos

- `apps/api/src/overtime/service/overtime-detection.service.ts`
- `apps/api/src/overtime/test/overtime-detection.service.spec.ts`
- Hook en `apps/api/src/attendance/service/attendance.service.ts` (solo llamada post-`EXIT`)

### Algoritmo `onExitRegistered`

1. Resolver `shiftEndTime` vía `ShiftResolutionService` para `(tenantId, employeeId, locationId, workDate)`.
2. Si no hay turno → return (log debug).
3. Calcular `excessMinutes = max(0, minutes(actualEndTime - shiftEndTime))`.
4. Si `excessMinutes === 0` → return.
5. Derivar `payrollPeriod` (`YYYY-MM` — período de nómina NOM-07/OS-380, zona `America/Bogota`).
6. Buscar solicitud activa `DETECCION_AUTOMATICA` del período.
7. Si no existe: crear borrador con `accumulatedMinutes = excessMinutes` **sin** cambiar estado a bandeja hasta superar umbral.
8. Si existe y no está terminal (`APROBADA`/`OBJETADA`): sumar minutos.
9. Si `accumulatedMinutes > 30` y status aún no en cascada → set `PENDIENTE_ADMIN` + crear filas `OvertimeApproval` pendientes (task 05).
10. Si ya existe solicitud `OBJETADA` en el período → **skip** (D1b — no crear ni actualizar).
11. Disparar notificación inicial si entra a `PENDIENTE_ADMIN` (delegar task 06).

### Umbral 30 minutos

| Acumulado | Resultado                                                                                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ≤ 30      | No exponer en bandeja; puede persistir acumulado interno o no crear registro hasta cruzar umbral (decidir en implementación — preferir no crear registro hasta `> 30` para simplificar bandeja) |
| 31        | Crear solicitud `PENDIENTE_ADMIN`                                                                                                                                                               |

> **Decisión implementación:** preferir **no crear** `OvertimeRequest` hasta `accumulatedMinutes > 30`; llevar acumulado intermedio en tabla auxiliar **solo si** producto exige visibilidad — si no, recalcular sumando exits del período en cada evento (documentar en PR).

### Integración `registerEvent`

```typescript
// attendance.service.ts — después de persistir EXIT
if (eventType === 'EXIT') {
  await this.overtimeDetectionService.onExitRegistered({ ... }).catch(err => this.logger.warn(...));
}
```

---

## Out of scope

- Aprobaciones (task 05).
- UI.
- Liquidación nómina.

---

## Files allowed

- `apps/api/src/overtime/service/overtime-detection.service.ts` — create
- `apps/api/src/overtime/test/overtime-detection.service.spec.ts` — create
- `apps/api/src/attendance/service/attendance.service.ts` — modify (solo hook)
- `apps/api/src/attendance/test/attendance.service.spec.ts` — modify (mock detection)

---

## Files forbidden

- `prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] EXIT antes o igual a `shiftEndTime` no suma minutos.
- [ ] 10 min aislados no crean solicitud.
- [ ] 31 min acumulados crean solicitud `PENDIENTE_ADMIN`.
- [ ] Fallo en detección no revierte la marcación.
- [ ] Tras `OBJETADA` en el período, nuevos EXIT tardíos no crean otra solicitud (D1b).
- [ ] Tests: límite exacto 30 vs 31 minutos.

---

## Validation commands

```bash
pnpm --filter=api test -- overtime-detection
pnpm --filter=api test -- attendance.service
```
