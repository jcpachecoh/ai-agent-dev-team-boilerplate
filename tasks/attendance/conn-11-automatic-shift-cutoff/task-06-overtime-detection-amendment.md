# CONN-11 Task 06 — Amendment CONN-04a: detección solo sobre pares OVERTIME

**Domain:** `[BACKEND]` `[OVERTIME]`  
**Status:** `pending`  
**Depends on:** [Task 04](./task-04-register-event-marking-scope.md)  
**Epic:** CONN-11  
**Afecta:** [CONN-04a Task 04](../conn-04a-overtime-detection/task-04-detection-service.md)

---

## Goal

Ajustar `OvertimeDetectionService` para que el mecanismo primario de detección sea tiempo **re-marcado** post-corte (`markingScope=OVERTIME`), no salidas ordinarias tardías.

---

## Contexto del cambio

### Modelo anterior (CONN-04a original)

```
EXIT ordinario con actualEndTime > shiftEndTime
  → excessMinutes = actualEnd - shiftEnd
  → acumular en período
  → si > 30 min → OvertimeRequest
```

### Modelo nuevo (CONN-11 + CONN-04a)

```
Corte automático cierra jornada ordinaria en shiftEndTime
  → EXIT ordinario tardío NO genera excess
  → Empleado re-marca ENTRY/EXIT OVERTIME
  → excessMinutes = duración par OVERTIME
  → si acumulado OVERTIME > 30 min → OvertimeRequest
  → cascada aprobación CONN-04a/04b sin cambios
```

---

## Scope

### Cambios en `OvertimeDetectionService`

1. **`onExitRegistered`** — solo invocado para `markingScope=OVERTIME` (garantizado por task 04).

2. **`recalculatePeriodExcess`** — reemplazar loop de EXIT ordinarios tardíos:

```typescript
// Antes: todos los EXIT del período vs shiftEndTime
// Después: pares OVERTIME completos del período

for (const pair of overtimePairs) {
  const durationMinutes = floor((pair.exit.timestamp - pair.entry.timestamp) / 60000);
  totalMinutes += durationMinutes;
}
```

3. Eliminar dependencia de `computeExcessMinutes(actualEnd, shiftEnd)` para detección automática.

4. Mantener:
   - Umbral 30 minutos
   - `payrollPeriod` YYYY-MM
   - Skip si `OBJETADA` / `APROBADA` en período
   - Notificaciones cascada

### Cambios en hook `attendance.service.ts`

Confirmar que `triggerOvertimeDetection` solo se llama para EXIT con `markingScope=OVERTIME`.

### Actualizar epic CONN-04a

Añadir nota en `conn-04a-overtime-detection/00-epic-and-decisions.md`:

- PC-2 superseded by CONN-11
- D2 reemplazado: excess = duración par OVERTIME
- D3 hook: solo EXIT OVERTIME

_(Solo documentación — no implementar en esta task salvo 1 párrafo en PR)_

### Tests a reescribir

| Test anterior                           | Test nuevo                               |
| --------------------------------------- | ---------------------------------------- |
| EXIT 17:10, turno hasta 17:00 → +10 min | EXIT ordinario 17:10 → 0 min detectados  |
| EXIT 17:45 sin re-marcación → acumula   | 0 min — no solicitud                     |
| —                                       | OVERTIME 17:05–18:00 → 55 min acumulados |
| Acumulado 31 min OVERTIME → solicitud   | Igual umbral, nueva fuente               |

---

## Out of scope

- CONN-04b solicitud administrativa
- Liquidación nómina (task 07 CONN-04a)
- UI bandeja aprobación

---

## Files allowed

- `apps/api/src/overtime/service/overtime-detection.service.ts` — modify
- `apps/api/src/overtime/test/overtime-detection.service.spec.ts` — modify
- `apps/api/src/overtime/interfaces/overtime.interfaces.ts` — modify si aplica
- `apps/api/src/overtime/repository/overtime.repository.ts` — modify (query pares OVERTIME)
- `apps/api/src/attendance/service/attendance.service.ts` — modify (confirm hook scope)
- `tasks/attendance/conn-04a-overtime-detection/00-epic-and-decisions.md` — modify (nota amendment)

---

## Files forbidden

- `prisma/schema.prisma`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] EXIT ordinario post-shiftEnd **no** incrementa acumulado
- [ ] Par OVERTIME 55 min → acumulado 55 (si no hay otros pares)
- [ ] Acumulado OVERTIME 31 min en período → crea `OvertimeRequest PENDIENTE_ADMIN`
- [ ] Acumulado OVERTIME 30 min → no crea solicitud
- [ ] Cascada aprobación CONN-04a sin cambios de comportamiento
- [ ] Tests CONN-04a actualizados y verdes

---

## Validation

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=overtime-detection
pnpm --filter=@restopsiq/api run typecheck
```
