# CONN-11 — Corte automático de jornada y marcación de tiempo adicional

**Domain:** `[BACKEND]` `[ATTENDANCE]` `[PAYROLL]`  
**Status:** `pending`  
**Created:** 2026-07-15  
**Jira:** `CONN-11` / _asignar OS-XXX_  
**Módulo NestJS:** `apps/api/src/attendance/` (corte + cálculo) + ajuste en `apps/api/src/overtime/`  
**Frontend:** fuera de alcance en este epic (solo cambios de contrato si aplica)

---

## Regla de negocio (confirmada en reunión)

> **No todo lo que se marca se paga.**

| Regla                          | Comportamiento                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Entrada anticipada             | Marcación **antes** del inicio del turno se registra (auditoría), pero **solo cuenta** el tiempo dentro de la jornada planificada |
| Corte automático               | Al llegar `shiftEndTime`, el sistema cierra la jornada ordinaria **aunque el empleado no haya marcado salida**                    |
| Tiempo post-corte              | Solo existe si hay **nueva marcación explícita** de tiempo adicional (re-marcación)                                               |
| Pago tiempo adicional          | El tiempo re-marcado solo se liquida si además pasa aprobación **CONN-04a / CONN-04b**                                            |
| Salida tardía sin re-marcación | **No genera** tiempo extra pagable (primer loop de seguridad)                                                                     |

---

## Impacto en tickets existentes

### CONN-04a (OS-605) — **requiere ajuste de diseño**

El epic original asumía detección por **salida tardía** (`actualEndTime > shiftEndTime`).

**Nuevo mecanismo primario:**

```
Corte automático (CONN-11) cierra jornada ordinaria en shiftEndTime
        ↓
Tiempo extra solo via marcaciones OVERTIME post-corte
        ↓
OvertimeDetectionService acumula minutos de pares OVERTIME (no de EXIT tardío ordinario)
        ↓
Umbral >30 min → solicitud CONN-04a/04b → cascada aprobación → liquidación
```

> Ver [task-06-overtime-detection-amendment.md](./task-06-overtime-detection-amendment.md) para cambios concretos en `OvertimeDetectionService`.

### CONN-01 (OS-602) — **requiere ajuste**

`AttendanceService.registerEvent()` debe distinguir:

- Marcación **ordinaria** (`markingScope=ORDINARY`) — jornada planificada
- Marcación de **tiempo adicional** (`markingScope=OVERTIME`) — post-corte, requiere aprobación

### Tablet compartida (CONN kiosko)

`JornadaCutoffService.isBeforeCutoff()` expuesto para regla pre/post corte en anulaciones (ver `shared-tablet-kiosk-mode`).

---

## Contexto en el codebase

| Área               | Estado actual                                                                  | Gap                                            |
| ------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------- |
| Cálculo horas      | `calculateDaySummary()` — suma ENTRY→EXIT crudo, overtime = total − 480 min    | No recorta a ventana del turno planificado     |
| Tarjeta OS-551     | `buildAttendanceCardDaySummaries()` — `workedMinutes` crudo vs `targetMinutes` | Entrada anticipada suma tiempo de más          |
| Corte automático   | No existe                                                                      | Sin job, sin `JornadaCutoff`, sin EXIT sistema |
| `registerEvent()`  | Un solo tipo de marcación                                                      | Sin `markingScope`, sin reglas post-corte      |
| CONN-04a detección | `onExitRegistered` compara EXIT vs `shiftEndTime`                              | Modelo incorrecto tras CONN-11                 |
| Scheduler          | `@nestjs/schedule` usado en vacations, supplier-docs                           | Reutilizable para job de corte                 |

---

## Objetivo

1. Recortar tiempo ordinario pagable a la ventana `[shiftStartTime, shiftEndTime]` del turno resuelto.
2. Ejecutar corte automático al fin de turno (EXIT sistema o registro de corte equivalente).
3. Permitir re-marcación explícita de tiempo adicional post-corte (`markingScope=OVERTIME`).
4. Ajustar CONN-04a para acumular solo minutos de marcaciones OVERTIME aprobadas.
5. Exponer `isBeforeCutoff()` para consumidores (kiosko, correcciones, nómina).

---

## ⭐ Puntos clave

### PC-1 — Ventana ordinaria = turno planificado

```
effectiveStart = max(entryTimestamp, shiftStartTime)
effectiveEnd   = min(exitTimestamp, shiftEndTime, cutoffTime?)
ordinaryMinutes = max(0, effectiveEnd - effectiveStart)
```

- Entrada 15 min antes del turno → `ordinaryMinutes` no incluye esos 15 min.
- La marcación ENTRY se persiste con timestamp real (auditoría).

### PC-2 — Corte automático autoritativo

Al `shiftEndTime`:

1. Si hay ENTRY ordinaria abierta → crear EXIT sistema en `shiftEndTime` **o** registrar `JornadaCutoff` + marcar jornada cerrada.
2. Idempotente: un solo corte ordinario por `(tenantId, employeeId, workDate)`.
3. El corte corre aunque el empleado siga físicamente en sede.

### PC-3 — Re-marcación OVERTIME obligatoria

Post-corte:

- `ENTRY` ordinaria → **rechazada** (`ConflictException`: jornada cerrada, use marcación de tiempo adicional).
- `ENTRY` con `markingScope=OVERTIME` → permitida (nuevo par post-corte).
- `EXIT` ordinaria con jornada ya cortada → **rechazada** o ignorada para cálculo (no genera HE).

### PC-4 — CONN-04a solo sobre OVERTIME

`OvertimeDetectionService.onExitRegistered()`:

- Solo procesa `EXIT` donde `markingScope=OVERTIME`.
- `excessMinutes` = duración del par OVERTIME (ENTRY→EXIT), no `actualEnd - shiftEnd`.
- Umbral >30 min se mantiene para crear solicitud.

### PC-5 — Salida tardía sin re-marcación = 0 HE pagable

Escenario: turno 08:00–17:00, empleado marca EXIT real a las 17:45 **sin** re-marcación OVERTIME.

- Corte a las 17:00 cierra jornada ordinaria.
- EXIT 17:45 ordinaria no abre ventana de pago adicional.
- **No** se crea `OvertimeRequest`.

---

## Modelo de datos (propuesto)

```prisma
enum AttendanceMarkingScope {
  ORDINARY  // jornada planificada (default)
  OVERTIME  // tiempo adicional post-corte — requiere aprobación CONN-04a/04b
}

enum JornadaCutoffType {
  AUTOMATIC  // job al shiftEndTime
  MANUAL     // corrección supervisor (fuera de alcance MVP)
}

model JornadaCutoff {
  id           String              @id @default(cuid())
  tenantId     String
  employeeId   String
  locationId   String
  workDate     DateTime            @db.Date
  shiftEndTime DateTime
  cutoffAt     DateTime            // instante real de ejecución (>= shiftEndTime)
  cutoffType   JornadaCutoffType   @default(AUTOMATIC)
  entryLogId   String?             // ENTRY ordinaria que se cerró
  exitLogId    String?             // EXIT sistema generado (si aplica)
  createdAt    DateTime            @default(now())

  employee EmployeeDetails @relation(fields: [employeeId], references: [id])
  location Location        @relation(fields: [locationId], references: [id])

  @@unique([tenantId, employeeId, workDate]) // un corte ordinario por jornada
  @@index([tenantId, workDate])
  @@index([tenantId, locationId, workDate])
  @@map("jornada_cutoffs")
}
```

Campos nuevos en `AttendanceLog`:

```prisma
markingScope AttendanceMarkingScope @default(ORDINARY)
```

Opcional — EXIT sistema del corte:

```prisma
enum AttendanceLogSource {
  DEVICE
  APP_MOVIL
  MANUAL
  SYSTEM   // corte automático CONN-11
}
```

> Preferir `source=SYSTEM` + `markingScope=ORDINARY` para EXIT de corte (trazabilidad clara en tarjeta).

---

## Decisiones de diseño

### D1 — Job de corte: cron cada minuto ✅

Patrón existente: `@Cron` en `@nestjs/schedule` (ver `vacation-accrual.scheduler.ts`).

```typescript
@Cron('* * * * *', { timeZone: 'America/Bogota' })
async runShiftCutoffs(): Promise<void> { ... }
```

Por cada tenant activo:

1. Buscar empleados con ENTRY ordinaria abierta cuyo `shiftEndTime` ≤ now.
2. Resolver turno del día (`ShiftResolutionService`).
3. Ejecutar corte idempotente.

Alternativa futura: BullMQ delayed jobs por turno (fuera de MVP).

### D2 — EXIT sistema vs solo registro JornadaCutoff ✅

**Decisión:** crear **ambos**:

- `JornadaCutoff` — fuente de verdad para "¿jornada cerrada?"
- `AttendanceLog` EXIT `source=SYSTEM` en `shiftEndTime` — visible en tarjeta y compatible con pares ENTRY→EXIT

`createdByUserId = null`. Nota en log: `"Corte automático de jornada (CONN-11)"`.

### D3 — Cálculo de minutos ordinarios ✅

Centralizar en util nuevo `computeOrdinaryWorkedMinutes()`:

- Input: logs del día + turno resuelto + `JornadaCutoff?`
- Output: `{ ordinaryMinutes, overtimeScopeMinutes, pairs }`
- Reemplazar uso de `calculateDaySummary()` crudo en tarjeta, panel, reportes nómina (task 05).

### D4 — Entrada anticipada ✅

No rechazar ENTRY antes de `shiftStartTime`. Solo recortar en cálculo.

Tolerancia de llegada tarde (`LATE_ARRIVAL_TOLERANCE_MINUTES`) **no cambia** — es indicador operativo, no regla de pago.

### D5 — API / GraphQL para re-marcación OVERTIME ✅

Extender inputs existentes:

```typescript
// RegistrarMarcacionInput / RegisterEventInput
markingScope?: AttendanceMarkingScope; // default ORDINARY
```

Validación en `registerEvent()`:

| markingScope | Condición                                               | Resultado                                     |
| ------------ | ------------------------------------------------------- | --------------------------------------------- |
| ORDINARY     | post-corte                                              | 409 Conflict                                  |
| OVERTIME     | pre-corte                                               | 409 Conflict (aún no aplica tiempo adicional) |
| OVERTIME     | post-corte, sin ENTRY OVERTIME abierta + eventType=EXIT | 400 Bad Request                               |
| OVERTIME     | post-corte, ENTRY                                       | OK — abre par adicional                       |

### D6 — `isBeforeCutoff()` ✅

```typescript
interface IJornadaCutoffService {
  isBeforeCutoff(tenantId: string, employeeId: string, workDate: Date): Promise<boolean>;
  getCutoff(tenantId: string, employeeId: string, workDate: Date): Promise<JornadaCutoff | null>;
}
```

- `true` si no existe `JornadaCutoff` para esa jornada **o** `now < shiftEndTime` (jornada en curso).
- Consumidores: kiosko anulación, tarjeta correcciones, NOM-14 redirect.

### D7 — Migración CONN-04a sin romper datos históricos ✅

- Logs existentes sin `markingScope` → backfill `ORDINARY`.
- Solicitudes `OvertimeRequest` creadas bajo modelo antiguo: **no recalcular** retroactivamente en MVP.
- Nuevo código aplica reglas CONN-11 solo a marcaciones post-deploy.

---

## Criterios de aceptación (épica)

- [ ] Entrada 15 min antes del turno: marcación registrada, **0 min** ordinarios de anticipación
- [ ] Al `shiftEndTime` el sistema corta jornada aunque no haya EXIT del empleado
- [ ] Tiempo post-corte solo existe con marcación `OVERTIME` explícita
- [ ] Salida ordinaria tardía sin re-marcación OVERTIME **no** genera tiempo extra pagable
- [ ] Tiempo OVERTIME re-marcado sigue flujo CONN-04a/04b antes de liquidarse
- [ ] Tests: salida tarde sin re-marcación (no HE), re-marcación aprobada (sí paga), re-marcación sin aprobación (no paga)

---

## Subtareas (SDD)

| #   | Archivo                                                                                              | Descripción                                                 |
| --- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 01  | [task-01-schema-migration.md](./task-01-schema-migration.md)                                         | Enums, `JornadaCutoff`, `markingScope`, `source=SYSTEM`     |
| 02  | [task-02-shift-window-utils.md](./task-02-shift-window-utils.md)                                     | `computeShiftStartDateTime`, `computeOrdinaryWorkedMinutes` |
| 03  | [task-03-jornada-cutoff-service-and-scheduler.md](./task-03-jornada-cutoff-service-and-scheduler.md) | Corte automático + cron job                                 |
| 04  | [task-04-register-event-marking-scope.md](./task-04-register-event-marking-scope.md)                 | Reglas ORDINARY/OVERTIME en `registerEvent()`               |
| 05  | [task-05-payable-time-consumers.md](./task-05-payable-time-consumers.md)                             | Tarjeta, panel, resúmenes usan ventana planificada          |
| 06  | [task-06-overtime-detection-amendment.md](./task-06-overtime-detection-amendment.md)                 | Ajuste CONN-04a → solo pares OVERTIME                       |
| 07  | [task-07-tests-validation.md](./task-07-tests-validation.md)                                         | Tests de aceptación + validación final                      |

**Orden:**

```
01 → 02 → 03 → 04 → 05 → 06 → 07
```

---

## Fuera de alcance

- UI de re-marcación OVERTIME (otro repo / CONN-01 app)
- Corte manual por supervisor (`JornadaCutoffType.MANUAL`)
- Recálculo retroactivo de `OvertimeRequest` pre-CONN-11
- CONN-04b (`SOLICITUD_ADMINISTRATIVA`) — solo compatibilidad de modelo
- Notificaciones al empleado de "jornada cortada"

---

## Dependencias

```
CONN-03 (ShiftResolutionService) ──┐
ASIS-UNI (AttendanceLog)           ──┼──► CONN-11 ──► ajuste CONN-04a
CONN-01 (registerEvent)            ──┘
         ↓
shared-tablet-kiosk-mode (isBeforeCutoff)
NOM-07 / OS-586 (liquidación HE aprobada)
```

- **Depende de:** CONN-03, ASIS-UNI, CONN-01
- **Bloquea ajuste de:** CONN-04a task-04 (amendment), kiosko correcciones pre/post corte
- **Relacionado:** OS-551 (tarjeta), OS-548 (panel), OS-586 (motor legal HE)
