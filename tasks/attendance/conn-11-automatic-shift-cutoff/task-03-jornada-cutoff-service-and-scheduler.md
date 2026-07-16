# CONN-11 Task 03 — JornadaCutoffService + scheduler de corte automático

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 01](./task-01-schema-migration.md), [Task 02](./task-02-shift-window-utils.md), CONN-03  
**Epic:** CONN-11

---

## Goal

Implementar el corte automático de jornada al llegar `shiftEndTime`, cerrando pares ENTRY ordinarios abiertos aunque el empleado no haya marcado salida.

---

## Scope

### Estructura

```
apps/api/src/attendance/
  service/
    jornada-cutoff.service.ts
  repository/
    jornada-cutoff.repository.ts
  jobs/
    jornada-cutoff.scheduler.ts
  interfaces/
    jornada-cutoff.interfaces.ts   (o extender attendance.interfaces.ts)
  test/
    jornada-cutoff.service.spec.ts
    jornada-cutoff.scheduler.spec.ts
```

### `JornadaCutoffService`

```typescript
interface IJornadaCutoffService {
  /** Ejecuta corte para un empleado/jornada si shiftEndTime <= now y no existe corte previo. */
  executeCutoffIfDue(params: CutoffCandidate): Promise<JornadaCutoff | null>;

  /** Busca candidatos con ENTRY ordinaria abierta cuyo turno ya terminó. */
  findDueCutoffCandidates(tenantId: string, asOf: Date): Promise<CutoffCandidate[]>;

  /** API pública para consumidores (kiosko, correcciones). */
  isBeforeCutoff(tenantId: string, employeeId: string, workDate: Date): Promise<boolean>;

  getCutoff(tenantId: string, employeeId: string, workDate: Date): Promise<JornadaCutoff | null>;
}
```

### Algoritmo `executeCutoffIfDue`

1. Resolver turno del día (`ShiftResolutionService.resolveForDay`).
2. Si `kind !== 'ASSIGNED'` → skip.
3. Calcular `shiftEndTime = computeShiftEndDateTime(workDate, horaInicio, horaFin)`.
4. Si `asOf < shiftEndTime` → skip.
5. Si ya existe `JornadaCutoff` para `(tenantId, employeeId, workDate)` → skip (idempotente).
6. Buscar ENTRY ordinaria abierta (`markingScope=ORDINARY`, sin EXIT pareja).
7. Crear `AttendanceLog` EXIT:
   - `source=SYSTEM`
   - `markingScope=ORDINARY`
   - `timestamp=shiftEndTime`
   - `notes="Corte automático de jornada (CONN-11)"`
8. Crear registro `JornadaCutoff` con `entryLogId`, `exitLogId`, `cutoffType=AUTOMATIC`.
9. Log + audit opcional (`AuditService.log` CREATE).

### Scheduler

```typescript
@Injectable()
export class JornadaCutoffScheduler {
  @Cron('* * * * *', { timeZone: 'America/Bogota' })
  async handleCron(): Promise<void> {
    // Por cada tenant activo (patrón vacations scheduler)
    // findDueCutoffCandidates → executeCutoffIfDue
    // try/catch por candidato — un fallo no detiene el batch
  }
}
```

Registrar `ScheduleModule.forRoot()` en `AttendanceModule` (o módulo padre) si no está importado.

### Candidatos a corte

Query repository:

- Empleados con `AttendanceLog` ENTRY `markingScope=ORDINARY` sin EXIT pareada del mismo scope/workDate
- JOIN resolución de turno — filtrar donde `shiftEndTime <= now`
- Excluir empleados que ya tienen `JornadaCutoff` del día

---

## Out of scope

- Corte manual (`JornadaCutoffType.MANUAL`)
- Notificaciones push al empleado
- GraphQL exposure (solo service interno + REST admin opcional)

---

## Files allowed

- `apps/api/src/attendance/service/jornada-cutoff.service.ts` — create
- `apps/api/src/attendance/repository/jornada-cutoff.repository.ts` — create
- `apps/api/src/attendance/jobs/jornada-cutoff.scheduler.ts` — create
- `apps/api/src/attendance/interfaces/jornada-cutoff.interfaces.ts` — create
- `apps/api/src/attendance/attendance.module.ts` — modify (providers + ScheduleModule)
- `apps/api/src/attendance/repository/attendance.repository.ts` — modify (queries open ordinary entry)
- `apps/api/src/attendance/test/jornada-cutoff.*.spec.ts` — create

---

## Files forbidden

- `prisma/schema.prisma` (task 01)
- `apps/web-app/**`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [ ] Empleado con ENTRY 08:00, turno hasta 17:00, sin EXIT → a las 17:00+ job crea EXIT SYSTEM y `JornadaCutoff`
- [ ] Segunda ejecución del job no duplica corte (idempotente)
- [ ] `isBeforeCutoff()` retorna `false` tras corte; `true` antes de `shiftEndTime`
- [ ] Empleado sin turno resuelto → no se corta
- [ ] Fallo en un candidato no aborta el batch completo

---

## Validation

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=jornada-cutoff
pnpm --filter=@restopsiq/api run typecheck
node scripts/validate-structure.js
```
