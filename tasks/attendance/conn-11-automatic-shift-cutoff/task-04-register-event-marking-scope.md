# CONN-11 Task 04 — registerEvent: markingScope ORDINARY / OVERTIME

**Domain:** `[BACKEND]` `[CONN-01]`  
**Status:** `pending`  
**Depends on:** [Task 03](./task-03-jornada-cutoff-service-and-scheduler.md)  
**Epic:** CONN-11

---

## Goal

Extender `AttendanceService.registerEvent()` (CONN-01 / OS-602) para distinguir marcación ordinaria de marcación de tiempo adicional post-corte, aplicando reglas de negocio CONN-11.

---

## Scope

### Extender `RegisterEventInput`

```typescript
export interface RegisterEventInput {
  // ... campos existentes
  markingScope?: AttendanceMarkingScope; // default ORDINARY
}
```

Propagar a:

- `mobile-attendance.resolver.ts` → `RegistrarMarcacionInput`
- `attendance-card.service.ts` → manual markings (siempre ORDINARY salvo corrección explícita)
- Futuro kiosko CONN-12

### Reglas en `registerEvent()`

Default `markingScope = ORDINARY` si omitido.

| eventType | markingScope | Estado jornada                         | Resultado                                  |
| --------- | ------------ | -------------------------------------- | ------------------------------------------ |
| ENTRY     | ORDINARY     | pre-corte, sin ENTRY abierta ordinaria | OK                                         |
| ENTRY     | ORDINARY     | post-corte (`JornadaCutoff` existe)    | `409` — jornada cerrada, use OVERTIME      |
| ENTRY     | ORDINARY     | ENTRY ordinaria ya abierta             | `409` — double entry                       |
| EXIT      | ORDINARY     | ENTRY ordinaria abierta, pre-corte     | OK — timestamp real persistido             |
| EXIT      | ORDINARY     | post-corte                             | `409` — jornada cerrada                    |
| ENTRY     | OVERTIME     | pre-corte (`isBeforeCutoff=true`)      | `409` — tiempo adicional no disponible aún |
| ENTRY     | OVERTIME     | post-corte, sin ENTRY OVERTIME abierta | OK                                         |
| EXIT      | OVERTIME     | ENTRY OVERTIME abierta                 | OK                                         |
| EXIT      | OVERTIME     | sin ENTRY OVERTIME                     | `400`                                      |

### Integración corte en tiempo real

Si empleado registra EXIT ordinaria **después** de `shiftEndTime` pero **antes** de que corra el job:

- **Opción acordada:** persistir EXIT con timestamp real, pero el **cálculo** (task 05) recorta a `shiftEndTime`; no genera HE.
- Alternativamente rechazar EXIT ordinaria post-`shiftEndTime` con mensaje "Jornada cerrada — registre tiempo adicional". Documentar decisión en PR.

> Preferir **persistir + recortar en cálculo** para no perder auditoría del intento del empleado.

### Hook overtime detection (preparación task 06)

Tras EXIT exitoso:

```typescript
if (log.markingScope === AttendanceMarkingScope.OVERTIME) {
  this.triggerOvertimeDetection({ ... });
}
// NO disparar para EXIT ordinario post-shiftEnd
```

---

## Out of scope

- UI app móvil para seleccionar OVERTIME
- Corte automático (task 03)
- Refactor cálculo tarjeta (task 05)

---

## Files allowed

- `apps/api/src/attendance/interfaces/attendance.interfaces.ts` — modify
- `apps/api/src/attendance/service/attendance.service.ts` — modify
- `apps/api/src/attendance/repository/attendance.repository.ts` — modify (findOpenEntry by scope)
- `apps/api/src/attendance/mobile/resolver/mobile-attendance.resolver.ts` — modify (campo markingScope)
- `apps/api/src/attendance/mobile/interfaces/mobile-attendance.interfaces.ts` — modify
- `apps/api/src/attendance/test/attendance.service.spec.ts` — modify
- `apps/api/src/attendance/test/unified-attendance.register-event.spec.ts` — modify

---

## Files forbidden

- `prisma/schema.prisma`
- `apps/web-app/**`
- `apps/api/src/overtime/**` (task 06)

---

## Acceptance criteria

- [ ] ENTRY ordinaria post-corte → 409 con mensaje claro
- [ ] ENTRY OVERTIME pre-corte → 409
- [ ] Par OVERTIME ENTRY→EXIT post-corte → persistido con `markingScope=OVERTIME`
- [ ] EXIT ordinaria post-shiftEnd persistida pero no dispara overtime detection
- [ ] GraphQL `registrarMarcacion` acepta `markingScope` opcional

---

## Validation

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern="register-event|attendance.service"
pnpm --filter=@restopsiq/api run typecheck
```
