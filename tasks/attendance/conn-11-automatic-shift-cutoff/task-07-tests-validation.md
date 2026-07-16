# CONN-11 Task 07 — Tests de aceptación y validación final

**Domain:** `[BACKEND]` `[TEST]`  
**Status:** `pending`  
**Depends on:** Tasks 01–06  
**Epic:** CONN-11

---

## Goal

Validar end-to-end las reglas CONN-11 y su integración con CONN-04a, cubriendo todos los criterios de aceptación del epic.

---

## Scope

### Suite de tests

| Archivo                                   | Escenarios                                 |
| ----------------------------------------- | ------------------------------------------ |
| `shift-window.util.spec.ts`               | Recorte anticipado, tardío, OVERTIME scope |
| `jornada-cutoff.service.spec.ts`          | Corte idempotente, sin turno, EXIT SYSTEM  |
| `jornada-cutoff.scheduler.spec.ts`        | Batch, aislamiento de errores              |
| `attendance.service.spec.ts`              | markingScope rules, post-corte reject      |
| `overtime-detection.service.spec.ts`      | Solo OVERTIME, umbral 30, no EXIT tardío   |
| `conn-11.integration.spec.ts` (nuevo e2e) | Flujos completos abajo                     |

### Escenarios e2e obligatorios (criterios de aceptación)

#### E1 — Entrada anticipada no paga anticipación

```
Turno 08:00–17:00 (540 min target)
ENTRY 07:45 ORDINARY → EXIT 17:00 ORDINARY
Expect: ordinaryMinutes = 540, clippedEarlyMinutes = 15
```

#### E2 — Corte automático sin salida del empleado

```
ENTRY 08:00 ORDINARY, turno hasta 17:00, empleado no marca salida
Job corre a las 17:01
Expect: JornadaCutoff exists, EXIT SYSTEM at 17:00, isBeforeCutoff = false
```

#### E3 — Salida tardía sin re-marcación → no HE

```
ENTRY 08:00, EXIT 17:45 ORDINARY (post shiftEnd, pre/post job según setup)
Expect: overtimeScopeMinutes = 0, no OvertimeRequest
```

#### E4 — Re-marcación OVERTIME genera acumulado

```
Tras corte: ENTRY 17:05 OVERTIME → EXIT 18:00 OVERTIME
Expect: 55 min en acumulado OVERTIME
```

#### E5 — Re-marcación con aprobación → elegible para liquidación

```
Acumulado OVERTIME > 30 → solicitud → cascada APROBADA
Expect: minutos disponibles para NOM-07 (mock ReportsService)
```

#### E6 — Re-marcación sin aprobación → no se paga

```
Acumulado OVERTIME > 30 → solicitud PENDIENTE_ADMIN
Expect: liquidación excluye minutos (integración mock CONN-04a-07)
```

#### E7 — isBeforeCutoff para consumidores

```
Pre shiftEnd → true
Post JornadaCutoff → false
Usado por test mock de anulación kiosko (referencia cruzada)
```

### Postman (opcional)

Carpeta `CONN-11 Jornada Cutoff` con:

- Trigger manual de corte (endpoint debug solo dev, si se expone)
- GET summary día con minutos recortados

---

## Out of scope

- Tests frontend
- Tests de carga del cron
- Tests CONN-04b

---

## Files allowed

- `apps/api/src/attendance/test/**`
- `apps/api/src/overtime/test/**`
- `apps/api/test/conn-11.integration.spec.ts` — create (si patrón e2e existe)
- `postman/restopsiq-api.collection.json` — modify (opcional)

---

## Files forbidden

- `prisma/schema.prisma`
- `apps/web-app/**`
- Lógica de producción (solo tests)

---

## Acceptance criteria

- [ ] Todos los escenarios E1–E7 pasan
- [ ] `pnpm --filter=@restopsiq/api test` verde
- [ ] `pnpm --filter=@restopsiq/api run typecheck` verde
- [ ] `node scripts/validate-structure.js` verde
- [ ] Cobertura `jornada-cutoff.service.ts` y `shift-window.util.ts` ≥ 80%

---

## Validation

```bash
pnpm --filter=@restopsiq/api run typecheck
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern="conn-11|jornada-cutoff|shift-window|overtime-detection"
pnpm --filter=@restopsiq/api test -- --coverage --collectCoverageFrom='src/attendance/**/jornada-cutoff*.ts' --collectCoverageFrom='src/attendance/utils/shift-window.util.ts'
```

---

## Reporte final (formato SDD)

Al completar, reportar:

1. Files changed
2. Por qué cada archivo pertenece a CONN-11
3. Confirmar no se tocaron archivos forbidden
4. Resultados validation commands
5. Desviaciones conocidas (ej. CONN-12 same-day no aplica aquí)
